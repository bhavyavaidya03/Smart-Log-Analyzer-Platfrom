"""API v1 router aggregator."""

from fastapi import APIRouter

from app.api.v1 import analytics, auth, logs, projects, users

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(projects.router)
router.include_router(logs.router)
router.include_router(analytics.router)
