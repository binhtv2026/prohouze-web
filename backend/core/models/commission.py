"""
ProHouzing Commission Model
Version: 1.0.0

Entities:
- CommissionEntry (commission ledger entries)
- CommissionRule (commission calculation rules)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, CoreModel, StatusMixin, GUID, JSONB, utc_now


class CommissionEntry(CoreModel):
    """
    Commission Entry - Immutable commission ledger
    
    Each entry represents a commission earned/owed.
    Supports multi-level agency structure (F0/F1/F2).
    """
    __tablename__ = "commission_entries"
    
    # Organization
    org_id = Column(GUID(), nullable=False)
    
    # Entry Code
    entry_code = Column(String(50), nullable=False)
    
    # Commission Type
    commission_type = Column(String(50), nullable=False)  # CommissionType enum
    
    # Source (what generated this commission)
    deal_id = Column(GUID(), ForeignKey("deals.id"), nullable=False)
    contract_id = Column(GUID(), ForeignKey("contracts.id"), nullable=True)
    payment_id = Column(GUID(), ForeignKey("payments.id"), nullable=True)
    
    # Product/Project Info (denormalized for reporting)
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=True)
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=True)
    
    # Beneficiary
    beneficiary_type = Column(String(50), nullable=False)  # user/org/partner
    beneficiary_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    beneficiary_org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)
    beneficiary_name = Column(String(255), nullable=True)  # Denormalized
    
    # Level (for multi-tier)
    level_code = Column(String(10), nullable=True)  # LevelCode enum: direct/F0/F1/F2
    parent_entry_id = Column(GUID(), ForeignKey("commission_entries.id"), nullable=True)
    
    # Calculation Basis
    base_amount = Column(Numeric(15, 2), nullable=False)  # Deal/Contract value
    rate_type = Column(String(20), nullable=False)  # RateType enum: percent/fixed
    rate_value = Column(Numeric(10, 4), nullable=False)  # Rate or fixed amount
    
    # Calculated Amount
    gross_amount = Column(Numeric(15, 2), nullable=False)  # Before deductions
    deductions = Column(Numeric(15, 2), default=0)  # Any deductions
    net_amount = Column(Numeric(15, 2), nullable=False)  # Final commission
    currency_code = Column(String(3), default="VND")
    
    # Earning Status
    earning_status = Column(String(50), default="pending")  # EarningStatus enum
    earned_at = Column(DateTime(timezone=True), nullable=True)
    earning_trigger = Column(String(50), nullable=True)  # What triggered earning
    
    # Payout Status
    payout_status = Column(String(50), default="not_due")  # PayoutStatus enum
    payout_due_date = Column(Date, nullable=True)
    payout_batch_id = Column(GUID(), nullable=True)  # Batch reference
    paid_at = Column(DateTime(timezone=True), nullable=True)
    paid_amount = Column(Numeric(15, 2), nullable=True)
    
    # Period
    earning_period = Column(String(7), nullable=True)  # YYYY-MM format
    
    # Reference Entry (for adjustments/clawbacks)
    reference_entry_id = Column(GUID(), ForeignKey("commission_entries.id"), nullable=True)
    adjustment_reason = Column(Text, nullable=True)
    
    # Rule Reference
    rule_id = Column(GUID(), ForeignKey("commission_rules.id"), nullable=True)
    rule_snapshot = Column(JSONB, nullable=True)  # Rule at time of calculation
    
    # Approval
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Hold
    is_held = Column(Boolean, default=False)
    held_reason = Column(String(255), nullable=True)
    held_at = Column(DateTime(timezone=True), nullable=True)
    held_by = Column(GUID(), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    deal = relationship("Deal", foreign_keys=[deal_id])
    contract = relationship("Contract", foreign_keys=[contract_id])
    payment = relationship("Payment", foreign_keys=[payment_id])
    product = relationship("Product", foreign_keys=[product_id])
    project = relationship("Project", foreign_keys=[project_id])
    beneficiary_user = relationship("User", foreign_keys=[beneficiary_user_id])
    beneficiary_org = relationship("Organization", foreign_keys=[beneficiary_org_id])
    parent_entry = relationship("CommissionEntry", remote_side="CommissionEntry.id", foreign_keys=[parent_entry_id])
    reference_entry = relationship("CommissionEntry", remote_side="CommissionEntry.id", foreign_keys=[reference_entry_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    rule = relationship("CommissionRule", foreign_keys=[rule_id])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "entry_code", name="uq_org_commission_entry_code"),
        Index("ix_commission_entries_org_id", "org_id"),
        Index("ix_commission_entries_deal_id", "deal_id"),
        Index("ix_commission_entries_beneficiary_user_id", "beneficiary_user_id"),
        Index("ix_commission_entries_beneficiary_org_id", "beneficiary_org_id"),
        Index("ix_commission_entries_earning_status", "earning_status"),
        Index("ix_commission_entries_payout_status", "payout_status"),
        Index("ix_commission_entries_earning_period", "earning_period"),
        Index("ix_commission_entries_commission_type", "commission_type"),
    )
    
    def __repr__(self):
        return f"<CommissionEntry {self.entry_code}: {self.net_amount} {self.currency_code}>"


class CommissionRule(SoftDeleteModel, StatusMixin):
    """
    Commission Rule - Calculation rules
    
    Defines how commissions are calculated for different scenarios.
    """
    __tablename__ = "commission_rules"
    
    # Identity
    rule_code = Column(String(50), nullable=False)
    rule_name = Column(String(255), nullable=False)
    
    # Scope
    applies_to_type = Column(String(50), nullable=True)  # project/product_type/all
    applies_to_id = Column(GUID(), nullable=True)  # Specific project/product
    
    # Beneficiary Scope
    beneficiary_type = Column(String(50), nullable=False)  # user/org/partner
    beneficiary_role = Column(String(50), nullable=True)  # RoleCode if user
    
    # Commission Type
    commission_type = Column(String(50), nullable=False)  # CommissionType enum
    level_code = Column(String(10), nullable=True)  # LevelCode enum
    
    # Rate
    rate_type = Column(String(20), nullable=False)  # RateType enum
    rate_value = Column(Numeric(10, 4), nullable=False)
    min_amount = Column(Numeric(15, 2), nullable=True)
    max_amount = Column(Numeric(15, 2), nullable=True)
    
    # Earning Conditions
    earning_trigger = Column(String(50), nullable=False)  # booking/deposit/contract/payment
    earning_percentage = Column(Numeric(5, 2), default=100)  # % of commission to earn
    
    # Priority
    priority = Column(Integer, default=0)  # Higher = higher priority
    
    # Validity
    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)
    
    # Conditions (JSONB for complex rules)
    conditions_json = Column(JSONB, nullable=True, default=dict)
    
    # Description
    description = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "rule_code", name="uq_org_commission_rule_code"),
        Index("ix_commission_rules_org_id", "org_id"),
        Index("ix_commission_rules_status", "status"),
        Index("ix_commission_rules_commission_type", "commission_type"),
    )
    
    def __repr__(self):
        return f"<CommissionRule {self.rule_code}: {self.rule_name}>"
