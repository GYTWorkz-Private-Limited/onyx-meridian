"""Event bus (append-only).

Canonical-model state changes are emitted here. In the full platform these drive
Flow, reminders, and the dashboard; for now they are recorded and queryable so the
Task Registry's signal is captured from day one.
"""

from __future__ import annotations

from typing import Any

from ..schemas.common import utcnow
from .store import EVENTS, get_store


async def emit(
    *,
    type: str,
    entity_type: str,
    entity_id: str,
    unit_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    doc = {
        "type": type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "unit_id": unit_id,
        "payload": payload or {},
        "created_at": utcnow(),
    }
    return await get_store().insert(EVENTS, doc)


async def list_events(
    *,
    unit_id: str | None = None,
    entity_id: str | None = None,
    type: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    filters: dict[str, Any] = {}
    if unit_id:
        filters["unit_id"] = unit_id
    if entity_id:
        filters["entity_id"] = entity_id
    if type:
        filters["type"] = type
    return await get_store().list(EVENTS, filters, limit=limit, sort=("created_at", -1))
