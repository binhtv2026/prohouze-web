"""
Default Rules for Phase 2 Integration
Prompt 19.5 - Automation Engine

These rules handle the new snake_case events:
- lead_created, lead_assigned, lead_sla_breach
- deal_stage_changed, deal_stale_detected, high_value_deal_detected
- booking_created, booking_expiring, booking_expired
"""

from typing import Dict, Any, List
from datetime import datetime, timezone


def get_phase2_rules() -> List[Dict[str, Any]]:
    """
    Return default rules for Phase 2 Integration.
    
    These rules follow the event naming convention:
    - All event types use snake_case
    - All rules have proper conditions and actions
    """
    
    now = datetime.now(timezone.utc).isoformat()
    
    rules = [
        # ==================== LEAD RULES ====================
        
        # Rule 1: Lead Created - Auto Assign + Create Welcome Task
        {
            "rule_id": "rule_lead_created_auto_assign",
            "name": "Lead Created - Auto Assign & Welcome Task",
            "description": "Khi lead được tạo, auto assign và tạo task welcome call",
            "domain": "lead",
            "trigger_event": "lead_created",
            "conditions": [],  # Always run for new leads
            "actions": [
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Welcome Call - Lead mới",
                        "description": "Gọi điện chào đón lead mới trong vòng 2h",
                        "due_hours": 2,
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "system_note",
                        "subject": "Lead đã được nhận qua hệ thống automation"
                    }
                }
            ],
            "priority": 90,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 100,
            "max_executions_per_day": 1000,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 2: Lead Assigned - Notify Sales
        {
            "rule_id": "rule_lead_assigned_notify",
            "name": "Lead Assigned - Notify Sales",
            "description": "Thông báo khi lead được phân bổ cho sales",
            "domain": "lead",
            "trigger_event": "lead_assigned",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "Lead mới được phân bổ cho bạn",
                        "type": "lead_assigned",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 80,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 100,
            "max_executions_per_day": 500,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 3: Lead SLA Breach - Escalate
        {
            "rule_id": "rule_lead_sla_breach_escalate",
            "name": "Lead SLA Breach - Escalate",
            "description": "Cảnh báo manager khi lead vượt SLA 24h không liên hệ",
            "domain": "lead",
            "trigger_event": "lead_sla_breach",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "CẢNH BÁO: Lead vượt SLA",
                        "type": "sla_breach",
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "escalate_to_manager",
                    "params": {
                        "reason": "Lead không được liên hệ trong 24h"
                    }
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "KHẨN: Liên hệ lead ngay",
                        "description": "Lead đã vượt SLA, cần liên hệ ngay lập tức",
                        "due_hours": 1,
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 95,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 60,  # Don't spam - once per hour max per lead
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # ==================== DEAL RULES ====================
        
        # Rule 4: Deal Stage Changed - Track & Notify
        {
            "rule_id": "rule_deal_stage_changed_track",
            "name": "Deal Stage Changed - Track Progress",
            "description": "Log và notify khi deal chuyển stage",
            "domain": "deal",
            "trigger_event": "deal_stage_changed",
            "conditions": [],
            "actions": [
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "stage_change",
                        "subject": "Deal chuyển sang giai đoạn mới"
                    }
                },
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "Deal đã chuyển stage",
                        "type": "deal_progress",
                        "priority": "medium"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 70,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 100,
            "max_executions_per_day": 500,
            "cooldown_minutes": 5,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 5: Deal Stale - Alert & Create Follow-up Task
        {
            "rule_id": "rule_deal_stale_alert",
            "name": "Deal Stale - Alert & Follow-up",
            "description": "Cảnh báo khi deal không có hoạt động trong 7 ngày",
            "domain": "deal",
            "trigger_event": "deal_stale_detected",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "CẢNH BÁO: Deal đang stale",
                        "type": "deal_stale",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Follow-up deal stale",
                        "description": "Deal không có hoạt động 7 ngày, cần follow-up ngay",
                        "due_hours": 4,
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 85,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 120,  # Once per 2 hours per deal
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 6: High Value Deal - Priority Handling
        {
            "rule_id": "rule_high_value_deal_priority",
            "name": "High Value Deal - Priority Handling",
            "description": "Deal > 5 tỷ cần được xử lý ưu tiên và notify manager",
            "domain": "deal",
            "trigger_event": "high_value_deal_detected",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "DEAL LỚN: Cần xử lý ưu tiên",
                        "type": "high_value_deal",
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "notify_manager",
                    "params": {
                        "title": "Deal lớn mới - Cần theo dõi",
                        "type": "high_value_alert"
                    }
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Prepare VIP presentation",
                        "description": "Chuẩn bị tài liệu và presentation cho deal lớn",
                        "due_hours": 24,
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 95,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 20,
            "max_executions_per_day": 50,
            "cooldown_minutes": 60,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # ==================== BOOKING RULES ====================
        
        # Rule 7: Booking Created - Confirm & Notify
        {
            "rule_id": "rule_booking_created_confirm",
            "name": "Booking Created - Confirmation",
            "description": "Xác nhận booking mới và thông báo cho các bên liên quan",
            "domain": "booking",
            "trigger_event": "booking_created",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "Booking mới đã được tạo",
                        "type": "booking_created",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Follow-up booking confirmation",
                        "description": "Gọi điện xác nhận booking với khách hàng",
                        "due_hours": 4,
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 80,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 8: Booking Expiring - Urgent Reminder
        {
            "rule_id": "rule_booking_expiring_remind",
            "name": "Booking Expiring - Urgent Reminder",
            "description": "Nhắc nhở khi booking sắp hết hạn (24h)",
            "domain": "booking",
            "trigger_event": "booking_expiring",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "KHẨN: Booking sắp hết hạn",
                        "type": "booking_expiring",
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "KHẨN: Xử lý booking sắp hết hạn",
                        "description": "Liên hệ khách hàng để gia hạn hoặc chốt deal",
                        "due_hours": 2,
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 95,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 30,
            "max_executions_per_day": 100,
            "cooldown_minutes": 120,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 9: Booking Expired - Post-mortem
        {
            "rule_id": "rule_booking_expired_postmortem",
            "name": "Booking Expired - Post-mortem & Recovery",
            "description": "Log và tạo task recovery khi booking hết hạn",
            "domain": "booking",
            "trigger_event": "booking_expired",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "Booking đã hết hạn",
                        "type": "booking_expired",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "booking_expired",
                        "subject": "Booking đã hết hạn - Cần xem xét recovery"
                    }
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Recovery: Liên hệ lại KH sau booking expired",
                        "description": "Tìm hiểu lý do và đề xuất giải pháp mới",
                        "due_hours": 48,
                        "priority": "medium"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 70,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 20,
            "max_executions_per_day": 100,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    return rules


async def seed_phase2_rules(db) -> Dict[str, Any]:
    """
    Seed Phase 2 rules into database.
    
    Returns count of rules created/updated.
    """
    rules = get_phase2_rules()
    created = 0
    updated = 0
    
    for rule in rules:
        existing = await db.automation_rules.find_one({"rule_id": rule["rule_id"]})
        
        if existing:
            # Update existing rule
            await db.automation_rules.update_one(
                {"rule_id": rule["rule_id"]},
                {"$set": rule}
            )
            updated += 1
        else:
            # Insert new rule
            await db.automation_rules.insert_one(rule)
            created += 1
    
    return {
        "total": len(rules),
        "created": created,
        "updated": updated
    }
