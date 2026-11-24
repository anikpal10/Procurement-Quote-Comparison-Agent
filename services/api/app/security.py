import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import argon2
from fastapi import Cookie, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.auth_models import AuthSession, LoginAudit, User
from app.config import settings
from app.database import get_db

ph = argon2.PasswordHasher()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except Exception:
        return False


def generate_secure_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "unknown")[:255]


def log_audit_event(
    db: Session,
    event_type: str,
    user_id: Optional[str] = None,
    request: Optional[Request] = None,
    details: Optional[str] = None,
) -> LoginAudit:
    ip_addr = get_client_ip(request) if request else "unknown"
    agent = get_user_agent(request) if request else "unknown"
    audit = LoginAudit(
        user_id=user_id,
        event_type=event_type,
        ip_address=ip_addr,
        device_info=agent,
        details=details,
        timestamp=utc_now(),
    )
    db.add(audit)
    db.commit()
    return audit


def create_user_session(
    db: Session,
    user: User,
    remember_me: bool,
    request: Optional[Request] = None,
) -> tuple[str, AuthSession]:
    raw_token = generate_secure_token()
    token_hash = hash_token(raw_token)

    if remember_me:
        expires_at = utc_now() + timedelta(days=settings.remember_me_expire_days)
    else:
        expires_at = utc_now() + timedelta(hours=settings.session_expire_hours)

    session = AuthSession(
        user_id=user.id,
        session_token_hash=token_hash,
        remember_me=remember_me,
        ip_address=get_client_ip(request) if request else None,
        device_info=get_user_agent(request) if request else None,
        expires_at=expires_at,
        created_at=utc_now(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return raw_token, session


def set_session_cookie(response: Response, token: str, remember_me: bool) -> None:
    max_age = (
        settings.remember_me_expire_days * 86400
        if remember_me
        else settings.session_expire_hours * 3600
    )
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=settings.session_cookie_secure,
        path="/",
    )


def delete_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.session_cookie_secure,
    )


def get_session_token(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    # 1. First check HttpOnly cookie
    cookie_token = request.cookies.get(settings.session_cookie_name)
    if cookie_token:
        return cookie_token

    # 2. Check Authorization Bearer header
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:].strip()

    return None


def get_current_user_and_session(
    token: Optional[str] = Depends(get_session_token),
    db: Session = Depends(get_db),
) -> tuple[User, AuthSession]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )

    token_hash = hash_token(token)
    session = (
        db.query(AuthSession)
        .filter(AuthSession.session_token_hash == token_hash)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again.",
        )

    # Check expiration
    # Ensure timezone awareness comparison
    session_expiry = session.expires_at
    if session_expiry.tzinfo is None:
        session_expiry = session_expiry.replace(tzinfo=timezone.utc)

    if session_expiry <= utc_now():
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please log in again.",
        )

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    if user.account_status == "INACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated by an administrator.",
        )

    if user.account_status == "LOCKED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is locked. Please contact your administrator.",
        )

    return user, session


def get_current_user(
    user_and_session: tuple[User, AuthSession] = Depends(get_current_user_and_session),
) -> User:
    return user_and_session[0]


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)} (Your role: {current_user.role})",
            )
        return current_user

    return role_checker
