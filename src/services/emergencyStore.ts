import { 
  Incident, 
  Alert, 
  SafeZone, 
  CitizenLocation, 
  AdaptiveRoute, 
  HazardArea,
  Habitation,
  RelocationRoute,
  ProblemAnalysisReport,
  EmergencyResponseSupportData,
  WeatherData
} from '../types';
import { DEMO_INCIDENTS } from '../data/demoIncidents';
import { DEMO_ALERTS } from '../data/demoAlerts';
import { DEMO_SAFE_ZONES } from '../data/demoSafeZones';
import { DEMO_HAZARDS } from '../data/demoHazards';
import { DEMO_HABITATIONS } from '../data/demoHabitations';
import { DEMO_ROUTES } from '../data/demoRoutes';
import { IMAGES } from '../data/assets';
import { safeRouteEngine, WhatIfScenario, RouteCalculationResult, haversineDistanceKm } from './safeRouteEngine';
import { db, emitRealtimeEvent, subscribeToTable } from './supabaseClient';
import { 
  resolveLocationDataset, 
  fetchLiveWeatherForLocation, 
  calculateHaversineKm, 
  LocationDataset 
} from './locationIntelligence';

export interface CitizenRescueRequest {
  id: string;
  userId?: string;
  requesterName: string;
  contactPhone: string;
  locationName: string;
  coordinates: [number, number];
  peopleCount: {
    adults: number;
    children: number;
    elderlyOrSpecialCare: number;
  };
  urgency: 'CRITICAL_IMMEDIATE' | 'HIGH_TRAPPED' | 'PRECAUTIONARY';
  emergencyType?: 'Medical' | 'Rescue' | 'Evacuation' | 'Other';
  message: string;
  imageUrl?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'RESPONSE_DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESCUED';
  assignedTeam?: string;
  estimatedArrivalMinutes?: number;
}

export interface ToastAlert {
  id: string;
  type: 'INCIDENT' | 'RESCUE' | 'ALERT' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface CitizenSettings {
  emergencyVibration: boolean;
  soundAlerts: boolean;
  pushNotifications: boolean;
  primaryEmergencyNumber: string;
  homeSector: string;
  locationPermissionGranted: boolean;
  language: string;
}

const STORAGE_KEY_INCIDENTS = 'resqzone_store_incidents_v3';
const STORAGE_KEY_RESCUE = 'resqzone_store_rescue_v3';
const STORAGE_KEY_ALERTS = 'resqzone_store_alerts_v3';
const STORAGE_KEY_CITIZEN_SETTINGS = 'resqzone_store_citizen_settings_v3';
const STORAGE_KEY_LOCATION = 'resqzone_store_location_v3';

class EmergencyStore {
  private incidents: Incident[] = [];
  private rescueRequests: CitizenRescueRequest[] = [];
  private alerts: Alert[] = [];
  private toastNotifications: ToastAlert[] = [];
  private citizenSettings: CitizenSettings = {
    emergencyVibration: true,
    soundAlerts: true,
    pushNotifications: true,
    primaryEmergencyNumber: '112',
    homeSector: 'Siliguri Municipal Ward 12, Darjeeling, West Bengal',
    locationPermissionGranted: true,
    language: 'English',
  };
  
  // Dynamic default location (Siliguri - matches image prompt, easily changed by user)
  private currentLocation: CitizenLocation | null = {
    id: 'LOC-SILIGURI',
    name: 'Siliguri',
    district: 'Darjeeling',
    state: 'West Bengal',
    coordinates: [26.7165, 88.3915],
    riskLevel: 'HIGH',
    hazardNotice: 'High flood risk detected along Mahananda & Teesta river basin (Water level +14%).',
    zoom: 13,
  };

  private currentRadiusKm: number = 50;
  private currentDataset!: LocationDataset;
  private selectedSafeZone: SafeZone | null = null;
  private activeRoute: AdaptiveRoute | null = null;
  private activeScenario: WhatIfScenario = 'NONE';
  private routeDisruptionMessage: string | null = null;
  private isRecalculatingRoute: boolean = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // Restore saved location if user previously selected one
      const storedLoc = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (storedLoc) {
        if (storedLoc === 'null') {
          this.currentLocation = null;
        } else {
          this.currentLocation = JSON.parse(storedLoc);
        }
      }

      if (this.currentLocation) {
        this.currentDataset = resolveLocationDataset(this.currentLocation);
      } else {
        this.currentDataset = resolveLocationDataset({
          id: 'LOC-HALDIA',
          name: 'Haldia',
          district: 'Purba Medinipur',
          state: 'West Bengal',
          coordinates: [22.0667, 88.0698],
          riskLevel: 'HIGH',
          hazardNotice: 'High tidal surge & coastal estuarine inundation advisory.',
          zoom: 13,
        });
      }

      const storedInc = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (storedInc) {
        this.incidents = JSON.parse(storedInc);
      } else {
        this.incidents = [...DEMO_INCIDENTS];
      }

      const storedRescue = localStorage.getItem(STORAGE_KEY_RESCUE);
      if (storedRescue) {
        this.rescueRequests = JSON.parse(storedRescue);
      } else {
        this.rescueRequests = [
          {
            id: 'RQ-1042',
            requesterName: 'Citizen Resident',
            contactPhone: '+91 98450 12091',
            locationName: 'Riverside Settlement, Sector 4',
            coordinates: [26.7210, 88.4010],
            peopleCount: { adults: 2, children: 1, elderlyOrSpecialCare: 1 },
            urgency: 'HIGH_TRAPPED',
            emergencyType: 'Rescue',
            message: 'Rising water level cutting off access lane. Elderly family member requires wheelchair evacuation support.',
            submittedAt: '12 min ago',
            status: 'RESPONSE_DISPATCHED',
            assignedTeam: 'SDRF Quick Response Unit 3',
            estimatedArrivalMinutes: 14,
          }
        ];
      }

      const storedAlerts = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
      } else {
        this.alerts = [...DEMO_ALERTS];
      }

      const storedSettings = localStorage.getItem(STORAGE_KEY_CITIZEN_SETTINGS);
      if (storedSettings) {
        this.citizenSettings = { ...this.citizenSettings, ...JSON.parse(storedSettings) };
      }

      // Pre-compute initial active route so getters never trigger notifications during render
      if (this.currentLocation) {
        const initialRouteResult = safeRouteEngine.evaluateRoute(
          this.currentLocation.coordinates,
          this.currentLocation.name,
          this.activeScenario
        );
        this.activeRoute = initialRouteResult.route;
      } else {
        this.activeRoute = null;
      }
    } catch {
      this.incidents = [...DEMO_INCIDENTS];
      this.alerts = [...DEMO_ALERTS];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(this.incidents));
      localStorage.setItem(STORAGE_KEY_RESCUE, JSON.stringify(this.rescueRequests));
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_KEY_CITIZEN_SETTINGS, JSON.stringify(this.citizenSettings));
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(this.currentLocation));
    } catch {
      // safe fallback
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    // Schedule notification in microtask to prevent "Cannot update a component while rendering a different component"
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        this.listeners.forEach(l => {
          try {
            l();
          } catch (err) {
            console.error('Error in emergencyStore listener:', err);
          }
        });
      });
    } else {
      setTimeout(() => {
        this.listeners.forEach(l => {
          try {
            l();
          } catch (err) {
            console.error('Error in emergencyStore listener:', err);
          }
        });
      }, 0);
    }
  }

  // --- TOAST / NOTIFICATIONS ---
  public getToastNotifications(): ToastAlert[] {
    return [...this.toastNotifications];
  }

  public addToastNotification(toast: Omit<ToastAlert, 'id' | 'timestamp'>) {
    const newToast: ToastAlert = {
      ...toast,
      id: `TST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.toastNotifications = [newToast, ...this.toastNotifications.slice(0, 4)];
    this.notify();

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      this.dismissToast(newToast.id);
    }, 7000);
  }

  public dismissToast(id: string) {
    this.toastNotifications = this.toastNotifications.filter(t => t.id !== id);
    this.notify();
  }

  // --- INCIDENT METHODS ---
  public getIncidents(): Incident[] {
    return [...this.incidents];
  }

  public getCitizenReports(reporterEmailOrName?: string): Incident[] {
    if (!reporterEmailOrName) {
      return this.incidents.filter(inc => inc.id.startsWith('CIT-') || inc.id.startsWith('INC-'));
    }
    const term = reporterEmailOrName.toLowerCase();
    return this.incidents.filter(inc => 
      inc.reporterName.toLowerCase().includes(term) || 
      (inc.reporterPhone && inc.reporterPhone.includes(term))
    );
  }

  public addCitizenReport(report: {
    title: string;
    type: Incident['type'];
    location: string;
    description: string;
    severity: Incident['severity'];
    imageUrl?: string;
    coordinates?: [number, number];
    reporterName?: string;
    reporterPhone?: string;
    peopleAffected?: number;
  }): Incident {
    const randomIdNumber = Math.floor(1000 + Math.random() * 9000);
    const newIncident: Incident = {
      id: `CIT-${randomIdNumber}`,
      title: report.title,
      type: report.type,
      location: report.location,
      district: this.currentLocation ? (this.currentLocation.district || 'Local District') : 'Local District',
      state: this.currentLocation ? (this.currentLocation.state || 'Local State') : 'Local State',
      reportedTime: 'Just now',
      severity: report.severity,
      status: 'NEW',
      reporterName: report.reporterName || 'Citizen Reporter',
      reporterPhone: report.reporterPhone || '+91 98450 12091',
      citizenReportText: report.description,
      imageUrl: report.imageUrl || IMAGES.mountainLandslide,
      coordinates: report.coordinates || (this.currentLocation ? this.currentLocation.coordinates : [20.5937, 78.9629]),
    };

    this.incidents = [newIncident, ...this.incidents];
    this.persist();

    // Save to database layer
    db.insertCitizenReport({
      id: newIncident.id,
      title: newIncident.title,
      type: newIncident.type,
      location: newIncident.location,
      severity: newIncident.severity,
      reporter_name: newIncident.reporterName,
      reporter_phone: newIncident.reporterPhone,
      description: newIncident.citizenReportText,
      image_url: newIncident.imageUrl,
      coordinates: newIncident.coordinates,
      status: 'NEW',
    });

    // Realtime notification to Authority
    this.addToastNotification({
      type: 'INCIDENT',
      title: `🚨 New Disaster Report #${newIncident.id}`,
      message: `${newIncident.reporterName} reported ${newIncident.type} at ${newIncident.location}.`,
      severity: 'CRITICAL',
    });

    emitRealtimeEvent('citizen_reports', 'INSERT', newIncident);
    return newIncident;
  }

  public updateIncidentStatus(
    id: string, 
    status: Incident['status'], 
    verifiedBy?: string, 
    internalNotes?: string
  ) {
    this.incidents = this.incidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          verifiedBy: verifiedBy || inc.verifiedBy,
          ...(internalNotes ? { internalNotes } : {})
        } as Incident & { internalNotes?: string };
      }
      return inc;
    });
    this.persist();

    db.updateReportStatus(id, status, internalNotes);

    this.addToastNotification({
      type: 'SYSTEM',
      title: `Incident #${id} Updated`,
      message: `Status transitioned to ${status}${verifiedBy ? ` by ${verifiedBy}` : ''}.`,
      severity: 'INFO',
    });
  }

  // --- RESCUE REQUEST METHODS ---
  public getRescueRequests(): CitizenRescueRequest[] {
    return [...this.rescueRequests];
  }

  public createRescueRequest(data: Omit<CitizenRescueRequest, 'id' | 'submittedAt' | 'status'>): CitizenRescueRequest {
    const id = `RQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: CitizenRescueRequest = {
      ...data,
      id,
      submittedAt: 'Just now',
      status: 'RESPONSE_DISPATCHED',
      assignedTeam: 'SDRF Quick Response Unit 1',
      estimatedArrivalMinutes: 18,
    };

    this.rescueRequests = [newRequest, ...this.rescueRequests];
    this.persist();

    // Persist to database layer
    db.insertRescueRequest(newRequest);

    this.addToastNotification({
      type: 'RESCUE',
      title: `🆘 SOS Rescue Request #${id}`,
      message: `${newRequest.requesterName} requested immediate assistance at ${newRequest.locationName}.`,
      severity: 'CRITICAL',
    });

    emitRealtimeEvent('rescue_requests', 'INSERT', newRequest);
    return newRequest;
  }

  public updateRescueRequestStatus(id: string, status: CitizenRescueRequest['status'], team?: string, eta?: number) {
    this.rescueRequests = this.rescueRequests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          ...(team ? { assignedTeam: team } : {}),
          ...(eta !== undefined ? { estimatedArrivalMinutes: eta } : {}),
        };
      }
      return r;
    });
    this.persist();

    db.updateRescueRequest(id, {
      status,
      ...(team ? { assignedTeam: team } : {}),
      ...(eta !== undefined ? { estimatedArrivalMinutes: eta } : {}),
    });

    this.addToastNotification({
      type: 'RESCUE',
      title: `Rescue #${id} Dispatched`,
      message: `Status updated to ${status}. Team: ${team || 'First Responders'}.`,
      severity: 'INFO',
    });
  }

  // --- ALERT METHODS ---
  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'active'>): Alert {
    const newAlert: Alert = {
      ...alertData,
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      active: true,
    };
    this.alerts = [newAlert, ...this.alerts];
    this.persist();

    this.addToastNotification({
      type: 'ALERT',
      title: `⚠️ Emergency Alert: ${newAlert.title}`,
      message: newAlert.description,
      severity: newAlert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    });

    return newAlert;
  }

  public disableAlert(id: string) {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, active: false } : a);
    this.persist();
  }

  public setAlertActive(id: string, active: boolean) {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, active } : a);
    this.persist();
  }

  public toggleAlertActive(id: string) {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, active: !a.active } : a);
    this.persist();
  }

  // --- CITIZEN LOCATION & ADAPTIVE ROUTE METHODS ---
  public getCurrentLocation(): CitizenLocation | null {
    return this.currentLocation ? { ...this.currentLocation } : null;
  }

  public hasLocation(): boolean {
    return this.currentLocation !== null;
  }

  public setCurrentLocation(location: CitizenLocation | null) {
    if (!location || !location.coordinates || isNaN(location.coordinates[0]) || isNaN(location.coordinates[1])) {
      this.currentLocation = {
        id: 'LOC-DEFAULT',
        name: 'Haldia',
        district: 'Purba Medinipur',
        state: 'West Bengal',
        coordinates: [22.0667, 88.0698],
        riskLevel: 'HIGH',
        hazardNotice: 'Default location restored due to invalid coordinates.',
        zoom: 13,
      };
    } else {
      this.currentLocation = { ...location };
    }
    this.citizenSettings.homeSector = `${this.currentLocation.name}, ${this.currentLocation.district || ''}, ${this.currentLocation.state || ''}`;
    
    // Resolve dynamic datasets, habitations, hazards, safe zones, and problems for this location
    this.currentDataset = resolveLocationDataset(this.currentLocation);

    // Auto-select nearest safe zone for this location
    const nearby = this.getSafeZones(60);
    this.selectedSafeZone = nearby.length > 0 ? nearby[0] : null;

    // Recalculate adaptive route for the new location without intermediate notify
    this.calculateRouteForCurrentLocation(this.activeScenario, false, this.selectedSafeZone);
    this.persist();

    // Asynchronously fetch live weather from Open-Meteo for coordinates
    const [lat, lon] = this.currentLocation.coordinates;
    fetchLiveWeatherForLocation(lat, lon).then(liveWeather => {
      if (liveWeather && this.currentDataset) {
        this.currentDataset.weather = {
          ...this.currentDataset.weather,
          ...liveWeather,
        };
        this.notify();
      }
    });
  }

  public clearLocation() {
    this.currentLocation = null;
    this.selectedSafeZone = null;
    this.activeRoute = null;
    this.routeDisruptionMessage = null;
    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, 'null');
    } catch {}
    this.notify();
  }

  public getLocationRadius(): number {
    return this.currentRadiusKm;
  }

  public setLocationRadius(radiusKm: number) {
    this.currentRadiusKm = radiusKm;
    this.notify();
  }

  public getHabitations(customRadiusKm?: number): Habitation[] {
    const rad = customRadiusKm ?? this.currentRadiusKm;
    if (!this.currentDataset) {
      return DEMO_HABITATIONS;
    }
    if (!this.currentLocation) {
      return this.currentDataset.habitations;
    }
    const [cLat, cLon] = this.currentLocation.coordinates;
    return this.currentDataset.habitations.filter(h => {
      const dist = calculateHaversineKm(cLat, cLon, h.coordinates[0], h.coordinates[1]);
      return dist <= rad;
    });
  }

  public getHazards(customRadiusKm?: number): HazardArea[] {
    const rad = customRadiusKm ?? this.currentRadiusKm;
    if (!this.currentDataset) {
      return DEMO_HAZARDS;
    }
    if (!this.currentLocation) {
      return this.currentDataset.hazards;
    }
    const [cLat, cLon] = this.currentLocation.coordinates;
    return this.currentDataset.hazards.filter(h => {
      const dist = calculateHaversineKm(cLat, cLon, h.center[0], h.center[1]);
      return dist <= rad;
    });
  }

  public getSelectedSafeZone(): SafeZone | null {
    return this.selectedSafeZone;
  }

  public setSelectedSafeZone(safeZone: SafeZone | null) {
    this.selectedSafeZone = safeZone;
    if (this.currentLocation) {
      this.calculateRouteForCurrentLocation(this.activeScenario, true, safeZone);
    } else {
      this.notify();
    }
  }

  public getSafeZones(customRadiusKm?: number): SafeZone[] {
    const rad = customRadiusKm ?? this.currentRadiusKm;
    if (!this.currentDataset) {
      return DEMO_SAFE_ZONES;
    }
    if (!this.currentLocation) {
      return this.currentDataset.safeZones;
    }
    const [cLat, cLon] = this.currentLocation.coordinates;
    return this.currentDataset.safeZones
      .map(sz => {
        const dist = calculateHaversineKm(cLat, cLon, sz.coordinates[0], sz.coordinates[1]);
        return {
          ...sz,
          distanceKm: dist,
          travelTimeMin: Math.max(3, Math.round(dist * 2.5)),
        };
      })
      .filter(sz => sz.distanceKm <= rad)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  public getNearbySafeZones(radiusKm: number = 40): SafeZone[] {
    return this.getSafeZones(radiusKm);
  }

  public getNearbyHazards(radiusKm: number = 45): HazardArea[] {
    return this.getHazards(radiusKm);
  }

  public getRelocationRoutes(): RelocationRoute[] {
    return this.currentDataset ? this.currentDataset.routes : DEMO_ROUTES;
  }

  public getProblemAnalysis(): ProblemAnalysisReport {
    return this.currentDataset.problemAnalysis;
  }

  public updateProblemStatus(problemId: string, status: 'PENDING' | 'IN_PROGRESS' | 'SOLVED', actionTaken?: string) {
    if (!this.currentDataset?.problemAnalysis) return;
    const pa = this.currentDataset.problemAnalysis;
    pa.problems = pa.problems.map(p => {
      if (p.id === problemId) {
        return {
          ...p,
          status,
          actionTaken: actionTaken || p.actionTaken,
          resolvedAt: status === 'SOLVED' ? 'Just now' : p.resolvedAt,
        };
      }
      return p;
    });

    pa.problemsSolved = pa.problems.filter(p => p.status === 'SOLVED').length;
    pa.problemsPending = pa.problems.filter(p => p.status === 'PENDING').length;
    const inProg = pa.problems.filter(p => p.status === 'IN_PROGRESS').length;
    pa.addressedPercentage = Math.round(((pa.problemsSolved + inProg * 0.5) / pa.problems.length) * 100);
    pa.lastUpdated = 'Updated just now by Incident Command';
    this.notify();
  }

  public getNDRFResponseSupport(): EmergencyResponseSupportData {
    return this.currentDataset.ndrfSupport;
  }

  public getWeather(): WeatherData {
    return this.currentDataset.weather;
  }

  public getActiveRoute(): AdaptiveRoute | null {
    if (!this.currentLocation) return null;
    if (!this.activeRoute) {
      // Lazy fallback calculation without notifying listeners during render
      const result = safeRouteEngine.evaluateRoute(
        this.currentLocation.coordinates,
        this.currentLocation.name,
        this.activeScenario,
        this.selectedSafeZone
      );
      this.activeRoute = result.route;
    }
    return this.activeRoute;
  }

  public getActiveScenario(): WhatIfScenario {
    return this.activeScenario;
  }

  public getDisruptionMessage(): string | null {
    return this.routeDisruptionMessage;
  }

  public getIsRecalculatingRoute(): boolean {
    return this.isRecalculatingRoute;
  }

  public setWhatIfScenario(scenario: WhatIfScenario) {
    this.activeScenario = scenario;
    if (scenario === 'ROAD_BLOCKED' || scenario === 'FLOOD_ESCALATION') {
      this.routeDisruptionMessage = 'Route disruption detected. Adaptive SafeRoute AI is recalculating an alternative...';
      this.isRecalculatingRoute = true;
      this.notify();

      setTimeout(() => {
        this.calculateRouteForCurrentLocation(scenario, true, this.selectedSafeZone);
        this.isRecalculatingRoute = false;
        this.notify();
      }, 600);
    } else {
      this.routeDisruptionMessage = null;
      this.calculateRouteForCurrentLocation(scenario, true, this.selectedSafeZone);
    }
  }

  public calculateRouteForCurrentLocation(
    scenario: WhatIfScenario = this.activeScenario,
    shouldNotify: boolean = true,
    targetZone?: SafeZone | null
  ) {
    if (!this.currentLocation) {
      this.activeRoute = null;
      this.routeDisruptionMessage = null;
      if (shouldNotify) this.notify();
      return;
    }

    const destination = targetZone !== undefined ? targetZone : this.selectedSafeZone;
    const result = safeRouteEngine.evaluateRoute(
      this.currentLocation.coordinates,
      this.currentLocation.name,
      scenario,
      destination
    );
    this.activeRoute = result.route;
    if (scenario === 'ROAD_BLOCKED' || scenario === 'FLOOD_ESCALATION') {
      this.routeDisruptionMessage = result.route.disruptionReason || 'Route disruption detected. Recalculated alternative route.';
    } else if (result.capacityCheck.isConstrained) {
      this.routeDisruptionMessage = result.capacityCheck.constraintMessage || null;
    } else {
      this.routeDisruptionMessage = null;
    }
    if (shouldNotify) {
      this.notify();
    }
  }

  // --- CITIZEN SETTINGS METHODS ---
  public getCitizenSettings(): CitizenSettings {
    return { ...this.citizenSettings };
  }

  public updateCitizenSettings(settings: Partial<CitizenSettings>) {
    this.citizenSettings = { ...this.citizenSettings, ...settings };
    this.persist();
  }

  public triggerVibration(pattern: number[] = [200, 100, 200]) {
    if (this.citizenSettings.emergencyVibration && typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // safe fallback
      }
    }
  }
}

export const emergencyStore = new EmergencyStore();
