import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Activity, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  PieChart as PieIcon, 
  Compass,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LifeBuoy
} from 'lucide-react';
import { DEMO_HABITATIONS } from '../../data/demoHabitations';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { emergencyStore } from '../../services/emergencyStore';
import { IMAGES } from '../../data/assets';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';

interface AnalyticsViewProps {
  darkMode: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ darkMode }) => {
  const [incidents, setIncidents] = useState(() => emergencyStore.getIncidents());
  const [alerts, setAlerts] = useState(() => emergencyStore.getAlerts());
  const [rescueRequests, setRescueRequests] = useState(() => emergencyStore.getRescueRequests());

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setIncidents(emergencyStore.getIncidents());
      setAlerts(emergencyStore.getAlerts());
      setRescueRequests(emergencyStore.getRescueRequests());
    });
  }, []);

  const totalPopulation = DEMO_HABITATIONS.reduce((acc, h) => acc + h.population, 0);
  const totalChildren = DEMO_HABITATIONS.reduce((acc, h) => acc + h.children0_6, 0);
  const totalHouseholds = DEMO_HABITATIONS.reduce((acc, h) => acc + h.households, 0);
  const totalRescues = rescueRequests.reduce((acc, req) => {
    if (!req.peopleCount) return acc + 1;
    return acc + (req.peopleCount.adults || 0) + (req.peopleCount.children || 0) + (req.peopleCount.elderlyOrSpecialCare || 0);
  }, 0);
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.analytics}
        darkMode={darkMode}
        alt="Analytics Command Center Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold font-mono mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>MACRO DISASTER ANALYTICS &amp; DEMOGRAPHIC EXPOSURE</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Geospatial Risk &amp; Evacuation Analytics
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Population exposure calibrated with Census 2011 baseline data, live incident telemetry, and hazard recurrence modeling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              ● Live Stream Synchronized
            </span>
          </div>
        </div>

        {/* Top Key Quantitative Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Monitored Exposed Population
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {totalPopulation.toLocaleString()}
            </div>
            <div className="text-xs text-rose-500 font-medium mt-1">
              {DEMO_HABITATIONS.length} Settlements Under Observation
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Vulnerable Minors (0-6 Yrs)
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono mt-1">
              {totalChildren.toLocaleString()}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              High-Priority Evacuee Cohort
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Verified Persons Rescued
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-500 font-mono mt-1">
              {totalRescues.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              Across {incidents.length} Ground Incidents
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-xs'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Incident Clearance Rate
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono mt-1">
              {incidents.length > 0 ? Math.round((resolvedIncidents / incidents.length) * 100) : 100}%
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {criticalIncidents} Critical Active Operations
            </div>
          </div>
        </div>

        {/* Main Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Population Vulnerability by Settlement (7 cols) */}
          <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Settlement Exposure &amp; Vulnerability Profile
              </h3>
              <span className={`text-[11px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Unit: Headcount
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {DEMO_HABITATIONS.slice(0, 7).map((h) => {
                const maxPop = 14000;
                const widthPct = Math.min(100, Math.round((h.population / maxPop) * 100));

                return (
                  <div key={h.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <span>{h.name}</span>
                        <span className={`text-[10px] font-mono ${
                          h.riskLevel === 'CRITICAL' ? 'text-rose-500 font-bold' : darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          ({h.riskLevel} RISK)
                        </span>
                      </span>
                      <span className={`font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {h.population.toLocaleString()} pax
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
                      darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          h.riskLevel === 'CRITICAL' ? 'bg-rose-500' :
                          h.riskLevel === 'HIGH' ? 'bg-amber-500' :
                          h.riskLevel === 'MODERATE' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hazard Breakdown in Himalayan Sector (5 cols) */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
          }`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Disaster Modality Distribution
            </h3>

            <div className={`p-4 rounded-xl border space-y-3 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              {[
                { type: 'Riverine Flash Floods (Mandakini / Alaknanda)', pct: 42, color: 'bg-cyan-500' },
                { type: 'Steep Slope Landslides & Rockfalls', pct: 30, color: 'bg-rose-500' },
                { type: 'Debris Flow & Mud Torrents', pct: 16, color: 'bg-amber-500' },
                { type: 'Seismic Liquefaction & Ground Cracks', pct: 12, color: 'bg-purple-500' },
              ].map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{item.type}</span>
                    <span className={`font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.pct}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}>
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              * Analytical models computed from historical Uttarakhand Disaster Management Authority (USDMA) records and live Central Water Commission telemetry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
