from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db import pool

router = APIRouter(prefix="/api/auth", tags=["auth"])

LOGIN_QUERY = """
select
  u.id as user_id,
  u.username,
  u.password,
  p.id as person_id,
  p.name,
  p.title,
  p.email,
  p.role_tier,
  bu.id as bu_id,
  bu.slug as bu_slug,
  bu.name as bu_name,
  d.id as dept_id,
  d.slug as dept_slug,
  d.name as dept_name
from users u
join people p on p.id = u.person_id
left join business_units bu on bu.id = p.business_unit_id
left join departments d on d.id = p.department_id
where u.username = $1
"""


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(body: LoginRequest):
    row = await pool().fetchrow(LOGIN_QUERY, body.username.strip().lower())

    # Mock/dev-only auth: plaintext password comparison against the seeded
    # `users` table. No sessions/JWTs — the frontend just holds the returned
    # profile client-side, matching the rest of this app's mock-data scope.
    if row is None or row["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "id": str(row["person_id"]),
        "username": row["username"],
        "name": row["name"],
        "title": row["title"],
        "email": row["email"],
        "roleTier": row["role_tier"],
        "businessUnit": (
            {"id": str(row["bu_id"]), "slug": row["bu_slug"], "name": row["bu_name"]}
            if row["bu_id"]
            else None
        ),
        "department": (
            {"id": str(row["dept_id"]), "slug": row["dept_slug"], "name": row["dept_name"]}
            if row["dept_id"]
            else None
        ),
    }
