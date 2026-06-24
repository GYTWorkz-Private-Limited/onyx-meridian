from fastapi import APIRouter

from ..adapters import known_adapter_types
from ..config.settings import get_settings
from ..services.store import get_store

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    settings = get_settings()
    backend = type(get_store()).__name__
    ok = True
    detail = "ok"
    try:
        await get_store().ping()
    except Exception as exc:  # pragma: no cover - only on a broken Mongo
        ok = False
        detail = str(exc)
    return {
        "status": "ok" if ok else "degraded",
        "app": settings.app_name,
        "store": backend,
        "adapters": known_adapter_types(),
        "detail": detail,
    }
