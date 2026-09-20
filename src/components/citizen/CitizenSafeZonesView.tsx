import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  Compass,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { emergencyStore } from '../../services/emergencyStore';
import { DEMO_SAFE_ZONES } from '../../data/demoSafeZones';
import { SafeZone } from '../../types';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';
import { getSafeZoneImage } from '../../utils/imageResolvers';
import { SafeImage } from '../common/SafeImage';

interface CitizenSafeZonesViewProps {
  darkMode: boolean;
  onSelectRouteToZone?: (zoneId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CitizenSafeZonesView: React.FC<CitizenSafeZonesViewProps> = ({
  darkMode,
  onSelectRouteToZone,
  onNavigateTab,
}) => {
  const [currentLoc, setCurrentLoc] = useState(() => emergencyStore.getCurrentLocation());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRadius, setFilterRadius] = useState<number>(100);

  useEffect(() => {
    const unsub = emergencyStore.subscribe(() => {
      setCurrentLoc(emergencyStore.getCurrentLocation());
    });
    return () => unsub();
  }, []);

  const nearbyZones = currentLoc ? emergencyStore.getNearbySafeZones(filterRadius) : [];
  // If user has chosen a location, use nearby zones. If search query is present, filter by name/district
  const candidateZones: SafeZone[] = nearbyZones.length > 0 
    ? nearbyZones 
    : (currentLoc ? [] : DEMO_SAFE_ZONES);

  const displayZones = candidateZones.filter(z => 
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-full font-sans">
      {/* Background with realistic photography (Disaster Relief Shelter Encampment) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.safeZones} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Disaster Relief Shelter & Humanitarian Camp Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono mb-1.5 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFIED RELIEF SHELTERS</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {currentLoc ? `Safe Zones near ${currentLoc.name}` : 'Verified Safe Zones & Emergency Enclaves'}
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {currentLoc 
              ? `Showing verified relief shelters prioritized for your sector in ${currentLoc.district || currentLoc.name}, ${currentLoc.state}.`
              : 'All official shelters offer dry sleeping quarters, clean drinking water, hot food rations, and paramedic teams.'}
          </p>
        </div>

        {/* Location Indicator & Controls Bar */}
        <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80 text-slate-300' : 'bg-white/85 backdrop-blur-md border-slate-200/90 text-slate-700 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-xs font-bold flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <span>Active Anchor: {currentLoc ? currentLoc.name : 'All Regions'}</span>
                <span className="text-[10px] text-emerald-500 font-mono font-bold">({displayZones.length} shelters verified)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Sorted by distance from your current coordinate.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter shelter or town..."
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Radius filter */}
            <select
              value={filterRadius}
              onChange={(e) => setFilterRadius(Number(e.target.value))}
              className={`px-3 py-2 rounded-xl text-xs border font-medium cursor-pointer ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
              <option value={100}>Within 100 km</option>
              <option value={200}>Within 200 km</option>
            </select>

            <button
              onClick={() => onNavigateTab('citizen-map')}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 cursor-pointer"
            >
              <span>Change on Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Empty State when no safe zones match */}
        {displayZones.length === 0 && (
          <div className={`p-10 rounded-3xl border text-center space-y-4 shadow-lg ${
            darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                No verified data available in this radius
              </h3>
              <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No official emergency shelters have been registered within {filterRadius} km of your selected anchor point. Increase your search radius or contact emergency services directly.
              </p>
            </div>
            <button
              onClick={() => setFilterRadius(200)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Expand Search Radius to 200 km
            </button>
          </div>
        )}

        {/* Cards of Nearby Safe Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {displayZones.map((zone) => {
            const resolvedImg = getSafeZoneImage(zone);
            return (
              <div
                key={zone.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 flex flex-col justify-between shadow-md ${
                  darkMode 
                    ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80 hover:border-emerald-500/50' 
                    : 'bg-white/85 backdrop-blur-md border-slate-200/90 hover:border-emerald-300 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                      {/* Shelter Photographic Preview */}
                      <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-inner group bg-slate-950">
                        <SafeImage 
                          src={resolvedImg.url}
                          fallbackSrc={resolvedImg.fallbackUrl}
                          alt={`${zone.name} - ${resolvedImg.typeLabel}`}
                          category="shelter"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/30 pointer-events-none" />
                        
                        {/* AI Visual Representation Tag */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                          <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 font-bold text-[10px] border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI Visual Representation</span>
                          </span>
                        </div>

                        {/* Location & ID badges */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                            {zone.district}, {zone.state}
                          </span>
                          <span className="text-[10px] text-white font-mono bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10">
                            SHELTER ID: {zone.id}
                          </span>
                        </div>
                      </div>

                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        darkMode ? 'text-emerald-400' : 'text-emerald-700'
                      }`}>
                        {zone.type}
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      zone.status === 'SAFE'
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    }`}>
                      {zone.status === 'SAFE' ? 'Beds Open' : 'Near Capacity'}
                    </span>
                  </div>

                  {/* Name and Distance */}
                  <div>
                    <h3 className={`text-lg font-black leading-snug ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {zone.name}
                    </h3>
                    <div className={`text-xs mt-1 flex items-center gap-3 ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <b>{zone.distanceKm ?? 1.2} km</b> away
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        Approx. <b>{zone.travelTimeMin ?? 8} mins</b> transit
                      </span>
                    </div>
                  </div>

                  {/* Key Status Indicators */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className={`p-2.5 rounded-xl border ${
                      darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] text-slate-400">Available Space</div>
                      <div className="font-bold text-emerald-500 mt-0.5">
                        {zone.availableCapacity.toLocaleString()} Beds Open
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] text-slate-400">Road Accessibility</div>
                      <div className={`font-bold mt-0.5 ${
                        zone.accessibility === 'EXCELLENT' ? 'text-emerald-500' : 'text-blue-500'
                      }`}>
                        {zone.accessibility === 'EXCELLENT' ? 'Paved / Clear' : 'High Clearance OK'}
                      </div>
                    </div>
                  </div>

                  {/* Facilities List */}
                  <div className="space-y-1.5 pt-1">
                    <div className={`text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Verified On-Site Amenities:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.facilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border ${
                            darkMode 
                              ? 'bg-slate-950/80 border-slate-800 text-slate-300' 
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          ✓ {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button: GET DIRECTIONS */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      emergencyStore.setSelectedSafeZone(zone);
                      if (onSelectRouteToZone) onSelectRouteToZone(zone.id);
                      onNavigateTab('citizen-map');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-950 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>NAVIGATE TO SAFE ZONE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
