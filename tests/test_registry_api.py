"""End-to-end Action/Task Registry: provenance, dependencies, escalation, ingest."""

from .conftest import make_unit


def _task(client, unit_id, **overrides):
    body = {"unit_id": unit_id, "title": "Send revised quote"}
    body.update(overrides)
    return client.post("/tasks", json=body)


def test_create_task_with_provenance(client):
    unit = make_unit(client)
    doc = client.post(
        "/documents",
        json={"unit_id": unit["id"], "kind": "meeting", "title": "Weekly sync", "content": "..."},
    ).json()
    resp = _task(
        client,
        unit["id"],
        source={"type": "meeting", "doc_id": doc["id"], "quote": "Ravi will send the quote"},
    )
    assert resp.status_code == 201
    task = resp.json()
    assert task["status"] == "open"
    assert task["source"]["doc_id"] == doc["id"]
    assert task["audit_ref"]  # linked to the immutable ledger

    # provenance must resolve — bad doc_id is rejected
    bad = _task(client, unit["id"], source={"type": "meeting", "doc_id": "nope"})
    assert bad.status_code == 404


def test_dependency_blocks_completion(client):
    unit = make_unit(client)
    a = _task(client, unit["id"], title="A").json()
    b = _task(client, unit["id"], title="B", depends_on=[a["id"]]).json()

    # B cannot complete while A is open
    blocked = client.post(f"/tasks/{b['id']}/complete")
    assert blocked.status_code == 409

    assert client.post(f"/tasks/{a['id']}/complete").status_code == 200
    assert client.post(f"/tasks/{b['id']}/complete").status_code == 200


def test_dependency_cycle_rejected(client):
    unit = make_unit(client)
    a = _task(client, unit["id"], title="A").json()
    b = _task(client, unit["id"], title="B").json()
    assert client.post(f"/tasks/{a['id']}/dependencies/{b['id']}").status_code == 200
    # b -> a would close the loop
    cyc = client.post(f"/tasks/{b['id']}/dependencies/{a['id']}")
    assert cyc.status_code == 409


def test_illegal_transition_rejected(client):
    unit = make_unit(client)
    t = _task(client, unit["id"]).json()
    client.post(f"/tasks/{t['id']}/cancel")  # -> cancelled (terminal)
    again = client.post(f"/tasks/{t['id']}/start")
    assert again.status_code == 409


def test_escalation_sweep_marks_overdue_missed(client):
    unit = make_unit(client)
    t = _task(client, unit["id"], due="2020-01-01T00:00:00Z").json()
    sweep = client.post(f"/units/{unit['id']}/tasks/escalate").json()
    assert t["id"] in sweep["escalated"]

    after = client.get(f"/tasks/{t['id']}").json()
    assert after["status"] == "missed"
    assert after["escalated_at"] is not None

    events = client.get("/events", params={"entity_id": t["id"], "type": "task.escalated"}).json()
    assert len(events) == 1


def test_ingest_transcript_creates_commitments(client):
    unit = make_unit(client)
    client.post(
        "/persons", json={"name": "Ravi Kumar", "unit_id": unit["id"], "role": "Sales"}
    )
    resp = client.post(
        "/ingest/transcript",
        json={
            "unit_id": unit["id"],
            "title": "Sales sync",
            "content": "Ravi will send the revised quote to Client X by Friday. "
            "Priya to prepare the budget report.",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["tasks"]) == 2

    # Ravi resolves to the person; Priya does not (flagged for triage)
    by_title = {t["title"]: t for t in data["tasks"]}
    ravi_task = by_title["send the revised quote to Client X"]
    assert ravi_task["owner"]["type"] == "person"
    assert ravi_task["source"]["doc_id"] == data["document"]["id"]
    assert "Ravi" in ravi_task["source"]["quote"]
    assert "Priya" in data["unresolved_owners"]


def test_dashboard_task_rollup(client):
    unit = make_unit(client)
    _task(client, unit["id"], title="A")
    done = _task(client, unit["id"], title="B").json()
    client.post(f"/tasks/{done['id']}/complete")
    _task(client, unit["id"], title="C", due="2020-01-01T00:00:00Z")

    dash = client.get(f"/units/{unit['id']}/dashboard").json()
    assert dash["commitments_total"] == 3
    assert dash["open_commitments"] == 2          # A + C (overdue but still open)
    assert dash["overdue_commitments"] == 1       # C
    assert dash["commitments_by_status"]["done"] == 1
    assert 0.0 < dash["completion_rate"] <= 1.0
