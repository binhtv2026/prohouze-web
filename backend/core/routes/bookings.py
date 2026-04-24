"""
ProHouzing API v2 - Booking Router
Version: 1.0.0

Booking (giữ chỗ) management endpoints.
"""

from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.booking import booking_service
from core.schemas.transaction import BookingCreate, BookingUpdate, BookingResponse
from core.schemas.base import APIResponse, PaginationMeta

router = APIRouter(prefix="/bookings", tags=["Bookings"])


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=APIResponse[BookingResponse], status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "create"))
):
    """
    Create a new booking (giữ chỗ).
    
    - Auto-generates booking_code
    - Locks the product
    - Updates the deal
    """
    data.org_id = current_user.org_id
    
    booking = booking_service.create(
        db,
        obj_in=data,
        org_id=current_user.org_id,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(booking),
        message="Booking created successfully"
    )


@router.get("", response_model=APIResponse[List[BookingResponse]])
async def list_bookings(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    booking_status: Optional[str] = None,
    deal_id: Optional[UUID] = None,
    customer_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "view"))
):
    """List bookings with pagination and filtering."""
    skip = (page - 1) * limit
    filters = {}
    
    if booking_status:
        filters["booking_status"] = booking_status
    if deal_id:
        filters["deal_id"] = deal_id
    if customer_id:
        filters["customer_id"] = customer_id
    if product_id:
        filters["product_id"] = product_id
    
    bookings, total = booking_service.get_multi(
        db,
        org_id=current_user.org_id,
        user_id=current_user.id,  # VISIBILITY FILTER
        skip=skip,
        limit=limit,
        filters=filters if filters else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    pagination = booking_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[BookingResponse.model_validate(b) for b in bookings],
        meta=pagination
    )


@router.get("/{booking_id}", response_model=APIResponse[BookingResponse])
async def get_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "view"))
):
    """Get a single booking by ID with ACCESS CHECK."""
    booking = booking_service.get(
        db,
        id=booking_id,
        org_id=current_user.org_id
    )
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # ACCESS CHECK
    if not booking_service.can_access_entity(db, entity=booking, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to view this booking"
        )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(booking)
    )


@router.put("/{booking_id}", response_model=APIResponse[BookingResponse])
async def update_booking(
    booking_id: UUID,
    data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "edit"))
):
    """Update a booking with ACCESS CHECK."""
    booking = booking_service.get(db, id=booking_id, org_id=current_user.org_id)
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # ACCESS CHECK
    if not booking_service.can_access_entity(db, entity=booking, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to edit this booking"
        )
    
    updated_booking = booking_service.update(
        db,
        id=booking_id,
        org_id=current_user.org_id,
        obj_in=data,
        updated_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(updated_booking),
        message="Booking updated successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIRMATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{booking_id}/confirm", response_model=APIResponse[BookingResponse])
async def confirm_booking(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "approve"))
):
    """Confirm a pending booking."""
    booking = booking_service.confirm(
        db,
        id=booking_id,
        org_id=current_user.org_id,
        confirmed_by=current_user.id
    )
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking not found or cannot be confirmed"
        )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(booking),
        message="Booking confirmed"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CANCELLATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{booking_id}/cancel", response_model=APIResponse[BookingResponse])
async def cancel_booking(
    booking_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "cancel"))
):
    """
    Cancel a booking and release the product.
    """
    booking = booking_service.cancel(
        db,
        id=booking_id,
        org_id=current_user.org_id,
        reason=reason,
        cancelled_by=current_user.id
    )
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking not found or cannot be cancelled"
        )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(booking),
        message="Booking cancelled"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{booking_id}/convert-to-deposit", response_model=APIResponse[BookingResponse])
async def convert_booking_to_deposit(
    booking_id: UUID,
    deposit_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "edit"))
):
    """Mark booking as converted to deposit."""
    booking = booking_service.convert_to_deposit(
        db,
        id=booking_id,
        org_id=current_user.org_id,
        deposit_id=deposit_id,
        converted_by=current_user.id
    )
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking not found or not confirmed"
        )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(booking),
        message="Booking converted to deposit"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# EXPIRATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/check-expired", response_model=APIResponse[List[BookingResponse]])
async def check_and_expire_bookings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "edit"))
):
    """
    Check and expire overdue bookings.
    
    - Sets status to "expired" for bookings past valid_until
    - Releases products
    """
    expired = booking_service.check_and_expire(
        db,
        org_id=current_user.org_id
    )
    
    return APIResponse(
        success=True,
        data=[BookingResponse.model_validate(b) for b in expired],
        message=f"{len(expired)} bookings expired"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/by-deal/{deal_id}", response_model=APIResponse[List[BookingResponse]])
async def get_bookings_by_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "view"))
):
    """Get all bookings for a deal."""
    bookings = booking_service.get_by_deal(
        db,
        org_id=current_user.org_id,
        deal_id=deal_id
    )
    
    return APIResponse(
        success=True,
        data=[BookingResponse.model_validate(b) for b in bookings]
    )


@router.get("/by-product/{product_id}/active", response_model=APIResponse[Optional[BookingResponse]])
async def get_active_booking_for_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("bookings", "view"))
):
    """Get active booking for a product (pending or confirmed)."""
    booking = booking_service.get_active_for_product(
        db,
        org_id=current_user.org_id,
        product_id=product_id
    )
    
    return APIResponse(
        success=True,
        data=BookingResponse.model_validate(booking) if booking else None
    )
