"""
What-If Simulation Sandbox Service for RESQZONE.
Models non-destructive hazard stress-tests: monsoon surges, bridge failures,
demographic spikes, fleet contractions, and temporal evacuation progressions.
"""

from typing import List, Dict, Any, Optional, Tuple
import time
import math
from ..api.schemas.simulation import (
    SimulationParameters,
    SimulationRunResult,
    SimulationBaseline,
    SimulationProjection,
    SafeZoneImpact,
    TemporalStep,
    BlockedCorridor,
    ScenarioPreset,
)
from ..models.database import db

PRESETS: List[ScenarioPreset] = [
    ScenarioPreset(
        id="monsoon_surge",
        title="Monsoon Cloudburst (+40% Rain)",
        description="Sudden precipitation surge inundating low-lying settlements and blocking 2 arterial bypass corridors.",
        badge="SEVERE RAINFALL",
        badgeColor="bg-blue-500/20 text-blue-400 border-blue-500/30",
        params=SimulationParameters(
            rainfallPercent=40.0,
            hazardMultiplier=1.35,
            populationSurgePercent=25.0,
            closedRoadsCount=2,
            railwayClosed=False,
            safeZoneCapacityDeltaPercent=0.0,
            availableFleetDeltaPercent=-10.0,
            evacuationUrgencySurge=True,
        ),
    ),
    ScenarioPreset(
        id="cyclone_storm_surge",
        title="Estuarine Storm Surge (+80% Rain & Flood)",
        description="High tidal bore and torrential winds compromising waterfront shelters and cutting railway logistics.",
        badge="CYCLONE TIDE",
        badgeColor="bg-rose-500/20 text-rose-400 border-rose-500/30",
        params=SimulationParameters(
            rainfallPercent=80.0,
            hazardMultiplier=1.75,
            populationSurgePercent=55.0,
            closedRoadsCount=3,
            railwayClosed=True,
            safeZoneCapacityDeltaPercent=-25.0,
            availableFleetDeltaPercent=-30.0,
            evacuationUrgencySurge=True,
        ),
    ),
    ScenarioPreset(
        id="lifeline_collapse",
        title="Critical Bridge & Arterial Severance",
        description="Major arterial bridge failure isolating primary evacuation route; fleet rerouted through rural narrow bypasses.",
        badge="INFRASTRUCTURE COLLAPSE",
        badgeColor="bg-amber-500/20 text-amber-400 border-amber-500/30",
        params=SimulationParameters(
            rainfallPercent=15.0,
            hazardMultiplier=1.2,
            populationSurgePercent=10.0,
            closedRoadsCount=4,
            railwayClosed=True,
            safeZoneCapacityDeltaPercent=-10.0,
            availableFleetDeltaPercent=-40.0,
            evacuationUrgencySurge=True,
        ),
    ),
]

class SimulationService:
    def list_presets(self) -> List[ScenarioPreset]:
        return PRESETS

    def run_simulation(
        self,
        params: SimulationParameters,
        location_id: Optional[str] = "LOC-SILIGURI",
        scenario_title: str = "Custom What-If Scenario",
    ) -> SimulationRunResult:
        loc = db.locations.get(location_id, db.locations["LOC-SILIGURI"])
        loc_name = loc["name"]
        loc_district = loc["district"]
        loc_coords = tuple(loc["coordinates"])

        # 1. Baseline statistics
        base_pop = sum(h["population"] for h in db.habitations)
        base_safe_cap = sum(z["safeCapacity"] for z in db.safe_zones)
        base_occ = sum(z["currentOccupancy"] for z in db.safe_zones)
        base_avail_cap = max(0, base_safe_cap - base_occ)

        baseline = SimulationBaseline(
            locationName=loc_name,
            district=loc_district,
            totalHabitations=len(db.habitations),
            criticalHabitationsCount=sum(1 for h in db.habitations if h.get("vulnerabilityLevel") == "CRITICAL"),
            totalExposedPopulation=base_pop,
            totalSafeCapacity=base_safe_cap,
            availableCapacity=base_avail_cap,
            capacityUtilization=round((base_occ / max(base_safe_cap, 1)) * 100.0, 1),
            totalCorridorsCount=4,
            openCorridorsCount=4,
            availableFleetUnits=35,
            estimatedClearanceHours=4.5,
            averageRiskScore=7.2,
        )

        # 2. Compute Projected Parameters
        rain_mult = 1.0 + (params.rainfallPercent / 100.0)
        pop_surge_mult = 1.0 + (params.populationSurgePercent / 100.0)
        cap_delta_mult = 1.0 + (params.safeZoneCapacityDeltaPercent / 100.0)
        fleet_delta_mult = 1.0 + (params.availableFleetDeltaPercent / 100.0)

        proj_risk_score = min(10.0, round(baseline.averageRiskScore * params.hazardMultiplier * (0.8 + 0.2 * rain_mult), 1))
        proj_risk_level = "CRITICAL" if proj_risk_score >= 8.5 else ("HIGH" if proj_risk_score >= 6.5 else "MODERATE")

        proj_exposed_pop = int(base_pop * pop_surge_mult)
        exposed_delta = proj_exposed_pop - base_pop

        proj_safe_cap = int(base_safe_cap * cap_delta_mult)
        proj_avail_cap = max(0, proj_safe_cap - base_occ)
        net_deficit = max(0, proj_exposed_pop - proj_avail_cap)

        open_corridors = max(0, baseline.totalCorridorsCount - params.closedRoadsCount)
        blocked_list: List[BlockedCorridor] = []
        if params.closedRoadsCount >= 1:
            blocked_list.append(BlockedCorridor(name="NH Arterial Bridge Axis", reason="Water level 0.8m over deck slab", severity="BLOCKED"))
        if params.closedRoadsCount >= 2:
            blocked_list.append(BlockedCorridor(name="Riverfront Lowland Bypass", reason="Mudflow and rockfall debris", severity="BLOCKED"))
        if params.closedRoadsCount >= 3:
            blocked_list.append(BlockedCorridor(name="Subdistrict Link Road East", reason="Culvert embankment collapse", severity="SEVERED"))
        if params.railwayClosed:
            blocked_list.append(BlockedCorridor(name="Regional Evacuation Rail Track", reason="Track ballast washout near km 42", severity="SEVERED"))

        # Clearance Hours
        speed_factor = max(0.3, (open_corridors / max(baseline.totalCorridorsCount, 1)))
        fleet_factor = max(0.4, fleet_delta_mult)
        proj_clearance = round(baseline.estimatedClearanceHours * pop_surge_mult / (speed_factor * fleet_factor), 1)
        clearance_delta = round(proj_clearance - baseline.estimatedClearanceHours, 1)

        # Fleet deficit
        needed_buses = math.ceil(proj_exposed_pop / 50.0 / 3.0)  # 3 trips per bus
        avail_buses = int(baseline.availableFleetUnits * fleet_factor)
        fleet_deficit = max(0, needed_buses - avail_buses)

        # Safe Zone Impacts
        zone_impacts: List[SafeZoneImpact] = []
        for z in db.safe_zones:
            b_cap = z["safeCapacity"]
            p_cap = int(b_cap * cap_delta_mult)
            p_occ = int(z["currentOccupancy"] + (exposed_delta / max(len(db.safe_zones), 1)))
            surplus_or_def = p_cap - p_occ
            st = "OVER_CAPACITY" if surplus_or_def < 0 else ("NEAR_CAPACITY" if surplus_or_def < 300 else "SAFE")
            zone_impacts.append(
                SafeZoneImpact(
                    id=z["id"],
                    name=z["name"],
                    baselineCapacity=b_cap,
                    projectedCapacity=p_cap,
                    projectedOccupancy=p_occ,
                    projectedSurplusOrDeficit=surplus_or_def,
                    status=st,
                )
            )

        # Temporal Steps (+0h to +12h)
        temporal: List[TemporalStep] = []
        for hr in [0, 2, 4, 6, 8, 12]:
            t_frac = hr / 12.0
            water_delta = round(math.sin(t_frac * math.pi) * (1.2 * rain_mult), 2)
            evac_count = int(min(proj_exposed_pop, (t_frac * (proj_exposed_pop / max(proj_clearance / 12.0, 0.5)))))
            rem_count = max(0, proj_exposed_pop - evac_count)
            t_risk = min(10.0, round(proj_risk_score + (water_delta * 0.4) - (t_frac * 1.5), 1))
            temporal.append(
                TemporalStep(
                    hourLabel=f"+{hr} Hours",
                    timeOffsetHours=hr,
                    waterLevelDeltaM=water_delta,
                    evacuatedCount=evac_count,
                    remainingExposedCount=rem_count,
                    riskScore=max(1.0, t_risk),
                )
            )

        # Bottlenecks & Mitigations
        bottlenecks = []
        if open_corridors < 2:
            bottlenecks.append("Severe bottleneck: Only 1 transit corridor remaining open creates extreme congestion.")
        if net_deficit > 0:
            bottlenecks.append(f"Shelter bed deficit of {net_deficit} beds inside active municipal limits.")
        if fleet_deficit > 0:
            bottlenecks.append(f"Fleet shortage: Deficit of {fleet_deficit} heavy passenger transport units.")
        if not bottlenecks:
            bottlenecks.append("Minor traffic deceleration at check-posts; overall flow stable.")

        mitigations = [
            "Issue targeted reverse-911 warnings to low-lying riverside habitations immediately.",
            "Re-route high-capacity bus convoys through elevated ridge corridors.",
            "Pre-stage inflatable motorboats and life jackets at inundated railway subways.",
        ]
        if net_deficit > 0:
            mitigations.append("Requisition regional university auditoriums and covered stadiums as buffer relief enclaves.")

        projection = SimulationProjection(
            projectedRiskScore=proj_risk_score,
            projectedRiskLevel=proj_risk_level,
            projectedExposedPopulation=proj_exposed_pop,
            exposedPopulationDelta=exposed_delta,
            projectedSafeCapacity=proj_safe_cap,
            netCapacityDeficit=net_deficit,
            projectedOpenCorridors=open_corridors,
            blockedCorridors=blocked_list,
            projectedFleetDeficit=fleet_deficit,
            projectedClearanceHours=proj_clearance,
            clearanceHoursDelta=clearance_delta,
            evacuationBottlenecks=bottlenecks,
            recommendedMitigations=mitigations,
            safeZoneImpacts=zone_impacts,
            temporalProgression=temporal,
        )

        return SimulationRunResult(
            id=f"SIM-{int(time.time())}",
            runAt="Just now",
            locationName=loc_name,
            locationDistrict=loc_district,
            locationCoordinates=loc_coords,
            scenarioTitle=scenario_title,
            params=params,
            baseline=baseline,
            projection=projection,
        )

simulation_service = SimulationService()
