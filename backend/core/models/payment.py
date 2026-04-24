"""
ProHouzing Payment Model
Version: 1.1.0

Entities:
- Payment (payment records/thanh toán)
- PaymentScheduleItem (payment milestones)

Updates v1.1:
- Added idempotency_key for duplicate prevention
- Ledger-style: append-only, no updates
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, CoreModel, StatusMixin, GUID, JSONB, utc_now


class Payment(SoftDeleteModel, StatusMixin):
    """
    Payment entity - Payment records
    
    Tracks all payments for a contract.
    Linked to commission earning triggers.
    
    IMPORTANT: This is a LEDGER-STYLE table.
    - Records are APPEND-ONLY
    - No updates to financial fields allowed
    - Corrections are made via reversal entries
    """
    __tablename__ = "payments"
    
    # Identity
    payment_code = Column(String(50), nullable=False)
    
    # Idempotency - CRITICAL for duplicate prevention
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    
    # References
    contract_id = Column(GUID(), ForeignKey("contracts.id"), nullable=False)
    deal_id = Column(GUID(), ForeignKey("deals.id"), nullable=True)
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    schedule_item_id = Column(GUID(), ForeignKey("payment_schedule_items.id"), nullable=True)
    
    # Payment Type
    payment_type = Column(String(50), nullable=False)  # PaymentType enum
    payment_description = Column(String(255), nullable=True)
    
    # Amount
    scheduled_amount = Column(Numeric(15, 2), nullable=True)  # Expected amount
    paid_amount = Column(Numeric(15, 2), nullable=False)  # Actual paid
    currency_code = Column(String(3), default="VND")
    
    # Exchange (if foreign currency)
    original_currency = Column(String(3), nullable=True)
    original_amount = Column(Numeric(15, 2), nullable=True)
    exchange_rate = Column(Numeric(12, 6), nullable=True)
    
    # Payment Status
    payment_status = Column(String(50), default="pending")  # PaymentStatus enum
    
    # Payment Method
    payment_method = Column(String(50), nullable=True)  # PaymentMethod enum
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    transaction_ref = Column(String(100), nullable=True)
    
    # Timeline
    due_date = Column(Date, nullable=True)
    paid_date = Column(Date, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Verification
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    receipt_number = Column(String(50), nullable=True)
    receipt_url = Column(String(500), nullable=True)
    
    # Overdue
    is_overdue = Column(Boolean, default=False)
    days_overdue = Column(Integer, default=0)
    penalty_amount = Column(Numeric(15, 2), nullable=True)
    
    # Cancellation
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    cancel_reason = Column(String(255), nullable=True)
    
    # Refund (if payment_type = refund)
    refund_for_payment_id = Column(GUID(), ForeignKey("payments.id"), nullable=True)
    refund_reason = Column(Text, nullable=True)
    
    # Commission Trigger
    triggers_commission = Column(Boolean, default=True)
    commission_processed = Column(Boolean, default=False)
    commission_processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    contract = relationship("Contract", back_populates="payments")
    deal = relationship("Deal", foreign_keys=[deal_id])
    customer = relationship("Customer", foreign_keys=[customer_id])
    schedule_item = relationship("PaymentScheduleItem", foreign_keys=[schedule_item_id])
    verified_by_user = relationship("User", foreign_keys=[verified_by])
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])
    refund_for = relationship("Payment", remote_side="Payment.id", foreign_keys=[refund_for_payment_id])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "payment_code", name="uq_org_payment_code"),
        Index("ix_payments_org_id", "org_id"),
        Index("ix_payments_contract_id", "contract_id"),
        Index("ix_payments_customer_id", "customer_id"),
        Index("ix_payments_payment_status", "payment_status"),
        Index("ix_payments_payment_type", "payment_type"),
        Index("ix_payments_due_date", "due_date"),
        Index("ix_payments_paid_date", "paid_date"),
        Index("ix_payments_status", "status"),
    )
    
    def __repr__(self):
        return f"<Payment {self.payment_code}: {self.paid_amount} {self.currency_code}>"
    
    @property
    def is_paid(self):
        """Check if payment is completed"""
        return self.payment_status == "paid"
    
    def mark_overdue(self):
        """Mark payment as overdue and calculate days"""
        from datetime import date
        if self.due_date and self.due_date < date.today() and self.payment_status == "pending":
            self.is_overdue = True
            self.days_overdue = (date.today() - self.due_date).days


class PaymentScheduleItem(CoreModel):
    """
    Payment Schedule Item - Payment milestones
    
    Defines the payment plan for a contract.
    """
    __tablename__ = "payment_schedule_items"
    
    # Organization (denormalized)
    org_id = Column(GUID(), nullable=False)
    
    # Contract
    contract_id = Column(GUID(), ForeignKey("contracts.id"), nullable=False)
    
    # Schedule Info
    milestone_code = Column(String(50), nullable=False)
    milestone_name = Column(String(255), nullable=False)
    sequence_no = Column(Integer, nullable=False)  # Order in schedule
    
    # Amount
    amount = Column(Numeric(15, 2), nullable=False)
    percentage = Column(Numeric(5, 2), nullable=True)  # % of total
    currency_code = Column(String(3), default="VND")
    
    # Timeline
    due_date = Column(Date, nullable=False)
    due_condition = Column(String(255), nullable=True)  # e.g., "After signing"
    
    # Status
    schedule_status = Column(String(50), default="scheduled")  # scheduled/paid/overdue/waived
    
    # Payment Link
    paid_amount = Column(Numeric(15, 2), default=0)
    remaining_amount = Column(Numeric(15, 2), nullable=True)
    last_payment_date = Column(Date, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    contract = relationship("Contract")
    payments = relationship("Payment", foreign_keys=[Payment.schedule_item_id], lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("contract_id", "milestone_code", name="uq_contract_milestone_code"),
        Index("ix_payment_schedule_items_contract_id", "contract_id"),
        Index("ix_payment_schedule_items_due_date", "due_date"),
    )
    
    def __repr__(self):
        return f"<PaymentScheduleItem {self.milestone_code}: {self.amount}>"
    
    def update_paid_amount(self, payment_amount: float):
        """Update paid amount after a payment"""
        self.paid_amount = (self.paid_amount or 0) + payment_amount
        self.remaining_amount = self.amount - self.paid_amount
        if self.remaining_amount <= 0:
            self.schedule_status = "paid"
