import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Home,
  Scale,
  Navigation,
  Bell,
  AlertOctagon,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  UserCheck,
  Shield,
  LifeBuoy
} from 'lucide-react';
import { UserRole } from '../../types';
import { emergencyStore } from '../../services/emergencyStore';
import { ResQZoneLogo } from '../common/ResQZoneLogo';

interface AuthoritySidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onSwitchToCitizen: () => void;
}

export const AuthoritySidebar: React.FC<AuthoritySidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  darkMode,
  onSwitchToCitizen,
}) => {
  const activeAlertsCount = emergencyStore.getAlerts().filter(a => a.active).length;
  const pendingIncidentsCount = emergencyStore.getIncidents().filter(i => i.status !== 'RESOLVED').length;
  const rescueCount = emergencyStore.getRescueRequests().filter(r => r.status !== 'RESCUED').length;

  const authorityNavItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'map', label: 'Hazard Map', icon: MapIcon },
    { id: 'habitations', label: 'Habitations', icon: Home },
    { id: 'capacity', label: 'Carrying Capacity', icon: Scale },
    { id: 'relocation', label: 'Relocation Engine', icon: Navigation, badge: 'ACTIVE', badgeColor: 'bg-rose-500 text-white' },
    { id: 'incidents', label: 'Incidents Desk', icon: AlertOctagon, count: pendingIncidentsCount + rescueCount },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: activeAlertsCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, pulse: true },
    { id: 'whatif', label: 'Simulation Sandbox', icon: SlidersHorizontal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-[calc(100vh-4rem)] border-r transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-30 sticky top-16 ${
        collapsed ? 'w-18' : 'w-64'
      } ${
        darkMode 
          ? 'bg-[#060b13] border-slate-800/80 text-slate-300' 
          : 'bg-white border-[#E2E8F0] text-[#334155]'
      }`}
    >
      {/* Primary Navigation items */}
      <div className="p-2.5 space-y-1 overflow-y-auto">
        {collapsed && (
          <div className="flex justify-center pb-2 mb-2 border-b border-slate-700/40">
            <ResQZoneLogo variant="symbol" size="sm" theme={darkMode ? 'dark' : 'light'} />
          </div>
        )}
        {authorityNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'dashboard' && currentTab === 'overview');
          const isDangerTab = item.id === 'alerts';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-all relative group cursor-pointer ${
                isActive
                  ? darkMode
                    ? isDangerTab
                      ? 'bg-rose-600/20 text-rose-200 font-bold border-l-2 border-rose-500 rounded-r-lg'
                      : 'bg-cyan-500/15 text-cyan-200 font-bold border-l-2 border-cyan-500 rounded-r-lg'
                    : isDangerTab
                    ? 'bg-rose-50 text-rose-700 font-bold border-l-2 border-rose-600 rounded-r-lg'
                    : 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600 rounded-r-lg'
                  : darkMode
                  ? 'rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white'
                  : 'rounded-lg hover:bg-slate-100 text-[#475569] hover:text-[#0F172A]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                isActive 
                  ? isDangerTab
                    ? 'text-rose-400 scale-110'
                    : 'text-cyan-400 scale-110'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`} />

              {!collapsed && (
                <span className="truncate flex-1 text-left tracking-wide">
                  {item.label}
                </span>
              )}

              {/* Badges or Counts */}
              {!collapsed && item.badge && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {!collapsed && item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-600 text-white animate-pulse">
                  {item.count}
                </span>
              )}

              {item.pulse && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute right-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Switcher & Collapse Toggle */}
      <div className={`p-3 border-t space-y-2 ${darkMode ? 'border-slate-800/40' : 'border-[#E2E8F0]'}`}>
        {/* Switch to Citizen Mode Button */}
        {!collapsed && (
          <button
            onClick={onSwitchToCitizen}
            className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              darkMode 
                ? 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-emerald-400 hover:border-emerald-500/40' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Preview Citizen Portal</span>
            </div>
            <span className="text-[10px] text-slate-400">→</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-colors cursor-pointer ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <ResQZoneLogo variant="symbol" size="xs" theme={darkMode ? 'dark' : 'light'} />
              <span>SEOC Command</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
