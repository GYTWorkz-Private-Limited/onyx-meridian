from fastapi import APIRouter

from ..schemas.ingest import IngestResponse, TranscriptIngest
from ..services import ingest_service

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/transcript", response_model=IngestResponse, status_code=201)
async def ingest_transcript(payload: TranscriptIngest):
    """Capture a meeting transcript and extract commitments into the registry.

    Returns the stored Document plus the Tasks created from it (each carrying
    provenance back to the source sentence).
    """
    result = await ingest_service.ingest_transcript(
        unit_id=payload.unit_id,
        title=payload.title,
        content=payload.content,
        created_by=payload.created_by,
    )
    return {
        "document": result.document,
        "tasks": result.tasks,
        "unresolved_owners": result.unresolved_owners,
    }
