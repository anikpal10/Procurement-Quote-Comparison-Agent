from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field

UserRole = Literal["Administrator", "Procurement Manager", "Buyer", "Finance Reviewer"]
UserStatus = Literal["ACTIVE", "INACTIVE", "LOCKED", "SUSPENDED"]


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    account_status: str
    is_google_linked: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    remember_me: bool = False


class LoginResponse(BaseModel):
    user: UserResponse
    session_token: str
    expires_at: datetime
    message: str = "Login successful"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128)


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=128)
    role: UserRole = "Buyer"
    initial_password: Optional[str] = Field(None, min_length=8, max_length=128)
    send_welcome_email: bool = True


class UpdateUserStatusRequest(BaseModel):
    account_status: UserStatus


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class SessionResponse(BaseModel):
    id: str
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    remember_me: bool
    created_at: datetime
    expires_at: datetime
    is_current: bool = False

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    event_type: str
    timestamp: datetime
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True


class GoogleCallbackRequest(BaseModel):
    code: Optional[str] = None
    credential: Optional[str] = None
    redirect_uri: Optional[str] = None
