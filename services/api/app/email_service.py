import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any, Dict, List, Optional
from app.config import settings

logger = logging.getLogger("procureai.email")

# In-memory store of recent dispatched emails for developer inspection / testing
recent_sent_emails: List[Dict[str, Any]] = []


def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
) -> bool:
    message_record = {
        "to": to_email,
        "subject": subject,
        "body_text": body_text,
        "body_html": body_html,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "delivered_via": "smtp" if settings.smtp_host else "local_logger",
    }
    recent_sent_emails.append(message_record)
    if len(recent_sent_emails) > 50:
        recent_sent_emails.pop(0)

    # 1. If SMTP server configured, attempt actual network delivery
    if settings.smtp_host:
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = settings.smtp_from
            msg["To"] = to_email
            msg.set_content(body_text)

            if body_html:
                msg.add_alternative(body_html, subtype="html")

            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            if settings.smtp_tls:
                server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
            server.quit()
            logger.info(f"Email delivered via SMTP to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            # Fall back to local logger
            pass

    # 2. Local development fallback logging
    logger.info("=" * 60)
    logger.info(f"[EMAIL NOTIFICATION DISPATCHED] -> {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info("-" * 60)
    logger.info(body_text)
    logger.info("=" * 60)
    return True


def send_password_reset_email(to_email: str, username: str, reset_token: str) -> bool:
    reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
    subject = "ProcureAI: Password Reset Request"

    body_text = f"""Hello {username},

We received a request to reset your password for your ProcureAI employee account.

To set a new password, click the link below (valid for {settings.reset_token_expire_minutes} minutes):
{reset_link}

If you did not request this password reset, please ignore this email or notify your system administrator immediately.
For your security, this single-use link will expire automatically.

ProcureAI Enterprise Security Team
"""

    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="background: #0369a1; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">KK</div>
            <h2 style="margin: 0 0 0 10px; color: #0f172a; font-size: 20px;">Procure<span style="color: #0284c7;">AI</span></h2>
        </div>
        <h3 style="color: #0f172a; font-size: 16px;">Password Reset Request</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{username}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a request to reset your password for your ProcureAI account. Click the button below to choose a new password:</p>
        <div style="margin: 28px 0;">
            <a href="{reset_link}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset My Password &rarr;</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">This single-use link is valid for {settings.reset_token_expire_minutes} minutes. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px;">ProcureAI Enterprise Security &bull; Confidential Internal System</p>
    </div>
    """

    return send_email(to_email, subject, body_text, body_html)


def send_password_changed_notification(to_email: str, username: str) -> bool:
    subject = "ProcureAI Security Alert: Your Password Was Changed"
    body_text = f"""Hello {username},

This is a confirmation that the password for your ProcureAI account ({to_email}) was just successfully updated.

If you made this change, no further action is required.
If you did NOT change your password, contact your company's procurement administrator immediately to secure your account.

ProcureAI Enterprise Security Team
"""
    return send_email(to_email, subject, body_text)


def send_new_employee_welcome_email(
    to_email: str,
    username: str,
    role: str,
    temp_password: Optional[str] = None,
    reset_token: Optional[str] = None,
) -> bool:
    subject = "Welcome to ProcureAI: Employee Account Activated"

    action_text = ""
    if reset_token:
        setup_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
        action_text = f"Please set up your personal password using this secure link:\n{setup_link}"
    elif temp_password:
        action_text = f"Your temporary password is: {temp_password}\nPlease sign in and change your password immediately."

    body_text = f"""Hello {username},

An employee account has been created for you on ProcureAI with the role: {role}.

Username: {username}
Email: {to_email}

{action_text}

Login at: {settings.frontend_url}/login

ProcureAI Procurement Administration
"""
    return send_email(to_email, subject, body_text)
