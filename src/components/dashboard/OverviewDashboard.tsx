import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Home, 
  Users, 
  Navigation, 
  ShieldCheck, 
  ArrowUpRight, 
  ExternalLink, 
  TrendingUp, 
  Activity, 
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  PhoneCall,
  CheckCircle2,
  LifeBuoy,
  ShieldAlert,
  Compass,
  Radio,
  CloudRain,
  Wind,
  Thermometer,
  Shield
} from 'lucide-react';
import { LeafletGisMap } from '../map/LeafletGisMap';
import { HazardArea, Habitation, SafeZone, Incident, ProblemAnalysisReport, EmergencyResponseSupportData, WeatherData, CitizenLocation } from '../../types';
import { emergencyStore, CitizenRescueRequest } from '../../services/emergencyStore';
import { IMAGES } from '../../data/assets';
import { ResQZoneLogo } from '../common/ResQZoneLogo';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';
import { AuthorityLocationSearch } from '../common/AuthorityLocationSearch';
import { ProblemAnalysisPanel } from './ProblemAnalysisPanel';
import { NDRFResponseSupportPanel } from './NDRFResponseSupportPanel';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectHabitationForRelocation: (habitation: Habitation) => void;
  darkMode: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onSelectHabitationForRelocation,
  darkMode,
}) => {
  // Live store data
  const [currentLocation, setCurrentLocation] = useState<CitizenLocation | null>(() => emergencyStore.getCurrentLocation());
  const [incidents, setIncidents] = useState<Incident[]>(() => emergencyStore.getIncidents());
  const [rescueRequests, setRescueRequests] = useState<CitizenRescueRequest[]>(() => emergencyStore.getRescueRequests());
  const [alerts, setAlerts] = useState(() => emergencyStore.getAlerts());
  const [habitations, setHabitations] = useState<Habitation[]>(() => emergencyStore.getHabitations());
  const [hazards, setHazards] = useState<HazardArea[]>(() => emergencyStore.getHazards());
  const [safeZones, setSafeZones] = useState<SafeZone[]>(() => emergencyStore.getSafeZones());
  const [problemReport, setProblemReport] = useState<ProblemAnalysisReport>(() => emergencyStore.getProblemAnalysis());
  const [ndrfSupport, setNdrfSupport] = useState<EmergencyResponseSupportData>(() => emergencyStore.getNDRFResponseSupport());
  const [weather, setWeather] = useState<WeatherData>(() => emergencyStore.getWeather());

  const [selectedHazard, setSelectedHazard] = useState<HazardArea | null>(null);
  const [selectedHabitation, setSelectedHabitation] = useState<Habitation | null>(null);
  const [selectedSafeZone, setSelectedSafeZone] = useState<SafeZone | null>(null);

  useEffect(() => {
    setSelectedHazard(hazards[0] || null);
  }, [hazards]);

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setCurrentLocation(emergencyStore.getCurrentLocation());
      setIncidents(emergencyStore.getIncidents());
      setRescueRequests(emergencyStore.getRescueRequests());
      setAlerts(emergencyStore.getAlerts());
      setHabitations(emergencyStore.getHabitations());
      setHazards(emergencyStore.getHazards());
      setSafeZones(emergencyStore.getSafeZones());
      setProblemReport(emergencyStore.getProblemAnalysis());
      setNdrfSupport(emergencyStore.getNDRFResponseSupport());
      setWeather(emergencyStore.getWeather());
    });
  }, []);

  // Aggregated live statistics
  const activeIncidentsCount = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'NEW').length;
  const criticalIncidentsCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const pendingRescueCount = rescueRequests.filter(r => r.status === 'SUBMITTED').length;
  const activeAlertsCount = alerts.filter(a => a.active).length;

  const totalExposedPopulation = habitations.reduce((sum, h) => sum + h.population, 0);
  const criticalHabitations = habitations.filter(h => h.riskLevel === 'CRITICAL' || h.relocationPriority === 'IMMEDIATE');
  const totalSafeCapacity = safeZones.reduce((sum, s) => sum + s.availableCapacity, 0);

  const nearestSafeZone = safeZones[0];
  const priorityHabitations = habitations.slice(0, 4);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.commandCenter}
        darkMode={darkMode}
        alt="EOC Command Center Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto">
        {/* Top Atmospheric Header Section */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src={IMAGES.mountainLandslide}
              alt="Mountain Sector Ridge"
              className="w-full h-full object-cover object-center brightness-[0.45] contrast-[1.15]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-white text-xs font-semibold backdrop-blur-md shadow-md">
                <ResQZoneLogo variant="symbol" size="xs" />
                <span className="font-mono font-bold text-white tracking-wider">RES<span className="text-rose-500">Q</span>ZONE</span>
                <span className="text-slate-400 font-sans">• SEOC Operations Grid</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Emergency Operations Command Center
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed">
                Active Jurisdiction: <strong className="text-cyan-400">{currentLocation?.name || 'Haldia'}</strong> ({currentLocation?.coordinates ? currentLocation.coordinates[0].toFixed(2) : '22.06'}°N, {currentLocation?.coordinates ? currentLocation.coordinates[1].toFixed(2) : '88.07'}°E, {currentLocation?.district}, {currentLocation?.state}). Live integration of citizen field reports, SOS rescue signals, bottleneck problem analysis, and NDRF tactical response.
              </p>
            </div>

            {/* Quick action buttons & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="w-full sm:w-80">
                <AuthorityLocationSearch darkMode={true} />
              </div>
              <button
                onClick={() => onNavigateTab('relocation')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950 cursor-pointer shrink-0"
              >
                <Navigation className="w-4 h-4" />
                <span>Launch Relocation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Weather & Meteorological Advisory Bar */}
        {weather && (
          <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            weather.warningLevel === 'RED'
              ? darkMode ? 'bg-rose-950/40 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
              : weather.warningLevel === 'ORANGE'
              ? darkMode ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
              : darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                weather.warningLevel === 'RED' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                IMD {weather.warningLevel} WARNING
              </span>
              <span className="font-semibold">{weather.warningMessage}</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" /> {weather.temperatureC}°C
              </span>
              <span className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" /> {weather.precipitationMm} mm/hr
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" /> {weather.windSpeedKmh} km/h
              </span>
              <span className="text-[10px] text-slate-400">
                Source: {weather.provenance.source}
              </span>
            </div>
          </div>
        )}

        {/* Live Metrics Quad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Active Incidents & SOS */}
          <div 
            onClick={() => onNavigateTab('incidents')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-rose-500/60 ${
              darkMode ? 'bg-slate-900/80 border-slate-800/90 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  criticalIncidentsCount > 0 ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    FIELD INCIDENTS &amp; SOS
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {incidents.length}
                    </span>
                    <span className="text-xs text-rose-500 font-semibold">
                      {pendingRescueCount} SOS Pending
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Metric 2: Habitations at Risk */}
          <div 
            onClick={() => onNavigateTab('habitations')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-500/60 ${
              darkMode ? 'bg-slate-900/80 border-slate-800/90 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    HABITATIONS AT RISK
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {criticalHabitations.length}
                    </span>
                    <span className="text-xs text-amber-500 font-semibold">
                      of {habitations.length} settlements
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Metric 3: Population Exposed */}
          <div 
            onClick={() => onNavigateTab('analytics')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-rose-500/60 ${
              darkMode ? 'bg-slate-900/80 border-slate-800/90 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    POPULATION EXPOSED
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {totalExposedPopulation.toLocaleString()}
                    </span>
                    <span className="text-xs text-rose-500 font-semibold">Census Baseline</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Metric 4: Safe Zone Capacity */}
          <div 
            onClick={() => onNavigateTab('capacity')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-emerald-500/60 ${
              darkMode ? 'bg-slate-900/80 border-slate-800/90 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    AVAILABLE SAFE CAPACITY
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-500">
                      {totalSafeCapacity.toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">Immediate Beds</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Main Grid: GIS Tactical Map + Real-time Command Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Column (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <h2 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                  darkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Regional Tactical GIS Surface &bull; {currentLocation?.name} Sector
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('map')}
                className="text-xs text-rose-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Full GIS View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <LeafletGisMap
              height="580px"
              selectedHazard={selectedHazard}
              onSelectHazard={setSelectedHazard}
              selectedHabitation={selectedHabitation}
              onSelectHabitation={setSelectedHabitation}
              selectedSafeZone={selectedSafeZone}
              onSelectSafeZone={setSelectedSafeZone}
              onLaunchRelocationFor={(hab) => {
                onSelectHabitationForRelocation(hab);
                onNavigateTab('relocation');
              }}
            />
          </div>

          {/* Right Column: Live Operational Feeds (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Urgent Citizen SOS Rescue Queue */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b mb-3 ${
                darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500 font-mono">
                  <LifeBuoy className="w-4 h-4 text-rose-500 animate-spin" />
                  <span>Citizen Rescue SOS Queue</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white font-mono">
                  {rescueRequests.length} TICKETS
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {rescueRequests.length === 0 ? (
                  <div className={`p-3 text-center text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No active rescue SOS tickets. Operations normal.
                  </div>
                ) : (
                  rescueRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => onNavigateTab('incidents')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        req.status === 'SUBMITTED'
                          ? darkMode ? 'bg-rose-950/30 border-rose-800/40 hover:bg-rose-950/50' : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/80'
                          : darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                          {req.requesterName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 dark:text-rose-400 font-semibold">
                          {req.status}
                        </span>
                      </div>
                      <div className={`text-[11px] truncate mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {req.locationName} &bull; {req.peopleCount?.adults || 1} adults, {req.peopleCount?.children || 0} kids
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Priority Habitations in Critical Exposure */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b mb-2.5 ${
                darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  Priority Habitations (Relocation Deficit)
                </span>
                <button 
                  onClick={() => onNavigateTab('habitations')}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {priorityHabitations.map((hab) => (
                  <div
                    key={hab.id}
                    onClick={() => {
                      setSelectedHabitation(hab);
                      onSelectHabitationForRelocation(hab);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      darkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60' 
                        : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                        hab.riskLevel === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-600'
                      }`}>
                        <Home className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {hab.name}
                        </div>
                        <div className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Pop: {hab.population.toLocaleString()} &bull; Deficit: {hab.capacityUtilization}%
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHabitationForRelocation(hab);
                        onNavigateTab('relocation');
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer shadow-xs"
                      title="Route Evacuation"
                    >
                      Evacuate
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Emergency Broadcasts */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-xs'
            }`}>
              <div className={`flex items-center justify-between pb-2 border-b mb-3 ${
                darkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 font-mono">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Active Broadcast Alerts</span>
                </div>
                <button
                  onClick={() => onNavigateTab('alerts')}
                  className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                >
                  Manage ({activeAlertsCount})
                </button>
              </div>

              <div className="space-y-2">
                {alerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onNavigateTab('alerts')}
                    className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                      darkMode ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/50' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold truncate max-w-[190px] ${a.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`}>
                        {a.title}
                      </span>
                      <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {a.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Tactical Modules: Problem Analysis & NDRF Response Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Problem Analysis & Remediation Panel */}
          {problemReport && (
            <ProblemAnalysisPanel
              report={problemReport}
              darkMode={darkMode}
              onNavigateTab={onNavigateTab}
            />
          )}

          {/* NDRF / SDRF Tactical Response Support Panel */}
          {ndrfSupport && (
            <NDRFResponseSupportPanel
              data={ndrfSupport}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

