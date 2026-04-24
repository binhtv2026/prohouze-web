"""
ProHouzing CMS Configuration - Prompt 14/20
Website CMS / Landing Page / SEO Engine

Canonical configurations for public content management system
"""

from enum import Enum
from typing import Dict, List, Any

# ==================== CONTENT STATUS ====================

class ContentStatus(str, Enum):
    """Publishing workflow status for all CMS content"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    UNPUBLISHED = "unpublished"

CONTENT_STATUS_CONFIG = {
    "draft": {
        "label": "Bản nháp",
        "label_en": "Draft",
        "color": "gray",
        "is_public": False,
        "can_edit": True,
        "transitions": ["pending_review", "scheduled", "published"]
    },
    "pending_review": {
        "label": "Chờ duyệt",
        "label_en": "Pending Review",
        "color": "yellow",
        "is_public": False,
        "can_edit": True,
        "transitions": ["draft", "scheduled", "published", "archived"]
    },
    "scheduled": {
        "label": "Đã lên lịch",
        "label_en": "Scheduled",
        "color": "blue",
        "is_public": False,
        "can_edit": True,
        "transitions": ["draft", "published", "archived"]
    },
    "published": {
        "label": "Đã xuất bản",
        "label_en": "Published",
        "color": "green",
        "is_public": True,
        "can_edit": True,
        "transitions": ["unpublished", "archived"]
    },
    "unpublished": {
        "label": "Đã gỡ",
        "label_en": "Unpublished",
        "color": "orange",
        "is_public": False,
        "can_edit": True,
        "transitions": ["draft", "published", "archived"]
    },
    "archived": {
        "label": "Lưu trữ",
        "label_en": "Archived",
        "color": "red",
        "is_public": False,
        "can_edit": False,
        "transitions": ["draft"]
    }
}

# ==================== PAGE TYPES ====================

class PageType(str, Enum):
    """Types of website pages"""
    STATIC = "static"           # About, Contact, FAQ, Policy pages
    LANDING = "landing"         # Campaign landing pages
    PROJECT = "project"         # Project public profile
    ARTICLE = "article"         # News/Blog article
    CATEGORY = "category"       # Category listing page

PAGE_TYPE_CONFIG = {
    "static": {
        "label": "Trang tĩnh",
        "label_en": "Static Page",
        "description": "Các trang cố định như Giới thiệu, Liên hệ, FAQ",
        "has_seo": True,
        "has_form": True,
        "templates": ["default", "full_width", "sidebar", "contact"]
    },
    "landing": {
        "label": "Landing Page",
        "label_en": "Landing Page",
        "description": "Trang đích chiến dịch marketing với form capture",
        "has_seo": True,
        "has_form": True,
        "has_campaign_link": True,
        "templates": ["hero_cta", "multi_section", "video_hero", "comparison"]
    },
    "project": {
        "label": "Trang dự án",
        "label_en": "Project Page",
        "description": "Trang thông tin công khai dự án BĐS",
        "has_seo": True,
        "has_form": True,
        "source_entity": "projects_master",
        "templates": ["project_full", "project_simple", "project_gallery"]
    },
    "article": {
        "label": "Bài viết",
        "label_en": "Article",
        "description": "Bài viết tin tức, blog",
        "has_seo": True,
        "has_form": False,
        "templates": ["article_default", "article_featured", "article_gallery"]
    },
    "category": {
        "label": "Trang danh mục",
        "label_en": "Category Page",
        "description": "Trang liệt kê danh mục nội dung",
        "has_seo": True,
        "has_form": False,
        "templates": ["grid", "list", "masonry"]
    }
}

# ==================== ARTICLE CATEGORIES ====================

class ArticleCategory(str, Enum):
    """Categories for news/blog articles"""
    MARKET = "market"           # Thị trường
    PROJECT = "project"         # Tin dự án
    COMPANY = "company"         # Tin công ty
    TIPS = "tips"               # Kiến thức/Hướng dẫn
    LEGAL = "legal"             # Pháp lý
    INVESTMENT = "investment"   # Đầu tư
    LIFESTYLE = "lifestyle"     # Phong cách sống

ARTICLE_CATEGORY_CONFIG = {
    "market": {
        "label": "Thị trường",
        "label_en": "Market",
        "color": "blue",
        "icon": "trending-up"
    },
    "project": {
        "label": "Tin dự án",
        "label_en": "Project News",
        "color": "green",
        "icon": "building"
    },
    "company": {
        "label": "Tin công ty",
        "label_en": "Company News",
        "color": "purple",
        "icon": "briefcase"
    },
    "tips": {
        "label": "Kiến thức",
        "label_en": "Tips & Guides",
        "color": "orange",
        "icon": "lightbulb"
    },
    "legal": {
        "label": "Pháp lý",
        "label_en": "Legal",
        "color": "gray",
        "icon": "scale"
    },
    "investment": {
        "label": "Đầu tư",
        "label_en": "Investment",
        "color": "yellow",
        "icon": "chart-bar"
    },
    "lifestyle": {
        "label": "Phong cách sống",
        "label_en": "Lifestyle",
        "color": "pink",
        "icon": "home"
    }
}

# ==================== STATIC PAGE TYPES ====================

class StaticPageType(str, Enum):
    """Pre-defined static page types"""
    ABOUT = "about"
    CONTACT = "contact"
    FAQ = "faq"
    PRIVACY = "privacy"
    TERMS = "terms"
    CAREERS_LIST = "careers_list"
    PARTNERS = "partners"
    CUSTOM = "custom"

STATIC_PAGE_CONFIG = {
    "about": {
        "label": "Giới thiệu",
        "label_en": "About Us",
        "default_slug": "gioi-thieu",
        "is_system": True,
        "template": "about"
    },
    "contact": {
        "label": "Liên hệ",
        "label_en": "Contact",
        "default_slug": "lien-he",
        "is_system": True,
        "template": "contact",
        "has_form": True
    },
    "faq": {
        "label": "Câu hỏi thường gặp",
        "label_en": "FAQ",
        "default_slug": "hoi-dap",
        "is_system": True,
        "template": "faq"
    },
    "privacy": {
        "label": "Chính sách bảo mật",
        "label_en": "Privacy Policy",
        "default_slug": "chinh-sach-bao-mat",
        "is_system": True,
        "template": "policy"
    },
    "terms": {
        "label": "Điều khoản sử dụng",
        "label_en": "Terms of Service",
        "default_slug": "dieu-khoan-su-dung",
        "is_system": True,
        "template": "policy"
    },
    "careers_list": {
        "label": "Tuyển dụng",
        "label_en": "Careers",
        "default_slug": "tuyen-dung",
        "is_system": True,
        "template": "careers"
    },
    "partners": {
        "label": "Đối tác",
        "label_en": "Partners",
        "default_slug": "doi-tac",
        "is_system": True,
        "template": "partners"
    },
    "custom": {
        "label": "Trang tùy chỉnh",
        "label_en": "Custom Page",
        "default_slug": None,
        "is_system": False,
        "template": "default"
    }
}

# ==================== LANDING PAGE TYPES ====================

class LandingPageType(str, Enum):
    """Types of landing pages"""
    PROJECT_PROMO = "project_promo"     # Quảng cáo dự án cụ thể
    EVENT = "event"                      # Sự kiện mở bán
    LEAD_CAPTURE = "lead_capture"        # Thu thập lead chung
    COMPARISON = "comparison"            # So sánh dự án
    PROMOTION = "promotion"              # Khuyến mãi

LANDING_PAGE_CONFIG = {
    "project_promo": {
        "label": "Quảng cáo dự án",
        "label_en": "Project Promotion",
        "requires_project": True,
        "has_campaign_link": True,
        "default_template": "hero_cta"
    },
    "event": {
        "label": "Sự kiện mở bán",
        "label_en": "Sales Event",
        "requires_project": False,
        "has_campaign_link": True,
        "default_template": "event_countdown"
    },
    "lead_capture": {
        "label": "Thu thập lead",
        "label_en": "Lead Capture",
        "requires_project": False,
        "has_campaign_link": True,
        "default_template": "simple_form"
    },
    "comparison": {
        "label": "So sánh dự án",
        "label_en": "Project Comparison",
        "requires_project": False,
        "has_campaign_link": True,
        "default_template": "comparison_table"
    },
    "promotion": {
        "label": "Khuyến mãi",
        "label_en": "Promotion",
        "requires_project": False,
        "has_campaign_link": True,
        "default_template": "promo_hero"
    }
}

# ==================== PARTNER CATEGORIES ====================

class PartnerCategory(str, Enum):
    """Categories for partner companies"""
    DEVELOPER = "developer"
    BANK = "bank"
    AGENCY = "agency"
    CONTRACTOR = "contractor"
    CONSULTANT = "consultant"
    OTHER = "other"

PARTNER_CATEGORY_CONFIG = {
    "developer": {
        "label": "Chủ đầu tư",
        "label_en": "Developer",
        "color": "blue"
    },
    "bank": {
        "label": "Ngân hàng",
        "label_en": "Bank",
        "color": "green"
    },
    "agency": {
        "label": "Đại lý",
        "label_en": "Agency",
        "color": "purple"
    },
    "contractor": {
        "label": "Nhà thầu",
        "label_en": "Contractor",
        "color": "orange"
    },
    "consultant": {
        "label": "Tư vấn",
        "label_en": "Consultant",
        "color": "yellow"
    },
    "other": {
        "label": "Khác",
        "label_en": "Other",
        "color": "gray"
    }
}

# ==================== TESTIMONIAL CATEGORIES ====================

class TestimonialCategory(str, Enum):
    """Categories for testimonials"""
    BUYER = "buyer"             # Khách mua nhà
    INVESTOR = "investor"       # Nhà đầu tư
    CTV = "ctv"                 # Cộng tác viên
    AGENCY = "agency"           # Đại lý

TESTIMONIAL_CATEGORY_CONFIG = {
    "buyer": {
        "label": "Khách hàng",
        "label_en": "Home Buyer",
        "color": "blue"
    },
    "investor": {
        "label": "Nhà đầu tư",
        "label_en": "Investor",
        "color": "green"
    },
    "ctv": {
        "label": "Cộng tác viên",
        "label_en": "Collaborator",
        "color": "purple"
    },
    "agency": {
        "label": "Đại lý",
        "label_en": "Agency",
        "color": "orange"
    }
}

# ==================== MEDIA ASSET TYPES ====================

class MediaAssetType(str, Enum):
    """Types of media assets"""
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    BROCHURE = "brochure"
    FLOOR_PLAN = "floor_plan"
    VIRTUAL_TOUR = "virtual_tour"

MEDIA_ASSET_CONFIG = {
    "image": {
        "label": "Hình ảnh",
        "label_en": "Image",
        "extensions": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
        "max_size_mb": 10
    },
    "video": {
        "label": "Video",
        "label_en": "Video",
        "extensions": [".mp4", ".mov", ".webm"],
        "max_size_mb": 500
    },
    "document": {
        "label": "Tài liệu",
        "label_en": "Document",
        "extensions": [".pdf", ".doc", ".docx"],
        "max_size_mb": 50
    },
    "brochure": {
        "label": "Brochure",
        "label_en": "Brochure",
        "extensions": [".pdf"],
        "max_size_mb": 100
    },
    "floor_plan": {
        "label": "Mặt bằng",
        "label_en": "Floor Plan",
        "extensions": [".jpg", ".jpeg", ".png", ".pdf"],
        "max_size_mb": 20
    },
    "virtual_tour": {
        "label": "Tour 360",
        "label_en": "Virtual Tour",
        "extensions": [],  # Usually external URL
        "max_size_mb": 0
    }
}

# ==================== SEO CONFIGURATION ====================

SEO_CONFIG = {
    "title_max_length": 60,
    "description_max_length": 160,
    "og_title_max_length": 60,
    "og_description_max_length": 200,
    "default_robots": "index, follow",
    "robots_options": [
        "index, follow",
        "noindex, follow",
        "index, nofollow",
        "noindex, nofollow"
    ],
    "schema_types": [
        "Article",
        "NewsArticle",
        "BlogPosting",
        "RealEstateAgent",
        "Product",
        "Organization",
        "LocalBusiness",
        "FAQPage"
    ]
}

# ==================== VISIBILITY CONTROLS ====================

class VisibilityLevel(str, Enum):
    """Visibility levels for content fields"""
    PUBLIC = "public"           # Hiển thị công khai
    REGISTERED = "registered"   # Chỉ user đăng nhập
    INTERNAL = "internal"       # Chỉ nhân viên nội bộ
    PRIVATE = "private"         # Chỉ admin

VISIBILITY_CONFIG = {
    "public": {
        "label": "Công khai",
        "label_en": "Public",
        "requires_auth": False,
        "roles": []
    },
    "registered": {
        "label": "Thành viên",
        "label_en": "Registered Users",
        "requires_auth": True,
        "roles": []
    },
    "internal": {
        "label": "Nội bộ",
        "label_en": "Internal Only",
        "requires_auth": True,
        "roles": ["sales", "marketing", "manager", "admin", "bod"]
    },
    "private": {
        "label": "Riêng tư",
        "label_en": "Private",
        "requires_auth": True,
        "roles": ["admin", "bod"]
    }
}

# ==================== PUBLIC PROJECT FIELDS ====================

# Fields from Project Master that are safe to expose publicly
PUBLIC_PROJECT_FIELDS = {
    "always_public": [
        "name",
        "slug",
        "description",
        "location",
        "district",
        "city",
        "developer_name",
        "project_type",
        "total_units",
        "total_area",
        "amenities",
        "images",
        "status"
    ],
    "configurable": [
        "price_from",
        "price_to",
        "handover_date",
        "legal_status",
        "progress_percentage",
        "available_units",
        "sold_units"
    ],
    "never_public": [
        "commission_rate",
        "internal_notes",
        "cost_breakdown",
        "financial_data",
        "sales_targets"
    ]
}

# ==================== FORM CONFIGURATION ====================

CMS_FORM_CONFIG = {
    "contact_form": {
        "label": "Form liên hệ",
        "fields": ["name", "phone", "email", "message"],
        "required": ["name", "phone"],
        "creates_lead": True
    },
    "project_inquiry": {
        "label": "Form quan tâm dự án",
        "fields": ["name", "phone", "email", "project_interest", "budget", "message"],
        "required": ["name", "phone"],
        "creates_lead": True
    },
    "newsletter": {
        "label": "Đăng ký nhận tin",
        "fields": ["email", "name"],
        "required": ["email"],
        "creates_lead": False,
        "creates_subscriber": True
    },
    "career_apply": {
        "label": "Ứng tuyển",
        "fields": ["name", "phone", "email", "cv_file", "cover_letter"],
        "required": ["name", "phone", "email"],
        "creates_lead": False,
        "creates_application": True
    },
    "consultation": {
        "label": "Đặt lịch tư vấn",
        "fields": ["name", "phone", "email", "preferred_date", "preferred_time", "message"],
        "required": ["name", "phone"],
        "creates_lead": True
    }
}

# ==================== CTA TYPES ====================

class CTAType(str, Enum):
    """Types of Call-to-Action buttons"""
    PHONE = "phone"
    FORM = "form"
    LINK = "link"
    DOWNLOAD = "download"
    CHAT = "chat"
    SCHEDULE = "schedule"

CTA_TYPE_CONFIG = {
    "phone": {
        "label": "Gọi điện",
        "label_en": "Call Now",
        "icon": "phone",
        "action": "tel:"
    },
    "form": {
        "label": "Mở form",
        "label_en": "Open Form",
        "icon": "clipboard",
        "action": "open_form"
    },
    "link": {
        "label": "Đi đến link",
        "label_en": "Go to Link",
        "icon": "external-link",
        "action": "navigate"
    },
    "download": {
        "label": "Tải xuống",
        "label_en": "Download",
        "icon": "download",
        "action": "download"
    },
    "chat": {
        "label": "Chat ngay",
        "label_en": "Chat Now",
        "icon": "message-circle",
        "action": "open_chat"
    },
    "schedule": {
        "label": "Đặt lịch",
        "label_en": "Schedule",
        "icon": "calendar",
        "action": "open_scheduler"
    }
}


def get_content_status_config() -> Dict[str, Any]:
    return CONTENT_STATUS_CONFIG

def get_page_type_config() -> Dict[str, Any]:
    return PAGE_TYPE_CONFIG

def get_article_category_config() -> Dict[str, Any]:
    return ARTICLE_CATEGORY_CONFIG

def get_static_page_config() -> Dict[str, Any]:
    return STATIC_PAGE_CONFIG

def get_landing_page_config() -> Dict[str, Any]:
    return LANDING_PAGE_CONFIG

def get_partner_category_config() -> Dict[str, Any]:
    return PARTNER_CATEGORY_CONFIG

def get_testimonial_category_config() -> Dict[str, Any]:
    return TESTIMONIAL_CATEGORY_CONFIG

def get_media_asset_config() -> Dict[str, Any]:
    return MEDIA_ASSET_CONFIG

def get_seo_config() -> Dict[str, Any]:
    return SEO_CONFIG

def get_visibility_config() -> Dict[str, Any]:
    return VISIBILITY_CONFIG

def get_cta_type_config() -> Dict[str, Any]:
    return CTA_TYPE_CONFIG

def get_cms_form_config() -> Dict[str, Any]:
    return CMS_FORM_CONFIG
