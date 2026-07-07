"""OTP repository — data access for OTPVerification model."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.otp_verification import OTPVerification, OTPPurpose


class OTPRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        user_id: UUID,
        otp_code: str,
        purpose: OTPPurpose,
        expires_at: datetime,
    ) -> OTPVerification:
        otp = OTPVerification(
            user_id=user_id,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
        )
        self.session.add(otp)
        await self.session.flush()
        return otp

    async def get_valid_otp(
        self,
        user_id: UUID,
        otp_code: str,
        purpose: OTPPurpose,
    ) -> Optional[OTPVerification]:
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(OTPVerification).where(
                OTPVerification.user_id == user_id,
                OTPVerification.otp_code == otp_code,
                OTPVerification.purpose == purpose,
                OTPVerification.is_used == False,  # noqa: E712
                OTPVerification.expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    async def invalidate_all(self, user_id: UUID, purpose: OTPPurpose) -> None:
        """Mark all existing OTPs for this user+purpose as used."""
        from sqlalchemy import update
        await self.session.execute(
            update(OTPVerification)
            .where(
                OTPVerification.user_id == user_id,
                OTPVerification.purpose == purpose,
                OTPVerification.is_used == False,  # noqa: E712
            )
            .values(is_used=True)
        )
        await self.session.flush()

    async def mark_used(self, otp: OTPVerification) -> None:
        otp.is_used = True
        await self.session.flush()
