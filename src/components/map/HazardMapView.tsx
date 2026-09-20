import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Search, 
  Crosshair, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  X, 
  AlertTriangle, 
  Home, 
  ShieldCheck, 
  Navigation, 
  ExternalLink,
  Info,
  CheckCircle2,
  Compass,
  LifeBuoy,
  MapPin,
  Filter,
  Activity,
  PhoneCall,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { HazardArea, Habitation, SafeZone, Incident, RelocationRoute, CitizenLocation } from '../../types';
import { emergencyStore, CitizenRescueRequest } from '../../services/emergencyStore';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';
import { IMAGES } from '../../data/assets';
import { AuthorityLocationSearch } from '../common/AuthorityLocationSearch';

interface HazardMapViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectHabitationForRelocation?: (habitation: Habitation) => void;
  darkMode: boolean;
}

type BasemapType = 'satellite' | 'standard' | 'terrain' | 'natural';

export const HazardMapView: React.FC<HazardMapViewProps> = ({
  onNavigateTab,
  onSelectHabitationForRelocation,
  darkMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<{
    hazards: L.LayerGroup;
    habitations: L.LayerGroup;
    safeZones: L.LayerGroup;
    routes: L.LayerGroup;
    incidents: L.LayerGroup;
    rescue: L.LayerGroup;
  } | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>('satellite');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Real coordinates & location tracking from central store
  const [currentLocation, setCurrentLocation] = useState<CitizenLocation | null>(
    () => emergencyStore.getCurrentLocation()
  );
  const [currentRadius, setCurrentRadius] = useState<number>(
    () => emergencyStore.getLocationRadius()
  );
  const [hazards, setHazards] = useState<HazardArea[]>(
    () => emergencyStore.getHazards()
  );
  const [habitations, setHabitations] = useState<Habitation[]>(
    () => emergencyStore.getHabitations()
  );
  const [safeZones, setSafeZones] = useState<SafeZone[]>(
    () => emergencyStore.getSafeZones()
  );
  const [routes, setRoutes] = useState<RelocationRoute[]>(
    () => emergencyStore.getRelocationRoutes()
  );

  const defaultCoords: [number, number] = currentLocation?.coordinates || [22.0667, 88.0698];
  const [coordinates, setCoordinates] = useState({ 
    lat: defaultCoords[0], 
    lng: defaultCoords[1], 
    zoom: currentLocation?.zoom || 12 
  });

  // Layer Toggles
  const [showHazardsLayer, setShowHazardsLayer] = useState(true);
  const [showHabitationsLayer, setShowHabitationsLayer] = useState(true);
  const [showSafeZonesLayer, setShowSafeZonesLayer] = useState(true);
  const [showRoutesLayer, setShowRoutesLayer] = useState(true);
  const [showIncidentsLayer, setShowIncidentsLayer] = useState(true);
  const [showRescueLayer, setShowRescueLayer] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Inspected objects
  const [inspectedHazard, setInspectedHazard] = useState<HazardArea | null>(null);
  const [inspectedHabitation, setInspectedHabitation] = useState<Habitation | null>(null);
  const [inspectedSafeZone, setInspectedSafeZone] = useState<SafeZone | null>(null);
  const [inspectedIncident, setInspectedIncident] = useState<Incident | null>(null);
  const [inspectedRescue, setInspectedRescue] = useState<CitizenRescueRequest | null>(null);

  // Live store data
  const [incidents, setIncidents] = useState<Incident[]>(() => emergencyStore.getIncidents());
  const [rescueRequests, setRescueRequests] = useState<CitizenRescueRequest[]>(() => emergencyStore.getRescueRequests());

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      const loc = emergencyStore.getCurrentLocation();
      setCurrentLocation(loc);
      setCurrentRadius(emergencyStore.getLocationRadius());
      setHazards(emergencyStore.getHazards());
      setHabitations(emergencyStore.getHabitations());
      setSafeZones(emergencyStore.getSafeZones());
      setRoutes(emergencyStore.getRelocationRoutes());
      setIncidents(emergencyStore.getIncidents());
      setRescueRequests(emergencyStore.getRescueRequests());
    });
  }, []);

  // When location changes in store, automatically recenter and animate map
  useEffect(() => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentLocation.coordinates, currentLocation.zoom || 12, {
        duration: 1.2,
      });
      setCoordinates({
        lat: currentLocation.coordinates[0],
        lng: currentLocation.coordinates[1],
        zoom: currentLocation.zoom || 12,
      });
    }
  }, [currentLocation]);

  // Basemap Tile Sources
  const basemapUrls: Record<BasemapType, { name: string; url: string; attribution: string; maxZoom?: number }> = {
    satellite: {
      name: 'High-Res Satellite (Esri)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    },
    standard: {
      name: 'Standard Cartography (OSM)',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
    },
    terrain: {
      name: 'Topographical Relief (OpenTopo)',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: OpenTopoMap',
      maxZoom: 17,
    },
    natural: {
      name: 'Natural Earth (Carto Voyager)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCoords = currentLocation?.coordinates || [30.45, 79.40];

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Add initial base tile layer
    const baseConfig = basemapUrls[currentBasemap];
    const baseLayer = L.tileLayer(baseConfig.url, {
      maxZoom: baseConfig.maxZoom || 19,
      attribution: baseConfig.attribution,
    }).addTo(map);
    baseTileLayerRef.current = baseLayer;

    // Create Layer Groups
    const hazardsGroup = L.layerGroup().addTo(map);
    const habitationsGroup = L.layerGroup().addTo(map);
    const safeZonesGroup = L.layerGroup().addTo(map);
    const routesGroup = L.layerGroup().addTo(map);
    const incidentsGroup = L.layerGroup().addTo(map);
    const rescueGroup = L.layerGroup().addTo(map);

    layersGroupRef.current = {
      hazards: hazardsGroup,
      habitations: habitationsGroup,
      safeZones: safeZonesGroup,
      routes: routesGroup,
      incidents: incidentsGroup,
      rescue: rescueGroup,
    };

    // Track mouse coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCoordinates({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
        zoom: map.getZoom(),
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    const config = basemapUrls[currentBasemap];
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom || 19,
      attribution: config.attribution,
    }).addTo(mapInstanceRef.current);
    
    newLayer.bringToBack();
    baseTileLayerRef.current = newLayer;
  }, [currentBasemap]);

  // Render Vector Layers
  useEffect(() => {
    const groups = layersGroupRef.current;
    if (!groups || !mapInstanceRef.current) return;

    // 1. HAZARDS LAYER
    groups.hazards.clearLayers();
    if (showHazardsLayer) {
      hazards.forEach((hazard) => {
        const isCrit = hazard.severity === 'CRITICAL';
        const color = isCrit ? '#ef4444' : hazard.severity === 'HIGH' ? '#f97316' : '#eab308';

        const polygon = L.polygon(hazard.polygonPoints, {
          color: color,
          weight: isCrit ? 3 : 2,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: 0.35,
        });

        polygon.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: ${color};">${hazard.name}</div>
            <div style="color: #cbd5e1;">${hazard.type} &bull; ${hazard.severity}</div>
            <div style="color: #94a3b8; font-size: 10px;">Exposed: ${hazard.affectedPopulation.toLocaleString()} people</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        polygon.on('click', () => {
          setInspectedHazard(hazard);
          setInspectedHabitation(null);
          setInspectedSafeZone(null);
          setInspectedIncident(null);
          setInspectedRescue(null);
        });

        polygon.addTo(groups.hazards);
      });
    }

    // 2. HABITATIONS LAYER
    groups.habitations.clearLayers();
    if (showHabitationsLayer) {
      habitations.forEach((hab) => {
        const isCrit = hab.riskLevel === 'CRITICAL';
        const color = isCrit ? '#ef4444' : hab.riskLevel === 'HIGH' ? '#f97316' : '#eab308';

        const htmlIcon = `
          <div style="
            width: ${isCrit ? '22px' : '18px'};
            height: ${isCrit ? '22px' : '18px'};
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="width: 5px; height: 5px; border-radius: 50%; background-color: #ffffff;"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: htmlIcon,
          className: 'habitation-gis-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(hab.coordinates, { icon: customIcon });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: #ffffff;">${hab.name}</div>
            <div style="color: ${color}; font-weight: 600;">${hab.riskLevel} RISK (Pop: ${hab.population.toLocaleString()})</div>
            <div style="color: #94a3b8; font-size: 10px;">Safe Capacity: ${hab.safeCapacity} (${hab.capacityUtilization}% load)</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        marker.on('click', () => {
          setInspectedHabitation(hab);
          setInspectedHazard(null);
          setInspectedSafeZone(null);
          setInspectedIncident(null);
          setInspectedRescue(null);
        });

        marker.addTo(groups.habitations);
      });
    }

    // 3. SAFE ZONES LAYER
    groups.safeZones.clearLayers();
    if (showSafeZonesLayer) {
      safeZones.forEach((sz) => {
        const htmlIcon = `
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 6px;
            background-color: #10b981;
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
          ">
            ✚
          </div>
        `;

        const customIcon = L.divIcon({
          html: htmlIcon,
          className: 'safezone-gis-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(sz.coordinates, { icon: customIcon });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: #34d399;">🛡️ ${sz.name}</div>
            <div style="color: #f1f5f9;">Avail. Capacity: ${sz.availableCapacity.toLocaleString()} beds</div>
            <div style="color: #94a3b8; font-size: 10px;">${sz.distanceKm || ''} km &bull; ${sz.travelTimeMin || ''} min transit</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        marker.on('click', () => {
          setInspectedSafeZone(sz);
          setInspectedHazard(null);
          setInspectedHabitation(null);
          setInspectedIncident(null);
          setInspectedRescue(null);
        });

        marker.addTo(groups.safeZones);
      });
    }

    // 4. EVACUATION CORRIDORS / ROUTES + LOCATION CENTER BUFFER
    groups.routes.clearLayers();
    if (showRoutesLayer) {
      routes.forEach((route) => {
        const glowLine = L.polyline(route.waypoints, {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.8,
          lineCap: 'round',
        });

        const dashLine = L.polyline(route.waypoints, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          dashArray: '6, 8',
        });

        dashLine.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: #22d3ee;">🚀 ${route.name}</div>
            <div style="color: #cbd5e1;">${route.distanceKm} km &bull; ${route.travelTimeMinutes} min</div>
            <div style="color: #34d399; font-size: 10px;">Corridor: ${route.status}</div>
          </div>
        `, { sticky: true });

        glowLine.addTo(groups.routes);
        dashLine.addTo(groups.routes);
      });

      // Render center pin and spatial analysis buffer circle for current location
      if (currentLocation) {
        const centerIcon = L.divIcon({
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: rgba(6, 182, 212, 0.25);
              border: 2px solid #06b6d4;
              box-shadow: 0 0 16px rgba(6, 182, 212, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #22d3ee;"></div>
            </div>
          `,
          className: 'command-analysis-center-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const centerMarker = L.marker(currentLocation.coordinates, { icon: centerIcon });
        centerMarker.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: #22d3ee;">📍 Incident Command Analysis Center</div>
            <div style="color: #ffffff;">${currentLocation.name}, ${currentLocation.district || ''}</div>
            <div style="color: #94a3b8; font-size: 10px;">Buffer Radius: ${currentRadius} km</div>
          </div>
        `, { sticky: true });
        centerMarker.addTo(groups.routes);

        // Circular operational buffer boundary
        L.circle(currentLocation.coordinates, {
          radius: currentRadius * 1000,
          color: '#06b6d4',
          weight: 1.5,
          dashArray: '6, 6',
          fillColor: '#06b6d4',
          fillOpacity: 0.05,
          interactive: false,
        }).addTo(groups.routes);
      }
    }

    // 5. CITIZEN INCIDENT REPORTS LAYER
    groups.incidents.clearLayers();
    if (showIncidentsLayer) {
      incidents.forEach((inc) => {
        const isCrit = inc.severity === 'CRITICAL';
        const color = isCrit ? '#ef4444' : inc.severity === 'HIGH' ? '#f97316' : '#3b82f6';

        const htmlIcon = `
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 11px;
            color: #ffffff;
            font-weight: bold;
          ">
            !
          </div>
        `;

        const customIcon = L.divIcon({
          html: htmlIcon,
          className: 'incident-gis-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(inc.coordinates, { icon: customIcon });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: ${color};">⚠️ Incident #${inc.id}</div>
            <div style="color: #ffffff; font-weight: 500;">${inc.title}</div>
            <div style="color: #94a3b8; font-size: 10px;">${inc.location} &bull; ${inc.status}</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        marker.on('click', () => {
          setInspectedIncident(inc);
          setInspectedHazard(null);
          setInspectedHabitation(null);
          setInspectedSafeZone(null);
          setInspectedRescue(null);
        });

        marker.addTo(groups.incidents);
      });
    }

    // 6. SOS RESCUE REQUESTS LAYER
    groups.rescue.clearLayers();
    if (showRescueLayer) {
      rescueRequests.forEach((res) => {
        const isPending = res.status === 'SUBMITTED';
        const color = isPending ? '#dc2626' : '#f59e0b';

        const htmlIcon = `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 0 14px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #ffffff;
            font-size: 12px;
            animation: pulse 1.5s infinite;
          ">
            🆘
          </div>
        `;

        const customIcon = L.divIcon({
          html: htmlIcon,
          className: 'rescue-gis-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker(res.coordinates, { icon: customIcon });

        const totalPeople = (res.peopleCount?.adults || 0) + (res.peopleCount?.children || 0) + (res.peopleCount?.elderlyOrSpecialCare || 0);

        marker.bindTooltip(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px;">
            <div style="font-weight: bold; color: #ef4444;">🚨 RESCUE SOS #${res.id}</div>
            <div style="color: #ffffff;">${res.requesterName} &bull; ${totalPeople || 1} people</div>
            <div style="color: #fbbf24; font-size: 10px;">${res.locationName} &bull; ${res.status}</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        marker.on('click', () => {
          setInspectedRescue(res);
          setInspectedHazard(null);
          setInspectedHabitation(null);
          setInspectedSafeZone(null);
          setInspectedIncident(null);
        });

        marker.addTo(groups.rescue);
      });
    }

  }, [
    showHazardsLayer, 
    showHabitationsLayer, 
    showSafeZonesLayer, 
    showRoutesLayer, 
    showIncidentsLayer, 
    showRescueLayer, 
    hazards,
    habitations,
    safeZones,
    routes,
    currentLocation,
    currentRadius,
    incidents, 
    rescueRequests
  ]);

  // Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const q = searchQuery.toLowerCase();
    
    // Check Habitations
    const matchedHab = habitations.find(h => h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q));
    if (matchedHab) {
      mapInstanceRef.current.flyTo(matchedHab.coordinates, 13, { duration: 1.2 });
      setInspectedHabitation(matchedHab);
      return;
    }

    // Check Safe Zones
    const matchedSafe = safeZones.find(s => s.name.toLowerCase().includes(q) || s.district.toLowerCase().includes(q));
    if (matchedSafe) {
      mapInstanceRef.current.flyTo(matchedSafe.coordinates, 13, { duration: 1.2 });
      setInspectedSafeZone(matchedSafe);
      return;
    }

    // Check Hazards
    const matchedHazard = hazards.find(h => h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q));
    if (matchedHazard) {
      mapInstanceRef.current.flyTo(matchedHazard.center, 12, { duration: 1.2 });
      setInspectedHazard(matchedHazard);
      return;
    }

    // Check Incidents
    const matchedInc = incidents.find(i => i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
    if (matchedInc) {
      mapInstanceRef.current.flyTo(matchedInc.coordinates, 13, { duration: 1.2 });
      setInspectedIncident(matchedInc);
      return;
    }
  };

  const handleResetToJurisdiction = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentLocation?.coordinates || [22.0667, 88.0698], currentLocation?.zoom || 11, { duration: 1.0 });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.hazardMap}
        darkMode={darkMode}
        alt="Hazard Map GIS Background"
      />

      {/* Main Container */}
      <div className="relative z-10 p-4 sm:p-6 flex-1 flex flex-col space-y-4 max-w-[1800px] w-full mx-auto">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold font-mono mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>GEOSPATIAL HAZARD &amp; LOGISTICS GIS</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Interactive Regional Hazard Map
            </h1>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Multi-layer operational GIS displaying live hazard contours, exposed habitations, relief safe zones, and citizen SOS requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('relocation')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open Relocation Engine</span>
            </button>
            <button
              onClick={() => onNavigateTab('incidents')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                darkMode 
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/80' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Incidents Desk ({incidents.length + rescueRequests.length})</span>
            </button>
          </div>
        </div>

        {/* Map Stage */}
        <div 
          className={`relative w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[650px] lg:h-[720px]'
          } ${
            darkMode ? 'border-slate-800/90 shadow-2xl shadow-black/40' : 'border-slate-300/80 shadow-xl'
          }`}
        >
          {/* Leaflet DOM */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Top-left: Global Authority Location Search + Entity Filter */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-[92vw]">
            <AuthorityLocationSearch 
              darkMode={true} 
              compact={true}
              onLocationSelected={(loc) => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(loc.coordinates, loc.zoom || 12, { duration: 1.2 });
                }
              }}
            />

            <form onSubmit={handleSearch} className="relative hidden md:block w-48 lg:w-60">
              <input
                type="text"
                placeholder="Find entity on map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-950/90 text-white placeholder-slate-400 border border-slate-700/80 backdrop-blur-md shadow-xl focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>

          {/* Top-right: Controls Bar (Basemaps, Layers, Reset, Fullscreen) */}
          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
            {/* Basemap Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBasemapMenu(!showBasemapMenu);
                  setShowLayerMenu(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950/90 text-white text-xs font-semibold border border-slate-700/80 backdrop-blur-md shadow-xl flex items-center gap-1.5 hover:bg-slate-900 transition-colors cursor-pointer"
                title="Select Basemap Cartography"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Basemap</span>
              </button>

              {showBasemapMenu && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-slate-950/95 border border-slate-700/90 p-2 shadow-2xl backdrop-blur-xl space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Select Cartography
                  </div>
                  {(Object.keys(basemapUrls) as BasemapType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setCurrentBasemap(type);
                        setShowBasemapMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currentBasemap === type
                          ? 'bg-rose-600/20 text-rose-400 font-bold border border-rose-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{basemapUrls[type].name}</span>
                      {currentBasemap === type && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Layer Visibility Toggles */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLayerMenu(!showLayerMenu);
                  setShowBasemapMenu(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950/90 text-white text-xs font-semibold border border-slate-700/80 backdrop-blur-md shadow-xl flex items-center gap-1.5 hover:bg-slate-900 transition-colors cursor-pointer"
                title="Toggle GIS Vector Layers"
              >
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Layers</span>
              </button>

              {showLayerMenu && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-slate-950/95 border border-slate-700/90 p-3 shadow-2xl backdrop-blur-xl space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Active Vector Overlays
                  </div>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Hazard Zones (Contours)
                    </span>
                    <input
                      type="checkbox"
                      checked={showHazardsLayer}
                      onChange={(e) => setShowHazardsLayer(e.target.checked)}
                      className="accent-rose-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Habitations (Settlements)
                    </span>
                    <input
                      type="checkbox"
                      checked={showHabitationsLayer}
                      onChange={(e) => setShowHabitationsLayer(e.target.checked)}
                      className="accent-amber-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Safe Zones &amp; Camps
                    </span>
                    <input
                      type="checkbox"
                      checked={showSafeZonesLayer}
                      onChange={(e) => setShowSafeZonesLayer(e.target.checked)}
                      className="accent-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      Evacuation Corridors
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoutesLayer}
                      onChange={(e) => setShowRoutesLayer(e.target.checked)}
                      className="accent-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      Citizen Incident Reports
                    </span>
                    <input
                      type="checkbox"
                      checked={showIncidentsLayer}
                      onChange={(e) => setShowIncidentsLayer(e.target.checked)}
                      className="accent-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                      Rescue SOS Signals
                    </span>
                    <input
                      type="checkbox"
                      checked={showRescueLayer}
                      onChange={(e) => setShowRescueLayer(e.target.checked)}
                      className="accent-red-600"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Recenter Jurisdiction */}
            <button
              onClick={handleResetToJurisdiction}
              className="p-2 rounded-xl bg-slate-950/90 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-xl transition-colors cursor-pointer"
              title="Reset to Active Jurisdiction Center"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-950/90 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Bottom-left: Coordinates HUD */}
          <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-xl bg-slate-950/90 text-slate-300 text-[11px] font-mono border border-slate-700/80 backdrop-blur-md shadow-xl flex items-center gap-3">
            <span>LAT: <strong className="text-white">{coordinates.lat.toFixed(4)}°N</strong></span>
            <span>LON: <strong className="text-white">{coordinates.lng.toFixed(4)}°E</strong></span>
            <span>ZOOM: <strong className="text-cyan-400">{coordinates.zoom}x</strong></span>
            <span className="hidden sm:inline text-slate-400">| EPSG:4326 WGS84</span>
          </div>

          {/* Bottom-right: Tactical Map Legend */}
          <div className="absolute bottom-3 right-3 z-[1000] hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/90 text-slate-300 text-[11px] font-medium border border-slate-700/80 backdrop-blur-md shadow-xl">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Critical Hazard</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Habitation</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Safe Zone</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Incident</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span>SOS Rescue</span>
            </span>
          </div>

          {/* Inspector Slide-over Panel (if anything is clicked) */}
          {(inspectedHazard || inspectedHabitation || inspectedSafeZone || inspectedIncident || inspectedRescue) && (
            <div className="absolute top-14 right-3 z-[1001] w-80 sm:w-96 max-h-[calc(100%-4.5rem)] overflow-y-auto rounded-2xl bg-slate-950/95 border border-slate-700 p-4 shadow-2xl backdrop-blur-xl space-y-3 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                  GIS Element Inspector
                </span>
                <button
                  onClick={() => {
                    setInspectedHazard(null);
                    setInspectedHabitation(null);
                    setInspectedSafeZone(null);
                    setInspectedIncident(null);
                    setInspectedRescue(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspected Hazard Details */}
              {inspectedHazard && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {inspectedHazard.severity} SEVERITY HAZARD
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{inspectedHazard.name}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">{inspectedHazard.type} &bull; Area: {inspectedHazard.affectedAreaSqKm} sq km</p>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px]">{inspectedHazard.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Affected Population</div>
                      <div className="text-sm font-bold text-white font-mono">{inspectedHazard.affectedPopulation.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Threat Status</div>
                      <div className="text-sm font-bold text-rose-400">{inspectedHazard.severity === 'CRITICAL' ? 'ACTIVE DANGER' : 'MONITORED'}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-[11px]">
                    <strong>Recommended SOP:</strong> {inspectedHazard.recommendedAction}
                  </div>
                </div>
              )}

              {/* Inspected Habitation Details */}
              {inspectedHabitation && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {inspectedHabitation.riskLevel} RISK (Score: {inspectedHabitation.riskScore})
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{inspectedHabitation.name}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">{inspectedHabitation.district}, {inspectedHabitation.state}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Population</div>
                      <div className="text-xs font-bold text-white font-mono">{inspectedHabitation.population.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Minors 0-6</div>
                      <div className="text-xs font-bold text-amber-400 font-mono">{inspectedHabitation.children0_6.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Capacity Load</div>
                      <div className="text-xs font-bold text-rose-400 font-mono">{inspectedHabitation.capacityUtilization}%</div>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px]">
                    <strong>Action:</strong> {inspectedHabitation.recommendedAction}
                  </p>

                  <button
                    onClick={() => {
                      if (onSelectHabitationForRelocation) {
                        onSelectHabitationForRelocation(inspectedHabitation);
                      }
                      onNavigateTab('relocation');
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Launch Relocation Engine for this Village</span>
                  </button>
                </div>
              )}

              {/* Inspected Safe Zone Details */}
              {inspectedSafeZone && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      VERIFIED RELIEF SAFE ZONE
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{inspectedSafeZone.name}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">{inspectedSafeZone.district}, {inspectedSafeZone.state}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Available Headroom</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">{inspectedSafeZone.availableCapacity.toLocaleString()} beds</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Total Safe Capacity</div>
                      <div className="text-sm font-bold text-white font-mono">{inspectedSafeZone.safeCapacity.toLocaleString()} beds</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    <div><strong>Facilities:</strong> {inspectedSafeZone.facilities.join(', ')}</div>
                    <div className="mt-1"><strong>Commander:</strong> {inspectedSafeZone.contactPerson} ({inspectedSafeZone.contactPhone})</div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('capacity')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Open Carrying Capacity Logistics</span>
                  </button>
                </div>
              )}

              {/* Inspected Incident Details */}
              {inspectedIncident && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      CITIZEN INCIDENT #{inspectedIncident.id} &bull; {inspectedIncident.status}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{inspectedIncident.title}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">{inspectedIncident.location}</p>
                  </div>

                  {inspectedIncident.imageUrl && (
                    <div className="rounded-xl overflow-hidden max-h-32 border border-slate-800">
                      <img src={inspectedIncident.imageUrl} alt={inspectedIncident.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {inspectedIncident.citizenReportText}
                  </p>

                  <div className="text-[10px] text-slate-400">
                    Reporter: {inspectedIncident.reporterName} ({inspectedIncident.reporterPhone})
                  </div>

                  <button
                    onClick={() => onNavigateTab('incidents')}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Triage at Incidents Desk</span>
                  </button>
                </div>
              )}

              {/* Inspected Rescue Details */}
              {inspectedRescue && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600/20 text-red-400 border border-red-600/40 animate-pulse">
                      🚨 URGENT RESCUE SOS #{inspectedRescue.id}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{inspectedRescue.requesterName}</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">{inspectedRescue.locationName}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                    <div className="text-slate-400 text-[10px]">Trapped Citizens</div>
                    <div className="text-white font-bold font-mono">
                      Adults: {inspectedRescue.peopleCount?.adults || 0} &bull; Children: {inspectedRescue.peopleCount?.children || 0} &bull; Elderly: {inspectedRescue.peopleCount?.elderlyOrSpecialCare || 0}
                    </div>
                  </div>

                  <p className="text-rose-300 text-[11px]">
                    <strong>Message:</strong> {inspectedRescue.message}
                  </p>

                  <div className="text-[10px] text-slate-400">
                    Phone: {inspectedRescue.contactPhone}
                  </div>

                  <button
                    onClick={() => onNavigateTab('incidents')}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>Dispatch Rescue Team Immediately</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
