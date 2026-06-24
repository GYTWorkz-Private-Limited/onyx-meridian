"""HubSpot CRM connector.

Pull: ``GET /crm/v3/objects/{object}`` (cursored via ``paging.next.after``); when
``modified_since`` is set, ``POST /crm/v3/objects/{object}/search`` filtering on
``hs_lastmodifieddate``.
Push: the batch endpoints ``/batch/create``, ``/batch/update``, ``/batch/upsert``
(max 100 records/call).

Records cross the contract flat (``{"id": ..., <field>: <value>}``); the
connector wraps/unwraps HubSpot's ``properties`` envelope on each side.
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

_DEFAULT_BASE = "https://api.hubapi.com"
_MAX_BATCH = 100


class HubSpotCRMConnector(HTTPConnector):
    platform = "hubspot"
    domain = "crm"
    capabilities = Capabilities(pull=True, push=True, incremental=True, upsert=True)

    # -- helpers ------------------------------------------------------------
    def _base(self, ctx: ConnectionContext) -> str:
        return str(ctx.prop("base_url") or _DEFAULT_BASE).rstrip("/")

    def _headers(self, ctx: ConnectionContext) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {ctx.prop('access_token')}",
            "Content-Type": "application/json",
        }

    def _fields_for(self, object_name: str, requested: list[str]) -> list[str]:
        if requested:
            return requested
        if self.spec:
            for obj in self.spec.objects:
                if obj.api_name == object_name and obj.fields:
                    return obj.fields
        return []

    @staticmethod
    def _flatten(item: dict[str, Any]) -> dict[str, Any]:
        """HubSpot ``{"id","properties":{...}}`` -> flat record."""
        out = dict(item.get("properties", {}))
        if "id" in item:
            out["id"] = item["id"]
        return out

    # -- pull ---------------------------------------------------------------
    async def pull(self, ctx: ConnectionContext, spec: PullSpec) -> PullPage:
        headers = self._headers(ctx)
        async with self._client(base_url=self._base(ctx), headers=headers) as client:
            if spec.modified_since:
                return await self._search(client, spec)
            return await self._list(client, spec)

    async def _list(self, client, spec: PullSpec) -> PullPage:
        params: dict[str, Any] = {"limit": min(int(spec.limit) or 100, 100)}
        fields = self._fields_for(spec.object, spec.fields)
        if fields:
            params["properties"] = ",".join(fields)
        if spec.cursor:
            params["after"] = spec.cursor
        resp = await client.get(f"/crm/v3/objects/{spec.object}", params=params)
        if resp.status_code >= 400:
            raise ConnectorError(f"hubspot pull failed [{resp.status_code}]: {resp.text}")
        body = resp.json()
        records = [self._flatten(r) for r in body.get("results", [])]
        after = body.get("paging", {}).get("next", {}).get("after")
        return PullPage(
            ok=True,
            records=records,
            next_cursor=after,
            has_more=bool(after),
            summary=f"pulled {len(records)} {spec.object}",
        )

    async def _search(self, client, spec: PullSpec) -> PullPage:
        fields = self._fields_for(spec.object, spec.fields)
        payload: dict[str, Any] = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "hs_lastmodifieddate",
                            "operator": "GT",
                            "value": spec.modified_since,
                        }
                    ]
                }
            ],
            "limit": min(int(spec.limit) or 100, 100),
        }
        if fields:
            payload["properties"] = fields
        if spec.cursor:
            payload["after"] = spec.cursor
        resp = await client.post(f"/crm/v3/objects/{spec.object}/search", json=payload)
        if resp.status_code >= 400:
            raise ConnectorError(f"hubspot search failed [{resp.status_code}]: {resp.text}")
        body = resp.json()
        records = [self._flatten(r) for r in body.get("results", [])]
        after = body.get("paging", {}).get("next", {}).get("after")
        return PullPage(
            ok=True,
            records=records,
            next_cursor=after,
            has_more=bool(after),
            summary=f"searched {len(records)} {spec.object} since {spec.modified_since}",
        )

    # -- push ---------------------------------------------------------------
    async def push(self, ctx: ConnectionContext, spec: PushSpec) -> PushOutcome:
        if not spec.records:
            return PushOutcome(ok=True, summary="no records")
        if len(spec.records) > _MAX_BATCH:
            return PushOutcome(
                ok=False, error=f"batch too large: {len(spec.records)} > {_MAX_BATCH}"
            )
        inputs = self._build_inputs(spec)
        async with self._client(base_url=self._base(ctx), headers=self._headers(ctx)) as client:
            resp = await client.post(
                f"/crm/v3/objects/{spec.object}/batch/{spec.mode}",
                json={"inputs": inputs},
            )
        if resp.status_code >= 400:
            raise ConnectorError(f"hubspot push failed [{resp.status_code}]: {resp.text}")
        body = resp.json()
        results = body.get("results", [])
        status = body.get("status", "COMPLETE")
        num_errors = body.get("numErrors", 0)
        written = len(results)
        return PushOutcome(
            ok=status != "error" and not num_errors,
            written=written,
            failed=int(num_errors),
            results=results,
            summary=f"{spec.mode} {written} {spec.object} (status={status})",
        )

    def _build_inputs(self, spec: PushSpec) -> list[dict[str, Any]]:
        inputs: list[dict[str, Any]] = []
        for record in spec.records:
            rec = dict(record)
            entry: dict[str, Any] = {}
            if spec.mode == "update":
                entry["id"] = rec.pop("id", None)
            elif spec.mode == "upsert":
                ext = spec.external_id_field or "id"
                entry["idProperty"] = ext
                entry["id"] = rec.pop(ext, None)
            else:  # create
                rec.pop("id", None)
            entry["properties"] = rec
            inputs.append(entry)
        return inputs
