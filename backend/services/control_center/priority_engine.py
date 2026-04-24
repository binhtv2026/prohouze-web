"""
Priority Engine
Prompt 17/20 - Executive Control Center

Priority Engine for alerts, tasks, and suggestions.
Calculates priority scores and manages the "Today Focus Panel".
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from .dto import (
    AlertSeverity, 
    UrgencyLevel,
    SEVERITY_PRIORITY_SCORES,
    URGENCY_PRIORITY_SCORES,
    TASK_PRIORITY_SCORES
)
from .utils import get_now_utc, clamp


class PriorityEngine:
    """
    Priority Engine.
    Calculates priority scores and creates "Today Focus Panel".
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_today_focus_panel(self, user: Optional[dict] = None) -> Dict[str, Any]:
        """
        Get the "Today Focus Panel" - most important items for today.
        Returns prioritized list of alerts, tasks, and actions.
        """
        now = get_now_utc()
        today_end = now.replace(hour=23, minute=59, second=59)
        
        items = []
        
        # 1. Critical/High alerts
        from .alert_engine import AlertEngine
        alert_engine = AlertEngine(self.db)
        alerts = await alert_engine.detect_all_alerts(user)
        
        for alert in alerts[:20]:
            if alert.get("severity") in [AlertSeverity.CRITICAL.value, AlertSeverity.HIGH.value]:
                items.append({
                    "type": "alert",
                    "id": alert.get("id"),
                    "priority_score": self._calculate_alert_priority(alert),
                    "urgency": alert.get("urgency"),
                    "title": alert.get("title"),
                    "description": alert.get("description"),
                    "category": alert.get("category"),
                    "source_entity": alert.get("source_entity"),
                    "source_id": alert.get("source_id"),
                    "recommended_actions": alert.get("recommended_actions", []),
                    "created_at": alert.get("created_at")
                })
        
        # 2. Tasks due today
        tasks_today = await self.db.tasks.find({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lte": today_end.isoformat()}
        }, {"_id": 0}).sort("due_at", 1).limit(20).to_list(20)
        
        for task in tasks_today:
            is_overdue = task.get("due_at", "") < now.isoformat()
            items.append({
                "type": "task",
                "id": task.get("id"),
                "priority_score": self._calculate_task_priority(task, is_overdue),
                "urgency": UrgencyLevel.CRITICAL.value if is_overdue else UrgencyLevel.HIGH.value,
                "title": task.get("title"),
                "description": task.get("description", ""),
                "category": "task",
                "source_entity": task.get("related_entity"),
                "source_id": task.get("related_entity_id"),
                "due_at": task.get("due_at"),
                "is_overdue": is_overdue,
                "assigned_to": task.get("assigned_to")
            })
        
        # 3. High-priority suggestions
        from .suggestion_engine import SuggestionEngine
        suggestion_engine = SuggestionEngine(self.db)
        suggestions = await suggestion_engine.generate_suggestions(user)
        
        for suggestion in suggestions[:10]:
            if suggestion.get("priority_score", 0) >= 70:
                items.append({
                    "type": "suggestion",
                    "id": suggestion.get("id"),
                    "priority_score": suggestion.get("priority_score", 50),
                    "urgency": suggestion.get("urgency"),
                    "title": suggestion.get("title"),
                    "description": suggestion.get("description"),
                    "category": suggestion.get("category"),
                    "recommended_action": suggestion.get("recommended_action"),
                    "expected_impact": suggestion.get("expected_impact"),
                    "target_entity": suggestion.get("target_entity"),
                    "target_id": suggestion.get("target_id")
                })
        
        items.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        
        focus_items = items[:15]
        
        return {
            "date": now.strftime("%Y-%m-%d"),
            "total_items": len(items),
            "focus_items": focus_items,
            "summary": {
                "alerts_count": len([i for i in items if i["type"] == "alert"]),
                "tasks_count": len([i for i in items if i["type"] == "task"]),
                "suggestions_count": len([i for i in items if i["type"] == "suggestion"]),
                "critical_count": len([i for i in items if i.get("urgency") == UrgencyLevel.CRITICAL.value]),
                "high_count": len([i for i in items if i.get("urgency") == UrgencyLevel.HIGH.value])
            },
            "generated_at": now.isoformat()
        }
    
    def _calculate_alert_priority(self, alert: Dict[str, Any]) -> int:
        """Calculate priority score for an alert (0-100)."""
        score = 50
        
        severity = alert.get("severity", "medium")
        score += SEVERITY_PRIORITY_SCORES.get(AlertSeverity(severity) if severity in [s.value for s in AlertSeverity] else AlertSeverity.MEDIUM, 10)
        
        urgency = alert.get("urgency", "medium")
        score += URGENCY_PRIORITY_SCORES.get(UrgencyLevel(urgency) if urgency in [u.value for u in UrgencyLevel] else UrgencyLevel.MEDIUM, 0)
        
        return int(clamp(score, 0, 100))
    
    def _calculate_task_priority(self, task: Dict[str, Any], is_overdue: bool) -> int:
        """Calculate priority score for a task (0-100)."""
        score = 50
        
        if is_overdue:
            score += 30
        
        priority = task.get("priority", "medium")
        score += TASK_PRIORITY_SCORES.get(priority, 5)
        
        return int(clamp(score, 0, 100))
    
    async def get_priority_matrix(self) -> Dict[str, Any]:
        """
        Get priority matrix - items grouped by urgency/impact.
        Helps in prioritization decisions.
        """
        focus_panel = await self.get_today_focus_panel()
        items = focus_panel.get("focus_items", [])
        
        matrix = {
            "critical_urgent": [],
            "high_important": [],
            "medium_schedule": [],
            "low_delegate": []
        }
        
        for item in items:
            urgency = item.get("urgency", UrgencyLevel.MEDIUM.value)
            priority = item.get("priority_score", 50)
            
            if urgency == UrgencyLevel.CRITICAL.value or priority >= 80:
                matrix["critical_urgent"].append(item)
            elif urgency == UrgencyLevel.HIGH.value or priority >= 60:
                matrix["high_important"].append(item)
            elif priority >= 40:
                matrix["medium_schedule"].append(item)
            else:
                matrix["low_delegate"].append(item)
        
        return {
            "matrix": matrix,
            "counts": {
                "critical_urgent": len(matrix["critical_urgent"]),
                "high_important": len(matrix["high_important"]),
                "medium_schedule": len(matrix["medium_schedule"]),
                "low_delegate": len(matrix["low_delegate"])
            },
            "total": len(items),
            "generated_at": get_now_utc().isoformat()
        }
    
    async def get_user_focus(self, user_id: str) -> Dict[str, Any]:
        """
        Get focus items for a specific user.
        """
        now = get_now_utc()
        today_end = now.replace(hour=23, minute=59, second=59)
        
        items = []
        
        user_tasks = await self.db.tasks.find({
            "assigned_to": user_id,
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lte": today_end.isoformat()}
        }, {"_id": 0}).sort("due_at", 1).limit(10).to_list(10)
        
        for task in user_tasks:
            is_overdue = task.get("due_at", "") < now.isoformat()
            items.append({
                "type": "task",
                "id": task.get("id"),
                "priority_score": self._calculate_task_priority(task, is_overdue),
                "urgency": UrgencyLevel.CRITICAL.value if is_overdue else UrgencyLevel.HIGH.value,
                "title": task.get("title"),
                "due_at": task.get("due_at"),
                "is_overdue": is_overdue
            })
        
        user_leads = await self.db.leads.find({
            "assigned_to": user_id,
            "stage": {"$in": ["new", "hot", "negotiation"]}
        }, {"_id": 0, "id": 1, "full_name": 1, "stage": 1, "created_at": 1}).sort("created_at", 1).limit(10).to_list(10)
        
        for lead in user_leads:
            priority = 70 if lead.get("stage") in ["hot", "negotiation"] else 50
            items.append({
                "type": "lead",
                "id": lead.get("id"),
                "priority_score": priority,
                "urgency": UrgencyLevel.HIGH.value if lead.get("stage") in ["hot", "negotiation"] else UrgencyLevel.MEDIUM.value,
                "title": f"Lead: {lead.get('full_name', 'N/A')}",
                "stage": lead.get("stage")
            })
        
        items.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        
        return {
            "user_id": user_id,
            "date": now.strftime("%Y-%m-%d"),
            "focus_items": items[:10],
            "summary": {
                "tasks_count": len([i for i in items if i["type"] == "task"]),
                "leads_count": len([i for i in items if i["type"] == "lead"]),
                "overdue_count": len([i for i in items if i.get("is_overdue")])
            },
            "generated_at": now.isoformat()
        }
