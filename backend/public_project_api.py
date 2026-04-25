"""
ProHouze — Public Project API (Website)
Endpoints công khai, không cần xác thực
Phục vụ: ProjectLandingPage, ProjectsListPage, LandingPage
"""

from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
import os
import logging

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')
_client = AsyncIOMotorClient(mongo_url)
_db = _client[db_name]

public_project_router = APIRouter(prefix="/projects", tags=["Public Projects"])


def _clean(project: dict) -> dict:
    """Remove MongoDB _id and internal fields"""
    project.pop("_id", None)
    return project


@public_project_router.get("", summary="Danh sách dự án công khai")
async def list_projects(
    status: Optional[str] = Query(None, description="opening|coming_soon|sold_out"),
    type: Optional[str] = Query(None, description="apartment|villa|mixed|shophouse"),
    city: Optional[str] = Query(None),
    is_hot: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
):
    """
    Lấy danh sách dự án để hiển thị trên website.
    Không cần xác thực.
    """
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    if is_hot is not None:
        query["is_hot"] = is_hot
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"location.city": {"$regex": search, "$options": "i"}},
            {"location.district": {"$regex": search, "$options": "i"}},
        ]

    cursor = _db.admin_projects.find(query, {"_id": 0}).sort("is_hot", -1).skip(skip).limit(limit)
    projects = await cursor.to_list(limit)

    return {
        "total": await _db.admin_projects.count_documents(query),
        "skip": skip,
        "limit": limit,
        "data": projects,
    }


@public_project_router.get("/featured", summary="Dự án nổi bật cho trang chủ")
async def get_featured_projects(limit: int = Query(6, le=20)):
    """Top dự án hot cho homepage hero section"""
    cursor = _db.admin_projects.find(
        {"is_hot": True, "status": {"$ne": "sold_out"}},
        {"_id": 0, "id": 1, "name": 1, "slug": 1, "slogan": 1,
         "location": 1, "type": 1, "price_from": 1, "status": 1,
         "images": 1, "area_range": 1, "completion_date": 1, "is_hot": 1}
    ).sort("created_at", -1).limit(limit)

    return await cursor.to_list(limit)


@public_project_router.get("/slug/{slug}", summary="Chi tiết dự án theo slug")
async def get_project_by_slug(slug: str):
    """
    Lấy chi tiết đầy đủ của dự án theo slug.
    Dùng trong ProjectLandingPage.
    """
    project = await _db.admin_projects.find_one({"slug": slug}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{slug}' not found")
    return project


@public_project_router.get("/{project_id}", summary="Chi tiết dự án theo ID")
async def get_project_by_id(project_id: str):
    """Lấy chi tiết theo ID"""
    project = await _db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@public_project_router.get("/stats/summary", summary="Thống kê tóm tắt")
async def get_project_stats():
    """Thống kê dùng cho widget trên trang chủ"""
    total = await _db.admin_projects.count_documents({})
    opening = await _db.admin_projects.count_documents({"status": "opening"})
    coming_soon = await _db.admin_projects.count_documents({"status": "coming_soon"})
    hot = await _db.admin_projects.count_documents({"is_hot": True})

    return {
        "total": total,
        "opening": opening,
        "coming_soon": coming_soon,
        "hot": hot,
    }
