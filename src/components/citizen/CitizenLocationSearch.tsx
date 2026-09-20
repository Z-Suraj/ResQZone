import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Crosshair, 
  Loader2, 
  AlertCircle, 
  Check, 
  X,
  Compass,
  ChevronDown
} from 'lucide-react';
import { geocodingService, GeocodingResult } from '../../services/geocodingService';
import { emergencyStore } from '../../services/emergencyStore';
import { CitizenLocation } from '../../types';

interface CitizenLocationSearchProps {
  onLocationSelected: (location: CitizenLocation) => void;
  onLocationCleared?: () => void;
  className?: string;
  darkMode?: boolean;
}

export const CitizenLocationSearch: React.FC<CitizenLocationSearchProps> = ({
  onLocationSelected,
  onLocationCleared,
  className = '',
  darkMode = true,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualFallbackOpen, setManualFallbackOpen] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualPlaceName, setManualPlaceName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  const [currentLocation, setCurrentLocation] = useState(() => emergencyStore.getCurrentLocation());

  useEffect(() => {
    return emergencyStore.subscribe(() => {
      setCurrentLocation(emergencyStore.getCurrentLocation());
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await geocodingService.searchLocations(query);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  // Handle suggestion selection
  const handleSelect = (item: GeocodingResult) => {
    const newLoc: CitizenLocation = {
      id: item.id,
      name: item.name,
      district: item.district,
      state: item.state,
      coordinates: item.coordinates,
      riskLevel: item.riskLevel,
      hazardNotice: item.hazardNotice,
      zoom: item.zoom,
    };

    setQuery('');
    setIsOpen(false);
    setLocationError(null);
    emergencyStore.setCurrentLocation(newLoc);
    onLocationSelected(newLoc);
  };

  // "Use My Location" via browser GPS
  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const geoResult = await geocodingService.getCurrentPosition();
      const newLoc: CitizenLocation = {
        id: geoResult.id,
        name: geoResult.name,
        district: geoResult.district,
        state: geoResult.state,
        coordinates: geoResult.coordinates,
        riskLevel: geoResult.riskLevel,
        hazardNotice: geoResult.hazardNotice,
        zoom: 14,
      };

      emergencyStore.setCurrentLocation(newLoc);
      onLocationSelected(newLoc);
      setIsOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Location permission denied or unavailable';
      setLocationError(msg);
      // Auto open manual fallback option
      setManualFallbackOpen(true);
    } finally {
      setIsLocating(false);
    }
  };

  // Submit manual coordinates fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocationError('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    const name = manualPlaceName.trim() || `Position (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    const newLoc: CitizenLocation = {
      id: `MANUAL-${Date.now()}`,
      name,
      district: 'Custom Coordinates',
      state: 'Local Region',
      coordinates: [lat, lng],
      riskLevel: 'HIGH',
      hazardNotice: `Custom coordinate monitoring active for ${name}.`,
      zoom: 14,
    };

    emergencyStore.setCurrentLocation(newLoc);
    onLocationSelected(newLoc);
    setManualFallbackOpen(false);
    setLocationError(null);
    setIsOpen(false);
  };

  const handleClearLocation = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    emergencyStore.clearLocation();
    onLocationCleared?.();
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">HIGH</span>;
      case 'MODERATE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">MODERATE</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">SAFE</span>;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Location Input Group */}
      <div className={`flex items-center gap-1.5 backdrop-blur-md border rounded-xl p-1 shadow-lg transition-colors ${
        darkMode ? 'bg-slate-950/90 border-slate-700/80' : 'bg-white/95 border-slate-300 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 flex-1 px-2.5 py-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim().length > 0 || suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={
              currentLocation 
                ? `Search city, district, village... (${currentLocation.name})` 
                : 'Search city, district, village in India...'
            }
            className={`bg-transparent text-xs placeholder:text-slate-400 focus:outline-none w-full font-medium ${
              darkMode ? 'text-white' : 'text-[#0F172A]'
            }`}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              title="Clear input"
              className={`p-0.5 cursor-pointer ${
                darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {currentLocation && !query && (
            <button
              onClick={handleClearLocation}
              title={`Clear current location (${currentLocation.name})`}
              className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border cursor-pointer transition-colors shrink-0 ${
                darkMode 
                  ? 'text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 border-slate-700' 
                  : 'text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <X className="w-3 h-3" />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}
          {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />}
        </div>

        {/* Use My Location GPS Button */}
        <button
          onClick={handleUseMyLocation}
          disabled={isLocating}
          title="Use My Live Location (GPS)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 border ${
            darkMode 
              ? 'bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border-blue-500/40' 
              : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border-blue-300'
          }`}
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-blue-500 group-hover:text-white" />
          )}
          <span className="hidden sm:inline">Use My Location</span>
        </button>
      </div>

      {/* Permission Denied / Error Notification with Manual Fallback Toggle */}
      {locationError && (
        <div className="absolute top-full left-0 right-0 mt-2 z-500 p-2.5 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-200 text-xs shadow-2xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Location notice: {locationError}</span>
            </div>
            <button onClick={() => setLocationError(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300">
            {currentLocation ? (
              <>Previous location <b>{currentLocation.name}</b> preserved. You can search by town name or enter coordinates manually below.</>
            ) : (
              <>No location active. You can search by town name or enter coordinates manually below.</>
            )}
          </p>
          {!manualFallbackOpen && (
            <button
              onClick={() => setManualFallbackOpen(true)}
              className="text-left text-[11px] font-bold text-blue-400 hover:underline cursor-pointer pt-1"
            >
              &rarr; Enter location or coordinates manually
            </button>
          )}
        </div>
      )}

      {/* Manual Coordinates Fallback Modal / Drawer */}
      {manualFallbackOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 z-500 p-3.5 rounded-2xl border shadow-2xl text-left space-y-3 ${
          darkMode ? 'bg-slate-950/98 border-blue-500/50' : 'bg-white border-blue-300 shadow-xl'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${
            darkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <Compass className="w-4 h-4 text-blue-500" />
              Manual Location Entry Fallback
            </span>
            <button
              onClick={() => setManualFallbackOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Settlement / Village Name
              </label>
              <input
                type="text"
                value={manualPlaceName}
                onChange={(e) => setManualPlaceName(e.target.value)}
                placeholder="e.g. Mana Village, Helang, Pandukeshwar"
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Latitude (° N)
                </label>
                <input
                  type="text"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g. 30.5564"
                  required
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Longitude (° E)
                </label>
                <input
                  type="text"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="e.g. 79.5658"
                  required
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setManualFallbackOpen(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Set Location &amp; Update Map
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-2 z-500 backdrop-blur-md border rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y text-left ${
          darkMode 
            ? 'bg-slate-950/98 border-slate-700/80 divide-slate-800/60' 
            : 'bg-white border-slate-300 divide-slate-100 shadow-xl'
        }`}>
          <div className={`p-2 text-[10px] font-bold tracking-wider uppercase ${
            darkMode ? 'text-slate-400 bg-slate-900/60' : 'text-slate-500 bg-slate-50'
          }`}>
            Suggested Settlements &amp; Districts
          </div>
          {suggestions.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`p-3 transition-colors cursor-pointer flex items-center justify-between gap-3 group ${
                darkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className={`text-xs font-black truncate ${
                    darkMode ? 'text-white group-hover:text-cyan-300' : 'text-[#0F172A] group-hover:text-blue-600'
                  }`}>
                    {item.name}
                  </div>
                  <div className={`text-[11px] truncate ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {item.district}, {item.state}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {getRiskBadge(item.riskLevel)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
