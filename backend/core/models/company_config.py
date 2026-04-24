"""
ProHouzing Company RBAC Configuration Models
Version: 1.0.0 (Prompt 4/20 - Multi-Company Ready)

Per-company RBAC customization với giới hạn:
- Role template: enable/disable, rename label
- Permission override: limited scope changes
- Company settings: feature toggles

80% default, 20% flexible - KHÔNG phá core system.
"""

from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, Index, UniqueConstraint, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import SoftDeleteModel, GUID, utc_now


class CompanySettings(SoftDeleteModel):
    """
    Company-level configuration.
    
    Controls feature toggles và org structure.
    """
    __tablename__ = "company_settings"
    
    # Link to organization
    org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=False, unique=True)
    
    # Organization Structure Toggles
    use_team_level = Column(Boolean, default=True)      # Có dùng Team không?
    use_branch_level = Column(Boolean, default=True)    # Có dùng Branch không?
    
    # Approval Settings
    approval_required_contracts = Column(Boolean, default=True)   # Contract cần approve?
    approval_required_commissions = Column(Boolean, default=True) # Commission cần approve?
    approval_required_deals = Column(Boolean, default=False)      # Deal stage change cần approve?
    
    # Feature Toggles
    enable_commissions = Column(Boolean, default=True)
    enable_marketing_module = Column(Boolean, default=True)
    enable_hr_module = Column(Boolean, default=False)
    enable_legal_module = Column(Boolean, default=True)
    
    # UI Customization (Limited)
    company_logo_url = Column(String(500))
    primary_color = Column(String(20), default="#1a56db")  # Brand color
    
    # Locale
    default_locale = Column(String(10), default="vi-VN")
    default_timezone = Column(String(50), default="Asia/Ho_Chi_Minh")
    
    # Extra settings (JSONB for flexibility but controlled)
    extra_settings = Column(JSONB, default=dict)
    
    # Relationships
    organization = relationship("Organization", backref="company_settings")
    
    # Indexes
    __table_args__ = (
        Index("ix_company_settings_org_id", "org_id"),
    )
    
    def __repr__(self):
        return f"<CompanySettings org={self.org_id}>"


class RoleTemplate(SoftDeleteModel):
    """
    Per-company role customization.
    
    Allows:
    - Enable/disable canonical roles
    - Rename labels (display name only)
    
    NOT allowed:
    - Create new roles
    - Change permissions (use RolePermissionOverride)
    """
    __tablename__ = "role_templates"
    
    # Link to organization
    org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=False)
    
    # Canonical role being customized
    role_code = Column(String(50), nullable=False)  # Must be canonical role
    
    # Customization
    is_enabled = Column(Boolean, default=True)      # Enable/disable role
    display_name = Column(String(100))              # Custom label (VD: "Chuyên viên KD")
    display_name_en = Column(String(100))           # English label
    description = Column(String(500))               # Custom description
    
    # Sort order for UI
    sort_order = Column(Integer, default=0)
    
    # Relationships
    organization = relationship("Organization")
    
    # Unique constraint: one template per role per org
    __table_args__ = (
        UniqueConstraint("org_id", "role_code", name="uq_role_template_org_role"),
        Index("ix_role_templates_org_id", "org_id"),
        Index("ix_role_templates_role_code", "role_code"),
    )
    
    def __repr__(self):
        return f"<RoleTemplate org={self.org_id} role={self.role_code}>"


class RolePermissionOverride(SoftDeleteModel):
    """
    Per-company permission override.
    
    LIMITED customization:
    - Can only REDUCE permissions (not expand)
    - Can only change SCOPE (not add new permissions)
    
    Rule: Default = canonical, Override = restricted
    """
    __tablename__ = "role_permission_overrides"
    
    # Link to organization
    org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=False)
    
    # Permission being overridden
    role_code = Column(String(50), nullable=False)   # Canonical role
    module = Column(String(50), nullable=False)      # leads, deals, contracts, etc.
    action = Column(String(50), nullable=False)      # view, create, edit, delete, etc.
    
    # Override values
    scope_override = Column(String(20))              # self, team, branch, all, DISABLED
    is_disabled = Column(Boolean, default=False)     # Completely disable this permission
    
    # Audit
    created_by = Column(GUID(), ForeignKey("users.id"))
    reason = Column(String(500))                     # Why this override?
    
    # Relationships
    organization = relationship("Organization")
    creator = relationship("User", foreign_keys=[created_by])
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint("org_id", "role_code", "module", "action", name="uq_permission_override"),
        Index("ix_permission_overrides_org_id", "org_id"),
        Index("ix_permission_overrides_role", "role_code"),
    )
    
    def __repr__(self):
        return f"<RolePermissionOverride org={self.org_id} {self.role_code}.{self.module}.{self.action}>"
