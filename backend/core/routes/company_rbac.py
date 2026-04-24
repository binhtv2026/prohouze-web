"""
ProHouzing Company RBAC Routes - API v2
Version: 1.0.0 (Prompt 4/20 - Multi-Company Ready)

Per-company RBAC configuration endpoints.
Allows LIMITED customization:
- Role templates (enable/disable, rename)
- Permission overrides (reduce scope only)
- Company settings (feature toggles)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from ..database import get_db
from core.dependencies import CurrentUser, get_current_user
from core.services.company_rbac import company_rbac_service
from core.models.company_config import CompanySettings, RoleTemplate, RolePermissionOverride
from config.canonical_rbac import ROLE_METADATA, has_permission as canonical_has_permission


router = APIRouter(prefix="/company-rbac", tags=["Company RBAC Configuration"])


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CompanySettingsResponse(BaseModel):
    use_team_level: bool
    use_branch_level: bool
    approval_required_contracts: bool
    approval_required_commissions: bool
    approval_required_deals: bool
    enable_commissions: bool
    enable_marketing_module: bool
    enable_hr_module: bool
    enable_legal_module: bool
    primary_color: Optional[str]
    default_locale: str


class CompanySettingsUpdate(BaseModel):
    use_team_level: Optional[bool] = None
    use_branch_level: Optional[bool] = None
    approval_required_contracts: Optional[bool] = None
    approval_required_commissions: Optional[bool] = None
    approval_required_deals: Optional[bool] = None
    enable_commissions: Optional[bool] = None
    enable_marketing_module: Optional[bool] = None
    enable_hr_module: Optional[bool] = None
    enable_legal_module: Optional[bool] = None
    primary_color: Optional[str] = None


class RoleTemplateUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    display_name: Optional[str] = None
    display_name_en: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class PermissionOverrideCreate(BaseModel):
    role_code: str
    module: str
    action: str
    scope_override: Optional[str] = None
    is_disabled: bool = False
    reason: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# COMPANY SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/settings")
async def get_company_settings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get company settings for current user's organization"""
    settings = company_rbac_service.get_company_settings(db, current_user.org_id)
    
    if not settings:
        # Create default settings
        settings = company_rbac_service.create_default_settings(db, current_user.org_id)
    
    return {
        "success": True,
        "data": {
            "use_team_level": settings.use_team_level,
            "use_branch_level": settings.use_branch_level,
            "approval_required_contracts": settings.approval_required_contracts,
            "approval_required_commissions": settings.approval_required_commissions,
            "approval_required_deals": settings.approval_required_deals,
            "enable_commissions": settings.enable_commissions,
            "enable_marketing_module": settings.enable_marketing_module,
            "enable_hr_module": settings.enable_hr_module,
            "enable_legal_module": settings.enable_legal_module,
            "primary_color": settings.primary_color,
            "default_locale": settings.default_locale,
        }
    }


@router.put("/settings")
async def update_company_settings(
    data: CompanySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Update company settings - Admin only"""
    # Check admin permission
    if not canonical_has_permission(current_user.role, "settings", "edit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    settings = company_rbac_service.get_company_settings(db, current_user.org_id)
    if not settings:
        settings = company_rbac_service.create_default_settings(db, current_user.org_id)
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(settings, field):
            setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    return {
        "success": True,
        "message": "Settings updated",
        "data": {
            "use_team_level": settings.use_team_level,
            "use_branch_level": settings.use_branch_level,
            "approval_required_contracts": settings.approval_required_contracts,
            "approval_required_commissions": settings.approval_required_commissions,
            "approval_required_deals": settings.approval_required_deals,
            "enable_commissions": settings.enable_commissions,
            "enable_marketing_module": settings.enable_marketing_module,
            "enable_hr_module": settings.enable_hr_module,
            "enable_legal_module": settings.enable_legal_module,
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ROLE TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/roles")
async def get_company_roles(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get enabled roles for company with customizations"""
    roles = company_rbac_service.get_enabled_roles(db, current_user.org_id)
    
    return {
        "success": True,
        "data": roles
    }


@router.put("/roles/{role_code}")
async def update_role_template(
    role_code: str,
    data: RoleTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update role template for company.
    
    Allows:
    - Enable/disable role
    - Rename label
    
    NOT allowed:
    - Create new roles
    """
    # Check admin permission
    if not canonical_has_permission(current_user.role, "settings", "edit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Validate role exists
    if role_code not in ROLE_METADATA:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role_code}")
    
    try:
        template = company_rbac_service.update_role_template(
            db,
            current_user.org_id,
            role_code,
            is_enabled=data.is_enabled,
            display_name=data.display_name,
            display_name_en=data.display_name_en,
            description=data.description,
            sort_order=data.sort_order
        )
        
        return {
            "success": True,
            "message": f"Role {role_code} template updated",
            "data": {
                "role_code": template.role_code,
                "is_enabled": template.is_enabled,
                "display_name": template.display_name,
                "display_name_en": template.display_name_en,
                "description": template.description,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# PERMISSION OVERRIDES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/permissions/{role_code}")
async def get_role_permissions(
    role_code: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get permissions for role with company overrides applied"""
    permissions = company_rbac_service.get_role_permissions(db, current_user.org_id, role_code)
    
    return {
        "success": True,
        "data": {
            "role": role_code,
            "permissions": permissions
        }
    }


@router.post("/permissions/override")
async def create_permission_override(
    data: PermissionOverrideCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Create permission override for company.
    
    Rules:
    - Can only REDUCE permissions (not expand)
    - Can only change SCOPE (self/team/branch/all)
    - Can disable permission entirely
    """
    # Check admin permission
    if not canonical_has_permission(current_user.role, "settings", "edit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        override = company_rbac_service.create_permission_override(
            db,
            current_user.org_id,
            data.role_code,
            data.module,
            data.action,
            scope_override=data.scope_override,
            is_disabled=data.is_disabled,
            created_by=current_user.id,
            reason=data.reason
        )
        
        return {
            "success": True,
            "message": "Permission override created",
            "data": {
                "role_code": override.role_code,
                "module": override.module,
                "action": override.action,
                "scope_override": override.scope_override,
                "is_disabled": override.is_disabled,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/permissions/override/{role_code}/{module}/{action}")
async def delete_permission_override(
    role_code: str,
    module: str,
    action: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Delete permission override (revert to canonical)"""
    # Check admin permission
    if not canonical_has_permission(current_user.role, "settings", "edit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    from sqlalchemy import select
    
    override = db.execute(
        select(RolePermissionOverride).where(
            RolePermissionOverride.org_id == current_user.org_id,
            RolePermissionOverride.role_code == role_code,
            RolePermissionOverride.module == module,
            RolePermissionOverride.action == action,
            RolePermissionOverride.deleted_at.is_(None)
        )
    ).scalar_one_or_none()
    
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")
    
    from datetime import datetime, timezone
    override.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {
        "success": True,
        "message": "Permission override deleted, reverted to canonical"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# COMPANY-AWARE RBAC CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/my-config")
async def get_my_company_rbac_config(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get current user's RBAC configuration with company customizations.
    
    Returns:
    - Role info (with custom label if set)
    - Sidebar menu (filtered by feature toggles)
    - Permissions (with overrides applied)
    """
    # Get role permissions with overrides
    permissions = company_rbac_service.get_role_permissions(db, current_user.org_id, current_user.role)
    
    # Get sidebar with feature toggles
    sidebar = company_rbac_service.get_sidebar_menu(db, current_user.org_id, current_user.role)
    
    # Get role metadata
    role_meta = ROLE_METADATA.get(current_user.role, ROLE_METADATA.get("sales_agent", {}))
    
    # Check for custom label
    from sqlalchemy import select
    template = db.execute(
        select(RoleTemplate).where(
            RoleTemplate.org_id == current_user.org_id,
            RoleTemplate.role_code == current_user.role,
            RoleTemplate.deleted_at.is_(None)
        )
    ).scalar_one_or_none()
    
    return {
        "success": True,
        "data": {
            "user_id": str(current_user.id),
            "role": current_user.role,
            "role_info": {
                "code": current_user.role,
                "name_vi": template.display_name if template and template.display_name else role_meta["name_vi"],
                "name_en": template.display_name_en if template and template.display_name_en else role_meta["name_en"],
                "description": template.description if template and template.description else role_meta["description"],
                "level": role_meta["level"],
                "is_sales": role_meta["is_sales"],
                "requires_team": role_meta["requires_team"],
                "is_customized": template is not None,
            },
            "sidebar_menu": sidebar,
            "permissions": permissions,
        }
    }
