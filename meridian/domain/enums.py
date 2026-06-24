"""Canonical enums for the AI-Employee spine.

These encode the vocabulary from the framework design (FRAMEWORK/03-ai-employees.md
and 08-effectiveness-and-cost-control.md): the lifecycle states, the autonomy
ladder ("earned trust"), the capability tiers, and the three task execution modes.
"""

from enum import StrEnum


class EmployeeStatus(StrEnum):
    """Lifecycle states. See ``domain.lifecycle`` for the legal transitions.

    instantiate -> CONFIGURE -> DEPLOY -> MANAGE -> DECOMMISSION
       (draft)    (configured)  (deployed) (deployed)  (retired)
    """

    DRAFT = "draft"
    CONFIGURED = "configured"
    DEPLOYED = "deployed"
    SUSPENDED = "suspended"
    RETIRED = "retired"


class AutonomyLevel(StrEnum):
    """Progressive autonomy, per task type. Deployed employees start in SHADOW.

    Promotion is gated by Ensure evals; demotion happens on drift.
    """

    SHADOW = "shadow"          # L0 — observes, proposes nothing that commits
    ASSIST = "assist"          # L1 — proposes; human commits every action
    SUPERVISED = "supervised"  # L2 — acts; human spot-checks / can veto
    AUTONOMOUS = "autonomous"  # L3 — acts within policy + budget


# Ordered ladder used to validate single-step promote/demote moves.
AUTONOMY_LADDER: list[AutonomyLevel] = [
    AutonomyLevel.SHADOW,
    AutonomyLevel.ASSIST,
    AutonomyLevel.SUPERVISED,
    AutonomyLevel.AUTONOMOUS,
]


class Tier(StrEnum):
    """Capability tier (cognition kind), from the Fakhruddin brief."""

    T1_EXECUTION = "T1_execution"
    T2_OPTIMIZATION = "T2_optimization"
    T3_PLANNING = "T3_planning"
    T4_SUPERAGENT = "T4_superagent"


class ExecutionMode(StrEnum):
    """The three execution modes a task can be delegated to (the cost lever)."""

    DETERMINISTIC = "deterministic"        # no model — code path
    WORKFLOW_POLICY = "workflow_policy"    # policy query, no model
    AI_AGENT = "ai_agent"                  # model judgement


class UnitStatus(StrEnum):
    """A business unit / department. Employees may only deploy into ACTIVE units."""

    ONBOARDING = "onboarding"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class ApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalType(StrEnum):
    """HITL gates — 'AI proposes, a human commits'."""

    DEPLOY = "deploy"
    DECOMMISSION = "decommission"
    AUTONOMY_PROMOTE = "autonomy_promote"
    BUDGET_OVERRIDE = "budget_override"


class RunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Liveness(StrEnum):
    ALIVE = "alive"
    STALE = "stale"
    NEVER_RUN = "never_run"


# --------------------------------------------------------------------------- #
# Action / Task Registry (the wedge) — FRAMEWORK/05-organization-and-digital-twin.md
# --------------------------------------------------------------------------- #
class TaskStatus(StrEnum):
    """A commitment's lifecycle. MISSED is set by the escalation sweep when a
    task passes its due date without being done."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"
    MISSED = "missed"
    CANCELLED = "cancelled"


class TaskPriority(StrEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class OwnerType(StrEnum):
    """A commitment is owned by a human Person or an AIEmployee — peers in the
    org graph."""

    PERSON = "person"
    AI_EMPLOYEE = "ai_employee"


class SourceType(StrEnum):
    """Provenance — where a commitment came from."""

    MEETING = "meeting"
    EMAIL = "email"
    PDF = "pdf"
    CHAT = "chat"
    MANUAL = "manual"


class DocumentKind(StrEnum):
    MEETING = "meeting"
    EMAIL = "email"
    PDF = "pdf"
    CHAT = "chat"
    NOTE = "note"


class ProjectStatus(StrEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    DONE = "done"
    CANCELLED = "cancelled"


class EscalationPolicy(StrEnum):
    NONE = "none"
    NOTIFY_OWNER = "notify_owner"
    NOTIFY_CARETAKER = "notify_caretaker"
    REASSIGN = "reassign"
