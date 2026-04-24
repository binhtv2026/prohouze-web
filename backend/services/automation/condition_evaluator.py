"""
Condition DSL - JSON-based Condition Evaluator
Prompt 19.5 - Hardening Automation Engine

NO HARDCODED IF/ELSE - All conditions are config-driven JSON.

Supports:
- AND/OR logic
- Nested conditions
- Multiple operators
- Computed fields
- Array operations
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone, timedelta
import re
import logging

logger = logging.getLogger(__name__)


# ==================== OPERATORS ====================

OPERATORS = {
    # Comparison
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    ">": lambda a, b: float(a or 0) > float(b),
    ">=": lambda a, b: float(a or 0) >= float(b),
    "<": lambda a, b: float(a or 0) < float(b),
    "<=": lambda a, b: float(a or 0) <= float(b),
    
    # String
    "contains": lambda a, b: str(b).lower() in str(a or "").lower(),
    "not_contains": lambda a, b: str(b).lower() not in str(a or "").lower(),
    "starts_with": lambda a, b: str(a or "").lower().startswith(str(b).lower()),
    "ends_with": lambda a, b: str(a or "").lower().endswith(str(b).lower()),
    "matches": lambda a, b: bool(re.match(str(b), str(a or ""))),
    
    # Array/Set
    "in": lambda a, b: a in (b if isinstance(b, (list, tuple, set)) else [b]),
    "not_in": lambda a, b: a not in (b if isinstance(b, (list, tuple, set)) else [b]),
    "has": lambda a, b: b in (a if isinstance(a, (list, tuple, set)) else []),
    "has_any": lambda a, b: bool(set(a or []) & set(b if isinstance(b, list) else [b])),
    "has_all": lambda a, b: set(b if isinstance(b, list) else [b]).issubset(set(a or [])),
    
    # Null checks
    "is_null": lambda a, b: a is None or a == "",
    "is_not_null": lambda a, b: a is not None and a != "",
    "is_empty": lambda a, b: not a or (isinstance(a, (list, dict)) and len(a) == 0),
    "is_not_empty": lambda a, b: a and (not isinstance(a, (list, dict)) or len(a) > 0),
    
    # Type checks
    "is_true": lambda a, b: a is True or a == "true" or a == 1,
    "is_false": lambda a, b: a is False or a == "false" or a == 0,
    
    # Range
    "between": lambda a, b: float(b[0]) <= float(a or 0) <= float(b[1]) if isinstance(b, list) and len(b) == 2 else False,
    
    # Time-based
    "days_ago": lambda a, b: _days_ago(a, b, ">="),
    "days_ago_lt": lambda a, b: _days_ago(a, b, "<"),
    "hours_ago": lambda a, b: _hours_ago(a, b, ">="),
    "hours_ago_lt": lambda a, b: _hours_ago(a, b, "<"),
}


def _parse_datetime(value: Any) -> Optional[datetime]:
    """Parse datetime from various formats."""
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except:
        return None


def _days_ago(field_value: Any, days: int, op: str) -> bool:
    """Check if date field is X days ago."""
    dt = _parse_datetime(field_value)
    if not dt:
        return False
    
    threshold = datetime.now(timezone.utc) - timedelta(days=days)
    
    if op == ">=":
        return dt <= threshold
    elif op == "<":
        return dt > threshold
    return False


def _hours_ago(field_value: Any, hours: int, op: str) -> bool:
    """Check if date field is X hours ago."""
    dt = _parse_datetime(field_value)
    if not dt:
        return False
    
    threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    if op == ">=":
        return dt <= threshold
    elif op == "<":
        return dt > threshold
    return False


# ==================== FIELD EXTRACTION ====================

def extract_field(context: Dict[str, Any], field_path: str) -> Any:
    """
    Extract field value from context using dot notation.
    
    Examples:
        extract_field({"deal": {"value": 1000}}, "deal.value") -> 1000
        extract_field({"tags": ["hot", "vip"]}, "tags") -> ["hot", "vip"]
    """
    parts = field_path.split(".")
    value = context
    
    for part in parts:
        if isinstance(value, dict):
            value = value.get(part)
        elif isinstance(value, list) and part.isdigit():
            idx = int(part)
            value = value[idx] if idx < len(value) else None
        else:
            return None
        
        if value is None:
            return None
    
    return value


def compute_field(context: Dict[str, Any], field_name: str) -> Any:
    """
    Compute derived fields from context.
    
    Computed fields:
    - days_since_created
    - days_since_updated
    - hours_since_created
    - has_owner
    - is_high_value
    - age_in_days
    """
    now = datetime.now(timezone.utc)
    entity = context.get("entity", context)
    
    if field_name == "days_since_created":
        created = _parse_datetime(entity.get("created_at"))
        return (now - created).days if created else 999
    
    elif field_name == "days_since_updated":
        updated = _parse_datetime(entity.get("updated_at"))
        return (now - updated).days if updated else 999
    
    elif field_name == "hours_since_created":
        created = _parse_datetime(entity.get("created_at"))
        return int((now - created).total_seconds() / 3600) if created else 9999
    
    elif field_name == "hours_since_updated":
        updated = _parse_datetime(entity.get("updated_at"))
        return int((now - updated).total_seconds() / 3600) if updated else 9999
    
    elif field_name == "has_owner":
        return bool(
            entity.get("assigned_to") or 
            entity.get("owner_id") or 
            entity.get("sales_id")
        )
    
    elif field_name == "is_high_value":
        value = entity.get("value") or entity.get("estimated_value") or 0
        return value >= 2_000_000_000  # 2 tỷ VND
    
    elif field_name == "age_in_days":
        created = _parse_datetime(entity.get("created_at"))
        return (now - created).days if created else 0
    
    elif field_name == "is_stale":
        updated = _parse_datetime(entity.get("updated_at"))
        return (now - updated).days > 7 if updated else True
    
    return None


# ==================== CONDITION EVALUATION ====================

class ConditionEvaluator:
    """
    Evaluates JSON-based conditions against a context.
    
    Supports:
    - AND/OR logic
    - Nested conditions
    - Multiple operators
    - Computed fields
    """
    
    def __init__(self, context: Dict[str, Any]):
        """
        Initialize with context.
        
        Context should contain:
        - entity: The main entity data
        - payload: Event payload
        - event: Event metadata
        """
        self.context = context
    
    def evaluate_single(self, condition: Dict[str, Any]) -> bool:
        """
        Evaluate a single condition.
        
        Format:
        {
            "field": "deal.value",
            "op": ">",
            "value": 1000000000
        }
        
        Or computed field:
        {
            "field": "$computed.days_since_updated",
            "op": ">",
            "value": 7
        }
        """
        field_path = condition.get("field", "")
        op = condition.get("op", "==")
        expected_value = condition.get("value")
        
        # Get field value
        if field_path.startswith("$computed."):
            computed_name = field_path.replace("$computed.", "")
            field_value = compute_field(self.context, computed_name)
        else:
            field_value = extract_field(self.context, field_path)
        
        # Get operator function
        op_func = OPERATORS.get(op)
        if not op_func:
            logger.warning(f"Unknown operator: {op}")
            return False
        
        try:
            result = op_func(field_value, expected_value)
            return result
        except Exception as e:
            logger.error(f"Condition evaluation error: {e}")
            return False
    
    def evaluate_group(self, group: Dict[str, Any]) -> bool:
        """
        Evaluate a condition group with AND/OR logic.
        
        Format:
        {
            "logic": "AND",  // or "OR"
            "conditions": [
                {"field": "deal.value", "op": ">", "value": 1000000000},
                {"field": "$computed.days_since_updated", "op": ">", "value": 7}
            ]
        }
        
        Nested:
        {
            "logic": "OR",
            "conditions": [
                {
                    "logic": "AND",
                    "conditions": [...]
                },
                {"field": "status", "op": "==", "value": "urgent"}
            ]
        }
        """
        logic = group.get("logic", "AND").upper()
        conditions = group.get("conditions", [])
        
        if not conditions:
            return True
        
        results = []
        for condition in conditions:
            if "logic" in condition:
                # Nested group
                result = self.evaluate_group(condition)
            else:
                # Single condition
                result = self.evaluate_single(condition)
            
            results.append(result)
            
            # Short-circuit evaluation
            if logic == "AND" and not result:
                return False
            elif logic == "OR" and result:
                return True
        
        if logic == "AND":
            return all(results)
        else:  # OR
            return any(results)
    
    def evaluate(self, rule_conditions: Union[Dict, List]) -> bool:
        """
        Main entry point for condition evaluation.
        
        Accepts:
        - Single condition: {"field": "...", "op": "...", "value": "..."}
        - Condition group: {"logic": "AND", "conditions": [...]}
        - List of conditions (implicit AND): [{"field": "..."}, ...]
        """
        if not rule_conditions:
            return True
        
        if isinstance(rule_conditions, list):
            # List = implicit AND
            return self.evaluate_group({
                "logic": "AND",
                "conditions": rule_conditions
            })
        
        if isinstance(rule_conditions, dict):
            if "logic" in rule_conditions:
                return self.evaluate_group(rule_conditions)
            else:
                return self.evaluate_single(rule_conditions)
        
        return False


# ==================== HELPER FUNCTIONS ====================

def evaluate_condition(condition: Dict[str, Any], context: Dict[str, Any]) -> bool:
    """Quick helper to evaluate a single condition."""
    evaluator = ConditionEvaluator(context)
    return evaluator.evaluate_single(condition)


def evaluate_rule_conditions(
    conditions: Union[Dict, List],
    context: Dict[str, Any]
) -> bool:
    """Quick helper to evaluate rule conditions."""
    evaluator = ConditionEvaluator(context)
    return evaluator.evaluate(conditions)


def build_context(
    entity: Dict[str, Any],
    payload: Dict[str, Any] = None,
    event_metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Build context for condition evaluation.
    
    Returns context that can be used with ConditionEvaluator.
    """
    return {
        "entity": entity,
        "payload": payload or {},
        "event": event_metadata or {},
        # Flatten entity fields for easier access
        **entity
    }


# ==================== CONDITION BUILDER ====================

class ConditionBuilder:
    """
    Fluent builder for creating conditions.
    
    Example:
        condition = (
            ConditionBuilder()
            .and_()
            .field("deal.value").gt(1_000_000_000)
            .field("$computed.days_since_updated").gt(7)
            .build()
        )
    """
    
    def __init__(self):
        self._logic = "AND"
        self._conditions: List[Dict] = []
        self._current_field: str = ""
    
    def and_(self) -> "ConditionBuilder":
        self._logic = "AND"
        return self
    
    def or_(self) -> "ConditionBuilder":
        self._logic = "OR"
        return self
    
    def field(self, field_path: str) -> "ConditionBuilder":
        self._current_field = field_path
        return self
    
    def _add_condition(self, op: str, value: Any) -> "ConditionBuilder":
        self._conditions.append({
            "field": self._current_field,
            "op": op,
            "value": value
        })
        return self
    
    def eq(self, value: Any) -> "ConditionBuilder":
        return self._add_condition("==", value)
    
    def neq(self, value: Any) -> "ConditionBuilder":
        return self._add_condition("!=", value)
    
    def gt(self, value: Any) -> "ConditionBuilder":
        return self._add_condition(">", value)
    
    def gte(self, value: Any) -> "ConditionBuilder":
        return self._add_condition(">=", value)
    
    def lt(self, value: Any) -> "ConditionBuilder":
        return self._add_condition("<", value)
    
    def lte(self, value: Any) -> "ConditionBuilder":
        return self._add_condition("<=", value)
    
    def is_in(self, values: List) -> "ConditionBuilder":
        return self._add_condition("in", values)
    
    def is_not_in(self, values: List) -> "ConditionBuilder":
        return self._add_condition("not_in", values)
    
    def contains(self, value: str) -> "ConditionBuilder":
        return self._add_condition("contains", value)
    
    def is_null(self) -> "ConditionBuilder":
        return self._add_condition("is_null", True)
    
    def is_not_null(self) -> "ConditionBuilder":
        return self._add_condition("is_not_null", True)
    
    def days_ago(self, days: int) -> "ConditionBuilder":
        return self._add_condition("days_ago", days)
    
    def build(self) -> Dict[str, Any]:
        return {
            "logic": self._logic,
            "conditions": self._conditions
        }
