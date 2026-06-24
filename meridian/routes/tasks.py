"""Action / Task Registry endpoints (the wedge)."""

from fastapi import APIRouter, Query

from ..domain.enums import TaskStatus
from ..schemas.task import (
    TaskCreate,
    TaskRead,
    TaskReassign,
    TaskStatusChange,
    TaskUpdate,
)
from ..services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead, status_code=201)
async def create_task(payload: TaskCreate):
    return await task_service.create_task(payload)


@router.get("", response_model=list[TaskRead])
async def list_tasks(
    unit_id: str | None = None,
    status: str | None = None,
    owner_id: str | None = None,
    project_id: str | None = None,
    overdue: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await task_service.list_tasks(
        unit_id=unit_id,
        status=status,
        owner_id=owner_id,
        project_id=project_id,
        overdue=overdue,
        skip=skip,
        limit=limit,
    )


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: str):
    return await task_service.get_task(task_id)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: str, updates: TaskUpdate):
    return await task_service.update_task(task_id, updates)


# ---- lifecycle transitions -------------------------------------------------
@router.post("/{task_id}/start", response_model=TaskRead)
async def start_task(task_id: str, body: TaskStatusChange | None = None):
    body = body or TaskStatusChange()
    return await task_service.change_status(task_id, TaskStatus.IN_PROGRESS, actor=body.actor, note=body.note)


@router.post("/{task_id}/block", response_model=TaskRead)
async def block_task(task_id: str, body: TaskStatusChange | None = None):
    body = body or TaskStatusChange()
    return await task_service.change_status(task_id, TaskStatus.BLOCKED, actor=body.actor, note=body.note)


@router.post("/{task_id}/complete", response_model=TaskRead)
async def complete_task(task_id: str, body: TaskStatusChange | None = None):
    body = body or TaskStatusChange()
    return await task_service.change_status(task_id, TaskStatus.DONE, actor=body.actor, note=body.note)


@router.post("/{task_id}/cancel", response_model=TaskRead)
async def cancel_task(task_id: str, body: TaskStatusChange | None = None):
    body = body or TaskStatusChange()
    return await task_service.change_status(task_id, TaskStatus.CANCELLED, actor=body.actor, note=body.note)


@router.post("/{task_id}/reassign", response_model=TaskRead)
async def reassign_task(task_id: str, req: TaskReassign):
    return await task_service.reassign(task_id, req)


# ---- dependencies ----------------------------------------------------------
@router.post("/{task_id}/dependencies/{dep_id}", response_model=TaskRead)
async def add_dependency(task_id: str, dep_id: str):
    return await task_service.add_dependency(task_id, dep_id)


@router.delete("/{task_id}/dependencies/{dep_id}", response_model=TaskRead)
async def remove_dependency(task_id: str, dep_id: str):
    return await task_service.remove_dependency(task_id, dep_id)
