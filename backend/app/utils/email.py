"""Email sending utility — console logging by default, SMTP when configured."""

import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
) -> bool:
    """
    Send an email. If SMTP_ENABLED=true, sends via SMTP.
    Otherwise logs to console (development mode).
    """
    if not settings.SMTP_ENABLED:
        # Console mode — print to logs for development
        logger.info("=" * 60)
        logger.info("📧 EMAIL (Console Mode)")
        logger.info(f"   To:      {to_email}")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   Body:    {body_text or body_html}")
        logger.info("=" * 60)
        return True

    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        message["To"] = to_email

        if body_text:
            message.attach(MIMEText(body_text, "plain"))
        message.attach(MIMEText(body_html, "html"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_verification_otp(email: str, otp: str, full_name: str) -> bool:
    subject = "Verify your Smart Log Analyzer account"
    body_html = f"""
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #f8fafc; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1; margin-bottom: 8px;">Smart Log Analyzer</h1>
        <h2 style="font-weight: 500; margin-bottom: 24px;">Verify your email address</h2>
        <p>Hi {full_name},</p>
        <p>Welcome! Please use the OTP below to verify your email address.</p>
        <div style="background: #1a1a2e; border: 1px solid #6366f1; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #6366f1;">{otp}</span>
        </div>
        <p style="color: #94a3b8;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
    </div>
    """
    body_text = f"Your Smart Log Analyzer verification OTP is: {otp}\n\nThis expires in 10 minutes."
    return await send_email(email, subject, body_html, body_text)


async def send_password_reset_otp(email: str, otp: str, full_name: str) -> bool:
    subject = "Reset your Smart Log Analyzer password"
    body_html = f"""
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #f8fafc; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1; margin-bottom: 8px;">Smart Log Analyzer</h1>
        <h2 style="font-weight: 500; margin-bottom: 24px;">Password Reset Request</h2>
        <p>Hi {full_name},</p>
        <p>You requested to reset your password. Use the OTP below to proceed.</p>
        <div style="background: #1a1a2e; border: 1px solid #ef4444; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #ef4444;">{otp}</span>
        </div>
        <p style="color: #94a3b8;">This OTP expires in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>
    """
    body_text = f"Your Smart Log Analyzer password reset OTP is: {otp}\n\nThis expires in 10 minutes."
    return await send_email(email, subject, body_html, body_text)
