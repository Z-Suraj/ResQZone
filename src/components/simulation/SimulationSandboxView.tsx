import React, { useState, useEffect, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Play, 
  Sparkles, 
  CloudRain, 
  Flame, 
  Users, 
  Truck, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Compass, 
  Layers, 
  Scale, 
  Zap, 
  HelpCircle,
  Train,
  Check,
  Building2,
  Navigation,
  BarChart3
} from 'lucide-react';
import { 
  SimulationParameters, 
  DEFAULT_SIMULATION_PARAMS, 
  SCENARIO_PRESETS, 
  ScenarioPreset, 
  computeSimulationBaseline, 
  runSimulationEngine, 
  setLatestSimulationResult, 
  SimulationRunResult 
} from '../../services/simulationEngine';
import { emergencyStore } from '../../services/emergencyStore';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';
import { AuthorityLocationSearch } from '../common/AuthorityLocationSearch';
import { IMAGES } from '../../data/assets';
import { Habitation, SafeZone, HazardArea, CitizenLocation } from '../../types';

interface SimulationSandboxViewProps {
  onNavigateTab: (tab: string) => void;
  darkMode: boolean;
}

export const SimulationSandboxView: React.FC<SimulationSandboxViewProps> = ({
  onNavigateTab,
  darkMode,
}) => {
  // 1. Live Store Data (Real Data is read-only here)
  const [currentLocation, setCurrentLocation] = useState<CitizenLocation | null>(() => emergencyStore.getCurrentLocation());
  const [habitations, setHabitations] = useState<Habitation[]>(() => emergencyStore.getHabitations());
  const [safeZones, setSafeZones] = useState<SafeZone[]>(() => emergencyStore.getSafeZones());
  const [hazards, setHazards] = useState<HazardArea[]>(() => emergencyStore.getHazards());

  // Listen for real store location & data updates
  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setCurrentLocation(emergencyStore.getCurrentLocation());
      setHabitations(emergencyStore.getHabitations());
      setSafeZones(emergencyStore.getSafeZones());
      setHazards(emergencyStore.getHazards());
    });
  }, []);

  // Compute baseline metrics strictly from real data
  const baseline = useMemo(() => {
    return computeSimulationBaseline(currentLocation, habitations, safeZones, hazards);
  }, [currentLocation, habitations, safeZones, hazards]);

  // 2. Simulation State (Strictly client-side temporary state, never written to DB)
  const [params, setParams] = useState<SimulationParameters>(DEFAULT_SIMULATION_PARAMS);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [activeTimelineHour, setActiveTimelineHour] = useState<number>(2); // T+2h default
  const [hasRunSimulation, setHasRunSimulation] = useState(true);

  // Run simulation engine whenever params change
  const projection = useMemo(() => {
    return runSimulationEngine(params, baseline, habitations, safeZones, currentLocation);
  }, [params, baseline, habitations, safeZones, currentLocation]);

  // Sync to in-memory bus so Copilot can explain it if asked
  useEffect(() => {
    const runResult: SimulationRunResult = {
      id: `SIM-${Date.now()}`,
      runAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationName: baseline.locationName,
      locationDistrict: baseline.district,
      locationCoordinates: currentLocation?.coordinates || [22.0667, 88.0698],
      scenarioTitle: activePresetId 
        ? (SCENARIO_PRESETS.find(p => p.id === activePresetId)?.title || 'Custom Stress Scenario')
        : 'Custom Stress Scenario',
      params,
      baseline,
      projection,
    };
    setLatestSimulationResult(runResult);
  }, [params, baseline, projection, activePresetId, currentLocation]);

  // Param update handlers
  const handleUpdateParam = <K extends keyof SimulationParameters>(key: K, value: SimulationParameters[K]) => {
    setActivePresetId(null);
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    setParams(preset.params);
    triggerComputePulse();
  };

  const handleReset = () => {
    setActivePresetId(null);
    setParams(DEFAULT_SIMULATION_PARAMS);
  };

  const triggerComputePulse = () => {
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
    }, 450);
  };

  const handleAskCopilot = () => {
    onNavigateTab('copilot');
  };

  // Recharts data preparation: Baseline vs Projected
  const comparisonChartData = [
    {
      metric: 'Exposed Citizens',
      Baseline: baseline.totalExposedPopulation,
      Projected: projection.projectedExposedPopulation,
    },
    {
      metric: 'Safe Shelter Capacity',
      Baseline: baseline.totalSafeCapacity,
      Projected: projection.projectedSafeCapacity,
    },
    {
      metric: 'Fleet Required',
      Baseline: baseline.availableFleetUnits,
      Projected: baseline.availableFleetUnits + projection.projectedFleetDeficit,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.analytics}
        darkMode={darkMode}
        alt="Simulation Sandbox Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-2 font-mono">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>SIMULATION SANDBOX &bull; WHAT-IF LABORATORY</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              What-If Disaster Simulation Sandbox
            </h1>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Stress-test hypothetical climate, infrastructural, and evacuation shocks without altering live operational database records.
            </p>
          </div>

          {/* Location Bar & Quick Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-full sm:w-72">
              <AuthorityLocationSearch darkMode={darkMode} />
            </div>
            <button
              onClick={handleAskCopilot}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                darkMode
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ask Copilot to Explain Scenario</span>
            </button>
          </div>
        </div>

        {/* Sandbox Disclaimer / Guardrail Notice */}
        <div className={`px-4 py-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong className="text-amber-500 font-bold uppercase tracking-wider mr-1.5">SIMULATION — NOT LIVE DATA:</strong> Grounded on baseline data for <strong>{baseline.locationName} ({baseline.district})</strong>. Changes calculate temporary client-side projections. Real database is strictly isolated.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-extrabold uppercase tracking-wider">
              SIMULATION — NOT LIVE DATA
            </span>
          </div>
        </div>

        {/* Scenario Presets Row */}
        <div className="space-y-2">
          <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Rapid Stress-Test Presets:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCENARIO_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative group cursor-pointer ${
                    isSelected
                      ? darkMode
                        ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-500'
                        : 'bg-purple-50 border-purple-400 text-purple-950 shadow-sm ring-1 ring-purple-400'
                      : darkMode
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                  </div>
                  <div className={`font-bold text-xs mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {preset.title}
                  </div>
                  <div className={`text-[11px] line-clamp-2 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Controls Workspace (Left 5 cols) + Projected Outcomes (Right 7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`rounded-2xl border p-5 space-y-5 backdrop-blur-md ${
              darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <h2 className={`text-sm font-bold tracking-wide uppercase font-mono ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Hypothetical Stress Controls
                  </h2>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Controls</span>
                </button>
              </div>

              {/* Slider 1: Rainfall Intensity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    <span>Rainfall Intensity Delta</span>
                  </span>
                  <span className="font-mono font-bold text-blue-400">
                    {params.rainfallPercent >= 0 ? `+${params.rainfallPercent}%` : `${params.rainfallPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="150"
                  step="10"
                  value={params.rainfallPercent}
                  onChange={(e) => handleUpdateParam('rainfallPercent', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-20% (Dry)</span>
                  <span>Baseline (0%)</span>
                  <span>+150% (Torrential)</span>
                </div>
              </div>

              {/* Slider 2: Hazard Severity Multiplier */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hazard Perimeter Multiplier</span>
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    {params.hazardMultiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={params.hazardMultiplier}
                  onChange={(e) => handleUpdateParam('hazardMultiplier', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1.0x (Standard)</span>
                  <span>1.7x (Major Expansion)</span>
                  <span>2.5x (Catastrophic)</span>
                </div>
              </div>

              {/* Slider 3: Population Affected Surge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Exposed Population Surge</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    +{params.populationSurgePercent}% ({Math.round(baseline.totalExposedPopulation * (params.populationSurgePercent / 100)).toLocaleString()} people)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={params.populationSurgePercent}
                  onChange={(e) => handleUpdateParam('populationSurgePercent', Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Baseline)</span>
                  <span>+50% Surge</span>
                  <span>+100% (Double)</span>
                </div>
              </div>

              {/* Slider 4: Road Corridors Closed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                    <span>Arterial Evacuation Roads Severed</span>
                  </span>
                  <span className="font-mono font-bold text-orange-400">
                    {params.closedRoadsCount} of {baseline.totalCorridorsCount} Roads Blocked
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleUpdateParam('closedRoadsCount', count)}
                      className={`py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer ${
                        params.closedRoadsCount === count
                          ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                          : darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {count} {count === 1 ? 'Road' : 'Roads'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle 5: Railway Corridor Closure */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Train className={`w-4 h-4 ${params.railwayClosed ? 'text-rose-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Railway Evacuation Corridor</div>
                    <div className="text-[10px] text-slate-500">Simulate trackbed submersion and derailment hazard</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUpdateParam('railwayClosed', !params.railwayClosed)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                    params.railwayClosed
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {params.railwayClosed ? 'SEVERED' : 'OPEN'}
                </button>
              </div>

              {/* Slider 6: Safe Zone Shelter Capacity Stress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Safe-Zone Capacity Stress</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {params.safeZoneCapacityDeltaPercent >= 0 ? `+${params.safeZoneCapacityDeltaPercent}%` : `${params.safeZoneCapacityDeltaPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="10"
                  value={params.safeZoneCapacityDeltaPercent}
                  onChange={(e) => handleUpdateParam('safeZoneCapacityDeltaPercent', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-50% (Damaged Shelters)</span>
                  <span>Baseline</span>
                  <span>+50% (Reinforced)</span>
                </div>
              </div>

              {/* Slider 7: Available Fleet Delta */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rescue Vehicle Fleet Availability</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {params.availableFleetDeltaPercent >= 0 ? `+${params.availableFleetDeltaPercent}%` : `${params.availableFleetDeltaPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="10"
                  value={params.availableFleetDeltaPercent}
                  onChange={(e) => handleUpdateParam('availableFleetDeltaPercent', Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-50% (Shortage)</span>
                  <span>Baseline</span>
                  <span>+50% (Mutual Aid)</span>
                </div>
              </div>

              {/* Run Simulation Action Button */}
              <div className="pt-2">
                <button
                  onClick={triggerComputePulse}
                  disabled={isComputing}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isComputing ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Computing Hydrological & Logistical Flow...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Run What-If Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Outputs Column: Before vs After + Charts + Mitigations (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Before vs After Matrix */}
            <div className={`rounded-2xl border p-5 space-y-4 backdrop-blur-md ${
              darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h2 className={`text-sm font-bold tracking-wide uppercase font-mono ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Before vs. After Projection Comparison
                  </h2>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  projection.projectedRiskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  Projected State: {projection.projectedRiskLevel}
                </span>
              </div>

              {/* 2x3 Metric Delta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Risk Score */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Risk Score</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-400">{baseline.averageRiskScore}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className={`text-base font-extrabold font-mono ${
                      projection.projectedRiskScore >= 8.0 ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {projection.projectedRiskScore} / 10
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-400 font-semibold">
                    +{ (projection.projectedRiskScore - baseline.averageRiskScore).toFixed(1) } Escalation
                  </div>
                </div>

                {/* 2. Exposed Citizens */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Affected Population</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-400">{baseline.totalExposedPopulation.toLocaleString()}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-base font-extrabold font-mono text-purple-400">
                      {projection.projectedExposedPopulation.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-purple-400 font-semibold">
                    +{projection.exposedPopulationDelta.toLocaleString()} Surge
                  </div>
                </div>

                {/* 3. Shelter Capacity Deficit */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Shelter Capacity Status</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-emerald-400">+{baseline.availableCapacity} Free</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className={`text-base font-extrabold font-mono ${
                      projection.netCapacityDeficit > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {projection.netCapacityDeficit > 0 ? `-${projection.netCapacityDeficit}` : 'Adequate'}
                    </span>
                  </div>
                  <div className={`text-[10px] font-semibold ${
                    projection.netCapacityDeficit > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {projection.netCapacityDeficit > 0 ? 'Bed Space Deficit' : 'Surplus Maintained'}
                  </div>
                </div>

                {/* 4. Open Corridors */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Open Corridors</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-400">{baseline.openCorridorsCount} of {baseline.totalCorridorsCount}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-base font-extrabold font-mono text-orange-400">
                      {projection.projectedOpenCorridors} Open
                    </span>
                  </div>
                  <div className="text-[10px] text-orange-400 font-semibold">
                    {params.closedRoadsCount} Severed Corridors
                  </div>
                </div>

                {/* 5. Transit Fleet Shortage */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Convoy Fleet Shortage</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-400">{baseline.availableFleetUnits} Buses</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className={`text-base font-extrabold font-mono ${
                      projection.projectedFleetDeficit > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {projection.projectedFleetDeficit > 0 ? `-${projection.projectedFleetDeficit}` : '0'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {projection.projectedFleetDeficit > 0 ? 'Vehicles Deficit' : 'Sufficient Fleet'}
                  </div>
                </div>

                {/* 6. Evacuation Clearance Hours */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Clearance Window</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-400">{baseline.estimatedClearanceHours} hrs</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-base font-extrabold font-mono text-cyan-400">
                      {projection.projectedClearanceHours} hrs
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-semibold">
                    +{projection.clearanceHoursDelta} hrs Transit Delay
                  </div>
                </div>
              </div>

              {/* Blocked Routes List */}
              {projection.blockedCorridors.length > 0 && (
                <div className="p-3 rounded-xl border border-rose-900/60 bg-rose-950/20 space-y-2">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 font-mono">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Projected Evacuation Route Severances:</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {projection.blockedCorridors.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="font-semibold text-white">&bull; {c.name}</span>
                        <span className="text-rose-400 font-mono text-[10px]">[{c.reason}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Comparative Chart: Baseline vs Projected */}
            <div className={`rounded-2xl border p-5 space-y-4 backdrop-blur-md ${
              darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Load Comparison: Baseline vs. Simulated Shock
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-sky-400" />
                    <span className="text-slate-400">Baseline Real</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-pink-500" />
                    <span className="text-slate-400">Simulated Shock</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {comparisonChartData.map((item, idx) => {
                  const maxVal = Math.max(item.Baseline, item.Projected, 1);
                  const basePct = Math.min(100, Math.round((item.Baseline / maxVal) * 100));
                  const projPct = Math.min(100, Math.round((item.Projected / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{item.metric}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-sky-400">Base: {item.Baseline.toLocaleString()}</span>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-pink-400 font-bold">Sim: {item.Projected.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-4 w-full bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-slate-800 flex flex-col gap-0.5 justify-center">
                        <div 
                          className="h-1.5 bg-sky-400 rounded-full transition-all duration-500" 
                          style={{ width: `${basePct}%` }}
                        />
                        <div 
                          className="h-1.5 bg-pink-500 rounded-full transition-all duration-500" 
                          style={{ width: `${projPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulation Timeline Slider (T+0h to T+12h) */}
            <div className={`rounded-2xl border p-5 space-y-3 backdrop-blur-md ${
              darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Simulation Progression Timeline (T+0 to T+12 Hours)
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {projection.temporalProgression.map((step) => {
                  const isActive = activeTimelineHour === step.timeOffsetHours;
                  return (
                    <button
                      key={step.timeOffsetHours}
                      onClick={() => setActiveTimelineHour(step.timeOffsetHours)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-600/20 border-cyan-400 ring-1 ring-cyan-400 text-white shadow-sm'
                          : darkMode
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className="text-[11px] font-bold font-mono text-cyan-300">{step.hourLabel}</div>
                      <div className="text-xs font-extrabold mt-1">Water Delta: +{step.waterLevelDeltaM}m</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Evacuated: {step.evacuatedCount.toLocaleString()} ({Math.round((step.evacuatedCount / projection.projectedExposedPopulation) * 100)}%)
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Critical Logistical Mitigations */}
            <div className={`rounded-2xl border p-5 space-y-3 backdrop-blur-md ${
              darkMode ? 'bg-slate-900/85 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Model-Derived Contingency Mitigations
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {projection.recommendedMitigations.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800/60 bg-slate-950/40 text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <div className="leading-relaxed">{m}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
