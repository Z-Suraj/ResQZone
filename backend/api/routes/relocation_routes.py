"""
FastAPI route handlers for relocation engine and multimodal transit fleet.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from ..schemas.relocation import FleetItemModel, ConvoyAllocationRequest, ConvoyPlanResponse
from ...services.relocation_service import relocation_service

router = APIRouter(prefix="/relocation", tags=["Relocation & Multimodal Fleet"])

@router.get("/fleet", response_model=List[FleetItemModel])
def get_fleet(status: Optional[str] = Query(None, description="Filter by status: AVAILABLE, BOARDING, EN_ROUTE")):
    """
    Returns live multimodal fleet tracking (emergency buses, trains, boats, ambulances).
    """
    return relocation_service.list_fleet(status=status)

@router.post("/plan", response_model=ConvoyPlanResponse)
def plan_convoy(req: ConvoyAllocationRequest):
    """
    Computes optimal convoy vehicle allocations to evacuate exposed populations.
    """
    return relocation_service.plan_convoy(req)
