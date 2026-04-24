"""
Automation Orchestrator - Main Entry Point
Prompt 19/20 - Automation Engine

Central orchestrator that:
- Receives business events
- Evaluates rules
- Executes actions
- Manages the full automation lifecycle
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import logging

from .business_events import BusinessEvent, EventEmitter, EventType, EventRegistry
from .rule_engine import RuleEngine, AutomationRule, RuleAction
from .execution_engine import ExecutionEngine, ExecutionLog, ExecutionStatus
from .guardrails import GuardrailEngine
from .priority_engine import BusinessPriorityEngine

logger = logging.getLogger(__name__)


class AutomationOrchestrator:
    """
    Automation Orchestrator - The brain of the automation system.
    
    Responsibilities:
    - Receive and process business events
    - Match events to rules
    - Prioritize and execute actions
    - Handle errors and retries
    - Provide observability
    """
    
    def __init__(self, db):
        self.db = db
        self.event_emitter = EventEmitter(db)
        self.rule_engine = RuleEngine(db)
        self.execution_engine = ExecutionEngine(db)
        self.guardrails = GuardrailEngine(db)
        self.priority_engine = BusinessPriorityEngine(db)
    
    # ==================== EVENT PROCESSING ====================
    
    async def process_event(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        payload: Dict[str, Any] = None,
        actor_type: str = "system",
        actor_id: str = None,
        correlation_id: str = None
    ) -> Dict[str, Any]:
        """
        Process a business event.
        
        This is the MAIN ENTRY POINT for automation.
        Call this whenever something happens in the system.
        
        Args:
            event_type: EventType value (e.g., "lead.created")
            entity_type: Collection name (leads, deals, etc.)
            entity_id: Entity ID
            payload: Event-specific data
            actor_type: system, user, automation
            actor_id: User ID if actor is user
            correlation_id: For tracing event chains
            
        Returns:
            {
                "event": BusinessEvent,
                "rules_matched": int,
                "actions_executed": int,
                "actions_skipped": int,
                "results": [ExecutionLog]
            }
        """
        result = {
            "event": None,
            "rules_matched": 0,
            "actions_executed": 0,
            "actions_skipped": 0,
            "actions_pending_approval": 0,
            "results": []
        }
        
        # Generate correlation ID if not provided
        if not correlation_id:
            correlation_id = f"corr_{uuid.uuid4().hex[:12]}"
        
        # 1. Emit the event
        event = await self.event_emitter.emit(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload,
            actor_type=actor_type,
            actor_id=actor_id,
            correlation_id=correlation_id,
        )
        result["event"] = event.to_dict()
        
        # 2. Fetch entity data
        entity_data = await self.db[entity_type].find_one(
            {"id": entity_id}, {"_id": 0}
        )
        
        if not entity_data:
            logger.warning(f"Entity not found: {entity_type}/{entity_id}")
            return result
        
        # 3. Calculate priority
        priority = await self.priority_engine.calculate_priority(
            entity_type, entity_id, entity_data
        )
        
        # 4. Get matching rules
        matching_rules = await self.rule_engine.get_matching_rules(
            event_type, entity_data, payload
        )
        result["rules_matched"] = len(matching_rules)
        
        if not matching_rules:
            logger.debug(f"No rules matched for event {event_type}")
            return result
        
        # 5. Execute actions for each matching rule
        for rule in matching_rules:
            for action in rule.actions:
                # Check if rule has minimum priority requirement
                min_priority = rule.priority
                if priority.score < min_priority / 2:
                    # Skip low priority items for high priority rules
                    logger.debug(f"Skipping rule {rule.rule_id} - priority too low")
                    result["actions_skipped"] += 1
                    continue
                
                # Execute action
                execution_log = await self.execution_engine.execute_action(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    event_id=event.event_id,
                    event_type=event_type,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    action=action,
                    entity_data=entity_data,
                    correlation_id=correlation_id,
                    triggered_by=actor_type,
                    is_test_mode=rule.is_test_mode,
                )
                
                result["results"].append(execution_log.to_dict())
                
                if execution_log.status == ExecutionStatus.SUCCESS.value:
                    result["actions_executed"] += 1
                    # Update rule stats
                    await self.rule_engine.update_rule_stats(rule.rule_id, success=True)
                elif execution_log.status == ExecutionStatus.PENDING_APPROVAL.value:
                    result["actions_pending_approval"] += 1
                elif execution_log.status == ExecutionStatus.SKIPPED.value:
                    result["actions_skipped"] += 1
                else:
                    await self.rule_engine.update_rule_stats(rule.rule_id, success=False)
        
        logger.info(
            f"Event {event_type} processed: "
            f"{result['rules_matched']} rules, "
            f"{result['actions_executed']} actions executed, "
            f"{result['actions_skipped']} skipped"
        )
        
        return result
    
    # ==================== SCHEDULED CHECKS ====================
    
    async def run_scheduled_checks(self) -> Dict[str, Any]:
        """
        Run scheduled automation checks.
        
        Call this periodically (e.g., every 5-10 minutes) to detect:
        - Stale deals
        - Expiring bookings
        - Overdue tasks
        - Unassigned leads
        - etc.
        """
        result = {
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "events_emitted": 0,
            "details": {}
        }
        
        # Check stale deals
        stale_result = await self._check_stale_deals()
        result["details"]["stale_deals"] = stale_result
        result["events_emitted"] += stale_result.get("count", 0)
        
        # Check expiring bookings
        booking_result = await self._check_expiring_bookings()
        result["details"]["expiring_bookings"] = booking_result
        result["events_emitted"] += booking_result.get("count", 0)
        
        # Check unassigned leads
        unassigned_result = await self._check_unassigned_leads()
        result["details"]["unassigned_leads"] = unassigned_result
        result["events_emitted"] += unassigned_result.get("count", 0)
        
        # Check overdue tasks
        overdue_result = await self._check_overdue_tasks()
        result["details"]["overdue_tasks"] = overdue_result
        result["events_emitted"] += overdue_result.get("count", 0)
        
        # Check contract review overdue
        contract_result = await self._check_contract_review_overdue()
        result["details"]["contract_review_overdue"] = contract_result
        result["events_emitted"] += contract_result.get("count", 0)
        
        # Check lead SLA breach
        sla_result = await self._check_lead_sla_breach()
        result["details"]["lead_sla_breach"] = sla_result
        result["events_emitted"] += sla_result.get("count", 0)
        
        logger.info(f"Scheduled checks complete: {result['events_emitted']} events emitted")
        
        return result
    
    async def _check_stale_deals(self, days: int = 7) -> Dict[str, Any]:
        """Check for deals without updates."""
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(days=days)
        
        stale_deals = await self.db.deals.find({
            "stage": {"$nin": ["completed", "lost", "won", "closed_won", "closed_lost"]},
            "updated_at": {"$lt": threshold.isoformat()},
            "flags.stale_notified": {"$ne": True}
        }, {"_id": 0, "id": 1, "value": 1}).to_list(50)
        
        count = 0
        for deal in stale_deals:
            await self.process_event(
                event_type=EventType.DEAL_STALE_DETECTED.value,
                entity_type="deals",
                entity_id=deal["id"],
                payload={"days_stale": days, "value": deal.get("value", 0)}
            )
            
            # Mark as notified to prevent spam
            await self.db.deals.update_one(
                {"id": deal["id"]},
                {"$set": {"flags.stale_notified": True}}
            )
            count += 1
        
        return {"count": count, "threshold_days": days}
    
    async def _check_expiring_bookings(self, days: int = 3) -> Dict[str, Any]:
        """Check for bookings expiring soon."""
        now = datetime.now(timezone.utc)
        threshold = now + timedelta(days=days)
        
        expiring = await self.db.soft_bookings.find({
            "status": "active",
            "expires_at": {"$gte": now.isoformat(), "$lte": threshold.isoformat()},
            "flags.expiry_notified": {"$ne": True}
        }, {"_id": 0, "id": 1, "expires_at": 1}).to_list(50)
        
        count = 0
        for booking in expiring:
            await self.process_event(
                event_type=EventType.BOOKING_EXPIRING.value,
                entity_type="soft_bookings",
                entity_id=booking["id"],
                payload={"expires_at": booking.get("expires_at")}
            )
            
            await self.db.soft_bookings.update_one(
                {"id": booking["id"]},
                {"$set": {"flags.expiry_notified": True}}
            )
            count += 1
        
        return {"count": count, "threshold_days": days}
    
    async def _check_unassigned_leads(self, hours: int = 24) -> Dict[str, Any]:
        """Check for unassigned leads."""
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(hours=hours)
        
        unassigned = await self.db.leads.find({
            "assigned_to": {"$in": [None, ""]},
            "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]},
            "created_at": {"$lt": threshold.isoformat()},
            "flags.unassigned_notified": {"$ne": True}
        }, {"_id": 0, "id": 1}).to_list(50)
        
        count = 0
        for lead in unassigned:
            await self.process_event(
                event_type=EventType.LEAD_UNASSIGNED_DETECTED.value,
                entity_type="leads",
                entity_id=lead["id"],
                payload={"hours_unassigned": hours}
            )
            
            await self.db.leads.update_one(
                {"id": lead["id"]},
                {"$set": {"flags.unassigned_notified": True}}
            )
            count += 1
        
        return {"count": count, "threshold_hours": hours}
    
    async def _check_overdue_tasks(self) -> Dict[str, Any]:
        """Check for overdue tasks."""
        now = datetime.now(timezone.utc)
        
        overdue = await self.db.tasks.find({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lt": now.isoformat()},
            "flags.overdue_notified": {"$ne": True}
        }, {"_id": 0, "id": 1, "due_at": 1}).to_list(50)
        
        count = 0
        for task in overdue:
            await self.process_event(
                event_type=EventType.TASK_OVERDUE.value,
                entity_type="tasks",
                entity_id=task["id"],
                payload={"due_at": task.get("due_at")}
            )
            
            await self.db.tasks.update_one(
                {"id": task["id"]},
                {"$set": {"flags.overdue_notified": True}}
            )
            count += 1
        
        return {"count": count}
    
    async def _check_contract_review_overdue(self, days: int = 3) -> Dict[str, Any]:
        """Check for contracts pending review too long."""
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(days=days)
        
        pending = await self.db.contracts.find({
            "status": {"$in": ["pending_review", "pending_approval"]},
            "updated_at": {"$lt": threshold.isoformat()},
            "flags.review_overdue_notified": {"$ne": True}
        }, {"_id": 0, "id": 1}).to_list(50)
        
        count = 0
        for contract in pending:
            await self.process_event(
                event_type=EventType.CONTRACT_REVIEW_OVERDUE.value,
                entity_type="contracts",
                entity_id=contract["id"],
                payload={"days_pending": days}
            )
            
            await self.db.contracts.update_one(
                {"id": contract["id"]},
                {"$set": {"flags.review_overdue_notified": True}}
            )
            count += 1
        
        return {"count": count, "threshold_days": days}
    
    async def _check_lead_sla_breach(self, hours: int = 24) -> Dict[str, Any]:
        """Check for leads with no contact within SLA."""
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(hours=hours)
        
        breached = await self.db.leads.find({
            "stage": "new",
            "last_activity_at": {"$in": [None, ""]},
            "created_at": {"$lt": threshold.isoformat()},
            "flags.sla_breach_notified": {"$ne": True}
        }, {"_id": 0, "id": 1}).to_list(50)
        
        count = 0
        for lead in breached:
            await self.process_event(
                event_type=EventType.LEAD_SLA_BREACH.value,
                entity_type="leads",
                entity_id=lead["id"],
                payload={"sla_hours": hours}
            )
            
            await self.db.leads.update_one(
                {"id": lead["id"]},
                {"$set": {"flags.sla_breach_notified": True}}
            )
            count += 1
        
        return {"count": count, "sla_hours": hours}
    
    # ==================== RULE MANAGEMENT ====================
    
    async def create_rule(self, rule_data: Dict[str, Any], user_id: str = "system") -> AutomationRule:
        """Create a new automation rule."""
        rule = AutomationRule.from_dict(rule_data)
        return await self.rule_engine.create_rule(rule, user_id)
    
    async def get_rules(self, enabled_only: bool = False) -> List[Dict[str, Any]]:
        """Get all automation rules."""
        rules = await self.rule_engine.get_all_rules(enabled_only)
        return [r.to_dict() for r in rules]
    
    async def toggle_rule(self, rule_id: str, enabled: bool, user_id: str = "system") -> bool:
        """Enable or disable a rule."""
        return await self.rule_engine.toggle_rule(rule_id, enabled, user_id)
    
    async def set_test_mode(self, rule_id: str, test_mode: bool, user_id: str = "system") -> bool:
        """Set test mode for a rule."""
        return await self.rule_engine.update_rule(rule_id, {"is_test_mode": test_mode}, user_id)
    
    # ==================== OBSERVABILITY ====================
    
    async def get_automation_stats(self) -> Dict[str, Any]:
        """Get automation statistics."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        
        # Rule stats
        total_rules = await self.db["automation_rules"].count_documents({})
        active_rules = await self.db["automation_rules"].count_documents({"is_enabled": True})
        
        # Execution stats
        today_executions = await self.db["automation_execution_logs"].count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        today_success = await self.db["automation_execution_logs"].count_documents({
            "created_at": {"$gte": today_start.isoformat()},
            "status": ExecutionStatus.SUCCESS.value
        })
        
        today_failed = await self.db["automation_execution_logs"].count_documents({
            "created_at": {"$gte": today_start.isoformat()},
            "status": ExecutionStatus.FAILED.value
        })
        
        # Event stats
        today_events = await self.db["business_events"].count_documents({
            "timestamp": {"$gte": today_start.isoformat()}
        })
        
        # Pending approvals
        pending_approvals = await self.db["automation_pending_approvals"].count_documents({
            "status": "pending"
        })
        
        # By action type
        action_pipeline = [
            {"$match": {"created_at": {"$gte": week_start.isoformat()}}},
            {"$group": {"_id": "$action_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        action_stats = await self.db["automation_execution_logs"].aggregate(action_pipeline).to_list(10)
        
        return {
            "rules": {
                "total": total_rules,
                "active": active_rules
            },
            "today": {
                "events": today_events,
                "executions": today_executions,
                "success": today_success,
                "failed": today_failed,
                "success_rate": round(today_success / today_executions * 100, 1) if today_executions > 0 else 0
            },
            "pending_approvals": pending_approvals,
            "top_actions_this_week": {item["_id"]: item["count"] for item in action_stats}
        }
    
    async def get_recent_executions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent execution logs."""
        logs = await self.execution_engine.get_execution_logs(limit=limit)
        return [log.to_dict() for log in logs]
    
    async def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent business events."""
        return await self.event_emitter.get_recent_events(limit=limit)
    
    async def get_pending_approvals(self) -> List[Dict[str, Any]]:
        """Get pending approval requests."""
        return await self.execution_engine.get_pending_approvals()
    
    async def approve_execution(self, execution_id: str, approver_id: str) -> bool:
        """Approve a pending execution."""
        return await self.execution_engine.approve_execution(execution_id, approver_id)
    
    async def reject_execution(self, execution_id: str, rejector_id: str, reason: str = "") -> bool:
        """Reject a pending execution."""
        return await self.execution_engine.reject_execution(execution_id, rejector_id, reason)


# ==================== HELPER FUNCTION ====================

def get_automation_orchestrator(db) -> AutomationOrchestrator:
    """Get automation orchestrator instance."""
    return AutomationOrchestrator(db)
