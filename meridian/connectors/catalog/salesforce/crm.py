"""Salesforce CRM connector.

Pull: SOQL ``/query`` (cursored via ``nextRecordsUrl``), with optional
incremental filtering on ``LastModifiedDate``.
Push: the composite sObject Collections endpoint (insert/update, up to 200
records/call) and per-record PATCH upsert on an external-id field.

Docs: REST API Developer Guide — ``/services/data/<v>/query``,
``/composite/sobjects`` and ``/sobjects/<obj>/<extIdField>/<value>``.
Auth is a bearer access token supplied as a connection property; obtaining it
(the connected-app OAuth flow) is the caller's responsibility.
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

_DEFAULT_API_VERSION = "v60.0"
_MAX_BATCH = 200  # Salesforce composite sObject collections cap


def _soql_literal(value: Any) -> str:
    """Render a Python value as a SOQL literal."""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    escaped = str(value).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{escaped}'"


class SalesforceCRMConnector(HTTPConnector):
    platform = "salesforce"
    domain = "crm"
    capabilities = Capabilities(pull=True, push=True, incremental=True, upsert=True)

    # -- helpers ------------------------------------------------------------
    def _api_version(self, ctx: ConnectionContext) -> str:
        return ctx.prop("api_version") or _DEFAULT_API_VERSION

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
        return ["Id"]

    def _build_soql(self, spec: PullSpec) -> str:
        fields = ", ".join(self._fields_for(spec.object, spec.fields))
        clauses: list[str] = []
        for key, val in spec.filters.items():
            clauses.append(f"{key} = {_soql_literal(val)}")
        if spec.modified_since:
            clauses.append(f"LastModifiedDate > {spec.modified_since}")
        where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
        limit = f" LIMIT {int(spec.limit)}" if spec.limit else ""
        return f"SELECT {fields} FROM {spec.object}{where}{limit}"

    @staticmethod
    def _strip(record: dict[str, Any]) -> dict[str, Any]:
        """Drop Salesforce's per-record ``attributes`` envelope."""
        return {k: v for k, v in record.items() if k != "attributes"}

    # -- pull ---------------------------------------------------------------
    async def pull(self, ctx: ConnectionContext, spec: PullSpec) -> PullPage:
        base = str(ctx.prop("instance_url") or "").rstrip("/")
        if not base:
            raise ConnectorError("instance_url is required")
        async with self._client(base_url=base, headers=self._headers(ctx)) as client:
            # A cursor is the relative nextRecordsUrl from a prior page.
            if spec.cursor:
                resp = await client.get(spec.cursor)
            else:
                soql = self._build_soql(spec)
                resp = await client.get(
                    f"/services/data/{self._api_version(ctx)}/query",
                    params={"q": soql},
                )
            if resp.status_code >= 400:
                raise ConnectorError(f"salesforce pull failed [{resp.status_code}]: {resp.text}")
            body = resp.json()
            records = [self._strip(r) for r in body.get("records", [])]
            next_url = body.get("nextRecordsUrl")
            done = body.get("done", True)
            return PullPage(
                ok=True,
                records=records,
                next_cursor=next_url,
                has_more=not done and bool(next_url),
                summary=f"pulled {len(records)} {spec.object} (total {body.get('totalSize', len(records))})",
            )

    # -- push ---------------------------------------------------------------
    async def push(self, ctx: ConnectionContext, spec: PushSpec) -> PushOutcome:
        if not spec.records:
            return PushOutcome(ok=True, summary="no records")
        if len(spec.records) > _MAX_BATCH:
            return PushOutcome(
                ok=False,
                error=f"batch too large: {len(spec.records)} > {_MAX_BATCH}",
            )
        base = str(ctx.prop("instance_url") or "").rstrip("/")
        if not base:
            raise ConnectorError("instance_url is required")
        version = self._api_version(ctx)
        async with self._client(base_url=base, headers=self._headers(ctx)) as client:
            if spec.mode == "upsert":
                return await self._upsert(client, version, spec)
            return await self._collection_write(client, version, spec)

    async def _collection_write(self, client, version: str, spec: PushSpec) -> PushOutcome:
        method = "PATCH" if spec.mode == "update" else "POST"
        records = [{"attributes": {"type": spec.object}, **r} for r in spec.records]
        resp = await client.request(
            method,
            f"/services/data/{version}/composite/sobjects",
            json={"allOrNone": False, "records": records},
        )
        if resp.status_code >= 400:
            raise ConnectorError(f"salesforce push failed [{resp.status_code}]: {resp.text}")
        results = resp.json()
        written = sum(1 for r in results if r.get("success"))
        return PushOutcome(
            ok=written == len(results),
            written=written,
            failed=len(results) - written,
            results=results,
            summary=f"{spec.mode} {written}/{len(results)} {spec.object}",
        )

    async def _upsert(self, client, version: str, spec: PushSpec) -> PushOutcome:
        ext = spec.external_id_field
        if not ext:
            return PushOutcome(ok=False, error="upsert requires external_id_field")
        results: list[dict[str, Any]] = []
        written = 0
        for record in spec.records:
            key_val = record.get(ext)
            if key_val is None:
                results.append({"success": False, "errors": [f"missing {ext}"]})
                continue
            body = {k: v for k, v in record.items() if k != ext}
            resp = await client.patch(
                f"/services/data/{version}/sobjects/{spec.object}/{ext}/{key_val}",
                json=body,
            )
            ok = resp.status_code < 400
            written += 1 if ok else 0
            results.append(
                {"success": ok, "status": resp.status_code,
                 "body": resp.json() if resp.content else None}
            )
        return PushOutcome(
            ok=written == len(results),
            written=written,
            failed=len(results) - written,
            results=results,
            summary=f"upsert {written}/{len(results)} {spec.object} on {ext}",
        )
