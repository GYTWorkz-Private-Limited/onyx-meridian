from fastapi import APIRouter, Query

from ..schemas.approval import ApprovalDecision, ApprovalRead
from ..services import approval_service

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("", response_model=list[ApprovalRead])
async def list_approvals(
    unit_id: str | None = None,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await approval_service.list_approvals(
        unit_id=unit_id, status=status, skip=skip, limit=limit
    )


@router.get("/{approval_id}", response_model=ApprovalRead)
async def get_approval(approval_id: str):
    return await approval_service.get_approval(approval_id)


@router.post("/{approval_id}/decide")
async def decide(approval_id: str, decision: ApprovalDecision):
    """Approve or reject. On approve, the parked action (deploy/decommission)
    is re-validated and executed."""
    return await approval_service.decide(approval_id, decision)
