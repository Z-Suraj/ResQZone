import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Crosshair, 
  Loader2, 
  Check, 
  Compass, 
  Sliders,
  ChevronDown
} from 'lucide-react';
import { geocodingService, GeocodingResult } from '../../services/geocodingService';
import { emergencyStore } from '../../services/emergencyStore';
import { CitizenLocation } from '../../types';

interface AuthorityLocationSearchProps {
  darkMode?: boolean;
  className?: string;
  compact?: boolean;
  onLocationSelected?: (location: CitizenLocation) => void;
}

export const AuthorityLocationSearch: React.FC<AuthorityLocationSearchProps> = ({
  darkMode = true,
  className = '',
  compact = false,
  onLocationSelected,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CitizenLocation | null>(
    emergencyStore.getCurrentLocation()
  );
  const [currentRadius, setCurrentRadius] = useState<number>(emergencyStore.getLocationRadius());
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = emergencyStore.subscribe(() => {
      setCurrentLocation(emergencyStore.getCurrentLocation());
      setCurrentRadius(emergencyStore.getLocationRadius());
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowRadiusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const hits = await geocodingService.searchLocations(query);
        setResults(hits);
      } catch (err) {
        console.error('Failed to geocode location:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: GeocodingResult) => {
    const newLocation: CitizenLocation = {
      id: result.id,
      name: result.name,
      district: result.district,
      state: result.state,
      coordinates: result.coordinates,
      riskLevel: result.riskLevel,
      hazardNotice: result.hazardNotice,
      zoom: result.zoom,
    };

    emergencyStore.setCurrentLocation(newLocation);
    setCurrentLocation(newLocation);
    setIsOpen(false);
    setQuery('');

    if (onLocationSelected) {
      onLocationSelected(newLocation);
    }
  };

  const handleSelectRadius = (km: number) => {
    emergencyStore.setLocationRadius(km);
    setCurrentRadius(km);
    setShowRadiusMenu(false);
  };

  const radiusOptions = [15, 25, 50, 100];

  return (
    <div ref={containerRef} className={`relative z-50 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Search input container */}
        <div className={`relative flex items-center transition-all duration-200 rounded-xl border ${
          darkMode 
            ? 'bg-slate-900/90 border-slate-700/80 focus-within:border-cyan-500 shadow-inner' 
            : 'bg-white border-slate-300 focus-within:border-cyan-600 shadow-xs'
        } ${compact ? 'w-56 md:w-72' : 'w-full md:w-96'}`}>
          <div className="pl-3 pr-2 text-slate-400">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Search className="w-4 h-4 text-cyan-500" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder={
              currentLocation 
                ? `${currentLocation.name}, ${currentLocation.state} (Search new place...)`
                : 'Search city, district, state, or pincode...'
            }
            className={`w-full py-1.5 pr-3 text-xs outline-none bg-transparent ${
              darkMode ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />

          {currentLocation && !query && (
            <div className="pr-2 shrink-0 hidden sm:flex items-center gap-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {currentLocation.coordinates[0].toFixed(2)}°, {currentLocation.coordinates[1].toFixed(2)}°
              </span>
            </div>
          )}
        </div>

        {/* Spatial Radius Filter */}
        <div className="relative">
          <button
            onClick={() => setShowRadiusMenu(!showRadiusMenu)}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:bg-slate-800' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Analysis radius around selected location"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] font-semibold">{currentRadius} km</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRadiusMenu && (
            <div className={`absolute right-0 mt-1 w-36 rounded-xl border shadow-xl py-1 z-60 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/40">
                Radius Filter
              </div>
              {radiusOptions.map((km) => (
                <button
                  key={km}
                  onClick={() => handleSelectRadius(km)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                    currentRadius === km
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                      : darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>{km} km buffer</span>
                  {currentRadius === km && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className={`absolute left-0 mt-1.5 w-full md:w-[480px] rounded-xl border shadow-2xl overflow-hidden z-60 backdrop-blur-xl ${
          darkMode 
            ? 'bg-slate-900/98 border-slate-700/90 text-slate-100' 
            : 'bg-white/98 border-slate-300 text-slate-900'
        }`}>
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-cyan-400" /> Location Geocoding &amp; Spatial Resolver
            </span>
            <span className="font-mono text-[10px]">
              {results.length > 0 ? `${results.length} results` : 'Search any Indian place'}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
            {results.length === 0 && !isLoading && query.trim().length >= 2 && (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching locations found for "{query}". Try a city, district, or pin code (e.g. Haldia, Kolkata, 721604, Mumbai, Delhi).
              </div>
            )}

            {results.map((loc) => {
              const isSelected = currentLocation && (
                currentLocation.id === loc.id || 
                (Math.abs(currentLocation.coordinates[0] - loc.coordinates[0]) < 0.005 &&
                 Math.abs(currentLocation.coordinates[1] - loc.coordinates[1]) < 0.005)
              );

              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? darkMode ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'bg-cyan-50 border-l-2 border-cyan-500'
                      : darkMode ? 'hover:bg-slate-800/70' : 'hover:bg-slate-100/80'
                  }`}
                >
                  <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                    loc.riskLevel === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : loc.riskLevel === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-bold text-xs truncate">
                        {loc.name}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                        loc.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : loc.riskLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {loc.riskLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {loc.subTitle || `${loc.district}, ${loc.state}, ${loc.country}`}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-cyan-400" />
                        {loc.coordinates[0].toFixed(4)}°N, {loc.coordinates[1].toFixed(4)}°E
                      </span>
                      <span className="truncate text-slate-400">
                        {loc.district} • {loc.state}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 text-cyan-400 mt-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick preset selector for key Indian operations */}
          <div className="p-2 border-t border-slate-700/40 bg-slate-950/40 flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-slate-400 font-semibold uppercase text-[9px] mr-1">Quick Sectors:</span>
            {['Haldia', 'Kolkata', 'Mumbai', 'Delhi', 'Chamoli', 'Siliguri'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={async () => {
                  const hits = await geocodingService.searchLocations(preset);
                  if (hits.length > 0) handleSelect(hits[0]);
                }}
                className={`px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                  currentLocation?.name.toLowerCase().includes(preset.toLowerCase())
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : darkMode
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
