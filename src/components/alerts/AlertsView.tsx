import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Send, 
  Radio, 
  CheckCircle2, 
  Filter, 
  Search, 
  ShieldAlert, 
  Clock, 
  ChevronRight,
  Power,
  MapPin,
  Users,
  Volume2
} from 'lucide-react';
import { Alert } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';
import { IMAGES } from '../../data/assets';

interface AlertsViewProps {
  darkMode: boolean;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ darkMode }) => {
  const [alertsList, setAlertsList] = useState<Alert[]>(() => emergencyStore.getAlerts());
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRegion, setNewRegion] = useState('Chamoli Sector 2');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'WARNING' | 'ADVISORY'>('CRITICAL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setAlertsList(emergencyStore.getAlerts());
    });
  }, []);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const filteredAlerts = alertsList.filter((a) => {
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    return true;
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsBroadcasting(true);
    setTimeout(() => {
      emergencyStore.createAlert({
        title: newTitle,
        description: newDescription,
        severity: newSeverity,
        region: newRegion,
        affectedHabitations: [newRegion, 'Adjacent Downstream Settlements'],
        issuedBy: 'SEOC State Disaster Duty Officer',
      });
      setNewTitle('');
      setNewDescription('');
      setIsBroadcasting(false);
      showNotification('Emergency CAP broadcast dispatched across all citizen channels & SMS gateways.');
    }, 400);
  };

  const handleToggleActive = (id: string, currentlyActive: boolean) => {
    emergencyStore.toggleAlertActive(id);
    showNotification(`Alert #${id} is now ${currentlyActive ? 'DEACTIVATED' : 'ACTIVE'}.`);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.alerts}
        darkMode={darkMode}
        alt="Emergency Alerts Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold font-mono mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              <span>CAP PROTOCOL &amp; PUBLIC BROADCASTING</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Emergency Public Broadcasts &amp; Alerts
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Issue real-time Common Alerting Protocol (CAP) notifications to citizens in affected sectors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'CRITICAL', 'WARNING', 'ADVISORY'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedSeverity === sev
                    ? 'bg-rose-600 text-white shadow-xs'
                    : darkMode
                      ? 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
                      : 'bg-white/80 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback notification toast */}
        {notificationMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 backdrop-blur-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Broadcast New Alert Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className={`p-6 rounded-2xl border space-y-5 sticky top-24 ${
              darkMode ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/85 border-slate-200/90 backdrop-blur-md shadow-sm'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Issue Immediate CAP Alert Broadcast</span>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Alert Severity Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CRITICAL', 'WARNING', 'ADVISORY'] as const).map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setNewSeverity(lvl)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          newSeverity === lvl
                            ? lvl === 'CRITICAL' 
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950'
                              : 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950'
                            : darkMode
                              ? 'bg-slate-950/60 text-slate-400 border-slate-800'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Targeted Geographic Sector / District
                  </label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="e.g., Chamoli Sector 2, Joshimath, Helang"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                      darkMode 
                        ? 'bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Alert Headline
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., FLASH FLOOD WARNING - IMMEDIATE EVACUATION"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                      darkMode 
                        ? 'bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Directives &amp; Public Safety Action
                  </label>
                  <textarea
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g., Water levels in Dhauliganga river rising rapidly. Residents of low-lying settlements must immediately move to Upper Relief Enclave A."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                      darkMode 
                        ? 'bg-slate-950/70 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting || !newTitle.trim() || !newDescription.trim()}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isBroadcasting ? 'Transmitting Over CAP Gateways...' : 'Broadcast Emergency Alert Now'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Active & Historical Broadcast Ledger (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold font-mono uppercase tracking-wider ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Active Broadcast Ledger ({filteredAlerts.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Real-time synchronized with Citizen Mode
              </span>
            </div>

            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    alert.active
                      ? alert.severity === 'CRITICAL'
                        ? darkMode ? 'bg-rose-950/25 border-rose-800/40 backdrop-blur-md' : 'bg-rose-50/70 border-rose-200 backdrop-blur-md'
                        : darkMode ? 'bg-amber-950/20 border-amber-800/40 backdrop-blur-md' : 'bg-amber-50/70 border-amber-200 backdrop-blur-md'
                      : darkMode ? 'bg-slate-900/60 border-slate-800 opacity-60' : 'bg-white/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : alert.severity === 'WARNING'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                        }`}>
                          {alert.severity}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{alert.timestamp}</span>
                        </span>

                        <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{alert.region}</span>
                        </span>
                      </div>

                      <h3 className={`text-sm font-bold mt-1 ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {alert.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleActive(alert.id, alert.active)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                        alert.active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-400'
                      }`}
                      title="Toggle active broadcast state"
                    >
                      <Power className="w-3 h-3" />
                      <span>{alert.active ? 'ACTIVE' : 'DEACTIVATED'}</span>
                    </button>
                  </div>

                  <p className={`text-xs mt-2 leading-relaxed ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {alert.description}
                  </p>

                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                    darkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span className="truncate">
                      Issued by: <strong>{alert.issuedBy || 'SEOC Command'}</strong>
                    </span>
                    <span className="font-mono text-[10px]">
                      ID: {alert.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
