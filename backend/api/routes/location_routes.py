"""
FastAPI route handlers for disaster geographic sectors and hubs.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from ...models.database import db

router = APIRouter(prefix="/locations", tags=["Locations & Sectors"])

@router.get("")
def get_locations() -> List[Dict[str, Any]]:
    """
    Returns all registered disaster response sectors (Siliguri, Haldia, Joshimath, Wayanad, Mumbai, Delhi).
    """
    return list(db.locations.values())

@router.get("/{location_id}")
def get_location(location_id: str) -> Dict[str, Any]:
    loc = db.locations.get(location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location sector not found")
    return loc
