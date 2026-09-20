import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  MapPin, 
  Users, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Send,
  UploadCloud,
  ChevronRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  Sparkles
} from 'lucide-react';
import { emergencyStore, CitizenRescueRequest } from '../../services/emergencyStore';
import { authService } from '../../services/authService';
import { db } from '../../services/supabaseClient';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';
import { vehicleImages } from '../../data/vehicleImages';

interface CitizenRescueRequestViewProps {
  darkMode: boolean;
  onBack: () => void;
}

export const CitizenRescueRequestView: React.FC<CitizenRescueRequestViewProps> = ({
  darkMode,
  onBack,
}) => {
  const settings = emergencyStore.getCitizenSettings();
  const currentUser = authService.getCurrentUser();
  const currentLoc = emergencyStore.getCurrentLocation();

  // Form Fields
  const [locationName, setLocationName] = useState(
    currentLoc ? `${currentLoc.name}${currentLoc.district ? `, ${currentLoc.district}` : ''}` : ''
  );
  const [coords, setCoords] = useState<[number, number]>(
    currentLoc ? currentLoc.coordinates : [28.6139, 77.2090]
  );
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [elderlyOrSpecialCare, setElderlyOrSpecialCare] = useState(0);
  const [urgency, setUrgency] = useState<'CRITICAL_IMMEDIATE' | 'HIGH_TRAPPED' | 'PRECAUTIONARY'>('HIGH_TRAPPED');
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [requesterName, setRequesterName] = useState(currentUser?.name || 'Citizen Requester');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('RESCUE_VEHICLE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<CitizenRescueRequest | null>(null);

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords([lat, lng]);
        setLocationName(`GPS ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Live Anchored)`);
        setGpsDetecting(false);
      },
      (err) => {
        setGpsDetecting(false);
        alert(`Location permission error: ${err.message}. Please type your sector name manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) {
      alert('Please enter or detect your rescue pickup location.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = emergencyStore.createRescueRequest({
        requesterName,
        contactPhone,
        locationName,
        coordinates: coords,
        peopleCount: {
          adults,
          children,
          elderlyOrSpecialCare,
        },
        urgency,
        message: message.trim() || 'Stranded citizen requesting emergency evacuation support.',
      });

      // Persist to Supabase Database
      try {
        await db.insertRescueRequest({
          id: created.id,
          requesterName,
          contactPhone,
          locationName,
          coordinates: coords,
          peopleCount: { adults, children, elderlyOrSpecialCare },
          urgency,
          message: message.trim() || 'Stranded citizen requesting emergency evacuation support.',
          status: 'DISPATCHED',
          assignedTeam: created.assignedTeam,
          estimatedArrivalMinutes: created.estimatedArrivalMinutes,
          createdAt: created.submittedAt,
        });
      } catch (err) {
        console.warn('Could not persist rescue request to remote db:', err);
      }

      // Trigger haptic vibration if enabled
      emergencyStore.triggerVibration([300, 150, 300]);

      setIsSubmitting(false);
      setSubmittedRequest(created);
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error submitting rescue request:', err);
    }
  };

  // Screen after submission
  if (submittedRequest) {
    const nearbySafeZones = emergencyStore.getNearbySafeZones(50);
    const destinationShelter = nearbySafeZones.length > 0 ? nearbySafeZones[0].name : 'District Relief Sanctuary';

    return (
      <div className="relative min-h-full font-sans">
        {/* Realistic First Responders & Disaster Rescue Background */}
        <CitizenSectionBackground 
          imageUrl={IMAGES.sectionBgs.requestRescue} 
          fallbackUrl={FALLBACK_IMAGES.heroBg}
          darkMode={darkMode} 
          alt="First Responders Flood Rescue Background"
        />

        <div className="relative z-10 p-4 sm:p-8 max-w-xl mx-auto my-8">
          <div className={`border rounded-3xl p-8 text-center space-y-5 shadow-2xl ${
            darkMode ? 'bg-slate-900/85 backdrop-blur-md border-amber-500/60' : 'bg-white/90 backdrop-blur-md border-amber-500/60 shadow-xl'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
              <LifeBuoy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                RESCUE REQUEST #{submittedRequest.id}
              </h2>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>STATUS: RESPONSE DISPATCHED</span>
              </div>
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Your emergency distress signal has been verified by the State Disaster Operations Command. An all-terrain rescue squad has been deployed to your coordinates.
            </p>

            <div className={`p-5 rounded-2xl text-xs space-y-3 text-left border ${
              darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>ASSIGNED UNIT:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{submittedRequest.assignedTeam}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>ESTIMATED ARRIVAL:</span>
                <span className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{submittedRequest.estimatedArrivalMinutes} Minutes</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>TRANSIT DESTINATION:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">{destinationShelter}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>PERSONS TO EVACUATE:</span>
                <span className="font-bold">
                  {adults + children + elderlyOrSpecialCare} Total ({adults} Adults, {children} Kids, {elderlyOrSpecialCare} Special Care)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>YOUR CONTACT:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{contactPhone || 'Registered Citizen Phone'}</span>
              </div>
            </div>

            {/* Immediate Safety Instructions while waiting */}
            <div className={`p-4 rounded-2xl text-xs text-left border ${
              darkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>While waiting for the rescue squad:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Stay on the highest elevated point of the structure (roof or high balcony).</li>
                <li>Keep phone battery conserved; signal rescuers with a flashlight or bright cloth.</li>
                <li>Never attempt to wade or drive across surging floodwaters.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`tel:${settings.primaryEmergencyNumber}`}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <PhoneCall className="w-4 h-4" />
                <span>CALL {settings.primaryEmergencyNumber} DIRECT HOTLINE</span>
              </a>

              <button
                onClick={onBack}
                className={`w-full py-3 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                  darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full font-sans">
      {/* Realistic First Responders & Disaster Rescue Background */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.requestRescue} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Emergency Flood Rescue Operations Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
              darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-mono text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 font-bold animate-pulse">
            ● EMERGENCY RESCUE DISPATCH
          </span>
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 shadow-xl ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
        }`}>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Request Emergency Rescue (SOS)
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              If you are stranded, cut off by floodwaters or landslide, or have medical casualties, dispatch an urgent SOS to SDRF / NDRF rapid teams.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {/* Location */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Stranded Location / Landmark
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={gpsDetecting}
                  className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {gpsDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  <span>{gpsDetecting ? 'Detecting GPS...' : 'Use Browser GPS'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter house #, street, landmark, or village name..."
                  className={`w-full px-4 py-3 rounded-2xl border text-xs font-medium pl-9 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
                <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3.5" />
              </div>
              {coords && (
                <div className="text-[10px] text-slate-400 font-mono">
                  Anchored Coordinates: {coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E
                </div>
              )}
            </div>

            {/* Rescue Vehicle Units in Area */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Rescue Transport Category Needed
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { type: 'RESCUE_VEHICLE', label: 'Heavy Rescue Van', img: vehicleImages.rescue_vehicle, desc: 'Winches & rough terrain' },
                  { type: 'BOAT', label: 'Flood Rescue Boat', img: vehicleImages.boat, desc: 'Submerged zones' },
                  { type: 'AMBULANCE', label: 'Emergency Ambulance', img: vehicleImages.ambulance, desc: 'Medical casualties' },
                  { type: 'BUS', label: 'Evacuation Bus', img: vehicleImages.bus, desc: 'Large groups' },
                ].map((veh) => (
                  <button
                    key={veh.type}
                    type="button"
                    onClick={() => setSelectedVehicleType(veh.type)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden ${
                      selectedVehicleType === veh.type
                        ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500'
                        : darkMode ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-16 rounded-xl overflow-hidden bg-black/40 mb-2">
                      <img src={veh.img} alt={veh.label} className="w-full h-full object-cover" />
                    </div>
                    <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {veh.label}
                    </div>
                    <div className={`text-[10px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{veh.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of People */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Number of People Stranded
              </label>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Adults</div>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className={`w-7 h-7 rounded-lg font-bold cursor-pointer transition-colors ${
                        darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      -
                    </button>
                    <span className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {adults}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdults(adults + 1)}
                      className={`w-7 h-7 rounded-lg font-bold cursor-pointer transition-colors ${
                        darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Children (0-12)</div>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className={`w-7 h-7 rounded-lg font-bold cursor-pointer transition-colors ${
                        darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      -
                    </button>
                    <span className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {children}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChildren(children + 1)}
                      className={`w-7 h-7 rounded-lg font-bold cursor-pointer transition-colors ${
                        darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Elderly / Medical</div>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setElderlyOrSpecialCare(Math.max(0, elderlyOrSpecialCare - 1))}
                      className={`w-7 h-7 rounded-lg font-bold cursor-pointer transition-colors ${
                        darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      -
                    </button>
                    <span className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {elderlyOrSpecialCare}
                    </span>
                    <button
                      type="button"
                      onClick={() => setElderlyOrSpecialCare(elderlyOrSpecialCare + 1)}
                      className={`w-7 h-7 rounded-lg font-bold cursor-pointer transition-colors ${
                        darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Rescue Urgency Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUrgency('CRITICAL_IMMEDIATE')}
                  className={`p-3 rounded-2xl border font-bold text-left transition-all cursor-pointer ${
                    urgency === 'CRITICAL_IMMEDIATE'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950'
                      : darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-black">CRITICAL (SOS)</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Surging water / structural hazard</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('HIGH_TRAPPED')}
                  className={`p-3 rounded-2xl border font-bold text-left transition-all cursor-pointer ${
                    urgency === 'HIGH_TRAPPED'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950'
                      : darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-black">TRAPPED</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Route cut off / high ground safe</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('PRECAUTIONARY')}
                  className={`p-3 rounded-2xl border font-bold text-left transition-all cursor-pointer ${
                    urgency === 'PRECAUTIONARY'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950'
                      : darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-black">PRECAUTIONARY</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Assisted transit requested</div>
                </button>
              </div>
            </div>

            {/* Contact Details & Optional Message */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Requester Name
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g., +91 9876543210"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-mono ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Ground Notes / Medical Needs
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., elderly person requires stretcher, infant needs clean water, roof is accessible..."
                className={`w-full p-3 rounded-2xl border text-xs leading-relaxed ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-60"
              >
                <LifeBuoy className="w-5 h-5" />
                <span>{isSubmitting ? 'TRANSMITTING SOS SIGNAL...' : 'DISPATCH EMERGENCY RESCUE SOS'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
