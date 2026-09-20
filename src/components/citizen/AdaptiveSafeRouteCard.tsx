import React, { useState } from 'react';
import { 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  Bus, 
  Train, 
  Car, 
  Ship, 
  Plane, 
  Footprints, 
  Clock, 
  RotateCcw, 
  Users, 
  Sparkles, 
  ChevronRight,
  Info,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { AdaptiveRoute, RouteSegment, TransportMode } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { WhatIfScenario } from '../../services/safeRouteEngine';

interface AdaptiveSafeRouteCardProps {
  route?: AdaptiveRoute | null;
  darkMode?: boolean;
  onFocusSegmentOnMap?: (segment: RouteSegment) => void;
  onStartNavigation?: () => void;
}

export const AdaptiveSafeRouteCard: React.FC<AdaptiveSafeRouteCardProps> = ({
  route,
  darkMode = true,
  onFocusSegmentOnMap,
  onStartNavigation,
}) => {
  const [simulationMenuOpen, setSimulationMenuOpen] = useState(false);
  const activeScenario = emergencyStore.getActiveScenario();
  const disruptionMessage = emergencyStore.getDisruptionMessage();
  const isRecalculating = emergencyStore.getIsRecalculatingRoute();

  const handleScenarioChange = (scenario: WhatIfScenario) => {
    emergencyStore.setWhatIfScenario(scenario);
  };

  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'WALKING':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'BUS':
        return <Bus className="w-4 h-4 text-blue-400" />;
      case 'TRAIN':
        return <Train className="w-4 h-4 text-indigo-400" />;
      case 'BOAT':
        return <Ship className="w-4 h-4 text-cyan-400" />;
      case 'CAR':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'AIR':
        return <Plane className="w-4 h-4 text-purple-400" />;
      default:
        return <Navigation className="w-4 h-4 text-blue-400" />;
    }
  };

  if (!route) {
    return (
      <div className={`p-6 rounded-2xl border text-center space-y-3 ${
        darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
      }`}>
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
          <Navigation className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-extrabold text-white">No Active Safe Route</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Please select or search your sector above to compute a safe evacuation route and nearby verified safe zone.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all text-left space-y-4 ${
      darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header with Signature Brand Badge & Simulation Tag */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Adaptive SafeRoute AI
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                PROTOTYPE SIMULATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hazard proximity &bull; Safe capacity &bull; Multimodal transit
            </p>
          </div>
        </div>

        {/* Simulation Scenario Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSimulationMenuOpen(!simulationMenuOpen)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>What-If Scenarios</span>
          </button>
        </div>
      </div>

      {/* Disruption / Recalculation Alert Banner */}
      {disruptionMessage && (
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 animate-pulse ${
          isRecalculating 
            ? 'bg-blue-950/40 border-blue-800/60 text-blue-200' 
            : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
        }`}>
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <b className="font-bold">{isRecalculating ? 'AI Recalculating Route:' : 'Route Disruption Detected:'}</b>{' '}
            <span>{disruptionMessage}</span>
          </div>
        </div>
      )}

      {/* What-If Scenario Selection Panel */}
      {simulationMenuOpen && (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-700/80 space-y-2 text-xs">
          <div className="font-bold text-slate-300 flex items-center justify-between">
            <span>Select Route Disruption Simulation:</span>
            <span className="text-[10px] text-slate-400">Active: {activeScenario}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              onClick={() => handleScenarioChange('NONE')}
              className={`p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                activeScenario === 'NONE' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Optimal Route
            </button>
            <button
              onClick={() => handleScenarioChange('ROAD_BLOCKED')}
              className={`p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                activeScenario === 'ROAD_BLOCKED' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Road Blocked (Main Access)
            </button>
            <button
              onClick={() => handleScenarioChange('SAFE_ZONE_FULL')}
              className={`p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                activeScenario === 'SAFE_ZONE_FULL' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Shelter Full (Capacity)
            </button>
          </div>
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Distance</div>
          <div className="text-base font-black text-white mt-0.5">{route.totalDistanceKm} km</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Travel Time</div>
          <div className="text-base font-black text-blue-400 mt-0.5">{route.totalMinutes} min</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Corridor Risk</div>
          <div className="text-base font-black text-emerald-400 mt-0.5">{route.overallRisk}</div>
        </div>
      </div>

      {/* Target Destination & Shelter Capacity Bar */}
      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-300">Destination Safe Zone:</span>
          <span className="font-bold text-white flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {route.destinationName}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Capacity Check: <b>{route.safeZoneAvailable}</b> beds available / {route.safeZoneCapacity} total</span>
          <span className={route.capacityStatus === 'CONSTRAINED' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {route.capacityStatus === 'CONSTRAINED' ? 'NEAR CAPACITY' : 'SUFFICIENT'}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full ${route.capacityStatus === 'CONSTRAINED' ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (route.safeZoneOccupied / route.safeZoneCapacity) * 100)}%` }}
          />
        </div>
      </div>

      {/* Multi-Modal Step-by-Step Breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-300 flex items-center justify-between">
          <span>Multimodal Transfer Steps</span>
          <span className="text-[10px] text-slate-500 font-normal">Click segment to focus map</span>
        </div>

        <div className="space-y-2 divide-y divide-slate-800/50">
          {route.segments.map((seg, idx) => (
            <div
              key={seg.id}
              onClick={() => onFocusSegmentOnMap && onFocusSegmentOnMap(seg)}
              className="pt-2 flex items-start gap-3 hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                {getModeIcon(seg.mode)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-bold text-white truncate">
                    {seg.mode}: {seg.toTitle}
                  </div>
                  <div className="text-xs font-bold text-slate-300 shrink-0">
                    {seg.distanceKm} km &bull; {seg.durationMinutes} min
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{seg.status}</span>
                  {seg.availableSeats !== undefined && (
                    <span className="text-blue-400 font-bold">
                      ({seg.availableSeats} seats avail)
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={onStartNavigation}
          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
          <span>Follow This Safe Route</span>
        </button>
      </div>
    </div>
  );
};
