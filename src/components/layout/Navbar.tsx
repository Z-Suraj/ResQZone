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
  CloudRain,
  SlidersHorizontal,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { UserRole } from '../../types';
import { DEMO_ALERTS } from '../../data/demoAlerts';
import { authService, AuthUser } from '../../services/authService';

interface NavbarProps {
  currentRole: UserRole;
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

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
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
  const activeUser = currentUser || authService.getCurrentUser();
  const userName = activeUser?.name || (currentRole === 'AUTHORITY' ? 'Authority Official' : 'Citizen Resident');
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || (currentRole === 'AUTHORITY' ? 'AO' : 'CR');
  const userIdentifier = activeUser?.badgeNumber || activeUser?.id || (currentRole === 'AUTHORITY' ? 'AUTH-OPS-USER' : 'CITIZEN-USER');
  const userDepartment = activeUser?.department || (currentRole === 'AUTHORITY' ? 'SEOC Operations' : 'Citizen Safety');

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Live real-time clock updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: 02:37:14 AM
      const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      // Format: 18 SEP 2026 (or current date)
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
    { id: 'uttarakhand', name: 'Uttarakhand', sub: 'Chamoli District' },
    { id: 'assam', name: 'Assam', sub: 'Majuli Riverine Basin' },
    { id: 'kerala', name: 'Kerala', sub: 'Wayanad Mountain Belt' },
    { id: 'odisha', name: 'Odisha', sub: 'Puri Coastal Corridor' },
  ];

  const activeAlertsCount = DEMO_ALERTS.filter(a => a.active).length;

  return (
    <header className={`h-16 px-4 md:px-6 border-b z-40 transition-colors flex items-center justify-between sticky top-0 ${
      darkMode 
        ? 'bg-[#0b101b]/95 border-slate-800/80 text-slate-100 backdrop-blur-md' 
        : 'bg-[#f8fafc]/95 border-slate-200/90 text-slate-800 backdrop-blur-md shadow-xs'
    }`}>
      {/* Brand logo & tag */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (onReturnToLanding) {
              onReturnToLanding();
            } else {
              onNavigateTab(currentRole === 'CITIZEN' ? 'citizen' : 'dashboard');
            }
          }}
          className="flex items-center gap-2.5 text-left group focus:outline-hidden"
          title="Return to Landing / Dashboard"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30 group-hover:bg-rose-500 transition-colors">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base font-mono">RESQZONE</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30">
                GIS INTELLIGENCE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Intelligent Hazard Red Zone & Relocation System
            </p>
          </div>
        </button>

        {/* Region selector dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              darkMode 
                ? 'bg-slate-900/60 border-slate-700/80 hover:bg-slate-800 text-slate-200' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <div className="text-left">
              <div className="font-semibold leading-tight">{selectedRegion}</div>
              <div className="text-[10px] text-slate-400">Chamoli District</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
          </button>

          {showRegionDropdown && (
            <div className={`absolute left-0 mt-1 w-56 rounded-xl border p-1.5 shadow-xl z-50 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Active Operational Grid
              </div>
              {regions.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelectRegion(r.name);
                    setShowRegionDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    selectedRegion === r.name 
                      ? 'bg-rose-500/15 text-rose-500 font-semibold' 
                      : darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div>{r.name}</div>
                    <div className="text-[10px] text-slate-400">{r.sub}</div>
                  </div>
                  {selectedRegion === r.name && <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Local weather indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <span>18°C</span>
          <span className="text-[11px] text-slate-400">Light Rain</span>
        </div>
      </div>

      {/* Middle/Right: Status, Live Clock, Notifications, Theme, Role */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System online indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">System Online</span>
          <span className="text-[10px] text-slate-400">Telemetry Active</span>
        </div>

        {/* Real-time Clock (Requirement: updates every second, formatted as 02:37:14 AM 18 SEP 2026) */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono ${
          darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <div className="text-right">
            <div className="text-xs font-bold tracking-tight text-rose-500 font-mono">
              {timeStr || '14:23:16'}
            </div>
            <div className="text-[10px] text-slate-400 leading-none">
              {dateStr || '18 SEP 2026'}
            </div>
          </div>
        </div>

        {/* What-If Simulation quick launch */}
        <button
          onClick={onOpenWhatIf}
          title="What-If Disaster Simulation Sandbox"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>What-If Sandbox</span>
        </button>

        {/* Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className={`p-2 rounded-lg border relative transition-colors ${
              darkMode 
                ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
            }`}
            title="Emergency Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border p-3 shadow-2xl z-50 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 mb-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-500">
                  <AlertTriangle className="w-4 h-4" />
                  Active Emergency Bulletins ({activeAlertsCount})
                </div>
                <button 
                  onClick={() => {
                    setShowAlertsDropdown(false);
                    onNavigateTab('alerts');
                  }}
                  className="text-[11px] text-rose-500 hover:underline font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {DEMO_ALERTS.map(alert => (
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

        {/* Dark / Light Mode Switch */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-amber-400' 
              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border transition-colors ${
              darkMode 
                ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-200' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-xs'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
              {userInitials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-tight">
                {userName}
              </div>
              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                {currentRole}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileDropdown && (
            <div className={`absolute right-0 mt-2 w-64 rounded-xl border p-2 shadow-2xl z-50 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-3 py-2 border-b border-slate-700/50 mb-1.5">
                <div className="text-xs font-bold">
                  {userName} {currentRole === 'AUTHORITY' ? `(${userDepartment})` : ''}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {currentRole === 'AUTHORITY' ? `auth.id: ${userIdentifier}` : `citizen.id: ${userIdentifier}`}
                </div>
              </div>

              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Persona
              </div>

              <button
                onClick={() => {
                  onRoleChange('AUTHORITY');
                  setShowProfileDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between mb-1 ${
                  currentRole === 'AUTHORITY' 
                    ? 'bg-rose-500/15 text-rose-500 font-bold' 
                    : darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <span>Authority Command</span>
                </div>
                {currentRole === 'AUTHORITY' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />}
              </button>

              <button
                onClick={() => {
                  onRoleChange('CITIZEN');
                  setShowProfileDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                  currentRole === 'CITIZEN' 
                    ? 'bg-emerald-500/15 text-emerald-500 font-bold' 
                    : darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Citizen Portal</span>
                </div>
                {currentRole === 'CITIZEN' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </button>

              <div className="border-t border-slate-700/50 my-1.5 pt-1.5 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onOpenSettings();
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  System Preferences
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/15 font-semibold flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out / Lock Session</span>
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
