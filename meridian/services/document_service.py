"""Document registry — captured artifacts + provenance (commitment sources)."""

from __future__ import annotations

from typing import Any

from ..schemas.common import utcnow
from ..schemas.document import DocumentCreate
from .errors import NotFoundError
from .store import DOCUMENTS, get_store


async def create_document(payload: DocumentCreate) -> dict[str, Any]:
    doc = {**payload.model_dump(), "created_at": utcnow()}
    return await get_store().insert(DOCUMENTS, doc)


async def get_document(document_id: str) -> dict[str, Any]:
    found = await get_store().get(DOCUMENTS, document_id)
    if not found:
        raise NotFoundError(f"document {document_id} not found")
    return found


async def list_documents(
    *, unit_id: str | None = None, skip: int = 0, limit: int = 100
) -> list[dict[str, Any]]:
    filters = {"unit_id": unit_id} if unit_id else None
    return await get_store().list(DOCUMENTS, filters, skip=skip, limit=limit, sort=("created_at", -1))
