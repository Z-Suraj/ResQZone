export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE';
export type VulnerabilityLevel = 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CapacityStatus = 'SAFE' | 'MODERATE' | 'NEAR_CAPACITY' | 'OVER_CAPACITY';
export type RelocationPriority = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
export type UserRole = 'CITIZEN' | 'AUTHORITY';
export type HazardType = 'Landslide' | 'Flash Flood' | 'Cyclone' | 'Riverine Flood' | 'Cloudburst';

export interface Habitation {
  id: string;
  name: string;
  district: string;
  state: string;
  subdistrict: string;
  level: 'village' | 'town';
  ruralUrban: 'Rural' | 'Urban';
  households: number;
  population: number; // Census 2011 baseline
  malePopulation: number;
  femalePopulation: number;
  children0_6: number;
  scPopulation: number;
  stPopulation: number;
  literatePopulation: number;
  vulnerability: VulnerabilityLevel;
  riskScore: number; // 0 to 10
  riskLevel: RiskLevel;
  hazardType: HazardType;
  safeCapacity: number;
  capacityUtilization: number; // percentage
  capacityStatus: CapacityStatus;
  relocationPriority: RelocationPriority;
  coordinates: [number, number]; // [lat, lng]
  recommendedAction: string;
  source: string;
  nearestSafeZoneId?: string;
  estimatedEvacuees: number;
}

export interface HazardArea {
  id: string;
  name: string;
  type: HazardType;
  severity: RiskLevel;
  riskScore: number; // 0 - 10
  affectedAreaSqKm: number;
  affectedPopulation: number;
  affectedHabitationsCount: number;
  center: [number, number];
  polygonPoints: [number, number][];
  recommendedAction: string;
  reportedTime: string;
  description: string;
  imageUrl: string;
}

export interface SafeZone {
  id: string;
  name: string;
  type: 'Shelter' | 'Relief Camp' | 'School Building' | 'School Shelter' | 'Community Center' | 'Community Shelter' | 'Elevated Stadium' | 'Hospital / Emergency Center' | 'Cyclone / Flood Shelter' | 'Medical Facility';
  district: string;
  state: string;
  coordinates: [number, number];
  safeCapacity: number;
  currentOccupancy: number;
  availableCapacity: number;
  accessibility: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'RESTRICTED';
  hazardExposure: 'VERY_LOW' | 'LOW' | 'NONE';
  distanceKm: number;
  travelTimeMin: number;
  imageUrl: string;
  facilities: string[];
  contactPerson: string;
  contactPhone: string;
  medicalUnitAvailable: boolean;
  powerBackup: boolean;
  status: 'SAFE' | 'NEAR_CAPACITY' | 'OVER_CAPACITY';
}

export interface RelocationRoute {
  id: string;
  name: string;
  fromHabitationId: string;
  fromName: string;
  toSafeZoneId: string;
  toName: string;
  distanceKm: number;
  travelTimeMinutes: number;
  status: 'CLEAR' | 'CAUTION' | 'RESTRICTED';
  routeType: 'Road' | 'Safe Corridor' | 'Emergency Track';
  waypoints: [number, number][];
}

export interface Incident {
  id: string;
  title: string;
  type: HazardType | 'Road Blockage' | 'Bridge Damage' | 'Stranded Citizens';
  location: string;
  district: string;
  state: string;
  reportedTime: string;
  severity: RiskLevel;
  status: 'NEW' | 'VERIFYING' | 'ACTIVE' | 'RESOLVED';
  reporterName: string;
  reporterPhone: string;
  citizenReportText: string;
  imageUrl: string;
  coordinates: [number, number];
  verifiedBy?: string;
  internalNotes?: string;
  rescueCount?: number;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'RESOLVED';
  region: string;
  timestamp: string;
  active: boolean;
  affectedHabitations: string[];
  vibrationPattern?: number[];
  issuedBy: string;
  imageUrl?: string;
}

export interface Vehicle {
  id: string;
  type: 'Rescue Bus' | 'Ambulance' | 'All-Terrain NDRF Truck' | 'Rescue Boat' | 'Utility Van';
  capacity: number;
  status: 'EN_ROUTE' | 'AVAILABLE' | 'BOARDING' | 'COMPLETED';
  currentLocation: string;
  destination: string;
  etaMin: number;
  regNumber: string;
}

export interface RelocationSimulationState {
  isSimulating: boolean;
  isPaused: boolean;
  progressPercent: number;
  peopleRelocated: number;
  totalPeople: number;
  remainingPeople: number;
  activeVehicles: number;
  etaMinutes: number;
  speedMultiplier: number;
}

export type TransportMode = 'WALKING' | 'CAR' | 'BUS' | 'TRAIN' | 'AIR' | 'BOAT';
export type RouteSegmentRisk = 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'BLOCKED';

export interface RouteSegment {
  id: string;
  mode: TransportMode;
  fromTitle: string;
  toTitle: string;
  distanceKm: number;
  durationMinutes: number;
  risk: RouteSegmentRisk;
  status: string;
  vehicleId?: string;
  vehicleName?: string;
  availableSeats?: number;
  totalSeats?: number;
  coordinates: [number, number][];
  iconCoord: [number, number];
}

export interface AdaptiveRoute {
  id: string;
  destinationName: string;
  safeZoneId: string;
  safeZoneCapacity: number;
  safeZoneOccupied: number;
  safeZoneAvailable: number;
  totalDistanceKm: number;
  totalMinutes: number;
  overallRisk: 'SAFE' | 'CAUTION' | 'HIGH_RISK';
  capacityStatus: 'AVAILABLE' | 'CONSTRAINED' | 'FULL';
  segments: RouteSegment[];
  isAlternative?: boolean;
  disruptionReason?: string;
}

export interface TransportFleetItem {
  id: string;
  type: 'BUS' | 'TRAIN' | 'AIR' | 'CAR' | 'BOAT' | 'RESCUE_VEHICLE' | 'AMBULANCE' | 'HELICOPTER' | 'WALKING';
  title: string;
  regOrId: string;
  capacity: number;
  occupied: number;
  available: number;
  availableSeats?: number;
  status: 'AVAILABLE' | 'BOARDING' | 'STANDBY' | 'EN_ROUTE';
  pickupLocation: string;
  etaMin: number;
  routeDescription: string;
  equipment?: string[];
  imageUrl: string;
  coordinates?: [number, number];
}

export interface ResQSenseSensor {
  name: string;
  value: string;
  delta: string;
  isEscalating: boolean;
  status: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

export interface ResQSenseData {
  hazardType: HazardType;
  currentRiskPct: number;
  predictedRiskPct: number;
  trend: 'ESCALATING' | 'STABLE' | 'DECREASING';
  windowMinutes: number;
  sensors: ResQSenseSensor[];
  recommendations: string[];
}

export interface CitizenLocation {
  id: string;
  name: string;
  district: string;
  state: string;
  coordinates: [number, number];
  riskLevel: RiskLevel;
  hazardNotice: string;
  zoom: number;
  pincode?: string;
}

export type DataStatus = 'LIVE' | 'VERIFIED' | 'DEMO' | 'SYNTHETIC' | 'UNAVAILABLE';

export interface DataProvenance {
  source: string;
  lastUpdated: string;
  status: DataStatus;
}

export interface ProblemItem {
  id: string;
  title: string;
  category: 'HAZARD' | 'CAPACITY' | 'ROUTE' | 'WEATHER' | 'INCIDENT';
  severity: RiskLevel;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SOLVED';
  identifiedAt: string;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface ProblemAnalysisReport {
  selectedLocation: string;
  currentHazard: string;
  riskLevel: RiskLevel;
  affectedPopulation: number;
  affectedHabitationsCount: number;
  activeIncidentsCount: number;
  safeZoneAvailabilityPct: number;
  capacityShortage: number;
  weatherWarningStatus: string;
  infrastructureStatus: string;
  problemsIdentified: number;
  problemsSolved: number;
  problemsPending: number;
  addressedPercentage: number;
  lastUpdated: string;
  problems: ProblemItem[];
  provenance: DataProvenance;
}

export interface NDRFResourceUnit {
  id: string;
  name: string;
  type: 'NDRF Battalion' | 'SDRF Quick Response' | 'Civil Defence' | 'Disaster Medical Unit' | 'Fire & Emergency' | 'Army Aviation / Air Force ALH';
  baseLocation: string;
  distanceKm: number;
  etaMin: number;
  status: 'DEPLOYED' | 'STANDBY' | 'MOBILIZING' | 'ON_SCENE' | 'AVAILABLE';
  personnelCount: number;
  vehiclesCount: number;
  boatsCount: number;
  contactOfficer: string;
  contactNumber: string;
  dataStatus: DataStatus;
}

export interface EmergencyResponseSupportData {
  nearestUnit: NDRFResourceUnit;
  units: NDRFResourceUnit[];
  requiredPersonnel: number;
  availablePersonnel: number;
  requiredBoatsOrVehicles: number;
  availableBoatsOrVehicles: number;
  incidentPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  responseStatus: 'ACTIVE_DEPLOYMENT' | 'ALERT_MONITORING' | 'RESOURCES_STANDBY';
  provenance: DataProvenance;
}

export interface WeatherData {
  temperatureC: number;
  precipitationMm: number;
  windSpeedKmh: number;
  humidityPct: number;
  condition: string;
  warningLevel: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  warningMessage: string;
  isLive: boolean;
  provenance: DataProvenance;
}
