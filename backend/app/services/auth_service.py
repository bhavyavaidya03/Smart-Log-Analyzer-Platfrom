"""Authentication service — business logic for all auth operations."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.otp_verification import OTPPurpose
from app.models.user import User
from app.repositories.otp_repository import OTPRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResendOTPRequest,
    ResetPasswordRequest,
    VerifyOTPRequest,
)
from app.utils.email import send_password_reset_otp, send_verification_otp
from app.utils.otp import generate_otp, otp_expiry


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.otp_repo = OTPRepository(session)

    async def register(self, data: RegisterRequest) -> User:
        # Check uniqueness
        if await self.user_repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        if await self.user_repo.get_by_username(data.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already taken.",
            )

        user = await self.user_repo.create(
            email=data.email.lower().strip(),
            username=data.username,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )

        # Create and send verification OTP
        otp_code = generate_otp()
        await self.otp_repo.create(
            user_id=user.id,
            otp_code=otp_code,
            purpose=OTPPurpose.EMAIL_VERIFICATION,
            expires_at=otp_expiry(),
        )
        await send_verification_otp(user.email, otp_code, user.full_name)

        return user

    async def verify_email(self, data: VerifyOTPRequest) -> User:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified."
            )

        otp = await self.otp_repo.get_valid_otp(
            user.id, data.otp_code, OTPPurpose.EMAIL_VERIFICATION
        )
        if not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP. Please request a new one.",
            )

        await self.otp_repo.mark_used(otp)
        user = await self.user_repo.update(user, is_verified=True)
        return user

    async def resend_otp(self, data: ResendOTPRequest) -> None:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified."
            )

        # Invalidate existing OTPs
        await self.otp_repo.invalidate_all(user.id, OTPPurpose.EMAIL_VERIFICATION)

        otp_code = generate_otp()
        await self.otp_repo.create(
            user_id=user.id,
            otp_code=otp_code,
            purpose=OTPPurpose.EMAIL_VERIFICATION,
            expires_at=otp_expiry(),
        )
        await send_verification_otp(user.email, otp_code, user.full_name)

    async def login(self, data: LoginRequest) -> dict:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated."
            )

        extra = {"role": user.role.value, "email": user.email}
        return {
            "access_token": create_access_token(str(user.id), extra),
            "refresh_token": create_refresh_token(str(user.id)),
            "user": user,
        }

    async def refresh_token(self, data: RefreshRequest) -> str:
        from jose import JWTError
        try:
            payload = decode_token(data.refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError
            user_id = payload.get("sub")
        except (JWTError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        from uuid import UUID
        user = await self.user_repo.get_by_id(UUID(user_id))
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        extra = {"role": user.role.value, "email": user.email}
        return create_access_token(str(user.id), extra)

    async def forgot_password(self, data: ForgotPasswordRequest) -> None:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            # Don't reveal whether email exists
            return

        await self.otp_repo.invalidate_all(user.id, OTPPurpose.PASSWORD_RESET)
        otp_code = generate_otp()
        await self.otp_repo.create(
            user_id=user.id,
            otp_code=otp_code,
            purpose=OTPPurpose.PASSWORD_RESET,
            expires_at=otp_expiry(),
        )
        await send_password_reset_otp(user.email, otp_code, user.full_name)

    async def reset_password(self, data: ResetPasswordRequest) -> None:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        otp = await self.otp_repo.get_valid_otp(user.id, data.otp_code, OTPPurpose.PASSWORD_RESET)
        if not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP.",
            )

        await self.otp_repo.mark_used(otp)
        await self.user_repo.update(user, hashed_password=hash_password(data.new_password))

    async def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )
        await self.user_repo.update(user, hashed_password=hash_password(data.new_password))
