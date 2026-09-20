import React, { useEffect, useRef, useState } from 'react';
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
  Compass
} from 'lucide-react';
import { HazardArea, Habitation, SafeZone, RelocationRoute, CitizenLocation } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';

interface LeafletGisMapProps {
  height?: string;
  selectedHazard?: HazardArea | null;
  onSelectHazard?: (hazard: HazardArea | null) => void;
  selectedHabitation?: Habitation | null;
  onSelectHabitation?: (habitation: Habitation | null) => void;
  selectedSafeZone?: SafeZone | null;
  onSelectSafeZone?: (safeZone: SafeZone | null) => void;
  onLaunchRelocationFor?: (habitation: Habitation) => void;
  activeRouteId?: string;
}

type BasemapType = 'standard' | 'satellite' | 'natural' | 'terrain';

export const LeafletGisMap: React.FC<LeafletGisMapProps> = ({
  height = '600px',
  selectedHazard: externalSelectedHazard,
  onSelectHazard,
  selectedHabitation: externalSelectedHabitation,
  onSelectHabitation,
  selectedSafeZone: externalSelectedSafeZone,
  onSelectSafeZone,
  onLaunchRelocationFor,
  activeRouteId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<{
    hazards: L.LayerGroup;
    habitations: L.LayerGroup;
    safeZones: L.LayerGroup;
    routes: L.LayerGroup;
  } | null>(null);

  const [currentLocation, setCurrentLocation] = useState<CitizenLocation | null>(
    () => emergencyStore.getCurrentLocation()
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
  const [currentRadius, setCurrentRadius] = useState<number>(
    () => emergencyStore.getLocationRadius()
  );

  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>('satellite');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const defaultCoords = currentLocation?.coordinates || [22.0667, 88.0698];
  const [coordinates, setCoordinates] = useState({ 
    lat: defaultCoords[0], 
    lng: defaultCoords[1], 
    zoom: currentLocation?.zoom || 11 
  });

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      const loc = emergencyStore.getCurrentLocation();
      setCurrentLocation(loc);
      setHazards(emergencyStore.getHazards());
      setHabitations(emergencyStore.getHabitations());
      setSafeZones(emergencyStore.getSafeZones());
      setRoutes(emergencyStore.getRelocationRoutes());
      setCurrentRadius(emergencyStore.getLocationRadius());
    });
  }, []);

  // When location changes, fly map
  useEffect(() => {
    if (currentLocation && currentLocation.coordinates && !isNaN(currentLocation.coordinates[0]) && !isNaN(currentLocation.coordinates[1]) && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentLocation.coordinates, currentLocation.zoom || 11, {
        duration: 1.2,
      });
      setCoordinates({
        lat: currentLocation.coordinates[0],
        lng: currentLocation.coordinates[1],
        zoom: currentLocation.zoom || 11,
      });
    }
  }, [currentLocation]);

  // Layer Visibility Toggles
  const [showHazardsLayer, setShowHazardsLayer] = useState(true);
  const [showHabitationsLayer, setShowHabitationsLayer] = useState(true);
  const [showSafeZonesLayer, setShowSafeZonesLayer] = useState(true);
  const [showRoutesLayer, setShowRoutesLayer] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Active side panel inspection
  const [inspectedHazard, setInspectedHazard] = useState<HazardArea | null>(null);
  const [inspectedHabitation, setInspectedHabitation] = useState<Habitation | null>(null);
  const [inspectedSafeZone, setInspectedSafeZone] = useState<SafeZone | null>(null);

  // Sync external selections
  useEffect(() => {
    if (externalSelectedHazard) {
      setInspectedHazard(externalSelectedHazard);
      setInspectedHabitation(null);
      setInspectedSafeZone(null);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(externalSelectedHazard.center, 12, { duration: 1.2 });
      }
    }
  }, [externalSelectedHazard]);

  useEffect(() => {
    if (externalSelectedHabitation) {
      setInspectedHabitation(externalSelectedHabitation);
      setInspectedHazard(null);
      setInspectedSafeZone(null);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(externalSelectedHabitation.coordinates, 13, { duration: 1.2 });
      }
    }
  }, [externalSelectedHabitation]);

  useEffect(() => {
    if (externalSelectedSafeZone) {
      setInspectedSafeZone(externalSelectedSafeZone);
      setInspectedHazard(null);
      setInspectedHabitation(null);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(externalSelectedSafeZone.coordinates, 13, { duration: 1.2 });
      }
    }
  }, [externalSelectedSafeZone]);

  // Working Basemap Tile Sources
  const basemapUrls: Record<BasemapType, { url: string; attribution: string; maxZoom?: number }> = {
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
    natural: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
      maxZoom: 17,
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Uttarakhand Chamoli / Joshimath valley (matches reference image!)
    const map = L.map(mapContainerRef.current, {
      center: [30.4500, 79.4000],
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Add initial base tile layer (Satellite default for cinematic GIS)
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

    layersGroupRef.current = {
      hazards: hazardsGroup,
      habitations: habitationsGroup,
      safeZones: safeZonesGroup,
      routes: routesGroup,
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

  // Update Basemap Tiles when selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    const config = basemapUrls[currentBasemap];
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom || 19,
      attribution: config.attribution,
    }).addTo(mapInstanceRef.current);
    
    // Ensure base layer is behind vectors
    newLayer.bringToBack();
    baseTileLayerRef.current = newLayer;
  }, [currentBasemap]);

  // Render Vector Layers
  useEffect(() => {
    const groups = layersGroupRef.current;
    if (!groups || !mapInstanceRef.current) return;

    // 1. HAZARD ZONES (Polygons)
    groups.hazards.clearLayers();

    // Render operational radius buffer and center pin if location exists
    if (currentLocation && currentLocation.coordinates && !isNaN(currentLocation.coordinates[0]) && !isNaN(currentLocation.coordinates[1])) {
      const bufferCircle = L.circle(currentLocation.coordinates, {
        radius: (currentRadius || 40) * 1000,
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#06b6d4',
        fillOpacity: 0.05,
      });
      bufferCircle.bindTooltip(`
        <div class="font-sans text-xs">
          <div class="font-bold text-cyan-400">Tactical Buffer: ${currentRadius || 40} km</div>
          <div class="text-slate-300">Centered on ${currentLocation.name}</div>
        </div>
      `, { sticky: true });
      bufferCircle.addTo(groups.hazards);

      // Center Pin
      const centerIconHtml = `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: radial-gradient(circle, #f43f5e 40%, #881337 100%);
          border: 3px solid #ffffff;
          box-shadow: 0 0 20px rgba(244, 63, 94, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
        ">
          ★
        </div>
      `;
      const centerIcon = L.divIcon({
        html: centerIconHtml,
        className: 'eoc-center-gis-pin',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const centerMarker = L.marker(currentLocation.coordinates, { icon: centerIcon, zIndexOffset: 1000 });
      centerMarker.bindTooltip(`
        <div class="font-sans text-xs">
          <div class="font-bold text-rose-400">★ Operational Command Sector</div>
          <div class="text-white">${currentLocation.name}, ${currentLocation.district}</div>
        </div>
      `, { sticky: true });
      centerMarker.addTo(groups.hazards);
    }

    if (showHazardsLayer) {
      hazards.forEach((hazard) => {
        const color = 
          hazard.severity === 'CRITICAL' ? '#ef4444' :
          hazard.severity === 'HIGH' ? '#f97316' :
          hazard.severity === 'MODERATE' ? '#eab308' : '#22c55e';

        const polygon = L.polygon(hazard.polygonPoints, {
          color: color,
          weight: 2.5,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: 0.35,
          className: hazard.severity === 'CRITICAL' ? 'pulse-hazard-red' : '',
        });

        polygon.bindTooltip(`
          <div class="font-sans text-xs">
            <div class="font-bold text-rose-500">${hazard.name}</div>
            <div class="text-slate-300">${hazard.type} • Severity: ${hazard.severity}</div>
            <div class="text-slate-400 text-[10px]">Pop. Exposed: ${hazard.affectedPopulation.toLocaleString()}</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        polygon.on('click', () => {
          setInspectedHazard(hazard);
          setInspectedHabitation(null);
          setInspectedSafeZone(null);
          if (onSelectHazard) onSelectHazard(hazard);
        });

        polygon.addTo(groups.hazards);
      });
    }

    // 2. HABITATIONS (Custom Pulsing Circular Markers)
    groups.habitations.clearLayers();
    if (showHabitationsLayer) {
      habitations.forEach((hab) => {
        const isCritical = hab.riskLevel === 'CRITICAL';
        const color = 
          hab.riskLevel === 'CRITICAL' ? '#ef4444' :
          hab.riskLevel === 'HIGH' ? '#f97316' :
          hab.riskLevel === 'MODERATE' ? '#eab308' : '#22c55e';

        const htmlIcon = `
          <div style="
            width: ${isCritical ? '24px' : '18px'};
            height: ${isCritical ? '24px' : '18px'};
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            ${isCritical ? 'animation: hazardPulse 2s infinite;' : ''}
          ">
            <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: htmlIcon,
          className: 'habitation-gis-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(hab.coordinates, { icon: customIcon });

        marker.bindTooltip(`
          <div class="font-sans text-xs">
            <div class="font-bold text-slate-100">${hab.name}</div>
            <div class="text-rose-400 font-semibold">${hab.riskLevel} RISK (Pop: ${hab.population.toLocaleString()})</div>
            <div class="text-slate-400 text-[10px]">Utilization: ${hab.capacityUtilization}% (${hab.capacityStatus})</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        marker.on('click', () => {
          setInspectedHabitation(hab);
          setInspectedHazard(null);
          setInspectedSafeZone(null);
          if (onSelectHabitation) onSelectHabitation(hab);
        });

        marker.addTo(groups.habitations);
      });
    }

    // 3. SAFE ZONES (Green Destination Markers)
    groups.safeZones.clearLayers();
    if (showSafeZonesLayer) {
      safeZones.forEach((sz) => {
        const htmlIcon = `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 6px;
            background-color: #16a34a;
            border: 2px solid #ffffff;
            box-shadow: 0 0 14px rgba(34, 197, 94, 0.8);
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
          className: 'safezone-gis-marker pulse-safe-green',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker(sz.coordinates, { icon: customIcon });

        marker.bindTooltip(`
          <div class="font-sans text-xs">
            <div class="font-bold text-emerald-400">🛡️ ${sz.name}</div>
            <div class="text-slate-200">Avail. Capacity: ${sz.availableCapacity.toLocaleString()} beds</div>
            <div class="text-slate-400 text-[10px]">${sz.distanceKm} km away • ${sz.travelTimeMin} min</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        marker.on('click', () => {
          setInspectedSafeZone(sz);
          setInspectedHazard(null);
          setInspectedHabitation(null);
          if (onSelectSafeZone) onSelectSafeZone(sz);
        });

        marker.addTo(groups.safeZones);
      });
    }

    // 4. RELOCATION ROUTES (Animated Polyline)
    groups.routes.clearLayers();
    if (showRoutesLayer) {
      routes.forEach((route) => {
        const isTarget = activeRouteId ? route.id === activeRouteId : true;

        // Base glow line
        const glowLine = L.polyline(route.waypoints, {
          color: isTarget ? '#00f0ff' : '#0284c7',
          weight: isTarget ? 6 : 4,
          opacity: isTarget ? 0.95 : 0.6,
          lineCap: 'round',
          className: 'glowing-route-cyan',
        });

        // Animated dashed line on top
        const dashLine = L.polyline(route.waypoints, {
          color: '#ffffff',
          weight: 2.5,
          opacity: 0.95,
          dashArray: '8, 8',
          className: 'animated-route-line',
        });

        dashLine.bindTooltip(`
          <div class="font-sans text-xs">
            <div class="font-bold text-cyan-400">🚀 ${route.name}</div>
            <div class="text-slate-300">${route.distanceKm} km • ${route.travelTimeMinutes} min travel</div>
            <div class="text-emerald-400 text-[10px]">Status: ${route.status}</div>
          </div>
        `, { sticky: true });

        glowLine.addTo(groups.routes);
        dashLine.addTo(groups.routes);
      });
    }
  }, [showHazardsLayer, showHabitationsLayer, showSafeZonesLayer, showRoutesLayer, activeRouteId, hazards, habitations, safeZones, routes, currentLocation, currentRadius]);

  // Handle Search Location
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const query = searchQuery.toLowerCase();
    // Match hazard or habitation
    const matchedHab = habitations.find((h: Habitation) => h.name.toLowerCase().includes(query) || h.district.toLowerCase().includes(query));
    if (matchedHab) {
      mapInstanceRef.current.flyTo(matchedHab.coordinates, 13, { duration: 1.2 });
      setInspectedHabitation(matchedHab);
      setInspectedHazard(null);
      setInspectedSafeZone(null);
      return;
    }

    const matchedHazard = hazards.find((h: HazardArea) => h.name.toLowerCase().includes(query) || h.type.toLowerCase().includes(query));
    if (matchedHazard) {
      mapInstanceRef.current.flyTo(matchedHazard.center, 12, { duration: 1.2 });
      setInspectedHazard(matchedHazard);
      setInspectedHabitation(null);
      setInspectedSafeZone(null);
      return;
    }

    const matchedSafe = safeZones.find((s: SafeZone) => s.name.toLowerCase().includes(query));
    if (matchedSafe) {
      mapInstanceRef.current.flyTo(matchedSafe.coordinates, 13, { duration: 1.2 });
      setInspectedSafeZone(matchedSafe);
      setInspectedHazard(null);
      setInspectedHabitation(null);
    }
  };

  // Fly to home view
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([30.4500, 79.4000], 11, { duration: 1.0 });
    }
  };

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top-left: Search Location Input */}
      <div className="absolute top-3 left-3 z-[1000] w-72 sm:w-80">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search location, village, district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-950/90 text-white placeholder-slate-400 border border-slate-700/80 backdrop-blur-md shadow-xl focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Top-right: Professional Basemap Selector */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md flex items-center gap-1">
          {[
            { id: 'standard', label: 'Standard' },
            { id: 'satellite', label: 'Satellite' },
            { id: 'natural', label: 'Natural' },
            { id: 'terrain', label: 'Terrain' },
          ].map((bm) => (
            <button
              key={bm.id}
              onClick={() => setCurrentBasemap(bm.id as BasemapType)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                currentBasemap === bm.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>

        {/* Fullscreen & Reset */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md flex items-center gap-1">
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
            title="Reset to Uttarakhand Sector"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Right: GIS Layer Controls */}
      <div className="absolute top-16 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:bg-slate-800 backdrop-blur-md shadow-xl flex items-center justify-center"
          title="Toggle GIS Layers"
        >
          <Layers className="w-4 h-4 text-rose-500" />
        </button>

        {showLayerMenu && (
          <div className="bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md w-56 text-slate-200 text-xs space-y-2">
            <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
              Active GIS Overlays
            </div>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span>Hazard Red Zones</span>
              </span>
              <input
                type="checkbox"
                checked={showHazardsLayer}
                onChange={(e) => setShowHazardsLayer(e.target.checked)}
                className="rounded accent-rose-600"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Habitations at Risk</span>
              </span>
              <input
                type="checkbox"
                checked={showHabitationsLayer}
                onChange={(e) => setShowHabitationsLayer(e.target.checked)}
                className="rounded accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>Designated Safe Zones</span>
              </span>
              <input
                type="checkbox"
                checked={showSafeZonesLayer}
                onChange={(e) => setShowSafeZonesLayer(e.target.checked)}
                className="rounded accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="flex items-center gap-2">
                <span className="w-3 h-1 bg-cyan-400" />
                <span>Evacuation Corridors</span>
              </span>
              <input
                type="checkbox"
                checked={showRoutesLayer}
                onChange={(e) => setShowRoutesLayer(e.target.checked)}
                className="rounded accent-cyan-500"
              />
            </label>
          </div>
        )}
      </div>

      {/* Bottom-left: High-Contrast Visual Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 border border-slate-800/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-[11px] text-slate-300 max-w-xs space-y-1.5">
        <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 font-mono">
          Legend
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-rose-500/80 border border-rose-400" />
            <span>Critical Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
            <span>Habitation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-amber-500/80 border border-amber-400" />
            <span>High Risk Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-cyan-400 border-b border-dashed" />
            <span>Relocation Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-yellow-500/80 border border-yellow-400" />
            <span>Moderate Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-400" />
            <span>Safe Zone Enclave</span>
          </div>
        </div>
      </div>

      {/* Bottom-right: GIS Telemetry, Coordinates & Scale */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-950/90 border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-md text-[10px] font-mono text-slate-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-rose-400">
          <Compass className="w-3 h-3 text-rose-500" />
          <span className="font-bold tracking-wider">RESQZONE GIS</span>
        </div>
        <div className="text-slate-400">
          {coordinates.lat}° N, {coordinates.lng}° E
        </div>
        <div className="hidden sm:block text-slate-500">|</div>
        <div className="hidden sm:block text-slate-400">
          Z{coordinates.zoom} • 1:25,000
        </div>
        <div className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          Prototype GIS Data
        </div>
      </div>

      {/* Interactive Side Drawer Panel (Triggered by clicking Hazard, Habitation, or Safe Zone) */}
      {(inspectedHazard || inspectedHabitation || inspectedSafeZone) && (
        <div className="absolute top-14 bottom-14 right-3 z-[1001] w-80 sm:w-96 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-slate-100 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-rose-400">
              <Info className="w-4 h-4" />
              <span>
                {inspectedHazard && 'Hazard Zone Telemetry'}
                {inspectedHabitation && 'Habitation Risk Profile'}
                {inspectedSafeZone && 'Safe Enclave Logistics'}
              </span>
            </div>
            <button
              onClick={() => {
                setInspectedHazard(null);
                setInspectedHabitation(null);
                setInspectedSafeZone(null);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* HAZARD INSPECTION VIEW */}
          {inspectedHazard && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden h-32 border border-slate-800">
                <img 
                  src={inspectedHazard.imageUrl} 
                  alt={inspectedHazard.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                  {inspectedHazard.severity}
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white leading-tight">
                  {inspectedHazard.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  ID: {inspectedHazard.id} • Reported {inspectedHazard.reportedTime}
                </p>
              </div>

              {/* Risk meter */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Composite Risk Score</span>
                  <span className="text-rose-400 font-mono">{inspectedHazard.riskScore} / 10</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-full"
                    style={{ width: `${(inspectedHazard.riskScore / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Grid metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Affected Area</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {inspectedHazard.affectedAreaSqKm} km²
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Population Exposed</div>
                  <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
                    {inspectedHazard.affectedPopulation.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Habitations Count</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {inspectedHazard.affectedHabitationsCount}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Primary Hazard</div>
                  <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                    {inspectedHazard.type}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-rose-400 mb-1">Recommended Operation:</div>
                <p className="leading-relaxed">{inspectedHazard.recommendedAction}</p>
              </div>
            </div>
          )}

          {/* HABITATION INSPECTION VIEW */}
          {inspectedHabitation && (
            <div className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-1.5">
                  {inspectedHabitation.riskLevel} RISK • {inspectedHabitation.vulnerability} VULNERABILITY
                </div>
                <h4 className="text-lg font-bold text-white leading-tight">
                  {inspectedHabitation.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inspectedHabitation.district} District, {inspectedHabitation.state}
                </p>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Source: {inspectedHabitation.source}
                </div>
              </div>

              {/* Population & demographics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Exposed Population</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {inspectedHabitation.population.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Children (0-6 Yrs)</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {inspectedHabitation.children0_6.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Households</div>
                  <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                    {inspectedHabitation.households.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Local Safe Capacity</div>
                  <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                    {inspectedHabitation.safeCapacity.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Carrying capacity warning */}
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-rose-400">
                  <span>Capacity Deficit Status:</span>
                  <span>{inspectedHabitation.capacityStatus} ({inspectedHabitation.capacityUtilization}%)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Local safe space cannot accommodate {inspectedHabitation.population - inspectedHabitation.safeCapacity} residents. Priority relocation required.
                </p>
              </div>

              {/* Launch Relocation Engine button */}
              {onLaunchRelocationFor && (
                <button
                  onClick={() => onLaunchRelocationFor(inspectedHabitation)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Launch Relocation Engine for this Village</span>
                </button>
              )}
            </div>
          )}

          {/* SAFE ZONE INSPECTION VIEW */}
          {inspectedSafeZone && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden h-32 border border-slate-800">
                <img 
                  src={inspectedSafeZone.imageUrl} 
                  alt={inspectedSafeZone.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                  {inspectedSafeZone.status}
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white leading-tight">
                  {inspectedSafeZone.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Type: {inspectedSafeZone.type} • {inspectedSafeZone.district}, {inspectedSafeZone.state}
                </p>
              </div>

              {/* Capacity bar */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Available Bed Spaces</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {inspectedSafeZone.availableCapacity.toLocaleString()} / {inspectedSafeZone.safeCapacity.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${((inspectedSafeZone.safeCapacity - inspectedSafeZone.availableCapacity) / inspectedSafeZone.safeCapacity) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Distance</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {inspectedSafeZone.distanceKm} km
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-[10px] text-slate-400">Est. Travel Time</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                    {inspectedSafeZone.travelTimeMin} min
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-slate-400 font-semibold">Available Facilities:</div>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedSafeZone.facilities.map((fac, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px]">Camp In-Charge:</div>
                <div className="font-semibold text-slate-200 mt-0.5">{inspectedSafeZone.contactPerson}</div>
                <a href={`tel:${inspectedSafeZone.contactPhone}`} className="text-cyan-400 text-[11px] font-mono mt-0.5 block hover:underline">
                  {inspectedSafeZone.contactPhone}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
