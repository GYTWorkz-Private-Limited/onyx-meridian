from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from ..domain.enums import RunStatus


class RunCreate(BaseModel):
    """Trigger one heartbeat run for a deployed employee (monitoring + cost).

    ``requested_model`` is routed through the model gateway against the
    employee's policy; usage is metered into a CostEvent and the employee's
    running spend.
    """

    invocation_source: str = "on_demand"   # on_demand | scheduled | event
    trigger_detail: str = ""
    requested_model: str | None = None


class RunRead(BaseModel):
    id: str
    unit_id: str
    employee_id: str
    principal_id: str | None = None
    status: RunStatus
    invocation_source: str
    trigger_detail: str = ""
    model: str | None = None
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    summary: str = ""
    error: str | None = None
    result: dict[str, Any] = Field(default_factory=dict)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime | None = None
