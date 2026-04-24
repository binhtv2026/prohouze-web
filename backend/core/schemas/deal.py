"""
ProHouzing Deal Schemas
Version: 1.0.0

DTOs for Deal management.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import Field

from .base import BaseSchema


# ═══════════════════════════════════════════════════════════════════════════════
# DEAL SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class DealBase(BaseSchema):
    """Base deal fields"""
    deal_name: Optional[str] = Field(None, max_length=255)
    customer_id: Optional[UUID] = None  # Optional for creating deals from leads


class DealCreate(DealBase):
    """Create deal request"""
    org_id: Optional[UUID] = None  # Will be set from JWT token
    deal_code: Optional[str] = Field(None, max_length=50)
    
    # Product/Project
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    
    # Source
    source_ref_type: Optional[str] = Field(None, max_length=50)
    source_lead_id: Optional[UUID] = None
    source_referral_id: Optional[UUID] = None
    
    # Sales Channel
    sales_channel: str = Field(default="direct", max_length=50)
    agency_org_id: Optional[UUID] = None
    
    # Pipeline
    current_stage: str = Field(default="new", max_length=50)
    
    # Ownership
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    collaborator_user_ids: Optional[List[UUID]] = None
    
    # Value
    deal_value: Optional[Decimal] = None
    product_price: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    discount_percent: Optional[Decimal] = None
    final_price: Optional[Decimal] = None
    currency_code: str = Field(default="VND", max_length=3)
    
    # Commission
    commission_rate: Optional[Decimal] = None
    
    # Timeline
    expected_close_date: Optional[date] = None
    
    # Tags
    tags: Optional[List[str]] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class DealUpdate(BaseSchema):
    """Update deal request"""
    deal_name: Optional[str] = Field(None, max_length=255)
    
    # Product/Project
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    
    # Sales Channel
    sales_channel: Optional[str] = Field(None, max_length=50)
    agency_org_id: Optional[UUID] = None
    
    # Ownership
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    collaborator_user_ids: Optional[List[UUID]] = None
    
    # Value
    deal_value: Optional[Decimal] = None
    product_price: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    discount_percent: Optional[Decimal] = None
    final_price: Optional[Decimal] = None
    
    # Commission
    commission_rate: Optional[Decimal] = None
    
    # Probability
    win_probability: Optional[int] = Field(None, ge=0, le=100)
    
    # Timeline
    expected_close_date: Optional[date] = None
    
    # Activity
    next_action: Optional[str] = Field(None, max_length=255)
    next_action_date: Optional[date] = None
    
    # Tags
    tags: Optional[List[str]] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Status
    status: Optional[str] = Field(None, max_length=50)
    
    # Metadata
    metadata_json: Optional[dict] = None


class DealStageChangeRequest(BaseSchema):
    """Request to change deal stage"""
    new_stage: str = Field(..., max_length=50)
    notes: Optional[str] = None
    
    # For lost stage
    lost_reason: Optional[str] = Field(None, max_length=100)
    lost_reason_detail: Optional[str] = None
    lost_to_competitor: Optional[str] = Field(None, max_length=255)


class DealResponse(DealBase):
    """Deal response"""
    id: UUID
    org_id: UUID
    deal_code: str
    
    # Product/Project
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    
    # Source
    source_ref_type: Optional[str] = None
    source_lead_id: Optional[UUID] = None
    source_referral_id: Optional[UUID] = None
    
    # Sales Channel
    sales_channel: Optional[str] = "direct"
    agency_org_id: Optional[UUID] = None
    
    # Pipeline
    current_stage: Optional[str] = "new"
    previous_stage: Optional[str] = None
    stage_changed_at: Optional[datetime] = None
    stage_history: Optional[List[dict]] = None
    
    # Ownership
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    collaborator_user_ids: Optional[List[UUID]] = None
    
    # Value
    deal_value: Optional[Decimal] = None
    product_price: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = Decimal(0)
    discount_percent: Optional[Decimal] = None
    final_price: Optional[Decimal] = None
    currency_code: Optional[str] = "VND"
    
    # Commission
    commission_rate: Optional[Decimal] = None
    estimated_commission: Optional[Decimal] = None
    
    # Probability
    win_probability: Optional[int] = None
    deal_score: Optional[int] = None
    
    # Timeline
    expected_close_date: Optional[date] = None
    actual_close_date: Optional[date] = None
    
    # Booking Info
    booking_id: Optional[UUID] = None
    booking_date: Optional[date] = None
    booking_amount: Optional[Decimal] = None
    
    # Deposit Info
    deposit_id: Optional[UUID] = None
    deposit_date: Optional[date] = None
    deposit_amount: Optional[Decimal] = None
    
    # Contract Info
    contract_id: Optional[UUID] = None
    contract_date: Optional[date] = None
    contract_signed_at: Optional[datetime] = None
    
    # Close Info
    won_at: Optional[datetime] = None
    lost_at: Optional[datetime] = None
    lost_reason: Optional[str] = None
    lost_reason_detail: Optional[str] = None
    lost_to_competitor: Optional[str] = None
    
    # Tags
    tags: Optional[List[str]] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Activity
    last_activity_at: Optional[datetime] = None
    next_action: Optional[str] = None
    next_action_date: Optional[date] = None
    
    # Status
    status: str = "active"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class DealListItem(BaseSchema):
    """Deal list item (lightweight)"""
    id: UUID
    org_id: UUID
    deal_code: str
    deal_name: Optional[str] = None
    customer_id: UUID
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    current_stage: str
    owner_user_id: Optional[UUID] = None
    deal_value: Optional[Decimal] = None
    expected_close_date: Optional[date] = None
    status: str
    created_at: datetime


class DealRef(BaseSchema):
    """Deal reference for embedding"""
    id: UUID
    deal_code: str
    deal_name: Optional[str] = None
    current_stage: str
    deal_value: Optional[Decimal] = None
