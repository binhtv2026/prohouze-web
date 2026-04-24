"""
ProHouzing Pipeline Deal Model
TASK 2 - SALES PIPELINE

Pipeline Deal = Core sales tracking entity
Each deal MUST be linked to a product
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List
from decimal import Decimal
from sqlalchemy import (
    Column, String, Text, DateTime, Boolean, ForeignKey, 
    Numeric, Integer, Index, CheckConstraint, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from core.database import Base
from config.pipeline_config import PipelineStage


class PipelineDeal(Base):
    """
    Pipeline Deal model.
    
    Each deal represents a sales opportunity linked to a specific product.
    Stage progression MUST sync with product inventory status.
    """
    __tablename__ = "pipeline_deals"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Organization
    org_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # CRITICAL: Product link (required for stages >= viewing)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True, index=True)
    
    # Customer/Lead info
    lead_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Link to CRM lead
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    # Deal info
    deal_code = Column(String(50), nullable=True, unique=True)
    title = Column(String(255), nullable=True)
    
    # Pipeline stage
    stage = Column(
        String(50), 
        nullable=False, 
        default=PipelineStage.LEAD_NEW.value,
        index=True
    )
    
    # Value
    expected_value = Column(Numeric(15, 2), nullable=True)
    actual_value = Column(Numeric(15, 2), nullable=True)
    currency = Column(String(3), default="VND")
    
    # Assignment
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    team_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Dates
    expected_close_date = Column(DateTime(timezone=True), nullable=True)
    actual_close_date = Column(DateTime(timezone=True), nullable=True)
    
    # Probability (0-100)
    probability = Column(Integer, default=0)
    
    # Stage timestamps
    stage_entered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Result
    won_reason = Column(String(255), nullable=True)
    lost_reason = Column(String(255), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    source = Column(String(50), nullable=True)  # lead source
    campaign_id = Column(UUID(as_uuid=True), nullable=True)
    tags = Column(JSONB, default=list)
    metadata_json = Column(JSONB, default=dict)
    
    # Audit
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Indexes
    __table_args__ = (
        Index("ix_pipeline_deals_org_stage", "org_id", "stage"),
        Index("ix_pipeline_deals_owner_stage", "owner_user_id", "stage"),
        Index("ix_pipeline_deals_product", "product_id"),
        Index("ix_pipeline_deals_created", "created_at"),
    )
    
    def __repr__(self):
        return f"<PipelineDeal {self.deal_code or self.id}: {self.customer_name} @ {self.stage}>"


class PipelineDealEvent(Base):
    """
    Pipeline deal event/history log.
    Tracks all stage changes and actions.
    """
    __tablename__ = "pipeline_deal_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    org_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("pipeline_deals.id"), nullable=False, index=True)
    
    # Event type
    event_type = Column(String(50), nullable=False)  # stage_change, note_added, value_updated, etc.
    
    # Stage change
    old_stage = Column(String(50), nullable=True)
    new_stage = Column(String(50), nullable=True)
    
    # Details
    description = Column(Text, nullable=True)
    metadata_json = Column(JSONB, default=dict)
    
    # Who
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # When
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (
        Index("ix_pipeline_deal_events_deal", "deal_id", "created_at"),
    )
