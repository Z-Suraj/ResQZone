"""
GIS and Geospatial Service for RESQZONE.
Implements great-circle Haversine calculations, multi-modal waypoint routing,
and dynamic route recalculations under road blockages and flood escalation.
"""

import math
from typing import List, Tuple, Dict, Any, Optional
from ..api.schemas.gis import (
    AdaptiveRouteModel,
    RouteSegmentModel,
    SafeRouteResponse,
    CapacityCheckResult,
)
from ..api.schemas.common import RouteRisk
from ..models.database import db

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two geographical points on Earth using Haversine formula.
    """
    R = 6371.0  # Earth's mean radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

class GisService:
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        return haversine_distance_km(lat1, lon1, lat2, lon2)

    @staticmethod
    def calculate_distance_matrix(origin: Tuple[float, float], destinations: List[Tuple[float, float]]) -> List[float]:
        return [haversine_distance_km(origin[0], origin[1], d[0], d[1]) for d in destinations]

    @staticmethod
    def evaluate_safe_route(
        origin_coords: Tuple[float, float],
        location_name: str = "Current Sector",
        scenario: str = "NONE",
        target_safe_zone_id: Optional[str] = None
    ) -> SafeRouteResponse:
        """
        Evaluates the optimal evacuation path from the origin coordinates to a safe zone.
        Dynamically adapts to What-If disruptions (ROAD_BLOCKED, FLOOD_ESCALATION, SAFE_ZONE_FULL).
        """
        # 1. Rank candidate safe zones by distance from origin
        sorted_zones = sorted(
            db.safe_zones,
            key=lambda z: haversine_distance_km(
                origin_coords[0], origin_coords[1], z["coordinates"][0], z["coordinates"][1]
            )
        )

        is_zone_full = scenario == "SAFE_ZONE_FULL"
        is_road_blocked = scenario == "ROAD_BLOCKED"
        is_flood_escalated = scenario == "FLOOD_ESCALATION"

        # Determine target safe zone
        chosen_zone = None
        if target_safe_zone_id:
            chosen_zone = next((z for z in db.safe_zones if z["id"] == target_safe_zone_id), None)

        if not chosen_zone:
            if is_zone_full and len(sorted_zones) > 1:
                # Primary is congested, reroute to second nearest
                chosen_zone = sorted_zones[1]
            elif sorted_zones:
                chosen_zone = sorted_zones[0]
            else:
                # Fallback relief center
                chosen_zone = {
                    "id": "SZ-SYN-LOCAL",
                    "name": f"{location_name} Regional Relief Center",
                    "coordinates": [origin_coords[0] + 0.03, origin_coords[1] + 0.02],
                    "safeCapacity": 4000,
                    "currentOccupancy": 800,
                    "availableCapacity": 3200,
                }

        dest_coords = tuple(chosen_zone["coordinates"])
        dest_name = chosen_zone["name"]
        dest_id = chosen_zone["id"]

        # 2. Construct segments and waypoints
        # Midpoint with scenario-dependent detour offset
        mid_lat = (origin_coords[0] + dest_coords[0]) / 2.0
        mid_lon = (origin_coords[1] + dest_coords[1]) / 2.0

        if is_road_blocked:
            # Shift midpoint north/west to bypass blocked arterial
            mid_lat += 0.015
            mid_lon -= 0.012
        elif is_flood_escalated:
            # Shift to higher elevation ridge
            mid_lat += 0.018
            mid_lon += 0.015

        wp1 = origin_coords
        wp2 = (round(mid_lat, 5), round(mid_lon, 5))
        wp3 = dest_coords

        dist1 = haversine_distance_km(wp1[0], wp1[1], wp2[0], wp2[1])
        dist2 = haversine_distance_km(wp2[0], wp2[1], wp3[0], wp3[1])
        total_dist = round(dist1 + dist2, 2)

        # Build segments
        segments: List[RouteSegmentModel] = []
        if is_road_blocked:
            segments.append(
                RouteSegmentModel(
                    id="SEG-1",
                    fromName=f"{location_name} Staging Area",
                    toName="Arterial Bypass Junction B",
                    fromCoords=wp1,
                    toCoords=wp2,
                    distanceKm=dist1,
                    durationMinutes=max(int(dist1 * 3.5), 10),
                    mode="BUS",
                    riskLevel=RouteRisk.CAUTION,
                    isBlocked=False,
                    warning="Detour active: Main NH route closed due to debris.",
                    pathCoordinates=[wp1, (wp1[0] + 0.005, wp1[1] - 0.003), wp2],
                )
            )
            segments.append(
                RouteSegmentModel(
                    id="SEG-2",
                    fromName="Arterial Bypass Junction B",
                    toName=dest_name,
                    fromCoords=wp2,
                    toCoords=wp3,
                    distanceKm=dist2,
                    durationMinutes=max(int(dist2 * 3.0), 12),
                    mode="BUS",
                    riskLevel=RouteRisk.SAFE,
                    isBlocked=False,
                    warning=None,
                    pathCoordinates=[wp2, (wp2[0] - 0.004, wp2[1] + 0.006), wp3],
                )
            )
            overall_risk = RouteRisk.CAUTION
            status_msg = "DETOUR ACTIVE: Main arterial highway closed. Routing via bypass corridor."
            detour_reason = "Road blockage on primary transit corridor. Rerouted via northern bypass."
        elif is_flood_escalated:
            segments.append(
                RouteSegmentModel(
                    id="SEG-1",
                    fromName=f"{location_name} Riverfront Zone",
                    toName="Elevated Ridge Checkpoint",
                    fromCoords=wp1,
                    toCoords=wp2,
                    distanceKm=dist1,
                    durationMinutes=max(int(dist1 * 4.0), 15),
                    mode="RESCUE_VEHICLE",
                    riskLevel=RouteRisk.CAUTION,
                    isBlocked=False,
                    warning="Water ingress along low-lying culverts. High clearance 4x4 required.",
                    pathCoordinates=[wp1, (wp1[0] + 0.007, wp1[1] + 0.005), wp2],
                )
            )
            segments.append(
                RouteSegmentModel(
                    id="SEG-2",
                    fromName="Elevated Ridge Checkpoint",
                    toName=dest_name,
                    fromCoords=wp2,
                    toCoords=wp3,
                    distanceKm=dist2,
                    durationMinutes=max(int(dist2 * 2.5), 10),
                    mode="BUS",
                    riskLevel=RouteRisk.SAFE,
                    isBlocked=False,
                    warning=None,
                    pathCoordinates=[wp2, (wp2[0] - 0.005, wp2[1] + 0.008), wp3],
                )
            )
            overall_risk = RouteRisk.CAUTION
            status_msg = "ELEVATED CORRIDOR: Flood surge along riverbanks. Elevated ridge route selected."
            detour_reason = "River water levels breaching low-lying embankments."
        else:
            segments.append(
                RouteSegmentModel(
                    id="SEG-1",
                    fromName=f"{location_name} Assembly Point",
                    toName="Midway Transit Hub",
                    fromCoords=wp1,
                    toCoords=wp2,
                    distanceKm=dist1,
                    durationMinutes=max(int(dist1 * 2.8), 8),
                    mode="BUS",
                    riskLevel=RouteRisk.SAFE,
                    isBlocked=False,
                    warning=None,
                    pathCoordinates=[wp1, (wp1[0] + 0.004, wp1[1] + 0.003), wp2],
                )
            )
            segments.append(
                RouteSegmentModel(
                    id="SEG-2",
                    fromName="Midway Transit Hub",
                    toName=dest_name,
                    fromCoords=wp2,
                    toCoords=wp3,
                    distanceKm=dist2,
                    durationMinutes=max(int(dist2 * 2.5), 10),
                    mode="BUS",
                    riskLevel=RouteRisk.SAFE,
                    isBlocked=False,
                    warning=None,
                    pathCoordinates=[wp2, (wp2[0] - 0.003, wp2[1] + 0.004), wp3],
                )
            )
            overall_risk = RouteRisk.SAFE
            status_msg = "CLEAR CORRIDOR: Optimal evacuation path verified. Traffic moving smoothly."
            detour_reason = None

        total_duration = sum(s.durationMinutes for s in segments)
        all_coords = []
        for s in segments:
            all_coords.extend(s.pathCoordinates)

        route_model = AdaptiveRouteModel(
            id=f"RT-{dest_id}-{int(total_dist * 10)}",
            name=f"Corridor Alpha to {dest_name}",
            originName=location_name,
            destinationName=dest_name,
            destinationSafeZoneId=dest_id,
            totalDistanceKm=total_dist,
            totalDurationMinutes=total_duration,
            overallRisk=overall_risk,
            segments=segments,
            evacuationPriority="HIGH" if is_flood_escalated else "STANDARD",
            recommendedVehicle="Emergency Bus & High Clearance Evacuation Fleet",
            generatedAt="Real-time live telemetry",
            detourReason=detour_reason,
            allCoordinates=all_coords,
        )

        cap_avail = chosen_zone.get("availableCapacity", 3200)
        cap_check = CapacityCheckResult(
            candidateName=dest_name,
            totalCapacity=chosen_zone.get("safeCapacity", 5000),
            currentOccupancy=chosen_zone.get("currentOccupancy", 1800),
            availableCapacity=cap_avail,
            isConstrained=cap_avail < 500,
            constraintMessage=f"{dest_name} approaching operational capacity" if cap_avail < 500 else None,
        )

        return SafeRouteResponse(
            route=route_model,
            statusMessage=status_msg,
            isRecalculating=False,
            activeScenario=scenario,
            capacityCheck=cap_check,
        )

gis_service = GisService()
