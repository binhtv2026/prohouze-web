"""
ProHouzing KPI Models
Prompt 12/20 - KPI & Performance Engine

Pydantic models for:
- KPI Definition
- KPI Target
- KPI Event
- KPI Snapshot
- Scorecard
- Leaderboard
- Bonus Rule
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from config.kpi_config import (
    KPICategory, KPIScopeType, KPIPeriodType, KPISnapshotType,
    KPIStatus, KPITargetType, KPICalculationType, LeaderboardType
)


# ═══════════════════════════════════════════════════════════════════════════════
# KPI DEFINITION MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class KPIThresholds(BaseModel):
    """Thresholds for KPI status"""
    exceeding: float = 110
    on_track: float = 90
    at_risk: float = 70
    behind: float = 0


class KPIDefinitionCreate(BaseModel):
    """Create KPI definition"""
    code: str
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    
    category: str
    subcategory: Optional[str] = None
    
    calculation_type: str = KPICalculationType.COUNT.value
    formula: Optional[str] = None
    source_entity: str
    source_field: Optional[str] = None
    filter_conditions: Dict[str, Any] = {}
    
    aggregation_levels: List[str] = ["individual", "team", "branch", "company"]
    time_periods: List[str] = ["daily", "weekly", "monthly"]
    
    unit: str = "number"
    format: str = "number"
    decimal_places: int = 0
    icon: Optional[str] = None
    color: Optional[str] = None
    
    target_type: str = KPITargetType.ABSOLUTE.value
    default_target: Optional[float] = None
    benchmark_value: Optional[float] = None
    thresholds: KPIThresholds = KPIThresholds()
    
    weight: float = 1.0
    is_key_metric: bool = False


class KPIDefinitionResponse(BaseModel):
    """KPI definition response"""
    id: str
    code: str
    name: str
    name_en: str = ""
    description: str = ""
    
    category: str
    category_label: str = ""
    subcategory: str = ""
    
    calculation_type: str
    formula: str = ""
    source_entity: str
    source_field: str = ""
    filter_conditions: Dict[str, Any] = {}
    
    aggregation_levels: List[str] = []
    time_periods: List[str] = []
    
    unit: str
    format: str
    decimal_places: int = 0
    icon: str = ""
    color: str = ""
    
    target_type: str
    default_target: float = 0
    benchmark_value: float = 0
    thresholds: Dict[str, float] = {}
    
    weight: float = 1.0
    is_key_metric: bool = False
    is_system: bool = False
    is_active: bool = True
    
    created_at: str = ""
    updated_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# KPI TARGET MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class KPITargetCreate(BaseModel):
    """Create KPI target"""
    kpi_code: str
    
    scope_type: str = KPIScopeType.INDIVIDUAL.value
    user_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    
    period_type: str = KPIPeriodType.MONTHLY.value
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    
    target_value: float
    stretch_target: Optional[float] = None
    minimum_threshold: Optional[float] = None


class KPITargetResponse(BaseModel):
    """KPI target response"""
    id: str
    kpi_code: str
    kpi_name: str = ""
    
    scope_type: str
    scope_label: str = ""
    scope_id: str = ""
    user_id: str = ""
    user_name: str = ""
    team_id: str = ""
    team_name: str = ""
    branch_id: str = ""
    branch_name: str = ""
    
    period_type: str
    period_type_label: str = ""
    period_year: int
    period_month: int = 0
    period_quarter: int = 0
    period_label: str = ""
    period_start: str = ""
    period_end: str = ""
    
    target_value: float
    stretch_target: float = 0
    minimum_threshold: float = 0
    
    # Current achievement (for display)
    current_value: float = 0
    achievement: float = 0
    status: str = ""
    
    status_db: str = "active"
    approved_by: str = ""
    approved_at: str = ""
    
    created_by: str = ""
    created_by_name: str = ""
    created_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# KPI VALUE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class KPIValue(BaseModel):
    """Single KPI value"""
    kpi_code: str
    kpi_name: str = ""
    category: str = ""
    
    target: float = 0
    actual: float = 0
    achievement: float = 0
    
    vs_previous: float = 0
    trend: str = "stable"  # up, down, stable
    status: str = KPIStatus.ON_TRACK.value
    status_label: str = ""
    status_color: str = ""
    
    rank: int = 0
    rank_total: int = 0
    rank_label: str = ""
    
    unit: str = ""
    format: str = ""
    formatted_actual: str = ""
    formatted_target: str = ""
    
    is_key_metric: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# SCORECARD MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ScorecardSummary(BaseModel):
    """Scorecard summary stats"""
    overall_score: float = 0
    overall_score_label: str = ""
    achievement_rate: float = 0
    
    rank: int = 0
    rank_total: int = 0
    rank_label: str = ""
    rank_change: int = 0
    
    total_kpis: int = 0
    kpis_exceeding: int = 0
    kpis_on_track: int = 0
    kpis_at_risk: int = 0
    kpis_behind: int = 0


class ScorecardCategory(BaseModel):
    """Scorecard category with KPIs"""
    category: str
    category_label: str = ""
    category_icon: str = ""
    category_color: str = ""
    kpis: List[KPIValue] = []
    category_achievement: float = 0
    category_status: str = ""


class ScorecardResponse(BaseModel):
    """Scorecard response"""
    scope_type: str
    scope_id: str = ""
    scope_name: str = ""
    
    period_type: str
    period_label: str = ""
    period_start: str = ""
    period_end: str = ""
    
    summary: ScorecardSummary
    categories: List[ScorecardCategory] = []
    key_metrics: List[KPIValue] = []
    
    # Bonus info
    bonus_modifier: float = 1.0
    bonus_tier_label: str = ""
    
    snapshot_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# TEAM SCORECARD MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class TeamMemberPerformance(BaseModel):
    """Team member performance"""
    user_id: str
    user_name: str
    avatar_url: str = ""
    position: str = ""
    
    overall_score: float = 0
    achievement_rate: float = 0
    status: str = KPIStatus.ON_TRACK.value
    status_label: str = ""
    status_color: str = ""
    
    # Key metrics summary
    revenue: float = 0
    revenue_formatted: str = ""
    deals_won: int = 0
    win_rate: float = 0
    
    rank_in_team: int = 0
    rank_change: int = 0


class TeamScorecardResponse(BaseModel):
    """Team scorecard response"""
    team_id: str
    team_name: str
    leader_id: str = ""
    leader_name: str = ""
    
    period_type: str
    period_label: str = ""
    period_start: str = ""
    period_end: str = ""
    
    summary: ScorecardSummary
    team_kpis: List[KPIValue] = []
    
    member_count: int = 0
    members: List[TeamMemberPerformance] = []
    
    # Team comparison
    rank_in_branch: int = 0
    total_teams_in_branch: int = 0
    vs_previous_period: float = 0
    
    snapshot_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# LEADERBOARD MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    rank: int
    previous_rank: int = 0
    rank_change: int = 0
    rank_badge: str = ""  # 🥇, 🥈, 🥉
    
    user_id: str
    user_name: str
    avatar_url: str = ""
    team_id: str = ""
    team_name: str = ""
    branch_id: str = ""
    branch_name: str = ""
    
    primary_value: float
    primary_formatted: str = ""
    target: float = 0
    achievement: float = 0
    
    badges: List[str] = []
    streak_days: int = 0
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    """Leaderboard response"""
    id: str
    name: str
    description: str = ""
    leaderboard_type: str
    
    scope_type: str
    scope_id: str = ""
    period_type: str
    period_label: str = ""
    
    primary_kpi: str
    primary_kpi_name: str = ""
    primary_kpi_unit: str = ""
    
    entries: List[LeaderboardEntry] = []
    total_participants: int = 0
    current_user_rank: int = 0
    
    last_calculated_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# DRILL-DOWN MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class DrillDownNode(BaseModel):
    """Drill-down node"""
    level: int
    level_type: str  # company, branch, team, member, transaction
    
    node_id: str
    node_name: str
    
    value: float
    formatted_value: str = ""
    percentage_of_parent: float = 0
    
    has_children: bool = False
    children_count: int = 0
    children: List["DrillDownNode"] = []
    
    # For transaction level
    transaction_type: str = ""
    transaction_date: str = ""


class DrillDownResponse(BaseModel):
    """Drill-down response"""
    kpi_code: str
    kpi_name: str = ""
    unit: str = ""
    period_label: str = ""
    
    root: DrillDownNode
    total_value: float = 0
    formatted_total: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# BONUS RULE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class BonusTier(BaseModel):
    """Bonus tier - KPI modifier tiers must be configurable"""
    min_achievement: float
    max_achievement: float
    bonus_modifier: float
    label: str = ""
    tier_label: Optional[str] = None  # Alias for label
    
    def __init__(self, **data):
        # Handle tier_label as alias
        if 'tier_label' in data and 'label' not in data:
            data['label'] = data.pop('tier_label')
        elif 'tier_label' in data:
            data.pop('tier_label')
        super().__init__(**data)


class KPIBonusRuleCreate(BaseModel):
    """Create bonus rule"""
    code: str
    name: str
    description: Optional[str] = None
    
    kpi_codes: List[str]
    calculation_basis: str = "single_kpi"  # single_kpi, average_kpis, weighted_kpis
    kpi_weights: Dict[str, float] = {}
    
    tiers: List[BonusTier]
    
    apply_to_commission_types: List[str] = ["closing_sales"]
    calculation_method: str = "multiply_base"  # multiply_base, multiply_final, add_fixed
    
    scope_type: str = "company"
    scope_ids: List[str] = []
    
    effective_from: str
    effective_to: Optional[str] = None


class KPIBonusRuleUpdate(BaseModel):
    """Update bonus rule - KPI tiers MUST be configurable, not hardcoded"""
    name: Optional[str] = None
    description: Optional[str] = None
    kpi_codes: Optional[List[str]] = None
    calculation_basis: Optional[str] = None
    kpi_weights: Optional[Dict[str, float]] = None
    tiers: Optional[List[BonusTier]] = None
    apply_to_commission_types: Optional[List[str]] = None
    calculation_method: Optional[str] = None
    scope_type: Optional[str] = None
    scope_ids: Optional[List[str]] = None
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    is_active: Optional[bool] = None


class KPIBonusRuleResponse(BaseModel):
    """Bonus rule response with versioning for financial-grade compliance"""
    id: str
    code: str
    name: str
    description: str = ""
    
    kpi_codes: List[str] = []
    kpi_names: List[str] = []
    calculation_basis: str
    kpi_weights: Dict[str, float] = {}
    
    tiers: List[BonusTier] = []
    
    apply_to_commission_types: List[str] = []
    calculation_method: str
    
    scope_type: str
    scope_ids: List[str] = []
    
    effective_from: str
    effective_to: str = ""
    
    is_active: bool = True
    
    # FINANCIAL-GRADE: Rule Versioning
    version: int = 1
    version_history: Optional[List[Dict[str, Any]]] = None
    
    approved_by: str = ""
    approved_by_name: str = ""
    approved_at: str = ""
    
    created_by: str = ""
    created_by_name: str = ""
    created_at: str = ""
    updated_at: str = ""
    updated_by: str = ""


class BonusCalculationResult(BaseModel):
    """Bonus calculation result"""
    user_id: str
    user_name: str = ""
    
    period_type: str
    period_label: str = ""
    
    # Achievement summary
    overall_achievement: float = 0
    kpi_achievements: Dict[str, float] = {}
    
    # Bonus result
    bonus_modifier: float = 1.0
    bonus_tier_label: str = ""
    
    # Commission impact
    applicable_commissions: int = 0
    original_commission_total: float = 0
    adjusted_commission_total: float = 0
    bonus_amount: float = 0


# ═══════════════════════════════════════════════════════════════════════════════
# KPI EVENT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class KPIImpact(BaseModel):
    """KPI impact from event"""
    kpi_code: str
    value_change: float
    new_value: Optional[float] = None
    context: Dict[str, Any] = {}


class KPIEventCreate(BaseModel):
    """Create KPI event"""
    event_type: str
    source_entity_type: str
    source_entity_id: str
    source_action: str
    
    user_id: str
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    
    kpi_impacts: List[KPIImpact]
    metadata: Dict[str, Any] = {}


class KPIEventResponse(BaseModel):
    """KPI event response"""
    id: str
    event_type: str
    event_timestamp: str
    
    source_entity_type: str
    source_entity_id: str
    source_action: str
    
    user_id: str
    user_name: str = ""
    team_id: str = ""
    team_name: str = ""
    branch_id: str = ""
    branch_name: str = ""
    
    kpi_impacts: List[KPIImpact] = []
    
    processed: bool = False
    processed_at: str = ""
    
    created_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# KPI TREND MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class KPITrendPoint(BaseModel):
    """KPI trend data point"""
    period_label: str
    period_start: str
    period_end: str
    
    value: float
    formatted_value: str = ""
    target: float = 0
    achievement: float = 0


class KPITrendResponse(BaseModel):
    """KPI trend response"""
    kpi_code: str
    kpi_name: str = ""
    unit: str = ""
    
    scope_type: str
    scope_id: str = ""
    scope_name: str = ""
    
    data_points: List[KPITrendPoint] = []
    
    # Summary
    current_value: float = 0
    previous_value: float = 0
    change_percent: float = 0
    trend: str = "stable"


# ═══════════════════════════════════════════════════════════════════════════════
# FILTER MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class KPITargetFilters(BaseModel):
    """Filters for KPI targets"""
    kpi_code: Optional[str] = None
    scope_type: Optional[str] = None
    user_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    period_type: Optional[str] = None
    period_year: Optional[int] = None
    period_month: Optional[int] = None
    status: Optional[str] = None
    
    skip: int = 0
    limit: int = 50
    sort_by: str = "created_at"
    sort_order: str = "desc"
