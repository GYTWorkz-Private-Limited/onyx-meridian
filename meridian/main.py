"""Onyx Meridian API — application entrypoint.

Follows the onyx family pattern (see onyxos/main.py): a lifespan-managed FastAPI
app with CORS and a single aggregate router. On startup it selects the persistence
backend (Mongo when configured, else in-memory) and registers built-in adapters.
Domain errors are mapped to HTTP status codes in one place.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .config.settings import get_settings
from .connectors.loader import load_catalog
from .domain.lifecycle import LifecycleError
from .domain.task_lifecycle import TaskLifecycleError
from .governance.policy import PolicyDenied
from .routes.api import api_router
from .services.errors import ConflictError, NotFoundError, UnauthorizedError
from .services.store import get_store, init_store

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pick a backend (Mongo if configured, else in-memory) and verify it.
    store = init_store(settings.mongo_db_url)
    try:
        await store.ping()
    except Exception as exc:  # pragma: no cover - only on a broken Mongo
        raise RuntimeError(f"failed to reach persistence backend: {exc}") from exc
    # Load the connector repository (best-effort; a broken connector is skipped).
    load_catalog()
    await _ensure_indexes()
    yield
    # Shutdown
    await get_store().close()


async def _ensure_indexes() -> None:
    """Best-effort index creation. No-op for the in-memory backend."""
    store = get_store()
    db = getattr(store, "_db", None)
    if db is None:
        return
    await db["employees"].create_index("unit_id")
    await db["employees"].create_index("status")
    await db["runs"].create_index("employee_id")
    await db["approvals"].create_index([("unit_id", 1), ("status", 1)])
    await db["audit_ledger"].create_index([("unit_id", 1), ("created_at", -1)])
    await db["archetypes"].create_index("key", unique=True)
    await db["tasks"].create_index([("unit_id", 1), ("status", 1)])
    await db["tasks"].create_index("project_id")
    await db["tasks"].create_index("due")
    await db["events"].create_index([("unit_id", 1), ("created_at", -1)])
    await db["persons"].create_index("unit_id")
    await db["principals"].create_index("token_hash")
    await db["principals"].create_index([("employee_id", 1), ("status", 1)])
    await db["connections"].create_index([("unit_id", 1), ("platform", 1)])


app = FastAPI(title=settings.app_name, version=__version__, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Domain error -> HTTP status mapping (one place)
# --------------------------------------------------------------------------- #
@app.exception_handler(NotFoundError)
async def _not_found(_: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def _conflict(_: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(UnauthorizedError)
async def _unauthorized(_: Request, exc: UnauthorizedError):
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(LifecycleError)
async def _lifecycle(_: Request, exc: LifecycleError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(TaskLifecycleError)
async def _task_lifecycle(_: Request, exc: TaskLifecycleError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(PolicyDenied)
async def _policy_denied(_: Request, exc: PolicyDenied):
    return JSONResponse(
        status_code=403,
        content={"detail": str(exc), "reasons": exc.verdict.reasons},
    )


app.include_router(api_router)


@app.get("/", tags=["health"])
async def root():
    return {"service": settings.app_name, "version": __version__, "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("meridian.main:app", host=settings.host, port=settings.port, reload=settings.debug)
