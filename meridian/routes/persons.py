from fastapi import APIRouter, Query

from ..schemas.person import PersonCreate, PersonRead
from ..services import person_service

router = APIRouter(prefix="/persons", tags=["persons"])


@router.post("", response_model=PersonRead, status_code=201)
async def create_person(payload: PersonCreate):
    return await person_service.create_person(payload)


@router.get("", response_model=list[PersonRead])
async def list_persons(
    unit_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await person_service.list_persons(unit_id=unit_id, skip=skip, limit=limit)


@router.get("/{person_id}", response_model=PersonRead)
async def get_person(person_id: str):
    return await person_service.get_person(person_id)
