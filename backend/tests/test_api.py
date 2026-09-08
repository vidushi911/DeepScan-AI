"""Unit tests for FastAPI endpoint routes (health, uploads, jobs, detections, reports)."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    """Test health check route."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "ok", "degraded")


def test_list_detections_endpoint() -> None:
    """Test detections listing endpoint."""
    response = client.get("/api/v1/detections")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)
