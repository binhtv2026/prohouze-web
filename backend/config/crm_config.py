"""
ProHouzing CRM Configuration - V2 (Revised)
Prompt 6/20 - CRM Unified Profile Standardization

ARCHITECTURE:
- Contact is single identity (status: lead/prospect/customer/vip)
- Lead → Deal → Booking → Contract flow
- No separate Customer entity

Configuration for:
- Lead stages and transitions
- Deal stages and transitions
- Contact statuses
- Interaction types
- Demand profile options
- Duplicate detection rules
- Lead scoring
"""

from typing import Dict, List, Any


# ============================================
# CONTACT STATUS CONFIGURATION
# ============================================

CONTACT_STATUSES = [
    {
        "code": "lead",
        "label": "Lead",
        "label_en": "Lead",
        "color": "bg-slate-100 text-slate-700",
        "description": "Khách mới, chưa đủ điều kiện",
        "order": 1
    },
    {
        "code": "prospect",
        "label": "Tiềm năng",
        "label_en": "Prospect",
        "color": "bg-blue-100 text-blue-700",
        "description": "Đủ điều kiện, đang quan tâm",
        "order": 2
    },
    {
        "code": "customer",
        "label": "Khách hàng",
        "label_en": "Customer",
        "color": "bg-green-100 text-green-700",
        "description": "Đã có giao dịch",
        "order": 3
    },
    {
        "code": "vip",
        "label": "VIP",
        "label_en": "VIP",
        "color": "bg-purple-100 text-purple-700",
        "description": "Khách hàng VIP",
        "order": 4
    },
    {
        "code": "inactive",
        "label": "Không hoạt động",
        "label_en": "Inactive",
        "color": "bg-gray-100 text-gray-700",
        "description": "Không hoạt động > 6 tháng",
        "order": 5
    },
    {
        "code": "blacklist",
        "label": "Blacklist",
        "label_en": "Blacklist",
        "color": "bg-red-100 text-red-700",
        "description": "Không liên hệ",
        "order": 6
    }
]


# ============================================
# LEAD STAGE CONFIGURATION
# ============================================

LEAD_STAGES = [
    # Initial
    {
        "code": "raw",
        "label": "Mới nhập",
        "label_en": "Raw",
        "group": "initial",
        "order": 1,
        "color": "bg-slate-100 text-slate-700",
        "description": "Lead mới nhập, chưa xử lý",
        "allowed_next": ["verified", "contacted", "lost"],
        "auto_actions": ["verify_phone", "dedupe_check"],
        "sla_hours": 4
    },
    {
        "code": "verified",
        "label": "Đã xác minh",
        "label_en": "Verified",
        "group": "initial",
        "order": 2,
        "color": "bg-blue-100 text-blue-700",
        "description": "Thông tin đã xác minh",
        "allowed_next": ["contacted", "lost"],
        "auto_actions": ["auto_assign"],
        "sla_hours": 24
    },
    
    # Engagement
    {
        "code": "contacted",
        "label": "Đã liên hệ",
        "label_en": "Contacted",
        "group": "engagement",
        "order": 3,
        "color": "bg-cyan-100 text-cyan-700",
        "description": "Đã liên hệ lần đầu",
        "allowed_next": ["responded", "engaged", "qualifying", "lost", "recycled"],
        "sla_hours": 48
    },
    {
        "code": "responded",
        "label": "Đã phản hồi",
        "label_en": "Responded",
        "group": "engagement",
        "order": 4,
        "color": "bg-teal-100 text-teal-700",
        "description": "Khách đã phản hồi",
        "allowed_next": ["engaged", "qualifying", "lost"],
        "sla_hours": 48
    },
    {
        "code": "engaged",
        "label": "Đang tương tác",
        "label_en": "Engaged",
        "group": "engagement",
        "order": 5,
        "color": "bg-green-100 text-green-700",
        "description": "Đang tương tác tích cực",
        "allowed_next": ["qualifying", "qualified", "lost", "recycled"],
        "sla_hours": 72
    },
    
    # Qualification
    {
        "code": "qualifying",
        "label": "Đang đánh giá",
        "label_en": "Qualifying",
        "group": "qualification",
        "order": 6,
        "color": "bg-amber-100 text-amber-700",
        "description": "Đang đánh giá nhu cầu",
        "allowed_next": ["qualified", "disqualified", "engaged"],
        "sla_hours": 168
    },
    {
        "code": "qualified",
        "label": "Đủ điều kiện",
        "label_en": "Qualified",
        "group": "qualification",
        "order": 7,
        "color": "bg-emerald-100 text-emerald-700",
        "description": "Đủ điều kiện tạo Deal",
        "allowed_next": ["converted", "lost"],
        "is_qualified": True,
        "can_create_deal": True
    },
    {
        "code": "disqualified",
        "label": "Không phù hợp",
        "label_en": "Disqualified",
        "group": "qualification",
        "order": 8,
        "color": "bg-red-100 text-red-700",
        "description": "Không phù hợp",
        "allowed_next": ["recycled"],
        "is_terminal": True
    },
    
    # Terminal
    {
        "code": "converted",
        "label": "Đã chuyển Deal",
        "label_en": "Converted",
        "group": "terminal",
        "order": 9,
        "color": "bg-indigo-100 text-indigo-700",
        "description": "Đã tạo Deal",
        "allowed_next": [],
        "is_terminal": True,
        "is_success": True
    },
    {
        "code": "lost",
        "label": "Đã mất",
        "label_en": "Lost",
        "group": "terminal",
        "order": 10,
        "color": "bg-gray-100 text-gray-700",
        "description": "Mất liên lạc / Không mua",
        "allowed_next": ["recycled"],
        "is_terminal": True
    },
    {
        "code": "recycled",
        "label": "Nurturing",
        "label_en": "Recycled",
        "group": "terminal",
        "order": 11,
        "color": "bg-orange-100 text-orange-700",
        "description": "Quay lại nurturing",
        "allowed_next": ["contacted"],
        "is_terminal": False
    }
]

# Legacy status mapping
LEAD_STAGE_TO_LEGACY_STATUS = {
    "raw": "new",
    "verified": "new",
    "contacted": "contacted",
    "responded": "called",
    "engaged": "warm",
    "qualifying": "warm",
    "qualified": "hot",
    "disqualified": "closed_lost",
    "converted": "closed_won",
    "lost": "closed_lost",
    "recycled": "new"
}

LEGACY_STATUS_TO_LEAD_STAGE = {
    "new": "raw",
    "contacted": "contacted",
    "called": "responded",
    "warm": "engaged",
    "hot": "qualified",
    "viewing": "qualifying",
    "deposit": "converted",
    "negotiation": "qualified",
    "closed_won": "converted",
    "closed_lost": "lost"
}


# ============================================
# DEAL STAGE CONFIGURATION
# ============================================

DEAL_STAGES = [
    # Pre-transaction
    {
        "code": "negotiating",
        "label": "Đang đàm phán",
        "label_en": "Negotiating",
        "group": "pre_transaction",
        "order": 1,
        "color": "bg-slate-500",
        "probability": 20,
        "description": "Đang đàm phán về sản phẩm",
        "allowed_next": ["site_visit", "proposal_sent", "booking", "lost"]
    },
    {
        "code": "site_visit",
        "label": "Đã xem nhà",
        "label_en": "Site Visit",
        "group": "pre_transaction",
        "order": 2,
        "color": "bg-cyan-500",
        "probability": 30,
        "description": "Đã/sẽ xem nhà mẫu",
        "allowed_next": ["proposal_sent", "booking", "negotiating", "lost"]
    },
    {
        "code": "proposal_sent",
        "label": "Đã gửi báo giá",
        "label_en": "Proposal Sent",
        "group": "pre_transaction",
        "order": 3,
        "color": "bg-blue-500",
        "probability": 40,
        "description": "Đã gửi báo giá chi tiết",
        "allowed_next": ["booking", "site_visit", "lost"]
    },
    
    # Transaction
    {
        "code": "booking",
        "label": "Đã giữ chỗ",
        "label_en": "Booking",
        "group": "transaction",
        "order": 4,
        "color": "bg-amber-500",
        "probability": 60,
        "description": "Đã giữ chỗ sản phẩm",
        "allowed_next": ["deposited", "cancelled"],
        "creates_booking": True
    },
    {
        "code": "deposited",
        "label": "Đã đặt cọc",
        "label_en": "Deposited",
        "group": "transaction",
        "order": 5,
        "color": "bg-orange-500",
        "probability": 80,
        "description": "Đã đặt cọc",
        "allowed_next": ["contracting", "cancelled"]
    },
    {
        "code": "contracting",
        "label": "Đang làm HĐ",
        "label_en": "Contracting",
        "group": "transaction",
        "order": 6,
        "color": "bg-purple-500",
        "probability": 90,
        "description": "Đang làm hợp đồng",
        "allowed_next": ["contracted", "cancelled"]
    },
    {
        "code": "contracted",
        "label": "Đã ký HĐ",
        "label_en": "Contracted",
        "group": "transaction",
        "order": 7,
        "color": "bg-indigo-500",
        "probability": 95,
        "description": "Đã ký hợp đồng",
        "allowed_next": ["payment_progress", "handover_pending", "completed"],
        "creates_contract": True
    },
    
    # Post-transaction
    {
        "code": "payment_progress",
        "label": "Đang thanh toán",
        "label_en": "Payment Progress",
        "group": "post_transaction",
        "order": 8,
        "color": "bg-teal-500",
        "probability": 97,
        "description": "Đang thanh toán theo tiến độ",
        "allowed_next": ["handover_pending", "completed"]
    },
    {
        "code": "handover_pending",
        "label": "Chờ bàn giao",
        "label_en": "Handover Pending",
        "group": "post_transaction",
        "order": 9,
        "color": "bg-cyan-500",
        "probability": 98,
        "description": "Chờ bàn giao nhà",
        "allowed_next": ["completed"]
    },
    {
        "code": "completed",
        "label": "Hoàn tất",
        "label_en": "Completed",
        "group": "completed",
        "order": 10,
        "color": "bg-green-500",
        "probability": 100,
        "description": "Hoàn tất giao dịch",
        "allowed_next": [],
        "is_terminal": True,
        "is_success": True,
        "upgrades_contact_to": "customer"
    },
    
    # Terminal negative
    {
        "code": "cancelled",
        "label": "Đã hủy",
        "label_en": "Cancelled",
        "group": "terminal",
        "order": 11,
        "color": "bg-red-500",
        "probability": 0,
        "description": "Deal bị hủy",
        "allowed_next": [],
        "is_terminal": True
    },
    {
        "code": "lost",
        "label": "Thất bại",
        "label_en": "Lost",
        "group": "terminal",
        "order": 12,
        "color": "bg-gray-500",
        "probability": 0,
        "description": "Deal thất bại",
        "allowed_next": [],
        "is_terminal": True
    }
]


# ============================================
# INTERACTION TYPE CONFIGURATION
# ============================================

INTERACTION_TYPES = [
    # Communication
    {"code": "call_outbound", "label": "Gọi đi", "label_en": "Outbound Call", "icon": "phone-outgoing", "group": "communication", "color": "text-blue-600"},
    {"code": "call_inbound", "label": "Gọi đến", "label_en": "Inbound Call", "icon": "phone-incoming", "group": "communication", "color": "text-green-600"},
    {"code": "call_missed", "label": "Gọi nhỡ", "label_en": "Missed Call", "icon": "phone-missed", "group": "communication", "color": "text-red-600"},
    {"code": "sms", "label": "SMS", "icon": "message-square", "group": "communication", "color": "text-purple-600"},
    {"code": "email", "label": "Email", "icon": "mail", "group": "communication", "color": "text-indigo-600"},
    {"code": "zns", "label": "ZNS", "icon": "message-circle", "group": "communication", "color": "text-blue-600"},
    {"code": "chat", "label": "Chat", "icon": "message-circle", "group": "communication", "color": "text-cyan-600"},
    
    # Meeting
    {"code": "meeting", "label": "Họp/Gặp mặt", "label_en": "Meeting", "icon": "users", "group": "meeting", "color": "text-amber-600"},
    {"code": "site_visit", "label": "Xem nhà", "label_en": "Site Visit", "icon": "home", "group": "meeting", "color": "text-emerald-600"},
    
    # Notes & Updates
    {"code": "note", "label": "Ghi chú", "label_en": "Note", "icon": "file-text", "group": "note", "color": "text-slate-600"},
    {"code": "stage_change", "label": "Chuyển giai đoạn", "label_en": "Stage Change", "icon": "git-branch", "group": "system", "color": "text-purple-600"},
    {"code": "status_change", "label": "Đổi trạng thái", "label_en": "Status Change", "icon": "refresh-cw", "group": "system", "color": "text-orange-600"},
    
    # Assignment
    {"code": "assignment", "label": "Phân công", "label_en": "Assignment", "icon": "user-plus", "group": "assignment", "color": "text-teal-600"},
    {"code": "reassignment", "label": "Chuyển người", "label_en": "Reassignment", "icon": "users", "group": "assignment", "color": "text-yellow-600"},
    
    # Demand
    {"code": "demand_update", "label": "Cập nhật nhu cầu", "label_en": "Demand Update", "icon": "edit-3", "group": "demand", "color": "text-pink-600"},
    {"code": "demand_match", "label": "Khớp sản phẩm", "label_en": "Demand Match", "icon": "check-circle", "group": "demand", "color": "text-green-600"},
    {"code": "product_presented", "label": "Giới thiệu SP", "label_en": "Product Presented", "icon": "package", "group": "demand", "color": "text-blue-600"},
    
    # Transaction
    {"code": "deal_created", "label": "Tạo Deal", "label_en": "Deal Created", "icon": "briefcase", "group": "transaction", "color": "text-indigo-600"},
    {"code": "booking_created", "label": "Tạo Booking", "label_en": "Booking Created", "icon": "bookmark", "group": "transaction", "color": "text-amber-600"},
    {"code": "deposit_received", "label": "Nhận cọc", "label_en": "Deposit Received", "icon": "dollar-sign", "group": "transaction", "color": "text-yellow-600"},
    {"code": "contract_signed", "label": "Ký hợp đồng", "label_en": "Contract Signed", "icon": "file-signature", "group": "transaction", "color": "text-emerald-600"},
    
    # System
    {"code": "system", "label": "Hệ thống", "label_en": "System", "icon": "settings", "group": "system", "color": "text-gray-600"},
    {"code": "auto_action", "label": "Tự động", "label_en": "Auto Action", "icon": "zap", "group": "system", "color": "text-violet-600"},
    {"code": "duplicate_merge", "label": "Gộp trùng", "label_en": "Duplicate Merge", "icon": "git-merge", "group": "system", "color": "text-rose-600"},
]

INTERACTION_OUTCOMES = [
    {"code": "positive", "label": "Tích cực", "label_en": "Positive", "color": "text-green-600"},
    {"code": "neutral", "label": "Trung lập", "label_en": "Neutral", "color": "text-slate-600"},
    {"code": "negative", "label": "Tiêu cực", "label_en": "Negative", "color": "text-red-600"},
    {"code": "no_answer", "label": "Không nghe máy", "label_en": "No Answer", "color": "text-yellow-600"},
    {"code": "busy", "label": "Máy bận", "label_en": "Busy", "color": "text-orange-600"},
    {"code": "wrong_number", "label": "Sai số", "label_en": "Wrong Number", "color": "text-red-600"},
    {"code": "callback_requested", "label": "Hẹn gọi lại", "label_en": "Callback Requested", "color": "text-blue-600"},
    {"code": "meeting_scheduled", "label": "Đã hẹn gặp", "label_en": "Meeting Scheduled", "color": "text-purple-600"},
    {"code": "site_visit_scheduled", "label": "Đã hẹn xem nhà", "label_en": "Site Visit Scheduled", "color": "text-emerald-600"},
    {"code": "interested", "label": "Quan tâm", "label_en": "Interested", "color": "text-green-600"},
    {"code": "not_interested", "label": "Không quan tâm", "label_en": "Not Interested", "color": "text-orange-600"},
    {"code": "needs_more_info", "label": "Cần thêm thông tin", "label_en": "Needs More Info", "color": "text-blue-600"},
]


# ============================================
# DEMAND PROFILE OPTIONS
# ============================================

DEMAND_URGENCY_OPTIONS = [
    {"code": "immediate", "label": "Cần ngay", "label_en": "Immediate", "description": "< 1 tháng", "order": 1, "score_weight": 100},
    {"code": "short_term", "label": "Ngắn hạn", "label_en": "Short Term", "description": "1-3 tháng", "order": 2, "score_weight": 80},
    {"code": "medium_term", "label": "Trung hạn", "label_en": "Medium Term", "description": "3-6 tháng", "order": 3, "score_weight": 60},
    {"code": "long_term", "label": "Dài hạn", "label_en": "Long Term", "description": "> 6 tháng", "order": 4, "score_weight": 40},
    {"code": "exploring", "label": "Chỉ tìm hiểu", "label_en": "Exploring", "description": "Chưa có kế hoạch", "order": 5, "score_weight": 20},
]

DEMAND_PURPOSE_OPTIONS = [
    {"code": "residence", "label": "Để ở", "label_en": "Residence", "order": 1},
    {"code": "investment", "label": "Đầu tư cho thuê", "label_en": "Investment", "order": 2},
    {"code": "flip", "label": "Đầu tư lướt sóng", "label_en": "Flip", "order": 3},
    {"code": "both", "label": "Vừa ở vừa đầu tư", "label_en": "Both", "order": 4},
    {"code": "business", "label": "Kinh doanh", "label_en": "Business", "order": 5},
    {"code": "gift", "label": "Tặng/cho con cái", "label_en": "Gift", "order": 6},
]

PAYMENT_METHODS = [
    {"code": "cash", "label": "Tiền mặt 100%", "label_en": "Full Cash"},
    {"code": "loan", "label": "Vay ngân hàng", "label_en": "Bank Loan"},
    {"code": "installment", "label": "Trả góp CĐT", "label_en": "Developer Installment"},
    {"code": "mixed", "label": "Kết hợp", "label_en": "Mixed"},
]

FLOOR_PREFERENCES = [
    {"code": "low", "label": "Tầng thấp (1-5)", "label_en": "Low Floor", "floor_range": [1, 5]},
    {"code": "mid", "label": "Tầng trung (6-15)", "label_en": "Mid Floor", "floor_range": [6, 15]},
    {"code": "high", "label": "Tầng cao (16-25)", "label_en": "High Floor", "floor_range": [16, 25]},
    {"code": "top", "label": "Tầng cao nhất", "label_en": "Top Floor", "floor_range": [26, 99]},
    {"code": "penthouse", "label": "Penthouse", "label_en": "Penthouse"},
    {"code": "any", "label": "Không quan trọng", "label_en": "Any"},
]

HANDOVER_PREFERENCES = [
    {"code": "bare_shell", "label": "Bàn giao thô", "label_en": "Bare Shell"},
    {"code": "basic", "label": "Hoàn thiện cơ bản", "label_en": "Basic"},
    {"code": "full", "label": "Full nội thất", "label_en": "Fully Furnished"},
    {"code": "any", "label": "Không quan trọng", "label_en": "Any"},
]

LEGAL_STATUS_OPTIONS = [
    {"code": "so_hong", "label": "Sổ hồng/Sổ đỏ", "label_en": "Pink/Red Book"},
    {"code": "so_do", "label": "Sổ đỏ", "label_en": "Red Book"},
    {"code": "hdmb", "label": "Hợp đồng mua bán", "label_en": "Sales Contract"},
    {"code": "giay_to_hop_le", "label": "Giấy tờ hợp lệ khác", "label_en": "Other Legal Docs"},
]

DIRECTION_OPTIONS = [
    {"code": "east", "label": "Đông", "label_en": "East"},
    {"code": "west", "label": "Tây", "label_en": "West"},
    {"code": "south", "label": "Nam", "label_en": "South"},
    {"code": "north", "label": "Bắc", "label_en": "North"},
    {"code": "northeast", "label": "Đông Bắc", "label_en": "Northeast"},
    {"code": "northwest", "label": "Tây Bắc", "label_en": "Northwest"},
    {"code": "southeast", "label": "Đông Nam", "label_en": "Southeast"},
    {"code": "southwest", "label": "Tây Nam", "label_en": "Southwest"},
]

VIEW_OPTIONS = [
    {"code": "city", "label": "View thành phố", "label_en": "City View"},
    {"code": "river", "label": "View sông", "label_en": "River View"},
    {"code": "sea", "label": "View biển", "label_en": "Sea View"},
    {"code": "park", "label": "View công viên", "label_en": "Park View"},
    {"code": "pool", "label": "View hồ bơi", "label_en": "Pool View"},
    {"code": "garden", "label": "View vườn", "label_en": "Garden View"},
    {"code": "mountain", "label": "View núi", "label_en": "Mountain View"},
    {"code": "lake", "label": "View hồ", "label_en": "Lake View"},
    {"code": "internal", "label": "View nội khu", "label_en": "Internal View"},
]

COMMON_FEATURES = [
    # Amenities
    {"code": "pool", "label": "Hồ bơi", "group": "amenity"},
    {"code": "gym", "label": "Phòng gym", "group": "amenity"},
    {"code": "park", "label": "Công viên", "group": "amenity"},
    {"code": "playground", "label": "Sân chơi trẻ em", "group": "amenity"},
    {"code": "bbq", "label": "Khu BBQ", "group": "amenity"},
    {"code": "sky_garden", "label": "Vườn trên cao", "group": "amenity"},
    {"code": "rooftop", "label": "Rooftop", "group": "amenity"},
    {"code": "tennis", "label": "Sân tennis", "group": "amenity"},
    {"code": "basketball", "label": "Sân bóng rổ", "group": "amenity"},
    
    # Facilities
    {"code": "parking", "label": "Bãi đỗ xe", "group": "facility"},
    {"code": "basement_parking", "label": "Hầm để xe", "group": "facility"},
    {"code": "elevator", "label": "Thang máy", "group": "facility"},
    {"code": "security_24h", "label": "Bảo vệ 24/7", "group": "facility"},
    {"code": "cctv", "label": "Camera an ninh", "group": "facility"},
    {"code": "smart_home", "label": "Smart home", "group": "facility"},
    {"code": "generator", "label": "Máy phát điện", "group": "facility"},
    
    # Commercial
    {"code": "supermarket", "label": "Siêu thị", "group": "commercial"},
    {"code": "mall", "label": "TTTM", "group": "commercial"},
    {"code": "restaurant", "label": "Nhà hàng", "group": "commercial"},
    {"code": "cafe", "label": "Café", "group": "commercial"},
    
    # Education
    {"code": "kindergarten", "label": "Trường mầm non", "group": "education"},
    {"code": "school", "label": "Trường học", "group": "education"},
    {"code": "international_school", "label": "Trường quốc tế", "group": "education"},
    
    # Healthcare
    {"code": "clinic", "label": "Phòng khám", "group": "healthcare"},
    {"code": "hospital", "label": "Bệnh viện", "group": "healthcare"},
    
    # Location
    {"code": "near_metro", "label": "Gần metro", "group": "location"},
    {"code": "near_highway", "label": "Gần cao tốc", "group": "location"},
    {"code": "near_airport", "label": "Gần sân bay", "group": "location"},
    {"code": "riverfront", "label": "Mặt sông", "group": "location"},
    {"code": "corner_unit", "label": "Căn góc", "group": "location"},
]


# ============================================
# DUPLICATE DETECTION RULES - EXPANDED
# ============================================

DUPLICATE_DETECTION_CONFIG = {
    "enabled": True,
    "auto_merge": False,  # Require manual review
    "rules": [
        {
            "name": "exact_phone",
            "field": "phone",
            "match_type": "exact",
            "score": 100,
            "auto_flag": True,
            "description": "SĐT chính trùng khớp hoàn toàn"
        },
        {
            "name": "normalized_phone",
            "field": "phone",
            "match_type": "normalized",
            "score": 95,
            "auto_flag": True,
            "description": "SĐT sau khi chuẩn hóa (bỏ +84, 0, khoảng trắng)"
        },
        {
            "name": "phone_secondary",
            "field": "phone_secondary",
            "match_type": "exact",
            "score": 80,
            "auto_flag": True,
            "description": "SĐT phụ trùng khớp"
        },
        {
            "name": "zalo_phone",
            "field": "zalo_phone",
            "match_type": "normalized",
            "score": 85,
            "auto_flag": True,
            "description": "Số Zalo trùng khớp"
        },
        {
            "name": "facebook_id",
            "field": "facebook_id",
            "match_type": "exact",
            "score": 90,
            "auto_flag": True,
            "description": "Facebook ID trùng khớp"
        },
        {
            "name": "exact_email",
            "field": "email",
            "match_type": "exact",
            "score": 75,
            "auto_flag": True,
            "description": "Email trùng khớp hoàn toàn"
        },
        {
            "name": "fuzzy_name_same_district",
            "fields": ["full_name", "district"],
            "match_type": "fuzzy",
            "threshold": 0.85,
            "score": 40,
            "auto_flag": False,
            "description": "Tên gần giống + cùng quận"
        },
        {
            "name": "fuzzy_name_same_phone_prefix",
            "fields": ["full_name", "phone"],
            "match_type": "fuzzy_with_prefix",
            "phone_prefix_length": 7,
            "name_threshold": 0.80,
            "score": 50,
            "auto_flag": False,
            "description": "Tên gần giống + SĐT cùng 7 số đầu"
        }
    ],
    "merge_threshold": 80,
    "review_threshold": 50,
    "ignore_threshold": 30,
    "normalize_phone_rules": {
        "remove_prefix": ["+84", "84", "0"],
        "remove_chars": [" ", "-", "."],
        "min_length": 9,
        "max_length": 11
    }
}


# ============================================
# LEAD SCORING CONFIGURATION
# ============================================

LEAD_SCORING_CONFIG = {
    "max_score": 100,
    "factors": {
        "source": {
            "weight": 20,
            "scores": {
                "referral": 20,
                "event": 18,
                "collaborator": 16,
                "website": 15,
                "linkedin": 14,
                "partner": 13,
                "facebook": 12,
                "zalo": 12,
                "google_ads": 10,
                "youtube": 10,
                "tiktok": 8,
                "landing_page": 8,
                "email": 7,
                "phone": 6,
                "other": 5
            }
        },
        "budget": {
            "weight": 25,
            "ranges": [
                {"min": 10000000000, "score": 25, "segment": "vip"},
                {"min": 5000000000, "score": 20, "segment": "high_value"},
                {"min": 2000000000, "score": 15, "segment": "mid_value"},
                {"min": 1000000000, "score": 10, "segment": "standard"},
                {"min": 0, "score": 5, "segment": "entry"}
            ]
        },
        "engagement": {
            "weight": 20,
            "per_interaction": 4,
            "max": 20,
            "bonus": {
                "site_visit": 5,
                "meeting": 4,
                "call_positive": 3
            }
        },
        "stage": {
            "weight": 20,
            "scores": {
                "qualified": 20,
                "qualifying": 16,
                "engaged": 14,
                "responded": 12,
                "contacted": 10,
                "verified": 8,
                "raw": 5
            }
        },
        "urgency": {
            "weight": 10,
            "scores": {
                "immediate": 10,
                "short_term": 8,
                "medium_term": 6,
                "long_term": 4,
                "exploring": 2
            }
        },
        "recency": {
            "weight": 5,
            "days_scores": [
                {"max_days": 1, "score": 5},
                {"max_days": 3, "score": 4},
                {"max_days": 7, "score": 3},
                {"max_days": 14, "score": 2},
                {"max_days": 30, "score": 1},
                {"max_days": 9999, "score": 0}
            ]
        }
    },
    "priority_thresholds": {
        "urgent": 80,
        "high": 60,
        "medium": 40,
        "low": 0
    }
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_lead_stage(code: str) -> dict:
    """Get lead stage by code"""
    for stage in LEAD_STAGES:
        if stage["code"] == code:
            return stage
    return None


def get_deal_stage(code: str) -> dict:
    """Get deal stage by code"""
    for stage in DEAL_STAGES:
        if stage["code"] == code:
            return stage
    return None


def get_contact_status(code: str) -> dict:
    """Get contact status by code"""
    for status in CONTACT_STATUSES:
        if status["code"] == code:
            return status
    return None


def get_interaction_type(code: str) -> dict:
    """Get interaction type by code"""
    for itype in INTERACTION_TYPES:
        if itype["code"] == code:
            return itype
    return None


def can_transition_lead_stage(current: str, target: str) -> bool:
    """Check if lead stage transition is allowed"""
    stage = get_lead_stage(current)
    if not stage:
        return False
    return target in stage.get("allowed_next", [])


def can_transition_deal_stage(current: str, target: str) -> bool:
    """Check if deal stage transition is allowed"""
    stage = get_deal_stage(current)
    if not stage:
        return False
    return target in stage.get("allowed_next", [])


def map_legacy_status_to_stage(legacy_status: str) -> str:
    """Map legacy lead status to new stage"""
    return LEGACY_STATUS_TO_LEAD_STAGE.get(legacy_status, "raw")


def map_stage_to_legacy_status(stage: str) -> str:
    """Map stage to legacy status for backward compatibility"""
    return LEAD_STAGE_TO_LEGACY_STATUS.get(stage, "new")


def normalize_phone(phone: str) -> str:
    """Normalize phone number for duplicate detection"""
    if not phone:
        return ""
    
    rules = DUPLICATE_DETECTION_CONFIG["normalize_phone_rules"]
    
    # Remove characters
    for char in rules["remove_chars"]:
        phone = phone.replace(char, "")
    
    # Remove prefixes
    for prefix in rules["remove_prefix"]:
        if phone.startswith(prefix):
            phone = phone[len(prefix):]
            break
    
    # Ensure starts with proper digit
    if phone and not phone.startswith("0"):
        phone = "0" + phone
    
    return phone
