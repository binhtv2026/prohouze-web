"""
ProHouzing RBAC Routes - API v2
Version: 2.0.0 (Prompt 4/20)

RBAC configuration endpoints for frontend.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from ..database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from config.canonical_rbac import (
    CanonicalRole,
    ROLE_METADATA,
    PERMISSION_MATRIX,
    SIDEBAR_MENU_CONFIG,
    LEGACY_ROLE_MAPPING,
    get_canonical_role,
    get_sidebar_menu,
    get_all_roles,
    get_permission_scope,
    has_permission,
)


router = APIRouter(prefix="/rbac", tags=["RBAC Configuration"])


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class RoleInfo(BaseModel):
    code: str
    name_vi: str
    name_en: str
    description: str
    level: int
    is_sales: bool
    requires_team: bool


class MenuItem(BaseModel):
    key: str
    label: str
    icon: str
    path: str


class UserRBACInfo(BaseModel):
    user_id: UUID
    role: str
    role_info: RoleInfo
    sidebar_menu: List[MenuItem]
    permissions: dict


class APIResponse(BaseModel):
    success: bool = True
    data: dict = None
    message: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/roles")
async def list_roles(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get all available roles with metadata.
    Used in user management UI.
    """
    return {
        "success": True,
        "data": get_all_roles()
    }


@router.get("/my-config")
async def get_my_rbac_config(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get current user's RBAC configuration.
    Returns role info, sidebar menu, and permissions.
    """
    # Get canonical role (handle legacy roles)
    role = current_user.role
    canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
    
    # Get role metadata
    role_meta = ROLE_METADATA.get(canonical_role, ROLE_METADATA[CanonicalRole.SALES_AGENT.value])
    
    # Get sidebar menu
    sidebar = get_sidebar_menu(canonical_role)
    
    # Get permissions
    permissions = PERMISSION_MATRIX.get(canonical_role, PERMISSION_MATRIX[CanonicalRole.SALES_AGENT.value])
    
    return {
        "success": True,
        "data": {
            "user_id": str(current_user.id),
            "role": canonical_role,
            "role_info": {
                "code": canonical_role,
                "name_vi": role_meta["name_vi"],
                "name_en": role_meta["name_en"],
                "description": role_meta["description"],
                "level": role_meta["level"],
                "is_sales": role_meta["is_sales"],
                "requires_team": role_meta["requires_team"],
            },
            "sidebar_menu": sidebar,
            "permissions": permissions,
        }
    }


@router.get("/check-permission")
async def check_permission(
    resource: str,
    action: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Check if current user has permission for resource.action.
    Returns scope if permitted, null if denied.
    """
    role = current_user.role
    canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
    
    scope = get_permission_scope(canonical_role, resource, action)
    
    return {
        "success": True,
        "data": {
            "resource": resource,
            "action": action,
            "permitted": scope is not None,
            "scope": scope,
        }
    }


@router.get("/permission-matrix")
async def get_permission_matrix(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get full permission matrix.
    Only for admin/system_admin roles.
    """
    role = current_user.role
    canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
    
    # Only admin can see full matrix
    if canonical_role not in [CanonicalRole.SYSTEM_ADMIN.value, CanonicalRole.CEO.value, "admin", "bod"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return {
        "success": True,
        "data": PERMISSION_MATRIX
    }


@router.get("/sidebar-menu/{role}")
async def get_sidebar_for_role(
    role: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get sidebar menu for a specific role.
    Used in admin UI for role configuration preview.
    """
    canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
    sidebar = get_sidebar_menu(canonical_role)
    
    return {
        "success": True,
        "data": {
            "role": canonical_role,
            "menu": sidebar
        }
    }


@router.get("/legacy-mapping")
async def get_legacy_role_mapping(
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get legacy role to canonical role mapping.
    Used for migration reference.
    """
    return {
        "success": True,
        "data": LEGACY_ROLE_MAPPING
    }
