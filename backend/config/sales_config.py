"""
ProHouzing Sales Configuration
Prompt 8/20 - Sales Pipeline, Booking & Deal Engine

SINGLE SOURCE OF TRUTH for:
- Deal stages and lifecycle
- Booking statuses
- Allocation rules
- Pricing configuration
- Payment plan types
"""

from enum import Enum
from typing import Dict, List, Any, Optional


# ============================================
# DEAL STAGES (14 stages as per design review)
# ============================================

class DealStage(str, Enum):
    """Deal lifecycle stages for primary real estate"""
    # Pre-transaction
    INTERESTED = "interested"                    # Quan tâm, chờ mở bán
    SITE_VISIT = "site_visit"                    # Đã/sẽ xem nhà
    NEGOTIATING = "negotiating"                  # Đang đàm phán
    
    # Soft Booking
    SOFT_BOOKING = "soft_booking"                # Đã giữ chỗ mềm (vào queue)
    SELECTING = "selecting"                      # Đang chọn priority
    WAITING_ALLOCATION = "waiting_allocation"    # Chờ allocation
    
    # Hard Booking (Post-allocation)
    ALLOCATED = "allocated"                      # Đã được phân bổ căn
    HARD_BOOKING = "hard_booking"                # Đã xác nhận hard booking
    DEPOSITING = "depositing"                    # Đang nộp cọc
    
    # Contract & Payment
    CONTRACTING = "contracting"                  # Đang làm hợp đồng
    PAYMENT_PROGRESS = "payment_progress"        # Đang thanh toán tiến độ
    HANDOVER_PENDING = "handover_pending"        # Chờ bàn giao
    COMPLETED = "completed"                      # Hoàn tất
    
    # Terminal
    LOST = "lost"                                # Thất bại / Hủy


DEAL_STAGES_CONFIG: Dict[str, Dict[str, Any]] = {
    DealStage.INTERESTED.value: {
        "label": "Quan tâm",
        "label_en": "Interested",
        "group": "pre_transaction",
        "order": 1,
        "color": "bg-slate-100 text-slate-700",
        "probability": 10,
        "description": "Khách quan tâm, chờ mở bán",
        "allowed_next": ["site_visit", "negotiating", "soft_booking", "lost"],
    },
    DealStage.SITE_VISIT.value: {
        "label": "Xem nhà",
        "label_en": "Site Visit",
        "group": "pre_transaction",
        "order": 2,
        "color": "bg-cyan-100 text-cyan-700",
        "probability": 20,
        "description": "Đã/sẽ xem nhà mẫu",
        "allowed_next": ["negotiating", "soft_booking", "interested", "lost"],
    },
    DealStage.NEGOTIATING.value: {
        "label": "Đàm phán",
        "label_en": "Negotiating",
        "group": "pre_transaction",
        "order": 3,
        "color": "bg-blue-100 text-blue-700",
        "probability": 30,
        "description": "Đang đàm phán về sản phẩm",
        "allowed_next": ["soft_booking", "site_visit", "lost"],
    },
    DealStage.SOFT_BOOKING.value: {
        "label": "Giữ chỗ",
        "label_en": "Soft Booking",
        "group": "soft_booking",
        "order": 4,
        "color": "bg-amber-100 text-amber-700",
        "probability": 40,
        "description": "Đã giữ chỗ mềm, vào queue",
        "allowed_next": ["selecting", "lost"],
        "creates_soft_booking": True,
    },
    DealStage.SELECTING.value: {
        "label": "Chọn căn",
        "label_en": "Selecting",
        "group": "soft_booking",
        "order": 5,
        "color": "bg-orange-100 text-orange-700",
        "probability": 50,
        "description": "Đang chọn priority 1-2-3",
        "allowed_next": ["waiting_allocation", "lost"],
    },
    DealStage.WAITING_ALLOCATION.value: {
        "label": "Chờ phân bổ",
        "label_en": "Waiting Allocation",
        "group": "soft_booking",
        "order": 6,
        "color": "bg-yellow-100 text-yellow-700",
        "probability": 55,
        "description": "Đã chọn căn, chờ allocation engine",
        "allowed_next": ["allocated", "lost"],
    },
    DealStage.ALLOCATED.value: {
        "label": "Đã phân bổ",
        "label_en": "Allocated",
        "group": "hard_booking",
        "order": 7,
        "color": "bg-emerald-100 text-emerald-700",
        "probability": 65,
        "description": "Đã được phân bổ căn cụ thể",
        "allowed_next": ["hard_booking", "lost"],
    },
    DealStage.HARD_BOOKING.value: {
        "label": "Booking cứng",
        "label_en": "Hard Booking",
        "group": "hard_booking",
        "order": 8,
        "color": "bg-green-100 text-green-700",
        "probability": 70,
        "description": "Đã xác nhận hard booking",
        "allowed_next": ["depositing", "lost"],
        "creates_hard_booking": True,
    },
    DealStage.DEPOSITING.value: {
        "label": "Đang cọc",
        "label_en": "Depositing",
        "group": "hard_booking",
        "order": 9,
        "color": "bg-teal-100 text-teal-700",
        "probability": 80,
        "description": "Đang trong quá trình đặt cọc",
        "allowed_next": ["contracting", "lost"],
    },
    DealStage.CONTRACTING.value: {
        "label": "Ký HĐ",
        "label_en": "Contracting",
        "group": "contract",
        "order": 10,
        "color": "bg-indigo-100 text-indigo-700",
        "probability": 90,
        "description": "Đang ký hợp đồng mua bán",
        "allowed_next": ["payment_progress", "lost"],
        "creates_contract": True,
    },
    DealStage.PAYMENT_PROGRESS.value: {
        "label": "Thanh toán",
        "label_en": "Payment Progress",
        "group": "post_transaction",
        "order": 11,
        "color": "bg-purple-100 text-purple-700",
        "probability": 95,
        "description": "Đang thanh toán theo tiến độ",
        "allowed_next": ["handover_pending", "lost"],
    },
    DealStage.HANDOVER_PENDING.value: {
        "label": "Chờ bàn giao",
        "label_en": "Handover Pending",
        "group": "post_transaction",
        "order": 12,
        "color": "bg-pink-100 text-pink-700",
        "probability": 98,
        "description": "Chờ bàn giao nhà",
        "allowed_next": ["completed"],
    },
    DealStage.COMPLETED.value: {
        "label": "Hoàn tất",
        "label_en": "Completed",
        "group": "completed",
        "order": 13,
        "color": "bg-green-500 text-white",
        "probability": 100,
        "description": "Giao dịch hoàn tất",
        "allowed_next": [],
        "is_terminal": True,
        "is_success": True,
        "upgrades_contact_to": "customer",
    },
    DealStage.LOST.value: {
        "label": "Thất bại",
        "label_en": "Lost",
        "group": "terminal",
        "order": 14,
        "color": "bg-red-100 text-red-700",
        "probability": 0,
        "description": "Deal thất bại / Hủy",
        "allowed_next": [],
        "is_terminal": True,
    },
}


# ============================================
# SOFT BOOKING STATUS
# ============================================

class SoftBookingStatus(str, Enum):
    """Soft booking queue status"""
    PENDING = "pending"              # Chờ xác nhận
    CONFIRMED = "confirmed"          # Đã xác nhận, trong queue
    SELECTING = "selecting"          # Đang chọn priority
    SUBMITTED = "submitted"          # Đã submit priority, chờ allocation
    ALLOCATED = "allocated"          # Đã được phân bổ căn
    FAILED = "failed"                # Allocation thất bại (không còn căn)
    CANCELLED = "cancelled"          # Đã hủy
    EXPIRED = "expired"              # Hết hạn


SOFT_BOOKING_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    SoftBookingStatus.PENDING.value: {
        "label": "Chờ xác nhận",
        "color": "bg-slate-100 text-slate-700",
        "order": 1,
    },
    SoftBookingStatus.CONFIRMED.value: {
        "label": "Đã xác nhận",
        "color": "bg-blue-100 text-blue-700",
        "order": 2,
    },
    SoftBookingStatus.SELECTING.value: {
        "label": "Đang chọn căn",
        "color": "bg-amber-100 text-amber-700",
        "order": 3,
    },
    SoftBookingStatus.SUBMITTED.value: {
        "label": "Chờ phân bổ",
        "color": "bg-yellow-100 text-yellow-700",
        "order": 4,
    },
    SoftBookingStatus.ALLOCATED.value: {
        "label": "Đã phân bổ",
        "color": "bg-green-100 text-green-700",
        "order": 5,
    },
    SoftBookingStatus.FAILED.value: {
        "label": "Không có căn",
        "color": "bg-orange-100 text-orange-700",
        "order": 6,
    },
    SoftBookingStatus.CANCELLED.value: {
        "label": "Đã hủy",
        "color": "bg-red-100 text-red-700",
        "order": 7,
    },
    SoftBookingStatus.EXPIRED.value: {
        "label": "Hết hạn",
        "color": "bg-gray-100 text-gray-700",
        "order": 8,
    },
}


# ============================================
# HARD BOOKING STATUS
# ============================================

class HardBookingStatus(str, Enum):
    """Hard booking status after allocation"""
    ACTIVE = "active"                # Đang hoạt động
    DEPOSIT_PENDING = "deposit_pending"  # Chờ cọc
    DEPOSIT_PARTIAL = "deposit_partial"  # Cọc một phần
    DEPOSITED = "deposited"          # Đã cọc đủ
    CONTRACTED = "contracted"        # Đã ký HĐ
    CANCELLED = "cancelled"          # Đã hủy
    EXPIRED = "expired"              # Hết hạn


HARD_BOOKING_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    HardBookingStatus.ACTIVE.value: {
        "label": "Đang hoạt động",
        "color": "bg-blue-100 text-blue-700",
        "order": 1,
    },
    HardBookingStatus.DEPOSIT_PENDING.value: {
        "label": "Chờ cọc",
        "color": "bg-amber-100 text-amber-700",
        "order": 2,
    },
    HardBookingStatus.DEPOSIT_PARTIAL.value: {
        "label": "Cọc một phần",
        "color": "bg-yellow-100 text-yellow-700",
        "order": 3,
    },
    HardBookingStatus.DEPOSITED.value: {
        "label": "Đã cọc đủ",
        "color": "bg-green-100 text-green-700",
        "order": 4,
    },
    HardBookingStatus.CONTRACTED.value: {
        "label": "Đã ký HĐ",
        "color": "bg-indigo-100 text-indigo-700",
        "order": 5,
    },
    HardBookingStatus.CANCELLED.value: {
        "label": "Đã hủy",
        "color": "bg-red-100 text-red-700",
        "order": 6,
    },
    HardBookingStatus.EXPIRED.value: {
        "label": "Hết hạn",
        "color": "bg-gray-100 text-gray-700",
        "order": 7,
    },
}


# ============================================
# SALES EVENT STATUS
# ============================================

class SalesEventStatus(str, Enum):
    """Sales event / opening event status"""
    DRAFT = "draft"                  # Nháp
    REGISTRATION = "registration"    # Đang nhận đăng ký
    SELECTION = "selection"          # Đang chọn căn
    ALLOCATION = "allocation"        # Đang phân bổ
    COMPLETED = "completed"          # Đã xong
    CANCELLED = "cancelled"          # Đã hủy


SALES_EVENT_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    SalesEventStatus.DRAFT.value: {
        "label": "Nháp",
        "color": "bg-slate-100 text-slate-700",
    },
    SalesEventStatus.REGISTRATION.value: {
        "label": "Đang nhận ĐK",
        "color": "bg-blue-100 text-blue-700",
    },
    SalesEventStatus.SELECTION.value: {
        "label": "Đang chọn căn",
        "color": "bg-amber-100 text-amber-700",
    },
    SalesEventStatus.ALLOCATION.value: {
        "label": "Đang phân bổ",
        "color": "bg-yellow-100 text-yellow-700",
    },
    SalesEventStatus.COMPLETED.value: {
        "label": "Hoàn tất",
        "color": "bg-green-100 text-green-700",
    },
    SalesEventStatus.CANCELLED.value: {
        "label": "Đã hủy",
        "color": "bg-red-100 text-red-700",
    },
}


# ============================================
# INVENTORY STATUS (for allocation lock)
# ============================================

class AllocationInventoryStatus(str, Enum):
    """Inventory status for allocation purposes"""
    AVAILABLE = "available"          # Còn hàng, có thể book
    RESERVED = "reserved"            # Đã reserve cho VIP
    ALLOCATED = "allocated"          # Đã phân bổ (soft lock)
    LOCKED = "locked"                # Đã lock cứng (hard booking)
    SOLD = "sold"                    # Đã bán


# ============================================
# PAYMENT PLAN TYPES
# ============================================

class PaymentPlanType(str, Enum):
    """Payment plan types"""
    STANDARD = "standard"            # Thanh toán tiến độ chuẩn
    FAST = "fast"                    # Thanh toán nhanh
    FULL = "full"                    # Thanh toán 100%
    LOAN = "loan"                    # Vay ngân hàng
    FLEXIBLE = "flexible"            # Linh hoạt


PAYMENT_PLAN_TYPE_CONFIG: Dict[str, Dict[str, Any]] = {
    PaymentPlanType.STANDARD.value: {
        "label": "Tiến độ chuẩn",
        "label_en": "Standard Progress",
        "typical_discount": 0,
    },
    PaymentPlanType.FAST.value: {
        "label": "Thanh toán nhanh",
        "label_en": "Fast Payment",
        "typical_discount": 3,  # 3%
    },
    PaymentPlanType.FULL.value: {
        "label": "Thanh toán 100%",
        "label_en": "Full Payment",
        "typical_discount": 8,  # 8%
    },
    PaymentPlanType.LOAN.value: {
        "label": "Vay ngân hàng",
        "label_en": "Bank Loan",
        "typical_discount": 0,
    },
    PaymentPlanType.FLEXIBLE.value: {
        "label": "Linh hoạt",
        "label_en": "Flexible",
        "typical_discount": 0,
    },
}


# ============================================
# BOOKING TIER
# ============================================

class BookingTier(str, Enum):
    """Booking tier for queue priority"""
    VIP = "vip"                      # VIP - top priority
    PRIORITY = "priority"            # Priority booking
    STANDARD = "standard"            # Standard booking


BOOKING_TIER_CONFIG: Dict[str, Dict[str, Any]] = {
    BookingTier.VIP.value: {
        "label": "VIP",
        "color": "bg-purple-100 text-purple-700",
        "queue_weight": 1000,        # Higher = earlier in queue
        "can_reserve": True,
    },
    BookingTier.PRIORITY.value: {
        "label": "Ưu tiên",
        "color": "bg-amber-100 text-amber-700",
        "queue_weight": 100,
        "can_reserve": False,
    },
    BookingTier.STANDARD.value: {
        "label": "Tiêu chuẩn",
        "color": "bg-slate-100 text-slate-700",
        "queue_weight": 1,
        "can_reserve": False,
    },
}


# ============================================
# ALLOCATION RULES
# ============================================

ALLOCATION_CONFIG = {
    "max_priorities": 3,             # Max priority selections per booking
    "allocation_order": [
        "booking_tier",              # VIP first
        "queue_number",              # Then by queue number
        "priority_order",            # Then by priority selection (1, 2, 3)
    ],
    "allow_manual_override": True,
    "lock_duration_minutes": 30,     # Lock product during allocation
    "auto_release_on_fail": True,
}


# ============================================
# PRICING ENGINE CONFIG
# ============================================

PRICING_ENGINE_CONFIG = {
    "price_adjustment_types": [
        {"code": "floor_premium", "label": "Phụ thu tầng cao"},
        {"code": "view_premium", "label": "Phụ thu view"},
        {"code": "corner_premium", "label": "Phụ thu căn góc"},
        {"code": "direction_premium", "label": "Phụ thu hướng"},
        {"code": "area_adjustment", "label": "Điều chỉnh diện tích"},
    ],
    "discount_types": [
        {"code": "payment_plan", "label": "Chiết khấu PTTT"},
        {"code": "promotion", "label": "Khuyến mãi"},
        {"code": "vip", "label": "Chiết khấu VIP"},
        {"code": "employee", "label": "Chiết khấu CBNV"},
        {"code": "referral", "label": "Chiết khấu giới thiệu"},
        {"code": "special", "label": "Chiết khấu đặc biệt"},
    ],
    "max_total_discount_percent": 15,  # Max 15% total discount
    "requires_approval_above": 10,     # > 10% needs approval
}


# ============================================
# LOST REASONS
# ============================================

DEAL_LOST_REASONS = [
    {"code": "price", "label": "Giá cao"},
    {"code": "location", "label": "Vị trí không phù hợp"},
    {"code": "product", "label": "Sản phẩm không phù hợp"},
    {"code": "competitor", "label": "Chọn đối thủ"},
    {"code": "finance", "label": "Vấn đề tài chính"},
    {"code": "timing", "label": "Chưa sẵn sàng"},
    {"code": "no_response", "label": "Không phản hồi"},
    {"code": "other", "label": "Lý do khác"},
]


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_deal_stage(code: str) -> Optional[Dict[str, Any]]:
    """Get deal stage config by code"""
    return DEAL_STAGES_CONFIG.get(code)


def get_soft_booking_status(code: str) -> Optional[Dict[str, Any]]:
    """Get soft booking status config by code"""
    return SOFT_BOOKING_STATUS_CONFIG.get(code)


def get_hard_booking_status(code: str) -> Optional[Dict[str, Any]]:
    """Get hard booking status config by code"""
    return HARD_BOOKING_STATUS_CONFIG.get(code)


def can_transition_deal_stage(current: str, target: str) -> bool:
    """Check if deal stage transition is allowed"""
    stage_config = get_deal_stage(current)
    if not stage_config:
        return False
    return target in stage_config.get("allowed_next", [])


def get_pipeline_stages() -> List[Dict[str, Any]]:
    """Get stages for pipeline view (exclude terminal)"""
    return [
        {"code": code, **config}
        for code, config in DEAL_STAGES_CONFIG.items()
        if not config.get("is_terminal", False)
    ]


def get_stage_groups() -> Dict[str, List[str]]:
    """Group stages by category"""
    groups = {}
    for code, config in DEAL_STAGES_CONFIG.items():
        group = config.get("group", "other")
        if group not in groups:
            groups[group] = []
        groups[group].append(code)
    return groups
