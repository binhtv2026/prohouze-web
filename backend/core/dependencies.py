"""
ProHouzing Core Dependencies
Version: 2.1.0 (Prompt 4/20 - HARDENED)

Authentication dependencies using CANONICAL RBAC.
ALL permission checks delegate to canonical_rbac.py.
NO hardcoded roles or permissions here.
"""

from typing import Optional, Annotated
from uuid import UUID
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
import os

from .database import get_db
from config.canonical_rbac import (
    ROLE_METADATA,
    get_canonical_role,
    has_permission as canonical_has_permission,
    get_permission_scope,
)

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

security = HTTPBearer()


class CurrentUser:
    """Current authenticated user context - CANONICAL RBAC"""
    def __init__(
        self,
        id: UUID,
        org_id: UUID,
        email: str,
        role: str,
        full_name: str = "",
        permissions: dict = None
    ):
        self.id = id
        self.org_id = org_id
        self.email = email
        # Convert legacy role to canonical - SINGLE SOURCE OF TRUTH
        self.role = get_canonical_role(role) if role not in ROLE_METADATA else role
        self.full_name = full_name
        self.permissions = permissions or {}
    
    def has_permission(self, resource: str, action: str) -> bool:
        """
        Check if user has specific permission.
        DELEGATES TO CANONICAL RBAC - NO HARDCODE HERE.
        """
        return canonical_has_permission(self.role, resource, action)
    
    def get_permission_scope(self, resource: str, action: str) -> Optional[str]:
        """
        Get the scope for a specific permission.
        Returns: 'self', 'team', 'branch', 'all', or None
        """
        return get_permission_scope(self.role, resource, action)
    
    def can_access_org(self, org_id: UUID) -> bool:
        """Check if user can access specific organization"""
        return self.org_id == org_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    """
    Dependency to get current authenticated user.
    Extracts user info from JWT token.
    """
    try:
        payload = jwt.decode(
            credentials.credentials, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        # Get org_id from token (required for multi-tenancy)
        org_id = payload.get("org_id")
        if not org_id:
            # Fallback: try to get from user record in MongoDB (legacy support)
            # In production, org_id should always be in the token
            org_id = payload.get("organization_id")
        
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing organization ID"
            )
        
        return CurrentUser(
            id=UUID(user_id),
            org_id=UUID(org_id),
            email=payload.get("email", ""),
            role=payload.get("role", "viewer"),
            full_name=payload.get("full_name", ""),
            permissions=payload.get("permissions", [])
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {str(e)}"
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_db)
) -> Optional[CurrentUser]:
    """
    Optional user dependency - returns None if not authenticated.
    Useful for public endpoints that behave differently for authenticated users.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_permission(resource: str, action: str):
    """
    Dependency factory for checking permissions.
    
    Usage:
        @router.post("/items")
        async def create_item(
            current_user: CurrentUser = Depends(require_permission("items", "create"))
        ):
            ...
    """
    async def permission_checker(
        current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if not current_user.has_permission(resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {resource}.{action}"
            )
        return current_user
    
    return permission_checker


def require_role(*roles: str):
    """
    Dependency factory for checking roles.
    
    Usage:
        @router.delete("/users/{id}")
        async def delete_user(
            current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
        ):
            ...
    """
    async def role_checker(
        current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {', '.join(roles)}"
            )
        return current_user
    
    return role_checker


# Annotated types for cleaner dependency injection
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
DBSessionDep = Annotated[Session, Depends(get_db)]
