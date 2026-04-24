"""
Execution Engine - Action Executor & Logger
Prompt 19/20 - Automation Engine

Executes actions and maintains full audit trail.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from enum import Enum
from dataclasses import dataclass, field
import uuid
import logging

from .rule_engine import RuleAction, ActionType, ActionClassification, ACTION_CLASSIFICATIONS
from .guardrails import GuardrailEngine

logger = logging.getLogger(__name__)


# ==================== EXECUTION STATUS ====================

class ExecutionStatus(str, Enum):
    """Status of execution"""
    PENDING = "pending"           # Waiting to execute
    PENDING_APPROVAL = "pending_approval"  # Needs human approval
    EXECUTING = "executing"       # Currently executing
    SUCCESS = "success"           # Completed successfully
    FAILED = "failed"             # Failed with error
    SKIPPED = "skipped"           # Skipped (guardrail blocked)
    CANCELLED = "cancelled"       # Cancelled by user
    RETRYING = "retrying"         # Retry in progress


# ==================== EXECUTION LOG ====================

@dataclass
class ExecutionLog:
    """
    Execution Log - Audit trail for automation.
    
    Records everything about an execution for:
    - Debugging
    - Compliance
    - Learning/optimization
    """
    
    # Identity
    execution_id: str
    
    # Rule & Event
    rule_id: str
    rule_name: str
    event_id: str
    event_type: str
    
    # Entity
    entity_type: str
    entity_id: str
    
    # Action
    action_type: str
    action_params: Dict[str, Any] = field(default_factory=dict)
    action_classification: str = "safe"
    
    # Result
    status: str = "pending"
    result: Dict[str, Any] = field(default_factory=dict)
    error_message: str = ""
    
    # Timing
    created_at: str = ""
    started_at: str = ""
    completed_at: str = ""
    duration_ms: int = 0
    
    # Retry
    retry_count: int = 0
    max_retries: int = 3
    next_retry_at: str = ""
    
    # Correlation
    correlation_id: str = ""
    
    # Guardrail info
    guardrail_checks: Dict[str, Any] = field(default_factory=dict)
    
    # Actor
    triggered_by: str = "system"  # system, user, scheduler
    approved_by: str = ""
    
    # Test mode
    is_test_mode: bool = False
    
    def __post_init__(self):
        if not self.execution_id:
            self.execution_id = f"exec_{uuid.uuid4().hex[:12]}"
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "execution_id": self.execution_id,
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "event_id": self.event_id,
            "event_type": self.event_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action_type": self.action_type,
            "action_params": self.action_params,
            "action_classification": self.action_classification,
            "status": self.status,
            "result": self.result,
            "error_message": self.error_message,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_ms": self.duration_ms,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "next_retry_at": self.next_retry_at,
            "correlation_id": self.correlation_id,
            "guardrail_checks": self.guardrail_checks,
            "triggered_by": self.triggered_by,
            "approved_by": self.approved_by,
            "is_test_mode": self.is_test_mode,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecutionLog":
        return cls(
            execution_id=data.get("execution_id", ""),
            rule_id=data.get("rule_id", ""),
            rule_name=data.get("rule_name", ""),
            event_id=data.get("event_id", ""),
            event_type=data.get("event_type", ""),
            entity_type=data.get("entity_type", ""),
            entity_id=data.get("entity_id", ""),
            action_type=data.get("action_type", ""),
            action_params=data.get("action_params", {}),
            action_classification=data.get("action_classification", "safe"),
            status=data.get("status", "pending"),
            result=data.get("result", {}),
            error_message=data.get("error_message", ""),
            created_at=data.get("created_at", ""),
            started_at=data.get("started_at", ""),
            completed_at=data.get("completed_at", ""),
            duration_ms=data.get("duration_ms", 0),
            retry_count=data.get("retry_count", 0),
            max_retries=data.get("max_retries", 3),
            next_retry_at=data.get("next_retry_at", ""),
            correlation_id=data.get("correlation_id", ""),
            guardrail_checks=data.get("guardrail_checks", {}),
            triggered_by=data.get("triggered_by", "system"),
            approved_by=data.get("approved_by", ""),
            is_test_mode=data.get("is_test_mode", False),
        )


# ==================== EXECUTION ENGINE ====================

class ExecutionEngine:
    """
    Execution Engine - Executes automation actions.
    
    Responsibilities:
    - Execute actions with full logging
    - Handle retries and failures
    - Respect guardrails
    - Support test mode
    """
    
    def __init__(self, db):
        self.db = db
        self._logs_collection = "automation_execution_logs"
        self._pending_approvals = "automation_pending_approvals"
        self.guardrails = GuardrailEngine(db)
    
    # ==================== MAIN EXECUTION ====================
    
    async def execute_action(
        self,
        rule_id: str,
        rule_name: str,
        event_id: str,
        event_type: str,
        entity_type: str,
        entity_id: str,
        action: RuleAction,
        entity_data: Dict[str, Any] = None,
        correlation_id: str = None,
        triggered_by: str = "system",
        is_test_mode: bool = False,
    ) -> ExecutionLog:
        """
        Execute a single action.
        
        This is the main entry point for action execution.
        """
        execution_id = f"exec_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        # Create execution log
        log = ExecutionLog(
            execution_id=execution_id,
            rule_id=rule_id,
            rule_name=rule_name,
            event_id=event_id,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action_type=action.action_type,
            action_params=action.params,
            action_classification=action.classification.value,
            correlation_id=correlation_id or "",
            triggered_by=triggered_by,
            is_test_mode=is_test_mode,
            created_at=now.isoformat(),
        )
        
        # Check guardrails
        guardrail_result = await self.guardrails.can_execute(
            rule_id=rule_id,
            entity_type=entity_type,
            entity_id=entity_id,
            correlation_id=correlation_id,
        )
        log.guardrail_checks = guardrail_result
        
        if not guardrail_result["allowed"]:
            log.status = ExecutionStatus.SKIPPED.value
            log.error_message = guardrail_result["reason"]
            await self._save_log(log)
            return log
        
        # Check if approval required for critical actions
        if action.classification == ActionClassification.CRITICAL and not is_test_mode:
            log.status = ExecutionStatus.PENDING_APPROVAL.value
            await self._save_log(log)
            await self._create_approval_request(log)
            return log
        
        # Execute the action
        log.started_at = datetime.now(timezone.utc).isoformat()
        log.status = ExecutionStatus.EXECUTING.value
        await self._save_log(log)
        
        try:
            if is_test_mode:
                # Test mode - simulate execution
                result = await self._simulate_action(action, entity_type, entity_id, entity_data)
            else:
                # Real execution
                result = await self._execute_action_impl(action, entity_type, entity_id, entity_data)
            
            log.result = result
            log.status = ExecutionStatus.SUCCESS.value
            
            # Record in guardrails
            await self.guardrails.record_execution(
                rule_id, entity_type, entity_id, execution_id, correlation_id
            )
            
        except Exception as e:
            log.status = ExecutionStatus.FAILED.value
            log.error_message = str(e)
            log.result = {"error": str(e)}
            logger.error(f"Action execution failed: {e}")
        
        # Complete log
        completed_at = datetime.now(timezone.utc)
        log.completed_at = completed_at.isoformat()
        log.duration_ms = int((completed_at - datetime.fromisoformat(log.started_at)).total_seconds() * 1000)
        
        await self._save_log(log)
        
        return log
    
    async def _execute_action_impl(
        self,
        action: RuleAction,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute action implementation.
        
        This is where the actual work happens.
        """
        action_type = action.action_type
        params = action.params
        
        # Fetch entity if needed
        if not entity_data:
            entity_data = await self.db[entity_type].find_one(
                {"id": entity_id}, {"_id": 0}
            ) or {}
        
        # Resolve target user
        target_user_id = await self._resolve_target_user(action, entity_data)
        
        result = {"action_type": action_type}
        
        # ===== Task Actions =====
        if action_type == ActionType.CREATE_TASK.value:
            result = await self._action_create_task(entity_type, entity_id, entity_data, params, target_user_id)
        
        elif action_type == ActionType.CREATE_FOLLOWUP.value:
            result = await self._action_create_followup(entity_type, entity_id, entity_data, params, target_user_id)
        
        elif action_type == ActionType.CREATE_REMINDER.value:
            result = await self._action_create_reminder(entity_type, entity_id, entity_data, params, target_user_id)
        
        # ===== Notification Actions =====
        elif action_type == ActionType.SEND_NOTIFICATION.value:
            result = await self._action_send_notification(entity_type, entity_id, entity_data, params, target_user_id)
        
        # ===== Escalation Actions =====
        elif action_type == ActionType.ESCALATE_TO_MANAGER.value:
            result = await self._action_escalate(entity_type, entity_id, entity_data, params, "manager")
        
        elif action_type == ActionType.ADD_TO_REVIEW_QUEUE.value:
            result = await self._action_add_to_queue(entity_type, entity_id, entity_data, params)
        
        # ===== Assignment Actions =====
        elif action_type == ActionType.ASSIGN_OWNER.value:
            result = await self._action_assign_owner(entity_type, entity_id, entity_data, params)
        
        elif action_type == ActionType.REASSIGN_OWNER.value:
            result = await self._action_reassign_owner(entity_type, entity_id, entity_data, params)
        
        # ===== Status Actions =====
        elif action_type == ActionType.ADD_TAG.value:
            result = await self._action_add_tag(entity_type, entity_id, params)
        
        elif action_type == ActionType.UPDATE_FLAG.value:
            result = await self._action_update_flag(entity_type, entity_id, params)
        
        # ===== Record Actions =====
        elif action_type == ActionType.CREATE_ACTIVITY.value:
            result = await self._action_create_activity(entity_type, entity_id, entity_data, params, target_user_id)
        
        elif action_type == ActionType.ADD_NOTE.value:
            result = await self._action_add_note(entity_type, entity_id, params, target_user_id)
        
        # ===== Audit Actions =====
        elif action_type == ActionType.CREATE_AUDIT_ENTRY.value:
            result = await self._action_create_audit(entity_type, entity_id, params)
        
        else:
            result = {"status": "unsupported", "action_type": action_type}
        
        return result
    
    async def _simulate_action(
        self,
        action: RuleAction,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Simulate action execution for test mode."""
        return {
            "status": "simulated",
            "action_type": action.action_type,
            "would_affect": {
                "entity_type": entity_type,
                "entity_id": entity_id,
            },
            "params": action.params
        }
    
    # ==================== ACTION IMPLEMENTATIONS ====================
    
    async def _action_create_task(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any],
        target_user_id: str
    ) -> Dict[str, Any]:
        """Create a task."""
        task_id = f"task_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        due_hours = params.get("due_hours", 24)
        
        task = {
            "id": task_id,
            "title": params.get("title", f"Auto task for {entity_type}"),
            "description": params.get("description", ""),
            "type": params.get("type", "follow_up"),
            "status": "pending",
            "priority": params.get("priority", "medium"),
            "assigned_to": target_user_id,
            "created_by": "automation",
            "created_at": now.isoformat(),
            "due_at": (now + timedelta(hours=due_hours)).isoformat(),
            "related_entity": entity_type,
            "related_entity_id": entity_id,
            "source": "automation",
        }
        
        await self.db.tasks.insert_one(task)
        
        return {"status": "created", "task_id": task_id, "assigned_to": target_user_id}
    
    async def _action_create_followup(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any],
        target_user_id: str
    ) -> Dict[str, Any]:
        """Create a follow-up task."""
        params["type"] = "follow_up"
        params["title"] = params.get("title", f"Follow up: {entity_data.get('full_name', entity_id[:8])}")
        return await self._action_create_task(entity_type, entity_id, entity_data, params, target_user_id)
    
    async def _action_create_reminder(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any],
        target_user_id: str
    ) -> Dict[str, Any]:
        """Create a reminder."""
        params["type"] = "reminder"
        params["due_hours"] = params.get("due_hours", 4)  # Default 4 hours for reminders
        return await self._action_create_task(entity_type, entity_id, entity_data, params, target_user_id)
    
    async def _action_send_notification(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any],
        target_user_id: str
    ) -> Dict[str, Any]:
        """Send notification."""
        # Check throttle
        can_send = await self.guardrails.can_send_notification(
            target_user_id, params.get("type", "automation"), entity_id
        )
        
        if not can_send:
            return {"status": "throttled", "reason": "Notification throttled"}
        
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        notification = {
            "id": notification_id,
            "user_id": target_user_id,
            "title": params.get("title", "Automation Alert"),
            "message": params.get("message", ""),
            "type": params.get("type", "automation"),
            "priority": params.get("priority", "medium"),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "is_read": False,
            "created_at": now.isoformat(),
            "source": "automation",
        }
        
        await self.db.notifications.insert_one(notification)
        
        # Record in throttler
        await self.guardrails.record_notification(
            target_user_id, params.get("type", "automation"), entity_id
        )
        
        return {"status": "sent", "notification_id": notification_id}
    
    async def _action_escalate(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any],
        level: str
    ) -> Dict[str, Any]:
        """Escalate to manager/executive."""
        escalation_id = f"esc_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        # Find managers
        role_filter = ["manager", "bod"] if level == "manager" else ["ceo", "director"]
        managers = await self.db.users.find(
            {"role": {"$in": role_filter}, "is_active": True},
            {"_id": 0, "id": 1, "full_name": 1}
        ).to_list(10)
        
        if not managers:
            return {"status": "failed", "reason": "No managers found"}
        
        # Create escalation
        escalation = {
            "id": escalation_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "reason": params.get("reason", "Auto-escalated by automation"),
            "level": level,
            "status": "open",
            "escalated_at": now.isoformat(),
            "escalated_by": "automation",
            "notified_users": [m["id"] for m in managers],
        }
        
        await self.db.escalations.insert_one(escalation)
        
        # Notify managers
        for manager in managers:
            await self._action_send_notification(
                entity_type, entity_id, entity_data,
                {
                    "title": f"Escalation: {entity_type}",
                    "message": params.get("reason", "Requires attention"),
                    "type": "escalation",
                    "priority": "high"
                },
                manager["id"]
            )
        
        return {"status": "escalated", "escalation_id": escalation_id, "notified": len(managers)}
    
    async def _action_add_to_queue(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add to review queue."""
        queue_id = f"queue_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        queue_item = {
            "id": queue_id,
            "queue_type": params.get("queue_type", "review"),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "priority": params.get("priority", "medium"),
            "reason": params.get("reason", "Auto-queued"),
            "status": "pending",
            "created_at": now.isoformat(),
            "source": "automation",
        }
        
        await self.db.review_queue.insert_one(queue_item)
        
        return {"status": "queued", "queue_id": queue_id}
    
    async def _action_assign_owner(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assign owner to entity."""
        owner_id = params.get("owner_id")
        
        if not owner_id:
            # Auto-assign based on workload
            owner_id = await self._find_available_owner(entity_type, entity_data)
        
        if not owner_id:
            return {"status": "failed", "reason": "No available owner"}
        
        owner_field = "assigned_to" if entity_type == "leads" else "owner_id"
        
        await self.db[entity_type].update_one(
            {"id": entity_id},
            {"$set": {
                owner_field: owner_id,
                "assigned_at": datetime.now(timezone.utc).isoformat(),
                "assigned_by": "automation"
            }}
        )
        
        return {"status": "assigned", "owner_id": owner_id}
    
    async def _action_reassign_owner(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Reassign owner."""
        return await self._action_assign_owner(entity_type, entity_id, entity_data, params)
    
    async def _action_add_tag(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add tag to entity."""
        tag = params.get("tag", "automation")
        
        await self.db[entity_type].update_one(
            {"id": entity_id},
            {"$addToSet": {"tags": tag}}
        )
        
        return {"status": "tagged", "tag": tag}
    
    async def _action_update_flag(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update flag on entity."""
        flag = params.get("flag", "flagged")
        value = params.get("value", True)
        
        await self.db[entity_type].update_one(
            {"id": entity_id},
            {"$set": {f"flags.{flag}": value}}
        )
        
        return {"status": "flagged", "flag": flag, "value": value}
    
    async def _action_create_activity(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        params: Dict[str, Any],
        target_user_id: str
    ) -> Dict[str, Any]:
        """Create activity record."""
        activity_id = f"act_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        activity = {
            "id": activity_id,
            "type": params.get("type", "automation"),
            "subject": params.get("subject", "Automation activity"),
            "description": params.get("description", ""),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user_id": target_user_id,
            "created_at": now.isoformat(),
            "source": "automation",
        }
        
        await self.db.activities.insert_one(activity)
        
        return {"status": "created", "activity_id": activity_id}
    
    async def _action_add_note(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict[str, Any],
        target_user_id: str
    ) -> Dict[str, Any]:
        """Add note to entity."""
        note_id = f"note_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        note = {
            "id": note_id,
            "content": params.get("content", "Automation note"),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "created_by": "automation",
            "created_at": now.isoformat(),
        }
        
        await self.db.notes.insert_one(note)
        
        return {"status": "created", "note_id": note_id}
    
    async def _action_create_audit(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create audit entry."""
        audit_id = f"audit_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        
        audit = {
            "id": audit_id,
            "action": params.get("action", "automation_executed"),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": params.get("details", {}),
            "actor": "automation",
            "created_at": now.isoformat(),
        }
        
        await self.db.audit_logs.insert_one(audit)
        
        return {"status": "logged", "audit_id": audit_id}
    
    # ==================== HELPER METHODS ====================
    
    async def _resolve_target_user(
        self,
        action: RuleAction,
        entity_data: Dict[str, Any]
    ) -> str:
        """Resolve target user for action."""
        if action.target_user_type == "specific" and action.target_user_id:
            return action.target_user_id
        
        if action.target_user_type == "role" and action.target_role:
            user = await self.db.users.find_one(
                {"role": action.target_role, "is_active": True},
                {"_id": 0, "id": 1}
            )
            return user.get("id") if user else ""
        
        # Default: owner of entity
        return (
            entity_data.get("assigned_to") or
            entity_data.get("owner_id") or
            entity_data.get("sales_id") or
            ""
        )
    
    async def _find_available_owner(
        self,
        entity_type: str,
        entity_data: Dict[str, Any]
    ) -> Optional[str]:
        """Find available owner with lowest workload."""
        # Get active sales users
        sales_users = await self.db.users.find(
            {"role": {"$in": ["sales", "senior_sales"]}, "is_active": True},
            {"_id": 0, "id": 1}
        ).to_list(100)
        
        if not sales_users:
            return None
        
        # Find one with least leads
        workloads = []
        for user in sales_users:
            count = await self.db.leads.count_documents({
                "assigned_to": user["id"],
                "stage": {"$nin": ["converted", "lost"]}
            })
            workloads.append((user["id"], count))
        
        workloads.sort(key=lambda x: x[1])
        
        return workloads[0][0] if workloads else None
    
    async def _save_log(self, log: ExecutionLog):
        """Save execution log."""
        await self.db[self._logs_collection].update_one(
            {"execution_id": log.execution_id},
            {"$set": log.to_dict()},
            upsert=True
        )
    
    async def _create_approval_request(self, log: ExecutionLog):
        """Create approval request for critical actions."""
        await self.db[self._pending_approvals].insert_one({
            "id": f"appr_{uuid.uuid4().hex[:12]}",
            "execution_id": log.execution_id,
            "rule_id": log.rule_id,
            "rule_name": log.rule_name,
            "action_type": log.action_type,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "status": "pending",
            "created_at": log.created_at,
        })
    
    # ==================== QUERY METHODS ====================
    
    async def get_execution_logs(
        self,
        rule_id: str = None,
        entity_type: str = None,
        entity_id: str = None,
        status: str = None,
        limit: int = 50
    ) -> List[ExecutionLog]:
        """Get execution logs with filters."""
        query = {}
        if rule_id:
            query["rule_id"] = rule_id
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        if status:
            query["status"] = status
        
        logs_data = await self.db[self._logs_collection].find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return [ExecutionLog.from_dict(log) for log in logs_data]
    
    async def get_failed_executions(self, limit: int = 50) -> List[ExecutionLog]:
        """Get failed executions for retry."""
        return await self.get_execution_logs(status=ExecutionStatus.FAILED.value, limit=limit)
    
    async def get_pending_approvals(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get pending approval requests."""
        return await self.db[self._pending_approvals].find(
            {"status": "pending"}, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
    
    async def approve_execution(self, execution_id: str, approver_id: str) -> bool:
        """Approve a pending execution."""
        # Update approval
        await self.db[self._pending_approvals].update_one(
            {"execution_id": execution_id},
            {"$set": {
                "status": "approved",
                "approved_by": approver_id,
                "approved_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update execution log
        await self.db[self._logs_collection].update_one(
            {"execution_id": execution_id},
            {"$set": {
                "status": ExecutionStatus.PENDING.value,
                "approved_by": approver_id
            }}
        )
        
        return True
    
    async def reject_execution(self, execution_id: str, rejector_id: str, reason: str = "") -> bool:
        """Reject a pending execution."""
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db[self._pending_approvals].update_one(
            {"execution_id": execution_id},
            {"$set": {
                "status": "rejected",
                "rejected_by": rejector_id,
                "rejected_at": now,
                "rejection_reason": reason
            }}
        )
        
        await self.db[self._logs_collection].update_one(
            {"execution_id": execution_id},
            {"$set": {
                "status": ExecutionStatus.CANCELLED.value,
                "error_message": f"Rejected: {reason}"
            }}
        )
        
        return True
