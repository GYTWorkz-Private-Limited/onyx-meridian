"""Connection service — the catalogue + connection-instance orchestration.

Two surfaces:

* **Catalogue** — read the connector repository (the registry) so callers can see
  what platforms the spine integrates with and how complete each connector is.
* **Connections** — a configured instance of a connector scoped to a unit (its
  credentials + settings), plus the pull/push operations that run through it.

Connectors are pure transport; this service owns persistence, secret masking, and
turning a stored connection into a validated ``ConnectionContext``.
"""

from __future__ import annotations

from typing import Any

from ..connectors import registry
from ..connectors.base import ConnectionContext, ConnectorError, PullSpec, PushSpec
from ..schemas.common import utcnow
from ..schemas.connector import ConnectionCreate, PullRequest, PushRequest
from .errors import ConflictError, NotFoundError
from .store import CONNECTIONS, get_store

_SECRET_MASK = "***"


# --------------------------------------------------------------------------- #
# Catalogue
# --------------------------------------------------------------------------- #
def list_catalog() -> list[dict[str, Any]]:
    """Every registered connector, as a catalogue view (no secret values)."""
    out: list[dict[str, Any]] = []
    for connector in registry.all_connectors():
        if connector.spec is not None:
            out.append(connector.spec.public_dict())
        else:  # pragma: no cover - a connector registered without a spec
            out.append(
                {
                    "key": connector.key,
                    "platform": connector.platform,
                    "domain": connector.domain,
                    "display_name": connector.platform.title(),
                    "status": "incomplete",
                    "capabilities": {},
                    "properties": [],
                    "objects": [],
                }
            )
    return out


def get_catalog_entry(key: str) -> dict[str, Any]:
    try:
        connector = registry.get_connector(key)
    except KeyError as exc:
        raise NotFoundError(str(exc)) from None
    if connector.spec is None:  # pragma: no cover
        raise NotFoundError(f"connector '{key}' has no spec")
    return connector.spec.public_dict()


# --------------------------------------------------------------------------- #
# Connections
# --------------------------------------------------------------------------- #
def _secret_property_names(connector) -> set[str]:
    if connector.spec is None:
        return set()
    return {p.name for p in connector.spec.properties if p.secret}


def _mask(doc: dict[str, Any], connector) -> dict[str, Any]:
    secrets = _secret_property_names(connector)
    props = {
        k: (_SECRET_MASK if k in secrets and v else v)
        for k, v in (doc.get("properties") or {}).items()
    }
    out = dict(doc)
    out["properties"] = props
    return out


def _connector_for(platform: str, domain: str):
    try:
        return registry.get_connector_for(platform, domain)
    except KeyError as exc:
        raise NotFoundError(str(exc)) from None


async def create_connection(payload: ConnectionCreate) -> dict[str, Any]:
    connector = _connector_for(payload.platform, payload.domain)
    problems = connector.validate_properties(payload.properties)
    if problems:
        raise ConflictError("invalid connection properties: " + "; ".join(problems))
    doc = {
        "unit_id": payload.unit_id,
        "platform": payload.platform,
        "domain": payload.domain,
        "name": payload.name,
        "connector_key": connector.key,
        "properties": payload.properties,
        "created_at": utcnow(),
    }
    saved = await get_store().insert(CONNECTIONS, doc)
    return _mask(saved, connector)


async def list_connections(
    unit_id: str | None = None, skip: int = 0, limit: int = 100
) -> list[dict[str, Any]]:
    filters = {"unit_id": unit_id} if unit_id else None
    rows = await get_store().list(CONNECTIONS, filters, skip=skip, limit=limit, sort=("created_at", -1))
    out = []
    for row in rows:
        try:
            connector = registry.get_connector(row["connector_key"])
        except KeyError:  # pragma: no cover - connector removed
            out.append(row)
            continue
        out.append(_mask(row, connector))
    return out


async def _get_raw(connection_id: str) -> dict[str, Any]:
    doc = await get_store().get(CONNECTIONS, connection_id)
    if not doc:
        raise NotFoundError(f"connection {connection_id} not found")
    return doc


async def get_connection(connection_id: str) -> dict[str, Any]:
    doc = await _get_raw(connection_id)
    connector = _connector_for(doc["platform"], doc["domain"])
    return _mask(doc, connector)


def _context(doc: dict[str, Any]) -> ConnectionContext:
    return ConnectionContext(
        platform=doc["platform"],
        domain=doc["domain"],
        properties=doc.get("properties", {}),
    )


async def test_connection(connection_id: str) -> dict[str, Any]:
    doc = await _get_raw(connection_id)
    connector = _connector_for(doc["platform"], doc["domain"])
    ok, detail = await connector.test_connection(_context(doc))
    return {"ok": ok, "detail": detail}


async def pull(connection_id: str, req: PullRequest) -> dict[str, Any]:
    doc = await _get_raw(connection_id)
    connector = _connector_for(doc["platform"], doc["domain"])
    if not connector.capabilities.pull:
        raise ConflictError(f"{connector.key} does not support pull")
    spec = PullSpec(
        object=req.object,
        filters=req.filters,
        fields=req.fields,
        modified_since=req.modified_since,
        cursor=req.cursor,
        limit=req.limit,
    )
    try:
        page = await connector.pull(_context(doc), spec)
    except ConnectorError as exc:
        return {"ok": False, "records": [], "error": str(exc)}
    return {
        "ok": page.ok,
        "records": page.records,
        "next_cursor": page.next_cursor,
        "has_more": page.has_more,
        "summary": page.summary,
        "error": page.error,
    }


async def push(connection_id: str, req: PushRequest) -> dict[str, Any]:
    doc = await _get_raw(connection_id)
    connector = _connector_for(doc["platform"], doc["domain"])
    if not connector.capabilities.push:
        raise ConflictError(f"{connector.key} does not support push")
    if req.mode == "upsert" and not connector.capabilities.upsert:
        raise ConflictError(f"{connector.key} does not support upsert")
    spec = PushSpec(
        object=req.object,
        records=req.records,
        mode=req.mode,
        external_id_field=req.external_id_field,
    )
    try:
        outcome = await connector.push(_context(doc), spec)
    except ConnectorError as exc:
        return {"ok": False, "written": 0, "failed": len(req.records), "error": str(exc)}
    return {
        "ok": outcome.ok,
        "written": outcome.written,
        "failed": outcome.failed,
        "results": outcome.results,
        "summary": outcome.summary,
        "error": outcome.error,
    }
