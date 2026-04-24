"""
Control Center DTOs (Data Transfer Objects)
Prompt 17/20 - Executive Control Center

Contains all enums, data models, alert rules, suggestion rules, and constants.
Single source of truth for Control Center data structures.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ==================== ENUMS ====================

class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertCategory(str, Enum):
    SALES = "sales"
    PIPELINE = "pipeline"
    INVENTORY = "inventory"
    MARKETING = "marketing"
    CONTRACT = "contract"
    DATA_QUALITY = "data_quality"
    TEAM = "team"
    FINANCIAL = "financial"


class ActionType(str, Enum):
    REASSIGN_OWNER = "reassign_owner"
    CREATE_TASK = "create_task"
    SEND_REMINDER = "send_reminder"
    REQUEST_DOCS = "request_docs"
    ASSIGN_REVIEWER = "assign_reviewer"
    TRIGGER_CAMPAIGN = "trigger_campaign"
    SCHEDULE_TRAINING = "schedule_training"
    ESCALATE = "escalate"
    MARK_RESOLVED = "mark_resolved"


class UrgencyLevel(str, Enum):
    CRITICAL = "critical"  # Must act NOW
    HIGH = "high"          # Must act TODAY
    MEDIUM = "medium"      # This week
    LOW = "low"            # Can wait


class UserRole(str, Enum):
    CEO = "ceo"
    BOD = "bod"
    ADMIN = "admin"
    MANAGER = "manager"
    SALES = "sales"
    MARKETING = "marketing"


class FeedItemType(str, Enum):
    ALERT = "alert"
    ACTION = "action"
    SUGGESTION = "suggestion"
    ESCALATION = "escalation"
    RESOLUTION = "resolution"
    UPDATE = "update"


# ==================== DATA MODELS ====================

@dataclass
class Alert:
    """Real-time business alert."""
    id: str
    category: AlertCategory
    severity: AlertSeverity
    urgency: UrgencyLevel
    title: str
    description: str
    source_entity: str
    source_id: str
    responsible_role: str
    recommended_actions: List[ActionType]
    metrics: Dict[str, Any]
    created_at: datetime
    rule_code: str
    expires_at: Optional[datetime] = None
    is_acknowledged: bool = False
    is_resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    owner_id: Optional[str] = None


@dataclass
class Suggestion:
    """Decision support suggestion."""
    id: str
    category: str
    priority_score: int
    urgency: UrgencyLevel
    title: str
    description: str
    rationale: str
    recommended_action: str
    expected_impact: str
    target_entity: str
    target_id: str
    metrics: Dict[str, Any]
    created_at: datetime


@dataclass
class ControlFeedItem:
    """Item in the control feed."""
    id: str
    type: FeedItemType
    category: str
    title: str
    description: str
    source_entity: str
    source_id: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    severity: Optional[str] = None
    actor: Optional[str] = None


@dataclass
class HealthScoreComponent:
    """Health score component with weight and metrics."""
    name: str
    score: float
    weight: int
    detail: str
    metrics: Dict[str, Any]


@dataclass
class BusinessHealthScore:
    """Business Health Score result."""
    total_score: float
    grade: str
    status: str
    components: Dict[str, HealthScoreComponent]
    weakest_areas: List[tuple]
    recommendations: List[Dict[str, str]]
    calculated_at: str
    trend: Dict[str, Any]


@dataclass
class Bottleneck:
    """Operational bottleneck."""
    type: str
    count: int
    severity: str
    description: str
    items: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class FocusItem:
    """Today's focus panel item."""
    type: str
    id: str
    priority_score: int
    urgency: str
    title: str
    description: str
    category: str
    source_entity: Optional[str] = None
    source_id: Optional[str] = None
    recommended_actions: List[str] = field(default_factory=list)


# ==================== ALERT RULES ====================

ALERT_RULES = {
    "deal_stale": {
        "category": AlertCategory.PIPELINE,
        "severity": AlertSeverity.HIGH,
        "urgency": UrgencyLevel.HIGH,
        "title": "Deal khong cap nhat qua {days} ngay",
        "threshold_days": 7,
        "recommended_actions": [ActionType.SEND_REMINDER, ActionType.CREATE_TASK, ActionType.REASSIGN_OWNER],
        "responsible_role": "manager"
    },
    "deal_stuck_stage": {
        "category": AlertCategory.PIPELINE,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Deal bi stuck o stage {stage}",
        "threshold_days": 14,
        "recommended_actions": [ActionType.CREATE_TASK, ActionType.ESCALATE],
        "responsible_role": "sales"
    },
    "booking_expiring": {
        "category": AlertCategory.SALES,
        "severity": AlertSeverity.CRITICAL,
        "urgency": UrgencyLevel.CRITICAL,
        "title": "Booking sap het han trong {days} ngay",
        "threshold_days": 3,
        "recommended_actions": [ActionType.SEND_REMINDER, ActionType.CREATE_TASK],
        "responsible_role": "sales"
    },
    "lead_unassigned": {
        "category": AlertCategory.SALES,
        "severity": AlertSeverity.HIGH,
        "urgency": UrgencyLevel.HIGH,
        "title": "{count} leads chua duoc phan cong",
        "recommended_actions": [ActionType.REASSIGN_OWNER],
        "responsible_role": "manager"
    },
    "lead_response_slow": {
        "category": AlertCategory.SALES,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.HIGH,
        "title": "Lead response time vuot SLA",
        "threshold_hours": 24,
        "recommended_actions": [ActionType.SEND_REMINDER, ActionType.ESCALATE],
        "responsible_role": "manager"
    },
    "contract_pending_review": {
        "category": AlertCategory.CONTRACT,
        "severity": AlertSeverity.HIGH,
        "urgency": UrgencyLevel.HIGH,
        "title": "{count} hop dong cho review",
        "recommended_actions": [ActionType.ASSIGN_REVIEWER, ActionType.ESCALATE],
        "responsible_role": "manager"
    },
    "contract_missing_docs": {
        "category": AlertCategory.CONTRACT,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Hop dong thieu documents",
        "recommended_actions": [ActionType.REQUEST_DOCS, ActionType.SEND_REMINDER],
        "responsible_role": "sales"
    },
    "team_low_conversion": {
        "category": AlertCategory.TEAM,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Team {team} co conversion thap ({rate}%)",
        "threshold_rate": 5,
        "recommended_actions": [ActionType.SCHEDULE_TRAINING, ActionType.ESCALATE],
        "responsible_role": "manager"
    },
    "sales_overloaded": {
        "category": AlertCategory.TEAM,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Sales {name} bi overload ({count} tasks)",
        "threshold_tasks": 20,
        "recommended_actions": [ActionType.REASSIGN_OWNER],
        "responsible_role": "manager"
    },
    "inventory_stuck": {
        "category": AlertCategory.INVENTORY,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.LOW,
        "title": "Project {project} co {count} can ton lau",
        "threshold_days": 90,
        "recommended_actions": [ActionType.TRIGGER_CAMPAIGN],
        "responsible_role": "marketing"
    },
    "low_absorption": {
        "category": AlertCategory.INVENTORY,
        "severity": AlertSeverity.HIGH,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Project {project} absorption rate thap ({rate}%)",
        "threshold_rate": 30,
        "recommended_actions": [ActionType.TRIGGER_CAMPAIGN, ActionType.ESCALATE],
        "responsible_role": "manager"
    },
    "high_cpl_source": {
        "category": AlertCategory.MARKETING,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.LOW,
        "title": "Source {source} co CPL cao ({cpl})",
        "recommended_actions": [ActionType.TRIGGER_CAMPAIGN],
        "responsible_role": "marketing"
    },
    "campaign_low_roi": {
        "category": AlertCategory.MARKETING,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Campaign {campaign} ROI thap",
        "threshold_roi": 100,
        "recommended_actions": [ActionType.ESCALATE],
        "responsible_role": "marketing"
    },
    "duplicate_contacts": {
        "category": AlertCategory.DATA_QUALITY,
        "severity": AlertSeverity.LOW,
        "urgency": UrgencyLevel.LOW,
        "title": "Phat hien {count} contacts duplicate",
        "recommended_actions": [ActionType.MARK_RESOLVED],
        "responsible_role": "admin"
    },
    "import_errors": {
        "category": AlertCategory.DATA_QUALITY,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Import co {count} loi",
        "recommended_actions": [ActionType.MARK_RESOLVED],
        "responsible_role": "admin"
    },
    "commission_pending_high": {
        "category": AlertCategory.FINANCIAL,
        "severity": AlertSeverity.HIGH,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "Commission pending cao ({amount})",
        "recommended_actions": [ActionType.ASSIGN_REVIEWER],
        "responsible_role": "manager"
    },
    "task_overdue": {
        "category": AlertCategory.TEAM,
        "severity": AlertSeverity.MEDIUM,
        "urgency": UrgencyLevel.MEDIUM,
        "title": "{count} tasks qua han",
        "recommended_actions": [ActionType.SEND_REMINDER, ActionType.ESCALATE],
        "responsible_role": "manager"
    },
}


# ==================== SUGGESTION RULES ====================

SUGGESTION_RULES = {
    "increase_marketing_low_absorption": {
        "condition": "project_absorption < 30%",
        "title": "Tang marketing cho Project {project}",
        "description": "Project {project} co ty le absorption thap ({rate}%), can tang cuong marketing",
        "action": "Tao campaign moi hoac tang budget",
        "impact": "Du kien tang 15-20% leads",
        "priority": 80
    },
    "training_low_conversion": {
        "condition": "team_conversion < 5%",
        "title": "Team {team} can training",
        "description": "Team {team} co conversion rate thap ({rate}%), can dao tao ky nang",
        "action": "Len lich training session",
        "impact": "Du kien cai thien conversion 2-3%",
        "priority": 70
    },
    "optimize_high_cpl": {
        "condition": "source_cpl > average * 1.5",
        "title": "Toi uu Source {source}",
        "description": "Source {source} co CPL ({cpl}) cao hon TB 50%, can toi uu",
        "action": "Review targeting, creative, landing page",
        "impact": "Giam CPL 20-30%",
        "priority": 60
    },
    "reassign_unbalanced": {
        "condition": "sales_workload_variance > 50%",
        "title": "Can bang workload team",
        "description": "Workload khong deu giua cac sales, can phan bo lai",
        "action": "Reassign leads tu nguoi dang qua tai",
        "impact": "Cai thien response time",
        "priority": 65
    },
    "focus_hot_leads": {
        "condition": "hot_leads > 10 and conversion_low",
        "title": "Uu tien xu ly {count} hot leads",
        "description": "Co {count} hot leads can chot ngay",
        "action": "Tap trung resource vao hot leads",
        "impact": "Tang kha nang close deal",
        "priority": 90
    },
    "contract_backlog": {
        "condition": "pending_contracts > 5",
        "title": "Xu ly backlog hop dong",
        "description": "Co {count} hop dong dang pending, can review",
        "action": "Assign them nguoi review",
        "impact": "Giam thoi gian close deal",
        "priority": 75
    },
}


# ==================== HEALTH SCORE COMPONENTS ====================

HEALTH_SCORE_COMPONENTS = {
    "pipeline_quality": {
        "weight": 20,
        "metrics": ["deal_count", "pipeline_value", "stage_distribution"],
        "description": "Chat luong pipeline"
    },
    "conversion_rate": {
        "weight": 20,
        "metrics": ["lead_to_booking", "booking_to_contract"],
        "description": "Ty le chuyen doi"
    },
    "inventory_turnover": {
        "weight": 15,
        "metrics": ["absorption_rate", "days_on_market"],
        "description": "Vong quay ton kho"
    },
    "marketing_efficiency": {
        "weight": 15,
        "metrics": ["cpl", "roi", "lead_quality"],
        "description": "Hieu qua marketing"
    },
    "data_quality": {
        "weight": 10,
        "metrics": ["completeness", "duplicates", "freshness"],
        "description": "Chat luong du lieu"
    },
    "operational_discipline": {
        "weight": 20,
        "metrics": ["task_completion", "response_time", "followup_rate"],
        "description": "Ky luat van hanh"
    },
}


# ==================== ROLE-BASED VISIBILITY ====================

ROLE_ALERT_VISIBILITY = {
    UserRole.CEO: [
        AlertCategory.SALES,
        AlertCategory.PIPELINE,
        AlertCategory.INVENTORY,
        AlertCategory.MARKETING,
        AlertCategory.CONTRACT,
        AlertCategory.TEAM,
        AlertCategory.FINANCIAL,
        AlertCategory.DATA_QUALITY,
    ],
    UserRole.BOD: [
        AlertCategory.SALES,
        AlertCategory.PIPELINE,
        AlertCategory.INVENTORY,
        AlertCategory.FINANCIAL,
    ],
    UserRole.MANAGER: [
        AlertCategory.SALES,
        AlertCategory.PIPELINE,
        AlertCategory.TEAM,
        AlertCategory.CONTRACT,
    ],
    UserRole.SALES: [
        AlertCategory.SALES,
        AlertCategory.PIPELINE,
    ],
    UserRole.MARKETING: [
        AlertCategory.MARKETING,
        AlertCategory.INVENTORY,
    ],
}


# ==================== ACTION LABELS ====================

ACTION_LABELS = {
    ActionType.REASSIGN_OWNER: "Reassign Owner",
    ActionType.CREATE_TASK: "Create Task",
    ActionType.SEND_REMINDER: "Send Reminder",
    ActionType.REQUEST_DOCS: "Request Documents",
    ActionType.ASSIGN_REVIEWER: "Assign Reviewer",
    ActionType.TRIGGER_CAMPAIGN: "Trigger Campaign",
    ActionType.SCHEDULE_TRAINING: "Schedule Training",
    ActionType.ESCALATE: "Escalate",
    ActionType.MARK_RESOLVED: "Mark Resolved",
}


# ==================== PRIORITY WEIGHTS ====================

SEVERITY_PRIORITY_SCORES = {
    AlertSeverity.CRITICAL: 40,
    AlertSeverity.HIGH: 30,
    AlertSeverity.MEDIUM: 15,
    AlertSeverity.LOW: 5,
    AlertSeverity.INFO: 0
}

URGENCY_PRIORITY_SCORES = {
    UrgencyLevel.CRITICAL: 10,
    UrgencyLevel.HIGH: 7,
    UrgencyLevel.MEDIUM: 3,
    UrgencyLevel.LOW: 0
}

TASK_PRIORITY_SCORES = {
    "critical": 20,
    "high": 15,
    "medium": 5,
    "low": 0
}
