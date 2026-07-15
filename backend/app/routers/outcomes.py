from fastapi import APIRouter

from .. import mock_store as store

router = APIRouter(prefix="/api/outcomes", tags=["outcomes"])


@router.get("/metrics")
async def metrics():
    return store.outcomes_metrics


@router.get("/business-results")
async def business_results():
    return store.outcomes_business_results
