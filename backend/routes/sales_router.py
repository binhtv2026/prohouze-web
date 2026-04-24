"""
ProHouzing Sales Router
Prompt 8/20 - Sales Pipeline, Booking & Deal Engine

APIs for:
- Deal management
- Soft booking (queue)
- Hard booking (confirmed)
- Sales events
- Allocation engine
- Pricing engine
- Payment plans
- Promotions
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from models.sales_models import (
    DealCreate, DealResponse, DealStageTransition, DealSearchRequest, DealPipelineSummary,
    SoftBookingCreate, SoftBookingResponse, SetPrioritiesRequest, SoftBookingSearchRequest,
    HardBookingCreate, HardBookingResponse, RecordDepositRequest,
    SalesEventCreate, SalesEventResponse,
    AllocationResult, AllocationRunResult, ManualAllocationRequest,
    PricingPolicyCreate, PricingPolicyResponse,
    PaymentPlanCreate, PaymentPlanResponse,
    PromotionCreate, PromotionResponse,
    PriceCalculationRequest, PriceCalculationResponse,
    PrioritySelection
)

from config.sales_config import (
    DealStage, SoftBookingStatus, HardBookingStatus, SalesEventStatus,
    PaymentPlanType, BookingTier,
    DEAL_STAGES_CONFIG, SOFT_BOOKING_STATUS_CONFIG, HARD_BOOKING_STATUS_CONFIG,
    SALES_EVENT_STATUS_CONFIG, BOOKING_TIER_CONFIG, PAYMENT_PLAN_TYPE_CONFIG,
    get_deal_stage, can_transition_deal_stage, get_pipeline_stages,
    ALLOCATION_CONFIG, PRICING_ENGINE_CONFIG
)

# Import notification service
from services.notification_service import (
    SalesNotificationType,
    create_sales_notification,
    notify_allocation_completed,
    notify_booking_allocated,
    notify_deal_stage_changed,
    notify_deposit_received,
    get_admin_user_ids,
    get_sales_manager_ids,
)

# Phase 2 Integration: Event emission
from services.automation.service_events import emit_booking_created
import logging

_logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/sales", tags=["Sales"])

# Database reference
_db = None


def set_database(database):
    """Set the database reference"""
    global _db
    _db = database


def get_db():
    """Get database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_code(prefix: str, counter: int) -> str:
    """Generate code like DEAL-202503-0001"""
    now = datetime.now(timezone.utc)
    return f"{prefix}-{now.strftime('%Y%m')}-{counter:04d}"


async def get_next_counter(collection_name: str, prefix: str) -> int:
    """Get next counter for code generation"""
    db = get_db()
    now = datetime.now(timezone.utc)
    month_key = f"{prefix}_{now.strftime('%Y%m')}"
    
    counter_doc = await db.counters.find_one_and_update(
        {"_id": month_key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return counter_doc.get("seq", 1)


async def get_next_queue_number(project_id: str, sales_event_id: str = None) -> int:
    """Get next queue number for soft booking"""
    db = get_db()
    query = {"project_id": project_id}
    if sales_event_id:
        query["sales_event_id"] = sales_event_id
    
    last_booking = await db.soft_bookings.find_one(
        query,
        sort=[("queue_number", -1)]
    )
    return (last_booking.get("queue_number", 0) if last_booking else 0) + 1


async def resolve_names(doc: Dict, db) -> Dict:
    """Resolve referenced entity names"""
    result = dict(doc)
    
    # Contact
    if doc.get("contact_id"):
        contact = await db.contacts.find_one({"id": doc["contact_id"]}, {"_id": 0, "full_name": 1, "phone": 1})
        if contact:
            result["contact_name"] = contact.get("full_name", "")
            result["contact_phone"] = contact.get("phone", "")
    
    # Project
    if doc.get("project_id"):
        project = await db.projects_master.find_one({"id": doc["project_id"]}, {"_id": 0, "name": 1})
        if project:
            result["project_name"] = project.get("name", "")
    
    # Product
    if doc.get("product_id"):
        product = await db.products.find_one({"id": doc["product_id"]}, {"_id": 0, "code": 1, "name": 1})
        if product:
            result["product_code"] = product.get("code", "")
            result["product_name"] = product.get("name", "")
    
    # Assigned user
    if doc.get("assigned_to"):
        user = await db.users.find_one({"id": doc["assigned_to"]}, {"_id": 0, "full_name": 1})
        if user:
            result["assigned_to_name"] = user.get("full_name", "")
    
    return result


# ============================================
# DEAL ROUTES
# ============================================

@router.post("/deals", response_model=DealResponse)
async def create_deal(deal: DealCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create a new deal"""
    db = get_db()
    
    # Verify contact exists
    contact = await db.contacts.find_one({"id": deal.contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=400, detail="Contact not found")
    
    # Verify project exists
    project = await db.projects_master.find_one({"id": deal.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=400, detail="Project not found")
    
    deal_id = str(uuid.uuid4())
    counter = await get_next_counter("deals", "DEAL")
    code = generate_code("DEAL", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    stage_config = get_deal_stage(deal.stage.value) or {}
    
    deal_doc = {
        "id": deal_id,
        "code": code,
        "tenant_id": deal.tenant_id,
        "contact_id": deal.contact_id,
        "lead_id": deal.lead_id,
        "project_id": deal.project_id,
        "product_id": None,
        "soft_booking_id": None,
        "hard_booking_id": None,
        "contract_id": None,
        "stage": deal.stage.value,
        "status": "active",
        "probability": stage_config.get("probability", 0),
        "estimated_value": deal.estimated_value,
        "final_value": 0,
        "discount_amount": 0,
        "pricing_policy_id": None,
        "payment_plan_id": None,
        "promotions": [],
        "assigned_to": deal.assigned_to or (current_user["id"] if current_user else None),
        "co_broker_id": deal.co_broker_id,
        "branch_id": deal.branch_id,
        "team_id": deal.team_id,
        "source": deal.source,
        "expected_close_date": deal.expected_close_date,
        "closed_at": None,
        "allocated_at": None,
        "lost_reason": None,
        "cancelled_reason": None,
        "notes": deal.notes,
        "tags": deal.tags,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now,
    }
    
    await db.deals.insert_one(deal_doc)
    
    # Log stage history
    await db.deal_stage_history.insert_one({
        "id": str(uuid.uuid4()),
        "deal_id": deal_id,
        "old_stage": None,
        "new_stage": deal.stage.value,
        "reason": "Deal created",
        "changed_at": now,
        "changed_by": current_user["id"] if current_user else None,
    })
    
    # Update contact stats
    await db.contacts.update_one(
        {"id": deal.contact_id},
        {"$inc": {"total_deals": 1}, "$set": {"updated_at": now}}
    )
    
    result = await resolve_names(deal_doc, db)
    result["stage_label"] = stage_config.get("label", "")
    result["stage_color"] = stage_config.get("color", "")
    
    return DealResponse(**{k: v for k, v in result.items() if k != "_id"})


@router.get("/deals", response_model=List[DealResponse])
async def get_deals(
    project_id: Optional[str] = None,
    stage: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List deals with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_id"] = project_id
    if stage:
        query["stage"] = stage
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    deals = await db.deals.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Batch resolve names
    contact_ids = list(set([d.get("contact_id") for d in deals if d.get("contact_id")]))
    project_ids = list(set([d.get("project_id") for d in deals if d.get("project_id")]))
    
    contacts = {}
    if contact_ids:
        contact_docs = await db.contacts.find({"id": {"$in": contact_ids}}, {"_id": 0}).to_list(len(contact_ids))
        contacts = {c["id"]: c for c in contact_docs}
    
    projects = {}
    if project_ids:
        project_docs = await db.projects_master.find({"id": {"$in": project_ids}}, {"_id": 0}).to_list(len(project_ids))
        projects = {p["id"]: p for p in project_docs}
    
    result = []
    for deal in deals:
        contact = contacts.get(deal.get("contact_id"), {})
        project = projects.get(deal.get("project_id"), {})
        stage_config = get_deal_stage(deal.get("stage", "")) or {}
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            if not (
                search_lower in contact.get("full_name", "").lower() or
                search_lower in deal.get("code", "").lower() or
                search_lower in project.get("name", "").lower()
            ):
                continue
        
        result.append(DealResponse(
            **deal,
            contact_name=contact.get("full_name", ""),
            contact_phone=contact.get("phone", ""),
            project_name=project.get("name", ""),
            stage_label=stage_config.get("label", ""),
            stage_color=stage_config.get("color", ""),
        ))
    
    return result


@router.get("/deals/pipeline", response_model=DealPipelineSummary)
async def get_deals_pipeline(
    project_id: Optional[str] = None,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """Get pipeline summary"""
    db = get_db()
    query: Dict[str, Any] = {"status": "active"}
    if project_id:
        query["project_id"] = project_id
    
    deals = await db.deals.find(query, {"_id": 0}).to_list(1000)
    
    by_stage = {}
    total_value = 0
    
    for deal in deals:
        stage = deal.get("stage", "interested")
        value = deal.get("estimated_value", 0) or deal.get("final_value", 0)
        
        if stage not in by_stage:
            by_stage[stage] = {"count": 0, "value": 0}
        
        by_stage[stage]["count"] += 1
        by_stage[stage]["value"] += value
        total_value += value
    
    return DealPipelineSummary(
        total_deals=len(deals),
        total_value=total_value,
        by_stage=by_stage,
        avg_deal_value=total_value / len(deals) if deals else 0,
    )


@router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get deal detail"""
    db = get_db()
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    result = await resolve_names(deal, db)
    stage_config = get_deal_stage(deal.get("stage", "")) or {}
    result["stage_label"] = stage_config.get("label", "")
    result["stage_color"] = stage_config.get("color", "")
    
    return DealResponse(**result)


@router.put("/deals/{deal_id}")
async def update_deal(deal_id: str, updates: Dict[str, Any], current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Update deal"""
    db = get_db()
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now
    
    # Remove protected fields
    for field in ["id", "code", "created_at", "created_by"]:
        updates.pop(field, None)
    
    await db.deals.update_one({"id": deal_id}, {"$set": updates})
    return {"success": True}


@router.put("/deals/{deal_id}/stage")
async def change_deal_stage(deal_id: str, transition: DealStageTransition, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Change deal stage"""
    db = get_db()
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    current_stage = deal.get("stage", "interested")
    new_stage = transition.new_stage.value
    
    if not can_transition_deal_stage(current_stage, new_stage):
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot transition from {current_stage} to {new_stage}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    stage_config = get_deal_stage(new_stage) or {}
    
    update_data = {
        "stage": new_stage,
        "probability": stage_config.get("probability", deal.get("probability", 0)),
        "updated_at": now,
    }
    
    # Handle terminal stages
    if stage_config.get("is_terminal"):
        update_data["status"] = "completed" if stage_config.get("is_success") else "lost"
        update_data["closed_at"] = now
        if new_stage == "lost" and transition.reason:
            update_data["lost_reason"] = transition.reason
    
    # Handle allocation
    if transition.allocated_product_id:
        update_data["product_id"] = transition.allocated_product_id
        update_data["allocated_at"] = now
    
    await db.deals.update_one({"id": deal_id}, {"$set": update_data})
    
    # Log stage history
    await db.deal_stage_history.insert_one({
        "id": str(uuid.uuid4()),
        "deal_id": deal_id,
        "old_stage": current_stage,
        "new_stage": new_stage,
        "reason": transition.reason,
        "changed_at": now,
        "changed_by": current_user["id"] if current_user else None,
    })
    
    # Send notification for stage change
    try:
        if deal.get("assigned_to"):
            old_config = get_deal_stage(current_stage) or {}
            new_config = get_deal_stage(new_stage) or {}
            await notify_deal_stage_changed(
                db,
                deal_code=deal.get("code", deal_id),
                old_stage=old_config.get("label", current_stage),
                new_stage=new_config.get("label", new_stage),
                assigned_user_id=deal.get("assigned_to"),
                deal_id=deal_id,
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send deal stage notification: {e}")
    
    result = {
        "success": True, 
        "old_stage": current_stage, 
        "new_stage": new_stage
    }
    
    # Create soft booking if needed
    if transition.create_soft_booking and stage_config.get("creates_soft_booking"):
        soft_booking_data = transition.soft_booking_data or {}
        soft_booking = await create_soft_booking_internal(
            deal_id=deal_id,
            contact_id=deal["contact_id"],
            project_id=deal["project_id"],
            data=soft_booking_data,
            current_user=current_user,
            db=db
        )
        result["soft_booking_id"] = soft_booking["id"]
    
    return result


@router.get("/deals/{deal_id}/timeline")
async def get_deal_timeline(deal_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get deal stage history"""
    db = get_db()
    history = await db.deal_stage_history.find(
        {"deal_id": deal_id}, 
        {"_id": 0}
    ).sort("changed_at", -1).to_list(100)
    
    # Resolve user names
    user_ids = list(set([h.get("changed_by") for h in history if h.get("changed_by")]))
    users = {}
    if user_ids:
        user_docs = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(len(user_ids))
        users = {u["id"]: u.get("full_name", "") for u in user_docs}
    
    for h in history:
        h["changed_by_name"] = users.get(h.get("changed_by"), "")
        old_config = get_deal_stage(h.get("old_stage", "")) or {}
        new_config = get_deal_stage(h.get("new_stage", "")) or {}
        h["old_stage_label"] = old_config.get("label", "")
        h["new_stage_label"] = new_config.get("label", "")
    
    return {"deal_id": deal_id, "history": history}


# ============================================
# SOFT BOOKING ROUTES
# ============================================

async def create_soft_booking_internal(
    deal_id: str,
    contact_id: str, 
    project_id: str,
    data: Dict,
    current_user: dict,
    db
) -> Dict:
    """Internal function to create soft booking"""
    booking_id = str(uuid.uuid4())
    counter = await get_next_counter("soft_bookings", "SB")
    code = generate_code("SB", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    queue_number = await get_next_queue_number(project_id, data.get("sales_event_id"))
    booking_tier = data.get("booking_tier", BookingTier.STANDARD.value)
    
    booking_doc = {
        "id": booking_id,
        "code": code,
        "tenant_id": data.get("tenant_id"),
        "deal_id": deal_id,
        "contact_id": contact_id,
        "project_id": project_id,
        "sales_event_id": data.get("sales_event_id"),
        "queue_number": queue_number,
        "queue_position": f"{booking_tier[0].upper()}{queue_number:03d}",
        "booking_tier": booking_tier,
        "status": SoftBookingStatus.PENDING.value,
        "booking_fee": data.get("booking_fee", 0),
        "booking_fee_paid": data.get("booking_fee_paid", 0),
        "booking_fee_status": "pending",
        "priority_selections": [],
        "allocated_product_id": None,
        "allocated_priority": None,
        "allocation_status": "pending",
        "allocation_notes": None,
        "notes": data.get("notes"),
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "confirmed_at": None,
        "selection_deadline": None,
        "allocated_at": None,
        "expires_at": None,
        "assigned_to": current_user["id"] if current_user else None,
    }
    
    await db.soft_bookings.insert_one(booking_doc)
    
    # Update deal with soft_booking_id
    await db.deals.update_one(
        {"id": deal_id},
        {"$set": {"soft_booking_id": booking_id, "updated_at": now}}
    )
    
    return booking_doc


@router.post("/soft-bookings", response_model=SoftBookingResponse)
async def create_soft_booking(booking: SoftBookingCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create soft booking (join queue)"""
    db = get_db()
    
    # Verify deal exists
    deal = await db.deals.find_one({"id": booking.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=400, detail="Deal not found")
    
    # Check if deal already has soft booking
    if deal.get("soft_booking_id"):
        raise HTTPException(status_code=400, detail="Deal already has a soft booking")
    
    booking_doc = await create_soft_booking_internal(
        deal_id=booking.deal_id,
        contact_id=booking.contact_id,
        project_id=booking.project_id,
        data=booking.model_dump(),
        current_user=current_user,
        db=db
    )
    
    # Phase 2: Emit booking_created event
    try:
        await emit_booking_created(booking_doc, "soft", current_user or "system")
    except Exception as e:
        _logger.warning(f"Event emission error (non-blocking): {e}")
    
    result = await resolve_names(booking_doc, db)
    status_config = SOFT_BOOKING_STATUS_CONFIG.get(booking_doc["status"], {})
    tier_config = BOOKING_TIER_CONFIG.get(booking_doc["booking_tier"], {})
    
    return SoftBookingResponse(
        **{k: v for k, v in result.items() if k != "_id"},
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
        booking_tier_label=tier_config.get("label", ""),
    )


@router.get("/soft-bookings", response_model=List[SoftBookingResponse])
async def get_soft_bookings(
    project_id: Optional[str] = None,
    sales_event_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List soft bookings"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_id"] = project_id
    if sales_event_id:
        query["sales_event_id"] = sales_event_id
    if status:
        query["status"] = status
    
    bookings = await db.soft_bookings.find(query, {"_id": 0}).sort("queue_number", 1).skip(skip).limit(limit).to_list(limit)
    
    # Batch resolve names
    contact_ids = list(set([b.get("contact_id") for b in bookings if b.get("contact_id")]))
    project_ids = list(set([b.get("project_id") for b in bookings if b.get("project_id")]))
    
    contacts = {}
    if contact_ids:
        contact_docs = await db.contacts.find({"id": {"$in": contact_ids}}, {"_id": 0}).to_list(len(contact_ids))
        contacts = {c["id"]: c for c in contact_docs}
    
    projects = {}
    if project_ids:
        project_docs = await db.projects_master.find({"id": {"$in": project_ids}}, {"_id": 0}).to_list(len(project_ids))
        projects = {p["id"]: p for p in project_docs}
    
    result = []
    for booking in bookings:
        contact = contacts.get(booking.get("contact_id"), {})
        project = projects.get(booking.get("project_id"), {})
        status_config = SOFT_BOOKING_STATUS_CONFIG.get(booking.get("status", ""), {})
        tier_config = BOOKING_TIER_CONFIG.get(booking.get("booking_tier", ""), {})
        
        result.append(SoftBookingResponse(
            **booking,
            contact_name=contact.get("full_name", ""),
            project_name=project.get("name", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            booking_tier_label=tier_config.get("label", ""),
        ))
    
    return result


@router.get("/soft-bookings/{booking_id}", response_model=SoftBookingResponse)
async def get_soft_booking(booking_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get soft booking detail"""
    db = get_db()
    booking = await db.soft_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Soft booking not found")
    
    result = await resolve_names(booking, db)
    status_config = SOFT_BOOKING_STATUS_CONFIG.get(booking.get("status", ""), {})
    tier_config = BOOKING_TIER_CONFIG.get(booking.get("booking_tier", ""), {})
    
    return SoftBookingResponse(
        **result,
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
        booking_tier_label=tier_config.get("label", ""),
    )


@router.put("/soft-bookings/{booking_id}/confirm")
async def confirm_soft_booking(booking_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Confirm soft booking"""
    db = get_db()
    booking = await db.soft_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Soft booking not found")
    
    if booking.get("status") != SoftBookingStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Booking is not in pending status")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.soft_bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": SoftBookingStatus.CONFIRMED.value,
            "confirmed_at": now,
        }}
    )
    
    return {"success": True, "status": SoftBookingStatus.CONFIRMED.value}


@router.put("/soft-bookings/{booking_id}/priorities")
async def set_priorities(booking_id: str, request: SetPrioritiesRequest, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Set priority selections for soft booking"""
    db = get_db()
    booking = await db.soft_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Soft booking not found")
    
    if booking.get("status") not in [SoftBookingStatus.CONFIRMED.value, SoftBookingStatus.SELECTING.value]:
        raise HTTPException(status_code=400, detail="Cannot set priorities in current status")
    
    # Validate priorities
    if len(request.priorities) > ALLOCATION_CONFIG["max_priorities"]:
        raise HTTPException(status_code=400, detail=f"Maximum {ALLOCATION_CONFIG['max_priorities']} priorities allowed")
    
    # Check for duplicate priorities
    priority_nums = [p.priority for p in request.priorities]
    if len(priority_nums) != len(set(priority_nums)):
        raise HTTPException(status_code=400, detail="Duplicate priority numbers not allowed")
    
    # Verify products exist and are available
    product_ids = [p.product_id for p in request.priorities]
    products = await db.products.find(
        {"id": {"$in": product_ids}},
        {"_id": 0, "id": 1, "code": 1, "name": 1, "inventory_status": 1, "floor_number": 1, "direction": 1, "area": 1, "base_price": 1}
    ).to_list(len(product_ids))
    
    product_map = {p["id"]: p for p in products}
    
    now = datetime.now(timezone.utc).isoformat()
    priority_selections = []
    
    for p in request.priorities:
        product = product_map.get(p.product_id)
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {p.product_id} not found")
        
        # Check availability (allow reserved for VIP)
        if product.get("inventory_status") not in ["available", "reserved"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Product {product.get('code')} is not available (status: {product.get('inventory_status')})"
            )
        
        priority_selections.append({
            "priority": p.priority,
            "product_id": p.product_id,
            "product_code": product.get("code", ""),
            "product_name": product.get("name", ""),
            "floor_number": product.get("floor_number"),
            "direction": product.get("direction"),
            "area": product.get("area"),
            "listed_price": product.get("base_price", 0),
            "status": "pending",
            "selected_at": now,
        })
    
    await db.soft_bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "priority_selections": priority_selections,
            "status": SoftBookingStatus.SELECTING.value,
        }}
    )
    
    return {"success": True, "priorities": priority_selections}


@router.put("/soft-bookings/{booking_id}/submit")
async def submit_priorities(booking_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Submit priorities and wait for allocation"""
    db = get_db()
    booking = await db.soft_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Soft booking not found")
    
    if booking.get("status") != SoftBookingStatus.SELECTING.value:
        raise HTTPException(status_code=400, detail="Booking is not in selecting status")
    
    if not booking.get("priority_selections"):
        raise HTTPException(status_code=400, detail="No priorities selected")
    
    await db.soft_bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": SoftBookingStatus.SUBMITTED.value}}
    )
    
    # Update deal stage
    if booking.get("deal_id"):
        await db.deals.update_one(
            {"id": booking["deal_id"]},
            {"$set": {"stage": DealStage.WAITING_ALLOCATION.value}}
        )
    
    return {"success": True, "status": SoftBookingStatus.SUBMITTED.value}


@router.post("/soft-bookings/{booking_id}/cancel")
async def cancel_soft_booking(booking_id: str, reason: str = None, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Cancel soft booking"""
    db = get_db()
    booking = await db.soft_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Soft booking not found")
    
    if booking.get("status") in [SoftBookingStatus.ALLOCATED.value, SoftBookingStatus.CANCELLED.value]:
        raise HTTPException(status_code=400, detail="Cannot cancel booking in current status")
    
    await db.soft_bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": SoftBookingStatus.CANCELLED.value,
            "allocation_notes": reason,
        }}
    )
    
    return {"success": True, "status": SoftBookingStatus.CANCELLED.value}


@router.get("/soft-bookings/queue/{project_id}")
async def get_booking_queue(
    project_id: str,
    sales_event_id: Optional[str] = None,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """Get booking queue for a project"""
    db = get_db()
    query = {"project_id": project_id}
    if sales_event_id:
        query["sales_event_id"] = sales_event_id
    
    query["status"] = {"$nin": [SoftBookingStatus.CANCELLED.value, SoftBookingStatus.EXPIRED.value]}
    
    bookings = await db.soft_bookings.find(query, {"_id": 0}).sort("queue_number", 1).to_list(1000)
    
    # Group by tier
    by_tier = {"vip": [], "priority": [], "standard": []}
    for b in bookings:
        tier = b.get("booking_tier", "standard")
        if tier in by_tier:
            by_tier[tier].append(b)
    
    return {
        "project_id": project_id,
        "total": len(bookings),
        "by_tier": by_tier,
        "queue": bookings,
    }


# ============================================
# SALES EVENT ROUTES
# ============================================

@router.post("/events", response_model=SalesEventResponse)
async def create_sales_event(event: SalesEventCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create sales event"""
    db = get_db()
    
    # Verify project
    project = await db.projects_master.find_one({"id": event.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=400, detail="Project not found")
    
    event_id = str(uuid.uuid4())
    counter = await get_next_counter("sales_events", "EVT")
    code = generate_code("EVT", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    event_doc = {
        "id": event_id,
        "code": code,
        "name": event.name,
        "tenant_id": event.tenant_id,
        "project_id": event.project_id,
        "block_ids": event.block_ids,
        "registration_start": event.registration_start,
        "registration_end": event.registration_end,
        "selection_start": event.selection_start,
        "selection_end": event.selection_end,
        "allocation_date": event.allocation_date,
        "status": SalesEventStatus.DRAFT.value,
        "available_product_ids": event.available_product_ids,
        "reserved_product_ids": event.reserved_product_ids,
        "total_products": len(event.available_product_ids),
        "total_bookings": 0,
        "allocated_count": 0,
        "manual_pending": 0,
        "max_bookings": event.max_bookings,
        "booking_fee": event.booking_fee,
        "notes": event.notes,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now,
    }
    
    await db.sales_events.insert_one(event_doc)
    
    status_config = SALES_EVENT_STATUS_CONFIG.get(event_doc["status"], {})
    
    return SalesEventResponse(
        **{k: v for k, v in event_doc.items() if k != "_id"},
        project_name=project.get("name", ""),
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
    )


@router.get("/events", response_model=List[SalesEventResponse])
async def get_sales_events(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List sales events"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    events = await db.sales_events.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Resolve project names
    project_ids = list(set([e.get("project_id") for e in events if e.get("project_id")]))
    projects = {}
    if project_ids:
        project_docs = await db.projects_master.find({"id": {"$in": project_ids}}, {"_id": 0}).to_list(len(project_ids))
        projects = {p["id"]: p for p in project_docs}
    
    result = []
    for event in events:
        project = projects.get(event.get("project_id"), {})
        status_config = SALES_EVENT_STATUS_CONFIG.get(event.get("status", ""), {})
        
        result.append(SalesEventResponse(
            **event,
            project_name=project.get("name", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
        ))
    
    return result


@router.get("/events/{event_id}", response_model=SalesEventResponse)
async def get_sales_event(event_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get sales event detail"""
    db = get_db()
    event = await db.sales_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Sales event not found")
    
    project = await db.projects_master.find_one({"id": event.get("project_id")}, {"_id": 0})
    status_config = SALES_EVENT_STATUS_CONFIG.get(event.get("status", ""), {})
    
    return SalesEventResponse(
        **event,
        project_name=project.get("name", "") if project else "",
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
    )


@router.put("/events/{event_id}")
async def update_sales_event(event_id: str, updates: Dict[str, Any], current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Update sales event"""
    db = get_db()
    event = await db.sales_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Sales event not found")
    
    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now
    
    # Remove protected fields
    for field in ["id", "code", "created_at", "created_by"]:
        updates.pop(field, None)
    
    await db.sales_events.update_one({"id": event_id}, {"$set": updates})
    return {"success": True}


# ============================================
# ALLOCATION ENGINE
# ============================================

@router.post("/events/{event_id}/run-allocation", response_model=AllocationRunResult)
async def run_allocation(event_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Run allocation engine for a sales event"""
    db = get_db()
    
    event = await db.sales_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Sales event not found")
    
    if event.get("status") not in [SalesEventStatus.SELECTION.value, SalesEventStatus.ALLOCATION.value]:
        raise HTTPException(status_code=400, detail="Event is not ready for allocation")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update event status
    await db.sales_events.update_one(
        {"id": event_id},
        {"$set": {"status": SalesEventStatus.ALLOCATION.value}}
    )
    
    # Get all submitted bookings sorted by tier weight then queue number
    bookings = await db.soft_bookings.find(
        {
            "sales_event_id": event_id,
            "status": SoftBookingStatus.SUBMITTED.value,
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Sort: VIP first (by tier weight desc), then queue number asc
    tier_weights = {t: c.get("queue_weight", 0) for t, c in BOOKING_TIER_CONFIG.items()}
    bookings.sort(key=lambda x: (-tier_weights.get(x.get("booking_tier", "standard"), 0), x.get("queue_number", 0)))
    
    # Get available products from event or fallback to project's available products
    available_product_ids = set(event.get("available_product_ids", []))
    reserved_product_ids = set(event.get("reserved_product_ids", []))
    
    # If event has no product list, get all available products from project
    if not available_product_ids:
        project_products = await db.products.find(
            {"project_id": event.get("project_id"), "inventory_status": "available"},
            {"_id": 0, "id": 1}
        ).to_list(10000)
        available_product_ids = set(p["id"] for p in project_products)
    
    # Track allocated products
    allocated_products = set()
    
    results = []
    successful = 0
    failed = 0
    manual_required = 0
    
    for booking in bookings:
        contact = await db.contacts.find_one({"id": booking.get("contact_id")}, {"_id": 0, "full_name": 1})
        
        allocation_result = AllocationResult(
            soft_booking_id=booking["id"],
            soft_booking_code=booking.get("code", ""),
            contact_id=booking.get("contact_id", ""),
            contact_name=contact.get("full_name", "") if contact else "",
            queue_number=booking.get("queue_number", 0),
            success=False,
            method="auto",
        )
        
        # Try each priority in order
        allocated = False
        for selection in sorted(booking.get("priority_selections", []), key=lambda x: x.get("priority", 99)):
            product_id = selection.get("product_id")
            
            # Check if product is available
            if product_id in available_product_ids and product_id not in allocated_products:
                # Check reserved products (only for VIP)
                if product_id in reserved_product_ids and booking.get("booking_tier") != BookingTier.VIP.value:
                    continue
                
                # Allocate!
                allocated_products.add(product_id)
                
                allocation_result.success = True
                allocation_result.product_id = product_id
                allocation_result.product_code = selection.get("product_code", "")
                allocation_result.allocated_priority = selection.get("priority")
                
                # Update booking
                await db.soft_bookings.update_one(
                    {"id": booking["id"]},
                    {"$set": {
                        "status": SoftBookingStatus.ALLOCATED.value,
                        "allocated_product_id": product_id,
                        "allocated_priority": selection.get("priority"),
                        "allocation_status": "success",
                        "allocated_at": now,
                    }}
                )
                
                # Update product inventory status
                await db.products.update_one(
                    {"id": product_id},
                    {"$set": {"inventory_status": "allocated"}}
                )
                
                # Update deal
                if booking.get("deal_id"):
                    await db.deals.update_one(
                        {"id": booking["deal_id"]},
                        {"$set": {
                            "stage": DealStage.ALLOCATED.value,
                            "product_id": product_id,
                            "allocated_at": now,
                        }}
                    )
                
                allocated = True
                successful += 1
                break
        
        if not allocated:
            # Find available alternatives
            remaining_available = available_product_ids - allocated_products
            allocation_result.reason = "All priorities unavailable"
            allocation_result.method = "manual_required"
            allocation_result.available_alternatives = list(remaining_available)[:5]
            
            # Update booking
            await db.soft_bookings.update_one(
                {"id": booking["id"]},
                {"$set": {
                    "status": SoftBookingStatus.FAILED.value,
                    "allocation_status": "failed",
                    "allocation_notes": "All priorities unavailable, manual allocation required",
                }}
            )
            
            failed += 1
            manual_required += 1
        
        results.append(allocation_result)
    
    # Update event stats
    await db.sales_events.update_one(
        {"id": event_id},
        {"$set": {
            "status": SalesEventStatus.COMPLETED.value,
            "allocated_count": successful,
            "manual_pending": manual_required,
            "updated_at": now,
        }}
    )
    
    # Store allocation results
    await db.allocation_results.insert_one({
        "id": str(uuid.uuid4()),
        "sales_event_id": event_id,
        "run_at": now,
        "total_bookings": len(bookings),
        "successful": successful,
        "failed": failed,
        "manual_required": manual_required,
        "results": [r.model_dump() for r in results],
    })
    
    # Send notifications
    try:
        # Notify admins about allocation completion
        admin_ids = await get_admin_user_ids(db)
        await notify_allocation_completed(
            db,
            event_id=event_id,
            event_name=event.get("name", event_id),
            total=len(bookings),
            successful=successful,
            failed=failed,
            manual_required=manual_required,
            admin_user_ids=admin_ids,
        )
        
        # Notify each sales person about their allocated bookings
        for result in results:
            if result.success:
                booking = next((b for b in bookings if b["id"] == result.soft_booking_id), None)
                if booking and booking.get("assigned_to"):
                    contact = await db.contacts.find_one(
                        {"id": booking.get("contact_id")}, 
                        {"_id": 0, "full_name": 1}
                    )
                    await notify_booking_allocated(
                        db,
                        booking_code=result.soft_booking_code,
                        contact_name=contact.get("full_name", "") if contact else "",
                        product_code=result.product_code or "",
                        priority=result.allocated_priority or 0,
                        assigned_user_id=booking.get("assigned_to"),
                        deal_id=booking.get("deal_id"),
                        booking_id=result.soft_booking_id,
                    )
    except Exception as e:
        # Don't fail allocation if notification fails
        import logging
        logging.getLogger(__name__).error(f"Failed to send allocation notifications: {e}")
    
    return AllocationRunResult(
        sales_event_id=event_id,
        run_at=now,
        total_bookings=len(bookings),
        successful=successful,
        failed=failed,
        manual_required=manual_required,
        results=results,
    )


@router.get("/events/{event_id}/allocation-results")
async def get_allocation_results(event_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get allocation results for an event"""
    db = get_db()
    
    result = await db.allocation_results.find_one(
        {"sales_event_id": event_id},
        {"_id": 0},
        sort=[("run_at", -1)]
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="No allocation results found")
    
    return result


@router.post("/events/{event_id}/manual-allocate")
async def manual_allocate(event_id: str, request: ManualAllocationRequest, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Manually allocate a product to a booking"""
    db = get_db()
    
    booking = await db.soft_bookings.find_one({"id": request.soft_booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Soft booking not found")
    
    if booking.get("sales_event_id") != event_id:
        raise HTTPException(status_code=400, detail="Booking does not belong to this event")
    
    if booking.get("status") not in [SoftBookingStatus.FAILED.value, SoftBookingStatus.SUBMITTED.value]:
        raise HTTPException(status_code=400, detail="Booking cannot be manually allocated")
    
    # Check product availability
    product = await db.products.find_one({"id": request.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.get("inventory_status") not in ["available", "reserved"]:
        raise HTTPException(status_code=400, detail="Product is not available")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Allocate
    await db.soft_bookings.update_one(
        {"id": request.soft_booking_id},
        {"$set": {
            "status": SoftBookingStatus.ALLOCATED.value,
            "allocated_product_id": request.product_id,
            "allocated_priority": 0,  # Manual
            "allocation_status": "success",
            "allocation_notes": f"Manual allocation: {request.reason}" if request.reason else "Manual allocation",
            "allocated_at": now,
        }}
    )
    
    # Update product
    await db.products.update_one(
        {"id": request.product_id},
        {"$set": {"inventory_status": "allocated"}}
    )
    
    # Update deal
    if booking.get("deal_id"):
        await db.deals.update_one(
            {"id": booking["deal_id"]},
            {"$set": {
                "stage": DealStage.ALLOCATED.value,
                "product_id": request.product_id,
                "allocated_at": now,
            }}
        )
    
    # Update event stats
    await db.sales_events.update_one(
        {"id": event_id},
        {"$inc": {"allocated_count": 1, "manual_pending": -1}}
    )
    
    return {"success": True, "product_id": request.product_id}


# ============================================
# HARD BOOKING ROUTES
# ============================================

@router.post("/hard-bookings", response_model=HardBookingResponse)
async def create_hard_booking(booking: HardBookingCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create hard booking (after allocation)"""
    db = get_db()
    
    # Verify soft booking
    soft_booking = await db.soft_bookings.find_one({"id": booking.soft_booking_id}, {"_id": 0})
    if not soft_booking:
        raise HTTPException(status_code=400, detail="Soft booking not found")
    
    if soft_booking.get("status") != SoftBookingStatus.ALLOCATED.value:
        raise HTTPException(status_code=400, detail="Soft booking is not allocated")
    
    # Verify product
    product = await db.products.find_one({"id": booking.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")
    
    hard_booking_id = str(uuid.uuid4())
    counter = await get_next_counter("hard_bookings", "HB")
    code = generate_code("HB", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    # Get base price from product
    unit_base_price = product.get("base_price", 0)
    
    hard_booking_doc = {
        "id": hard_booking_id,
        "code": code,
        "tenant_id": booking.tenant_id,
        "deal_id": booking.deal_id,
        "soft_booking_id": booking.soft_booking_id,
        "contact_id": booking.contact_id,
        "project_id": booking.project_id,
        "product_id": booking.product_id,
        "contract_id": None,
        "status": HardBookingStatus.ACTIVE.value,
        "unit_base_price": unit_base_price,
        "pricing_policy_id": booking.pricing_policy_id,
        "listed_price": unit_base_price,  # Will be calculated by pricing engine
        "discount_policy": 0,
        "discount_payment_plan": 0,
        "discount_promotion": 0,
        "discount_special": 0,
        "total_discount": 0,
        "final_price": unit_base_price,
        "deposit_amount": booking.deposit_amount,
        "deposit_paid": 0,
        "deposit_due_date": booking.deposit_due_date,
        "deposit_status": "pending",
        "payment_plan_id": booking.payment_plan_id,
        "created_at": now,
        "deposit_paid_at": None,
        "converted_to_contract_at": None,
        "expires_at": None,
    }
    
    await db.hard_bookings.insert_one(hard_booking_doc)
    
    # Update deal
    await db.deals.update_one(
        {"id": booking.deal_id},
        {"$set": {
            "hard_booking_id": hard_booking_id,
            "stage": DealStage.HARD_BOOKING.value,
            "updated_at": now,
        }}
    )
    
    # Update product status
    await db.products.update_one(
        {"id": booking.product_id},
        {"$set": {"inventory_status": "locked"}}
    )
    
    result = await resolve_names(hard_booking_doc, db)
    status_config = HARD_BOOKING_STATUS_CONFIG.get(hard_booking_doc["status"], {})
    
    return HardBookingResponse(
        **{k: v for k, v in result.items() if k != "_id"},
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
    )


@router.get("/hard-bookings", response_model=List[HardBookingResponse])
async def get_hard_bookings(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List hard bookings"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    bookings = await db.hard_bookings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for booking in bookings:
        resolved = await resolve_names(booking, db)
        status_config = HARD_BOOKING_STATUS_CONFIG.get(booking.get("status", ""), {})
        
        result.append(HardBookingResponse(
            **resolved,
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
        ))
    
    return result


@router.get("/hard-bookings/{booking_id}", response_model=HardBookingResponse)
async def get_hard_booking(booking_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get hard booking detail"""
    db = get_db()
    booking = await db.hard_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Hard booking not found")
    
    result = await resolve_names(booking, db)
    status_config = HARD_BOOKING_STATUS_CONFIG.get(booking.get("status", ""), {})
    
    return HardBookingResponse(
        **result,
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
    )


@router.put("/hard-bookings/{booking_id}/deposit")
async def record_deposit(booking_id: str, request: RecordDepositRequest, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Record deposit payment"""
    db = get_db()
    booking = await db.hard_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Hard booking not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    new_deposit_paid = booking.get("deposit_paid", 0) + request.amount
    deposit_amount = booking.get("deposit_amount", 0)
    
    # Determine status
    if new_deposit_paid >= deposit_amount:
        new_status = HardBookingStatus.DEPOSITED.value
    else:
        new_status = HardBookingStatus.DEPOSIT_PARTIAL.value
    
    await db.hard_bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "deposit_paid": new_deposit_paid,
            "deposit_status": "paid" if new_deposit_paid >= deposit_amount else "partial",
            "status": new_status,
            "deposit_paid_at": now,
        }}
    )
    
    # Update deal stage
    if booking.get("deal_id") and new_deposit_paid >= deposit_amount:
        await db.deals.update_one(
            {"id": booking["deal_id"]},
            {"$set": {"stage": DealStage.DEPOSITING.value}}
        )
    
    # Log payment
    await db.deposit_payments.insert_one({
        "id": str(uuid.uuid4()),
        "hard_booking_id": booking_id,
        "amount": request.amount,
        "payment_method": request.payment_method,
        "payment_reference": request.payment_reference,
        "payment_date": request.payment_date or now,
        "notes": request.notes,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
    })
    
    # Send deposit notification
    try:
        # Get soft booking to find assigned user
        soft_booking = await db.soft_bookings.find_one(
            {"id": booking.get("soft_booking_id")},
            {"_id": 0, "assigned_to": 1}
        )
        assigned_user = soft_booking.get("assigned_to") if soft_booking else None
        
        if not assigned_user:
            # Fallback to deal's assigned_to
            deal = await db.deals.find_one(
                {"id": booking.get("deal_id")},
                {"_id": 0, "assigned_to": 1}
            )
            assigned_user = deal.get("assigned_to") if deal else None
        
        if assigned_user:
            await notify_deposit_received(
                db,
                booking_code=booking.get("code", booking_id),
                amount=request.amount,
                paid=new_deposit_paid,
                total=deposit_amount,
                is_completed=new_deposit_paid >= deposit_amount,
                assigned_user_id=assigned_user,
                booking_id=booking_id,
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send deposit notification: {e}")
    
    return {
        "success": True,
        "deposit_paid": new_deposit_paid,
        "deposit_status": "paid" if new_deposit_paid >= deposit_amount else "partial",
        "status": new_status,
    }


@router.post("/hard-bookings/{booking_id}/convert-contract")
async def convert_to_contract(booking_id: str, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Convert hard booking to contract"""
    db = get_db()
    booking = await db.hard_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Hard booking not found")
    
    if booking.get("status") != HardBookingStatus.DEPOSITED.value:
        raise HTTPException(status_code=400, detail="Booking must be fully deposited to create contract")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create contract (basic - will be expanded in Prompt 9)
    contract_id = str(uuid.uuid4())
    counter = await get_next_counter("contracts", "CTR")
    code = generate_code("CTR", counter)
    
    contract_doc = {
        "id": contract_id,
        "code": code,
        "hard_booking_id": booking_id,
        "deal_id": booking.get("deal_id"),
        "contact_id": booking.get("contact_id"),
        "project_id": booking.get("project_id"),
        "product_id": booking.get("product_id"),
        "contract_value": booking.get("final_price", 0),
        "status": "draft",
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
    }
    
    await db.contracts.insert_one(contract_doc)
    
    # Update hard booking
    await db.hard_bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": HardBookingStatus.CONTRACTED.value,
            "contract_id": contract_id,
            "converted_to_contract_at": now,
        }}
    )
    
    # Update deal
    if booking.get("deal_id"):
        await db.deals.update_one(
            {"id": booking["deal_id"]},
            {"$set": {
                "stage": DealStage.CONTRACTING.value,
                "contract_id": contract_id,
            }}
        )
    
    # Update product
    await db.products.update_one(
        {"id": booking.get("product_id")},
        {"$set": {"inventory_status": "sold"}}
    )
    
    return {"success": True, "contract_id": contract_id, "contract_code": code}


# ============================================
# PRICING ENGINE
# ============================================

@router.post("/calculate-price", response_model=PriceCalculationResponse)
async def calculate_price(request: PriceCalculationRequest, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Calculate price for a product using pricing engine"""
    db = get_db()
    
    # Get product
    product = await db.products.find_one({"id": request.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Base values
    area = product.get("area", 0)
    base_price = product.get("base_price", 0)
    price_per_sqm = product.get("price_per_sqm", 0)
    
    if base_price == 0 and price_per_sqm > 0:
        base_price = area * price_per_sqm
    
    warnings = []
    policy_adjustments = []
    total_adjustment = 0
    
    # Get pricing policy if specified
    if request.pricing_policy_id:
        policy = await db.pricing_policies.find_one({"id": request.pricing_policy_id}, {"_id": 0})
        if policy:
            # Apply adjustments
            for adj in policy.get("adjustments", []):
                adj_type = adj.get("type", "")
                adj_value = adj.get("adjustment_value", 0)
                adj_percent = adj.get("adjustment_type") == "percent"
                
                should_apply = False
                
                # Simple rule evaluation
                if adj_type == "floor_premium" and product.get("floor_number", 0) >= 10:
                    should_apply = True
                elif adj_type == "view_premium" and product.get("view") in ["river", "sea", "city"]:
                    should_apply = True
                elif adj_type == "corner_premium" and product.get("position") == "corner":
                    should_apply = True
                
                if should_apply:
                    if adj_percent:
                        adj_amount = base_price * adj_value / 100
                    else:
                        adj_amount = adj_value
                    
                    total_adjustment += adj_amount
                    policy_adjustments.append({
                        "type": adj_type,
                        "value": adj_value,
                        "amount": adj_amount,
                    })
    
    listed_price = base_price + total_adjustment
    
    # Apply payment plan discount
    payment_plan_discount = 0
    if request.payment_plan_id:
        plan = await db.payment_plans.find_one({"id": request.payment_plan_id}, {"_id": 0})
        if plan:
            discount_percent = plan.get("discount_percent", 0)
            payment_plan_discount = listed_price * discount_percent / 100
    
    # Apply promotions
    promotion_discounts = []
    total_promo_discount = 0
    
    for promo_code in request.promotion_codes:
        promo = await db.promotions.find_one({"code": promo_code, "status": "active"}, {"_id": 0})
        if promo:
            if promo.get("discount_type") == "percent":
                promo_amount = listed_price * promo.get("discount_value", 0) / 100
            else:
                promo_amount = promo.get("discount_value", 0)
            
            total_promo_discount += promo_amount
            promotion_discounts.append({
                "code": promo_code,
                "name": promo.get("name", ""),
                "discount": promo_amount,
            })
    
    # Apply special discounts
    special_discount_total = 0
    for discount_type, discount_percent in request.special_discounts.items():
        discount_amount = listed_price * discount_percent / 100
        special_discount_total += discount_amount
    
    total_discount = payment_plan_discount + total_promo_discount + special_discount_total
    total_discount_percent = (total_discount / listed_price * 100) if listed_price > 0 else 0
    
    final_price = listed_price - total_discount
    
    # Check max discount
    max_discount = PRICING_ENGINE_CONFIG.get("max_total_discount_percent", 15)
    requires_approval = total_discount_percent > PRICING_ENGINE_CONFIG.get("requires_approval_above", 10)
    
    if total_discount_percent > max_discount:
        warnings.append(f"Total discount ({total_discount_percent:.1f}%) exceeds maximum ({max_discount}%)")
    
    if requires_approval:
        warnings.append(f"Discount > {PRICING_ENGINE_CONFIG.get('requires_approval_above')}% requires approval")
    
    return PriceCalculationResponse(
        product_id=product["id"],
        product_code=product.get("code", ""),
        unit_base_price=base_price,
        area=area,
        price_per_sqm=price_per_sqm if price_per_sqm > 0 else (base_price / area if area > 0 else 0),
        policy_adjustments=policy_adjustments,
        total_adjustment=total_adjustment,
        listed_price=listed_price,
        payment_plan_discount=payment_plan_discount,
        promotion_discounts=promotion_discounts,
        special_discounts=request.special_discounts,
        total_discount=total_discount,
        total_discount_percent=total_discount_percent,
        final_price=final_price,
        warnings=warnings,
        requires_approval=requires_approval,
    )


# ============================================
# PRICING POLICY ROUTES
# ============================================

@router.post("/pricing-policies", response_model=PricingPolicyResponse)
async def create_pricing_policy(policy: PricingPolicyCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create pricing policy"""
    db = get_db()
    
    policy_id = str(uuid.uuid4())
    counter = await get_next_counter("pricing_policies", "PP")
    code = generate_code("PP", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    policy_doc = {
        "id": policy_id,
        "code": code,
        **policy.model_dump(),
        "adjustments": [a.model_dump() for a in policy.adjustments],
        "status": "draft",
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "approved_by": None,
        "approved_at": None,
    }
    
    await db.pricing_policies.insert_one(policy_doc)
    
    # Get project name
    project = await db.projects_master.find_one({"id": policy.project_id}, {"_id": 0, "name": 1})
    
    return PricingPolicyResponse(
        **{k: v for k, v in policy_doc.items() if k != "_id"},
        project_name=project.get("name", "") if project else "",
    )


@router.get("/pricing-policies", response_model=List[PricingPolicyResponse])
async def get_pricing_policies(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List pricing policies"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    policies = await db.pricing_policies.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Resolve project names
    project_ids = list(set([p.get("project_id") for p in policies if p.get("project_id")]))
    projects = {}
    if project_ids:
        project_docs = await db.projects_master.find({"id": {"$in": project_ids}}, {"_id": 0}).to_list(len(project_ids))
        projects = {p["id"]: p for p in project_docs}
    
    return [
        PricingPolicyResponse(
            **p,
            project_name=projects.get(p.get("project_id"), {}).get("name", ""),
        )
        for p in policies
    ]


# ============================================
# PAYMENT PLAN ROUTES
# ============================================

@router.post("/payment-plans", response_model=PaymentPlanResponse)
async def create_payment_plan(plan: PaymentPlanCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create payment plan"""
    db = get_db()
    
    plan_id = str(uuid.uuid4())
    counter = await get_next_counter("payment_plans", "PTTT")
    code = generate_code("PTTT", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    plan_doc = {
        "id": plan_id,
        "code": code,
        **plan.model_dump(),
        "plan_type": plan.plan_type.value,
        "milestones": [m.model_dump() for m in plan.milestones],
        "status": "active",
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
    }
    
    await db.payment_plans.insert_one(plan_doc)
    
    # Get project name
    project = await db.projects_master.find_one({"id": plan.project_id}, {"_id": 0, "name": 1})
    plan_type_config = PAYMENT_PLAN_TYPE_CONFIG.get(plan.plan_type.value, {})
    
    return PaymentPlanResponse(
        **{k: v for k, v in plan_doc.items() if k != "_id"},
        project_name=project.get("name", "") if project else "",
        plan_type_label=plan_type_config.get("label", ""),
    )


@router.get("/payment-plans", response_model=List[PaymentPlanResponse])
async def get_payment_plans(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List payment plans"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    plans = await db.payment_plans.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Resolve project names
    project_ids = list(set([p.get("project_id") for p in plans if p.get("project_id")]))
    projects = {}
    if project_ids:
        project_docs = await db.projects_master.find({"id": {"$in": project_ids}}, {"_id": 0}).to_list(len(project_ids))
        projects = {p["id"]: p for p in project_docs}
    
    return [
        PaymentPlanResponse(
            **p,
            project_name=projects.get(p.get("project_id"), {}).get("name", ""),
            plan_type_label=PAYMENT_PLAN_TYPE_CONFIG.get(p.get("plan_type", ""), {}).get("label", ""),
        )
        for p in plans
    ]


# ============================================
# PROMOTION ROUTES
# ============================================

@router.post("/promotions", response_model=PromotionResponse)
async def create_promotion(promo: PromotionCreate, current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Create promotion"""
    db = get_db()
    
    promo_id = str(uuid.uuid4())
    counter = await get_next_counter("promotions", "PROMO")
    code = generate_code("PROMO", counter)
    now = datetime.now(timezone.utc).isoformat()
    
    promo_doc = {
        "id": promo_id,
        "code": code,
        **promo.model_dump(),
        "conditions": [c.model_dump() for c in promo.conditions],
        "status": "active",
        "current_uses": 0,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
    }
    
    await db.promotions.insert_one(promo_doc)
    
    return PromotionResponse(**{k: v for k, v in promo_doc.items() if k != "_id"})


@router.get("/promotions", response_model=List[PromotionResponse])
async def get_promotions(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[str] = Query(None, include_in_schema=False)
):
    """List promotions"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if project_id:
        query["project_ids"] = project_id
    if status:
        query["status"] = status
    
    promos = await db.promotions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [PromotionResponse(**p) for p in promos]


# ============================================
# CONFIG ROUTES
# ============================================

@router.get("/config/deal-stages")
async def get_deal_stages_config(current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get deal stages configuration"""
    return {
        "stages": [
            {"code": code, **config}
            for code, config in DEAL_STAGES_CONFIG.items()
        ],
        "pipeline_stages": get_pipeline_stages(),
    }


@router.get("/config/soft-booking-statuses")
async def get_soft_booking_statuses_config(current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get soft booking statuses"""
    return {"statuses": SOFT_BOOKING_STATUS_CONFIG}


@router.get("/config/hard-booking-statuses")
async def get_hard_booking_statuses_config(current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get hard booking statuses"""
    return {"statuses": HARD_BOOKING_STATUS_CONFIG}


@router.get("/config/booking-tiers")
async def get_booking_tiers_config(current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get booking tiers"""
    return {"tiers": BOOKING_TIER_CONFIG}


@router.get("/config/payment-plan-types")
async def get_payment_plan_types_config(current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get payment plan types"""
    return {"types": PAYMENT_PLAN_TYPE_CONFIG}


@router.get("/config/lost-reasons")
async def get_lost_reasons_config(current_user: Optional[str] = Query(None, include_in_schema=False)):
    """Get deal lost reasons"""
    from config.sales_config import DEAL_LOST_REASONS
    return {"reasons": DEAL_LOST_REASONS}
