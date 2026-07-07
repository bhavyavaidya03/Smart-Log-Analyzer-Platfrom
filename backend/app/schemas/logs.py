"""Project and log-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.uploaded_log import UploadStatus
from app.models.parsed_log import LogLevel


# ── Projects ──────────────────────────────────────────────────────────────────
class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None

    class Config:
        str_strip_whitespace = True


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    log_count: Optional[int] = 0

    model_config = {"from_attributes": True}


# ── Uploaded Logs ─────────────────────────────────────────────────────────────
class UploadedLogResponse(BaseModel):
    id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: UploadStatus
    total_lines: int
    parsed_lines: int
    error_message: Optional[str]
    user_id: UUID
    project_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Parsed Logs ───────────────────────────────────────────────────────────────
class ParsedLogResponse(BaseModel):
    id: UUID
    upload_id: UUID
    timestamp: Optional[datetime]
    level: LogLevel
    source: Optional[str]
    module: Optional[str]
    ip_address: Optional[str]
    status_code: Optional[int]
    response_time: Optional[float]
    message: str
    raw_line: str
    line_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Analytics ─────────────────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    total_uploads: int
    total_parsed_logs: int
    total_errors: int
    total_warnings: int
    total_critical: int
    total_info: int
    total_debug: int
    total_projects: int
    recent_uploads: list[UploadedLogResponse]


class TrendPoint(BaseModel):
    date: str
    errors: int
    warnings: int
    info: int
    critical: int
    debug: int
    total: int


class TopError(BaseModel):
    message: str
    count: int
    percentage: float


class LevelDistribution(BaseModel):
    level: str
    count: int
    percentage: float


class AnalyticsTrends(BaseModel):
    daily: list[TrendPoint]
    weekly: list[TrendPoint]
    monthly: list[TrendPoint]
    level_distribution: list[LevelDistribution]
    top_errors: list[TopError]
    top_sources: list[dict]
    top_ips: list[dict]
