import React from 'react';
import { 
  Home, 
  Map as MapIcon, 
  Compass, 
  ShieldCheck, 
  Camera, 
  FileText, 
  LifeBuoy, 
  Bell, 
  PhoneCall, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { IMAGES } from '../../data/assets';
import { emergencyStore } from '../../services/emergencyStore';
import { ResQZoneLogo } from '../common/ResQZoneLogo';

interface CitizenSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onOpenAiAssistant: () => void;
}

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  darkMode,
  onOpenAiAssistant,
}) => {
  const activeAlerts = emergencyStore.getAlerts().filter(a => a.active).length;
  const myReportsCount = emergencyStore.getCitizenReports().length;

  // Order strictly matching image.png
  const citizenNavItems = [
    { id: 'citizen-home', label: 'Home', icon: Home },
    { id: 'citizen-map', label: 'Map & Safety', icon: Compass },
    { id: 'citizen-my-area', label: 'My Area', icon: MapIcon },
    { id: 'report', label: 'Report Disaster', icon: Camera },
    { id: 'rescue', label: 'Request Rescue', icon: LifeBuoy },
    { id: 'safe-zones', label: 'Safe Zones', icon: ShieldCheck },
    { id: 'citizen-alerts', label: 'Alerts', icon: Bell, count: activeAlerts > 0 ? activeAlerts : 3 },
    { id: 'my-reports', label: 'My Reports', icon: FileText, count: myReportsCount },
    { id: 'emergency-help', label: 'Emergency Help', icon: PhoneCall },
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
      {/* Navigation List */}
      <div className="p-2.5 space-y-1 overflow-y-auto">
        {collapsed && (
          <div className="flex justify-center pb-2 mb-2 border-b border-slate-700/40">
            <ResQZoneLogo variant="symbol" size="sm" theme={darkMode ? 'dark' : 'light'} />
          </div>
        )}
        {citizenNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isDangerTab = item.id === 'citizen-alerts' || item.id === 'rescue';

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
                    ? 'text-rose-500'
                    : darkMode ? 'text-cyan-400' : 'text-blue-600'
                  : darkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-400 group-hover:text-slate-600'
              }`} />

              {!collapsed && (
                <span className="truncate flex-1 text-left tracking-wide">
                  {item.label}
                </span>
              )}

              {/* Counts / badges */}
              {!collapsed && item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  item.id === 'citizen-alerts' 
                    ? 'bg-rose-600 text-white' 
                    : darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Area: Settings & Editorial Visual Card (matches image.png) */}
      <div className={`p-3 border-t space-y-2.5 ${darkMode ? 'border-slate-800/60' : 'border-[#E2E8F0]'}`}>
        <button
          onClick={() => onSelectTab('citizen-settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            currentTab === 'citizen-settings'
              ? darkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200'
              : darkMode ? 'hover:bg-slate-850 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400" />
          {!collapsed && <span>Settings</span>}
        </button>

        {!collapsed && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg group">
            <img 
              src={IMAGES.mountainLandslide} 
              alt="Together for a Safer Tomorrow" 
              className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 flex flex-col justify-end">
              <span className="text-[11px] font-extrabold text-white leading-tight">
                Together for a Safer Tomorrow
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-200 font-mono">
                <ResQZoneLogo variant="symbol" size="xs" />
                <span className="font-bold">RES<span className="text-rose-500">Q</span>ZONE</span>
                <span className="text-slate-400">• Safer Future</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
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
            <div className="text-[10px] font-mono text-slate-400">
              ResQZone v2.6 • Public
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
