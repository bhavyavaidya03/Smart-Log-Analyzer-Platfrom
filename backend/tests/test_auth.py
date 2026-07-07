"""Tests for authentication endpoints."""

import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "SecurePass1",
        "confirm_password": "SecurePass1",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {
        "email": "duplicate@example.com",
        "username": "user1",
        "full_name": "User One",
        "password": "SecurePass1",
        "confirm_password": "SecurePass1",
    }
    await client.post("/api/v1/auth/register", json=payload)
    # Second registration with same email
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "username": "weakuser",
        "full_name": "Weak User",
        "password": "weak",
        "confirm_password": "weak",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
