"""
ProHouzing Admin Content API - CRUD for Careers, News, Testimonials, Partners
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

admin_content_router = APIRouter(prefix="/admin/content", tags=["Admin Content"])

# ==================== MODELS ====================

# --- Careers ---
class CareerCreate(BaseModel):
    title: str
    department: str
    location: str
    type: str = "full-time"  # full-time, part-time, contract, intern
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: str = "Thỏa thuận"  # e.g., "15-30 triệu" or "Thỏa thuận"
    description: str
    requirements: List[str] = []
    benefits: List[str] = []
    openings: int = 1
    deadline: Optional[str] = None
    is_hot: bool = False
    is_urgent: bool = False
    is_active: bool = True

class CareerUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    openings: Optional[int] = None
    deadline: Optional[str] = None
    is_hot: Optional[bool] = None
    is_urgent: Optional[bool] = None
    is_active: Optional[bool] = None

class CareerResponse(BaseModel):
    id: str
    title: str
    department: str
    location: str
    type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: str
    description: str
    requirements: List[str]
    benefits: List[str]
    openings: int
    deadline: Optional[str] = None
    is_hot: bool
    is_urgent: bool
    is_active: bool
    applications_count: int = 0
    created_at: str
    updated_at: str

# --- News ---
class NewsCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: str
    content: str
    category: str = "market"  # market, project, company, tips
    image: str
    author: str = "Admin"
    is_featured: bool = False
    is_published: bool = True
    published_at: Optional[str] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    author: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    published_at: Optional[str] = None

class NewsResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    image: str
    author: str
    views: int
    is_featured: bool
    is_published: bool
    published_at: str
    created_at: str
    updated_at: str

# --- Testimonials ---
class TestimonialCreate(BaseModel):
    name: str
    role: str
    avatar: Optional[str] = None
    content: str
    rating: int = 5
    project: Optional[str] = None
    is_active: bool = True
    order: int = 0

class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    content: Optional[str] = None
    rating: Optional[int] = None
    project: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class TestimonialResponse(BaseModel):
    id: str
    name: str
    role: str
    avatar: Optional[str] = None
    content: str
    rating: int
    project: Optional[str] = None
    is_active: bool
    order: int
    created_at: str

# --- Partners ---
class PartnerCreate(BaseModel):
    name: str
    logo: str
    website: Optional[str] = None
    description: Optional[str] = None
    category: str = "developer"  # developer, bank, agency, other
    is_active: bool = True
    order: int = 0

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class PartnerResponse(BaseModel):
    id: str
    name: str
    logo: str
    website: Optional[str] = None
    description: Optional[str] = None
    category: str
    is_active: bool
    order: int
    created_at: str

# ==================== CAREERS CRUD ====================

@admin_content_router.get("/careers", response_model=List[CareerResponse])
async def list_careers(
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all career positions"""
    query = {}
    if department:
        query["department"] = department
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.careers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    careers = await cursor.to_list(length=limit)
    
    # Get applications count for each career
    for career in careers:
        count = await db.job_applications.count_documents({"position_id": career["id"]})
        career["applications_count"] = count
    
    return careers

@admin_content_router.get("/careers/{career_id}", response_model=CareerResponse)
async def get_career(career_id: str):
    """Get a career position by ID"""
    career = await db.careers.find_one({"id": career_id}, {"_id": 0})
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    
    count = await db.job_applications.count_documents({"position_id": career_id})
    career["applications_count"] = count
    return career

@admin_content_router.post("/careers", response_model=CareerResponse)
async def create_career(data: CareerCreate):
    """Create a new career position"""
    now = datetime.now(timezone.utc).isoformat()
    career_id = str(uuid.uuid4())
    
    career_doc = {
        "id": career_id,
        **data.model_dump(),
        "applications_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.careers.insert_one(career_doc)
    
    return {**career_doc, "_id": None}

@admin_content_router.put("/careers/{career_id}", response_model=CareerResponse)
async def update_career(career_id: str, data: CareerUpdate):
    """Update a career position"""
    career = await db.careers.find_one({"id": career_id})
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.careers.update_one({"id": career_id}, {"$set": update_data})
    
    updated = await db.careers.find_one({"id": career_id}, {"_id": 0})
    count = await db.job_applications.count_documents({"position_id": career_id})
    updated["applications_count"] = count
    return updated

@admin_content_router.delete("/careers/{career_id}")
async def delete_career(career_id: str):
    """Delete a career position"""
    result = await db.careers.delete_one({"id": career_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Career not found")
    return {"success": True, "message": "Career deleted"}

# --- Job Applications ---
@admin_content_router.get("/careers/{career_id}/applications")
async def list_career_applications(career_id: str):
    """List applications for a career position"""
    cursor = db.job_applications.find({"position_id": career_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=100)

# ==================== NEWS CRUD ====================

def generate_slug(title: str) -> str:
    """Generate URL slug from title"""
    import re
    slug = title.lower()
    # Vietnamese character mapping
    char_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    }
    for vn, en in char_map.items():
        slug = slug.replace(vn, en)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug

@admin_content_router.get("/news", response_model=List[NewsResponse])
async def list_news(
    category: Optional[str] = None,
    is_published: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all news articles"""
    query = {}
    if category:
        query["category"] = category
    if is_published is not None:
        query["is_published"] = is_published
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    cursor = db.news.find(query, {"_id": 0}).sort("published_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

@admin_content_router.get("/news/{news_id}", response_model=NewsResponse)
async def get_news(news_id: str):
    """Get a news article by ID"""
    news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news

@admin_content_router.post("/news", response_model=NewsResponse)
async def create_news(data: NewsCreate):
    """Create a new news article"""
    now = datetime.now(timezone.utc).isoformat()
    news_id = str(uuid.uuid4())
    
    slug = data.slug if data.slug else generate_slug(data.title)
    published_at = data.published_at if data.published_at else now
    
    news_doc = {
        "id": news_id,
        **data.model_dump(),
        "slug": slug,
        "published_at": published_at,
        "views": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.news.insert_one(news_doc)
    
    return {**news_doc, "_id": None}

@admin_content_router.put("/news/{news_id}", response_model=NewsResponse)
async def update_news(news_id: str, data: NewsUpdate):
    """Update a news article"""
    news = await db.news.find_one({"id": news_id})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Regenerate slug if title changed
    if "title" in update_data and "slug" not in update_data:
        update_data["slug"] = generate_slug(update_data["title"])
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.news.update_one({"id": news_id}, {"$set": update_data})
    
    return await db.news.find_one({"id": news_id}, {"_id": 0})

@admin_content_router.delete("/news/{news_id}")
async def delete_news(news_id: str):
    """Delete a news article"""
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"success": True, "message": "News deleted"}

# ==================== TESTIMONIALS CRUD ====================

@admin_content_router.get("/testimonials", response_model=List[TestimonialResponse])
async def list_testimonials(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all testimonials"""
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.testimonials.find(query, {"_id": 0}).sort("order", 1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

@admin_content_router.get("/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def get_testimonial(testimonial_id: str):
    """Get a testimonial by ID"""
    testimonial = await db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial

@admin_content_router.post("/testimonials", response_model=TestimonialResponse)
async def create_testimonial(data: TestimonialCreate):
    """Create a new testimonial"""
    now = datetime.now(timezone.utc).isoformat()
    testimonial_id = str(uuid.uuid4())
    
    testimonial_doc = {
        "id": testimonial_id,
        **data.model_dump(),
        "created_at": now
    }
    
    await db.testimonials.insert_one(testimonial_doc)
    
    return {**testimonial_doc, "_id": None}

@admin_content_router.put("/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(testimonial_id: str, data: TestimonialUpdate):
    """Update a testimonial"""
    testimonial = await db.testimonials.find_one({"id": testimonial_id})
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    await db.testimonials.update_one({"id": testimonial_id}, {"$set": update_data})
    
    return await db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})

@admin_content_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str):
    """Delete a testimonial"""
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True, "message": "Testimonial deleted"}

# ==================== PARTNERS CRUD ====================

@admin_content_router.get("/partners", response_model=List[PartnerResponse])
async def list_partners(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all partners"""
    query = {}
    if category:
        query["category"] = category
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.partners.find(query, {"_id": 0}).sort("order", 1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

@admin_content_router.get("/partners/{partner_id}", response_model=PartnerResponse)
async def get_partner(partner_id: str):
    """Get a partner by ID"""
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner

@admin_content_router.post("/partners", response_model=PartnerResponse)
async def create_partner(data: PartnerCreate):
    """Create a new partner"""
    now = datetime.now(timezone.utc).isoformat()
    partner_id = str(uuid.uuid4())
    
    partner_doc = {
        "id": partner_id,
        **data.model_dump(),
        "created_at": now
    }
    
    await db.partners.insert_one(partner_doc)
    
    return {**partner_doc, "_id": None}

@admin_content_router.put("/partners/{partner_id}", response_model=PartnerResponse)
async def update_partner(partner_id: str, data: PartnerUpdate):
    """Update a partner"""
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    await db.partners.update_one({"id": partner_id}, {"$set": update_data})
    
    return await db.partners.find_one({"id": partner_id}, {"_id": 0})

@admin_content_router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str):
    """Delete a partner"""
    result = await db.partners.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    return {"success": True, "message": "Partner deleted"}

# ==================== SEED DATA ====================

@admin_content_router.post("/seed")
async def seed_content_data():
    """Seed initial content data for testing"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Seed Careers
    careers_data = [
        {
            "id": str(uuid.uuid4()),
            "title": "Chuyên viên Tư vấn BĐS",
            "department": "Kinh doanh",
            "location": "TP.HCM, Hà Nội, Đà Nẵng",
            "type": "full-time",
            "salary_min": 15000000,
            "salary_max": 50000000,
            "salary_display": "15-50 triệu",
            "description": "Tư vấn và bán sản phẩm bất động sản cho khách hàng. Tìm kiếm và phát triển nguồn khách hàng tiềm năng.",
            "requirements": ["Tốt nghiệp Đại học", "Kỹ năng giao tiếp tốt", "Chịu được áp lực cao", "Có laptop và phương tiện đi lại"],
            "benefits": ["Lương cơ bản + hoa hồng hấp dẫn", "Bảo hiểm sức khỏe cao cấp", "Đào tạo chuyên sâu miễn phí", "Cơ hội thăng tiến nhanh"],
            "openings": 20,
            "deadline": "2026-03-31",
            "is_hot": True,
            "is_urgent": True,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Trưởng nhóm Kinh doanh",
            "department": "Kinh doanh",
            "location": "TP.HCM, Hà Nội",
            "type": "full-time",
            "salary_min": 30000000,
            "salary_max": 80000000,
            "salary_display": "30-80 triệu",
            "description": "Quản lý đội ngũ sales và đạt target kinh doanh. Xây dựng và phát triển đội ngũ bán hàng chuyên nghiệp.",
            "requirements": ["3+ năm kinh nghiệm BĐS", "Kỹ năng lãnh đạo xuất sắc", "Có đội ngũ sẵn là lợi thế", "Đạt target kinh doanh liên tục"],
            "benefits": ["Lương thưởng hấp dẫn", "Cơ hội thăng tiến lên quản lý", "Du lịch trong và ngoài nước", "Thưởng nóng theo dự án"],
            "openings": 5,
            "deadline": "2026-02-28",
            "is_hot": True,
            "is_urgent": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Cộng tác viên Bán hàng",
            "department": "Kinh doanh",
            "location": "Toàn quốc",
            "type": "part-time",
            "salary_min": None,
            "salary_max": None,
            "salary_display": "Hoa hồng lên đến 70%",
            "description": "Giới thiệu khách hàng mua bất động sản. Không yêu cầu kinh nghiệm, được đào tạo miễn phí.",
            "requirements": ["Có điện thoại thông minh", "Kỹ năng giao tiếp cơ bản", "Chăm chỉ và kiên trì"],
            "benefits": ["Hoa hồng cao nhất thị trường", "Đào tạo miễn phí", "Hỗ trợ marketing", "Thanh toán nhanh trong 7 ngày"],
            "openings": 100,
            "deadline": None,
            "is_hot": True,
            "is_urgent": True,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Chuyên viên Marketing Digital",
            "department": "Marketing",
            "location": "TP.HCM",
            "type": "full-time",
            "salary_min": 12000000,
            "salary_max": 25000000,
            "salary_display": "12-25 triệu",
            "description": "Xây dựng và triển khai các chiến dịch marketing online. Quản lý các kênh social media.",
            "requirements": ["2+ năm kinh nghiệm Digital Marketing", "Thành thạo Facebook Ads, Google Ads", "Có portfolio các chiến dịch đã làm"],
            "benefits": ["Môi trường năng động", "Được đào tạo nâng cao", "Thưởng theo hiệu quả chiến dịch"],
            "openings": 3,
            "deadline": "2026-02-15",
            "is_hot": False,
            "is_urgent": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Nhân viên Chăm sóc Khách hàng",
            "department": "CSKH",
            "location": "TP.HCM, Hà Nội",
            "type": "full-time",
            "salary_min": 10000000,
            "salary_max": 15000000,
            "salary_display": "10-15 triệu",
            "description": "Tiếp nhận và xử lý yêu cầu của khách hàng. Hỗ trợ quy trình sau bán hàng.",
            "requirements": ["Giọng nói dễ nghe", "Kiên nhẫn và tận tâm", "Sử dụng thành thạo máy tính"],
            "benefits": ["Lương ổn định", "Thưởng theo KPI", "Môi trường thân thiện"],
            "openings": 5,
            "deadline": "2026-03-15",
            "is_hot": False,
            "is_urgent": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Seed News
    news_data = [
        {
            "id": str(uuid.uuid4()),
            "title": "Thị trường BĐS TP.HCM năm 2026: Dự báo tăng trưởng 15%",
            "slug": "thi-truong-bds-tphcm-2026-du-bao-tang-truong-15",
            "excerpt": "Theo các chuyên gia, thị trường bất động sản TP.HCM sẽ có sự phục hồi mạnh mẽ trong năm 2026 với nhiều yếu tố tích cực.",
            "content": """<h2>Tổng quan thị trường</h2>
<p>Năm 2026 được dự báo là năm khởi sắc của thị trường bất động sản TP.HCM sau giai đoạn điều chỉnh. Các chuyên gia nhận định rằng thị trường sẽ tăng trưởng khoảng 15% so với năm 2025.</p>

<h2>Các yếu tố tác động</h2>
<ul>
<li>Chính sách hỗ trợ từ Chính phủ</li>
<li>Lãi suất cho vay giảm</li>
<li>Hạ tầng giao thông được cải thiện</li>
<li>Nhu cầu nhà ở thực tăng cao</li>
</ul>

<h2>Phân khúc tiềm năng</h2>
<p>Căn hộ tầm trung (2-4 tỷ) và nhà phố vùng ven được đánh giá là các phân khúc có tiềm năng tăng trưởng tốt nhất trong năm 2026.</p>""",
            "category": "market",
            "image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
            "author": "Ban Biên tập",
            "views": 1520,
            "is_featured": True,
            "is_published": True,
            "published_at": "2026-02-10T08:00:00Z",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Vinhomes Grand Park mở bán giai đoạn mới với ưu đãi hấp dẫn",
            "slug": "vinhomes-grand-park-mo-ban-giai-doan-moi",
            "excerpt": "Vinhomes Grand Park chính thức mở bán giai đoạn mới với chính sách thanh toán linh hoạt và nhiều ưu đãi đặc biệt.",
            "content": """<h2>Thông tin mở bán</h2>
<p>Vinhomes Grand Park vừa công bố mở bán giai đoạn mới với hơn 500 căn hộ đa dạng diện tích từ 1-3 phòng ngủ.</p>

<h2>Chính sách ưu đãi</h2>
<ul>
<li>Chiết khấu lên đến 15% khi thanh toán nhanh</li>
<li>Hỗ trợ lãi suất 0% trong 24 tháng</li>
<li>Tặng 2 năm phí quản lý</li>
<li>Tặng gói nội thất 100 triệu</li>
</ul>

<h2>Liên hệ tư vấn</h2>
<p>Để được tư vấn chi tiết về dự án, vui lòng liên hệ ProHouzing qua hotline 1900 1234.</p>""",
            "category": "project",
            "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
            "author": "Nguyễn Văn A",
            "views": 890,
            "is_featured": True,
            "is_published": True,
            "published_at": "2026-02-09T10:00:00Z",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "ProHouzing đạt Top 1 nền tảng BĐS sơ cấp Việt Nam 2025",
            "slug": "prohouzing-dat-top-1-nen-tang-bds-so-cap-2025",
            "excerpt": "ProHouzing vinh dự nhận giải thưởng Top 1 nền tảng môi giới bất động sản sơ cấp Việt Nam năm 2025.",
            "content": """<h2>Giải thưởng danh giá</h2>
<p>Tại lễ trao giải Vietnam Real Estate Awards 2025, ProHouzing đã xuất sắc đạt giải Top 1 nền tảng môi giới BĐS sơ cấp Việt Nam.</p>

<h2>Thành tựu năm 2025</h2>
<ul>
<li>Hơn 10,000 giao dịch thành công</li>
<li>500+ đại lý trên toàn quốc</li>
<li>50+ dự án phân phối chính thức</li>
<li>5 tỷ+ hoa hồng đã chi trả</li>
</ul>

<h2>Cam kết năm 2026</h2>
<p>ProHouzing cam kết tiếp tục nâng cao chất lượng dịch vụ và mang đến trải nghiệm tốt nhất cho khách hàng và đối tác.</p>""",
            "category": "company",
            "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
            "author": "Ban Truyền thông",
            "views": 2100,
            "is_featured": False,
            "is_published": True,
            "published_at": "2026-02-05T14:00:00Z",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "5 điều cần biết trước khi mua căn hộ lần đầu",
            "slug": "5-dieu-can-biet-truoc-khi-mua-can-ho-lan-dau",
            "excerpt": "Mua nhà lần đầu là quyết định lớn đòi hỏi sự chuẩn bị kỹ lưỡng. Đây là 5 điều quan trọng bạn cần nắm.",
            "content": """<h2>1. Xác định ngân sách thực tế</h2>
<p>Trước khi tìm mua nhà, hãy xác định rõ khả năng tài chính của bạn. Nguyên tắc chung là khoản trả hàng tháng không nên vượt quá 30-40% thu nhập.</p>

<h2>2. Kiểm tra pháp lý dự án</h2>
<p>Đảm bảo dự án có đầy đủ giấy phép xây dựng, quyết định giao đất, và các văn bản pháp lý cần thiết.</p>

<h2>3. Tìm hiểu chủ đầu tư</h2>
<p>Nghiên cứu về uy tín, năng lực tài chính và các dự án đã hoàn thành của chủ đầu tư.</p>

<h2>4. Khảo sát thực tế</h2>
<p>Đến tận nơi để xem vị trí, tiện ích xung quanh, và tiến độ xây dựng dự án.</p>

<h2>5. Đọc kỹ hợp đồng</h2>
<p>Trước khi ký, hãy đọc kỹ mọi điều khoản trong hợp đồng mua bán, đặc biệt về tiến độ thanh toán và chính sách bàn giao.</p>""",
            "category": "tips",
            "image": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "author": "Trần Thị B",
            "views": 3200,
            "is_featured": False,
            "is_published": True,
            "published_at": "2026-02-01T09:00:00Z",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Seed Testimonials
    testimonials_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Nguyễn Văn Minh",
            "role": "Khách hàng mua căn hộ",
            "avatar": "https://randomuser.me/api/portraits/men/32.jpg",
            "content": "Tôi rất hài lòng với dịch vụ của ProHouzing. Đội ngũ tư vấn chuyên nghiệp, tận tâm, giúp tôi tìm được căn hộ ưng ý với giá tốt nhất. Pháp lý rõ ràng, minh bạch. Cảm ơn ProHouzing!",
            "rating": 5,
            "project": "Vinhomes Grand Park",
            "is_active": True,
            "order": 1,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Trần Thị Hương",
            "role": "Nhà đầu tư BĐS",
            "avatar": "https://randomuser.me/api/portraits/women/44.jpg",
            "content": "Đã đầu tư nhiều dự án qua ProHouzing, tất cả đều sinh lời tốt. Thông tin cập nhật nhanh, chính xác. Đặc biệt ấn tượng với app quản lý và hỗ trợ 24/7. Rất đáng tin cậy!",
            "rating": 5,
            "project": "The Metropole",
            "is_active": True,
            "order": 2,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lê Hoàng Nam",
            "role": "CTV bán hàng",
            "avatar": "https://randomuser.me/api/portraits/men/67.jpg",
            "content": "Làm CTV cho ProHouzing được 2 năm, thu nhập tăng gấp 3 lần. Hoa hồng cao nhất thị trường, thanh toán nhanh chóng. Được đào tạo bài bản và hỗ trợ marketing hiệu quả.",
            "rating": 5,
            "project": "Masteri Centre Point",
            "is_active": True,
            "order": 3,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Phạm Thị Mai",
            "role": "Đại lý chính thức",
            "avatar": "https://randomuser.me/api/portraits/women/65.jpg",
            "content": "ProHouzing là đối tác đáng tin cậy nhất trong ngành. Hệ thống CRM chuyên nghiệp, leads chất lượng cao. Đội ngũ support rất nhiệt tình. Doanh số liên tục tăng trưởng.",
            "rating": 5,
            "project": "Eaton Park",
            "is_active": True,
            "order": 4,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Võ Đình Khoa",
            "role": "Khách hàng mua biệt thự",
            "avatar": "https://randomuser.me/api/portraits/men/52.jpg",
            "content": "Đội ngũ tư vấn của ProHouzing rất am hiểu thị trường. Họ giúp tôi chọn được căn biệt thự đúng nhu cầu với giá hợp lý. Quá trình mua bán suôn sẻ, chuyên nghiệp.",
            "rating": 5,
            "project": "Aqua City",
            "is_active": True,
            "order": 5,
            "created_at": now
        }
    ]
    
    # Seed Partners
    partners_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Vinhomes",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Vinhomes_logo.svg/200px-Vinhomes_logo.svg.png",
            "website": "https://vinhomes.vn",
            "description": "Thương hiệu bất động sản hàng đầu thuộc tập đoàn Vingroup",
            "category": "developer",
            "is_active": True,
            "order": 1,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Masterise Homes",
            "logo": "https://masteri.com.vn/wp-content/uploads/2021/05/logo-masterise-homes.png",
            "website": "https://masterisehomes.com",
            "description": "Chủ đầu tư các dự án cao cấp tại TP.HCM",
            "category": "developer",
            "is_active": True,
            "order": 2,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Novaland",
            "logo": "https://novaland.com.vn/Data/Sites/1/News/4728/logo-novaland-01.png",
            "website": "https://novaland.com.vn",
            "description": "Tập đoàn bất động sản đa lĩnh vực",
            "category": "developer",
            "is_active": True,
            "order": 3,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Capitaland",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/CapitaLand_logo.svg/200px-CapitaLand_logo.svg.png",
            "website": "https://www.capitaland.com",
            "description": "Tập đoàn bất động sản quốc tế từ Singapore",
            "category": "developer",
            "is_active": True,
            "order": 4,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Khang Điền",
            "logo": "https://khangdien.com.vn/wp-content/uploads/2022/01/logo-khang-dien.png",
            "website": "https://khangdien.com.vn",
            "description": "Chủ đầu tư nhà phố và biệt thự tại TP.HCM",
            "category": "developer",
            "is_active": True,
            "order": 5,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Nam Long",
            "logo": "https://namlonggroup.com.vn/wp-content/uploads/2019/03/logo-nam-long.png",
            "website": "https://namlonggroup.com.vn",
            "description": "Chủ đầu tư các dự án nhà ở tầm trung",
            "category": "developer",
            "is_active": True,
            "order": 6,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Techcombank",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Techcombank_logo.svg/200px-Techcombank_logo.svg.png",
            "website": "https://techcombank.com.vn",
            "description": "Ngân hàng đối tác hỗ trợ vay mua nhà",
            "category": "bank",
            "is_active": True,
            "order": 7,
            "created_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vietcombank",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Vietcombank_Logo.svg/200px-Vietcombank_Logo.svg.png",
            "website": "https://vietcombank.com.vn",
            "description": "Ngân hàng đối tác hỗ trợ vay mua nhà",
            "category": "bank",
            "is_active": True,
            "order": 8,
            "created_at": now
        }
    ]
    
    # Clear existing data
    await db.careers.delete_many({})
    await db.news.delete_many({})
    await db.testimonials.delete_many({})
    await db.partners.delete_many({})
    
    # Insert seed data
    if careers_data:
        await db.careers.insert_many(careers_data)
    if news_data:
        await db.news.insert_many(news_data)
    if testimonials_data:
        await db.testimonials.insert_many(testimonials_data)
    if partners_data:
        await db.partners.insert_many(partners_data)
    
    return {
        "success": True,
        "message": "Content data seeded successfully",
        "counts": {
            "careers": len(careers_data),
            "news": len(news_data),
            "testimonials": len(testimonials_data),
            "partners": len(partners_data)
        }
    }
