"""
ProHouzing Contract Model
Version: 1.1.0

Entities:
- Contract (sales contract/hợp đồng mua bán)

Updates v1.1:
- Added idempotency_key for duplicate prevention
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY, utc_now


class Contract(SoftDeleteModel, StatusMixin):
    """
    Contract entity - Sales/Lease contract
    
    Contracts are the legal binding agreement for property sale.
    This is where revenue is recognized.
    """
    __tablename__ = "contracts"
    
    # Identity
    contract_code = Column(String(50), nullable=False)
    contract_number = Column(String(100), nullable=True)  # Official contract number
    
    # Idempotency - CRITICAL for duplicate prevention
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    
    # Type
    contract_type = Column(String(50), default="sale")  # ContractType enum
    
    # References
    deal_id = Column(GUID(), ForeignKey("deals.id"), nullable=False)
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=False)
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=True)
    deposit_id = Column(GUID(), ForeignKey("deposits.id"), nullable=True)
    
    # Contract Status
    contract_status = Column(String(50), default="draft")  # ContractStatus enum
    
    # Parties
    buyer_name = Column(String(255), nullable=False)
    buyer_id_number = Column(String(50), nullable=True)  # CMND/CCCD
    buyer_id_date = Column(Date, nullable=True)
    buyer_id_place = Column(String(255), nullable=True)
    buyer_address = Column(String(500), nullable=True)
    buyer_phone = Column(String(20), nullable=True)
    buyer_email = Column(String(255), nullable=True)
    
    # Co-buyer (if any)
    co_buyer_name = Column(String(255), nullable=True)
    co_buyer_id_number = Column(String(50), nullable=True)
    co_buyer_relationship = Column(String(100), nullable=True)  # Spouse/Partner/etc.
    
    # Pricing
    contract_value = Column(Numeric(15, 2), nullable=False)  # Total contract value
    land_value = Column(Numeric(15, 2), nullable=True)
    construction_value = Column(Numeric(15, 2), nullable=True)
    vat_amount = Column(Numeric(15, 2), nullable=True)
    maintenance_fee = Column(Numeric(15, 2), nullable=True)
    other_fees = Column(Numeric(15, 2), nullable=True)
    discount_amount = Column(Numeric(15, 2), default=0)
    final_value = Column(Numeric(15, 2), nullable=False)  # Final payable
    currency_code = Column(String(3), default="VND")
    
    # Payment Schedule
    payment_schedule = Column(JSONB, nullable=True, default=list)  # Array of milestones
    total_paid = Column(Numeric(15, 2), default=0)
    remaining_balance = Column(Numeric(15, 2), nullable=True)
    
    # Timeline
    created_date = Column(Date, nullable=True)
    signed_date = Column(Date, nullable=True)
    effective_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    handover_date = Column(Date, nullable=True)  # Expected handover
    actual_handover_date = Column(Date, nullable=True)
    
    # Signing
    signed_at = Column(DateTime(timezone=True), nullable=True)
    signed_by_customer = Column(Boolean, default=False)
    signed_by_company = Column(Boolean, default=False)
    witness_name = Column(String(255), nullable=True)
    
    # Documents
    contract_document_url = Column(String(500), nullable=True)
    appendix_urls = Column(JSONB, nullable=True, default=list)
    
    # Completion
    completed_at = Column(DateTime(timezone=True), nullable=True)
    pink_book_received = Column(Boolean, default=False)  # Sổ hồng
    pink_book_date = Column(Date, nullable=True)
    
    # Termination
    terminated_at = Column(DateTime(timezone=True), nullable=True)
    termination_reason = Column(Text, nullable=True)
    termination_by = Column(String(50), nullable=True)  # customer/company/mutual
    
    # Cancellation
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    cancel_reason = Column(Text, nullable=True)
    
    # Sales Info
    sales_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    sales_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    
    # Legal
    notarized = Column(Boolean, default=False)
    notarized_at = Column(DateTime(timezone=True), nullable=True)
    notary_office = Column(String(255), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    special_terms = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    deal = relationship("Deal", foreign_keys=[deal_id])
    customer = relationship("Customer", foreign_keys=[customer_id])
    product = relationship("Product", foreign_keys=[product_id])
    project = relationship("Project", foreign_keys=[project_id])
    deposit = relationship("Deposit", foreign_keys=[deposit_id])
    sales_user = relationship("User", foreign_keys=[sales_user_id])
    sales_unit = relationship("OrganizationalUnit", foreign_keys=[sales_unit_id])
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])
    payments = relationship("Payment", back_populates="contract", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "contract_code", name="uq_org_contract_code"),
        Index("ix_contracts_org_id", "org_id"),
        Index("ix_contracts_deal_id", "deal_id"),
        Index("ix_contracts_customer_id", "customer_id"),
        Index("ix_contracts_product_id", "product_id"),
        Index("ix_contracts_contract_status", "contract_status"),
        Index("ix_contracts_signed_date", "signed_date"),
        Index("ix_contracts_status", "status"),
    )
    
    def __repr__(self):
        return f"<Contract {self.contract_code}: {self.contract_status}>"
    
    @property
    def is_signed(self):
        """Check if contract is fully signed"""
        return self.signed_by_customer and self.signed_by_company
    
    @property
    def payment_progress(self):
        """Calculate payment progress percentage"""
        if self.final_value and self.final_value > 0:
            return round((self.total_paid / self.final_value) * 100, 2)
        return 0
    
    def update_payment_totals(self, paid_amount: float):
        """Update payment totals after a payment"""
        self.total_paid = (self.total_paid or 0) + paid_amount
        self.remaining_balance = self.final_value - self.total_paid
