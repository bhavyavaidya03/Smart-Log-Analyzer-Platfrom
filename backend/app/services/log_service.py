"""Log service — business logic for upload, parsing, analytics, and export."""

import io
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.uploaded_log import UploadStatus
from app.repositories.log_repository import LogRepository
from app.repositories.project_repository import ProjectRepository
from app.utils.log_parser import parse_log_file_content


class LogService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = LogRepository(session)
        self.project_repo = ProjectRepository(session)

    async def upload_log(
        self,
        file: UploadFile,
        user_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
    ):
        """Validate, save, and parse an uploaded log file."""
        # Validate file extension
        ext = Path(file.filename).suffix.lower()
        if ext not in settings.allowed_extensions_set:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"File type '{ext}' not allowed. Supported: {settings.ALLOWED_EXTENSIONS}",
            )

        # Read file content
        content = await file.read()
        file_size = len(content)

        if file_size > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.",
            )

        # Validate project ownership
        if project_id:
            project = await self.project_repo.get_by_id(project_id)
            if not project or project.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project not found.",
                )

        # Save file to disk
        upload_dir = Path(settings.UPLOAD_DIR) / str(user_id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        stored_filename = f"{uuid.uuid4()}{ext}"
        file_path = upload_dir / stored_filename

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        # Create upload record
        upload = await self.repo.create_upload(
            filename=stored_filename,
            original_filename=file.filename,
            file_type=ext.lstrip("."),
            file_size=file_size,
            file_path=str(file_path),
            status=UploadStatus.PROCESSING,
            user_id=user_id,
            project_id=project_id,
        )

        # Parse content
        try:
            text_content = self._decode_file(content, ext)
            if text_content is None:
                raise ValueError("Unable to decode file content")

            parsed_entries, total_lines, parsed_count = parse_log_file_content(
                text_content, str(upload.id)
            )

            if parsed_entries:
                await self.repo.bulk_create_parsed_logs(parsed_entries)

            await self.repo.update_upload(
                upload,
                status=UploadStatus.COMPLETED,
                total_lines=total_lines,
                parsed_lines=parsed_count,
            )
        except Exception as e:
            await self.repo.update_upload(
                upload,
                status=UploadStatus.FAILED,
                error_message=str(e)[:500],
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse log file: {e}",
            )

        return upload

    def _decode_file(self, content: bytes, ext: str) -> Optional[str]:
        """Decode file bytes to string, handling different formats."""
        # Try common encodings
        for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                text = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            return None

        # For CSV: convert to newline-separated values for parsing
        if ext == ".csv":
            import csv

            reader = csv.DictReader(io.StringIO(text))
            lines = []

            for row in reader:
                normalized_row = {
                    str(key).lower().strip(): value
                    for key, value in row.items()
                    if key is not None
                }

                msg = (
                    normalized_row.get("message")
                    or normalized_row.get("msg")
                    or normalized_row.get("text")
                )

                level = (
                    normalized_row.get("level")
                    or normalized_row.get("severity")
                    or normalized_row.get("log_level")
                )

                ts = (
                    normalized_row.get("timestamp")
                    or normalized_row.get("time")
                    or normalized_row.get("date")
                    or ""
                )

                source = (
                    normalized_row.get("source")
                    or normalized_row.get("service")
                    or normalized_row.get("logger")
                    or "csv"
                )

                if not msg or not level:
                    lines.append(str(dict(row)))
                    continue

                if ts:
                    lines.append(f"{ts} - {source} - {level.upper()} - {msg}")
                else:
                    lines.append(f"{level.upper()}: {msg}")

            return "\n".join(lines)

        return text

    async def get_uploads(
        self,
        user_id: uuid.UUID,
        project_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ):
        skip = (page - 1) * page_size
        uploads, total = await self.repo.get_uploads_by_user(
            user_id, project_id, skip, page_size
        )
        return uploads, total

    async def get_parsed_logs(
        self,
        upload_id: uuid.UUID,
        user_id: uuid.UUID,
        **filters,
    ):
        # Validate ownership
        upload = await self.repo.get_upload_by_id(upload_id)
        if not upload or upload.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")

        page = filters.pop("page", 1)
        page_size = filters.pop("page_size", 50)
        skip = (page - 1) * page_size

        logs, total = await self.repo.get_parsed_logs(
            upload_id=upload_id, skip=skip, limit=page_size, **filters
        )
        return logs, total

    async def delete_upload(self, upload_id: uuid.UUID, user_id: uuid.UUID) -> None:
        upload = await self.repo.get_upload_by_id(upload_id)
        if not upload or upload.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")

        # Remove file from disk
        try:
            if os.path.exists(upload.file_path):
                os.remove(upload.file_path)
        except OSError:
            pass

        await self.repo.delete_upload(upload)

    async def get_dashboard_summary(self, user_id: uuid.UUID) -> dict:
        level_counts = await self.repo.get_level_counts_for_user(user_id)
        total_uploads = await self.repo.count_uploads_for_user(user_id)
        total_parsed = await self.repo.count_parsed_for_user(user_id)
        project_count = await self.project_repo.count_by_user(user_id)
        recent_uploads, _ = await self.repo.get_uploads_by_user(user_id, skip=0, limit=5)

        return {
            "total_uploads": total_uploads,
            "total_parsed_logs": total_parsed,
            "total_errors": level_counts.get("ERROR", 0),
            "total_warnings": level_counts.get("WARNING", 0),
            "total_critical": level_counts.get("CRITICAL", 0),
            "total_info": level_counts.get("INFO", 0),
            "total_debug": level_counts.get("DEBUG", 0),
            "total_projects": project_count,
            "recent_uploads": recent_uploads,
        }

    async def get_analytics_trends(self, user_id: uuid.UUID) -> dict:
        daily_raw = await self.repo.get_daily_counts(user_id, days=30)
        weekly_raw = await self.repo.get_daily_counts(user_id, days=84)
        monthly_raw = await self.repo.get_daily_counts(user_id, days=365)
        level_counts = await self.repo.get_level_counts_for_user(user_id)
        top_errors = await self.repo.get_top_errors(user_id)
        top_sources = await self.repo.get_top_sources(user_id)
        top_ips = await self.repo.get_top_ips(user_id)
        total_parsed = await self.repo.count_parsed_for_user(user_id)

        def aggregate_trend(raw: list[dict]) -> list[dict]:
            from collections import defaultdict
            by_date: dict = defaultdict(lambda: {"errors": 0, "warnings": 0, "info": 0, "critical": 0, "debug": 0, "total": 0})
            for r in raw:
                d = r["date"]
                level = r["level"].upper()
                count = r["count"]
                by_date[d]["total"] += count
                if level == "ERROR":
                    by_date[d]["errors"] += count
                elif level == "WARNING":
                    by_date[d]["warnings"] += count
                elif level == "INFO":
                    by_date[d]["info"] += count
                elif level == "CRITICAL":
                    by_date[d]["critical"] += count
                elif level == "DEBUG":
                    by_date[d]["debug"] += count
            return [{"date": d, **v} for d, v in sorted(by_date.items())]

        total = total_parsed or 1
        level_dist = [
            {
                "level": lvl,
                "count": cnt,
                "percentage": round(cnt / total * 100, 1),
            }
            for lvl, cnt in level_counts.items()
        ]

        top_errors_with_pct = [
            {
                "message": e["message"][:100],
                "count": e["count"],
                "percentage": round(e["count"] / total * 100, 1),
            }
            for e in top_errors
        ]

        return {
            "daily": aggregate_trend(daily_raw),
            "weekly": aggregate_trend(weekly_raw),
            "monthly": aggregate_trend(monthly_raw),
            "level_distribution": level_dist,
            "top_errors": top_errors_with_pct,
            "top_sources": top_sources,
            "top_ips": top_ips,
        }

    async def export_csv(self, upload_id: uuid.UUID, user_id: uuid.UUID) -> str:
        """Export parsed logs as CSV string."""
        import csv

        upload = await self.repo.get_upload_by_id(upload_id)
        if not upload or upload.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")

        logs, _ = await self.repo.get_parsed_logs(upload_id=upload_id, skip=0, limit=100000)

        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["line_number", "timestamp", "level", "source", "module", "ip_address", "status_code", "response_time", "message"],
        )
        writer.writeheader()
        for log in logs:
            writer.writerow({
                "line_number": log.line_number,
                "timestamp": log.timestamp.isoformat() if log.timestamp else "",
                "level": log.level.value,
                "source": log.source or "",
                "module": log.module or "",
                "ip_address": log.ip_address or "",
                "status_code": log.status_code or "",
                "response_time": log.response_time or "",
                "message": log.message,
            })
        return output.getvalue()

    async def export_pdf(self, upload_id: uuid.UUID, user_id: uuid.UUID) -> bytes:
        """Export parsed logs summary as PDF."""
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )

        upload = await self.repo.get_upload_by_id(upload_id)
        if not upload or upload.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found.")

        logs, _ = await self.repo.get_parsed_logs(upload_id=upload_id, skip=0, limit=1000)
        level_counts = {}
        for log in logs:
            lvl = log.level.value
            level_counts[lvl] = level_counts.get(lvl, 0) + 1

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph(f"<b>Log Analysis Report</b>", styles["Title"])
        elements.append(title)
        elements.append(Spacer(1, 0.2 * inch))

        # Metadata
        meta_data = [
            ["File", upload.original_filename],
            ["Uploaded", upload.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")],
            ["Total Lines", str(upload.total_lines)],
            ["Parsed Lines", str(upload.parsed_lines)],
            ["Status", upload.status.value],
        ]
        meta_table = Table(meta_data, colWidths=[2 * inch, 4 * inch])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#6366f1")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (1, 0), (-1, -1), [colors.white, colors.HexColor("#f8f8ff")]),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Level summary
        elements.append(Paragraph("<b>Log Level Summary</b>", styles["Heading2"]))
        level_table_data = [["Level", "Count"]] + [[k, str(v)] for k, v in level_counts.items()]
        level_table = Table(level_table_data, colWidths=[2 * inch, 2 * inch])
        level_colors = {
            "ERROR": colors.HexColor("#ef4444"),
            "CRITICAL": colors.HexColor("#dc2626"),
            "WARNING": colors.HexColor("#f59e0b"),
            "INFO": colors.HexColor("#6366f1"),
            "DEBUG": colors.HexColor("#94a3b8"),
        }
        level_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(level_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Log entries table (first 200)
        elements.append(Paragraph("<b>Log Entries (first 200)</b>", styles["Heading2"]))
        table_data = [["#", "Timestamp", "Level", "Source", "Message"]]
        for log in logs[:200]:
            table_data.append([
                str(log.line_number),
                log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A",
                log.level.value,
                (log.source or "")[:20],
                log.message[:80] + ("..." if len(log.message) > 80 else ""),
            ])

        logs_table = Table(table_data, colWidths=[0.5*inch, 1.8*inch, 0.9*inch, 1.5*inch, 4*inch])
        logs_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f8ff")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(logs_table)

        doc.build(elements)
        return buffer.getvalue()
