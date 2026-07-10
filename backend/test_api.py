import pytest
from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["operational", "degraded"]

def test_translate_no_api_key(monkeypatch):
    monkeypatch.delenv("FIREWORKS_API_KEY", raising=False)
    response = client.post("/translate", json={"cuda_code": "__global__ void test() {}"})
    assert response.status_code == 500
    assert "API Key missing" in response.json()["detail"]
