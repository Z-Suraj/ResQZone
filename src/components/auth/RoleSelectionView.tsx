import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ArrowRight, 
  Users, 
  Activity, 
  Clock, 
  Radio, 
  Satellite, 
  ChevronLeft,
  ShieldCheck,
  Navigation,
  Sparkles,
  Layers,
  PhoneCall
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../../types';
import { IMAGES } from '../../data/assets';
import { ResQZoneLogo } from '../common/ResQZoneLogo';

interface RoleSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
  onBackToLogin?: () => void;
  userName?: string;
}

export const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ 
  onSelectRole,
  onBackToLogin,
  userName,
}) => {
  // Live Clock
  const [currentTime, setCurrentTime] = useState<{ time: string; date: string }>({
    time: '--:--:-- --',
    date: '--- -- ----',
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();

      setCurrentTime({ time: timeStr, date: dateStr });
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col justify-between p-6 sm:p-10 overflow-x-hidden font-sans select-none">
      {/* Background Flood Rescue Photograph with Cinematic Lighting */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          src={IMAGES.heroFloodRescue}
          alt="Disaster Evacuation"
          className="w-full h-full object-cover object-center brightness-[0.35] contrast-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-[#070b14]/60" />
        <div 
          className="absolute inset-0 opacity-12"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToLogin && (
            <button
              onClick={onBackToLogin}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all mr-1"
              title="Return to Login"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <ResQZoneLogo 
            variant="badge" 
            size="md" 
            subtext="Select Operational Persona" 
          />
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-2.5 bg-slate-900/70 border border-slate-700/60 rounded-xl px-4 py-2 backdrop-blur-md">
          <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
          <div className="text-right">
            <div className="text-sm font-mono font-extrabold text-white tracking-wider">
              {currentTime.time}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {currentTime.date}
            </div>
          </div>
        </div>
      </header>

      {/* Center Section: Two Big Strategic Cards */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Dual Operational Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {userName ? `Welcome, ${userName}` : 'How will you use ResQZone?'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Please choose your role to configure your interface, safety privileges, and emergency tools.
          </p>
        </div>

        {/* The Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* CITIZEN PORTAL CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => onSelectRole('CITIZEN')}
            className="group relative h-[420px] rounded-3xl overflow-hidden cursor-pointer border border-slate-700/70 hover:border-emerald-500 transition-all duration-300 shadow-2xl hover:shadow-emerald-950/40 flex flex-col justify-end p-8 text-left bg-slate-900/60 backdrop-blur-md"
          >
            <img
              src={IMAGES.rescueBoat}
              alt="Citizen Community Evacuation & Rescue"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.5] group-hover:brightness-[0.6]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent group-hover:via-slate-950/50 transition-colors" />

            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center backdrop-blur-md">
                <Users className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                  Citizen
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Citizen Portal
                </h2>
              </div>

              <div className="space-y-1.5 text-slate-200 text-xs sm:text-sm font-medium">
                <p className="font-semibold text-emerald-300">
                  Stay safe, report emergencies and find nearby safe locations.
                </p>
                <p className="text-slate-300 text-xs">
                  Access real-time elevation maps, report hazards with photographic proof, find nearest shelters, and request SOS evacuation.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="px-4 py-2.5 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all">
                  <span>Continue as Citizen</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>

          {/* AUTHORITY COMMAND CARD */}
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => onSelectRole('AUTHORITY')}
            className="group relative h-[420px] rounded-3xl overflow-hidden cursor-pointer border border-slate-700/70 hover:border-rose-500 transition-all duration-300 shadow-2xl hover:shadow-rose-950/40 flex flex-col justify-end p-8 text-left bg-slate-900/60 backdrop-blur-md"
          >
            <img
              src={IMAGES.commandCenter}
              alt="Authority Emergency Operations Command"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.45] group-hover:brightness-[0.55]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent group-hover:via-slate-950/50 transition-colors" />

            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center backdrop-blur-md">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
                  Authority
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Authority Operations Desk
                </h2>
              </div>

              <div className="space-y-1.5 text-slate-200 text-xs sm:text-sm font-medium">
                <p className="font-semibold text-rose-300">
                  Monitor incidents, coordinate response and manage evacuations.
                </p>
                <p className="text-slate-300 text-xs">
                  Verify ground incident reports, broadcast public warnings, dispatch NDRF/SDRF rescue teams, and manage shelter capacities.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="px-4 py-2.5 rounded-xl bg-rose-600 group-hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition-all">
                  <span>Continue as Authority</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Bottom Footer Telemetry */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-3">
        <ResQZoneLogo variant="symbol" size="xs" />
        <span>RES<span className="text-rose-500">Q</span>ZONE PLATFORM</span>
        <span>•</span>
        <span>Safer People. Safer Communities.</span>
        <span>•</span>
        <span>SEOC INTEGRATED</span>
      </footer>
    </div>
  );
};
