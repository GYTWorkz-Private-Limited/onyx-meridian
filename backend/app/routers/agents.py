from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import mock_store as store

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("/summary")
async def summary():
    return store.agents_summary


@router.get("")
async def list_agents():
    return store.agents


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    detail = store.agent_details.get(agent_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Not found")
    return detail


class AgentPatch(BaseModel):
    status: str | None = None
    autonomyLevel: str | None = None


@router.patch("/{agent_id}")
async def patch_agent(agent_id: str, body: AgentPatch):
    agent = next((a for a in store.agents if a["id"] == agent_id), None)
    if agent is None:
        raise HTTPException(status_code=404, detail="Not found")
    if body.status is not None:
        agent["status"] = body.status
    if body.autonomyLevel is not None:
        agent["autonomyLevel"] = body.autonomyLevel
    return agent
