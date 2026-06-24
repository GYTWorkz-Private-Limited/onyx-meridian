"""Persistence abstraction.

Two backends behind one tiny async repository interface:

- ``MongoStore`` — motor/MongoDB, matching the onyx family (onyxos uses the same
  Motor singleton pattern). Used when ``MONGO_DB_URL`` is set.
- ``InMemoryStore`` — a dict-backed store so the app boots and the test suite
  runs with no infrastructure at all.

Services depend only on the ``Store`` interface, never on a concrete backend.
Documents are plain dicts keyed by a string ``_id``; reads normalize ``_id`` to
``id`` so callers never see Mongo's underscore.
"""

from __future__ import annotations

import builtins
import copy
from typing import Any, Protocol
from uuid import uuid4


def new_id() -> str:
    return str(uuid4())


def _normalize(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out


class Store(Protocol):
    async def insert(self, collection: str, doc: dict[str, Any]) -> dict[str, Any]: ...
    async def get(self, collection: str, doc_id: str) -> dict[str, Any] | None: ...
    async def list(
        self,
        collection: str,
        filters: dict[str, Any] | None = None,
        *,
        skip: int = 0,
        limit: int = 100,
        sort: tuple[str, int] | None = None,
    ) -> builtins.list[dict[str, Any]]: ...
    async def update(
        self, collection: str, doc_id: str, updates: dict[str, Any]
    ) -> dict[str, Any] | None: ...
    async def delete(self, collection: str, doc_id: str) -> bool: ...
    async def count(
        self, collection: str, filters: dict[str, Any] | None = None
    ) -> int: ...
    async def ping(self) -> None: ...
    async def close(self) -> None: ...


def _matches(doc: dict[str, Any], filters: dict[str, Any]) -> bool:
    for key, want in filters.items():
        have = doc.get(key)
        if isinstance(want, dict) and "$in" in want:
            if have not in want["$in"]:
                return False
        elif have != want:
            return False
    return True


class InMemoryStore:
    """Dict-backed store. Not for production; ideal for dev + tests."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, dict[str, Any]]] = {}

    def _coll(self, collection: str) -> dict[str, dict[str, Any]]:
        return self._data.setdefault(collection, {})

    async def insert(self, collection: str, doc: dict[str, Any]) -> dict[str, Any]:
        doc = copy.deepcopy(doc)
        doc.setdefault("_id", new_id())
        self._coll(collection)[doc["_id"]] = doc
        return _normalize(doc)

    async def get(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        doc = self._coll(collection).get(doc_id)
        return _normalize(copy.deepcopy(doc)) if doc else None

    async def list(
        self,
        collection: str,
        filters: dict[str, Any] | None = None,
        *,
        skip: int = 0,
        limit: int = 100,
        sort: tuple[str, int] | None = None,
    ) -> builtins.list[dict[str, Any]]:
        rows = list(self._coll(collection).values())
        if filters:
            rows = [r for r in rows if _matches(r, filters)]
        if sort:
            field, direction = sort
            rows.sort(key=lambda r: (r.get(field) is None, r.get(field)), reverse=direction < 0)
        rows = rows[skip : skip + limit]
        return [_normalize(copy.deepcopy(r)) for r in rows]

    async def update(
        self, collection: str, doc_id: str, updates: dict[str, Any]
    ) -> dict[str, Any] | None:
        doc = self._coll(collection).get(doc_id)
        if not doc:
            return None
        doc.update(copy.deepcopy(updates))
        return _normalize(copy.deepcopy(doc))

    async def delete(self, collection: str, doc_id: str) -> bool:
        return self._coll(collection).pop(doc_id, None) is not None

    async def count(
        self, collection: str, filters: dict[str, Any] | None = None
    ) -> int:
        rows = list(self._coll(collection).values())
        if filters:
            rows = [r for r in rows if _matches(r, filters)]
        return len(rows)

    async def ping(self) -> None:
        return None

    async def close(self) -> None:
        return None


class MongoStore:
    """motor/MongoDB backend. motor is imported lazily so the in-memory path
    (dev + tests) never requires the driver to be installed/connected."""

    def __init__(self, mongo_db_url: str) -> None:
        from motor.motor_asyncio import AsyncIOMotorClient  # lazy import

        self._client = AsyncIOMotorClient(mongo_db_url)
        db = self._client.get_default_database()
        if db is None:
            raise RuntimeError("MONGO_DB_URL must include a default database name")
        self._db = db

    async def insert(self, collection: str, doc: dict[str, Any]) -> dict[str, Any]:
        doc = dict(doc)
        doc.setdefault("_id", new_id())
        await self._db[collection].insert_one(doc)
        return _normalize(doc)

    async def get(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        doc = await self._db[collection].find_one({"_id": doc_id})
        return _normalize(doc) if doc else None

    async def list(
        self,
        collection: str,
        filters: dict[str, Any] | None = None,
        *,
        skip: int = 0,
        limit: int = 100,
        sort: tuple[str, int] | None = None,
    ) -> builtins.list[dict[str, Any]]:
        cursor = self._db[collection].find(filters or {}).skip(max(0, skip)).limit(
            min(max(1, limit), 500)
        )
        if sort:
            cursor = cursor.sort(*sort)
        return [_normalize(doc) async for doc in cursor]

    async def update(
        self, collection: str, doc_id: str, updates: dict[str, Any]
    ) -> dict[str, Any] | None:
        await self._db[collection].update_one({"_id": doc_id}, {"$set": updates})
        return await self.get(collection, doc_id)

    async def delete(self, collection: str, doc_id: str) -> bool:
        res = await self._db[collection].delete_one({"_id": doc_id})
        return res.deleted_count > 0

    async def count(
        self, collection: str, filters: dict[str, Any] | None = None
    ) -> int:
        return await self._db[collection].count_documents(filters or {})

    async def ping(self) -> None:
        await self._db.command("ping")

    async def close(self) -> None:
        self._client.close()


# --------------------------------------------------------------------------- #
# Process-wide store handle (set during app startup; overridable in tests)
# --------------------------------------------------------------------------- #
_store: Store | None = None


def set_store(store: Store) -> None:
    global _store
    _store = store


def get_store() -> Store:
    if _store is None:
        raise RuntimeError("store not initialized; call set_store() / init_store() first")
    return _store


def init_store(mongo_db_url: str | None) -> Store:
    """Pick a backend from config and install it as the process store."""
    store: Store = MongoStore(mongo_db_url) if mongo_db_url else InMemoryStore()
    set_store(store)
    return store


# Collection names — one place so services and indexes agree.
UNITS = "units"
ARCHETYPES = "archetypes"
EMPLOYEES = "employees"
RUNS = "runs"
APPROVALS = "approvals"
AUDIT = "audit_ledger"
COST_EVENTS = "cost_events"
# Canonical model + Action/Task Registry (the wedge)
PERSONS = "persons"
DOCUMENTS = "documents"
PROJECTS = "projects"
TASKS = "tasks"
EVENTS = "events"
# Vault: agent-principal credentials
PRINCIPALS = "principals"
# Connectors: configured connection instances (credentials + settings per unit)
CONNECTIONS = "connections"
