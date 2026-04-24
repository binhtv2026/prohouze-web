"""
AUTHORITY BACKLINK ENGINE - High Quality Backlinks
===================================================
Build authority backlinks beyond satellite sites

Features:
1. Guest post opportunities
2. Forum/community links
3. Press release distribution
4. Citation building
5. Broken link building

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os

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
authority_sites_collection = db['authority_backlink_sites']
authority_links_collection = db['authority_backlinks']
outreach_campaigns_collection = db['outreach_campaigns']
seo_pages_collection = db['seo_pages']

SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')


# ===================== MODELS =====================

class AuthoritySiteCreate(BaseModel):
    domain: str
    name: str
    site_type: str  # guest_post, forum, news, directory, social
    da_score: int = Field(ge=0, le=100, default=30)  # Domain Authority
    pa_score: int = Field(ge=0, le=100, default=30)  # Page Authority
    category: str = "real_estate"  # real_estate, finance, lifestyle, news
    contact_email: Optional[str] = None
    contact_url: Optional[str] = None
    submission_guidelines: Optional[str] = None
    cost: float = 0  # Cost per link if paid
    notes: Optional[str] = None


class AuthorityLinkCreate(BaseModel):
    site_id: str
    target_page_id: str
    source_url: str
    anchor_text: str
    link_type: str = "dofollow"  # dofollow, nofollow, sponsored
    status: str = "pending"  # pending, live, removed
    cost: float = 0


class OutreachCampaignCreate(BaseModel):
    name: str
    target_page_id: str
    site_ids: List[str]
    email_template: Optional[str] = None
    status: str = "draft"  # draft, active, completed


# ===================== DEFAULT AUTHORITY SITES =====================

GUEST_POST_SITES = [
    {"domain": "cafeland.vn", "name": "CafeLand", "da": 65, "category": "real_estate"},
    {"domain": "batdongsan.com.vn", "name": "Batdongsan.com.vn", "da": 72, "category": "real_estate"},
    {"domain": "vnexpress.net/bat-dong-san", "name": "VnExpress BĐS", "da": 90, "category": "news"},
    {"domain": "thanhnien.vn/bat-dong-san", "name": "Thanh Niên BĐS", "da": 85, "category": "news"},
    {"domain": "nguoilaodong.vn/bat-dong-san", "name": "Người Lao Động BĐS", "da": 78, "category": "news"},
]

FORUM_SITES = [
    {"domain": "webtretho.com", "name": "WebTreTho", "da": 55, "category": "lifestyle"},
    {"domain": "vozforums.com", "name": "VOZ Forums", "da": 60, "category": "general"},
    {"domain": "otofun.net", "name": "OtoFun", "da": 52, "category": "automotive"},
    {"domain": "tinhte.vn", "name": "Tinh Tế", "da": 70, "category": "tech"},
]

DIRECTORY_SITES = [
    {"domain": "pages.vn", "name": "Pages.vn", "da": 45, "category": "directory"},
    {"domain": "yellowpages.vn", "name": "Yellow Pages VN", "da": 50, "category": "directory"},
    {"domain": "hotfrog.vn", "name": "Hotfrog VN", "da": 40, "category": "directory"},
]

PR_SITES = [
    {"domain": "brandsvietnam.com", "name": "Brands Vietnam", "da": 55, "category": "marketing"},
    {"domain": "marketingai.vn", "name": "Marketing AI", "da": 48, "category": "marketing"},
    {"domain": "pr-vietnam.com", "name": "PR Vietnam", "da": 42, "category": "pr"},
]


async def seed_authority_sites():
    """Seed default authority sites"""
    all_sites = []
    
    for site in GUEST_POST_SITES:
        all_sites.append({
            **site,
            "site_type": "guest_post",
            "da_score": site.get("da", 30),
            "pa_score": site.get("da", 30) - 10,
        })
    
    for site in FORUM_SITES:
        all_sites.append({
            **site,
            "site_type": "forum",
            "da_score": site.get("da", 30),
            "pa_score": site.get("da", 30) - 10,
        })
    
    for site in DIRECTORY_SITES:
        all_sites.append({
            **site,
            "site_type": "directory",
            "da_score": site.get("da", 30),
            "pa_score": site.get("da", 30) - 10,
        })
    
    for site in PR_SITES:
        all_sites.append({
            **site,
            "site_type": "news",
            "da_score": site.get("da", 30),
            "pa_score": site.get("da", 30) - 10,
        })
    
    created = 0
    for site in all_sites:
        existing = await authority_sites_collection.find_one({"domain": site["domain"]})
        if not existing:
            site["is_active"] = True
            site["link_count"] = 0
            site["cost"] = 0
            site["created_at"] = datetime.now(timezone.utc)
            await authority_sites_collection.insert_one(site)
            created += 1
    
    return created


# ===================== AUTHORITY LINK MANAGEMENT =====================

async def create_authority_link(data: AuthorityLinkCreate) -> dict:
    """Create authority backlink record"""
    
    site = await authority_sites_collection.find_one({"_id": ObjectId(data.site_id)})
    if not site:
        raise HTTPException(status_code=404, detail="Authority site not found")
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(data.target_page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Target page not found")
    
    now = datetime.now(timezone.utc)
    
    link = {
        "site_id": data.site_id,
        "site_domain": site.get("domain"),
        "site_name": site.get("name"),
        "site_type": site.get("site_type"),
        "da_score": site.get("da_score", 0),
        "target_page_id": data.target_page_id,
        "target_url": f"{SITE_URL}/{page.get('slug', '')}",
        "target_keyword": page.get("keyword"),
        "source_url": data.source_url,
        "anchor_text": data.anchor_text,
        "link_type": data.link_type,
        "status": data.status,
        "cost": data.cost,
        "created_at": now,
        "last_checked": now
    }
    
    result = await authority_links_collection.insert_one(link)
    link["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in link:
        del link["_id"]
    
    # Update site link count
    await authority_sites_collection.update_one(
        {"_id": ObjectId(data.site_id)},
        {"$inc": {"link_count": 1}}
    )
    
    # Update page authority backlink count
    await seo_pages_collection.update_one(
        {"_id": ObjectId(data.target_page_id)},
        {
            "$inc": {"authority_backlink_count": 1},
            "$set": {"last_authority_link_at": now}
        }
    )
    
    return link


async def get_page_authority_links(page_id: str) -> List[dict]:
    """Get all authority backlinks for a page"""
    links = []
    async for link in authority_links_collection.find({
        "target_page_id": page_id,
        "status": "live"
    }).sort("da_score", -1):
        links.append({
            "id": str(link["_id"]),
            "site_domain": link.get("site_domain"),
            "site_name": link.get("site_name"),
            "site_type": link.get("site_type"),
            "da_score": link.get("da_score"),
            "source_url": link.get("source_url"),
            "anchor_text": link.get("anchor_text"),
            "link_type": link.get("link_type"),
            "status": link.get("status"),
            "created_at": link["created_at"].isoformat() if link.get("created_at") else None
        })
    return links


async def get_authority_backlink_stats() -> dict:
    """Get authority backlink statistics"""
    
    total_sites = await authority_sites_collection.count_documents({"is_active": True})
    total_links = await authority_links_collection.count_documents({})
    live_links = await authority_links_collection.count_documents({"status": "live"})
    
    # By site type
    type_pipeline = [
        {"$group": {"_id": "$site_type", "count": {"$sum": 1}}}
    ]
    by_type = {}
    async for doc in authority_links_collection.aggregate(type_pipeline):
        by_type[doc["_id"] or "unknown"] = doc["count"]
    
    # Average DA
    da_pipeline = [
        {"$match": {"status": "live"}},
        {"$group": {"_id": None, "avg_da": {"$avg": "$da_score"}}}
    ]
    da_result = await authority_links_collection.aggregate(da_pipeline).to_list(1)
    avg_da = da_result[0]["avg_da"] if da_result else 0
    
    # Recent 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_links = await authority_links_collection.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Top sites by DA
    top_sites = []
    async for site in authority_sites_collection.find({"is_active": True}).sort("da_score", -1).limit(10):
        top_sites.append({
            "domain": site.get("domain"),
            "name": site.get("name"),
            "da_score": site.get("da_score"),
            "link_count": site.get("link_count", 0)
        })
    
    return {
        "sites": {
            "total": total_sites,
            "top_by_da": top_sites
        },
        "links": {
            "total": total_links,
            "live": live_links,
            "pending": total_links - live_links
        },
        "by_type": by_type,
        "average_da": round(avg_da, 1),
        "recent_7_days": recent_links
    }


# ===================== OUTREACH CAMPAIGN =====================

EMAIL_TEMPLATES = {
    "guest_post": """
Xin chào,

Tôi là {author_name} từ {company_name}. Tôi rất quan tâm đến việc đóng góp một bài viết guest post cho {site_name}.

Tôi đã chuẩn bị một bài viết chất lượng về chủ đề: "{topic}"

Bài viết này sẽ mang lại giá trị cho độc giả của quý vị vì:
- Thông tin thực tế từ chuyên gia BĐS với {years} năm kinh nghiệm
- Dữ liệu và số liệu cập nhật
- Nội dung độc quyền, chưa đăng ở đâu

Xin vui lòng cho tôi biết nếu quý vị quan tâm.

Trân trọng,
{author_name}
{company_name}
""",
    "broken_link": """
Xin chào,

Tôi phát hiện một broken link trên trang {page_url} của quý vị.

Link bị hỏng: {broken_link}

Tôi có một tài nguyên tương tự có thể thay thế: {replacement_url}

Hy vọng thông tin này hữu ích!

Trân trọng,
{author_name}
""",
    "resource_link": """
Xin chào,

Tôi thấy bài viết "{article_title}" của quý vị rất hữu ích.

Tôi nghĩ độc giả cũng sẽ thích tài nguyên này: {resource_url}

Nếu phù hợp, quý vị có thể cân nhắc thêm vào phần tài nguyên tham khảo.

Trân trọng,
{author_name}
"""
}


async def create_outreach_campaign(data: OutreachCampaignCreate) -> dict:
    """Create outreach campaign for link building"""
    now = datetime.now(timezone.utc)
    
    # Get target page info
    page = await seo_pages_collection.find_one({"_id": ObjectId(data.target_page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Target page not found")
    
    # Get sites info
    sites = []
    for site_id in data.site_ids:
        site = await authority_sites_collection.find_one({"_id": ObjectId(site_id)})
        if site:
            sites.append({
                "id": str(site["_id"]),
                "domain": site.get("domain"),
                "name": site.get("name"),
                "da_score": site.get("da_score"),
                "status": "pending"
            })
    
    campaign = {
        "name": data.name,
        "target_page_id": data.target_page_id,
        "target_url": f"{SITE_URL}/{page.get('slug', '')}",
        "target_keyword": page.get("keyword"),
        "sites": sites,
        "email_template": data.email_template or EMAIL_TEMPLATES.get("guest_post", ""),
        "status": data.status,
        "total_sites": len(sites),
        "contacted": 0,
        "responded": 0,
        "links_acquired": 0,
        "created_at": now,
        "updated_at": now
    }
    
    result = await outreach_campaigns_collection.insert_one(campaign)
    campaign["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in campaign:
        del campaign["_id"]
    
    return campaign


# ===================== API ENDPOINTS =====================

@router.get("/sites")
async def api_list_authority_sites(
    site_type: Optional[str] = None,
    category: Optional[str] = None,
    min_da: int = 0
):
    """List authority sites"""
    query = {"is_active": True, "da_score": {"$gte": min_da}}
    if site_type:
        query["site_type"] = site_type
    if category:
        query["category"] = category
    
    sites = []
    async for site in authority_sites_collection.find(query).sort("da_score", -1):
        sites.append({
            "id": str(site["_id"]),
            "domain": site.get("domain"),
            "name": site.get("name"),
            "site_type": site.get("site_type"),
            "da_score": site.get("da_score"),
            "pa_score": site.get("pa_score"),
            "category": site.get("category"),
            "link_count": site.get("link_count", 0),
            "cost": site.get("cost", 0)
        })
    
    return {"sites": sites, "total": len(sites)}


@router.post("/sites")
async def api_create_authority_site(data: AuthoritySiteCreate):
    """Create authority site"""
    now = datetime.now(timezone.utc)
    
    site = {
        "domain": data.domain,
        "name": data.name,
        "site_type": data.site_type,
        "da_score": data.da_score,
        "pa_score": data.pa_score,
        "category": data.category,
        "contact_email": data.contact_email,
        "contact_url": data.contact_url,
        "submission_guidelines": data.submission_guidelines,
        "cost": data.cost,
        "notes": data.notes,
        "is_active": True,
        "link_count": 0,
        "created_at": now
    }
    
    result = await authority_sites_collection.insert_one(site)
    site["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in site:
        del site["_id"]
    
    return {"success": True, "site": site}


@router.post("/sites/seed-defaults")
async def api_seed_default_sites():
    """Seed default authority sites"""
    created = await seed_authority_sites()
    return {"success": True, "created": created}


@router.get("/links")
async def api_list_authority_links(
    site_type: Optional[str] = None,
    status: Optional[str] = None,
    page_id: Optional[str] = None,
    limit: int = 50
):
    """List authority backlinks"""
    query = {}
    if site_type:
        query["site_type"] = site_type
    if status:
        query["status"] = status
    if page_id:
        query["target_page_id"] = page_id
    
    links = []
    async for link in authority_links_collection.find(query).sort("created_at", -1).limit(limit):
        links.append({
            "id": str(link["_id"]),
            "site_domain": link.get("site_domain"),
            "site_name": link.get("site_name"),
            "site_type": link.get("site_type"),
            "da_score": link.get("da_score"),
            "target_keyword": link.get("target_keyword"),
            "source_url": link.get("source_url"),
            "anchor_text": link.get("anchor_text"),
            "link_type": link.get("link_type"),
            "status": link.get("status"),
            "created_at": link["created_at"].isoformat() if link.get("created_at") else None
        })
    
    return {"links": links, "total": len(links)}


@router.post("/links")
async def api_create_authority_link(data: AuthorityLinkCreate):
    """Create authority backlink"""
    link = await create_authority_link(data)
    return {"success": True, "link": link}


@router.put("/links/{link_id}/status")
async def api_update_link_status(link_id: str, status: str):
    """Update link status (pending, live, removed)"""
    await authority_links_collection.update_one(
        {"_id": ObjectId(link_id)},
        {
            "$set": {
                "status": status,
                "last_checked": datetime.now(timezone.utc)
            }
        }
    )
    return {"success": True}


@router.get("/page/{page_id}")
async def api_get_page_authority_links(page_id: str):
    """Get authority links for a page"""
    links = await get_page_authority_links(page_id)
    
    # Calculate total DA value
    total_da = sum(l.get("da_score", 0) for l in links)
    avg_da = total_da / len(links) if links else 0
    
    return {
        "page_id": page_id,
        "links": links,
        "total": len(links),
        "total_da_value": total_da,
        "average_da": round(avg_da, 1)
    }


@router.get("/stats")
async def api_get_authority_stats():
    """Get authority backlink statistics"""
    return await get_authority_backlink_stats()


@router.get("/campaigns")
async def api_list_campaigns(status: Optional[str] = None, limit: int = 20):
    """List outreach campaigns"""
    query = {}
    if status:
        query["status"] = status
    
    campaigns = []
    async for c in outreach_campaigns_collection.find(query).sort("created_at", -1).limit(limit):
        campaigns.append({
            "id": str(c["_id"]),
            "name": c.get("name"),
            "target_keyword": c.get("target_keyword"),
            "total_sites": c.get("total_sites"),
            "contacted": c.get("contacted", 0),
            "links_acquired": c.get("links_acquired", 0),
            "status": c.get("status"),
            "created_at": c["created_at"].isoformat() if c.get("created_at") else None
        })
    
    return {"campaigns": campaigns}


@router.post("/campaigns")
async def api_create_campaign(data: OutreachCampaignCreate):
    """Create outreach campaign"""
    campaign = await create_outreach_campaign(data)
    return {"success": True, "campaign": campaign}


@router.get("/email-templates")
async def api_get_email_templates():
    """Get available email templates"""
    return {"templates": EMAIL_TEMPLATES}
