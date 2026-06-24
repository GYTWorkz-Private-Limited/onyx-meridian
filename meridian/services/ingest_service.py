"""Meeting intelligence — transcript -> extracted commitments (Phase 1, slice).

Demonstrates the path the framework centers on: capture a transcript as a
Document, extract commitments as typed proposals, and write them into the Task
Registry with provenance back to the source sentence.

The extractor is pluggable. The default ``HeuristicExtractor`` is deterministic
(no LLM) so the path runs in tests and offline; the real build registers an
AI-Agent extractor that returns the same ``ExtractedCommitment`` proposals.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Protocol

from ..domain.enums import DocumentKind, OwnerType, SourceType
from ..schemas.document import DocumentCreate
from ..schemas.task import Owner, Source, TaskCreate
from . import document_service, person_service, task_service


@dataclass
class ExtractedCommitment:
    title: str
    quote: str
    owner_name: str | None = None
    due_text: str | None = None


class Extractor(Protocol):
    def extract(self, text: str) -> list[ExtractedCommitment]: ...


class HeuristicExtractor:
    """Finds '<Name> will/to <action> [by <when>]' commitments in a transcript."""

    _SENTENCE = re.compile(r"[.\n!?]+")
    _PATTERN = re.compile(
        r"\b(?P<name>[A-Z][a-zA-Z]+)\s+(?:will|shall|to|should|needs to|must)\s+(?P<action>.+)"
    )

    def extract(self, text: str) -> list[ExtractedCommitment]:
        out: list[ExtractedCommitment] = []
        for raw in self._SENTENCE.split(text or ""):
            sentence = raw.strip()
            if not sentence:
                continue
            m = self._PATTERN.search(sentence)
            if not m:
                continue
            action = m.group("action").strip()
            due_text = None
            by = re.search(r"\bby\s+(.+)$", action)
            if by:
                due_text = by.group(1).strip()
                action = action[: by.start()].strip()
            out.append(
                ExtractedCommitment(
                    title=action,
                    quote=sentence,
                    owner_name=m.group("name"),
                    due_text=due_text,
                )
            )
        return out


_extractor: Extractor = HeuristicExtractor()


def set_extractor(extractor: Extractor) -> None:
    """Swap the extractor (e.g. for an LLM-backed one)."""
    global _extractor
    _extractor = extractor


@dataclass
class IngestResult:
    document: dict[str, Any]
    tasks: list[dict[str, Any]] = field(default_factory=list)
    unresolved_owners: list[str] = field(default_factory=list)


async def ingest_transcript(
    *, unit_id: str, title: str, content: str, created_by: str | None = None
) -> IngestResult:
    document = await document_service.create_document(
        DocumentCreate(unit_id=unit_id, kind=DocumentKind.MEETING, title=title, content=content)
    )

    people = await person_service.list_persons(unit_id=unit_id, limit=500)
    proposals = _extractor.extract(content)

    tasks: list[dict[str, Any]] = []
    unresolved: list[str] = []
    for p in proposals:
        owner = _resolve_owner(p.owner_name, people)
        if p.owner_name and owner is None:
            unresolved.append(p.owner_name)
        description = f"(due: {p.due_text})" if p.due_text else None
        task = await task_service.create_task(
            TaskCreate(
                unit_id=unit_id,
                title=p.title,
                description=description,
                owner=owner,
                source=Source(type=SourceType.MEETING, doc_id=document["id"], quote=p.quote),
                created_by=created_by,
            )
        )
        tasks.append(task)

    return IngestResult(document=document, tasks=tasks, unresolved_owners=unresolved)


def _resolve_owner(name: str | None, people: list[dict[str, Any]]) -> Owner | None:
    if not name:
        return None
    needle = name.lower()
    for person in people:
        tokens = {t.lower() for t in (person.get("name") or "").split()}
        if needle in tokens:
            return Owner(type=OwnerType.PERSON, id=person["id"])
    return None
