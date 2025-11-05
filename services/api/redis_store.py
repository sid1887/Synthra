"""
Redis-backed Job Store for distributed job tracking
Replaces in-memory jobs_store with Redis persistence
"""

import json
import redis
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RedisJobStore:
    """
    Redis-based job storage with pub/sub support for real-time updates
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379", ttl_hours: int = 24):
        """
        Initialize Redis connection
        
        Args:
            redis_url: Redis connection URL
            ttl_hours: Job TTL in hours (auto-cleanup old jobs)
        """
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = timedelta(hours=ttl_hours)
        self.job_prefix = "synthra:job:"
        self.pubsub_channel = "synthra:jobs:updates"
    
    def _job_key(self, job_id: str) -> str:
        """Generate Redis key for job"""
        return f"{self.job_prefix}{job_id}"
    
    def create_job(self, job_id: str, job_data: Dict[str, Any]) -> None:
        """
        Create new job entry
        
        Args:
            job_id: Unique job identifier
            job_data: Job metadata and configuration
        """
        job_data["job_id"] = job_id
        job_data["created_at"] = datetime.utcnow().isoformat()
        job_data["status"] = JobStatus.PENDING
        
        key = self._job_key(job_id)
        self.redis.setex(
            key,
            int(self.ttl.total_seconds()),
            json.dumps(job_data)
        )
        
        # Publish job creation event
        self._publish_update(job_id, "created", job_data)
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve job by ID
        
        Args:
            job_id: Job identifier
            
        Returns:
            Job data dict or None if not found
        """
        key = self._job_key(job_id)
        data = self.redis.get(key)
        
        if data:
            return json.loads(data)
        return None
    
    def update_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update job fields
        
        Args:
            job_id: Job identifier
            updates: Fields to update
            
        Returns:
            True if job exists and was updated
        """
        job = self.get_job(job_id)
        if not job:
            return False
        
        job.update(updates)
        job["updated_at"] = datetime.utcnow().isoformat()
        
        key = self._job_key(job_id)
        self.redis.setex(
            key,
            int(self.ttl.total_seconds()),
            json.dumps(job)
        )
        
        # Publish update event
        self._publish_update(job_id, "updated", updates)
        return True
    
    def set_status(self, job_id: str, status: JobStatus, result: Any = None, error: str = None) -> bool:
        """
        Update job status
        
        Args:
            job_id: Job identifier
            status: New status
            result: Result data (for completed jobs)
            error: Error message (for failed jobs)
            
        Returns:
            True if job exists and was updated
        """
        updates = {"status": status}
        
        if status == JobStatus.COMPLETED:
            updates["completed_at"] = datetime.utcnow().isoformat()
            if result is not None:
                updates["result"] = result
        
        if status == JobStatus.FAILED:
            updates["failed_at"] = datetime.utcnow().isoformat()
            if error:
                updates["error"] = error
        
        success = self.update_job(job_id, updates)
        
        if success:
            self._publish_update(job_id, f"status_{status}", {"status": status})
        
        return success
    
    def delete_job(self, job_id: str) -> bool:
        """
        Delete job from Redis
        
        Args:
            job_id: Job identifier
            
        Returns:
            True if job was deleted
        """
        key = self._job_key(job_id)
        deleted = self.redis.delete(key) > 0
        
        if deleted:
            self._publish_update(job_id, "deleted", {"job_id": job_id})
        
        return deleted
    
    def list_jobs(self, status: Optional[JobStatus] = None, limit: int = 100) -> list:
        """
        List all jobs, optionally filtered by status
        
        Args:
            status: Filter by status (None = all jobs)
            limit: Maximum number of jobs to return
            
        Returns:
            List of job data dicts
        """
        pattern = f"{self.job_prefix}*"
        jobs = []
        
        for key in self.redis.scan_iter(match=pattern, count=limit):
            data = self.redis.get(key)
            if data:
                job = json.loads(data)
                if status is None or job.get("status") == status:
                    jobs.append(job)
                    if len(jobs) >= limit:
                        break
        
        return jobs
    
    def _publish_update(self, job_id: str, event: str, data: Dict[str, Any]) -> None:
        """
        Publish job update to Redis pub/sub
        
        Args:
            job_id: Job identifier
            event: Event type (created, updated, status_*, deleted)
            data: Event data
        """
        message = {
            "job_id": job_id,
            "event": event,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.redis.publish(self.pubsub_channel, json.dumps(message))
    
    def subscribe_updates(self):
        """
        Subscribe to job updates pub/sub channel
        
        Returns:
            Redis PubSub object (iterate over listen())
        """
        pubsub = self.redis.pubsub()
        pubsub.subscribe(self.pubsub_channel)
        return pubsub
    
    def get_stats(self) -> Dict[str, int]:
        """
        Get job statistics
        
        Returns:
            Dict with job counts by status
        """
        jobs = self.list_jobs(limit=10000)  # Get all jobs
        
        stats = {
            "total": len(jobs),
            "pending": 0,
            "processing": 0,
            "completed": 0,
            "failed": 0
        }
        
        for job in jobs:
            status = job.get("status", "pending")
            if status in stats:
                stats[status] += 1
        
        return stats


# Singleton instance
_redis_store: Optional[RedisJobStore] = None


def get_redis_store(redis_url: str = None) -> RedisJobStore:
    """
    Get or create Redis job store singleton
    
    Args:
        redis_url: Redis connection URL (uses env var REDIS_URL if not provided)
    """
    global _redis_store
    
    if _redis_store is None:
        import os
        url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        _redis_store = RedisJobStore(url)
    
    return _redis_store
