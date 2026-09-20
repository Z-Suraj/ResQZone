import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  UserCheck, 
  Send,
  Lock,
  LifeBuoy,
  XCircle,
  FileText,
  AlertTriangle,
  Users,
  Maximize2,
  X,
  Radio,
  Truck
} from 'lucide-react';
import { Incident } from '../../types';
import { emergencyStore, CitizenRescueRequest } from '../../services/emergencyStore';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';
import { IMAGES } from '../../data/assets';

interface IncidentsViewProps {
  darkMode: boolean;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ darkMode }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => emergencyStore.getIncidents());
  const [rescueRequests, setRescueRequests] = useState<CitizenRescueRequest[]>(() => emergencyStore.getRescueRequests());
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'REPORTS' | 'RESCUE'>('ALL');
  
  const [activeIncidentId, setActiveIncidentId] = useState<string>(incidents[0]?.id || '');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      const incs = emergencyStore.getIncidents();
      const rsqs = emergencyStore.getRescueRequests();
      setIncidents(incs);
      setRescueRequests(rsqs);
      if (!activeIncidentId && incs[0]) {
        setActiveIncidentId(incs[0].id);
      }
    });
  }, []);

  const activeIncident = incidents.find(i => i.id === activeIncidentId) || incidents[0];

  const showFeedback = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleVerify = (id: string) => {
    emergencyStore.updateIncidentStatus(id, 'ACTIVE', 'SEOC Duty Officer Capt. Rawat', 'Verified via ground aerial camera & local SDRF outpost.');
    showFeedback(`Incident #${id} verified. Status updated to ACTIVE.`);
  };

  const handleDismiss = (id: string) => {
    emergencyStore.updateIncidentStatus(id, 'RESOLVED', 'SEOC Triage (Duplicate/Dismissed)', 'Dismissed or duplicate submission.');
    showFeedback(`Incident #${id} marked dismissed.`);
  };

  const handleEscalateToRescue = (inc: Incident) => {
    emergencyStore.createRescueRequest({
      requesterName: inc.reporterName,
      contactPhone: inc.reporterPhone,
      locationName: inc.location,
      coordinates: inc.coordinates,
      peopleCount: { adults: 2, children: 1, elderlyOrSpecialCare: 0 },
      urgency: 'CRITICAL_IMMEDIATE',
      message: `Escalated from Incident #${inc.id}: ${inc.citizenReportText || inc.title}`,
    });
    emergencyStore.updateIncidentStatus(inc.id, 'ACTIVE', 'Escalated to Rescue Team');
    showFeedback(`Incident #${inc.id} escalated to rapid NDRF/SDRF rescue dispatch!`);
  };

  const handleResolve = (id: string) => {
    emergencyStore.updateIncidentStatus(id, 'RESOLVED');
    showFeedback(`Incident #${id} marked as RESOLVED.`);
  };

  const handleUpdateRescueStatus = (id: string, status: CitizenRescueRequest['status'], team: string) => {
    emergencyStore.updateRescueRequestStatus(id, status, team);
    showFeedback(`Rescue #${id} status updated to ${status}. Assigned to ${team}.`);
  };

  const handleSaveInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteInput.trim() || !activeIncident) return;

    emergencyStore.updateIncidentStatus(
      activeIncident.id,
      activeIncident.status,
      activeIncident.verifiedBy,
      internalNoteInput
    );
    setInternalNoteInput('');
    showFeedback('Confidential operational note recorded in incident ledger.');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.incidents}
        darkMode={darkMode}
        alt="Incidents Command Desk Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-[1800px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold font-mono mb-1.5 border border-rose-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>AUTHORITY INCIDENT COMMAND DESK</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Field Incidents &amp; Rescue Operations Desk
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Triage crowdsourced citizen ground reports, verify evidence, dispatch rescue personnel, and maintain internal operational logs.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                activeTabFilter === 'ALL'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
              }`}
            >
              All ({incidents.length + rescueRequests.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('REPORTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTabFilter === 'REPORTS'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Citizen Reports ({incidents.length})</span>
            </button>
            <button
              onClick={() => setActiveTabFilter('RESCUE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTabFilter === 'RESCUE'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-500" />
              <span>SOS Rescues ({rescueRequests.length})</span>
            </button>
          </div>
        </div>

        {notificationMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Main Grid: List on Left, Detail & Actions on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left List of Incidents & SOS Requests */}
          <div className="lg:col-span-6 space-y-4">
            {/* Active SOS Rescue Requests Banner */}
            {rescueRequests.length > 0 && (activeTabFilter === 'ALL' || activeTabFilter === 'RESCUE') && (
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <LifeBuoy className="w-4 h-4 animate-spin" />
                  <span>ACTIVE CITIZEN SOS DISPATCH QUEUE ({rescueRequests.length})</span>
                </div>

                {rescueRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      darkMode 
                        ? 'bg-amber-950/25 border-amber-500/40 backdrop-blur-md shadow-sm' 
                        : 'bg-amber-50/80 border-amber-300 backdrop-blur-md shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase font-mono">
                            {req.urgency}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-400">#{req.id}</span>
                          <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{req.requesterName}</span>
                        </div>
                        <p className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {req.message}
                        </p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-rose-500">
                            <MapPin className="w-3 h-3" />
                            <span>{req.locationName}</span>
                          </span>
                          <span>•</span>
                          <span>Phone: {req.contactPhone}</span>
                          <span>•</span>
                          <span>People: {req.peopleCount?.adults || 1} adults, {req.peopleCount?.children || 0} kids</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {req.status}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          ETA: {req.estimatedArrivalMinutes}m
                        </div>
                      </div>
                    </div>

                    {/* Quick Dispatch Controls */}
                    <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Assigned: <strong>{req.assignedTeam || 'Unassigned'}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateRescueStatus(req.id, 'RESPONSE_DISPATCHED', 'NDRF Battalion 8 Unit')}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Dispatch NDRF
                        </button>
                        <button
                          onClick={() => handleUpdateRescueStatus(req.id, 'ON_SCENE', 'SDRF Quick Response Unit 1')}
                          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Mark In-Progress
                        </button>
                        <button
                          onClick={() => handleUpdateRescueStatus(req.id, 'RESCUED', req.assignedTeam || 'Rescue Team')}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regular Incidents & Citizen Reports */}
            {(activeTabFilter === 'ALL' || activeTabFilter === 'REPORTS') && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                  GROUND REPORTS INGESTION QUEUE ({incidents.length})
                </div>

                {incidents.map((inc) => {
                  const isSelected = activeIncident?.id === inc.id;

                  return (
                    <div
                      key={inc.id}
                      onClick={() => setActiveIncidentId(inc.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? darkMode
                            ? 'border-rose-500 bg-slate-800/80 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500'
                            : 'border-rose-500 bg-rose-50/60 shadow-md ring-1 ring-rose-500'
                          : darkMode 
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 backdrop-blur-md' 
                            : 'bg-white/85 border-slate-200/90 hover:border-slate-300 backdrop-blur-md shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                              inc.severity === 'CRITICAL' 
                                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                                : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className={`text-xs font-mono font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              #{inc.id}
                            </span>
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {inc.type}
                            </span>
                          </div>

                          <h3 className={`text-sm font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {inc.title}
                          </h3>

                          <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{inc.location}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            inc.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : inc.status === 'NEW'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {inc.status}
                          </span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            {inc.reportedTime}
                          </div>
                        </div>
                      </div>

                      {/* Image Thumbnail if attached */}
                      {inc.imageUrl && (
                        <div className="mt-3 flex items-center gap-2">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPhotoUrl(inc.imageUrl || null);
                            }}
                            className="w-16 h-12 rounded-lg overflow-hidden border border-slate-700 relative group cursor-zoom-in"
                          >
                            <img src={inc.imageUrl} alt={inc.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5" />
                            Citizen Photographic Evidence Attached
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Detailed Triage Dossier */}
          <div className="lg:col-span-6 space-y-4">
            {activeIncident ? (
              <div className={`p-6 rounded-2xl border space-y-5 sticky top-24 ${
                darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-md'
              }`}>
                {/* Dossier Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-600 text-white font-mono">
                        {activeIncident.severity}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">ID #{activeIncident.id}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">• Ingested: {activeIncident.reportedTime}</span>
                    </div>
                    <h2 className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activeIncident.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{activeIncident.location} ({activeIncident.coordinates[0].toFixed(4)}°N, {activeIncident.coordinates[1].toFixed(4)}°E)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                      activeIncident.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {activeIncident.status}
                    </span>
                  </div>
                </div>

                {/* Evidence Image Preview */}
                {activeIncident.imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 max-h-56 group">
                    <img
                      src={activeIncident.imageUrl}
                      alt={activeIncident.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => setSelectedPhotoUrl(activeIncident.imageUrl || null)}
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Full Resolution</span>
                    </button>
                  </div>
                )}

                {/* Citizen Submitted Narrative */}
                <div className={`p-4 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>Citizen Report Narrative &amp; Submitter Info</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    "{activeIncident.citizenReportText}"
                  </p>
                  <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                    darkMode ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}>
                    <span>Reporter: <strong className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{activeIncident.reporterName}</strong></span>
                    <span>Contact: <strong className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{activeIncident.reporterPhone}</strong></span>
                  </div>
                </div>

                {/* Triage & Operational Command Actions */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    SEOC Action Directives
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleVerify(activeIncident.id)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>

                    <button
                      onClick={() => handleEscalateToRescue(activeIncident)}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Dispatch Rescue</span>
                    </button>

                    <button
                      onClick={() => handleResolve(activeIncident.id)}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>

                    <button
                      onClick={() => handleDismiss(activeIncident.id)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>

                {/* Confidential Internal Authority Log */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Confidential Authority Log (SEOC Ledger)</span>
                    </div>
                    {activeIncident.verifiedBy && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Audited by: {activeIncident.verifiedBy}
                      </span>
                    )}
                  </div>

                  {activeIncident.internalNotes && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                      {activeIncident.internalNotes}
                    </div>
                  )}

                  <form onSubmit={handleSaveInternalNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add operational notes (visible to authority personnel only)..."
                      value={internalNoteInput}
                      onChange={(e) => setInternalNoteInput(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs border transition-colors ${
                        darkMode 
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!internalNoteInput.trim()}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Log</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className={`p-12 text-center rounded-2xl border ${
                darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white/60 border-slate-200 text-slate-500'
              }`}>
                Select an incident from the ingestion queue to inspect triage details.
              </div>
            )}
          </div>
        </div>

        {/* Photo Lightbox Modal */}
        {selectedPhotoUrl && (
          <div 
            onClick={() => setSelectedPhotoUrl(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl"
            >
              <img src={selectedPhotoUrl} alt="Citizen Evidence" className="w-full h-full object-contain" />
              <button
                onClick={() => setSelectedPhotoUrl(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
