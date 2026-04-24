"""
Email Event Engine - Ingest and process events that trigger emails
"""

import os
import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from models.email_automation_models import (
    EmailEvent, EmailEventType, EmailTemplate, EmailTemplateType
)

logger = logging.getLogger(__name__)


class EmailEventEngine:
    """
    Event Engine - Receives and processes events that trigger emails
    Features:
    - Idempotency checks via Redis
    - Event -> Template mapping
    - Event queuing
    """
    
    # Event to Template Type Mapping
    EVENT_TEMPLATE_MAPPING = {
        EmailEventType.USER_SIGNUP: EmailTemplateType.OPERATION,
        EmailEventType.USER_BIRTHDAY: EmailTemplateType.MARKETING,
        EmailEventType.EMPLOYEE_BIRTHDAY: EmailTemplateType.MARKETING,
        EmailEventType.NEW_PRODUCT: EmailTemplateType.MARKETING,
        EmailEventType.CAMPAIGN_TRIGGER: EmailTemplateType.MARKETING,
        EmailEventType.CONTRACT_SIGNED: EmailTemplateType.OPERATION,
        EmailEventType.ONBOARDING_COMPLETE: EmailTemplateType.OPERATION,
        EmailEventType.KPI_ALERT: EmailTemplateType.SYSTEM,
        EmailEventType.PAYMENT_REMINDER: EmailTemplateType.OPERATION,
        EmailEventType.CUSTOM: EmailTemplateType.OPERATION,
    }
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.redis = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection for idempotency"""
        if REDIS_AVAILABLE:
            try:
                redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
                self.redis = aioredis.from_url(redis_url, decode_responses=True)
                logger.info("Email Event Engine: Redis connected")
            except Exception as e:
                logger.warning(f"Email Event Engine: Redis not available - {e}")
                self.redis = None
    
    async def _check_idempotency(self, idempotency_key: str) -> bool:
        """
        Check if this event has already been processed
        Returns True if duplicate (should skip), False if new
        """
        if not self.redis:
            # Fallback to MongoDB check
            existing = await self.db.email_events.find_one(
                {"idempotency_key": idempotency_key, "status": {"$in": ["processed", "processing"]}}
            )
            return existing is not None
        
        # Use Redis SETNX with TTL for idempotency
        key = f"email_event:{idempotency_key}"
        result = await self.redis.set(key, "processing", nx=True, ex=86400)  # 24h TTL
        return result is None  # None means key already exists = duplicate
    
    async def _mark_processed(self, idempotency_key: str):
        """Mark event as processed in Redis"""
        if self.redis:
            key = f"email_event:{idempotency_key}"
            await self.redis.set(key, "processed", ex=86400)
    
    def _generate_idempotency_key(self, event_type: str, payload: Dict) -> str:
        """Generate idempotency key from event data"""
        # Use email + event_type + date as unique key
        email = payload.get("email", "")
        user_id = payload.get("user_id", "")
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        data = f"{event_type}:{email}:{user_id}:{date}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]
    
    async def ingest_event(
        self,
        event_type: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None,
        source: str = "system"
    ) -> Dict[str, Any]:
        """
        Ingest a new email event
        Returns: Event ID and status
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Validate event type
        try:
            event_type_enum = EmailEventType(event_type)
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid event type: {event_type}",
                "valid_types": [e.value for e in EmailEventType]
            }
        
        # Generate or validate idempotency key
        if not idempotency_key:
            idempotency_key = self._generate_idempotency_key(event_type, payload)
        
        # Check for duplicates
        is_duplicate = await self._check_idempotency(idempotency_key)
        if is_duplicate:
            logger.info(f"[EVENT] Duplicate event skipped: {idempotency_key}")
            return {
                "success": True,
                "duplicate": True,
                "message": "Event already processed",
                "idempotency_key": idempotency_key
            }
        
        # Validate payload has required fields
        if not payload.get("email"):
            return {
                "success": False,
                "error": "Payload must contain 'email' field"
            }
        
        # Create event record
        event = EmailEvent(
            type=event_type_enum,
            source=source,
            payload=payload,
            idempotency_key=idempotency_key,
            status="pending",
            triggered_at=now
        )
        
        # Store event
        await self.db.email_events.insert_one(event.dict())
        
        logger.info(f"[EVENT] New event: type={event_type}, email={payload.get('email')}")
        
        return {
            "success": True,
            "duplicate": False,
            "event_id": event.id,
            "idempotency_key": idempotency_key,
            "status": "pending"
        }
    
    async def process_event(self, event_id: str) -> Dict[str, Any]:
        """
        Process a pending event - find template and prepare for email generation
        """
        event = await self.db.email_events.find_one({"id": event_id}, {"_id": 0})
        if not event:
            return {"success": False, "error": "Event not found"}
        
        if event.get("status") in ["processed", "processing"]:
            return {"success": True, "message": "Event already processed"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Mark as processing
        await self.db.email_events.update_one(
            {"id": event_id},
            {"$set": {"status": "processing"}}
        )
        
        try:
            # Get event type
            event_type = EmailEventType(event.get("type"))
            template_type = self.EVENT_TEMPLATE_MAPPING.get(event_type, EmailTemplateType.OPERATION)
            
            # Find matching template
            template = await self.db.email_templates.find_one(
                {
                    "type": template_type.value,
                    "is_active": True
                },
                {"_id": 0}
            )
            
            if not template:
                # No template found - create default
                logger.warning(f"[EVENT] No template for type {template_type.value}, using default")
            
            # Mark as processed
            await self.db.email_events.update_one(
                {"id": event_id},
                {
                    "$set": {
                        "status": "processed",
                        "processed_at": now
                    }
                }
            )
            
            # Mark idempotency as complete
            await self._mark_processed(event.get("idempotency_key"))
            
            return {
                "success": True,
                "event_id": event_id,
                "template_id": template.get("id") if template else None,
                "template_type": template_type.value,
                "payload": event.get("payload")
            }
            
        except Exception as e:
            logger.error(f"[EVENT] Error processing event {event_id}: {e}")
            await self.db.email_events.update_one(
                {"id": event_id},
                {"$set": {"status": "failed", "error_message": str(e)}}
            )
            return {"success": False, "error": str(e)}
    
    async def get_pending_events(self, limit: int = 100) -> list:
        """Get pending events for processing"""
        events = await self.db.email_events.find(
            {"status": "pending"},
            {"_id": 0}
        ).sort("triggered_at", 1).limit(limit).to_list(limit)
        return events
    
    async def get_event_stats(self) -> Dict[str, Any]:
        """Get event statistics"""
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        stats = await self.db.email_events.aggregate(pipeline).to_list(100)
        
        return {
            "total": sum(s["count"] for s in stats),
            "by_status": {s["_id"]: s["count"] for s in stats}
        }
