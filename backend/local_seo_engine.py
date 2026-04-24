"""
LOCAL SEO ENGINE - Location-Based SEO
======================================
Build location-specific pages for local search dominance

Features:
1. District/area pages (/mua-nha-{quan})
2. Project review pages (/du-an-{ten}-review)
3. Google Maps embed
4. Local business info
5. NAP consistency (Name, Address, Phone)

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import os
import re
from unidecode import unidecode

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

# LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
local_pages_collection = db['local_seo_pages']
locations_collection = db['seo_locations']
seo_pages_collection = db['seo_pages']

# Config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
COMPANY_NAME = "ProHouzing"
COMPANY_PHONE = "1900 636 019"
COMPANY_ADDRESS = "123 Nguyễn Huệ, Quận 1, TP.HCM"


# ===================== MODELS =====================

class LocationCreate(BaseModel):
    name: str  # "Quận 1", "Đà Nẵng", "Bình Thạnh"
    slug: Optional[str] = None
    location_type: str = "district"  # district, city, ward, area
    city: str = "Hồ Chí Minh"
    parent_location: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    description: Optional[str] = None
    popular_areas: List[str] = []
    avg_price_range: Optional[str] = None  # "2-5 tỷ"


class LocalPageCreate(BaseModel):
    location_id: str
    page_type: str  # "mua-nha", "du-an-review", "gia-dat"
    title: str
    keyword: str
    content: Optional[str] = None  # If not provided, will generate


class ProjectReviewCreate(BaseModel):
    project_name: str
    developer: str
    location: str
    address: str
    price_range: str
    unit_types: List[str]  # ["1PN", "2PN", "3PN"]
    amenities: List[str]
    pros: List[str]
    cons: List[str]
    rating: float = Field(ge=1, le=5)
    completion_date: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None


# ===================== HELPER FUNCTIONS =====================

def create_slug(text: str) -> str:
    """Convert text to URL-friendly slug"""
    slug = unidecode(text)
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    slug = re.sub(r'-+', '-', slug)
    return slug


def generate_google_maps_embed(lat: float, lng: float, zoom: int = 15) -> str:
    """Generate Google Maps embed HTML"""
    return f'''
<div class="google-maps-embed" style="width:100%;margin:20px 0;">
    <iframe 
        width="100%" 
        height="400" 
        style="border:0;border-radius:8px;" 
        loading="lazy" 
        allowfullscreen 
        referrerpolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q={lat},{lng}&zoom={zoom}">
    </iframe>
</div>
'''


def generate_nap_block(
    name: str = COMPANY_NAME,
    address: str = COMPANY_ADDRESS,
    phone: str = COMPANY_PHONE,
    hours: str = "T2-T6: 8:00 - 21:00, T7: 8:00 - 18:00"
) -> str:
    """Generate NAP (Name, Address, Phone) HTML block"""
    return f'''
<div class="nap-block local-business-info" itemscope itemtype="https://schema.org/RealEstateAgent">
    <h3>Thông Tin Liên Hệ</h3>
    <div class="nap-content">
        <p><strong itemprop="name">{name}</strong></p>
        <p itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
            📍 <span itemprop="streetAddress">{address}</span>
        </p>
        <p>📞 Hotline: <a href="tel:{phone.replace(' ', '')}" itemprop="telephone">{phone}</a></p>
        <p>🕐 Giờ làm việc: <span itemprop="openingHours">{hours}</span></p>
    </div>
    <div class="cta-buttons">
        <a href="tel:{phone.replace(' ', '')}" class="btn-call">Gọi Ngay</a>
        <a href="/#ai-chat" class="btn-chat">Chat Tư Vấn</a>
    </div>
</div>
'''


def generate_local_business_schema(location: dict) -> dict:
    """Generate LocalBusiness schema for location page"""
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": f"{COMPANY_NAME} - {location.get('name', '')}",
        "url": f"{SITE_URL}/mua-nha-{location.get('slug', '')}",
        "telephone": COMPANY_PHONE,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": location.get("name"),
            "addressRegion": location.get("city", "Hồ Chí Minh"),
            "addressCountry": "VN"
        },
        "areaServed": {
            "@type": "City",
            "name": location.get("city", "Hồ Chí Minh")
        },
        "priceRange": location.get("avg_price_range", "$$$"),
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "08:00",
                "closes": "21:00"
            }
        ]
    }


# ===================== LOCATION MANAGEMENT =====================

async def create_location(data: LocationCreate) -> dict:
    """Create a new location"""
    now = datetime.now(timezone.utc)
    
    slug = data.slug or create_slug(data.name)
    
    location = {
        "name": data.name,
        "slug": slug,
        "location_type": data.location_type,
        "city": data.city,
        "parent_location": data.parent_location,
        "geo_lat": data.geo_lat,
        "geo_lng": data.geo_lng,
        "description": data.description,
        "popular_areas": data.popular_areas,
        "avg_price_range": data.avg_price_range,
        "page_count": 0,
        "is_active": True,
        "created_at": now
    }
    
    result = await locations_collection.insert_one(location)
    location["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in location:
        del location["_id"]
    
    return location


async def seed_hcm_districts():
    """Seed Ho Chi Minh City districts"""
    districts = [
        {"name": "Quận 1", "slug": "quan-1", "geo_lat": 10.7769, "geo_lng": 106.7009, "avg_price_range": "5-15 tỷ"},
        {"name": "Quận 2", "slug": "quan-2", "geo_lat": 10.7873, "geo_lng": 106.7515, "avg_price_range": "3-10 tỷ"},
        {"name": "Quận 3", "slug": "quan-3", "geo_lat": 10.7833, "geo_lng": 106.6833, "avg_price_range": "4-12 tỷ"},
        {"name": "Quận 7", "slug": "quan-7", "geo_lat": 10.7340, "geo_lng": 106.7215, "avg_price_range": "3-8 tỷ"},
        {"name": "Quận 9", "slug": "quan-9", "geo_lat": 10.8500, "geo_lng": 106.8333, "avg_price_range": "2-5 tỷ"},
        {"name": "Bình Thạnh", "slug": "binh-thanh", "geo_lat": 10.8108, "geo_lng": 106.7091, "avg_price_range": "3-8 tỷ"},
        {"name": "Thủ Đức", "slug": "thu-duc", "geo_lat": 10.8500, "geo_lng": 106.7667, "avg_price_range": "2-6 tỷ"},
        {"name": "Phú Nhuận", "slug": "phu-nhuan", "geo_lat": 10.8000, "geo_lng": 106.6833, "avg_price_range": "4-10 tỷ"},
        {"name": "Tân Bình", "slug": "tan-binh", "geo_lat": 10.8016, "geo_lng": 106.6522, "avg_price_range": "3-7 tỷ"},
        {"name": "Gò Vấp", "slug": "go-vap", "geo_lat": 10.8383, "geo_lng": 106.6500, "avg_price_range": "2-5 tỷ"},
    ]
    
    created = 0
    for d in districts:
        existing = await locations_collection.find_one({"slug": d["slug"]})
        if not existing:
            d["location_type"] = "district"
            d["city"] = "Hồ Chí Minh"
            d["is_active"] = True
            d["page_count"] = 0
            d["created_at"] = datetime.now(timezone.utc)
            await locations_collection.insert_one(d)
            created += 1
    
    return created


# ===================== CONTENT GENERATION =====================

LOCAL_PAGE_PROMPT = """Bạn là chuyên gia SEO và BĐS. Viết bài LOCAL SEO cho khu vực cụ thể.

THÔNG TIN KHU VỰC:
- Tên: {location_name}
- Loại: {location_type}
- Thành phố: {city}
- Giá trung bình: {price_range}

KEYWORD: {keyword}

YÊU CẦU:
1. Viết ≥2000 từ
2. Có dữ liệu thực tế (giá, diện tích, tiện ích)
3. So sánh với các khu vực lân cận
4. Thông tin hạ tầng, giao thông
5. Phân tích tiềm năng đầu tư
6. FAQ về khu vực

FORMAT OUTPUT (JSON):
{{
    "title": "Tiêu đề CTR cao (có địa điểm + năm)",
    "h1": "H1 chính",
    "meta_description": "< 160 ký tự",
    "content": "Nội dung HTML đầy đủ",
    "h2_tags": ["H2 1", "H2 2", ...],
    "faqs": [{{"question": "...", "answer": "..."}}],
    "comparison_table": "HTML bảng so sánh",
    "word_count": 2000
}}

QUAN TRỌNG:
- Dữ liệu phải THỰC TẾ (không bịa)
- Có số liệu cụ thể
- CTA rõ ràng
- Không generic"""


async def generate_local_page_content(
    location: dict,
    keyword: str,
    page_type: str
) -> dict:
    """Generate local SEO content using GPT-5.2"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    prompt = LOCAL_PAGE_PROMPT.format(
        location_name=location.get("name"),
        location_type=location.get("location_type"),
        city=location.get("city"),
        price_range=location.get("avg_price_range", "Liên hệ"),
        keyword=keyword
    )
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"local-seo-{datetime.now().timestamp()}",
            system_message=prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"""Viết bài LOCAL SEO về: "{keyword}"
            
Loại trang: {page_type}
Khu vực: {location.get('name')}, {location.get('city')}

Trả về JSON theo format."""
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON
        import json
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            content_data = json.loads(json_match.group())
            
            # Add Google Maps embed if coordinates available
            if location.get("geo_lat") and location.get("geo_lng"):
                maps_html = generate_google_maps_embed(
                    location["geo_lat"], 
                    location["geo_lng"]
                )
                content_data["content"] += maps_html
            
            # Add NAP block
            content_data["content"] += generate_nap_block()
            
            return content_data
        
        raise ValueError("Could not parse JSON response")
        
    except Exception as e:
        print(f"[LOCAL SEO] Content generation error: {e}")
        raise


async def create_local_page(
    location_id: str,
    page_type: str,
    keyword: str,
    title: str = None,
    content: dict = None
) -> dict:
    """Create a local SEO page"""
    
    location = await locations_collection.find_one({"_id": ObjectId(location_id)})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    now = datetime.now(timezone.utc)
    
    # Generate content if not provided
    if not content:
        content = await generate_local_page_content(location, keyword, page_type)
    
    # Generate slug
    if page_type == "mua-nha":
        slug = f"mua-nha-{location.get('slug')}"
    elif page_type == "du-an-review":
        slug = f"du-an-{create_slug(keyword)}-review"
    elif page_type == "gia-dat":
        slug = f"gia-dat-{location.get('slug')}"
    else:
        slug = create_slug(keyword)
    
    # Build local page
    local_page = {
        "location_id": location_id,
        "location_name": location.get("name"),
        "location_slug": location.get("slug"),
        "city": location.get("city"),
        "page_type": page_type,
        "keyword": keyword,
        "slug": slug,
        "title": content.get("title", title),
        "h1": content.get("h1", title),
        "meta_description": content.get("meta_description", ""),
        "content": content.get("content", ""),
        "h2_tags": content.get("h2_tags", []),
        "faqs": content.get("faqs", []),
        "comparison_table": content.get("comparison_table"),
        "word_count": content.get("word_count", 0),
        "geo_lat": location.get("geo_lat"),
        "geo_lng": location.get("geo_lng"),
        "has_map": bool(location.get("geo_lat")),
        "has_nap": True,
        "is_local_page": True,
        "local_schema": generate_local_business_schema(location),
        "status": "draft",
        "created_at": now,
        "updated_at": now
    }
    
    # Insert into local pages collection
    result = await local_pages_collection.insert_one(local_page)
    local_page["id"] = str(result.inserted_id)
    
    # Also insert into main SEO pages collection
    seo_page = {
        **local_page,
        "content_type": "local",
        "is_local_page": True
    }
    del seo_page["id"]
    seo_result = await seo_pages_collection.insert_one(seo_page)
    
    # Update location page count
    await locations_collection.update_one(
        {"_id": ObjectId(location_id)},
        {"$inc": {"page_count": 1}}
    )
    
    return {
        "local_page_id": str(result.inserted_id),
        "seo_page_id": str(seo_result.inserted_id),
        "slug": slug,
        "title": local_page["title"]
    }


# ===================== PROJECT REVIEW =====================

PROJECT_REVIEW_PROMPT = """Bạn là chuyên gia đánh giá dự án BĐS. Viết bài review chi tiết.

THÔNG TIN DỰ ÁN:
- Tên: {project_name}
- Chủ đầu tư: {developer}
- Vị trí: {location}
- Giá: {price_range}
- Loại căn: {unit_types}

ƯU ĐIỂM: {pros}
NHƯỢC ĐIỂM: {cons}
TIỆN ÍCH: {amenities}

YÊU CẦU:
1. Viết ≥2500 từ
2. Đánh giá KHÁCH QUAN
3. So sánh với dự án cùng phân khúc
4. Phân tích tiềm năng tăng giá
5. Ai nên mua?
6. FAQ về dự án

FORMAT OUTPUT (JSON):
{{
    "title": "Review {project_name} 2026 - Đánh Giá Chi Tiết [Ưu/Nhược Điểm]",
    "h1": "Review {project_name}: Đánh Giá Từ Chuyên Gia BĐS",
    "meta_description": "< 160 ký tự",
    "content": "Nội dung HTML đầy đủ",
    "h2_tags": ["Tổng quan", "Vị trí", "Thiết kế", "Tiện ích", "Giá bán", "Ưu nhược điểm", "Nên mua không?"],
    "faqs": [{{"question": "...", "answer": "..."}}],
    "rating_breakdown": {{"vi_tri": 4.5, "thiet_ke": 4.0, "tien_ich": 4.2, "gia_ca": 3.8}},
    "verdict": "Kết luận ngắn gọn",
    "word_count": 2500
}}"""


async def generate_project_review(data: ProjectReviewCreate) -> dict:
    """Generate project review content"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    prompt = PROJECT_REVIEW_PROMPT.format(
        project_name=data.project_name,
        developer=data.developer,
        location=data.location,
        price_range=data.price_range,
        unit_types=", ".join(data.unit_types),
        pros="\n".join(f"- {p}" for p in data.pros),
        cons="\n".join(f"- {c}" for c in data.cons),
        amenities=", ".join(data.amenities)
    )
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"project-review-{datetime.now().timestamp()}",
            system_message=prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text="Viết bài review chi tiết. Trả về JSON.")
        
        response = await chat.send_message(user_message)
        
        import json
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            content_data = json.loads(json_match.group())
            
            # Add Google Maps if coordinates
            if data.geo_lat and data.geo_lng:
                maps_html = generate_google_maps_embed(data.geo_lat, data.geo_lng)
                content_data["content"] += maps_html
            
            # Add NAP
            content_data["content"] += generate_nap_block()
            
            return content_data
        
        raise ValueError("Could not parse JSON")
        
    except Exception as e:
        print(f"[LOCAL SEO] Project review error: {e}")
        raise


# ===================== API ENDPOINTS =====================

@router.get("/locations")
async def api_list_locations(city: Optional[str] = None, location_type: Optional[str] = None):
    """List all locations"""
    query = {"is_active": True}
    if city:
        query["city"] = city
    if location_type:
        query["location_type"] = location_type
    
    locations = []
    async for loc in locations_collection.find(query).sort("name", 1):
        locations.append({
            "id": str(loc["_id"]),
            "name": loc.get("name"),
            "slug": loc.get("slug"),
            "location_type": loc.get("location_type"),
            "city": loc.get("city"),
            "avg_price_range": loc.get("avg_price_range"),
            "page_count": loc.get("page_count", 0),
            "geo_lat": loc.get("geo_lat"),
            "geo_lng": loc.get("geo_lng")
        })
    
    return {"locations": locations, "total": len(locations)}


@router.post("/locations")
async def api_create_location(data: LocationCreate):
    """Create new location"""
    location = await create_location(data)
    return {"success": True, "location": location}


@router.post("/locations/seed-hcm")
async def api_seed_hcm_districts():
    """Seed HCM districts"""
    created = await seed_hcm_districts()
    return {"success": True, "created": created}


@router.get("/pages")
async def api_list_local_pages(
    location_id: Optional[str] = None,
    page_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """List local SEO pages"""
    query = {}
    if location_id:
        query["location_id"] = location_id
    if page_type:
        query["page_type"] = page_type
    if status:
        query["status"] = status
    
    pages = []
    async for page in local_pages_collection.find(query).sort("created_at", -1).limit(limit):
        pages.append({
            "id": str(page["_id"]),
            "title": page.get("title"),
            "slug": page.get("slug"),
            "keyword": page.get("keyword"),
            "location_name": page.get("location_name"),
            "page_type": page.get("page_type"),
            "word_count": page.get("word_count", 0),
            "has_map": page.get("has_map", False),
            "status": page.get("status")
        })
    
    return {"pages": pages, "total": len(pages)}


@router.post("/pages/create")
async def api_create_local_page(data: LocalPageCreate, background_tasks: BackgroundTasks):
    """Create local SEO page"""
    result = await create_local_page(
        location_id=data.location_id,
        page_type=data.page_type,
        keyword=data.keyword,
        title=data.title
    )
    return {"success": True, **result}


@router.post("/pages/generate-all/{location_id}")
async def api_generate_all_local_pages(location_id: str, background_tasks: BackgroundTasks):
    """Generate all local page types for a location"""
    
    location = await locations_collection.find_one({"_id": ObjectId(location_id)})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    page_types = [
        {"type": "mua-nha", "keyword": f"mua nhà {location['name']}"},
        {"type": "gia-dat", "keyword": f"giá đất {location['name']} 2026"},
    ]
    
    async def generate_pages():
        results = []
        for pt in page_types:
            try:
                result = await create_local_page(
                    location_id=location_id,
                    page_type=pt["type"],
                    keyword=pt["keyword"]
                )
                results.append(result)
            except Exception as e:
                results.append({"error": str(e), "type": pt["type"]})
        return results
    
    background_tasks.add_task(generate_pages)
    
    return {
        "success": True,
        "message": f"Generating {len(page_types)} pages for {location['name']} in background"
    }


@router.post("/project-review")
async def api_create_project_review(data: ProjectReviewCreate, background_tasks: BackgroundTasks):
    """Create project review page"""
    
    content = await generate_project_review(data)
    
    slug = f"du-an-{create_slug(data.project_name)}-review"
    now = datetime.now(timezone.utc)
    
    page = {
        "page_type": "du-an-review",
        "keyword": f"review {data.project_name}",
        "slug": slug,
        "title": content.get("title"),
        "h1": content.get("h1"),
        "meta_description": content.get("meta_description"),
        "content": content.get("content"),
        "h2_tags": content.get("h2_tags", []),
        "faqs": content.get("faqs", []),
        "rating": data.rating,
        "rating_breakdown": content.get("rating_breakdown"),
        "verdict": content.get("verdict"),
        "word_count": content.get("word_count", 0),
        "project_name": data.project_name,
        "developer": data.developer,
        "location": data.location,
        "address": data.address,
        "price_range": data.price_range,
        "geo_lat": data.geo_lat,
        "geo_lng": data.geo_lng,
        "has_map": bool(data.geo_lat),
        "has_nap": True,
        "is_local_page": True,
        "status": "draft",
        "created_at": now
    }
    
    # Insert to both collections
    local_result = await local_pages_collection.insert_one(page)
    
    seo_page = {**page, "content_type": "local"}
    del seo_page["_id"]
    seo_result = await seo_pages_collection.insert_one(seo_page)
    
    return {
        "success": True,
        "local_page_id": str(local_result.inserted_id),
        "seo_page_id": str(seo_result.inserted_id),
        "slug": slug
    }


@router.get("/stats")
async def api_get_local_seo_stats():
    """Get local SEO statistics"""
    total_locations = await locations_collection.count_documents({"is_active": True})
    total_pages = await local_pages_collection.count_documents({})
    pages_with_map = await local_pages_collection.count_documents({"has_map": True})
    published = await local_pages_collection.count_documents({"status": "published"})
    
    return {
        "locations": total_locations,
        "pages": {
            "total": total_pages,
            "with_map": pages_with_map,
            "published": published
        },
        "coverage": {
            "map_coverage": round(pages_with_map / total_pages * 100, 1) if total_pages > 0 else 0
        }
    }
