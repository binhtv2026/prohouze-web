"""
ProHouzing Customer Schemas
Version: 1.0.0

DTOs for Customer, CustomerIdentity, CustomerAddress.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import Field, EmailStr

from .base import BaseSchema


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMER SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CustomerBase(BaseSchema):
    """Base customer fields"""
    full_name: str = Field(..., min_length=2, max_length=255)
    primary_phone: Optional[str] = Field(None, max_length=20)
    primary_email: Optional[EmailStr] = None
    
    # Personal
    gender: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    
    # Type & Stage
    customer_type: str = Field(default="individual", max_length=50)
    customer_stage: str = Field(default="lead", max_length=50)
    
    # Source
    lead_source_primary: Optional[str] = Field(None, max_length=100)
    lead_source_detail: Optional[str] = Field(None, max_length=255)


class CustomerCreate(CustomerBase):
    """Create customer request"""
    org_id: Optional[UUID] = None  # Will be set from JWT token
    customer_code: Optional[str] = Field(None, max_length=50)
    
    # Ownership
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    
    # Qualification
    rating_score: Optional[int] = Field(None, ge=1, le=5)
    qualification_level: Optional[str] = Field(None, max_length=50)
    
    # Preferences
    preferred_language: str = Field(default="vi", max_length=10)
    province_interest: Optional[List[str]] = None
    product_type_interest: Optional[List[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    
    # Marketing
    do_not_contact: bool = False
    do_not_email: bool = False
    do_not_call: bool = False
    
    # Company (if company type)
    company_name: Optional[str] = Field(None, max_length=255)
    company_tax_code: Optional[str] = Field(None, max_length=20)
    company_position: Optional[str] = Field(None, max_length=100)
    
    # Segmentation
    segment_code: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    
    # Notes
    note_summary: Optional[str] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class CustomerUpdate(BaseSchema):
    """Update customer request"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    primary_phone: Optional[str] = Field(None, max_length=20)
    primary_email: Optional[EmailStr] = None
    
    # Personal
    gender: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    
    # Type & Stage
    customer_type: Optional[str] = Field(None, max_length=50)
    customer_stage: Optional[str] = Field(None, max_length=50)
    
    # Source
    lead_source_primary: Optional[str] = Field(None, max_length=100)
    lead_source_detail: Optional[str] = Field(None, max_length=255)
    
    # Ownership
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    
    # Qualification
    rating_score: Optional[int] = Field(None, ge=1, le=5)
    qualification_level: Optional[str] = Field(None, max_length=50)
    
    # Preferences
    preferred_language: Optional[str] = Field(None, max_length=10)
    province_interest: Optional[List[str]] = None
    product_type_interest: Optional[List[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    
    # Marketing
    do_not_contact: Optional[bool] = None
    do_not_email: Optional[bool] = None
    do_not_call: Optional[bool] = None
    consent_status: Optional[str] = Field(None, max_length=50)
    
    # Company
    company_name: Optional[str] = Field(None, max_length=255)
    company_tax_code: Optional[str] = Field(None, max_length=20)
    company_position: Optional[str] = Field(None, max_length=100)
    
    # Segmentation
    segment_code: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    
    # Notes
    note_summary: Optional[str] = None
    
    # Status
    status: Optional[str] = Field(None, max_length=50)
    
    # Metadata
    metadata_json: Optional[dict] = None


class CustomerResponse(CustomerBase):
    """Customer response"""
    id: UUID
    org_id: UUID
    customer_code: str
    
    # Ownership
    owner_user_id: Optional[UUID] = None
    owner_unit_id: Optional[UUID] = None
    assigned_at: Optional[date] = None
    
    # Qualification
    rating_score: Optional[int] = None
    qualification_level: Optional[str] = None
    
    # Preferences
    preferred_language: str = "vi"
    province_interest: Optional[List[str]] = None
    product_type_interest: Optional[List[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    
    # Marketing
    do_not_contact: bool = False
    do_not_email: bool = False
    do_not_call: bool = False
    consent_status: str = "pending"
    consent_date: Optional[date] = None
    
    # Company
    company_name: Optional[str] = None
    company_tax_code: Optional[str] = None
    company_position: Optional[str] = None
    
    # Segmentation
    segment_code: Optional[str] = None
    tags: Optional[List[str]] = None
    
    # Notes
    note_summary: Optional[str] = None
    
    # Statistics
    total_deals: int = 0
    total_revenue: int = 0
    last_interaction_at: Optional[date] = None
    first_contact_date: Optional[date] = None
    
    # Status
    status: str = "active"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class CustomerListItem(BaseSchema):
    """Customer list item (lightweight)"""
    id: UUID
    org_id: UUID
    customer_code: str
    full_name: str
    primary_phone: Optional[str] = None
    primary_email: Optional[str] = None
    customer_type: str
    customer_stage: str
    owner_user_id: Optional[UUID] = None
    rating_score: Optional[int] = None
    status: str
    created_at: datetime


class CustomerRef(BaseSchema):
    """Customer reference for embedding"""
    id: UUID
    customer_code: str
    full_name: str
    primary_phone: Optional[str] = None
    primary_email: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMER IDENTITY SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CustomerIdentityCreate(BaseSchema):
    """Create identity request"""
    customer_id: UUID
    org_id: UUID
    identity_type: str = Field(..., max_length=50)
    identity_value_raw: str = Field(..., max_length=255)
    is_primary: bool = False


class CustomerIdentityResponse(BaseSchema):
    """Identity response"""
    id: UUID
    customer_id: UUID
    org_id: UUID
    identity_type: str
    identity_value_raw: str
    identity_value_normalized: str
    is_primary: bool
    verified_status: str = "unverified"
    verified_at: Optional[date] = None
    created_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMER ADDRESS SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CustomerAddressCreate(BaseSchema):
    """Create address request"""
    customer_id: UUID
    org_id: UUID
    address_type: str = Field(default="home", max_length=50)
    full_address: Optional[str] = Field(None, max_length=500)
    street_address: Optional[str] = Field(None, max_length=255)
    ward_code: Optional[str] = Field(None, max_length=10)
    district_code: Optional[str] = Field(None, max_length=10)
    province_code: Optional[str] = Field(None, max_length=10)
    postal_code: Optional[str] = Field(None, max_length=10)
    country_code: str = Field(default="VN", max_length=3)
    latitude: Optional[str] = Field(None, max_length=20)
    longitude: Optional[str] = Field(None, max_length=20)
    is_primary: bool = False


class CustomerAddressResponse(BaseSchema):
    """Address response"""
    id: UUID
    customer_id: UUID
    org_id: UUID
    address_type: str
    full_address: Optional[str] = None
    street_address: Optional[str] = None
    ward_code: Optional[str] = None
    district_code: Optional[str] = None
    province_code: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: str = "VN"
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    is_primary: bool = False
    created_at: datetime
