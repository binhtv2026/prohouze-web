"""
ProHouzing Contract Configuration
Prompt 9/20 - Contract & Document Workflow

Contains:
- Contract Types for BĐS Sơ Cấp
- Contract Status Lifecycle
- Amendment Types
- Constraint Rules
- Approval Workflow Configuration
- Payment Status
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class ContractType(str, Enum):
    """Contract types for BĐS Sơ Cấp"""
    # Primary Sales Contracts
    BOOKING_AGREEMENT = "booking_agreement"       # Thỏa thuận giữ chỗ
    DEPOSIT_AGREEMENT = "deposit_agreement"       # Hợp đồng đặt cọc
    SALE_CONTRACT = "sale_contract"               # Hợp đồng mua bán
    PRINCIPLE_AGREEMENT = "principle_agreement"   # Hợp đồng nguyên tắc
    
    # Supporting Contracts
    HANDOVER_AGREEMENT = "handover_agreement"     # Biên bản bàn giao
    WARRANTY_AGREEMENT = "warranty_agreement"     # Thỏa thuận bảo hành
    TERMINATION_AGREEMENT = "termination_agreement"  # Thỏa thuận chấm dứt
    
    # Agency/Partner
    BROKERAGE_CONTRACT = "brokerage_contract"     # HĐ môi giới
    COLLABORATOR_CONTRACT = "collaborator_contract"  # HĐ CTV


CONTRACT_TYPE_CONFIG = {
    ContractType.BOOKING_AGREEMENT: {
        "label": "Thỏa thuận giữ chỗ",
        "short_code": "TTGC",
        "requires_product": True,
        "requires_customer": True,
        "has_financial": True,
        "can_have_amendment": False,
        "requires_parent": False,
        "approval_workflow": "simple",
        "default_validity_days": 30,
    },
    ContractType.DEPOSIT_AGREEMENT: {
        "label": "Hợp đồng đặt cọc",
        "short_code": "HDDC",
        "requires_product": True,
        "requires_customer": True,
        "has_financial": True,
        "can_have_amendment": True,
        "requires_parent": False,
        "approval_workflow": "standard",
        "default_validity_days": 90,
    },
    ContractType.SALE_CONTRACT: {
        "label": "Hợp đồng mua bán",
        "short_code": "HDMB",
        "requires_product": True,
        "requires_customer": True,
        "has_financial": True,
        "can_have_amendment": True,
        "requires_parent": False,
        "approval_workflow": "full",
        "default_validity_days": None,  # No expiry
    },
    ContractType.PRINCIPLE_AGREEMENT: {
        "label": "Hợp đồng nguyên tắc",
        "short_code": "HDNT",
        "requires_product": True,
        "requires_customer": True,
        "has_financial": True,
        "can_have_amendment": True,
        "requires_parent": False,
        "approval_workflow": "standard",
        "default_validity_days": 180,
    },
    ContractType.HANDOVER_AGREEMENT: {
        "label": "Biên bản bàn giao",
        "short_code": "BBBG",
        "requires_product": True,
        "requires_customer": True,
        "has_financial": False,
        "can_have_amendment": False,
        "requires_parent": True,  # Requires sale contract
        "approval_workflow": "simple",
        "default_validity_days": None,
    },
    ContractType.TERMINATION_AGREEMENT: {
        "label": "Thỏa thuận chấm dứt",
        "short_code": "TTCD",
        "requires_product": False,
        "requires_customer": True,
        "has_financial": True,
        "can_have_amendment": False,
        "requires_parent": True,
        "approval_workflow": "full",
        "default_validity_days": None,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT STATUS LIFECYCLE
# ═══════════════════════════════════════════════════════════════════════════════

class ContractStatus(str, Enum):
    """Contract status lifecycle"""
    DRAFT = "draft"                         # Nháp
    PENDING_REVIEW = "pending_review"       # Chờ duyệt
    REVISION_REQUIRED = "revision_required" # Cần sửa đổi
    APPROVED = "approved"                   # Đã duyệt
    PENDING_SIGNATURE = "pending_signature" # Chờ ký
    SIGNED = "signed"                       # Đã ký
    ACTIVE = "active"                       # Có hiệu lực
    COMPLETED = "completed"                 # Hoàn thành
    EXPIRED = "expired"                     # Hết hạn
    TERMINATED = "terminated"               # Chấm dứt
    CANCELLED = "cancelled"                 # Hủy bỏ
    ARCHIVED = "archived"                   # Lưu trữ


CONTRACT_STATUS_CONFIG = {
    ContractStatus.DRAFT: {
        "label": "Nháp",
        "color": "slate",
        "is_editable": True,
        "is_locked": False,
        "can_delete": True,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["pending_review", "cancelled"],
        "required_fields": ["contract_type", "customer_id", "project_id"],
    },
    ContractStatus.PENDING_REVIEW: {
        "label": "Chờ duyệt",
        "color": "yellow",
        "is_editable": False,
        "is_locked": False,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["approved", "revision_required", "cancelled"],
        "required_fields": ["product_id", "contract_value"],
    },
    ContractStatus.REVISION_REQUIRED: {
        "label": "Cần sửa đổi",
        "color": "orange",
        "is_editable": True,
        "is_locked": False,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["pending_review", "cancelled"],
        "required_fields": [],
    },
    ContractStatus.APPROVED: {
        "label": "Đã duyệt",
        "color": "blue",
        "is_editable": False,
        "is_locked": False,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["pending_signature", "cancelled"],
        "required_fields": [],
    },
    ContractStatus.PENDING_SIGNATURE: {
        "label": "Chờ ký",
        "color": "purple",
        "is_editable": False,
        "is_locked": False,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["signed", "cancelled"],
        "required_fields": [],
    },
    ContractStatus.SIGNED: {
        "label": "Đã ký",
        "color": "green",
        "is_editable": False,
        "is_locked": True,  # LOCKED
        "can_delete": False,
        "can_create_amendment": True,
        "can_record_payment": True,
        "allowed_transitions": ["active"],
        "required_fields": ["signed_by_customer_id", "signed_by_company_id"],
    },
    ContractStatus.ACTIVE: {
        "label": "Có hiệu lực",
        "color": "emerald",
        "is_editable": False,
        "is_locked": True,  # LOCKED
        "can_delete": False,
        "can_create_amendment": True,
        "can_record_payment": True,
        "allowed_transitions": ["completed", "terminated", "expired"],
        "required_fields": [],
    },
    ContractStatus.COMPLETED: {
        "label": "Hoàn thành",
        "color": "green",
        "is_editable": False,
        "is_locked": True,  # LOCKED
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["archived"],
        "required_fields": [],
    },
    ContractStatus.EXPIRED: {
        "label": "Hết hạn",
        "color": "red",
        "is_editable": False,
        "is_locked": True,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["archived"],
        "required_fields": [],
    },
    ContractStatus.TERMINATED: {
        "label": "Chấm dứt",
        "color": "red",
        "is_editable": False,
        "is_locked": True,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["archived"],
        "required_fields": [],
    },
    ContractStatus.CANCELLED: {
        "label": "Hủy bỏ",
        "color": "gray",
        "is_editable": False,
        "is_locked": True,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": ["archived"],
        "required_fields": [],
    },
    ContractStatus.ARCHIVED: {
        "label": "Lưu trữ",
        "color": "gray",
        "is_editable": False,
        "is_locked": True,
        "can_delete": False,
        "can_create_amendment": False,
        "can_record_payment": False,
        "allowed_transitions": [],
        "required_fields": [],
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# AMENDMENT TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class AmendmentType(str, Enum):
    """Types of contract amendments"""
    PRICE_CHANGE = "price_change"           # Thay đổi giá
    SCHEDULE_CHANGE = "schedule_change"     # Thay đổi tiến độ thanh toán
    INFO_CHANGE = "info_change"             # Thay đổi thông tin khách hàng
    UNIT_CHANGE = "unit_change"             # Đổi căn
    EXTENSION = "extension"                 # Gia hạn
    SPECIAL_TERMS = "special_terms"         # Điều khoản đặc biệt
    GENERAL = "general"                     # Phụ lục chung


AMENDMENT_TYPE_CONFIG = {
    AmendmentType.PRICE_CHANGE: {
        "label": "Thay đổi giá",
        "short_code": "TDG",
        "affected_fields": ["contract_value", "discount_amount", "discount_percent", "grand_total"],
        "requires_finance_approval": True,
    },
    AmendmentType.SCHEDULE_CHANGE: {
        "label": "Thay đổi tiến độ",
        "short_code": "TDTD",
        "affected_fields": ["payment_schedule"],
        "requires_finance_approval": True,
    },
    AmendmentType.INFO_CHANGE: {
        "label": "Thay đổi thông tin",
        "short_code": "TDTT",
        "affected_fields": ["customer_id", "co_owners"],
        "requires_finance_approval": False,
    },
    AmendmentType.UNIT_CHANGE: {
        "label": "Đổi căn",
        "short_code": "DC",
        "affected_fields": ["product_id", "contract_value", "payment_schedule"],
        "requires_finance_approval": True,
    },
    AmendmentType.EXTENSION: {
        "label": "Gia hạn",
        "short_code": "GH",
        "affected_fields": ["expiry_date", "signing_deadline"],
        "requires_finance_approval": False,
    },
    AmendmentType.SPECIAL_TERMS: {
        "label": "Điều khoản đặc biệt",
        "short_code": "DKDB",
        "affected_fields": [],
        "requires_finance_approval": False,
    },
    AmendmentType.GENERAL: {
        "label": "Phụ lục chung",
        "short_code": "PLC",
        "affected_fields": [],
        "requires_finance_approval": False,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class PaymentStatus(str, Enum):
    """Payment installment status"""
    PENDING = "pending"       # Chờ thanh toán
    PARTIAL = "partial"       # Thanh toán một phần
    PAID = "paid"            # Đã thanh toán đủ
    OVERDUE = "overdue"      # Quá hạn
    WAIVED = "waived"        # Được miễn


PAYMENT_STATUS_CONFIG = {
    PaymentStatus.PENDING: {
        "label": "Chờ thanh toán",
        "color": "yellow",
        "is_final": False,
    },
    PaymentStatus.PARTIAL: {
        "label": "Thanh toán một phần",
        "color": "blue",
        "is_final": False,
    },
    PaymentStatus.PAID: {
        "label": "Đã thanh toán",
        "color": "green",
        "is_final": True,
    },
    PaymentStatus.OVERDUE: {
        "label": "Quá hạn",
        "color": "red",
        "is_final": False,
    },
    PaymentStatus.WAIVED: {
        "label": "Được miễn",
        "color": "gray",
        "is_final": True,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class ApprovalStatus(str, Enum):
    """Approval workflow status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReviewStatus(str, Enum):
    """Individual review step status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


# ═══════════════════════════════════════════════════════════════════════════════
# SIGNING STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class SigningStatus(str, Enum):
    """Contract signing status"""
    PENDING = "pending"
    CUSTOMER_SIGNED = "customer_signed"
    COMPANY_SIGNED = "company_signed"
    COMPLETED = "completed"


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTRAINT RULES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ConstraintRule:
    """Constraint rule for contract modification"""
    editable_fields: List[str]
    locked_fields: List[str]
    can_delete: bool
    can_create_amendment: bool
    can_record_payment: bool


# Fields that are NEVER editable after creation
IMMUTABLE_FIELDS = [
    "id",
    "contract_code",
    "tenant_id",
    "created_by",
    "created_at",
]

# Fields that are locked after SIGNED status
FINANCIAL_LOCKED_FIELDS = [
    "contract_value",
    "vat_amount",
    "total_with_vat",
    "grand_total",
    "discount_amount",
    "discount_percent",
    "payment_schedule",
]

# Fields that are locked after SIGNED status
RELATIONSHIP_LOCKED_FIELDS = [
    "deal_id",
    "booking_id",
    "customer_id",
    "product_id",
    "project_id",
]

# Fields always editable (until archived)
ALWAYS_EDITABLE_FIELDS = [
    "internal_notes",
    "tags",
    "priority",
]


def get_editable_fields(status: ContractStatus) -> List[str]:
    """Get list of editable fields for a status"""
    config = CONTRACT_STATUS_CONFIG.get(status, {})
    
    if config.get("is_locked"):
        return ALWAYS_EDITABLE_FIELDS.copy()
    
    if config.get("is_editable"):
        # Return all fields except immutable
        return ["*"]  # Special marker for all fields
    
    return ALWAYS_EDITABLE_FIELDS.copy()


def can_edit_field(status: ContractStatus, field: str) -> bool:
    """Check if a specific field can be edited"""
    if field in IMMUTABLE_FIELDS:
        return False
    
    if field in ALWAYS_EDITABLE_FIELDS:
        return True
    
    config = CONTRACT_STATUS_CONFIG.get(status, {})
    
    if config.get("is_locked"):
        return False
    
    return config.get("is_editable", False)


def can_transition_to(current: ContractStatus, target: ContractStatus) -> bool:
    """Check if transition from current to target status is allowed"""
    config = CONTRACT_STATUS_CONFIG.get(current, {})
    allowed = config.get("allowed_transitions", [])
    return target.value in allowed


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL WORKFLOW CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

APPROVAL_WORKFLOWS = {
    "simple": {
        "id": "simple",
        "name": "Quy trình đơn giản",
        "steps": [
            {
                "step": 1,
                "name": "Manager Review",
                "role": "sales_manager",
                "required": True,
                "timeout_hours": 24,
            },
        ],
    },
    "standard": {
        "id": "standard",
        "name": "Quy trình tiêu chuẩn",
        "steps": [
            {
                "step": 1,
                "name": "Sales Manager Review",
                "role": "sales_manager",
                "required": True,
                "timeout_hours": 24,
            },
            {
                "step": 2,
                "name": "Legal Review",
                "role": "legal",
                "required": True,
                "timeout_hours": 48,
            },
        ],
    },
    "full": {
        "id": "full",
        "name": "Quy trình đầy đủ",
        "steps": [
            {
                "step": 1,
                "name": "Sales Manager Review",
                "role": "sales_manager",
                "required": True,
                "timeout_hours": 24,
            },
            {
                "step": 2,
                "name": "Legal Review",
                "role": "legal",
                "required": True,
                "timeout_hours": 48,
            },
            {
                "step": 3,
                "name": "Finance Review",
                "role": "finance",
                "required": False,
                "timeout_hours": 24,
                "skip_if": {
                    "condition": "discount_percent <= 5",
                    "message": "Chiết khấu <= 5% không cần Finance duyệt",
                },
            },
            {
                "step": 4,
                "name": "Director Approval",
                "role": "director",
                "required": False,
                "timeout_hours": 24,
                "skip_if": {
                    "condition": "contract_value < 5000000000 and discount_percent <= 10",
                    "message": "HĐ < 5 tỷ và CK <= 10% không cần GĐ duyệt",
                },
            },
        ],
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

PAYMENT_CONFIG = {
    "grace_period_days": 3,           # Days before marking as overdue
    "default_penalty_rate": 0.0005,   # 0.05% per day
    "max_penalty_percent": 10,        # Max 10% of installment
    "reminder_days_before": [7, 3, 1], # Send reminders X days before due
}


# Stage payment requirements (for Contract-Deal sync)
STAGE_PAYMENT_REQUIREMENTS = {
    "hard_booking": {
        "required_percent": 0,
        "message": "Không yêu cầu thanh toán",
    },
    "depositing": {
        "required_percent": 10,
        "required_installments": [1],
        "message": "Phải đặt cọc ít nhất 10%",
    },
    "contracting": {
        "required_percent": 30,
        "required_installments": [1, 2],
        "message": "Phải thanh toán ít nhất 30%",
    },
    "payment_progress": {
        "required_percent": 30,
        "message": "Đang trong tiến độ thanh toán",
    },
    "handover_pending": {
        "required_percent": 95,
        "message": "Phải thanh toán 95% để nhận bàn giao",
    },
    "completed": {
        "required_percent": 100,
        "message": "Phải thanh toán đủ 100%",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT CODE GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_contract_code(
    project_code: str,
    contract_type: ContractType,
    sequence: int,
    year: int = None
) -> str:
    """
    Generate contract code in format: PROJECT-TYPE-YEAR-XXXX
    Example: SG01-HDMB-2026-0001
    """
    from datetime import datetime
    
    if year is None:
        year = datetime.now().year
    
    type_config = CONTRACT_TYPE_CONFIG.get(contract_type, {})
    type_code = type_config.get("short_code", "HD")
    
    return f"{project_code}-{type_code}-{year}-{sequence:04d}"


def generate_amendment_code(
    parent_contract_code: str,
    amendment_number: int
) -> str:
    """
    Generate amendment code in format: CONTRACT_CODE-PL-XX
    Example: SG01-HDMB-2026-0001-PL-01
    """
    return f"{parent_contract_code}-PL-{amendment_number:02d}"


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_contract_type_config(contract_type: ContractType) -> dict:
    """Get configuration for a contract type"""
    return CONTRACT_TYPE_CONFIG.get(contract_type, {})


def get_status_config(status: ContractStatus) -> dict:
    """Get configuration for a contract status"""
    return CONTRACT_STATUS_CONFIG.get(status, {})


def get_approval_workflow(contract_type: ContractType) -> dict:
    """Get approval workflow for a contract type"""
    type_config = CONTRACT_TYPE_CONFIG.get(contract_type, {})
    workflow_id = type_config.get("approval_workflow", "simple")
    return APPROVAL_WORKFLOWS.get(workflow_id, APPROVAL_WORKFLOWS["simple"])


def is_contract_locked(status: ContractStatus) -> bool:
    """Check if contract is in a locked state"""
    return CONTRACT_STATUS_CONFIG.get(status, {}).get("is_locked", False)


def can_create_amendment_at_status(status: ContractStatus) -> bool:
    """Check if amendments can be created at this status"""
    return CONTRACT_STATUS_CONFIG.get(status, {}).get("can_create_amendment", False)


def can_record_payment_at_status(status: ContractStatus) -> bool:
    """Check if payments can be recorded at this status"""
    return CONTRACT_STATUS_CONFIG.get(status, {}).get("can_record_payment", False)
