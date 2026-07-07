"""User management API routes."""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_active_admin, get_current_verified_user
from app.db.session import get_session
from app.repositories.user_repository import UserRepository
from app.schemas.common import DataResponse, PaginatedResponse
from app.schemas.user import UpdateProfileRequest, UserListResponse, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.get("/me", response_model=DataResponse[UserResponse])
async def get_profile(current_user=Depends(get_current_verified_user)):
    """Get the authenticated user's profile."""
    return DataResponse(data=UserResponse.model_validate(current_user))


@router.patch("/me", response_model=DataResponse[UserResponse])
async def update_profile(
    data: UpdateProfileRequest,
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Update the authenticated user's profile."""
    repo = UserRepository(session)

    # Check username uniqueness if changing
    if data.username and data.username != current_user.username:
        existing = await repo.get_by_username(data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken.",
            )

    user = await repo.update(
        current_user,
        full_name=data.full_name,
        username=data.username,
        bio=data.bio,
    )
    return DataResponse(
        message="Profile updated successfully.",
        data=UserResponse.model_validate(user),
    )


@router.post("/me/avatar", response_model=DataResponse[UserResponse])
async def upload_avatar(
    file: UploadFile = File(...),
    current_user=Depends(get_current_verified_user),
    session: AsyncSession = Depends(get_session),
):
    """Upload a profile picture."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only JPEG, PNG, GIF, and WebP images are allowed.",
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5MB limit for avatars
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar image must be under 5MB.",
        )

    # Save to uploads/avatars/
    avatar_dir = Path(settings.UPLOAD_DIR) / "avatars"
    avatar_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix or ".jpg"
    filename = f"{current_user.id}{ext}"
    file_path = avatar_dir / filename

    import aiofiles
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    avatar_url = f"/uploads/avatars/{filename}"
    repo = UserRepository(session)
    user = await repo.update(current_user, avatar_url=avatar_url)
    return DataResponse(
        message="Avatar uploaded successfully.",
        data=UserResponse.model_validate(user),
    )


# ── Admin Routes ──────────────────────────────────────────────────────────────
@router.get("", response_model=PaginatedResponse[UserListResponse])
async def list_users(
    page: int = 1,
    page_size: int = 20,
    _admin=Depends(get_current_active_admin),
    session: AsyncSession = Depends(get_session),
):
    """List all users (admin only)."""
    repo = UserRepository(session)
    skip = (page - 1) * page_size
    users = await repo.get_all(skip=skip, limit=page_size)
    total = await repo.count()
    import math

    return PaginatedResponse(
        data=[UserListResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
    )
