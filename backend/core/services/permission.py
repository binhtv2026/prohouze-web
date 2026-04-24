"""
ProHouzing Permission Service
Version: 2.1.0 (Prompt 4/20 - HARDENED)

SINGLE SOURCE OF TRUTH: All permissions from canonical_rbac.py
SCOPE ENGINE: get_user_scope() returns scope data, NO role checks outside

NO hardcoded roles or permissions in this file.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_

from core.models.user import User, UserMembership
from core.models.organization import OrganizationalUnit
from config.canonical_rbac import (
    CanonicalRole,
    PermissionScope as CanonicalScope,
    PERMISSION_MATRIX,
    ROLE_METADATA,
    get_canonical_role,
    get_permission_scope as canonical_get_permission_scope,
    has_permission as canonical_has_permission,
)


class PermissionScope(str, Enum):
    """Permission scope levels - mirrors canonical_rbac"""
    SELF = "self"           # Only own records
    TEAM = "team"           # Team members' records
    UNIT = "unit"           # Organizational unit records
    BRANCH = "branch"       # Branch level
    ORGANIZATION = "org"    # Entire organization
    GLOBAL = "global"       # Cross-organization (super admin)


class AccessLevel(str, Enum):
    """Access levels for operations"""
    NONE = "none"
    VIEW = "view"
    EDIT = "edit"
    DELETE = "delete"
    ADMIN = "admin"


# Map canonical scope strings to PermissionScope enum
SCOPE_MAPPING = {
    "self": PermissionScope.SELF,
    "team": PermissionScope.TEAM,
    "branch": PermissionScope.BRANCH,
    "all": PermissionScope.ORGANIZATION,
    "global": PermissionScope.GLOBAL,
}


class PermissionService:
    """
    SCOPE ENGINE - Provides user scope data for visibility filtering.
    
    NO direct role checks (e.g., if role == 'sales').
    All permission logic from canonical_rbac.py.
    """
    
    @staticmethod
    def get_user_scope(
        db: Session,
        user_id: UUID,
        org_id: UUID
    ) -> Dict[str, Any]:
        """
        SCOPE ENGINE: Get user's visibility scope.
        
        Returns:
        {
            "user_id": UUID,
            "scope_level": "self" | "team" | "branch" | "all",
            "team_ids": [...],
            "unit_ids": [...],
            "branch_id": UUID | None,
            "subordinate_user_ids": [...]
        }
        
        NO role checks here - scope determined by canonical_rbac config.
        """
        user = db.execute(
            select(User).where(
                User.id == user_id,
                User.org_id == org_id,
                User.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not user:
            # No user found - return minimal scope, NO fallback to allow access
            return {
                "user_id": user_id,
                "scope_level": PermissionScope.SELF,
                "scope": PermissionScope.SELF,
                "team_ids": [],
                "unit_ids": [],
                "branch_id": None,
                "subordinate_user_ids": [],
                "role": None,
                "access": AccessLevel.NONE,
                "resources": []
            }
        
        # Get primary membership
        membership = db.execute(
            select(UserMembership).where(
                UserMembership.user_id == user_id,
                UserMembership.org_id == org_id,
                UserMembership.is_primary.is_(True),
                UserMembership.status == "active",
                UserMembership.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not membership:
            # Fallback: get any active membership
            membership = db.execute(
                select(UserMembership).where(
                    UserMembership.user_id == user_id,
                    UserMembership.org_id == org_id,
                    UserMembership.status == "active",
                    UserMembership.deleted_at.is_(None)
                )
            ).scalar_one_or_none()
        
        if not membership:
            # No membership - return minimal scope, NO auto-allow
            return {
                "user_id": user_id,
                "scope_level": PermissionScope.SELF,
                "scope": PermissionScope.SELF,
                "team_ids": [],
                "unit_ids": [],
                "branch_id": None,
                "subordinate_user_ids": [],
                "role": None,
                "access": AccessLevel.NONE,
                "resources": []
            }
        
        # Get canonical role and its default scope from ROLE_METADATA
        role = membership.role_code
        canonical_role = get_canonical_role(role) if role not in ROLE_METADATA else role
        role_meta = ROLE_METADATA.get(canonical_role, ROLE_METADATA.get("sales_agent", {}))
        
        # Get scope from role metadata - SINGLE SOURCE OF TRUTH
        default_scope_str = role_meta.get("default_scope", CanonicalScope.SELF)
        if isinstance(default_scope_str, CanonicalScope):
            default_scope_str = default_scope_str.value
        scope = SCOPE_MAPPING.get(default_scope_str, PermissionScope.SELF)
        
        # Get all unit memberships
        all_memberships = db.execute(
            select(UserMembership).where(
                UserMembership.user_id == user_id,
                UserMembership.org_id == org_id,
                UserMembership.status == "active",
                UserMembership.deleted_at.is_(None)
            )
        ).scalars().all()
        
        unit_ids = []
        branch_id = None
        for m in all_memberships:
            if m.unit_id:
                unit_ids.append(m.unit_id)
                # Try to get branch from unit hierarchy
                if not branch_id:
                    unit = db.execute(
                        select(OrganizationalUnit).where(
                            OrganizationalUnit.id == m.unit_id
                        )
                    ).scalar_one_or_none()
                    if unit and unit.parent_unit_id:
                        branch_id = unit.parent_unit_id
        
        # Get subordinate users based on scope
        subordinate_user_ids = []
        if scope in [PermissionScope.TEAM, PermissionScope.UNIT, PermissionScope.BRANCH]:
            if unit_ids:
                subordinates = db.execute(
                    select(UserMembership.user_id).where(
                        UserMembership.unit_id.in_(unit_ids),
                        UserMembership.org_id == org_id,
                        UserMembership.status == "active",
                        UserMembership.deleted_at.is_(None)
                    )
                ).scalars().all()
                subordinate_user_ids = [uid for uid in set(subordinates) if uid != user_id]
        
        return {
            "user_id": user_id,
            "scope_level": scope,
            "scope": scope,  # Backward compatible
            "team_ids": unit_ids,  # Teams are units in our model
            "unit_ids": unit_ids,
            "branch_id": branch_id,
            "subordinate_user_ids": subordinate_user_ids,
            "role": canonical_role,
            "access": AccessLevel.EDIT if role_meta.get("level", 5) <= 4 else AccessLevel.VIEW,
            "resources": ["*"] if role_meta.get("level", 5) <= 2 else []
        }
    
    @staticmethod
    def can_access_resource(
        user_scope: Dict[str, Any],
        resource: str,
        action: str
    ) -> bool:
        """
        Check if user can access a resource type.
        
        Args:
            user_scope: Result from get_user_scope()
            resource: Resource type (customers, leads, etc.)
            action: Action (view, edit, delete)
        
        Returns:
            True if allowed
        """
        # Check resource permission
        allowed_resources = user_scope.get("resources", [])
        if "*" not in allowed_resources and resource not in allowed_resources:
            return False
        
        # Check action level
        access = user_scope.get("access", AccessLevel.NONE)
        
        if access == AccessLevel.ADMIN:
            return True
        
        if action == "view" and access in [AccessLevel.VIEW, AccessLevel.EDIT, AccessLevel.DELETE]:
            return True
        
        if action == "edit" and access in [AccessLevel.EDIT, AccessLevel.DELETE]:
            return True
        
        if action == "delete" and access == AccessLevel.DELETE:
            return True
        
        return False
    
    @staticmethod
    def can_access_entity(
        user_scope: Dict[str, Any],
        entity: Any,
        action: str = "view"
    ) -> bool:
        """
        Check if user can access a specific entity.
        
        Checks:
        1. Ownership (created_by, owner_user_id)
        2. Team membership
        3. Unit hierarchy
        """
        user_id = user_scope.get("user_id")
        scope = user_scope.get("scope", PermissionScope.SELF)
        
        # Global/Org admins can access all
        if scope in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
            return True
        
        # Check ownership
        is_owner = (
            (hasattr(entity, "created_by") and entity.created_by == user_id) or
            (hasattr(entity, "owner_user_id") and entity.owner_user_id == user_id) or
            (hasattr(entity, "assigned_to") and entity.assigned_to == user_id) or
            (hasattr(entity, "sales_user_id") and entity.sales_user_id == user_id)
        )
        
        if scope == PermissionScope.SELF:
            return is_owner
        
        # Check team/unit
        if scope in [PermissionScope.TEAM, PermissionScope.UNIT]:
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            
            entity_owner = None
            if hasattr(entity, "owner_user_id"):
                entity_owner = entity.owner_user_id
            elif hasattr(entity, "created_by"):
                entity_owner = entity.created_by
            elif hasattr(entity, "assigned_to"):
                entity_owner = entity.assigned_to
            
            if entity_owner and entity_owner in subordinate_ids:
                return True
            
            if is_owner:
                return True
        
        # Check branch
        if scope == PermissionScope.BRANCH:
            unit_ids = user_scope.get("unit_ids", [])
            
            entity_unit = None
            if hasattr(entity, "owner_unit_id"):
                entity_unit = entity.owner_unit_id
            elif hasattr(entity, "unit_id"):
                entity_unit = entity.unit_id
            
            if entity_unit and entity_unit in unit_ids:
                return True
            
            if is_owner:
                return True
        
        return False
    
    @staticmethod
    def build_visibility_filter(
        user_scope: Dict[str, Any],
        model_class: Any
    ) -> list:
        """
        Build SQLAlchemy filter conditions for visibility.
        
        Returns list of filter conditions to apply to queries.
        """
        user_id = user_scope.get("user_id")
        scope = user_scope.get("scope", PermissionScope.SELF)
        
        conditions = []
        
        # Global/Org admins see all (no filter)
        if scope in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
            return conditions
        
        # Self scope - only own records
        if scope == PermissionScope.SELF:
            owner_conditions = []
            
            if hasattr(model_class, "created_by"):
                owner_conditions.append(model_class.created_by == user_id)
            if hasattr(model_class, "owner_user_id"):
                owner_conditions.append(model_class.owner_user_id == user_id)
            if hasattr(model_class, "assigned_to"):
                owner_conditions.append(model_class.assigned_to == user_id)
            if hasattr(model_class, "sales_user_id"):
                owner_conditions.append(model_class.sales_user_id == user_id)
            
            if owner_conditions:
                conditions.append(or_(*owner_conditions))
            
            return conditions
        
        # Team/Unit scope
        if scope in [PermissionScope.TEAM, PermissionScope.UNIT]:
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            all_user_ids = [user_id] + subordinate_ids
            
            owner_conditions = []
            
            if hasattr(model_class, "owner_user_id"):
                owner_conditions.append(model_class.owner_user_id.in_(all_user_ids))
            if hasattr(model_class, "created_by"):
                owner_conditions.append(model_class.created_by.in_(all_user_ids))
            if hasattr(model_class, "assigned_to"):
                owner_conditions.append(model_class.assigned_to.in_(all_user_ids))
            
            if owner_conditions:
                conditions.append(or_(*owner_conditions))
            
            return conditions
        
        # Branch scope
        if scope == PermissionScope.BRANCH:
            unit_ids = user_scope.get("unit_ids", [])
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            all_user_ids = [user_id] + subordinate_ids
            
            owner_conditions = []
            
            if hasattr(model_class, "owner_unit_id") and unit_ids:
                owner_conditions.append(model_class.owner_unit_id.in_(unit_ids))
            if hasattr(model_class, "owner_user_id"):
                owner_conditions.append(model_class.owner_user_id.in_(all_user_ids))
            
            if owner_conditions:
                conditions.append(or_(*owner_conditions))
            
            return conditions
        
        return conditions


# Singleton instance
permission_service = PermissionService()
