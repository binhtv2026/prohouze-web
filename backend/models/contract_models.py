"""
ProHouzing Contract Models
Prompt 9/20 - Contract & Document Workflow

Models:
- Contract (main contract entity)
- Amendment (contract amendment/addendum)
- PaymentInstallment (embedded in contract)
- ApprovalLog (approval workflow history)
- ContractAuditLog (audit trail)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from config.contract_config import (
    ContractType, ContractStatus, AmendmentType,
    PaymentStatus, ApprovalStatus, ReviewStatus, SigningStatus
)


# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDED MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class PaymentInstallment(BaseModel):
    """Payment installment - Đợt thanh toán (embedded in Contract)"""
    installment_number: int
    installment_name: str                    # "Đợt 1 - Ký HĐ"
    
    # Amount
    percent_of_total: float = 0              # % tổng giá trị
    amount: float = 0                        # Số tiền phải thanh toán
    
    # Due
    due_date: str                            # ISO datetime
    due_description: str = ""                # "Trong vòng 7 ngày kể từ ngày ký HĐ"
    
    # Payment
    paid_amount: float = 0
    paid_date: Optional[str] = None
    payment_method: Optional[str] = None     # transfer, cash, check
    payment_reference: Optional[str] = None  # Mã giao dịch
    receipt_document_id: Optional[str] = None
    
    # Status
    status: str = PaymentStatus.PENDING.value
    overdue_days: int = 0
    
    # Penalty
    penalty_rate: float = 0.0005             # % per day
    penalty_amount: float = 0
    penalty_waived: bool = False
    penalty_waiver_reason: Optional[str] = None
    penalty_waiver_by: Optional[str] = None
    
    notes: Optional[str] = None


class StatusTransition(BaseModel):
    """Status transition history entry"""
    from_status: str
    to_status: str
    changed_by: str
    changed_by_name: str = ""
    changed_at: str
    reason: Optional[str] = None
    notes: Optional[str] = None


class ChecklistItem(BaseModel):
    """Document checklist item"""
    item_code: str
    item_name: str
    category: str
    is_required: bool = True
    document_id: Optional[str] = None
    status: str = "pending"                  # pending, uploaded, verified, rejected, waived
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    notes: Optional[str] = None


class WitnessInfo(BaseModel):
    """Witness information for contract signing"""
    name: str
    id_number: str
    phone: Optional[str] = None
    address: Optional[str] = None
    relationship: Optional[str] = None       # "Vợ/chồng", "Người thân"


class FieldChange(BaseModel):
    """Field change for amendment tracking"""
    field_name: str
    old_value: Any
    new_value: Any
    reason: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT CREATE/UPDATE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ContractCreate(BaseModel):
    """Create new contract"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Type
    contract_type: str = ContractType.SALE_CONTRACT.value
    
    # Relationships
    deal_id: Optional[str] = None
    booking_id: Optional[str] = None
    customer_id: str
    co_owners: List[str] = []
    product_id: str
    project_id: str
    
    # Financial
    unit_price: float = 0
    unit_area: float = 0
    price_per_sqm: float = 0
    premium_adjustments: float = 0
    discount_amount: float = 0
    discount_percent: float = 0
    discount_reason: Optional[str] = None
    vat_percent: float = 10
    maintenance_fee: float = 0
    other_fees: float = 0
    
    # Deposit
    deposit_amount: float = 0
    deposit_due_date: Optional[str] = None
    
    # Payment plan
    payment_plan_id: Optional[str] = None
    
    # Dates
    contract_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    signing_deadline: Optional[str] = None
    expected_handover_date: Optional[str] = None
    
    # Ownership
    owner_id: Optional[str] = None
    branch_id: Optional[str] = None
    
    # Notes
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    tags: List[str] = []
    priority: str = "normal"


class ContractUpdate(BaseModel):
    """Update contract (with constraint checking)"""
    # Only include fields that can be updated
    # Financial updates only allowed before SIGNED
    unit_price: Optional[float] = None
    unit_area: Optional[float] = None
    price_per_sqm: Optional[float] = None
    premium_adjustments: Optional[float] = None
    discount_amount: Optional[float] = None
    discount_percent: Optional[float] = None
    discount_reason: Optional[str] = None
    vat_percent: Optional[float] = None
    maintenance_fee: Optional[float] = None
    other_fees: Optional[float] = None
    
    # Deposit
    deposit_amount: Optional[float] = None
    deposit_due_date: Optional[str] = None
    
    # Dates
    contract_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    signing_deadline: Optional[str] = None
    expected_handover_date: Optional[str] = None
    
    # Notes (always editable until archived)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: Optional[str] = None
    
    # Reason for update
    update_reason: Optional[str] = None


class ContractResponse(BaseModel):
    """Contract response model"""
    id: str
    contract_code: str = ""
    contract_type: str = "sale_contract"
    contract_type_label: str = ""
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Relationships
    deal_id: Optional[str] = None
    booking_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str = ""
    co_owners: List[str] = []
    product_id: Optional[str] = None
    product_code: str = ""
    product_name: str = ""
    project_id: Optional[str] = None
    project_name: str = ""
    
    # Parent-child (for amendments)
    parent_contract_id: Optional[str] = None
    is_amendment: bool = False
    amendment_number: int = 0
    active_amendments: List[str] = []
    
    # Status
    status: str
    status_label: str = ""
    status_color: str = ""
    status_changed_at: Optional[str] = None
    status_changed_by: Optional[str] = None
    is_locked: bool = False
    
    # Financial
    unit_price: float = 0
    unit_area: float = 0
    price_per_sqm: float = 0
    premium_adjustments: float = 0
    discount_amount: float = 0
    discount_percent: float = 0
    discount_reason: Optional[str] = None
    contract_value: float = 0
    vat_percent: float = 10
    vat_amount: float = 0
    total_with_vat: float = 0
    maintenance_fee: float = 0
    other_fees: float = 0
    grand_total: float = 0
    
    # Deposit
    deposit_amount: float = 0
    deposit_paid: float = 0
    deposit_paid_date: Optional[str] = None
    deposit_status: str = PaymentStatus.PENDING.value
    deposit_due_date: Optional[str] = None
    deposit_receipt_id: Optional[str] = None
    
    # Payment schedule
    payment_plan_id: Optional[str] = None
    payment_plan_name: str = ""
    payment_schedule: List[PaymentInstallment] = []
    
    # Payment summary
    total_paid: float = 0
    remaining_amount: float = 0
    payment_completion_percent: float = 0
    overdue_amount: float = 0
    overdue_installments: int = 0
    next_due_date: Optional[str] = None
    next_due_amount: float = 0
    
    # Dates
    contract_date: Optional[str] = None
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    signing_deadline: Optional[str] = None
    expected_handover_date: Optional[str] = None
    actual_handover_date: Optional[str] = None
    
    # Creator & Ownership
    created_by: Optional[str] = None
    created_by_name: str = ""
    created_at: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: str = ""
    branch_id: Optional[str] = None
    
    # Approval
    approval_workflow_id: Optional[str] = None
    current_approval_step: int = 0
    approval_status: str = ApprovalStatus.NOT_STARTED.value
    
    sales_review_status: str = ReviewStatus.PENDING.value
    sales_reviewed_by: Optional[str] = None
    sales_reviewed_at: Optional[str] = None
    
    legal_review_status: str = ReviewStatus.PENDING.value
    legal_reviewed_by: Optional[str] = None
    legal_reviewed_at: Optional[str] = None
    
    finance_review_required: bool = False
    finance_review_status: str = ReviewStatus.PENDING.value
    
    final_approved_by: Optional[str] = None
    final_approved_at: Optional[str] = None
    
    # Signing
    signing_status: str = SigningStatus.PENDING.value
    signed_by_customer_id: Optional[str] = None
    signed_by_customer_name: str = ""
    customer_signed_at: Optional[str] = None
    signed_by_company_id: Optional[str] = None
    signed_by_company_name: str = ""
    signed_by_company_title: str = ""
    company_signed_at: Optional[str] = None
    signing_location: Optional[str] = None
    notarized: bool = False
    notarization_date: Optional[str] = None
    
    # Documents
    document_ids: List[str] = []
    document_count: int = 0
    required_checklist: List[ChecklistItem] = []
    checklist_complete: bool = False
    checklist_verified: bool = False
    missing_documents: List[str] = []
    
    # Version
    version: int = 1
    last_modified_by: Optional[str] = None
    last_modified_at: Optional[str] = None
    
    # Notes
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    tags: List[str] = []
    priority: str = "normal"
    
    # Computed health
    health_score: float = 100
    is_overdue: bool = False
    days_until_expiry: Optional[int] = None
    days_overdue: int = 0
    risk_level: str = "low"
    risk_factors: List[str] = []


# ═══════════════════════════════════════════════════════════════════════════════
# AMENDMENT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class AmendmentCreate(BaseModel):
    """Create new amendment (inherits from parent contract)"""
    parent_contract_id: str
    amendment_type: str = AmendmentType.GENERAL.value
    reason: str
    changes_summary: str
    
    # Only changed fields - NOT full contract copy
    changed_fields: List[FieldChange] = []
    
    # Dates
    effective_date: Optional[str] = None
    
    notes: Optional[str] = None


class AmendmentResponse(BaseModel):
    """Amendment response model"""
    id: str
    amendment_code: str
    amendment_number: int
    parent_contract_id: str
    parent_contract_code: str = ""
    
    # Type & Reason
    amendment_type: str
    amendment_type_label: str = ""
    reason: str
    changes_summary: str
    
    # Changes
    changed_fields: List[FieldChange] = []
    old_values: Dict[str, Any] = {}
    new_values: Dict[str, Any] = {}
    
    # Status
    status: str
    status_label: str = ""
    effective_date: Optional[str] = None
    
    # Approval
    approval_status: str = ApprovalStatus.NOT_STARTED.value
    approved_by: Optional[str] = None
    approved_by_name: str = ""
    approved_at: Optional[str] = None
    approval_notes: Optional[str] = None
    
    # Signing
    signed_by_customer: Optional[str] = None
    signed_by_company: Optional[str] = None
    signed_date: Optional[str] = None
    
    # Documents
    document_ids: List[str] = []
    
    # Audit
    created_by: Optional[str] = None
    created_by_name: str = ""
    created_at: Optional[str] = None
    
    tenant_id: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ApprovalAction(str, Enum):
    """Approval action types"""
    SUBMIT = "submit"
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_REVISION = "request_revision"
    SKIP = "skip"
    ROLLBACK = "rollback"


class ApproveRequest(BaseModel):
    """Request to approve current step"""
    comments: Optional[str] = None


class RejectRequest(BaseModel):
    """Request to reject and send back for revision"""
    reason: str
    required_changes: List[str] = []


class ApprovalLogResponse(BaseModel):
    """Approval log entry"""
    id: str
    entity_type: str                         # "contract", "amendment"
    entity_id: str
    
    # Workflow
    workflow_id: str
    step_number: int
    step_name: str
    
    # Action
    action: str                              # ApprovalAction value
    actor_id: str
    actor_name: str = ""
    actor_role: str = ""
    
    # Details
    decision: Optional[str] = None
    comments: Optional[str] = None
    rejection_reason: Optional[str] = None
    required_changes: List[str] = []
    
    # For skip
    skip_reason: Optional[str] = None
    
    # Timing
    created_at: str
    deadline: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class RecordPaymentRequest(BaseModel):
    """Request to record payment for an installment"""
    installment_number: int
    amount: float
    payment_method: str = "transfer"         # transfer, cash, check
    payment_reference: Optional[str] = None
    payment_date: Optional[str] = None
    receipt_document_id: Optional[str] = None
    notes: Optional[str] = None


class PaymentHistoryResponse(BaseModel):
    """Payment history entry"""
    id: str
    contract_id: str
    installment_number: int
    amount: float
    payment_method: str
    payment_reference: Optional[str] = None
    payment_date: str
    receipt_document_id: Optional[str] = None
    recorded_by: str
    recorded_by_name: str = ""
    recorded_at: str
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOG MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ContractAuditLogResponse(BaseModel):
    """Contract audit log entry"""
    id: str
    entity_type: str                         # "contract", "amendment"
    entity_id: str
    entity_code: str = ""
    
    # Action
    action: str                              # create, update, approve, sign, etc.
    action_label: str = ""
    
    # Actor
    actor_id: str
    actor_name: str = ""
    actor_role: str = ""
    
    # Changes
    changes: Dict[str, Dict[str, Any]] = {}  # {field: {old, new}}
    reason: Optional[str] = None
    
    # Timing
    timestamp: str
    ip_address: Optional[str] = None
    
    metadata: Dict[str, Any] = {}


# ═══════════════════════════════════════════════════════════════════════════════
# STATUS TRANSITION MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class StatusTransitionRequest(BaseModel):
    """Request to transition contract status"""
    target_status: str
    reason: Optional[str] = None
    notes: Optional[str] = None


class SignContractRequest(BaseModel):
    """Request to mark contract as signed"""
    signed_by_customer_id: str
    signed_by_company_id: str
    signed_by_company_title: str = "Giám đốc"
    signing_location: Optional[str] = None
    signing_date: Optional[str] = None
    witnesses: List[WitnessInfo] = []
    notarized: bool = False
    notarization_date: Optional[str] = None
    notarization_ref: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY/PIPELINE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ContractPipelineSummary(BaseModel):
    """Contract pipeline summary"""
    total_contracts: int = 0
    total_value: float = 0
    total_paid: float = 0
    total_remaining: float = 0
    
    by_status: Dict[str, int] = {}
    by_type: Dict[str, int] = {}
    
    overdue_contracts: int = 0
    overdue_amount: float = 0
    
    expiring_soon: int = 0                   # Expiring in 30 days
    pending_approval: int = 0
    pending_signature: int = 0


class ContractListFilters(BaseModel):
    """Filters for contract list"""
    status: Optional[str] = None
    contract_type: Optional[str] = None
    project_id: Optional[str] = None
    customer_id: Optional[str] = None
    owner_id: Optional[str] = None
    is_overdue: Optional[bool] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    search: Optional[str] = None             # Search by code, customer name
    
    skip: int = 0
    limit: int = 50
    sort_by: str = "created_at"
    sort_order: str = "desc"
