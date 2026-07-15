from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .routers import agents, auth, business_units, enterprise, governance, intelligence, outcomes, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(title="Onyx Meridian API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/healthz")
async def healthz():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(enterprise.router)
app.include_router(business_units.router)
app.include_router(agents.router)
app.include_router(tasks.router)
app.include_router(intelligence.router)
app.include_router(governance.router)
app.include_router(outcomes.router)
