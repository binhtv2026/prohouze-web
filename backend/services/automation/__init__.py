"""
ProHouzing Automation Engine
Prompt 19/20 + 19.5 - Enterprise-Grade Operational Autopilot

Canonical Automation Domain Model with:
- Business Events (Pydantic-based contracts)
- Automation Rules (JSON-based conditions)
- Conditions & Actions
- Execution Logs & Tracing
- Guardrails & Governance
- Compensation/Rollback
- Priority Queue
- Rule Conflict Resolution
- Idempotency & Dedupe
- Anti-Loop Protection
"""

# Legacy event model (v1)
from .business_events import (
    BusinessEvent,
    EventType,
    EventDomain,
    EventRegistry,
    EventEmitter,
    emit_event,
)

# NEW: Event Contract (v2 - Pydantic-based)
from .event_contract import (
    BusinessEventContract,
    EventBuilder,
    EventActor,
    EventEntity,
    EventMetadata,
    ActorType,
    create_event,
)

# Rule Engine
from .rule_engine import (
    AutomationRule,
    RuleCondition,
    RuleAction,
    RuleEngine,
    ActionType,
    ActionClassification,
    ConditionOperator,
)

# NEW: Condition DSL
from .condition_evaluator import (
    ConditionEvaluator,
    evaluate_condition,
    evaluate_rule_conditions,
    build_context,
    ConditionBuilder,
)

# Execution Engine
from .execution_engine import (
    ExecutionEngine,
    ExecutionLog,
    ExecutionStatus,
)

# NEW: Execution Trace
from .execution_trace import (
    TraceLogger,
    ExecutionTrace,
    RuleTrace,
    ActionTrace,
    TraceStatus,
    format_trace_summary,
)

# Guardrails
from .guardrails import (
    GuardrailEngine,
    RateLimiter,
    DedupeChecker as LegacyDedupeChecker,
    AntiLoopProtection as LegacyAntiLoopProtection,
    NotificationThrottler,
)

# NEW: Idempotency & Dedupe
from .idempotency import (
    DedupeChecker,
    IdempotencyStore,
    ActionDeduplicator,
    AntiLoopProtection,
)

# Priority Engine
from .priority_engine import (
    BusinessPriorityEngine,
    PriorityScore,
    PriorityLevel as LegacyPriorityLevel,
)

# NEW: Priority Queue
from .priority_queue import (
    AutomationPriorityQueue,
    PriorityCalculator,
    PriorityLevel,
    QueueItem,
    calculate_priority,
)

# NEW: Compensation/Rollback
from .compensation_engine import (
    CompensationEngine,
    RuleConflictResolver,
    RuleConflictConfig,
)

# Legacy Orchestrator
from .orchestrator import (
    AutomationOrchestrator,
    get_automation_orchestrator,
)

# NEW: Hardened Orchestrator
from .hardened_orchestrator import (
    HardenedOrchestrator,
    get_hardened_orchestrator,
)

# Default Rules
from .default_rules import (
    ALL_DEFAULT_RULES,
    seed_default_rules,
)

__all__ = [
    # Legacy Events (v1)
    "BusinessEvent",
    "EventType",
    "EventDomain",
    "EventRegistry",
    "EventEmitter",
    "emit_event",
    
    # Event Contract (v2)
    "BusinessEventContract",
    "EventBuilder",
    "EventActor",
    "EventEntity",
    "EventMetadata",
    "ActorType",
    "create_event",
    
    # Rules
    "AutomationRule",
    "RuleCondition",
    "RuleAction",
    "RuleEngine",
    "ActionType",
    "ActionClassification",
    "ConditionOperator",
    
    # Condition DSL
    "ConditionEvaluator",
    "evaluate_condition",
    "evaluate_rule_conditions",
    "build_context",
    "ConditionBuilder",
    
    # Execution
    "ExecutionEngine",
    "ExecutionLog",
    "ExecutionStatus",
    
    # Trace
    "TraceLogger",
    "ExecutionTrace",
    "RuleTrace",
    "ActionTrace",
    "TraceStatus",
    "format_trace_summary",
    
    # Guardrails
    "GuardrailEngine",
    "RateLimiter",
    "NotificationThrottler",
    
    # Idempotency
    "DedupeChecker",
    "IdempotencyStore",
    "ActionDeduplicator",
    "AntiLoopProtection",
    
    # Priority
    "BusinessPriorityEngine",
    "PriorityScore",
    "PriorityLevel",
    "AutomationPriorityQueue",
    "PriorityCalculator",
    "QueueItem",
    "calculate_priority",
    
    # Compensation
    "CompensationEngine",
    "RuleConflictResolver",
    "RuleConflictConfig",
    
    # Orchestrators
    "AutomationOrchestrator",
    "get_automation_orchestrator",
    "HardenedOrchestrator",
    "get_hardened_orchestrator",
    
    # Default Rules
    "ALL_DEFAULT_RULES",
    "seed_default_rules",
]
