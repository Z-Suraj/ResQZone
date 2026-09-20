"""
Unit tests for RESQZONE Python backend services.
"""

import unittest
from backend.services.gis_service import haversine_distance_km, gis_service
from backend.services.hazard_service import hazard_service
from backend.services.habitation_service import habitation_service
from backend.services.capacity_service import capacity_service
from backend.services.relocation_service import relocation_service
from backend.services.simulation_service import simulation_service
from backend.services.ai_service import ai_service
from backend.api.schemas.hazard import RiskEvaluationRequest
from backend.api.schemas.common import RiskLevel
from backend.api.schemas.simulation import SimulationParameters
from backend.api.schemas.ai import CopilotQueryRequest

class TestResqZoneServices(unittest.TestCase):
    def test_haversine_distance(self):
        # Distance between Haldia and Siliguri (~520km)
        dist = haversine_distance_km(22.0667, 88.0698, 26.7165, 88.3915)
        self.assertGreater(dist, 400.0)
        self.assertLess(dist, 600.0)

    def test_hazard_risk_evaluation(self):
        from backend.api.schemas.common import RouteRisk
        req = RiskEvaluationRequest(
            hazardSeverity=RiskLevel.CRITICAL,
            populationExposure=10000,
            sensorTrend="ESCALATING",
            routeRisk=RouteRisk.HIGH_RISK
        )
        res = hazard_service.evaluate_risk(req)
        self.assertEqual(res.riskLevel, RiskLevel.CRITICAL)
        self.assertTrue(res.requiresEmergencyAttention)

    def test_capacity_sphere_standards(self):
        assessment = capacity_service.assess_capacity(exposed_population=5000)
        self.assertGreater(assessment.totalSafeCapacity, 0)
        self.assertIsNotNone(assessment.sphereStandards)

    def test_simulation_sandbox(self):
        params = SimulationParameters(rainfallPercent=50.0, hazardMultiplier=1.5)
        result = simulation_service.run_simulation(params=params)
        self.assertIsNotNone(result.projection.projectedRiskScore)
        self.assertGreater(len(result.projection.temporalProgression), 0)

    def test_copilot_ai_reasoning(self):
        req = CopilotQueryRequest(message="What is the current shelter capacity?")
        res = ai_service.process_query(req)
        self.assertEqual(res.intentDetected, "CAPACITY_EVALUATION")
        self.assertGreater(len(res.suggestedActions), 0)

if __name__ == "__main__":
    unittest.main()
