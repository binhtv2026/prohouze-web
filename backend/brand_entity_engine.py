"""
BRAND ENTITY ENGINE - Build Brand Authority
============================================
Build brand entity signals for SEO authority

Features:
1. Brand pages (/gioi-thieu, /doi-ngu, /tuyen-dung, /phap-ly)
2. Organization schema
3. Social profile links
4. Trust signals
5. Brand mentions tracking

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import os
import re
from unidecode import unidecode

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
brand_pages_collection = db['brand_pages']
team_members_collection = db['team_members']
legal_docs_collection = db['legal_documents']
brand_mentions_collection = db['brand_mentions']

# Config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')
COMPANY_NAME = "ProHouzing"


# ===================== MODELS =====================

class BrandPageCreate(BaseModel):
    page_type: str  # about, team, careers, legal, contact
    title: str
    content: str
    meta_description: Optional[str] = None
    is_published: bool = False


class TeamMemberCreate(BaseModel):
    name: str
    title: str
    department: str
    bio: str
    avatar_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    order: int = 0
    is_featured: bool = False


class LegalDocCreate(BaseModel):
    title: str
    doc_type: str  # privacy, terms, disclaimer, license
    content: str
    version: str = "1.0"
    effective_date: Optional[str] = None


class BrandMention(BaseModel):
    source_url: str
    source_name: str
    mention_type: str  # news, blog, social, review
    sentiment: str = "neutral"  # positive, neutral, negative
    content_snippet: Optional[str] = None
    mention_date: Optional[str] = None


# ===================== ORGANIZATION SCHEMA =====================

def generate_full_organization_schema() -> dict:
    """Generate comprehensive Organization schema"""
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": f"{SITE_URL}/#organization",
        "name": COMPANY_NAME,
        "alternateName": "ProH",
        "url": SITE_URL,
        "logo": {
            "@type": "ImageObject",
            "url": f"{SITE_URL}/logo.png",
            "width": 200,
            "height": 60
        },
        "image": f"{SITE_URL}/og-image.jpg",
        "description": "ProHouzing - Nền tảng bất động sản hàng đầu Việt Nam. Tư vấn mua bán, cho thuê căn hộ, nhà phố, biệt thự với đội ngũ chuyên gia giàu kinh nghiệm.",
        "slogan": "Đồng hành cùng bạn tìm tổ ấm",
        "foundingDate": "2020-01-01",
        "foundingLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Hồ Chí Minh",
                "addressCountry": "VN"
            }
        },
        "numberOfEmployees": {
            "@type": "QuantitativeValue",
            "value": 50,
            "unitText": "employees"
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Nguyễn Huệ",
            "addressLocality": "Quận 1",
            "addressRegion": "TP. Hồ Chí Minh",
            "postalCode": "700000",
            "addressCountry": "VN"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 10.7769,
            "longitude": 106.7009
        },
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": "+84-1900-636-019",
                "contactType": "customer service",
                "availableLanguage": ["Vietnamese", "English"],
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "08:00",
                    "closes": "21:00"
                }
            },
            {
                "@type": "ContactPoint",
                "telephone": "+84-28-1234-5678",
                "contactType": "sales",
                "availableLanguage": ["Vietnamese"]
            }
        ],
        "sameAs": [
            "https://facebook.com/prohouzing",
            "https://linkedin.com/company/prohouzing",
            "https://youtube.com/@prohouzing",
            "https://twitter.com/prohouzing",
            "https://instagram.com/prohouzing"
        ],
        "areaServed": [
            {
                "@type": "City",
                "name": "Hồ Chí Minh"
            },
            {
                "@type": "City",
                "name": "Hà Nội"
            },
            {
                "@type": "City",
                "name": "Đà Nẵng"
            }
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Dịch vụ BĐS",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Tư vấn mua bán BĐS"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Cho thuê căn hộ"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Tư vấn đầu tư"
                    }
                }
            ]
        },
        "award": [
            "Top 10 Sàn Giao Dịch BĐS 2024",
            "Doanh nghiệp Uy Tín 2023"
        ],
        "knowsAbout": [
            "Bất động sản",
            "Đầu tư BĐS",
            "Căn hộ cao cấp",
            "Nhà phố",
            "Biệt thự",
            "Thị trường BĐS Việt Nam"
        ]
    }


def generate_website_schema() -> dict:
    """Generate WebSite schema with sitelinks search"""
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": f"{SITE_URL}/#website",
        "url": SITE_URL,
        "name": COMPANY_NAME,
        "description": "Nền tảng bất động sản hàng đầu Việt Nam",
        "publisher": {
            "@id": f"{SITE_URL}/#organization"
        },
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": f"{SITE_URL}/search?q={{search_term_string}}"
            },
            "query-input": "required name=search_term_string"
        },
        "inLanguage": "vi-VN"
    }


# ===================== BRAND PAGE TEMPLATES =====================

BRAND_PAGE_TEMPLATES = {
    "about": {
        "slug": "gioi-thieu",
        "title": "Giới Thiệu ProHouzing - Nền Tảng BĐS Hàng Đầu Việt Nam",
        "h1": "Về ProHouzing",
        "sections": [
            "Câu chuyện thương hiệu",
            "Sứ mệnh và Tầm nhìn",
            "Giá trị cốt lõi",
            "Thành tựu nổi bật",
            "Đối tác chiến lược"
        ]
    },
    "team": {
        "slug": "doi-ngu",
        "title": "Đội Ngũ Chuyên Gia - ProHouzing",
        "h1": "Đội Ngũ Của Chúng Tôi",
        "sections": [
            "Ban lãnh đạo",
            "Đội ngũ tư vấn",
            "Đội ngũ kỹ thuật",
            "Tuyển dụng"
        ]
    },
    "careers": {
        "slug": "tuyen-dung",
        "title": "Tuyển Dụng - Cơ Hội Nghề Nghiệp Tại ProHouzing",
        "h1": "Cơ Hội Nghề Nghiệp",
        "sections": [
            "Vì sao chọn ProHouzing",
            "Văn hóa công ty",
            "Chế độ đãi ngộ",
            "Vị trí đang tuyển",
            "Quy trình ứng tuyển"
        ]
    },
    "legal": {
        "slug": "phap-ly",
        "title": "Thông Tin Pháp Lý - ProHouzing",
        "h1": "Thông Tin Pháp Lý",
        "sections": [
            "Giấy phép kinh doanh",
            "Điều khoản sử dụng",
            "Chính sách bảo mật",
            "Quy định giao dịch"
        ]
    },
    "contact": {
        "slug": "lien-he",
        "title": "Liên Hệ ProHouzing - Hotline 1900 636 019",
        "h1": "Liên Hệ Với Chúng Tôi",
        "sections": [
            "Văn phòng chính",
            "Chi nhánh",
            "Hotline hỗ trợ",
            "Form liên hệ"
        ]
    }
}


async def create_brand_page(page_type: str, title: str, content: str, meta_description: str = None) -> dict:
    """Create a brand page"""
    template = BRAND_PAGE_TEMPLATES.get(page_type)
    if not template:
        raise HTTPException(status_code=400, detail=f"Invalid page type: {page_type}")
    
    now = datetime.now(timezone.utc)
    
    page = {
        "page_type": page_type,
        "slug": template["slug"],
        "title": title or template["title"],
        "h1": template["h1"],
        "meta_description": meta_description or f"{template['title']} - {COMPANY_NAME}",
        "content": content,
        "sections": template["sections"],
        "is_published": False,
        "has_schema": True,
        "created_at": now,
        "updated_at": now
    }
    
    # Check if exists
    existing = await brand_pages_collection.find_one({"page_type": page_type})
    if existing:
        await brand_pages_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": page}
        )
        page["id"] = str(existing["_id"])
        page["action"] = "updated"
    else:
        result = await brand_pages_collection.insert_one(page)
        page["id"] = str(result.inserted_id)
        page["action"] = "created"
    
    # Remove MongoDB ObjectId before returning
    if "_id" in page:
        del page["_id"]
    
    return page


# ===================== TEAM MANAGEMENT =====================

async def create_team_member(data: TeamMemberCreate) -> dict:
    """Create team member profile"""
    now = datetime.now(timezone.utc)
    
    member = {
        "name": data.name,
        "slug": create_slug(data.name),
        "title": data.title,
        "department": data.department,
        "bio": data.bio,
        "avatar_url": data.avatar_url,
        "linkedin_url": data.linkedin_url,
        "email": data.email,
        "order": data.order,
        "is_featured": data.is_featured,
        "is_active": True,
        "created_at": now
    }
    
    result = await team_members_collection.insert_one(member)
    member["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in member:
        del member["_id"]
    
    return member


def create_slug(text: str) -> str:
    """Convert text to URL-friendly slug"""
    slug = unidecode(text)
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


async def seed_default_team():
    """Seed default team members"""
    default_team = [
        {
            "name": "Nguyễn Văn Minh",
            "title": "CEO & Founder",
            "department": "Leadership",
            "bio": "15 năm kinh nghiệm trong ngành BĐS. Từng giữ vị trí quản lý cấp cao tại các tập đoàn BĐS lớn.",
            "order": 1,
            "is_featured": True
        },
        {
            "name": "Trần Thị Hương",
            "title": "COO",
            "department": "Leadership",
            "bio": "Chuyên gia vận hành với 12 năm kinh nghiệm. MBA từ Đại học RMIT.",
            "order": 2,
            "is_featured": True
        },
        {
            "name": "Lê Hoàng Nam",
            "title": "CTO",
            "department": "Technology",
            "bio": "10 năm kinh nghiệm phát triển sản phẩm công nghệ. Từng làm việc tại các công ty công nghệ hàng đầu.",
            "order": 3,
            "is_featured": True
        },
        {
            "name": "Phạm Thị Mai",
            "title": "Giám đốc Marketing",
            "department": "Marketing",
            "bio": "8 năm kinh nghiệm marketing trong lĩnh vực BĐS và FMCG.",
            "order": 4,
            "is_featured": False
        }
    ]
    
    created = 0
    for member in default_team:
        existing = await team_members_collection.find_one({"name": member["name"]})
        if not existing:
            member["slug"] = create_slug(member["name"])
            member["is_active"] = True
            member["created_at"] = datetime.now(timezone.utc)
            await team_members_collection.insert_one(member)
            created += 1
    
    return created


# ===================== LEGAL DOCUMENTS =====================

async def create_legal_doc(data: LegalDocCreate) -> dict:
    """Create legal document"""
    now = datetime.now(timezone.utc)
    
    doc = {
        "title": data.title,
        "slug": create_slug(data.title),
        "doc_type": data.doc_type,
        "content": data.content,
        "version": data.version,
        "effective_date": data.effective_date or now.strftime("%Y-%m-%d"),
        "is_active": True,
        "created_at": now
    }
    
    # Check if exists
    existing = await legal_docs_collection.find_one({"doc_type": data.doc_type})
    if existing:
        doc["version"] = f"{float(existing.get('version', '1.0')) + 0.1:.1f}"
        await legal_docs_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": doc}
        )
        doc["id"] = str(existing["_id"])
    else:
        result = await legal_docs_collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
    
    # Remove MongoDB ObjectId before returning
    if "_id" in doc:
        del doc["_id"]
    
    return doc


# ===================== BRAND MENTIONS =====================

async def track_brand_mention(data: BrandMention) -> dict:
    """Track a brand mention"""
    now = datetime.now(timezone.utc)
    
    mention = {
        "source_url": data.source_url,
        "source_name": data.source_name,
        "mention_type": data.mention_type,
        "sentiment": data.sentiment,
        "content_snippet": data.content_snippet,
        "mention_date": data.mention_date or now.strftime("%Y-%m-%d"),
        "is_verified": False,
        "tracked_at": now
    }
    
    result = await brand_mentions_collection.insert_one(mention)
    mention["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in mention:
        del mention["_id"]
    
    return mention


# ===================== API ENDPOINTS =====================

@router.get("/schema/organization")
async def api_get_organization_schema():
    """Get full Organization schema"""
    return generate_full_organization_schema()


@router.get("/schema/website")
async def api_get_website_schema():
    """Get WebSite schema"""
    return generate_website_schema()


@router.get("/schema/all")
async def api_get_all_brand_schemas():
    """Get all brand-related schemas"""
    return {
        "organization": generate_full_organization_schema(),
        "website": generate_website_schema(),
        "json_ld": [
            f'<script type="application/ld+json">{generate_full_organization_schema()}</script>',
            f'<script type="application/ld+json">{generate_website_schema()}</script>'
        ]
    }


@router.get("/pages")
async def api_list_brand_pages():
    """List all brand pages"""
    pages = []
    async for page in brand_pages_collection.find().sort("created_at", 1):
        pages.append({
            "id": str(page["_id"]),
            "page_type": page.get("page_type"),
            "slug": page.get("slug"),
            "title": page.get("title"),
            "is_published": page.get("is_published", False)
        })
    
    # Add missing templates
    existing_types = [p["page_type"] for p in pages]
    for page_type, template in BRAND_PAGE_TEMPLATES.items():
        if page_type not in existing_types:
            pages.append({
                "id": None,
                "page_type": page_type,
                "slug": template["slug"],
                "title": template["title"],
                "is_published": False,
                "status": "not_created"
            })
    
    return {"pages": pages}


@router.get("/pages/{page_type}")
async def api_get_brand_page(page_type: str):
    """Get brand page by type"""
    page = await brand_pages_collection.find_one({"page_type": page_type})
    
    if not page:
        template = BRAND_PAGE_TEMPLATES.get(page_type)
        if template:
            return {"exists": False, "template": template}
        raise HTTPException(status_code=404, detail="Page type not found")
    
    return {
        "exists": True,
        "id": str(page["_id"]),
        "page_type": page.get("page_type"),
        "slug": page.get("slug"),
        "title": page.get("title"),
        "h1": page.get("h1"),
        "content": page.get("content"),
        "meta_description": page.get("meta_description"),
        "sections": page.get("sections"),
        "is_published": page.get("is_published", False)
    }


@router.post("/pages")
async def api_create_brand_page(data: BrandPageCreate):
    """Create or update brand page"""
    page = await create_brand_page(
        page_type=data.page_type,
        title=data.title,
        content=data.content,
        meta_description=data.meta_description
    )
    return {"success": True, "page": page}


@router.put("/pages/{page_type}/publish")
async def api_publish_brand_page(page_type: str):
    """Publish brand page"""
    await brand_pages_collection.update_one(
        {"page_type": page_type},
        {"$set": {"is_published": True}}
    )
    return {"success": True}


@router.get("/team")
async def api_list_team_members(department: Optional[str] = None, featured_only: bool = False):
    """List team members"""
    query = {"is_active": True}
    if department:
        query["department"] = department
    if featured_only:
        query["is_featured"] = True
    
    members = []
    async for m in team_members_collection.find(query).sort("order", 1):
        members.append({
            "id": str(m["_id"]),
            "name": m.get("name"),
            "slug": m.get("slug"),
            "title": m.get("title"),
            "department": m.get("department"),
            "bio": m.get("bio"),
            "avatar_url": m.get("avatar_url"),
            "linkedin_url": m.get("linkedin_url"),
            "is_featured": m.get("is_featured", False)
        })
    
    return {"members": members, "total": len(members)}


@router.post("/team")
async def api_create_team_member(data: TeamMemberCreate):
    """Create team member"""
    member = await create_team_member(data)
    return {"success": True, "member": member}


@router.post("/team/seed-defaults")
async def api_seed_default_team():
    """Seed default team members"""
    created = await seed_default_team()
    return {"success": True, "created": created}


@router.get("/legal")
async def api_list_legal_docs():
    """List legal documents"""
    docs = []
    async for d in legal_docs_collection.find({"is_active": True}):
        docs.append({
            "id": str(d["_id"]),
            "title": d.get("title"),
            "slug": d.get("slug"),
            "doc_type": d.get("doc_type"),
            "version": d.get("version"),
            "effective_date": d.get("effective_date")
        })
    return {"documents": docs}


@router.post("/legal")
async def api_create_legal_doc(data: LegalDocCreate):
    """Create legal document"""
    doc = await create_legal_doc(data)
    return {"success": True, "document": doc}


@router.get("/mentions")
async def api_list_brand_mentions(
    mention_type: Optional[str] = None,
    sentiment: Optional[str] = None,
    limit: int = 50
):
    """List brand mentions"""
    query = {}
    if mention_type:
        query["mention_type"] = mention_type
    if sentiment:
        query["sentiment"] = sentiment
    
    mentions = []
    async for m in brand_mentions_collection.find(query).sort("tracked_at", -1).limit(limit):
        mentions.append({
            "id": str(m["_id"]),
            "source_url": m.get("source_url"),
            "source_name": m.get("source_name"),
            "mention_type": m.get("mention_type"),
            "sentiment": m.get("sentiment"),
            "mention_date": m.get("mention_date")
        })
    
    return {"mentions": mentions, "total": len(mentions)}


@router.post("/mentions")
async def api_track_brand_mention(data: BrandMention):
    """Track brand mention"""
    mention = await track_brand_mention(data)
    return {"success": True, "mention": mention}


@router.get("/stats")
async def api_get_brand_stats():
    """Get brand entity statistics"""
    
    # Pages
    published_pages = await brand_pages_collection.count_documents({"is_published": True})
    total_pages = len(BRAND_PAGE_TEMPLATES)
    
    # Team
    team_count = await team_members_collection.count_documents({"is_active": True})
    featured_count = await team_members_collection.count_documents({"is_active": True, "is_featured": True})
    
    # Legal
    legal_count = await legal_docs_collection.count_documents({"is_active": True})
    
    # Mentions
    total_mentions = await brand_mentions_collection.count_documents({})
    positive_mentions = await brand_mentions_collection.count_documents({"sentiment": "positive"})
    
    return {
        "pages": {
            "published": published_pages,
            "total": total_pages,
            "completion": round(published_pages / total_pages * 100, 1)
        },
        "team": {
            "total": team_count,
            "featured": featured_count
        },
        "legal_documents": legal_count,
        "mentions": {
            "total": total_mentions,
            "positive": positive_mentions,
            "sentiment_ratio": round(positive_mentions / total_mentions * 100, 1) if total_mentions > 0 else 0
        }
    }
