# Onyx Meridian

The control-plane **spine** of the [Onyx Meridian framework](../FRAMEWORK/README.md):
the registry, lifecycle, and governance that turn a department's AI workers into
**governed principals you can configure, deploy, monitor, and decommission** —
managed like staff, not like prompts.

> Onyx Meridian (the framework) already has its capabilities: **Pulse** (knowledge,
> `lms-onyx`), **Prism** (decision intel, `onyx-pulse`/`ConvBI`), and an org
> registry (`onyxos`). What was missing is the *spine* that binds them: the
> canonical AI-employee model, the lifecycle state machine, and the governance
> hooks. That is this repo.

## What it does

Once a **department (Unit)** is onboarded, Meridian runs the AI-employee lifecycle
end to end:

```
INSTANTIATE  ->  CONFIGURE  ->  DEPLOY  ->  MANAGE  ->  DECOMMISSION
  (draft)      (configured)   (deployed)  (deployed)    (retired)
```

- **Configure** — set role/KPIs, attach capabilities, grant *least-privilege*
data/action scopes (checked against the unit's catalog), set budget, model
policy, and an accountable caretaker. Every change bumps an immutable version.
- **Deploy** — only into an *onboarded (active)* unit, only with a caretaker, and
starting in **Shadow** autonomy. A scoped credential is issued. When the unit
requires it, deploy is parked as a **one-tap approval** ("AI proposes, a human
commits").
- **Monitor** — run heartbeats, meter token cost through the model gateway, track
spend against budget (with an auto-suspend **hard stop**), and surface the unit
on a leadership dashboard (state/tier/autonomy counts, spend, stale workers,
open approvals, recent audit).
- **Decommission** — retire cleanly: revoke the credential, reassign in-flight
work, archive the audit trail. Reversible by design; nothing is a one-way door.

Every transition is checked by the **state machine**, authorized by the **policy
engine**, recorded in the **immutable audit ledger**, and versioned.

## Quickstart

```bash
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# Run the API (no database needed — it falls back to an in-memory store)
uvicorn meridian.main:app --reload --port 8010
# open http://localhost:8010/docs

# Run the tests
pytest
```

Walk one employee through its life:

```bash
BASE=http://localhost:8010

# 1. Onboard a department and activate it
UNIT=$(curl -s $BASE/units -H 'content-type: application/json' -d '{
  "name":"Operations","caretaker_user_id":"user_ravi",
  "allowed_scopes":["ops.*","crm.write_task"],
  "require_approval_for_deploy":false}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s -X POST $BASE/units/$UNIT/activate >/dev/null

# 2. Instantiate -> configure -> deploy
EMP=$(curl -s $BASE/employees -H 'content-type: application/json' -d "{\"unit_id\":\"$UNIT\",\"display_name\":\"Meeting Scribe\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s -X POST $BASE/employees/$EMP/configure -H 'content-type: application/json' -d '{
  "permissions":{"data_scopes":["ops.meetings"],"action_scopes":["crm.write_task"]},
  "supervision":{"caretaker":"user_ravi"},
  "budget":{"monthly_usd":50}}' >/dev/null
curl -s -X POST $BASE/employees/$EMP/deploy -H 'content-type: application/json' -d '{}'

# 3. Monitor: run a heartbeat, then read the unit dashboard
curl -s -X POST $BASE/employees/$EMP/runs -H 'content-type: application/json' -d '{"trigger_detail":"standup"}'
curl -s $BASE/units/$UNIT/dashboard
```

## API surface


| Area           | Endpoint                                                     | Purpose                                              |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Units          | `POST /units` · `POST /units/{id}/activate`                  | onboard + activate a department                      |
|                | `GET /units/{id}/dashboard`                                  | leadership read-model (Prism slice)                  |
|                | `GET /units/{id}/employees` · `/tasks` · `/audit`            | unit roster, commitments, audit trail                |
|                | `POST /units/{id}/tasks/escalate`                            | escalation sweep (mark overdue MISSED)               |
| Archetypes     | `POST /archetypes` · `GET /archetypes`                       | reusable job templates                               |
| Employees      | `POST /employees`                                            | **instantiate** (from archetype or scratch)          |
|                | `POST /employees/{id}/configure`                             | **configure** (versioned, policy-checked)            |
|                | `POST /employees/{id}/deploy`                                | **deploy** (→ 202 + approval when HITL-gated)        |
|                | `POST /employees/{id}/suspend` · `/resume`                   | pause / resume                                       |
|                | `POST /employees/{id}/autonomy/promote` · `/demote`          | move the trust ladder (promote needs a passing eval) |
|                | `POST /employees/{id}/decommission`                          | **retire** (→ 202 + approval for live principals)    |
| Monitoring     | `POST /employees/{id}/runs` · `/heartbeat`                   | execute + meter cost / liveness                      |
|                | `GET /runs` · `GET /employees/{id}/runs`                     | run history                                          |
| Governance     | `GET /approvals` · `POST /approvals/{id}/decide`             | the one-tap approval queue                           |
|                | `GET /audit`                                                 | the immutable ledger                                 |
| Identity       | `GET /employees/{id}/credential` · `/credential/rotate`      | scoped principal credential (token shown once)       |
|                | `POST /identity/verify`                                      | authenticate an agent-principal token → claims       |
| **Registry** ★ | `POST /tasks` · `GET /tasks`                                 | Action/Task Registry (commitments)                   |
|                | `POST /tasks/{id}/start|complete|cancel|block`               | commitment lifecycle                                 |
|                | `POST /tasks/{id}/dependencies/{dep}` · `/reassign`          | dependency graph + reassignment                      |
|                | `POST /ingest/transcript`                                    | meeting → extracted commitments (provenance)         |
|                | `POST /persons` · `/documents` · `/projects` · `GET /events` | canonical model                                      |


`POST .../deploy` and `.../decommission` return **200** with the updated employee,
or **202** with a pending approval when the unit requires human sign-off.

## The console (frontend)

A React 19 + Vite + Tailwind admin console lives in [ui/](ui/) — the "face" for the
whole lifecycle: onboard a unit, configure/deploy/monitor/decommission employees,
work the approval queue, run the Task Registry, and ingest transcripts.

```bash
uvicorn meridian.main:app --reload --port 8010   # API
cd ui && npm install && npm run dev               # console on :5173
```

See [ui/README.md](ui/README.md) for details.

## How it maps to the framework


| This repo                                                 | Framework concept                                                                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `domain/lifecycle.py`                                     | the AI-employee lifecycle ([03](../FRAMEWORK/03-ai-employees.md))                                                                |
| `governance/policy.py` + `services/audit_service.py`      | Vault: policy engine + audit ledger ([06](../FRAMEWORK/06-governance-trust-observability.md))                                    |
| `governance/identity.py` + `services/identity_service.py` | Vault: agent identity — scoped credentials, issue/verify/rotate/revoke ([06](../FRAMEWORK/06-governance-trust-observability.md)) |
| `gateway/model_gateway.py`                                | Vault: model gateway + cost meter ([08](../FRAMEWORK/08-effectiveness-and-cost-control.md))                                      |
| `services/dashboard_service.py`                           | Prism: leadership view / digital-twin start ([05](../FRAMEWORK/05-organization-and-digital-twin.md))                             |
| `services/task_service.py` ★                              | the Action/Task Registry — the accountability wedge ([05](../FRAMEWORK/05-organization-and-digital-twin.md))                     |
| `services/ingest_service.py`                              | meeting intelligence: transcript → commitments ([07](../FRAMEWORK/07-roadmap-and-repo-mapping.md))                               |
| `adapters/`                                               | the runtime "bring your own agent" surface (paperclip-inspired)                                                                  |


## Persistence

One small async repository interface, two backends (`meridian/services/store.py`):

- **In-memory** (default) — boots with zero infrastructure; used by the tests.
- **MongoDB via motor** — used when `MONGO_DB_URL` is set; matches the onyx family
(same Motor pattern as `onyxos`). `motor` is imported lazily, so the in-memory
path needs no driver.

## Layout

```
meridian/
  domain/       enums + the lifecycle state machine (the heart)
  governance/   policy engine (pure) — the Vault check
  gateway/      model gateway client + cost meter
  adapters/     employee runtime adapters (base, registry, echo)
  schemas/      Pydantic v2 request/response + canonical models
                (unit, employee, person, document, project, task, event)
  services/     orchestration: unit, archetype, employee, run, approval,
                dashboard, audit, task (registry), ingest, person, document,
                project, event, store (persistence)
  routes/       FastAPI routers
  config/       settings
  main.py       app: lifespan, CORS, domain-error -> HTTP mapping
tests/          lifecycle, governance, employee API, dashboard
```

See [AGENTS.md](AGENTS.md) for contributor conventions, [ROADMAP.md](ROADMAP.md)
for what's next, and [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) for the design in
depth. The full platform vision — the AI-native organization plan grounded in the
Treppan CRM control framework + TESPL RTQ spec — is in
[doc/PLATFORM-PLAN.md](doc/PLATFORM-PLAN.md) (research dossier:
[doc/PLATFORM-PLAN-DOSSIER.md](doc/PLATFORM-PLAN-DOSSIER.md)).

## Scope of this build

This is the **runnable spine slice**, not the whole platform. Shipped so far: the  
AI-employee lifecycle, the governance hooks, and the **Action/Task Registry** (the  
wedge) with meeting→commitment ingestion. Deliberately stubbed or deferred: the  
**Flow** engine (durable cross-unit orchestration), real agent runtimes behind the  
adapter contract (only `echo` ships), the LiteLLM proxy behind the gateway, an  
LLM-backed commitment extractor (only the heuristic ships), and monthly  
budget-window resets (spend currently accumulates). Each is  
called out where it lives in the code; see [doc/IMPLEMENTATION-PLAN.md](doc/IMPLEMENTATION-PLAN.md).

