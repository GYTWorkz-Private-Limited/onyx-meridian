from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AuditEventRead(BaseModel):
    """One immutable entry in the audit ledger (Vault). Append-only by design."""

    id: str
    unit_id: str | None = None
    actor: str
    actor_type: str = "user"            # user | employee | system
    action: str                          # e.g. 'employee.deployed'
    entity_type: str                     # e.g. 'employee'
    entity_id: str
    details: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
