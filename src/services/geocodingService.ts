/**
 * ResQZone Modular Geocoding & Location Intelligence Service
 * Provides forward geocoding, autocomplete search, live GPS geolocation,
 * and location-aware spatial calculations for dynamic disaster response.
 * NO HARDCODED PERMANENT LOCATION (e.g. Uttarakhand is not fixed).
 */

import { CitizenLocation, RiskLevel } from '../types';

export interface GeocodingResult {
  id: string;
  name: string;
  subTitle: string;
  district: string;
  state: string;
  country: string;
  coordinates: [number, number];
  riskLevel: RiskLevel;
  hazardNotice: string;
  zoom: number;
}

// Pre-indexed multi-state emergency locations across India
export const PRE_INDEXED_LOCATIONS: GeocodingResult[] = [
  {
    id: 'LOC-HALDIA',
    name: 'Haldia',
    subTitle: 'Haldia Industrial & Port City, Purba Medinipur, West Bengal',
    district: 'Purba Medinipur',
    state: 'West Bengal',
    country: 'India',
    coordinates: [22.0667, 88.0698],
    riskLevel: 'HIGH',
    hazardNotice: 'Coastal & Hooghly estuary tidal surge advisory active. Drainage pump stations monitoring basin level.',
    zoom: 13,
  },
  {
    id: 'LOC-KOLKATA',
    name: 'Kolkata',
    subTitle: 'Kolkata Metropolitan Area, West Bengal, India',
    district: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    coordinates: [22.5726, 88.3639],
    riskLevel: 'MODERATE',
    hazardNotice: 'Hooghly river sluice gates operational. Low-lying urban drainage stations on standby.',
    zoom: 13,
  },
  {
    id: 'LOC-MUMBAI',
    name: 'Mumbai',
    subTitle: 'Mumbai Suburban / Island City, Maharashtra, India',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    country: 'India',
    coordinates: [19.0760, 72.8777],
    riskLevel: 'HIGH',
    hazardNotice: 'High tide alert & coastal storm-water drainage monitoring active.',
    zoom: 12,
  },
  {
    id: 'LOC-DELHI',
    name: 'Delhi NCR',
    subTitle: 'National Capital Territory, Delhi, India',
    district: 'Central Delhi',
    state: 'Delhi',
    country: 'India',
    coordinates: [28.6139, 77.2090],
    riskLevel: 'SAFE',
    hazardNotice: 'Yamuna flood plains discharge normal. Sector emergency stations active.',
    zoom: 12,
  },
  {
    id: 'LOC-SILIGURI',
    name: 'Siliguri',
    subTitle: 'Siliguri Municipal Corp, Darjeeling / Jalpaiguri, West Bengal',
    district: 'Darjeeling',
    state: 'West Bengal',
    country: 'India',
    coordinates: [26.7165, 88.3915],
    riskLevel: 'HIGH',
    hazardNotice: 'Heavy rainfall expected. Teesta & Mahananda river watch active.',
    zoom: 13,
  },
  {
    id: 'LOC-CHAMOLI',
    name: 'Chamoli / Joshimath',
    subTitle: 'Chamoli District, Garhwal Division, Uttarakhand',
    district: 'Chamoli',
    state: 'Uttarakhand',
    country: 'India',
    coordinates: [30.5564, 79.5658],
    riskLevel: 'CRITICAL',
    hazardNotice: 'Geological slope creep warning along Alaknanda river valley corridor.',
    zoom: 13,
  },
  {
    id: 'LOC-DEHRADUN',
    name: 'Dehradun',
    subTitle: 'State Capital & SEOC Hub, Dehradun, Uttarakhand',
    district: 'Dehradun',
    state: 'Uttarakhand',
    country: 'India',
    coordinates: [30.3165, 78.0322],
    riskLevel: 'MODERATE',
    hazardNotice: 'Intermittent rainfall in Doon Valley. River levels normal.',
    zoom: 13,
  },
  {
    id: 'LOC-HOWRAH',
    name: 'Howrah',
    subTitle: 'Howrah Municipal Corporation, West Bengal, India',
    district: 'Howrah',
    state: 'West Bengal',
    country: 'India',
    coordinates: [22.5958, 88.2636],
    riskLevel: 'MODERATE',
    hazardNotice: 'Riverfront embankments monitored. Water pumps operational.',
    zoom: 13,
  },
  {
    id: 'LOC-BENGALURU',
    name: 'Bengaluru',
    subTitle: 'BBMP Greater Bangalore, Karnataka, India',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
    coordinates: [12.9716, 77.5946],
    riskLevel: 'SAFE',
    hazardNotice: 'Stormwater catchment basins clear. Normal operations.',
    zoom: 12,
  },
  {
    id: 'LOC-CHENNAI',
    name: 'Chennai',
    subTitle: 'Greater Chennai Corporation, Tamil Nadu, India',
    district: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    coordinates: [13.0827, 80.2707],
    riskLevel: 'MODERATE',
    hazardNotice: 'Coastal swell advisory. Sluice canals active.',
    zoom: 12,
  },
  {
    id: 'LOC-PATNA',
    name: 'Patna',
    subTitle: 'Patna District, Bihar, India',
    district: 'Patna',
    state: 'Bihar',
    country: 'India',
    coordinates: [25.5941, 85.1376],
    riskLevel: 'MODERATE',
    hazardNotice: 'Ganga river discharge elevated. Drainage pump stations operational.',
    zoom: 13,
  },
  {
    id: 'LOC-GUWAHATI',
    name: 'Guwahati',
    subTitle: 'Kamrup Metropolitan, Assam, India',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    country: 'India',
    coordinates: [26.1445, 91.7362],
    riskLevel: 'CRITICAL',
    hazardNotice: 'Brahmaputra river warning. Inundation alerts active in riverfront wards.',
    zoom: 13,
  },
  {
    id: 'LOC-RUDRAPUR',
    name: 'Rudrapur',
    subTitle: 'Udham Singh Nagar, Uttarakhand, India',
    district: 'Udham Singh Nagar',
    state: 'Uttarakhand',
    country: 'India',
    coordinates: [28.9800, 79.4000],
    riskLevel: 'HIGH',
    hazardNotice: 'High flood risk along Kalyani river basin. Water logging in low-lying sectors.',
    zoom: 13,
  },
  {
    id: 'LOC-RISHIKESH',
    name: 'Rishikesh',
    subTitle: 'Foothills Railhead, Dehradun, Uttarakhand',
    district: 'Dehradun',
    state: 'Uttarakhand',
    country: 'India',
    coordinates: [30.0869, 78.2676],
    riskLevel: 'SAFE',
    hazardNotice: 'Railhead and relief corridors operating normally.',
    zoom: 13,
  },
];

class GeocodingService {
  /**
   * Autocomplete location suggestions matching query.
   * Checks pre-indexed list first, then falls back to OpenStreetMap Nominatim for any global place.
   */
  public async searchLocations(query: string): Promise<GeocodingResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      return PRE_INDEXED_LOCATIONS.slice(0, 6);
    }

    // 1. Check local pre-indexed database with multi-term token support
    const terms = trimmed.split(/[\s,]+/).filter(Boolean);
    const localMatches = PRE_INDEXED_LOCATIONS.filter(item => {
      const combinedText = `${item.name} ${item.district} ${item.state} ${item.subTitle} ${item.country}`.toLowerCase();
      return combinedText.includes(trimmed) || terms.every(t => combinedText.includes(t));
    });

    if (localMatches.length >= 2) {
      return localMatches;
    }

    // 2. Query OpenStreetMap Nominatim for live global places
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const apiResults: GeocodingResult[] = data.map((item: any, idx: number) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const address = item.address || {};
            const placeName = address.village || address.town || address.city || address.suburb || item.name || query;
            const district = address.state_district || address.county || address.city || placeName;
            const state = address.state || address.country || 'Region';

            const isHigh = placeName.toLowerCase().includes('flood') || placeName.toLowerCase().includes('river');

            return {
              id: `GEO-${idx}-${Date.now()}`,
              name: placeName,
              subTitle: item.display_name,
              district,
              state,
              country: address.country || 'India',
              coordinates: [lat, lon],
              riskLevel: isHigh ? 'HIGH' : 'MODERATE',
              hazardNotice: `Active monitoring and safety assessment for ${placeName}, ${state}.`,
              zoom: 13,
            };
          });

          const combined = [...localMatches];
          for (const apiRes of apiResults) {
            if (!combined.some(c => Math.abs(c.coordinates[0] - apiRes.coordinates[0]) < 0.05 && Math.abs(c.coordinates[1] - apiRes.coordinates[1]) < 0.05)) {
              combined.push(apiRes);
            }
          }
          return combined;
        }
      }
    } catch {
      // Return local matches if offline
    }

    // Do NOT return arbitrary fallback locations if search yielded no matches
    return localMatches;
  }

  /**
   * Browser Geolocation GPS locator
   */
  public async getCurrentPosition(): Promise<GeocodingResult> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Attempt reverse geocoding via OpenStreetMap for human address
          let detectedName = 'My GPS Location';
          let detectedDistrict = 'Local Sector';
          let detectedState = 'Current Region';
          let subTitle = `GPS Coordinates: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (±${Math.round(position.coords.accuracy || 10)}m)`;

          try {
            const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const res = await fetch(revUrl, { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
              const data = await res.json();
              if (data?.address) {
                const addr = data.address;
                detectedName = addr.village || addr.suburb || addr.town || addr.city || 'Detected Location';
                detectedDistrict = addr.state_district || addr.county || addr.city || detectedName;
                detectedState = addr.state || 'India';
                subTitle = `${detectedName}, ${detectedDistrict}, ${detectedState}`;
              }
            }
          } catch {
            // Use coordinate label if reverse lookup fails
          }

          resolve({
            id: `GPS-${Date.now()}`,
            name: detectedName,
            subTitle,
            district: detectedDistrict,
            state: detectedState,
            country: 'India',
            coordinates: [lat, lng],
            riskLevel: 'MODERATE',
            hazardNotice: `Live GPS telemetry verified for ${detectedName}.`,
            zoom: 14,
          });
        },
        (error) => {
          reject(error);
        },
        { timeout: 9000, enableHighAccuracy: true }
      );
    });
  }

  public getDefaultLocation(): GeocodingResult {
    // Default to Siliguri (matches screenshot) or Dehradun
    return PRE_INDEXED_LOCATIONS[0];
  }
}

export const geocodingService = new GeocodingService();
