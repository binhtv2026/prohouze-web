"""
ProHouzing Commission Schemas
Version: 1.0.0

DTOs for Commission management.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import Field

from .base import BaseSchema


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION ENTRY SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionEntryCreate(BaseSchema):
    """Create commission entry request"""
    org_id: UUID
    entry_code: Optional[str] = Field(None, max_length=50)
    
    commission_type: str = Field(..., max_length=50)
    
    # Source
    deal_id: UUID
    contract_id: Optional[UUID] = None
    payment_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    
    # Beneficiary
    beneficiary_type: str = Field(..., max_length=50)
    beneficiary_user_id: Optional[UUID] = None
    beneficiary_org_id: Optional[UUID] = None
    beneficiary_name: Optional[str] = Field(None, max_length=255)
    
    # Level
    level_code: Optional[str] = Field(None, max_length=10)
    parent_entry_id: Optional[UUID] = None
    
    # Calculation
    base_amount: Decimal
    rate_type: str = Field(..., max_length=20)
    rate_value: Decimal
    gross_amount: Decimal
    deductions: Decimal = 0
    net_amount: Decimal
    currency_code: str = Field(default="VND", max_length=3)
    
    # Earning
    earning_status: str = Field(default="pending", max_length=50)
    earning_trigger: Optional[str] = Field(None, max_length=50)
    
    # Period
    earning_period: Optional[str] = Field(None, max_length=7)
    
    # Rule
    rule_id: Optional[UUID] = None
    rule_snapshot: Optional[dict] = None
    
    notes: Optional[str] = None
    
    metadata_json: Optional[dict] = None


class CommissionEntryResponse(BaseSchema):
    """Commission entry response"""
    id: UUID
    org_id: UUID
    entry_code: str
    
    commission_type: str
    
    # Source
    deal_id: UUID
    contract_id: Optional[UUID] = None
    payment_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    
    # Beneficiary
    beneficiary_type: str
    beneficiary_user_id: Optional[UUID] = None
    beneficiary_org_id: Optional[UUID] = None
    beneficiary_name: Optional[str] = None
    
    # Level
    level_code: Optional[str] = None
    parent_entry_id: Optional[UUID] = None
    
    # Calculation
    base_amount: Decimal
    rate_type: str
    rate_value: Decimal
    gross_amount: Decimal
    deductions: Decimal
    net_amount: Decimal
    currency_code: str
    
    # Earning
    earning_status: str
    earned_at: Optional[datetime] = None
    earning_trigger: Optional[str] = None
    
    # Payout
    payout_status: str
    payout_due_date: Optional[date] = None
    payout_batch_id: Optional[UUID] = None
    paid_at: Optional[datetime] = None
    paid_amount: Optional[Decimal] = None
    
    # Period
    earning_period: Optional[str] = None
    
    # Reference
    reference_entry_id: Optional[UUID] = None
    adjustment_reason: Optional[str] = None
    
    # Rule
    rule_id: Optional[UUID] = None
    
    # Approval
    approved_at: Optional[datetime] = None
    approved_by: Optional[UUID] = None
    
    # Hold
    is_held: bool
    held_reason: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime


class CommissionEntryListItem(BaseSchema):
    """Commission entry list item"""
    id: UUID
    entry_code: str
    deal_id: UUID
    commission_type: str
    beneficiary_type: str
    beneficiary_user_id: Optional[UUID] = None
    beneficiary_name: Optional[str] = None
    level_code: Optional[str] = None
    net_amount: Decimal
    earning_status: str
    payout_status: str
    earning_period: Optional[str] = None
    created_at: datetime


class CommissionSummary(BaseSchema):
    """Commission summary for a user/period"""
    total_earned: Decimal = 0
    total_pending: Decimal = 0
    total_paid: Decimal = 0
    total_held: Decimal = 0
    entry_count: int = 0
    by_type: Optional[dict] = None
    by_period: Optional[dict] = None


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION RULE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionRuleCreate(BaseSchema):
    """Create commission rule request"""
    org_id: UUID
    rule_code: str = Field(..., max_length=50)
    rule_name: str = Field(..., max_length=255)
    
    # Scope
    applies_to_type: Optional[str] = Field(None, max_length=50)
    applies_to_id: Optional[UUID] = None
    
    # Beneficiary
    beneficiary_type: str = Field(..., max_length=50)
    beneficiary_role: Optional[str] = Field(None, max_length=50)
    
    # Commission
    commission_type: str = Field(..., max_length=50)
    level_code: Optional[str] = Field(None, max_length=10)
    
    # Rate
    rate_type: str = Field(..., max_length=20)
    rate_value: Decimal
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    
    # Earning
    earning_trigger: str = Field(..., max_length=50)
    earning_percentage: Decimal = 100
    
    # Priority
    priority: int = 0
    
    # Validity
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    
    # Conditions
    conditions_json: Optional[dict] = None
    
    description: Optional[str] = None


class CommissionRuleResponse(BaseSchema):
    """Commission rule response"""
    id: UUID
    org_id: UUID
    rule_code: str
    rule_name: str
    
    applies_to_type: Optional[str] = None
    applies_to_id: Optional[UUID] = None
    
    beneficiary_type: str
    beneficiary_role: Optional[str] = None
    
    commission_type: str
    level_code: Optional[str] = None
    
    rate_type: str
    rate_value: Decimal
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    
    earning_trigger: str
    earning_percentage: Decimal
    
    priority: int
    
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    
    conditions_json: Optional[dict] = None
    description: Optional[str] = None
    
    status: str
    created_at: datetime
    updated_at: datetime
