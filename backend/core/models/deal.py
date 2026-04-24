"""
ProHouzing Deal Model
Version: 1.0.0

Entities:
- Deal (sales opportunity/pipeline)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY, utc_now


class Deal(SoftDeleteModel, StatusMixin):
    """
    Deal entity - Sales opportunity in the pipeline
    
    Deals track the entire sales process from lead to close.
    Central entity for commission calculation.
    """
    __tablename__ = "deals"
    
    # Identity
    deal_code = Column(String(50), nullable=False)
    deal_name = Column(String(255), nullable=True)
    
    # Customer (Required)
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    
    # Product (Can be assigned later)
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=True)
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=True)
    
    # Source
    source_ref_type = Column(String(50), nullable=True)  # SourceRefType enum
    source_lead_id = Column(GUID(), ForeignKey("leads.id"), nullable=True)
    source_referral_id = Column(GUID(), nullable=True)  # Referral reference
    
    # Sales Channel
    sales_channel = Column(String(50), default="direct")  # SalesChannel enum
    agency_org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)  # If through agency
    
    # Pipeline
    current_stage = Column(String(50), default="new")  # DealStage enum
    previous_stage = Column(String(50), nullable=True)
    stage_changed_at = Column(DateTime(timezone=True), nullable=True)
    stage_history = Column(JSONB, nullable=True, default=list)  # Array of stage changes
    
    # Ownership
    owner_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    owner_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Collaborators (additional sales reps)
    collaborator_user_ids = Column(ARRAY(GUID()), nullable=True)
    
    # Value
    deal_value = Column(Numeric(15, 2), nullable=True)  # Total deal value
    product_price = Column(Numeric(15, 2), nullable=True)  # Product price at deal time
    discount_amount = Column(Numeric(15, 2), default=0)
    discount_percent = Column(Numeric(5, 2), nullable=True)
    final_price = Column(Numeric(15, 2), nullable=True)  # Price after discount
    currency_code = Column(String(3), default="VND")
    
    # Commission Info (denormalized for quick access)
    commission_rate = Column(Numeric(5, 2), nullable=True)  # %
    estimated_commission = Column(Numeric(15, 2), nullable=True)
    
    # Probability & Scoring
    win_probability = Column(Integer, nullable=True)  # 0-100%
    deal_score = Column(Integer, nullable=True)  # AI scoring
    
    # Timeline
    created_at_stage = Column(String(50), default="new")
    expected_close_date = Column(Date, nullable=True)
    actual_close_date = Column(Date, nullable=True)
    
    # Booking Info
    booking_id = Column(GUID(), nullable=True)  # Active booking
    booking_date = Column(Date, nullable=True)
    booking_amount = Column(Numeric(15, 2), nullable=True)
    
    # Deposit Info
    deposit_id = Column(GUID(), nullable=True)  # Active deposit
    deposit_date = Column(Date, nullable=True)
    deposit_amount = Column(Numeric(15, 2), nullable=True)
    
    # Contract Info
    contract_id = Column(GUID(), nullable=True)  # Active contract
    contract_date = Column(Date, nullable=True)
    contract_signed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Close Info
    won_at = Column(DateTime(timezone=True), nullable=True)
    lost_at = Column(DateTime(timezone=True), nullable=True)
    lost_reason = Column(String(100), nullable=True)
    lost_reason_detail = Column(Text, nullable=True)
    lost_to_competitor = Column(String(255), nullable=True)
    
    # Tags
    tags = Column(ARRAY(String(50)), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Activity Summary
    last_activity_at = Column(DateTime(timezone=True), nullable=True)
    next_action = Column(String(255), nullable=True)
    next_action_date = Column(Date, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])
    product = relationship("Product", foreign_keys=[product_id])
    project = relationship("Project", foreign_keys=[project_id])
    source_lead = relationship("Lead", foreign_keys=[source_lead_id])
    agency_org = relationship("Organization", foreign_keys=[agency_org_id])
    owner = relationship("User", foreign_keys=[owner_user_id])
    owner_unit = relationship("OrganizationalUnit", foreign_keys=[owner_unit_id])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "deal_code", name="uq_org_deal_code"),
        Index("ix_deals_org_id", "org_id"),
        Index("ix_deals_customer_id", "customer_id"),
        Index("ix_deals_product_id", "product_id"),
        Index("ix_deals_owner_user_id", "owner_user_id"),
        Index("ix_deals_current_stage", "current_stage"),
        Index("ix_deals_expected_close_date", "expected_close_date"),
        Index("ix_deals_status", "status"),
        Index("ix_deals_org_stage_owner", "org_id", "current_stage", "owner_user_id"),
    )
    
    def __repr__(self):
        return f"<Deal {self.deal_code}: {self.current_stage}>"
    
    @property
    def is_open(self):
        """Check if deal is still open"""
        return self.current_stage not in ["won", "lost", "cancelled"]
    
    @property
    def is_won(self):
        """Check if deal is won"""
        return self.current_stage == "won"
    
    def change_stage(self, new_stage: str, changed_by: str = None):
        """Change deal stage with history tracking"""
        from datetime import datetime, timezone
        
        if self.current_stage != new_stage:
            # Record history
            history_entry = {
                "from_stage": self.current_stage,
                "to_stage": new_stage,
                "changed_at": datetime.now(timezone.utc).isoformat(),
                "changed_by": str(changed_by) if changed_by else None
            }
            
            if self.stage_history is None:
                self.stage_history = []
            self.stage_history.append(history_entry)
            
            # Update stage
            self.previous_stage = self.current_stage
            self.current_stage = new_stage
            self.stage_changed_at = datetime.now(timezone.utc)
