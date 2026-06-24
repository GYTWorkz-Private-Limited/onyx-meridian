"""The commitment (task) lifecycle state machine.

Mirrors ``domain.lifecycle`` (the employee one): legal transitions in one place,
so the registry can't invent illegal states.

    OPEN ─▶ IN_PROGRESS ─▶ DONE
      │  ╲      │  ╲▲
      │   ▶ BLOCKED       (re-open from BLOCKED)
      ▼                   MISSED is set by the escalation sweep (past due, not done)
    CANCELLED (terminal)  and can be re-opened or cancelled
"""

from __future__ import annotations

from .enums import TaskStatus

S = TaskStatus

ALLOWED_TASK_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    S.OPEN: {S.IN_PROGRESS, S.BLOCKED, S.DONE, S.CANCELLED, S.MISSED},
    S.IN_PROGRESS: {S.BLOCKED, S.DONE, S.CANCELLED, S.MISSED},
    S.BLOCKED: {S.IN_PROGRESS, S.DONE, S.CANCELLED, S.MISSED},
    S.MISSED: {S.IN_PROGRESS, S.DONE, S.CANCELLED},
    S.DONE: set(),        # terminal
    S.CANCELLED: set(),   # terminal
}

#: statuses that count as "still owed" (open work)
OPEN_STATUSES: set[TaskStatus] = {S.OPEN, S.IN_PROGRESS, S.BLOCKED, S.MISSED}
#: statuses past which escalation no longer applies
CLOSED_STATUSES: set[TaskStatus] = {S.DONE, S.CANCELLED}


class TaskLifecycleError(ValueError):
    """Raised on an illegal task transition."""


def can_transition(current: TaskStatus, target: TaskStatus) -> bool:
    return target in ALLOWED_TASK_TRANSITIONS.get(current, set())


def assert_transition(current: TaskStatus, target: TaskStatus) -> None:
    if not can_transition(current, target):
        allowed = sorted(s.value for s in ALLOWED_TASK_TRANSITIONS.get(current, set()))
        raise TaskLifecycleError(
            f"illegal task transition {current.value} -> {target.value}; "
            f"allowed from {current.value}: {allowed or ['(terminal)']}"
        )
