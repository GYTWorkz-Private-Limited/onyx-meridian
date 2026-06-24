"""Employee runtime adapters — the 'bring your own agent' surface.

Borrowed from paperclip's adapter pattern: an employee's ``adapter_type`` selects
how it actually executes (a local CLI agent, an HTTP webhook, the OnyxOS agent
runtime, ...). The spine only needs the registry + contract so it can validate
configs and run heartbeats; concrete adapters are registered at startup.
"""

from .base import Adapter, AdapterResult, HeartbeatContext
from .registry import get_adapter, known_adapter_types, register_adapter

__all__ = [
    "Adapter",
    "AdapterResult",
    "HeartbeatContext",
    "get_adapter",
    "known_adapter_types",
    "register_adapter",
]
