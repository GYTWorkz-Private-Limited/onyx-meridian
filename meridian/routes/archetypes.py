from fastapi import APIRouter, Query

from ..schemas.archetype import ArchetypeCreate, ArchetypeRead
from ..services import archetype_service

router = APIRouter(prefix="/archetypes", tags=["archetypes"])


@router.post("", response_model=ArchetypeRead, status_code=201)
async def create_archetype(payload: ArchetypeCreate):
    return await archetype_service.create_archetype(payload)


@router.get("", response_model=list[ArchetypeRead])
async def list_archetypes(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):
    return await archetype_service.list_archetypes(skip=skip, limit=limit)


@router.get("/{archetype_id}", response_model=ArchetypeRead)
async def get_archetype(archetype_id: str):
    return await archetype_service.get_archetype(archetype_id)
