"""
ProHouzing Permission Middleware
Prompt 4/20 - Organization & Permission Foundation

Centralized permission checking for API endpoints.
Replaces scattered hardcoded role checks.
"""

from fastapi import HTTPException, Depends
from functools import wraps
from typing import List, Optional, Callable, Any
from config.rbac_config import (
    get_permission_scope, has_permission, PermissionScope,
    LEGACY_ROLE_MAPPING
)

def get_mapped_role(user: dict) -> str:
    """Get the new role from user, mapping legacy roles if needed"""
    role = user.get("role", "sales_agent")
    return LEGACY_ROLE_MAPPING.get(role, role)

def check_permission(resource: str, action: str, required_scope: str = None):
    """
    Dependency for checking permissions.
    Use as: Depends(check_permission("lead", "create"))
    
    Args:
        resource: The resource being accessed (lead, customer, etc.)
        action: The action being performed (view, create, edit, etc.)
        required_scope: Optional minimum required scope
    """
    async def permission_checker(current_user: dict = None) -> dict:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        role = get_mapped_role(current_user)
        
        if not has_permission(role, resource, action):
            raise HTTPException(
                status_code=403, 
                detail=f"Permission denied: {resource}.{action}"
            )
        
        # Check minimum scope if specified
        if required_scope:
            user_scope = get_permission_scope(role, resource, action)
            scope_order = [
                PermissionScope.NONE.value,
                PermissionScope.SELF.value,
                PermissionScope.TEAM.value,
                PermissionScope.DEPARTMENT.value,
                PermissionScope.BRANCH.value,
                PermissionScope.ALL.value
            ]
            
            user_scope_level = scope_order.index(user_scope) if user_scope in scope_order else 0
            required_scope_level = scope_order.index(required_scope) if required_scope in scope_order else 0
            
            if user_scope_level < required_scope_level:
                raise HTTPException(
                    status_code=403,
                    detail=f"Insufficient scope: requires {required_scope}, has {user_scope}"
                )
        
        return current_user
    
    return permission_checker

def require_permission(resource: str, action: str):
    """
    Decorator for permission checking on route functions.
    
    Usage:
        @api_router.get("/leads")
        @require_permission("lead", "view")
        async def get_leads(current_user: dict = Depends(get_current_user)):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            role = get_mapped_role(current_user)
            
            if not has_permission(role, resource, action):
                raise HTTPException(
                    status_code=403,
                    detail=f"Permission denied: {resource}.{action}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def get_visibility_filter(user: dict, resource: str) -> dict:
    """
    Get MongoDB query filter based on user's view scope.
    
    Returns a query filter that restricts data access based on permission scope.
    
    Args:
        user: Current user dict
        resource: Resource name (lead, customer, etc.)
    
    Returns:
        MongoDB query filter dict
    """
    role = get_mapped_role(user)
    scope = get_permission_scope(role, resource, "view")
    
    if scope == PermissionScope.ALL.value:
        return {}  # No filter - can see all
    
    elif scope == PermissionScope.BRANCH.value:
        branch_id = user.get("branch_id")
        if branch_id:
            return {"branch_id": branch_id}
        return {}  # Fallback to no filter if no branch
    
    elif scope == PermissionScope.DEPARTMENT.value:
        department_id = user.get("department_id")
        if department_id:
            return {"department_id": department_id}
        # Fallback to branch
        branch_id = user.get("branch_id")
        if branch_id:
            return {"branch_id": branch_id}
        return {}
    
    elif scope == PermissionScope.TEAM.value:
        team_id = user.get("team_id")
        if team_id:
            return {"team_id": team_id}
        # Fallback
        return {"$or": [
            {"assigned_to": user["id"]},
            {"created_by": user["id"]}
        ]}
    
    elif scope == PermissionScope.SELF.value:
        # Self scope: only own records
        return {"$or": [
            {"assigned_to": user["id"]},
            {"created_by": user["id"]},
            {"current_owner": user["id"]}
        ]}
    
    else:  # NONE or unknown
        # Return impossible filter
        return {"id": {"$exists": False}}

def can_access_entity(user: dict, entity: dict, resource: str, action: str = "view") -> bool:
    """
    Check if user can access a specific entity based on scope.
    
    Args:
        user: Current user dict
        entity: The entity being accessed
        resource: Resource name
        action: Action being performed
    
    Returns:
        True if user can access, False otherwise
    """
    role = get_mapped_role(user)
    
    if not has_permission(role, resource, action):
        return False
    
    scope = get_permission_scope(role, resource, action)
    
    if scope == PermissionScope.ALL.value:
        return True
    
    elif scope == PermissionScope.BRANCH.value:
        return entity.get("branch_id") == user.get("branch_id")
    
    elif scope == PermissionScope.DEPARTMENT.value:
        return entity.get("department_id") == user.get("department_id")
    
    elif scope == PermissionScope.TEAM.value:
        return entity.get("team_id") == user.get("team_id")
    
    elif scope == PermissionScope.SELF.value:
        user_id = user.get("id")
        return (
            entity.get("assigned_to") == user_id or
            entity.get("created_by") == user_id or
            entity.get("current_owner") == user_id
        )
    
    return False

class PermissionHelper:
    """
    Helper class for permission operations.
    Can be used in route handlers for more complex permission logic.
    """
    
    @staticmethod
    def get_role(user: dict) -> str:
        """Get mapped role for user"""
        return get_mapped_role(user)
    
    @staticmethod
    def can(user: dict, resource: str, action: str) -> bool:
        """Check if user has permission"""
        role = get_mapped_role(user)
        return has_permission(role, resource, action)
    
    @staticmethod
    def scope(user: dict, resource: str, action: str) -> str:
        """Get permission scope"""
        role = get_mapped_role(user)
        return get_permission_scope(role, resource, action)
    
    @staticmethod
    def filter(user: dict, resource: str) -> dict:
        """Get visibility filter"""
        return get_visibility_filter(user, resource)
    
    @staticmethod
    def can_access(user: dict, entity: dict, resource: str, action: str = "view") -> bool:
        """Check if user can access entity"""
        return can_access_entity(user, entity, resource, action)

# Convenience instance
perm = PermissionHelper()
