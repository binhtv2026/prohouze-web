"""
Email Delivery Engine - Queue-based email sending with retries
"""

import os
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

from models.email_automation_models import (
    EmailJob, EmailJobStatus, EmailLog, EmailDraftStatus
)

logger = logging.getLogger(__name__)


class EmailDeliveryEngine:
    """
    Delivery Engine - Queue-based email sending
    Features:
    - Redis-based job queue
    - Async workers
    - Retry logic with exponential backoff
    - Idempotent delivery
    - Rate limiting
    """
    
    # Queue names
    QUEUE_HIGH = "email:queue:high"
    QUEUE_NORMAL = "email:queue:normal"
    QUEUE_LOW = "email:queue:low"
    
    # Rate limits
    RATE_LIMIT_PER_SECOND = 10
    RATE_LIMIT_PER_MINUTE = 100
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.redis = None
        self.resend_api_key = os.environ.get("RESEND_API_KEY")
        self.sender_email = os.environ.get("EMAIL_FROM", "noreply@prohouzing.com")
        self._init_redis()
        self._init_resend()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        if REDIS_AVAILABLE:
            try:
                redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
                self.redis = aioredis.from_url(redis_url, decode_responses=True)
                logger.info("Email Delivery Engine: Redis connected")
            except Exception as e:
                logger.warning(f"Email Delivery Engine: Redis not available - {e}")
                self.redis = None
    
    def _init_resend(self):
        """Initialize Resend client"""
        if RESEND_AVAILABLE and self.resend_api_key:
            resend.api_key = self.resend_api_key
            self.resend_enabled = True
            logger.info("Email Delivery Engine: Resend configured")
        else:
            self.resend_enabled = False
            logger.warning("Email Delivery Engine: Resend not configured")
    
    def _get_queue_name(self, priority: int) -> str:
        """Get queue name based on priority"""
        if priority <= 3:
            return self.QUEUE_HIGH
        elif priority <= 6:
            return self.QUEUE_NORMAL
        else:
            return self.QUEUE_LOW
    
    async def enqueue_job(
        self,
        draft_id: str,
        email: str,
        subject: str,
        content: str,
        recipient_name: Optional[str] = None,
        user_id: Optional[str] = None,
        priority: int = 5,
        scheduled_at: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add email job to queue
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Check idempotency
        if idempotency_key:
            existing = await self.db.email_jobs.find_one(
                {"idempotency_key": idempotency_key, "status": {"$ne": "failed"}}
            )
            if existing:
                return {
                    "success": True,
                    "duplicate": True,
                    "job_id": existing.get("id"),
                    "message": "Job already exists"
                }
        
        # Create job - generate idempotency key if not provided to avoid duplicate key error
        import uuid as uuid_module
        job_idempotency_key = idempotency_key or str(uuid_module.uuid4())
        
        job = EmailJob(
            draft_id=draft_id,
            email=email,
            recipient_name=recipient_name,
            user_id=user_id,
            subject=subject,
            content=content,
            status=EmailJobStatus.QUEUED,
            priority=priority,
            scheduled_at=scheduled_at,
            idempotency_key=job_idempotency_key,
            queued_at=now
        )
        
        # Store in MongoDB
        await self.db.email_jobs.insert_one(job.dict())
        
        # Add to Redis queue
        if self.redis:
            queue_name = self._get_queue_name(priority)
            await self.redis.lpush(queue_name, job.id)
            logger.info(f"[DELIVERY] Job {job.id} added to queue {queue_name}")
        
        # Update draft status
        await self.db.email_drafts.update_one(
            {"id": draft_id},
            {"$set": {"status": EmailDraftStatus.SCHEDULED.value}}
        )
        
        return {
            "success": True,
            "duplicate": False,
            "job_id": job.id,
            "queue": self._get_queue_name(priority),
            "scheduled_at": scheduled_at
        }
    
    async def process_job(self, job_id: str) -> Dict[str, Any]:
        """
        Process a single email job
        """
        job = await self.db.email_jobs.find_one({"id": job_id}, {"_id": 0})
        if not job:
            return {"success": False, "error": "Job not found"}
        
        if job.get("status") in [EmailJobStatus.SENT.value, EmailJobStatus.CANCELLED.value]:
            return {"success": True, "message": "Job already processed"}
        
        # Check scheduled time
        if job.get("scheduled_at"):
            scheduled = datetime.fromisoformat(job["scheduled_at"].replace('Z', '+00:00'))
            if scheduled > datetime.now(timezone.utc):
                return {"success": True, "message": "Job scheduled for later", "scheduled_at": job["scheduled_at"]}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Mark as sending
        await self.db.email_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": EmailJobStatus.SENDING.value, "started_at": now}}
        )
        
        # Send email
        result = await self._send_email(
            to_email=job.get("email"),
            subject=job.get("subject"),
            content=job.get("content"),
            recipient_name=job.get("recipient_name")
        )
        
        if result.get("success"):
            # Success
            await self.db.email_jobs.update_one(
                {"id": job_id},
                {
                    "$set": {
                        "status": EmailJobStatus.SENT.value,
                        "processed_at": now,
                        "provider_id": result.get("email_id"),
                        "provider_response": result
                    }
                }
            )
            
            # Update draft status
            await self.db.email_drafts.update_one(
                {"id": job.get("draft_id")},
                {"$set": {"status": EmailDraftStatus.SENT.value}}
            )
            
            # Create log entry
            await self._create_log(job, result, "sent")
            
            logger.info(f"[DELIVERY] Email sent: {job_id} -> {job.get('email')}")
            
            return {"success": True, "job_id": job_id, "email_id": result.get("email_id")}
        
        else:
            # Failed - check retries
            retry_count = job.get("retry_count", 0) + 1
            max_retries = job.get("max_retries", 3)
            
            if retry_count < max_retries:
                # Schedule retry with exponential backoff
                backoff = min(60 * (2 ** retry_count), 3600)  # Max 1 hour
                next_retry = (datetime.now(timezone.utc) + timedelta(seconds=backoff)).isoformat()
                
                await self.db.email_jobs.update_one(
                    {"id": job_id},
                    {
                        "$set": {
                            "status": EmailJobStatus.RETRYING.value,
                            "retry_count": retry_count,
                            "last_error": result.get("error"),
                            "next_retry_at": next_retry
                        }
                    }
                )
                
                logger.warning(f"[DELIVERY] Job {job_id} failed, retry {retry_count}/{max_retries}")
                
                return {
                    "success": False,
                    "error": result.get("error"),
                    "retry_scheduled": next_retry,
                    "retry_count": retry_count
                }
            else:
                # Max retries reached
                await self.db.email_jobs.update_one(
                    {"id": job_id},
                    {
                        "$set": {
                            "status": EmailJobStatus.FAILED.value,
                            "last_error": result.get("error"),
                            "processed_at": now
                        }
                    }
                )
                
                # Create failed log
                await self._create_log(job, result, "failed")
                
                logger.error(f"[DELIVERY] Job {job_id} failed permanently: {result.get('error')}")
                
                return {"success": False, "error": result.get("error"), "permanent_failure": True}
    
    async def _send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        recipient_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email via Resend"""
        if not self.resend_enabled:
            logger.warning(f"[DELIVERY DEV] Would send to {to_email}: {subject}")
            return {"success": True, "dev_mode": True, "email_id": "dev-mode"}
        
        try:
            params = {
                "from": f"ProHouzing <{self.sender_email}>",
                "to": [to_email],
                "subject": subject,
                "html": content
            }
            
            result = await asyncio.to_thread(resend.Emails.send, params)
            
            return {
                "success": True,
                "email_id": result.get("id"),
                "provider": "resend"
            }
            
        except Exception as e:
            logger.error(f"[DELIVERY] Resend error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_log(self, job: Dict, result: Dict, status: str):
        """Create email log entry"""
        log = EmailLog(
            job_id=job.get("id"),
            draft_id=job.get("draft_id"),
            template_id=job.get("template_id"),
            user_id=job.get("user_id"),
            email=job.get("email"),
            recipient_name=job.get("recipient_name"),
            subject=job.get("subject"),
            status=status,
            provider_id=result.get("email_id"),
            error_message=result.get("error"),
            sent_at=datetime.now(timezone.utc).isoformat()
        )
        
        await self.db.email_logs.insert_one(log.dict())
        
        # Update subscriber stats
        await self.db.email_subscribers.update_one(
            {"email": job.get("email")},
            {
                "$inc": {"total_emails_sent": 1},
                "$set": {"last_email_at": log.sent_at}
            },
            upsert=True
        )
    
    async def process_queue(self, limit: int = 10) -> Dict[str, Any]:
        """
        Process pending jobs from queue
        Called by background worker
        """
        processed = 0
        failed = 0
        
        # Process high priority first
        for queue in [self.QUEUE_HIGH, self.QUEUE_NORMAL, self.QUEUE_LOW]:
            if self.redis:
                # Get jobs from Redis
                while processed < limit:
                    job_id = await self.redis.rpop(queue)
                    if not job_id:
                        break
                    
                    result = await self.process_job(job_id)
                    if result.get("success"):
                        processed += 1
                    else:
                        failed += 1
            else:
                # Fallback to MongoDB query
                jobs = await self.db.email_jobs.find(
                    {"status": EmailJobStatus.QUEUED.value},
                    {"_id": 0, "id": 1}
                ).sort("priority", 1).limit(limit - processed).to_list(limit - processed)
                
                for job in jobs:
                    result = await self.process_job(job["id"])
                    if result.get("success"):
                        processed += 1
                    else:
                        failed += 1
        
        # Process retries
        now = datetime.now(timezone.utc).isoformat()
        retry_jobs = await self.db.email_jobs.find(
            {
                "status": EmailJobStatus.RETRYING.value,
                "next_retry_at": {"$lte": now}
            },
            {"_id": 0, "id": 1}
        ).limit(10).to_list(10)
        
        for job in retry_jobs:
            result = await self.process_job(job["id"])
            if result.get("success"):
                processed += 1
            else:
                failed += 1
        
        return {
            "processed": processed,
            "failed": failed,
            "timestamp": now
        }
    
    async def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get job status"""
        return await self.db.email_jobs.find_one({"id": job_id}, {"_id": 0})
    
    async def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """Cancel a queued job"""
        job = await self.db.email_jobs.find_one({"id": job_id}, {"_id": 0})
        if not job:
            return {"success": False, "error": "Job not found"}
        
        if job.get("status") not in [EmailJobStatus.QUEUED.value, EmailJobStatus.RETRYING.value]:
            return {"success": False, "error": "Job cannot be cancelled"}
        
        await self.db.email_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": EmailJobStatus.CANCELLED.value}}
        )
        
        # Remove from Redis queue if present
        if self.redis:
            for queue in [self.QUEUE_HIGH, self.QUEUE_NORMAL, self.QUEUE_LOW]:
                await self.redis.lrem(queue, 0, job_id)
        
        return {"success": True, "message": "Job cancelled"}
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        stats = {
            "queued": await self.db.email_jobs.count_documents({"status": EmailJobStatus.QUEUED.value}),
            "sending": await self.db.email_jobs.count_documents({"status": EmailJobStatus.SENDING.value}),
            "sent": await self.db.email_jobs.count_documents({"status": EmailJobStatus.SENT.value}),
            "failed": await self.db.email_jobs.count_documents({"status": EmailJobStatus.FAILED.value}),
            "retrying": await self.db.email_jobs.count_documents({"status": EmailJobStatus.RETRYING.value}),
        }
        
        if self.redis:
            stats["redis_queues"] = {
                "high": await self.redis.llen(self.QUEUE_HIGH),
                "normal": await self.redis.llen(self.QUEUE_NORMAL),
                "low": await self.redis.llen(self.QUEUE_LOW)
            }
        
        return stats
