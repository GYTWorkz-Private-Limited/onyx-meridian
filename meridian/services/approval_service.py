"""Approval queue — the one-tap HITL gate ("AI proposes, a human commits").

Deploy and decommission of a live principal are parked here as pending approvals.
When a human approves, the parked action is *re-validated* (state may have moved
since the request) and then executed. Rejection leaves the employee untouched.

This module must not import ``employee_service`` at module load — it imports the
``_perform_*`` executors lazily inside :func:`decide` to avoid an import cycle.
"""

from __future__ import annotations

from typing import Any

from ..domain import lifecycle
from ..domain.enums import (
    ApprovalStatus,
    ApprovalType,
    EmployeeStatus,
    UnitStatus,
)
from ..governance import policy
from ..governance.policy import PolicyDenied
from ..schemas.approval import ApprovalDecision
from ..schemas.common import utcnow
from . import audit_service, unit_service
from .errors import ConflictError, NotFoundError
from .store import APPROVALS, EMPLOYEES, get_store


async def create_approval(
    *,
    unit_id: str,
    type: ApprovalType,
    subject_employee_id: str | None,
    requested_by: str | None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    doc = {
        "unit_id": unit_id,
        "type": type.value,
        "status": ApprovalStatus.PENDING.value,
        "subject_employee_id": subject_employee_id,
        "requested_by": requested_by,
        "payload": payload or {},
        "decision_note": None,
        "decided_by": None,
        "decided_at": None,
        "created_at": utcnow(),
    }
    return await get_store().insert(APPROVALS, doc)


async def get_approval(approval_id: str) -> dict[str, Any]:
    appr = await get_store().get(APPROVALS, approval_id)
    if not appr:
        raise NotFoundError(f"approval {approval_id} not found")
    return appr


async def list_approvals(
    *,
    unit_id: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[dict[str, Any]]:
    filters: dict[str, Any] = {}
    if unit_id:
        filters["unit_id"] = unit_id
    if status:
        filters["status"] = status
    return await get_store().list(
        APPROVALS, filters, skip=skip, limit=limit, sort=("created_at", -1)
    )


async def decide(approval_id: str, decision: ApprovalDecision) -> dict[str, Any]:
    """Approve or reject. On approve, re-validate and execute the parked action.

    Returns ``{"approval": doc, "employee": doc|None}``.
    """
    appr = await get_approval(approval_id)
    if appr["status"] != ApprovalStatus.PENDING.value:
        raise ConflictError(f"approval already {appr['status']}")

    if not decision.approve:
        updated = await _finalize(appr, ApprovalStatus.REJECTED, decision)
        await audit_service.record(
            actor=decision.decided_by,
            action="approval.rejected",
            entity_type="approval",
            entity_id=approval_id,
            unit_id=appr["unit_id"],
            details={"type": appr["type"]},
        )
        return {"approval": updated, "employee": None, "credential": None}

    employee, credential = await _execute_approved(appr, decision)
    updated = await _finalize(appr, ApprovalStatus.APPROVED, decision)
    await audit_service.record(
        actor=decision.decided_by,
        action="approval.approved",
        entity_type="approval",
        entity_id=approval_id,
        unit_id=appr["unit_id"],
        details={"type": appr["type"], "subject": appr.get("subject_employee_id")},
    )
    return {"approval": updated, "employee": employee, "credential": credential}


async def _finalize(
    appr: dict[str, Any], status: ApprovalStatus, decision: ApprovalDecision
) -> dict[str, Any]:
    saved = await get_store().update(
        APPROVALS,
        appr["id"],
        {
            "status": status.value,
            "decided_by": decision.decided_by,
            "decision_note": decision.note,
            "decided_at": utcnow(),
        },
    )
    assert saved is not None
    return saved


async def _execute_approved(
    appr: dict[str, Any], decision: ApprovalDecision
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """Run the parked action. Returns ``(employee, credential|None)``."""
    # Lazy import to break the employee_service <-> approval_service cycle.
    from . import employee_service

    emp = await get_store().get(EMPLOYEES, appr["subject_employee_id"])
    if not emp:
        raise NotFoundError("subject employee no longer exists")

    appr_type = ApprovalType(appr["type"])
    payload = appr.get("payload", {})
    actor = decision.decided_by or payload.get("actor")

    if appr_type == ApprovalType.DEPLOY:
        # Re-validate: state may have changed since the request.
        unit = await unit_service.get_unit(emp["unit_id"])
        current = EmployeeStatus(emp["status"])
        lifecycle.assert_transition(current, EmployeeStatus.DEPLOYED)
        verdict = policy.authorize_deploy(
            employee_status=current,
            unit_status=UnitStatus(unit["status"]),
            has_caretaker=bool(emp.get("supervision", {}).get("caretaker")),
        )
        if not verdict.allowed:
            raise PolicyDenied(verdict)
        return await employee_service._perform_deploy(
            emp, actor=actor, note=payload.get("note")
        )

    if appr_type == ApprovalType.DECOMMISSION:
        lifecycle.assert_decommissionable(EmployeeStatus(emp["status"]))
        retired = await employee_service._perform_decommission(
            emp,
            actor=actor,
            reason=payload.get("reason"),
            reassign_to=payload.get("reassign_to"),
        )
        return retired, None

    raise ConflictError(f"approval type '{appr['type']}' is not executable in this build")
