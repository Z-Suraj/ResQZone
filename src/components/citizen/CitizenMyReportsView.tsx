import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ShieldCheck, 
  ChevronRight,
  Camera,
  Plus,
  RefreshCw,
  Info,
  Sparkles
} from 'lucide-react';
import { Incident } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { db } from '../../services/supabaseClient';
import { authService } from '../../services/authService';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';
import { getIncidentImage, isUserUploadedImage } from '../../utils/imageResolvers';
import { SafeImage } from '../common/SafeImage';

interface CitizenMyReportsViewProps {
  darkMode: boolean;
  onOpenNewReport: () => void;
}

export const CitizenMyReportsView: React.FC<CitizenMyReportsViewProps> = ({
  darkMode,
  onOpenNewReport,
}) => {
  const [reports, setReports] = useState<Incident[]>(() => emergencyStore.getCitizenReports());
  const [selectedReport, setSelectedReport] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    // Initial fetch from supabase if available
    const loadFromDb = async () => {
      setIsLoading(true);
      try {
        const dbIncidents = await db.getIncidents();
        if (dbIncidents && dbIncidents.length > 0) {
          // Merge with emergencyStore reports
          const storeReports = emergencyStore.getCitizenReports();
          const combined = [...storeReports];
          dbIncidents.forEach((inc: any) => {
            if (!combined.some(c => c.id === inc.id)) {
              combined.push(inc);
            }
          });
          setReports(combined);
        }
      } catch (err) {
        console.warn('Could not sync reports with db:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFromDb();

    return emergencyStore.subscribe(() => {
      const updated = emergencyStore.getCitizenReports();
      setReports(prev => {
        const combined = [...updated];
        prev.forEach(p => {
          if (!combined.some(c => c.id === p.id)) combined.push(p);
        });
        return combined;
      });
      if (selectedReport) {
        const fresh = updated.find(r => r.id === selectedReport.id);
        if (fresh) setSelectedReport(fresh);
      }
    });
  }, [selectedReport]);

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'NEW':
        return { label: 'SUBMITTED', bg: 'bg-blue-500/15 text-blue-500 border-blue-500/30' };
      case 'VERIFYING':
        return { label: 'REVIEWING', bg: 'bg-amber-500/15 text-amber-500 border-amber-500/30' };
      case 'ACTIVE':
        return { label: 'VERIFIED & ACTIVE', bg: 'bg-rose-500/15 text-rose-500 border-rose-500/30' };
      case 'RESOLVED':
        return { label: 'RESOLVED', bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' };
      default:
        return { label: status, bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="relative min-h-full font-sans">
      {/* Realistic photography background (Field Incident Documentation) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.myReports} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Field Emergency Documentation & Incident Audit Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold font-mono mb-1.5 border border-blue-500/20">
              <FileText className="w-3.5 h-3.5" />
              <span>CITIZEN EMERGENCY SUBMISSIONS</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              My Incident Reports ({reports.length})
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Real-time audit log of your verified field reports and ongoing response operations.
            </p>
          </div>

          <button
            onClick={onOpenNewReport}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950/30 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Disaster</span>
          </button>
        </div>

        {reports.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center space-y-4 shadow-xl ${
            darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80 text-slate-400' : 'bg-white/85 backdrop-blur-md border-slate-200/90 text-slate-500 shadow-sm'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                No Verified Incident Reports Filed Yet
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                No active hazard tickets recorded for your citizen profile. If you observe rising floodwaters, road blockages, or collapsed bridges, submit an immediate field report with GPS.
              </p>
            </div>
            <button
              onClick={onOpenNewReport}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md"
            >
              Submit Disaster Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => {
              const badge = getStatusBadge(report.status);

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 shadow-md ${
                    darkMode 
                      ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80 hover:border-slate-700' 
                      : 'bg-white/85 backdrop-blur-md border-slate-200/90 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {/* Header: ID and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-blue-500">
                      TICKET #{report.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Photo & Main Details */}
                  {(() => {
                    const resolvedImg = getIncidentImage(report);
                    return (
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-700/50 bg-black/40 group">
                          <SafeImage
                            src={resolvedImg.url}
                            fallbackSrc={resolvedImg.fallbackUrl}
                            alt={report.title}
                            category="disaster"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-1 left-0.5 right-0.5 flex justify-center pointer-events-none">
                            {resolvedImg.isUserEvidence ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-[8px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5 whitespace-nowrap shadow-xs">
                                <Camera className="w-2 h-2" />
                                <span>User Photo</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950/90 text-[8px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-0.5 whitespace-nowrap shadow-xs">
                                <Sparkles className="w-2 h-2 text-amber-400" />
                                <span>AI Visual</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-black">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{report.type}</span>
                          </div>
                          <h3 className={`text-sm font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {report.title}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{report.location}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Citizen Report Description snippet */}
                  <p className={`text-xs line-clamp-2 leading-relaxed ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {report.citizenReportText || (report as any).description}
                  </p>

                  {/* Footer timestamp & View details */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/30 text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Reported: {report.reportedTime}</span>
                    </div>

                    <span className="text-[11px] font-bold text-blue-500 flex items-center gap-0.5">
                      <span>View Progress</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal View for Report Details */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-3xl border p-6 space-y-5 shadow-2xl ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-blue-500">INCIDENT DOSSIER</span>
                  <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    TICKET #{selectedReport.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Photo preview with authenticity indicator */}
              {(() => {
                const modalImg = getIncidentImage(selectedReport);
                return (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-700/50 bg-black/40">
                      <SafeImage
                        src={modalImg.url}
                        fallbackSrc={modalImg.fallbackUrl}
                        alt={`Evidence for ${selectedReport.title}`}
                        category="disaster"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />
                      
                      <div className="absolute top-3 left-3 pointer-events-none">
                        {modalImg.isUserEvidence ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-xs font-bold text-emerald-300 border border-emerald-500/50 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Authentic Citizen Ground Photo</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-950/90 text-xs font-bold text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>AI Visual Representation</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      {modalImg.isUserEvidence
                        ? 'Authentic ground photograph uploaded with citizen incident submission.'
                        : `Simulated visual representation of ${selectedReport.type} damage (illustrative only, not actual ground photograph).`}
                    </p>
                  </div>
                );
              })()}

              {/* Lifecycle Status Stepper */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 font-bold uppercase">Official Verification Stepper</div>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    1. SUBMITTED
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    selectedReport.status !== 'NEW' 
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                      : 'bg-slate-800/40 text-slate-400 border-slate-700'
                  }`}>
                    2. REVIEWING
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    selectedReport.status === 'ACTIVE' || selectedReport.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                      : 'bg-slate-800/40 text-slate-400 border-slate-700'
                  }`}>
                    3. VERIFIED
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    selectedReport.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                      : 'bg-slate-800/40 text-slate-400 border-slate-700'
                  }`}>
                    4. RESOLVED
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-400">Incident Category:</span>{' '}
                  <span className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedReport.type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Location / Sector:</span>{' '}
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedReport.location}</span>
                </div>
                <div>
                  <span className="text-slate-400">Citizen Observation:</span>
                  <p className={`mt-0.5 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedReport.citizenReportText || (selectedReport as any).description}
                  </p>
                </div>
                {selectedReport.verifiedBy && (
                  <div className="text-emerald-500 font-bold pt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified by {selectedReport.verifiedBy}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
