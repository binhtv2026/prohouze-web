"""
Default Automation Rules
Prompt 19/20 - Automation Engine

Pre-configured rules for common use cases in real estate distribution.
These rules can be enabled/disabled by admin.
"""

from .business_events import EventType
from .rule_engine import (
    AutomationRule,
    RuleCondition,
    RuleAction,
    ActionType,
    ConditionOperator,
)


# ==================== LEAD INTAKE AUTOMATION ====================

LEAD_INTAKE_RULES = [
    # Rule 1: Auto-assign new lead to available sales
    AutomationRule(
        rule_id="rule_lead_auto_assign",
        name="Lead Auto Assignment",
        description="Tự động phân công lead mới cho sales có workload thấp nhất",
        domain="lead",
        trigger_event=EventType.LEAD_CREATED.value,
        conditions=[
            RuleCondition(
                field="has_owner",
                operator=ConditionOperator.EQUALS.value,
                value=False,
                source="computed"
            )
        ],
        actions=[
            RuleAction(
                action_type=ActionType.ASSIGN_OWNER.value,
                params={"auto_select": True},
            ),
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "Liên hệ lead mới",
                    "description": "Lead mới được phân công, liên hệ trong 2h",
                    "type": "first_contact",
                    "due_hours": 2
                },
                target_user_type="owner"
            )
        ],
        priority=80,
        is_enabled=False,  # Admin enables
        max_executions_per_hour=100,
        cooldown_minutes=0,
    ),
    
    # Rule 2: Create first-contact task for assigned lead
    AutomationRule(
        rule_id="rule_lead_first_contact",
        name="Lead First Contact Task",
        description="Tạo task liên hệ đầu tiên khi lead được assign",
        domain="lead",
        trigger_event=EventType.LEAD_ASSIGNED.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "Liên hệ lead: {full_name}",
                    "description": "Liên hệ lead mới được phân công",
                    "type": "first_contact",
                    "priority": "high",
                    "due_hours": 2
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Lead mới được phân công",
                    "message": "Bạn được phân công lead mới. Vui lòng liên hệ trong 2h.",
                    "priority": "high"
                },
                target_user_type="owner"
            )
        ],
        priority=75,
        is_enabled=False,
    ),
    
    # Rule 3: Escalate unassigned leads after 24h
    AutomationRule(
        rule_id="rule_lead_unassigned_escalate",
        name="Lead Unassigned Escalation",
        description="Escalate lead chưa assign sau 24h",
        domain="lead",
        trigger_event=EventType.LEAD_UNASSIGNED_DETECTED.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ESCALATE_TO_MANAGER.value,
                params={
                    "reason": "Lead chưa được phân công sau 24h"
                }
            ),
            RuleAction(
                action_type=ActionType.ADD_TAG.value,
                params={"tag": "unassigned_escalated"}
            )
        ],
        priority=85,
        is_enabled=False,
    ),
    
    # Rule 4: SLA Breach - No contact in 24h
    AutomationRule(
        rule_id="rule_lead_sla_breach",
        name="Lead SLA Breach Alert",
        description="Cảnh báo khi lead không được liên hệ trong 24h",
        domain="lead",
        trigger_event=EventType.LEAD_SLA_BREACH.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ESCALATE_TO_MANAGER.value,
                params={
                    "reason": "Lead chưa được liên hệ trong 24h - vi phạm SLA"
                }
            ),
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "SLA Breach - Lead chưa liên hệ",
                    "message": "Lead chưa được liên hệ trong 24h. Cần xử lý ngay!",
                    "priority": "high",
                    "type": "sla_breach"
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.UPDATE_FLAG.value,
                params={"flag": "sla_breached", "value": True}
            )
        ],
        priority=90,
        is_enabled=False,
    ),
]


# ==================== FOLLOW-UP AUTOMATION ====================

FOLLOWUP_RULES = [
    # Rule 1: Create follow-up when deal stage changes
    AutomationRule(
        rule_id="rule_deal_stage_followup",
        name="Deal Stage Change Follow-up",
        description="Tạo task follow-up khi deal chuyển stage",
        domain="deal",
        trigger_event=EventType.DEAL_STAGE_CHANGED.value,
        conditions=[
            RuleCondition(
                field="new_stage",
                operator=ConditionOperator.NOT_IN.value,
                value=["won", "lost", "completed"],
                source="payload"
            )
        ],
        actions=[
            RuleAction(
                action_type=ActionType.CREATE_FOLLOWUP.value,
                params={
                    "title": "Follow-up deal sau khi chuyển stage",
                    "description": "Deal vừa chuyển sang stage mới, cần follow-up",
                    "due_hours": 24
                },
                target_user_type="owner"
            )
        ],
        priority=60,
        is_enabled=False,
    ),
    
    # Rule 2: Alert on stale deals
    AutomationRule(
        rule_id="rule_deal_stale_alert",
        name="Stale Deal Alert",
        description="Cảnh báo deal không cập nhật > 7 ngày",
        domain="deal",
        trigger_event=EventType.DEAL_STALE_DETECTED.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Deal không cập nhật",
                    "message": "Deal của bạn không có cập nhật trong 7 ngày. Vui lòng kiểm tra!",
                    "priority": "medium",
                    "type": "stale_deal"
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "Kiểm tra deal stale",
                    "description": "Deal không cập nhật > 7 ngày, cần kiểm tra",
                    "type": "follow_up",
                    "due_hours": 48
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.ADD_TO_REVIEW_QUEUE.value,
                params={
                    "queue_type": "stale_deals",
                    "priority": "medium"
                }
            )
        ],
        priority=70,
        is_enabled=False,
    ),
    
    # Rule 3: Escalate high-risk deals
    AutomationRule(
        rule_id="rule_deal_high_risk_escalate",
        name="High Risk Deal Escalation",
        description="Escalate deal có rủi ro cao",
        domain="deal",
        trigger_event=EventType.AI_HIGH_RISK_DEAL.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ESCALATE_TO_MANAGER.value,
                params={
                    "reason": "Deal có rủi ro cao theo AI analysis"
                }
            ),
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Deal High Risk",
                    "message": "Deal của bạn được AI đánh giá rủi ro cao. Manager đã được thông báo.",
                    "priority": "high",
                    "type": "ai_alert"
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.ADD_TAG.value,
                params={"tag": "ai_high_risk"}
            )
        ],
        priority=85,
        is_enabled=False,
    ),
]


# ==================== BOOKING AUTOMATION ====================

BOOKING_RULES = [
    # Rule 1: Notify on booking expiring soon
    AutomationRule(
        rule_id="rule_booking_expiring_notify",
        name="Booking Expiry Notification",
        description="Thông báo booking sắp hết hạn (3 ngày)",
        domain="booking",
        trigger_event=EventType.BOOKING_EXPIRING.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Booking sắp hết hạn",
                    "message": "Booking sẽ hết hạn trong 3 ngày. Vui lòng liên hệ khách hàng!",
                    "priority": "high",
                    "type": "booking_expiry"
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "Liên hệ khách - Booking sắp hết hạn",
                    "description": "Booking sắp hết hạn, cần liên hệ khách hàng để xử lý",
                    "type": "urgent",
                    "priority": "high",
                    "due_hours": 24
                },
                target_user_type="owner"
            )
        ],
        priority=90,
        is_enabled=False,
    ),
    
    # Rule 2: Handle expired booking
    AutomationRule(
        rule_id="rule_booking_expired_handle",
        name="Booking Expired Handler",
        description="Xử lý booking đã hết hạn",
        domain="booking",
        trigger_event=EventType.BOOKING_EXPIRED.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ADD_TO_REVIEW_QUEUE.value,
                params={
                    "queue_type": "expired_bookings",
                    "priority": "high",
                    "reason": "Booking đã hết hạn cần review"
                }
            ),
            RuleAction(
                action_type=ActionType.ESCALATE_TO_MANAGER.value,
                params={
                    "reason": "Booking đã hết hạn - cần quyết định xử lý"
                }
            ),
            RuleAction(
                action_type=ActionType.UPDATE_FLAG.value,
                params={"flag": "needs_recovery", "value": True}
            )
        ],
        priority=95,
        requires_approval=False,  # Just queue, don't auto-release
        is_enabled=False,
    ),
]


# ==================== CONTRACT AUTOMATION ====================

CONTRACT_RULES = [
    # Rule 1: Notify reviewer on contract submission
    AutomationRule(
        rule_id="rule_contract_review_notify",
        name="Contract Review Notification",
        description="Thông báo reviewer khi contract submit",
        domain="contract",
        trigger_event=EventType.CONTRACT_SUBMITTED_FOR_REVIEW.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Contract cần review",
                    "message": "Có contract mới cần review",
                    "priority": "high",
                    "type": "contract_review"
                },
                target_user_type="role",
                target_role="legal"
            ),
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "Review contract mới",
                    "description": "Contract mới submit cần review",
                    "type": "review",
                    "priority": "high",
                    "due_hours": 48
                },
                target_user_type="role",
                target_role="legal"
            )
        ],
        priority=75,
        is_enabled=False,
    ),
    
    # Rule 2: Escalate overdue contract review
    AutomationRule(
        rule_id="rule_contract_review_overdue",
        name="Contract Review Overdue Escalation",
        description="Escalate contract review > 3 ngày",
        domain="contract",
        trigger_event=EventType.CONTRACT_REVIEW_OVERDUE.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ESCALATE_TO_MANAGER.value,
                params={
                    "reason": "Contract review đã quá 3 ngày"
                }
            ),
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Contract review quá hạn",
                    "message": "Contract đang chờ review > 3 ngày",
                    "priority": "high",
                    "type": "contract_overdue"
                },
                target_user_type="role",
                target_role="legal"
            )
        ],
        priority=80,
        is_enabled=False,
    ),
]


# ==================== AI-AUGMENTED AUTOMATION ====================

AI_RULES = [
    # Rule 1: Priority assign high-score lead
    AutomationRule(
        rule_id="rule_ai_high_score_lead",
        name="AI High Score Lead Priority",
        description="Ưu tiên xử lý lead có AI score cao",
        domain="lead",
        trigger_event=EventType.AI_HIGH_SCORE_LEAD.value,
        conditions=[
            RuleCondition(
                field="score",
                operator=ConditionOperator.GREATER_THAN_OR_EQUAL.value,
                value=80,
                source="payload"
            )
        ],
        actions=[
            RuleAction(
                action_type=ActionType.UPDATE_FLAG.value,
                params={"flag": "ai_hot_lead", "value": True}
            ),
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Hot Lead - AI Score cao",
                    "message": "Lead được AI đánh giá tiềm năng cao. Ưu tiên liên hệ!",
                    "priority": "high",
                    "type": "ai_hot_lead"
                },
                target_user_type="owner"
            ),
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "HOT LEAD - Liên hệ ngay",
                    "description": "Lead có AI score > 80, ưu tiên liên hệ",
                    "type": "priority_contact",
                    "priority": "high",
                    "due_hours": 1
                },
                target_user_type="owner"
            )
        ],
        priority=95,
        is_enabled=False,
    ),
    
    # Rule 2: Critical risk deal alert
    AutomationRule(
        rule_id="rule_ai_critical_risk_deal",
        name="AI Critical Risk Deal Alert",
        description="Cảnh báo khẩn cấp deal có risk critical",
        domain="deal",
        trigger_event=EventType.AI_CRITICAL_RISK_DEAL.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ESCALATE_TO_EXECUTIVE.value,
                params={
                    "reason": "Deal có risk CRITICAL theo AI - giá trị cao cần xử lý gấp"
                }
            ),
            RuleAction(
                action_type=ActionType.UPDATE_FLAG.value,
                params={"flag": "ai_critical_risk", "value": True}
            ),
            RuleAction(
                action_type=ActionType.ADD_TAG.value,
                params={"tag": "critical_risk"}
            ),
            RuleAction(
                action_type=ActionType.CREATE_AUDIT_ENTRY.value,
                params={
                    "action": "ai_critical_alert",
                    "details": {"reason": "AI detected critical risk"}
                }
            )
        ],
        priority=100,
        requires_approval=False,  # Alert only, no destructive action
        is_enabled=False,
    ),
    
    # Rule 3: Convert AI next-best-action to suggested task
    AutomationRule(
        rule_id="rule_ai_nba_to_task",
        name="AI Next-Best-Action to Task",
        description="Chuyển AI recommendation thành suggested task",
        domain="ai",
        trigger_event=EventType.AI_RECOMMENDATION_GENERATED.value,
        conditions=[
            RuleCondition(
                field="confidence",
                operator=ConditionOperator.GREATER_THAN_OR_EQUAL.value,
                value=0.7,
                source="payload"
            )
        ],
        actions=[
            RuleAction(
                action_type=ActionType.CREATE_AI_SUGGESTED_TASK.value,
                params={
                    "title": "AI Suggested: {action_label}",
                    "description": "AI recommends this action with {confidence}% confidence",
                    "type": "ai_suggested",
                    "priority": "medium",
                    "due_hours": 24
                },
                target_user_type="owner"
            )
        ],
        priority=70,
        is_enabled=False,
    ),
]


# ==================== DATA QUALITY AUTOMATION ====================

DATA_QUALITY_RULES = [
    # Rule 1: Create review queue for import errors
    AutomationRule(
        rule_id="rule_import_errors_queue",
        name="Import Errors Review Queue",
        description="Tạo queue review khi import có lỗi",
        domain="data",
        trigger_event=EventType.DATA_IMPORT_ERRORS.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ADD_TO_REVIEW_QUEUE.value,
                params={
                    "queue_type": "import_errors",
                    "priority": "medium"
                }
            ),
            RuleAction(
                action_type=ActionType.SEND_NOTIFICATION.value,
                params={
                    "title": "Import có lỗi cần review",
                    "message": "Có data import errors cần kiểm tra",
                    "priority": "medium",
                    "type": "data_quality"
                },
                target_user_type="role",
                target_role="admin"
            )
        ],
        priority=60,
        is_enabled=False,
    ),
    
    # Rule 2: Create merge review for duplicates
    AutomationRule(
        rule_id="rule_duplicate_merge_review",
        name="Duplicate Merge Review",
        description="Tạo review khi phát hiện duplicate",
        domain="data",
        trigger_event=EventType.DATA_DUPLICATE_DETECTED.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.ADD_TO_REVIEW_QUEUE.value,
                params={
                    "queue_type": "duplicate_review",
                    "priority": "medium",
                    "reason": "Duplicate detected - needs merge review"
                }
            )
        ],
        priority=55,
        is_enabled=False,
    ),
]


# ==================== MARKETING AUTOMATION ====================

MARKETING_RULES = [
    # Rule 1: Create lead from form submission
    AutomationRule(
        rule_id="rule_form_to_lead",
        name="Form Submission to Lead",
        description="Tự động tạo lead từ form submit",
        domain="marketing",
        trigger_event=EventType.MARKETING_FORM_SUBMITTED.value,
        conditions=[],
        actions=[
            RuleAction(
                action_type=ActionType.CREATE_TASK.value,
                params={
                    "title": "Xử lý lead từ form",
                    "description": "Lead mới từ marketing form, cần liên hệ sớm",
                    "type": "marketing_lead",
                    "priority": "high",
                    "due_hours": 4
                },
                target_user_type="role",
                target_role="marketing"
            ),
            RuleAction(
                action_type=ActionType.ADD_TAG.value,
                params={"tag": "marketing_form"}
            )
        ],
        priority=80,
        is_enabled=False,
    ),
]


# ==================== ALL DEFAULT RULES ====================

ALL_DEFAULT_RULES = (
    LEAD_INTAKE_RULES +
    FOLLOWUP_RULES +
    BOOKING_RULES +
    CONTRACT_RULES +
    AI_RULES +
    DATA_QUALITY_RULES +
    MARKETING_RULES
)


async def seed_default_rules(db):
    """Seed default rules into database."""
    collection = db["automation_rules"]
    
    seeded = 0
    for rule in ALL_DEFAULT_RULES:
        # Check if exists
        existing = await collection.find_one({"rule_id": rule.rule_id})
        if not existing:
            await collection.insert_one(rule.to_dict())
            seeded += 1
    
    return seeded
