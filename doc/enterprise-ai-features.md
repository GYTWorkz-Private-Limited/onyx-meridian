# Enterprise AI — the feature model

This document is the product-level view of what Onyx Meridian becomes once the
connector spine, the AI-employee lifecycle, and the org/digital-twin model are
joined into one platform. It is written against what is **already shipped**
(Units, Archetypes, AI Employees, the autonomy ladder, the model-gateway cost
meter, Tasks/commitments, Approvals, the audit ledger, the connector
repository) and what is **proposed** to close the loop the founder described.

Companion design: [business onboarding & process decomposition](business-onboarding-and-process-decomposition.md)
— the *agent* that discovers all of this from a real business.

---

## 1. The one sentence

> **Communicate, then do the work. Communicate, then do the work.**

Everything below is scaffolding around that loop: who is allowed to do the work
(roles, scopes), what "the work" is (units of work → workflows), what the work
touches (connections), what it costs, whether a human must sign off (gates), and
who keeps doing it on a schedule (the AI employee).

```
ask ─▶ understand ─▶ pick the workflow ─▶ run the task(s) ─▶ pull/push via connectors
  ▲                          │                  │                       │
  └────── communicate back ◀─┴── human gate ◀───┴── meter cost ◀────────┘
```

---

## 2. The hierarchy (what nests in what)

```
Business
└─ Department / Business Unit            ← shipped: Unit (onboarding→active→paused→archived)
   ├─ Roles                              ← shipped: Archetype (reusable job template)
   │   └─ Responsibilities + KPIs        ← shipped: Role{responsibilities, kpis, charter}
   ├─ Units of work (Tasks)              ← shipped: Task / commitment registry
   │   ├─ required Connections           ← shipped: connector repo + Connection
   │   └─ required Communications        ← proposed: comms binding (channel + audience)
   ├─ Workflows  (tasks + gates)         ← proposed: Flow (durable composition + HITL gates)
   ├─ Knowledge Sphere + Domain Graph    ← proposed: per-department, fed by connectors
   └─ AI Employees                       ← shipped: Employee lifecycle, deployed into the unit
```

Each layer is already a first-class object in the build except **Workflow**, the
**comms binding**, and the **Knowledge Sphere** — those are the proposed pieces
that turn a registry of tasks into an operating department.

### 2.1 Department onboarding derives the rest

Onboarding a business is not a form. It is a **discovery run** (file 2) that,
from provided documentation plus the connections that are wired up, derives:

1. the **business units** under the department;
2. for each unit, the **units of work** (the tasks) and which of them chain into
   **workflows**;
3. the **gates** each workflow needs;
4. the **connectors** each task requires, drawn from the connector repository;
5. the **cost** and **effectiveness** model for each task.

The output is reviewable before anything is materialized — same spec-first
discipline the connector [extraction agent](../meridian/connectors/agents/extraction-agent/README.md)
already uses (every fact cited; anything unconfirmed marked `UNVERIFIED`).

---

## 3. The unit of work

A **unit of work** is the atom the platform schedules, prices, and measures. It
maps to the shipped `Task` (a *commitment* with an owner, a source, a due date,
dependencies, and an escalation policy). To make it executable a unit of work
also carries:

| Facet | Meaning | Where today |
|-------|---------|-------------|
| **Execution mode** | `deterministic` \| `workflow_policy` \| `ai_agent` — the cost lever | `domain/enums.py:ExecutionMode` |
| **Required connectors** | which `<platform>.<domain>` connectors it pulls/pushes | connector repo + `Connection` |
| **Required communications** | which channels/audiences it must talk to | *proposed* |
| **Gate(s)** | human checkpoints before it commits | shipped `Approval`; *workflow-level proposed* |
| **Cost estimate** | AI cost to *decide* + AI cost to *do* + integration cost to *move data* | partial: gateway meters model spend |
| **Effectiveness metric** | usually time-to-execute vs. the human baseline | *proposed* |

The key product idea: a unit of work is billable as a **set-up process**, not as
clicks. You define it once, gate it, and bill the outcome — "rather than waiting
for things to be clicked through, the process is set up and billed out."

---

## 4. Connections & communications

Two different verbs, both first-class:

- **Connections** move *data*. They are the shipped connector repository: a
  standardized pull/push contract per `<platform>.<domain>`, configured into a
  live `Connection`, with the completeness lifecycle
  `incomplete → research_derived → complete`. Every task names the connectors it
  needs, drawn from this repository; if a needed connector is missing, the
  research-mode agents build it (see [CONNECTORS.md](CONNECTORS.md)).
- **Communications** move *intent and answers*. A task often **starts** with a
  question — "what should be done?" — and **ends** with a message back. This is
  the horizontal layer of a vertical AI: it holds the department's context and
  can answer from it. *(Proposed: a comms binding on the unit of work — channel,
  audience, and the message contract.)*

Pricing reflects both: integration cost (pull/push volume) is metered alongside
model cost, because connectors are a real and recurring expense.

---

## 5. The Knowledge Sphere & Domain Graph (per department)

Hiding the interesting data is a waste. Each department maintains, as a
first-class asset:

- a **Knowledge Sphere** — continuously fed by its connections; every pull adds
  to it, so it is always current; and
- a **Domain Graph** — the entities and the sanctioned edges between them
  (customer → order → invoice, project → task → deliverable).

Any workflow, task, or automation running *now* can **consume** the Knowledge
Sphere to do its work, and agents may only traverse **sanctioned edges** in the
domain graph (the graph polices automation — an L3 requirement). The sphere is
*maintained*, not snapshotted: a feed, a freshness signal (`alive`/`stale`,
which the build already models as `Liveness`), and a "knowledge-miss → create a
task for a domain expert" closed loop when the sphere can't answer.

---

## 6. Workflows — tasks composed with gates

A **workflow** is the end goal of onboarding: take the discovered units of work,
order them, and insert **human gates** where commitment or judgement is needed.

- Composition: a DAG of units of work with `depends_on` (already on `Task`).
- Gates: HITL checkpoints. The shipped `Approval` covers lifecycle gates
  (deploy, decommission, autonomy-promote, budget-override); workflows add
  **per-step proposal gates** ("AI proposes, a human commits") and a
  **reversibility dial** — any AI step can flip to human-responsible, and a whole
  unit can revert.
- Durability: a workflow must be **replayable and idempotent** so a re-run never
  double-commits a push. *(Proposed: a durable Flow engine; today's dispatcher is
  advisory/in-process.)*

Gates are not optional. Even when an employee *could* do everything at once, the
gates keep the system honest and reversible.

---

## 7. Cost & effectiveness

Three cost terms per unit of work, metered and rolled up:

1. **AI cost to decide** — model tokens spent choosing/planning (the
   model-gateway already converts tokens → USD per the on-prem-first routing
   table).
2. **AI cost to do** — model/compute spent executing.
3. **Integration cost** — connector pull/push volume.

**Effectiveness** is task-specific and pluggable. For most tasks it is
*time-to-execute vs. the human baseline*; for others it is override rate, rework,
SLA adherence, or turnaround. Each AI employee therefore carries a **custom
effectiveness calculator** alongside its cost rollup, so "is this employee worth
it?" is answerable per role, not just globally.

This feeds the reconfiguration conversation in §9: *"This employee ran workflow X
N times this month and cost $Y — reduce its frequency?"*

---

## 8. The AI Employee — consuming workflows

Once workflows exist, you create an **AI employee** by giving it a **role and
responsibility** (shipped: `Role{responsibilities, kpis, charter}`, a `Tier`, a
`Budget`, a `ModelPolicy`, `Supervision`). The employee then:

1. **Binds the workflows** it is responsible for (which workflows, at which
   autonomy level — the shipped `per_task_autonomy` ladder
   `shadow→assist→supervised→autonomous`).
2. **Proposes a schedule** for each — it figures out *when* and *how often* each
   workflow should run. All of it is configurable; the employee can recommend the
   cadence and a human accepts or pre-approves it.
3. **Runs a heartbeat loop** — the "is there anything I should do right now?"
   tick. On each tick it reads its taskboard, weighs deadlines against capacity,
   and either acts or **waits**.

### 8.1 The taskboard

A (possibly shared) **taskboard** is how work reaches the employee. The employee
needs a way to **fetch tasks from the board** and to **maintain it** — updating
status as it works, and reacting to direct messages addressed to it. Incoming
comms and scheduled triggers both land as items on the board.

### 8.2 Realism: WIP limits, waiting, and the triage triad

A real worker does not do everything at once just because the deadline is the
20th and there's spare capacity. To stay realistic, each employee has:

- a **max parallel tasks** configuration (its WIP limit) — it cannot start an
  unbounded number of things;
- the **capability to wait** — some tasks are in progress and block others; the
  employee holds rather than forcing parallelism;
- a **prioritization triad** — urgency (deadline), importance (KPI weight), and
  readiness (dependencies clear / capacity free) decide what runs next.

---

## 9. Lifecycle, configuration, and the cost-control center

The employee's working set is not static. The platform continuously:

1. **identifies the workflows + cadence** an employee should run, and
2. routes new ones through an **acceptance gate** before they execute — or lets
   you **pre-configure** them to auto-schedule.

Once an employee has been running, the **cost-control center** closes the loop:

- shows, per employee, *which workflows it runs, how often, the effort each
  consumes, and the cost incurred* — so you actually see what it is doing;
- lets you **adjust effort and cadence** ("run this less frequently"), the
  primary cost dial;
- and, if an employee isn't needed to run the enterprise, lets you
  **decommission** it.

Decommission is a **cascade**, not a delete: revoke its credential (shipped),
reassign in-flight work (shipped `reassign_to`), and **retire every schedule the
employee created** so nothing keeps firing after it's gone. *(The schedule
cascade is the proposed addition to the shipped decommission path.)*

---

## 10. Agentic maintenance

Two things must update themselves rather than rot:

- **Connection definitions** — when a platform's API changes, the connector
  repository's research-mode agents (extraction → builder) re-derive the spec and
  re-verify endpoints. *(Shipped as a runbook pipeline; proposed to run on a
  drift trigger.)*
- **Workflow definitions** — as the business changes, the discovery agent (file
  2) re-runs and proposes diffs to the workflow set. Updates land through the
  same acceptance gate as everything else, then auto-schedule.

This is what keeps the operating model live: the connections keep filling the
Knowledge Sphere, the discovery agent keeps the workflows honest, and the
cost-control center keeps the spend deliberate.

---

## 11. Mapping to the build (at a glance)

| Feature in this doc | Shipped today | Proposed |
|---------------------|---------------|----------|
| Department / business unit | `Unit` lifecycle, scopes, budget | unit auto-derivation |
| Role | `Archetype` + `Role` | — |
| Unit of work | `Task` / commitment registry | comms binding, cost facets |
| Connections | connector repo + `Connection` + research agents | drift-triggered re-derivation |
| Knowledge Sphere / Domain Graph | `Liveness` freshness signal | the sphere + graph themselves |
| Workflow + gates | `Approval` (lifecycle gates), `depends_on` | durable Flow, per-step proposal gates, reversibility dial |
| Cost | model-gateway token→USD meter, `Budget` | integration-cost meter, 3-term rollup |
| Effectiveness | KPIs on the role | per-employee custom calculator |
| AI employee | full lifecycle, autonomy ladder, supervision | schedule proposal, heartbeat loop, taskboard, WIP limits |
| Cost-control center | per-employee `spent_usd`, budget auto-suspend | effort/cadence dials, schedule cascade on decommission |
| Agentic maintenance | connector research runbook | drift triggers, workflow re-derivation |
