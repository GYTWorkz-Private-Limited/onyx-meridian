"""Agent identity: crypto helpers + the issue/verify/rotate/revoke flow via API."""

from meridian.governance import identity

from .conftest import configure_employee, instantiate_employee, make_unit


# ---- pure helpers ----------------------------------------------------------
def test_token_hash_is_deterministic_and_peppered():
    t = identity.generate_token()
    assert t.startswith("omk_")
    h1 = identity.hash_token(t, "pepper-a")
    assert h1 == identity.hash_token(t, "pepper-a")     # deterministic
    assert h1 != identity.hash_token(t, "pepper-b")     # pepper matters
    assert identity.verify_token(t, h1, "pepper-a")
    assert not identity.verify_token("omk_wrong", h1, "pepper-a")


def test_tokens_are_unique():
    assert identity.generate_token() != identity.generate_token()


# ---- API: credential issued on deploy, verifiable, revoked on decommission -
def _deploy_direct(client, unit_id):
    emp = instantiate_employee(client, unit_id)
    configure_employee(client, emp["id"])
    dep = client.post(f"/employees/{emp['id']}/deploy", json={})
    return emp, dep


def test_credential_issued_on_deploy_and_verifies(client):
    unit = make_unit(client, require_approval_for_deploy=False)
    emp, dep = _deploy_direct(client, unit["id"])
    assert dep.status_code == 200
    cred = dep.json()["credential"]
    assert cred["token"].startswith("omk_")
    assert cred["principal_id"] == dep.json()["employee"]["principal_id"]

    # The token authenticates and returns the principal's claims.
    v = client.post("/identity/verify", json={"token": cred["token"]})
    assert v.status_code == 200
    claims = v.json()
    assert claims["valid"] is True
    assert claims["employee_id"] == emp["id"]
    assert claims["unit_id"] == unit["id"]
    assert "ops.meetings" in claims["scopes"]  # from configure_employee

    # A bogus token is rejected.
    assert client.post("/identity/verify", json={"token": "omk_nope"}).status_code == 401


def test_rotate_invalidates_old_token(client):
    unit = make_unit(client, require_approval_for_deploy=False)
    _, dep = _deploy_direct(client, unit["id"])
    emp_id = dep.json()["employee"]["id"]
    old = dep.json()["credential"]["token"]

    rotated = client.post(f"/employees/{emp_id}/credential/rotate").json()
    new = rotated["token"]
    assert new != old
    assert client.post("/identity/verify", json={"token": new}).status_code == 200
    assert client.post("/identity/verify", json={"token": old}).status_code == 401


def test_decommission_revokes_credential(client):
    unit = make_unit(client, require_approval_for_deploy=False, require_approval_for_decommission=False)
    _, dep = _deploy_direct(client, unit["id"])
    emp_id = dep.json()["employee"]["id"]
    token = dep.json()["credential"]["token"]

    client.post(f"/employees/{emp_id}/decommission", json={"reason": "done"})
    # Identity revoked: the token no longer authenticates.
    assert client.post("/identity/verify", json={"token": token}).status_code == 401
    # And the credential metadata is gone.
    assert client.get(f"/employees/{emp_id}/credential").status_code == 404


def test_run_is_attributed_to_principal(client):
    unit = make_unit(client, require_approval_for_deploy=False)
    _, dep = _deploy_direct(client, unit["id"])
    emp = dep.json()["employee"]
    run = client.post(f"/employees/{emp['id']}/runs", json={"trigger_detail": "x"}).json()
    assert run["principal_id"] == emp["principal_id"]
