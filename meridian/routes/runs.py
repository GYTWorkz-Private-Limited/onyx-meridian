from fastapi import APIRouter, Query

from ..schemas.run import RunRead
from ..services import run_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("", response_model=list[RunRead])
async def list_runs(
    employee_id: str | None = None,
    unit_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await run_service.list_runs(
        employee_id=employee_id, unit_id=unit_id, skip=skip, limit=limit
    )


@router.get("/{run_id}", response_model=RunRead)
async def get_run(run_id: str):
    return await run_service.get_run(run_id)
