"""The leadership read-model: counts, spend, open approvals, staleness."""

from .conftest import configure_employee, instantiate_employee, make_unit


def test_dashboard_rollup(client):
    unit = make_unit(client, require_approval_for_deploy=False, budget_monthly_usd=100.0)

    # One deployed employee (never run -> stale), one left in draft.
    e1 = instantiate_employee(client, unit["id"], display_name="Scribe")
    configure_employee(client, e1["id"])
    client.post(f"/employees/{e1['id']}/deploy", json={})
    instantiate_employee(client, unit["id"], display_name="Drafter")  # stays draft

    dash = client.get(f"/units/{unit['id']}/dashboard").json()
    assert dash["unit_name"] == unit["name"]
    assert dash["employees_total"] == 2
    assert dash["by_status"]["deployed"] == 1
    assert dash["by_status"]["draft"] == 1
    assert dash["by_autonomy"]["shadow"] == 1
    assert dash["budget_monthly_usd"] == 100.0

    # The deployed-but-never-beaten employee shows up as stale.
    stale_ids = {s["id"] for s in dash["stale_employees"]}
    assert e1["id"] in stale_ids

    # Recent activity is populated from the audit ledger.
    assert len(dash["recent_activity"]) > 0


def test_dashboard_counts_open_approvals(client):
    unit = make_unit(client)  # deploy needs approval
    e1 = instantiate_employee(client, unit["id"])
    configure_employee(client, e1["id"])
    client.post(f"/employees/{e1['id']}/deploy", json={})  # opens an approval

    dash = client.get(f"/units/{unit['id']}/dashboard").json()
    assert dash["open_approvals"] == 1
