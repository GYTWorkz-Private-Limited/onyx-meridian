"""Connectors — the spine's integration repository.

A long-running, standardized library of platform connectors organized by
platform and business domain. Every connector implements two operations — **pull**
and **push** — behind one tiny :class:`~meridian.connectors.base.Connector`
contract, and ships its config contract as a ``_props.*.yaml`` property file in
its own folder under ``catalog/``.

When a platform has no connector yet, the research-mode ``agents/`` (an
``extraction-agent`` that derives the domain model via deep research, and a
``builder-agent`` that writes the FastAPI-compatible code) produce one.

Importing this package does *not* load the catalogue — call
:func:`~meridian.connectors.loader.load_catalog` at startup so a malformed
connector can't break import time.
"""

from .base import (
    Capabilities,
    ConnectionContext,
    Connector,
    ConnectorError,
    HTTPConnector,
    PullPage,
    PullSpec,
    PushOutcome,
    PushSpec,
)
from .loader import discover_specs, load_catalog
from .registry import (
    all_connectors,
    by_platform,
    get_connector,
    get_connector_for,
    known_connector_keys,
    register_connector,
)
from .spec import ConnectorSpec, ObjectSpec, PropertySpec

__all__ = [
    "Capabilities",
    "ConnectionContext",
    "Connector",
    "ConnectorError",
    "HTTPConnector",
    "PullPage",
    "PullSpec",
    "PushOutcome",
    "PushSpec",
    "ConnectorSpec",
    "ObjectSpec",
    "PropertySpec",
    "discover_specs",
    "load_catalog",
    "all_connectors",
    "by_platform",
    "get_connector",
    "get_connector_for",
    "known_connector_keys",
    "register_connector",
]
