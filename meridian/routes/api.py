from fastapi import APIRouter

from .approvals import router as approvals_router
from .archetypes import router as archetypes_router
from .audit import router as audit_router
from .connectors import router as connectors_router
from .documents import router as documents_router
from .employees import router as employees_router
from .events import router as events_router
from .health import router as health_router
from .identity import router as identity_router
from .ingest import router as ingest_router
from .persons import router as persons_router
from .projects import router as projects_router
from .runs import router as runs_router
from .tasks import router as tasks_router
from .units import router as units_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(units_router)
api_router.include_router(archetypes_router)
api_router.include_router(employees_router)
api_router.include_router(runs_router)
api_router.include_router(approvals_router)
api_router.include_router(audit_router)
api_router.include_router(identity_router)
# Canonical model + Action/Task Registry (the wedge)
api_router.include_router(persons_router)
api_router.include_router(documents_router)
api_router.include_router(projects_router)
api_router.include_router(tasks_router)
api_router.include_router(events_router)
api_router.include_router(ingest_router)
# Connectors — the integration repository (pull/push across platforms by domain)
api_router.include_router(connectors_router)
