"""
FastAPI route handlers for carrying capacity and safe zones.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from ..schemas.capacity import SafeZoneModel, CapacityAssessmentResponse
from ...services.capacity_service import capacity_service

router = APIRouter(prefix="/capacity", tags=["Carrying Capacity & Safe Zones"])

@router.get("/safe-zones", response_model=List[SafeZoneModel])
def get_safe_zones(district: Optional[str] = Query(None, description="Filter by district")):
    """
    Returns registered safe zones with current occupancy and facilities.
    """
    return capacity_service.list_safe_zones(district=district)

@router.get("/safe-zones/{zone_id}", response_model=SafeZoneModel)
def get_safe_zone(zone_id: str):
    zone = capacity_service.get_safe_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Safe zone not found")
    return zone

@router.get("/assessment", response_model=CapacityAssessmentResponse)
def get_capacity_assessment(
    exposed_population: int = Query(15000, description="Exposed population count to evaluate against shelters")
):
    """
    Evaluates capacity deficits and Sphere Humanitarian Handbook standards.
    """
    return capacity_service.assess_capacity(exposed_population=exposed_population)
