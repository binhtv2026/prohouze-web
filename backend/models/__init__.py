"""
ProHouzing Models
"""

from .organization_models import (
    # Organization
    OrganizationBase,
    CompanyCreate, CompanyResponse,
    BranchCreate, BranchResponse,
    DepartmentCreate, DepartmentResponse,
    TeamCreate, TeamResponse,
    
    # User
    UserStatus,
    UserCreateEnhanced, UserResponseEnhanced, UserUpdateRequest,
    
    # Role & Ownership
    RoleAssignment,
    OwnershipTransfer, OwnershipHistory,
    
    # Approval
    ApprovalType, ApprovalStatus,
    ApprovalStep, ApprovalRequest, ApprovalWorkflowConfig,
    
    # Permission
    PermissionCheckRequest, PermissionCheckResponse,
    BulkPermissionCheck, BulkPermissionResponse,
)

__all__ = [
    # Organization
    "OrganizationBase",
    "CompanyCreate", "CompanyResponse",
    "BranchCreate", "BranchResponse",
    "DepartmentCreate", "DepartmentResponse",
    "TeamCreate", "TeamResponse",
    
    # User
    "UserStatus",
    "UserCreateEnhanced", "UserResponseEnhanced", "UserUpdateRequest",
    
    # Role & Ownership
    "RoleAssignment",
    "OwnershipTransfer", "OwnershipHistory",
    
    # Approval
    "ApprovalType", "ApprovalStatus",
    "ApprovalStep", "ApprovalRequest", "ApprovalWorkflowConfig",
    
    # Permission
    "PermissionCheckRequest", "PermissionCheckResponse",
    "BulkPermissionCheck", "BulkPermissionResponse",
]
