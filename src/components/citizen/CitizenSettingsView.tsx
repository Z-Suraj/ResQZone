import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Vibrate, 
  PhoneCall, 
  MapPin, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Database, 
  RefreshCw,
  CheckCircle2,
  Lock,
  User,
  HeartPulse,
  Mail
} from 'lucide-react';
import { emergencyStore } from '../../services/emergencyStore';
import { authService, AuthUser } from '../../services/authService';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';

interface CitizenSettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: AuthUser | null;
  onUpdateUser?: (updated: AuthUser) => void;
}

export const CitizenSettingsView: React.FC<CitizenSettingsViewProps> = ({
  darkMode,
  onToggleDarkMode,
  currentUser,
  onUpdateUser,
}) => {
  const current = emergencyStore.getCitizenSettings();
  const currentLoc = emergencyStore.getCurrentLocation();
  const sessionUser = currentUser || authService.getCurrentUser();

  const [name, setName] = useState(sessionUser?.name || 'Citizen User');
  const [email] = useState(sessionUser?.email || 'citizen@resqzone.org');
  const [phone, setPhone] = useState(sessionUser?.phone || '+91 98765 43210');
  const [medicalNotes, setMedicalNotes] = useState('No chronic illness. First Aid trained.');
  const [bloodGroup, setBloodGroup] = useState('O+');

  const [emergencyVibration, setEmergencyVibration] = useState(current.emergencyVibration);
  const [primaryEmergencyNumber, setPrimaryEmergencyNumber] = useState(current.primaryEmergencyNumber);
  const [homeSector, setHomeSector] = useState((currentLoc && currentLoc.name) || current.homeSector || 'Local Sector');
  const [savedNotice, setSavedNotice] = useState(false);
  const [vibrationNotice, setVibrationNotice] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Update citizen settings in store
    emergencyStore.updateCitizenSettings({
      emergencyVibration,
      primaryEmergencyNumber,
      homeSector,
    });

    // 2. Update authenticated user profile in authService
    const updated = await authService.updateProfile({
      name: name.trim() || 'Citizen User',
      phone: phone.trim(),
    });

    if (updated && onUpdateUser) {
      onUpdateUser(updated);
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTestVibrate = () => {
    emergencyStore.triggerVibration([250, 100, 250]);
    setVibrationNotice(true);
    setTimeout(() => setVibrationNotice(false), 2000);
  };

  return (
    <div className="relative min-h-full font-sans">
      {/* Background with realistic security / network photography */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.settings} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Citizen App Settings and Infrastructure Security Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-bold font-mono mb-1.5 border border-slate-500/20">
            <Settings className="w-3.5 h-3.5" />
            <span>PERSONAL IDENTITY & PREFERENCES</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Citizen Profile & App Settings
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage your verified name, emergency contact speed dial, medical notes for first responders, and local jurisdiction.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 0: Personal Identity (User requested editable name, never hardcoded) */}
          <div className={`p-6 rounded-3xl border space-y-4 shadow-sm ${
            darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
          }`}>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Citizen Identity & Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Full Name (Displayed across App)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs pl-9 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Enter your full name"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address (Registered)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs pl-9 opacity-70 cursor-not-allowed ${
                    darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs pl-9 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. +91 98765 43210"
                />
                <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Blood Group (Emergency Triage)
              </label>
              <div className="relative">
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs pl-9 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="A+">A+ Positive</option>
                  <option value="A-">A- Negative</option>
                  <option value="B+">B+ Positive</option>
                  <option value="B-">B- Negative</option>
                  <option value="AB+">AB+ Positive</option>
                  <option value="AB-">AB- Negative</option>
                  <option value="O+">O+ Positive</option>
                  <option value="O-">O- Negative</option>
                </select>
                <HeartPulse className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 1: Alert & Emergency Preferences */}
        <div className={`p-6 rounded-3xl border space-y-5 shadow-sm ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
        }`}>
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Alert & Haptic Feedback
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Vibrate className="w-4 h-4 text-emerald-500" />
                <span>Emergency Vibration</span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Vibrate on incoming high-priority flood or landslide warnings. No loud audio alarm will ever play.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEmergencyVibration(!emergencyVibration)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  emergencyVibration ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  emergencyVibration ? 'left-7' : 'left-1'
                }`} />
              </button>

              {emergencyVibration && (
                <button
                  type="button"
                  onClick={handleTestVibrate}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 cursor-pointer"
                >
                  {vibrationNotice ? 'Vibrated!' : 'Test'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Primary One-Touch Emergency Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={primaryEmergencyNumber}
                onChange={(e) => setPrimaryEmergencyNumber(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono pl-9 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
              <PhoneCall className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-slate-400">
              Default is 112 (National Unified Helpline). You may change this to your local ward liaison if instructed.
            </p>
          </div>
        </div>

        {/* Card 2: Sector Location */}
        <div className={`p-6 rounded-3xl border space-y-4 shadow-sm ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
        }`}>
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Home Ward & Sector
          </h2>

          <div className="space-y-1.5">
            <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Jurisdiction Sector
            </label>
            <div className="relative">
              <input
                type="text"
                value={homeSector}
                onChange={(e) => setHomeSector(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs pl-9 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
              <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-slate-400">
              Used to calculate proximity to active flood zones and filter relevant municipal orders.
            </p>
          </div>
        </div>

        {/* Card 3: Appearance & Storage */}
        <div className={`p-6 rounded-3xl border space-y-4 shadow-sm ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
        }`}>
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Display Theme & Storage
          </h2>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>High-Contrast Mode</span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Switch between Night Vision Dark and High-Sunlight Light theme.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <div className="space-y-0.5">
              <div className={`font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Database className="w-4 h-4 text-slate-400" />
                <span>Offline Cache Status</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {currentLoc ? `${currentLoc.name} Regional Sector Map cached (14 MB)` : 'Sector Map cached (14 MB)'}
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              READY OFFLINE
            </span>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>SAVE PROFILE & PREFERENCES</span>
          </button>
        </div>

        {savedNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-bold text-center border border-emerald-500/30">
            ✓ Preferences and personal profile saved successfully.
          </div>
        )}
      </form>
      </div>
    </div>
  );
};
