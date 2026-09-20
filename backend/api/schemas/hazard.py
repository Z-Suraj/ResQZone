"""
Hazard schemas for red zones, flood levels, landslide zones, and risk evaluation.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field
from .common import RiskLevel, RouteRisk

class HazardAreaModel(BaseModel):
    id: str
    name: str
    type: str  # Flash Flood, Landslide, Riverine Flood, Cloudburst
    severity: RiskLevel
    riskScore: float
    affectedAreaSqKm: float
    affectedPopulation: int
    affectedHabitationsCount: int
    center: Tuple[float, float]
    polygonPoints: List[Tuple[float, float]]
    recommendedAction: str
    reportedTime: Optional[str] = None
    description: str
    imageUrl: Optional[str] = None

class RiskEvaluationRequest(BaseModel):
    hazardSeverity: RiskLevel
    populationExposure: Optional[int] = 0
    vulnerability: Optional[str] = "MODERATE"
    routeRisk: Optional[RouteRisk] = RouteRisk.SAFE
    safeZoneCapacityRatio: Optional[float] = 0.5
    sensorTrend: Optional[str] = "STABLE"  # ESCALATING, STABLE, DECREASING

class RiskEvaluationResponse(BaseModel):
    riskLevel: RiskLevel
    alertType: str
    message: str
    badgeText: str
    badgeColorClass: str
    requiresEmergencyAttention: bool = Field(default=False, alias="requiresEmergencyAttention")
    canVibrate: bool = Field(default=False, alias="canVibrate")
    recommendedAction: str
    calculatedScore: float

    class Config:
        populate_by_name = True
