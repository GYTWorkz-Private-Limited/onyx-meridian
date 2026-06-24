# Connectors

The **connector repository** is the spine's integration surface: a long-running,
standardized library of platform connectors organized by **platform** and
business **domain** (CRM, ERP, HR, finance, …). It lives in
[`meridian/connectors/`](../meridian/connectors).

## The contract

Every connector implements exactly two data operations behind one tiny contract
([`base.py`](../meridian/connectors/base.py)):

| Operation | Method | Shape |
|-----------|--------|-------|
| **pull** | `pull(ctx, PullSpec) -> PullPage` | one cursored page out of the platform |
| **push** | `push(ctx, PushSpec) -> PushOutcome` | insert / update / upsert into the platform |

A connector is **adaptive**: it advertises `Capabilities` (`pull`, `push`,
`incremental`, `upsert`) and an object catalogue, so callers negotiate what's
possible instead of discovering it by failure. Credentials + settings arrive in a
validated `ConnectionContext`; all HTTP I/O runs through `HTTPConnector._client(...)`,
whose injectable `transport` keeps connectors testable with zero network.

## Repository layout

```
meridian/connectors/
├── base.py                 # Connector / HTTPConnector contract, pull/push types
├── spec.py                 # ConnectorSpec — typed view of the _props.*.yaml files
├── registry.py             # the repository index, keyed by "<platform>.<domain>"
├── loader.py               # YAML-first discovery: scan catalog/ → import → register
├── catalog/                # ALL connectors here, one folder per platform
│   ├── salesforce/
│   │   ├── _props.salesforce.yaml   # property contract (shared `_props.` prefix)
│   │   └── crm.py                   # SalesforceCRMConnector
│   ├── hubspot/
│   │   ├── _props.hubspot.yaml
│   │   └── crm.py
│   └── zoho/
│       ├── _props.zoho.yaml         # status: research_derived
│       └── crm.py
└── agents/                 # research mode (see below)
    ├── extraction-agent/   # derive a domain model + spec via deep research
    └── builder-agent/      # write the FastAPI-compatible connector code
```

**Property files** share the `_props.` prefix and live beside their connector, so
a connector folder is self-contained and the property files are trivially globbed
(or `.gitignore`d / skipped) as a group. A connector is, declaratively, "a folder
with a `_props.*.yaml` and a module the YAML names."

## Completeness lifecycle

The repository tracks how finished each connector is, reported straight from the
YAML `status`:

`incomplete` (declared, no working code) → `research_derived` (built by the
research agents, **not yet doc-verified**) → `complete` (endpoints doc-verified +
tested).

The loader is best-effort: a connector whose module can't import is logged and
skipped so one broken/incomplete connector never blocks the rest.

## Shipped connectors

| Key | Platform | Domain | Status | Auth | Notes |
|-----|----------|--------|--------|------|-------|
| `salesforce.crm` | Salesforce | CRM | complete | OAuth2 bearer | SOQL pull, composite sObject + upsert push |
| `hubspot.crm` | HubSpot | CRM | complete | private-app token | list/search pull, batch create/update/upsert |
| `zoho.crm` | Zoho | CRM | research_derived | Zoho OAuth | v8 modules; **pending doc-verification** |

## Research mode (`agents/`)

When a platform has no connector — or only a stub — the
[research-mode agents](../meridian/connectors/agents/README.md) build one:

1. **extraction-agent** takes `(platform, domain)`, drives the `deep-research`
   harness against the platform's official docs, and derives a verifiable domain
   model → emits the `_props.<platform>.yaml` spec (as `research_derived`).
2. **builder-agent** takes that spec and scaffolds the `Connector` subclass that
   implements `pull`/`push` against the documented endpoints.

The pipeline is spec-first: the YAML is reviewable before any code is generated,
and a research-derived connector is only promoted to `complete` after its
endpoints are verified against live docs and smoke-tested.

> The `zoho.crm` connector here was produced by this pipeline and is intentionally
> left `research_derived`: the live doc-verification pass could not run in the
> build sandbox (no network egress), so its field names / cursor mechanics are
> provisional until verified.

## HTTP API

| Method & path | Purpose |
|---------------|---------|
| `GET /connectors` | list the repository (catalogue + completeness) |
| `GET /connectors/{key}` | one connector's spec + property contract |
| `POST /connections` | configure a connection (validated against the contract; secrets masked on read) |
| `GET /connections?unit_id=` | list connections for a unit |
| `GET /connections/{id}` | one connection (secrets masked) |
| `POST /connections/{id}/test` | liveness probe |
| `POST /connections/{id}/pull` | read a page of records |
| `POST /connections/{id}/push` | write records (insert / update / upsert) |

## Known shortcuts (today)

- Connection secrets are stored as-is in the store (dev posture); production
  should vault them and store only a reference.
- OAuth token acquisition/refresh is the caller's responsibility — connections
  take an already-issued access token as a property.
- `zoho.crm` endpoints are research-derived, not doc-verified (see above).
