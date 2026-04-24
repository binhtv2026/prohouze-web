"""
ProHouzing SLA Configuration
Prompt 10/20 - Task, Reminder & Follow-up Operating System

SLA rules for lead, deal, booking, contract follow-up
"""

from enum import Enum
from typing import Dict, Any, List


# ============================================
# SLA ACTION TYPES
# ============================================

class SLAActionType(str, Enum):
    NOTIFY_OWNER = "notify_owner"
    NOTIFY_MANAGER = "notify_manager"
    ESCALATE = "escalate"
    AUTO_TASK = "auto_task"
    FLAG_ENTITY = "flag_entity"


# ============================================
# LEAD SLA RULES
# ============================================

LEAD_SLA_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "lead_first_contact",
        "rule_name": "Lien he lead moi",
        "description": "Lead moi phai duoc lien he trong vong 15 phut",
        "applies_to": "lead",
        "applies_to_stage": "new",
        "time_threshold_minutes": 15,
        "warning_threshold_minutes": 10,
        "actions": [
            {"type": "auto_task", "task_type": "call_customer"},
            {"type": "notify_owner"}
        ],
        "auto_task_config": {
            "task_type": "call_customer",
            "title_template": "Goi lead moi: {customer_name}",
            "due_offset_minutes": 15
        },
        "is_active": True,
        "priority": 1
    },
    {
        "rule_id": "lead_qualified_followup",
        "rule_name": "Follow-up lead qualified",
        "description": "Lead qualified phai duoc follow-up trong 4 gio",
        "applies_to": "lead",
        "applies_to_stage": "qualified",
        "time_threshold_minutes": 240,
        "warning_threshold_minutes": 120,
        "actions": [
            {"type": "notify_owner"},
            {"type": "flag_entity"}
        ],
        "is_active": True,
        "priority": 2
    },
    {
        "rule_id": "lead_stale_detection",
        "rule_name": "Phat hien lead im lang",
        "description": "Lead khong co hoat dong trong 3 ngay",
        "applies_to": "lead",
        "applies_to_stage": None,
        "exclude_stages": ["converted", "lost", "disqualified"],
        "time_threshold_minutes": 4320,  # 3 days
        "warning_threshold_minutes": 2880,  # 2 days
        "actions": [
            {"type": "auto_task", "task_type": "stale_lead_recovery"},
            {"type": "flag_entity"}
        ],
        "auto_task_config": {
            "task_type": "stale_lead_recovery",
            "title_template": "Khoi phuc lead: {customer_name}",
            "due_offset_minutes": 240
        },
        "is_active": True,
        "priority": 3
    }
]


# ============================================
# DEAL SLA RULES
# ============================================

DEAL_SLA_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "deal_stage_followup",
        "rule_name": "Follow-up sau chuyen stage",
        "description": "Deal phai duoc follow-up trong 24 gio sau khi chuyen stage",
        "applies_to": "deal",
        "applies_to_stage": None,
        "time_threshold_minutes": 1440,  # 24 hours
        "warning_threshold_minutes": 720,  # 12 hours
        "actions": [
            {"type": "notify_owner"}
        ],
        "is_active": True,
        "priority": 1
    },
    {
        "rule_id": "deal_stale_detection",
        "rule_name": "Phat hien deal im lang",
        "description": "Deal khong co hoat dong trong 5 ngay",
        "applies_to": "deal",
        "applies_to_stage": None,
        "exclude_stages": ["won", "lost"],
        "time_threshold_minutes": 7200,  # 5 days
        "warning_threshold_minutes": 4320,  # 3 days
        "actions": [
            {"type": "auto_task", "task_type": "stale_deal_recovery"},
            {"type": "flag_entity"},
            {"type": "notify_manager"}
        ],
        "auto_task_config": {
            "task_type": "stale_deal_recovery",
            "title_template": "Khoi phuc deal: {deal_name}",
            "due_offset_minutes": 240
        },
        "is_active": True,
        "priority": 2
    },
    {
        "rule_id": "deal_site_visit_followup",
        "rule_name": "Follow-up sau tham quan",
        "description": "Phai follow-up trong 4 gio sau khi tham quan",
        "applies_to": "deal",
        "applies_to_stage": "site_visit_completed",
        "time_threshold_minutes": 240,  # 4 hours
        "warning_threshold_minutes": 120,  # 2 hours
        "actions": [
            {"type": "auto_task", "task_type": "follow_up_visit"}
        ],
        "auto_task_config": {
            "task_type": "follow_up_visit",
            "title_template": "Follow-up tham quan: {customer_name}",
            "due_offset_minutes": 240
        },
        "is_active": True,
        "priority": 1
    }
]


# ============================================
# BOOKING SLA RULES
# ============================================

BOOKING_SLA_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "booking_payment_due",
        "rule_name": "Nhac thanh toan booking",
        "description": "Nhac thanh toan truoc 2 ngay",
        "applies_to": "booking",
        "applies_to_status": "pending",
        "time_threshold_minutes": 2880,  # 2 days before due
        "warning_threshold_minutes": 4320,  # 3 days before
        "actions": [
            {"type": "auto_task", "task_type": "payment_reminder"}
        ],
        "auto_task_config": {
            "task_type": "payment_reminder",
            "title_template": "Nhac thanh toan: {customer_name}",
            "due_offset_type": "before_deadline"
        },
        "is_active": True,
        "priority": 1
    },
    {
        "rule_id": "booking_expiry",
        "rule_name": "Canh bao booking sap het han",
        "description": "Canh bao truoc 3 ngay booking het han",
        "applies_to": "booking",
        "applies_to_status": "soft_booking",
        "time_threshold_minutes": 4320,  # 3 days before expiry
        "warning_threshold_minutes": 5760,  # 4 days before
        "actions": [
            {"type": "notify_owner"},
            {"type": "notify_manager"}
        ],
        "is_active": True,
        "priority": 1
    },
    {
        "rule_id": "booking_document_collection",
        "rule_name": "Thu thap ho so sau booking",
        "description": "Phai thu thap ho so trong 3 ngay sau khi confirm booking",
        "applies_to": "booking",
        "applies_to_status": "confirmed",
        "time_threshold_minutes": 4320,  # 3 days
        "warning_threshold_minutes": 1440,  # 1 day
        "actions": [
            {"type": "auto_task", "task_type": "document_collection"}
        ],
        "auto_task_config": {
            "task_type": "document_collection",
            "title_template": "Thu thap ho so: {customer_name}",
            "due_offset_minutes": 2880
        },
        "is_active": True,
        "priority": 2
    }
]


# ============================================
# CONTRACT SLA RULES
# ============================================

CONTRACT_SLA_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "contract_review_pending",
        "rule_name": "Review hop dong",
        "description": "Hop dong draft phai duoc review trong 2 ngay",
        "applies_to": "contract",
        "applies_to_status": "draft",
        "time_threshold_minutes": 2880,  # 2 days
        "warning_threshold_minutes": 1440,  # 1 day
        "actions": [
            {"type": "notify_owner"},
            {"type": "auto_task", "task_type": "contract_review"}
        ],
        "auto_task_config": {
            "task_type": "contract_review",
            "title_template": "Review HD: {contract_code}",
            "due_offset_minutes": 1440,
            "assignee_role": "legal"
        },
        "is_active": True,
        "priority": 1
    },
    {
        "rule_id": "contract_signing_pending",
        "rule_name": "Ky hop dong",
        "description": "Hop dong da duyet phai ky trong 7 ngay",
        "applies_to": "contract",
        "applies_to_status": "approved",
        "time_threshold_minutes": 10080,  # 7 days
        "warning_threshold_minutes": 4320,  # 3 days
        "actions": [
            {"type": "notify_owner"},
            {"type": "auto_task", "task_type": "arrange_signing"}
        ],
        "auto_task_config": {
            "task_type": "arrange_signing",
            "title_template": "Ky HD: {contract_code}",
            "due_offset_minutes": 4320
        },
        "is_active": True,
        "priority": 1
    },
    {
        "rule_id": "contract_payment_overdue",
        "rule_name": "Thanh toan hop dong qua han",
        "description": "Nhac truoc 3 ngay den han thanh toan",
        "applies_to": "contract",
        "applies_to_status": "active",
        "time_threshold_minutes": 4320,  # 3 days before
        "warning_threshold_minutes": 7200,  # 5 days before
        "actions": [
            {"type": "auto_task", "task_type": "payment_reminder"},
            {"type": "notify_owner"}
        ],
        "auto_task_config": {
            "task_type": "payment_reminder",
            "title_template": "Thanh toan dot: {contract_code}",
            "due_offset_type": "before_deadline"
        },
        "is_active": True,
        "priority": 1
    }
]


# ============================================
# NO ACTIVITY DETECTION CONFIG
# ============================================

NO_ACTIVITY_CONFIG: Dict[str, Dict[str, Any]] = {
    "lead": {
        "threshold_days": 3,
        "warning_days": 2,
        "exclude_stages": ["converted", "lost", "disqualified"],
        "auto_task_type": "stale_lead_recovery",
        "notify_manager": False
    },
    "deal": {
        "threshold_days": 5,
        "warning_days": 3,
        "exclude_stages": ["won", "lost"],
        "auto_task_type": "stale_deal_recovery",
        "notify_manager": True
    },
    "booking": {
        "threshold_hours": 24,
        "warning_hours": 12,
        "applies_to_status": ["pending"],
        "notify_manager": True
    },
    "contract": {
        "threshold_hours": 48,
        "warning_hours": 24,
        "applies_to_status": ["pending_review", "pending_approval"],
        "escalate": True
    }
}


# ============================================
# ALL SLA RULES (Combined)
# ============================================

ALL_SLA_RULES = (
    LEAD_SLA_RULES + 
    DEAL_SLA_RULES + 
    BOOKING_SLA_RULES + 
    CONTRACT_SLA_RULES
)

SLA_RULES_BY_ENTITY: Dict[str, List[Dict[str, Any]]] = {
    "lead": LEAD_SLA_RULES,
    "deal": DEAL_SLA_RULES,
    "booking": BOOKING_SLA_RULES,
    "contract": CONTRACT_SLA_RULES
}
