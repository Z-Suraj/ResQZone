"""
Helper utilities for RESQZONE Python backend.
"""

from typing import Tuple

def is_valid_coordinate(coords: Tuple[float, float]) -> bool:
    """Checks if coordinates fall within valid latitude and longitude ranges."""
    lat, lon = coords
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
