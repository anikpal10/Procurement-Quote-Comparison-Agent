from datetime import timedelta
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.auth_models import AuthSession, GoogleAccount, LoginAudit, PasswordResetToken, User
from app.auth_schemas import (
    AuditLogResponse,
    CreateUserRequest,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    UserResponse,
)
from app.config import settings
from app.database import get_db
from app.email_service import send_new_employee_welcome_email
from app.security import (
    generate_secure_token,
    hash_password,
    hash_token,
    log_audit_event,
    require_role,
    utc_now,
)

logger = logging.getLogger("procureai.admin")
router = APIRouter(prefix="/v1/admin", tags=["Administrator Management"])


def build_user_response(user: User, db: Session) -> UserResponse:
    google_linked = (
        db.query(GoogleAccount).filter(GoogleAccount.user_id == user.id).first()
        is not None
    )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        account_status=user.account_status,
        is_google_linked=google_linked,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get(
    "/users",
    response_model=List[UserResponse],
    dependencies=[Depends(require_role(["Administrator"]))],
)
def list_employees(
    status_filter: Optional[str] = Query(None),
    role_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if status_filter:
        query = query.filter(User.account_status == status_filter)
    if role_filter:
        query = query.filter(User.role == role_filter)

    users = query.order_by(User.created_at.desc()).all()
    return [build_user_response(u, db) for u in users]


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["Administrator"]))],
)
def create_employee_account(
    req: CreateUserRequest,
    request: Request,
    admin_user: User = Depends(require_role(["Administrator"])),
    db: Session = Depends(get_db),
):
    username_clean = req.username.strip().lower()
    email_clean = req.email.strip().lower()

    # 1. Uniqueness validation
    if db.query(User).filter(User.username.ilike(username_clean)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{req.username}' is already in use by another employee.",
        )

    if db.query(User).filter(User.email.ilike(email_clean)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{req.email}' is already registered in the system.",
        )

    # 2. Determine password
    raw_pass = req.initial_password
    reset_token_raw = None

    if not raw_pass:
        # Generate temporary secure password and setup token
        raw_pass = generate_secure_token()[:12] + "Aa1!"
        reset_token_raw = generate_secure_token()

    hashed_pass = hash_password(raw_pass)

    new_user = User(
        username=username_clean,
        email=email_clean,
        full_name=req.full_name.strip(),
        password_hash=hashed_pass,
        role=req.role,
        account_status="ACTIVE",
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Create initial setup token if needed
    if reset_token_raw:
        token_hash = hash_token(reset_token_raw)
        token_record = PasswordResetToken(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=utc_now() + timedelta(days=2),
            created_at=utc_now(),
        )
        db.add(token_record)
        db.commit()

    # 4. Optional notification email
    if req.send_welcome_email:
        send_new_employee_welcome_email(
            to_email=new_user.email,
            username=new_user.username,
            role=new_user.role,
            temp_password=raw_pass if req.initial_password else None,
            reset_token=reset_token_raw,
        )

    log_audit_event(
        db,
        "USER_CREATED",
        user_id=new_user.id,
        request=request,
        details=f"Created by Admin {admin_user.username} with role {new_user.role}",
    )

    return build_user_response(new_user, db)


@router.put(
    "/users/{user_id}/status",
    response_model=UserResponse,
    dependencies=[Depends(require_role(["Administrator"]))],
)
def update_employee_status(
    user_id: str,
    req: UpdateUserStatusRequest,
    request: Request,
    admin_user: User = Depends(require_role(["Administrator"])),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee user not found."
        )

    if target.id == admin_user.id and req.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate or lock your own administrator account.",
        )

    old_status = target.account_status
    target.account_status = req.account_status

    if req.account_status == "ACTIVE":
        target.failed_login_attempts = 0
        target.lockout_until = None
    elif req.account_status in ["INACTIVE", "LOCKED"]:
        # Invalidate sessions when deactivated
        db.query(AuthSession).filter(AuthSession.user_id == target.id).delete()

    db.commit()
    db.refresh(target)

    log_audit_event(
        db,
        "STATUS_CHANGED",
        user_id=target.id,
        request=request,
        details=f"Status changed from {old_status} to {req.account_status} by {admin_user.username}",
    )

    return build_user_response(target, db)


@router.put(
    "/users/{user_id}/role",
    response_model=UserResponse,
    dependencies=[Depends(require_role(["Administrator"]))],
)
def update_employee_role(
    user_id: str,
    req: UpdateUserRoleRequest,
    request: Request,
    admin_user: User = Depends(require_role(["Administrator"])),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee user not found."
        )

    old_role = target.role
    target.role = req.role
    db.commit()
    db.refresh(target)

    log_audit_event(
        db,
        "ROLE_CHANGED",
        user_id=target.id,
        request=request,
        details=f"Role changed from {old_role} to {req.role} by {admin_user.username}",
    )

    return build_user_response(target, db)


@router.post(
    "/users/{user_id}/trigger-reset",
    dependencies=[Depends(require_role(["Administrator"]))],
)
def trigger_employee_password_reset(
    user_id: str,
    request: Request,
    admin_user: User = Depends(require_role(["Administrator"])),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee user not found."
        )

    # Invalidate previous tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == target.id,
        PasswordResetToken.used_at.is_(None),
    ).delete()

    reset_token_raw = generate_secure_token()
    token_hash = hash_token(reset_token_raw)
    expires_at = utc_now() + timedelta(minutes=settings.reset_token_expire_minutes)

    token_record = PasswordResetToken(
        user_id=target.id,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=utc_now(),
    )
    db.add(token_record)
    db.commit()

    from app.email_service import send_password_reset_email

    send_password_reset_email(target.email, target.username, reset_token_raw)

    log_audit_event(
        db,
        "ADMIN_TRIGGERED_RESET",
        user_id=target.id,
        request=request,
        details=f"Admin {admin_user.username} triggered password reset for {target.username}",
    )

    payload = {
        "message": f"Password reset email dispatched to {target.email}.",
    }
    if not settings.smtp_host:
        payload["dev_test_reset_token"] = reset_token_raw
        payload["dev_test_reset_url"] = (
            f"{settings.frontend_url}/reset-password?token={reset_token_raw}"
        )

    return payload


@router.post(
    "/users/{user_id}/revoke-sessions",
    dependencies=[Depends(require_role(["Administrator"]))],
)
def revoke_employee_sessions(
    user_id: str,
    request: Request,
    admin_user: User = Depends(require_role(["Administrator"])),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee user not found."
        )

    deleted_count = (
        db.query(AuthSession).filter(AuthSession.user_id == target.id).delete()
    )
    db.commit()

    log_audit_event(
        db,
        "ADMIN_REVOKED_SESSIONS",
        user_id=target.id,
        request=request,
        details=f"Admin {admin_user.username} revoked {deleted_count} sessions for {target.username}",
    )

    return {
        "message": f"Successfully revoked {deleted_count} active sessions for {target.username}."
    }


@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role(["Administrator"]))],
)
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    event_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(LoginAudit)
    if event_filter:
        query = query.filter(LoginAudit.event_type == event_filter)

    logs = query.order_by(LoginAudit.timestamp.desc()).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
