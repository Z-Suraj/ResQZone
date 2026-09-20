"""
Habitation schemas representing Indian villages, wards, and settlements with Census 2011 baseline data.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field
from .common import VulnerabilityLevel

class HabitationModel(BaseModel):
    id: str
    name: str
    district: str
    state: str
    subdistrict: Optional[str] = None
    level: str  # village, town, ward
    ruralUrban: str  # Rural, Urban
    households: int
    population: int
    malePopulation: int
    femalePopulation: int
    children0_6: int
    elderly60Plus: Optional[int] = 0
    personsWithDisabilities: Optional[int] = 0
    scPopulation: Optional[int] = 0
    stPopulation: Optional[int] = 0
    coordinates: Tuple[float, float]
    vulnerabilityLevel: VulnerabilityLevel
    primaryThreat: str
    soilSaturationIndex: Optional[float] = 0.0
    riverProximityMeters: Optional[int] = 0
    slopeAngleDegrees: Optional[float] = 0.0
    recommendedAction: str
    assignedSafeZoneId: Optional[str] = None
    distanceToSafeZoneKm: Optional[float] = None
    calculatedRiskScore: Optional[float] = None

class VulnerabilitySummary(BaseModel):
    totalHabitations: int
    criticalHabitations: int
    highRiskHabitations: int
    moderateRiskHabitations: int
    safeHabitations: int
    totalExposedPopulation: int
    vulnerableChildren: int
    vulnerableElderly: int
    recommendedImmediateEvacuations: int
