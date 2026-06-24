"""Archetype registry — reusable AI-employee job templates.

Employees are instantiated *from* an archetype (or from scratch). The archetype
seeds capabilities, scopes, KPIs and the default adapter.
"""

from __future__ import annotations

from typing import Any

from ..schemas.archetype import ArchetypeCreate
from ..schemas.common import utcnow
from .errors import ConflictError, NotFoundError
from .store import ARCHETYPES, get_store


async def create_archetype(payload: ArchetypeCreate) -> dict[str, Any]:
    existing = await get_store().list(ARCHETYPES, {"key": payload.key}, limit=1)
    if existing:
        raise ConflictError(f"archetype '{payload.key}' already exists")
    doc = {**payload.model_dump(), "created_at": utcnow()}
    return await get_store().insert(ARCHETYPES, doc)


async def get_archetype(archetype_id: str) -> dict[str, Any]:
    doc = await get_store().get(ARCHETYPES, archetype_id)
    if not doc:
        raise NotFoundError(f"archetype {archetype_id} not found")
    return doc


async def get_by_key(key: str) -> dict[str, Any] | None:
    rows = await get_store().list(ARCHETYPES, {"key": key}, limit=1)
    return rows[0] if rows else None


async def list_archetypes(skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
    return await get_store().list(ARCHETYPES, skip=skip, limit=limit, sort=("key", 1))
