"""Package marker — imports all models so Alembic can discover them."""

from app.db.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.uploaded_log import UploadedLog  # noqa: F401
from app.models.parsed_log import ParsedLog  # noqa: F401
from app.models.otp_verification import OTPVerification  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401
