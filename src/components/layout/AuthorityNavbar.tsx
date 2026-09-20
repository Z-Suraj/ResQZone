import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Sun, 
  Moon, 
  Bell, 
  ChevronDown, 
  Activity, 
  MapPin, 
  SlidersHorizontal,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Radio,
  Share2
} from 'lucide-react';
import { UserRole } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { AuthUser } from '../../services/authService';
import { ResQZoneLogo } from '../common/ResQZoneLogo';
import { AuthorityLocationSearch } from '../common/AuthorityLocationSearch';

interface AuthorityNavbarProps {
  onRoleChange: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  onOpenWhatIf: () => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  onNavigateTab: (tab: string) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onReturnToLanding?: () => void;
}

export const AuthorityNavbar: React.FC<AuthorityNavbarProps> = ({
  onRoleChange,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenWhatIf,
  selectedRegion,
  onSelectRegion,
  onNavigateTab,
  currentUser,
  onLogout,
  onReturnToLanding,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      const day = now.getDate();
      const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const year = now.getFullYear();
      
      setTimeStr(time);
      setDateStr(`${day} ${month} ${year}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const regions = [
    { id: 'uttarakhand', name: 'Uttarakhand', sub: 'Chamoli District • Alaknanda Basin' },
    { id: 'assam', name: 'Assam', sub: 'Majuli Riverine Basin • Brahmaputra' },
    { id: 'kerala', name: 'Kerala', sub: 'Wayanad Mountain Belt' },
    { id: 'odisha', name: 'Odisha', sub: 'Puri Coastal Cyclone Corridor' },
  ];

  const activeAlerts = emergencyStore.getAlerts().filter(a => a.active);

  return (
    <header className={`h-16 px-4 md:px-6 border-b z-40 transition-colors flex items-center justify-between sticky top-0 ${
      darkMode 
        ? 'bg-[#090e17]/95 border-slate-800/80 text-slate-100 backdrop-blur-md' 
        : 'bg-[#ffffff]/95 border-slate-200/90 text-slate-800 backdrop-blur-md shadow-xs'
    }`}>
      {/* Brand logo & Command Title - Prompt Section 13 */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div 
          onClick={() => {
            if (onReturnToLanding) onReturnToLanding();
            else onNavigateTab('dashboard');
          }}
          className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
          title="Return to Dashboard / Landing"
        >
          <ResQZoneLogo 
            variant="symbol" 
            size="md" 
            theme={darkMode ? 'dark' : 'light'}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold tracking-wider text-base font-mono uppercase ${
                darkMode ? 'text-white' : 'text-[#17202A]'
              }`}>
                RES<span className="text-[#DC2626]">Q</span><span className="text-[#DC2626]">Z</span>ONE
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30 font-mono">
                COMMAND CENTER
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Intelligent Hazard Red Zone &amp; Relocation System
            </p>
          </div>
        </div>

        {/* Global Authority Location Search & Spatial Radius */}
        <div className="hidden lg:block">
          <AuthorityLocationSearch 
            darkMode={darkMode}
            onLocationSelected={(loc) => {
              onSelectRegion(loc.name);
            }}
          />
        </div>

        {/* Emergency Level Indicator - Prompt Section 13 */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/15 border border-rose-500/30 text-rose-500 text-xs font-bold font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>SEVERITY LEVEL 4 (RED)</span>
        </div>
      </div>

      {/* Right Controls: Clock, System Status, Alert Broadcast Trigger, Theme, Role */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Online Telemetry */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">48 SENSORS ONLINE</span>
        </div>

        {/* Live Clock (02:37:14 AM 18 SEP 2026) */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono ${
          darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <div className="text-right">
            <div className="text-xs font-bold text-rose-500">
              {timeStr || '14:23:16'}
            </div>
            <div className="text-[9px] text-slate-400 leading-none">
              {dateStr || '18 SEP 2026'}
            </div>
          </div>
        </div>

        {/* Quick Alert Broadcast Trigger - Prompt Section 13 */}
        <button
          onClick={() => onNavigateTab('alerts')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/20 transition-all cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>BROADCAST ALERT</span>
        </button>

        {/* Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className={`p-2 rounded-xl border relative transition-colors cursor-pointer ${
              darkMode 
                ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
            }`}
            title="Active Bulletins"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border p-3 shadow-2xl z-50 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 mb-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-500 font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  Active CAP Bulletins ({activeAlerts.length})
                </div>
                <button 
                  onClick={() => {
                    setShowAlertsDropdown(false);
                    onNavigateTab('alerts');
                  }}
                  className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {activeAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      onNavigateTab('alerts');
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={alert.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}>
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Mode Toggle */}
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

        {/* Authority Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl border transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 text-slate-200' 
                : 'bg-white border-slate-300 hover:bg-slate-50 text-[#0F172A] shadow-xs'
            }`}
            title="Commander Profile & Sector Actions"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-xs font-black text-white shrink-0">
              {(currentUser?.name || 'Commander').slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block max-w-[140px]">
              <div className="text-xs font-black leading-tight text-[#0F172A] dark:text-white truncate">
                {currentUser?.name || 'Authority Lead'}
              </div>
              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase font-mono">
                {currentUser?.department || 'SEOC Command'}
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
                <div className="text-xs font-black text-[#0F172A] dark:text-white truncate">{currentUser?.name || 'Authority Commander'}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  auth.id: {currentUser?.badgeNumber || currentUser?.id || 'AUTH-OPS-2026'}
                </div>
                <div className="text-[10px] text-rose-600 dark:text-rose-500 font-bold mt-1">● Incident Commander Access</div>
              </div>

              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational View
              </div>

              <button
                onClick={() => {
                  onRoleChange('CITIZEN');
                  setShowProfileDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between mb-1 cursor-pointer transition-colors ${
                  darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Switch to Citizen Portal</span>
                </div>
              </button>

              <div className="border-t border-slate-700/50 my-1.5 pt-1.5 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onOpenSettings();
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Command Settings
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
                    <span>Sign Out & Lock Desk</span>
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
