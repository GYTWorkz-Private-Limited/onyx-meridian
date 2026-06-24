from __future__ import annotations

from pydantic import BaseModel, Field

from .audit import AuditEventRead


class StaleEmployee(BaseModel):
    id: str
    display_name: str
    last_heartbeat_at: str | None = None


class UnitDashboard(BaseModel):
    """Leadership read-model for one unit (the Prism slice / digital twin start).

    Answers, at a glance: how many employees in each lifecycle state and at each
    trust level, spend vs budget, what's waiting on a human, and what's gone quiet.
    """

    unit_id: str
    unit_name: str
    unit_status: str

    employees_total: int = 0
    by_status: dict[str, int] = Field(default_factory=dict)
    by_tier: dict[str, int] = Field(default_factory=dict)
    by_autonomy: dict[str, int] = Field(default_factory=dict)

    spent_usd: float = 0.0
    budget_monthly_usd: float = 0.0
    budget_utilization: float = 0.0      # spent / budget, 0 when no budget

    # Action/Task Registry rollup — "who owes what, by when" at a glance.
    commitments_total: int = 0
    open_commitments: int = 0
    overdue_commitments: int = 0
    completion_rate: float = 0.0         # done / (total excluding cancelled)
    commitments_by_status: dict[str, int] = Field(default_factory=dict)

    open_approvals: int = 0
    stale_employees: list[StaleEmployee] = Field(default_factory=list)
    recent_activity: list[AuditEventRead] = Field(default_factory=list)
