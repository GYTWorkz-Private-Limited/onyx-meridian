"""Schemas for the connector catalogue + connection instances."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Catalogue (read-only view of the connector repository)
# --------------------------------------------------------------------------- #
class ConnectorRead(BaseModel):
    """One connector in the repository — its identity, completeness, contract."""

    key: str
    platform: str
    domain: str
    display_name: str
    status: str                       # complete | incomplete | research_derived
    version: int = 1
    auth_type: str = "none"
    description: str = ""
    capabilities: dict[str, bool] = Field(default_factory=dict)
    properties: list[dict[str, Any]] = Field(default_factory=list)
    objects: list[dict[str, Any]] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# Connection instances (a configured connector, scoped to a unit)
# --------------------------------------------------------------------------- #
class ConnectionCreate(BaseModel):
    unit_id: str
    platform: str
    domain: str = "crm"
    name: str = Field(min_length=1, description="human label, e.g. 'Acme Salesforce'")
    properties: dict[str, Any] = Field(
        default_factory=dict, description="credentials + settings per the connector's property contract"
    )


class ConnectionRead(BaseModel):
    id: str
    unit_id: str
    platform: str
    domain: str
    name: str
    connector_key: str
    properties: dict[str, Any] = Field(default_factory=dict)  # secrets masked
    created_at: datetime | None = None


class ConnectionTestResult(BaseModel):
    ok: bool
    detail: str


# --------------------------------------------------------------------------- #
# Sync operations (pull / push through a connection)
# --------------------------------------------------------------------------- #
class PullRequest(BaseModel):
    object: str
    fields: list[str] = Field(default_factory=list)
    filters: dict[str, Any] = Field(default_factory=dict)
    modified_since: str | None = None
    cursor: str | None = None
    limit: int = Field(100, ge=1, le=500)


class PullResponse(BaseModel):
    ok: bool
    records: list[dict[str, Any]] = Field(default_factory=list)
    next_cursor: str | None = None
    has_more: bool = False
    summary: str = ""
    error: str | None = None


class PushRequest(BaseModel):
    object: str
    records: list[dict[str, Any]]
    mode: str = Field("insert", pattern="^(insert|update|upsert)$")
    external_id_field: str | None = None


class PushResponse(BaseModel):
    ok: bool
    written: int = 0
    failed: int = 0
    results: list[dict[str, Any]] = Field(default_factory=list)
    summary: str = ""
    error: str | None = None
