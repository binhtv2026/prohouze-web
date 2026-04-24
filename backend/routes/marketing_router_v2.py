"""
ProHouzing Marketing Router V2 - Refactored
Prompt 13/20 - Standardized Omnichannel Marketing Engine

APIs for:
- Channels CRUD & Integration
- Content Assets CRUD & Publishing
- Forms CRUD & Submissions
- Response Templates
- Attribution
- Dashboard
"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import hashlib
import secrets

from models.marketing_models_v2 import (
    # Channel
    ChannelCreate, ChannelResponse, ChannelStats,
    ChannelType, ChannelStatus,
    # Content
    ContentAssetCreate, ContentAssetResponse, ContentStatusUpdate,
    ContentPublicationCreate, ContentPublicationResponse,
    ContentType, ContentStatus, PublicationStatus,
    # Form
    FormCreate, FormResponse, FormRenderResponse, FormSubmitRequest, FormSubmitResponse,
    FormSubmissionResponse, FormField, FormStatus, FormSubmissionStatus,
    # Template
    ResponseTemplateCreate, ResponseTemplateResponse, TemplateMatchRequest, TemplateMatchResponse,
    TemplateRenderRequest, TemplateStatusUpdate, TemplateCategory, TemplateStatus,
    # Attribution
    AttributionCreate, AttributionResponse, AttributionReport, AttributionModel,
    # AI
    AIContentGenerateRequest, AIContentGenerateResponse,
    # Dashboard
    MarketingDashboardResponse,
)

from config.marketing_config_v2 import (
    CHANNEL_TYPES, CHANNEL_STATUSES, CONTENT_TYPES, CONTENT_STATUSES,
    PUBLICATION_STATUSES, FORM_FIELD_TYPES, FORM_STATUSES, FORM_SUBMISSION_STATUSES,
    TEMPLATE_CATEGORIES, TEMPLATE_STATUSES, ATTRIBUTION_MODELS, TEMPLATE_VARIABLES,
    get_channel_type, get_channel_status, get_content_type, get_content_status,
    get_publication_status, get_form_status, get_form_submission_status,
    get_template_category, get_template_status, get_attribution_model,
)

# Create router
router = APIRouter(prefix="/api/marketing/v2", tags=["Marketing V2"])

# Database reference
_db = None


def set_database(database):
    """Set the database reference"""
    global _db
    _db = database


def get_db():
    """Get database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_code(prefix: str, collection_name: str = None) -> str:
    """Generate a unique code"""
    year = datetime.now().year
    random_part = secrets.token_hex(3).upper()
    return f"{prefix}-{year}-{random_part}"


async def get_next_sequence(collection: str) -> int:
    """Get next sequence number for auto-generated codes"""
    db = get_db()
    result = await db.counters.find_one_and_update(
        {"_id": collection},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result["seq"]


# ============================================
# CONFIG ROUTES
# ============================================

@router.get("/config/channel-types")
async def get_channel_types_config():
    """Get all channel types"""
    return {"channel_types": list(CHANNEL_TYPES.values())}


@router.get("/config/channel-statuses")
async def get_channel_statuses_config():
    """Get all channel statuses"""
    return {"statuses": list(CHANNEL_STATUSES.values())}


@router.get("/config/content-types")
async def get_content_types_config():
    """Get all content types"""
    return {"content_types": list(CONTENT_TYPES.values())}


@router.get("/config/content-statuses")
async def get_content_statuses_config():
    """Get all content statuses"""
    return {"statuses": list(CONTENT_STATUSES.values())}


@router.get("/config/form-field-types")
async def get_form_field_types_config():
    """Get all form field types"""
    return {"field_types": list(FORM_FIELD_TYPES.values())}


@router.get("/config/form-statuses")
async def get_form_statuses_config():
    """Get all form statuses"""
    return {"statuses": list(FORM_STATUSES.values())}


@router.get("/config/template-categories")
async def get_template_categories_config():
    """Get all template categories"""
    return {"categories": list(TEMPLATE_CATEGORIES.values())}


@router.get("/config/template-statuses")
async def get_template_statuses_config():
    """Get all template statuses"""
    return {"statuses": list(TEMPLATE_STATUSES.values())}


@router.get("/config/attribution-models")
async def get_attribution_models_config():
    """Get all attribution models"""
    return {"models": list(ATTRIBUTION_MODELS.values())}


@router.get("/config/template-variables")
async def get_template_variables_config():
    """Get all template variables"""
    return {"variables": TEMPLATE_VARIABLES}


# ============================================
# CHANNEL ROUTES
# ============================================

@router.post("/channels", response_model=ChannelResponse)
async def create_channel(channel: ChannelCreate):
    """Create a new channel integration"""
    db = get_db()
    
    # Check for duplicate code
    existing = await db.channels.find_one({"code": channel.code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Channel with code '{channel.code}' already exists")
    
    channel_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate webhook URL
    webhook_secret = secrets.token_hex(16)
    webhook_url = f"/api/webhooks/{channel.channel_type.value}/{channel_id}"
    
    channel_type_info = get_channel_type(channel.channel_type.value) or {}
    
    channel_doc = {
        "id": channel_id,
        "code": channel.code,
        "name": channel.name,
        "channel_type": channel.channel_type.value,
        "external_account_id": channel.external_account_id,
        "external_account_name": channel.external_account_name,
        "external_account_url": channel.external_account_url,
        "credentials": channel.credentials,
        "credentials_expires_at": channel.credentials_expires_at,
        "webhook_url": webhook_url,
        "webhook_secret": webhook_secret,
        "settings": channel.settings,
        "status": "pending",
        "is_active": channel.is_active,
        "stats": {},
        "last_sync_at": None,
        "last_error": None,
        "connected_at": None,
        "created_at": now,
        "created_by": None,
        "updated_at": now,
    }
    
    await db.channels.insert_one(channel_doc)
    
    return ChannelResponse(
        **{k: v for k, v in channel_doc.items() if k not in ["_id", "credentials", "webhook_secret"]},
        channel_type_label=channel_type_info.get("label_vi", channel.channel_type.value),
        status_label=get_channel_status("pending").get("label_vi", "Chờ kết nối"),
    )


@router.get("/channels", response_model=List[ChannelResponse])
async def get_channels(
    channel_type: Optional[str] = None,
    status: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get all channels with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if channel_type:
        query["channel_type"] = channel_type
    if status:
        query["status"] = status
    if is_active is not None:
        query["is_active"] = is_active
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]
    
    channels = await db.channels.find(query, {"_id": 0, "credentials": 0, "webhook_secret": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for ch in channels:
        channel_type_info = get_channel_type(ch.get("channel_type", "")) or {}
        status_info = get_channel_status(ch.get("status", "pending")) or {}
        
        result.append(ChannelResponse(
            **ch,
            channel_type_label=channel_type_info.get("label_vi", ch.get("channel_type", "")),
            status_label=status_info.get("label_vi", ch.get("status", "")),
        ))
    
    return result


@router.get("/channels/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: str):
    """Get a channel by ID"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0, "credentials": 0, "webhook_secret": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    channel_type_info = get_channel_type(channel.get("channel_type", "")) or {}
    status_info = get_channel_status(channel.get("status", "pending")) or {}
    
    return ChannelResponse(
        **channel,
        channel_type_label=channel_type_info.get("label_vi", channel.get("channel_type", "")),
        status_label=status_info.get("label_vi", channel.get("status", "")),
    )


@router.put("/channels/{channel_id}")
async def update_channel(channel_id: str, updates: Dict[str, Any]):
    """Update a channel"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Don't allow updating sensitive fields directly
    updates.pop("id", None)
    updates.pop("webhook_secret", None)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.channels.update_one({"id": channel_id}, {"$set": updates})
    return {"success": True}


@router.post("/channels/{channel_id}/connect")
async def connect_channel(channel_id: str, credentials: Dict[str, Any]):
    """Connect/authenticate a channel"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update credentials and status
    await db.channels.update_one(
        {"id": channel_id},
        {"$set": {
            "credentials": credentials,
            "status": "connected",
            "connected_at": now,
            "updated_at": now,
            "last_error": None,
        }}
    )
    
    return {"success": True, "status": "connected"}


@router.post("/channels/{channel_id}/disconnect")
async def disconnect_channel(channel_id: str):
    """Disconnect a channel"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.channels.update_one(
        {"id": channel_id},
        {"$set": {
            "credentials": {},
            "status": "disconnected",
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "disconnected"}


@router.post("/channels/{channel_id}/toggle")
async def toggle_channel(channel_id: str):
    """Toggle channel active status"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    new_status = not channel.get("is_active", True)
    
    await db.channels.update_one(
        {"id": channel_id},
        {"$set": {
            "is_active": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    
    return {"success": True, "is_active": new_status}


@router.post("/channels/{channel_id}/sync")
async def sync_channel(channel_id: str):
    """Sync channel data (stats, followers, etc.)"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # In a real implementation, this would call the channel's API
    # For now, we just update the sync timestamp
    await db.channels.update_one(
        {"id": channel_id},
        {"$set": {"last_sync_at": now}}
    )
    
    return {"success": True, "synced_at": now}


@router.get("/channels/{channel_id}/stats", response_model=ChannelStats)
async def get_channel_stats(channel_id: str):
    """Get channel statistics"""
    db = get_db()
    channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Count leads from this channel
    leads_this_month = await db.leads.count_documents({
        "channel_id": channel_id,
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}
    })
    
    leads_total = await db.leads.count_documents({"channel_id": channel_id})
    
    return ChannelStats(
        channel_id=channel_id,
        channel_name=channel.get("name", ""),
        channel_type=channel.get("channel_type", ""),
        followers=channel.get("stats", {}).get("followers", 0),
        leads_this_month=leads_this_month,
        leads_total=leads_total,
        messages_received=channel.get("stats", {}).get("messages_received", 0),
        auto_replies_sent=channel.get("stats", {}).get("auto_replies_sent", 0),
        engagement_rate=channel.get("stats", {}).get("engagement_rate", 0.0),
    )


# ============================================
# CONTENT ASSET ROUTES
# ============================================

@router.post("/contents", response_model=ContentAssetResponse)
async def create_content_asset(content: ContentAssetCreate):
    """Create a new content asset"""
    db = get_db()
    
    content_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate code
    seq = await get_next_sequence("content_assets")
    code = f"CNT-{datetime.now().year}-{seq:04d}"
    
    content_type_info = get_content_type(content.content_type.value) or {}
    
    # Get campaign name if linked
    campaign_name = None
    if content.campaign_id:
        campaign = await db.campaigns.find_one({"id": content.campaign_id}, {"_id": 0, "name": 1})
        campaign_name = campaign["name"] if campaign else None
    
    content_doc = {
        "id": content_id,
        "code": code,
        "title": content.title,
        "content_type": content.content_type.value,
        "campaign_id": content.campaign_id,
        "project_ids": content.project_ids,
        "body": content.body,
        "media_urls": content.media_urls,
        "media_metadata": content.media_metadata,
        "hashtags": content.hashtags,
        "meta_title": content.meta_title,
        "meta_description": content.meta_description,
        "target_channel_ids": content.target_channel_ids,
        "form_id": content.form_id,
        "cta_url": content.cta_url,
        "cta_text": content.cta_text,
        "utm_source": content.utm_source,
        "utm_medium": content.utm_medium,
        "utm_campaign": content.utm_campaign,
        "utm_content": code,  # Auto-set from code
        "utm_term": content.utm_term,
        "scheduled_at": content.scheduled_at,
        "status": "draft",
        "submitted_at": None,
        "submitted_by": None,
        "reviewed_at": None,
        "reviewed_by": None,
        "review_notes": None,
        "published_at": None,
        "published_by": None,
        "ai_generated": content.ai_generated,
        "ai_prompt": content.ai_prompt,
        "ab_variant_id": content.ab_variant_id,
        "total_impressions": 0,
        "total_engagement": 0,
        "total_clicks": 0,
        "total_leads": 0,
        "version": 1,
        "created_at": now,
        "created_by": None,
        "updated_at": now,
    }
    
    await db.content_assets.insert_one(content_doc)
    
    # Link to campaign if provided
    if content.campaign_id:
        await db.campaigns.update_one(
            {"id": content.campaign_id},
            {"$addToSet": {"content_asset_ids": content_id}}
        )
    
    return ContentAssetResponse(
        **{k: v for k, v in content_doc.items() if k != "_id"},
        content_type_label=content_type_info.get("label_vi", content.content_type.value),
        campaign_name=campaign_name,
        status_label=get_content_status("draft").get("label_vi", "Bản nháp"),
    )


@router.get("/contents", response_model=List[ContentAssetResponse])
async def get_content_assets(
    campaign_id: Optional[str] = None,
    content_type: Optional[str] = None,
    status: Optional[str] = None,
    channel_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get all content assets with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if campaign_id:
        query["campaign_id"] = campaign_id
    if content_type:
        query["content_type"] = content_type
    if status:
        query["status"] = status
    if channel_id:
        query["target_channel_ids"] = channel_id
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"body": {"$regex": search, "$options": "i"}},
        ]
    
    contents = await db.content_assets.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for cnt in contents:
        content_type_info = get_content_type(cnt.get("content_type", "")) or {}
        status_info = get_content_status(cnt.get("status", "draft")) or {}
        
        # Get campaign name
        campaign_name = None
        if cnt.get("campaign_id"):
            campaign = await db.campaigns.find_one({"id": cnt["campaign_id"]}, {"_id": 0, "name": 1})
            campaign_name = campaign["name"] if campaign else None
        
        # Get creator name
        created_by_name = None
        if cnt.get("created_by"):
            user = await db.users.find_one({"id": cnt["created_by"]}, {"_id": 0, "full_name": 1})
            created_by_name = user["full_name"] if user else None
        
        result.append(ContentAssetResponse(
            **cnt,
            content_type_label=content_type_info.get("label_vi", cnt.get("content_type", "")),
            campaign_name=campaign_name,
            status_label=status_info.get("label_vi", cnt.get("status", "")),
            created_by_name=created_by_name,
        ))
    
    return result


@router.get("/contents/{content_id}", response_model=ContentAssetResponse)
async def get_content_asset(content_id: str):
    """Get a content asset by ID"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    content_type_info = get_content_type(content.get("content_type", "")) or {}
    status_info = get_content_status(content.get("status", "draft")) or {}
    
    campaign_name = None
    if content.get("campaign_id"):
        campaign = await db.campaigns.find_one({"id": content["campaign_id"]}, {"_id": 0, "name": 1})
        campaign_name = campaign["name"] if campaign else None
    
    return ContentAssetResponse(
        **content,
        content_type_label=content_type_info.get("label_vi", content.get("content_type", "")),
        campaign_name=campaign_name,
        status_label=status_info.get("label_vi", content.get("status", "")),
    )


@router.put("/contents/{content_id}")
async def update_content_asset(content_id: str, updates: Dict[str, Any]):
    """Update a content asset"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    # Cannot edit published content
    if content.get("status") == "published":
        raise HTTPException(status_code=400, detail="Cannot edit published content")
    
    updates.pop("id", None)
    updates.pop("code", None)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["version"] = content.get("version", 1) + 1
    
    await db.content_assets.update_one({"id": content_id}, {"$set": updates})
    return {"success": True}


@router.post("/contents/{content_id}/submit-review")
async def submit_content_for_review(content_id: str):
    """Submit content for review"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    if content.get("status") != "draft":
        raise HTTPException(status_code=400, detail="Only draft content can be submitted for review")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.content_assets.update_one(
        {"id": content_id},
        {"$set": {
            "status": "pending_review",
            "submitted_at": now,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "pending_review"}


@router.post("/contents/{content_id}/approve")
async def approve_content(content_id: str, notes: Optional[str] = None):
    """Approve content"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    if content.get("status") != "pending_review":
        raise HTTPException(status_code=400, detail="Only pending review content can be approved")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.content_assets.update_one(
        {"id": content_id},
        {"$set": {
            "status": "approved",
            "reviewed_at": now,
            "review_notes": notes,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "approved"}


@router.post("/contents/{content_id}/reject")
async def reject_content(content_id: str, reason: str):
    """Reject content"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    if content.get("status") != "pending_review":
        raise HTTPException(status_code=400, detail="Only pending review content can be rejected")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.content_assets.update_one(
        {"id": content_id},
        {"$set": {
            "status": "rejected",
            "reviewed_at": now,
            "review_notes": reason,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "rejected"}


@router.post("/contents/{content_id}/publish")
async def publish_content(content_id: str, channel_ids: Optional[List[str]] = None):
    """Publish content to channels"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    if content.get("status") not in ["approved", "scheduled"]:
        raise HTTPException(status_code=400, detail="Only approved or scheduled content can be published")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get target channels
    target_channels = channel_ids or content.get("target_channel_ids", [])
    if not target_channels:
        raise HTTPException(status_code=400, detail="No target channels specified")
    
    # Create publication records
    publications = []
    for channel_id in target_channels:
        channel = await db.channels.find_one({"id": channel_id}, {"_id": 0})
        if not channel or not channel.get("is_active"):
            continue
        
        pub_id = str(uuid.uuid4())
        pub_doc = {
            "id": pub_id,
            "content_asset_id": content_id,
            "channel_id": channel_id,
            "external_post_id": None,
            "external_url": None,
            "status": "published",  # In real impl, this would be async
            "published_at": now,
            "published_by": None,
            "impressions": 0,
            "reach": 0,
            "likes": 0,
            "comments": 0,
            "shares": 0,
            "clicks": 0,
            "video_views": 0,
            "engagement_rate": 0.0,
            "leads_generated": 0,
            "form_submissions": 0,
            "last_sync_at": None,
            "error_message": None,
            "created_at": now,
        }
        await db.content_publications.insert_one(pub_doc)
        publications.append(pub_id)
    
    # Update content status
    await db.content_assets.update_one(
        {"id": content_id},
        {"$set": {
            "status": "published",
            "published_at": now,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "published", "publications": publications}


@router.post("/contents/{content_id}/schedule")
async def schedule_content(content_id: str, scheduled_at: str):
    """Schedule content for publishing"""
    db = get_db()
    content = await db.content_assets.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content asset not found")
    
    if content.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Only approved content can be scheduled")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.content_assets.update_one(
        {"id": content_id},
        {"$set": {
            "status": "scheduled",
            "scheduled_at": scheduled_at,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "scheduled", "scheduled_at": scheduled_at}


@router.get("/contents/{content_id}/publications", response_model=List[ContentPublicationResponse])
async def get_content_publications(content_id: str):
    """Get all publications for a content asset"""
    db = get_db()
    
    publications = await db.content_publications.find(
        {"content_asset_id": content_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    result = []
    for pub in publications:
        # Get channel info
        channel = await db.channels.find_one({"id": pub["channel_id"]}, {"_id": 0, "name": 1, "channel_type": 1})
        
        status_info = get_publication_status(pub.get("status", "pending")) or {}
        
        result.append(ContentPublicationResponse(
            **pub,
            channel_name=channel["name"] if channel else "",
            channel_type=channel["channel_type"] if channel else "",
            status_label=status_info.get("label_vi", pub.get("status", "")),
        ))
    
    return result


# ============================================
# FORM ROUTES
# ============================================

@router.post("/forms", response_model=FormResponse)
async def create_form(form: FormCreate):
    """Create a new form"""
    db = get_db()
    
    form_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate code
    seq = await get_next_sequence("forms")
    code = f"FORM-{datetime.now().year}-{seq:03d}"
    
    form_doc = {
        "id": form_id,
        "code": code,
        "name": form.name,
        "description": form.description,
        "campaign_id": form.campaign_id,
        "lead_source_id": form.lead_source_id,
        "content_asset_id": form.content_asset_id,
        "fields": [f.model_dump() for f in form.fields],
        "submit_button_text": form.submit_button_text,
        "success_message": form.success_message,
        "redirect_url": form.redirect_url,
        "utm_source": form.utm_source,
        "utm_medium": form.utm_medium,
        "utm_campaign": form.utm_campaign,
        "utm_content": form.utm_content,
        "auto_assign_rule_id": form.auto_assign_rule_id,
        "auto_assign_to_user": form.auto_assign_to_user,
        "auto_assign_to_team": form.auto_assign_to_team,
        "require_email_verification": form.require_email_verification,
        "max_submissions_per_ip": form.max_submissions_per_ip,
        "max_submissions_per_day": form.max_submissions_per_day,
        "status": "draft",
        "total_submissions": 0,
        "total_leads_created": 0,
        "conversion_rate": 0.0,
        "created_at": now,
        "created_by": None,
        "updated_at": now,
    }
    
    await db.forms.insert_one(form_doc)
    
    # Link to campaign if provided
    if form.campaign_id:
        await db.campaigns.update_one(
            {"id": form.campaign_id},
            {"$addToSet": {"form_ids": form_id}}
        )
    
    # Link to content if provided
    if form.content_asset_id:
        await db.content_assets.update_one(
            {"id": form.content_asset_id},
            {"$set": {"form_id": form_id}}
        )
    
    return FormResponse(
        **{k: v for k, v in form_doc.items() if k != "_id"},
        status_label=get_form_status("draft").get("label_vi", "Bản nháp"),
    )


@router.get("/forms", response_model=List[FormResponse])
async def get_forms(
    campaign_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get all forms with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if campaign_id:
        query["campaign_id"] = campaign_id
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]
    
    forms = await db.forms.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for frm in forms:
        status_info = get_form_status(frm.get("status", "draft")) or {}
        
        campaign_name = None
        if frm.get("campaign_id"):
            campaign = await db.campaigns.find_one({"id": frm["campaign_id"]}, {"_id": 0, "name": 1})
            campaign_name = campaign["name"] if campaign else None
        
        result.append(FormResponse(
            **frm,
            campaign_name=campaign_name,
            status_label=status_info.get("label_vi", frm.get("status", "")),
        ))
    
    return result


@router.get("/forms/{form_id}", response_model=FormResponse)
async def get_form(form_id: str):
    """Get a form by ID"""
    db = get_db()
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    status_info = get_form_status(form.get("status", "draft")) or {}
    
    campaign_name = None
    if form.get("campaign_id"):
        campaign = await db.campaigns.find_one({"id": form["campaign_id"]}, {"_id": 0, "name": 1})
        campaign_name = campaign["name"] if campaign else None
    
    return FormResponse(
        **form,
        campaign_name=campaign_name,
        status_label=status_info.get("label_vi", form.get("status", "")),
    )


@router.put("/forms/{form_id}")
async def update_form(form_id: str, updates: Dict[str, Any]):
    """Update a form"""
    db = get_db()
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    updates.pop("id", None)
    updates.pop("code", None)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.forms.update_one({"id": form_id}, {"$set": updates})
    return {"success": True}


@router.post("/forms/{form_id}/activate")
async def activate_form(form_id: str):
    """Activate a form"""
    db = get_db()
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    await db.forms.update_one(
        {"id": form_id},
        {"$set": {
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    
    return {"success": True, "status": "active"}


@router.post("/forms/{form_id}/pause")
async def pause_form(form_id: str):
    """Pause a form"""
    db = get_db()
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    await db.forms.update_one(
        {"id": form_id},
        {"$set": {
            "status": "paused",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    
    return {"success": True, "status": "paused"}


# Public form endpoints

@router.get("/forms/{form_id}/render", response_model=FormRenderResponse)
async def render_form(form_id: str, utm_source: Optional[str] = None, utm_medium: Optional[str] = None, utm_campaign: Optional[str] = None, utm_content: Optional[str] = None):
    """Render form for public display"""
    db = get_db()
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    if form.get("status") != "active":
        raise HTTPException(status_code=400, detail="Form is not active")
    
    # Merge UTM params (query params override form defaults)
    utm_params = {
        "utm_source": utm_source or form.get("utm_source"),
        "utm_medium": utm_medium or form.get("utm_medium"),
        "utm_campaign": utm_campaign or form.get("utm_campaign"),
        "utm_content": utm_content or form.get("utm_content"),
    }
    
    return FormRenderResponse(
        form_id=form_id,
        form_name=form["name"],
        fields=form.get("fields", []),
        submit_button_text=form.get("submit_button_text", "Gửi"),
        utm_params=utm_params,
        submit_url=f"/api/marketing/v2/forms/{form_id}/submit",
    )


@router.post("/forms/{form_id}/submit", response_model=FormSubmitResponse)
async def submit_form(form_id: str, submission: FormSubmitRequest, request: Request):
    """Submit a form (public endpoint)"""
    db = get_db()
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    if form.get("status") != "active":
        raise HTTPException(status_code=400, detail="Form is not active")
    
    submission_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get client info
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    
    # Create submission record
    submission_doc = {
        "id": submission_id,
        "form_id": form_id,
        "content_asset_id": form.get("content_asset_id"),
        "channel_id": None,  # Would be set from referrer analysis
        "campaign_id": form.get("campaign_id"),
        "data": submission.data,
        "utm_source": submission.utm_source or form.get("utm_source"),
        "utm_medium": submission.utm_medium or form.get("utm_medium"),
        "utm_campaign": submission.utm_campaign or form.get("utm_campaign"),
        "utm_content": submission.utm_content or form.get("utm_content"),
        "utm_term": submission.utm_term,
        "referrer_url": submission.referrer_url,
        "landing_page_url": submission.landing_page_url,
        "ip_address": client_ip,
        "user_agent": user_agent,
        "device_type": None,  # Would be parsed from user_agent
        "browser": None,
        "country": None,
        "city": None,
        "status": "received",
        "lead_id": None,
        "contact_id": None,
        "touchpoint_id": None,
        "attribution_id": None,
        "is_duplicate": False,
        "duplicate_of_contact_id": None,
        "duplicate_reason": None,
        "error_message": None,
        "submitted_at": now,
        "processed_at": None,
    }
    
    await db.form_submissions.insert_one(submission_doc)
    
    # Update form stats
    await db.forms.update_one(
        {"id": form_id},
        {"$inc": {"total_submissions": 1}}
    )
    
    # TODO: Process submission asynchronously (create lead, touchpoint, etc.)
    
    return FormSubmitResponse(
        success=True,
        submission_id=submission_id,
        message=form.get("success_message", "Cảm ơn bạn đã đăng ký!"),
        redirect_url=form.get("redirect_url"),
    )


@router.get("/forms/{form_id}/submissions", response_model=List[FormSubmissionResponse])
async def get_form_submissions(
    form_id: str,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get form submissions"""
    db = get_db()
    
    query = {"form_id": form_id}
    if status:
        query["status"] = status
    
    submissions = await db.form_submissions.find(query, {"_id": 0}).sort("submitted_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for sub in submissions:
        status_info = get_form_submission_status(sub.get("status", "received")) or {}
        
        form_name = ""
        form = await db.forms.find_one({"id": sub["form_id"]}, {"_id": 0, "name": 1})
        if form:
            form_name = form["name"]
        
        result.append(FormSubmissionResponse(
            **sub,
            form_name=form_name,
            status_label=status_info.get("label_vi", sub.get("status", "")),
        ))
    
    return result


# ============================================
# RESPONSE TEMPLATE ROUTES
# ============================================

@router.post("/templates", response_model=ResponseTemplateResponse)
async def create_response_template(template: ResponseTemplateCreate):
    """Create a new response template"""
    db = get_db()
    
    template_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate code
    seq = await get_next_sequence("response_templates")
    code = f"TMPL-{datetime.now().year}-{seq:03d}"
    
    category_info = get_template_category(template.category.value) or {}
    
    template_doc = {
        "id": template_id,
        "code": code,
        "name": template.name,
        "category": template.category.value,
        "channel_ids": template.channel_ids,
        "trigger_keywords": template.trigger_keywords,
        "trigger_intents": template.trigger_intents,
        "trigger_conditions": template.trigger_conditions,
        "template_text": template.template_text,
        "variables": template.variables,
        "variable_sources": template.variable_sources,
        "priority": template.priority,
        "requires_human_review": template.requires_human_review,
        "status": "draft",
        "submitted_at": None,
        "submitted_by": None,
        "approved_at": None,
        "approved_by": None,
        "rejection_reason": None,
        "usage_count": 0,
        "last_used_at": None,
        "success_rate": 0.0,
        "is_ab_variant": template.is_ab_variant,
        "ab_parent_id": template.ab_parent_id,
        "ab_variant_name": template.ab_variant_name,
        "created_at": now,
        "created_by": None,
        "updated_at": now,
    }
    
    await db.response_templates.insert_one(template_doc)
    
    return ResponseTemplateResponse(
        **{k: v for k, v in template_doc.items() if k != "_id"},
        category_label=category_info.get("label_vi", template.category.value),
        status_label=get_template_status("draft").get("label_vi", "Bản nháp"),
    )


@router.get("/templates", response_model=List[ResponseTemplateResponse])
async def get_response_templates(
    category: Optional[str] = None,
    status: Optional[str] = None,
    channel_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get all response templates with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if channel_id:
        query["channel_ids"] = channel_id
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"template_text": {"$regex": search, "$options": "i"}},
            {"trigger_keywords": {"$regex": search, "$options": "i"}},
        ]
    
    templates = await db.response_templates.find(query, {"_id": 0}).sort([("priority", 1), ("created_at", -1)]).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for tmpl in templates:
        category_info = get_template_category(tmpl.get("category", "")) or {}
        status_info = get_template_status(tmpl.get("status", "draft")) or {}
        
        result.append(ResponseTemplateResponse(
            **tmpl,
            category_label=category_info.get("label_vi", tmpl.get("category", "")),
            status_label=status_info.get("label_vi", tmpl.get("status", "")),
        ))
    
    return result


@router.get("/templates/{template_id}", response_model=ResponseTemplateResponse)
async def get_response_template(template_id: str):
    """Get a response template by ID"""
    db = get_db()
    template = await db.response_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Response template not found")
    
    category_info = get_template_category(template.get("category", "")) or {}
    status_info = get_template_status(template.get("status", "draft")) or {}
    
    return ResponseTemplateResponse(
        **template,
        category_label=category_info.get("label_vi", template.get("category", "")),
        status_label=status_info.get("label_vi", template.get("status", "")),
    )


@router.put("/templates/{template_id}")
async def update_response_template(template_id: str, updates: Dict[str, Any]):
    """Update a response template"""
    db = get_db()
    template = await db.response_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Response template not found")
    
    updates.pop("id", None)
    updates.pop("code", None)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.response_templates.update_one({"id": template_id}, {"$set": updates})
    return {"success": True}


@router.post("/templates/{template_id}/submit-approval")
async def submit_template_for_approval(template_id: str):
    """Submit template for approval"""
    db = get_db()
    template = await db.response_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Response template not found")
    
    if template.get("status") != "draft":
        raise HTTPException(status_code=400, detail="Only draft templates can be submitted for approval")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.response_templates.update_one(
        {"id": template_id},
        {"$set": {
            "status": "pending_approval",
            "submitted_at": now,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "pending_approval"}


@router.post("/templates/{template_id}/approve")
async def approve_template(template_id: str):
    """Approve a template"""
    db = get_db()
    template = await db.response_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Response template not found")
    
    if template.get("status") != "pending_approval":
        raise HTTPException(status_code=400, detail="Only pending approval templates can be approved")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.response_templates.update_one(
        {"id": template_id},
        {"$set": {
            "status": "approved",
            "approved_at": now,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "approved"}


@router.post("/templates/{template_id}/reject")
async def reject_template(template_id: str, reason: str):
    """Reject a template"""
    db = get_db()
    template = await db.response_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Response template not found")
    
    if template.get("status") != "pending_approval":
        raise HTTPException(status_code=400, detail="Only pending approval templates can be rejected")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.response_templates.update_one(
        {"id": template_id},
        {"$set": {
            "status": "rejected",
            "rejection_reason": reason,
            "updated_at": now,
        }}
    )
    
    return {"success": True, "status": "rejected"}


@router.post("/templates/match", response_model=TemplateMatchResponse)
async def match_template(match_request: TemplateMatchRequest):
    """Find matching template for a message"""
    db = get_db()
    
    message_lower = match_request.message.lower()
    
    # Find templates with matching keywords
    templates = await db.response_templates.find(
        {
            "status": "approved",
            "$or": [
                {"channel_ids": {"$size": 0}},  # All channels
                {"channel_ids": match_request.channel_id},
            ]
        },
        {"_id": 0}
    ).sort("priority", 1).to_list(100)
    
    best_match = None
    best_score = 0
    
    for tmpl in templates:
        score = 0
        for keyword in tmpl.get("trigger_keywords", []):
            if keyword.lower() in message_lower:
                score += 1
        
        if score > best_score:
            best_score = score
            best_match = tmpl
    
    if not best_match:
        return TemplateMatchResponse(matched=False)
    
    # Simple variable replacement (would be more sophisticated in production)
    rendered_text = best_match["template_text"]
    
    return TemplateMatchResponse(
        matched=True,
        template_id=best_match["id"],
        template_name=best_match["name"],
        rendered_text=rendered_text,
        confidence=min(best_score / 3, 1.0),
        requires_review=best_match.get("requires_human_review", False),
    )


# ============================================
# ATTRIBUTION ROUTES
# ============================================

@router.get("/attributions", response_model=List[AttributionResponse])
async def get_attributions(
    contact_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    is_locked: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get all attributions with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if contact_id:
        query["contact_id"] = contact_id
    if lead_id:
        query["lead_id"] = lead_id
    if deal_id:
        query["deal_id"] = deal_id
    if is_locked is not None:
        query["is_locked"] = is_locked
    
    attributions = await db.attributions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for attr in attributions:
        contact_name = ""
        if attr.get("contact_id"):
            contact = await db.contacts.find_one({"id": attr["contact_id"]}, {"_id": 0, "full_name": 1})
            contact_name = contact["full_name"] if contact else ""
        
        result.append(AttributionResponse(
            **attr,
            contact_name=contact_name,
        ))
    
    return result


@router.get("/attributions/{attribution_id}", response_model=AttributionResponse)
async def get_attribution(attribution_id: str):
    """Get an attribution by ID"""
    db = get_db()
    attribution = await db.attributions.find_one({"id": attribution_id}, {"_id": 0})
    if not attribution:
        raise HTTPException(status_code=404, detail="Attribution not found")
    
    contact_name = ""
    if attribution.get("contact_id"):
        contact = await db.contacts.find_one({"id": attribution["contact_id"]}, {"_id": 0, "full_name": 1})
        contact_name = contact["full_name"] if contact else ""
    
    return AttributionResponse(
        **attribution,
        contact_name=contact_name,
    )


@router.get("/attributions/contact/{contact_id}", response_model=AttributionResponse)
async def get_attribution_by_contact(contact_id: str):
    """Get attribution for a contact"""
    db = get_db()
    attribution = await db.attributions.find_one({"contact_id": contact_id, "is_locked": True}, {"_id": 0})
    if not attribution:
        # Return latest unlocked attribution
        attribution = await db.attributions.find_one({"contact_id": contact_id}, {"_id": 0})
    
    if not attribution:
        raise HTTPException(status_code=404, detail="Attribution not found for contact")
    
    contact_name = ""
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0, "full_name": 1})
    if contact:
        contact_name = contact["full_name"]
    
    return AttributionResponse(
        **attribution,
        contact_name=contact_name,
    )


@router.post("/attributions/{attribution_id}/lock")
async def lock_attribution(attribution_id: str, reason: str = "manual"):
    """Lock an attribution (make immutable)"""
    db = get_db()
    attribution = await db.attributions.find_one({"id": attribution_id}, {"_id": 0})
    if not attribution:
        raise HTTPException(status_code=404, detail="Attribution not found")
    
    if attribution.get("is_locked"):
        raise HTTPException(status_code=400, detail="Attribution is already locked")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.attributions.update_one(
        {"id": attribution_id},
        {"$set": {
            "is_locked": True,
            "locked_at": now,
            "lock_reason": reason,
        }}
    )
    
    return {"success": True, "is_locked": True, "locked_at": now}


@router.get("/attributions/report", response_model=AttributionReport)
async def get_attribution_report(
    period: str = "30d",
    attribution_model: str = "first_touch",
):
    """Get attribution report"""
    db = get_db()
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=30)
    
    start_iso = start_date.isoformat()
    
    # Get attributions in period
    attributions = await db.attributions.find(
        {"created_at": {"$gte": start_iso}},
        {"_id": 0}
    ).to_list(1000)
    
    # Aggregate by campaign
    by_campaign = {}
    by_channel = {}
    by_content = {}
    by_source = {}
    
    for attr in attributions:
        first_touch = attr.get("first_touch", {})
        
        # By campaign
        campaign_id = first_touch.get("campaign_id")
        if campaign_id:
            if campaign_id not in by_campaign:
                by_campaign[campaign_id] = {
                    "campaign_id": campaign_id,
                    "campaign_name": first_touch.get("campaign_name", ""),
                    "leads": 0,
                    "conversions": 0,
                    "revenue": 0,
                }
            by_campaign[campaign_id]["leads"] += 1
            if attr.get("conversion_event"):
                by_campaign[campaign_id]["conversions"] += 1
                by_campaign[campaign_id]["revenue"] += attr.get("conversion_value", 0)
        
        # By channel
        channel_id = first_touch.get("channel_id")
        if channel_id:
            if channel_id not in by_channel:
                by_channel[channel_id] = {
                    "channel_id": channel_id,
                    "channel_name": first_touch.get("channel_name", ""),
                    "leads": 0,
                    "conversions": 0,
                    "revenue": 0,
                }
            by_channel[channel_id]["leads"] += 1
            if attr.get("conversion_event"):
                by_channel[channel_id]["conversions"] += 1
                by_channel[channel_id]["revenue"] += attr.get("conversion_value", 0)
        
        # By source
        source_id = first_touch.get("source_id")
        if source_id:
            if source_id not in by_source:
                by_source[source_id] = {
                    "source_id": source_id,
                    "source_name": first_touch.get("source_name", ""),
                    "leads": 0,
                    "conversions": 0,
                    "revenue": 0,
                }
            by_source[source_id]["leads"] += 1
            if attr.get("conversion_event"):
                by_source[source_id]["conversions"] += 1
                by_source[source_id]["revenue"] += attr.get("conversion_value", 0)
    
    total_leads = len(attributions)
    total_conversions = len([a for a in attributions if a.get("conversion_event")])
    total_revenue = sum(a.get("conversion_value", 0) for a in attributions)
    
    return AttributionReport(
        period_start=start_iso,
        period_end=now.isoformat(),
        by_campaign=list(by_campaign.values()),
        by_channel=list(by_channel.values()),
        by_content=list(by_content.values()),
        by_source=list(by_source.values()),
        total_leads=total_leads,
        total_conversions=total_conversions,
        total_revenue=total_revenue,
    )


# ============================================
# DASHBOARD ROUTES
# ============================================

@router.get("/dashboard", response_model=MarketingDashboardResponse)
async def get_marketing_dashboard(period: str = "30d"):
    """Get marketing dashboard data"""
    db = get_db()
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=30)
    
    start_iso = start_date.isoformat()
    
    # Total leads
    total_leads = await db.leads.count_documents({"created_at": {"$gte": start_iso}})
    
    # Qualified leads
    qualified_leads = await db.leads.count_documents({
        "created_at": {"$gte": start_iso},
        "stage": {"$in": ["qualified", "qualifying", "converted"]}
    })
    
    # Converted leads
    converted_leads = await db.leads.count_documents({
        "created_at": {"$gte": start_iso},
        "$or": [
            {"status": "closed_won"},
            {"stage": "converted"}
        ]
    })
    
    # Conversion rate
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Active counts
    active_campaigns = await db.campaigns.count_documents({"status": "active"})
    active_channels = await db.channels.count_documents({"is_active": True, "status": "connected"})
    active_forms = await db.forms.count_documents({"status": "active"})
    
    # Leads by channel
    channel_pipeline = [
        {"$match": {"created_at": {"$gte": start_iso}}},
        {"$group": {"_id": "$channel_id", "count": {"$sum": 1}}}
    ]
    channel_breakdown = await db.leads.aggregate(channel_pipeline).to_list(20)
    leads_by_channel = {item["_id"]: item["count"] for item in channel_breakdown if item["_id"]}
    
    return MarketingDashboardResponse(
        total_leads=total_leads,
        qualified_leads=qualified_leads,
        converted_leads=converted_leads,
        conversion_rate=round(conversion_rate, 2),
        active_campaigns=active_campaigns,
        active_channels=active_channels,
        active_forms=active_forms,
        leads_by_channel=leads_by_channel,
        period_start=start_iso,
        period_end=now.isoformat(),
    )
