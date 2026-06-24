"""Action / Task Registry — the accountability core (the wedge).

The literal answer to the leadership question: *who owes what to whom, by when,
from which source, and what happens if they don't act?* Every commitment is a
first-class tracked record with an owner (human or AI), provenance to its source
document, a dependency graph, escalation, and a link to the immutable audit ledger.

Each mutation records an audit entry and emits a domain event.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from ..domain.enums import OwnerType, TaskStatus
from ..domain.task_lifecycle import (
    CLOSED_STATUSES,
    OPEN_STATUSES,
    assert_transition,
)
from ..schemas.common import utcnow
from ..schemas.task import TaskCreate, TaskReassign, TaskUpdate
from . import audit_service, document_service, event_service, unit_service
from .errors import ConflictError, NotFoundError
from .store import TASKS, get_store


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _as_aware(dt: Any) -> datetime | None:
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt


def is_overdue(task: dict[str, Any], now: datetime | None = None) -> bool:
    due = _as_aware(task.get("due"))
    if due is None or task["status"] in CLOSED_STATUSES:
        return False
    return due < (now or utcnow())


async def _validate_owner(unit_id: str, owner: dict[str, Any] | None) -> None:
    if not owner:
        return
    otype = OwnerType(owner["type"])
    if otype == OwnerType.AI_EMPLOYEE:
        from . import employee_service

        emp = await employee_service.get_employee(owner["id"])
        if emp["unit_id"] != unit_id:
            raise ConflictError("ai_employee owner must belong to the task's unit")
    else:
        from . import person_service

        await person_service.get_person(owner["id"])


# --------------------------------------------------------------------------- #
# Create / read
# --------------------------------------------------------------------------- #
async def create_task(payload: TaskCreate) -> dict[str, Any]:
    await unit_service.get_unit(payload.unit_id)  # 404 if unknown
    data = payload.model_dump()

    await _validate_owner(payload.unit_id, data.get("owner"))

    src = data.get("source") or {}
    if src.get("doc_id"):
        await document_service.get_document(src["doc_id"])  # provenance must resolve

    for dep_id in data.get("depends_on", []):
        dep = await get_task(dep_id)
        if dep["unit_id"] != payload.unit_id:
            raise ConflictError("a dependency must be in the same unit")

    now = utcnow()
    data.update(
        {
            "status": TaskStatus.OPEN.value,
            "audit_ref": None,
            "started_at": None,
            "completed_at": None,
            "escalated_at": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    task = await get_store().insert(TASKS, data)

    entry = await audit_service.record(
        actor=payload.created_by or payload.delegated_by,
        action="task.created",
        entity_type="task",
        entity_id=task["id"],
        unit_id=payload.unit_id,
        details={"title": payload.title, "source": src.get("type")},
    )
    task = await get_store().update(TASKS, task["id"], {"audit_ref": entry["id"]})
    assert task is not None
    await event_service.emit(
        type="task.created",
        entity_type="task",
        entity_id=task["id"],
        unit_id=payload.unit_id,
        payload={"owner": data.get("owner")},
    )
    return task


async def get_task(task_id: str) -> dict[str, Any]:
    task = await get_store().get(TASKS, task_id)
    if not task:
        raise NotFoundError(f"task {task_id} not found")
    return task


async def list_tasks(
    *,
    unit_id: str | None = None,
    status: str | None = None,
    owner_id: str | None = None,
    project_id: str | None = None,
    overdue: bool | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[dict[str, Any]]:
    filters: dict[str, Any] = {}
    if unit_id:
        filters["unit_id"] = unit_id
    if status:
        filters["status"] = status
    if project_id:
        filters["project_id"] = project_id
    rows = await get_store().list(TASKS, filters, skip=0, limit=500, sort=("created_at", -1))
    if owner_id:
        rows = [r for r in rows if (r.get("owner") or {}).get("id") == owner_id]
    if overdue is not None:
        rows = [r for r in rows if is_overdue(r) == overdue]
    return rows[skip : skip + limit]


# --------------------------------------------------------------------------- #
# Update / lifecycle
# --------------------------------------------------------------------------- #
async def update_task(task_id: str, updates: TaskUpdate) -> dict[str, Any]:
    task = await get_task(task_id)
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not data:
        return task
    data["updated_at"] = utcnow()
    saved = await get_store().update(TASKS, task_id, data)
    assert saved is not None
    await audit_service.record(
        actor=None,
        action="task.updated",
        entity_type="task",
        entity_id=task_id,
        unit_id=task["unit_id"],
        details={"fields": sorted(data.keys())},
    )
    return saved


async def change_status(
    task_id: str, target: TaskStatus, *, actor: str | None = None, note: str | None = None
) -> dict[str, Any]:
    task = await get_task(task_id)
    current = TaskStatus(task["status"])
    assert_transition(current, target)

    if target == TaskStatus.DONE:
        await _assert_dependencies_done(task)

    now = utcnow()
    updates: dict[str, Any] = {"status": target.value, "updated_at": now}
    if target == TaskStatus.IN_PROGRESS and not task.get("started_at"):
        updates["started_at"] = now
    if target == TaskStatus.DONE:
        updates["completed_at"] = now

    saved = await get_store().update(TASKS, task_id, updates)
    assert saved is not None
    await audit_service.record(
        actor=actor,
        action=f"task.{target.value}",
        entity_type="task",
        entity_id=task_id,
        unit_id=task["unit_id"],
        details={"from": current.value, "note": note},
    )
    await event_service.emit(
        type=f"task.{target.value}",
        entity_type="task",
        entity_id=task_id,
        unit_id=task["unit_id"],
        payload={"from": current.value},
    )
    return saved


async def _assert_dependencies_done(task: dict[str, Any]) -> None:
    for dep_id in task.get("depends_on", []):
        dep = await get_store().get(TASKS, dep_id)
        if dep and dep["status"] != TaskStatus.DONE.value:
            raise ConflictError(
                f"cannot complete: dependency {dep_id} is '{dep['status']}', not done"
            )


async def reassign(task_id: str, req: TaskReassign) -> dict[str, Any]:
    task = await get_task(task_id)
    owner = req.owner.model_dump()
    await _validate_owner(task["unit_id"], owner)
    saved = await get_store().update(
        TASKS, task_id, {"owner": owner, "updated_at": utcnow()}
    )
    assert saved is not None
    await audit_service.record(
        actor=req.actor,
        action="task.reassigned",
        entity_type="task",
        entity_id=task_id,
        unit_id=task["unit_id"],
        details={"to": owner},
    )
    await event_service.emit(
        type="task.reassigned",
        entity_type="task",
        entity_id=task_id,
        unit_id=task["unit_id"],
        payload={"owner": owner},
    )
    return saved


# --------------------------------------------------------------------------- #
# Dependencies (with cycle detection)
# --------------------------------------------------------------------------- #
async def add_dependency(task_id: str, dep_id: str) -> dict[str, Any]:
    task = await get_task(task_id)
    if dep_id == task_id:
        raise ConflictError("a task cannot depend on itself")
    dep = await get_task(dep_id)
    if dep["unit_id"] != task["unit_id"]:
        raise ConflictError("a dependency must be in the same unit")
    if dep_id in task.get("depends_on", []):
        return task
    if await _would_create_cycle(task_id, dep_id):
        raise ConflictError(f"adding dependency {dep_id} would create a cycle")
    new_deps = [*task.get("depends_on", []), dep_id]
    saved = await get_store().update(
        TASKS, task_id, {"depends_on": new_deps, "updated_at": utcnow()}
    )
    assert saved is not None
    await audit_service.record(
        actor=None,
        action="task.dependency_added",
        entity_type="task",
        entity_id=task_id,
        unit_id=task["unit_id"],
        details={"depends_on": dep_id},
    )
    return saved


async def remove_dependency(task_id: str, dep_id: str) -> dict[str, Any]:
    task = await get_task(task_id)
    new_deps = [d for d in task.get("depends_on", []) if d != dep_id]
    saved = await get_store().update(
        TASKS, task_id, {"depends_on": new_deps, "updated_at": utcnow()}
    )
    assert saved is not None
    return saved


async def _would_create_cycle(task_id: str, new_dep_id: str) -> bool:
    """True if task_id is reachable from new_dep_id via depends_on (a cycle)."""
    seen: set[str] = set()
    stack = [new_dep_id]
    while stack:
        cur = stack.pop()
        if cur == task_id:
            return True
        if cur in seen:
            continue
        seen.add(cur)
        node = await get_store().get(TASKS, cur)
        if node:
            stack.extend(node.get("depends_on", []))
    return False


# --------------------------------------------------------------------------- #
# Escalation sweep — "nothing slips silently"
# --------------------------------------------------------------------------- #
async def escalate_due(
    *, unit_id: str | None = None, now: datetime | None = None
) -> dict[str, Any]:
    """Sweep open tasks: mark overdue ones MISSED + escalate; warn those nearing due.

    Returns a summary of what was escalated/warned. Idempotent: a task already
    escalated isn't re-escalated.
    """
    now = now or utcnow()
    rows = await get_store().list(
        TASKS, {"unit_id": unit_id} if unit_id else None, limit=500
    )
    escalated: list[str] = []
    warned: list[str] = []

    for task in rows:
        if task["status"] not in {s.value for s in OPEN_STATUSES}:
            continue
        due = _as_aware(task.get("due"))
        if due is None:
            continue
        esc = task.get("escalation") or {}

        if due <= now:
            if task["status"] == TaskStatus.MISSED.value:
                continue
            await get_store().update(
                TASKS,
                task["id"],
                {"status": TaskStatus.MISSED.value, "escalated_at": now, "updated_at": now},
            )
            await audit_service.record(
                actor="system",
                actor_type="system",
                action="task.missed",
                entity_type="task",
                entity_id=task["id"],
                unit_id=task["unit_id"],
                details={"due": due.isoformat(), "policy": esc.get("policy")},
            )
            await event_service.emit(
                type="task.escalated",
                entity_type="task",
                entity_id=task["id"],
                unit_id=task["unit_id"],
                payload={"reason": "overdue", "policy": esc.get("policy")},
            )
            escalated.append(task["id"])
            continue

        # Approaching due: warn once if within the before-due window.
        after_hrs = esc.get("after_hrs")
        if esc.get("before_due") and after_hrs and not task.get("escalated_at"):
            warn_from = due.timestamp() - after_hrs * 3600
            if now.timestamp() >= warn_from:
                await get_store().update(TASKS, task["id"], {"escalated_at": now})
                await event_service.emit(
                    type="task.escalation_warning",
                    entity_type="task",
                    entity_id=task["id"],
                    unit_id=task["unit_id"],
                    payload={"reason": "approaching_due", "policy": esc.get("policy")},
                )
                warned.append(task["id"])

    return {"scanned": len(rows), "escalated": escalated, "warned": warned}
