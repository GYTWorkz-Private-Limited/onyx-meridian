# Onyx Meridian — Implementation Plan

How to get from the current repos to the full framework
([../../FRAMEWORK/](../../FRAMEWORK/README.md)), phased so the first delivery is the
Fakhruddin pilot, with governance built in parallel from day one. This is the
granular, build-oriented companion to [FRAMEWORK/07](../../FRAMEWORK/07-roadmap-and-repo-mapping.md).

## Where we are

| Framework component | Lives in / reuse | Status |
|---|---|---|
| Canonical model | `onyx-meridian/schemas` | Partial — Unit, AIEmployee, Archetype, Run, Approval, AuditEvent done; Person, Document, **Commitment/Task**, Customer, Asset, Event, Project being added |
| AI-Employee registry + lifecycle | `onyx-meridian` | Done (spine slice) |
| Admin Console (UI) | new (paperclip-style) | Not built |
| Agent Runtime (plan→act→observe) | reuse `lms-onyx` streaming controller / `ConvBI` | Not built (only `echo` adapter) |
| Agent identity & access | reuse `lms-onyx` JWT/OAuth | Stub (`principal_id` only) |
| Pulse (knowledge/RAG) | `lms-onyx` | Exists — reuse |
| Prism (decision/dashboards) | `onyx-pulse`, `ConvBI` | Exists — reuse + harden |
| **Action/Task Registry** ★ | new | In progress (the wedge) |
| Flow (orchestration) | new (Temporal-style) | Not built |
| Digital Twin | `onyx-meridian/dashboard` + Prism | Slice done, not predictive |
| Vault: Policy Engine | `onyx-meridian/governance/policy.py` | Slice done (least-privilege); no catalog/versioning |
| Vault: Audit Ledger | `onyx-meridian/services/audit_service.py` | Done (append-only) |
| Vault: Model Gateway | `onyx-meridian/gateway` + LiteLLM | Cost meter done; no proxy/budgets/egress |
| Ensure (evals/drift/ROI) | Langfuse fragments | Not built |

The intelligence capabilities exist; the spine is partly built; the wedge (Task
Registry), Flow, identity, the hardened gateway, and Ensure are the remaining
greenfield.

## Sequencing principles

- Governance in parallel, from day one — every pilot action authorized + audited.
- Overlay, not rip-and-replace — read connectors first, act-through later.
- Pilot-scoped — a few interconnected units, not the whole org.
- Reversible — every step independently valuable and rollback-able.

## Phase 0 — Foundations & safety (weeks 0–4)

Exit: an action can be taken by a principal, authorized, and audited; canonical
facts can be written from a meeting transcript; a task can run in any of the three
execution modes and fall back to a human.

1. Security debt first — rotate the leaked Aiven credential in
   `onyx-pulse/db_configs.json`; vault all secrets; tighten CORS; read-only DB roles.
2. Canonical Model v1 — add Person, Document, Commitment/Task, Customer, Asset,
   Event, Project + the entity graph to `onyx-meridian/schemas`.
3. Connector framework v1 — typed, scoped, read-only connectors for pilot systems
   (email, meetings, CRM read), mirroring the `adapters/` registry pattern.
4. Vault minimum — identity for agent principals (extend `lms-onyx` auth), hardened
   Model Gateway (LiteLLM + budgets + egress), audit ledger (done; point all repos
   at it).
5. Flow engine v0 — durable workflow with the 3 execution modes, typed proposals,
   one-tap approval queue (generalize the spine's approval queue).

## Phase 1 — Pilot / Fakhruddin (weeks 4–12)

Exit: leadership can answer "who owes what to whom, by when, from which source."

1. ★ Action/Task Registry (the wedge) — Commitment/Task as a tracked record: owner
   (human or AI), source provenance, due, dependencies, escalation, status,
   `audit_ref`; emits Events.
2. Meeting intelligence pipeline — capture → transcribe (`lms-onyx`) → extract
   commitments (AI-Agent task, typed proposals) into the registry.
3. Leadership dashboard — open commitments, completion + on-time rates, escalations,
   by unit (extend `dashboard_service`, back with `onyx-pulse`).
4. A few AI employees in Shadow/Assist — Meeting Scribe (T1), Follow-up Chaser (T1),
   Knowledge Answerer (Pulse, T1).
5. Real agent runtime — implement the adapter contract against `lms-onyx`.

## Phase 2 — Business-unit operating model (months 3–6)

Exit: a department runs as super-agent + AI team + caretaker, with measured autonomy
promotion and ROI.

1. Admin Console UI over the spine API (React 19 / Vite / Tailwind).
2. Super-agents (T4) per unit — intake→decompose→assign→monitor→escalate→report.
3. Ensure v1 — evals + drift wired to the autonomy ladder (replace `eval_passed`).
4. Pulse + Prism in the flow of work — embedded Co-Work copilots.
5. Archetype library — reusable templates per role.

## Phase 3 — Org-wide (months 6–12)

Exit: shared canonical model, org-wide task accountability, cross-unit Flow, a live
twin, central governance.

1. Flow for cross-unit workflows — RTQ first (TESPL spec: 7 states, 31 tasks, P1–P14
   policy catalog), then lead-lifecycle.
2. Predictive Digital Twin — Prism prediction ("escalate before crisis").
3. Full governance plane — policy catalog + versioning + policy memories, budgets,
   compliance posture.
4. Roll the unit play to all 16 departments, phased.

## Phase 4 — Optimize & scale (ongoing)

T2/T3 employees optimize; staffing rebalances toward "9 agents + 1 caretaker";
self-improvement loops; customer-facing automation after internal data quality clears.

## Cross-cutting: consolidation

1. One NL→SQL engine — `ConvBI` as the library; `onyx-pulse` calls it.
2. One identity service — `lms-onyx` auth as the IdP for humans + agent principals.
3. One org/registry — grow `onyxos`/`onyx-meridian` into the canonical registry.
4. One model gateway — every repo's LLM calls through the hardened gateway.
5. Resolve Pulse/Prism naming; fix 8000/8005 port collisions (spine uses 8010).

## Immediate next 2 weeks

1. Canonical model v1 — Person, Document, Commitment/Task, Project, Event. **(this PR)**
2. Action/Task Registry — lifecycle, dependencies, escalation, provenance,
   `audit_ref`, events. **(this PR)**
3. Meeting→commitment extraction — pluggable extractor, typed proposals into the
   registry. **(this PR)**
4. Identity — turn `principal_id` into a real issued/verifiable credential. (next)
