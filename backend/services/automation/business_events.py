"""
Business Events - Canonical Event Dictionary
Prompt 19/20 - Automation Engine

All business events that can trigger automation.
Events are the single source of truth for what happened in the system.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass, field
import uuid
import logging

logger = logging.getLogger(__name__)


# ==================== EVENT TYPES ====================

class EventDomain(str, Enum):
    """Event domain categories"""
    CRM = "crm"
    LEAD = "lead"
    DEAL = "deal"
    BOOKING = "booking"
    CONTRACT = "contract"
    TASK = "task"
    COMMISSION = "commission"
    MARKETING = "marketing"
    INVENTORY = "inventory"
    DATA_QUALITY = "data_quality"
    AI_SIGNAL = "ai_signal"
    SYSTEM = "system"


class EventType(str, Enum):
    """
    Canonical Business Events
    
    Naming: {domain}_{entity}_{action}
    
    These are ALL events that can trigger automation.
    """
    
    # ===== CRM Events =====
    CRM_CONTACT_CREATED = "crm.contact.created"
    CRM_CONTACT_UPDATED = "crm.contact.updated"
    CRM_CONTACT_MERGED = "crm.contact.merged"
    
    # ===== Lead Events =====
    LEAD_CREATED = "lead.created"
    LEAD_ASSIGNED = "lead.assigned"
    LEAD_REASSIGNED = "lead.reassigned"
    LEAD_STAGE_CHANGED = "lead.stage_changed"
    LEAD_SCORE_CHANGED = "lead.score_changed"
    LEAD_CONTACTED = "lead.contacted"
    LEAD_NO_ACTIVITY = "lead.no_activity"  # SLA breach
    LEAD_SLA_BREACH = "lead.sla_breach"  # First contact SLA
    LEAD_CONVERTED = "lead.converted"
    LEAD_LOST = "lead.lost"
    LEAD_QUALIFIED = "lead.qualified"
    LEAD_UNASSIGNED_DETECTED = "lead.unassigned_detected"
    
    # ===== Deal Events =====
    DEAL_CREATED = "deal.created"
    DEAL_ASSIGNED = "deal.assigned"
    DEAL_STAGE_CHANGED = "deal.stage_changed"
    DEAL_VALUE_CHANGED = "deal.value_changed"
    DEAL_STALE_DETECTED = "deal.stale_detected"
    DEAL_WON = "deal.won"
    DEAL_LOST = "deal.lost"
    DEAL_RISK_HIGH = "deal.risk_high"
    DEAL_RISK_CRITICAL = "deal.risk_critical"
    
    # ===== Booking Events =====
    BOOKING_CREATED = "booking.created"
    BOOKING_CONFIRMED = "booking.confirmed"
    BOOKING_EXPIRING = "booking.expiring"  # X days before
    BOOKING_EXPIRED = "booking.expired"
    BOOKING_CANCELLED = "booking.cancelled"
    BOOKING_PAYMENT_RECEIVED = "booking.payment_received"
    BOOKING_PAYMENT_OVERDUE = "booking.payment_overdue"
    BOOKING_ALLOCATED = "booking.allocated"
    
    # ===== Contract Events =====
    CONTRACT_CREATED = "contract.created"
    CONTRACT_SUBMITTED_FOR_REVIEW = "contract.submitted_for_review"
    CONTRACT_REVIEW_OVERDUE = "contract.review_overdue"
    CONTRACT_APPROVED = "contract.approved"
    CONTRACT_REJECTED = "contract.rejected"
    CONTRACT_SIGNED = "contract.signed"
    CONTRACT_PAYMENT_DUE = "contract.payment_due"
    CONTRACT_PAYMENT_OVERDUE = "contract.payment_overdue"
    CONTRACT_COMPLETED = "contract.completed"
    CONTRACT_MISSING_DOCUMENTS = "contract.missing_documents"
    
    # ===== Task Events =====
    TASK_CREATED = "task.created"
    TASK_ASSIGNED = "task.assigned"
    TASK_COMPLETED = "task.completed"
    TASK_OVERDUE = "task.overdue"
    TASK_ESCALATED = "task.escalated"
    
    # ===== Commission Events =====
    COMMISSION_TRIGGERED = "commission.triggered"
    COMMISSION_CALCULATED = "commission.calculated"
    COMMISSION_APPROVED = "commission.approved"
    COMMISSION_PAYOUT_READY = "commission.payout_ready"
    COMMISSION_DISPUTED = "commission.disputed"
    
    # ===== Marketing Events =====
    MARKETING_FORM_SUBMITTED = "marketing.form_submitted"
    MARKETING_CAMPAIGN_STARTED = "marketing.campaign_started"
    MARKETING_CAMPAIGN_ENDED = "marketing.campaign_ended"
    MARKETING_LANDING_VISITED = "marketing.landing_visited"
    MARKETING_CONTENT_PUBLISHED = "marketing.content_published"
    
    # ===== Inventory Events =====
    INVENTORY_PRODUCT_AVAILABLE = "inventory.product.available"
    INVENTORY_PRODUCT_RESERVED = "inventory.product.reserved"
    INVENTORY_PRODUCT_SOLD = "inventory.product.sold"
    INVENTORY_LOW_ABSORPTION = "inventory.low_absorption"
    
    # ===== Data Quality Events =====
    DATA_IMPORT_COMPLETED = "data.import_completed"
    DATA_IMPORT_ERRORS = "data.import_errors"
    DATA_DUPLICATE_DETECTED = "data.duplicate_detected"
    DATA_MISSING_FIELD = "data.missing_field"
    DATA_VALIDATION_FAILED = "data.validation_failed"
    
    # ===== AI Signal Events =====
    AI_HIGH_SCORE_LEAD = "ai.high_score_lead"
    AI_HIGH_RISK_DEAL = "ai.high_risk_deal"
    AI_CRITICAL_RISK_DEAL = "ai.critical_risk_deal"
    AI_NEXT_BEST_ACTION = "ai.next_best_action"
    AI_ANOMALY_DETECTED = "ai.anomaly_detected"
    AI_RECOMMENDATION_GENERATED = "ai.recommendation_generated"
    
    # ===== System Events =====
    SYSTEM_DAILY_CHECK = "system.daily_check"
    SYSTEM_HOURLY_CHECK = "system.hourly_check"
    SYSTEM_AUTOMATION_EXECUTED = "system.automation_executed"


# ==================== EVENT MODEL ====================

@dataclass
class BusinessEvent:
    """
    Canonical Business Event
    
    Every event that happens in the system should be represented
    by this model. Events are immutable and timestamped.
    """
    
    # Required fields
    event_id: str
    event_type: str  # EventType value
    domain: str      # EventDomain value
    
    # Entity context
    entity_type: str  # leads, deals, bookings, etc.
    entity_id: str
    
    # Event payload
    payload: Dict[str, Any] = field(default_factory=dict)
    
    # Actor
    actor_type: str = "system"  # system, user, automation
    actor_id: Optional[str] = None
    
    # Timing
    timestamp: str = ""
    
    # Correlation
    correlation_id: Optional[str] = None  # For tracing related events
    source_event_id: Optional[str] = None  # If triggered by another event
    
    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()
        if not self.event_id:
            self.event_id = f"evt_{uuid.uuid4().hex[:12]}"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "domain": self.domain,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "payload": self.payload,
            "actor_type": self.actor_type,
            "actor_id": self.actor_id,
            "timestamp": self.timestamp,
            "correlation_id": self.correlation_id,
            "source_event_id": self.source_event_id,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BusinessEvent":
        return cls(
            event_id=data.get("event_id", ""),
            event_type=data.get("event_type", ""),
            domain=data.get("domain", ""),
            entity_type=data.get("entity_type", ""),
            entity_id=data.get("entity_id", ""),
            payload=data.get("payload", {}),
            actor_type=data.get("actor_type", "system"),
            actor_id=data.get("actor_id"),
            timestamp=data.get("timestamp", ""),
            correlation_id=data.get("correlation_id"),
            source_event_id=data.get("source_event_id"),
            metadata=data.get("metadata", {}),
        )


# ==================== EVENT REGISTRY ====================

class EventRegistry:
    """
    Event Registry - Source of truth for event definitions.
    
    Provides:
    - Event type validation
    - Domain mapping
    - Event metadata
    """
    
    # Event type to domain mapping
    EVENT_DOMAINS: Dict[str, EventDomain] = {
        # CRM
        EventType.CRM_CONTACT_CREATED.value: EventDomain.CRM,
        EventType.CRM_CONTACT_UPDATED.value: EventDomain.CRM,
        EventType.CRM_CONTACT_MERGED.value: EventDomain.CRM,
        
        # Lead
        EventType.LEAD_CREATED.value: EventDomain.LEAD,
        EventType.LEAD_ASSIGNED.value: EventDomain.LEAD,
        EventType.LEAD_REASSIGNED.value: EventDomain.LEAD,
        EventType.LEAD_STAGE_CHANGED.value: EventDomain.LEAD,
        EventType.LEAD_SCORE_CHANGED.value: EventDomain.LEAD,
        EventType.LEAD_CONTACTED.value: EventDomain.LEAD,
        EventType.LEAD_NO_ACTIVITY.value: EventDomain.LEAD,
        EventType.LEAD_SLA_BREACH.value: EventDomain.LEAD,
        EventType.LEAD_CONVERTED.value: EventDomain.LEAD,
        EventType.LEAD_LOST.value: EventDomain.LEAD,
        EventType.LEAD_QUALIFIED.value: EventDomain.LEAD,
        EventType.LEAD_UNASSIGNED_DETECTED.value: EventDomain.LEAD,
        
        # Deal
        EventType.DEAL_CREATED.value: EventDomain.DEAL,
        EventType.DEAL_ASSIGNED.value: EventDomain.DEAL,
        EventType.DEAL_STAGE_CHANGED.value: EventDomain.DEAL,
        EventType.DEAL_VALUE_CHANGED.value: EventDomain.DEAL,
        EventType.DEAL_STALE_DETECTED.value: EventDomain.DEAL,
        EventType.DEAL_WON.value: EventDomain.DEAL,
        EventType.DEAL_LOST.value: EventDomain.DEAL,
        EventType.DEAL_RISK_HIGH.value: EventDomain.DEAL,
        EventType.DEAL_RISK_CRITICAL.value: EventDomain.DEAL,
        
        # Booking
        EventType.BOOKING_CREATED.value: EventDomain.BOOKING,
        EventType.BOOKING_CONFIRMED.value: EventDomain.BOOKING,
        EventType.BOOKING_EXPIRING.value: EventDomain.BOOKING,
        EventType.BOOKING_EXPIRED.value: EventDomain.BOOKING,
        EventType.BOOKING_CANCELLED.value: EventDomain.BOOKING,
        EventType.BOOKING_PAYMENT_RECEIVED.value: EventDomain.BOOKING,
        EventType.BOOKING_PAYMENT_OVERDUE.value: EventDomain.BOOKING,
        EventType.BOOKING_ALLOCATED.value: EventDomain.BOOKING,
        
        # Contract
        EventType.CONTRACT_CREATED.value: EventDomain.CONTRACT,
        EventType.CONTRACT_SUBMITTED_FOR_REVIEW.value: EventDomain.CONTRACT,
        EventType.CONTRACT_REVIEW_OVERDUE.value: EventDomain.CONTRACT,
        EventType.CONTRACT_APPROVED.value: EventDomain.CONTRACT,
        EventType.CONTRACT_REJECTED.value: EventDomain.CONTRACT,
        EventType.CONTRACT_SIGNED.value: EventDomain.CONTRACT,
        EventType.CONTRACT_PAYMENT_DUE.value: EventDomain.CONTRACT,
        EventType.CONTRACT_PAYMENT_OVERDUE.value: EventDomain.CONTRACT,
        EventType.CONTRACT_COMPLETED.value: EventDomain.CONTRACT,
        EventType.CONTRACT_MISSING_DOCUMENTS.value: EventDomain.CONTRACT,
        
        # Task
        EventType.TASK_CREATED.value: EventDomain.TASK,
        EventType.TASK_ASSIGNED.value: EventDomain.TASK,
        EventType.TASK_COMPLETED.value: EventDomain.TASK,
        EventType.TASK_OVERDUE.value: EventDomain.TASK,
        EventType.TASK_ESCALATED.value: EventDomain.TASK,
        
        # Commission
        EventType.COMMISSION_TRIGGERED.value: EventDomain.COMMISSION,
        EventType.COMMISSION_CALCULATED.value: EventDomain.COMMISSION,
        EventType.COMMISSION_APPROVED.value: EventDomain.COMMISSION,
        EventType.COMMISSION_PAYOUT_READY.value: EventDomain.COMMISSION,
        EventType.COMMISSION_DISPUTED.value: EventDomain.COMMISSION,
        
        # Marketing
        EventType.MARKETING_FORM_SUBMITTED.value: EventDomain.MARKETING,
        EventType.MARKETING_CAMPAIGN_STARTED.value: EventDomain.MARKETING,
        EventType.MARKETING_CAMPAIGN_ENDED.value: EventDomain.MARKETING,
        EventType.MARKETING_LANDING_VISITED.value: EventDomain.MARKETING,
        EventType.MARKETING_CONTENT_PUBLISHED.value: EventDomain.MARKETING,
        
        # Inventory
        EventType.INVENTORY_PRODUCT_AVAILABLE.value: EventDomain.INVENTORY,
        EventType.INVENTORY_PRODUCT_RESERVED.value: EventDomain.INVENTORY,
        EventType.INVENTORY_PRODUCT_SOLD.value: EventDomain.INVENTORY,
        EventType.INVENTORY_LOW_ABSORPTION.value: EventDomain.INVENTORY,
        
        # Data Quality
        EventType.DATA_IMPORT_COMPLETED.value: EventDomain.DATA_QUALITY,
        EventType.DATA_IMPORT_ERRORS.value: EventDomain.DATA_QUALITY,
        EventType.DATA_DUPLICATE_DETECTED.value: EventDomain.DATA_QUALITY,
        EventType.DATA_MISSING_FIELD.value: EventDomain.DATA_QUALITY,
        EventType.DATA_VALIDATION_FAILED.value: EventDomain.DATA_QUALITY,
        
        # AI Signal
        EventType.AI_HIGH_SCORE_LEAD.value: EventDomain.AI_SIGNAL,
        EventType.AI_HIGH_RISK_DEAL.value: EventDomain.AI_SIGNAL,
        EventType.AI_CRITICAL_RISK_DEAL.value: EventDomain.AI_SIGNAL,
        EventType.AI_NEXT_BEST_ACTION.value: EventDomain.AI_SIGNAL,
        EventType.AI_ANOMALY_DETECTED.value: EventDomain.AI_SIGNAL,
        EventType.AI_RECOMMENDATION_GENERATED.value: EventDomain.AI_SIGNAL,
        
        # System
        EventType.SYSTEM_DAILY_CHECK.value: EventDomain.SYSTEM,
        EventType.SYSTEM_HOURLY_CHECK.value: EventDomain.SYSTEM,
        EventType.SYSTEM_AUTOMATION_EXECUTED.value: EventDomain.SYSTEM,
    }
    
    @classmethod
    def get_domain(cls, event_type: str) -> EventDomain:
        """Get domain for an event type."""
        return cls.EVENT_DOMAINS.get(event_type, EventDomain.SYSTEM)
    
    @classmethod
    def is_valid_event(cls, event_type: str) -> bool:
        """Check if event type is valid."""
        return event_type in cls.EVENT_DOMAINS
    
    @classmethod
    def get_events_by_domain(cls, domain: EventDomain) -> List[str]:
        """Get all events in a domain."""
        return [
            event_type for event_type, d in cls.EVENT_DOMAINS.items()
            if d == domain
        ]
    
    @classmethod
    def get_all_event_types(cls) -> List[str]:
        """Get all event types."""
        return list(cls.EVENT_DOMAINS.keys())


# ==================== EVENT EMITTER ====================

class EventEmitter:
    """
    Event Emitter - Publishes events to the automation engine.
    
    This is the single point for emitting business events.
    All modules should use this to emit events.
    """
    
    def __init__(self, db):
        self.db = db
        self._events_collection = "business_events"
        self._handlers: Dict[str, List[callable]] = {}
    
    async def emit(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        payload: Dict[str, Any] = None,
        actor_type: str = "system",
        actor_id: str = None,
        correlation_id: str = None,
        source_event_id: str = None,
    ) -> BusinessEvent:
        """
        Emit a business event.
        
        Args:
            event_type: EventType value
            entity_type: Collection name (leads, deals, etc.)
            entity_id: Entity ID
            payload: Event-specific data
            actor_type: system, user, automation
            actor_id: User ID if actor is user
            correlation_id: For tracing related events
            source_event_id: If triggered by another event
            
        Returns:
            BusinessEvent
        """
        domain = EventRegistry.get_domain(event_type)
        
        event = BusinessEvent(
            event_id=f"evt_{uuid.uuid4().hex[:12]}",
            event_type=event_type,
            domain=domain.value,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload or {},
            actor_type=actor_type,
            actor_id=actor_id,
            correlation_id=correlation_id,
            source_event_id=source_event_id,
        )
        
        # Store event
        await self.db[self._events_collection].insert_one(event.to_dict())
        
        logger.info(f"Event emitted: {event_type} for {entity_type}/{entity_id}")
        
        return event
    
    async def get_recent_events(
        self,
        domain: str = None,
        entity_type: str = None,
        entity_id: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get recent events with optional filters."""
        query = {}
        if domain:
            query["domain"] = domain
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        
        events = await self.db[self._events_collection].find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return events


# ==================== HELPER FUNCTION ====================

async def emit_event(
    db,
    event_type: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any] = None,
    actor_type: str = "system",
    actor_id: str = None,
    correlation_id: str = None,
) -> BusinessEvent:
    """
    Helper function to emit events.
    Use this in routes/services to emit events.
    
    Example:
        await emit_event(
            db,
            EventType.LEAD_CREATED.value,
            "leads",
            lead_id,
            {"source": "website", "campaign_id": "..."},
            actor_type="user",
            actor_id=current_user["id"]
        )
    """
    emitter = EventEmitter(db)
    return await emitter.emit(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload,
        actor_type=actor_type,
        actor_id=actor_id,
        correlation_id=correlation_id,
    )
