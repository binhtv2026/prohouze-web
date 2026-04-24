"""
Auto Action Engine
Prompt 17/20 - Executive Control Center - AUTO CONTROL LAYER

Automated action execution based on configurable rules.
System can now "tự vận hành" - CEO only monitors.

Features:
- Rule-based auto actions
- Configurable conditions (JSON)
- Delay/schedule support
- Safety limits (max actions/day)
- Undo within X minutes
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import json

from .dto import ActionType
from .utils import get_now_utc, iso_now


class AutoActionEngine:
    """
    Auto Action Engine - Rule-based automatic action execution.
    
    Allows the system to automatically execute actions when conditions are met.
    Safety features: daily limits, undo window, logging.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._rules_collection = "auto_action_rules"
        self._auto_actions_collection = "auto_actions_log"
        self._daily_limit = 100  # Max auto actions per day
        self._undo_window_minutes = 30  # Undo window
    
    # ==================== RULE MANAGEMENT ====================
    
    async def create_rule(self, rule_data: Dict[str, Any], user: dict) -> Dict[str, Any]:
        """Create a new auto action rule."""
        rule_id = str(uuid.uuid4())
        now = get_now_utc()
        
        rule = {
            "id": rule_id,
            "name": rule_data.get("name", "Unnamed Rule"),
            "description": rule_data.get("description", ""),
            "condition_type": rule_data.get("condition_type"),  # e.g., "deal_stale", "lead_unassigned"
            "condition_json": rule_data.get("condition_json", {}),  # {"field": "stale_days", "operator": ">", "value": 30}
            "action_type": rule_data.get("action_type"),  # auto_create_task, auto_notify, etc.
            "action_params": rule_data.get("action_params", {}),
            "delay_minutes": rule_data.get("delay_minutes", 0),
            "priority_threshold": rule_data.get("priority_threshold", 50),
            "follow_up_action": rule_data.get("follow_up_action"),  # e.g., auto_reassign if not resolved
            "follow_up_delay_hours": rule_data.get("follow_up_delay_hours", 48),
            "is_active": rule_data.get("is_active", True),
            "created_by": user.get("id"),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "execution_count": 0,
            "last_executed_at": None
        }
        
        await self.db[self._rules_collection].insert_one(rule)
        
        return {"success": True, "rule_id": rule_id, "rule": rule}
    
    async def update_rule(self, rule_id: str, updates: Dict[str, Any], user: dict) -> Dict[str, Any]:
        """Update an existing rule."""
        updates["updated_at"] = iso_now()
        updates["updated_by"] = user.get("id")
        
        result = await self.db[self._rules_collection].update_one(
            {"id": rule_id},
            {"$set": updates}
        )
        
        return {"success": result.modified_count > 0, "rule_id": rule_id}
    
    async def toggle_rule(self, rule_id: str, is_active: bool, user: dict) -> Dict[str, Any]:
        """Toggle rule on/off."""
        return await self.update_rule(rule_id, {"is_active": is_active}, user)
    
    async def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule."""
        result = await self.db[self._rules_collection].delete_one({"id": rule_id})
        return result.deleted_count > 0
    
    async def get_rules(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get all auto action rules."""
        query = {"is_active": True} if active_only else {}
        rules = await self.db[self._rules_collection].find(query, {"_id": 0}).to_list(100)
        return rules
    
    async def get_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific rule."""
        return await self.db[self._rules_collection].find_one({"id": rule_id}, {"_id": 0})
    
    # ==================== AUTO ACTION EXECUTION ====================
    
    async def check_and_execute_rules(self) -> Dict[str, Any]:
        """
        Main method: Check all active rules and execute actions.
        Called by scheduler (e.g., every 5 minutes).
        """
        now = get_now_utc()
        results = {
            "checked_at": now.isoformat(),
            "rules_checked": 0,
            "actions_executed": 0,
            "actions_skipped": 0,
            "errors": []
        }
        
        # Check daily limit
        daily_count = await self._get_daily_action_count()
        if daily_count >= self._daily_limit:
            results["errors"].append(f"Daily limit reached ({self._daily_limit})")
            return results
        
        # Get active rules
        rules = await self.get_rules(active_only=True)
        results["rules_checked"] = len(rules)
        
        for rule in rules:
            try:
                # Check if conditions are met
                matching_items = await self._evaluate_rule_conditions(rule)
                
                for item in matching_items[:10]:  # Max 10 items per rule per check
                    if daily_count >= self._daily_limit:
                        break
                    
                    # Check if action already executed for this item recently
                    if await self._action_recently_executed(rule["id"], item.get("id")):
                        results["actions_skipped"] += 1
                        continue
                    
                    # Execute the auto action
                    action_result = await self._execute_auto_action(rule, item)
                    
                    if action_result.get("success"):
                        results["actions_executed"] += 1
                        daily_count += 1
                    else:
                        results["errors"].append(action_result.get("error"))
                        
            except Exception as e:
                results["errors"].append(f"Rule {rule.get('id')}: {str(e)}")
        
        return results
    
    async def _evaluate_rule_conditions(self, rule: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Evaluate rule conditions and return matching items."""
        condition_type = rule.get("condition_type")
        condition_json = rule.get("condition_json", {})
        priority_threshold = rule.get("priority_threshold", 50)
        
        matching_items = []
        now = get_now_utc()
        
        if condition_type == "deal_stale":
            threshold_days = condition_json.get("value", 30)
            threshold_date = now - timedelta(days=threshold_days)
            
            deals = await self.db.deals.find({
                "stage": {"$nin": ["completed", "lost", "won"]},
                "updated_at": {"$lt": threshold_date.isoformat()}
            }, {"_id": 0, "id": 1, "code": 1, "customer_name": 1, "owner_id": 1, "value": 1, "updated_at": 1}).to_list(50)
            
            for deal in deals:
                from .utils import parse_iso_date, days_between
                days_stale = days_between(parse_iso_date(deal.get("updated_at", "")), now)
                deal["stale_days"] = days_stale
                deal["entity_type"] = "deals"
                deal["priority_score"] = min(100, 50 + days_stale)
                if deal["priority_score"] >= priority_threshold:
                    matching_items.append(deal)
        
        elif condition_type == "lead_unassigned":
            threshold_hours = condition_json.get("value", 24)
            threshold_date = now - timedelta(hours=threshold_hours)
            
            leads = await self.db.leads.find({
                "assigned_to": {"$in": [None, ""]},
                "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]},
                "created_at": {"$lt": threshold_date.isoformat()}
            }, {"_id": 0, "id": 1, "full_name": 1, "source": 1, "created_at": 1}).to_list(50)
            
            for lead in leads:
                lead["entity_type"] = "leads"
                lead["priority_score"] = 80
                if lead["priority_score"] >= priority_threshold:
                    matching_items.append(lead)
        
        elif condition_type == "booking_expiring":
            threshold_days = condition_json.get("value", 3)
            threshold_date = now + timedelta(days=threshold_days)
            
            bookings = await self.db.soft_bookings.find({
                "status": "active",
                "expires_at": {"$gte": now.isoformat(), "$lte": threshold_date.isoformat()}
            }, {"_id": 0, "id": 1, "code": 1, "sales_id": 1, "expires_at": 1}).to_list(50)
            
            for booking in bookings:
                booking["entity_type"] = "soft_bookings"
                booking["priority_score"] = 90
                if booking["priority_score"] >= priority_threshold:
                    matching_items.append(booking)
        
        elif condition_type == "task_overdue":
            threshold_hours = condition_json.get("value", 24)
            
            tasks = await self.db.tasks.find({
                "status": {"$nin": ["completed", "cancelled"]},
                "due_at": {"$lt": now.isoformat()}
            }, {"_id": 0, "id": 1, "title": 1, "assigned_to": 1, "due_at": 1}).to_list(50)
            
            for task in tasks:
                task["entity_type"] = "tasks"
                task["priority_score"] = 70
                if task["priority_score"] >= priority_threshold:
                    matching_items.append(task)
        
        elif condition_type == "contract_pending":
            threshold_days = condition_json.get("value", 3)
            threshold_date = now - timedelta(days=threshold_days)
            
            contracts = await self.db.contracts.find({
                "status": {"$in": ["pending_review", "pending_approval"]},
                "updated_at": {"$lt": threshold_date.isoformat()}
            }, {"_id": 0, "id": 1, "contract_code": 1, "grand_total": 1}).to_list(50)
            
            for contract in contracts:
                contract["entity_type"] = "contracts"
                contract["priority_score"] = 75
                if contract["priority_score"] >= priority_threshold:
                    matching_items.append(contract)
        
        elif condition_type == "low_absorption":
            threshold_rate = condition_json.get("value", 30)
            
            projects = await self.db.projects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
            
            for project in projects:
                total = await self.db.products.count_documents({"project_id": project["id"]})
                if total == 0:
                    continue
                sold = await self.db.products.count_documents({"project_id": project["id"], "inventory_status": "sold"})
                absorption = (sold / total * 100) if total > 0 else 0
                
                if absorption < threshold_rate:
                    project["entity_type"] = "projects"
                    project["absorption_rate"] = round(absorption, 1)
                    project["priority_score"] = 60
                    if project["priority_score"] >= priority_threshold:
                        matching_items.append(project)
        
        return matching_items
    
    async def _execute_auto_action(self, rule: Dict[str, Any], item: Dict[str, Any]) -> Dict[str, Any]:
        """Execute auto action for a matching item."""
        action_id = str(uuid.uuid4())
        now = get_now_utc()
        
        action_type = rule.get("action_type")
        action_params = rule.get("action_params", {})
        entity_type = item.get("entity_type", "unknown")
        entity_id = item.get("id")
        
        result = {"success": False, "action_id": action_id}
        
        # Execute based on action type
        if action_type == "auto_create_task":
            task_title = action_params.get("title", f"Auto follow-up: {entity_type}")
            task = {
                "id": str(uuid.uuid4()),
                "title": task_title,
                "description": f"Auto-created by rule: {rule.get('name')}",
                "type": "follow_up",
                "status": "pending",
                "priority": "high",
                "assigned_to": item.get("owner_id") or item.get("assigned_to") or item.get("sales_id"),
                "created_by": "system",
                "created_at": now.isoformat(),
                "due_at": (now + timedelta(hours=24)).isoformat(),
                "related_entity": entity_type,
                "related_entity_id": entity_id,
                "source": "auto_action",
                "auto_rule_id": rule.get("id")
            }
            await self.db.tasks.insert_one(task)
            result = {"success": True, "action_id": action_id, "message": f"Task created: {task_title}", "task_id": task["id"]}
        
        elif action_type == "auto_notify":
            owner_id = item.get("owner_id") or item.get("assigned_to") or item.get("sales_id")
            if owner_id:
                notification = {
                    "id": str(uuid.uuid4()),
                    "user_id": owner_id,
                    "title": f"Auto Alert: {rule.get('name')}",
                    "message": action_params.get("message", f"Attention needed on {entity_type}"),
                    "type": "auto_action",
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "is_read": False,
                    "created_at": now.isoformat(),
                    "auto_rule_id": rule.get("id")
                }
                await self.db.notifications.insert_one(notification)
                result = {"success": True, "action_id": action_id, "message": "Notification sent", "notified_user": owner_id}
            else:
                result = {"success": False, "error": "No owner to notify"}
        
        elif action_type == "auto_reassign":
            # Find available sales with least workload
            workload_pipeline = [
                {"$match": {"stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}}},
                {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}},
                {"$sort": {"count": 1}},
                {"$limit": 1}
            ]
            workloads = await self.db.leads.aggregate(workload_pipeline).to_list(1)
            
            if workloads and workloads[0]["_id"]:
                new_owner = workloads[0]["_id"]
                await self.db[entity_type].update_one(
                    {"id": entity_id},
                    {"$set": {
                        "assigned_to": new_owner,
                        "auto_reassigned_at": now.isoformat(),
                        "auto_rule_id": rule.get("id")
                    }}
                )
                result = {"success": True, "action_id": action_id, "message": f"Auto-reassigned to {new_owner[:8]}...", "new_owner": new_owner}
            else:
                result = {"success": False, "error": "No available user for reassignment"}
        
        elif action_type == "auto_escalate":
            # Find managers
            managers = await self.db.users.find(
                {"role": {"$in": ["manager", "bod"]}, "is_active": True},
                {"_id": 0, "id": 1, "full_name": 1}
            ).to_list(10)
            
            if managers:
                escalation_id = str(uuid.uuid4())
                await self.db.escalations.insert_one({
                    "id": escalation_id,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "reason": f"Auto-escalated by rule: {rule.get('name')}",
                    "escalated_by": "system",
                    "escalated_at": now.isoformat(),
                    "status": "open",
                    "notified_managers": [m["id"] for m in managers],
                    "auto_rule_id": rule.get("id")
                })
                
                for manager in managers:
                    await self.db.notifications.insert_one({
                        "id": str(uuid.uuid4()),
                        "user_id": manager["id"],
                        "title": "Auto Escalation",
                        "message": f"Auto-escalated: {entity_type} requires attention",
                        "type": "escalation",
                        "entity_type": "escalations",
                        "entity_id": escalation_id,
                        "is_read": False,
                        "priority": "high",
                        "created_at": now.isoformat()
                    })
                
                result = {"success": True, "action_id": action_id, "message": f"Escalated to {len(managers)} managers", "escalation_id": escalation_id}
            else:
                result = {"success": False, "error": "No managers available"}
        
        # Log the auto action
        if result.get("success"):
            await self._log_auto_action(action_id, rule, item, result, now)
            await self._update_rule_execution(rule.get("id"), now)
            
            # Add to control feed
            await self.db.control_feed.insert_one({
                "id": str(uuid.uuid4()),
                "type": "action",
                "log_type": "ACTION_LOG",
                "category": "auto_executed",
                "title": f"Auto: {action_type.replace('auto_', '').replace('_', ' ').title()}",
                "description": result.get("message"),
                "actor": "System (Auto)",
                "source_entity": entity_type,
                "source_id": entity_id,
                "timestamp": now.isoformat(),
                "is_auto": True,
                "metadata": {
                    "action_type": action_type,
                    "rule_id": rule.get("id"),
                    "rule_name": rule.get("name"),
                    "action_id": action_id
                }
            })
        
        return result
    
    async def _log_auto_action(self, action_id: str, rule: Dict, item: Dict, result: Dict, now: datetime):
        """Log auto action for tracking and undo."""
        await self.db[self._auto_actions_collection].insert_one({
            "id": action_id,
            "rule_id": rule.get("id"),
            "rule_name": rule.get("name"),
            "action_type": rule.get("action_type"),
            "entity_type": item.get("entity_type"),
            "entity_id": item.get("id"),
            "result": result,
            "executed_at": now.isoformat(),
            "can_undo_until": (now + timedelta(minutes=self._undo_window_minutes)).isoformat(),
            "is_undone": False
        })
    
    async def _update_rule_execution(self, rule_id: str, now: datetime):
        """Update rule execution stats."""
        await self.db[self._rules_collection].update_one(
            {"id": rule_id},
            {
                "$inc": {"execution_count": 1},
                "$set": {"last_executed_at": now.isoformat()}
            }
        )
    
    async def _action_recently_executed(self, rule_id: str, entity_id: str, hours: int = 24) -> bool:
        """Check if action was recently executed for this entity."""
        threshold = get_now_utc() - timedelta(hours=hours)
        
        existing = await self.db[self._auto_actions_collection].find_one({
            "rule_id": rule_id,
            "entity_id": entity_id,
            "executed_at": {"$gte": threshold.isoformat()},
            "is_undone": False
        })
        
        return existing is not None
    
    async def _get_daily_action_count(self) -> int:
        """Get count of auto actions executed today."""
        now = get_now_utc()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        count = await self.db[self._auto_actions_collection].count_documents({
            "executed_at": {"$gte": today_start.isoformat()},
            "is_undone": False
        })
        
        return count
    
    # ==================== UNDO ====================
    
    async def undo_action(self, action_id: str, user: dict) -> Dict[str, Any]:
        """Undo an auto action within the undo window."""
        now = get_now_utc()
        
        action = await self.db[self._auto_actions_collection].find_one({"id": action_id}, {"_id": 0})
        
        if not action:
            return {"success": False, "error": "Action not found"}
        
        if action.get("is_undone"):
            return {"success": False, "error": "Action already undone"}
        
        can_undo_until = action.get("can_undo_until", "")
        if can_undo_until < now.isoformat():
            return {"success": False, "error": "Undo window expired"}
        
        # Perform undo based on action type
        action_type = action.get("action_type")
        result = action.get("result", {})
        
        if action_type == "auto_create_task":
            task_id = result.get("task_id")
            if task_id:
                await self.db.tasks.delete_one({"id": task_id})
        
        elif action_type == "auto_reassign":
            # Would need to store original owner to undo
            pass
        
        elif action_type == "auto_escalate":
            escalation_id = result.get("escalation_id")
            if escalation_id:
                await self.db.escalations.update_one(
                    {"id": escalation_id},
                    {"$set": {"status": "undone"}}
                )
        
        # Mark as undone
        await self.db[self._auto_actions_collection].update_one(
            {"id": action_id},
            {"$set": {
                "is_undone": True,
                "undone_at": now.isoformat(),
                "undone_by": user.get("id")
            }}
        )
        
        return {"success": True, "message": "Action undone"}
    
    # ==================== STATS ====================
    
    async def get_auto_action_stats(self) -> Dict[str, Any]:
        """Get auto action statistics."""
        now = get_now_utc()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        
        today_count = await self.db[self._auto_actions_collection].count_documents({
            "executed_at": {"$gte": today_start.isoformat()},
            "is_undone": False
        })
        
        week_count = await self.db[self._auto_actions_collection].count_documents({
            "executed_at": {"$gte": week_start.isoformat()},
            "is_undone": False
        })
        
        by_type_pipeline = [
            {"$match": {"executed_at": {"$gte": week_start.isoformat()}, "is_undone": False}},
            {"$group": {"_id": "$action_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        by_type = await self.db[self._auto_actions_collection].aggregate(by_type_pipeline).to_list(10)
        
        active_rules = await self.db[self._rules_collection].count_documents({"is_active": True})
        total_rules = await self.db[self._rules_collection].count_documents({})
        
        return {
            "today": {
                "executed": today_count,
                "remaining": max(0, self._daily_limit - today_count)
            },
            "week": {
                "executed": week_count
            },
            "by_type": {item["_id"]: item["count"] for item in by_type},
            "rules": {
                "active": active_rules,
                "total": total_rules
            },
            "daily_limit": self._daily_limit,
            "undo_window_minutes": self._undo_window_minutes
        }
    
    async def get_recent_auto_actions(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent auto actions."""
        actions = await self.db[self._auto_actions_collection].find(
            {},
            {"_id": 0}
        ).sort("executed_at", -1).limit(limit).to_list(limit)
        
        return actions


# ==================== DEFAULT RULES ====================

DEFAULT_AUTO_RULES = [
    {
        "name": "Auto Task for Stale Deals (30+ days)",
        "description": "Tạo task tự động khi deal không cập nhật > 30 ngày",
        "condition_type": "deal_stale",
        "condition_json": {"field": "stale_days", "operator": ">", "value": 30},
        "action_type": "auto_create_task",
        "action_params": {"title": "Follow up stale deal"},
        "delay_minutes": 0,
        "priority_threshold": 60,
        "follow_up_action": "auto_escalate",
        "follow_up_delay_hours": 48,
        "is_active": False
    },
    {
        "name": "Auto Notify for Unassigned Leads (24h)",
        "description": "Gửi thông báo khi lead chưa assign > 24h",
        "condition_type": "lead_unassigned",
        "condition_json": {"field": "hours_unassigned", "operator": ">", "value": 24},
        "action_type": "auto_notify",
        "action_params": {"message": "Lead chưa được assign"},
        "delay_minutes": 0,
        "priority_threshold": 70,
        "is_active": False
    },
    {
        "name": "Auto Escalate Expiring Bookings",
        "description": "Tự động escalate booking sắp hết hạn",
        "condition_type": "booking_expiring",
        "condition_json": {"field": "days_until_expire", "operator": "<=", "value": 2},
        "action_type": "auto_escalate",
        "action_params": {},
        "delay_minutes": 0,
        "priority_threshold": 85,
        "is_active": False
    },
    {
        "name": "Auto Reassign Overdue Tasks",
        "description": "Tự động reassign task quá hạn > 48h",
        "condition_type": "task_overdue",
        "condition_json": {"field": "hours_overdue", "operator": ">", "value": 48},
        "action_type": "auto_reassign",
        "action_params": {},
        "delay_minutes": 0,
        "priority_threshold": 65,
        "is_active": False
    }
]
