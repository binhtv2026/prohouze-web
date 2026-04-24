"""
AI Insight Engine - Domain Transfer Objects (DTOs)
Prompt 18/20 - ProHouzing AI Decision Engine

HARD REQUIREMENTS:
1. EXPLAINABILITY - Every output has score, factors, reasoning
2. NO BLACKBOX - Clear logic
3. CONFIDENCE SCORE - 0-1 for every output
4. CONFIGURABLE - Weights not hardcoded

This is a DECISION ENGINE, not a chatbot.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ==================== ENUMS ====================

class AISignalType(str, Enum):
    """Types of AI signals detected from data."""
    LEAD_HOT = "lead_hot"
    LEAD_COLD = "lead_cold"
    LEAD_DORMANT = "lead_dormant"
    DEAL_STALE = "deal_stale"
    DEAL_AT_RISK = "deal_at_risk"
    DEAL_PROGRESSING = "deal_progressing"
    BOOKING_EXPIRING = "booking_expiring"
    CONTRACT_DELAYED = "contract_delayed"
    CUSTOMER_ENGAGED = "customer_engaged"
    CUSTOMER_DISENGAGED = "customer_disengaged"
    CAMPAIGN_EFFICIENT = "campaign_efficient"
    CAMPAIGN_INEFFICIENT = "campaign_inefficient"
    INVENTORY_SLOW = "inventory_slow"
    SOURCE_HIGH_QUALITY = "source_high_quality"
    SOURCE_LOW_QUALITY = "source_low_quality"
    ANOMALY_DETECTED = "anomaly_detected"


class AIScoreType(str, Enum):
    """Types of AI scores (0-100 scale)."""
    LEAD_SCORE = "lead_score"
    DEAL_RISK_SCORE = "deal_risk_score"
    CONVERSION_PROBABILITY = "conversion_probability"
    CHURN_RISK = "churn_risk"
    FOLLOW_UP_PRIORITY = "follow_up_priority"
    PRODUCT_MATCH_SCORE = "product_match_score"
    CAMPAIGN_QUALITY = "campaign_quality"
    SOURCE_QUALITY = "source_quality"
    ENGAGEMENT_SCORE = "engagement_score"


class AIActionType(str, Enum):
    """Types of AI-suggested actions."""
    CALL_NOW = "call_now"
    SEND_MESSAGE = "send_message"
    SEND_BROCHURE = "send_brochure"
    SCHEDULE_VISIT = "schedule_visit"
    FOLLOW_UP = "follow_up"
    ESCALATE = "escalate"
    REASSIGN = "reassign"
    UPDATE_INFO = "update_info"
    REQUEST_DOCS = "request_docs"
    REVIEW_DEAL = "review_deal"
    PUSH_MARKETING = "push_marketing"
    ADJUST_CAMPAIGN = "adjust_campaign"
    MANAGER_REVIEW = "manager_review"


class ConfidenceLevel(str, Enum):
    """Confidence level categories."""
    HIGH = "high"      # 0.8 - 1.0
    MEDIUM = "medium"  # 0.5 - 0.8
    LOW = "low"        # 0.0 - 0.5


class AIEntityType(str, Enum):
    """Entity types that AI can analyze."""
    LEAD = "lead"
    CUSTOMER = "customer"
    DEAL = "deal"
    BOOKING = "booking"
    CONTRACT = "contract"
    PRODUCT = "product"
    PROJECT = "project"
    CAMPAIGN = "campaign"
    SOURCE = "source"
    TEAM = "team"
    USER = "user"


# ==================== SCORING FACTORS ====================

@dataclass
class ScoringFactor:
    """
    A single factor contributing to a score.
    EXPLAINABILITY: Each factor shows name, value, weight, contribution.
    """
    name: str
    value: float           # Raw value (e.g., 5 days)
    weight: int            # Weight in scoring (e.g., 20)
    contribution: float    # Actual contribution to score (e.g., +15)
    reason: str            # Human-readable reason
    data_source: str       # Where this data came from


@dataclass
class AIExplanation:
    """
    Explanation for any AI output.
    NO BLACKBOX: Every output must be explainable.
    """
    summary: str                           # One-line summary
    factors: List[ScoringFactor]           # Detailed factor breakdown
    confidence: float                      # 0-1 confidence score
    confidence_level: ConfidenceLevel      # HIGH/MEDIUM/LOW
    data_coverage: float                   # % of required data available
    warnings: List[str] = field(default_factory=list)  # Any warnings
    last_updated: str = ""                 # When was this calculated


# ==================== AI SCORE ====================

@dataclass
class AIScore:
    """
    AI-generated score with full explainability.
    Scale: 0-100
    """
    score_type: AIScoreType
    entity_type: AIEntityType
    entity_id: str
    total_score: float                     # 0-100
    explanation: AIExplanation
    threshold_status: str                  # "above_threshold", "below_threshold", "critical"
    calculated_at: str
    
    # Additional context
    percentile: Optional[float] = None     # Where this score ranks
    trend: Optional[str] = None            # "improving", "declining", "stable"
    previous_score: Optional[float] = None


# ==================== AI SIGNAL ====================

@dataclass
class AISignal:
    """
    AI-detected signal/pattern from data.
    """
    signal_type: AISignalType
    entity_type: AIEntityType
    entity_id: str
    severity: str                          # "critical", "high", "medium", "low"
    title: str
    description: str
    explanation: AIExplanation
    detected_at: str
    expires_at: Optional[str] = None
    is_actionable: bool = True


# ==================== AI RECOMMENDATION ====================

@dataclass
class AIRecommendation:
    """
    AI recommendation with action suggestion.
    """
    id: str
    entity_type: AIEntityType
    entity_id: str
    action_type: AIActionType
    title: str
    description: str
    reason: str
    priority: int                          # 1-100
    confidence: float                      # 0-1
    confidence_level: ConfidenceLevel
    expected_impact: str
    one_click_action: Optional[Dict[str, Any]] = None  # For actionability
    factors: List[ScoringFactor] = field(default_factory=list)
    created_at: str = ""


# ==================== AI NEXT BEST ACTION ====================

@dataclass
class NextBestAction:
    """
    The single best next action for an entity.
    """
    entity_type: AIEntityType
    entity_id: str
    action_type: AIActionType
    action_title: str
    action_description: str
    reason: str
    priority_score: int                    # 1-100
    confidence: float                      # 0-1
    time_sensitivity: str                  # "immediate", "today", "this_week", "flexible"
    one_click_params: Dict[str, Any] = field(default_factory=dict)
    factors: List[ScoringFactor] = field(default_factory=list)


# ==================== AI PRODUCT MATCH ====================

@dataclass
class ProductMatch:
    """
    AI-matched product for a customer/lead.
    """
    product_id: str
    product_code: str
    project_id: str
    project_name: str
    match_score: float                     # 0-100
    confidence: float
    match_reasons: List[str]
    availability_status: str
    price_fit: str                         # "exact", "close", "stretch", "over_budget"
    factors: List[ScoringFactor] = field(default_factory=list)


# ==================== AI INSIGHT ====================

@dataclass
class AIInsight:
    """
    AI insight for executives/managers.
    """
    id: str
    category: str                          # "anomaly", "opportunity", "risk", "trend"
    severity: str
    title: str
    observation: str
    why_it_matters: str
    suggested_action: str
    confidence: float
    data_points: List[Dict[str, Any]] = field(default_factory=list)
    related_entities: List[Dict[str, str]] = field(default_factory=list)
    created_at: str = ""


# ==================== AI LOG ENTRY ====================

@dataclass
class AILogEntry:
    """
    Log entry for AI audit trail.
    LOGGING: Log input, output, decision.
    """
    id: str
    timestamp: str
    ai_type: str                           # "lead_scoring", "deal_risk", "nba", etc.
    entity_type: str
    entity_id: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    score: Optional[float] = None
    confidence: Optional[float] = None
    decision: Optional[str] = None
    processing_time_ms: Optional[int] = None


# ==================== SCORING CONFIGURATION ====================

# Configurable weights for Lead Scoring
LEAD_SCORING_WEIGHTS = {
    "source_quality": 20,
    "budget_match": 25,
    "engagement": 20,
    "response_time": 15,
    "profile_completeness": 10,
    "project_interest": 10,
}

# Configurable weights for Deal Risk Scoring
DEAL_RISK_WEIGHTS = {
    "days_inactive": 25,
    "stage_duration": 20,
    "follow_up_compliance": 20,
    "document_completeness": 15,
    "customer_engagement": 10,
    "owner_workload": 10,
}

# Configurable weights for Product Matching
PRODUCT_MATCH_WEIGHTS = {
    "budget_fit": 30,
    "type_match": 25,
    "location_preference": 15,
    "availability": 15,
    "campaign_context": 15,
}

# Thresholds for confidence levels
CONFIDENCE_THRESHOLDS = {
    "high": 0.8,
    "medium": 0.5,
}

# Thresholds for actions
ACTION_THRESHOLDS = {
    "lead_score_hot": 80,
    "lead_score_warm": 60,
    "lead_score_cold": 40,
    "deal_risk_critical": 80,
    "deal_risk_high": 60,
    "deal_risk_medium": 40,
}

# AI Feature Flags (for governance)
AI_FEATURE_FLAGS = {
    "lead_scoring": True,
    "deal_risk": True,
    "next_best_action": True,
    "product_matching": True,
    "marketing_insight": True,
    "executive_insight": True,
}
