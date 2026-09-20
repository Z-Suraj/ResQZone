"""
Alert schemas for multi-hazard early warning broadcasts (CAP compliant).
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field
from .common import AlertSeverity

class AlertModel(BaseModel):
    id: str
    title: str
    severity: AlertSeverity
    source: str
    targetArea: str
    affectedDistricts: List[str] = Field(default_factory=list)
    coordinates: Optional[Tuple[float, float]] = None
    issuedAt: str
    expiresAt: str
    description: str
    instructions: str
    active: bool = True
    verified: bool = True
    sourceAgency: Optional[str] = "NDRF / IMD / CWC"

class AlertBroadcastRequest(BaseModel):
    title: str
    severity: AlertSeverity
    targetArea: str
    affectedDistricts: List[str]
    description: str
    instructions: str
    expiresInHours: int = 6
