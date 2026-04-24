"""
ProHouzing Marketing Configuration
Prompt 7/20 - Lead Source & Marketing Attribution Engine

Configuration for:
- Lead source types and channels
- Campaign types and statuses
- Attribution models
- Assignment rule types
- Default quality scores
"""

from typing import Dict, List, Any


# ============================================
# LEAD SOURCE TYPE CONFIGURATION
# ============================================

LEAD_SOURCE_TYPES = [
    {
        "code": "organic",
        "label": "Organic",
        "label_vi": "Tự nhiên",
        "description": "Website direct, SEO traffic",
        "default_quality_score": 60,
        "color": "bg-green-100 text-green-700"
    },
    {
        "code": "paid",
        "label": "Paid",
        "label_vi": "Quảng cáo trả phí",
        "description": "Google Ads, Facebook Ads, etc.",
        "default_quality_score": 50,
        "color": "bg-blue-100 text-blue-700"
    },
    {
        "code": "social",
        "label": "Social",
        "label_vi": "Mạng xã hội",
        "description": "Organic social media",
        "default_quality_score": 45,
        "color": "bg-purple-100 text-purple-700"
    },
    {
        "code": "referral",
        "label": "Referral",
        "label_vi": "Giới thiệu",
        "description": "CTV, customer, employee referrals",
        "default_quality_score": 80,
        "color": "bg-amber-100 text-amber-700"
    },
    {
        "code": "event",
        "label": "Event",
        "label_vi": "Sự kiện",
        "description": "Offline events, exhibitions, webinars",
        "default_quality_score": 70,
        "color": "bg-rose-100 text-rose-700"
    },
    {
        "code": "partner",
        "label": "Partner",
        "label_vi": "Đối tác",
        "description": "Third-party partnerships",
        "default_quality_score": 65,
        "color": "bg-indigo-100 text-indigo-700"
    },
    {
        "code": "direct",
        "label": "Direct",
        "label_vi": "Trực tiếp",
        "description": "Walk-in, hotline, direct contact",
        "default_quality_score": 75,
        "color": "bg-teal-100 text-teal-700"
    },
    {
        "code": "email",
        "label": "Email",
        "label_vi": "Email",
        "description": "Email campaigns and newsletters",
        "default_quality_score": 55,
        "color": "bg-cyan-100 text-cyan-700"
    },
    {
        "code": "other",
        "label": "Other",
        "label_vi": "Khác",
        "description": "Other sources",
        "default_quality_score": 40,
        "color": "bg-gray-100 text-gray-700"
    }
]


# ============================================
# LEAD SOURCE CHANNEL CONFIGURATION
# ============================================

LEAD_SOURCE_CHANNELS = [
    # Social - Organic
    {"code": "facebook", "label": "Facebook", "group": "social", "source_type": "social"},
    {"code": "tiktok", "label": "TikTok", "group": "social", "source_type": "social"},
    {"code": "youtube", "label": "YouTube", "group": "social", "source_type": "social"},
    {"code": "linkedin", "label": "LinkedIn", "group": "social", "source_type": "social"},
    {"code": "zalo", "label": "Zalo", "group": "social", "source_type": "social"},
    {"code": "instagram", "label": "Instagram", "group": "social", "source_type": "social"},
    
    # Social - Paid
    {"code": "facebook_ads", "label": "Facebook Ads", "group": "paid_social", "source_type": "paid"},
    {"code": "tiktok_ads", "label": "TikTok Ads", "group": "paid_social", "source_type": "paid"},
    {"code": "youtube_ads", "label": "YouTube Ads", "group": "paid_social", "source_type": "paid"},
    {"code": "linkedin_ads", "label": "LinkedIn Ads", "group": "paid_social", "source_type": "paid"},
    {"code": "zalo_ads", "label": "Zalo Ads", "group": "paid_social", "source_type": "paid"},
    {"code": "instagram_ads", "label": "Instagram Ads", "group": "paid_social", "source_type": "paid"},
    
    # Organic Web
    {"code": "website", "label": "Website", "group": "organic", "source_type": "organic"},
    {"code": "landing_page", "label": "Landing Page", "group": "organic", "source_type": "organic"},
    {"code": "seo", "label": "SEO", "group": "organic", "source_type": "organic"},
    {"code": "blog", "label": "Blog", "group": "organic", "source_type": "organic"},
    
    # Paid Search
    {"code": "google_ads", "label": "Google Ads", "group": "paid_search", "source_type": "paid"},
    {"code": "google_display", "label": "Google Display", "group": "paid_search", "source_type": "paid"},
    {"code": "coccoc_ads", "label": "Cốc Cốc Ads", "group": "paid_search", "source_type": "paid"},
    
    # Direct
    {"code": "phone_inbound", "label": "Gọi đến", "group": "direct", "source_type": "direct"},
    {"code": "walk_in", "label": "Walk-in", "group": "direct", "source_type": "direct"},
    {"code": "hotline", "label": "Hotline", "group": "direct", "source_type": "direct"},
    
    # Referral
    {"code": "ctv", "label": "CTV/Cộng tác viên", "group": "referral", "source_type": "referral"},
    {"code": "customer_referral", "label": "Khách giới thiệu", "group": "referral", "source_type": "referral"},
    {"code": "employee_referral", "label": "Nhân viên giới thiệu", "group": "referral", "source_type": "referral"},
    {"code": "partner", "label": "Đối tác", "group": "referral", "source_type": "partner"},
    
    # Email
    {"code": "email_campaign", "label": "Email Campaign", "group": "email", "source_type": "email"},
    {"code": "email_newsletter", "label": "Email Newsletter", "group": "email", "source_type": "email"},
    
    # Event
    {"code": "event_offline", "label": "Sự kiện offline", "group": "event", "source_type": "event"},
    {"code": "webinar", "label": "Webinar", "group": "event", "source_type": "event"},
    {"code": "exhibition", "label": "Triển lãm", "group": "event", "source_type": "event"},
    
    # Other
    {"code": "other", "label": "Khác", "group": "other", "source_type": "other"},
]


# ============================================
# CAMPAIGN CONFIGURATION
# ============================================

CAMPAIGN_TYPES = [
    {
        "code": "brand_awareness",
        "label": "Brand Awareness",
        "label_vi": "Nhận diện thương hiệu",
        "description": "Chiến dịch xây dựng thương hiệu"
    },
    {
        "code": "lead_generation",
        "label": "Lead Generation",
        "label_vi": "Tạo lead",
        "description": "Chiến dịch thu thập lead"
    },
    {
        "code": "sales_promotion",
        "label": "Sales Promotion",
        "label_vi": "Khuyến mãi",
        "description": "Chiến dịch khuyến mãi bán hàng"
    },
    {
        "code": "retargeting",
        "label": "Retargeting",
        "label_vi": "Retargeting",
        "description": "Chiến dịch remarketing"
    },
    {
        "code": "email_nurture",
        "label": "Email Nurture",
        "label_vi": "Nuôi dưỡng qua email",
        "description": "Chuỗi email chăm sóc"
    },
    {
        "code": "event",
        "label": "Event",
        "label_vi": "Sự kiện",
        "description": "Chiến dịch sự kiện"
    },
    {
        "code": "product_launch",
        "label": "Product Launch",
        "label_vi": "Ra mắt sản phẩm",
        "description": "Chiến dịch ra mắt sản phẩm mới"
    },
    {
        "code": "seasonal",
        "label": "Seasonal",
        "label_vi": "Theo mùa",
        "description": "Chiến dịch theo mùa/dịp lễ"
    }
]

CAMPAIGN_STATUSES = [
    {"code": "draft", "label": "Nháp", "label_en": "Draft", "color": "bg-gray-100 text-gray-700"},
    {"code": "scheduled", "label": "Đã lên lịch", "label_en": "Scheduled", "color": "bg-blue-100 text-blue-700"},
    {"code": "active", "label": "Đang chạy", "label_en": "Active", "color": "bg-green-100 text-green-700"},
    {"code": "paused", "label": "Tạm dừng", "label_en": "Paused", "color": "bg-yellow-100 text-yellow-700"},
    {"code": "completed", "label": "Hoàn thành", "label_en": "Completed", "color": "bg-indigo-100 text-indigo-700"},
    {"code": "cancelled", "label": "Đã hủy", "label_en": "Cancelled", "color": "bg-red-100 text-red-700"},
]


# ============================================
# ATTRIBUTION CONFIGURATION
# ============================================

ATTRIBUTION_MODELS = [
    {
        "code": "first_touch",
        "label": "First Touch",
        "label_vi": "Điểm chạm đầu tiên",
        "description": "100% credit cho touchpoint đầu tiên"
    },
    {
        "code": "last_touch",
        "label": "Last Touch",
        "label_vi": "Điểm chạm cuối cùng",
        "description": "100% credit cho touchpoint cuối cùng"
    },
    {
        "code": "linear",
        "label": "Linear",
        "label_vi": "Tuyến tính",
        "description": "Chia đều credit cho tất cả touchpoints"
    },
    {
        "code": "time_decay",
        "label": "Time Decay",
        "label_vi": "Giảm dần theo thời gian",
        "description": "Touchpoints gần hơn được nhiều credit hơn"
    },
    {
        "code": "position_based",
        "label": "Position Based",
        "label_vi": "Theo vị trí",
        "description": "40% đầu, 40% cuối, 20% giữa"
    }
]

TOUCHPOINT_TYPES = [
    {"code": "page_view", "label": "Xem trang", "category": "web"},
    {"code": "form_submit", "label": "Gửi form", "category": "web"},
    {"code": "chat_start", "label": "Bắt đầu chat", "category": "engagement"},
    {"code": "call_inbound", "label": "Gọi đến", "category": "call"},
    {"code": "call_outbound", "label": "Gọi đi", "category": "call"},
    {"code": "email_open", "label": "Mở email", "category": "email"},
    {"code": "email_click", "label": "Click email", "category": "email"},
    {"code": "social_engage", "label": "Tương tác MXH", "category": "social"},
    {"code": "event_attend", "label": "Tham dự sự kiện", "category": "event"},
    {"code": "site_visit", "label": "Xem nhà", "category": "sales"},
    {"code": "meeting", "label": "Gặp mặt", "category": "sales"},
]


# ============================================
# ASSIGNMENT RULE CONFIGURATION
# ============================================

ASSIGNMENT_RULE_TYPES = [
    {
        "code": "round_robin",
        "label": "Round Robin",
        "label_vi": "Xoay vòng",
        "description": "Phân bổ đều lần lượt cho từng người"
    },
    {
        "code": "weighted_round_robin",
        "label": "Weighted Round Robin",
        "label_vi": "Xoay vòng có trọng số",
        "description": "Phân bổ theo tỷ lệ cấu hình"
    },
    {
        "code": "by_capacity",
        "label": "By Capacity",
        "label_vi": "Theo capacity",
        "description": "Ưu tiên người có ít lead active"
    },
    {
        "code": "by_performance",
        "label": "By Performance",
        "label_vi": "Theo hiệu suất",
        "description": "Ưu tiên người có conversion rate cao"
    },
    {
        "code": "by_region",
        "label": "By Region",
        "label_vi": "Theo vùng",
        "description": "Theo vùng miền của lead"
    },
    {
        "code": "by_project",
        "label": "By Project",
        "label_vi": "Theo dự án",
        "description": "Theo dự án lead quan tâm"
    },
    {
        "code": "by_segment",
        "label": "By Segment",
        "label_vi": "Theo phân khúc",
        "description": "VIP → senior sales, entry → junior sales"
    },
    {
        "code": "by_source",
        "label": "By Source",
        "label_vi": "Theo nguồn",
        "description": "Theo nguồn lead (paid → team A, organic → team B)"
    },
    {
        "code": "hybrid",
        "label": "Hybrid",
        "label_vi": "Kết hợp",
        "description": "Kết hợp nhiều tiêu chí"
    }
]


# ============================================
# DEFAULT LEAD SOURCES
# ============================================

DEFAULT_LEAD_SOURCES = [
    {
        "code": "WEB_DIRECT",
        "name": "Website Direct",
        "source_type": "organic",
        "channel": "website",
        "default_quality_score": 60
    },
    {
        "code": "FB_ORGANIC",
        "name": "Facebook Organic",
        "source_type": "social",
        "channel": "facebook",
        "default_quality_score": 50
    },
    {
        "code": "FB_ADS",
        "name": "Facebook Ads",
        "source_type": "paid",
        "channel": "facebook_ads",
        "default_quality_score": 45
    },
    {
        "code": "GG_ADS",
        "name": "Google Ads",
        "source_type": "paid",
        "channel": "google_ads",
        "default_quality_score": 55
    },
    {
        "code": "ZALO_ORGANIC",
        "name": "Zalo Organic",
        "source_type": "social",
        "channel": "zalo",
        "default_quality_score": 50
    },
    {
        "code": "CTV_REFERRAL",
        "name": "CTV Referral",
        "source_type": "referral",
        "channel": "ctv",
        "default_quality_score": 80
    },
    {
        "code": "CUST_REFERRAL",
        "name": "Customer Referral",
        "source_type": "referral",
        "channel": "customer_referral",
        "default_quality_score": 85
    },
    {
        "code": "HOTLINE",
        "name": "Hotline",
        "source_type": "direct",
        "channel": "hotline",
        "default_quality_score": 75
    },
    {
        "code": "WALKIN",
        "name": "Walk-in",
        "source_type": "direct",
        "channel": "walk_in",
        "default_quality_score": 80
    },
    {
        "code": "EVENT",
        "name": "Events",
        "source_type": "event",
        "channel": "event_offline",
        "default_quality_score": 70
    },
    {
        "code": "LANDING_PAGE",
        "name": "Landing Page",
        "source_type": "organic",
        "channel": "landing_page",
        "default_quality_score": 60
    },
    {
        "code": "TIKTOK_ORGANIC",
        "name": "TikTok Organic",
        "source_type": "social",
        "channel": "tiktok",
        "default_quality_score": 40
    },
    {
        "code": "TIKTOK_ADS",
        "name": "TikTok Ads",
        "source_type": "paid",
        "channel": "tiktok_ads",
        "default_quality_score": 40
    },
    {
        "code": "EMAIL",
        "name": "Email Campaign",
        "source_type": "email",
        "channel": "email_campaign",
        "default_quality_score": 55
    },
    {
        "code": "OTHER",
        "name": "Other",
        "source_type": "other",
        "channel": "other",
        "default_quality_score": 40
    }
]


# ============================================
# QUALITY SCORING WEIGHTS
# ============================================

QUALITY_SCORING_WEIGHTS = {
    "source_type": {
        "referral": 25,
        "direct": 20,
        "event": 18,
        "organic": 15,
        "partner": 15,
        "email": 12,
        "paid": 10,
        "social": 8,
        "other": 5
    },
    "budget": {
        "vip": 30,          # > 10B
        "high_value": 25,   # 5-10B
        "mid_value": 20,    # 2-5B
        "standard": 15,     # 1-2B
        "entry": 10         # < 1B
    },
    "engagement": {
        "per_interaction": 3,
        "max": 20
    },
    "urgency": {
        "immediate": 15,
        "short_term": 12,
        "medium_term": 8,
        "long_term": 4,
        "exploring": 2
    }
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_source_type(code: str) -> dict:
    """Get source type by code"""
    for st in LEAD_SOURCE_TYPES:
        if st["code"] == code:
            return st
    return None


def get_channel(code: str) -> dict:
    """Get channel by code"""
    for ch in LEAD_SOURCE_CHANNELS:
        if ch["code"] == code:
            return ch
    return None


def get_campaign_type(code: str) -> dict:
    """Get campaign type by code"""
    for ct in CAMPAIGN_TYPES:
        if ct["code"] == code:
            return ct
    return None


def get_campaign_status(code: str) -> dict:
    """Get campaign status by code"""
    for cs in CAMPAIGN_STATUSES:
        if cs["code"] == code:
            return cs
    return None


def get_assignment_rule_type(code: str) -> dict:
    """Get assignment rule type by code"""
    for rt in ASSIGNMENT_RULE_TYPES:
        if rt["code"] == code:
            return rt
    return None


def get_default_quality_score(source_type: str, channel: str = None) -> int:
    """Get default quality score for a source type"""
    st = get_source_type(source_type)
    if st:
        return st.get("default_quality_score", 50)
    return 50


def map_legacy_channel_to_source(channel: str) -> dict:
    """Map legacy Channel enum to lead source"""
    mapping = {
        "website": {"source_type": "organic", "channel": "website"},
        "facebook": {"source_type": "social", "channel": "facebook"},
        "tiktok": {"source_type": "social", "channel": "tiktok"},
        "youtube": {"source_type": "social", "channel": "youtube"},
        "linkedin": {"source_type": "social", "channel": "linkedin"},
        "zalo": {"source_type": "social", "channel": "zalo"},
        "google_ads": {"source_type": "paid", "channel": "google_ads"},
        "landing_page": {"source_type": "organic", "channel": "landing_page"},
        "email": {"source_type": "email", "channel": "email_campaign"},
        "phone": {"source_type": "direct", "channel": "phone_inbound"},
        "referral": {"source_type": "referral", "channel": "customer_referral"},
        "event": {"source_type": "event", "channel": "event_offline"},
    }
    return mapping.get(channel, {"source_type": "other", "channel": "other"})
