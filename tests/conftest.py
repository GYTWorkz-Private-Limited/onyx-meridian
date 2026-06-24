"""Test fixtures.

Each test gets a fresh TestClient. Entering the client's context manager runs the
app lifespan, which calls ``init_store(None)`` and installs a brand-new
in-memory store, so tests are isolated with zero infrastructure.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from meridian.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# --------------------------------------------------------------------------- #
# Builders — keep the e2e tests readable
# --------------------------------------------------------------------------- #
def make_unit(client: TestClient, *, active: bool = True, **overrides) -> dict:
    body = {
        "name": "Operations",
        "caretaker_user_id": "user_caretaker",
        "allowed_scopes": ["ops.*", "crm.read", "crm.write_task"],
        "require_approval_for_deploy": True,
        "require_approval_for_decommission": True,
        "budget_monthly_usd": 100.0,
    }
    body.update(overrides)
    unit = client.post("/units", json=body).json()
    if active:
        unit = client.post(f"/units/{unit['id']}/activate").json()
    return unit


def instantiate_employee(client: TestClient, unit_id: str, **overrides) -> dict:
    body = {"unit_id": unit_id, "display_name": "Meeting Scribe", "tier": "T1_execution"}
    body.update(overrides)
    return client.post("/employees", json=body).json()


def configure_employee(client: TestClient, employee_id: str, **overrides) -> dict:
    body = {
        "role": {"responsibilities": ["take minutes"], "kpis": ["capture_rate"]},
        "capabilities": ["tool.transcribe"],
        "permissions": {
            "data_scopes": ["ops.meetings"],
            "action_scopes": ["crm.write_task"],
            "deny": [],
        },
        "supervision": {"caretaker": "user_caretaker", "escalate_after_hrs": 8},
        "budget": {"monthly_usd": 50.0, "max_actions_per_hour": 60},
        "model_policy": {"preferred": "internal/onyx-llm", "allowed": []},
        "adapter_type": "echo",
        "adapter_config": {"tokens_per_run": {"input": 1000, "output": 250}},
        "actor": "user_caretaker",
    }
    body.update(overrides)
    return client.post(f"/employees/{employee_id}/configure", json=body).json()
