import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  ShieldAlert, 
  MapPin, 
  PhoneCall, 
  Navigation, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  LifeBuoy, 
  ShieldCheck,
  Radio,
  ArrowRight,
  Maximize2,
  Minimize2,
  Crosshair,
  Lightbulb,
  Info,
  Clock,
  Layers,
  X,
  Sparkles,
  RotateCcw,
  Bus,
  Train,
  Car,
  Ship,
  Footprints,
  User,
  Shield
} from 'lucide-react';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { DEMO_HAZARDS } from '../../data/demoHazards';
import { emergencyStore } from '../../services/emergencyStore';
import { riskEngine } from '../../services/riskEngine';
import { authService } from '../../services/authService';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';
import { SafeImage } from '../common/SafeImage';
import { CitizenLocationSearch } from './CitizenLocationSearch';
import { AdaptiveSafeRouteCard } from './AdaptiveSafeRouteCard';
import { ResQSensePanel } from './ResQSensePanel';
import { TransportFleetStatus } from './TransportFleetStatus';
import { CitizenLocation, RouteSegment, TransportMode, AdaptiveRoute, HazardArea, SafeZone } from '../../types';
import { ResQZoneLogo } from '../common/ResQZoneLogo';

interface CitizenDashboardProps {
  onNavigateTab: (tab: string) => void;
  darkMode: boolean;
}

type BasemapType = 'STANDARD' | 'SATELLITE' | 'NATURAL' | 'TERRAIN';

const BASEMAP_URLS: Record<BasemapType, { url: string; attribution: string; maxZoom: number }> = {
  STANDARD: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
    maxZoom: 18,
  },
  NATURAL: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
  },
  TERRAIN: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Sources: USGS, FAO, NOAA',
    maxZoom: 18,
  },
};

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onNavigateTab,
  darkMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Store Subscriptions & State
  const initialLoc = emergencyStore.getCurrentLocation();
  const [currentLoc, setCurrentLoc] = useState<CitizenLocation | null>(initialLoc);
  const [activeRoute, setActiveRoute] = useState<AdaptiveRoute | null>(emergencyStore.getActiveRoute());
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('SATELLITE');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);

  // Interactive Bottom Sheets / Panels on Map
  const [selectedHazard, setSelectedHazard] = useState<HazardArea | null>(null);
  const [selectedSafeZone, setSelectedSafeZone] = useState<SafeZone | null>(() => emergencyStore.getSelectedSafeZone());
  const [isRouteActive, setIsRouteActive] = useState<boolean>(true);

  // Subscribe to emergencyStore updates (location changes, what-if recalculations)
  useEffect(() => {
    const unsubscribe = emergencyStore.subscribe(() => {
      setCurrentLoc(emergencyStore.getCurrentLocation());
      setActiveRoute(emergencyStore.getActiveRoute());
      setSelectedSafeZone(emergencyStore.getSelectedSafeZone());
    });
    return () => unsubscribe();
  }, []);

  // Handle ESC key for fullscreen and map resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMapFullscreen) {
        setIsMapFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapFullscreen]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [isMapFullscreen]);

  const nearbySafeZones = emergencyStore.getNearbySafeZones(60);
  const nearbyHazards = emergencyStore.getNearbyHazards(60);
  const nearestSafeZone = selectedSafeZone || (nearbySafeZones.length > 0 ? nearbySafeZones[0] : null);
  const primaryHazard = nearbyHazards.length > 0 ? nearbyHazards[0] : null;

  // Dynamic Risk Evaluation via centralized riskEngine
  const riskEval = riskEngine.evaluateRisk({
    hazardSeverity: currentLoc ? currentLoc.riskLevel : 'SAFE',
    sensorTrend: currentLoc ? 'ESCALATING' : 'STABLE',
    routeRisk: 'SAFE',
  });

  // Setup & Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const centerCoord: [number, number] = currentLoc ? currentLoc.coordinates : [20.5937, 78.9629];
      const initialZoom = currentLoc ? (currentLoc.zoom || 13) : 5;
      const map = L.map(mapContainerRef.current, {
        center: centerCoord,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      const initialBasemap = BASEMAP_URLS[activeBasemap];
      const tileLayer = L.tileLayer(initialBasemap.url, {
        maxZoom: initialBasemap.maxZoom,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    if (currentLoc) {
      map.setView(currentLoc.coordinates, currentLoc.zoom || 13, { animate: true });
    } else {
      map.setView([20.5937, 78.9629], 5, { animate: true });
    }

    // Remove existing operational layers (retain tile layer)
    map.eachLayer((layer) => {
      if (
        layer instanceof L.Marker || 
        layer instanceof L.Polygon || 
        layer instanceof L.Polyline || 
        layer instanceof L.CircleMarker
      ) {
        map.removeLayer(layer);
      }
    });

    if (!currentLoc) {
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return;
    }

    // 1. Render Local Hazards Polygons & Markers
    nearbyHazards.forEach((hazard) => {
      const isCritical = hazard.severity === 'CRITICAL';
      const polygon = L.polygon(hazard.polygonPoints, {
        color: isCritical ? '#e11d48' : '#f59e0b',
        weight: 2.5,
        fillColor: isCritical ? '#e11d48' : '#f59e0b',
        fillOpacity: isCritical ? 0.35 : 0.25,
        dashArray: isCritical ? '6, 6' : undefined,
      }).addTo(map);

      polygon.on('click', () => {
        setSelectedHazard(hazard);
        setSelectedSafeZone(null);
        setSelectedSegment(null);
      });

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-pin',
        html: `
          <div style="background:${isCritical ? '#e11d48' : '#f59e0b'}; width:28px; height:28px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 0 12px ${isCritical ? 'rgba(225,29,72,0.8)' : 'rgba(245,158,11,0.8)'}; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; font-weight:bold; cursor:pointer;">
            ⚠️
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const hMarker = L.marker(hazard.center, { icon: hazardIcon }).addTo(map);
      hMarker.on('click', () => {
        setSelectedHazard(hazard);
        setSelectedSafeZone(null);
        setSelectedSegment(null);
      });
    });

    // 2. Render Local Safe Zones (Green Shield Pins)
    nearbySafeZones.forEach((zone) => {
      const isSelected = selectedSafeZone?.id === zone.id;
      const shelterIcon = L.divIcon({
        className: 'custom-shelter-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="width:${isSelected ? '32px' : '26px'}; height:${isSelected ? '32px' : '26px'}; border-radius:50%; background:#10b981; border:2.5px solid #ffffff; box-shadow:0 0 12px rgba(16,185,129,0.8); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; font-weight:bold;">
              🛡️
            </div>
            <div style="background:#064e3b; color:#ecfdf5; font-size:9px; font-weight:800; padding:2px 6px; border-radius:6px; margin-top:2px; white-space:nowrap; border:1px solid #34d399; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              ${zone.name.split(',')[0]}
            </div>
          </div>
        `,
        iconSize: [110, 48],
        iconAnchor: [55, 13],
      });

      const sMarker = L.marker(zone.coordinates, { icon: shelterIcon }).addTo(map);
      sMarker.on('click', () => {
        setSelectedSafeZone(zone);
        emergencyStore.setSelectedSafeZone(zone);
        setSelectedHazard(null);
        setSelectedSegment(null);
      });
    });

    // 3. Render Citizen GPS / Current Position (Pulsing Blue Ring Marker)
    const citizenIcon = L.divIcon({
      className: 'custom-citizen-pin',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="position:relative; width:22px; height:22px;">
            <div style="position:absolute; inset:-4px; border-radius:50%; background:rgba(37,99,235,0.4); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="width:22px; height:22px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 0 15px rgba(37,99,235,0.9); position:relative; z-index:2;"></div>
          </div>
          <div style="background:#1e3a8a; color:#ffffff; font-size:9px; font-weight:800; padding:2px 7px; border-radius:10px; margin-top:3px; white-space:nowrap; border:1px solid #60a5fa; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
            ${currentLoc.name} (You)
          </div>
        </div>
      `,
      iconSize: [90, 46],
      iconAnchor: [45, 11],
    });

    L.marker(currentLoc.coordinates, { icon: citizenIcon }).addTo(map);

    // 4. Render Adaptive SafeRoute Segments with Multimodal Map Icons
    if (isRouteActive && activeRoute && activeRoute.segments.length > 0) {
      activeRoute.segments.forEach((seg) => {
        let polyColor = '#00f0ff';
        let dashStyle = undefined;

        if (seg.mode === 'WALKING') {
          polyColor = '#38bdf8';
          dashStyle = '6, 6';
        } else if (seg.mode === 'BUS') {
          polyColor = '#10b981';
        } else if (seg.mode === 'TRAIN') {
          polyColor = '#818cf8';
          dashStyle = '10, 4';
        } else if (seg.mode === 'BOAT') {
          polyColor = '#06b6d4';
        } else if (seg.mode === 'CAR') {
          polyColor = '#f59e0b';
        }

        const polyline = L.polyline(seg.coordinates, {
          color: polyColor,
          weight: 5,
          opacity: 0.95,
          dashArray: dashStyle,
          lineCap: 'round',
          className: seg.mode === 'WALKING' ? 'animated-route-line glowing-route-cyan' : 'glowing-route-cyan',
        }).addTo(map);

        polyline.on('click', () => {
          setSelectedSegment(seg);
          setSelectedHazard(null);
          setSelectedSafeZone(null);
        });

        // Transport Icon Marker on Segment
        let emoji = '🚶';
        let badgeBg = '#3b82f6';
        if (seg.mode === 'BUS') { emoji = '🚌'; badgeBg = '#10b981'; }
        if (seg.mode === 'TRAIN') { emoji = '🚆'; badgeBg = '#6366f1'; }
        if (seg.mode === 'BOAT') { emoji = '🚤'; badgeBg = '#06b6d4'; }
        if (seg.mode === 'CAR') { emoji = '🚗'; badgeBg = '#f59e0b'; }
        if (seg.mode === 'AIR') { emoji = '✈️'; badgeBg = '#a855f7'; }

        const modeIcon = L.divIcon({
          className: 'custom-segment-icon',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <div style="background:${badgeBg}; width:24px; height:24px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 0 10px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; font-size:12px;">
                ${emoji}
              </div>
              <div style="background:#0f172a; color:#f8fafc; font-size:8px; font-weight:bold; padding:1px 4px; border-radius:4px; margin-top:1px; white-space:nowrap; border:1px solid #334155;">
                ${seg.vehicleId || seg.mode}
              </div>
            </div>
          `,
          iconSize: [60, 36],
          iconAnchor: [30, 12],
        });

        const segMarker = L.marker(seg.iconCoord, { icon: modeIcon }).addTo(map);
        segMarker.on('click', () => {
          setSelectedSegment(seg);
          setSelectedHazard(null);
          setSelectedSafeZone(null);
        });
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [currentLoc, activeRoute, activeBasemap, isRouteActive, selectedSafeZone]);

  // Handle Basemap Switcher
  const handleBasemapChange = (type: BasemapType) => {
    setActiveBasemap(type);
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const config = BASEMAP_URLS[type];
    const newTileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  };

  // Location selection callback from CitizenLocationSearch
  const handleLocationSelect = (loc: CitizenLocation) => {
    setCurrentLoc(loc);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(loc.coordinates, loc.zoom || 13, { duration: 1.2 });
    }
  };

  // Focus segment on map from route card
  const handleFocusSegment = (seg: RouteSegment) => {
    setSelectedSegment(seg);
    if (mapInstanceRef.current && seg.coordinates.length > 0) {
      mapInstanceRef.current.flyTo(seg.iconCoord, 14, { duration: 0.8 });
    }
  };

  // Zoom to Route
  const handleViewSafeRoute = () => {
    setIsRouteActive(true);
    if (mapInstanceRef.current && activeRoute && activeRoute.segments.length > 0) {
      const allPoints: [number, number][] = activeRoute.segments.flatMap(s => s.coordinates);
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], duration: 1 });
    }
  };

  const sessionUser = authService.getCurrentUser();
  const citizenName = sessionUser?.name || 'Citizen User';

  return (
    <div className="relative min-h-full font-sans selection:bg-rose-500 selection:text-white">
      {/* Realistic Emergency Section Background (Visible & layered properly) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.home} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="ResQZone Emergency Preparedness Background"
      />

      <div className="relative z-10 p-3 sm:p-5 lg:p-6 space-y-5 max-w-7xl mx-auto">
      
      {/* Citizen Personal Identity & Sector Header */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white border-[#E2E8F0] shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-cyan-400 font-black flex items-center justify-center text-sm border border-blue-500/20 shrink-0">
            {citizenName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm sm:text-base font-black tracking-tight ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                {citizenName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                VERIFIED CITIZEN
              </span>
            </div>
            <div className={`text-xs mt-0.5 flex flex-wrap items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-[#475569]'}`}>
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Jurisdiction: <b className={darkMode ? 'text-slate-200' : 'text-[#0F172A]'}>{currentLoc ? currentLoc.name : 'Select Your Area'}</b></span>
              {currentLoc?.state && <span>&bull; {currentLoc.state}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigateTab('citizen-my-area')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] border-[#CBD5E1]'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Select Sector</span>
          </button>
          <button
            onClick={() => onNavigateTab('citizen-settings')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] border-[#CBD5E1]'
            }`}
          >
            Profile Settings
          </button>
        </div>
      </div>
      
      {/* 1. CINEMATIC HERO & CURRENT SAFETY STATUS */}
      <section 
        aria-label="Safety Risk Overview"
        className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl group"
      >
        <div className="absolute inset-0 z-0">
          <SafeImage 
            src={IMAGES.himalayanRiverFlood} 
            alt="Rescue Boat in Himalayan Flood" 
            category="disaster"
            className="w-full h-full object-cover object-center scale-102 group-hover:scale-105 transition-transform duration-700 brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/80" />
        </div>

        <div className="relative z-10 p-5 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md mb-1 shadow-md">
              <ResQZoneLogo variant="symbol" size="xs" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                RES<span className="text-rose-500">Q</span>ZONE
              </span>
              <span className="text-[10px] text-slate-300 font-sans hidden sm:inline">
                • Safer People. Safer Communities.
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Stay Safe. <br className="hidden sm:inline" />
              Know Your <span className="text-rose-500">Risk.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed max-w-lg">
              {currentLoc ? (
                <>ResQZone helps you understand nearby hazards, find safer locations and request assistance in <b>{currentLoc.name}</b>.</>
              ) : (
                <>ResQZone GIS provides location-aware disaster intelligence, verified shelters, and adaptive evacuation routes across India.</>
              )}
            </p>
          </div>

          {/* Current Safety Status Card */}
          <div className={`w-full md:w-88 shrink-0 rounded-2xl p-5 sm:p-6 bg-slate-950/85 backdrop-blur-md border shadow-2xl space-y-4 ${
            !currentLoc ? 'border-blue-600/60 shadow-blue-950/50' :
            currentLoc.riskLevel === 'CRITICAL' ? 'border-rose-600/60 shadow-rose-950/50' :
            currentLoc.riskLevel === 'HIGH' ? 'border-amber-600/60 shadow-amber-950/50' :
            'border-emerald-600/60 shadow-emerald-950/50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md ${
                !currentLoc ? 'bg-blue-600 shadow-blue-600/40' :
                currentLoc.riskLevel === 'CRITICAL' ? 'bg-rose-600 shadow-rose-600/40' :
                currentLoc.riskLevel === 'HIGH' ? 'bg-amber-600 shadow-amber-600/40' :
                'bg-emerald-600 shadow-emerald-600/40'
              }`}>
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                  CURRENT SAFETY STATUS
                </div>
                <div className={`text-xl sm:text-2xl font-black tracking-tight leading-none mt-0.5 ${
                  !currentLoc ? 'text-blue-400' :
                  currentLoc.riskLevel === 'CRITICAL' ? 'text-rose-500' :
                  currentLoc.riskLevel === 'HIGH' ? 'text-amber-500' :
                  'text-emerald-400'
                }`}>
                  {currentLoc ? `${currentLoc.riskLevel} RISK` : 'SELECT SECTOR'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {currentLoc 
                ? (currentLoc.hazardNotice || 'Active hazard monitoring for your location.') 
                : 'Search your city, district or village in the search bar above to load local emergency data and safe routes.'}
            </p>

            <button
              onClick={handleViewSafeRoute}
              className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                !currentLoc ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40' :
                currentLoc.riskLevel === 'CRITICAL' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40' :
                currentLoc.riskLevel === 'HIGH' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' :
                'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
              }`}
            >
              <span>{currentLoc ? 'View Safe Route' : 'Locate Nearest Shelter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. REAL GIS MAP & NEARBY INFORMATION (68% / 32% Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left GIS Map Column (~68% on Desktop) */}
        <div className={`lg:col-span-8 flex flex-col space-y-3 ${isMapFullscreen ? 'fixed inset-0 z-50 p-4 bg-slate-950' : ''}`}>
          
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-950 h-[480px] sm:h-[540px] lg:h-[580px] flex flex-col">
            
            {/* Top In-Map Controls Bar (Modular Geocoding Search + Basemap Switcher) */}
            <div className="absolute top-3 inset-x-3 z-400 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
              
              {/* Robust Location Search Input */}
              <div className="pointer-events-auto w-full sm:w-96">
                <CitizenLocationSearch 
                  onLocationSelected={handleLocationSelect}
                  darkMode={darkMode}
                />
              </div>

              {/* Basemap Switcher Pills */}
              <div className="pointer-events-auto flex items-center bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg overflow-x-auto">
                {(['STANDARD', 'SATELLITE', 'NATURAL', 'TERRAIN'] as BasemapType[]).map((type) => {
                  const isActive = activeBasemap === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleBasemapChange(type)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Left Action Tools: Zoom, Center, Fullscreen */}
            <div className="absolute left-3 top-20 z-400 flex flex-col gap-1.5 pointer-events-auto">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 flex items-center justify-center font-bold text-base shadow-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 flex items-center justify-center font-bold text-base shadow-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                &minus;
              </button>
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    if (currentLoc) {
                      mapInstanceRef.current.flyTo(currentLoc.coordinates, currentLoc.zoom || 13, { duration: 1 });
                    } else {
                      mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1 });
                    }
                  }
                }}
                className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-blue-400 border border-slate-700/80 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                title="Center on My Location"
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* LEAFLET MAP ELEMENT */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-full z-10 focus:outline-none"
            />

            {/* Bottom-Right Legend Box */}
            <div className="absolute bottom-3 right-3 z-400 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl pointer-events-auto max-w-[210px] text-left">
              <div className="text-[11px] font-extrabold text-white mb-2 tracking-wide uppercase">
                GIS Legend
              </div>
              <div className="space-y-1.5 text-[10px] font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-[8px] text-white font-bold">⚠️</span>
                  <span>High Hazard Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">⚠️</span>
                  <span>Moderate Hazard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">🛡️</span>
                  <span>Safe Zone Shelter</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
                  <span>Your Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-0.5 border-t-2 border-dashed border-blue-500" />
                  <span>Walking Corridor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 rounded bg-emerald-500" />
                  <span>Emergency Bus</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 rounded bg-indigo-500" />
                  <span>Evacuation Rail</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1 rounded bg-cyan-500" />
                  <span>Rescue Boat</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left ResQZone GIS Scale Bar */}
            <div className="absolute bottom-3 left-3 z-400 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-mono pointer-events-auto flex items-center gap-2">
              <span className="font-bold text-white tracking-wider">RESQZONE GIS</span>
              <span className="text-slate-500">|</span>
              <span className="text-[9px]">0 &nbsp; 2 &nbsp; 10 km</span>
            </div>

            {/* Interactive Segment Card Popup if clicked on map */}
            {selectedSegment && (
              <div className="absolute top-20 left-3 right-3 sm:right-auto sm:w-96 z-450 bg-slate-950/95 backdrop-blur-md border border-blue-500/70 rounded-2xl p-4 shadow-2xl text-left space-y-2 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] uppercase">
                      {selectedSegment.mode}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {selectedSegment.distanceKm} km &bull; {selectedSegment.durationMinutes} min
                    </span>
                  </div>
                  <button onClick={() => setSelectedSegment(null)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-white font-bold">
                  {selectedSegment.fromTitle} &rarr; {selectedSegment.toTitle}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedSegment.status}
                </div>
                {selectedSegment.availableSeats !== undefined && (
                  <div className="text-xs text-emerald-400 font-bold">
                    Available Capacity: {selectedSegment.availableSeats} seats / {selectedSegment.totalSeats} total
                  </div>
                )}
              </div>
            )}

            {/* Interactive Hazard Detail Modal */}
            {selectedHazard && !selectedSegment && (
              <div className="absolute top-20 left-3 right-3 sm:right-auto sm:w-96 z-450 bg-slate-950/95 backdrop-blur-md border border-rose-600/70 rounded-2xl p-4 shadow-2xl text-left space-y-3 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] uppercase">
                      {selectedHazard.severity} RISK
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Monitored Hazard
                    </span>
                  </div>
                  <button onClick={() => setSelectedHazard(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-white">{selectedHazard.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedHazard.description}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
                  <b>Action:</b> {selectedHazard.recommendedAction}
                </div>

                <button
                  onClick={() => {
                    setSelectedHazard(null);
                    handleViewSafeRoute();
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>VIEW SAFE ROUTE &amp; SHELTER</span>
                </button>
              </div>
            )}

            {/* Interactive Safe Zone Detail Modal */}
            {selectedSafeZone && !selectedHazard && !selectedSegment && (
              <div className="absolute top-20 left-3 right-3 sm:right-auto sm:w-96 z-450 bg-slate-950/95 backdrop-blur-md border border-emerald-500/70 rounded-2xl p-4 shadow-2xl text-left space-y-3 pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] uppercase">
                      SAFE ZONE
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">
                      {selectedSafeZone.distanceKm} km • {selectedSafeZone.travelTimeMin} min
                    </span>
                  </div>
                  <button onClick={() => setSelectedSafeZone(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-white">{selectedSafeZone.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{selectedSafeZone.facilities.slice(0, 3).join(' • ')}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800 pt-2">
                  <span>Available Beds: <b className="text-emerald-400">{selectedSafeZone.availableCapacity}</b></span>
                  <span>Capacity: <b className="text-white">{selectedSafeZone.safeCapacity}</b></span>
                </div>

                <button
                  onClick={handleViewSafeRoute}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Navigation className="w-4 h-4" />
                  <span>GET SAFE ROUTE</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Nearby Information & Quick Safety Tips (~32% on Desktop) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Nearby Information Section */}
          <div className={`p-4 sm:p-5 rounded-2xl border text-left space-y-3.5 ${
            darkMode ? 'bg-slate-900/75 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-extrabold tracking-tight ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Nearby Information
              </h2>
              <button 
                onClick={() => onNavigateTab('citizen-alerts')}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Photo-backed Nearby Items */}
            <div className="space-y-2.5">
              {!currentLoc ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center space-y-1.5">
                  <MapPin className="w-5 h-5 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-white">No Sector Selected</div>
                  <p className="text-[11px] text-slate-400">
                    Use the search bar on the map to choose your district or city to see nearby alerts and safe zones.
                  </p>
                </div>
              ) : (
                <>
                  {/* Item 1: Primary Nearby Hazard or Safe Status */}
                  {primaryHazard ? (
                    <div 
                      onClick={() => {
                        setSelectedHazard(primaryHazard);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo(primaryHazard.center, 13);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                        darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-rose-500/40' : 'bg-slate-50 border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      <SafeImage 
                        src={IMAGES.floodAlertThumb} 
                        alt="Hazard Alert" 
                        category="disaster"
                        className="w-14 h-14 rounded-lg object-cover shrink-0 ring-1 ring-slate-700/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 text-rose-500">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold truncate">{primaryHazard.name}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shrink-0">
                            {primaryHazard.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">Near {currentLoc.name}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate mt-0.5">
                          {primaryHazard.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                      darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-14 h-14 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-emerald-400">No Critical Hazard Nearby</div>
                        <div className="text-[11px] text-slate-400 font-medium">{currentLoc.name} Sector</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate mt-0.5">
                          Sector within normal environmental thresholds.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Item 2: Nearest Safe Zone */}
                  {nearestSafeZone && (
                    <div 
                      onClick={handleViewSafeRoute}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                        darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/40' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <SafeImage 
                        src={IMAGES.safeZoneThumb} 
                        alt="Relief Camp" 
                        category="shelter"
                        className="w-14 h-14 rounded-lg object-cover shrink-0 ring-1 ring-slate-700/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold truncate">Nearest Safe Zone</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
                            Safe
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-900 dark:text-white truncate">
                          {nearestSafeZone.name}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
                          {nearestSafeZone.distanceKm ?? 1.2} km &bull; {nearestSafeZone.travelTimeMin ?? 8} min
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Item 3: Secondary Hazard or Monitoring Alert */}
                  {nearbyHazards.length > 1 ? (
                    <div 
                      onClick={() => {
                        const hazard = nearbyHazards[1];
                        setSelectedHazard(hazard);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo(hazard.center, 13);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                        darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-amber-500/40' : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <SafeImage 
                        src={IMAGES.landslideAlertThumb} 
                        alt="Monitored Alert" 
                        category="disaster"
                        className="w-14 h-14 rounded-lg object-cover shrink-0 ring-1 ring-slate-700/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold truncate">{nearbyHazards[1].name}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shrink-0">
                            {nearbyHazards[1].severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{nearbyHazards[1].type} Monitoring</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate mt-0.5">
                          {nearbyHazards[1].description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => onNavigateTab('emergency-help')}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                        darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-blue-500/40' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
                        <PhoneCall className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">Emergency Response Line</div>
                        <div className="text-[11px] text-slate-400 font-medium">National Helpline: 112</div>
                        <p className="text-[11px] text-blue-400 truncate mt-0.5">
                          Click to initiate SOS or request rescue assistance.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Safety Tips Section */}
          <div className={`p-4 sm:p-5 rounded-2xl border text-left space-y-3 ${
            darkMode ? 'bg-slate-900/75 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-500">
                <Lightbulb className="w-4 h-4" />
                <h3 className={`text-sm font-extrabold tracking-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Quick Safety Tips
                </h3>
              </div>
              <button 
                onClick={() => onNavigateTab('emergency-help')}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Avoid river banks and low-lying areas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Follow official updates and alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Keep emergency contacts handy</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Move to higher ground if advised</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. SIGNATURE ADAPTIVE SAFEROUTE AI CARD & WHAT-IF CONTROLLER */}
      <AdaptiveSafeRouteCard 
        route={activeRoute}
        darkMode={darkMode}
        onFocusSegmentOnMap={handleFocusSegment}
        onStartNavigation={handleViewSafeRoute}
      />

      {/* 4. RESQSENSE SENSOR EARLY WARNING & MULTIMODAL FLEET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-6">
          <ResQSensePanel darkMode={darkMode} />
        </div>
        <div className="lg:col-span-6">
          <TransportFleetStatus darkMode={darkMode} />
        </div>
      </div>

      {/* 5. FULL-WIDTH ACTIVE ALERT BANNER */}
      <div 
        onClick={() => onNavigateTab('citizen-alerts')}
        className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
          darkMode 
            ? 'bg-rose-950/30 border-rose-800/40 hover:bg-rose-950/45 text-rose-300' 
            : 'bg-rose-50/80 border-rose-200 hover:bg-rose-100 text-rose-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-left text-xs sm:text-sm">
            <span className="font-extrabold text-rose-600 dark:text-rose-400 mr-2">Active Alert:</span>
            <span className="font-medium">
              Flood warning issued for {currentLoc ? currentLoc.name : 'your sector'} and nearby sectors. Evacuate low-lying areas immediately.
            </span>
          </div>
        </div>

        <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0">
          <span className="hidden sm:inline">View Details</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* 6. BOTTOM SECTION: QUICK ACTIONS + NEED HELP HELPLINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: 4 Large Quick Action Cards */}
        <div className="lg:col-span-8 flex flex-col space-y-2 text-left">
          <h2 className={`text-sm font-extrabold tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Action 1: Report Disaster */}
            <div
              onClick={() => onNavigateTab('report')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group hover:scale-[1.02] ${
                darkMode ? 'bg-slate-900/70 border-slate-800 hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600/15 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Report Disaster
                </div>
                <div className="text-[10px] text-slate-400 truncate">Share what you see</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </div>

            {/* Action 2: Find Safe Zone */}
            <div
              onClick={() => onNavigateTab('safe-zones')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group hover:scale-[1.02] ${
                darkMode ? 'bg-slate-900/70 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Find Safe Zone
                </div>
                <div className="text-[10px] text-slate-400 truncate">Locate nearby safe areas</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>

            {/* Action 3: Request Rescue */}
            <div
              onClick={() => onNavigateTab('rescue')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group hover:scale-[1.02] ${
                darkMode ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Request Rescue
                </div>
                <div className="text-[10px] text-slate-400 truncate">Get help in emergency</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>

            {/* Action 4: Emergency Help */}
            <div
              onClick={() => onNavigateTab('emergency-help')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group hover:scale-[1.02] ${
                darkMode ? 'bg-slate-900/70 border-slate-800 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600/15 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Emergency Help
                </div>
                <div className="text-[10px] text-slate-400 truncate">Call for immediate support</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </div>

          </div>
        </div>

        {/* Right Side: Need Help? Emergency Helpline */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl p-5 flex flex-col justify-between h-full min-h-[140px] group text-left">
            
            <div className="absolute inset-0 z-0">
              <SafeImage 
                src={IMAGES.mountainHelplineBg} 
                alt="Himalayan Mountain Rescue" 
                category="disaster"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
            </div>

            <div className="relative z-10 space-y-1">
              <h3 className="text-base font-extrabold text-white">Need Help?</h3>
              <p className="text-xs text-slate-300 font-medium">Emergency Helpline</p>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center font-bold">
                  <PhoneCall className="w-4 h-4 text-slate-950" />
                </div>
                <span className="text-2xl font-black tracking-wider">112</span>
              </div>

              <a
                href="tel:112"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                Call Now
              </a>
            </div>

          </div>
        </div>

      </div>

      </div>

    </div>
  );
};
