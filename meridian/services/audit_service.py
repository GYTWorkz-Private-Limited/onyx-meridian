"""Audit Ledger (Vault, L4 Governance) — append-only.

Every governed action records one entry here. There is intentionally no update
or delete path: the ledger is immutable so it can answer "who did what, when,
and why" for any action the workforce takes (design principle 7).
"""

from __future__ import annotations

from typing import Any

from ..schemas.common import utcnow
from .store import AUDIT, get_store


async def record(
    *,
    actor: str | None,
    action: str,
    entity_type: str,
    entity_id: str,
    unit_id: str | None = None,
    actor_type: str = "user",
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    doc = {
        "actor": actor or "system",
        "actor_type": actor_type,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "unit_id": unit_id,
        "details": details or {},
        "created_at": utcnow(),
    }
    return await get_store().insert(AUDIT, doc)


async def list_events(
    *,
    unit_id: str | None = None,
    entity_id: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    filters: dict[str, Any] = {}
    if unit_id:
        filters["unit_id"] = unit_id
    if entity_id:
        filters["entity_id"] = entity_id
    return await get_store().list(
        AUDIT, filters, limit=limit, sort=("created_at", -1)
    )
