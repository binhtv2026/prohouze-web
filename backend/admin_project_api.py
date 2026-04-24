"""
ProHouzing Admin Project Management API
Full CRUD for managing project details including landing page content, 360 tours, price lists
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import jwt
import logging
import json

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

admin_project_router = APIRouter(prefix="/admin/projects", tags=["Admin Projects"])
security = HTTPBearer()

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("role") not in ["bod", "admin", "manager"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== MODELS ====================

class NearbyPlace(BaseModel):
    name: str
    distance: str
    icon: str = "Car"

class LocationInfo(BaseModel):
    address: str
    district: str
    city: str
    map_url: Optional[str] = None
    nearby_places: List[NearbyPlace] = []

class DeveloperInfo(BaseModel):
    name: str
    logo: Optional[str] = None
    description: Optional[str] = None
    projects: List[str] = []

class UnitType(BaseModel):
    name: str
    area: str
    bedrooms: int
    bathrooms: int
    price_from: float
    image: Optional[str] = None

class PriceListItem(BaseModel):
    block: str
    floor: str
    type: str
    area: str
    price: str
    status: str  # available, hold, sold

class PriceListSettings(BaseModel):
    enabled: bool = True
    last_updated: Optional[str] = None
    items: List[PriceListItem] = []

class PaymentMilestone(BaseModel):
    milestone: str
    percentage: int
    description: str

class VirtualTourSettings(BaseModel):
    enabled: bool = False
    url: Optional[str] = None
    thumbnail: Optional[str] = None

class View360Item(BaseModel):
    name: str
    url: str

class View360Settings(BaseModel):
    enabled: bool = False
    images: List[View360Item] = []

class VideoSettings(BaseModel):
    intro_url: Optional[str] = None
    youtube_url: Optional[str] = None

class AmenityItem(BaseModel):
    name: str
    icon: str
    category: str

class ProjectCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    slogan: Optional[str] = None
    location: LocationInfo
    type: str  # apartment, villa, townhouse
    price_from: float
    price_to: Optional[float] = None
    status: str = "opening"  # opening, coming_soon, sold_out
    developer: DeveloperInfo
    description: str
    highlights: List[str] = []
    amenities: List[AmenityItem] = []
    images: List[str] = []
    videos: VideoSettings = VideoSettings()
    virtual_tour: VirtualTourSettings = VirtualTourSettings()
    view_360: View360Settings = View360Settings()
    units_total: int = 0
    units_available: int = 0
    area_range: str = ""
    completion_date: Optional[str] = None
    is_hot: bool = False
    unit_types: List[UnitType] = []
    price_list: PriceListSettings = PriceListSettings()
    payment_schedule: List[PaymentMilestone] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    slogan: Optional[str] = None
    location: Optional[LocationInfo] = None
    type: Optional[str] = None
    price_from: Optional[float] = None
    price_to: Optional[float] = None
    status: Optional[str] = None
    developer: Optional[DeveloperInfo] = None
    description: Optional[str] = None
    highlights: Optional[List[str]] = None
    amenities: Optional[List[AmenityItem]] = None
    images: Optional[List[str]] = None
    videos: Optional[VideoSettings] = None
    virtual_tour: Optional[VirtualTourSettings] = None
    view_360: Optional[View360Settings] = None
    units_total: Optional[int] = None
    units_available: Optional[int] = None
    area_range: Optional[str] = None
    completion_date: Optional[str] = None
    is_hot: Optional[bool] = None
    unit_types: Optional[List[UnitType]] = None
    price_list: Optional[PriceListSettings] = None
    payment_schedule: Optional[List[PaymentMilestone]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    slogan: Optional[str] = None
    location: Dict[str, Any]
    type: str
    price_from: float
    price_to: Optional[float] = None
    status: str
    developer: Dict[str, Any]
    description: str
    highlights: List[str]
    amenities: List[Dict[str, Any]]
    images: List[str]
    videos: Dict[str, Any]
    virtual_tour: Dict[str, Any]
    view_360: Dict[str, Any]
    units_total: int
    units_available: int
    area_range: str
    completion_date: Optional[str] = None
    is_hot: bool
    unit_types: List[Dict[str, Any]]
    price_list: Dict[str, Any]
    payment_schedule: List[Dict[str, Any]]
    created_at: str
    updated_at: str
    created_by: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    import re
    # Remove accents and special chars
    slug = name.lower()
    # Vietnamese to ASCII mapping (simplified)
    replacements = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
    }
    for vn, ascii_char in replacements.items():
        slug = slug.replace(vn, ascii_char)
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

# ==================== CRUD ROUTES ====================

@admin_project_router.get("", response_model=List[ProjectResponse])
async def get_all_projects(
    status: Optional[str] = None,
    type: Optional[str] = None,
    is_hot: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    """Get all projects with filters"""
    query: Dict[str, Any] = {}
    
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    if is_hot is not None:
        query["is_hot"] = is_hot
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location.city": {"$regex": search, "$options": "i"}}
        ]
    
    projects = await db.admin_projects.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [ProjectResponse(**p) for p in projects]

@admin_project_router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_admin)):
    """Get single project details"""
    project = await db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(**project)

@admin_project_router.post("", response_model=ProjectResponse)
async def create_project(data: ProjectCreate, current_user: dict = Depends(get_current_admin)):
    """Create new project"""
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    slug = data.slug or generate_slug(data.name)
    
    # Check slug uniqueness
    existing = await db.admin_projects.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{project_id[:8]}"
    
    project_doc = {
        "id": project_id,
        "name": data.name,
        "slug": slug,
        "slogan": data.slogan,
        "location": data.location.model_dump(),
        "type": data.type,
        "price_from": data.price_from,
        "price_to": data.price_to,
        "status": data.status,
        "developer": data.developer.model_dump(),
        "description": data.description,
        "highlights": data.highlights,
        "amenities": [a.model_dump() for a in data.amenities],
        "images": data.images,
        "videos": data.videos.model_dump(),
        "virtual_tour": data.virtual_tour.model_dump(),
        "view_360": data.view_360.model_dump(),
        "units_total": data.units_total,
        "units_available": data.units_available,
        "area_range": data.area_range,
        "completion_date": data.completion_date,
        "is_hot": data.is_hot,
        "unit_types": [u.model_dump() for u in data.unit_types],
        "price_list": data.price_list.model_dump(),
        "payment_schedule": [p.model_dump() for p in data.payment_schedule],
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.admin_projects.insert_one(project_doc)
    
    logger.info(f"Project created: {data.name} by {current_user['full_name']}")
    
    return ProjectResponse(**project_doc)

@admin_project_router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, data: ProjectUpdate, current_user: dict = Depends(get_current_admin)):
    """Update project"""
    project = await db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    # Only update provided fields
    if data.name is not None:
        update_data["name"] = data.name
    if data.slug is not None:
        update_data["slug"] = data.slug
    if data.slogan is not None:
        update_data["slogan"] = data.slogan
    if data.location is not None:
        update_data["location"] = data.location.model_dump()
    if data.type is not None:
        update_data["type"] = data.type
    if data.price_from is not None:
        update_data["price_from"] = data.price_from
    if data.price_to is not None:
        update_data["price_to"] = data.price_to
    if data.status is not None:
        update_data["status"] = data.status
    if data.developer is not None:
        update_data["developer"] = data.developer.model_dump()
    if data.description is not None:
        update_data["description"] = data.description
    if data.highlights is not None:
        update_data["highlights"] = data.highlights
    if data.amenities is not None:
        update_data["amenities"] = [a.model_dump() for a in data.amenities]
    if data.images is not None:
        update_data["images"] = data.images
    if data.videos is not None:
        update_data["videos"] = data.videos.model_dump()
    if data.virtual_tour is not None:
        update_data["virtual_tour"] = data.virtual_tour.model_dump()
    if data.view_360 is not None:
        update_data["view_360"] = data.view_360.model_dump()
    if data.units_total is not None:
        update_data["units_total"] = data.units_total
    if data.units_available is not None:
        update_data["units_available"] = data.units_available
    if data.area_range is not None:
        update_data["area_range"] = data.area_range
    if data.completion_date is not None:
        update_data["completion_date"] = data.completion_date
    if data.is_hot is not None:
        update_data["is_hot"] = data.is_hot
    if data.unit_types is not None:
        update_data["unit_types"] = [u.model_dump() for u in data.unit_types]
    if data.price_list is not None:
        update_data["price_list"] = data.price_list.model_dump()
    if data.payment_schedule is not None:
        update_data["payment_schedule"] = [p.model_dump() for p in data.payment_schedule]
    
    await db.admin_projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated_project = await db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    
    logger.info(f"Project updated: {project_id} by {current_user['full_name']}")
    
    return ProjectResponse(**updated_project)

@admin_project_router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete project"""
    project = await db.admin_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.admin_projects.delete_one({"id": project_id})
    
    logger.info(f"Project deleted: {project_id} by {current_user['full_name']}")
    
    return {"success": True, "message": "Project deleted"}

# ==================== SPECIALIZED UPDATE ROUTES ====================

@admin_project_router.put("/{project_id}/price-list")
async def update_price_list(project_id: str, data: PriceListSettings, current_user: dict = Depends(get_current_admin)):
    """Update only price list settings"""
    project = await db.admin_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {
        "price_list": data.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_projects.update_one({"id": project_id}, {"$set": update_data})
    
    return {"success": True, "message": "Price list updated"}

@admin_project_router.put("/{project_id}/virtual-tour")
async def update_virtual_tour(project_id: str, data: VirtualTourSettings, current_user: dict = Depends(get_current_admin)):
    """Update virtual tour settings"""
    project = await db.admin_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {
        "virtual_tour": data.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_projects.update_one({"id": project_id}, {"$set": update_data})
    
    return {"success": True, "message": "Virtual tour updated"}

@admin_project_router.put("/{project_id}/view-360")
async def update_view_360(project_id: str, data: View360Settings, current_user: dict = Depends(get_current_admin)):
    """Update 360 view settings"""
    project = await db.admin_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {
        "view_360": data.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_projects.update_one({"id": project_id}, {"$set": update_data})
    
    return {"success": True, "message": "360 view updated"}

@admin_project_router.put("/{project_id}/toggle-hot")
async def toggle_hot_status(project_id: str, current_user: dict = Depends(get_current_admin)):
    """Toggle hot status"""
    project = await db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_status = not project.get("is_hot", False)
    
    await db.admin_projects.update_one(
        {"id": project_id},
        {"$set": {"is_hot": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "is_hot": new_status}

@admin_project_router.put("/{project_id}/toggle-price-list")
async def toggle_price_list_visibility(project_id: str, current_user: dict = Depends(get_current_admin)):
    """Toggle price list visibility"""
    project = await db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    current_enabled = project.get("price_list", {}).get("enabled", True)
    new_status = not current_enabled
    
    await db.admin_projects.update_one(
        {"id": project_id},
        {"$set": {
            "price_list.enabled": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "price_list_enabled": new_status}

# ==================== STATS ====================

@admin_project_router.get("/stats/overview")
async def get_projects_stats(current_user: dict = Depends(get_current_admin)):
    """Get overview statistics for projects"""
    total = await db.admin_projects.count_documents({})
    opening = await db.admin_projects.count_documents({"status": "opening"})
    coming_soon = await db.admin_projects.count_documents({"status": "coming_soon"})
    sold_out = await db.admin_projects.count_documents({"status": "sold_out"})
    hot_projects = await db.admin_projects.count_documents({"is_hot": True})
    
    # Type breakdown
    type_stats = await db.admin_projects.aggregate([
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    return {
        "total": total,
        "opening": opening,
        "coming_soon": coming_soon,
        "sold_out": sold_out,
        "hot_projects": hot_projects,
        "by_type": {t["_id"]: t["count"] for t in type_stats}
    }
