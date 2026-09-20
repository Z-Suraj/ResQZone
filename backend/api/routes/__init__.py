"""
Routes package aggregating all REST routers for RESQZONE.
"""

from .hazard_routes import router as hazard_router
from .habitation_routes import router as habitation_router
from .capacity_routes import router as capacity_router
from .relocation_routes import router as relocation_router
from .incident_routes import router as incident_router
from .alert_routes import router as alert_router
from .simulation_routes import router as simulation_router
from .gis_routes import router as gis_router
from .ai_routes import router as ai_router
from .location_routes import router as location_router

__all__ = [
    "hazard_router",
    "habitation_router",
    "capacity_router",
    "relocation_router",
    "incident_router",
    "alert_router",
    "simulation_router",
    "gis_router",
    "ai_router",
    "location_router",
]
