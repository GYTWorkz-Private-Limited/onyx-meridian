"""AI-Employee registry + lifecycle — the heart of the spine.

Implements the governed lifecycle from FRAMEWORK/03-ai-employees.md:

    INSTANTIATE -> CONFIGURE -> DEPLOY -> MANAGE -> DECOMMISSION

Every transition is (1) checked by the state machine (``domain.lifecycle``),
(2) authorized by the Policy Engine (``governance.policy``), (3) recorded in the
immutable audit ledger, and (4) versioned. Deploy and decommission of a live
principal are HITL-gated: when the unit requires approval, the action is parked
as a pending Approval instead of executing ("AI proposes, a human commits").
"""

from __future__ import annotations

from typing import Any

from ..adapters import get_adapter, known_adapter_types
from ..domain import lifecycle
from ..domain.enums import (
    ApprovalType,
    AutonomyLevel,
    EmployeeStatus,
    Tier,
    UnitStatus,
)
from ..governance import policy
from ..governance.policy import PolicyDenied
from ..schemas.common import utcnow
from ..schemas.employee import (
    AutonomyChangeRequest,
    ConfigureRequest,
    DecommissionRequest,
    DeployRequest,
    InstantiateRequest,
    ResumeRequest,
    SuspendRequest,
)
from . import (
    approval_service,
    archetype_service,
    audit_service,
    identity_service,
    unit_service,
)
from .errors import ConflictError, NotFoundError
from .store import EMPLOYEES, get_store


# --------------------------------------------------------------------------- #
# Reads
# --------------------------------------------------------------------------- #
async def get_employee(employee_id: str) -> dict[str, Any]:
    emp = await get_store().get(EMPLOYEES, employee_id)
    if not emp:
        raise NotFoundError(f"employee {employee_id} not found")
    return emp


async def list_employees(
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
        EMPLOYEES, filters, skip=skip, limit=limit, sort=("created_at", -1)
    )


# --------------------------------------------------------------------------- #
# 1. INSTANTIATE
# --------------------------------------------------------------------------- #
async def instantiate(req: InstantiateRequest) -> dict[str, Any]:
    await unit_service.get_unit(req.unit_id)  # 404 if unit unknown

    seed: dict[str, Any] = {}
    archetype_key: str | None = None
    if req.archetype:
        arch = await archetype_service.get_by_key(req.archetype)
        if not arch:
            raise NotFoundError(f"archetype '{req.archetype}' not found")
        archetype_key = arch["key"]
        seed = arch

    display_name = req.display_name or seed.get("display_name")
    if not display_name:
        raise ConflictError("display_name is required when no archetype is given")

    tier = (req.tier.value if req.tier else seed.get("tier")) or Tier.T1_EXECUTION.value
    now = utcnow()
    doc = {
        "version": 1,
        "unit_id": req.unit_id,
        "display_name": display_name,
        "archetype": archetype_key,
        "tier": tier,
        "status": EmployeeStatus.DRAFT.value,
        "reports_to": req.reports_to,
        "owner": req.owner,
        "role": {
            "responsibilities": [],
            "kpis": list(seed.get("default_kpis", [])),
            "charter": None,
        },
        "capabilities": list(seed.get("default_capabilities", [])),
        "permissions": {
            "data_scopes": list(seed.get("default_data_scopes", [])),
            "action_scopes": list(seed.get("default_action_scopes", [])),
            "deny": [],
        },
        "autonomy": AutonomyLevel.SHADOW.value,
        "per_task_autonomy": {},
        "budget": {"monthly_usd": 0.0, "max_actions_per_hour": None},
        "context_bindings": [],
        "model_policy": {"preferred": "internal/onyx-llm", "allowed": []},
        "supervision": {"caretaker": None, "escalate_after_hrs": None},
        "adapter_type": seed.get("default_adapter_type", "echo"),
        "adapter_config": dict(seed.get("default_adapter_config", {})),
        "spent_usd": 0.0,
        "last_heartbeat_at": None,
        "principal_id": None,
        "pause_reason": None,
        "deployed_at": None,
        "suspended_at": None,
        "retired_at": None,
        "created_at": now,
        "updated_at": now,
    }
    created = await get_store().insert(EMPLOYEES, doc)
    await audit_service.record(
        actor=req.created_by or req.owner,
        action="employee.instantiated",
        entity_type="employee",
        entity_id=created["id"],
        unit_id=req.unit_id,
        details={"archetype": archetype_key, "tier": tier},
    )
    return created


# --------------------------------------------------------------------------- #
# 2. CONFIGURE  (draft|configured -> configured, version bump)
# --------------------------------------------------------------------------- #
async def configure(employee_id: str, req: ConfigureRequest) -> dict[str, Any]:
    emp = await get_employee(employee_id)
    current = EmployeeStatus(emp["status"])
    # State machine: configure is only legal from draft/configured. A live
    # employee must be suspended before its grants can change.
    lifecycle.assert_transition(current, EmployeeStatus.CONFIGURED)

    updates: dict[str, Any] = {}
    if req.role is not None:
        updates["role"] = req.role.model_dump()
    if req.capabilities is not None:
        updates["capabilities"] = req.capabilities
    if req.permissions is not None:
        updates["permissions"] = req.permissions.model_dump()
    if req.budget is not None:
        updates["budget"] = req.budget.model_dump()
    if req.context_bindings is not None:
        updates["context_bindings"] = req.context_bindings
    if req.model_policy is not None:
        updates["model_policy"] = req.model_policy.model_dump()
    if req.supervision is not None:
        updates["supervision"] = req.supervision.model_dump()
    if req.tier is not None:
        updates["tier"] = req.tier.value
    if req.adapter_type is not None:
        updates["adapter_type"] = req.adapter_type
    if req.adapter_config is not None:
        updates["adapter_config"] = req.adapter_config

    merged = {**emp, **updates}

    # --- Governance: least-privilege scope check against the unit catalog ---
    unit = await unit_service.get_unit(emp["unit_id"])
    perms = merged["permissions"]
    verdict = policy.authorize_configuration(
        requested_data_scopes=perms.get("data_scopes", []),
        requested_action_scopes=perms.get("action_scopes", []),
        deny_scopes=perms.get("deny", []),
        grantable_scopes=unit.get("allowed_scopes", []),
    )
    if not verdict.allowed:
        raise PolicyDenied(verdict)

    # --- Adapter validity ---
    adapter_type = merged["adapter_type"]
    if adapter_type not in known_adapter_types():
        raise ConflictError(
            f"unknown adapter_type '{adapter_type}'; known: {known_adapter_types()}"
        )
    problems = get_adapter(adapter_type).validate_config(merged.get("adapter_config", {}))
    if problems:
        raise ConflictError("invalid adapter_config: " + "; ".join(problems))

    updates["status"] = EmployeeStatus.CONFIGURED.value
    updates["version"] = int(emp["version"]) + 1
    updates["updated_at"] = utcnow()
    saved = await get_store().update(EMPLOYEES, employee_id, updates)
    assert saved is not None
    await audit_service.record(
        actor=req.actor,
        action="employee.configured",
        entity_type="employee",
        entity_id=employee_id,
        unit_id=emp["unit_id"],
        details={"version": updates["version"]},
    )
    return saved


# --------------------------------------------------------------------------- #
# 3. DEPLOY  (configured -> deployed; HITL-gated)
# --------------------------------------------------------------------------- #
async def deploy(employee_id: str, req: DeployRequest) -> dict[str, Any]:
    """Returns ``{"pending": bool, "employee": doc|None, "approval": doc|None}``."""
    emp = await get_employee(employee_id)
    unit = await unit_service.get_unit(emp["unit_id"])
    current = EmployeeStatus(emp["status"])

    # Validate without mutating, so a rejected deploy never leaves side effects.
    lifecycle.assert_transition(current, EmployeeStatus.DEPLOYED)
    verdict = policy.authorize_deploy(
        employee_status=current,
        unit_status=UnitStatus(unit["status"]),
        has_caretaker=bool(emp.get("supervision", {}).get("caretaker")),
    )
    if not verdict.allowed:
        raise PolicyDenied(verdict)

    if unit.get("require_approval_for_deploy", True):
        approval = await approval_service.create_approval(
            unit_id=emp["unit_id"],
            type=ApprovalType.DEPLOY,
            subject_employee_id=employee_id,
            requested_by=req.actor,
            payload={"note": req.note, "actor": req.actor},
        )
        await audit_service.record(
            actor=req.actor,
            action="employee.deploy_requested",
            entity_type="employee",
            entity_id=employee_id,
            unit_id=emp["unit_id"],
            details={"approval_id": approval["id"]},
        )
        return {"pending": True, "employee": None, "approval": approval, "credential": None}

    deployed, credential = await _perform_deploy(emp, actor=req.actor, note=req.note)
    return {"pending": False, "employee": deployed, "approval": None, "credential": credential}


async def _perform_deploy(
    emp: dict[str, Any], *, actor: str | None, note: str | None
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Execute the deploy transition + issue a scoped credential.

    Returns ``(employee, credential)`` where credential carries the one-time
    plaintext token (shown to the caller exactly once).
    """
    principal = await identity_service.issue_for_employee(emp)
    now = utcnow()
    updates = {
        "status": EmployeeStatus.DEPLOYED.value,
        "autonomy": AutonomyLevel.SHADOW.value,  # always start in Shadow
        "principal_id": principal["id"],          # the issued credential's id
        "deployed_at": now,
        "pause_reason": None,
        "updated_at": now,
    }
    saved = await get_store().update(EMPLOYEES, emp["id"], updates)
    assert saved is not None
    await audit_service.record(
        actor=actor,
        action="employee.deployed",
        entity_type="employee",
        entity_id=emp["id"],
        unit_id=emp["unit_id"],
        details={"principal_id": principal["id"], "note": note},
    )
    credential = {
        "principal_id": principal["id"],
        "token": principal["token"],
        "token_prefix": principal["token_prefix"],
    }
    return saved, credential


# --------------------------------------------------------------------------- #
# 4. MANAGE  (suspend / resume / promote / demote)
# --------------------------------------------------------------------------- #
async def suspend(employee_id: str, req: SuspendRequest) -> dict[str, Any]:
    emp = await get_employee(employee_id)
    lifecycle.assert_transition(EmployeeStatus(emp["status"]), EmployeeStatus.SUSPENDED)
    now = utcnow()
    saved = await get_store().update(
        EMPLOYEES,
        employee_id,
        {
            "status": EmployeeStatus.SUSPENDED.value,
            "suspended_at": now,
            "pause_reason": req.reason,
            "updated_at": now,
        },
    )
    assert saved is not None
    await audit_service.record(
        actor=req.actor,
        action="employee.suspended",
        entity_type="employee",
        entity_id=employee_id,
        unit_id=emp["unit_id"],
        details={"reason": req.reason},
    )
    return saved


async def resume(employee_id: str, req: ResumeRequest) -> dict[str, Any]:
    emp = await get_employee(employee_id)
    lifecycle.assert_transition(EmployeeStatus(emp["status"]), EmployeeStatus.DEPLOYED)
    saved = await get_store().update(
        EMPLOYEES,
        employee_id,
        {
            "status": EmployeeStatus.DEPLOYED.value,
            "suspended_at": None,
            "pause_reason": None,
            "updated_at": utcnow(),
        },
    )
    assert saved is not None
    await audit_service.record(
        actor=req.actor,
        action="employee.resumed",
        entity_type="employee",
        entity_id=employee_id,
        unit_id=emp["unit_id"],
    )
    return saved


async def promote_autonomy(employee_id: str, req: AutonomyChangeRequest) -> dict[str, Any]:
    emp = await get_employee(employee_id)
    if EmployeeStatus(emp["status"]) != EmployeeStatus.DEPLOYED:
        raise ConflictError("autonomy can only change on a deployed employee")
    target = lifecycle.next_autonomy(AutonomyLevel(emp["autonomy"]))
    # Ensure gate: no promotion without a passing eval.
    if not req.eval_passed:
        raise PolicyDenied(
            policy.PolicyVerdict.deny("promotion requires a passing Ensure eval (eval_passed=true)")
        )
    return await _perform_autonomy(emp, target, actor=req.actor, action="autonomy_promoted", note=req.note)


async def demote_autonomy(employee_id: str, req: AutonomyChangeRequest) -> dict[str, Any]:
    emp = await get_employee(employee_id)
    if EmployeeStatus(emp["status"]) != EmployeeStatus.DEPLOYED:
        raise ConflictError("autonomy can only change on a deployed employee")
    target = lifecycle.prev_autonomy(AutonomyLevel(emp["autonomy"]))
    return await _perform_autonomy(emp, target, actor=req.actor, action="autonomy_demoted", note=req.note)


async def _perform_autonomy(
    emp: dict[str, Any],
    target: AutonomyLevel,
    *,
    actor: str | None,
    action: str,
    note: str | None,
) -> dict[str, Any]:
    saved = await get_store().update(
        EMPLOYEES, emp["id"], {"autonomy": target.value, "updated_at": utcnow()}
    )
    assert saved is not None
    await audit_service.record(
        actor=actor,
        action=f"employee.{action}",
        entity_type="employee",
        entity_id=emp["id"],
        unit_id=emp["unit_id"],
        details={"from": emp["autonomy"], "to": target.value, "note": note},
    )
    return saved


# --------------------------------------------------------------------------- #
# 5. DECOMMISSION  (-> retired; HITL-gated for live principals)
# --------------------------------------------------------------------------- #
async def decommission(employee_id: str, req: DecommissionRequest) -> dict[str, Any]:
    """Returns ``{"pending": bool, "employee": doc|None, "approval": doc|None}``."""
    emp = await get_employee(employee_id)
    unit = await unit_service.get_unit(emp["unit_id"])
    current = EmployeeStatus(emp["status"])
    lifecycle.assert_decommissionable(current)

    if req.reassign_to:
        target = await get_employee(req.reassign_to)  # 404 if unknown
        if EmployeeStatus(target["status"]) != EmployeeStatus.DEPLOYED:
            raise ConflictError("reassign_to target must be a deployed employee")

    was_live = current in (EmployeeStatus.DEPLOYED, EmployeeStatus.SUSPENDED)
    if was_live and unit.get("require_approval_for_decommission", True):
        approval = await approval_service.create_approval(
            unit_id=emp["unit_id"],
            type=ApprovalType.DECOMMISSION,
            subject_employee_id=employee_id,
            requested_by=req.actor,
            payload={
                "actor": req.actor,
                "reason": req.reason,
                "reassign_to": req.reassign_to,
            },
        )
        await audit_service.record(
            actor=req.actor,
            action="employee.decommission_requested",
            entity_type="employee",
            entity_id=employee_id,
            unit_id=emp["unit_id"],
            details={"approval_id": approval["id"]},
        )
        return {"pending": True, "employee": None, "approval": approval}

    retired = await _perform_decommission(
        emp, actor=req.actor, reason=req.reason, reassign_to=req.reassign_to
    )
    return {"pending": False, "employee": retired, "approval": None}


async def _perform_decommission(
    emp: dict[str, Any],
    *,
    actor: str | None,
    reason: str | None,
    reassign_to: str | None,
) -> dict[str, Any]:
    """Retire: revoke credentials, (reassign in-flight work), archive audit."""
    await identity_service.revoke(emp["id"])  # revoke the principal — access is gone
    now = utcnow()
    saved = await get_store().update(
        EMPLOYEES,
        emp["id"],
        {
            "status": EmployeeStatus.RETIRED.value,
            "principal_id": None,  # credential reference cleared
            "retired_at": now,
            "pause_reason": reason,
            "updated_at": now,
        },
    )
    assert saved is not None
    await audit_service.record(
        actor=actor,
        action="employee.decommissioned",
        entity_type="employee",
        entity_id=emp["id"],
        unit_id=emp["unit_id"],
        details={"reason": reason, "reassign_to": reassign_to},
    )
    return saved
