"""
ProHouzing Customer Models
Version: 1.0.0

Entities:
- Customer (master customer record)
- CustomerIdentity (phone/email/zalo for dedup)
- CustomerAddress (address book)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY, normalize_phone, normalize_email


class Customer(SoftDeleteModel, StatusMixin):
    """
    Customer entity - Single Source of Truth for customers
    
    This is the canonical customer record.
    All leads/deals reference this.
    Deduplication via CustomerIdentity.
    """
    __tablename__ = "customers"
    
    # Identity
    customer_code = Column(String(50), nullable=False)
    
    # Personal Info
    full_name = Column(String(255), nullable=False)
    gender = Column(String(20), nullable=True)  # Gender enum
    birth_date = Column(Date, nullable=True)
    
    # Primary Contact (denormalized for quick access)
    primary_phone = Column(String(20), nullable=True)  # E.164 normalized
    primary_email = Column(String(255), nullable=True)  # lowercase normalized
    
    # Type & Stage
    customer_type = Column(String(50), default="individual")  # CustomerType enum
    customer_stage = Column(String(50), default="lead")  # CustomerStage enum
    
    # Source
    lead_source_primary = Column(String(100), nullable=True)
    lead_source_detail = Column(String(255), nullable=True)
    first_contact_date = Column(Date, nullable=True)
    
    # Ownership
    owner_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    owner_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    assigned_at = Column(Date, nullable=True)
    
    # Qualification
    rating_score = Column(Integer, nullable=True)  # 1-5 stars
    qualification_level = Column(String(50), nullable=True)  # QualificationLevel enum
    
    # Preferences
    preferred_language = Column(String(10), default="vi")
    province_interest = Column(ARRAY(String(10)), nullable=True)  # Provinces interested in
    product_type_interest = Column(ARRAY(String(50)), nullable=True)  # Product types interested
    budget_min = Column(Integer, nullable=True)  # VND
    budget_max = Column(Integer, nullable=True)  # VND
    
    # Segmentation
    segment_code = Column(String(50), nullable=True)
    tags = Column(ARRAY(String(50)), nullable=True)
    
    # Marketing
    do_not_contact = Column(Boolean, default=False)
    do_not_email = Column(Boolean, default=False)
    do_not_call = Column(Boolean, default=False)
    consent_status = Column(String(50), default="pending")  # ConsentStatus enum
    consent_date = Column(Date, nullable=True)
    
    # Company (if customer_type = company)
    company_name = Column(String(255), nullable=True)
    company_tax_code = Column(String(20), nullable=True)
    company_position = Column(String(100), nullable=True)
    
    # Summary
    note_summary = Column(Text, nullable=True)
    
    # Statistics (denormalized)
    total_deals = Column(Integer, default=0)
    total_revenue = Column(Integer, default=0)
    last_interaction_at = Column(Date, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    identities = relationship("CustomerIdentity", back_populates="customer", lazy="dynamic")
    addresses = relationship("CustomerAddress", back_populates="customer", lazy="dynamic")
    owner = relationship("User", foreign_keys=[owner_user_id])
    owner_unit = relationship("OrganizationalUnit", foreign_keys=[owner_unit_id])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "customer_code", name="uq_org_customer_code"),
        Index("ix_customers_org_id", "org_id"),
        Index("ix_customers_primary_phone", "primary_phone"),
        Index("ix_customers_primary_email", "primary_email"),
        Index("ix_customers_owner_user_id", "owner_user_id"),
        Index("ix_customers_customer_stage", "customer_stage"),
        Index("ix_customers_status", "status"),
    )
    
    def __repr__(self):
        return f"<Customer {self.customer_code}: {self.full_name}>"
    
    def set_primary_phone(self, phone: str):
        """Set and normalize primary phone"""
        self.primary_phone = normalize_phone(phone)
    
    def set_primary_email(self, email: str):
        """Set and normalize primary email"""
        self.primary_email = normalize_email(email)


class CustomerIdentity(SoftDeleteModel):
    """
    Customer Identity - For deduplication
    
    Stores all identifiers (phone, email, zalo, etc.)
    Used to find/merge duplicate customers.
    """
    __tablename__ = "customer_identities"
    
    # Customer reference
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    
    # Identity
    identity_type = Column(String(50), nullable=False)  # IdentityType enum
    identity_value_raw = Column(String(255), nullable=False)  # Original input
    identity_value_normalized = Column(String(255), nullable=False)  # Cleaned
    
    # Flags
    is_primary = Column(Boolean, default=False)
    verified_status = Column(String(50), default="unverified")  # VerifiedStatus enum
    verified_at = Column(Date, nullable=True)
    verified_by = Column(GUID(), nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="identities")
    
    # Constraints - UNIQUE per identity type + normalized value
    __table_args__ = (
        UniqueConstraint(
            "identity_type", "identity_value_normalized",
            name="uq_identity_type_value"
        ),
        Index("ix_customer_identities_customer_id", "customer_id"),
        Index("ix_customer_identities_type_value", "identity_type", "identity_value_normalized"),
    )
    
    def __repr__(self):
        return f"<CustomerIdentity {self.identity_type}: {self.identity_value_normalized}>"
    
    @classmethod
    def normalize_value(cls, identity_type: str, value: str) -> str:
        """Normalize identity value based on type"""
        if identity_type == "phone":
            return normalize_phone(value)
        elif identity_type == "email":
            return normalize_email(value)
        else:
            return value.strip().lower()


class CustomerAddress(SoftDeleteModel):
    """
    Customer Address - Address book
    """
    __tablename__ = "customer_addresses"
    
    # Customer reference
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=False)
    
    # Address
    address_type = Column(String(50), default="home")  # AddressType enum
    full_address = Column(String(500), nullable=True)
    street_address = Column(String(255), nullable=True)
    ward_code = Column(String(10), nullable=True)
    district_code = Column(String(10), nullable=True)
    province_code = Column(String(10), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country_code = Column(String(3), default="VN")
    
    # Coordinates
    latitude = Column(String(20), nullable=True)
    longitude = Column(String(20), nullable=True)
    
    # Flags
    is_primary = Column(Boolean, default=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="addresses")
    
    # Indexes
    __table_args__ = (
        Index("ix_customer_addresses_customer_id", "customer_id"),
        Index("ix_customer_addresses_province_code", "province_code"),
    )
    
    def __repr__(self):
        return f"<CustomerAddress {self.address_type}: {self.full_address}>"
