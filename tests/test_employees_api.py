"""End-to-end AI-employee lifecycle through the API:
instantiate -> configure -> deploy (HITL) -> manage -> decommission (HITL)."""

from .conftest import configure_employee, instantiate_employee, make_unit


def test_full_lifecycle_with_approvals(client):
    unit = make_unit(client)  # active, approvals required for deploy + decommission

    # 1. INSTANTIATE -> draft
    emp = instantiate_employee(client, unit["id"], owner="user_head")
    assert emp["status"] == "draft"
    assert emp["version"] == 1
    assert emp["autonomy"] == "shadow"

    # 2. CONFIGURE -> configured, version bumps
    configured = configure_employee(client, emp["id"])
    assert configured["status"] == "configured"
    assert configured["version"] == 2
    assert configured["supervision"]["caretaker"] == "user_caretaker"

    # 3. DEPLOY -> parked as a pending approval (202), employee not yet live
    dep = client.post(f"/employees/{emp['id']}/deploy", json={"actor": "user_caretaker"})
    assert dep.status_code == 202
    approval = dep.json()["approval"]
    assert approval["type"] == "deploy" and approval["status"] == "pending"
    assert client.get(f"/employees/{emp['id']}").json()["status"] == "configured"

    # 3b. Caretaker approves -> employee deploys, starts in Shadow, gets a credential
    decided = client.post(
        f"/approvals/{approval['id']}/decide",
        json={"approve": True, "decided_by": "user_caretaker"},
    )
    assert decided.status_code == 200
    live = decided.json()["employee"]
    assert live["status"] == "deployed"
    assert live["autonomy"] == "shadow"
    assert live["principal_id"]

    # 4a. MANAGE: a run meters cost + stamps a heartbeat
    run = client.post(f"/employees/{emp['id']}/runs", json={"trigger_detail": "standup"})
    assert run.status_code == 201
    assert run.json()["status"] == "completed"
    assert client.get(f"/employees/{emp['id']}").json()["last_heartbeat_at"] is not None

    # 4b. MANAGE: promotion is Ensure-gated
    blocked = client.post(
        f"/employees/{emp['id']}/autonomy/promote", json={"eval_passed": False}
    )
    assert blocked.status_code == 403
    promoted = client.post(
        f"/employees/{emp['id']}/autonomy/promote", json={"eval_passed": True}
    )
    assert promoted.status_code == 200 and promoted.json()["autonomy"] == "assist"

    # 5. DECOMMISSION -> parked as approval (live principal), then retired
    dec = client.post(f"/employees/{emp['id']}/decommission", json={"reason": "role merged"})
    assert dec.status_code == 202
    dec_approval = dec.json()["approval"]
    retired = client.post(
        f"/approvals/{dec_approval['id']}/decide",
        json={"approve": True, "decided_by": "user_caretaker"},
    ).json()["employee"]
    assert retired["status"] == "retired"
    assert retired["principal_id"] is None  # credential revoked

    # Audit ledger recorded the journey
    audit = client.get(f"/units/{unit['id']}/audit").json()
    actions = {e["action"] for e in audit}
    assert {"employee.instantiated", "employee.configured", "employee.deployed",
            "employee.decommissioned"} <= actions


def test_deploy_without_approval_when_unit_allows(client):
    unit = make_unit(client, require_approval_for_deploy=False)
    emp = instantiate_employee(client, unit["id"])
    configure_employee(client, emp["id"])
    dep = client.post(f"/employees/{emp['id']}/deploy", json={})
    assert dep.status_code == 200
    assert dep.json()["employee"]["status"] == "deployed"


def test_cannot_deploy_a_draft(client):
    unit = make_unit(client)
    emp = instantiate_employee(client, unit["id"])  # still draft
    dep = client.post(f"/employees/{emp['id']}/deploy", json={})
    assert dep.status_code == 409  # illegal lifecycle transition


def test_cannot_deploy_into_an_unonboarded_unit(client):
    unit = make_unit(client, active=False, require_approval_for_deploy=False)
    emp = instantiate_employee(client, unit["id"])
    configure_employee(client, emp["id"])
    dep = client.post(f"/employees/{emp['id']}/deploy", json={})
    assert dep.status_code == 403  # policy: unit must be active


def test_instantiate_from_archetype(client):
    unit = make_unit(client)
    client.post(
        "/archetypes",
        json={
            "key": "ops.meeting_scribe",
            "display_name": "Meeting Scribe",
            "tier": "T1_execution",
            "default_capabilities": ["tool.transcribe"],
            "default_data_scopes": ["ops.meetings"],
            "default_kpis": ["capture_rate"],
            "default_adapter_type": "echo",
        },
    )
    emp = client.post(
        "/employees",
        json={"unit_id": unit["id"], "archetype": "ops.meeting_scribe"},
    ).json()
    assert emp["display_name"] == "Meeting Scribe"
    assert emp["capabilities"] == ["tool.transcribe"]
    assert emp["archetype"] == "ops.meeting_scribe"
