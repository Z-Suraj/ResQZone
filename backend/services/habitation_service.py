"""
Habitation and Vulnerability Service for RESQZONE.
Analyzes demographic exposure using Census 2011 baseline data, vulnerable populations,
and habitation hazard proximity scoring.
"""

from typing import List, Dict, Any, Optional, Tuple
from ..api.schemas.habitation import HabitationModel, VulnerabilitySummary
from ..api.schemas.common import VulnerabilityLevel
from ..models.database import db
from .gis_service import haversine_distance_km

class HabitationService:
    def list_habitations(self, district: Optional[str] = None) -> List[HabitationModel]:
        """
        Returns all registered habitations with computed distance to nearest/assigned safe zone.
        """
        results = []
        for hab in db.habitations:
            if district and hab.get("district", "").lower() != district.lower():
                continue

            # Calculate distance to assigned safe zone
            assigned_id = hab.get("assignedSafeZoneId")
            assigned_zone = next((z for z in db.safe_zones if z["id"] == assigned_id), None)
            dist_km = None
            if assigned_zone:
                dist_km = haversine_distance_km(
                    hab["coordinates"][0], hab["coordinates"][1],
                    assigned_zone["coordinates"][0], assigned_zone["coordinates"][1]
                )

            # Compute composite risk score for habitation
            # Formula: Soil saturation (35%) + River proximity inverse (25%) + Slope (20%) + Demographics (20%)
            soil_sat = hab.get("soilSaturationIndex", 50.0)
            river_prox = max(hab.get("riverProximityMeters", 500), 10)
            slope = hab.get("slopeAngleDegrees", 10.0)

            # Proximity factor: 100 if <=100m, decaying to 0 at 2000m
            river_factor = max(0.0, min(100.0, (2000.0 - river_prox) / 19.0))
            slope_factor = min(100.0, slope * 2.5)

            composite_score = round((soil_sat * 0.35) + (river_factor * 0.25) + (slope_factor * 0.25) + 15.0, 1)

            hab_dict = dict(hab)
            hab_dict["distanceToSafeZoneKm"] = dist_km
            hab_dict["calculatedRiskScore"] = composite_score

            results.append(HabitationModel(**hab_dict))
        return results

    def get_habitation_by_id(self, hab_id: str) -> Optional[HabitationModel]:
        all_habs = self.list_habitations()
        return next((h for h in all_habs if h.id == hab_id), None)

    def get_vulnerability_summary(self, district: Optional[str] = None) -> VulnerabilitySummary:
        """
        Aggregates demographic exposure for EOC planning.
        """
        habs = self.list_habitations(district=district)

        total_habs = len(habs)
        crit = sum(1 for h in habs if h.vulnerabilityLevel == VulnerabilityLevel.CRITICAL)
        high = sum(1 for h in habs if h.vulnerabilityLevel == VulnerabilityLevel.HIGH)
        mod = sum(1 for h in habs if h.vulnerabilityLevel == VulnerabilityLevel.MODERATE)
        safe = sum(1 for h in habs if h.vulnerabilityLevel == VulnerabilityLevel.LOW)

        tot_pop = sum(h.population for h in habs)
        children = sum(h.children0_6 for h in habs)
        elderly = sum(h.elderly60Plus or 0 for h in habs)

        # Immediate evacuations recommended for critical habitations
        immediate_evac = sum(h.population for h in habs if h.vulnerabilityLevel == VulnerabilityLevel.CRITICAL)

        return VulnerabilitySummary(
            totalHabitations=total_habs,
            criticalHabitations=crit,
            highRiskHabitations=high,
            moderateRiskHabitations=mod,
            safeHabitations=safe,
            totalExposedPopulation=tot_pop,
            vulnerableChildren=children,
            vulnerableElderly=elderly,
            recommendedImmediateEvacuations=immediate_evac,
        )

habitation_service = HabitationService()
