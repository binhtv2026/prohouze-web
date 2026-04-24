"""
ProHouzing Sales Notification Service
Real-time notifications for Sales Engine events

Triggers:
- Allocation completed
- Booking assigned
- Deal stage changed
- Deposit received
- Contract created
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid
import logging

logger = logging.getLogger(__name__)


class SalesNotificationType:
    """Sales notification types"""
    # Allocation
    ALLOCATION_COMPLETED = "allocation_completed"
    ALLOCATION_FAILED = "allocation_failed"
    MANUAL_ALLOCATION_REQUIRED = "manual_allocation_required"
    
    # Booking
    BOOKING_CREATED = "booking_created"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_ALLOCATED = "booking_allocated"
    PRIORITIES_SUBMITTED = "priorities_submitted"
    
    # Deal
    DEAL_STAGE_CHANGED = "deal_stage_changed"
    DEAL_ALLOCATED = "deal_allocated"
    DEAL_DEPOSITED = "deal_deposited"
    
    # Hard Booking
    HARD_BOOKING_CREATED = "hard_booking_created"
    DEPOSIT_RECEIVED = "deposit_received"
    DEPOSIT_PARTIAL = "deposit_partial"
    DEPOSIT_COMPLETED = "deposit_completed"
    
    # Contract
    CONTRACT_CREATED = "contract_created"
    CONTRACT_READY = "contract_ready"


# Notification templates with Vietnamese labels
NOTIFICATION_TEMPLATES = {
    SalesNotificationType.ALLOCATION_COMPLETED: {
        "title": "Phân bổ hoàn tất",
        "message": "Sự kiện {event_name}: {successful}/{total} booking đã được phân bổ thành công",
        "priority": "high",
        "icon": "check-circle",
    },
    SalesNotificationType.ALLOCATION_FAILED: {
        "title": "Phân bổ thất bại",
        "message": "Booking {booking_code} không được phân bổ - tất cả ưu tiên đã hết",
        "priority": "high",
        "icon": "alert-circle",
    },
    SalesNotificationType.MANUAL_ALLOCATION_REQUIRED: {
        "title": "Cần phân bổ thủ công",
        "message": "{count} booking cần được phân bổ thủ công trong sự kiện {event_name}",
        "priority": "high",
        "icon": "hand",
    },
    SalesNotificationType.BOOKING_CREATED: {
        "title": "Booking mới",
        "message": "Khách hàng {contact_name} đã đặt booking {booking_code}",
        "priority": "medium",
        "icon": "plus-circle",
    },
    SalesNotificationType.BOOKING_CONFIRMED: {
        "title": "Booking đã xác nhận",
        "message": "Booking {booking_code} của {contact_name} đã được xác nhận - Số thứ tự: {queue_number}",
        "priority": "medium",
        "icon": "check",
    },
    SalesNotificationType.BOOKING_ALLOCATED: {
        "title": "Đã phân bổ căn hộ",
        "message": "Khách hàng {contact_name} đã được phân bổ căn {product_code} (Ưu tiên {priority})",
        "priority": "high",
        "icon": "home",
    },
    SalesNotificationType.PRIORITIES_SUBMITTED: {
        "title": "Ưu tiên đã submit",
        "message": "Khách hàng {contact_name} đã submit ưu tiên chọn căn - chờ phân bổ",
        "priority": "medium",
        "icon": "list-ordered",
    },
    SalesNotificationType.DEAL_STAGE_CHANGED: {
        "title": "Deal chuyển giai đoạn",
        "message": "Deal {deal_code} chuyển từ {old_stage} sang {new_stage}",
        "priority": "low",
        "icon": "arrow-right",
    },
    SalesNotificationType.DEAL_ALLOCATED: {
        "title": "Deal đã được phân bổ",
        "message": "Deal {deal_code} của {contact_name} đã được phân bổ căn {product_code}",
        "priority": "high",
        "icon": "check-circle",
    },
    SalesNotificationType.DEAL_DEPOSITED: {
        "title": "Deal đã đặt cọc",
        "message": "Deal {deal_code} đã hoàn tất đặt cọc {amount} VND",
        "priority": "high",
        "icon": "dollar-sign",
    },
    SalesNotificationType.HARD_BOOKING_CREATED: {
        "title": "Hard Booking mới",
        "message": "Hard booking {booking_code} đã được tạo cho căn {product_code}",
        "priority": "high",
        "icon": "lock",
    },
    SalesNotificationType.DEPOSIT_RECEIVED: {
        "title": "Nhận tiền cọc",
        "message": "Đã nhận {amount} VND tiền cọc cho booking {booking_code}",
        "priority": "high",
        "icon": "credit-card",
    },
    SalesNotificationType.DEPOSIT_PARTIAL: {
        "title": "Cọc một phần",
        "message": "Booking {booking_code}: Đã nhận {paid}/{total} VND ({percent}%)",
        "priority": "medium",
        "icon": "percent",
    },
    SalesNotificationType.DEPOSIT_COMPLETED: {
        "title": "Hoàn tất đặt cọc",
        "message": "Booking {booking_code} đã hoàn tất đặt cọc {amount} VND",
        "priority": "high",
        "icon": "check-circle",
    },
    SalesNotificationType.CONTRACT_CREATED: {
        "title": "Hợp đồng mới",
        "message": "Hợp đồng {contract_code} đã được tạo cho khách hàng {contact_name}",
        "priority": "high",
        "icon": "file-text",
    },
    SalesNotificationType.CONTRACT_READY: {
        "title": "Hợp đồng sẵn sàng",
        "message": "Hợp đồng {contract_code} đã sẵn sàng để ký",
        "priority": "high",
        "icon": "file-signature",
    },
}


async def create_sales_notification(
    db,
    notification_type: str,
    user_ids: List[str],
    data: Dict[str, Any],
    deal_id: Optional[str] = None,
    booking_id: Optional[str] = None,
    event_id: Optional[str] = None,
    project_id: Optional[str] = None,
):
    """
    Create sales notification and store in database
    
    Args:
        db: Database connection
        notification_type: Type of notification (from SalesNotificationType)
        user_ids: List of user IDs to notify
        data: Data for template interpolation
        deal_id: Related deal ID
        booking_id: Related booking ID
        event_id: Related sales event ID
        project_id: Related project ID
    """
    template = NOTIFICATION_TEMPLATES.get(notification_type)
    if not template:
        logger.warning(f"Unknown notification type: {notification_type}")
        return []
    
    # Format message with data
    title = template["title"]
    try:
        message = template["message"].format(**data)
    except KeyError as e:
        logger.error(f"Missing data for notification template: {e}")
        message = template["message"]
    
    now = datetime.now(timezone.utc).isoformat()
    notifications = []
    
    for user_id in user_ids:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "sales",
            "subtype": notification_type,
            "title": title,
            "message": message,
            "priority": template.get("priority", "medium"),
            "icon": template.get("icon", "bell"),
            "read": False,
            "data": {
                "notification_type": notification_type,
                "deal_id": deal_id,
                "booking_id": booking_id,
                "event_id": event_id,
                "project_id": project_id,
                **data,
            },
            "created_at": now,
        }
        
        await db.notifications.insert_one(notification)
        notifications.append(notification)
        logger.info(f"Sales notification created: {notification_type} for user {user_id}")
    
    return notifications


async def notify_allocation_completed(
    db,
    event_id: str,
    event_name: str,
    total: int,
    successful: int,
    failed: int,
    manual_required: int,
    admin_user_ids: List[str],
):
    """Notify when allocation is completed"""
    
    # Main notification to admins
    await create_sales_notification(
        db,
        SalesNotificationType.ALLOCATION_COMPLETED,
        admin_user_ids,
        {
            "event_name": event_name,
            "total": total,
            "successful": successful,
            "failed": failed,
        },
        event_id=event_id,
    )
    
    # If manual allocation required
    if manual_required > 0:
        await create_sales_notification(
            db,
            SalesNotificationType.MANUAL_ALLOCATION_REQUIRED,
            admin_user_ids,
            {
                "count": manual_required,
                "event_name": event_name,
            },
            event_id=event_id,
        )


async def notify_booking_allocated(
    db,
    booking_code: str,
    contact_name: str,
    product_code: str,
    priority: int,
    assigned_user_id: str,
    deal_id: str = None,
    booking_id: str = None,
):
    """Notify when a booking is allocated"""
    
    await create_sales_notification(
        db,
        SalesNotificationType.BOOKING_ALLOCATED,
        [assigned_user_id],
        {
            "booking_code": booking_code,
            "contact_name": contact_name,
            "product_code": product_code,
            "priority": priority,
        },
        deal_id=deal_id,
        booking_id=booking_id,
    )


async def notify_deal_stage_changed(
    db,
    deal_code: str,
    old_stage: str,
    new_stage: str,
    assigned_user_id: str,
    deal_id: str,
):
    """Notify when deal stage changes"""
    
    await create_sales_notification(
        db,
        SalesNotificationType.DEAL_STAGE_CHANGED,
        [assigned_user_id],
        {
            "deal_code": deal_code,
            "old_stage": old_stage,
            "new_stage": new_stage,
        },
        deal_id=deal_id,
    )


async def notify_deposit_received(
    db,
    booking_code: str,
    amount: float,
    paid: float,
    total: float,
    is_completed: bool,
    assigned_user_id: str,
    booking_id: str,
):
    """Notify when deposit is received"""
    
    if is_completed:
        notification_type = SalesNotificationType.DEPOSIT_COMPLETED
        data = {
            "booking_code": booking_code,
            "amount": f"{total:,.0f}",
        }
    elif paid < total:
        notification_type = SalesNotificationType.DEPOSIT_PARTIAL
        percent = (paid / total * 100) if total > 0 else 0
        data = {
            "booking_code": booking_code,
            "paid": f"{paid:,.0f}",
            "total": f"{total:,.0f}",
            "percent": f"{percent:.0f}",
        }
    else:
        notification_type = SalesNotificationType.DEPOSIT_RECEIVED
        data = {
            "booking_code": booking_code,
            "amount": f"{amount:,.0f}",
        }
    
    await create_sales_notification(
        db,
        notification_type,
        [assigned_user_id],
        data,
        booking_id=booking_id,
    )


async def get_admin_user_ids(db) -> List[str]:
    """Get list of admin user IDs for notifications"""
    admins = await db.users.find(
        {"role": {"$in": ["admin", "ceo", "director"]}},
        {"_id": 0, "id": 1}
    ).to_list(100)
    
    return [a["id"] for a in admins]


async def get_sales_manager_ids(db, project_id: str = None) -> List[str]:
    """Get list of sales manager IDs for notifications"""
    query = {"role": {"$in": ["sales_manager", "branch_manager", "admin"]}}
    
    if project_id:
        # Get managers assigned to this project
        query["$or"] = [
            {"assigned_projects": project_id},
            {"role": "admin"},
        ]
    
    managers = await db.users.find(query, {"_id": 0, "id": 1}).to_list(100)
    return [m["id"] for m in managers]
