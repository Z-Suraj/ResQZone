import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw, 
  Truck, 
  Bus, 
  Plane, 
  Footprints, 
  LifeBuoy, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  TrendingDown, 
  Sparkles, 
  ArrowRight, 
  Activity,
  Send,
  Radio,
  Scale
} from 'lucide-react';
import { Habitation, SafeZone, RelocationRoute } from '../../types';
import { DEMO_HABITATIONS } from '../../data/demoHabitations';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { DEMO_ROUTES } from '../../data/demoRoutes';
import { emergencyStore } from '../../services/emergencyStore';
import { IMAGES } from '../../data/assets';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';

interface RelocationEngineViewProps {
  initialHabitation?: Habitation | null;
  initialSafeZone?: SafeZone | null;
  darkMode: boolean;
}

export const RelocationEngineView: React.FC<RelocationEngineViewProps> = ({
  initialHabitation,
  initialSafeZone,
  darkMode,
}) => {
  // Origin Habitation & Destination Safe Zone
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>(
    initialHabitation ? initialHabitation.id : DEMO_HABITATIONS[0].id
  );
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState<string>(
    initialSafeZone ? initialSafeZone.id : DEMO_SAFE_ZONES[0].id
  );

  // When initial props change
  useEffect(() => {
    if (initialHabitation) setSelectedHabitationId(initialHabitation.id);
  }, [initialHabitation]);

  useEffect(() => {
    if (initialSafeZone) setSelectedSafeZoneId(initialSafeZone.id);
  }, [initialSafeZone]);

  // Transport mode
  const [transportMode, setTransportMode] = useState<'BUS' | 'TRUCK' | 'HELICOPTER' | 'FOOT' | 'BOAT'>('BUS');
  const [evacuationPriority, setEvacuationPriority] = useState<'IMMEDIATE' | 'HIGH' | 'STAGED'>('IMMEDIATE');
  const [safeRouteOptimization, setSafeRouteOptimization] = useState(true);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0); // 0 to 100%
  const [activeStage, setActiveStage] = useState(1);
  const [directiveIssued, setDirectiveIssued] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Current Origin & Destination objects
  const originHabitation = DEMO_HABITATIONS.find(h => h.id === selectedHabitationId) || DEMO_HABITATIONS[0];
  const targetSafeZone = DEMO_SAFE_ZONES.find(s => s.id === selectedSafeZoneId) || DEMO_SAFE_ZONES[0];
  const activeRoute = DEMO_ROUTES.find(r => r.fromHabitationId === originHabitation.id) || DEMO_ROUTES[0];

  // Leaflet Map Reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const movingMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  // Vehicle Calculator Formulas
  const evacuatingPopulation = originHabitation.population;
  const capacityPerUnit: Record<string, number> = {
    BUS: 50,
    TRUCK: 30,
    HELICOPTER: 18,
    FOOT: 1,
    BOAT: 25,
  };
  const unitCapacity = capacityPerUnit[transportMode];
  const totalVehiclesNeeded = Math.ceil(evacuatingPopulation / unitCapacity);
  const tripsAssumingFleet = Math.ceil(totalVehiclesNeeded / 20); // 20 vehicles in active fleet

  // Candidate safe zones ranked by suitability score
  const rankedCandidateZones = DEMO_SAFE_ZONES.map((sz) => {
    // Suitability formula: Capacity Headroom (40%) + Distance (40%) + Low Hazard (20%)
    const dist = Math.sqrt(
      Math.pow(sz.coordinates[0] - originHabitation.coordinates[0], 2) +
      Math.pow(sz.coordinates[1] - originHabitation.coordinates[1], 2)
    ) * 111; // rough km

    const capacityRatio = Math.min(1, sz.availableCapacity / evacuatingPopulation);
    const distScore = Math.max(0, 1 - (dist / 100));
    const compositeScore = Math.round((capacityRatio * 50 + distScore * 50));

    return {
      safeZone: sz,
      calculatedDistKm: Math.round(dist * 10) / 10,
      compositeScore,
      isSufficient: sz.availableCapacity >= evacuatingPopulation,
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: originHabitation.coordinates,
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Base satellite tiles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri WorldImagery',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polyline & Markers when origin or destination changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous layers
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    if (movingMarkerRef.current) map.removeLayer(movingMarkerRef.current);
    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current);
    if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);

    const waypoints: [number, number][] = activeRoute.waypoints.length > 0 
      ? activeRoute.waypoints 
      : [originHabitation.coordinates, targetSafeZone.coordinates];

    // Glow line
    const glowLine = L.polyline(waypoints, {
      color: '#06b6d4',
      weight: 5,
      opacity: 0.8,
    }).addTo(map);

    // Dotted line
    const dashLine = L.polyline(waypoints, {
      color: '#ffffff',
      weight: 2,
      opacity: 0.95,
      dashArray: '8, 8',
    }).addTo(map);

    routePolylineRef.current = L.layerGroup([glowLine, dashLine]) as any;

    // Origin marker (Village)
    const originIcon = L.divIcon({
      html: `
        <div style="background-color: #ef4444; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px #ef4444; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: bold;">
          V
        </div>
      `,
      className: 'evac-origin-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    originMarkerRef.current = L.marker(originHabitation.coordinates, { icon: originIcon })
      .bindTooltip(`<b>Origin: ${originHabitation.name}</b><br/>Pop: ${originHabitation.population.toLocaleString()}`, { permanent: true, direction: 'top', offset: [0, -14] })
      .addTo(map);

    // Destination marker (Safe Zone)
    const destIcon = L.divIcon({
      html: `
        <div style="background-color: #10b981; width: 28px; height: 28px; border-radius: 8px; border: 3px solid #ffffff; box-shadow: 0 0 14px #10b981; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white; font-weight: bold;">
          ✚
        </div>
      `,
      className: 'evac-dest-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    destMarkerRef.current = L.marker(targetSafeZone.coordinates, { icon: destIcon })
      .bindTooltip(`<b>Destination: ${targetSafeZone.name}</b><br/>Headroom: ${targetSafeZone.availableCapacity.toLocaleString()} beds`, { permanent: true, direction: 'bottom', offset: [0, 14] })
      .addTo(map);

    // Moving simulation vehicle
    const vehicleIcon = L.divIcon({
      html: `
        <div style="background-color: #f59e0b; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 14px #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 15px;">
          🚌
        </div>
      `,
      className: 'evac-vehicle-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    movingMarkerRef.current = L.marker(waypoints[0], { icon: vehicleIcon }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([originHabitation.coordinates, targetSafeZone.coordinates, ...waypoints]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });

  }, [selectedHabitationId, selectedSafeZoneId]);

  // Simulation Animation Loop
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulationProgress((prev) => {
          if (prev >= 100) {
            setIsSimulating(false);
            setActiveStage(4);
            return 100;
          }
          const next = prev + 2;

          // Update stage
          if (next < 25) setActiveStage(1);
          else if (next < 55) setActiveStage(2);
          else if (next < 85) setActiveStage(3);
          else setActiveStage(4);

          // Update vehicle position along activeRoute waypoints
          const waypoints = activeRoute.waypoints.length > 0 
            ? activeRoute.waypoints 
            : [originHabitation.coordinates, targetSafeZone.coordinates];

          const totalPoints = waypoints.length;
          const pointIndex = Math.min(
            Math.floor((next / 100) * (totalPoints - 1)),
            totalPoints - 1
          );

          if (movingMarkerRef.current && waypoints[pointIndex]) {
            movingMarkerRef.current.setLatLng(waypoints[pointIndex]);
          }

          return next;
        });
      }, 250);
    }

    return () => clearInterval(interval);
  }, [isSimulating, activeRoute]);

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulationProgress(0);
    setActiveStage(1);
    if (movingMarkerRef.current) {
      const waypoints = activeRoute.waypoints.length > 0 
        ? activeRoute.waypoints 
        : [originHabitation.coordinates, targetSafeZone.coordinates];
      movingMarkerRef.current.setLatLng(waypoints[0]);
    }
  };

  const handleIssueEvacuationDirective = () => {
    emergencyStore.createAlert({
      title: `MANDATORY EVACUATION DIRECTIVE: ${originHabitation.name.toUpperCase()}`,
      description: `SEOC Order #EVAC-${Date.now().toString().slice(-4)}: Immediate evacuation ordered for all ${originHabitation.population.toLocaleString()} residents of ${originHabitation.name} to ${targetSafeZone.name} via ${activeRoute.name}. Convoy transport units are now mobilising.`,
      severity: 'CRITICAL',
      region: originHabitation.district,
      affectedHabitations: [originHabitation.name, targetSafeZone.name],
      issuedBy: 'SEOC Evacuation Command & Relief Controller',
    });

    setDirectiveIssued(true);
    setNotificationMsg(`Evacuation directive officially issued for ${originHabitation.name}! CAP sirens & SMS broadcast triggered.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.relocation}
        darkMode={darkMode}
        alt="Relocation Engine Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold font-mono mb-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>MULTIMODAL RELOCATION LOGISTICS ENGINE</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Strategic Relocation &amp; Evacuation Planning
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Pair threatened origin habitations with verified safe destination zones, simulate mountain convoy routes, and issue operational directives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleIssueEvacuationDirective}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-rose-950 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse text-white" />
              <span>Issue Mandatory Evacuation Directive</span>
            </button>
          </div>
        </div>

        {notificationMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Strategic Relocation Pipeline Flow Banner */}
        <div className={`p-4 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md shadow-lg' : 'bg-white border-[#E2E8F0] shadow-xs'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Step 1: Origin Threatened Area */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">1. Origin Area</div>
                <div className={`font-bold truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  {originHabitation.name}
                </div>
                <div className="text-[10px] text-rose-500 font-mono font-bold">
                  {originHabitation.population.toLocaleString()} citizens at risk
                </div>
              </div>
            </div>

            {/* Step 2: Transport Convoy Fleet */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">2. Convoy Mode</div>
                <div className={`font-bold truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  {totalVehiclesNeeded} {transportMode.toLowerCase()}s required
                </div>
                <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  {unitCapacity} pax / unit capacity
                </div>
              </div>
            </div>

            {/* Step 3: Evacuation Route */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">3. Safe Corridor</div>
                <div className={`font-bold truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  {activeRoute.name}
                </div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                  {activeRoute.distanceKm} km &bull; ~{activeRoute.travelTimeMinutes} min transit
                </div>
              </div>
            </div>

            {/* Step 4: Destination Safe Zone */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              targetSafeZone.availableCapacity >= originHabitation.population
                ? darkMode ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/80 border-emerald-200'
                : darkMode ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50/80 border-amber-200'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                targetSafeZone.availableCapacity >= originHabitation.population
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">4. Safe Zone Headroom</div>
                <div className={`font-bold truncate ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  {targetSafeZone.name}
                </div>
                <div className={`text-[10px] font-mono font-bold ${
                  targetSafeZone.availableCapacity >= originHabitation.population ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {targetSafeZone.availableCapacity.toLocaleString()} beds free {targetSafeZone.availableCapacity >= originHabitation.population ? '(Sufficient)' : '(Shortage)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Origin/Dest Controls on Left, Map on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Relocation Parameters (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-5 rounded-2xl border space-y-4 ${
              darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
            }`}>
              {/* Origin Selection */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Origin Habitation (At Risk)
                </label>
                <select
                  value={selectedHabitationId}
                  onChange={(e) => setSelectedHabitationId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-hidden font-semibold ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {DEMO_HABITATIONS.map((hab) => (
                    <option key={hab.id} value={hab.id}>
                      {hab.name} &bull; {hab.district} (Pop: {hab.population.toLocaleString()}, Risk: {hab.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Selection */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Target Recipient Safe Zone
                </label>
                <select
                  value={selectedSafeZoneId}
                  onChange={(e) => setSelectedSafeZoneId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-hidden font-semibold ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-700 text-emerald-400' 
                      : 'bg-slate-50 border-slate-300 text-emerald-700'
                  }`}
                >
                  {DEMO_SAFE_ZONES.map((sz) => (
                    <option key={sz.id} value={sz.id}>
                      {sz.name} &bull; Free Headroom: {sz.availableCapacity.toLocaleString()} beds ({sz.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidate Safe Zones Ranking */}
              <div className="pt-2">
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 font-mono ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Algorithmic Candidate Ranking for {originHabitation.name}
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {rankedCandidateZones.map(({ safeZone, calculatedDistKm, compositeScore, isSufficient }) => (
                    <div
                      key={safeZone.id}
                      onClick={() => setSelectedSafeZoneId(safeZone.id)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        selectedSafeZoneId === safeZone.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                          : darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="truncate max-w-[200px]">
                        <span>{safeZone.name}</span>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {calculatedDistKm} km &bull; {safeZone.availableCapacity.toLocaleString()} beds free
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs text-cyan-400">Score: {compositeScore}%</span>
                        {!isSufficient && <div className="text-[9px] text-rose-400">Capacity Deficit</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transport Convoy Selector */}
              <div className="pt-2">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 font-mono ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Transport Mode
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['BUS', 'TRUCK', 'HELICOPTER', 'FOOT', 'BOAT'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTransportMode(mode)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                        transportMode === mode
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950'
                          : darkMode
                            ? 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'BUS' && <Bus className="w-3.5 h-3.5" />}
                      {mode === 'TRUCK' && <Truck className="w-3.5 h-3.5" />}
                      {mode === 'HELICOPTER' && <Plane className="w-3.5 h-3.5" />}
                      {mode === 'FOOT' && <Footprints className="w-3.5 h-3.5" />}
                      {mode === 'BOAT' && <LifeBuoy className="w-3.5 h-3.5" />}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      isSimulating
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>PAUSE SIMULATION</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>RUN RELOCATION SIMULATION</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetSimulation}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      darkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Reset Simulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Simulation Progress</span>
                    <span className="text-rose-500 font-bold">{simulationProgress}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden border ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: GIS Simulation Map (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                  darkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Live Evacuation GIS Corridor
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                ● Active Evacuation Track: {originHabitation.name} → {targetSafeZone.name}
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative"
            />
          </div>
        </div>

        {/* Below Map: Step-by-Step Evacuation Stages & Vehicle Calculation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vehicle Requirement Calculator (5 cols) */}
          <div className={`lg:col-span-5 p-5 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
              <Truck className="w-4 h-4" />
              <span>Vehicle Requirement Calculator</span>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${
              darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-baseline">
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Evacuees:</span>
                <span className={`text-base font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {evacuatingPopulation.toLocaleString()} People
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Capacity ({transportMode}):</span>
                <span className="text-sm font-bold text-amber-500 font-mono">
                  {unitCapacity} Pax / Unit
                </span>
              </div>

              <div className={`pt-2 border-t flex justify-between items-baseline ${
                darkMode ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Total Vehicles Required:</span>
                <span className="text-lg font-extrabold text-rose-500 font-mono">
                  {totalVehiclesNeeded.toLocaleString()} {transportMode.toLowerCase()}s
                </span>
              </div>

              <div className={`text-[11px] p-2.5 rounded-lg border ${
                darkMode ? 'text-slate-400 bg-slate-900 border-slate-800' : 'text-slate-600 bg-white border-slate-200'
              }`}>
                Deploying an active convoy fleet of 20 {transportMode.toLowerCase()}s requires approx <span className={`font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{tripsAssumingFleet} round-trip cycles</span>.
              </div>
            </div>
          </div>

          {/* Step-by-Step Evacuation Stages (7 cols) */}
          <div className={`lg:col-span-7 p-5 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider font-mono ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Step-by-Step Evacuation Sequence
              </span>
              <span className="text-xs text-rose-500 font-mono font-bold">
                Current: Stage {activeStage} / 4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { stage: 1, title: 'Alert & Muster', desc: 'Siren sound, SMS alert & ward muster point gathering.' },
                { stage: 2, title: 'Transport Boarding', desc: 'Vulnerable priority boarding into convoy vehicles.' },
                { stage: 3, title: 'Corridor Transit', desc: 'Escorted travel through clear mountain bypass.' },
                { stage: 4, title: 'Arrival & Intake', desc: 'Medical triage, tent allocation & food supply.' },
              ].map((st) => {
                const isCurrent = activeStage === st.stage;
                const isPast = activeStage > st.stage;

                return (
                  <div
                    key={st.stage}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-md'
                        : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                        : darkMode
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                      <span>STAGE 0{st.stage}</span>
                      {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                    </div>
                    <div className={`text-xs font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{st.title}</div>
                    <p className={`text-[10px] mt-1 line-clamp-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
