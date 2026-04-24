"""
REAL USER SIGNAL ENGINE - Authentic Engagement Tracking
========================================================
Track and boost real user engagement signals

Features:
1. Real click tracking with validation
2. Deep scroll tracking
3. Time on page (target > 60s)
4. Real comments/reviews
5. Rating system with schema

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import hashlib

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
user_signals_collection = db['user_signals']
comments_collection = db['seo_comments']
ratings_collection = db['seo_ratings']
engagement_sessions_collection = db['engagement_sessions']
seo_pages_collection = db['seo_pages']

# Config
MIN_DWELL_TIME = 60  # Target 60 seconds
MIN_SCROLL_DEPTH = 50  # 50% scroll
SPAM_THRESHOLD = 5  # Max actions per minute from same IP


# ===================== MODELS =====================

class RealClickEvent(BaseModel):
    session_id: str
    page_id: str
    click_type: str  # "cta", "internal", "external", "image"
    element_id: Optional[str] = None
    target_url: Optional[str] = None
    timestamp: Optional[int] = None  # Unix timestamp


class ScrollEvent(BaseModel):
    session_id: str
    page_id: str
    scroll_depth: int = Field(ge=0, le=100)
    viewport_height: Optional[int] = None
    document_height: Optional[int] = None
    timestamp: Optional[int] = None


class TimeOnPageEvent(BaseModel):
    session_id: str
    page_id: str
    duration_seconds: int
    is_active: bool = True  # False if tab was in background
    interactions_count: int = 0


class CommentCreate(BaseModel):
    page_id: str
    author_name: str
    author_email: Optional[str] = None
    content: str
    parent_id: Optional[str] = None  # For replies
    is_verified: bool = False


class RatingCreate(BaseModel):
    page_id: str
    rating: int = Field(ge=1, le=5)
    reviewer_name: str
    review_text: Optional[str] = None
    criteria_ratings: Optional[Dict[str, int]] = None  # {"usefulness": 5, "accuracy": 4}


class EngagementSession(BaseModel):
    session_id: str
    page_id: str
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    device_type: Optional[str] = None
    country: Optional[str] = None


# ===================== HELPER FUNCTIONS =====================

def is_valid_objectid(value: str) -> bool:
    """Check if a string is a valid MongoDB ObjectId"""
    try:
        ObjectId(value)
        return True
    except Exception:
        return False


def get_client_fingerprint(request: Request) -> str:
    """Generate client fingerprint for spam detection"""
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    return hashlib.md5(f"{ip}:{ua}".encode()).hexdigest()[:16]


async def check_spam(fingerprint: str, action_type: str) -> bool:
    """Check if this is spam based on action frequency"""
    one_minute_ago = datetime.now(timezone.utc) - timedelta(minutes=1)
    
    recent_count = await user_signals_collection.count_documents({
        "fingerprint": fingerprint,
        "action_type": action_type,
        "timestamp": {"$gte": one_minute_ago}
    })
    
    return recent_count >= SPAM_THRESHOLD


async def is_quality_session(session_id: str, page_id: str) -> dict:
    """Check if session meets quality thresholds"""
    session = await engagement_sessions_collection.find_one({
        "session_id": session_id,
        "page_id": page_id
    })
    
    if not session:
        return {"is_quality": False, "reason": "Session not found"}
    
    checks = {
        "dwell_time": session.get("total_duration", 0) >= MIN_DWELL_TIME,
        "scroll_depth": session.get("max_scroll_depth", 0) >= MIN_SCROLL_DEPTH,
        "has_interaction": session.get("interactions_count", 0) > 0,
        "is_active": session.get("active_time_ratio", 0) > 0.5
    }
    
    is_quality = all(checks.values())
    
    return {
        "is_quality": is_quality,
        "checks": checks,
        "duration": session.get("total_duration", 0),
        "scroll_depth": session.get("max_scroll_depth", 0)
    }


# ===================== SIGNAL TRACKING =====================

async def track_real_click(data: RealClickEvent, fingerprint: str) -> dict:
    """Track real click with validation"""
    
    # Check spam
    if await check_spam(fingerprint, "click"):
        return {"success": False, "reason": "Rate limited"}
    
    now = datetime.now(timezone.utc)
    
    signal = {
        "session_id": data.session_id,
        "page_id": data.page_id,
        "action_type": "click",
        "click_type": data.click_type,
        "element_id": data.element_id,
        "target_url": data.target_url,
        "fingerprint": fingerprint,
        "timestamp": now,
        "is_validated": True
    }
    
    await user_signals_collection.insert_one(signal)
    
    # Update page click count only if page_id is a valid ObjectId
    if is_valid_objectid(data.page_id):
        await seo_pages_collection.update_one(
            {"_id": ObjectId(data.page_id)},
            {"$inc": {f"clicks.{data.click_type}": 1, "clicks.total": 1}}
        )
    
    # Update session
    await engagement_sessions_collection.update_one(
        {"session_id": data.session_id, "page_id": data.page_id},
        {
            "$inc": {"clicks_count": 1},
            "$set": {"last_activity": now}
        },
        upsert=True
    )
    
    return {"success": True, "click_type": data.click_type}


async def track_scroll(data: ScrollEvent, fingerprint: str) -> dict:
    """Track scroll depth"""
    
    now = datetime.now(timezone.utc)
    
    # Update session max scroll
    await engagement_sessions_collection.update_one(
        {"session_id": data.session_id, "page_id": data.page_id},
        {
            "$max": {"max_scroll_depth": data.scroll_depth},
            "$set": {"last_activity": now},
            "$inc": {"scroll_events": 1}
        },
        upsert=True
    )
    
    # Log significant scroll milestones
    if data.scroll_depth in [25, 50, 75, 100]:
        signal = {
            "session_id": data.session_id,
            "page_id": data.page_id,
            "action_type": "scroll_milestone",
            "scroll_depth": data.scroll_depth,
            "fingerprint": fingerprint,
            "timestamp": now
        }
        await user_signals_collection.insert_one(signal)
    
    return {"success": True, "scroll_depth": data.scroll_depth}


async def track_time_on_page(data: TimeOnPageEvent, fingerprint: str) -> dict:
    """Track time on page with active/inactive distinction"""
    
    now = datetime.now(timezone.utc)
    
    # Update session
    update = {
        "$set": {
            "total_duration": data.duration_seconds,
            "last_activity": now
        },
        "$inc": {"interactions_count": data.interactions_count}
    }
    
    if data.is_active:
        update["$inc"]["active_duration"] = data.duration_seconds
    
    await engagement_sessions_collection.update_one(
        {"session_id": data.session_id, "page_id": data.page_id},
        update,
        upsert=True
    )
    
    # Check if qualifies as quality session
    is_quality = data.duration_seconds >= MIN_DWELL_TIME and data.is_active
    
    # Update page quality sessions only if page_id is a valid ObjectId
    if is_quality and is_valid_objectid(data.page_id):
        await seo_pages_collection.update_one(
            {"_id": ObjectId(data.page_id)},
            {"$inc": {"quality_sessions": 1}}
        )
    
    return {
        "success": True,
        "duration": data.duration_seconds,
        "is_quality": is_quality,
        "target": MIN_DWELL_TIME
    }


# ===================== COMMENTS SYSTEM =====================

async def create_comment(data: CommentCreate, fingerprint: str) -> dict:
    """Create a comment"""
    
    # Check spam
    if await check_spam(fingerprint, "comment"):
        return {"success": False, "reason": "Rate limited"}
    
    now = datetime.now(timezone.utc)
    
    comment = {
        "page_id": data.page_id,
        "author_name": data.author_name,
        "author_email": data.author_email,
        "content": data.content,
        "parent_id": data.parent_id,
        "is_verified": data.is_verified,
        "is_approved": False,  # Require moderation
        "fingerprint": fingerprint,
        "likes_count": 0,
        "created_at": now
    }
    
    result = await comments_collection.insert_one(comment)
    
    # Update page comment count only if page_id is a valid ObjectId
    if is_valid_objectid(data.page_id):
        await seo_pages_collection.update_one(
            {"_id": ObjectId(data.page_id)},
            {"$inc": {"comments_count": 1}}
        )
    
    return {
        "success": True,
        "comment_id": str(result.inserted_id),
        "status": "pending_approval"
    }


async def get_page_comments(page_id: str, approved_only: bool = True) -> List[dict]:
    """Get comments for a page"""
    query = {"page_id": page_id}
    if approved_only:
        query["is_approved"] = True
    
    comments = []
    async for c in comments_collection.find(query).sort("created_at", -1):
        comments.append({
            "id": str(c["_id"]),
            "author_name": c.get("author_name"),
            "content": c.get("content"),
            "is_verified": c.get("is_verified", False),
            "likes_count": c.get("likes_count", 0),
            "created_at": c["created_at"].isoformat() if c.get("created_at") else None
        })
    
    return comments


# ===================== RATINGS SYSTEM =====================

async def create_rating(data: RatingCreate, fingerprint: str) -> dict:
    """Create a rating"""
    
    # Check if already rated
    existing = await ratings_collection.find_one({
        "page_id": data.page_id,
        "fingerprint": fingerprint
    })
    
    if existing:
        # Update existing rating
        await ratings_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "rating": data.rating,
                    "review_text": data.review_text,
                    "criteria_ratings": data.criteria_ratings,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return {"success": True, "action": "updated"}
    
    now = datetime.now(timezone.utc)
    
    rating = {
        "page_id": data.page_id,
        "rating": data.rating,
        "reviewer_name": data.reviewer_name,
        "review_text": data.review_text,
        "criteria_ratings": data.criteria_ratings,
        "fingerprint": fingerprint,
        "is_verified": False,
        "created_at": now
    }
    
    result = await ratings_collection.insert_one(rating)
    
    # Update page average rating
    await update_page_rating(data.page_id)
    
    return {
        "success": True,
        "rating_id": str(result.inserted_id),
        "action": "created"
    }


async def update_page_rating(page_id: str):
    """Update page average rating"""
    pipeline = [
        {"$match": {"page_id": page_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1}
        }}
    ]
    
    result = await ratings_collection.aggregate(pipeline).to_list(1)
    
    # Only update page rating if page_id is a valid ObjectId
    if result and is_valid_objectid(page_id):
        await seo_pages_collection.update_one(
            {"_id": ObjectId(page_id)},
            {
                "$set": {
                    "average_rating": round(result[0]["avg_rating"], 1),
                    "rating_count": result[0]["count"]
                }
            }
        )


async def get_page_rating_summary(page_id: str) -> dict:
    """Get rating summary for a page"""
    pipeline = [
        {"$match": {"page_id": page_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1},
            "distribution": {
                "$push": "$rating"
            }
        }}
    ]
    
    result = await ratings_collection.aggregate(pipeline).to_list(1)
    
    if not result:
        return {"average": 0, "count": 0, "distribution": {}}
    
    # Calculate distribution
    ratings = result[0]["distribution"]
    distribution = {i: ratings.count(i) for i in range(1, 6)}
    
    return {
        "average": round(result[0]["avg_rating"], 1),
        "count": result[0]["count"],
        "distribution": distribution
    }


# ===================== ENGAGEMENT QUALITY METRICS =====================

async def get_page_engagement_metrics(page_id: str) -> dict:
    """Get comprehensive engagement metrics for a page"""
    
    # Get session stats
    session_pipeline = [
        {"$match": {"page_id": page_id}},
        {"$group": {
            "_id": None,
            "total_sessions": {"$sum": 1},
            "avg_duration": {"$avg": "$total_duration"},
            "avg_scroll": {"$avg": "$max_scroll_depth"},
            "total_clicks": {"$sum": "$clicks_count"}
        }}
    ]
    
    session_stats = await engagement_sessions_collection.aggregate(session_pipeline).to_list(1)
    
    # Get quality sessions
    quality_sessions = await engagement_sessions_collection.count_documents({
        "page_id": page_id,
        "total_duration": {"$gte": MIN_DWELL_TIME},
        "max_scroll_depth": {"$gte": MIN_SCROLL_DEPTH}
    })
    
    # Get comments and ratings
    comments_count = await comments_collection.count_documents({
        "page_id": page_id,
        "is_approved": True
    })
    
    rating_summary = await get_page_rating_summary(page_id)
    
    if session_stats:
        stats = session_stats[0]
        total = stats.get("total_sessions", 0)
        
        return {
            "sessions": {
                "total": total,
                "quality": quality_sessions,
                "quality_rate": round(quality_sessions / total * 100, 1) if total > 0 else 0
            },
            "engagement": {
                "avg_duration": round(stats.get("avg_duration", 0), 1),
                "avg_scroll_depth": round(stats.get("avg_scroll", 0), 1),
                "total_clicks": stats.get("total_clicks", 0)
            },
            "social_proof": {
                "comments": comments_count,
                "average_rating": rating_summary.get("average", 0),
                "rating_count": rating_summary.get("count", 0)
            },
            "targets": {
                "min_dwell_time": MIN_DWELL_TIME,
                "min_scroll_depth": MIN_SCROLL_DEPTH
            }
        }
    
    return {
        "sessions": {"total": 0, "quality": 0, "quality_rate": 0},
        "engagement": {"avg_duration": 0, "avg_scroll_depth": 0, "total_clicks": 0},
        "social_proof": {"comments": 0, "average_rating": 0, "rating_count": 0},
        "targets": {"min_dwell_time": MIN_DWELL_TIME, "min_scroll_depth": MIN_SCROLL_DEPTH}
    }


# ===================== API ENDPOINTS =====================

@router.post("/track/click")
async def api_track_click(data: RealClickEvent, request: Request):
    """Track real click event"""
    fingerprint = get_client_fingerprint(request)
    return await track_real_click(data, fingerprint)


@router.post("/track/scroll")
async def api_track_scroll(data: ScrollEvent, request: Request):
    """Track scroll event"""
    fingerprint = get_client_fingerprint(request)
    return await track_scroll(data, fingerprint)


@router.post("/track/time")
async def api_track_time(data: TimeOnPageEvent, request: Request):
    """Track time on page"""
    fingerprint = get_client_fingerprint(request)
    return await track_time_on_page(data, fingerprint)


@router.post("/session/start")
async def api_start_engagement_session(data: EngagementSession, request: Request):
    """Start engagement session"""
    fingerprint = get_client_fingerprint(request)
    now = datetime.now(timezone.utc)
    
    session = {
        "session_id": data.session_id,
        "page_id": data.page_id,
        "fingerprint": fingerprint,
        "user_agent": data.user_agent or request.headers.get("user-agent"),
        "referrer": data.referrer or request.headers.get("referer"),
        "device_type": data.device_type,
        "country": data.country,
        "started_at": now,
        "last_activity": now,
        "total_duration": 0,
        "max_scroll_depth": 0,
        "clicks_count": 0,
        "interactions_count": 0
    }
    
    await engagement_sessions_collection.update_one(
        {"session_id": data.session_id, "page_id": data.page_id},
        {"$setOnInsert": session},
        upsert=True
    )
    
    return {"success": True, "session_id": data.session_id}


@router.get("/session/quality/{session_id}/{page_id}")
async def api_check_session_quality(session_id: str, page_id: str):
    """Check if session meets quality thresholds"""
    return await is_quality_session(session_id, page_id)


@router.post("/comments")
async def api_create_comment(data: CommentCreate, request: Request):
    """Create comment"""
    fingerprint = get_client_fingerprint(request)
    return await create_comment(data, fingerprint)


@router.get("/comments/{page_id}")
async def api_get_comments(page_id: str, approved_only: bool = True):
    """Get page comments"""
    comments = await get_page_comments(page_id, approved_only)
    return {"comments": comments, "total": len(comments)}


@router.put("/comments/{comment_id}/approve")
async def api_approve_comment(comment_id: str):
    """Approve a comment"""
    await comments_collection.update_one(
        {"_id": ObjectId(comment_id)},
        {"$set": {"is_approved": True}}
    )
    return {"success": True}


@router.post("/ratings")
async def api_create_rating(data: RatingCreate, request: Request):
    """Create rating"""
    fingerprint = get_client_fingerprint(request)
    return await create_rating(data, fingerprint)


@router.get("/ratings/{page_id}")
async def api_get_ratings(page_id: str):
    """Get page ratings"""
    summary = await get_page_rating_summary(page_id)
    
    # Get recent reviews
    reviews = []
    async for r in ratings_collection.find({
        "page_id": page_id,
        "review_text": {"$ne": None}
    }).sort("created_at", -1).limit(10):
        reviews.append({
            "reviewer_name": r.get("reviewer_name"),
            "rating": r.get("rating"),
            "review_text": r.get("review_text"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None
        })
    
    return {
        **summary,
        "reviews": reviews
    }


@router.get("/metrics/{page_id}")
async def api_get_engagement_metrics(page_id: str):
    """Get comprehensive engagement metrics"""
    return await get_page_engagement_metrics(page_id)


@router.get("/stats")
async def api_get_overall_stats(days: int = 7):
    """Get overall user signal statistics"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Total sessions
    total_sessions = await engagement_sessions_collection.count_documents({
        "started_at": {"$gte": start_date}
    })
    
    # Quality sessions
    quality_sessions = await engagement_sessions_collection.count_documents({
        "started_at": {"$gte": start_date},
        "total_duration": {"$gte": MIN_DWELL_TIME},
        "max_scroll_depth": {"$gte": MIN_SCROLL_DEPTH}
    })
    
    # Average metrics
    avg_pipeline = [
        {"$match": {"started_at": {"$gte": start_date}}},
        {"$group": {
            "_id": None,
            "avg_duration": {"$avg": "$total_duration"},
            "avg_scroll": {"$avg": "$max_scroll_depth"}
        }}
    ]
    avg_result = await engagement_sessions_collection.aggregate(avg_pipeline).to_list(1)
    
    # Comments and ratings
    total_comments = await comments_collection.count_documents({
        "created_at": {"$gte": start_date}
    })
    total_ratings = await ratings_collection.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    return {
        "period_days": days,
        "sessions": {
            "total": total_sessions,
            "quality": quality_sessions,
            "quality_rate": round(quality_sessions / total_sessions * 100, 1) if total_sessions > 0 else 0
        },
        "averages": {
            "duration": round(avg_result[0]["avg_duration"], 1) if avg_result else 0,
            "scroll_depth": round(avg_result[0]["avg_scroll"], 1) if avg_result else 0
        },
        "engagement": {
            "comments": total_comments,
            "ratings": total_ratings
        },
        "targets": {
            "min_dwell_time": MIN_DWELL_TIME,
            "min_scroll_depth": MIN_SCROLL_DEPTH
        }
    }
