"""
ProHouzing Analytics Service
Prompt 16/20 - Advanced Reports & Analytics Engine

Core service for all analytics queries and calculations.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from config.analytics_config import (
    METRIC_REGISTRY, 
    STANDARD_PERIODS,
    get_metric, 
    get_key_metrics,
    MetricAggregation,
    MetricDataType,
)
from models.analytics_models import (
    MetricResult,
    MetricWithTrend,
    MetricComparison,
    MetricFilters,
    DimensionBreakdown,
    TimeSeries,
    Period,
)


class AnalyticsService:
    """
    Unified service for all analytics queries.
    Single source of truth for metric calculations.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    # ==================== PERIOD HELPERS ====================
    
    def get_period(self, period_type: str, reference_date: date = None) -> Period:
        """Get standard period from type."""
        ref = reference_date or date.today()
        
        if period_type == "today":
            return Period(
                start_date=ref,
                end_date=ref,
                period_type="day",
                label="Hôm nay"
            )
        elif period_type == "yesterday":
            yesterday = ref - timedelta(days=1)
            return Period(
                start_date=yesterday,
                end_date=yesterday,
                period_type="day",
                label="Hôm qua"
            )
        elif period_type == "this_week":
            start = ref - timedelta(days=ref.weekday())
            return Period(
                start_date=start,
                end_date=ref,
                period_type="week",
                label="Tuần này"
            )
        elif period_type == "last_week":
            end = ref - timedelta(days=ref.weekday() + 1)
            start = end - timedelta(days=6)
            return Period(
                start_date=start,
                end_date=end,
                period_type="week",
                label="Tuần trước"
            )
        elif period_type == "this_month":
            start = ref.replace(day=1)
            return Period(
                start_date=start,
                end_date=ref,
                period_type="month",
                label=f"Tháng {ref.month}/{ref.year}"
            )
        elif period_type == "last_month":
            first_this = ref.replace(day=1)
            end = first_this - timedelta(days=1)
            start = end.replace(day=1)
            return Period(
                start_date=start,
                end_date=end,
                period_type="month",
                label=f"Tháng {end.month}/{end.year}"
            )
        elif period_type == "this_quarter":
            q = (ref.month - 1) // 3
            start = date(ref.year, q * 3 + 1, 1)
            return Period(
                start_date=start,
                end_date=ref,
                period_type="quarter",
                label=f"Q{q+1}/{ref.year}"
            )
        elif period_type == "this_year":
            start = date(ref.year, 1, 1)
            return Period(
                start_date=start,
                end_date=ref,
                period_type="year",
                label=f"Năm {ref.year}"
            )
        elif period_type.endswith("d"):
            days = int(period_type[:-1])
            start = ref - timedelta(days=days - 1)
            return Period(
                start_date=start,
                end_date=ref,
                period_type="custom",
                label=f"{days} ngày qua"
            )
        else:
            # Default to this month
            start = ref.replace(day=1)
            return Period(
                start_date=start,
                end_date=ref,
                period_type="month",
                label=f"Tháng {ref.month}/{ref.year}"
            )
    
    def get_comparison_period(self, period: Period) -> Period:
        """Get previous period for comparison."""
        duration = (period.end_date - period.start_date).days
        prev_end = period.start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=duration)
        
        return Period(
            start_date=prev_start,
            end_date=prev_end,
            period_type=period.period_type,
            label=f"Kỳ trước"
        )
    
    # ==================== CORE METRIC METHODS ====================
    
    async def get_metric(
        self,
        metric_code: str,
        filters: MetricFilters = None,
        user: dict = None
    ) -> MetricResult:
        """Get single metric value."""
        metric_def = get_metric(metric_code)
        if not metric_def:
            raise ValueError(f"Metric {metric_code} not found")
        
        filters = filters or MetricFilters()
        period = self.get_period(filters.period_type or "this_month")
        
        # Build query
        query = self._build_query(metric_def, filters, period)
        
        # Execute aggregation
        value = await self._execute_aggregation(
            metric_def.source_collection,
            metric_def.source_field,
            metric_def.aggregation,
            query
        )
        
        # Format value
        formatted = self._format_value(value, metric_def)
        
        # Calculate comparison if requested
        trend = None
        change_percent = None
        previous_value = None
        
        if filters.compare and metric_def.supports_comparison:
            prev_period = self.get_comparison_period(period)
            prev_query = self._build_query(metric_def, filters, prev_period)
            previous_value = await self._execute_aggregation(
                metric_def.source_collection,
                metric_def.source_field,
                metric_def.aggregation,
                prev_query
            )
            if previous_value and previous_value != 0:
                change_percent = ((value - previous_value) / previous_value) * 100
                trend = "up" if change_percent > 0 else "down" if change_percent < 0 else "stable"
        
        return MetricResult(
            metric_code=metric_code,
            metric_name=metric_def.name,
            value=value,
            formatted_value=formatted,
            data_type=metric_def.data_type.value,
            trend=trend,
            change_percent=round(change_percent, 1) if change_percent else None,
            previous_value=previous_value,
            period=period,
            calculated_at=datetime.now(timezone.utc)
        )
    
    async def get_metrics(
        self,
        metric_codes: List[str],
        filters: MetricFilters = None,
        user: dict = None
    ) -> List[MetricResult]:
        """Get multiple metrics in batch."""
        results = []
        for code in metric_codes:
            try:
                result = await self.get_metric(code, filters, user)
                results.append(result)
            except Exception as e:
                # Log error but continue
                print(f"Error getting metric {code}: {e}")
        return results
    
    async def get_key_metrics(
        self,
        filters: MetricFilters = None,
        user: dict = None
    ) -> List[MetricResult]:
        """Get all key metrics for executive dashboard."""
        key_metric_defs = get_key_metrics()
        codes = [m.code for m in key_metric_defs]
        return await self.get_metrics(codes, filters, user)
    
    async def get_metric_with_trend(
        self,
        metric_code: str,
        filters: MetricFilters = None,
        periods: int = 6,
        user: dict = None
    ) -> MetricWithTrend:
        """Get metric with historical trend."""
        # Get current value
        current = await self.get_metric(metric_code, filters, user)
        
        # Get history
        metric_def = get_metric(metric_code)
        history = []
        
        ref_date = date.today()
        for i in range(periods):
            # Go back by period type
            if filters and filters.period_type:
                period_type = filters.period_type
            else:
                period_type = "this_month"
            
            # Calculate offset
            if period_type in ["this_month", "last_month"]:
                offset_date = (ref_date.replace(day=1) - timedelta(days=1)).replace(day=1)
                for _ in range(i):
                    offset_date = (offset_date - timedelta(days=1)).replace(day=1)
                period = Period(
                    start_date=offset_date,
                    end_date=(offset_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1),
                    period_type="month",
                    label=f"T{offset_date.month}"
                )
            else:
                # Default to weekly
                end_d = ref_date - timedelta(days=7 * i)
                start_d = end_d - timedelta(days=6)
                period = Period(
                    start_date=start_d,
                    end_date=end_d,
                    period_type="week",
                    label=f"W{i+1}"
                )
            
            query = self._build_query(metric_def, filters, period)
            value = await self._execute_aggregation(
                metric_def.source_collection,
                metric_def.source_field,
                metric_def.aggregation,
                query
            )
            
            history.append({
                "period": period.label,
                "value": value
            })
        
        # Calculate trend
        history.reverse()
        if len(history) >= 2 and history[-1]["value"] and history[-2]["value"]:
            change = history[-1]["value"] - history[-2]["value"]
            trend_direction = "up" if change > 0 else "down" if change < 0 else "stable"
            trend_strength = abs(change / history[-2]["value"]) if history[-2]["value"] != 0 else 0
        else:
            trend_direction = "stable"
            trend_strength = 0
        
        return MetricWithTrend(
            current=current,
            history=history,
            trend_direction=trend_direction,
            trend_strength=min(trend_strength, 1.0)
        )
    
    async def get_metric_comparison(
        self,
        metric_code: str,
        current_period: Period,
        compare_period: Period,
        user: dict = None
    ) -> MetricComparison:
        """Compare metric between two periods."""
        metric_def = get_metric(metric_code)
        if not metric_def:
            raise ValueError(f"Metric {metric_code} not found")
        
        filters = MetricFilters()
        
        # Get current value
        current_query = self._build_query(metric_def, filters, current_period)
        current_value = await self._execute_aggregation(
            metric_def.source_collection,
            metric_def.source_field,
            metric_def.aggregation,
            current_query
        )
        
        # Get compare value
        compare_query = self._build_query(metric_def, filters, compare_period)
        compare_value = await self._execute_aggregation(
            metric_def.source_collection,
            metric_def.source_field,
            metric_def.aggregation,
            compare_query
        )
        
        change_value = current_value - compare_value
        change_percent = (change_value / compare_value * 100) if compare_value != 0 else 0
        trend = "up" if change_value > 0 else "down" if change_value < 0 else "stable"
        
        return MetricComparison(
            metric_code=metric_code,
            metric_name=metric_def.name,
            current_period=current_period,
            compare_period=compare_period,
            current_value=current_value,
            compare_value=compare_value,
            change_value=change_value,
            change_percent=round(change_percent, 1),
            trend=trend
        )
    
    async def get_metric_by_dimension(
        self,
        metric_code: str,
        dimension: str,
        filters: MetricFilters = None,
        limit: int = 10,
        user: dict = None
    ) -> DimensionBreakdown:
        """Get metric breakdown by dimension."""
        metric_def = get_metric(metric_code)
        if not metric_def:
            raise ValueError(f"Metric {metric_code} not found")
        
        filters = filters or MetricFilters()
        period = self.get_period(filters.period_type or "this_month")
        
        base_query = self._build_query(metric_def, filters, period)
        
        collection = self.db[metric_def.source_collection]
        
        # Build aggregation pipeline
        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": f"${dimension}",
                "value": self._get_agg_operator(metric_def.aggregation, metric_def.source_field)
            }},
            {"$sort": {"value": -1}},
            {"$limit": limit}
        ]
        
        cursor = collection.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        
        total = sum(r["value"] or 0 for r in results)
        
        items = []
        for r in results:
            pct = (r["value"] / total * 100) if total > 0 else 0
            items.append({
                "dimension_value": r["_id"] or "Unknown",
                "value": r["value"],
                "percent": round(pct, 1)
            })
        
        return DimensionBreakdown(
            metric_code=metric_code,
            dimension=dimension,
            total=total,
            items=items
        )
    
    async def get_time_series(
        self,
        metric_code: str,
        granularity: str = "day",
        filters: MetricFilters = None,
        user: dict = None
    ) -> TimeSeries:
        """Get metric values over time."""
        metric_def = get_metric(metric_code)
        if not metric_def:
            raise ValueError(f"Metric {metric_code} not found")
        
        filters = filters or MetricFilters()
        period = self.get_period(filters.period_type or "this_month")
        
        base_query = self._build_query(metric_def, filters, period)
        
        collection = self.db[metric_def.source_collection]
        
        # Determine date field
        date_field = "created_at"
        
        # Build group key based on granularity
        if granularity == "day":
            group_key = {
                "year": {"$year": f"${date_field}"},
                "month": {"$month": f"${date_field}"},
                "day": {"$dayOfMonth": f"${date_field}"}
            }
        elif granularity == "week":
            group_key = {
                "year": {"$year": f"${date_field}"},
                "week": {"$week": f"${date_field}"}
            }
        else:  # month
            group_key = {
                "year": {"$year": f"${date_field}"},
                "month": {"$month": f"${date_field}"}
            }
        
        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": group_key,
                "value": self._get_agg_operator(metric_def.aggregation, metric_def.source_field)
            }},
            {"$sort": {"_id": 1}}
        ]
        
        cursor = collection.aggregate(pipeline)
        results = await cursor.to_list(length=100)
        
        data_points = []
        for r in results:
            if granularity == "day":
                date_str = f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}"
            elif granularity == "week":
                date_str = f"{r['_id']['year']}-W{r['_id']['week']:02d}"
            else:
                date_str = f"{r['_id']['year']}-{r['_id']['month']:02d}"
            
            data_points.append({
                "date": date_str,
                "value": r["value"] or 0
            })
        
        total = sum(dp["value"] for dp in data_points)
        avg = total / len(data_points) if data_points else 0
        
        return TimeSeries(
            metric_code=metric_code,
            granularity=granularity,
            data_points=data_points,
            total=total,
            average=round(avg, 2)
        )
    
    # ==================== CALCULATED METRICS ====================
    
    async def get_conversion_rate(
        self,
        filters: MetricFilters = None
    ) -> float:
        """Calculate lead conversion rate."""
        filters = filters or MetricFilters()
        period = self.get_period(filters.period_type or "this_month")
        
        date_query = {
            "created_at": {
                "$gte": datetime.combine(period.start_date, datetime.min.time()),
                "$lte": datetime.combine(period.end_date, datetime.max.time())
            }
        }
        
        total = await self.db.leads.count_documents(date_query)
        converted = await self.db.leads.count_documents({
            **date_query,
            "stage": {"$in": ["converted", "closed_won"]}
        })
        
        return round((converted / total * 100) if total > 0 else 0, 1)
    
    async def get_win_rate(
        self,
        filters: MetricFilters = None
    ) -> float:
        """Calculate deal win rate."""
        filters = filters or MetricFilters()
        period = self.get_period(filters.period_type or "this_month")
        
        date_query = {
            "created_at": {
                "$gte": datetime.combine(period.start_date, datetime.min.time()),
                "$lte": datetime.combine(period.end_date, datetime.max.time())
            }
        }
        
        total = await self.db.deals.count_documents({
            **date_query,
            "stage": {"$in": ["completed", "lost"]}
        })
        won = await self.db.deals.count_documents({
            **date_query,
            "stage": "completed"
        })
        
        return round((won / total * 100) if total > 0 else 0, 1)
    
    # ==================== PRIVATE HELPERS ====================
    
    def _build_query(
        self,
        metric_def,
        filters: MetricFilters,
        period: Period
    ) -> dict:
        """Build MongoDB query from metric definition and filters."""
        query = {}
        
        # Add default filter conditions from metric definition
        if metric_def.filter_conditions:
            query.update(metric_def.filter_conditions)
        
        # Add date range
        date_field = "created_at"
        query[date_field] = {
            "$gte": datetime.combine(period.start_date, datetime.min.time()),
            "$lte": datetime.combine(period.end_date, datetime.max.time())
        }
        
        # Add scope filters
        if filters.user_id:
            query["$or"] = [
                {"user_id": filters.user_id},
                {"assigned_to": filters.user_id},
                {"owner_id": filters.user_id}
            ]
        
        if filters.team_id:
            query["team_id"] = filters.team_id
        
        if filters.project_id:
            query["project_id"] = filters.project_id
        
        if filters.status:
            query["status"] = {"$in": filters.status}
        
        return query
    
    async def _execute_aggregation(
        self,
        collection_name: str,
        field: str,
        aggregation: MetricAggregation,
        query: dict
    ) -> float:
        """Execute aggregation on collection."""
        collection = self.db[collection_name]
        
        if aggregation == MetricAggregation.COUNT:
            return await collection.count_documents(query)
        
        elif aggregation == MetricAggregation.SUM:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "total": {"$sum": f"${field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0
        
        elif aggregation == MetricAggregation.AVG:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "avg": {"$avg": f"${field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["avg"] if result else 0
        
        elif aggregation == MetricAggregation.MAX:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "max": {"$max": f"${field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["max"] if result else 0
        
        elif aggregation == MetricAggregation.MIN:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "min": {"$min": f"${field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["min"] if result else 0
        
        elif aggregation == MetricAggregation.DISTINCT:
            result = await collection.distinct(field, query)
            return len(result)
        
        return 0
    
    def _get_agg_operator(self, aggregation: MetricAggregation, field: str) -> dict:
        """Get MongoDB aggregation operator."""
        if aggregation == MetricAggregation.COUNT:
            return {"$sum": 1}
        elif aggregation == MetricAggregation.SUM:
            return {"$sum": f"${field}"}
        elif aggregation == MetricAggregation.AVG:
            return {"$avg": f"${field}"}
        elif aggregation == MetricAggregation.MAX:
            return {"$max": f"${field}"}
        elif aggregation == MetricAggregation.MIN:
            return {"$min": f"${field}"}
        return {"$sum": 1}
    
    def _format_value(self, value: float, metric_def) -> str:
        """Format metric value for display."""
        if value is None:
            return "0"
        
        if metric_def.data_type == MetricDataType.CURRENCY:
            if metric_def.format_options.get("short"):
                if value >= 1_000_000_000:
                    return f"{value / 1_000_000_000:.1f} tỷ"
                elif value >= 1_000_000:
                    return f"{value / 1_000_000:.0f} tr"
                else:
                    return f"{value:,.0f} đ"
            return f"{value:,.0f} đ"
        
        elif metric_def.data_type == MetricDataType.PERCENTAGE:
            decimals = metric_def.format_options.get("decimals", 1)
            suffix = metric_def.format_options.get("suffix", "%")
            return f"{value:.{decimals}f}{suffix}"
        
        elif metric_def.data_type == MetricDataType.COUNT:
            return f"{int(value):,}"
        
        return str(value)
