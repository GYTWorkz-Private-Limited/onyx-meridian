"""Execution monitoring + cost metering (the Ensure / cost-control surface).

A "run" is one heartbeat invocation of a deployed employee. Each run:

1. routes the model through the gateway (on-prem-first, policy-bound),
2. executes via the employee's adapter,
3. meters token usage into a cost (the cost half of the effectiveness/cost thesis),
4. rolls the cost into the employee's running spend and stamps a heartbeat, and
5. enforces the **budget hard-stop**: if spend crosses the monthly budget the
   employee is auto-suspended and a budget-override approval is opened.
"""

from __future__ import annotations

from typing import Any

from ..adapters import get_adapter
from ..adapters.base import HeartbeatContext
from ..domain.enums import ApprovalType, EmployeeStatus, Liveness, RunStatus
from ..gateway import model_gateway
from ..gateway.model_gateway import ModelPolicy
from ..schemas.common import utcnow
from ..schemas.employee import SuspendRequest
from ..schemas.run import RunCreate
from . import approval_service, audit_service, employee_service
from .errors import ConflictError, NotFoundError
from .store import COST_EVENTS, EMPLOYEES, RUNS, get_store


async def create_run(employee_id: str, req: RunCreate) -> dict[str, Any]:
    emp = await employee_service.get_employee(employee_id)
    if EmployeeStatus(emp["status"]) != EmployeeStatus.DEPLOYED:
        raise ConflictError(
            f"employee must be 'deployed' to run; it is '{emp['status']}'"
        )

    mp = emp.get("model_policy", {})
    decision = model_gateway.route(
        ModelPolicy(preferred=mp.get("preferred", "internal/onyx-llm"), allowed=mp.get("allowed", [])),
        requested_model=req.requested_model,
    )

    now = utcnow()
    run = await get_store().insert(
        RUNS,
        {
            "unit_id": emp["unit_id"],
            "employee_id": employee_id,
            "principal_id": emp.get("principal_id"),  # attribute the action to the identity
            "status": RunStatus.RUNNING.value,
            "invocation_source": req.invocation_source,
            "trigger_detail": req.trigger_detail,
            "model": decision.model,
            "input_tokens": 0,
            "output_tokens": 0,
            "cost_usd": 0.0,
            "summary": "",
            "error": None,
            "result": {},
            "started_at": now,
            "finished_at": None,
            "created_at": now,
        },
    )

    adapter = get_adapter(emp["adapter_type"])
    ctx = HeartbeatContext(
        employee_id=employee_id,
        unit_id=emp["unit_id"],
        model=decision.model,
        adapter_config=emp.get("adapter_config", {}),
        trigger_detail=req.trigger_detail,
    )
    try:
        result = await adapter.execute_heartbeat(ctx)
    except Exception as exc:  # an adapter crash is a failed run, not a 500
        finished = await get_store().update(
            RUNS,
            run["id"],
            {
                "status": RunStatus.FAILED.value,
                "error": f"adapter error: {exc}",
                "finished_at": utcnow(),
            },
        )
        assert finished is not None
        return finished

    cost = model_gateway.cost_usd(decision.model, result.input_tokens, result.output_tokens)
    finished_at = utcnow()
    finished = await get_store().update(
        RUNS,
        run["id"],
        {
            "status": (RunStatus.COMPLETED if result.ok else RunStatus.FAILED).value,
            "input_tokens": result.input_tokens,
            "output_tokens": result.output_tokens,
            "cost_usd": cost,
            "summary": result.summary,
            "error": result.error,
            "result": result.result,
            "finished_at": finished_at,
        },
    )
    assert finished is not None

    # Cost event (atomic record for roll-ups / the digital twin).
    await get_store().insert(
        COST_EVENTS,
        {
            "unit_id": emp["unit_id"],
            "employee_id": employee_id,
            "run_id": run["id"],
            "model": decision.model,
            "input_tokens": result.input_tokens,
            "output_tokens": result.output_tokens,
            "cost_usd": cost,
            "occurred_at": finished_at,
        },
    )

    # Roll cost into the employee + stamp the heartbeat.
    new_spent = round(float(emp.get("spent_usd", 0.0)) + cost, 6)
    await get_store().update(
        EMPLOYEES,
        employee_id,
        {"spent_usd": new_spent, "last_heartbeat_at": finished_at, "updated_at": finished_at},
    )

    await _enforce_budget(emp, new_spent)
    return finished


async def _enforce_budget(emp: dict[str, Any], new_spent: float) -> None:
    budget = float(emp.get("budget", {}).get("monthly_usd", 0.0) or 0.0)
    if budget <= 0 or new_spent < budget:
        return
    # Hard stop: suspend the live employee and open a budget-override approval.
    await employee_service.suspend(
        emp["id"], SuspendRequest(actor="system", reason="budget exceeded")
    )
    await approval_service.create_approval(
        unit_id=emp["unit_id"],
        type=ApprovalType.BUDGET_OVERRIDE,
        subject_employee_id=emp["id"],
        requested_by="system",
        payload={"spent_usd": new_spent, "budget_monthly_usd": budget},
    )
    await audit_service.record(
        actor="system",
        actor_type="system",
        action="employee.budget_exceeded",
        entity_type="employee",
        entity_id=emp["id"],
        unit_id=emp["unit_id"],
        details={"spent_usd": new_spent, "budget_monthly_usd": budget},
    )


async def heartbeat(employee_id: str) -> dict[str, Any]:
    """Lightweight liveness ping (no execution)."""
    await employee_service.get_employee(employee_id)  # 404 if unknown
    now = utcnow()
    await get_store().update(
        EMPLOYEES, employee_id, {"last_heartbeat_at": now, "updated_at": now}
    )
    return {"employee_id": employee_id, "last_heartbeat_at": now, "liveness": Liveness.ALIVE.value}


async def list_runs(
    *,
    employee_id: str | None = None,
    unit_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[dict[str, Any]]:
    filters: dict[str, Any] = {}
    if employee_id:
        filters["employee_id"] = employee_id
    if unit_id:
        filters["unit_id"] = unit_id
    return await get_store().list(
        RUNS, filters, skip=skip, limit=limit, sort=("created_at", -1)
    )


async def get_run(run_id: str) -> dict[str, Any]:
    run = await get_store().get(RUNS, run_id)
    if not run:
        raise NotFoundError(f"run {run_id} not found")
    return run
