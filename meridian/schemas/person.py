from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PersonCreate(BaseModel):
    """Human staff member — a first-class peer of AIEmployee in the org graph."""

    name: str = Field(min_length=1)
    email: str | None = None
    role: str | None = None
    unit_id: str | None = None
    reports_to: str | None = None  # person id


class PersonRead(BaseModel):
    id: str
    name: str
    email: str | None = None
    role: str | None = None
    unit_id: str | None = None
    reports_to: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
