from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from ..domain.enums import ApprovalStatus, ApprovalType


class ApprovalRead(BaseModel):
    id: str
    unit_id: str
    type: ApprovalType
    status: ApprovalStatus
    subject_employee_id: str | None = None
    requested_by: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    decision_note: str | None = None
    decided_by: str | None = None
    decided_at: datetime | None = None
    created_at: datetime | None = None


class ApprovalDecision(BaseModel):
    approve: bool
    decided_by: str | None = None
    note: str | None = None
