from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "ProcureAI API"
    app_env: str = "local"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    gemini_api_key: str = "your_gemini_api_key"
    gemini_model: str = "gemini-3.1-flash-lite"
    default_tenant_id: str = "tenant-local"
    default_base_currency: str = "GBP"

    # Database & Authentication
    database_url: str = "sqlite:///./procureai.db"
    session_secret_key: str = "procureai_session_secret_key_prod_2026_xyz"
    session_cookie_name: str = "procureai_session"
    session_cookie_secure: bool = False
    session_expire_hours: int = 24
    remember_me_expire_days: int = 30
    reset_token_expire_minutes: int = 60
    frontend_url: str = "http://localhost:3000"

    # Email / SMTP
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: str = "noreply@procureai.internal"
    smtp_tls: bool = True

    # Google OAuth / OpenID Connect
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:3000/auth/callback/google"
    allow_google_auto_provision: bool = False

    model_config = SettingsConfigDict(
        env_file=(".env", str(_REPO_ROOT / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
