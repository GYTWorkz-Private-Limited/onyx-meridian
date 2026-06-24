# Handoff — Enterprise AI feature design + UI prototype

This document lets a fresh session (human or agent) understand, run, and rebuild
everything produced in the "Meridian framework → product → prototype" work
stream. Read this top to bottom once; it is self-contained.

- **Date of handoff:** 2026-06-23
- **Branch:** `feat/connectors`
- **Repo root:** `/Users/devamacha/localdisk/E/onyx-meridian`

---

## 1. Context — what Onyx Meridian is

Onyx Meridian is a **FastAPI control plane for an AI workforce** (Python 3.11,
`meridian/`). It already ships: business **Units** (departments), **Archetypes**
(role templates), **AI Employees** with a lifecycle + autonomy ladder
(shadow→assist→supervised→autonomous), a **model-gateway** token→USD cost meter,
**Tasks/commitments**, **Approvals** (HITL gates), an **audit ledger**, and a
**connector repository** (`meridian/connectors/`) with a spec-first research-mode
agent pair (extraction → builder). See `doc/ARCHITECTURE.md` and
`doc/PLATFORM-PLAN.md` for the backend.

This work stream did **not** touch the backend. It produced **product design docs**
and a **standalone UI prototype** that visualizes the target product. The prototype
uses stubbed data only — it does not call the API.

---

## 2. Deliverables produced this stream

| File | What it is |
|------|-----------|
| `doc/enterprise-ai-features.md` | Product feature model: the communicate→do loop, hierarchy (Dept→Roles→Units of work→Workflows→Knowledge Sphere→AI employees), cost & effectiveness, taskboard/WIP, cost-control center, agentic maintenance. Marks shipped vs proposed. |
| `doc/business-onboarding-and-process-decomposition.md` | Design for the **discovery agent**: an 8-phase deep agent that explores handed documents + wired connections and proposes a reviewable **Process Spec** (units of work, gated workflows, connector bindings, cost model). Spec-first, cite-everything, `UNVERIFIED`-by-default. |
| `doc/system-actions.md` | **RBAC action catalog** — single table, **496 actions** across 24 modules at near-API granularity, with a per-action matrix for 3 personas (Department Member / Department Head / Admin). Marks: `✅` full · `🔶` own-dept scoped · `—` none. Intended to export to a spreadsheet and to seed `governance/policy.py` authorization. |
| `prototype/standalone.html` | First-cut single-file vanilla-JS prototype (no build). Preserved for reference. Open directly in a browser. |
| `prototype/` (Vite + React app) | The real UI prototype. See §4. |

> The two design docs cross-link each other and `doc/CONNECTORS.md`. Vocabulary in
> all artifacts is deliberately aligned to the backend enums in
> `meridian/domain/enums.py` (ExecutionMode, AutonomyLevel, TaskStatus, etc.).

---

## 3. The persona / RBAC model (the spine of the UI)

Three roles, used by both `doc/system-actions.md` and the prototype:

- **Department Member** — participate only: ask/chat with AI employees, work the
  tasks AI assigns them, answer the AI's questions, act as gatekeeper only on
  gates assigned to them.
- **Department Head** — the operational role, **scoped to one department**:
  onboard AI employees, build units of work → workflows with gatekeepers, manage
  connections + knowledge graph, cost control, onboard human members (member role
  only — never another head).
- **Admin** — everything, org-wide: onboard departments + heads, org-wide digital
  twin, global policy/Vault, model gateway, connector catalog, platform settings.

The AI Employee is a **system actor**, not a login role; its runtime actions are
configured/authorized by Head/Admin.

---

## 4. The prototype (`prototype/`)

### Stack
- **Vite 5** + **React 18** (plain JSX, no TypeScript)
- **lucide-react** — professional icon set
- **d3-force** — knowledge-graph layout (rendered on canvas)
- **Plain CSS design system** in `src/styles.css` (no Tailwind — deliberately
  dependency-light and fully controlled). Fonts: Inter + JetBrains Mono via Google
  Fonts `<link>` in `index.html`.
- Blue + white theme; all color/shape tokens are CSS variables under `:root`.
- **No router lib** — routing is `useState('route')` in `App.jsx`.
- **Stubbed data only**, deterministic (seeded RNG) so the graph layout is stable.

### Run it
```bash
cd prototype
npm install            # if the global npm cache errors with EACCES/EEXIST,
                       # use:  npm install --cache .npm-cache   (then delete .npm-cache)
npm run dev            # http://localhost:5174  (auto-opens)
npm run build          # production build sanity check (compiles all modules)
```
Requires Node 18+ (developed on Node 25 / npm 11). `node_modules/` is git-ignored
and must be reinstalled in a fresh checkout.

### File map
```
prototype/
├── index.html                 # Vite entry; loads Google Fonts; mounts /src/main.jsx
├── vite.config.js             # react plugin; dev server port 5174, open:true
├── package.json
├── standalone.html            # legacy single-file prototype (reference only)
└── src/
    ├── main.jsx               # React root
    ├── App.jsx                # Login screen + Shell (sidebar/topbar) + role switch + router
    ├── styles.css             # entire design system (CSS variables + components)
    ├── data/
    │   ├── store.js           # ALL stubbed data + the knowledge-graph generator
    │   └── nav.js             # route registry + role→route access (canAccess/routesFor)
    ├── components/
    │   ├── ui.jsx             # primitives: Card, Stat, Pill, Bar, Modal, Avatar,
    │   │                      #   SectionTitle, Empty, Denied, useToast, statusTone/priTone
    │   └── KnowledgeGraph.jsx # canvas + d3-force graph (pan/zoom/hover/select/legend/search)
    └── pages/
        ├── index.jsx          # re-exports all pages
        ├── workspace.jsx      # Dashboard, MyWork, Inbox (Q&A + Ask-AI chat)
        ├── operate.jsx        # Departments, OrgTwin, Employees, Taskboard, Approvals
        ├── build.jsx          # Onboarding (8-phase run), Workflows, Connectors, Knowledge
        └── govern.jsx         # Cost, Effectiveness, People, Governance, Settings
```

### How the pieces wire together
- `App.jsx` holds `userId` (null = show `Login`) and `route`. It renders the
  sidebar from `routesFor(role)` and the page from `PAGE_MAP[route]`, but only if
  `canAccess(role, route)` — otherwise it shows the `<Denied/>` notice.
- The **role switcher** (top-right dropdown) calls `switchUser`; if the new role
  can't access the current route it falls back to `dashboard`.
- Every page component receives props: `{ user, role, go, toast }` where `go(route)`
  navigates and `toast(msg)` shows a transient confirmation.
- Sidebar nav counts (`employees`, `questions`, `approvals`) come from `COUNTS` in
  `App.jsx`, derived from `store.js`.

### The knowledge graph (the showpiece) — `components/KnowledgeGraph.jsx`
- Data generated in `store.js` → `genKnowledgeGraph()` → exported as
  `knowledgeGraph {nodes, links}` and `KG_STATS`. **~561 nodes, ~1000 edges**,
  15 entity categories (`KG_CATEGORIES`). Counts per category live in the `counts`
  object inside the generator — bump them to grow the graph.
- Layout: `d3-force` (`forceManyBody` + `forceLink` + `forceX/Y` + `forceCollide`)
  run **synchronously for ~280 ticks once on mount**, then positions are frozen and
  recentred. No continuous animation (keeps it smooth at 500+ nodes).
- Rendering: **canvas** (devicePixelRatio-aware) with manual transform for
  pan/zoom. Interactions: drag-pan, wheel-zoom-around-cursor, hover highlight
  (node + neighbors, others dimmed), click-to-select (detail card + neighbor
  chips), per-category legend toggle, and node search that recenters.
- Performance note: hit-testing is a linear scan over nodes per mousemove — fine at
  this scale. If you push past ~3–4k nodes, switch to a quadtree.

### Theme / "professionally great" notes
- Tokens in `:root` (blue ramp `--blue-50…950`, neutrals, accents, shadows,
  gradients). Sidebar uses `--grad-side`; primary actions use `--grad-blue`.
- Status colors are centralized: `statusTone()` / `priTone()` in `ui.jsx`.
- To re-theme, edit only the `:root` variables in `styles.css`.

---

## 5. Gotchas / things that bit us (so you don't re-hit them)
- **npm global cache EACCES/EEXIST** on this machine. Workaround used:
  `npm install --cache .npm-cache` then remove the local cache dir. (Root cause:
  permissions on `~/.npm`.)
- **String quoting in `store.js`** — the questions array contains apostrophes;
  keep using curly quotes (`’ “ ”`) inside single-quoted JS strings, or escape.
- `npm run build` is the fastest correctness check — it transforms every module and
  fails on a missing named import (e.g. a wrong lucide icon name). Always run it
  after edits.
- Members intentionally have **no Knowledge Graph nav item** (matches the RBAC doc).
  To demo the graph, switch to Head or Admin.

---

## 6. Rebuild-from-scratch guide (for a brand-new session)

If you must reconstruct the prototype, do it in this order:

1. **Scaffold:** create `prototype/` with `package.json` (deps: react, react-dom,
   d3-force, lucide-react; dev: vite, @vitejs/plugin-react), `vite.config.js`
   (react plugin, port 5174), and `index.html` (Google Fonts + `<div id=root>` +
   `/src/main.jsx`).
2. **Design system first:** write `src/styles.css` with the `:root` token block,
   then layout (`.app`, `.side`, `.topbar`, `.content`), then primitives
   (`.card`, `.btn`, `.pill`, `.stat`, tables, `.modal`, `.kanban`, `.graph-*`).
   Getting tokens right up front makes every page consistent.
3. **Data:** write `src/data/store.js` — roles/users, departments, employees,
   tasks, connectors/connections, approvals, workflows, archetypes, questions,
   and the seeded `genKnowledgeGraph()` (target 500+ nodes). Then `src/data/nav.js`
   (route registry + `roles` per route + `canAccess`/`routesFor`).
4. **Primitives + graph:** `src/components/ui.jsx` then
   `src/components/KnowledgeGraph.jsx`.
5. **Shell:** `src/App.jsx` — Login, RoleMenu, sidebar from `routesFor`, topbar
   with role switcher, `PAGE_MAP`, `canAccess` guard, toast.
6. **Pages:** the four `pages/*.jsx` files + `pages/index.jsx`. Each page takes
   `{user, role, go, toast}`.
7. **Verify:** `npm run build` (must compile), then `npm run dev`.

Anchor everything to the three reference docs — they are the source of truth for
features (`enterprise-ai-features.md`), the discovery flow
(`business-onboarding-and-process-decomposition.md`), and the per-role action
matrix (`system-actions.md`).

---

## 7. Known limitations & suggested next steps
- **Stubbed only.** No backend calls. Next: wire pages to FastAPI
  (`/units`, `/employees`, `/tasks`, `/approvals`, `/connectors`, `/connections`).
  Add a thin `api.js` client and swap `store.js` reads for fetches.
- **Action coverage.** The UI demonstrates the major modules; it does not implement
  all 496 actions interactively. `system-actions.md` is the backlog if you want
  fuller coverage.
- **Auth is fake.** The 3 logins are persona switches, not real auth/SSO.
- **Graph is illustrative.** Entities/relationships are synthetic; replace
  `genKnowledgeGraph()` with a real graph feed when Pulse exists.
- **Count check on `system-actions.md`:** it currently lists 496 actions. The
  original ask floated "~500, at least −20% (~400)." If a tighter list is wanted,
  trim the most granular runtime/workflow sub-actions and update the summary table.
- **Backend integration of the RBAC matrix:** `doc/system-actions.md` IDs are
  meant to map to routes + `governance/policy.py` scopes — not yet wired.

---

## 8. Quick command reference
```bash
# prototype
cd prototype
npm install                       # (use --cache .npm-cache if global cache errors)
npm run dev                       # dev server on :5174
npm run build                     # compile-check everything

# backend (unchanged this stream; for context)
cd /Users/devamacha/localdisk/E/onyx-meridian
uvicorn meridian.main:app --reload --port 8010   # see run.md
```

---

## 9. Pointers
- Product vision: `doc/enterprise-ai-features.md`
- Discovery agent: `doc/business-onboarding-and-process-decomposition.md`
- RBAC actions: `doc/system-actions.md`
- Backend architecture: `doc/ARCHITECTURE.md`, `doc/PLATFORM-PLAN.md`
- Connectors: `doc/CONNECTORS.md`, `meridian/connectors/`
- Running the backend: `run.md`
- UI prototype: `prototype/` (this handoff §4)
