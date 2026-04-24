"""
Rule Engine - Canonical Automation Rules
Prompt 19/20 - Automation Engine

Rules define: When EVENT happens, IF CONDITIONS met, DO ACTIONS.
"""

from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timezone, timedelta
from enum import Enum
from dataclasses import dataclass, field
import uuid
import logging
import re

logger = logging.getLogger(__name__)


# ==================== ACTION TYPES ====================

class ActionType(str, Enum):
    """
    Canonical Action Types
    
    These are ALL actions that automation can perform.
    """
    # Task actions
    CREATE_TASK = "create_task"
    CREATE_FOLLOWUP = "create_followup"
    CREATE_REMINDER = "create_reminder"
    COMPLETE_TASK = "complete_task"
    
    # Assignment actions
    ASSIGN_OWNER = "assign_owner"
    REASSIGN_OWNER = "reassign_owner"
    ASSIGN_REVIEWER = "assign_reviewer"
    
    # Notification actions
    SEND_NOTIFICATION = "send_notification"
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    
    # Escalation actions
    ESCALATE_TO_MANAGER = "escalate_to_manager"
    ESCALATE_TO_EXECUTIVE = "escalate_to_executive"
    ADD_TO_REVIEW_QUEUE = "add_to_review_queue"
    
    # Status actions
    UPDATE_STATUS = "update_status"
    UPDATE_STAGE = "update_stage"
    ADD_TAG = "add_tag"
    UPDATE_FLAG = "update_flag"
    UPDATE_PRIORITY = "update_priority"
    
    # Record actions
    CREATE_ACTIVITY = "create_activity"
    ADD_NOTE = "add_note"
    LOG_CALL = "log_call"
    
    # Marketing actions
    TRIGGER_CAMPAIGN = "trigger_campaign"
    ADD_TO_SEGMENT = "add_to_segment"
    
    # AI actions
    TRIGGER_AI_RECOMMENDATION = "trigger_ai_recommendation"
    CREATE_AI_SUGGESTED_TASK = "create_ai_suggested_task"
    
    # Audit actions
    CREATE_AUDIT_ENTRY = "create_audit_entry"


class ActionClassification(str, Enum):
    """
    Action safety classification for Human-in-the-Loop
    """
    SAFE = "safe"           # Can run automatically
    SENSITIVE = "sensitive"  # Needs review, creates records
    CRITICAL = "critical"    # Needs approval, changes important data


# Action Classification Map
ACTION_CLASSIFICATIONS: Dict[str, ActionClassification] = {
    # Safe actions - can run automatically
    ActionType.CREATE_TASK.value: ActionClassification.SAFE,
    ActionType.CREATE_FOLLOWUP.value: ActionClassification.SAFE,
    ActionType.CREATE_REMINDER.value: ActionClassification.SAFE,
    ActionType.SEND_NOTIFICATION.value: ActionClassification.SAFE,
    ActionType.ADD_TAG.value: ActionClassification.SAFE,
    ActionType.CREATE_ACTIVITY.value: ActionClassification.SAFE,
    ActionType.ADD_NOTE.value: ActionClassification.SAFE,
    ActionType.CREATE_AUDIT_ENTRY.value: ActionClassification.SAFE,
    ActionType.TRIGGER_AI_RECOMMENDATION.value: ActionClassification.SAFE,
    
    # Sensitive actions - creates important records
    ActionType.ASSIGN_OWNER.value: ActionClassification.SENSITIVE,
    ActionType.ASSIGN_REVIEWER.value: ActionClassification.SENSITIVE,
    ActionType.SEND_EMAIL.value: ActionClassification.SENSITIVE,
    ActionType.SEND_SMS.value: ActionClassification.SENSITIVE,
    ActionType.ESCALATE_TO_MANAGER.value: ActionClassification.SENSITIVE,
    ActionType.ADD_TO_REVIEW_QUEUE.value: ActionClassification.SENSITIVE,
    ActionType.LOG_CALL.value: ActionClassification.SENSITIVE,
    ActionType.TRIGGER_CAMPAIGN.value: ActionClassification.SENSITIVE,
    ActionType.ADD_TO_SEGMENT.value: ActionClassification.SENSITIVE,
    ActionType.CREATE_AI_SUGGESTED_TASK.value: ActionClassification.SENSITIVE,
    ActionType.UPDATE_PRIORITY.value: ActionClassification.SENSITIVE,
    ActionType.UPDATE_FLAG.value: ActionClassification.SENSITIVE,
    
    # Critical actions - needs approval
    ActionType.REASSIGN_OWNER.value: ActionClassification.CRITICAL,
    ActionType.UPDATE_STATUS.value: ActionClassification.CRITICAL,
    ActionType.UPDATE_STAGE.value: ActionClassification.CRITICAL,
    ActionType.ESCALATE_TO_EXECUTIVE.value: ActionClassification.CRITICAL,
    ActionType.COMPLETE_TASK.value: ActionClassification.CRITICAL,
}


# ==================== CONDITION OPERATORS ====================

class ConditionOperator(str, Enum):
    """Condition operators for rule evaluation"""
    EQUALS = "eq"
    NOT_EQUALS = "neq"
    GREATER_THAN = "gt"
    GREATER_THAN_OR_EQUAL = "gte"
    LESS_THAN = "lt"
    LESS_THAN_OR_EQUAL = "lte"
    IN = "in"
    NOT_IN = "not_in"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"
    MATCHES = "matches"  # Regex
    BETWEEN = "between"
    DAYS_AGO = "days_ago"
    HOURS_AGO = "hours_ago"


# ==================== RULE CONDITION ====================

@dataclass
class RuleCondition:
    """
    Single condition in a rule.
    
    Example:
        RuleCondition(
            field="stage",
            operator="eq",
            value="new"
        )
    """
    field: str
    operator: str  # ConditionOperator value
    value: Any
    
    # Optional: for nested/computed fields
    source: str = "entity"  # entity, payload, computed
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "field": self.field,
            "operator": self.operator,
            "value": self.value,
            "source": self.source,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RuleCondition":
        return cls(
            field=data.get("field", ""),
            operator=data.get("operator", "eq"),
            value=data.get("value"),
            source=data.get("source", "entity"),
        )


# ==================== RULE ACTION ====================

@dataclass
class RuleAction:
    """
    Action to perform when rule matches.
    
    Example:
        RuleAction(
            action_type="create_task",
            params={"title": "Follow up with lead", "due_hours": 24}
        )
    """
    action_type: str  # ActionType value
    params: Dict[str, Any] = field(default_factory=dict)
    
    # Targeting
    target_user_type: str = "owner"  # owner, manager, specific, role
    target_user_id: Optional[str] = None
    target_role: Optional[str] = None
    
    # Timing
    delay_minutes: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "action_type": self.action_type,
            "params": self.params,
            "target_user_type": self.target_user_type,
            "target_user_id": self.target_user_id,
            "target_role": self.target_role,
            "delay_minutes": self.delay_minutes,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RuleAction":
        return cls(
            action_type=data.get("action_type", ""),
            params=data.get("params", {}),
            target_user_type=data.get("target_user_type", "owner"),
            target_user_id=data.get("target_user_id"),
            target_role=data.get("target_role"),
            delay_minutes=data.get("delay_minutes", 0),
        )
    
    @property
    def classification(self) -> ActionClassification:
        """Get safety classification for this action."""
        return ACTION_CLASSIFICATIONS.get(
            self.action_type, 
            ActionClassification.SENSITIVE
        )


# ==================== AUTOMATION RULE ====================

@dataclass
class AutomationRule:
    """
    Canonical Automation Rule
    
    Defines: When EVENT happens, IF CONDITIONS met, DO ACTIONS.
    """
    
    # Identity
    rule_id: str
    name: str
    description: str = ""
    
    # Domain & Trigger
    domain: str = ""  # lead, deal, booking, etc.
    trigger_event: str = ""  # EventType value
    
    # Conditions (AND logic)
    conditions: List[RuleCondition] = field(default_factory=list)
    
    # Actions (executed in order)
    actions: List[RuleAction] = field(default_factory=list)
    
    # Priority & Business Value
    priority: int = 50  # 0-100, higher = more important
    business_value_weight: float = 1.0  # For prioritization
    
    # Governance
    is_enabled: bool = True
    is_test_mode: bool = False  # Dry-run mode
    requires_approval: bool = False
    
    # Limits (Guardrails)
    max_executions_per_hour: int = 100
    max_executions_per_day: int = 1000
    cooldown_minutes: int = 0  # Min time between executions for same entity
    
    # Metadata
    created_by: str = ""
    created_at: str = ""
    updated_by: str = ""
    updated_at: str = ""
    
    # Stats
    execution_count: int = 0
    last_executed_at: str = ""
    success_count: int = 0
    failure_count: int = 0
    
    def __post_init__(self):
        if not self.rule_id:
            self.rule_id = f"rule_{uuid.uuid4().hex[:12]}"
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()
        if not self.updated_at:
            self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "description": self.description,
            "domain": self.domain,
            "trigger_event": self.trigger_event,
            "conditions": [c.to_dict() for c in self.conditions],
            "actions": [a.to_dict() for a in self.actions],
            "priority": self.priority,
            "business_value_weight": self.business_value_weight,
            "is_enabled": self.is_enabled,
            "is_test_mode": self.is_test_mode,
            "requires_approval": self.requires_approval,
            "max_executions_per_hour": self.max_executions_per_hour,
            "max_executions_per_day": self.max_executions_per_day,
            "cooldown_minutes": self.cooldown_minutes,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_by": self.updated_by,
            "updated_at": self.updated_at,
            "execution_count": self.execution_count,
            "last_executed_at": self.last_executed_at,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AutomationRule":
        conditions = [RuleCondition.from_dict(c) for c in data.get("conditions", [])]
        actions = [RuleAction.from_dict(a) for a in data.get("actions", [])]
        
        return cls(
            rule_id=data.get("rule_id", ""),
            name=data.get("name", ""),
            description=data.get("description", ""),
            domain=data.get("domain", ""),
            trigger_event=data.get("trigger_event", ""),
            conditions=conditions,
            actions=actions,
            priority=data.get("priority", 50),
            business_value_weight=data.get("business_value_weight", 1.0),
            is_enabled=data.get("is_enabled", True),
            is_test_mode=data.get("is_test_mode", False),
            requires_approval=data.get("requires_approval", False),
            max_executions_per_hour=data.get("max_executions_per_hour", 100),
            max_executions_per_day=data.get("max_executions_per_day", 1000),
            cooldown_minutes=data.get("cooldown_minutes", 0),
            created_by=data.get("created_by", ""),
            created_at=data.get("created_at", ""),
            updated_by=data.get("updated_by", ""),
            updated_at=data.get("updated_at", ""),
            execution_count=data.get("execution_count", 0),
            last_executed_at=data.get("last_executed_at", ""),
            success_count=data.get("success_count", 0),
            failure_count=data.get("failure_count", 0),
        )
    
    @property
    def has_critical_actions(self) -> bool:
        """Check if rule has any critical actions."""
        return any(
            a.classification == ActionClassification.CRITICAL
            for a in self.actions
        )


# ==================== RULE ENGINE ====================

class RuleEngine:
    """
    Rule Engine - Evaluates and executes automation rules.
    
    Responsibilities:
    - Load rules from database
    - Evaluate conditions against entities
    - Return matching rules for an event
    """
    
    def __init__(self, db):
        self.db = db
        self._rules_collection = "automation_rules"
    
    # ==================== RULE MANAGEMENT ====================
    
    async def create_rule(self, rule: AutomationRule, user_id: str = "system") -> AutomationRule:
        """Create a new automation rule."""
        rule.created_by = user_id
        rule.created_at = datetime.now(timezone.utc).isoformat()
        rule.updated_at = rule.created_at
        
        await self.db[self._rules_collection].insert_one(rule.to_dict())
        logger.info(f"Rule created: {rule.rule_id} - {rule.name}")
        
        return rule
    
    async def update_rule(self, rule_id: str, updates: Dict[str, Any], user_id: str = "system") -> bool:
        """Update an existing rule."""
        updates["updated_by"] = user_id
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await self.db[self._rules_collection].update_one(
            {"rule_id": rule_id},
            {"$set": updates}
        )
        
        return result.modified_count > 0
    
    async def toggle_rule(self, rule_id: str, enabled: bool, user_id: str = "system") -> bool:
        """Enable or disable a rule."""
        return await self.update_rule(rule_id, {"is_enabled": enabled}, user_id)
    
    async def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule."""
        result = await self.db[self._rules_collection].delete_one({"rule_id": rule_id})
        return result.deleted_count > 0
    
    async def get_rule(self, rule_id: str) -> Optional[AutomationRule]:
        """Get a single rule by ID."""
        data = await self.db[self._rules_collection].find_one(
            {"rule_id": rule_id}, {"_id": 0}
        )
        return AutomationRule.from_dict(data) if data else None
    
    async def get_all_rules(self, enabled_only: bool = False) -> List[AutomationRule]:
        """Get all rules."""
        query = {"is_enabled": True} if enabled_only else {}
        rules_data = await self.db[self._rules_collection].find(
            query, {"_id": 0}
        ).to_list(500)
        
        return [AutomationRule.from_dict(r) for r in rules_data]
    
    async def get_rules_by_domain(self, domain: str, enabled_only: bool = True) -> List[AutomationRule]:
        """Get rules for a specific domain."""
        query = {"domain": domain}
        if enabled_only:
            query["is_enabled"] = True
        
        rules_data = await self.db[self._rules_collection].find(
            query, {"_id": 0}
        ).to_list(200)
        
        return [AutomationRule.from_dict(r) for r in rules_data]
    
    async def get_rules_for_event(self, event_type: str, enabled_only: bool = True) -> List[AutomationRule]:
        """Get rules triggered by a specific event."""
        query = {"trigger_event": event_type}
        if enabled_only:
            query["is_enabled"] = True
        
        rules_data = await self.db[self._rules_collection].find(
            query, {"_id": 0}
        ).sort("priority", -1).to_list(100)
        
        return [AutomationRule.from_dict(r) for r in rules_data]
    
    # ==================== CONDITION EVALUATION ====================
    
    def evaluate_condition(
        self,
        condition: RuleCondition,
        entity: Dict[str, Any],
        payload: Dict[str, Any] = None
    ) -> bool:
        """
        Evaluate a single condition against an entity.
        
        Returns True if condition is met.
        """
        payload = payload or {}
        
        # Get field value based on source
        if condition.source == "payload":
            field_value = payload.get(condition.field)
        elif condition.source == "computed":
            field_value = self._compute_field(condition.field, entity, payload)
        else:
            field_value = entity.get(condition.field)
        
        op = condition.operator
        expected = condition.value
        
        try:
            # Evaluate based on operator
            if op == ConditionOperator.EQUALS.value:
                return field_value == expected
            
            elif op == ConditionOperator.NOT_EQUALS.value:
                return field_value != expected
            
            elif op == ConditionOperator.GREATER_THAN.value:
                return float(field_value or 0) > float(expected)
            
            elif op == ConditionOperator.GREATER_THAN_OR_EQUAL.value:
                return float(field_value or 0) >= float(expected)
            
            elif op == ConditionOperator.LESS_THAN.value:
                return float(field_value or 0) < float(expected)
            
            elif op == ConditionOperator.LESS_THAN_OR_EQUAL.value:
                return float(field_value or 0) <= float(expected)
            
            elif op == ConditionOperator.IN.value:
                return field_value in (expected if isinstance(expected, list) else [expected])
            
            elif op == ConditionOperator.NOT_IN.value:
                return field_value not in (expected if isinstance(expected, list) else [expected])
            
            elif op == ConditionOperator.CONTAINS.value:
                return str(expected) in str(field_value or "")
            
            elif op == ConditionOperator.NOT_CONTAINS.value:
                return str(expected) not in str(field_value or "")
            
            elif op == ConditionOperator.IS_NULL.value:
                return field_value is None or field_value == ""
            
            elif op == ConditionOperator.IS_NOT_NULL.value:
                return field_value is not None and field_value != ""
            
            elif op == ConditionOperator.MATCHES.value:
                return bool(re.match(str(expected), str(field_value or "")))
            
            elif op == ConditionOperator.BETWEEN.value:
                if isinstance(expected, list) and len(expected) == 2:
                    return float(expected[0]) <= float(field_value or 0) <= float(expected[1])
                return False
            
            elif op == ConditionOperator.DAYS_AGO.value:
                return self._check_days_ago(field_value, expected)
            
            elif op == ConditionOperator.HOURS_AGO.value:
                return self._check_hours_ago(field_value, expected)
            
            else:
                logger.warning(f"Unknown operator: {op}")
                return False
                
        except Exception as e:
            logger.error(f"Condition evaluation error: {e}")
            return False
    
    def evaluate_rule(
        self,
        rule: AutomationRule,
        entity: Dict[str, Any],
        payload: Dict[str, Any] = None
    ) -> bool:
        """
        Evaluate all conditions of a rule (AND logic).
        
        Returns True if ALL conditions are met.
        """
        if not rule.conditions:
            return True  # No conditions = always match
        
        for condition in rule.conditions:
            if not self.evaluate_condition(condition, entity, payload):
                return False
        
        return True
    
    async def get_matching_rules(
        self,
        event_type: str,
        entity: Dict[str, Any],
        payload: Dict[str, Any] = None
    ) -> List[AutomationRule]:
        """
        Get all rules that match an event and entity.
        
        Returns rules sorted by priority (highest first).
        """
        # Get rules for this event
        rules = await self.get_rules_for_event(event_type, enabled_only=True)
        
        # Filter by conditions
        matching = []
        for rule in rules:
            if self.evaluate_rule(rule, entity, payload):
                matching.append(rule)
        
        # Sort by priority
        matching.sort(key=lambda r: r.priority, reverse=True)
        
        return matching
    
    # ==================== HELPER METHODS ====================
    
    def _compute_field(
        self,
        field: str,
        entity: Dict[str, Any],
        payload: Dict[str, Any]
    ) -> Any:
        """Compute dynamic field values."""
        now = datetime.now(timezone.utc)
        
        if field == "days_since_created":
            created = self._parse_date(entity.get("created_at"))
            return (now - created).days if created else 0
        
        elif field == "days_since_updated":
            updated = self._parse_date(entity.get("updated_at"))
            return (now - updated).days if updated else 0
        
        elif field == "hours_since_created":
            created = self._parse_date(entity.get("created_at"))
            return int((now - created).total_seconds() / 3600) if created else 0
        
        elif field == "has_owner":
            return bool(entity.get("assigned_to") or entity.get("owner_id") or entity.get("sales_id"))
        
        return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse ISO date string."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            return None
    
    def _check_days_ago(self, field_value: Any, days: int) -> bool:
        """Check if date field is more than X days ago."""
        date = self._parse_date(str(field_value) if field_value else "")
        if not date:
            return False
        
        threshold = datetime.now(timezone.utc) - timedelta(days=days)
        return date < threshold
    
    def _check_hours_ago(self, field_value: Any, hours: int) -> bool:
        """Check if date field is more than X hours ago."""
        date = self._parse_date(str(field_value) if field_value else "")
        if not date:
            return False
        
        threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
        return date < threshold
    
    # ==================== STATS ====================
    
    async def update_rule_stats(
        self,
        rule_id: str,
        success: bool = True
    ):
        """Update rule execution statistics."""
        now = datetime.now(timezone.utc).isoformat()
        
        update = {
            "$inc": {
                "execution_count": 1,
                "success_count" if success else "failure_count": 1
            },
            "$set": {
                "last_executed_at": now
            }
        }
        
        await self.db[self._rules_collection].update_one(
            {"rule_id": rule_id},
            update
        )
