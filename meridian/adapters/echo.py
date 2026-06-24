"""A built-in, dependency-free adapter used for the vertical slice and tests.

It "runs" by echoing a deterministic summary and reporting token usage drawn
from its config, so the monitoring + cost-metering path can be exercised end to
end without any external agent runtime.
"""

from __future__ import annotations

from typing import Any

from .base import Adapter, AdapterResult, HeartbeatContext


class EchoAdapter(Adapter):
    type = "echo"

    def validate_config(self, config: dict[str, Any]) -> list[str]:
        problems: list[str] = []
        tokens = config.get("tokens_per_run", {})
        if tokens and not isinstance(tokens, dict):
            problems.append("adapter_config.tokens_per_run must be an object")
        return problems

    async def execute_heartbeat(self, ctx: HeartbeatContext) -> AdapterResult:
        tokens = ctx.adapter_config.get("tokens_per_run", {})
        in_tok = int(tokens.get("input", 1000))
        out_tok = int(tokens.get("output", 250))
        return AdapterResult(
            ok=True,
            input_tokens=in_tok,
            output_tokens=out_tok,
            summary=f"echo heartbeat for {ctx.employee_id} via {ctx.model}",
            result={"trigger": ctx.trigger_detail},
        )
