import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Check, 
  Layers, 
  Info, 
  Activity, 
  FileText,
  Filter,
  Flame,
  Waves,
  Truck,
  CloudRain,
  Radio
} from 'lucide-react';
import { ProblemAnalysisReport, ProblemItem, DataStatus } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';

interface ProblemAnalysisPanelProps {
  report: ProblemAnalysisReport;
  darkMode: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const ProblemAnalysisPanel: React.FC<ProblemAnalysisPanelProps> = ({
  report,
  darkMode,
  onNavigateTab,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'SOLVED'>('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState('');

  const filteredProblems = report.problems.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const handleResolve = (problemId: string) => {
    emergencyStore.updateProblemStatus(problemId, 'SOLVED', actionInput || 'Resolved by Incident Commander');
    setResolvingId(null);
    setActionInput('');
  };

  const handleSetInProgress = (problemId: string) => {
    emergencyStore.updateProblemStatus(problemId, 'IN_PROGRESS', 'Dispatched field team to address');
  };

  const getCategoryIcon = (category: ProblemItem['category']) => {
    switch (category) {
      case 'HAZARD': return <Flame className="w-3.5 h-3.5 text-rose-500" />;
      case 'CAPACITY': return <Activity className="w-3.5 h-3.5 text-amber-500" />;
      case 'ROUTE': return <Truck className="w-3.5 h-3.5 text-cyan-500" />;
      case 'WEATHER': return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
      case 'INCIDENT': return <AlertCircle className="w-3.5 h-3.5 text-purple-500" />;
      default: return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: DataStatus) => {
    switch (status) {
      case 'LIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LIVE SENSOR</span>;
      case 'VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">VERIFIED EOC</span>;
      case 'SYNTHETIC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">SYNTHETIC MODEL</span>;
      case 'DEMO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">PROTOTYPE GIS</span>;
      case 'UNAVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700/50 text-slate-400 border border-slate-600">FEED OFFLINE</span>;
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/95 border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
        darkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h3 className={`text-base font-bold font-mono tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Incident Problem Analysis &amp; Remediation
            </h3>
            {getStatusBadge(report.provenance.status)}
          </div>
          <p className="text-xs text-slate-400">
            Active analysis around <strong className="text-cyan-400">{report.selectedLocation}</strong> &bull; {report.problemsIdentified} bottlenecks tracked
          </p>
        </div>

        {/* Provenance note */}
        <div className="text-right text-[10px] font-mono text-slate-400">
          <div>Source: {report.provenance.source}</div>
          <div className="text-slate-400">{report.lastUpdated}</div>
        </div>
      </div>

      {/* Triage Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
        <div className={`p-3 rounded-xl border ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Identified</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
            {report.problemsIdentified}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{report.affectedHabitationsCount} Habitations impacted</div>
        </div>

        <div className={`p-3 rounded-xl border ${
          darkMode ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/70 border-rose-200'
        }`}>
          <div className="text-[10px] uppercase font-mono font-bold text-rose-400">Pending Remediation</div>
          <div className="text-2xl font-extrabold font-mono text-rose-500 mt-0.5">
            {report.problemsPending}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">Immediate intervention</div>
        </div>

        <div className={`p-3 rounded-xl border ${
          darkMode ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="text-[10px] uppercase font-mono font-bold text-emerald-400">Resolved / Mitigated</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-500 mt-0.5">
            {report.problemsSolved}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Corridors cleared</div>
        </div>

        <div className={`p-3 rounded-xl border ${
          darkMode ? 'bg-cyan-950/20 border-cyan-900/40' : 'bg-cyan-50/70 border-cyan-200'
        }`}>
          <div className="text-[10px] uppercase font-mono font-bold text-cyan-400">Resolution Progress</div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-0.5">
            {report.addressedPercentage}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${report.addressedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400">Status Filter:</span>
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'SOLVED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredProblems.length} items
        </span>
      </div>

      {/* Problem Items List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredProblems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No problems matching the active filter.
          </div>
        ) : (
          filteredProblems.map((prob) => {
            const isPending = prob.status === 'PENDING';
            const isInProgress = prob.status === 'IN_PROGRESS';
            const isSolved = prob.status === 'SOLVED';

            return (
              <div
                key={prob.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isPending
                    ? darkMode ? 'bg-slate-950/70 border-rose-900/40' : 'bg-rose-50/40 border-rose-200'
                    : isInProgress
                    ? darkMode ? 'bg-slate-950/70 border-amber-900/40' : 'bg-amber-50/40 border-amber-200'
                    : darkMode ? 'bg-slate-950/40 border-slate-800/80 opacity-75' : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {getCategoryIcon(prob.category)}
                        {prob.category}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        prob.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        prob.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {prob.severity}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isPending ? 'bg-rose-600/30 text-rose-300' :
                        isInProgress ? 'bg-amber-500/30 text-amber-300' :
                        'bg-emerald-500/30 text-emerald-300'
                      }`}>
                        {prob.status.replace('_', ' ')}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Identified: {prob.identifiedAt}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {prob.title}
                    </h4>

                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {prob.description}
                    </p>

                    {prob.actionTaken && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Remediation Action: {prob.actionTaken} {prob.resolvedAt && `(${prob.resolvedAt})`}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                    {isPending && (
                      <button
                        onClick={() => handleSetInProgress(prob.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Dispatch Units
                      </button>
                    )}

                    {!isSolved ? (
                      resolvingId === prob.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Action notes..."
                            value={actionInput}
                            onChange={(e) => setActionInput(e.target.value)}
                            className="px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-cyan-400 w-36"
                          />
                          <button
                            onClick={() => handleResolve(prob.id)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                            title="Confirm Resolve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(prob.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Mitigated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
