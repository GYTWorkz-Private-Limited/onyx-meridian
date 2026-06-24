from fastapi import APIRouter, Query

from ..schemas.event import EventRead
from ..services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventRead])
async def list_events(
    unit_id: str | None = None,
    entity_id: str | None = None,
    type: str | None = None,
    limit: int = Query(50, ge=1, le=500),
):
    return await event_service.list_events(
        unit_id=unit_id, entity_id=entity_id, type=type, limit=limit
    )
