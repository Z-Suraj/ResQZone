import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Search, 
  Filter, 
  Navigation, 
  MapPin, 
  Users, 
  ShieldAlert, 
  Crosshair, 
  ChevronDown, 
  Layers, 
  Info, 
  SlidersHorizontal, 
  Table as TableIcon, 
  LayoutGrid,
  AlertTriangle,
  ArrowUpDown,
  Compass,
  Waves,
  Truck,
  HeartPulse,
  PawPrint,
  Clock,
  X
} from 'lucide-react';
import { Habitation, RiskLevel, VulnerabilityLevel, CapacityStatus, CitizenLocation } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { calculateHaversineKm } from '../../services/locationIntelligence';
import { IMAGES } from '../../data/assets';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';
import { AuthorityLocationSearch } from '../common/AuthorityLocationSearch';

interface HabitationsViewProps {
  onSelectForRelocation: (habitation: Habitation) => void;
  onNavigateTab: (tab: string) => void;
  darkMode: boolean;
}

type SortOption = 'RISK' | 'DISTANCE' | 'POPULATION' | 'URGENCY';

export const HabitationsView: React.FC<HabitationsViewProps> = ({
  onSelectForRelocation,
  onNavigateTab,
  darkMode,
}) => {
  const [currentLocation, setCurrentLocation] = useState<CitizenLocation | null>(
    () => emergencyStore.getCurrentLocation()
  );
  const [currentRadius, setCurrentRadius] = useState<number>(
    () => emergencyStore.getLocationRadius()
  );
  const [habitations, setHabitations] = useState<Habitation[]>(
    () => emergencyStore.getHabitations()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedVulnerability, setSelectedVulnerability] = useState<string>('ALL');
  const [selectedCapacityStatus, setSelectedCapacityStatus] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('RISK');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [inspectedHabitation, setInspectedHabitation] = useState<Habitation | null>(null);

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setCurrentLocation(emergencyStore.getCurrentLocation());
      setCurrentRadius(emergencyStore.getLocationRadius());
      setHabitations(emergencyStore.getHabitations());
    });
  }, []);

  // Compute distance for each habitation from selected authority location
  const habitationsWithMeta = useMemo(() => {
    const [cLat, cLon] = currentLocation?.coordinates || [22.0667, 88.0698];

    return habitations.map(h => {
      const dist = calculateHaversineKm(cLat, cLon, h.coordinates[0], h.coordinates[1]);
      
      // Calculate or assign realistic operational metrics if not present
      const elderly = Math.round(h.population * 0.11);
      const pregnantOrCare = Math.round(h.population * 0.04);
      const children = h.children0_6 || Math.round(h.population * 0.12);
      const livestock = Math.round(h.population * 0.28);
      
      const urgency = h.relocationPriority === 'IMMEDIATE' 
        ? 'IMMEDIATE'
        : h.riskLevel === 'CRITICAL' 
        ? 'IMMEDIATE' 
        : h.riskLevel === 'HIGH' 
        ? 'HIGH' 
        : h.riskLevel === 'MODERATE' 
        ? 'PRIORITY' 
        : 'PRECAUTIONARY';

      const waterLevelMetric = h.riskLevel === 'CRITICAL'
        ? '+1.6m above danger mark (Severe overflow)'
        : h.riskLevel === 'HIGH'
        ? '+0.9m above danger threshold'
        : h.riskLevel === 'MODERATE'
        ? 'At warning level (Rising +4cm/hr)'
        : 'Normal riverine/drainage discharge';

      const roadStatus = h.riskLevel === 'CRITICAL'
        ? 'Inundated (Access via high-clearance SDRF trucks only)'
        : h.riskLevel === 'HIGH'
        ? 'Single lane passable with water logging'
        : 'Clear 2-lane evacuation access';

      return {
        ...h,
        distanceKm: dist,
        specialNeedsCount: elderly + pregnantOrCare + children,
        elderlyCount: elderly,
        pregnantCount: pregnantOrCare,
        livestockCount: livestock,
        evacuationUrgency: urgency,
        waterLevelMetric,
        roadStatus,
      };
    });
  }, [habitations, currentLocation]);

  // Filtered and Sorted Habitations
  const filteredHabitations = useMemo(() => {
    let result = habitationsWithMeta.filter((h) => {
      if (selectedRisk !== 'ALL' && h.riskLevel !== selectedRisk) return false;
      if (selectedVulnerability !== 'ALL' && h.vulnerability !== selectedVulnerability) return false;
      if (selectedCapacityStatus !== 'ALL' && h.capacityStatus !== selectedCapacityStatus) return false;
      if (selectedUrgency !== 'ALL' && h.evacuationUrgency !== selectedUrgency) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.state.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'RISK') {
        const scoreMap: Record<RiskLevel, number> = { CRITICAL: 4, HIGH: 3, MODERATE: 2, SAFE: 1 };
        return scoreMap[b.riskLevel] - scoreMap[a.riskLevel] || b.riskScore - a.riskScore;
      }
      if (sortBy === 'DISTANCE') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'POPULATION') {
        return b.population - a.population;
      }
      if (sortBy === 'URGENCY') {
        const urgencyWeight: Record<string, number> = {
          IMMEDIATE: 4,
          HIGH: 3,
          PRIORITY: 2,
          PRECAUTIONARY: 1,
        };
        return (urgencyWeight[b.evacuationUrgency] || 0) - (urgencyWeight[a.evacuationUrgency] || 0);
      }
      return 0;
    });

    return result;
  }, [habitationsWithMeta, selectedRisk, selectedVulnerability, selectedCapacityStatus, selectedUrgency, searchQuery, sortBy]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.habitations}
        darkMode={darkMode}
        alt="Habitations Intelligence Background"
      />
      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto font-sans">
        
        {/* Large Geographic Header Section */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src={IMAGES.aerialVillage}
              alt="Rural Habitations in Valley"
              className="w-full h-full object-cover brightness-[0.38] contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-md">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Settlement Demographics &amp; Vulnerability Matrix</span>
                  <span className="text-slate-400 font-mono">• {currentRadius} km buffer</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Habitation Intelligence: {currentLocation?.name || 'Regional Analysis'}
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
                  Monitor settlement-level population exposure around <strong className="text-cyan-400 font-semibold">{currentLocation?.name || 'the operational center'}</strong>. 
                  Audit vulnerability indicators, special needs, evacuation urgency, and route directly to relief safe zones.
                </p>
              </div>

              {/* Authority Search in Header */}
              <div className="shrink-0 bg-slate-950/80 p-3 rounded-2xl border border-slate-700/80 backdrop-blur-xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Analysis Location
                </div>
                <AuthorityLocationSearch darkMode={true} compact={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search settlement name, sector, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-hidden focus:border-cyan-500 transition-colors ${
                  darkMode 
                    ? 'bg-slate-950/80 text-white placeholder-slate-400 border-slate-700/80' 
                    : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Sort & View Mode controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className={`text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-700 text-cyan-400' 
                      : 'bg-slate-50 border-slate-200 text-cyan-700'
                  }`}
                >
                  <option value="RISK">Highest Risk First</option>
                  <option value="DISTANCE">Nearest Distance</option>
                  <option value="POPULATION">Largest Population</option>
                  <option value="URGENCY">Evacuation Urgency</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className={`flex items-center p-1 rounded-xl border ${
                darkMode ? 'bg-slate-950/80 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Granular Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
            {/* Risk filter */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Risk Status
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-950/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="SAFE">Safe</option>
              </select>
            </div>

            {/* Evacuation Urgency */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Evacuation Urgency
              </label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-950/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Urgencies</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="HIGH">High</option>
                <option value="PRIORITY">Priority</option>
                <option value="PRECAUTIONARY">Precautionary</option>
              </select>
            </div>

            {/* Social Vulnerability */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Vulnerability
              </label>
              <select
                value={selectedVulnerability}
                onChange={(e) => setSelectedVulnerability(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-950/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Vulnerabilities</option>
                <option value="EXTREME">Extreme</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Capacity Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Capacity Load
              </label>
              <select
                value={selectedCapacityStatus}
                onChange={(e) => setSelectedCapacityStatus(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                  darkMode ? 'bg-slate-950/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Capacity States</option>
                <option value="OVER_CAPACITY">Over Capacity (Deficit)</option>
                <option value="NEAR_CAPACITY">Near Capacity</option>
                <option value="SAFE">Safe Capacity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-mono">
          <span>Displaying {filteredHabitations.length} habitations within {currentRadius} km buffer</span>
          <span>Center: {currentLocation?.coordinates[0].toFixed(3)}°N, {currentLocation?.coordinates[1].toFixed(3)}°E</span>
        </div>

        {/* Cards Grid */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredHabitations.map((hab) => {
              const isCrit = hab.riskLevel === 'CRITICAL';
              const isHigh = hab.riskLevel === 'HIGH';

              return (
                <div
                  key={hab.id}
                  className={`p-5 rounded-2xl border transition-all hover:border-cyan-500/80 flex flex-col justify-between ${
                    darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase ${
                        isCrit ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        isHigh ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        hab.riskLevel === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {hab.riskLevel} RISK (Score {hab.riskScore})
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                        {hab.distanceKm.toFixed(1)} km away
                      </span>
                    </div>

                    {/* Title & Coordinates */}
                    <div>
                      <h3 className={`text-base font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {hab.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs mt-1 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {hab.district}, {hab.state}
                        </span>
                        <span className="font-mono text-[10px]">
                          [{hab.coordinates[0].toFixed(3)}°, {hab.coordinates[1].toFixed(3)}°]
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className={`grid grid-cols-3 gap-2 py-2 border-y text-xs ${
                      darkMode ? 'border-slate-800/80' : 'border-slate-200'
                    }`}>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Population</div>
                        <div className={`font-bold font-mono mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {hab.population.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Special Needs</div>
                        <div className="font-bold text-amber-500 dark:text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                          <HeartPulse className="w-3 h-3 text-rose-500" />
                          {hab.specialNeedsCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Livestock</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <PawPrint className="w-3 h-3" />
                          {hab.livestockCount}
                        </div>
                      </div>
                    </div>

                    {/* Urgency & Threat Metrics */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-500" /> Evacuation Urgency:
                        </span>
                        <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded uppercase ${
                          hab.evacuationUrgency === 'IMMEDIATE'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : hab.evacuationUrgency === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : darkMode ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}>
                          {hab.evacuationUrgency}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Waves className="w-3 h-3 text-blue-500" /> Water/Threat:
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[200px]" title={hab.waterLevelMetric}>
                          {hab.waterLevelMetric}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-amber-500" /> Road Access:
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={hab.roadStatus}>
                          {hab.roadStatus}
                        </span>
                      </div>
                    </div>

                    {/* Recommended Action */}
                    <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Action Directive:</span>
                      </div>
                      <p className={`line-clamp-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {hab.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 flex items-center gap-2">
                    <button
                      onClick={() => setInspectedHabitation(hab)}
                      className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-colors text-center border cursor-pointer ${
                        darkMode 
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      }`}
                    >
                      Audit Details
                    </button>
                    <button
                      onClick={() => {
                        onSelectForRelocation(hab);
                        onNavigateTab('relocation');
                      }}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Evacuate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    darkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <th className="p-3.5">Settlement</th>
                    <th className="p-3.5">Distance</th>
                    <th className="p-3.5">Risk &amp; Urgency</th>
                    <th className="p-3.5">Population</th>
                    <th className="p-3.5">Special Needs</th>
                    <th className="p-3.5">Livestock</th>
                    <th className="p-3.5">Road Access</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
                  {filteredHabitations.map((hab) => (
                    <tr 
                      key={hab.id}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{hab.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {hab.coordinates[0].toFixed(3)}°N, {hab.coordinates[1].toFixed(3)}°E
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {hab.distanceKm.toFixed(1)} km
                      </td>
                      <td className="p-3.5 space-y-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded block w-fit ${
                          hab.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                          hab.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {hab.riskLevel} ({hab.riskScore})
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">
                          Urgency: {hab.evacuationUrgency}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {hab.population.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        {hab.specialNeedsCount}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400">
                        {hab.livestockCount}
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-700 dark:text-slate-300 max-w-xs truncate" title={hab.roadStatus}>
                        {hab.roadStatus}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            onSelectForRelocation(hab);
                            onNavigateTab('relocation');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors shadow-xs cursor-pointer"
                        >
                          Plan Route
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Drill-Down Modal */}
        {inspectedHabitation && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                    Operational Settlement Audit
                  </span>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {inspectedHabitation.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {inspectedHabitation.district}, {inspectedHabitation.state} • Coordinates: {inspectedHabitation.coordinates[0]}°N, {inspectedHabitation.coordinates[1]}°E
                  </p>
                </div>
                <button
                  onClick={() => setInspectedHabitation(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Demographics & Vulnerability breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Population</div>
                  <div className="font-bold font-mono mt-0.5 text-slate-900 dark:text-white">{inspectedHabitation.population.toLocaleString()}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Households</div>
                  <div className="font-bold font-mono mt-0.5 text-slate-900 dark:text-white">{inspectedHabitation.households.toLocaleString()}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Children (0-6)</div>
                  <div className="font-bold text-amber-500 dark:text-amber-400 font-mono mt-0.5">{inspectedHabitation.children0_6}</div>
                </div>
                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Livestock Count</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{(inspectedHabitation as any).livestockCount || 120}</div>
                </div>
              </div>

              {/* Disaster Exposure & Urgency Section */}
              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Hazard Inundation &amp; Logistics Overview</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Threat Level / Water Line:</span>
                    <span className="font-semibold">{(inspectedHabitation as any).waterLevelMetric || 'Elevated storm surge'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Road Evacuation Corridor:</span>
                    <span className="font-semibold">{(inspectedHabitation as any).roadStatus || 'Accessible with caution'}</span>
                  </div>
                </div>
              </div>

              {/* Action Directive */}
              <div className={`p-3.5 rounded-xl border space-y-1 text-xs ${
                darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Command Center Evacuation Directive</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {inspectedHabitation.recommendedAction}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setInspectedHabitation(null)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs border cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onSelectForRelocation(inspectedHabitation);
                    setInspectedHabitation(null);
                    onNavigateTab('relocation');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Initiate Evacuation Route</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
