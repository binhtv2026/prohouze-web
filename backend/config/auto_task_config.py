"""
ProHouzing Auto Task Configuration
Prompt 10/20 - Task, Reminder & Follow-up Operating System

Auto task generation rules triggered by business events
"""

from enum import Enum
from typing import Dict, Any, List


# ============================================
# TRIGGER EVENTS
# ============================================

class TriggerEvent(str, Enum):
    # Lead triggers
    LEAD_CREATED = "lead_created"
    LEAD_STAGE_CHANGED = "lead_stage_changed"
    LEAD_NO_ACTIVITY = "lead_no_activity"
    
    # Deal triggers
    DEAL_CREATED = "deal_created"
    DEAL_STAGE_CHANGED = "deal_stage_changed"
    DEAL_NO_ACTIVITY = "deal_no_activity"
    
    # Booking triggers
    BOOKING_CREATED = "booking_created"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_PAYMENT_DUE = "booking_payment_due"
    
    # Contract triggers
    CONTRACT_DRAFT_CREATED = "contract_draft_created"
    CONTRACT_APPROVED = "contract_approved"
    CONTRACT_PAYMENT_DUE = "contract_payment_due"
    
    # Activity triggers
    SITE_VISIT_SCHEDULED = "site_visit_scheduled"
    SITE_VISIT_COMPLETED = "site_visit_completed"
    MISSED_CALL = "missed_call"


# ============================================
# ASSIGNEE RULES
# ============================================

class AssigneeRule(str, Enum):
    ENTITY_OWNER = "entity_owner"
    ENTITY_SALES = "entity_sales"
    SPECIFIC_ROLE = "specific_role"
    SPECIFIC_USER = "specific_user"
    ROUND_ROBIN = "round_robin"


# ============================================
# DUE RULES
# ============================================

class DueRule(str, Enum):
    OFFSET_MINUTES = "offset_minutes"
    OFFSET_HOURS = "offset_hours"
    OFFSET_DAYS = "offset_days"
    ENTITY_DEADLINE = "entity_deadline"
    BEFORE_DEADLINE = "before_deadline"
    END_OF_DAY = "end_of_day"


# ============================================
# AUTO TASK RULES - LEAD
# ============================================

LEAD_AUTO_TASK_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "lead_created_call",
        "rule_name": "Goi lead moi",
        "trigger_event": "lead_created",
        "trigger_condition": None,
        "task_type": "call_customer",
        "title_template": "Goi lead moi: {customer_name}",
        "description_template": "Lead moi tu {source}. Hay lien he trong vong 15 phut.",
        "assignee_rule": "entity_owner",
        "assignee_role": None,
        "due_rule": "offset_minutes",
        "due_value": 15,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "lead_qualified_site_visit",
        "rule_name": "Hen tham quan lead qualified",
        "trigger_event": "lead_stage_changed",
        "trigger_condition": {"new_stage": "qualified"},
        "task_type": "arrange_site_visit",
        "title_template": "Hen tham quan: {customer_name}",
        "description_template": "Lead da qualified. Hen tham quan du an.",
        "assignee_rule": "entity_owner",
        "due_rule": "offset_days",
        "due_value": 1,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "lead_stale_recovery",
        "rule_name": "Khoi phuc lead im lang",
        "trigger_event": "lead_no_activity",
        "trigger_condition": {"days_inactive": 3},
        "task_type": "stale_lead_recovery",
        "title_template": "Khoi phuc lead: {customer_name}",
        "description_template": "Lead khong co hoat dong trong {days_inactive} ngay.",
        "assignee_rule": "entity_owner",
        "due_rule": "offset_hours",
        "due_value": 4,
        "priority": "medium",
        "is_active": True
    }
]


# ============================================
# AUTO TASK RULES - DEAL
# ============================================

DEAL_AUTO_TASK_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "deal_site_visit_scheduled",
        "rule_name": "Chuan bi tham quan",
        "trigger_event": "deal_stage_changed",
        "trigger_condition": {"new_stage": "site_visit_scheduled"},
        "task_type": "arrange_site_visit",
        "title_template": "Chuan bi tham quan: {product_code}",
        "description_template": "Deal chuyen sang tham quan. Chuan bi ho so va lich hen.",
        "assignee_rule": "entity_sales",
        "due_rule": "entity_deadline",
        "due_value": None,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "deal_site_visit_followup",
        "rule_name": "Follow-up sau tham quan",
        "trigger_event": "deal_stage_changed",
        "trigger_condition": {"new_stage": "site_visit_completed"},
        "task_type": "follow_up_visit",
        "title_template": "Follow-up tham quan: {customer_name}",
        "description_template": "Khach da tham quan. Follow-up ngay de chot deal.",
        "assignee_rule": "entity_sales",
        "due_rule": "offset_hours",
        "due_value": 4,
        "priority": "urgent",
        "is_active": True
    },
    {
        "rule_id": "deal_negotiation_price",
        "rule_name": "Gui chinh sach gia",
        "trigger_event": "deal_stage_changed",
        "trigger_condition": {"new_stage": "negotiation"},
        "task_type": "send_price_sheet",
        "title_template": "Gui chinh sach: {customer_name}",
        "description_template": "Khach dang dam phan. Gui chinh sach gia va PTTT.",
        "assignee_rule": "entity_sales",
        "due_rule": "offset_hours",
        "due_value": 2,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "deal_stale_recovery",
        "rule_name": "Khoi phuc deal im lang",
        "trigger_event": "deal_no_activity",
        "trigger_condition": {"days_inactive": 5},
        "task_type": "stale_deal_recovery",
        "title_template": "Khoi phuc deal: {deal_name}",
        "description_template": "Deal khong co hoat dong trong {days_inactive} ngay. Can follow-up gap.",
        "assignee_rule": "entity_sales",
        "due_rule": "offset_hours",
        "due_value": 4,
        "priority": "high",
        "is_active": True
    }
]


# ============================================
# AUTO TASK RULES - BOOKING
# ============================================

BOOKING_AUTO_TASK_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "booking_created_followup",
        "rule_name": "Follow-up booking moi",
        "trigger_event": "booking_created",
        "trigger_condition": None,
        "task_type": "booking_follow_up",
        "title_template": "Xac nhan booking: {product_code}",
        "description_template": "Booking moi tao. Xac nhan lai voi khach hang.",
        "assignee_rule": "entity_sales",
        "due_rule": "offset_hours",
        "due_value": 2,
        "priority": "urgent",
        "is_active": True
    },
    {
        "rule_id": "booking_confirmed_document",
        "rule_name": "Thu thap ho so sau confirm",
        "trigger_event": "booking_confirmed",
        "trigger_condition": None,
        "task_type": "document_collection",
        "title_template": "Thu thap ho so: {customer_name}",
        "description_template": "Booking da xac nhan. Thu thap ho so de lam hop dong.",
        "assignee_rule": "specific_role",
        "assignee_role": "back_office",
        "due_rule": "offset_days",
        "due_value": 2,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "booking_payment_reminder",
        "rule_name": "Nhac thanh toan booking",
        "trigger_event": "booking_payment_due",
        "trigger_condition": {"days_before": 3},
        "task_type": "payment_reminder",
        "title_template": "Nhac thanh toan: {customer_name}",
        "description_template": "Con {days_before} ngay den han thanh toan booking.",
        "assignee_rule": "entity_sales",
        "due_rule": "entity_deadline",
        "due_value": None,
        "priority": "high",
        "is_active": True
    }
]


# ============================================
# AUTO TASK RULES - CONTRACT
# ============================================

CONTRACT_AUTO_TASK_RULES: List[Dict[str, Any]] = [
    {
        "rule_id": "contract_draft_review",
        "rule_name": "Review hop dong moi",
        "trigger_event": "contract_draft_created",
        "trigger_condition": None,
        "task_type": "contract_review",
        "title_template": "Review HD: {contract_code}",
        "description_template": "Hop dong moi tao. Kiem tra truoc khi trinh duyet.",
        "assignee_rule": "specific_role",
        "assignee_role": "legal",
        "due_rule": "offset_days",
        "due_value": 1,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "contract_approved_signing",
        "rule_name": "Sap xep ky hop dong",
        "trigger_event": "contract_approved",
        "trigger_condition": None,
        "task_type": "arrange_signing",
        "title_template": "Ky HD: {contract_code}",
        "description_template": "Hop dong da duyet. Sap xep lich ky voi khach hang.",
        "assignee_rule": "entity_owner",
        "due_rule": "offset_days",
        "due_value": 3,
        "priority": "high",
        "is_active": True
    },
    {
        "rule_id": "contract_payment_reminder",
        "rule_name": "Nhac thanh toan hop dong",
        "trigger_event": "contract_payment_due",
        "trigger_condition": {"days_before": 3},
        "task_type": "payment_reminder",
        "title_template": "Thanh toan dot: {contract_code}",
        "description_template": "Con {days_before} ngay den han thanh toan dot {installment_number}.",
        "assignee_rule": "entity_sales",
        "due_rule": "entity_deadline",
        "due_value": None,
        "priority": "high",
        "is_active": True
    }
]


# ============================================
# FOLLOW-UP CHAIN TEMPLATES
# ============================================

FOLLOW_UP_CHAINS: Dict[str, List[Dict[str, Any]]] = {
    "new_lead": [
        {
            "step": 1,
            "task_type": "call_customer",
            "delay_type": "immediate",
            "delay_value": 0
        },
        {
            "step": 2,
            "task_type": "send_brochure",
            "delay_type": "after_complete",
            "condition": {"outcome": "success"}
        },
        {
            "step": 3,
            "task_type": "arrange_site_visit",
            "delay_type": "offset_days",
            "delay_value": 1,
            "condition": {"outcome": "success"}
        }
    ],
    "site_visit": [
        {
            "step": 1,
            "task_type": "follow_up_visit",
            "delay_type": "offset_hours",
            "delay_value": 4
        },
        {
            "step": 2,
            "task_type": "send_price_sheet",
            "delay_type": "after_complete",
            "condition": {"outcome": "success"}
        },
        {
            "step": 3,
            "task_type": "booking_follow_up",
            "delay_type": "offset_days",
            "delay_value": 1,
            "condition": {"outcome": "success"}
        }
    ],
    "booking_confirmed": [
        {
            "step": 1,
            "task_type": "document_collection",
            "delay_type": "immediate",
            "delay_value": 0
        },
        {
            "step": 2,
            "task_type": "payment_reminder",
            "delay_type": "before_deadline",
            "delay_value": 3,  # 3 days before
            "relative_to": "payment_due"
        },
        {
            "step": 3,
            "task_type": "contract_review",
            "delay_type": "after_complete",
            "condition": {"documents_complete": True}
        }
    ]
}


# ============================================
# ALL AUTO TASK RULES
# ============================================

ALL_AUTO_TASK_RULES = (
    LEAD_AUTO_TASK_RULES +
    DEAL_AUTO_TASK_RULES +
    BOOKING_AUTO_TASK_RULES +
    CONTRACT_AUTO_TASK_RULES
)

AUTO_TASK_RULES_BY_TRIGGER: Dict[str, List[Dict[str, Any]]] = {}
for rule in ALL_AUTO_TASK_RULES:
    trigger = rule["trigger_event"]
    if trigger not in AUTO_TASK_RULES_BY_TRIGGER:
        AUTO_TASK_RULES_BY_TRIGGER[trigger] = []
    AUTO_TASK_RULES_BY_TRIGGER[trigger].append(rule)
