"""
API Route integration tests for RESQZONE FastAPI endpoints.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestApiRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertIn("modules", data)

    def test_get_hazards(self):
        res = self.client.get("/api/hazards")
        self.assertEqual(res.status_code, 200)
        hazards = res.json()
        self.assertIsInstance(hazards, list)
        self.assertGreater(len(hazards), 0)

    def test_get_habitations(self):
        res = self.client.get("/api/habitations")
        self.assertEqual(res.status_code, 200)
        habs = res.json()
        self.assertIsInstance(habs, list)
        self.assertGreater(len(habs), 0)

    def test_get_safe_zones(self):
        res = self.client.get("/api/capacity/safe-zones")
        self.assertEqual(res.status_code, 200)
        zones = res.json()
        self.assertIsInstance(zones, list)
        self.assertGreater(len(zones), 0)

    def test_safe_route_calculation(self):
        res = self.client.post("/api/gis/safe-route", json={
            "originCoords": [26.7165, 88.3915],
            "locationName": "Siliguri Sector",
            "scenario": "ROAD_BLOCKED"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("route", data)
        self.assertEqual(data["activeScenario"], "ROAD_BLOCKED")

    def test_simulation_run(self):
        res = self.client.post("/api/simulation/run", json={
            "rainfallPercent": 30.0,
            "hazardMultiplier": 1.2
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("baseline", data)
        self.assertIn("projection", data)

    def test_copilot_chat(self):
        res = self.client.post("/api/copilot/chat", json={
            "message": "Where are the open evacuation corridors?"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intentDetected"], "ROUTE_OPTIMIZATION")

if __name__ == "__main__":
    unittest.main()
