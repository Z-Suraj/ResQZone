import { RelocationRoute } from '../types';

export const DEMO_ROUTES: RelocationRoute[] = [
  {
    id: 'ROUTE-01',
    name: 'Joshimath to Pipalkoti Primary Evacuation Arterial (NH-58)',
    fromHabitationId: 'HAB-001',
    fromName: 'Joshimath Ward 4',
    toSafeZoneId: 'SZ-002',
    toName: 'Pipalkoti Sports Complex',
    distanceKm: 31.4,
    travelTimeMinutes: 52,
    status: 'CAUTION',
    routeType: 'Safe Corridor',
    waypoints: [
      [30.5564, 79.5658], // Joshimath
      [30.5420, 79.5420],
      [30.5280, 79.5100],
      [30.5050, 79.4850],
      [30.4820, 79.4650], // Helang Valley
      [30.4550, 79.4420],
      [30.4300, 79.4300], // Pipalkoti Safe Enclave
    ],
  },
  {
    id: 'ROUTE-02',
    name: 'Kedarnath to Gaurikund Mule Track & Emergency Ropeway Corridor',
    fromHabitationId: 'HAB-002',
    fromName: 'Kedarnath Village',
    toSafeZoneId: 'SZ-001',
    toName: 'Gaurikund Relief Camp',
    distanceKm: 16.2,
    travelTimeMinutes: 38,
    status: 'CLEAR',
    routeType: 'Road',
    waypoints: [
      [30.7346, 79.0669], // Kedarnath
      [30.7050, 79.0550], // Lincholi
      [30.6700, 79.0480], // Jungle Chatti
      [30.6350, 79.0380], // Bhimbali
      [30.5900, 79.0300], // Gaurikund
    ],
  },
  {
    id: 'ROUTE-03',
    name: 'Sonprayag to Gaurikund Shuttling Corridor',
    fromHabitationId: 'HAB-003',
    fromName: 'Sonprayag Habitation Cluster',
    toSafeZoneId: 'SZ-001',
    toName: 'Gaurikund Relief Camp',
    distanceKm: 5.4,
    travelTimeMinutes: 12,
    status: 'CLEAR',
    routeType: 'Road',
    waypoints: [
      [30.6278, 78.9984], // Sonprayag
      [30.6120, 79.0120],
      [30.5900, 79.0300], // Gaurikund
    ],
  },
  {
    id: 'ROUTE-04',
    name: 'Gopeshwar Lower Ward to District Poly-Clinic Shelter',
    fromHabitationId: 'HAB-006',
    fromName: 'Gopeshwar Lower Ward',
    toSafeZoneId: 'SZ-003',
    toName: 'Gopeshwar College Campus',
    distanceKm: 3.8,
    travelTimeMinutes: 8,
    status: 'CLEAR',
    routeType: 'Road',
    waypoints: [
      [30.4100, 79.3300],
      [30.4150, 79.3320],
      [30.4180, 79.3350],
      [30.4220, 79.3380],
    ],
  }
];
