"""Project registry — initiatives spanning tasks / people / units."""

from __future__ import annotations

from typing import Any

from ..domain.enums import ProjectStatus
from ..schemas.common import utcnow
from ..schemas.project import ProjectCreate
from . import unit_service
from .errors import NotFoundError
from .store import PROJECTS, get_store


async def create_project(payload: ProjectCreate) -> dict[str, Any]:
    await unit_service.get_unit(payload.unit_id)  # 404 if unknown
    now = utcnow()
    doc = {
        **payload.model_dump(),
        "status": ProjectStatus.ACTIVE.value,
        "created_at": now,
        "updated_at": now,
    }
    return await get_store().insert(PROJECTS, doc)


async def get_project(project_id: str) -> dict[str, Any]:
    doc = await get_store().get(PROJECTS, project_id)
    if not doc:
        raise NotFoundError(f"project {project_id} not found")
    return doc


async def list_projects(
    *, unit_id: str | None = None, skip: int = 0, limit: int = 100
) -> list[dict[str, Any]]:
    filters = {"unit_id": unit_id} if unit_id else None
    return await get_store().list(PROJECTS, filters, skip=skip, limit=limit, sort=("created_at", -1))
