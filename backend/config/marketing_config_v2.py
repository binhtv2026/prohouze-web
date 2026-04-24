"""
ProHouzing Marketing Configuration - Refactored
Prompt 13/20 - Standardized Omnichannel Marketing Engine

Configuration for:
- Channel Types
- Content Types
- Form Field Types
- Template Categories
- Attribution Models
- Content Statuses
- Publication Statuses
"""

from typing import Dict, List, Optional, Any


# ============================================
# CHANNEL TYPES
# ============================================

CHANNEL_TYPES: Dict[str, Dict[str, Any]] = {
    "facebook": {
        "value": "facebook",
        "label": "Facebook",
        "label_vi": "Facebook",
        "icon": "facebook",
        "color": "blue-600",
        "features": ["Lead Ads", "Messages", "Comments", "Auto-reply"],
        "credentials_fields": [
            {"key": "page_id", "label": "Page ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
            {"key": "app_id", "label": "App ID", "type": "text", "required": False},
            {"key": "app_secret", "label": "App Secret", "type": "password", "required": False},
        ],
    },
    "facebook_ads": {
        "value": "facebook_ads",
        "label": "Facebook Ads",
        "label_vi": "Facebook Ads",
        "icon": "facebook",
        "color": "blue-700",
        "features": ["Lead Ads", "Conversion Tracking", "Custom Audiences"],
        "credentials_fields": [
            {"key": "ad_account_id", "label": "Ad Account ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        ],
    },
    "tiktok": {
        "value": "tiktok",
        "label": "TikTok",
        "label_vi": "TikTok",
        "icon": "tiktok",
        "color": "gray-900",
        "features": ["Lead Gen Forms", "Comments", "Video Analytics"],
        "credentials_fields": [
            {"key": "business_id", "label": "Business ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        ],
    },
    "tiktok_ads": {
        "value": "tiktok_ads",
        "label": "TikTok Ads",
        "label_vi": "TikTok Ads",
        "icon": "tiktok",
        "color": "gray-800",
        "features": ["Lead Gen", "Conversion Tracking"],
        "credentials_fields": [
            {"key": "advertiser_id", "label": "Advertiser ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        ],
    },
    "youtube": {
        "value": "youtube",
        "label": "YouTube",
        "label_vi": "YouTube",
        "icon": "youtube",
        "color": "red-600",
        "features": ["Comments", "Video Analytics", "Subscribers"],
        "credentials_fields": [
            {"key": "channel_id", "label": "Channel ID", "type": "text", "required": True},
            {"key": "api_key", "label": "API Key", "type": "password", "required": True},
        ],
    },
    "linkedin": {
        "value": "linkedin",
        "label": "LinkedIn",
        "label_vi": "LinkedIn",
        "icon": "linkedin",
        "color": "blue-700",
        "features": ["Lead Gen Forms", "Posts", "Messages"],
        "credentials_fields": [
            {"key": "organization_id", "label": "Organization ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        ],
    },
    "zalo": {
        "value": "zalo",
        "label": "Zalo OA",
        "label_vi": "Zalo OA",
        "icon": "zalo",
        "color": "blue-500",
        "features": ["Messages", "ZNS", "Followers", "Auto-reply"],
        "credentials_fields": [
            {"key": "oa_id", "label": "OA ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
            {"key": "refresh_token", "label": "Refresh Token", "type": "password", "required": False},
            {"key": "secret_key", "label": "Secret Key", "type": "password", "required": False},
        ],
    },
    "zalo_ads": {
        "value": "zalo_ads",
        "label": "Zalo Ads",
        "label_vi": "Zalo Ads",
        "icon": "zalo",
        "color": "blue-600",
        "features": ["Advertising", "Lead Gen"],
        "credentials_fields": [
            {"key": "app_id", "label": "App ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        ],
    },
    "website": {
        "value": "website",
        "label": "Website",
        "label_vi": "Website",
        "icon": "globe",
        "color": "emerald-600",
        "features": ["Contact Forms", "Live Chat", "Tracking"],
        "credentials_fields": [
            {"key": "domain", "label": "Domain", "type": "text", "required": True},
            {"key": "api_key", "label": "API Key", "type": "text", "required": False},
        ],
    },
    "landing_page": {
        "value": "landing_page",
        "label": "Landing Page",
        "label_vi": "Landing Page",
        "icon": "globe",
        "color": "purple-600",
        "features": ["Forms", "Tracking", "A/B Testing"],
        "credentials_fields": [
            {"key": "url", "label": "URL", "type": "text", "required": True},
        ],
    },
    "email": {
        "value": "email",
        "label": "Email",
        "label_vi": "Email",
        "icon": "mail",
        "color": "orange-500",
        "features": ["Campaigns", "Automation", "Analytics"],
        "credentials_fields": [
            {"key": "provider", "label": "Provider", "type": "select", "required": True},
            {"key": "api_key", "label": "API Key", "type": "password", "required": True},
        ],
    },
    "sms": {
        "value": "sms",
        "label": "SMS",
        "label_vi": "SMS",
        "icon": "message",
        "color": "green-500",
        "features": ["Bulk SMS", "OTP", "Notifications"],
        "credentials_fields": [
            {"key": "provider", "label": "Provider", "type": "select", "required": True},
            {"key": "api_key", "label": "API Key", "type": "password", "required": True},
            {"key": "sender_id", "label": "Sender ID", "type": "text", "required": True},
        ],
    },
    "hotline": {
        "value": "hotline",
        "label": "Hotline",
        "label_vi": "Hotline",
        "icon": "phone",
        "color": "red-500",
        "features": ["Call Tracking", "IVR", "Recording"],
        "credentials_fields": [
            {"key": "phone_number", "label": "Phone Number", "type": "text", "required": True},
        ],
    },
    "google_ads": {
        "value": "google_ads",
        "label": "Google Ads",
        "label_vi": "Google Ads",
        "icon": "google",
        "color": "red-500",
        "features": ["Search Ads", "Display Ads", "Conversion Tracking"],
        "credentials_fields": [
            {"key": "customer_id", "label": "Customer ID", "type": "text", "required": True},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True},
        ],
    },
}


# ============================================
# CHANNEL STATUSES
# ============================================

CHANNEL_STATUSES: Dict[str, Dict[str, Any]] = {
    "pending": {
        "value": "pending",
        "label": "Pending",
        "label_vi": "Chờ kết nối",
        "color": "yellow",
    },
    "connected": {
        "value": "connected",
        "label": "Connected",
        "label_vi": "Đã kết nối",
        "color": "green",
    },
    "disconnected": {
        "value": "disconnected",
        "label": "Disconnected",
        "label_vi": "Đã ngắt kết nối",
        "color": "gray",
    },
    "error": {
        "value": "error",
        "label": "Error",
        "label_vi": "Lỗi",
        "color": "red",
    },
    "disabled": {
        "value": "disabled",
        "label": "Disabled",
        "label_vi": "Đã tắt",
        "color": "gray",
    },
}


# ============================================
# CONTENT TYPES
# ============================================

CONTENT_TYPES: Dict[str, Dict[str, Any]] = {
    "post": {
        "value": "post",
        "label": "Post",
        "label_vi": "Bài đăng",
        "icon": "file-text",
        "description": "Bài đăng tiêu chuẩn trên mạng xã hội",
    },
    "story": {
        "value": "story",
        "label": "Story",
        "label_vi": "Story",
        "icon": "image",
        "description": "Story/Status ngắn (24h)",
    },
    "reel": {
        "value": "reel",
        "label": "Reel/Short",
        "label_vi": "Reel/Short",
        "icon": "video",
        "description": "Video ngắn dọc (TikTok, Reels, Shorts)",
    },
    "video": {
        "value": "video",
        "label": "Video",
        "label_vi": "Video",
        "icon": "video",
        "description": "Video dài",
    },
    "carousel": {
        "value": "carousel",
        "label": "Carousel",
        "label_vi": "Carousel",
        "icon": "images",
        "description": "Bài đăng nhiều hình",
    },
    "article": {
        "value": "article",
        "label": "Article",
        "label_vi": "Bài viết dài",
        "icon": "file-text",
        "description": "Bài viết dài, blog",
    },
    "landing_page": {
        "value": "landing_page",
        "label": "Landing Page",
        "label_vi": "Landing Page",
        "icon": "layout",
        "description": "Trang đích chiến dịch",
    },
    "email_template": {
        "value": "email_template",
        "label": "Email Template",
        "label_vi": "Mẫu Email",
        "icon": "mail",
        "description": "Mẫu email marketing",
    },
    "ad_creative": {
        "value": "ad_creative",
        "label": "Ad Creative",
        "label_vi": "Quảng cáo",
        "icon": "megaphone",
        "description": "Nội dung quảng cáo",
    },
    "banner": {
        "value": "banner",
        "label": "Banner",
        "label_vi": "Banner",
        "icon": "image",
        "description": "Banner quảng cáo",
    },
}


# ============================================
# CONTENT STATUSES
# ============================================

CONTENT_STATUSES: Dict[str, Dict[str, Any]] = {
    "draft": {
        "value": "draft",
        "label": "Draft",
        "label_vi": "Bản nháp",
        "color": "gray",
        "icon": "file-text",
    },
    "pending_review": {
        "value": "pending_review",
        "label": "Pending Review",
        "label_vi": "Chờ duyệt",
        "color": "yellow",
        "icon": "clock",
    },
    "approved": {
        "value": "approved",
        "label": "Approved",
        "label_vi": "Đã duyệt",
        "color": "green",
        "icon": "check-circle",
    },
    "rejected": {
        "value": "rejected",
        "label": "Rejected",
        "label_vi": "Từ chối",
        "color": "red",
        "icon": "x-circle",
    },
    "scheduled": {
        "value": "scheduled",
        "label": "Scheduled",
        "label_vi": "Đã lên lịch",
        "color": "blue",
        "icon": "calendar",
    },
    "published": {
        "value": "published",
        "label": "Published",
        "label_vi": "Đã đăng",
        "color": "purple",
        "icon": "send",
    },
    "archived": {
        "value": "archived",
        "label": "Archived",
        "label_vi": "Đã lưu trữ",
        "color": "gray",
        "icon": "archive",
    },
}


# ============================================
# PUBLICATION STATUSES
# ============================================

PUBLICATION_STATUSES: Dict[str, Dict[str, Any]] = {
    "pending": {
        "value": "pending",
        "label": "Pending",
        "label_vi": "Chờ đăng",
        "color": "yellow",
    },
    "published": {
        "value": "published",
        "label": "Published",
        "label_vi": "Đã đăng",
        "color": "green",
    },
    "failed": {
        "value": "failed",
        "label": "Failed",
        "label_vi": "Thất bại",
        "color": "red",
    },
    "deleted": {
        "value": "deleted",
        "label": "Deleted",
        "label_vi": "Đã xóa",
        "color": "gray",
    },
}


# ============================================
# FORM FIELD TYPES
# ============================================

FORM_FIELD_TYPES: Dict[str, Dict[str, Any]] = {
    "text": {
        "value": "text",
        "label": "Text",
        "label_vi": "Văn bản",
        "icon": "text",
    },
    "email": {
        "value": "email",
        "label": "Email",
        "label_vi": "Email",
        "icon": "mail",
    },
    "phone": {
        "value": "phone",
        "label": "Phone",
        "label_vi": "Số điện thoại",
        "icon": "phone",
    },
    "select": {
        "value": "select",
        "label": "Select",
        "label_vi": "Chọn một",
        "icon": "list",
    },
    "multiselect": {
        "value": "multiselect",
        "label": "Multi-Select",
        "label_vi": "Chọn nhiều",
        "icon": "list",
    },
    "checkbox": {
        "value": "checkbox",
        "label": "Checkbox",
        "label_vi": "Hộp kiểm",
        "icon": "check-square",
    },
    "radio": {
        "value": "radio",
        "label": "Radio",
        "label_vi": "Nút radio",
        "icon": "circle",
    },
    "textarea": {
        "value": "textarea",
        "label": "Textarea",
        "label_vi": "Vùng văn bản",
        "icon": "align-left",
    },
    "date": {
        "value": "date",
        "label": "Date",
        "label_vi": "Ngày",
        "icon": "calendar",
    },
    "number": {
        "value": "number",
        "label": "Number",
        "label_vi": "Số",
        "icon": "hash",
    },
    "hidden": {
        "value": "hidden",
        "label": "Hidden",
        "label_vi": "Ẩn",
        "icon": "eye-off",
    },
    "file": {
        "value": "file",
        "label": "File",
        "label_vi": "Tệp tin",
        "icon": "upload",
    },
}


# ============================================
# FORM STATUSES
# ============================================

FORM_STATUSES: Dict[str, Dict[str, Any]] = {
    "draft": {
        "value": "draft",
        "label": "Draft",
        "label_vi": "Bản nháp",
        "color": "gray",
    },
    "active": {
        "value": "active",
        "label": "Active",
        "label_vi": "Hoạt động",
        "color": "green",
    },
    "paused": {
        "value": "paused",
        "label": "Paused",
        "label_vi": "Tạm dừng",
        "color": "yellow",
    },
    "archived": {
        "value": "archived",
        "label": "Archived",
        "label_vi": "Đã lưu trữ",
        "color": "gray",
    },
}


# ============================================
# FORM SUBMISSION STATUSES
# ============================================

FORM_SUBMISSION_STATUSES: Dict[str, Dict[str, Any]] = {
    "received": {
        "value": "received",
        "label": "Received",
        "label_vi": "Đã nhận",
        "color": "blue",
    },
    "processing": {
        "value": "processing",
        "label": "Processing",
        "label_vi": "Đang xử lý",
        "color": "yellow",
    },
    "completed": {
        "value": "completed",
        "label": "Completed",
        "label_vi": "Hoàn thành",
        "color": "green",
    },
    "duplicate": {
        "value": "duplicate",
        "label": "Duplicate",
        "label_vi": "Trùng lặp",
        "color": "orange",
    },
    "invalid": {
        "value": "invalid",
        "label": "Invalid",
        "label_vi": "Không hợp lệ",
        "color": "red",
    },
    "spam": {
        "value": "spam",
        "label": "Spam",
        "label_vi": "Spam",
        "color": "red",
    },
}


# ============================================
# TEMPLATE CATEGORIES
# ============================================

TEMPLATE_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "greeting": {
        "value": "greeting",
        "label": "Greeting",
        "label_vi": "Chào hỏi",
        "icon": "wave",
        "description": "Tin nhắn chào đón khách hàng mới",
    },
    "project_info": {
        "value": "project_info",
        "label": "Project Info",
        "label_vi": "Thông tin dự án",
        "icon": "building",
        "description": "Câu trả lời về dự án BĐS",
    },
    "pricing": {
        "value": "pricing",
        "label": "Pricing",
        "label_vi": "Giá cả",
        "icon": "dollar",
        "description": "Thông tin về giá và thanh toán",
    },
    "appointment": {
        "value": "appointment",
        "label": "Appointment",
        "label_vi": "Đặt lịch hẹn",
        "icon": "calendar",
        "description": "Hỗ trợ đặt lịch xem nhà",
    },
    "faq": {
        "value": "faq",
        "label": "FAQ",
        "label_vi": "FAQ",
        "icon": "help-circle",
        "description": "Câu hỏi thường gặp",
    },
    "objection_handling": {
        "value": "objection_handling",
        "label": "Objection Handling",
        "label_vi": "Xử lý phản đối",
        "icon": "shield",
        "description": "Phản hồi các thắc mắc, lo ngại",
    },
    "follow_up": {
        "value": "follow_up",
        "label": "Follow-up",
        "label_vi": "Follow-up",
        "icon": "refresh",
        "description": "Tin nhắn follow-up, nurture",
    },
    "closing": {
        "value": "closing",
        "label": "Closing",
        "label_vi": "Chốt sale",
        "icon": "target",
        "description": "Tin nhắn chốt deal",
    },
    "out_of_hours": {
        "value": "out_of_hours",
        "label": "Out of Hours",
        "label_vi": "Ngoài giờ",
        "icon": "moon",
        "description": "Tin nhắn ngoài giờ làm việc",
    },
    "thank_you": {
        "value": "thank_you",
        "label": "Thank You",
        "label_vi": "Cảm ơn",
        "icon": "heart",
        "description": "Tin nhắn cảm ơn",
    },
}


# ============================================
# TEMPLATE STATUSES
# ============================================

TEMPLATE_STATUSES: Dict[str, Dict[str, Any]] = {
    "draft": {
        "value": "draft",
        "label": "Draft",
        "label_vi": "Bản nháp",
        "color": "gray",
    },
    "pending_approval": {
        "value": "pending_approval",
        "label": "Pending Approval",
        "label_vi": "Chờ duyệt",
        "color": "yellow",
    },
    "approved": {
        "value": "approved",
        "label": "Approved",
        "label_vi": "Đã duyệt",
        "color": "green",
    },
    "rejected": {
        "value": "rejected",
        "label": "Rejected",
        "label_vi": "Từ chối",
        "color": "red",
    },
    "archived": {
        "value": "archived",
        "label": "Archived",
        "label_vi": "Đã lưu trữ",
        "color": "gray",
    },
}


# ============================================
# ATTRIBUTION MODELS
# ============================================

ATTRIBUTION_MODELS: Dict[str, Dict[str, Any]] = {
    "first_touch": {
        "value": "first_touch",
        "label": "First Touch",
        "label_vi": "Điểm chạm đầu tiên",
        "description": "100% credit cho touchpoint đầu tiên",
    },
    "last_touch": {
        "value": "last_touch",
        "label": "Last Touch",
        "label_vi": "Điểm chạm cuối cùng",
        "description": "100% credit cho touchpoint cuối cùng",
    },
    "linear": {
        "value": "linear",
        "label": "Linear",
        "label_vi": "Tuyến tính",
        "description": "Chia đều credit cho tất cả touchpoints",
    },
    "time_decay": {
        "value": "time_decay",
        "label": "Time Decay",
        "label_vi": "Giảm dần theo thời gian",
        "description": "Touchpoints gần conversion nhận nhiều credit hơn",
    },
    "position_based": {
        "value": "position_based",
        "label": "Position Based",
        "label_vi": "Dựa trên vị trí",
        "description": "40% đầu, 40% cuối, 20% giữa",
    },
    "custom": {
        "value": "custom",
        "label": "Custom",
        "label_vi": "Tùy chỉnh",
        "description": "Mô hình attribution tùy chỉnh",
    },
}


# ============================================
# TEMPLATE VARIABLES
# ============================================

TEMPLATE_VARIABLES: List[Dict[str, str]] = [
    {"name": "{{name}}", "description": "Tên khách hàng", "source": "contact.full_name"},
    {"name": "{{phone}}", "description": "SĐT khách hàng", "source": "contact.phone"},
    {"name": "{{email}}", "description": "Email khách hàng", "source": "contact.email"},
    {"name": "{{project}}", "description": "Tên dự án", "source": "project.name"},
    {"name": "{{project_location}}", "description": "Vị trí dự án", "source": "project.location"},
    {"name": "{{price}}", "description": "Giá dự án", "source": "project.price_from"},
    {"name": "{{sales_name}}", "description": "Tên sales phụ trách", "source": "assigned_user.full_name"},
    {"name": "{{sales_phone}}", "description": "SĐT sales", "source": "assigned_user.phone"},
    {"name": "{{company}}", "description": "Tên công ty", "source": "system.company_name"},
    {"name": "{{date}}", "description": "Ngày hiện tại", "source": "system.current_date"},
    {"name": "{{time}}", "description": "Giờ hiện tại", "source": "system.current_time"},
]


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_channel_type(channel_type: str) -> Optional[Dict]:
    """Get channel type config"""
    return CHANNEL_TYPES.get(channel_type)


def get_channel_status(status: str) -> Optional[Dict]:
    """Get channel status config"""
    return CHANNEL_STATUSES.get(status)


def get_content_type(content_type: str) -> Optional[Dict]:
    """Get content type config"""
    return CONTENT_TYPES.get(content_type)


def get_content_status(status: str) -> Optional[Dict]:
    """Get content status config"""
    return CONTENT_STATUSES.get(status)


def get_publication_status(status: str) -> Optional[Dict]:
    """Get publication status config"""
    return PUBLICATION_STATUSES.get(status)


def get_form_field_type(field_type: str) -> Optional[Dict]:
    """Get form field type config"""
    return FORM_FIELD_TYPES.get(field_type)


def get_form_status(status: str) -> Optional[Dict]:
    """Get form status config"""
    return FORM_STATUSES.get(status)


def get_form_submission_status(status: str) -> Optional[Dict]:
    """Get form submission status config"""
    return FORM_SUBMISSION_STATUSES.get(status)


def get_template_category(category: str) -> Optional[Dict]:
    """Get template category config"""
    return TEMPLATE_CATEGORIES.get(category)


def get_template_status(status: str) -> Optional[Dict]:
    """Get template status config"""
    return TEMPLATE_STATUSES.get(status)


def get_attribution_model(model: str) -> Optional[Dict]:
    """Get attribution model config"""
    return ATTRIBUTION_MODELS.get(model)
