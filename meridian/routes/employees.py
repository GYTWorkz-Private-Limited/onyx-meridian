"""AI-Employee lifecycle endpoints.

POST .../deploy and .../decommission can return **202 Accepted** with a pending
approval (when the unit requires HITL sign-off) instead of **200 OK** with the
updated employee.
"""

from fastapi import APIRouter, Query, Response

from ..schemas.employee import (
    AutonomyChangeRequest,
    ConfigureRequest,
    DecommissionRequest,
    DeployRequest,
    EmployeeRead,
    InstantiateRequest,
    ResumeRequest,
    SuspendRequest,
)
from ..schemas.run import RunCreate, RunRead
from ..services import employee_service, identity_service, run_service

router = APIRouter(prefix="/employees", tags=["employees"])


# ---- registry --------------------------------------------------------------
@router.post("", response_model=EmployeeRead, status_code=201)
async def instantiate(req: InstantiateRequest):
    return await employee_service.instantiate(req)


@router.get("", response_model=list[EmployeeRead])
async def list_employees(
    unit_id: str | None = None,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await employee_service.list_employees(
        unit_id=unit_id, status=status, skip=skip, limit=limit
    )


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(employee_id: str):
    return await employee_service.get_employee(employee_id)


# ---- lifecycle -------------------------------------------------------------
@router.post("/{employee_id}/configure", response_model=EmployeeRead)
async def configure(employee_id: str, req: ConfigureRequest):
    return await employee_service.configure(employee_id, req)


@router.post("/{employee_id}/deploy")
async def deploy(employee_id: str, req: DeployRequest, response: Response):
    result = await employee_service.deploy(employee_id, req)
    if result["pending"]:
        response.status_code = 202
        return {"pending": True, "approval": result["approval"]}
    # The credential token is surfaced exactly once, here.
    return {
        "pending": False,
        "employee": result["employee"],
        "credential": result["credential"],
    }


@router.post("/{employee_id}/suspend", response_model=EmployeeRead)
async def suspend(employee_id: str, req: SuspendRequest):
    return await employee_service.suspend(employee_id, req)


@router.post("/{employee_id}/resume", response_model=EmployeeRead)
async def resume(employee_id: str, req: ResumeRequest):
    return await employee_service.resume(employee_id, req)


@router.post("/{employee_id}/autonomy/promote", response_model=EmployeeRead)
async def promote(employee_id: str, req: AutonomyChangeRequest):
    return await employee_service.promote_autonomy(employee_id, req)


@router.post("/{employee_id}/autonomy/demote", response_model=EmployeeRead)
async def demote(employee_id: str, req: AutonomyChangeRequest):
    return await employee_service.demote_autonomy(employee_id, req)


@router.post("/{employee_id}/decommission")
async def decommission(employee_id: str, req: DecommissionRequest, response: Response):
    result = await employee_service.decommission(employee_id, req)
    if result["pending"]:
        response.status_code = 202
        return {"pending": True, "approval": result["approval"]}
    return {"pending": False, "employee": result["employee"]}


# ---- identity (Vault) ------------------------------------------------------
@router.get("/{employee_id}/credential")
async def get_credential(employee_id: str):
    """Active credential metadata (no secret)."""
    await employee_service.get_employee(employee_id)
    return await identity_service.get_credential(employee_id)


@router.post("/{employee_id}/credential/rotate")
async def rotate_credential(employee_id: str):
    """Issue a fresh secret for the employee's principal; returns the token once."""
    await employee_service.get_employee(employee_id)
    return await identity_service.rotate(employee_id)


# ---- monitoring ------------------------------------------------------------
@router.post("/{employee_id}/heartbeat")
async def heartbeat(employee_id: str):
    return await run_service.heartbeat(employee_id)


@router.post("/{employee_id}/runs", response_model=RunRead, status_code=201)
async def create_run(employee_id: str, req: RunCreate):
    return await run_service.create_run(employee_id, req)


@router.get("/{employee_id}/runs", response_model=list[RunRead])
async def list_employee_runs(
    employee_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await run_service.list_runs(employee_id=employee_id, skip=skip, limit=limit)
