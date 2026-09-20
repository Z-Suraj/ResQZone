import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  Vibrate, 
  VolumeX, 
  CheckCircle2, 
  Radio, 
  MapPin, 
  Clock, 
  Sparkles,
  Filter,
  CheckCircle,
  Shield
} from 'lucide-react';
import { Alert } from '../../types';
import { emergencyStore, CitizenSettings } from '../../services/emergencyStore';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';

interface CitizenAlertsViewProps {
  darkMode: boolean;
}

export const CitizenAlertsView: React.FC<CitizenAlertsViewProps> = ({ darkMode }) => {
  const [alerts, setAlerts] = useState<Alert[]>(() => emergencyStore.getAlerts());
  const [settings, setSettings] = useState<CitizenSettings>(() => emergencyStore.getCitizenSettings());
  const [currentLoc, setCurrentLoc] = useState(() => emergencyStore.getCurrentLocation());
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY'>('ALL');
  const [vibrationTested, setVibrationTested] = useState(false);

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setAlerts(emergencyStore.getAlerts());
      setSettings(emergencyStore.getCitizenSettings());
      setCurrentLoc(emergencyStore.getCurrentLocation());
    });
  }, []);

  const handleToggleVibration = () => {
    const updated = !settings.emergencyVibration;
    emergencyStore.updateCitizenSettings({ emergencyVibration: updated });
    if (updated) {
      emergencyStore.triggerVibration([150, 100, 150]);
    }
  };

  const handleTestVibration = () => {
    emergencyStore.triggerVibration([300, 150, 300]);
    setVibrationTested(true);
    setTimeout(() => setVibrationTested(false), 2500);
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (severityFilter === 'WARNING') return a.severity === 'WARNING';
    if (severityFilter === 'ADVISORY') return a.severity === 'ADVISORY';
    return true;
  });

  return (
    <div className="relative min-h-full font-sans">
      {/* Background with realistic disaster response photography (Operations & Command Room) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.alerts} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Emergency Command Operations & Disaster Broadcast Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold font-mono mb-1.5 border border-rose-500/20">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>PUBLIC DISASTER BROADCASTS</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Emergency Alerts & Directives
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Official disaster notifications verified by the State Operations Command for {currentLoc ? `${currentLoc.name}, ${currentLoc.state}` : settings.homeSector}.
            </p>
          </div>

          {/* Vibration Setting Toggle */}
          <div className={`p-3 rounded-2xl border flex items-center gap-3 shadow-md ${
            darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Vibrate className={`w-4 h-4 ${settings.emergencyVibration ? 'text-emerald-500' : darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <div className="text-xs">
                <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Haptic Alert
                </div>
                <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Silent Vibration</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVibration}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.emergencyVibration ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.emergencyVibration ? 'left-6' : 'left-1'
                }`} />
              </button>

              {settings.emergencyVibration && (
                <button
                  onClick={handleTestVibration}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer"
                >
                  {vibrationTested ? 'Pulsed!' : 'Test'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Severity Filter Tabs & Policy Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className={`flex items-center gap-1.5 p-1 rounded-2xl border ${
            darkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/90 border-slate-200'
          }`}>
            {(['ALL', 'CRITICAL', 'WARNING', 'ADVISORY'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  severityFilter === sev
                    ? sev === 'CRITICAL'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : sev === 'WARNING'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev === 'ALL' ? `All (${alerts.length})` : sev}
              </button>
            ))}
          </div>

          <div className={`text-[11px] flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <VolumeX className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <span>Zero-Disturbance Audio: Visual & Haptic Only</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
          <div className={`p-10 rounded-3xl border text-center space-y-3 shadow-lg ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              No Verified Active Alerts in this Category
            </h3>
            <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No emergency warnings or disaster broadcasts currently active for this filter. Operations Command continuous monitoring active.
            </p>
          </div>
        )}

        {/* Alerts Feed */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            return (
              <div
                key={alert.id}
                className={`p-6 rounded-3xl border transition-all space-y-3.5 shadow-md ${
                  isCritical
                    ? darkMode
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/20'
                      : 'bg-rose-50/90 border-rose-300 shadow-sm'
                    : isWarning
                    ? darkMode
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : 'bg-amber-50/90 border-amber-200 shadow-sm'
                    : darkMode
                      ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80'
                      : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}
              >
                {/* Alert Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>

                    <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      ID: {alert.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{alert.timestamp}</span>
                    </span>
                    <span className="text-emerald-500 font-bold font-mono text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified: {alert.issuedBy}</span>
                    </span>
                  </div>
                </div>

                {/* Title & Description & Photo */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {alert.imageUrl && (
                    <img 
                      src={alert.imageUrl} 
                      alt={alert.title}
                      className="w-full sm:w-36 h-28 rounded-2xl object-cover shrink-0 ring-1 ring-slate-700/50 shadow-md"
                    />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <h3 className={`text-base sm:text-lg font-black leading-tight ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {alert.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {alert.description}
                    </p>
                  </div>
                </div>

                {/* Affected Sectors */}
                {alert.affectedHabitations && alert.affectedHabitations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className={`text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Affected Sectors:</span>
                    {alert.affectedHabitations.map((hab, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg border ${
                          darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        📍 {hab}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
