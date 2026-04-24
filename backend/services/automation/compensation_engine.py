"""
Compensation/Rollback Engine
Prompt 19.5 - Hardening Automation Engine

Provides rollback capability for failed automation:
- Each action has optional compensation action
- Automatic rollback on failure
- Compensation tracking in trace
"""

from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timezone
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


# ==================== COMPENSATION REGISTRY ====================

@dataclass
class CompensationAction:
    """Definition of a compensation (rollback) action."""
    action_type: str
    compensation_type: str
    handler: Optional[Callable] = None


# Default compensation mappings
DEFAULT_COMPENSATIONS: Dict[str, str] = {
    # Task actions
    "create_task": "delete_task",
    "create_followup": "delete_task",
    "create_reminder": "delete_task",
    "complete_task": "reopen_task",
    
    # Assignment actions
    "assign_owner": "unassign_owner",
    "reassign_owner": "restore_previous_owner",
    
    # Notification actions - generally no compensation needed
    "send_notification": None,
    "send_email": None,  # Can't unsend
    "send_sms": None,    # Can't unsend
    
    # Escalation actions
    "escalate_to_manager": "close_escalation",
    "escalate_to_executive": "close_escalation",
    "add_to_review_queue": "remove_from_review_queue",
    
    # Status actions
    "update_status": "restore_previous_status",
    "update_stage": "restore_previous_stage",
    "add_tag": "remove_tag",
    "update_flag": "restore_previous_flag",
    
    # Record actions
    "create_activity": "delete_activity",
    "add_note": "delete_note",
    
    # Audit - no compensation (audit is permanent)
    "create_audit_entry": None,
}


# ==================== COMPENSATION ENGINE ====================

class CompensationEngine:
    """
    Handles rollback/compensation for failed automations.
    
    Features:
    - Action-level compensation definitions
    - Automatic rollback on failure
    - Compensation tracking
    - Safe rollback (won't fail if entity changed)
    """
    
    def __init__(self, db):
        self.db = db
        self._compensations = DEFAULT_COMPENSATIONS.copy()
        self._executed_actions: List[Dict[str, Any]] = []
    
    def register_compensation(self, action_type: str, compensation_type: str):
        """Register a compensation action for an action type."""
        self._compensations[action_type] = compensation_type
    
    def get_compensation(self, action_type: str) -> Optional[str]:
        """Get compensation action type for an action."""
        return self._compensations.get(action_type)
    
    def has_compensation(self, action_type: str) -> bool:
        """Check if action has compensation."""
        return self._compensations.get(action_type) is not None
    
    def track_execution(
        self,
        action_type: str,
        entity_type: str,
        entity_id: str,
        result: Dict[str, Any],
        original_state: Dict[str, Any] = None
    ):
        """
        Track an executed action for potential rollback.
        
        Args:
            action_type: Type of action executed
            entity_type: Entity type affected
            entity_id: Entity ID affected
            result: Execution result (contains created IDs, etc.)
            original_state: State before action (for restore)
        """
        self._executed_actions.append({
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "result": result,
            "original_state": original_state,
            "executed_at": datetime.now(timezone.utc).isoformat()
        })
    
    async def rollback_all(self) -> List[Dict[str, Any]]:
        """
        Rollback all tracked actions in reverse order.
        
        Returns list of compensation results.
        """
        results = []
        
        # Reverse order - last executed first
        for action in reversed(self._executed_actions):
            compensation_type = self.get_compensation(action["action_type"])
            
            if not compensation_type:
                logger.info(f"No compensation for {action['action_type']}, skipping")
                results.append({
                    "action_type": action["action_type"],
                    "status": "skipped",
                    "reason": "no compensation defined"
                })
                continue
            
            try:
                result = await self._execute_compensation(
                    compensation_type,
                    action["entity_type"],
                    action["entity_id"],
                    action["result"],
                    action["original_state"]
                )
                results.append({
                    "action_type": action["action_type"],
                    "compensation_type": compensation_type,
                    "status": "success",
                    "result": result
                })
                logger.info(f"Compensated {action['action_type']} with {compensation_type}")
                
            except Exception as e:
                logger.error(f"Compensation failed for {action['action_type']}: {e}")
                results.append({
                    "action_type": action["action_type"],
                    "compensation_type": compensation_type,
                    "status": "failed",
                    "error": str(e)
                })
        
        # Clear tracked actions
        self._executed_actions.clear()
        
        return results
    
    async def _execute_compensation(
        self,
        compensation_type: str,
        entity_type: str,
        entity_id: str,
        action_result: Dict[str, Any],
        original_state: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Execute a specific compensation action."""
        
        # Delete task
        if compensation_type == "delete_task":
            task_id = action_result.get("task_id")
            if task_id:
                await self.db.tasks.delete_one({"id": task_id})
                return {"deleted_task": task_id}
        
        # Unassign owner
        elif compensation_type == "unassign_owner":
            await self.db[entity_type].update_one(
                {"id": entity_id},
                {"$unset": {
                    "assigned_to": "",
                    "owner_id": "",
                    "assigned_at": "",
                    "assigned_by": ""
                }}
            )
            return {"unassigned": entity_id}
        
        # Restore previous owner
        elif compensation_type == "restore_previous_owner":
            if original_state:
                prev_owner = (
                    original_state.get("assigned_to") or 
                    original_state.get("owner_id")
                )
                if prev_owner:
                    await self.db[entity_type].update_one(
                        {"id": entity_id},
                        {"$set": {"assigned_to": prev_owner}}
                    )
                    return {"restored_owner": prev_owner}
            return {"status": "no_previous_owner"}
        
        # Close escalation
        elif compensation_type == "close_escalation":
            escalation_id = action_result.get("escalation_id")
            if escalation_id:
                await self.db.escalations.update_one(
                    {"id": escalation_id},
                    {"$set": {
                        "status": "cancelled",
                        "cancelled_at": datetime.now(timezone.utc).isoformat(),
                        "cancel_reason": "automation_rollback"
                    }}
                )
                return {"closed_escalation": escalation_id}
        
        # Remove from review queue
        elif compensation_type == "remove_from_review_queue":
            queue_id = action_result.get("queue_id")
            if queue_id:
                await self.db.review_queue.delete_one({"id": queue_id})
                return {"removed_queue_item": queue_id}
        
        # Restore previous status
        elif compensation_type == "restore_previous_status":
            if original_state and "status" in original_state:
                await self.db[entity_type].update_one(
                    {"id": entity_id},
                    {"$set": {"status": original_state["status"]}}
                )
                return {"restored_status": original_state["status"]}
        
        # Restore previous stage
        elif compensation_type == "restore_previous_stage":
            if original_state and "stage" in original_state:
                await self.db[entity_type].update_one(
                    {"id": entity_id},
                    {"$set": {"stage": original_state["stage"]}}
                )
                return {"restored_stage": original_state["stage"]}
        
        # Remove tag
        elif compensation_type == "remove_tag":
            tag = action_result.get("tag")
            if tag:
                await self.db[entity_type].update_one(
                    {"id": entity_id},
                    {"$pull": {"tags": tag}}
                )
                return {"removed_tag": tag}
        
        # Restore previous flag
        elif compensation_type == "restore_previous_flag":
            flag = action_result.get("flag")
            if original_state and flag:
                original_value = original_state.get("flags", {}).get(flag)
                await self.db[entity_type].update_one(
                    {"id": entity_id},
                    {"$set": {f"flags.{flag}": original_value}}
                )
                return {"restored_flag": flag, "value": original_value}
        
        # Delete activity
        elif compensation_type == "delete_activity":
            activity_id = action_result.get("activity_id")
            if activity_id:
                await self.db.activities.delete_one({"id": activity_id})
                return {"deleted_activity": activity_id}
        
        # Delete note
        elif compensation_type == "delete_note":
            note_id = action_result.get("note_id")
            if note_id:
                await self.db.notes.delete_one({"id": note_id})
                return {"deleted_note": note_id}
        
        # Reopen task
        elif compensation_type == "reopen_task":
            task_id = action_result.get("task_id") or entity_id
            await self.db.tasks.update_one(
                {"id": task_id},
                {"$set": {
                    "status": "pending",
                    "completed_at": None,
                    "reopened_at": datetime.now(timezone.utc).isoformat(),
                    "reopen_reason": "automation_rollback"
                }}
            )
            return {"reopened_task": task_id}
        
        return {"status": "unknown_compensation", "type": compensation_type}
    
    def clear(self):
        """Clear tracked actions without rollback."""
        self._executed_actions.clear()
    
    def get_tracked_count(self) -> int:
        """Get number of tracked actions."""
        return len(self._executed_actions)


# ==================== RULE CONFLICT RESOLUTION ====================

@dataclass
class RuleConflictConfig:
    """Configuration for rule conflict resolution."""
    priority: int = 50              # 0-100, higher runs first
    stop_on_match: bool = False     # If true, stops other rules
    override: bool = False          # If true, can override other rules
    exclusive_group: str = None     # Only one rule per group can run


class RuleConflictResolver:
    """
    Resolves conflicts between multiple rules matching same event.
    
    Rules:
    1. Higher priority rules run first
    2. stop_on_match prevents subsequent rules
    3. exclusive_group allows only one rule per group
    4. override allows breaking stop_on_match from lower priority
    """
    
    def __init__(self):
        self._executed_groups: set = set()
    
    def sort_rules_by_priority(self, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort rules by priority (highest first)."""
        return sorted(rules, key=lambda r: r.get("priority", 50), reverse=True)
    
    def should_execute(
        self,
        rule: Dict[str, Any],
        previous_rule: Dict[str, Any] = None
    ) -> tuple[bool, str]:
        """
        Check if rule should execute given previous rule.
        
        Returns:
            (should_execute: bool, reason: str)
        """
        # Check exclusive group
        group = rule.get("exclusive_group")
        if group and group in self._executed_groups:
            return False, f"exclusive_group '{group}' already executed"
        
        # Check stop_on_match from previous rule
        if previous_rule and previous_rule.get("stop_on_match"):
            # Check if current rule can override
            if rule.get("override"):
                return True, "override stop_on_match"
            return False, "stopped by previous rule"
        
        return True, "ok"
    
    def mark_executed(self, rule: Dict[str, Any]):
        """Mark rule as executed."""
        group = rule.get("exclusive_group")
        if group:
            self._executed_groups.add(group)
    
    def reset(self):
        """Reset state for new event processing."""
        self._executed_groups.clear()
    
    def filter_executable_rules(
        self,
        rules: List[Dict[str, Any]]
    ) -> List[tuple[Dict[str, Any], str]]:
        """
        Filter and sort rules that should execute.
        
        Returns list of (rule, reason) tuples.
        """
        self.reset()
        sorted_rules = self.sort_rules_by_priority(rules)
        
        executable = []
        previous_rule = None
        
        for rule in sorted_rules:
            should_exec, reason = self.should_execute(rule, previous_rule)
            
            if should_exec:
                executable.append((rule, reason))
                self.mark_executed(rule)
                previous_rule = rule
            else:
                logger.debug(f"Rule {rule.get('rule_id')} skipped: {reason}")
        
        return executable
