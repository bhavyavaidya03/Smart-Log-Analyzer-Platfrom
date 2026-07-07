"""User-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str
    role: UserRole
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str]
    bio: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        str_strip_whitespace = True


class UserListResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
