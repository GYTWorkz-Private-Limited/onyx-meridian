"""Connector contract — the integration surface of the spine.

A *connector* knows how to move canonical records to and from one external
platform (Salesforce, HubSpot, ...). Mirroring the runtime ``adapters`` package,
the contract is deliberately tiny so the spine can host a long-running repository
of connectors without knowing any one platform's internals.

Every connector supports exactly two data operations:

* **pull**  — read records out of the platform (one page at a time, cursored).
* **push**  — write records into the platform (insert / update / upsert).

A connector is *adaptive*: it advertises :class:`Capabilities` and the object
catalogue it understands (via its :class:`~meridian.connectors.spec.ConnectorSpec`),
so callers can negotiate what is possible instead of discovering it by failure.

Connectors are pure transport. Credentials and per-platform settings arrive in a
:class:`ConnectionContext`, validated against the connector's YAML property
schema. Network I/O is concentrated in :class:`HTTPConnector`, which accepts an
injectable transport so the whole package is testable with zero network.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:  # pragma: no cover - typing only
    import httpx

    from .spec import ConnectorSpec


class ConnectorError(RuntimeError):
    """Raised by a connector when a platform call fails unrecoverably."""


@dataclass(frozen=True)
class Capabilities:
    """What a connector can do. Lets callers negotiate before they call."""

    pull: bool = True
    push: bool = True
    incremental: bool = False  # supports modified-since / cursor sync
    upsert: bool = False        # push can key on an external id


@dataclass
class ConnectionContext:
    """A validated, ready-to-use connection — credentials + settings.

    Built by the connection service from a stored connection's properties after
    they pass :meth:`Connector.validate_properties`.
    """

    platform: str
    domain: str
    properties: dict[str, Any] = field(default_factory=dict)

    def prop(self, name: str, default: Any = None) -> Any:
        return self.properties.get(name, default)


# --------------------------------------------------------------------------- #
# Pull (read out of the platform)
# --------------------------------------------------------------------------- #
@dataclass
class PullSpec:
    """One read request. Pulling is paged: pass ``cursor`` back to continue."""

    object: str                                   # platform object/module, e.g. "Account"
    filters: dict[str, Any] = field(default_factory=dict)
    fields: list[str] = field(default_factory=list)
    modified_since: str | None = None             # ISO-8601; incremental sync
    cursor: str | None = None                     # opaque page token from a prior page
    limit: int = 100


@dataclass
class PullPage:
    """One page of records read from the platform."""

    ok: bool
    records: list[dict[str, Any]] = field(default_factory=list)
    next_cursor: str | None = None
    has_more: bool = False
    summary: str = ""
    error: str | None = None


# --------------------------------------------------------------------------- #
# Push (write into the platform)
# --------------------------------------------------------------------------- #
@dataclass
class PushSpec:
    """One write request."""

    object: str
    records: list[dict[str, Any]] = field(default_factory=list)
    mode: str = "insert"                          # insert | update | upsert
    external_id_field: str | None = None          # required for upsert


@dataclass
class PushOutcome:
    """The result of a write."""

    ok: bool
    written: int = 0
    failed: int = 0
    results: list[dict[str, Any]] = field(default_factory=list)
    summary: str = ""
    error: str | None = None


# --------------------------------------------------------------------------- #
# The contract
# --------------------------------------------------------------------------- #
class Connector(ABC):
    """Base class every connector implements.

    Subclasses set :attr:`platform`, :attr:`domain` and :attr:`capabilities`.
    The loader attaches the YAML :class:`ConnectorSpec` to :attr:`spec` at import
    time, which powers generic property validation.
    """

    #: stable platform key, e.g. "salesforce"
    platform: str
    #: business domain, e.g. "crm" | "erp" | "hr" | "finance"
    domain: str
    #: what this connector can do
    capabilities: Capabilities = Capabilities()
    #: populated by the loader from the connector's ``_props.*.yaml``
    spec: ConnectorSpec | None = None

    @property
    def key(self) -> str:
        """Registry key — unique per (platform, domain)."""
        return f"{self.platform}.{self.domain}"

    def validate_properties(self, properties: dict[str, Any]) -> list[str]:
        """Return a list of human-readable problems (empty = valid).

        The default checks required properties declared in the YAML spec.
        Connectors may override to add platform-specific checks (calling
        ``super().validate_properties(...)`` first).
        """
        problems: list[str] = []
        if self.spec is not None:
            for p in self.spec.properties:
                if p.required and not properties.get(p.name):
                    problems.append(f"missing required property '{p.name}'")
        return problems

    async def test_connection(self, ctx: ConnectionContext) -> tuple[bool, str]:
        """Cheap liveness probe. Default: a 1-record pull of the first object."""
        if not self.capabilities.pull or self.spec is None or not self.spec.objects:
            return True, "no probe available"
        try:
            page = await self.pull(ctx, PullSpec(object=self.spec.objects[0].api_name, limit=1))
        except ConnectorError as exc:
            return False, str(exc)
        return page.ok, page.summary or page.error or "ok"

    @abstractmethod
    async def pull(self, ctx: ConnectionContext, spec: PullSpec) -> PullPage:
        """Read one page of records out of the platform."""

    @abstractmethod
    async def push(self, ctx: ConnectionContext, spec: PushSpec) -> PushOutcome:
        """Write records into the platform."""


class HTTPConnector(Connector):
    """A connector backed by an HTTP/REST API.

    Concentrates network I/O in one place. ``httpx`` is imported lazily so the
    in-memory dev/test path never requires the dependency to be importable, and
    tests can inject ``transport`` (an ``httpx.MockTransport``) to run offline.
    """

    #: tests set this to an httpx.MockTransport; production leaves it None
    transport: Any | None = None
    timeout_seconds: float = 30.0

    def _client(self, base_url: str = "", headers: dict[str, str] | None = None) -> httpx.AsyncClient:
        import httpx  # lazy

        return httpx.AsyncClient(
            base_url=base_url,
            headers=headers or {},
            timeout=self.timeout_seconds,
            transport=self.transport,
        )
