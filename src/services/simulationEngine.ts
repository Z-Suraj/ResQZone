import { Habitation, SafeZone, HazardArea, CitizenLocation } from '../types';

export interface SimulationParameters {
  rainfallPercent: number; // -20% to +150%
  hazardMultiplier: number; // 1.0 to 2.5
  populationSurgePercent: number; // 0% to +100%
  closedRoadsCount: number; // 0 to 4
  railwayClosed: boolean; // true/false
  safeZoneCapacityDeltaPercent: number; // -50% to +50%
  availableFleetDeltaPercent: number; // -50% to +50%
  evacuationUrgencySurge: boolean; // true/false
}

export interface SimulationBaseline {
  locationName: string;
  district: string;
  totalHabitations: number;
  criticalHabitationsCount: number;
  totalExposedPopulation: number;
  totalSafeCapacity: number;
  availableCapacity: number;
  capacityUtilization: number;
  totalCorridorsCount: number;
  openCorridorsCount: number;
  availableFleetUnits: number;
  estimatedClearanceHours: number;
  averageRiskScore: number;
}

export interface SafeZoneImpact {
  id: string;
  name: string;
  baselineCapacity: number;
  projectedCapacity: number;
  projectedOccupancy: number;
  projectedSurplusOrDeficit: number; // negative means deficit
  status: 'SAFE' | 'NEAR_CAPACITY' | 'OVER_CAPACITY';
}

export interface TemporalStep {
  hourLabel: string;
  timeOffsetHours: number;
  waterLevelDeltaM: number;
  evacuatedCount: number;
  remainingExposedCount: number;
  riskScore: number;
}

export interface SimulationProjection {
  projectedRiskScore: number;
  projectedRiskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE';
  projectedExposedPopulation: number;
  exposedPopulationDelta: number;
  projectedSafeCapacity: number;
  netCapacityDeficit: number; // >0 means shortage of beds
  projectedOpenCorridors: number;
  blockedCorridors: { name: string; reason: string; severity: 'BLOCKED' | 'SEVERED' }[];
  projectedFleetDeficit: number; // buses/trucks shortage
  projectedClearanceHours: number;
  clearanceHoursDelta: number;
  evacuationBottlenecks: string[];
  recommendedMitigations: string[];
  safeZoneImpacts: SafeZoneImpact[];
  temporalProgression: TemporalStep[];
}

export interface SimulationRunResult {
  id: string;
  runAt: string;
  locationName: string;
  locationDistrict: string;
  locationCoordinates: [number, number];
  scenarioTitle: string;
  params: SimulationParameters;
  baseline: SimulationBaseline;
  projection: SimulationProjection;
}

export const DEFAULT_SIMULATION_PARAMS: SimulationParameters = {
  rainfallPercent: 0,
  hazardMultiplier: 1.0,
  populationSurgePercent: 0,
  closedRoadsCount: 0,
  railwayClosed: false,
  safeZoneCapacityDeltaPercent: 0,
  availableFleetDeltaPercent: 0,
  evacuationUrgencySurge: false,
};

// Preset Scenarios for Rapid Stress-Testing
export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  params: SimulationParameters;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'monsoon_surge',
    title: 'Monsoon Cloudburst (+40% Rain)',
    description: 'Sudden precipitation surge inundating low-lying settlements and blocking 2 arterial bypass corridors.',
    badge: 'SEVERE RAINFALL',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    params: {
      rainfallPercent: 40,
      hazardMultiplier: 1.35,
      populationSurgePercent: 25,
      closedRoadsCount: 2,
      railwayClosed: false,
      safeZoneCapacityDeltaPercent: 0,
      availableFleetDeltaPercent: -10,
      evacuationUrgencySurge: true,
    },
  },
  {
    id: 'cyclone_storm_surge',
    title: 'Estuarine Storm Surge (+80% Rain & Flood)',
    description: 'High tidal bore and torrential winds compromising waterfront shelters and cutting railway logistics.',
    badge: 'CYCLONE TIDE',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    params: {
      rainfallPercent: 80,
      hazardMultiplier: 1.75,
      populationSurgePercent: 55,
      closedRoadsCount: 3,
      railwayClosed: true,
      safeZoneCapacityDeltaPercent: -25,
      availableFleetDeltaPercent: -30,
      evacuationUrgencySurge: true,
    },
  },
  {
    id: 'lifeline_collapse',
    title: 'Critical Bridge & Arterial Severance',
    description: 'Major arterial bridge failure isolating primary evacuation route; fleet rerouted through rural narrow bypasses.',
    badge: 'INFRASTRUCTURE COLLAPSE',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    params: {
      rainfallPercent: 20,
      hazardMultiplier: 1.15,
      populationSurgePercent: 10,
      closedRoadsCount: 3,
      railwayClosed: false,
      safeZoneCapacityDeltaPercent: -10,
      availableFleetDeltaPercent: -20,
      evacuationUrgencySurge: false,
    },
  },
  {
    id: 'catastrophic_dam_spill',
    title: 'Spillway Flash Flooding (+120% Extreme)',
    description: 'Maximum discharge from upstream catchment inundates 85% of floodplain with severe shelter deficits.',
    badge: 'MAXIMUM HAZARD',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    params: {
      rainfallPercent: 120,
      hazardMultiplier: 2.2,
      populationSurgePercent: 80,
      closedRoadsCount: 4,
      railwayClosed: true,
      safeZoneCapacityDeltaPercent: -40,
      availableFleetDeltaPercent: -40,
      evacuationUrgencySurge: true,
    },
  },
];

// Compute baseline metrics from real location & store data
export function computeSimulationBaseline(
  location: CitizenLocation | null,
  habitations: Habitation[],
  safeZones: SafeZone[],
  hazards: HazardArea[]
): SimulationBaseline {
  const locName = location?.name || 'Active Sector';
  const locDist = location?.district || 'Regional District';
  const totalPop = habitations.reduce((sum, h) => sum + h.population, 0);
  const critCount = habitations.filter(h => h.riskLevel === 'CRITICAL' || h.relocationPriority === 'IMMEDIATE').length;
  const totalCap = safeZones.reduce((sum, s) => sum + s.safeCapacity, 0);
  const availCap = safeZones.reduce((sum, s) => sum + s.availableCapacity, 0);
  const totalOccupancy = totalCap - availCap;
  const capUtil = totalCap > 0 ? Math.round((totalOccupancy / totalCap) * 100) : 0;

  // Corridors & Fleet defaults based on sector size
  const totalCorridors = 6;
  const openCorridors = 6;
  const baseFleetUnits = Math.max(14, Math.round(totalPop / 250));
  const clearanceHours = parseFloat((Math.max(2.5, (totalPop / (baseFleetUnits * 40 * 1.5)))).toFixed(1));
  const avgRisk = habitations.length > 0 
    ? parseFloat((habitations.reduce((sum, h) => sum + h.riskScore, 0) / habitations.length).toFixed(1))
    : 5.5;

  return {
    locationName: locName,
    district: locDist,
    totalHabitations: habitations.length,
    criticalHabitationsCount: critCount,
    totalExposedPopulation: totalPop,
    totalSafeCapacity: totalCap,
    availableCapacity: availCap,
    capacityUtilization: capUtil,
    totalCorridorsCount: totalCorridors,
    openCorridorsCount: openCorridors,
    availableFleetUnits: baseFleetUnits,
    estimatedClearanceHours: clearanceHours,
    averageRiskScore: avgRisk,
  };
}

// Deterministic Simulation Physics & Logistical Modeling Engine
export function runSimulationEngine(
  params: SimulationParameters,
  baseline: SimulationBaseline,
  habitations: Habitation[],
  safeZones: SafeZone[],
  location: CitizenLocation | null
): SimulationProjection {
  // 1. Population Surge Calculation
  // Compounded by rainfall factor and hazard multiplier
  const rainExpansionFactor = Math.max(0, params.rainfallPercent / 100) * 0.45;
  const hazardFactor = (params.hazardMultiplier - 1.0) * 0.35;
  const userPopSurge = params.populationSurgePercent / 100;

  const totalExpansionMultiplier = 1 + userPopSurge + rainExpansionFactor + hazardFactor;
  const projectedExposed = Math.round(baseline.totalExposedPopulation * totalExpansionMultiplier);
  const popDelta = projectedExposed - baseline.totalExposedPopulation;

  // 2. Risk Score Escalation
  const rainRiskBonus = (params.rainfallPercent / 100) * 1.8;
  const hazardRiskBonus = (params.hazardMultiplier - 1.0) * 2.2;
  const roadClosureRiskBonus = params.closedRoadsCount * 0.45;
  const railBonus = params.railwayClosed ? 0.6 : 0;
  const urgencyBonus = params.evacuationUrgencySurge ? 0.5 : 0;

  const projectedRiskScore = Math.min(
    10.0,
    parseFloat((baseline.averageRiskScore + rainRiskBonus + hazardRiskBonus + roadClosureRiskBonus + railBonus + urgencyBonus).toFixed(1))
  );

  let projectedRiskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE' = 'MODERATE';
  if (projectedRiskScore >= 8.0) projectedRiskLevel = 'CRITICAL';
  else if (projectedRiskScore >= 6.0) projectedRiskLevel = 'HIGH';
  else if (projectedRiskScore >= 4.0) projectedRiskLevel = 'MODERATE';
  else projectedRiskLevel = 'SAFE';

  // 3. Safe Zone Capacity Stress
  const capModifier = 1 + (params.safeZoneCapacityDeltaPercent / 100);
  const projectedTotalSafeCap = Math.max(0, Math.round(baseline.totalSafeCapacity * capModifier));

  // Distribute projected evacuees across safe zones to simulate saturation
  const safeZoneImpacts: SafeZoneImpact[] = safeZones.map((sz, idx) => {
    const baseCap = sz.safeCapacity;
    const projCap = Math.max(50, Math.round(baseCap * capModifier));
    // Proportional load based on distance and capacity
    const proportion = safeZones.length > 0 ? (baseCap / baseline.totalSafeCapacity) : 1;
    const projOccupancy = Math.round(projectedExposed * proportion);
    const surplusOrDeficit = projCap - projOccupancy;

    let status: 'SAFE' | 'NEAR_CAPACITY' | 'OVER_CAPACITY' = 'SAFE';
    if (surplusOrDeficit < 0) {
      status = 'OVER_CAPACITY';
    } else if (surplusOrDeficit < projCap * 0.15) {
      status = 'NEAR_CAPACITY';
    }

    return {
      id: sz.id,
      name: sz.name,
      baselineCapacity: baseCap,
      projectedCapacity: projCap,
      projectedOccupancy: projOccupancy,
      projectedSurplusOrDeficit: surplusOrDeficit,
      status,
    };
  });

  const aggregateAvailableProjected = safeZoneImpacts.reduce((sum, s) => sum + s.projectedCapacity, 0);
  const netCapacityDeficit = Math.max(0, projectedExposed - aggregateAvailableProjected);

  // 4. Corridor Blockage & Evacuation Routing
  const openCorridors = Math.max(1, baseline.totalCorridorsCount - params.closedRoadsCount);
  const roadNames = [
    'Primary Arterial Highway (NH Access Corridor)',
    'Estuarine Lowland Bypass (State Highway 4)',
    'Canal Embankment Relief Road',
    'Railway Underpass Feeder Route',
  ];

  const blockedCorridors: { name: string; reason: string; severity: 'BLOCKED' | 'SEVERED' }[] = [];
  for (let i = 0; i < params.closedRoadsCount; i++) {
    blockedCorridors.push({
      name: roadNames[i % roadNames.length],
      reason: i === 0 ? 'Waterlogging & River Flash Overflow' : i === 1 ? 'Culvert Structural Washout' : 'Debris Accumulation & Submerged Roadbed',
      severity: i >= 2 ? 'SEVERED' as const : 'BLOCKED' as const,
    });
  }
  if (params.railwayClosed) {
    blockedCorridors.push({
      name: 'District Mainline Rail Corridor',
      reason: 'Trackbed ballast submersion & signal relay power failure',
      severity: 'SEVERED',
    });
  }

  // 5. Fleet Requirements & Clearance Time
  const fleetModifier = 1 + (params.availableFleetDeltaPercent / 100);
  const activeFleet = Math.max(4, Math.round(baseline.availableFleetUnits * fleetModifier));
  const neededBuses = Math.ceil(projectedExposed / 45);
  const fleetDeficit = Math.max(0, neededBuses - activeFleet);

  // Clearance hours calculation based on throughput
  const effectiveThroughputPerHour = (activeFleet * 40 * (openCorridors / baseline.totalCorridorsCount)) / 1.6;
  const projectedClearanceHours = parseFloat((projectedExposed / Math.max(50, effectiveThroughputPerHour)).toFixed(1));
  const clearanceHoursDelta = parseFloat((projectedClearanceHours - baseline.estimatedClearanceHours).toFixed(1));

  // 6. Actionable Bottlenecks & Mitigations
  const evacuationBottlenecks: string[] = [];
  const recommendedMitigations: string[] = [];

  if (popDelta > 0) {
    evacuationBottlenecks.push(`Projected evacuation cohort surged by +${popDelta.toLocaleString()} citizens (+${Math.round(userPopSurge * 100 + rainExpansionFactor * 100)}% expansion).`);
  }
  if (netCapacityDeficit > 0) {
    evacuationBottlenecks.push(`Intra-district shelter capacity shortfall: ${netCapacityDeficit.toLocaleString()} persons exceed available safe berths.`);
    recommendedMitigations.push(`Requisition secondary relief structures (college auditoriums, indoor sport arenas) in adjacent buffer sectors.`);
  }
  if (params.closedRoadsCount > 0) {
    evacuationBottlenecks.push(`${params.closedRoadsCount} of ${baseline.totalCorridorsCount} primary arterial evacuation corridors severed by floodwaters.`);
    recommendedMitigations.push(`Deploy amphibious 4x4 troop carriers and establish single-lane contraflow on elevated embankments.`);
  }
  if (fleetDeficit > 0) {
    evacuationBottlenecks.push(`Logistical transit deficit: Shortage of ${fleetDeficit} high-capacity transport buses for rapid triage.`);
    recommendedMitigations.push(`Request immediate mutual-aid inter-district fleet requisition from State Transport Corporation.`);
  }
  if (params.railwayClosed) {
    evacuationBottlenecks.push(`District railway corridor inactive: Bulk mass evacuation offline.`);
    recommendedMitigations.push(`Establish multi-point pickup convoys along elevated bypass highways.`);
  }
  if (recommendedMitigations.length === 0) {
    recommendedMitigations.push('Maintain active radar tracking and keep SDRF motorboat squadrons on 15-minute standby.');
  }

  // 7. Temporal Timeline (T+0h to T+12h)
  const temporalProgression: TemporalStep[] = [
    {
      hourLabel: 'T+0h (Immediate)',
      timeOffsetHours: 0,
      waterLevelDeltaM: 0.1,
      evacuatedCount: 0,
      remainingExposedCount: projectedExposed,
      riskScore: Math.min(10, baseline.averageRiskScore + 0.4),
    },
    {
      hourLabel: 'T+2h (Runoff Peak)',
      timeOffsetHours: 2,
      waterLevelDeltaM: parseFloat(((params.rainfallPercent / 100) * 0.8 + 0.4).toFixed(2)),
      evacuatedCount: Math.round(projectedExposed * 0.28),
      remainingExposedCount: Math.round(projectedExposed * 0.72),
      riskScore: projectedRiskScore,
    },
    {
      hourLabel: 'T+6h (Crest Sustained)',
      timeOffsetHours: 6,
      waterLevelDeltaM: parseFloat(((params.rainfallPercent / 100) * 1.1 + 0.6).toFixed(2)),
      evacuatedCount: Math.round(projectedExposed * 0.65),
      remainingExposedCount: Math.round(projectedExposed * 0.35),
      riskScore: parseFloat((projectedRiskScore * 0.9).toFixed(1)),
    },
    {
      hourLabel: 'T+12h (Stabilization)',
      timeOffsetHours: 12,
      waterLevelDeltaM: parseFloat(((params.rainfallPercent / 100) * 0.5 + 0.2).toFixed(2)),
      evacuatedCount: Math.round(projectedExposed * 0.94),
      remainingExposedCount: Math.round(projectedExposed * 0.06),
      riskScore: Math.max(3.5, parseFloat((projectedRiskScore * 0.65).toFixed(1))),
    },
  ];

  return {
    projectedRiskScore,
    projectedRiskLevel,
    projectedExposedPopulation: projectedExposed,
    exposedPopulationDelta: popDelta,
    projectedSafeCapacity: projectedTotalSafeCap,
    netCapacityDeficit,
    projectedOpenCorridors: openCorridors,
    blockedCorridors,
    projectedFleetDeficit: fleetDeficit,
    projectedClearanceHours,
    clearanceHoursDelta,
    evacuationBottlenecks,
    recommendedMitigations,
    safeZoneImpacts,
    temporalProgression,
  };
}

// In-memory simulation result bus (Never persists to database or alters real state)
let latestSimulationResult: SimulationRunResult | null = null;
const simulationListeners: Array<(result: SimulationRunResult | null) => void> = [];

export function setLatestSimulationResult(result: SimulationRunResult | null) {
  latestSimulationResult = result;
  simulationListeners.forEach(listener => listener(latestSimulationResult));
}

export function getLatestSimulationResult(): SimulationRunResult | null {
  return latestSimulationResult;
}

export function subscribeSimulationResult(listener: (result: SimulationRunResult | null) => void): () => void {
  simulationListeners.push(listener);
  return () => {
    const idx = simulationListeners.indexOf(listener);
    if (idx !== -1) simulationListeners.splice(idx, 1);
  };
}
