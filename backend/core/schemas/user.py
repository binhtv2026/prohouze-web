"""
ProHouzing User Schemas
Version: 1.0.0

DTOs for User and UserMembership.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import Field, EmailStr

from .base import BaseSchema, SoftDeleteSchema, CodedIDRef


# ═══════════════════════════════════════════════════════════════════════════════
# USER SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class UserBase(BaseSchema):
    """Base user fields"""
    full_name: str = Field(..., min_length=2, max_length=255)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    
    # Personal
    gender: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    
    # Employment
    user_type: str = Field(default="internal", max_length=50)
    employment_type: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    """Create user request"""
    org_id: UUID
    primary_unit_id: Optional[UUID] = None
    employee_code: Optional[str] = Field(None, max_length=50)
    password: Optional[str] = Field(None, min_length=6)
    
    # Profile
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    
    # Location
    province_code: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    
    # Settings
    preferred_language: str = Field(default="vi", max_length=10)
    timezone: str = Field(default="Asia/Ho_Chi_Minh", max_length=50)
    
    # Referral
    ref_code: Optional[str] = Field(None, max_length=50)
    referred_by_id: Optional[UUID] = None
    
    # Tags
    tags: Optional[List[str]] = None


class UserUpdate(BaseSchema):
    """Update user request"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    secondary_phone: Optional[str] = Field(None, max_length=20)
    secondary_email: Optional[EmailStr] = None
    
    # Personal
    gender: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None
    
    # Employment
    user_type: Optional[str] = Field(None, max_length=50)
    employment_type: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    primary_unit_id: Optional[UUID] = None
    
    # Profile
    avatar_url: Optional[str] = Field(None, max_length=500)
    bio: Optional[str] = None
    
    # Location
    province_code: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    
    # Settings
    preferred_language: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)
    notification_settings: Optional[dict] = None
    settings_json: Optional[dict] = None
    
    # Status
    status: Optional[str] = Field(None, max_length=50)
    
    # Tags
    tags: Optional[List[str]] = None


class UserResponse(UserBase):
    """User response"""
    id: UUID
    org_id: UUID
    primary_unit_id: Optional[UUID] = None
    employee_code: Optional[str] = None
    
    # Profile
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    
    # Contact
    secondary_phone: Optional[str] = None
    secondary_email: Optional[str] = None
    
    # Location
    province_code: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    
    # Dates
    joined_at: Optional[date] = None
    left_at: Optional[date] = None
    last_login_at: Optional[date] = None
    last_active_at: Optional[date] = None
    
    # Performance
    total_deals: int = 0
    total_leads: int = 0
    total_revenue: int = 0
    
    # Referral
    ref_code: Optional[str] = None
    referred_by_id: Optional[UUID] = None
    
    # Settings
    preferred_language: str = "vi"
    timezone: str = "Asia/Ho_Chi_Minh"
    
    # Tags
    tags: Optional[List[str]] = None
    
    # Status
    status: str = "active"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class UserListItem(BaseSchema):
    """User list item (lightweight)"""
    id: UUID
    org_id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    user_type: str
    job_title: Optional[str] = None
    status: str
    created_at: datetime


class UserRef(BaseSchema):
    """User reference for embedding"""
    id: UUID
    full_name: str
    email: str
    avatar_url: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# USER MEMBERSHIP SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class UserMembershipBase(BaseSchema):
    """Base membership fields"""
    role_code: str = Field(..., max_length=50)
    scope_type: str = Field(default="unit", max_length=50)
    is_primary: bool = False


class UserMembershipCreate(UserMembershipBase):
    """Create membership request"""
    user_id: UUID
    org_id: UUID
    unit_id: Optional[UUID] = None
    scope_id: Optional[UUID] = None
    active_from: Optional[date] = None
    active_to: Optional[date] = None
    permissions_json: Optional[dict] = None


class UserMembershipUpdate(BaseSchema):
    """Update membership request"""
    role_code: Optional[str] = Field(None, max_length=50)
    scope_type: Optional[str] = Field(None, max_length=50)
    scope_id: Optional[UUID] = None
    is_primary: Optional[bool] = None
    active_from: Optional[date] = None
    active_to: Optional[date] = None
    status: Optional[str] = Field(None, max_length=50)
    permissions_json: Optional[dict] = None


class UserMembershipResponse(UserMembershipBase):
    """Membership response"""
    id: UUID
    user_id: UUID
    org_id: UUID
    unit_id: Optional[UUID] = None
    scope_id: Optional[UUID] = None
    active_from: Optional[date] = None
    active_to: Optional[date] = None
    status: str = "active"
    permissions_json: Optional[dict] = None
    
    created_at: datetime
    updated_at: datetime
