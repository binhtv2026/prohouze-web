"""
ProHouzing Commission Models
Prompt 11/20 - Commission Engine

Pydantic models for:
- Commission Policy
- Commission Event
- Commission Record
- Commission Approval
- Payout Batch/Record
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from config.commission_config import (
    CommissionStatus, CommissionTrigger, CommissionSplitType,
    ApprovalStatus, ApprovalAction, PayoutStatus, PayoutBatchStatus,
    PolicyStatus, BrokerageRateType, SplitCalcType
)


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION POLICY MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class SplitCondition(BaseModel):
    """Condition for split rule"""
    field: str                               # contract_value, product_type, etc.
    operator: str                            # eq, gt, lt, in, between
    value: Any


class BrokerageTier(BaseModel):
    """Tier for tiered brokerage calculation"""
    min_value: float = 0
    max_value: Optional[float] = None
    rate: float                              # Percentage


class SplitRule(BaseModel):
    """Split rule within a policy"""
    split_type: str                          # CommissionSplitType value
    recipient_role: str                      # sales, team_leader, etc.
    recipient_source: str                    # deal_owner, team_leader, manual
    
    # Calculation
    calc_type: str = SplitCalcType.PERCENT_OF_BROKERAGE.value
    calc_value: float                        # Percentage or fixed amount
    
    # Constraints
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    
    # Conditions
    conditions: List[SplitCondition] = []
    
    # For manual recipient
    manual_recipient_id: Optional[str] = None


class CommissionPolicyCreate(BaseModel):
    """Create commission policy"""
    name: str
    description: Optional[str] = None
    
    # Scope
    scope_type: str = "global"               # global, project, product_type, campaign
    project_ids: List[str] = []
    product_types: List[str] = []
    campaign_ids: List[str] = []
    branch_ids: List[str] = []
    
    # Brokerage Rate
    brokerage_rate_type: str = BrokerageRateType.PERCENT.value
    brokerage_rate_value: float = 2.0        # Default 2%
    brokerage_tiers: List[BrokerageTier] = []
    
    # Split Rules
    split_rules: List[SplitRule]
    
    # Trigger
    trigger_event: str = CommissionTrigger.CONTRACT_SIGNED.value
    estimated_trigger: str = CommissionTrigger.BOOKING_CONFIRMED.value
    
    # Validity
    effective_from: str
    effective_to: Optional[str] = None
    
    # Approval
    requires_approval_above: float = 50_000_000
    approval_levels: int = 1
    
    notes: Optional[str] = None


class CommissionPolicyResponse(BaseModel):
    """Commission policy response"""
    id: str
    code: str
    name: str
    description: Optional[str] = None
    
    # Scope
    scope_type: str
    scope_label: str = ""
    project_ids: List[str] = []
    project_names: List[str] = []
    product_types: List[str] = []
    campaign_ids: List[str] = []
    branch_ids: List[str] = []
    
    # Brokerage
    brokerage_rate_type: str
    brokerage_rate_type_label: str = ""
    brokerage_rate_value: float
    brokerage_tiers: List[BrokerageTier] = []
    
    # Split Rules
    split_rules: List[SplitRule] = []
    total_split_percent: float = 0
    
    # Trigger
    trigger_event: str
    trigger_event_label: str = ""
    estimated_trigger: str
    
    # Validity
    effective_from: str
    effective_to: Optional[str] = None
    is_active: bool = False
    
    # Approval
    requires_approval_above: float
    approval_levels: int
    
    # Status
    status: str
    status_label: str = ""
    version: int = 1
    previous_version_id: Optional[str] = None
    
    # Audit
    created_by: Optional[str] = None
    created_by_name: str = ""
    created_at: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION EVENT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionEventCreate(BaseModel):
    """Create commission event (internal)"""
    event_type: str                          # CommissionTrigger value
    
    # Source
    source_entity_type: str                  # soft_booking, hard_booking, contract
    source_entity_id: str
    
    # Contract (required for non-estimated)
    contract_id: Optional[str] = None
    contract_code: Optional[str] = None
    contract_value: float                    # BASE AMOUNT
    
    # Related entities
    deal_id: str
    booking_id: Optional[str] = None
    customer_id: str
    product_id: str
    project_id: str
    
    # Sales info
    sales_owner_id: str
    co_broker_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None


class CommissionEventResponse(BaseModel):
    """Commission event response"""
    id: str
    event_type: str
    event_type_label: str = ""
    
    # Source
    source_entity_type: str
    source_entity_id: str
    
    # Contract
    contract_id: Optional[str] = None
    contract_code: Optional[str] = None
    contract_value: float
    
    # Related
    deal_id: str
    booking_id: Optional[str] = None
    customer_id: str
    customer_name: str = ""
    product_id: str
    product_code: str = ""
    project_id: str
    project_name: str = ""
    
    # Sales
    sales_owner_id: str
    sales_owner_name: str = ""
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    
    # Processing
    triggered_at: str
    triggered_by: str
    processed: bool = False
    processed_at: Optional[str] = None
    commission_record_ids: List[str] = []
    
    # Idempotency
    idempotency_key: str


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION RECORD MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionRecordCreate(BaseModel):
    """Create commission record (manual)"""
    # Source
    contract_id: str
    deal_id: Optional[str] = None
    
    # Recipient
    recipient_id: str
    recipient_role: str                      # sales, team_leader, etc.
    commission_type: str                     # CommissionSplitType value
    
    # Amount (manual override)
    base_amount: Optional[float] = None      # If not provided, use contract value
    commission_amount: float
    
    notes: Optional[str] = None


class CommissionAdjustment(BaseModel):
    """Commission adjustment request"""
    adjusted_amount: float
    adjustment_reason: str


class CommissionRecordResponse(BaseModel):
    """Commission record response"""
    id: str
    code: str
    
    # Event & Policy
    event_id: Optional[str] = None
    event_type: str
    event_type_label: str = ""
    policy_id: Optional[str] = None
    policy_name: str = ""
    policy_version: int = 0
    
    # Source Entities
    contract_id: Optional[str] = None
    contract_code: str = ""
    deal_id: Optional[str] = None
    deal_code: str = ""
    booking_id: Optional[str] = None
    
    # Product/Project
    product_id: Optional[str] = None
    product_code: str = ""
    product_name: str = ""
    project_id: Optional[str] = None
    project_name: str = ""
    
    # Customer
    customer_id: Optional[str] = None
    customer_name: str = ""
    
    # Recipient
    recipient_id: str
    recipient_name: str = ""
    recipient_role: str
    recipient_role_label: str = ""
    recipient_type: str = "employee"         # employee, collaborator
    
    # Calculation
    base_amount: float = 0                   # Contract value
    brokerage_rate: float = 0
    brokerage_amount: float = 0
    
    commission_type: str
    commission_type_label: str = ""
    split_percent: float = 0
    commission_amount: float = 0
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RULE SNAPSHOT - Lưu trữ chính xác rule đã áp dụng tại thời điểm tính
    # ═══════════════════════════════════════════════════════════════════════════
    rule_snapshot: Optional[Dict[str, Any]] = None  # Full snapshot object
    rule_name: str = ""                      # Tên policy tại thời điểm tính
    rule_version: int = 0                    # Version của policy
    applied_percentage: float = 0            # % đã áp dụng (split_percent)
    applied_formula: str = ""                # Công thức: "base × brokerage_rate × split_percent"
    split_structure: Optional[Dict[str, Any]] = None  # Cấu trúc split rule đã dùng
    
    # Legacy flag - Record cũ không có snapshot
    is_legacy: bool = False                  # True = record cũ, không có snapshot
    legacy_warning: str = ""                 # Warning message cho legacy records
    
    # Adjustments
    adjusted_amount: float = 0
    adjustment_reason: Optional[str] = None
    adjustment_by: Optional[str] = None
    adjustment_at: Optional[str] = None
    
    # Final
    final_amount: float = 0
    
    # Status
    is_estimated: bool = False
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Approval
    approval_status: str
    approval_status_label: str = ""
    current_approval_step: int = 0
    required_approval_levels: int = 0
    requires_approval: bool = False
    
    # Payout
    payout_status: str
    payout_status_label: str = ""
    payout_batch_id: Optional[str] = None
    payout_scheduled_date: Optional[str] = None
    paid_at: Optional[str] = None
    paid_amount: float = 0
    
    # Dispute
    is_disputed: bool = False
    dispute_reason: Optional[str] = None
    dispute_raised_by: Optional[str] = None
    dispute_raised_at: Optional[str] = None
    
    # Lock (after approval)
    is_locked: bool = False
    locked_at: Optional[str] = None
    locked_by: Optional[str] = None
    
    # ═══════════════════════════════════════════════════════════════════════════
    # KPI BONUS - Phase 5: KPI x Commission Integration
    # ═══════════════════════════════════════════════════════════════════════════
    kpi_bonus_modifier: float = 1.0           # Hệ số thưởng KPI (1.0 = không bonus)
    kpi_bonus_tier: str = ""                  # Tên mức bonus (Gold, Silver, etc.)
    kpi_bonus_applied_at: Optional[str] = None  # Thời điểm áp dụng bonus
    kpi_bonus_amount: float = 0               # Số tiền bonus = final - commission
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FINANCIAL-GRADE: Rule Versioning + KPI Snapshot (Principle 1 & 2)
    # ═══════════════════════════════════════════════════════════════════════════
    # These fields ensure historical accuracy and prevent financial disputes
    kpi_score: float = 0                      # KPI achievement score tại thời điểm tính (0-200%)
    kpi_bonus_rule_id: Optional[str] = None   # ID của bonus rule đã áp dụng
    kpi_bonus_rule_version: int = 0           # Version của bonus rule tại thời điểm tính
    kpi_snapshot: Optional[Dict[str, Any]] = None  # Full KPI snapshot: {kpis: [...], overall_score, calculated_at}
    kpi_calculated_at: Optional[str] = None   # Timestamp khi KPI được tính
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FINANCIAL-GRADE: Re-calculation Control (Principle 3)
    # ═══════════════════════════════════════════════════════════════════════════
    is_recalculation_locked: bool = False     # True = không cho phép auto-recalc
    recalculation_history: Optional[List[Dict[str, Any]]] = None  # Audit log của recalculations
    last_recalculated_at: Optional[str] = None
    last_recalculated_by: Optional[str] = None
    recalculation_reason: Optional[str] = None
    
    # Audit
    created_at: str
    created_by: Optional[str] = None
    created_by_name: str = ""
    calculated_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION APPROVAL MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ApprovalRequest(BaseModel):
    """Request to approve/reject"""
    action: str                              # approve, reject
    comments: Optional[str] = None
    rejection_reason: Optional[str] = None


class CommissionApprovalResponse(BaseModel):
    """Commission approval log entry"""
    id: str
    commission_record_id: str
    
    # Step info
    step_number: int
    step_name: str
    required_role: str
    
    # Reviewer
    assigned_to: Optional[str] = None
    reviewer_id: Optional[str] = None
    reviewer_name: str = ""
    reviewer_role: str = ""
    
    # Action
    action: str                              # pending, approved, rejected, skipped
    action_label: str = ""
    comments: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Timing
    assigned_at: str
    deadline: Optional[str] = None
    acted_at: Optional[str] = None
    
    # SLA
    sla_hours: int = 0
    is_overdue: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# PAYOUT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class PayoutBatchCreate(BaseModel):
    """Create payout batch"""
    name: Optional[str] = None
    scheduled_date: Optional[str] = None
    commission_record_ids: List[str]
    notes: Optional[str] = None


class PayoutBatchResponse(BaseModel):
    """Payout batch response"""
    id: str
    batch_code: str
    name: str = ""
    
    # Summary
    total_records: int = 0
    total_amount: float = 0
    
    # By type
    employee_count: int = 0
    employee_amount: float = 0
    collaborator_count: int = 0
    collaborator_amount: float = 0
    
    # Status
    status: str
    status_label: str = ""
    
    # Schedule
    scheduled_date: Optional[str] = None
    
    # Processing
    processed_count: int = 0
    processed_amount: float = 0
    failed_count: int = 0
    
    # Approval
    approved_by: Optional[str] = None
    approved_by_name: str = ""
    approved_at: Optional[str] = None
    
    # Completion
    completed_at: Optional[str] = None
    
    # Audit
    created_by: Optional[str] = None
    created_by_name: str = ""
    created_at: str
    
    notes: Optional[str] = None


class PayoutRecordResponse(BaseModel):
    """Individual payout record"""
    id: str
    batch_id: str
    commission_record_id: str
    commission_code: str = ""
    
    # Recipient
    recipient_id: str
    recipient_name: str = ""
    recipient_type: str
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    
    # Amount
    amount: float
    
    # Payment
    payment_method: str = "transfer"
    payment_reference: Optional[str] = None
    
    # Status
    status: str
    status_label: str = ""
    
    # Timing
    paid_at: Optional[str] = None
    confirmed_by: Optional[str] = None
    
    # Error
    error_message: Optional[str] = None
    retry_count: int = 0
    
    notes: Optional[str] = None


class MarkPaidRequest(BaseModel):
    """Request to mark payout as paid"""
    payment_reference: Optional[str] = None
    payment_method: str = "transfer"
    paid_at: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# INCOME DASHBOARD MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class IncomeSummary(BaseModel):
    """Income summary for dashboard"""
    period_type: str = "monthly"
    period_year: int
    period_month: Optional[int] = None
    period_label: str = ""
    
    # Totals
    estimated_amount: float = 0
    pending_amount: float = 0
    pending_approval_amount: float = 0
    approved_amount: float = 0
    paid_amount: float = 0
    
    # Counts
    estimated_count: int = 0
    pending_count: int = 0
    pending_approval_count: int = 0
    approved_count: int = 0
    paid_count: int = 0
    
    # Disputes
    disputed_count: int = 0
    disputed_amount: float = 0


class TeamMemberIncome(BaseModel):
    """Team member income for manager view"""
    user_id: str
    user_name: str
    position: str = ""
    
    # Deals
    deal_count: int = 0
    total_deal_value: float = 0
    
    # Commission
    estimated_amount: float = 0
    approved_amount: float = 0
    paid_amount: float = 0
    pending_approval_count: int = 0


class TeamIncomeSummary(BaseModel):
    """Team income summary"""
    team_id: Optional[str] = None
    team_name: str = ""
    
    # Period
    period_type: str = "monthly"
    period_year: int
    period_month: Optional[int] = None
    period_label: str = ""
    
    # Totals
    total_estimated: float = 0
    total_approved: float = 0
    total_paid: float = 0
    
    # Members
    member_count: int = 0
    members: List[TeamMemberIncome] = []
    
    # Pending actions
    pending_approval_count: int = 0


# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH/FILTER MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionRecordFilters(BaseModel):
    """Filters for commission records"""
    status: Optional[str] = None
    approval_status: Optional[str] = None
    payout_status: Optional[str] = None
    
    recipient_id: Optional[str] = None
    recipient_type: Optional[str] = None
    
    project_id: Optional[str] = None
    contract_id: Optional[str] = None
    deal_id: Optional[str] = None
    
    is_estimated: Optional[bool] = None
    is_disputed: Optional[bool] = None
    
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    
    search: Optional[str] = None
    
    skip: int = 0
    limit: int = 50
    sort_by: str = "created_at"
    sort_order: str = "desc"


# ═══════════════════════════════════════════════════════════════════════════════
# CALCULATION REQUEST/RESPONSE
# ═══════════════════════════════════════════════════════════════════════════════

class CalculateCommissionRequest(BaseModel):
    """Request to calculate commission for a contract"""
    contract_id: str
    trigger_event: str = CommissionTrigger.CONTRACT_SIGNED.value
    policy_id: Optional[str] = None          # If not provided, auto-find


class CalculateCommissionResponse(BaseModel):
    """Commission calculation result"""
    contract_id: str
    contract_code: str
    contract_value: float
    
    # Policy used
    policy_id: str
    policy_name: str
    
    # Brokerage
    brokerage_rate: float
    brokerage_amount: float
    
    # Splits
    splits: List[Dict[str, Any]] = []
    total_commission: float = 0
    
    # Validation
    is_valid: bool = True
    warnings: List[str] = []
    errors: List[str] = []
