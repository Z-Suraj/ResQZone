"""
Carrying capacity and safe zone schemas based on humanitarian relief standards (Sphere Handbook).
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field

class SafeZoneModel(BaseModel):
    id: str
    name: str
    type: str  # Relief Camp, Stadium, School, Community Hall
    district: str
    state: str
    coordinates: Tuple[float, float]
    safeCapacity: int
    currentOccupancy: int
    availableCapacity: int
    accessibility: str  # GOOD, MODERATE, DIFFICULT
    hazardExposure: str  # NONE, LOW, ADJACENT
    distanceKm: Optional[float] = 0.0
    travelTimeMin: Optional[int] = 0
    facilities: List[str] = Field(default_factory=list)
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    medicalUnitAvailable: bool = True
    powerBackup: bool = True
    status: str = "SAFE"
    calculatedDist: Optional[float] = None
    imageUrl: Optional[str] = None

class SphereStandardsAssessment(BaseModel):
    coveredAreaPerPersonM2: float = 3.5
    drinkingWaterLitersPerPersonPerDay: float = 15.0
    latrinesPerPeopleRatio: int = 20
    requiredMedicalStaffPer1000: int = 2
    isStandardCompliant: bool
    notes: List[str]

class CapacityAssessmentResponse(BaseModel):
    totalShelters: int
    totalSafeCapacity: int
    currentTotalOccupancy: int
    availableCapacity: int
    utilizationRatePercent: float
    deficitBeds: int
    congestedSheltersCount: int
    sphereStandards: SphereStandardsAssessment
    recommendations: List[str]
