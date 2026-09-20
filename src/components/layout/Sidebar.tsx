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
import { IMAGES } from '../../data/assets';
import { DEMO_ALERTS } from '../../data/demoAlerts';
import { authService, generateInitialsAvatar } from '../../services/authService';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  currentRole: UserRole;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  darkMode,
  currentRole,
  onOpenSettings,
}) => {
  const activeAlertsCount = DEMO_ALERTS.filter(a => a.active).length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Hazard Map', icon: MapIcon },
    { id: 'habitations', label: 'Habitations', icon: Home },
    { id: 'capacity', label: 'Carrying Capacity', icon: Scale },
    { id: 'relocation', label: 'Relocation Engine', icon: Navigation, badge: 'SHOWCASE', badgeColor: 'bg-rose-500 text-white' },
    { id: 'alerts', label: 'Alerts', icon: Bell, count: activeAlertsCount },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, pulse: true },
    { id: 'whatif', label: 'Simulation Sandbox', icon: SlidersHorizontal },
    ...(currentRole === 'AUTHORITY' 
      ? [{ id: 'citizen-view', label: 'Citizen View', icon: UserCheck }] 
      : [{ id: 'authority-view', label: 'Authority Desk', icon: Shield }]),
  ];

  return (
    <aside
      className={`h-[calc(100vh-4rem)] border-r transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-30 sticky top-16 ${
        collapsed ? 'w-18' : 'w-64'
      } ${
        darkMode 
          ? 'bg-[#0d1424] border-slate-800 text-slate-300' 
          : 'bg-[#f1f5f9] border-slate-200 text-slate-700'
      }`}
    >
      {/* Top Nav List */}
      <div className="p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all relative group ${
                isActive
                  ? darkMode
                    ? 'bg-rose-500/20 text-white font-bold border border-rose-500/40 shadow-sm shadow-rose-950'
                    : 'bg-white text-rose-600 font-bold border border-rose-200 shadow-sm'
                  : darkMode
                  ? 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                isActive ? 'text-rose-500 scale-110' : 'text-slate-400 group-hover:text-slate-200'
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

      {/* Bottom section with photographic inspiration card, settings, and collapse button */}
      <div className="p-3 border-t border-slate-700/40 space-y-3">
        {/* Editorial visual card (matches reference image bottom-left photo) */}
        {!collapsed && (
          <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-lg group">
            <img 
              src={IMAGES.rescueBoat} 
              alt="Disaster Preparedness" 
              className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-2.5 flex flex-col justify-end">
              <span className="text-[11px] font-extrabold text-white leading-tight">
                Together for a Safer Tomorrow
              </span>
              <span className="text-[9px] text-slate-300 line-clamp-1 mt-0.5">
                Disaster preparedness saves lives.
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title={collapsed ? 'System Settings' : undefined}
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="flex items-center gap-3">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!collapsed && <span>Collapse Sidebar</span>}
            </div>
          </button>
        </div>

        {/* User Mini Profile */}
        {!collapsed && (() => {
          const user = authService.getCurrentUser();
          const name = user?.name || (currentRole === 'AUTHORITY' ? 'Authority Officer' : 'Citizen Resident');
          const title = currentRole === 'AUTHORITY' 
            ? (user?.department || 'District Operations') 
            : 'Citizen Resident';
          const avatar = user?.avatar || generateInitialsAvatar(name, currentRole);

          return (
            <div className="pt-2 border-t border-slate-700/40 flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-500/50 relative shrink-0">
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute bottom-0 right-0 border border-slate-900" />
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-xs font-bold truncate text-slate-200">
                  {name}
                </div>
                <div className="text-[10px] text-rose-400 font-medium truncate uppercase tracking-wider">
                  {title}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};
