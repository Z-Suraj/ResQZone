import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  LifeBuoy, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Bell, 
  Radio 
} from 'lucide-react';
import { emergencyStore, ToastAlert } from '../../services/emergencyStore';

interface RealtimeToastNotifierProps {
  darkMode: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const RealtimeToastNotifier: React.FC<RealtimeToastNotifierProps> = ({ darkMode, onNavigateTab }) => {
  const [toasts, setToasts] = useState<ToastAlert[]>(() => emergencyStore.getToastNotifications());

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setToasts(emergencyStore.getToastNotifications());
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isCritical = toast.severity === 'CRITICAL';
        const isRescue = toast.type === 'RESCUE';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all transform animate-in slide-in-from-right duration-300 ${
              isCritical
                ? darkMode
                  ? 'bg-rose-950/90 border-rose-600/80 text-white shadow-rose-950/50'
                  : 'bg-rose-50 border-rose-300 text-rose-950 shadow-rose-200/50'
                : isRescue
                ? darkMode
                  ? 'bg-amber-950/90 border-amber-600/80 text-white shadow-amber-950/50'
                  : 'bg-amber-50 border-amber-300 text-amber-950 shadow-amber-200/50'
                : darkMode
                ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/60'
                : 'bg-white border-slate-300 text-slate-800 shadow-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                isCritical 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : isRescue
                  ? 'bg-amber-600 text-white'
                  : 'bg-cyan-600 text-white'
              }`}>
                {isCritical ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : isRescue ? (
                  <LifeBuoy className="w-4 h-4" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold tracking-tight truncate">
                    {toast.title}
                  </span>
                  <span className="text-[10px] opacity-70 font-mono shrink-0">
                    {toast.timestamp}
                  </span>
                </div>

                <p className="text-xs mt-0.5 leading-snug line-clamp-2 opacity-90">
                  {toast.message}
                </p>

                {onNavigateTab && (toast.type === 'INCIDENT' || toast.type === 'RESCUE') && (
                  <button
                    onClick={() => {
                      if (toast.type === 'INCIDENT') onNavigateTab('incidents');
                      else if (toast.type === 'RESCUE') onNavigateTab('incidents');
                      emergencyStore.dismissToast(toast.id);
                    }}
                    className="mt-2 text-[11px] font-bold underline cursor-pointer hover:opacity-80"
                  >
                    View in Command Desk →
                  </button>
                )}
              </div>

              <button
                onClick={() => emergencyStore.dismissToast(toast.id)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
