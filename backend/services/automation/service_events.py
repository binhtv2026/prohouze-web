"""
Service Events Integration - Phase 2
Prompt 19.5 - Automation Engine

This module integrates event emission into existing services.
Import and call these functions from the route handlers.

HARD RULES:
- KHÔNG trigger action trực tiếp trong service
- KHÔNG bypass rule engine
- KHÔNG emit event không có payload
- KHÔNG bỏ qua priority engine

Flow: Service → emit_event → Priority Engine → Orchestrator → Rule Engine → Action
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from services.automation.event_emitter import (
    emit_event,
    BusinessEvent,
    EventActor,
    EventEntity,
    EventMetadata,
    EventTypes,
    EventThresholds,
    EventEmitter
)

logger = logging.getLogger(__name__)


# ==================== INITIALIZATION ====================

_initialized = False

async def initialize_event_system(db):
    """
    Initialize the event system with database and orchestrator.
    Called once at app startup.
    """
    global _initialized
    if _initialized:
        return
    
    from services.automation.hardened_orchestrator import get_hardened_orchestrator
    
    orchestrator = get_hardened_orchestrator(db)
    EventEmitter.initialize(db, orchestrator)
    
    _initialized = True
    logger.info("Event system initialized for Phase 2 Integration")


# ==================== LEAD EVENTS ====================

async def emit_lead_created(
    lead: Dict[str, Any],
    user_id: str,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit lead_created event.
    
    Called when: POST /leads creates a new lead
    
    Args:
        lead: The created lead document
        user_id: ID of user who created the lead
        user_role: Role of user
    
    Returns:
        Event processing result
    """
    event = BusinessEvent(
        event_type=EventTypes.LEAD_CREATED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="leads",
            entity_id=lead["id"],
            snapshot={
                "full_name": lead.get("full_name"),
                "phone": lead.get("phone"),
                "channel": lead.get("channel"),
                "segment": lead.get("segment"),
                "assigned_to": lead.get("assigned_to")
            }
        ),
        payload={
            "source": lead.get("channel"),
            "segment": lead.get("segment"),
            "lead_value": lead.get("budget_max", 0),
            "lead_score": lead.get("score", 50),  # Phase 3: For revenue-based priority
            "budget_min": lead.get("budget_min", 0),
            "budget_max": lead.get("budget_max", 0),
            "project_interest": lead.get("project_interest"),
            "assigned_to": lead.get("assigned_to"),
            "referrer_id": lead.get("referrer_id"),
            "referrer_type": lead.get("referrer_type"),
            "created_at": lead.get("created_at")
        },
        metadata=EventMetadata(
            idempotency_key=f"lead_created_{lead['id']}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting lead_created for lead {lead['id']}")
    return await emit_event(event)


async def emit_lead_assigned(
    lead: Dict[str, Any],
    user_id: str,
    assigned_to: str,
    assignment_reason: str = None,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit lead_assigned event.
    
    Called when: Lead is assigned/reassigned to a sales rep
    
    Args:
        lead: The lead document
        user_id: ID of user who made the assignment
        assigned_to: ID of user being assigned
        assignment_reason: Reason for assignment
    """
    event = BusinessEvent(
        event_type=EventTypes.LEAD_ASSIGNED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="leads",
            entity_id=lead["id"],
            snapshot={
                "full_name": lead.get("full_name"),
                "status": lead.get("status"),
                "segment": lead.get("segment")
            }
        ),
        payload={
            "assigned_to": assigned_to,
            "previous_owner": lead.get("assigned_to"),
            "assignment_reason": assignment_reason or "Manual assignment",
            "lead_value": lead.get("budget_max", 0),
            "segment": lead.get("segment"),
            "assigned_at": datetime.now(timezone.utc).isoformat()
        },
        metadata=EventMetadata(
            idempotency_key=f"lead_assigned_{lead['id']}_{assigned_to}_{uuid.uuid4().hex[:6]}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting lead_assigned for lead {lead['id']} to {assigned_to}")
    return await emit_event(event)


async def emit_lead_status_changed(
    lead: Dict[str, Any],
    old_status: str,
    new_status: str,
    user_id: str,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit lead_status_changed event.
    
    Called when: Lead status is updated
    """
    event = BusinessEvent(
        event_type=EventTypes.LEAD_STATUS_CHANGED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="leads",
            entity_id=lead["id"],
            snapshot={
                "full_name": lead.get("full_name"),
                "assigned_to": lead.get("assigned_to")
            }
        ),
        payload={
            "old_status": old_status,
            "new_status": new_status,
            "lead_value": lead.get("budget_max", 0),
            "assigned_to": lead.get("assigned_to"),
            "changed_at": datetime.now(timezone.utc).isoformat()
        },
        metadata=EventMetadata(
            idempotency_key=f"lead_status_{lead['id']}_{new_status}_{uuid.uuid4().hex[:6]}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting lead_status_changed for lead {lead['id']}: {old_status} → {new_status}")
    return await emit_event(event)


# ==================== DEAL EVENTS ====================

async def emit_deal_created(
    deal: Dict[str, Any],
    user_id: str,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit deal_created event (and high_value_deal_detected if applicable).
    
    Called when: POST /deals creates a new deal
    """
    # Check for high value deal
    deal_value = deal.get("deal_value", 0) or deal.get("value", 0)
    is_high_value = deal_value >= EventThresholds.HIGH_VALUE_DEAL_VND
    
    # Emit deal_created
    event = BusinessEvent(
        event_type=EventTypes.DEAL_CREATED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="deals",
            entity_id=deal["id"],
            snapshot={
                "customer_name": deal.get("customer_name"),
                "deal_value": deal_value,
                "status": deal.get("status")
            }
        ),
        payload={
            "deal_value": deal_value,
            "status": deal.get("status"),
            "lead_id": deal.get("lead_id"),
            "project_id": deal.get("project_id"),
            "project_name": deal.get("project_name"),
            "assigned_to": deal.get("assigned_to"),
            "is_high_value": is_high_value,
            "created_at": deal.get("created_at")
        },
        metadata=EventMetadata(
            idempotency_key=f"deal_created_{deal['id']}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting deal_created for deal {deal['id']} (value: {deal_value:,})")
    result = await emit_event(event)
    
    # Also emit high_value_deal_detected if applicable
    if is_high_value:
        await emit_high_value_deal_detected(deal, user_id, user_role)
    
    return result


async def emit_deal_stage_changed(
    deal: Dict[str, Any],
    old_stage: str,
    new_stage: str,
    user_id: str,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit deal_stage_changed event.
    
    Called when: Deal stage/status is updated
    """
    deal_value = deal.get("deal_value", 0) or deal.get("value", 0)
    
    event = BusinessEvent(
        event_type=EventTypes.DEAL_STAGE_CHANGED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="deals",
            entity_id=deal["id"],
            snapshot={
                "customer_name": deal.get("customer_name"),
                "deal_value": deal_value,
                "assigned_to": deal.get("assigned_to")
            }
        ),
        payload={
            "old_stage": old_stage,
            "new_stage": new_stage,
            "deal_value": deal_value,
            "assigned_to": deal.get("assigned_to"),
            "is_won": new_stage in ["won", "WON"],
            "is_lost": new_stage in ["lost", "LOST"],
            "changed_at": datetime.now(timezone.utc).isoformat()
        },
        metadata=EventMetadata(
            idempotency_key=f"deal_stage_{deal['id']}_{new_stage}_{uuid.uuid4().hex[:6]}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting deal_stage_changed for deal {deal['id']}: {old_stage} → {new_stage}")
    return await emit_event(event)


async def emit_high_value_deal_detected(
    deal: Dict[str, Any],
    user_id: str,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit high_value_deal_detected event.
    
    Called when: Deal value >= 5 billion VND
    """
    deal_value = deal.get("deal_value", 0) or deal.get("value", 0)
    
    event = BusinessEvent(
        event_type=EventTypes.HIGH_VALUE_DEAL_DETECTED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="deals",
            entity_id=deal["id"],
            snapshot={
                "customer_name": deal.get("customer_name"),
                "deal_value": deal_value
            }
        ),
        payload={
            "deal_value": deal_value,
            "threshold": EventThresholds.HIGH_VALUE_DEAL_VND,
            "exceeds_by": deal_value - EventThresholds.HIGH_VALUE_DEAL_VND,
            "assigned_to": deal.get("assigned_to"),
            "customer_name": deal.get("customer_name"),
            "project_name": deal.get("project_name"),
            "detected_at": datetime.now(timezone.utc).isoformat()
        },
        metadata=EventMetadata(
            idempotency_key=f"high_value_deal_{deal['id']}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting high_value_deal_detected for deal {deal['id']} (value: {deal_value:,})")
    return await emit_event(event)


# ==================== BOOKING EVENTS ====================

async def emit_booking_created(
    booking: Dict[str, Any],
    booking_type: str,  # "soft" or "hard"
    user_id: str,
    user_role: str = "user"
) -> Dict[str, Any]:
    """
    Emit booking_created event.
    
    Called when: POST /soft-bookings or /hard-bookings creates a booking
    
    Args:
        booking: The created booking document
        booking_type: "soft" or "hard"
        user_id: ID of user who created the booking
    """
    event = BusinessEvent(
        event_type=EventTypes.BOOKING_CREATED,
        actor=EventActor(
            user_id=user_id,
            user_role=user_role,
            actor_type="user"
        ),
        entity=EventEntity(
            entity_type="bookings",
            entity_id=booking["id"],
            snapshot={
                "code": booking.get("code"),
                "booking_type": booking_type,
                "deal_id": booking.get("deal_id")
            }
        ),
        payload={
            "booking_type": booking_type,
            "deal_id": booking.get("deal_id"),
            "contact_id": booking.get("contact_id"),
            "project_id": booking.get("project_id"),
            "product_id": booking.get("product_id"),
            "booking_fee": booking.get("booking_fee", 0),
            "expiry_date": booking.get("expiry_date"),
            "status": booking.get("status"),
            "created_at": booking.get("created_at")
        },
        metadata=EventMetadata(
            idempotency_key=f"booking_created_{booking['id']}",
            source="api"
        )
    )
    
    logger.info(f"📨 Emitting booking_created for {booking_type} booking {booking['id']}")
    return await emit_event(event)


# ==================== EXPORT ====================

__all__ = [
    # Initialization
    "initialize_event_system",
    
    # Lead events
    "emit_lead_created",
    "emit_lead_assigned",
    "emit_lead_status_changed",
    
    # Deal events
    "emit_deal_created",
    "emit_deal_stage_changed",
    "emit_high_value_deal_detected",
    
    # Booking events
    "emit_booking_created",
    
    # Re-exports
    "EventTypes",
    "EventThresholds",
    "BusinessEvent",
    "EventActor",
    "EventEntity",
    "EventMetadata"
]
