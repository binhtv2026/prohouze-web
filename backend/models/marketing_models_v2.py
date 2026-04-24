"""
ProHouzing Marketing Domain Models - Refactored
Prompt 13/20 - Standardized Omnichannel Marketing Engine

NEW Canonical Models:
- Channel
- ContentAsset
- ContentPublication
- Form
- FormSubmission
- Attribution
- ResponseTemplate (Enhanced)

ENHANCED Models:
- Campaign (with content linkage, A/B testing, versioning)
- Touchpoint (with content/form/channel attribution)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# ENUMS - CHANNEL
# ============================================

class ChannelType(str, Enum):
    """Omnichannel types"""
    FACEBOOK = "facebook"
    FACEBOOK_ADS = "facebook_ads"
    TIKTOK = "tiktok"
    TIKTOK_ADS = "tiktok_ads"
    YOUTUBE = "youtube"
    LINKEDIN = "linkedin"
    ZALO = "zalo"
    ZALO_ADS = "zalo_ads"
    WEBSITE = "website"
    LANDING_PAGE = "landing_page"
    EMAIL = "email"
    SMS = "sms"
    HOTLINE = "hotline"
    GOOGLE_ADS = "google_ads"


class ChannelStatus(str, Enum):
    """Channel connection status"""
    PENDING = "pending"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    DISABLED = "disabled"


# ============================================
# ENUMS - CONTENT
# ============================================

class ContentType(str, Enum):
    """Content asset types"""
    POST = "post"
    STORY = "story"
    REEL = "reel"
    VIDEO = "video"
    CAROUSEL = "carousel"
    ARTICLE = "article"
    LANDING_PAGE = "landing_page"
    EMAIL_TEMPLATE = "email_template"
    AD_CREATIVE = "ad_creative"
    BANNER = "banner"


class ContentStatus(str, Enum):
    """Content lifecycle status"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PublicationStatus(str, Enum):
    """Publication status per channel"""
    PENDING = "pending"
    PUBLISHED = "published"
    FAILED = "failed"
    DELETED = "deleted"


# ============================================
# ENUMS - FORM
# ============================================

class FormFieldType(str, Enum):
    """Form field types"""
    TEXT = "text"
    EMAIL = "email"
    PHONE = "phone"
    SELECT = "select"
    MULTISELECT = "multiselect"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    TEXTAREA = "textarea"
    DATE = "date"
    NUMBER = "number"
    HIDDEN = "hidden"
    FILE = "file"


class FormStatus(str, Enum):
    """Form status"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class FormSubmissionStatus(str, Enum):
    """Form submission processing status"""
    RECEIVED = "received"
    PROCESSING = "processing"
    COMPLETED = "completed"
    DUPLICATE = "duplicate"
    INVALID = "invalid"
    SPAM = "spam"


# ============================================
# ENUMS - RESPONSE TEMPLATE
# ============================================

class TemplateCategory(str, Enum):
    """Response template categories"""
    GREETING = "greeting"
    PROJECT_INFO = "project_info"
    PRICING = "pricing"
    APPOINTMENT = "appointment"
    FAQ = "faq"
    OBJECTION_HANDLING = "objection_handling"
    FOLLOW_UP = "follow_up"
    CLOSING = "closing"
    OUT_OF_HOURS = "out_of_hours"
    THANK_YOU = "thank_you"


class TemplateStatus(str, Enum):
    """Template approval status"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


# ============================================
# ENUMS - ATTRIBUTION
# ============================================

class AttributionModel(str, Enum):
    """Attribution models"""
    FIRST_TOUCH = "first_touch"
    LAST_TOUCH = "last_touch"
    LINEAR = "linear"
    TIME_DECAY = "time_decay"
    POSITION_BASED = "position_based"
    CUSTOM = "custom"


# ============================================
# CHANNEL MODELS
# ============================================

class ChannelCreate(BaseModel):
    """Create a new channel integration"""
    code: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    channel_type: ChannelType
    
    # External account info
    external_account_id: Optional[str] = None
    external_account_name: Optional[str] = None
    external_account_url: Optional[str] = None
    
    # Credentials (encrypted)
    credentials: Dict[str, Any] = {}
    credentials_expires_at: Optional[str] = None
    
    # Settings
    settings: Dict[str, Any] = {}
    
    # Status
    is_active: bool = True


class ChannelResponse(BaseModel):
    """Channel response"""
    id: str
    code: str
    name: str
    channel_type: str
    channel_type_label: str = ""
    
    external_account_id: Optional[str] = None
    external_account_name: Optional[str] = None
    external_account_url: Optional[str] = None
    
    # Webhook
    webhook_url: Optional[str] = None
    
    # Settings
    settings: Dict[str, Any] = {}
    
    # Status
    status: str = "pending"
    status_label: str = ""
    is_active: bool = True
    
    # Stats
    stats: Dict[str, Any] = {}
    
    # Timestamps
    last_sync_at: Optional[str] = None
    last_error: Optional[str] = None
    connected_at: Optional[str] = None
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class ChannelStats(BaseModel):
    """Channel statistics"""
    channel_id: str
    channel_name: str
    channel_type: str
    
    followers: int = 0
    leads_this_month: int = 0
    leads_total: int = 0
    messages_received: int = 0
    auto_replies_sent: int = 0
    engagement_rate: float = 0.0


# ============================================
# CONTENT ASSET MODELS
# ============================================

class ContentAssetCreate(BaseModel):
    """Create a new content asset"""
    title: str = Field(..., min_length=1)
    content_type: ContentType
    
    # Campaign link
    campaign_id: Optional[str] = None
    
    # Project links
    project_ids: List[str] = []
    
    # Content body
    body: str = ""
    media_urls: List[str] = []
    media_metadata: List[Dict] = []
    
    # SEO/Social
    hashtags: List[str] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    
    # Target channels
    target_channel_ids: List[str] = []
    
    # Form attachment
    form_id: Optional[str] = None
    cta_url: Optional[str] = None
    cta_text: Optional[str] = None
    
    # UTM tracking
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    
    # Scheduling
    scheduled_at: Optional[str] = None
    
    # AI generation
    ai_generated: bool = False
    ai_prompt: Optional[str] = None
    
    # A/B variant
    ab_variant_id: Optional[str] = None


class ContentAssetResponse(BaseModel):
    """Content asset response"""
    id: str
    code: str
    title: str
    content_type: str
    content_type_label: str = ""
    
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    
    project_ids: List[str] = []
    
    body: str = ""
    media_urls: List[str] = []
    media_metadata: List[Dict] = []
    
    hashtags: List[str] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    
    target_channel_ids: List[str] = []
    
    form_id: Optional[str] = None
    cta_url: Optional[str] = None
    cta_text: Optional[str] = None
    
    # UTM
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    
    # Status
    status: str = "draft"
    status_label: str = ""
    scheduled_at: Optional[str] = None
    
    # Approval
    submitted_at: Optional[str] = None
    submitted_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    
    # Publishing
    published_at: Optional[str] = None
    published_by: Optional[str] = None
    
    # AI
    ai_generated: bool = False
    ai_prompt: Optional[str] = None
    
    # A/B
    ab_variant_id: Optional[str] = None
    
    # Engagement (aggregated)
    total_impressions: int = 0
    total_engagement: int = 0
    total_clicks: int = 0
    total_leads: int = 0
    
    # Version
    version: int = 1
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    updated_at: Optional[str] = None


class ContentStatusUpdate(BaseModel):
    """Update content status"""
    status: ContentStatus
    notes: Optional[str] = None


# ============================================
# CONTENT PUBLICATION MODELS
# ============================================

class ContentPublicationCreate(BaseModel):
    """Create a publication record"""
    content_asset_id: str
    channel_id: str


class ContentPublicationResponse(BaseModel):
    """Publication response"""
    id: str
    content_asset_id: str
    channel_id: str
    channel_name: str = ""
    channel_type: str = ""
    
    external_post_id: Optional[str] = None
    external_url: Optional[str] = None
    
    status: str = "pending"
    status_label: str = ""
    
    published_at: Optional[str] = None
    published_by: Optional[str] = None
    
    # Engagement metrics
    impressions: int = 0
    reach: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    clicks: int = 0
    video_views: int = 0
    engagement_rate: float = 0.0
    
    leads_generated: int = 0
    form_submissions: int = 0
    
    last_sync_at: Optional[str] = None
    error_message: Optional[str] = None
    
    created_at: str


# ============================================
# FORM MODELS
# ============================================

class FormField(BaseModel):
    """Form field definition"""
    field_id: str
    field_type: FormFieldType
    label: str
    placeholder: Optional[str] = None
    required: bool = False
    options: List[Dict] = []
    default_value: Optional[str] = None
    validation_rules: Dict = {}
    mapping_field: Optional[str] = None


class FormCreate(BaseModel):
    """Create a new form"""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    
    # Campaign link
    campaign_id: Optional[str] = None
    
    # Lead source link
    lead_source_id: Optional[str] = None
    
    # Content link
    content_asset_id: Optional[str] = None
    
    # Form definition
    fields: List[FormField] = []
    
    # Submit settings
    submit_button_text: str = "Gửi"
    success_message: str = "Cảm ơn bạn đã đăng ký!"
    redirect_url: Optional[str] = None
    
    # UTM defaults
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    
    # Auto-assignment
    auto_assign_rule_id: Optional[str] = None
    auto_assign_to_user: Optional[str] = None
    auto_assign_to_team: Optional[str] = None
    
    # Settings
    require_email_verification: bool = False
    max_submissions_per_ip: Optional[int] = None
    max_submissions_per_day: Optional[int] = None


class FormResponse(BaseModel):
    """Form response"""
    id: str
    code: str
    name: str
    description: Optional[str] = None
    
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    lead_source_id: Optional[str] = None
    content_asset_id: Optional[str] = None
    
    fields: List[Dict] = []
    
    submit_button_text: str = "Gửi"
    success_message: str = ""
    redirect_url: Optional[str] = None
    
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    
    auto_assign_rule_id: Optional[str] = None
    auto_assign_to_user: Optional[str] = None
    auto_assign_to_team: Optional[str] = None
    
    require_email_verification: bool = False
    max_submissions_per_ip: Optional[int] = None
    max_submissions_per_day: Optional[int] = None
    
    status: str = "draft"
    status_label: str = ""
    
    # Stats
    total_submissions: int = 0
    total_leads_created: int = 0
    conversion_rate: float = 0.0
    
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class FormRenderResponse(BaseModel):
    """Form render for public display"""
    form_id: str
    form_name: str
    fields: List[Dict]
    submit_button_text: str
    utm_params: Dict = {}
    submit_url: str


class FormSubmitRequest(BaseModel):
    """Form submission request"""
    data: Dict[str, Any]
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    referrer_url: Optional[str] = None
    landing_page_url: Optional[str] = None


class FormSubmitResponse(BaseModel):
    """Form submission response"""
    success: bool
    submission_id: str
    message: str
    redirect_url: Optional[str] = None


# ============================================
# FORM SUBMISSION MODELS
# ============================================

class FormSubmissionResponse(BaseModel):
    """Form submission record"""
    id: str
    form_id: str
    form_name: str = ""
    
    content_asset_id: Optional[str] = None
    channel_id: Optional[str] = None
    campaign_id: Optional[str] = None
    
    data: Dict = {}
    
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    referrer_url: Optional[str] = None
    landing_page_url: Optional[str] = None
    
    ip_address: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    
    status: str = "received"
    status_label: str = ""
    
    lead_id: Optional[str] = None
    contact_id: Optional[str] = None
    touchpoint_id: Optional[str] = None
    attribution_id: Optional[str] = None
    
    is_duplicate: bool = False
    duplicate_of_contact_id: Optional[str] = None
    duplicate_reason: Optional[str] = None
    
    error_message: Optional[str] = None
    
    submitted_at: str
    processed_at: Optional[str] = None


# ============================================
# ATTRIBUTION MODELS
# ============================================

class AttributionCreate(BaseModel):
    """Create attribution record (usually internal)"""
    contact_id: str
    lead_id: Optional[str] = None
    deal_id: Optional[str] = None
    attribution_model: AttributionModel = AttributionModel.FIRST_TOUCH


class AttributionResponse(BaseModel):
    """Attribution record response"""
    id: str
    contact_id: str
    contact_name: str = ""
    lead_id: Optional[str] = None
    deal_id: Optional[str] = None
    
    attribution_model: str = "first_touch"
    model_version: str = "1.0"
    
    # First touch snapshot
    first_touch: Dict = {}
    
    # Last touch snapshot
    last_touch: Dict = {}
    
    # All touchpoints snapshot
    touchpoints_snapshot: List[Dict] = []
    total_touchpoints: int = 0
    
    # Revenue attribution
    total_revenue: float = 0
    attributed_revenue: Dict = {}
    
    # Campaign snapshot
    campaign_snapshot: Optional[Dict] = None
    
    # Conversion info
    conversion_event: Optional[str] = None
    conversion_value: float = 0
    converted_at: Optional[str] = None
    days_to_conversion: int = 0
    
    # Lock status
    is_locked: bool = False
    locked_at: Optional[str] = None
    locked_by: Optional[str] = None
    lock_reason: Optional[str] = None
    
    version: int = 1
    
    created_at: str
    created_by: Optional[str] = None


class AttributionReport(BaseModel):
    """Attribution report"""
    period_start: str
    period_end: str
    
    by_campaign: List[Dict] = []
    by_channel: List[Dict] = []
    by_content: List[Dict] = []
    by_source: List[Dict] = []
    
    model_comparison: Dict = {}
    
    total_leads: int = 0
    total_conversions: int = 0
    total_revenue: float = 0


# ============================================
# RESPONSE TEMPLATE MODELS
# ============================================

class ResponseTemplateCreate(BaseModel):
    """Create a response template"""
    name: str = Field(..., min_length=1)
    category: TemplateCategory
    
    # Applicable channels
    channel_ids: List[str] = []
    
    # Trigger configuration
    trigger_keywords: List[str] = []
    trigger_intents: List[str] = []
    trigger_conditions: Dict = {}
    
    # Template content
    template_text: str = Field(..., min_length=1)
    
    # Variables
    variables: List[str] = []
    variable_sources: Dict = {}
    
    # Priority
    priority: int = 10
    
    # Human review
    requires_human_review: bool = False
    
    # A/B testing
    is_ab_variant: bool = False
    ab_parent_id: Optional[str] = None
    ab_variant_name: Optional[str] = None


class ResponseTemplateResponse(BaseModel):
    """Response template response"""
    id: str
    code: str
    name: str
    category: str
    category_label: str = ""
    
    channel_ids: List[str] = []
    
    trigger_keywords: List[str] = []
    trigger_intents: List[str] = []
    trigger_conditions: Dict = {}
    
    template_text: str
    
    variables: List[str] = []
    variable_sources: Dict = {}
    
    priority: int = 10
    
    requires_human_review: bool = False
    
    status: str = "draft"
    status_label: str = ""
    
    submitted_at: Optional[str] = None
    submitted_by: Optional[str] = None
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    usage_count: int = 0
    last_used_at: Optional[str] = None
    success_rate: float = 0.0
    
    is_ab_variant: bool = False
    ab_parent_id: Optional[str] = None
    ab_variant_name: Optional[str] = None
    
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class TemplateMatchRequest(BaseModel):
    """Request to find matching template"""
    message: str
    channel_id: str
    contact_id: Optional[str] = None


class TemplateMatchResponse(BaseModel):
    """Template match result"""
    matched: bool
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    rendered_text: Optional[str] = None
    confidence: float = 0.0
    requires_review: bool = False


class TemplateRenderRequest(BaseModel):
    """Request to render template"""
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    project_id: Optional[str] = None
    custom_variables: Dict = {}


class TemplateStatusUpdate(BaseModel):
    """Update template status"""
    status: TemplateStatus
    reason: Optional[str] = None


# ============================================
# AI CONTENT GENERATION MODELS
# ============================================

class AIContentGenerateRequest(BaseModel):
    """Request AI content generation"""
    content_type: ContentType
    channels: List[str] = []
    project_id: Optional[str] = None
    campaign_id: Optional[str] = None
    topic: str
    tone: str = "professional"  # professional, casual, exciting, informative
    length: str = "medium"  # short, medium, long
    include_cta: bool = True
    target_audience: Optional[str] = None
    keywords: List[str] = []


class AIContentGenerateResponse(BaseModel):
    """AI generated content response"""
    success: bool
    title: str = ""
    body: str = ""
    hashtags: List[str] = []
    cta_text: Optional[str] = None
    model_used: str = ""
    tokens_used: int = 0


# ============================================
# DASHBOARD MODELS
# ============================================

class MarketingDashboardResponse(BaseModel):
    """Marketing dashboard data"""
    # Summary KPIs
    total_leads: int = 0
    total_leads_change: float = 0.0
    
    qualified_leads: int = 0
    qualified_leads_change: float = 0.0
    
    converted_leads: int = 0
    converted_leads_change: float = 0.0
    
    conversion_rate: float = 0.0
    conversion_rate_change: float = 0.0
    
    total_revenue: float = 0.0
    total_revenue_change: float = 0.0
    
    avg_cost_per_lead: float = 0.0
    avg_cost_per_lead_change: float = 0.0
    
    roi: float = 0.0
    roi_change: float = 0.0
    
    # Breakdowns
    leads_by_source_type: Dict[str, int] = {}
    leads_by_channel: Dict[str, int] = {}
    leads_by_campaign: Dict[str, int] = {}
    
    revenue_by_source_type: Dict[str, float] = {}
    revenue_by_channel: Dict[str, float] = {}
    
    # Counts
    active_campaigns: int = 0
    active_channels: int = 0
    active_forms: int = 0
    
    # Top performers
    top_sources: List[Dict] = []
    top_campaigns: List[Dict] = []
    top_contents: List[Dict] = []
    
    # Trends
    leads_trend: Dict[str, int] = {}
    revenue_trend: Dict[str, float] = {}
    
    # Period
    period_start: str = ""
    period_end: str = ""


# ============================================
# CONFIG RESPONSE MODELS
# ============================================

class ChannelTypeConfig(BaseModel):
    """Channel type configuration"""
    value: str
    label: str
    label_vi: str
    icon: str
    color: str
    features: List[str] = []


class ContentTypeConfig(BaseModel):
    """Content type configuration"""
    value: str
    label: str
    label_vi: str
    icon: str


class FormFieldTypeConfig(BaseModel):
    """Form field type configuration"""
    value: str
    label: str
    label_vi: str


class TemplateCategoryConfig(BaseModel):
    """Template category configuration"""
    value: str
    label: str
    label_vi: str
    icon: str
    description: str
