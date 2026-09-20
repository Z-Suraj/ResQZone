/**
 * ResQZone Imagery System
 * High-quality authentic photographic assets for disaster management,
 * GIS satellite maps, flood evacuations, relief centers, and transport fleet.
 */

import { vehicleImages } from './vehicleImages';

export const IMAGES = {
  // Main Hero background: dramatic Himalayan river flood and rescue operation panorama
  heroFloodRescue: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=2000&q=85',
  himalayanRiverFlood: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=2000&q=85',
  
  // Aerial flood settlements and inundation
  aerialFlood: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1600&q=80',
  floodAlertThumb: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80',
  
  // Himalayan mountain landslide / Chamoli Uttarakhand terrain
  mountainLandslide: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
  landslideAlertThumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  mountainHelplineBg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  himalayaRange: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
  
  // NDRF rescue team in raft boat during riverine flash flood
  rescueBoat: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  rescueOperation: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=80',
  citizenEvac: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
  
  // Satellite and aerial terrain intelligence
  satelliteTerrain: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
  aerialVillage: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80',
  
  // Safe shelter, community hall & relief camp
  reliefShelter: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  safeZoneThumb: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80',
  schoolCamp: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  riverFlood: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1600&q=80',
  sportsStadium: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  schoolCampus: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  mountainClinic: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=80',
  
  // Multimodal Transport Fleet (Centralized 1:1 Vehicle Matching)
  emergencyBus: vehicleImages.bus,
  evacuationTrain: vehicleImages.train,
  rescueVehicle: vehicleImages.rescue_vehicle,
  emergencyCar: vehicleImages.car,
  floodBoat: vehicleImages.boat,
  airRescue: vehicleImages.helicopter,
  ambulance: vehicleImages.ambulance,

  // Emergency operations command center
  commandCenter: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
  
  // Citizen community evacuation
  communitySafe: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
  citizenReporting: 'https://images.unsplash.com/photo-1512756290469-ec961bc80406?auto=format&fit=crop&w=1200&q=80',
  
  // Realistic section photography backgrounds (Distinct authentic imagery for each section)
  sectionBgs: {
    home: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=2000&q=85', // Atmospheric mountain river valley landscape & preparedness
    mapSafety: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=85', // Satellite & GIS topographical terrain
    myArea: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85', // Mountain settlement & regional valley
    reportDisaster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85', // Flooded river & incident scene
    requestRescue: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=2000&q=85', // First responders & disaster rescue operation
    safeZones: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=85', // Disaster relief shelter & humanitarian camp
    alerts: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=85', // Emergency command operations & monitoring room
    myReports: 'https://images.unsplash.com/photo-1512756290469-ec961bc80406?auto=format&fit=crop&w=2000&q=85', // Field emergency documentation & reporting
    emergencyHelp: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=2000&q=85', // Paramedic & first response medical rescue
    settings: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85', // Satellite digital infrastructure & emergency telemetry
  },

  // Realistic Authority Operations Photography backgrounds
  authoritySectionBgs: {
    commandCenter: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=85', // State EOC operations command room
    hazardMap: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=85', // Satellite topographical terrain & GIS
    habitations: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=2000&q=85', // Mountain valley rural habitations
    carryingCapacity: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=85', // Humanitarian shelter camp
    relocation: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=2000&q=85', // Evacuation transport convoy
    incidents: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=2000&q=85', // Tactical first response scene
    alerts: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85', // River inundation & warning dispatch
    analytics: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85', // Geospatial telemetry & data monitors
    copilot: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2000&q=85', // Computational planning terminal
    settings: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=85', // Satellite communications gateway
  },

  // Incident specific photos
  floodedBridge: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
  rockslideRoad: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=1000&q=80',
  medicalCamp: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1000&q=80',
};

// Official ResQZone Brand Logos
export const BRAND_ASSETS = {
  logoFull: '/assets/logo/resqzone-logo.svg',
  logoHorizontal: '/assets/logo/resqzone-logo-horizontal.svg',
  logoHorizontalLight: '/assets/logo/resqzone-logo-horizontal-light.svg',
  logoSymbol: '/assets/logo/resqzone-symbol.svg',
  favicon: '/favicon.svg',
};

// Guaranteed local SVG fallbacks organized in public/assets/
export const FALLBACK_IMAGES = {
  logo: '/assets/logo/resqzone-logo.svg',
  logoSymbol: '/assets/logo/resqzone-symbol.svg',
  flood: '/assets/disaster/flood.svg',
  landslide: '/assets/disaster/landslide.svg',
  shelter: '/assets/safe-zones/shelter.svg',
  bus: '/assets/transport/bus.svg',
  train: '/assets/transport/train.svg',
  car: '/assets/transport/car.svg',
  boat: '/assets/rescue/boat.svg',
  helicopter: '/assets/rescue/helicopter.svg',
  community: '/assets/citizen/community.svg',
  heroBg: '/assets/backgrounds/hero.svg',
};

