"""Person registry — human staff, peers of AIEmployee in the org graph."""

from __future__ import annotations

from typing import Any

from ..schemas.common import utcnow
from ..schemas.person import PersonCreate
from .errors import NotFoundError
from .store import PERSONS, get_store


async def create_person(payload: PersonCreate) -> dict[str, Any]:
    now = utcnow()
    doc = {**payload.model_dump(), "created_at": now, "updated_at": now}
    return await get_store().insert(PERSONS, doc)


async def get_person(person_id: str) -> dict[str, Any]:
    doc = await get_store().get(PERSONS, person_id)
    if not doc:
        raise NotFoundError(f"person {person_id} not found")
    return doc


async def list_persons(
    *, unit_id: str | None = None, skip: int = 0, limit: int = 100
) -> list[dict[str, Any]]:
    filters = {"unit_id": unit_id} if unit_id else None
    return await get_store().list(PERSONS, filters, skip=skip, limit=limit, sort=("created_at", -1))
