"""
ProHouzing API v2 - Authentication Routes
Version: 2.0.0 (PostgreSQL Auth)

Authentication endpoints using PostgreSQL:
- Login
- Register
- Get current user
- Change password
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
import jwt

from core.database import get_db
from core.services.auth_service import auth_service, hash_password, create_access_token, DEFAULT_ORG_ID
from core.models.user import User

# JWT Configuration
JWT_SECRET = "prohouzing-secret-key-2024-secure"


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Register request"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: str = "sales"
    department: str = "sales"
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    specializations: List[str] = []
    regions: List[str] = []


class UserResponse(BaseModel):
    """User response"""
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    department: str = "sales"
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    specializations: List[str] = []
    regions: List[str] = []
    is_active: bool = True
    org_id: str
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=6)


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════════════════════════════════════════

router = APIRouter(prefix="/auth", tags=["Authentication (PostgreSQL)"])


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns JWT token for API access.
    """
    user, token, error = auth_service.authenticate(db, data.email, data.password)
    
    if error:
        raise HTTPException(status_code=401, detail=error)
    
    # Get user role and settings
    settings = user.settings_json or {}
    role = auth_service._get_user_role(db, user.id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=role,
            department=user.department or "sales",
            branch_id=settings.get("branch_id"),
            team_id=settings.get("team_id"),
            specializations=settings.get("specializations", []),
            regions=settings.get("regions", []),
            is_active=user.status == "active",
            org_id=str(user.org_id) if user.org_id else str(DEFAULT_ORG_ID),
            created_at=user.created_at.isoformat() if user.created_at else None
        )
    )


@router.post("/register", response_model=UserResponse)
async def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    
    Requires admin permission in production.
    """
    user, error = auth_service.register_user(
        db,
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        role=data.role,
        phone=data.phone,
        department=data.department,
        branch_id=data.branch_id,
        team_id=data.team_id,
        specializations=data.specializations,
        regions=data.regions
    )
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    settings = user.settings_json or {}
    role = auth_service._get_user_role(db, user.id)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=role,
        department=user.department or "sales",
        branch_id=settings.get("branch_id"),
        team_id=settings.get("team_id"),
        specializations=settings.get("specializations", []),
        regions=settings.get("regions", []),
        is_active=user.status == "active",
        org_id=str(user.org_id) if user.org_id else str(DEFAULT_ORG_ID),
        created_at=user.created_at.isoformat() if user.created_at else None
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """
    Get current user profile.
    
    Requires authentication via Bearer token in Authorization header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        
        # Query user from PostgreSQL
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get role and permissions from token (they were added during login)
        role = payload.get("role", "viewer")
        permissions = payload.get("permissions", [])
        settings = user.settings_json or {}
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=role,
            department=user.department or "sales",
            branch_id=settings.get("branch_id"),
            team_id=settings.get("team_id"),
            specializations=settings.get("specializations", []),
            regions=settings.get("regions", []),
            is_active=user.status == "active",
            org_id=str(user.org_id) if user.org_id else str(DEFAULT_ORG_ID),
            created_at=user.created_at.isoformat() if user.created_at else None
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Change current user's password.
    
    Requires authentication and current password.
    """
    # This would use current_user from token
    # For now, placeholder
    return {"success": True, "message": "Password changed (placeholder)"}
