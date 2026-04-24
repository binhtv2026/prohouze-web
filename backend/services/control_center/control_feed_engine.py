"""
Control Feed Engine
Prompt 17/20 - Executive Control Center

Real-time operational timeline - ACTION LOG, RESULT LOG, SYSTEM LOG.
Aggregates actions, results, and system updates into a command center feed.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from .dto import FeedItemType
from .utils import get_now_utc, iso_now


class ControlFeedEngine:
    """
    Control Feed Engine.
    Manages the real-time operational timeline/command feed.
    
    Feed Types:
    - ACTION LOG: Actions taken (reassign, create task, notify, escalate)
    - RESULT LOG: Results of actions (resolved, still problematic)
    - SYSTEM LOG: Alerts, escalations, system updates
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._feed_collection = "control_feed"
    
    async def get_feed(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get Control Feed - real-time stream of actions, results, and system events.
        Structured as a command center log, not just activity feed.
        """
        now = get_now_utc()
        feed_items = []
        
        # 1. ACTION LOG - Recent actions executed
        recent_actions = await self.db.control_actions.find(
            {"success": True},
            {"_id": 0}
        ).sort("executed_at", -1).limit(20).to_list(20)
        
        for action in recent_actions:
            # Check if action has verification result
            verification_status = None
            if action.get("verified"):
                verification_status = "resolved" if action.get("issue_resolved") else "still_problematic"
            
            feed_items.append({
                "id": action.get("id"),
                "type": "action",
                "log_type": "ACTION_LOG",
                "category": "action_executed",
                "title": f"Action: {self._get_action_label(action.get('action_type'))}",
                "description": action.get("result", {}).get("message", "Action executed successfully"),
                "actor": action.get("executed_by_name"),
                "source_entity": action.get("source_entity"),
                "source_id": action.get("source_id"),
                "timestamp": action.get("executed_at"),
                "metadata": {
                    "action_type": action.get("action_type"),
                    "action_id": action.get("id"),
                    "success": action.get("success"),
                    "verification_status": verification_status
                }
            })
            
            # Add RESULT LOG entry if verified
            if action.get("verified"):
                improvement = await self._calculate_improvement(action)
                feed_items.append({
                    "id": f"{action.get('id')}_result",
                    "type": "resolution",
                    "log_type": "RESULT_LOG",
                    "category": "action_result",
                    "title": f"Result: {'Issue Resolved' if action.get('issue_resolved') else 'Still Problematic'}",
                    "description": f"Action '{self._get_action_label(action.get('action_type'))}' - {improvement.get('description', 'Verified')}",
                    "actor": action.get("executed_by_name"),
                    "source_entity": action.get("source_entity"),
                    "source_id": action.get("source_id"),
                    "timestamp": action.get("verified_at"),
                    "severity": "info" if action.get("issue_resolved") else "warning",
                    "metadata": {
                        "action_id": action.get("id"),
                        "is_resolved": action.get("issue_resolved"),
                        "improvement": improvement
                    }
                })
        
        # 2. SYSTEM LOG - Recent alerts
        from .alert_engine import AlertEngine
        alert_engine = AlertEngine(self.db)
        alerts = await alert_engine.detect_all_alerts()
        
        for alert in alerts[:15]:
            feed_items.append({
                "id": alert.get("id"),
                "type": "alert",
                "log_type": "SYSTEM_LOG",
                "category": alert.get("category"),
                "severity": alert.get("severity"),
                "title": f"Alert: {alert.get('title')}",
                "description": alert.get("description"),
                "source_entity": alert.get("source_entity"),
                "source_id": alert.get("source_id"),
                "timestamp": alert.get("created_at", now.isoformat()),
                "metadata": {
                    "rule_code": alert.get("rule_code"),
                    "metrics": alert.get("metrics")
                }
            })
        
        # 3. SYSTEM LOG - Escalations
        recent_escalations = await self.db.escalations.find(
            {"status": "open"},
            {"_id": 0}
        ).sort("escalated_at", -1).limit(10).to_list(10)
        
        for escalation in recent_escalations:
            feed_items.append({
                "id": escalation.get("id"),
                "type": "escalation",
                "log_type": "SYSTEM_LOG",
                "category": "escalation",
                "severity": "high",
                "title": f"Escalation: {escalation.get('entity_type')}",
                "description": escalation.get("reason"),
                "source_entity": escalation.get("entity_type"),
                "source_id": escalation.get("entity_id"),
                "timestamp": escalation.get("escalated_at"),
                "metadata": {"status": escalation.get("status")}
            })
        
        # 4. Stored custom feed items
        stored_items = await self.db[self._feed_collection].find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(15).to_list(15)
        
        for item in stored_items:
            item["log_type"] = item.get("log_type", "SYSTEM_LOG")
            feed_items.append(item)
        
        # Sort by timestamp and deduplicate
        seen_ids = set()
        unique_items = []
        for item in feed_items:
            item_id = item.get("id")
            if item_id and item_id not in seen_ids:
                seen_ids.add(item_id)
                unique_items.append(item)
        
        unique_items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return unique_items[:limit]
    
    def _get_action_label(self, action_type: str) -> str:
        """Get human-readable action label."""
        labels = {
            "reassign_owner": "Reassigned Owner",
            "create_task": "Created Task",
            "send_reminder": "Sent Notification",
            "request_docs": "Requested Documents",
            "assign_reviewer": "Assigned Reviewer",
            "trigger_campaign": "Triggered Campaign",
            "escalate": "Escalated to Management",
            "mark_resolved": "Marked Resolved"
        }
        return labels.get(action_type, action_type)
    
    async def _calculate_improvement(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate improvement metrics after action verification.
        This provides the closed-loop feedback.
        """
        if not action.get("issue_resolved"):
            return {
                "description": "Issue still requires attention",
                "improvement_pct": 0
            }
        
        action_type = action.get("action_type")
        
        # Calculate improvement based on action type
        if action_type == "reassign_owner":
            return {
                "description": "Entity reassigned and progressing",
                "improvement_pct": 100
            }
        elif action_type == "create_task":
            return {
                "description": "Follow-up task created and tracked",
                "improvement_pct": 100
            }
        elif action_type == "send_reminder":
            return {
                "description": "Notification sent, awaiting response",
                "improvement_pct": 50
            }
        elif action_type == "escalate":
            return {
                "description": "Escalated to management, under review",
                "improvement_pct": 75
            }
        
        return {
            "description": "Action completed",
            "improvement_pct": 100
        }
    
    async def add_item(self, item: Dict[str, Any]) -> str:
        """
        Add an item to the control feed.
        """
        now = get_now_utc()
        
        feed_item = {
            "id": str(uuid.uuid4()),
            "type": item.get("type", FeedItemType.UPDATE.value),
            "log_type": item.get("log_type", "SYSTEM_LOG"),
            "category": item.get("category", "general"),
            "severity": item.get("severity"),
            "title": item.get("title", "Update"),
            "description": item.get("description", ""),
            "actor": item.get("actor"),
            "source_entity": item.get("source_entity"),
            "source_id": item.get("source_id"),
            "timestamp": now.isoformat(),
            "metadata": item.get("metadata", {})
        }
        
        await self.db[self._feed_collection].insert_one(feed_item)
        
        return feed_item["id"]
    
    async def add_action_result(
        self,
        action_id: str,
        is_resolved: bool,
        improvement_description: str,
        improvement_pct: float,
        user: dict
    ) -> str:
        """Add action result entry to feed."""
        return await self.add_item({
            "type": "resolution",
            "log_type": "RESULT_LOG",
            "category": "action_result",
            "title": f"Result: {'Resolved' if is_resolved else 'Still Problematic'}",
            "description": improvement_description,
            "actor": user.get("full_name"),
            "metadata": {
                "action_id": action_id,
                "is_resolved": is_resolved,
                "improvement": {"description": improvement_description, "improvement_pct": improvement_pct}
            }
        })
    
    async def get_feed_by_category(self, category: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get feed items filtered by category."""
        all_items = await self.get_feed(limit=100)
        filtered = [item for item in all_items if item.get("category") == category]
        return filtered[:limit]
    
    async def get_action_log(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Get only action log entries."""
        all_items = await self.get_feed(limit=100)
        return [item for item in all_items if item.get("log_type") == "ACTION_LOG"][:limit]
    
    async def get_result_log(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Get only result log entries."""
        all_items = await self.get_feed(limit=100)
        return [item for item in all_items if item.get("log_type") == "RESULT_LOG"][:limit]
    
    async def get_system_log(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Get only system log entries."""
        all_items = await self.get_feed(limit=100)
        return [item for item in all_items if item.get("log_type") == "SYSTEM_LOG"][:limit]
    
    async def cleanup_old_items(self, days: int = 30) -> int:
        """Remove old feed items."""
        from datetime import timedelta
        cutoff = get_now_utc() - timedelta(days=days)
        
        result = await self.db[self._feed_collection].delete_many({
            "timestamp": {"$lt": cutoff.isoformat()}
        })
        
        return result.deleted_count
