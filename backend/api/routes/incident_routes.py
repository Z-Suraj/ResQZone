"""
FastAPI route handlers for incidents and citizen rescue requests.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from ..schemas.incident import (
    IncidentModel,
    IncidentCreate,
    RescueRequestModel,
    RescueRequestCreate,
)
from ..schemas.common import IncidentStatus
from ...services.incident_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents & Rescue Desk"])

@router.get("", response_model=List[IncidentModel])
def get_incidents(status_filter: Optional[str] = Query(None, alias="status")):
    """
    Returns verified and reported disaster incidents.
    """
    return incident_service.list_incidents(status=status_filter)

@router.post("", response_model=IncidentModel, status_code=status.HTTP_201_CREATED)
def create_incident(req: IncidentCreate):
    """
    Submits a new disaster incident report into the triage queue.
    """
    return incident_service.create_incident(req)

@router.patch("/{incident_id}/status", response_model=IncidentModel)
def update_incident_status(
    incident_id: str,
    new_status: IncidentStatus = Query(..., description="Target status"),
    assigned_unit: Optional[str] = Query(None, description="Dispatched team name"),
):
    """
    Updates incident status through verification lifecycle (REPORTED -> VERIFIED -> IN_PROGRESS -> RESOLVED).
    """
    updated = incident_service.update_incident_status(incident_id, new_status, assigned_unit)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return updated

@router.get("/rescue-requests", response_model=List[RescueRequestModel])
def get_rescue_requests():
    """
    Returns active citizen emergency SOS rescue requests.
    """
    return incident_service.list_rescue_requests()

@router.post("/rescue-requests", response_model=RescueRequestModel, status_code=status.HTTP_201_CREATED)
def create_rescue_request(req: RescueRequestCreate):
    """
    Submits a citizen emergency rescue request.
    """
    return incident_service.create_rescue_request(req)
