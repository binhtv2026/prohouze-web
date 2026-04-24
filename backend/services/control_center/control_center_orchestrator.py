"""
Control Center Orchestrator
Prompt 17/20 - Executive Control Center

Entry point for all Control Center operations.
Router ONLY calls this orchestrator - never individual engines.

Flow:
    Router -> Orchestrator -> Engines -> Database
    
Orchestrator responsibilities:
    - Coordinate calls to multiple engines
    - Aggregate responses
    - Handle caching (future)
    - Provide unified API for Control Center
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from .alert_engine import AlertEngine
from .health_score_engine import HealthScoreEngine
from .bottleneck_engine import BottleneckEngine
from .action_engine import ActionEngine
from .suggestion_engine import SuggestionEngine
from .priority_engine import PriorityEngine
from .control_feed_engine import ControlFeedEngine
from .auto_action_engine import AutoActionEngine, DEFAULT_AUTO_RULES
from .utils import iso_now


class ControlCenterOrchestrator:
    """
    Control Center Orchestrator - Single Entry Point.
    
    This is the brain of the ProHouzing Operating System.
    All router endpoints should call methods from this class only.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
        # Initialize all engines
        self.alert_engine = AlertEngine(db)
        self.health_engine = HealthScoreEngine(db)
        self.bottleneck_engine = BottleneckEngine(db)
        self.action_engine = ActionEngine(db)
        self.suggestion_engine = SuggestionEngine(db)
        self.priority_engine = PriorityEngine(db)
        self.feed_engine = ControlFeedEngine(db)
        self.auto_engine = AutoActionEngine(db)
    
    # ==================== EXECUTIVE OVERVIEW ====================
    
    async def get_executive_overview(self, user: Optional[dict] = None) -> Dict[str, Any]:
        """
        Get comprehensive executive overview.
        
        This answers the 7 key questions for CEO/BOD:
        1. Business health overall?
        2. Sales funnel performance?
        3. Project performance?
        4. Pipeline health?
        5. Team performance?
        6. Marketing impact?
        7. Operational bottlenecks?
        
        Returns unified response from multiple engines.
        """
        now = datetime.now(timezone.utc)
        # month_start for future use
        
        # Call engines in parallel-like fashion (MongoDB operations)
        health_score = await self.health_engine.calculate_health_score()
        alerts = await self.alert_engine.detect_all_alerts(user)
        bottlenecks = await self.bottleneck_engine.detect_all_bottlenecks()
        suggestions = await self.suggestion_engine.generate_suggestions(user)
        focus_panel = await self.priority_engine.get_today_focus_panel(user)
        
        # Get sales funnel from health engine metrics
        sales_metrics = health_score.get("components", {}).get("conversion_rate", {}).get("metrics", {})
        pipeline_metrics = health_score.get("components", {}).get("pipeline_quality", {}).get("metrics", {})
        
        # Build executive summary
        alert_summary = await self.alert_engine.get_alert_summary()
        
        return {
            "timestamp": now.isoformat(),
            "data_freshness": now.isoformat(),
            
            # Core Health Score
            "health_score": health_score,
            
            # Alerts Overview
            "alerts": {
                "summary": alert_summary,
                "critical_alerts": [a for a in alerts if a.get("severity") == "critical"][:5],
                "total_count": len(alerts)
            },
            
            # Bottlenecks
            "bottlenecks": bottlenecks,
            
            # Suggestions
            "suggestions": {
                "top_suggestions": suggestions[:5],
                "total_count": len(suggestions)
            },
            
            # Today's Focus
            "focus_panel": focus_panel.get("summary"),
            
            # Quick Metrics
            "quick_metrics": {
                "pipeline_value": pipeline_metrics.get("pipeline_value", 0),
                "active_deals": pipeline_metrics.get("active_deals", 0),
                "conversion_rate": sales_metrics.get("lead_to_booking_rate", 0),
                "total_leads": sales_metrics.get("total_leads", 0),
                "total_bookings": sales_metrics.get("total_bookings", 0)
            }
        }
    
    async def get_unified_control_view(self, user: Optional[dict] = None) -> Dict[str, Any]:
        """
        Get unified control view with all data for dashboard rendering.
        Single API call to power the entire Control Center UI.
        """
        now = datetime.now(timezone.utc)
        
        # Fetch all data
        health_score = await self.health_engine.calculate_health_score()
        alerts = await self.alert_engine.detect_all_alerts(user)
        bottlenecks = await self.bottleneck_engine.detect_all_bottlenecks()
        suggestions = await self.suggestion_engine.generate_suggestions(user)
        focus_panel = await self.priority_engine.get_today_focus_panel(user)
        feed = await self.feed_engine.get_feed(limit=30)
        priority_matrix = await self.priority_engine.get_priority_matrix()
        
        return {
            "timestamp": now.isoformat(),
            "health_score": health_score,
            "alerts": alerts,
            "bottlenecks": bottlenecks,
            "suggestions": suggestions,
            "focus_panel": focus_panel,
            "control_feed": feed,
            "priority_matrix": priority_matrix
        }
    
    # ==================== HEALTH SCORE ====================
    
    async def get_health_score(self) -> Dict[str, Any]:
        """Get Business Health Score with component breakdown."""
        return await self.health_engine.calculate_health_score()
    
    async def save_health_snapshot(self, score_data: Dict[str, Any]) -> None:
        """Save health score snapshot for historical tracking."""
        await self.health_engine.save_snapshot(score_data)
    
    # ==================== ALERTS ====================
    
    async def get_alerts(
        self,
        user: Optional[dict] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get all alerts with optional filtering.
        """
        alerts = await self.alert_engine.detect_all_alerts(user)
        
        # Apply filters
        if category:
            alerts = [a for a in alerts if a.get("category") == category]
        if severity:
            alerts = [a for a in alerts if a.get("severity") == severity]
        
        summary = await self.alert_engine.get_alert_summary()
        
        return {
            "alerts": alerts,
            "summary": summary
        }
    
    async def get_alert_summary(self) -> Dict[str, Any]:
        """Get alert summary by category and severity."""
        return await self.alert_engine.get_alert_summary()
    
    async def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Acknowledge an alert."""
        return await self.alert_engine.acknowledge_alert(alert_id, user_id)
    
    async def resolve_alert(
        self,
        alert_id: str,
        user_id: str,
        resolution_note: Optional[str] = None
    ) -> bool:
        """Resolve an alert."""
        success = await self.alert_engine.resolve_alert(alert_id, user_id, resolution_note)
        
        # Add to feed
        if success:
            await self.feed_engine.add_item({
                "type": "resolution",
                "category": "alert_resolved",
                "title": "Alert resolved",
                "description": resolution_note or "Alert has been resolved",
                "actor": user_id,
                "source_entity": "control_alerts",
                "source_id": alert_id
            })
        
        return success
    
    # ==================== BOTTLENECKS ====================
    
    async def get_bottlenecks(self) -> Dict[str, Any]:
        """Get all operational bottlenecks."""
        return await self.bottleneck_engine.detect_all_bottlenecks()
    
    async def get_bottleneck_details(self, bottleneck_type: str) -> Dict[str, Any]:
        """Get detailed data for a specific bottleneck type."""
        return await self.bottleneck_engine.get_bottleneck_details(bottleneck_type)
    
    # ==================== SUGGESTIONS ====================
    
    async def get_suggestions(self, user: Optional[dict] = None) -> Dict[str, Any]:
        """Get decision suggestions with summary."""
        suggestions = await self.suggestion_engine.generate_suggestions(user)
        summary = await self.suggestion_engine.get_summary()
        
        return {
            "suggestions": suggestions,
            "summary": summary
        }
    
    async def get_suggestions_summary(self) -> Dict[str, Any]:
        """Get suggestions summary only."""
        return await self.suggestion_engine.get_summary()
    
    # ==================== ACTIONS ====================
    
    async def execute_action(
        self,
        action_type: str,
        source_alert_id: Optional[str],
        source_entity: str,
        source_id: str,
        params: Dict[str, Any],
        user: dict
    ) -> Dict[str, Any]:
        """
        Execute an action from the Control Center.
        """
        result = await self.action_engine.execute_action(
            action_type=action_type,
            source_alert_id=source_alert_id,
            source_entity=source_entity,
            source_id=source_id,
            params=params,
            user=user
        )
        
        # Add to feed
        await self.feed_engine.add_item({
            "type": "action",
            "category": "action_executed",
            "title": f"Action: {action_type}",
            "description": result.get("message", "Action executed"),
            "actor": user.get("full_name"),
            "source_entity": source_entity,
            "source_id": source_id,
            "metadata": {"action_id": result.get("action_id"), "action_type": action_type}
        })
        
        return result
    
    async def verify_action_result(
        self,
        action_id: str,
        is_resolved: bool,
        user: dict
    ) -> Dict[str, Any]:
        """Verify if an action resolved the issue (closed-loop tracking)."""
        return await self.action_engine.verify_action_result(action_id, is_resolved, user)
    
    async def get_action_effectiveness(self) -> Dict[str, Any]:
        """Get statistics on action effectiveness."""
        return await self.action_engine.get_action_effectiveness()
    
    # ==================== PRIORITY & FOCUS ====================
    
    async def get_today_focus(self, user: Optional[dict] = None) -> Dict[str, Any]:
        """Get Today Focus Panel."""
        return await self.priority_engine.get_today_focus_panel(user)
    
    async def get_user_focus(self, user_id: str) -> Dict[str, Any]:
        """Get focus items for a specific user."""
        return await self.priority_engine.get_user_focus(user_id)
    
    async def get_priority_matrix(self) -> Dict[str, Any]:
        """Get priority matrix grouped by urgency/impact."""
        return await self.priority_engine.get_priority_matrix()
    
    # ==================== CONTROL FEED ====================
    
    async def get_control_feed(self, limit: int = 50, user: Optional[dict] = None) -> List[Dict[str, Any]]:
        """Get Control Feed - real-time stream of alerts, actions, updates."""
        return await self.feed_engine.get_feed(limit=limit)
    
    # ==================== OPERATIONS COMMAND CENTER ====================
    
    async def get_operations_overview(self, user: Optional[dict] = None) -> Dict[str, Any]:
        """
        Get Operations Command Center overview.
        For Sales Directors/Managers - daily operations focus.
        """
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get core data
        bottlenecks = await self.bottleneck_engine.detect_all_bottlenecks()
        alerts = await self.alert_engine.detect_all_alerts(user)
        focus = await self.priority_engine.get_today_focus_panel(user)
        
        # Team workload
        workload_pipeline = [
            {"$match": {"stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}}},
            {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        workload = await self.db.leads.aggregate(workload_pipeline).to_list(10)
        
        # Enrich workload with user names
        for w in workload:
            if w["_id"]:
                user_doc = await self.db.users.find_one({"id": w["_id"]}, {"_id": 0, "full_name": 1})
                w["user_name"] = user_doc.get("full_name") if user_doc else "Unknown"
        
        # Today's metrics
        today_leads = await self.db.leads.count_documents({"created_at": {"$gte": today_start.isoformat()}})
        today_activities = await self.db.activities.count_documents({"created_at": {"$gte": today_start.isoformat()}})
        today_tasks_completed = await self.db.tasks.count_documents({
            "status": "completed",
            "completed_at": {"$gte": today_start.isoformat()}
        })
        
        return {
            "bottlenecks": bottlenecks,
            "alert_summary": {
                "total": len(alerts),
                "critical": len([a for a in alerts if a.get("severity") == "critical"]),
                "high": len([a for a in alerts if a.get("severity") == "high"])
            },
            "focus_summary": focus.get("summary"),
            "team_workload": workload,
            "today_metrics": {
                "new_leads": today_leads,
                "activities": today_activities,
                "tasks_completed": today_tasks_completed
            },
            "generated_at": now.isoformat()
        }
    
    async def get_pipeline_overview(self) -> Dict[str, Any]:
        """Get pipeline overview for operations."""
        now = datetime.now(timezone.utc)
        from datetime import timedelta
        stale_threshold = now - timedelta(days=7)
        
        # Pipeline by stage
        stage_pipeline = [
            {"$match": {"stage": {"$nin": ["completed", "lost", "won"]}}},
            {"$group": {
                "_id": "$stage",
                "count": {"$sum": 1},
                "value": {"$sum": "$value"}
            }},
            {"$sort": {"count": -1}}
        ]
        by_stage = await self.db.deals.aggregate(stage_pipeline).to_list(20)
        
        # Recent deal activity
        recent_deals = await self.db.deals.find(
            {},
            {"_id": 0, "id": 1, "code": 1, "customer_name": 1, "stage": 1, "value": 1, "updated_at": 1}
        ).sort("updated_at", -1).limit(10).to_list(10)
        
        # Pipeline health
        total_deals = await self.db.deals.count_documents({"stage": {"$nin": ["completed", "lost", "won"]}})
        stale_deals = await self.db.deals.count_documents({
            "stage": {"$nin": ["completed", "lost", "won"]},
            "updated_at": {"$lt": stale_threshold.isoformat()}
        })
        
        return {
            "by_stage": {s["_id"]: {"count": s["count"], "value": s["value"]} for s in by_stage},
            "recent_deals": recent_deals,
            "health": {
                "total_deals": total_deals,
                "stale_deals": stale_deals,
                "active_deals": total_deals - stale_deals,
                "health_pct": round(((total_deals - stale_deals) / max(1, total_deals) * 100), 1)
            }
        }
    
    async def get_team_heatmap(self) -> Dict[str, Any]:
        """Get team performance heatmap."""
        now = datetime.now(timezone.utc)
        # month_start for future use
        
        # Get all sales users
        sales_users = await self.db.users.find(
            {"role": {"$in": ["sales", "senior_sales"]}, "is_active": True},
            {"_id": 0, "id": 1, "full_name": 1, "team_id": 1}
        ).to_list(100)
        
        heatmap = []
        for user in sales_users:
            leads_assigned = await self.db.leads.count_documents({
                "assigned_to": user["id"],
                "created_at": {"$gte": month_start.isoformat()}
            })
            leads_converted = await self.db.leads.count_documents({
                "assigned_to": user["id"],
                "stage": {"$in": ["converted", "closed_won"]},
                "updated_at": {"$gte": month_start.isoformat()}
            })
            active_leads = await self.db.leads.count_documents({
                "assigned_to": user["id"],
                "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}
            })
            overdue_tasks = await self.db.tasks.count_documents({
                "assigned_to": user["id"],
                "status": {"$nin": ["completed", "cancelled"]},
                "due_at": {"$lt": now.isoformat()}
            })
            
            conversion_rate = (leads_converted / leads_assigned * 100) if leads_assigned > 0 else 0
            
            heatmap.append({
                "user_id": user["id"],
                "user_name": user.get("full_name"),
                "team_id": user.get("team_id"),
                "leads_assigned": leads_assigned,
                "leads_converted": leads_converted,
                "active_leads": active_leads,
                "overdue_tasks": overdue_tasks,
                "conversion_rate": round(conversion_rate, 1),
                "workload_status": "overloaded" if active_leads > 30 else "optimal" if active_leads > 10 else "light"
            })
        
        heatmap.sort(key=lambda x: x["conversion_rate"], reverse=True)
        
        return {
            "heatmap": heatmap,
            "metrics": {
                "total_users": len(heatmap),
                "avg_conversion": round(sum(h["conversion_rate"] for h in heatmap) / max(1, len(heatmap)), 1),
                "overloaded_count": len([h for h in heatmap if h["workload_status"] == "overloaded"])
            }
        }


    # ==================== AUTO ACTION ENGINE ====================
    
    async def get_auto_rules(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get all auto action rules."""
        return await self.auto_engine.get_rules(active_only)
    
    async def get_auto_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific auto action rule."""
        return await self.auto_engine.get_rule(rule_id)
    
    async def create_auto_rule(self, rule_data: Dict[str, Any], user: dict) -> Dict[str, Any]:
        """Create a new auto action rule."""
        return await self.auto_engine.create_rule(rule_data, user)
    
    async def update_auto_rule(self, rule_id: str, updates: Dict[str, Any], user: dict) -> Dict[str, Any]:
        """Update an existing auto action rule."""
        return await self.auto_engine.update_rule(rule_id, updates, user)
    
    async def toggle_auto_rule(self, rule_id: str, is_active: bool, user: dict) -> Dict[str, Any]:
        """Toggle auto rule on/off."""
        return await self.auto_engine.toggle_rule(rule_id, is_active, user)
    
    async def delete_auto_rule(self, rule_id: str) -> bool:
        """Delete an auto action rule."""
        return await self.auto_engine.delete_rule(rule_id)
    
    async def run_auto_actions(self) -> Dict[str, Any]:
        """Run auto action rules check and execution."""
        return await self.auto_engine.check_and_execute_rules()
    
    async def undo_auto_action(self, action_id: str, user: dict) -> Dict[str, Any]:
        """Undo an auto action within the undo window."""
        return await self.auto_engine.undo_action(action_id, user)
    
    async def get_auto_action_stats(self) -> Dict[str, Any]:
        """Get auto action statistics."""
        return await self.auto_engine.get_auto_action_stats()
    
    async def get_recent_auto_actions(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent auto actions."""
        return await self.auto_engine.get_recent_auto_actions(limit)
    
    async def initialize_default_rules(self, user: dict) -> Dict[str, Any]:
        """Initialize default auto action rules."""
        created = 0
        for rule_data in DEFAULT_AUTO_RULES:
            existing = await self.db.auto_action_rules.find_one({"name": rule_data["name"]})
            if not existing:
                await self.auto_engine.create_rule(rule_data, user)
                created += 1
        return {"created": created, "total": len(DEFAULT_AUTO_RULES)}
