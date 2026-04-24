"""
ProHouzing User Models
Version: 1.0.0

Entities:
- User (all system users)
- UserMembership (role assignments)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY


class User(SoftDeleteModel, StatusMixin):
    """
    User entity - All system users (employees, CTV, partners)
    
    This is the canonical user record.
    Authentication handled separately.
    """
    __tablename__ = "users"
    
    # Organization & Unit
    org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)  # Organization scope
    primary_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    
    # Identity
    employee_code = Column(String(50), nullable=True)
    
    # Personal Info
    full_name = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)  # Gender enum
    birth_date = Column(Date, nullable=True)
    
    # Contact
    phone = Column(String(20), nullable=True)  # E.164 format
    email = Column(String(255), nullable=False, unique=True)
    secondary_phone = Column(String(20), nullable=True)
    secondary_email = Column(String(255), nullable=True)
    
    # Authentication
    password_hash = Column(String(255), nullable=True)
    last_password_change = Column(Date, nullable=True)
    
    # Profile
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Employment
    user_type = Column(String(50), nullable=False, default="internal")  # UserType enum
    employment_type = Column(String(50), nullable=True)  # EmploymentType enum
    job_title = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    
    # Dates
    joined_at = Column(Date, nullable=True)
    left_at = Column(Date, nullable=True)
    last_login_at = Column(Date, nullable=True)
    last_active_at = Column(Date, nullable=True)
    
    # Location
    province_code = Column(String(10), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)
    
    # Referral
    ref_code = Column(String(50), nullable=True, unique=True)  # User's referral code
    referred_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Performance (denormalized for quick access)
    total_deals = Column(Integer, default=0)
    total_leads = Column(Integer, default=0)
    total_revenue = Column(Integer, default=0)
    
    # Settings & Preferences
    preferred_language = Column(String(10), default="vi")
    timezone = Column(String(50), default="Asia/Ho_Chi_Minh")
    notification_settings = Column(JSONB, nullable=True, default=dict)
    settings_json = Column(JSONB, nullable=True, default=dict)
    
    # Tags
    tags = Column(ARRAY(String(50)), nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    primary_unit = relationship("OrganizationalUnit", foreign_keys=[primary_unit_id])
    referred_by = relationship("User", remote_side="User.id", backref="referrals")
    memberships = relationship("UserMembership", back_populates="user", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "employee_code", name="uq_org_employee_code"),
        Index("ix_users_org_id", "org_id"),
        Index("ix_users_email", "email"),
        Index("ix_users_phone", "phone"),
        Index("ix_users_ref_code", "ref_code"),
        Index("ix_users_status", "status"),
        Index("ix_users_user_type", "user_type"),
    )
    
    def __repr__(self):
        return f"<User {self.email}: {self.full_name}>"
    
    @property
    def display_name(self):
        return self.full_name or self.email


class UserMembership(SoftDeleteModel):
    """
    User Membership - Role assignments to units/orgs
    
    A user can have multiple roles across different units.
    Supports time-bound memberships.
    """
    __tablename__ = "user_memberships"
    
    # User
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    
    # Organization
    org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)
    
    # Scope
    unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    
    # Role
    role_code = Column(String(50), nullable=False)  # RoleCode enum
    
    # Scope Type (for RBAC)
    scope_type = Column(String(50), default="unit")  # ScopeType enum
    scope_id = Column(GUID(), nullable=True)  # Reference to scoped entity
    
    # Primary flag
    is_primary = Column(Boolean, default=False)
    
    # Time bounds
    active_from = Column(Date, nullable=True)
    active_to = Column(Date, nullable=True)
    
    # Status
    status = Column(String(50), default="active")
    
    # Permissions override (JSONB)
    permissions_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization")
    unit = relationship("OrganizationalUnit", back_populates="members")
    
    # Indexes
    __table_args__ = (
        Index("ix_user_memberships_user_id", "user_id"),
        Index("ix_user_memberships_org_id", "org_id"),
        Index("ix_user_memberships_unit_id", "unit_id"),
        Index("ix_user_memberships_role_code", "role_code"),
        Index("ix_user_memberships_status", "status"),
        UniqueConstraint(
            "user_id", "org_id", "unit_id", "role_code", "scope_type", "scope_id",
            name="uq_user_membership"
        ),
    )
    
    def __repr__(self):
        return f"<UserMembership user={self.user_id} role={self.role_code}>"
