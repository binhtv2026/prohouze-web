"""
ProHouzing Sales Domain Models
Prompt 8/20 - Sales Pipeline, Booking & Deal Engine

Models for:
- Deal (main transaction entity)
- SoftBooking (queue booking without unit)
- HardBooking (confirmed booking with unit)
- SalesEvent (opening event)
- PricingPolicy (dynamic pricing)
- PaymentPlan (PTTT)
- Promotion (discounts)
- AllocationResult (allocation engine output)

Multi-tenant ready with tenant_id, project_id
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

from config.sales_config import (
    DealStage, SoftBookingStatus, HardBookingStatus,
    SalesEventStatus, PaymentPlanType, BookingTier
)


# ============================================
# DEAL MODEL
# ============================================

class DealCreate(BaseModel):
    """Create a new deal"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Links
    contact_id: str = Field(..., description="Required - Contact ID")
    lead_id: Optional[str] = None
    project_id: str = Field(..., description="Required - Target project")
    
    # Initial stage
    stage: DealStage = DealStage.INTERESTED
    
    # Financial estimate
    estimated_value: float = 0
    
    # Assignment
    assigned_to: Optional[str] = None
    co_broker_id: Optional[str] = None
    
    # Organization
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    
    # Dates
    expected_close_date: Optional[str] = None
    
    # Metadata
    source: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []


class DealResponse(BaseModel):
    """Deal response with all fields"""
    id: str
    code: Optional[str] = None  # Optional for backward compatibility
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Links
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    project_id: Optional[str] = None  # Optional for backward compatibility
    product_id: Optional[str] = None
    soft_booking_id: Optional[str] = None
    hard_booking_id: Optional[str] = None
    contract_id: Optional[str] = None
    
    # Stage & Status
    stage: str
    stage_label: str = ""
    stage_color: str = ""
    status: str = "active"
    probability: int = 0
    
    # Financial
    estimated_value: float = 0
    final_value: float = 0
    discount_amount: float = 0
    
    # Pricing
    pricing_policy_id: Optional[str] = None
    payment_plan_id: Optional[str] = None
    promotions: List[str] = []
    
    # Assignment
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    co_broker_id: Optional[str] = None
    
    # Organization
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    
    # Resolved names
    contact_name: str = ""
    contact_phone: str = ""
    project_name: str = ""
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    
    # Dates
    expected_close_date: Optional[str] = None
    closed_at: Optional[str] = None
    allocated_at: Optional[str] = None
    
    # Metadata
    source: Optional[str] = None
    lost_reason: Optional[str] = None
    cancelled_reason: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class DealStageTransition(BaseModel):
    """Request to change deal stage"""
    new_stage: DealStage
    reason: Optional[str] = None
    
    # For soft booking creation
    create_soft_booking: bool = False
    soft_booking_data: Optional[Dict[str, Any]] = None
    
    # For allocation
    allocated_product_id: Optional[str] = None


# ============================================
# PRIORITY SELECTION
# ============================================

class PrioritySelection(BaseModel):
    """Priority selection for soft booking"""
    priority: int = Field(..., ge=1, le=3)
    product_id: str
    product_code: str
    product_name: Optional[str] = None
    floor_number: Optional[int] = None
    direction: Optional[str] = None
    area: Optional[float] = None
    listed_price: Optional[float] = None
    
    # Status
    status: str = "pending"  # pending/allocated/unavailable
    selected_at: Optional[str] = None


# ============================================
# SOFT BOOKING MODEL
# ============================================

class SoftBookingCreate(BaseModel):
    """Create soft booking (join queue)"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Links
    deal_id: str
    contact_id: str
    project_id: str
    sales_event_id: Optional[str] = None
    
    # Tier
    booking_tier: BookingTier = BookingTier.STANDARD
    
    # Financial
    booking_fee: float = 0
    booking_fee_paid: float = 0
    
    # Notes
    notes: Optional[str] = None


class SoftBookingResponse(BaseModel):
    """Soft booking response"""
    id: str
    code: str
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Links
    deal_id: str
    contact_id: str
    project_id: str
    sales_event_id: Optional[str] = None
    
    # Queue
    queue_number: int
    queue_position: str = ""
    booking_tier: str
    booking_tier_label: str = ""
    
    # Status
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Financial
    booking_fee: float = 0
    booking_fee_paid: float = 0
    booking_fee_status: str = "pending"
    
    # Priority selections
    priority_selections: List[PrioritySelection] = []
    
    # Allocation result
    allocated_product_id: Optional[str] = None
    allocated_product_code: Optional[str] = None
    allocated_priority: Optional[int] = None
    allocation_status: str = "pending"
    allocation_notes: Optional[str] = None
    
    # Resolved names
    contact_name: str = ""
    project_name: str = ""
    event_name: Optional[str] = None
    
    # Timestamps
    created_at: str
    confirmed_at: Optional[str] = None
    selection_deadline: Optional[str] = None
    allocated_at: Optional[str] = None
    expires_at: Optional[str] = None
    
    # Assignment
    created_by: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None


class SetPrioritiesRequest(BaseModel):
    """Request to set priority selections"""
    priorities: List[PrioritySelection]


# ============================================
# HARD BOOKING MODEL
# ============================================

class HardBookingCreate(BaseModel):
    """Create hard booking (after allocation)"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Links
    deal_id: str
    soft_booking_id: str
    contact_id: str
    project_id: str
    product_id: str
    
    # Pricing
    pricing_policy_id: Optional[str] = None
    payment_plan_id: Optional[str] = None
    
    # Deposit
    deposit_amount: float = 0
    deposit_due_date: Optional[str] = None


class HardBookingResponse(BaseModel):
    """Hard booking response"""
    id: str
    code: str
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Links
    deal_id: str
    soft_booking_id: str
    contact_id: str
    project_id: str
    product_id: str
    contract_id: Optional[str] = None
    
    # Status
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Pricing (calculated)
    unit_base_price: float = 0
    pricing_policy_id: Optional[str] = None
    pricing_policy_name: Optional[str] = None
    
    listed_price: float = 0
    discount_policy: float = 0
    discount_payment_plan: float = 0
    discount_promotion: float = 0
    discount_special: float = 0
    total_discount: float = 0
    final_price: float = 0
    
    # Deposit
    deposit_amount: float = 0
    deposit_paid: float = 0
    deposit_due_date: Optional[str] = None
    deposit_status: str = "pending"
    
    # Payment plan
    payment_plan_id: Optional[str] = None
    payment_plan_name: Optional[str] = None
    
    # Resolved names
    contact_name: str = ""
    project_name: str = ""
    product_code: str = ""
    product_name: str = ""
    
    # Timestamps
    created_at: str
    deposit_paid_at: Optional[str] = None
    converted_to_contract_at: Optional[str] = None
    expires_at: Optional[str] = None


class RecordDepositRequest(BaseModel):
    """Request to record deposit payment"""
    amount: float
    payment_method: str = "transfer"
    payment_reference: Optional[str] = None
    payment_date: Optional[str] = None
    notes: Optional[str] = None


# ============================================
# SALES EVENT MODEL
# ============================================

class SalesEventCreate(BaseModel):
    """Create sales event"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Identity
    name: str
    
    # Project
    project_id: str
    block_ids: List[str] = []
    
    # Timing
    registration_start: str
    registration_end: str
    selection_start: str
    selection_end: str
    allocation_date: str
    
    # Products
    available_product_ids: List[str] = []
    reserved_product_ids: List[str] = []
    
    # Config
    max_bookings: Optional[int] = None
    booking_fee: float = 0
    
    notes: Optional[str] = None


class SalesEventResponse(BaseModel):
    """Sales event response"""
    id: str
    code: str
    name: str
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Project
    project_id: str
    project_name: str = ""
    block_ids: List[str] = []
    
    # Timing
    registration_start: str
    registration_end: str
    selection_start: str
    selection_end: str
    allocation_date: str
    
    # Status
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Products
    available_product_ids: List[str] = []
    reserved_product_ids: List[str] = []
    
    # Stats
    total_products: int = 0
    total_bookings: int = 0
    allocated_count: int = 0
    manual_pending: int = 0
    
    # Config
    max_bookings: Optional[int] = None
    booking_fee: float = 0
    
    notes: Optional[str] = None
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


# ============================================
# ALLOCATION RESULT
# ============================================

class AllocationResult(BaseModel):
    """Result of single allocation"""
    soft_booking_id: str
    soft_booking_code: str
    contact_id: str
    contact_name: str = ""
    queue_number: int
    
    # Result
    success: bool
    product_id: Optional[str] = None
    product_code: Optional[str] = None
    allocated_priority: Optional[int] = None
    method: str = "auto"  # auto/manual/failed
    
    # If failed
    reason: Optional[str] = None
    available_alternatives: List[str] = []


class AllocationRunResult(BaseModel):
    """Result of allocation run"""
    sales_event_id: str
    run_at: str
    
    # Stats
    total_bookings: int
    successful: int
    failed: int
    manual_required: int
    
    # Results
    results: List[AllocationResult]


class ManualAllocationRequest(BaseModel):
    """Manual allocation request"""
    soft_booking_id: str
    product_id: str
    reason: Optional[str] = None


# ============================================
# PRICING POLICY MODEL
# ============================================

class PriceAdjustment(BaseModel):
    """Price adjustment rule"""
    type: str  # floor_premium, view_premium, etc.
    rule: str  # "floor >= 10", "view = river"
    adjustment_type: str = "percent"  # percent/amount
    adjustment_value: float


class PricingPolicyCreate(BaseModel):
    """Create pricing policy"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Identity
    name: str
    
    # Scope
    project_id: str
    applies_to: str = "all"  # all/blocks/products
    block_ids: List[str] = []
    product_ids: List[str] = []
    
    # Validity
    effective_from: str
    effective_to: Optional[str] = None
    
    # Price configuration
    price_type: str = "per_sqm"  # fixed/per_sqm/formula
    base_price_source: str = "developer"
    
    # Adjustments
    adjustments: List[PriceAdjustment] = []
    
    # Constraints
    min_price_per_sqm: Optional[float] = None
    max_discount_percent: float = 15
    requires_approval_above: float = 10
    
    notes: Optional[str] = None


class PricingPolicyResponse(PricingPolicyCreate):
    """Pricing policy response"""
    id: str
    code: str
    status: str = "draft"
    
    project_name: str = ""
    
    created_at: str
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None


# ============================================
# PAYMENT PLAN MODEL
# ============================================

class PaymentMilestone(BaseModel):
    """Payment milestone in plan"""
    name: str
    percent: float
    due_type: str = "fixed"  # fixed/relative/milestone
    due_days: Optional[int] = None
    milestone: Optional[str] = None  # foundation, handover, etc.


class PaymentPlanCreate(BaseModel):
    """Create payment plan"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Identity
    name: str
    
    # Scope
    project_id: str
    pricing_policy_id: Optional[str] = None
    
    # Type
    plan_type: PaymentPlanType = PaymentPlanType.STANDARD
    
    # Discount
    discount_percent: float = 0
    
    # Schedule
    milestones: List[PaymentMilestone] = []
    
    # Constraints
    min_down_payment_percent: float = 10
    max_loan_percent: Optional[float] = None
    partner_banks: List[str] = []
    
    # Validity
    effective_from: str
    effective_to: Optional[str] = None
    
    notes: Optional[str] = None


class PaymentPlanResponse(PaymentPlanCreate):
    """Payment plan response"""
    id: str
    code: str
    status: str = "active"
    
    project_name: str = ""
    plan_type_label: str = ""
    
    created_at: str
    created_by: Optional[str] = None


# ============================================
# PROMOTION MODEL
# ============================================

class PromotionCondition(BaseModel):
    """Promotion condition"""
    field: str  # payment_plan, booking_date, etc.
    operator: str  # in, between, eq, gt, lt
    value: Any


class PromotionCreate(BaseModel):
    """Create promotion"""
    # Multi-tenant
    tenant_id: Optional[str] = None
    
    # Identity
    name: str
    
    # Scope
    project_ids: List[str] = []
    product_types: List[str] = []
    
    # Discount
    discount_type: str = "percent"  # percent/amount/gift
    discount_value: float = 0
    
    # Conditions
    conditions: List[PromotionCondition] = []
    
    # Stacking
    stackable: bool = True
    max_stack: int = 3
    priority: int = 1
    
    # Limits
    max_uses: Optional[int] = None
    max_per_customer: int = 1
    
    # Validity
    start_date: str
    end_date: str
    
    description: Optional[str] = None


class PromotionResponse(PromotionCreate):
    """Promotion response"""
    id: str
    code: str
    status: str = "active"
    
    current_uses: int = 0
    
    created_at: str
    created_by: Optional[str] = None


# ============================================
# PRICE CALCULATION
# ============================================

class PriceCalculationRequest(BaseModel):
    """Request to calculate price"""
    product_id: str
    pricing_policy_id: Optional[str] = None
    payment_plan_id: Optional[str] = None
    promotion_codes: List[str] = []
    special_discounts: Dict[str, float] = {}  # {vip: 2, referral: 1}


class PriceCalculationResponse(BaseModel):
    """Price calculation result"""
    product_id: str
    product_code: str
    
    # Base
    unit_base_price: float
    area: float
    price_per_sqm: float
    
    # Adjustments
    policy_adjustments: List[Dict[str, Any]] = []
    total_adjustment: float = 0
    
    # After adjustments
    listed_price: float
    
    # Discounts
    payment_plan_discount: float = 0
    promotion_discounts: List[Dict[str, Any]] = []
    special_discounts: Dict[str, float] = {}
    total_discount: float = 0
    total_discount_percent: float = 0
    
    # Final
    final_price: float
    
    # Warnings
    warnings: List[str] = []
    requires_approval: bool = False


# ============================================
# DEAL PIPELINE SUMMARY
# ============================================

class DealPipelineSummary(BaseModel):
    """Pipeline summary for dashboard"""
    total_deals: int = 0
    total_value: float = 0
    
    by_stage: Dict[str, Dict[str, Any]] = {}
    # {
    #   "interested": {"count": 5, "value": 10000000000},
    #   "soft_booking": {"count": 3, "value": 8000000000},
    # }
    
    conversion_rates: Dict[str, float] = {}
    avg_deal_value: float = 0
    avg_days_to_close: float = 0


# ============================================
# SEARCH / FILTER
# ============================================

class DealSearchRequest(BaseModel):
    """Deal search/filter request"""
    search: Optional[str] = None
    
    project_id: Optional[str] = None
    stages: Optional[List[str]] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    
    value_min: Optional[float] = None
    value_max: Optional[float] = None
    
    created_from: Optional[str] = None
    created_to: Optional[str] = None
    
    skip: int = 0
    limit: int = 50
    sort_by: str = "created_at"
    sort_order: str = "desc"


class SoftBookingSearchRequest(BaseModel):
    """Soft booking search request"""
    search: Optional[str] = None
    
    project_id: Optional[str] = None
    sales_event_id: Optional[str] = None
    status: Optional[str] = None
    booking_tier: Optional[str] = None
    
    skip: int = 0
    limit: int = 50
