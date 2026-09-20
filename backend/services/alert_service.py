"""
Alert Broadcasting and Early Warning Service for RESQZONE.
Manages CAP-compliant multi-hazard warning bulletins, broadcast targeting,
and citizen advisory push notifications.
"""

from typing import List, Dict, Any, Optional
import time
from ..api.schemas.alert import AlertModel, AlertBroadcastRequest
from ..api.schemas.common import AlertSeverity
from ..models.database import db

class AlertService:
    def list_alerts(self, active_only: bool = True, district: Optional[str] = None) -> List[AlertModel]:
        results = []
        for a in db.alerts:
            if active_only and not a.get("active", True):
                continue
            if district:
                districts = [d.lower() for d in a.get("affectedDistricts", [])]
                if district.lower() not in districts:
                    continue
            results.append(AlertModel(**a))
        return results

    def broadcast_alert(self, req: AlertBroadcastRequest) -> AlertModel:
        new_id = f"ALT-{int(time.time() * 1000) % 10000:04d}"
        new_alert = {
            "id": new_id,
            "title": req.title,
            "severity": req.severity.value,
            "source": "Emergency Operations Center (EOC)",
            "targetArea": req.targetArea,
            "affectedDistricts": req.affectedDistricts,
            "issuedAt": "Just now",
            "expiresAt": f"in {req.expiresInHours} hours",
            "description": req.description,
            "instructions": req.instructions,
            "active": True,
            "verified": True,
            "sourceAgency": "State EOC Command",
        }
        db.alerts.insert(0, new_alert)
        return AlertModel(**new_alert)

alert_service = AlertService()
