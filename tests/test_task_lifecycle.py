"""Unit tests for the task (commitment) lifecycle state machine."""

import pytest

from meridian.domain.enums import TaskStatus
from meridian.domain.task_lifecycle import TaskLifecycleError, assert_transition, can_transition

S = TaskStatus


def test_open_path():
    assert can_transition(S.OPEN, S.IN_PROGRESS)
    assert can_transition(S.IN_PROGRESS, S.DONE)
    assert can_transition(S.OPEN, S.BLOCKED)
    assert can_transition(S.BLOCKED, S.IN_PROGRESS)


def test_terminal_states():
    assert not can_transition(S.DONE, S.IN_PROGRESS)
    assert not can_transition(S.CANCELLED, S.OPEN)
    with pytest.raises(TaskLifecycleError):
        assert_transition(S.DONE, S.OPEN)


def test_missed_can_reopen():
    assert can_transition(S.MISSED, S.IN_PROGRESS)
    assert can_transition(S.MISSED, S.DONE)
    assert can_transition(S.OPEN, S.MISSED)
