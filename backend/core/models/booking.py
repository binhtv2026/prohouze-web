"""
ProHouzing Booking Model
Version: 1.1.0

Entities:
- Booking (product reservation/giữ chỗ)

Updates v1.1:
- Added idempotency_key for duplicate prevention
- Added product_lock_id for concurrency control
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, utc_now


class Booking(SoftDeleteModel, StatusMixin):
    """
    Booking entity - Product reservation
    
    Bookings temporarily hold a product for a customer.
    Can convert to Deposit or expire.
    """
    __tablename__ = "bookings"
    
    # Identity
    booking_code = Column(String(50), nullable=False)
    
    # Idempotency - CRITICAL for duplicate prevention
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    
    # References
    deal_id = Column(GUID(), ForeignKey("deals.id"), nullable=False)
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=False)
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=True)
    
    # Concurrency Control - product lock version
    product_lock_version = Column(Integer, default=0, nullable=False)
    
    # Booking Status
    booking_status = Column(String(50), default="pending")  # BookingStatus enum
    
    # Amount
    booking_amount = Column(Numeric(15, 2), nullable=False)  # Booking fee
    currency_code = Column(String(3), default="VND")
    
    # Payment Info
    payment_method = Column(String(50), nullable=True)  # PaymentMethod enum
    payment_reference = Column(String(100), nullable=True)  # Transaction ref
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timeline
    booked_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)  # Expiration
    
    # Confirmation
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Conversion
    converted_at = Column(DateTime(timezone=True), nullable=True)
    converted_to_deposit_id = Column(GUID(), nullable=True)
    
    # Cancellation
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    cancel_reason = Column(String(255), nullable=True)
    
    # Refund
    refund_status = Column(String(50), nullable=True)  # pending/completed/rejected
    refund_amount = Column(Numeric(15, 2), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Sales Rep
    sales_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    sales_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Terms
    terms_accepted = Column(Boolean, default=False)
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    deal = relationship("Deal", foreign_keys=[deal_id])
    customer = relationship("Customer", foreign_keys=[customer_id])
    product = relationship("Product", foreign_keys=[product_id])
    project = relationship("Project", foreign_keys=[project_id])
    sales_user = relationship("User", foreign_keys=[sales_user_id])
    sales_unit = relationship("OrganizationalUnit", foreign_keys=[sales_unit_id])
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "booking_code", name="uq_org_booking_code"),
        Index("ix_bookings_org_id", "org_id"),
        Index("ix_bookings_deal_id", "deal_id"),
        Index("ix_bookings_customer_id", "customer_id"),
        Index("ix_bookings_product_id", "product_id"),
        Index("ix_bookings_booking_status", "booking_status"),
        Index("ix_bookings_valid_until", "valid_until"),
        Index("ix_bookings_status", "status"),
    )
    
    def __repr__(self):
        return f"<Booking {self.booking_code}: {self.booking_status}>"
    
    @property
    def is_valid(self):
        """Check if booking is still valid"""
        from datetime import datetime, timezone
        return (
            self.booking_status in ["pending", "confirmed"] and
            self.valid_until > datetime.now(timezone.utc)
        )
    
    @property
    def is_expired(self):
        """Check if booking has expired"""
        from datetime import datetime, timezone
        return (
            self.booking_status == "pending" and
            self.valid_until <= datetime.now(timezone.utc)
        )
