"""OTP generation utility."""

import random
import string
from datetime import datetime, timedelta, timezone

from app.core.config import settings


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def otp_expiry() -> datetime:
    """Return the OTP expiry datetime."""
    return datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
