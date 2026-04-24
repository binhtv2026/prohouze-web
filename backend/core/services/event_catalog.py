"""
ProHouzing Event Catalog - Canonical Event Definitions
Version: 2.0.0 (Prompt 2/18)

This file defines ALL canonical events for ProHouzing.
Every module MUST use events from this catalog.
DO NOT create custom event codes outside this catalog.

Event Naming Convention:
    <aggregate>.<action>
    or
    <aggregate>.<subdomain>.<action>

Examples:
    - customer.created
    - deal.stage_changed
    - commission.payment.completed
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════════

class EventCategory(str, Enum):
    """High-level event categories"""
    CUSTOMER = "customer"
    LEAD = "lead"
    DEAL = "deal"
    PRODUCT = "product"
    BOOKING = "booking"
    CONTRACT = "contract"
    PAYMENT = "payment"
    COMMISSION = "commission"
    TASK = "task"
    WORKFLOW = "workflow"
    PARTNER = "partner"
    INTEGRATION = "integration"
    SYSTEM = "system"
    USER = "user"


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT CODE DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

class EventCode(str, Enum):
    """
    Canonical event codes for ProHouzing
    
    IMPORTANT: All events MUST be defined here.
    Modules should NEVER create ad-hoc event codes.
    """
    
    # ─── CUSTOMER EVENTS ──────────────────────────────────────────────────────
    CUSTOMER_CREATED = "customer.created"
    CUSTOMER_UPDATED = "customer.updated"
    CUSTOMER_MERGED = "customer.merged"
    CUSTOMER_IDENTITY_ADDED = "customer.identity_added"
    CUSTOMER_IDENTITY_VERIFIED = "customer.identity_verified"
    CUSTOMER_OWNER_CHANGED = "customer.owner_changed"
    CUSTOMER_SEGMENT_CHANGED = "customer.segment_changed"
    CUSTOMER_DO_NOT_CONTACT_ENABLED = "customer.do_not_contact_enabled"
    CUSTOMER_DO_NOT_CONTACT_DISABLED = "customer.do_not_contact_disabled"
    CUSTOMER_ARCHIVED = "customer.archived"
    CUSTOMER_RESTORED = "customer.restored"
    
    # ─── LEAD EVENTS ──────────────────────────────────────────────────────────
    LEAD_CAPTURED = "lead.captured"
    LEAD_CREATED = "lead.created"
    LEAD_ASSIGNED = "lead.assigned"
    LEAD_REASSIGNED = "lead.reassigned"
    LEAD_CONTACTED = "lead.contacted"
    LEAD_QUALIFIED = "lead.qualified"
    LEAD_DISQUALIFIED = "lead.disqualified"
    LEAD_CONVERTED_TO_CUSTOMER = "lead.converted_to_customer"
    LEAD_CONVERTED_TO_DEAL = "lead.converted_to_deal"
    LEAD_STAGE_CHANGED = "lead.stage_changed"
    LEAD_SCORE_CHANGED = "lead.score_changed"
    LEAD_LOST = "lead.lost"
    LEAD_RECYCLED = "lead.recycled"
    
    # ─── DEAL EVENTS ──────────────────────────────────────────────────────────
    DEAL_CREATED = "deal.created"
    DEAL_UPDATED = "deal.updated"
    DEAL_OWNER_CHANGED = "deal.owner_changed"
    DEAL_PRODUCT_ATTACHED = "deal.product_attached"
    DEAL_PRODUCT_DETACHED = "deal.product_detached"
    DEAL_STAGE_CHANGED = "deal.stage_changed"
    DEAL_VALUE_CHANGED = "deal.value_changed"
    DEAL_NOTE_ADDED = "deal.note_added"
    DEAL_ACTIVITY_LOGGED = "deal.activity_logged"
    DEAL_WON = "deal.won"
    DEAL_LOST = "deal.lost"
    DEAL_REOPENED = "deal.reopened"
    DEAL_ARCHIVED = "deal.archived"
    
    # ─── PRODUCT / INVENTORY EVENTS ───────────────────────────────────────────
    PRODUCT_CREATED = "product.created"
    PRODUCT_UPDATED = "product.updated"
    PRODUCT_PRICE_CHANGED = "product.price_changed"
    PRODUCT_STATUS_CHANGED = "product.status_changed"
    PRODUCT_HELD = "product.held"
    PRODUCT_HOLD_RELEASED = "product.hold_released"
    PRODUCT_BOOKED = "product.booked"
    PRODUCT_SOLD = "product.sold"
    PRODUCT_RETURNED_TO_INVENTORY = "product.returned_to_inventory"
    PRODUCT_LOCKED = "product.locked"
    PRODUCT_UNLOCKED = "product.unlocked"
    
    # ─── PROJECT EVENTS ───────────────────────────────────────────────────────
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_LAUNCHED = "project.launched"
    PROJECT_PAUSED = "project.paused"
    PROJECT_COMPLETED = "project.completed"
    PROJECT_INVENTORY_CHANGED = "project.inventory_changed"
    
    # ─── BOOKING EVENTS ───────────────────────────────────────────────────────
    BOOKING_CREATED = "booking.created"
    BOOKING_CONFIRMED = "booking.confirmed"
    BOOKING_CANCELLED = "booking.cancelled"
    BOOKING_EXPIRED = "booking.expired"
    BOOKING_CONVERTED_TO_CONTRACT = "booking.converted_to_contract"
    BOOKING_PRIORITY_CHANGED = "booking.priority_changed"
    
    # ─── DEPOSIT EVENTS ───────────────────────────────────────────────────────
    DEPOSIT_RECORDED = "deposit.recorded"
    DEPOSIT_CONFIRMED = "deposit.confirmed"
    DEPOSIT_REFUNDED = "deposit.refunded"
    DEPOSIT_FORFEITED = "deposit.forfeited"
    
    # ─── CONTRACT EVENTS ──────────────────────────────────────────────────────
    CONTRACT_CREATED = "contract.created"
    CONTRACT_UPDATED = "contract.updated"
    CONTRACT_SUBMITTED_FOR_REVIEW = "contract.submitted_for_review"
    CONTRACT_APPROVED = "contract.approved"
    CONTRACT_REJECTED = "contract.rejected"
    CONTRACT_SENT_FOR_SIGNING = "contract.sent_for_signing"
    CONTRACT_SIGNED = "contract.signed"
    CONTRACT_CANCELLED = "contract.cancelled"
    CONTRACT_TERMINATED = "contract.terminated"
    CONTRACT_COMPLETED = "contract.completed"
    CONTRACT_AMENDED = "contract.amended"
    
    # ─── PAYMENT EVENTS ───────────────────────────────────────────────────────
    PAYMENT_SCHEDULED = "payment.scheduled"
    PAYMENT_REQUESTED = "payment.requested"
    PAYMENT_RECEIVED = "payment.received"
    PAYMENT_CONFIRMED = "payment.confirmed"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_REFUNDED = "payment.refunded"
    PAYMENT_OVERDUE = "payment.overdue"
    PAYMENT_REMINDER_SENT = "payment.reminder_sent"
    
    # ─── COMMISSION EVENTS ────────────────────────────────────────────────────
    COMMISSION_CALCULATED = "commission.calculated"
    COMMISSION_RECOGNIZED = "commission.recognized"
    COMMISSION_ADJUSTED = "commission.adjusted"
    COMMISSION_SUBMITTED = "commission.submitted"
    COMMISSION_APPROVED = "commission.approved"
    COMMISSION_REJECTED = "commission.rejected"
    COMMISSION_PAID = "commission.paid"
    COMMISSION_CLAWBACK = "commission.clawback"
    
    # ─── TASK EVENTS ──────────────────────────────────────────────────────────
    TASK_CREATED = "task.created"
    TASK_ASSIGNED = "task.assigned"
    TASK_UPDATED = "task.updated"
    TASK_STARTED = "task.started"
    TASK_COMPLETED = "task.completed"
    TASK_OVERDUE = "task.overdue"
    TASK_CANCELLED = "task.cancelled"
    TASK_REMINDER_SENT = "task.reminder_sent"
    
    # ─── APPROVAL / WORKFLOW EVENTS ───────────────────────────────────────────
    APPROVAL_REQUESTED = "approval.requested"
    APPROVAL_APPROVED = "approval.approved"
    APPROVAL_REJECTED = "approval.rejected"
    APPROVAL_ESCALATED = "approval.escalated"
    WORKFLOW_TRIGGERED = "workflow.triggered"
    WORKFLOW_STEP_COMPLETED = "workflow.step_completed"
    WORKFLOW_COMPLETED = "workflow.completed"
    WORKFLOW_FAILED = "workflow.failed"
    
    # ─── ASSIGNMENT EVENTS ────────────────────────────────────────────────────
    ASSIGNMENT_CREATED = "assignment.created"
    ASSIGNMENT_CHANGED = "assignment.changed"
    ASSIGNMENT_REVOKED = "assignment.revoked"
    
    # ─── PARTNER / AGENCY EVENTS ──────────────────────────────────────────────
    PARTNER_CREATED = "partner.created"
    PARTNER_UPDATED = "partner.updated"
    PARTNER_LINKED = "partner.linked"
    PARTNER_UNLINKED = "partner.unlinked"
    PARTNER_CONTRACT_SIGNED = "partner.contract_signed"
    DISTRIBUTION_ASSIGNED = "distribution.assigned"
    DISTRIBUTION_REVOKED = "distribution.revoked"
    LEAK_DETECTED = "leak.detected"
    
    # ─── NOTIFICATION EVENTS ──────────────────────────────────────────────────
    NOTIFICATION_SENT = "notification.sent"
    NOTIFICATION_DELIVERED = "notification.delivered"
    NOTIFICATION_READ = "notification.read"
    NOTIFICATION_FAILED = "notification.failed"
    
    # ─── INTEGRATION EVENTS ───────────────────────────────────────────────────
    INTEGRATION_WEBHOOK_RECEIVED = "integration.webhook_received"
    INTEGRATION_SYNC_STARTED = "integration.sync_started"
    INTEGRATION_SYNC_COMPLETED = "integration.sync_completed"
    INTEGRATION_SYNC_FAILED = "integration.sync_failed"
    INTEGRATION_ERROR = "integration.error"
    
    # ─── SYSTEM EVENTS ────────────────────────────────────────────────────────
    SYSTEM_JOB_STARTED = "system.job_started"
    SYSTEM_JOB_COMPLETED = "system.job_completed"
    SYSTEM_JOB_FAILED = "system.job_failed"
    SYSTEM_MAINTENANCE_STARTED = "system.maintenance_started"
    SYSTEM_MAINTENANCE_COMPLETED = "system.maintenance_completed"
    EVENT_DELIVERY_FAILED = "event.delivery_failed"
    EVENT_RETRY_SCHEDULED = "event.retry_scheduled"
    
    # ─── USER EVENTS ──────────────────────────────────────────────────────────
    USER_LOGGED_IN = "user.logged_in"
    USER_LOGGED_OUT = "user.logged_out"
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_ROLE_CHANGED = "user.role_changed"
    USER_DEACTIVATED = "user.deactivated"
    USER_REACTIVATED = "user.reactivated"


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT METADATA DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class EventDefinition:
    """Metadata for each event type"""
    code: EventCode
    category: EventCategory
    title_template: str        # Template for activity title
    summary_template: str      # Template for activity summary
    icon_code: str            # Icon for UI
    severity: str             # info, success, warning, error
    visibility: str           # internal, business, admin, customer_safe
    generate_activity: bool    # Should generate activity stream item
    important_fields: List[str]  # Fields to track in change log


# Event definitions with metadata
EVENT_DEFINITIONS: Dict[str, EventDefinition] = {
    # ─── CUSTOMER ─────────────────────────────────────────────────────────────
    EventCode.CUSTOMER_CREATED.value: EventDefinition(
        code=EventCode.CUSTOMER_CREATED,
        category=EventCategory.CUSTOMER,
        title_template="Khách hàng mới",
        summary_template="{actor_name} đã tạo khách hàng {entity_name}",
        icon_code="user-plus",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["full_name", "phone", "email", "customer_type"],
    ),
    EventCode.CUSTOMER_MERGED.value: EventDefinition(
        code=EventCode.CUSTOMER_MERGED,
        category=EventCategory.CUSTOMER,
        title_template="Gộp khách hàng",
        summary_template="{actor_name} đã gộp {source_count} hồ sơ vào {entity_name}",
        icon_code="git-merge",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["merged_from", "merged_to"],
    ),
    EventCode.CUSTOMER_OWNER_CHANGED.value: EventDefinition(
        code=EventCode.CUSTOMER_OWNER_CHANGED,
        category=EventCategory.CUSTOMER,
        title_template="Đổi người phụ trách",
        summary_template="{actor_name} đã chuyển {entity_name} cho {new_owner_name}",
        icon_code="user-check",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["owner_user_id"],
    ),
    
    # ─── LEAD ─────────────────────────────────────────────────────────────────
    EventCode.LEAD_CAPTURED.value: EventDefinition(
        code=EventCode.LEAD_CAPTURED,
        category=EventCategory.LEAD,
        title_template="Lead mới từ {source}",
        summary_template="Lead {entity_name} được capture từ {source}",
        icon_code="target",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["full_name", "phone", "email", "source", "campaign"],
    ),
    EventCode.LEAD_ASSIGNED.value: EventDefinition(
        code=EventCode.LEAD_ASSIGNED,
        category=EventCategory.LEAD,
        title_template="Phân bổ lead",
        summary_template="{actor_name} đã phân bổ {entity_name} cho {assignee_name}",
        icon_code="user-check",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["assigned_to"],
    ),
    EventCode.LEAD_CONVERTED_TO_DEAL.value: EventDefinition(
        code=EventCode.LEAD_CONVERTED_TO_DEAL,
        category=EventCategory.LEAD,
        title_template="Chuyển đổi thành Deal",
        summary_template="{actor_name} đã chuyển lead {entity_name} thành deal {deal_code}",
        icon_code="trending-up",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["deal_id"],
    ),
    EventCode.LEAD_STAGE_CHANGED.value: EventDefinition(
        code=EventCode.LEAD_STAGE_CHANGED,
        category=EventCategory.LEAD,
        title_template="Chuyển stage lead",
        summary_template="{entity_name} chuyển từ {old_stage} sang {new_stage}",
        icon_code="arrow-right",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["current_stage"],
    ),
    
    # ─── DEAL ─────────────────────────────────────────────────────────────────
    EventCode.DEAL_CREATED.value: EventDefinition(
        code=EventCode.DEAL_CREATED,
        category=EventCategory.DEAL,
        title_template="Deal mới",
        summary_template="{actor_name} đã tạo deal {entity_name} cho {customer_name}",
        icon_code="briefcase",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["deal_code", "deal_name", "customer_id", "deal_value"],
    ),
    EventCode.DEAL_STAGE_CHANGED.value: EventDefinition(
        code=EventCode.DEAL_STAGE_CHANGED,
        category=EventCategory.DEAL,
        title_template="Chuyển stage deal",
        summary_template="Deal {entity_name} chuyển từ {old_stage} sang {new_stage}",
        icon_code="trending-up",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["current_stage"],
    ),
    EventCode.DEAL_WON.value: EventDefinition(
        code=EventCode.DEAL_WON,
        category=EventCategory.DEAL,
        title_template="Deal thành công",
        summary_template="Deal {entity_name} đã chốt thành công - Giá trị {deal_value}",
        icon_code="trophy",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["current_stage", "deal_value", "won_at"],
    ),
    EventCode.DEAL_LOST.value: EventDefinition(
        code=EventCode.DEAL_LOST,
        category=EventCategory.DEAL,
        title_template="Mất deal",
        summary_template="Deal {entity_name} đã mất - Lý do: {lost_reason}",
        icon_code="x-circle",
        severity="warning",
        visibility="business",
        generate_activity=True,
        important_fields=["current_stage", "lost_reason", "lost_at"],
    ),
    EventCode.DEAL_PRODUCT_ATTACHED.value: EventDefinition(
        code=EventCode.DEAL_PRODUCT_ATTACHED,
        category=EventCategory.DEAL,
        title_template="Gắn sản phẩm",
        summary_template="{actor_name} đã gắn {product_code} vào deal {entity_name}",
        icon_code="link",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["product_id"],
    ),
    
    # ─── PRODUCT ──────────────────────────────────────────────────────────────
    EventCode.PRODUCT_HELD.value: EventDefinition(
        code=EventCode.PRODUCT_HELD,
        category=EventCategory.PRODUCT,
        title_template="Giữ chỗ sản phẩm",
        summary_template="{actor_name} đã giữ chỗ {entity_name} cho {customer_name}",
        icon_code="lock",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["inventory_status", "held_by", "held_until"],
    ),
    EventCode.PRODUCT_BOOKED.value: EventDefinition(
        code=EventCode.PRODUCT_BOOKED,
        category=EventCategory.PRODUCT,
        title_template="Đặt cọc sản phẩm",
        summary_template="Sản phẩm {entity_name} đã được đặt cọc bởi {customer_name}",
        icon_code="bookmark",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["inventory_status", "booking_id"],
    ),
    EventCode.PRODUCT_SOLD.value: EventDefinition(
        code=EventCode.PRODUCT_SOLD,
        category=EventCategory.PRODUCT,
        title_template="Bán sản phẩm",
        summary_template="Sản phẩm {entity_name} đã bán - Giá {sale_price}",
        icon_code="check-circle",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["inventory_status", "contract_id", "sale_price"],
    ),
    EventCode.PRODUCT_PRICE_CHANGED.value: EventDefinition(
        code=EventCode.PRODUCT_PRICE_CHANGED,
        category=EventCategory.PRODUCT,
        title_template="Thay đổi giá",
        summary_template="{entity_name} đổi giá từ {old_price} sang {new_price}",
        icon_code="dollar-sign",
        severity="info",
        visibility="admin",
        generate_activity=True,
        important_fields=["list_price", "sale_price"],
    ),
    
    # ─── BOOKING ──────────────────────────────────────────────────────────────
    EventCode.BOOKING_CREATED.value: EventDefinition(
        code=EventCode.BOOKING_CREATED,
        category=EventCategory.BOOKING,
        title_template="Tạo booking",
        summary_template="{actor_name} đã tạo booking {entity_name} cho {customer_name}",
        icon_code="calendar-plus",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["booking_code", "customer_id", "product_id", "booking_amount"],
    ),
    EventCode.BOOKING_CONFIRMED.value: EventDefinition(
        code=EventCode.BOOKING_CONFIRMED,
        category=EventCategory.BOOKING,
        title_template="Xác nhận booking",
        summary_template="Booking {entity_name} đã được xác nhận",
        icon_code="check",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["booking_status"],
    ),
    EventCode.BOOKING_CANCELLED.value: EventDefinition(
        code=EventCode.BOOKING_CANCELLED,
        category=EventCategory.BOOKING,
        title_template="Huỷ booking",
        summary_template="Booking {entity_name} đã bị huỷ - Lý do: {cancel_reason}",
        icon_code="x",
        severity="warning",
        visibility="business",
        generate_activity=True,
        important_fields=["booking_status", "cancel_reason"],
    ),
    
    # ─── CONTRACT ─────────────────────────────────────────────────────────────
    EventCode.CONTRACT_CREATED.value: EventDefinition(
        code=EventCode.CONTRACT_CREATED,
        category=EventCategory.CONTRACT,
        title_template="Tạo hợp đồng",
        summary_template="{actor_name} đã tạo hợp đồng {entity_name}",
        icon_code="file-text",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["contract_code", "contract_type", "contract_value"],
    ),
    EventCode.CONTRACT_SIGNED.value: EventDefinition(
        code=EventCode.CONTRACT_SIGNED,
        category=EventCategory.CONTRACT,
        title_template="Ký hợp đồng",
        summary_template="Hợp đồng {entity_name} đã được ký - Giá trị {contract_value}",
        icon_code="edit-3",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["contract_status", "signed_at"],
    ),
    EventCode.CONTRACT_CANCELLED.value: EventDefinition(
        code=EventCode.CONTRACT_CANCELLED,
        category=EventCategory.CONTRACT,
        title_template="Huỷ hợp đồng",
        summary_template="Hợp đồng {entity_name} đã bị huỷ - Lý do: {cancel_reason}",
        icon_code="x-circle",
        severity="error",
        visibility="business",
        generate_activity=True,
        important_fields=["contract_status", "cancel_reason"],
    ),
    
    # ─── PAYMENT ──────────────────────────────────────────────────────────────
    EventCode.PAYMENT_RECEIVED.value: EventDefinition(
        code=EventCode.PAYMENT_RECEIVED,
        category=EventCategory.PAYMENT,
        title_template="Nhận thanh toán",
        summary_template="Nhận thanh toán {amount} từ {customer_name}",
        icon_code="dollar-sign",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["amount", "payment_method", "transaction_ref"],
    ),
    EventCode.PAYMENT_OVERDUE.value: EventDefinition(
        code=EventCode.PAYMENT_OVERDUE,
        category=EventCategory.PAYMENT,
        title_template="Thanh toán quá hạn",
        summary_template="Thanh toán {entity_name} đã quá hạn - Số tiền {amount}",
        icon_code="alert-triangle",
        severity="warning",
        visibility="business",
        generate_activity=True,
        important_fields=["due_date", "amount"],
    ),
    
    # ─── COMMISSION ───────────────────────────────────────────────────────────
    EventCode.COMMISSION_RECOGNIZED.value: EventDefinition(
        code=EventCode.COMMISSION_RECOGNIZED,
        category=EventCategory.COMMISSION,
        title_template="Ghi nhận hoa hồng",
        summary_template="Ghi nhận hoa hồng {amount} cho {beneficiary_name}",
        icon_code="award",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["net_amount", "beneficiary_user_id", "deal_id"],
    ),
    EventCode.COMMISSION_APPROVED.value: EventDefinition(
        code=EventCode.COMMISSION_APPROVED,
        category=EventCategory.COMMISSION,
        title_template="Duyệt hoa hồng",
        summary_template="{actor_name} đã duyệt hoa hồng {entity_name} - {amount}",
        icon_code="check-circle",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["earning_status", "approved_by"],
    ),
    EventCode.COMMISSION_PAID.value: EventDefinition(
        code=EventCode.COMMISSION_PAID,
        category=EventCategory.COMMISSION,
        title_template="Chi hoa hồng",
        summary_template="Đã chi hoa hồng {amount} cho {beneficiary_name}",
        icon_code="credit-card",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["payout_status", "paid_amount", "paid_at"],
    ),
    
    # ─── TASK ─────────────────────────────────────────────────────────────────
    EventCode.TASK_CREATED.value: EventDefinition(
        code=EventCode.TASK_CREATED,
        category=EventCategory.TASK,
        title_template="Tạo công việc",
        summary_template="{actor_name} đã tạo task: {task_title}",
        icon_code="clipboard",
        severity="info",
        visibility="business",
        generate_activity=True,
        important_fields=["title", "assigned_to", "due_date"],
    ),
    EventCode.TASK_COMPLETED.value: EventDefinition(
        code=EventCode.TASK_COMPLETED,
        category=EventCategory.TASK,
        title_template="Hoàn thành task",
        summary_template="{actor_name} đã hoàn thành task: {task_title}",
        icon_code="check-square",
        severity="success",
        visibility="business",
        generate_activity=True,
        important_fields=["status", "completed_at"],
    ),
    EventCode.TASK_OVERDUE.value: EventDefinition(
        code=EventCode.TASK_OVERDUE,
        category=EventCategory.TASK,
        title_template="Task quá hạn",
        summary_template="Task {entity_name} đã quá hạn",
        icon_code="alert-circle",
        severity="warning",
        visibility="business",
        generate_activity=True,
        important_fields=["due_date", "status"],
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_event_definition(event_code: str) -> Optional[EventDefinition]:
    """Get event definition by code"""
    return EVENT_DEFINITIONS.get(event_code)


def get_event_category(event_code: str) -> str:
    """Extract category from event code"""
    return event_code.split(".")[0]


def validate_event_code(event_code: str) -> bool:
    """Check if event code is valid"""
    try:
        EventCode(event_code)
        return True
    except ValueError:
        return False


def get_events_by_category(category: EventCategory) -> List[EventCode]:
    """Get all event codes for a category"""
    return [e for e in EventCode if e.value.startswith(category.value + ".")]


# Export all event codes as list for easy access
ALL_EVENT_CODES = [e.value for e in EventCode]
