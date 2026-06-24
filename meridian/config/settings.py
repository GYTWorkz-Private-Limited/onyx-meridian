from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration.

    Mirrors the onyx family convention (see onyxos/config/settings.py): a
    Pydantic-settings model loaded from environment / .env, exposed through a
    cached accessor. When ``mongo_db_url`` is unset the app falls back to an
    in-memory store, so it boots with zero infrastructure.
    """

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "Onyx Meridian API"
    env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: list[str] = ["*"]
    host: str = "0.0.0.0"
    port: int = 8010  # avoids the 8000/8005 collisions noted in the framework roadmap

    # Persistence. If unset, the in-memory store is used (good for dev + tests).
    mongo_db_url: str | None = None

    # Governance: the model gateway every employee's model calls route through
    # (Vault accelerator). A no-op local gateway is used when unset.
    model_gateway_url: str | None = None
    default_model: str = "internal/onyx-llm"

    # Monitoring: an employee with no heartbeat for this many seconds is "stale".
    heartbeat_stale_seconds: int = 900

    # Vault: pepper for hashing agent-principal credentials. MUST be overridden
    # in production (set CREDENTIAL_PEPPER); the default is for dev/tests only.
    credential_pepper: str = "meridian-dev-pepper-change-me"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
