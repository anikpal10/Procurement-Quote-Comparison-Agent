from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.auth_models import AuthSession, GoogleAccount, PasswordResetToken, User
from app.auth_schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleCallbackRequest,
    LoginRequest,
    LoginResponse,
    ResetPasswordRequest,
    SessionResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.config import settings
from app.database import get_db
from app.email_service import (
    recent_sent_emails,
    send_password_changed_notification,
    send_password_reset_email,
)
from app.security import (
    create_user_session,
    delete_session_cookie,
    generate_secure_token,
    get_current_user,
    get_current_user_and_session,
    hash_password,
    hash_token,
    log_audit_event,
    set_session_cookie,
    utc_now,
    verify_password,
)

logger = logging.getLogger("procureai.auth")
router = APIRouter(prefix="/v1/auth", tags=["Authentication"])


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


@router.post("/login", response_model=LoginResponse)
def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    identifier = req.username_or_email.strip().lower()

    # Search by username or email
    user = (
        db.query(User)
        .filter(
            (User.username.ilike(identifier)) | (User.email.ilike(identifier))
        )
        .first()
    )

    if not user:
        log_audit_event(
            db,
            "LOGIN_FAILED",
            request=request,
            details=f"User identifier not found: {identifier}",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
        )

    # 1. Check account status
    if user.account_status == "INACTIVE":
        log_audit_event(
            db,
            "LOGIN_FAILED_INACTIVE",
            user_id=user.id,
            request=request,
            details="Attempted login to deactivated account",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your employee account has been deactivated. Please contact your procurement administrator.",
        )

    # 2. Check lockout policy (5 failed attempts -> 15 min lock)
    now = utc_now()
    if user.lockout_until:
        lockout = user.lockout_until
        if lockout.tzinfo is None:
            lockout = lockout.replace(tzinfo=now.tzinfo)

        if lockout > now:
            mins_left = max(1, int((lockout - now).total_seconds() / 60))
            log_audit_event(
                db,
                "LOGIN_LOCKED_ATTEMPT",
                user_id=user.id,
                request=request,
                details=f"Login attempt while locked ({mins_left}m remaining)",
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is temporarily locked due to repeated failed login attempts. Please try again in {mins_left} minute(s) or contact your administrator.",
            )
        else:
            # Lockout expired, reset attempts
            user.lockout_until = None
            user.failed_login_attempts = 0
            if user.account_status == "LOCKED":
                user.account_status = "ACTIVE"
            db.commit()

    # 3. Verify Argon2id password
    if not verify_password(req.password, user.password_hash):
        user.failed_login_attempts += 1
        details = f"Failed attempt {user.failed_login_attempts}/5"

        if user.failed_login_attempts >= 5:
            user.lockout_until = now + timedelta(minutes=15)
            user.account_status = "LOCKED"
            details = "5 failed attempts exceeded. Account locked for 15 minutes."
            log_audit_event(
                db, "ACCOUNT_LOCKED", user_id=user.id, request=request, details=details
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is temporarily locked due to repeated failed login attempts. Please try again in 15 minute(s) or contact your administrator.",
            )
        else:
            log_audit_event(
                db, "LOGIN_FAILED", user_id=user.id, request=request, details=details
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password.",
            )

    # 4. Successful login
    user.failed_login_attempts = 0
    user.lockout_until = None
    if user.account_status == "LOCKED":
        user.account_status = "ACTIVE"
    db.commit()

    # Create server session and set HttpOnly cookie
    raw_token, session = create_user_session(db, user, req.remember_me, request)
    set_session_cookie(response, raw_token, req.remember_me)

    log_audit_event(
        db,
        "LOGIN_SUCCESS",
        user_id=user.id,
        request=request,
        details=f"Role: {user.role}, RememberMe: {req.remember_me}",
    )

    return LoginResponse(
        user=build_user_response(user, db),
        session_token=raw_token,
        expires_at=session.expires_at,
        message="Sign in successful. Redirecting to ProcureAI workspace...",
    )


@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    user_and_session: tuple[User, AuthSession] = Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    user, session = user_and_session
    db.delete(session)
    db.commit()
    delete_session_cookie(response)
    log_audit_event(db, "LOGOUT", user_id=user.id, request=request, details="Session ended")
    return {"message": "Logged out successfully"}


@router.post("/logout-all")
def logout_all_devices(
    response: Response,
    request: Request,
    user_and_session: tuple[User, AuthSession] = Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    user, _ = user_and_session
    # Revoke all sessions for this user
    deleted_count = (
        db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
    )
    db.commit()
    delete_session_cookie(response)
    log_audit_event(
        db,
        "LOGOUT_ALL_DEVICES",
        user_id=user.id,
        request=request,
        details=f"Revoked {deleted_count} active sessions",
    )
    return {
        "message": f"Successfully signed out from all {deleted_count} active devices.",
        "revoked_count": deleted_count,
        "status": "success",
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_user_response(current_user, db)


@router.post("/forgot-password")
def forgot_password(
    req: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(email)).first()

    reset_token_raw = None
    if user and user.account_status == "ACTIVE":
        # Invalidate previous unconsumed tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        ).delete()

        reset_token_raw = generate_secure_token()
        token_hash = hash_token(reset_token_raw)
        expires_at = utc_now() + timedelta(minutes=settings.reset_token_expire_minutes)

        token_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=utc_now(),
        )
        db.add(token_record)
        db.commit()

        send_password_reset_email(user.email, user.username, reset_token_raw)
        log_audit_event(
            db,
            "PASSWORD_RESET_REQUESTED",
            user_id=user.id,
            request=request,
            details=f"Reset link sent to {email}",
        )
    else:
        log_audit_event(
            db,
            "PASSWORD_RESET_REQUESTED_UNKNOWN",
            request=request,
            details=f"Attempted reset for unregistered/inactive email: {email}",
        )

    # Security requirement: Never reveal whether an email address is registered
    response_payload: Dict[str, Any] = {
        "message": "If an account exists with this email address, a password reset link has been dispatched.",
        "expires_in_minutes": settings.reset_token_expire_minutes,
    }

    # For testing convenience:
    if reset_token_raw:
        response_payload["dev_reset_token"] = reset_token_raw
        response_payload["dev_test_reset_token"] = reset_token_raw
        response_payload["dev_test_reset_url"] = (
            f"{settings.frontend_url}/reset-password?token={reset_token_raw}"
        )

    return response_payload


@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    if req.confirm_password and req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match.",
        )

    token_hash = hash_token(req.token.strip())
    token_record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unrecognized password reset token. Please request a new link.",
        )

    if token_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used and is no longer valid.",
        )

    expiry = token_record.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry <= utc_now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new link.",
        )

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this token was not found.",
        )

    # Update password hash
    user.password_hash = hash_password(req.new_password)
    user.failed_login_attempts = 0
    user.lockout_until = None
    if user.account_status == "LOCKED":
        user.account_status = "ACTIVE"

    # Mark token used
    token_record.used_at = utc_now()

    # Invalidate all existing sessions (Security requirement 11)
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
    db.commit()

    # Send security notification email
    send_password_changed_notification(user.email, user.username)

    log_audit_event(
        db,
        "PASSWORD_RESET_COMPLETED",
        user_id=user.id,
        request=request,
        details="Password reset token consumed and password updated",
    )

    return {
        "message": "Password changed successfully! You can now log in with your new credentials."
    }


@router.get("/sessions", response_model=List[SessionResponse])
def get_user_sessions(
    user_and_session: tuple[User, AuthSession] = Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    user, current_session = user_and_session
    sessions = (
        db.query(AuthSession)
        .filter(AuthSession.user_id == user.id)
        .order_by(AuthSession.created_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        resp = SessionResponse.model_validate(s)
        resp.is_current = s.id == current_session.id
        result.append(resp)
    return result


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: str,
    request: Request,
    user_and_session: tuple[User, AuthSession] = Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    user, current_session = user_and_session
    target = (
        db.query(AuthSession)
        .filter(AuthSession.id == session_id, AuthSession.user_id == user.id)
        .first()
    )
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    is_current = target.id == current_session.id
    db.delete(target)
    db.commit()

    log_audit_event(
        db,
        "SESSION_REVOKED",
        user_id=user.id,
        request=request,
        details=f"Revoked session {session_id}",
    )
    return {
        "message": "Session revoked successfully",
        "was_current_session": is_current,
    }


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.full_name = req.full_name.strip()
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user, db)


@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    request: Request,
    user_and_session: tuple[User, AuthSession] = Depends(get_current_user_and_session),
    db: Session = Depends(get_db),
):
    user, current_session = user_and_session

    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match.",
        )

    user.password_hash = hash_password(req.new_password)

    # Invalidate other active sessions for safety
    db.query(AuthSession).filter(
        AuthSession.user_id == user.id, AuthSession.id != current_session.id
    ).delete()
    db.commit()

    send_password_changed_notification(user.email, user.username)
    log_audit_event(
        db,
        "PASSWORD_CHANGED",
        user_id=user.id,
        request=request,
        details="Password updated via account settings",
    )
    return {"message": "Password updated successfully."}


# =========================================================================
# GOOGLE OAUTH 2.0 / OPENID CONNECT ENDPOINTS
# =========================================================================


@router.get("/google/url")
def get_google_auth_url():
    client_id = settings.google_client_id
    if not client_id:
        # Development simulated mode fallback
        return {
            "configured": False,
            "auth_url": f"{settings.frontend_url}/auth/callback/google?simulated=true",
            "message": "Google Client ID not configured. Simulated Google Sign-In available for local testing.",
        }

    redirect_uri = settings.google_redirect_uri
    scope = "openid email profile"
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"redirect_uri={redirect_uri}&"
        f"prompt=select_account"
    )
    return {"configured": True, "auth_url": url}


@router.post("/google/callback", response_model=LoginResponse)
def google_callback(
    req: GoogleCallbackRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    google_sub: str = ""
    google_email: str = ""
    google_name: str = ""

    # 1. Real Google ID Token verification if credential provided
    if req.credential and settings.google_client_id:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            id_info = id_token.verify_oauth2_token(
                req.credential, google_requests.Request(), settings.google_client_id
            )
            google_sub = id_info["sub"]
            google_email = id_info["email"].lower()
            google_name = id_info.get("name", "Google User")
            if not id_info.get("email_verified", False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google account email is not verified.",
                )
        except Exception as e:
            logger.error(f"Google ID token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Google ID token: {str(e)}",
            )
    else:
        # 2. Simulated Google Sign-In for local development / testing
        # Matches existing employee email or admin email
        simulated_email = "admin@procureai.internal"
        user_target = db.query(User).filter(User.email == simulated_email).first()
        if not user_target:
            user_target = db.query(User).first()

        if user_target:
            google_sub = f"google-simulated-{user_target.id[:8]}"
            google_email = user_target.email
            google_name = user_target.full_name
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No employee accounts exist to complete Google sign-in.",
            )

    # 3. Administrator-controlled account policy
    # Check if google_sub is already linked
    linked_acc = (
        db.query(GoogleAccount)
        .filter(GoogleAccount.google_subject_id == google_sub)
        .first()
    )

    if linked_acc:
        user = db.query(User).filter(User.id == linked_acc.user_id).first()
    else:
        # Check if an existing employee user has this email
        user = db.query(User).filter(User.email.ilike(google_email)).first()
        if user:
            # Securely link the Google account to this verified existing employee
            new_google_link = GoogleAccount(
                user_id=user.id,
                google_subject_id=google_sub,
                google_email=google_email,
                linked_at=utc_now(),
            )
            db.add(new_google_link)
            db.commit()
            log_audit_event(
                db,
                "GOOGLE_LINKED",
                user_id=user.id,
                request=request,
                details=f"Linked Google account sub {google_sub} to employee {user.email}",
            )
        else:
            # Policy check: Administrator controls employee account creation
            if settings.allow_google_auto_provision:
                username_candidate = google_email.split("@")[0][:20]
                user = User(
                    username=username_candidate,
                    email=google_email,
                    full_name=google_name,
                    password_hash=hash_password(generate_secure_token()),
                    role="Buyer",
                    account_status="ACTIVE",
                    created_at=utc_now(),
                    updated_at=utc_now(),
                )
                db.add(user)
                db.commit()
                db.refresh(user)

                new_google_link = GoogleAccount(
                    user_id=user.id,
                    google_subject_id=google_sub,
                    google_email=google_email,
                    linked_at=utc_now(),
                )
                db.add(new_google_link)
                db.commit()
            else:
                log_audit_event(
                    db,
                    "GOOGLE_LOGIN_REJECTED_UNREGISTERED",
                    request=request,
                    details=f"Unregistered Google email: {google_email}",
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"The Google account ({google_email}) is not registered in ProcureAI. Please ask an administrator to create your employee account first.",
                )

    if not user or user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is inactive or suspended. Contact an administrator.",
        )

    # Start application session
    raw_token, session = create_user_session(db, user, remember_me=True, request=request)
    set_session_cookie(response, raw_token, remember_me=True)

    log_audit_event(
        db,
        "LOGIN_SUCCESS_GOOGLE",
        user_id=user.id,
        request=request,
        details=f"Authenticated via Google OAuth ({google_email})",
    )

    return LoginResponse(
        user=build_user_response(user, db),
        session_token=raw_token,
        expires_at=session.expires_at,
        message="Google sign in successful. Redirecting...",
    )


@router.get("/dev-emails")
def get_dev_sent_emails(current_user: User = Depends(get_current_user)):
    """Developer aid to inspect recently dispatched reset links when SMTP is not configured."""
    return recent_sent_emails
