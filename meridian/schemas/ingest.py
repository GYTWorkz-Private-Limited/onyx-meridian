from __future__ import annotations

from pydantic import BaseModel, Field

from .document import DocumentRead
from .task import TaskRead


class TranscriptIngest(BaseModel):
    unit_id: str
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    created_by: str | None = None


class IngestResponse(BaseModel):
    document: DocumentRead
    tasks: list[TaskRead]
    unresolved_owners: list[str] = Field(default_factory=list)
