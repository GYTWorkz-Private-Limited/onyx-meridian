"""Catalogue loader — discovers connectors from the ``catalog/`` tree.

Discovery is YAML-first: walk ``catalog/`` for ``_props.*.yaml`` files, parse
each into a :class:`~meridian.connectors.spec.ConnectorSpec`, import the module it
names, instantiate the connector class, attach the spec, and register it. This
keeps the repository declarative — a new connector is "a folder with a props file
and a module" — and lets the registry report completeness straight from the YAML.

A connector whose module fails to import (e.g. an ``incomplete`` stub) is logged
and skipped rather than crashing startup, so the rest of the catalogue still loads.
"""

from __future__ import annotations

import importlib
import logging
from pathlib import Path

from .registry import register_connector
from .spec import PROPS_GLOB, ConnectorSpec, load_spec_file

logger = logging.getLogger(__name__)

CATALOG_DIR = Path(__file__).parent / "catalog"


def discover_specs(catalog_dir: Path | None = None) -> list[ConnectorSpec]:
    """Parse every ``_props.*.yaml`` under the catalogue (no imports)."""
    root = catalog_dir or CATALOG_DIR
    specs: list[ConnectorSpec] = []
    for props_file in sorted(root.rglob(PROPS_GLOB)):
        try:
            specs.append(load_spec_file(props_file))
        except Exception as exc:  # pragma: no cover - malformed YAML
            logger.warning("connector spec %s failed to parse: %s", props_file, exc)
    return specs


def _instantiate(spec: ConnectorSpec):
    module = importlib.import_module(spec.module)
    cls = getattr(module, spec.class_name)
    connector = cls()
    connector.spec = spec
    return connector


def load_catalog(catalog_dir: Path | None = None) -> list[str]:
    """Discover, import, and register every connector. Returns the keys loaded.

    Best-effort: a connector whose code can't be imported is skipped with a
    warning so one broken/incomplete connector never blocks the others.
    """
    loaded: list[str] = []
    for spec in discover_specs(catalog_dir):
        try:
            connector = _instantiate(spec)
        except Exception as exc:
            logger.warning(
                "connector '%s' (%s) declared but not loadable: %s",
                spec.key,
                spec.status,
                exc,
            )
            continue
        register_connector(connector)
        loaded.append(connector.key)
    return loaded
