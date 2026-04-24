"""
ProHouzing Website API - Public endpoints for the corporate website
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

# MongoDB connection - reuse from main server
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

website_router = APIRouter(prefix="/website", tags=["Website"])

# ==================== MODELS ====================

class ContactFormRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    project_interest: Optional[str] = None
    source_page: Optional[str] = "contact"  # landing, contact, project-detail

class ContactFormResponse(BaseModel):
    success: bool
    message: str
    lead_id: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    location: str
    type: str  # apartment, villa, townhouse
    price_from: float
    price_to: Optional[float] = None
    status: str  # opening, coming_soon, sold_out
    developer: str
    description: str
    highlights: List[str]
    amenities: List[str]
    images: List[str]
    units_total: int
    units_available: int
    area_range: str
    completion_date: Optional[str] = None
    is_hot: bool = False
    created_at: str

class NewsArticleResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    image: str
    author: str
    views: int
    published_at: str
    is_featured: bool = False

class CareerPositionResponse(BaseModel):
    id: str
    title: str
    department: str
    location: str
    type: str  # full-time, part-time
    salary_range: str
    description: str
    requirements: List[str]
    benefits: List[str]
    openings: int
    is_hot: bool = False
    is_urgent: bool = False
    created_at: str

class JobApplicationRequest(BaseModel):
    position_id: str
    full_name: str
    email: EmailStr
    phone: str
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None

class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None

# ==================== CONTACT FORM API ====================

@website_router.post("/contact", response_model=ContactFormResponse)
async def submit_contact_form(data: ContactFormRequest):
    """
    Submit contact form from website - creates a new lead in CRM
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        lead_id = str(uuid.uuid4())
        
        # Determine subject mapping
        subject_mapping = {
            "buy": "Mua bất động sản",
            "sell": "Bán bất động sản", 
            "rent": "Thuê bất động sản",
            "invest": "Tư vấn đầu tư",
            "other": "Khác"
        }
        
        # Create lead document
        lead_doc = {
            "id": lead_id,
            "full_name": data.name,
            "phone": data.phone,
            "email": data.email,
            "channel": "website",
            "channel_id": None,
            "source_content_id": None,
            "source_campaign_id": None,
            "status": "new",
            "segment": "standard",
            "project_interest": data.project_interest,
            "product_interest": subject_mapping.get(data.subject, data.subject),
            "budget_min": None,
            "budget_max": None,
            "location": None,
            "notes": data.message,
            "tags": ["website_contact_form", f"source_{data.source_page}"],
            "raw_message": f"Subject: {data.subject}\nMessage: {data.message}",
            "assigned_to": None,
            "assigned_at": None,
            "assignment_reason": None,
            "branch_id": None,
            "score": 15,  # Base score for website leads
            "created_at": now,
            "updated_at": now,
            "created_by": "website",
            "last_activity": now,
            "follow_up_count": 0,
            "is_duplicate": False,
            "merged_from": [],
            "referrer_id": None,
            "referrer_type": None
        }
        
        # Check for duplicate by phone
        existing = await db.leads.find_one({"phone": data.phone})
        if existing:
            # Update existing lead with new info
            update_data = {
                "updated_at": now,
                "last_activity": now,
                "notes": f"{existing.get('notes', '')}\n\n[{now}] New contact from website: {data.message}"
            }
            if data.email and not existing.get("email"):
                update_data["email"] = data.email
            
            await db.leads.update_one({"id": existing["id"]}, {"$set": update_data})
            
            return ContactFormResponse(
                success=True,
                message="Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm nhất.",
                lead_id=existing["id"]
            )
        
        # Insert new lead
        await db.leads.insert_one(lead_doc)
        
        # Log activity
        activity_doc = {
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "customer_id": None,
            "user_id": "website",
            "type": "note",
            "title": "Lead tạo từ Website",
            "content": f"Form liên hệ từ trang {data.source_page}. Subject: {data.subject}",
            "outcome": None,
            "is_auto": True,
            "created_at": now
        }
        await db.activities.insert_one(activity_doc)
        
        # Create follow-up task for new lead
        task_doc = {
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "title": f"Liên hệ lead mới từ website: {data.name}",
            "description": f"Lead đăng ký qua form liên hệ. Subject: {data.subject}\nMessage: {data.message}",
            "type": "call",
            "status": "pending",
            "due_date": now,  # Due immediately
            "priority": "high",
            "assigned_to": None,
            "created_by": "system",
            "created_at": now,
            "is_auto": True
        }
        await db.tasks.insert_one(task_doc)
        
        return ContactFormResponse(
            success=True,
            message="Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ liên hệ trong vòng 24 giờ.",
            lead_id=lead_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting form: {str(e)}")

# ==================== PROJECTS API ====================

@website_router.get("/projects-detail/{project_id}")
async def get_project_detail_full(project_id: str):
    """Get full project details from database (public API for frontend)"""
    # Try to find by ID first
    project = await db.admin_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        # Try to find by slug
        project = await db.admin_projects.find_one({"slug": project_id}, {"_id": 0})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project

@website_router.get("/projects-list")
async def get_projects_list_full(
    type: Optional[str] = None,
    status: Optional[str] = None,
    is_hot: Optional[bool] = None,
    limit: int = 50
):
    """Get all projects from database (public API for frontend)"""
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if is_hot is not None:
        query["is_hot"] = is_hot
    
    projects = await db.admin_projects.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return projects

@website_router.get("/projects", response_model=List[ProjectResponse])
async def get_website_projects(
    type: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    is_hot: Optional[bool] = None,
    limit: int = 20
):
    """Get projects for website display - combines database and sample data"""
    
    # First, try to get projects from database
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if is_hot is not None:
        query["is_hot"] = is_hot
    
    db_projects = await db.admin_projects.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Transform DB projects to match ProjectResponse format
    transformed_projects = []
    for p in db_projects:
        transformed_projects.append({
            "id": p.get("id"),
            "name": p.get("name"),
            "slug": p.get("slug"),
            "location": p.get("location", {}).get("address", ""),
            "type": p.get("type", "apartment"),
            "price_from": p.get("price_from", 0),
            "price_to": p.get("price_to"),
            "status": p.get("status", "opening"),
            "developer": p.get("developer", {}).get("name", ""),
            "description": p.get("description", ""),
            "highlights": p.get("highlights", []),
            "amenities": [a.get("name") for a in p.get("amenities", [])],
            "images": p.get("images", []),
            "units_total": p.get("units_total", 0),
            "units_available": p.get("units_available", 0),
            "area_range": p.get("area_range", ""),
            "completion_date": p.get("completion_date"),
            "is_hot": p.get("is_hot", False),
            "created_at": p.get("created_at", datetime.now(timezone.utc).isoformat())
        })
    
    # If we have enough projects from DB, return them
    if len(transformed_projects) >= limit:
        return [ProjectResponse(**p) for p in transformed_projects[:limit]]
    
    # Otherwise, add sample projects to fill the gap
    sample_projects = [
        {
            "id": "1",
            "name": "Vinhomes Grand Park",
            "slug": "vinhomes-grand-park",
            "location": "Quận 9, TP.HCM",
            "type": "apartment",
            "price_from": 2500000000,
            "price_to": 8000000000,
            "status": "opening",
            "developer": "Vingroup",
            "description": "Đại đô thị đẳng cấp phía Đông Sài Gòn với hệ sinh thái tiện ích toàn diện.",
            "highlights": ["Đại công viên 36ha", "Hồ cảnh quan 24ha", "Safari trong đô thị"],
            "amenities": ["Hồ bơi", "Gym", "Công viên", "Trường học", "Bệnh viện"],
            "images": ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"],
            "units_total": 5000,
            "units_available": 120,
            "area_range": "50-120 m²",
            "completion_date": "Q4/2025",
            "is_hot": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "2",
            "name": "The Global City",
            "slug": "the-global-city",
            "location": "Thủ Đức, TP.HCM",
            "type": "villa",
            "price_from": 15000000000,
            "price_to": 50000000000,
            "status": "opening",
            "developer": "Masterise Homes",
            "description": "Khu đô thị quốc tế đẳng cấp với thiết kế mang tầm vóc thế giới.",
            "highlights": ["Thiết kế biệt thự đẳng cấp", "View sông Sài Gòn", "An ninh 24/7"],
            "amenities": ["Club house", "Sân golf mini", "Spa", "Nhà hàng", "Marina"],
            "images": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
            "units_total": 500,
            "units_available": 80,
            "area_range": "200-500 m²",
            "completion_date": "Q2/2026",
            "is_hot": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "3",
            "name": "Masteri Centre Point",
            "slug": "masteri-centre-point",
            "location": "Quận 9, TP.HCM",
            "type": "apartment",
            "price_from": 3200000000,
            "price_to": 6000000000,
            "status": "coming_soon",
            "developer": "Masterise Homes",
            "description": "Căn hộ cao cấp với tiện ích đẳng cấp và vị trí đắc địa.",
            "highlights": ["Trung tâm thương mại", "Sky bar", "Infinity pool"],
            "amenities": ["Hồ bơi tràn", "Gym", "Sauna", "BBQ", "Kids zone"],
            "images": ["https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800"],
            "units_total": 2000,
            "units_available": 200,
            "area_range": "45-95 m²",
            "completion_date": "Q1/2026",
            "is_hot": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "4",
            "name": "Eaton Park",
            "slug": "eaton-park",
            "location": "Quận 2, TP.HCM",
            "type": "apartment",
            "price_from": 8000000000,
            "price_to": 15000000000,
            "status": "opening",
            "developer": "Gamuda Land",
            "description": "Căn hộ resort giữa lòng thành phố với không gian sống xanh.",
            "highlights": ["Công viên ven sông", "Bến du thuyền", "Thiết kế Singapore"],
            "amenities": ["Hồ bơi", "Tennis", "Yoga", "Library", "Co-working"],
            "images": ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
            "units_total": 1500,
            "units_available": 150,
            "area_range": "80-180 m²",
            "completion_date": "Q3/2025",
            "is_hot": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "5",
            "name": "The Beverly",
            "slug": "the-beverly",
            "location": "Quận 9, TP.HCM",
            "type": "apartment",
            "price_from": 4500000000,
            "price_to": 9000000000,
            "status": "opening",
            "developer": "Vingroup",
            "description": "Phân khu căn hộ đẳng cấp trong lòng Vinhomes Grand Park.",
            "highlights": ["View đại công viên", "Hồ điều hòa", "Clubhouse riêng"],
            "amenities": ["Sky lounge", "Hồ bơi vô cực", "Gym", "Spa", "BBQ"],
            "images": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
            "units_total": 3000,
            "units_available": 180,
            "area_range": "55-120 m²",
            "completion_date": "Q4/2025",
            "is_hot": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "6",
            "name": "Lumière Boulevard",
            "slug": "lumiere-boulevard",
            "location": "Quận 7, TP.HCM",
            "type": "apartment",
            "price_from": 6000000000,
            "price_to": 12000000000,
            "status": "opening",
            "developer": "Masterise Homes",
            "description": "Căn hộ ánh sáng với thiết kế châu Âu đẳng cấp.",
            "highlights": ["Boulevard trung tâm", "Kiến trúc Pháp", "Nội thất cao cấp"],
            "amenities": ["Hồ bơi", "Gym", "Spa", "Restaurant", "Cinema"],
            "images": ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"],
            "units_total": 1000,
            "units_available": 100,
            "area_range": "70-150 m²",
            "completion_date": "Q2/2026",
            "is_hot": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "7",
            "name": "Aqua City",
            "slug": "aqua-city",
            "location": "Đồng Nai",
            "type": "townhouse",
            "price_from": 6800000000,
            "price_to": 15000000000,
            "status": "opening",
            "developer": "Novaland",
            "description": "Đô thị sinh thái thông minh với không gian sống xanh bền vững.",
            "highlights": ["70% diện tích cây xanh", "Hệ thống kênh đào", "Smart city"],
            "amenities": ["Trường quốc tế", "Bệnh viện", "Trung tâm thương mại", "Công viên"],
            "images": ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
            "units_total": 4000,
            "units_available": 250,
            "area_range": "100-200 m²",
            "completion_date": "Q1/2026",
            "is_hot": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "8",
            "name": "King Crown Infinity",
            "slug": "king-crown-infinity",
            "location": "Thủ Đức, TP.HCM",
            "type": "apartment",
            "price_from": 5200000000,
            "price_to": 10000000000,
            "status": "coming_soon",
            "developer": "BCG Land",
            "description": "Tổ hợp căn hộ cao cấp với tiện ích đỉnh cao.",
            "highlights": ["Infinity pool tầng 50", "Sky garden", "Rooftop bar"],
            "amenities": ["Hồ bơi", "Gym", "Cinema", "Library", "Kids zone"],
            "images": ["https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800"],
            "units_total": 900,
            "units_available": 90,
            "area_range": "65-130 m²",
            "completion_date": "Q3/2026",
            "is_hot": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Apply filters
    filtered = sample_projects
    if type:
        filtered = [p for p in filtered if p["type"] == type]
    if status:
        filtered = [p for p in filtered if p["status"] == status]
    if is_hot is not None:
        filtered = [p for p in filtered if p["is_hot"] == is_hot]
    
    # Combine DB projects with sample, removing duplicates by slug
    db_slugs = {p["slug"] for p in transformed_projects}
    for p in filtered:
        if p["slug"] not in db_slugs:
            transformed_projects.append(p)
    
    return [ProjectResponse(**p) for p in transformed_projects[:limit]]

@website_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_detail(project_id: str):
    """Get single project details"""
    projects = await get_website_projects()
    project = next((p for p in projects if p.id == project_id or getattr(p, 'slug', '') == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# ==================== NEWS API ====================

@website_router.get("/news", response_model=List[NewsArticleResponse])
async def get_website_news(
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    limit: int = 20
):
    """Get news articles for website from database"""
    query = {"is_published": True}
    if category:
        query["category"] = category
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    cursor = db.news.find(query, {"_id": 0}).sort("published_at", -1).limit(limit)
    news = await cursor.to_list(length=limit)
    
    # If no news in DB, return sample data
    if not news:
        sample_news = [
            {
                "id": "1",
                "title": "Thị trường BĐS TP.HCM năm 2026: Dự báo tăng trưởng 15%",
                "slug": "thi-truong-bds-tphcm-2026",
                "excerpt": "Theo các chuyên gia, thị trường bất động sản TP.HCM sẽ có sự phục hồi mạnh mẽ trong năm 2026.",
                "content": "Nội dung chi tiết về dự báo thị trường...",
                "category": "market",
                "image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
                "author": "Admin",
                "views": 1250,
                "published_at": "2025-12-10T00:00:00Z",
                "is_featured": True
            },
            {
                "id": "2",
                "title": "Vinhomes Grand Park mở bán giai đoạn 3",
                "slug": "vinhomes-grand-park-mo-ban-gd3",
                "excerpt": "Vinhomes Grand Park chính thức mở bán giai đoạn 3 với chính sách ưu đãi.",
                "content": "Chi tiết về đợt mở bán...",
                "category": "project",
                "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
                "author": "Nguyễn Văn A",
                "views": 850,
                "published_at": "2025-12-09T00:00:00Z",
                "is_featured": True
            },
            {
                "id": "3",
                "title": "5 điều cần biết trước khi mua căn hộ lần đầu",
                "slug": "5-dieu-can-biet-mua-can-ho",
                "excerpt": "Mua nhà là quyết định lớn đòi hỏi sự chuẩn bị kỹ lưỡng.",
                "content": "Hướng dẫn chi tiết...",
                "category": "tips",
                "image": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
                "author": "Trần Thị B",
                "views": 2100,
                "published_at": "2025-12-08T00:00:00Z",
                "is_featured": False
            }
        ]
        filtered = sample_news
        if category:
            filtered = [n for n in filtered if n["category"] == category]
        if is_featured is not None:
            filtered = [n for n in filtered if n["is_featured"] == is_featured]
        return [NewsArticleResponse(**n) for n in filtered[:limit]]
    
    return news

@website_router.get("/news/{news_id}")
async def get_news_detail(news_id: str):
    """Get single news article and increment views"""
    news = await db.news.find_one({"id": news_id, "is_published": True}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    # Increment views
    await db.news.update_one({"id": news_id}, {"$inc": {"views": 1}})
    
    return news

# ==================== CAREERS API ====================

@website_router.get("/careers", response_model=List[CareerPositionResponse])
async def get_career_positions(
    department: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 20
):
    """Get career positions for website from database"""
    query = {"is_active": True}
    if department:
        query["department"] = department
    
    cursor = db.careers.find(query, {"_id": 0}).sort([("is_urgent", -1), ("is_hot", -1), ("created_at", -1)]).limit(limit)
    positions = await cursor.to_list(length=limit)
    
    # Map salary_display to salary_range for compatibility
    for pos in positions:
        if "salary_display" in pos and "salary_range" not in pos:
            pos["salary_range"] = pos["salary_display"]
    
    # If no careers in DB, return sample data
    if not positions:
        sample_positions = [
            {
                "id": "1",
                "title": "Chuyên viên Tư vấn BĐS",
                "department": "Kinh doanh",
                "location": "TP.HCM, Hà Nội, Đà Nẵng",
                "type": "full-time",
                "salary_range": "15-50 triệu",
                "description": "Tư vấn và bán sản phẩm bất động sản cho khách hàng.",
                "requirements": ["Tốt nghiệp Đại học", "Kỹ năng giao tiếp tốt", "Chịu được áp lực"],
                "benefits": ["Lương cơ bản + hoa hồng", "Bảo hiểm sức khỏe", "Đào tạo chuyên sâu"],
                "openings": 20,
                "is_hot": True,
                "is_urgent": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "2",
                "title": "Trưởng nhóm Kinh doanh",
                "department": "Kinh doanh",
                "location": "TP.HCM, Hà Nội",
                "type": "full-time",
                "salary_range": "30-80 triệu",
                "description": "Quản lý đội ngũ sales và đạt target kinh doanh.",
                "requirements": ["3+ năm kinh nghiệm BĐS", "Kỹ năng lãnh đạo", "Có đội ngũ sẵn là lợi thế"],
                "benefits": ["Lương thưởng hấp dẫn", "Cơ hội thăng tiến", "Du lịch hàng năm"],
                "openings": 5,
                "is_hot": True,
                "is_urgent": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        filtered = sample_positions
        if department:
            filtered = [p for p in filtered if p["department"] == department]
        return [CareerPositionResponse(**p) for p in filtered[:limit]]
    
    return positions

# --- Career Detail & Job Application ---
@website_router.get("/careers/{career_id}")
async def get_career_detail(career_id: str):
    """Get single career position detail"""
    career = await db.careers.find_one({"id": career_id, "is_active": True}, {"_id": 0})
    if not career:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Map salary_display to salary_range for compatibility
    if "salary_display" in career and "salary_range" not in career:
        career["salary_range"] = career["salary_display"]
    
    return career

class JobApplicationCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    cv_url: Optional[str] = None
    cover_letter: Optional[str] = None
    position_id: str
    position_title: str

@website_router.post("/careers/{career_id}/apply")
async def apply_for_job(career_id: str, data: JobApplicationCreate):
    """Submit job application"""
    # Check if position exists (allow 'general' for general applications)
    if career_id != "general":
        career = await db.careers.find_one({"id": career_id})
        if not career:
            raise HTTPException(status_code=404, detail="Position not found")
    
    now = datetime.now(timezone.utc).isoformat()
    application_id = str(uuid.uuid4())
    
    application_doc = {
        "id": application_id,
        "position_id": career_id,
        "position_title": data.position_title,
        "full_name": data.full_name,
        "email": data.email,
        "phone": data.phone,
        "cv_url": data.cv_url,
        "cover_letter": data.cover_letter,
        "status": "pending",  # pending, reviewing, interviewed, hired, rejected
        "notes": "",
        "created_at": now,
        "updated_at": now
    }
    
    await db.job_applications.insert_one(application_doc)
    
    # Create notification for admin
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "type": "job_application",
        "title": f"Ứng viên mới: {data.position_title}",
        "message": f"{data.full_name} ({data.email}) đã ứng tuyển vị trí {data.position_title}",
        "data": {
            "application_id": application_id,
            "position_id": career_id,
            "applicant_name": data.full_name,
            "applicant_email": data.email,
            "applicant_phone": data.phone
        },
        "is_read": False,
        "created_at": now
    })
    
    return {
        "success": True,
        "message": "Application submitted successfully",
        "application_id": application_id
    }

# ==================== TESTIMONIALS API ====================

@website_router.get("/testimonials")
async def get_testimonials(limit: int = 10):
    """Get testimonials for website from database"""
    cursor = db.testimonials.find({"is_active": True}, {"_id": 0}).sort("order", 1).limit(limit)
    testimonials = await cursor.to_list(length=limit)
    
    # If no testimonials in DB, return sample data
    if not testimonials:
        return [
            {
                "id": "1",
                "name": "Nguyễn Văn Minh",
                "role": "Khách hàng mua căn hộ",
                "avatar": "https://randomuser.me/api/portraits/men/32.jpg",
                "content": "Tôi rất hài lòng với dịch vụ của ProHouzing. Đội ngũ tư vấn chuyên nghiệp, giúp tôi tìm được căn hộ ưng ý với giá tốt nhất.",
                "rating": 5,
                "project": "Vinhomes Grand Park"
            },
            {
                "id": "2",
                "name": "Trần Thị Hương",
                "role": "Nhà đầu tư BĐS",
                "avatar": "https://randomuser.me/api/portraits/women/44.jpg",
                "content": "Đã đầu tư nhiều dự án qua ProHouzing, tất cả đều sinh lời tốt. Thông tin cập nhật nhanh, chính xác.",
                "rating": 5,
                "project": "The Metropole"
            },
            {
                "id": "3",
                "name": "Lê Hoàng Nam",
                "role": "CTV bán hàng",
                "avatar": "https://randomuser.me/api/portraits/men/67.jpg",
                "content": "Làm CTV cho ProHouzing được 2 năm, thu nhập tăng gấp 3 lần. Hoa hồng cao, thanh toán nhanh.",
                "rating": 5,
                "project": "Masteri Centre Point"
            },
            {
                "id": "4",
                "name": "Phạm Thị Mai",
                "role": "Đại lý chính thức",
                "avatar": "https://randomuser.me/api/portraits/women/65.jpg",
                "content": "ProHouzing là đối tác đáng tin cậy. Hệ thống CRM chuyên nghiệp, leads chất lượng.",
                "rating": 5,
                "project": "Eaton Park"
            }
        ]
    
    return testimonials

# ==================== PARTNERS API ====================

@website_router.get("/partners")
async def get_partners(category: Optional[str] = None, limit: int = 20):
    """Get partners for website from database"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    cursor = db.partners.find(query, {"_id": 0}).sort("order", 1).limit(limit)
    partners = await cursor.to_list(length=limit)
    
    # If no partners in DB, return sample data
    if not partners:
        return [
            {"id": "1", "name": "Vinhomes", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Vinhomes_logo.svg/200px-Vinhomes_logo.svg.png", "category": "developer"},
            {"id": "2", "name": "Masterise", "logo": "https://masteri.com.vn/wp-content/uploads/2021/05/logo-masterise-homes.png", "category": "developer"},
            {"id": "3", "name": "Novaland", "logo": "https://novaland.com.vn/Data/Sites/1/News/4728/logo-novaland-01.png", "category": "developer"},
            {"id": "4", "name": "Capitaland", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/CapitaLand_logo.svg/200px-CapitaLand_logo.svg.png", "category": "developer"},
            {"id": "5", "name": "Khang Điền", "logo": "https://khangdien.com.vn/wp-content/uploads/2022/01/logo-khang-dien.png", "category": "developer"},
            {"id": "6", "name": "Nam Long", "logo": "https://namlonggroup.com.vn/wp-content/uploads/2019/03/logo-nam-long.png", "category": "developer"}
        ]
    
    return partners

@website_router.post("/careers/apply")
async def apply_for_job(data: JobApplicationRequest):
    """Submit job application"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        application_doc = {
            "id": str(uuid.uuid4()),
            "position_id": data.position_id,
            "full_name": data.full_name,
            "email": data.email,
            "phone": data.phone,
            "cv_url": data.cv_url,
            "cover_letter": data.cover_letter,
            "status": "pending",
            "created_at": now
        }
        
        await db.job_applications.insert_one(application_doc)
        
        return {
            "success": True,
            "message": "Ứng tuyển thành công! Chúng tôi sẽ liên hệ bạn sớm nhất."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== NEWSLETTER API ====================

@website_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribeRequest):
    """Subscribe to newsletter"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Check existing
        existing = await db.newsletter_subscribers.find_one({"email": data.email})
        if existing:
            return {"success": True, "message": "Bạn đã đăng ký nhận tin trước đó!"}
        
        subscriber_doc = {
            "id": str(uuid.uuid4()),
            "email": data.email,
            "name": data.name,
            "subscribed_at": now,
            "is_active": True
        }
        
        await db.newsletter_subscribers.insert_one(subscriber_doc)
        
        return {
            "success": True,
            "message": "Đăng ký nhận tin thành công!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STATS API ====================

@website_router.get("/stats")
async def get_website_stats():
    """Get public stats for website display"""
    return {
        "years_experience": 15,
        "total_projects": 200,
        "total_customers": 50000,
        "total_branches": 30,
        "total_employees": 500,
        "awards": 50
    }
