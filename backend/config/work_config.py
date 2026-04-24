"""
ProHouzing Work OS Configuration
Prompt 10/20 - Task, Reminder & Follow-up Operating System

Task types, statuses, priorities for BDS so cap (Primary Real Estate)
"""

from enum import Enum
from typing import Dict, Any, List


# ============================================
# TASK TYPES (BDS SO CAP SPECIFIC)
# ============================================

class TaskType(str, Enum):
    # Sales Tasks
    CALL_CUSTOMER = "call_customer"
    SEND_PRICE_SHEET = "send_price_sheet"
    SEND_BROCHURE = "send_brochure"
    ARRANGE_SITE_VISIT = "arrange_site_visit"
    FOLLOW_UP_VISIT = "follow_up_visit"
    BOOKING_FOLLOW_UP = "booking_follow_up"
    PAYMENT_REMINDER = "payment_reminder"
    
    # Admin/Legal Tasks
    DOCUMENT_COLLECTION = "document_collection"
    DOCUMENT_VERIFICATION = "document_verification"
    CONTRACT_REVIEW = "contract_review"
    LEGAL_CHECK = "legal_check"
    NOTARIZATION = "notarization"
    ARRANGE_SIGNING = "arrange_signing"
    
    # Recovery Tasks
    STALE_LEAD_RECOVERY = "stale_lead_recovery"
    STALE_DEAL_RECOVERY = "stale_deal_recovery"
    CUSTOMER_CALLBACK = "customer_callback"
    
    # General Tasks
    MEETING = "meeting"
    INTERNAL_TASK = "internal_task"
    OTHER = "other"


TASK_TYPE_CONFIG: Dict[str, Dict[str, Any]] = {
    "call_customer": {
        "label": "Goi khach hang",
        "icon": "Phone",
        "default_priority": "high",
        "default_sla_hours": 0.5,
        "auto_generate": True,
        "category": "sales"
    },
    "send_price_sheet": {
        "label": "Gui bang gia",
        "icon": "FileText",
        "default_priority": "medium",
        "default_sla_hours": 2,
        "auto_generate": True,
        "category": "sales"
    },
    "send_brochure": {
        "label": "Gui tai lieu",
        "icon": "FileImage",
        "default_priority": "medium",
        "default_sla_hours": 4,
        "auto_generate": False,
        "category": "sales"
    },
    "arrange_site_visit": {
        "label": "Hen tham quan",
        "icon": "MapPin",
        "default_priority": "high",
        "default_sla_hours": 24,
        "auto_generate": True,
        "category": "sales"
    },
    "follow_up_visit": {
        "label": "Follow-up sau tham quan",
        "icon": "MessageCircle",
        "default_priority": "urgent",
        "default_sla_hours": 4,
        "auto_generate": True,
        "category": "sales"
    },
    "booking_follow_up": {
        "label": "Follow-up booking",
        "icon": "CreditCard",
        "default_priority": "urgent",
        "default_sla_hours": 2,
        "auto_generate": True,
        "category": "sales"
    },
    "payment_reminder": {
        "label": "Nhac thanh toan",
        "icon": "DollarSign",
        "default_priority": "high",
        "default_sla_hours": 24,
        "auto_generate": True,
        "category": "finance"
    },
    "document_collection": {
        "label": "Thu thap ho so",
        "icon": "FolderOpen",
        "default_priority": "high",
        "default_sla_hours": 48,
        "auto_generate": True,
        "category": "admin"
    },
    "document_verification": {
        "label": "Xac minh ho so",
        "icon": "CheckSquare",
        "default_priority": "high",
        "default_sla_hours": 24,
        "auto_generate": False,
        "category": "admin"
    },
    "contract_review": {
        "label": "Kiem tra hop dong",
        "icon": "FileCheck",
        "default_priority": "high",
        "default_sla_hours": 24,
        "auto_generate": True,
        "category": "legal"
    },
    "legal_check": {
        "label": "Kiem tra phap ly",
        "icon": "Shield",
        "default_priority": "medium",
        "default_sla_hours": 48,
        "auto_generate": False,
        "category": "legal"
    },
    "notarization": {
        "label": "Cong chung",
        "icon": "Stamp",
        "default_priority": "medium",
        "default_sla_hours": 72,
        "auto_generate": False,
        "category": "legal"
    },
    "arrange_signing": {
        "label": "Ky hop dong",
        "icon": "PenTool",
        "default_priority": "high",
        "default_sla_hours": 72,
        "auto_generate": True,
        "category": "legal"
    },
    "stale_lead_recovery": {
        "label": "Khoi phuc lead",
        "icon": "RefreshCw",
        "default_priority": "medium",
        "default_sla_hours": 24,
        "auto_generate": True,
        "category": "recovery"
    },
    "stale_deal_recovery": {
        "label": "Khoi phuc deal",
        "icon": "AlertTriangle",
        "default_priority": "high",
        "default_sla_hours": 4,
        "auto_generate": True,
        "category": "recovery"
    },
    "customer_callback": {
        "label": "Goi lai khach",
        "icon": "PhoneCallback",
        "default_priority": "high",
        "default_sla_hours": 1,
        "auto_generate": True,
        "category": "recovery"
    },
    "meeting": {
        "label": "Cuoc hop",
        "icon": "Calendar",
        "default_priority": "medium",
        "default_sla_hours": None,
        "auto_generate": False,
        "category": "general"
    },
    "internal_task": {
        "label": "Viec noi bo",
        "icon": "Briefcase",
        "default_priority": "low",
        "default_sla_hours": None,
        "auto_generate": False,
        "category": "general"
    },
    "other": {
        "label": "Khac",
        "icon": "MoreHorizontal",
        "default_priority": "low",
        "default_sla_hours": None,
        "auto_generate": False,
        "category": "general"
    }
}


# ============================================
# TASK STATUS (LIFECYCLE)
# ============================================

class TaskStatus(str, Enum):
    NEW = "new"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    WAITING_EXTERNAL = "waiting_external"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"
    ARCHIVED = "archived"


TASK_STATUS_CONFIG: Dict[str, Dict[str, Any]] = {
    "new": {
        "label": "Moi",
        "color": "blue",
        "icon": "Plus",
        "is_active": True,
        "is_final": False,
        "show_in_dashboard": True,
        "order": 1
    },
    "pending": {
        "label": "Cho xu ly",
        "color": "yellow",
        "icon": "Clock",
        "is_active": True,
        "is_final": False,
        "show_in_dashboard": True,
        "order": 2
    },
    "in_progress": {
        "label": "Dang thuc hien",
        "color": "blue",
        "icon": "Play",
        "is_active": True,
        "is_final": False,
        "show_in_dashboard": True,
        "order": 3
    },
    "waiting_external": {
        "label": "Cho ben ngoai",
        "color": "purple",
        "icon": "UserCheck",
        "is_active": True,
        "is_final": False,
        "show_in_dashboard": True,
        "order": 4
    },
    "blocked": {
        "label": "Bi chan",
        "color": "red",
        "icon": "AlertOctagon",
        "is_active": True,
        "is_final": False,
        "show_in_dashboard": True,
        "order": 5
    },
    "completed": {
        "label": "Hoan thanh",
        "color": "green",
        "icon": "CheckCircle",
        "is_active": False,
        "is_final": True,
        "show_in_dashboard": False,
        "order": 6
    },
    "cancelled": {
        "label": "Da huy",
        "color": "gray",
        "icon": "X",
        "is_active": False,
        "is_final": True,
        "show_in_dashboard": False,
        "order": 7
    },
    "overdue": {
        "label": "Qua han",
        "color": "red",
        "icon": "AlertTriangle",
        "is_active": True,
        "is_final": False,
        "show_in_dashboard": True,
        "order": 8
    },
    "archived": {
        "label": "Luu tru",
        "color": "gray",
        "icon": "Archive",
        "is_active": False,
        "is_final": True,
        "show_in_dashboard": False,
        "order": 9
    }
}

# Valid status transitions
STATUS_TRANSITIONS: Dict[str, List[str]] = {
    "new": ["pending", "in_progress", "cancelled"],
    "pending": ["in_progress", "cancelled"],
    "in_progress": ["waiting_external", "blocked", "completed", "cancelled"],
    "waiting_external": ["in_progress", "completed", "blocked"],
    "blocked": ["in_progress", "cancelled"],
    "completed": ["archived"],
    "cancelled": [],
    "overdue": ["in_progress", "completed", "cancelled"],
    "archived": []
}

# Statuses that block editing
LOCKED_STATUSES = ["completed", "cancelled", "archived"]

# Statuses that require outcome
OUTCOME_REQUIRED_STATUSES = ["completed"]


# ============================================
# TASK PRIORITY
# ============================================

class TaskPriority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


TASK_PRIORITY_CONFIG: Dict[str, Dict[str, Any]] = {
    "urgent": {
        "label": "Khan cap",
        "color": "red",
        "icon": "AlertCircle",
        "score_weight": 25,
        "order": 1
    },
    "high": {
        "label": "Cao",
        "color": "orange",
        "icon": "ArrowUp",
        "score_weight": 20,
        "order": 2
    },
    "medium": {
        "label": "Trung binh",
        "color": "yellow",
        "icon": "Minus",
        "score_weight": 10,
        "order": 3
    },
    "low": {
        "label": "Thap",
        "color": "gray",
        "icon": "ArrowDown",
        "score_weight": 5,
        "order": 4
    }
}


# ============================================
# TASK OUTCOME
# ============================================

class TaskOutcome(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    RESCHEDULED = "rescheduled"
    NO_ANSWER = "no_answer"
    CUSTOMER_REFUSED = "customer_refused"
    NOT_APPLICABLE = "not_applicable"


TASK_OUTCOME_CONFIG: Dict[str, Dict[str, Any]] = {
    "success": {
        "label": "Thanh cong",
        "color": "green",
        "icon": "CheckCircle",
        "next_action_required": False
    },
    "partial": {
        "label": "Hoan thanh mot phan",
        "color": "yellow",
        "icon": "CircleDot",
        "next_action_required": True
    },
    "rescheduled": {
        "label": "Doi lich",
        "color": "blue",
        "icon": "Calendar",
        "next_action_required": True
    },
    "no_answer": {
        "label": "Khong lien lac duoc",
        "color": "orange",
        "icon": "PhoneMissed",
        "next_action_required": True
    },
    "customer_refused": {
        "label": "Khach tu choi",
        "color": "red",
        "icon": "UserX",
        "next_action_required": False
    },
    "not_applicable": {
        "label": "Khong ap dung",
        "color": "gray",
        "icon": "Slash",
        "next_action_required": False
    }
}


# ============================================
# ENTITY TYPES (for task relations)
# ============================================

class EntityType(str, Enum):
    LEAD = "lead"
    CONTACT = "contact"
    DEAL = "deal"
    BOOKING = "booking"
    CONTRACT = "contract"
    PROJECT = "project"
    PRODUCT = "product"


ENTITY_TYPE_CONFIG: Dict[str, Dict[str, Any]] = {
    "lead": {
        "label": "Lead",
        "icon": "UserPlus",
        "color": "blue",
        "priority_weight": 10
    },
    "contact": {
        "label": "Khach hang",
        "icon": "User",
        "color": "gray",
        "priority_weight": 5
    },
    "deal": {
        "label": "Deal",
        "icon": "Briefcase",
        "color": "purple",
        "priority_weight": 15
    },
    "booking": {
        "label": "Booking",
        "icon": "CreditCard",
        "color": "orange",
        "priority_weight": 25
    },
    "contract": {
        "label": "Hop dong",
        "icon": "FileText",
        "color": "green",
        "priority_weight": 25
    },
    "project": {
        "label": "Du an",
        "icon": "Building",
        "color": "blue",
        "priority_weight": 5
    },
    "product": {
        "label": "San pham",
        "icon": "Home",
        "color": "teal",
        "priority_weight": 5
    }
}


# ============================================
# SOURCE TYPE (manual vs auto)
# ============================================

class SourceType(str, Enum):
    MANUAL = "manual"
    AUTOMATION = "automation"
    SYSTEM = "system"
    CHAIN = "chain"


SOURCE_TYPE_CONFIG: Dict[str, Dict[str, Any]] = {
    "manual": {
        "label": "Thu cong",
        "icon": "Hand",
        "color": "gray"
    },
    "automation": {
        "label": "Tu dong",
        "icon": "Zap",
        "color": "blue"
    },
    "system": {
        "label": "He thong",
        "icon": "Settings",
        "color": "purple"
    },
    "chain": {
        "label": "Chuoi task",
        "icon": "Link",
        "color": "orange"
    }
}


# ============================================
# TASK CATEGORIES
# ============================================

TASK_CATEGORIES = {
    "sales": {
        "label": "Sales",
        "icon": "TrendingUp",
        "color": "blue",
        "types": ["call_customer", "send_price_sheet", "send_brochure", 
                  "arrange_site_visit", "follow_up_visit", "booking_follow_up"]
    },
    "finance": {
        "label": "Tai chinh",
        "icon": "DollarSign",
        "color": "green",
        "types": ["payment_reminder"]
    },
    "admin": {
        "label": "Hanh chinh",
        "icon": "FileText",
        "color": "gray",
        "types": ["document_collection", "document_verification"]
    },
    "legal": {
        "label": "Phap ly",
        "icon": "Shield",
        "color": "purple",
        "types": ["contract_review", "legal_check", "notarization", "arrange_signing"]
    },
    "recovery": {
        "label": "Phuc hoi",
        "icon": "RefreshCw",
        "color": "orange",
        "types": ["stale_lead_recovery", "stale_deal_recovery", "customer_callback"]
    },
    "general": {
        "label": "Chung",
        "icon": "MoreHorizontal",
        "color": "gray",
        "types": ["meeting", "internal_task", "other"]
    }
}


# ============================================
# PRIORITY SCORE WEIGHTS
# ============================================

PRIORITY_SCORE_CONFIG = {
    # Base priority weights (0-25)
    "priority_weights": {
        "urgent": 25,
        "high": 20,
        "medium": 10,
        "low": 5
    },
    
    # Deadline urgency weights (0-30)
    "deadline_weights": {
        "overdue": 30,
        "within_4h": 25,
        "within_24h": 15,
        "within_72h": 5,
        "beyond_72h": 0
    },
    
    # Entity value weights (0-25)
    "entity_weights": {
        "booking": 25,
        "contract": 25,
        "deal": 15,
        "lead": 10,
        "contact": 5,
        "project": 5,
        "product": 5
    },
    
    # Urgent task type weights (0-20)
    "urgent_task_types": {
        "payment_reminder": 20,
        "booking_follow_up": 20,
        "follow_up_visit": 15,
        "stale_deal_recovery": 15,
        "call_customer": 10
    }
}
