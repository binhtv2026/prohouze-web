"""
ProHouzing Domain Event Model
Version: 1.0.0

Entities:
- DomainEvent (business events for event-driven architecture)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, Boolean, Index
from sqlalchemy.orm import relationship

from .base import CoreModel, GUID, JSONB, utc_now


class DomainEvent(CoreModel):
    """
    Domain Event - Business events for event-driven processing
    
    Events trigger downstream actions:
    - Commission calculation
    - Notifications
    - Analytics
    - Integrations
    
    Immutable - never updated after creation.
    """
    __tablename__ = "domain_events"
    
    # Organization
    org_id = Column(GUID(), nullable=False)
    
    # Event Identity
    event_code = Column(String(100), nullable=False)  # e.g., deal.won, payment.received
    event_version = Column(String(10), default="1.0")
    
    # Aggregate (what entity produced this event)
    aggregate_type = Column(String(50), nullable=False)  # EntityType enum
    aggregate_id = Column(GUID(), nullable=False)
    
    # Sequence (for ordering within an aggregate)
    sequence_no = Column(Integer, nullable=False, default=0)
    
    # Event Data
    payload = Column(JSONB, nullable=False)  # Event-specific data
    
    # Causation (what triggered this event)
    causation_id = Column(GUID(), nullable=True)  # ID of causing event/action
    correlation_id = Column(String(50), nullable=True)  # Request correlation
    
    # Actor
    actor_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    actor_type = Column(String(50), default="user")  # user/system
    
    # Timing
    occurred_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    
    # Processing Status
    processed_status = Column(String(50), default="pending")  # ProcessedStatus enum
    processed_at = Column(DateTime(timezone=True), nullable=True)
    process_attempts = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    
    # Retry
    retry_after = Column(DateTime(timezone=True), nullable=True)
    max_retries = Column(Integer, default=3)
    
    # Handlers (track which handlers processed this)
    handlers_completed = Column(JSONB, nullable=True, default=list)  # List of handler names
    handlers_failed = Column(JSONB, nullable=True, default=list)
    
    # Idempotency
    idempotency_key = Column(String(100), nullable=True, unique=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    actor = relationship("User", foreign_keys=[actor_user_id])
    
    # Indexes
    __table_args__ = (
        Index("ix_domain_events_org_id", "org_id"),
        Index("ix_domain_events_event_code", "event_code"),
        Index("ix_domain_events_aggregate", "aggregate_type", "aggregate_id"),
        Index("ix_domain_events_occurred_at", "occurred_at"),
        Index("ix_domain_events_processed_status", "processed_status"),
        Index("ix_domain_events_correlation_id", "correlation_id"),
        Index("ix_domain_events_pending", "processed_status", "retry_after"),
    )
    
    def __repr__(self):
        return f"<DomainEvent {self.event_code} for {self.aggregate_type}:{self.aggregate_id}>"
    
    @classmethod
    def create_event(
        cls,
        org_id: str,
        event_code: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict,
        actor_user_id: str = None,
        correlation_id: str = None,
        **kwargs
    ):
        """Factory method to create domain event"""
        import uuid
        return cls(
            org_id=org_id,
            event_code=event_code,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            payload=payload,
            actor_user_id=actor_user_id,
            correlation_id=correlation_id,
            idempotency_key=f"{aggregate_type}:{aggregate_id}:{event_code}:{uuid.uuid4().hex[:8]}",
            **kwargs
        )
    
    def mark_processing(self):
        """Mark event as being processed"""
        self.processed_status = "processing"
        self.process_attempts += 1
    
    def mark_completed(self, handler_name: str = None):
        """Mark event as completed"""
        self.processed_status = "completed"
        self.processed_at = utc_now()
        if handler_name and self.handlers_completed is not None:
            self.handlers_completed.append(handler_name)
    
    def mark_failed(self, error: str, handler_name: str = None):
        """Mark event as failed"""
        from datetime import timedelta
        self.last_error = error
        if handler_name and self.handlers_failed is not None:
            self.handlers_failed.append({"handler": handler_name, "error": error})
        
        if self.process_attempts >= self.max_retries:
            self.processed_status = "failed"
        else:
            self.processed_status = "pending"
            # Exponential backoff
            backoff = 2 ** self.process_attempts * 60  # 2, 4, 8 minutes
            self.retry_after = utc_now() + timedelta(seconds=backoff)
    
    def skip(self, reason: str = None):
        """Mark event as skipped"""
        self.processed_status = "skipped"
        self.processed_at = utc_now()
        if reason:
            self.last_error = f"Skipped: {reason}"
