"""
AI Copilot schemas for command center decision support and citizen guidance.
"""

from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel, Field

class CopilotContext(BaseModel):
    userRole: Optional[str] = "AUTHORITY"  # CITIZEN or AUTHORITY
    locationName: Optional[str] = "Selected Sector"
    district: Optional[str] = None
    state: Optional[str] = None
    riskLevel: Optional[str] = "HIGH"
    activeHazardsCount: Optional[int] = 2
    criticalHabitationsCount: Optional[int] = 4
    exposedPopulation: Optional[int] = 12500
    availableBeds: Optional[int] = 3400
    nearestSafeZone: Optional[str] = "District Emergency Relief Complex"
    riverLevelStatus: Optional[str] = "+1.4m above warning mark"
    recentIncidents: Optional[List[str]] = Field(default_factory=list)

class CopilotQueryRequest(BaseModel):
    message: str
    context: Optional[CopilotContext] = None

class ActionItem(BaseModel):
    title: str
    description: str
    priority: str  # IMMEDIATE, HIGH, MEDIUM
    agency: str

class CopilotQueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[str]
    suggestedActions: List[ActionItem]
    reasoning: str
    intentDetected: str
    structuredData: Optional[Dict[str, Any]] = None

class QuickPrompt(BaseModel):
    id: str
    label: str
    query: str
    category: str  # SITUATION, ROUTE, CAPACITY, HABITATIONS, SOP
