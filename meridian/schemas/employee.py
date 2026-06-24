from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from ..domain.enums import AutonomyLevel, EmployeeStatus, Tier


# --------------------------------------------------------------------------- #
# Nested configuration objects (mirror FRAMEWORK/03-ai-employees.md schema)
# --------------------------------------------------------------------------- #
class Role(BaseModel):
    responsibilities: list[str] = Field(default_factory=list)
    kpis: list[str] = Field(default_factory=list)
    charter: str | None = None


class Permissions(BaseModel):
    data_scopes: list[str] = Field(default_factory=list)
    action_scopes: list[str] = Field(default_factory=list)
    deny: list[str] = Field(default_factory=list)


class Budget(BaseModel):
    monthly_usd: float = Field(default=0.0, ge=0)
    max_actions_per_hour: int | None = Field(default=None, ge=0)


class Supervision(BaseModel):
    caretaker: str | None = None  # accountable human user id
    escalate_after_hrs: int | None = Field(default=None, ge=0)


class ModelPolicy(BaseModel):
    preferred: str = "internal/onyx-llm"
    allowed: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Read model
# --------------------------------------------------------------------------- #
class EmployeeRead(BaseModel):
    id: str
    version: int
    unit_id: str
    display_name: str
    archetype: str | None = None
    tier: Tier
    status: EmployeeStatus
    reports_to: str | None = None
    owner: str | None = None

    role: Role = Field(default_factory=Role)
    capabilities: list[str] = Field(default_factory=list)
    permissions: Permissions = Field(default_factory=Permissions)
    autonomy: AutonomyLevel = AutonomyLevel.SHADOW
    per_task_autonomy: dict[str, AutonomyLevel] = Field(default_factory=dict)
    budget: Budget = Field(default_factory=Budget)
    context_bindings: list[str] = Field(default_factory=list)
    model_policy: ModelPolicy = Field(default_factory=ModelPolicy)
    supervision: Supervision = Field(default_factory=Supervision)

    adapter_type: str = "echo"
    adapter_config: dict[str, Any] = Field(default_factory=dict)

    # monitoring / accounting
    spent_usd: float = 0.0
    last_heartbeat_at: datetime | None = None
    principal_id: str | None = None  # scoped credential issued at deploy
    pause_reason: str | None = None

    deployed_at: datetime | None = None
    suspended_at: datetime | None = None
    retired_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


# --------------------------------------------------------------------------- #
# Lifecycle request bodies
# --------------------------------------------------------------------------- #
class InstantiateRequest(BaseModel):
    """INSTANTIATE — create from an archetype or from scratch. Yields `draft`."""

    unit_id: str
    display_name: str | None = None      # required if no archetype
    archetype: str | None = None         # archetype key
    tier: Tier | None = None
    reports_to: str | None = None
    owner: str | None = None
    created_by: str | None = None


class ConfigureRequest(BaseModel):
    """CONFIGURE — set role/tools/permissions/budget/etc. Bumps version.

    Any field left None keeps the current value. Validated against the unit's
    delegatable-scope catalog (least privilege).
    """

    role: Role | None = None
    capabilities: list[str] | None = None
    permissions: Permissions | None = None
    budget: Budget | None = None
    context_bindings: list[str] | None = None
    model_policy: ModelPolicy | None = None
    supervision: Supervision | None = None
    tier: Tier | None = None
    adapter_type: str | None = None
    adapter_config: dict[str, Any] | None = None
    actor: str | None = None             # who is configuring (for audit)


class DeployRequest(BaseModel):
    """DEPLOY — attach to the unit, issue credentials, start in Shadow."""

    actor: str | None = None
    note: str | None = None


class SuspendRequest(BaseModel):
    actor: str | None = None
    reason: str | None = None


class ResumeRequest(BaseModel):
    actor: str | None = None


class AutonomyChangeRequest(BaseModel):
    """Promote/demote one rung. Promotion requires a passing Ensure eval."""

    actor: str | None = None
    eval_passed: bool = False
    note: str | None = None


class DecommissionRequest(BaseModel):
    """DECOMMISSION — retire: revoke credentials, reassign work, archive audit."""

    actor: str | None = None
    reason: str | None = None
    reassign_to: str | None = None       # employee id to inherit in-flight work
