import React from 'react';
import { ResQZoneLogo } from './ResQZoneLogo';
import { Radio, ShieldAlert } from 'lucide-react';

interface LoadingScreenProps {
  statusText?: string;
  subtext?: string;
  darkMode?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  statusText = 'SYNCHRONIZING DISASTER INTELLIGENCE TELEMETRY',
  subtext = 'Connecting to SEOC Uttarakhand Geospatial Sensor Stream...',
  darkMode = true,
}) => {
  return (
    <div 
      className={`min-h-screen w-full flex flex-col items-center justify-center p-6 select-none transition-colors duration-300 ${
        darkMode ? 'bg-[#060b13] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Subtle Background Radial */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(225, 29, 72, 0.12) 0%, rgba(6, 11, 19, 0) 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-8">
        {/* Radar Pulse surrounding the Logo */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-rose-600/20 blur-xl animate-pulse" />
          <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-md">
            <ResQZoneLogo variant="stacked" size="lg" />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{statusText}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-cyan-400 rounded-full animate-pulse"
              style={{
                width: '78%',
                boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)',
              }}
            />
          </div>

          <p className="text-xs text-slate-400 font-medium">
            {subtext}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-8 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2 border-t border-slate-800/80 w-full">
          <span>RESQZONE PLATFORM</span>
          <span>•</span>
          <span>SAFER COMMUNITIES</span>
        </div>
      </div>
    </div>
  );
};
