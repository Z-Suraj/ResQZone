"""
FastAPI route handlers for early warning broadcasts.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, status
from ..schemas.alert import AlertModel, AlertBroadcastRequest
from ...services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts & Early Warning"])

@router.get("", response_model=List[AlertModel])
def get_alerts(
    active_only: bool = Query(True, description="Only active alerts"),
    district: Optional[str] = Query(None, description="Filter by affected district"),
):
    """
    Returns active multi-hazard alerts.
    """
    return alert_service.list_alerts(active_only=active_only, district=district)

@router.post("/broadcast", response_model=AlertModel, status_code=status.HTTP_201_CREATED)
def broadcast_alert(req: AlertBroadcastRequest):
    """
    Broadcasts a new CAP-compliant early warning advisory from the EOC.
    """
    return alert_service.broadcast_alert(req)
