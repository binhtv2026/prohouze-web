"""
Phase 3: Revenue-Driven Use-Case Automation
Prompt 19.5 - Automation Engine

CORE PRINCIPLES:
1. Automation gắn với tiền (deal_value, lead_score)
2. Mọi task có deadline
3. Escalation nếu không action
4. Multi-step flows

FLOWS:
1. Lead Intake (Hot Lead Priority)
2. High Value Deal Handling
3. Stale Deal Recovery
4. Booking Expiry Management
"""

from typing import Dict, Any, List
from datetime import datetime, timezone


# ==================== CONDITION HELPERS ====================

def condition_lead_score_gt(score: int) -> Dict[str, Any]:
    """Condition: lead_score > threshold."""
    return {
        "field": "payload.lead_score",
        "operator": "gt",
        "value": score,
        "fallback_field": "entity.score"
    }

def condition_deal_value_gt(value: int) -> Dict[str, Any]:
    """Condition: deal_value > threshold (in VND)."""
    return {
        "field": "payload.deal_value",
        "operator": "gt",
        "value": value,
        "fallback_field": "entity.deal_value"
    }

def condition_days_stale_gt(days: int) -> Dict[str, Any]:
    """Condition: days since last activity > threshold."""
    return {
        "field": "payload.days_since_activity",
        "operator": "gt",
        "value": days
    }

def condition_source_is(source: str) -> Dict[str, Any]:
    """Condition: lead source equals."""
    return {
        "field": "payload.source",
        "operator": "eq",
        "value": source
    }


# ==================== PHASE 3 RULES ====================

def get_phase3_rules() -> List[Dict[str, Any]]:
    """
    Return Phase 3 Revenue-Driven Automation Rules.
    
    ALL rules have:
    - Deadline
    - Escalation chain
    - Revenue-based priority
    """
    
    now = datetime.now(timezone.utc).isoformat()
    
    rules = [
        # ================================================================
        # LEAD INTAKE FLOW - QUAN TRỌNG NHẤT
        # ================================================================
        
        # Rule 1: HOT LEAD (score > 80) - IMMEDIATE ACTION
        {
            "rule_id": "rule_lead_hot_immediate",
            "name": "HOT LEAD - Xử lý NGAY (score > 80)",
            "description": "Lead nóng phải được gọi trong 5 phút, nếu không sẽ escalate",
            "domain": "lead",
            "trigger_event": "lead_created",
            "conditions": [
                condition_lead_score_gt(80)
            ],
            "actions": [
                # Step 1: Assign to best sales
                {
                    "action_type": "assign_best_performer",
                    "params": {
                        "criteria": "conversion_rate",
                        "min_capacity": True
                    },
                    "target_user_type": "sales_team"
                },
                # Step 2: Create URGENT task (5 min deadline)
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "🔥 GỌI NGAY - Lead nóng score > 80",
                        "description": "Lead có điểm cao, khả năng chốt deal rất cao. Gọi NGAY trong 5 phút!",
                        "due_minutes": 5,
                        "priority": "critical",
                        "escalation_minutes": 5,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                # Step 3: Send urgent notification
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "🔥 LEAD NÓNG - Xử lý NGAY",
                        "message": "Lead mới score > 80, cần gọi trong 5 PHÚT",
                        "type": "hot_lead",
                        "priority": "critical",
                        "sound": True,
                        "vibrate": True
                    },
                    "target_user_type": "owner"
                },
                # Step 4: Notify manager for awareness
                {
                    "action_type": "notify_manager",
                    "params": {
                        "title": "Lead nóng vừa vào hệ thống",
                        "type": "hot_lead_alert"
                    }
                },
                # Step 5: Log activity
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "hot_lead_intake",
                        "subject": "Lead nóng (score > 80) được phân bổ ưu tiên"
                    }
                }
            ],
            "priority": 100,  # Highest priority
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 0,
            "stop_on_match": True,  # Don't run other lead_created rules
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 2: WARM LEAD (score 50-80)
        {
            "rule_id": "rule_lead_warm_priority",
            "name": "WARM LEAD - Ưu tiên cao (score 50-80)",
            "description": "Lead ấm cần được liên hệ trong 30 phút",
            "domain": "lead",
            "trigger_event": "lead_created",
            "conditions": [
                condition_lead_score_gt(50),
                {
                    "field": "payload.lead_score",
                    "operator": "lte",
                    "value": 80,
                    "fallback_field": "entity.score"
                }
            ],
            "actions": [
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "⚡ Liên hệ lead ấm (30 phút)",
                        "description": "Lead có tiềm năng tốt, liên hệ trong 30 phút để không mất cơ hội",
                        "due_minutes": 30,
                        "priority": "high",
                        "escalation_minutes": 30,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "Lead ấm cần xử lý",
                        "type": "warm_lead",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 85,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 100,
            "max_executions_per_day": 500,
            "cooldown_minutes": 0,
            "stop_on_match": True,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 3: STANDARD LEAD (score < 50)
        {
            "rule_id": "rule_lead_standard_followup",
            "name": "STANDARD LEAD - Follow-up 2h",
            "description": "Lead tiêu chuẩn, follow-up trong 2 giờ",
            "domain": "lead",
            "trigger_event": "lead_created",
            "conditions": [
                {
                    "field": "payload.lead_score",
                    "operator": "lte",
                    "value": 50,
                    "fallback_field": "entity.score"
                }
            ],
            "actions": [
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Liên hệ lead mới",
                        "description": "Lead mới cần được liên hệ trong 2 giờ",
                        "due_hours": 2,
                        "priority": "medium",
                        "escalation_hours": 4,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "Lead mới được phân bổ",
                        "type": "new_lead",
                        "priority": "medium"
                    },
                    "target_user_type": "owner"
                }
            ],
            "priority": 60,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 200,
            "max_executions_per_day": 1000,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 4: Lead SLA Breach - ESCALATION
        {
            "rule_id": "rule_lead_sla_escalate",
            "name": "Lead SLA Breach - ESCALATION",
            "description": "Khi lead vượt SLA, escalate theo chuỗi: Sales → Manager → Director",
            "domain": "lead",
            "trigger_event": "lead_sla_breach",
            "conditions": [],
            "actions": [
                # Step 1: Urgent notification to owner
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "⚠️ SLA BREACH - Xử lý KHẨN",
                        "message": "Lead đã vượt SLA, cần xử lý ngay để tránh mất khách",
                        "type": "sla_breach",
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                },
                # Step 2: Escalate to manager
                {
                    "action_type": "escalate_to_manager",
                    "params": {
                        "reason": "Lead vượt SLA - Sales không xử lý đúng hạn",
                        "include_lead_details": True
                    }
                },
                # Step 3: Create critical task
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "⚠️ KHẨN: Lead vượt SLA cần xử lý",
                        "description": "Lead đã quá hạn SLA, gọi NGAY và cập nhật trạng thái",
                        "due_minutes": 30,
                        "priority": "critical",
                        "escalation_minutes": 30,
                        "escalation_to": "director"
                    },
                    "target_user_type": "owner"
                },
                # Step 4: Flag lead as at-risk
                {
                    "action_type": "add_tag",
                    "params": {
                        "tag": "sla_breach",
                        "color": "red"
                    }
                }
            ],
            "priority": 95,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 60,  # Don't spam - once per hour per lead
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # ================================================================
        # HIGH VALUE DEAL FLOW
        # ================================================================
        
        # Rule 5: Deal > 3 Tỷ - VIP Treatment
        {
            "rule_id": "rule_deal_vip_3b",
            "name": "DEAL VIP (> 3 tỷ) - Chăm sóc đặc biệt",
            "description": "Deal > 3 tỷ cần senior sales và sự theo dõi của manager",
            "domain": "deal",
            "trigger_event": "high_value_deal_detected",
            "conditions": [
                condition_deal_value_gt(3_000_000_000)  # 3 billion
            ],
            "actions": [
                # Step 1: Assign senior sales
                {
                    "action_type": "assign_senior_sales",
                    "params": {
                        "min_experience_years": 2,
                        "min_deals_won": 10,
                        "reason": "Deal VIP cần senior sales"
                    }
                },
                # Step 2: Notify manager
                {
                    "action_type": "notify_manager",
                    "params": {
                        "title": "💎 DEAL VIP MỚI > 3 TỶ",
                        "message": "Deal lớn cần theo dõi sát",
                        "type": "vip_deal",
                        "priority": "high"
                    }
                },
                # Step 3: Create VIP care task
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "💎 Chăm sóc DEAL VIP > 3 tỷ",
                        "description": "Deal VIP, cần chuẩn bị tài liệu đặc biệt và chăm sóc cẩn thận",
                        "due_hours": 1,
                        "priority": "critical",
                        "escalation_hours": 2,
                        "escalation_to": "director"
                    },
                    "target_user_type": "owner"
                },
                # Step 4: Add VIP tag
                {
                    "action_type": "add_tag",
                    "params": {
                        "tag": "vip_deal",
                        "color": "gold"
                    }
                },
                # Step 5: Create activity
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "vip_deal_created",
                        "subject": "Deal VIP > 3 tỷ được tạo - Ưu tiên xử lý"
                    }
                }
            ],
            "priority": 98,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 20,
            "max_executions_per_day": 50,
            "cooldown_minutes": 0,
            "stop_on_match": True,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 6: Deal 1-3 Tỷ - High Priority
        {
            "rule_id": "rule_deal_high_1b_3b",
            "name": "DEAL CAO (1-3 tỷ) - Ưu tiên cao",
            "description": "Deal 1-3 tỷ cần chăm sóc đặc biệt",
            "domain": "deal",
            "trigger_event": "high_value_deal_detected",
            "conditions": [
                condition_deal_value_gt(1_000_000_000),  # 1 billion
                {
                    "field": "payload.deal_value",
                    "operator": "lte",
                    "value": 3_000_000_000,  # 3 billion
                    "fallback_field": "entity.deal_value"
                }
            ],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "💰 Deal lớn (1-3 tỷ) cần chú ý",
                        "type": "high_value_deal",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "💰 Chăm sóc deal 1-3 tỷ",
                        "description": "Deal giá trị cao, cần follow-up kỹ",
                        "due_hours": 2,
                        "priority": "high",
                        "escalation_hours": 4,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "notify_manager",
                    "params": {
                        "title": "Deal 1-3 tỷ mới",
                        "type": "high_deal_alert"
                    }
                }
            ],
            "priority": 90,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 30,
            "max_executions_per_day": 100,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # ================================================================
        # STALE DEAL RECOVERY
        # ================================================================
        
        # Rule 7: Stale Deal > 1 Tỷ - Re-engage
        {
            "rule_id": "rule_deal_stale_1b_reengage",
            "name": "STALE DEAL (> 1 tỷ) - Re-engage khẩn",
            "description": "Deal > 1 tỷ không có hoạt động cần được re-engage ngay",
            "domain": "deal",
            "trigger_event": "deal_stale_detected",
            "conditions": [
                condition_deal_value_gt(1_000_000_000)
            ],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "⚠️ DEAL LỚN ĐANG STALE",
                        "message": "Deal > 1 tỷ không có hoạt động, cần re-engage ngay",
                        "type": "stale_deal_urgent",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "⚠️ Re-engage deal lớn đang stale",
                        "description": "Gọi lại khách + Gửi ưu đãi đặc biệt nếu cần",
                        "due_hours": 24,
                        "priority": "high",
                        "escalation_hours": 48,
                        "escalation_to": "manager",
                        "suggested_actions": [
                            "Gọi điện tìm hiểu tình hình",
                            "Gửi ưu đãi đặc biệt",
                            "Đề xuất xem nhà lại",
                            "Mời tham gia event"
                        ]
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "add_tag",
                    "params": {
                        "tag": "needs_recovery",
                        "color": "orange"
                    }
                }
            ],
            "priority": 85,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 30,
            "max_executions_per_day": 100,
            "cooldown_minutes": 120,  # Once per 2 hours per deal
            "stop_on_match": True,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 8: Stale Deal > 3 days - Manager Escalation
        {
            "rule_id": "rule_deal_stale_3d_escalate",
            "name": "STALE DEAL > 3 ngày - Escalate Manager",
            "description": "Deal stale > 3 ngày cần manager can thiệp",
            "domain": "deal",
            "trigger_event": "deal_stale_detected",
            "conditions": [
                condition_days_stale_gt(3)
            ],
            "actions": [
                {
                    "action_type": "escalate_to_manager",
                    "params": {
                        "reason": "Deal stale > 3 ngày không có hoạt động",
                        "include_deal_details": True,
                        "suggested_action": "Review và đưa ra strategy mới"
                    }
                },
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "⚠️ Deal stale quá 3 ngày - Manager cần review",
                        "type": "manager_escalation",
                        "priority": "high"
                    },
                    "target_user_type": "manager"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Manager Review: Deal stale > 3 ngày",
                        "description": "Đánh giá và đưa ra chiến lược recovery",
                        "due_hours": 24,
                        "priority": "high",
                        "escalation_hours": 48,
                        "escalation_to": "director"
                    },
                    "target_user_type": "manager"
                }
            ],
            "priority": 88,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 20,
            "max_executions_per_day": 50,
            "cooldown_minutes": 240,  # Once per 4 hours
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 9: Stale Deal > 7 days - AT RISK + Director Alert
        {
            "rule_id": "rule_deal_stale_7d_at_risk",
            "name": "STALE DEAL > 7 ngày - AT RISK",
            "description": "Deal stale > 7 ngày được đánh dấu AT RISK và báo Director",
            "domain": "deal",
            "trigger_event": "deal_stale_detected",
            "conditions": [
                condition_days_stale_gt(7)
            ],
            "actions": [
                {
                    "action_type": "update_status",
                    "params": {
                        "status": "at_risk",
                        "reason": "Stale > 7 ngày"
                    }
                },
                {
                    "action_type": "add_tag",
                    "params": {
                        "tag": "at_risk",
                        "color": "red"
                    }
                },
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "🚨 DEAL AT RISK - 7 ngày không hoạt động",
                        "type": "deal_at_risk",
                        "priority": "critical"
                    },
                    "target_user_type": "director"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "🚨 Director Review: Deal AT RISK",
                        "description": "Deal cần quyết định: Continue/Pause/Close",
                        "due_hours": 48,
                        "priority": "critical"
                    },
                    "target_user_type": "director"
                },
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "deal_at_risk",
                        "subject": "Deal được đánh dấu AT RISK do stale > 7 ngày"
                    }
                }
            ],
            "priority": 92,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 10,
            "max_executions_per_day": 30,
            "cooldown_minutes": 1440,  # Once per day
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # ================================================================
        # BOOKING EXPIRY FLOW
        # ================================================================
        
        # Rule 10: Booking Expiring - Urgent Action
        {
            "rule_id": "rule_booking_expiring_urgent",
            "name": "BOOKING SẮP HẾT HẠN - Hành động KHẨN",
            "description": "Booking sắp hết hạn cần xử lý trong 6 giờ",
            "domain": "booking",
            "trigger_event": "booking_expiring",
            "conditions": [],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "⏰ BOOKING SẮP HẾT HẠN",
                        "message": "Cần gia hạn hoặc chốt deal ngay!",
                        "type": "booking_expiring",
                        "priority": "critical"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "⏰ KHẨN: Booking sắp hết hạn",
                        "description": "1. Liên hệ khách xác nhận\n2. Gia hạn hoặc chốt deal\n3. Cập nhật trạng thái",
                        "due_hours": 6,
                        "priority": "critical",
                        "escalation_hours": 6,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "notify_manager",
                    "params": {
                        "title": "Booking team sắp hết hạn",
                        "type": "booking_expiring_alert"
                    }
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
        
        # Rule 11: Booking Expired - Release & Notify
        {
            "rule_id": "rule_booking_expired_release",
            "name": "BOOKING HẾT HẠN - Release & Notify",
            "description": "Khi booking hết hạn, release inventory và thông báo team",
            "domain": "booking",
            "trigger_event": "booking_expired",
            "conditions": [],
            "actions": [
                {
                    "action_type": "release_inventory",
                    "params": {
                        "update_product_status": True,
                        "reason": "Booking expired"
                    }
                },
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "⚠️ BOOKING ĐÃ HẾT HẠN",
                        "message": "Inventory đã được release. Cân nhắc contact lại khách.",
                        "type": "booking_expired",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "notify_team",
                    "params": {
                        "title": "Inventory Available",
                        "message": "Unit vừa được release do booking hết hạn",
                        "type": "inventory_released"
                    }
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Recovery: Liên hệ lại KH booking expired",
                        "description": "Tìm hiểu lý do và đề xuất giải pháp mới",
                        "due_hours": 48,
                        "priority": "medium",
                        "escalation_hours": 72,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "booking_expired",
                        "subject": "Booking hết hạn - Inventory released"
                    }
                }
            ],
            "priority": 90,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 20,
            "max_executions_per_day": 50,
            "cooldown_minutes": 0,
            "stop_on_match": False,
            "created_at": now,
            "updated_at": now
        },
        
        # ================================================================
        # DEAL STAGE PROGRESSION
        # ================================================================
        
        # Rule 12: Deal Won - Celebration & Next Steps
        {
            "rule_id": "rule_deal_won_celebrate",
            "name": "DEAL WON - Celebration & Next Steps",
            "description": "Khi deal won, celebrate và setup next steps",
            "domain": "deal",
            "trigger_event": "deal_stage_changed",
            "conditions": [
                {
                    "field": "payload.new_stage",
                    "operator": "eq",
                    "value": "won"
                }
            ],
            "actions": [
                {
                    "action_type": "send_notification",
                    "params": {
                        "title": "🎉 CHÚC MỪNG - DEAL WON!",
                        "message": "Xuất sắc! Deal đã được chốt thành công!",
                        "type": "deal_won",
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "notify_team",
                    "params": {
                        "title": "🎉 Team Win!",
                        "type": "deal_won_celebration"
                    }
                },
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Post-sale: Chuẩn bị hồ sơ & handover",
                        "description": "1. Chuẩn bị hồ sơ hợp đồng\n2. Lên lịch ký\n3. Handover cho team CS",
                        "due_hours": 24,
                        "priority": "high"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "update_kpi",
                    "params": {
                        "kpi_type": "deals_won",
                        "increment": 1
                    }
                }
            ],
            "priority": 85,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 0,
            "stop_on_match": True,
            "created_at": now,
            "updated_at": now
        },
        
        # Rule 13: Deal Lost - Analysis & Recovery
        {
            "rule_id": "rule_deal_lost_analysis",
            "name": "DEAL LOST - Analysis & Potential Recovery",
            "description": "Khi deal lost, phân tích nguyên nhân và xem xét recovery",
            "domain": "deal",
            "trigger_event": "deal_stage_changed",
            "conditions": [
                {
                    "field": "payload.new_stage",
                    "operator": "eq",
                    "value": "lost"
                }
            ],
            "actions": [
                {
                    "action_type": "create_task",
                    "params": {
                        "title": "Analysis: Tại sao deal lost?",
                        "description": "1. Ghi nhận lý do chính xác\n2. Đánh giá có thể recovery không\n3. Rút kinh nghiệm",
                        "due_hours": 48,
                        "priority": "medium",
                        "escalation_hours": 72,
                        "escalation_to": "manager"
                    },
                    "target_user_type": "owner"
                },
                {
                    "action_type": "notify_manager",
                    "params": {
                        "title": "Deal Lost - Cần review",
                        "type": "deal_lost_review"
                    }
                },
                {
                    "action_type": "create_activity",
                    "params": {
                        "type": "deal_lost",
                        "subject": "Deal lost - Pending analysis"
                    }
                }
            ],
            "priority": 70,
            "is_enabled": True,
            "is_test_mode": False,
            "requires_approval": False,
            "max_executions_per_hour": 50,
            "max_executions_per_day": 200,
            "cooldown_minutes": 0,
            "stop_on_match": True,
            "created_at": now,
            "updated_at": now
        }
    ]
    
    return rules


async def seed_phase3_rules(db) -> Dict[str, Any]:
    """
    Seed Phase 3 Revenue-Driven rules into database.
    
    Disables conflicting Phase 2 rules and enables Phase 3 rules.
    """
    rules = get_phase3_rules()
    created = 0
    updated = 0
    
    # Disable overlapping Phase 2 rules (we're replacing them with better ones)
    phase2_to_disable = [
        "rule_lead_created_auto_assign",  # Replaced by hot/warm/standard flow
        "rule_lead_sla_breach_escalate",  # Replaced by new escalation rule
        "rule_high_value_deal_priority",  # Replaced by tiered deal rules
        "rule_deal_stale_alert",          # Replaced by multi-tier stale rules
        "rule_booking_expiring_remind",   # Replaced by urgent action rule
        "rule_booking_expired_postmortem" # Replaced by release & notify rule
    ]
    
    disabled_count = 0
    for rule_id in phase2_to_disable:
        result = await db.automation_rules.update_one(
            {"rule_id": rule_id},
            {"$set": {"is_enabled": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.modified_count > 0:
            disabled_count += 1
    
    # Seed new rules
    for rule in rules:
        existing = await db.automation_rules.find_one({"rule_id": rule["rule_id"]})
        
        if existing:
            await db.automation_rules.update_one(
                {"rule_id": rule["rule_id"]},
                {"$set": rule}
            )
            updated += 1
        else:
            await db.automation_rules.insert_one(rule)
            created += 1
    
    return {
        "total": len(rules),
        "created": created,
        "updated": updated,
        "phase2_disabled": disabled_count
    }
