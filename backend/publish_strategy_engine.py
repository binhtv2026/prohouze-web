"""
PUBLISH STRATEGY ENGINE - SEO DOMINATION
==========================================
Drip-feed content publishing for sustainable SEO growth

Features:
1. Smart publish scheduling (10-20 pages/day)
2. Random time distribution
3. Priority-based queue
4. Auto publish with indexing
5. Batch operations

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import random
import asyncio

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
seo_keywords_collection = db['seo_keywords']
publish_queue_collection = db['publish_queue']
publish_logs_collection = db['publish_logs']

# Site config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')


# ===================== MODELS =====================

class PublishConfig(BaseModel):
    pages_per_day_min: int = 10
    pages_per_day_max: int = 20
    start_hour: int = 8  # Start publishing at 8 AM
    end_hour: int = 22  # End publishing at 10 PM
    min_seo_score: int = 60  # Minimum SEO score to publish
    prioritize_pillars: bool = True  # Pillar pages first
    auto_index: bool = True  # Auto submit for indexing


class AddToQueueRequest(BaseModel):
    page_ids: List[str]
    priority: int = 0  # Higher = more priority


class PublishSchedule(BaseModel):
    date: str  # YYYY-MM-DD
    time_slots: List[str]  # HH:MM times
    page_ids: List[str]


# ===================== CONFIG MANAGEMENT =====================

async def get_publish_config() -> dict:
    """Get publish configuration"""
    config = await db.seo_config.find_one({"type": "publish_strategy"})
    if not config:
        # Default config
        return {
            "pages_per_day_min": 10,
            "pages_per_day_max": 20,
            "start_hour": 8,
            "end_hour": 22,
            "min_seo_score": 60,
            "prioritize_pillars": True,
            "auto_index": True,
            "is_active": True
        }
    return config


async def save_publish_config(config: PublishConfig) -> dict:
    """Save publish configuration"""
    config_dict = config.dict()
    config_dict["type"] = "publish_strategy"
    config_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.seo_config.update_one(
        {"type": "publish_strategy"},
        {"$set": config_dict},
        upsert=True
    )
    return config_dict


# ===================== QUEUE MANAGEMENT =====================

async def add_to_publish_queue(page_ids: List[str], priority: int = 0) -> int:
    """Add pages to publish queue"""
    added = 0
    now = datetime.now(timezone.utc)
    
    for page_id in page_ids:
        # Check if page exists and is draft
        page = await seo_pages_collection.find_one({
            "_id": ObjectId(page_id),
            "status": "draft"
        })
        
        if not page:
            continue
        
        # Check if already in queue
        existing = await publish_queue_collection.find_one({"page_id": page_id})
        if existing:
            continue
        
        queue_item = {
            "page_id": page_id,
            "page_title": page.get("title", ""),
            "page_slug": page.get("slug", ""),
            "seo_score": page.get("seo_score", 0),
            "word_count": page.get("word_count", 0),
            "content_type": page.get("content_type", "landing"),
            "is_pillar": page.get("is_pillar", False),
            "priority": priority,
            "status": "pending",  # pending, scheduled, published, failed
            "scheduled_at": None,
            "published_at": None,
            "error": None,
            "added_at": now
        }
        
        await publish_queue_collection.insert_one(queue_item)
        added += 1
    
    return added


async def remove_from_queue(page_id: str) -> bool:
    """Remove page from publish queue"""
    result = await publish_queue_collection.delete_one({"page_id": page_id})
    return result.deleted_count > 0


async def get_queue_items(status: str = None, limit: int = 50) -> List[dict]:
    """Get items from publish queue"""
    query = {}
    if status:
        query["status"] = status
    
    items = []
    async for item in publish_queue_collection.find(query).sort([
        ("priority", -1),
        ("is_pillar", -1),
        ("seo_score", -1),
        ("added_at", 1)
    ]).limit(limit):
        items.append({
            "id": str(item["_id"]),
            "page_id": item.get("page_id"),
            "page_title": item.get("page_title"),
            "page_slug": item.get("page_slug"),
            "seo_score": item.get("seo_score"),
            "content_type": item.get("content_type"),
            "is_pillar": item.get("is_pillar"),
            "priority": item.get("priority"),
            "status": item.get("status"),
            "scheduled_at": item["scheduled_at"].isoformat() if item.get("scheduled_at") else None,
            "added_at": item["added_at"].isoformat() if item.get("added_at") else None
        })
    
    return items


# ===================== SCHEDULING ENGINE =====================

def generate_random_times(start_hour: int, end_hour: int, count: int) -> List[str]:
    """Generate random publish times within time window"""
    times = []
    for _ in range(count):
        hour = random.randint(start_hour, end_hour - 1)
        minute = random.randint(0, 59)
        times.append(f"{hour:02d}:{minute:02d}")
    
    # Sort times
    times.sort()
    return times


async def create_daily_schedule(date: str = None) -> dict:
    """Create publish schedule for a day"""
    config = await get_publish_config()
    
    if not config.get("is_active", True):
        return {"error": "Publish strategy is disabled"}
    
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Determine number of pages to publish
    pages_count = random.randint(
        config.get("pages_per_day_min", 10),
        config.get("pages_per_day_max", 20)
    )
    
    # Generate random times
    times = generate_random_times(
        config.get("start_hour", 8),
        config.get("end_hour", 22),
        pages_count
    )
    
    # Get pages from queue (prioritized)
    query = {"status": "pending"}
    if config.get("min_seo_score", 60) > 0:
        query["seo_score"] = {"$gte": config["min_seo_score"]}
    
    sort_order = [
        ("priority", -1),
        ("seo_score", -1),
        ("added_at", 1)
    ]
    
    if config.get("prioritize_pillars", True):
        sort_order.insert(0, ("is_pillar", -1))
    
    queue_items = await publish_queue_collection.find(query).sort(sort_order).limit(pages_count).to_list(pages_count)
    
    if not queue_items:
        return {"error": "No pages in queue to schedule", "date": date}
    
    # Schedule pages
    schedule = {
        "date": date,
        "time_slots": [],
        "page_ids": [],
        "scheduled_count": 0
    }
    
    for idx, item in enumerate(queue_items):
        if idx >= len(times):
            break
        
        scheduled_time = datetime.strptime(f"{date} {times[idx]}", "%Y-%m-%d %H:%M")
        scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
        
        # Update queue item
        await publish_queue_collection.update_one(
            {"_id": item["_id"]},
            {
                "$set": {
                    "status": "scheduled",
                    "scheduled_at": scheduled_time
                }
            }
        )
        
        schedule["time_slots"].append(times[idx])
        schedule["page_ids"].append(item["page_id"])
        schedule["scheduled_count"] += 1
    
    # Save schedule to logs
    await publish_logs_collection.insert_one({
        "type": "schedule_created",
        "date": date,
        "schedule": schedule,
        "config": config,
        "created_at": datetime.now(timezone.utc)
    })
    
    return schedule


async def execute_scheduled_publishes():
    """Execute all scheduled publishes that are due"""
    now = datetime.now(timezone.utc)
    config = await get_publish_config()
    
    # Find scheduled items that are due
    due_items = await publish_queue_collection.find({
        "status": "scheduled",
        "scheduled_at": {"$lte": now}
    }).to_list(50)
    
    results = {
        "published": 0,
        "failed": 0,
        "errors": []
    }
    
    for item in due_items:
        try:
            page_id = item["page_id"]
            
            # Publish the page
            await seo_pages_collection.update_one(
                {"_id": ObjectId(page_id)},
                {
                    "$set": {
                        "status": "published",
                        "published_at": now
                    }
                }
            )
            
            # Update keyword status
            page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
            if page and page.get("keyword"):
                await seo_keywords_collection.update_one(
                    {"keyword": page["keyword"]},
                    {"$set": {"status": "published"}}
                )
            
            # Update queue status
            await publish_queue_collection.update_one(
                {"_id": item["_id"]},
                {
                    "$set": {
                        "status": "published",
                        "published_at": now
                    }
                }
            )
            
            # Auto submit for indexing if enabled
            if config.get("auto_index", True):
                try:
                    from indexing_engine import auto_index_published_page
                    await auto_index_published_page(page_id)
                except Exception as index_error:
                    print(f"[PUBLISH] Index error for {page_id}: {index_error}")
            
            results["published"] += 1
            
            # Log success
            await publish_logs_collection.insert_one({
                "type": "publish_success",
                "page_id": page_id,
                "page_slug": item.get("page_slug"),
                "scheduled_at": item.get("scheduled_at"),
                "published_at": now,
                "created_at": now
            })
            
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({
                "page_id": item["page_id"],
                "error": str(e)
            })
            
            # Update queue with error
            await publish_queue_collection.update_one(
                {"_id": item["_id"]},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(e)
                    }
                }
            )
    
    return results


# ===================== BATCH OPERATIONS =====================

async def auto_queue_draft_pages(min_seo_score: int = 60, limit: int = 100) -> int:
    """Automatically add draft pages to queue"""
    # Find draft pages not in queue
    pipeline = [
        {
            "$match": {
                "status": "draft",
                "seo_score": {"$gte": min_seo_score}
            }
        },
        {
            "$lookup": {
                "from": "publish_queue",
                "localField": "_id",
                "foreignField": "page_id",
                "as": "queue_item"
            }
        },
        {
            "$match": {
                "queue_item": {"$size": 0}
            }
        },
        {
            "$limit": limit
        }
    ]
    
    pages = await seo_pages_collection.aggregate(pipeline).to_list(limit)
    
    if not pages:
        return 0
    
    page_ids = [str(p["_id"]) for p in pages]
    return await add_to_publish_queue(page_ids, priority=0)


# ===================== API ENDPOINTS =====================

@router.get("/config")
async def api_get_publish_config():
    """Get current publish configuration"""
    config = await get_publish_config()
    # Remove _id for JSON response
    if "_id" in config:
        del config["_id"]
    return config


@router.post("/config")
async def api_update_publish_config(config: PublishConfig):
    """Update publish configuration"""
    result = await save_publish_config(config)
    return {"success": True, "config": config.dict()}


@router.post("/toggle")
async def api_toggle_publish_strategy():
    """Enable/disable publish strategy"""
    config = await get_publish_config()
    new_status = not config.get("is_active", True)
    
    await db.seo_config.update_one(
        {"type": "publish_strategy"},
        {"$set": {"is_active": new_status}},
        upsert=True
    )
    
    return {"success": True, "is_active": new_status}


@router.post("/queue/add")
async def api_add_to_queue(request: AddToQueueRequest):
    """Add pages to publish queue"""
    added = await add_to_publish_queue(request.page_ids, request.priority)
    return {
        "success": True,
        "added": added,
        "requested": len(request.page_ids)
    }


@router.delete("/queue/{page_id}")
async def api_remove_from_queue(page_id: str):
    """Remove page from queue"""
    removed = await remove_from_queue(page_id)
    return {"success": removed}


@router.get("/queue")
async def api_get_queue(status: Optional[str] = None, limit: int = 50):
    """Get publish queue"""
    items = await get_queue_items(status, limit)
    
    # Get queue stats
    pending = await publish_queue_collection.count_documents({"status": "pending"})
    scheduled = await publish_queue_collection.count_documents({"status": "scheduled"})
    published = await publish_queue_collection.count_documents({"status": "published"})
    failed = await publish_queue_collection.count_documents({"status": "failed"})
    
    return {
        "items": items,
        "stats": {
            "pending": pending,
            "scheduled": scheduled,
            "published": published,
            "failed": failed,
            "total": pending + scheduled + published + failed
        }
    }


@router.post("/queue/auto-add")
async def api_auto_queue_drafts(min_seo_score: int = 60, limit: int = 100):
    """Automatically add draft pages to queue"""
    added = await auto_queue_draft_pages(min_seo_score, limit)
    return {
        "success": True,
        "added": added
    }


@router.post("/schedule/create")
async def api_create_schedule(date: Optional[str] = None):
    """Create publish schedule for a day"""
    schedule = await create_daily_schedule(date)
    return schedule


@router.post("/schedule/execute")
async def api_execute_schedule(background_tasks: BackgroundTasks):
    """Execute due scheduled publishes"""
    background_tasks.add_task(execute_scheduled_publishes)
    return {"success": True, "message": "Execution started in background"}


@router.get("/schedule/today")
async def api_get_today_schedule():
    """Get today's publish schedule"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get scheduled items for today
    start = datetime.strptime(f"{today} 00:00", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    end = datetime.strptime(f"{today} 23:59", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    
    items = []
    async for item in publish_queue_collection.find({
        "scheduled_at": {"$gte": start, "$lte": end}
    }).sort("scheduled_at", 1):
        items.append({
            "page_id": item.get("page_id"),
            "page_title": item.get("page_title"),
            "page_slug": item.get("page_slug"),
            "scheduled_at": item["scheduled_at"].strftime("%H:%M") if item.get("scheduled_at") else None,
            "status": item.get("status")
        })
    
    # Count stats
    published_today = await seo_pages_collection.count_documents({
        "published_at": {"$gte": start, "$lte": end}
    })
    
    return {
        "date": today,
        "scheduled_items": items,
        "scheduled_count": len(items),
        "published_count": published_today
    }


@router.get("/logs")
async def api_get_publish_logs(limit: int = 50):
    """Get recent publish logs"""
    logs = []
    async for log in publish_logs_collection.find().sort("created_at", -1).limit(limit):
        logs.append({
            "id": str(log["_id"]),
            "type": log.get("type"),
            "page_id": log.get("page_id"),
            "page_slug": log.get("page_slug"),
            "created_at": log["created_at"].isoformat() if log.get("created_at") else None
        })
    return {"logs": logs}


@router.get("/stats")
async def api_get_publish_stats():
    """Get publish strategy statistics"""
    config = await get_publish_config()
    
    # Today stats
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(f"{today} 00:00", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    today_end = datetime.strptime(f"{today} 23:59", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
    
    published_today = await seo_pages_collection.count_documents({
        "published_at": {"$gte": today_start, "$lte": today_end}
    })
    
    scheduled_today = await publish_queue_collection.count_documents({
        "status": "scheduled",
        "scheduled_at": {"$gte": today_start, "$lte": today_end}
    })
    
    # Week stats
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    published_week = await seo_pages_collection.count_documents({
        "published_at": {"$gte": week_ago}
    })
    
    # Queue stats
    queue_pending = await publish_queue_collection.count_documents({"status": "pending"})
    queue_scheduled = await publish_queue_collection.count_documents({"status": "scheduled"})
    
    # Draft pages ready
    draft_ready = await seo_pages_collection.count_documents({
        "status": "draft",
        "seo_score": {"$gte": config.get("min_seo_score", 60)}
    })
    
    return {
        "is_active": config.get("is_active", True),
        "config": {
            "pages_per_day_min": config.get("pages_per_day_min", 10),
            "pages_per_day_max": config.get("pages_per_day_max", 20),
            "min_seo_score": config.get("min_seo_score", 60)
        },
        "today": {
            "date": today,
            "published": published_today,
            "scheduled": scheduled_today,
            "remaining": max(0, config.get("pages_per_day_min", 10) - published_today)
        },
        "week": {
            "published": published_week,
            "avg_per_day": round(published_week / 7, 1)
        },
        "queue": {
            "pending": queue_pending,
            "scheduled": queue_scheduled
        },
        "draft_pages_ready": draft_ready
    }


@router.post("/publish-now/{page_id}")
async def api_publish_now(page_id: str, background_tasks: BackgroundTasks):
    """Immediately publish a specific page"""
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page.get("status") == "published":
        return {"success": False, "message": "Page already published"}
    
    now = datetime.now(timezone.utc)
    config = await get_publish_config()
    
    # Publish the page
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$set": {
                "status": "published",
                "published_at": now
            }
        }
    )
    
    # Update keyword
    if page.get("keyword"):
        await seo_keywords_collection.update_one(
            {"keyword": page["keyword"]},
            {"$set": {"status": "published"}}
        )
    
    # Remove from queue if present
    await publish_queue_collection.delete_one({"page_id": page_id})
    
    # Auto index if enabled
    if config.get("auto_index", True):
        from indexing_engine import auto_index_published_page
        background_tasks.add_task(auto_index_published_page, page_id)
    
    # Log
    await publish_logs_collection.insert_one({
        "type": "manual_publish",
        "page_id": page_id,
        "page_slug": page.get("slug"),
        "published_at": now,
        "created_at": now
    })
    
    return {
        "success": True,
        "page_id": page_id,
        "slug": page.get("slug"),
        "published_at": now.isoformat()
    }
