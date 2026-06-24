"""Connector registry — the long-running repository, organized by platform+domain.

Built-in connectors register at import time (driven by :mod:`loader`, which scans
the ``catalog/`` tree). Externally-built or research-derived connectors can
register at startup. The registry is the single index the API reads to answer
"what can the spine integrate with, and how complete is each one?".

Keys are ``"<platform>.<domain>"`` (e.g. ``"salesforce.crm"``) so the same
platform can host several domain connectors (CRM, ERP, ...) side by side.
"""

from __future__ import annotations

from collections import defaultdict

from .base import Connector

_REGISTRY: dict[str, Connector] = {}


def register_connector(connector: Connector) -> None:
    _REGISTRY[connector.key] = connector


def get_connector(key: str) -> Connector:
    try:
        return _REGISTRY[key]
    except KeyError:
        raise KeyError(
            f"unknown connector '{key}'; known: {sorted(_REGISTRY)}"
        ) from None


def get_connector_for(platform: str, domain: str) -> Connector:
    return get_connector(f"{platform}.{domain}")


def known_connector_keys() -> list[str]:
    return sorted(_REGISTRY)


def all_connectors() -> list[Connector]:
    return [_REGISTRY[k] for k in sorted(_REGISTRY)]


def by_platform() -> dict[str, list[Connector]]:
    """Group the catalogue by platform — the primary organizing dimension."""
    grouped: dict[str, list[Connector]] = defaultdict(list)
    for key in sorted(_REGISTRY):
        c = _REGISTRY[key]
        grouped[c.platform].append(c)
    return dict(grouped)


def clear() -> None:
    """Test helper — empties the registry."""
    _REGISTRY.clear()
