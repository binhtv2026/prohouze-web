"""
GOOGLE INDEXING ENGINE - SEO DOMINATION
========================================
Auto-submit URLs to Google for fast indexing

Features:
1. Google Search Console API integration
2. Auto submit on publish
3. Batch indexing
4. Index status tracking

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import httpx
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
index_requests_collection = db['index_requests']
index_stats_collection = db['index_stats']

# Site config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')

# Google Search Console config
gsc_config_collection = db['gsc_config']


# ===================== MODELS =====================

class IndexRequest(BaseModel):
    url: str
    page_id: Optional[str] = None


class GSCConfigUpload(BaseModel):
    service_account_json: Dict[str, Any]  # The full JSON key content
    site_url: Optional[str] = None  # e.g., https://prohouzing.com


class GSCConfigResponse(BaseModel):
    is_configured: bool
    site_url: Optional[str] = None
    service_account_email: Optional[str] = None
    configured_at: Optional[str] = None


class BatchIndexRequest(BaseModel):
    urls: List[str]


class IndexStatus(BaseModel):
    url: str
    status: str  # pending, submitted, indexed, error
    submitted_at: Optional[str] = None
    indexed_at: Optional[str] = None
    error: Optional[str] = None


# ===================== GSC CONFIG MANAGEMENT =====================

async def get_gsc_config() -> dict:
    """Get Google Search Console configuration"""
    config = await gsc_config_collection.find_one({"type": "gsc_credentials"})
    return config


async def save_gsc_config(service_account_json: dict, site_url: str = None) -> dict:
    """Save Google Search Console configuration"""
    now = datetime.now(timezone.utc)
    
    config = {
        "type": "gsc_credentials",
        "service_account_json": service_account_json,
        "site_url": site_url or SITE_URL,
        "service_account_email": service_account_json.get("client_email", ""),
        "configured_at": now,
        "updated_at": now
    }
    
    await gsc_config_collection.update_one(
        {"type": "gsc_credentials"},
        {"$set": config},
        upsert=True
    )
    
    return config


async def get_google_access_token() -> str:
    """Get OAuth2 access token from service account"""
    config = await get_gsc_config()
    if not config or not config.get("service_account_json"):
        return None
    
    try:
        import jwt
        import time
        
        sa = config["service_account_json"]
        private_key = sa.get("private_key", "")
        client_email = sa.get("client_email", "")
        
        if not private_key or not client_email:
            return None
        
        # Create JWT
        now = int(time.time())
        payload = {
            "iss": client_email,
            "scope": "https://www.googleapis.com/auth/indexing",
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now,
            "exp": now + 3600
        }
        
        signed_jwt = jwt.encode(payload, private_key, algorithm="RS256")
        
        # Exchange for access token
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": signed_jwt
                }
            )
            
            if response.status_code == 200:
                token_data = response.json()
                return token_data.get("access_token")
            else:
                print(f"[GSC] Token exchange failed: {response.text}")
                return None
    
    except Exception as e:
        print(f"[GSC] Error getting access token: {e}")
        return None


# ===================== GOOGLE INDEXING API =====================

async def submit_url_to_google(url: str) -> dict:
    """
    Submit URL to Google for indexing via Indexing API
    Note: Requires Google API credentials (service account)
    """
    
    # Try to get access token from configured service account
    access_token = await get_google_access_token()
    
    # If no access token, use sitemap ping method
    if not access_token:
        return await ping_google_for_url(url)
    
    try:
        # Google Indexing API endpoint
        api_url = "https://indexing.googleapis.com/v3/urlNotifications:publish"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        payload = {
            "url": url,
            "type": "URL_UPDATED"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(api_url, json=payload, headers=headers)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "method": "indexing_api",
                    "response": response.json()
                }
            else:
                # Fallback to ping if API fails
                print(f"[GSC] API failed ({response.status_code}), falling back to ping")
                return await ping_google_for_url(url)
    
    except Exception as e:
        print(f"[GSC] Indexing API error: {e}, falling back to ping")
        return await ping_google_for_url(url)


async def ping_google_for_url(url: str) -> dict:
    """
    Ping Google to crawl URL (fallback method)
    Uses sitemap ping + webmaster ping
    """
    results = []
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Method 1: Sitemap ping
            sitemap_ping = f"https://www.google.com/ping?sitemap={SITE_URL}/sitemap.xml"
            response1 = await client.get(sitemap_ping)
            results.append({
                "method": "sitemap_ping",
                "success": response1.status_code == 200
            })
            
            # Method 2: Add URL to Google
            add_url = f"https://www.google.com/webmasters/tools/ping?sitemap={url}"
            response2 = await client.get(add_url)
            results.append({
                "method": "webmaster_ping",
                "success": response2.status_code == 200
            })
        
        return {
            "success": any(r["success"] for r in results),
            "method": "ping",
            "results": results
        }
    
    except Exception as e:
        return {
            "success": False,
            "method": "ping",
            "error": str(e)
        }


async def check_index_status(url: str) -> dict:
    """
    Check if URL is indexed by Google
    Uses site: search operator
    """
    try:
        # This is a simplified check - in production, use Search Console API
        search_url = f"https://www.google.com/search?q=site:{url}"
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(search_url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)"
            })
            
            # Check if page appears in results (simplified)
            is_indexed = url in response.text or "did not match any documents" not in response.text
            
            return {
                "url": url,
                "is_indexed": is_indexed,
                "checked_at": datetime.now(timezone.utc).isoformat()
            }
    
    except Exception as e:
        return {
            "url": url,
            "is_indexed": None,
            "error": str(e)
        }


# ===================== INDEX REQUEST TRACKING =====================

async def create_index_request(url: str, page_id: str = None) -> str:
    """Create and track index request"""
    doc = {
        "url": url,
        "page_id": page_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "submitted_at": None,
        "indexed_at": None,
        "last_checked": None,
        "attempts": 0,
        "error": None
    }
    
    result = await index_requests_collection.insert_one(doc)
    return str(result.inserted_id)


async def update_index_request(request_id: str, status: str, error: str = None):
    """Update index request status"""
    update = {
        "status": status,
        "last_checked": datetime.now(timezone.utc)
    }
    
    if status == "submitted":
        update["submitted_at"] = datetime.now(timezone.utc)
        update["attempts"] = {"$inc": 1}
    elif status == "indexed":
        update["indexed_at"] = datetime.now(timezone.utc)
    elif status == "error":
        update["error"] = error
    
    await index_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update}
    )


# ===================== AUTO INDEX ON PUBLISH =====================

async def auto_index_published_page(page_id: str):
    """Background task to index a newly published page"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        return
    
    slug = page.get("slug", "")
    content_type = page.get("content_type", "landing")
    
    # Build URL based on content type
    if content_type == "blog":
        url = f"{SITE_URL}/blog/{slug}"
    else:
        url = f"{SITE_URL}/{slug}"
    
    # Create index request
    request_id = await create_index_request(url, page_id)
    
    # Submit to Google
    result = await submit_url_to_google(url)
    
    if result.get("success"):
        await update_index_request(request_id, "submitted")
        
        # Update page with index info
        await seo_pages_collection.update_one(
            {"_id": ObjectId(page_id)},
            {
                "$set": {
                    "index_submitted": True,
                    "index_submitted_at": datetime.now(timezone.utc)
                }
            }
        )
    else:
        await update_index_request(request_id, "error", result.get("error"))
    
    return result


# ===================== API ENDPOINTS =====================

@router.post("/submit")
async def api_submit_url(request: IndexRequest, background_tasks: BackgroundTasks):
    """Submit a URL for Google indexing"""
    
    url = request.url
    if not url.startswith("http"):
        url = f"{SITE_URL}/{url.lstrip('/')}"
    
    # Create tracking request
    request_id = await create_index_request(url, request.page_id)
    
    # Submit in background
    background_tasks.add_task(process_index_request, request_id, url)
    
    return {
        "success": True,
        "request_id": request_id,
        "url": url,
        "status": "queued"
    }


async def process_index_request(request_id: str, url: str):
    """Process index request in background"""
    result = await submit_url_to_google(url)
    
    if result.get("success"):
        await update_index_request(request_id, "submitted")
    else:
        await update_index_request(request_id, "error", result.get("error"))


@router.post("/batch")
async def api_batch_index(request: BatchIndexRequest, background_tasks: BackgroundTasks):
    """Submit multiple URLs for indexing"""
    
    request_ids = []
    for url in request.urls[:50]:  # Limit to 50 per batch
        if not url.startswith("http"):
            url = f"{SITE_URL}/{url.lstrip('/')}"
        
        request_id = await create_index_request(url)
        request_ids.append({"url": url, "request_id": request_id})
        
        # Queue for processing
        background_tasks.add_task(process_index_request, request_id, url)
    
    return {
        "success": True,
        "queued": len(request_ids),
        "requests": request_ids
    }


@router.post("/publish-and-index/{page_id}")
async def api_publish_and_index(page_id: str, background_tasks: BackgroundTasks):
    """Publish a page and immediately submit for indexing"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Update status to published
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$set": {
                "status": "published",
                "published_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Submit for indexing in background
    background_tasks.add_task(auto_index_published_page, page_id)
    
    return {
        "success": True,
        "page_id": page_id,
        "status": "published",
        "indexing": "queued"
    }


@router.get("/status/{request_id}")
async def api_get_index_status(request_id: str):
    """Get status of an index request"""
    
    request = await index_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {
        "id": str(request["_id"]),
        "url": request.get("url"),
        "status": request.get("status"),
        "submitted_at": request["submitted_at"].isoformat() if request.get("submitted_at") else None,
        "indexed_at": request["indexed_at"].isoformat() if request.get("indexed_at") else None,
        "error": request.get("error"),
        "attempts": request.get("attempts", 0)
    }


@router.get("/requests")
async def api_list_index_requests(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """List index requests"""
    
    query = {}
    if status:
        query["status"] = status
    
    requests = []
    async for req in index_requests_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        requests.append({
            "id": str(req["_id"]),
            "url": req.get("url"),
            "status": req.get("status"),
            "submitted_at": req["submitted_at"].isoformat() if req.get("submitted_at") else None,
            "created_at": req["created_at"].isoformat() if req.get("created_at") else None
        })
    
    total = await index_requests_collection.count_documents(query)
    
    return {
        "requests": requests,
        "total": total
    }


@router.get("/stats")
async def api_index_stats():
    """Get indexing statistics"""
    
    total_requests = await index_requests_collection.count_documents({})
    pending = await index_requests_collection.count_documents({"status": "pending"})
    submitted = await index_requests_collection.count_documents({"status": "submitted"})
    indexed = await index_requests_collection.count_documents({"status": "indexed"})
    errors = await index_requests_collection.count_documents({"status": "error"})
    
    # Today's stats
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_submitted = await index_requests_collection.count_documents({
        "submitted_at": {"$gte": today_start}
    })
    
    # Pages with index info
    pages_submitted = await seo_pages_collection.count_documents({"index_submitted": True})
    pages_published = await seo_pages_collection.count_documents({"status": "published"})
    
    # Check if GSC is configured
    gsc_config = await get_gsc_config()
    is_gsc_configured = bool(gsc_config and gsc_config.get("service_account_json"))
    
    return {
        "total_requests": total_requests,
        "by_status": {
            "pending": pending,
            "submitted": submitted,
            "indexed": indexed,
            "errors": errors
        },
        "today_submitted": today_submitted,
        "pages": {
            "published": pages_published,
            "submitted_for_index": pages_submitted
        },
        "google_api_configured": is_gsc_configured
    }


# ===================== GSC CONFIG ENDPOINTS =====================

@router.get("/config")
async def api_get_gsc_config():
    """Get Google Search Console configuration status"""
    config = await get_gsc_config()
    
    if not config:
        return GSCConfigResponse(is_configured=False)
    
    return GSCConfigResponse(
        is_configured=bool(config.get("service_account_json")),
        site_url=config.get("site_url"),
        service_account_email=config.get("service_account_email"),
        configured_at=config["configured_at"].isoformat() if config.get("configured_at") else None
    )


@router.post("/config")
async def api_upload_gsc_config(data: GSCConfigUpload):
    """
    Upload Google Search Console service account credentials.
    
    To get credentials:
    1. Go to Google Cloud Console (console.cloud.google.com)
    2. Create a new project or select existing
    3. Enable "Indexing API" 
    4. Go to "IAM & Admin" > "Service Accounts"
    5. Create service account with "Owner" role
    6. Create key (JSON) and download
    7. In Google Search Console, add the service account email as an owner
    8. Upload the JSON content here
    """
    
    # Validate required fields
    required_fields = ["type", "project_id", "private_key", "client_email"]
    for field in required_fields:
        if field not in data.service_account_json:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid service account JSON: missing '{field}'"
            )
    
    # Save config
    config = await save_gsc_config(
        data.service_account_json,
        data.site_url
    )
    
    return {
        "success": True,
        "message": "Google Search Console credentials configured successfully",
        "service_account_email": config.get("service_account_email"),
        "site_url": config.get("site_url")
    }


@router.delete("/config")
async def api_delete_gsc_config():
    """Remove Google Search Console configuration"""
    await gsc_config_collection.delete_one({"type": "gsc_credentials"})
    return {"success": True, "message": "GSC configuration removed"}


@router.post("/test-connection")
async def api_test_gsc_connection():
    """Test Google Search Console connection"""
    config = await get_gsc_config()
    
    if not config or not config.get("service_account_json"):
        return {
            "success": False,
            "error": "GSC not configured. Please upload service account credentials first."
        }
    
    # Try to get access token
    token = await get_google_access_token()
    
    if token:
        return {
            "success": True,
            "message": "Successfully connected to Google APIs",
            "service_account_email": config.get("service_account_email")
        }
    else:
        return {
            "success": False,
            "error": "Failed to authenticate with Google. Check your service account credentials."
        }


@router.post("/check-indexed")
async def api_check_if_indexed(request: IndexRequest):
    """Check if a URL is indexed by Google"""
    
    url = request.url
    if not url.startswith("http"):
        url = f"{SITE_URL}/{url.lstrip('/')}"
    
    result = await check_index_status(url)
    return result


@router.post("/resubmit-failed")
async def api_resubmit_failed(background_tasks: BackgroundTasks):
    """Resubmit all failed index requests"""
    
    failed_requests = await index_requests_collection.find({
        "status": "error",
        "attempts": {"$lt": 3}
    }).to_list(50)
    
    requeued = 0
    for req in failed_requests:
        await index_requests_collection.update_one(
            {"_id": req["_id"]},
            {"$set": {"status": "pending"}}
        )
        background_tasks.add_task(process_index_request, str(req["_id"]), req["url"])
        requeued += 1
    
    return {
        "success": True,
        "requeued": requeued
    }
