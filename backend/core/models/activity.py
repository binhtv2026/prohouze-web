"""
ProHouzing Activity Model
Version: 1.0.0

Entities:
- ActivityLog (user activity tracking)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, Index
from sqlalchemy.orm import relationship

from .base import CoreModel, GUID, JSONB, utc_now


class ActivityLog(CoreModel):
    """
    Activity Log - User activity tracking
    
    Tracks all user actions for audit and analytics.
    Immutable records - never updated or deleted.
    """
    __tablename__ = "activity_logs"
    
    # Organization
    org_id = Column(GUID(), nullable=False)
    
    # Actor
    actor_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    actor_type = Column(String(50), default="user")  # user/system/api
    actor_ip = Column(String(45), nullable=True)  # IPv6 compatible
    actor_user_agent = Column(String(500), nullable=True)
    
    # Action
    action_code = Column(String(50), nullable=False)  # ActionCode enum
    action_label = Column(String(255), nullable=True)  # Human readable
    
    # Entity (what was acted upon)
    entity_type = Column(String(50), nullable=False)  # EntityType enum
    entity_id = Column(GUID(), nullable=False)
    entity_name = Column(String(255), nullable=True)  # Denormalized for display
    
    # Context
    parent_entity_type = Column(String(50), nullable=True)  # e.g., deal for a payment
    parent_entity_id = Column(GUID(), nullable=True)
    
    # Change Details
    old_value = Column(JSONB, nullable=True)  # Previous state
    new_value = Column(JSONB, nullable=True)  # New state
    changes = Column(JSONB, nullable=True)  # Field-level changes
    
    # Stage/Status Change (common pattern)
    old_stage = Column(String(50), nullable=True)
    new_stage = Column(String(50), nullable=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    
    # Request Context
    request_id = Column(String(50), nullable=True)  # Correlation ID
    session_id = Column(String(100), nullable=True)
    
    # Source
    source_type = Column(String(50), nullable=True)  # SourceType enum: manual/api/import/system
    source_ref = Column(String(255), nullable=True)  # API endpoint, import batch, etc.
    
    # Timestamp
    occurred_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    actor = relationship("User", foreign_keys=[actor_user_id])
    
    # Indexes
    __table_args__ = (
        Index("ix_activity_logs_org_id", "org_id"),
        Index("ix_activity_logs_actor_user_id", "actor_user_id"),
        Index("ix_activity_logs_entity", "entity_type", "entity_id"),
        Index("ix_activity_logs_action_code", "action_code"),
        Index("ix_activity_logs_occurred_at", "occurred_at"),
        Index("ix_activity_logs_entity_timeline", "entity_type", "entity_id", "occurred_at"),
    )
    
    def __repr__(self):
        return f"<ActivityLog {self.action_code} on {self.entity_type}:{self.entity_id}>"
    
    @classmethod
    def create_log(
        cls,
        org_id: str,
        actor_user_id: str,
        action_code: str,
        entity_type: str,
        entity_id: str,
        entity_name: str = None,
        old_value: dict = None,
        new_value: dict = None,
        **kwargs
    ):
        """Factory method to create activity log"""
        return cls(
            org_id=org_id,
            actor_user_id=actor_user_id,
            action_code=action_code,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            old_value=old_value,
            new_value=new_value,
            **kwargs
        )
