"""
ProHouzing RBAC API Router
Prompt 4/20 - Organization & Permission Foundation

API endpoints for:
- Permission checking
- Role management
- Organization management (Company, Branch, Department, Team)
- User management with RBAC
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import jwt
import os

# Import from main server (will be injected)
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.rbac_config import (
    SystemRole, ROLE_CONFIG, PERMISSION_MATRIX,
    PermissionScope, PermissionAction, RESOURCES,
    get_role_permissions, has_permission, get_permission_scope,
    get_role_config, can_access_menu, LEGACY_ROLE_MAPPING,
    MENU_PERMISSIONS, STANDARD_DEPARTMENTS
)
from models.organization_models import (
    CompanyCreate, CompanyResponse,
    BranchCreate, BranchResponse,
    DepartmentCreate, DepartmentResponse,
    TeamCreate, TeamResponse,
    UserResponseEnhanced, UserUpdateRequest,
    PermissionCheckRequest, PermissionCheckResponse,
    BulkPermissionCheck, BulkPermissionResponse,
    OwnershipTransfer,
    ApprovalRequest, ApprovalStatus
)

router = APIRouter(prefix="/api/rbac", tags=["RBAC"])

# Database will be injected from server.py
db: AsyncIOMotorDatabase = None

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"
security = HTTPBearer()

def set_database(database: AsyncIOMotorDatabase):
    """Set the database instance"""
    global db
    db = database

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============================================
# PERMISSION ENDPOINTS
# ============================================

@router.get("/permissions/matrix")
async def get_permission_matrix():
    """Get the full permission matrix"""
    return {
        "roles": list(ROLE_CONFIG.keys()),
        "resources": RESOURCES,
        "actions": [a.value for a in PermissionAction],
        "scopes": [s.value for s in PermissionScope],
        "matrix": PERMISSION_MATRIX
    }

@router.get("/permissions/my")
async def get_my_permissions(current_user: dict = Depends(get_current_user)):
    """Get permissions for current user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "sales_agent")
    
    # Map legacy role if needed
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    permissions = get_role_permissions(role)
    role_info = get_role_config(role)
    
    return {
        "role": role,
        "role_info": role_info,
        "permissions": permissions,
        "menu_access": {
            path: can_access_menu(role, path) 
            for path in MENU_PERMISSIONS.keys()
        }
    }

@router.post("/permissions/check", response_model=PermissionCheckResponse)
async def check_permission(
    request: PermissionCheckRequest,
    current_user: dict = Depends(get_current_user)
):
    """Check if current user has permission"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "sales_agent")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    scope = get_permission_scope(role, request.resource, request.action)
    allowed = scope != PermissionScope.NONE.value
    
    return PermissionCheckResponse(
        allowed=allowed,
        scope=scope,
        reason=f"Role {role} has {scope} scope for {request.resource}.{request.action}"
    )

@router.post("/permissions/check-bulk", response_model=BulkPermissionResponse)
async def check_permissions_bulk(
    request: BulkPermissionCheck,
    current_user: dict = Depends(get_current_user)
):
    """Check multiple permissions at once"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "sales_agent")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    results = {}
    for check in request.checks:
        key = f"{check.resource}.{check.action}"
        scope = get_permission_scope(role, check.resource, check.action)
        results[key] = PermissionCheckResponse(
            allowed=scope != PermissionScope.NONE.value,
            scope=scope
        )
    
    return BulkPermissionResponse(results=results)

# ============================================
# ROLE ENDPOINTS
# ============================================

@router.get("/roles")
async def get_all_roles():
    """Get all available roles with their configurations"""
    return {
        "roles": [
            {
                "code": role.value,
                **ROLE_CONFIG.get(role.value, {})
            }
            for role in SystemRole
        ]
    }

@router.get("/roles/{role_code}")
async def get_role_detail(role_code: str):
    """Get detailed info for a specific role"""
    config = ROLE_CONFIG.get(role_code)
    if not config:
        raise HTTPException(status_code=404, detail="Role not found")
    
    permissions = get_role_permissions(role_code)
    
    return {
        "code": role_code,
        **config,
        "permissions": permissions
    }

# ============================================
# COMPANY ENDPOINTS (Multi-tenant)
# ============================================

@router.post("/companies", response_model=CompanyResponse)
async def create_company(data: CompanyCreate, current_user: dict = Depends(get_current_user)):
    """Create a new company (tenant)"""
    if not current_user or current_user.get("role") not in ["system_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check duplicate code
    existing = await db.companies.find_one({"code": data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Company code already exists")
    
    company_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    company_doc = {
        "id": company_id,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.companies.insert_one(company_doc)
    company_doc.pop("_id", None)
    
    return CompanyResponse(**company_doc, branch_count=0, user_count=0)

@router.get("/companies", response_model=List[CompanyResponse])
async def get_companies(current_user: dict = Depends(get_current_user)):
    """Get all companies"""
    if not current_user or current_user.get("role") not in ["system_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    companies = await db.companies.find({}, {"_id": 0}).to_list(100)
    
    result = []
    for c in companies:
        branch_count = await db.branches.count_documents({"company_id": c["id"]})
        user_count = await db.users.count_documents({"company_id": c["id"]})
        result.append(CompanyResponse(**c, branch_count=branch_count, user_count=user_count))
    
    return result

# ============================================
# BRANCH ENDPOINTS
# ============================================

@router.post("/branches", response_model=BranchResponse)
async def create_branch(data: BranchCreate, current_user: dict = Depends(get_current_user)):
    """Create a new branch"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    if not has_permission(role, "branch", "create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify company exists
    company = await db.companies.find_one({"id": data.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check duplicate code within company
    existing = await db.branches.find_one({
        "company_id": data.company_id,
        "code": data.code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Branch code already exists in this company")
    
    branch_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    branch_doc = {
        "id": branch_id,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.branches.insert_one(branch_doc)
    branch_doc.pop("_id", None)
    
    # Get manager name if set
    manager_name = None
    if data.manager_id:
        manager = await db.users.find_one({"id": data.manager_id}, {"_id": 0, "full_name": 1})
        manager_name = manager.get("full_name") if manager else None
    
    return BranchResponse(**branch_doc, manager_name=manager_name, department_count=0, user_count=0)

@router.get("/branches", response_model=List[BranchResponse])
async def get_branches(
    company_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get branches (filtered by permission scope)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    scope = get_permission_scope(role, "branch", "view")
    
    query: Dict[str, Any] = {}
    if company_id:
        query["company_id"] = company_id
    
    # Apply scope filtering
    if scope == PermissionScope.BRANCH.value:
        query["id"] = current_user.get("branch_id")
    elif scope == PermissionScope.SELF.value:
        query["id"] = current_user.get("branch_id")
    elif scope == PermissionScope.NONE.value:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    branches = await db.branches.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for b in branches:
        dept_count = await db.departments.count_documents({"branch_id": b["id"]})
        user_count = await db.users.count_documents({"branch_id": b["id"]})
        
        manager_name = None
        if b.get("manager_id"):
            manager = await db.users.find_one({"id": b["manager_id"]}, {"_id": 0, "full_name": 1})
            manager_name = manager.get("full_name") if manager else None
        
        # Handle legacy branch data (may not have code/company_id)
        branch_data = {
            "id": b["id"],
            "code": b.get("code", b.get("province", b["name"][:10]).lower().replace(" ", "_")),
            "name": b.get("name", ""),
            "name_en": b.get("name_en"),
            "description": b.get("description"),
            "is_active": b.get("is_active", True),
            "metadata": b.get("metadata", {}),
            "company_id": b.get("company_id", "default"),
            "address": b.get("address"),
            "phone": b.get("phone"),
            "email": b.get("email"),
            "manager_id": b.get("manager_id"),
            "region": b.get("region", b.get("province")),
            "created_at": b.get("created_at", ""),
            "updated_at": b.get("updated_at"),
            "manager_name": manager_name,
            "department_count": dept_count,
            "user_count": user_count
        }
        
        result.append(BranchResponse(**branch_data))
    
    return result

@router.get("/branches/{branch_id}", response_model=BranchResponse)
async def get_branch(branch_id: str, current_user: dict = Depends(get_current_user)):
    """Get branch by ID"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    dept_count = await db.departments.count_documents({"branch_id": branch_id})
    user_count = await db.users.count_documents({"branch_id": branch_id})
    
    manager_name = None
    if branch.get("manager_id"):
        manager = await db.users.find_one({"id": branch["manager_id"]}, {"_id": 0, "full_name": 1})
        manager_name = manager.get("full_name") if manager else None
    
    # Handle legacy branch data
    branch_data = {
        "id": branch["id"],
        "code": branch.get("code", branch.get("province", branch["name"][:10]).lower().replace(" ", "_")),
        "name": branch.get("name", ""),
        "name_en": branch.get("name_en"),
        "description": branch.get("description"),
        "is_active": branch.get("is_active", True),
        "metadata": branch.get("metadata", {}),
        "company_id": branch.get("company_id", "default"),
        "address": branch.get("address"),
        "phone": branch.get("phone"),
        "email": branch.get("email"),
        "manager_id": branch.get("manager_id"),
        "region": branch.get("region", branch.get("province")),
        "created_at": branch.get("created_at", ""),
        "updated_at": branch.get("updated_at"),
        "manager_name": manager_name,
        "department_count": dept_count,
        "user_count": user_count
    }
    
    return BranchResponse(**branch_data)

# ============================================
# DEPARTMENT ENDPOINTS
# ============================================

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(data: DepartmentCreate, current_user: dict = Depends(get_current_user)):
    """Create a new department"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    # Need branch.edit or department.create permission
    if not (has_permission(role, "branch", "edit") or has_permission(role, "user", "create")):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify branch exists
    branch = await db.branches.find_one({"id": data.branch_id})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    dept_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    dept_doc = {
        "id": dept_id,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.departments.insert_one(dept_doc)
    dept_doc.pop("_id", None)
    
    return DepartmentResponse(
        **dept_doc,
        branch_name=branch.get("name"),
        head_name=None,
        team_count=0,
        user_count=0
    )

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    branch_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get departments"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query: Dict[str, Any] = {}
    if branch_id:
        query["branch_id"] = branch_id
    
    departments = await db.departments.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for d in departments:
        team_count = await db.teams.count_documents({"department_id": d["id"]})
        user_count = await db.users.count_documents({"department_id": d["id"]})
        
        branch = await db.branches.find_one({"id": d["branch_id"]}, {"_id": 0, "name": 1})
        branch_name = branch.get("name") if branch else None
        
        head_name = None
        if d.get("head_id"):
            head = await db.users.find_one({"id": d["head_id"]}, {"_id": 0, "full_name": 1})
            head_name = head.get("full_name") if head else None
        
        result.append(DepartmentResponse(
            **d,
            branch_name=branch_name,
            head_name=head_name,
            team_count=team_count,
            user_count=user_count
        ))
    
    return result

# ============================================
# TEAM ENDPOINTS
# ============================================

@router.post("/teams", response_model=TeamResponse)
async def create_team(data: TeamCreate, current_user: dict = Depends(get_current_user)):
    """Create a new team"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    if not has_permission(role, "team", "create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Verify department exists
    dept = await db.departments.find_one({"id": data.department_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    team_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    team_doc = {
        "id": team_id,
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.teams.insert_one(team_doc)
    team_doc.pop("_id", None)
    
    return TeamResponse(
        **team_doc,
        department_name=dept.get("name"),
        leader_name=None,
        user_count=0
    )

@router.get("/teams", response_model=List[TeamResponse])
async def get_teams(
    department_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get teams"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query: Dict[str, Any] = {}
    if department_id:
        query["department_id"] = department_id
    
    # If branch_id, get all departments in branch first
    if branch_id and not department_id:
        depts = await db.departments.find({"branch_id": branch_id}, {"_id": 0, "id": 1}).to_list(100)
        dept_ids = [d["id"] for d in depts]
        query["department_id"] = {"$in": dept_ids}
    
    teams = await db.teams.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for t in teams:
        user_count = await db.users.count_documents({"team_id": t["id"]})
        
        dept = await db.departments.find_one({"id": t["department_id"]}, {"_id": 0, "name": 1})
        dept_name = dept.get("name") if dept else None
        
        leader_name = None
        if t.get("leader_id"):
            leader = await db.users.find_one({"id": t["leader_id"]}, {"_id": 0, "full_name": 1})
            leader_name = leader.get("full_name") if leader else None
        
        result.append(TeamResponse(
            **t,
            department_name=dept_name,
            leader_name=leader_name,
            user_count=user_count
        ))
    
    return result

# ============================================
# ORGANIZATION TREE
# ============================================

@router.get("/organization/tree")
async def get_organization_tree(current_user: dict = Depends(get_current_user)):
    """Get full organization tree structure"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    # Build tree based on permission scope
    scope = get_permission_scope(role, "branch", "view")
    
    tree = []
    
    # Get companies (for system admin)
    if scope == PermissionScope.ALL.value:
        companies = await db.companies.find({}, {"_id": 0}).to_list(100)
    else:
        # Get user's company only
        user_company_id = current_user.get("company_id")
        if user_company_id:
            companies = await db.companies.find({"id": user_company_id}, {"_id": 0}).to_list(1)
        else:
            companies = []
    
    for company in companies:
        company_node = {
            "id": company["id"],
            "type": "company",
            "code": company.get("code"),
            "name": company.get("name"),
            "children": []
        }
        
        # Get branches
        if scope == PermissionScope.ALL.value:
            branch_query = {"company_id": company["id"]}
        elif scope == PermissionScope.BRANCH.value:
            branch_query = {"id": current_user.get("branch_id")}
        else:
            branch_query = {"id": current_user.get("branch_id")}
        
        branches = await db.branches.find(branch_query, {"_id": 0}).to_list(100)
        
        for branch in branches:
            branch_node = {
                "id": branch["id"],
                "type": "branch",
                "code": branch.get("code"),
                "name": branch.get("name"),
                "children": []
            }
            
            # Get departments
            departments = await db.departments.find({"branch_id": branch["id"]}, {"_id": 0}).to_list(100)
            
            for dept in departments:
                dept_node = {
                    "id": dept["id"],
                    "type": "department",
                    "code": dept.get("code"),
                    "name": dept.get("name"),
                    "children": []
                }
                
                # Get teams
                teams = await db.teams.find({"department_id": dept["id"]}, {"_id": 0}).to_list(100)
                
                for team in teams:
                    team_node = {
                        "id": team["id"],
                        "type": "team",
                        "code": team.get("code"),
                        "name": team.get("name"),
                        "user_count": await db.users.count_documents({"team_id": team["id"]})
                    }
                    dept_node["children"].append(team_node)
                
                branch_node["children"].append(dept_node)
            
            company_node["children"].append(branch_node)
        
        tree.append(company_node)
    
    return {"tree": tree}

# ============================================
# STANDARD DATA ENDPOINTS
# ============================================

@router.get("/standard/departments")
async def get_standard_departments():
    """Get list of standard departments for setup"""
    return {"departments": STANDARD_DEPARTMENTS}

@router.get("/standard/roles")
async def get_standard_roles():
    """Get list of standard roles for setup"""
    return {
        "roles": [
            {
                "code": role.value,
                "name": ROLE_CONFIG.get(role.value, {}).get("name", role.value),
                "name_vi": ROLE_CONFIG.get(role.value, {}).get("name_vi", role.value),
                "level": ROLE_CONFIG.get(role.value, {}).get("level", 5),
            }
            for role in SystemRole
        ]
    }

# ============================================
# OWNERSHIP TRACKING
# ============================================

@router.post("/ownership/transfer")
async def transfer_ownership(
    entity_type: str,
    entity_id: str,
    to_user_id: str,
    reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Transfer ownership of an entity"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    role = current_user.get("role", "")
    if role in LEGACY_ROLE_MAPPING:
        role = LEGACY_ROLE_MAPPING[role]
    
    # Check assign permission
    if not has_permission(role, entity_type, "assign"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get current owner
    collection = db[f"{entity_type}s"]  # leads, customers, etc.
    entity = await collection.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    current_owner = entity.get("assigned_to") or entity.get("current_owner") or entity.get("created_by")
    
    # Create transfer record
    transfer_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    transfer_doc = {
        "id": transfer_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "from_user_id": current_owner,
        "to_user_id": to_user_id,
        "transferred_by": current_user["id"],
        "transferred_at": now,
        "reason": reason
    }
    
    await db.ownership_transfers.insert_one(transfer_doc)
    
    # Update entity
    await collection.update_one(
        {"id": entity_id},
        {
            "$set": {
                "assigned_to": to_user_id,
                "current_owner": to_user_id,
                "assigned_at": now,
                "updated_at": now
            }
        }
    )
    
    transfer_doc.pop("_id", None)
    return transfer_doc

@router.get("/ownership/history/{entity_type}/{entity_id}")
async def get_ownership_history(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get ownership history for an entity"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    transfers = await db.ownership_transfers.find(
        {"entity_type": entity_type, "entity_id": entity_id},
        {"_id": 0}
    ).sort("transferred_at", -1).to_list(100)
    
    # Get current owner
    collection = db[f"{entity_type}s"]
    entity = await collection.find_one({"id": entity_id}, {"_id": 0})
    
    current_owner_id = None
    current_owner_name = None
    if entity:
        current_owner_id = entity.get("assigned_to") or entity.get("current_owner")
        if current_owner_id:
            owner = await db.users.find_one({"id": current_owner_id}, {"_id": 0, "full_name": 1})
            current_owner_name = owner.get("full_name") if owner else None
    
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "current_owner_id": current_owner_id,
        "current_owner_name": current_owner_name,
        "transfers": transfers
    }
