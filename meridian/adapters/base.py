"""Adapter contract.

An adapter knows how to (a) validate its slice of an employee's ``adapter_config``
and (b) execute one heartbeat. Keeping the contract tiny means the spine can host
any agent runtime — Claude Code, Codex, the OnyxOS agent loop, a plain webhook —
without knowing its internals.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class HeartbeatContext:
    """What the spine hands an adapter for one invocation."""

    employee_id: str
    unit_id: str
    model: str
    adapter_config: dict[str, Any]
    trigger_detail: str = ""


@dataclass
class AdapterResult:
    """What an adapter returns from one heartbeat."""

    ok: bool
    input_tokens: int = 0
    output_tokens: int = 0
    summary: str = ""
    error: str | None = None
    result: dict[str, Any] = field(default_factory=dict)


class Adapter(ABC):
    #: stable identifier stored on ``employee.adapter_type``
    type: str

    @abstractmethod
    def validate_config(self, config: dict[str, Any]) -> list[str]:
        """Return a list of human-readable problems (empty = valid)."""

    @abstractmethod
    async def execute_heartbeat(self, ctx: HeartbeatContext) -> AdapterResult:
        """Run one invocation of the employee."""
