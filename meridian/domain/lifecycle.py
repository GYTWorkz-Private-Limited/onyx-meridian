"""The AI-Employee lifecycle state machine.

This is the heart of the spine. Every status change goes through here, so the
legal transitions live in exactly one place and the rest of the system (services,
policy engine, audit) can reason about them uniformly.

    INSTANTIATE -> CONFIGURE -> DEPLOY -> MANAGE -> DECOMMISSION
       (draft)    (configured)  (deployed) (deployed)  (retired)

"Manage" is not a state — it is the set of in-place operations on a DEPLOYED
employee (suspend/resume, promote/demote autonomy, re-configure with a version
bump). DECOMMISSION (retired) is terminal.
"""

from __future__ import annotations

from .enums import AUTONOMY_LADDER, AutonomyLevel, EmployeeStatus


class LifecycleError(ValueError):
    """Raised when an illegal lifecycle transition is attempted."""


# Legal status transitions. A re-configure (configured -> configured) and a
# re-deploy of a suspended employee are both expressed here.
ALLOWED_TRANSITIONS: dict[EmployeeStatus, set[EmployeeStatus]] = {
    EmployeeStatus.DRAFT: {EmployeeStatus.CONFIGURED, EmployeeStatus.RETIRED},
    EmployeeStatus.CONFIGURED: {
        EmployeeStatus.CONFIGURED,  # re-configure, new version
        EmployeeStatus.DEPLOYED,
        EmployeeStatus.RETIRED,
    },
    EmployeeStatus.DEPLOYED: {
        EmployeeStatus.SUSPENDED,
        EmployeeStatus.RETIRED,
    },
    EmployeeStatus.SUSPENDED: {
        EmployeeStatus.DEPLOYED,  # resume
        EmployeeStatus.RETIRED,
    },
    EmployeeStatus.RETIRED: set(),  # terminal
}

# Statuses in which the employee is "live" and may run / accrue cost.
LIVE_STATUSES: set[EmployeeStatus] = {EmployeeStatus.DEPLOYED}

# Statuses from which an employee may be decommissioned.
DECOMMISSIONABLE: set[EmployeeStatus] = {
    EmployeeStatus.DRAFT,
    EmployeeStatus.CONFIGURED,
    EmployeeStatus.DEPLOYED,
    EmployeeStatus.SUSPENDED,
}


def can_transition(current: EmployeeStatus, target: EmployeeStatus) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, set())


def assert_transition(current: EmployeeStatus, target: EmployeeStatus) -> None:
    if not can_transition(current, target):
        allowed = sorted(s.value for s in ALLOWED_TRANSITIONS.get(current, set()))
        raise LifecycleError(
            f"illegal transition {current.value} -> {target.value}; "
            f"allowed from {current.value}: {allowed or ['(terminal)']}"
        )


def assert_decommissionable(current: EmployeeStatus) -> None:
    if current not in DECOMMISSIONABLE:
        raise LifecycleError(f"cannot decommission an employee in status {current.value}")


def next_autonomy(level: AutonomyLevel) -> AutonomyLevel:
    """The next rung up the autonomy ladder."""
    i = AUTONOMY_LADDER.index(level)
    if i >= len(AUTONOMY_LADDER) - 1:
        raise LifecycleError(f"{level.value} is already the top autonomy level")
    return AUTONOMY_LADDER[i + 1]


def prev_autonomy(level: AutonomyLevel) -> AutonomyLevel:
    """The next rung down the autonomy ladder."""
    i = AUTONOMY_LADDER.index(level)
    if i <= 0:
        raise LifecycleError(f"{level.value} is already the lowest autonomy level")
    return AUTONOMY_LADDER[i - 1]
