"""
ProHouzing Analytics Router
Prompt 16/20 - Advanced Reports & Analytics Engine

API endpoints for analytics, metrics, and reports.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import date, datetime, timezone
import os
import jwt
import uuid

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

from config.analytics_config import (
    METRIC_REGISTRY,
    REPORT_REGISTRY,
    STANDARD_PERIODS,
    ROLE_DEFAULT_DASHBOARDS,
    get_metric,
    get_metrics_by_category,
    get_key_metrics,
    get_metric_categories,
    get_report,
    get_reports_for_role,
    MetricCategory,
)
from models.analytics_models import (
    MetricFilters,
    ReportFilters,
    MetricResult,
    MetricWithTrend,
    MetricComparison,
    DimensionBreakdown,
    TimeSeries,
    Period,
    AnalyticsResponse,
    AnalyticsMetadata,
    DashboardData,
    ExecutiveDashboardData,
    ReportData,
    MetricDefinitionResponse,
    ReportDefinitionResponse,
    PeriodOption,
)
from services.analytics_service import AnalyticsService


# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

# Initialize service
analytics_service = AnalyticsService(db)

# Initialize Performance Layer
from services.analytics_performance import (
    init_performance_layer,
    get_cache,
    get_query_guard,
    get_pre_agg_service,
    get_scheduler,
    get_metric_freshness,
    get_report_freshness,
    QueryLimitExceeded,
    FreshnessType,
)

perf_layer = init_performance_layer(db)
analytics_cache = perf_layer["cache"]
query_guard = perf_layer["query_guard"]


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Create router
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ==================== CONFIG ENDPOINTS ====================

@analytics_router.get("/config/metrics")
async def get_metric_definitions(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all metric definitions."""
    start_time = datetime.now(timezone.utc)
    
    if category:
        try:
            cat = MetricCategory(category)
            metrics = get_metrics_by_category(cat)
        except ValueError:
            metrics = list(METRIC_REGISTRY.values())
    else:
        metrics = list(METRIC_REGISTRY.values())
    
    data = [
        MetricDefinitionResponse(
            code=m.code,
            name=m.name,
            name_en=m.name_en,
            category=m.category.value,
            data_type=m.data_type.value,
            is_key_metric=m.is_key_metric,
            supports_trend=m.supports_trend,
            supports_comparison=m.supports_comparison,
            description=m.description
        )
        for m in metrics
    ]
    
    return AnalyticsResponse(
        success=True,
        data=data,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


@analytics_router.get("/config/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    """Get metric categories."""
    return AnalyticsResponse(
        success=True,
        data=get_metric_categories(),
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/config/periods")
async def get_periods(current_user: dict = Depends(get_current_user)):
    """Get available period options."""
    data = [
        PeriodOption(code=code, label=info["label"])
        for code, info in STANDARD_PERIODS.items()
    ]
    return AnalyticsResponse(
        success=True,
        data=data,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/config/reports")
async def get_report_definitions(current_user: dict = Depends(get_current_user)):
    """Get reports available to user."""
    role = current_user.get("role", "sales")
    reports = get_reports_for_role(role)
    
    data = [
        ReportDefinitionResponse(
            code=r.code,
            name=r.name,
            name_en=r.name_en,
            category=r.category.value,
            report_type=r.report_type.value,
            description=r.description,
            supports_export=r.supports_export,
            supports_filter=r.supports_filter,
            default_period=r.default_period,
            route=r.route
        )
        for r in reports
    ]
    
    return AnalyticsResponse(
        success=True,
        data=data,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


# ==================== METRIC ENDPOINTS ====================

@analytics_router.get("/metrics/{metric_code}")
async def get_metric_value(
    metric_code: str,
    period_type: str = "this_month",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    compare: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get single metric value with caching and freshness control."""
    start_time = datetime.now(timezone.utc)
    
    # Get freshness config for this metric
    freshness = get_metric_freshness(metric_code)
    
    # Check cache for non-real-time metrics
    cache_key = f"metric:{metric_code}:{period_type}:{compare}"
    if freshness.freshness_type != FreshnessType.REAL_TIME:
        cached = analytics_cache.get(cache_key)
        if cached:
            return AnalyticsResponse(
                success=True,
                data=cached,
                metadata=AnalyticsMetadata(
                    request_id=str(uuid.uuid4()),
                    timestamp=datetime.now(timezone.utc),
                    filters_applied={"period_type": period_type, "compare": compare},
                    execution_time_ms=0,
                    is_cached=True,
                    cache_ttl=freshness.cache_ttl_seconds
                )
            )
    
    filters = MetricFilters(
        period_type=period_type,
        start_date=start_date,
        end_date=end_date,
        compare=compare
    )
    
    try:
        result = await analytics_service.get_metric(metric_code, filters, current_user)
        
        # Cache the result - use mode='json' for JSON-safe serialization
        if freshness.cache_ttl_seconds > 0:
            analytics_cache.set(cache_key, result.model_dump(mode='json'), freshness.cache_ttl_seconds)
            # Save snapshot for fail-safe
            await analytics_cache.save_snapshot(f"metric:{metric_code}", result.model_dump(mode='json'), {"period_type": period_type})
        
        return AnalyticsResponse(
            success=True,
            data=result,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                period=result.period,
                filters_applied={"period_type": period_type, "compare": compare, "freshness": freshness.freshness_type.value},
                execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000),
                is_cached=False
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Fail-safe: return last snapshot if available
        snapshot = await analytics_cache.get_snapshot(f"metric:{metric_code}", {"period_type": period_type})
        if snapshot:
            return AnalyticsResponse(
                success=True,
                data=snapshot["data"],
                metadata=AnalyticsMetadata(
                    request_id=str(uuid.uuid4()),
                    timestamp=datetime.now(timezone.utc),
                    filters_applied={"period_type": period_type, "is_snapshot": True, "snapshot_time": snapshot.get("created_at")},
                    execution_time_ms=0,
                    is_cached=True
                ),
                error=f"Using cached snapshot from {snapshot.get('created_at')} due to: {str(e)}"
            )
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.post("/metrics/batch")
async def get_metrics_batch(
    metric_codes: List[str],
    period_type: str = "this_month",
    compare: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get multiple metrics in batch."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type, compare=compare)
    results = await analytics_service.get_metrics(metric_codes, filters, current_user)
    
    return AnalyticsResponse(
        success=True,
        data=results,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            filters_applied={"period_type": period_type, "metric_count": len(metric_codes)},
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


@analytics_router.get("/metrics/{metric_code}/trend")
async def get_metric_trend(
    metric_code: str,
    periods: int = 6,
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get metric with historical trend."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    
    try:
        result = await analytics_service.get_metric_with_trend(
            metric_code, filters, periods, current_user
        )
        
        return AnalyticsResponse(
            success=True,
            data=result,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                filters_applied={"periods": periods},
                execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@analytics_router.get("/metrics/{metric_code}/breakdown/{dimension}")
async def get_metric_breakdown(
    metric_code: str,
    dimension: str,
    period_type: str = "this_month",
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get metric breakdown by dimension."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    
    try:
        result = await analytics_service.get_metric_by_dimension(
            metric_code, dimension, filters, limit, current_user
        )
        
        return AnalyticsResponse(
            success=True,
            data=result,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                filters_applied={"dimension": dimension, "limit": limit},
                execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@analytics_router.get("/metrics/{metric_code}/timeseries")
async def get_metric_timeseries(
    metric_code: str,
    granularity: str = "day",
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get metric time series for charting."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    
    try:
        result = await analytics_service.get_time_series(
            metric_code, granularity, filters, current_user
        )
        
        return AnalyticsResponse(
            success=True,
            data=result,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                filters_applied={"granularity": granularity},
                execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==================== DASHBOARD ENDPOINTS ====================

@analytics_router.get("/dashboards/executive")
async def get_executive_dashboard(
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get executive dashboard data with caching and fail-safe."""
    start_time = datetime.now(timezone.utc)
    
    # Get freshness config
    freshness = get_report_freshness("executive_dashboard")
    cache_key = f"dashboard:executive:{period_type}"
    
    # Check cache
    cached = analytics_cache.get(cache_key)
    if cached:
        return AnalyticsResponse(
            success=True,
            data=cached,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                filters_applied={"period_type": period_type},
                execution_time_ms=0,
                is_cached=True,
                cache_ttl=freshness.cache_ttl_seconds
            )
        )
    
    try:
        filters = MetricFilters(period_type=period_type, compare=True)
        
        # Get key metrics
        key_metrics = await analytics_service.get_key_metrics(filters, current_user)
        
        # Get revenue trend
        revenue_trend = await analytics_service.get_time_series(
            "REV_002", "month", MetricFilters(period_type="this_year"), current_user
        )
        
        # Get lead funnel
        lead_funnel = await analytics_service.get_metric_by_dimension(
            "LEAD_001", "stage", filters, 10, current_user
        )
        
        # Get recent deals
        recent_deals = await db.deals.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        data = ExecutiveDashboardData(
            key_metrics=key_metrics,
            revenue_trend=revenue_trend,
            lead_funnel=lead_funnel,
            recent_deals=recent_deals,
            alerts=[]
        )
        
        # Cache result - use mode='json' for JSON-safe serialization
        data_dict = data.model_dump(mode='json')
        analytics_cache.set(cache_key, data_dict, freshness.cache_ttl_seconds)
        await analytics_cache.save_snapshot("dashboard:executive", data_dict, {"period_type": period_type})
        
        return AnalyticsResponse(
            success=True,
            data=data,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                period=analytics_service.get_period(period_type),
                filters_applied={"freshness": freshness.freshness_type.value},
                execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000),
                is_cached=False
            )
        )
    except Exception as e:
        # Fail-safe: return last snapshot
        snapshot = await analytics_cache.get_snapshot("dashboard:executive", {"period_type": period_type})
        if snapshot:
            return AnalyticsResponse(
                success=True,
                data=snapshot["data"],
                metadata=AnalyticsMetadata(
                    request_id=str(uuid.uuid4()),
                    timestamp=datetime.now(timezone.utc),
                    filters_applied={"is_snapshot": True, "snapshot_time": str(snapshot.get("created_at"))},
                    execution_time_ms=0,
                    is_cached=True
                ),
                error=f"Using snapshot from {snapshot.get('created_at')}"
            )
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/dashboards/key-metrics")
async def get_key_metrics_dashboard(
    period_type: str = "this_month",
    compare: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Get key metrics for dashboard cards."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type, compare=compare)
    key_metrics = await analytics_service.get_key_metrics(filters, current_user)
    
    return AnalyticsResponse(
        success=True,
        data=key_metrics,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            period=analytics_service.get_period(period_type),
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


# ==================== REPORT ENDPOINTS ====================

@analytics_router.get("/reports/conversion")
async def get_conversion_report(
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get lead conversion report."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    period = analytics_service.get_period(period_type)
    
    # Get metrics
    total_leads = await analytics_service.get_metric("LEAD_001", filters, current_user)
    conversion_rate = await analytics_service.get_conversion_rate(filters)
    
    # Get funnel data
    funnel = await analytics_service.get_metric_by_dimension(
        "LEAD_001", "stage", filters, 10, current_user
    )
    
    # Get by source
    by_source = await analytics_service.get_metric_by_dimension(
        "LEAD_001", "source", filters, 10, current_user
    )
    
    data = ReportData(
        report_code="RPT_CRM_002",
        report_name="Lead Conversion Report",
        period=period,
        metrics=[total_leads],
        breakdowns=[funnel, by_source],
        tables=[],
        charts=[]
    )
    
    return AnalyticsResponse(
        success=True,
        data={
            "total_leads": total_leads.value,
            "conversion_rate": conversion_rate,
            "closed_won": funnel.items[0]["value"] if funnel.items else 0,
            "loss_rate": 100 - conversion_rate,
            "funnel": funnel,
            "by_source": by_source
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            period=period,
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


@analytics_router.get("/reports/pipeline")
async def get_pipeline_report(
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get sales pipeline report."""
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    period = analytics_service.get_period(period_type)
    
    # Get metrics
    metrics = await analytics_service.get_metrics(
        ["SALES_001", "SALES_002", "SALES_003", "SALES_004"],
        filters,
        current_user
    )
    
    # Get by stage
    by_stage = await analytics_service.get_metric_by_dimension(
        "SALES_001", "stage", filters, 15, current_user
    )
    
    return AnalyticsResponse(
        success=True,
        data={
            "metrics": metrics,
            "by_stage": by_stage
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            period=period,
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


# ==================== CALCULATED METRICS ====================

@analytics_router.get("/calculated/conversion-rate")
async def get_conversion_rate(
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get calculated conversion rate."""
    filters = MetricFilters(period_type=period_type)
    rate = await analytics_service.get_conversion_rate(filters)
    
    return AnalyticsResponse(
        success=True,
        data={"conversion_rate": rate},
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/calculated/win-rate")
async def get_win_rate(
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """Get calculated win rate."""
    filters = MetricFilters(period_type=period_type)
    rate = await analytics_service.get_win_rate(filters)
    
    return AnalyticsResponse(
        success=True,
        data={"win_rate": rate},
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


# ==================== ADVANCED ANALYTICS IMPORTS ====================

from services.advanced_analytics_service import (
    AdvancedAnalyticsService,
    MetricGovernanceService,
    LEAD_FUNNEL_STAGES,
    DEAL_PIPELINE_STAGES
)

advanced_analytics = AdvancedAnalyticsService(db)
governance_service = MetricGovernanceService(db)


# ==================== 1. DRILL-DOWN ENGINE ====================

@analytics_router.get("/drilldown")
async def get_drilldown(
    metric_code: str,
    period_type: str = "this_month",
    page: int = 1,
    page_size: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Get drill-down data for a metric - returns raw records.
    Click on any KPI to see underlying data.
    Query guard enforces max records limit.
    """
    start_time = datetime.now(timezone.utc)
    
    # Validate metric exists in governance
    if not governance_service.validate_metric_code(metric_code):
        raise HTTPException(status_code=404, detail=f"Metric {metric_code} not found in registry")
    
    # Query guard: limit page_size
    guarded_page_size = query_guard.validate_drilldown_limit(page_size)
    
    filters = MetricFilters(period_type=period_type)
    
    try:
        # Acquire heavy query slot for large requests
        if guarded_page_size > 100:
            await query_guard.acquire_heavy_query_slot()
        
        result = await advanced_analytics.get_drilldown(
            metric_code, filters, page, guarded_page_size, current_user
        )
        
        return AnalyticsResponse(
            success=True,
            data=result,
            metadata=AnalyticsMetadata(
                request_id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                filters_applied={
                    "period_type": period_type, 
                    "page": page, 
                    "page_size": guarded_page_size,
                    "max_allowed": query_guard.MAX_DRILLDOWN_RECORDS
                },
                execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            )
        )
    except QueryLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    finally:
        if guarded_page_size > 100:
            await query_guard.release_heavy_query_slot()


# ==================== 2. FUNNEL ANALYTICS ENGINE ====================

@analytics_router.get("/funnel")
async def get_funnel(
    funnel_type: str = "lead",
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """
    Get full funnel analytics with conversion rates, drop-off, and avg time.
    
    funnel_type: "lead" or "deal"
    """
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    
    result = await advanced_analytics.get_full_funnel(funnel_type, filters, current_user)
    
    return AnalyticsResponse(
        success=True,
        data=result,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            filters_applied={"funnel_type": funnel_type, "period_type": period_type},
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


@analytics_router.get("/funnel/stages")
async def get_funnel_stages(
    funnel_type: str = "lead",
    current_user: dict = Depends(get_current_user)
):
    """Get funnel stage definitions."""
    stages = LEAD_FUNNEL_STAGES if funnel_type == "lead" else DEAL_PIPELINE_STAGES
    return AnalyticsResponse(
        success=True,
        data={"funnel_type": funnel_type, "stages": stages},
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


# ==================== 3. BOTTLENECK ANALYTICS ====================

@analytics_router.get("/bottlenecks")
async def get_bottlenecks(
    period_type: str = "this_month",
    current_user: dict = Depends(get_current_user)
):
    """
    Get operational bottlenecks:
    - Stale deals (> 7 days no update)
    - Overdue follow-ups
    - Contracts pending review
    - Expiring bookings
    - Unassigned leads
    """
    start_time = datetime.now(timezone.utc)
    
    filters = MetricFilters(period_type=period_type)
    result = await advanced_analytics.get_bottlenecks(filters, current_user)
    
    return AnalyticsResponse(
        success=True,
        data=result,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


# ==================== 4. SAVED VIEWS ====================

@analytics_router.post("/views")
async def save_view(
    view_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Save a report view configuration."""
    result = await advanced_analytics.save_report_view(
        current_user["id"],
        view_data
    )
    
    return AnalyticsResponse(
        success=True,
        data=result,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/views")
async def get_views(
    report_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get saved views for current user."""
    views = await advanced_analytics.get_saved_views(
        current_user["id"],
        report_type,
        current_user.get("role")
    )
    
    return AnalyticsResponse(
        success=True,
        data=views,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/views/default")
async def get_default_view(
    report_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Get default view for a report type."""
    view = await advanced_analytics.get_default_view(
        current_user["id"],
        report_type,
        current_user.get("role")
    )
    
    return AnalyticsResponse(
        success=True,
        data=view,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.delete("/views/{view_id}")
async def delete_view(
    view_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a saved view."""
    success = await advanced_analytics.delete_saved_view(view_id, current_user["id"])
    
    if not success:
        raise HTTPException(status_code=404, detail="View not found or access denied")
    
    return AnalyticsResponse(
        success=True,
        data={"deleted": True, "view_id": view_id},
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


# ==================== 5. EXPORT ENGINE ====================

@analytics_router.get("/export/{metric_code}")
async def export_metric(
    metric_code: str,
    period_type: str = "this_month",
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export metric drill-down data as CSV."""
    start_time = datetime.now(timezone.utc)
    
    if not governance_service.validate_metric_code(metric_code):
        raise HTTPException(status_code=404, detail=f"Metric {metric_code} not found")
    
    filters = MetricFilters(period_type=period_type)
    
    result = await advanced_analytics.export_metric_data(
        metric_code, filters, format, current_user
    )
    
    return AnalyticsResponse(
        success=True,
        data=result,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            execution_time_ms=int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        )
    )


@analytics_router.get("/export/report/{report_type}")
async def export_report(
    report_type: str,
    period_type: str = "this_month",
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export a full report as CSV."""
    filters = MetricFilters(period_type=period_type)
    
    result = await advanced_analytics.export_report(
        report_type, filters, format, current_user
    )
    
    return AnalyticsResponse(
        success=True,
        data=result,
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


# ==================== 6. METRIC GOVERNANCE ====================

@analytics_router.get("/governance/metrics")
async def get_metrics_governance(
    current_user: dict = Depends(get_current_user)
):
    """Get all registered metrics with governance metadata."""
    metrics = governance_service.get_all_metrics_metadata()
    
    return AnalyticsResponse(
        success=True,
        data={
            "total_metrics": len(metrics),
            "metrics": metrics,
            "registry_version": "1.0.0"
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/governance/validate/{metric_code}")
async def validate_metric(
    metric_code: str,
    current_user: dict = Depends(get_current_user)
):
    """Validate if a metric code exists in registry."""
    is_valid = governance_service.validate_metric_code(metric_code)
    version = governance_service.get_metric_version(metric_code) if is_valid else None
    
    return AnalyticsResponse(
        success=True,
        data={
            "metric_code": metric_code,
            "is_valid": is_valid,
            "version": version
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


# ==================== PERFORMANCE ENDPOINTS ====================

@analytics_router.get("/performance/status")
async def get_performance_status(
    current_user: dict = Depends(get_current_user)
):
    """Get analytics performance layer status."""
    return AnalyticsResponse(
        success=True,
        data={
            "cache": analytics_cache.get_stats(),
            "query_guard": query_guard.get_status(),
            "freshness_types": {
                "real_time": "< 5 seconds",
                "near_real_time": "1-5 minutes",
                "batch": "5-30 minutes"
            }
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.post("/performance/cache/clear")
async def clear_cache(
    prefix: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Clear analytics cache (admin only)."""
    if current_user.get("role") not in ["admin", "bod"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if prefix:
        analytics_cache.invalidate_prefix(prefix)
        message = f"Cleared cache with prefix: {prefix}"
    else:
        analytics_cache.clear_all()
        message = "Cleared all analytics cache"
    
    return AnalyticsResponse(
        success=True,
        data={"message": message, "cache_stats": analytics_cache.get_stats()},
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.post("/performance/precompute")
async def run_precompute(
    job_type: str = "daily",
    current_user: dict = Depends(get_current_user)
):
    """Run pre-computation jobs (admin only)."""
    if current_user.get("role") not in ["admin", "bod"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from services.analytics_performance import get_scheduler
    scheduler = get_scheduler()
    
    if job_type == "daily":
        count = await scheduler.run_daily_jobs()
    elif job_type == "weekly":
        count = await scheduler.run_weekly_jobs()
    else:
        raise HTTPException(status_code=400, detail="Invalid job_type. Use 'daily' or 'weekly'")
    
    return AnalyticsResponse(
        success=True,
        data={
            "job_type": job_type,
            "aggregations_computed": count,
            "scheduler_status": scheduler.get_status()
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )


@analytics_router.get("/performance/freshness/{metric_code}")
async def get_metric_freshness_info(
    metric_code: str,
    current_user: dict = Depends(get_current_user)
):
    """Get freshness configuration for a metric."""
    freshness = get_metric_freshness(metric_code)
    
    return AnalyticsResponse(
        success=True,
        data={
            "metric_code": metric_code,
            "freshness_type": freshness.freshness_type.value,
            "refresh_interval_seconds": freshness.refresh_interval_seconds,
            "cache_ttl_seconds": freshness.cache_ttl_seconds,
            "description": freshness.description
        },
        metadata=AnalyticsMetadata(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc)
        )
    )
