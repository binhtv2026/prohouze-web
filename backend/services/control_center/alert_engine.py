"""
Alert Engine
Prompt 17/20 - Executive Control Center

Real-time alert detection and management system.
Detects anomalies, risks, and urgent situations.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from .dto import (
    AlertSeverity,
    AlertCategory,
    ActionType,
    UrgencyLevel,
    ALERT_RULES,
)
from .utils import iso_now, parse_iso_date, days_between, get_now_utc


class AlertEngine:
    """
    Real-time Alert Engine.
    Detects anomalies, risks, and urgent situations.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._alerts_collection = "control_alerts"
    
    async def detect_all_alerts(self, user: Optional[dict] = None) -> List[Dict[str, Any]]:
        """
        Run all alert detection rules and return active alerts.
        """
        alerts = []
        
        # Detect each type of alert
        alerts.extend(await self._detect_stale_deals())
        alerts.extend(await self._detect_expiring_bookings())
        alerts.extend(await self._detect_unassigned_leads())
        alerts.extend(await self._detect_pending_contracts())
        alerts.extend(await self._detect_overdue_tasks())
        alerts.extend(await self._detect_slow_response_leads())
        alerts.extend(await self._detect_low_absorption_projects())
        alerts.extend(await self._detect_overloaded_sales())
        
        # Sort by severity and urgency
        severity_order = {
            AlertSeverity.CRITICAL.value: 0,
            AlertSeverity.HIGH.value: 1,
            AlertSeverity.MEDIUM.value: 2,
            AlertSeverity.LOW.value: 3,
            AlertSeverity.INFO.value: 4,
        }
        alerts.sort(key=lambda x: (severity_order.get(x["severity"], 5), x.get("created_at", "")))
        
        return alerts
    
    async def get_alerts(
        self,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        is_acknowledged: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get stored alerts from database."""
        query = {"is_resolved": False}
        if category:
            query["category"] = category
        if severity:
            query["severity"] = severity
        if not is_acknowledged:
            query["is_acknowledged"] = False
        
        alerts = await self.db[self._alerts_collection].find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return alerts
    
    async def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Mark alert as acknowledged."""
        result = await self.db[self._alerts_collection].update_one(
            {"id": alert_id},
            {"$set": {
                "is_acknowledged": True,
                "acknowledged_by": user_id,
                "acknowledged_at": iso_now()
            }}
        )
        return result.modified_count > 0
    
    async def resolve_alert(self, alert_id: str, user_id: str, resolution_note: Optional[str] = None) -> bool:
        """Mark alert as resolved."""
        result = await self.db[self._alerts_collection].update_one(
            {"id": alert_id},
            {"$set": {
                "is_resolved": True,
                "resolved_by": user_id,
                "resolved_at": iso_now(),
                "resolution_note": resolution_note
            }}
        )
        
        if result.modified_count > 0:
            await self._log_resolution(alert_id, user_id, resolution_note)
        
        return result.modified_count > 0
    
    async def _log_resolution(self, alert_id: str, user_id: str, note: Optional[str]):
        """Log alert resolution for tracking."""
        await self.db.control_resolution_log.insert_one({
            "id": str(uuid.uuid4()),
            "alert_id": alert_id,
            "resolved_by": user_id,
            "resolution_note": note,
            "resolved_at": iso_now()
        })
    
    # ==================== ALERT DETECTORS ====================
    
    async def _detect_stale_deals(self) -> List[Dict[str, Any]]:
        """Detect deals without updates in 7+ days."""
        alerts = []
        now = get_now_utc()
        threshold = now - timedelta(days=7)
        
        stale_deals = await self.db.deals.find({
            "stage": {"$nin": ["completed", "lost", "won"]},
            "updated_at": {"$lt": threshold.isoformat()}
        }, {"_id": 0, "id": 1, "code": 1, "customer_name": 1, "value": 1, "owner_id": 1, "updated_at": 1}).to_list(100)
        
        for deal in stale_deals:
            days_stale = days_between(parse_iso_date(deal.get("updated_at", "")), now)
            alerts.append({
                "id": f"stale_deal_{deal['id']}",
                "category": AlertCategory.PIPELINE.value,
                "severity": AlertSeverity.HIGH.value if days_stale > 14 else AlertSeverity.MEDIUM.value,
                "urgency": UrgencyLevel.HIGH.value if days_stale > 14 else UrgencyLevel.MEDIUM.value,
                "title": f"Deal khong cap nhat {days_stale} ngay",
                "description": f"Deal {deal.get('code', deal['id'][:8])} - {deal.get('customer_name', 'N/A')} khong co cap nhat trong {days_stale} ngay",
                "source_entity": "deals",
                "source_id": deal["id"],
                "owner_id": deal.get("owner_id"),
                "recommended_actions": [ActionType.SEND_REMINDER.value, ActionType.CREATE_TASK.value, ActionType.REASSIGN_OWNER.value],
                "metrics": {"days_stale": days_stale, "value": deal.get("value", 0)},
                "created_at": now.isoformat(),
                "rule_code": "deal_stale"
            })
        
        return alerts
    
    async def _detect_expiring_bookings(self) -> List[Dict[str, Any]]:
        """Detect bookings expiring in next 3 days."""
        alerts = []
        now = get_now_utc()
        threshold = now + timedelta(days=3)
        
        expiring = await self.db.soft_bookings.find({
            "status": "active",
            "expires_at": {"$gte": now.isoformat(), "$lte": threshold.isoformat()}
        }, {"_id": 0, "id": 1, "code": 1, "contact_id": 1, "project_id": 1, "expires_at": 1, "sales_id": 1}).to_list(100)
        
        for booking in expiring:
            expires = parse_iso_date(booking.get("expires_at", ""))
            days_left = max(0, days_between(now, expires))
            
            alerts.append({
                "id": f"expiring_booking_{booking['id']}",
                "category": AlertCategory.SALES.value,
                "severity": AlertSeverity.CRITICAL.value if days_left <= 1 else AlertSeverity.HIGH.value,
                "urgency": UrgencyLevel.CRITICAL.value if days_left <= 1 else UrgencyLevel.HIGH.value,
                "title": f"Booking sap het han trong {days_left} ngay",
                "description": f"Booking {booking.get('code', booking['id'][:8])} se het han trong {days_left} ngay. Can lien he khach hang ngay.",
                "source_entity": "soft_bookings",
                "source_id": booking["id"],
                "owner_id": booking.get("sales_id"),
                "recommended_actions": [ActionType.SEND_REMINDER.value, ActionType.CREATE_TASK.value],
                "metrics": {"days_left": days_left},
                "created_at": now.isoformat(),
                "rule_code": "booking_expiring"
            })
        
        return alerts
    
    async def _detect_unassigned_leads(self) -> List[Dict[str, Any]]:
        """Detect leads without assignment."""
        alerts = []
        now = get_now_utc()
        
        unassigned_count = await self.db.leads.count_documents({
            "assigned_to": {"$in": [None, ""]},
            "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}
        })
        
        if unassigned_count > 0:
            alerts.append({
                "id": f"unassigned_leads_{now.strftime('%Y%m%d')}",
                "category": AlertCategory.SALES.value,
                "severity": AlertSeverity.HIGH.value if unassigned_count > 10 else AlertSeverity.MEDIUM.value,
                "urgency": UrgencyLevel.HIGH.value,
                "title": f"{unassigned_count} leads chua duoc phan cong",
                "description": f"Co {unassigned_count} leads moi chua duoc phan cong cho sales. Can xu ly ngay de khong mat co hoi.",
                "source_entity": "leads",
                "source_id": "aggregate",
                "recommended_actions": [ActionType.REASSIGN_OWNER.value],
                "metrics": {"count": unassigned_count},
                "created_at": now.isoformat(),
                "rule_code": "lead_unassigned"
            })
        
        return alerts
    
    async def _detect_pending_contracts(self) -> List[Dict[str, Any]]:
        """Detect contracts pending review too long."""
        alerts = []
        now = get_now_utc()
        threshold = now - timedelta(days=3)
        
        pending = await self.db.contracts.find({
            "status": {"$in": ["pending_review", "pending_approval"]},
            "updated_at": {"$lt": threshold.isoformat()}
        }, {"_id": 0, "id": 1, "contract_code": 1, "customer_id": 1, "grand_total": 1}).to_list(50)
        
        if len(pending) > 0:
            total_value = sum(c.get("grand_total", 0) for c in pending)
            alerts.append({
                "id": f"pending_contracts_{now.strftime('%Y%m%d')}",
                "category": AlertCategory.CONTRACT.value,
                "severity": AlertSeverity.HIGH.value if len(pending) > 5 else AlertSeverity.MEDIUM.value,
                "urgency": UrgencyLevel.HIGH.value,
                "title": f"{len(pending)} hop dong cho review > 3 ngay",
                "description": f"Co {len(pending)} hop dong dang cho review/approval qua 3 ngay. Tong gia tri: {total_value:,.0f}d",
                "source_entity": "contracts",
                "source_id": "aggregate",
                "recommended_actions": [ActionType.ASSIGN_REVIEWER.value, ActionType.ESCALATE.value],
                "metrics": {"count": len(pending), "total_value": total_value},
                "created_at": now.isoformat(),
                "rule_code": "contract_pending_review"
            })
        
        return alerts
    
    async def _detect_overdue_tasks(self) -> List[Dict[str, Any]]:
        """Detect overdue tasks/follow-ups."""
        alerts = []
        now = get_now_utc()
        
        overdue_count = await self.db.tasks.count_documents({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lt": now.isoformat()}
        })
        
        if overdue_count > 0:
            alerts.append({
                "id": f"overdue_tasks_{now.strftime('%Y%m%d')}",
                "category": AlertCategory.TEAM.value,
                "severity": AlertSeverity.MEDIUM.value if overdue_count < 10 else AlertSeverity.HIGH.value,
                "urgency": UrgencyLevel.MEDIUM.value,
                "title": f"{overdue_count} tasks qua han",
                "description": f"Co {overdue_count} tasks/follow-ups da qua han. Can xu ly hoac reschedule.",
                "source_entity": "tasks",
                "source_id": "aggregate",
                "recommended_actions": [ActionType.SEND_REMINDER.value, ActionType.ESCALATE.value],
                "metrics": {"count": overdue_count},
                "created_at": now.isoformat(),
                "rule_code": "task_overdue"
            })
        
        return alerts
    
    async def _detect_slow_response_leads(self) -> List[Dict[str, Any]]:
        """Detect leads with slow initial response (> 24h)."""
        alerts = []
        now = get_now_utc()
        threshold = now - timedelta(hours=24)
        
        slow_leads = await self.db.leads.find({
            "created_at": {"$lt": threshold.isoformat()},
            "last_activity_at": {"$in": [None, ""]},
            "stage": "new"
        }, {"_id": 0, "id": 1, "full_name": 1, "assigned_to": 1, "created_at": 1}).to_list(50)
        
        if len(slow_leads) > 0:
            alerts.append({
                "id": f"slow_response_{now.strftime('%Y%m%d')}",
                "category": AlertCategory.SALES.value,
                "severity": AlertSeverity.HIGH.value,
                "urgency": UrgencyLevel.HIGH.value,
                "title": f"{len(slow_leads)} leads chua duoc contact > 24h",
                "description": f"Co {len(slow_leads)} leads moi chua duoc lien he sau 24 gio. Response time vuot SLA.",
                "source_entity": "leads",
                "source_id": "aggregate",
                "recommended_actions": [ActionType.SEND_REMINDER.value, ActionType.ESCALATE.value],
                "metrics": {"count": len(slow_leads)},
                "created_at": now.isoformat(),
                "rule_code": "lead_response_slow"
            })
        
        return alerts
    
    async def _detect_low_absorption_projects(self) -> List[Dict[str, Any]]:
        """Detect projects with low absorption rate."""
        alerts = []
        now = get_now_utc()
        
        projects = await self.db.projects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
        
        for project in projects:
            total = await self.db.products.count_documents({"project_id": project["id"]})
            if total == 0:
                continue
            sold = await self.db.products.count_documents({"project_id": project["id"], "inventory_status": "sold"})
            absorption = (sold / total * 100) if total > 0 else 0
            
            if absorption < 30:
                alerts.append({
                    "id": f"low_absorption_{project['id']}",
                    "category": AlertCategory.INVENTORY.value,
                    "severity": AlertSeverity.HIGH.value if absorption < 15 else AlertSeverity.MEDIUM.value,
                    "urgency": UrgencyLevel.MEDIUM.value,
                    "title": f"Project {project.get('name', 'N/A')} absorption thap ({absorption:.1f}%)",
                    "description": f"Project {project.get('name', 'N/A')} co ty le absorption chi {absorption:.1f}% ({sold}/{total} can). Can tang cuong marketing.",
                    "source_entity": "projects",
                    "source_id": project["id"],
                    "recommended_actions": [ActionType.TRIGGER_CAMPAIGN.value, ActionType.ESCALATE.value],
                    "metrics": {"absorption_rate": absorption, "total": total, "sold": sold},
                    "created_at": now.isoformat(),
                    "rule_code": "low_absorption"
                })
        
        return alerts
    
    async def _detect_overloaded_sales(self) -> List[Dict[str, Any]]:
        """Detect overloaded sales reps."""
        alerts = []
        now = get_now_utc()
        
        sales_users = await self.db.users.find(
            {"role": {"$in": ["sales", "senior_sales"]}},
            {"_id": 0, "id": 1, "full_name": 1}
        ).to_list(200)
        
        for user in sales_users:
            active_leads = await self.db.leads.count_documents({
                "assigned_to": user["id"],
                "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}
            })
            active_tasks = await self.db.tasks.count_documents({
                "assigned_to": user["id"],
                "status": {"$nin": ["completed", "cancelled"]}
            })
            
            total_workload = active_leads + active_tasks
            
            if total_workload > 30:
                alerts.append({
                    "id": f"overloaded_{user['id']}",
                    "category": AlertCategory.TEAM.value,
                    "severity": AlertSeverity.MEDIUM.value,
                    "urgency": UrgencyLevel.MEDIUM.value,
                    "title": f"Sales {user.get('full_name', 'N/A')} bi overload ({total_workload} items)",
                    "description": f"Sales {user.get('full_name', 'N/A')} dang quan ly {active_leads} leads va {active_tasks} tasks. Can can bang workload.",
                    "source_entity": "users",
                    "source_id": user["id"],
                    "recommended_actions": [ActionType.REASSIGN_OWNER.value],
                    "metrics": {"active_leads": active_leads, "active_tasks": active_tasks, "total": total_workload},
                    "created_at": now.isoformat(),
                    "rule_code": "sales_overloaded"
                })
        
        return alerts
    
    async def get_alert_summary(self) -> Dict[str, Any]:
        """Get alert summary by category and severity."""
        alerts = await self.detect_all_alerts()
        
        by_category = {}
        by_severity = {}
        
        for alert in alerts:
            cat = alert.get("category", "other")
            sev = alert.get("severity", "medium")
            
            by_category[cat] = by_category.get(cat, 0) + 1
            by_severity[sev] = by_severity.get(sev, 0) + 1
        
        return {
            "total": len(alerts),
            "by_category": by_category,
            "by_severity": by_severity,
            "critical_count": by_severity.get(AlertSeverity.CRITICAL.value, 0),
            "high_count": by_severity.get(AlertSeverity.HIGH.value, 0),
            "requires_immediate_action": by_severity.get(AlertSeverity.CRITICAL.value, 0) + by_severity.get(AlertSeverity.HIGH.value, 0)
        }
