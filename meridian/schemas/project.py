from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from ..domain.enums import ProjectStatus


class ProjectCreate(BaseModel):
    """An initiative spanning tasks / people / units."""

    unit_id: str
    name: str = Field(min_length=1)
    description: str | None = None
    lead_id: str | None = None  # person or ai_employee id


class ProjectRead(BaseModel):
    id: str
    unit_id: str
    name: str
    description: str | None = None
    lead_id: str | None = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    created_at: datetime | None = None
    updated_at: datetime | None = None
