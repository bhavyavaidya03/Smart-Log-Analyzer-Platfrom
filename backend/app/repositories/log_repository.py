"""Log repository — data access for UploadedLog and ParsedLog models."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import and_, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parsed_log import LogLevel, ParsedLog
from app.models.uploaded_log import UploadedLog, UploadStatus


class LogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── UploadedLog ───────────────────────────────────────────────────────────
    async def create_upload(self, **kwargs) -> UploadedLog:
        upload = UploadedLog(**kwargs)
        self.session.add(upload)
        await self.session.flush()
        await self.session.refresh(upload)
        return upload

    async def get_upload_by_id(self, upload_id: UUID) -> Optional[UploadedLog]:
        result = await self.session.execute(
            select(UploadedLog).where(UploadedLog.id == upload_id)
        )
        return result.scalar_one_or_none()

    async def get_uploads_by_user(
        self,
        user_id: UUID,
        project_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[UploadedLog], int]:
        query = select(UploadedLog).where(UploadedLog.user_id == user_id)
        count_query = select(func.count()).select_from(UploadedLog).where(UploadedLog.user_id == user_id)

        if project_id:
            query = query.where(UploadedLog.project_id == project_id)
            count_query = count_query.where(UploadedLog.project_id == project_id)

        query = query.order_by(UploadedLog.created_at.desc()).offset(skip).limit(limit)

        uploads = list((await self.session.execute(query)).scalars().all())
        total = (await self.session.execute(count_query)).scalar_one()
        return uploads, total

    async def update_upload(self, upload: UploadedLog, **kwargs) -> UploadedLog:
        for key, value in kwargs.items():
            setattr(upload, key, value)
        await self.session.flush()
        await self.session.refresh(upload)
        return upload

    async def delete_upload(self, upload: UploadedLog) -> None:
        await self.session.delete(upload)
        await self.session.flush()

    # ── ParsedLog ─────────────────────────────────────────────────────────────
    async def bulk_create_parsed_logs(self, logs: list[dict]) -> None:
        self.session.add_all([ParsedLog(**log) for log in logs])
        await self.session.flush()

    async def get_parsed_logs(
        self,
        upload_id: UUID,
        level: Optional[LogLevel] = None,
        source: Optional[str] = None,
        ip_address: Optional[str] = None,
        status_code: Optional[int] = None,
        keyword: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[ParsedLog], int]:
        filters = [ParsedLog.upload_id == upload_id]

        if level:
            filters.append(ParsedLog.level == level)
        if source:
            filters.append(ParsedLog.source.ilike(f"%{source}%"))
        if ip_address:
            filters.append(ParsedLog.ip_address == ip_address)
        if status_code:
            filters.append(ParsedLog.status_code == status_code)
        if keyword:
            filters.append(ParsedLog.message.ilike(f"%{keyword}%"))
        if date_from:
            filters.append(ParsedLog.timestamp >= date_from)
        if date_to:
            filters.append(ParsedLog.timestamp <= date_to)

        base = and_(*filters)
        query = (
            select(ParsedLog)
            .where(base)
            .order_by(ParsedLog.line_number.asc())
            .offset(skip)
            .limit(limit)
        )
        count_query = select(func.count()).select_from(ParsedLog).where(base)

        logs_result = list((await self.session.execute(query)).scalars().all())
        total = (await self.session.execute(count_query)).scalar_one()
        return logs_result, total

    async def search_logs(
        self,
        user_id: UUID,
        keyword: str,
        level: Optional[LogLevel] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[ParsedLog], int]:
        """Full-text search across all user's parsed logs."""
        # Join to uploaded_logs to scope to user
        query = (
            select(ParsedLog)
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(
                UploadedLog.user_id == user_id,
                ParsedLog.message.ilike(f"%{keyword}%"),
            )
        )
        if level:
            query = query.where(ParsedLog.level == level)

        count_query = (
            select(func.count())
            .select_from(ParsedLog)
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(
                UploadedLog.user_id == user_id,
                ParsedLog.message.ilike(f"%{keyword}%"),
            )
        )

        results = list(
            (await self.session.execute(query.offset(skip).limit(limit))).scalars().all()
        )
        total = (await self.session.execute(count_query)).scalar_one()
        return results, total

    # ── Analytics ─────────────────────────────────────────────────────────────
    async def get_level_counts_for_user(self, user_id: UUID) -> dict[str, int]:
        result = await self.session.execute(
            select(ParsedLog.level, func.count(ParsedLog.id))
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(UploadedLog.user_id == user_id)
            .group_by(ParsedLog.level)
        )
        return {row[0]: row[1] for row in result.all()}

    async def get_daily_counts(self, user_id: UUID, days: int = 30) -> list[dict]:
        result = await self.session.execute(
            text("""
                SELECT 
                    DATE(pl.timestamp AT TIME ZONE 'UTC') as date,
                    pl.level,
                    COUNT(*) as count
                FROM parsed_logs pl
                JOIN uploaded_logs ul ON pl.upload_id = ul.id
                WHERE ul.user_id = :user_id
                    AND pl.timestamp >= NOW() - INTERVAL :days_interval
                    AND pl.timestamp IS NOT NULL
                GROUP BY DATE(pl.timestamp AT TIME ZONE 'UTC'), pl.level
                ORDER BY date ASC
            """),
            {"user_id": str(user_id), "days_interval": f"{days} days"},
        )
        return [{"date": str(r[0]), "level": r[1], "count": r[2]} for r in result.all()]

    async def get_top_errors(self, user_id: UUID, limit: int = 10) -> list[dict]:
        result = await self.session.execute(
            select(ParsedLog.message, func.count(ParsedLog.id).label("count"))
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(
                UploadedLog.user_id == user_id,
                ParsedLog.level.in_([LogLevel.ERROR, LogLevel.CRITICAL]),
            )
            .group_by(ParsedLog.message)
            .order_by(func.count(ParsedLog.id).desc())
            .limit(limit)
        )
        return [{"message": r[0], "count": r[1]} for r in result.all()]

    async def get_top_sources(self, user_id: UUID, limit: int = 10) -> list[dict]:
        result = await self.session.execute(
            select(ParsedLog.source, func.count(ParsedLog.id).label("count"))
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(
                UploadedLog.user_id == user_id,
                ParsedLog.source.isnot(None),
            )
            .group_by(ParsedLog.source)
            .order_by(func.count(ParsedLog.id).desc())
            .limit(limit)
        )
        return [{"source": r[0], "count": r[1]} for r in result.all()]

    async def get_top_ips(self, user_id: UUID, limit: int = 10) -> list[dict]:
        result = await self.session.execute(
            select(ParsedLog.ip_address, func.count(ParsedLog.id).label("count"))
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(
                UploadedLog.user_id == user_id,
                ParsedLog.ip_address.isnot(None),
            )
            .group_by(ParsedLog.ip_address)
            .order_by(func.count(ParsedLog.id).desc())
            .limit(limit)
        )
        return [{"ip": r[0], "count": r[1]} for r in result.all()]

    async def count_uploads_for_user(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(UploadedLog)
            .where(UploadedLog.user_id == user_id)
        )
        return result.scalar_one()

    async def count_parsed_for_user(self, user_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(ParsedLog)
            .join(UploadedLog, ParsedLog.upload_id == UploadedLog.id)
            .where(UploadedLog.user_id == user_id)
        )
        return result.scalar_one()
