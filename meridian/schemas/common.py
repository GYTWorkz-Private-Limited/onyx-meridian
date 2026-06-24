from __future__ import annotations

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Timezone-aware UTC now. Used as the default for every timestamp."""
    return datetime.now(UTC)
