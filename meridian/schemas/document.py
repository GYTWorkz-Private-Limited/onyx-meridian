from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from ..domain.enums import DocumentKind


class DocumentCreate(BaseModel):
    """A captured artifact (meeting transcript, email, PDF, ...) + provenance.

    Commitments extracted from a Document carry its id as their source, so every
    task traces back to where it came from.
    """

    unit_id: str | None = None
    kind: DocumentKind = DocumentKind.NOTE
    title: str = Field(min_length=1)
    content: str | None = None        # raw text (e.g. a transcript)
    uri: str | None = None            # external location, if any
    source_ref: str | None = None     # id in the system of record
    provenance: dict[str, Any] = Field(default_factory=dict)


class DocumentRead(BaseModel):
    id: str
    unit_id: str | None = None
    kind: DocumentKind
    title: str
    content: str | None = None
    uri: str | None = None
    source_ref: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
