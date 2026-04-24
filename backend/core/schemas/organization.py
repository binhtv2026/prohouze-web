"""
ProHouzing Organization Schemas
Version: 1.0.0

DTOs for Organization and OrganizationalUnit.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import Field, EmailStr

from .base import BaseSchema, SoftDeleteSchema, CodedIDRef


# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZATION SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class OrganizationBase(BaseSchema):
    """Base organization fields"""
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    legal_name: Optional[str] = Field(None, max_length=255)
    org_type: str = Field(default="company", max_length=50)
    
    # Location
    country_code: str = Field(default="VN", max_length=3)
    province_code: Optional[str] = Field(None, max_length=10)
    district_code: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = Field(None, max_length=500)
    
    # Business Info
    tax_code: Optional[str] = Field(None, max_length=20)
    business_license: Optional[str] = Field(None, max_length=50)
    
    # Contact
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[EmailStr] = None
    website: Optional[str] = Field(None, max_length=255)
    
    # Settings
    timezone: str = Field(default="Asia/Ho_Chi_Minh", max_length=50)
    currency_code: str = Field(default="VND", max_length=3)
    locale: str = Field(default="vi-VN", max_length=10)


class OrganizationCreate(OrganizationBase):
    """Create organization request"""
    parent_org_id: Optional[UUID] = None
    settings_json: Optional[dict] = None


class OrganizationUpdate(BaseSchema):
    """Update organization request"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    legal_name: Optional[str] = Field(None, max_length=255)
    org_type: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    
    # Location
    country_code: Optional[str] = Field(None, max_length=3)
    province_code: Optional[str] = Field(None, max_length=10)
    district_code: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = Field(None, max_length=500)
    
    # Business Info
    tax_code: Optional[str] = Field(None, max_length=20)
    business_license: Optional[str] = Field(None, max_length=50)
    
    # Contact
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    contact_email: Optional[EmailStr] = None
    website: Optional[str] = Field(None, max_length=255)
    
    # Settings
    timezone: Optional[str] = Field(None, max_length=50)
    currency_code: Optional[str] = Field(None, max_length=3)
    locale: Optional[str] = Field(None, max_length=10)
    settings_json: Optional[dict] = None


class OrganizationResponse(OrganizationBase):
    """Organization response"""
    id: UUID
    parent_org_id: Optional[UUID] = None
    level: int = 0
    status: str = "active"
    settings_json: Optional[dict] = None
    
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None


class OrganizationListItem(BaseSchema):
    """Organization list item (lightweight)"""
    id: UUID
    code: str
    name: str
    org_type: str
    status: str
    parent_org_id: Optional[UUID] = None
    level: int = 0
    created_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZATIONAL UNIT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class OrganizationalUnitBase(BaseSchema):
    """Base unit fields"""
    unit_code: str = Field(..., min_length=2, max_length=50)
    unit_name: str = Field(..., min_length=2, max_length=255)
    unit_type: str = Field(default="team", max_length=50)
    description: Optional[str] = None
    sort_order: int = Field(default=0)


class OrganizationalUnitCreate(OrganizationalUnitBase):
    """Create unit request"""
    org_id: UUID
    parent_unit_id: Optional[UUID] = None
    manager_user_id: Optional[UUID] = None
    settings_json: Optional[dict] = None


class OrganizationalUnitUpdate(BaseSchema):
    """Update unit request"""
    unit_name: Optional[str] = Field(None, min_length=2, max_length=255)
    unit_type: Optional[str] = Field(None, max_length=50)
    parent_unit_id: Optional[UUID] = None
    manager_user_id: Optional[UUID] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[str] = Field(None, max_length=50)
    settings_json: Optional[dict] = None


class OrganizationalUnitResponse(OrganizationalUnitBase):
    """Unit response"""
    id: UUID
    org_id: UUID
    parent_unit_id: Optional[UUID] = None
    manager_user_id: Optional[UUID] = None
    level: int = 0
    path: Optional[str] = None
    status: str = "active"
    settings_json: Optional[dict] = None
    
    created_at: datetime
    updated_at: datetime


class OrganizationalUnitListItem(BaseSchema):
    """Unit list item (lightweight)"""
    id: UUID
    org_id: UUID
    unit_code: str
    unit_name: str
    unit_type: str
    parent_unit_id: Optional[UUID] = None
    level: int = 0
    status: str


class UnitRef(CodedIDRef):
    """Unit reference"""
    unit_type: Optional[str] = None
