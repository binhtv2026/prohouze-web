"""
ProHouzing Transaction Schemas
Version: 1.0.0

DTOs for Booking, Deposit, Contract, Payment.
"""

from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import Field

from .base import BaseSchema


# ═══════════════════════════════════════════════════════════════════════════════
# BOOKING SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class BookingCreate(BaseSchema):
    """Create booking request"""
    org_id: UUID
    deal_id: UUID
    customer_id: UUID
    product_id: UUID
    project_id: Optional[UUID] = None
    
    booking_code: Optional[str] = Field(None, max_length=50)
    booking_amount: Decimal
    currency_code: str = Field(default="VND", max_length=3)
    
    valid_until: datetime
    
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    
    sales_user_id: Optional[UUID] = None
    sales_unit_id: Optional[UUID] = None
    
    notes: Optional[str] = None
    
    metadata_json: Optional[dict] = None


class BookingUpdate(BaseSchema):
    """Update booking request"""
    booking_status: Optional[str] = Field(None, max_length=50)
    valid_until: Optional[datetime] = None
    
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class BookingResponse(BaseSchema):
    """Booking response"""
    id: UUID
    org_id: UUID
    booking_code: str
    
    deal_id: UUID
    customer_id: UUID
    product_id: UUID
    project_id: Optional[UUID] = None
    
    booking_status: str
    booking_amount: Decimal
    currency_code: Optional[str] = "VND"
    
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
    
    booked_at: datetime
    valid_until: datetime
    
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[UUID] = None
    
    converted_at: Optional[datetime] = None
    converted_to_deposit_id: Optional[UUID] = None
    
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[UUID] = None
    cancel_reason: Optional[str] = None
    
    refund_status: Optional[str] = None
    refund_amount: Optional[Decimal] = None
    
    sales_user_id: Optional[UUID] = None
    sales_unit_id: Optional[UUID] = None
    
    notes: Optional[str] = None
    
    status: str
    created_at: datetime
    updated_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# DEPOSIT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class DepositCreate(BaseSchema):
    """Create deposit request"""
    org_id: UUID
    deal_id: UUID
    customer_id: UUID
    product_id: UUID
    project_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None
    
    deposit_code: Optional[str] = Field(None, max_length=50)
    deposit_amount: Decimal
    currency_code: str = Field(default="VND", max_length=3)
    
    locked_price: Optional[Decimal] = None
    price_valid_until: Optional[date] = None
    
    valid_until: Optional[datetime] = None
    
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_reference: Optional[str] = Field(None, max_length=100)
    bank_account: Optional[str] = Field(None, max_length=100)
    
    sales_user_id: Optional[UUID] = None
    sales_unit_id: Optional[UUID] = None
    
    notes: Optional[str] = None
    
    metadata_json: Optional[dict] = None


class DepositResponse(BaseSchema):
    """Deposit response"""
    id: UUID
    org_id: UUID
    deposit_code: str
    
    deal_id: UUID
    customer_id: UUID
    product_id: UUID
    project_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None
    
    deposit_status: str
    deposit_amount: Decimal
    currency_code: str
    
    locked_price: Optional[Decimal] = None
    price_valid_until: Optional[date] = None
    
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    bank_account: Optional[str] = None
    
    deposited_at: datetime
    valid_until: Optional[datetime] = None
    
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[UUID] = None
    receipt_number: Optional[str] = None
    
    converted_at: Optional[datetime] = None
    converted_to_contract_id: Optional[UUID] = None
    
    forfeited_at: Optional[datetime] = None
    forfeited_amount: Optional[Decimal] = None
    
    refund_status: Optional[str] = None
    refund_amount: Optional[Decimal] = None
    
    sales_user_id: Optional[UUID] = None
    
    status: str
    created_at: datetime
    updated_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ContractUpdate(BaseSchema):
    """Update contract request"""
    contract_number: Optional[str] = Field(None, max_length=100)
    
    buyer_name: Optional[str] = Field(None, max_length=255)
    buyer_id_number: Optional[str] = Field(None, max_length=50)
    buyer_id_date: Optional[date] = None
    buyer_id_place: Optional[str] = Field(None, max_length=255)
    buyer_address: Optional[str] = Field(None, max_length=500)
    buyer_phone: Optional[str] = Field(None, max_length=20)
    buyer_email: Optional[str] = Field(None, max_length=255)
    
    co_buyer_name: Optional[str] = Field(None, max_length=255)
    co_buyer_id_number: Optional[str] = Field(None, max_length=50)
    co_buyer_relationship: Optional[str] = Field(None, max_length=100)
    
    discount_amount: Optional[Decimal] = None
    
    payment_schedule: Optional[List[dict]] = None
    
    effective_date: Optional[date] = None
    handover_date: Optional[date] = None
    
    notes: Optional[str] = None
    special_terms: Optional[str] = None
    internal_notes: Optional[str] = None


class ContractCreate(BaseSchema):
    """Create contract request"""
    org_id: UUID
    deal_id: UUID
    customer_id: UUID
    product_id: UUID
    project_id: Optional[UUID] = None
    deposit_id: Optional[UUID] = None
    
    contract_code: Optional[str] = Field(None, max_length=50)
    contract_number: Optional[str] = Field(None, max_length=100)
    contract_type: str = Field(default="sale", max_length=50)
    
    # Buyer
    buyer_name: str = Field(..., max_length=255)
    buyer_id_number: Optional[str] = Field(None, max_length=50)
    buyer_id_date: Optional[date] = None
    buyer_id_place: Optional[str] = Field(None, max_length=255)
    buyer_address: Optional[str] = Field(None, max_length=500)
    buyer_phone: Optional[str] = Field(None, max_length=20)
    buyer_email: Optional[str] = Field(None, max_length=255)
    
    # Co-buyer
    co_buyer_name: Optional[str] = Field(None, max_length=255)
    co_buyer_id_number: Optional[str] = Field(None, max_length=50)
    co_buyer_relationship: Optional[str] = Field(None, max_length=100)
    
    # Pricing
    contract_value: Decimal
    land_value: Optional[Decimal] = None
    construction_value: Optional[Decimal] = None
    vat_amount: Optional[Decimal] = None
    maintenance_fee: Optional[Decimal] = None
    other_fees: Optional[Decimal] = None
    discount_amount: Decimal = 0
    final_value: Decimal
    currency_code: str = Field(default="VND", max_length=3)
    
    # Payment Schedule
    payment_schedule: Optional[List[dict]] = None
    
    # Timeline
    effective_date: Optional[date] = None
    handover_date: Optional[date] = None
    
    sales_user_id: Optional[UUID] = None
    sales_unit_id: Optional[UUID] = None
    
    notes: Optional[str] = None
    special_terms: Optional[str] = None
    
    metadata_json: Optional[dict] = None


class ContractResponse(BaseSchema):
    """Contract response"""
    id: UUID
    org_id: UUID
    contract_code: str
    contract_number: Optional[str] = None
    contract_type: str
    
    deal_id: UUID
    customer_id: UUID
    product_id: UUID
    project_id: Optional[UUID] = None
    deposit_id: Optional[UUID] = None
    
    contract_status: str
    
    # Buyer
    buyer_name: str
    buyer_id_number: Optional[str] = None
    buyer_phone: Optional[str] = None
    buyer_email: Optional[str] = None
    
    # Pricing
    contract_value: Decimal
    discount_amount: Optional[Decimal] = Decimal(0)
    final_value: Decimal
    currency_code: Optional[str] = "VND"
    
    # Payment
    payment_schedule: Optional[List[dict]] = None
    total_paid: Decimal
    remaining_balance: Optional[Decimal] = None
    
    # Timeline
    created_date: Optional[date] = None
    signed_date: Optional[date] = None
    effective_date: Optional[date] = None
    handover_date: Optional[date] = None
    actual_handover_date: Optional[date] = None
    
    # Signing
    signed_at: Optional[datetime] = None
    signed_by_customer: Optional[bool] = False
    signed_by_company: Optional[bool] = False
    
    # Completion
    completed_at: Optional[datetime] = None
    pink_book_received: Optional[bool] = False
    pink_book_date: Optional[date] = None
    
    sales_user_id: Optional[UUID] = None
    
    status: str
    created_at: datetime
    updated_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class PaymentUpdate(BaseSchema):
    """Update payment - limited fields (ledger-style)"""
    # Only status can be updated, not amounts
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class PaymentCreate(BaseSchema):
    """Create payment request"""
    org_id: UUID
    contract_id: UUID
    deal_id: Optional[UUID] = None
    customer_id: UUID
    schedule_item_id: Optional[UUID] = None
    
    payment_code: Optional[str] = Field(None, max_length=50)
    payment_type: str = Field(..., max_length=50)
    payment_description: Optional[str] = Field(None, max_length=255)
    
    scheduled_amount: Optional[Decimal] = None
    paid_amount: Decimal
    currency_code: str = Field(default="VND", max_length=3)
    
    payment_method: Optional[str] = Field(None, max_length=50)
    bank_name: Optional[str] = Field(None, max_length=100)
    bank_account: Optional[str] = Field(None, max_length=50)
    transaction_ref: Optional[str] = Field(None, max_length=100)
    
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    
    triggers_commission: bool = True
    
    notes: Optional[str] = None
    
    metadata_json: Optional[dict] = None


class PaymentResponse(BaseSchema):
    """Payment response"""
    id: UUID
    org_id: UUID
    payment_code: str
    
    contract_id: UUID
    deal_id: Optional[UUID] = None
    customer_id: UUID
    schedule_item_id: Optional[UUID] = None
    
    payment_type: str
    payment_description: Optional[str] = None
    payment_status: str
    
    scheduled_amount: Optional[Decimal] = None
    paid_amount: Decimal
    currency_code: str
    
    payment_method: Optional[str] = None
    bank_name: Optional[str] = None
    transaction_ref: Optional[str] = None
    
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    paid_at: Optional[datetime] = None
    
    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None
    receipt_number: Optional[str] = None
    
    is_overdue: bool
    days_overdue: int
    penalty_amount: Optional[Decimal] = None
    
    triggers_commission: bool
    commission_processed: bool
    
    status: str
    created_at: datetime
    updated_at: datetime


class PaymentListItem(BaseSchema):
    """Payment list item"""
    id: UUID
    payment_code: str
    contract_id: UUID
    customer_id: UUID
    payment_type: str
    payment_status: str
    paid_amount: Decimal
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    is_overdue: bool
