"""
ProHouzing CMS Models - Prompt 14/20
Website CMS / Landing Page / SEO Engine

Canonical Pydantic models for public content management

INTEGRATION WITH MARKETING ENGINE:
- CMS is the SINGLE SOURCE OF TRUTH for all public content
- Every Article/Landing Page auto-creates ContentAsset in Marketing Engine
- Forms are linked from Marketing Engine (not duplicated)
- Full UTM tracking and attribution on every page view & form submit
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== VISITOR TRACKING MODEL ====================

class VisitorTrackingData(BaseModel):
    """Visitor tracking data for attribution"""
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None  # Cookie-based
    # UTM params
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    # Referrer
    referrer_url: Optional[str] = None
    referrer_domain: Optional[str] = None
    # Landing
    landing_page_id: Optional[str] = None
    landing_page_url: Optional[str] = None
    landing_page_slug: Optional[str] = None
    # Device
    device_type: Optional[str] = None  # mobile, tablet, desktop
    browser: Optional[str] = None
    os: Optional[str] = None
    ip_address: Optional[str] = None
    # Timestamp
    first_visit_at: Optional[str] = None
    last_activity_at: Optional[str] = None


class PageViewCreate(BaseModel):
    """Track page view with full attribution"""
    page_id: str
    page_type: str  # article, landing_page, public_project, page
    slug: str
    tracking: VisitorTrackingData


class PageViewResponse(BaseModel):
    """Page view tracking response"""
    id: str
    page_id: str
    page_type: str
    slug: str
    content_asset_id: Optional[str] = None
    campaign_id: Optional[str] = None
    tracking: VisitorTrackingData
    created_at: str


# ==================== SEO METADATA MODEL ====================

class SEOMetadata(BaseModel):
    """Canonical SEO metadata for all public content"""
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    canonical_url: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: str = "website"
    twitter_card: str = "summary_large_image"
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    robots: str = "index, follow"
    schema_type: Optional[str] = None
    schema_data: Optional[Dict[str, Any]] = None
    keywords: List[str] = []


# ==================== CTA (CALL TO ACTION) MODEL ====================

class CTAButton(BaseModel):
    """Call-to-Action button configuration"""
    id: Optional[str] = None
    label: str
    cta_type: str  # phone, form, link, download, chat, schedule
    action_value: str  # Phone number, form ID, URL, etc.
    style: str = "primary"  # primary, secondary, outline, ghost
    icon: Optional[str] = None
    position: str = "inline"  # inline, sticky, floating
    is_active: bool = True
    tracking_id: Optional[str] = None  # For analytics


# ==================== CONTENT SECTION MODEL ====================

class ContentSection(BaseModel):
    """Reusable content section for pages"""
    id: Optional[str] = None
    section_type: str  # hero, text, gallery, cta, form, testimonials, faq, etc.
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None  # HTML or Markdown
    media: List[str] = []  # Image/video URLs
    ctas: List[CTAButton] = []
    settings: Dict[str, Any] = {}  # Section-specific settings
    order: int = 0
    is_visible: bool = True


# ==================== WEBSITE PAGE MODELS ====================

class WebsitePageCreate(BaseModel):
    """Create a static website page"""
    title: str
    page_type: str = "static"  # static page type: about, contact, faq, etc.
    slug: Optional[str] = None
    content: Optional[str] = None  # Main HTML content
    excerpt: Optional[str] = None
    sections: List[ContentSection] = []
    featured_image: Optional[str] = None
    template: str = "default"
    seo: Optional[SEOMetadata] = None
    ctas: List[CTAButton] = []
    form_id: Optional[str] = None  # Linked form for lead capture
    is_in_menu: bool = False
    menu_order: int = 0
    parent_page_id: Optional[str] = None
    visibility: str = "public"
    status: str = "draft"
    scheduled_at: Optional[str] = None


class WebsitePageUpdate(BaseModel):
    """Update a website page"""
    title: Optional[str] = None
    page_type: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    sections: Optional[List[ContentSection]] = None
    featured_image: Optional[str] = None
    template: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    ctas: Optional[List[CTAButton]] = None
    form_id: Optional[str] = None
    is_in_menu: Optional[bool] = None
    menu_order: Optional[int] = None
    parent_page_id: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None


class WebsitePageResponse(BaseModel):
    """Website page response"""
    id: str
    title: str
    page_type: str
    slug: str
    content: Optional[str] = None
    excerpt: Optional[str] = None
    sections: List[ContentSection] = []
    featured_image: Optional[str] = None
    template: str
    seo: Optional[SEOMetadata] = None
    ctas: List[CTAButton] = []
    form_id: Optional[str] = None
    is_in_menu: bool
    menu_order: int
    parent_page_id: Optional[str] = None
    visibility: str
    status: str
    scheduled_at: Optional[str] = None
    published_at: Optional[str] = None
    views: int = 0
    created_by: str
    created_at: str
    updated_at: str


# ==================== ARTICLE MODELS ====================

class ArticleCreate(BaseModel):
    """Create a news/blog article - AUTO-CREATES ContentAsset in Marketing Engine"""
    title: str
    slug: Optional[str] = None
    excerpt: str
    content: str
    category: str = "market"
    tags: List[str] = []
    featured_image: Optional[str] = None
    gallery: List[str] = []
    author_id: Optional[str] = None
    author_name: str = "Admin"
    seo: Optional[SEOMetadata] = None
    related_project_ids: List[str] = []  # Link to projects
    # MARKETING ENGINE INTEGRATION
    campaign_id: Optional[str] = None  # Link to Marketing Campaign
    form_id: Optional[str] = None  # Link to Marketing Form for lead capture
    ctas: List[CTAButton] = []  # CTA buttons with tracking
    # UTM defaults
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    is_featured: bool = False
    is_pinned: bool = False
    allow_comments: bool = True
    status: str = "draft"
    scheduled_at: Optional[str] = None


class ArticleUpdate(BaseModel):
    """Update an article"""
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    featured_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    related_project_ids: Optional[List[str]] = None
    campaign_id: Optional[str] = None
    form_id: Optional[str] = None
    ctas: Optional[List[CTAButton]] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    is_featured: Optional[bool] = None
    is_pinned: Optional[bool] = None
    allow_comments: Optional[bool] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None


class ArticleResponse(BaseModel):
    """Article response with Marketing Engine links"""
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    tags: List[str] = []
    featured_image: Optional[str] = None
    gallery: List[str] = []
    author_id: Optional[str] = None
    author_name: str
    seo: Optional[SEOMetadata] = None
    related_project_ids: List[str] = []
    # MARKETING ENGINE INTEGRATION
    content_asset_id: Optional[str] = None  # Auto-created in Marketing Engine
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    form_id: Optional[str] = None
    form_name: Optional[str] = None
    ctas: List[CTAButton] = []
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    is_featured: bool
    is_pinned: bool
    allow_comments: bool
    status: str
    scheduled_at: Optional[str] = None
    published_at: Optional[str] = None
    views: int = 0
    unique_visitors: int = 0
    form_submissions: int = 0
    leads_generated: int = 0
    likes: int = 0
    shares: int = 0
    comments_count: int = 0
    read_time_minutes: int = 0
    created_by: str
    created_at: str
    updated_at: str


# ==================== LANDING PAGE MODELS ====================

class LandingPageCreate(BaseModel):
    """Create a landing page"""
    title: str
    slug: Optional[str] = None
    landing_type: str = "lead_capture"  # project_promo, event, lead_capture, etc.
    headline: str
    subheadline: Optional[str] = None
    hero_image: Optional[str] = None
    hero_video: Optional[str] = None
    sections: List[ContentSection] = []
    ctas: List[CTAButton] = []
    form_id: Optional[str] = None  # Primary lead capture form
    seo: Optional[SEOMetadata] = None
    # Campaign linkage
    campaign_id: Optional[str] = None
    source_channel: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    # Project linkage
    project_id: Optional[str] = None
    project_ids: List[str] = []  # For comparison pages
    # Settings
    template: str = "hero_cta"
    theme: str = "light"
    hide_navigation: bool = True
    show_chat_widget: bool = True
    tracking_pixel: Optional[str] = None
    conversion_goal: Optional[str] = None
    status: str = "draft"
    scheduled_at: Optional[str] = None
    expires_at: Optional[str] = None


class LandingPageUpdate(BaseModel):
    """Update a landing page"""
    title: Optional[str] = None
    slug: Optional[str] = None
    landing_type: Optional[str] = None
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    hero_image: Optional[str] = None
    hero_video: Optional[str] = None
    sections: Optional[List[ContentSection]] = None
    ctas: Optional[List[CTAButton]] = None
    form_id: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    campaign_id: Optional[str] = None
    source_channel: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    project_id: Optional[str] = None
    project_ids: Optional[List[str]] = None
    template: Optional[str] = None
    theme: Optional[str] = None
    hide_navigation: Optional[bool] = None
    show_chat_widget: Optional[bool] = None
    tracking_pixel: Optional[str] = None
    conversion_goal: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None
    expires_at: Optional[str] = None


class LandingPageResponse(BaseModel):
    """Landing page response with FULL Marketing Engine integration"""
    id: str
    title: str
    slug: str
    landing_type: str
    headline: str
    subheadline: Optional[str] = None
    hero_image: Optional[str] = None
    hero_video: Optional[str] = None
    sections: List[ContentSection] = []
    ctas: List[CTAButton] = []
    # MARKETING ENGINE INTEGRATION
    content_asset_id: Optional[str] = None  # Auto-created ContentAsset
    form_id: Optional[str] = None  # Marketing Engine Form
    form_name: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    source_channel: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    project_id: Optional[str] = None
    project_ids: List[str] = []
    template: str
    theme: str
    hide_navigation: bool
    show_chat_widget: bool
    tracking_pixel: Optional[str] = None
    conversion_goal: Optional[str] = None
    status: str
    scheduled_at: Optional[str] = None
    expires_at: Optional[str] = None
    published_at: Optional[str] = None
    # Analytics - FULL ATTRIBUTION TRACKING
    views: int = 0
    unique_visitors: int = 0
    form_submissions: int = 0
    leads_generated: int = 0  # Leads created from this page
    conversion_rate: float = 0.0
    avg_time_on_page: int = 0
    bounce_rate: float = 0.0
    created_by: str
    created_at: str
    updated_at: str


# ==================== PUBLIC PROJECT MODELS ====================

class PublicProjectCreate(BaseModel):
    """Create public projection of a project"""
    project_master_id: str  # Link to internal project
    slug: Optional[str] = None
    display_name: Optional[str] = None  # Override internal name
    tagline: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    highlights: List[str] = []
    # Public pricing (configurable visibility)
    show_price: bool = True
    price_display: Optional[str] = None  # "Từ 2.5 tỷ" or actual range
    price_from: Optional[float] = None
    price_to: Optional[float] = None
    # Public images/media
    hero_image: Optional[str] = None
    gallery: List[str] = []
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    brochure_url: Optional[str] = None
    # Public amenities
    amenities: List[str] = []
    nearby_facilities: List[Dict[str, Any]] = []
    # SEO
    seo: Optional[SEOMetadata] = None
    # Page configuration
    template: str = "project_full"
    sections: List[ContentSection] = []
    ctas: List[CTAButton] = []
    form_id: Optional[str] = None
    # Visibility settings
    visibility: str = "public"
    show_available_units: bool = False
    show_progress: bool = True
    show_handover_date: bool = True
    # Status
    is_featured: bool = False
    is_hot: bool = False
    status: str = "draft"
    scheduled_at: Optional[str] = None


class PublicProjectUpdate(BaseModel):
    """Update public project"""
    slug: Optional[str] = None
    display_name: Optional[str] = None
    tagline: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    highlights: Optional[List[str]] = None
    show_price: Optional[bool] = None
    price_display: Optional[str] = None
    price_from: Optional[float] = None
    price_to: Optional[float] = None
    hero_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    brochure_url: Optional[str] = None
    amenities: Optional[List[str]] = None
    nearby_facilities: Optional[List[Dict[str, Any]]] = None
    seo: Optional[SEOMetadata] = None
    template: Optional[str] = None
    sections: Optional[List[ContentSection]] = None
    ctas: Optional[List[CTAButton]] = None
    form_id: Optional[str] = None
    visibility: Optional[str] = None
    show_available_units: Optional[bool] = None
    show_progress: Optional[bool] = None
    show_handover_date: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_hot: Optional[bool] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None


class PublicProjectResponse(BaseModel):
    """Public project response"""
    id: str
    project_master_id: str
    slug: str
    display_name: str
    tagline: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    highlights: List[str] = []
    # Source data from master (read-only)
    location: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    developer_name: Optional[str] = None
    project_type: Optional[str] = None
    total_units: Optional[int] = None
    handover_date: Optional[str] = None
    progress_percentage: Optional[int] = None
    legal_status: Optional[str] = None
    # Pricing
    show_price: bool
    price_display: Optional[str] = None
    price_from: Optional[float] = None
    price_to: Optional[float] = None
    # Media
    hero_image: Optional[str] = None
    gallery: List[str] = []
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    brochure_url: Optional[str] = None
    # Amenities
    amenities: List[str] = []
    nearby_facilities: List[Dict[str, Any]] = []
    # SEO & Page
    seo: Optional[SEOMetadata] = None
    template: str
    sections: List[ContentSection] = []
    ctas: List[CTAButton] = []
    form_id: Optional[str] = None
    # Visibility
    visibility: str
    show_available_units: bool
    show_progress: bool
    show_handover_date: bool
    available_units: Optional[int] = None
    # Status
    is_featured: bool
    is_hot: bool
    status: str
    scheduled_at: Optional[str] = None
    published_at: Optional[str] = None
    # Analytics
    views: int = 0
    inquiries: int = 0
    created_by: str
    created_at: str
    updated_at: str


# ==================== TESTIMONIAL MODELS ====================

class TestimonialCreate(BaseModel):
    """Create a testimonial"""
    name: str
    role: Optional[str] = None  # "Khách mua căn hộ", "Nhà đầu tư"
    avatar: Optional[str] = None
    content: str
    rating: int = 5
    category: str = "buyer"  # buyer, investor, ctv, agency
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    order: int = 0


class TestimonialUpdate(BaseModel):
    """Update a testimonial"""
    name: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    content: Optional[str] = None
    rating: Optional[int] = None
    category: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


class TestimonialResponse(BaseModel):
    """Testimonial response"""
    id: str
    name: str
    role: Optional[str] = None
    avatar: Optional[str] = None
    content: str
    rating: int
    category: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: bool
    is_active: bool
    order: int
    created_by: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


# ==================== PARTNER MODELS ====================

class PartnerCreate(BaseModel):
    """Create a partner"""
    name: str
    logo: str
    website: Optional[str] = None
    description: Optional[str] = None
    category: str = "developer"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    order: int = 0


class PartnerUpdate(BaseModel):
    """Update a partner"""
    name: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


class PartnerResponse(BaseModel):
    """Partner response"""
    id: str
    name: str
    logo: str
    website: Optional[str] = None
    description: Optional[str] = None
    category: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_featured: bool
    is_active: bool
    order: int
    created_by: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


# ==================== CAREER MODELS (ENHANCED) ====================

class CareerCreate(BaseModel):
    """Create a career posting"""
    title: str
    slug: Optional[str] = None
    department: str
    location: str
    employment_type: str = "full-time"  # full-time, part-time, contract, intern
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: str = "Thỏa thuận"
    description: str
    requirements: List[str] = []
    benefits: List[str] = []
    responsibilities: List[str] = []
    qualifications: List[str] = []
    skills_required: List[str] = []
    openings: int = 1
    deadline: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    is_hot: bool = False
    is_urgent: bool = False
    is_remote: bool = False
    is_active: bool = True


class CareerUpdate(BaseModel):
    """Update a career posting"""
    title: Optional[str] = None
    slug: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    skills_required: Optional[List[str]] = None
    openings: Optional[int] = None
    deadline: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    is_hot: Optional[bool] = None
    is_urgent: Optional[bool] = None
    is_remote: Optional[bool] = None
    is_active: Optional[bool] = None


class CareerResponse(BaseModel):
    """Career response"""
    id: str
    title: str
    slug: str
    department: str
    location: str
    employment_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_display: str
    description: str
    requirements: List[str] = []
    benefits: List[str] = []
    responsibilities: List[str] = []
    qualifications: List[str] = []
    skills_required: List[str] = []
    openings: int
    deadline: Optional[str] = None
    seo: Optional[SEOMetadata] = None
    is_hot: bool
    is_urgent: bool
    is_remote: bool
    is_active: bool
    applications_count: int = 0
    views: int = 0
    created_by: Optional[str] = None
    created_at: str
    updated_at: str


# ==================== MEDIA ASSET MODELS ====================

class MediaAssetCreate(BaseModel):
    """Create a media asset"""
    name: str
    asset_type: str  # image, video, document, brochure, floor_plan, virtual_tour
    url: str
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None  # bytes
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[int] = None  # seconds for video
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    tags: List[str] = []
    project_id: Optional[str] = None
    folder: Optional[str] = None


class MediaAssetUpdate(BaseModel):
    """Update a media asset"""
    name: Optional[str] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    folder: Optional[str] = None


class MediaAssetResponse(BaseModel):
    """Media asset response"""
    id: str
    name: str
    asset_type: str
    url: str
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[int] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    tags: List[str] = []
    project_id: Optional[str] = None
    folder: Optional[str] = None
    usage_count: int = 0
    created_by: str
    created_at: str


# ==================== FAQ MODELS ====================

class FAQItemCreate(BaseModel):
    """Create a FAQ item"""
    question: str
    answer: str
    category: Optional[str] = None
    page_id: Optional[str] = None  # Link to specific page
    project_id: Optional[str] = None
    order: int = 0
    is_active: bool = True


class FAQItemUpdate(BaseModel):
    """Update a FAQ item"""
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    page_id: Optional[str] = None
    project_id: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class FAQItemResponse(BaseModel):
    """FAQ item response"""
    id: str
    question: str
    answer: str
    category: Optional[str] = None
    page_id: Optional[str] = None
    project_id: Optional[str] = None
    order: int
    is_active: bool
    views: int = 0
    helpful_count: int = 0
    created_by: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


# ==================== SITEMAP MODELS ====================

class SitemapEntry(BaseModel):
    """Sitemap entry"""
    loc: str  # URL
    lastmod: str
    changefreq: str = "weekly"  # always, hourly, daily, weekly, monthly, yearly, never
    priority: float = 0.5


class SitemapResponse(BaseModel):
    """Sitemap response"""
    entries: List[SitemapEntry]
    generated_at: str


# ==================== MENU MODELS ====================

class MenuItemCreate(BaseModel):
    """Create a menu item"""
    label: str
    url: Optional[str] = None
    page_id: Optional[str] = None  # Link to CMS page
    target: str = "_self"  # _self, _blank
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    order: int = 0
    is_active: bool = True
    visibility: str = "public"


class MenuItemResponse(BaseModel):
    """Menu item response"""
    id: str
    label: str
    url: Optional[str] = None
    page_id: Optional[str] = None
    target: str
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    children: List["MenuItemResponse"] = []
    order: int
    is_active: bool
    visibility: str


# ==================== CMS DASHBOARD MODELS ====================

class CMSDashboardStats(BaseModel):
    """CMS Dashboard statistics"""
    total_pages: int = 0
    published_pages: int = 0
    draft_pages: int = 0
    total_articles: int = 0
    published_articles: int = 0
    total_landing_pages: int = 0
    active_landing_pages: int = 0
    total_public_projects: int = 0
    total_testimonials: int = 0
    total_partners: int = 0
    total_careers: int = 0
    active_careers: int = 0
    total_media_assets: int = 0
    total_faqs: int = 0
    # Analytics
    total_page_views: int = 0
    total_form_submissions: int = 0
    avg_conversion_rate: float = 0.0
