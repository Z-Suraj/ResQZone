"""
Incident management and citizen rescue request schemas.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field
from .common import IncidentStatus

class PeopleCount(BaseModel):
    adults: int = 1
    children: int = 0
    elderlyOrSpecialCare: int = 0

class RescueRequestModel(BaseModel):
    id: str
    userId: Optional[str] = None
    requesterName: str
    contactPhone: str
    locationName: str
    coordinates: Tuple[float, float]
    peopleCount: PeopleCount
    urgency: str  # CRITICAL_IMMEDIATE, HIGH_TRAPPED, PRECAUTIONARY
    emergencyType: Optional[str] = "Rescue"  # Medical, Rescue, Evacuation, Other
    message: str
    imageUrl: Optional[str] = None
    submittedAt: str
    status: str = "SUBMITTED"  # SUBMITTED, RESPONSE_DISPATCHED, EN_ROUTE, ON_SCENE, RESCUED
    assignedTeam: Optional[str] = None
    estimatedArrivalMinutes: Optional[int] = None

class RescueRequestCreate(BaseModel):
    requesterName: str
    contactPhone: str
    locationName: str
    coordinates: Tuple[float, float]
    peopleCount: PeopleCount
    urgency: str = "CRITICAL_IMMEDIATE"
    emergencyType: Optional[str] = "Rescue"
    message: str
    imageUrl: Optional[str] = None

class IncidentModel(BaseModel):
    id: str
    title: str
    type: str  # Landslide, Flash Flood, Road Blockage, Structural Collapse, Trapped Civilians
    severity: str  # LOW, MODERATE, HIGH, CRITICAL
    location: str
    coordinates: Tuple[float, float]
    reportedAt: str
    status: IncidentStatus = IncidentStatus.REPORTED
    description: str
    reportedBy: str
    verified: bool = False
    casualties: Optional[int] = 0
    affectedPeople: Optional[int] = 0
    assignedUnit: Optional[str] = None
    imageUrl: Optional[str] = None

class IncidentCreate(BaseModel):
    title: str
    type: str
    severity: str
    location: str
    coordinates: Tuple[float, float]
    description: str
    reportedBy: str
    imageUrl: Optional[str] = None
