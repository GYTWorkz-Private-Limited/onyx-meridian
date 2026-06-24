"""Mutable adapter registry (paperclip pattern).

Built-in adapters register at import time; external adapters can register at
startup. ``known_adapter_types`` backs config validation so the API rejects an
employee whose ``adapter_type`` isn't installed.
"""

from __future__ import annotations

from .base import Adapter
from .echo import EchoAdapter

_REGISTRY: dict[str, Adapter] = {}


def register_adapter(adapter: Adapter) -> None:
    _REGISTRY[adapter.type] = adapter


def get_adapter(adapter_type: str) -> Adapter:
    try:
        return _REGISTRY[adapter_type]
    except KeyError:
        raise KeyError(
            f"unknown adapter_type '{adapter_type}'; "
            f"known: {sorted(_REGISTRY)}"
        ) from None


def known_adapter_types() -> list[str]:
    return sorted(_REGISTRY)


# Register the built-ins.
register_adapter(EchoAdapter())
