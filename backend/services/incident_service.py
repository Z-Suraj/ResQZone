"""
Incident Management and Citizen Rescue Request Service for RESQZONE.
Handles incident triage, verified status transitions, and emergency rescue queue dispatch.
"""

from typing import List, Dict, Any, Optional
import time
from ..api.schemas.incident import (
    IncidentModel,
    IncidentCreate,
    RescueRequestModel,
    RescueRequestCreate,
)
from ..api.schemas.common import IncidentStatus
from ..models.database import db

class IncidentService:
    def list_incidents(self, status: Optional[str] = None) -> List[IncidentModel]:
        results = []
        for inc in db.incidents:
            if status and inc.get("status") != status:
                continue
            results.append(IncidentModel(**inc))
        return results

    def get_incident_by_id(self, incident_id: str) -> Optional[IncidentModel]:
        incidents = self.list_incidents()
        return next((i for i in incidents if i.id == incident_id), None)

    def create_incident(self, req: IncidentCreate) -> IncidentModel:
        new_id = f"INC-{int(time.time() * 1000) % 10000:04d}"
        new_inc = {
            "id": new_id,
            "title": req.title,
            "type": req.type,
            "severity": req.severity,
            "location": req.location,
            "coordinates": list(req.coordinates),
            "reportedAt": "Just now",
            "status": IncidentStatus.REPORTED.value,
            "description": req.description,
            "reportedBy": req.reportedBy,
            "verified": False,
            "casualties": 0,
            "affectedPeople": 15,
            "assignedUnit": "EOC Triage Queue",
            "imageUrl": req.imageUrl or "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
        }
        db.incidents.insert(0, new_inc)
        return IncidentModel(**new_inc)

    def update_incident_status(
        self, incident_id: str, new_status: IncidentStatus, assigned_unit: Optional[str] = None
    ) -> Optional[IncidentModel]:
        for inc in db.incidents:
            if inc["id"] == incident_id:
                inc["status"] = new_status.value
                if new_status in [IncidentStatus.VERIFIED, IncidentStatus.IN_PROGRESS]:
                    inc["verified"] = True
                if assigned_unit:
                    inc["assignedUnit"] = assigned_unit
                return IncidentModel(**inc)
        return None

    def list_rescue_requests(self) -> List[RescueRequestModel]:
        return [RescueRequestModel(**r) for r in db.rescue_requests]

    def create_rescue_request(self, req: RescueRequestCreate) -> RescueRequestModel:
        new_id = f"REQ-{int(time.time() * 1000) % 10000:04d}"
        new_req = {
            "id": new_id,
            "requesterName": req.requesterName,
            "contactPhone": req.contactPhone,
            "locationName": req.locationName,
            "coordinates": list(req.coordinates),
            "peopleCount": req.peopleCount.model_dump(),
            "urgency": req.urgency,
            "emergencyType": req.emergencyType or "Rescue",
            "message": req.message,
            "imageUrl": req.imageUrl,
            "submittedAt": "Just now",
            "status": "RESPONSE_DISPATCHED",
            "assignedTeam": "NDRF Quick Response Team",
            "estimatedArrivalMinutes": 10,
        }
        db.rescue_requests.insert(0, new_req)
        return RescueRequestModel(**new_req)

incident_service = IncidentService()
