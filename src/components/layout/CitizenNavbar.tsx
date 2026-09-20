import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  PhoneCall, 
  Bell, 
  Sun, 
  Moon, 
  Sparkles, 
  ChevronDown, 
  LogOut, 
  Activity, 
  Clock,
  Radio,
  User,
  Compass
} from 'lucide-react';
import { UserRole } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { AuthUser, generateInitialsAvatar } from '../../services/authService';
import { ResQZoneLogo } from '../common/ResQZoneLogo';

interface CitizenNavbarProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onRoleChange: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAiAssistant: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onReturnToLanding?: () => void;
}

export const CitizenNavbar: React.FC<CitizenNavbarProps> = ({
  currentTab,
  onNavigateTab,
  onRoleChange,
  darkMode,
  onToggleDarkMode,
  onOpenAiAssistant,
  currentUser,
  onLogout,
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentLoc, setCurrentLoc] = useState(() => emergencyStore.getCurrentLocation());
  const activeAlerts = emergencyStore.getAlerts().filter(a => a.active);

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setCurrentLoc(emergencyStore.getCurrentLocation());
    });
  }, []);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const displayName = currentUser?.name || 'Citizen User';
  const displayEmail = currentUser?.email || 'citizen@resqzone.org';
  const displayId = currentUser?.id || 'CIT-2026-USER';
  const avatarUrl = currentUser?.avatar || generateInitialsAvatar(displayName, 'CITIZEN');

  return (
    <header className={`h-16 px-4 md:px-6 border-b z-40 transition-colors flex items-center justify-between sticky top-0 ${
      darkMode 
        ? 'bg-[#090e17]/95 border-slate-800/80 text-slate-100 backdrop-blur-md' 
        : 'bg-[#ffffff]/95 border-slate-200/90 text-slate-800 backdrop-blur-md shadow-xs'
    }`}>
      {/* Left: Brand logo & Dynamic Location Pill */}
      <div className="flex items-center gap-3 sm:gap-5">
        <ResQZoneLogo 
          variant="badge" 
          size="sm" 
          theme={darkMode ? 'dark' : 'light'}
          subtext="Intelligent Hazard Red Zone & Relocation System" 
          onClick={() => onNavigateTab('citizen-home')}
          className="focus:outline-hidden"
        />

        {/* Dynamic Location Pill */}
        <div 
          onClick={() => onNavigateTab('citizen-my-area')}
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
            darkMode 
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-200' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
          }`}
          title="Change Sector / View Area Risk"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-bold text-[11px] leading-tight truncate max-w-[130px]">
              {currentLoc ? currentLoc.name : 'Select Sector'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {currentLoc ? (currentLoc.state || currentLoc.district) : 'India'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle/Right Status & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Safety Risk Indicator */}
        <div className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs ${
          !currentLoc
            ? darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            : currentLoc.riskLevel === 'CRITICAL'
            ? darkMode ? 'bg-rose-950/40 border-rose-900/60 text-rose-400' : 'bg-rose-50 border-rose-300 text-rose-700'
            : currentLoc.riskLevel === 'HIGH'
            ? darkMode ? 'bg-amber-950/40 border-amber-900/60 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-800'
            : darkMode ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              !currentLoc ? 'bg-blue-500' :
              currentLoc.riskLevel === 'CRITICAL' || currentLoc.riskLevel === 'HIGH' ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              !currentLoc ? 'bg-blue-600' :
              currentLoc.riskLevel === 'CRITICAL' || currentLoc.riskLevel === 'HIGH' ? 'bg-rose-600' : 'bg-emerald-600'
            }`} />
          </span>
          <div className="flex flex-col text-left">
            <span className="font-bold text-[11px] leading-tight">
              {currentLoc ? `${currentLoc.riskLevel} RISK` : 'MONITORING'}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
              {currentLoc ? currentLoc.name : 'All Regions'}
            </span>
          </div>
        </div>

        {/* Real-time Clock */}
        <div className={`hidden md:flex flex-col items-end text-right px-2.5 py-1 rounded-xl font-mono ${
          darkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <span className="text-xs font-bold tracking-wider leading-tight">{formatTime(currentTime)}</span>
          <span className="text-[10px] text-slate-400 font-medium">{formatDate(currentTime)}</span>
        </div>

        {/* Ask AI Safety Assistant */}
        <button
          onClick={onOpenAiAssistant}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-500 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
          title="Ask ResQ Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">ResQ Assistant</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => onNavigateTab('citizen-alerts')}
          className={`p-2 rounded-xl border relative transition-colors cursor-pointer ${
            darkMode 
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300' 
              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
          }`}
          title="Emergency Broadcasts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {activeAlerts.length > 0 ? activeAlerts.length : 3}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            darkMode 
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-amber-400' 
              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile Avatar: Real Authenticated User Name */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl border transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-200' 
                : 'bg-white border-slate-300 hover:bg-slate-50 text-[#0F172A] shadow-xs'
            }`}
            title="User Profile & Portal Switch"
          >
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300 dark:ring-slate-700 shrink-0" 
            />
            <div className="text-left max-w-[130px] sm:max-w-[150px]">
              <div className="text-xs font-black leading-tight text-[#0F172A] dark:text-white truncate">
                {displayName}
              </div>
              <div className="text-[10px] font-bold text-[#475569] dark:text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Citizen</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-0.5" />
          </button>

          {showProfileDropdown && (
            <div className={`absolute right-0 mt-2 w-64 rounded-2xl border p-2.5 shadow-2xl z-50 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-[#0F172A]'
            }`}>
              <div className={`px-3 py-2 border-b mb-1.5 rounded-xl ${
                darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-[#F8FAFC]'
              }`}>
                <div className="text-xs font-black text-[#0F172A] dark:text-white truncate">{displayName}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{displayEmail}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Verified Citizen Account</span>
                </div>
              </div>

              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Portal Switch
              </div>

              <button
                onClick={() => {
                  onRoleChange('AUTHORITY');
                  setShowProfileDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between mb-1 cursor-pointer transition-colors ${
                  darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <span>Switch to Authority Desk</span>
                </div>
              </button>

              <div className="border-t border-slate-700/50 my-1.5 pt-1.5 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onNavigateTab('citizen-settings');
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Citizen Settings
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/15 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
