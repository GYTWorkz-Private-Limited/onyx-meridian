# Onyx Meridian — AI-Native Organization Platform
## Full Implementation Plan


---

> Synthesized by a multi-agent workflow that studied the Treppan_CRM control-framework implementation, the TESPL RTQ + Fakhruddin specs, the FRAMEWORK design docs, and the current `onyx-meridian` build. Sections 1–9 are the design drafts; sections 10–13 carry the completeness-critique fixes (timeline reconciliation, full KPI catalog, execution-mode correction, leaked-secret remediation). Research dossier + review notes: [PLATFORM-PLAN-DOSSIER.md](PLATFORM-PLAN-DOSSIER.md).


---

## Executive Summary

Onyx Meridian turns a company into an **AI-native organization**: a blended workforce of humans and AI employees where every unit of work is **effective, affordable, and reversible**, and the leadership question — *"who owes what to whom, by when, based on which meeting or document — and what happens if they don't act?"* — is answerable in seconds, with evidence.

The platform rests on a thesis: **two visibilities (effectiveness + cost), one engine.** It already ships a working control-plane spine (`onyx-meridian v0.3.0`): an AI-Employee registry with a governed lifecycle, an Action/Task Registry with provenance and escalation, a Policy Engine, agent identity, an append-only audit ledger, a HITL approval queue, a Model Gateway cost meter, meeting ingestion, a unit dashboard read-model, and a domain event bus. Seven structural holes remain — **agent runtime, Flow engine, Model Gateway enforcement, policy catalog/versioning, Ensure evals, human auth, connectors** — plus a **critical leaked-secret remediation** that blocks everything.

This plan is sequenced into four phases: **P0** (safety + foundations), **P1** (the Fakhruddin pilot wedge), **P2** (platform behavior), and **P3** (org-wide Flow + autonomy). The discipline is invariant: **build on the shipped spine, fill the holes, never rewrite the contracts.** The binding external commitment is **V1 GA live by end-Oct 2026, with the pilot live before it (mid-Sep at the earliest)** — and the critical-path engineer-week (EW) math below is reconciled to support exactly that timeline.

---

---

## Table of Contents

1. Vision & AI-Native Operating Model
2. Reference Architecture
3. Canonical Model, Knowledge, Ingestion & Connectors
4. The Control Framework — Workflows, Tasks, Execution Modes, Policies, BPMN
5. Flow — Orchestration Engine & Cross-Unit Workflows
6. AI Employees, Business Units & Super-Agents
7. Governance, Trust & Security (Vault) + Ensure
8. Digital Twin & Decision Intelligence (Prism)
9. Accelerators & Repo Consolidation / Reuse Map
10. Phasing Overview & Timeline Reconciliation (Delivery Roadmap)
11. The Economics Layer — Effectiveness, Cost, ROI
12. Build-vs-Have Gap Analysis, Backlog & Risks
13. What Ships Next

---

## 1. Vision & AI-Native Operating Model

### 1.1 Thesis — the two failure modes we structurally prevent

Enterprise AI dies in one of two ways, and Onyx Meridian is architected so neither can happen silently:

| Failure mode | What it looks like in production | Where the platform stops it |
|---|---|---|
| **Effectiveness gap** | Output isn't trustworthy enough to remove the human, so the human stays in the loop on everything and no work is actually offloaded. | The **Ensure** measurement loop attributes KPIs (override rate, rework rate, win rate, SLA adherence) per task/policy/stage; the **autonomy ladder** (Shadow→Assist→Supervised→Autonomous) only promotes on passing eval gates. Today this gate is a trusted `eval_passed` flag in `domain/lifecycle.py`; §6 hardens it into real evals. |
| **Cost inversion** | The AI costs more than the human it replaced — a model is spent where a rule or line of code would have sufficed. | **Execution-mode delegation** (Deterministic / Workflow+Policy / AI Agent) forces the cheapest sufficient mode per task; the **Model Gateway** routes on-prem-first and meters every call (`gateway/model_gateway.py` `route()` + `cost_usd()`); **budget hard-stops** auto-suspend an employee at its ceiling (`run_service._enforce_budget`). |

These are not after-the-fact reports. They are **two always-on, first-class control surfaces measured per unit of work**:

```
                       ┌─────────────────────────────────────────────┐
   every unit of work →│  EFFECTIVENESS  ◀── trustworthy enough?      │
                       │     (KPIs · observability · explainability)   │
                       │  COST           ◀── cheaper than the human?  │
                       │     (mode routing · effort-sized spend ·      │
                       │      on-prem-first gateway · budgets ·        │
                       │      reversibility to a human)                │
                       └─────────────────────────────────────────────┘
```

The product line is **"two visibilities, one engine."** Every claim below maps to a control surface and a build artifact that already exists in `onyx-meridian` or is sequenced in a later section.

### 1.2 What "AI-native" means here

AI-native is not "deploy a chatbot." It is three concrete shifts in the unit of measurement, each already partially modeled in the current build:

| Shift | From | To | Current-build evidence |
|---|---|---|---|
| **Unit of execution** | human | AI employee | `schemas/employee.py` — a versioned, governed principal (Role/Permissions/Budget/ModelPolicy/autonomy), not a prompt |
| **Unit of accountability** | inbox | Task/Commitment Registry | `schemas/task.py` + `services/task_service.py` — owner{human\|ai_employee}, source provenance, `depends_on`, escalation, `audit_ref` |
| **Unit of management** | headcount | blended (human+agent) org chart | `schemas/person.py` is a **peer** of `schemas/employee.py`; both `member_of` a `Unit` — "who owns this" works identically for humans and agents |

An **AI employee owns outcomes** — it has a job (`Role.charter`/`kpis`), tools (capabilities/adapter), permissions (data/action/deny scopes), a budget (`budget_monthly_usd`), KPIs, and a manager (`reports_to`, `Supervision.caretaker`). This is the atomic actor; departments compose into **AI Business Units** (1 T4 super-agent + N employees + ≥1 caretaker); units compose into the **AI-native organization** via four shared spines (canonical model, task registry, Flow orchestration, digital twin).

### 1.3 Overlay, not rip-and-replace

The platform is an **overlay on existing systems**, on-prem-capable by default. The six operating moves run in order and never require ripping out a system of record:

```
  ┌────────┐   ┌───────────┐   ┌────────┐   ┌─────────┐   ┌────────┐   ┌─────┐
  │ INGEST │──▶│ UNDERSTAND│──▶│  ACT   │──▶│ ACCOUNT │──▶│ GOVERN │──▶│ SEE │
  │read-1st│   │ canonical │   │through │   │ task    │   │ policy │   │ twin│
  │meetings│   │ model +   │   │existing│   │ registry│   │ engine │   │ dash│
  │email   │   │ 7 context │   │systems │   │ record  │   │ +audit │   │ role│
  │CRM docs│   │ layers    │   │connect.│   │per commt│   │ +gtwy  │   │scope│
  └────────┘   └───────────┘   └────────┘   └─────────┘   └────────┘   └─────┘
   L1 Integr.   L3 Knowledge   L6 Command   ★Registry     L4 Vault     Twin/Prism
```

Concrete consequence for sequencing: we **build on** what `onyx-meridian` v0.3.0 has shipped (employee lifecycle, task registry, policy engine for config/deploy gates, identity, append-only audit, dashboard rollup) and **wire in** existing sibling-repo capability (lms-onyx auth+transcription, ConvBI NL→SQL, onyx-pulse charts, onyxos org registry) rather than rebuilding. The two greenfield wedges — **Flow** (orchestration) and **Vault** (full governance) — are net-new because `onyx_vault` is an empty stub and no Flow engine consumes the `events` collection today.

The reversibility guarantee is the strongest form of "overlay": **an entire department can revert to human-centered operation** by flipping every task's automation dial to human-responsible — same state machine, the task just becomes "assign to a person; human acts and updates the record."

### 1.4 Human roles — accountability never goes to zero

The blended org keeps five named human roles. Accountability is structural: even a fully Autonomous task has a named accountable human and an immutable audit trail.

| Role | Owns | Platform surface (current or sequenced) |
|---|---|---|
| **Caretaker** (≥1 per unit) | Outcomes/KPIs of a unit; reviews exceptions + sampled output; can **kill-switch any employee or the whole unit instantly** | `Supervision.caretaker` on `employee.py`; `Unit.require_approval_for_deploy/decommission`; suspend/decommission ops in `employee_service.py` |
| **Reviewer / approver** | Gates outbound/irreversible actions | HITL **approval queue** (`services/approval_service.py`, `ApprovalType` deploy/decommission/autonomy_promote/budget_override); the **one-tap approval queue** (§6) is the first-class surface, not a notification |
| **Domain expert** | Curates knowledge + policy; fixes "knowledge misses" | Pulse knowledge layer (reuse `lms-onyx`); Ensure knowledge-gap detection → tasks for experts (§6/§7) |
| **Leadership** | Strategy + exceptions; sets KPIs/policy | Digital twin + leadership view (Prism); drill from KPI → tasks → sources → agent actions, all governed |
| **Platform owner ("AI Ops / AI HR")** | Runs registry, gateway, evals, governance | The whole control plane — employee CRUD/lifecycle (`routes/api.py` `/employees/*`), audit ledger, gateway, eval gates |

The guardrail across all roles is one invariant, enforced by the runtime and not bolted on: **AI proposes, a human commits.** AI Core is RESPONSIBLE (does the work); a named human is ACCOUNTABLE (owns the decision). Agent outputs are **typed proposals, never committed side-effects**; committing is a separate HITL-gated step. (This is exactly the proven Treppan pattern — `LeadAISpace.tsx`'s proposal + rationale + provenance + Accept/Edit/Dismiss triad, and the Treppan `policy_engine.py` advisory effects `{allow, flag, require_approval, route, block}` — which we generalize into the platform's pre-action Policy Engine.)

### 1.5 Progressive autonomy IS the cost dial

The single most important operating concept: **the automation dial and the progressive-autonomy ladder are the same control.** Moving a task right costs less (more model autonomy, less human time); moving it left costs more human attention but buys trust. The dial is adjustable **per (employee × task-type × data-scope), continuously, without re-architecting.**

```
 more automation ◀──────────────────────────────────────────▶ more human
  AI Agent (autonomous) · AI Agent (HITL) · Workflow+Policy · Human-responsible
     L3 Autonomous          L2/L1 Supervised/Assist            L0 Shadow / assign
   off-the-loop, audited   on-the-loop / approve each      observe+propose / person acts
   ─────────────────────────────────────────────────────────────────────────────────
   cost: model only        cost: model + human gate        cost: full human attention
```

This maps directly onto shipped code and the two control surfaces:

- The ladder already exists: `AUTONOMY_LADDER = shadow → assist → supervised → autonomous` with single-step `next_autonomy`/`prev_autonomy` in `domain/lifecycle.py`; **deploy always resets to SHADOW** (earned trust, not granted).
- **Ensure (effectiveness) promotes; budget (cost) constrains.** Promotion requires `eval_passed`; **drift auto-demotes**; the **kill switch** suspends instantly. The budget hard-stop (`run_service._enforce_budget`) is the cost guardrail that auto-suspends + opens a `budget_override` approval.
- The reconciliation rule: **if an AI task is not effective enough or too costly, flip it to a human-responsible workflow** — the dial's leftmost position — without touching the state machine.

This is what makes the platform safe to adopt: every step toward more automation is *earned* by measured effectiveness and *bounded* by measured cost, and every step is reversible.

### 1.6 Target outcomes & success metrics

The platform succeeds when leadership can get **evidence-backed, sourced answers in seconds** to questions they cannot answer today ("What did we commit to last week, and who hasn't delivered?", "Which projects are at risk, and why?", "Show me every overdue task across the company"). Concretely, V1 (end October 2026, five-month build, bi-weekly milestones, six pilot departments: Operations, Projects, FIS, Customer Service, Marketing, Legal) is measured against:

| Dimension | Metric | Source of truth | Target posture for V1 |
|---|---|---|---|
| **Effectiveness** | Override rate, rework rate per task/policy | Ensure evals + audit ledger | Trending down; autonomy promotions gated on it |
| **Effectiveness** | SLA adherence / escalation rate | Task Registry `escalate_due` sweep + `task.escalated` events | "Nothing slips silently" — escalate **before** the deadline |
| **Cost** | **Cost trace per stage transition** (e.g. cost to move 1000 leads prospect→qualified) | `cost_events` roll-up + per-run `cost_usd` | Attributable per task → stage → workflow |
| **Cost** | **Cost-to-automate vs cost-of-human** per operation | Gateway cost meter vs human-attention budget | Automate only where cheaper-and-sufficient |
| **Cost** | **Human-attention budget** (e.g. 15-min-per-item) — "the measure of compression itself" | Time in the one-tap approval queue | The compression metric leadership tracks |
| **Accountability** | Commitment completion rate, overdue count, blocked dependencies | Dashboard commitment rollup (`dashboard_service.py`) | Every commitment owned (human or AI), provenance to source |
| **Governance** | % actions authorized + audited; zero unattributed actions | Policy Engine + append-only audit ledger | Invariant: *nothing executes without authorization; nothing happens without a record* |
| **Reversibility** | Time to revert a task/employee/unit to human | Config versioning + kill switch + decommission | Any unit revertible to human-centered ops |

**Non-negotiable boundaries** that frame all metrics (Fakhruddin constraints): data stays internal (on-prem, company-owned); open-source-first / no per-seat lock-in; internal-first AI with per-department budgets; **no audio kept** (transcribe then discard — UAE legal); strict department-level access control + full audit; UAE PDPL + RERA compliance. These are designed into the runtime (Vault gateway egress control, audit ledger, scoped identities), not added later.

**The framing leadership signed up for:** *"We're not buying software. We're building our organization's intelligence infrastructure — and its digital workforce."* Accountability-first; internal, owned, and UAE-compliant by design — with effectiveness and cost as the two visibilities that keep the digital workforce both trustworthy and affordable.

I now have concrete grounding. Writing the section.

---

## 2. Reference Architecture

This section fixes the engineering substrate for Onyx Meridian: seven implementable layers (L0–L6), six operational planes, the component graph, deployment topology, the agent runtime, the storage substrate, and the observability baseline. Every component is mapped to a concrete repo/module. **The control-plane spine already exists** — `onyx-meridian` (v0.3.0, FastAPI 3.11 + Pydantic v2, React 19 console) ships the AI-Employee registry, lifecycle state machine, Policy Engine, Agent Identity, Model Gateway client + cost meter, Action/Task Registry, meeting ingestion, and a dashboard read-model. This architecture **extends** that spine; it does not rebuild it.

### 2.1 The Seven Implementable Layers (L0–L6) → repo/module map

The customer's 9-layer business story (§framework L1.0) collapses into 7 buildable layers. The table below states, per layer, what onyx-meridian has **shipped**, what is **stubbed/seam-only**, and the **net-new** work, with concrete file paths.

| Layer | Name | Shipped in `onyx-meridian/meridian/` | Stub / seam present | Net-new (this plan) | Reuse source |
|---|---|---|---|---|---|
| **L6** | Skills & Command (acting surface) | — | `adapters/base.py` (`Adapter` ABC: `validate_config`, `execute_heartbeat`), `adapters/registry.py` (`register_adapter`/`get_adapter`/`known_adapter_types`), `adapters/echo.py` | Real adapters: `lms_streaming`, `claude_code`, `codex`, `http_webhook`; a **skills catalog** (granted-skill records) | paperclip `server/src/adapters/registry.ts` (pattern only); lms-onyx `controllers/streaming_controller.py` |
| **L5** | Intelligence (plan·recall·act loop + model gateways) | `gateway/model_gateway.py` (`route()` on-prem-first + `cost_usd()` meter); `domain/lifecycle.py` autonomy ladder | Echo adapter is the only "runtime" behind the contract | Real plan→recall→act loop in the runtime worker; LiteLLM proxy behind `model_gateway_url` (`config/settings.py:32`) | ConvBI LangGraph loop; lms-onyx streaming controller; LiteLLM proxy |
| **L4** | Governance — the **Vault** (cross-cuts L1–L6) | `governance/policy.py` (`authorize_configuration`, `authorize_deploy`, wildcard `sales.*`/`*`); `governance/identity.py` (`omk_*` principals, HMAC-SHA256 peppered hash); `services/audit_service.py` (append-only ledger); `services/approval_service.py` (HITL queue); `run_service._enforce_budget` (hard-stop) | Gateway has no egress/budget enforcement; audit has no hash-chain | Per-action runtime authorize; versioned policy catalog + policy memories; gateway budgets/egress; hash-chained ledger | `onyx_vault` (empty — NEW); lms-onyx RBAC for human IdP |
| **L3** | Knowledge (evidence, context layers, ontology graph) | `schemas/{document,task,event}.py`; `services/ingest_service.py` provenance (doc_id + exact quote) | `HeuristicExtractor` regex; events emitted but inert | 7 context layers, vector indexes, entity graph that *polices* traversals, policy memories | Pulse (`lms-onyx`), Qdrant wrapper (consolidate) |
| **L2** | Storage (physical substrate) | `services/store.py`: `Store` Protocol + `InMemoryStore` + `MongoStore` (Motor, lazy); `main._ensure_indexes` | No migrations/transactions/soft-delete | Postgres (Prism/ConvBI), Qdrant (Pulse), object store for documents; migrations | onyxos Mongo pattern; onyx-pulse Postgres; ConvBI Qdrant |
| **L1** | Integration (events, ETL, channels, enrichment) | `services/event_service.py` (append-only `events`); `routes/ingest.py` (`POST /ingest/transcript`) | Single manual transcript POST; no connectors | Read-only typed connectors (email/meetings/CRM/ERP); structuring/enrichment pipeline | lms-onyx transcription services; onyxos onboarding |
| **L0** | Infrastructure (on-prem first) | `Dockerfile` (python:3.11-slim, non-root uid 10001), `docker-compose.yml` (API:8010 + Mongo:27017), `.github/workflows/ci.yaml` | In-memory fallback (zero-infra boot) | On-prem K8s/Compose topology; agent-runtime workers; secrets vault; metrics/tracing baseline | shared deployment template across onyx repos |

**Binding engine (spans the stack):** the Workflow/Task-Execution engine ("**Flow**" accelerator) is the cross-layer spine that binds L5 intelligence to L3/L4 rules over the L1/L2 substrate. In onyx-meridian today, the **only seam toward Flow** is `services/event_service.py` — events are persisted to the `events` collection but **consumed by nothing** (current-build GAP). Flow is the component that subscribes to that bus. See §7 / Flow section for the engine itself; this section places it on the map.

```
            ┌──────────────────────── L4 GOVERNANCE (Vault) — cross-cuts L1..L6 ─────────────────────────┐
            │ policy.py · identity.py · audit_service.py · approval_service.py · model_gateway.py(egress)  │
            └───────────────────────────────────────────────────────────────────────────────────────────┘
 L6  Skills&Command   adapters/{base,registry,echo}.py  ──►  [NEW] lms_streaming · claude_code · http_webhook
 L5  Intelligence     gateway/model_gateway.py (route+cost)  ──►  [NEW] plan·recall·act worker + LiteLLM proxy
 L3  Knowledge        ingest_service.py provenance · documents/tasks/events schemas  ──►  [NEW] Pulse + entity graph
 L2  Storage          store.py {InMemory|Mongo}  ──►  [NEW] +Postgres +Qdrant +object store
 L1  Integration      event_service.py · routes/ingest.py  ──►  [NEW] connector framework + enrichment
 L0  Infrastructure   Dockerfile · docker-compose.yml · ci.yaml  ──►  [NEW] on-prem K8s + runtime workers
                            ▲                                              │
                            └──────── Flow (Workflow/Task engine) subscribes events ◄ event_service.py
```

### 2.2 The Six Operational Planes ⇄ Layer crosswalk

Planes are for ops grouping; layers are for engineering ownership; Governance cross-cuts all. Each plane's "home in code today" is a concrete onyx-meridian module or the repo to consolidate from.

| Plane | Layers | Accelerator | Home in code today (onyx-meridian) | Consolidates from |
|---|---|---|---|---|
| **Source** | source systems | — | (external) | Teams/email/ERP/CRM/docs |
| **Data (ingest)** | L1, L2 | Pulse (ingest half) | `services/{ingest,event,document}_service.py`, `services/store.py` | lms-onyx transcription |
| **Intelligence** | L3, L5 | Pulse / Prism | `gateway/model_gateway.py`; `schemas/document.py` | Pulse (`lms-onyx`), Prism (`onyx-pulse`/ConvBI) |
| **Agent-Runtime** | L5, L6 | Prism (runtime), Flow | `adapters/*`, `services/{employee,run,identity}_service.py`, `domain/lifecycle.py` | paperclip adapter pattern; lms-onyx loop |
| **Orchestration** | Flow (L5↔L3/L4) | **Flow** ★ | `services/event_service.py` (seam only — inert today) | NEW (no repo) |
| **Experience** | L6 + dashboards | Prism / Ensure | `services/dashboard_service.py`, `ui/src/pages/*` | onyx-pulse dashboards |
| *(Governance — cross-cut)* | L4 | **Vault** | `governance/*`, `services/{audit,approval}_service.py` | `onyx_vault` (NEW) + lms-onyx RBAC |

### 2.3 Component diagram (ASCII)

The solid boxes are **shipped** in onyx-meridian; `[NEW]` are this plan's additions wired onto existing seams. Routes aggregate at `meridian/routes/api.py`; errors map centrally in `meridian/main.py`.

```
 ┌────────────────────────────────────────── EXPERIENCE PLANE ──────────────────────────────────────────┐
 │  React 19 console  ui/src/{App.tsx, pages/*, api/client.ts}                                            │
 │  Dashboard · Units · Employees · EmployeeDetail · Tasks · Approvals · Ingest                           │
 │  [NEW] Projects · Persons · Documents · Events · Audit-browser · human login (lms-onyx IdP)            │
 └───────────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                                  │  HTTPS (axios, Bearer)
 ┌────────────────────────────────────────────── API EDGE (FastAPI) ────────────────────────────────────┐
 │  main.py (lifespan, CORS, error->HTTP map)  →  routes/api.py (single aggregate router)                 │
 │  units · employees · archetypes · runs · approvals · audit · identity · tasks · ingest · persons ...   │
 └───┬───────────────┬──────────────────┬─────────────────┬──────────────────┬──────────────────┬────────┘
     │               │                  │                 │                  │                  │
 ┌───▼─────┐  ┌──────▼───────┐  ┌───────▼────────┐  ┌─────▼──────┐  ┌────────▼────────┐  ┌──────▼────────┐
 │ AGENT-  │  │ GOVERNANCE   │  │ TASK REGISTRY  │  │ INGEST     │  │ ORCHESTRATION   │  │ EXPERIENCE/   │
 │ RUNTIME │  │ (Vault L4)   │  │  (the wedge)   │  │  (L1)      │  │ (Flow) [NEW]    │  │ TWIN (Prism)  │
 │         │  │              │  │                │  │            │  │                 │  │               │
 │employee │  │ policy.py    │  │ task_service   │  │ ingest_svc │  │ subscribes      │  │ dashboard_svc │
 │_service │  │ identity.py  │  │ task_lifecycle │  │ Extractor  │  │ events; runs    │  │ (rollups)     │
 │run_svc  │  │ audit_svc    │  │ depends_on +   │  │ Heuristic  │  │ state machine,  │  │ [NEW] Prism   │
 │adapters/│  │ approval_svc │  │ escalate_due   │  │ [NEW] LLM  │  │ exec-mode route,│  │ NL→SQL+charts │
 │ base    │  │ model_gateway│  │ provenance/    │  │ extractor; │  │ policy-gate,    │  │ predictive    │
 │ registry│  │ (route+cost) │  │ audit_ref      │  │ connectors │  │ 1-tap approval  │  │ twin          │
 │ echo    │  │ [NEW]egress, │  │                │  │            │  │                 │  │               │
 │[NEW]real│  │ budgets,     │  │                │  │            │  │                 │  │               │
 │adapters │  │ policy cat., │  │                │  │            │  │                 │  │               │
 │         │  │ hash-chain   │  │                │  │            │  │                 │  │               │
 └───┬─────┘  └──────┬───────┘  └───────┬────────┘  └─────┬──────┘  └────────┬────────┘  └──────┬────────┘
     │               │                  │                 │                  │                  │
 ┌───▼───────────────▼──────────────────▼─────────────────▼──────────────────▼──────────────────▼────────┐
 │                          STORAGE PLANE  services/store.py  (Store Protocol)                             │
 │  InMemoryStore (dev/test, zero-infra)  │  MongoStore (Motor)  │ [NEW] Postgres(Prism) · Qdrant(Pulse)  │
 │  collections: units employees runs approvals audit_ledger cost_events principals persons documents     │
 │               projects tasks events  (indexes: main._ensure_indexes)                                   │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
     ▲                                                                                            │
     │  events emitted (event_service.py)  ───────────────────────────────────────► consumed by Flow [NEW]
     └────────────────────────── all model calls route through model_gateway.route() ◄─── LiteLLM proxy [NEW]
```

Two facts to underline from the current build: (1) **services depend only on the `Store` Protocol** (`services/store.py`), never a concrete backend — so adding Postgres/Qdrant backends is additive, not a rewrite; (2) **every write path already emits an audit entry + a domain event** (task/employee mutations), so Flow's wiring is "consume the existing `events` collection," not "instrument the codebase."

### 2.4 The Agent Runtime (L5/L6)

The runtime contract is **already defined and stable**: `meridian/adapters/base.py` declares `Adapter` (an ABC with `validate_config(config) -> list[str]` and `async execute_heartbeat(ctx: HeartbeatContext) -> AdapterResult`), and `adapters/registry.py` implements the paperclip-style mutable registry (`register_adapter`, `get_adapter`, `known_adapter_types` — the last backs config validation so the API rejects an employee whose `adapter_type` isn't installed). `HeartbeatContext` carries `{employee_id, unit_id, model, adapter_config, trigger_detail}`; `AdapterResult` carries `{ok, input_tokens, output_tokens, summary, error, result}`. The token counts feed `gateway/model_gateway.cost_usd()` → a `Run` + `CostEvent`, attributed to the `principal_id` (`run_service`).

**What ships:** only `EchoAdapter` (`adapters/echo.py`), registered at import in `registry.py:35`. The plan-to-act loop is **not built** (current-build GAP).

**What this plan builds** — real adapters behind the unchanged contract, each enforced by the same governance the registry already gates:

| Adapter (`adapter_type`) | Backed by | Plan·Recall·Act provided by |
|---|---|---|
| `echo` (shipped) | `adapters/echo.py` | none (test heartbeat) |
| `lms_streaming` [NEW] | lms-onyx `controllers/streaming_controller.py` | agentic-retrieval/streaming loop (canonical runtime) |
| `convbi_sql` [NEW] | ConvBI LangGraph (`convBI/agents/*`) | NL→SQL plan→execute→self-heal |
| `claude_code` / `codex` [NEW] | external CLI/API (Claude via Model Gateway) | external coding-agent harness |
| `http_webhook` [NEW] | scoped connector POST | "bring your own agent" |

Critical invariants the runtime inherits from the shipped spine, unchanged:
- **Identity:** every heartbeat runs as the employee's `omk_*` principal (`governance/identity.py`), scopes copied from permissions at deploy; actions attributed to the principal for clean audit and clean decommission.
- **Budget:** `run_service._enforce_budget` auto-suspends + opens a `budget_override` approval when `spent_usd ≥ monthly_usd`. (Plan-side fix: add monthly-window reset + per-scope budgets — current-build GAP.)
- **Autonomy:** the heartbeat's commit step respects the employee's autonomy on the autonomy ladder (`domain/lifecycle.py`: shadow→assist→supervised→autonomous); deploy always resets to **shadow**.
- **Model routing:** the adapter requests a model; `model_gateway.route(policy, requested_model)` enforces on-prem-first (honors a request only if `policy.allowed`/`preferred` permits, else falls back to `internal/onyx-llm`).

### 2.5 Storage Substrate (L2)

The shipped abstraction is the design point: one async `Store` Protocol (`services/store.py`) with `insert/get/list/update/delete/count/ping/close`, `$in` filter support, and `_id`→`id` normalization. Two backends today: `InMemoryStore` (dict-backed, default — boots with zero infra, resets per test via `tests/conftest.py`) and `MongoStore` (Motor, lazy-imported, selected when `MONGO_DB_URL` is set; indexes created best-effort in `main._ensure_indexes`).

Polyglot extension (additive — new backends behind the same Protocol):

| Store | Collections / data | When | Source |
|---|---|---|---|
| MongoStore (shipped) | `units, employees, runs, approvals, audit_ledger, cost_events, principals, persons, documents, projects, tasks, events` | `MONGO_DB_URL` set | onyxos Motor pattern |
| Postgres [NEW] | analytics tables for Prism NL→SQL + dashboards | Prism plane | onyx-pulse / ConvBI |
| Qdrant [NEW] | vectors / context layers for Pulse Recall | Knowledge plane | lms-onyx / ConvBI (consolidate one wrapper) |
| Object store [NEW] | raw documents + provenance blobs (audio **discarded** post-transcription per UAE PDPL) | Ingest | new |

Storage hardening this plan owes (current-build GAPs): migrations, transactions, soft-delete/restore, and hash-chaining on `audit_ledger` for tamper-evidence.

### 2.6 Deployment Topology (on-prem first / hybrid)

L0 default is **on-prem** (Fakhruddin non-negotiable: data stays internal; open-source-first; internal-first AI). The shipped `Dockerfile` (python:3.11-slim, non-root uid 10001, port 8010) and `docker-compose.yml` (API + Mongo) are the dev baseline; production is the same image on on-prem orchestration. Note the deliberate **port 8010** choice in `config/settings.py:25` — it sidesteps the 8000 (ConvBI/onyxos) and 8005 (lms-onyx/onyx-pulse) collisions called out in the reuse map.

```
                         ┌───────────────────── ON-PREM PERIMETER (data stays internal) ─────────────────────┐
   Leadership / Dept ──► │  [Ingress / TLS]                                                                    │
       browsers          │      │                                                                              │
                         │  ┌───▼─────────────┐   ┌────────────────────┐   ┌──────────────────────────────┐   │
                         │  │ Meridian API    │   │ Agent-Runtime       │   │ Model Gateway (LiteLLM)[NEW]  │   │
                         │  │ (uvicorn :8010) │◄─►│ workers [NEW]       │◄─►│ on-prem SLM/LLM FIRST;       │   │
                         │  │ Dockerfile      │   │ adapters: lms/claude│   │ egress redaction; per-emp    │   │
                         │  │ stateless       │   │ enforce budget/auton│   │ budgets; cache+fallback      │   │
                         │  └───┬─────────────┘   └─────────┬──────────┘   └──────────────┬───────────────┘   │
                         │      │                           │                             │ approved egress    │
                         │  ┌───▼───────────────────────────▼─────────────────────────┐  │ ONLY (Vault gate)  │
                         │  │ Storage: Mongo · Postgres · Qdrant · object store        │  │                    │
                         │  └───────────────────────────────────────────────────────── ┘  │                    │
                         │  ┌────────────────────────────────────────────────────────────▼─┐                  │
                         │  │ Observability baseline [NEW]: OTel traces · Prom metrics · logs│                  │
                         │  └────────────────────────────────────────────────────────────────┘                │
                         └──────────────────────────────────────────────────────────────────┼─────────────────┘
                                                                                              ▼
                                                          External LLM (OpenAI/Anthropic) — ONLY via approved,
                                                          budgeted, PII-redacted gateway egress
```

| Profile | Compute | LLM routing | Use |
|---|---|---|---|
| **Dev** | single container, InMemoryStore | `internal/onyx-llm` (free in pricing table) | zero-infra boot, CI |
| **On-prem (default)** | API + runtime workers + Mongo/Postgres/Qdrant on customer hardware | gateway on-prem SLM first; external blocked unless approved | Fakhruddin V1 (UAE PDPL) |
| **Hybrid** | on-prem control + bursting to a private endpoint | external models only via Vault-approved, budgeted, redacted egress | scale / heavy reasoning |

Same governance applies in every profile (deployment-agnostic, §framework 8.7). The Model Gateway is the **single egress chokepoint**: nothing leaves the perimeter except through `model_gateway.route()`, where egress redaction + budget enforcement [NEW] live.

### 2.7 Observability Baseline (Ensure foundation)

The audit half is **shipped**: `services/audit_service.py` is a true append-only ledger (no update/delete path; actor, actor_type ∈ {user, employee, system}, action, entity, unit, details, timestamp), and `dashboard_service.py` already aggregates `recent_activity` (last 10 audit) + **stale-employee detection** (deployed, no heartbeat within `heartbeat_stale_seconds=900`, `config/settings.py:36`). The cost meter is shipped: `gateway/model_gateway.cost_usd()` → `CostEvent` per run for roll-ups.

What this plan adds onto that floor (current-build GAPs — "no metrics/tracing/structured logging"):

| Signal | Floor today | Net-new |
|---|---|---|
| Audit | append-only ledger (`audit_service.py`) | hash-chaining/tamper-evidence; export/retention; UI audit-browser |
| Traces | — | OpenTelemetry spans on every heartbeat + Policy Engine decision; unify Langfuse fragments → Ensure |
| Metrics | dashboard rollups (`dashboard_service.py`) | Prometheus: per-stage cost-trace, override rate, drift, SLA breach, attention-budget |
| Cost | `cost_usd()` + `CostEvent` + budget hard-stop | per-stage transition cost-trace; cost-to-automate vs cost-of-human |
| Logging | uvicorn default | structured JSON logs keyed by `principal_id` / `unit_id` / `audit_ref` |

The `audit_ref` already linking each Task Registry record to a ledger entry (`task_service`) is the join key that lets Ensure/Prism drill **KPI → task → source document → the agent action that produced it** — the digital-twin drill-down the leadership view requires.

### 2.8 What is fixed vs. open in this architecture

- **Fixed (build on, do not rebuild):** the `Store` Protocol and its two backends; the `Adapter` contract + registry; the AI-Employee lifecycle state machine (`domain/lifecycle.py`); Policy Engine config/deploy gates (`governance/policy.py`); Agent Identity principals (`governance/identity.py`); the Task Registry + dependency graph + escalation sweep (`services/task_service.py`, `domain/task_lifecycle.py`); the append-only audit ledger; the Model Gateway routing + cost meter; the dashboard read-model; the React console shell + typed `api/client.ts`.
- **Open (this plan's net-new, all onto existing seams):** the Flow engine consuming `event_service.py`'s inert `events` bus; real agent adapters behind `adapters/base.py`; the LiteLLM proxy behind `model_gateway_url`; per-action runtime authorize + versioned policy catalog; the connector framework + LLM extractor behind `ingest_service.set_extractor`; Postgres/Qdrant/object-store backends; the observability baseline; human auth (lms-onyx IdP) — current-build's largest single gap, since every write endpoint is unauthenticated today.

I have everything I need. The code confirms every claim in the dossier. Writing the section now.

---

## 3. Canonical Model, Knowledge, Ingestion & Connectors

This section specifies the shared ontology, the knowledge layer (Pulse), the ingestion/structuring pipeline, and the typed/scoped connector framework. onyx-meridian has **already shipped** a working canonical-model spine — Pydantic schemas, an `InMemory`/`Mongo` store, CRUD services, a meeting-ingestion path, and an append-only domain `events` bus. The job here is **not to rebuild that spine** but to (a) close the two entity gaps (`Customer`, `Asset`), (b) turn the id-reference graph into a *traversable, policed* entity graph, (c) replace the single manual transcript POST with a typed read-only connector framework, and (d) wire Pulse (`lms-onyx`) in as the grounding/recall layer behind both ingestion and the agent runtime.

### 3.0 What is already shipped (build on, do not rebuild)

Verified in `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/`:

| Concern | Shipped artifact | Status |
|---|---|---|
| Entity schemas | `schemas/{person,document,project,task,event,unit,employee,archetype,run,approval,audit}.py` (Pydantic v2) | 11 of 13 framework entities modeled |
| Canonical enums | `domain/enums.py` — `OwnerType`, `SourceType`, `DocumentKind`, `ProjectStatus`, `EscalationPolicy` | shipped |
| Persistence | `services/store.py` — `Store` Protocol, `InMemoryStore` (default, `$in`/sort/skip/limit) + `MongoStore` (motor, lazy) | shipped; collections at `store.py:218-232` |
| Indexes | `main.py:41-54` `_ensure_indexes()` (employees, runs, approvals, audit, archetypes, tasks) | shipped; **no person/document/event indexes yet** |
| CRUD services | `services/{person,document,project,task,event,...}_service.py` | shipped |
| Task Registry (the wedge) | `services/task_service.py`, `domain/task_lifecycle.py` — provenance, deps + cycle detection, escalation sweep | shipped (covered in §5) |
| Meeting ingestion | `services/ingest_service.py` — `Document` → pluggable `Extractor` → `Task` w/ provenance + owner resolution | shipped, **heuristic-only** |
| Domain events bus | `services/event_service.py` (`emit`/`list_events`), `EVENTS` collection | shipped, **consumed by nothing** |

The Pydantic-schema + `Store`-Protocol + per-entity-service triad is the pattern every addition below must follow. Do not introduce an ORM; extend the existing collections and services.

### 3.1 Canonical entity model — current vs. target

Source of truth: framework `[05]`. Current schemas map almost 1:1. Two entities (`Customer`, `Asset`) are explicitly missing per the current-build gap list, and they are exactly the entities the CRM/Treppan worked-proof and the Fakhruddin property/leasing/asset departments need.

| Entity | Framework `[05]` | Meridian schema today | Collection (`store.py`) | Action |
|---|---|---|---|---|
| Person | human staff | `schemas/person.py` (`name,email,role,unit_id,reports_to`) | `persons` | **Keep.** Add `principal_id?` (for human IdP linkage in §8). |
| AIEmployee | digital worker, **peer of Person** | `schemas/employee.py` (full inline anatomy) | `employees` | **Keep** (owned by §4). |
| Unit | department | `schemas/unit.py` | `units` | **Keep.** |
| Project | initiative | `schemas/project.py` (`unit_id,name,lead_id,status`) | `projects` | **Keep.** Add `contains` rollup query (§3.3). |
| Document | captured artifact + provenance | `schemas/document.py` (`kind,content,uri,source_ref,provenance`) | `documents` | **Keep.** Add `chunk_refs[]`, `embedding_status`, `classification` (§3.4). |
| Commitment/Task ★ | the accountability core | `schemas/task.py` (`Owner`,`Source`,`depends_on`,`escalation`,`audit_ref`) | `tasks` | **Keep** (§5). |
| Event | bus state-change | `schemas/event.py` (`type,entity_type,entity_id,payload`) | `events` | **Keep**, make it *drive* Flow (§3.5). |
| **Customer** | external party (lead/account) | **MISSING** | — (add `customers`) | **ADD** `schemas/customer.py`. |
| **Asset** | tracked thing (property/unit/equipment/SKU) | **MISSING** | — (add `assets`) | **ADD** `schemas/asset.py`. |

#### 3.1.1 New: `schemas/customer.py`

Mirror the existing schema style (a `*Create` + `*Read` pair, `from __future__ import annotations`, `pydantic.BaseModel`). The Treppan CRM dossier shows the concrete fields a `Customer` must carry to host a lead lifecycle (`backend/db/models/crm/lead.py` — `status_id`, `lifecycle_stage_id`, `owner`, `sla_due_at`, `claimed_by`, `converted_at`). Meridian's canonical `Customer` should stay thin (the lifecycle state machine lives in Flow, §6/§7), but must hold the relationship anchors:

```
CustomerCreate: unit_id, name, kind (lead|account|prospect|broker),
                primary_contact{name,email,phone}, owner: Owner|None,
                source: Source (reuse task.Source — provenance), external_refs[] (dedupe key),
                stage_ref: str|None (FK into Flow's lifecycle, not an enum here)
CustomerRead:   + id, status, created_at, updated_at
```

Reuse the existing `Owner` and `Source` models from `schemas/task.py` so that "owned_by" and "derived_from" are *the same shape* for a Customer as for a Task — this is what makes graph traversal uniform (§3.3).

#### 3.1.2 New: `schemas/asset.py`

```
AssetCreate: unit_id, kind (property|unit|equipment|sku), name, identifier (RERA/asset id),
             owner: Owner|None, parent_asset_id: str|None (asset hierarchy),
             attributes: dict, customer_id: str|None (leased/owned by)
AssetRead:   + id, status, created_at, updated_at
```

Add `CUSTOMERS = "customers"` and `ASSETS = "assets"` to `store.py:218-232` and matching indexes to `main.py:_ensure_indexes` (`customers`: `unit_id`,`owner.id`,`external_refs`; `assets`: `unit_id`,`customer_id`,`parent_asset_id`). Add `CustomerKind`/`AssetKind` to `domain/enums.py` next to the existing `DocumentKind`/`SourceType` (`enums.py:131-152`).

### 3.2 Relationship model — id-references today, policed graph next

The framework `[05]` requires five edges; today they exist only as **id fields**, not as a navigable graph (current-build gap: *"Entity graph relations are id-references only — no graph traversal, no digital-twin model"*).

```
Framework edge                       Today (id-ref)                         Target
─────────────────────────────────────────────────────────────────────────────────────────
Person|AIEmployee —member_of→ Unit   person.unit_id / employee.unit_id      keep ids; add graph adapter
Commitment —owned_by→ Person|AIEmp   task.owner{type,id}                     keep; OwnerType is the peer key
Commitment —derived_from→ Document   task.source.doc_id                     keep
Commitment —blocks→ Commitment       task.depends_on[] (cycle-checked)      keep (task_lifecycle.py DFS)
Project —contains→ Commitment        task.project_id                        keep; add reverse-index query
Customer —has→ Asset / Asset —of→    (new) asset.customer_id                add with Customer/Asset
```

**Why `AIEmployee` peering matters operationally:** `OwnerType` (`enums.py:123-129`) already has exactly two values — `PERSON` and `AI_EMPLOYEE`. A `Task.owner` of either type validates against the unit's members (current `task_service` validates owner→unit). This is the concrete mechanism behind the framework's blended org chart: "who owns this" and "who reports to whom" resolve through the *same* `{type,id}` shape for humans and agents. **No new code is needed to peer them — the peering is already in the data model;** we only need traversal on top.

### 3.3 The entity graph that *polices* automation `[03, L3]`

Framework `[03]` requires a "base ontology + entity graph that *polices* automation traversals (agents move only along sanctioned relationships)." Today there is no graph layer. **Build a thin `graph` service, not a graph database** — it reads the existing collections and exposes sanctioned traversals; the Policy Engine (Vault, §8) authorizes each hop.

```
meridian/services/graph_service.py        (new — pure read over Store)
meridian/domain/ontology.py               (new — the sanctioned-edge allowlist)

ontology.py:  SANCTIONED_EDGES: set[Edge] = {
    ("task","owned_by","person"), ("task","owned_by","ai_employee"),
    ("task","derived_from","document"), ("task","blocks","task"),
    ("project","contains","task"), ("customer","has","asset"),
    ("person","member_of","unit"), ("ai_employee","member_of","unit"),
}

graph_service.traverse(start_ref, edge, *, actor_principal) ->
    1. assert (start.type, edge, target.type) in SANCTIONED_EDGES   # ontology gate
    2. policy.authorize(actor=principal, action="graph.traverse",
                        target=edge, data_scope=start.unit_id)       # Vault gate (§8)
    3. resolve via Store ($in on the id field)                       # data
```

An agent that tries to walk an unsanctioned edge (e.g. `ai_employee → reads → other_employee.memory`, which the framework forbids — "no cross-employee reads") fails at step 1; an agent that tries a sanctioned edge outside its `data_scope` fails at step 2. This is "governance by construction" — the graph is the *traversal authorizer*, reusing the existing `governance/policy.py` rather than adding a parallel ACL. The Digital Twin (§9, owned elsewhere) is a read-model projected over exactly these traversals.

### 3.4 Knowledge layer — Pulse `[09, L3]`

Meridian today has **no knowledge/RAG layer** — `dashboard_service.py` is a local aggregation, "Pulse (knowledge/RAG) … not integrated" (current-build gap). Pulse already exists as `lms-onyx`; reuse it, don't rebuild.

**Reuse map (from reuse-map dossier):**

| Pulse capability | Source (`lms-onyx`) | Integration into Meridian |
|---|---|---|
| Agentic-RAG cited Q&A + "deep think" | `controllers/streaming_controller.py` (1678 lines) | The **Recall step** of the agent runtime (§4) and the LLM extractor's grounding call |
| Hybrid vector store (Qdrant BM25+dense, FastEmbed) | `lms-onyx` Qdrant wrapper | The vector index behind `Document` chunks |
| Multi-modal ingestion / OCR | `tools/doc_process/` | `pdf`/`email` connector content extraction (§3.6) |
| Transcription (audio/video) | `services/{audio,video}_transcription_service.py` | Meeting connector: audio→transcript, **then discard audio** (Fakhruddin UAE constraint) |

**The 7 context layers `[Pulse, framework §1 L3]`** must be made addressable so an AIEmployee's `context_bindings` (already a field on `schemas/employee.py` per the framework anatomy) select which layers it can recall from. Model them as named retrieval scopes Pulse resolves, not new tables:

```
context layer          backed by
──────────────────────────────────────────────────────────
1 organization         units + org graph (§3.3)
2 role/charter         employee.role (charter, KPIs)
3 unit knowledge       documents WHERE unit_id (permission-scoped)
4 task/commitment      tasks + provenance (Source.quote)
5 customer/account     customers + their documents
6 policy memories      policy effectiveness (Vault/Ensure)
7 episodic/outcome     run history + task outcomes (promotion signal)
```

A recall call is `pulse.recall(query, layers=[...] ∩ employee.context_bindings, unit_scope, actor_principal)` — the intersection enforces scoping and "no cross-employee reads." **Good retrieval lets cheaper models succeed** `[09]`, so Pulse is a cost lever too, not only an effectiveness one.

#### 3.4.1 Document → chunk → embedding wiring

Extend `schemas/document.py` (already has `content`, `uri`, `source_ref`, `provenance`) with `classification` (PII/sensitivity, for Vault egress control), `chunk_refs: list[str]`, and `embedding_status`. Add a `document_chunks` collection (id, doc_id, ordinal, text, vector_ref). On `document_service.create_document`, emit a `document.ingested` event (§3.5) that triggers the Pulse chunk+embed job. This mirrors Treppan's `document`/`document_chunk`/`embedding`/`retrieval_log` intelligence-domain models — a proven shape to copy.

### 3.5 Make the events bus *drive* Flow (the missing wire)

The single highest-leverage fix in this section: `event_service.emit` already writes every canonical state change to the `events` collection, but it is "captured but inert … consumed by nothing." The docstring in `event_service.py:3` literally says *"In the full platform these drive Flow…"*. The wiring contract:

```
                      ALREADY SHIPPED                         TO BUILD (§3.5 + Flow §7)
  ┌──────────────┐   emit()    ┌──────────┐   subscribe   ┌──────────────────────┐
  │ *_service.py │ ──────────▶ │  events  │ ────────────▶ │  Flow dispatcher     │
  │ (task,doc,   │             │collection│               │  (event_key → tasks) │
  │  customer..) │             └──────────┘               └──────────────────────┘
  └──────────────┘                                               │ advisory, post-commit
                                                                 ▼
                                                    policies (Vault) + HITL queue
```

**Reuse Treppan's proven dispatcher pattern** (`backend/services/v1/workflow/workflow_engine.py::WorkflowEngine._dispatch`): on an `event_key`, load active tasks bound to a trigger whose `event_key` matches, evaluate bound policies, compute `requires_hitl`, write an execution row. Treppan fires this **synchronously, post-commit, wrapped so it can never break the originating operation** (`workflow_engine.py:52-60`, `lead_service.py:60-79`) — Meridian must adopt the same safety wrapper around event consumption. Meridian's `event.type` strings (`task.created`, `task.escalated`, `task.escalation_warning`, plus new `document.ingested`, `customer.created`) become the `event_key`s. Today only Treppan's `lead.created`/`lead.status_changed` are live; Meridian's first live keys should be the task-registry events already being emitted.

### 3.6 Ingestion & structuring pipeline

Current state: one manual `POST /ingest/transcript` → `ingest_service.ingest_transcript` → `HeuristicExtractor` (regex `<Name> will/to <action> [by <when>]`) → `Task` with provenance + owner-name resolution against unit persons, returning `unresolved_owners`. The seam for a real extractor exists: `set_extractor()` (`ingest_service.py:73-76`) is shipped and unused.

The pipeline is sound; it needs two upgrades and a generalization:

```
SOURCE ──▶ [Connector] ──▶ normalize ──▶ Document ──▶ [Extractor] ──▶ proposals ──▶ Task Registry
 (§3.7)      typed,         enrich       (shipped)     pluggable       typed         (shipped, §5)
            read-only      (classify)                  (heuristic→AI)  +provenance
```

**Upgrade 1 — LLM extractor (close the gap).** Register an `AIAgentExtractor` via the existing `set_extractor()` hook that returns the *same* `ExtractedCommitment` proposals (`title, quote, owner_name, due_text`). Implement it as an AIEmployee run (§4) grounded by Pulse recall (context layers 3+5), so extraction is itself a governed, costed, auditable agent action — not an out-of-band call. It must still emit typed proposals (never auto-commit), preserving "AI proposes, a human commits": unresolved owners and low-confidence extractions land in the HITL/approval queue rather than creating unassigned tasks silently. The heuristic stays as the offline/test default — `conftest.py` resets and the 35-test suite depend on a deterministic extractor.

**Upgrade 2 — structuring/enrichment before Knowledge `[L1]`.** Between connector and Document, run a normalize+classify+dedupe step: assign `Document.classification` (PII/sensitivity → Vault egress), dedupe against `source_ref`/`external_refs` (Treppan's P9 dedupe pattern, `external_ref` model), and enrich `provenance`. This is the framework's "structuring/enrichment pipeline that normalizes raw capture before Knowledge."

**Generalization — one ingest entry per source kind.** `ingest_transcript` is meeting-specific. Add `ingest_service.ingest_document(connector_event)` that branches on `DocumentKind` and applies the right extractor (meeting transcript → commitments; email → commitments + customer-reply; pdf/contract → fields, à la Treppan's `project_extractor` real harness). Keep `ingest_transcript` as a thin wrapper for back-compat with the existing route/tests.

### 3.7 Typed, scoped connector framework `[01, L1]`

Current state: **no connector framework** — "Ingestion is a single manual transcript POST." This is net-new. Two strong patterns to copy rather than invent:

- **Adapter registry pattern** from `paperclip` (`server/src/adapters/registry.ts`, `registerServerAdapter`/`requireServerAdapter`) — reference only (TypeScript), but it is the exact "instantiate/configure/deploy/retire by adapter key" shape.
- **Meridian's own adapter contract** already exists for agent runtimes: `adapters/base.py` + `registry.py` + `echo.py`. **Reuse this same registry mechanism for connectors** — one registry abstraction, two adapter families (runtime adapters, connector adapters), consistent with the "thin-core + plugin/adapter" architecture.

```
meridian/connectors/base.py        Connector Protocol (mirror adapters/base.py)
meridian/connectors/registry.py    register/require by key (mirror adapters/registry.py)
meridian/connectors/{meeting,email,crm,filedrop}.py
```

**Connector contract (read-only by default, framework non-negotiable "ingest read-only first"):**

```python
class Connector(Protocol):
    key: str                      # "ms_teams_meeting", "exchange_email", "treppan_crm"
    kind: DocumentKind            # what it produces
    access: ConnectorAccess       # READ_ONLY (default) | READ_WRITE (explicit grant only)
    data_scope: str               # unit_id it is scoped to (least-privilege)
    async def poll(self, since) -> list[RawCapture]: ...   # pull
    async def normalize(self, raw) -> DocumentCreate: ...  # → canonical Document
```

| Connector | Source system (per Fakhruddin "01 Source Systems") | Produces | Notes |
|---|---|---|---|
| `meeting` | Teams/Zoom + transcription | `DocumentKind.MEETING` | Uses `lms-onyx` transcription; **discard audio after transcript** (UAE PDPL) |
| `email` | Exchange/Graph (read-only) | `DocumentKind.EMAIL` | scoped mailboxes only; classify before Pulse |
| `crm` | Treppan CRM / external CRM | `Customer`,`DocumentKind.NOTE` | hydrates `customers` + lead provenance |
| `filedrop` | docs/PDF/contracts | `DocumentKind.PDF` | OCR via `tools/doc_process/`; Legal pilot dept |

**Scoping & governance:** every connector is a **first-class principal** issued credentials at registration the same way `governance/identity.py` issues `omk_*` tokens to deployed employees — so a connector's pulls are attributed in the audit ledger and bounded by `data_scope`. `READ_WRITE` (the "Co-Work / application-use" acting surface, `[L6]`) requires an explicit action-scope grant validated by the Policy Engine; nothing writes back to a source system without a HITL gate. The connector framework is *scheduled* by Flow (§7), not by a cron in this layer — Meridian has no scheduler, matching Treppan's design where time-based triggers are "modeled and configurable but not yet wired to cron."

### 3.8 Build sequence & test posture

```
1. ADD entities      schemas/customer.py, schemas/asset.py; enums; store collections + indexes;
                     customer_service.py, asset_service.py; routes in routes/api.py.   [low risk, additive]
2. GRAPH layer       domain/ontology.py + services/graph_service.py (ontology gate + Vault gate).
3. EVENTS→FLOW wire  event consumer adopting Treppan's _dispatch + post-commit safety wrapper.
4. PULSE recall      pulse client (lms-onyx); context-layer scoping; document chunk/embed via document.ingested event.
5. EXTRACTOR upgrade AIAgentExtractor via set_extractor(); structuring/classify/dedupe step.
6. CONNECTORS        connectors/{base,registry} (mirror adapters/*); meeting→email→crm→filedrop; principal-scoped.
```

Each step is independently valuable and reversible (framework phasing). **Test posture:** keep `HeuristicExtractor` as the default so the existing 35-test suite (`test_registry_api`, ingest/provenance tests) stays green; new entities get the same coverage shape as `test_registry_api` (legal/illegal transitions, owner→unit validation, provenance); the graph layer gets sanctioned-vs-unsanctioned-edge tests and a Vault-scope-denied test; CI (`.github/workflows/ci.yaml`: `ruff` → `pytest`, Python 3.11) needs no change beyond new test files.

**Key files this section creates or extends (absolute paths):**
- Create: `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/schemas/customer.py`, `schemas/asset.py`, `domain/ontology.py`, `services/graph_service.py`, `services/customer_service.py`, `services/asset_service.py`, `connectors/base.py`, `connectors/registry.py`, `connectors/{meeting,email,crm,filedrop}.py`, `services/pulse_client.py`
- Extend: `meridian/domain/enums.py` (add `CustomerKind`,`AssetKind`,`ConnectorAccess`), `meridian/services/store.py:218-232` (`CUSTOMERS`,`ASSETS`,`DOCUMENT_CHUNKS`), `meridian/main.py:41-54` (indexes), `meridian/services/ingest_service.py` (`set_extractor` → `AIAgentExtractor`; `ingest_document`), `meridian/services/event_service.py` (consumer), `meridian/schemas/document.py` (`classification`,`chunk_refs`,`embedding_status`), `meridian/routes/api.py` (new routes)
- Reuse (no fork): `lms-onyx/controllers/streaming_controller.py`, `lms-onyx/services/{audio,video}_transcription_service.py`, `lms-onyx/tools/doc_process/`; pattern-reference `paperclip/server/src/adapters/registry.ts`; copy dispatcher pattern from `Treppan_CRM/backend/services/v1/workflow/workflow_engine.py`.

All paths confirmed. The dossier is exhaustive and grounded. Writing the section now.

---

## 4. The Control Framework (Effectiveness & Cost) — Workflows, Tasks, Execution Modes, Policies, BPMN

This is the load-bearing accelerator: **Flow**. It is the one component that touches every other plane — it calls Pulse to recall, Prism to inform, Vault to authorize, and Ensure to measure (`FRAMEWORK/09`). The thesis of the whole platform — *every unit of work is effective, affordable, and reversible* — is operationalized here and nowhere else. Effectiveness and cost are not dashboards bolted on after the fact; they are **attachments on each task row**, decided at design time and measured at run time.

We are not starting from a blank page. **Treppan CRM has already shipped a working, advisory, data-driven version of this exact framework** — a 36-task lead-lifecycle engine with a 17-policy catalog, an execution-mode field, a HITL flag, simulated agent runs with real cost arithmetic, and an append-only execution log. The TESPL Request-to-Quote spec is the second, harder blueprint (7 states + 3 branches, 31 tasks, P1–P14, dynamic SRF, costing-as-two-rows). And `onyx-meridian` has already shipped the **substrate** Flow needs: a task-lifecycle state machine (`domain/task_lifecycle.py`), a pre-action policy gate (`governance/policy.py`), a model-gateway cost meter (`gateway/model_gateway.py`), an append-only audit ledger (`services/audit_service.py`), an approval queue (`services/approval_service.py`), and a domain event bus (`services/event_service.py`) — but those events are **consumed by nothing** (`current-build` GAPS: "Domain Events are emitted to the `events` collection but consumed by nothing").

**The job of this section is precise:** lift Treppan's proven engine design into a *durable, cross-unit, Temporal-style* Flow engine inside `onyx-meridian`, wire it to the already-emitted event bus, and make the cost-meter / audit-ledger / approval-queue that Meridian already has the runtime targets of every task dispatch. We **do not rebuild** Treppan's catalog model, the Meridian task state machine, the policy gate, the cost meter, or the approval queue. We **build** the orchestration spine that binds them and adds durability, time-based triggers, versioned policies, and per-stage cost roll-up.

---

### 4.1 The substrate chain (what Flow is)

```
PROCESS
  └─▶ WORKFLOW  (a state machine: states + transitions)
        └─▶ TASKS  (rows attached to a transition or a stage)
              └─▶ EXECUTION-MODE DELEGATION  ── the COST lever
                    {Deterministic | Workflow+Policy | AI Agent(effort)}
              └─▶ POLICY  (P1…Pn, versioned)        ── governance
              └─▶ HITL flag (AI proposes → human commits) ── trust/safety
              └─▶ ACCOUNTABLE HUMAN                  ── accountability
              └─▶ KPIs                               ── EFFECTIVENESS
              └─▶ COST METER (tokens/$ + model tier) ── COST
```

Each task carries **six attachments** (`FRAMEWORK/08`). Treppan already models five of the six on one row — `WorkflowTask` in `backend/db/models/workflow/workflow_task.py` carries `executed_by` (mode), `needs_hitl` (HITL), `agent_config_id` (the AI binding), M2M `policies` via `task_policies`, plus `trigger_id` and `execution_config` JSONB. What Treppan's row is *missing* and Meridian must add: an **accountable-human binding** (Treppan tracks this only in the spec's "Accountable" column, not the DB) and a **per-task KPI/cost-meter binding** (Treppan measures cost per *agent*, not per *task* — see §4.7). Those two additions are the entire delta on the task-row schema.

---

### 4.2 The cost lever — execution-mode delegation

Every task runs in **exactly one** mode. The design rule is canonical and non-negotiable: **choose the cheapest sufficient mode — don't spend a model where a rule or code suffices** (`FRAMEWORK/08 §6.1`). The "is intelligence required?" boundary is decided per field by the solution designer, and **the modes must not be collapsed** — TESPL costing is deliberately *two rows* (#16 compute-from-masters = Deterministic; #17 resolve-ambiguous-choices = AI Agent). That boundary is where cost is won or lost.

| Mode (Meridian) | Treppan `executed_by` | TESPL mode | Decides via | Model cost | Use for |
|---|---|---|---|---|---|
| **Deterministic** | `workflow` | Workflow (Deterministic) | no judgement | none | mint POD#/lead id, fan-out, costing formula from masters, arm exposure watch, write audit log, SLA timer |
| **Workflow + Policy** | `workflow` (with bound policies) | Workflow + Policy | rule-driven (Policy Engine) | none | owner assignment, rotation, cadence, rate-staleness, margin floor, approval routing, SLA |
| **AI Agent** | `ai` | AI Agent · effort {Low/Med/High} | model judgement | model cost, sized by effort | parse specs, draft SRF/reply, propose value/fabric-bind, resolve ambiguity, recommend requote, narrate funnel |
| **Hybrid** | `hybrid` | Hybrid (AI/WF → Human) | mode + a human gate | mode cost | channel fallback+approve, share shortlist, plan sample + draft SWN |
| **Human** | `human` | Human | a person | none | confirm spec & mint POD#, approve price, mark lost reason |

Treppan implements this as a four-value enum (`workflow|ai|human|hybrid`, default `workflow`) on `WorkflowTask.executed_by`; Meridian should extend it to the same four values **plus an explicit `workflow_policy`** so the cost report can distinguish "no model, no policy" (pure deterministic, free) from "no model, policy-gated" (still free, but governed) — Treppan currently collapses both into `workflow` and disambiguates only by whether the task has bound policies. Effort tags (`Low/Med/High`, from TESPL) become a field on the AI-task config that the Model Gateway reads as a **model-tier + token-budget sizing hint** — directly mapping to Meridian's existing `gateway/model_gateway.py::route(policy, requested_model)` (on-prem-first) and `cost_usd()` pricing table.

**The cost lever in one sentence:** the mode field on each task row *is* the per-task cost decision; the engine never upgrades a `workflow` task to a model call.

---

### 4.3 The BPMN-ish workflow definition format

There is **no BPMN XML, no Temporal SDK in Treppan today** — the "BPMN" is expressed as **relational data**: a `workflow` owns ordered `workflow_stages` and `workflow_tasks`; each task binds a `workflow_trigger` (an `event_key`) and a set of `policies`; AI tasks bind an `agent_config` with an ordered `flow` JSONB step list (`treppan-backend §7`). We adopt this exact shape and add a **declarative manifest** as the authoring/seed format (mirroring Treppan's `workflow_catalog.py`, which is the seed source-of-truth that is read once, then becomes DB-editable).

A workflow definition is a versioned document with three sections — `states`, `transitions`, `tasks` — plus catalog references:

```yaml
# flow/definitions/crm_lead_lifecycle.v3.yaml   (seed → DB; engine reads DB, never the file)
workflow:
  key: crm.lead_lifecycle
  version: 3
  correlation: lead_id          # the workflow id / correlation key
  unit: sales

states:                          # = lifecycle stages (Treppan STAGES; TESPL S1..S7)
  - {code: under_qualification, name: Prospect,    kind: canonical, order: 1}
  - {code: pre_qualified,       name: Qualified,   kind: canonical, order: 2}
  - {code: warm,                name: Proposal,    kind: canonical, order: 3}
  - {code: hot,                 name: Negotiation, kind: canonical, order: 4}
  - {code: closed,              name: Deal Closed, kind: canonical, order: 5}
  - {code: lost,    name: Lost,   kind: branch}     # branch track
  - {code: broker,  name: Broker, kind: branch}     # parallel track

transitions:                     # no hard guard graph; governance is advisory-then-enforced
  - {from: under_qualification, to: pre_qualified, on: lead.status_changed}
  - {from: "*", to: lost,       on: lead.marked_lost}        # any → lost
  - {from: warm, to: warm,      on: cadence.tick, reentrant: true}  # On-Hold-style loop

tasks:                           # the rows — each carries the SIX attachments
  - seq: 2
    state: under_qualification
    name: Auto-assign owner
    mode: workflow_policy        # COST lever  (no model)
    trigger: lead.created        # the event_key (= activity dispatch key)
    policies: [P1, P2]           # governance  → Policy Engine
    hitl: false                  # trust/safety
    accountable: role:client_service   # accountability (NEW vs Treppan)
    kpi: [time_to_assign_p50, unowned_rate]   # EFFECTIVENESS (NEW per-task)
    cost_meter: {mode_cost: 0}   # COST
  - seq: 3
    state: under_qualification
    name: First-touch AI call
    mode: ai
    effort: Med                  # → model tier + token budget (TESPL effort tag)
    agent: first_touch_agent     # binds agent_config (tools, flow, prompt)
    trigger: lead.created
    policies: [P3, P7, P10]      # first-touch window, AI-governance, AI-scope
    hitl: true                   # AI proposes → human commits
    accountable: role:client_service
    kpi: [first_touch_within_5min_pct, proposal_accept_rate]
    cost_meter: {model_policy: agent.model_policy}   # priced at run via gateway
```

This is a 1:1 superset of what Treppan already seeds in `workflow_catalog.py` (`STAGES` `:14-23`, `TRIGGERS` `:29-63`, 36 `TASKS` `:80-205` with `TaskSpec` fields `seq/stage/name/executed_by/trigger/needs_hitl/agent/policies`, and `POLICY_RUNTIME` `:211-230`). The two new fields — `accountable` and `kpi` — and the `effort` tag from TESPL are the only schema additions. **Editability is the design point** (`treppan-backend §7`): once seeded, admins edit states/tasks/triggers/policy-bindings/agent prompts via CRUD (Treppan's `routers/v1/workflow.py`); editing a policy threshold or a task's HITL flag changes engine behaviour immediately.

---

### 4.4 Durable orchestration — Temporal-style, mapped onto Meridian

`FRAMEWORK/08 §6.7` mandates a **Temporal-style durable workflow engine**: *canonical state = durable workflow state; each task = an activity (deterministic activity / agent-call activity / policy-query activity); a business correlation id (`POD#`, `lead_id`) = the workflow id; idempotent, replayable, fully auditable.* Treppan deliberately does **not** use Temporal (its engine is "a bespoke synchronous in-process event dispatcher", `treppan-backend §7`) — that is fine for two live events but cannot do time-based triggers (3×3×3 cadence, 48h stall, SLA timers, missed-call 60s are "defined as data/config but not autonomously executed"). The Fakhruddin pilot's "escalate *before* the deadline" requirement and the TESPL "Quote Live watch loop" both **need durable timers**, so Meridian's Flow must be durable.

The mapping — and critically, **what already exists in `onyx-meridian` to build on**:

| Temporal concept | Flow realization | Built on (already shipped) | New work |
|---|---|---|---|
| Workflow id / correlation key | `lead_id`, `POD#`, `task_id` | `Task.correlation` notion exists per-entity | thread it as the durable run key |
| Workflow state | the state-machine current state | `domain/task_lifecycle.py` state machine; `domain/lifecycle.py` employee SM | **new** `WorkflowRun` state record per correlation id |
| Activity = deterministic | code fan-out / formula / audit-write | `services/audit_service.py` (append-only), cost roll-up | dispatcher invokes |
| Activity = policy-query | Policy Engine call returning a verdict | `governance/policy.py` `authorize_*` → `PolicyVerdict` (allow/require-approval/deny) | extend to per-action runtime authz (see §4.5) |
| Activity = agent-call | adapter run → typed proposal | `adapters/base.py`+`registry.py`+`echo.py`; `run_service` records cost/attribution; `gateway/model_gateway.py` prices it | replace `echo` with real adapters (out of this section's scope; consumed here) |
| Signal / event | trigger fires next activity | `services/event_service.py` append-only `events` bus — **emitted but consumed by nothing** | **the Flow engine becomes the consumer** |
| Timer / durable sleep | cadence, SLA, stall, escalation | `task_service.escalate_due` (idempotent sweep) | **new** durable timer scheduler driving timed triggers |
| Replay / audit | execution log | `audit_ledger` + a new append-only `workflow_executions` (clone Treppan's) | append-only dispatch log |

**Dispatcher loop (clone of Treppan's `WorkflowEngine._dispatch`, `workflow_engine.py:62-121`, made durable):**

```
on Event(event_key, correlation_id, ctx):           # from event_service bus
  run = load_or_create WorkflowRun(correlation_id)   # durable state
  tasks = WorkflowTask where trigger.event_key==event_key AND active
          (unit-scoped, ordered by sort_order)        # Treppan :62-90
  for task in tasks:
    policies   = task.bound_enabled_policies()
    verdict    = PolicyEngine.authorize(actor, task, ctx, policies)   # governance/policy.py
    requires_hitl = task.hitl OR verdict.requires_approval            # Treppan :91-99
    if task.mode == ai:
        proposal, cost = Adapter.run(task.agent_config, ctx)          # typed proposal
        record Run(model, in/out tokens, cost_usd, principal_id)      # run_service
    exec = append WorkflowExecution(task, verdict.decisions,          # Treppan :100-121
                  requires_hitl, agent_run_id, evidence)
    if requires_hitl:
        Approval.open(type=commit, subject=task, payload=proposal)    # approval_service
  emit follow-on Events for time-based tasks → durable timers
```

**Safety wrapper (preserve Treppan's invariant):** Treppan wraps `WorkflowEngine.dispatch` (`:52-60`) and notification emit in catch-all/rollback so the advisory engine *can never break a business operation* (`treppan-backend §7`). Meridian must keep this: a Flow dispatch failure rolls back the dispatch, never the underlying entity mutation. This is the runtime expression of design principle #10, *reversible by design*.

**Live vs modeled triggers:** Treppan fires only `lead.created` and `lead.status_changed` today; the other ~31 triggers (`call.unanswered`, `cadence.exhausted`, `meeting.confirmed`, `booking.deposit`) are "modeled and configurable but not yet wired to integrations/cron." Meridian's durable timer scheduler is exactly what closes that gap — and it is the single capability that turns Treppan's *advisory* engine into the platform's *enforcing* one.

---

### 4.5 The Policy Engine + versioned policy catalog

Treppan ships **two coordinated engines** (`treppan-backend §3`), and the platform needs both:

1. **Runtime policy engine** — `backend/services/v1/workflow/policy_engine.py`. `PolicyEngine.evaluate(policies, lead_ctx)` (`:109-124`) runs each policy's `evaluator_key` function (8 evaluators: `assignment, rotation, first_touch, dedupe, ai_scope, audit, sla, governance`) and returns `PolicyDecision`s with `effect ∈ {allow, flag, require_approval, route, schedule, block, noted}`; `_HITL_EFFECTS = {require_approval, block}`. **Advisory only today** — decisions recorded, never enforced.

2. **Effectiveness/measurement engine** — `backend/services/v1/analytics/policy_service.py`. Scores each policy **0–100 after the fact** against live CRM data (13 metric fns), bands them (`healthy ≥80 / at_risk ≥50 / breaching / not_instrumented`), and a swappable `PolicyBrain` (`DeterministicPolicyBrain :421-451`) emits change recommendations via each policy's `lever`. The Protocol is explicitly built so a `ClaudePolicyBrain` drops in later (`:1-13`). These are the **"policy memories"** from `FRAMEWORK/08 §6.3` — *how effective each policy is → policies are tuned, not frozen.*

**The catalog itself maps cleanly across the two specs.** Treppan P1–P17 and TESPL P1–P14 are the same themes:

| Theme | Treppan (`policy_catalog.py:31-159`) | TESPL (P1–P14) | Meridian evaluator |
|---|---|---|---|
| Intake / dedupe / threading | P1 Assignment, P9 Dedupe & Merge | P1 Intake & Threading | `assignment`, `dedupe` |
| Ownership / rotation | P2 Rotation & Ownership, P17 Broker Reg | P2 Buyer Ownership | `rotation` |
| Dialogue / engagement scope | P3 First-Touch, P4 Channel, P5 Missed-call, P6 3×3×3 | P3 Buyer Dialogue Scope | `first_touch` |
| AI governance (HITL) | **P7 AI Governance**, P10 AI Scope | **P7 AI Governance**, P9 External Commitments | `governance`, `ai_scope` |
| Spec / data fidelity | P8 Qualification, P13 DND | P4 SRF Fidelity, P5 Master Governance | (advisory) |
| Costing / pricing | P11 Offer & Discount | P6 Costing Formula, P8 Margin Floor | (advisory) |
| Quote / commitments | — | P10 Quote Validity, P9 External Commitments | (advisory) |
| Monitoring / re-cost | P16 Stalled-Deal | P12 Exposure Watch & Re-cost | (advisory) |
| Audit & learning | P12 Audit | P13 Audit & Learning | `audit` |
| SLA / attention budget | P14 SLA & Reminders, P15 Follow-up | P14 SLA & Attention Budget | `sla` |

**The one critical gap to close: versioning.** `treppan-backend §3` is explicit: *"no explicit policy version column — mutability is via in-place edit + `updated_at`/`deleted_at` soft-delete."* `FRAMEWORK/08 §6.3` and `FRAMEWORK/06 §1` *require* a **versioned policy catalog** ("Policies versioned, authored centrally; units/employees inherit and may only **narrow, never widen**"). Meridian's current `governance/policy.py` covers least-privilege + deploy-gate only and has **"no policy catalog, no policy versioning, no policy memories, no per-action runtime authorization"** (`current-build` GAPS). So the build is:

- **Adopt Treppan's `Policy` table** (`db/models/workflow/policy.py`: `enabled, rule, config JSONB, applies_to, evaluator_key, metric_key, lever`) **plus a `version` integer and an immutable `policy_versions` history table** (Treppan already versions `ai_tools` this way — copy that pattern). Each `WorkflowExecution`/audit record pins the `policy_version` it evaluated against → replay is exact.
- **Inheritance:** a unit/employee policy may only *narrow* the centrally-authored version (Meridian's `governance/policy.py` already does wildcard-aware narrowing for scopes; extend the same conflict-detection to policy config thresholds).
- **Three runtime outcomes** unify Treppan's seven effects into Meridian's existing `PolicyVerdict` (`FRAMEWORK/06 §1`): `allow` (execute + audit) · `require-approval` (route to human gate) · `deny` (block + audit). Treppan's `flag/route/schedule/noted` collapse into `allow`-with-annotation; `require_approval/block` map to `require-approval/deny`. **A policy that ends in a decision routes it to the accountable human — it never decides it itself.**
- **Per-action authorization (the enforcement step Treppan lacks):** Treppan's runtime engine is advisory ("decisions recorded, never enforced", "P10 returns `block` but is never enforced"). Meridian flips this to **enforced-at-runtime** via `FRAMEWORK/06`'s trust invariant — *nothing executes without authorization* — by having the Agent Runtime call `PolicyEngine.authorize{actor, action, target, data_scope, context}` before any tool/connector invocation. This is the single most important upgrade from Treppan's advisory model to an enterprise-ready one.

---

### 4.6 Typed agent proposals + the one-tap HITL approval queue

**Agent outputs are typed proposals, never committed side-effects** (`FRAMEWORK/08 §6.2`). The commit is a separate step gated by the task's HITL flag. AI Core is **RESPONSIBLE** (does the work); a named human is **ACCOUNTABLE** (owns the decision). This is policy **P7** in both specs — "AI proposes, a human commits."

**What already exists to build on:**
- Treppan surfaces HITL via `WorkflowTask.needs_hitl` + `WorkflowExecution.requires_hitl` (`workflow_execution.py:38`); **25 of 36 tasks are `needs_hitl=True`**. But `treppan-backend §4` is explicit: *"There is no separate approval-queue table/endpoint yet — the closest is the `workflow_executions` list; commit happens through normal lead status/send operations performed by the human."*
- `onyx-meridian` **already has a real approval queue**: `services/approval_service.py` with `ApprovalType ∈ {deploy, decommission, autonomy_promote, budget_override}`, `POST /approvals/{id}/decide`, and an `ApprovalsPage` UI. On approve it re-validates state then executes the parked `_perform_*` (lazy-import).
- The frontend has the **proposal-commit vocabulary fully realized**: `prototype/.../LeadAISpace.tsx` renders every AI output as *proposal + "Why:" rationale + provenance + Accept/Edit/Dismiss triad*; `WorkflowsPage.tsx` already renders `HITL` and `executed_by` badges and per-execution `policy_code / effect / message` decision rows (`treppan-frontend-ux §2, §3`).

**The build — make the one-tap queue a first-class surface** (`FRAMEWORK/08 §6.2`: *"a first-class surface, not a notification … design every Yes as a single tap, never a form, with the homework already attached"*; TESPL task #30):

1. **Extend Meridian's `ApprovalType`** to add `commit` (a task proposal awaiting human commit) — reusing the existing approve→`_perform` machinery. The parked payload is the typed proposal (the SRF draft, the requote, the suggested reply) + its rationale + provenance.
2. **Every HITL-flagged WorkflowExecution opens an Approval** of type `commit` with the proposal pre-attached — so the human's action is genuinely one tap (Accept) / Edit / Dismiss, matching `LeadAISpace`'s `ActionButton` triad. On Accept, the parked side-effect (status change, outbound send, master edit, booking, price) executes and is audited; on Dismiss, the execution is closed with reason.
3. **The attention budget is measured here** (TESPL P14; `FRAMEWORK/08 §6.5`): time-in-queue per item is "the measure of compression itself." Stamp `opened_at`/`decided_at` on each `commit` approval; the 15-min-per-item budget is a KPI rolled up to Ensure.

Some decisions are **irreducibly human** (TESPL #10 confirm spec & mint POD#, #21 approve price; Treppan #11 Did-Not-Inquire, #32 mark lost) — these are `mode: human` rows where the approval *is* the work, not a gate on AI work.

---

### 4.7 KPI attribution per stage + cost trace per stage

**Effectiveness surface (Ensure-fed).** Treppan's measurement layer is already built and is the template: `policy_service.overview` (`:113-162`) returns per-policy 0–100 effectiveness; `agent_analytics_service.py` returns per-agent KPIs (runs, success rate, avg latency, tokens, total cost, **`cost_per_action` :199**, quality). The required KPI vocabulary (`FRAMEWORK/08 §6.4`) — turnaround, approval rate, **override rate**, rework rate, win rate, SLA adherence — must be attributed **per task/stage**, with two distinct angles: **explainability** ("why did it behave that way?") and **observability** ("it went wrong — do I know why?"). Treppan's per-execution policy-decision rows (`policy_code/effect/message`) are the explainability seed; the immutable `audit_log` (Treppan's INSERT-only RANGE-partitioned-monthly table) + `workflow_executions` are the observability seed.

**Cost trace per stage — the named gap to close.** `FRAMEWORK/08 §6.5` requires a **cost trace per stage transition** ("given 1000 leads, cost to move prospect→qualified") and a **cost-to-automate vs cost-of-human** comparison per piece of operations. Treppan attributes cost **per agent and per lead** (`agent_runs.entity_id → lead`) but `treppan-backend §6` is explicit: *"There is no dedicated 'cost per pipeline stage' roll-up; stage attribution is derivable (run → lead → lifecycle_stage)."* The join already exists — `policy_service._load` (`:237-250`) joins `agent_runs` to lead stage for the AI-scope metric.

The build is a **roll-up materialization**, not new instrumentation:

```
COST TRACE PER STAGE (materialized from runs + executions)

stage transition          AI $    WF+Pol $   Human-min   $/unit   cost-to-automate
                          (model)  (0)        (attn budget)        vs cost-of-human
─────────────────────────────────────────────────────────────────────────────────
under_qual → pre_qual     $0.0312    $0       1.8 min     $0.061   automate ✓ (0.4× human)
pre_qual   → warm         $0.0090    $0       4.1 min     $0.140   review (cost ~ human)
warm       → hot          $0.0044    $0       9.0 min     $0.310   keep human (HITL heavy)
```

- **Source:** Meridian's per-run `CostEvent` (already an atomic per-run cost record, `current-build §1`) + `WorkflowExecution.task.state` give cost-per-run-per-stage; sum over a cohort (the "1000 leads") gives the transition cost. Treppan's `MODEL_PRICING` (`agent_catalog.py:50-54`) and `WorkflowEngine._simulate_agent_run` cost arithmetic (`cost = itok/1000*pin + otok/1000*pout`, `:130-134`) are reused verbatim by Meridian's `gateway/model_gateway.py::cost_usd()`.
- **Human side:** the `commit`-approval time-in-queue (§4.6) is the human-minutes per transition; priced at a configurable loaded labor rate gives **cost-of-human**, set side-by-side with cost-to-automate per `FRAMEWORK/08 §6.5`.
- **Surface:** the frontend `AgentTable`/`PolicyTable`/`KpiCard` components (`treppan-frontend-ux §4, §5`) already render `total_cost`, `cost_per_action` (4-decimal `$0.0000`), and score-bars; a new **"Cost trace per stage"** widget reuses `KpiCard` + the backend-driven ECharts `ChartSpec.echarts_option` contract (new chart types need no frontend code). This feeds Prism / the Digital Twin.

---

### 4.8 The automation dial / human fallback

`FRAMEWORK/08 §6.6` — the reconciliation that makes the whole thing reversible:

```
more automation ◀──────────────────────────────────────────▶ more human
 AI Agent (autonomous) · AI Agent (HITL) · Workflow+Policy · Human-responsible
    L3 Autonomous          L2/L1                               L0 (assign to person)
```

- The dial is **adjustable per task, continuously, without re-architecting** — and Treppan already proves the mechanism: editing a task's `needs_hitl` flag or `executed_by` mode in the CRUD UI changes engine behaviour immediately (`treppan-backend §7`). Flipping `mode: ai → human` turns the row into "assign to a person; human acts and updates the record" — **same state machine, fewer model calls.** An entire unit can revert to human-centered operation (design principle #10).
- **This same dial IS the progressive-autonomy ladder** (`FRAMEWORK/06 §6, 08 §6.6`): `Shadow → Assist → Supervised → Autonomous`. Meridian has already shipped this ladder: `domain/lifecycle.py::AUTONOMY_LADDER` with single-step `next_autonomy`/`prev_autonomy`, deploy always resets to SHADOW, and promotion requires `eval_passed`. The per-(employee × task-type × data-scope) autonomy field is `Employee.per_task_autonomy` (stored today, "carries no behavior" — `current-build` GAPS). **Flow is where it gets behavior:** the dispatcher reads `per_task_autonomy[task.type][data_scope]` to decide whether an AI task's proposal auto-commits (Autonomous), opens a `commit` approval (Assist/Supervised), or only records a proposal without acting (Shadow). Drift (from Ensure evals) auto-demotes; the existing kill-switch suspends instantly.

---

### 4.9 Worked example A — CRM lead lifecycle (the live proof, ~June 30)

Event `lead.created` fires on `lead_id = L-4471` (correlation id). The durable Flow run dispatches the `under_qualification`-stage tasks in `sort_order` — exactly Treppan's `_dispatch`, now durable:

```
WorkflowRun(corr=L-4471, state=under_qualification)
  #1 Capture & dedupe      mode=workflow_policy  P1,P9    hitl=N  → dedupe verdict: allow      cost $0
  #2 Auto-assign owner     mode=workflow_policy  P1,P2    hitl=N  → assignment: route→owner_77 cost $0
       └─ time_to_assign_p50 KPI stamped; durable timer armed: rotation 60min (P2 config)
  #3 First-touch AI call    mode=ai effort=Med   P3,P7,P10 hitl=Y → agent first_touch_agent
       └─ adapter run: 1,240 in / 380 out tok, gpt tier → cost $0.0312 (gateway priced)
       └─ P10 ai_scope (prospect_only=true): allow (lead is prospect)
       └─ P7 governance (require_approval_outbound=true): require-approval
       └─ Approval(type=commit) opened, proposal = drafted call/WhatsApp + "Why:" rationale + provenance
  #25 SLA timer            mode=workflow        P14 sla_hours=24    → durable timer armed
  #27 Audit log            mode=workflow        P12               → audit_ledger append
```

Human caretaker sees one `commit` card in the queue (the `LeadAISpace` Accept/Edit/Dismiss triad), taps **Accept** → the outbound send executes and is audited; time-in-queue (1.8 min) is recorded as the attention-budget KPI. Later, the **rotation timer** (newly durable in Meridian; modeled-but-inert in Treppan) fires `lead.unclaimed` → re-assignment. Cost trace for `under_qual → pre_qual` rolls up `$0.0312` model + `1.8 min` human across the L-4471 cohort. If the caretaker finds first-touch quality poor, they flip task #3 `mode: ai → human` (the dial) — same state machine, model cost drops to $0.

### 4.10 Worked example B — TESPL Request-to-Quote (the harder blueprint)

Correlation id = **POD#** (minted at S3, the workflow id for everything downstream — including the post-Quote-Sent watch loop). The two-rows-on-purpose costing boundary is the canonical cost lesson:

```
S3 SRF Confirmed
  #10 Review & confirm · mint POD#   mode=human          P7,P1   hitl=the decision  → POD# minted (durable run keyed)
  #11 Fan out workstreams            mode=workflow        —      hitl=N  → deterministic fan-out, cost $0
S5 Costing Built
  #16 Compute costing from masters   mode=workflow        P6     hitl=N  → formula eval, NO MODEL, cost $0
  #17 Resolve process/consumption    mode=ai effort=High  P6,P7  hitl=one tap → Costing Agent proposal, cost $$
       └─ DO NOT collapse #16 and #17 — the boundary is exactly "is intelligence required?"
S6 Pricing Approved
  #20 Propose margin & price         mode=workflow_policy  P8    hitl=N  → margin-floor verdict (no model)
  #21 Approve the price              mode=human            P8,P7 hitl=the decision  → one-tap commit
S7 Quote Sent
  #23 Arm the exposure map           mode=workflow         P12   hitl=N  → durable watch armed (timer)
Quote Live (SAME workflow continuing — Focus 2 watch loop)
  #24 Sense & re-cost on input moves mode=workflow_policy  P11,P12 hitl=N → durable timer + rate-staleness rule
  #25 Draft requote + recommendation mode=ai effort=Med    P8,P12 hitl=the decision → Margin-Protection proposal
```

This proves the durable-timer requirement: **#23 arms a watch and #24 re-costs on a threshold cross — the same workflow continuing past Quote Sent, with no separate monitoring subsystem** (`specs` design note; `FRAMEWORK/08 §6.7`). Treppan's synchronous engine cannot do this; Meridian's durable Flow can. P8 margin-floor on #20/#21 and P10 quote-versioning are `workflow_policy` (free, rule-driven) — model spend is reserved only for #17 (resolve ambiguity) and #25 (draft requote), the two rows where judgement is genuinely required.

---

### 4.11 Build sequence & what we explicitly reuse vs build

| # | Work item | Build on (already shipped) | Net-new |
|---|---|---|---|
| F1 | `WorkflowRun` durable state + correlation-id keying | `domain/task_lifecycle.py`, event_service bus | run record + replay |
| F2 | Flow dispatcher consumes the event bus | Treppan `WorkflowEngine._dispatch` design; Meridian `event_service` (inert today) | the consumer + safety wrapper |
| F3 | Durable timer scheduler (cadence/SLA/stall/escalation) | `task_service.escalate_due` idempotent sweep | timed-trigger firing |
| F4 | Workflow definition manifest + DB model + CRUD | Treppan `workflow_catalog.py`, `workflow_task.py`, `routers/v1/workflow.py` | `accountable` + `kpi` fields, `effort` tag |
| F5 | Versioned policy catalog + per-action runtime authz | Treppan `policy.py`/`policy_engine.py`; Meridian `governance/policy.py` `PolicyVerdict` | `version` col + `policy_versions` history; enforcement |
| F6 | Policy memories (effectiveness 0–100 + brain) | Treppan `policy_service.py` `DeterministicPolicyBrain` (Claude-brain seam) | wire to Ensure |
| F7 | `commit` approval type + one-tap queue | Meridian `approval_service.py` + `ApprovalsPage`; `LeadAISpace.tsx` triad | proposal payload + attention-budget stamps |
| F8 | Cost trace per stage roll-up | Treppan `MODEL_PRICING` + cost math; Meridian `CostEvent`, `gateway.cost_usd()` | stage roll-up + cost-to-automate-vs-human |
| F9 | Automation dial wiring per task | Meridian `AUTONOMY_LADDER`, `per_task_autonomy` (inert today) | dispatcher reads it to gate auto-commit |

**Files this section builds on (absolute):** `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/domain/task_lifecycle.py`, `governance/policy.py`, `gateway/model_gateway.py`, `services/{event,approval,audit,run,task,dashboard}_service.py`, `adapters/{base,registry}.py`, `routes/api.py`; and (as design blueprints to port, not re-run) `/Users/palivelasrihari/onyx_all/Treppan_CRM/backend/services/v1/workflow/{workflow_engine,policy_engine,workflow_catalog,workflow_service}.py`, `services/v1/analytics/{policy_catalog,policy_service,agent_catalog,agent_analytics_service}.py`, `db/models/workflow/*.py`, `services/v1/leads/lead_service.py`; frontend `prototype/frontend/src/features/leads/components/LeadAISpace.tsx`, `frontend/src/features/intelligence/components/{AgentTable,PolicyTable}.tsx`, `frontend/src/features/leads/components/LeadKanban.tsx`, and the workflow `WorkflowsPage.tsx`.

I have what I need. Writing the section now.

---

## 5. Flow — Orchestration Engine & Cross-Unit Workflows

Flow is the binding engine of the platform: "the state-machine + task-execution + cross-unit engine ... home of execution-mode delegation, policy-gated tasks, one-tap approval queue, cross-unit workflows" [FRAMEWORK §7]. It is one of the two greenfield accelerators (with Vault) that "turn existing capabilities into an enterprise-ready, governed, cost-controlled platform rather than a set of demos" [FRAMEWORK §9]. This section specifies what to build, what already exists to build on, and how the two prior workflow attempts (treppan's in-process advisory engine; the TESPL Temporal blueprint) collapse into one design.

### 5.0 The honest starting point — three workflow attempts, one synthesis

We are not designing from zero. There are three concrete reference points, and Flow is their reconciliation:

| Reference | Orchestration model | What it proves | What it lacks |
|---|---|---|---|
| **treppan-backend** `WorkflowEngine` | Synchronous, in-process, advisory dispatcher fired post-commit from `LeadService._run_engine` | Data-driven workflow defs (stages/tasks/triggers/policies as DB rows, admin-editable); execution-mode routing (`executed_by ∈ {workflow,ai,human,hybrid}`); policy decisions logged per execution; `_simulate_agent_run` cost metering | Only 2 of 33 triggers live (`lead.created`, `lead.status_changed`); no scheduler, so cadence/SLA/stall tasks are data-only; no durability/replay; single-tenant single-process; never cross-unit |
| **TESPL RTQ spec** | "Temporal is the spine ... POD# is the workflow id / correlation key" [specs] | The full target contract: 7 states + 3 branch tracks, 31 tasks, 3 execution modes, P1–P14, one-tap approval queue, exposure-watch loop, dynamic-SRF resolver | A spec, not code |
| **onyx-meridian (current)** | Event bus emitted but **"consumed by nothing — no triggers, reminders, workflows"** [current-build §4]; escalation sweep is a manual `POST` | A clean canonical Event signal (`event_service.emit`), a Task Registry that emits domain events on every mutation, an Approval queue, an append-only audit ledger | No Flow engine at all (explicit GAP) |

Flow is **treppan's editable, data-driven, execution-mode-routed, policy-gated design — re-implemented as a durable engine that consumes the meridian Event bus and spans units.** treppan already validated that a workflow is best modeled as relational data (`workflow → stages → tasks → triggers → policies`) edited at runtime, and that the engine should read the DB, never the catalog module [treppan §7]. We keep that. What treppan got wrong for an enterprise platform — synchronous, in-process, no durability, no scheduler, no cross-unit, advisory-only — is exactly what Flow fixes.

### 5.1 What already exists in onyx-meridian that Flow consumes (do not rebuild)

Flow is not greenfield-from-nothing; three meridian seams already produce the signals Flow needs. The current gap is that **nothing consumes them**.

```
ALREADY SHIPPED (current-build)                          FLOW BUILDS (this section)
─────────────────────────────────────                   ──────────────────────────────
event_service.emit(type, entity_type,                    ┌──────────────────────────┐
  entity_id, unit_id, payload) ─────────► EVENTS ───────►│  Flow Trigger Matcher      │
   (task.created / .in_progress / .done /  collection    │  (subscribes to EVENTS)    │
    .blocked / .escalated / .escalation_                 └────────────┬─────────────┘
    warning — emitted on every task mutation)                         │ matches event.type
                                                                      ▼
task_service.change_status / reassign / ──► TASKS ◄──────  Flow Activities write back
  add_dependency  (the wedge)               collection    (create/assign/advance Tasks)
                                                                      │
approval_service (deploy / decommission / ─► APPROVALS ◄─  Flow's require-approval verdict
  autonomy_promote / budget_override;       collection    parks a WorkflowInstance + opens
  _perform_* re-validates then executes)                  an Approval (the one-tap queue)
                                                                      │
audit_service.record (append-only) ───────► AUDIT ◄──────  every Flow step → audit_ref
gateway/model_gateway.route + cost_usd ───► COST_EVENTS ◄─  agent-call activities meter here
```

Concretely, the seams (all under `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/`):

- **`services/event_service.py`** — `emit(...)` writes to the `EVENTS` collection (`store.py:230`); `list_events(unit_id, entity_id, type, limit)` reads it. Its own docstring states the intent: *"In the full platform these drive Flow, reminders, and the dashboard; for now they are recorded and queryable."* Flow is the missing consumer.
- **`services/task_service.py`** — already emits `task.created` (`:110`), status events (`:201`, `:236`), `task.escalated` (`:347`), `task.escalation_warning` (`:363`). These are the canonical workflow signals. Flow does **not** re-emit; it subscribes.
- **`schemas/task.py`** — `TaskCreate.delegated_by` (super-agent/person id), `autonomy_at_creation`, `Source{type,doc_id,quote}` provenance, `depends_on`, `Escalation{policy,after_hrs,before_due}`. A Flow activity that creates a commitment populates these fields; the Task Registry **is** Flow's durable work record.
- **`services/approval_service.py`** — the parked-action pattern (`_perform_*` re-validates state then executes on approve) is exactly the HITL gate Flow needs. Flow's `require-approval` verdict reuses this queue; we add `ApprovalType.workflow_step`.
- **`domain/task_lifecycle.py`** — the task state machine + DONE-blocked-until-dependencies-done + DFS cycle detection. Flow's deterministic activities call these; they are not duplicated.

The escalation sweep (`escalate_due`, idempotent, exposed at `POST /units/{id}/tasks/escalate`) is the **only piece of time-driven orchestration that exists today** — and it must be triggered manually. Flow replaces the manual POST with a durable timer (§5.5).

### 5.2 Build vs Temporal vs lightweight — recommendation

The TESPL spec names Temporal; the customer's non-negotiables (on-prem, open-source-first, own-the-IP, no vendor lock-in, transfer ownership) [Fakhruddin] constrain the choice hard.

| Option | Durability/replay | On-prem & OSS | Fits current stack (FastAPI + Mongo/in-mem, zero-infra boot) | Ownership / lock-in | Verdict |
|---|---|---|---|---|---|
| **Temporal (self-hosted)** | Best-in-class (event-sourced, deterministic replay, timers, signals) | OSS, self-hostable | Heavy: needs Temporal server + its own persistence (Cassandra/Postgres) + Go-ish worker model; breaks "boots with zero infrastructure" [current-build] | Self-hosted = owned, but operationally large; a Temporal cluster is a system to run | **Defer.** Right answer at org-wide scale (P3/BEYOND), wrong answer for the Oct-2026 V1 pilot |
| **Buy/hosted (Temporal Cloud, etc.)** | Best | ✗ data leaves boundary | n/a | Violates "data stays internal" + lock-in | **Reject** |
| **treppan-style synchronous in-process** | None (advisory, post-commit, best-effort) | ✓ | ✓ trivially | ✓ | **Reject as the engine** — no durability/replay/timers; treppan itself couldn't fire 31 of 33 triggers for this reason |
| **★ Lightweight durable engine on the existing Store + Event bus** | Sufficient: persisted `WorkflowInstance` state machine + replayable `StepRecord` log + a timer collection swept by a worker loop | ✓ pure-Python, no new infra; Mongo when set, in-memory fallback preserved | ✓ extends `services/store.py` and the existing async services | ✓ fully owned, ~1.5k LOC, no dependency | **Recommend for V1** |

**Recommendation: build a lightweight durable engine now, behind an interface that Temporal can back later.** Define `FlowRuntime` as a Protocol (mirroring how `services/store.py` already abstracts `Store` with InMemory/Mongo backends). The V1 implementation, `StoreFlowRuntime`, persists instance state to the existing Store and is swept by an async worker. If org-wide scale demands it in P3, a `TemporalFlowRuntime` implements the same Protocol — workflow *definitions* (declarative data, §5.3) and *activity contracts* (§5.4) do not change. This mirrors the dossier's sequencing: "P1 Pilot ... P3 Org-wide (Flow ...)" [FRAMEWORK §10] — durable-enough now, durable-at-scale later, no rewrite of definitions.

> **Trust invariant carried into Flow:** *"Nothing executes without authorization; nothing happens without a record"* [FRAMEWORK §8]. Every Flow activity calls Vault's Policy Engine before acting and writes an `audit_ref`. Flow is the *caller* of governance, never a bypass — exactly as the TESPL super-agent "assigns but does not bypass governance."

### 5.3 Declarative workflow definitions (relational data, admin-editable)

Adopt treppan's proven shape — `workflow → stages → tasks → triggers → policies` as data the engine reads, with the catalog as seed-only [treppan §1, §7] — and extend it for cross-unit and durability. New schemas under `meridian/schemas/flow/`, new collections in `store.py`.

```
WorkflowDef (collection: workflow_defs)              ── the "BPMN as data"
  key            "rtq.request_to_quote"              ── stable id, version-pinned
  version        int                                 ── new version on edit (treppan lacked
                                                        policy versioning; FRAMEWORK §6.3
                                                        mandates a *versioned* catalog)
  scope          "cross_unit" | "unit"
  correlation    "pod_number" | "lead_id" | ...      ── = the instance id (TESPL: "POD#
                                                        is the workflow id")
  states[]       StateDef{code, name, kind:           ── canonical(S1..S7) | branch | loop
                   canonical|branch|loop, sla_hrs}
  transitions[]  {from, to, guard?}                   ── forward-only except re-entrant/loop
  tasks[]        TaskDef (see below)
  triggers[]     TriggerDef{event_type, on_state}     ── binds an Event-bus type to a step

TaskDef                                               ── treppan's six attachments [FW §6]
  seq, state, name
  execution_mode  deterministic | workflow_policy      ── THE COST LEVER
                  | agent_call | human
  effort          low | med | high                     ── sizes model tier/token budget
  agent_ref       archetype.key | employee_id          ── for agent_call
  policies[]      ["P7","P8"]                           ── governance bindings
  needs_hitl      bool                                  ── trust/safety
  accountable     role|person ref                       ── accountability
  kpis[]          ["turnaround","override_rate"]        ── effectiveness (Ensure consumes)
  routed_unit     unit_id | "$origin"                   ── CROSS-UNIT: which unit owns step
```

This is treppan's `WorkflowTask` (`executed_by`, `trigger_id`, `needs_hitl`, `agent_config_id`, `policies` via `task_policies`) lifted to the platform, with two additions treppan lacked: **`version`** on the definition (FRAMEWORK §6.3 demands a versioned policy/workflow catalog; treppan only had in-place edit + `updated_at`) and **`routed_unit`** for cross-unit fan-out. The CRM lead lifecycle ports near-1:1 — treppan's 5 product stages, 36 tasks, and P1–P17 become a seeded `WorkflowDef("crm.lead_lifecycle")`; the TESPL RTQ becomes `WorkflowDef("rtq.request_to_quote")` with 7 states, 3 branches, 31 tasks, P1–P14.

**Editability is preserved as the design point** [treppan §7]: catalog is seed-only; once seeded, definitions are edited via CRUD and the engine reads the DB. Editing a policy threshold or a task's HITL flag changes engine behavior on the next instance.

### 5.4 The three activity types

Every TaskDef runs in **exactly one** mode — "choose the cheapest sufficient mode; don't spend a model where a rule or code suffices" [FRAMEWORK §6.1]. The canonical rule: **do not collapse the modes** — TESPL costing is two rows on purpose (#16 compute-from-masters = deterministic; #17 resolve-ambiguous-choices = agent). Flow enforces this by typing the activity.

| Activity type | Decides via | Model cost | Implementation in Flow | Maps to (treppan / TESPL) |
|---|---|---|---|---|
| **Deterministic activity** | no judgement | none | pure Python over the Store: mint correlation id, fan-out tasks, evaluate a costing formula, arm a watch, write audit. Idempotent + replayable. | treppan `executed_by="workflow"`; TESPL #11/#16/#23/#31 |
| **Policy-query activity** | rule-driven | none | calls **Vault Policy Engine** (`governance/policy.py`, extended per FRAMEWORK §6.3) with `{actor, action, target, data_scope, context}`; verdict `allow / require-approval / deny`. `require-approval` parks the instance + opens an Approval. | treppan policy-bound tasks + `PolicyEngine.evaluate`; TESPL "Workflow + Policy" (P1–P14) |
| **Agent-call activity** | model judgement | model cost (effort-sized) | dispatches to an **AI Employee via the adapter contract** (`adapters/base.py`); returns a **typed proposal, never a committed side-effect**; meters via `gateway/model_gateway.route`+`cost_usd` → `COST_EVENTS`. Commit is a separate HITL step. | treppan `executed_by="ai"` + `_simulate_agent_run`; TESPL "AI Agent · effort" |
| *(human)* | person acts | none | parks the instance; the work surfaces in the approval/triage queue; resumes on human action. | treppan `executed_by="human"`; TESPL pure-Human rows #10/#21 |

Critically, the agent-call activity is where Flow **finally gives meridian's `echo`-only adapter contract real work to do**. Today "only the `echo` adapter exists ... no real agent runtime" [current-build GAP]. Flow's agent-call activity is the call site; the adapter registry (`adapters/registry.py`) is where lms-onyx's `streaming_controller.py` runtime [reuse-map] plugs in later. treppan proved the seam with simulation (`_simulate_agent_run` produces token/cost numbers with no real LLM call); Flow keeps the simulation as the default until a real adapter is registered, so the engine is testable end-to-end on day one.

### 5.5 Durability, idempotency, replay, and timers

The lightweight engine gets durability from three persisted structures (new collections), not from Temporal's event-sourcing:

```
WorkflowInstance (collection: flow_instances)
  id              = correlation value (pod_number / lead_id)  ── one instance per business id
  def_key, def_version
  status          running | waiting_approval | waiting_timer | done | failed | cancelled
  current_states[]                              ── list, because branches run in parallel (S4 fan-out)
  context         {}                            ── canonical facts threaded across steps
  cursor          last completed seq

StepRecord (collection: flow_steps)             ── append-only, the replay log
  instance_id, seq, task_key, execution_mode
  idempotency_key = sha256(instance_id|task_key|input_hash)   ── dedupe re-delivery
  status          pending | done | failed | skipped
  proposal        {}        ── for agent_call (the typed proposal awaiting commit)
  policy_verdict  {}        ── for policy_query
  audit_ref, cost_event_ref

Timer (collection: flow_timers)                 ── replaces treppan's missing scheduler
  instance_id, fire_at, kind: sla|cadence|stall|watch_recost
  status pending | fired | cancelled
```

- **Idempotency:** each step's `idempotency_key` is checked before execution; a re-delivered event or a worker restart that re-processes finds the existing `done` StepRecord and skips. This is the discipline treppan's advisory engine never needed (it never retried) but a durable engine must have.
- **Replay:** an instance's state is reconstructable by folding its `flow_steps` over the `WorkflowDef` — the same property that lets a `TemporalFlowRuntime` drop in later. Deterministic and policy-query activities are pure/replayable by construction; agent-call activities are **not** replayed (model outputs aren't deterministic), so their proposal is persisted in the StepRecord and reused on replay rather than re-invoked — this is why agent outputs are *typed proposals stored as data*, not side-effects.
- **Timers solve treppan's biggest gap.** treppan defined 3×3×3 cadence, 48h stall, SLA timers, missed-call-60s as data but "there is no scheduler, so time-based tasks ... are not autonomously executed" [treppan §7]. Flow runs one async worker loop (the same pattern as meridian's existing manual `escalate_due` sweep, now automated): poll `flow_timers` where `fire_at ≤ now AND status=pending`, emit the corresponding Event, mark fired. SLA (P14), cadence (P6/P15), stalled-deal (P16), and exposure-watch re-cost (P12) all become live. The worker is the single net-new infra component, and it is just an `asyncio` task — no Celery, no APScheduler (treppan deliberately avoided these; we keep that posture).

### 5.6 Event-driven triggers from the canonical Event bus

Flow's entry point is the **Trigger Matcher**, a consumer of `EVENTS`. treppan's engine had only two live `event_key`s; Flow generalizes by subscribing to the bus and matching `event.type` against every active `WorkflowDef.triggers[]`.

```
event_service.emit(type="task.done", entity_type="task",
                   entity_id=T, unit_id=U, payload={...})
        │  writes EVENTS
        ▼
Flow Trigger Matcher  (async consumer; in-memory tail of EVENTS,
        │              or Mongo change-stream when MONGO_DB_URL set)
        ├─ find WorkflowDefs whose triggers[].event_type == "task.done"
        ├─ resolve / create WorkflowInstance by correlation id
        └─ advance: run next TaskDef → activity dispatch (§5.4)
                       │
                       ├ deterministic → write Task(s)/state, audit
                       ├ policy_query  → Vault verdict; require-approval → park
                       ├ agent_call    → adapter → typed proposal → (HITL) → park
                       └ human         → park; resume on human action
```

Two consumer implementations behind one interface: in-memory (default, zero-infra — a `asyncio.Queue` fed by `event_service.emit`) and Mongo change-stream (when `MONGO_DB_URL` is set). This preserves the current-build promise that the service "boots with zero infrastructure (in-memory store fallback)."

The full trigger vocabulary is already half-modeled: treppan's 33 named triggers (`call.unanswered`, `cadence.exhausted`, `meeting.confirmed`, `booking.deposit`, etc.) become `TriggerDef` rows; the ~31 that were "awaiting integrations/cron" in treppan go live as connectors (§ the Integration layer) and the Flow timer worker fill them in.

### 5.7 Cross-unit workflows (the RTQ proof, spanning Sales → Costing/Finance → Legal → Ops)

This is the capability no prior attempt had — treppan was single-domain (leads), TESPL specified it but as a Temporal blueprint. Flow makes it real because **`AIEmployee` is a peer of `Person` and routing works identically for both** [FRAMEWORK §3], and because the Task Registry already validates an owner against a unit.

A cross-unit `WorkflowDef` carries `scope="cross_unit"`; each TaskDef's `routed_unit` names the unit that owns that step. When Flow advances into a step in a different unit, the deterministic "fan-out" activity creates a **Task in the target unit** (`task_service.create` with `delegated_by` = the workflow's super-agent, `source` = the originating Document, `autonomy_at_creation` from the routed employee). The commitment graph (`depends_on`) encodes the cross-unit handoff; meridian's existing same-unit dependency constraint is relaxed to *same-instance* for cross-unit defs (cycle detection retained).

RTQ mapped onto units (POD# = `correlation` = instance id):

```
ENQUIRY ──► S1 Enquiry      [Sales/Client Service]   #1 capture(det) #2 assign(policy:P2)
            S2 SRF Drafted  [Merchandising]          #6 draft SRF(agent:High) #7 ask gaps(agent→HITL:P7)
            S3 SRF Confirmed[Merchandising]          #10 confirm·mint POD#(HUMAN:P7) ──► fan-out
                                                          │ deterministic fan-out → parallel Tasks:
            S4 Development   [Technical/Product Dev]  #12 tech pack(agent:High,HITL) #14 sample(hybrid)
            S5 Costing Built [Costing/FINANCE]        #16 compute(DET) #17 resolve(agent:High,HITL:P6·P7)
            S6 Pricing Apprd [Management/FINANCE]     #20 propose margin(policy:P8) #21 approve(HUMAN:P8·P7)
            S7 Quote Sent    [Client Service + LEGAL] #22 compose(agent→HITL:P10·P7) #23 arm watch(DET:P12)
                                                          └─ LEGAL gate: contract/validity policy check
   QUOTE LIVE (same instance continues) [Costing/Mgmt] #24 re-cost on input move(policy:P11·P12, timer)
                                                        #25 requote(agent,HITL) #27 issue revised(hybrid)
```

Three load-bearing points, all from the spec:

1. **The S4 fan-out is one deterministic activity emitting N parallel branch Tasks across units** — `WorkflowInstance.current_states` is a *list* precisely to hold parallel development/costing/legal branches, which rejoin at S6/S7. TESPL #11 "Fan out parallel workstreams" is a Deterministic Workflow row; we honor that.
2. **Quote Live is the same workflow instance continuing past Quote Sent**, not a new monitoring subsystem [specs key-design-notes]. The exposure-watch armed at #23 sets a `flow_timers` row (`kind=watch_recost`); a rate-currency event (P11) or threshold breach fires it, re-entering the instance at #24. "Monitoring is not a separate subsystem."
3. **Every cross-unit step still passes through Vault** at its own autonomy level — the super-agent assigns but does not bypass governance [specs, FRAMEWORK §4.2]. A Finance step a Sales-origin instance routes into is authorized against the *routed unit's* scopes and the *routed employee's* permissions (deny-by-default, narrow-not-widen [FRAMEWORK §8]).

### 5.8 The one-tap approval queue (Flow ↔ Approvals)

"The one-tap approval queue is a first-class surface, not a notification ... design every Yes as a single tap with the homework already attached" [FRAMEWORK §6.2, specs #30]. Flow does not build a new queue — it **routes into meridian's existing `approval_service`**, which already has the exact parked-action pattern (`_perform_*` re-validates state then executes on approve).

- Add `ApprovalType.workflow_step` to `schemas/approval.py`.
- When a policy-query verdict is `require-approval`, or a TaskDef has `needs_hitl=true`, Flow sets `WorkflowInstance.status = waiting_approval`, persists the agent's **typed proposal** in the StepRecord, and opens an Approval whose payload carries the homework: the proposal, the policy that triggered it, the source provenance, and the diff. On `POST /approvals/{id}/decide(approve)`, Flow's resume handler (registered like the current `_perform_deploy`) commits the proposal, advances the instance, and audits. One tap.
- The **human-attention budget** (P14, "15-min-per-item ... the measure of compression itself" [FRAMEWORK §6.5]) is measured as time-in-queue: `Approval.created_at → decided_at` per workflow_step, rolled up by unit. This is a new metric Ensure consumes; the data already exists on the Approval record.

treppan's lesson here: it had **no separate approval-queue table** — "commit happens through normal lead status/send operations" and the closest surface was the `workflow_executions` list [treppan §4]. Flow corrects this by reusing meridian's real Approval queue as the single commit surface, satisfying the spec's "first-class surface, not a notification" requirement that treppan could only approximate.

### 5.9 What Flow emits back — closing the loop to Ensure, Prism, and the Twin

Flow is a producer as well as a consumer. Each step writes: an `audit_ref` (Vault ledger), a `CostEvent` for agent-call activities (feeding cost-trace-per-stage, FRAMEWORK §6.5 — treppan's `agent_runs.cost_usd` + `cost_per_action` is the proven shape), and a domain Event on state transition (e.g. `flow.state_changed`, `flow.step_committed`). The cost-trace-per-stage-transition that the framework demands ("given 1000 leads, cost to move prospect→qualified") is computable directly from `flow_steps` joined to `cost_events` grouped by `(def_key, from_state, to_state)` — derivable from Flow's own records, which treppan could only approximate per-agent.

### 5.10 Build sequence (fits the bi-weekly cadence, V1 by Oct 2026)

| Milestone | Deliverable | Builds on |
|---|---|---|
| **F0** | `FlowRuntime` Protocol + `StoreFlowRuntime`; `WorkflowDef`/`Instance`/`StepRecord`/`Timer` schemas + collections; deterministic + human activities | `services/store.py` Protocol pattern; `task_service`, `event_service` |
| **F1** | Trigger Matcher consuming `EVENTS` (in-memory); policy-query activity calling Vault; resume-on-Approval via `approval_service` (`ApprovalType.workflow_step`) | existing Event bus, Approval parked-action pattern |
| **F2** | Timer worker (SLA/cadence/stall/watch); seed `crm.lead_lifecycle` def from treppan catalog → first live single-unit instance | treppan's seedable catalog shape; existing `escalate_due` sweep pattern |
| **F3** | Agent-call activity via adapter contract (simulated, then first real adapter from lms-onyx `streaming_controller`); cost metering to `COST_EVENTS` | `adapters/registry.py`, `model_gateway`; treppan `_simulate_agent_run` |
| **F4** | Cross-unit `rtq.request_to_quote` def (Sales→Costing→Legal→Ops), parallel S4 fan-out, Quote-Live re-entry; cost-trace-per-stage rollups to Prism/Ensure | F0–F3; canonical `AIEmployee`-peer-of-`Person` routing |
| **(P3)** | `TemporalFlowRuntime` behind the same Protocol — only if org-wide scale demands it; definitions/activities unchanged | F0 interface |

**Net:** Flow reuses treppan's *design* (workflow-as-data, execution-mode routing, policy-gated tasks, editable catalog), meridian's *seams* (Event bus, Task Registry, Approval queue, audit ledger, cost meter, adapter contract), and the TESPL *contract* (states/tasks/modes/policies/POD#-as-instance-id, one-tap queue, exposure-watch loop), implemented as a lightweight durable engine that boots with zero infrastructure today and can be re-backed by Temporal at org scale without touching a single workflow definition.

I have all the grounding I need. Writing the section now.

---

## 6. AI Employees, Business Units & Super-Agents

This section specifies the **digital workforce** layer — the L5/L6 actors and the L4-governed teams they belong to. It builds directly on what `onyx-meridian` (v0.3.0) has already shipped: a working AI-employee **registry + lifecycle state machine + agent identity + HITL gating + unit dashboard + admin console**. The work here is to (a) make the *anatomy* complete (memory, context bindings, model policy actually wired), (b) make *tiers behavioral* (T4 super-agents), (c) make the *unit* a first-class governed team object with a charter/KPIs/staffing plan, and (d) ship the *rollout play* as an operable lifecycle. We do **not** rebuild the lifecycle, the policy-gated transitions, the credential issuance, or the in-memory/Mongo store — all of those are shipped and tested.

### 6.0 What is already shipped (the floor we build on)

| Capability | Shipped artifact (absolute path) | Status |
|---|---|---|
| Employee anatomy schema | `meridian/schemas/employee.py` — `EmployeeRead` with `Role`, `Permissions`, `Budget`, `Supervision`, `ModelPolicy`, `tier`, `autonomy`, `per_task_autonomy`, `context_bindings`, `principal_id`, `spent_usd`, `version` | Complete model; some fields inert |
| Lifecycle state machine | `meridian/domain/lifecycle.py` — `ALLOWED_TRANSITIONS`, `assert_transition`, `assert_decommissionable`, `next_autonomy`/`prev_autonomy` | Complete, pure, tested (`test_lifecycle`, 6 tests) |
| Lifecycle orchestration | `meridian/services/employee_service.py` — `instantiate / configure / deploy / suspend / resume / promote_autonomy / demote_autonomy / decommission`, each: state check → policy → audit → version bump | Complete; HITL-gated deploy/decommission |
| Autonomy ladder | `meridian/domain/enums.py` — `AutonomyLevel{SHADOW,ASSIST,SUPERVISED,AUTONOMOUS}`, `AUTONOMY_LADDER`; deploy always resets to SHADOW | Complete; promotion trusts `eval_passed` flag |
| Tiers | `enums.py` — `Tier{T1_execution,T2_optimization,T3_planning,T4_superagent}` | **Stored only, zero behavior** |
| Archetype library | `meridian/schemas/archetype.py`, `services/archetype_service.py`; instantiate seeds from archetype (`employee_service.instantiate:80-145`) | Complete CRUD + seeding |
| Agent identity | `meridian/governance/identity.py`, `services/identity_service.py` — `omk_*` token, peppered HMAC hash, one active credential, `issue_for_employee`/`rotate`/`revoke`/`verify` | Complete; scopes **not enforced at runtime** |
| Unit object | `meridian/schemas/unit.py` — `allowed_scopes`, `require_approval_for_deploy/decommission`, `budget_monthly_usd`, `caretaker_user_id`; lifecycle onboarding→active→paused→archived | Thin; no charter/KPIs/staffing |
| Unit dashboard | `services/dashboard_service.py` — `by_status/by_tier/by_autonomy`, spend vs budget, commitment rollup, `stale_employees`, open approvals | Read-only aggregation, not predictive |
| Admin console | `ui/src/pages/{EmployeesPage,EmployeeDetailPage,UnitsPage,ApprovalsPage,DashboardPage}.tsx` | Full lifecycle UI; no memory/tier/super-agent views |

The gaps this section closes (all confirmed in the current-build dossier): tiers carry no behavior; no super-agents; memory is undeclared; `context_bindings`/`model_policy` are stored but unused; decommission "reassign in-flight work" is intent-only; the unit has no charter/KPIs/staffing/connector model; the rollout play is undocumented.

---

### 6.1 AI Employee — completing the atomic actor

The shipped `EmployeeRead` already mirrors `FRAMEWORK/03-ai-employees.md`. Three pieces of the anatomy are declared-but-inert or missing. We add them **as schema extensions on the existing `EmployeeRead`, not a new model**, so the registry/lifecycle/identity machinery keeps working unchanged.

#### 6.1.1 Memory (new) — `meridian/schemas/memory.py` + `services/memory_service.py`

The dossier's anatomy requires three memory scopes; none exist today. Add a per-employee, **scope-governed** memory with no cross-employee reads (enforced by `principal_id` on every read).

```
EmployeeMemory (collection: employee_memory, keyed by employee_id + scope)
├─ short_term   session window; ephemeral; TTL-evicted (carried in adapter run ctx)
├─ long_term    per-employee facts + vector refs  ── "training"
│                 → stored as Pulse (lms-onyx Qdrant) collection `emp::{employee_id}`
└─ episodic     append-only task outcomes (task_id, autonomy_at_run, verdict,
                  override?, cost_usd, eval_score) → the promotion/retrain signal
```

| Memory scope | Backing store | Written by | Read by | Governance |
|---|---|---|---|---|
| short_term | run context (in-proc) | adapter loop | same run | dropped at run end |
| long_term | Qdrant collection `emp::{employee_id}` (reuse `lms-onyx` Qdrant wrapper) | Configure (curated facts) + Ensure (promoted episodes) | Recall step (Pulse), scoped to this employee | no cross-employee read; `data_scopes` filter applied |
| episodic | `employee_memory` collection, `scope="episodic"` | `run_service` on each heartbeat + `task_service` on commit | Ensure evals, Admin Console "History" tab | append-only; feeds promotion gate |

`memory_service` exposes `record_episode(employee_id, episode)`, `recall(employee_id, query, k)` (delegates to Pulse with a hard `filter={"employee_id": id}`), and `promote_to_long_term(employee_id, episode_ids)` (the retraining hook called by Ensure). Episodic write is appended in the existing `run_service` path where `spent_usd` already accumulates — no new dispatch point.

#### 6.1.2 Context bindings — wire the inert field

`context_bindings: list[str]` already exists on the employee and is set at Configure. Today nothing reads it. We make it the **Recall contract**: each entry is a Pulse context-layer id (one of the 7 layers from `FRAMEWORK` L3). At Recall, `memory_service.recall` and Pulse query *only* the bound layers — an employee can't read knowledge it isn't bound to. This is the L4 "ontology polices traversal" rule enforced cheaply at retrieval-filter level.

#### 6.1.3 Model policy — route through the gateway

`ModelPolicy{preferred, allowed}` is stored; the shipped `gateway/model_gateway.py` already does `route(policy, requested_model)` + `cost_usd()`. The missing link: the agent runtime must call `model_gateway.route(emp["model_policy"], requested)` before every model call and reject models not in `allowed`. This is one call inserted at the adapter boundary (see 6.1.4) — the gateway code is shipped, only the call site is new.

#### 6.1.4 The runtime seam (the one greenfield in the actor)

Today only the `echo` adapter ships (`adapters/{base,registry,echo}.py`); there is no plan→act→observe loop. We keep the **adapter contract** and add real adapters behind it — no change to `employee_service` or the lifecycle:

```
EmployeeRuntime.run(employee, task, ctx):
  1. Recall   → memory_service.recall(emp, task)        [Pulse, scoped to context_bindings]
  2. Plan     → adapter.plan(...)                       [model call via model_gateway.route]
  3. Act      → for each step: Vault.policy.authorize({actor=principal_id, action,
                  target, data_scope, autonomy}) → allow | require_approval | deny
  4. Observe  → record Run (shipped) + record_episode(...) [episodic memory]
  budget/autonomy/timeout enforced by runtime before step 3 (Budget shipped; autonomy new)
```

New adapters registered in the shipped `adapters/registry.py`: `lms_onyx_streaming` (wraps `lms-onyx` `controllers/streaming_controller.py` as the canonical agent runtime per the reuse-map), `claude`, `http_webhook`. The autonomy enforcement in step 3 maps the ladder to runtime behavior — this is what finally makes `autonomy` operational beyond a stored label:

| Autonomy | Runtime behavior at the Act step |
|---|---|
| `shadow` | propose only; every Act → Approval queue; nothing commits (matches shipped deploy-resets-to-shadow) |
| `assist` | each Act → `require_approval` via Policy Engine; human commits one-tap |
| `supervised` | Act executes; logged; caretaker can veto within window; reversible |
| `autonomous` | Act executes within policy + budget; audited after |

---

### 6.2 Tiers T1–T4 — making them behavioral

Tiers are stored (`Tier` enum) but, per the dossier, "carry no behavior." We make tier a **model-policy + capability + loop-shape config**, not separate code (matching the framework principle "tier is config, not separate code; T1 can be promoted to T2"):

| Tier | Default model tier (via gateway) | Default capabilities | Loop shape | Promotion path |
|---|---|---|---|---|
| **T1 execution** | cheapest sufficient (internal SLM first) | reminders, status updates, standard reports | single plan→act | re-configure tier → T2 (version bump, no redeploy) |
| **T2 optimization** | small/mid | + anomaly detection, bottleneck spotting | plan→act + reflect | → T3 |
| **T3 planning** | mid/large | + scenario/risk analysis, recommendations | plan→reflect→act | → T4 only via unit super-agent slot |
| **T4 super-agent** | large | + `assign_task`, `monitor_unit`, `escalate` | intake→decompose→assign→monitor→escalate→report | one per unit (6.4) |

A tier change is just a `ConfigureRequest{tier: ...}` (the shipped `configure` already accepts `tier` and version-bumps) plus a tier→model-policy resolver run at configure time. No new lifecycle path.

---

### 6.3 Archetype library — the seedable job catalog

The shipped `ArchetypeCreate` already seeds capabilities/scopes/KPIs/adapter at instantiate. We ship a **starter catalog** (data, not code) so a caretaker hires from a template, mirroring the lifecycle agents already proven in `treppan-backend`'s `agent_catalog.py` and the TESPL/CRM specs. Seeded via a `seed_archetypes.py` (idempotent by `key`, the pattern `treppan` uses in `seed_dev_data.py`):

| Archetype key | Tier | Default action scopes | Default adapter | Source pattern |
|---|---|---|---|---|
| `ops.meeting_scribe` | T1 | `ingest.read`, `task.create` | `lms_onyx_streaming` | shipped ingest + lms-onyx transcription |
| `sales.first_touch` | T2 | `crm.lead.read`, `comms.draft` | `claude` | Treppan First-Touch Agent |
| `sales.quote_drafter` | T3 | `quote.draft`, `master.read` | `claude` | TESPL SRF Drafter / Quote Composer |
| `costing.estimator` | T3 | `costing.read`, `master.read` | `http_webhook` | TESPL Costing Agent (#17) |
| `legal.contract_flagger` | T3 | `doc.read`, `task.create` | `claude` | Fakhruddin Legal pilot dept |
| `unit.superagent` | T4 | `task.assign`, `unit.monitor`, `escalate` | `claude` | super-agent loop (6.4) |

Each archetype's `default_kpis` and `default_data_scopes` are pre-attached so instantiate produces a near-configured employee; the caretaker only narrows scopes (least-privilege check already enforced by `policy.authorize_configuration`).

---

### 6.4 Super-Agent (T4) — the orchestrator (greenfield behavior)

A super-agent is an ordinary AI employee with `tier=T4_superagent`, deployed like any other (same `instantiate→configure→deploy` path, same credential, same audit). What's new is its **loop** and its `task.assign` capability. Per `FRAMEWORK/04`: *the super-agent assigns but does not bypass governance — each assigned employee still passes every action through the Policy Engine at its own autonomy level.*

```
SuperAgentLoop (new: services/superagent_service.py)
  intake     ← new Task in unit OR Event from the bus (events collection, shipped but inert)
  decompose  → split into sub-Tasks (task_service.create_task, provenance = parent task)
  assign     → for each sub-task: pick employee (skill/scope match) →
                 task_service.reassign(owner={ai_employee|person})   [reassign is SHIPPED]
  monitor    → read unit dashboard rollup (shipped) + episodic memory
  escalate   → on overdue/blocked: task_service.escalate_due (SHIPPED, idempotent sweep)
                 → Approval to caretaker (notify_caretaker policy)
  report     → write a digest Document + unit dashboard delta
```

Critical reuse: the four verbs the loop needs are **already shipped** — `task_service.create_task`, `.reassign`, `.add_dependency` (with cycle detection), and `.escalate_due`. The super-agent is a *consumer* of the registry, not a new orchestrator. It does **not** call `_perform_deploy` or grant scopes; assignment is task-ownership only. Its own actions are attributed to its `principal_id` and audited like any employee. The Events bus (`services/event_service.py`, currently "captured but inert") becomes the super-agent's intake trigger — the first consumer of the events collection.

Constraint: **exactly one T4 per unit** (enforced at deploy: `superagent_service.assert_single_superagent(unit_id)` checks no other deployed T4 exists). This realizes "one super-agent per department" from the Fakhruddin brief.

---

### 6.5 AI Business Unit — the governed team

The shipped `Unit` is thin (scopes + budget + caretaker + approval flags). The framework requires a *governed team object*: charter, KPIs/SLAs, knowledge slice, connectors, staffing plan. We **extend `UnitCreate`/`UnitRead`** (additive — existing fields untouched, so `units` CRUD and the dashboard keep working):

```
Unit (extended)
├─ name, status, allowed_scopes, budget_monthly_usd          [SHIPPED]
├─ require_approval_for_deploy/decommission, caretaker        [SHIPPED]
├─ charter        { mandate, scope_boundaries[] }             [NEW]
├─ kpis           [{ key, target, sla_hours }]                [NEW — roll up to twin]
├─ knowledge_slice { context_layer_ids[] }                    [NEW — Pulse binding, scoped]
├─ connectors     [{ key, scopes[], read_only:bool }]         [NEW — narrowed by employees]
└─ staffing_plan  [{ archetype_key, role, target_autonomy }]  [NEW — the hiring plan]
```

Relationships (all enforceable on shipped primitives):

```
                 ┌──────────────── Unit (charter, KPIs, budget) ───────────────┐
                 │                                                              │
        caretaker(≥1, Person)                                          knowledge_slice
                 │                                                       (Pulse layers)
                 ▼                                                              ▼
     ┌── T4 super-agent ──┐   assigns (task ownership)   ┌── N AI employees ──┐
     │  one per unit      │ ───────────────────────────► │ T1..T3, each with  │
     │  intake→...→report │                              │ own principal +    │
     └────────┬───────────┘                              │ autonomy + budget  │
              │ escalate                                 └─────────┬──────────┘
              ▼                                                    │ every Act
        Approval queue (HITL, SHIPPED) ◄────── Policy Engine (Vault) ◄┘
```

- **KPIs/SLAs** reuse the dashboard rollup already shipped (`dashboard_service._task_rollup`: completion_rate, overdue, by_status) plus spend/utilization — these become the unit's KPI feed to the Digital Twin/Prism. SLA breach detection rides the **already-shipped** `task_service.escalate_due` sweep (exposed at `POST /units/{id}/tasks/escalate`).
- **Connectors** are scoped at the unit and *narrowed* (never widened) by each employee's `permissions` — enforced by the existing `policy.authorize_configuration` least-privilege check (`grantable_scopes = unit.allowed_scopes`). We add a connector framework as typed read-only adapters (the dossier notes none exist); the *governance* of them is already in place.
- **Caretaker kill-switch**: the framework requires "kill any employee or the whole unit instantly." Per-employee already works via `employee_service.suspend`. Unit-wide kill = `unit_service.pause_unit(unit_id)` → suspend all deployed employees in the unit (loop over shipped `suspend`) + set unit status `paused`. One new service method, all on shipped transitions.

---

### 6.6 Decommission completion — reassign-in-flight-work (close the shipped gap)

The dossier flags: "`_perform_decommission` reassign is intent-only; open Tasks of the retiring employee are not actually moved." The fix is small and lives in the already-shipped `_perform_decommission` (`employee_service.py:438-468`), which already validates `reassign_to` is a deployed employee:

```python
# after revoke + before status=retired:
if reassign_to:
    open_tasks = await task_service.list_tasks(
        owner_id=emp["id"], status_in=list(OPEN_STATUSES))
    for t in open_tasks:
        await task_service.reassign(t["id"],
            owner={"type": "ai_employee", "id": reassign_to},
            actor="system:decommission")   # reassign is SHIPPED + audited
```

This makes "reassign in-flight tasks, archive audit trail" real, using only shipped `task_service.reassign` and `list_tasks`. No new model.

---

### 6.7 The Unit Rollout Play — operable lifecycle

`FRAMEWORK/04` defines a repeatable play: **Map → Model → Staff → Shadow → Promote → Operate → Optimize**. We make it operable as a checklist driven entirely by shipped endpoints + the 6.x additions:

| Step | Action | Endpoint(s) — ✅ shipped / 🆕 new |
|---|---|---|
| **Map** | inventory the dept's processes & commitments | `POST /ingest/transcript` ✅ → Tasks with provenance |
| **Model** | create unit + charter + KPIs + connectors | `POST /units` ✅ (+charter/kpis fields 🆕) |
| **Staff** | hire from archetypes per staffing plan | `POST /employees` (instantiate) ✅, `seed_archetypes` 🆕 |
| **Shadow** | deploy → all start SHADOW (forced by `_perform_deploy`) | `POST /employees/{id}/deploy` ✅ |
| **Promote** | per (employee × task-type) up the ladder, gated by Ensure | `POST /employees/{id}/autonomy/promote` ✅ (real eval 🆕) |
| **Operate** | super-agent runs intake→…→report; caretaker clears approvals | `superagent_service` 🆕, `POST /approvals/{id}/decide` ✅ |
| **Optimize** | promote/demote on drift; tune budgets; retrain long-term memory | `promote/demote` ✅, `memory_service.promote_to_long_term` 🆕 |

The play is reversible end-to-end (a framework non-negotiable): demote autonomy → suspend → `pause_unit` → revert config (version rollback via the shipped `version` field) → decommission with reassign. Every step audited via the shipped append-only ledger.

---

### 6.8 Admin Console — extending the shipped UI

The shipped console (`ui/src/pages/`) already drives the full lifecycle. We add views for the new anatomy/team concepts, reusing the shipped `api/client.ts` + `errMsg` + `state/unit.tsx` context. We also **port proven UX patterns** from `treppan-frontend` rather than inventing them:

| New / extended page | Builds on | Ported pattern (source) |
|---|---|---|
| **EmployeeDetailPage** — add Memory, Tier-config, Context-bindings tabs | shipped page (already shows `tier`, `supervision.caretaker`, lifecycle buttons) | episodic history as a **provenance timeline** (`LeadAISpace.tsx` activities rail) |
| **UnitPage** — add Charter / KPIs / Staffing / Connectors editor | shipped `UnitsPage` (onboard/activate) | persona-scoped KPI strip via `KpiCard` (`dashboard/components/KpiCard.tsx`) |
| **SuperAgentPage** (new) — unit org chart (humans + AI peers), assign/monitor | new, reads `list_employees` + dashboard | blended org chart; HITL/executed-by badges (`WorkflowsPage.tsx` `EXEC_BADGE`) |
| **ApprovalsPage** — already shipped | shipped decide queue | **one-tap approval with homework attached** (`LeadAISpace` Accept/Edit/Dismiss triad) |
| **EmployeeCostLedger** (new tab on unit dashboard) | shipped `spent_usd` + cost_events | per-agent **cost-per-action ledger** (`AgentTable.tsx`, `fmtCpa` 4-decimal) |

The autonomy ladder gets a visual stepper (the `LeadAISpace` `STAGES` numbered-circle pattern) so a caretaker sees shadow→assist→supervised→autonomous with the current rung highlighted and the promotion gate (Ensure eval result) shown inline before the Promote button — making "earned trust" legible.

---

### 6.9 Build sequence (this section's slice)

1. **Wire the inert anatomy** (lowest risk, no new lifecycle): model-policy → gateway call site; context-bindings → Recall filter. Reuses shipped gateway.
2. **Memory** (`schemas/memory.py`, `services/memory_service.py`, episodic write in `run_service`). Reuses shipped Pulse/Qdrant from `lms-onyx`.
3. **Close decommission reassign** (3-line fix in shipped `_perform_decommission`).
4. **Tiers behavioral** (tier→model-policy/loop resolver at configure).
5. **Unit extension** (charter/KPIs/connectors/staffing fields; `pause_unit` kill-switch).
6. **Super-agent** (`superagent_service.py`, single-T4 guard, events-bus intake — first consumer of the inert events collection).
7. **Real adapters** behind the shipped contract (`lms_onyx_streaming`, `claude`, `http_webhook`) + autonomy-aware Act gate.
8. **Console** extensions (memory/tier tabs, unit editor, super-agent org chart, cost ledger).

Every item is additive to shipped, tested code; nothing in `domain/lifecycle.py`, `governance/policy.py`, `governance/identity.py`, or the `store.py` abstraction is rewritten.

I now have precise, verified grounding. Writing the section.

---

## 7. Governance, Trust & Security (Vault) + Ensure

> **Trust invariant (the one line everything else serves):** *Nothing executes without authorization; nothing happens without a record* [FRAMEWORK/06]. Vault enforces this **in the runtime**, not as an after-the-fact report. Ensure measures whether what executed was *effective and affordable*, and is the only thing allowed to move an employee up the autonomy ladder.

This section builds directly on what `onyx-meridian` v0.3.0 has already shipped. Four of Vault's six pillars exist as **pure, tested modules**: `meridian/governance/policy.py` (least-privilege + deploy gate), `meridian/governance/identity.py` (peppered-HMAC credentials), `meridian/gateway/model_gateway.py` (on-prem-first routing + cost meter), and `meridian/services/audit_service.py` (append-only ledger). The work below is **not a rebuild** — it is widening these from a *config/deploy-time* gate into a *per-action runtime* gate, and standing up Ensure (which does not exist yet beyond the cost meter in `run_service._enforce_budget`).

### 7.1 Shipped vs to-build — the honest ledger

| Capability | Shipped today (cite) | Gap to close | Build phase |
|---|---|---|---|
| Policy verdict type + denial→403 | `policy.py` `PolicyVerdict`/`PolicyDenied`; `main.py` maps to 403 | Reuse verbatim as the runtime verdict envelope | P0 |
| Least-privilege config check | `policy.authorize_configuration` (wildcard `sales.*`/`*`, grant-vs-deny conflict) | Reuse; add `narrow-never-widen` inheritance from unit→employee | P0 |
| Deploy gate (active unit + configured + caretaker) | `policy.authorize_deploy` | Reuse; generalize into one `authorize(actor, action, target, scope, ctx)` entrypoint | P1 |
| Per-action runtime authorization | **none** — only config/deploy gated | New `authorize_action()` called by the runtime before *every* tool/connector invocation | P1 |
| Policy catalog + versioning + policy memories | **none** | New `policies` collection (P1–Pn), `version`, `applies_to`, effectiveness score per policy | P1 |
| Agent identity / first-class principal | `identity.py` + `identity_service.py` (`omk_*` token, peppered HMAC-SHA256, one active cred/employee, `verify`→claims) | Reuse fully; **enforce** claims at action endpoints (today issued, not enforced) | P0→P1 |
| Model Gateway routing + cost meter | `model_gateway.route` (on-prem-first) + `cost_usd` (static `_PRICING`) | Replace static stub with hardened LiteLLM proxy; add budget enforcement + egress/PII at the gateway | P1→P2 |
| Budget hard-stop | `run_service._enforce_budget` (lifetime accrual → auto-suspend + `budget_override` approval) | Add monthly window reset, warn thresholds, per-scope (company/unit/employee/task) budgets, `max_actions_per_hour` | P1 |
| Immutable audit ledger | `audit_service.record/list_events` (no update/delete path) | Add hash-chaining/tamper-evidence, export/retention, `audit_ref` back-link from every Task | P1 |
| HITL approval queue | `approval_service` (deploy, decommission, autonomy_promote, budget_override) | Make `autonomy_promote`/`budget_override` auto-executable; add one-tap payload-with-homework | P1 |
| Kill switch / reversibility | `employee_service.suspend`; config `version` bump per re-configure | Add unit-wide + workforce-wide kill; actually reassign in-flight Tasks on decommission | P1 |
| Secrets / vault | `CREDENTIAL_PEPPER` from settings | Externalize to a secret store; rotate pepper; vault provider secrets | P0 |
| Separation of duties | **none** | New: configurer ≠ approver ≠ auditor RBAC roles | P1 |
| Compliance / data-residency | **none** | New: classification-driven retention; UAE PDPL "no audio kept"; deployment-agnostic posture | P2 |
| **Ensure** — evals / drift / ROI / knowledge-gap / promotion gates | **none** — `eval_passed` is a trusted caller flag | New `ensure` service + collections; gates `autonomy/promote` | P2→P3 |

### 7.2 Vault architecture — widen the gate from deploy-time to action-time

The single most important structural change: today the Policy Engine fires **twice in an employee's life** (at `configure` and `deploy`). The platform requires it to fire **on every tool/connector call**. We keep `policy.py` pure and add one new pure function plus its runtime caller.

```
                         ┌──────────────────────── VAULT (L4, cross-cuts L0–L6) ─────────────────────────┐
  AI Employee run        │                                                                                │
  (run_service)          │   1. authorize_action({actor, action, target, data_scope, context})            │
        │                │        ├─ permission-aware  (identity_service claims ⊇ required scope?)         │
        │  before any     │        ├─ policy-compliant   (catalog Pn applies_to(action) → verdict)         │
        ▼  tool call ────▶│        ├─ autonomy        (per_task_autonomy ≥ required for this action?)      │
   adapter.execute        │        └─ budget         (spent < ceiling, rate < max_actions_per_hour?)       │
        │                │             │                                                                   │
        │                │             ▼  three outcomes                                                   │
        │                │   ALLOW ──────▶ execute + audit_service.record(...)                             │
        │                │   REQUIRE ────▶ approval_service.create_approval(one-tap homework attached)     │
        │                │   DENY  ──────▶ block + audit (with reason: which rule, which scope)            │
        │                │                                                                                 │
        │                │   2. model_gateway.route()  on-prem-first ── 3. egress/PII redact ── 4. cost   │
        ▼                │                              │                          │              meter    │
   side-effect           └──────────────────────────────┼──────────────────────────┼──────────────────────┘
                                                         ▼                          ▼
                                            audit_ledger (hash-chained)     cost_events (per-scope roll-up)
```

**New pure function** in `governance/policy.py`, alongside the two shipped ones, returning the existing `PolicyVerdict`:

```python
# governance/policy.py  (NEW — mirrors the shipped authorize_* style)
@dataclass
class ActionRequest:
    actor: str                 # principal_id of the AI employee (or human)
    actor_type: str            # "employee" | "user" | "system"
    action: str                # "crm.lead.send_whatsapp", "rtq.quote.issue", ...
    target: str                # entity id the action touches
    data_scope: str            # "crm.leads", "rtq.quotes" ...
    autonomy: str              # current per_task_autonomy for this action
    budget_ok: bool            # computed by caller from spent vs ceiling
    granted_scopes: list[str]  # principal claims (from identity_service.verify)

def authorize_action(req: ActionRequest, policies: list[dict]) -> PolicyVerdict:
    # 1 permission: req.data_scope covered by req.granted_scopes (reuse _scope_covered)
    # 2 policy: each policy whose applies_to matches req.action votes allow/require/deny
    # 3 autonomy: required_autonomy(action) <= req.autonomy  (shadow<assist<supervised<autonomous)
    # 4 budget: req.budget_ok
    # → PolicyVerdict.ok() | .require_approval(...) | .deny(...)
```

We extend `PolicyVerdict` with a third state, `require_approval` (today it is binary `allowed`), preserving `PolicyDenied`→403 and adding `PolicyRequiresApproval`→202 in `main.py`'s central error map. The runtime caller lives in `run_service.create_run` **before** `adapter.execute_heartbeat` (run_service.py:75), so no adapter ever side-effects without a verdict.

**Reuse from Treppan as the catalog blueprint.** Treppan already ships a working two-engine policy split we mirror: a **runtime** engine (`backend/services/v1/workflow/policy_engine.py`, `PolicyEngine.evaluate` returning effects `{allow, flag, require_approval, route, schedule, block, noted}`, `_HITL_EFFECTS = {"require_approval","block"}`) and a **measurement** engine (`backend/services/v1/analytics/policy_service.py`, 0–100 effectiveness scored against live data, banded healthy≥80/at_risk≥50/breaching). Meridian's `authorize_action` adopts the runtime-effect vocabulary; Ensure (§7.6) adopts the measurement engine's banding and the swappable `PolicyBrain` Protocol (`policy_service.py:421-451`, designed so `ClaudePolicyBrain` drops in).

### 7.3 Policy catalog, versioning & "policy memories"

Meridian ships **no catalog** — the gap. We add a `policies` collection in `services/store.py` (alongside `units`, `employees`) seeded from the two worked specs:

| Source | Policies | Reuse |
|---|---|---|
| Treppan CRM | P1–P17 | `backend/services/v1/analytics/policy_catalog.py` `POLICY_CATALOG` (`code, name, level, rule, metric_key, lever`) + `workflow_catalog.py` `POLICY_RUNTIME` (`evaluator, config, applies_to`) |
| TESPL RTQ | P1–P14 | intake/ownership, dialogue-scope, master/costing governance, AI-governance (P7), margin floor (P8), commitments (P9), exposure watch (P12), audit & learning (P13), SLA budget (P14) |

Each policy doc: `{code, name, level, rule, evaluator_key, config (JSONB thresholds), applies_to (action keys), version, metric_key, lever, effectiveness_score, status, enabled, updated_at, deleted_at}`.

- **Versioning:** Treppan's policies use in-place edit + `updated_at`/soft-delete (no version column). Meridian adds an explicit `version` integer (it already does this for employee configs in `domain/lifecycle.py` and ships the pattern), and a `policy_versions` append snapshot so a threshold change is rollback-able — matching design principle 10 (reversible by design).
- **Inheritance — narrow-never-widen** [FRAMEWORK/06]: a unit's catalog (already modeled as `Unit.allowed_scopes`) is the ceiling; an employee policy may only intersect it. Enforced by reusing `policy._scope_covered`.
- **Policy memories** [FRAMEWORK/08 §6.3, L3]: `effectiveness_score` per policy, computed post-hoc by Ensure (§7.6) using each policy's `metric_key`/`lever` — Treppan's `policy_service._METRICS` (13 metric fns) and `DeterministicPolicyBrain` recommendation engine port nearly verbatim. Policies are *tuned, not frozen*.

### 7.4 Identity, secrets & separation of duties

**Reuse fully.** `identity_service.py` already implements the FRAMEWORK/06 identity requirement: `issue_for_employee` mints `omk_<43url-safe>` at deploy, stores only `hmac.new(pepper, token, sha256)` (`identity.py:24-26`), shows plaintext once, enforces one active credential per employee (`revoke` then insert), and `verify(token)→{principal_id, employee_id, unit_id, scopes}` with constant-time compare (`identity.py:34-36`) + `last_used_at` stamp. Decommission revokes. This is the system-of-record for the blended org graph (`AIEmployee` peer of `Person`).

**Three gaps to close:**
1. **Enforce claims at runtime** (P0→P1). Today scopes are *issued but not checked on any action endpoint* (current-build GAP). Add a FastAPI dependency that runs `identity_service.verify` on the `Authorization: Bearer omk_*` header and passes `granted_scopes` into `authorize_action`. Human auth is borrowed from `lms-onyx` (`http_middleware.py` `AuthContextAndRoleHeaderMiddleware` + `services/auth_service.py`) as the **shared IdP** — Meridian today has *no human login* (current-build GAP).
2. **Secrets vault** (P0). `CREDENTIAL_PEPPER` lives in settings; externalize to a secret store, support pepper rotation (re-hash on next `verify` miss), and vault all provider keys. This also addresses the verified leaked Aiven credential in `onyx-pulse/db_configs.json` (reuse-map issue #1) — the gateway reads provider creds from the vault, never plaintext config.
3. **Separation of duties** (P1) [FRAMEWORK/06 §7]. New RBAC roles: **configurer** (instantiate/configure employees) ≠ **approver** (decide HITL queue) ≠ **auditor** (read-only ledger). Enforced on the routes in `routes/api.py` — e.g. a configurer cannot approve their own employee's `deploy`. Treppan has no SoD; this is net-new, modeled on paperclip's governance roles (pattern only — TS).

### 7.5 Model Gateway, budgets, egress/PII — harden the shipped stub

`model_gateway.py` ships the *shape* right (pure, on-prem-first `route`, `cost_usd` from `_PRICING`) but is a pricing stub. Hardening, keeping the same function signatures so `run_service` is untouched:

| Concern | Shipped | To-build |
|---|---|---|
| Routing | `route(policy, requested_model)` honors policy.allowed, falls back to preferred internal (`model_gateway.py:42-57`) | Back with a real **LiteLLM proxy** (reuse-map: harden lms-onyx's LiteLLM); `internal/onyx-llm` → on-prem SLM endpoint |
| Pricing | static `_PRICING` (model_gateway.py:20-27) | Read live provider catalog; keep static as fallback |
| Budgets | hard-stop only at employee level (`run_service._enforce_budget`, lifetime accrual) | Per-scope ceilings (company/unit/employee/task); **monthly window reset**; warn at 80%; over-budget = **deny or downgrade** to a cheaper allowed model at the gateway (the "same task, cheaper model when budget demands" rule, FRAMEWORK/08 §6.1) |
| Egress / PII | **none** | Classification + PII redaction **before any prompt leaves the boundary**; block sensitive scopes from external models (UAE PDPL); "voice: no audio kept" — transcripts only, enforced at the ingest→gateway boundary |
| Caching / fallback | none | Response cache + provider fallback chain |

The cost meter is the **COST control surface**: `run_service` already writes a per-run `cost_events` row (run_service.py:108-120) attributed by `unit_id`/`employee_id`/`run_id` — exactly the atomic record Ensure rolls up into *cost-per-action* and *cost-trace-per-stage*. Treppan proves the roll-up: `agent_analytics_service.py` computes `cost_per_action` (`:199`) and the frontend `AgentTable.tsx` renders the `$0.0000` ledger with `fmtCpa` — both port onto Meridian's `cost_events`.

### 7.6 Ensure — evals, drift, ROI, knowledge-gap, promotion gates

Ensure is the **EFFECTIVENESS** surface and the **only** mover of the autonomy ladder. Today autonomy `promote` trusts a caller-supplied `eval_passed` flag (`domain/lifecycle.py`) — the gate is fake. Ensure makes it real.

```
   ┌──────────────────────────── ENSURE (cross-cutting, Governance/Experience) ───────────────────────────┐
   │                                                                                                        │
   │  consumes:  audit_ledger ── cost_events ── runs ── approvals(override rate) ── tasks(SLA/completion)   │
   │                                                                                                        │
   │  EVALS         sampled human review + automated evals per (employee × task-type) → pass_rate           │
   │  DRIFT         rolling pass_rate / override_rate window; breach ─────────────▶ AUTO-DEMOTE autonomy    │
   │  PROMOTION     objective gate: pass_rate ≥ θ AND override_rate ≤ φ AND budget_ok ──▶ allow promote     │
   │  ROI           cost-to-automate vs cost-of-human, per task/stage ───────────────▶ digital twin (Prism)│
   │  KNOWLEDGE-GAP retrieval-miss / low-confidence answers ────────────────────────▶ Task for domain expert│
   │  POLICY-MEMORY 0–100 effectiveness per policy (Treppan policy_service) ─────────▶ tuning recommendations│
   └────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Ensure function | Build on | Mechanism |
|---|---|---|
| **Eval gate replaces `eval_passed`** | `domain/lifecycle.py` autonomy ladder (shadow→assist→supervised→autonomous, single-step) | New `ensure_service.evaluate(employee, task_type)` → real `pass_rate`; `autonomy/promote` route calls it instead of trusting the flag |
| **Drift → auto-demote** | `employee_service.suspend`/`prev_autonomy` already exist | Rolling-window pass_rate/override_rate breach calls `prev_autonomy` + audit + alert (FRAMEWORK/08 §6.6: "drift auto-demotes") |
| **Promotion gate** | autonomy is per `(employee × task-type × data-scope)` (`per_task_autonomy`, stored) | Objective criterion: `pass_rate ≥ θ AND override_rate ≤ φ AND within budget` — the only path up the ladder |
| **Override rate** | `approval_service` decisions | Ratio of dismissed/edited vs accepted proposals per employee — Treppan's HITL vocabulary (`workflow_executions.requires_hitl`) is the same signal |
| **ROI** | `cost_events` (shipped) | cost-to-automate vs cost-of-human per task/stage → feeds digital twin; FRAMEWORK/08 §6.5 |
| **Knowledge-gap** | reuse `lms-onyx` knowledge-gap analytics + retrieval_log | Low-confidence/retrieval-miss → emits a Task to a domain expert (Task Registry already ships, current-build §4) |
| **Policy effectiveness** | Treppan `policy_service.py` `_METRICS` + `DeterministicPolicyBrain` (`:421-451`, Protocol designed for `ClaudePolicyBrain`) | 0–100 score per policy + change recommendations using each policy's `lever` |
| **Human-attention (compression) budget** | `approvals` timestamps | Time-in-queue per item vs a 15-min target (TESPL P14) — "the measure of compression itself" |

**Surfacing.** Ensure metrics extend the shipped `dashboard_service.py` (`GET /units/{id}/dashboard`, which already returns spend-vs-budget, commitment rollup, stale-employees, open-approvals). New fields: `eval_pass_rate`, `override_rate`, `drift_status`, `cost_per_action`, `policy_health`. The frontend already has the atoms: Treppan's `KpiCard.tsx` (cross-feature reused), `PolicyTable.tsx` (P-code + inline score bar + status badge healthy/at_risk/breaching), and `PolicyRecommendations.tsx` (severity-tinted read-only proposals with `Suggested:` + evidence). The two **explainability vs observability** angles (FRAMEWORK/08 §6.4) map to: explainability = `PolicyVerdict.reasons` ("which rule, which scope"); observability = the hash-chained audit ledger ("it went wrong — do I know why?").

### 7.7 HITL, kill switch & reversibility

- **One-tap approval queue as a first-class surface** (not a notification). `approval_service` ships the queue (`ApprovalType` = deploy/decommission/autonomy_promote/budget_override) but `autonomy_promote`/`budget_override` are *recorded, not auto-executable* (current-build GAP). Build: make all four executable via the parked `_perform_*` pattern, and attach **homework** (the proposal + rationale + provenance) to every item so each Yes is "a single tap, never a form" (TESPL #30). Treppan's `LeadAISpace.tsx` Accept/Edit/Dismiss triad + "Why:" rationale + provenance-jump is the exact UX contract to port; the platform consolidates `needs_hitl` executions into the one-tap queue Treppan itself lacks.
- **Kill switch** (FRAMEWORK/04, /06): `employee_service.suspend` gives the per-employee kill today. Add **unit-wide** and **whole-workforce** suspend (caretaker authority), each writing audit. In-flight Tasks of a killed employee must actually be reassigned — Meridian's decommission "reassign in-flight work" is *intent-only / recorded in audit* today (current-build GAP); wire it to `task_service.reassign` (which ships).
- **Reversibility / automation dial** [FRAMEWORK/08 §6.6]: the autonomy ladder *is* the dial; flipping an AI task to human-responsible is changing its `per_task_autonomy` to require approval — same state machine, task becomes "assign to a person." Config `version` bump per re-configure (shipped in `lifecycle.py`) gives instant rollback. An entire unit can revert to human-centered operation via its staffing plan — no re-architecting.

### 7.8 Audit ledger hardening & compliance

`audit_service.record` is correctly append-only with **no update/delete path** (audit_service.py:1-6) — the immutability invariant holds at the API. To make it tamper-*evident* (not just tamper-*resistant*) and compliant:

1. **Hash-chaining** (P1): each entry stores `prev_hash` + `entry_hash = sha256(prev_hash + canonical(entry))`. A broken chain detects deletion/edit even at the storage layer. (Treppan's `audit_log` is INSERT-only, RANGE-partitioned monthly — reuse the partitioning idea for retention.)
2. **`audit_ref` back-links** (P1): every Task Registry record and every employee links to its ledger entries — the Task schema already carries `audit_ref` (current-build §4), so this is wiring, not new schema. Enables the twin drill-down KPI → tasks → sources → agent actions.
3. **Export & retention** (P2): classification-driven retention (UAE PDPL); **no audio kept** — transcripts only at ingest (`ingest_service` HeuristicExtractor today; LLM extractor reuses `lms-onyx` transcription per reuse-map). Deployment-agnostic posture: same Vault checks run identically on-prem/hybrid/cloud (on-prem default), satisfying Fakhruddin's "data stays internal" non-negotiable.

### 7.9 Sequencing (governance built in parallel from day one)

| Phase | Vault | Ensure |
|---|---|---|
| **P0 (Foundations + safety)** | Reuse `policy.py`/`identity.py`/`audit_service.py` as-is; externalize `CREDENTIAL_PEPPER`; rotate leaked Aiven cred; **enforce identity claims** on action endpoints | cost meter already live via `run_service._enforce_budget` |
| **P1 (Pilot)** | `authorize_action` runtime gate; policy catalog (P1–P17 CRM / P1–P14 RTQ) + versioning; hash-chained ledger + `audit_ref`; per-scope budgets + monthly reset; one-tap queue executable; SoD roles; unit/workforce kill switch | override-rate + completion/SLA on dashboard; replace `eval_passed` with a real (initially heuristic) eval gate |
| **P2 (Business-unit)** | LiteLLM proxy + egress/PII + data-residency; secret store + pepper rotation | drift→auto-demote; promotion gate (θ/φ/budget); ROI cost-to-automate-vs-human |
| **P3 (Org-wide)** | full Model Gateway budgets/fallback/cache across units | knowledge-gap detection (lms-onyx); policy-memory `ClaudePolicyBrain`; compression budget on the twin |

Each phase is independently valuable and reversible. The wedge: Vault's `authorize_action` and Ensure's real promotion gate are what convert Meridian's shipped *lifecycle control plane* into an *enterprise-ready, governed, cost-controlled* workforce — the two failure modes (effectiveness gap, cost inversion) are structurally closed by Ensure (effectiveness, gates autonomy) and the Model Gateway (cost, gates spend) respectively.

---

Relevant shipped files this section builds on (absolute): `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/governance/policy.py`, `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/governance/identity.py`, `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/gateway/model_gateway.py`, `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/services/audit_service.py`, `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/services/identity_service.py`, `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/services/run_service.py`. Catalog/measurement blueprints to port: `/Users/palivelasrihari/onyx_all/Treppan_CRM/backend/services/v1/workflow/policy_engine.py`, `/Users/palivelasrihari/onyx_all/Treppan_CRM/backend/services/v1/analytics/policy_service.py`, `policy_catalog.py`, `agent_analytics_service.py`.

I have what I need. The shipped read-model is a per-unit synchronous aggregation. Now I'll write the section grounded in these exact files.

---

## 8. Digital Twin & Decision Intelligence (Prism)

> **Mandate.** The Digital Twin is a *read model* — a live operational projection of the enterprise, never a separate database of truth ([FRAMEWORK/05]). It is computed from four spines already shipping or specified: the **canonical model** (`meridian/schemas/{person,employee,unit,project,document,task}.py`), the **Action/Task Registry** (`meridian/services/task_service.py`), **KPIs/cost meters** (`run_service`, `cost_events`, `audit_ledger`), and **Ensure metrics** (§ Ensure). Prism is the *accelerator that renders and predicts over that read model* — leadership sees strategy + exceptions; departments see tasks + workflows; both scoped by RBAC ([FRAMEWORK/04, 09]). NL→SQL dashboards are not rebuilt — we mount **ConvBI** (the canonical engine) and **onyx-pulse**'s chart/dashboard CRUD on top.

This section builds *directly* on the one slice that already ships: `meridian/services/dashboard_service.py::build_unit_dashboard` + `meridian/schemas/dashboard.py::UnitDashboard`. That function is the seed of the twin; it is explicitly labelled "the leadership read-model (first slice of the Digital Twin)" (`dashboard_service.py:1`). We extend it; we do not replace it.

---

### 8.1 What already ships (the seed) and its exact limits

`build_unit_dashboard(unit_id)` is a **synchronous, per-unit, read-only aggregation** over four collections. It is the proof that the read-model pattern works. Its concrete shape (verbatim from `dashboard.py:14-43`):

| Field group | Source service | What it projects |
|---|---|---|
| `by_status`, `by_tier`, `by_autonomy`, `employees_total` | `employee_service.list_employees(unit_id=…)` | workforce census (autonomy counted for `deployed` only — `dashboard_service.py:37-38`) |
| `spent_usd`, `budget_monthly_usd`, `budget_utilization` | sum of `emp.spent_usd` vs `unit.budget_monthly_usd` | cost-vs-budget, current state |
| `commitments_total/open/overdue`, `completion_rate`, `commitments_by_status` | `_task_rollup` → `task_service.list_tasks` | the wedge surfaced (`dashboard_service.py:74-100`) |
| `open_approvals` | `approval_service.list_approvals(status=PENDING)` | HITL backlog count |
| `stale_employees` | `last_heartbeat_at < utcnow() - heartbeat_stale_seconds(=900)` | liveness exceptions (`dashboard_service.py:39-48`) |
| `recent_activity` | `audit_service.list_events(limit=10)` | last-10 audit drilldown stub |

**The five hard limits we must close** (all confirmed in current-build dossier §5 + code):

1. **Per-unit only.** There is no org-wide / cross-unit roll-up. `build_unit_dashboard` takes a single `unit_id`. Leadership has no "every overdue task across the company" answer (a named Fakhruddin success question).
2. **Not predictive.** It reports current counts (`overdue_commitments`) but never *forecasts* a slip. "Escalate before crisis" is unmet — `task_service.escalate_due` only warns tasks already inside the due window; nothing projects the trajectory.
3. **No RBAC.** UI and all endpoints are unauthenticated (current-build §8). There is no leadership-vs-department lens, no scope filtering.
4. **No NL→SQL, no charts.** It returns dict counts. No `ChartSpec`, no narrative, no ad-hoc question surface. ConvBI/onyx-pulse are not integrated (current-build "GAPS").
5. **Recomputed every call** over `limit=500` full scans (`dashboard_service.py:22,76`). Fine for a unit; will not scale to org-wide without a projection store.

---

### 8.2 Target architecture — the twin as a layered read model

Prism is **three concentric read layers** over the canonical + governance substrate. None of them owns truth; each is a projection that can be dropped and rebuilt from the ledger + collections.

```
                          ┌─────────────────────────────────────────────┐
                          │  EXPERIENCE  (UI: leadership lens / dept lens)│
                          │  TwinPage · DeptBoard · NL→SQL ask box        │
                          └───────────────▲───────────────▲──────────────┘
                                          │ RBAC-scoped    │ ChartSpec/NL
        ┌─────────────────────────────────┴───────┐   ┌───┴──────────────────┐
        │  L3  PRISM DECISION LAYER (predictive)   │   │  NL→SQL  (ConvBI lib) │
        │  - risk/slip forecasting                 │   │  + plotfactory charts │
        │  - bottleneck detection                  │   │  + dashboard CRUD     │
        │  - narrative digest                      │   │  (onyx-pulse reuse)   │
        └──────────────────▲───────────────────────┘   └───────────▲──────────┘
                           │ reads                                  │ reads twin SQL view
        ┌──────────────────┴───────────────────────────────────────┴──────────┐
        │  L2  TWIN READ-MODEL  (projections; org-wide + per-unit)             │
        │  twin_snapshots · twin_org_rollup · per-unit dashboard (SHIPPED)     │
        │  rebuilt from canonical + registry + cost_events + audit + Ensure    │
        └──────────────────▲───────────────────────────────────────▲──────────┘
                           │ projected from                          │
        ┌──────────────────┴───────────────┐   ┌────────────────────┴─────────┐
        │  L1  CANONICAL + REGISTRY (truth) │   │  GOVERNANCE / COST / ENSURE  │
        │  employees·units·tasks·persons·   │   │  audit_ledger · cost_events ·│
        │  projects·documents (schemas/)    │   │  runs · Ensure eval metrics  │
        └───────────────────────────────────┘   └──────────────────────────────┘
```

The **shipped `build_unit_dashboard` is L2/per-unit** in this picture. We add the org-wide L2 roll-up, the L3 predictive layer, and the NL→SQL/chart surface — and gate everything with RBAC.

---

### 8.3 Build plan

#### 8.3.1 Generalize the read-model: org-wide roll-up (`prism_service.py`)

New file `meridian/services/prism_service.py`. It composes the existing per-unit function rather than duplicating it.

```
build_org_twin(scope: TwinScope) -> OrgTwin
  units      = unit_service.list_units(scope.unit_ids)        # RBAC-narrowed
  per_unit   = [ await build_unit_dashboard(u.id) for u in units ]   # REUSE shipped fn
  rollup     = _fold(per_unit)        # sum spend, weighted completion_rate,
                                      # union overdue, total open_approvals, T4 census
  forecasts  = forecast_service.project(units, horizon=scope.horizon)   # §8.3.2
  digest     = narrative_service.compose(rollup, forecasts, scope.persona)  # §8.3.5
  return OrgTwin(units=per_unit, rollup=rollup, forecasts=forecasts, digest=digest)
```

New schema `meridian/schemas/twin.py`:

| Model | Fields (additive to `UnitDashboard`) |
|---|---|
| `OrgRollup` | `units_total`, `employees_total`, `humans_total`, `ai_employees_total`, `blended_headcount`, `spent_usd`, `budget_monthly_usd`, `org_completion_rate` (commitment-weighted), `overdue_across_org`, `open_approvals_across_org`, `by_tier` (incl. `T4_superagent` count), `by_autonomy`, `units_breaching_budget[]` |
| `WorkforceCensus` | counts split by `owner.type` (`human` \| `ai_employee`) — the **blended org chart** the canonical model requires because `AIEmployee` is a peer of `Person` ([FRAMEWORK/05]) |
| `OrgTwin` | `units: list[UnitDashboard]`, `rollup: OrgRollup`, `forecasts: list[Forecast]`, `digest: NarrativeDigest \| None` |

**Blended headcount** is computable today: `Person` lives in the `persons` collection (current-build §1) and `AIEmployee` in `employees`; both carry `unit_id`. The roll-up unions them — this is the one twin requirement ("must include the workforce — humans + AI employees", [FRAMEWORK/09]) that the shipped per-unit view skips.

New routes (extend `routes/api.py`, RBAC-gated per §8.3.4):

```
GET /twin                  -> OrgTwin (leadership; all units in caller scope)
GET /twin/rollup           -> OrgRollup only (cheap KPI strip)
GET /twin/commitments?status=overdue   -> cross-unit task list  ("every overdue task")
GET /twin/forecasts        -> list[Forecast]   (the "before crisis" feed)
GET /units/{id}/dashboard  -> UnitDashboard    (SHIPPED — unchanged, now RBAC-gated)
```

#### 8.3.2 Predictive layer — "escalate before crisis" (`forecast_service.py`)

The shipped system only reacts: `task_service.escalate_due` flips already-overdue opens to `MISSED` (current-build §4). Prediction means scoring *open* commitments for slip **before** `due`. Start deterministic (cheap mode — no model spend), promote to model later via the gateway.

`Forecast` schema:

| Field | Meaning |
|---|---|
| `subject` | `{type: commitment\|unit\|employee, id}` |
| `kind` | `slip_risk` \| `bottleneck` \| `budget_breach` \| `stale_workforce` |
| `severity` | `info` \| `warning` \| `critical` (mirrors onyx-pulse `PolicyRecommendations` tinting) |
| `signal` | the evidence (`"3 of 5 deps still open, due in 6h"`) |
| `source_refs[]` | `task_id`/`audit_ref`/`doc_id` for drilldown |
| `predicted_at`, `window` | when, over what horizon |

Deterministic detectors (v1, zero model cost — pure `domain/` functions, testable like `domain/task_lifecycle.py`):

```
slip_risk(task):
    if task.status in OPEN_STATUSES and task.due within escalation.before_due window
       and any(dep.status != DONE for dep in task.depends_on):
         -> Forecast(slip_risk, severity = critical if due<24h else warning)
bottleneck(unit):
    if overdue_commitments / max(open_commitments,1) > θ  (config)  -> warning
budget_breach(unit):                                   # extends shipped budget hard-stop
    if projected_spend(run rate over cost_events) >= budget_monthly_usd  -> critical
stale_workforce(unit):
    reuse shipped stale_employees -> kind=stale_workforce
```

`projected_spend` uses `cost_events` (per-run atomic records, current-build §1) to fit a run-rate — closing the "lifetime-accumulated spend, no monthly window" gap by *forecasting* the breach the gateway will eventually hard-stop. **Promotion path:** swap the deterministic detector for a model call behind the same `Forecaster` Protocol — exactly the `DeterministicPolicyBrain → ClaudePolicyBrain` seam Treppan already proved (`policy_service.py:421-451`). The model call routes through the Vault Model Gateway (`gateway/model_gateway.py`), so prediction itself is budgeted and on-prem-first.

These forecasts are **proposals, not actions** — they surface in the twin and emit a `twin.forecast` domain event (`event_service`); a human (or a Flow rule, once Flow lands) decides. This keeps "AI proposes, a human commits" intact at the analytics layer.

#### 8.3.3 Projection store + incremental refresh

`build_unit_dashboard` full-scans `list_employees(limit=500)` + `list_tasks(limit=500)` per call (`dashboard_service.py:22,76`). Per-unit this is fine and we keep it. For **org-wide** we add a materialized projection so leadership pages don't fan-scan every unit synchronously:

- New collection `twin_snapshots` (declared in `services/store.py` alongside the others). One row per `(unit_id, computed_at)` holding the `UnitDashboard` dict + forecast summary.
- Refresh trigger: **domain events already exist but are inert** ("captured but inert", current-build GAPS). We make the twin the *first consumer* of `event_service`: on `task.created/done/escalated`, `run.*` (cost), `employee.*` (lifecycle), invalidate that unit's snapshot. Until Flow ships an event loop, a thin `refresh_stale_snapshots()` sweep (same idempotent pattern as `escalate_due`, exposed at `POST /twin/refresh`) recomputes any snapshot older than `twin_snapshot_ttl`.
- `GET /twin` reads snapshots; `GET /units/{id}/dashboard` stays live (authoritative single-unit view). Snapshots are a cache, never truth — rebuildable from canonical + ledger, satisfying "not a separate database of truth."

```
event_service ──emit──> (task.* / run.* / employee.*) ──invalidate──> twin_snapshots[unit]
                                                                            │
GET /twin ─────────────────────────────────────────────read───────────────┘  (fold snapshots)
```

#### 8.3.4 RBAC — leadership lens vs department lens

Two audiences, **one system** scoped by role ([FRAMEWORK/04]). There is no human auth today (current-build §8, GAPS), so this depends on the Vault/Identity work (reuse `lms-onyx` `http_middleware.py::AuthContextAndRoleHeaderMiddleware` + `auth_service.py` as the shared IdP — reuse-map). Prism consumes the resolved auth context; it does not build auth.

`TwinScope` resolved from the caller's claims:

| Role | `unit_ids` | Lens | Endpoints |
|---|---|---|---|
| **Leadership / CEO** | all units | strategy + exceptions: `OrgRollup` + `forecasts` + `digest`; drill KPI → unit → task → source `doc_id`/`audit_ref` | `/twin`, `/twin/*` |
| **Department head / caretaker** | own unit(s) | tasks + workflows: full `UnitDashboard` for owned units; forecasts filtered to those units | `/units/{id}/dashboard`, `/twin?scope=mine` |
| **Agent (department member)** | own unit, own tasks | task board scoped to `owner.id == self` | `/units/{id}/tasks?owner=me` |

Scope is enforced **server-side** by narrowing `unit_service.list_units` and the `$in` filters the `InMemoryStore`/`MongoStore` already support (current-build §6) — never client-side. This also honours the platform's separation-of-duties / least-privilege bar (HR salary invisible cross-department, [Fakhruddin constraints]; [FRAMEWORK/06]): a department head's `/twin` call simply never folds in units outside their scope.

#### 8.3.5 NL→SQL dashboards + narrative — reuse, don't rebuild

This is where Prism stops being a fixed read-model and becomes *ad-hoc decision intelligence*. We do **not** write a new analytics engine; we mount the consolidated stack (reuse-map):

| Capability | Source (reuse) | Integration in Prism |
|---|---|---|
| NL→SQL (intent → schema-select → self-healing SQL → SSE) | **ConvBI** `convBI/agents/text_to_sql.py` (canonical engine) | mount as library behind `POST /twin/ask`; question → SQL over a **read-only twin SQL view** of canonical+registry |
| Charts (Plotly) + persisted dashboards + report gen | **onyx-pulse** `tools/plotfactory/`, `routers/graph.py`, `graph_crud` | render ConvBI results; persist leadership dashboards |
| Narrative digest ("number sentences", AI headline) | pattern from Treppan `ExecutiveDigest.tsx` + `narratives.py`/`copilot_service.py` | `narrative_service.compose` → `NarrativeDigest` attached to `OrgTwin` for the C-level lens only |

**Critical hardening (blocking, from reuse-map):** the twin SQL view exposes governed data, so (a) ConvBI must run as a **least-privilege read-only DB role** with query validation (it already recommends this; LLM-generated SQL otherwise hits the DB directly), and (b) every NL→SQL call routes through the Vault **Model Gateway** for budget + egress (PII redaction before any external model) — the same gateway the predictive layer uses. The leaked Aiven credential in `onyx-pulse/db_configs.json` must be rotated and purged *before* onyx-pulse code is pulled in (reuse-map issue #1, highest priority).

Frontend reuse is direct (frontend dossier): clone `KpiCard.tsx` (already cross-feature, persona-driven), `dashboardStore.ts` + `DashboardGrid` (customizable persona BI grid — rename/collapse/reorder/move-widget), the backend-driven `EChart`/`ChartSpec.echarts_option` contract (new chart types need no frontend code), `ExecutiveDigest.tsx` (toned number-sentences), and `CopilotResultCard.tsx` (ask → "Add to dashboard", never auto-inserted — the propose/commit invariant at the BI layer). The shipped Meridian `ui/DashboardPage` is the mount point; it currently renders the per-unit dict and gets the org `OrgTwin` + ask box added.

---

### 8.4 Drilldown contract — KPI → task → source → agent action

The twin's value is that leadership can **drill from a number to the evidence, all governed** ([FRAMEWORK/09]). Every projected number must carry its lineage. This contract reuses three things already present:

```
OrgRollup.overdue_across_org (12)
   └─drill→ GET /twin/commitments?status=overdue        # cross-unit task list
        └─ task.source {type, doc_id, quote}            # provenance, SHIPPED in task.py
        └─ task.audit_ref ──> GET /audit/{ref}          # the governed action trail (audit_service)
        └─ task.owner {type:human|ai_employee, id}      # who owes it (blended)
             └─ if ai_employee: GET /employees/{id}/runs # the agent actions that produced it
                  └─ run.cost_usd, run.model            # cost attribution per action
```

This mirrors the Treppan provenance loop exactly — `LeadAISpace.tsx`'s "fact → where it came from → verify" (`jumpTo` to the originating timeline event). Meridian already has the data: `task.source.quote`/`doc_id` (current-build §4) and `task.audit_ref` linking to the append-only ledger. Prism just exposes the drilldown routes and the UI rail.

---

### 8.5 Cost-trace-per-stage (Prism's cost surface)

The control framework requires **cost trace per stage transition** ("given 1000 leads, cost to move prospect→qualified") and **cost-to-automate vs cost-of-human** ([FRAMEWORK/08]). Meridian attributes cost per `run` (`cost_usd`, `principal_id`) and per employee (`spent_usd`); it has no stage roll-up — same gap Treppan documents (cost is per-agent/per-lead, "no dedicated cost-per-stage roll-up", but *derivable* run→lead→`lifecycle_stage`).

Prism builds the missing roll-up as a projection (no new truth):

| Surface | Derivation | Reuse |
|---|---|---|
| Cost per unit | sum `cost_events` where run's employee `∈ unit` | shipped `spent` fold |
| Cost per task/commitment | `cost_events` joined via `run.principal_id` → employee → tasks owned | `task.audit_ref` ↔ run linkage |
| Cost-per-action (blended) | `total_cost / actions` | Treppan `AgentStat.cost_per_action` data contract (`AgentTable.tsx`, `fmtCpa` `$0.0000`) — clone verbatim |
| Cost-to-automate vs cost-of-human | per task-type: blended cost-per-action × volume vs human-minutes × loaded rate | new; feeds the automation-dial decision ([FRAMEWORK/08 §6.6]) |
| Human-attention budget | time-in-approval-queue per item (the "compression metric") | `approval_service` timestamps; surface as a twin KPI strip card |

The UI is the proven `AgentTable` cost ledger + `KpiCard` strip (frontend dossier §5 — `AgentStat = {runs, success_rate, avg_latency_ms, total_cost, cost_per_action, quality}` is "exactly the per-stage cost-trace shape a platform console needs").

---

### 8.6 Sequencing (maps to FRAMEWORK/07 phasing)

| Step | Deliverable | Builds on | Phase |
|---|---|---|---|
| **P1.1** | `prism_service.build_org_twin` folding shipped `build_unit_dashboard`; `OrgTwin`/`OrgRollup` schemas; `GET /twin`, `/twin/commitments`; blended workforce census | `dashboard_service.py`, `persons`+`employees` collections | Pilot (leadership dashboard ask) |
| **P1.2** | RBAC `TwinScope` (leadership vs dept lens) once shared IdP lands | `lms-onyx` auth middleware (reuse) | Pilot |
| **P1.3** | NL→SQL ask box + charts behind read-only role + gateway | ConvBI (lib) + onyx-pulse plotfactory/graph CRUD | Pilot/V1 |
| **P2** | Deterministic `forecast_service` (slip/bottleneck/budget/stale) + `GET /twin/forecasts`; twin as first `event_service` consumer | `task_service`, `cost_events`, `event_service` (inert today) | Business-unit |
| **P3** | `twin_snapshots` projection + event-driven refresh; predictive `Forecaster` model behind Protocol (gateway-routed); cost-to-automate-vs-human surface | snapshots + Vault gateway + Flow events | Org-wide / predictive twin |

Each step is independently shippable and reversible: the predictive and NL→SQL layers are *additive read surfaces* over a read model that is itself rebuildable from canonical + ledger — drop any projection and the system still answers from truth.

I'll write Section 9. This is grounded entirely in the reuse-map and current-build dossiers — no need to read repo files since the dossier already provides verified paths and findings.

---

## 9. Accelerators & Repo Consolidation/Reuse Map

This section maps the five accelerators (**Pulse · Prism · Flow · Ensure · Vault**) onto the six existing repos under `/Users/palivelasrihari/onyx_all/`, states what is reused vs. hardened vs. consolidated vs. built net-new, and locks the *do-now* consolidation decisions (one NL→SQL engine, one identity service, one org registry, one model gateway, port + secret remediation). It builds directly on what `onyx-meridian` (v0.3.0) has **already shipped** — the control-plane spine — and treats the accelerators as the layers that plug *into* that spine, not a re-architecture of it.

### 9.0 What onyx-meridian already is (the spine the accelerators bind to)

`onyx-meridian` is the **Flow/Vault control-plane core, already partially built**. It is not a greenfield — the accelerator work below extends concrete, shipping modules:

| Already shipped in `onyx-meridian/meridian/` | Accelerator it seeds | Status |
|---|---|---|
| `domain/lifecycle.py`, `services/employee_service.py` | (employee lifecycle — substrate for all) | Done |
| `domain/task_lifecycle.py`, `services/task_service.py`, `services/ingest_service.py` | **Flow** (Task Registry) | Partial — registry done, no engine |
| `governance/policy.py`, `governance/identity.py`, `services/{audit,identity,approval}_service.py` | **Vault** | Partial — config/deploy gates only |
| `gateway/model_gateway.py` | **Vault** (Model Gateway) | Stub — pricing only |
| `services/dashboard_service.py` | **Prism / Twin** | Partial — local aggregation, not predictive |
| `adapters/{base,registry,echo}.py` | **Flow** (agent-call activities) | Stub — `echo` only |

The accelerators are therefore: **harden Vault inside Meridian**, **build the Flow engine on top of Meridian's event bus**, **wire Pulse/Prism in as external services Meridian calls** (not re-implement), and **consolidate the four sibling FastAPI services into shared libraries**.

### 9.1 Accelerator → repo map

```
                          ┌──────────────────────────── ONYX MERIDIAN (control-plane spine, v0.3.0) ────────────────────────────┐
                          │  Employee Registry · Task Registry · Policy Engine · Identity · Audit · Gateway stub · Dashboard     │
                          └───────────────┬───────────────┬───────────────┬───────────────┬───────────────┬────────────────────┘
                                          │               │               │               │               │
   ACCELERATOR:                        PULSE            PRISM            FLOW           ENSURE           VAULT
   ───────────                       (knowledge)     (decision/BI)   (orchestration)  (observability)  (governance)
   PRIMARY REPO(S):                   lms-onyx       onyx-pulse +      onyx-meridian   onyx-meridian +  onyx-meridian +
                                                       ConvBI         (events→engine)   Langfuse frags   onyx_vault(seed)
   REUSE FROM:                      streaming_       plotfactory,     task_lifecycle,  audit_service,   policy.py,
                                    controller.py,   graph_crud,      event_service,   Langfuse traces  identity.py,
                                    transcription,   ConvBI nl2sql    adapters/registry across repos     model_gateway.py
                                    auth, RAG
   PATTERN REF (no code import):                                     paperclip adapters/registry.ts, teams/skills-catalog, budgets
```

| Accelerator | Layer(s) [framework §7] | Primary repo(s) | Reuse source (verified path) | Action |
|---|---|---|---|---|
| **Pulse** — Knowledge | L3 Knowledge, L5 Recall | `lms-onyx` | `controllers/streaming_controller.py` (agentic-RAG, 1678 lines), `services/{audio,video}_transcription_service.py`, Qdrant hybrid | **Reuse** as canonical RAG/runtime + **extend** transcription into meeting→commitments |
| **Prism** — Decision | L5 + Experience | `onyx-pulse` (on top of `ConvBI`) | `tools/plotfactory/`, `routers/graph.py` + `graph_crud`, ConvBI `convBI/agents/text_to_sql.py` | **Reuse** charts/dashboards; **consolidate** NL→SQL onto ConvBI |
| **Flow** ★ — Workflow | Orchestration (L5↔L3/L4) | `onyx-meridian` | `services/event_service.py` (events emitted, **inert today**), `domain/task_lifecycle.py`, `adapters/registry.py` | **NEW** engine consuming the existing event bus; pattern from `paperclip` |
| **Ensure** — Observability | cross-cutting | `onyx-meridian` + Langfuse | `services/audit_service.py` (append-only ledger), Langfuse traces scattered in lms-onyx/ConvBI/onyx-pulse | **Consolidate** Langfuse fragments → one ledger; **build** evals/drift on top |
| **Vault** — Governance | L4 (cross-cuts all) | `onyx-meridian` + `onyx_vault` (empty) | `governance/policy.py`, `governance/identity.py`, `gateway/model_gateway.py`; lms-onyx RBAC | **Harden** Meridian's stubs; **seed** `onyx_vault` from lms-onyx auth |

`onyx_vault` is **confirmed empty** (13-byte README, single commit). It is *not* where the policy engine gets built from scratch — Meridian already has `governance/policy.py` with least-privilege + deploy gates. The action is to **extract lms-onyx's auth/RBAC into `onyx_vault` as a shared policy/identity library** that Meridian and the data services both consume, rather than each repo re-implementing.

### 9.2 Full consolidation table (capability → source → action)

| # | Capability | Source repo (verified path) | Action | Target shape |
|---|---|---|---|---|
| C1 | NL→SQL engine | `ConvBI/convBI/agents/text_to_sql.py` (LangGraph, self-healing, 3 retries) | **Consolidate** | Shared lib `onyx-nl2sql`; delete `onyx-pulse/agents/sql_generation.py`, call ConvBI |
| C2 | Charts + dashboards + report gen | `onyx-pulse/tools/plotfactory/`, `routers/graph.py`, `services/graph_crud` | **Reuse** | Keep as Prism's render/persist layer on top of C1 |
| C3 | Agentic RAG / cited Q&A / streaming runtime | `lms-onyx/controllers/streaming_controller.py` | **Reuse** | Pulse's Recall step + canonical agent-loop reference for Meridian's real adapter |
| C4 | Transcription (audio/video) | `lms-onyx/services/{audio,video}_transcription_service.py` | **Reuse + extend** | Feed Meridian's `ingest_service.py` `set_extractor` hook (today only `HeuristicExtractor` regex ships) |
| C5 | Auth: JWT/OAuth/RBAC/middleware | `lms-onyx/http_middleware.py`, `services/auth_service.py`, OAuth services | **Reuse → shared lib** | `onyx-auth` lib consumed by ConvBI, onyx-pulse (none today) **and** Meridian (no human auth today) |
| C6 | Org registry / onboarding / identity | `onyxos/services/onboarding_service.py`, `schemas/organization.py` | **Consolidate** | Single source of truth; Meridian reads `Unit` from onyxos instead of local `units` collection |
| C7 | Security / governance / policy / audit | `onyx_vault` (empty) + `onyx-meridian/governance/*` | **NEW (seed) + harden** | `onyx_vault` = shared policy/identity lib seeded from C5; Meridian's `policy.py` extended with versioned catalog |
| C8 | Managed Agent Layer / budgets / catalogs | `paperclip/server/src/adapters/registry.ts`, `teams-catalog`, `skills-catalog` | **Pattern only (TS, no import)** | Model for Meridian's `adapters/registry.py` expansion (Claude/HTTP/lms-onyx adapters beyond `echo`) |
| C9 | Action/Task Registry | `onyx-meridian/services/task_service.py`, `domain/task_lifecycle.py` | **Already shipped — extend** | Add Flow consumption of emitted events; actuate escalation REASSIGN/notify (recorded-only today) |
| C10 | Vector search (Qdrant hybrid) | re-implemented in ConvBI, lms-onyx, onyx-pulse | **Consolidate** | One `onyx-qdrant` wrapper lib |
| C11 | Multi-LLM access (LiteLLM/Azure/Gemini/Mistral) | scattered `llms/` across repos | **Consolidate** | One `onyx-llm-clients` lib behind Meridian's `gateway/model_gateway.py` |
| C12 | Leaked Aiven Postgres credential | `onyx-pulse/db_configs.json` lines 31-34 (in git history) | **Harden NOW** | Rotate + purge history + move to secrets |
| C13 | Port assignments | all four FastAPI services | **Harden NOW** | Env-driven distinct ports |

### 9.3 Do-now consolidation decisions (the five locks)

These are committed decisions, not options. Each names the *winner*, the *losers*, and the *cutover*.

**Decision 1 — One NL→SQL engine: `ConvBI`.**
- Winner: `ConvBI/convBI/agents/text_to_sql.py` (cleanest, ~680-line README, LangGraph state machine, self-healing debugger agent w/ 3 retries, already recommends read-only DB users).
- Delete: `onyx-pulse/agents/sql_generation.py` (verified duplicate).
- Cutover: extract ConvBI's agent graph as a Python lib `onyx-nl2sql`; `onyx-pulse` imports it and keeps only `tools/plotfactory/` + `graph_crud` (its unique surface). Prism (the leadership/twin view in framework §7) calls the same lib — **no third NL→SQL**.
- Harden on the way: ConvBI has **no authn/authz** — enforce the read-only DB role + `sqlglot` validation (mitigation, not a sandbox) before it serves Meridian.

**Decision 2 — One identity service: `lms-onyx` auth, extracted to `onyx_vault`.**
- Winner: `lms-onyx/http_middleware.py` (`AuthContextAndRoleHeaderMiddleware`) + `services/auth_service.py` + OAuth services — the only repo with JWT/OAuth/RBAC/multi-tenant.
- Losers: ConvBI and onyx-pulse have **no auth at all**; they consume the extracted `onyx-auth` lib.
- Cutover: extract into `onyx_vault` (currently empty) as the shared human-identity + RBAC layer. This closes Meridian's biggest auth gap — today **all Meridian write endpoints and the UI are unauthenticated**, and agent-principal scope claims (`omk_*` tokens from `governance/identity.py`) are issued but **not enforced at runtime**. Wiring `onyx-auth` middleware in front of `routes/api.py` is the first integration.
- Note the two identity planes stay distinct: **human identity** (lms-onyx → onyx_vault) and **agent-principal identity** (Meridian `governance/identity.py`, already shipped). They share the audit ledger, not the credential store.

**Decision 3 — One org/registry service: `onyxos`.**
- Winner: `onyxos/services/onboarding_service.py` + `schemas/organization.py` (Mongo, clean `routes→controllers→services→data` layering, LLM-driven onboarding).
- Losers: lms-onyx and onyx-pulse each carry their own org/department models (no single source of truth).
- Cutover: extend `onyxos/schemas/organization.py` with `Unit` fields Meridian needs (`allowed_scopes`, `budget_monthly_usd`, caretaker, lifecycle states). **Meridian's local `units` collection (`services/store.py`) becomes a read-through cache of onyxos**, not the source of truth — this is the C6 consolidation that makes `AIEmployee` and `Person` (already peers in Meridian's schemas) resolve against one org graph.

**Decision 4 — One model gateway: harden Meridian's `gateway/model_gateway.py` over LiteLLM.**
- Winner: Meridian's `gateway/model_gateway.py` (pure, on-prem-first `route()` + `cost_usd()` from static pricing table — already shipped).
- What it lacks (per current-build gaps): no real LiteLLM proxy, no budget enforcement *at the gateway*, no egress/PII policy, no on-prem routing actuation. Budget hard-stop exists only post-hoc in `run_service._enforce_budget` (lifetime spend, no monthly reset).
- Cutover: put the existing **LiteLLM proxy from lms-onyx** behind the `model_gateway.route()` contract; move budget enforcement *into* the gateway call path (per-employee/unit/task ceilings, monthly window); add egress redaction before any external call. The `onyx-llm-clients` consolidation (C11) sits underneath as the provider layer.

**Decision 5 — Fix ports + leaked secrets (blocking, do first).**
- **Leaked credential (highest priority):** `onyx-pulse/db_configs.json` profile `"2"` carries a live Aiven Postgres credential in plaintext (`pg-94a668a-gytworkz-dd98.c.aivencloud.com` / `avnadmin` / `AVNS_***REDACTED***`, lines 31-34), present in git history. **Rotate the credential, purge from history (BFG/filter-repo), move to env/secrets.** Nothing else ships until this is done.
- **Port collisions (verified):** ConvBI(8000)↔onyxos(8000); lms-onyx(8005)↔onyx-pulse(8005). Cannot co-host. Assign env-driven distinct ports:

  | Service | Old | New (env-driven) |
  |---|---|---|
  | onyxos (org registry) | 8000 | `ONYXOS_PORT=8001` |
  | ConvBI (nl2sql) | 8000 | `CONVBI_PORT=8002` |
  | lms-onyx (Pulse) | 8005 | `LMSONYX_PORT=8005` (keep) |
  | onyx-pulse (Prism) | 8005 | `PULSE_PORT=8006` |
  | onyx-meridian (spine) | — | `MERIDIAN_PORT=8010` |

- **CORS (all three of onyxos, onyx-pulse, lms-onyx, plus Meridian):** `allow_origins=["*"]` + `allow_credentials=True` is an invalid/unsafe combo (Meridian also ships CORS `*`). Replace with an explicit allow-list driven by env.

### 9.4 paperclip — pattern reference only (do not import)

`paperclip` is a TypeScript pnpm monorepo — **different language/runtime from the Python platform**, so it is architecture reference, never a code dependency. Three patterns map directly onto Meridian work:

| paperclip pattern (path) | Maps to Meridian gap |
|---|---|
| `server/src/adapters/registry.ts` (`registerServerAdapter`/`requireServerAdapter`) | Meridian's `adapters/registry.py` — today only `echo`; this is the model for adding Claude/HTTP-webhook/lms-onyx-runtime adapters under the existing `adapters/base.py` contract |
| `teams-catalog` / `skills-catalog` (declarative agent/skill defs) | The L6 Skills & Command layer + declarative archetypes (`onyx-meridian/schemas/archetype.py` already exists — extend toward a catalog) |
| budgets + governance + scheduled routines + audit | Vault budget enforcement (Decision 4) + Flow's scheduled triggers (the inert event bus needs a scheduler) |

### 9.5 Target shape & integration topology

```
                         ┌─────────────────── SHARED LIBS (extracted, versioned) ───────────────────┐
                         │  onyx-auth (←lms-onyx)   onyx-nl2sql (←ConvBI)   onyx-qdrant   onyx-llm    │
                         └────┬──────────────┬──────────────────┬──────────────────┬───────────┬─────┘
                              │              │                  │                  │           │
   PRODUCT SERVICES:         │              │                  │                  │           │
   ┌──────────────┐  ┌───────▼──────┐  ┌────▼─────┐  ┌─────────▼────────┐  ┌──────▼───────────▼──┐
   │ onyxos       │  │ lms-onyx     │  │ ConvBI   │  │ onyx-pulse       │  │ onyx-meridian        │
   │ (ORG REGISTRY│  │ (PULSE:      │  │ (nl2sql  │  │ (PRISM: charts + │  │ (FLOW + VAULT spine) │
   │  — truth)    │  │  RAG+transcr)│  │  lib)    │  │  dashboards)     │  │  + onyx_vault lib    │
   └──────┬───────┘  └──────┬───────┘  └──────────┘  └────────┬─────────┘  └──────────┬───────────┘
          │ Unit/Person     │ Recall + meeting→tasks          │ Twin/BI render        │ events emitted
          └─────────────────┴────────────────┬────────────────┴───────────────────────┘ (today: inert)
                                              ▼
                                   onyx_vault (policy + human identity + audit ledger,
                                   seeded from lms-onyx auth; cross-cuts every call)
```

Cutover sequencing (each independently valuable, reversible — matches framework §10 phasing):
1. **Secrets + ports + CORS** (Decision 5) — unblocks co-hosting; zero feature risk.
2. **Extract `onyx-auth` → seed `onyx_vault`** (Decision 2) — gives Meridian its missing human auth.
3. **Promote `onyxos` to org truth** (Decision 3) — Meridian `units` becomes read-through.
4. **Consolidate NL→SQL on ConvBI** (Decision 1) — delete onyx-pulse duplicate.
5. **Harden gateway over LiteLLM** (Decision 4) — budget + egress enforcement at call path.
6. **Build Flow engine** consuming Meridian's already-emitted `events` collection (C9) — the highest-leverage net-new, with `paperclip`'s registry as the adapter pattern.

The load-bearing constraint throughout: **do not rebuild Meridian's spine.** The Task Registry, employee lifecycle, policy/deploy gates, agent-principal identity, audit ledger, and pricing-aware gateway are shipped (v0.3.0, 35 passing tests). Every accelerator above either *extends a named Meridian module* or *plugs an external service into a contract Meridian already exposes* (`adapters/base.py`, `set_extractor`, `model_gateway.route()`, the `events` bus).

Relevant absolute paths for execution: `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/{gateway/model_gateway.py, governance/policy.py, governance/identity.py, services/event_service.py, services/ingest_service.py, adapters/registry.py}`, `/Users/palivelasrihari/onyx_all/lms-onyx/{http_middleware.py, services/auth_service.py, controllers/streaming_controller.py}`, `/Users/palivelasrihari/onyx_all/ConvBI/convBI/agents/text_to_sql.py`, `/Users/palivelasrihari/onyx_all/onyx-pulse/{db_configs.json, tools/plotfactory/, agents/sql_generation.py}`, `/Users/palivelasrihari/onyx_all/onyxos/schemas/organization.py`, `/Users/palivelasrihari/onyx_all/onyx_vault/`, `/Users/palivelasrihari/onyx_all/paperclip/server/src/adapters/registry.ts`.

I'll write section 10. This is a planning/authoring task grounded in the dossier; no code exploration is needed since the dossier is exhaustive and I'm authoring one markdown section.

---

## 10. Phasing Overview & Timeline Reconciliation

The external commitment from the Fakhruddin brief is unambiguous: **V1 live by end-Oct 2026, with the pilot live before it.** The plan reconciles all dates to a single timeline and shows the EW math that supports it.

| Phase | Scope | EW | Calendar (target) |
|---|---|---|---|
| **P0** | Secrets/safety + auth + Vault + Gateway enforcement | ~15.5 EW | now → mid-Jul 2026 |
| **P1** | Pilot wedge across six departments | ~25 EW | mid-Jul → **pilot live mid-Sep 2026** |
| **P2** | Agent runtime, super-agents, Pulse grounding, charters | ~13 EW | mid-Sep → early-Oct |
| **P3** | Flow engine, earned autonomy, cross-unit — **V1 GA gate** | ~23 EW | early-Oct → **GA end-Oct 2026** |
| **P4** | Lifecycle completeness + optimization | ~4+ EW | post-GA |

**Timeline reconciliation (correcting the earlier contradiction):** earlier drafts variously placed the pilot at "end-Aug," the roadmap at "~Oct," and GA at "end-Oct." These are now reconciled to **one** timeline: **pilot live mid-Sep, V1 GA end-Oct.** The end-Aug pilot date is withdrawn because the critical path makes it arithmetically impossible.

**Critical-path EW math:** the pilot spine is `E0 → E13 → E10 → E12 → {E2, E11} → E14`. With parallelization across an ~6-engineer team, P0's 15.5 EW lands in ~4 calendar weeks of wall-clock (mid-Jul); the P1 spine (E2 3 + E11 5 + E14 6, with E1/E15 parallel) adds ~14 EW of serial dependency along the longest chain. Summed along the strict serial chain the pilot needs **~22 EW of critical-path work**, which at the team's parallel throughput resolves to **mid-Sep at the earliest** — not end-Aug. GA (adding P2's runtime + P3's Flow as the V1 gate) lands end-Oct. The phases are independently valuable and each is reversible.

---

---

## 11. The Economics Layer — Effectiveness, Cost, ROI

### 11.3 Per-task KPI catalog (the full 8-KPI set)

The KPI catalog has **exactly eight** KPIs, all defined here (the earlier table was cut off; the full set is enumerated so §11.10 step 3's "8-KPI catalog" matches):

| # | KPI | Definition | Source | Band: healthy / at_risk / breaching |
|---|---|---|---|---|
| 1 | **Completion rate** | shipped (`_task_rollup`) | `tasks` | ≥85% / ≥60% / <60% |
| 2 | **Escalation rate** | % tasks hitting `task.escalated` | `events` | ≤10% / ≤25% / >25% |
| 3 | **Win rate** (deal stages) | terminal `done` with positive outcome | `tasks` + outcome tag | domain-set |
| 4 | **Override rate** (keystone) | accept vs edit vs dismiss at `approval_service.decide` (proposal-approval type) | `approvals` | ≤15% / ≤30% / >30% |
| 5 | **Rework rate** | % committed tasks re-opened / re-edited after accept | `tasks` + `events` | ≤10% / ≤20% / >20% |
| 6 | **SLA adherence** | % tasks meeting due/SLA window | `tasks` + Flow scheduler | ≥90% / ≥75% / <75% |
| 7 | **Turnaround time** | median created→done per task-type | `tasks` | domain-set |
| 8 | **Approval rate** | % proposals committed (accepted) of those decided | `approvals` | ≥70% / ≥50% / <50% |

**Override rate is the keystone effectiveness metric.** It is the direct runtime measurement of the "effectiveness gap": a high override rate means proposals aren't trustworthy enough to commit, and per §7.6 must trigger an Ensure auto-demote of that (employee × task-type) down the autonomy ladder.

**Data-source dependency (corrected).** Override rate is computed the moment `approval_service.decide` records an **edit/dismiss vs accept** — but this requires a **proposal-approval type** that the current build does **not** have. Today `Approval` models only `deploy / decommission / autonomy_promote / budget_override`; there is **no task-level proposal/accept/edit/dismiss type**. Therefore override rate has **no data source until the "AI proposes → human commits" workspace (E15) introduces a `proposal` approval type** with `{accept, edit, dismiss}` decisions. **E11's override-rate KPI explicitly depends on E15/E10 adding this type; before it lands, the metric reads zero and must be displayed as "not yet instrumented," never as 0% override.**

Two distinct angles, both surfaced per task: **explainability** ("why did it behave that way?") — `RoutingDecision.reason`, policy decision rows, proposal rationale; **observability** ("it went wrong — do I know why?") — the immutable `audit_ledger` + `CostEvent` + `Run.error`/`Run.summary`.

### 11.4 Cost-trace per stage transition

The headline requirement: *given 1000 leads, what does it cost to move prospect→qualified?* Today `CostEvent` attributes cost to `unit_id`/`employee_id`/`run_id` only. Add columns so cost rolls up task → stage-transition → workflow (Treppan derives stage cost via `run → lead → lifecycle_stage`):

```
CostEvent (extended)
  unit_id · employee_id · run_id · model · in/out_tok · cost_usd   ← shipped
+ task_id · from_stage · to_stage · execution_mode · cache_hit · cached_usd_saved
```

**`execution_mode` enum (aligned to Treppan's `executed_by` taxonomy, corrected).** The earlier 3-mode model (`{Deterministic, Workflow+Policy, AI Agent}`) omitted **human** and **hybrid**, so the cost-of-human and HITL-dwell terms in §11.5 had nowhere to be attributed on the CostEvent. The enum is now the **full set, aligned to Treppan's `executed_by ∈ {workflow, ai, human, hybrid}` plus TESPL's Hybrid + pure Human rows**:

```
execution_mode ∈ { deterministic, workflow_policy, ai_agent, hybrid, human }
```

This gives the §11.5 cost-of-human term a first-class home on the CostEvent and lets HITL dwell be attributed to the `human`/`hybrid` modes rather than being stranded outside the cost model.

`cost_service.stage_trace(unit_id, from_stage, to_stage)`:

```
prospect → qualified      (sample: 1000 leads, 30-day window)
─────────────────────────────────────────────────────────────
 mode            tasks         runs   model              Σ cost   $/lead
 deterministic   #1,#2,#25      0      internal/$0        $0.00    $0.0000   (rules/formulas)
 workflow_policy #6 cadence     0      internal/$0        $0.00    $0.0000   (policy engine)
 ai_agent        #3 first-touch 1000   internal/onyx-llm  $0.00    $0.0000   (on-prem SLM, _PRICING=0.0)
 ai_agent        #8 summarizer  620    azure/gpt-4o       $9.30    $0.0093
 hybrid          #8 review gate 620    —/human dwell      (HITL)   (see §11.5)
─────────────────────────────────────────────────────────────
 STAGE TOTAL (AI compute)                                 $9.30    $0.0093 / lead moved
```

The shipped `_PRICING` table already makes `internal/onyx-llm` cost **$0.00** — the on-prem-first cost win is structurally encoded. The cost lever (§4.2) is visible as a column: deterministic and workflow_policy rows contribute $0 by construction, so stage economics is dominated by which fields the designer routed to **ai_agent** vs a rule, plus the residual **hybrid/human** HITL dwell.

### 11.5 Cost-to-automate vs cost-of-human

```
cost_of_human(task)    = human_minutes_observed/60 × loaded_hourly_rate(role)
cost_to_automate(task) = Σ CostEvent.cost_usd (ai_agent/deterministic/workflow_policy)   (AI compute)
                       + approval_dwell_min/60 × loaded_hourly_rate(caretaker)  (residual HITL, mode=hybrid/human)
                       + amortized_build_cost / volume                  (optional)
savings_ratio(task)    = cost_of_human / cost_to_automate
```

`loaded_hourly_rate` lives as unit config. The residual-HITL term is the honest one: an AI task that still demands a 12-minute human edit on every proposal is *not* fully automated, and its `cost_to_automate` reflects that — which is how the comparison resists the cost-inversion failure mode. Because `execution_mode` now includes `hybrid`/`human`, this residual term is attributed directly on the CostEvent rather than reconstructed. When `savings_ratio < 1` **or** override rate is breaching, Ensure flips the task to human-responsible (the §4.8 dial; same state machine).

### 11.6 The human-attention / compression budget

Net-new — no attention meter ships today, but the substrate does: every HITL decision flows through `approval_service` with `created_at` and decided-at. `attention_service` meters `dwell = decided_at − created_at` per `Approval`, rolls up per employee/unit/task-type, and compares to a configured `attention_budget_minutes` (default 15):

```
ATTENTION (Sales-blueprint unit, 30d)
  approvals decided        1,420
  median dwell             3m 10s   ✓ under 15m budget
  total human time         ~100h
  vs pre-automation est.   ~417h     →  compression 4.2×
```

**Internal consistency (corrected).** Earlier drafts cited both 4.1× (310h→74.8h) and 4.2× (417 SDR-h→100 caretaker-h). The plan now uses **one** attention-compression figure throughout — **4.2× (417 SDR-hours → ~100 caretaker-hours)** — consistent with the unit-economics model in §11.9. The compression ratio (human-time-before ÷ human-time-now-in-queue) is the platform's north-star ROI proof at the **people** layer, distinct from the **dollar** ROI in §11.8/§11.9.

### 11.7 Budgets & enforcement — extending the shipped hard-stop

The shipped `_enforce_budget` is correct but has **five** documented gaps (the earlier prose said "three" while listing five — corrected). Extend in place.

**A naming-and-semantics bug to fix first:** the shipped function triggers on `spent_usd ≥ monthly_usd`, but `spent_usd` is **lifetime-accumulated with no monthly window**. The shipped "monthly" budget is therefore a **lifetime budget mislabeled** by the `_monthly` field name. **E12 fixes a naming + semantics bug, not merely "adds a window":** it must introduce a real window *and* correct the misleading `_monthly` naming/semantics.

| # | Gap | Build (on the shipped function) |
|---|---|---|
| 1 | **Lifetime spend mislabeled "monthly"; no window** | Add `budget_window_start`; compute `window_spent = Σ CostEvent.cost_usd where occurred_at ≥ window_start`; reset monthly. Keep `spent_usd` as the honest lifetime total. Rename/clarify the field so "monthly" means monthly. |
| 2 | Single scope | Hierarchical **company ⊃ unit ⊃ employee ⊃ task-type**; deny when *any* enclosing budget is breached. |
| 3 | No early warning | Emit `budget.warn` event + dashboard chip at 80%/95% before the 100% hard-stop. |
| 4 | `max_actions_per_hour` stored, not enforced | Count runs in trailing hour from `runs`; over-limit → deny run with Conflict. |
| 5 | Over-budget = hard suspend only | Add **downgrade** path: route to cheaper `internal/*` model via `model_gateway.route` when policy allows. |

The hard-stop chain — suspend → open `BUDGET_OVERRIDE` approval → audit — is preserved verbatim as the 100% backstop. The Model Gateway is the cost-control choke point (§7.5); budget enforcement at `route()` time is the gateway-side complement to the meter-side enforcement that ships today.

### 11.8 ROI on the digital twin

`dashboard_service.build_unit_dashboard` already returns spend/budget/utilization + commitment roll-up. Add an `economics` block.

**One ROI definition, used consistently (corrected).** Earlier drafts presented two incompatible ROI numbers — a `roi_ratio: 44.3` computed on **AI compute only** (ignoring the $4,000 residual-HITL term) and a **4.1×** all-in ratio. The 44.3 figure is **misleading** because it omits the very residual-HITL term §11.5 says makes the comparison honest. **The plan adopts a single, all-in ROI definition (cost-of-human ÷ cost-to-automate *including* residual HITL) and drops the 44.3 figure entirely.** The 44.3-style compute-only ratio, if ever shown, must be relabeled "compute-only headroom (excludes HITL)" and never called ROI.

```jsonc
"economics": {
  "spend_usd": 9.30,                    // from shipped CostEvent roll-up (AI compute)
  "residual_hitl_usd": 4000.00,         // §11.5 hybrid/human dwell
  "cost_of_human_equiv_usd": 16667.00,  // §11.9 human-only baseline / 1000 leads
  "cost_to_automate_all_in_usd": 4031.50, // AI compute + residual HITL
  "savings_usd": 12635.50,
  "roi_ratio_all_in": 4.1,              // SINGLE definition: human ÷ all-in automate
  "attention_compression": 4.2,         // §11.6
  "cost_per_stage": { "prospect→qualified": 0.0093, "qualified→proposal": 0.041 },
  "cost_per_action_blended_ai": 0.0315, // AI compute only, explicitly labeled
  "cost_per_lead_all_in": 4.03,         // all-in, the binding number
  "override_rate": 0.08, "completion_rate": 0.86,
  "budget_status": "healthy"            // healthy <80 / warn <95 / hard_stop ≥100
}
```

This stays a **read-model projection** (§8) — no new source of truth. Prism consumes it for the predictive layer; the `AgentStat` contract and `KpiCard`/`AgentTable` frontend (`fmtCost`/`fmtCpa`, 4-decimal) are the proven render layer to reuse.

### 11.9 Illustrative unit-economics model — 1000 leads through the CRM lifecycle

**Scope note (corrected — this is a blueprint, not a pilot department).** This worked example models the **CRM lead-lifecycle as a proof/blueprint of the cost model**. It is **Sales-centric**, and **Sales is NOT one of the six pilot departments** (the pilot six are Operations, Projects, FIS, Customer Service, Marketing, Legal — see §13.3). The Sales/SDR KPIs and lead economics below are an **illustrative blueprint demonstrating the engine**, and must **not** be read as pilot scope or pilot KPIs.

All figures are **illustrative assumptions with stated sensitivity**, not measured results.

Modeling 1000 prospects through Treppan's 8-stage map with realistic funnel attrition and shipped pricing (`internal/onyx-llm` = $0, `azure/gpt-4o` = $2.50/$10.00 per 1M):

**Funnel & AI compute cost (per stage transition):**

| Transition | Leads in | AI tasks (mode) | Model | Σ tokens (in/out) | Stage cost | $/lead |
|---|---:|---|---|---|---:|---:|
| capture→prospect | 1000 | #1 dedupe (deterministic), #2 assign (workflow_policy) | — | 0 | $0.00 | $0.0000 |
| prospect→qualified | 1000 | #3 first-touch, #8 summarize, #7 classify (ai_agent) | internal SLM | (on-prem) | $0.00 | $0.0000 |
| ↳ spillover to gpt-4o | 1000 | #8 long calls 30% | azure/gpt-4o | 2.4M / 0.9M | $15.00 | $0.0150 |
| qualified→proposal | 480 | #9 reply draft, #15 rerank (ai_agent) | internal SLM | (on-prem) | $0.00 | $0.0000 |
| proposal→negotiation | 240 | #16 shortlist, #20 offer assist | azure/gpt-4o | 1.4M / 0.6M | $9.50 | $0.0396 |
| negotiation→closed | 96 | #29 funnel narrator | azure/gpt-4o | 0.8M / 0.5M | $7.00 | $0.0729 |
| cross-cutting | all | #25 SLA, #27 audit (deterministic) | — | 0 | $0.00 | $0.0000 |
| **TOTAL** | | | | | **$31.50** | **$0.0315/lead entered** |

**The economics that matter (cost-to-automate vs cost-of-human, §11.5):**

| Line | Human-only baseline | AI-native (this platform) |
|---|---:|---:|
| AI compute (metered `CostEvent`) | $0 | $31.50 |
| Residual human approval time (attention meter, mode=hybrid/human) | — | 1000 × ~2 gates × 3min × $40/hr ÷ 60 = **$4,000** *(assumption)* |
| Manual SDR labor (1000 × 25 min × $40/hr) | **$16,667** | — (compressed into the $4,000 above) |
| **Total per 1000 leads** | **$16,667** | **$4,031.50** |
| **Savings** | — | **$12,635 (76%)** *(assumption-dependent)* |
| **ROI ratio (all-in, single definition)** | — | **4.1×** |
| **Cost-per-action** | — | **$0.0315 AI compute** / **$4.03 all-in** per lead |
| **Attention compression** | 417 SDR-hours | ~100 caretaker-hours → **4.2×** |

**Sensitivity / downside case (corrected — the headline must show it):**

| Scenario | HITL gates × min | Residual HITL | All-in / 1000 | Savings | All-in ROI |
|---|---|---:|---:|---:|---:|
| **Base (assumed)** | 2 × 3min | $4,000 | $4,031.50 | 76% | 4.1× |
| **Supervised (override breach)** | 4 × 5min | $13,333 | $13,364.50 | 20% | 1.25× |
| **Full Supervised (every step gated)** | 8 × 5min | $26,667 | $26,698.50 | **−60% (cost inversion)** | **0.62×** |

**Reading the model:**
- **The on-prem-first lever dominates compute, but compute is not the binding cost.** Because `_PRICING["internal/onyx-llm"] = (0.0, 0.0)` ships today, routing first-touch, reply-draft, rerank, and classification to the internal SLM makes ~70% of AI tasks cost $0. The entire $31.50 comes from the 30% spillover and high-effort tasks on `azure/gpt-4o`. This is the cost lever from §4.2 made literal.
- **The "~500× compute headroom" is real but not the headline.** $0.0315/lead AI compute vs $16.67/lead human is ~500× *on the compute side only* — but the **binding cost is the $4.03 all-in/lead**, which is **4.1×** cheaper than human, **not 500×**. The 500× figure is illustrative of the compute lever, never the savings claim. The binding constraint is **residual HITL time**, which the attention budget (§11.6) measures and minimizes.
- **The 76% savings is entirely contingent on the unvalidated "2 gates × 3min" HITL assumption.** As the sensitivity table shows, if override rate forces **Supervised** mode, HITL minutes rise and savings collapse — to 20%, and at full supervision into **cost inversion (ROI < 1)**.
- **The effectiveness gap is governed**, not assumed: if first-touch override breaches (>30%), Ensure auto-demotes it to Supervised, HITL minutes rise, the residual-HITL term grows, the savings ratio falls — the model self-corrects, and the dial (§4.8) can flip the task to human-responsible without re-architecting.

### 11.10 Build sequence

| Step | Deliverable | Touches (shipped files) |
|---|---|---|
| 1 | Extend `CostEvent` with `task_id`, `from_stage`, `to_stage`, `execution_mode` (full 5-value enum), `cache_hit` | `run_service.py`, `services/store.py` |
| 2 | `cost_service.py` — stage-trace, cost-per-action, mode mix (incl. hybrid/human) | new; reads `cost_events` |
| 3 | `kpi_service.py` — **full 8-KPI catalog** (§11.3) + bands; override-rate from `approvals` (proposal type, depends on E15/E10) | new; reads `tasks`,`approvals`,`audit_ledger` |
| 4 | `attention_service.py` — approval dwell meter + compression ratio (4.2×) | new; reads `approvals` |
| 5 | Windowed + multi-scope + warn-threshold budgets; `max_actions_per_hour`; downgrade path; fix `_monthly` naming/semantics | extend `run_service._enforce_budget`, `model_gateway.route` |
| 6 | Add `economics` block (single all-in ROI) to dashboard | extend `dashboard_service.build_unit_dashboard` |
| 7 | Frontend cost ledger + KPI strip | port Treppan `AgentTable.tsx`, `KpiCard.tsx`, `PolicyTable.tsx` |
| 8 | Prism wires predictive ROI / budget-blowout forecast | `onyx-pulse`/`ConvBI` consume the read-model |

Steps 1–6 are pure aggregation/enforcement over existing collections — no new infrastructure, consistent with the in-memory/Mongo `Store` abstraction and the zero-infra boot guarantee. Step 3's override-rate KPI is gated on the proposal-approval type shipping in E15/E10.

---

---

## 12. Build-vs-Have Gap Analysis, Backlog & Risks

This section reconciles the canonical spec against what **onyx-meridian v0.3.0** has shipped, what is **reusable** from the five sibling repos, and what is **net-new**. The job is to fill the seven structural holes — **agent runtime, Flow engine, Model Gateway enforcement, policy catalog/versioning, Ensure evals, human auth, connectors** — without rewriting the spine.

### 12.1 Reading the three statuses

| Status | Meaning | Implication |
|---|---|---|
| **SHIPPED** | Working in `onyx-meridian` today | Extend in place. Never re-implement. |
| **REUSE** | Exists in a sibling repo; lift as library or pattern | Wrap, harden, consolidate — do not fork. |
| **NEW** | Nowhere in the codebase | Greenfield build; size it honestly. |

### 12.2 The master gap table (capability → status → target module/epic)

#### A. Canonical Model & Ingestion (L1–L3, Pulse)

| Capability | Status | Evidence / source | Target → Epic |
|---|---|---|---|
| Core entities (Unit, AIEmployee, Person, Document, Project, Task, Run, Approval, AuditEvent, Event, Principal) | **SHIPPED** | `schemas/*.py`, `store.py` | — (frozen) |
| **Customer** + **Asset** entities | **NEW** | "No Customer or Asset entities" | `schemas/{customer,asset}.py` → **E1** |
| Entity graph **traversal** (relations that *police* automation) | **NEW** | "id-references only" | `domain/graph.py` schema → **E1**; **edge-guard runtime enforcement → E10** |
| Meeting → Document → Task with provenance | **SHIPPED** | `ingest_service.py`, `HeuristicExtractor` | extend → **E2** |
| **LLM commitment extractor** | **NEW** (hook exists) | `set_extractor` unused | `services/extractors/llm_extractor.py` → **E2** |
| Audio/video transcription (audio-discarded) | **REUSE** | lms-onyx transcription services | thin client → **E2** |
| **Minimal Pulse/RAG grounding slice for the extractor** | **NEW (P1 slice)** | §13.3 "grounded by Pulse" | thin RAG client backing E2 → **E2a (pulled into P1)** |
| **Connector framework** | **NEW** | "No connector framework" | `connectors/{base,registry}.py` → **E3** |
| Full knowledge layer / 7 context layers (Pulse) | **REUSE** | lms-onyx `streaming_controller.py`, Qdrant | called via gateway → **E9** |

**Note on entity-graph traversal policing (corrected).** The framework (§1, L3) requires the entity graph to *police* automation: agents may move only along **sanctioned edges**. This is **not** merely a schema addition. E1 ships the `domain/graph.py` schema/edges (3 EW); the **edge-guard enforcement** (agents traverse only sanctioned relations) is a **distinct deliverable tied to E10's runtime authorization**, called out explicitly so the L3 "graph polices traversal" requirement is actually built, not just modeled.

**Note on Pulse grounding for the pilot (corrected).** §13.3 says the pilot extractor is "grounded by Pulse," but the full Pulse integration (E9) is P3. To make the claim true, a **minimal Pulse/RAG grounding slice (E2a)** is **pulled into P1** to back E2. If that slice slips, the "grounded by Pulse" claim is dropped from the pilot description rather than left as an unbacked promise.

#### B. AI Employees & Runtime (L5–L6)

| Capability | Status | Evidence | Target → Epic |
|---|---|---|---|
| Employee anatomy | **SHIPPED** | `schemas/employee.py` | — |
| 5-state lifecycle + version bump | **SHIPPED** | `domain/lifecycle.py` | — |
| Autonomy ladder | **SHIPPED** (mechanics) | `AUTONOMY_LADDER`, deploy→SHADOW | gate with real evals → **E7** |
| Archetype instantiation | **SHIPPED** | `schemas/archetype.py` | seed catalog → **E6** |
| **Real agent runtime** (plan→recall→act→observe) | **NEW** (only `echo`) | "No real agent runtime" | `adapters/{lms_onyx,http_webhook,claude}.py` → **E5** |
| Adapter/skills/teams catalog pattern | **REUSE (pattern)** | paperclip `registry.ts` | informs `adapters/registry.py` → **E5/E6** |
| **Tiers T1–T4 behavior** + super-agent | **NEW** (stored only) | "Tiers carry no behavior" | `domain/superagent.py` → **E8**; **minimal T4 intake→assign → E8a (pulled into P2)** |
| `per_task_autonomy` enforcement | **SHIPPED (stored)** / **NEW (enforced)** | stored, no behavior | runtime → **E5/E7** |

**Note on the super-agent gap in the pilot (corrected).** The brief mandates "one super-agent per department," and the business-unit definition is `1 T4 + N employees + caretaker`. Full super-agent + cross-unit (E8) is P3, so the pilot's six departments would otherwise ship with **no T4 orchestration**. Two-part fix: (1) the pilot is **explicitly scoped as "no full super-agent yet — the caretaker orchestrates intake/assignment"** (stated in §13.3); and (2) a **minimal T4 intake→assign slice (E8a) is pulled into P2** so departments get basic T4 routing before GA, with the full cross-unit orchestration arriving in P3.

#### C. Flow — Orchestration

| Capability | Status | Evidence | Target → Epic |
|---|---|---|---|
| Domain event bus (append-only) | **SHIPPED** | `event_service.py` | feed into Flow → **E4** |
| **Flow engine — durability decision (see below)** | **NEW** | "Events consumed by nothing" | `flow/{engine,dispatcher,state}.py` → **E4** |
| Execution-mode routing | **REUSE (blueprint)** | treppan `workflow_engine._dispatch` | port → **E4** |
| Trigger catalog | **REUSE (blueprint)** | treppan `TRIGGERS` (33), 2 live | `flow/triggers.py` → **E4** |
| **Scheduler** (SLA/cadence/stall) | **NEW** | treppan: "no scheduler" | `flow/scheduler.py` → **E4** (requires durable substrate) |
| Cross-unit workflow / handoff | **NEW** | spine #3 | `flow/cross_unit.py` → **E8** |
| **Reversibility / automation dial / human-fallback** | **NEW** | §4.8, principle #10 | `flow/automation_dial.py` → **E4a (split out to P1)** |

**Flow durability decision (corrected — the substrate contradiction is now resolved).** The framework and both dossiers (TESPL: "Temporal is the spine") require **durable, replayable** orchestration with idempotency. Treppan's dispatcher is explicitly **synchronous, in-process, advisory, with no Temporal/Celery/scheduler**. The plan now **names the durability target explicitly**:

- **For V1 GA, Flow MUST be durable-execution class** (a Temporal-style durable-execution library or Temporal itself). Replayability and idempotency are **stated framework requirements**, and the **scheduler (SLA/cadence/stall) is unbuildable on a pure synchronous post-commit dispatcher** — it needs durable timers.
- **Migration path:** **P3 begins** by porting Treppan's data-driven advisory dispatcher as the behavioral blueprint (triggers, execution-mode routing), then **lands the durable-execution substrate within E4 before GA** — the dispatcher is the *blueprint*, the durable engine is the *target*. "Add durable timers incrementally" is **no longer** the V1 position; durable execution is a **GA gate**, because the scheduler and replayable cross-unit handoffs depend on it.

#### D. Vault — Governance

| Capability | Status | Evidence | Target → Epic |
|---|---|---|---|
| Policy Engine: config + deploy authz | **SHIPPED** | `governance/policy.py` | — |
| **Per-action runtime authorization** | **NEW** | "no per-action runtime authz" | `policy.py::authorize_action` → **E10** |
| **Versioned policy catalog (true `version` column / append-only revisions)** | **NEW** | "no catalog, no versioning" | `governance/catalog.py` + `policies` collection → **E10** |
| **Policy inheritance: central→unit→employee, narrow-never-widen** | **NEW** | framework §6.3, principle | hierarchical scope check → **E10** |
| Policy catalog content (P1–P17 / P1–P14) | **REUSE (content only)** | treppan `policy_catalog.py`; TESPL | seed P-content → **E10** |
| Policy effectiveness (0–100, bands, brain) | **REUSE (blueprint)** | treppan `policy_service.py` | `ensure/policy_effectiveness.py` → **E11** |
| Audit ledger (append-only) | **SHIPPED** | `audit_service.py` | add hash-chain → **E10** |
| **Hash-chaining / export / retention** | **NEW** | "no hash-chaining" | `audit_service.py` → **E10** |
| **Separation of duties (configurer ≠ approver ≠ auditor)** | **NEW** | framework §8.7; DoD | distinct RBAC roles → **E13** |
| Agent identity / principal credential | **SHIPPED** | `governance/identity.py` | — |
| **Scope enforcement at runtime** | **NEW** | "scope claims not enforced" | middleware + `authorize_action` → **E10** |
| Model Gateway: routing + pricing | **SHIPPED (stub)** | `gateway/model_gateway.py` | wrap LiteLLM → **E12** |
| **Gateway enforcement** (budgets, egress/PII, routing, cache) | **NEW** | "pure pricing stub" | `gateway/litellm_proxy.py` + `egress.py` → **E12** |
| Multi-LLM provider client | **REUSE/consolidate** | shared `llms/` | `gateway/providers.py` → **E12** |
| Budget hard-stop | **SHIPPED** | `run_service._enforce_budget` | add window + per-scope + fix `_monthly` semantics → **E12** |
| **Human auth / IdP / RBAC / sessions** | **NEW** to meridian; **REUSE** source | "No human auth"; lms-onyx | `auth/` lib → **E13** |
| Org/registry single source of truth | **REUSE/consolidate** | onyxos | meridian reads onyxos → **E13** |

**Note on policy versioning faithfulness (corrected).** The Treppan dossier is explicit: policies have **no `version` column** — versioning is via **in-place edit + soft-delete**, and immutable history lives only at the execution layer (`workflow_executions`). The framework requires a **versioned** catalog with policy memories. Therefore **E10 must ADD true versioning Treppan never had** — a `version` column / append-only policy revisions — and **must NOT inherit Treppan's in-place-edit model.** E10 seeds the *policy content* from Treppan/TESPL while building the *versioning mechanism* itself.

**Note on inherit-and-narrow enforcement (corrected).** The framework requires units/employees to **inherit central policies and may only narrow, never widen.** The current build's `authorize_configuration` does wildcard-aware least-privilege for a **single actor at config time**, but there is **no central→unit→employee inheritance/narrowing mechanism.** E10 adds an **explicit hierarchical policy-inheritance/narrowing scope check**, distinct from the existing single-actor least-privilege check.

#### E. Ensure — Observability & Improvement

| Capability | Status | Evidence | Target → Epic |
|---|---|---|---|
| Cost roll-up per unit | **SHIPPED** | `dashboard_service.py` | extend to per-stage → **E11** |
| Commitment roll-up | **SHIPPED** | `dashboard_service` | — |
| **Cost trace per stage transition** | **NEW** | §4.7; treppan derivable only | `ensure/cost_trace.py` → **E11** |
| Cost-to-automate vs cost-of-human | **NEW** | §11.5 | `ensure/roi.py` → **E11** |
| Per-agent cost/KPI ledger | **REUSE (blueprint)** | treppan `agent_analytics_service.py` | `ensure/agent_analytics.py` → **E11** |
| **Real evals + promotion gates** | **NEW** | "promotion trusts caller's flag" | `ensure/evals.py` → **E7** |
| **Drift detection → auto-demote** | **NEW** | "no drift detection" | `ensure/drift.py` → **E7** |
| **Knowledge-miss detection → auto-create expert task (closed loop)** | **NEW** | §7.6 | `ensure/knowledge_gap.py` detection **+ auto-created domain-expert task** → **E11** |
| Explainability + observability traces | **REUSE/consolidate** | scattered Langfuse | unify → **E11** |

**Note on the knowledge-miss closed loop (corrected).** The framework requires **knowledge-miss → task for domain expert** as a **closed loop**, not just detection. E11 now ships both halves: `knowledge_gap.py` **detects** the miss **and auto-creates a Task Registry record assigned to the relevant domain expert**, closing the loop.

#### F. Prism — Digital Twin & Experience

| Capability | Status | Evidence | Target → Epic |
|---|---|---|---|
| Read-only unit dashboard | **SHIPPED** | `dashboard_service.py`, `ui/DashboardPage` | — |
| **Predictive twin** | **NEW** | "not predictive" | `prism/twin.py` → **E14** |
| Leadership KPI/exception view + drill | **NEW** | §8 | `prism/leadership.py` → **E14** |
| NL→SQL / ConvBI | **REUSE/consolidate** | ConvBI `text_to_sql.py`; delete onyx-pulse dup | shared `nl2sql` lib → **E14** |
| Charts + dashboards + report gen | **REUSE** | onyx-pulse `plotfactory`, `routers/graph.py` | keep on top of ConvBI → **E14** |
| Backend-driven render contract | **REUSE (pattern)** | treppan-frontend `KpiCard`, ECharts blob | adopt → **E14** |

#### G. Experience / UI (HITL surfaces)

| Capability | Status | Evidence | Target → Epic |
|---|---|---|---|
| Admin console (units/employees/lifecycle/tasks/approvals/ingest) | **SHIPPED** | `ui/src/pages/*` | — |
| **One-tap approval queue as first-class surface** | **NEW** (queue exists, not the surface) | §4.6 | `ui/ApprovalQueue` → **E15** |
| **Proposal approval type (accept/edit/dismiss) for AI task proposals** | **NEW** | §11.3 keystone metric | `Approval` type extension → **E15/E10** |
| "AI proposes → human commits" workspace | **REUSE (port)** | treppan `LeadAISpace.tsx` | → **E15** |
| HITL / executed-by badges + engine audit | **REUSE (port)** | treppan `WorkflowsPage.tsx` | → **E15** |
| Provenance timeline | **REUSE (port)** | `LeadAISpace.tsx` activities rail | → **E15** |
| Pages for Projects/Persons/Documents/Events/Runs/audit browser | **NEW** | "No pages for…" | `ui/src/pages/*` → **E15** |
| Human login/auth UI | **NEW** | "No auth/login" | `ui/` + auth lib → **E13** |

**Note on the proposal approval type (corrected).** The keystone override-rate metric (§11.3/§11.4) has **no data source** until a **`proposal` approval type with `{accept, edit, dismiss}` decisions** exists. E15 introduces this type as part of the "AI proposes → human commits" workspace, and E11's override-rate KPI explicitly depends on it.

### 12.3 Epic backlog with rough sizing

Sizing is **engineer-weeks (EW)**, T-shirt in parentheses. Dependencies reference epic IDs; phases map to §10. **All phase/dependency inversions from earlier drafts are corrected: no P1 epic depends on a P3 epic.**

| ID | Epic | Size | Reuse leverage | Depends on | Phase |
|---|---|---|---|---|---|
| **E0** | Secret remediation + repo hardening (rotate Aiven across **all** sibling histories, purge history, **purge + scan checked-in data artifacts**, CORS, ports, pepper, read-only DB users, gitleaks) | 2 EW (S) | — | — | **P0 wk 1, blocking** |
| **E13** | Human auth/IdP + RBAC + sessions; **separation-of-duties roles (configure/approve/audit)**; consolidate onyxos as org SoT; **unit/workforce cascade kill-switch** | 5 EW (L) | lms-onyx auth; onyxos org | E0 | P0 |
| **E10** | Vault hardening: `authorize_action`, **true-versioned catalog (`version` column/append-only) + memories**, **central→unit→employee inherit-and-narrow check**, **graph edge-guard enforcement**, runtime scope enforcement, audit hash-chain, **RERA evidence retention mapping** | 6 EW (L) | treppan policy *content*; paperclip govern. pattern | E13 | P0 |
| **E12** | Model Gateway enforcement: LiteLLM proxy, multi-scope budgets + **monthly window (fix `_monthly` semantics)**, egress/PII, provider consolidation | 5 EW (L) | meridian `model_gateway`; lms-onyx LiteLLM | E10 | P0 |
| **E2** | Meeting intelligence: LLM extractor via `set_extractor`, transcription client, audio-discard | 3 EW (M) | meridian hook; lms-onyx transcription | E12 | **P1** |
| **E2a** | **Minimal Pulse/RAG grounding slice backing E2's extractor** | 1.5 EW (S) | lms-onyx agentic-RAG | E12 | **P1** |
| **E1** | Canonical model completion: Customer + Asset, entity-graph schema (edge-guard *enforcement* lives in E10) | 3 EW (M) | meridian `schemas/`, `store.py` | — | P1 |
| **E4a** | **Automation dial / reversibility primitive (any AI task → human-responsible; unit revert)** — split out of E4 (framework non-negotiable #10) | 2 EW (M) | meridian lifecycle | E10 | **P1** |
| **E11** | Ensure v1: cost trace per stage (derived from **Task/Run→stage**, no Flow dependency), ROI (single all-in definition), agent analytics, **knowledge-miss closed loop (detect + auto-create expert task)**, Langfuse unification | 5 EW (L) | treppan analytics; meridian `dashboard_service` | E10, **E15** | P1 |
| **E14** | Prism twin: predictive twin, leadership drill, NL→SQL (ConvBI) + charts (onyx-pulse) consolidation | 6 EW (XL) | ConvBI, onyx-pulse, treppan-frontend | E11, E13 | **P1** |
| **E15** | HITL experience: one-tap queue, **proposal approval type (accept/edit/dismiss)**, AI-proposes workspace, provenance timeline, missing entity pages | 5 EW (L) | treppan-frontend `LeadAISpace`, `WorkflowsPage` | E13 | P1 |
| **E5** | Real agent runtime: adapters (lms-onyx streaming, http-webhook, claude), plan→recall→act loop | 6 EW (XL) | meridian `adapters/base`; lms-onyx; paperclip | E10, E12 | P2 |
| **E6** | Archetype + skill/teams catalog (seed from CRM/RTQ agents) | 2 EW (M) | meridian `archetype`; treppan `agent_catalog` | E5 | P2 |
| **E8a** | **Minimal T4 super-agent intake→assign per department** (caretaker-orchestrated pilot upgraded to basic T4) | 2 EW (M) | RTQ super-agent spec | E5 | **P2** |
| **E3** | Connector framework (read-only typed: email, Teams, CRM, ERP) — internal-first | 5 EW (L) | paperclip pattern | E5, E10 | P2 |
| **E4** | **Flow engine**: **durable-execution substrate (Temporal-class)**, trigger catalog, execution-mode dispatch, scheduler (SLA/cadence/stall), durable cross-unit handoff | 8 EW (XL) | treppan `workflow_engine`/`catalog` *blueprint*; RTQ | E10, E1, E4a | **P3 — V1 GA gate** |
| **E7** | Earned-autonomy loop: real evals, promotion gates, drift→auto-demote | 4 EW (L) | meridian ladder; Ensure (E11) | E11, E5 | P3 |
| **E8** | Super-agents (T4 full) + cross-unit orchestration | 5 EW (L) | meridian tier fields; RTQ super-agent spec; E8a | E4, E5, E8a | P3 |
| **E9** | Pulse integration: full cited RAG / 7 context layers grounding via gateway | 4 EW (L) | lms-onyx agentic-RAG | E5, E12, E2a | P3 |
| **E16** | Lifecycle completeness: actuate decommission reassignment + escalation REASSIGN/notify | 2 EW (M) | meridian `task_service`, `lifecycle` | E4 | P3/P4 |

**Dependency corrections applied (was: errors):**
- **E11 no longer depends on E4.** E11's cost/stage-trace derives from the **SHIPPED Task Registry + Run→Task→stage derivation** (as §11.4 actually describes), making it truly **P1-shippable**. E11 instead depends on **E15** (for the proposal approval type the override-rate KPI needs).
- **E15 no longer depends on E4.** The one-tap queue + proposal type ride the shipped approval substrate; E15 depends only on **E13**.
- **E16 keeps its E4 dependency** (it lives at P3/P4 alongside Flow), but the **reversibility/automation-dial primitive is removed from E4 and shipped as E4a in P1**, so reversibility ships **with the pilot**, not at GA.

**Rough totals:** P0 ≈ 18 EW · P1 ≈ 26.5 EW · P2 ≈ 15 EW · P3 ≈ 23 EW · P4 (E16 + optimize) ≈ 4+ EW.

**Critical path:** `E0 → E13 → E10 → E12 → {E2, E11} → E14` is the spine of the pilot (~22 EW along the strict serial chain). With E15 feeding E11's override KPI and E1/E4a/E2a running in parallel, the pilot lands **mid-Sep**. Flow (E4, durable) and the agent runtime (E5) are the P2/P3 expansion; **durable Flow is the V1 GA gate (end-Oct).**

```
P0 (foundations + safety)        P1 (pilot, live mid-Sep 2026)        P3 (org-wide, GA end-Oct)
┌──────────────────────┐         ┌───────────────────────────┐       ┌──────────────────────┐
│ E0  secrets/hardening │──┐      │ E2  meeting intel          │       │ E4 Flow (DURABLE) GATE│
│ E13 auth+SoD+kill+SoT │──┼────▶ │ E2a minimal Pulse grounding│       │ E5 agent runtime      │
│ E10 Vault per-action  │──┤      │ E1  Customer/Asset/graph   │──┐    │ E7 earned autonomy    │
│ E12 Gateway enforce   │──┘      │ E4a automation dial/revert │  ├──▶ │ E8 super-agt+cross-unit│
└──────────────────────┘         │ E15 HITL + proposal type   │  │    │ E3 connectors         │
                                  │ E11 Ensure cost/ROI (no E4)│  │    │ E9 Pulse full RAG     │
                                  │ E14 Prism twin + dashboard │──┘    │ E16 lifecycle complete│
                                  └───────────────────────────┘       └──────────────────────┘
                                   (Task Registry already SHIPPED)
                                   P2 between: E5/E6/E8a/E3 runtime+T4
```

### 12.4 Risks & mitigations

#### Security

| Risk | Severity | Mitigation | Epic |
|---|---|---|---|
| **Leaked live Aiven Postgres credential** in `onyx-pulse/db_configs.json` (git history) | **Critical — active** | Rotate immediately; purge history (`git filter-repo`); **confirm purge from ALL sibling repo histories, not just onyx-pulse**; move to secret store; add gitleaks to CI | **E0 — day 1** |
| **Checked-in data artifacts** (`dump.rdb`, `graphs.db`, `res.txt`) may contain secrets/PII | **High** | **Purge checked-in data artifacts from history + scan them for secrets/PII** before purge; add to `.gitignore`; gitleaks + PII scan in CI | **E0** |
| **`CREDENTIAL_PEPPER` sourced from settings** (not a real secret store) | High | Move pepper to a real secret store/KMS | E0 |
| Unauthenticated write endpoints (meridian + ConvBI + onyx-pulse) | High | E13 shared auth lib; gate all mutating routes; scope claims enforced at runtime (E10); bind internal-only until then | E13/E10 |
| CORS `*` + credentials (invalid combo) across onyxos/onyx-pulse/lms-onyx | High | Explicit origin allowlist per env | E0 |
| LLM-generated SQL hits DB directly | High | Read-only least-privilege DB role + `sqlglot` validation; no DDL/DML | E14/E0 |
| Data egress to external models (UAE PDPL) | High | Gateway egress: classify + PII-redact before any external prompt; on-prem-first; per-unit external budgets | E12 |
| Audit tamper | Medium | Hash-chain ledger; export/retention; separation of duties (E13) | E10/E13 |
| Agent over-privilege | Medium | Deny-by-default least-privilege (SHIPPED); narrow-never-widen inheritance; runtime scope enforcement; graph edge-guard (E10) | E10 |

#### Technical

| Risk | Severity | Mitigation |
|---|---|---|
| **Flow engine (E4) is XL, durable-execution class, and the GA gate** | High | Pilot does **not** depend on Flow — rides SHIPPED Task Registry + escalation sweep + event bus. P3 ports Treppan's advisory-dispatcher as the *behavioral blueprint*, then **lands a durable-execution substrate (Temporal-class) before GA** because the scheduler and replayable cross-unit handoffs are unbuildable on a synchronous post-commit dispatcher. Keep the "engine never breaks the operation" safety wrapper. |
| Real agent runtime (E5) replacing `echo` | High | Adapter contract is SHIPPED; validate with lms-onyx streaming controller as first real adapter; keep echo for tests; enforce budget/autonomy/timeout at the boundary. |
| Port collisions | Medium | Env-driven distinct ports (E0). |
| Duplicated NL→SQL (ConvBI vs onyx-pulse) | Medium | Consolidate to ConvBI; delete onyx-pulse dup. |
| No migrations/transactions/soft-delete | Medium | Acceptable for pilot; add before P2 scale. |
| paperclip patterns are TypeScript | Low | Architecture reference only; do not import. |

#### Cost

| Risk | Severity | Mitigation |
|---|---|---|
| **Cost inversion** (the named failure mode) | High | Execution-mode discipline (full 5-mode enum); don't collapse mode boundaries (§4.2); effort tags size model tier; gateway budgets + monthly window + auto-suspend (E12); sensitivity-aware ROI (§11.9 shows the downside case). |
| No cost-trace per stage / automate-vs-human yet | Medium | E11 derives via Run→Task→stage (no Flow dependency); ship the comparison as a first-class Ensure surface with a single all-in ROI definition. |
| Budget lifetime-only, mislabeled "monthly", no window/scope | Medium | E12 fixes the `_monthly` naming+semantics bug, adds monthly window + per-scope ceilings + warn thresholds + `max_actions_per_hour`. |

#### Adoption

| Risk | Severity | Mitigation |
|---|---|---|
| "Patchwork not platform" perception | High | Ship the exact pilot triad on the SHIPPED spine; bi-weekly milestones; each phase independently valuable + reversible. |
| Trust gap | High | Every AI output = proposal + rationale + provenance + accept/edit/dismiss (proposal approval type, E15); one-tap queue; shadow mode for every new/changed employee; kill switch per employee/unit/workforce (E13). |
| Ownership-transfer expectation | Medium | Open-source-first, on-prem default, consolidated libs the customer owns. |

#### Data quality

| Risk | Severity | Mitigation |
|---|---|---|
| Heuristic regex misses commitments | High | E2 LLM extractor with provenance + `unresolved_owners`; human reviews extraction; knowledge-miss closed loop (E11) auto-routes gaps to experts. |
| Owner resolution fails | Medium | SHIPPED `unresolved_owners` return; UI manual resolution; entity graph (E1) improves matching. |
| Garbage-in from inconsistent sources | Medium | V1 boundary: internal ops first; customer-facing only after data quality improves; structuring/enrichment pipeline normalizes before Knowledge. |

### 12.5 Definition of Done — an AI-native organization

The platform is "done" for V1 when **every one of these is true and demonstrable**:

**Accountability (the wedge)**
- [ ] Every commitment is a Task Registry record with owner (human **or** AIEmployee), provenance (doc + exact quote), due, dependencies, escalation, `audit_ref`. — SHIPPED, hardened by E2/E16.
- [ ] "Every overdue task across the company" / "who hasn't delivered last week's commitments" answer in seconds with sourced evidence. — E14.
- [ ] Nothing slips silently: escalation fires **before** the deadline and is actuated. — E16.

**Effectiveness**
- [ ] **All 8 KPIs** attributed per task/policy/stage (completion, escalation, win, **override**, rework, SLA, turnaround, approval) on a live dashboard. — E11.
- [ ] Override rate has a real data source via the proposal approval type. — E15/E10/E11.
- [ ] Both explainability and observability available from the audit ledger + traces. — E10/E11.
- [ ] Autonomy promoted/demoted by **real evals + drift detection**, not a trusted flag. — E7.
- [ ] Knowledge-miss closes the loop: a domain-expert task is auto-created. — E11.

**Cost (no cost inversion)**
- [ ] Cost trace per stage transition + cost-to-automate-vs-cost-of-human per operation, with a **single all-in ROI definition**. — E11.
- [ ] Every model call routes through the gateway, on-prem-first, under per-scope budgets with **monthly window (no longer mislabeled)**; over-budget = deny/downgrade + auto-suspend. — E12.
- [ ] Human-attention budget tracked against time in the approval queue. — E11/E15.

**Trust & reversibility**
- [ ] Agent outputs are typed proposals (proposal approval type); committing is a separate HITL-gated step on a one-tap queue with homework attached. — E15.
- [ ] Every task's automation level is adjustable continuously; **any AI task flips to human-responsible; a whole unit can revert** — shipped with the pilot. — **E4a (P1)**.
- [ ] Kill switch suspends employee / unit / whole workforce instantly; in-flight tasks held + reassigned. — **per-employee SHIPPED; unit/workforce cascade + in-flight hold → E13**.

**Governance by construction**
- [ ] *Nothing executes without authorization; nothing happens without a record* — enforced per-action at runtime. — E10.
- [ ] Every AI employee is a first-class principal with least-privilege scopes enforced at runtime; deny-by-default; secrets vaulted+rotated. — SHIPPED identity + E10/E0.
- [ ] Policy catalog **truly versioned (`version` column / append-only revisions)** with policy memories; **central→unit→employee inherit-and-narrow only**. — E10.
- [ ] Audit ledger append-only, hash-chained, exportable, retention-configurable; **separation of duties (configurer ≠ approver ≠ auditor)**. — E10 + **E13**.
- [ ] Entity-graph edges **police** automation traversal (agents move only along sanctioned edges). — E1 schema + **E10 enforcement**.

**Compliance (UAE)**
- [ ] Data stays internal; external models only via approved exception with egress redaction + per-unit budget. — E12.
- [ ] Voice transcribed then audio discarded (PDPL). — E2.
- [ ] **RERA evidence retention** (where relevant) satisfied via provenance + hash-chained audit + configurable retention. — **E10**.
- [ ] Department-level access control + full audit. — E10/E13.

**The blended org**
- [ ] AIEmployee is a peer of Person: "who owns this" / "who reports to whom" work identically for humans and agents. — SHIPPED schema + E1.
- [ ] Each pilot department has T4 orchestration: **basic T4 intake→assign (E8a, P2)** at minimum, full super-agent + cross-unit at GA (E8). The pilot is explicitly scoped as **caretaker-orchestrated until E8a lands**. — E8a/E8.
- [ ] Digital twin shows the workforce (humans + AI), current state, and predictive risk, with drill KPI → tasks → sources → agent actions, all governed. — E14.
- [ ] AI-employee lifecycle is fully governed, versioned, instantly rollback-able, with a full audit trail. — SHIPPED, completed by E16.

**Operational baseline**
- [ ] No leaked secrets in any repo or its history; **checked-in data artifacts purged + scanned**; secret scanning in CI. — E0.
- [ ] All services authenticated, CORS-locked, distinct ports, read-only DB roles for LLM-generated SQL. — E0/E13/E14.

When every box is checked across the **pilot's six departments (Operations, Projects, FIS, Customer Service, Marketing, Legal)** — note the CRM lead-lifecycle of §11.9 is a **blueprint/proof, not a seventh pilot department** — the organization satisfies the thesis — **"two visibilities (effectiveness + cost), one engine"** — with every unit of work **effective, affordable, and reversible**, and the leadership question — *"who owes what to whom, by when, based on which meeting or document — and what happens if they don't act?"* — answerable in seconds, with evidence.

---

---

## 13. What Ships Next

This closing section ties the entire plan to the **current `onyx-meridian` repo state** and names the precise next commits. The discipline is unchanged from §1: build on the shipped spine, fill the seven holes, never rewrite.

### 13.1 The repo as it stands today (v0.3.0)

`onyx-meridian` is a working FastAPI 3.11 + Pydantic v2 service with a React 19 console, 35 passing tests, and a CI gate (`ruff` → `pytest`). It boots with **zero infrastructure** (in-memory store fallback) and ships the control-plane spine: AI-Employee registry + lifecycle state machine (`domain/lifecycle.py`, `services/employee_service.py`), the Action/Task Registry + dependency graph + escalation sweep (`services/task_service.py`, `domain/task_lifecycle.py`), the Policy Engine config/deploy gates (`governance/policy.py`), agent identity (`governance/identity.py`), the append-only audit ledger (`services/audit_service.py`), the HITL approval queue (`services/approval_service.py`), the Model Gateway routing + cost meter (`gateway/model_gateway.py`), meeting ingestion with provenance (`services/ingest_service.py`), the unit dashboard read-model (`services/dashboard_service.py`), and the domain event bus (`services/event_service.py` — **emitted but consumed by nothing**).

The empty `onyx_vault` stub and the absence of any Flow consumer are the two structural voids the plan fills. Five sibling repos (`lms-onyx`, `ConvBI`, `onyx-pulse`, `onyxos`, `paperclip`) supply reusable capability (§9).

### 13.2 The next commits (P0, blocking — in order)

1. **Rotate + purge the leaked Aiven credential** (`onyx-pulse/db_configs.json`) — rotate the live credential, purge it from history with `git filter-repo`, and **confirm it is purged from every sibling repo's history, not only onyx-pulse**. Add gitleaks to CI. *Nothing else ships until this lands.* (§9 D5, §12 E0)
2. **Purge + scan checked-in data artifacts** — remove `dump.rdb`, `graphs.db`, `res.txt` (and any other checked-in DB/dump artifacts) from history, **scan them for secrets/PII first**, add them to `.gitignore`, and add a PII scan to CI. (§12 E0)
3. **Externalize secrets + fix CORS/ports** across all four services; move `CREDENTIAL_PEPPER` from settings to a **real secret store/KMS**; explicit per-env CORS origin allowlist (replace `*`+credentials across onyxos/onyx-pulse/lms-onyx); env-driven distinct ports. (§7.4, §9 D5)
4. **Mount human auth + separation of duties** — extract `lms-onyx` middleware into a shared `onyx-auth` lib, gate every write endpoint in `routes/api.py`, **enforce `omk_*` scope claims at runtime** (issued today, unenforced), and establish **distinct RBAC roles for configure / approve / audit**; wire **unit/workforce cascade kill-switch**. (§7.4, §12 E13/E10)
5. **Per-action `authorize_action`** in `governance/policy.py` + **true-versioned policy catalog** + **central→unit→employee inherit-and-narrow check** + **graph edge-guard** + hash-chain the audit ledger + **RERA retention mapping**. (§4.5, §7.2, §7.8, §12 E10)
6. **Harden the Model Gateway** — LiteLLM proxy behind `route()`, **monthly-window budgets (fixing the `_monthly` naming+semantics bug)** + per-scope ceilings + warn thresholds + `max_actions_per_hour`, egress/PII redaction, downgrade path. (§7.5, §11.7)

These close the safety, governance, and cost gaps that block putting real enterprise data and real users in front of the shipped spine.

### 13.3 The pilot wedge (P1 — the Fakhruddin deliverable, live mid-Sep 2026)

On the hardened spine, ship the pilot deliverables across the **six departments (Operations, Projects, FIS, Customer Service, Marketing, Legal)**:

- **Meeting intelligence** — swap `HeuristicExtractor` for an LLM extractor via the already-present `ingest_service.set_extractor` hook, **grounded by a minimal Pulse/RAG slice (E2a)** — if that slice slips, the extractor still ships, grounded by the shipped Documents corpus, and the "grounded by Pulse" claim is held until E9. Audio discarded (UAE PDPL). (§3.6, §12 E2/E2a)
- **Live Action/Task Registry** — actuate the escalation sweep (REASSIGN/notify are recorded but not performed today); add read-only connectors feeding Documents. (§5.1, §12 E1/E3)
- **Leadership dashboard** — fold `build_unit_dashboard` into the org-wide `build_org_twin`, answering all six success questions with sourced drill-through; ship the one-tap approval queue as a first-class surface **with the proposal approval type** so override rate is instrumented from day one. (§8.3, §4.6, §12 E14/E15)
- **Reversibility from day one** — the automation dial / revert primitive (**E4a**, not E4) ships **with the pilot**: any AI task flips to human-responsible and a whole unit can revert. (§4.8, principle #10)

**Pilot orchestration scope (explicit).** The pilot ships **caretaker-orchestrated**: there is **no full T4 super-agent per department in P1**. Basic T4 intake→assign (E8a) arrives in P2; full super-agent + cross-unit (E8) is the P3/GA upgrade. The pilot does **not** depend on Flow — it rides the **SHIPPED Task Registry**, escalation sweep, and event bus — so it is independently valuable even if Flow slips.

### 13.4 The platform turn (P2–P3 — V1 GA, end-Oct 2026)

- **P2** gives behavior to the inert anatomy: real agent runtime behind the `adapters/base.py` contract (first adapter = lms-onyx streaming), **basic T4 super-agent intake→assign per department (E8a)**, unit charters/KPIs. (§6, §12 E5/E6/E8a)
- **P3** is the highest-leverage build and the **V1 GA gate**: the **durable-execution Flow engine** consuming the already-emitted `events` collection — Treppan's data-driven advisory dispatcher is the *behavioral blueprint*, but the V1 target is a **durable, replayable Temporal-class substrate** (idempotent, with durable timers for the SLA/cadence/stall scheduler and replayable cross-unit handoffs). Proven by the **CRM lead lifecycle** and **TESPL RTQ** worked examples, with the predictive twin, full super-agent + cross-unit orchestration (E8), full Pulse RAG (E9), and earned autonomy (E7). (§4, §5, §12 E4/E7/E8/E9)

### 13.5 The standing invariant

Every commit above either **extends a named Meridian module** or **plugs an external service into a contract Meridian already exposes** (`adapters/base.py`, `ingest_service.set_extractor`, `model_gateway.route()`, the `events` bus, the `Store` Protocol). The invariant is precise (corrected from "nothing is rewritten," which P0's own commits contradict): the plan **extends and wraps the contracts; it does not replace them.** P0 legitimately *modifies* `governance/policy.py` (adding `authorize_action`, versioning, inheritance), `routes/api.py` (gating every mutating route), and `model_gateway.route` (enforcement) — these are **additive extensions to existing contracts, not rewrites of their semantics.** Nothing in the **shipped state-machine semantics** of `domain/lifecycle.py`, `domain/task_lifecycle.py`, agent identity in `governance/identity.py`, or the `store.py` Protocol shape is replaced. The platform grows by **earned trust and bounded cost**, one reversible, audited step at a time — which is exactly the operating model it sells: every unit of work **effective, affordable, and reversible**, on a spine that already runs.
