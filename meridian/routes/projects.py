from fastapi import APIRouter, Query

from ..schemas.project import ProjectCreate, ProjectRead
from ..services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(payload: ProjectCreate):
    return await project_service.create_project(payload)


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    unit_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await project_service.list_projects(unit_id=unit_id, skip=skip, limit=limit)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: str):
    return await project_service.get_project(project_id)
