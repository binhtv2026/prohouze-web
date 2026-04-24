"""
PostgreSQL Authentication Service
Version: 2.1.0 (Prompt 4/20 - Canonical RBAC)

Authentication using PostgreSQL.
Supports:
- Login with email/password
- JWT token generation
- User verification
- Canonical role-based access control
"""

from typing import Optional, Tuple
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
import jwt
import bcrypt
import os

from ..models.user import User, UserMembership
from ..database import SessionLocal
from config.canonical_rbac import (
    CanonicalRole,
    PERMISSION_MATRIX,
    get_canonical_role,
    LEGACY_ROLE_MAPPING,
)


# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Default org for single-tenant mode
DEFAULT_ORG_ID = UUID("00000000-0000-0000-0000-000000000001")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(
    user_id: UUID,
    role: str,
    org_id: UUID = None,
    email: str = None,
    full_name: str = None,
    permissions: dict = None
) -> str:
    """Create JWT access token"""
    payload = {
        "sub": str(user_id),
        "role": role,
        "org_id": str(org_id or DEFAULT_ORG_ID),
        "organization_id": str(org_id or DEFAULT_ORG_ID),  # Legacy support
        "email": email or "",
        "full_name": full_name or "",
        "permissions": permissions or {},
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


class AuthService:
    """PostgreSQL-based authentication service"""
    
    def authenticate(
        self,
        db: Session,
        email: str,
        password: str
    ) -> Tuple[Optional[User], Optional[str], Optional[str]]:
        """
        Authenticate user with email and password.
        
        Returns:
            Tuple of (user, token, error_message)
        """
        # Find user by email
        # Note: Use deleted_at.is_(None) instead of is_deleted property
        # because is_deleted is a Python property, not a database column
        user = db.execute(
            select(User).where(
                and_(
                    User.email == email,
                    User.deleted_at.is_(None)  # Fixed: was User.is_deleted == False
                )
            )
        ).scalar_one_or_none()
        
        if not user:
            return None, None, "Invalid email or password"
        
        # Verify password
        if not user.password_hash or not verify_password(password, user.password_hash):
            return None, None, "Invalid email or password"
        
        # Check if active
        if user.status != "active":
            return None, None, "Account is disabled"
        
        # Get user's primary role
        role = self._get_user_role(db, user.id)
        permissions = self._get_user_permissions(db, user.id)
        
        # Create token
        token = create_access_token(
            user_id=user.id,
            role=role,
            org_id=user.org_id or DEFAULT_ORG_ID,
            email=user.email,
            full_name=user.full_name,
            permissions=permissions
        )
        
        # Update last login
        user.last_login_at = datetime.now(timezone.utc).date()
        db.commit()
        
        return user, token, None
    
    def _get_user_role(self, db: Session, user_id: UUID) -> str:
        """Get user's primary role"""
        membership = db.execute(
            select(UserMembership).where(
                and_(
                    UserMembership.user_id == user_id,
                    UserMembership.is_primary == True,
                    UserMembership.status == "active"
                )
            )
        ).scalar_one_or_none()
        
        if membership:
            return membership.role_code
        
        # Fallback: get any active membership
        membership = db.execute(
            select(UserMembership).where(
                and_(
                    UserMembership.user_id == user_id,
                    UserMembership.status == "active"
                )
            )
        ).scalar_one_or_none()
        
        return membership.role_code if membership else "sales"
    
    def _get_user_permissions(self, db: Session, user_id: UUID) -> dict:
        """Get user's permissions from membership, fallback to role defaults"""
        membership = db.execute(
            select(UserMembership).where(
                and_(
                    UserMembership.user_id == user_id,
                    UserMembership.is_primary.is_(True),
                    UserMembership.status == "active"
                )
            )
        ).scalar_one_or_none()
        
        # If membership has custom permissions, use those
        if membership and membership.permissions_json:
            return membership.permissions_json
        
        # Fallback: get default permissions based on role
        if membership:
            return self._get_default_permissions(membership.role_code)
        
        # Last resort: sales defaults
        return self._get_default_permissions("sales")
    
    def get_user_by_id(self, db: Session, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return db.execute(
            select(User).where(
                and_(
                    User.id == user_id,
                    User.deleted_at.is_(None)
                )
            )
        ).scalar_one_or_none()
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.execute(
            select(User).where(
                and_(
                    User.email == email,
                    User.deleted_at.is_(None)
                )
            )
        ).scalar_one_or_none()
    
    def get_current_user_from_token(self, db: Session, token: str) -> Optional[dict]:
        """
        Get current user data from token.
        Returns user dict compatible with existing code.
        """
        payload = decode_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        try:
            user = self.get_user_by_id(db, UUID(user_id))
            if not user:
                return None
            
            role = payload.get("role") or self._get_user_role(db, user.id)
            permissions = payload.get("permissions") or self._get_user_permissions(db, user.id)
            
            # Return dict compatible with existing MongoDB-based code
            settings = user.settings_json or {}
            
            return {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "phone": user.phone,
                "role": role,
                "department": user.department or "sales",
                "branch_id": settings.get("branch_id"),
                "team_id": settings.get("team_id"),
                "specializations": settings.get("specializations", []),
                "regions": settings.get("regions", []),
                "is_active": user.status == "active",
                "org_id": str(user.org_id) if user.org_id else str(DEFAULT_ORG_ID),
                "organization_id": str(user.org_id) if user.org_id else str(DEFAULT_ORG_ID),
                "permissions": permissions,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        except Exception:
            return None
    
    def register_user(
        self,
        db: Session,
        email: str,
        password: str,
        full_name: str,
        role: str = "sales",
        phone: str = None,
        department: str = "sales",
        **kwargs
    ) -> Tuple[Optional[User], Optional[str]]:
        """
        Register a new user.
        
        Returns:
            Tuple of (user, error_message)
        """
        # Check if email exists
        existing = self.get_user_by_email(db, email)
        if existing:
            return None, "Email already registered"
        
        # Create user
        user = User(
            org_id=DEFAULT_ORG_ID,
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            phone=phone,
            department=department,
            user_type="internal",
            status="active",
            settings_json={
                "branch_id": kwargs.get("branch_id"),
                "team_id": kwargs.get("team_id"),
                "specializations": kwargs.get("specializations", []),
                "regions": kwargs.get("regions", []),
            }
        )
        
        db.add(user)
        db.flush()
        
        # Create membership
        membership = UserMembership(
            user_id=user.id,
            org_id=DEFAULT_ORG_ID,
            role_code=role,
            scope_type="org",
            is_primary=True,
            status="active",
            permissions_json=self._get_default_permissions(role)
        )
        
        db.add(membership)
        db.commit()
        db.refresh(user)
        
        return user, None
    
    def _get_default_permissions(self, role: str) -> dict:
        """
        Get default permissions for a role using CANONICAL RBAC.
        SINGLE SOURCE OF TRUTH - All from canonical_rbac.py
        NO fallback - if role not found, return empty (fail secure)
        """
        # Convert legacy role to canonical
        canonical_role = get_canonical_role(role) if role not in PERMISSION_MATRIX else role
        
        # Get permissions from canonical matrix - NO FALLBACK
        permissions_matrix = PERMISSION_MATRIX.get(canonical_role)
        
        if not permissions_matrix:
            # Role not found in canonical config - return empty, NO auto-allow
            return {}
        
        # Convert matrix format (resource.action: scope) to dict format (resource: [actions])
        permissions = {}
        for perm_key, scope in permissions_matrix.items():
            if '.' in perm_key:
                resource, action = perm_key.split('.', 1)
                if resource not in permissions:
                    permissions[resource] = []
                permissions[resource].append(action)
        
        return permissions


# Singleton instance
auth_service = AuthService()
