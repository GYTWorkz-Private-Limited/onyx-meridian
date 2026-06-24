# Onyx Meridian Platform Plan — Research Dossier & Review Notes

This is the raw research that fed [PLATFORM-PLAN.md](PLATFORM-PLAN.md): structured findings from six parallel deep-readers, plus the completeness critique applied during finalization.

# Part A — Completeness Critique (applied to §10–13)

This is a review task — I have all the material I need in the prompt (master plan, dossier, framework spec, current build inventory, reuse map). No file exploration needed. Let me produce the prioritized gap list.

Prioritized gaps/fixes (CTO/principal-engineer review of the master plan against framework + dossier + current build):

1. **[§13.3 vs §10/§Fakhruddin brief — CRITICAL CONTRADICTION on pilot date]** §13.3 says the pilot is "the Fakhruddin deliverable, end-Aug"; the ASCII roadmap in §12.3 says P1 "~Oct 2026"; §13.4 puts V1 GA "end-Oct." The brief mandates V1 *live by end-Oct 2026* with the pilot before it. An end-Aug pilot is contradicted by the critical path `E0→E13→E10→E12→{E2,E11}→E14` which alone sums to ~22 EW (P0 15.5 + the P1 spine). Fix: reconcile to a single timeline; pilot mid-Sep at the earliest, V1 GA end-Oct, and show the EW math supports it.

2. **[§12.2/§12.3 — Pilot department count is inconsistent and wrong]** §13.3 and the DoD (§12.5 "across the pilot's six departments") say 6 pilot departments; the roadmap ASCII art and the framework both name the 6 (Operations, Projects, FIS, Customer Service, Marketing, Legal). But §12.5 also says "When every box is checked across the pilot's six departments" while §11/§13 sometimes imply Sales (the CRM proof is Sales). Sales is NOT in the pilot 6. Fix: state explicitly that the CRM lead-lifecycle worked example is a *blueprint/proof*, not a pilot department, so the Sales-centric KPIs in §11 aren't mistaken for pilot scope.

3. **[§6.7/§12.4/§framework §7 — Flow orchestration substrate contradiction]** The framework and both dossiers (TESPL "Temporal is the spine") call for *durable, replayable* orchestration. The plan's E4 says "durable state machine" but §12.4 mitigations and §13.4 say port Treppan's *synchronous, in-process, advisory* dispatcher and "add durable timers incrementally." Treppan explicitly has no Temporal/Celery/scheduler. The plan never decides whether Flow is truly durable (Temporal-class) or an advisory dispatcher. Fix: name the durability target (e.g. Temporal/durable-execution lib) for V1 GA, since replayability/idempotency is a stated framework requirement and the scheduler (SLA/cadence/stall) is unbuildable on a pure synchronous post-commit dispatcher.

4. **[§E0/§13.2 — Leaked secret remediation is incomplete]** Plan rotates + purges the Aiven Postgres credential and adds gitleaks. But the reuse map also flags `CREDENTIAL_PEPPER` sourced from settings, checked-in artifacts (`dump.rdb`, `graphs.db`, `res.txt`), and CORS `*`+credentials across onyxos/onyx-pulse/lms-onyx. §13.2 commit 2 covers CORS/pepper but E0's table omits the checked-in DB/dump artifacts (which may also contain data). Fix: add "purge checked-in data artifacts + scan them for secrets/PII" to E0, and confirm the leaked credential is purged from *all* sibling repo histories, not just onyx-pulse.

5. **[§11.7/§E12 — Budget enforcement table is internally inconsistent]** §11.7 is titled "three documented gaps" but lists *five* rows. More importantly, current-build says `_enforce_budget` triggers on `spent_usd ≥ monthly_usd` but spend is *lifetime-accumulated with no monthly window* — so the shipped "monthly" budget is actually a lifetime budget mislabeled. Fix: correct the prose ("three" → "five") and state that the shipped budget is lifetime-only despite the `_monthly` field name, so E12 fixes a *naming+semantics* bug, not just adds a window.

6. **[§11.6/§11.9 — Attention-compression numbers are internally inconsistent]** §11.6 shows 4.1× compression (310h→74.8h); §11.9 shows 4.2× (417 SDR-h→100 caretaker-h) and separately "4.1× ROI ratio." The §11.9 ROI of 4.1× ($16,667→$4,031) and the §11.8 "roi_ratio: 44.3" (computed only on AI compute, ignoring the $4,000 HITL term) are two different ROI definitions presented without reconciliation — 44.3 is misleading because it omits residual HITL, the very term §11.5 says makes the comparison honest. Fix: pick one ROI definition (all-in, including HITL) and use it consistently; drop or relabel the 44.3 figure.

7. **[§11.9 — Unit-economics model has an arithmetic/over-claim problem]** "~500× headroom on the compute side" ($0.0315 vs $16.67) is presented as the reassuring number, but the binding cost is the $4.03 all-in/lead, which is only 4.1× cheaper than human — not 500×. The 76% savings depends entirely on the assumed "2 gates × 3min" HITL, which is unvalidated. Fix: label these as illustrative assumptions with sensitivity (if override rate forces Supervised mode, HITL minutes rise and savings collapse — the plan says this in prose but the headline table doesn't show the downside case).

8. **[§12.2.D / §framework §6.3, §8 — Policy versioning faithfulness to dossier]** The framework requires a *versioned* policy catalog with policy memories. The Treppan dossier is explicit: policies have **no version column** — versioning is via in-place edit + soft-delete, and immutable history lives only at the execution layer (`workflow_executions`). The plan's E10 says "versioned policy catalog + memories" but doesn't note it must *add* true versioning that Treppan lacks. Fix: E10 should explicitly add a `version` column/append-only policy revisions (not inherit Treppan's in-place-edit model), and seed P-content from Treppan/TESPL while building the versioning Treppan never had.

9. **[§E10 / §framework §8.1 — "inherit and narrow, never widen" not enforced anywhere concrete]** The framework requires units/employees inherit central policies and may only narrow. Current build's `authorize_configuration` does wildcard-aware least-privilege at config time, but there's no central→unit→employee policy *inheritance* mechanism named in any epic. Fix: add to E10 an explicit policy-inheritance/narrowing enforcement (hierarchical scope check), distinct from the existing single-actor least-privilege check.

10. **[§11.3/§11.4 — Override rate as keystone, but approval semantics don't capture "edit"]** The plan makes override rate (accept/edit/dismiss) the keystone metric computed at `approval_service.decide`. But current build's `Approval` only models deploy/decommission/autonomy_promote/budget_override — there is **no proposal/accept/edit/dismiss approval type** for task-level AI proposals. The override-rate metric has no data source until the "AI proposes → human commits" workspace (E15) introduces a proposal approval type. Fix: add a proposal-approval type to E15/E10 and make E11's override-rate explicitly depend on it (today it would read zero).

11. **[§12.3 dependency error — E11 depends on E4 but is P1, E4 is P3]** E11 (Ensure v1) lists `Depends on: E10, E4` yet E11 is Phase P1 and E4 (Flow) is Phase P3. A P1 epic cannot depend on a P3 epic. Cost-trace/ROI/KPIs in E11 need stage transitions, which without Flow come only from the SHIPPED Task Registry + Run→Task→stage derivation. Fix: remove the E4 dependency from E11 (or scope E11's stage-trace to derive from Task/Run as §11.4 actually describes), keeping E11 truly P1-shippable.

12. **[§12.3 dependency error — E15/E16 depend on E4 but land before/around it]** E15 (HITL experience) is P1 and lists `Depends on: E13, E4`; E16 lists `Depends on: E4` at P3/P4. The DoD ties the one-tap queue (E15) to the pilot (P1), but E4 is P3 — another P1-depends-on-P3 inversion. Also §12.5 reversibility checkbox ("any AI task flips to human-responsible … a whole unit can revert") is attributed to E4, making the *automation dial / reversibility* DoD item un-deliverable in the pilot. Fix: split the automation-dial/reversibility primitive out of E4 into a P0/P1 epic (it's a framework non-negotiable, principle #10), so reversibility ships with the pilot, not at GA.

13. **[§framework §4.1/§4.2 — T4 super-agent + cross-unit only at P3; pilot has no super-agent]** The brief mandates "one super-agent per department." E8 (super-agents + cross-unit) is P3. The pilot's 6 departments therefore ship with no T4 orchestration, contradicting the business-unit definition (1 T4 + N employees + caretaker). Fix: either explicitly scope the pilot as "no super-agent yet (caretaker orchestrates)" and say so in §13.3, or pull a minimal T4 intake→assign into P2. Current plan leaves this gap silent.

14. **[§framework §7 Pulse / §12.2.A — knowledge grounding deferred to P3 undercuts pilot meeting-intel]** E9 (Pulse cited RAG / 7 context layers) is P3, but §13.3 says the pilot's LLM extractor is "grounded by Pulse." You can't ground the pilot extractor in Pulse if Pulse integration is P3. Fix: pull a minimal Pulse/RAG grounding slice into P1 to back E2, or drop the "grounded by Pulse" claim from the pilot description.

15. **[§framework §3 / §12.2.A — Customer/Asset entities at P1 but CRM economics in §11 assume them]** The §11 CRM lead-lifecycle economics rely on lead/customer entities; E1 (Customer + Asset + graph) is P1 — fine — but the entity-graph that "polices automation traversals" (a stated L3 requirement, framework §1) is bundled into E1 at 3 EW with no detail on the edge-guard enforcement. Fix: call out the traversal *policing* (agents move only along sanctioned edges) as a distinct deliverable tied to E10 runtime authz, not just a schema addition.

16. **[§12.5 DoD — RERA evidence requirement missing entirely]** The Fakhruddin brief names "RERA evidence requirements where relevant" alongside PDPL. The plan covers PDPL (audio-discard, egress) thoroughly but never mentions RERA. Fix: add a compliance line for RERA evidence retention (likely satisfied by provenance + hash-chained audit, but must be stated and mapped to E10).

17. **[§framework §6.6 / §8.6 — kill switch "whole workforce" scope unproven]** §12.5 claims "Kill switch suspends employee / unit / whole workforce instantly … SHIPPED suspend + E16." Current build ships per-*employee* suspend only; unit-level and workforce-level kill switch are not shipped and not assigned to any epic. Fix: assign unit/workforce kill-switch (cascade suspend + in-flight task hold) to a named epic (E13 or E16); don't mark it SHIPPED.

18. **[§E13/§framework §8 — separation of duties asserted in DoD but not built]** §12.5 lists "separation of duties" under governance and compliance; §8.7 of the framework requires it (configurer ≠ approver ≠ auditor). No epic implements role separation — E13 is auth/RBAC/sessions generically. Fix: make separation-of-duties an explicit RBAC requirement in E13 (distinct roles for configure/approve/audit), since the DoD checkbox depends on it.

19. **[§11.4/§11.9 — `execution_mode` on CostEvent conflicts with Treppan's `executed_by` taxonomy]** The plan adds `execution_mode` with values implying {Deterministic, Workflow+Policy, AI Agent}. Treppan's field is `executed_by ∈ {workflow, ai, human, hybrid}` and TESPL adds Hybrid + pure Human rows. The plan's 3-mode cost model omits **human** and **hybrid** modes, so cost-of-human and HITL-dwell can't be attributed to a mode on the CostEvent. Fix: align `execution_mode` enum to the full {deterministic, workflow_policy, ai_agent, hybrid, human} set so the §11.5 cost-of-human term has a home.

20. **[§13.5 — "nothing rewritten" invariant vs E13 adding auth to every write route]** The standing invariant says nothing in `policy.py`/`identity.py`/`store.py`/lifecycle is rewritten. But E13 gating *every* mutating route in `routes/api.py` and E10 adding per-action `authorize_action` to `policy.py` are real modifications to those exact files. Fix: soften the invariant to "extends/wraps, does not replace the contracts" — as written it's contradicted by P0's own commits (E10 edits `policy.py`, E12 edits `model_gateway.route`).

Minor/notable: §11.8 `roi_ratio` 44.3 vs §11.9 4.1× (item 6); "8-KPI catalog" (§11.10 step 3) but §11.3 only enumerates a partial list continued from a cut-off table — verify all 8 KPIs are actually defined incl. override/rework/SLA/turnaround. No epic covers the framework's **knowledge-miss → task for domain expert** routing as a closed loop (E11 lists knowledge-gap *detection* but not the auto-created expert task). Connectors (E3) are read-only at P2, consistent with the brief's "internal-first, customer-facing later" — good, no fix.

---

# Part B — Source Dossier

# SOURCE DOSSIER: treppan-backend

I have everything needed. No Temporal/Celery — orchestration is a synchronous, in-process, advisory engine fired from the service layer. Here is the exhaustive report.

---

# Treppan CRM — Lead Lifecycle Control Framework: Architecture Map

The "control framework" is implemented as a **data-driven, admin-editable workflow + policy engine** living under `backend/db/models/workflow/`, `backend/services/v1/workflow/`, and a parallel **analytics/measurement layer** under `backend/services/v1/analytics/`. The lifecycle map spec (`/tmp/meridian_specs/...`) is transcribed verbatim into seed data (`services/v1/workflow/workflow_catalog.py`) and then seeded into the DB, after which everything is tenant-editable. The engine reads the DB, never the catalog module.

The whole engine is **advisory** ("AI proposes, a human commits"): it records decisions and HITL flags but never blocks the caller. See the module docstrings in `policy_engine.py:1-11` and `workflow_engine.py:1-9`.

---

## 1. LEAD LIFECYCLE STATE MACHINE

### Representation in code
Not an `Enum`/state-machine library. States are **lookup rows** in `lookup_master` (categories `lifecycle_stage` and `lead_status`), referenced by FK from the `leads` table.

- `db/models/crm/lead.py:34-39` — `status_id` and `lifecycle_stage_id` are both FKs to `lookup_master.id`. Also carries lifecycle fields: `sla_due_at`, `sla_breached`, `claimed_by`, `claimed_at`, `auto_assigned`, `converted_at`, `disqualify_reason_id`, `sub_status_id`.
- `db/models/crm/lead_status_history.py` — every transition writes a row: `from_status_id`, `to_status_id`, `changed_by`, `changed_at`, `reason`. This is the transition log.

### Stages (5 product + 3 branch tracks)
Defined in `services/v1/workflow/workflow_catalog.py:14-23` (`STAGES`) and seeded as lifecycle_stage lookups in `db/migrations/versions/20260608_0007_seed.py:42-52` / realigned in `20260610_0013_lifecycle_realign.py:34-44`:

| Workflow stage code | Lifecycle lookup code | Product stage |
|---|---|---|
| prospect | under_qualification | Prospect |
| qualified | pre_qualified | Qualified |
| proposal | warm | Proposal |
| negotiation | hot | Negotiation |
| deal_closed | closed | Deal Closed |
| lost | lost | Lost (branch) |
| broker | broker | Broker (branch) |
| cross_cutting | (none) | cross-cutting tasks |

### Statuses (granular operational states, mapped to stages)
`lead_status` lookups, each carrying its parent stage in `metadata.stage` (`20260608_0007_seed.py:233-235`, realigned in `20260610_0013_lifecycle_realign.py:49-85`). Examples per stage:
- **under_qualification:** pending_qualification, attempting_contact, no_response, conversation_initiated, never_responded, did_not_inquire (+ seeking_job, vendor, customer_service_inquiry)
- **pre_qualified:** pending_sales_action, called_no_response, collecting_requirements, information_shared
- **warm:** passive_interest, connected_interested, following_up_for_meeting, sales_offer_sent
- **hot:** meeting_scheduled, post_meeting_followup, under_negotiation
- **closed:** booking_done
- **broker:** broker_contacted, broker_registered, broker_information_shared, broker_briefing_done

### Transitions
Driven by `LeadService` (`services/v1/leads/lead_service.py`):
- `update_status()` (`:338-369`) — sets `status_id`, derives `lifecycle_stage_id` via `self._lookup.stage_id_for_status(...)` (status→stage mapping lives in the lookup metadata), writes `LeadStatusHistory`, then fires `_run_engine("lead.status_changed", ...)`.
- `move_to_stage()` (`:409-452`) — Kanban drag/drop; picks the stage's default status via `first_status_for_stage`, writes history, fires the same event.
- `create()` (`:177`) fires `_run_engine("lead.created", ...)`.

There is **no hard-coded transition guard graph** — any status→status move is allowed; governance is advisory via policies (e.g. P10 AI-scope returns `block` but is never enforced). Engine events fire **post-commit**, wrapped so they can never break the lead op.

---

## 2. TASKS PER TRANSITION + EXECUTION MODES

### The 36-task catalog
`services/v1/workflow/workflow_catalog.py:80-205` — `TASKS: list[TaskSpec]`, a direct transcription of the spec's "WORK BETWEEN TRANSITIONS #1–#36". Each `TaskSpec` (`:66-77`) carries: `seq`, `stage`, `name`, `activity`, `what_happens`, `executed_by`, `trigger`, `needs_hitl`, `agent` (agent_config code), `policies` (list of policy codes).

DB model: `db/models/workflow/workflow_task.py` (`workflow_tasks`). Key fields: `executed_by` (`:45`), `trigger_id` (`:46`), `needs_hitl` (`:50`), `agent_config_id` (`:52-54`), `execution_config` JSONB, `stage_id` (NULL ⇒ cross-cutting), `sort_order`.

### Three execution modes — present and explicit
Field `WorkflowTask.executed_by` ∈ `{workflow, ai, human, hybrid}` (default `workflow`). Per the LEGEND in the spec and the engine logic:
1. **`workflow` (deterministic / "Workflow + Policy"):** the engine consults the policy engine for the next move; no model judgement (e.g. tasks #1 Capture & dedupe, #2 Auto-assign, #5 Missed-call, #6 3×3×3 cadence, #25 SLA timer, #27 Audit log).
2. **`ai`:** a model judges/generates; linked to an `agent_config_id` (e.g. #3 First-touch AI call, #8 Call Summarizer, #15 Match Reranker, #29 Funnel Narrator).
3. **`human`:** a person must act (e.g. #11 Did-Not-Inquire, #20 Send sales offer, #28 Manual reassignment, #32 Mark lost reason).
4. **`hybrid` (AI/WF does the work, human approves = the HITL):** e.g. #4 Channel fallback, #7 Detect+classify, #9 Reply suggestion, #16 Share shortlist.

### Routing / dispatch
`services/v1/workflow/workflow_engine.py::WorkflowEngine._dispatch` (`:62-121`):
1. On an event_key it loads active `WorkflowTask`s joined to their `WorkflowTrigger` where `trigger.event_key == event_key` (tenant-scoped, ordered by `sort_order`).
2. For each task, loads its bound enabled `Policy` rows (via `task_policies`) and evaluates them with `PolicyEngine`.
3. Computes `requires_hitl = task.needs_hitl or PolicyEngine.requires_hitl(decisions)`.
4. If `task.executed_by == "ai"` and `agent_config_id` set → `_simulate_agent_run()` logs an `agent_runs` row with computed cost (`:123-156`).
5. Writes a `workflow_executions` row capturing `decisions`, `requires_hitl`, `agent_run_id`, evidence message.

Triggers (`workflow_catalog.py:29-63`, `TRIGGERS`): 33 named triggers. Only **two `event_key`s are live today** — `lead.created` and `lead.status_changed` (fired by `LeadService`); the rest (e.g. `call.unanswered`, `cadence.exhausted`, `meeting.confirmed`, `booking.deposit`) are catalog triggers "awaiting integrations/cron" but configurable now.

---

## 3. POLICIES

### Policy catalog (P1–P17, with themes/levels)
Two coordinated definitions:
- **Static product spec catalog:** `services/v1/analytics/policy_catalog.py:31-159` — `POLICY_CATALOG: list[PolicySpec]`. Each carries `code, name, level, rule, metric_key, metric_label, work_items, engine, lever`.
- **Runtime wiring:** `services/v1/workflow/workflow_catalog.py:211-230` — `POLICY_RUNTIME`, mapping each code to `evaluator`, default editable `config` (thresholds), and `applies_to` event_keys.

| ID | Name | Level/Theme | Runtime evaluator | Editable config |
|----|------|-------------|-------------------|-----------------|
| P1 | Lead Assignment | Assignment | `assignment` | — |
| P2 | Rotation & Ownership | Assignment/SLA | `rotation` | rotation_minutes=60 |
| P3 | First-Touch Automation | Engagement | `first_touch` | window_minutes=5 |
| P4 | Channel Fallback | Engagement | (advisory) | — |
| P5 | Missed-Call Follow-up | Engagement | (advisory) | window_seconds=60 |
| P6 | 3×3×3 Cadence & Silence | Engagement | (advisory) | channels/days/attempts=3 |
| P7 | AI Governance | Governance | `governance` | require_approval_outbound=true |
| P8 | Qualification | Qualification | (advisory) | — |
| P9 | Dedupe & Merge | Data | `dedupe` | — |
| P10 | AI Calling Scope | Governance | `ai_scope` | prospect_only=true |
| P11 | Offer & Discount Approval | Deal governance | (advisory) | discount_threshold_pct=5 |
| P12 | Audit | Governance | `audit` | — |
| P13 | DND / Suppression | Compliance | (advisory) | — |
| P14 | SLA & Meeting Reminders | SLA/cadence | `sla` | sla_hours=24 |
| P15 | Follow-up Scheduling | Cadence | (advisory) | — |
| P16 | Stalled-Deal Flag | Monitoring | (advisory) | inactivity_hours=48 |
| P17 | Broker Registration | Assignment | (advisory) | — |

### Storage / versioning
- DB model `db/models/workflow/policy.py` (`policies` table). Editable fields: `enabled`, `rule`, `config` (JSONB thresholds), `applies_to` (JSONB), `evaluator_key`, `metric_key`, `metric_label`, `lever`, `sort_order`. Bound to tasks M2M via `task_policies` (`db/models/workflow/task_policy.py`).
- **Versioning:** no explicit policy version column — mutability is via in-place edit + `updated_at`/`deleted_at` soft-delete. (Contrast: `ai_tools` does carry a `version` integer; `agent_runs` reference immutable `prompt_templates`.) Immutable history/versioning is provided at the *execution* layer (`workflow_executions`, `lead_status_history`, `audit_log`).
- Seeded by `seed_dev_data.py:_seed_policies` (`:775-795`), idempotent by `code`.

### Two policy engines (key distinction)
1. **Runtime policy engine** — `services/v1/workflow/policy_engine.py`. `PolicyEngine.evaluate(policies, lead_ctx)` (`:109-124`) runs each policy's `evaluator_key` function and returns `PolicyDecision`s with `effect` ∈ `{allow, flag, require_approval, route, schedule, block, noted}`. `_HITL_EFFECTS = {"require_approval","block"}` (`:39`). Eight evaluator fns (`_EVALUATORS`, `:94-103`): `assignment, rotation, first_touch, dedupe, ai_scope, audit, sla, governance`. **Advisory only** — decisions recorded, never enforced. Editing a policy's `config` in the UI changes engine behaviour immediately.
2. **Effectiveness/measurement engine** — `services/v1/analytics/policy_service.py`. Measures each policy 0–100 *after the fact* against live CRM data (keyed by `metric_key`, 13 metric fns `_METRICS` `:388-402`), bands them (healthy ≥80 / at_risk ≥50 / breaching / not_instrumented), and a swappable `PolicyBrain` (`DeterministicPolicyBrain`, `:421-451`) emits change recommendations using each policy's `lever`. The Protocol is explicitly designed so a `ClaudePolicyBrain` can drop in later (`:1-13`).

---

## 4. AGENTS & TOOLS

### Two distinct "agent" concepts

**(A) Lifecycle AI agents (the 10 CRM agents in the lifecycle map)** — data, not code.
- Catalog: `services/v1/analytics/agent_catalog.py:23-44` (`AGENT_CATALOG`). The 10: First-Touch Agent (gpt-5.4), Reply Drafter (mini), Intent Classifier (nano), Call Summarizer (mini), Lead Scorer (mini), Match Reranker (nano), Email Drafter (mini), Sentiment Scorer (nano), Next-Best-Action (mini), Funnel Narrator (gpt-5.4).
- DB: `db/models/workflow/agent_config.py` (`agent_configs`) — editable `prompt`, `model_config_id`, `tools` (JSONB), `flow` (JSONB ordered steps), `temperature`. AI workflow tasks point at these via `agent_config_id`.
- Seeded tools per agent: `seed_dev_data.py:754-765` (`_AGENT_TOOLS`), e.g. first_touch_agent → `["place_call","send_whatsapp","store_transcript"]`; funnel_narrator → `["aggregate_metrics","write_narrative","forecast"]`.
- Default agentic flow: `seed_dev_data.py:767-772` (`_DEFAULT_FLOW`) — 4 steps: `load_context → reason → act → handoff` where step 4 is literally `"Return the result for human review (HITL)"`.
- **Execution today is simulated**: `WorkflowEngine._simulate_agent_run` (`workflow_engine.py:123-156`) creates an `agent_runs` row with token/cost numbers but no real LLM call. The seam exists ("a real LLM executor can later run the same config", `agent_config.py:16-17`).

**(B) Real Python agent harnesses** under `backend/agents/<agent>/` (the `internal-fastapi-developer` scaffold). Four real + one sample:
- `sample_agent` (reference; stub harness returns `[stub] ...`, `harness/runner.py:15-21`).
- `lead_filter_parser` — NL query → structured lead filter JSON.
- `project_extractor` — reads a project doc → structured fields (has a real tool `tools/document_loader.py`).
- `marketing_advisor` — on-brand creative ideas.
- `notification_advisor` — context → AI notification suggestion.
- These follow pipeline → harness → `llms/azure_openai.py` (Azure OpenAI / MSAL). Prompts are YAML under `prompts/<agent>/system.yaml`. They are **not the lifecycle agents** — they power filter parsing, doc extraction, marketing, notifications.

### Propose vs commit (HITL) / approval surface
- The guardrail "AI proposes, a human commits" is **policy P7** (`policy_catalog.py:77-84`) and the `governance` evaluator returning `require_approval` (`policy_engine.py:88-91`).
- HITL surfaced via `WorkflowTask.needs_hitl` + `WorkflowExecution.requires_hitl` (`workflow_execution.py:38`). 25 of 36 tasks have `needs_hitl=True`.
- **Approval surface = the `workflow_executions` list** (read via `GET /api/v1/workflow/executions`, `routers/v1/workflow.py:169-172`) showing each dispatched task, its advisory `decisions`, and the `requires_hitl` flag. There is no separate approval-queue table/endpoint yet; commit happens through normal lead status/send operations performed by the human. AI run quality feedback loop: `ai_feedback` + `ai_evaluations` tables.

### Engine preview / dispatch endpoint
`POST /api/v1/workflow/evaluate` (`routers/v1/workflow.py:175-179` → `WorkflowService.evaluate` `:290-300`) lets an admin dry-run any event_key against a lead and see the decisions.

---

## 5. DATA MODEL (key entities & relationships)

Workflow/governance domain (`db/models/workflow/`):
- **workflows** (Workflow) 1─N **workflow_stages** (WorkflowStage, maps to lifecycle_stage lookup) and 1─N **workflow_tasks** (WorkflowTask).
- **workflow_tasks** N─1 **workflow_triggers** (event_key), N─1 **agent_configs**, N─1 stage; M2M **policies** via **task_policies**.
- **policies** (Policy P1–P17) — editable config/evaluator.
- **agent_configs** N─1 **model_configs**; carry tools/flow/prompt.
- **workflow_executions** — append-only dispatch log; FK to workflow/task/agent_run; holds `decisions` JSONB + `requires_hitl`.

CRM domain (`db/models/crm/`):
- **leads** — N─1 contacts, companies, owner (users), `status_id`/`lifecycle_stage_id`/`sub_status_id`/`disqualify_reason_id` → lookup_master.
- **lead_status_history** — transition log (from/to status, changed_by, reason).
- **lead_assignment**, **assignment_history**, **assignment_rule** (+ `assignment_rule_assignee`) — assignment/rotation (P1/P2). AssignmentRule carries `conditions` JSONB, `claim_window_seconds`, `priority`.
- **lead_interest**, **contact**, **contact_phone**, **contact_consent** (DND/P13), **external_ref** (dedupe/P9), **company**, **opportunity** (+ `opportunity_stage_history`, `opportunity_unit`), **pipeline**/**pipeline_stage**.

Activity domain (`db/models/activity/`): **activity**, **activity_link**, **task**, **note**, **call**, **meeting**, plus AI artefacts **ai_call_summary**, **ai_transcript**, **ai_insight**.

Intelligence domain (`db/models/intelligence/`): **agent_runs** (the cost/telemetry record: tokens, `cost_usd`, status, entity_id→lead, prompt_template_id), **agent_step**, **agent_memory**, **tool_calls**, **ai_tools** (has `version`, `json_schema`), **model_configs**, **prompt_templates**, **ai_feedback**, **ai_evaluation**, **document**/**document_chunk**/**embedding**/**retrieval_log**.

Audit: **audit_log** (`db/models/audit/audit_log.py`) — INSERT-only, RANGE-partitioned monthly, actor/action/resource/old/new/diff (P12). Booking: **booking**, **commission** (#24). Comms: **conversation**, **message**, **broadcast**, **broadcast_recipient**. Notifications: **notification**, **notification_state** (+ `services/v1/notifications/workflow_rules.py`).

---

## 6. KPIs / COST ATTRIBUTION

- **Per-agent cost & KPI:** `services/v1/analytics/agent_analytics_service.py`. Aggregates `agent_runs` per agent: runs, success rate, avg latency, total tokens, `total_cost` (USD), **`cost_per_action`** (`:199`), quality (human rating + eval pass-rate). KPI strip (`:153-165`): AI spend, Agent actions, **Cost per action** (blended), Success rate, Avg quality. Charts: cost by agent, actions over time, cost-per-action by agent.
- **Cost computation:** seed + engine bill each run from `MODEL_PRICING` (`agent_catalog.py:50-54`, USD per 1K in/out tokens by model tier). `WorkflowEngine._simulate_agent_run` (`:130-134`) computes `cost = itok/1000*pin + otok/1000*pout` and stores `cost_usd` on `agent_runs`.
- **Stage attribution:** cost is attributed **per agent** and per lead (`agent_runs.entity_id` → lead), and the agent maps to lifecycle work-points via the catalog. There is no dedicated "cost per pipeline stage" roll-up; stage attribution is derivable (run → lead → `lifecycle_stage`), and `policy_service._load` already joins agent_runs to lead stage (`policy_service.py:237-250`) for the AI-scope metric.
- **Policy KPIs:** `policy_service.overview` (`:113-162`) returns Policies tracked, Avg policy health, Need attention, Recommendations, plus per-policy 0–100 effectiveness scored against real CRM data.
- **Funnel/forecast KPIs:** Funnel Narrator agent + `services/v1/analytics/` (`narratives.py`, `overview_service.py`, `copilot_service.py`, `metrics_service.py`, `chart_builder.py`) produce the plain-language pipeline narrative + revenue forecast (read-only, task #29).

---

## 7. BPMN / WORKFLOW MODELING & ORCHESTRATION

- **No BPMN, no Temporal, no Celery, no APScheduler, no FastAPI BackgroundTasks.** `pyproject.toml` deps are just FastAPI + SQLAlchemy + Alembic; a repo-wide grep for celery/temporal/apscheduler/dramatiq/cron/scheduler/BackgroundTasks finds nothing in source.
- **Orchestration model:** a bespoke, **synchronous in-process event dispatcher**. The "BPMN" is expressed as relational data: a `workflow` owns ordered `workflow_stages` and `workflow_tasks`; each task binds a `workflow_trigger` (an `event_key`) and a set of `policies`; AI tasks bind an `agent_config` with an ordered `flow` (JSONB step list). The runtime is `WorkflowEngine.dispatch(event_key, ctx)` called from `LeadService` post-commit.
- **Event firing is live for two events only** (`lead.created`, `lead.status_changed`); the other ~31 triggers are modeled and configurable but not yet wired to integrations/cron — there is no scheduler, so time-based tasks (3×3×3 cadence, 48h stall, SLA timers, missed-call 60s) are defined as data/config but not autonomously executed.
- **Editability is the design point:** the catalog (`workflow_catalog.py`) is seed-only; once seeded, admins edit stages/tasks/triggers/policy-bindings/agent prompts via `routers/v1/workflow.py` CRUD, and the engine reads the DB. Editing a policy threshold or a task's HITL flag changes engine behaviour immediately.
- **Safety wrapper:** `WorkflowEngine.dispatch` (`:52-60`) and notification emit (`lead_service.py:60-79`) both catch all exceptions and roll back so the advisory engine can never break a lead operation.

### Key file paths (quick index)
- Runtime engine: `backend/services/v1/workflow/workflow_engine.py`, `policy_engine.py`
- Seed source of truth: `backend/services/v1/workflow/workflow_catalog.py` (STAGES, TRIGGERS, 36 TASKS, POLICY_RUNTIME)
- CRUD service/router: `backend/services/v1/workflow/workflow_service.py`, `backend/routers/v1/workflow.py`
- Policy catalog + measurement: `backend/services/v1/analytics/policy_catalog.py`, `policy_service.py`
- Agent catalog + cost: `backend/services/v1/analytics/agent_catalog.py`, `agent_analytics_service.py`
- DB models: `backend/db/models/workflow/*.py`, `backend/db/models/crm/{lead,lead_status_history,assignment_rule}.py`, `backend/db/models/intelligence/agent_run.py`, `backend/db/models/audit/audit_log.py`
- Event firing: `backend/services/v1/leads/lead_service.py` (`_run_engine`, `update_status`, `move_to_stage`, `create`)
- Seeding: `backend/seed_dev_data.py` (`_seed_policies`, `_seed_agent_configs`, `_seed_workflow`, `_AGENT_TOOLS`, `_DEFAULT_FLOW`)
- Migrations: `backend/db/migrations/versions/20260613_0004_workflow_engine.py` (8 tables), `20260610_0013_lifecycle_realign.py` / `20260608_0007_seed.py` (statuses/stages)
- Real agent harnesses: `backend/agents/{lead_filter_parser,project_extractor,marketing_advisor,notification_advisor,sample_agent}/`, prompts in `backend/prompts/<agent>/system.yaml`, LLM client `backend/llms/azure_openai.py`

---

# SOURCE DOSSIER: treppan-frontend-ux

I have everything needed. Here is the structured report.

# Treppan CRM — Reusable UX Patterns for an AI-Native Platform Console

The `frontend/` tree is the live, richer version (dashboard widgets, intelligence/agents, copilot, workflow). The `prototype/` tree is an earlier static design — its standout asset is `LeadAISpace.tsx`, the fully-realized "AI proposes → human commits" lead workspace. Cite both.

## 1. Lead/CRM STAGES — Kanban / Pipeline
**Files:** `frontend/src/features/leads/components/LeadKanban.tsx`, `frontend/src/features/leads/hooks/useKanbanLeads.ts`, `frontend/src/features/leads/services/leadService.ts`

- **Horizontal swimlane board** — one `<section>` per stage (`w-[300px] shrink-0`), each with a colored top border keyed by stage code (`STAGE_TINT` map: `under_qualification→blue`, `warm→amber`, `hot→orange`, `closed→emerald`, `lost→muted`). Column header shows `loaded / total` count.
- **Native HTML5 drag-and-drop** (no library). Cards carry a typed JSON payload over a custom MIME (`application/x-treppan-lead`) with `{leadId, fromStageId}`; drop handler short-circuits same-column drops. Drop target highlights via `ring-2 ring-accent/60`.
- **Optimistic stage moves** — `useKanbanLeads.moveLeadStage` mutates the board immediately, calls `leadService.moveStage`, and rolls back via `refetch()` on failure.
- **Per-column infinite scroll** — `useIntersectionObserver` on a sentinel div triggers `loadMore(stageId)`, paginating each column independently (PAGE_SIZE=20) without disturbing siblings. A `boardRef` keeps `loadMore` stable so the observer doesn't thrash.
- **Card signals worth reusing:** priority badge, estimated value (right-aligned, `font-data tabular-nums`), and a red `SLA Breached` warning row with `AlertTriangle`.
- **Linear stage stepper variant** (for a single record's lifecycle): `prototype/.../LeadAISpace.tsx` `STAGES` array → numbered circles with `done`/`current`/`upcoming` states, connector lines tinted up to the current stage.

## 2. "AI proposes → human commits" — the centerpiece
**File:** `prototype/frontend/src/features/leads/components/LeadAISpace.tsx` (also in `frontend/`)

A 3-column lead workspace under the stage stepper — the strongest pattern to port to a platform console:
- **Left "What we know" (Context)** — editable AI-extracted fact rows (label/value/provenance). Each fact has an `AI` chip, a source icon (call/whatsapp/email/note), inline edit/remove on hover, and a clickable provenance note that **jumps to the originating timeline event** (`jumpTo` + `scrollIntoView` + transient highlight ring). This is the "fact + where it came from + verify" loop.
- **Center timeline + Command Center** — see §5; the AI-generated "Lead Summary" card sits atop the timeline.
- **Right "Next best" + "Best fits"** — AI-proposed action cards each carry a **"Why:" rationale** and a 3-button commit bar: `Accept` (primary) / `Edit` / `Dismiss`. Below, AI-proposed opportunity matches with `Pinned`/`Proposed` badges, pin-to-top, remove, and a search-and-attach command-palette dialog.
- **The reusable contract:** every AI output = *proposal + rationale + provenance + explicit human accept/edit/dismiss*, never auto-applied. The "Suggestion updated" timeline event even exposes a "See what's changed" diff (`from → to`).

The other instance of this pattern is **Copilot result → dashboard** (`CopilotResultCard.tsx`): AI generates a chart + summary, human clicks "Add to dashboard" → picks a section, never auto-inserted.

## 3. One-tap APPROVAL / commit surfaces
- **Inline action commit:** `LeadAISpace` "Next best" cards — `Accept`/`Edit`/`Dismiss` triad (`ActionButton` component).
- **Confirm-before-mutate:** `CopilotPanel.tsx` — UI-only actions (theme, navigation) run instantly, but data mutations (create lead) render a confirmation card (`pending` state) with Cancel/Confirm before commit.
- **HITL flagging in the workflow engine:** `WorkflowsPage.tsx` Activity tab + Builder — tasks render a `HITL` warning badge (`t.needs_hitl`) and an `executed_by` badge (`workflow`/`ai`/`human`/`hybrid` via `EXEC_BADGE`). Engine executions show `requires_hitl` + `AI run` badges with per-execution policy decisions (`policy_code / effect / message`).
- **Generic confirm primitive:** `frontend/src/components/ui/ConfirmDialog.tsx`.
- **Note:** there is no dedicated batch "approval queue" page yet — the closest is the workflow Activity feed. A platform console should consolidate `needs_hitl` executions into a one-tap queue; the badge + decision-row vocabulary already exists.

## 4. KPI / cost DASHBOARDS
**Files:** `frontend/src/features/dashboard/pages/DashboardPage.tsx`, `components/KpiCard.tsx`, `ExecutiveDigest.tsx`, `store/dashboardStore.ts`, `types/dashboard.types.ts`

- **KPI strip** — `KpiCard` with label / large `tabular-nums` value / trend (`up`/`down`/`flat` → arrow icon + emerald/red/muted tint) / delta + caption. Reused verbatim across Dashboard, AI Agents, and Policies pages (imported cross-feature).
- **Persona-driven layout** — backend resolves a `Persona` (executive/manager/agent) and returns `kpis + charts + sections + optional digest`. `seedDefaultSections` seeds the layout on first visit.
- **User-customizable BI grid** — `DashboardGrid` + `dashboardStore` (Zustand): sections with rename / collapse / reorder / delete and widgets drag-movable within and across sections (`moveWidget`). Edit-mode toggled in header.
- **Charts are backend-driven, theme-neutral ECharts** — `ChartSpec.echarts_option` is an opaque `option` blob; the `EChart` wrapper applies light/dark theme. New chart types need no frontend code.
- **Executive narrative digest** — `ExecutiveDigest` renders an AI headline + grid of toned "number sentences" (positive/negative/neutral), attached by backend only for the C-level lens.

## 5. Cost-trace-per-stage / per-agent views
**Files:** `frontend/src/features/intelligence/{pages/AiAgentsPage,components/AgentTable,components/PolicyTable,components/PolicyRecommendations}.tsx`, `types/intelligence.types.ts`

- **Per-agent cost ledger** (`AgentTable`) — columns: Agent + model chip, Actions/runs, Success% (tinted ≥90/≥75/below), Avg latency, Quality%, **Total cost**, **Cost / action** (`$0.0000`, 4-decimal precision). Formatters `fmtCost`/`fmtCpa`/`fmtLatency` are reusable. Row → edit drawer for model/prompt/tools/flow.
- **Per-policy effectiveness** (`PolicyTable`) — policy code (P1…P17) + name + rule, an inline **score bar** (width = score%, color by status), status badge (`healthy`/`at_risk`/`breaching`/`not_instrumented`/`disabled`), "governs N" count, work points.
- **AgentStat type** is the cost-trace data contract: `{runs, success_rate, avg_latency_ms, total_tokens, total_cost, cost_per_action, quality}`. This is exactly the per-stage cost-trace shape a platform console needs.
- **Policy recommendations** (`PolicyRecommendations`) — AI-found findings as severity-tinted cards (critical/warning/info) with finding + `Suggested:` change + evidence. Read-only proposals (no auto-apply).

## 6. Activity / Audit timelines
**Files (two flavors):**
- **Real, API-backed unified inbox** — `frontend/.../LeadActivityPanel.tsx` pulls `commsService.listConversations({lead_id})`, renders cross-channel conversations (WhatsApp/Email/SMS/Calls) with channel icon+tint (`channelMeta`), relative time (`formatWhen`), unread badge, last-message preview; links to `/inbox`.
- **Rich narrative timeline (design ref)** — `LeadAISpace.tsx` `activities[]`: a vertical rail (`before:` pseudo-element line + per-event dots) mixing channels and **`System` audit rows** (AI call attempts, automation waits, auto-routing/assignment, AI context-capture, suggestion-engine diffs). Each event = channel badge + inbound/outbound tag + source + body + tags + optional "View transcript" / "See what changed" expander. This is the audit-trail vocabulary to adopt: every AI/automation action is a first-class, inspectable timeline row.
- **Workflow engine audit** — `WorkflowsPage` Activity tab: engine executions with trigger event, HITL/AI-run badges, timestamp, and nested policy-decision lines.

## 7. AI presentation primitives (reusable atoms)
- `components/ui/AIInsightTag.tsx` — teal `✨ AI INSIGHT` micro-label.
- `components/ui/AIAgentLabel.tsx` — colored-dot agent label (purple/amber/teal).
- `Badge` variant `"ai"` (violet) used across workflow/agents.
- Convention: AI surfaces use **teal/violet accents + `Sparkles` icon**; cost/numeric data uses `font-data tabular-nums`; provenance/captions in `text-muted-foreground` `text-[10px] uppercase tracking-wider`.

## 8. Component structure / state / API conventions
- **Feature-sliced** (`src/features/<feature>/{components,hooks,pages,services,types}`). Shared primitives in `src/components/ui/` (Radix + CVA); cross-feature reuse is explicit (`KpiCard` imported into intelligence; `StageStatusConfig` shared between settings and workflow).
- **State management — three tiers:**
  1. **Server state:** per-feature hooks own fetch + cancellation flags + optimistic mutation + `refetch` via a `tick` counter (`useKanbanLeads`, `useAgentAnalytics`). No React Query — hand-rolled with `useEffect`/`useRef`.
  2. **Global UI state:** Zustand stores — `dashboardStore` (layout tree), `copilotStore` (panel open + ask), `authStore`, `themeStore`.
  3. **Local component state:** `useState` for editor/drawer/dialog toggles.
- **API client:** single axios instance `services/http.ts` — attaches Bearer (lazy `require` of authStore to dodge circular imports), does **one silent refresh on 401** then redirects to `/login`. List params use `paramsSerializer: { indexes: null }` for FastAPI repeated-key arrays.
- **Service object pattern:** each feature exports a flat `xxxService` object of thin `http.get/post/...().then(r => r.data)` methods (e.g. `leadService`), typed against `*.types.ts` that "mirror the backend contract." Endpoints are `/api/v1/...`.
- **Backend-driven rendering contracts** worth keeping: ECharts options, KPI/digest/section specs, and persona resolution all come from the API so the console renders new analytics without frontend changes.

**Top files to clone for an AI-native console:** `LeadAISpace.tsx` (AI-proposes→commit + provenance timeline + command center), `CopilotPanel.tsx`/`CopilotResultCard.tsx` (⌘K ask → confirm/commit-to-dashboard), `AgentTable.tsx` + `intelligence.types.ts` (cost-per-action ledger), `dashboardStore.ts` + `KpiCard.tsx` (customizable persona KPI/BI grid), `LeadKanban.tsx` + `useKanbanLeads.ts` (optimistic pipeline), and `WorkflowsPage.tsx` (HITL/executed-by badges + engine audit with policy decisions).

---

# SOURCE DOSSIER: specs

# TESPL Request-to-Quote — Agentic Workflow Spec

## STATES

A state machine carrying an enquiry to a sent quote. Seven canonical forward states (S1-S7) plus three branch/parallel tracks (Declined, On Hold, Quote Live). Transitions move strictly forward except **On Hold** (re-entrant) and **Quote Live** (loop). **POD#** is minted at SRF Confirmed (S3) and is the correlation id for everything downstream.

| State | Canonical state | Operational statuses (left → right) |
|---|---|---|
| **S1** | Enquiry Received | New (threaded to buyer) → Specs parsed → Context briefed |
| **S2** | SRF Drafted | Drafting (article-dynamic) → Clarifying with buyer → Ready for review |
| **S3** | SRF Confirmed | POD# minted → Articles locked → Workstreams fanned out |
| **S4** | Development (parallel) | Tech pack drafted → Fabric bind proposed → Sample planned · SWN issued |
| **S5** | Costing Built | Variants computed from masters → Rates validated → Review ready |
| **S6** | Pricing Approved | Context assembled → Margin proposed → Approved (one tap) |
| **S7** | Quote Sent | Issued & versioned → Exposure map armed |

**Branch / parallel tracks (no canonical S#):**
- **Declined to Quote** — Capability/category mismatch · below MOQ floor · declined with reason, courteously.
- **On Hold** (re-entrant) — Awaiting buyer inputs · resumes where it paused.
- **Quote Live — Focus 2 (watch loop)** — Watching (exposure mapped) → Re-cost triggered → Requote drafted → Revised & versioned → Won / Lost / Expired → learning captured.

**Execution modes (core routing decision):**
- **AI Agent** — decides via *model judgement*. Returns a typed proposal, never a committed side-effect. Effort tag (Low/Med/High) sizes model tier & token budget.
- **Workflow (Deterministic)** — *no judgement*; coded fan-out, formula evaluation, audit logging. Idempotent, replayable.
- **Workflow + Policy** — *rule-driven*; consults the Policy Engine (P1-P14); engine returns the verdict, workflow acts.
- (Hybrid rows combine a mode with a Human gate; two pure-**Human** rows are irreducible decisions.)

**HITL:** Governed by P7 ("AI proposes, a human commits"). Yes = an explicit approval gates the action before it is final (any outbound message, stage change, master edit, booking, price). Every Yes is designed as a **single tap with the homework already attached** — never a form to fill.

## TASKS (task → execution mode)

Rows #29-#31 are cross-cutting and apply at every state.

| # | State | Task | Execution mode | AI agent · effort | HITL | Accountable | Pol |
|---|---|---|---|---|---|---|---|
| 1 | Enquiry Received | Capture & thread the enquiry | Workflow + Policy | — | No | Client Service | P1 |
| 2 | Enquiry Received | Assign the buyer owner | Workflow + Policy | — | No | Client Service | P2 |
| 3 | Enquiry Received | Parse specs from the attachment | AI Agent | Buyer Intelligence · Med | No | Client Service | P4 |
| 4 | Enquiry Received | Assemble the buyer brief | AI Agent | Buyer Intelligence · Low | No | Client Service | P13 |
| 5 | Declined to Quote | Feasibility & fit screen | Hybrid (WF → Human) | — | Yes — one tap | Management | P8 |
| 6 | SRF Drafted | Draft the article-dynamic SRF | AI Agent | SRF Drafter · High | No | Merchandiser | P4 |
| 7 | SRF Drafted | Ask only the spec gaps | Hybrid (AI → Human) | Buyer Intelligence · Low | Yes — one tap | Client Service | P3 · P7 |
| 8 | SRF Drafted | Propose values for open fields | AI Agent | Buyer Intelligence · Low | No | Merchandiser | P4 |
| 9 | SRF Drafted | Reshape the SRF mid-flight (scope change) | AI Agent | SRF Drafter · Med | Yes — one tap | Merchandiser | P4 · P7 |
| 10 | SRF Confirmed | Review & confirm · mint POD# | **Human** | — | Yes — the decision | Merchandiser | P7 · P1 |
| 11 | SRF Confirmed | Fan out parallel workstreams | Workflow (Deterministic) | — | No | — | — |
| 12 | Development | Draft tech pack & construction | AI Agent | Product Development · High | Yes — one tap | Technical / Product Dev | P7 |
| 13 | Development | Propose the fabric bind | AI Agent | Product Development · Med | Yes — one tap | Technical / Product Dev | P5 · P7 |
| 14 | Development | Plan the sample & draft the SWN | Hybrid (AI → Human) | Sampling Agent · Med | Yes — one tap | Technical / Product Dev | P9 · P14 |
| 15 | Development | Track sample milestones | Workflow + Policy | Sampling Agent · Low | No | Technical / Product Dev | P14 |
| 16 | Costing Built | Compute costing from masters | Workflow (Deterministic) | — | No | Costing | P6 |
| 17 | Costing Built | Resolve process & consumption choices | AI Agent | Costing Agent · High | Yes — one tap | Costing | P6 · P7 |
| 18 | Costing Built | Validate vendor rates | Workflow + Policy | Vendor Intelligence · Low | Yes — master change | Costing | P5 · P11 |
| 19 | Pricing Approved | Assemble the pricing context | AI Agent | Pricing Context · Med | No | Costing | P13 |
| 20 | Pricing Approved | Propose margin & price | Workflow + Policy | — | No | Management | P8 |
| 21 | Pricing Approved | Approve the price | **Human** | — | Yes — the decision | Management | P8 · P7 |
| 22 | Quote Sent | Compose & issue the quote | Hybrid (AI → Human) | Quote Composer · Med | Yes — one tap | Client Service | P10 · P7 |
| 23 | Quote Sent | Arm the exposure map | Workflow (Deterministic) | — | No | — | P12 |
| 24 | Quote Live | Sense & re-cost on input moves | Workflow + Policy | — | No | Costing | P11 · P12 |
| 25 | Quote Live | Draft the requote + recommendation | AI Agent | Margin Protection · Med | Yes — the decision | Management | P8 · P12 |
| 26 | Quote Live | Answer the buyer with ready replies | Hybrid (AI → Human) | Reply Drafter · Low | Yes — one tap | Client Service | P3 · P7 |
| 27 | Quote Live | Issue the revised quote | Hybrid (AI → Human) | Quote Composer · Low | Yes — one tap | Management | P10 · P9 |
| 28 | Quote Live | Capture the outcome & learn | AI Agent | Buyer Intelligence · Low | No | Client Service | P13 |
| 29 | Cross-cutting (any state) | SLA & attention budget | Workflow + Policy | — | No | Management | P14 |
| 30 | Cross-cutting (any outbound) | One-tap approval queue | Workflow + Policy | — | Yes — by design | Owner of the step | P7 · P9 |
| 31 | Cross-cutting (any change) | Audit log | Workflow (Deterministic) | — | No | — | P13 |

## POLICIES (P1-P14, id → intent)

| ID | Policy | Level | Intent / Rule | Evaluated by | Used in |
|---|---|---|---|---|---|
| **P1** | Enquiry Intake & Threading | Data | One thread per buyer enquiry; attachments preserved as evidence; dedupe & merge before anything is created; POD# unique from mint. | WF+Policy Engine | #1, #10 |
| **P2** | Buyer Ownership | Assignment | Every buyer account has a named owner; new buyers routed by category/region; AI acts only on the owner's behalf, never unowned. | WF+Policy Engine | #2, #30 |
| **P3** | Buyer Dialogue Scope | Engagement | AI may ask buyers spec-gap questions and send approved ready replies; anything commercial (price, dates, terms) routes to a person. | WF+Policy + Human | #7, #26 |
| **P4** | SRF Fidelity & Article Dynamics | Specification | SRF captured to component level; form shape adapts to article type; AI-proposed values flagged as proposed until human confirms at SRF confirmation. Supports full-fidelity-at-SRF or incremental-by-stage. | WF+Policy Engine | #3, #6, #8, #9 |
| **P5** | Master Governance | Data | Component/process/style/rate masters are versioned; any master change is proposed by AI and confirmed by a human before it takes effect. | WF+Policy + Human | #13, #18 |
| **P6** | Costing Formula Governance | Costing | Costs computed from masters via governed formulas — never assembled by hand; manual overrides allowed but logged with actor and reason. | WF+Policy Engine | #16, #17 |
| **P7** | AI Governance | Governance | AI proposes, a human commits. Every outbound/irreversible action carries a one-tap approval with the homework attached; internal drafts and reads run autonomously. | Workflow + Human | #7, #9, #10, #12, #13, #17, #21, #22, #26, #30 |
| **P8** | Margin Floor & Pricing | Deal governance | Margin floor by buyer/category; pricing below floor — including accepting a delta on a live quote — requires management approval before anything is sent. | WF+Policy + Human | #5, #20, #21, #25 |
| **P9** | External Commitments | Governance | Dates, prices and promises to a buyer are made only by a person; once confirmed, the AI relays, logs and tracks the commitment. | Human (AI relays) | #14, #27, #30 |
| **P10** | Quote Validity & Versioning | Quote governance | Every quote carries a validity window; every revision is versioned with rationale attached; nothing issued at a stale price. | WF+Policy Engine | #22, #27 |
| **P11** | Rate Currency | Data / cadence | Vendor rates refreshed on cadence; every update anomaly-checked vs the 3-month average; stale/volatile rates trigger drafted refresh requests. | WF+Policy Engine | #18, #24 |
| **P12** | Exposure Watch & Re-cost | Monitoring | Every live quote mapped to its cost components; an input past threshold re-costs all exposed quotes and drafts the requote for decision. | WF+Policy Engine | #23, #24, #25 |
| **P13** | Audit & Learning | Governance | Every action logged — actor (AI/human), evidence, version — immutable; outcomes (won/lost/counters) feed buyer intelligence and future pricing. | WF+Policy Engine | #4, #19, #28, #31 |
| **P14** | SLA & Attention Budget | SLA / cadence | Per-state SLA with early escalation; the 15-minute human-attention budget tracked per POD — the measure of compression itself. | WF+Policy Engine | #14, #15, #29 |

## Key design notes (implementation)
- **Orchestration:** Temporal is the spine. Each canonical state = durable workflow state; each task row = an activity (deterministic activities for WF rows, agent-call activities for AI rows, policy-query activities for WF+Policy rows). **POD# is the workflow id / correlation key.**
- **Agent outputs are proposals:** every AI Agent activity returns a typed proposal object; committing is a separate step gated by the row's HITL flag — this makes the responsibility/accountability split real in code.
- **Dynamic SRF (P4) is the substrate:** schema is article-type-driven — the set of component sections is a function of article type (a quilt yields front/back fabric + filling + quilting; a napkin does not). Build it as a **schema-per-article-type resolver, not a fixed form** — the single biggest design lever. Open question for Gautam: full fidelity at SRF vs fidelity that builds by stage — the resolver supports either.
- **Costing as two rows on purpose:** #16 (compute from masters) is pure deterministic formula evaluation, no model. #17 (resolve ambiguous process/consumption choices) is AI Agent. Do not collapse them — the boundary is exactly the "is intelligence required?" call.
- **One-tap approval queue (#30, P7) is a first-class surface, not a notification.** Everything outbound/committing lands there with its rationale, approvable in a single tap. The 15-minute human-attention budget (P14) is measured against time spent in this queue — it is the compression metric.
- **Focus 2 (Quote Live, #24-#28) is the same workflow continuing** past Quote Sent — reusing the same agents and approval queue, with the exposure map (armed at #23) driving re-cost triggers. Monitoring is not a separate subsystem.

---

# Fakhruddin Group — Enterprise AI Platform (Customer Requirements)

## REQUIREMENTS

**Context / problem:** 16 departments interviewed, 80+ pain points, 8 recurring themes in every team. The systemic problem: manual follow-ups, approval bottlenecks, fragmented communication, no real-time visibility, zero structured accountability. The leadership question they cannot answer today: *"Who owes what to whom, by when, based on which meeting or document — and what happens if they do not act?"*

**Vision:** An AI-native company — humans and agents side by side. A joint workforce where a 10-person team gradually becomes "9 agents and 1 human caretaker." One platform, not a patchwork. Two audiences: leadership (strategy + exceptions) and departments (tasks + workflows), same system scoped by role. The pipeline: **Interaction → Capture → Structure → Track → Escalate → Visibility** (every important interaction becomes a structured decision, a tracked task, a searchable memory, and a leadership-visible status).

**Defining capability — "Hire, Run & Manage AI Employees":** Lifecycle = **Instantiate → Configure → Deploy → Manage → Retire** (full audit trail kept). Agents instantiated from template or scratch; configured with role, instructions, data access, permissions & usage budget; deployed into a department + shared backbone; supervised by a human caretaker; retired/paused/replaced cleanly.

### Tier model (T1-T4) — agents come in tiers, one super-agent per department
- **T1 — Basic execution:** reminders, status updates, standard reports.
- **T2 — Optimization:** spot bottlenecks, suggest fixes, detect anomalies.
- **T3 — Thinking / planning:** risk analysis, scenarios, recommendations.
- **T4 — Super-agent:** orchestrates a department's agents, reports to the department head.

### Ten core capabilities (for every department)
1. Capture communication (meetings, calls, emails, chat)
2. Summarize into decisions (decisions, risks, tasks)
3. Assign owners & deadlines (clear accountability per item)
4. Track completion & escalation (nothing slips silently)
5. Automated reminders (follow-ups without chasing)
6. Reports without manual effort (auto-generated, on demand)
7. Leadership dashboards (for CEO and department heads)
8. Search all knowledge (one question, sourced answer)
9. Reduce repetitive work (fewer repeated emails/messages)
10. Escalate before crisis (surface delays early)

### The 9 business layers (bottom → top; "for discussion, not prescription")
1. **01 Source Systems** — Teams, email, meetings, ERP/CRM, documents
2. **02 Ingestion** — capture from every source; normalize and enrich
3. **03 Canonical Model** — one shared vocabulary: people, projects, units, documents, commitments
4. **04 Storage** — where structured data, knowledge and relationships live
5. **05 AI Processing** — transcribe, summarize, extract, classify, connect
6. **06 Model Gateway** — routes queries internal-first; governs external use, permissions & budgets
7. **07 Agent Layer** — the digital workforce: instantiate, run & manage AI employees
8. **08 Action / Task Registry** — the accountability core: tasks, owners, deadlines, dependencies, escalation
9. **09 Dashboards & Security** — leadership/department views; access control, permissions, audit

### The 16 departments (in scope, phased rollout)
Operations, Projects, FIS, Customer Service, Sales, Leasing, Legal, Finance, Procurement, HR, Marketing, Owners Assoc., IT, Administration, Property Mgmt, Hospitality\*.
- **Boundary:** Hospitality\* (hotel PMS) runs separately and is **out of scope** for the core platform.

### Pilot scope (6 departments — "prove it where pain connects")
**Operations, Projects, FIS, Customer Service, Marketing, Legal** — the six where pain is most interconnected.
- **Pilot must deliver:** meeting intelligence + a live action/task registry + a leadership dashboard.

### Constraints / non-negotiables (boundaries)
- **Data stays internal** — on-premise and company-owned; data must not leave their infrastructure without explicit, approved exceptions.
- **Open-source first** — own the platform (code, models, IP); minimize vendor lock-in and per-seat cost escalation.
- **Internal-first AI** — queries answered internally by default; external models only via approval, with per-department usage budgets.
- **Voice: no audio kept** — meetings/calls transcribed, then audio discarded (UAE legal requirement — transcripts only).
- **Strict access control** — department-level permissions + full audit trails (e.g. HR salary data invisible to other departments).
- **UAE compliance** — UAE PDPL data-protection compliance throughout; plus RERA evidence requirements where relevant.

### Timeline & scope boundaries
- **Version 1 live by end of October 2026** — focused, scoped first release proven across the pilot departments; **five-month build, bi-weekly milestones**.
- Phases: **NOW** (requirements & partner selection) → **PILOT** (meeting intel + task registry + dashboard across 6 pilot depts) → **V1** (scoped first release, end Oct 2026, closed loop) → **BEYOND** (expand across departments; more agents, more data sources, predictive).
- **V1 boundary:** internal operations are the focus for V1; customer-facing automation comes only after internal data quality improves.
- They value partners who prove value fast, iterate on a tight cadence, and **transfer ownership** to them (not lock-in).

### Success criteria (leadership gets sourced answers in seconds)
Example questions the platform must answer with evidence-backed, sourced answers in seconds: "What did we commit to last week, and who hasn't delivered?" · "Which projects are at risk, and why?" · "What are the top customer complaints right now?" · "What approvals are blocking operations today?" · "Show me every overdue task across the company." · "What did Legal flag from last month's contracts?"

**Framing:** "We're not buying software. We're building our organization's intelligence infrastructure — and its digital workforce." Accountability-first; internal, owned, UAE-compliant by design.

Source files:
- /Users/palivelasrihari/onyx_all/content/TESPL_RTQ_Agentic_Workflow_Map_SPEC.docx.pdf
- /Users/palivelasrihari/onyx_all/content/Fakhruddin-Enterprise-AI-Vendor-Brief  v1.pdf

---

# SOURCE DOSSIER: framework

I have all nine docs plus the README. Here is the canonical spec.

# Onyx Meridian — Platform Requirements Spec (Canonical Reference)

*Distilled from `/Users/palivelasrihari/onyx_all/FRAMEWORK/` (README, 01-09). Each requirement is tagged with its source doc. This is the reference design agents build against.*

---

## 0. Thesis & Operating Model

**The product in one line:** "Two visibilities, one engine." Onyx Meridian turns an existing enterprise into an AI-native one by standing up a governed digital workforce, where every unit of work is **effective, affordable, and reversible**. [README, 08]

**Why enterprise AI fails — the two failure modes the platform must structurally prevent:** [08, README]
- **Effectiveness gap** — output isn't trustworthy enough to remove the human.
- **Cost inversion** — the AI costs more than the human it was meant to replace.

**The two continuous control surfaces (first-class, always-on, per unit of work):** [README, 01, 08]
- **EFFECTIVENESS** — KPIs + observability + explainability, per task/policy/stage.
- **COST** — execution-mode routing (cheapest sufficient mode), effort-sized model spend, internal/on-prem-first gateway, budgets, and reversibility to humans.

**What "AI-native" means** [01]: unit of execution moves from human → AI employee; unit of accountability moves from inbox → task registry; unit of management moves from headcount → blended (human+agent) org chart. Not "deploy a chatbot" — an AI employee owns outcomes (job, tools, permissions, budget, KPIs, manager).

**The six operating moves, in order (overlay, not rip-and-replace):** [01]
1. **Ingest** from source systems (read-only first): meetings, email, chat, ERP/CRM, docs.
2. **Understand** — normalize into canonical model + knowledge layer; ground agents in the 7 context layers.
3. **Act through** existing systems via scoped connectors (Co-Work / Application-Use Agent).
4. **Account** — every commitment becomes a Task/Accountability Registry record.
5. **Govern** — Policy Engine authorizes every action; immutable audit; Model Gateway governs LLM spend.
6. **See** — digital twin + dashboards for leadership; role-scoped workspaces for departments.

**Human roles (accountability never goes to zero):** [01, 04] Caretaker (per unit, owns output/exceptions), Reviewer/approver (gates), Domain expert (curates knowledge/policy, fixes knowledge misses), Leadership (twin/dashboards, sets KPIs/policy), Platform owner / "AI Ops / AI HR" (runs registry, gateway, evals, governance).

**Ten non-negotiable design principles** [README]: (1) overlay not rip-and-replace, on-prem capable; (2) AI employees are governed principals; (3) accountability (Task Registry) is the core, not chat; (4) effectiveness & cost first-class per task; (5) AI proposes, a human commits; (6) progressive autonomy / earned trust; (7) governance by construction; (8) LLM-agnostic via gateway; (9) one canonical model; (10) reversible by design.

**Enterprise-readiness bar** [01]: accountable, reversible, least-privilege, observable, effective-and-costed, bounded-in-cost, compliant — designed into the runtime, not added later.

---

## 1. The Seven Implementable Layers (L0–L6) [02]

The customer's 9-layer business story is re-expressed as 7 buildable layers. The story's biggest omission is **L0 Infrastructure** (on-prem requirement) plus an explicit **L6 Skills & Command**.

| Layer | Name | Must provide |
|---|---|---|
| **L6** | Skills & Command | Create/maintain reusable **skills** an agent can be granted; **Command = application-use** — agent acts as a standalone app OR embedded into existing application workflows (Co-Work). The acting surface where intelligence meets real systems. |
| **L5** | Intelligence | The agent loop **Plan · Recall · Act · (reflect)**; orchestration runtimes; **model gateways** that route every model call (on-prem-first, budgeted). |
| **L4** | Governance (the "Vault", cross-cuts L1–L6) | Identity & access, policy verification, HITL, audit, budgets — applied to every action in every layer. |
| **L3** | Knowledge | Temporal evidence of every AI decision; the 7 context layers; indexes; **policy memories** (effectiveness of each policy); enterprise **processes** (BPMN-ish); **base ontology + entity graph that *polices* automation traversals** (agents move only along sanctioned relationships). |
| **L2** | Storage | Where structured data, knowledge, relationships physically live. |
| **L1** | Integration | Systems of record + **events, ETL, conversation channels** (email/chat/meetings) + a **structuring/enrichment pipeline** that normalizes raw capture before Knowledge. |
| **L0** | Infrastructure (on-prem first) | On-prem/hybrid compute; **agent runtime for SLMs/LLMs**; orchestration; storage substrate; security + observability baseline. Supports public/private/on-prem/hybrid; on-prem is the design default. |

**Binding engine (spans the stack):** the **Workflow/Task-Execution engine (Flow)** binds L5 intelligence to L3/L4 rules over the L1/L2 substrate. [02]

---

## 2. The Six Operational Planes [02, README]

A valid operational grouping that maps cleanly onto the 7 layers (use planes for ops, layers for engineering, 9-layer story for the customer). Governance cross-cuts all.

| Plane | Crosswalk |
|---|---|
| **Source** | source systems |
| **Data (ingest)** | L1 Integration, L2 Storage |
| **Intelligence** | L3 Knowledge + L5 Intelligence |
| **Agent-Runtime** | L5 + L6 |
| **Orchestration** | the Workflow/Task engine (Flow) |
| **Experience** | L6 + dashboards/workspaces |
| *(Governance — cross-cutting)* | L4 Vault |

**Layer ⇄ plane ⇄ accelerator ⇄ 9-layer crosswalk** [02]: L0→substrate; L1→Data (01 Source/02 Ingestion); L2→Data (04 Storage); L3→Data+Intelligence / **Pulse** (03 Canonical / 05 AI processing); L4→Governance / **Vault** (09 Security, 06 Gateway); L5→Agent-runtime+Intelligence / **Prism** (06 Gateway, 07 Agent); L6→Experience+runtime (07 application-use); Workflow engine→Orchestration / **Flow** (08 Action/Task registry); Measurement loop→Governance/Experience / **Ensure** (09 Dashboards).

---

## 3. Canonical Model — Entities & Relationships [05]

A shared ontology every plane reads/writes (the lingua franca; how context moves across systems).

**Core entities:** [05]
- **Person** — human staff (identity, role, unit, manager).
- **AIEmployee** — a digital worker; **a first-class peer of Person in the org graph**.
- **Unit** — a department / business unit.
- **Project** — an initiative spanning tasks/people/units.
- **Document** — any captured artifact (meeting/email/PDF/contract) + provenance.
- **Commitment/Task ★** — an obligation: who owes what to whom, by when, from which source.
- **Customer** — external party (lead/account).
- **Asset** — a tracked thing (property/unit/equipment/SKU).
- **Event** — a state change emitted on the bus; drives Flow, reminders.

**Key relationships:** [05]
- `Person|AIEmployee —member_of→ Unit`
- `Commitment —owned_by→ Person|AIEmployee`
- `Commitment —derived_from→ Document`
- `Commitment —blocks→ Commitment` (dependency graph)
- `Project —contains→ Commitment`

**Requirement:** Because `AIEmployee` is a peer of `Person`, "who owns this" and "who reports to whom" must work identically for humans and agents — the foundation of the blended org chart. Ingestion must keep this graph current from source systems. [05, 01]

---

## 4. The Three Nested Abstractions [README, 03, 04, 05]

### 4.1 AI Employee — the atomic actor [03]
A persistent, versioned, governed principal (not a prompt, not an ephemeral agent call). Must carry the full anatomy:
- **Identity** (employee_id, version, name, avatar, unit_id, reports_to → agent or human)
- **Role** (job title, responsibilities, KPIs, charter)
- **Tier**: T1 Execution · T2 Optimization · T3 Planning/reasoning · T4 Super-agent (tier is config + model policy, not separate code; T1 can be promoted to T2)
- **Capabilities** (scoped tools/connectors it may invoke)
- **Permissions** (data_scopes, action_scopes read/write/approve, explicit `deny`; deny-by-default; least-privilege)
- **Autonomy** per (employee × task-type × data-scope): Shadow→Assist→Supervised→Autonomous
- **Budget** (token/$ ceiling, action rate limits)
- **Context bindings** (which of the 7 context layers it's bound to)
- **Model policy** (preferred/allowed models, routed via gateway)
- **Memory**: short-term (session), long-term (per-employee vector + canonical facts = "training"), episodic (task history/outcomes → promotion/retraining signal). Memory is scoped/governed — no cross-employee reads.
- **Supervision** (caretaker, escalation rules), **Owner**, **Audit** (immutable record of every action)

**Lifecycle ("HR for AI"), five governed states, every transition logged, configs versioned for instant rollback:** [03]
`INSTANTIATE (draft) → CONFIGURE (configured) → DEPLOY (deployed, starts in Shadow/L0) → MANAGE (deployed) → DECOMMISSION (retired)`. Instantiate from an **archetype** (reusable job template, e.g. `sales.quote_drafter`); Configure validated against policy (can't grant a scope the configurer can't delegate); Deploy issues scoped credentials, starts Shadow; Manage promotes/demotes autonomy via Ensure evals, versions every change; Decommission revokes credentials, reassigns in-flight tasks, archives audit trail.

**Three components that make employees real:** AI-Employee Registry (system of record + CRUD + lifecycle + versioning + Admin Console), Agent Runtime (config-driven plan→act→observe enforcing budget/autonomy/timeouts), Agent Identity & Access (first-class principal, own credentials, vaulted secrets, rotation, actions attributed to the employee). [03]

### 4.2 AI Business Unit — a department [04]
A self-contained governed team: **1 super-agent (T4) + N AI employees + ≥1 human caretaker**, operating against a charter and KPIs. The unit of rollout.

**Must define:** Charter (mandate, scope boundaries), KPIs/SLAs (throughput, turnaround, accuracy, escalation rate, cost — roll up to twin), Task-registry slice, Knowledge slice (permission-scoped), Connectors (scoped at unit, narrowed by employees), Staffing plan (AI vs human + autonomy per role).

**Super-agent loop (T4):** `intake → decompose → assign → monitor → escalate → report`. It assigns but does **not** bypass governance — each assigned employee still passes every action through the Policy Engine at its own autonomy level. Super-agent has its own permissions and audit trail. [04]

**Caretaker (≥1 per unit, accountability never zero):** owns outcomes/KPIs, reviews exceptions + sampled output, approves above risk threshold, adjusts scope/autonomy, resolves knowledge misses, can **kill-switch any employee or the whole unit instantly**. [04]

**Two audiences, one system (canonical model + RBAC, not separate systems):** Leadership view (strategy + exceptions) and Department view (tasks + workflows, role-scoped). [04]

**Unit rollout play (repeatable):** Map → Model → Staff → Shadow → Promote → Operate → Optimize. [04]

### 4.3 AI-Native Organization [05]
Units become an *organization* only via four shared spines: **(1) Canonical Model**, **(2) Action/Task Registry**, **(3) Flow cross-unit orchestration**, **(4) Digital Twin** — all governed centrally. (Details in §3, §6, §7, §8.)

---

## 5. The Action / Task Registry — the accountability core [05, 01]

The single most important new component; the literal answer to *"who owes what to whom, by when, based on which meeting/document, and what happens if they don't act?"* Conversation is an input; **commitments are the output**.

Every commitment is a first-class tracked record with: `task_id, title, owner {type: human|ai_employee, id}, delegated_by, source {type, doc_id, quote}, unit_id, due, status (open|in_progress|blocked|done|missed|cancelled), depends_on[], escalation {policy, after_hrs, before_due}, autonomy_at_creation, audit_ref`. [05]

**Must provide:** Provenance (every task → source meeting/doc/email), Ownership (human or AI, nothing unassigned), Dependencies + escalation ("nothing slips silently"; escalate *before* the deadline), and a measurable system (completion rates, bottlenecks, SLA breaches → twin + Ensure). Fed by AI Processing (meeting/email → commitments) and direct task creation; emits Events that drive Flow, reminders, dashboards. [05]

---

## 6. The Control Framework — Effectiveness & Cost [08, 02, 01]

**The substrate chain:** `PROCESS → WORKFLOW (state machine) → TASKS (per transition) → execution-mode delegation → policy → HITL → accountable human → KPIs + cost meter`. Most processes aren't understood up front, so the platform must **devise any workflow, control the level of automation, and measure effectiveness** of whatever is translated to agentic-or-human. [08, README]

**Each task carries six attachments:** [08]
- **execution mode** {Deterministic | Workflow+Policy | AI Agent} — the COST lever
- **policy** (P1…Pn) — governance
- **HITL flag** (AI proposes → human commits) — trust/safety
- **accountable human** — accountability
- **KPIs** — EFFECTIVENESS
- **cost meter** (tokens/$ + model tier) — COST

### 6.1 The cost lever — execution-mode delegation [08]
Every task runs in **exactly one** mode. Choose the **cheapest sufficient** mode — *don't spend a model where a rule or code suffices.*

| Mode | Decides via | Model cost | Use for |
|---|---|---|---|
| **Deterministic Workflow** | no judgement | none | mint id, fan-out, costing formula from masters, arm a watch, write audit log |
| **Workflow + Policy** | rule-driven (policy engine) | none | owner assignment, cadence, rate-staleness, margin floor, approval routing, SLA |
| **AI Agent** | model judgement | model cost (sized by effort) | parse specs, draft, propose a value/bind, resolve ambiguity, recommend requote |

- **Effort tags (Low/Med/High)** on each AI task = sizing hint for model tier + token budget → direct per-call cost control.
- All model calls route through the **Model Gateway** (internal/on-prem SLMs first); same task can be served by a cheaper model when budget demands.
- **Canonical rule — don't collapse the modes:** the "is intelligence required?" boundary is decided per field by the solution designer (e.g. TESPL costing is *two* rows on purpose: compute-from-masters = Deterministic, resolve-ambiguous-choices = AI Agent). That boundary is where cost is won or lost.

### 6.2 The trust + accountability lever — proposals & HITL [08]
- **Agent outputs are typed proposals, never committed side-effects.** Committing is a separate step gated by the task's HITL flag.
- **AI proposes, a human commits.** AI Core is **RESPONSIBLE** (does the work); a named human is **ACCOUNTABLE** (owns the decision). Three parties per task: served party (customer), AI Core (operator), accountable human.
- **One-tap approval queue is a first-class surface, not a notification.** Everything outbound/committing lands there with homework/rationale pre-attached — "design every Yes as a single tap, never a form." Some decisions are irreducibly human (confirm spec, approve price).

### 6.3 The governance lever — Policy Engine + versioned policy catalog [08]
Workflow+Policy tasks consult a **versioned policy catalog**. A policy that ends in a decision **routes it to the accountable human — it never decides it itself.** Catalog themes (TESPL P1–P14 illustrative): intake & ownership, dialogue scope, data governance, costing, AI governance, pricing (margin floor), commitments, monitoring, audit & learning, SLA & attention. **"Policy memories"** track how effective each policy is (L3) → policies are tuned, not frozen.

### 6.4 The effectiveness surface [08]
KPIs continuously attributed to the action at each stage/task on a dashboard (turnaround, approval rate, **override rate**, rework rate, win rate, SLA adherence). Two distinct angles required: **explainability** ("why did it behave that way?") and **observability** ("it went wrong — do I know why?"). Immutable audit log (actor, evidence, version) is the temporal evidence layer. This surface = **Ensure**.

### 6.5 The cost surface [08]
**Cost trace per stage transition** (e.g. given 1000 leads, cost to move prospect→qualified). Attributed per task → per stage → per workflow. **Cost-to-automate vs cost-of-human** comparison per piece of operations. The **human-attention budget** (e.g. 15-min-per-item) tracked against time in the approval queue = "the measure of compression itself."

### 6.6 The reconciliation — automation dial + human fallback [08, 01]
```
more automation ◀──────────────────────────────────────▶ more human
AI Agent (autonomous) · AI Agent (HITL) · Workflow+Policy · Human-responsible
   L3 Autonomous          L2/L1                              L0 (assign to person)
```
- Automation level is **adjustable per task, continuously** — without re-architecting.
- If an AI task is not effective enough or too costly, **flip it to a human-responsible workflow**: same state machine, task becomes "assign to a person; human acts and updates the record."
- Designed for **full rollback**: an entire department can revert to human-centered operations.
- **This same dial IS the progressive-autonomy ladder** [01]: Shadow (L0, observe/propose) → Assist (L1, human approves each action) → Supervised (L2, on-the-loop, can undo) → Autonomous (L3, off-the-loop, audited after). Autonomy is per (employee × task-type × data-scope), enforced by Policy Engine, promoted/demoted by **Ensure** evals (effectiveness) + budget (cost). Drift auto-demotes; kill switch suspends instantly.

### 6.7 Orchestration spine (how it runs) [08, 02]
**Temporal-style durable workflow engine** (the **Flow** accelerator): canonical state = durable workflow state; each task = an activity (deterministic activity / agent-call activity / policy-query activity); a business correlation id (`POD#`, `lead_id`) = the workflow id. **Idempotent, replayable, fully auditable.** Monitoring is not separate — e.g. a "Quote Live" watch is the same workflow continuing past Quote Sent.

**Worked proofs:** CRM lead lifecycle (the live proof, ~June 30 — per-stage tasks, execution-mode routing, lead-assignment policy incl. skill match, cost trace per stage, KPI dashboard, human-fallback). TESPL Request-to-Quote (7 states + 3 branches, 31 tasks, 3 modes, P1–P14, one-tap queue, immutable audit, dynamic SRF, costing-as-two-rows). [08]

---

## 7. The Five Accelerators [09, README]

Composition on every task: **Pulse recalls · Prism informs · Flow routes & executes · Vault authorizes · Ensure measures.** [09]

| Accelerator | Layer(s) | Primary control surface | Must provide |
|---|---|---|---|
| **Pulse** — Knowledge Intelligence | L3 Knowledge, L5 Recall | Effectiveness (grounding) | Real-time **cited** knowledge layer in the flow of work; knowledge/vector store, context layers, indexes, base ontology/entity graph; the Recall step. Good retrieval → cheaper models succeed (also serves cost). Reuse `lms-onyx`. |
| **Prism** — Decision Intelligence | L5 + Experience | Effectiveness + Cost dashboards | Predictive, role-aligned insight (anomalies, trends, opportunities); powers the **Digital Twin** + leadership view; renders KPIs per stage, exceptions ("escalate before crisis"), **cost trace per stage**, cost-to-automate vs cost-of-human. Reuse + harden `onyx-pulse`/`ConvBI`; consolidate NL→SQL. |
| **Flow** ★ — Workflow Intelligence | Workflow engine (L5↔L3/L4) | **Both — the control substrate** | The state-machine + task-execution + cross-unit engine; Temporal-style durable orchestration; home of **execution-mode delegation, policy-gated tasks, one-tap approval queue, cross-unit workflows**; where the automation dial / human fallback is applied per task. **New — highest-leverage build.** TESPL RTQ is its blueprint, CRM its first instance. |
| **Ensure** — Observability & Improvement | cross-cutting (Governance/Experience) | Effectiveness + ROI; gates autonomy | KPIs, evals, **explainability + observability**, **drift detection** (→ auto-demote autonomy), **knowledge-gap / "knowledge miss"** detection → tasks for domain experts, **promotion gates** (the objective criterion for moving up the ladder), spend-vs-outcome/ROI, human-attention (compression) budget. Consumes audit log + traces + KPI/cost meters. Unify Langfuse fragments. |
| **Vault** — Security & Governance | L4 Governance (cross-cuts all) | Trust/compliance + cost (gateway) | **Policy Engine** (pre-action authorize), per-employee **least-privilege identity**, **Model Gateway** (on-prem-first routing + budgets + data-egress control), **immutable audit ledger**; enforces "AI proposes, human commits." Model Gateway is also a primary cost control. **Mostly new — `onyx_vault` is an empty stub.** |

The two greenfield accelerators — **Flow** and **Vault** — are what turn existing capabilities (Pulse, Prism) into an enterprise-ready, governed, cost-controlled platform rather than a set of demos. [09]

---

## 8. Governance, Trust & Observability [06]

**The trust invariant (one line):** *Nothing executes without authorization; nothing happens without a record.* Enforced **by the runtime**, not as an after-the-fact report. [06]

1. **Policy Engine** — pre-action gate the runtime calls before any tool/connector invocation. Input `{actor, action, target, data_scope, context}`. Four checks: permission-aware, policy-compliant, autonomy (L0–L3 for this task?), budget. Three outcomes: **allow** (execute + audit), **require-approval** (route to human gate), **deny** (block + audit). Decisions explainable (which rule, which scope) + auditable. Policies versioned, authored centrally; units/employees inherit and may only **narrow, never widen**. [06]
2. **Agent Identity & Access** — every AI employee is a first-class principal (governed service identity, own credentials, not a shared key); least-privilege data + action scopes, deny-by-default; secrets **vaulted + rotated, never in config/code**; actions attributed to the employee identity → clean audit + clean decommission. [06]
3. **Model Gateway** — all LLM/embedding calls through one gateway: **internal-first routing**, per-employee/per-unit **budgets** (token + $ ceilings, rate limits; over-budget = deny/downgrade), **data-egress control** (PII redaction + classification before any prompt leaves the boundary; block sensitive data from external models), **caching + fallback**. Harden the existing LiteLLM proxy. [06]
4. **Audit Ledger** — append-only, queryable record of every decision/action with full context (actor, action, target, inputs/outputs, policy decision, model used, cost, autonomy level, human approver, timestamp). Linked from each Task Registry record (`audit_ref`) and each employee. Powers compliance, forensics, "show me why the agent did that." (Langfuse traces are the observability half; the immutable ledger is the new half.) [06]
5. **Ensure** — quality (sampled review + automated evals), drift (→ auto-demote + alert), cost/value (ROI on twin), knowledge-gap detection, promotion gates. [06]
6. **HITL & safety controls** — approval gates (configurable per unit/employee/action), autonomy ladder (enforced by Policy Engine, default conservative), **kill switch** (employee/unit/whole workforce; in-flight tasks reassigned/held), **shadow mode** for every new/changed employee, **sandboxed tools** (typed, scoped, read-only by default; write/approve = explicit grants; LLM-generated SQL runs as least-privilege read role + validation), reversibility (config versioning + rollback + clean decommission). [06]
7. **Compliance & deployment posture** — deployment-agnostic (public/private/on-prem/hybrid, same governance in each); data residency & retention (classification-driven, configurable per regulation); **separation of duties** (who configures employees ≠ who approves high-stakes actions ≠ who audits). [06]

---

## 9. The Digital Twin [05]

A **live operational model of the enterprise** (current state + prediction) that powers leadership. It is a **read model projected from canonical model + task registry + KPIs + Ensure metrics — not a separate database of truth.** [05]

- **Current state** — open commitments, throughput per unit, escalations, blocked dependencies, employee workloads, spend.
- **Predictive** — where deadlines are about to slip, which deals are at risk, where a bottleneck is forming ("escalate before crisis"). This is where **Prism** plugs in.
- **Decisioning** — leadership sees strategy + exceptions; can drill from a KPI → underlying tasks → sources → the agent actions that produced them — all governed and auditable.
- **Must include the workforce** — humans + AI employees (because AIEmployee is a peer of Person).

---

## 10. Build Status / Greenfield Map (for sequencing) [07, 09]

Intelligence capabilities largely exist; the **spine is greenfield**. Reuse: Pulse (`lms-onyx`), Prism (`onyx-pulse`/`ConvBI`), agent runtime (`lms-onyx` streaming_controller / `ConvBI` LangGraph), identity/RBAC (`lms-onyx` auth → extend to agent principals), AI Processing (`lms-onyx`/`onyx-pulse`). **Net-new (the wedge):** Canonical Model + Ingestion, **★ Action/Task Registry**, **Flow** (cross-unit orchestration), Digital Twin (read-model), full **Governance plane** (Policy Engine + Model Gateway + Audit Ledger + Ensure; `onyx_vault` is empty). Consolidation mandates: one NL→SQL engine, one identity service, one org/registry service, one model gateway. Phasing: P0 Foundations+safety → P1 Pilot (meeting intel + Task Registry + leadership dashboard, the Fakhruddin ask) → P2 Business-unit model → P3 Org-wide (Flow + predictive twin + full governance) → P4 Optimize. Each phase independently valuable and reversible; governance built in parallel from day one. [07]

---

Source files (all under `/Users/palivelasrihari/onyx_all/FRAMEWORK/`): `README.md`, `01-operating-model.md`, `02-reference-architecture.md`, `03-ai-employees.md`, `04-business-units.md`, `05-organization-and-digital-twin.md`, `06-governance-trust-observability.md`, `07-roadmap-and-repo-mapping.md`, `08-effectiveness-and-cost-control.md`, `09-accelerators.md`.

---

# SOURCE DOSSIER: current-build

I have everything needed. Here is the exact capability inventory.

---

# Onyx Meridian — Capability Inventory (v0.3.0)

The **control-plane spine** for governed AI employees: a FastAPI service (Python 3.11, Pydantic v2) + a React 19/Vite/Tailwind admin console. It governs the AI-employee lifecycle but **does not run agents itself** (only an `echo` adapter ships). Pure core (domain/governance/gateway, no I/O) with impure edges (services/routes/store). Boots with zero infrastructure (in-memory store fallback).

## 1. Canonical Entities Modeled

Defined in `meridian/schemas/`; collections declared in `services/store.py`.

| Entity | Schema | Collection | Notes |
|---|---|---|---|
| **Unit** (department) | `unit.py` | `units` | `allowed_scopes` catalog, `require_approval_for_deploy/decommission`, `budget_monthly_usd`, caretaker. Lifecycle: onboarding→active→paused→archived |
| **Archetype** | `archetype.py` | `archetypes` | reusable job template; seeds capabilities/scopes/KPIs/adapter; unique `key` |
| **AIEmployee** | `employee.py` | `employees` | full config inline: Role(responsibilities/kpis/charter), Permissions(data/action/deny scopes), Budget, Supervision(caretaker), ModelPolicy, autonomy, `per_task_autonomy`, adapter_type/config, `version`, `spent_usd`, `principal_id`, lifecycle timestamps |
| **Run** | `run.py` | `runs` | one heartbeat: model, in/out tokens, cost_usd, `principal_id` attribution, status, summary |
| **Approval** | `approval.py` | `approvals` | HITL queue item: type, status, subject_employee, payload, decided_by |
| **AuditEvent** | `audit.py` | `audit_ledger` | append-only governance record |
| **CostEvent** | (inline dict) | `cost_events` | per-run atomic cost record for roll-ups |
| **Principal** | (inline dict) | `principals` | agent credential: scopes, peppered token_hash, prefix, status |
| **Person** (human staff) | `person.py` | `persons` | peer of AIEmployee in the org graph |
| **Document** | `document.py` | `documents` | captured artifact (meeting/email/pdf/chat/note) + provenance |
| **Project** | `project.py` | `projects` | initiative spanning tasks; status planned/active/done/cancelled |
| **Task/Commitment** ★ | `task.py` | `tasks` | the wedge — see §5 |
| **Event** (domain bus) | `event.py` | `events` | append-only domain signal (distinct from audit) |

## 2. AI-Employee Lifecycle + State Machine

`domain/lifecycle.py` (pure) is the single source of truth; orchestrated by `services/employee_service.py`.

- **States** (`EmployeeStatus`): `draft → configured → deployed → suspended → retired`.
- **Transitions** (`ALLOWED_TRANSITIONS`): draft→{configured,retired}; configured→{configured (re-config, version++), deployed, retired}; deployed→{suspended, retired}; suspended→{deployed (resume), retired}; retired = terminal.
- **Lifecycle ops**: INSTANTIATE (from archetype or scratch, →draft), CONFIGURE (versioned, policy-checked, adapter-validated), DEPLOY (HITL-gated, issues credential, starts in SHADOW), SUSPEND/RESUME, autonomy PROMOTE/DEMOTE, DECOMMISSION (HITL-gated for live, revokes credential).
- **Autonomy ladder** (`AUTONOMY_LADDER`): shadow → assist → supervised → autonomous (single-step `next_autonomy`/`prev_autonomy`). Promotion requires `eval_passed=true` (trusted flag, no real eval). Deploy always resets to SHADOW.
- **Tiers** (`Tier`): T1_execution, T2_optimization, T3_planning, T4_superagent (declared/stored only; no behavioral difference).
- Every transition: state-machine check → policy check → audit record → version bump where applicable.

## 3. Governance

- **Policy Engine** (`governance/policy.py`, pure): `authorize_configuration` (least-privilege, wildcard `sales.*`/`*`-aware, grant-vs-deny conflict detection) and `authorize_deploy` (active unit + configured state + caretaker present). Returns `PolicyVerdict`; `PolicyDenied`→403 with reasons.
- **Audit Ledger** (`services/audit_service.py`): append-only (`record`/`list_events`, no update/delete path). actor, actor_type (user/employee/system), action, entity, unit, details, timestamp.
- **Model Gateway + Cost Meter** (`gateway/model_gateway.py`, pure): on-prem-first `route(policy, requested_model)` and `cost_usd()` from a static pricing table (internal/onyx-llm free; azure/openai/anthropic priced; fallback). No real LiteLLM proxy, no budgets/egress enforcement at the gateway.
- **Agent Identity** (`governance/identity.py` + `services/identity_service.py`): each deployed employee = first-class principal. High-entropy `omk_*` bearer token, peppered HMAC-SHA256 hash stored, plaintext shown once. `issue_for_employee` (at deploy), `rotate`, `revoke` (at decommission), `verify` (token→claims, updates last_used). One active credential per employee; scopes copied from permissions. Pepper from settings (`CREDENTIAL_PEPPER`).
- **HITL Approval queue** (`services/approval_service.py`): `ApprovalType` = deploy, decommission, autonomy_promote, budget_override. On approve: re-validates state then executes parked `_perform_*` (lazy import breaks cycle). Only deploy/decommission are executable; autonomy_promote/budget_override are recorded but not auto-executable.
- **Budget hard-stop** (`run_service._enforce_budget`): when accumulated `spent_usd ≥ monthly_usd`, auto-suspends employee + opens budget_override approval + audits. (Spend is lifetime-accumulated; no monthly window reset.)

## 4. Action/Task Registry (the wedge) + Meeting Ingestion

- **Registry** (`services/task_service.py`, `domain/task_lifecycle.py`): commitment as first-class record — Owner (person|ai_employee, validated to unit), Source/provenance (meeting/email/pdf/chat/manual + doc_id + exact quote), due, priority, `depends_on` graph, escalation policy, `audit_ref` (links to ledger), `delegated_by`, `autonomy_at_creation`.
- **Task state machine**: open→{in_progress,blocked,done,cancelled,missed}; blocked/missed re-openable; done/cancelled terminal. `change_status` enforces transitions; DONE blocked until all dependencies done.
- **Dependency graph**: `add_dependency`/`remove_dependency` with **cycle detection** (DFS) and same-unit constraint.
- **Escalation sweep** (`escalate_due`, idempotent): marks overdue open tasks MISSED, emits `task.escalated`; warns tasks approaching due (`task.escalation_warning`). Exposed at `POST /units/{id}/tasks/escalate`. EscalationPolicy enum exists but REASSIGN/notify are not actually actuated (recorded only).
- Every mutation → audit entry + domain event emitted (`task.created/in_progress/done/...`).
- **Meeting ingestion** (`services/ingest_service.py`): `POST /ingest/transcript` → creates Document → pluggable `Extractor` (`set_extractor`) with default deterministic `HeuristicExtractor` (regex `<Name> will/to <action> [by <when>]`) → creates Tasks with provenance → resolves owner names against unit persons, returns `unresolved_owners`. No LLM extractor ships.
- **Events bus** (`services/event_service.py`): append-only `events` collection, queryable. **Not consumed by any Flow engine** — captured but inert.

## 5. Dashboard (Prism slice / digital-twin start)

`services/dashboard_service.py` → `GET /units/{id}/dashboard`. Per unit: employees_total, by_status, by_tier, by_autonomy (deployed only), spent vs budget + utilization, **commitment rollup** (total/open/overdue/completion_rate/by_status), open_approvals count, **stale employees** (deployed, no heartbeat within `heartbeat_stale_seconds=900`), recent_activity (last 10 audit). Read-only aggregation; **not predictive**.

## 6. Persistence Abstraction

`services/store.py`: one async `Store` Protocol (insert/get/list/update/delete/count/ping/close) with two backends — **InMemoryStore** (dict-backed, default, normalizes `_id`→`id`, supports `$in` filters/sort/skip/limit) and **MongoStore** (motor, lazy-imported, used when `MONGO_DB_URL` set). Process-wide handle via `set_store/get_store/init_store`. Indexes created best-effort on Mongo startup (`main._ensure_indexes`). No migrations, no transactions, no soft-delete.

## 7. FastAPI Surface (complete route list)

Aggregated in `routes/api.py`; errors mapped centrally in `main.py` (NotFound→404, Conflict/Lifecycle/TaskLifecycle→409, Unauthorized→401, PolicyDenied→403).

**Health**: `GET /`, `GET /health`
**Units**: `POST /units` · `GET /units` · `GET /units/{id}` · `PATCH /units/{id}` · `POST /units/{id}/activate` · `GET /units/{id}/employees` · `GET /units/{id}/dashboard` · `GET /units/{id}/audit` · `GET /units/{id}/tasks` · `POST /units/{id}/tasks/escalate`
**Archetypes**: `POST /archetypes` · `GET /archetypes` · `GET /archetypes/{id}`
**Employees**: `POST /employees` (instantiate) · `GET /employees` · `GET /employees/{id}` · `POST /employees/{id}/configure` · `POST /employees/{id}/deploy` (200/202) · `POST /employees/{id}/suspend` · `/resume` · `/autonomy/promote` · `/autonomy/demote` · `POST /employees/{id}/decommission` (200/202) · `GET /employees/{id}/credential` · `POST /employees/{id}/credential/rotate` · `POST /employees/{id}/heartbeat` · `POST /employees/{id}/runs` · `GET /employees/{id}/runs`
**Runs**: `GET /runs` · `GET /runs/{id}`
**Approvals**: `GET /approvals` · `GET /approvals/{id}` · `POST /approvals/{id}/decide`
**Audit**: `GET /audit`
**Identity**: `POST /identity/verify`
**Registry/canonical**: `POST /tasks` · `GET /tasks` · `GET /tasks/{id}` · `PATCH /tasks/{id}` · `POST /tasks/{id}/start|block|complete|cancel` · `POST /tasks/{id}/reassign` · `POST|DELETE /tasks/{id}/dependencies/{dep}` · `POST /ingest/transcript` · `POST/GET /persons` (+`/{id}`) · `POST/GET /documents` (+`/{id}`) · `POST/GET /projects` (+`/{id}`) · `GET /events`

## 8. React Admin Console (`ui/`)

React 19 + Vite 7 + Tailwind 4 + react-router + axios + lucide-react. Sidebar nav, unit selector (`state/unit.tsx` context), typed API client (`api/client.ts`) with central `errMsg`. Pages: **DashboardPage**, **UnitsPage** (onboard/activate), **EmployeesPage** (instantiate/list), **EmployeeDetailPage** (full lifecycle: configure/deploy/suspend/resume/promote/demote/decommission/heartbeat/runs/credential), **TasksPage** (registry CRUD + start/complete/cancel/block), **ApprovalsPage** (decide queue), **IngestPage** (transcript). Typechecks + builds clean. No auth/login, no tests in UI, no Projects/Persons/Events/Documents pages.

## 9. Tests & CI

- **pytest, 35 tests** across 8 files: `test_lifecycle` (6), `test_governance` (6), `test_employees_api` (5), `test_dashboard` (2), `test_identity` (6), `test_registry_api` (7), `test_task_lifecycle` (3). Cover legal/illegal transitions, least-privilege, deploy gates, budget hard-stop, credential issue/rotate/revoke/verify, run attribution, provenance, dependency-blocks-completion, cycle rejection, escalation sweep, ingest, dashboard rollups, full lifecycle with/without approvals, archetype instantiation. `conftest.py` resets in-memory store per test.
- **CI** (`.github/workflows/ci.yaml`): Python 3.11 → `ruff check .` → `pytest`. No mypy, no coverage gate, no UI build/test in CI, no Docker build step (Dockerfile + docker-compose exist).

---

## Explicit GAPS vs a Full Platform

These are deliberately stubbed/deferred — the plan must **build on**, not rebuild, the above.

**Runtime / agents**
- **Only the `echo` adapter exists.** No real agent runtime behind the adapter contract (no OnyxOS agent loop, lms-onyx streaming controller, Claude/Codex/HTTP webhook). Plan→act→observe loop not built.
- **No LLM commitment extractor** — only the deterministic heuristic regex; `set_extractor` hook is unused.

**Flow / orchestration**
- **No Flow engine.** No durable/Temporal-style cross-unit orchestration. Domain Events are emitted to the `events` collection but **consumed by nothing** (no triggers, reminders, workflows). RTQ / lead-lifecycle workflows absent.

**Governance hardening**
- **Model Gateway is a pure pricing stub** — no LiteLLM proxy, no budget enforcement at gateway, no egress policy, no on-prem routing actuation.
- **Policy Engine** covers least-privilege + deploy gate only — **no policy catalog, no policy versioning, no policy memories, no per-action runtime authorization** beyond config/deploy.
- **No real evals (Ensure)** — autonomy promotion trusts caller's `eval_passed` flag; no eval gates, no drift detection, no auto-demotion, no ROI metrics. `autonomy_promote`/`budget_override` approval types are not auto-executable.
- **Budget**: spend accumulates lifetime; **no monthly window reset**, no warn thresholds, no per-scope (company/unit/employee/task) budgets, `max_actions_per_hour` not enforced.
- **Audit ledger**: append-only but **no hash-chaining/tamper-evidence**, no export/retention.

**Identity / auth**
- **No human auth/IdP.** Agent-principal credentials exist; there is no human login, RBAC, or session — UI and all write endpoints are unauthenticated. Not integrated with lms-onyx auth as a shared IdP.
- Scope claims are issued but **not enforced at runtime** on any action endpoint.

**Canonical model / consolidation**
- **No Customer or Asset entities** (called for in plan). Entity graph relations are id-references only — no graph traversal, no digital-twin model.
- **No OnyxOS consolidation** — Meridian keeps its own local `Unit` rather than reading the org/registry from `onyxos`; Pulse (knowledge/RAG) and Prism (decision/dashboards) are **not integrated** (dashboard is a local aggregation, not backed by onyx-pulse/ConvBI).

**Lifecycle completeness**
- **Decommission "reassign in-flight work" is intent-only** — recorded in audit; open Tasks of the retiring employee are not actually moved to the successor.
- **Escalation actions not actuated** — REASSIGN/notify policies are recorded/emitted but no notification or reassignment is performed.
- Tiers (T1–T4) and `per_task_autonomy` are stored but carry no behavior; **no super-agents (T4)** (intake→decompose→assign→monitor).

**Connectors / ingestion**
- **No connector framework** — no read-only typed connectors for email/meetings/CRM. Ingestion is a single manual transcript POST.

**Persistence / ops**
- No migrations, no transactions, no soft-delete/restore, no pagination cursors beyond skip/limit.
- No observability (metrics/tracing/structured logging), no rate limiting, CORS is `*`.

**UI**
- No auth/login; no pages for Projects, Persons, Documents, Events, Runs history view, or audit browser; no real-time updates; no UI tests in CI.

**Files the plan builds on (absolute paths):** `/Users/palivelasrihari/onyx_all/onyx-meridian/meridian/domain/lifecycle.py`, `domain/task_lifecycle.py`, `domain/enums.py`, `governance/policy.py`, `governance/identity.py`, `gateway/model_gateway.py`, `adapters/base.py`+`registry.py`+`echo.py`, `services/{employee,task,ingest,run,approval,audit,identity,dashboard}_service.py`, `services/store.py`, `routes/api.py`, `main.py`, and `ui/src/`.

---

# SOURCE DOSSIER: reuse-map

I have a complete picture. Here is the consolidation map.

---

# Onyx Platform — Reuse / Consolidation Map

Six sibling repos under `/Users/palivelasrihari/onyx_all/`. Five are the Onyx platform proper (Python/FastAPI, shared template); `paperclip` is a separate TypeScript monorepo whose orchestration patterns are reference material. Findings cross-checked against `/Users/palivelasrihari/onyx_all/UNDERSTANDING/*.md` and verified in code.

## Per-repo survey

### 1. lms-onyx — knowledge backbone (largest, most complete)
- **Path:** `/Users/palivelasrihari/onyx_all/lms-onyx`
- **Stack:** FastAPI 0.115 + Uvicorn (Python 3.11), MongoDB (Motor), Redis, Qdrant (hybrid BM25+dense, FastEmbed), Azure OpenAI + Gemini + LiteLLM proxy, Langfuse, Celery, Azure Blob, Azure Speech (STT/TTS). React/Vite frontend in `webApp/`. **Port 8005.**
- **Capabilities:** Agentic-RAG cited Q&A with iterative context-gathering + "deep think" (`controllers/streaming_controller.py`, 1678 lines); multi-modal ingestion (`tools/doc_process/`, `services/{audio,video}_transcription_service.py`, OCR); auto learning-cards/quizzes/leaderboards; JWT/OAuth auth + RBAC + multi-tenant (`http_middleware.py` `AuthContextAndRoleHeaderMiddleware`, `services/{auth,google_oauth,microsoft_oauth,user}_service.py`); knowledge-gap analytics.
- **Reuse/extend:** This is the platform's auth + RAG + transcription source of truth.
  - **Reuse:** `http_middleware.py` + `services/auth_service.py` + OAuth services as the **shared auth library** for ConvBI and onyx-pulse (which have none).
  - **Reuse:** transcription services as the basis for the missing **meeting→decisions/tasks** pipeline (today only raw transcription exists — no extraction).
  - **Reuse:** `streaming_controller.py` agentic-retrieval/streaming pattern as the canonical agent runtime.
  - **Harden:** CORS `allow_origins=["*"]` + `allow_credentials=True` (invalid combo).

### 2. onyx-pulse — data intelligence + dashboards (a.k.a. "Onyx-Prism")
- **Path:** `/Users/palivelasrihari/onyx_all/onyx-pulse`
- **Stack:** FastAPI + Uvicorn, PostgreSQL (psycopg2, sqlglot), Qdrant, Redis, SQLite (`graphs.db` for dashboards), Plotly, multi-LLM (OpenAI/Gemini/Mistral/LiteLLM). React/Vite frontend. **Port 8005 (collides with lms-onyx).**
- **Capabilities:** NL→SQL conversational analytics (`agents/sql_generation.py`), Plotly chart generation (`tools/plotfactory/`), persisted dashboards (`routers/graph.py` + `services/graph_crud`), financial-PDF ingestion (`agents/income_statement_ingestor`), chat→report.
- **Reuse/extend:**
  - **Consolidate:** its NL→SQL (`sql_generation.py`) duplicates ConvBI — replace with ConvBI as a library.
  - **Reuse:** `tools/plotfactory/` + dashboard CRUD + report generation are the genuinely unique surface (ConvBI lacks persistence/charts) — keep these.
  - **Harden (critical):** `db_configs.json` profile `"2"` has a live Aiven Postgres credential in plaintext — **confirmed present** (`pg-94a668a-gytworkz-dd98.c.aivencloud.com` / `avnadmin` / `AVNS_***REDACTED***`, line 31-34). In git history → rotate + move to secrets.
  - **Harden:** repo hygiene — checked-in `dump.rdb`, `graphs.db`, `res.txt`, `require,txt` (typo); no auth; CORS `*`+credentials; profile `"1"` mislabels a Chinook (music) DB with financial context.

### 3. ConvBI — NL→SQL engine (cleanest)
- **Path:** `/Users/palivelasrihari/onyx_all/ConvBI`
- **Stack:** FastAPI 0.116, LangGraph 0.6 + LangChain 0.3 (state machine), Azure OpenAI + `text-embedding-3-large`, Qdrant (hybrid BM42), Redis (24h sessions), PostgreSQL (psycopg3, raw). Optional Cohere rerank, Langfuse. **Port 8000 (collides with onyxos).**
- **Capabilities:** NL→SQL with intent classification, schema semantic-search table selection, self-healing SQL (debugger agent, 3 retries), summarize+visualize+follow-ups, all SSE-streamed. Agents in `convBI/agents/` (intent, text_to_sql, execute_sql, clarification, summarizer, visualization, followups). Best-documented (~680-line README).
- **Reuse/extend:** **The canonical NL→SQL engine.** Promote to the shared library both onyx-pulse and Prism call. It already recommends read-only DB users.
  - **Harden:** add authn/authz (none today); enforce read-only DB user + query validation (LLM-generated SQL hits DB directly; `sqlglot`/validation is mitigation, not a sandbox).

### 4. onyxos — org registry / onboarding (cleanest, smallest)
- **Path:** `/Users/palivelasrihari/onyx_all/onyxos`
- **Stack:** FastAPI 0.114 + Uvicorn 0.30, MongoDB (Motor 3.6 async), Azure OpenAI (JSON-mode), pydantic-settings. Clean `routes→controllers→services→data` layering. **Port 8000 (collides with ConvBI).**
- **Capabilities:** LLM-driven onboarding (`services/onboarding_service.py`: free-text company desc → structured `OnboardingResult` — industry, size, region, goals, business model, digital maturity) + organization CRUD + accepted-services tracking. Startup pings Mongo, ensures indexes.
- **Reuse/extend:** **Promote to the canonical org/identity service.** Today lms-onyx and onyx-pulse each carry their own org/department models — no single source of truth. Extend onyxos's schema (`schemas/organization.py`) and have the others consume it.
  - **Harden:** generic "FastAPI Scaffold" README (rename/document); CORS `*`+credentials; `website_url` accepted but never crawled (extension opportunity).

### 5. onyx_vault — governance stub (empty)
- **Path:** `/Users/palivelasrihari/onyx_all/onyx_vault`
- **Status:** **Confirmed empty** — only a 13-byte `README.md`, single git commit. No code/deps/Dockerfile.
- **Intended:** Vault = security & governance / Policy Engine (permissions, audit trail, compliance) — the "governed & traceable" promise.
- **Action: NEW build.** Seed it by extracting lms-onyx's auth/RBAC into a shared policy layer and centralizing the scattered Langfuse audit traces into an audit ledger. Biggest greenfield gap.

### 6. paperclip — agent-team orchestration patterns (separate TS monorepo)
- **Path:** `/Users/palivelasrihari/onyx_all/paperclip`
- **Stack:** Node.js + React/TypeScript pnpm monorepo (Drizzle ORM, Vitest, Storybook). Packages: `server`, `ui`, `cli`, `db`, `shared`, `adapters/` (claude/codex/cursor/gemini/grok/opencode/openclaw etc.), `teams-catalog`, `skills-catalog`, `plugins`, `mcp-server`.
- **Capabilities:** Control plane to hire/assign/budget/govern teams of AI agents ("bring your own agent"); org charts, budgets, goal alignment, governance, scheduled routines, import/export of whole companies (`companies.sh`), thin-core + plugin/adapter architecture.
- **Reuse (patterns, not code — different language/runtime from the Python platform):**
  - **Adapter registry** (`server/src/adapters/registry.ts`, `registerServerAdapter`/`requireServerAdapter`) — the model for the missing **managed Agent Layer** (instantiate/configure/deploy/retire agents) the Fakhruddin brief wants; today Onyx agents are hardcoded pipelines.
  - **teams-catalog / skills-catalog** — pattern for declarative, reusable agent/skill definitions.
  - **Budgets + governance + scheduled routines + audit** — directly informs the `onyx_vault` Policy-Engine and "Ensure" buildout.
  - Treat as **architecture reference**; do not import directly into the FastAPI services.

## Known issues from UNDERSTANDING/*.md (verified)
1. **Leaked live Aiven Postgres credential** in `onyx-pulse/db_configs.json` (in git history) — VERIFIED present. Rotate + purge. Highest priority.
2. **Port collisions** — VERIFIED: ConvBI(8000)/onyxos(8000); lms-onyx(8005)/onyx-pulse(8005). Can't co-host without remapping.
3. **Duplicated NL→SQL** between ConvBI and onyx-pulse — VERIFIED (`onyx-pulse/agents/sql_generation.py` vs `ConvBI/convBI/agents/text_to_sql.py`).
4. **No auth on data services** (ConvBI, onyx-pulse); only lms-onyx has JWT/OAuth.
5. **CORS `allow_origins=["*"]` + `allow_credentials=True`** in onyxos, onyx-pulse, lms-onyx (unsafe combo).
6. **No shared org/identity** source of truth; **no Action/Task Registry** and **no managed Agent Layer** (the actual pilot deliverables); **Flow/Ensure** accelerators have no repo.
7. **Repo hygiene** — onyx-pulse checked-in artifacts (`dump.rdb`, `graphs.db`, `res.txt`, `require,txt`); one-line READMEs; Pulse-vs-Prism naming drift.

## Consolidation table — capability → source repo → action

| Capability | Source repo (path) | Action |
|---|---|---|
| NL→SQL engine | ConvBI (`convBI/agents/text_to_sql.py`, LangGraph) | **Consolidate** — make canonical shared lib; delete onyx-pulse's `agents/sql_generation.py` and call ConvBI |
| Charts + dashboards + report gen | onyx-pulse (`tools/plotfactory/`, `routers/graph.py`, `graph_crud`) | **Reuse** — unique layer on top of ConvBI; keep |
| Agentic RAG / cited Q&A / streaming runtime | lms-onyx (`controllers/streaming_controller.py`) | **Reuse** as canonical agent runtime |
| Transcription (audio/video) | lms-onyx (`services/{audio,video}_transcription_service.py`) | **Reuse + extend** into meeting→decisions/tasks extraction |
| Auth: JWT/OAuth/RBAC/middleware | lms-onyx (`http_middleware.py`, `services/auth_service.py`, OAuth services) | **Reuse** as shared auth lib for ConvBI + onyx-pulse; **harden** CORS |
| Org registry / onboarding / identity | onyxos (`services/onboarding_service.py`, `schemas/organization.py`, Mongo) | **Consolidate** — promote to single source of truth; others consume |
| Security / governance / policy / audit | onyx_vault (empty) | **NEW** — seed from lms-onyx RBAC + centralized Langfuse audit |
| Agent-team orchestration / managed Agent Layer / budgets / governance / catalogs | paperclip (`server/src/adapters/registry.ts`, `teams-catalog`, `skills-catalog`) | **Reuse as pattern** (TS, reference only) to build Onyx's managed Agent Layer + Vault governance |
| Action/Task Registry (who owes what, by when) | — (nowhere) | **NEW** — pilot's accountability core; build, fed by lms-onyx transcription |
| Vector search (Qdrant hybrid) | shared across ConvBI/lms-onyx/onyx-pulse | **Consolidate** into one wrapper lib (currently re-implemented per repo) |
| Multi-LLM access (LiteLLM/Azure/Gemini/Mistral) | shared `llms/` across repos | **Consolidate** into one provider-client lib |
| Leaked Aiven credential | onyx-pulse (`db_configs.json`) | **Harden now** — rotate, purge from history, move to secrets |
| Port assignments | all four FastAPI services | **Harden** — assign distinct ports (env-driven) to co-host |

**Suggested target shape:** shared libs for `auth` (from lms-onyx), `org/identity` (onyxos), `nl2sql` (ConvBI), `llm-clients` + `qdrant` (extracted); product services `lms-onyx` (knowledge), `onyx-pulse` (data/dashboards on top of ConvBI); new `onyx_vault` (policy/audit) and a new Agent Layer + Task Registry modeled on paperclip's adapter/catalog patterns.
