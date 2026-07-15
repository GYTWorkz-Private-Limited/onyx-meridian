from fastapi import APIRouter, HTTPException

from .. import mock_store as store

router = APIRouter(prefix="/api/business-units", tags=["business-units"])


@router.get("")
async def list_business_units():
    return store.business_units


@router.get("/{bu_id}")
async def get_business_unit(bu_id: str):
    detail = store.business_unit_detail.get(bu_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Not found")
    return detail


@router.get("/{bu_id}/kpis")
async def get_business_unit_kpis(bu_id: str):
    return store.kpis_by_bu.get(bu_id, [])


@router.get("/{bu_id}/workflows")
async def get_business_unit_workflows(bu_id: str):
    return store.workflows_by_bu.get(bu_id, [])
