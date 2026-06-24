from fastapi import APIRouter, Query

from ..schemas.audit import AuditEventRead
from ..services import audit_service

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditEventRead])
async def list_audit(
    unit_id: str | None = None,
    entity_id: str | None = None,
    limit: int = Query(50, ge=1, le=500),
):
    return await audit_service.list_events(
        unit_id=unit_id, entity_id=entity_id, limit=limit
    )
