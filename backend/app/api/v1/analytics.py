"""Analytics API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_verified_user
from app.db.session import get_session
from app.schemas.common import DataResponse
from app.schemas.logs import AnalyticsTrends, DashboardSummary
from app.services.log_service import LogService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=DataResponse[DashboardSummary])
async def get_dashboard_summary(
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Get dashboard summary statistics for the authenticated user."""
    service = LogService(session)
    summary = await service.get_dashboard_summary(current_user.id)

    from app.schemas.logs import UploadedLogResponse
    summary["recent_uploads"] = [
        UploadedLogResponse.model_validate(u) for u in summary["recent_uploads"]
    ]
    return DataResponse(data=DashboardSummary(**summary))


@router.get("/trends", response_model=DataResponse[AnalyticsTrends])
async def get_analytics_trends(
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Get time-series and distribution analytics for the authenticated user."""
    service = LogService(session)
    trends = await service.get_analytics_trends(current_user.id)
    return DataResponse(data=AnalyticsTrends(**trends))
