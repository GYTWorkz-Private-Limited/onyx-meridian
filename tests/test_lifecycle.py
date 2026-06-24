"""Unit tests for the lifecycle state machine (no I/O)."""

import pytest

from meridian.domain import lifecycle
from meridian.domain.enums import AutonomyLevel, EmployeeStatus
from meridian.domain.lifecycle import LifecycleError

S = EmployeeStatus
A = AutonomyLevel


def test_happy_path_transitions_are_legal():
    assert lifecycle.can_transition(S.DRAFT, S.CONFIGURED)
    assert lifecycle.can_transition(S.CONFIGURED, S.DEPLOYED)
    assert lifecycle.can_transition(S.DEPLOYED, S.SUSPENDED)
    assert lifecycle.can_transition(S.SUSPENDED, S.DEPLOYED)
    assert lifecycle.can_transition(S.DEPLOYED, S.RETIRED)


def test_reconfigure_allowed_decommission_terminal():
    assert lifecycle.can_transition(S.CONFIGURED, S.CONFIGURED)  # re-config, version bump
    assert not lifecycle.can_transition(S.RETIRED, S.DEPLOYED)   # retired is terminal
    assert not lifecycle.can_transition(S.RETIRED, S.CONFIGURED)


def test_cannot_deploy_a_draft():
    assert not lifecycle.can_transition(S.DRAFT, S.DEPLOYED)
    with pytest.raises(LifecycleError):
        lifecycle.assert_transition(S.DRAFT, S.DEPLOYED)


def test_cannot_configure_a_deployed_employee():
    # a live principal must be suspended before its grants can change
    assert not lifecycle.can_transition(S.DEPLOYED, S.CONFIGURED)


def test_decommissionable_set():
    for s in (S.DRAFT, S.CONFIGURED, S.DEPLOYED, S.SUSPENDED):
        lifecycle.assert_decommissionable(s)  # no raise
    with pytest.raises(LifecycleError):
        lifecycle.assert_decommissionable(S.RETIRED)


def test_autonomy_ladder():
    assert lifecycle.next_autonomy(A.SHADOW) == A.ASSIST
    assert lifecycle.next_autonomy(A.ASSIST) == A.SUPERVISED
    assert lifecycle.next_autonomy(A.SUPERVISED) == A.AUTONOMOUS
    assert lifecycle.prev_autonomy(A.AUTONOMOUS) == A.SUPERVISED
    with pytest.raises(LifecycleError):
        lifecycle.next_autonomy(A.AUTONOMOUS)
    with pytest.raises(LifecycleError):
        lifecycle.prev_autonomy(A.SHADOW)
