"""
ProHouzing Partner Model
Version: 1.0.0

Entities:
- Partner (agency/distributor/broker)
- PartnerContract (partnership agreement)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY, utc_now


class Partner(SoftDeleteModel, StatusMixin):
    """
    Partner entity - Agencies, Distributors, Brokers
    
    Partners can have sub-partners (F0 -> F1 -> F2 structure).
    Commission flows through partner hierarchy.
    """
    __tablename__ = "partners"
    
    # Identity
    partner_code = Column(String(50), nullable=False)
    partner_name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    
    # Type
    partner_type = Column(String(50), nullable=False)  # PartnerType enum
    partner_status = Column(String(50), default="pending")  # PartnerStatus enum
    
    # Hierarchy (F0 -> F1 -> F2)
    level_code = Column(String(10), default="F0")  # LevelCode enum
    parent_partner_id = Column(GUID(), ForeignKey("partners.id"), nullable=True)
    root_partner_id = Column(GUID(), ForeignKey("partners.id"), nullable=True)  # Top-level F0
    
    # Organization Link (if partner has own org account)
    partner_org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)
    
    # Contact
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_position = Column(String(100), nullable=True)
    
    # Business Info
    tax_code = Column(String(20), nullable=True)
    business_license = Column(String(50), nullable=True)
    
    # Address
    address = Column(String(500), nullable=True)
    province_code = Column(String(10), nullable=True)
    district_code = Column(String(10), nullable=True)
    
    # Bank Info
    bank_name = Column(String(100), nullable=True)
    bank_account = Column(String(50), nullable=True)
    bank_account_name = Column(String(255), nullable=True)
    bank_branch = Column(String(255), nullable=True)
    
    # Commission Settings
    default_commission_rate = Column(Numeric(5, 2), nullable=True)
    commission_policy = Column(Text, nullable=True)
    
    # Dates
    onboarded_at = Column(DateTime(timezone=True), nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    terminated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Performance (denormalized)
    total_deals = Column(Integer, default=0)
    total_revenue = Column(Numeric(15, 2), default=0)
    total_commission = Column(Numeric(15, 2), default=0)
    
    # Assigned Projects
    assigned_project_ids = Column(ARRAY(GUID()), nullable=True)
    
    # Rating
    performance_score = Column(Integer, nullable=True)  # 0-100
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    parent_partner = relationship("Partner", remote_side="Partner.id", foreign_keys=[parent_partner_id], backref="sub_partners")
    root_partner = relationship("Partner", remote_side="Partner.id", foreign_keys=[root_partner_id])
    partner_org = relationship("Organization", foreign_keys=[partner_org_id])
    contracts = relationship("PartnerContract", back_populates="partner", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "partner_code", name="uq_org_partner_code"),
        Index("ix_partners_org_id", "org_id"),
        Index("ix_partners_partner_code", "partner_code"),
        Index("ix_partners_partner_type", "partner_type"),
        Index("ix_partners_partner_status", "partner_status"),
        Index("ix_partners_level_code", "level_code"),
        Index("ix_partners_parent_partner_id", "parent_partner_id"),
        Index("ix_partners_status", "status"),
    )
    
    def __repr__(self):
        return f"<Partner {self.partner_code}: {self.partner_name}>"
    
    @property
    def is_active(self):
        """Check if partner is active"""
        return self.partner_status == "active" and self.status == "active"


class PartnerContract(SoftDeleteModel, StatusMixin):
    """
    Partner Contract - Partnership agreement
    
    Defines the terms of partnership including commission rates.
    """
    __tablename__ = "partner_contracts"
    
    # Partner
    partner_id = Column(GUID(), ForeignKey("partners.id"), nullable=False)
    
    # Contract Info
    contract_code = Column(String(50), nullable=False)
    contract_name = Column(String(255), nullable=True)
    
    # Type
    contract_type = Column(String(50), default="distribution")  # distribution/exclusive/etc.
    
    # Validity
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    auto_renew = Column(Boolean, default=False)
    
    # Commission Terms
    commission_rate = Column(Numeric(5, 2), nullable=True)
    commission_terms = Column(JSONB, nullable=True)  # Complex commission structure
    
    # Target
    sales_target = Column(Numeric(15, 2), nullable=True)
    minimum_deals = Column(Integer, nullable=True)
    
    # Scope
    project_ids = Column(ARRAY(GUID()), nullable=True)  # Assigned projects
    territory = Column(ARRAY(String(10)), nullable=True)  # Province codes
    
    # Signing
    signed_date = Column(Date, nullable=True)
    signed_by_partner = Column(String(255), nullable=True)
    signed_by_company = Column(String(255), nullable=True)
    
    # Documents
    document_url = Column(String(500), nullable=True)
    
    # Termination
    terminated_at = Column(DateTime(timezone=True), nullable=True)
    termination_reason = Column(Text, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    partner = relationship("Partner", back_populates="contracts")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "contract_code", name="uq_org_partner_contract_code"),
        Index("ix_partner_contracts_org_id", "org_id"),
        Index("ix_partner_contracts_partner_id", "partner_id"),
        Index("ix_partner_contracts_status", "status"),
    )
    
    def __repr__(self):
        return f"<PartnerContract {self.contract_code}: {self.partner_id}>"
    
    @property
    def is_valid(self):
        """Check if contract is currently valid"""
        from datetime import date
        today = date.today()
        return (
            self.status == "active" and
            self.start_date <= today and
            (self.end_date is None or self.end_date >= today)
        )
