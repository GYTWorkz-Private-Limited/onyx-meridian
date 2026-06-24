"""Zoho CRM connector — research-derived (status: research_derived).

Produced by the research-mode pipeline (extraction-agent → builder-agent). The
endpoints below model the Zoho CRM v8 REST API:

- Pull:  ``GET /crm/{v}/{module}`` with ``fields``, ``per_page``, and a
  ``page_token`` cursor (``info.next_page_token``); incremental sync via the
  ``If-Modified-Since`` header.
- Push:  ``POST /crm/{v}/{module}`` (insert) / ``PUT`` (update) with
  ``{"data": [...]}`` (max 100), and ``POST /crm/{v}/{module}/upsert``.

Auth header is ``Authorization: Zoho-oauthtoken <access_token>``.

NOTE: this connector is **not** doc-verified in this build (no network egress
during research). Treat field names / cursor mechanics as provisional until the
spec is promoted to ``complete``.
"""

from __future__ import annotations

from typing import Any

from ...base import (
    Capabilities,
    ConnectionContext,
    ConnectorError,
    HTTPConnector,
    PullPage,
    PullSpec,
    PushOutcome,
    PushSpec,
)

_DEFAULT_DOMAIN = "https://www.zohoapis.com"
_DEFAULT_VERSION = "v8"
_MAX_BATCH = 100
_MAX_PER_PAGE = 200


class ZohoCRMConnector(HTTPConnector):
    platform = "zoho"
    domain = "crm"
    capabilities = Capabilities(pull=True, push=True, incremental=True, upsert=True)

    # -- helpers ------------------------------------------------------------
    def _base(self, ctx: ConnectionContext) -> str:
        return str(ctx.prop("api_domain") or _DEFAULT_DOMAIN).rstrip("/")

    def _version(self, ctx: ConnectionContext) -> str:
        return ctx.prop("api_version") or _DEFAULT_VERSION

    def _headers(self, ctx: ConnectionContext) -> dict[str, str]:
        return {
            "Authorization": f"Zoho-oauthtoken {ctx.prop('access_token')}",
            "Content-Type": "application/json",
        }

    def _fields_for(self, object_name: str, requested: list[str]) -> list[str]:
        if requested:
            return requested
        if self.spec:
            for obj in self.spec.objects:
                if obj.api_name == object_name and obj.fields:
                    return obj.fields
        return ["id"]

    # -- pull ---------------------------------------------------------------
    async def pull(self, ctx: ConnectionContext, spec: PullSpec) -> PullPage:
        version = self._version(ctx)
        # Zoho requires an explicit field list on GET /{module}.
        params: dict[str, Any] = {
            "fields": ",".join(self._fields_for(spec.object, spec.fields)),
            "per_page": min(int(spec.limit) or 100, _MAX_PER_PAGE),
        }
        if spec.cursor:
            params["page_token"] = spec.cursor
        headers = self._headers(ctx)
        if spec.modified_since:
            headers["If-Modified-Since"] = spec.modified_since

        async with self._client(base_url=self._base(ctx), headers=headers) as client:
            resp = await client.get(f"/crm/{version}/{spec.object}", params=params)
            # 304 = nothing modified since the watermark.
            if resp.status_code == 304:
                return PullPage(ok=True, records=[], has_more=False, summary="not modified")
            if resp.status_code == 204:
                return PullPage(ok=True, records=[], has_more=False, summary="no content")
            if resp.status_code >= 400:
                raise ConnectorError(f"zoho pull failed [{resp.status_code}]: {resp.text}")
            body = resp.json()
            records = body.get("data", [])
            info = body.get("info", {})
            token = info.get("next_page_token")
            return PullPage(
                ok=True,
                records=records,
                next_cursor=token,
                has_more=bool(info.get("more_records")) and bool(token),
                summary=f"pulled {len(records)} {spec.object}",
            )

    # -- push ---------------------------------------------------------------
    async def push(self, ctx: ConnectionContext, spec: PushSpec) -> PushOutcome:
        if not spec.records:
            return PushOutcome(ok=True, summary="no records")
        if len(spec.records) > _MAX_BATCH:
            return PushOutcome(
                ok=False, error=f"batch too large: {len(spec.records)} > {_MAX_BATCH}"
            )
        version = self._version(ctx)
        path = f"/crm/{version}/{spec.object}"
        method = "POST"
        if spec.mode == "update":
            method = "PUT"
        elif spec.mode == "upsert":
            path = f"{path}/upsert"

        payload: dict[str, Any] = {"data": spec.records}
        if spec.mode == "upsert" and spec.external_id_field:
            payload["duplicate_check_fields"] = [spec.external_id_field]

        async with self._client(base_url=self._base(ctx), headers=self._headers(ctx)) as client:
            resp = await client.request(method, path, json=payload)
        if resp.status_code >= 400:
            raise ConnectorError(f"zoho push failed [{resp.status_code}]: {resp.text}")
        results = resp.json().get("data", [])
        written = sum(1 for r in results if r.get("code") == "SUCCESS" or r.get("status") == "success")
        return PushOutcome(
            ok=written == len(results) and bool(results),
            written=written,
            failed=len(results) - written,
            results=results,
            summary=f"{spec.mode} {written}/{len(results)} {spec.object}",
        )
