from fastapi import APIRouter

from .. import mock_store as store

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])


@router.get("/insights")
async def insights():
    return store.intelligence_insights


@router.get("/documents")
async def documents():
    return store.intelligence_documents


@router.get("/workflows")
async def workflows():
    return store.intelligence_workflows
