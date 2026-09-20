"""
What-If Simulation Sandbox schemas.
Simulates monsoon cloudbursts, tidal surges, road blockages, capacity contractions, and temporal progressions.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field

class SimulationParameters(BaseModel):
    rainfallPercent: float = Field(default=0.0, description="-20% to +150%")
    hazardMultiplier: float = Field(default=1.0, description="1.0 to 2.5")
    populationSurgePercent: float = Field(default=0.0, description="0% to +100%")
    closedRoadsCount: int = Field(default=0, description="0 to 4")
    railwayClosed: bool = Field(default=False)
    safeZoneCapacityDeltaPercent: float = Field(default=0.0, description="-50% to +50%")
    availableFleetDeltaPercent: float = Field(default=0.0, description="-50% to +50%")
    evacuationUrgencySurge: bool = Field(default=False)

class SafeZoneImpact(BaseModel):
    id: str
    name: str
    baselineCapacity: int
    projectedCapacity: int
    projectedOccupancy: int
    projectedSurplusOrDeficit: int
    status: str  # SAFE, NEAR_CAPACITY, OVER_CAPACITY

class TemporalStep(BaseModel):
    hourLabel: str
    timeOffsetHours: int
    waterLevelDeltaM: float
    evacuatedCount: int
    remainingExposedCount: int
    riskScore: float

class BlockedCorridor(BaseModel):
    name: str
    reason: str
    severity: str  # BLOCKED, SEVERED

class SimulationProjection(BaseModel):
    projectedRiskScore: float
    projectedRiskLevel: str
    projectedExposedPopulation: int
    exposedPopulationDelta: int
    projectedSafeCapacity: int
    netCapacityDeficit: int
    projectedOpenCorridors: int
    blockedCorridors: List[BlockedCorridor] = Field(default_factory=list)
    projectedFleetDeficit: int
    projectedClearanceHours: float
    clearanceHoursDelta: float
    evacuationBottlenecks: List[str] = Field(default_factory=list)
    recommendedMitigations: List[str] = Field(default_factory=list)
    safeZoneImpacts: List[SafeZoneImpact] = Field(default_factory=list)
    temporalProgression: List[TemporalStep] = Field(default_factory=list)

class SimulationBaseline(BaseModel):
    locationName: str
    district: str
    totalHabitations: int
    criticalHabitationsCount: int
    totalExposedPopulation: int
    totalSafeCapacity: int
    availableCapacity: int
    capacityUtilization: float
    totalCorridorsCount: int
    openCorridorsCount: int
    availableFleetUnits: int
    estimatedClearanceHours: float
    averageRiskScore: float

class SimulationRunResult(BaseModel):
    id: str
    runAt: str
    locationName: str
    locationDistrict: str
    locationCoordinates: Tuple[float, float]
    scenarioTitle: str
    params: SimulationParameters
    baseline: SimulationBaseline
    projection: SimulationProjection

class ScenarioPreset(BaseModel):
    id: str
    title: str
    description: str
    badge: str
    badgeColor: str
    params: SimulationParameters
