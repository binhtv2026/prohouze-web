"""
Execution Trace & Debug - Full Execution Tracing
Prompt 19.5 - Hardening Automation Engine

Provides complete visibility into:
- Event → Rule → Action flow
- Timing and duration
- Success/failure tracking
- Correlation across chains
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from enum import Enum
import uuid
import json
import logging

logger = logging.getLogger(__name__)


# ==================== TRACE STATUS ====================

class TraceStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    COMPENSATED = "compensated"


# ==================== TRACE MODELS ====================

@dataclass
class ActionTrace:
    """Trace for a single action execution."""
    action_id: str
    action_type: str
    params: Dict[str, Any] = field(default_factory=dict)
    status: TraceStatus = TraceStatus.PENDING
    
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: int = 0
    
    result: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    
    # Compensation
    has_compensation: bool = False
    compensation_action: Optional[str] = None
    compensation_status: Optional[TraceStatus] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "action_id": self.action_id,
            "action_type": self.action_type,
            "params": self.params,
            "status": self.status.value if isinstance(self.status, TraceStatus) else self.status,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_ms": self.duration_ms,
            "result": self.result,
            "error": self.error,
            "has_compensation": self.has_compensation,
            "compensation_action": self.compensation_action,
            "compensation_status": self.compensation_status.value if isinstance(self.compensation_status, TraceStatus) else self.compensation_status,
        }


@dataclass
class RuleTrace:
    """Trace for a rule evaluation and execution."""
    rule_id: str
    rule_name: str
    status: TraceStatus = TraceStatus.PENDING
    
    # Evaluation
    conditions_evaluated: bool = False
    conditions_matched: bool = False
    condition_results: List[Dict[str, Any]] = field(default_factory=list)
    
    # Priority
    priority: int = 0
    stop_on_match: bool = False
    
    # Actions
    actions: List[ActionTrace] = field(default_factory=list)
    actions_executed: int = 0
    actions_failed: int = 0
    actions_skipped: int = 0
    
    # Timing
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: int = 0
    
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "status": self.status.value if isinstance(self.status, TraceStatus) else self.status,
            "conditions_evaluated": self.conditions_evaluated,
            "conditions_matched": self.conditions_matched,
            "condition_results": self.condition_results,
            "priority": self.priority,
            "stop_on_match": self.stop_on_match,
            "actions": [a.to_dict() for a in self.actions],
            "actions_executed": self.actions_executed,
            "actions_failed": self.actions_failed,
            "actions_skipped": self.actions_skipped,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_ms": self.duration_ms,
            "error": self.error,
        }


@dataclass
class ExecutionTrace:
    """Complete trace for an event processing."""
    
    # Identity
    trace_id: str = ""
    correlation_id: str = ""
    
    # Event
    event_id: str = ""
    event_type: str = ""
    event_version: str = "v1"
    
    # Entity
    entity_type: str = ""
    entity_id: str = ""
    
    # Status
    status: TraceStatus = TraceStatus.PENDING
    
    # Rules
    rules_evaluated: int = 0
    rules_matched: int = 0
    rules_executed: int = 0
    rule_traces: List[RuleTrace] = field(default_factory=list)
    
    # Actions
    total_actions_executed: int = 0
    total_actions_failed: int = 0
    total_actions_skipped: int = 0
    total_actions_compensated: int = 0
    
    # Guardrails
    guardrail_checks: Dict[str, Any] = field(default_factory=dict)
    guardrail_blocked: bool = False
    guardrail_reason: str = ""
    
    # Priority
    priority_score: int = 0
    priority_level: str = "medium"
    
    # Chain info (for anti-loop)
    chain_depth: int = 0
    parent_trace_id: Optional[str] = None
    child_trace_ids: List[str] = field(default_factory=list)
    
    # Timing
    created_at: str = ""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: int = 0
    
    # Error
    error: Optional[str] = None
    
    def __post_init__(self):
        if not self.trace_id:
            self.trace_id = f"trace_{uuid.uuid4().hex[:12]}"
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc).isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "correlation_id": self.correlation_id,
            "event_id": self.event_id,
            "event_type": self.event_type,
            "event_version": self.event_version,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "status": self.status.value if isinstance(self.status, TraceStatus) else self.status,
            "rules_evaluated": self.rules_evaluated,
            "rules_matched": self.rules_matched,
            "rules_executed": self.rules_executed,
            "rule_traces": [r.to_dict() for r in self.rule_traces],
            "total_actions_executed": self.total_actions_executed,
            "total_actions_failed": self.total_actions_failed,
            "total_actions_skipped": self.total_actions_skipped,
            "total_actions_compensated": self.total_actions_compensated,
            "guardrail_checks": self.guardrail_checks,
            "guardrail_blocked": self.guardrail_blocked,
            "guardrail_reason": self.guardrail_reason,
            "priority_score": self.priority_score,
            "priority_level": self.priority_level,
            "chain_depth": self.chain_depth,
            "parent_trace_id": self.parent_trace_id,
            "child_trace_ids": self.child_trace_ids,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_ms": self.duration_ms,
            "error": self.error,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecutionTrace":
        rule_traces = [
            RuleTrace(**{**r, "actions": [ActionTrace(**a) for a in r.get("actions", [])]})
            for r in data.get("rule_traces", [])
        ]
        data["rule_traces"] = rule_traces
        data.pop("actions", None)  # Remove if present
        return cls(**data)


# ==================== TRACE LOGGER ====================

class TraceLogger:
    """
    Logger for execution traces.
    
    Provides methods to build trace incrementally
    and persist to database.
    """
    
    def __init__(self, db):
        self.db = db
        self._collection = "automation_traces"
    
    def create_trace(
        self,
        event_id: str,
        event_type: str,
        entity_type: str,
        entity_id: str,
        correlation_id: str = None,
        chain_depth: int = 0,
        parent_trace_id: str = None
    ) -> ExecutionTrace:
        """Create a new execution trace."""
        return ExecutionTrace(
            trace_id=f"trace_{uuid.uuid4().hex[:12]}",
            correlation_id=correlation_id or f"corr_{uuid.uuid4().hex[:12]}",
            event_id=event_id,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            chain_depth=chain_depth,
            parent_trace_id=parent_trace_id,
        )
    
    def start_trace(self, trace: ExecutionTrace) -> ExecutionTrace:
        """Mark trace as started."""
        trace.status = TraceStatus.RUNNING
        trace.started_at = datetime.now(timezone.utc).isoformat()
        return trace
    
    def complete_trace(
        self,
        trace: ExecutionTrace,
        success: bool = True,
        error: str = None
    ) -> ExecutionTrace:
        """Mark trace as completed."""
        trace.status = TraceStatus.SUCCESS if success else TraceStatus.FAILED
        trace.completed_at = datetime.now(timezone.utc).isoformat()
        trace.error = error
        
        # Calculate duration
        if trace.started_at:
            started = datetime.fromisoformat(trace.started_at)
            completed = datetime.fromisoformat(trace.completed_at)
            trace.duration_ms = int((completed - started).total_seconds() * 1000)
        
        # Aggregate stats
        trace.total_actions_executed = sum(r.actions_executed for r in trace.rule_traces)
        trace.total_actions_failed = sum(r.actions_failed for r in trace.rule_traces)
        trace.total_actions_skipped = sum(r.actions_skipped for r in trace.rule_traces)
        
        return trace
    
    def add_rule_trace(
        self,
        trace: ExecutionTrace,
        rule_id: str,
        rule_name: str,
        priority: int = 0,
        stop_on_match: bool = False
    ) -> RuleTrace:
        """Add a rule trace to execution trace."""
        rule_trace = RuleTrace(
            rule_id=rule_id,
            rule_name=rule_name,
            priority=priority,
            stop_on_match=stop_on_match,
            started_at=datetime.now(timezone.utc).isoformat(),
            status=TraceStatus.RUNNING
        )
        trace.rule_traces.append(rule_trace)
        trace.rules_evaluated += 1
        return rule_trace
    
    def record_condition_result(
        self,
        rule_trace: RuleTrace,
        condition: Dict[str, Any],
        result: bool,
        actual_value: Any = None
    ):
        """Record condition evaluation result."""
        rule_trace.condition_results.append({
            "condition": condition,
            "result": result,
            "actual_value": actual_value,
            "evaluated_at": datetime.now(timezone.utc).isoformat()
        })
        rule_trace.conditions_evaluated = True
    
    def mark_rule_matched(self, trace: ExecutionTrace, rule_trace: RuleTrace):
        """Mark rule as matched."""
        rule_trace.conditions_matched = True
        trace.rules_matched += 1
    
    def complete_rule_trace(
        self,
        trace: ExecutionTrace,
        rule_trace: RuleTrace,
        success: bool = True,
        error: str = None
    ):
        """Complete rule trace."""
        rule_trace.status = TraceStatus.SUCCESS if success else TraceStatus.FAILED
        rule_trace.completed_at = datetime.now(timezone.utc).isoformat()
        rule_trace.error = error
        
        if rule_trace.started_at:
            started = datetime.fromisoformat(rule_trace.started_at)
            completed = datetime.fromisoformat(rule_trace.completed_at)
            rule_trace.duration_ms = int((completed - started).total_seconds() * 1000)
        
        if success:
            trace.rules_executed += 1
    
    def add_action_trace(
        self,
        rule_trace: RuleTrace,
        action_type: str,
        params: Dict[str, Any],
        has_compensation: bool = False,
        compensation_action: str = None
    ) -> ActionTrace:
        """Add an action trace to rule trace."""
        action_trace = ActionTrace(
            action_id=f"act_{uuid.uuid4().hex[:8]}",
            action_type=action_type,
            params=params,
            has_compensation=has_compensation,
            compensation_action=compensation_action,
            started_at=datetime.now(timezone.utc).isoformat(),
            status=TraceStatus.RUNNING
        )
        rule_trace.actions.append(action_trace)
        return action_trace
    
    def complete_action_trace(
        self,
        rule_trace: RuleTrace,
        action_trace: ActionTrace,
        success: bool = True,
        result: Dict[str, Any] = None,
        error: str = None
    ):
        """Complete action trace."""
        action_trace.status = TraceStatus.SUCCESS if success else TraceStatus.FAILED
        action_trace.completed_at = datetime.now(timezone.utc).isoformat()
        action_trace.result = result or {}
        action_trace.error = error
        
        if action_trace.started_at:
            started = datetime.fromisoformat(action_trace.started_at)
            completed = datetime.fromisoformat(action_trace.completed_at)
            action_trace.duration_ms = int((completed - started).total_seconds() * 1000)
        
        if success:
            rule_trace.actions_executed += 1
        else:
            rule_trace.actions_failed += 1
    
    def mark_action_skipped(
        self,
        rule_trace: RuleTrace,
        action_trace: ActionTrace,
        reason: str
    ):
        """Mark action as skipped."""
        action_trace.status = TraceStatus.SKIPPED
        action_trace.error = reason
        action_trace.completed_at = datetime.now(timezone.utc).isoformat()
        rule_trace.actions_skipped += 1
    
    def mark_action_compensated(
        self,
        action_trace: ActionTrace,
        success: bool = True
    ):
        """Mark action as compensated (rolled back)."""
        action_trace.compensation_status = TraceStatus.SUCCESS if success else TraceStatus.FAILED
        if success:
            action_trace.status = TraceStatus.COMPENSATED
    
    def record_guardrail_check(
        self,
        trace: ExecutionTrace,
        check_name: str,
        passed: bool,
        details: Dict[str, Any] = None
    ):
        """Record guardrail check result."""
        trace.guardrail_checks[check_name] = {
            "passed": passed,
            "details": details or {},
            "checked_at": datetime.now(timezone.utc).isoformat()
        }
        
        if not passed:
            trace.guardrail_blocked = True
            trace.guardrail_reason = f"Blocked by {check_name}"
    
    async def save(self, trace: ExecutionTrace):
        """Save trace to database."""
        await self.db[self._collection].update_one(
            {"trace_id": trace.trace_id},
            {"$set": trace.to_dict()},
            upsert=True
        )
    
    async def get_trace(self, trace_id: str) -> Optional[ExecutionTrace]:
        """Get trace by ID."""
        data = await self.db[self._collection].find_one(
            {"trace_id": trace_id}, {"_id": 0}
        )
        return ExecutionTrace.from_dict(data) if data else None
    
    async def get_traces_by_correlation(
        self,
        correlation_id: str,
        limit: int = 50
    ) -> List[ExecutionTrace]:
        """Get all traces for a correlation ID."""
        cursor = self.db[self._collection].find(
            {"correlation_id": correlation_id}, {"_id": 0}
        ).sort("created_at", 1).limit(limit)
        
        traces = await cursor.to_list(limit)
        return [ExecutionTrace.from_dict(t) for t in traces]
    
    async def get_recent_traces(
        self,
        entity_type: str = None,
        entity_id: str = None,
        status: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get recent traces with filters."""
        query = {}
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        if status:
            query["status"] = status
        
        cursor = self.db[self._collection].find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(limit)
        
        return await cursor.to_list(limit)


# ==================== DEBUG HELPERS ====================

def format_trace_summary(trace: ExecutionTrace) -> str:
    """Format trace as human-readable summary."""
    lines = [
        f"=== Execution Trace: {trace.trace_id} ===",
        f"Event: {trace.event_type} ({trace.event_id})",
        f"Entity: {trace.entity_type}/{trace.entity_id}",
        f"Status: {trace.status}",
        f"Duration: {trace.duration_ms}ms",
        f"",
        f"Rules: {trace.rules_evaluated} evaluated, {trace.rules_matched} matched, {trace.rules_executed} executed",
        f"Actions: {trace.total_actions_executed} executed, {trace.total_actions_failed} failed, {trace.total_actions_skipped} skipped",
    ]
    
    if trace.guardrail_blocked:
        lines.append(f"BLOCKED: {trace.guardrail_reason}")
    
    if trace.error:
        lines.append(f"Error: {trace.error}")
    
    lines.append("")
    
    for rule_trace in trace.rule_traces:
        lines.append(f"  Rule: {rule_trace.rule_name} ({rule_trace.rule_id})")
        lines.append(f"    Status: {rule_trace.status}, Matched: {rule_trace.conditions_matched}")
        lines.append(f"    Actions: {rule_trace.actions_executed} ok, {rule_trace.actions_failed} failed")
        
        for action in rule_trace.actions:
            status_icon = "✓" if action.status == TraceStatus.SUCCESS else "✗" if action.status == TraceStatus.FAILED else "○"
            lines.append(f"      {status_icon} {action.action_type}: {action.status}")
    
    return "\n".join(lines)
