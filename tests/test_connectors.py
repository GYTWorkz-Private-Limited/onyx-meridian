"""Connector framework: catalogue, connection lifecycle, and pull/push.

Pull/push are exercised offline by injecting an ``httpx.MockTransport`` onto the
registered connector instance, so no network or real credentials are needed.
"""

import json

import httpx

from meridian.connectors import loader, registry, spec

from .conftest import make_unit


# --------------------------------------------------------------------------- #
# Catalogue / spec loading (no app needed)
# --------------------------------------------------------------------------- #
def test_catalog_discovers_three_connectors():
    specs = {s.key: s for s in loader.discover_specs()}
    assert {"salesforce.crm", "hubspot.crm", "zoho.crm"} <= set(specs)
    assert specs["salesforce.crm"].status == spec.STATUS_COMPLETE
    assert specs["hubspot.crm"].status == spec.STATUS_COMPLETE
    # the research-derived connector is honestly flagged, not "complete"
    assert specs["zoho.crm"].status == spec.STATUS_RESEARCH_DERIVED


def test_catalog_endpoint_lists_connectors(client):
    rows = client.get("/connectors").json()
    by_key = {r["key"]: r for r in rows}
    assert "salesforce.crm" in by_key
    sf = by_key["salesforce.crm"]
    assert sf["capabilities"]["pull"] and sf["capabilities"]["push"]
    # secret properties are declared but never carry a value in the catalogue
    token_prop = next(p for p in sf["properties"] if p["name"] == "access_token")
    assert token_prop["secret"] is True


def test_catalog_groups_by_platform(client):
    grouped = registry.by_platform()
    assert "salesforce" in grouped and "hubspot" in grouped and "zoho" in grouped


# --------------------------------------------------------------------------- #
# Connection lifecycle
# --------------------------------------------------------------------------- #
def test_create_connection_validates_required_properties(client):
    unit = make_unit(client)
    # missing access_token → rejected
    bad = client.post(
        "/connections",
        json={
            "unit_id": unit["id"],
            "platform": "salesforce",
            "name": "Acme SF",
            "properties": {"instance_url": "https://acme.my.salesforce.com"},
        },
    )
    assert bad.status_code == 409
    assert "access_token" in bad.json()["detail"]


def test_create_connection_masks_secrets(client):
    unit = make_unit(client)
    resp = client.post(
        "/connections",
        json={
            "unit_id": unit["id"],
            "platform": "salesforce",
            "name": "Acme SF",
            "properties": {
                "instance_url": "https://acme.my.salesforce.com",
                "access_token": "super-secret-token",
            },
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["connector_key"] == "salesforce.crm"
    assert body["properties"]["access_token"] == "***"          # masked
    assert body["properties"]["instance_url"].startswith("https://")  # not masked


def test_unknown_platform_404(client):
    unit = make_unit(client)
    resp = client.post(
        "/connections",
        json={"unit_id": unit["id"], "platform": "nope", "name": "x", "properties": {}},
    )
    assert resp.status_code == 404


# --------------------------------------------------------------------------- #
# Salesforce pull / push (mock transport)
# --------------------------------------------------------------------------- #
def _salesforce_handler(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    if path.endswith("/query"):
        return httpx.Response(
            200,
            json={
                "totalSize": 1,
                "done": True,
                "records": [
                    {"attributes": {"type": "Account"}, "Id": "001", "Name": "Acme"}
                ],
            },
        )
    if path.endswith("/composite/sobjects"):
        body = json.loads(request.content)
        return httpx.Response(
            200,
            json=[{"id": f"00{i}", "success": True, "errors": []}
                  for i, _ in enumerate(body["records"])],
        )
    return httpx.Response(404)


def _make_sf_connection(client) -> str:
    unit = make_unit(client)
    conn = client.post(
        "/connections",
        json={
            "unit_id": unit["id"],
            "platform": "salesforce",
            "name": "Acme SF",
            "properties": {
                "instance_url": "https://acme.my.salesforce.com",
                "access_token": "tok",
            },
        },
    ).json()
    # inject the offline transport onto the live, registered connector
    registry.get_connector("salesforce.crm").transport = httpx.MockTransport(_salesforce_handler)
    return conn["id"]


def test_salesforce_pull(client):
    conn_id = _make_sf_connection(client)
    resp = client.post(f"/connections/{conn_id}/pull", json={"object": "Account", "limit": 10})
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["records"][0]["Name"] == "Acme"
    # the per-record `attributes` envelope is stripped
    assert "attributes" not in data["records"][0]


def test_salesforce_push(client):
    conn_id = _make_sf_connection(client)
    resp = client.post(
        f"/connections/{conn_id}/push",
        json={"object": "Account", "mode": "insert",
              "records": [{"Name": "New Co"}, {"Name": "Other Co"}]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["written"] == 2


# --------------------------------------------------------------------------- #
# HubSpot pull / push (mock transport)
# --------------------------------------------------------------------------- #
def _hubspot_handler(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    if path == "/crm/v3/objects/contacts" and request.method == "GET":
        return httpx.Response(
            200,
            json={
                "results": [{"id": "1", "properties": {"email": "a@b.com"}}],
                "paging": {"next": {"after": "CURSOR2"}},
            },
        )
    if path == "/crm/v3/objects/contacts/batch/create":
        body = json.loads(request.content)
        return httpx.Response(
            200,
            json={"status": "COMPLETE",
                  "results": [{"id": str(i)} for i, _ in enumerate(body["inputs"])]},
        )
    return httpx.Response(404)


def test_hubspot_pull_and_cursor(client):
    unit = make_unit(client)
    conn = client.post(
        "/connections",
        json={"unit_id": unit["id"], "platform": "hubspot", "name": "HS",
              "properties": {"access_token": "tok"}},
    ).json()
    registry.get_connector("hubspot.crm").transport = httpx.MockTransport(_hubspot_handler)

    resp = client.post(f"/connections/{conn['id']}/pull", json={"object": "contacts"})
    data = resp.json()
    assert data["ok"] is True
    assert data["records"][0]["email"] == "a@b.com"
    assert data["records"][0]["id"] == "1"        # id folded in from the envelope
    assert data["has_more"] is True
    assert data["next_cursor"] == "CURSOR2"


def test_hubspot_push(client):
    unit = make_unit(client)
    conn = client.post(
        "/connections",
        json={"unit_id": unit["id"], "platform": "hubspot", "name": "HS",
              "properties": {"access_token": "tok"}},
    ).json()
    registry.get_connector("hubspot.crm").transport = httpx.MockTransport(_hubspot_handler)

    resp = client.post(
        f"/connections/{conn['id']}/push",
        json={"object": "contacts", "mode": "create",
              "records": [{"email": "x@y.com"}]},
    )
    # 'create' is not an allowed mode (insert|update|upsert) → 422 from the schema
    assert resp.status_code == 422


# --------------------------------------------------------------------------- #
# Research-mode agents (standalone runbook modules)
# --------------------------------------------------------------------------- #
def test_extraction_agent_brief_and_distill():
    import importlib.util
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    path = root / "meridian/connectors/agents/extraction-agent/extractor.py"
    mod_spec = importlib.util.spec_from_file_location("_extractor", path)
    extractor = importlib.util.module_from_spec(mod_spec)
    mod_spec.loader.exec_module(extractor)

    brief = extractor.build_research_brief("netsuite", "erp", ["Customer", "Invoice"])
    assert "netsuite" in brief and "Customer" in brief and "PUSH" in brief

    yaml_text = extractor.distill_spec_yaml("netsuite", "erp", "Auth: OAuth2\nBase: ...")
    assert "research_derived" in yaml_text
