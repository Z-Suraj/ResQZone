"""
Carrying Capacity and Safe Zone Relocation Service for RESQZONE.
Implements Sphere Minimum Humanitarian Standards, occupancy tracking,
and shelter congestion balancing.
"""

from typing import List, Dict, Any, Optional
from ..api.schemas.capacity import (
    SafeZoneModel,
    CapacityAssessmentResponse,
    SphereStandardsAssessment,
)
from ..models.database import db

class CapacityService:
    def list_safe_zones(self, district: Optional[str] = None) -> List[SafeZoneModel]:
        results = []
        for zone in db.safe_zones:
            if district and zone.get("district", "").lower() != district.lower():
                continue
            z_dict = dict(zone)
            # Ensure availableCapacity is computed accurately
            z_dict["availableCapacity"] = max(0, z_dict["safeCapacity"] - z_dict["currentOccupancy"])
            results.append(SafeZoneModel(**z_dict))
        return results

    def get_safe_zone_by_id(self, zone_id: str) -> Optional[SafeZoneModel]:
        zones = self.list_safe_zones()
        return next((z for z in zones if z.id == zone_id), None)

    def assess_capacity(self, exposed_population: int = 15000) -> CapacityAssessmentResponse:
        """
        Evaluates regional shelter carrying capacity against exposed populations.
        Computes bed deficits and Sphere humanitarian standards compliance.
        """
        zones = self.list_safe_zones()

        total_shelters = len(zones)
        total_safe_capacity = sum(z.safeCapacity for z in zones)
        current_occupancy = sum(z.currentOccupancy for z in zones)
        available_capacity = max(0, total_safe_capacity - current_occupancy)

        utilization_rate = round((current_occupancy / max(total_safe_capacity, 1)) * 100.0, 1)

        # Deficit calculation: If exposed population exceeds available capacity
        deficit_beds = max(0, exposed_population - available_capacity)

        # Congested shelters (>85% occupancy)
        congested_count = sum(1 for z in zones if (z.currentOccupancy / max(z.safeCapacity, 1)) > 0.85)

        # Sphere Standards Evaluation
        # Benchmark: 3.5 m² per person, 15L water/person/day, 1 latrine per 20 persons
        is_compliant = (deficit_beds == 0) and (congested_count == 0)
        notes = [
            "Covered living space allocated at 3.5 m² per person baseline.",
            f"Potable water supply target: {int(current_occupancy * 15 / 1000)} kL/day across all active enclaves.",
            "Sanitation ratio enforced at 1 toilet per 20 displaced residents.",
        ]
        if deficit_beds > 0:
            notes.append(f"CRITICAL DEFICIT: {deficit_beds} evacuees exceed current shelter mattress inventory.")

        sphere = SphereStandardsAssessment(
            coveredAreaPerPersonM2=3.5,
            drinkingWaterLitersPerPersonPerDay=15.0,
            latrinesPerPeopleRatio=20,
            requiredMedicalStaffPer1000=2,
            isStandardCompliant=is_compliant,
            notes=notes,
        )

        recs = [
            "Mobilize pre-fabricated tent cities at secondary high school fields if occupancy reaches 90%.",
            "Establish auxiliary water purification tankers at Kanchenjunga Stadium and Pipalkoti Enclave.",
            "Coordinate with Indian Red Cross for emergency bedding and hygiene kit replenishment.",
        ]
        if deficit_beds > 0:
            recs.insert(0, f"Activate secondary buffer shelters in neighboring subdistricts to absorb {deficit_beds} deficit evacuees.")

        return CapacityAssessmentResponse(
            totalShelters=total_shelters,
            totalSafeCapacity=total_safe_capacity,
            currentTotalOccupancy=current_occupancy,
            availableCapacity=available_capacity,
            utilizationRatePercent=utilization_rate,
            deficitBeds=deficit_beds,
            congestedSheltersCount=congested_count,
            sphereStandards=sphere,
            recommendations=recs,
        )

capacity_service = CapacityService()
