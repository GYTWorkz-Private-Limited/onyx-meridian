from fastapi import APIRouter

from .. import mock_store as store

router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])


@router.get("/summary")
async def summary():
    return store.enterprise_summary


@router.get("/risks")
async def risks():
    return store.enterprise_risks


@router.get("/opportunities")
async def opportunities():
    return store.enterprise_opportunities


@router.get("/intelligence-feed")
async def intelligence_feed():
    return store.enterprise_intelligence_feed


@router.get("/digital-twin")
async def digital_twin():
    return store.enterprise_digital_twin
