"""ParsedLog ORM model — individual log entries extracted from uploaded files."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LogLevel(str, PyEnum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


class ParsedLog(Base):
    __tablename__ = "parsed_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    upload_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("uploaded_logs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Extracted fields
    timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    level: Mapped[LogLevel] = mapped_column(
        Enum(LogLevel), default=LogLevel.UNKNOWN, nullable=False, index=True
    )
    source: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    module: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True, index=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    response_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    raw_line: Mapped[str] = mapped_column(Text, nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    upload: Mapped["UploadedLog"] = relationship(
        "UploadedLog", back_populates="parsed_logs"
    )

    def __repr__(self) -> str:
        return f"<ParsedLog id={self.id} level={self.level}>"
