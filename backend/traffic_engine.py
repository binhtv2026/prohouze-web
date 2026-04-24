"""
TRAFFIC + SOCIAL ENGINE - SEO DOMINATION
=========================================
Auto-generate social posts and seed traffic

Features:
1. Social post generator (Facebook format)
2. Traffic tracking
3. Dwell time tracking
4. Click simulation (light, ethical)

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import re
import random

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
seo_pages_collection = db['seo_pages']
traffic_logs_collection = db['traffic_logs']
social_posts_collection = db['social_posts']
dwell_time_collection = db['dwell_time']

# Site config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')


# ===================== MODELS =====================

class TrafficLog(BaseModel):
    page_id: str
    url: str
    source: str = "direct"  # direct, social, search, referral
    device: str = "desktop"
    session_id: Optional[str] = None


class DwellTimeLog(BaseModel):
    page_id: str
    session_id: str
    duration_seconds: int
    scroll_depth: int = 0  # 0-100 percentage


class SocialPostRequest(BaseModel):
    page_id: str
    platform: str = "facebook"  # facebook, zalo, linkedin


# ===================== SOCIAL POST TEMPLATES =====================

FACEBOOK_POST_TEMPLATES = [
    """🏠 {title}

{excerpt}

👉 Xem chi tiết: {url}

#BĐS #BấtĐộngSản #{location} #MuaNhà #ĐầuTư""",

    """💡 Bạn đang tìm hiểu về {keyword}?

{excerpt}

📖 Đọc ngay: {url}

#RealEstate #{location} #TưVấnBĐS""",

    """🔥 HOT! {title}

{excerpt}

🔗 Link: {url}

#ProHouzing #NhàĐất #{location}""",

    """📊 {title}

✅ {bullet1}
✅ {bullet2}
✅ {bullet3}

👉 Chi tiết tại: {url}

#BĐS #{location} #ĐầuTưBĐS""",
]

ZALO_POST_TEMPLATES = [
    """🏠 {title}

{excerpt}

Xem thêm 👉 {url}""",
    
    """💡 {keyword} - Những điều bạn cần biết

{excerpt}

Chi tiết: {url}""",
]


def generate_social_post(page: dict, platform: str = "facebook") -> str:
    """Generate social media post from page content"""
    
    title = page.get("title", "")
    keyword = page.get("keyword", "")
    meta = page.get("meta_description", "")
    content = page.get("content", "")
    slug = page.get("slug", "")
    
    # Extract location from keyword
    locations = ["Đà Nẵng", "HCM", "Hà Nội", "Bình Dương", "Đồng Nai", "Quảng Nam"]
    location = "VietNam"
    for loc in locations:
        if loc.lower() in keyword.lower():
            location = loc.replace(" ", "")
            break
    
    # Build URL
    content_type = page.get("content_type", "landing")
    if content_type == "blog":
        url = f"{SITE_URL}/blog/{slug}"
    else:
        url = f"{SITE_URL}/{slug}"
    
    # Extract excerpt (first 150 chars of meta or content)
    excerpt = meta[:150] if meta else re.sub(r'<[^>]+>', '', content)[:150]
    excerpt = excerpt.strip() + "..."
    
    # Extract bullet points from H2 tags
    h2_tags = page.get("h2_tags", [])
    bullet1 = h2_tags[0] if len(h2_tags) > 0 else "Thông tin chi tiết"
    bullet2 = h2_tags[1] if len(h2_tags) > 1 else "Phân tích chuyên sâu"
    bullet3 = h2_tags[2] if len(h2_tags) > 2 else "Tư vấn miễn phí"
    
    # Select template
    if platform == "facebook":
        template = random.choice(FACEBOOK_POST_TEMPLATES)
    else:
        template = random.choice(ZALO_POST_TEMPLATES)
    
    # Format post
    post = template.format(
        title=title,
        keyword=keyword,
        excerpt=excerpt,
        url=url,
        location=location,
        bullet1=bullet1,
        bullet2=bullet2,
        bullet3=bullet3
    )
    
    return post


# ===================== TRAFFIC TRACKING =====================

async def log_page_view(
    page_id: str,
    url: str,
    source: str = "direct",
    device: str = "desktop",
    session_id: str = None,
    ip: str = None,
    user_agent: str = None
):
    """Log a page view"""
    
    doc = {
        "page_id": page_id,
        "url": url,
        "source": source,
        "device": device,
        "session_id": session_id,
        "ip": ip,
        "user_agent": user_agent,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await traffic_logs_collection.insert_one(doc)
    
    # Update page view count
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {"$inc": {"view_count": 1}}
    )


async def log_dwell_time(
    page_id: str,
    session_id: str,
    duration_seconds: int,
    scroll_depth: int = 0
):
    """Log dwell time for a page view"""
    
    doc = {
        "page_id": page_id,
        "session_id": session_id,
        "duration_seconds": duration_seconds,
        "scroll_depth": scroll_depth,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await dwell_time_collection.insert_one(doc)
    
    # Update page average dwell time
    pipeline = [
        {"$match": {"page_id": page_id}},
        {"$group": {"_id": None, "avg_dwell": {"$avg": "$duration_seconds"}}}
    ]
    result = await dwell_time_collection.aggregate(pipeline).to_list(1)
    
    if result:
        await seo_pages_collection.update_one(
            {"_id": ObjectId(page_id)},
            {"$set": {"avg_dwell_time": result[0]["avg_dwell"]}}
        )


# ===================== API ENDPOINTS =====================

@router.post("/generate-social")
async def api_generate_social_post(request: SocialPostRequest):
    """Generate social media post for a page"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(request.page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    post_content = generate_social_post(page, request.platform)
    
    # Save social post
    doc = {
        "page_id": request.page_id,
        "platform": request.platform,
        "content": post_content,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "posted_at": None,
        "clicks": 0
    }
    result = await social_posts_collection.insert_one(doc)
    
    return {
        "success": True,
        "post_id": str(result.inserted_id),
        "platform": request.platform,
        "content": post_content
    }


@router.get("/social-posts")
async def api_list_social_posts(
    page_id: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """List generated social posts"""
    
    query = {}
    if page_id:
        query["page_id"] = page_id
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    
    posts = []
    async for post in social_posts_collection.find(query).sort("created_at", -1).limit(limit):
        posts.append({
            "id": str(post["_id"]),
            "page_id": post.get("page_id"),
            "platform": post.get("platform"),
            "content": post.get("content"),
            "status": post.get("status"),
            "clicks": post.get("clicks", 0),
            "created_at": post["created_at"].isoformat() if post.get("created_at") else None
        })
    
    return {"posts": posts, "total": len(posts)}


@router.post("/track-view")
async def api_track_page_view(log: TrafficLog, request: Request):
    """Track a page view"""
    
    # Get client info
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    
    await log_page_view(
        page_id=log.page_id,
        url=log.url,
        source=log.source,
        device=log.device,
        session_id=log.session_id,
        ip=ip,
        user_agent=user_agent
    )
    
    return {"success": True}


@router.post("/track-dwell")
async def api_track_dwell_time(log: DwellTimeLog):
    """Track dwell time for a page"""
    
    await log_dwell_time(
        page_id=log.page_id,
        session_id=log.session_id,
        duration_seconds=log.duration_seconds,
        scroll_depth=log.scroll_depth
    )
    
    return {"success": True}


@router.get("/traffic-stats")
async def api_traffic_stats(days: int = 7):
    """Get traffic statistics"""
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Total views
    total_views = await traffic_logs_collection.count_documents({
        "timestamp": {"$gte": start_date}
    })
    
    # Views by source
    source_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    by_source = {}
    async for doc in traffic_logs_collection.aggregate(source_pipeline):
        by_source[doc["_id"] or "direct"] = doc["count"]
    
    # Views by device
    device_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$device", "count": {"$sum": 1}}}
    ]
    by_device = {}
    async for doc in traffic_logs_collection.aggregate(device_pipeline):
        by_device[doc["_id"] or "desktop"] = doc["count"]
    
    # Daily views
    daily_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    daily_views = []
    async for doc in traffic_logs_collection.aggregate(daily_pipeline):
        daily_views.append({"date": doc["_id"], "views": doc["count"]})
    
    # Average dwell time
    dwell_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": None, "avg": {"$avg": "$duration_seconds"}}}
    ]
    dwell_result = await dwell_time_collection.aggregate(dwell_pipeline).to_list(1)
    avg_dwell = dwell_result[0]["avg"] if dwell_result else 0
    
    return {
        "period_days": days,
        "total_views": total_views,
        "by_source": by_source,
        "by_device": by_device,
        "daily_views": daily_views,
        "avg_dwell_time_seconds": round(avg_dwell, 1)
    }


@router.get("/top-pages")
async def api_top_pages(limit: int = 10):
    """Get top pages by views"""
    
    pipeline = [
        {"$match": {"status": "published"}},
        {"$sort": {"view_count": -1}},
        {"$limit": limit}
    ]
    
    pages = []
    async for page in seo_pages_collection.aggregate(pipeline):
        pages.append({
            "id": str(page["_id"]),
            "title": page.get("title"),
            "slug": page.get("slug"),
            "view_count": page.get("view_count", 0),
            "avg_dwell_time": page.get("avg_dwell_time", 0)
        })
    
    return {"pages": pages}


@router.post("/mark-posted/{post_id}")
async def api_mark_social_posted(post_id: str):
    """Mark a social post as posted"""
    
    await social_posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {
            "$set": {
                "status": "posted",
                "posted_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"success": True}


# ===================== INTERNAL CLICK FLOW ENGINE =====================

internal_clicks_collection = db['internal_clicks']


class InternalClickLog(BaseModel):
    session_id: str
    from_page_id: str
    to_page_id: str
    from_url: str
    to_url: str
    click_type: str = "related"  # related, cta, internal_link, navigation


class RelatedPostsRequest(BaseModel):
    page_id: str
    limit: int = 5


async def log_internal_click(
    session_id: str,
    from_page_id: str,
    to_page_id: str,
    from_url: str,
    to_url: str,
    click_type: str = "related"
):
    """Log internal click for traffic flow tracking"""
    doc = {
        "session_id": session_id,
        "from_page_id": from_page_id,
        "to_page_id": to_page_id,
        "from_url": from_url,
        "to_url": to_url,
        "click_type": click_type,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await internal_clicks_collection.insert_one(doc)
    
    # Update page internal click count
    await seo_pages_collection.update_one(
        {"_id": ObjectId(to_page_id)},
        {"$inc": {"internal_click_count": 1}}
    )


async def get_related_posts(page_id: str, limit: int = 5) -> List[dict]:
    """Get related posts for a page to encourage internal clicks"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        return []
    
    keyword = page.get("keyword", "")
    content_type = page.get("content_type", "landing")
    cluster_id = page.get("cluster_id")
    
    related = []
    
    # Priority 1: Same cluster (if exists)
    if cluster_id:
        async for p in seo_pages_collection.find({
            "cluster_id": cluster_id,
            "_id": {"$ne": ObjectId(page_id)},
            "status": "published"
        }).limit(3):
            related.append({
                "id": str(p["_id"]),
                "title": p.get("title"),
                "slug": p.get("slug"),
                "content_type": p.get("content_type"),
                "relevance": "cluster"
            })
    
    # Priority 2: Similar keywords
    if len(related) < limit and keyword:
        keywords = keyword.lower().split()
        keyword_query = {"$or": [
            {"keyword": {"$regex": k, "$options": "i"}} for k in keywords[:3]
        ]}
        
        async for p in seo_pages_collection.find({
            **keyword_query,
            "_id": {"$ne": ObjectId(page_id)},
            "status": "published"
        }).limit(limit - len(related)):
            if str(p["_id"]) not in [r["id"] for r in related]:
                related.append({
                    "id": str(p["_id"]),
                    "title": p.get("title"),
                    "slug": p.get("slug"),
                    "content_type": p.get("content_type"),
                    "relevance": "keyword"
                })
    
    # Priority 3: Same content type with high SEO score
    if len(related) < limit:
        async for p in seo_pages_collection.find({
            "content_type": content_type,
            "_id": {"$ne": ObjectId(page_id)},
            "status": "published",
            "seo_score": {"$gte": 70}
        }).sort("view_count", -1).limit(limit - len(related)):
            if str(p["_id"]) not in [r["id"] for r in related]:
                related.append({
                    "id": str(p["_id"]),
                    "title": p.get("title"),
                    "slug": p.get("slug"),
                    "content_type": p.get("content_type"),
                    "relevance": "type"
                })
    
    return related[:limit]


@router.post("/track-internal-click")
async def api_track_internal_click(log: InternalClickLog):
    """Track internal click for traffic flow"""
    
    await log_internal_click(
        session_id=log.session_id,
        from_page_id=log.from_page_id,
        to_page_id=log.to_page_id,
        from_url=log.from_url,
        to_url=log.to_url,
        click_type=log.click_type
    )
    
    return {"success": True}


@router.get("/related-posts/{page_id}")
async def api_get_related_posts(page_id: str, limit: int = 5):
    """Get related posts for internal linking"""
    
    related = await get_related_posts(page_id, limit)
    return {"related_posts": related}


@router.get("/internal-click-stats")
async def api_internal_click_stats(days: int = 7):
    """Get internal click statistics"""
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    total_clicks = await internal_clicks_collection.count_documents({
        "timestamp": {"$gte": start_date}
    })
    
    # By click type
    type_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$click_type", "count": {"$sum": 1}}}
    ]
    by_type = {}
    async for doc in internal_clicks_collection.aggregate(type_pipeline):
        by_type[doc["_id"] or "unknown"] = doc["count"]
    
    # Top destination pages
    dest_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$to_page_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_destinations = []
    async for doc in internal_clicks_collection.aggregate(dest_pipeline):
        page = await seo_pages_collection.find_one({"_id": ObjectId(doc["_id"])})
        top_destinations.append({
            "page_id": doc["_id"],
            "title": page.get("title") if page else "Unknown",
            "clicks": doc["count"]
        })
    
    # Average clicks per session
    session_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$session_id", "clicks": {"$sum": 1}}},
        {"$group": {"_id": None, "avg": {"$avg": "$clicks"}}}
    ]
    session_result = await internal_clicks_collection.aggregate(session_pipeline).to_list(1)
    avg_clicks_per_session = session_result[0]["avg"] if session_result else 0
    
    return {
        "period_days": days,
        "total_internal_clicks": total_clicks,
        "by_click_type": by_type,
        "top_destinations": top_destinations,
        "avg_clicks_per_session": round(avg_clicks_per_session, 2)
    }


# ===================== SESSION TRACKING (≥30s) =====================

session_tracking_collection = db['session_tracking']


class SessionStart(BaseModel):
    session_id: str
    page_id: str
    url: str
    referrer: Optional[str] = None


class SessionUpdate(BaseModel):
    session_id: str
    page_id: str
    duration_seconds: int
    scroll_depth: int = 0
    interactions: int = 0  # clicks, scrolls, etc.


async def start_session(
    session_id: str,
    page_id: str,
    url: str,
    referrer: str = None
):
    """Start tracking a session"""
    doc = {
        "session_id": session_id,
        "page_id": page_id,
        "url": url,
        "referrer": referrer,
        "started_at": datetime.now(timezone.utc),
        "last_update": datetime.now(timezone.utc),
        "duration_seconds": 0,
        "scroll_depth": 0,
        "interactions": 0,
        "is_qualified": False  # True if duration >= 30s
    }
    
    await session_tracking_collection.update_one(
        {"session_id": session_id, "page_id": page_id},
        {"$set": doc},
        upsert=True
    )


async def update_session(
    session_id: str,
    page_id: str,
    duration_seconds: int,
    scroll_depth: int = 0,
    interactions: int = 0
):
    """Update session tracking data"""
    is_qualified = duration_seconds >= 30
    
    await session_tracking_collection.update_one(
        {"session_id": session_id, "page_id": page_id},
        {
            "$set": {
                "duration_seconds": duration_seconds,
                "scroll_depth": scroll_depth,
                "interactions": interactions,
                "is_qualified": is_qualified,
                "last_update": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update page stats if qualified
    if is_qualified:
        await seo_pages_collection.update_one(
            {"_id": ObjectId(page_id)},
            {"$inc": {"qualified_sessions": 1}}
        )


@router.post("/session/start")
async def api_start_session(data: SessionStart):
    """Start session tracking"""
    
    await start_session(
        session_id=data.session_id,
        page_id=data.page_id,
        url=data.url,
        referrer=data.referrer
    )
    
    return {"success": True, "session_id": data.session_id}


@router.post("/session/update")
async def api_update_session(data: SessionUpdate):
    """Update session with dwell time and engagement"""
    
    await update_session(
        session_id=data.session_id,
        page_id=data.page_id,
        duration_seconds=data.duration_seconds,
        scroll_depth=data.scroll_depth,
        interactions=data.interactions
    )
    
    return {
        "success": True,
        "is_qualified": data.duration_seconds >= 30
    }


@router.get("/session/stats")
async def api_session_stats(days: int = 7):
    """Get session quality statistics"""
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    total_sessions = await session_tracking_collection.count_documents({
        "started_at": {"$gte": start_date}
    })
    
    qualified_sessions = await session_tracking_collection.count_documents({
        "started_at": {"$gte": start_date},
        "is_qualified": True
    })
    
    # Average duration
    duration_pipeline = [
        {"$match": {"started_at": {"$gte": start_date}}},
        {"$group": {"_id": None, "avg": {"$avg": "$duration_seconds"}}}
    ]
    duration_result = await session_tracking_collection.aggregate(duration_pipeline).to_list(1)
    avg_duration = duration_result[0]["avg"] if duration_result else 0
    
    # Average scroll depth
    scroll_pipeline = [
        {"$match": {"started_at": {"$gte": start_date}}},
        {"$group": {"_id": None, "avg": {"$avg": "$scroll_depth"}}}
    ]
    scroll_result = await session_tracking_collection.aggregate(scroll_pipeline).to_list(1)
    avg_scroll = scroll_result[0]["avg"] if scroll_result else 0
    
    return {
        "period_days": days,
        "total_sessions": total_sessions,
        "qualified_sessions": qualified_sessions,
        "qualification_rate": round((qualified_sessions / total_sessions * 100) if total_sessions > 0 else 0, 1),
        "avg_duration_seconds": round(avg_duration, 1),
        "avg_scroll_depth": round(avg_scroll, 1),
        "target_duration": 30
    }

