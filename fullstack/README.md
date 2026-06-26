# Paperclip Prototype

Meridian's real-estate **AI workforce** (department onboarding, AI employees,
Units of Work, knowledge graph, ROI) running **inside** Paperclip's
**multi-company orchestration** (companies, goals, org chart, adapters/BYO-agent,
activity feed).

- **Frontend:** React + Vite, reusing Meridian's self-contained design system.
- **Backend:** **planned only** (see [`doc/build.md`](doc/build.md)). The app runs
  on **mock APIs** (`client/src/api/mock.js`) over a seeded, `localStorage`-backed
  store. The API contract is the seam — flip `VITE_USE_MOCK=false` to point at a
  real backend later, with no UI changes.

## Run

```bash
cd paperclip-prototype
npm install            # if ~/.npm cache is root-owned, see note below
npm run dev            # → http://localhost:5173
```

> **npm cache note:** on this machine `~/.npm` is root-owned, which blocks installs.
> Use a writable cache: `npm install --cache /tmp/pc-npm-cache`.

## Sign in (mocked personas — any password)

| Username | Role | Sees |
| --- | --- | --- |
| `admin` | Platform Admin | everything, incl. Companies, Adapters, Governance |
| `head` | Dept Head | department workforce, goals, projects, org chart |
| `member` | Member | personal work, taskboard, inbox |

## What to try

- **Company switcher** (top bar): switch between **Onyx Meridian Real Estate**
  (fully seeded) and **Acme AI Labs** (empty generic company). Data is isolated.
- **Goals / Projects / Org Chart / Adapters / Activity** — the Paperclip concepts.
- **Dept Onboarding**, **AI Employees**, **Units of Work**, **Knowledge** — the
  Meridian flows, now company-scoped and API-backed.
- Make a change (e.g. set an agent's reasoning to High) → reload → it persists
  (mock store) and shows in **Activity**.

## Layout

```
client/   React + Vite app (mock APIs in src/api/, pages in src/pages/)
server/   PLANNED backend — designed in doc/build.md, not built
shared/   PLANNED shared constants
doc/      build.md — the living implementation plan
```
