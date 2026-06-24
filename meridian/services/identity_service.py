"""Agent Identity & Access (Vault, L4 Governance).

Each deployed AI employee is a first-class principal with its own scoped
credential. The plaintext token is returned exactly once (at issue/rotate); only
a peppered hash is stored. Decommission revokes the credential, so "revoke the
identity and access is gone" holds.

The principal id IS the employee's ``principal_id`` (stored as the doc ``_id``),
so attribution is a single value across runs, audit, and the registry.
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from ..config.settings import get_settings
from ..governance import identity
from ..schemas.common import utcnow
from .errors import NotFoundError, UnauthorizedError
from .store import PRINCIPALS, get_store


def _scopes_of(employee: dict[str, Any]) -> list[str]:
    perms = employee.get("permissions", {}) or {}
    return list(perms.get("data_scopes", [])) + list(perms.get("action_scopes", []))


async def _active_principal(employee_id: str) -> dict[str, Any] | None:
    rows = await get_store().list(
        PRINCIPALS, {"employee_id": employee_id, "status": "active"}, limit=1
    )
    return rows[0] if rows else None


async def issue_for_employee(employee: dict[str, Any]) -> dict[str, Any]:
    """Mint a fresh credential for an employee (revoking any prior active one).

    Returns the principal doc with a transient ``token`` (the one-time plaintext).
    """
    await revoke(employee["id"])  # at most one active credential per employee

    token = identity.generate_token()
    pepper = get_settings().credential_pepper
    pid = f"prin_{uuid4().hex[:12]}"
    now = utcnow()
    doc = {
        "_id": pid,
        "employee_id": employee["id"],
        "unit_id": employee["unit_id"],
        "scopes": _scopes_of(employee),
        "token_hash": identity.hash_token(token, pepper),
        "token_prefix": identity.token_fingerprint(token),
        "status": "active",
        "issued_at": now,
        "rotated_at": None,
        "revoked_at": None,
        "last_used_at": None,
    }
    created = await get_store().insert(PRINCIPALS, doc)
    created["token"] = token  # transient — never persisted
    return created


async def rotate(employee_id: str) -> dict[str, Any]:
    """Issue a new secret for the active principal; returns the one-time token."""
    principal = await _active_principal(employee_id)
    if not principal:
        raise NotFoundError(f"no active credential for employee {employee_id}")
    token = identity.generate_token()
    pepper = get_settings().credential_pepper
    await get_store().update(
        PRINCIPALS,
        principal["id"],
        {
            "token_hash": identity.hash_token(token, pepper),
            "token_prefix": identity.token_fingerprint(token),
            "rotated_at": utcnow(),
        },
    )
    return {
        "principal_id": principal["id"],
        "token": token,
        "token_prefix": identity.token_fingerprint(token),
    }


async def revoke(employee_id: str) -> bool:
    """Revoke the employee's active credential, if any."""
    principal = await _active_principal(employee_id)
    if not principal:
        return False
    await get_store().update(
        PRINCIPALS, principal["id"], {"status": "revoked", "revoked_at": utcnow()}
    )
    return True


async def get_credential(employee_id: str) -> dict[str, Any]:
    """Active credential metadata (no secret)."""
    principal = await _active_principal(employee_id)
    if not principal:
        raise NotFoundError(f"no active credential for employee {employee_id}")
    return {
        "principal_id": principal["id"],
        "employee_id": principal["employee_id"],
        "unit_id": principal["unit_id"],
        "scopes": principal.get("scopes", []),
        "status": principal["status"],
        "token_prefix": principal.get("token_prefix"),
        "issued_at": principal.get("issued_at"),
        "rotated_at": principal.get("rotated_at"),
        "last_used_at": principal.get("last_used_at"),
    }


async def verify(token: str) -> dict[str, Any]:
    """Authenticate a bearer token. Returns the principal claims or raises 401."""
    if not token:
        raise UnauthorizedError("missing credential")
    pepper = get_settings().credential_pepper
    token_hash = identity.hash_token(token, pepper)
    rows = await get_store().list(
        PRINCIPALS, {"token_hash": token_hash, "status": "active"}, limit=1
    )
    if not rows:
        raise UnauthorizedError("invalid or revoked credential")
    principal = rows[0]
    await get_store().update(PRINCIPALS, principal["id"], {"last_used_at": utcnow()})
    return {
        "principal_id": principal["id"],
        "employee_id": principal["employee_id"],
        "unit_id": principal["unit_id"],
        "scopes": principal.get("scopes", []),
    }
