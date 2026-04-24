"""
ProHouzing Lead Model
Version: 1.0.0

Entities:
- Lead (marketing leads before conversion to deal)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY, utc_now


class Lead(SoftDeleteModel, StatusMixin):
    """
    Lead entity - Marketing leads before qualification
    
    Leads represent initial customer interest.
    Qualified leads convert to Deals.
    """
    __tablename__ = "leads"
    
    # Identity
    lead_code = Column(String(50), nullable=False)
    
    # Customer Reference (may be created during lead capture)
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=True)
    
    # Contact Info (denormalized for quick access when customer not yet created)
    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    
    # Source Information
    source_channel = Column(String(50), nullable=False)  # SourceChannel enum
    source_campaign = Column(String(255), nullable=True)
    source_medium = Column(String(100), nullable=True)  # paid/organic/referral
    source_content = Column(String(255), nullable=True)  # Ad content/landing page
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    utm_term = Column(String(255), nullable=True)
    utm_content = Column(String(255), nullable=True)
    
    # Referral
    referrer_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    referrer_customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=True)
    referrer_code = Column(String(50), nullable=True)
    
    # Interest
    project_interest_id = Column(GUID(), ForeignKey("projects.id"), nullable=True)
    product_type_interest = Column(ARRAY(String(50)), nullable=True)
    budget_min = Column(Numeric(15, 2), nullable=True)
    budget_max = Column(Numeric(15, 2), nullable=True)
    
    # Qualification
    lead_status = Column(String(50), default="new")  # LeadStatus enum
    intent_level = Column(String(50), nullable=True)  # IntentLevel enum
    qualification_score = Column(Integer, nullable=True)  # 0-100
    qualification_notes = Column(Text, nullable=True)
    
    # Assignment
    owner_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    owner_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timeline
    captured_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    first_contacted_at = Column(DateTime(timezone=True), nullable=True)
    qualified_at = Column(DateTime(timezone=True), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Conversion
    converted_to_deal_id = Column(GUID(), nullable=True)  # Reference to created deal
    
    # Loss Reason (if lead_status = lost/invalid)
    lost_reason = Column(String(100), nullable=True)
    lost_reason_detail = Column(Text, nullable=True)
    
    # Communication
    preferred_contact_method = Column(String(50), nullable=True)  # phone/email/zalo
    preferred_contact_time = Column(String(100), nullable=True)
    do_not_contact = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Statistics
    contact_attempts = Column(Integer, default=0)
    last_contact_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])
    owner = relationship("User", foreign_keys=[owner_user_id])
    owner_unit = relationship("OrganizationalUnit", foreign_keys=[owner_unit_id])
    referrer_user = relationship("User", foreign_keys=[referrer_user_id])
    referrer_customer = relationship("Customer", foreign_keys=[referrer_customer_id])
    project_interest = relationship("Project", foreign_keys=[project_interest_id])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "lead_code", name="uq_org_lead_code"),
        Index("ix_leads_org_id", "org_id"),
        Index("ix_leads_customer_id", "customer_id"),
        Index("ix_leads_contact_phone", "contact_phone"),
        Index("ix_leads_contact_email", "contact_email"),
        Index("ix_leads_owner_user_id", "owner_user_id"),
        Index("ix_leads_lead_status", "lead_status"),
        Index("ix_leads_source_channel", "source_channel"),
        Index("ix_leads_captured_at", "captured_at"),
        Index("ix_leads_status", "status"),
    )
    
    def __repr__(self):
        return f"<Lead {self.lead_code}: {self.contact_name}>"
    
    @property
    def is_convertible(self):
        """Check if lead can be converted to deal"""
        return (
            self.lead_status in ["qualified", "contacted"] and
            self.status == "active" and
            self.converted_to_deal_id is None
        )
