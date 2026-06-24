"""Unit dashboard — the leadership read-model (first slice of the Digital Twin).

Projects the registry + audit ledger + cost meters into the one view a unit's
caretaker needs: how many employees in each state and at each trust level, spend
vs budget, what's waiting on a human, and what's gone quiet.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from ..config.settings import get_settings
from ..domain.enums import ApprovalStatus, TaskStatus
from ..domain.task_lifecycle import CLOSED_STATUSES, OPEN_STATUSES
from ..schemas.common import utcnow
from . import audit_service, employee_service, task_service, unit_service


async def build_unit_dashboard(unit_id: str) -> dict[str, Any]:
    unit = await unit_service.get_unit(unit_id)
    employees = await employee_service.list_employees(unit_id=unit_id, limit=500)
    settings = get_settings()
    stale_cutoff = utcnow() - timedelta(seconds=settings.heartbeat_stale_seconds)

    by_status: dict[str, int] = {}
    by_tier: dict[str, int] = {}
    by_autonomy: dict[str, int] = {}
    spent = 0.0
    stale = []

    for emp in employees:
        by_status[emp["status"]] = by_status.get(emp["status"], 0) + 1
        by_tier[emp["tier"]] = by_tier.get(emp["tier"], 0) + 1
        spent += float(emp.get("spent_usd", 0.0))
        # Autonomy is only meaningful for live employees — count the deployed.
        if emp["status"] == "deployed":
            by_autonomy[emp["autonomy"]] = by_autonomy.get(emp["autonomy"], 0) + 1
            # A deployed employee that has never beaten, or not recently, is "stale".
            hb = _as_dt(emp.get("last_heartbeat_at"))
            if hb is None or hb < stale_cutoff:
                stale.append(
                    {
                        "id": emp["id"],
                        "display_name": emp["display_name"],
                        "last_heartbeat_at": hb.isoformat() if hb else None,
                    }
                )

    budget = float(unit.get("budget_monthly_usd", 0.0) or 0.0)
    spent = round(spent, 6)
    open_approvals = await _count_open_approvals(unit_id)
    recent = await audit_service.list_events(unit_id=unit_id, limit=10)
    tasks = await _task_rollup(unit_id)

    return {
        "unit_id": unit_id,
        "unit_name": unit["name"],
        "unit_status": unit["status"],
        "employees_total": len(employees),
        "by_status": by_status,
        "by_tier": by_tier,
        "by_autonomy": by_autonomy,
        "spent_usd": spent,
        "budget_monthly_usd": budget,
        "budget_utilization": round(spent / budget, 4) if budget > 0 else 0.0,
        **tasks,
        "open_approvals": open_approvals,
        "stale_employees": stale,
        "recent_activity": recent,
    }


async def _task_rollup(unit_id: str) -> dict[str, Any]:
    """Open commitments, completion rate, overdue, by-status — the wedge surfaced."""
    tasks = await task_service.list_tasks(unit_id=unit_id, limit=500)
    by_status: dict[str, int] = {}
    open_count = 0
    overdue = 0
    done = 0
    counted = 0  # excludes cancelled
    for t in tasks:
        status = TaskStatus(t["status"])
        by_status[status.value] = by_status.get(status.value, 0) + 1
        if status in OPEN_STATUSES:
            open_count += 1
        if status in CLOSED_STATUSES:
            if status == TaskStatus.DONE:
                done += 1
        if status != TaskStatus.CANCELLED:
            counted += 1
        if task_service.is_overdue(t):
            overdue += 1
    return {
        "commitments_total": len(tasks),
        "open_commitments": open_count,
        "overdue_commitments": overdue,
        "completion_rate": round(done / counted, 4) if counted else 0.0,
        "commitments_by_status": by_status,
    }


async def _count_open_approvals(unit_id: str) -> int:
    from . import approval_service

    rows = await approval_service.list_approvals(
        unit_id=unit_id, status=ApprovalStatus.PENDING.value, limit=500
    )
    return len(rows)


def _as_dt(value: Any):
    """Heartbeat may be a datetime (in-memory) or ISO string (Mongo round-trip)."""
    if value is None:
        return None
    if isinstance(value, str):
        from datetime import datetime

        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return value
