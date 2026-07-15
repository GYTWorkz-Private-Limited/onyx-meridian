import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent / "mock_data"


def _load(name: str):
    with open(_DATA_DIR / f"{name}.json") as f:
        return json.load(f)


# Loaded once at import time and mutated in place for the handful of mock
# write endpoints (tasks, agent status/autonomy) — mirrors the old Express
# server's in-memory-array behavior. Not persisted across restarts.
enterprise_summary = _load("enterprise_summary")
enterprise_risks = _load("enterprise_risks")
enterprise_opportunities = _load("enterprise_opportunities")
enterprise_intelligence_feed = _load("enterprise_intelligence_feed")
enterprise_digital_twin = _load("enterprise_digital_twin")

business_units = _load("business_units")
business_unit_detail = {bu["id"]: _load(f"business_unit_{bu['id']}") for bu in business_units}
kpis_by_bu = {bu["id"]: _load(f"kpis_{bu['id']}") for bu in business_units}
workflows_by_bu = {bu["id"]: _load(f"workflows_{bu['id']}") for bu in business_units}

agents = _load("agents")
agents_summary = _load("agents_summary")
agent_details = {a["id"]: _load(f"agent_details/{a['id']}") for a in agents}

tasks = _load("tasks")
_next_task_id = max((int(t["id"][1:]) for t in tasks), default=0) + 1


def next_task_id() -> str:
    global _next_task_id
    tid = f"t{_next_task_id}"
    _next_task_id += 1
    return tid


intelligence_insights = _load("intelligence_insights")
intelligence_documents = _load("intelligence_documents")
intelligence_workflows = _load("intelligence_workflows")

governance_audit_logs = _load("governance_audit_logs")
governance_policies = _load("governance_policies")
governance_approvals = _load("governance_approvals")
governance_risk_scores = _load("governance_risk_scores")

outcomes_metrics = _load("outcomes_metrics")
outcomes_business_results = _load("outcomes_business_results")
