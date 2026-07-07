"""Log upload, history, and analysis API routes."""

import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_verified_user
from app.db.session import get_session
from app.models.parsed_log import LogLevel
from app.schemas.common import DataResponse, PaginatedResponse
from app.schemas.logs import ParsedLogResponse, UploadedLogResponse
from app.services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.post("/upload", response_model=DataResponse[UploadedLogResponse], status_code=status.HTTP_201_CREATED)
async def upload_log(
    file: UploadFile = File(...),
    project_id: Optional[UUID] = Query(None),
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Upload a log file for parsing."""
    service = LogService(session)
    upload = await service.upload_log(file, current_user.id, project_id)
    return DataResponse(
        message="Log file uploaded and parsed successfully.",
        data=UploadedLogResponse.model_validate(upload),
    )


@router.get("/uploads", response_model=PaginatedResponse[UploadedLogResponse])
async def list_uploads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[UUID] = Query(None),
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """List all log uploads for the authenticated user."""
    service = LogService(session)
    uploads, total = await service.get_uploads(current_user.id, project_id, page, page_size)
    return PaginatedResponse(
        data=[UploadedLogResponse.model_validate(u) for u in uploads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/uploads/{upload_id}", response_model=DataResponse[UploadedLogResponse])
async def get_upload(
    upload_id: UUID,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific upload by ID."""
    from app.repositories.log_repository import LogRepository
    repo = LogRepository(session)
    upload = await repo.get_upload_by_id(upload_id)
    from fastapi import HTTPException
    if not upload or upload.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Upload not found.")
    return DataResponse(data=UploadedLogResponse.model_validate(upload))


@router.delete("/uploads/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_upload(
    upload_id: UUID,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete an uploaded log file and all its parsed entries."""
    service = LogService(session)
    await service.delete_upload(upload_id, current_user.id)


@router.get("/uploads/{upload_id}/parsed", response_model=PaginatedResponse[ParsedLogResponse])
async def get_parsed_logs(
    upload_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    level: Optional[LogLevel] = Query(None),
    source: Optional[str] = Query(None),
    ip_address: Optional[str] = Query(None),
    status_code: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Get parsed log entries for a specific upload, with filtering."""
    service = LogService(session)
    logs, total = await service.get_parsed_logs(
        upload_id=upload_id,
        user_id=current_user.id,
        level=level,
        source=source,
        ip_address=ip_address,
        status_code=status_code,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        data=[ParsedLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/search", response_model=PaginatedResponse[ParsedLogResponse])
async def search_logs(
    keyword: str = Query(..., min_length=1),
    level: Optional[LogLevel] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Full-text search across all the user's parsed log entries."""
    from app.repositories.log_repository import LogRepository
    repo = LogRepository(session)
    skip = (page - 1) * page_size
    logs, total = await repo.search_logs(current_user.id, keyword, level, skip, page_size)
    return PaginatedResponse(
        data=[ParsedLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/uploads/{upload_id}/export/csv")
async def export_csv(
    upload_id: UUID,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Export parsed logs as a CSV file."""
    service = LogService(session)
    csv_content = await service.export_csv(upload_id, current_user.id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=logs_{upload_id}.csv"},
    )


@router.get("/uploads/{upload_id}/export/pdf")
async def export_pdf(
    upload_id: UUID,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Export parsed logs as a PDF report."""
    service = LogService(session)
    pdf_bytes = await service.export_pdf(upload_id, current_user.id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{upload_id}.pdf"},
    )
