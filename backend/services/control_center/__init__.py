"""
ProHouzing Control Center Services
Prompt 17/20 - Executive Control Center & Operations Command Center

MODULAR ARCHITECTURE:
    - Router -> Orchestrator -> Engines -> Database
    - Router ONLY imports and calls Orchestrator
    - Never call engines directly from router

Modules:
    - control_center_orchestrator: Entry point for all operations
    - alert_engine: Real-time alert detection
    - action_engine: Execute actions from alerts
    - suggestion_engine: Decision suggestions
    - priority_engine: Priority scoring and focus panel
    - health_score_engine: Business health score
    - bottleneck_engine: Bottleneck detection
    - control_feed_engine: Activity feed
    - dto: Data models and constants
    - utils: Shared helpers
"""

from .control_center_orchestrator import ControlCenterOrchestrator
from .dto import (
    AlertSeverity,
    AlertCategory,
    ActionType,
    UrgencyLevel,
    UserRole,
    FeedItemType,
    ALERT_RULES,
    SUGGESTION_RULES,
    HEALTH_SCORE_COMPONENTS,
    ACTION_LABELS,
)

__all__ = [
    # Main entry point
    "ControlCenterOrchestrator",
    
    # Enums
    "AlertSeverity",
    "AlertCategory",
    "ActionType",
    "UrgencyLevel",
    "UserRole",
    "FeedItemType",
    
    # Constants
    "ALERT_RULES",
    "SUGGESTION_RULES",
    "HEALTH_SCORE_COMPONENTS",
    "ACTION_LABELS",
]
