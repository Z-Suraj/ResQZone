import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  Radio, 
  Save, 
  CheckCircle2, 
  Info, 
  Server,
  Bell,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { IMAGES } from '../../data/assets';
import { AuthoritySectionBackground } from '../common/AuthoritySectionBackground';

interface SettingsViewProps {
  darkMode: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode }) => {
  const [defaultBasemap, setDefaultBasemap] = useState('satellite');
  const [gpsInterval, setGpsInterval] = useState('5');
  const [autoSmsDispatch, setAutoSmsDispatch] = useState(true);
  const [satelliteOverlay, setSatelliteOverlay] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <AuthoritySectionBackground
        imageUrl={IMAGES.authoritySectionBgs.settings}
        darkMode={darkMode}
        alt="System Settings Background"
      />

      <div className="relative z-10 p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-2 font-mono ${
            darkMode ? 'bg-slate-500/20 border-slate-500/30 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}>
            <Settings className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`} />
            <span>COMMAND CONSOLE &bull; SYSTEM CONFIGURATION</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            System Configuration &amp; GIS Settings
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Manage geospatial projection standards, census demographic baselines, and emergency gateway connections.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Prototype Data & Census 2011 Notice */}
          <div className={`p-5 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-amber-50/80 border-amber-200/90 backdrop-blur-md'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
              <Info className="w-4 h-4 shrink-0" />
              <span>Census 2011 Demographic Baseline &amp; Disaster GIS Notice</span>
            </div>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              All population distributions, vulnerable cohorts, and household figures are indexed against the official 
              Census of India 2011 dataset calibrated for Chamoli and Rudraprayag districts, Uttarakhand. Hazard polygons 
              are mapped using multi-hazard hydrological and slope stability models.
            </p>
          </div>

          {/* GIS Projection & Defaults */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
              <MapPin className="w-4 h-4" />
              <span>Geospatial Projections &amp; Basemap Defaults</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Default Map Tile Engine
                </label>
                <select
                  value={defaultBasemap}
                  onChange={(e) => setDefaultBasemap(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="satellite">Esri World Imagery (Satellite High-Res)</option>
                  <option value="standard">OpenStreetMap Standard Cartography</option>
                  <option value="terrain">OpenTopoMap High-Relief Terrain</option>
                  <option value="natural">Carto Voyager Natural Earth</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Spatial Reference System
                </label>
                <input
                  type="text"
                  disabled
                  value="EPSG:4326 - WGS 84 (Global Lat/Long)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs ${
                    darkMode 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-400' 
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Convoy GPS Telemetry Ping (Seconds)
                </label>
                <select
                  value={gpsInterval}
                  onChange={(e) => setGpsInterval(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="1">1 Second (High Precision Convoy)</option>
                  <option value="5">5 Seconds (Standard Operations)</option>
                  <option value="15">15 Seconds (Battery Conservation)</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Emergency Gateway Telemetry
                </label>
                <div className="flex items-center gap-2 mt-2.5 text-emerald-400 font-mono text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CAP 1.2 Protocol Online (SEOC Gateway)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Communication Gateways */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900/85 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-sm'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
              <Radio className="w-4 h-4" />
              <span>Public Notification Dispatch Rules</span>
            </div>

            <div className="space-y-3 text-xs">
              <label className={`flex items-center justify-between cursor-pointer p-3.5 rounded-xl border ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Auto-trigger Wireless Emergency Alerts (WEA)
                  </div>
                  <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Broadcast cell broadcasts to all active cellular towers within a 15km hazard radius.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSmsDispatch}
                  onChange={(e) => setAutoSmsDispatch(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>

              <label className={`flex items-center justify-between cursor-pointer p-3.5 rounded-xl border ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Enable Satellite Optical Imagery Layers
                  </div>
                  <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Overlay real-time Sentinel-2 multispectral flood extents when cloud cover is &lt; 30%.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={satelliteOverlay}
                  onChange={(e) => setSatelliteOverlay(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-rose-950 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save System Preferences</span>
            </button>

            {saved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings successfully persisted!</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
