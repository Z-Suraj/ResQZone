import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  Bus, 
  PhoneCall, 
  Droplets, 
  ShieldCheck, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  LifeBuoy,
  Radio,
  Sparkles,
  Info,
  Compass
} from 'lucide-react';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { emergencyStore } from '../../services/emergencyStore';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';

interface CitizenMyAreaViewProps {
  darkMode: boolean;
  onNavigateTab: (tab: string) => void;
}

export const CitizenMyAreaView: React.FC<CitizenMyAreaViewProps> = ({
  darkMode,
  onNavigateTab,
}) => {
  const [currentLoc, setCurrentLoc] = useState(() => emergencyStore.getCurrentLocation());

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setCurrentLoc(emergencyStore.getCurrentLocation());
    });
  }, []);

  const nearbyZones = currentLoc ? emergencyStore.getNearbySafeZones(60) : [];
  const nearestShelter = nearbyZones.length > 0 ? nearbyZones[0] : null;
  const nearbyHazards = currentLoc ? emergencyStore.getNearbyHazards(50) : [];
  const alerts = emergencyStore.getAlerts();
  const localAlerts = currentLoc 
    ? alerts.filter(a => a.active && (
        a.title.toLowerCase().includes(currentLoc.name.toLowerCase()) || 
        (currentLoc.district && a.title.toLowerCase().includes(currentLoc.district.toLowerCase())) ||
        (currentLoc.state && a.title.toLowerCase().includes(currentLoc.state.toLowerCase()))
      ))
    : [];

  return (
    <div className="relative min-h-full font-sans">
      {/* Premium Realistic Section Background (Settlement & Regional Valley) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.myArea} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Regional Mountain Valley Settlement Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {!currentLoc ? (
          <div className="text-center py-10">
            <div className={`p-8 sm:p-12 rounded-3xl border space-y-5 ${
              darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 shadow-inner">
                <Compass className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold font-mono">
                  <span>LOCATION NOT SET</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Select Your Sector or City
                </h2>
              </div>
              <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Choose your sector, district, or village using the interactive GIS map or browser GPS to view verified local alerts, evacuation corridors, and designated relief shelters.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab('citizen-map')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Open GIS Map & Search</span>
                </button>
                <button
                  onClick={() => {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          emergencyStore.setCurrentLocation({
                            id: `LOC-GPS`,
                            name: 'My GPS Location',
                            district: 'Current District',
                            state: 'Local State',
                            coordinates: [pos.coords.latitude, pos.coords.longitude],
                            riskLevel: 'SAFE',
                            hazardNotice: 'Live GPS coordinate anchored.',
                            zoom: 14,
                          });
                        },
                        () => alert('Please allow location permission in browser or search location on map.')
                      );
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>Use Device GPS</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <div className={`p-6 sm:p-8 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold font-mono">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>ACTIVE SECTOR MONITORING</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Coordinates: {currentLoc.coordinates[0].toFixed(3)}°N, {currentLoc.coordinates[1].toFixed(3)}°E
                    </span>
                  </div>

                  <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    My Local Area: {currentLoc.name}
                  </h1>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    District: <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>{currentLoc.district || currentLoc.name}</span>, State: <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>{currentLoc.state || 'India'}</span> • Real-time evacuation advisories and shelter capacity.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateTab('citizen-map')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>View Map</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('rescue')}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    <span>Request SOS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Sector Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Card 1: Evacuation Status */}
              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                currentLoc.riskLevel === 'CRITICAL'
                  ? darkMode ? 'bg-rose-950/30 border-rose-500/50' : 'bg-rose-50 border-rose-300'
                  : currentLoc.riskLevel === 'HIGH'
                  ? darkMode ? 'bg-amber-950/30 border-amber-500/50' : 'bg-amber-50 border-amber-300'
                  : darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Evacuation Advisory</span>
                </div>
                <div className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentLoc.riskLevel === 'CRITICAL' ? 'MANDATORY EVACUATION' : `${currentLoc.riskLevel} RISK LEVEL`}
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {currentLoc.hazardNotice || (
                    currentLoc.riskLevel === 'CRITICAL' 
                      ? 'Immediate relocation to high-ground relief centers advised by district disaster management.'
                      : 'No active mandatory evacuation for this sector. Maintain situational awareness and check alerts.'
                  )}
                </p>
              </div>

              {/* Card 2: Hydrology / Drainage Gauge */}
              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-blue-50/60 border-blue-200'
              }`}>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-4 h-4" />
                  <span>Hydrology & Inundation Status</span>
                </div>
                <div className="text-lg font-black text-blue-500">
                  {currentLoc.riskLevel === 'CRITICAL' ? 'ELEVATED FLOOD SURGE' : 'STABLE SENSOR READINGS'}
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Catchment and drainage telemetry monitored for {currentLoc.name}. {nearbyHazards.length > 0 ? `${nearbyHazards.length} hazard zone(s) identified within 50 km.` : 'No critical flood breaches detected.'}
                </p>
              </div>

              {/* Card 3: Designated Shelter */}
              <div className={`p-5 rounded-3xl border space-y-2.5 ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-emerald-50/60 border-emerald-200'
              }`}>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Assigned Safe Shelter</span>
                </div>
                {nearestShelter ? (
                  <>
                    <div className="text-lg font-black text-emerald-500 truncate">
                      {nearestShelter.name}
                    </div>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {nearestShelter.distanceKm ?? 1.2} km away • {nearestShelter.availableCapacity} beds open, medical post & emergency meal kitchen active.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-amber-500">
                      No Verified Shelters in 50 km
                    </div>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      No accredited shelters within your immediate 50 km zone. Dial 112 / 1070 for municipal muster point guidance.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Evacuation Convoy Muster Point */}
            <div className={`p-6 rounded-3xl border space-y-4 text-left ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-emerald-500" />
                  <h2 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Emergency Evacuation Convoy & Muster Point
                  </h2>
                </div>
                <button
                  onClick={() => onNavigateTab('citizen-map')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Map Route</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Designated transit shuttles assemble at civic rally points for safe passenger evacuation to certified disaster relief sanctuaries.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Next Evacuation Bus</div>
                  <div className="text-sm font-black mt-1 text-emerald-600 dark:text-emerald-500">15 Minutes (Convoy Unit #04)</div>
                  <div className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Capacity: 45 Passengers • Priority for Elders & Kids</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Assembly Staging Point</div>
                  <div className={`text-sm font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {currentLoc.name} Civic Grounds
                  </div>
                  <div className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Marked with High-Visibility Emergency Banners</div>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Destination Relief Center</div>
                  <div className="text-sm font-black mt-1 text-emerald-600 dark:text-emerald-500 truncate">
                    {nearestShelter ? nearestShelter.name : 'State Disaster Relief Camp'}
                  </div>
                  <div className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SDRF Escorted Safe Corridor</div>
                </div>
              </div>
            </div>

            {/* Local Liaison Personnel & Immediate Contacts */}
            <div className={`p-6 rounded-3xl border space-y-4 text-left ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-500" />
                <h2 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sector Emergency Duty Desk & Rapid Response
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Duty Disaster Officer ({currentLoc.name} Sector)
                    </div>
                    <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>On duty at civic assembly post</div>
                  </div>
                  <a
                    href="tel:112"
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Call Duty Desk
                  </a>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      State Emergency Operations Center
                    </div>
                    <div className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>National & Regional 24/7 Dispatch Control</div>
                  </div>
                  <a
                    href="tel:112"
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Call 112 Hotline
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
