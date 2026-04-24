"""
ProHouzing Product Schemas
Version: 1.0.0

DTOs for Project, ProjectStructure, Product.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import Field

from .base import BaseSchema


# ═══════════════════════════════════════════════════════════════════════════════
# PROJECT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ProjectBase(BaseSchema):
    """Base project fields"""
    project_code: str = Field(..., min_length=2, max_length=50)
    project_name: str = Field(..., min_length=2, max_length=255)
    project_type: str = Field(..., max_length=50)
    
    # Developer
    developer_name: Optional[str] = Field(None, max_length=255)
    
    # Status
    legal_status: Optional[str] = Field(None, max_length=50)
    selling_status: str = Field(default="upcoming", max_length=50)
    
    # Location
    province_code: Optional[str] = Field(None, max_length=10)
    district_code: Optional[str] = Field(None, max_length=10)
    ward_code: Optional[str] = Field(None, max_length=10)
    address_line: Optional[str] = Field(None, max_length=500)


class ProjectCreate(ProjectBase):
    """Create project request"""
    org_id: UUID
    developer_id: Optional[UUID] = None
    
    # Dates
    launch_date: Optional[date] = None
    presale_date: Optional[date] = None
    handover_date: Optional[date] = None
    completion_date: Optional[date] = None
    
    # Location
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Pricing
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    avg_price_per_sqm: Optional[Decimal] = None
    currency_code: str = Field(default="VND", max_length=3)
    
    # Commission
    commission_rate: Optional[Decimal] = None
    commission_policy: Optional[str] = None
    
    # Description
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    
    # Media
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    images: Optional[List[dict]] = None
    videos: Optional[List[dict]] = None
    documents: Optional[List[dict]] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class ProjectUpdate(BaseSchema):
    """Update project request"""
    project_name: Optional[str] = Field(None, min_length=2, max_length=255)
    project_type: Optional[str] = Field(None, max_length=50)
    developer_name: Optional[str] = Field(None, max_length=255)
    developer_id: Optional[UUID] = None
    
    # Status
    legal_status: Optional[str] = Field(None, max_length=50)
    selling_status: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    
    # Dates
    launch_date: Optional[date] = None
    presale_date: Optional[date] = None
    handover_date: Optional[date] = None
    completion_date: Optional[date] = None
    
    # Location
    province_code: Optional[str] = Field(None, max_length=10)
    district_code: Optional[str] = Field(None, max_length=10)
    ward_code: Optional[str] = Field(None, max_length=10)
    address_line: Optional[str] = Field(None, max_length=500)
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Pricing
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    avg_price_per_sqm: Optional[Decimal] = None
    
    # Commission
    commission_rate: Optional[Decimal] = None
    commission_policy: Optional[str] = None
    
    # Description
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    
    # Media
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    images: Optional[List[dict]] = None
    videos: Optional[List[dict]] = None
    documents: Optional[List[dict]] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class ProjectResponse(ProjectBase):
    """Project response"""
    id: UUID
    org_id: UUID
    developer_id: Optional[UUID] = None
    
    # Dates
    launch_date: Optional[date] = None
    presale_date: Optional[date] = None
    handover_date: Optional[date] = None
    completion_date: Optional[date] = None
    
    # Location
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Inventory
    total_units: int = 0
    available_units: int = 0
    sold_units: int = 0
    
    # Pricing
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    avg_price_per_sqm: Optional[Decimal] = None
    currency_code: str = "VND"
    
    # Commission
    commission_rate: Optional[Decimal] = None
    commission_policy: Optional[str] = None
    
    # Description
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    
    # Media
    thumbnail_url: Optional[str] = None
    images: Optional[List[dict]] = None
    videos: Optional[List[dict]] = None
    documents: Optional[List[dict]] = None
    
    # Status
    status: str = "active"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class ProjectListItem(BaseSchema):
    """Project list item (lightweight)"""
    id: UUID
    org_id: UUID
    project_code: str
    project_name: str
    project_type: str
    selling_status: str
    province_code: Optional[str] = None
    thumbnail_url: Optional[str] = None
    total_units: int = 0
    available_units: int = 0
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    status: str
    created_at: datetime


class ProjectRef(BaseSchema):
    """Project reference for embedding"""
    id: UUID
    project_code: str
    project_name: str
    thumbnail_url: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ProductBase(BaseSchema):
    """Base product fields"""
    product_code: str = Field(..., min_length=2, max_length=50)
    product_type: str = Field(..., max_length=50)
    title: Optional[str] = Field(None, max_length=255)


class ProductCreate(ProductBase):
    """Create product request"""
    org_id: UUID
    project_id: UUID
    project_structure_id: Optional[UUID] = None
    external_code: Optional[str] = Field(None, max_length=50)
    
    # Specifications
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    floor_no: Optional[str] = Field(None, max_length=10)
    unit_no: Optional[str] = Field(None, max_length=20)
    
    # Area
    land_area: Optional[Decimal] = None
    built_area: Optional[Decimal] = None
    carpet_area: Optional[Decimal] = None
    
    # Position
    direction: Optional[str] = Field(None, max_length=10)
    view: Optional[str] = Field(None, max_length=100)
    
    # Legal
    legal_type: Optional[str] = Field(None, max_length=50)
    handover_standard: Optional[str] = Field(None, max_length=50)
    
    # Pricing
    list_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    price_per_sqm: Optional[Decimal] = None
    currency_code: str = Field(default="VND", max_length=3)
    
    # Status
    inventory_status: str = Field(default="available", max_length=50)
    business_status: str = Field(default="active", max_length=50)
    availability_status: str = Field(default="open", max_length=50)
    
    # Media
    images: Optional[List[dict]] = None
    floor_plan_url: Optional[str] = Field(None, max_length=500)
    video_url: Optional[str] = Field(None, max_length=500)
    virtual_tour_url: Optional[str] = Field(None, max_length=500)
    
    # Features
    features: Optional[List[str]] = None
    
    # Description
    description: Optional[str] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class ProductUpdate(BaseSchema):
    """Update product request"""
    title: Optional[str] = Field(None, max_length=255)
    product_type: Optional[str] = Field(None, max_length=50)
    project_structure_id: Optional[UUID] = None
    external_code: Optional[str] = Field(None, max_length=50)
    
    # Specifications
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    floor_no: Optional[str] = Field(None, max_length=10)
    unit_no: Optional[str] = Field(None, max_length=20)
    
    # Area
    land_area: Optional[Decimal] = None
    built_area: Optional[Decimal] = None
    carpet_area: Optional[Decimal] = None
    
    # Position
    direction: Optional[str] = Field(None, max_length=10)
    view: Optional[str] = Field(None, max_length=100)
    
    # Legal
    legal_type: Optional[str] = Field(None, max_length=50)
    handover_standard: Optional[str] = Field(None, max_length=50)
    
    # Pricing
    list_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    price_per_sqm: Optional[Decimal] = None
    
    # Status
    inventory_status: Optional[str] = Field(None, max_length=50)
    business_status: Optional[str] = Field(None, max_length=50)
    availability_status: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    
    # Media
    images: Optional[List[dict]] = None
    floor_plan_url: Optional[str] = Field(None, max_length=500)
    video_url: Optional[str] = Field(None, max_length=500)
    virtual_tour_url: Optional[str] = Field(None, max_length=500)
    
    # Features
    features: Optional[List[str]] = None
    
    # Description
    description: Optional[str] = None
    
    # Metadata
    metadata_json: Optional[dict] = None


class ProductResponse(ProductBase):
    """Product response"""
    id: UUID
    org_id: UUID
    project_id: UUID
    project_structure_id: Optional[UUID] = None
    external_code: Optional[str] = None
    
    # Specifications
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    floor_no: Optional[str] = None
    unit_no: Optional[str] = None
    
    # Area
    land_area: Optional[Decimal] = None
    built_area: Optional[Decimal] = None
    carpet_area: Optional[Decimal] = None
    
    # Position
    direction: Optional[str] = None
    view: Optional[str] = None
    
    # Legal
    legal_type: Optional[str] = None
    handover_standard: Optional[str] = None
    
    # Pricing
    list_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    price_per_sqm: Optional[Decimal] = None
    currency_code: str = "VND"
    
    # Status
    inventory_status: str = "available"
    business_status: str = "active"
    availability_status: str = "open"
    
    # Current Holder
    current_holder_type: str = "none"
    current_holder_id: Optional[UUID] = None
    current_deal_id: Optional[UUID] = None
    
    # Dates
    released_for_sale_at: Optional[date] = None
    sold_at: Optional[date] = None
    
    # Lock
    locked_until: Optional[date] = None
    lock_reason: Optional[str] = None
    locked_by: Optional[UUID] = None
    
    # Media
    images: Optional[List[dict]] = None
    floor_plan_url: Optional[str] = None
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    
    # Features
    features: Optional[List[str]] = None
    
    # Description
    description: Optional[str] = None
    
    # Status
    status: str = "active"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class ProductListItem(BaseSchema):
    """Product list item (lightweight)"""
    id: UUID
    org_id: UUID
    project_id: UUID
    product_code: str
    product_type: str
    title: Optional[str] = None
    bedroom_count: Optional[int] = None
    built_area: Optional[Decimal] = None
    list_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    inventory_status: str
    availability_status: str
    status: str
    created_at: datetime


class ProductRef(BaseSchema):
    """Product reference for embedding"""
    id: UUID
    product_code: str
    product_type: str
    title: Optional[str] = None
    list_price: Optional[Decimal] = None
