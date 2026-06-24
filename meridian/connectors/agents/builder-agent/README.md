# Builder Agent

**Role:** Given a `ConnectorSpec` (the `_props.<platform>.yaml` produced by the
[extraction-agent](../extraction-agent/README.md)), write the FastAPI-compatible
`Connector` subclass — `catalog/<platform>/<domain>.py` — that implements
`pull()` and `push()` against the endpoints the spec describes.

## Contract the generated code must satisfy

The connector must subclass [`HTTPConnector`](../../base.py) and:

- set `platform`, `domain`, and `capabilities` to match the spec;
- read all credentials/settings from the `ConnectionContext` (never hard-code);
- implement `pull(ctx, PullSpec) -> PullPage` — one page, returning `next_cursor`
  + `has_more` for pagination, honouring `modified_since` when
  `capabilities.incremental`;
- implement `push(ctx, PushSpec) -> PushOutcome` — handle `insert` / `update`, and
  `upsert` when `capabilities.upsert`, respecting the platform batch limit;
- raise `ConnectorError` on unrecoverable platform failures;
- do all network I/O through `self._client(...)` so the `transport` injection
  point keeps it testable offline.

## Procedure

1. Load the spec; refuse to build if `status` is missing or objects are empty.
2. Map each spec object's `domain_model` ↔ `api_name`.
3. Generate `pull()`:
   - build the query/params from `PullSpec.fields` (default to the spec field list);
   - translate the documented pagination cursor into `next_cursor`;
   - apply `modified_since` via the documented incremental mechanism.
4. Generate `push()`:
   - map the documented insert/update/upsert endpoints to `PushSpec.mode`;
   - chunk to the batch limit; surface per-record results in `PushOutcome.results`.
5. Generate a matching test using `httpx.MockTransport` with recorded fixtures.
6. Leave `status: research_derived` until a human verifies endpoints against live
   docs + a smoke test, then promote to `complete`.

## Reference implementations

The hand-written [`salesforce/crm.py`](../../catalog/salesforce/crm.py) and
[`hubspot/crm.py`](../../catalog/hubspot/crm.py) are the canonical style the
builder should emulate — including how each wraps/unwraps its platform's record
envelope (`attributes` for Salesforce, `properties` for HubSpot).

## Invocation

`builder.py` is a standalone runbook module. From the repo root:

```bash
python meridian/connectors/agents/builder-agent/builder.py \
    catalog/zoho/_props.zoho.yaml
```

It prints a scaffolded connector module seeded from the spec, ready for the
builder agent (or a human) to fill in the platform-specific request/response
handling.
