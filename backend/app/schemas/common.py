"""Common/shared Pydantic schemas."""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

DataT = TypeVar("DataT")


class BaseResponse(BaseModel):
    """Standard API response envelope."""
    success: bool = True
    message: str = "OK"


class DataResponse(BaseResponse, Generic[DataT]):
    """Response with a data payload."""
    data: DataT


class PaginatedResponse(BaseResponse, Generic[DataT]):
    """Paginated list response."""
    data: List[DataT]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    message: str
    detail: Optional[Any] = None
