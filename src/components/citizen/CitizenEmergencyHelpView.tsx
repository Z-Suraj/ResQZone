import React, { useState } from 'react';
import { 
  PhoneCall, 
  LifeBuoy, 
  Navigation, 
  Camera, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  HelpCircle, 
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  MapPin,
  Flame,
  Radio,
  Sparkles
} from 'lucide-react';
import { emergencyStore } from '../../services/emergencyStore';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';

interface CitizenEmergencyHelpViewProps {
  darkMode: boolean;
  onNavigateTab: (tab: string) => void;
}

export const CitizenEmergencyHelpView: React.FC<CitizenEmergencyHelpViewProps> = ({
  darkMode,
  onNavigateTab,
}) => {
  const settings = emergencyStore.getCitizenSettings();
  const currentLoc = emergencyStore.getCurrentLocation();

  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checklistItems = [
    'Government ID cards, property papers & insurance in waterproof ziplock pouch',
    '7-day prescription medicines, emergency inhaler & sterile bandages',
    'High-capacity power bank (20,000mAh) and phone charging cords',
    'Heavy-duty LED flashlight / torch with spare batteries',
    '3 liters drinking water per person + high-calorie nutrient bars',
    'Thermal blanket / rain poncho and non-slip mountain shoes',
    'Emergency safety whistle for acoustic signaling if trapped',
    'Battery-powered emergency AM/FM radio or spare analog phone',
  ];

  const stateHelpline = currentLoc?.state ? `${currentLoc.state} Disaster Control` : 'State Emergency Operations';
  const districtHelpline = currentLoc?.district ? `${currentLoc.district} DEOC Control` : 'District Emergency Operations';

  return (
    <div className="relative min-h-full font-sans">
      {/* Background with realistic emergency photography (Disaster Evacuation & Paramedics) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.emergencyHelp} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Emergency Paramedics & Rapid Relief Helpline Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold font-mono mb-1.5 border border-rose-500/20">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>DIRECT EMERGENCY DISPATCH</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Emergency Assistance & Direct Lines
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Immediate telephone contact with rapid rescue squads, district operations centers, and live safety protocols.
          </p>
        </div>

        {/* 4 LARGE HIGH-CONTRAST ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Button 1: Call Emergency */}
          <a
            href={`tel:${settings.primaryEmergencyNumber}`}
            className="p-5 rounded-3xl bg-rose-600 hover:bg-rose-500 text-white flex flex-col justify-between space-y-3 transition-all shadow-xl shadow-rose-950/30 hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Instant Hotline</div>
              <div className="text-xl font-black mt-0.5">DIAL {settings.primaryEmergencyNumber}</div>
              <div className="text-xs opacity-90 mt-1">National Emergency Response</div>
            </div>
            <div className="text-xs font-bold flex items-center gap-1 pt-1 opacity-90">
              <span>Direct Hotline</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </a>

          {/* Button 2: Request Rescue */}
          <div
            onClick={() => onNavigateTab('rescue')}
            className="p-5 rounded-3xl bg-amber-600 hover:bg-amber-500 text-white flex flex-col justify-between space-y-3 transition-all shadow-xl shadow-amber-950/30 hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <LifeBuoy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Stranded / Danger</div>
              <div className="text-xl font-black mt-0.5">REQUEST RESCUE</div>
              <div className="text-xs opacity-90 mt-1">Deploy SDRF / NDRF evacuation team</div>
            </div>
            <div className="text-xs font-bold flex items-center gap-1 pt-1 opacity-90">
              <span>Open Rescue SOS</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Button 3: Find Safe Zone */}
          <div
            onClick={() => onNavigateTab('safe-zones')}
            className="p-5 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white flex flex-col justify-between space-y-3 transition-all shadow-xl shadow-emerald-950/30 hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Shelter & Food</div>
              <div className="text-xl font-black mt-0.5">FIND SAFE ZONE</div>
              <div className="text-xs opacity-90 mt-1">Locate verified beds, food & doctors</div>
            </div>
            <div className="text-xs font-bold flex items-center gap-1 pt-1 opacity-90">
              <span>View Shelters</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Button 4: Report Disaster */}
          <div
            onClick={() => onNavigateTab('report')}
            className="p-5 rounded-3xl bg-cyan-600 hover:bg-cyan-500 text-white flex flex-col justify-between space-y-3 transition-all shadow-xl shadow-cyan-950/30 hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Citizen Intel</div>
              <div className="text-xl font-black mt-0.5">REPORT DISASTER</div>
              <div className="text-xs opacity-90 mt-1">Submit GPS hazard or flood photo</div>
            </div>
            <div className="text-xs font-bold flex items-center gap-1 pt-1 opacity-90">
              <span>Submit Report</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* OFFICIAL EMERGENCY HOTLINE DIRECTORY */}
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 shadow-lg ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-500" />
              <h2 className={`text-base sm:text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Official National & State Disaster Helplines
              </h2>
            </div>
            {currentLoc && (
              <span className="text-[11px] text-slate-400 font-mono">
                Anchored: {currentLoc.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* 112 */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">National Emergency Number</div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>112</div>
                <div className="text-[11px] text-slate-400">Police / Fire / Ambulance Unified</div>
              </div>
              <a
                href="tel:112"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dial
              </a>
            </div>

            {/* 1078 NDRF */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">NDRF National HQ</div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>1078</div>
                <div className="text-[11px] text-slate-400">National Disaster Response Force</div>
              </div>
              <a
                href="tel:1078"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dial
              </a>
            </div>

            {/* 1070 SEOC */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">{stateHelpline}</div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>1070</div>
                <div className="text-[11px] text-slate-400">State Operations Center (24/7)</div>
              </div>
              <a
                href="tel:1070"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dial
              </a>
            </div>

            {/* 1077 DEOC */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">{districtHelpline}</div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>1077</div>
                <div className="text-[11px] text-slate-400">District Incident Commander</div>
              </div>
              <a
                href="tel:1077"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dial
              </a>
            </div>

            {/* 108 Ambulance */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">Toll-Free Ambulance</div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>108</div>
                <div className="text-[11px] text-slate-400">Emergency Medical Transit</div>
              </div>
              <a
                href="tel:108"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dial
              </a>
            </div>

            {/* SDRF Control Room */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-bold">State SDRF Special Ops</div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>0135-2710334</div>
                <div className="text-[11px] text-slate-400">Tactical Search & Water Rescue</div>
              </div>
              <a
                href="tel:01352710334"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Dial
              </a>
            </div>
          </div>
        </div>

        {/* QUICK SURVIVAL GUIDE & INTERACTIVE OFFLINE CHECKLIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Survival Guide */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Flood & Landslide Survival Rules
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-black text-rose-500 mb-0.5">1. Switch off main power breaker & gas cylinder</div>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  Prevent fatal electrocution and explosive fire hazards before water infiltrates the premises.
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-black text-rose-500 mb-0.5">2. Never drive or wade through flowing water</div>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  Just 15 cm (6 in) of rushing torrent can sweep off an adult; 30 cm can float SUVs.
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-black text-emerald-500 mb-0.5">3. Move perpendicular to slope during landslide sounds</div>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  If trees crack or ground rumbles, run laterally away from the downward mudflow corridor immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Go-Bag Checklist */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
            darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <h3 className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Evacuation Go-Bag Checklist
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">
                {Object.values(checkedItems).filter(Boolean).length}/{checklistItems.length} Packed
              </span>
            </div>

            <ul className="space-y-2 text-xs">
              {checklistItems.map((item, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <li
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? darkMode ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' : 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                        : darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-500'
                    }`}>
                      {isChecked ? '✓' : ''}
                    </div>
                    <span className={`flex-1 ${isChecked ? 'line-through opacity-75' : 'font-medium'}`}>
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
