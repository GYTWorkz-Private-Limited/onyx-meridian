"""Connector catalogue + connection endpoints."""

from fastapi import APIRouter, Query

from ..schemas.connector import (
    ConnectionCreate,
    ConnectionRead,
    ConnectionTestResult,
    ConnectorRead,
    PullRequest,
    PullResponse,
    PushRequest,
    PushResponse,
)
from ..services import connection_service

router = APIRouter(tags=["connectors"])


# ---- catalogue -------------------------------------------------------------
@router.get("/connectors", response_model=list[ConnectorRead])
async def list_connectors():
    return connection_service.list_catalog()


@router.get("/connectors/{key}", response_model=ConnectorRead)
async def get_connector(key: str):
    return connection_service.get_catalog_entry(key)


# ---- connections -----------------------------------------------------------
@router.post("/connections", response_model=ConnectionRead, status_code=201)
async def create_connection(payload: ConnectionCreate):
    return await connection_service.create_connection(payload)


@router.get("/connections", response_model=list[ConnectionRead])
async def list_connections(
    unit_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await connection_service.list_connections(unit_id=unit_id, skip=skip, limit=limit)


@router.get("/connections/{connection_id}", response_model=ConnectionRead)
async def get_connection(connection_id: str):
    return await connection_service.get_connection(connection_id)


@router.post("/connections/{connection_id}/test", response_model=ConnectionTestResult)
async def test_connection(connection_id: str):
    return await connection_service.test_connection(connection_id)


# ---- sync (pull / push) ----------------------------------------------------
@router.post("/connections/{connection_id}/pull", response_model=PullResponse)
async def pull(connection_id: str, req: PullRequest):
    return await connection_service.pull(connection_id, req)


@router.post("/connections/{connection_id}/push", response_model=PushResponse)
async def push(connection_id: str, req: PushRequest):
    return await connection_service.push(connection_id, req)
