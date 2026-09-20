import React, { useState } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  ExternalLink, 
  ChevronRight, 
  TrendingDown, 
  Navigation,
  Info,
  Droplets,
  HeartPulse,
  Home
} from 'lucide-react';
import { SafeZone } from '../../types';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { DEMO_HABITATIONS } from '../../data/demoHabitations';
import { IMAGES } from '../../data/assets';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';

interface CarryingCapacityViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectSafeZoneForRelocation?: (safeZone: SafeZone) => void;
  darkMode: boolean;
}

export const CarryingCapacityView: React.FC<CarryingCapacityViewProps> = ({
  onNavigateTab,
  onSelectSafeZoneForRelocation,
  darkMode,
}) => {
  const [selectedSafeZone, setSelectedSafeZone] = useState<SafeZone>(DEMO_SAFE_ZONES[0]);

  // Aggregate stats
  const totalSafeCapacity = DEMO_SAFE_ZONES.reduce((acc, sz) => acc + sz.safeCapacity, 0);
  const totalOccupancy = DEMO_SAFE_ZONES.reduce((acc, sz) => acc + sz.currentOccupancy, 0);
  const totalAvailable = DEMO_SAFE_ZONES.reduce((acc, sz) => acc + sz.availableCapacity, 0);
  const totalExposedPopulation = DEMO_HABITATIONS.reduce((acc, hab) => acc + hab.population, 0);
  const aggregateUtilization = Math.round((totalOccupancy / totalSafeCapacity) * 100);

  const handleRouteToZone = (zone: SafeZone) => {
    if (onSelectSafeZoneForRelocation) {
      onSelectSafeZoneForRelocation(zone);
    }
    onNavigateTab('relocation');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.carryingCapacity}
        darkMode={darkMode}
        alt="Carrying Capacity EOC Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto">
        {/* Visual Header Section */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src={IMAGES.schoolCamp}
              alt="Relief Camp Enclave"
              className="w-full h-full object-cover brightness-[0.4] contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold backdrop-blur-md">
              <Scale className="w-3.5 h-3.5" />
              <span>Regional Accommodation Logistics • Sphere Standards</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Can the Destination Safely Accommodate the Evacuees?
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl leading-relaxed">
              Real-time carrying capacity assessment matching exposed settlements with safe recipient zones, 
              preventing secondary overcrowding, hygiene collapse, and logistic bottlenecks.
            </p>
          </div>
        </div>

        {/* High-Impact Visual Capacity Balance Flow Banner */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md shadow-lg' : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Scale className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-blue-600'}`} />
              <h2 className={`text-xs font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-slate-200' : 'text-[#0F172A]'}`}>
                Regional Evacuation Capacity &amp; Balance Gauge
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                CENSUS &amp; SPHERE BASELINE
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Live Audit
              </span>
            </div>
          </div>

          {/* Visual Step-by-Step Flow Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Step 1: Population Requiring Shelter */}
            <div className={`p-4 rounded-xl border relative ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  1. Exposed Population
                </span>
                <Users className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
                {totalExposedPopulation.toLocaleString()}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                In active red &amp; hazard zones
              </div>
            </div>

            {/* Step 2: Total Safe Capacity */}
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  2. Designated Capacity
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                {totalSafeCapacity.toLocaleString()}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                Across {DEMO_SAFE_ZONES.length} verified camps
              </div>
            </div>

            {/* Step 3: Available Beds Today */}
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  3. Immediate Available
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {totalAvailable.toLocaleString()}
              </div>
              <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-[#64748B]'}`}>
                {totalOccupancy.toLocaleString()} already occupied ({aggregateUtilization}%)
              </div>
            </div>

            {/* Step 4: Net Deficit / Shortage */}
            <div className={`p-4 rounded-xl border ${
              totalExposedPopulation > totalAvailable
                ? darkMode ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50/80 border-rose-200'
                : darkMode ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400">
                  4. Regional Shortage
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
                -{(totalExposedPopulation - totalAvailable).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-0.5">
                Critical regional deficit: secondary camps needed
              </div>
            </div>
          </div>

          {/* Aggregate Visual Balance Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={darkMode ? 'text-slate-400' : 'text-[#64748B]'}>
                Overall Shelter Load &amp; Deficit Distribution
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {aggregateUtilization}% Utilized &bull; Deficit: {Math.round(((totalExposedPopulation - totalAvailable) / totalExposedPopulation) * 100)}% of Red Zone
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden flex ${
              darkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}>
              <div
                className="h-full bg-amber-500"
                style={{ width: `${(totalOccupancy / (totalSafeCapacity + totalExposedPopulation)) * 100}%` }}
                title={`Occupied: ${totalOccupancy.toLocaleString()}`}
              />
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(totalAvailable / (totalSafeCapacity + totalExposedPopulation)) * 100}%` }}
                title={`Available: ${totalAvailable.toLocaleString()}`}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${((totalExposedPopulation - totalAvailable) / (totalSafeCapacity + totalExposedPopulation)) * 100}%` }}
                title={`Deficit: ${(totalExposedPopulation - totalAvailable).toLocaleString()}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Occupied ({totalOccupancy.toLocaleString()})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Available Beds ({totalAvailable.toLocaleString()})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Regional Deficit ({(totalExposedPopulation - totalAvailable).toLocaleString()})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sphere Humanitarian Standards Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Sphere Humanitarian Standards Applied
              </div>
              <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                3.5 m² covered living space per person &bull; 15L potable water/day &bull; 1 latrine per 20 persons
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('relocation')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Launch Relocation Optimization</span>
          </button>
        </div>

        {/* Main Grid: Safe Zones List & Inspected Camp Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of Verified Safe Zones (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold font-mono uppercase tracking-wider ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Verified Safe Zones &amp; Relief Camps ({DEMO_SAFE_ZONES.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click camp to view live facility breakdown
              </span>
            </div>

            <div className="space-y-3">
              {DEMO_SAFE_ZONES.map((sz) => {
                const isSelected = selectedSafeZone.id === sz.id;
                const util = Math.round((sz.currentOccupancy / sz.safeCapacity) * 100);

                return (
                  <div
                    key={sz.id}
                    onClick={() => setSelectedSafeZone(sz)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? darkMode
                          ? 'border-emerald-500 bg-slate-800/80 shadow-lg ring-1 ring-emerald-500'
                          : 'border-emerald-500 bg-emerald-50/70 shadow-md ring-1 ring-emerald-500'
                        : darkMode 
                          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 backdrop-blur-md' 
                          : 'bg-white/85 border-slate-200/90 hover:border-slate-300 backdrop-blur-md shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            VERIFIED SHELTER
                          </span>
                          <span className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            #{sz.id}
                          </span>
                        </div>

                        <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {sz.name}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{sz.district}, {sz.state} &bull; {sz.distanceKm} km away</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-500 font-mono">
                          {sz.availableCapacity.toLocaleString()} beds free
                        </div>
                        <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {sz.currentOccupancy} / {sz.safeCapacity} occupied ({util}%)
                        </div>
                      </div>
                    </div>

                    {/* Capacity Utilization Progress Bar */}
                    <div className="mt-3">
                      <div className={`w-full h-2 rounded-full overflow-hidden ${
                        darkMode ? 'bg-slate-800' : 'bg-slate-100'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            util > 85 ? 'bg-rose-500' : util > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${util}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspected Safe Zone Dossier (5 cols) */}
          <div className="lg:col-span-5">
            <div className={`p-6 rounded-2xl border space-y-5 sticky top-24 ${
              darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-md'
            }`}>
              <div className="relative rounded-xl overflow-hidden h-36 border border-slate-700/60">
                <img
                  src={selectedSafeZone.imageUrl}
                  alt={selectedSafeZone.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 flex flex-col justify-end">
                  <div className="text-base font-bold text-white leading-tight">
                    {selectedSafeZone.name}
                  </div>
                  <div className="text-xs text-slate-300">
                    {selectedSafeZone.district}, {selectedSafeZone.state}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-3 rounded-xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Safe Capacity</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedSafeZone.safeCapacity.toLocaleString()}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Available Headroom</div>
                  <div className="text-base font-bold text-emerald-500 font-mono mt-0.5">
                    {selectedSafeZone.availableCapacity.toLocaleString()}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Transit Distance</div>
                  <div className={`font-bold font-mono mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedSafeZone.distanceKm} km ({selectedSafeZone.travelTimeMin} min)
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hazard Exposure</div>
                  <div className="font-bold text-emerald-500 font-mono mt-0.5">
                    {selectedSafeZone.hazardExposure}
                  </div>
                </div>
              </div>

              {/* Facilities Checklist */}
              <div>
                <div className={`text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Operational Support Facilities:
                </div>
                <div className={`space-y-1.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {selectedSafeZone.facilities.map((fac, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Officer */}
              <div className={`p-3 rounded-xl border text-xs ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Camp Incident Commander</div>
                <div className={`font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedSafeZone.contactPerson}</div>
                <a href={`tel:${selectedSafeZone.contactPhone}`} className="text-cyan-500 text-xs font-mono hover:underline mt-0.5 block">
                  {selectedSafeZone.contactPhone}
                </a>
              </div>

              <button
                onClick={() => handleRouteToZone(selectedSafeZone)}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Route Evacuation to this Safe Zone</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
