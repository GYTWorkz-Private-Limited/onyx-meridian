"""Policy Engine (the Vault accelerator, L4 Governance).

Pure, side-effect-free authorization logic. "No action without a Policy Engine
check" (design principle 7). Two checks matter for the lifecycle spine:

1. **Least-privilege configuration** — you cannot grant an employee a scope you
   cannot yourself delegate, and a scope cannot be both granted and denied.
2. **Governed deployment** — an employee can only deploy into an *onboarded*
   (active) unit, and only from a `configured` state with a caretaker assigned.

Keeping this module I/O-free means it is trivially testable and can run inline
on every transition without a network hop.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..domain.enums import EmployeeStatus, UnitStatus


@dataclass
class PolicyVerdict:
    allowed: bool
    reasons: list[str] = field(default_factory=list)

    @classmethod
    def ok(cls) -> PolicyVerdict:
        return cls(allowed=True)

    @classmethod
    def deny(cls, *reasons: str) -> PolicyVerdict:
        return cls(allowed=False, reasons=list(reasons))


class PolicyDenied(Exception):
    """Raised by services when a PolicyVerdict denies an action."""

    def __init__(self, verdict: PolicyVerdict):
        self.verdict = verdict
        super().__init__("; ".join(verdict.reasons) or "policy denied")


def authorize_configuration(
    *,
    requested_data_scopes: list[str],
    requested_action_scopes: list[str],
    deny_scopes: list[str],
    grantable_scopes: list[str],
) -> PolicyVerdict:
    """Validate a configuration grant against least-privilege.

    ``grantable_scopes`` is what the configuring principal (e.g. the unit's
    allowed catalog) is permitted to hand out. Supports a trailing ``*`` wildcard
    (``sales.*`` grants ``sales.quotes``).
    """
    reasons: list[str] = []
    requested = list(requested_data_scopes) + list(requested_action_scopes)

    for scope in requested:
        if not _scope_covered(scope, grantable_scopes):
            reasons.append(
                f"scope '{scope}' is not delegatable here "
                f"(grantable: {sorted(grantable_scopes) or ['none']})"
            )

    overlap = sorted(set(requested) & set(deny_scopes))
    for scope in overlap:
        reasons.append(f"scope '{scope}' is both granted and on the deny-list")

    return PolicyVerdict.ok() if not reasons else PolicyVerdict(False, reasons)


def authorize_deploy(
    *,
    employee_status: EmployeeStatus,
    unit_status: UnitStatus,
    has_caretaker: bool,
) -> PolicyVerdict:
    """Governed deploy gate (state-machine legality is checked separately)."""
    reasons: list[str] = []
    if unit_status != UnitStatus.ACTIVE:
        reasons.append(
            f"unit must be onboarded (active) to deploy into it; it is '{unit_status.value}'"
        )
    if employee_status != EmployeeStatus.CONFIGURED:
        reasons.append(
            f"only a 'configured' employee can deploy; it is '{employee_status.value}'"
        )
    if not has_caretaker:
        reasons.append("a human caretaker must be assigned before deploy (accountability)")
    return PolicyVerdict.ok() if not reasons else PolicyVerdict(False, reasons)


def _scope_covered(scope: str, catalog: list[str]) -> bool:
    for grant in catalog:
        if grant == "*" or grant == scope:
            return True
        if grant.endswith(".*") and scope.startswith(grant[:-1]):
            return True
    return False
