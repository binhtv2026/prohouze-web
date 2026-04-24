"""
ProHouzing Event Tracking & Activity Stream - Models
Version: 2.0.0 (Prompt 2/18)

Complete event-driven architecture models:
- DomainEvent (extended from v1 with new fields)
- ActivityStreamItem (human-readable timeline)
- EntityChangeLog (audit trail)
- EventSubscription (event handlers)
- EventDeliveryLog (processing tracking)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, Boolean, Index, Numeric
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from .base import CoreModel, GUID, JSONB, utc_now


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class EventCategory(str, PyEnum):
    """Event categories for filtering and routing"""
    CUSTOMER = "customer"
    LEAD = "lead"
    DEAL = "deal"
    PRODUCT = "product"
    BOOKING = "booking"
    CONTRACT = "contract"
    PAYMENT = "payment"
    COMMISSION = "commission"
    TASK = "task"
    WORKFLOW = "workflow"
    INTEGRATION = "integration"
    SYSTEM = "system"


class EventVisibility(str, PyEnum):
    """Who can see this event"""
    INTERNAL = "internal"          # System/debug only
    BUSINESS_TIMELINE = "business" # Show in entity timeline
    ADMIN_ONLY = "admin"           # Admin dashboard only
    CUSTOMER_SAFE = "customer"     # Can show to customers


class ProcessingStatus(str, PyEnum):
    """Event processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class ActorType(str, PyEnum):
    """Who triggered the event"""
    USER = "user"
    SYSTEM = "system"
    API = "api"
    WEBHOOK = "webhook"
    SCHEDULER = "scheduler"
    AI = "ai"


class SourceType(str, PyEnum):
    """Where the event originated"""
    MANUAL = "manual"
    API = "api"
    IMPORT = "import"
    WEBHOOK = "webhook"
    SCHEDULER = "scheduler"
    WORKFLOW = "workflow"
    MIGRATION = "migration"


class SeverityLevel(str, PyEnum):
    """Activity severity for UI display"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ChangeSource(str, PyEnum):
    """Source of change for audit logs"""
    USER_ACTION = "user_action"
    API_CALL = "api_call"
    IMPORT = "import"
    MERGE = "merge"
    SYSTEM_UPDATE = "system_update"
    WORKFLOW = "workflow"
    MIGRATION = "migration"


# ═══════════════════════════════════════════════════════════════════════════════
# NOTE: DomainEvent model is in event.py (domain_events table)
# We extend its functionality via EventService without creating a new table
# ═══════════════════════════════════════════════════════════════════════════════

# Re-export from event.py for convenience
from .event import DomainEvent


# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVITY STREAM ITEM MODEL
# ═══════════════════════════════════════════════════════════════════════════════

class ActivityStreamItem(CoreModel):
    """
    Activity Stream Item - Human-readable timeline entries
    
    Generated from domain events but optimized for display.
    Shows timeline on entity pages (customer, deal, product, etc.)
    
    Used for:
    - Entity timeline views
    - User activity feeds
    - Dashboard recent activities
    - Notification preview
    """
    __tablename__ = "activity_stream_items"
    
    # ─── Organization ─────────────────────────────────────────────────────────
    org_id = Column(GUID(), nullable=False, index=True)
    
    # ─── Source Event ─────────────────────────────────────────────────────────
    event_id = Column(GUID(), ForeignKey("domain_events.id"), nullable=True)
    
    # ─── Primary Entity ───────────────────────────────────────────────────────
    entity_type = Column(String(50), nullable=False)  # customer, lead, deal, etc.
    entity_id = Column(GUID(), nullable=False)
    entity_code = Column(String(100), nullable=True)  # e.g., DH-000123
    entity_name = Column(String(255), nullable=True)  # Denormalized
    
    # ─── Secondary Entity (if applicable) ─────────────────────────────────────
    secondary_entity_type = Column(String(50), nullable=True)
    secondary_entity_id = Column(GUID(), nullable=True)
    secondary_entity_name = Column(String(255), nullable=True)
    
    # ─── Actor ────────────────────────────────────────────────────────────────
    actor_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=True)  # Denormalized
    actor_avatar_url = Column(String(500), nullable=True)
    
    # ─── Activity Content ─────────────────────────────────────────────────────
    activity_code = Column(String(100), nullable=False)  # Same as event_code
    title = Column(String(255), nullable=False)  # Short title
    summary = Column(Text, nullable=True)  # Human-readable description
    icon_code = Column(String(50), nullable=True)  # Icon for UI
    color_code = Column(String(20), nullable=True)  # Color for UI
    
    # ─── Severity & Visibility ────────────────────────────────────────────────
    severity_level = Column(String(20), default="info")  # SeverityLevel
    visibility_scope = Column(String(50), default="business")  # EventVisibility
    audience_scope = Column(String(50), nullable=True)  # team, org, owner_only
    
    # ─── UI State ─────────────────────────────────────────────────────────────
    is_pinned = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # ─── Timing ───────────────────────────────────────────────────────────────
    happened_at = Column(DateTime(timezone=True), nullable=False)
    
    # ─── Related Entities (for filtering) ─────────────────────────────────────
    related_customer_id = Column(GUID(), nullable=True)
    related_deal_id = Column(GUID(), nullable=True)
    related_product_id = Column(GUID(), nullable=True)
    related_project_id = Column(GUID(), nullable=True)
    
    # ─── Metadata ─────────────────────────────────────────────────────────────
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # ─── Relationships ────────────────────────────────────────────────────────
    source_event = relationship("DomainEvent", foreign_keys=[event_id])
    actor = relationship("User", foreign_keys=[actor_user_id])
    
    # ─── Indexes ──────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_activity_stream_org_id", "org_id"),
        Index("ix_activity_stream_entity", "entity_type", "entity_id"),
        Index("ix_activity_stream_actor", "actor_user_id"),
        Index("ix_activity_stream_happened_at", "happened_at"),
        Index("ix_activity_stream_timeline", "entity_type", "entity_id", "happened_at"),
        Index("ix_activity_stream_customer", "related_customer_id", "happened_at"),
        Index("ix_activity_stream_deal", "related_deal_id", "happened_at"),
        Index("ix_activity_stream_activity_code", "activity_code"),
    )
    
    def __repr__(self):
        return f"<ActivityStreamItem {self.activity_code} for {self.entity_type}:{self.entity_id}>"


# ═══════════════════════════════════════════════════════════════════════════════
# ENTITY CHANGE LOG MODEL (Audit Trail)
# ═══════════════════════════════════════════════════════════════════════════════

class EntityChangeLog(CoreModel):
    """
    Entity Change Log - Field-level audit trail
    
    Tracks specific field changes for compliance and debugging.
    Only logs important fields, not every update.
    
    Used for:
    - Forensic analysis
    - Compliance audit
    - Debugging
    - Data reconciliation
    """
    __tablename__ = "entity_change_logs"
    
    # ─── Organization ─────────────────────────────────────────────────────────
    org_id = Column(GUID(), nullable=False, index=True)
    
    # ─── Entity ───────────────────────────────────────────────────────────────
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(GUID(), nullable=False)
    
    # ─── Actor ────────────────────────────────────────────────────────────────
    actor_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=True)
    
    # ─── Change Source ────────────────────────────────────────────────────────
    change_source = Column(String(50), nullable=False)  # ChangeSource
    correlation_id = Column(String(100), nullable=True)
    
    # ─── Field Change ─────────────────────────────────────────────────────────
    field_name = Column(String(100), nullable=False)
    old_value_json = Column(JSONB, nullable=True)  # Raw value
    new_value_json = Column(JSONB, nullable=True)  # Raw value
    old_display_value = Column(String(500), nullable=True)  # Human-readable
    new_display_value = Column(String(500), nullable=True)  # Human-readable
    
    # ─── Context ──────────────────────────────────────────────────────────────
    reason_code = Column(String(100), nullable=True)
    reason_note = Column(Text, nullable=True)
    
    # ─── Timing ───────────────────────────────────────────────────────────────
    changed_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    
    # ─── Relationships ────────────────────────────────────────────────────────
    actor = relationship("User", foreign_keys=[actor_user_id])
    
    # ─── Indexes ──────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_change_logs_org_id", "org_id"),
        Index("ix_change_logs_entity", "entity_type", "entity_id"),
        Index("ix_change_logs_changed_at", "changed_at"),
        Index("ix_change_logs_field", "entity_type", "field_name"),
        Index("ix_change_logs_actor", "actor_user_id"),
        Index("ix_change_logs_correlation", "correlation_id"),
    )
    
    def __repr__(self):
        return f"<EntityChangeLog {self.entity_type}:{self.entity_id}.{self.field_name}>"


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT SUBSCRIPTION MODEL
# ═══════════════════════════════════════════════════════════════════════════════

class EventSubscription(CoreModel):
    """
    Event Subscription - Register handlers for events
    
    Defines which handlers should process which events.
    Supports pattern matching on event codes.
    
    Used for:
    - Notification dispatch
    - Workflow triggers
    - Commission calculation
    - Integration webhooks
    """
    __tablename__ = "event_subscriptions"
    
    # ─── Subscription Identity ────────────────────────────────────────────────
    subscription_code = Column(String(100), unique=True, nullable=False)
    subscription_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # ─── Event Pattern ────────────────────────────────────────────────────────
    event_code_pattern = Column(String(100), nullable=False)  # Supports wildcards: deal.*, *.created
    event_category = Column(String(50), nullable=True)  # Optional filter
    
    # ─── Handler ──────────────────────────────────────────────────────────────
    handler_name = Column(String(100), nullable=False)  # Handler function name
    handler_type = Column(String(50), nullable=False)   # sync, async, webhook
    handler_config = Column(JSONB, nullable=True)       # Handler-specific config
    
    # ─── Delivery ─────────────────────────────────────────────────────────────
    delivery_mode = Column(String(50), default="async")  # sync, async, batch
    priority = Column(Integer, default=100)  # Lower = higher priority
    
    # ─── Retry Policy ─────────────────────────────────────────────────────────
    retry_policy_json = Column(JSONB, nullable=True, default=dict)
    max_retries = Column(Integer, default=3)
    timeout_ms = Column(Integer, default=30000)  # 30 seconds default
    
    # ─── Status ───────────────────────────────────────────────────────────────
    is_active = Column(Boolean, default=True)
    
    # ─── Indexes ──────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_event_subscriptions_code", "subscription_code"),
        Index("ix_event_subscriptions_pattern", "event_code_pattern"),
        Index("ix_event_subscriptions_active", "is_active"),
    )
    
    def __repr__(self):
        return f"<EventSubscription {self.subscription_code} -> {self.handler_name}>"


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT DELIVERY LOG MODEL
# ═══════════════════════════════════════════════════════════════════════════════

class EventDeliveryLog(CoreModel):
    """
    Event Delivery Log - Track handler executions
    
    Records every attempt to process an event.
    Used for debugging and monitoring.
    """
    __tablename__ = "event_delivery_logs"
    
    # ─── Event Reference ──────────────────────────────────────────────────────
    org_id = Column(GUID(), nullable=True)
    event_id = Column(GUID(), ForeignKey("domain_events.id"), nullable=False)
    subscription_id = Column(GUID(), ForeignKey("event_subscriptions.id"), nullable=False)
    
    # ─── Delivery Status ──────────────────────────────────────────────────────
    delivery_status = Column(String(50), nullable=False)  # pending, processing, delivered, failed
    attempt_no = Column(Integer, default=1)
    
    # ─── Timing ───────────────────────────────────────────────────────────────
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # ─── Result ───────────────────────────────────────────────────────────────
    error_message = Column(Text, nullable=True)
    response_json = Column(JSONB, nullable=True)
    
    # ─── Relationships ────────────────────────────────────────────────────────
    event = relationship("DomainEvent", foreign_keys=[event_id])
    subscription = relationship("EventSubscription", foreign_keys=[subscription_id])
    
    # ─── Indexes ──────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_delivery_logs_event_id", "event_id"),
        Index("ix_delivery_logs_subscription_id", "subscription_id"),
        Index("ix_delivery_logs_status", "delivery_status"),
        Index("ix_delivery_logs_started_at", "started_at"),
    )
    
    def __repr__(self):
        return f"<EventDeliveryLog event:{self.event_id} sub:{self.subscription_id} status:{self.delivery_status}>"
