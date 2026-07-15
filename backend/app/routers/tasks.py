from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import mock_store as store

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("")
async def list_tasks():
    return store.tasks


class TaskCreate(BaseModel):
    title: str
    priority: str
    owner: str
    ownerType: str | None = "human"
    linkedKpi: str | None = None
    dueDate: str | None = None
    businessUnitId: str | None = None
    department: str | None = None
    workflow: str | None = None


@router.post("", status_code=201)
async def create_task(body: TaskCreate):
    task: dict[str, Any] = {
        "id": store.next_task_id(),
        "title": body.title,
        "status": "todo",
        "priority": body.priority,
        "owner": body.owner,
        "ownerType": body.ownerType or "human",
        "linkedKpi": body.linkedKpi,
        "dueDate": body.dueDate,
        "progress": 0,
        "businessUnitId": body.businessUnitId,
        "companyId": "company-a",
        "aiGenerated": False,
        "department": body.department,
        "workflow": body.workflow,
        "dependencies": [],
        "escalationStatus": "none",
        "linkedRecommendation": None,
        "expectedOutcome": None,
    }
    store.tasks.append(task)
    return task


class TaskPatch(BaseModel):
    title: str | None = None
    status: str | None = None
    priority: str | None = None
    progress: int | None = None
    owner: str | None = None
    ownerType: str | None = None
    escalationStatus: str | None = None


@router.patch("/{task_id}")
async def patch_task(task_id: str, body: TaskPatch):
    task = next((t for t in store.tasks if t["id"] == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail="Not found")
    for field in ("title", "status", "priority", "progress", "owner", "ownerType", "escalationStatus"):
        value = getattr(body, field)
        if value is not None:
            task[field] = value
    return task
