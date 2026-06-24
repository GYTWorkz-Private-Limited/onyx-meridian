# Contributing to Onyx Meridian

Conventions for humans and coding agents working in this repo.

## Stack

- Python 3.11+, FastAPI, Pydantic v2, motor (MongoDB). Matches the onyx family.
- No ORM: documents are plain dicts behind the `Store` interface
  (`meridian/services/store.py`). Two backends — in-memory and Mongo.

## Layering (respect the direction of dependencies)

```
routes  ->  services  ->  { domain, governance, gateway, adapters, store }
schemas is shared (Pydantic models); domain/governance/gateway are pure (no I/O).
```

- **Routes** are thin: parse, call a service, return. No business logic.
- **Services** own orchestration and persistence. They raise domain errors
  (`NotFoundError`, `ConflictError`, `PolicyDenied`, `LifecycleError`); the API
  maps those to HTTP status codes once, in `main.py`.
- **domain/**, **governance/**, **gateway/** stay free of I/O so they're trivially
  unit-testable. If you need the DB, you're in a service.

## The lifecycle is sacred

Every employee status change goes through `domain/lifecycle.py`. Don't write a new
status directly in a service — add/adjust the transition in `ALLOWED_TRANSITIONS`
and call `assert_transition`. Every governed action must:

1. pass the state-machine check,
2. pass the policy engine,
3. write an audit-ledger entry (`audit_service.record`), and
4. bump the version when it changes configuration.

## Audit is append-only

Never update or delete `audit_ledger` rows. If you think you need to, you don't.

## Tests

- `pytest` runs with no infrastructure (in-memory store via the app lifespan).
- Add a unit test for pure logic (domain/governance) and an API test for any new
  endpoint. Builders live in `tests/conftest.py`.
- `ruff check .` must pass.

## Naming

- Repo/codename follows the family's gemological single-word capability theme.
- Collections are declared once in `services/store.py`; reference the constants,
  never string literals.
