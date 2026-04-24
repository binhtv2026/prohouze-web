"""
ProHouzing Inventory API Routes
PROMPT 5/20 - FINAL HARDEN: ANTI DOUBLE-SELL GUARANTEE (10/10 LOCKED)

API endpoints for inventory status management.
All status changes go through InventoryStatusService.

PROTECTION LAYERS:
1. Idempotency-Key header - Prevent duplicate processing
2. 409 CONFLICT for hold collision
3. Full request/response logging
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
import uuid as uuid_module

from core.database import get_db
from core.dependencies import CurrentUser, require_permission
from core.services.inventory_status import (
    inventory_status_service,
    InventoryStatusError,
    InvalidTransitionError,
    ProductNotFoundError,
    ProductNotAvailableError,
    ConcurrencyError,
    PermissionDeniedError,
    HoldExpiredError,
    HoldCollisionError,
    LockAcquisitionError,
    generate_idempotency_key,
)
from config.canonical_inventory import (
    InventoryStatus,
    STATUS_CONFIG,
    VALID_TRANSITIONS,
    get_status_config,
    get_valid_transitions,
)


router = APIRouter(prefix="/inventory-v2", tags=["Inventory V2"])


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class StatusChangeRequest(BaseModel):
    """Request to change product status."""
    new_status: str = Field(..., description="Target status")
    reason: Optional[str] = Field(None, description="Reason for change")
    hold_hours: Optional[int] = Field(None, ge=1, le=168, description="Hold duration in hours (1-168)")
    expected_version: Optional[int] = Field(None, description="Expected version for optimistic locking")


class HoldRequest(BaseModel):
    """Request to hold a product."""
    hold_hours: int = Field(24, ge=1, le=168, description="Hold duration in hours")
    reason: Optional[str] = None
    customer_id: Optional[UUID] = None


class ReleaseHoldRequest(BaseModel):
    """Request to release a hold."""
    reason: Optional[str] = None
    force: bool = Field(False, description="Force release even if not the holder (admin only)")


class BookingRequest(BaseModel):
    """Request from Booking service to change status."""
    booking_id: UUID
    action: str = Field(..., description="request, confirm, cancel")
    reason: Optional[str] = None
    expected_version: Optional[int] = None


class DealRequest(BaseModel):
    """Request from Deal service to change status."""
    deal_id: UUID
    action: str = Field(..., description="reserve, sold, cancel")
    contract_id: Optional[UUID] = None
    reason: Optional[str] = None


class StatusResponse(BaseModel):
    """Response for status operations."""
    success: bool
    product_id: UUID
    old_status: str
    new_status: str
    version: int
    message: Optional[str] = None
    request_id: Optional[str] = None


class StatusConfigResponse(BaseModel):
    """Status configuration response."""
    code: str
    name: str
    name_en: str
    color: str
    bg_color: str
    icon: str
    is_sellable: bool
    can_hold: bool
    can_book: bool
    valid_transitions: List[str]


class HoldCollisionResponse(BaseModel):
    """Response when hold collision occurs."""
    error: str = "hold_collision"
    message: str
    product_id: UUID
    current_holder_id: UUID
    hold_expires_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_request_id() -> str:
    """Generate unique request ID for tracking."""
    return str(uuid_module.uuid4())[:8]


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/config/statuses", response_model=List[StatusConfigResponse])
async def get_status_configurations():
    """
    Get all inventory status configurations.
    
    Returns status metadata and valid transitions for each status.
    """
    result = []
    for status_code, config in STATUS_CONFIG.items():
        result.append(StatusConfigResponse(
            code=status_code,
            name=config.get("name", status_code),
            name_en=config.get("name_en", status_code),
            color=config.get("color", "#gray"),
            bg_color=config.get("bg_color", "#f5f5f5"),
            icon=config.get("icon", "Circle"),
            is_sellable=config.get("is_sellable", False),
            can_hold=config.get("can_hold", False),
            can_book=config.get("can_book", False),
            valid_transitions=get_valid_transitions(status_code),
        ))
    
    # Sort by order
    result.sort(key=lambda x: STATUS_CONFIG.get(x.code, {}).get("order", 99))
    return result


@router.get("/config/transitions")
async def get_transition_rules():
    """
    Get all valid status transitions.
    
    Returns the state machine rules.
    """
    return {
        "transitions": VALID_TRANSITIONS,
        "statuses": list(InventoryStatus),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# STATUS CHANGE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/products/{product_id}/status", response_model=StatusResponse)
async def change_product_status(
    product_id: UUID,
    request: StatusChangeRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "edit")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
):
    """
    Change product inventory status.
    
    Headers:
    - Idempotency-Key: Prevent duplicate processing (recommended)
    - X-Request-ID: Custom request ID for tracking
    
    All status changes go through InventoryStatusService which enforces:
    - State machine transitions
    - Optimistic locking (version check)
    - Pessimistic locking (SELECT FOR UPDATE)
    - Audit logging
    """
    request_id = x_request_id or generate_request_id()
    
    try:
        # Get current status for response
        from core.models.product import Product
        from sqlalchemy import select, and_
        
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == current_user.org_id,
                Product.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        old_status = product.inventory_status
        
        # Change status through service
        updated = inventory_status_service.change_status(
            db=db,
            product_id=product_id,
            new_status=request.new_status,
            user_id=current_user.id,
            org_id=current_user.org_id,
            reason=request.reason,
            hold_hours=request.hold_hours,
            expected_version=request.expected_version,
            idempotency_key=idempotency_key,
            request_id=request_id,
        )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status=old_status,
            new_status=updated.inventory_status,
            version=updated.version,
            message=f"Status changed from {old_status} to {updated.inventory_status}",
            request_id=request_id,
        )
        
    except InvalidTransitionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "invalid_transition",
                "message": str(e),
                "current": e.current,
                "target": e.target,
                "valid_transitions": e.valid,
                "request_id": request_id,
            }
        )
    except ConcurrencyError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "version_mismatch",
                "message": str(e),
                "request_id": request_id,
            }
        )
    except LockAcquisitionError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "lock_failed",
                "message": str(e),
                "request_id": request_id,
            }
        )
    except PermissionDeniedError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "permission_denied", "message": str(e), "request_id": request_id},
        )
    except InventoryStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "inventory_error", "message": str(e), "request_id": request_id},
        )


@router.get("/products/{product_id}/valid-transitions")
async def get_valid_product_transitions(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view"))
):
    """
    Get valid status transitions for a product.
    
    Returns list of statuses the product can transition to.
    """
    from core.models.product import Product
    from sqlalchemy import select, and_
    
    query = select(Product).where(
        and_(
            Product.id == product_id,
            Product.org_id == current_user.org_id,
            Product.deleted_at.is_(None),
        )
    )
    result = db.execute(query)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    valid = get_valid_transitions(product.inventory_status)
    
    return {
        "product_id": product_id,
        "current_status": product.inventory_status,
        "version": product.version,
        "valid_transitions": [
            {
                "status": s,
                "config": get_status_config(s),
            }
            for s in valid
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# HOLD OPERATIONS (WITH 409 CONFLICT FOR COLLISION)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/products/{product_id}/hold", response_model=StatusResponse,
             responses={409: {"model": HoldCollisionResponse}})
async def hold_product(
    product_id: UUID,
    request: HoldRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "edit")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
):
    """
    Hold a product.
    
    Only products with status 'available' can be held.
    Hold will auto-expire after the specified duration.
    
    Returns:
    - 200: Hold successful
    - 409 CONFLICT: Product already held by another user
    
    Headers:
    - Idempotency-Key: Prevent duplicate processing (recommended)
    """
    request_id = x_request_id or generate_request_id()
    
    try:
        # Get old status
        from core.models.product import Product
        from sqlalchemy import select, and_
        
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == current_user.org_id,
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        old_status = product.inventory_status if product else "unknown"
        
        updated = inventory_status_service.hold_product(
            db=db,
            product_id=product_id,
            user_id=current_user.id,
            org_id=current_user.org_id,
            hold_hours=request.hold_hours,
            reason=request.reason,
            customer_id=request.customer_id,
            idempotency_key=idempotency_key,
        )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status=old_status,
            new_status=updated.inventory_status,
            version=updated.version,
            message=f"Product held for {request.hold_hours} hours until {updated.hold_expires_at}",
            request_id=request_id,
        )
        
    except ProductNotFoundError:
        raise HTTPException(status_code=404, detail="Product not found")
    
    except HoldCollisionError as e:
        # 409 CONFLICT - Product already held by someone else
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "hold_collision",
                "message": str(e),
                "product_id": str(e.product_id),
                "current_holder_id": str(e.holder_id),
                "hold_expires_at": e.expires_at.isoformat() if e.expires_at else None,
                "request_id": request_id,
            }
        )
    
    except LockAcquisitionError as e:
        # 409 CONFLICT - Cannot acquire lock
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "lock_failed",
                "message": str(e),
                "request_id": request_id,
            }
        )
    
    except ProductNotAvailableError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InventoryStatusError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/products/{product_id}/release-hold", response_model=StatusResponse)
async def release_product_hold(
    product_id: UUID,
    request: ReleaseHoldRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "edit")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
):
    """
    Release a product hold.
    
    By default, only the user who placed the hold can release it.
    Admins can use force=True to override.
    """
    request_id = x_request_id or generate_request_id()
    
    try:
        updated = inventory_status_service.release_hold(
            db=db,
            product_id=product_id,
            user_id=current_user.id,
            org_id=current_user.org_id,
            reason=request.reason,
            force=request.force,
            idempotency_key=idempotency_key,
        )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status="hold",
            new_status=updated.inventory_status,
            version=updated.version,
            message="Hold released",
            request_id=request_id,
        )
        
    except ProductNotFoundError:
        raise HTTPException(status_code=404, detail="Product not found")
    except ProductNotAvailableError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# BOOKING SERVICE INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/products/{product_id}/booking-request", response_model=StatusResponse)
async def handle_booking_request(
    product_id: UUID,
    request: BookingRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "create")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
):
    """
    Handle booking service requests.
    
    This is the ONLY endpoint Booking service should use to change product status.
    
    Actions:
    - request: Move from HOLD to BOOKING_PENDING
    - confirm: Move from BOOKING_PENDING to BOOKED
    - cancel: Return to AVAILABLE
    
    Headers:
    - Idempotency-Key: REQUIRED for production use
    """
    request_id = x_request_id or generate_request_id()
    
    # Generate idempotency key if not provided
    if not idempotency_key:
        idempotency_key = generate_idempotency_key(
            product_id, f"booking_{request.action}", current_user.id, str(request.booking_id)
        )
    
    try:
        # Get old status
        from core.models.product import Product
        from sqlalchemy import select, and_
        
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == current_user.org_id,
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        old_status = product.inventory_status if product else "unknown"
        
        if request.action == "request":
            updated = inventory_status_service.request_booking(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                booking_id=request.booking_id,
                expected_version=request.expected_version,
                idempotency_key=idempotency_key,
            )
        elif request.action == "confirm":
            updated = inventory_status_service.confirm_booking(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                booking_id=request.booking_id,
                idempotency_key=idempotency_key,
            )
        elif request.action == "cancel":
            updated = inventory_status_service.cancel_booking(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                booking_id=request.booking_id,
                reason=request.reason or "Booking cancelled",
                idempotency_key=idempotency_key,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {request.action}. Valid: request, confirm, cancel"
            )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status=old_status,
            new_status=updated.inventory_status,
            version=updated.version,
            message=f"Booking {request.action} successful",
            request_id=request_id,
        )
        
    except ProductNotFoundError:
        raise HTTPException(status_code=404, detail="Product not found")
    except ProductNotAvailableError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HoldExpiredError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LockAcquisitionError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "lock_failed",
                "message": str(e),
                "request_id": request_id,
            }
        )
    except InvalidTransitionError as e:
        raise HTTPException(status_code=400, detail={
            "error": "invalid_transition",
            "message": str(e),
            "valid_transitions": e.valid,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# DEAL SERVICE INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/products/{product_id}/deal-request", response_model=StatusResponse)
async def handle_deal_request(
    product_id: UUID,
    request: DealRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "edit")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
):
    """
    Handle deal service requests.
    
    This is the ONLY endpoint Deal service should use to change product status.
    
    Actions:
    - reserve: Move to RESERVED (deposit received)
    - sold: Move to SOLD (contract signed)
    - cancel: Return to appropriate status
    
    Headers:
    - Idempotency-Key: REQUIRED for production use
    """
    request_id = x_request_id or generate_request_id()
    
    # Generate idempotency key if not provided
    if not idempotency_key:
        idempotency_key = generate_idempotency_key(
            product_id, f"deal_{request.action}", current_user.id, str(request.deal_id)
        )
    
    try:
        # Get old status
        from core.models.product import Product
        from sqlalchemy import select, and_
        
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == current_user.org_id,
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        old_status = product.inventory_status if product else "unknown"
        
        if request.action == "reserve":
            updated = inventory_status_service.mark_reserved(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                deal_id=request.deal_id,
                idempotency_key=idempotency_key,
            )
        elif request.action == "sold":
            if not request.contract_id:
                raise HTTPException(status_code=400, detail="contract_id required for sold action")
            updated = inventory_status_service.mark_sold(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                contract_id=request.contract_id,
                idempotency_key=idempotency_key,
            )
        elif request.action == "cancel":
            updated = inventory_status_service.change_status(
                db=db,
                product_id=product_id,
                new_status=InventoryStatus.AVAILABLE.value,
                user_id=current_user.id,
                org_id=current_user.org_id,
                source="deal",
                source_ref_type="deal",
                source_ref_id=request.deal_id,
                reason=request.reason or "Deal cancelled",
                idempotency_key=idempotency_key,
                request_id=request_id,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {request.action}. Valid: reserve, sold, cancel"
            )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status=old_status,
            new_status=updated.inventory_status,
            version=updated.version,
            message=f"Deal {request.action} successful",
            request_id=request_id,
        )
        
    except ProductNotFoundError:
        raise HTTPException(status_code=404, detail="Product not found")
    except LockAcquisitionError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "lock_failed",
                "message": str(e),
                "request_id": request_id,
            }
        )
    except InvalidTransitionError as e:
        raise HTTPException(status_code=400, detail={
            "error": "invalid_transition",
            "message": str(e),
            "valid_transitions": e.valid,
        })
    except InventoryStatusError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/products/{product_id}/block", response_model=StatusResponse)
async def block_product(
    product_id: UUID,
    reason: str = Query(..., min_length=5),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "admin")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Block a product (admin only).
    
    Blocked products cannot be sold until unblocked.
    """
    try:
        # Get old status
        from core.models.product import Product
        from sqlalchemy import select, and_
        
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == current_user.org_id,
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        old_status = product.inventory_status if product else "unknown"
        
        updated = inventory_status_service.block_product(
            db=db,
            product_id=product_id,
            user_id=current_user.id,
            org_id=current_user.org_id,
            reason=reason,
            idempotency_key=idempotency_key,
        )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status=old_status,
            new_status=updated.inventory_status,
            version=updated.version,
            message=f"Product blocked: {reason}",
        )
        
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except InventoryStatusError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/products/{product_id}/unblock", response_model=StatusResponse)
async def unblock_product(
    product_id: UUID,
    target_status: str = Query(InventoryStatus.AVAILABLE.value),
    reason: str = Query("Unblocked by admin"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "admin")),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Unblock a product (admin only).
    """
    try:
        updated = inventory_status_service.unblock_product(
            db=db,
            product_id=product_id,
            user_id=current_user.id,
            org_id=current_user.org_id,
            target_status=target_status,
            reason=reason,
            idempotency_key=idempotency_key,
        )
        
        return StatusResponse(
            success=True,
            product_id=product_id,
            old_status="blocked",
            new_status=updated.inventory_status,
            version=updated.version,
            message="Product unblocked",
        )
        
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except InvalidTransitionError as e:
        raise HTTPException(status_code=400, detail={
            "error": "invalid_transition",
            "message": str(e),
            "valid_transitions": e.valid,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT HISTORY
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/products/{product_id}/events")
async def get_product_events(
    product_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view"))
):
    """
    Get inventory event history for a product.
    """
    from core.models.product import InventoryEvent
    from sqlalchemy import select, and_
    
    query = select(InventoryEvent).where(
        and_(
            InventoryEvent.product_id == product_id,
            InventoryEvent.org_id == current_user.org_id,
        )
    ).order_by(InventoryEvent.created_at.desc()).limit(limit)
    
    result = db.execute(query)
    events = list(result.scalars().all())
    
    return {
        "product_id": product_id,
        "total": len(events),
        "events": [
            {
                "id": str(e.id),
                "old_status": e.old_status,
                "new_status": e.new_status,
                "source": e.source,
                "source_ref_type": e.source_ref_type,
                "source_ref_id": str(e.source_ref_id) if e.source_ref_id else None,
                "reason": e.reason,
                "triggered_by": str(e.triggered_by) if e.triggered_by else None,
                "metadata": e.metadata_json,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND JOB ENDPOINT (Internal use)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/jobs/expire-holds")
async def run_expire_holds_job(
    org_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "admin"))
):
    """
    Run the expire holds job.
    
    This should be called by a scheduler (e.g., every 5 minutes).
    Can also be triggered manually by admin.
    """
    expired_ids = inventory_status_service.expire_holds(
        db=db,
        org_id=org_id or current_user.org_id,
    )
    
    return {
        "success": True,
        "expired_count": len(expired_ids),
        "expired_product_ids": [str(pid) for pid in expired_ids],
    }
