"""
ProHouzing Commission Configuration
Prompt 11/20 - Commission Engine

Centralized configuration for:
- Commission statuses
- Trigger types
- Split types
- Approval configuration
- Recipient resolution rules
"""

from enum import Enum
from typing import Dict, Any, List

# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION RECORD STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionStatus(str, Enum):
    """Commission record status"""
    DRAFT = "draft"                      # Manual creation, not submitted
    ESTIMATED = "estimated"              # From booking, not finalized
    PENDING = "pending"                  # From contract, awaiting approval
    PENDING_APPROVAL = "pending_approval"  # Submitted for approval
    APPROVED = "approved"                # Approved, ready for payout
    REJECTED = "rejected"                # Rejected by approver
    READY_FOR_PAYOUT = "ready_for_payout"  # In payout queue
    SCHEDULED = "scheduled"              # Scheduled for payout
    PAID = "paid"                        # Paid to recipient
    CANCELLED = "cancelled"              # Cancelled
    DISPUTED = "disputed"                # Under dispute


COMMISSION_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    CommissionStatus.DRAFT.value: {
        "label": "Nháp",
        "label_en": "Draft",
        "color": "slate",
        "is_final": False,
        "can_edit": True,
    },
    CommissionStatus.ESTIMATED.value: {
        "label": "Ước tính",
        "label_en": "Estimated",
        "color": "blue",
        "is_final": False,
        "can_edit": False,
    },
    CommissionStatus.PENDING.value: {
        "label": "Chờ xử lý",
        "label_en": "Pending",
        "color": "yellow",
        "is_final": False,
        "can_edit": False,
    },
    CommissionStatus.PENDING_APPROVAL.value: {
        "label": "Chờ duyệt",
        "label_en": "Pending Approval",
        "color": "orange",
        "is_final": False,
        "can_edit": False,
    },
    CommissionStatus.APPROVED.value: {
        "label": "Đã duyệt",
        "label_en": "Approved",
        "color": "green",
        "is_final": False,
        "can_edit": False,
    },
    CommissionStatus.REJECTED.value: {
        "label": "Từ chối",
        "label_en": "Rejected",
        "color": "red",
        "is_final": True,
        "can_edit": False,
    },
    CommissionStatus.READY_FOR_PAYOUT.value: {
        "label": "Sẵn sàng chi",
        "label_en": "Ready for Payout",
        "color": "teal",
        "is_final": False,
        "can_edit": False,
    },
    CommissionStatus.SCHEDULED.value: {
        "label": "Đã lên lịch",
        "label_en": "Scheduled",
        "color": "indigo",
        "is_final": False,
        "can_edit": False,
    },
    CommissionStatus.PAID.value: {
        "label": "Đã chi trả",
        "label_en": "Paid",
        "color": "emerald",
        "is_final": True,
        "can_edit": False,
    },
    CommissionStatus.CANCELLED.value: {
        "label": "Đã huỷ",
        "label_en": "Cancelled",
        "color": "gray",
        "is_final": True,
        "can_edit": False,
    },
    CommissionStatus.DISPUTED.value: {
        "label": "Đang tranh chấp",
        "label_en": "Disputed",
        "color": "purple",
        "is_final": False,
        "can_edit": False,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION TRIGGER TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionTrigger(str, Enum):
    """Events that trigger commission calculation"""
    BOOKING_CONFIRMED = "booking_confirmed"
    HARD_BOOKING_CREATED = "hard_booking_created"
    DEPOSIT_PAID = "deposit_paid"
    CONTRACT_CREATED = "contract_created"
    CONTRACT_SIGNED = "contract_signed"
    CONTRACT_ACTIVE = "contract_active"
    MANUAL = "manual"


COMMISSION_TRIGGER_CONFIG: Dict[str, Dict[str, Any]] = {
    CommissionTrigger.BOOKING_CONFIRMED.value: {
        "label": "Xác nhận đặt chỗ",
        "label_en": "Booking Confirmed",
        "source_entity": "soft_booking",
        "creates_estimated": True,
        "requires_contract": False,
        "description": "Khi soft booking được xác nhận",
    },
    CommissionTrigger.HARD_BOOKING_CREATED.value: {
        "label": "Tạo booking cứng",
        "label_en": "Hard Booking Created",
        "source_entity": "hard_booking",
        "creates_estimated": True,
        "requires_contract": False,
        "description": "Khi hard booking được tạo sau allocation",
    },
    CommissionTrigger.DEPOSIT_PAID.value: {
        "label": "Đã đặt cọc",
        "label_en": "Deposit Paid",
        "source_entity": "hard_booking",
        "creates_estimated": True,
        "requires_contract": False,
        "description": "Khi khách hàng đã thanh toán đặt cọc",
    },
    CommissionTrigger.CONTRACT_CREATED.value: {
        "label": "Tạo hợp đồng",
        "label_en": "Contract Created",
        "source_entity": "contract",
        "creates_estimated": False,
        "requires_contract": True,
        "description": "Khi hợp đồng được tạo",
    },
    CommissionTrigger.CONTRACT_SIGNED.value: {
        "label": "Ký hợp đồng",
        "label_en": "Contract Signed",
        "source_entity": "contract",
        "creates_estimated": False,
        "requires_contract": True,
        "description": "Khi hợp đồng được ký - TRIGGER CHÍNH",
    },
    CommissionTrigger.CONTRACT_ACTIVE.value: {
        "label": "HĐ có hiệu lực",
        "label_en": "Contract Active",
        "source_entity": "contract",
        "creates_estimated": False,
        "requires_contract": True,
        "description": "Khi hợp đồng chuyển sang active",
    },
    CommissionTrigger.MANUAL.value: {
        "label": "Tạo thủ công",
        "label_en": "Manual",
        "source_entity": "manual",
        "creates_estimated": False,
        "requires_contract": False,
        "description": "Tạo thủ công bởi admin",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION SPLIT TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionSplitType(str, Enum):
    """Types of commission splits"""
    CLOSING_SALES = "closing_sales"
    CO_SALES = "co_sales"
    TEAM_LEADER = "team_leader"
    BRANCH_MANAGER = "branch_manager"
    REGION_MANAGER = "region_manager"
    SUPPORT_ROLE = "support_role"
    REFERRAL = "referral"
    COLLABORATOR_L1 = "collaborator_l1"
    COLLABORATOR_L2 = "collaborator_l2"
    COMPANY_POOL = "company_pool"


COMMISSION_SPLIT_CONFIG: Dict[str, Dict[str, Any]] = {
    CommissionSplitType.CLOSING_SALES.value: {
        "label": "Sales chốt deal",
        "label_en": "Closing Sales",
        "recipient_role": "sales",
        "recipient_source": "deal_owner",
        "default_percent": 70,
        "description": "Nhân viên sales trực tiếp chốt deal",
    },
    CommissionSplitType.CO_SALES.value: {
        "label": "Sales đồng chốt",
        "label_en": "Co-Sales",
        "recipient_role": "sales",
        "recipient_source": "co_broker",
        "default_percent": 0,
        "description": "Nhân viên sales hỗ trợ chốt deal",
    },
    CommissionSplitType.TEAM_LEADER.value: {
        "label": "Trưởng nhóm",
        "label_en": "Team Leader",
        "recipient_role": "team_leader",
        "recipient_source": "team_leader",
        "default_percent": 10,
        "description": "Bonus cho trưởng nhóm",
    },
    CommissionSplitType.BRANCH_MANAGER.value: {
        "label": "Quản lý chi nhánh",
        "label_en": "Branch Manager",
        "recipient_role": "branch_manager",
        "recipient_source": "branch_manager",
        "default_percent": 5,
        "description": "Bonus cho quản lý chi nhánh",
    },
    CommissionSplitType.REGION_MANAGER.value: {
        "label": "Quản lý vùng",
        "label_en": "Region Manager",
        "recipient_role": "region_manager",
        "recipient_source": "region_manager",
        "default_percent": 0,
        "description": "Bonus cho quản lý vùng",
    },
    CommissionSplitType.SUPPORT_ROLE.value: {
        "label": "Hỗ trợ",
        "label_en": "Support",
        "recipient_role": "support",
        "recipient_source": "manual",
        "default_percent": 5,
        "description": "Nhân viên hỗ trợ/coordinator",
    },
    CommissionSplitType.REFERRAL.value: {
        "label": "Giới thiệu",
        "label_en": "Referral",
        "recipient_role": "referrer",
        "recipient_source": "lead_referrer",
        "default_percent": 0,
        "description": "Người giới thiệu khách hàng",
    },
    CommissionSplitType.COLLABORATOR_L1.value: {
        "label": "CTV cấp 1",
        "label_en": "Collaborator L1",
        "recipient_role": "collaborator",
        "recipient_source": "collaborator",
        "default_percent": 25,
        "description": "Cộng tác viên giới thiệu trực tiếp",
    },
    CommissionSplitType.COLLABORATOR_L2.value: {
        "label": "CTV cấp 2",
        "label_en": "Collaborator L2",
        "recipient_role": "collaborator",
        "recipient_source": "collaborator_parent",
        "default_percent": 5,
        "description": "Cộng tác viên cấp trên",
    },
    CommissionSplitType.COMPANY_POOL.value: {
        "label": "Quỹ công ty",
        "label_en": "Company Pool",
        "recipient_role": "company",
        "recipient_source": "company",
        "default_percent": 10,
        "description": "Phần giữ lại cho công ty",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL STATUS & CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

class ApprovalStatus(str, Enum):
    """Approval status"""
    NOT_STARTED = "not_started"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class ApprovalAction(str, Enum):
    """Approval actions"""
    SUBMIT = "submit"
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_REVISION = "request_revision"
    SKIP = "skip"


APPROVAL_CONFIG = {
    # Thresholds for approval levels (VND)
    "level_1_threshold": 0,              # All commissions need L1
    "level_2_threshold": 50_000_000,     # > 50M needs L2
    "level_3_threshold": 200_000_000,    # > 200M needs L3
    
    # Roles that can approve at each level
    "level_1_roles": ["sales_manager", "manager", "admin", "bod"],
    "level_2_roles": ["finance_manager", "admin", "bod"],
    "level_3_roles": ["director", "bod"],
    
    # SLA in hours
    "level_1_sla_hours": 24,
    "level_2_sla_hours": 48,
    "level_3_sla_hours": 72,
    
    # Auto-approve below threshold (0 = no auto-approve)
    "auto_approve_below": 0,
}


# ═══════════════════════════════════════════════════════════════════════════════
# PAYOUT STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class PayoutStatus(str, Enum):
    """Payout status for commission records"""
    NOT_READY = "not_ready"
    READY = "ready"
    SCHEDULED = "scheduled"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"


class PayoutBatchStatus(str, Enum):
    """Payout batch status"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PARTIAL_COMPLETED = "partial_completed"
    CANCELLED = "cancelled"


PAYOUT_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    PayoutStatus.NOT_READY.value: {
        "label": "Chưa sẵn sàng",
        "label_en": "Not Ready",
        "color": "gray",
    },
    PayoutStatus.READY.value: {
        "label": "Sẵn sàng",
        "label_en": "Ready",
        "color": "blue",
    },
    PayoutStatus.SCHEDULED.value: {
        "label": "Đã lên lịch",
        "label_en": "Scheduled",
        "color": "indigo",
    },
    PayoutStatus.PROCESSING.value: {
        "label": "Đang xử lý",
        "label_en": "Processing",
        "color": "yellow",
    },
    PayoutStatus.PAID.value: {
        "label": "Đã chi",
        "label_en": "Paid",
        "color": "green",
    },
    PayoutStatus.FAILED.value: {
        "label": "Thất bại",
        "label_en": "Failed",
        "color": "red",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# POLICY CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

class PolicyStatus(str, Enum):
    """Policy status"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class BrokerageRateType(str, Enum):
    """Brokerage rate calculation type"""
    PERCENT = "percent"
    FIXED = "fixed"
    TIERED = "tiered"


class SplitCalcType(str, Enum):
    """Split calculation type"""
    PERCENT_OF_BROKERAGE = "percent_of_brokerage"
    PERCENT_OF_CONTRACT = "percent_of_contract"
    FIXED = "fixed"


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_commission_status_config(status: str) -> Dict[str, Any]:
    """Get status configuration"""
    return COMMISSION_STATUS_CONFIG.get(status, {})


def get_trigger_config(trigger: str) -> Dict[str, Any]:
    """Get trigger configuration"""
    return COMMISSION_TRIGGER_CONFIG.get(trigger, {})


def get_split_config(split_type: str) -> Dict[str, Any]:
    """Get split type configuration"""
    return COMMISSION_SPLIT_CONFIG.get(split_type, {})


def get_required_approval_levels(amount: float) -> int:
    """Determine number of approval levels needed based on amount"""
    if amount >= APPROVAL_CONFIG["level_3_threshold"]:
        return 3
    elif amount >= APPROVAL_CONFIG["level_2_threshold"]:
        return 2
    elif amount >= APPROVAL_CONFIG["level_1_threshold"]:
        return 1
    return 0


def can_user_approve(user_role: str, approval_level: int) -> bool:
    """Check if user role can approve at given level"""
    level_key = f"level_{approval_level}_roles"
    allowed_roles = APPROVAL_CONFIG.get(level_key, [])
    return user_role in allowed_roles


def get_all_triggers() -> List[Dict[str, Any]]:
    """Get all trigger types for frontend dropdown"""
    return [
        {
            "value": trigger.value,
            **COMMISSION_TRIGGER_CONFIG[trigger.value]
        }
        for trigger in CommissionTrigger
    ]


def get_all_split_types() -> List[Dict[str, Any]]:
    """Get all split types for frontend dropdown"""
    return [
        {
            "value": split_type.value,
            **COMMISSION_SPLIT_CONFIG[split_type.value]
        }
        for split_type in CommissionSplitType
    ]


def get_all_statuses() -> List[Dict[str, Any]]:
    """Get all statuses for frontend dropdown"""
    return [
        {
            "value": status.value,
            **COMMISSION_STATUS_CONFIG[status.value]
        }
        for status in CommissionStatus
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# DEFAULT POLICY TEMPLATE
# ═══════════════════════════════════════════════════════════════════════════════

DEFAULT_POLICY_TEMPLATE = {
    "name": "Chính sách mặc định",
    "scope_type": "global",
    "brokerage_rate_type": BrokerageRateType.PERCENT.value,
    "brokerage_rate_value": 2.0,  # 2%
    "trigger_event": CommissionTrigger.CONTRACT_SIGNED.value,
    "estimated_trigger": CommissionTrigger.BOOKING_CONFIRMED.value,
    "split_rules": [
        {
            "split_type": CommissionSplitType.CLOSING_SALES.value,
            "calc_type": SplitCalcType.PERCENT_OF_BROKERAGE.value,
            "calc_value": 70,
        },
        {
            "split_type": CommissionSplitType.TEAM_LEADER.value,
            "calc_type": SplitCalcType.PERCENT_OF_BROKERAGE.value,
            "calc_value": 10,
        },
        {
            "split_type": CommissionSplitType.BRANCH_MANAGER.value,
            "calc_type": SplitCalcType.PERCENT_OF_BROKERAGE.value,
            "calc_value": 5,
        },
        {
            "split_type": CommissionSplitType.SUPPORT_ROLE.value,
            "calc_type": SplitCalcType.PERCENT_OF_BROKERAGE.value,
            "calc_value": 5,
        },
        {
            "split_type": CommissionSplitType.COMPANY_POOL.value,
            "calc_type": SplitCalcType.PERCENT_OF_BROKERAGE.value,
            "calc_value": 10,
        },
    ],
    "requires_approval_above": 50_000_000,
}
