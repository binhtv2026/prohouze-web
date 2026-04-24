"""
ProHouzing Analytics Models
Prompt 16/20 - Advanced Reports & Analytics Engine

Pydantic models for analytics API responses.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Generic, TypeVar
from datetime import date, datetime
from enum import Enum


# ==================== GENERIC TYPE ====================

T = TypeVar('T')


# ==================== PERIOD MODELS ====================

class Period(BaseModel):
    """Standardized period definition."""
    start_date: date
    end_date: date
    period_type: str = "custom"  # day, week, month, quarter, year, custom
    label: str = ""
    
    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "2026-03-01",
                "end_date": "2026-03-17",
                "period_type": "month",
                "label": "Tháng 3/2026"
            }
        }


# ==================== FILTER MODELS ====================

class MetricFilters(BaseModel):
    """Standard filters for all metric queries."""
    # Period
    period_type: Optional[str] = "this_month"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    # Scope filters
    user_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    project_id: Optional[str] = None
    
    # Entity filters
    status: Optional[List[str]] = None
    category: Optional[str] = None
    
    # Comparison
    compare: Optional[bool] = False
    
    class Config:
        extra = "allow"


class ReportFilters(MetricFilters):
    """Extended filters for reports."""
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "desc"
    limit: Optional[int] = 100
    offset: Optional[int] = 0


# ==================== RESULT MODELS ====================

class MetricResult(BaseModel):
    """Standard metric result."""
    metric_code: str
    metric_name: str
    value: Any
    formatted_value: str
    data_type: str
    
    # Trend/comparison
    trend: Optional[str] = None  # up, down, stable
    change_value: Optional[float] = None
    change_percent: Optional[float] = None
    previous_value: Optional[float] = None
    
    # Metadata
    period: Optional[Period] = None
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    is_cached: bool = False


class MetricWithTrend(BaseModel):
    """Metric with historical trend data."""
    current: MetricResult
    history: List[Dict[str, Any]]  # [{period, value}, ...]
    trend_direction: str  # up, down, stable
    trend_strength: float = 0.0  # 0-1


class MetricComparison(BaseModel):
    """Comparison between two periods."""
    metric_code: str
    metric_name: str
    current_period: Period
    compare_period: Period
    current_value: float
    compare_value: float
    change_value: float
    change_percent: float
    trend: str


class DimensionBreakdown(BaseModel):
    """Metric breakdown by dimension."""
    metric_code: str
    dimension: str
    total: float
    items: List[Dict[str, Any]]  # [{dimension_value, value, percent}, ...]


class TimeSeries(BaseModel):
    """Time series data for charting."""
    metric_code: str
    granularity: str  # day, week, month
    data_points: List[Dict[str, Any]]  # [{date, value}, ...]
    total: float
    average: float


# ==================== RESPONSE WRAPPER ====================

class AnalyticsMetadata(BaseModel):
    """Metadata for analytics responses."""
    request_id: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    period: Optional[Period] = None
    filters_applied: Dict[str, Any] = {}
    execution_time_ms: int = 0
    is_cached: bool = False
    cache_ttl: Optional[int] = None


class AnalyticsResponse(BaseModel, Generic[T]):
    """Standard wrapper for all analytics responses."""
    success: bool = True
    data: Any
    metadata: AnalyticsMetadata = Field(default_factory=AnalyticsMetadata)
    error: Optional[str] = None


# ==================== DASHBOARD MODELS ====================

class DashboardWidget(BaseModel):
    """Widget configuration for dashboard."""
    id: str
    type: str  # kpi_card, chart, table
    title: str
    metrics: List[str] = []
    config: Dict[str, Any] = {}
    position: Dict[str, int] = {}  # row, col, span


class DashboardData(BaseModel):
    """Complete dashboard data."""
    dashboard_id: str
    dashboard_name: str
    widgets: List[DashboardWidget]
    metrics: List[MetricResult]
    period: Period
    last_updated: datetime


class ExecutiveDashboardData(BaseModel):
    """Executive dashboard specific data."""
    key_metrics: List[MetricResult]
    revenue_trend: TimeSeries
    lead_funnel: DimensionBreakdown
    recent_deals: List[Dict[str, Any]]
    alerts: List[Dict[str, Any]]


# ==================== REPORT MODELS ====================

class ReportData(BaseModel):
    """Generic report data."""
    report_code: str
    report_name: str
    period: Period
    metrics: List[MetricResult]
    breakdowns: List[DimensionBreakdown] = []
    tables: List[Dict[str, Any]] = []
    charts: List[Dict[str, Any]] = []
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class FunnelData(BaseModel):
    """Funnel report data."""
    stages: List[Dict[str, Any]]  # [{stage, count, percent, conversion_rate}, ...]
    total_entries: int
    total_conversions: int
    overall_conversion_rate: float


# ==================== CONFIG RESPONSES ====================

class MetricDefinitionResponse(BaseModel):
    """Metric definition for frontend."""
    code: str
    name: str
    name_en: str
    category: str
    data_type: str
    is_key_metric: bool
    supports_trend: bool
    supports_comparison: bool
    description: str


class ReportDefinitionResponse(BaseModel):
    """Report definition for frontend."""
    code: str
    name: str
    name_en: str
    category: str
    report_type: str
    description: str
    supports_export: bool
    supports_filter: bool
    default_period: str
    route: str


class PeriodOption(BaseModel):
    """Period option for selector."""
    code: str
    label: str
