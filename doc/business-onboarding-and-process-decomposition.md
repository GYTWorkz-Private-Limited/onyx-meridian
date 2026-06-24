# Business Onboarding & Process Decomposition — the discovery agent

This is the design for the **deep agent** that onboards a business. Given a
department, the **documentation it is handed**, and the **connections that are
wired up**, the agent explores both and proposes a complete operating model:
the business units, the units of work (tasks), the workflows with their human
gates, the connectors each task needs, and the cost + effectiveness model for
each. A human reviews the proposal; on approval it is materialized into Meridian
and AI employees are provisioned against it.

Product context: [enterprise AI feature model](enterprise-ai-features.md).
It reuses two pipelines already in the repo — the `deep-research` harness and the
connector [extraction → builder](../meridian/connectors/agents/README.md) agents
— and applies the **same spec-first, cite-everything, `UNVERIFIED`-by-default**
discipline so a human can trust the proposal before committing to it.

---

## 1. Design principles (what makes it work in the real world)

Real businesses hand you messy, partial, contradictory inputs. The agent is
built around that, not against it:

1. **Spec-first, never auto-apply.** The agent emits a reviewable **Process
   Spec** (YAML, below). Nothing is created in Meridian until a human approves
   it. This mirrors the connector pipeline, where the `_props.*.yaml` is
   reviewable before any code is generated.
2. **Grounded & cited.** Every derived task, workflow step, and cost figure
   carries provenance — the doc quote, the meeting line, or the connector schema
   it came from (the `Source{type, doc_id, quote}` the build already models).
3. **`UNVERIFIED` by default.** Any claim not confirmed against a document **or**
   a live connection is flagged `UNVERIFIED` and cannot be promoted to an
   autonomous step. Same gate the connector extraction agent uses.
4. **Human gates are structural, not cosmetic.** Decomposition *proposes* where
   gates go; a reviewer confirms them. The agent defaults to *more* gates and
   lets humans remove them, never the reverse.
5. **Idempotent & incremental.** Re-running on the same inputs yields the same
   spec; re-running on changed inputs yields a **diff**, not a duplicate. A
   business can be onboarded one department at a time.
6. **Least privilege from the start.** Every connector binding is scoped to the
   unit's `allowed_scopes`; the agent never proposes a scope the unit hasn't
   granted.
7. **Confidence over completeness.** The agent reports what it could *not*
   determine (a completeness critique) instead of papering over gaps — those gaps
   become intake questions or expert tasks.

---

## 2. Inputs

| Input | Example | Notes |
|-------|---------|-------|
| `department` | "Finance & Invoicing Services" | becomes one or more `Unit`s |
| `documents` | SOPs, org charts, policies, recorded meetings, emails, PDFs | ingested as `Document`s with provenance |
| `connections` | configured `salesforce.crm`, `netsuite.erp`, … | live, queryable during discovery |
| `interview` (optional) | answers to the agent's intake questions | fills gaps the docs don't cover |
| `prior_spec` (optional) | the last approved Process Spec | enables incremental re-derivation (diff mode) |

---

## 3. The pipeline

The agent is a multi-phase deep agent. Each phase emits a typed artifact and
most phases fan out (parallel readers / parallel synthesizers) the way the
`deep-research` harness does. A barrier exists only where a later phase genuinely
needs the whole prior result (e.g. dedup before workflow synthesis).

```
0 Intake ──▶ 1 Domain discovery ──▶ 2 Process decomposition ──▶ 3 Workflow synthesis
                  │                          │                          │
          (Knowledge Sphere           (unit-of-work catalog)     (gates + DAG)
           + Domain Graph seed)               │                          │
                                              ▼                          ▼
                              4 Connector binding ◀────────── 5 Cost & effectiveness model
                                              │
                                              ▼
                              6 Process Spec emitted ──▶ HUMAN REVIEW GATE ──▶ 7 Materialize
                                                                                     │
                                                                                     ▼
                                                                      8 Continuous re-derivation
```

### Phase 0 — Intake & inventory

- Catalogue the documents; ingest each as a `Document` with its kind
  (`meeting`/`email`/`pdf`/`chat`/`note`) and keep provenance.
- Inventory the live connections and probe each (`/connections/{id}/test`) so the
  agent knows what data it can actually read during discovery.
- Produce an **intake question set** for everything the inputs leave ambiguous.
  Unanswered questions are carried forward as `UNVERIFIED` assumptions, never
  silently resolved.

### Phase 1 — Domain discovery (seed the Knowledge Sphere + Domain Graph)

- From the documents *and* a sampling pull from each connection, derive the
  department's **entities** and the **sanctioned edges** between them
  (customer → order → invoice). This is the seed of the per-department **Domain
  Graph** and the first fill of the **Knowledge Sphere**.
- Reconcile names across sources (the doc's "client" = the CRM's "Account").
- Output: a domain model with entities, edges, and the source backing each.

### Phase 2 — Process decomposition (the unit-of-work catalog)

This is the core. The agent mines the documents and the data for **what work is
done**, decomposed to the **unit-of-work** grain (§3 of the feature doc):

- Lift candidate units of work from SOPs, recurring email/meeting patterns, and
  observed state transitions in the connected systems.
- For each candidate, draft: a title + description, the entities it touches, the
  trigger (event / schedule / message), and an **execution-mode guess**
  (`deterministic` / `workflow_policy` / `ai_agent`).
- Dedup across sources (barrier here — needs the full set before merging).
- Map each to one or more **business units** under the department.

Output: the **unit-of-work catalog**, each item cited and confidence-scored.

### Phase 3 — Workflow synthesis (order + gates)

- Order the units of work into DAGs using observed sequencing and `depends_on`
  relations.
- Insert **human gates** wherever there is a commitment, an irreversible push, a
  spend, or a low-confidence step. Default to proposing a gate; let the reviewer
  remove it.
- Mark the **reversibility** of each step (can it flip to human-responsible?).

Output: candidate **workflows** = ordered units of work + gates + reversibility.

### Phase 4 — Connector binding

For every unit of work, bind the connectors it needs from the **connector
repository**:

- If a needed `<platform>.<domain>` connector exists → bind it, scoped to the
  unit's `allowed_scopes`.
- If it is `research_derived` → bind but flag `UNVERIFIED`.
- If it is **missing** → emit a request to the connector **extraction agent**
  (`(platform, domain)`), which deep-researches and produces the spec, then the
  **builder agent** scaffolds the code. The process spec records the dependency
  so the workflow can't go autonomous until the connector reaches `complete`.

This is the integration backbone of every task, drawn from a single repository.

### Phase 5 — Cost & effectiveness model

For each unit of work, estimate the three cost terms (AI-to-decide, AI-to-do,
integration) using the model-gateway pricing table and the connector's expected
pull/push volume, and attach a **custom effectiveness metric** (default:
time-to-execute vs. the stated human baseline; otherwise override rate / SLA /
turnaround). These figures drive the cost-control center later.

### Phase 6 — Process Spec emission + human review gate

The agent emits one reviewable **Process Spec** (§4) and stops. A reviewer reads
it — entities, units of work, workflows, gates, connector bindings, costs, and
the **completeness critique** (what the agent could not determine) — and edits or
approves. Nothing is materialized before approval.

### Phase 7 — Materialization

On approval, the spec is applied idempotently into Meridian:

- create/activate the `Unit`(s) with `allowed_scopes`;
- create `Archetype`s for the discovered **roles**;
- register the **workflows** and their gates;
- create the connector `Connection`s (or hold the workflow pending a missing
  connector reaching `complete`);
- optionally **provision AI employees** from the archetypes, bind their
  workflows, and let them propose schedules (which route through the acceptance
  gate in the feature doc, §9).

### Phase 8 — Continuous re-derivation (agentic maintenance)

The agent re-runs on a **drift trigger** — new documents, a changed connector
spec, or a cadence — and produces a **diff** against the last approved spec.
Workflow changes route through the same human gate; connector changes route to
the connector research agents. This is what keeps the operating model live
rather than a one-time onboarding snapshot.

---

## 4. The Process Spec (the reviewable artifact)

One file per department, emitted by Phase 6, applied by Phase 7. Sketch:

```yaml
department: "Finance & Invoicing Services"
status: proposed            # proposed → approved → materialized
generated_from:
  documents: [doc_ids...]
  connections: [conn_ids...]
  prior_spec: null          # set in diff mode

units:
  - name: "Accounts Receivable"
    allowed_scopes: ["invoice:read", "invoice:write", "customer:read"]

domain_graph:
  entities: [Customer, Invoice, Payment]
  edges:
    - {from: Customer, to: Invoice, relation: owns, source: {doc_id: d12, quote: "..."}}

roles:                       # become Archetypes
  - key: "fis.ar_clerk"
    display_name: "AR Clerk"
    responsibilities: ["chase overdue invoices", "reconcile payments"]
    kpis: ["days-sales-outstanding", "collection rate"]
    tier: T1_execution

units_of_work:               # become Tasks / commitments
  - id: uow-001
    title: "Send overdue-invoice reminder"
    unit: "Accounts Receivable"
    execution_mode: workflow_policy
    trigger: {type: schedule, cadence: "daily"}
    entities: [Invoice, Customer]
    connectors: ["netsuite.erp", "<comms>"]
    communications: {channel: email, audience: customer}
    cost: {ai_decide_usd: 0.002, ai_do_usd: 0.001, integration_usd: 0.0005}
    effectiveness: {metric: time_to_execute, human_baseline_min: 6}
    confidence: 0.82
    source: {type: pdf, doc_id: d12, quote: "AR sends a reminder at day 30..."}

workflows:                   # become Flows
  - id: wf-collections
    title: "Overdue collections"
    steps: [uow-001, uow-002, uow-003]
    gates:
      - {after: uow-002, type: proposal, reason: "before escalating to legal", reversible: true}
    depends_on: {uow-002: [uow-001], uow-003: [uow-002]}

connector_requests:          # drive the extraction/builder agents
  - {platform: comms, domain: email, status: missing}

completeness_critique:
  - "Could not confirm the day-60 escalation owner — INTAKE QUESTION raised."
  - "netsuite.erp invoice cursor mechanics UNVERIFIED (research_derived)."
```

Every `units_of_work`, `workflows`, and `domain_graph` entry carries a `source`
(provenance) and a `confidence`; anything unconfirmed is `UNVERIFIED` and blocked
from autonomous execution until a human or a verified connector confirms it.

---

## 5. Why this is trustworthy in production

- **Nothing fires unreviewed.** Discovery → spec → human gate → materialize. The
  agent's output is a *proposal*, never a live change.
- **Provenance on every claim.** A reviewer can click any task back to the exact
  document line or connector schema it came from.
- **Failure is visible.** The completeness critique surfaces what the agent
  doesn't know as intake questions and expert tasks, instead of guessing.
- **It reuses proven pipelines.** Deep research for discovery; the
  extraction/builder agents for any missing connector; the shipped lifecycle,
  approvals, and audit ledger for everything it materializes.
- **It stays alive.** Phase 8 re-derivation + the connector drift trigger keep
  the operating model matching the real business over time.

---

## 6. Reuse map

| This agent needs | Already in repo |
|------------------|-----------------|
| Fan-out research + cite + verify | `deep-research` skill |
| Build a missing connector | `extraction-agent` → `builder-agent` |
| Provenance on derived facts | `Source{type, doc_id, quote}` on `Task` |
| Department + scopes | `Unit` (`allowed_scopes`, approval flags) |
| Roles | `Archetype` |
| Units of work | `Task` / commitment registry + `ExecutionMode` |
| Human gates | `Approval` + (proposed) per-step proposal gates |
| Cost figures | model-gateway token→USD meter |
| Materialization safety | lifecycle state machine + audit ledger |
