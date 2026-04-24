"""
ProHouzing CMS Router - Prompt 14/20
Website CMS / Landing Page / SEO Engine

API endpoints for public content management

MARKETING ENGINE INTEGRATION:
- CMS = Single Source of Truth for public content
- Auto-creates ContentAsset in Marketing Engine when Article/Landing published
- Form submissions create Leads with full attribution
- Page views tracked with UTM params for attribution
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import re

from models.cms_models import (
    # Tracking
    PageViewCreate, PageViewResponse, VisitorTrackingData,
    # Website Pages
    WebsitePageCreate, WebsitePageUpdate, WebsitePageResponse,
    # Articles
    ArticleCreate, ArticleUpdate, ArticleResponse,
    # Landing Pages
    LandingPageCreate, LandingPageUpdate, LandingPageResponse,
    # Public Projects
    PublicProjectCreate, PublicProjectUpdate, PublicProjectResponse,
    # Testimonials
    TestimonialCreate, TestimonialUpdate, TestimonialResponse,
    # Partners
    PartnerCreate, PartnerUpdate, PartnerResponse,
    # Careers
    CareerCreate, CareerUpdate, CareerResponse,
    # Media Assets
    MediaAssetCreate, MediaAssetUpdate, MediaAssetResponse,
    # FAQ
    FAQItemCreate, FAQItemUpdate, FAQItemResponse,
    # Menu
    MenuItemCreate, MenuItemResponse,
    # Dashboard
    CMSDashboardStats,
    # Sitemap
    SitemapEntry, SitemapResponse,
    # Common
    SEOMetadata, CTAButton
)

from config.cms_config import (
    get_content_status_config,
    get_page_type_config,
    get_article_category_config,
    get_static_page_config,
    get_landing_page_config,
    get_partner_category_config,
    get_testimonial_category_config,
    get_media_asset_config,
    get_seo_config,
    get_visibility_config,
    get_cta_type_config,
    get_cms_form_config,
    PUBLIC_PROJECT_FIELDS
)

# MongoDB connection - USE SAME DB AS SERVER.PY
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')  # Match server.py
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

cms_router = APIRouter(prefix="/cms", tags=["CMS - Website Content Management"])


# ==================== HELPER FUNCTIONS ====================

def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from Vietnamese text"""
    slug = text.lower()
    char_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    }
    for vn, en in char_map.items():
        slug = slug.replace(vn, en)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug


def calculate_read_time(content: str) -> int:
    """Calculate estimated read time in minutes"""
    # Average reading speed: 200 words per minute
    word_count = len(content.split())
    return max(1, round(word_count / 200))


async def ensure_unique_slug(collection: str, slug: str, exclude_id: str = None) -> str:
    """Ensure slug is unique in collection"""
    query = {"slug": slug}
    if exclude_id:
        query["id"] = {"$ne": exclude_id}
    
    existing = await db[collection].find_one(query)
    if not existing:
        return slug
    
    # Add number suffix
    counter = 1
    while True:
        new_slug = f"{slug}-{counter}"
        query["slug"] = new_slug
        if not await db[collection].find_one(query):
            return new_slug
        counter += 1


# ==================== MARKETING ENGINE INTEGRATION ====================

def generate_content_code(content_type: str) -> str:
    """Generate code for ContentAsset"""
    prefix = {
        "article": "ART",
        "landing_page": "LP",
        "page": "PG",
        "project": "PRJ"
    }.get(content_type, "CNT")
    timestamp = datetime.now(timezone.utc).strftime("%y%m%d%H%M")
    random_suffix = str(uuid.uuid4())[:4].upper()
    return f"{prefix}-{timestamp}-{random_suffix}"


async def create_content_asset(
    title: str,
    content_type: str,
    body: str,
    cms_id: str,
    cms_type: str,
    campaign_id: str = None,
    project_ids: List[str] = None,
    media_urls: List[str] = None,
    hashtags: List[str] = None,
    form_id: str = None,
    utm_source: str = None,
    utm_medium: str = None,
    utm_campaign: str = None
) -> str:
    """Create ContentAsset in Marketing Engine when CMS content is published"""
    now = datetime.now(timezone.utc).isoformat()
    asset_id = str(uuid.uuid4())
    code = generate_content_code(content_type)
    
    asset_doc = {
        "id": asset_id,
        "code": code,
        "title": title,
        "content_type": content_type,
        "body": body[:1000] if body else "",  # First 1000 chars as summary
        "campaign_id": campaign_id,
        "project_ids": project_ids or [],
        "media_urls": media_urls or [],
        "hashtags": hashtags or [],
        "form_id": form_id,
        "utm_source": utm_source,
        "utm_medium": utm_medium,
        "utm_campaign": utm_campaign,
        # CMS linkage
        "cms_source_id": cms_id,
        "cms_source_type": cms_type,
        # Status
        "status": "published",
        "published_at": now,
        # Stats
        "impressions": 0,
        "clicks": 0,
        "leads_generated": 0,
        "form_submissions": 0,
        "engagement_rate": 0.0,
        "created_at": now,
        "created_by": "cms_system"
    }
    
    await db.content_assets.insert_one(asset_doc)
    return asset_id


async def get_form_details(form_id: str) -> Dict[str, Any]:
    """Get form details from Marketing Engine"""
    if not form_id:
        return None
    form = await db.forms.find_one({"id": form_id}, {"_id": 0, "id": 1, "name": 1, "code": 1})
    return form


async def get_campaign_details(campaign_id: str) -> Dict[str, Any]:
    """Get campaign details from Marketing Engine"""
    if not campaign_id:
        return None
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0, "id": 1, "name": 1, "code": 1})
    return campaign


async def create_lead_from_form_submission(
    form_id: str,
    submission_data: Dict[str, Any],
    tracking: Dict[str, Any],
    cms_source_id: str,
    cms_source_type: str
) -> str:
    """Create Lead when form is submitted - FULL ATTRIBUTION"""
    now = datetime.now(timezone.utc).isoformat()
    lead_id = str(uuid.uuid4())
    
    # Get form details from Marketing Engine
    form = await db.forms.find_one({"id": form_id}, {"_id": 0})
    
    # Extract lead data from submission
    name = submission_data.get("name", submission_data.get("ho_ten", ""))
    phone = submission_data.get("phone", submission_data.get("dien_thoai", submission_data.get("so_dien_thoai", "")))
    email = submission_data.get("email", "")
    
    lead_doc = {
        "id": lead_id,
        "name": name,
        "phone": phone,
        "email": email,
        "source_type": "website",
        "source_channel": tracking.get("utm_source", "organic"),
        # Full attribution
        "utm_source": tracking.get("utm_source"),
        "utm_medium": tracking.get("utm_medium"),
        "utm_campaign": tracking.get("utm_campaign"),
        "utm_content": tracking.get("utm_content"),
        "utm_term": tracking.get("utm_term"),
        "referrer_url": tracking.get("referrer_url"),
        "landing_page_id": tracking.get("landing_page_id"),
        "landing_page_url": tracking.get("landing_page_url"),
        # Form linkage (Marketing Engine)
        "form_id": form_id,
        "form_name": form.get("name") if form else None,
        # CMS source
        "cms_source_id": cms_source_id,
        "cms_source_type": cms_source_type,
        # Campaign linkage (from form or tracking)
        "campaign_id": form.get("campaign_id") if form else tracking.get("campaign_id"),
        # Original submission
        "form_data": submission_data,
        # Status
        "status": "new",
        "created_at": now,
        "created_by": "cms_form_submission"
    }
    
    await db.leads.insert_one(lead_doc)
    
    # Update form submission count in Marketing Engine
    if form_id:
        await db.forms.update_one(
            {"id": form_id},
            {"$inc": {"total_submissions": 1, "total_leads_created": 1}}
        )
    
    return lead_id


# ==================== PAGE VIEW TRACKING ====================

@cms_router.post("/track/pageview", response_model=PageViewResponse)
async def track_page_view(data: PageViewCreate, request: Request):
    """Track page view with FULL attribution data"""
    now = datetime.now(timezone.utc).isoformat()
    view_id = str(uuid.uuid4())
    
    # Get page details to find content_asset_id and campaign_id
    content_asset_id = None
    campaign_id = None
    
    collection_map = {
        "article": "cms_articles",
        "landing_page": "cms_landing_pages",
        "public_project": "cms_public_projects",
        "page": "cms_pages"
    }
    
    collection = collection_map.get(data.page_type)
    if collection:
        page = await db[collection].find_one({"id": data.page_id}, {"_id": 0, "content_asset_id": 1, "campaign_id": 1})
        if page:
            content_asset_id = page.get("content_asset_id")
            campaign_id = page.get("campaign_id")
    
    # Prepare tracking data
    tracking_dict = data.tracking.model_dump() if data.tracking else {}
    tracking_dict["ip_address"] = request.client.host if request.client else None
    
    view_doc = {
        "id": view_id,
        "page_id": data.page_id,
        "page_type": data.page_type,
        "slug": data.slug,
        "content_asset_id": content_asset_id,
        "campaign_id": campaign_id,
        "tracking": tracking_dict,
        "created_at": now
    }
    
    await db.cms_page_views.insert_one(view_doc)
    
    # Update view counts
    if collection:
        await db[collection].update_one(
            {"id": data.page_id},
            {"$inc": {"views": 1}}
        )
        
        # Update unique visitors (simplified - check by visitor_id or session_id)
        if tracking_dict.get("visitor_id") or tracking_dict.get("session_id"):
            visitor_key = tracking_dict.get("visitor_id") or tracking_dict.get("session_id")
            existing_visit = await db.cms_page_views.find_one({
                "page_id": data.page_id,
                "$or": [
                    {"tracking.visitor_id": visitor_key},
                    {"tracking.session_id": visitor_key}
                ],
                "id": {"$ne": view_id}
            })
            if not existing_visit:
                await db[collection].update_one(
                    {"id": data.page_id},
                    {"$inc": {"unique_visitors": 1}}
                )
    
    # Update ContentAsset impressions in Marketing Engine
    if content_asset_id:
        await db.content_assets.update_one(
            {"id": content_asset_id},
            {"$inc": {"impressions": 1}}
        )
    
    view_doc.pop("_id", None)
    return PageViewResponse(**view_doc)


# ==================== FORM SUBMISSION WITH LEAD CREATION ====================

from pydantic import BaseModel as PydanticBaseModel

class CMSFormSubmitRequest(PydanticBaseModel):
    """Form submission from CMS page"""
    form_id: str
    page_id: str
    page_type: str  # article, landing_page, public_project
    data: Dict[str, Any]
    tracking: Optional[VisitorTrackingData] = None


class CMSFormSubmitResponse(PydanticBaseModel):
    """Form submission response"""
    success: bool
    submission_id: str
    lead_id: Optional[str] = None
    message: str
    redirect_url: Optional[str] = None


@cms_router.post("/submit/form", response_model=CMSFormSubmitResponse)
async def submit_cms_form(data: CMSFormSubmitRequest, request: Request):
    """Submit form from CMS page - CREATES LEAD WITH FULL ATTRIBUTION"""
    now = datetime.now(timezone.utc).isoformat()
    submission_id = str(uuid.uuid4())
    
    # Validate form exists in Marketing Engine
    form = await db.forms.find_one({"id": data.form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found in Marketing Engine")
    
    # Prepare tracking data
    tracking_dict = data.tracking.model_dump() if data.tracking else {}
    tracking_dict["ip_address"] = request.client.host if request.client else None
    tracking_dict["landing_page_id"] = data.page_id
    
    # Get campaign_id from page if not in tracking
    collection_map = {
        "article": "cms_articles",
        "landing_page": "cms_landing_pages",
        "public_project": "cms_public_projects"
    }
    collection = collection_map.get(data.page_type)
    if collection and not tracking_dict.get("campaign_id"):
        page = await db[collection].find_one({"id": data.page_id}, {"_id": 0, "campaign_id": 1, "content_asset_id": 1})
        if page:
            tracking_dict["campaign_id"] = page.get("campaign_id")
    
    # Create lead with full attribution
    lead_id = await create_lead_from_form_submission(
        form_id=data.form_id,
        submission_data=data.data,
        tracking=tracking_dict,
        cms_source_id=data.page_id,
        cms_source_type=data.page_type
    )
    
    # Store submission record
    submission_doc = {
        "id": submission_id,
        "form_id": data.form_id,
        "form_name": form.get("name"),
        "page_id": data.page_id,
        "page_type": data.page_type,
        "data": data.data,
        "tracking": tracking_dict,
        "lead_id": lead_id,
        "created_at": now
    }
    await db.cms_form_submissions.insert_one(submission_doc)
    
    # Update page stats
    if collection:
        await db[collection].update_one(
            {"id": data.page_id},
            {"$inc": {"form_submissions": 1, "leads_generated": 1}}
        )
        
        # Recalculate conversion rate
        page = await db[collection].find_one({"id": data.page_id}, {"_id": 0, "views": 1, "form_submissions": 1})
        if page and page.get("views", 0) > 0:
            cvr = round((page.get("form_submissions", 0) / page["views"]) * 100, 2)
            await db[collection].update_one(
                {"id": data.page_id},
                {"$set": {"conversion_rate": cvr}}
            )
    
    # Update ContentAsset stats
    if collection:
        page = await db[collection].find_one({"id": data.page_id}, {"_id": 0, "content_asset_id": 1})
        if page and page.get("content_asset_id"):
            await db.content_assets.update_one(
                {"id": page["content_asset_id"]},
                {"$inc": {"form_submissions": 1, "leads_generated": 1}}
            )
    
    return CMSFormSubmitResponse(
        success=True,
        submission_id=submission_id,
        lead_id=lead_id,
        message=form.get("success_message", "Cảm ơn bạn đã đăng ký!"),
        redirect_url=form.get("redirect_url")
    )


# ==================== CONFIG ENDPOINTS ====================

@cms_router.get("/config/content-statuses")
async def get_content_statuses():
    """Get all content status configurations"""
    return get_content_status_config()


@cms_router.get("/config/page-types")
async def get_page_types():
    """Get all page type configurations"""
    return get_page_type_config()


@cms_router.get("/config/article-categories")
async def get_article_categories():
    """Get all article category configurations"""
    return get_article_category_config()


@cms_router.get("/config/static-page-types")
async def get_static_page_types():
    """Get all static page type configurations"""
    return get_static_page_config()


@cms_router.get("/config/landing-page-types")
async def get_landing_page_types():
    """Get all landing page type configurations"""
    return get_landing_page_config()


@cms_router.get("/config/partner-categories")
async def get_partner_categories():
    """Get all partner category configurations"""
    return get_partner_category_config()


@cms_router.get("/config/testimonial-categories")
async def get_testimonial_categories():
    """Get all testimonial category configurations"""
    return get_testimonial_category_config()


@cms_router.get("/config/media-asset-types")
async def get_media_asset_types():
    """Get all media asset type configurations"""
    return get_media_asset_config()


@cms_router.get("/config/seo")
async def get_seo_settings():
    """Get SEO configuration settings"""
    return get_seo_config()


@cms_router.get("/config/visibility-levels")
async def get_visibility_levels():
    """Get visibility level configurations"""
    return get_visibility_config()


@cms_router.get("/config/cta-types")
async def get_cta_types():
    """Get CTA type configurations"""
    return get_cta_type_config()


@cms_router.get("/config/form-types")
async def get_form_types():
    """Get CMS form type configurations"""
    return get_cms_form_config()


# ==================== MARKETING ENGINE DATA ENDPOINTS ====================

@cms_router.get("/marketing/forms")
async def get_available_forms():
    """Get available forms from Marketing Engine for CMS linking"""
    forms = await db.forms.find(
        {},  # Get all forms regardless of status
        {"_id": 0, "id": 1, "code": 1, "name": 1, "form_type": 1, "campaign_id": 1, "status": 1}
    ).sort("name", 1).to_list(100)
    return forms


@cms_router.get("/marketing/campaigns")
async def get_available_campaigns():
    """Get available campaigns from Marketing Engine for CMS linking"""
    campaigns = await db.campaigns.find(
        {},  # Get all campaigns
        {"_id": 0, "id": 1, "code": 1, "name": 1, "campaign_type": 1, "start_date": 1, "end_date": 1, "status": 1}
    ).sort("name", 1).to_list(100)
    return campaigns


@cms_router.get("/marketing/channels")
async def get_available_channels():
    """Get available channels from Marketing Engine"""
    channels = await db.channels.find(
        {"is_active": True},
        {"_id": 0, "id": 1, "code": 1, "name": 1, "channel_type": 1}
    ).sort("name", 1).to_list(50)
    return channels


# ==================== DASHBOARD ENDPOINTS ====================

@cms_router.get("/dashboard", response_model=CMSDashboardStats)
async def get_cms_dashboard():
    """Get CMS dashboard statistics"""
    stats = CMSDashboardStats()
    
    # Pages
    stats.total_pages = await db.cms_pages.count_documents({})
    stats.published_pages = await db.cms_pages.count_documents({"status": "published"})
    stats.draft_pages = await db.cms_pages.count_documents({"status": "draft"})
    
    # Articles
    stats.total_articles = await db.cms_articles.count_documents({})
    stats.published_articles = await db.cms_articles.count_documents({"status": "published"})
    
    # Landing pages
    stats.total_landing_pages = await db.cms_landing_pages.count_documents({})
    stats.active_landing_pages = await db.cms_landing_pages.count_documents({"status": "published"})
    
    # Public projects
    stats.total_public_projects = await db.cms_public_projects.count_documents({})
    
    # Testimonials
    stats.total_testimonials = await db.cms_testimonials.count_documents({})
    
    # Partners
    stats.total_partners = await db.cms_partners.count_documents({})
    
    # Careers
    stats.total_careers = await db.cms_careers.count_documents({})
    stats.active_careers = await db.cms_careers.count_documents({"is_active": True})
    
    # Media assets
    stats.total_media_assets = await db.cms_media_assets.count_documents({})
    
    # FAQs
    stats.total_faqs = await db.cms_faqs.count_documents({})
    
    # Calculate totals from analytics
    pages_views = await db.cms_pages.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$views"}}}
    ]).to_list(1)
    articles_views = await db.cms_articles.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$views"}}}
    ]).to_list(1)
    landing_views = await db.cms_landing_pages.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$views"}}}
    ]).to_list(1)
    
    stats.total_page_views = (
        (pages_views[0]["total"] if pages_views else 0) +
        (articles_views[0]["total"] if articles_views else 0) +
        (landing_views[0]["total"] if landing_views else 0)
    )
    
    # Form submissions from landing pages
    landing_submissions = await db.cms_landing_pages.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$form_submissions"}}}
    ]).to_list(1)
    stats.total_form_submissions = landing_submissions[0]["total"] if landing_submissions else 0
    
    return stats


# ==================== WEBSITE PAGES ENDPOINTS ====================

@cms_router.post("/pages", response_model=WebsitePageResponse)
async def create_page(data: WebsitePageCreate):
    """Create a new website page"""
    now = datetime.now(timezone.utc).isoformat()
    page_id = str(uuid.uuid4())
    
    slug = data.slug if data.slug else generate_slug(data.title)
    slug = await ensure_unique_slug("cms_pages", slug)
    
    page_doc = {
        "id": page_id,
        "title": data.title,
        "page_type": data.page_type,
        "slug": slug,
        "content": data.content,
        "excerpt": data.excerpt,
        "sections": [s.model_dump() for s in data.sections] if data.sections else [],
        "featured_image": data.featured_image,
        "template": data.template,
        "seo": data.seo.model_dump() if data.seo else None,
        "ctas": [c.model_dump() for c in data.ctas] if data.ctas else [],
        "form_id": data.form_id,
        "is_in_menu": data.is_in_menu,
        "menu_order": data.menu_order,
        "parent_page_id": data.parent_page_id,
        "visibility": data.visibility,
        "status": data.status,
        "scheduled_at": data.scheduled_at,
        "published_at": now if data.status == "published" else None,
        "views": 0,
        "created_by": "system",  # TODO: Get from auth
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_pages.insert_one(page_doc)
    page_doc.pop("_id", None)
    return WebsitePageResponse(**page_doc)


@cms_router.get("/pages", response_model=List[WebsitePageResponse])
async def list_pages(
    status: Optional[str] = None,
    page_type: Optional[str] = None,
    visibility: Optional[str] = None,
    is_in_menu: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all website pages"""
    query = {}
    if status:
        query["status"] = status
    if page_type:
        query["page_type"] = page_type
    if visibility:
        query["visibility"] = visibility
    if is_in_menu is not None:
        query["is_in_menu"] = is_in_menu
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"slug": {"$regex": search, "$options": "i"}}
        ]
    
    pages = await db.cms_pages.find(query, {"_id": 0}).sort("menu_order", 1).skip(skip).limit(limit).to_list(limit)
    return [WebsitePageResponse(**p) for p in pages]


@cms_router.get("/pages/{page_id}", response_model=WebsitePageResponse)
async def get_page(page_id: str):
    """Get a website page by ID"""
    page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return WebsitePageResponse(**page)


@cms_router.get("/pages/by-slug/{slug}", response_model=WebsitePageResponse)
async def get_page_by_slug(slug: str, increment_view: bool = False):
    """Get a website page by slug (public endpoint)"""
    page = await db.cms_pages.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if increment_view:
        await db.cms_pages.update_one({"id": page["id"]}, {"$inc": {"views": 1}})
        page["views"] += 1
    
    return WebsitePageResponse(**page)


@cms_router.put("/pages/{page_id}", response_model=WebsitePageResponse)
async def update_page(page_id: str, data: WebsitePageUpdate):
    """Update a website page"""
    page = await db.cms_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Handle nested objects
    if "seo" in update_data and update_data["seo"]:
        update_data["seo"] = update_data["seo"]
    if "sections" in update_data:
        update_data["sections"] = [s if isinstance(s, dict) else s.model_dump() for s in update_data["sections"]]
    if "ctas" in update_data:
        update_data["ctas"] = [c if isinstance(c, dict) else c.model_dump() for c in update_data["ctas"]]
    
    # Handle slug update
    if "slug" in update_data:
        update_data["slug"] = await ensure_unique_slug("cms_pages", update_data["slug"], page_id)
    elif "title" in update_data and not data.slug:
        update_data["slug"] = await ensure_unique_slug("cms_pages", generate_slug(update_data["title"]), page_id)
    
    # Handle status change to published
    if update_data.get("status") == "published" and page.get("status") != "published":
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_pages.update_one({"id": page_id}, {"$set": update_data})
    
    updated = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
    return WebsitePageResponse(**updated)


@cms_router.delete("/pages/{page_id}")
async def delete_page(page_id: str):
    """Delete a website page"""
    result = await db.cms_pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"success": True, "message": "Page deleted"}


@cms_router.post("/pages/{page_id}/publish")
async def publish_page(page_id: str):
    """Publish a page"""
    page = await db.cms_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.cms_pages.update_one(
        {"id": page_id},
        {"$set": {"status": "published", "published_at": now, "updated_at": now}}
    )
    return {"success": True, "published_at": now}


@cms_router.post("/pages/{page_id}/unpublish")
async def unpublish_page(page_id: str):
    """Unpublish a page"""
    page = await db.cms_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.cms_pages.update_one(
        {"id": page_id},
        {"$set": {"status": "unpublished", "updated_at": now}}
    )
    return {"success": True}


# ==================== ARTICLES ENDPOINTS ====================

@cms_router.post("/articles", response_model=ArticleResponse)
async def create_article(data: ArticleCreate):
    """Create a new article - AUTO-LINKS to Marketing Engine"""
    now = datetime.now(timezone.utc).isoformat()
    article_id = str(uuid.uuid4())
    
    slug = data.slug if data.slug else generate_slug(data.title)
    slug = await ensure_unique_slug("cms_articles", slug)
    
    read_time = calculate_read_time(data.content)
    
    # Get form and campaign details
    form_details = await get_form_details(data.form_id)
    campaign_details = await get_campaign_details(data.campaign_id)
    
    # Create ContentAsset if publishing immediately
    content_asset_id = None
    if data.status == "published":
        content_asset_id = await create_content_asset(
            title=data.title,
            content_type="article",
            body=data.content,
            cms_id=article_id,
            cms_type="article",
            campaign_id=data.campaign_id,
            project_ids=data.related_project_ids,
            media_urls=[data.featured_image] if data.featured_image else [],
            hashtags=data.tags,
            form_id=data.form_id,
            utm_source=data.utm_source,
            utm_medium=data.utm_medium,
            utm_campaign=data.utm_campaign
        )
    
    article_doc = {
        "id": article_id,
        "title": data.title,
        "slug": slug,
        "excerpt": data.excerpt,
        "content": data.content,
        "category": data.category,
        "tags": data.tags,
        "featured_image": data.featured_image,
        "gallery": data.gallery,
        "author_id": data.author_id,
        "author_name": data.author_name,
        "seo": data.seo.model_dump() if data.seo else None,
        "related_project_ids": data.related_project_ids,
        # Marketing Engine Integration
        "content_asset_id": content_asset_id,
        "campaign_id": data.campaign_id,
        "campaign_name": campaign_details.get("name") if campaign_details else None,
        "form_id": data.form_id,
        "form_name": form_details.get("name") if form_details else None,
        "ctas": [c.model_dump() for c in data.ctas] if data.ctas else [],
        "utm_source": data.utm_source,
        "utm_medium": data.utm_medium,
        "utm_campaign": data.utm_campaign,
        "is_featured": data.is_featured,
        "is_pinned": data.is_pinned,
        "allow_comments": data.allow_comments,
        "status": data.status,
        "scheduled_at": data.scheduled_at,
        "published_at": now if data.status == "published" else None,
        "views": 0,
        "unique_visitors": 0,
        "form_submissions": 0,
        "leads_generated": 0,
        "likes": 0,
        "shares": 0,
        "comments_count": 0,
        "read_time_minutes": read_time,
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_articles.insert_one(article_doc)
    article_doc.pop("_id", None)
    return ArticleResponse(**article_doc)


@cms_router.get("/articles", response_model=List[ArticleResponse])
async def list_articles(
    status: Optional[str] = None,
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    is_pinned: Optional[bool] = None,
    author_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all articles"""
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if is_featured is not None:
        query["is_featured"] = is_featured
    if is_pinned is not None:
        query["is_pinned"] = is_pinned
    if author_id:
        query["author_id"] = author_id
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}}
        ]
    
    articles = await db.cms_articles.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [ArticleResponse(**a) for a in articles]


@cms_router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    """Get an article by ID"""
    article = await db.cms_articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleResponse(**article)


@cms_router.get("/articles/by-slug/{slug}", response_model=ArticleResponse)
async def get_article_by_slug(slug: str, increment_view: bool = False):
    """Get an article by slug (public endpoint)"""
    article = await db.cms_articles.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if increment_view:
        await db.cms_articles.update_one({"id": article["id"]}, {"$inc": {"views": 1}})
        article["views"] += 1
    
    return ArticleResponse(**article)


@cms_router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(article_id: str, data: ArticleUpdate):
    """Update an article"""
    article = await db.cms_articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "seo" in update_data and update_data["seo"]:
        update_data["seo"] = update_data["seo"]
    
    if "slug" in update_data:
        update_data["slug"] = await ensure_unique_slug("cms_articles", update_data["slug"], article_id)
    elif "title" in update_data and not data.slug:
        update_data["slug"] = await ensure_unique_slug("cms_articles", generate_slug(update_data["title"]), article_id)
    
    if "content" in update_data:
        update_data["read_time_minutes"] = calculate_read_time(update_data["content"])
    
    if update_data.get("status") == "published" and article.get("status") != "published":
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_articles.update_one({"id": article_id}, {"$set": update_data})
    
    updated = await db.cms_articles.find_one({"id": article_id}, {"_id": 0})
    return ArticleResponse(**updated)


@cms_router.delete("/articles/{article_id}")
async def delete_article(article_id: str):
    """Delete an article"""
    result = await db.cms_articles.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"success": True, "message": "Article deleted"}


@cms_router.post("/articles/{article_id}/publish")
async def publish_article(article_id: str):
    """Publish an article - AUTO-CREATES ContentAsset in Marketing Engine"""
    article = await db.cms_articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create ContentAsset if not exists
    content_asset_id = article.get("content_asset_id")
    if not content_asset_id:
        content_asset_id = await create_content_asset(
            title=article.get("title"),
            content_type="article",
            body=article.get("content", ""),
            cms_id=article_id,
            cms_type="article",
            campaign_id=article.get("campaign_id"),
            project_ids=article.get("related_project_ids", []),
            media_urls=[article.get("featured_image")] if article.get("featured_image") else [],
            hashtags=article.get("tags", []),
            form_id=article.get("form_id"),
            utm_source=article.get("utm_source"),
            utm_medium=article.get("utm_medium"),
            utm_campaign=article.get("utm_campaign")
        )
    
    await db.cms_articles.update_one(
        {"id": article_id},
        {"$set": {
            "status": "published", 
            "published_at": now, 
            "updated_at": now,
            "content_asset_id": content_asset_id
        }}
    )
    return {"success": True, "published_at": now, "content_asset_id": content_asset_id}


# ==================== LANDING PAGES ENDPOINTS ====================

@cms_router.post("/landing-pages", response_model=LandingPageResponse)
async def create_landing_page(data: LandingPageCreate):
    """Create a new landing page - CONVERSION PAGE with FULL Marketing Integration"""
    now = datetime.now(timezone.utc).isoformat()
    page_id = str(uuid.uuid4())
    
    slug = data.slug if data.slug else generate_slug(data.title)
    slug = await ensure_unique_slug("cms_landing_pages", slug)
    
    # Get form and campaign details
    form_details = await get_form_details(data.form_id)
    campaign_details = await get_campaign_details(data.campaign_id)
    
    # REQUIRED: Landing page MUST have campaign_id or form_id for proper attribution
    if not data.campaign_id and not data.form_id:
        # Auto-create if none provided - at minimum need tracking
        pass
    
    # Create ContentAsset if publishing immediately
    content_asset_id = None
    if data.status == "published":
        content_asset_id = await create_content_asset(
            title=data.title,
            content_type="landing_page",
            body=data.headline + " " + (data.subheadline or ""),
            cms_id=page_id,
            cms_type="landing_page",
            campaign_id=data.campaign_id,
            project_ids=data.project_ids or ([data.project_id] if data.project_id else []),
            media_urls=[data.hero_image] if data.hero_image else [],
            form_id=data.form_id,
            utm_source=data.utm_source,
            utm_medium=data.utm_medium,
            utm_campaign=data.utm_campaign
        )
    
    page_doc = {
        "id": page_id,
        "title": data.title,
        "slug": slug,
        "landing_type": data.landing_type,
        "headline": data.headline,
        "subheadline": data.subheadline,
        "hero_image": data.hero_image,
        "hero_video": data.hero_video,
        "sections": [s.model_dump() for s in data.sections] if data.sections else [],
        "ctas": [c.model_dump() for c in data.ctas] if data.ctas else [],
        # MARKETING ENGINE INTEGRATION
        "content_asset_id": content_asset_id,
        "form_id": data.form_id,
        "form_name": form_details.get("name") if form_details else None,
        "seo": data.seo.model_dump() if data.seo else None,
        "campaign_id": data.campaign_id,
        "campaign_name": campaign_details.get("name") if campaign_details else None,
        "source_channel": data.source_channel,
        "utm_source": data.utm_source,
        "utm_medium": data.utm_medium,
        "utm_campaign": data.utm_campaign,
        "utm_content": data.utm_content,
        "utm_term": data.utm_term,
        "project_id": data.project_id,
        "project_ids": data.project_ids,
        "template": data.template,
        "theme": data.theme,
        "hide_navigation": data.hide_navigation,
        "show_chat_widget": data.show_chat_widget,
        "tracking_pixel": data.tracking_pixel,
        "conversion_goal": data.conversion_goal,
        "status": data.status,
        "scheduled_at": data.scheduled_at,
        "expires_at": data.expires_at,
        "published_at": now if data.status == "published" else None,
        # ANALYTICS
        "views": 0,
        "unique_visitors": 0,
        "form_submissions": 0,
        "leads_generated": 0,
        "conversion_rate": 0.0,
        "avg_time_on_page": 0,
        "bounce_rate": 0.0,
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_landing_pages.insert_one(page_doc)
    page_doc.pop("_id", None)
    return LandingPageResponse(**page_doc)


@cms_router.get("/landing-pages", response_model=List[LandingPageResponse])
async def list_landing_pages(
    status: Optional[str] = None,
    landing_type: Optional[str] = None,
    campaign_id: Optional[str] = None,
    project_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all landing pages"""
    query = {}
    if status:
        query["status"] = status
    if landing_type:
        query["landing_type"] = landing_type
    if campaign_id:
        query["campaign_id"] = campaign_id
    if project_id:
        query["$or"] = [{"project_id": project_id}, {"project_ids": project_id}]
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"headline": {"$regex": search, "$options": "i"}}
        ]
    
    pages = await db.cms_landing_pages.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [LandingPageResponse(**p) for p in pages]


@cms_router.get("/landing-pages/{page_id}", response_model=LandingPageResponse)
async def get_landing_page(page_id: str):
    """Get a landing page by ID"""
    page = await db.cms_landing_pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return LandingPageResponse(**page)


@cms_router.get("/landing-pages/by-slug/{slug}", response_model=LandingPageResponse)
async def get_landing_page_by_slug(slug: str, increment_view: bool = False):
    """Get a landing page by slug (public endpoint)"""
    now = datetime.now(timezone.utc).isoformat()
    page = await db.cms_landing_pages.find_one({
        "slug": slug,
        "status": "published",
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$gt": now}}
        ]
    }, {"_id": 0})
    
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    
    if increment_view:
        await db.cms_landing_pages.update_one({"id": page["id"]}, {"$inc": {"views": 1}})
        page["views"] += 1
    
    return LandingPageResponse(**page)


@cms_router.put("/landing-pages/{page_id}", response_model=LandingPageResponse)
async def update_landing_page(page_id: str, data: LandingPageUpdate):
    """Update a landing page"""
    page = await db.cms_landing_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "seo" in update_data and update_data["seo"]:
        update_data["seo"] = update_data["seo"]
    if "sections" in update_data:
        update_data["sections"] = [s if isinstance(s, dict) else s.model_dump() for s in update_data["sections"]]
    if "ctas" in update_data:
        update_data["ctas"] = [c if isinstance(c, dict) else c.model_dump() for c in update_data["ctas"]]
    
    if "slug" in update_data:
        update_data["slug"] = await ensure_unique_slug("cms_landing_pages", update_data["slug"], page_id)
    elif "title" in update_data and not data.slug:
        update_data["slug"] = await ensure_unique_slug("cms_landing_pages", generate_slug(update_data["title"]), page_id)
    
    if update_data.get("status") == "published" and page.get("status") != "published":
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_landing_pages.update_one({"id": page_id}, {"$set": update_data})
    
    updated = await db.cms_landing_pages.find_one({"id": page_id}, {"_id": 0})
    return LandingPageResponse(**updated)


@cms_router.delete("/landing-pages/{page_id}")
async def delete_landing_page(page_id: str):
    """Delete a landing page"""
    result = await db.cms_landing_pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return {"success": True, "message": "Landing page deleted"}


@cms_router.post("/landing-pages/{page_id}/track-submission")
async def track_landing_submission(page_id: str):
    """Track a form submission on landing page (DEPRECATED - Use POST /cms/submit/form instead)
    
    This endpoint is kept for backward compatibility. New implementations should use 
    POST /cms/submit/form which provides full lead creation with attribution.
    """
    page = await db.cms_landing_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    
    views = page.get("views", 0)
    submissions = page.get("form_submissions", 0) + 1
    leads = page.get("leads_generated", 0) + 1
    conversion_rate = round((submissions / max(views, 1)) * 100, 2)
    
    await db.cms_landing_pages.update_one(
        {"id": page_id},
        {
            "$inc": {"form_submissions": 1, "leads_generated": 1}, 
            "$set": {"conversion_rate": conversion_rate}
        }
    )
    
    # Also update ContentAsset if exists
    if page.get("content_asset_id"):
        await db.content_assets.update_one(
            {"id": page["content_asset_id"]},
            {"$inc": {"form_submissions": 1, "leads_generated": 1}}
        )
    
    return {
        "success": True, 
        "form_submissions": submissions, 
        "leads_generated": leads,
        "conversion_rate": conversion_rate,
        "note": "For full lead creation with attribution, use POST /cms/submit/form"
    }


# ==================== PUBLIC PROJECTS ENDPOINTS ====================

@cms_router.post("/public-projects", response_model=PublicProjectResponse)
async def create_public_project(data: PublicProjectCreate):
    """Create a public project profile from internal project"""
    # Get source project
    project = await db.projects_master.find_one({"id": data.project_master_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Source project not found")
    
    now = datetime.now(timezone.utc).isoformat()
    public_id = str(uuid.uuid4())
    
    slug = data.slug if data.slug else generate_slug(data.display_name or project.get("name", ""))
    slug = await ensure_unique_slug("cms_public_projects", slug)
    
    public_doc = {
        "id": public_id,
        "project_master_id": data.project_master_id,
        "slug": slug,
        "display_name": data.display_name or project.get("name"),
        "tagline": data.tagline,
        "short_description": data.short_description or project.get("description"),
        "full_description": data.full_description,
        "highlights": data.highlights,
        # Copy safe fields from master
        "location": project.get("location"),
        "district": project.get("district"),
        "city": project.get("city"),
        "developer_name": project.get("developer_name"),
        "project_type": project.get("project_type"),
        "total_units": project.get("total_units"),
        "handover_date": project.get("handover_date"),
        "progress_percentage": project.get("progress_percentage"),
        "legal_status": project.get("legal_status"),
        # Public pricing
        "show_price": data.show_price,
        "price_display": data.price_display,
        "price_from": data.price_from or project.get("price_from"),
        "price_to": data.price_to or project.get("price_to"),
        # Media
        "hero_image": data.hero_image or (project.get("images", [None])[0] if project.get("images") else None),
        "gallery": data.gallery or project.get("images", []),
        "video_url": data.video_url,
        "virtual_tour_url": data.virtual_tour_url,
        "brochure_url": data.brochure_url,
        # Amenities
        "amenities": data.amenities or project.get("amenities", []),
        "nearby_facilities": data.nearby_facilities,
        # SEO & Page
        "seo": data.seo.model_dump() if data.seo else None,
        "template": data.template,
        "sections": [s.model_dump() for s in data.sections] if data.sections else [],
        "ctas": [c.model_dump() for c in data.ctas] if data.ctas else [],
        "form_id": data.form_id,
        # Visibility
        "visibility": data.visibility,
        "show_available_units": data.show_available_units,
        "show_progress": data.show_progress,
        "show_handover_date": data.show_handover_date,
        "available_units": None,  # Calculated
        # Status
        "is_featured": data.is_featured,
        "is_hot": data.is_hot,
        "status": data.status,
        "scheduled_at": data.scheduled_at,
        "published_at": now if data.status == "published" else None,
        # Analytics
        "views": 0,
        "inquiries": 0,
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_public_projects.insert_one(public_doc)
    public_doc.pop("_id", None)
    return PublicProjectResponse(**public_doc)


@cms_router.get("/public-projects", response_model=List[PublicProjectResponse])
async def list_public_projects(
    status: Optional[str] = None,
    is_featured: Optional[bool] = None,
    is_hot: Optional[bool] = None,
    city: Optional[str] = None,
    district: Optional[str] = None,
    project_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all public projects"""
    query = {}
    if status:
        query["status"] = status
    if is_featured is not None:
        query["is_featured"] = is_featured
    if is_hot is not None:
        query["is_hot"] = is_hot
    if city:
        query["city"] = city
    if district:
        query["district"] = district
    if project_type:
        query["project_type"] = project_type
    if search:
        query["$or"] = [
            {"display_name": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    projects = await db.cms_public_projects.find(query, {"_id": 0}).sort("is_featured", -1).skip(skip).limit(limit).to_list(limit)
    return [PublicProjectResponse(**p) for p in projects]


@cms_router.get("/public-projects/{project_id}", response_model=PublicProjectResponse)
async def get_public_project(project_id: str):
    """Get a public project by ID"""
    project = await db.cms_public_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Public project not found")
    return PublicProjectResponse(**project)


@cms_router.get("/public-projects/by-slug/{slug}", response_model=PublicProjectResponse)
async def get_public_project_by_slug(slug: str, increment_view: bool = False):
    """Get a public project by slug (public endpoint)"""
    project = await db.cms_public_projects.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Public project not found")
    
    if increment_view:
        await db.cms_public_projects.update_one({"id": project["id"]}, {"$inc": {"views": 1}})
        project["views"] += 1
    
    return PublicProjectResponse(**project)


@cms_router.put("/public-projects/{project_id}", response_model=PublicProjectResponse)
async def update_public_project(project_id: str, data: PublicProjectUpdate):
    """Update a public project"""
    project = await db.cms_public_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Public project not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "seo" in update_data and update_data["seo"]:
        update_data["seo"] = update_data["seo"]
    if "sections" in update_data:
        update_data["sections"] = [s if isinstance(s, dict) else s.model_dump() for s in update_data["sections"]]
    if "ctas" in update_data:
        update_data["ctas"] = [c if isinstance(c, dict) else c.model_dump() for c in update_data["ctas"]]
    
    if "slug" in update_data:
        update_data["slug"] = await ensure_unique_slug("cms_public_projects", update_data["slug"], project_id)
    elif "display_name" in update_data and not data.slug:
        update_data["slug"] = await ensure_unique_slug("cms_public_projects", generate_slug(update_data["display_name"]), project_id)
    
    if update_data.get("status") == "published" and project.get("status") != "published":
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_public_projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated = await db.cms_public_projects.find_one({"id": project_id}, {"_id": 0})
    return PublicProjectResponse(**updated)


@cms_router.delete("/public-projects/{project_id}")
async def delete_public_project(project_id: str):
    """Delete a public project"""
    result = await db.cms_public_projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Public project not found")
    return {"success": True, "message": "Public project deleted"}


@cms_router.post("/public-projects/{project_id}/sync-from-master")
async def sync_public_project(project_id: str):
    """Sync public project with master project data"""
    public_project = await db.cms_public_projects.find_one({"id": project_id})
    if not public_project:
        raise HTTPException(status_code=404, detail="Public project not found")
    
    master = await db.projects_master.find_one({"id": public_project["project_master_id"]}, {"_id": 0})
    if not master:
        raise HTTPException(status_code=404, detail="Master project not found")
    
    # Sync safe fields
    update_data = {
        "location": master.get("location"),
        "district": master.get("district"),
        "city": master.get("city"),
        "developer_name": master.get("developer_name"),
        "project_type": master.get("project_type"),
        "total_units": master.get("total_units"),
        "handover_date": master.get("handover_date"),
        "progress_percentage": master.get("progress_percentage"),
        "legal_status": master.get("legal_status"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cms_public_projects.update_one({"id": project_id}, {"$set": update_data})
    return {"success": True, "message": "Synced from master"}


# ==================== TESTIMONIALS ENDPOINTS ====================

@cms_router.post("/testimonials", response_model=TestimonialResponse)
async def create_testimonial(data: TestimonialCreate):
    """Create a new testimonial"""
    now = datetime.now(timezone.utc).isoformat()
    testimonial_id = str(uuid.uuid4())
    
    testimonial_doc = {
        "id": testimonial_id,
        **data.model_dump(),
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_testimonials.insert_one(testimonial_doc)
    testimonial_doc.pop("_id", None)
    return TestimonialResponse(**testimonial_doc)


@cms_router.get("/testimonials", response_model=List[TestimonialResponse])
async def list_testimonials(
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    is_active: Optional[bool] = None,
    project_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all testimonials"""
    query = {}
    if category:
        query["category"] = category
    if is_featured is not None:
        query["is_featured"] = is_featured
    if is_active is not None:
        query["is_active"] = is_active
    if project_id:
        query["project_id"] = project_id
    
    testimonials = await db.cms_testimonials.find(query, {"_id": 0}).sort("order", 1).skip(skip).limit(limit).to_list(limit)
    return [TestimonialResponse(**t) for t in testimonials]


@cms_router.get("/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def get_testimonial(testimonial_id: str):
    """Get a testimonial by ID"""
    testimonial = await db.cms_testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return TestimonialResponse(**testimonial)


@cms_router.put("/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(testimonial_id: str, data: TestimonialUpdate):
    """Update a testimonial"""
    testimonial = await db.cms_testimonials.find_one({"id": testimonial_id})
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_testimonials.update_one({"id": testimonial_id}, {"$set": update_data})
    
    updated = await db.cms_testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    return TestimonialResponse(**updated)


@cms_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str):
    """Delete a testimonial"""
    result = await db.cms_testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"success": True, "message": "Testimonial deleted"}


# ==================== PARTNERS ENDPOINTS ====================

@cms_router.post("/partners", response_model=PartnerResponse)
async def create_partner(data: PartnerCreate):
    """Create a new partner"""
    now = datetime.now(timezone.utc).isoformat()
    partner_id = str(uuid.uuid4())
    
    partner_doc = {
        "id": partner_id,
        **data.model_dump(),
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_partners.insert_one(partner_doc)
    partner_doc.pop("_id", None)
    return PartnerResponse(**partner_doc)


@cms_router.get("/partners", response_model=List[PartnerResponse])
async def list_partners(
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all partners"""
    query = {}
    if category:
        query["category"] = category
    if is_featured is not None:
        query["is_featured"] = is_featured
    if is_active is not None:
        query["is_active"] = is_active
    
    partners = await db.cms_partners.find(query, {"_id": 0}).sort("order", 1).skip(skip).limit(limit).to_list(limit)
    return [PartnerResponse(**p) for p in partners]


@cms_router.get("/partners/{partner_id}", response_model=PartnerResponse)
async def get_partner(partner_id: str):
    """Get a partner by ID"""
    partner = await db.cms_partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return PartnerResponse(**partner)


@cms_router.put("/partners/{partner_id}", response_model=PartnerResponse)
async def update_partner(partner_id: str, data: PartnerUpdate):
    """Update a partner"""
    partner = await db.cms_partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_partners.update_one({"id": partner_id}, {"$set": update_data})
    
    updated = await db.cms_partners.find_one({"id": partner_id}, {"_id": 0})
    return PartnerResponse(**updated)


@cms_router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str):
    """Delete a partner"""
    result = await db.cms_partners.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    return {"success": True, "message": "Partner deleted"}


# ==================== CAREERS ENDPOINTS ====================

@cms_router.post("/careers", response_model=CareerResponse)
async def create_career(data: CareerCreate):
    """Create a new career posting"""
    now = datetime.now(timezone.utc).isoformat()
    career_id = str(uuid.uuid4())
    
    slug = data.slug if data.slug else generate_slug(data.title)
    slug = await ensure_unique_slug("cms_careers", slug)
    
    career_doc = {
        "id": career_id,
        **data.model_dump(),
        "slug": slug,
        "seo": data.seo.model_dump() if data.seo else None,
        "applications_count": 0,
        "views": 0,
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_careers.insert_one(career_doc)
    career_doc.pop("_id", None)
    return CareerResponse(**career_doc)


@cms_router.get("/careers", response_model=List[CareerResponse])
async def list_careers(
    department: Optional[str] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_hot: Optional[bool] = None,
    is_urgent: Optional[bool] = None,
    is_remote: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all career postings"""
    query = {}
    if department:
        query["department"] = department
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if employment_type:
        query["employment_type"] = employment_type
    if is_active is not None:
        query["is_active"] = is_active
    if is_hot is not None:
        query["is_hot"] = is_hot
    if is_urgent is not None:
        query["is_urgent"] = is_urgent
    if is_remote is not None:
        query["is_remote"] = is_remote
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    careers = await db.cms_careers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [CareerResponse(**c) for c in careers]


@cms_router.get("/careers/{career_id}", response_model=CareerResponse)
async def get_career(career_id: str):
    """Get a career posting by ID"""
    career = await db.cms_careers.find_one({"id": career_id}, {"_id": 0})
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    return CareerResponse(**career)


@cms_router.get("/careers/by-slug/{slug}", response_model=CareerResponse)
async def get_career_by_slug(slug: str, increment_view: bool = False):
    """Get a career posting by slug (public endpoint)"""
    career = await db.cms_careers.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    
    if increment_view:
        await db.cms_careers.update_one({"id": career["id"]}, {"$inc": {"views": 1}})
        career["views"] += 1
    
    return CareerResponse(**career)


@cms_router.put("/careers/{career_id}", response_model=CareerResponse)
async def update_career(career_id: str, data: CareerUpdate):
    """Update a career posting"""
    career = await db.cms_careers.find_one({"id": career_id})
    if not career:
        raise HTTPException(status_code=404, detail="Career not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "seo" in update_data and update_data["seo"]:
        update_data["seo"] = update_data["seo"]
    
    if "slug" in update_data:
        update_data["slug"] = await ensure_unique_slug("cms_careers", update_data["slug"], career_id)
    elif "title" in update_data and not data.slug:
        update_data["slug"] = await ensure_unique_slug("cms_careers", generate_slug(update_data["title"]), career_id)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_careers.update_one({"id": career_id}, {"$set": update_data})
    
    updated = await db.cms_careers.find_one({"id": career_id}, {"_id": 0})
    return CareerResponse(**updated)


@cms_router.delete("/careers/{career_id}")
async def delete_career(career_id: str):
    """Delete a career posting"""
    result = await db.cms_careers.delete_one({"id": career_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Career not found")
    return {"success": True, "message": "Career deleted"}


# ==================== MEDIA ASSETS ENDPOINTS ====================

@cms_router.post("/media-assets", response_model=MediaAssetResponse)
async def create_media_asset(data: MediaAssetCreate):
    """Create a new media asset"""
    now = datetime.now(timezone.utc).isoformat()
    asset_id = str(uuid.uuid4())
    
    asset_doc = {
        "id": asset_id,
        **data.model_dump(),
        "usage_count": 0,
        "created_by": "system",
        "created_at": now
    }
    
    await db.cms_media_assets.insert_one(asset_doc)
    asset_doc.pop("_id", None)
    return MediaAssetResponse(**asset_doc)


@cms_router.get("/media-assets", response_model=List[MediaAssetResponse])
async def list_media_assets(
    asset_type: Optional[str] = None,
    project_id: Optional[str] = None,
    folder: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all media assets"""
    query = {}
    if asset_type:
        query["asset_type"] = asset_type
    if project_id:
        query["project_id"] = project_id
    if folder:
        query["folder"] = folder
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"caption": {"$regex": search, "$options": "i"}}
        ]
    
    assets = await db.cms_media_assets.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [MediaAssetResponse(**a) for a in assets]


@cms_router.get("/media-assets/{asset_id}", response_model=MediaAssetResponse)
async def get_media_asset(asset_id: str):
    """Get a media asset by ID"""
    asset = await db.cms_media_assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Media asset not found")
    return MediaAssetResponse(**asset)


@cms_router.put("/media-assets/{asset_id}", response_model=MediaAssetResponse)
async def update_media_asset(asset_id: str, data: MediaAssetUpdate):
    """Update a media asset"""
    asset = await db.cms_media_assets.find_one({"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Media asset not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    await db.cms_media_assets.update_one({"id": asset_id}, {"$set": update_data})
    
    updated = await db.cms_media_assets.find_one({"id": asset_id}, {"_id": 0})
    return MediaAssetResponse(**updated)


@cms_router.delete("/media-assets/{asset_id}")
async def delete_media_asset(asset_id: str):
    """Delete a media asset"""
    result = await db.cms_media_assets.delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media asset not found")
    return {"success": True, "message": "Media asset deleted"}


# ==================== FAQ ENDPOINTS ====================

@cms_router.post("/faqs", response_model=FAQItemResponse)
async def create_faq(data: FAQItemCreate):
    """Create a new FAQ item"""
    now = datetime.now(timezone.utc).isoformat()
    faq_id = str(uuid.uuid4())
    
    faq_doc = {
        "id": faq_id,
        **data.model_dump(),
        "views": 0,
        "helpful_count": 0,
        "created_by": "system",
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_faqs.insert_one(faq_doc)
    faq_doc.pop("_id", None)
    return FAQItemResponse(**faq_doc)


@cms_router.get("/faqs", response_model=List[FAQItemResponse])
async def list_faqs(
    category: Optional[str] = None,
    page_id: Optional[str] = None,
    project_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all FAQ items"""
    query = {}
    if category:
        query["category"] = category
    if page_id:
        query["page_id"] = page_id
    if project_id:
        query["project_id"] = project_id
    if is_active is not None:
        query["is_active"] = is_active
    if search:
        query["$or"] = [
            {"question": {"$regex": search, "$options": "i"}},
            {"answer": {"$regex": search, "$options": "i"}}
        ]
    
    faqs = await db.cms_faqs.find(query, {"_id": 0}).sort("order", 1).skip(skip).limit(limit).to_list(limit)
    return [FAQItemResponse(**f) for f in faqs]


@cms_router.get("/faqs/{faq_id}", response_model=FAQItemResponse)
async def get_faq(faq_id: str):
    """Get a FAQ item by ID"""
    faq = await db.cms_faqs.find_one({"id": faq_id}, {"_id": 0})
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return FAQItemResponse(**faq)


@cms_router.put("/faqs/{faq_id}", response_model=FAQItemResponse)
async def update_faq(faq_id: str, data: FAQItemUpdate):
    """Update a FAQ item"""
    faq = await db.cms_faqs.find_one({"id": faq_id})
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cms_faqs.update_one({"id": faq_id}, {"$set": update_data})
    
    updated = await db.cms_faqs.find_one({"id": faq_id}, {"_id": 0})
    return FAQItemResponse(**updated)


@cms_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str):
    """Delete a FAQ item"""
    result = await db.cms_faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True, "message": "FAQ deleted"}


@cms_router.post("/faqs/{faq_id}/helpful")
async def mark_faq_helpful(faq_id: str):
    """Mark a FAQ as helpful"""
    faq = await db.cms_faqs.find_one({"id": faq_id})
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    await db.cms_faqs.update_one({"id": faq_id}, {"$inc": {"helpful_count": 1}})
    return {"success": True}


# ==================== SITEMAP ENDPOINTS ====================

@cms_router.get("/sitemap", response_model=SitemapResponse)
async def generate_sitemap(base_url: str = "https://prohouzing.vn"):
    """Generate sitemap for all public content"""
    now = datetime.now(timezone.utc).isoformat()
    entries = []
    
    # Homepage
    entries.append(SitemapEntry(
        loc=base_url,
        lastmod=now,
        changefreq="daily",
        priority=1.0
    ))
    
    # Static pages
    pages = await db.cms_pages.find({"status": "published"}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(100)
    for page in pages:
        entries.append(SitemapEntry(
            loc=f"{base_url}/{page['slug']}",
            lastmod=page.get("updated_at", now),
            changefreq="weekly",
            priority=0.8
        ))
    
    # Articles
    articles = await db.cms_articles.find({"status": "published"}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    for article in articles:
        entries.append(SitemapEntry(
            loc=f"{base_url}/tin-tuc/{article['slug']}",
            lastmod=article.get("updated_at", now),
            changefreq="monthly",
            priority=0.6
        ))
    
    # Public projects
    projects = await db.cms_public_projects.find({"status": "published"}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(200)
    for project in projects:
        entries.append(SitemapEntry(
            loc=f"{base_url}/du-an/{project['slug']}",
            lastmod=project.get("updated_at", now),
            changefreq="weekly",
            priority=0.9
        ))
    
    # Landing pages
    landing_pages = await db.cms_landing_pages.find({"status": "published"}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(100)
    for lp in landing_pages:
        entries.append(SitemapEntry(
            loc=f"{base_url}/lp/{lp['slug']}",
            lastmod=lp.get("updated_at", now),
            changefreq="weekly",
            priority=0.7
        ))
    
    # Careers
    careers = await db.cms_careers.find({"is_active": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(50)
    for career in careers:
        entries.append(SitemapEntry(
            loc=f"{base_url}/tuyen-dung/{career['slug']}",
            lastmod=career.get("updated_at", now),
            changefreq="weekly",
            priority=0.5
        ))
    
    return SitemapResponse(entries=entries, generated_at=now)


# ==================== MENU ENDPOINTS ====================

@cms_router.post("/menu-items", response_model=MenuItemResponse)
async def create_menu_item(data: MenuItemCreate):
    """Create a new menu item"""
    now = datetime.now(timezone.utc).isoformat()
    item_id = str(uuid.uuid4())
    
    item_doc = {
        "id": item_id,
        **data.model_dump(),
        "created_at": now
    }
    
    await db.cms_menu_items.insert_one(item_doc)
    item_doc.pop("_id", None)
    return MenuItemResponse(**item_doc, children=[])


@cms_router.get("/menu-items")
async def list_menu_items(visibility: Optional[str] = None):
    """List all menu items as tree structure"""
    query = {"is_active": True}
    if visibility:
        query["visibility"] = visibility
    
    items = await db.cms_menu_items.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Build tree
    item_map = {item["id"]: {**item, "children": []} for item in items}
    root_items = []
    
    for item in items:
        if item.get("parent_id") and item["parent_id"] in item_map:
            item_map[item["parent_id"]]["children"].append(item_map[item["id"]])
        else:
            root_items.append(item_map[item["id"]])
    
    return root_items


@cms_router.put("/menu-items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(item_id: str, data: dict):
    """Update a menu item"""
    item = await db.cms_menu_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    await db.cms_menu_items.update_one({"id": item_id}, {"$set": data})
    
    updated = await db.cms_menu_items.find_one({"id": item_id}, {"_id": 0})
    return MenuItemResponse(**updated, children=[])


@cms_router.delete("/menu-items/{item_id}")
async def delete_menu_item(item_id: str):
    """Delete a menu item"""
    result = await db.cms_menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"success": True, "message": "Menu item deleted"}


# ==================== SEED DATA ENDPOINT ====================

@cms_router.post("/seed")
async def seed_cms_data():
    """Seed initial CMS data"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Seed some static pages
    pages_data = [
        {
            "id": str(uuid.uuid4()),
            "title": "Giới thiệu",
            "page_type": "about",
            "slug": "gioi-thieu",
            "content": "<h1>Về ProHouzing</h1><p>ProHouzing là nền tảng phân phối bất động sản sơ cấp hàng đầu Việt Nam...</p>",
            "excerpt": "Nền tảng phân phối BĐS sơ cấp hàng đầu Việt Nam",
            "template": "about",
            "is_in_menu": True,
            "menu_order": 1,
            "visibility": "public",
            "status": "published",
            "published_at": now,
            "views": 0,
            "created_by": "system",
            "created_at": now,
            "updated_at": now
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Liên hệ",
            "page_type": "contact",
            "slug": "lien-he",
            "content": "<h1>Liên hệ với chúng tôi</h1><p>Hotline: 1900 1234</p>",
            "excerpt": "Liên hệ ProHouzing",
            "template": "contact",
            "is_in_menu": True,
            "menu_order": 5,
            "visibility": "public",
            "status": "published",
            "published_at": now,
            "views": 0,
            "created_by": "system",
            "created_at": now,
            "updated_at": now
        }
    ]
    
    # Clear and insert
    await db.cms_pages.delete_many({})
    if pages_data:
        await db.cms_pages.insert_many(pages_data)
    
    return {
        "success": True,
        "message": "CMS data seeded successfully",
        "counts": {
            "pages": len(pages_data)
        }
    }
