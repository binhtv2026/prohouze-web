"""
Bottleneck Engine
Prompt 17/20 - Executive Control Center

Automatically detect bottlenecks in sales, contracts, and lead response.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from .utils import get_now_utc, group_by, calculate_percentage, determine_severity


class BottleneckEngine:
    """
    Operations Bottleneck Detection Engine.
    Identifies process bottlenecks and slowdowns.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def detect_all_bottlenecks(self) -> Dict[str, Any]:
        """
        Detect all bottlenecks across the system.
        Returns categorized bottleneck data.
        """
        now = get_now_utc()
        
        bottlenecks = {
            "sales": await self._detect_sales_bottlenecks(),
            "contracts": await self._detect_contract_bottlenecks(),
            "leads": await self._detect_lead_bottlenecks(),
            "inventory": await self._detect_inventory_bottlenecks(),
            "tasks": await self._detect_task_bottlenecks(),
        }
        
        # Calculate severity
        total_critical = sum(1 for b in bottlenecks.values() if b.get("severity") == "critical")
        total_high = sum(1 for b in bottlenecks.values() if b.get("severity") == "high")
        total_issues = sum(b.get("count", 0) for b in bottlenecks.values())
        
        overall_severity = determine_severity(total_critical + total_high, {"critical": 2, "high": 1, "medium": 0})
        if total_issues > 10 and overall_severity == "normal":
            overall_severity = "warning"
        
        return {
            "bottlenecks": bottlenecks,
            "summary": {
                "total_issues": total_issues,
                "critical_count": total_critical,
                "high_count": total_high,
                "severity": overall_severity
            },
            "detected_at": now.isoformat()
        }
    
    async def _detect_sales_bottlenecks(self) -> Dict[str, Any]:
        """Detect sales pipeline bottlenecks."""
        now = get_now_utc()
        stuck_threshold = now - timedelta(days=14)
        
        stuck_deals = await self.db.deals.find({
            "stage": {"$nin": ["completed", "lost", "won"]},
            "stage_changed_at": {"$lt": stuck_threshold.isoformat()}
        }, {"_id": 0, "id": 1, "stage": 1, "customer_name": 1}).to_list(50)
        
        stage_pipeline = [
            {"$match": {"stage": {"$nin": ["completed", "lost", "won"]}}},
            {"$group": {"_id": "$stage", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        stage_dist = await self.db.deals.aggregate(stage_pipeline).to_list(20)
        
        bottleneck_stage = stage_dist[0]["_id"] if stage_dist else None
        count = len(stuck_deals)
        severity = determine_severity(count, {"critical": 10, "high": 5, "medium": 1})
        
        return {
            "type": "sales_pipeline",
            "count": count,
            "severity": severity,
            "items": stuck_deals[:10],
            "bottleneck_stage": bottleneck_stage,
            "stage_distribution": {s["_id"]: s["count"] for s in stage_dist},
            "description": f"{count} deals stuck > 14 days" if count > 0 else "Pipeline flowing normally"
        }
    
    async def _detect_contract_bottlenecks(self) -> Dict[str, Any]:
        """Detect contract processing bottlenecks."""
        now = get_now_utc()
        review_threshold = now - timedelta(days=3)
        
        pending_review = await self.db.contracts.find({
            "status": "pending_review",
            "updated_at": {"$lt": review_threshold.isoformat()}
        }, {"_id": 0, "id": 1, "contract_code": 1, "customer_id": 1, "grand_total": 1}).to_list(50)
        
        pending_approval = await self.db.contracts.find({
            "status": "pending_approval",
            "updated_at": {"$lt": review_threshold.isoformat()}
        }, {"_id": 0, "id": 1, "contract_code": 1, "customer_id": 1, "grand_total": 1}).to_list(50)
        
        total_pending = len(pending_review) + len(pending_approval)
        total_value = sum(c.get("grand_total", 0) for c in pending_review + pending_approval)
        
        severity = determine_severity(total_pending, {"critical": 10, "high": 5, "medium": 1})
        
        return {
            "type": "contract_processing",
            "count": total_pending,
            "severity": severity,
            "pending_review": pending_review,
            "pending_approval": pending_approval,
            "total_value": total_value,
            "description": f"{total_pending} contracts pending > 3 days" if total_pending > 0 else "Contract processing normal"
        }
    
    async def _detect_lead_bottlenecks(self) -> Dict[str, Any]:
        """Detect lead response and assignment bottlenecks."""
        now = get_now_utc()
        
        unassigned = await self.db.leads.count_documents({
            "assigned_to": {"$in": [None, ""]},
            "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}
        })
        
        response_threshold = now - timedelta(hours=24)
        slow_response = await self.db.leads.count_documents({
            "created_at": {"$lt": response_threshold.isoformat()},
            "last_activity_at": {"$in": [None, ""]},
            "stage": "new"
        })
        
        stage_pipeline = [
            {"$match": {"stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}}},
            {"$group": {"_id": "$stage", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        stage_dist = await self.db.leads.aggregate(stage_pipeline).to_list(20)
        
        total_issues = unassigned + slow_response
        severity = determine_severity(total_issues, {"critical": 20, "high": 10, "medium": 1})
        
        return {
            "type": "lead_processing",
            "count": total_issues,
            "severity": severity,
            "unassigned_count": unassigned,
            "slow_response_count": slow_response,
            "stage_distribution": {s["_id"]: s["count"] for s in stage_dist},
            "description": f"{unassigned} unassigned, {slow_response} slow response" if total_issues > 0 else "Lead processing normal"
        }
    
    async def _detect_inventory_bottlenecks(self) -> Dict[str, Any]:
        """Detect inventory/project bottlenecks."""
        projects = await self.db.projects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
        
        slow_projects = []
        for project in projects:
            total = await self.db.products.count_documents({"project_id": project["id"]})
            if total == 0:
                continue
            sold = await self.db.products.count_documents({"project_id": project["id"], "inventory_status": "sold"})
            absorption = calculate_percentage(sold, total)
            
            if absorption < 30:
                slow_projects.append({
                    "project_id": project["id"],
                    "project_name": project.get("name", "Unknown"),
                    "total_units": total,
                    "sold_units": sold,
                    "absorption_rate": round(absorption, 1)
                })
        
        count = len(slow_projects)
        severity = determine_severity(count, {"critical": 5, "high": 3, "medium": 1})
        
        return {
            "type": "inventory",
            "count": count,
            "severity": severity,
            "slow_projects": slow_projects,
            "description": f"{count} projects with < 30% absorption" if count > 0 else "Inventory turnover normal"
        }
    
    async def _detect_task_bottlenecks(self) -> Dict[str, Any]:
        """Detect task/workload bottlenecks."""
        now = get_now_utc()
        
        overdue = await self.db.tasks.count_documents({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lt": now.isoformat()}
        })
        
        today_end = now.replace(hour=23, minute=59, second=59)
        due_today = await self.db.tasks.count_documents({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$gte": now.isoformat(), "$lte": today_end.isoformat()}
        })
        
        workload_pipeline = [
            {"$match": {"status": {"$nin": ["completed", "cancelled"]}}},
            {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        workload = await self.db.tasks.aggregate(workload_pipeline).to_list(10)
        
        overloaded_users = [w for w in workload if w["count"] > 20]
        
        total_issues = overdue + len(overloaded_users)
        severity = determine_severity(overdue, {"critical": 20, "high": 10, "medium": 1})
        
        return {
            "type": "tasks",
            "count": total_issues,
            "severity": severity,
            "overdue_count": overdue,
            "due_today_count": due_today,
            "overloaded_users": overloaded_users,
            "top_workloads": workload[:5],
            "description": f"{overdue} overdue tasks, {len(overloaded_users)} overloaded users" if total_issues > 0 else "Task distribution normal"
        }
    
    async def get_bottleneck_details(self, bottleneck_type: str) -> Dict[str, Any]:
        """Get detailed data for a specific bottleneck type."""
        handlers = {
            "sales": self._get_sales_bottleneck_details,
            "contracts": self._get_contract_bottleneck_details,
            "leads": self._get_lead_bottleneck_details,
            "inventory": self._get_inventory_bottleneck_details,
            "tasks": self._get_task_bottleneck_details,
        }
        
        handler = handlers.get(bottleneck_type)
        if handler:
            return await handler()
        return {"error": "Unknown bottleneck type"}
    
    async def _get_sales_bottleneck_details(self) -> Dict[str, Any]:
        """Get detailed sales bottleneck data with drill-down."""
        now = get_now_utc()
        stuck_threshold = now - timedelta(days=14)
        
        stuck_deals = await self.db.deals.find({
            "stage": {"$nin": ["completed", "lost", "won"]},
            "stage_changed_at": {"$lt": stuck_threshold.isoformat()}
        }, {"_id": 0}).sort("stage_changed_at", 1).to_list(100)
        
        for deal in stuck_deals:
            if deal.get("owner_id"):
                owner = await self.db.users.find_one({"id": deal["owner_id"]}, {"_id": 0, "full_name": 1})
                deal["owner_name"] = owner.get("full_name") if owner else "Unknown"
            stage_changed = deal.get("stage_changed_at", now.isoformat())
            from .utils import parse_iso_date, days_between
            deal["days_stuck"] = days_between(parse_iso_date(stage_changed), now)
        
        return {
            "type": "sales_details",
            "total": len(stuck_deals),
            "deals": stuck_deals,
            "by_stage": group_by(stuck_deals, "stage"),
            "by_owner": group_by(stuck_deals, "owner_name")
        }
    
    async def _get_contract_bottleneck_details(self) -> Dict[str, Any]:
        """Get detailed contract bottleneck data."""
        now = get_now_utc()
        
        pending = await self.db.contracts.find({
            "status": {"$in": ["pending_review", "pending_approval"]}
        }, {"_id": 0}).sort("updated_at", 1).to_list(100)
        
        for contract in pending:
            from .utils import parse_iso_date, days_between
            updated = parse_iso_date(contract.get("updated_at", now.isoformat()))
            contract["days_pending"] = days_between(updated, now)
        
        return {
            "type": "contract_details",
            "total": len(pending),
            "contracts": pending,
            "by_status": group_by(pending, "status"),
            "total_value": sum(c.get("grand_total", 0) for c in pending)
        }
    
    async def _get_lead_bottleneck_details(self) -> Dict[str, Any]:
        """Get detailed lead bottleneck data."""
        unassigned = await self.db.leads.find({
            "assigned_to": {"$in": [None, ""]},
            "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}
        }, {"_id": 0}).sort("created_at", 1).to_list(100)
        
        return {
            "type": "lead_details",
            "unassigned_total": len(unassigned),
            "unassigned_leads": unassigned,
            "by_source": group_by(unassigned, "source"),
            "by_stage": group_by(unassigned, "stage")
        }
    
    async def _get_inventory_bottleneck_details(self) -> Dict[str, Any]:
        """Get detailed inventory bottleneck data."""
        projects = await self.db.projects.find({}, {"_id": 0}).to_list(100)
        
        project_details = []
        for project in projects:
            total = await self.db.products.count_documents({"project_id": project["id"]})
            if total == 0:
                continue
            sold = await self.db.products.count_documents({"project_id": project["id"], "inventory_status": "sold"})
            available = await self.db.products.count_documents({"project_id": project["id"], "inventory_status": "available"})
            absorption = calculate_percentage(sold, total)
            
            project_details.append({
                "project_id": project["id"],
                "project_name": project.get("name", "Unknown"),
                "total_units": total,
                "sold_units": sold,
                "available_units": available,
                "absorption_rate": round(absorption, 1),
                "status": "critical" if absorption < 20 else "warning" if absorption < 40 else "good"
            })
        
        project_details.sort(key=lambda x: x["absorption_rate"])
        
        return {
            "type": "inventory_details",
            "total_projects": len(project_details),
            "projects": project_details,
            "critical_count": len([p for p in project_details if p["status"] == "critical"]),
            "warning_count": len([p for p in project_details if p["status"] == "warning"])
        }
    
    async def _get_task_bottleneck_details(self) -> Dict[str, Any]:
        """Get detailed task bottleneck data."""
        now = get_now_utc()
        
        overdue = await self.db.tasks.find({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lt": now.isoformat()}
        }, {"_id": 0}).sort("due_at", 1).to_list(100)
        
        for task in overdue:
            if task.get("assigned_to"):
                assignee = await self.db.users.find_one({"id": task["assigned_to"]}, {"_id": 0, "full_name": 1})
                task["assignee_name"] = assignee.get("full_name") if assignee else "Unknown"
            from .utils import parse_iso_date, days_between
            due = parse_iso_date(task.get("due_at", now.isoformat()))
            task["days_overdue"] = days_between(due, now)
        
        return {
            "type": "task_details",
            "total_overdue": len(overdue),
            "tasks": overdue,
            "by_assignee": group_by(overdue, "assignee_name"),
            "by_type": group_by(overdue, "type")
        }
