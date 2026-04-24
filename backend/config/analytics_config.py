"""
ProHouzing Analytics Configuration
Prompt 16/20 - Advanced Reports & Analytics Engine

Metric definitions, report taxonomy, and analytics configuration.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import date


# ==================== ENUMS ====================

class MetricCategory(str, Enum):
    REVENUE = "revenue"
    SALES = "sales"
    LEAD = "lead"
    CRM = "crm"
    MARKETING = "marketing"
    COMMISSION = "commission"
    INVENTORY = "inventory"
    TASK = "task"
    HR = "hr"
    CONTENT = "content"


class MetricDataType(str, Enum):
    CURRENCY = "currency"
    NUMBER = "number"
    PERCENTAGE = "percentage"
    COUNT = "count"
    DURATION = "duration"


class MetricAggregation(str, Enum):
    SUM = "sum"
    COUNT = "count"
    AVG = "avg"
    MIN = "min"
    MAX = "max"
    LATEST = "latest"
    DISTINCT = "distinct"


class ReportType(str, Enum):
    DASHBOARD = "dashboard"
    SUMMARY = "summary"
    DETAIL = "detail"
    COMPARISON = "comparison"
    TREND = "trend"
    FUNNEL = "funnel"
    RANKING = "ranking"


class ReportCategory(str, Enum):
    EXECUTIVE = "executive"
    SALES = "sales"
    MARKETING = "marketing"
    FINANCE = "finance"
    CRM = "crm"
    INVENTORY = "inventory"
    INDIVIDUAL = "individual"
    ACTIVITY = "activity"


# ==================== METRIC DEFINITION ====================

@dataclass
class MetricDefinition:
    code: str
    name: str
    name_en: str
    category: MetricCategory
    data_type: MetricDataType
    aggregation: MetricAggregation
    source_collection: str
    source_field: str
    filter_conditions: Dict[str, Any]
    format_options: Dict[str, Any]
    is_key_metric: bool
    supports_trend: bool
    supports_comparison: bool
    required_role: str
    description: str


# ==================== METRIC REGISTRY ====================

METRIC_REGISTRY: Dict[str, MetricDefinition] = {
    # Revenue Metrics
    "REV_001": MetricDefinition(
        code="REV_001",
        name="Tổng doanh thu",
        name_en="Total Revenue",
        category=MetricCategory.REVENUE,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="revenues",
        source_field="amount",
        filter_conditions={"status": {"$ne": "cancelled"}},
        format_options={"currency": "VND", "short": True},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng doanh thu từ tất cả nguồn"
    ),
    "REV_002": MetricDefinition(
        code="REV_002",
        name="Doanh thu tháng",
        name_en="Monthly Revenue",
        category=MetricCategory.REVENUE,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="revenues",
        source_field="amount",
        filter_conditions={"status": {"$ne": "cancelled"}},
        format_options={"currency": "VND", "short": True},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Doanh thu trong tháng hiện tại"
    ),
    "REV_003": MetricDefinition(
        code="REV_003",
        name="Giá trị hợp đồng",
        name_en="Contract Value",
        category=MetricCategory.REVENUE,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="contracts",
        source_field="grand_total",
        filter_conditions={"status": {"$in": ["signed", "active", "completed"]}},
        format_options={"currency": "VND", "short": True},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="manager",
        description="Tổng giá trị hợp đồng đã ký"
    ),
    
    # Sales Metrics
    "SALES_001": MetricDefinition(
        code="SALES_001",
        name="Tổng deals",
        name_en="Total Deals",
        category=MetricCategory.SALES,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="deals",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng số deals trong pipeline"
    ),
    "SALES_002": MetricDefinition(
        code="SALES_002",
        name="Deals thắng",
        name_en="Won Deals",
        category=MetricCategory.SALES,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="deals",
        source_field="_id",
        filter_conditions={"stage": "completed"},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số deals đã thắng"
    ),
    "SALES_003": MetricDefinition(
        code="SALES_003",
        name="Giá trị pipeline",
        name_en="Pipeline Value",
        category=MetricCategory.SALES,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="deals",
        source_field="value",
        filter_conditions={"stage": {"$nin": ["lost", "completed"]}},
        format_options={"currency": "VND", "short": True},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng giá trị pipeline đang xử lý"
    ),
    "SALES_004": MetricDefinition(
        code="SALES_004",
        name="Win rate",
        name_en="Win Rate",
        category=MetricCategory.SALES,
        data_type=MetricDataType.PERCENTAGE,
        aggregation=MetricAggregation.AVG,
        source_collection="deals",
        source_field="__calculated__",
        filter_conditions={},
        format_options={"decimals": 1, "suffix": "%"},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tỷ lệ thắng deals"
    ),
    "SALES_005": MetricDefinition(
        code="SALES_005",
        name="Số bookings",
        name_en="Total Bookings",
        category=MetricCategory.SALES,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="hard_bookings",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng số hard bookings"
    ),
    
    # Lead Metrics
    "LEAD_001": MetricDefinition(
        code="LEAD_001",
        name="Tổng leads",
        name_en="Total Leads",
        category=MetricCategory.LEAD,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="leads",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng số leads trong hệ thống"
    ),
    "LEAD_002": MetricDefinition(
        code="LEAD_002",
        name="Leads mới",
        name_en="New Leads",
        category=MetricCategory.LEAD,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="leads",
        source_field="_id",
        filter_conditions={"stage": "new"},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số leads mới chưa xử lý"
    ),
    "LEAD_003": MetricDefinition(
        code="LEAD_003",
        name="Leads nóng",
        name_en="Hot Leads",
        category=MetricCategory.LEAD,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="leads",
        source_field="_id",
        filter_conditions={"stage": "hot"},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số leads nóng cần chốt"
    ),
    "LEAD_004": MetricDefinition(
        code="LEAD_004",
        name="Tỷ lệ chuyển đổi",
        name_en="Conversion Rate",
        category=MetricCategory.LEAD,
        data_type=MetricDataType.PERCENTAGE,
        aggregation=MetricAggregation.AVG,
        source_collection="leads",
        source_field="__calculated__",
        filter_conditions={},
        format_options={"decimals": 1, "suffix": "%"},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tỷ lệ leads chuyển đổi thành khách hàng"
    ),
    "LEAD_005": MetricDefinition(
        code="LEAD_005",
        name="CPL trung bình",
        name_en="Average CPL",
        category=MetricCategory.LEAD,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.AVG,
        source_collection="lead_sources",
        source_field="cost_per_lead",
        filter_conditions={"is_active": True},
        format_options={"currency": "VND", "short": True},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="marketing",
        description="Chi phí trung bình mỗi lead"
    ),
    
    # CRM Metrics
    "CRM_001": MetricDefinition(
        code="CRM_001",
        name="Tổng contacts",
        name_en="Total Contacts",
        category=MetricCategory.CRM,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="contacts",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng số contacts"
    ),
    "CRM_002": MetricDefinition(
        code="CRM_002",
        name="Khách hàng",
        name_en="Customers",
        category=MetricCategory.CRM,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="contacts",
        source_field="_id",
        filter_conditions={"status": "customer"},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số contacts đã là khách hàng"
    ),
    
    # Commission Metrics
    "COMM_001": MetricDefinition(
        code="COMM_001",
        name="Tổng hoa hồng",
        name_en="Total Commission",
        category=MetricCategory.COMMISSION,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="commission_records",
        source_field="net_amount",
        filter_conditions={},
        format_options={"currency": "VND", "short": True},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng hoa hồng"
    ),
    "COMM_002": MetricDefinition(
        code="COMM_002",
        name="HH chờ duyệt",
        name_en="Pending Commission",
        category=MetricCategory.COMMISSION,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="commission_records",
        source_field="net_amount",
        filter_conditions={"status": {"$in": ["pending", "pending_approval"]}},
        format_options={"currency": "VND", "short": True},
        is_key_metric=False,
        supports_trend=False,
        supports_comparison=False,
        required_role="sales",
        description="Hoa hồng đang chờ duyệt"
    ),
    "COMM_003": MetricDefinition(
        code="COMM_003",
        name="HH đã chi",
        name_en="Paid Commission",
        category=MetricCategory.COMMISSION,
        data_type=MetricDataType.CURRENCY,
        aggregation=MetricAggregation.SUM,
        source_collection="commission_records",
        source_field="net_amount",
        filter_conditions={"status": "paid"},
        format_options={"currency": "VND", "short": True},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Hoa hồng đã thanh toán"
    ),
    
    # Inventory Metrics
    "INV_001": MetricDefinition(
        code="INV_001",
        name="Tổng sản phẩm",
        name_en="Total Products",
        category=MetricCategory.INVENTORY,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="products",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=False,
        supports_trend=False,
        supports_comparison=False,
        required_role="sales",
        description="Tổng số sản phẩm BĐS"
    ),
    "INV_002": MetricDefinition(
        code="INV_002",
        name="Căn còn bán",
        name_en="Available Units",
        category=MetricCategory.INVENTORY,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="products",
        source_field="_id",
        filter_conditions={"inventory_status": "available"},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số căn còn bán được"
    ),
    "INV_003": MetricDefinition(
        code="INV_003",
        name="Căn đã bán",
        name_en="Sold Units",
        category=MetricCategory.INVENTORY,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="products",
        source_field="_id",
        filter_conditions={"inventory_status": "sold"},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số căn đã bán"
    ),
    
    # Task Metrics
    "TASK_001": MetricDefinition(
        code="TASK_001",
        name="Tổng tasks",
        name_en="Total Tasks",
        category=MetricCategory.TASK,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="tasks",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Tổng số tasks"
    ),
    "TASK_002": MetricDefinition(
        code="TASK_002",
        name="Tasks quá hạn",
        name_en="Overdue Tasks",
        category=MetricCategory.TASK,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="tasks",
        source_field="_id",
        filter_conditions={"status": {"$nin": ["completed", "cancelled"]}},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số tasks quá hạn"
    ),
    "TASK_003": MetricDefinition(
        code="TASK_003",
        name="Tasks hoàn thành",
        name_en="Completed Tasks",
        category=MetricCategory.TASK,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="tasks",
        source_field="_id",
        filter_conditions={"status": "completed"},
        format_options={},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="sales",
        description="Số tasks đã hoàn thành"
    ),
    
    # Marketing Metrics
    "MKT_001": MetricDefinition(
        code="MKT_001",
        name="Chiến dịch đang chạy",
        name_en="Active Campaigns",
        category=MetricCategory.MARKETING,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="campaigns",
        source_field="_id",
        filter_conditions={"status": "active"},
        format_options={},
        is_key_metric=False,
        supports_trend=False,
        supports_comparison=False,
        required_role="marketing",
        description="Số chiến dịch đang hoạt động"
    ),
    "MKT_002": MetricDefinition(
        code="MKT_002",
        name="ROI Marketing",
        name_en="Marketing ROI",
        category=MetricCategory.MARKETING,
        data_type=MetricDataType.PERCENTAGE,
        aggregation=MetricAggregation.AVG,
        source_collection="campaigns",
        source_field="__calculated__",
        filter_conditions={},
        format_options={"decimals": 1, "suffix": "%"},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="marketing",
        description="Return on Investment cho marketing"
    ),
    
    # Content Metrics
    "CONTENT_001": MetricDefinition(
        code="CONTENT_001",
        name="Tổng bài viết",
        name_en="Total Articles",
        category=MetricCategory.CONTENT,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="articles",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="content",
        description="Tổng số bài viết"
    ),
    "CONTENT_002": MetricDefinition(
        code="CONTENT_002",
        name="Lượt xem trang",
        name_en="Page Views",
        category=MetricCategory.CONTENT,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.SUM,
        source_collection="landing_pages",
        source_field="views",
        filter_conditions={},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="content",
        description="Tổng lượt xem các trang"
    ),
    "CONTENT_003": MetricDefinition(
        code="CONTENT_003",
        name="Form submissions",
        name_en="Form Submissions",
        category=MetricCategory.CONTENT,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="form_submissions",
        source_field="_id",
        filter_conditions={},
        format_options={},
        is_key_metric=True,
        supports_trend=True,
        supports_comparison=True,
        required_role="content",
        description="Số lần submit form"
    ),
    
    # HR Metrics
    "HR_001": MetricDefinition(
        code="HR_001",
        name="Tổng nhân viên",
        name_en="Total Employees",
        category=MetricCategory.HR,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="employees",
        source_field="_id",
        filter_conditions={"status": "active"},
        format_options={},
        is_key_metric=False,
        supports_trend=True,
        supports_comparison=True,
        required_role="hr",
        description="Tổng số nhân viên đang làm việc"
    ),
    "HR_002": MetricDefinition(
        code="HR_002",
        name="Vị trí tuyển dụng",
        name_en="Open Positions",
        category=MetricCategory.HR,
        data_type=MetricDataType.COUNT,
        aggregation=MetricAggregation.COUNT,
        source_collection="job_positions",
        source_field="_id",
        filter_conditions={"status": "open"},
        format_options={},
        is_key_metric=False,
        supports_trend=False,
        supports_comparison=False,
        required_role="hr",
        description="Số vị trí đang tuyển"
    ),
}


# ==================== HELPER FUNCTIONS ====================

def get_metric(code: str) -> Optional[MetricDefinition]:
    """Get metric definition by code."""
    return METRIC_REGISTRY.get(code)


def get_metrics_by_category(category: MetricCategory) -> List[MetricDefinition]:
    """Get all metrics in a category."""
    return [m for m in METRIC_REGISTRY.values() if m.category == category]


def get_key_metrics() -> List[MetricDefinition]:
    """Get all key metrics for executive dashboard."""
    return [m for m in METRIC_REGISTRY.values() if m.is_key_metric]


def get_metrics_with_trend() -> List[MetricDefinition]:
    """Get metrics that support trend analysis."""
    return [m for m in METRIC_REGISTRY.values() if m.supports_trend]


def get_metric_categories() -> List[dict]:
    """Get list of metric categories with labels."""
    return [
        {"code": cat.value, "label": cat.name.title(), "count": len(get_metrics_by_category(cat))}
        for cat in MetricCategory
    ]


# ==================== STANDARD PERIODS ====================

STANDARD_PERIODS = {
    "today": {"label": "Hôm nay", "days": 0},
    "yesterday": {"label": "Hôm qua", "days": 1},
    "this_week": {"label": "Tuần này", "type": "week"},
    "last_week": {"label": "Tuần trước", "type": "week", "offset": -1},
    "this_month": {"label": "Tháng này", "type": "month"},
    "last_month": {"label": "Tháng trước", "type": "month", "offset": -1},
    "this_quarter": {"label": "Quý này", "type": "quarter"},
    "last_quarter": {"label": "Quý trước", "type": "quarter", "offset": -1},
    "this_year": {"label": "Năm nay", "type": "year"},
    "last_year": {"label": "Năm trước", "type": "year", "offset": -1},
    "7d": {"label": "7 ngày qua", "days": 7},
    "30d": {"label": "30 ngày qua", "days": 30},
    "90d": {"label": "90 ngày qua", "days": 90},
    "365d": {"label": "365 ngày qua", "days": 365},
}


# ==================== REPORT DEFINITIONS ====================

@dataclass
class ReportDefinition:
    code: str
    name: str
    name_en: str
    category: ReportCategory
    report_type: ReportType
    description: str
    required_roles: List[str]
    scope: str
    metrics: List[str]
    supports_export: bool
    supports_schedule: bool
    supports_filter: bool
    default_period: str
    route: str


REPORT_REGISTRY: Dict[str, ReportDefinition] = {
    "RPT_EXEC_001": ReportDefinition(
        code="RPT_EXEC_001",
        name="Company Dashboard",
        name_en="Company Dashboard",
        category=ReportCategory.EXECUTIVE,
        report_type=ReportType.DASHBOARD,
        description="Tổng quan hoạt động toàn công ty",
        required_roles=["bod", "admin", "manager"],
        scope="company",
        metrics=["REV_001", "REV_002", "SALES_001", "SALES_002", "LEAD_001", "LEAD_004", "TASK_002", "INV_002"],
        supports_export=True,
        supports_schedule=True,
        supports_filter=True,
        default_period="this_month",
        route="/dashboard"
    ),
    "RPT_SALES_001": ReportDefinition(
        code="RPT_SALES_001",
        name="Pipeline Report",
        name_en="Sales Pipeline Report",
        category=ReportCategory.SALES,
        report_type=ReportType.DASHBOARD,
        description="Tổng quan pipeline bán hàng",
        required_roles=["sales", "manager", "admin"],
        scope="team",
        metrics=["SALES_001", "SALES_002", "SALES_003", "SALES_004"],
        supports_export=True,
        supports_schedule=False,
        supports_filter=True,
        default_period="this_month",
        route="/sales/pipeline-report"
    ),
    "RPT_CRM_001": ReportDefinition(
        code="RPT_CRM_001",
        name="Lead Funnel",
        name_en="Lead Funnel Report",
        category=ReportCategory.CRM,
        report_type=ReportType.FUNNEL,
        description="Phễu chuyển đổi leads",
        required_roles=["sales", "manager", "admin"],
        scope="team",
        metrics=["LEAD_001", "LEAD_002", "LEAD_003", "LEAD_004"],
        supports_export=True,
        supports_schedule=False,
        supports_filter=True,
        default_period="this_month",
        route="/crm/funnel-report"
    ),
    "RPT_FIN_001": ReportDefinition(
        code="RPT_FIN_001",
        name="P&L Statement",
        name_en="Profit & Loss Statement",
        category=ReportCategory.FINANCE,
        report_type=ReportType.SUMMARY,
        description="Báo cáo lãi lỗ",
        required_roles=["finance_manager", "admin", "bod"],
        scope="company",
        metrics=["REV_001"],
        supports_export=True,
        supports_schedule=True,
        supports_filter=True,
        default_period="this_month",
        route="/finance/pnl-report"
    ),
    "RPT_IND_001": ReportDefinition(
        code="RPT_IND_001",
        name="My KPI Dashboard",
        name_en="My KPI Dashboard",
        category=ReportCategory.INDIVIDUAL,
        report_type=ReportType.DASHBOARD,
        description="Dashboard KPI cá nhân",
        required_roles=["sales", "marketing", "content"],
        scope="individual",
        metrics=[],
        supports_export=False,
        supports_schedule=False,
        supports_filter=True,
        default_period="this_month",
        route="/kpi"
    ),
}


def get_report(code: str) -> Optional[ReportDefinition]:
    """Get report definition by code."""
    return REPORT_REGISTRY.get(code)


def get_reports_by_category(category: ReportCategory) -> List[ReportDefinition]:
    """Get all reports in a category."""
    return [r for r in REPORT_REGISTRY.values() if r.category == category]


def get_reports_for_role(role: str) -> List[ReportDefinition]:
    """Get reports accessible by a role."""
    return [r for r in REPORT_REGISTRY.values() if role in r.required_roles or "*" in r.required_roles]


# ==================== ROLE DEFAULT DASHBOARDS ====================

ROLE_DEFAULT_DASHBOARDS = {
    "bod": "RPT_EXEC_001",
    "admin": "RPT_EXEC_001",
    "manager": "RPT_SALES_001",
    "sales": "RPT_IND_001",
    "marketing": "RPT_EXEC_001",
    "finance_manager": "RPT_FIN_001",
    "content": "RPT_EXEC_001",
    "hr": "RPT_EXEC_001",
}
