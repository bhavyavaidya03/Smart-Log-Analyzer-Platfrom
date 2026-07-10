"""OTPVerification ORM model."""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OTPPurpose(str, PyEnum):
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[OTPPurpose] = mapped_column(
    Enum(
        OTPPurpose,
        values_callable=lambda obj: [e.value for e in obj],
        name="otppurpose",
    ),
    nullable=False,
)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="otp_verifications")

    def __repr__(self) -> str:
        return f"<OTPVerification id={self.id} purpose={self.purpose}>"
