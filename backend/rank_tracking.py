"""
RANK TRACKING ENGINE - SEO DOMINATION
======================================
Track keyword rankings and SEO KPIs

Features:
1. Keyword position tracking
2. Traffic analytics
3. CTR tracking
4. SEO KPI dashboard

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
seo_pages_collection = db['seo_pages']
seo_keywords_collection = db['seo_keywords']
seo_clusters_collection = db['seo_clusters']
rank_history_collection = db['rank_history']
traffic_logs_collection = db['traffic_logs']
index_requests_collection = db['index_requests']


# ===================== MODELS =====================

class RankUpdate(BaseModel):
    keyword: str
    position: int
    url: str
    search_engine: str = "google"


class KeywordRankBulkUpdate(BaseModel):
    rankings: List[RankUpdate]


# ===================== RANK TRACKING =====================

async def update_keyword_rank(
    keyword: str,
    position: int,
    url: str,
    search_engine: str = "google"
):
    """Update keyword ranking"""
    
    now = datetime.now(timezone.utc)
    
    # Save to history
    doc = {
        "keyword": keyword,
        "position": position,
        "url": url,
        "search_engine": search_engine,
        "recorded_at": now
    }
    await rank_history_collection.insert_one(doc)
    
    # Update keyword document
    await seo_keywords_collection.update_one(
        {"keyword": keyword},
        {
            "$set": {
                "current_rank": position,
                "rank_url": url,
                "rank_updated_at": now
            }
        }
    )


async def get_keyword_rank_history(keyword: str, days: int = 30) -> List[dict]:
    """Get rank history for a keyword"""
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    history = []
    async for doc in rank_history_collection.find({
        "keyword": keyword,
        "recorded_at": {"$gte": start_date}
    }).sort("recorded_at", 1):
        history.append({
            "position": doc.get("position"),
            "date": doc["recorded_at"].strftime("%Y-%m-%d"),
            "search_engine": doc.get("search_engine", "google")
        })
    
    return history


# ===================== API ENDPOINTS =====================

@router.post("/update-rank")
async def api_update_rank(rank: RankUpdate):
    """Update ranking for a keyword"""
    
    await update_keyword_rank(
        keyword=rank.keyword,
        position=rank.position,
        url=rank.url,
        search_engine=rank.search_engine
    )
    
    return {"success": True, "keyword": rank.keyword, "position": rank.position}


@router.post("/bulk-update")
async def api_bulk_update_ranks(data: KeywordRankBulkUpdate):
    """Bulk update keyword rankings"""
    
    updated = 0
    for rank in data.rankings:
        await update_keyword_rank(
            keyword=rank.keyword,
            position=rank.position,
            url=rank.url,
            search_engine=rank.search_engine
        )
        updated += 1
    
    return {"success": True, "updated": updated}


@router.get("/keyword/{keyword}")
async def api_get_keyword_rank(keyword: str, days: int = 30):
    """Get rank history for a keyword"""
    
    # Get current rank
    kw_doc = await seo_keywords_collection.find_one({"keyword": keyword})
    
    # Get history
    history = await get_keyword_rank_history(keyword, days)
    
    return {
        "keyword": keyword,
        "current_rank": kw_doc.get("current_rank") if kw_doc else None,
        "rank_url": kw_doc.get("rank_url") if kw_doc else None,
        "history": history
    }


@router.get("/top-rankings")
async def api_get_top_rankings(limit: int = 50):
    """Get keywords with best rankings"""
    
    keywords = []
    async for kw in seo_keywords_collection.find({
        "current_rank": {"$exists": True, "$ne": None}
    }).sort("current_rank", 1).limit(limit):
        keywords.append({
            "keyword": kw.get("keyword"),
            "position": kw.get("current_rank"),
            "url": kw.get("rank_url"),
            "updated_at": kw["rank_updated_at"].isoformat() if kw.get("rank_updated_at") else None
        })
    
    return {"keywords": keywords, "total": len(keywords)}


@router.get("/kpi-dashboard")
async def api_kpi_dashboard():
    """Get comprehensive SEO KPI dashboard"""
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # ===== PAGES =====
    total_pages = await seo_pages_collection.count_documents({})
    published_pages = await seo_pages_collection.count_documents({"status": "published"})
    draft_pages = await seo_pages_collection.count_documents({"status": "draft"})
    
    # Pages by type
    pillar_pages = await seo_pages_collection.count_documents({"content_type": "pillar"})
    landing_pages = await seo_pages_collection.count_documents({"content_type": "landing"})
    blog_pages = await seo_pages_collection.count_documents({"content_type": "blog"})
    
    # ===== KEYWORDS =====
    total_keywords = await seo_keywords_collection.count_documents({})
    
    # Keywords with rank
    keywords_ranked = await seo_keywords_collection.count_documents({
        "current_rank": {"$exists": True, "$ne": None}
    })
    
    # Keywords in top 10
    keywords_top10 = await seo_keywords_collection.count_documents({
        "current_rank": {"$lte": 10}
    })
    
    # Keywords in top 3
    keywords_top3 = await seo_keywords_collection.count_documents({
        "current_rank": {"$lte": 3}
    })
    
    # ===== CLUSTERS =====
    total_clusters = await seo_clusters_collection.count_documents({})
    published_clusters = await seo_clusters_collection.count_documents({
        "pillar_status": "published"
    })
    
    # ===== INDEXING =====
    pages_indexed = await seo_pages_collection.count_documents({"index_submitted": True})
    
    index_requests_total = await index_requests_collection.count_documents({})
    index_submitted = await index_requests_collection.count_documents({"status": "submitted"})
    index_errors = await index_requests_collection.count_documents({"status": "error"})
    
    # ===== TRAFFIC (Last 7 days) =====
    traffic_7d = await traffic_logs_collection.count_documents({
        "timestamp": {"$gte": week_ago}
    })
    
    traffic_today = await traffic_logs_collection.count_documents({
        "timestamp": {"$gte": today_start}
    })
    
    # Traffic by source
    source_pipeline = [
        {"$match": {"timestamp": {"$gte": week_ago}}},
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]
    traffic_by_source = {}
    async for doc in traffic_logs_collection.aggregate(source_pipeline):
        traffic_by_source[doc["_id"] or "direct"] = doc["count"]
    
    # ===== SEO SCORE =====
    score_pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": None, "avg": {"$avg": "$seo_score"}}}
    ]
    score_result = await seo_pages_collection.aggregate(score_pipeline).to_list(1)
    avg_seo_score = score_result[0]["avg"] if score_result else 0
    
    # ===== CONTENT STATS =====
    word_pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {
            "_id": None,
            "total_words": {"$sum": "$word_count"},
            "avg_words": {"$avg": "$word_count"}
        }}
    ]
    word_result = await seo_pages_collection.aggregate(word_pipeline).to_list(1)
    total_words = word_result[0]["total_words"] if word_result else 0
    avg_words = word_result[0]["avg_words"] if word_result else 0
    
    return {
        "pages": {
            "total": total_pages,
            "published": published_pages,
            "draft": draft_pages,
            "by_type": {
                "pillar": pillar_pages,
                "landing": landing_pages,
                "blog": blog_pages
            }
        },
        "keywords": {
            "total": total_keywords,
            "ranked": keywords_ranked,
            "top_10": keywords_top10,
            "top_3": keywords_top3
        },
        "clusters": {
            "total": total_clusters,
            "published": published_clusters
        },
        "indexing": {
            "pages_submitted": pages_indexed,
            "requests_total": index_requests_total,
            "submitted": index_submitted,
            "errors": index_errors
        },
        "traffic": {
            "last_7_days": traffic_7d,
            "today": traffic_today,
            "by_source": traffic_by_source
        },
        "content": {
            "avg_seo_score": round(avg_seo_score, 1),
            "total_words": total_words,
            "avg_words_per_page": round(avg_words, 0)
        },
        "targets": {
            "pages_goal": 1000,
            "pages_progress": round((published_pages / 1000) * 100, 1),
            "keywords_top10_goal": 50,
            "keywords_top10_progress": round((keywords_top10 / 50) * 100, 1) if keywords_top10 <= 50 else 100,
            "traffic_monthly_goal": 10000,
            "traffic_monthly_progress": round((traffic_7d * 4 / 10000) * 100, 1)
        },
        "updated_at": now.isoformat()
    }


@router.get("/rankings-summary")
async def api_rankings_summary():
    """Get summary of keyword rankings"""
    
    # Distribution by position range
    ranges = [
        {"label": "Top 3", "min": 1, "max": 3},
        {"label": "4-10", "min": 4, "max": 10},
        {"label": "11-20", "min": 11, "max": 20},
        {"label": "21-50", "min": 21, "max": 50},
        {"label": "51-100", "min": 51, "max": 100},
        {"label": ">100", "min": 101, "max": 9999},
    ]
    
    distribution = []
    for r in ranges:
        count = await seo_keywords_collection.count_documents({
            "current_rank": {"$gte": r["min"], "$lte": r["max"]}
        })
        distribution.append({
            "range": r["label"],
            "count": count
        })
    
    # Not ranked
    not_ranked = await seo_keywords_collection.count_documents({
        "$or": [
            {"current_rank": {"$exists": False}},
            {"current_rank": None}
        ]
    })
    distribution.append({"range": "Not ranked", "count": not_ranked})
    
    return {
        "distribution": distribution,
        "total_keywords": await seo_keywords_collection.count_documents({})
    }


@router.get("/publish-schedule")
async def api_publish_schedule():
    """Get recommended publish schedule"""
    
    # Get draft pages ready to publish
    draft_pages = await seo_pages_collection.count_documents({"status": "draft"})
    
    # Recommend 10-20 pages per day
    daily_target = min(20, max(10, draft_pages // 7))
    
    # Get pages to publish today
    today_published = await seo_pages_collection.count_documents({
        "published_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)}
    })
    
    remaining_today = max(0, daily_target - today_published)
    
    # Get next pages to publish
    next_pages = []
    async for page in seo_pages_collection.find({
        "status": "draft",
        "seo_score": {"$gte": 60}
    }).sort("seo_score", -1).limit(remaining_today):
        next_pages.append({
            "id": str(page["_id"]),
            "title": page.get("title"),
            "seo_score": page.get("seo_score"),
            "word_count": page.get("word_count")
        })
    
    return {
        "draft_pages": draft_pages,
        "daily_target": daily_target,
        "published_today": today_published,
        "remaining_today": remaining_today,
        "next_to_publish": next_pages,
        "recommendation": f"Publish {remaining_today} more pages today for optimal SEO"
    }
