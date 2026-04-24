"""
ProHouzing Deposit Model
Version: 1.0.0

Entities:
- Deposit (earnest money/đặt cọc)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, utc_now


class Deposit(SoftDeleteModel, StatusMixin):
    """
    Deposit entity - Earnest money deposit
    
    Deposits secure a product after booking.
    Can convert to Contract or be forfeited.
    """
    __tablename__ = "deposits"
    
    # Identity
    deposit_code = Column(String(50), nullable=False)
    
    # References
    deal_id = Column(GUID(), ForeignKey("deals.id"), nullable=False)
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=False)
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=True)
    booking_id = Column(GUID(), ForeignKey("bookings.id"), nullable=True)  # Source booking
    
    # Deposit Status
    deposit_status = Column(String(50), default="pending")  # DepositStatus enum
    
    # Amount
    deposit_amount = Column(Numeric(15, 2), nullable=False)  # Deposit amount
    currency_code = Column(String(3), default="VND")
    
    # Price Lock
    locked_price = Column(Numeric(15, 2), nullable=True)  # Price locked at deposit
    price_valid_until = Column(Date, nullable=True)
    
    # Payment Info
    payment_method = Column(String(50), nullable=True)  # PaymentMethod enum
    payment_reference = Column(String(100), nullable=True)
    bank_account = Column(String(100), nullable=True)  # Receiving bank account
    
    # Timeline
    deposited_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=True)  # Contract deadline
    
    # Confirmation
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    receipt_number = Column(String(50), nullable=True)
    
    # Conversion to Contract
    converted_at = Column(DateTime(timezone=True), nullable=True)
    converted_to_contract_id = Column(GUID(), nullable=True)
    
    # Cancellation
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    cancel_reason = Column(String(255), nullable=True)
    
    # Forfeiture (if cancelled by customer)
    forfeited_at = Column(DateTime(timezone=True), nullable=True)
    forfeited_amount = Column(Numeric(15, 2), nullable=True)
    forfeiture_reason = Column(Text, nullable=True)
    
    # Refund
    refund_status = Column(String(50), nullable=True)  # pending/completed/rejected
    refund_amount = Column(Numeric(15, 2), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    refund_bank_account = Column(String(100), nullable=True)
    
    # Sales Info
    sales_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    sales_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    
    # Deposit Agreement
    agreement_signed = Column(Boolean, default=False)
    agreement_signed_at = Column(DateTime(timezone=True), nullable=True)
    agreement_document_url = Column(String(500), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    deal = relationship("Deal", foreign_keys=[deal_id])
    customer = relationship("Customer", foreign_keys=[customer_id])
    product = relationship("Product", foreign_keys=[product_id])
    project = relationship("Project", foreign_keys=[project_id])
    booking = relationship("Booking", foreign_keys=[booking_id])
    sales_user = relationship("User", foreign_keys=[sales_user_id])
    sales_unit = relationship("OrganizationalUnit", foreign_keys=[sales_unit_id])
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "deposit_code", name="uq_org_deposit_code"),
        Index("ix_deposits_org_id", "org_id"),
        Index("ix_deposits_deal_id", "deal_id"),
        Index("ix_deposits_customer_id", "customer_id"),
        Index("ix_deposits_product_id", "product_id"),
        Index("ix_deposits_deposit_status", "deposit_status"),
        Index("ix_deposits_status", "status"),
    )
    
    def __repr__(self):
        return f"<Deposit {self.deposit_code}: {self.deposit_status}>"
    
    @property
    def is_active(self):
        """Check if deposit is active"""
        return self.deposit_status in ["pending", "confirmed"]
    
    @property
    def can_convert_to_contract(self):
        """Check if deposit can be converted to contract"""
        return (
            self.deposit_status == "confirmed" and
            self.converted_to_contract_id is None
        )
