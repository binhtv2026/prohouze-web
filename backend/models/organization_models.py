"""
ProHouzing Organization & User Models
Prompt 4/20 - Organization & Permission Foundation

Database models for:
- Organizations (Company, Branch, Department, Team)
- Enhanced User model with organization links
- Role assignments
- Ownership tracking
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# ============================================
# ORGANIZATION MODELS
# ============================================

class OrganizationBase(BaseModel):
    """Base model for all organization units"""
    code: str = Field(..., description="Unique code within parent")
    name: str = Field(..., description="Vietnamese name")
    name_en: Optional[str] = Field(None, description="English name")
    description: Optional[str] = None
    is_active: bool = True
    metadata: Dict[str, Any] = {}

class CompanyCreate(OrganizationBase):
    """Company (tenant) creation model"""
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_code: Optional[str] = None
    website: Optional[str] = None

class CompanyResponse(CompanyCreate):
    """Company response model"""
    id: str
    created_at: str
    updated_at: Optional[str] = None
    branch_count: int = 0
    user_count: int = 0

class BranchCreate(OrganizationBase):
    """Branch (chi nhánh) creation model"""
    company_id: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    manager_id: Optional[str] = None  # User who manages this branch
    region: Optional[str] = None  # Vùng miền

class BranchResponse(BranchCreate):
    """Branch response model"""
    id: str
    company_id: str
    manager_name: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    department_count: int = 0
    user_count: int = 0

class DepartmentCreate(OrganizationBase):
    """Department (phòng ban) creation model"""
    branch_id: str
    head_id: Optional[str] = None  # Department head user ID

class DepartmentResponse(DepartmentCreate):
    """Department response model"""
    id: str
    branch_id: str
    branch_name: Optional[str] = None
    head_name: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    team_count: int = 0
    user_count: int = 0

class TeamCreate(OrganizationBase):
    """Team (nhóm) creation model"""
    department_id: str
    leader_id: Optional[str] = None  # Team leader user ID

class TeamResponse(TeamCreate):
    """Team response model"""
    id: str
    department_id: str
    department_name: Optional[str] = None
    leader_name: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    user_count: int = 0

# ============================================
# ENHANCED USER MODEL
# ============================================

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"  # Awaiting activation

class UserCreateEnhanced(BaseModel):
    """Enhanced user creation model with organization links"""
    # Basic Info
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Organization Links
    company_id: Optional[str] = None
    branch_id: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    
    # Role & Position
    role: str = "sales_agent"  # SystemRole
    position_title: Optional[str] = None  # Job title (Chức danh)
    
    # Reporting
    reports_to: Optional[str] = None  # Manager user ID
    
    # Work Info
    specializations: List[str] = []  # Project expertise
    regions: List[str] = []  # Responsible regions
    
    # Employment
    employee_code: Optional[str] = None
    join_date: Optional[str] = None
    
    # Status
    status: UserStatus = UserStatus.ACTIVE

class UserResponseEnhanced(BaseModel):
    """Enhanced user response model"""
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Organization
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    
    # Role & Position
    role: str
    role_name: Optional[str] = None
    position_title: Optional[str] = None
    
    # Reporting
    reports_to: Optional[str] = None
    reports_to_name: Optional[str] = None
    direct_reports: List[str] = []  # IDs of users reporting to this user
    
    # Work Info
    specializations: List[str] = []
    regions: List[str] = []
    
    # Employment
    employee_code: Optional[str] = None
    join_date: Optional[str] = None
    
    # Status & Metrics
    status: UserStatus = UserStatus.ACTIVE
    is_active: bool = True
    created_at: str = ""
    updated_at: Optional[str] = None
    last_login: Optional[str] = None
    
    # Performance (calculated)
    performance_score: float = 0
    current_workload: int = 0

class UserUpdateRequest(BaseModel):
    """User update request model"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Organization changes (require permission)
    branch_id: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    
    # Role change (admin only)
    role: Optional[str] = None
    position_title: Optional[str] = None
    
    # Reporting change
    reports_to: Optional[str] = None
    
    # Work info
    specializations: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    
    # Status
    status: Optional[UserStatus] = None

# ============================================
# ROLE ASSIGNMENT MODEL
# ============================================

class RoleAssignment(BaseModel):
    """Role assignment model for audit trail"""
    id: str
    user_id: str
    role: str
    assigned_by: str
    assigned_at: str
    previous_role: Optional[str] = None
    reason: Optional[str] = None
    effective_from: Optional[str] = None
    effective_until: Optional[str] = None  # For temporary assignments

# ============================================
# OWNERSHIP TRACKING MODELS
# ============================================

class OwnershipTransfer(BaseModel):
    """Track ownership transfers for audit"""
    id: str
    entity_type: str  # lead, customer, deal, etc.
    entity_id: str
    from_user_id: Optional[str] = None
    to_user_id: str
    transferred_by: str  # Who made the transfer
    transferred_at: str
    reason: Optional[str] = None
    notes: Optional[str] = None

class OwnershipHistory(BaseModel):
    """Ownership history for an entity"""
    entity_type: str
    entity_id: str
    current_owner_id: str
    current_owner_name: Optional[str] = None
    transfers: List[OwnershipTransfer] = []

# ============================================
# APPROVAL FOUNDATION MODELS
# ============================================

class ApprovalType(str, Enum):
    CONTENT = "content"
    COMMISSION = "commission"
    CONTRACT = "contract"
    LEAVE = "leave"
    EXPENSE = "expense"
    DEAL = "deal"
    CUSTOM = "custom"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"
    CANCELLED = "cancelled"

class ApprovalStep(BaseModel):
    """Single step in approval workflow"""
    step_number: int
    approver_role: str  # Required role to approve
    approver_id: Optional[str] = None  # Specific approver (if assigned)
    status: ApprovalStatus = ApprovalStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    comment: Optional[str] = None

class ApprovalRequest(BaseModel):
    """Approval request model"""
    id: str
    type: ApprovalType
    entity_type: str  # What is being approved
    entity_id: str
    
    # Requestor
    requested_by: str
    requested_at: str
    
    # Workflow
    steps: List[ApprovalStep] = []
    current_step: int = 0
    
    # Status
    status: ApprovalStatus = ApprovalStatus.PENDING
    
    # Details
    title: str
    description: Optional[str] = None
    data: Dict[str, Any] = {}  # Entity-specific data
    
    # Resolution
    final_approved_by: Optional[str] = None
    final_approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None

class ApprovalWorkflowConfig(BaseModel):
    """Configuration for approval workflow"""
    id: str
    name: str
    type: ApprovalType
    entity_types: List[str]  # Which entities this applies to
    
    # Steps configuration
    steps: List[Dict[str, Any]]  # [{role: "manager", required: True}, ...]
    
    # Auto-approval conditions
    auto_approve_conditions: Dict[str, Any] = {}
    
    # Settings
    is_active: bool = True
    allow_skip: bool = False
    notify_on_pending: bool = True
    notify_on_complete: bool = True
    
    created_at: str
    created_by: str

# ============================================
# PERMISSION CHECK MODELS
# ============================================

class PermissionCheckRequest(BaseModel):
    """Request to check permission"""
    resource: str
    action: str
    entity_id: Optional[str] = None  # For scope checking

class PermissionCheckResponse(BaseModel):
    """Response for permission check"""
    allowed: bool
    scope: str
    reason: Optional[str] = None

class BulkPermissionCheck(BaseModel):
    """Check multiple permissions at once"""
    checks: List[PermissionCheckRequest]

class BulkPermissionResponse(BaseModel):
    """Response for bulk permission check"""
    results: Dict[str, PermissionCheckResponse]  # key = resource.action
