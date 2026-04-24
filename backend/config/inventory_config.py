"""
ProHouzing Inventory Configuration
Prompt 5/20 - Project/Product/Inventory Domain Standardization

SINGLE SOURCE OF TRUTH for:
- Product types
- Product status lifecycle
- Inventory availability status
- Price model
- Structure types (Block/Tower/Floor)
- Search/filter configuration
- UI display configuration
"""

from enum import Enum
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

# ============================================
# PRODUCT TYPES
# ============================================

class ProductType(str, Enum):
    """Types of real estate products for primary market"""
    APARTMENT = "apartment"       # Căn hộ
    VILLA = "villa"              # Biệt thự
    TOWNHOUSE = "townhouse"       # Nhà phố liền kề
    SHOPHOUSE = "shophouse"       # Shophouse
    DUPLEX = "duplex"            # Căn hộ duplex
    PENTHOUSE = "penthouse"      # Penthouse
    LAND = "land"                # Đất nền
    OFFICE = "office"            # Văn phòng
    RETAIL = "retail"            # Mặt bằng kinh doanh

PRODUCT_TYPE_CONFIG: Dict[str, Dict[str, Any]] = {
    ProductType.APARTMENT.value: {
        "name": "Căn hộ",
        "name_en": "Apartment",
        "icon": "Building",
        "color": "#3b82f6",  # blue
        "has_floor": True,
        "has_block": True,
        "typical_fields": ["bedrooms", "bathrooms", "direction", "view", "balcony"]
    },
    ProductType.VILLA.value: {
        "name": "Biệt thự",
        "name_en": "Villa",
        "icon": "Home",
        "color": "#8b5cf6",  # violet
        "has_floor": False,
        "has_block": True,
        "typical_fields": ["land_area", "construction_area", "floors", "garden", "pool"]
    },
    ProductType.TOWNHOUSE.value: {
        "name": "Nhà phố",
        "name_en": "Townhouse",
        "icon": "Home",
        "color": "#06b6d4",  # cyan
        "has_floor": False,
        "has_block": True,
        "typical_fields": ["land_area", "construction_area", "floors", "frontage"]
    },
    ProductType.SHOPHOUSE.value: {
        "name": "Shophouse",
        "name_en": "Shophouse",
        "icon": "Store",
        "color": "#f59e0b",  # amber
        "has_floor": True,
        "has_block": True,
        "typical_fields": ["land_area", "construction_area", "floors", "frontage", "commercial_area"]
    },
    ProductType.DUPLEX.value: {
        "name": "Duplex",
        "name_en": "Duplex",
        "icon": "Layers",
        "color": "#6366f1",  # indigo
        "has_floor": True,
        "has_block": True,
        "typical_fields": ["bedrooms", "bathrooms", "direction", "internal_floors"]
    },
    ProductType.PENTHOUSE.value: {
        "name": "Penthouse",
        "name_en": "Penthouse",
        "icon": "Crown",
        "color": "#ec4899",  # pink
        "has_floor": True,
        "has_block": True,
        "typical_fields": ["bedrooms", "bathrooms", "terrace_area", "private_pool"]
    },
    ProductType.LAND.value: {
        "name": "Đất nền",
        "name_en": "Land",
        "icon": "Map",
        "color": "#84cc16",  # lime
        "has_floor": False,
        "has_block": True,
        "typical_fields": ["land_area", "frontage", "depth", "land_use"]
    },
    ProductType.OFFICE.value: {
        "name": "Văn phòng",
        "name_en": "Office",
        "icon": "Briefcase",
        "color": "#64748b",  # slate
        "has_floor": True,
        "has_block": True,
        "typical_fields": ["area", "fit_out_status"]
    },
    ProductType.RETAIL.value: {
        "name": "Mặt bằng",
        "name_en": "Retail",
        "icon": "ShoppingBag",
        "color": "#f97316",  # orange
        "has_floor": True,
        "has_block": True,
        "typical_fields": ["area", "frontage", "ceiling_height"]
    },
}

# ============================================
# PRODUCT STATUS LIFECYCLE
# ============================================

class ProductStatus(str, Enum):
    """
    Product master status - represents the administrative state of product.
    This is different from InventoryStatus which represents sales availability.
    """
    DRAFT = "draft"                    # Mới tạo, chưa hoàn thiện
    ACTIVE = "active"                  # Đang hoạt động
    INACTIVE = "inactive"              # Tạm ẩn/dừng
    ARCHIVED = "archived"              # Đã lưu trữ

class InventoryStatus(str, Enum):
    """
    Inventory/Sales availability status - represents sales state.
    This is the CORE status for sales operations.
    """
    NOT_FOR_SALE = "not_for_sale"      # Chưa mở bán
    AVAILABLE = "available"            # Còn hàng - có thể bán
    HOLD = "hold"                      # Đang giữ tạm (có thời hạn)
    BOOKING_PENDING = "booking_pending" # Đang chờ xác nhận booking
    BOOKED = "booked"                  # Đã booking xác nhận
    RESERVED = "reserved"              # Đã đặt chỗ chính thức
    DEPOSITED = "deposited"            # Đã đặt cọc
    CONTRACT_SIGNING = "contract_signing" # Đang ký hợp đồng
    SOLD = "sold"                      # Đã bán - hoàn tất
    BLOCKED = "blocked"                # Khóa - không cho bán (admin/legal)

# Status configuration with full metadata
INVENTORY_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    InventoryStatus.NOT_FOR_SALE.value: {
        "name": "Chưa mở bán",
        "name_en": "Not for Sale",
        "color": "#94a3b8",      # slate-400
        "bg_color": "#f1f5f9",   # slate-100
        "icon": "Lock",
        "order": 1,
        "is_sellable": False,
        "show_in_public": False,
        "can_book": False,
        "can_hold": False,
        "description": "Sản phẩm chưa được mở bán, chờ quyết định từ CĐT/Admin"
    },
    InventoryStatus.AVAILABLE.value: {
        "name": "Còn hàng",
        "name_en": "Available",
        "color": "#22c55e",      # green-500
        "bg_color": "#dcfce7",   # green-100
        "icon": "CheckCircle",
        "order": 2,
        "is_sellable": True,
        "show_in_public": True,
        "can_book": True,
        "can_hold": True,
        "description": "Sản phẩm đang mở bán, sales có thể thực hiện giao dịch"
    },
    InventoryStatus.HOLD.value: {
        "name": "Đang giữ",
        "name_en": "On Hold",
        "color": "#f59e0b",      # amber-500
        "bg_color": "#fef3c7",   # amber-100
        "icon": "Clock",
        "order": 3,
        "is_sellable": False,
        "show_in_public": True,   # Show as "Đang giữ"
        "can_book": False,
        "can_hold": False,
        "has_expiry": True,
        "default_hold_hours": 24,
        "description": "Đang được giữ tạm thời bởi sales, có thời hạn tự động release"
    },
    InventoryStatus.BOOKING_PENDING.value: {
        "name": "Chờ booking",
        "name_en": "Booking Pending",
        "color": "#3b82f6",      # blue-500
        "bg_color": "#dbeafe",   # blue-100
        "icon": "Clock",
        "order": 4,
        "is_sellable": False,
        "show_in_public": True,
        "can_book": False,
        "can_hold": False,
        "description": "Đã có yêu cầu booking, đang chờ xác nhận"
    },
    InventoryStatus.BOOKED.value: {
        "name": "Đã booking",
        "name_en": "Booked",
        "color": "#8b5cf6",      # violet-500
        "bg_color": "#ede9fe",   # violet-100
        "icon": "BookCheck",
        "order": 5,
        "is_sellable": False,
        "show_in_public": True,
        "can_book": False,
        "can_hold": False,
        "description": "Booking đã được xác nhận, chờ đặt cọc"
    },
    InventoryStatus.RESERVED.value: {
        "name": "Đã giữ chỗ",
        "name_en": "Reserved",
        "color": "#06b6d4",      # cyan-500
        "bg_color": "#cffafe",   # cyan-100
        "icon": "Bookmark",
        "order": 6,
        "is_sellable": False,
        "show_in_public": True,
        "can_book": False,
        "can_hold": False,
        "description": "Đã đặt chỗ chính thức theo quy trình của CĐT"
    },
    InventoryStatus.DEPOSITED.value: {
        "name": "Đã đặt cọc",
        "name_en": "Deposited",
        "color": "#0ea5e9",      # sky-500
        "bg_color": "#e0f2fe",   # sky-100
        "icon": "Wallet",
        "order": 7,
        "is_sellable": False,
        "show_in_public": True,
        "can_book": False,
        "can_hold": False,
        "description": "Khách đã đặt cọc, chờ ký hợp đồng"
    },
    InventoryStatus.CONTRACT_SIGNING.value: {
        "name": "Đang ký HĐ",
        "name_en": "Contract Signing",
        "color": "#6366f1",      # indigo-500
        "bg_color": "#e0e7ff",   # indigo-100
        "icon": "FileSignature",
        "order": 8,
        "is_sellable": False,
        "show_in_public": True,
        "can_book": False,
        "can_hold": False,
        "description": "Đang trong quá trình ký kết hợp đồng mua bán"
    },
    InventoryStatus.SOLD.value: {
        "name": "Đã bán",
        "name_en": "Sold",
        "color": "#ef4444",      # red-500
        "bg_color": "#fee2e2",   # red-100
        "icon": "CheckCheck",
        "order": 9,
        "is_sellable": False,
        "show_in_public": True,
        "can_book": False,
        "can_hold": False,
        "description": "Giao dịch hoàn tất, đã ký hợp đồng mua bán"
    },
    InventoryStatus.BLOCKED.value: {
        "name": "Đã khóa",
        "name_en": "Blocked",
        "color": "#64748b",      # slate-500
        "bg_color": "#f1f5f9",   # slate-100
        "icon": "Ban",
        "order": 10,
        "is_sellable": False,
        "show_in_public": False,
        "can_book": False,
        "can_hold": False,
        "description": "Bị khóa bởi Admin/CĐT/Pháp lý, không được phép giao dịch"
    },
}

# Status transition rules
INVENTORY_STATUS_TRANSITIONS: Dict[str, List[str]] = {
    InventoryStatus.NOT_FOR_SALE.value: [
        InventoryStatus.AVAILABLE.value,
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.AVAILABLE.value: [
        InventoryStatus.HOLD.value,
        InventoryStatus.BOOKING_PENDING.value,
        InventoryStatus.BOOKED.value,
        InventoryStatus.BLOCKED.value,
        InventoryStatus.NOT_FOR_SALE.value,
    ],
    InventoryStatus.HOLD.value: [
        InventoryStatus.AVAILABLE.value,      # Release / expired
        InventoryStatus.BOOKING_PENDING.value,
        InventoryStatus.BOOKED.value,
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.BOOKING_PENDING.value: [
        InventoryStatus.BOOKED.value,         # Confirmed
        InventoryStatus.AVAILABLE.value,      # Rejected / cancelled
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.BOOKED.value: [
        InventoryStatus.RESERVED.value,
        InventoryStatus.DEPOSITED.value,
        InventoryStatus.AVAILABLE.value,      # Cancelled
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.RESERVED.value: [
        InventoryStatus.DEPOSITED.value,
        InventoryStatus.AVAILABLE.value,      # Cancelled
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.DEPOSITED.value: [
        InventoryStatus.CONTRACT_SIGNING.value,
        InventoryStatus.AVAILABLE.value,      # Cancelled (rare)
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.CONTRACT_SIGNING.value: [
        InventoryStatus.SOLD.value,           # Completed
        InventoryStatus.DEPOSITED.value,      # Rollback
        InventoryStatus.BLOCKED.value,
    ],
    InventoryStatus.SOLD.value: [
        # Terminal state - no transitions normally
        InventoryStatus.BLOCKED.value,        # Legal issues
    ],
    InventoryStatus.BLOCKED.value: [
        InventoryStatus.AVAILABLE.value,      # Unblock
        InventoryStatus.NOT_FOR_SALE.value,
    ],
}

# ============================================
# PROJECT STATUS
# ============================================

class ProjectStatus(str, Enum):
    """Project sales status"""
    UPCOMING = "upcoming"          # Sắp mở bán
    OPENING = "opening"            # Đang mở bán
    SELLING = "selling"            # Đang bán
    LIMITED = "limited"            # Còn ít hàng
    SOLD_OUT = "sold_out"          # Hết hàng
    COMPLETED = "completed"        # Đã bàn giao
    SUSPENDED = "suspended"        # Tạm dừng

PROJECT_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    ProjectStatus.UPCOMING.value: {
        "name": "Sắp mở bán",
        "color": "#f59e0b",
        "bg_color": "#fef3c7",
    },
    ProjectStatus.OPENING.value: {
        "name": "Đang mở bán",
        "color": "#22c55e",
        "bg_color": "#dcfce7",
    },
    ProjectStatus.SELLING.value: {
        "name": "Đang bán",
        "color": "#3b82f6",
        "bg_color": "#dbeafe",
    },
    ProjectStatus.LIMITED.value: {
        "name": "Còn ít",
        "color": "#ef4444",
        "bg_color": "#fee2e2",
    },
    ProjectStatus.SOLD_OUT.value: {
        "name": "Hết hàng",
        "color": "#64748b",
        "bg_color": "#f1f5f9",
    },
    ProjectStatus.COMPLETED.value: {
        "name": "Đã bàn giao",
        "color": "#8b5cf6",
        "bg_color": "#ede9fe",
    },
    ProjectStatus.SUSPENDED.value: {
        "name": "Tạm dừng",
        "color": "#94a3b8",
        "bg_color": "#f1f5f9",
    },
}

# ============================================
# STRUCTURE TYPES
# ============================================

class StructureType(str, Enum):
    """Types of project structure units"""
    PHASE = "phase"              # Phân kỳ
    ZONE = "zone"                # Phân khu
    BLOCK = "block"              # Block / Tòa
    TOWER = "tower"              # Tower (alias of block)
    BUILDING = "building"        # Tòa nhà
    FLOOR = "floor"              # Tầng

# ============================================
# DIRECTION OPTIONS
# ============================================

DIRECTION_OPTIONS = [
    {"code": "east", "name": "Đông", "name_en": "East"},
    {"code": "west", "name": "Tây", "name_en": "West"},
    {"code": "south", "name": "Nam", "name_en": "South"},
    {"code": "north", "name": "Bắc", "name_en": "North"},
    {"code": "northeast", "name": "Đông Bắc", "name_en": "Northeast"},
    {"code": "northwest", "name": "Tây Bắc", "name_en": "Northwest"},
    {"code": "southeast", "name": "Đông Nam", "name_en": "Southeast"},
    {"code": "southwest", "name": "Tây Nam", "name_en": "Southwest"},
]

# ============================================
# VIEW OPTIONS
# ============================================

VIEW_OPTIONS = [
    {"code": "city", "name": "View thành phố", "name_en": "City View"},
    {"code": "river", "name": "View sông", "name_en": "River View"},
    {"code": "sea", "name": "View biển", "name_en": "Sea View"},
    {"code": "pool", "name": "View hồ bơi", "name_en": "Pool View"},
    {"code": "garden", "name": "View vườn", "name_en": "Garden View"},
    {"code": "park", "name": "View công viên", "name_en": "Park View"},
    {"code": "mountain", "name": "View núi", "name_en": "Mountain View"},
    {"code": "lake", "name": "View hồ", "name_en": "Lake View"},
    {"code": "street", "name": "View đường", "name_en": "Street View"},
    {"code": "internal", "name": "View nội khu", "name_en": "Internal View"},
]

# ============================================
# PRICE MODEL
# ============================================

class PriceType(str, Enum):
    """Types of prices"""
    BASE_PRICE = "base_price"            # Giá gốc
    LISTED_PRICE = "listed_price"        # Giá niêm yết
    DEVELOPER_PRICE = "developer_price"  # Giá CĐT
    SALES_PRICE = "sales_price"          # Giá bán
    PROMOTION_PRICE = "promotion_price"  # Giá khuyến mãi
    FINAL_PRICE = "final_price"          # Giá sau chiết khấu

# ============================================
# SEARCH / FILTER CONFIG
# ============================================

PRODUCT_FILTER_FIELDS = [
    {"field": "project_id", "label": "Dự án", "type": "select"},
    {"field": "block_id", "label": "Block/Tòa", "type": "select", "depends_on": "project_id"},
    {"field": "floor", "label": "Tầng", "type": "range"},
    {"field": "product_type", "label": "Loại sản phẩm", "type": "multi_select"},
    {"field": "inventory_status", "label": "Trạng thái", "type": "multi_select"},
    {"field": "price_range", "label": "Khoảng giá", "type": "range"},
    {"field": "area_range", "label": "Diện tích", "type": "range"},
    {"field": "bedrooms", "label": "Số phòng ngủ", "type": "select"},
    {"field": "direction", "label": "Hướng", "type": "multi_select"},
    {"field": "view", "label": "View", "type": "multi_select"},
    {"field": "assigned_to", "label": "Người phụ trách", "type": "select"},
]

PRODUCT_SEARCH_FIELDS = [
    "code",
    "name",
    "internal_code",
    "project_name",
    "block_name",
    "tags",
]

# Saved views
DEFAULT_SAVED_VIEWS = [
    {"id": "available", "name": "Hàng còn bán", "filter": {"inventory_status": ["available"]}},
    {"id": "on_hold", "name": "Đang giữ", "filter": {"inventory_status": ["hold"]}},
    {"id": "booking", "name": "Đang booking", "filter": {"inventory_status": ["booking_pending", "booked"]}},
    {"id": "deposited", "name": "Đã cọc", "filter": {"inventory_status": ["deposited", "contract_signing"]}},
    {"id": "sold", "name": "Đã bán", "filter": {"inventory_status": ["sold"]}},
    {"id": "blocked", "name": "Đã khóa", "filter": {"inventory_status": ["blocked"]}},
]

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_inventory_status_config(status: str) -> Dict[str, Any]:
    """Get configuration for an inventory status"""
    return INVENTORY_STATUS_CONFIG.get(status, {})

def get_product_type_config(product_type: str) -> Dict[str, Any]:
    """Get configuration for a product type"""
    return PRODUCT_TYPE_CONFIG.get(product_type, {})

def can_transition_status(from_status: str, to_status: str) -> bool:
    """Check if status transition is allowed"""
    allowed = INVENTORY_STATUS_TRANSITIONS.get(from_status, [])
    return to_status in allowed

def get_sellable_statuses() -> List[str]:
    """Get list of statuses that allow sales actions"""
    return [s for s, c in INVENTORY_STATUS_CONFIG.items() if c.get("is_sellable", False)]

def get_public_statuses() -> List[str]:
    """Get list of statuses visible to public"""
    return [s for s, c in INVENTORY_STATUS_CONFIG.items() if c.get("show_in_public", False)]

def get_bookable_statuses() -> List[str]:
    """Get list of statuses that allow booking"""
    return [s for s, c in INVENTORY_STATUS_CONFIG.items() if c.get("can_book", False)]

def get_holdable_statuses() -> List[str]:
    """Get list of statuses that allow hold"""
    return [s for s, c in INVENTORY_STATUS_CONFIG.items() if c.get("can_hold", False)]
