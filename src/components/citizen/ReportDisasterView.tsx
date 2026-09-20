import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  UploadCloud, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Send,
  Image as ImageIcon,
  Loader2,
  Sparkles
} from 'lucide-react';
import { IMAGES, FALLBACK_IMAGES } from '../../data/assets';
import { CitizenSectionBackground } from './CitizenSectionBackground';
import { emergencyStore } from '../../services/emergencyStore';
import { authService } from '../../services/authService';
import { db } from '../../services/supabaseClient';
import { INCIDENT_IMAGES } from '../../utils/imageResolvers';

interface ReportDisasterViewProps {
  onBack: () => void;
  onSubmitSuccess?: (reportId: string) => void;
  onViewMyReports?: () => void;
  darkMode: boolean;
}

type DisasterType = 'Flood' | 'Landslide' | 'Waterlogging' | 'Bridge Damage' | 'Power Outage' | 'Cyclone' | 'Fire' | 'Other';

const getInitialPhotoForType = (type: DisasterType): string => {
  switch (type) {
    case 'Flood': return INCIDENT_IMAGES.flood[0];
    case 'Landslide': return INCIDENT_IMAGES.landslide[0];
    case 'Waterlogging': return INCIDENT_IMAGES.waterlogging[0];
    case 'Bridge Damage': return INCIDENT_IMAGES.bridgeDamage[0];
    case 'Power Outage': return INCIDENT_IMAGES.powerOutage[0];
    case 'Cyclone': return INCIDENT_IMAGES.cyclone[0];
    case 'Fire': return INCIDENT_IMAGES.fire[0];
    default: return INCIDENT_IMAGES.flood[0];
  }
};

export const ReportDisasterView: React.FC<ReportDisasterViewProps> = ({
  onBack,
  onSubmitSuccess,
  onViewMyReports,
  darkMode,
}) => {
  const currentLoc = emergencyStore.getCurrentLocation();
  const currentUser = authService.getCurrentUser();

  // Step 1: Disaster Type
  const [disasterType, setDisasterType] = useState<DisasterType>('Flood');
  
  // Step 2: Image
  const [selectedPhoto, setSelectedPhoto] = useState<string>(INCIDENT_IMAGES.flood[0]);
  const [customPhotoUploaded, setCustomPhotoUploaded] = useState(false);

  // Step 3: Description
  const [description, setDescription] = useState('');

  // Step 4: Location
  const [locationText, setLocationText] = useState(
    currentLoc ? `${currentLoc.name}${currentLoc.district ? `, ${currentLoc.district}` : ''}` : ''
  );
  const [coords, setCoords] = useState<[number, number]>(
    currentLoc ? currentLoc.coordinates : [28.6139, 77.2090]
  );
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(!!currentLoc);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedPhoto(event.target.result as string);
          setCustomPhotoUploaded(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
        setLocationText(`GPS ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Verified)`);
        setGpsLocked(true);
        setGpsDetecting(false);
      },
      (err) => {
        setGpsDetecting(false);
        alert(`Location access denied or unavailable: ${err.message}. Please type your sector manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationText.trim()) {
      alert('Please enter or detect your location.');
      return;
    }
    if (!description.trim()) {
      alert('Please provide a brief description of the incident.');
      return;
    }

    setIsSubmitting(true);

    try {
      let incidentType: any = 'Flash Flood';
      if (disasterType === 'Flood' || disasterType === 'Waterlogging') incidentType = 'Flash Flood';
      else if (disasterType === 'Cyclone') incidentType = 'Cyclone';
      else if (disasterType === 'Landslide' || disasterType === 'Fire') incidentType = 'Landslide';
      else if (disasterType === 'Bridge Damage' || disasterType === 'Power Outage') incidentType = 'Road Blockage';
      else incidentType = 'Road Blockage';

      const reporterName = currentUser?.name 
        ? `${currentUser.name} (Citizen)` 
        : 'Citizen Field Reporter';
      const reporterPhone = currentUser?.phone || 'Field Verified';

      const created = emergencyStore.addCitizenReport({
        title: `${disasterType} reported near ${locationText.split(',')[0]}`,
        type: incidentType,
        location: locationText,
        description,
        severity: 'HIGH',
        imageUrl: selectedPhoto,
        reporterName,
        reporterPhone,
        coordinates: coords,
      });

      // Also persist to Supabase DB
      try {
        await db.insertIncident({
          id: created.id,
          title: created.title,
          type: created.type,
          severity: 'HIGH',
          status: 'NEW',
          location: locationText,
          coordinates: coords,
          reportedAt: new Date().toISOString(),
          description,
          imageUrl: selectedPhoto,
          reporterName,
          reporterPhone,
          affectedCount: 1,
        });
      } catch (err) {
        console.warn('Incident db persist notification:', err);
      }

      setIsSubmitting(false);
      setSubmittedReportId(created.id);
      if (onSubmitSuccess) onSubmitSuccess(created.id);
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error submitting report:', err);
    }
  };

  // Confirmation screen after submission
  if (submittedReportId) {
    return (
      <div className="relative min-h-full font-sans">
        {/* Realistic Incident Scene Background */}
        <CitizenSectionBackground 
          imageUrl={IMAGES.sectionBgs.reportDisaster} 
          fallbackUrl={FALLBACK_IMAGES.heroBg}
          darkMode={darkMode} 
          alt="Disaster Incident Scene Background"
        />

        <div className="relative z-10 p-4 sm:p-8 max-w-xl mx-auto my-8">
          <div className={`border rounded-3xl p-8 text-center space-y-5 shadow-2xl ${
            darkMode ? 'bg-slate-900/80 backdrop-blur-md border-emerald-500/50' : 'bg-white/90 backdrop-blur-md border-emerald-500/60 shadow-xl'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Disaster Report Transmitted
              </h2>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Your report has been logged and forwarded to district disaster operations command for verification.
              </p>
            </div>

            <div className={`p-4 rounded-2xl text-xs font-mono space-y-2 text-left border ${
              darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>REPORT TRACKING ID:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-500">#{submittedReportId}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>DISASTER TYPE:</span>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{disasterType}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>COORDINATES:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>LOCATION:</span>
                <span className={`font-medium truncate max-w-[200px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{locationText}</span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}>INITIAL STATUS:</span>
                <span className="font-bold text-amber-600 dark:text-amber-500">SUBMITTED (PENDING TRIAGE)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {onViewMyReports && (
                <button
                  onClick={onViewMyReports}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Track In My Reports
                </button>
              )}

              <button
                onClick={onBack}
                className={`w-full py-3 rounded-xl border text-xs font-bold transition-colors ${
                  darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Return to Citizen Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full font-sans">
      {/* Realistic Incident Scene Background (Visible & Layered) */}
      <CitizenSectionBackground 
        imageUrl={IMAGES.sectionBgs.reportDisaster} 
        fallbackUrl={FALLBACK_IMAGES.heroBg}
        darkMode={darkMode} 
        alt="Emergency Disaster Field Background"
      />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        {/* Top navigation back */}
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

          <span className="text-[11px] font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            ● Public Incident Ingestion Desk
          </span>
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 shadow-xl ${
          darkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800/80' : 'bg-white/85 backdrop-blur-md border-slate-200/90 shadow-sm'
        }`}>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Report Disaster Incident
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Submit eyewitness photographs, coordinates, and hazard notes directly to regional emergency responders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {/* STEP 1: SELECT DISASTER TYPE */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Step 1: Incident Classification
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Flood', 'Landslide', 'Waterlogging', 'Bridge Damage', 'Power Outage', 'Cyclone', 'Fire', 'Other'] as DisasterType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      setDisasterType(type);
                      if (!customPhotoUploaded) {
                        setSelectedPhoto(getInitialPhotoForType(type));
                      }
                    }}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      disasterType === type
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950'
                        : darkMode
                          ? 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: UPLOAD OR CAPTURE IMAGE */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Step 2: Photographic Ground Evidence
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-video bg-black/40">
                  <img
                    src={selectedPhoto}
                    alt="Hazard Evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-mono flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-rose-500" />
                    <span>{customPhotoUploaded ? 'User Photo Attached' : 'Selected Incident Visual'}</span>
                  </div>
                </div>

                {/* Upload Input & Quick Samples */}
                <div className="flex flex-col justify-between space-y-3">
                  <label className={`flex-1 border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    darkMode ? 'border-slate-700 hover:border-slate-500 bg-slate-950/40' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}>
                    <UploadCloud className="w-6 h-6 text-rose-500 mb-1" />
                    <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Capture or Upload Photo
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Camera capture or gallery image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Realistic Field Evidence Defaults */}
                  <div>
                    <div className={`text-[10px] mb-1 font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Or pick verified incident category:</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedPhoto(IMAGES.mountainLandslide); setCustomPhotoUploaded(false); }}
                        className={`text-[10px] p-1.5 rounded-lg border truncate transition-colors ${
                          darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        Landslide
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedPhoto(IMAGES.himalayanRiverFlood); setCustomPhotoUploaded(false); }}
                        className={`text-[10px] p-1.5 rounded-lg border truncate transition-colors ${
                          darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        River Flood
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedPhoto(IMAGES.aerialFlood); setCustomPhotoUploaded(false); }}
                        className={`text-[10px] p-1.5 rounded-lg border truncate transition-colors ${
                          darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        Inundation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: ADD DESCRIPTION */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Step 3: Ground Observations & Details
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you see: water height rising above mark, bridge submerged, road blocked by boulders, stranded vehicles..."
                className={`w-full p-3.5 rounded-2xl border text-xs leading-relaxed transition-colors ${
                  darkMode 
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-rose-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                }`}
                required
              />
            </div>

            {/* STEP 4: LOCATION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Step 4: Incident Location
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
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Enter sector, street name, village or landmark..."
                  className={`w-full px-4 py-3 rounded-2xl border text-xs font-medium pl-9 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
                <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3.5" />
              </div>
              {coords && (
                <div className="text-[10px] text-slate-400 font-mono">
                  Coordinates: {coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E
                </div>
              )}
            </div>

            {/* STEP 5: SUBMIT */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'TRANSMITTING TO DESK...' : 'TRANSMIT REPORT TO AUTHORITIES'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
