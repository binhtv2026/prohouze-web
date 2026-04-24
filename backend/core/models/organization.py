"""
ProHouzing Organization Models
Version: 1.0.0

Entities:
- Organization (company/branch/agency)
- OrganizationalUnit (team/department)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import CoreModel, SoftDeleteModel, StatusMixin, GUID, JSONB, generate_uuid


class Organization(CoreModel, StatusMixin):
    """
    Organization entity - Company, Branch, Agency, Partner
    
    This is the top-level tenant entity.
    All data is scoped by organization.
    """
    __tablename__ = "organizations"
    
    # Identity
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    
    # Type & Hierarchy
    org_type = Column(String(50), nullable=False, default="company")  # OrgType enum
    parent_org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)
    level = Column(Integer, default=0)  # Hierarchy depth
    
    # Location
    country_code = Column(String(3), default="VN")
    province_code = Column(String(10), nullable=True)
    district_code = Column(String(10), nullable=True)
    address = Column(String(500), nullable=True)
    
    # Business Info
    tax_code = Column(String(20), nullable=True)
    business_license = Column(String(50), nullable=True)
    
    # Contact
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Settings
    timezone = Column(String(50), default="Asia/Ho_Chi_Minh")
    currency_code = Column(String(3), default="VND")
    locale = Column(String(10), default="vi-VN")
    
    # Configuration (JSONB for flexibility)
    settings_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    parent = relationship("Organization", remote_side="Organization.id", backref="children")
    units = relationship("OrganizationalUnit", back_populates="organization", lazy="dynamic")
    users = relationship("User", back_populates="organization", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        Index("ix_organizations_parent_org_id", "parent_org_id"),
        Index("ix_organizations_org_type", "org_type"),
        Index("ix_organizations_status", "status"),
    )
    
    def __repr__(self):
        return f"<Organization {self.code}: {self.name}>"


class OrganizationalUnit(CoreModel, StatusMixin):
    """
    Organizational Unit - Team, Department, Branch within an Organization
    
    Supports hierarchical structure (parent-child).
    """
    __tablename__ = "organizational_units"
    
    # Organization scope
    org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=False)
    
    # Identity
    unit_code = Column(String(50), nullable=False)
    unit_name = Column(String(255), nullable=False)
    unit_type = Column(String(50), nullable=False, default="team")  # UnitType enum
    
    # Hierarchy
    parent_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    level = Column(Integer, default=0)  # Hierarchy depth
    path = Column(String(500), nullable=True)  # Materialized path for fast queries
    
    # Management
    manager_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Display
    sort_order = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    
    # Settings
    settings_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    organization = relationship("Organization", back_populates="units")
    parent = relationship("OrganizationalUnit", remote_side="OrganizationalUnit.id", backref="children")
    manager = relationship("User", foreign_keys=[manager_user_id])
    members = relationship("UserMembership", back_populates="unit", lazy="dynamic")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("org_id", "unit_code", name="uq_org_unit_code"),
        Index("ix_organizational_units_parent_unit_id", "parent_unit_id"),
        Index("ix_organizational_units_unit_type", "unit_type"),
    )
    
    def __repr__(self):
        return f"<OrganizationalUnit {self.unit_code}: {self.unit_name}>"
    
    def get_path(self):
        """Get full path from root to this unit"""
        if self.parent:
            return f"{self.parent.get_path()}/{self.unit_code}"
        return self.unit_code
