"""Centralised application configuration loaded from environment variables.

Uses pydantic-settings to validate and parse all config at startup — no raw
os.getenv() calls should appear anywhere else in the codebase.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings, loaded from .env or environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ─────────────────────────────────────────────
    postgres_user: str = "ghostnet"
    postgres_password: str = "changeme_in_production"
    postgres_db: str = "ghostnet_hunter"
    postgres_host: str = "db"
    postgres_port: int = 5432
    database_url: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def _assemble_db_url(cls, v: str, info: object) -> str:  # noqa: ANN401
        """Build the database URL from components if not provided directly."""
        if v:
            return v
        data = info.data if hasattr(info, "data") else {}  # type: ignore[union-attr]
        user = data.get("postgres_user", "ghostnet")
        password = data.get("postgres_password", "changeme_in_production")
        host = data.get("postgres_host", "db")
        port = data.get("postgres_port", 5432)
        db = data.get("postgres_db", "ghostnet_hunter")
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

    # ── Redis / Celery ───────────────────────────────────────
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    # ── API ──────────────────────────────────────────────────
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    secret_key: str = "replace-with-a-strong-random-secret"

    # ── File Storage ─────────────────────────────────────────
    upload_dir: Path = Path("/app/data/uploads")
    crop_dir: Path = Path("/app/data/crops")
    max_upload_size_mb: int = 500

    # ── ML / Detection ───────────────────────────────────────
    model_input_size: int = 640
    confidence_threshold: float = 0.25
    # The worker uses the trained pipeline detector by default. Override this
    # with PIPELINE_WEIGHTS_PATH for a mounted model in another location.
    pipeline_weights_path: Path = Path("/app/models/pipeline_real/best_fixed.pt")
    onnx_model_path: Path = Path("/app/models/pipeline_real/best_fixed.onnx")
    use_tensorrt: bool = False

    # ── Scoring Fusion ───────────────────────────────────────
    score_w1_model: float = 0.50
    score_w2_shadow: float = 0.30
    score_w3_cfar: float = 0.20
    penalty_edge_swath: float = 0.10
    penalty_temporal: float = 0.05

    # ── Speckle Filter ───────────────────────────────────────
    speckle_filter: Literal["lee", "frost"] = "lee"
    lee_window_size: int = 7
    frost_damping: float = 2.0

    # ── CFAR ─────────────────────────────────────────────────
    cfar_guard_cells: int = 4
    cfar_training_cells: int = 16
    cfar_false_alarm_rate: float = 0.001

    # ── Logging ──────────────────────────────────────────────
    log_level: str = "INFO"
    log_format: Literal["json", "console"] = "json"

    @property
    def cors_origin_list(self) -> list[str]:
        """Return CORS origins as a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        """Return the max upload size in bytes."""
        return self.max_upload_size_mb * 1024 * 1024


def get_settings() -> Settings:
    """Factory that returns a cached Settings instance.

    We avoid module-level instantiation so tests can monkeypatch env vars
    before the first call.
    """
    return Settings()
