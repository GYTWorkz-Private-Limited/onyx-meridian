from fastapi import APIRouter

from .. import mock_store as store

router = APIRouter(prefix="/api/governance", tags=["governance"])


@router.get("/audit-logs")
async def audit_logs():
    return store.governance_audit_logs


@router.get("/policies")
async def policies():
    return store.governance_policies


@router.get("/approvals")
async def approvals():
    return store.governance_approvals


@router.get("/risk-scores")
async def risk_scores():
    return store.governance_risk_scores
