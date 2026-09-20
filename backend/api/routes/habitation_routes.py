"""
FastAPI route handlers for habitations and demographic exposure analysis.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from ..schemas.habitation import HabitationModel, VulnerabilitySummary
from ...services.habitation_service import habitation_service

router = APIRouter(prefix="/habitations", tags=["Habitations & Demographics"])

@router.get("", response_model=List[HabitationModel])
def get_habitations(district: Optional[str] = Query(None, description="Filter by district")):
    """
    Returns all habitations with computed distance to safe zones and vulnerability scores.
    """
    return habitation_service.list_habitations(district=district)

@router.get("/vulnerability-summary", response_model=VulnerabilitySummary)
def get_vulnerability_summary(district: Optional[str] = Query(None, description="Filter by district")):
    """
    Aggregates demographic exposure (Census 2011 baseline) for EOC disaster planners.
    """
    return habitation_service.get_vulnerability_summary(district=district)

@router.get("/{habitation_id}", response_model=HabitationModel)
def get_habitation(habitation_id: str):
    hab = habitation_service.get_habitation_by_id(habitation_id)
    if not hab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habitation not found")
    return hab
