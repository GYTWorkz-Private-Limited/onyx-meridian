from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from ..domain.enums import (
    EscalationPolicy,
    OwnerType,
    SourceType,
    TaskPriority,
    TaskStatus,
)


class Owner(BaseModel):
    """Who owns a commitment — a human Person or an AIEmployee."""

    type: OwnerType
    id: str


class Source(BaseModel):
    """Provenance: which meeting/doc/email a commitment came from."""

    type: SourceType = SourceType.MANUAL
    doc_id: str | None = None
    quote: str | None = None  # the exact sentence the commitment was lifted from


class Escalation(BaseModel):
    policy: EscalationPolicy = EscalationPolicy.NOTIFY_CARETAKER
    after_hrs: int | None = Field(default=None, ge=0)
    before_due: bool = True


class TaskCreate(BaseModel):
    unit_id: str
    title: str = Field(min_length=1)
    description: str | None = None
    owner: Owner | None = None            # None = unassigned (triage queue)
    delegated_by: str | None = None       # super-agent / person id
    source: Source = Field(default_factory=Source)
    project_id: str | None = None
    due: datetime | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    depends_on: list[str] = Field(default_factory=list)
    escalation: Escalation = Field(default_factory=Escalation)
    autonomy_at_creation: str | None = None
    created_by: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    due: datetime | None = None
    priority: TaskPriority | None = None
    escalation: Escalation | None = None
    project_id: str | None = None


class TaskRead(BaseModel):
    id: str
    unit_id: str
    title: str
    description: str | None = None
    owner: Owner | None = None
    delegated_by: str | None = None
    source: Source = Field(default_factory=Source)
    project_id: str | None = None
    due: datetime | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.OPEN
    depends_on: list[str] = Field(default_factory=list)
    escalation: Escalation = Field(default_factory=Escalation)
    autonomy_at_creation: str | None = None
    audit_ref: str | None = None          # links to the immutable ledger
    created_by: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    escalated_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TaskStatusChange(BaseModel):
    actor: str | None = None
    note: str | None = None


class TaskReassign(BaseModel):
    owner: Owner
    actor: str | None = None
