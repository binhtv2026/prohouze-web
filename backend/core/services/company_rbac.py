"""
ProHouzing Company RBAC Service
Version: 1.0.0 (Prompt 4/20 - Multi-Company Ready)

Per-company RBAC resolution with:
- Default from canonical_rbac.py
- Override from company config
- 80% default, 20% flexible

NO complex custom roles or permissions.
"""

from typing import Optional, Dict, List, Any
from uuid import UUID
from functools import lru_cache

from sqlalchemy.orm import Session
from sqlalchemy import select

from core.models.company_config import (
    CompanySettings,
    RoleTemplate,
    RolePermissionOverride,
)
from config.canonical_rbac import (
    CanonicalRole,
    PERMISSION_MATRIX,
    ROLE_METADATA,
    SIDEBAR_MENU_CONFIG,
    get_canonical_role,
    get_permission_scope as canonical_get_permission_scope,
    has_permission as canonical_has_permission,
)


class CompanyRBACService:
    """
    Company-aware RBAC service.
    
    Resolution order:
    1. Check RolePermissionOverride for company
    2. If no override, use canonical_rbac.py
    3. Apply CompanySettings restrictions
    """
    
    @staticmethod
    def get_company_settings(db: Session, org_id: UUID) -> Optional[CompanySettings]:
        """Get company settings, create default if not exists"""
        settings = db.execute(
            select(CompanySettings).where(
                CompanySettings.org_id == org_id,
                CompanySettings.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        return settings
    
    @staticmethod
    def get_enabled_roles(db: Session, org_id: UUID) -> List[Dict[str, Any]]:
        """
        Get enabled roles for a company.
        
        Returns canonical roles with company customizations (label, enabled status).
        """
        # Get all role templates for this org
        templates = db.execute(
            select(RoleTemplate).where(
                RoleTemplate.org_id == org_id,
                RoleTemplate.deleted_at.is_(None)
            )
        ).scalars().all()
        
        template_map = {t.role_code: t for t in templates}
        
        # Build role list from canonical with overrides
        roles = []
        for role_code, metadata in ROLE_METADATA.items():
            template = template_map.get(role_code)
            
            # Check if disabled by template
            if template and not template.is_enabled:
                continue
            
            roles.append({
                "code": role_code,
                "name_vi": template.display_name if template and template.display_name else metadata["name_vi"],
                "name_en": template.display_name_en if template and template.display_name_en else metadata["name_en"],
                "description": template.description if template and template.description else metadata["description"],
                "level": metadata["level"],
                "is_sales": metadata["is_sales"],
                "requires_team": metadata["requires_team"],
                "is_customized": template is not None,
                "sort_order": template.sort_order if template else metadata["level"],
            })
        
        return sorted(roles, key=lambda x: x["sort_order"])
    
    @staticmethod
    def get_permission_scope(
        db: Session,
        org_id: UUID,
        role: str,
        resource: str,
        action: str
    ) -> Optional[str]:
        """
        Get permission scope for role.resource.action with company override.
        
        Resolution:
        1. Check override table
        2. If disabled -> return None
        3. If scope_override -> return override
        4. Else -> return canonical
        """
        # Normalize role to canonical
        canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
        
        # Check for override
        override = db.execute(
            select(RolePermissionOverride).where(
                RolePermissionOverride.org_id == org_id,
                RolePermissionOverride.role_code == canonical_role,
                RolePermissionOverride.module == resource,
                RolePermissionOverride.action == action,
                RolePermissionOverride.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if override:
            # Permission disabled by override
            if override.is_disabled:
                return None
            # Scope overridden
            if override.scope_override:
                return override.scope_override
        
        # No override, use canonical
        return canonical_get_permission_scope(canonical_role, resource, action)
    
    @staticmethod
    def has_permission(
        db: Session,
        org_id: UUID,
        role: str,
        resource: str,
        action: str
    ) -> bool:
        """Check if role has permission with company override"""
        scope = CompanyRBACService.get_permission_scope(db, org_id, role, resource, action)
        return scope is not None
    
    @staticmethod
    def get_role_permissions(
        db: Session,
        org_id: UUID,
        role: str
    ) -> Dict[str, str]:
        """
        Get all permissions for a role with company overrides applied.
        
        Returns dict of "resource.action": "scope"
        """
        # Normalize role
        canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
        
        # Start with canonical permissions
        base_permissions = PERMISSION_MATRIX.get(canonical_role, {}).copy()
        
        # Get all overrides for this role and org
        overrides = db.execute(
            select(RolePermissionOverride).where(
                RolePermissionOverride.org_id == org_id,
                RolePermissionOverride.role_code == canonical_role,
                RolePermissionOverride.deleted_at.is_(None)
            )
        ).scalars().all()
        
        # Apply overrides
        for override in overrides:
            perm_key = f"{override.module}.{override.action}"
            
            if override.is_disabled:
                # Remove permission
                base_permissions.pop(perm_key, None)
            elif override.scope_override:
                # Override scope
                base_permissions[perm_key] = override.scope_override
        
        return base_permissions
    
    @staticmethod
    def get_sidebar_menu(
        db: Session,
        org_id: UUID,
        role: str
    ) -> List[dict]:
        """
        Get sidebar menu for role with company settings applied.
        
        Filters menu items based on:
        1. Role permissions (with overrides)
        2. Company feature toggles
        """
        # Normalize role
        canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
        
        # Get base sidebar
        base_menu = SIDEBAR_MENU_CONFIG.get(canonical_role, SIDEBAR_MENU_CONFIG.get(CanonicalRole.SALES_AGENT.value, []))
        
        # Get company settings
        settings = CompanyRBACService.get_company_settings(db, org_id)
        
        if not settings:
            return base_menu
        
        # Filter based on feature toggles
        filtered_menu = []
        for item in base_menu:
            key = item.get("key", "")
            
            # Check feature toggles
            if key == "commissions" and not settings.enable_commissions:
                continue
            if key == "campaigns" and not settings.enable_marketing_module:
                continue
            if key == "employees" and not settings.enable_hr_module:
                continue
            
            filtered_menu.append(item)
        
        return filtered_menu
    
    @staticmethod
    def create_default_settings(db: Session, org_id: UUID) -> CompanySettings:
        """Create default company settings"""
        settings = CompanySettings(
            org_id=org_id,
            use_team_level=True,
            use_branch_level=True,
            approval_required_contracts=True,
            approval_required_commissions=True,
            approval_required_deals=False,
            enable_commissions=True,
            enable_marketing_module=True,
            enable_hr_module=False,
            enable_legal_module=True,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings
    
    @staticmethod
    def update_role_template(
        db: Session,
        org_id: UUID,
        role_code: str,
        *,
        is_enabled: bool = None,
        display_name: str = None,
        display_name_en: str = None,
        description: str = None,
        sort_order: int = None
    ) -> RoleTemplate:
        """Create or update role template for company"""
        # Validate role is canonical
        if role_code not in ROLE_METADATA:
            canonical = get_canonical_role(role_code)
            if canonical not in ROLE_METADATA:
                raise ValueError(f"Invalid role: {role_code}")
            role_code = canonical
        
        # Get or create template
        template = db.execute(
            select(RoleTemplate).where(
                RoleTemplate.org_id == org_id,
                RoleTemplate.role_code == role_code,
                RoleTemplate.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not template:
            template = RoleTemplate(org_id=org_id, role_code=role_code)
            db.add(template)
        
        # Update fields if provided
        if is_enabled is not None:
            template.is_enabled = is_enabled
        if display_name is not None:
            template.display_name = display_name
        if display_name_en is not None:
            template.display_name_en = display_name_en
        if description is not None:
            template.description = description
        if sort_order is not None:
            template.sort_order = sort_order
        
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def create_permission_override(
        db: Session,
        org_id: UUID,
        role_code: str,
        module: str,
        action: str,
        *,
        scope_override: str = None,
        is_disabled: bool = False,
        created_by: UUID = None,
        reason: str = None
    ) -> RolePermissionOverride:
        """
        Create permission override.
        
        Validates:
        - Role is canonical
        - Permission exists in canonical matrix
        - Scope can only be REDUCED (not expanded)
        """
        # Validate role
        canonical_role = get_canonical_role(role_code) if role_code not in ROLE_METADATA else role_code
        if canonical_role not in ROLE_METADATA:
            raise ValueError(f"Invalid role: {role_code}")
        
        # Validate permission exists in canonical
        perm_key = f"{module}.{action}"
        canonical_permissions = PERMISSION_MATRIX.get(canonical_role, {})
        canonical_scope = canonical_permissions.get(perm_key)
        
        if canonical_scope is None and not is_disabled:
            raise ValueError(f"Permission {perm_key} not found for role {canonical_role}")
        
        # Validate scope reduction (can't expand permissions)
        if scope_override:
            scope_order = {"self": 1, "team": 2, "branch": 3, "all": 4}
            canonical_level = scope_order.get(canonical_scope, 0)
            override_level = scope_order.get(scope_override, 0)
            
            if override_level > canonical_level:
                raise ValueError(f"Cannot expand scope from {canonical_scope} to {scope_override}")
        
        # Create or update override
        override = db.execute(
            select(RolePermissionOverride).where(
                RolePermissionOverride.org_id == org_id,
                RolePermissionOverride.role_code == canonical_role,
                RolePermissionOverride.module == module,
                RolePermissionOverride.action == action,
                RolePermissionOverride.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not override:
            override = RolePermissionOverride(
                org_id=org_id,
                role_code=canonical_role,
                module=module,
                action=action
            )
            db.add(override)
        
        override.scope_override = scope_override
        override.is_disabled = is_disabled
        override.created_by = created_by
        override.reason = reason
        
        db.commit()
        db.refresh(override)
        return override


# Singleton
company_rbac_service = CompanyRBACService()
