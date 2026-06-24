"""Agent identity primitives (Vault, L4) — pure, stdlib only.

Every AI employee is a first-class principal with its own credential, not a shared
key (FRAMEWORK/06). A credential is a high-entropy bearer token; we store only its
salted hash, so the plaintext is shown exactly once at issue/rotate time. Because
tokens are high-entropy, a peppered SHA-256 is sufficient (bcrypt is for
low-entropy passwords).
"""

from __future__ import annotations

import hashlib
import hmac
import secrets

TOKEN_PREFIX = "omk"  # onyx-meridian key


def generate_token() -> str:
    """A fresh bearer token: ``omk_<43 url-safe chars>``."""
    return f"{TOKEN_PREFIX}_{secrets.token_urlsafe(32)}"


def hash_token(token: str, pepper: str) -> str:
    """Deterministic, peppered hash of a token for storage/lookup."""
    return hmac.new(pepper.encode(), token.encode(), hashlib.sha256).hexdigest()


def token_fingerprint(token: str) -> str:
    """A non-secret prefix safe to display (e.g. ``omk_3f9a…``)."""
    return token[:12] + "…"


def verify_token(token: str, token_hash: str, pepper: str) -> bool:
    """Constant-time comparison of a presented token against a stored hash."""
    return hmac.compare_digest(hash_token(token, pepper), token_hash)
