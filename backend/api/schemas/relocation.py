"""
Relocation engine and multimodal transport fleet schemas.
Covers evacuation trains, emergency buses, rapid rescue vehicles, ambulances, and flood boats.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field
from .common import TransportMode

class FleetItemModel(BaseModel):
    id: str
    type: str  # BUS, TRAIN, CAR, RESCUE_VEHICLE, AMBULANCE, BOAT, AIR
    title: str
    regOrId: str
    capacity: int
    occupied: int
    available: int
    status: str  # AVAILABLE, BOARDING, EN_ROUTE, MAINTENANCE
    pickupLocation: str
    etaMin: int
    routeDescription: str
    equipment: List[str] = Field(default_factory=list)
    imageUrl: Optional[str] = None
    coordinates: Tuple[float, float]

class ConvoyAllocationRequest(BaseModel):
    originSector: str
    destinationSafeZoneId: str
    exposedPopulation: int
    targetEvacuationHours: Optional[float] = 4.0
    preferredModes: Optional[List[str]] = Field(default_factory=lambda: ["BUS", "TRAIN", "RESCUE_VEHICLE"])

class VehicleAllocation(BaseModel):
    vehicleType: str
    unitsAllocated: int
    passengersPerUnit: int
    totalLiftCapacity: int
    tripsRequired: int

class ConvoyPlanResponse(BaseModel):
    originSector: str
    destinationSafeZone: str
    targetPopulation: int
    totalAvailableFleetLift: int
    projectedDurationHours: float
    allocations: List[VehicleAllocation]
    stagingPoints: List[str]
    bottlenecks: List[str]
    ndrfEscortRequired: bool
