/**
 * Centralized Vehicle Image Mapping for ResQZone
 * 
 * Strict 1:1 mapping between vehicle types and authentic photographic assets.
 * Guarantees zero mismatched or unrelated disaster imagery on vehicle cards.
 */

export type SupportedVehicleType = 
  | 'bus'
  | 'train'
  | 'car'
  | 'rescue_vehicle'
  | 'ambulance'
  | 'boat'
  | 'helicopter'
  | 'walking';

export const vehicleImages = {
  bus: "/assets/vehicles/bus.jpg",
  train: "/assets/vehicles/train.jpg",
  car: "/assets/vehicles/car.jpg",
  rescue_vehicle: "/assets/vehicles/rescue-vehicle.jpg",
  ambulance: "/assets/vehicles/ambulance.jpg",
  boat: "/assets/vehicles/boat.jpg",
  helicopter: "/assets/vehicles/helicopter.jpg",
} as const;

/**
 * Human-readable display label for each vehicle type
 */
export const VEHICLE_TYPE_LABELS: Record<SupportedVehicleType, string> = {
  bus: 'Bus',
  train: 'Train',
  car: 'Car',
  rescue_vehicle: 'Rescue Vehicle',
  ambulance: 'Ambulance',
  boat: 'Boat',
  helicopter: 'Helicopter',
  walking: 'Walking',
};

/**
 * Normalizes any vehicle type or title string into a strict SupportedVehicleType
 */
export function normalizeVehicleType(rawType?: string, title?: string): SupportedVehicleType {
  const combined = `${rawType || ''} ${title || ''}`.toLowerCase().trim();

  if (combined.includes('walk') || combined.includes('foot') || combined.includes('pedestrian')) {
    return 'walking';
  }
  if (combined.includes('ambulance') || combined.includes('paramedic') || combined.includes('medical van')) {
    return 'ambulance';
  }
  if (
    combined.includes('rescue_vehicle') ||
    combined.includes('rescue vehicle') ||
    combined.includes('ndrf truck') ||
    combined.includes('heavy rescue') ||
    combined.includes('sdrf truck') ||
    combined.includes('utility van') ||
    combined.includes('all-terrain') ||
    combined.includes('rv-')
  ) {
    return 'rescue_vehicle';
  }
  if (combined.includes('bus') || combined.includes('coach') || combined.includes('transit')) {
    return 'bus';
  }
  if (combined.includes('train') || combined.includes('rail') || combined.includes('locomotive')) {
    return 'train';
  }
  if (combined.includes('boat') || combined.includes('ship') || combined.includes('raft') || combined.includes('ferry') || combined.includes('vessel')) {
    return 'boat';
  }
  if (combined.includes('helicopter') || combined.includes('heli') || combined.includes('air') || combined.includes('chopper') || combined.includes('flight')) {
    return 'helicopter';
  }
  if (combined.includes('car') || combined.includes('suv') || combined.includes('sedan') || combined.includes('jeep') || combined.includes('4x4')) {
    return 'car';
  }

  return 'bus';
}

/**
 * Validates if an image URL matches the target vehicle type.
 * Returns true only if the image URL is verified to represent this vehicle type.
 */
export function isImageMatchingType(imageUrl: string | undefined | null, type: SupportedVehicleType): boolean {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return false;
  }

  // Walking must NOT have a vehicle image
  if (type === 'walking') {
    return false;
  }

  const expectedLocalPath = vehicleImages[type];
  if (imageUrl === expectedLocalPath || imageUrl.endsWith(expectedLocalPath)) {
    return true;
  }

  // Check if image URL contains contradictory keywords (e.g. car image for bus, disaster images, house, etc.)
  const lowerUrl = imageUrl.toLowerCase();

  const contradictoryKeywords: Record<SupportedVehicleType, string[]> = {
    bus: ['boat', 'train', 'helicopter', 'ambulance', 'disaster', 'flood', 'mountain', 'car', 'sports-car'],
    train: ['bus', 'boat', 'helicopter', 'ambulance', 'car', 'flood', 'mountain'],
    car: ['bus', 'train', 'boat', 'helicopter', 'ambulance', 'flood'],
    rescue_vehicle: ['boat', 'train', 'bus', 'helicopter', 'sports-car', 'sedan'],
    ambulance: ['bus', 'train', 'boat', 'helicopter', 'car'],
    boat: ['bus', 'train', 'helicopter', 'car', 'ambulance'],
    helicopter: ['bus', 'train', 'boat', 'car', 'ambulance'],
    walking: ['*'],
  };

  const forbidden = contradictoryKeywords[type] || [];
  for (const word of forbidden) {
    if (word === '*' || lowerUrl.includes(word)) {
      return false;
    }
  }

  return false;
}

/**
 * Validated vehicle object representation
 */
export interface ValidatedVehicleCardData {
  id: string;
  type: SupportedVehicleType;
  rawType: string;
  title: string;
  image: string | null;
  capacity: number;
  availableSeats: number;
  occupied: number;
  isValid: boolean;
  validationNotes: string[];
}

/**
 * Validates a vehicle object before rendering.
 * Enforces vehicle.type, vehicle.image, vehicle.id, vehicle.capacity, and vehicle.availableSeats.
 * Automatically recovers mismatched images using the centralized mapping.
 */
export function validateVehicle(vehicle: any): ValidatedVehicleCardData {
  const validationNotes: string[] = [];

  // 1. Validate ID
  const id = typeof vehicle?.id === 'string' && vehicle.id.trim() !== '' 
    ? vehicle.id.trim() 
    : `VEH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  if (!vehicle?.id) {
    validationNotes.push('Missing ID generated');
  }

  // 2. Validate Type
  const rawType = vehicle?.type || 'BUS';
  const normalizedType = normalizeVehicleType(rawType, vehicle?.title);

  // 3. Validate Capacity
  const capacityNum = Number(vehicle?.capacity);
  const capacity = !isNaN(capacityNum) && capacityNum > 0 ? capacityNum : 30;

  // 4. Validate Available Seats / Occupied
  const rawAvailable = vehicle?.availableSeats !== undefined ? vehicle.availableSeats : vehicle?.available;
  const availableNum = Number(rawAvailable);
  const availableSeats = !isNaN(availableNum) && availableNum >= 0 
    ? Math.min(availableNum, capacity) 
    : Math.max(0, capacity - (Number(vehicle?.occupied) || 0));

  const occupied = Math.max(0, capacity - availableSeats);

  // 5. Validate Image Matching
  const rawImageUrl = vehicle?.image || vehicle?.imageUrl;
  let resolvedImage: string | null = null;

  if (normalizedType === 'walking') {
    // Walking → NO vehicle image
    resolvedImage = null;
    if (rawImageUrl) {
      validationNotes.push('Suppressed image for walking mode');
    }
  } else {
    const isMatching = isImageMatchingType(rawImageUrl, normalizedType);
    if (isMatching && rawImageUrl) {
      resolvedImage = rawImageUrl;
    } else {
      // Use centralized vehicle-type image mapping
      resolvedImage = vehicleImages[normalizedType];
      if (rawImageUrl && !isMatching) {
        validationNotes.push(`Corrected mismatched image for ${normalizedType}`);
      }
    }
  }

  const title = vehicle?.title || `${VEHICLE_TYPE_LABELS[normalizedType]} Unit`;

  return {
    id,
    type: normalizedType,
    rawType,
    title,
    image: resolvedImage,
    capacity,
    availableSeats,
    occupied,
    isValid: true,
    validationNotes,
  };
}
