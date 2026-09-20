"""
RESQZONE — Intelligent Hazard Red Zone & Relocation System
Main Python FastAPI Application Entry Point.
"""

import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.api.routes import (
    hazard_router,
    habitation_router,
    capacity_router,
    relocation_router,
    incident_router,
    alert_router,
    simulation_router,
    gis_router,
    ai_router,
    location_router,
)

app = FastAPI(
    title="RESQZONE Intelligence API",
    description=(
        "Core Python REST API for RESQZONE — Intelligent Hazard Red Zone & Relocation System. "
        "Provides GIS routing, carrying capacity estimation, Census 2011 habitation vulnerability analysis, "
        "what-if disaster simulations, and AI Copilot decision support."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain routers under /api
api_prefix = "/api"
app.include_router(hazard_router, prefix=api_prefix)
app.include_router(habitation_router, prefix=api_prefix)
app.include_router(capacity_router, prefix=api_prefix)
app.include_router(relocation_router, prefix=api_prefix)
app.include_router(incident_router, prefix=api_prefix)
app.include_router(alert_router, prefix=api_prefix)
app.include_router(simulation_router, prefix=api_prefix)
app.include_router(gis_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(location_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "service": "RESQZONE Intelligence Core",
        "status": "ONLINE",
        "framework": "Python 3 + FastAPI",
        "docs": "/docs",
        "apiPrefix": "/api",
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "version": "2.0.0",
        "architecture": "Python/FastAPI Core + React/TypeScript UI",
        "modules": [
            "GIS & SafeRoute Engine",
            "Hazard Red Zone Evaluator",
            "Census 2011 Habitation Vulnerability",
            "Sphere Standard Carrying Capacity",
            "Multimodal Evacuation Fleet",
            "Citizen Incident & Rescue Desk",
            "Early Warning Alerts",
            "What-If Simulation Sandbox",
            "AI Copilot Decision Engine",
        ],
    }

if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"Starting RESQZONE FastAPI backend on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
