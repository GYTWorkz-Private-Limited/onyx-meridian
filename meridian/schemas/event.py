from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EventRead(BaseModel):
    """A canonical-model state change emitted on the bus.

    Events drive Flow, reminders, and the dashboard. Stored append-only, like the
    audit ledger, but events are the *domain* signal (e.g. ``task.completed``)
    rather than the governance record.
    """

    id: str
    type: str                         # e.g. "task.created", "task.escalated"
    entity_type: str                  # e.g. "task"
    entity_id: str
    unit_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
