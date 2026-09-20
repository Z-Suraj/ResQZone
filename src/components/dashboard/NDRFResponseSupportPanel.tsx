import React from 'react';
import { 
  Shield, 
  Users, 
  PhoneCall, 
  Clock, 
  Navigation, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Radio, 
  Truck, 
  LifeBuoy, 
  Anchor,
  HelpCircle
} from 'lucide-react';
import { EmergencyResponseSupportData, NDRFResourceUnit, DataStatus } from '../../types';

interface NDRFResponseSupportPanelProps {
  data: EmergencyResponseSupportData;
  darkMode: boolean;
}

export const NDRFResponseSupportPanel: React.FC<NDRFResponseSupportPanelProps> = ({
  data,
  darkMode,
}) => {
  const getStatusBadge = (status: DataStatus) => {
    switch (status) {
      case 'LIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LIVE COMMS</span>;
      case 'VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">VERIFIED ROSTER</span>;
      case 'SYNTHETIC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">ESTIMATED DISPATCH</span>;
      case 'DEMO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">PROTOTYPE READINESS</span>;
      case 'UNAVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700/50 text-slate-400 border border-slate-600">UNIT OFFLINE</span>;
    }
  };

  const getUnitStatusColor = (status: NDRFResourceUnit['status']) => {
    switch (status) {
      case 'ON_SCENE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'DEPLOYED': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'MOBILIZING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'STANDBY': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'AVAILABLE': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const nearest = data.nearestUnit;

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
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className={`text-base font-bold font-mono tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              NDRF / SDRF Disaster Response Readiness
            </h3>
            {getStatusBadge(data.provenance.status)}
          </div>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Multi-agency tactical force deployment &bull; Priority Level: <strong className="text-rose-500 dark:text-rose-400">{data.incidentPriority}</strong>
          </p>
        </div>

        <div className={`text-right text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <div>Source: {data.provenance.source}</div>
          <div>Updated: {data.provenance.lastUpdated}</div>
        </div>
      </div>

      {/* Nearest First Responder Spotlight */}
      {nearest && (
        <div className={`mt-4 p-4 rounded-xl border ${
          darkMode ? 'bg-cyan-950/20 border-cyan-800/40' : 'bg-cyan-50/70 border-cyan-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-mono">
                  Primary Quick Response
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border font-mono ${getUnitStatusColor(nearest.status)}`}>
                  {nearest.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {nearest.name} ({nearest.type})
              </h4>
              <div className={`flex items-center gap-3 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> {nearest.baseLocation} ({nearest.distanceKm} km)
                </span>
                <span className="flex items-center gap-1 font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  <Clock className="w-3.5 h-3.5" /> ETA: {nearest.etaMin} mins
                </span>
              </div>
            </div>

            {/* Officer Contact */}
            <div className={`flex items-center gap-2 p-2.5 rounded-xl border shrink-0 ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className={`font-bold truncate max-w-[140px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{nearest.contactOfficer}</div>
                <div className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold text-[11px]">{nearest.contactNumber}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Balance Meter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
        {/* Personnel */}
        <div className={`p-3.5 rounded-xl border ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={`flex items-center gap-1 font-bold font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Rescue Personnel
            </span>
            <span className={`font-mono font-bold text-[11px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {data.availablePersonnel} / {data.requiredPersonnel} required
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                data.availablePersonnel >= data.requiredPersonnel ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.round((data.availablePersonnel / (data.requiredPersonnel || 1)) * 100))}%` }}
            />
          </div>
          <div className={`flex items-center justify-between text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Mobilized across 4 sectors</span>
            <span className={data.availablePersonnel >= data.requiredPersonnel ? 'text-emerald-500 dark:text-emerald-400 font-semibold' : 'text-amber-500 dark:text-amber-400 font-semibold'}>
              {data.availablePersonnel >= data.requiredPersonnel ? 'Adequate Coverage' : 'Deficit: Dispatching backup'}
            </span>
          </div>
        </div>

        {/* Boats & Tactical Vehicles */}
        <div className={`p-3.5 rounded-xl border ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={`flex items-center gap-1 font-bold font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <Anchor className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Boats &amp; High-Water Vehicles
            </span>
            <span className={`font-mono font-bold text-[11px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {data.availableBoatsOrVehicles} / {data.requiredBoatsOrVehicles} required
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                data.availableBoatsOrVehicles >= data.requiredBoatsOrVehicles ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.round((data.availableBoatsOrVehicles / (data.requiredBoatsOrVehicles || 1)) * 100))}%` }}
            />
          </div>
          <div className={`flex items-center justify-between text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Inflatable OBMs &amp; 4x4 trucks</span>
            <span className={data.availableBoatsOrVehicles >= data.requiredBoatsOrVehicles ? 'text-emerald-500 dark:text-emerald-400 font-semibold' : 'text-rose-500 dark:text-rose-400 font-semibold'}>
              {data.availableBoatsOrVehicles >= data.requiredBoatsOrVehicles ? 'Sufficient Assets' : 'Asset Request Raised'}
            </span>
          </div>
        </div>
      </div>

      {/* Roster of Tactical Units */}
      <div className="space-y-2">
        <div className={`text-[11px] font-bold uppercase tracking-wider font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Deployed Tactical Units Roster ({data.units.length})
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {data.units.map((unit) => (
            <div
              key={unit.id}
              className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${getUnitStatusColor(unit.status)}`}>
                    {unit.status.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
                    ETA {unit.etaMin}m ({unit.distanceKm} km)
                  </span>
                </div>

                <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {unit.name}
                </div>
                <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {unit.type} &bull; {unit.baseLocation}
                </div>
              </div>

              <div className={`flex items-center justify-between pt-2 border-t mt-2 text-[11px] ${
                darkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  {unit.personnelCount} pax &bull; {unit.boatsCount} boats &bull; {unit.vehiclesCount} veh.
                </span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[10px]">
                  {unit.contactOfficer}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
