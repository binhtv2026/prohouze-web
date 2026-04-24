"""
ProHouzing Master Data Configuration
Version: 1.0 - Prompt 3/20

SINGLE SOURCE OF TRUTH for all picklists, statuses, categories, and master data
This file should be the ONLY place where these values are defined in the backend

Structure:
- Each category has: code (unique ID), label, and optional metadata
- Categories support grouping, ordering, and activation status
- All data follows a consistent schema for frontend consumption
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum


# ============================================
# DATA STRUCTURES
# ============================================

class MasterDataItem(BaseModel):
    """Base model for a single master data item"""
    code: str
    label: str
    label_en: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    group: Optional[str] = None
    order: int = 0
    is_active: bool = True
    metadata: Dict[str, Any] = {}


class MasterDataCategory(BaseModel):
    """A category of master data items"""
    key: str
    label: str
    label_en: Optional[str] = None
    description: Optional[str] = None
    items: List[MasterDataItem]
    is_editable: bool = True  # Can tenant customize this?
    is_extendable: bool = True  # Can tenant add new items?


# ============================================
# LEAD STATUSES
# ============================================

LEAD_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="new", label="Mới", label_en="New", color="bg-slate-100 text-slate-700", order=1, group="prospect"),
    MasterDataItem(code="contacted", label="Đã liên hệ", label_en="Contacted", color="bg-blue-100 text-blue-700", order=2, group="prospect"),
    MasterDataItem(code="called", label="Đã gọi điện", label_en="Called", color="bg-blue-100 text-blue-700", order=3, group="prospect"),
    MasterDataItem(code="warm", label="Ấm", label_en="Warm", color="bg-amber-100 text-amber-700", order=4, group="engaged"),
    MasterDataItem(code="hot", label="Nóng", label_en="Hot", color="bg-red-100 text-red-700", order=5, group="engaged"),
    MasterDataItem(code="viewing", label="Đã xem nhà", label_en="Site Visit", color="bg-purple-100 text-purple-700", order=6, group="engaged"),
    MasterDataItem(code="qualified", label="Đủ điều kiện", label_en="Qualified", color="bg-cyan-100 text-cyan-700", order=7, group="qualified"),
    MasterDataItem(code="deposit", label="Đã đặt cọc", label_en="Deposited", color="bg-emerald-100 text-emerald-700", order=8, group="committed"),
    MasterDataItem(code="negotiation", label="Đang đàm phán", label_en="Negotiation", color="bg-indigo-100 text-indigo-700", order=9, group="committed"),
    MasterDataItem(code="closed_won", label="Thành công", label_en="Won", color="bg-green-100 text-green-700", order=10, group="closed"),
    MasterDataItem(code="closed_lost", label="Thất bại", label_en="Lost", color="bg-gray-100 text-gray-700", order=11, group="closed"),
]


# ============================================
# LEAD SOURCES (Channels)
# ============================================

LEAD_SOURCES: List[MasterDataItem] = [
    MasterDataItem(code="facebook", label="Facebook", icon="facebook", group="social", order=1),
    MasterDataItem(code="zalo", label="Zalo", icon="message-circle", group="social", order=2),
    MasterDataItem(code="tiktok", label="TikTok", icon="video", group="social", order=3),
    MasterDataItem(code="youtube", label="YouTube", icon="youtube", group="social", order=4),
    MasterDataItem(code="linkedin", label="LinkedIn", icon="linkedin", group="social", order=5),
    MasterDataItem(code="website", label="Website", icon="globe", group="digital", order=6),
    MasterDataItem(code="landing_page", label="Landing Page", icon="layout", group="digital", order=7),
    MasterDataItem(code="google_ads", label="Google Ads", icon="search", group="ads", order=8),
    MasterDataItem(code="email", label="Email", icon="mail", group="direct", order=9),
    MasterDataItem(code="phone", label="Điện thoại", label_en="Phone", icon="phone", group="direct", order=10),
    MasterDataItem(code="referral", label="Giới thiệu", label_en="Referral", icon="users", group="offline", order=11),
    MasterDataItem(code="event", label="Sự kiện", label_en="Event", icon="calendar", group="offline", order=12),
    MasterDataItem(code="collaborator", label="CTV", label_en="Collaborator", icon="user-plus", group="partner", order=13),
    MasterDataItem(code="partner", label="Đối tác", label_en="Partner", icon="handshake", group="partner", order=14),
    MasterDataItem(code="other", label="Khác", label_en="Other", icon="more-horizontal", group="other", order=15),
]


# ============================================
# LEAD SEGMENTS (Customer Types)
# ============================================

LEAD_SEGMENTS: List[MasterDataItem] = [
    MasterDataItem(code="vip", label="VIP", color="bg-purple-100 text-purple-700", order=1, metadata={"budget_min": 10000000000, "description": "Ngân sách > 10 tỷ"}),
    MasterDataItem(code="high_value", label="Cao cấp", label_en="High Value", color="bg-indigo-100 text-indigo-700", order=2, metadata={"budget_min": 5000000000, "budget_max": 10000000000, "description": "5-10 tỷ"}),
    MasterDataItem(code="mid_value", label="Trung cấp", label_en="Mid Value", color="bg-blue-100 text-blue-700", order=3, metadata={"budget_min": 2000000000, "budget_max": 5000000000, "description": "2-5 tỷ"}),
    MasterDataItem(code="standard", label="Tiêu chuẩn", label_en="Standard", color="bg-slate-100 text-slate-700", order=4, metadata={"budget_min": 1000000000, "budget_max": 2000000000, "description": "1-2 tỷ"}),
    MasterDataItem(code="entry", label="Phổ thông", label_en="Entry", color="bg-gray-100 text-gray-700", order=5, metadata={"budget_max": 1000000000, "description": "< 1 tỷ"}),
    MasterDataItem(code="investor", label="Nhà đầu tư", label_en="Investor", color="bg-amber-100 text-amber-700", order=6, metadata={"description": "Mua nhiều căn"}),
    MasterDataItem(code="first_time_buyer", label="Lần đầu mua nhà", label_en="First Time Buyer", color="bg-green-100 text-green-700", order=7, metadata={"description": "Khách mới"}),
    MasterDataItem(code="corporate", label="Doanh nghiệp", label_en="Corporate", color="bg-cyan-100 text-cyan-700", order=8, metadata={"description": "Pháp nhân"}),
]


# ============================================
# PROPERTY TYPES (Loại BĐS)
# ============================================

PROPERTY_TYPES: List[MasterDataItem] = [
    MasterDataItem(code="apartment", label="Căn hộ chung cư", label_en="Apartment", icon="building", order=1, metadata={"label_short": "Căn hộ"}),
    MasterDataItem(code="villa", label="Biệt thự", label_en="Villa", icon="home", order=2),
    MasterDataItem(code="townhouse", label="Nhà phố liền kề", label_en="Townhouse", icon="building-2", order=3, metadata={"label_short": "Nhà phố"}),
    MasterDataItem(code="shophouse", label="Shophouse", icon="store", order=4),
    MasterDataItem(code="land", label="Đất nền", label_en="Land", icon="map-pin", order=5),
    MasterDataItem(code="office", label="Văn phòng", label_en="Office", icon="briefcase", order=6),
    MasterDataItem(code="condotel", label="Condotel", icon="hotel", order=7),
    MasterDataItem(code="officetel", label="Officetel", icon="building", order=8),
    MasterDataItem(code="penthouse", label="Penthouse", icon="crown", order=9),
    MasterDataItem(code="duplex", label="Duplex", icon="layers", order=10),
]


# ============================================
# PRODUCT/LISTING STATUSES
# ============================================

PRODUCT_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="available", label="Còn hàng", label_en="Available", color="bg-green-100 text-green-700", order=1, metadata={"can_sell": True}),
    MasterDataItem(code="booking", label="Đang giữ chỗ", label_en="Booking", color="bg-amber-100 text-amber-700", order=2, metadata={"can_sell": False}),
    MasterDataItem(code="deposited", label="Đã đặt cọc", label_en="Deposited", color="bg-blue-100 text-blue-700", order=3, metadata={"can_sell": False}),
    MasterDataItem(code="sold", label="Đã bán", label_en="Sold", color="bg-slate-100 text-slate-700", order=4, metadata={"can_sell": False}),
    MasterDataItem(code="reserved", label="Giữ nội bộ", label_en="Reserved", color="bg-purple-100 text-purple-700", order=5, metadata={"can_sell": False}),
    MasterDataItem(code="unavailable", label="Không bán", label_en="Unavailable", color="bg-gray-100 text-gray-700", order=6, metadata={"can_sell": False}),
]


# ============================================
# DEAL STAGES (Pipeline)
# ============================================

DEAL_STAGES: List[MasterDataItem] = [
    MasterDataItem(code="lead", label="Lead mới", label_en="New Lead", color="bg-slate-500", order=1, metadata={"probability": 10}),
    MasterDataItem(code="qualified", label="Đã xác nhận", label_en="Qualified", color="bg-blue-500", order=2, metadata={"probability": 20}),
    MasterDataItem(code="site_visit", label="Đã xem nhà", label_en="Site Visit", color="bg-cyan-500", order=3, metadata={"probability": 30}),
    MasterDataItem(code="proposal", label="Gửi báo giá", label_en="Proposal", color="bg-purple-500", order=4, metadata={"probability": 50}),
    MasterDataItem(code="negotiation", label="Đàm phán", label_en="Negotiation", color="bg-indigo-500", order=5, metadata={"probability": 70}),
    MasterDataItem(code="booking", label="Đã booking", label_en="Booking", color="bg-amber-500", order=6, metadata={"probability": 80}),
    MasterDataItem(code="deposit", label="Đã đặt cọc", label_en="Deposit", color="bg-orange-500", order=7, metadata={"probability": 90}),
    MasterDataItem(code="contract", label="Làm hợp đồng", label_en="Contract", color="bg-emerald-500", order=8, metadata={"probability": 95}),
    MasterDataItem(code="won", label="Thành công", label_en="Won", color="bg-green-500", order=9, metadata={"probability": 100, "is_closed": True}),
    MasterDataItem(code="lost", label="Thất bại", label_en="Lost", color="bg-gray-500", order=10, metadata={"probability": 0, "is_closed": True}),
]


# ============================================
# BOOKING STATUSES
# ============================================

BOOKING_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="pending", label="Chờ xác nhận", label_en="Pending", color="bg-amber-100 text-amber-700", order=1),
    MasterDataItem(code="confirmed", label="Đã xác nhận", label_en="Confirmed", color="bg-blue-100 text-blue-700", order=2),
    MasterDataItem(code="deposited", label="Đã đặt cọc", label_en="Deposited", color="bg-green-100 text-green-700", order=3),
    MasterDataItem(code="contract_signed", label="Đã ký HĐ", label_en="Contract Signed", color="bg-emerald-100 text-emerald-700", order=4),
    MasterDataItem(code="cancelled", label="Đã hủy", label_en="Cancelled", color="bg-red-100 text-red-700", order=5),
    MasterDataItem(code="expired", label="Hết hạn", label_en="Expired", color="bg-gray-100 text-gray-700", order=6),
]


# ============================================
# TASK STATUSES
# ============================================

TASK_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="todo", label="Cần làm", label_en="To Do", color="bg-slate-100 text-slate-700", order=1, metadata={"is_open": True}),
    MasterDataItem(code="in_progress", label="Đang làm", label_en="In Progress", color="bg-blue-100 text-blue-700", order=2, metadata={"is_open": True}),
    MasterDataItem(code="review", label="Đang review", label_en="Review", color="bg-purple-100 text-purple-700", order=3, metadata={"is_open": True}),
    MasterDataItem(code="done", label="Hoàn thành", label_en="Done", color="bg-green-100 text-green-700", order=4, metadata={"is_open": False}),
    MasterDataItem(code="cancelled", label="Đã hủy", label_en="Cancelled", color="bg-gray-100 text-gray-700", order=5, metadata={"is_open": False}),
]


# ============================================
# TASK PRIORITIES
# ============================================

TASK_PRIORITIES: List[MasterDataItem] = [
    MasterDataItem(code="urgent", label="Khẩn cấp", label_en="Urgent", color="bg-red-100 text-red-700", icon="alert-circle", order=1),
    MasterDataItem(code="high", label="Cao", label_en="High", color="bg-orange-100 text-orange-700", icon="arrow-up", order=2),
    MasterDataItem(code="medium", label="Trung bình", label_en="Medium", color="bg-blue-100 text-blue-700", icon="minus", order=3),
    MasterDataItem(code="low", label="Thấp", label_en="Low", color="bg-slate-100 text-slate-700", icon="arrow-down", order=4),
]


# ============================================
# TASK TYPES
# ============================================

TASK_TYPES: List[MasterDataItem] = [
    MasterDataItem(code="task", label="Công việc", label_en="Task", icon="check-square", order=1),
    MasterDataItem(code="follow_up", label="Follow-up", icon="phone-call", order=2),
    MasterDataItem(code="call", label="Gọi điện", label_en="Call", icon="phone", order=3),
    MasterDataItem(code="meeting", label="Cuộc họp", label_en="Meeting", icon="users", order=4),
    MasterDataItem(code="site_visit", label="Dẫn khách xem", label_en="Site Visit", icon="map-pin", order=5),
    MasterDataItem(code="document", label="Hồ sơ/Giấy tờ", label_en="Document", icon="file-text", order=6),
    MasterDataItem(code="reminder", label="Nhắc nhở", label_en="Reminder", icon="bell", order=7),
]


# ============================================
# CAMPAIGN TYPES
# ============================================

CAMPAIGN_TYPES: List[MasterDataItem] = [
    MasterDataItem(code="grand_opening", label="Mở bán lớn", label_en="Grand Opening", order=1, metadata={"description": "Sự kiện mở bán chính thức"}),
    MasterDataItem(code="soft_opening", label="Mở bán mềm", label_en="Soft Opening", order=2, metadata={"description": "Bán cho khách VIP trước"}),
    MasterDataItem(code="flash_sale", label="Flash Sale", order=3, metadata={"description": "Ưu đãi giới hạn thời gian"}),
    MasterDataItem(code="vip_sale", label="VIP Sale", order=4, metadata={"description": "Dành riêng khách VIP"}),
    MasterDataItem(code="phase_launch", label="Mở bán theo đợt", label_en="Phase Launch", order=5, metadata={"description": "Phân đợt bán hàng"}),
]


# ============================================
# CAMPAIGN STATUSES
# ============================================

CAMPAIGN_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="draft", label="Bản nháp", label_en="Draft", color="bg-slate-100 text-slate-700", order=1),
    MasterDataItem(code="upcoming", label="Sắp diễn ra", label_en="Upcoming", color="bg-blue-100 text-blue-700", order=2),
    MasterDataItem(code="active", label="Đang chạy", label_en="Active", color="bg-green-100 text-green-700", order=3),
    MasterDataItem(code="paused", label="Tạm dừng", label_en="Paused", color="bg-amber-100 text-amber-700", order=4),
    MasterDataItem(code="ended", label="Kết thúc", label_en="Ended", color="bg-gray-100 text-gray-700", order=5),
    MasterDataItem(code="cancelled", label="Đã hủy", label_en="Cancelled", color="bg-red-100 text-red-700", order=6),
]


# ============================================
# LOSS REASONS
# ============================================

LOSS_REASONS: List[MasterDataItem] = [
    MasterDataItem(code="price", label="Giá cao", label_en="Price Too High", group="financial", order=1),
    MasterDataItem(code="budget", label="Không đủ ngân sách", label_en="Budget Constraint", group="financial", order=2),
    MasterDataItem(code="location", label="Vị trí không phù hợp", label_en="Location Mismatch", group="product", order=3),
    MasterDataItem(code="product", label="Sản phẩm không phù hợp", label_en="Product Mismatch", group="product", order=4),
    MasterDataItem(code="competitor", label="Chọn đối thủ", label_en="Chose Competitor", group="competition", order=5),
    MasterDataItem(code="timing", label="Chưa sẵn sàng", label_en="Not Ready", group="timing", order=6),
    MasterDataItem(code="no_response", label="Không phản hồi", label_en="No Response", group="engagement", order=7),
    MasterDataItem(code="duplicate", label="Lead trùng", label_en="Duplicate Lead", group="data", order=8),
    MasterDataItem(code="invalid", label="Thông tin không hợp lệ", label_en="Invalid Info", group="data", order=9),
    MasterDataItem(code="other", label="Lý do khác", label_en="Other", group="other", order=10),
]


# ============================================
# PROVINCES (Vietnam)
# ============================================

PROVINCES: List[MasterDataItem] = [
    MasterDataItem(code="HN", label="Hà Nội", label_en="Hanoi", group="north", order=1),
    MasterDataItem(code="HCM", label="TP. Hồ Chí Minh", label_en="Ho Chi Minh City", group="south", order=2),
    MasterDataItem(code="DN", label="Đà Nẵng", label_en="Da Nang", group="central", order=3),
    MasterDataItem(code="HP", label="Hải Phòng", label_en="Hai Phong", group="north", order=4),
    MasterDataItem(code="CT", label="Cần Thơ", label_en="Can Tho", group="south", order=5),
    MasterDataItem(code="BD", label="Bình Dương", label_en="Binh Duong", group="south", order=6),
    MasterDataItem(code="DNA", label="Đồng Nai", label_en="Dong Nai", group="south", order=7),
    MasterDataItem(code="KH", label="Khánh Hòa", label_en="Khanh Hoa", group="central", order=8),
    MasterDataItem(code="QN", label="Quảng Ninh", label_en="Quang Ninh", group="north", order=9),
    MasterDataItem(code="QNA", label="Quảng Nam", label_en="Quang Nam", group="central", order=10),
    MasterDataItem(code="TH", label="Thanh Hóa", label_en="Thanh Hoa", group="north", order=11),
    MasterDataItem(code="NA", label="Nghệ An", label_en="Nghe An", group="north", order=12),
    MasterDataItem(code="BR", label="Bà Rịa-Vũng Tàu", label_en="Ba Ria Vung Tau", group="south", order=13),
    MasterDataItem(code="LA", label="Long An", label_en="Long An", group="south", order=14),
    MasterDataItem(code="PY", label="Phú Yên", label_en="Phu Yen", group="central", order=15),
]


# ============================================
# PRICE RANGES (VND)
# ============================================

PRICE_RANGES: List[MasterDataItem] = [
    MasterDataItem(code="under_2b", label="Dưới 2 tỷ", label_en="Under 2B", order=1, metadata={"min": 0, "max": 2000000000}),
    MasterDataItem(code="2b_5b", label="2 - 5 tỷ", label_en="2-5B", order=2, metadata={"min": 2000000000, "max": 5000000000}),
    MasterDataItem(code="5b_10b", label="5 - 10 tỷ", label_en="5-10B", order=3, metadata={"min": 5000000000, "max": 10000000000}),
    MasterDataItem(code="10b_20b", label="10 - 20 tỷ", label_en="10-20B", order=4, metadata={"min": 10000000000, "max": 20000000000}),
    MasterDataItem(code="20b_50b", label="20 - 50 tỷ", label_en="20-50B", order=5, metadata={"min": 20000000000, "max": 50000000000}),
    MasterDataItem(code="over_50b", label="Trên 50 tỷ", label_en="Over 50B", order=6, metadata={"min": 50000000000, "max": None}),
]


# ============================================
# AREA RANGES (m²)
# ============================================

AREA_RANGES: List[MasterDataItem] = [
    MasterDataItem(code="under_50", label="Dưới 50m²", label_en="Under 50m²", order=1, metadata={"min": 0, "max": 50}),
    MasterDataItem(code="50_100", label="50 - 100m²", label_en="50-100m²", order=2, metadata={"min": 50, "max": 100}),
    MasterDataItem(code="100_200", label="100 - 200m²", label_en="100-200m²", order=3, metadata={"min": 100, "max": 200}),
    MasterDataItem(code="200_500", label="200 - 500m²", label_en="200-500m²", order=4, metadata={"min": 200, "max": 500}),
    MasterDataItem(code="over_500", label="Trên 500m²", label_en="Over 500m²", order=5, metadata={"min": 500, "max": None}),
]


# ============================================
# PROJECT STATUSES (BĐS Project)
# ============================================

PROJECT_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="upcoming", label="Sắp mở bán", label_en="Upcoming", color="bg-blue-100 text-blue-700", order=1),
    MasterDataItem(code="selling", label="Đang mở bán", label_en="Selling", color="bg-green-100 text-green-700", order=2),
    MasterDataItem(code="sold_out", label="Đã bán hết", label_en="Sold Out", color="bg-slate-100 text-slate-700", order=3),
    MasterDataItem(code="handover", label="Đã bàn giao", label_en="Handover", color="bg-amber-100 text-amber-700", order=4),
]


# ============================================
# USER ROLES
# ============================================

USER_ROLES: List[MasterDataItem] = [
    MasterDataItem(code="bod", label="Ban Giám đốc", label_en="Board of Directors", order=1, metadata={"permissions": ["all"]}),
    MasterDataItem(code="admin", label="Admin", order=2, metadata={"permissions": ["manage_users", "manage_settings", "view_all"]}),
    MasterDataItem(code="manager", label="Quản lý", label_en="Manager", order=3, metadata={"permissions": ["manage_team", "view_reports", "approve"]}),
    MasterDataItem(code="sales", label="Sales", order=4, metadata={"permissions": ["manage_leads", "manage_deals", "manage_tasks"]}),
    MasterDataItem(code="marketing", label="Marketing", order=5, metadata={"permissions": ["manage_campaigns", "manage_content"]}),
    MasterDataItem(code="hr", label="Nhân sự", label_en="HR", order=6, metadata={"permissions": ["manage_hr"]}),
    MasterDataItem(code="content", label="Content", order=7, metadata={"permissions": ["manage_cms"]}),
]


# ============================================
# ACTIVITY TYPES
# ============================================

ACTIVITY_TYPES: List[MasterDataItem] = [
    MasterDataItem(code="call", label="Gọi điện", label_en="Call", icon="phone", order=1),
    MasterDataItem(code="email", label="Email", icon="mail", order=2),
    MasterDataItem(code="sms", label="SMS", icon="message-square", order=3),
    MasterDataItem(code="zns", label="ZNS", icon="message-circle", order=4),
    MasterDataItem(code="meeting", label="Cuộc họp", label_en="Meeting", icon="users", order=5),
    MasterDataItem(code="viewing", label="Dẫn xem nhà", label_en="Site Visit", icon="home", order=6),
    MasterDataItem(code="note", label="Ghi chú", label_en="Note", icon="file-text", order=7),
    MasterDataItem(code="status_change", label="Đổi trạng thái", label_en="Status Change", icon="refresh-cw", order=8),
    MasterDataItem(code="assign", label="Phân công", label_en="Assignment", icon="user-plus", order=9),
]


# ============================================
# CONTRACT STATUSES
# ============================================

CONTRACT_STATUSES: List[MasterDataItem] = [
    MasterDataItem(code="draft", label="Bản nháp", label_en="Draft", color="bg-slate-100 text-slate-700", order=1),
    MasterDataItem(code="pending_review", label="Chờ duyệt", label_en="Pending Review", color="bg-amber-100 text-amber-700", order=2),
    MasterDataItem(code="approved", label="Đã duyệt", label_en="Approved", color="bg-blue-100 text-blue-700", order=3),
    MasterDataItem(code="signed", label="Đã ký", label_en="Signed", color="bg-green-100 text-green-700", order=4),
    MasterDataItem(code="expired", label="Hết hạn", label_en="Expired", color="bg-gray-100 text-gray-700", order=5),
    MasterDataItem(code="cancelled", label="Đã hủy", label_en="Cancelled", color="bg-red-100 text-red-700", order=6),
]


# ============================================
# PAYMENT METHODS
# ============================================

PAYMENT_METHODS: List[MasterDataItem] = [
    MasterDataItem(code="cash", label="Tiền mặt", label_en="Cash", icon="banknote", order=1),
    MasterDataItem(code="bank_transfer", label="Chuyển khoản", label_en="Bank Transfer", icon="building-2", order=2),
    MasterDataItem(code="credit_card", label="Thẻ tín dụng", label_en="Credit Card", icon="credit-card", order=3),
    MasterDataItem(code="check", label="Séc", label_en="Check", icon="file-text", order=4),
    MasterDataItem(code="installment", label="Trả góp", label_en="Installment", icon="calendar", order=5),
]


# ============================================
# ALL MASTER DATA CATEGORIES
# ============================================

MASTER_DATA_REGISTRY: Dict[str, MasterDataCategory] = {
    "lead_statuses": MasterDataCategory(
        key="lead_statuses",
        label="Trạng thái Lead",
        label_en="Lead Statuses",
        description="Các trạng thái trong quy trình chăm sóc lead",
        items=LEAD_STATUSES,
        is_editable=True,
        is_extendable=True
    ),
    "lead_sources": MasterDataCategory(
        key="lead_sources",
        label="Nguồn Lead",
        label_en="Lead Sources",
        description="Các kênh/nguồn thu thập lead",
        items=LEAD_SOURCES,
        is_editable=True,
        is_extendable=True
    ),
    "lead_segments": MasterDataCategory(
        key="lead_segments",
        label="Phân khúc khách hàng",
        label_en="Lead Segments",
        description="Phân loại khách hàng theo tiềm năng",
        items=LEAD_SEGMENTS,
        is_editable=True,
        is_extendable=True
    ),
    "property_types": MasterDataCategory(
        key="property_types",
        label="Loại bất động sản",
        label_en="Property Types",
        description="Các loại hình bất động sản",
        items=PROPERTY_TYPES,
        is_editable=True,
        is_extendable=True
    ),
    "product_statuses": MasterDataCategory(
        key="product_statuses",
        label="Trạng thái sản phẩm",
        label_en="Product Statuses",
        description="Trạng thái các căn/sản phẩm",
        items=PRODUCT_STATUSES,
        is_editable=True,
        is_extendable=False
    ),
    "deal_stages": MasterDataCategory(
        key="deal_stages",
        label="Giai đoạn Deal",
        label_en="Deal Stages",
        description="Các giai đoạn trong pipeline bán hàng",
        items=DEAL_STAGES,
        is_editable=True,
        is_extendable=True
    ),
    "booking_statuses": MasterDataCategory(
        key="booking_statuses",
        label="Trạng thái Booking",
        label_en="Booking Statuses",
        items=BOOKING_STATUSES,
        is_editable=True,
        is_extendable=False
    ),
    "task_statuses": MasterDataCategory(
        key="task_statuses",
        label="Trạng thái Task",
        label_en="Task Statuses",
        items=TASK_STATUSES,
        is_editable=True,
        is_extendable=True
    ),
    "task_priorities": MasterDataCategory(
        key="task_priorities",
        label="Độ ưu tiên",
        label_en="Task Priorities",
        items=TASK_PRIORITIES,
        is_editable=True,
        is_extendable=False
    ),
    "task_types": MasterDataCategory(
        key="task_types",
        label="Loại Task",
        label_en="Task Types",
        items=TASK_TYPES,
        is_editable=True,
        is_extendable=True
    ),
    "campaign_types": MasterDataCategory(
        key="campaign_types",
        label="Loại chiến dịch",
        label_en="Campaign Types",
        items=CAMPAIGN_TYPES,
        is_editable=True,
        is_extendable=True
    ),
    "campaign_statuses": MasterDataCategory(
        key="campaign_statuses",
        label="Trạng thái chiến dịch",
        label_en="Campaign Statuses",
        items=CAMPAIGN_STATUSES,
        is_editable=True,
        is_extendable=False
    ),
    "loss_reasons": MasterDataCategory(
        key="loss_reasons",
        label="Lý do mất lead/deal",
        label_en="Loss Reasons",
        items=LOSS_REASONS,
        is_editable=True,
        is_extendable=True
    ),
    "provinces": MasterDataCategory(
        key="provinces",
        label="Tỉnh/Thành phố",
        label_en="Provinces",
        items=PROVINCES,
        is_editable=False,
        is_extendable=True
    ),
    "price_ranges": MasterDataCategory(
        key="price_ranges",
        label="Khoảng giá",
        label_en="Price Ranges",
        items=PRICE_RANGES,
        is_editable=True,
        is_extendable=True
    ),
    "area_ranges": MasterDataCategory(
        key="area_ranges",
        label="Khoảng diện tích",
        label_en="Area Ranges",
        items=AREA_RANGES,
        is_editable=True,
        is_extendable=True
    ),
    "project_statuses": MasterDataCategory(
        key="project_statuses",
        label="Trạng thái dự án",
        label_en="Project Statuses",
        items=PROJECT_STATUSES,
        is_editable=True,
        is_extendable=False
    ),
    "user_roles": MasterDataCategory(
        key="user_roles",
        label="Vai trò người dùng",
        label_en="User Roles",
        items=USER_ROLES,
        is_editable=False,
        is_extendable=False
    ),
    "activity_types": MasterDataCategory(
        key="activity_types",
        label="Loại hoạt động",
        label_en="Activity Types",
        items=ACTIVITY_TYPES,
        is_editable=True,
        is_extendable=True
    ),
    "contract_statuses": MasterDataCategory(
        key="contract_statuses",
        label="Trạng thái hợp đồng",
        label_en="Contract Statuses",
        items=CONTRACT_STATUSES,
        is_editable=True,
        is_extendable=False
    ),
    "payment_methods": MasterDataCategory(
        key="payment_methods",
        label="Phương thức thanh toán",
        label_en="Payment Methods",
        items=PAYMENT_METHODS,
        is_editable=True,
        is_extendable=True
    ),
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_master_data(key: str) -> Optional[MasterDataCategory]:
    """Get a master data category by key"""
    return MASTER_DATA_REGISTRY.get(key)


def get_master_data_items(key: str) -> List[MasterDataItem]:
    """Get items from a master data category"""
    category = MASTER_DATA_REGISTRY.get(key)
    if category:
        return [item for item in category.items if item.is_active]
    return []


def get_item_by_code(key: str, code: str) -> Optional[MasterDataItem]:
    """Get a single item by its code"""
    items = get_master_data_items(key)
    for item in items:
        if item.code == code:
            return item
    return None


def get_label_by_code(key: str, code: str, fallback: str = "N/A") -> str:
    """Get the label for a code"""
    item = get_item_by_code(key, code)
    return item.label if item else fallback


def get_all_categories() -> Dict[str, MasterDataCategory]:
    """Get all master data categories"""
    return MASTER_DATA_REGISTRY


def to_select_options(key: str) -> List[Dict[str, str]]:
    """Convert master data to select options format"""
    items = get_master_data_items(key)
    return [{"value": item.code, "label": item.label} for item in items]
