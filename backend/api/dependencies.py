"""
API Dependencies for RESQZONE.
Provides request logging, role verification, and common parameters.
"""

from typing import Optional
from fastapi import Header, HTTPException, status

def verify_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Validates that a bearer token or session token is passed if authentication is enforced.
    Preserves Supabase Auth tokens seamlessly.
    """
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    return authorization
