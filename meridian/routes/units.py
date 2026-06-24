from fastapi import APIRouter, Query

from ..schemas.audit import AuditEventRead
from ..schemas.dashboard import UnitDashboard
from ..schemas.employee import EmployeeRead
from ..schemas.task import TaskRead
from ..schemas.unit import UnitCreate, UnitRead, UnitUpdate
from ..services import (
    audit_service,
    dashboard_service,
    employee_service,
    task_service,
    unit_service,
)

router = APIRouter(prefix="/units", tags=["units"])


@router.post("", response_model=UnitRead, status_code=201)
async def create_unit(payload: UnitCreate):
    return await unit_service.create_unit(payload)


@router.get("", response_model=list[UnitRead])
async def list_units(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):
    return await unit_service.list_units(skip=skip, limit=limit)


@router.get("/{unit_id}", response_model=UnitRead)
async def get_unit(unit_id: str):
    return await unit_service.get_unit(unit_id)


@router.patch("/{unit_id}", response_model=UnitRead)
async def update_unit(unit_id: str, updates: UnitUpdate):
    return await unit_service.update_unit(unit_id, updates)


@router.post("/{unit_id}/activate", response_model=UnitRead)
async def activate_unit(unit_id: str, actor: str | None = None):
    return await unit_service.activate_unit(unit_id, actor=actor)


@router.get("/{unit_id}/employees", response_model=list[EmployeeRead])
async def list_unit_employees(
    unit_id: str,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    await unit_service.get_unit(unit_id)
    return await employee_service.list_employees(
        unit_id=unit_id, status=status, skip=skip, limit=limit
    )


@router.get("/{unit_id}/dashboard", response_model=UnitDashboard)
async def unit_dashboard(unit_id: str):
    return await dashboard_service.build_unit_dashboard(unit_id)


@router.get("/{unit_id}/audit", response_model=list[AuditEventRead])
async def unit_audit(unit_id: str, limit: int = Query(50, ge=1, le=500)):
    await unit_service.get_unit(unit_id)
    return await audit_service.list_events(unit_id=unit_id, limit=limit)


@router.get("/{unit_id}/tasks", response_model=list[TaskRead])
async def list_unit_tasks(
    unit_id: str,
    status: str | None = None,
    overdue: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    await unit_service.get_unit(unit_id)
    return await task_service.list_tasks(
        unit_id=unit_id, status=status, overdue=overdue, skip=skip, limit=limit
    )


@router.post("/{unit_id}/tasks/escalate")
async def escalate_unit_tasks(unit_id: str):
    """Run the escalation sweep for this unit: mark overdue commitments MISSED and
    emit escalation events; warn those nearing their due date."""
    await unit_service.get_unit(unit_id)
    return await task_service.escalate_due(unit_id=unit_id)
