# Extraction Agent

**Role:** Given a `(platform, domain)` pair (e.g. `netsuite`, `erp`), research the
platform's official API and derive a verifiable **connector spec** — the
`_props.<platform>.yaml` property file the rest of the framework consumes.

This agent runs in **research mode**: it drives the `deep-research` harness
(fan-out web search → fetch primary docs → adversarially verify → synthesize a
cited report) and then distills that report into the spec dataclasses defined in
[`../../spec.py`](../../spec.py).

## Inputs

| Field | Example | Notes |
|-------|---------|-------|
| `platform` | `netsuite` | becomes the connector + folder key |
| `domain` | `erp` | `crm` \| `erp` \| `hr` \| `finance` \| … |
| `objects` (optional) | `["Customer","Invoice"]` | seed objects to prioritise |

## Procedure (the deep-research brief)

The agent issues this brief to `deep-research`, scoped to the platform's
**official developer documentation only** (no blog posts):

1. **Authentication** — exact scheme (OAuth2 / token / basic), the token
   endpoint URL, the grant/refresh request shape, and the `Authorization`
   header format. Note multi–data-centre base-URL variation.
2. **Base URLs** — the API root and any version path segment.
3. **Object catalogue** — for the requested domain, the canonical objects and
   their API field names + types. Map each to a Meridian `domain_model`.
4. **PULL** — the read endpoint, pagination params, the cursor/`next` mechanism,
   incremental modified-since filter, and the response envelope shape.
5. **PUSH** — insert / update / upsert endpoints, batch limits, and the result
   envelope (per-record success/error).
6. **Rate limits** — quota model + the 429 behaviour.

Every fact must cite the exact doc URL it was verified against. **Any fact not
confirmed against primary docs is marked `UNVERIFIED`** and the connector ships
as `status: research_derived`, never `complete`.

## Output

A `ConnectorSpec` serialized to `_props.<platform>.yaml` in
`catalog/<platform>/`, with:

- `connector.status: research_derived`
- `capabilities` reflecting what the docs actually support
- `properties` = the connection config contract (secrets flagged)
- `objects` = the verified object/field catalogue

The spec is then handed to the [builder-agent](../builder-agent/README.md).

## Invocation

`extractor.py` is a standalone runbook module (not part of the FastAPI import
graph). From the repo root:

```bash
python meridian/connectors/agents/extraction-agent/extractor.py netsuite erp \
    --objects Customer Invoice
```

This prints the deep-research **brief** to run. After running `deep-research`,
pass the report path back to emit the `_props.<platform>.yaml`:

```bash
python meridian/connectors/agents/extraction-agent/extractor.py netsuite erp \
    --report research-report.md --emit
```
