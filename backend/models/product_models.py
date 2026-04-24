"""
ProHouzing Product Domain Models
Prompt 5/20 - Project/Product/Inventory Domain Standardization

Canonical models for:
- Project Master
- Project Structure (Block/Tower/Floor)
- Product/Unit Master
- Inventory Status
- Price History
- Status History
- Hold/Lock
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from config.inventory_config import (
    ProductType, ProductStatus, InventoryStatus,
    ProjectStatus, StructureType
)

# ============================================
# PROJECT MASTER
# ============================================

class ProjectMasterCreate(BaseModel):
    """Create a project (internal sales project)"""
    # Identity
    code: str = Field(..., description="Mã dự án nội bộ")
    name: str = Field(..., description="Tên dự án")
    name_en: Optional[str] = None
    
    # Location
    address: str
    ward: Optional[str] = None
    district: str
    city: str
    region: Optional[str] = None  # north/central/south
    coordinates: Optional[Dict[str, float]] = None  # {lat, lng}
    
    # Developer
    developer_id: Optional[str] = None
    developer_name: str
    investor_name: Optional[str] = None
    
    # Project Info
    project_type: str = "mixed"  # residential/commercial/mixed
    total_area: float = 0  # m2
    construction_density: Optional[float] = None  # %
    
    # Timeline
    launch_date: Optional[str] = None
    construction_start: Optional[str] = None
    expected_handover: Optional[str] = None
    
    # Legal
    legal_status: Optional[str] = None
    land_use_term: Optional[str] = None  # 50 năm, lâu dài
    
    # Sales
    status: ProjectStatus = ProjectStatus.UPCOMING
    
    # Organization
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    project_manager_id: Optional[str] = None
    
    # Config
    is_active: bool = True
    is_public: bool = False
    
    # Metadata
    tags: List[str] = []
    notes: Optional[str] = None

class ProjectMasterResponse(ProjectMasterCreate):
    """Project response with computed fields"""
    id: str
    
    # Computed stats
    total_blocks: int = 0
    total_floors: int = 0
    total_units: int = 0
    available_units: int = 0
    sold_units: int = 0
    
    # Price range
    price_from: float = 0
    price_to: float = 0
    
    # Links
    admin_project_id: Optional[str] = None  # Link to CMS project
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

# ============================================
# PROJECT STRUCTURE (Block/Tower/Floor)
# ============================================

class ProjectBlockCreate(BaseModel):
    """Block/Tower in a project"""
    project_id: str
    
    code: str  # A, B, Tower1, etc.
    name: str  # Block A, Tòa A
    name_en: Optional[str] = None
    
    structure_type: StructureType = StructureType.BLOCK
    
    # Position
    phase: Optional[str] = None  # Phase 1, Giai đoạn 1
    zone: Optional[str] = None   # Khu thấp tầng, Khu cao tầng
    
    # Details
    total_floors: int = 0
    basement_floors: int = 0
    units_per_floor: int = 0
    
    # Status
    is_active: bool = True
    order: int = 0  # Display order
    
    notes: Optional[str] = None

class ProjectBlockResponse(ProjectBlockCreate):
    """Block response"""
    id: str
    
    # Computed
    total_units: int = 0
    available_units: int = 0
    
    # Timestamps
    created_at: str
    updated_at: Optional[str] = None

class ProjectFloorCreate(BaseModel):
    """Floor in a block"""
    project_id: str
    block_id: str
    
    floor_number: int  # 1, 2, 3... or -1, -2 for basement
    floor_name: str    # Tầng 1, Tầng trệt, Hầm B1
    
    # Details
    total_units: int = 0
    floor_type: str = "residential"  # residential/commercial/parking/amenity
    
    is_active: bool = True
    order: int = 0

class ProjectFloorResponse(ProjectFloorCreate):
    """Floor response"""
    id: str
    
    block_name: Optional[str] = None
    available_units: int = 0
    
    created_at: str

# ============================================
# PRODUCT/UNIT MASTER
# ============================================

class ProductCreate(BaseModel):
    """Create a product/unit"""
    # Identity
    project_id: str
    block_id: Optional[str] = None
    floor_id: Optional[str] = None
    
    code: str  # A-10-01, LK-12, BT-05
    internal_code: Optional[str] = None  # Mã nội bộ khác
    name: str  # Căn A-10-01
    
    # Type
    product_type: ProductType
    
    # Location in project
    block_code: Optional[str] = None  # A, B
    floor_number: Optional[int] = None  # 10
    unit_number: Optional[str] = None  # 01
    position: Optional[str] = None  # Góc, Giữa
    
    # Specifications
    area: float  # Diện tích thông thủy
    carpet_area: Optional[float] = None  # Diện tích tim tường
    land_area: Optional[float] = None  # Diện tích đất (villa/land)
    construction_area: Optional[float] = None  # Diện tích xây dựng
    garden_area: Optional[float] = None
    terrace_area: Optional[float] = None
    balcony_area: Optional[float] = None
    
    # Layout
    bedrooms: int = 0
    bathrooms: int = 0
    living_rooms: int = 1
    kitchens: int = 1
    
    # Orientation
    direction: Optional[str] = None  # east, west...
    view: Optional[str] = None  # city, river...
    
    # Property details
    frontage: Optional[float] = None  # Mặt tiền (m)
    depth: Optional[float] = None     # Chiều sâu (m)
    ceiling_height: Optional[float] = None
    internal_floors: int = 1  # Số tầng nội bộ (duplex=2)
    
    # Pricing (base)
    base_price: float = 0
    price_per_sqm: float = 0
    
    # Status
    product_status: ProductStatus = ProductStatus.ACTIVE
    inventory_status: InventoryStatus = InventoryStatus.NOT_FOR_SALE
    
    # Media
    floor_plan_url: Optional[str] = None
    floor_plan_3d_url: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    virtual_tour_url: Optional[str] = None
    
    # Sales info
    assigned_to: Optional[str] = None  # Sales owner
    
    # Internal
    tags: List[str] = []
    internal_notes: Optional[str] = None
    
    # Public visibility
    is_public: bool = False
    public_description: Optional[str] = None
    show_price_public: bool = True
    
    # Attributes (flexible)
    attributes: Dict[str, Any] = {}

class ProductResponse(ProductCreate):
    """Product response with computed fields"""
    id: str
    
    # Resolved names
    project_name: Optional[str] = None
    block_name: Optional[str] = None
    floor_name: Optional[str] = None
    
    # Current pricing
    listed_price: float = 0
    discount_percent: float = 0
    discount_amount: float = 0
    final_price: float = 0
    
    # Hold info (if any)
    hold_by: Optional[str] = None
    hold_by_name: Optional[str] = None
    hold_started_at: Optional[str] = None
    hold_expires_at: Optional[str] = None
    hold_reason: Optional[str] = None
    
    # Current transaction (if any)
    current_booking_id: Optional[str] = None
    current_deal_id: Optional[str] = None
    current_contract_id: Optional[str] = None
    
    # Owner info
    assigned_to_name: Optional[str] = None
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    
    # Status display
    status_label: Optional[str] = None
    status_color: Optional[str] = None

# ============================================
# PRODUCT PRICE
# ============================================

class ProductPriceCreate(BaseModel):
    """Product price entry"""
    product_id: str
    
    # Prices
    base_price: float
    listed_price: float
    price_per_sqm: float
    
    # Discounts
    discount_type: Optional[str] = None  # percent/amount
    discount_value: float = 0
    discount_reason: Optional[str] = None
    
    final_price: float
    
    # Validity
    effective_from: str
    effective_to: Optional[str] = None
    
    # Policy
    payment_policy_id: Optional[str] = None
    promotion_id: Optional[str] = None
    
    notes: Optional[str] = None

class ProductPriceResponse(ProductPriceCreate):
    """Price response"""
    id: str
    
    product_code: Optional[str] = None
    is_current: bool = False
    
    created_at: str
    created_by: Optional[str] = None

# ============================================
# PRICE HISTORY
# ============================================

class PriceHistoryEntry(BaseModel):
    """Price change history entry"""
    id: str
    product_id: str
    
    # Before/After
    old_price: float
    new_price: float
    price_type: str  # base_price, listed_price, final_price
    
    # Change info
    change_percent: float
    change_amount: float
    
    reason: Optional[str] = None
    source: str = "manual"  # manual/import/promotion/policy
    
    changed_at: str
    changed_by: Optional[str] = None
    changed_by_name: Optional[str] = None

# ============================================
# INVENTORY STATUS CHANGE
# ============================================

class StatusChangeCreate(BaseModel):
    """Request to change inventory status"""
    product_id: str
    new_status: InventoryStatus
    reason: Optional[str] = None
    
    # For hold
    hold_hours: Optional[int] = None
    hold_expires_at: Optional[str] = None
    
    # For booking/deal link
    booking_id: Optional[str] = None
    deal_id: Optional[str] = None
    customer_id: Optional[str] = None

class StatusHistoryEntry(BaseModel):
    """Status change history entry"""
    id: str
    product_id: str
    
    old_status: str
    new_status: str
    
    reason: Optional[str] = None
    source: str = "manual"  # manual/booking/deal/system/admin
    
    # Related entities
    booking_id: Optional[str] = None
    deal_id: Optional[str] = None
    customer_id: Optional[str] = None
    
    changed_at: str
    changed_by: Optional[str] = None
    changed_by_name: Optional[str] = None

# ============================================
# HOLD/LOCK
# ============================================

class HoldRequest(BaseModel):
    """Request to hold a product"""
    product_id: str
    reason: Optional[str] = None
    hold_hours: int = 24
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None

class HoldResponse(BaseModel):
    """Hold response"""
    success: bool
    product_id: str
    hold_by: str
    hold_started_at: str
    hold_expires_at: str
    message: Optional[str] = None

class ReleaseHoldRequest(BaseModel):
    """Request to release a hold"""
    product_id: str
    reason: Optional[str] = None

# ============================================
# PRODUCT SEARCH / FILTER
# ============================================

class ProductSearchRequest(BaseModel):
    """Product search/filter request"""
    # Text search
    search: Optional[str] = None
    
    # Filters
    project_id: Optional[str] = None
    block_id: Optional[str] = None
    floor_number: Optional[int] = None
    
    product_types: Optional[List[str]] = None
    inventory_statuses: Optional[List[str]] = None
    
    # Range filters
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    area_min: Optional[float] = None
    area_max: Optional[float] = None
    
    bedrooms: Optional[List[int]] = None
    directions: Optional[List[str]] = None
    views: Optional[List[str]] = None
    
    assigned_to: Optional[str] = None
    
    # Flags
    available_only: bool = False
    public_only: bool = False
    
    # Pagination
    skip: int = 0
    limit: int = 50
    
    # Sort
    sort_by: str = "code"
    sort_order: str = "asc"

class ProductSearchResponse(BaseModel):
    """Search response"""
    total: int
    items: List[ProductResponse]
    
    # Aggregations
    by_status: Dict[str, int] = {}
    by_type: Dict[str, int] = {}
    by_block: Dict[str, int] = {}
    
    price_range: Dict[str, float] = {}
    area_range: Dict[str, float] = {}

# ============================================
# BULK OPERATIONS
# ============================================

class BulkStatusUpdateRequest(BaseModel):
    """Bulk status update request"""
    product_ids: List[str]
    new_status: InventoryStatus
    reason: Optional[str] = None

class BulkPriceUpdateRequest(BaseModel):
    """Bulk price update request"""
    product_ids: List[str]
    price_adjustment_type: str  # percent/amount
    price_adjustment_value: float
    reason: Optional[str] = None

# ============================================
# INVENTORY SUMMARY
# ============================================

class InventorySummary(BaseModel):
    """Inventory summary for a project/block"""
    total_units: int = 0
    
    by_status: Dict[str, int] = {}
    by_type: Dict[str, int] = {}
    by_bedrooms: Dict[str, int] = {}
    
    available_count: int = 0
    sold_count: int = 0
    hold_count: int = 0
    
    total_value: float = 0
    available_value: float = 0
    sold_value: float = 0
    
    avg_price: float = 0
    avg_price_per_sqm: float = 0
