"""
ProHouzing RBAC Configuration
Prompt 4/20 - Organization & Permission Foundation

This file is the SINGLE SOURCE OF TRUTH for:
- Organization hierarchy
- Role definitions
- Permission matrix
- Visibility scopes
"""

from enum import Enum
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

# ============================================
# ORGANIZATION HIERARCHY
# ============================================

class OrganizationType(str, Enum):
    """Organization unit types"""
    COMPANY = "company"       # Root tenant (Công ty)
    BRANCH = "branch"         # Chi nhánh
    DEPARTMENT = "department" # Phòng ban
    TEAM = "team"            # Nhóm

# Standard departments for real estate companies
STANDARD_DEPARTMENTS = [
    {"code": "management", "name": "Ban Giám đốc", "name_en": "Management"},
    {"code": "sales", "name": "Kinh doanh", "name_en": "Sales"},
    {"code": "marketing", "name": "Marketing", "name_en": "Marketing"},
    {"code": "hr", "name": "Nhân sự", "name_en": "Human Resources"},
    {"code": "finance", "name": "Tài chính", "name_en": "Finance"},
    {"code": "legal", "name": "Pháp lý", "name_en": "Legal"},
    {"code": "operations", "name": "Vận hành", "name_en": "Operations"},
    {"code": "it", "name": "Công nghệ", "name_en": "IT"},
]

# ============================================
# ROLE DEFINITIONS
# ============================================

class SystemRole(str, Enum):
    """
    System roles with default permissions.
    These are canonical roles that define permission sets.
    """
    # Executive Level
    SYSTEM_ADMIN = "system_admin"   # Full system access
    CEO = "ceo"                      # Company-wide access
    
    # Management Level
    BRANCH_DIRECTOR = "branch_director"  # Branch-wide access
    DEPARTMENT_HEAD = "department_head"  # Department-wide access
    TEAM_LEADER = "team_leader"          # Team-wide access
    
    # Staff Level
    SALES_AGENT = "sales_agent"
    MARKETING_STAFF = "marketing_staff"
    CONTENT_CREATOR = "content_creator"
    HR_STAFF = "hr_staff"
    FINANCE_STAFF = "finance_staff"
    LEGAL_STAFF = "legal_staff"
    
    # External
    COLLABORATOR = "collaborator"   # CTV - limited access

# Role metadata
ROLE_CONFIG: Dict[str, Dict[str, Any]] = {
    SystemRole.SYSTEM_ADMIN.value: {
        "name": "System Admin",
        "name_vi": "Quản trị hệ thống",
        "level": 0,
        "description": "Toàn quyền quản lý hệ thống, cấu hình và người dùng",
        "default_dashboard": "/dashboard",
        "can_manage_roles": True,
        "can_manage_users": True,
        "can_view_all_data": True,
    },
    SystemRole.CEO.value: {
        "name": "CEO / Director",
        "name_vi": "Giám đốc / CEO",
        "level": 1,
        "description": "Xem báo cáo toàn công ty, phê duyệt cấp cao",
        "default_dashboard": "/dashboard",
        "can_manage_roles": False,
        "can_manage_users": True,
        "can_view_all_data": True,
    },
    SystemRole.BRANCH_DIRECTOR.value: {
        "name": "Branch Director",
        "name_vi": "Giám đốc Chi nhánh",
        "level": 2,
        "description": "Quản lý toàn bộ chi nhánh, duyệt KPI, phân bổ lead",
        "default_dashboard": "/dashboard",
        "can_manage_roles": False,
        "can_manage_users": True,  # Within branch
        "can_view_all_data": False,  # Branch scope only
    },
    SystemRole.DEPARTMENT_HEAD.value: {
        "name": "Department Head",
        "name_vi": "Trưởng phòng",
        "level": 3,
        "description": "Quản lý phòng ban, phê duyệt nghỉ phép, báo cáo",
        "default_dashboard": "/dashboard",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,  # Department scope
    },
    SystemRole.TEAM_LEADER.value: {
        "name": "Team Leader",
        "name_vi": "Trưởng nhóm",
        "level": 4,
        "description": "Quản lý nhóm, assign task, theo dõi tiến độ",
        "default_dashboard": "/sales",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,  # Team scope
    },
    SystemRole.SALES_AGENT.value: {
        "name": "Sales Agent",
        "name_vi": "Nhân viên Kinh doanh",
        "level": 5,
        "description": "Chăm sóc lead, tạo deal, theo dõi pipeline cá nhân",
        "default_dashboard": "/crm/leads",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,  # Self scope
    },
    SystemRole.MARKETING_STAFF.value: {
        "name": "Marketing Staff",
        "name_vi": "Nhân viên Marketing",
        "level": 5,
        "description": "Quản lý kênh, tạo nội dung, chạy chiến dịch",
        "default_dashboard": "/marketing",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,
    },
    SystemRole.CONTENT_CREATOR.value: {
        "name": "Content Creator",
        "name_vi": "Content Creator",
        "level": 5,
        "description": "Tạo nội dung cho website và social media",
        "default_dashboard": "/cms",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,
    },
    SystemRole.HR_STAFF.value: {
        "name": "HR Staff",
        "name_vi": "Nhân viên Nhân sự",
        "level": 5,
        "description": "Quản lý tuyển dụng, hồ sơ nhân viên, đào tạo",
        "default_dashboard": "/hr",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,
    },
    SystemRole.FINANCE_STAFF.value: {
        "name": "Finance Staff",
        "name_vi": "Nhân viên Tài chính",
        "level": 5,
        "description": "Quản lý hoa hồng, công nợ, báo cáo tài chính",
        "default_dashboard": "/finance",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,
    },
    SystemRole.LEGAL_STAFF.value: {
        "name": "Legal Staff",
        "name_vi": "Nhân viên Pháp lý",
        "level": 5,
        "description": "Quản lý hợp đồng, giấy phép, tuân thủ",
        "default_dashboard": "/legal",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,
    },
    SystemRole.COLLABORATOR.value: {
        "name": "Collaborator",
        "name_vi": "Cộng tác viên (CTV)",
        "level": 6,
        "description": "Giới thiệu khách hàng, theo dõi hoa hồng cá nhân",
        "default_dashboard": "/ctv",
        "can_manage_roles": False,
        "can_manage_users": False,
        "can_view_all_data": False,
    },
}

# ============================================
# PERMISSION DEFINITIONS
# ============================================

class PermissionAction(str, Enum):
    """Actions that can be performed on resources"""
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"
    ASSIGN = "assign"
    APPROVE = "approve"
    EXPORT = "export"
    IMPORT = "import"

class PermissionScope(str, Enum):
    """Scope of data access"""
    NONE = "none"       # No access
    SELF = "self"       # Own records only
    TEAM = "team"       # Team records
    DEPARTMENT = "department"  # Department records
    BRANCH = "branch"   # Branch records
    ALL = "all"         # All records (company-wide)

# Resource definitions
RESOURCES = [
    "lead", "customer", "deal", "booking", "contract",
    "task", "activity", "project", "product",
    "content", "campaign", "channel", "template",
    "user", "role", "branch", "team",
    "commission", "kpi", "report",
    "approval", "notification", "setting"
]

# ============================================
# PERMISSION MATRIX
# ============================================

# Default permission matrix: {role: {resource.action: scope}}
PERMISSION_MATRIX: Dict[str, Dict[str, str]] = {
    # ========== SYSTEM ADMIN ==========
    SystemRole.SYSTEM_ADMIN.value: {
        # Full access to everything
        **{f"{r}.{a.value}": PermissionScope.ALL.value 
           for r in RESOURCES 
           for a in PermissionAction}
    },
    
    # ========== CEO ==========
    SystemRole.CEO.value: {
        # Lead Management
        "lead.view": PermissionScope.ALL.value,
        "lead.create": PermissionScope.ALL.value,
        "lead.edit": PermissionScope.ALL.value,
        "lead.delete": PermissionScope.NONE.value,  # Preserve data
        "lead.assign": PermissionScope.ALL.value,
        "lead.approve": PermissionScope.ALL.value,
        "lead.export": PermissionScope.ALL.value,
        
        # Customer Management
        "customer.view": PermissionScope.ALL.value,
        "customer.create": PermissionScope.ALL.value,
        "customer.edit": PermissionScope.ALL.value,
        "customer.delete": PermissionScope.NONE.value,
        "customer.export": PermissionScope.ALL.value,
        
        # Deal/Booking/Contract
        "deal.view": PermissionScope.ALL.value,
        "deal.create": PermissionScope.ALL.value,
        "deal.edit": PermissionScope.ALL.value,
        "deal.approve": PermissionScope.ALL.value,
        "booking.view": PermissionScope.ALL.value,
        "booking.approve": PermissionScope.ALL.value,
        "contract.view": PermissionScope.ALL.value,
        "contract.approve": PermissionScope.ALL.value,
        
        # Reports & KPI
        "report.view": PermissionScope.ALL.value,
        "report.export": PermissionScope.ALL.value,
        "kpi.view": PermissionScope.ALL.value,
        "kpi.edit": PermissionScope.ALL.value,
        
        # User Management
        "user.view": PermissionScope.ALL.value,
        "user.create": PermissionScope.ALL.value,
        "user.edit": PermissionScope.ALL.value,
        "user.delete": PermissionScope.NONE.value,
        
        # Settings (limited)
        "setting.view": PermissionScope.ALL.value,
        "setting.edit": PermissionScope.NONE.value,
        
        # Approvals
        "approval.view": PermissionScope.ALL.value,
        "approval.approve": PermissionScope.ALL.value,
        
        # Default all others
        "task.view": PermissionScope.ALL.value,
        "activity.view": PermissionScope.ALL.value,
        "project.view": PermissionScope.ALL.value,
        "content.view": PermissionScope.ALL.value,
        "campaign.view": PermissionScope.ALL.value,
        "commission.view": PermissionScope.ALL.value,
        "commission.approve": PermissionScope.ALL.value,
    },
    
    # ========== BRANCH DIRECTOR ==========
    SystemRole.BRANCH_DIRECTOR.value: {
        # Lead - Branch scope
        "lead.view": PermissionScope.BRANCH.value,
        "lead.create": PermissionScope.BRANCH.value,
        "lead.edit": PermissionScope.BRANCH.value,
        "lead.delete": PermissionScope.NONE.value,
        "lead.assign": PermissionScope.BRANCH.value,
        "lead.export": PermissionScope.BRANCH.value,
        
        # Customer - Branch scope
        "customer.view": PermissionScope.BRANCH.value,
        "customer.create": PermissionScope.BRANCH.value,
        "customer.edit": PermissionScope.BRANCH.value,
        "customer.export": PermissionScope.BRANCH.value,
        
        # Deal/Booking
        "deal.view": PermissionScope.BRANCH.value,
        "deal.create": PermissionScope.BRANCH.value,
        "deal.edit": PermissionScope.BRANCH.value,
        "deal.approve": PermissionScope.BRANCH.value,
        "booking.view": PermissionScope.BRANCH.value,
        "booking.approve": PermissionScope.BRANCH.value,
        
        # User Management - Branch only
        "user.view": PermissionScope.BRANCH.value,
        "user.create": PermissionScope.BRANCH.value,
        "user.edit": PermissionScope.BRANCH.value,
        
        # KPI & Reports
        "kpi.view": PermissionScope.BRANCH.value,
        "kpi.edit": PermissionScope.BRANCH.value,
        "report.view": PermissionScope.BRANCH.value,
        "report.export": PermissionScope.BRANCH.value,
        
        # Tasks
        "task.view": PermissionScope.BRANCH.value,
        "task.create": PermissionScope.BRANCH.value,
        "task.edit": PermissionScope.BRANCH.value,
        "task.assign": PermissionScope.BRANCH.value,
        
        # Projects - View all (inventory)
        "project.view": PermissionScope.ALL.value,
        "product.view": PermissionScope.ALL.value,
        
        # Commission
        "commission.view": PermissionScope.BRANCH.value,
        "commission.approve": PermissionScope.BRANCH.value,
    },
    
    # ========== TEAM LEADER ==========
    SystemRole.TEAM_LEADER.value: {
        # Lead - Team scope
        "lead.view": PermissionScope.TEAM.value,
        "lead.create": PermissionScope.TEAM.value,
        "lead.edit": PermissionScope.TEAM.value,
        "lead.assign": PermissionScope.TEAM.value,
        "lead.export": PermissionScope.TEAM.value,
        
        # Customer - Team scope
        "customer.view": PermissionScope.TEAM.value,
        "customer.create": PermissionScope.TEAM.value,
        "customer.edit": PermissionScope.TEAM.value,
        
        # Deal
        "deal.view": PermissionScope.TEAM.value,
        "deal.create": PermissionScope.TEAM.value,
        "deal.edit": PermissionScope.TEAM.value,
        
        # Tasks
        "task.view": PermissionScope.TEAM.value,
        "task.create": PermissionScope.TEAM.value,
        "task.edit": PermissionScope.TEAM.value,
        "task.assign": PermissionScope.TEAM.value,
        
        # KPI
        "kpi.view": PermissionScope.TEAM.value,
        
        # Projects
        "project.view": PermissionScope.ALL.value,
        "product.view": PermissionScope.ALL.value,
    },
    
    # ========== SALES AGENT ==========
    SystemRole.SALES_AGENT.value: {
        # Lead - Self scope
        "lead.view": PermissionScope.SELF.value,
        "lead.create": PermissionScope.SELF.value,
        "lead.edit": PermissionScope.SELF.value,
        "lead.delete": PermissionScope.NONE.value,
        "lead.assign": PermissionScope.NONE.value,
        "lead.export": PermissionScope.SELF.value,
        
        # Customer - Self scope
        "customer.view": PermissionScope.SELF.value,
        "customer.create": PermissionScope.SELF.value,
        "customer.edit": PermissionScope.SELF.value,
        
        # Deal - Self scope
        "deal.view": PermissionScope.SELF.value,
        "deal.create": PermissionScope.SELF.value,
        "deal.edit": PermissionScope.SELF.value,
        
        # Tasks - Self
        "task.view": PermissionScope.SELF.value,
        "task.create": PermissionScope.SELF.value,
        "task.edit": PermissionScope.SELF.value,
        
        # Activity - Self
        "activity.view": PermissionScope.SELF.value,
        "activity.create": PermissionScope.SELF.value,
        
        # KPI - Self only
        "kpi.view": PermissionScope.SELF.value,
        
        # Projects - View all (for selling)
        "project.view": PermissionScope.ALL.value,
        "product.view": PermissionScope.ALL.value,
        
        # Commission - Self
        "commission.view": PermissionScope.SELF.value,
    },
    
    # ========== MARKETING STAFF ==========
    SystemRole.MARKETING_STAFF.value: {
        # Lead - View for analytics
        "lead.view": PermissionScope.ALL.value,
        "lead.create": PermissionScope.ALL.value,
        "lead.edit": PermissionScope.NONE.value,
        
        # Content - Full access
        "content.view": PermissionScope.ALL.value,
        "content.create": PermissionScope.ALL.value,
        "content.edit": PermissionScope.SELF.value,
        "content.delete": PermissionScope.SELF.value,
        
        # Campaign - Full access
        "campaign.view": PermissionScope.ALL.value,
        "campaign.create": PermissionScope.ALL.value,
        "campaign.edit": PermissionScope.SELF.value,
        
        # Channel - Full access
        "channel.view": PermissionScope.ALL.value,
        "channel.create": PermissionScope.ALL.value,
        "channel.edit": PermissionScope.ALL.value,
        
        # Template
        "template.view": PermissionScope.ALL.value,
        "template.create": PermissionScope.ALL.value,
        "template.edit": PermissionScope.SELF.value,
        
        # Projects
        "project.view": PermissionScope.ALL.value,
        
        # Reports
        "report.view": PermissionScope.ALL.value,
    },
    
    # ========== CONTENT CREATOR ==========
    SystemRole.CONTENT_CREATOR.value: {
        # Content - Main focus
        "content.view": PermissionScope.ALL.value,
        "content.create": PermissionScope.ALL.value,
        "content.edit": PermissionScope.SELF.value,
        "content.delete": PermissionScope.SELF.value,
        
        # Projects - For content
        "project.view": PermissionScope.ALL.value,
        
        # Tasks - Self
        "task.view": PermissionScope.SELF.value,
        "task.create": PermissionScope.SELF.value,
        "task.edit": PermissionScope.SELF.value,
    },
    
    # ========== HR STAFF ==========
    SystemRole.HR_STAFF.value: {
        # User Management
        "user.view": PermissionScope.ALL.value,
        "user.create": PermissionScope.ALL.value,
        "user.edit": PermissionScope.ALL.value,
        
        # Team/Branch view
        "branch.view": PermissionScope.ALL.value,
        "team.view": PermissionScope.ALL.value,
        
        # Tasks - Self
        "task.view": PermissionScope.SELF.value,
        "task.create": PermissionScope.SELF.value,
    },
    
    # ========== FINANCE STAFF ==========
    SystemRole.FINANCE_STAFF.value: {
        # Commission - Full access
        "commission.view": PermissionScope.ALL.value,
        "commission.create": PermissionScope.ALL.value,
        "commission.edit": PermissionScope.ALL.value,
        
        # Deal/Contract - View for finance
        "deal.view": PermissionScope.ALL.value,
        "contract.view": PermissionScope.ALL.value,
        
        # Reports
        "report.view": PermissionScope.ALL.value,
        "report.export": PermissionScope.ALL.value,
    },
    
    # ========== LEGAL STAFF ==========
    SystemRole.LEGAL_STAFF.value: {
        # Contract - Full access
        "contract.view": PermissionScope.ALL.value,
        "contract.create": PermissionScope.ALL.value,
        "contract.edit": PermissionScope.ALL.value,
        
        # Project - For legal docs
        "project.view": PermissionScope.ALL.value,
        
        # Approval
        "approval.view": PermissionScope.ALL.value,
    },
    
    # ========== COLLABORATOR ==========
    SystemRole.COLLABORATOR.value: {
        # Lead - Create only (referrals)
        "lead.view": PermissionScope.SELF.value,  # Only leads they referred
        "lead.create": PermissionScope.SELF.value,
        
        # Commission - Self only
        "commission.view": PermissionScope.SELF.value,
        
        # Projects - View for referral
        "project.view": PermissionScope.ALL.value,
        "product.view": PermissionScope.ALL.value,
    },
}

# ============================================
# ROLE MAPPING (Legacy -> New)
# ============================================

# Map old roles to new system roles
LEGACY_ROLE_MAPPING = {
    "bod": SystemRole.CEO.value,
    "admin": SystemRole.SYSTEM_ADMIN.value,
    "manager": SystemRole.BRANCH_DIRECTOR.value,
    "sales": SystemRole.SALES_AGENT.value,
    "marketing": SystemRole.MARKETING_STAFF.value,
    "content": SystemRole.CONTENT_CREATOR.value,
    "hr": SystemRole.HR_STAFF.value,
}

# ============================================
# NAVIGATION VISIBILITY
# ============================================

# Map menu items to required permissions
MENU_PERMISSIONS = {
    "/dashboard": "report.view",
    "/crm/leads": "lead.view",
    "/crm/customers": "customer.view",
    "/crm/collaborators": "user.view",  # CTV management
    "/sales": "deal.view",
    "/sales/deals": "deal.view",
    "/sales/bookings": "booking.view",
    "/sales/contracts": "contract.view",
    "/sales/kpi": "kpi.view",
    "/inventory": "project.view",
    "/inventory/projects": "project.view",
    "/inventory/products": "product.view",
    "/finance": "commission.view",
    "/finance/commission": "commission.view",
    "/hr": "user.view",
    "/hr/organization": "branch.view",
    "/work/tasks": "task.view",
    "/marketing": "campaign.view",
    "/marketing/channels": "channel.view",
    "/marketing/content": "content.view",
    "/analytics/reports": "report.view",
    "/settings": "setting.view",
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_role_permissions(role: str) -> Dict[str, str]:
    """Get all permissions for a role"""
    return PERMISSION_MATRIX.get(role, {})

def has_permission(role: str, resource: str, action: str) -> bool:
    """Check if role has permission for action on resource"""
    perm_key = f"{resource}.{action}"
    perms = get_role_permissions(role)
    scope = perms.get(perm_key, PermissionScope.NONE.value)
    return scope != PermissionScope.NONE.value

def get_permission_scope(role: str, resource: str, action: str) -> str:
    """Get the scope of permission for role on resource.action"""
    perm_key = f"{resource}.{action}"
    perms = get_role_permissions(role)
    return perms.get(perm_key, PermissionScope.NONE.value)

def get_role_config(role: str) -> Dict[str, Any]:
    """Get role configuration/metadata"""
    return ROLE_CONFIG.get(role, {})

def get_legacy_role(new_role: str) -> Optional[str]:
    """Get legacy role from new role (reverse mapping)"""
    for legacy, new in LEGACY_ROLE_MAPPING.items():
        if new == new_role:
            return legacy
    return None

def can_access_menu(role: str, path: str) -> bool:
    """Check if role can access menu path"""
    perm_key = MENU_PERMISSIONS.get(path)
    if not perm_key:
        return True  # No permission defined = public
    
    resource, action = perm_key.split(".")
    return has_permission(role, resource, action)

# ============================================
# MODELS FOR API
# ============================================

class PermissionCheck(BaseModel):
    """Request model for permission check"""
    resource: str
    action: str
    
class PermissionResponse(BaseModel):
    """Response model for permission check"""
    allowed: bool
    scope: str
    
class RoleResponse(BaseModel):
    """Response model for role info"""
    code: str
    name: str
    name_vi: str
    level: int
    description: str
    default_dashboard: str
    permissions: Dict[str, str] = {}
