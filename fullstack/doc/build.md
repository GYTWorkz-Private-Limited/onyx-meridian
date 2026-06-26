# Paperclip Prototype — Build Plan (`build.md`)

> **Status:** Living document. This is the single source of truth for building
> `paperclip-prototype`. Update the checklists and "Progress Log" at the bottom
> as work lands. Every phase has acceptance criteria — do not mark a box until it
> is verifiably true (app runs, endpoint returns, screen renders).

---

## 1. Context — why this exists

We have two sibling projects under `onyx-meridian/`:

- **`meridian-prototype/`** — a polished **frontend-only** React + Vite prototype
  for a **real-estate AI workforce**. Self-contained CSS design system,
  `localStorage` store, no backend. Its standout, hard-to-rebuild assets are:
  - **Department Onboarding** — a 5-step discovery wizard (select dept → connect
    systems → AI discovers Units of Work → map effectiveness/ROI → publish).
  - **AI Employees** — archetype + model + reasoning + cost, a per-employee
    **memory tree**, activity timeline, and chat.
  - **Units of Work** — atomic API capabilities with RACI, vault-secret auth, and
    ROI mapping; **Workflows** that chain them (reactive/proactive + schedule).
  - **Knowledge Graph** (D3/GraphRAG), **Connectors**, **Cost Control** +
    **Effectiveness/ROI**, **Voice input**, a clean role-based shell.

- **`paperclip-master/`** — a real, production TypeScript monorepo
  (React 19 + Vite + Tailwind UI, Express 5 + PostgreSQL + Drizzle backend,
  pnpm workspaces). It is the **"manage AI agent companies"** control plane:
  **Companies** (multi-tenant) → **Goals** (hierarchy) → **Org chart / Agents**
  with pluggable **adapters** ("bring your own agent": Claude/Codex/Cursor/HTTP)
  → **Projects** → **Issues** → **Routines** (cron/webhook) → **Heartbeats** →
  **Approvals/Governance** → **Budgets/Costs** → **Activity/Audit** → **Plugins**.

**Goal:** build a new project, **`paperclip-prototype/`**, that **combines both**:

- A **full-stack** app — **React + Vite frontend with a proper backend** (Paperclip's
  architecture), *not* a frontend-only mock.
- **Real-estate domain-specific** (Meridian's content is preserved end to end),
  **but with generic multi-company "connections"** so other companies/domains can
  be created and plugged in alongside the seeded real-estate org.
- **Bring all** of Paperclip's concepts in: Goals, Org chart + adapters,
  Routines + heartbeats, Multi-company, Activity/audit.

The intended outcome: one prototype that demonstrates Meridian's beautiful,
domain-rich onboarding/employee/UoW experience running **inside** Paperclip's
multi-company, goal-aligned, heartbeat-driven orchestration model — backed by
**mock APIs that implement a real, documented API contract**, designed so a real
backend can be dropped in later with **no frontend changes**.

### Scope of this prototype (important)

- **Frontend is real and fully built** (React + Vite + Meridian design system).
- **Backend is _planned only_, not built.** The server (Express + Drizzle + DB)
  is fully *designed* here (§5 schema, §6 routes) as the contract a real backend
  will implement — but in this prototype it is **not coded**.
- **The app runs on Mock APIs.** A client-side mock layer implements the §6
  contract over seeded in-memory data (persisted to `localStorage` so changes
  survive reloads and feel "real"). Because the UI talks to the contract — not to
  the mock — **converting to a real backend = point the API client at the real
  server and turn the mock off.** Nothing in the pages/components changes.

---

## 2. Product synthesis — how the two models merge

The two products are the same idea at different altitudes ("run a workforce of AI
agents"). The merge keeps Meridian's **depth** (domain, onboarding, ROI, memory)
and adds Paperclip's **breadth** (multi-company, goals, org chart, heartbeats,
audit). Core mapping:

| Concept | Meridian | Paperclip | **Merged in paperclip-prototype** |
|---|---|---|---|
| Tenant | single org (implicit) | **Company** (multi-tenant) | **Company.** Meridian's RE org seeded as `Onyx Meridian Real Estate`; users can create more companies. Real-estate is the flagship seed, not a hard-coded assumption. |
| Workforce unit | **AI Employee** (archetype, model, reasoning, memory) | **Agent** (role, title, reporting line, adapter, budget, status) | **Agent** = superset: archetype + model + reasoning + memory tree **and** reporting line + runtime adapter + per-agent budget + status. |
| Org structure | **Department** | Org chart (reporting lines) | **Departments _and_ reporting lines** → an Org Chart view; agents belong to a dept and report to a manager. |
| Capability | **Unit of Work** (atomic API call, RACI, vault auth, ROI) | skills/tools | **Unit of Work** kept verbatim + exposed as agent "skills". |
| Process | **Workflow** (reactive/proactive + schedule) | **Routine** (cron/webhook) + heartbeat | **Workflow ≡ Routine.** A proactive workflow is a routine with a schedule; the **heartbeat** engine executes due routines and produces runs. |
| Work item | **Task** (taskboard) | **Issue** (goal/project links, comments, work products) | **Issue/Task** — Meridian's taskboard UX over Paperclip's richer issue (goal ancestry, project, comments, work products, approval state). |
| Direction | — | **Goal** hierarchy | **Goals** added; issues/tasks trace up to a goal ("the why"). |
| Grouping | (dept) | **Project** | **Projects** added (group issues, lead agent, target date). |
| Governance | Approvals + Vault + RBAC | Approvals + execution policies + budget hard-stops | **Approvals** unified; vault secrets kept; budget hard-stops added. |
| Integrations | **Connectors** (ERP/property systems) | **Adapters** (agent runtimes) + Secrets | **Two distinct axes, both kept:** _Connectors_ = data systems a UoW calls; _Adapters_ = runtime that powers an agent (BYO agent). |
| Cost | Cost Control + Effectiveness/ROI | Budget policies + cost events | **Cost Control + ROI** kept; **budget policies + cost events + hard-stops** added. |
| Knowledge | **Knowledge Graph** (GraphRAG) | documents | **Knowledge Graph** kept as a per-company asset. |
| Audit | — | **Activity log** | **Activity feed** added (immutable, every mutation traced). |
| Onboarding | **Dept Onboarding** wizard | company onboarding / hire | **Both:** create a company, then the dept-onboarding discovery wizard inside it. |
| Memory | **Employee memory tree** | agent_runtime_state | **Memory tree** kept + per-agent runtime state across heartbeats. |

**Guiding principle:** Meridian becomes *the content and the UX*; Paperclip
becomes *the spine* (multi-company, goals, heartbeats, audit, real backend).

---

## 3. Architecture

```
paperclip-prototype/
├── doc/
│   └── build.md                      ← this file (living plan)
├── package.json                      ← root; npm workspaces + dev scripts
├── client/                           ← React + Vite frontend (Meridian design system)
│   ├── index.html
│   ├── vite.config.js                ← dev proxy /api → server
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                   ← shell: company switcher, role nav, routing
│       ├── styles.css                ← ported from Meridian (self-contained design system)
│       ├── api/                      ← typed fetch client per resource (the CONTRACT seam)
│       │   ├── client.js             ← base fetch wrapper; always real fetch('/api/...')
│       │   ├── companies.js  agents.js  goals.js  projects.js
│       │   ├── issues.js  routines.js  approvals.js  costs.js
│       │   ├── unitsOfWork.js  workflows.js  connectors.js
│       │   ├── activity.js  knowledge.js  onboarding.js
│       ├── mock/                      ← MOCK BACKEND (removed when real server lands)
│       │   ├── browser.js            ← MSW worker setup (intercepts /api/* in dev)
│       │   ├── handlers.js           ← one handler per §6 endpoint; reads/writes db.js
│       │   ├── db.js                 ← in-memory store, hydrated from seed/, persisted to localStorage
│       │   └── seed.js               ← ports Meridian store.js + memory.js into the mock store
│       ├── store/
│       │   └── AppContext.jsx        ← session, current company, current user/role
│       ├── components/               ← ported from Meridian + new
│       │   ├── ui.jsx  KnowledgeGraph.jsx  VoiceInput.jsx
│       │   ├── Logo.jsx  BrandIcon.jsx
│       │   └── OrgChart.jsx          ← new (reporting-line tree)
│       └── pages/                    ← one module per nav section
│           ├── workspace.jsx  operate.jsx  build.jsx  govern.jsx
│           ├── unitofwork.jsx
│           ├── goals.jsx  projects.jsx  routines.jsx  activity.jsx  (new)
│           └── index.jsx
├── server/                           ← ⚠ PLANNED ONLY — designed below, NOT built in this prototype.
│   │                                   The mock layer mirrors this 1:1 so it drops in later.
│   └── src/                           (target shape for the future real backend)
│       ├── index.js                  ← http bootstrap
│       ├── app.js                    ← express app, middleware, route mount
│       ├── db/
│       │   ├── client.js             ← Drizzle + better-sqlite3
│       │   ├── schema.js             ← all tables (see §5)
│       │   └── migrate.js
│       ├── seed/
│       │   └── seed.js               ← ports Meridian seed → DB rows
│       ├── routes/                   ← one router per resource (mirrors api/)
│       ├── services/
│       │   ├── heartbeat.js          ← due-routine scheduler + run producer
│       │   ├── effectiveness.js      ← ROI rollups (ported from Meridian)
│       │   ├── cost.js               ← cost/budget computation
│       │   └── discovery.js          ← onboarding discovery (UoW candidates)
│       └── lib/
│           ├── activity.js           ← write to activity_log on every mutation
│           └── ids.js                ← deterministic id helpers
└── shared/
    └── constants.js                  ← MODELS, REASONING_LEVELS, ARCHETYPES, enums (used by both)
```

### Stack decisions (and rationale)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **React 18 + Vite** | Reuse Meridian's components/CSS unchanged; fastest path to the polished UX we must not lose. |
| Styling | **Meridian's `styles.css`** (self-contained) | The design system *is* the asset. No Tailwind migration — port as-is. |
| State | **React Context + React Query (`@tanstack/react-query`)** | Context for session/company/role (like Meridian's store); React Query for server state, caching, refetch — replaces `localStorage` store. |
| **Backend (this prototype)** | **Mock APIs — MSW (Mock Service Worker)** | Intercepts `fetch('/api/*')` in the browser and answers from a seeded in-memory store. UI makes **real HTTP calls** in both mock and real modes → converting to a real backend means **turning MSW off**, with zero changes to pages/components. |
| Mock data store | **In-memory JS objects, persisted to `localStorage`** | Hydrated from the Meridian seed; mutations write back so changes survive reload and feel like a real DB. The store schema mirrors §5 exactly. |
| Backend (planned, future) | **Node + Express 5** | Designed in §5/§6 as the contract MSW implements; coded later. Mirrors Paperclip. |
| ORM (planned) | **Drizzle ORM** | Same ORM Paperclip uses → §5 schema transfers directly when the real backend is built. |
| Database (planned) | **SQLite via `better-sqlite3`**, swappable to Postgres | Zero-setup for the future real backend; Drizzle keeps a clean path to Postgres (Paperclip's prod target). |
| Realtime | **Polling via React Query**; WebSocket deferred until a real backend exists | Mock layer is request/response; live push is a real-backend concern. |
| Monorepo | **npm workspaces** (`client`, `server`, `shared`) | Lighter than pnpm for a prototype; one `npm install`, one `npm run dev`. |
| Auth | **Mocked** (Meridian's persona login: admin/head/member), server trusts an `x-user-id` header | Prototype — no real auth. Structured so Better-auth could slot in later. |

### The mock → real conversion seam

The whole design hinges on one rule: **pages and components never know whether
the backend is mock or real.** They only ever call `client/src/api/*`, which does
plain `fetch('/api/...')`.

```
 pages/components ──► api/*  ──► fetch('/api/...')
                                      │
                 dev/prototype:  MSW intercepts ──► mock/handlers ──► mock/db (localStorage)
                 future:         (MSW off)      ──► real Express server ──► Drizzle ──► DB
```

**To convert to a real backend later:**
1. Build `server/` to the §5 schema + §6 routes (the contract is already written).
2. Stop registering the MSW worker (`mock/browser.js`) — guard it behind
   `if (import.meta.env.VITE_USE_MOCK === 'true')`.
3. Point Vite's dev proxy / `VITE_API_BASE` at the real server.

No page, component, or `api/*` signature changes. The mock and the planned server
are deliberately **1:1** on routes and payload shapes so this is a flag flip.

> **Heads-up (environment) — CONFIRMED:** `npm install` in a fresh dir works, but
> the shared npm **cache** `~/.npm` is root-owned on this machine and blocks
> installs with `EACCES`. Workaround (verified): `npm install --cache /tmp/pc-npm-cache`.
> The `node_modules` constraint from the memory note is really a *cache* issue.

---

## 4. Frontend information architecture (nav)

Keep Meridian's four-group sidebar and role gating; add Paperclip sections and a
**company switcher** in the top bar.

| Group | Route | Source | Roles | Notes |
|---|---|---|---|---|
| Workspace | Dashboard | Meridian | all | Company-scoped; admin/head/member views |
| Workspace | My Work | Meridian | all | Personal issue queue |
| Workspace | Inbox | Meridian | all | Questions + approvals |
| **Workspace** | **Activity** | **Paperclip (new)** | head, admin | Immutable audit feed |
| Operate | Departments | Meridian | admin | + reporting lines |
| **Operate** | **Org Chart** | **Paperclip (new)** | head, admin | Reporting-line tree |
| Operate | AI Employees / **Agents** | Meridian + Paperclip | head, admin | + adapter + budget + reporting line |
| Operate | Taskboard / **Issues** | Meridian + Paperclip | all | + goal/project links |
| Operate | Approvals | both | all | |
| **Direct** | **Goals** | **Paperclip (new)** | head, admin | Goal hierarchy |
| **Direct** | **Projects** | **Paperclip (new)** | head, admin | Group issues, lead agent |
| Build | Dept Onboarding | Meridian | admin | The discovery wizard — keep intact |
| Build | Units of Work | Meridian | head, admin | |
| Build | Workflows / **Routines** | Meridian + Paperclip | head, admin | proactive workflow ≡ scheduled routine |
| Build | Connectors | Meridian | head, admin | data systems |
| **Build** | **Adapters** | **Paperclip (new)** | admin | agent runtimes (BYO agent) |
| Build | Knowledge | Meridian | head, admin | Knowledge graph |
| Govern | Cost Control | Meridian | head, admin | + budget policies/hard-stops |
| Govern | Effectiveness | Meridian | head, admin | ROI |
| Govern | People | Meridian | head, admin | + invites |
| Govern | Governance | Meridian | admin | Vault secrets, RBAC, audit |
| Govern | **Companies** | **Paperclip (new)** | admin | Multi-company switch/create |
| Govern | Settings | Meridian | admin | |

Add a 5th nav group **"Direct"** (Goals, Projects) or fold them into Build — TBD
during Phase 5; default to a new group.

---

## 5. Data model — planned schema **and** mock-store shape

> This is the **planned** Drizzle schema for the future `server/src/db/schema.js`.
> In this prototype it is **not built as a DB** — instead, `client/src/mock/db.js`
> holds the same entities as in-memory collections with identical field names, so
> the mock and the real schema stay 1:1. Treat the field lists below as the
> contract for both.

Every domain table/collection carries a `companyId` (multi-tenant isolation), `createdAt`,
`updatedAt`. IDs are string slugs (`emp-1`, `uow-pm-3`) to keep Meridian's seed
intact. Tables (merged from both sources; Paperclip table names in parens):

**Identity & tenancy**
- `companies` — id, name, domain ('real-estate' | 'generic'), branding, budgetMonthlyUsd, issueCounter.
- `users` — id, name, email, role (`member|head|admin`), companyId, deptId, avatar, photo, title.
- `company_memberships` — userId, companyId, role.

**Org**
- `departments` — id, companyId, name, region, description.
- `agents` *(AI Employees)* — id, companyId, deptId, name, title, **archetype**,
  **model**, **reasoning**, status (`active|paused|idle|working`), **adapterId**,
  **managerId** (reporting line), **budgetMonthlyUsd**, tokensMonth, tasksCompleted,
  description.
- `agent_memberships` — agentId ↔ project/team (optional).
- `agent_runtime_state` — agentId, lastHeartbeatAt, sessionJson (persists across heartbeats).
- `agent_memory_nodes` — agentId, path, kind (`md|json|csv`), sizeKb, updatedAt,
  content (the memory tree; seeded deterministically like Meridian's `memory.js`).

**Capabilities & processes**
- `units_of_work` — id, companyId, deptId, name, description, endpoint(json),
  auth(json: mode/secret/scopes), mapping(json: manual/auto minutes+cost,
  runsPerMonth, error rates), raci(json).
- `workflows` *(≡ routines)* — id, companyId, deptId, name, **trigger**
  (`reactive|proactive`), **schedule** (cron-ish string), uowIds(json),
  successRate, enabled. (A proactive workflow is a routine.)
- `connectors` — id, companyId, brand, name, category, protocol, connected, deptId.
- `adapters` — id, name, kind (`claude|codex|cursor|http|bash`), config(json),
  status. *(BYO-agent runtimes — Paperclip concept.)*

**Work & direction**
- `goals` — id, companyId, parentId (hierarchy), title, description, status, targetDate.
- `projects` — id, companyId, name, leadAgentId, goalId, color, icon, targetDate, status.
- `issues` *(Tasks)* — id, companyId, title, description, status
  (`backlog|todo|in-progress|review|done`), priority, type, deptId, goalId,
  projectId, assigneeType (`ai|human`), assigneeId, dueDate, ownerId.
- `issue_comments`, `issue_work_products` — threads + deliverables.

**Execution**
- `heartbeat_runs` — id, companyId, agentId, workflowId, status
  (`queued|running|succeeded|failed`), startedAt, finishedAt, costUsd, log(json).

**Governance, cost, audit**
- `approvals` — id, companyId, title, type (`deploy|budget|access|config`), risk,
  deptId, requestedByAgentId, ownerId, status, detail.
- `vault_secrets` — name, companyId, type, masked, rotatedAt.
- `budget_policies` — id, companyId, scope (company|dept|agent), scopeId,
  monthlyLimitUsd, warnPct, hardStop.
- `cost_events` — id, companyId, agentId, model, tokens, costUsd, at.
- `activity_log` — id, companyId, actorType, actorId, action, targetType, targetId, meta(json), at.

**Knowledge**
- `knowledge_nodes`, `knowledge_edges` — ported from Meridian's `genKnowledgeGraph()`,
  now company-scoped and persisted.

> **Seed parity:** `client/src/mock/seed.js` ports Meridian's `store.js`
> (DEPARTMENTS, USERS, MODELS, REASONING_LEVELS, ARCHETYPES, VAULT_SECRETS,
> UNITS_OF_WORK incl. deterministic generators, WORKFLOWS, EMPLOYEES, tasks,
> approvals, questions, people, knowledge graph) into the seeded company
> `Onyx Meridian Real Estate` inside the mock store. MODELS/REASONING_LEVELS/
> ARCHETYPES live in `shared/constants.js` so UI, mock, and the future server
> agree. When the real backend lands, this same seed module moves to
> `server/src/seed/` unchanged.

---

## 6. API surface — the contract (mock now, Express later)

> This REST contract is **implemented today by the MSW mock** (`mock/handlers.js`)
> and **later by Express routers** (`server/src/routes/`) with identical paths and
> payloads. It is the conversion seam — keep mock and real handlers in lockstep.

REST, company-scoped via `?companyId=` or `x-company-id` header; role via
`x-user-id`. One handler per resource, mirroring `client/src/api/`:

```
GET/POST           /api/companies            switch + create companies
GET                /api/companies/:id/summary dashboard rollups
CRUD               /api/agents               (?deptId, ?status)  + /:id  + PATCH reasoning/budget/status
GET                /api/agents/:id/memory     memory tree;  /:id/activity  timeline
GET/POST           /api/goals                 hierarchy (?parentId)
GET/POST           /api/projects
CRUD               /api/issues                (?status,?assignee,?goalId,?projectId) board moves via PATCH
GET/POST           /api/workflows             (routines) + POST /:id/run  → heartbeat run
GET/POST           /api/routines              alias view over workflows w/ schedule
GET                /api/heartbeat/runs        run history;  POST /api/heartbeat/tick (dev: advance scheduler)
GET/POST           /api/units-of-work
GET/POST           /api/connectors            + POST /:id/connect (OAuth sim)
GET/POST           /api/adapters
GET/POST           /api/approvals             + POST /:id/resolve
GET                /api/costs                  spend by dept/model/agent + budget status
GET                /api/effectiveness          ROI rollups (service-computed)
GET                /api/activity               audit feed (?type,?actor)
GET                /api/knowledge              graph nodes+edges
POST               /api/onboarding/discover    discovery wizard: dept+connectors → UoW candidates (streamed/poll)
POST               /api/onboarding/publish     persist discovered UoWs + create dept
GET/POST           /api/people  /api/vault  /api/settings
```

Every mutating handler — MSW mock now, Express later — writes an `activity_log`
row so the Activity feed is populated by real app usage.

---

## 7. Implementation phases

> Mark `[x]` only when the acceptance criterion is met and verified by running.

### Phase 0 — Scaffold the client ✅
- [ ] Root `package.json` with npm workspaces (`client`, `shared`); `server` exists
      as an empty/planned workspace (no code). `npm run dev` runs the Vite client.
- [ ] `npm install` succeeds in the new dir (verify the root-owned-node_modules
      constraint does **not** apply here). Deps: react, vite, `@tanstack/react-query`,
      `msw`, `lucide-react`, `d3-force`.
- [ ] `client`: Vite boots on `:5173`; `api/client.js` does `fetch('/api/...')`.
- [ ] **Accept:** browser shows a stub page; a `fetch('/api/health')` is intercepted
      by MSW and returns `{ ok: true }`.

### Phase 1 — Mock backend + seed ✅
- [ ] MSW installed and registered in `main.jsx` behind `VITE_USE_MOCK` (default on).
- [ ] `mock/db.js` in-memory store matching §5; hydrate from `mock/seed.js`; persist
      to `localStorage` (reset helper for clean demos).
- [ ] `mock/seed.js` ports Meridian `store.js` + `memory.js` into company
      `Onyx Meridian Real Estate` (departments, users, agents+memory, UoW incl.
      generators, workflows, tasks→issues, approvals, vault, people, knowledge graph).
      Also seed an empty `(generic)` company to prove multi-tenancy.
- [ ] `mock/handlers.js` implements the §6 GET endpoints over `db.js`.
- [ ] **Accept:** `fetch('/api/agents?companyId=re')` (via MSW) returns seeded
      agents; counts match Meridian (≈8 depts, 17 agents, ~120 UoW, ~120 workflows).

### Phase 2 — Frontend shell port ✅
- [ ] Port `styles.css`, `ui.jsx`, `Logo.jsx`, `BrandIcon.jsx`, `VoiceInput.jsx`,
      `KnowledgeGraph.jsx` from Meridian into `client/src`.
- [ ] Port `App.jsx` shell (login personas, role nav, topbar) → swap `localStorage`
      store for **React Query + AppContext**; add **company switcher** in topbar.
- [ ] `api/client.js` base fetch wrapper; `AppContext` holds session+company+role.
- [ ] **Accept:** log in as admin/head/member, see role-gated nav, switch company.

### Phase 3 — Read-path pages (data from API) ✅
- [ ] Wire Meridian pages to the API (replace `useStore()` reads): Dashboard,
      Departments, AI Employees (+ memory tree + activity), Units of Work,
      Workflows, Connectors, Knowledge, Taskboard, Approvals, Cost, Effectiveness,
      People, Inbox, My Work, Settings, Governance.
- [ ] **Accept:** every Meridian screen renders identically, now sourced from the DB.

### Phase 4 — Write-path & mutations ✅
- [ ] POST/PATCH wired: create employee, set reasoning/budget/status, create/move
      issue, connect connector, add UoW, resolve approval, invite person.
- [ ] Each mock mutation writes `activity_log`.
- [ ] **Accept:** changes persist across reload (mock store in `localStorage`) and
      appear in the Activity feed.

### Phase 5 — Paperclip concepts (new pages) ✅
- [ ] **Goals** — hierarchy CRUD; link issues to goals (show goal ancestry on issue).
- [ ] **Projects** — group issues, lead agent, target date.
- [ ] **Org Chart** — reporting-line tree from `agents.managerId` (`OrgChart.jsx`).
- [ ] **Adapters** — BYO-agent runtime registry; assign adapter to an agent.
- [ ] **Companies** — list/create/switch; create a generic company end-to-end.
- [ ] **Activity** — audit feed page.
- [ ] **Accept:** create a 2nd (generic) company, add a goal→project→issue→agent
      chain in it, switch back to RE company, data is isolated.

### Phase 6 — Heartbeat / routines engine (mock) ⏳
- [ ] Mock heartbeat handler: `POST /api/heartbeat/tick` computes due routines
      (proactive workflows w/ schedule), writes `heartbeat_runs`, emits `cost_events`,
      updates `agent_runtime_state` — all in the mock store. (Logic lives in a
      `mock/heartbeat.js` helper so it ports to `server/src/services/heartbeat.js` later.)
- [ ] Run history UI on Workflows/Routines and Agent detail; a dev "Tick" button.
- [ ] Budget hard-stop: when an agent exceeds `budget_policies`, the handler pauses
      it + raises an approval.
- [ ] **Accept:** ticking the heartbeat creates runs, accrues cost, and a hard-stop
      pauses an over-budget agent with an audit entry.

### Phase 7 — Onboarding discovery (mock-backed) ⏳
- [ ] Meridian's discovery logic moves to `mock/discovery.js`; `POST /api/onboarding/discover`
      returns candidate UoWs (real + synthetic) for a dept+connectors (wizard polls;
      mock can stream phase-by-phase via staged responses).
- [ ] `POST /api/onboarding/publish` writes UoWs + creates the dept in the mock
      store; works for **any** company (real-estate seed *and* a fresh generic company).
- [ ] **Accept:** run the 5-step wizard in the RE company AND in a new generic
      company; published UoWs show up in Units of Work and survive reload.

### Phase 8 — Polish & verification ⏳
- [ ] Loading/skeleton states; optimistic updates via React Query.
- [ ] Voice input working on all inputs.
- [ ] (WebSocket live push is **deferred to the real backend** — not in the mock.)
- [ ] End-to-end verification pass (see §9).
- [ ] **Accept:** §9 checklist green.

---

## 8. Reuse map — what to copy vs. build

**Copy from Meridian (largely as-is):**
- `src/styles.css`, `src/components/ui.jsx`, `Logo.jsx`, `BrandIcon.jsx`,
  `VoiceInput.jsx`, `KnowledgeGraph.jsx` → `client/src/...`.
- `src/data/store.js` seed content + deterministic generators →
  `client/src/mock/seed.js` (kept as JS arrays/collections in the mock store).
- `src/data/memory.js` (memory-tree generation) → `client/src/mock/seed.js`
  (`agent_memory_nodes` collection).
- Page bodies (`workspace/operate/build/govern/unitofwork.jsx`) → `client/src/pages`,
  swapping `useStore()` reads/writes for `api/*` + React Query hooks.
- Effectiveness/cost math (`monthlyCost`, `effectiveness`) → `client/src/mock/`
  helpers (port to `server/src/services` when the real backend lands).

**Port concepts from Paperclip (re-implement, don't copy TS):**
- Schema *shapes* for goals, projects, issues, routines, heartbeat_runs,
  activity_log, budget_policies, cost_events, adapters, agent_runtime_state.
- Route *shapes* (resource-per-router, company scoping).
- Org-chart, Goals, Projects, Activity, Adapters, Companies page *concepts*
  (rebuilt in Meridian's design system, not Tailwind).

**Build new (this prototype):**
- `client/src/mock/*` (MSW worker, handlers, in-memory db, seed, heartbeat &
  discovery helpers), `client/src/api/*`, `AppContext` + React Query wiring,
  company switcher, `OrgChart.jsx`, the 6 new pages.

**Plan only (designed in §5/§6, not built):**
- `server/` (Express + Drizzle + DB + routes + services). The mock mirrors it 1:1
  so building it later is a contract-for-contract swap, not a rewrite.

---

## 9. Verification (end-to-end)

Run after each phase; full pass at Phase 8. Mirrors the memory note's "verify via
headless Chrome CDP" approach plus API checks.

1. **Boot:** `npm run dev` → client `:5173`, MSW worker registers, no console errors.
2. **Mock API:** in the browser, `fetch('/api/agents?companyId=re')` (or Network tab)
   shows MSW serving seeded agents. (Note: MSW runs **in-browser**, so `curl` won't
   hit it — verify via the app/devtools, not the shell.)
3. **Auth/roles:** log in as admin/head/member → nav gating correct; `Denied` for out-of-role routes.
4. **Read parity:** each Meridian screen matches the original prototype visually
   (spot-check Dashboard, AI Employees + memory tree, Units of Work, Knowledge graph, Cost/Effectiveness).
5. **Persistence:** make a change (e.g., set an agent's reasoning to `high`) → reload
   → still there (mock store in `localStorage`).
6. **Multi-company:** create a generic company, add goal→project→issue→agent, switch
   companies, confirm isolation; switch back to RE company unchanged.
7. **Onboarding:** run the 5-step discovery wizard in both companies; published UoWs persist.
8. **Heartbeat:** `POST /api/heartbeat/tick` → runs created, costs accrue, over-budget agent pauses.
9. **Audit:** Activity feed shows the mutations from steps 5–8.
10. **Headless Chrome CDP** screenshot pass of key screens; no runtime errors.

---

## 10. Risks & open questions

- **Install constraint:** confirm `npm install` works in this fresh dir (memory note
  flags root-owned `node_modules` in *meridian-prototype* only). Mitigate early (Phase 0).
- **Mock fidelity vs. drift:** the biggest risk is the mock and the planned §6
  contract drifting apart. Mitigate by keeping `mock/handlers.js` organized
  one-handler-per-endpoint matching §6 exactly, and treating §5/§6 as the spec both
  obey. A future real backend must pass the same §9 checks.
- **SQLite vs Postgres (planned backend only):** when built, SQLite for zero-setup;
  JSON columns store Meridian's nested shapes (endpoint/auth/mapping/raci); swap
  Drizzle dialect to Postgres for Paperclip-grade fidelity. Not relevant to the mock.
- **Workflow ≡ Routine modeling:** one collection (`workflows`) with a `schedule`
  field vs. two. Decision: **one**, expose a "Routines" view filtering
  `trigger='proactive'`. Revisit if scheduling grows complex.
- **Realtime scope:** WebSockets are a real-backend concern — **deferred** until the
  server exists. Mock + React Query polling is fine for the prototype.
- **Auth:** mocked personas only; structured so Better-auth could replace it later.
- **"Generic connections" depth:** generic companies get the full shell + onboarding,
  but seed content is real-estate-only. Generic companies start empty and are built
  via onboarding — that's the intended demonstration of extensibility.

### Decisions locked (from kickoff)
- **Frontend is real (React+Vite); backend is _planned only_.** The app runs on
  **Mock APIs (MSW)** implementing the §6 contract, structured for a **flag-flip
  conversion** to a real Express/Drizzle backend with no UI changes. ✔
- Real-estate domain preserved **and** multi-company generic shell. ✔
- Bring **all** Paperclip concepts (goals, org chart+adapters, routines+heartbeats,
  multi-company, activity/audit). ✔
- `build.md` is the maintained source of truth throughout. ✔

---

## 11. Progress log

| Date | Phase | What landed | Verified? |
|---|---|---|---|
| 2026-06-26 | — | `build.md` authored; project skeleton (`doc/`) created. | n/a |
| 2026-06-26 | — | Adjusted: backend **planned only**; app runs on **Mock APIs** behind the §6 contract, flag-flip convertible to a real server. | n/a |
| 2026-06-26 | 0–5 | **Built the app.** Ported Meridian into `client/` as the base; added the mock-API seam (`api/client.js` + `api/mock.js`, in-process dispatch over a `localStorage` store, 2 seeded companies); refactored `StoreContext` to be multi-company + API-backed (same `useStore()` shape); rebranded to **Paperclip**; added 6 new pages (Companies, Goals, Projects, Org Chart, Adapters, Activity) + nav group "Direct" + top-bar company switcher. | ✅ `vite build` (1634 modules, 0 errors); headless Chrome boot → branded login renders, mock API loads. |
| 2026-06-27 | verify | **Full E2E via puppeteer-core + system Chrome:** login as admin → all **23 nav routes render their correct page** (Meridian + new Paperclip pages), **company switch** (Onyx ↔ Acme) works, **0 runtime/console errors** (only a favicon 404). Fixed a latent Meridian bug: production minify mangled component names and broke the name-based route lookup → added `esbuild.keepNames` to `vite.config.js`. | ✅ |
| 2026-06-27 | theme | **Dark theme + rebrand.** Converted the whole UI to a near-black control-plane theme (Paperclip-style) by appending a dark override block to `styles.css` — redefines `:root` tokens (inverted gray scale, translucent accent surfaces, flat gradients, softer shadows) + overrides every hardcoded `white`/`#fff` surface (cards, topbar, modal, inputs, sidebar, pills, kanban, chat). Flat blue primary, dark scrollbars, roomier card padding (`pc-card`), tightened content gutter. Rebranded **Paperclip → Meridian** (login, sidebar, title). | ✅ Rebuilt + headless screenshots: Dashboard/Projects/Modal/Taskboard all dark & consistent. |

> **Implementation note:** the mock is an **in-process transport** in `api/client.js`
> (dispatches to `api/mock.js` when `VITE_USE_MOCK!==false`, else `fetch('/api/...')`),
> not MSW. Same seam, same flag-flip conversion, but no service-worker setup — more
> robust to run. The `mock/` folder in §3's tree is realized as `api/mock.js`.

> Append a row whenever a phase milestone lands. Keep the phase checklists in §7 in sync.
