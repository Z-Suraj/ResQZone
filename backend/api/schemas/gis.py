"""
GIS and Adaptive SafeRoute schemas.
Provides multi-modal waypoint routing, blockage detours, and distance calculations.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field
from .common import TransportMode, RouteRisk

class RouteSegmentModel(BaseModel):
    id: str
    fromName: str
    toName: str
    fromCoords: Tuple[float, float]
    toCoords: Tuple[float, float]
    distanceKm: float
    durationMinutes: int
    mode: str  # FOOT, CAR, BUS, TRAIN, BOAT, AIR
    riskLevel: RouteRisk
    isBlocked: bool = False
    warning: Optional[str] = None
    pathCoordinates: List[Tuple[float, float]] = Field(default_factory=list)

class AdaptiveRouteModel(BaseModel):
    id: str
    name: str
    originName: str
    destinationName: str
    destinationSafeZoneId: str
    totalDistanceKm: float
    totalDurationMinutes: int
    overallRisk: RouteRisk
    segments: List[RouteSegmentModel]
    evacuationPriority: str
    recommendedVehicle: str
    generatedAt: str
    detourReason: Optional[str] = None
    allCoordinates: List[Tuple[float, float]] = Field(default_factory=list)

class SafeRouteRequest(BaseModel):
    originCoords: Tuple[float, float]
    locationName: Optional[str] = "Current Sector"
    scenario: Optional[str] = "NONE"  # NONE, ROAD_BLOCKED, FLOOD_ESCALATION, SAFE_ZONE_FULL, BUS_UNAVAILABLE, RAILWAY_UNAVAILABLE
    targetSafeZoneId: Optional[str] = None

class CapacityCheckResult(BaseModel):
    candidateName: str
    totalCapacity: int
    currentOccupancy: int
    availableCapacity: int
    isConstrained: bool
    constraintMessage: Optional[str] = None

class SafeRouteResponse(BaseModel):
    route: AdaptiveRouteModel
    previousRoute: Optional[AdaptiveRouteModel] = None
    statusMessage: str
    isRecalculating: bool = False
    activeScenario: str = "NONE"
    capacityCheck: CapacityCheckResult

class DistanceMatrixRequest(BaseModel):
    origin: Tuple[float, float]
    destinations: List[Tuple[float, float]]

class DistanceMatrixResponse(BaseModel):
    distancesKm: List[float]
