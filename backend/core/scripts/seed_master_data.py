"""
ProHouzing Master Data Seed Script
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation

Seeds system-level master data from existing enums.
Run this script to initialize master data tables.

Usage:
    python -m core.scripts.seed_master_data
    
Or from the API:
    POST /api/v1/admin/master-data/seed
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from core.models.master_data import MasterDataCategory, MasterDataItem
from core.models.base import Base
from core.enums import (
    SourceChannel, LeadStatus, IntentLevel,
    CustomerStage, ProductType, DealStage,
    LegalType, HandoverStandard, SalesChannel,
    TaskType, Priority, PaymentMethod, CommissionType
)


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

CATEGORIES = [
    # P0 - Critical
    {
        "category_code": "lead_source",
        "category_name": "Nguồn Lead",
        "category_name_en": "Lead Source",
        "description": "Kênh/nguồn thu hút khách hàng tiềm năng",
        "scope": "org",
        "module_code": "CRM",
        "is_system": True,
        "enum_class_name": "SourceChannel",
        "sort_order": 1,
    },
    {
        "category_code": "lead_status",
        "category_name": "Trạng thái Lead",
        "category_name_en": "Lead Status",
        "description": "Trạng thái xử lý lead trong quy trình bán hàng",
        "scope": "system",
        "module_code": "CRM",
        "is_system": True,
        "enum_class_name": "LeadStatus",
        "sort_order": 2,
    },
    {
        "category_code": "customer_stage",
        "category_name": "Giai đoạn khách hàng",
        "category_name_en": "Customer Stage",
        "description": "Giai đoạn trong vòng đời khách hàng",
        "scope": "system",
        "module_code": "CRM",
        "is_system": True,
        "enum_class_name": "CustomerStage",
        "sort_order": 3,
    },
    {
        "category_code": "deal_stage",
        "category_name": "Giai đoạn Deal",
        "category_name_en": "Deal Stage",
        "description": "Giai đoạn trong pipeline bán hàng",
        "scope": "org",
        "module_code": "Sales",
        "is_system": True,
        "enum_class_name": "DealStage",
        "sort_order": 4,
    },
    {
        "category_code": "product_type",
        "category_name": "Loại sản phẩm BĐS",
        "category_name_en": "Product Type",
        "description": "Loại hình bất động sản",
        "scope": "org",
        "module_code": "Inventory",
        "is_system": True,
        "enum_class_name": "ProductType",
        "sort_order": 5,
    },
    # P1 - Important
    {
        "category_code": "intent_level",
        "category_name": "Mức độ quan tâm",
        "category_name_en": "Intent Level",
        "description": "Mức độ quan tâm/ý định mua của khách hàng",
        "scope": "system",
        "module_code": "CRM",
        "is_system": True,
        "enum_class_name": "IntentLevel",
        "sort_order": 10,
    },
    {
        "category_code": "legal_type",
        "category_name": "Pháp lý",
        "category_name_en": "Legal Type",
        "description": "Tình trạng pháp lý bất động sản",
        "scope": "system",
        "module_code": "Inventory",
        "is_system": True,
        "enum_class_name": "LegalType",
        "sort_order": 11,
    },
    {
        "category_code": "handover_standard",
        "category_name": "Chuẩn bàn giao",
        "category_name_en": "Handover Standard",
        "description": "Tiêu chuẩn bàn giao bất động sản",
        "scope": "system",
        "module_code": "Inventory",
        "is_system": True,
        "enum_class_name": "HandoverStandard",
        "sort_order": 12,
    },
    {
        "category_code": "sales_channel",
        "category_name": "Kênh bán hàng",
        "category_name_en": "Sales Channel",
        "description": "Kênh/phương thức bán hàng",
        "scope": "org",
        "module_code": "Sales",
        "is_system": True,
        "enum_class_name": "SalesChannel",
        "sort_order": 13,
    },
    {
        "category_code": "task_type",
        "category_name": "Loại công việc",
        "category_name_en": "Task Type",
        "description": "Phân loại công việc/hoạt động",
        "scope": "system",
        "module_code": "Work",
        "is_system": True,
        "enum_class_name": "TaskType",
        "sort_order": 14,
    },
    {
        "category_code": "priority",
        "category_name": "Độ ưu tiên",
        "category_name_en": "Priority",
        "description": "Mức độ ưu tiên công việc",
        "scope": "system",
        "module_code": "Common",
        "is_system": True,
        "enum_class_name": "Priority",
        "sort_order": 15,
    },
    {
        "category_code": "payment_method",
        "category_name": "Phương thức thanh toán",
        "category_name_en": "Payment Method",
        "description": "Phương thức thanh toán",
        "scope": "system",
        "module_code": "Finance",
        "is_system": True,
        "enum_class_name": "PaymentMethod",
        "sort_order": 16,
    },
    # P2 - Nice to have
    {
        "category_code": "lost_reason",
        "category_name": "Lý do mất",
        "category_name_en": "Lost Reason",
        "description": "Lý do mất deal/lead",
        "scope": "org",
        "module_code": "Sales",
        "is_system": False,
        "allow_custom": True,
        "sort_order": 20,
    },
    {
        "category_code": "cancel_reason",
        "category_name": "Lý do hủy",
        "category_name_en": "Cancel Reason",
        "description": "Lý do hủy booking/deposit",
        "scope": "org",
        "module_code": "Sales",
        "is_system": False,
        "allow_custom": True,
        "sort_order": 21,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# ITEM DEFINITIONS (Mapping from Enums)
# ═══════════════════════════════════════════════════════════════════════════════

ITEMS_MAPPING = {
    "lead_source": {
        "enum": SourceChannel,
        "items": [
            {"code": "website", "label": "Website", "label_vi": "Website", "color": "#3B82F6", "icon": "globe", "aliases": ["web", "site"]},
            {"code": "facebook", "label": "Facebook", "label_vi": "Facebook", "color": "#1877F2", "icon": "facebook", "aliases": ["fb", "FB"]},
            {"code": "zalo", "label": "Zalo", "label_vi": "Zalo", "color": "#0068FF", "icon": "comment", "aliases": ["zl"]},
            {"code": "tiktok", "label": "TikTok", "label_vi": "TikTok", "color": "#000000", "icon": "tiktok", "aliases": ["tt"]},
            {"code": "google", "label": "Google Ads", "label_vi": "Quảng cáo Google", "color": "#EA4335", "icon": "google", "aliases": ["gg", "adwords"]},
            {"code": "youtube", "label": "YouTube", "label_vi": "YouTube", "color": "#FF0000", "icon": "youtube", "aliases": ["yt"]},
            {"code": "referral", "label": "Referral", "label_vi": "Giới thiệu", "color": "#10B981", "icon": "users", "aliases": ["ref", "gioi thieu"]},
            {"code": "direct", "label": "Direct", "label_vi": "Trực tiếp", "color": "#6B7280", "icon": "phone", "aliases": ["truc tiep"]},
            {"code": "event", "label": "Event", "label_vi": "Sự kiện", "color": "#8B5CF6", "icon": "calendar-alt", "aliases": ["su kien"]},
            {"code": "call_center", "label": "Call Center", "label_vi": "Tổng đài", "color": "#F59E0B", "icon": "headset", "aliases": ["hotline", "tong dai"]},
            {"code": "walk_in", "label": "Walk-in", "label_vi": "Khách đến", "color": "#EC4899", "icon": "walking", "aliases": ["walkin", "khach den"]},
            {"code": "email", "label": "Email", "label_vi": "Email", "color": "#6366F1", "icon": "envelope", "aliases": ["mail"]},
            {"code": "sms", "label": "SMS", "label_vi": "Tin nhắn SMS", "color": "#14B8A6", "icon": "sms", "aliases": ["tin nhan"]},
            {"code": "other", "label": "Other", "label_vi": "Khác", "color": "#9CA3AF", "icon": "ellipsis-h", "aliases": ["khac"]},
        ]
    },
    "lead_status": {
        "enum": LeadStatus,
        "items": [
            {"code": "new", "label": "New", "label_vi": "Mới", "color": "#3B82F6", "icon": "star", "is_default": True},
            {"code": "contacted", "label": "Contacted", "label_vi": "Đã liên hệ", "color": "#F59E0B", "icon": "phone"},
            {"code": "qualified", "label": "Qualified", "label_vi": "Đã sàng lọc", "color": "#10B981", "icon": "check-circle"},
            {"code": "converted", "label": "Converted", "label_vi": "Đã chuyển đổi", "color": "#8B5CF6", "icon": "exchange-alt"},
            {"code": "lost", "label": "Lost", "label_vi": "Mất", "color": "#EF4444", "icon": "times-circle"},
            {"code": "invalid", "label": "Invalid", "label_vi": "Không hợp lệ", "color": "#9CA3AF", "icon": "ban"},
        ]
    },
    "customer_stage": {
        "enum": CustomerStage,
        "items": [
            {"code": "lead", "label": "Lead", "label_vi": "Lead", "color": "#3B82F6", "icon": "user", "is_default": True},
            {"code": "prospect", "label": "Prospect", "label_vi": "Tiềm năng", "color": "#F59E0B", "icon": "user-check"},
            {"code": "customer", "label": "Customer", "label_vi": "Khách hàng", "color": "#10B981", "icon": "user-tie"},
            {"code": "vip", "label": "VIP", "label_vi": "VIP", "color": "#8B5CF6", "icon": "crown"},
            {"code": "churned", "label": "Churned", "label_vi": "Đã rời", "color": "#EF4444", "icon": "user-slash"},
        ]
    },
    "deal_stage": {
        "enum": DealStage,
        "items": [
            {"code": "new", "label": "New", "label_vi": "Mới tạo", "color": "#3B82F6", "icon": "plus-circle", "sort": 1, "is_default": True},
            {"code": "qualified", "label": "Qualified", "label_vi": "Đã sàng lọc", "color": "#06B6D4", "icon": "filter", "sort": 2},
            {"code": "viewing", "label": "Viewing", "label_vi": "Đang xem nhà", "color": "#8B5CF6", "icon": "eye", "sort": 3},
            {"code": "proposal", "label": "Proposal", "label_vi": "Đề xuất giá", "color": "#F59E0B", "icon": "file-invoice-dollar", "sort": 4},
            {"code": "negotiation", "label": "Negotiation", "label_vi": "Đàm phán", "color": "#EC4899", "icon": "handshake", "sort": 5},
            {"code": "booking", "label": "Booking", "label_vi": "Giữ chỗ", "color": "#10B981", "icon": "calendar-check", "sort": 6},
            {"code": "deposit", "label": "Deposit", "label_vi": "Đặt cọc", "color": "#14B8A6", "icon": "money-bill-wave", "sort": 7},
            {"code": "contract", "label": "Contract", "label_vi": "Ký hợp đồng", "color": "#6366F1", "icon": "file-signature", "sort": 8},
            {"code": "won", "label": "Won", "label_vi": "Thành công", "color": "#22C55E", "icon": "trophy", "sort": 9},
            {"code": "lost", "label": "Lost", "label_vi": "Mất deal", "color": "#EF4444", "icon": "times-circle", "sort": 10},
            {"code": "cancelled", "label": "Cancelled", "label_vi": "Hủy bỏ", "color": "#9CA3AF", "icon": "ban", "sort": 11},
        ]
    },
    "product_type": {
        "enum": ProductType,
        "items": [
            {"code": "apartment", "label": "Apartment", "label_vi": "Căn hộ", "color": "#3B82F6", "icon": "building"},
            {"code": "villa", "label": "Villa", "label_vi": "Biệt thự", "color": "#8B5CF6", "icon": "home"},
            {"code": "townhouse", "label": "Townhouse", "label_vi": "Nhà phố", "color": "#10B981", "icon": "house-user"},
            {"code": "shophouse", "label": "Shophouse", "label_vi": "Shophouse", "color": "#F59E0B", "icon": "store"},
            {"code": "office", "label": "Office", "label_vi": "Văn phòng", "color": "#6366F1", "icon": "briefcase"},
            {"code": "land", "label": "Land", "label_vi": "Đất nền", "color": "#14B8A6", "icon": "map"},
            {"code": "parking", "label": "Parking", "label_vi": "Chỗ đậu xe", "color": "#9CA3AF", "icon": "parking"},
            {"code": "studio", "label": "Studio", "label_vi": "Studio", "color": "#EC4899", "icon": "door-open"},
            {"code": "penthouse", "label": "Penthouse", "label_vi": "Penthouse", "color": "#EAB308", "icon": "crown"},
            {"code": "duplex", "label": "Duplex", "label_vi": "Duplex", "color": "#22D3EE", "icon": "layer-group"},
        ]
    },
    "intent_level": {
        "enum": IntentLevel,
        "items": [
            {"code": "low", "label": "Low", "label_vi": "Thấp", "color": "#9CA3AF", "icon": "thermometer-empty"},
            {"code": "medium", "label": "Medium", "label_vi": "Trung bình", "color": "#F59E0B", "icon": "thermometer-half", "is_default": True},
            {"code": "high", "label": "High", "label_vi": "Cao", "color": "#10B981", "icon": "thermometer-three-quarters"},
            {"code": "very_high", "label": "Very High", "label_vi": "Rất cao", "color": "#EF4444", "icon": "thermometer-full"},
        ]
    },
    "legal_type": {
        "enum": LegalType,
        "items": [
            {"code": "freehold", "label": "Freehold", "label_vi": "Sổ hồng/Sổ đỏ", "color": "#22C55E", "icon": "file-alt", "aliases": ["so hong", "so do", "sh"]},
            {"code": "leasehold", "label": "Leasehold", "label_vi": "Thuê dài hạn", "color": "#F59E0B", "icon": "clock", "aliases": ["thue"]},
            {"code": "pending", "label": "Pending", "label_vi": "Chưa có sổ", "color": "#9CA3AF", "icon": "hourglass-half", "aliases": ["chua co"]},
        ]
    },
    "handover_standard": {
        "enum": HandoverStandard,
        "items": [
            {"code": "bare", "label": "Bare Shell", "label_vi": "Thô", "color": "#9CA3AF", "icon": "hammer", "aliases": ["tho"]},
            {"code": "basic", "label": "Basic", "label_vi": "Cơ bản", "color": "#F59E0B", "icon": "tools", "aliases": ["co ban"]},
            {"code": "full", "label": "Full Finish", "label_vi": "Hoàn thiện", "color": "#10B981", "icon": "check-double", "aliases": ["hoan thien"]},
            {"code": "premium", "label": "Premium", "label_vi": "Cao cấp", "color": "#8B5CF6", "icon": "gem", "aliases": ["cao cap"]},
        ]
    },
    "sales_channel": {
        "enum": SalesChannel,
        "items": [
            {"code": "direct", "label": "Direct Sales", "label_vi": "Bán trực tiếp", "color": "#3B82F6", "icon": "user-tie", "is_default": True},
            {"code": "agency", "label": "Agency", "label_vi": "Qua đại lý", "color": "#8B5CF6", "icon": "building"},
            {"code": "online", "label": "Online", "label_vi": "Online", "color": "#10B981", "icon": "globe"},
            {"code": "referral", "label": "Referral", "label_vi": "Giới thiệu", "color": "#F59E0B", "icon": "users"},
        ]
    },
    "task_type": {
        "enum": TaskType,
        "items": [
            {"code": "call", "label": "Call", "label_vi": "Gọi điện", "color": "#3B82F6", "icon": "phone"},
            {"code": "email", "label": "Email", "label_vi": "Gửi email", "color": "#6366F1", "icon": "envelope"},
            {"code": "meeting", "label": "Meeting", "label_vi": "Họp", "color": "#8B5CF6", "icon": "users"},
            {"code": "visit", "label": "Site Visit", "label_vi": "Thăm dự án", "color": "#10B981", "icon": "map-marker-alt"},
            {"code": "document", "label": "Document", "label_vi": "Tài liệu", "color": "#F59E0B", "icon": "file-alt"},
            {"code": "follow_up", "label": "Follow-up", "label_vi": "Theo dõi", "color": "#EC4899", "icon": "redo"},
            {"code": "reminder", "label": "Reminder", "label_vi": "Nhắc nhở", "color": "#EAB308", "icon": "bell"},
            {"code": "approval", "label": "Approval", "label_vi": "Phê duyệt", "color": "#14B8A6", "icon": "check-circle"},
            {"code": "other", "label": "Other", "label_vi": "Khác", "color": "#9CA3AF", "icon": "ellipsis-h"},
        ]
    },
    "priority": {
        "enum": Priority,
        "items": [
            {"code": "low", "label": "Low", "label_vi": "Thấp", "color": "#9CA3AF", "icon": "arrow-down", "sort": 1},
            {"code": "medium", "label": "Medium", "label_vi": "Trung bình", "color": "#3B82F6", "icon": "minus", "sort": 2, "is_default": True},
            {"code": "high", "label": "High", "label_vi": "Cao", "color": "#F59E0B", "icon": "arrow-up", "sort": 3},
            {"code": "urgent", "label": "Urgent", "label_vi": "Khẩn cấp", "color": "#EF4444", "icon": "exclamation-triangle", "sort": 4},
        ]
    },
    "payment_method": {
        "enum": PaymentMethod,
        "items": [
            {"code": "cash", "label": "Cash", "label_vi": "Tiền mặt", "color": "#22C55E", "icon": "money-bill"},
            {"code": "transfer", "label": "Bank Transfer", "label_vi": "Chuyển khoản", "color": "#3B82F6", "icon": "university", "is_default": True},
            {"code": "card", "label": "Card", "label_vi": "Thẻ", "color": "#8B5CF6", "icon": "credit-card"},
            {"code": "check", "label": "Check", "label_vi": "Séc", "color": "#F59E0B", "icon": "money-check"},
            {"code": "crypto", "label": "Crypto", "label_vi": "Crypto", "color": "#6366F1", "icon": "bitcoin"},
        ]
    },
    # Custom categories without enum mapping
    "lost_reason": {
        "enum": None,
        "items": [
            {"code": "price_high", "label": "Price too high", "label_vi": "Giá quá cao", "color": "#EF4444", "icon": "dollar-sign"},
            {"code": "competitor", "label": "Lost to competitor", "label_vi": "Mất cho đối thủ", "color": "#F59E0B", "icon": "users"},
            {"code": "budget", "label": "No budget", "label_vi": "Không đủ ngân sách", "color": "#9CA3AF", "icon": "wallet"},
            {"code": "timing", "label": "Bad timing", "label_vi": "Thời điểm không phù hợp", "color": "#6366F1", "icon": "clock"},
            {"code": "no_response", "label": "No response", "label_vi": "Không phản hồi", "color": "#6B7280", "icon": "phone-slash"},
            {"code": "location", "label": "Location issue", "label_vi": "Vị trí không phù hợp", "color": "#EC4899", "icon": "map-marker-alt"},
            {"code": "product_mismatch", "label": "Product mismatch", "label_vi": "Sản phẩm không phù hợp", "color": "#14B8A6", "icon": "times"},
            {"code": "other", "label": "Other", "label_vi": "Lý do khác", "color": "#9CA3AF", "icon": "ellipsis-h"},
        ]
    },
    "cancel_reason": {
        "enum": None,
        "items": [
            {"code": "customer_request", "label": "Customer request", "label_vi": "Khách hàng yêu cầu", "color": "#3B82F6", "icon": "user"},
            {"code": "payment_issue", "label": "Payment issue", "label_vi": "Vấn đề thanh toán", "color": "#EF4444", "icon": "credit-card"},
            {"code": "document_issue", "label": "Document issue", "label_vi": "Vấn đề giấy tờ", "color": "#F59E0B", "icon": "file-alt"},
            {"code": "change_mind", "label": "Changed mind", "label_vi": "Đổi ý", "color": "#8B5CF6", "icon": "exchange-alt"},
            {"code": "product_issue", "label": "Product issue", "label_vi": "Vấn đề sản phẩm", "color": "#EC4899", "icon": "home"},
            {"code": "expired", "label": "Expired", "label_vi": "Hết hạn", "color": "#9CA3AF", "icon": "clock"},
            {"code": "other", "label": "Other", "label_vi": "Lý do khác", "color": "#6B7280", "icon": "ellipsis-h"},
        ]
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# SEED FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def create_tables():
    """Create master data tables if not exist"""
    Base.metadata.create_all(bind=engine)
    print("✓ Master data tables created")


def seed_category(db: Session, category_data: dict) -> MasterDataCategory:
    """Create or update a category"""
    existing = db.query(MasterDataCategory).filter(
        MasterDataCategory.category_code == category_data["category_code"],
        MasterDataCategory.org_id.is_(None)
    ).first()
    
    if existing:
        print(f"  → Category '{category_data['category_code']}' already exists, skipping")
        return existing
    
    category = MasterDataCategory(
        org_id=None,  # System-wide
        category_code=category_data["category_code"],
        category_name=category_data["category_name"],
        category_name_en=category_data.get("category_name_en"),
        description=category_data.get("description"),
        scope=category_data.get("scope", "system"),
        module_code=category_data.get("module_code"),
        is_system=category_data.get("is_system", True),
        is_hierarchical=category_data.get("is_hierarchical", False),
        is_multi_select=category_data.get("is_multi_select", False),
        allow_custom=category_data.get("allow_custom", True),
        sort_order=category_data.get("sort_order", 0),
        enum_class_name=category_data.get("enum_class_name"),
        status="active"
    )
    
    db.add(category)
    db.flush()
    print(f"  ✓ Created category: {category.category_code}")
    return category


def seed_items(db: Session, category: MasterDataCategory, items_config: dict):
    """Seed items for a category"""
    enum_class = items_config.get("enum")
    items = items_config.get("items", [])
    
    for idx, item_data in enumerate(items):
        existing = db.query(MasterDataItem).filter(
            MasterDataItem.category_id == category.id,
            MasterDataItem.item_code == item_data["code"],
            MasterDataItem.org_id.is_(None)
        ).first()
        
        if existing:
            continue
        
        # Get enum value if enum class exists
        enum_value = None
        if enum_class:
            try:
                enum_member = enum_class(item_data["code"])
                enum_value = enum_member.value
            except (ValueError, KeyError):
                enum_value = item_data["code"].upper()
        
        item = MasterDataItem(
            org_id=None,  # System-wide
            category_id=category.id,
            item_code=item_data["code"],
            item_label=item_data["label"],
            item_label_vi=item_data.get("label_vi", item_data["label"]),
            item_label_en=item_data.get("label_en", item_data["label"]),
            icon_code=item_data.get("icon"),
            color_code=item_data.get("color"),
            is_default=item_data.get("is_default", False),
            is_system=True,
            sort_order=item_data.get("sort", idx + 1),
            enum_value=enum_value,
            import_aliases=item_data.get("aliases"),
            status="active"
        )
        
        db.add(item)
    
    db.flush()
    item_count = len(items)
    print(f"    ✓ Seeded {item_count} items for {category.category_code}")


def seed_all(db: Session):
    """Seed all master data"""
    print("\n═══════════════════════════════════════════════════════")
    print("  SEEDING MASTER DATA")
    print("═══════════════════════════════════════════════════════\n")
    
    # Seed categories
    print("Creating categories...")
    for cat_data in CATEGORIES:
        category = seed_category(db, cat_data)
        
        # Seed items if mapping exists
        if category.category_code in ITEMS_MAPPING:
            seed_items(db, category, ITEMS_MAPPING[category.category_code])
    
    db.commit()
    print("\n✓ Master data seeding completed!")
    
    # Summary
    cat_count = db.query(MasterDataCategory).count()
    item_count = db.query(MasterDataItem).count()
    print(f"\nSummary:")
    print(f"  - Categories: {cat_count}")
    print(f"  - Items: {item_count}")


def get_seed_stats(db: Session) -> dict:
    """Get seeding statistics"""
    stats = {
        "categories": db.query(MasterDataCategory).count(),
        "items": db.query(MasterDataItem).count(),
        "categories_by_module": {}
    }
    
    # Group by module
    from sqlalchemy import func
    module_counts = db.query(
        MasterDataCategory.module_code,
        func.count(MasterDataCategory.id)
    ).group_by(MasterDataCategory.module_code).all()
    
    for module, count in module_counts:
        stats["categories_by_module"][module or "uncategorized"] = count
    
    return stats


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """Main entry point for seed script"""
    print("Starting Master Data seed process...")
    
    # Create tables
    create_tables()
    
    # Seed data
    db = SessionLocal()
    try:
        seed_all(db)
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
