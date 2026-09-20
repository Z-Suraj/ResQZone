"""
Hazard and Risk Assessment Service for RESQZONE.
Implements multi-attribute spatial risk evaluation, threshold alert calculations,
and red-zone proximity filtering.
"""

from typing import List, Dict, Any, Optional, Tuple
from ..api.schemas.hazard import (
    HazardAreaModel,
    RiskEvaluationRequest,
    RiskEvaluationResponse,
)
from ..api.schemas.common import RiskLevel, RouteRisk
from ..models.database import db
from .gis_service import haversine_distance_km

class HazardService:
    def __init__(self):
        self.last_alert_level: RiskLevel = RiskLevel.HIGH

    def list_hazards(self, sector_id: Optional[str] = None) -> List[HazardAreaModel]:
        """
        Returns active hazard zones from the database.
        """
        return [HazardAreaModel(**h) for h in db.hazards]

    def get_hazards_near_coordinates(
        self, lat: float, lon: float, radius_km: float = 35.0
    ) -> List[HazardAreaModel]:
        """
        Filters active red zones within radius_km of given coordinates.
        """
        results = []
        for h in db.hazards:
            c = h["center"]
            dist = haversine_distance_km(lat, lon, c[0], c[1])
            if dist <= radius_km:
                results.append(HazardAreaModel(**h))
        return results

    def evaluate_risk(self, req: RiskEvaluationRequest) -> RiskEvaluationResponse:
        """
        Core ResQZone risk formula:
        Combines hazard severity weight, sensor trends, route accessibility, and capacity stress.
        Enforces strict threshold alarm rules: CRITICAL only for emergency sirens/vibrations.
        """
        score = 0.0

        # 1. Hazard severity weight
        if req.hazardSeverity == RiskLevel.CRITICAL:
            score += 50.0
        elif req.hazardSeverity == RiskLevel.HIGH:
            score += 35.0
        elif req.hazardSeverity == RiskLevel.MODERATE:
            score += 20.0
        else:
            score += 5.0

        # 2. Sensor trend
        if req.sensorTrend == "ESCALATING":
            score += 25.0
        elif req.sensorTrend == "DECREASING":
            score -= 10.0

        # 3. Route corridor accessibility
        if req.routeRisk == RouteRisk.HIGH_RISK:
            score += 15.0
        elif req.routeRisk == RouteRisk.CAUTION:
            score += 8.0

        # 4. Safe zone capacity constraint
        if req.safeZoneCapacityRatio and req.safeZoneCapacityRatio > 0.9:
            score += 10.0

        # Map to Risk Level
        if score >= 80.0:
            level = RiskLevel.CRITICAL
        elif score >= 50.0:
            level = RiskLevel.HIGH
        elif score >= 30.0:
            level = RiskLevel.MODERATE
        else:
            level = RiskLevel.SAFE

        is_escalation = (level in [RiskLevel.CRITICAL, RiskLevel.HIGH]) and (self.last_alert_level != level)
        self.last_alert_level = level

        if level == RiskLevel.CRITICAL:
            return RiskEvaluationResponse(
                riskLevel=RiskLevel.CRITICAL,
                alertType="EMERGENCY_ALARM",
                message="CRITICAL EMERGENCY: Severe flash flood threat. Immediate relocation required.",
                badgeText="CRITICAL ALERT",
                badgeColorClass="bg-rose-600 text-white border-rose-500 shadow-rose-600/50",
                requiresEmergencyAttention=True,
                canVibrate=is_escalation,
                recommendedAction="Evacuate immediately via designated SafeRoute corridor. Seek elevated shelter.",
                calculatedScore=score,
            )
        elif level == RiskLevel.HIGH:
            return RiskEvaluationResponse(
                riskLevel=RiskLevel.HIGH,
                alertType="WARNING",
                message="HIGH RISK: Flood or landslide risk elevated near your area. Monitor alerts and prepare for movement.",
                badgeText="HIGH RISK",
                badgeColorClass="bg-amber-600 text-white border-amber-500 shadow-amber-600/40",
                requiresEmergencyAttention=False,
                canVibrate=is_escalation,
                recommendedAction="Avoid river banks and steep saturated hillslopes. Review your Adaptive SafeRoute.",
                calculatedScore=score,
            )
        elif level == RiskLevel.MODERATE:
            return RiskEvaluationResponse(
                riskLevel=RiskLevel.MODERATE,
                alertType="ADVISORY",
                message="MODERATE ADVISORY: Elevated river discharge observed. Stay alert for official weather bulletins.",
                badgeText="MODERATE",
                badgeColorClass="bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
                requiresEmergencyAttention=False,
                canVibrate=False,
                recommendedAction="Keep emergency contacts handy and monitor local CWC/IMD forecasts.",
                calculatedScore=score,
            )
        else:
            return RiskEvaluationResponse(
                riskLevel=RiskLevel.SAFE,
                alertType="STATUS_NORMAL",
                message="NORMAL: No active hazard escalation in this sector. Routes are clear.",
                badgeText="SAFE ZONE",
                badgeColorClass="bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                requiresEmergencyAttention=False,
                canVibrate=False,
                recommendedAction="All regional transit corridors operating normally.",
                calculatedScore=score,
            )

hazard_service = HazardService()
