/**
 * ResQZone Multimodal Fleet Intelligence Service
 * Tracks emergency buses, evacuation trains, rescue vehicles, flood boats, and air units.
 * Marked as Demo/Prototype Simulation.
 */

import { TransportFleetItem } from '../types';
import { vehicleImages } from '../data/vehicleImages';

export const DEMO_FLEET: TransportFleetItem[] = [
  {
    id: 'FLEET-EB-204',
    type: 'BUS',
    title: 'Emergency Bus',
    regOrId: 'EB-204',
    capacity: 50,
    occupied: 42,
    available: 8,
    status: 'AVAILABLE',
    pickupLocation: 'Joshimath Bus Stand / Transit Point A',
    etaMin: 8,
    routeDescription: 'Joshimath Ward → Pipalkoti Regional Safe Zone',
    equipment: ['Oxygen Cylinders', 'Stretcher Mount', 'GPS Telemetry'],
    imageUrl: vehicleImages.bus,
    coordinates: [30.5480, 79.5520],
  },
  {
    id: 'FLEET-EV-17',
    type: 'TRAIN',
    title: 'Evacuation Train',
    regOrId: 'EV-17',
    capacity: 1200,
    occupied: 860,
    available: 340,
    status: 'BOARDING',
    pickupLocation: 'Platform 2, Rishikesh-Haridwar Evac Railhead',
    etaMin: 18,
    routeDescription: 'Haridwar Railhead → Dehradun Relief Terminal',
    equipment: ['Medical Coach', 'Food & Water Pantry', 'Onboard Triage'],
    imageUrl: vehicleImages.train,
    coordinates: [30.0869, 78.2676],
  },
  {
    id: 'FLEET-CR-11',
    type: 'CAR',
    title: 'Rapid Response Car',
    regOrId: 'CR-11',
    capacity: 4,
    occupied: 1,
    available: 3,
    status: 'AVAILABLE',
    pickupLocation: 'Civilian Staging Sector 1, Chamoli',
    etaMin: 5,
    routeDescription: 'Sector 1 Bypass → Chamoli Community Center',
    equipment: ['First Aid Kit', 'Emergency Radio', 'Spare Fuel Canister'],
    imageUrl: vehicleImages.car,
    coordinates: [30.4980, 79.5420],
  },
  {
    id: 'FLEET-RV-42',
    type: 'RESCUE_VEHICLE',
    title: 'Rescue Vehicle',
    regOrId: 'RV-42',
    capacity: 6,
    occupied: 2,
    available: 4,
    status: 'AVAILABLE',
    pickupLocation: 'Upper Ridge Sector 2, Chamoli',
    etaMin: 6,
    routeDescription: 'Rapid Response Sector 2 → District Hospital Post',
    equipment: ['Heavy Winch Gear', 'Jaws of Life Extrication', 'Radio Comms'],
    imageUrl: vehicleImages.rescue_vehicle,
    coordinates: [30.4910, 79.5390],
  },
  {
    id: 'FLEET-AM-08',
    type: 'AMBULANCE',
    title: 'Emergency Ambulance',
    regOrId: 'AM-08',
    capacity: 4,
    occupied: 2,
    available: 2,
    status: 'EN_ROUTE',
    pickupLocation: 'Joshimath Hospital Emergency Gate',
    etaMin: 7,
    routeDescription: 'Joshimath Hospital → Helang Trauma Care Unit',
    equipment: ['Defibrillator Monitor', 'Trauma Stretcher', 'Advanced Life Support'],
    imageUrl: vehicleImages.ambulance,
    coordinates: [30.5510, 79.5580],
  },
  {
    id: 'FLEET-RB-09',
    type: 'BOAT',
    title: 'Flood Rescue Boat',
    regOrId: 'RB-09',
    capacity: 20,
    occupied: 13,
    available: 7,
    status: 'AVAILABLE',
    pickupLocation: 'Alaknanda Riverbank Sector 4',
    etaMin: 9,
    routeDescription: 'Inundated Riverfront → Safe Elevated Embankment',
    equipment: ['Inflatable Life Rafts', 'Lifebuoys', 'Echo Sounder'],
    imageUrl: vehicleImages.boat,
    coordinates: [30.4850, 79.5290],
  },
  {
    id: 'FLEET-AR-07',
    type: 'HELICOPTER',
    title: 'Search & Rescue Helicopter',
    regOrId: 'AR-07',
    capacity: 12,
    occupied: 0,
    available: 12,
    status: 'STANDBY',
    pickupLocation: 'Relief Helipad Auli',
    etaMin: 14,
    routeDescription: 'High-Altitude Ridge → Base Command Center',
    equipment: ['Rescue Winch Stretcher', 'Flight Paramedics', 'Night Thermal FLIR'],
    imageUrl: vehicleImages.helicopter,
    coordinates: [30.5312, 79.5694],
  },
  {
    id: 'FLEET-WK-01',
    type: 'WALKING',
    title: 'Guided Foot Evacuation Group',
    regOrId: 'WK-01',
    capacity: 25,
    occupied: 14,
    available: 11,
    status: 'AVAILABLE',
    pickupLocation: 'Old Town Square Gathering Point',
    etaMin: 3,
    routeDescription: 'Pedestrian Trail A → Sector 3 High Ground Shelter',
    equipment: ['Escort Guides', 'High-Vis Markers', 'Handheld Megaphones'],
    imageUrl: '',
    coordinates: [30.5540, 79.5620],
  },
];

class FleetService {
  private fleet: TransportFleetItem[] = [...DEMO_FLEET];

  public getFleet(): TransportFleetItem[] {
    return [...this.fleet];
  }

  public getByType(type: TransportFleetItem['type']): TransportFleetItem[] {
    return this.fleet.filter(f => f.type === type);
  }

  public reserveSeats(vehicleId: string, count: number): boolean {
    const item = this.fleet.find(f => f.regOrId === vehicleId || f.id === vehicleId);
    if (item && item.available >= count) {
      item.occupied += count;
      item.available -= count;
      return true;
    }
    return false;
  }
}

export const fleetService = new FleetService();
