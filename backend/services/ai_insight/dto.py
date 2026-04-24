"""
AI Insight DTOs (Data Transfer Objects)
Prompt 18/20 - AI Decision Engine

Canonical AI Domain Model:
- AISignal: Raw inference from data
- AIScore: Quantifiable metric (0-100)
- AIRecommendation: Specific suggestion
- AIExplanation: Reasoning behind score/recommendation
- AIActionSuggestion: Clickable action in UI
- AIGovernance: Controls for enabling/disabling features

HARD RULES:
- NO BLACKBOX: Every output must be explainable
- MUST EXPLAIN: Clear reasoning for all scores
- MUST CONFIGURABLE: Rules and weights not hardcoded
- MUST LOGGING: Audit trail for all AI decisions
- MUST CONFIDENCE: All outputs have confidence score
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ==================== ENUMS ====================

class ScoreLevel(str, Enum):
    """Score level classification"""
    EXCELLENT = "excellent"   # 80-100
    GOOD = "good"            # 60-79
    AVERAGE = "average"      # 40-59
    POOR = "poor"            # 20-39
    CRITICAL = "critical"    # 0-19


class RiskLevel(str, Enum):
    """Risk level classification"""
    CRITICAL = "critical"    # Immediate action required
    HIGH = "high"           # Action within 24h
    MEDIUM = "medium"       # Action within 3 days
    LOW = "low"             # Monitor
    NONE = "none"           # No risk detected


class ActionPriority(str, Enum):
    """Action priority level"""
    URGENT = "urgent"       # Do now
    HIGH = "high"          # Today
    MEDIUM = "medium"      # This week
    LOW = "low"            # Can wait


class ConfidenceLevel(str, Enum):
    """Confidence in AI output"""
    HIGH = "high"          # > 80%
    MEDIUM = "medium"      # 50-80%
    LOW = "low"            # < 50%


class SignalType(str, Enum):
    """Types of AI signals"""
    LEAD_QUALITY = "lead_quality"
    DEAL_RISK = "deal_risk"
    ENGAGEMENT = "engagement"
    CONVERSION_POTENTIAL = "conversion_potential"
    CHURN_RISK = "churn_risk"
    STALE_ACTIVITY = "stale_activity"
    BUDGET_MATCH = "budget_match"
    RESPONSE_DELAY = "response_delay"


class RecommendationType(str, Enum):
    """Types of recommendations"""
    CONTACT_NOW = "contact_now"
    FOLLOW_UP = "follow_up"
    REASSIGN = "reassign"
    NURTURE = "nurture"
    DEPRIORITIZE = "deprioritize"
    ESCALATE = "escalate"
    CLOSE_DEAL = "close_deal"
    SEND_PROPOSAL = "send_proposal"
    SCHEDULE_MEETING = "schedule_meeting"
    OFFER_DISCOUNT = "offer_discount"


class ActionType(str, Enum):
    """Types of suggested actions"""
    CALL = "call"
    EMAIL = "email"
    SMS = "sms"
    CREATE_TASK = "create_task"
    REASSIGN = "reassign"
    SCHEDULE_MEETING = "schedule_meeting"
    SEND_PROPOSAL = "send_proposal"
    CREATE_ALERT = "create_alert"
    UPDATE_STAGE = "update_stage"
    ADD_NOTE = "add_note"


# ==================== CANONICAL AI MODELS ====================

@dataclass
class AISignal:
    """
    Raw inference from data.
    Example: deal_is_stale_signal = True
    """
    signal_id: str
    signal_type: SignalType
    signal_name: str
    value: Any                    # Can be bool, number, string
    raw_data: Dict[str, Any]     # Source data that triggered signal
    detected_at: str
    entity_type: str             # lead, deal, contact
    entity_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AIScore:
    """
    Quantifiable metric (0-100).
    Example: lead_score = 87/100
    """
    score_id: str
    score_type: str              # lead_score, deal_health, engagement_score
    score_value: int             # 0-100
    score_level: ScoreLevel
    factors: List[Dict[str, Any]]  # Breakdown of score components
    # Example factor: {"name": "budget_match", "impact": +20, "reason": "Budget matches inventory"}
    confidence: float            # 0-1
    confidence_level: ConfidenceLevel
    calculated_at: str
    entity_type: str
    entity_id: str
    version: int = 1             # For tracking score changes


@dataclass
class AIExplanation:
    """
    Reasoning behind score or recommendation.
    Example: "+20 for budget match, -10 for slow response"
    """
    explanation_id: str
    summary: str                 # One-line summary
    detailed_breakdown: List[Dict[str, Any]]
    # Example: [{"factor": "budget_match", "impact": +20, "detail": "Customer budget 3-5 tỷ matches 15 available units"}]
    positive_factors: List[str]
    negative_factors: List[str]
    key_insights: List[str]
    generated_at: str


@dataclass
class AIRecommendation:
    """
    Specific suggestion.
    Example: "Call customer now"
    """
    recommendation_id: str
    recommendation_type: RecommendationType
    title: str                   # Short title
    description: str             # Detailed description
    rationale: str               # Why this recommendation
    expected_impact: str         # What will happen if followed
    priority: ActionPriority
    confidence: float
    confidence_level: ConfidenceLevel
    valid_until: Optional[str]   # Recommendation expiry
    entity_type: str
    entity_id: str
    generated_at: str
    alternatives: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class AIActionSuggestion:
    """
    Clickable action in UI.
    Example: "Create Task" button
    """
    action_id: str
    action_type: ActionType
    label: str                   # Button/action label
    description: str             # Tooltip/description
    params: Dict[str, Any]       # Parameters for the action
    # Example: {"task_title": "Follow up call", "due_date": "2024-01-15", "priority": "high"}
    endpoint: str                # API endpoint to call
    method: str                  # HTTP method
    icon: str                    # Icon name for UI
    priority: ActionPriority
    estimated_impact: str
    entity_type: str
    entity_id: str


@dataclass
class AIGovernance:
    """
    Controls for enabling/disabling AI features.
    """
    rule_id: str
    rule_name: str
    rule_type: str               # scoring, risk, recommendation
    is_enabled: bool
    weights: Dict[str, float]    # Configurable weights
    thresholds: Dict[str, Any]   # Configurable thresholds
    created_by: str
    created_at: str
    updated_by: Optional[str] = None
    updated_at: Optional[str] = None
    description: Optional[str] = None


# ==================== COMPOSITE RESPONSE MODELS ====================

@dataclass
class LeadScoreResult:
    """Complete lead scoring result"""
    lead_id: str
    lead_name: str
    score: AIScore
    explanation: AIExplanation
    recommendation: AIRecommendation
    action_suggestions: List[AIActionSuggestion]
    signals: List[AISignal]
    generated_at: str


@dataclass
class DealRiskResult:
    """Complete deal risk assessment result"""
    deal_id: str
    deal_code: str
    deal_name: str
    risk_level: RiskLevel
    risk_score: int              # 0-100 (higher = more risky)
    signals: List[AISignal]
    explanation: AIExplanation
    recommendation: AIRecommendation
    action_suggestions: List[AIActionSuggestion]
    generated_at: str


@dataclass
class NextBestActionResult:
    """Complete next best action result"""
    entity_type: str
    entity_id: str
    entity_name: str
    primary_action: AIActionSuggestion
    alternative_actions: List[AIActionSuggestion]
    context: Dict[str, Any]      # Lead score, deal risk, etc.
    rationale: str
    confidence: float
    confidence_level: ConfidenceLevel
    generated_at: str


@dataclass
class AIInsightResult:
    """
    Unified AI insight for any entity.
    Combines all AI outputs in one response.
    """
    entity_type: str
    entity_id: str
    entity_name: str
    
    # Core scores
    lead_score: Optional[AIScore] = None
    deal_risk: Optional[DealRiskResult] = None
    
    # Recommendations
    next_best_action: Optional[NextBestActionResult] = None
    
    # All signals detected
    signals: List[AISignal] = field(default_factory=list)
    
    # Unified explanation
    explanation: Optional[AIExplanation] = None
    
    # All suggested actions
    action_suggestions: List[AIActionSuggestion] = field(default_factory=list)
    
    # Confidence
    overall_confidence: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.LOW
    
    # Metadata
    generated_at: str = ""
    processing_time_ms: int = 0
    model_version: str = "1.0.0"


# ==================== SCORING RULES (CONFIGURABLE) ====================

DEFAULT_LEAD_SCORING_RULES = {
    "budget_match": {
        "weight": 25,
        "description": "Budget alignment with available inventory",
        "rules": [
            {"condition": "budget >= 10B", "score": 25, "reason": "VIP budget (10+ tỷ)"},
            {"condition": "budget >= 5B", "score": 20, "reason": "High value budget (5-10 tỷ)"},
            {"condition": "budget >= 2B", "score": 15, "reason": "Mid value budget (2-5 tỷ)"},
            {"condition": "budget >= 1B", "score": 10, "reason": "Standard budget (1-2 tỷ)"},
            {"condition": "budget < 1B", "score": 5, "reason": "Entry budget (<1 tỷ)"},
        ]
    },
    "engagement_level": {
        "weight": 20,
        "description": "Level of engagement with sales team",
        "rules": [
            {"condition": "interactions >= 10", "score": 20, "reason": "Highly engaged (10+ interactions)"},
            {"condition": "interactions >= 5", "score": 15, "reason": "Engaged (5-10 interactions)"},
            {"condition": "interactions >= 2", "score": 10, "reason": "Some engagement (2-5 interactions)"},
            {"condition": "interactions >= 1", "score": 5, "reason": "Initial contact only"},
            {"condition": "interactions == 0", "score": 0, "reason": "No engagement"},
        ]
    },
    "recency": {
        "weight": 15,
        "description": "Recency of last activity",
        "rules": [
            {"condition": "days_since_activity <= 1", "score": 15, "reason": "Active today/yesterday"},
            {"condition": "days_since_activity <= 3", "score": 12, "reason": "Active in last 3 days"},
            {"condition": "days_since_activity <= 7", "score": 8, "reason": "Active in last week"},
            {"condition": "days_since_activity <= 14", "score": 4, "reason": "Active in last 2 weeks"},
            {"condition": "days_since_activity > 14", "score": 0, "reason": "Inactive > 2 weeks"},
        ]
    },
    "source_quality": {
        "weight": 15,
        "description": "Quality of lead source",
        "rules": [
            {"condition": "source == referral", "score": 15, "reason": "Referral source (highest quality)"},
            {"condition": "source == event", "score": 12, "reason": "Event source"},
            {"condition": "source == website", "score": 10, "reason": "Website organic"},
            {"condition": "source == facebook", "score": 8, "reason": "Facebook lead"},
            {"condition": "source == tiktok", "score": 6, "reason": "TikTok lead"},
            {"condition": "source == other", "score": 5, "reason": "Other source"},
        ]
    },
    "stage_progress": {
        "weight": 15,
        "description": "Current stage in pipeline",
        "rules": [
            {"condition": "stage == deposit", "score": 15, "reason": "Deposit stage"},
            {"condition": "stage == negotiation", "score": 13, "reason": "Negotiation stage"},
            {"condition": "stage == hot", "score": 11, "reason": "Hot lead"},
            {"condition": "stage == warm", "score": 9, "reason": "Warm lead"},
            {"condition": "stage == viewing", "score": 7, "reason": "Viewing scheduled"},
            {"condition": "stage == contacted", "score": 5, "reason": "Contacted"},
            {"condition": "stage == new", "score": 3, "reason": "New lead"},
        ]
    },
    "response_time": {
        "weight": 10,
        "description": "Speed of response to inquiries",
        "rules": [
            {"condition": "response_hours <= 1", "score": 10, "reason": "Response within 1 hour"},
            {"condition": "response_hours <= 4", "score": 8, "reason": "Response within 4 hours"},
            {"condition": "response_hours <= 24", "score": 5, "reason": "Response within 24 hours"},
            {"condition": "response_hours > 24", "score": 2, "reason": "Slow response (> 24h)"},
        ]
    },
}


DEFAULT_DEAL_RISK_RULES = {
    "stale_deal": {
        "weight": 30,
        "description": "No activity on deal",
        "rules": [
            {"condition": "days_stale >= 14", "risk": 30, "level": "critical", "reason": "Deal stale > 14 days"},
            {"condition": "days_stale >= 7", "risk": 20, "level": "high", "reason": "Deal stale 7-14 days"},
            {"condition": "days_stale >= 3", "risk": 10, "level": "medium", "reason": "Deal stale 3-7 days"},
            {"condition": "days_stale < 3", "risk": 0, "level": "none", "reason": "Deal active"},
        ]
    },
    "no_recent_activity": {
        "weight": 25,
        "description": "No logged activities",
        "rules": [
            {"condition": "activities_7d == 0", "risk": 25, "level": "high", "reason": "No activities in 7 days"},
            {"condition": "activities_7d <= 2", "risk": 15, "level": "medium", "reason": "Low activity (1-2)"},
            {"condition": "activities_7d >= 3", "risk": 0, "level": "none", "reason": "Active deal"},
        ]
    },
    "stuck_stage": {
        "weight": 20,
        "description": "Stuck in same stage too long",
        "rules": [
            {"condition": "days_in_stage >= 21", "risk": 20, "level": "high", "reason": "Stuck in stage > 21 days"},
            {"condition": "days_in_stage >= 14", "risk": 15, "level": "medium", "reason": "In stage 14-21 days"},
            {"condition": "days_in_stage >= 7", "risk": 8, "level": "low", "reason": "In stage 7-14 days"},
            {"condition": "days_in_stage < 7", "risk": 0, "level": "none", "reason": "Recently moved"},
        ]
    },
    "low_engagement": {
        "weight": 15,
        "description": "Customer not responding",
        "rules": [
            {"condition": "no_response_count >= 3", "risk": 15, "level": "high", "reason": "No response to 3+ attempts"},
            {"condition": "no_response_count >= 2", "risk": 10, "level": "medium", "reason": "No response to 2 attempts"},
            {"condition": "no_response_count >= 1", "risk": 5, "level": "low", "reason": "No response to 1 attempt"},
            {"condition": "no_response_count == 0", "risk": 0, "level": "none", "reason": "Customer responsive"},
        ]
    },
    "deadline_pressure": {
        "weight": 10,
        "description": "Approaching deadlines",
        "rules": [
            {"condition": "days_to_deadline <= 1", "risk": 10, "level": "critical", "reason": "Deadline tomorrow or passed"},
            {"condition": "days_to_deadline <= 3", "risk": 7, "level": "high", "reason": "Deadline in 3 days"},
            {"condition": "days_to_deadline <= 7", "risk": 4, "level": "medium", "reason": "Deadline in 1 week"},
            {"condition": "days_to_deadline > 7", "risk": 0, "level": "none", "reason": "No deadline pressure"},
        ]
    },
}


DEFAULT_NEXT_BEST_ACTION_RULES = {
    "high_score_cold_lead": {
        "condition": {"lead_score": ">=70", "days_since_contact": ">=3"},
        "action": ActionType.CALL,
        "priority": ActionPriority.URGENT,
        "label": "Gọi điện ngay",
        "description": "Lead điểm cao nhưng chưa liên hệ gần đây",
        "expected_impact": "Tăng 40% khả năng chuyển đổi"
    },
    "high_risk_deal": {
        "condition": {"risk_level": "high", "days_stale": ">=7"},
        "action": ActionType.CREATE_TASK,
        "priority": ActionPriority.URGENT,
        "label": "Tạo task theo dõi",
        "description": "Deal có rủi ro cao, cần hành động ngay",
        "expected_impact": "Giảm 30% tỷ lệ mất deal"
    },
    "nurture_low_score": {
        "condition": {"lead_score": "<40", "has_email": True},
        "action": ActionType.EMAIL,
        "priority": ActionPriority.MEDIUM,
        "label": "Gửi email nurture",
        "description": "Lead điểm thấp, cần nurture tự động",
        "expected_impact": "Duy trì engagement, tiết kiệm thời gian sales"
    },
    "schedule_viewing": {
        "condition": {"lead_score": ">=60", "stage": "warm", "has_viewed": False},
        "action": ActionType.SCHEDULE_MEETING,
        "priority": ActionPriority.HIGH,
        "label": "Đặt lịch xem nhà",
        "description": "Lead tiềm năng, chưa xem dự án",
        "expected_impact": "Tăng 50% khả năng chuyển đổi sang booking"
    },
}
