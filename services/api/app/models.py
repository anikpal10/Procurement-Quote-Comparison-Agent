from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class CaseStatus(str, Enum):
    CREATED = "CREATED"
    UPLOADING = "UPLOADING"
    QUEUED = "QUEUED"
    EXTRACTING = "EXTRACTING"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    COMPARABLE = "COMPARABLE"
    APPROVED = "APPROVED"
    EXPORTED = "EXPORTED"
    FAILED = "FAILED"
    RETRYABLE = "RETRYABLE"
    CANCELLED = "CANCELLED"


class UserRole(str, Enum):
    BUYER = "BUYER"
    REVIEWER = "REVIEWER"
    ADMINISTRATOR = "ADMINISTRATOR"


class ProcurementRequirement(BaseModel):
    name: str = Field(..., description="Requirement or product name")
    quantity: Optional[str] = Field(default=None, description="Requested quantity as string for future Decimal support")
    unit: Optional[str] = None
    mandatory: bool = True
    technical_specs: List[str] = Field(default_factory=list)


class ProcurementCase(BaseModel):
    case_id: str
    tenant_id: str
    owner_id: str
    status: CaseStatus = CaseStatus.CREATED
    base_currency: str = "GBP"
    requirements: List[ProcurementRequirement] = Field(default_factory=list)
    quote_refs: List[str] = Field(default_factory=list)
    created_at: datetime
    version: int = 1


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str
