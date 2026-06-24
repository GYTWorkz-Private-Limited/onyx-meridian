from fastapi import APIRouter, Query

from ..schemas.document import DocumentCreate, DocumentRead
from ..services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentRead, status_code=201)
async def create_document(payload: DocumentCreate):
    return await document_service.create_document(payload)


@router.get("", response_model=list[DocumentRead])
async def list_documents(
    unit_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    return await document_service.list_documents(unit_id=unit_id, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(document_id: str):
    return await document_service.get_document(document_id)
