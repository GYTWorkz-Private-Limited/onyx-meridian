"""Model Gateway (Vault accelerator).

Every employee model call is *meant* to route through one gateway so models are
swappable, budgeted, and on-prem-first (design principle 8). This module is the
client + the cost meter. The full build proxies LiteLLM; here we provide:

- model routing per an employee's model policy (preferred/allowed), and
- a small pricing table to turn token usage into a cost (the "cost meter" half
  of the effectiveness/cost thesis).

It is deliberately pure so the lifecycle + monitoring slice runs with no network.
"""

from __future__ import annotations

from dataclasses import dataclass

# USD per 1M tokens (input, output). Indicative; the real gateway reads these
# from the provider catalog. "internal/*" is the on-prem-first default.
_PRICING: dict[str, tuple[float, float]] = {
    "internal/onyx-llm": (0.0, 0.0),      # on-prem, no per-token charge
    "azure/gpt-4o": (2.50, 10.00),
    "openai/gpt-4o": (2.50, 10.00),
    "anthropic/claude-opus": (15.00, 75.00),
    "anthropic/claude-sonnet": (3.00, 15.00),
}
_FALLBACK_PRICE = (1.00, 3.00)


@dataclass
class ModelPolicy:
    preferred: str = "internal/onyx-llm"
    allowed: list[str] | None = None


@dataclass
class RoutingDecision:
    model: str
    reason: str


def route(policy: ModelPolicy, requested_model: str | None = None) -> RoutingDecision:
    """Pick the model to use for a call given an employee's policy.

    On-prem-first: honor an explicit request only if the policy allows it,
    otherwise fall back to the preferred (internal) model.
    """
    allowed = set(policy.allowed or [])
    allowed.add(policy.preferred)
    if requested_model and requested_model in allowed:
        return RoutingDecision(requested_model, "requested model permitted by policy")
    if requested_model:
        return RoutingDecision(
            policy.preferred,
            f"requested '{requested_model}' not in policy; routed to preferred",
        )
    return RoutingDecision(policy.preferred, "no model requested; routed to preferred")


def cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    """Cost of a call in USD, rounded to 6 dp (sub-cent precision)."""
    in_price, out_price = _PRICING.get(model, _FALLBACK_PRICE)
    cost = (input_tokens / 1_000_000) * in_price + (output_tokens / 1_000_000) * out_price
    return round(cost, 6)
