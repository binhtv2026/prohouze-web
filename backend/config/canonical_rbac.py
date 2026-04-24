"""
PROHOUZING CANONICAL RBAC CONFIGURATION
Version: 2.0.0 (Prompt 4/20)

Mô hình tổ chức + phân quyền chuẩn cho doanh nghiệp BĐS Việt Nam.

Structure:
- Company
  └── Branch (bắt buộc)
      └── Team (bắt buộc với sales)
          └── Users

9 Canonical Roles:
1. system_admin - Quản trị hệ thống
2. ceo - Tổng giám đốc
3. branch_manager - Giám đốc chi nhánh
4. team_leader - Trưởng nhóm
5. sales_agent - Nhân viên kinh doanh
6. marketing - Marketing
7. hr_admin - Nhân sự
8. legal - Pháp lý
9. finance - Tài chính
"""

from enum import Enum
from typing import Dict, List, Set


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class CanonicalRole(str, Enum):
    """9 Canonical Roles - Không thêm nếu không thật sự cần"""
    SYSTEM_ADMIN = "system_admin"
    CEO = "ceo"
    BRANCH_MANAGER = "branch_manager"
    TEAM_LEADER = "team_leader"
    SALES_AGENT = "sales_agent"
    MARKETING = "marketing"
    HR_ADMIN = "hr_admin"
    LEGAL = "legal"
    FINANCE = "finance"


class PermissionScope(str, Enum):
    """Permission scopes for data access"""
    SELF = "self"      # Chỉ data của mình
    TEAM = "team"      # Data của team
    BRANCH = "branch"  # Data của chi nhánh
    ALL = "all"        # Toàn company


class PermissionAction(str, Enum):
    """Standard CRUD + business actions"""
    VIEW = "view"
    READ = "read"
    CREATE = "create"
    EDIT = "edit"
    UPDATE = "update"
    DELETE = "delete"
    ASSIGN = "assign"
    APPROVE = "approve"
    EXPORT = "export"


class UnitType(str, Enum):
    """Organizational unit types"""
    COMPANY = "company"
    BRANCH = "branch"
    DEPARTMENT = "department"
    TEAM = "team"


# ═══════════════════════════════════════════════════════════════════════════════
# ROLE METADATA
# ═══════════════════════════════════════════════════════════════════════════════

ROLE_METADATA: Dict[str, dict] = {
    CanonicalRole.SYSTEM_ADMIN.value: {
        "name_vi": "Quản trị hệ thống",
        "name_en": "System Admin",
        "description": "Full system access, user management",
        "level": 0,  # Highest
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.ALL,
    },
    CanonicalRole.CEO.value: {
        "name_vi": "Tổng giám đốc",
        "name_en": "CEO",
        "description": "Full company access",
        "level": 1,
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.ALL,
    },
    CanonicalRole.BRANCH_MANAGER.value: {
        "name_vi": "Giám đốc chi nhánh",
        "name_en": "Branch Manager",
        "description": "Full branch access",
        "level": 2,
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.BRANCH,
    },
    CanonicalRole.TEAM_LEADER.value: {
        "name_vi": "Trưởng nhóm",
        "name_en": "Team Leader",
        "description": "Team management and sales",
        "level": 3,
        "is_sales": True,
        "requires_team": True,
        "default_scope": PermissionScope.TEAM,
    },
    CanonicalRole.SALES_AGENT.value: {
        "name_vi": "Nhân viên kinh doanh",
        "name_en": "Sales Agent",
        "description": "Direct sales",
        "level": 4,
        "is_sales": True,
        "requires_team": True,
        "default_scope": PermissionScope.SELF,
    },
    CanonicalRole.MARKETING.value: {
        "name_vi": "Marketing",
        "name_en": "Marketing",
        "description": "Marketing campaigns and content",
        "level": 4,
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.ALL,
    },
    CanonicalRole.HR_ADMIN.value: {
        "name_vi": "Nhân sự",
        "name_en": "HR Admin",
        "description": "Employee management",
        "level": 4,
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.ALL,
    },
    CanonicalRole.LEGAL.value: {
        "name_vi": "Pháp lý",
        "name_en": "Legal",
        "description": "Contract and legal review",
        "level": 4,
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.BRANCH,
    },
    CanonicalRole.FINANCE.value: {
        "name_vi": "Tài chính",
        "name_en": "Finance",
        "description": "Finance and commission management",
        "level": 4,
        "is_sales": False,
        "requires_team": False,
        "default_scope": PermissionScope.BRANCH,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# PERMISSION MATRIX
# ═══════════════════════════════════════════════════════════════════════════════

# Format: resource.action -> scope
# None = no access

PERMISSION_MATRIX: Dict[str, Dict[str, str]] = {
    # ─────────────────────────────────────────────────────────────────────────
    # SYSTEM ADMIN - Full access
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.SYSTEM_ADMIN.value: {
        # All resources, all actions, all scope
        "leads.view": "all", "leads.create": "all", "leads.edit": "all", "leads.delete": "all", "leads.assign": "all", "leads.convert": "all", "leads.export": "all",
        "customers.view": "all", "customers.create": "all", "customers.edit": "all", "customers.delete": "all", "customers.assign": "all", "customers.export": "all",
        "deals.view": "all", "deals.create": "all", "deals.edit": "all", "deals.delete": "all", "deals.assign": "all", "deals.approve": "all", "deals.export": "all",
        "bookings.view": "all", "bookings.create": "all", "bookings.edit": "all", "bookings.delete": "all", "bookings.approve": "all", "bookings.cancel": "all",
        "contracts.view": "all", "contracts.create": "all", "contracts.edit": "all", "contracts.delete": "all", "contracts.approve": "all", "contracts.export": "all", "contracts.sign": "all", "contracts.activate": "all", "contracts.terminate": "all", "contracts.complete": "all",
        "commissions.view": "all", "commissions.create": "all", "commissions.edit": "all", "commissions.approve": "all", "commissions.export": "all",
        "payments.view": "all", "payments.create": "all", "payments.approve": "all", "payments.cancel": "all", "payments.reverse": "all",
        "products.view": "all", "products.create": "all", "products.edit": "all", "products.delete": "all", "products.admin": "all",
        "projects.view": "all", "projects.create": "all", "projects.edit": "all", "projects.delete": "all", "projects.read": "all",
        "users.view": "all", "users.create": "all", "users.edit": "all", "users.delete": "all",
        "reports.view": "all", "reports.export": "all",
        "settings.view": "all", "settings.edit": "all",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # CEO - Full company view, strategic actions
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.CEO.value: {
        "leads.view": "all", "leads.create": "all", "leads.edit": "all", "leads.assign": "all", "leads.convert": "all", "leads.export": "all",
        "customers.view": "all", "customers.create": "all", "customers.edit": "all", "customers.assign": "all", "customers.export": "all",
        "deals.view": "all", "deals.create": "all", "deals.edit": "all", "deals.assign": "all", "deals.approve": "all", "deals.export": "all",
        "bookings.view": "all", "bookings.approve": "all", "bookings.cancel": "all",
        "contracts.view": "all", "contracts.approve": "all", "contracts.export": "all", "contracts.sign": "all",
        "commissions.view": "all", "commissions.approve": "all", "commissions.export": "all",
        "payments.view": "all", "payments.approve": "all",
        "products.view": "all", "products.create": "all", "products.edit": "all",
        "projects.view": "all", "projects.create": "all", "projects.edit": "all", "projects.read": "all",
        "users.view": "all",
        "reports.view": "all", "reports.export": "all",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # BRANCH MANAGER - Branch level
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.BRANCH_MANAGER.value: {
        "leads.view": "branch", "leads.create": "branch", "leads.edit": "branch", "leads.assign": "branch", "leads.convert": "branch", "leads.export": "branch",
        "customers.view": "branch", "customers.create": "branch", "customers.edit": "branch", "customers.assign": "branch", "customers.export": "branch",
        "deals.view": "branch", "deals.create": "branch", "deals.edit": "branch", "deals.assign": "branch", "deals.approve": "branch", "deals.export": "branch",
        "bookings.view": "branch", "bookings.create": "branch", "bookings.edit": "branch", "bookings.approve": "branch", "bookings.cancel": "branch",
        "contracts.view": "branch", "contracts.create": "branch", "contracts.edit": "branch", "contracts.approve": "branch",
        "commissions.view": "branch", "commissions.approve": "branch",
        "payments.view": "branch",
        "products.view": "all",
        "projects.view": "all", "projects.read": "all",
        "users.view": "branch",
        "reports.view": "branch", "reports.export": "branch",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # TEAM LEADER - Team level + assign
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.TEAM_LEADER.value: {
        "leads.view": "team", "leads.create": "team", "leads.edit": "team", "leads.assign": "team", "leads.convert": "team", "leads.export": "team",
        "customers.view": "team", "customers.create": "team", "customers.edit": "team", "customers.assign": "team",
        "deals.view": "team", "deals.create": "team", "deals.edit": "team", "deals.assign": "team",
        "bookings.view": "team", "bookings.create": "team", "bookings.edit": "team", "bookings.approve": "team",
        "contracts.view": "team", "contracts.create": "team",
        "commissions.view": "team",
        "products.view": "all",
        "projects.view": "all", "projects.read": "all",
        "users.view": "team",
        "reports.view": "team",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # SALES AGENT - Self level
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.SALES_AGENT.value: {
        "leads.view": "self", "leads.create": "self", "leads.edit": "self", "leads.convert": "self",
        "customers.view": "self", "customers.create": "self", "customers.edit": "self",
        "deals.view": "self", "deals.create": "self", "deals.edit": "self",
        "bookings.view": "self", "bookings.create": "self", "bookings.edit": "self",
        "contracts.view": "self", "contracts.create": "self",
        "commissions.view": "self",
        "products.view": "all",
        "projects.view": "all", "projects.read": "all",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # MARKETING - Content and campaigns
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.MARKETING.value: {
        "leads.view": "all", "leads.create": "all",  # Can create leads from campaigns
        "customers.view": "all",
        "deals.view": "all",
        "products.view": "all", "products.edit": "all",  # Product content
        "projects.view": "all", "projects.edit": "all", "projects.read": "all",  # Project content
        "reports.view": "all",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # HR ADMIN - Employee management
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.HR_ADMIN.value: {
        "users.view": "all", "users.create": "all", "users.edit": "all",
        "reports.view": "all",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # LEGAL - Contract review
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.LEGAL.value: {
        "deals.view": "branch",
        "contracts.view": "all", "contracts.create": "all", "contracts.edit": "all", "contracts.approve": "all", "contracts.sign": "all", "contracts.activate": "all", "contracts.terminate": "all", "contracts.complete": "all",
        "customers.view": "branch",
        "products.view": "all",
    },
    
    # ─────────────────────────────────────────────────────────────────────────
    # FINANCE - Commission and payments
    # ─────────────────────────────────────────────────────────────────────────
    CanonicalRole.FINANCE.value: {
        "deals.view": "branch",
        "contracts.view": "branch",
        "commissions.view": "all", "commissions.edit": "all", "commissions.approve": "all", "commissions.export": "all",
        "payments.view": "all", "payments.create": "all", "payments.approve": "all", "payments.cancel": "all", "payments.reverse": "all",
        "reports.view": "all", "reports.export": "all",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# ROLE HIERARCHY - For inheritance
# ═══════════════════════════════════════════════════════════════════════════════

ROLE_HIERARCHY: Dict[str, List[str]] = {
    # Role inherits permissions from roles listed
    CanonicalRole.CEO.value: [],  # Top level, no inheritance
    CanonicalRole.BRANCH_MANAGER.value: [CanonicalRole.TEAM_LEADER.value],
    CanonicalRole.TEAM_LEADER.value: [CanonicalRole.SALES_AGENT.value],
    CanonicalRole.SALES_AGENT.value: [],
    CanonicalRole.MARKETING.value: [],
    CanonicalRole.HR_ADMIN.value: [],
    CanonicalRole.LEGAL.value: [],
    CanonicalRole.FINANCE.value: [],
    CanonicalRole.SYSTEM_ADMIN.value: [],  # Special role, no inheritance
}


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY ROLE MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

LEGACY_ROLE_MAPPING: Dict[str, str] = {
    # Old role -> New canonical role
    "admin": CanonicalRole.SYSTEM_ADMIN.value,
    "bod": CanonicalRole.CEO.value,
    "ceo": CanonicalRole.CEO.value,
    "super_admin": CanonicalRole.SYSTEM_ADMIN.value,
    "manager": CanonicalRole.TEAM_LEADER.value,
    "sales": CanonicalRole.SALES_AGENT.value,
    "sale": CanonicalRole.SALES_AGENT.value,
    "agency": CanonicalRole.SALES_AGENT.value,
    "ctv": CanonicalRole.SALES_AGENT.value,
    "marketing": CanonicalRole.MARKETING.value,
    "hr": CanonicalRole.HR_ADMIN.value,
    "legal": CanonicalRole.LEGAL.value,
    "finance": CanonicalRole.FINANCE.value,
    "content": CanonicalRole.MARKETING.value,
    "viewer": CanonicalRole.SALES_AGENT.value,  # Fallback
}

RESOURCE_ALIASES: Dict[str, str] = {
    "admin": "settings",
}

ACTION_ALIASES: Dict[str, str] = {
    "read": "view",
    "update": "edit",
}


# ═══════════════════════════════════════════════════════════════════════════════
# SIDEBAR MENU CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

SIDEBAR_MENU_CONFIG: Dict[str, List[dict]] = {
    CanonicalRole.SYSTEM_ADMIN.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "leads", "label": "Leads", "icon": "Users", "path": "/leads"},
        {"key": "customers", "label": "Customers", "icon": "UserCheck", "path": "/contacts"},
        {"key": "deals", "label": "Deals", "icon": "Briefcase", "path": "/deals"},
        {"key": "products", "label": "Products", "icon": "Building2", "path": "/products"},
        {"key": "contracts", "label": "Contracts", "icon": "FileText", "path": "/contracts"},
        {"key": "commissions", "label": "Commissions", "icon": "DollarSign", "path": "/commissions"},
        {"key": "users", "label": "Users", "icon": "Users", "path": "/users"},
        {"key": "settings", "label": "Settings", "icon": "Settings", "path": "/settings"},
    ],
    
    CanonicalRole.CEO.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "leads", "label": "Leads", "icon": "Users", "path": "/leads"},
        {"key": "customers", "label": "Customers", "icon": "UserCheck", "path": "/contacts"},
        {"key": "deals", "label": "Deals", "icon": "Briefcase", "path": "/deals"},
        {"key": "products", "label": "Products", "icon": "Building2", "path": "/products"},
        {"key": "contracts", "label": "Contracts", "icon": "FileText", "path": "/contracts"},
        {"key": "commissions", "label": "Commissions", "icon": "DollarSign", "path": "/commissions"},
        {"key": "reports", "label": "Reports", "icon": "BarChart3", "path": "/reports"},
    ],
    
    CanonicalRole.BRANCH_MANAGER.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "leads", "label": "Leads", "icon": "Users", "path": "/leads"},
        {"key": "customers", "label": "Customers", "icon": "UserCheck", "path": "/contacts"},
        {"key": "deals", "label": "Deals", "icon": "Briefcase", "path": "/deals"},
        {"key": "products", "label": "Products", "icon": "Building2", "path": "/products"},
        {"key": "contracts", "label": "Contracts", "icon": "FileText", "path": "/contracts"},
        {"key": "commissions", "label": "Commissions", "icon": "DollarSign", "path": "/commissions"},
        {"key": "team", "label": "Team", "icon": "Users", "path": "/team"},
        {"key": "reports", "label": "Reports", "icon": "BarChart3", "path": "/reports"},
    ],
    
    CanonicalRole.TEAM_LEADER.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "leads", "label": "Leads", "icon": "Users", "path": "/leads"},
        {"key": "customers", "label": "Customers", "icon": "UserCheck", "path": "/contacts"},
        {"key": "deals", "label": "Deals", "icon": "Briefcase", "path": "/deals"},
        {"key": "products", "label": "Products", "icon": "Building2", "path": "/products"},
        {"key": "team", "label": "Team", "icon": "Users", "path": "/team"},
    ],
    
    CanonicalRole.SALES_AGENT.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "leads", "label": "Leads", "icon": "Users", "path": "/leads"},
        {"key": "customers", "label": "Customers", "icon": "UserCheck", "path": "/contacts"},
        {"key": "deals", "label": "Deals", "icon": "Briefcase", "path": "/deals"},
        {"key": "products", "label": "Products", "icon": "Building2", "path": "/products"},
        {"key": "commissions", "label": "My Commissions", "icon": "DollarSign", "path": "/my-commissions"},
    ],
    
    CanonicalRole.MARKETING.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "leads", "label": "Leads", "icon": "Users", "path": "/leads"},
        {"key": "products", "label": "Products", "icon": "Building2", "path": "/products"},
        {"key": "campaigns", "label": "Campaigns", "icon": "Megaphone", "path": "/campaigns"},
        {"key": "reports", "label": "Reports", "icon": "BarChart3", "path": "/reports"},
    ],
    
    CanonicalRole.HR_ADMIN.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "employees", "label": "Employees", "icon": "Users", "path": "/employees"},
        {"key": "reports", "label": "Reports", "icon": "BarChart3", "path": "/reports"},
    ],
    
    CanonicalRole.LEGAL.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "contracts", "label": "Contracts", "icon": "FileText", "path": "/contracts"},
        {"key": "deals", "label": "Deals", "icon": "Briefcase", "path": "/deals"},
    ],
    
    CanonicalRole.FINANCE.value: [
        {"key": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/dashboard"},
        {"key": "commissions", "label": "Commissions", "icon": "DollarSign", "path": "/commissions"},
        {"key": "contracts", "label": "Contracts", "icon": "FileText", "path": "/contracts"},
        {"key": "reports", "label": "Reports", "icon": "BarChart3", "path": "/reports"},
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_canonical_role(legacy_role: str) -> str:
    """Convert legacy role to canonical role"""
    if not legacy_role:
        return CanonicalRole.SALES_AGENT.value
    if legacy_role in ROLE_METADATA:
        return legacy_role
    return LEGACY_ROLE_MAPPING.get(legacy_role, CanonicalRole.SALES_AGENT.value)


def get_role_scope(role: str) -> str:
    """Get default scope for a role"""
    metadata = ROLE_METADATA.get(role, {})
    return metadata.get("default_scope", PermissionScope.SELF).value


def get_permission_scope(role: str, resource: str, action: str) -> str:
    """Get permission scope for role.resource.action"""
    canonical_role = get_canonical_role(role)
    role_permissions = PERMISSION_MATRIX.get(canonical_role, {})
    normalized_resource = RESOURCE_ALIASES.get(resource, resource)
    normalized_action = ACTION_ALIASES.get(action, action)
    permission_key = f"{normalized_resource}.{normalized_action}"
    return role_permissions.get(permission_key)


def has_permission(role: str, resource: str, action: str) -> bool:
    """Check if role has permission for resource.action"""
    return get_permission_scope(role, resource, action) is not None


def get_sidebar_menu(role: str) -> List[dict]:
    """Get sidebar menu for role"""
    canonical_role = get_canonical_role(role)
    return SIDEBAR_MENU_CONFIG.get(canonical_role, SIDEBAR_MENU_CONFIG[CanonicalRole.SALES_AGENT.value])


def is_sales_role(role: str) -> bool:
    """Check if role is sales-related (requires team)"""
    metadata = ROLE_METADATA.get(get_canonical_role(role), {})
    return metadata.get("is_sales", False)


def requires_team(role: str) -> bool:
    """Check if role requires team assignment"""
    metadata = ROLE_METADATA.get(get_canonical_role(role), {})
    return metadata.get("requires_team", False)


def get_all_roles() -> List[dict]:
    """Get all roles with metadata for UI"""
    result = []
    for role, metadata in ROLE_METADATA.items():
        result.append({
            "code": role,
            "name_vi": metadata["name_vi"],
            "name_en": metadata["name_en"],
            "description": metadata["description"],
            "level": metadata["level"],
            "is_sales": metadata["is_sales"],
            "requires_team": metadata["requires_team"],
        })
    return sorted(result, key=lambda x: x["level"])
