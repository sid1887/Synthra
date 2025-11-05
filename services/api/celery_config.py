"""
Celery configuration for distributed background tasks
Handles long-running operations like PDF generation, simulation, etc.
"""

from celery import Celery
import os

# Redis URL for broker and backend
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Create Celery app
celery_app = Celery(
    "synthra",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['services.api.tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3000,  # 50 minutes soft limit
    worker_prefetch_multiplier=1,  # Don't prefetch tasks (better for long-running)
    worker_max_tasks_per_child=100,  # Restart workers after 100 tasks (memory cleanup)
)

# Task routing (optional - route different tasks to different queues)
celery_app.conf.task_routes = {
    'services.api.tasks.generate_pdf': {'queue': 'docs'},
    'services.api.tasks.run_simulation': {'queue': 'simulation'},
    'services.api.tasks.generate_netlist': {'queue': 'core'},
    'services.api.tasks.process_image': {'queue': 'vision'},
    'services.api.tasks.generate_component_symbol': {'queue': 'sve'},
}

# Task priority settings
celery_app.conf.task_default_priority = 5
celery_app.conf.task_inherit_parent_priority = True


if __name__ == '__main__':
    celery_app.start()
