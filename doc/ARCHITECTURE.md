# Architecture

Onyx Meridian is a FastAPI service that is the **control plane** for AI employees.
It does not (yet) run agents itself — it governs their whole life: who exists,
what they may do, when they go live, what they cost, and when they retire.

## One unit of work, end to end

```
onboard Unit ─activate─▶ Unit(active)
      │
instantiate ─▶ Employee(draft)
      │  configure  (policy: least-privilege scope check; version++)
      ▼
   Employee(configured)
      │  deploy  (state-machine + policy gate)
      │     ├─ unit requires approval? ─yes─▶ Approval(pending) ──decide(approve)──┐
      │     └─ no ───────────────────────────────────────────────────────────────┤
      ▼                                                                            │
   Employee(deployed, autonomy=shadow, principal issued) ◀───────────────────────┘
      │  run heartbeat ─▶ gateway routes model ─▶ adapter executes ─▶ cost metered
      │                       └─ spend ≥ budget ─▶ auto-suspend + budget approval
      │  promote autonomy (Ensure eval gate) / suspend / resume
      ▼
   decommission ─(approval for live principals)─▶ Employee(retired, credential revoked)
```

Every arrow that mutates state writes one **audit** row and is checked by the
**policy engine** and the **lifecycle state machine**.

## Components

- **domain/** — the vocabulary (`enums.py`) and the lifecycle state machine
  (`lifecycle.py`). Pure. The single source of truth for legal transitions and the
  autonomy ladder.
- **governance/policy.py** — the Vault check. `authorize_configuration`
  (least-privilege, wildcard-aware) and `authorize_deploy` (active unit +
  caretaker). Pure; returns a `PolicyVerdict`.
- **gateway/model_gateway.py** — model routing (on-prem-first) and the token→USD
  cost meter. Pure pricing table; the real build proxies LiteLLM.
- **adapters/** — the runtime contract (`base.py`), a mutable `registry.py`, and a
  built-in `echo` adapter so the monitoring path runs without an external agent.
- **services/** — orchestration. `employee_service` owns the lifecycle;
  `approval_service` executes parked HITL actions (lazy-imports `employee_service`
  to break the cycle); `run_service` does monitoring + cost + budget enforcement;
  `dashboard_service` builds the read-model; `audit_service` is the append-only
  ledger; `store.py` is the persistence interface + both backends.
- **routes/** + **main.py** — thin HTTP layer; domain errors mapped to status
  codes in one place.

## Why these boundaries

- **Pure core, impure edges.** domain/governance/gateway have no I/O, so the rules
  are unit-tested directly and can run inline on every request with no network hop.
- **One state machine.** Status only changes via `domain/lifecycle.py`; services
  can't invent illegal states.
- **Persistence is swappable.** Services depend on the `Store` interface only, so
  in-memory (dev/test) and Mongo (prod) are interchangeable, and a future move to
  consuming OnyxOS's registry is localized.

## Data model (collections)

`units`, `archetypes`, `employees`, `runs`, `approvals`, `cost_events`,
`audit_ledger`. Declared once in `services/store.py`. Each employee carries its
full config inline (role, permissions, autonomy, budget, model policy,
supervision, adapter) plus accounting (`spent_usd`, `last_heartbeat_at`,
`principal_id`) and lifecycle timestamps. See `schemas/employee.py` for the shape,
which follows the illustrative schema in
[FRAMEWORK/03](../../FRAMEWORK/03-ai-employees.md).
