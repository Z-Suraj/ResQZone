"""
Relocation Engine and Multimodal Fleet Service for RESQZONE.
Manages emergency evacuation buses, evacuation railheads, flood rescue boats,
and rapid response convoys.
"""

from typing import List, Dict, Any, Optional
import math
from ..api.schemas.relocation import (
    FleetItemModel,
    ConvoyAllocationRequest,
    ConvoyPlanResponse,
    VehicleAllocation,
)
from ..models.database import db

class RelocationService:
    def list_fleet(self, status: Optional[str] = None) -> List[FleetItemModel]:
        results = []
        for item in db.fleet:
            if status and item.get("status", "").upper() != status.upper():
                continue
            results.append(FleetItemModel(**item))
        return results

    def plan_convoy(self, req: ConvoyAllocationRequest) -> ConvoyPlanResponse:
        """
        Calculates optimal fleet convoy distribution to evacuate target population
        within the allotted operational window.
        """
        pop = req.exposedPopulation
        target_hours = max(req.targetEvacuationHours or 4.0, 1.0)

        # Vehicle capacities
        bus_cap = 50
        train_cap = 1200
        boat_cap = 20
        rescue_cap = 6

        allocations: List[VehicleAllocation] = []
        remaining_pop = pop
        total_lift_per_trip = 0

        # If train is an option and population > 1000, allocate train
        if "TRAIN" in (req.preferredModes or []) and remaining_pop >= 800:
            train_units = 1
            train_lift = train_cap * train_units
            trips = math.ceil(min(remaining_pop, 2400) / train_cap)
            allocations.append(
                VehicleAllocation(
                    vehicleType="Evacuation Railhead Coach (Train)",
                    unitsAllocated=train_units,
                    passengersPerUnit=train_cap,
                    totalLiftCapacity=train_lift,
                    tripsRequired=trips,
                )
            )
            remaining_pop = max(0, remaining_pop - (train_lift * trips))
            total_lift_per_trip += train_lift

        # Allocate buses for road corridors
        if remaining_pop > 0 and ("BUS" in (req.preferredModes or [])):
            # Target 2-3 trips per bus in target_hours
            trips_per_bus = max(1, int(target_hours / 1.5))
            buses_needed = math.ceil(remaining_pop / (bus_cap * trips_per_bus))
            # Cap at available realistic fleet (e.g., 20-30 buses)
            buses_allocated = max(4, min(buses_needed, 35))
            bus_lift = bus_cap * buses_allocated
            actual_trips = math.ceil(remaining_pop / max(bus_lift, 1))

            allocations.append(
                VehicleAllocation(
                    vehicleType="Emergency Evacuation Bus (State Transport)",
                    unitsAllocated=buses_allocated,
                    passengersPerUnit=bus_cap,
                    totalLiftCapacity=bus_lift,
                    tripsRequired=actual_trips,
                )
            )
            remaining_pop = max(0, remaining_pop - (bus_lift * actual_trips))
            total_lift_per_trip += bus_lift

        # Allocate rapid rescue 4x4 vehicles for trapped elderly/injuries
        rescue_units = 6
        rescue_lift = rescue_cap * rescue_units
        allocations.append(
            VehicleAllocation(
                vehicleType="Rapid 4x4 Winch Rescue Vehicle",
                unitsAllocated=rescue_units,
                passengersPerUnit=rescue_cap,
                totalLiftCapacity=rescue_lift,
                tripsRequired=4,
            )
        )
        total_lift_per_trip += rescue_lift

        # Projected duration
        max_trips = max((a.tripsRequired for a in allocations), default=1)
        projected_duration = round(max_trips * 1.35, 1)

        dest_zone = next((z for z in db.safe_zones if z["id"] == req.destinationSafeZoneId), None)
        dest_name = dest_zone["name"] if dest_zone else "Regional Safe Zone"

        return ConvoyPlanResponse(
            originSector=req.originSector,
            destinationSafeZone=dest_name,
            targetPopulation=pop,
            totalAvailableFleetLift=total_lift_per_trip,
            projectedDurationHours=projected_duration,
            allocations=allocations,
            stagingPoints=[
                f"{req.originSector} Municipal Bus Depot Transit Point",
                "Sector 2 Bypass High Ground Assembly Field",
                f"{dest_name} Ingress Gate Receiving Bay",
            ],
            bottlenecks=[
                "Single-lane bridge crossing near Sector 3 reduces vehicle speed to 15 km/h.",
                "High pedestrian counter-flow expected along market approach roads.",
            ],
            ndrfEscortRequired=True,
        )

relocation_service = RelocationService()
