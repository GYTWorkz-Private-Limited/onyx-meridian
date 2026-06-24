# Onyx Meridian — Admin Console (FE)

The web "face" for the spine: onboard a unit, then **configure → deploy → monitor
→ decommission** AI employees, work the approval queue, run the Task Registry, and
ingest meeting transcripts — all over the spine API.

Stack matches the onyx family frontend (`lms-onyx-frontend`): **React 19 + Vite 7 +
TypeScript + Tailwind 4**, axios, lucide-react. No backend-specific build step.

## Run

```bash
# 1. start the API (from the repo root)
uvicorn meridian.main:app --reload --port 8010

# 2. start the console
cd ui
cp .env.example .env          # VITE_API_BASE=http://localhost:8010
npm install
npm run dev                    # http://localhost:5173
```

`npm run build` produces a static `dist/`; `npm run typecheck` runs `tsc --noEmit`.

## What's here

| Page | Does |
|---|---|
| Dashboard | the leadership read-model — commitments, spend, autonomy mix, approvals, stale workers |
| Units | onboard a department, set its delegatable-scope catalog + budget, activate it |
| AI Employees | roster + instantiate; per-employee **configure / deploy / suspend / resume / promote / demote / decommission**, run a heartbeat, rotate credential, view runs |
| Task Registry | commitments with owner / source / status / due; start/complete; escalation sweep |
| Approvals | the one-tap HITL queue (approve/reject deploy & decommission) |
| Meeting Intel | paste a transcript → extracted commitments with provenance |

## Layout

```
ui/src/
  api/client.ts     typed axios client + API types (one place)
  state/unit.tsx    selected-unit context (persisted)
  components/ui.tsx  Tailwind primitives (Button, Card, Pill, Stat, ...)
  pages/            Dashboard, Units, Employees, EmployeeDetail, Tasks, Approvals, Ingest
  App.tsx           sidebar layout + routes
```

The credential token returned at deploy is shown **once** in the employee detail
view — copy it then; it is never retrievable again (only rotated).
