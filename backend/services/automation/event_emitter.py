"""
Event Emitter - Integration Module
Prompt 19.5 Phase 2 - Integration

This module provides the emit_event function that:
1. Creates BusinessEvent with proper schema
2. Routes through Priority Engine → Orchestrator → Rule Engine → Action
3. Logs execution trace

ALL events use snake_case naming: lead_created, deal_stage_changed, etc.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ==================== EVENT TYPES (SNAKE_CASE) ====================

class EventTypes:
    """Canonical event types - ALL use snake_case."""
    
    # Lead Events
    LEAD_CREATED = "lead_created"
    LEAD_ASSIGNED = "lead_assigned"
    LEAD_REASSIGNED = "lead_reassigned"
    LEAD_STATUS_CHANGED = "lead_status_changed"
    LEAD_SLA_BREACH = "lead_sla_breach"
    LEAD_NO_ACTIVITY = "lead_no_activity"
    LEAD_CONVERTED = "lead_converted"
    LEAD_QUALIFIED = "lead_qualified"
    
    # Deal Events
    DEAL_CREATED = "deal_created"
    DEAL_STAGE_CHANGED = "deal_stage_changed"
    DEAL_VALUE_CHANGED = "deal_value_changed"
    DEAL_STALE_DETECTED = "deal_stale_detected"
    DEAL_WON = "deal_won"
    DEAL_LOST = "deal_lost"
    HIGH_VALUE_DEAL_DETECTED = "high_value_deal_detected"
    
    # Booking Events
    BOOKING_CREATED = "booking_created"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_EXPIRING = "booking_expiring"
    BOOKING_EXPIRED = "booking_expired"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_PAYMENT_RECEIVED = "booking_payment_received"
    
    # Task Events
    TASK_CREATED = "task_created"
    TASK_COMPLETED = "task_completed"
    TASK_OVERDUE = "task_overdue"


# ==================== BUSINESS EVENT SCHEMA ====================

class EventActor(BaseModel):
    """Who triggered the event."""
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    actor_type: str = "user"  # user, system, automation, scheduler


class EventEntity(BaseModel):
    """The entity the event is about."""
    entity_type: str = Field(alias="type")  # leads, deals, bookings - accept both "type" and "entity_type"
    entity_id: str = Field(alias="id")      # Entity ID - accept both "id" and "entity_id"
    snapshot: Optional[Dict[str, Any]] = None
    
    class Config:
        populate_by_name = True  # Allow both alias and field name


class EventMetadata(BaseModel):
    """Event metadata for tracing and idempotency."""
    correlation_id: str = Field(default_factory=lambda: f"corr_{uuid.uuid4().hex[:12]}")
    idempotency_key: str = ""
    source: str = "api"  # api, automation, scheduler, webhook, system
    chain_depth: int = 0
    chain_rule_ids: List[str] = Field(default_factory=list)


class BusinessEvent(BaseModel):
    """
    Canonical Business Event Contract.
    
    ALL events MUST use this schema. No raw dict events.
    
    Example:
        emit_event(BusinessEvent(
            event_type="lead_created",
            actor=EventActor(user_id="user_123"),
            entity=EventEntity(type="leads", id="lead_456"),
            payload={"source": "website", "lead_value": 1000000},
            metadata=EventMetadata(
                idempotency_key="lead_created_lead_456",
                source="api"
            )
        ))
    """
    
    # Event identification
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    event_type: str  # REQUIRED: lead_created, deal_stage_changed, etc.
    version: str = "1.0"
    
    # Who triggered
    actor: EventActor
    
    # What entity
    entity: EventEntity
    
    # Event-specific data (REQUIRED - cannot be empty)
    payload: Dict[str, Any]
    
    # Tracing & idempotency
    metadata: EventMetadata = Field(default_factory=EventMetadata)
    
    # Timestamp
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for processing by orchestrator."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "version": self.version,
            "actor": self.actor.model_dump(),
            "entity": {
                "entity_type": self.entity.entity_type,
                "entity_id": self.entity.entity_id,
                "snapshot": self.entity.snapshot
            },
            "payload": self.payload,
            "metadata": self.metadata.model_dump(),
            "timestamp": self.timestamp.isoformat()
        }
    
    def get_idempotency_key(self) -> str:
        """Get or generate idempotency key."""
        if self.metadata.idempotency_key:
            return self.metadata.idempotency_key
        return f"{self.event_type}_{self.entity.entity_id}_{self.event_id}"


# ==================== EVENT EMITTER ====================

class EventEmitter:
    """
    Central event emitter that routes events through the automation pipeline.
    
    Flow: Event → Priority Engine → Orchestrator → Rule Engine → Action → Log
    """
    
    _instance = None
    _orchestrator = None
    _db = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @classmethod
    def initialize(cls, db, orchestrator=None):
        """Initialize with database and orchestrator."""
        instance = cls.get_instance()
        instance._db = db
        instance._orchestrator = orchestrator
        logger.info("EventEmitter initialized")
    
    async def emit(self, event: BusinessEvent) -> Dict[str, Any]:
        """
        Emit a business event through the automation pipeline.
        
        Args:
            event: BusinessEvent instance (NOT raw dict)
            
        Returns:
            Execution result with trace info
        """
        # Validate event has payload
        if not event.payload:
            logger.error(f"Event {event.event_type} has no payload - REJECTED")
            return {
                "success": False,
                "error": "Event must have payload",
                "event_id": event.event_id
            }
        
        logger.info(f"📨 Event emitted: {event.event_type} | entity={event.entity.entity_type}/{event.entity.entity_id}")
        
        # Log event to database
        await self._log_event(event)
        
        # Process through orchestrator if available
        if self._orchestrator is not None:
            try:
                result = await self._orchestrator.process_event(event.to_dict())
                return result
            except Exception as e:
                logger.error(f"Orchestrator error: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "event_id": event.event_id
                }
        else:
            # Fallback: Just log event, no rule processing
            logger.warning("No orchestrator configured - event logged only")
            return {
                "success": True,
                "status": "logged_only",
                "event_id": event.event_id,
                "message": "Event logged, no orchestrator configured"
            }
    
    async def _log_event(self, event: BusinessEvent):
        """Log event to database for audit."""
        if self._db is None:
            return
            
        try:
            event_log = {
                "event_id": event.event_id,
                "event_type": event.event_type,
                "entity_type": event.entity.entity_type,
                "entity_id": event.entity.entity_id,
                "actor_id": event.actor.user_id,
                "actor_type": event.actor.actor_type,
                "payload": event.payload,
                "correlation_id": event.metadata.correlation_id,
                "idempotency_key": event.get_idempotency_key(),
                "source": event.metadata.source,
                "timestamp": event.timestamp.isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self._db.automation_events.insert_one(event_log)
        except Exception as e:
            logger.error(f"Failed to log event: {e}")


# ==================== HELPER FUNCTIONS ====================

async def emit_event(event: BusinessEvent) -> Dict[str, Any]:
    """
    Convenience function to emit an event.
    
    Usage:
        from services.automation.event_emitter import emit_event, BusinessEvent, EventActor, EventEntity, EventMetadata, EventTypes
        
        await emit_event(BusinessEvent(
            event_type=EventTypes.LEAD_CREATED,
            actor=EventActor(user_id=current_user["id"]),
            entity=EventEntity(type="leads", id=lead_id),
            payload={
                "source": lead_data.channel,
                "lead_value": lead_data.budget_max,
                "created_at": now
            },
            metadata=EventMetadata(
                idempotency_key=f"lead_created_{lead_id}",
                source="api"
            )
        ))
    """
    emitter = EventEmitter.get_instance()
    return await emitter.emit(event)


def create_lead_event(
    event_type: str,
    lead_id: str,
    user_id: str,
    payload: Dict[str, Any],
    source: str = "api"
) -> BusinessEvent:
    """Helper to create lead events."""
    return BusinessEvent(
        event_type=event_type,
        actor=EventActor(user_id=user_id, actor_type="user"),
        entity=EventEntity(type="leads", id=lead_id),
        payload=payload,
        metadata=EventMetadata(
            idempotency_key=f"{event_type}_{lead_id}_{uuid.uuid4().hex[:8]}",
            source=source
        )
    )


def create_deal_event(
    event_type: str,
    deal_id: str,
    user_id: str,
    payload: Dict[str, Any],
    source: str = "api"
) -> BusinessEvent:
    """Helper to create deal events."""
    return BusinessEvent(
        event_type=event_type,
        actor=EventActor(user_id=user_id, actor_type="user"),
        entity=EventEntity(type="deals", id=deal_id),
        payload=payload,
        metadata=EventMetadata(
            idempotency_key=f"{event_type}_{deal_id}_{uuid.uuid4().hex[:8]}",
            source=source
        )
    )


def create_booking_event(
    event_type: str,
    booking_id: str,
    user_id: str,
    payload: Dict[str, Any],
    source: str = "api"
) -> BusinessEvent:
    """Helper to create booking events."""
    return BusinessEvent(
        event_type=event_type,
        actor=EventActor(user_id=user_id, actor_type="user"),
        entity=EventEntity(type="bookings", id=booking_id),
        payload=payload,
        metadata=EventMetadata(
            idempotency_key=f"{event_type}_{booking_id}_{uuid.uuid4().hex[:8]}",
            source=source
        )
    )


def create_scheduled_event(
    event_type: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any]
) -> BusinessEvent:
    """Helper to create scheduled/system events."""
    return BusinessEvent(
        event_type=event_type,
        actor=EventActor(actor_type="scheduler"),
        entity=EventEntity(type=entity_type, id=entity_id),
        payload=payload,
        metadata=EventMetadata(
            idempotency_key=f"{event_type}_{entity_id}_{datetime.now().strftime('%Y%m%d%H')}",
            source="system_scheduler"  # IMPORTANT: Marks as system event
        )
    )


# ==================== THRESHOLDS ====================

class EventThresholds:
    """Configurable thresholds for event triggers."""
    
    # Lead SLA
    LEAD_SLA_HOURS = 24  # Hours before lead_sla_breach
    
    # Deal stale
    DEAL_STALE_DAYS = 7  # Days without activity before deal_stale_detected
    
    # High value deal
    HIGH_VALUE_DEAL_VND = 5_000_000_000  # 5 billion VND
    
    # Booking expiring
    BOOKING_EXPIRING_HOURS = 24  # Hours before expiry to trigger booking_expiring
