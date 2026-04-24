"""
Hardened Automation Orchestrator
Prompt 19.5 - Enterprise-Grade Automation Engine

Integrates all hardening features:
- Event Contract (Pydantic-based)
- Condition DSL (JSON-based)
- Compensation/Rollback
- Priority Queue
- Rule Conflict Resolution
- Idempotency & Dedupe
- Full Execution Trace
- Anti-Loop Protection
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid
import logging

# Event Contract
from .event_contract import (
    BusinessEventContract,
    EventBuilder,
    EventActor,
    EventEntity,
    EventMetadata,
    ActorType,
    create_event,
)

# Condition DSL
from .condition_evaluator import (
    ConditionEvaluator,
    evaluate_rule_conditions,
    build_context,
)

# Priority Queue
from .priority_queue import (
    AutomationPriorityQueue,
    PriorityCalculator,
    PriorityLevel,
    calculate_priority,
)

# Execution Trace
from .execution_trace import (
    TraceLogger,
    ExecutionTrace,
    RuleTrace,
    ActionTrace,
    TraceStatus,
    format_trace_summary,
)

# Compensation
from .compensation_engine import (
    CompensationEngine,
    RuleConflictResolver,
)

# Idempotency
from .idempotency import (
    DedupeChecker,
    IdempotencyStore,
    AntiLoopProtection,
)

# Existing components
from .rule_engine import RuleEngine, AutomationRule, RuleAction, ActionClassification
from .execution_engine import ExecutionEngine, ExecutionStatus
from .guardrails import GuardrailEngine

logger = logging.getLogger(__name__)


class HardenedOrchestrator:
    """
    Enterprise-grade Automation Orchestrator.
    
    Features:
    - Pydantic-based event contracts
    - JSON-based condition DSL
    - Automatic compensation/rollback
    - Priority-based execution
    - Rule conflict resolution
    - Full idempotency & deduplication
    - Complete execution tracing
    - Anti-loop protection
    """
    
    def __init__(self, db):
        self.db = db
        
        # Core engines
        self.rule_engine = RuleEngine(db)
        self.execution_engine = ExecutionEngine(db)
        self.guardrails = GuardrailEngine(db)
        
        # Hardening components
        self.priority_queue = AutomationPriorityQueue()
        self.priority_calculator = PriorityCalculator()
        self.trace_logger = TraceLogger(db)
        self.compensation_engine = CompensationEngine(db)
        self.conflict_resolver = RuleConflictResolver()
        self.dedupe_checker = DedupeChecker(db)
        
        # Events collection
        self._events_collection = "business_events_v2"
    
    # ==================== EVENT PROCESSING ====================
    
    async def process_event(
        self,
        event
    ) -> Dict[str, Any]:
        """
        Process a business event with full hardening.
        
        This is the MAIN ENTRY POINT for automation.
        
        Args:
            event: BusinessEventContract (Pydantic model) or dict
            
        Returns:
            {
                "trace_id": str,
                "status": str,
                "rules_matched": int,
                "actions_executed": int,
                "trace": ExecutionTrace
            }
        """
        # Convert dict to BusinessEventContract if needed
        if isinstance(event, dict):
            event = BusinessEventContract.from_dict(event)
        
        # Create execution trace
        trace = self.trace_logger.create_trace(
            event_id=event.event_id,
            event_type=event.event_type,
            entity_type=event.entity.entity_type,
            entity_id=event.entity.entity_id,
            correlation_id=event.metadata.correlation_id,
            chain_depth=event.metadata.chain_depth,
            parent_trace_id=None  # Could be derived from source_event_id
        )
        
        try:
            # Start trace
            self.trace_logger.start_trace(trace)
            
            # 1. Dedupe check
            dedupe_result = await self._check_dedupe(event, trace)
            if dedupe_result["is_duplicate"]:
                trace.status = TraceStatus.SKIPPED
                trace.guardrail_blocked = True
                trace.guardrail_reason = dedupe_result["reason"]
                await self._complete_trace(trace, success=False)
                return self._build_result(trace)
            
            # 2. Store event
            await self._store_event(event)
            
            # 3. Fetch entity
            entity_data = await self.db[event.entity.entity_type].find_one(
                {"id": event.entity.entity_id}, {"_id": 0}
            )
            
            if not entity_data:
                logger.warning(f"Entity not found: {event.entity.entity_type}/{event.entity.entity_id}")
                trace.error = "Entity not found"
                await self._complete_trace(trace, success=False)
                return self._build_result(trace)
            
            # 4. Calculate priority
            priority_score = self.priority_calculator.calculate(
                entity_data,
                event.event_type,
                {"payload": event.payload}
            )
            trace.priority_score = priority_score
            trace.priority_level = PriorityLevel(
                max(0, min(100, (priority_score // 20) * 20))
            ).name.lower()
            
            # 5. Get matching rules
            matching_rules = await self._get_matching_rules(event, entity_data, trace)
            
            if not matching_rules:
                logger.debug(f"No rules matched for {event.event_type}")
                await self._complete_trace(trace, success=True)
                return self._build_result(trace)
            
            # 6. Resolve conflicts and filter rules
            executable_rules = self.conflict_resolver.filter_executable_rules(
                [r.to_dict() for r in matching_rules]
            )
            
            # 7. Execute rules with compensation tracking
            for rule_dict, exec_reason in executable_rules:
                rule = AutomationRule.from_dict(rule_dict)
                await self._execute_rule(
                    rule, event, entity_data, trace
                )
                
                # Check stop_on_match
                if rule_dict.get("stop_on_match"):
                    logger.info(f"Rule {rule.rule_id} has stop_on_match, stopping")
                    break
            
            # 8. Mark event as processed
            await self.dedupe_checker.mark_event_processed(
                idempotency_key=event.metadata.idempotency_key,
                execution_id=trace.trace_id,
                correlation_id=event.metadata.correlation_id,
                rule_id=None,  # Multiple rules may have executed
                event_id=event.event_id
            )
            
            await self._complete_trace(trace, success=True)
            
        except Exception as e:
            logger.error(f"Event processing failed: {e}")
            trace.error = str(e)
            
            # Attempt rollback
            if self.compensation_engine.get_tracked_count() > 0:
                logger.info("Attempting compensation rollback...")
                rollback_results = await self.compensation_engine.rollback_all()
                trace.total_actions_compensated = len([
                    r for r in rollback_results if r.get("status") == "success"
                ])
            
            await self._complete_trace(trace, success=False)
        
        return self._build_result(trace)
    
    async def _check_dedupe(
        self,
        event: BusinessEventContract,
        trace: ExecutionTrace
    ) -> Dict[str, Any]:
        """Check for duplicate event."""
        result = await self.dedupe_checker.check_event(
            event_id=event.event_id,
            event_type=event.event_type,
            entity_type=event.entity.entity_type,
            entity_id=event.entity.entity_id,
            idempotency_key=event.metadata.idempotency_key,
            correlation_id=event.metadata.correlation_id,
            source_rule_id=event.actor.source_rule_id
        )
        
        # Record in trace
        for check_name, check_result in result.get("checks", {}).items():
            self.trace_logger.record_guardrail_check(
                trace, check_name, not check_result.get("is_duplicate", False)
            )
        
        return result
    
    async def _store_event(self, event: BusinessEventContract):
        """Store event in database."""
        await self.db[self._events_collection].insert_one(event.to_dict())
    
    async def _get_matching_rules(
        self,
        event: BusinessEventContract,
        entity_data: Dict[str, Any],
        trace: ExecutionTrace
    ) -> List[AutomationRule]:
        """Get rules that match the event and conditions."""
        # Get rules for this event type
        rules = await self.rule_engine.get_rules_for_event(
            event.event_type, enabled_only=True
        )
        trace.rules_evaluated = len(rules)
        
        # Build evaluation context
        context = build_context(
            entity=entity_data,
            payload=event.payload,
            event_metadata=event.metadata.dict()
        )
        
        # Filter by conditions using DSL evaluator
        matching = []
        evaluator = ConditionEvaluator(context)
        
        for rule in rules:
            # Check anti-loop
            is_loop, loop_reason = await self.dedupe_checker.anti_loop.check_loop(
                event.metadata.correlation_id,
                rule.rule_id,
                event.actor.source_rule_id
            )
            
            if is_loop:
                logger.debug(f"Rule {rule.rule_id} skipped: {loop_reason}")
                continue
            
            # Evaluate conditions using DSL
            conditions = rule.conditions
            if conditions:
                # Convert old format to new DSL format if needed
                dsl_conditions = self._convert_conditions_to_dsl(conditions)
                if not evaluator.evaluate(dsl_conditions):
                    continue
            
            matching.append(rule)
        
        trace.rules_matched = len(matching)
        return matching
    
    def _convert_conditions_to_dsl(self, conditions: List) -> Dict[str, Any]:
        """Convert old condition format to DSL format."""
        if not conditions:
            return {"logic": "AND", "conditions": []}
        
        dsl_conditions = []
        for cond in conditions:
            if hasattr(cond, 'to_dict'):
                cond = cond.to_dict()
            
            # Map old operators to new
            op_map = {
                "eq": "==",
                "neq": "!=",
                "gt": ">",
                "gte": ">=",
                "lt": "<",
                "lte": "<=",
            }
            
            field = cond.get("field", "")
            source = cond.get("source", "entity")
            
            # If field already has path prefix (e.g., "payload.deal_value"), use as-is
            if not field.startswith("payload.") and not field.startswith("entity.") and not field.startswith("$computed."):
                if source == "computed":
                    field = f"$computed.{field}"
                elif source == "payload":
                    field = f"payload.{field}"
            
            dsl_conditions.append({
                "field": field,
                "op": op_map.get(cond.get("operator"), cond.get("operator", "==")),
                "value": cond.get("value")
            })
        
        return {"logic": "AND", "conditions": dsl_conditions}
    
    async def _execute_rule(
        self,
        rule: AutomationRule,
        event: BusinessEventContract,
        entity_data: Dict[str, Any],
        trace: ExecutionTrace
    ):
        """Execute a single rule with tracing and compensation."""
        rule_trace = self.trace_logger.add_rule_trace(
            trace,
            rule.rule_id,
            rule.name,
            rule.priority,
            getattr(rule, 'stop_on_match', False)
        )
        self.trace_logger.mark_rule_matched(trace, rule_trace)
        
        # Reset compensation tracking for this rule
        self.compensation_engine.clear()
        
        try:
            for action in rule.actions:
                await self._execute_action(
                    rule, action, event, entity_data, rule_trace
                )
            
            self.trace_logger.complete_rule_trace(trace, rule_trace, success=True)
            
            # Update rule stats
            await self.rule_engine.update_rule_stats(rule.rule_id, success=True)
            
        except Exception as e:
            logger.error(f"Rule {rule.rule_id} execution failed: {e}")
            self.trace_logger.complete_rule_trace(trace, rule_trace, success=False, error=str(e))
            
            # Rollback this rule's actions
            if self.compensation_engine.get_tracked_count() > 0:
                await self.compensation_engine.rollback_all()
            
            await self.rule_engine.update_rule_stats(rule.rule_id, success=False)
    
    async def _execute_action(
        self,
        rule: AutomationRule,
        action: RuleAction,
        event: BusinessEventContract,
        entity_data: Dict[str, Any],
        rule_trace: RuleTrace
    ):
        """Execute a single action with tracing and compensation tracking."""
        # Check action dedupe
        dedupe_result = await self.dedupe_checker.check_action(
            rule.rule_id,
            action.action_type,
            event.entity.entity_type,
            event.entity.entity_id,
            rule.cooldown_minutes
        )
        
        # Create action trace
        compensation = self.compensation_engine.get_compensation(action.action_type)
        action_trace = self.trace_logger.add_action_trace(
            rule_trace,
            action.action_type,
            action.params,
            has_compensation=compensation is not None,
            compensation_action=compensation
        )
        
        if dedupe_result["is_duplicate"]:
            self.trace_logger.mark_action_skipped(
                rule_trace, action_trace, 
                f"dedupe: {dedupe_result.get('previous_execution_id', 'unknown')}"
            )
            return
        
        # Capture original state for compensation
        original_state = {
            "assigned_to": entity_data.get("assigned_to"),
            "owner_id": entity_data.get("owner_id"),
            "status": entity_data.get("status"),
            "stage": entity_data.get("stage"),
            "flags": entity_data.get("flags", {}),
        }
        
        try:
            # Execute action
            result = await self.execution_engine._execute_action_impl(
                action,
                event.entity.entity_type,
                event.entity.entity_id,
                entity_data
            )
            
            # Track for potential compensation
            self.compensation_engine.track_execution(
                action.action_type,
                event.entity.entity_type,
                event.entity.entity_id,
                result,
                original_state
            )
            
            # Mark action executed for dedupe
            await self.dedupe_checker.mark_action_executed(
                rule.rule_id,
                action.action_type,
                event.entity.entity_type,
                event.entity.entity_id,
                action_trace.action_id
            )
            
            self.trace_logger.complete_action_trace(
                rule_trace, action_trace, success=True, result=result
            )
            
        except Exception as e:
            self.trace_logger.complete_action_trace(
                rule_trace, action_trace, success=False, error=str(e)
            )
            raise
    
    async def _complete_trace(self, trace: ExecutionTrace, success: bool):
        """Complete and save trace."""
        self.trace_logger.complete_trace(trace, success)
        await self.trace_logger.save(trace)
        
        if not success and trace.error:
            logger.error(f"Trace {trace.trace_id} failed: {trace.error}")
        else:
            logger.info(
                f"Trace {trace.trace_id} complete: "
                f"{trace.rules_matched} rules, {trace.total_actions_executed} actions"
            )
    
    def _build_result(self, trace: ExecutionTrace) -> Dict[str, Any]:
        """Build result dict from trace."""
        return {
            "trace_id": trace.trace_id,
            "correlation_id": trace.correlation_id,
            "event_id": trace.event_id,
            "status": trace.status.value if isinstance(trace.status, TraceStatus) else trace.status,
            "rules_evaluated": trace.rules_evaluated,
            "rules_matched": trace.rules_matched,
            "rules_executed": trace.rules_executed,
            "actions_executed": trace.total_actions_executed,
            "actions_failed": trace.total_actions_failed,
            "actions_skipped": trace.total_actions_skipped,
            "actions_compensated": trace.total_actions_compensated,
            "priority_score": trace.priority_score,
            "duration_ms": trace.duration_ms,
            "error": trace.error,
            "trace": trace.to_dict()
        }
    
    # ==================== CONVENIENCE METHODS ====================
    
    async def emit_and_process(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        payload: Dict[str, Any] = None,
        user_id: str = None,
        user_role: str = None,
        correlation_id: str = None
    ) -> Dict[str, Any]:
        """
        Convenience method to emit and process an event.
        
        Use this in routes/services to trigger automation.
        """
        event = create_event(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload,
            user_id=user_id,
            user_role=user_role,
            correlation_id=correlation_id
        )
        
        return await self.process_event(event)
    
    # ==================== OBSERVABILITY ====================
    
    async def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Get execution trace by ID."""
        trace = await self.trace_logger.get_trace(trace_id)
        return trace.to_dict() if trace else None
    
    async def get_traces_by_correlation(
        self,
        correlation_id: str
    ) -> List[Dict[str, Any]]:
        """Get all traces for a correlation ID."""
        traces = await self.trace_logger.get_traces_by_correlation(correlation_id)
        return [t.to_dict() for t in traces]
    
    async def get_recent_traces(
        self,
        entity_type: str = None,
        entity_id: str = None,
        status: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get recent traces."""
        return await self.trace_logger.get_recent_traces(
            entity_type, entity_id, status, limit
        )
    
    async def get_debug_info(self, trace_id: str) -> str:
        """Get human-readable debug info for a trace."""
        trace = await self.trace_logger.get_trace(trace_id)
        if not trace:
            return f"Trace {trace_id} not found"
        return format_trace_summary(trace)


# ==================== FACTORY ====================

def get_hardened_orchestrator(db) -> HardenedOrchestrator:
    """Get hardened orchestrator instance."""
    return HardenedOrchestrator(db)
