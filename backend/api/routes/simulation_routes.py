"""
FastAPI route handlers for What-If Simulation Sandbox.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from ..schemas.simulation import (
    SimulationParameters,
    SimulationRunResult,
    ScenarioPreset,
)
from ...services.simulation_service import simulation_service

router = APIRouter(prefix="/simulation", tags=["What-If Simulation Sandbox"])

@router.get("/presets", response_model=List[ScenarioPreset])
def get_presets():
    """
    Returns pre-configured stress-test scenario presets (monsoon surge, bridge collapse, etc.).
    """
    return simulation_service.list_presets()

@router.post("/run", response_model=SimulationRunResult)
def run_simulation(
    params: SimulationParameters,
    location_id: Optional[str] = Query("LOC-SILIGURI", description="Location sector ID"),
    scenario_title: Optional[str] = Query("Custom What-If Scenario", description="Display title for the run"),
):
    """
    Executes non-destructive what-if stress simulation across hazard, demographic, and transport variables.
    """
    return simulation_service.run_simulation(
        params=params,
        location_id=location_id or "LOC-SILIGURI",
        scenario_title=scenario_title or "Custom What-If Scenario",
    )
