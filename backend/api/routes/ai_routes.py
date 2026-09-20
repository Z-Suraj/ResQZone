"""
FastAPI route handlers for AI Copilot decision support.
"""

from typing import List
from fastapi import APIRouter
from ..schemas.ai import CopilotQueryRequest, CopilotQueryResponse, QuickPrompt
from ...services.ai_service import ai_service

router = APIRouter(prefix="/copilot", tags=["AI Copilot Decision Engine"])

@router.get("/quick-prompts", response_model=List[QuickPrompt])
def get_quick_prompts():
    """
    Returns curated operational quick prompts for EOC commanders and citizens.
    """
    return ai_service.list_quick_prompts()

@router.post("/chat", response_model=CopilotQueryResponse)
def chat_with_copilot(req: CopilotQueryRequest):
    """
    Synthesizes operational recommendations grounded in live disaster telemetry,
    demographics, shelter capacities, and NDMA guidelines.
    """
    return ai_service.process_query(req)
