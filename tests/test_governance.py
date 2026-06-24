"""Governance: policy-engine unit tests + budget hard-stop and policy denial
exercised through the API."""

from meridian.domain.enums import EmployeeStatus, UnitStatus
from meridian.governance import policy

from .conftest import configure_employee, instantiate_employee, make_unit


# ---- pure policy-engine tests ---------------------------------------------
def test_least_privilege_allows_within_catalog():
    v = policy.authorize_configuration(
        requested_data_scopes=["ops.meetings"],
        requested_action_scopes=["crm.write_task"],
        deny_scopes=[],
        grantable_scopes=["ops.*", "crm.write_task"],
    )
    assert v.allowed


def test_least_privilege_denies_scope_outside_catalog():
    v = policy.authorize_configuration(
        requested_data_scopes=["finance.ledger"],
        requested_action_scopes=[],
        deny_scopes=[],
        grantable_scopes=["ops.*"],
    )
    assert not v.allowed
    assert any("finance.ledger" in r for r in v.reasons)


def test_grant_and_deny_conflict_is_rejected():
    v = policy.authorize_configuration(
        requested_data_scopes=["ops.meetings"],
        requested_action_scopes=[],
        deny_scopes=["ops.meetings"],
        grantable_scopes=["ops.*"],
    )
    assert not v.allowed


def test_deploy_requires_active_unit_and_caretaker():
    v = policy.authorize_deploy(
        employee_status=EmployeeStatus.CONFIGURED,
        unit_status=UnitStatus.ONBOARDING,
        has_caretaker=False,
    )
    assert not v.allowed
    assert len(v.reasons) == 2  # unit not active + no caretaker


# ---- API: configuring an out-of-catalog scope is denied (403) -------------
def test_configure_out_of_catalog_scope_denied(client):
    unit = make_unit(client, allowed_scopes=["ops.*"])
    emp = instantiate_employee(client, unit["id"])
    resp = client.post(
        f"/employees/{emp['id']}/configure",
        json={
            "permissions": {
                "data_scopes": ["finance.ledger"],  # not delegatable in this unit
                "action_scopes": [],
                "deny": [],
            },
            "supervision": {"caretaker": "user_caretaker"},
        },
    )
    assert resp.status_code == 403
    assert "finance.ledger" in resp.text


# ---- API: budget hard-stop auto-suspends + opens an override approval ------
def test_budget_hard_stop(client):
    unit = make_unit(client, require_approval_for_deploy=False)
    emp = instantiate_employee(client, unit["id"])
    configure_employee(
        client,
        emp["id"],
        budget={"monthly_usd": 0.01, "max_actions_per_hour": None},
        model_policy={"preferred": "azure/gpt-4o", "allowed": ["azure/gpt-4o"]},
        adapter_config={"tokens_per_run": {"input": 100000, "output": 100000}},
    )
    deployed = client.post(f"/employees/{emp['id']}/deploy", json={"actor": "user_caretaker"})
    assert deployed.status_code == 200
    assert deployed.json()["employee"]["status"] == "deployed"

    run = client.post(f"/employees/{emp['id']}/runs", json={"trigger_detail": "expensive"})
    assert run.status_code == 201
    assert run.json()["cost_usd"] > 0.01

    after = client.get(f"/employees/{emp['id']}").json()
    assert after["status"] == EmployeeStatus.SUSPENDED.value
    assert after["pause_reason"] == "budget exceeded"

    overrides = client.get("/approvals", params={"unit_id": unit["id"], "status": "pending"}).json()
    assert any(a["type"] == "budget_override" for a in overrides)
