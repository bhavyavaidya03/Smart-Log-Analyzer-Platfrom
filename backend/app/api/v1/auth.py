"""Authentication API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_current_verified_user
from app.db.session import get_session
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
from app.schemas.common import BaseResponse, DataResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=DataResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    """Register a new user account and send verification OTP."""
    service = AuthService(session)
    user = await service.register(data)
    return DataResponse(
        message="Registration successful. Please check your email for the verification OTP.",
        data=UserResponse.model_validate(user),
    )


@router.post("/verify-email", response_model=DataResponse[UserResponse])
async def verify_email(
    data: VerifyOTPRequest,
    session: AsyncSession = Depends(get_session),
):
    """Verify email address using OTP."""
    service = AuthService(session)
    user = await service.verify_email(data)
    return DataResponse(
        message="Email verified successfully.",
        data=UserResponse.model_validate(user),
    )


@router.post("/resend-otp", response_model=BaseResponse)
async def resend_otp(
    data: ResendOTPRequest,
    session: AsyncSession = Depends(get_session),
):
    """Resend email verification OTP."""
    service = AuthService(session)
    await service.resend_otp(data)
    return BaseResponse(message="A new OTP has been sent to your email.")


@router.post("/login")
async def login(
    data: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    """Login with email and password. Returns JWT access + refresh tokens."""
    service = AuthService(session)
    result = await service.login(data)
    return DataResponse(
        message="Login successful.",
        data={
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
            "user": UserResponse.model_validate(result["user"]),
        },
    )


@router.post("/refresh")
async def refresh_token(
    data: RefreshRequest,
    session: AsyncSession = Depends(get_session),
):
    """Exchange a refresh token for a new access token."""
    service = AuthService(session)
    access_token = await service.refresh_token(data)
    return DataResponse(
        message="Token refreshed.",
        data={"access_token": access_token, "token_type": "bearer"},
    )


@router.post("/forgot-password", response_model=BaseResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    """Send password reset OTP to registered email."""
    service = AuthService(session)
    await service.forgot_password(data)
    return BaseResponse(
        message="If that email is registered, you will receive a password reset OTP shortly."
    )


@router.post("/reset-password", response_model=BaseResponse)
async def reset_password(
    data: ResetPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    """Reset password using OTP."""
    service = AuthService(session)
    await service.reset_password(data)
    return BaseResponse(message="Password reset successfully. Please log in.")


@router.post("/change-password", response_model=BaseResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Change password for the authenticated user."""
    service = AuthService(session)
    await service.change_password(current_user, data)
    return BaseResponse(message="Password changed successfully.")


@router.get("/me", response_model=DataResponse[UserResponse])
async def get_me(current_user=Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return DataResponse(
        message="OK",
        data=UserResponse.model_validate(current_user),
    )
