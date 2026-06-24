from fastapi import APIRouter
from pydantic import BaseModel

from ..services import identity_service

router = APIRouter(prefix="/identity", tags=["identity"])


class VerifyRequest(BaseModel):
    token: str


@router.post("/verify")
async def verify(body: VerifyRequest):
    """Authenticate an agent-principal bearer token.

    Returns the principal claims (employee_id, unit_id, scopes) for a valid,
    active credential, or 401 otherwise. This is the check the agent runtime /
    model gateway makes before acting on an employee's behalf.
    """
    claims = await identity_service.verify(body.token)
    return {"valid": True, **claims}
