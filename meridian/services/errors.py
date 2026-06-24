"""Domain-level errors. The API layer maps these to HTTP status codes in one
place (see ``meridian.main``), so services stay transport-agnostic."""


class NotFoundError(Exception):
    """Requested entity does not exist."""


class ConflictError(Exception):
    """Operation conflicts with current state (maps to HTTP 409)."""


class UnauthorizedError(Exception):
    """Credential missing, invalid, or revoked (maps to HTTP 401)."""
