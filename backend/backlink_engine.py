"""
BACKLINK ENGINE - SEO DOMINATION
=================================
Build backlink network from satellite sites

Features:
1. Satellite site management (10 subdomains)
2. Auto content generation for satellite sites
3. Backlink insertion (anchor text random)
4. Non-duplicate content validation
5. Backlink tracking and reporting

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import re
import random
import hashlib
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
satellite_sites_collection = db['satellite_sites']
satellite_posts_collection = db['satellite_posts']
backlinks_collection = db['backlinks']
seo_pages_collection = db['seo_pages']

# Config
MAIN_SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')


# ===================== MODELS =====================

class SatelliteSiteCreate(BaseModel):
    domain: str  # e.g., blog1.prohouzing.com
    name: str
    niche: str = "real_estate"  # Topic focus
    description: Optional[str] = None


class SatelliteSiteResponse(BaseModel):
    id: str
    domain: str
    name: str
    niche: str
    description: Optional[str]
    total_posts: int
    total_backlinks: int
    is_active: bool
    created_at: str


class SatellitePostCreate(BaseModel):
    site_id: str
    title: str
    content: str
    target_page_slugs: List[str] = []  # Main site pages to link to
    anchor_texts: List[str] = []  # Anchor text variations


class BacklinkCreate(BaseModel):
    source_site_id: str
    source_post_id: str
    source_url: str
    target_url: str
    anchor_text: str
    position: str = "body"  # body, sidebar, footer


class BacklinkStats(BaseModel):
    total_backlinks: int
    by_site: Dict[str, int]
    by_anchor: Dict[str, int]
    recent_7_days: int


# ===================== HELPER FUNCTIONS =====================

def create_slug(text: str) -> str:
    """Convert text to URL-friendly slug"""
    slug = unidecode(text)
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    slug = re.sub(r'-+', '-', slug)
    return slug


def generate_content_hash(content: str) -> str:
    """Generate hash for content similarity check"""
    normalized = re.sub(r'\s+', ' ', content.lower().strip())
    return hashlib.md5(normalized.encode()).hexdigest()


def generate_random_anchor_texts(keyword: str) -> List[str]:
    """Generate random anchor text variations"""
    templates = [
        keyword,
        f"{keyword} tại ProHouzing",
        f"xem thêm về {keyword}",
        f"tìm hiểu {keyword}",
        f"chi tiết {keyword}",
        f"{keyword} mới nhất",
        "xem tại đây",
        "tìm hiểu thêm",
        "click để xem",
        f"mua {keyword}",
        f"đầu tư {keyword}",
    ]
    
    # Return 3-5 random variations
    return random.sample(templates, min(5, len(templates)))


# ===================== SATELLITE SITE MANAGEMENT =====================

async def create_satellite_site(domain: str, name: str, niche: str, description: str = None) -> dict:
    """Create a new satellite site"""
    
    # Check if domain already exists
    existing = await satellite_sites_collection.find_one({"domain": domain})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already registered")
    
    site_id = str(ObjectId())
    now = datetime.now(timezone.utc)
    
    site = {
        "_id": ObjectId(site_id),
        "id": site_id,
        "domain": domain,
        "name": name,
        "niche": niche,
        "description": description,
        "total_posts": 0,
        "total_backlinks": 0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await satellite_sites_collection.insert_one(site)
    return site


async def generate_default_satellite_sites():
    """Generate default 10 satellite sites"""
    
    base_domain = "prohouzing.com"
    sites = [
        {"subdomain": "blog1", "name": "ProH Real Estate Blog", "niche": "real_estate"},
        {"subdomain": "blog2", "name": "Vietnam Property Guide", "niche": "property_guide"},
        {"subdomain": "blog3", "name": "Home Buying Tips", "niche": "home_buying"},
        {"subdomain": "blog4", "name": "Investment Insights", "niche": "investment"},
        {"subdomain": "blog5", "name": "City Living Guide", "niche": "lifestyle"},
        {"subdomain": "news1", "name": "Property News Hub", "niche": "news"},
        {"subdomain": "news2", "name": "Market Updates", "niche": "market"},
        {"subdomain": "guide1", "name": "First Time Buyer Guide", "niche": "first_time_buyer"},
        {"subdomain": "guide2", "name": "Investor Handbook", "niche": "investor"},
        {"subdomain": "review1", "name": "Project Reviews", "niche": "reviews"},
    ]
    
    created = 0
    for site in sites:
        domain = f"{site['subdomain']}.{base_domain}"
        
        # Check if exists
        existing = await satellite_sites_collection.find_one({"domain": domain})
        if existing:
            continue
        
        try:
            await create_satellite_site(
                domain=domain,
                name=site["name"],
                niche=site["niche"],
                description=f"Satellite site for {site['niche']} content"
            )
            created += 1
        except:
            continue
    
    return created


# ===================== CONTENT GENERATION FOR SATELLITES =====================

SATELLITE_CONTENT_PROMPT = """Bạn là content writer cho website bất động sản.

NHIỆM VỤ: Viết bài blog ngắn gọn (~800-1200 từ) cho satellite site.

YÊU CẦU:
1. Nội dung PHẢI KHÁC với main site (không duplicate)
2. Viết tự nhiên, đa dạng từ ngữ
3. PHẢI chèn 3 backlink tự nhiên vào nội dung
4. Anchor text phải đa dạng, không lặp lại

BACKLINKS CẦN CHÈN:
{backlinks}

FORMAT OUTPUT (JSON):
{{
    "title": "Tiêu đề bài viết",
    "content": "Nội dung HTML với backlinks đã chèn",
    "meta_description": "Mô tả ngắn",
    "backlinks_inserted": ["anchor1", "anchor2", "anchor3"]
}}

QUAN TRỌNG:
- Mỗi backlink PHẢI xuất hiện tự nhiên trong câu
- Không spam, không nhồi keyword
- Nội dung phải có giá trị thực sự"""


async def generate_satellite_content(
    topic: str,
    target_pages: List[dict],  # [{url, keyword, anchor_texts}]
    niche: str = "real_estate"
) -> dict:
    """Generate unique content for satellite site with backlinks"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    # Build backlinks context
    backlinks_context = []
    for page in target_pages[:3]:  # Max 3 backlinks per post
        anchor = random.choice(page.get("anchor_texts", [page["keyword"]]))
        backlinks_context.append(f"- URL: {page['url']}, Anchor: \"{anchor}\"")
    
    backlinks_str = "\n".join(backlinks_context)
    
    system_prompt = SATELLITE_CONTENT_PROMPT.format(backlinks=backlinks_str)
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"satellite-{datetime.now().timestamp()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"""Viết bài về chủ đề: "{topic}"
            
Niche: {niche}
Yêu cầu: Bài viết độc đáo, không trùng với các bài viết khác.

Trả về JSON theo format."""
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON
        import json
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            return json.loads(json_match.group())
        
        raise ValueError("Could not parse JSON response")
        
    except Exception as e:
        print(f"[BACKLINK] Content generation error: {e}")
        raise


async def check_content_uniqueness(content: str, min_similarity: float = 0.3) -> bool:
    """Check if content is unique enough"""
    content_hash = generate_content_hash(content)
    
    # Check exact match
    exact = await satellite_posts_collection.find_one({"content_hash": content_hash})
    if exact:
        return False
    
    # For more sophisticated similarity, would need NLP comparison
    # For now, hash comparison is sufficient
    return True


# ===================== BACKLINK MANAGEMENT =====================

async def create_backlink(
    source_site_id: str,
    source_post_id: str,
    source_url: str,
    target_url: str,
    anchor_text: str,
    position: str = "body"
) -> dict:
    """Create a backlink record"""
    
    backlink_id = str(ObjectId())
    now = datetime.now(timezone.utc)
    
    backlink = {
        "_id": ObjectId(backlink_id),
        "id": backlink_id,
        "source_site_id": source_site_id,
        "source_post_id": source_post_id,
        "source_url": source_url,
        "target_url": target_url,
        "anchor_text": anchor_text,
        "position": position,
        "is_active": True,
        "created_at": now
    }
    
    await backlinks_collection.insert_one(backlink)
    
    # Update site stats
    await satellite_sites_collection.update_one(
        {"id": source_site_id},
        {"$inc": {"total_backlinks": 1}}
    )
    
    return backlink


async def get_backlink_stats() -> dict:
    """Get backlink statistics"""
    
    total = await backlinks_collection.count_documents({"is_active": True})
    
    # By site
    by_site_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$source_site_id", "count": {"$sum": 1}}}
    ]
    by_site = {}
    async for doc in backlinks_collection.aggregate(by_site_pipeline):
        by_site[doc["_id"]] = doc["count"]
    
    # By anchor text (top 10)
    by_anchor_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$anchor_text", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    by_anchor = {}
    async for doc in backlinks_collection.aggregate(by_anchor_pipeline):
        by_anchor[doc["_id"]] = doc["count"]
    
    # Recent 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = await backlinks_collection.count_documents({
        "is_active": True,
        "created_at": {"$gte": week_ago}
    })
    
    return {
        "total_backlinks": total,
        "by_site": by_site,
        "by_anchor": by_anchor,
        "recent_7_days": recent
    }


# ===================== AUTO BACKLINK GENERATION =====================

async def auto_generate_backlinks_for_page(page_id: str, num_backlinks: int = 3) -> List[dict]:
    """Automatically generate backlinks for a main site page"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    keyword = page.get("keyword", "")
    slug = page.get("slug", "")
    target_url = f"{MAIN_SITE_URL}/{slug}"
    
    # Get active satellite sites
    sites = await satellite_sites_collection.find({"is_active": True}).to_list(10)
    if not sites:
        # Create default sites
        await generate_default_satellite_sites()
        sites = await satellite_sites_collection.find({"is_active": True}).to_list(10)
    
    if not sites:
        return []
    
    created_backlinks = []
    
    # Generate anchor text variations
    anchor_texts = generate_random_anchor_texts(keyword)
    
    # Select random sites for backlinks
    selected_sites = random.sample(sites, min(num_backlinks, len(sites)))
    
    for idx, site in enumerate(selected_sites):
        try:
            # Generate unique content
            topic_variations = [
                f"Kinh nghiệm {keyword} cho người mới",
                f"Xu hướng {keyword} năm 2026",
                f"Hướng dẫn {keyword} chi tiết",
                f"5 điều cần biết về {keyword}",
                f"Phân tích thị trường {keyword}",
            ]
            
            topic = random.choice(topic_variations)
            
            target_pages = [{
                "url": target_url,
                "keyword": keyword,
                "anchor_texts": anchor_texts
            }]
            
            # Generate content
            content_data = await generate_satellite_content(
                topic=topic,
                target_pages=target_pages,
                niche=site.get("niche", "real_estate")
            )
            
            # Check uniqueness
            if not await check_content_uniqueness(content_data.get("content", "")):
                continue
            
            # Create satellite post
            post_id = str(ObjectId())
            now = datetime.now(timezone.utc)
            
            post = {
                "_id": ObjectId(post_id),
                "id": post_id,
                "site_id": site["id"],
                "title": content_data.get("title", topic),
                "slug": create_slug(content_data.get("title", topic)),
                "content": content_data.get("content", ""),
                "content_hash": generate_content_hash(content_data.get("content", "")),
                "meta_description": content_data.get("meta_description", ""),
                "target_urls": [target_url],
                "backlinks_inserted": content_data.get("backlinks_inserted", []),
                "status": "draft",
                "created_at": now
            }
            
            await satellite_posts_collection.insert_one(post)
            
            # Update site post count
            await satellite_sites_collection.update_one(
                {"id": site["id"]},
                {"$inc": {"total_posts": 1}}
            )
            
            # Create backlink record
            anchor = random.choice(anchor_texts)
            backlink = await create_backlink(
                source_site_id=site["id"],
                source_post_id=post_id,
                source_url=f"https://{site['domain']}/{post['slug']}",
                target_url=target_url,
                anchor_text=anchor,
                position="body"
            )
            
            created_backlinks.append({
                "backlink_id": backlink["id"],
                "post_id": post_id,
                "site_domain": site["domain"],
                "anchor_text": anchor,
                "target_url": target_url
            })
            
        except Exception as e:
            print(f"[BACKLINK] Error creating backlink from {site['domain']}: {e}")
            continue
    
    # Update main page with backlink count
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$inc": {"backlink_count": len(created_backlinks)},
            "$set": {"last_backlink_at": datetime.now(timezone.utc)}
        }
    )
    
    return created_backlinks


# ===================== API ENDPOINTS =====================

@router.get("/sites")
async def api_list_satellite_sites():
    """List all satellite sites"""
    sites = []
    async for site in satellite_sites_collection.find().sort("created_at", -1):
        sites.append({
            "id": site.get("id") or str(site["_id"]),
            "domain": site.get("domain"),
            "name": site.get("name"),
            "niche": site.get("niche"),
            "description": site.get("description"),
            "total_posts": site.get("total_posts", 0),
            "total_backlinks": site.get("total_backlinks", 0),
            "is_active": site.get("is_active", True),
            "created_at": site["created_at"].isoformat() if site.get("created_at") else None
        })
    
    return {"sites": sites, "total": len(sites)}


@router.post("/sites")
async def api_create_satellite_site(data: SatelliteSiteCreate):
    """Create a new satellite site"""
    site = await create_satellite_site(
        domain=data.domain,
        name=data.name,
        niche=data.niche,
        description=data.description
    )
    
    return {
        "success": True,
        "site": {
            "id": site.get("id"),
            "domain": site.get("domain"),
            "name": site.get("name")
        }
    }


@router.post("/sites/generate-defaults")
async def api_generate_default_sites():
    """Generate default 10 satellite sites"""
    created = await generate_default_satellite_sites()
    return {"success": True, "created": created}


@router.put("/sites/{site_id}/toggle")
async def api_toggle_site(site_id: str):
    """Toggle satellite site active status"""
    site = await satellite_sites_collection.find_one({"id": site_id})
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    new_status = not site.get("is_active", True)
    await satellite_sites_collection.update_one(
        {"id": site_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"success": True, "is_active": new_status}


@router.delete("/sites/{site_id}")
async def api_delete_site(site_id: str):
    """Delete a satellite site"""
    await satellite_sites_collection.delete_one({"id": site_id})
    await satellite_posts_collection.delete_many({"site_id": site_id})
    await backlinks_collection.delete_many({"source_site_id": site_id})
    
    return {"success": True}


@router.get("/posts")
async def api_list_satellite_posts(
    site_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """List satellite posts"""
    query = {}
    if site_id:
        query["site_id"] = site_id
    if status:
        query["status"] = status
    
    posts = []
    async for post in satellite_posts_collection.find(query).sort("created_at", -1).limit(limit):
        posts.append({
            "id": post.get("id") or str(post["_id"]),
            "site_id": post.get("site_id"),
            "title": post.get("title"),
            "slug": post.get("slug"),
            "target_urls": post.get("target_urls", []),
            "backlinks_inserted": post.get("backlinks_inserted", []),
            "status": post.get("status"),
            "created_at": post["created_at"].isoformat() if post.get("created_at") else None
        })
    
    return {"posts": posts, "total": len(posts)}


@router.get("/posts/{post_id}")
async def api_get_satellite_post(post_id: str):
    """Get satellite post details"""
    post = await satellite_posts_collection.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "id": post.get("id"),
        "site_id": post.get("site_id"),
        "title": post.get("title"),
        "slug": post.get("slug"),
        "content": post.get("content"),
        "meta_description": post.get("meta_description"),
        "target_urls": post.get("target_urls", []),
        "backlinks_inserted": post.get("backlinks_inserted", []),
        "status": post.get("status"),
        "created_at": post["created_at"].isoformat() if post.get("created_at") else None
    }


@router.post("/posts/{post_id}/publish")
async def api_publish_satellite_post(post_id: str):
    """Mark satellite post as published"""
    await satellite_posts_collection.update_one(
        {"id": post_id},
        {
            "$set": {
                "status": "published",
                "published_at": datetime.now(timezone.utc)
            }
        }
    )
    return {"success": True}


@router.get("/backlinks")
async def api_list_backlinks(
    source_site_id: Optional[str] = None,
    target_url: Optional[str] = None,
    limit: int = 100
):
    """List backlinks"""
    query = {"is_active": True}
    if source_site_id:
        query["source_site_id"] = source_site_id
    if target_url:
        query["target_url"] = {"$regex": target_url, "$options": "i"}
    
    backlinks = []
    async for bl in backlinks_collection.find(query).sort("created_at", -1).limit(limit):
        backlinks.append({
            "id": bl.get("id") or str(bl["_id"]),
            "source_site_id": bl.get("source_site_id"),
            "source_url": bl.get("source_url"),
            "target_url": bl.get("target_url"),
            "anchor_text": bl.get("anchor_text"),
            "position": bl.get("position"),
            "created_at": bl["created_at"].isoformat() if bl.get("created_at") else None
        })
    
    return {"backlinks": backlinks, "total": len(backlinks)}


@router.get("/stats")
async def api_get_backlink_stats():
    """Get backlink statistics"""
    stats = await get_backlink_stats()
    
    # Add site names
    sites_by_id = {}
    async for site in satellite_sites_collection.find():
        sites_by_id[site.get("id") or str(site["_id"])] = site.get("name")
    
    stats["by_site_names"] = {
        sites_by_id.get(site_id, site_id): count
        for site_id, count in stats.get("by_site", {}).items()
    }
    
    return stats


@router.post("/generate/{page_id}")
async def api_generate_backlinks_for_page(
    page_id: str,
    num_backlinks: int = 3,
    background_tasks: BackgroundTasks = None
):
    """Generate backlinks for a main site page"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Run in background if background_tasks provided
    if background_tasks:
        background_tasks.add_task(auto_generate_backlinks_for_page, page_id, num_backlinks)
        return {
            "success": True,
            "message": f"Generating {num_backlinks} backlinks in background",
            "page_id": page_id
        }
    
    # Run synchronously
    backlinks = await auto_generate_backlinks_for_page(page_id, num_backlinks)
    
    return {
        "success": True,
        "created_backlinks": len(backlinks),
        "backlinks": backlinks
    }


@router.post("/batch-generate")
async def api_batch_generate_backlinks(
    page_ids: List[str],
    num_backlinks_per_page: int = 3,
    background_tasks: BackgroundTasks = None
):
    """Generate backlinks for multiple pages"""
    
    async def process_batch():
        results = []
        for page_id in page_ids[:20]:  # Limit to 20 pages per batch
            try:
                backlinks = await auto_generate_backlinks_for_page(page_id, num_backlinks_per_page)
                results.append({
                    "page_id": page_id,
                    "created": len(backlinks)
                })
            except Exception as e:
                results.append({
                    "page_id": page_id,
                    "error": str(e)
                })
        return results
    
    if background_tasks:
        background_tasks.add_task(process_batch)
        return {
            "success": True,
            "message": f"Processing {len(page_ids)} pages in background"
        }
    
    results = await process_batch()
    return {
        "success": True,
        "results": results
    }


@router.get("/page-backlinks/{page_id}")
async def api_get_page_backlinks(page_id: str):
    """Get all backlinks pointing to a main site page"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    slug = page.get("slug", "")
    target_url = f"{MAIN_SITE_URL}/{slug}"
    
    backlinks = []
    async for bl in backlinks_collection.find({
        "target_url": target_url,
        "is_active": True
    }):
        backlinks.append({
            "id": bl.get("id"),
            "source_url": bl.get("source_url"),
            "anchor_text": bl.get("anchor_text"),
            "position": bl.get("position"),
            "created_at": bl["created_at"].isoformat() if bl.get("created_at") else None
        })
    
    return {
        "page_id": page_id,
        "target_url": target_url,
        "backlinks": backlinks,
        "total": len(backlinks)
    }
