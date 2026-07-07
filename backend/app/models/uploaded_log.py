"""UploadedLog ORM model."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UploadStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadedLog(Base):
    __tablename__ = "uploaded_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus), default=UploadStatus.PENDING, nullable=False, index=True
    )
    total_lines: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    parsed_lines: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    uploader: Mapped["User"] = relationship("User", back_populates="uploaded_logs")
    project: Mapped["Project"] = relationship("Project", back_populates="uploaded_logs")
    parsed_logs: Mapped[list["ParsedLog"]] = relationship(
        "ParsedLog", back_populates="upload", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<UploadedLog id={self.id} filename={self.filename}>"
