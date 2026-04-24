"""
ProHouzing Lead Schemas
Version: 1.0.0

DTOs for Lead management.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import Field, EmailStr

from .base import BaseSchema


# ═══════════════════════════════════════════════════════════════════════════════
# LEAD SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class LeadBase(BaseSchema):
    """Base lead fields"""
    contact_name: str = Field(..., min_length=2, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[EmailStr] = None
    
    # Source
    source_channel: str = Field(..., max_length=50)


class LeadCreate(LeadBase):
    """Create lead request"""
    org_id: Optional[UUID] = None  # Will be set from JWT token
    lead_code: Optional[str] = Field(None, max_length=50)
    customer_id: Optional[UUID] = None
    
    # Source details
    source_campaign: Optional[str] = Field(None, max_length=255)
    source_medium: Optional[str] = Field(None, max_length=100)
    source_content: Optional[str] = Field(None, max_length=255)
    utm_source: Optional[str] = Field(None, max_length=100)
    utm_medium: Optional[str] = Field(None, max_length=100)
    utm_campaign: Optional[str] = Field(None, max_length=255)
    utm_term: Optional[str] = Field(None, max_length=255)
    utm_content: Optional[str] = Field(None, max_length=255)
    
    # Referral
    referrer_user_id: Optional[UUID] = None
    referrer_customer_id: Optional[UUID] = None
    referrer_code: Optional[str] = Field(None, max_length=50)
    
    # Interest
    project_interest_id: Optional[UUID] = None
    product_type_interest: Optional[List[str]] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    
    # Assignment
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    
    # Communication
    preferred_contact_method: Optional[str] = Field(None, max_length=50)
    preferred_contact_time: Optional[str] = Field(None, max_length=100)
    
    # Notes
    notes: Optional[str] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class LeadUpdate(BaseSchema):
    """Update lead request"""
    contact_name: Optional[str] = Field(None, min_length=2, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[EmailStr] = None
    
    # Customer link
    customer_id: Optional[UUID] = None
    
    # Interest
    project_interest_id: Optional[UUID] = None
    product_type_interest: Optional[List[str]] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    
    # Qualification
    lead_status: Optional[str] = Field(None, max_length=50)
    intent_level: Optional[str] = Field(None, max_length=50)
    qualification_score: Optional[int] = Field(None, ge=0, le=100)
    qualification_notes: Optional[str] = None
    
    # Assignment
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    
    # Loss
    lost_reason: Optional[str] = Field(None, max_length=100)
    lost_reason_detail: Optional[str] = None
    
    # Communication
    preferred_contact_method: Optional[str] = Field(None, max_length=50)
    preferred_contact_time: Optional[str] = Field(None, max_length=100)
    do_not_contact: Optional[bool] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Status
    status: Optional[str] = Field(None, max_length=50)
    
    # Metadata
    metadata_json: Optional[dict] = None


class LeadResponse(LeadBase):
    """Lead response"""
    id: UUID
    org_id: UUID
    lead_code: str
    customer_id: Optional[UUID] = None
    
    # Source details
    source_campaign: Optional[str] = None
    source_medium: Optional[str] = None
    source_content: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    
    # Referral
    referrer_user_id: Optional[UUID] = None
    referrer_customer_id: Optional[UUID] = None
    referrer_code: Optional[str] = None
    
    # Interest
    project_interest_id: Optional[UUID] = None
    product_type_interest: Optional[List[str]] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    
    # Qualification
    lead_status: str = "new"
    intent_level: Optional[str] = None
    qualification_score: Optional[int] = None
    qualification_notes: Optional[str] = None
    
    # Assignment
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    
    # Timeline
    captured_at: datetime
    first_contacted_at: Optional[datetime] = None
    qualified_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    # Conversion
    converted_to_deal_id: Optional[UUID] = None
    
    # Loss
    lost_reason: Optional[str] = None
    lost_reason_detail: Optional[str] = None
    
    # Communication
    preferred_contact_method: Optional[str] = None
    preferred_contact_time: Optional[str] = None
    do_not_contact: Optional[bool] = False
    
    # Statistics
    contact_attempts: Optional[int] = 0
    last_contact_at: Optional[datetime] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Status
    status: str = "active"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class LeadListItem(BaseSchema):
    """Lead list item (lightweight)"""
    id: UUID
    org_id: UUID
    lead_code: str
    contact_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    source_channel: str
    lead_status: str
    intent_level: Optional[str] = None
    owner_user_id: Optional[UUID] = None
    captured_at: datetime
    status: str


class LeadConvertRequest(BaseSchema):
    """Request to convert lead to deal"""
    create_customer: bool = True
    customer_id: Optional[UUID] = None  # If customer already exists
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    deal_value: Optional[Decimal] = None
    owner_user_id: Optional[UUID] = None
    notes: Optional[str] = None
