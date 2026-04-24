"""
Automation Router - API Endpoints
Prompt 19/20 + 19.5 - Enterprise-Grade Automation Engine

REST API for automation management:
- Rule CRUD
- Event processing (with hardened orchestrator)
- Execution logs & traces
- Approval workflows
- Statistics & debugging
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)


# ==================== PYDANTIC MODELS ====================

class RuleConditionInput(BaseModel):
    field: str
    operator: str = "=="
    value: Any
    source: str = "entity"


class RuleConditionDSLInput(BaseModel):
    """New DSL-based condition format."""
    logic: str = "AND"
    conditions: List[Dict[str, Any]] = []


class RuleActionInput(BaseModel):
    action_type: str
    params: Dict[str, Any] = {}
    target_user_type: str = "owner"
    target_user_id: Optional[str] = None
    target_role: Optional[str] = None
    delay_minutes: int = 0
    compensation: Optional[str] = None  # NEW: Compensation action


class CreateRuleInput(BaseModel):
    name: str
    description: str = ""
    domain: str
    trigger_event: str
    conditions: List[RuleConditionInput] = []
    conditions_dsl: Optional[RuleConditionDSLInput] = None  # NEW: DSL format
    actions: List[RuleActionInput] = []
    priority: int = 50
    is_enabled: bool = False
    is_test_mode: bool = False
    requires_approval: bool = False
    max_executions_per_hour: int = 100
    max_executions_per_day: int = 1000
    cooldown_minutes: int = 60
    stop_on_match: bool = False  # NEW: Stop subsequent rules
    exclusive_group: Optional[str] = None  # NEW: Rule group


class UpdateRuleInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    conditions: Optional[List[RuleConditionInput]] = None
    conditions_dsl: Optional[RuleConditionDSLInput] = None
    actions: Optional[List[RuleActionInput]] = None
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None
    is_test_mode: Optional[bool] = None
    requires_approval: Optional[bool] = None
    max_executions_per_hour: Optional[int] = None
    max_executions_per_day: Optional[int] = None
    cooldown_minutes: Optional[int] = None
    stop_on_match: Optional[bool] = None
    exclusive_group: Optional[str] = None
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None
    is_test_mode: Optional[bool] = None
    requires_approval: Optional[bool] = None
    max_executions_per_hour: Optional[int] = None
    max_executions_per_day: Optional[int] = None
    cooldown_minutes: Optional[int] = None


class ProcessEventInput(BaseModel):
    event_type: str
    entity_type: str
    entity_id: str
    payload: Dict[str, Any] = {}
    correlation_id: Optional[str] = None  # NEW: For tracing
    user_id: Optional[str] = None  # NEW: Actor info
    user_role: Optional[str] = None


class ProcessEventV2Input(BaseModel):
    """NEW: Full event contract input."""
    event_type: str
    entity_type: str
    entity_id: str
    payload: Dict[str, Any] = {}
    actor_type: str = "user"
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    correlation_id: Optional[str] = None
    idempotency_key: Optional[str] = None


class ApprovalInput(BaseModel):
    execution_id: str
    reason: str = ""


# ==================== ROUTER FACTORY ====================

def create_automation_router(get_db, get_current_user) -> APIRouter:
    """Create automation router with dependencies."""
    
    router = APIRouter(prefix="/automation", tags=["Automation"])
    
    # Import orchestrators
    from services.automation.orchestrator import get_automation_orchestrator
    from services.automation.hardened_orchestrator import get_hardened_orchestrator
    from services.automation.default_rules import seed_default_rules
    from services.automation.business_events import EventRegistry, EventType
    from services.automation.rule_engine import ActionType, ActionClassification
    from services.automation.event_contract import create_event, ActorType
    
    # ==================== RULE MANAGEMENT ====================
    
    @router.get("/rules")
    async def get_rules(
        enabled_only: bool = Query(False),
        domain: Optional[str] = Query(None),
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get all automation rules."""
        orchestrator = get_automation_orchestrator(db)
        
        if domain:
            rules = await orchestrator.rule_engine.get_rules_by_domain(domain, enabled_only)
        else:
            rules = await orchestrator.rule_engine.get_all_rules(enabled_only)
        
        return {
            "rules": [r.to_dict() for r in rules],
            "count": len(rules)
        }
    
    @router.get("/rules/{rule_id}")
    async def get_rule(
        rule_id: str,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get a single rule by ID."""
        orchestrator = get_automation_orchestrator(db)
        rule = await orchestrator.rule_engine.get_rule(rule_id)
        
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return rule.to_dict()
    
    @router.post("/rules")
    async def create_rule(
        rule_input: CreateRuleInput,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Create a new automation rule."""
        # Check permissions
        if current_user.get("role") not in ["admin", "ceo", "director", "bod"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        
        # Convert Pydantic models to dicts
        rule_data = {
            "rule_id": "",  # Will be generated
            "name": rule_input.name,
            "description": rule_input.description,
            "domain": rule_input.domain,
            "trigger_event": rule_input.trigger_event,
            "conditions": [c.dict() for c in rule_input.conditions],
            "actions": [a.dict() for a in rule_input.actions],
            "priority": rule_input.priority,
            "is_enabled": rule_input.is_enabled,
            "is_test_mode": rule_input.is_test_mode,
            "requires_approval": rule_input.requires_approval,
            "max_executions_per_hour": rule_input.max_executions_per_hour,
            "max_executions_per_day": rule_input.max_executions_per_day,
            "cooldown_minutes": rule_input.cooldown_minutes,
        }
        
        rule = await orchestrator.create_rule(rule_data, current_user.get("id", "system"))
        
        return {"success": True, "rule": rule.to_dict()}
    
    @router.put("/rules/{rule_id}")
    async def update_rule(
        rule_id: str,
        updates: UpdateRuleInput,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Update an automation rule."""
        if current_user.get("role") not in ["admin", "ceo", "director", "bod"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        
        # Convert to dict, removing None values
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        # Convert nested models if present
        if "conditions" in update_data:
            update_data["conditions"] = [c.dict() if hasattr(c, 'dict') else c for c in update_data["conditions"]]
        if "actions" in update_data:
            update_data["actions"] = [a.dict() if hasattr(a, 'dict') else a for a in update_data["actions"]]
        
        success = await orchestrator.rule_engine.update_rule(
            rule_id, update_data, current_user.get("id", "system")
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return {"success": True, "rule_id": rule_id}
    
    @router.post("/rules/{rule_id}/toggle")
    async def toggle_rule(
        rule_id: str,
        enabled: bool = Body(...),
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Enable or disable a rule."""
        if current_user.get("role") not in ["admin", "ceo", "director", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        success = await orchestrator.toggle_rule(rule_id, enabled, current_user.get("id", "system"))
        
        if not success:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return {"success": True, "rule_id": rule_id, "is_enabled": enabled}
    
    @router.post("/rules/{rule_id}/test-mode")
    async def set_test_mode(
        rule_id: str,
        test_mode: bool = Body(...),
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Set test mode for a rule."""
        orchestrator = get_automation_orchestrator(db)
        success = await orchestrator.set_test_mode(rule_id, test_mode, current_user.get("id", "system"))
        
        if not success:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return {"success": True, "rule_id": rule_id, "is_test_mode": test_mode}
    
    @router.delete("/rules/{rule_id}")
    async def delete_rule(
        rule_id: str,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Delete an automation rule."""
        if current_user.get("role") not in ["admin", "ceo"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        success = await orchestrator.rule_engine.delete_rule(rule_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return {"success": True, "deleted": rule_id}
    
    # ==================== EVENT PROCESSING ====================
    
    @router.post("/events/process")
    async def process_event(
        event_input: ProcessEventInput,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """
        Process a business event (legacy v1).
        Useful for testing or manual triggers.
        """
        orchestrator = get_automation_orchestrator(db)
        
        result = await orchestrator.process_event(
            event_type=event_input.event_type,
            entity_type=event_input.entity_type,
            entity_id=event_input.entity_id,
            payload=event_input.payload,
            actor_type="user",
            actor_id=current_user.get("id"),
            correlation_id=event_input.correlation_id
        )
        
        return result
    
    @router.post("/events/process/v2")
    async def process_event_v2(
        event_input: ProcessEventV2Input,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """
        Process event with hardened orchestrator (v2).
        
        Features:
        - Full execution trace
        - Compensation/rollback
        - Priority-based execution
        - Rule conflict resolution
        - Full idempotency
        """
        orchestrator = get_hardened_orchestrator(db)
        
        # Create event using contract
        event = create_event(
            event_type=event_input.event_type,
            entity_type=event_input.entity_type,
            entity_id=event_input.entity_id,
            payload=event_input.payload,
            user_id=event_input.user_id or current_user.get("id"),
            user_role=event_input.user_role or current_user.get("role"),
            correlation_id=event_input.correlation_id
        )
        
        # Set idempotency key if provided
        if event_input.idempotency_key:
            event.metadata.idempotency_key = event_input.idempotency_key
        
        result = await orchestrator.process_event(event)
        
        return result
    
    @router.post("/scheduled-checks")
    async def run_scheduled_checks(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """
        Manually trigger scheduled checks.
        Normally runs automatically every 5-10 minutes.
        """
        if current_user.get("role") not in ["admin", "ceo", "director", "bod"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        result = await orchestrator.run_scheduled_checks()
        
        return result
    
    # ==================== EXECUTION LOGS ====================
    
    @router.get("/executions")
    async def get_executions(
        rule_id: Optional[str] = Query(None),
        entity_type: Optional[str] = Query(None),
        entity_id: Optional[str] = Query(None),
        status: Optional[str] = Query(None),
        limit: int = Query(50, le=200),
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get execution logs."""
        orchestrator = get_automation_orchestrator(db)
        
        logs = await orchestrator.execution_engine.get_execution_logs(
            rule_id=rule_id,
            entity_type=entity_type,
            entity_id=entity_id,
            status=status,
            limit=limit
        )
        
        return {
            "executions": [log.to_dict() for log in logs],
            "count": len(logs)
        }
    
    @router.get("/executions/failed")
    async def get_failed_executions(
        limit: int = Query(50),
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get failed executions for review/retry."""
        orchestrator = get_automation_orchestrator(db)
        logs = await orchestrator.execution_engine.get_failed_executions(limit)
        
        return {
            "failed_executions": [log.to_dict() for log in logs],
            "count": len(logs)
        }
    
    # ==================== APPROVALS ====================
    
    @router.get("/approvals/pending")
    async def get_pending_approvals(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get pending approval requests."""
        if current_user.get("role") not in ["admin", "ceo", "director", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        approvals = await orchestrator.get_pending_approvals()
        
        return {
            "pending_approvals": approvals,
            "count": len(approvals)
        }
    
    @router.post("/approvals/approve")
    async def approve_execution(
        approval: ApprovalInput,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Approve a pending execution."""
        if current_user.get("role") not in ["admin", "ceo", "director", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        success = await orchestrator.approve_execution(
            approval.execution_id, current_user.get("id")
        )
        
        return {"success": success, "execution_id": approval.execution_id}
    
    @router.post("/approvals/reject")
    async def reject_execution(
        approval: ApprovalInput,
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Reject a pending execution."""
        if current_user.get("role") not in ["admin", "ceo", "director", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orchestrator = get_automation_orchestrator(db)
        success = await orchestrator.reject_execution(
            approval.execution_id, current_user.get("id"), approval.reason
        )
        
        return {"success": success, "execution_id": approval.execution_id}
    
    # ==================== EVENTS & ACTIONS REFERENCE ====================
    
    @router.get("/reference/events")
    async def get_event_types():
        """Get all available event types."""
        events = EventRegistry.get_all_event_types()
        
        # Group by domain
        by_domain = {}
        for event in events:
            domain = EventRegistry.get_domain(event).value
            if domain not in by_domain:
                by_domain[domain] = []
            by_domain[domain].append(event)
        
        return {
            "event_types": events,
            "by_domain": by_domain,
            "total": len(events)
        }
    
    @router.get("/reference/actions")
    async def get_action_types():
        """Get all available action types."""
        actions = [a.value for a in ActionType]
        
        # With classifications
        from services.automation.rule_engine import ACTION_CLASSIFICATIONS
        classifications = {
            action_type: classification.value
            for action_type, classification in ACTION_CLASSIFICATIONS.items()
        }
        
        return {
            "action_types": actions,
            "classifications": classifications,
            "total": len(actions)
        }
    
    # ==================== STATISTICS ====================
    
    @router.get("/stats")
    async def get_automation_stats(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get automation statistics."""
        orchestrator = get_automation_orchestrator(db)
        stats = await orchestrator.get_automation_stats()
        
        return stats
    
    @router.get("/events/recent")
    async def get_recent_events(
        limit: int = Query(50, le=200),
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get recent business events."""
        orchestrator = get_automation_orchestrator(db)
        events = await orchestrator.get_recent_events(limit)
        
        return {
            "events": events,
            "count": len(events)
        }
    
    # ==================== SEED DEFAULT RULES ====================
    
    @router.post("/seed-defaults")
    async def seed_defaults(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Seed default automation rules."""
        if current_user.get("role") not in ["admin", "ceo"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        count = await seed_default_rules(db)
        
        return {"success": True, "rules_seeded": count}
    
    # ==================== PHASE 2: INTEGRATION ====================
    
    @router.post("/seed-phase2-rules")
    async def seed_phase2_rules_endpoint(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Seed Phase 2 integration rules (snake_case events)."""
        if current_user.get("role") not in ["admin", "ceo", "bod"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        from services.automation.phase2_rules import seed_phase2_rules
        result = await seed_phase2_rules(db)
        
        return {
            "success": True,
            "message": "Phase 2 rules seeded",
            **result
        }
    
    @router.post("/scheduled-checks/run")
    async def run_scheduled_checks_endpoint(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """
        Run scheduled event checks.
        
        Checks for:
        - Lead SLA breach (no contact in 24h)
        - Deal stale (no activity in 7 days)
        - Booking expiring (24h before expiry)
        - Booking expired
        """
        from services.automation.scheduled_event_checks import run_scheduled_checks
        from services.automation.event_emitter import EventEmitter
        from services.automation.hardened_orchestrator import get_hardened_orchestrator
        
        # Initialize EventEmitter with orchestrator
        orchestrator = get_hardened_orchestrator(db)
        EventEmitter.initialize(db, orchestrator)
        
        result = await run_scheduled_checks(db)
        
        return {
            "success": True,
            "message": "Scheduled checks completed",
            **result
        }
    
    @router.get("/phase2/status")
    async def get_phase2_status(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get Phase 2 integration status."""
        
        # Count rules by event type (snake_case)
        phase2_events = [
            "lead_created", "lead_assigned", "lead_sla_breach",
            "deal_stage_changed", "deal_stale_detected", "high_value_deal_detected",
            "booking_created", "booking_expiring", "booking_expired"
        ]
        
        rules_count = {}
        for event in phase2_events:
            count = await db.automation_rules.count_documents({
                "trigger_event": event,
                "is_enabled": True
            })
            rules_count[event] = count
        
        # Count recent events
        from datetime import timedelta
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        
        events_count = {}
        for event in phase2_events:
            count = await db.automation_events.count_documents({
                "event_type": event,
                "timestamp": {"$gte": yesterday}
            })
            events_count[event] = count
        
        return {
            "phase2_events": phase2_events,
            "enabled_rules": rules_count,
            "events_last_24h": events_count,
            "total_enabled_rules": sum(rules_count.values()),
            "total_events_24h": sum(events_count.values())
        }
    
    # ==================== PHASE 3: REVENUE-DRIVEN AUTOMATION ====================
    
    @router.post("/seed-phase3-rules")
    async def seed_phase3_rules_endpoint(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """
        Seed Phase 3 Revenue-Driven automation rules.
        
        This will:
        - Disable overlapping Phase 2 rules
        - Create 13 new revenue-driven rules with escalation
        """
        if current_user.get("role") not in ["admin", "ceo", "bod"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        from services.automation.phase3_rules import seed_phase3_rules
        result = await seed_phase3_rules(db)
        
        return {
            "success": True,
            "message": "Phase 3 Revenue-Driven rules seeded",
            **result
        }
    
    @router.post("/escalation-checks/run")
    async def run_escalation_checks_endpoint(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """
        Run escalation checks.
        
        Checks for:
        - Overdue tasks → escalate to next level
        - Hot leads not contacted → escalate/reassign
        - High value deals needing attention
        """
        from services.automation.escalation_engine import run_escalation_checks
        
        result = await run_escalation_checks(db)
        
        return {
            "success": True,
            "message": "Escalation checks completed",
            **result
        }
    
    @router.get("/phase3/status")
    async def get_phase3_status(
        db=Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ):
        """Get Phase 3 Revenue-Driven automation status."""
        
        from datetime import timedelta
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        
        # Phase 3 rule prefixes
        phase3_rules = await db.automation_rules.find(
            {"rule_id": {"$regex": "^rule_lead_hot|^rule_lead_warm|^rule_lead_standard|^rule_lead_sla|^rule_deal_vip|^rule_deal_high|^rule_deal_stale|^rule_booking|^rule_deal_won|^rule_deal_lost"}}
        ).to_list(50)
        
        enabled_rules = [r for r in phase3_rules if r.get("is_enabled")]
        
        # Hot lead stats
        hot_leads_count = await db.leads.count_documents({"score": {"$gt": 80}, "status": "new"})
        
        # High value deal stats
        high_value_deals = await db.deals.count_documents({
            "deal_value": {"$gt": 1_000_000_000},
            "status": {"$nin": ["won", "lost"]}
        })
        
        # Escalation stats (last 24h)
        escalation_notifs = await db.notifications.count_documents({
            "type": {"$regex": "escalation|hot_lead|critical"},
            "created_at": {"$gte": yesterday}
        })
        
        # Task stats
        overdue_tasks = await db.tasks.count_documents({
            "status": {"$in": ["pending", "in_progress"]},
            "due_at": {"$lt": datetime.now(timezone.utc).isoformat()}
        })
        
        return {
            "phase": "Phase 3 - Revenue-Driven Automation",
            "total_rules": len(phase3_rules),
            "enabled_rules": len(enabled_rules),
            "rules_by_domain": {
                "lead": len([r for r in enabled_rules if r.get("domain") == "lead"]),
                "deal": len([r for r in enabled_rules if r.get("domain") == "deal"]),
                "booking": len([r for r in enabled_rules if r.get("domain") == "booking"])
            },
            "current_status": {
                "hot_leads_pending": hot_leads_count,
                "high_value_deals_active": high_value_deals,
                "overdue_tasks": overdue_tasks,
                "escalations_24h": escalation_notifs
            },
            "features_enabled": [
                "Multi-step lead intake flow (hot/warm/standard)",
                "Revenue-based priority calculation",
                "Automatic escalation chains",
                "Hot lead reassignment",
                "VIP deal handling",
                "Stale deal recovery flow",
                "Booking expiry management"
            ]
        }
    
    return router
