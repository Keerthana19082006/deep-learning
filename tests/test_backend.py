import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_dataset_summary():
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert data["total_records"] > 0

def test_predict_flood():
    payload = {
        "latitude": 27.7172,
        "longitude": 85.3240,
        "hazard_type": "Flood",
        "rainfall_mm": 210.5,
        "temperature_c": 28.0,
        "elevation_m": 85.0,
        "ndvi": 0.45,
        "ndwi": 0.65,
        "slope_deg": 3.5,
        "earthquake_magnitude": 0.0,
        "earthquake_depth_km": 10.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert "contributing_factors" in data

def test_risk_map():
    response = client.get("/api/risk-map?hazard_filter=ALL")
    assert response.status_code == 200
    data = response.json()
    assert "points" in data
    assert len(data["points"]) > 0

def test_model_performance():
    response = client.get("/api/model-performance")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert data["accuracy"] >= 0.0
