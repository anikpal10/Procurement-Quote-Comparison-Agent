import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False, default="")
    role = Column(String(32), nullable=False, default="Buyer")  # Administrator, Procurement Manager, Buyer, Finance Reviewer
    account_status = Column(String(16), nullable=False, default="ACTIVE")  # ACTIVE, INACTIVE, LOCKED
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    lockout_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    google_account = relationship("GoogleAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    session_token_hash = Column(String(64), unique=True, index=True, nullable=False)
    remember_me = Column(Boolean, nullable=False, default=False)
    ip_address = Column(String(45), nullable=True)
    device_info = Column(String(255), nullable=True)
    expires_at = Column(DateTime, index=True, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="sessions")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, index=True, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="reset_tokens")


class LoginAudit(Base):
    __tablename__ = "login_audits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    event_type = Column(String(32), index=True, nullable=False)  # LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.
    timestamp = Column(DateTime, index=True, nullable=False, default=utc_now)
    ip_address = Column(String(45), nullable=True)
    device_info = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)


class GoogleAccount(Base):
    __tablename__ = "google_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    google_subject_id = Column(String(128), unique=True, index=True, nullable=False)
    google_email = Column(String(255), nullable=False)
    linked_at = Column(DateTime, nullable=False, default=utc_now)

    user = relationship("User", back_populates="google_account")
