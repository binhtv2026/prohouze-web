"""
ProHouzing Canonical Inventory Configuration
PROMPT 5/20 - PART B: CANONICAL INVENTORY MODEL (10/10 LOCKED)

SINGLE SOURCE OF TRUTH for:
- Inventory Status (STATE MACHINE)
- State Transition Rules
- Status Configuration

DO NOT MODIFY without approval.
"""

from enum import Enum
from typing import Dict, List, Set, Any


# ============================================
# INVENTORY STATUS - STATE MACHINE
# ============================================

class InventoryStatus(str, Enum):
    """
    Canonical Inventory Status - SINGLE SOURCE OF TRUTH
    
    This is the ONLY status field for products.
    All other status fields (business_status, availability_status) are DEPRECATED.
    """
    DRAFT = "draft"                    # Mới tạo, chưa hoàn thiện
    NOT_OPEN = "not_open"              # Chưa mở bán
    AVAILABLE = "available"            # Đang mở bán, có thể giao dịch
    HOLD = "hold"                      # Đang giữ tạm (có thời hạn)
    BOOKING_PENDING = "booking_pending" # Đang chờ xác nhận booking
    BOOKED = "booked"                  # Đã booking xác nhận
    RESERVED = "reserved"              # Đã đặt cọc/giữ chỗ chính thức
    SOLD = "sold"                      # Đã bán - hoàn tất
    BLOCKED = "blocked"                # Khóa - không cho bán (admin/legal)
    INACTIVE = "inactive"              # Tạm ẩn/dừng


# ============================================
# STATE TRANSITION RULES
# ============================================

# Valid transitions: from_status -> [to_statuses]
VALID_TRANSITIONS: Dict[str, List[str]] = {
    # Initial states
    InventoryStatus.DRAFT.value: [
        InventoryStatus.NOT_OPEN.value,
        InventoryStatus.INACTIVE.value,
    ],
    
    InventoryStatus.NOT_OPEN.value: [
        InventoryStatus.AVAILABLE.value,
        InventoryStatus.BLOCKED.value,
        InventoryStatus.INACTIVE.value,
    ],
    
    # Sales flow
    InventoryStatus.AVAILABLE.value: [
        InventoryStatus.HOLD.value,
        InventoryStatus.BLOCKED.value,
        InventoryStatus.NOT_OPEN.value,
        InventoryStatus.INACTIVE.value,
    ],
    
    InventoryStatus.HOLD.value: [
        InventoryStatus.AVAILABLE.value,      # Release / expired
        InventoryStatus.BOOKING_PENDING.value,
        InventoryStatus.BLOCKED.value,
    ],
    
    InventoryStatus.BOOKING_PENDING.value: [
        InventoryStatus.BOOKED.value,         # Confirmed
        InventoryStatus.AVAILABLE.value,      # Rejected / cancelled
        InventoryStatus.HOLD.value,           # Back to hold
        InventoryStatus.BLOCKED.value,
    ],
    
    InventoryStatus.BOOKED.value: [
        InventoryStatus.RESERVED.value,       # Proceed to deposit
        InventoryStatus.AVAILABLE.value,      # Cancelled (with approval)
        InventoryStatus.BLOCKED.value,
    ],
    
    InventoryStatus.RESERVED.value: [
        InventoryStatus.SOLD.value,           # Contract signed
        InventoryStatus.BOOKED.value,         # Rollback (rare)
        InventoryStatus.AVAILABLE.value,      # Cancelled (with approval)
        InventoryStatus.BLOCKED.value,
    ],
    
    # Terminal states
    InventoryStatus.SOLD.value: [
        # Normally no transitions from SOLD
        InventoryStatus.BLOCKED.value,        # Legal issues only
    ],
    
    InventoryStatus.BLOCKED.value: [
        InventoryStatus.AVAILABLE.value,      # Unblock
        InventoryStatus.NOT_OPEN.value,
        InventoryStatus.INACTIVE.value,
    ],
    
    InventoryStatus.INACTIVE.value: [
        InventoryStatus.DRAFT.value,
        InventoryStatus.NOT_OPEN.value,
        InventoryStatus.AVAILABLE.value,
    ],
}


# ============================================
# STATUS CONFIGURATION
# ============================================

STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    InventoryStatus.DRAFT.value: {
        "name": "Nháp",
        "name_en": "Draft",
        "color": "#94a3b8",      # slate-400
        "bg_color": "#f1f5f9",   # slate-100
        "icon": "FileEdit",
        "order": 1,
        "is_sellable": False,
        "show_in_public": False,
        "can_hold": False,
        "can_book": False,
        "description": "Sản phẩm mới tạo, chưa hoàn thiện thông tin"
    },
    InventoryStatus.NOT_OPEN.value: {
        "name": "Chưa mở bán",
        "name_en": "Not Open",
        "color": "#64748b",      # slate-500
        "bg_color": "#f1f5f9",   # slate-100
        "icon": "Lock",
        "order": 2,
        "is_sellable": False,
        "show_in_public": False,
        "can_hold": False,
        "can_book": False,
        "description": "Sản phẩm chưa được mở bán, chờ quyết định"
    },
    InventoryStatus.AVAILABLE.value: {
        "name": "Còn hàng",
        "name_en": "Available",
        "color": "#22c55e",      # green-500
        "bg_color": "#dcfce7",   # green-100
        "icon": "CheckCircle",
        "order": 3,
        "is_sellable": True,
        "show_in_public": True,
        "can_hold": True,
        "can_book": False,       # Must hold first
        "description": "Sản phẩm đang mở bán, có thể giữ chỗ"
    },
    InventoryStatus.HOLD.value: {
        "name": "Đang giữ",
        "name_en": "On Hold",
        "color": "#f59e0b",      # amber-500
        "bg_color": "#fef3c7",   # amber-100
        "icon": "Clock",
        "order": 4,
        "is_sellable": False,
        "show_in_public": True,
        "can_hold": False,
        "can_book": True,        # Can proceed to booking
        "has_expiry": True,
        "default_hold_hours": 24,
        "description": "Đang được giữ tạm, có thời hạn tự động release"
    },
    InventoryStatus.BOOKING_PENDING.value: {
        "name": "Chờ booking",
        "name_en": "Booking Pending",
        "color": "#3b82f6",      # blue-500
        "bg_color": "#dbeafe",   # blue-100
        "icon": "Clock",
        "order": 5,
        "is_sellable": False,
        "show_in_public": True,
        "can_hold": False,
        "can_book": False,
        "description": "Đã có yêu cầu booking, đang chờ xác nhận"
    },
    InventoryStatus.BOOKED.value: {
        "name": "Đã booking",
        "name_en": "Booked",
        "color": "#8b5cf6",      # violet-500
        "bg_color": "#ede9fe",   # violet-100
        "icon": "BookCheck",
        "order": 6,
        "is_sellable": False,
        "show_in_public": True,
        "can_hold": False,
        "can_book": False,
        "description": "Booking đã được xác nhận, chờ đặt cọc"
    },
    InventoryStatus.RESERVED.value: {
        "name": "Đã cọc",
        "name_en": "Reserved",
        "color": "#06b6d4",      # cyan-500
        "bg_color": "#cffafe",   # cyan-100
        "icon": "Bookmark",
        "order": 7,
        "is_sellable": False,
        "show_in_public": True,
        "can_hold": False,
        "can_book": False,
        "description": "Khách đã đặt cọc, chờ ký hợp đồng"
    },
    InventoryStatus.SOLD.value: {
        "name": "Đã bán",
        "name_en": "Sold",
        "color": "#ef4444",      # red-500
        "bg_color": "#fee2e2",   # red-100
        "icon": "CheckCheck",
        "order": 8,
        "is_sellable": False,
        "show_in_public": True,
        "can_hold": False,
        "can_book": False,
        "is_terminal": True,
        "description": "Giao dịch hoàn tất, đã ký hợp đồng mua bán"
    },
    InventoryStatus.BLOCKED.value: {
        "name": "Đã khóa",
        "name_en": "Blocked",
        "color": "#dc2626",      # red-600
        "bg_color": "#fecaca",   # red-200
        "icon": "Ban",
        "order": 9,
        "is_sellable": False,
        "show_in_public": False,
        "can_hold": False,
        "can_book": False,
        "requires_admin": True,
        "description": "Bị khóa bởi Admin/Pháp lý, không được phép giao dịch"
    },
    InventoryStatus.INACTIVE.value: {
        "name": "Tạm ẩn",
        "name_en": "Inactive",
        "color": "#9ca3af",      # gray-400
        "bg_color": "#f3f4f6",   # gray-100
        "icon": "EyeOff",
        "order": 10,
        "is_sellable": False,
        "show_in_public": False,
        "can_hold": False,
        "can_book": False,
        "description": "Sản phẩm tạm ẩn, không hiển thị"
    },
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def can_transition(from_status: str, to_status: str) -> bool:
    """
    Check if status transition is valid.
    
    Args:
        from_status: Current status
        to_status: Target status
        
    Returns:
        True if transition is allowed
    """
    allowed = VALID_TRANSITIONS.get(from_status, [])
    return to_status in allowed


def get_valid_transitions(current_status: str) -> List[str]:
    """
    Get list of valid next statuses from current status.
    
    Args:
        current_status: Current status
        
    Returns:
        List of valid target statuses
    """
    return VALID_TRANSITIONS.get(current_status, [])


def get_status_config(status: str) -> Dict[str, Any]:
    """
    Get configuration for a status.
    
    Args:
        status: Status value
        
    Returns:
        Status configuration dict
    """
    return STATUS_CONFIG.get(status, {})


def is_sellable(status: str) -> bool:
    """Check if status allows sales actions."""
    config = get_status_config(status)
    return config.get("is_sellable", False)


def can_hold(status: str) -> bool:
    """Check if product with this status can be held."""
    config = get_status_config(status)
    return config.get("can_hold", False)


def can_book(status: str) -> bool:
    """Check if product with this status can be booked."""
    config = get_status_config(status)
    return config.get("can_book", False)


def is_terminal(status: str) -> bool:
    """Check if status is terminal (no normal exit)."""
    config = get_status_config(status)
    return config.get("is_terminal", False)


def requires_admin(status: str) -> bool:
    """Check if status change requires admin permission."""
    config = get_status_config(status)
    return config.get("requires_admin", False)


def get_sellable_statuses() -> List[str]:
    """Get list of statuses that allow sales."""
    return [s for s, c in STATUS_CONFIG.items() if c.get("is_sellable", False)]


def get_holdable_statuses() -> List[str]:
    """Get list of statuses that allow hold."""
    return [s for s, c in STATUS_CONFIG.items() if c.get("can_hold", False)]


def get_bookable_statuses() -> List[str]:
    """Get list of statuses that allow booking."""
    return [s for s, c in STATUS_CONFIG.items() if c.get("can_book", False)]


def get_public_statuses() -> List[str]:
    """Get list of statuses visible to public."""
    return [s for s, c in STATUS_CONFIG.items() if c.get("show_in_public", False)]


# ============================================
# STATUS CHANGE SOURCES
# ============================================

class StatusChangeSource(str, Enum):
    """Source of status change - for audit logging."""
    MANUAL = "manual"              # Admin/User manual change
    BOOKING_REQUEST = "booking"    # Booking service request
    DEAL_REQUEST = "deal"          # Deal service request
    SYSTEM_EXPIRE = "system"       # Auto-expire by system
    ADMIN_OVERRIDE = "admin"       # Admin override
    IMPORT = "import"              # Data import
