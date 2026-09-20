"""
FastAPI route handlers for hazard red-zones and risk evaluation.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from ..schemas.hazard import HazardAreaModel, RiskEvaluationRequest, RiskEvaluationResponse
from ...services.hazard_service import hazard_service

router = APIRouter(prefix="/hazards", tags=["Hazards & Risk"])

@router.get("", response_model=List[HazardAreaModel])
def get_hazards(
    lat: Optional[float] = Query(None, description="Center latitude for proximity filter"),
    lon: Optional[float] = Query(None, description="Center longitude for proximity filter"),
    radius_km: Optional[float] = Query(35.0, description="Radius in km"),
):
    """
    Returns active hazard zones. Can optionally filter within radius_km of coordinates.
    """
    if lat is not None and lon is not None:
        return hazard_service.get_hazards_near_coordinates(lat, lon, radius_km or 35.0)
    return hazard_service.list_hazards()

@router.post("/evaluate-risk", response_model=RiskEvaluationResponse)
def evaluate_risk(req: RiskEvaluationRequest):
    """
    Computes real-time risk score and emergency threshold alarms.
    """
    return hazard_service.evaluate_risk(req)
