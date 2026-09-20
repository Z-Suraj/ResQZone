"""
FastAPI route handlers for GIS and Adaptive SafeRoute routing.
"""

from typing import List
from fastapi import APIRouter
from ..schemas.gis import (
    SafeRouteRequest,
    SafeRouteResponse,
    DistanceMatrixRequest,
    DistanceMatrixResponse,
)
from ...services.gis_service import gis_service

router = APIRouter(prefix="/gis", tags=["GIS & SafeRoute Engine"])

@router.post("/safe-route", response_model=SafeRouteResponse)
def calculate_safe_route(req: SafeRouteRequest):
    """
    Computes an evacuation route adapting to disruptions (road closures, flood surges, shelter congestion).
    """
    return gis_service.evaluate_safe_route(
        origin_coords=req.originCoords,
        location_name=req.locationName or "Current Sector",
        scenario=req.scenario or "NONE",
        target_safe_zone_id=req.targetSafeZoneId,
    )

@router.post("/distance-matrix", response_model=DistanceMatrixResponse)
def calculate_distance_matrix(req: DistanceMatrixRequest):
    """
    Calculates great-circle distances in km from an origin coordinate to multiple destination coordinates.
    """
    dists = gis_service.calculate_distance_matrix(req.origin, req.destinations)
    return DistanceMatrixResponse(distancesKm=dists)
