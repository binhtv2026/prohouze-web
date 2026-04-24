"""
ProHouzing Marketing Domain Models
Prompt 7/20 - Lead Source & Marketing Attribution Engine

Models for:
- Lead Sources
- Campaigns
- Marketing Attribution (Touchpoints)
- Assignment Rules
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# ENUMS
# ============================================

class LeadSourceType(str, Enum):
    """High-level source categorization"""
    ORGANIC = "organic"
    PAID = "paid"
    SOCIAL = "social"
    REFERRAL = "referral"
    EVENT = "event"
    PARTNER = "partner"
    DIRECT = "direct"
    EMAIL = "email"
    OTHER = "other"


class LeadSourceChannel(str, Enum):
    """Specific channel within source type"""
    # Social - Organic
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    LINKEDIN = "linkedin"
    ZALO = "zalo"
    INSTAGRAM = "instagram"
    
    # Social - Paid
    FACEBOOK_ADS = "facebook_ads"
    TIKTOK_ADS = "tiktok_ads"
    YOUTUBE_ADS = "youtube_ads"
    LINKEDIN_ADS = "linkedin_ads"
    ZALO_ADS = "zalo_ads"
    INSTAGRAM_ADS = "instagram_ads"
    
    # Organic Web
    WEBSITE = "website"
    LANDING_PAGE = "landing_page"
    SEO = "seo"
    BLOG = "blog"
    
    # Paid Search
    GOOGLE_ADS = "google_ads"
    GOOGLE_DISPLAY = "google_display"
    COCCOC_ADS = "coccoc_ads"
    
    # Direct
    PHONE_INBOUND = "phone_inbound"
    WALK_IN = "walk_in"
    HOTLINE = "hotline"
    
    # Referral
    CTV = "ctv"
    CUSTOMER_REFERRAL = "customer_referral"
    EMPLOYEE_REFERRAL = "employee_referral"
    PARTNER = "partner"
    
    # Email
    EMAIL_CAMPAIGN = "email_campaign"
    EMAIL_NEWSLETTER = "email_newsletter"
    
    # Event
    EVENT_OFFLINE = "event_offline"
    WEBINAR = "webinar"
    EXHIBITION = "exhibition"
    
    # Other
    OTHER = "other"


class CampaignType(str, Enum):
    """Campaign types"""
    BRAND_AWARENESS = "brand_awareness"
    LEAD_GENERATION = "lead_generation"
    SALES_PROMOTION = "sales_promotion"
    RETARGETING = "retargeting"
    EMAIL_NURTURE = "email_nurture"
    EVENT = "event"
    PRODUCT_LAUNCH = "product_launch"
    SEASONAL = "seasonal"


class CampaignStatus(str, Enum):
    """Campaign lifecycle status"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AttributionModel(str, Enum):
    """Attribution models for multi-touch"""
    FIRST_TOUCH = "first_touch"
    LAST_TOUCH = "last_touch"
    LINEAR = "linear"
    TIME_DECAY = "time_decay"
    POSITION_BASED = "position_based"


class TouchpointType(str, Enum):
    """Touchpoint types"""
    PAGE_VIEW = "page_view"
    FORM_SUBMIT = "form_submit"
    CHAT_START = "chat_start"
    CALL_INBOUND = "call_inbound"
    CALL_OUTBOUND = "call_outbound"
    EMAIL_OPEN = "email_open"
    EMAIL_CLICK = "email_click"
    SOCIAL_ENGAGE = "social_engage"
    EVENT_ATTEND = "event_attend"
    SITE_VISIT = "site_visit"
    MEETING = "meeting"


class AssignmentRuleType(str, Enum):
    """Types of assignment rules"""
    ROUND_ROBIN = "round_robin"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    BY_CAPACITY = "by_capacity"
    BY_PERFORMANCE = "by_performance"
    BY_REGION = "by_region"
    BY_PROJECT = "by_project"
    BY_SEGMENT = "by_segment"
    BY_SOURCE = "by_source"
    HYBRID = "hybrid"


# ============================================
# LEAD SOURCE MODELS
# ============================================

class LeadSourceCreate(BaseModel):
    """
    LeadSource = Canonical model for tracking lead origins
    """
    # Identity
    code: str = Field(..., min_length=1, description="Unique code")
    name: str = Field(..., min_length=1, description="Display name")
    
    # Classification
    source_type: LeadSourceType
    channel: LeadSourceChannel
    
    # Campaign linkage
    campaign_id: Optional[str] = None
    
    # UTM Parameters
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    
    # Tracking
    landing_page_url: Optional[str] = None
    tracking_pixel_id: Optional[str] = None
    
    # Cost tracking
    cost_per_lead: Optional[float] = None
    total_budget: Optional[float] = None
    
    # Quality scoring
    default_quality_score: int = 50
    
    # Assignment rules
    auto_assign_to_team: Optional[str] = None
    auto_assign_to_branch: Optional[str] = None
    priority_level: int = 5
    
    # Status
    is_active: bool = True
    
    # Tags
    tags: List[str] = []
    
    # Notes
    description: Optional[str] = None


class LeadSourceResponse(LeadSourceCreate):
    """Lead source response with computed fields"""
    id: str
    
    # Type/Channel labels
    source_type_label: str = ""
    channel_label: str = ""
    
    # Stats (computed)
    total_leads: int = 0
    converted_leads: int = 0
    conversion_rate: float = 0.0
    avg_deal_value: float = 0.0
    total_revenue: float = 0.0
    roi: float = 0.0
    
    # Cost metrics
    actual_cost_per_lead: float = 0.0
    budget_spent: float = 0.0
    budget_remaining: float = 0.0
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class LeadSourceSummary(BaseModel):
    """Summary of lead source performance"""
    source_id: str
    source_code: str
    source_name: str
    source_type: str
    channel: str
    
    total_leads: int = 0
    converted_leads: int = 0
    conversion_rate: float = 0.0
    total_revenue: float = 0.0
    cost_per_lead: float = 0.0
    roi: float = 0.0


# ============================================
# CAMPAIGN MODELS
# ============================================

class CampaignCreate(BaseModel):
    """
    Campaign = Marketing campaign with budget, timeline, and performance tracking
    """
    # Identity
    code: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    
    # Classification
    campaign_type: CampaignType
    
    # Timeline
    start_date: str
    end_date: Optional[str] = None
    
    # Budget
    budget_total: float = 0
    budget_daily: Optional[float] = None
    currency: str = "VND"
    
    # Targets
    target_leads: int = 0
    target_conversions: int = 0
    target_revenue: float = 0
    
    # Channels & Sources
    channels: List[str] = []
    lead_source_ids: List[str] = []
    
    # Projects/Products
    project_ids: List[str] = []
    
    # Assignment rules
    default_branch_id: Optional[str] = None
    default_team_id: Optional[str] = None
    
    # Status
    status: CampaignStatus = CampaignStatus.DRAFT
    
    # Tags
    tags: List[str] = []


class CampaignResponse(CampaignCreate):
    """Campaign response with computed fields"""
    id: str
    
    # Status info
    status_label: str = ""
    status_color: str = ""
    
    # Type info
    campaign_type_label: str = ""
    
    # Performance metrics (computed)
    total_leads: int = 0
    qualified_leads: int = 0
    converted_leads: int = 0
    total_revenue: float = 0
    budget_spent: float = 0
    
    # Calculated metrics
    actual_cost_per_lead: float = 0
    cost_per_conversion: float = 0
    conversion_rate: float = 0
    roi: float = 0
    
    # Progress
    leads_progress: float = 0        # % of target_leads
    conversion_progress: float = 0   # % of target_conversions
    revenue_progress: float = 0      # % of target_revenue
    budget_progress: float = 0       # % of budget used
    
    # Timeline
    days_remaining: Optional[int] = None
    is_overdue: bool = False
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class CampaignStatusUpdate(BaseModel):
    """Update campaign status"""
    status: CampaignStatus
    reason: Optional[str] = None


# ============================================
# TOUCHPOINT & ATTRIBUTION MODELS
# ============================================

class TouchpointCreate(BaseModel):
    """
    Touchpoint = Single interaction in customer journey
    """
    # Contact/Lead link
    contact_id: str
    lead_id: Optional[str] = None
    
    # Source info
    lead_source_id: Optional[str] = None
    campaign_id: Optional[str] = None
    channel: Optional[str] = None
    
    # UTM
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    
    # Context
    landing_page: Optional[str] = None
    referrer_url: Optional[str] = None
    
    # Touchpoint details
    touchpoint_type: TouchpointType = TouchpointType.PAGE_VIEW
    is_conversion: bool = False
    conversion_value: float = 0
    
    # Device/Browser (optional)
    device_type: Optional[str] = None
    browser: Optional[str] = None
    ip_address: Optional[str] = None
    
    # Custom data
    custom_data: Dict[str, Any] = {}


class TouchpointResponse(TouchpointCreate):
    """Touchpoint response"""
    id: str
    
    # Resolved names
    lead_source_name: Optional[str] = None
    campaign_name: Optional[str] = None
    
    # Type label
    touchpoint_type_label: str = ""
    
    # Timestamps
    occurred_at: str
    created_at: str


class AttributionReport(BaseModel):
    """
    Attribution report for a contact/deal
    """
    contact_id: str
    contact_name: str = ""
    deal_id: Optional[str] = None
    
    # Touchpoint summary
    touchpoints: List[TouchpointResponse] = []
    total_touchpoints: int = 0
    
    # First/Last touch
    first_touch_source_id: Optional[str] = None
    first_touch_source_name: Optional[str] = None
    first_touch_campaign_id: Optional[str] = None
    first_touch_campaign_name: Optional[str] = None
    first_touch_channel: Optional[str] = None
    first_touch_at: Optional[str] = None
    
    last_touch_source_id: Optional[str] = None
    last_touch_source_name: Optional[str] = None
    last_touch_campaign_id: Optional[str] = None
    last_touch_campaign_name: Optional[str] = None
    last_touch_channel: Optional[str] = None
    last_touch_at: Optional[str] = None
    
    # Revenue attribution
    total_revenue: float = 0
    attributed_by_source: Dict[str, float] = {}
    attributed_by_campaign: Dict[str, float] = {}
    attributed_by_channel: Dict[str, float] = {}
    
    # Timeline
    conversion_at: Optional[str] = None
    days_to_conversion: int = 0
    
    # Attribution model used
    attribution_model: str = "first_touch"


# ============================================
# ASSIGNMENT RULE MODELS
# ============================================

class AssignmentRuleCreate(BaseModel):
    """
    AssignmentRule = Configurable rule for lead routing
    """
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    
    # Type
    rule_type: AssignmentRuleType
    
    # Priority (lower = higher priority)
    priority: int = 10
    
    # Conditions (when to apply this rule)
    conditions: Dict[str, Any] = {}
    # Examples:
    # {"source_type": "paid"}
    # {"channel": ["facebook_ads", "google_ads"]}
    # {"segment": ["vip", "high_value"]}
    # {"budget_min": 5000000000}
    # {"project_ids": ["proj-1", "proj-2"]}
    # {"lead_source_ids": ["src-1"]}
    
    # Assignment targets
    target_users: List[str] = []
    target_teams: List[str] = []
    target_branches: List[str] = []
    
    # Configuration
    config: Dict[str, Any] = {}
    # Examples:
    # For round_robin: {"skip_offline": true, "max_leads_per_user": 50}
    # For weighted: {"weights": {"user1": 2, "user2": 1}}
    # For capacity: {"max_active_leads": 30}
    # For performance: {"min_conversion_rate": 0.1}
    
    # Schedule (optional)
    active_hours: Optional[Dict[str, Any]] = None
    # {"weekdays": [1,2,3,4,5], "start_hour": 8, "end_hour": 18}
    
    # Fallback
    fallback_rule_id: Optional[str] = None
    
    # Status
    is_active: bool = True


class AssignmentRuleResponse(AssignmentRuleCreate):
    """Assignment rule response"""
    id: str
    
    # Type label
    rule_type_label: str = ""
    
    # Stats
    trigger_count: int = 0
    success_count: int = 0
    success_rate: float = 0.0
    last_triggered: Optional[str] = None
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


class AssignmentResult(BaseModel):
    """Result of assignment engine"""
    lead_id: str
    contact_id: Optional[str] = None
    
    # Assignment result
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    
    # Rule info
    rule_id: Optional[str] = None
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    
    # Details
    reason: str = ""
    confidence: float = 0.0
    alternatives: List[Dict[str, str]] = []  # [{user_id, user_name, reason}]
    
    # Status
    success: bool = False
    error_message: Optional[str] = None
    
    # Timestamp
    created_at: str


class AssignmentTestRequest(BaseModel):
    """Request to test assignment rule with sample lead"""
    lead_source_id: Optional[str] = None
    campaign_id: Optional[str] = None
    channel: Optional[str] = None
    source_type: Optional[str] = None
    segment: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    project_id: Optional[str] = None
    region: Optional[str] = None


# ============================================
# ANALYTICS MODELS
# ============================================

class SourceAnalytics(BaseModel):
    """Analytics for a lead source"""
    source_id: str
    source_code: str
    source_name: str
    source_type: str
    channel: str
    
    # Counts
    total_leads: int = 0
    new_leads: int = 0
    qualified_leads: int = 0
    converted_leads: int = 0
    lost_leads: int = 0
    
    # Rates
    qualification_rate: float = 0.0
    conversion_rate: float = 0.0
    
    # Revenue
    total_revenue: float = 0.0
    avg_deal_value: float = 0.0
    
    # Cost
    total_cost: float = 0.0
    cost_per_lead: float = 0.0
    cost_per_conversion: float = 0.0
    roi: float = 0.0
    
    # Trends (optional)
    leads_by_day: Dict[str, int] = {}
    leads_by_week: Dict[str, int] = {}
    leads_by_month: Dict[str, int] = {}


class CampaignAnalytics(BaseModel):
    """Analytics for a campaign"""
    campaign_id: str
    campaign_code: str
    campaign_name: str
    campaign_type: str
    status: str
    
    # Counts
    total_leads: int = 0
    qualified_leads: int = 0
    converted_leads: int = 0
    
    # Rates
    qualification_rate: float = 0.0
    conversion_rate: float = 0.0
    
    # Revenue & Budget
    total_revenue: float = 0.0
    budget_total: float = 0.0
    budget_spent: float = 0.0
    budget_remaining: float = 0.0
    
    # Cost metrics
    cost_per_lead: float = 0.0
    cost_per_conversion: float = 0.0
    roi: float = 0.0
    
    # Progress
    leads_vs_target: float = 0.0
    revenue_vs_target: float = 0.0
    
    # By source breakdown
    leads_by_source: Dict[str, int] = {}
    revenue_by_source: Dict[str, float] = {}


class ChannelAnalytics(BaseModel):
    """Analytics by channel"""
    channel: str
    channel_label: str
    
    total_leads: int = 0
    converted_leads: int = 0
    conversion_rate: float = 0.0
    total_revenue: float = 0.0
    avg_deal_value: float = 0.0
    cost_per_lead: float = 0.0


class MarketingDashboard(BaseModel):
    """Marketing dashboard data"""
    # Summary KPIs
    total_leads: int = 0
    total_leads_change: float = 0.0  # % change vs previous period
    
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
    
    # Active campaigns
    active_campaigns: int = 0
    active_sources: int = 0
    
    # Top performers
    top_sources: List[LeadSourceSummary] = []
    top_campaigns: List[Dict[str, Any]] = []
    
    # Trends (last 30 days)
    leads_trend: Dict[str, int] = {}
    revenue_trend: Dict[str, float] = {}
    
    # Period
    period_start: str = ""
    period_end: str = ""
