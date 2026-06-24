from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from ..domain.enums import UnitStatus


class UnitCreate(BaseModel):
    """Onboard a department / business unit into Meridian.

    ``allowed_scopes`` is the catalog of data/action scopes that may be
    delegated to employees in this unit — the basis for the least-privilege
    check at configure time.
    """

    name: str = Field(min_length=2)
    description: str | None = None
    caretaker_user_id: str | None = None
    allowed_scopes: list[str] = Field(default_factory=list)
    require_approval_for_deploy: bool = True
    require_approval_for_decommission: bool = True
    budget_monthly_usd: float = Field(default=0.0, ge=0)


class UnitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    description: str | None = None
    caretaker_user_id: str | None = None
    allowed_scopes: list[str] | None = None
    require_approval_for_deploy: bool | None = None
    require_approval_for_decommission: bool | None = None
    budget_monthly_usd: float | None = Field(default=None, ge=0)


class UnitRead(BaseModel):
    id: str
    name: str
    description: str | None = None
    status: UnitStatus
    caretaker_user_id: str | None = None
    allowed_scopes: list[str] = Field(default_factory=list)
    require_approval_for_deploy: bool = True
    require_approval_for_decommission: bool = True
    budget_monthly_usd: float = 0.0
    created_at: datetime | None = None
    updated_at: datetime | None = None
