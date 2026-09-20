import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Compass, 
  CheckCircle2, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Crosshair,
  Bus,
  Train,
  Car,
  Ship,
  Footprints,
  Info,
  X
} from 'lucide-react';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { DEMO_HAZARDS } from '../../data/demoHazards';
import { emergencyStore } from '../../services/emergencyStore';
import { CitizenLocationSearch } from './CitizenLocationSearch';
import { CitizenLocation, RouteSegment, AdaptiveRoute } from '../../types';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';

interface CitizenMapViewProps {
  darkMode: boolean;
  onNavigateTab: (tab: string) => void;
}

type BasemapType = 'STANDARD' | 'SATELLITE' | 'NATURAL' | 'TERRAIN';

const BASEMAP_URLS: Record<BasemapType, { url: string; maxZoom: number }> = {
  STANDARD: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
  NATURAL: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
  },
  TERRAIN: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
};

export const CitizenMapView: React.FC<CitizenMapViewProps> = ({ darkMode, onNavigateTab }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [currentLoc, setCurrentLoc] = useState<CitizenLocation | null>(() => emergencyStore.getCurrentLocation());
  const [activeRoute, setActiveRoute] = useState<AdaptiveRoute | null>(() => emergencyStore.getActiveRoute());
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('STANDARD');
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DANGER' | 'SHELTERS' | 'ROUTES'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ESC key listener for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const unsubscribe = emergencyStore.subscribe(() => {
      setCurrentLoc(emergencyStore.getCurrentLocation());
      setActiveRoute(emergencyStore.getActiveRoute());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = currentLoc ? currentLoc.coordinates : [20.5937, 78.9629];
      const initialZoom: number = currentLoc ? (currentLoc.zoom || 13) : 5;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      const config = BASEMAP_URLS[activeBasemap];
      const tileLayer = L.tileLayer(config.url, { maxZoom: config.maxZoom }).addTo(map);
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing operational layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const nearbyHazards = currentLoc ? emergencyStore.getNearbyHazards(80) : [];
    const nearbySafeZones = currentLoc ? emergencyStore.getNearbySafeZones(80) : [];

    // 1. Citizen Position
    if (currentLoc) {
      const citizenIcon = L.divIcon({
        className: 'custom-citizen-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="position:relative; width:22px; height:22px;">
              <div style="position:absolute; inset:-4px; border-radius:50%; background:rgba(37,99,235,0.4); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="width:22px; height:22px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 0 15px rgba(37,99,235,0.8); position:relative; z-index:2;"></div>
            </div>
            <div style="background:#1e3a8a; color:#ffffff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; margin-top:3px; white-space:nowrap; border:1px solid #60a5fa;">
              ${currentLoc.name} (You)
            </div>
          </div>
        `,
        iconSize: [90, 46],
        iconAnchor: [45, 11],
      });

      L.marker(currentLoc.coordinates, { icon: citizenIcon }).addTo(map);
    }

    // 2. Hazards
    if (activeFilter === 'ALL' || activeFilter === 'DANGER') {
      const hazardsToRender = nearbyHazards.length > 0 ? nearbyHazards : (currentLoc ? [] : DEMO_HAZARDS);
      hazardsToRender.forEach((hazard) => {
        const isCritical = hazard.severity === 'CRITICAL';
        L.polygon(hazard.polygonPoints, {
          color: isCritical ? '#e11d48' : '#f59e0b',
          weight: 2.5,
          fillColor: isCritical ? '#e11d48' : '#f59e0b',
          fillOpacity: 0.28,
          dashArray: isCritical ? '6, 6' : undefined,
        }).addTo(map).bindPopup(`
          <div style="font-family:sans-serif; padding:4px; max-width:210px; color:#f8fafc;">
            <b style="color:${isCritical ? '#f43f5e' : '#f59e0b'}; font-size:11px;">⚠️ ${hazard.severity} RISK</b>
            <h4 style="margin:3px 0; font-size:12px; font-weight:bold; color:#ffffff;">${hazard.name}</h4>
            <p style="margin:0; font-size:11px; color:#94a3b8; line-height:1.4;">${hazard.description}</p>
          </div>
        `);
      });
    }

    // 3. Safe Zones
    if (activeFilter === 'ALL' || activeFilter === 'SHELTERS') {
      const zonesToRender = nearbySafeZones.length > 0 ? nearbySafeZones : (currentLoc ? [] : DEMO_SAFE_ZONES);
      zonesToRender.forEach((zone) => {
        const shelterIcon = L.divIcon({
          className: 'custom-shelter-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <div style="width:26px; height:26px; border-radius:50%; background:#10b981; border:2.5px solid #ffffff; box-shadow:0 0 14px rgba(16,185,129,0.8); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; font-weight:bold;">
                🛡️
              </div>
              <div style="background:#064e3b; color:#ecfdf5; font-size:9px; font-weight:700; padding:2px 6px; border-radius:6px; margin-top:2px; white-space:nowrap; border:1px solid #34d399; box-shadow:0 2px 8px rgba(0,0,0,0.5);">
                ${zone.name.split(',')[0]}
              </div>
            </div>
          `,
          iconSize: [110, 48],
          iconAnchor: [55, 13],
        });

        L.marker(zone.coordinates, { icon: shelterIcon }).addTo(map).bindPopup(`
          <div style="font-family:sans-serif; padding:4px; color:#f8fafc;">
            <b style="color:#10b981; font-size:12px;">🛡️ ${zone.name}</b>
            <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">Safe Shelter • <b style="color:#34d399;">${zone.availableCapacity}</b> beds available</div>
            <div style="font-size:10px; color:#6ee7b7; font-weight:600; margin-top:2px;">Distance: ${zone.distanceKm ?? 1.2} km • Safe Capacity: ${zone.safeCapacity}</div>
          </div>
        `);
      });
    }

    // 4. Adaptive Multimodal Evacuation Route
    if ((activeFilter === 'ALL' || activeFilter === 'ROUTES') && activeRoute && activeRoute.segments && activeRoute.segments.length > 0) {
      activeRoute.segments.forEach((seg) => {
        let polyColor = '#00f0ff';
        let dashStyle = undefined;

        if (seg.mode === 'WALKING') { polyColor = '#38bdf8'; dashStyle = '6, 6'; }
        else if (seg.mode === 'BUS') { polyColor = '#10b981'; }
        else if (seg.mode === 'TRAIN') { polyColor = '#818cf8'; dashStyle = '10, 4'; }
        else if (seg.mode === 'BOAT') { polyColor = '#06b6d4'; }
        else if (seg.mode === 'CAR') { polyColor = '#f59e0b'; }

        const polyline = L.polyline(seg.coordinates, {
          color: polyColor,
          weight: 5,
          opacity: 0.95,
          dashArray: dashStyle,
          lineCap: 'round',
          className: seg.mode === 'WALKING' ? 'animated-route-line glowing-route-cyan' : 'glowing-route-cyan',
        }).addTo(map);

        polyline.on('click', () => setSelectedSegment(seg));

        let emoji = '🚶';
        let badgeBg = '#3b82f6';
        if (seg.mode === 'BUS') { emoji = '🚌'; badgeBg = '#10b981'; }
        if (seg.mode === 'TRAIN') { emoji = '🚆'; badgeBg = '#6366f1'; }
        if (seg.mode === 'BOAT') { emoji = '🚤'; badgeBg = '#0891b2'; }
        if (seg.mode === 'CAR') { emoji = '🚗'; badgeBg = '#f59e0b'; }

        const modeIcon = L.divIcon({
          className: 'custom-seg-pin',
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

        const m = L.marker(seg.iconCoord, { icon: modeIcon }).addTo(map);
        m.on('click', () => setSelectedSegment(seg));
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [currentLoc, activeRoute, activeBasemap, activeFilter]);

  const handleBasemapChange = (type: BasemapType) => {
    setActiveBasemap(type);
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const config = BASEMAP_URLS[type];
    const newTileLayer = L.tileLayer(config.url, { maxZoom: config.maxZoom }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  };

  const handleLocationSelect = (loc: CitizenLocation | null) => {
    setCurrentLoc(loc);
    if (loc && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(loc.coordinates, loc.zoom || 13, { duration: 1.2 });
    }
  };

  const handleFitRoute = () => {
    if (mapInstanceRef.current && activeRoute && activeRoute.segments && activeRoute.segments.length > 0) {
      const allPoints: [number, number][] = activeRoute.segments.flatMap(s => s.coordinates);
      mapInstanceRef.current.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
    }
  };

  return (
    <div className={`relative min-h-full font-sans ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-slate-950 overflow-y-auto' : ''}`}>
      {/* Premium Realistic Section Background (GIS Satellite & Terrain) */}
      {!isFullscreen && (
        <CitizenSectionBackground 
          imageUrl={IMAGES.sectionBgs.mapSafety} 
          fallbackUrl={FALLBACK_IMAGES.heroBg}
          darkMode={darkMode} 
          alt="GIS Topographical Terrain Map Background"
        />
      )}

      {/* Floating Exit Fullscreen Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-6 right-6 z-500 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20 cursor-pointer animate-pulse"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Fullscreen (ESC)</span>
        </button>
      )}

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header with clear Citizen Questions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold font-mono mb-1.5 border border-blue-500/20">
              <Compass className="w-3.5 h-3.5" />
              <span>RESQZONE GIS &bull; ADAPTIVE EVACUATION MAP</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Where Am I? Where Is Danger? Where Should I Go?
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Real-time GIS hazard perimeters, multimodal evacuation corridors, and verified shelters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentLoc && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(currentLoc.coordinates, currentLoc.zoom || 13, { duration: 1 });
                } else if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1 });
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentLoc ? `${currentLoc.name} (My Location)` : 'Default View'}</span>
            </button>

            <button
              onClick={handleFitRoute}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Fit Safe Route</span>
            </button>
          </div>
        </div>

        {/* Location Status Notice */}
        {!currentLoc && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            darkMode ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <b>Location Not Set:</b> Showing nationwide GIS monitoring. Use the search bar or GPS to anchor safe routes to your sector.
              </span>
            </div>
            <button
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      emergencyStore.setCurrentLocation({
                        id: `LOC-GPS`,
                        name: 'My GPS Location',
                        district: 'Current District',
                        state: 'Local State',
                        coordinates: [pos.coords.latitude, pos.coords.longitude],
                        riskLevel: 'SAFE',
                        hazardNotice: 'Live GPS coordinate anchored.',
                        zoom: 14,
                      });
                    },
                    (err) => alert('Please enable location permission or search manually.')
                  );
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shrink-0"
            >
              Use Browser GPS
            </button>
          </div>
        )}

        {/* Map Card */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 h-[560px] sm:h-[620px] shadow-2xl flex flex-col">
        
        {/* Top Controls: Location Search + Basemap Switcher */}
        <div className="absolute top-4 inset-x-4 z-400 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto w-full sm:w-96">
            <CitizenLocationSearch onLocationSelected={handleLocationSelect} darkMode={darkMode} />
          </div>

          <div className="pointer-events-auto flex items-center bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg overflow-x-auto">
            {(['STANDARD', 'SATELLITE', 'NATURAL', 'TERRAIN'] as BasemapType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleBasemapChange(type)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeBasemap === type ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Chips on Left */}
        <div className="absolute top-20 left-4 z-400 flex flex-wrap gap-1.5 pointer-events-auto">
          {(['ALL', 'DANGER', 'SHELTERS', 'ROUTES'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-slate-900 text-white border-blue-500 shadow-md'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-900'
              }`}
            >
              {filter === 'ALL' ? 'All Layers' : filter === 'DANGER' ? 'Danger Only' : filter === 'SHELTERS' ? 'Safe Shelters' : 'Routes'}
            </button>
          ))}
        </div>

        {/* Left Tools */}
        <div className="absolute left-4 top-32 z-400 flex flex-col gap-1.5 pointer-events-auto">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 flex items-center justify-center font-bold text-base shadow-lg transition-colors cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 flex items-center justify-center font-bold text-base shadow-lg transition-colors cursor-pointer"
          >
            &minus;
          </button>
          <button
            onClick={() => {
              if (currentLoc && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(currentLoc.coordinates, currentLoc.zoom || 13, { duration: 1 });
              } else if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1 });
              }
            }}
            className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-blue-400 border border-slate-700/80 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Locate Me"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Leaflet Container */}
        <div ref={mapContainerRef} className="w-full h-full z-10 focus:outline-none" />

        {/* Selected Segment Modal */}
        {selectedSegment && (
          <div className="absolute top-20 right-4 w-80 z-450 bg-slate-950/95 backdrop-blur-md border border-blue-500/80 rounded-2xl p-4 shadow-2xl text-left space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] uppercase">
                {selectedSegment.mode}
              </span>
              <button onClick={() => setSelectedSegment(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs font-bold text-white">
              {selectedSegment.fromTitle} &rarr; {selectedSegment.toTitle}
            </div>
            <div className="text-[11px] text-slate-300">
              {selectedSegment.distanceKm} km &bull; {selectedSegment.durationMinutes} min &bull; {selectedSegment.status}
            </div>
            {selectedSegment.availableSeats !== undefined && (
              <div className="text-xs text-emerald-400 font-bold">
                Capacity: {selectedSegment.availableSeats} available / {selectedSegment.totalSeats} total
              </div>
            )}
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-4 right-4 z-400 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl pointer-events-auto max-w-[200px] text-left">
          <div className="text-[10px] font-extrabold text-white mb-1.5 uppercase">GIS Legend</div>
          <div className="space-y-1 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Hazard Zone</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe Zone Shelter</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> You Are Here</div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 border-t border-dashed border-blue-400" /> Walkway</div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-emerald-500" /> Bus / Rail</div>
          </div>
        </div>

        {/* Bottom Scale Bar */}
        <div className="absolute bottom-4 left-4 z-400 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-mono pointer-events-auto">
          RESQZONE GIS &bull; 1:50,000
        </div>
      </div>

      {/* Evacuation Route Telemetry Bar */}
      {activeRoute && currentLoc && (
        <div className={`p-5 rounded-3xl border text-left transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 font-mono">
                ACTIVE MULTIMODAL EVACUATION CORRIDOR
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Total Distance: <b className="text-white">{activeRoute.totalDistanceKm} km</b> &bull; Est. Transit: <b className="text-emerald-400">{activeRoute.totalMinutes} mins</b>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            {activeRoute.segments.map((seg, idx) => (
              <div 
                key={seg.id || idx}
                onClick={() => setSelectedSegment(seg)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  darkMode ? 'bg-slate-950/70 border-slate-800 hover:border-blue-500/50' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-blue-400">Step {idx + 1}: {seg.mode}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{seg.durationMinutes} min</span>
                </div>
                <div className="text-xs font-semibold truncate">
                  {seg.fromTitle} &rarr; {seg.toTitle}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>{seg.distanceKm} km</span>
                  <span className="text-emerald-400 font-bold">{seg.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
