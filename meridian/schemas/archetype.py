from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from ..domain.enums import Tier


class ArchetypeCreate(BaseModel):
    """A reusable job template an employee can be instantiated from.

    e.g. ``sales.quote_drafter``, ``ops.meeting_scribe``. The defaults here seed
    the employee's configuration; they can be overridden at configure time.
    """

    key: str = Field(min_length=3, description="e.g. 'ops.meeting_scribe'")
    display_name: str
    description: str | None = None
    tier: Tier = Tier.T1_EXECUTION
    default_capabilities: list[str] = Field(default_factory=list)
    default_data_scopes: list[str] = Field(default_factory=list)
    default_action_scopes: list[str] = Field(default_factory=list)
    default_kpis: list[str] = Field(default_factory=list)
    default_adapter_type: str = "echo"
    default_adapter_config: dict[str, Any] = Field(default_factory=dict)


class ArchetypeRead(BaseModel):
    id: str
    key: str
    display_name: str
    description: str | None = None
    tier: Tier
    default_capabilities: list[str] = Field(default_factory=list)
    default_data_scopes: list[str] = Field(default_factory=list)
    default_action_scopes: list[str] = Field(default_factory=list)
    default_kpis: list[str] = Field(default_factory=list)
    default_adapter_type: str = "echo"
    default_adapter_config: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
