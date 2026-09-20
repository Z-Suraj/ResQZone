import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  CloudRain, 
  Waves, 
  Wind, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Thermometer,
  Sparkles
} from 'lucide-react';
import { resqSenseService } from '../../services/resqSenseService';

interface ResQSensePanelProps {
  darkMode?: boolean;
}

export const ResQSensePanel: React.FC<ResQSensePanelProps> = ({ darkMode = true }) => {
  const [data, setData] = useState(resqSenseService.getData());

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border text-left space-y-4 ${
      darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                ResQSense Early Warning
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-900/50 text-rose-300 border border-rose-700/50">
                PROTOTYPE SIMULATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sensor trend &bull; Pre-critical warning &bull; Predictive risk
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Risk Escalation Detected</span>
        </span>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Current Flood Risk</div>
          <div className="text-xl font-black text-rose-500 mt-0.5">{data.currentRiskPct}%</div>
          <div className="text-[10px] text-rose-400 font-medium">Critical Threshold</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Predicted Risk</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">{data.predictedRiskPct}%</div>
          <div className="text-[10px] text-slate-400 font-medium">Next 30–60 min</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Trend Status</div>
          <div className="text-sm font-black text-rose-400 mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>Escalating</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Telemetry active</div>
        </div>
      </div>

      {/* Sensor Readings Breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-300">
          Telemetry Readings
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.sensors.map((sensor) => (
            <div key={sensor.name} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{sensor.name}</span>
                <span className={sensor.isEscalating ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  {sensor.delta}
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-1">{sensor.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preparedness Checklist */}
      <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-300 mb-1 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Automated Preparedness Recommendations</span>
        </div>
        <ul className="space-y-1 text-xs text-slate-300">
          {data.recommendations.slice(0, 4).map((rec, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
