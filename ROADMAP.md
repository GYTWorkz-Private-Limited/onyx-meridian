# Roadmap

Tracks the framework roadmap ([FRAMEWORK/07](../FRAMEWORK/07-roadmap-and-repo-mapping.md)).
This repo is the **spine** — the greenfield that the roadmap calls out as the
build that turns existing capabilities into a platform.

## Shipped (v0.1 — the spine slice)

- Canonical model: Unit, Archetype, AIEmployee, Run, Approval, AuditEvent.
- AI-employee lifecycle state machine: instantiate → configure → deploy → manage
  → decommission, with versioning.
- Vault hooks: least-privilege policy engine, immutable audit ledger, model
  gateway + cost meter.
- Monitoring: heartbeats, run cost metering, budget hard-stop auto-suspend.
- HITL approval queue for deploy / decommission / budget override.
- Leadership dashboard (Prism slice).
- Persistence: in-memory + MongoDB (motor) behind one interface.

## Shipped (v0.2 — the wedge)

- Canonical model v1: Person, Document, Project, Event added.
- **Action/Task Registry** — commitments with owner (human or AI), source
  provenance, due, dependency graph (cycle-checked), escalation, `audit_ref`;
  task lifecycle state machine; emits domain events.
- Escalation sweep: overdue commitments marked MISSED + `task.escalated` events.
- Meeting intelligence: `POST /ingest/transcript` → extracted commitments with
  provenance (pluggable extractor; deterministic heuristic default).
- Dashboard extended with the commitment rollup (open / overdue / completion rate).

## Shipped (v0.3 — agent identity)

- Agent Identity & Access (Vault): each deployed employee is a first-class
  principal with a scoped, peppered-hashed credential issued at deploy (token
  shown once), `POST /identity/verify`, credential rotate, and revoke-on-
  decommission. Runs are attributed to the principal.

## Shipped (v0.3 — Admin Console FE)

- React 19 + Vite 7 + Tailwind 4 console in `ui/` (matches `lms-onyx-frontend`):
  dashboard, units onboarding, employee roster + full lifecycle control,
  task registry, approvals queue, and meeting-transcript ingestion — over the
  spine API. Typechecks + builds clean.
- Pulls Phase 2 item 1 (Admin Console) forward.

## Shipped (v0.4 — connector repository)

- **Connectors** — a standardized, long-running integration repository organized
  by platform + domain ([doc/CONNECTORS.md](doc/CONNECTORS.md)). One tiny contract
  with two adaptive operations (**pull** / **push**), a YAML-first catalogue
  (`_props.*.yaml` property files beside each connector), a registry keyed by
  `<platform>.<domain>`, and `/connectors` + `/connections` HTTP surface (config
  validation, secret masking, pull/push).
- Two production connectors — **Salesforce CRM** and **HubSpot CRM** — plus a
  **research-derived Zoho CRM** connector.
- **Research mode** (`connectors/agents/`): an `extraction-agent` that derives a
  platform's domain model via deep research, and a `builder-agent` that writes the
  FastAPI-compatible connector code. Connectors carry a completeness status
  (`incomplete` → `research_derived` → `complete`).

## Next

1. **Verify + expand connectors** — promote `zoho.crm` to `complete` after live
   doc-verification; add ERP/HR/finance-domain connectors via the research agents.
2. **Connector sync orchestration** — wire pull/push into durable sync jobs
   (cursoring, incremental watermarks, retries) and emit registry Events.
3. **Vault connection secrets** — store only a reference; resolve at call time.
4. **Real adapters** — implement the adapter contract against the OnyxOS agent
   runtime / `lms-onyx` streaming controller, plus Claude/Codex/HTTP. Only `echo`
   ships today.
3. **LLM commitment extractor** — register an AI-Agent extractor behind
   `ingest_service.set_extractor` (the heuristic is the default/fallback).
4. **Model gateway** — front the cost meter with a real LiteLLM proxy (budgets,
   egress policy, on-prem routing).
5. **Ensure evals** — replace the `eval_passed` flag on autonomy promotion with
   real eval gates + drift-driven auto-demotion.
6. **Budget windows** — monthly reset + per-scope budget policies (company / unit /
   employee / task), warn thresholds.
7. **Consume OnyxOS** — read the unit/org model from `onyxos` instead of keeping a
   local Unit, per the "one org/registry service" consolidation decision.
8. **Cross-unit Flow** — durable (Temporal-style) orchestration starting with RTQ;
   wire registry Events into Flow triggers.

## Known shortcuts (today)

- Spend accumulates lifetime (no monthly window reset yet).
- Decommission "reassign in-flight work" records intent in the audit trail; wiring
  it to actually move the retiring employee's open Tasks to the successor is next.
- Autonomy promotion trusts the caller's `eval_passed` flag.
- Commitment extraction uses a deterministic heuristic, not an LLM.
- Registry Events are recorded but not yet consumed by a Flow engine.
