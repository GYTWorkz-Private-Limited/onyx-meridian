"""Unit (department / business unit) onboarding + registry.

A Unit is the scope an AI employee lives in. Employees may only *deploy* into a
Unit that has been onboarded to ``active`` status. In the full platform this
mirrors / consumes the OnyxOS org registry; here it is a first-class local entity
so the lifecycle slice is self-contained.
"""

from __future__ import annotations

from typing import Any

from ..domain.enums import UnitStatus
from ..schemas.common import utcnow
from ..schemas.unit import UnitCreate, UnitUpdate
from . import audit_service
from .errors import ConflictError, NotFoundError
from .store import UNITS, get_store


async def create_unit(payload: UnitCreate) -> dict[str, Any]:
    now = utcnow()
    doc = {
        **payload.model_dump(),
        "status": UnitStatus.ONBOARDING.value,
        "created_at": now,
        "updated_at": now,
    }
    created = await get_store().insert(UNITS, doc)
    await audit_service.record(
        actor=payload.caretaker_user_id,
        action="unit.created",
        entity_type="unit",
        entity_id=created["id"],
        unit_id=created["id"],
        details={"name": payload.name},
    )
    return created


async def get_unit(unit_id: str) -> dict[str, Any]:
    unit = await get_store().get(UNITS, unit_id)
    if not unit:
        raise NotFoundError(f"unit {unit_id} not found")
    return unit


async def list_units(skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
    return await get_store().list(UNITS, skip=skip, limit=limit, sort=("created_at", -1))


async def update_unit(unit_id: str, updates: UnitUpdate) -> dict[str, Any]:
    await get_unit(unit_id)
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    data["updated_at"] = utcnow()
    updated = await get_store().update(UNITS, unit_id, data)
    assert updated is not None
    return updated


async def activate_unit(unit_id: str, actor: str | None = None) -> dict[str, Any]:
    """Complete onboarding — flip the unit to ``active`` so employees can deploy."""
    unit = await get_unit(unit_id)
    if unit["status"] == UnitStatus.ARCHIVED.value:
        raise ConflictError("cannot activate an archived unit")
    updated = await get_store().update(
        UNITS, unit_id, {"status": UnitStatus.ACTIVE.value, "updated_at": utcnow()}
    )
    assert updated is not None
    await audit_service.record(
        actor=actor or unit.get("caretaker_user_id"),
        action="unit.activated",
        entity_type="unit",
        entity_id=unit_id,
        unit_id=unit_id,
    )
    return updated
