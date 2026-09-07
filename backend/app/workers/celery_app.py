"""Celery application instance and configuration.

This module creates the Celery app that the worker process uses.
The broker and result backend are configured from environment variables.
"""

from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "ghost_net_hunter",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Route long-running tasks to a dedicated queue
    task_routes={
        "app.workers.tasks.process_survey_pipeline": {"queue": "sonar_processing"},
    },
)

celery_app.autodiscover_tasks(["app.workers"])
