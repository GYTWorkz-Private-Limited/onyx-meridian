# Connector Agents — research mode

When a platform has **no connector yet**, or only an `incomplete` stub, the
connector repository fills the gap with two cooperating agents:

```
            ┌─────────────────────┐         ┌────────────────────┐
platform +  │  extraction-agent   │  spec   │   builder-agent    │  connector
domain   ─▶ │  (deep research →   │ ──────▶ │  (writes FastAPI-  │ ──────────▶ catalog/<platform>/
            │   domain model)     │  (YAML) │   compatible code) │             ├─ _props.<platform>.yaml
            └─────────────────────┘         └────────────────────┘             └─ <domain>.py
```

1. **`extraction-agent/`** — takes a `(platform, domain)` pair, explores the
   platform's official API documentation via deep research, and derives the
   domain model: auth scheme, base URLs, the object catalogue with field names,
   and the exact pull/push endpoints. Output is a **`ConnectorSpec`** (the
   `_props.<platform>.yaml` property file). See its [`README.md`](extraction-agent/README.md).

2. **`builder-agent/`** — takes the extracted spec and writes the
   `Connector` subclass (`<domain>.py`) that implements `pull()` / `push()`
   against those endpoints, matching the contract in
   [`../base.py`](../base.py). See its [`README.md`](builder-agent/README.md).

Both agents are **playbooks first, code second**: the Markdown files are the
authoritative prompt/runbook, and the small Python modules
(`extractor.py`, `builder.py`) are thin orchestrators that shell out to the
`deep-research` skill and normalize its output into the framework's dataclasses.

## Why a spec-first pipeline

- The YAML spec is reviewable by a human before any code is generated — a
  research-derived connector lands as `status: research_derived` and is only
  promoted to `complete` after the endpoints are verified against live docs.
- The same spec drives config validation, the catalogue API, and the generated
  code, so there is one source of truth per connector.

## Completeness lifecycle

`incomplete` (declared, no code) → `research_derived` (extraction + build done,
**unverified**) → `complete` (endpoints doc-verified + tested).
The registry reports this status so leadership can see coverage at a glance.
