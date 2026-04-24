"""
ProHouzing Analytics Performance Layer
Prompt 16/20 - Production-Scale Analytics

Features:
1. Data Freshness Strategy
2. Cache Layer
3. Async Pre-aggregation
4. Query Guard
5. Fail-safe with Snapshots
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, date, timedelta, timezone
from enum import Enum
from dataclasses import dataclass
import hashlib
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase


# ==================== 1. DATA FRESHNESS STRATEGY ====================

class FreshnessType(str, Enum):
    REAL_TIME = "real_time"           # < 5 seconds
    NEAR_REAL_TIME = "near_real_time" # 1-5 minutes
    BATCH = "batch"                    # 5-30 minutes


@dataclass
class FreshnessConfig:
    freshness_type: FreshnessType
    refresh_interval_seconds: int
    cache_ttl_seconds: int
    description: str


# Metric Freshness Configuration
METRIC_FRESHNESS = {
    # Real-time metrics (< 5s) - No cache, always live
    "TASK_001": FreshnessConfig(FreshnessType.REAL_TIME, 5, 0, "Tasks need immediate updates"),
    "TASK_002": FreshnessConfig(FreshnessType.REAL_TIME, 5, 0, "Overdue tasks critical"),
    "TASK_003": FreshnessConfig(FreshnessType.REAL_TIME, 5, 0, "Completed tasks"),
    
    # Near real-time metrics (1-5 min) - Short cache
    "LEAD_001": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Lead counts"),
    "LEAD_002": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "New leads"),
    "LEAD_003": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Hot leads"),
    "LEAD_004": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 120, 120, "Conversion rate"),
    "LEAD_005": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 300, 300, "CPL"),
    "SALES_001": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Total deals"),
    "SALES_002": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Won deals"),
    "SALES_003": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Pipeline value"),
    "SALES_004": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 120, 120, "Win rate"),
    "SALES_005": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Bookings"),
    "CRM_001": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 120, 120, "Total contacts"),
    "CRM_002": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 120, 120, "Customers"),
    "INV_001": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 300, 300, "Total products"),
    "INV_002": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Available units"),
    "INV_003": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 60, 60, "Sold units"),
    "COMM_001": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 300, 300, "Total commission"),
    "COMM_002": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 120, 120, "Pending commission"),
    "COMM_003": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 300, 300, "Paid commission"),
    
    # Batch metrics (5-30 min) - Longer cache, heavier computation
    "REV_001": FreshnessConfig(FreshnessType.BATCH, 600, 600, "Total revenue"),
    "REV_002": FreshnessConfig(FreshnessType.BATCH, 600, 600, "Monthly revenue"),
    "REV_003": FreshnessConfig(FreshnessType.BATCH, 600, 600, "Contract value"),
    "MKT_001": FreshnessConfig(FreshnessType.BATCH, 900, 900, "Active campaigns"),
    "MKT_002": FreshnessConfig(FreshnessType.BATCH, 900, 900, "Marketing ROI"),
    "CONTENT_001": FreshnessConfig(FreshnessType.BATCH, 900, 900, "Total articles"),
    "CONTENT_002": FreshnessConfig(FreshnessType.BATCH, 600, 600, "Page views"),
    "CONTENT_003": FreshnessConfig(FreshnessType.BATCH, 300, 300, "Form submissions"),
    "HR_001": FreshnessConfig(FreshnessType.BATCH, 1800, 1800, "Total employees"),
    "HR_002": FreshnessConfig(FreshnessType.BATCH, 1800, 1800, "Open positions"),
}

# Report/Dashboard Freshness
REPORT_FRESHNESS = {
    "executive_dashboard": FreshnessConfig(FreshnessType.BATCH, 300, 300, "Executive overview"),
    "lead_funnel": FreshnessConfig(FreshnessType.BATCH, 600, 600, "Lead funnel analysis"),
    "deal_funnel": FreshnessConfig(FreshnessType.BATCH, 600, 600, "Deal pipeline analysis"),
    "bottlenecks": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 120, 120, "Risk alerts"),
    "conversion_report": FreshnessConfig(FreshnessType.BATCH, 900, 900, "Conversion analysis"),
    "pipeline_report": FreshnessConfig(FreshnessType.NEAR_REAL_TIME, 300, 300, "Pipeline status"),
}

def get_metric_freshness(metric_code: str) -> FreshnessConfig:
    """Get freshness config for a metric."""
    return METRIC_FRESHNESS.get(metric_code, FreshnessConfig(
        FreshnessType.NEAR_REAL_TIME, 120, 120, "Default"
    ))

def get_report_freshness(report_type: str) -> FreshnessConfig:
    """Get freshness config for a report."""
    return REPORT_FRESHNESS.get(report_type, FreshnessConfig(
        FreshnessType.BATCH, 600, 600, "Default report"
    ))


# ==================== 2. CACHE LAYER ====================

class AnalyticsCache:
    """
    In-memory cache for analytics data with TTL support.
    In production, replace with Redis for multi-instance support.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase = None):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._db = db
        self._snapshots_collection = "analytics_snapshots"
    
    def _generate_key(self, prefix: str, metric_code: str = None, filters: dict = None) -> str:
        """Generate cache key from parameters."""
        key_parts = [prefix]
        if metric_code:
            key_parts.append(metric_code)
        if filters:
            # Sort filters for consistent key
            filter_str = json.dumps(filters, sort_keys=True, default=str)
            filter_hash = hashlib.md5(filter_str.encode()).hexdigest()[:8]
            key_parts.append(filter_hash)
        return ":".join(key_parts)
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached value if not expired."""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if datetime.now(timezone.utc) > entry["expires_at"]:
            del self._cache[key]
            return None
        
        return entry["data"]
    
    def set(self, key: str, data: Any, ttl_seconds: int):
        """Set cache value with TTL."""
        self._cache[key] = {
            "data": data,
            "cached_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
            "ttl": ttl_seconds
        }
    
    def invalidate(self, key: str):
        """Invalidate specific cache key."""
        if key in self._cache:
            del self._cache[key]
    
    def invalidate_prefix(self, prefix: str):
        """Invalidate all keys with prefix."""
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
        for key in keys_to_delete:
            del self._cache[key]
    
    def clear_all(self):
        """Clear entire cache."""
        self._cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        now = datetime.now(timezone.utc)
        valid_entries = sum(1 for e in self._cache.values() if e["expires_at"] > now)
        return {
            "total_entries": len(self._cache),
            "valid_entries": valid_entries,
            "expired_entries": len(self._cache) - valid_entries
        }
    
    # ==================== SNAPSHOT PERSISTENCE (FAIL-SAFE) ====================
    
    async def save_snapshot(self, snapshot_type: str, data: Any, filters: dict = None):
        """Save successful query result as snapshot for fail-safe."""
        if self._db is None:
            return
        
        snapshot = {
            "type": snapshot_type,
            "filters": filters or {},
            "data": data,
            "created_at": datetime.now(timezone.utc),
            "is_valid": True
        }
        
        # Upsert - replace existing snapshot of same type/filters
        filter_key = self._generate_key(snapshot_type, filters=filters)
        await self._db[self._snapshots_collection].update_one(
            {"filter_key": filter_key},
            {"$set": {**snapshot, "filter_key": filter_key}},
            upsert=True
        )
    
    async def get_snapshot(self, snapshot_type: str, filters: dict = None) -> Optional[Dict[str, Any]]:
        """Get last successful snapshot for fail-safe."""
        if self._db is None:
            return None
        
        filter_key = self._generate_key(snapshot_type, filters=filters)
        snapshot = await self._db[self._snapshots_collection].find_one(
            {"filter_key": filter_key, "is_valid": True},
            {"_id": 0}
        )
        return snapshot
    
    async def cleanup_old_snapshots(self, max_age_days: int = 7):
        """Clean up old snapshots."""
        if self._db is None:
            return
        
        cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
        await self._db[self._snapshots_collection].delete_many({
            "created_at": {"$lt": cutoff}
        })


# ==================== 3. QUERY GUARD ====================

class QueryGuard:
    """
    Protect system from heavy queries.
    Enforces limits on date ranges, record counts, and query complexity.
    """
    
    # Configuration
    MAX_DATE_RANGE_DAYS = 365  # Maximum date range
    MAX_DRILLDOWN_RECORDS = 10000  # Maximum records in drill-down
    MAX_EXPORT_RECORDS = 50000  # Maximum records for export
    MAX_CONCURRENT_HEAVY_QUERIES = 5  # Limit concurrent heavy queries
    HEAVY_QUERY_TIMEOUT_SECONDS = 30  # Timeout for heavy queries
    
    def __init__(self):
        self._active_heavy_queries = 0
        self._lock = asyncio.Lock()
    
    def validate_date_range(self, start_date: date, end_date: date) -> bool:
        """Validate date range is within limits."""
        if not start_date or not end_date:
            return True
        
        delta = (end_date - start_date).days
        if delta > self.MAX_DATE_RANGE_DAYS:
            raise QueryLimitExceeded(
                f"Date range exceeds maximum of {self.MAX_DATE_RANGE_DAYS} days. "
                f"Requested: {delta} days"
            )
        if delta < 0:
            raise QueryLimitExceeded("End date must be after start date")
        return True
    
    def validate_drilldown_limit(self, page_size: int) -> int:
        """Validate and cap drill-down page size."""
        return min(page_size, self.MAX_DRILLDOWN_RECORDS)
    
    def validate_export_limit(self, requested_limit: int) -> int:
        """Validate and cap export record limit."""
        return min(requested_limit, self.MAX_EXPORT_RECORDS)
    
    async def acquire_heavy_query_slot(self) -> bool:
        """Try to acquire a slot for heavy query."""
        async with self._lock:
            if self._active_heavy_queries >= self.MAX_CONCURRENT_HEAVY_QUERIES:
                raise QueryLimitExceeded(
                    f"Too many concurrent heavy queries. "
                    f"Maximum: {self.MAX_CONCURRENT_HEAVY_QUERIES}. Please retry later."
                )
            self._active_heavy_queries += 1
            return True
    
    async def release_heavy_query_slot(self):
        """Release heavy query slot."""
        async with self._lock:
            self._active_heavy_queries = max(0, self._active_heavy_queries - 1)
    
    def get_status(self) -> Dict[str, Any]:
        """Get query guard status."""
        return {
            "active_heavy_queries": self._active_heavy_queries,
            "max_concurrent": self.MAX_CONCURRENT_HEAVY_QUERIES,
            "max_date_range_days": self.MAX_DATE_RANGE_DAYS,
            "max_drilldown_records": self.MAX_DRILLDOWN_RECORDS,
            "max_export_records": self.MAX_EXPORT_RECORDS
        }


class QueryLimitExceeded(Exception):
    """Exception raised when query limits are exceeded."""
    pass


# ==================== 4. PRE-AGGREGATION SERVICE ====================

class PreAggregationService:
    """
    Background pre-aggregation for heavy metrics.
    Stores pre-computed daily/weekly/monthly snapshots.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._aggregations_collection = "metric_aggregations"
    
    async def compute_daily_metrics(self, target_date: date = None):
        """Compute and store daily metric aggregations."""
        target = target_date or date.today() - timedelta(days=1)  # Yesterday
        
        aggregations = []
        
        # Revenue
        rev_total = await self._sum_collection("revenues", "amount", target)
        aggregations.append({
            "metric_code": "REV_002",
            "aggregation_type": "daily",
            "date": datetime.combine(target, datetime.min.time()),
            "value": rev_total,
            "computed_at": datetime.now(timezone.utc)
        })
        
        # Leads
        lead_count = await self._count_collection("leads", target)
        aggregations.append({
            "metric_code": "LEAD_001",
            "aggregation_type": "daily",
            "date": datetime.combine(target, datetime.min.time()),
            "value": lead_count,
            "computed_at": datetime.now(timezone.utc)
        })
        
        # Deals
        deal_count = await self._count_collection("deals", target)
        aggregations.append({
            "metric_code": "SALES_001",
            "aggregation_type": "daily",
            "date": datetime.combine(target, datetime.min.time()),
            "value": deal_count,
            "computed_at": datetime.now(timezone.utc)
        })
        
        # Store aggregations
        for agg in aggregations:
            await self.db[self._aggregations_collection].update_one(
                {
                    "metric_code": agg["metric_code"],
                    "aggregation_type": agg["aggregation_type"],
                    "date": agg["date"]
                },
                {"$set": agg},
                upsert=True
            )
        
        return len(aggregations)
    
    async def compute_weekly_metrics(self, week_end_date: date = None):
        """Compute weekly aggregations."""
        end_date = week_end_date or date.today() - timedelta(days=date.today().weekday() + 1)
        start_date = end_date - timedelta(days=6)
        
        aggregations = []
        
        # Weekly revenue
        rev_total = await self._sum_collection_range("revenues", "amount", start_date, end_date)
        aggregations.append({
            "metric_code": "REV_002",
            "aggregation_type": "weekly",
            "date": datetime.combine(end_date, datetime.min.time()),
            "start_date": datetime.combine(start_date, datetime.min.time()),
            "value": rev_total,
            "computed_at": datetime.now(timezone.utc)
        })
        
        # Weekly leads
        lead_count = await self._count_collection_range("leads", start_date, end_date)
        aggregations.append({
            "metric_code": "LEAD_001",
            "aggregation_type": "weekly",
            "date": datetime.combine(end_date, datetime.min.time()),
            "start_date": datetime.combine(start_date, datetime.min.time()),
            "value": lead_count,
            "computed_at": datetime.now(timezone.utc)
        })
        
        for agg in aggregations:
            await self.db[self._aggregations_collection].update_one(
                {
                    "metric_code": agg["metric_code"],
                    "aggregation_type": agg["aggregation_type"],
                    "date": agg["date"]
                },
                {"$set": agg},
                upsert=True
            )
        
        return len(aggregations)
    
    async def compute_project_absorption(self):
        """Compute project absorption rates."""
        projects = await self.db.projects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
        
        for project in projects:
            total_units = await self.db.products.count_documents({"project_id": project["id"]})
            sold_units = await self.db.products.count_documents({
                "project_id": project["id"],
                "inventory_status": "sold"
            })
            
            absorption_rate = (sold_units / total_units * 100) if total_units > 0 else 0
            
            await self.db[self._aggregations_collection].update_one(
                {
                    "metric_code": "PROJECT_ABSORPTION",
                    "aggregation_type": "project",
                    "project_id": project["id"]
                },
                {"$set": {
                    "metric_code": "PROJECT_ABSORPTION",
                    "aggregation_type": "project",
                    "project_id": project["id"],
                    "project_name": project.get("name"),
                    "total_units": total_units,
                    "sold_units": sold_units,
                    "absorption_rate": round(absorption_rate, 2),
                    "computed_at": datetime.now(timezone.utc)
                }},
                upsert=True
            )
        
        return len(projects)
    
    async def compute_team_performance(self):
        """Compute team performance metrics."""
        # Get all teams
        teams = await self.db.teams.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
        
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        for team in teams:
            # Get team members
            members = await self.db.users.find(
                {"team_id": team["id"]}, {"_id": 0, "id": 1}
            ).to_list(100)
            member_ids = [m["id"] for m in members]
            
            if not member_ids:
                continue
            
            # Team deals
            team_deals = await self.db.deals.count_documents({
                "owner_id": {"$in": member_ids},
                "created_at": {"$gte": month_start}
            })
            
            # Team leads
            team_leads = await self.db.leads.count_documents({
                "assigned_to": {"$in": member_ids},
                "created_at": {"$gte": month_start}
            })
            
            await self.db[self._aggregations_collection].update_one(
                {
                    "metric_code": "TEAM_PERFORMANCE",
                    "aggregation_type": "team",
                    "team_id": team["id"]
                },
                {"$set": {
                    "metric_code": "TEAM_PERFORMANCE",
                    "aggregation_type": "team",
                    "team_id": team["id"],
                    "team_name": team.get("name"),
                    "member_count": len(member_ids),
                    "deals_this_month": team_deals,
                    "leads_this_month": team_leads,
                    "computed_at": now
                }},
                upsert=True
            )
        
        return len(teams)
    
    async def get_pre_aggregated(
        self, 
        metric_code: str, 
        aggregation_type: str,
        target_date: date = None
    ) -> Optional[Dict[str, Any]]:
        """Get pre-aggregated metric value."""
        query = {
            "metric_code": metric_code,
            "aggregation_type": aggregation_type
        }
        if target_date:
            query["date"] = datetime.combine(target_date, datetime.min.time())
        
        return await self.db[self._aggregations_collection].find_one(query, {"_id": 0})
    
    # Helper methods
    async def _sum_collection(self, collection: str, field: str, target_date: date) -> float:
        """Sum field for a specific date."""
        start = datetime.combine(target_date, datetime.min.time())
        end = datetime.combine(target_date, datetime.max.time())
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start, "$lte": end}}},
            {"$group": {"_id": None, "total": {"$sum": f"${field}"}}}
        ]
        result = await self.db[collection].aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0
    
    async def _count_collection(self, collection: str, target_date: date) -> int:
        """Count documents for a specific date."""
        start = datetime.combine(target_date, datetime.min.time())
        end = datetime.combine(target_date, datetime.max.time())
        return await self.db[collection].count_documents({"created_at": {"$gte": start, "$lte": end}})
    
    async def _sum_collection_range(self, collection: str, field: str, start_date: date, end_date: date) -> float:
        """Sum field for date range."""
        start = datetime.combine(start_date, datetime.min.time())
        end = datetime.combine(end_date, datetime.max.time())
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start, "$lte": end}}},
            {"$group": {"_id": None, "total": {"$sum": f"${field}"}}}
        ]
        result = await self.db[collection].aggregate(pipeline).to_list(1)
        return result[0]["total"] if result else 0
    
    async def _count_collection_range(self, collection: str, start_date: date, end_date: date) -> int:
        """Count documents for date range."""
        start = datetime.combine(start_date, datetime.min.time())
        end = datetime.combine(end_date, datetime.max.time())
        return await self.db[collection].count_documents({"created_at": {"$gte": start, "$lte": end}})


# ==================== 5. BACKGROUND JOB SCHEDULER ====================

class AnalyticsScheduler:
    """
    Scheduler for background analytics jobs.
    In production, integrate with Celery/APScheduler/cron.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.pre_agg = PreAggregationService(db)
        self._running = False
        self._last_runs: Dict[str, datetime] = {}
    
    async def run_daily_jobs(self):
        """Run daily aggregation jobs."""
        jobs_run = 0
        
        # Daily metrics
        jobs_run += await self.pre_agg.compute_daily_metrics()
        
        # Project absorption
        jobs_run += await self.pre_agg.compute_project_absorption()
        
        # Team performance
        jobs_run += await self.pre_agg.compute_team_performance()
        
        self._last_runs["daily"] = datetime.now(timezone.utc)
        return jobs_run
    
    async def run_weekly_jobs(self):
        """Run weekly aggregation jobs."""
        jobs_run = await self.pre_agg.compute_weekly_metrics()
        self._last_runs["weekly"] = datetime.now(timezone.utc)
        return jobs_run
    
    async def run_cache_cleanup(self, cache: AnalyticsCache):
        """Run cache cleanup job."""
        await cache.cleanup_old_snapshots(max_age_days=7)
        self._last_runs["cache_cleanup"] = datetime.now(timezone.utc)
    
    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status."""
        return {
            "running": self._running,
            "last_runs": {k: v.isoformat() for k, v in self._last_runs.items()}
        }


# ==================== GLOBAL INSTANCES ====================

# These will be initialized with db connection
_analytics_cache: Optional[AnalyticsCache] = None
_query_guard: Optional[QueryGuard] = None
_pre_agg_service: Optional[PreAggregationService] = None
_scheduler: Optional[AnalyticsScheduler] = None


def init_performance_layer(db: AsyncIOMotorDatabase):
    """Initialize all performance layer components."""
    global _analytics_cache, _query_guard, _pre_agg_service, _scheduler
    
    _analytics_cache = AnalyticsCache(db)
    _query_guard = QueryGuard()
    _pre_agg_service = PreAggregationService(db)
    _scheduler = AnalyticsScheduler(db)
    
    return {
        "cache": _analytics_cache,
        "query_guard": _query_guard,
        "pre_agg": _pre_agg_service,
        "scheduler": _scheduler
    }


def get_cache() -> AnalyticsCache:
    """Get analytics cache instance."""
    if not _analytics_cache:
        raise RuntimeError("Performance layer not initialized. Call init_performance_layer first.")
    return _analytics_cache


def get_query_guard() -> QueryGuard:
    """Get query guard instance."""
    if not _query_guard:
        raise RuntimeError("Performance layer not initialized. Call init_performance_layer first.")
    return _query_guard


def get_pre_agg_service() -> PreAggregationService:
    """Get pre-aggregation service."""
    if not _pre_agg_service:
        raise RuntimeError("Performance layer not initialized. Call init_performance_layer first.")
    return _pre_agg_service


def get_scheduler() -> AnalyticsScheduler:
    """Get scheduler instance."""
    if not _scheduler:
        raise RuntimeError("Performance layer not initialized. Call init_performance_layer first.")
    return _scheduler
