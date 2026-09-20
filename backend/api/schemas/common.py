"""
Common data types and enums used across the RESQZONE Python backend.
Designed to be beginner-friendly, clean, and directly mapped to the disaster management domain.
"""

from enum import Enum
from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    SAFE = "SAFE"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class VulnerabilityLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    VERIFIED = "VERIFIED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class TransportMode(str, Enum):
    FOOT = "FOOT"
    CAR = "CAR"
    BUS = "BUS"
    TRAIN = "TRAIN"
    BOAT = "BOAT"
    AIR = "AIR"

class RouteRisk(str, Enum):
    SAFE = "SAFE"
    CAUTION = "CAUTION"
    HIGH_RISK = "HIGH_RISK"

class AlertSeverity(str, Enum):
    INFO = "INFO"
    ADVISORY = "ADVISORY"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class Coordinate(BaseModel):
    lat: float
    lon: float

class StatusResponse(BaseModel):
    status: str
    message: str
    timestamp: Optional[str] = None
