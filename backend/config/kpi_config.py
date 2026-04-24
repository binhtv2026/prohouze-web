"""
ProHouzing KPI Configuration
Prompt 12/20 - KPI & Performance Engine

Configuration for:
- KPI Categories
- KPI Definitions (System KPIs)
- Scope Types
- Period Types
- Status Thresholds
- Leaderboard Types
- Bonus Tiers
"""

from enum import Enum
from typing import Dict, List, Any

# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class KPICategory(str, Enum):
    SALES = "sales"
    REVENUE = "revenue"
    ACTIVITY = "activity"
    LEAD = "lead"
    CUSTOMER = "customer"
    QUALITY = "quality"
    TEAM = "team"
    EFFICIENCY = "efficiency"


class KPIScopeType(str, Enum):
    COMPANY = "company"
    BRANCH = "branch"
    TEAM = "team"
    INDIVIDUAL = "individual"


class KPIPeriodType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class KPISnapshotType(str, Enum):
    REALTIME = "realtime"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class KPIStatus(str, Enum):
    EXCEEDING = "exceeding"
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BEHIND = "behind"


class KPITargetType(str, Enum):
    ABSOLUTE = "absolute"
    MINIMUM = "minimum"
    MAXIMUM = "maximum"
    RANGE = "range"


class KPICalculationType(str, Enum):
    COUNT = "count"
    SUM = "sum"
    AVG = "avg"
    RATIO = "ratio"
    FORMULA = "formula"


class LeaderboardType(str, Enum):
    DAILY_STARS = "daily_stars"
    WEEKLY_WARRIORS = "weekly_warriors"
    MONTHLY_CHAMPIONS = "monthly_champions"
    QUARTERLY_LEGENDS = "quarterly_legends"
    ALL_TIME_HEROES = "all_time_heroes"


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

KPI_CATEGORY_CONFIG: Dict[str, Dict[str, Any]] = {
    KPICategory.SALES.value: {
        "label": "Hiệu suất bán hàng",
        "label_en": "Sales Performance",
        "icon": "TrendingUp",
        "color": "#10b981",
        "order": 1,
    },
    KPICategory.REVENUE.value: {
        "label": "Doanh thu",
        "label_en": "Revenue",
        "icon": "DollarSign",
        "color": "#f59e0b",
        "order": 2,
    },
    KPICategory.ACTIVITY.value: {
        "label": "Hoạt động",
        "label_en": "Activity",
        "icon": "Activity",
        "color": "#3b82f6",
        "order": 3,
    },
    KPICategory.LEAD.value: {
        "label": "Quản lý Lead",
        "label_en": "Lead Management",
        "icon": "Users",
        "color": "#8b5cf6",
        "order": 4,
    },
    KPICategory.CUSTOMER.value: {
        "label": "Khách hàng",
        "label_en": "Customer",
        "icon": "Heart",
        "color": "#ec4899",
        "order": 5,
    },
    KPICategory.QUALITY.value: {
        "label": "Chất lượng",
        "label_en": "Quality",
        "icon": "CheckCircle",
        "color": "#06b6d4",
        "order": 6,
    },
    KPICategory.TEAM.value: {
        "label": "Team",
        "label_en": "Team",
        "icon": "Users",
        "color": "#6366f1",
        "order": 7,
    },
    KPICategory.EFFICIENCY.value: {
        "label": "Hiệu quả",
        "label_en": "Efficiency",
        "icon": "Zap",
        "color": "#84cc16",
        "order": 8,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# SCOPE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

KPI_SCOPE_CONFIG: Dict[str, Dict[str, Any]] = {
    KPIScopeType.COMPANY.value: {
        "label": "Công ty",
        "label_en": "Company",
        "level": 0,
    },
    KPIScopeType.BRANCH.value: {
        "label": "Chi nhánh",
        "label_en": "Branch",
        "level": 1,
    },
    KPIScopeType.TEAM.value: {
        "label": "Team",
        "label_en": "Team",
        "level": 2,
    },
    KPIScopeType.INDIVIDUAL.value: {
        "label": "Cá nhân",
        "label_en": "Individual",
        "level": 3,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# PERIOD CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

KPI_PERIOD_CONFIG: Dict[str, Dict[str, Any]] = {
    KPIPeriodType.DAILY.value: {
        "label": "Hàng ngày",
        "label_en": "Daily",
        "days": 1,
    },
    KPIPeriodType.WEEKLY.value: {
        "label": "Hàng tuần",
        "label_en": "Weekly",
        "days": 7,
    },
    KPIPeriodType.MONTHLY.value: {
        "label": "Hàng tháng",
        "label_en": "Monthly",
        "days": 30,
    },
    KPIPeriodType.QUARTERLY.value: {
        "label": "Hàng quý",
        "label_en": "Quarterly",
        "days": 90,
    },
    KPIPeriodType.YEARLY.value: {
        "label": "Hàng năm",
        "label_en": "Yearly",
        "days": 365,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# STATUS THRESHOLDS
# ═══════════════════════════════════════════════════════════════════════════════

KPI_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    KPIStatus.EXCEEDING.value: {
        "label": "Vượt mục tiêu",
        "label_en": "Exceeding",
        "threshold": 110,
        "color": "#10b981",
        "icon": "TrendingUp",
        "badge": "⭐",
    },
    KPIStatus.ON_TRACK.value: {
        "label": "Đúng tiến độ",
        "label_en": "On Track",
        "threshold": 90,
        "color": "#3b82f6",
        "icon": "Check",
        "badge": "✅",
    },
    KPIStatus.AT_RISK.value: {
        "label": "Có rủi ro",
        "label_en": "At Risk",
        "threshold": 70,
        "color": "#f59e0b",
        "icon": "AlertTriangle",
        "badge": "⚠️",
    },
    KPIStatus.BEHIND.value: {
        "label": "Chưa đạt",
        "label_en": "Behind",
        "threshold": 0,
        "color": "#ef4444",
        "icon": "TrendingDown",
        "badge": "🔴",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# LEADERBOARD CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

LEADERBOARD_CONFIG: Dict[str, Dict[str, Any]] = {
    LeaderboardType.DAILY_STARS.value: {
        "name": "Ngôi sao ngày",
        "name_en": "Daily Stars",
        "description": "Top performers today",
        "period_type": KPIPeriodType.DAILY.value,
        "primary_kpi": "CALLS_MADE",
        "secondary_kpis": ["MEETINGS_SCHEDULED", "LEADS_CONTACTED"],
        "show_top_n": 10,
        "auto_reset": True,
    },
    LeaderboardType.WEEKLY_WARRIORS.value: {
        "name": "Chiến binh tuần",
        "name_en": "Weekly Warriors",
        "description": "Top performers this week",
        "period_type": KPIPeriodType.WEEKLY.value,
        "primary_kpi": "DEALS_WON",
        "secondary_kpis": ["WIN_RATE", "REVENUE_ACTUAL"],
        "show_top_n": 15,
        "auto_reset": True,
    },
    LeaderboardType.MONTHLY_CHAMPIONS.value: {
        "name": "Nhà vô địch tháng",
        "name_en": "Monthly Champions",
        "description": "Top performers this month",
        "period_type": KPIPeriodType.MONTHLY.value,
        "primary_kpi": "REVENUE_ACTUAL",
        "secondary_kpis": ["DEALS_WON", "WIN_RATE"],
        "show_top_n": 20,
        "auto_reset": True,
    },
    LeaderboardType.QUARTERLY_LEGENDS.value: {
        "name": "Huyền thoại quý",
        "name_en": "Quarterly Legends",
        "description": "Top performers this quarter",
        "period_type": KPIPeriodType.QUARTERLY.value,
        "primary_kpi": "REVENUE_ACTUAL",
        "secondary_kpis": ["DEALS_WON", "LEAD_CONVERSION"],
        "show_top_n": 20,
        "auto_reset": True,
    },
    LeaderboardType.ALL_TIME_HEROES.value: {
        "name": "Anh hùng mọi thời",
        "name_en": "All-Time Heroes",
        "description": "Career top performers",
        "period_type": KPIPeriodType.YEARLY.value,
        "primary_kpi": "REVENUE_ACTUAL",
        "secondary_kpis": ["DEALS_WON", "WIN_RATE"],
        "show_top_n": 50,
        "auto_reset": False,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════════════════════
# DEFAULT BONUS TIERS (FALLBACK ONLY - Primary source is kpi_bonus_rules collection)
# ═══════════════════════════════════════════════════════════════════════════════
# NOTE: These are DEFAULT fallback values. Production systems should use
# kpi_bonus_rules collection for configurable tiers.
# KPI modifier is a CORE input to Commission calculation, NOT an add-on.

DEFAULT_BONUS_TIERS: List[Dict[str, Any]] = [
    {
        "min_achievement": 0,
        "max_achievement": 69.99,
        "bonus_modifier": 0,
        "label": "Không đạt ngưỡng",
    },
    {
        "min_achievement": 70,
        "max_achievement": 89.99,
        "bonus_modifier": 1.0,
        "label": "Đạt cơ bản",
    },
    {
        "min_achievement": 90,
        "max_achievement": 99.99,
        "bonus_modifier": 1.1,
        "label": "Gần target",
    },
    {
        "min_achievement": 100,
        "max_achievement": 109.99,
        "bonus_modifier": 1.15,
        "label": "Đạt target",
    },
    {
        "min_achievement": 110,
        "max_achievement": 119.99,
        "bonus_modifier": 1.2,
        "label": "Vượt target",
    },
    {
        "min_achievement": 120,
        "max_achievement": 149.99,
        "bonus_modifier": 1.3,
        "label": "Xuất sắc",
    },
    {
        "min_achievement": 150,
        "max_achievement": 999999,
        "bonus_modifier": 1.5,
        "label": "Siêu sao",
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM KPI DEFINITIONS - BĐS SƠ CẤP (PRIMARY REAL ESTATE)
# ═══════════════════════════════════════════════════════════════════════════════
# Phase 2: KPI + Performance Engine for Real Estate Sales
# Flow: CRM → KPI → Commission → Payroll

SYSTEM_KPI_DEFINITIONS: List[Dict[str, Any]] = [
    # ─────────────────────────────────────────────────────────────
    # 1. KHÁCH HÀNG MỚI (NEW CUSTOMERS/LEADS)
    # ─────────────────────────────────────────────────────────────
    {
        "code": "NEW_CUSTOMERS",
        "name": "Khách hàng mới",
        "name_en": "New Customers",
        "description": "Số khách hàng mới tiếp nhận trong kỳ",
        "category": KPICategory.LEAD.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "leads",
        "filter_conditions": {"source_type": "new"},
        "unit": "khách",
        "format": "number",
        "target_type": KPITargetType.ABSOLUTE.value,
        "default_target": 30,
        "weight": 0.10,
        "is_key_metric": True,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["daily", "weekly", "monthly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    
    # ─────────────────────────────────────────────────────────────
    # 2. CUỘC GỌI (CALLS)
    # ─────────────────────────────────────────────────────────────
    {
        "code": "CALLS_MADE",
        "name": "Cuộc gọi thực hiện",
        "name_en": "Calls Made",
        "description": "Số cuộc gọi telesales/chăm sóc khách hàng",
        "category": KPICategory.ACTIVITY.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "activities",
        "filter_conditions": {"type": "call"},
        "unit": "cuộc gọi",
        "format": "number",
        "target_type": KPITargetType.MINIMUM.value,
        "default_target": 100,
        "weight": 0.10,
        "is_key_metric": False,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["daily", "weekly", "monthly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    
    # ─────────────────────────────────────────────────────────────
    # 3. LỊCH HẸN / ĐI XEM (APPOINTMENTS/SITE VISITS)
    # ─────────────────────────────────────────────────────────────
    {
        "code": "SITE_VISITS",
        "name": "Khách đi xem",
        "name_en": "Site Visits",
        "description": "Số lượt dẫn khách đi xem dự án",
        "category": KPICategory.ACTIVITY.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "activities",
        "filter_conditions": {"type": "site_visit"},
        "unit": "lượt xem",
        "format": "number",
        "target_type": KPITargetType.MINIMUM.value,
        "default_target": 15,
        "weight": 0.15,
        "is_key_metric": True,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["weekly", "monthly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    
    # ─────────────────────────────────────────────────────────────
    # 4. BOOKING (SOFT + HARD)
    # ─────────────────────────────────────────────────────────────
    {
        "code": "SOFT_BOOKINGS",
        "name": "Soft Booking",
        "name_en": "Soft Bookings",
        "description": "Số booking giữ chỗ (đặt cọc nhẹ)",
        "category": KPICategory.SALES.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "soft_bookings",
        "filter_conditions": {},
        "unit": "booking",
        "format": "number",
        "target_type": KPITargetType.ABSOLUTE.value,
        "default_target": 8,
        "weight": 0.10,
        "is_key_metric": True,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["weekly", "monthly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    {
        "code": "HARD_BOOKINGS",
        "name": "Hard Booking",
        "name_en": "Hard Bookings", 
        "description": "Số booking chính thức (đặt cọc cứng)",
        "category": KPICategory.SALES.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "hard_bookings",
        "filter_conditions": {},
        "unit": "booking",
        "format": "number",
        "target_type": KPITargetType.ABSOLUTE.value,
        "default_target": 5,
        "weight": 0.15,
        "is_key_metric": True,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["weekly", "monthly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    
    # ─────────────────────────────────────────────────────────────
    # 5. HỢP ĐỒNG (CONTRACTS/DEALS WON)
    # ─────────────────────────────────────────────────────────────
    {
        "code": "DEALS_WON",
        "name": "Hợp đồng ký",
        "name_en": "Contracts Signed",
        "description": "Số hợp đồng mua bán ký thành công",
        "category": KPICategory.SALES.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "contracts",
        "filter_conditions": {"status": {"$in": ["signed", "active", "completed"]}},
        "unit": "hợp đồng",
        "format": "number",
        "target_type": KPITargetType.ABSOLUTE.value,
        "default_target": 3,
        "weight": 0.15,
        "is_key_metric": True,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["weekly", "monthly", "quarterly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    
    # ─────────────────────────────────────────────────────────────
    # 6. DOANH THU (REVENUE)
    # ─────────────────────────────────────────────────────────────
    {
        "code": "REVENUE_ACTUAL",
        "name": "Doanh số thực tế",
        "name_en": "Actual Revenue",
        "description": "Tổng giá trị hợp đồng ký trong kỳ",
        "category": KPICategory.REVENUE.value,
        "calculation_type": KPICalculationType.SUM.value,
        "source_entity": "contracts",
        "source_field": "grand_total",
        "filter_conditions": {"status": {"$in": ["signed", "active", "completed"]}},
        "unit": "VND",
        "format": "currency",
        "decimal_places": 0,
        "target_type": KPITargetType.ABSOLUTE.value,
        "default_target": 15000000000,
        "weight": 0.25,
        "is_key_metric": True,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["monthly", "quarterly", "yearly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    
    # ─────────────────────────────────────────────────────────────
    # ADDITIONAL KPIs - CONVERSION RATES
    # ─────────────────────────────────────────────────────────────
    {
        "code": "LEAD_TO_VISIT",
        "name": "Tỷ lệ Lead → Đi xem",
        "name_en": "Lead to Visit Rate",
        "description": "Tỷ lệ chuyển đổi từ lead thành khách đi xem",
        "category": KPICategory.EFFICIENCY.value,
        "calculation_type": KPICalculationType.RATIO.value,
        "formula": "site_visits / new_customers * 100",
        "source_entity": "activities",
        "unit": "%",
        "format": "percent",
        "decimal_places": 1,
        "target_type": KPITargetType.MINIMUM.value,
        "default_target": 50,
        "weight": 0.05,
        "is_key_metric": False,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["monthly", "quarterly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    {
        "code": "VISIT_TO_BOOKING",
        "name": "Tỷ lệ Đi xem → Booking",
        "name_en": "Visit to Booking Rate",
        "description": "Tỷ lệ chuyển đổi từ đi xem thành booking",
        "category": KPICategory.EFFICIENCY.value,
        "calculation_type": KPICalculationType.RATIO.value,
        "formula": "(soft_bookings + hard_bookings) / site_visits * 100",
        "source_entity": "activities",
        "unit": "%",
        "format": "percent",
        "decimal_places": 1,
        "target_type": KPITargetType.MINIMUM.value,
        "default_target": 30,
        "weight": 0.05,
        "is_key_metric": False,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["monthly", "quarterly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },
    {
        "code": "BOOKING_TO_CONTRACT",
        "name": "Tỷ lệ Booking → HĐ",
        "name_en": "Booking to Contract Rate",
        "description": "Tỷ lệ chuyển đổi từ booking thành hợp đồng",
        "category": KPICategory.EFFICIENCY.value,
        "calculation_type": KPICalculationType.RATIO.value,
        "formula": "contracts / hard_bookings * 100",
        "source_entity": "contracts",
        "unit": "%",
        "format": "percent",
        "decimal_places": 1,
        "target_type": KPITargetType.MINIMUM.value,
        "default_target": 60,
        "weight": 0.05,
        "is_key_metric": False,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["monthly", "quarterly"],
        "thresholds": {"exceeding": 110, "on_track": 90, "at_risk": 70, "behind": 0},
    },

    # ─────────────────────────────────────────────────────────────
    # BACKWARD COMPATIBILITY - Keep old KPIs
    # ─────────────────────────────────────────────────────────────
    {
        "code": "DEALS_CREATED",
        "name": "Deals tạo mới",
        "name_en": "Deals Created",
        "category": KPICategory.SALES.value,
        "calculation_type": KPICalculationType.COUNT.value,
        "source_entity": "deals",
        "filter_conditions": {},
        "unit": "deals",
        "format": "number",
        "target_type": KPITargetType.ABSOLUTE.value,
        "default_target": 10,
        "weight": 0.05,
        "is_key_metric": False,
        "aggregation_levels": ["individual", "team", "branch", "company"],
        "time_periods": ["daily", "weekly", "monthly"],
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_category_config(category: str) -> Dict[str, Any]:
    """Get category configuration"""
    return KPI_CATEGORY_CONFIG.get(category, {
        "label": category.replace("_", " ").title(),
        "label_en": category.replace("_", " ").title(),
        "icon": "BarChart",
        "color": "#6b7280",
        "order": 99,
    })


def get_scope_config(scope_type: str) -> Dict[str, Any]:
    """Get scope configuration"""
    return KPI_SCOPE_CONFIG.get(scope_type, {
        "label": scope_type.replace("_", " ").title(),
        "label_en": scope_type.replace("_", " ").title(),
        "level": 99,
    })


def get_period_config(period_type: str) -> Dict[str, Any]:
    """Get period configuration"""
    return KPI_PERIOD_CONFIG.get(period_type, {
        "label": period_type.replace("_", " ").title(),
        "label_en": period_type.replace("_", " ").title(),
        "days": 30,
    })


def get_status_from_achievement(achievement: float) -> str:
    """Determine KPI status from achievement percentage"""
    if achievement >= KPI_STATUS_CONFIG[KPIStatus.EXCEEDING.value]["threshold"]:
        return KPIStatus.EXCEEDING.value
    elif achievement >= KPI_STATUS_CONFIG[KPIStatus.ON_TRACK.value]["threshold"]:
        return KPIStatus.ON_TRACK.value
    elif achievement >= KPI_STATUS_CONFIG[KPIStatus.AT_RISK.value]["threshold"]:
        return KPIStatus.AT_RISK.value
    else:
        return KPIStatus.BEHIND.value


def get_status_config(status: str) -> Dict[str, Any]:
    """Get status configuration"""
    return KPI_STATUS_CONFIG.get(status, {
        "label": status.replace("_", " ").title(),
        "label_en": status.replace("_", " ").title(),
        "threshold": 0,
        "color": "#6b7280",
        "icon": "Circle",
        "badge": "",
    })


def get_leaderboard_config(leaderboard_type: str) -> Dict[str, Any]:
    """Get leaderboard configuration"""
    return LEADERBOARD_CONFIG.get(leaderboard_type, {
        "name": leaderboard_type.replace("_", " ").title(),
        "name_en": leaderboard_type.replace("_", " ").title(),
        "description": "",
        "period_type": KPIPeriodType.MONTHLY.value,
        "primary_kpi": "REVENUE_ACTUAL",
        "secondary_kpis": [],
        "show_top_n": 20,
        "auto_reset": True,
    })


def get_bonus_modifier(achievement: float, tiers: List[Dict] = None) -> float:
    """Get bonus modifier based on achievement"""
    if not tiers:
        tiers = DEFAULT_BONUS_TIERS
    
    for tier in tiers:
        if tier["min_achievement"] <= achievement <= tier["max_achievement"]:
            return tier["bonus_modifier"]
    
    return 0


def get_bonus_tier_label(achievement: float, tiers: List[Dict] = None) -> str:
    """Get bonus tier label based on achievement"""
    if not tiers:
        tiers = DEFAULT_BONUS_TIERS
    
    for tier in tiers:
        if tier["min_achievement"] <= achievement <= tier["max_achievement"]:
            return tier["label"]
    
    return "Không xác định"



# ═══════════════════════════════════════════════════════════════════════════════
# LEVEL SYSTEM - GAMIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

class SalesLevel(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    DIAMOND = "diamond"


LEVEL_THRESHOLDS = {
    SalesLevel.BRONZE.value: {
        "min_score": 0,
        "max_score": 59.99,
        "label": "Bronze",
        "label_vi": "Đồng",
        "icon": "🥉",
        "color": "#CD7F32",
        "perks": ["Cơ bản"],
        "commission_bonus": 0,
    },
    SalesLevel.SILVER.value: {
        "min_score": 60,
        "max_score": 79.99,
        "label": "Silver",
        "label_vi": "Bạc",
        "icon": "🥈",
        "color": "#C0C0C0",
        "perks": ["Commission chuẩn", "Ưu tiên lead"],
        "commission_bonus": 0,
    },
    SalesLevel.GOLD.value: {
        "min_score": 80,
        "max_score": 99.99,
        "label": "Gold",
        "label_vi": "Vàng",
        "icon": "🥇",
        "color": "#FFD700",
        "perks": ["Commission +10%", "Ưu tiên lead cao", "Thưởng tháng"],
        "commission_bonus": 0.10,
    },
    SalesLevel.DIAMOND.value: {
        "min_score": 100,
        "max_score": 999,
        "label": "Diamond",
        "label_vi": "Kim cương",
        "icon": "💎",
        "color": "#B9F2FF",
        "perks": ["Commission +30%", "Lead VIP", "Thưởng đặc biệt", "Vinh danh"],
        "commission_bonus": 0.30,
    },
}


def get_level_from_score(score: float) -> Dict[str, Any]:
    """Get sales level based on KPI score"""
    for level, config in LEVEL_THRESHOLDS.items():
        if config["min_score"] <= score <= config["max_score"]:
            return {
                "level": level,
                **config
            }
    return {
        "level": SalesLevel.BRONZE.value,
        **LEVEL_THRESHOLDS[SalesLevel.BRONZE.value]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION RULES BASED ON KPI
# ═══════════════════════════════════════════════════════════════════════════════

COMMISSION_RULES = {
    "no_commission_threshold": 70,  # KPI < 70% = KHÔNG có commission
    "full_commission_threshold": 100,  # KPI >= 100% = full commission + bonus
    "rules": [
        {"min": 0, "max": 69.99, "commission_rate": 0, "label": "Không đủ điều kiện"},
        {"min": 70, "max": 89.99, "commission_rate": 1.0, "label": "Commission chuẩn"},
        {"min": 90, "max": 99.99, "commission_rate": 1.1, "label": "Commission +10%"},
        {"min": 100, "max": 119.99, "commission_rate": 1.2, "label": "Bonus +20%"},
        {"min": 120, "max": 999, "commission_rate": 1.5, "label": "Siêu bonus +50%"},
    ]
}


def get_commission_multiplier(kpi_achievement: float) -> Dict[str, Any]:
    """Get commission multiplier based on KPI achievement"""
    for rule in COMMISSION_RULES["rules"]:
        if rule["min"] <= kpi_achievement <= rule["max"]:
            return {
                "rate": rule["commission_rate"],
                "label": rule["label"],
                "eligible": rule["commission_rate"] > 0,
            }
    return {"rate": 0, "label": "Không xác định", "eligible": False}


# ═══════════════════════════════════════════════════════════════════════════════
# KPI DATA SOURCES - AUTO FROM CRM (KHÔNG CHO NHẬP TAY)
# ═══════════════════════════════════════════════════════════════════════════════

KPI_DATA_SOURCES = {
    "NEW_CUSTOMERS": {
        "source": "crm_leads",
        "collection": "leads",
        "filter": {"status": {"$in": ["new", "contacted"]}},
        "aggregation": "count",
        "field": None,
        "auto": True,  # BẮT BUỘC AUTO
    },
    "CALLS_MADE": {
        "source": "activity_log",
        "collection": "activities",
        "filter": {"type": "call"},
        "aggregation": "count",
        "field": None,
        "auto": True,
    },
    "SITE_VISITS": {
        "source": "appointments",
        "collection": "activities",
        "filter": {"type": "site_visit", "status": "completed"},
        "aggregation": "count",
        "field": None,
        "auto": True,
    },
    "SOFT_BOOKINGS": {
        "source": "bookings",
        "collection": "bookings",
        "filter": {"type": "soft", "status": {"$in": ["confirmed", "active"]}},
        "aggregation": "count",
        "field": None,
        "auto": True,
    },
    "HARD_BOOKINGS": {
        "source": "bookings",
        "collection": "bookings",
        "filter": {"type": "hard", "status": {"$in": ["confirmed", "active"]}},
        "aggregation": "count",
        "field": None,
        "auto": True,
    },
    "DEALS_WON": {
        "source": "contracts",
        "collection": "contracts",
        "filter": {"status": {"$in": ["signed", "active", "completed"]}},
        "aggregation": "count",
        "field": None,
        "auto": True,
    },
    "REVENUE_ACTUAL": {
        "source": "transactions",
        "collection": "contracts",
        "filter": {"status": {"$in": ["signed", "active", "completed"]}},
        "aggregation": "sum",
        "field": "grand_total",
        "auto": True,
    },
}
