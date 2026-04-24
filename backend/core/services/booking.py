"""
ProHouzing Booking Service
Version: 3.0.0 (Prompt 5/20 - REFACTORED)

CRITICAL CHANGE:
- ALL product status changes now go through InventoryStatusService
- Direct product.inventory_status = xxx is BANNED

Booking management with:
- Product status via InventoryStatusService (SINGLE ENTRY POINT)
- Expiration handling
- Conversion to deposit
- Event emission
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from .base import BaseService
from ..models.booking import Booking
from ..models.product import Product
from ..models.deal import Deal
from ..models.base import generate_code, utc_now
from ..schemas.transaction import BookingCreate, BookingUpdate

# PROMPT 5/20: Import InventoryStatusService - SINGLE ENTRY POINT
from .inventory_status import (
    inventory_status_service,
    InventoryStatusError,
    ProductNotFoundError,
    ProductNotAvailableError,
    HoldExpiredError,
    InvalidTransitionError,
)
from config.canonical_inventory import InventoryStatus, StatusChangeSource


class BookingService(BaseService[Booking, BookingCreate, BookingUpdate]):
    """
    Booking service with product locking via InventoryStatusService.
    
    PROMPT 5/20 RULES:
    - NEVER set product.inventory_status directly
    - ALWAYS use inventory_status_service for status changes
    - Booking creates request, InventoryService validates & executes
    """
    
    def __init__(self):
        super().__init__(Booking)
    
    def create(
        self,
        db: Session,
        *,
        obj_in: BookingCreate,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> Booking:
        """
        Create a booking.
        
        FLOW:
        1. Product must be on HOLD by the same user
        2. Request booking via InventoryStatusService
        3. Create booking record
        4. Update deal
        """
        obj_data = obj_in.model_dump(exclude_unset=True)
        product_id = obj_data.get('product_id')
        
        # Validate product exists and is in correct state
        if product_id:
            self._validate_product_for_booking(db, product_id, org_id, created_by)
        
        # Generate booking_code if not provided
        if not obj_data.get('booking_code'):
            obj_data['booking_code'] = self._generate_code(db, org_id)
        
        obj_data['org_id'] = org_id
        obj_data['booked_at'] = utc_now()
        obj_data['booking_status'] = 'pending'
        
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        booking = Booking(**obj_data)
        db.add(booking)
        db.flush()  # Get booking.id before committing
        
        # PROMPT 5/20: Request booking via InventoryStatusService
        if product_id:
            try:
                inventory_status_service.request_booking(
                    db=db,
                    product_id=product_id,
                    user_id=created_by,
                    org_id=org_id,
                    booking_id=booking.id,
                )
            except HoldExpiredError as e:
                db.rollback()
                raise ValueError(f"Cannot create booking: {e}")
            except InvalidTransitionError as e:
                db.rollback()
                raise ValueError(f"Cannot create booking: {e}")
            except InventoryStatusError as e:
                db.rollback()
                raise ValueError(f"Cannot create booking: {e}")
        
        db.commit()
        db.refresh(booking)
        
        # Update deal
        if obj_data.get('deal_id'):
            self._update_deal_booking(db, obj_data['deal_id'], org_id, booking)
        
        # Emit booking.created event
        self._emit_booking_created(db, booking, created_by)
        
        return booking
    
    def _validate_product_for_booking(
        self,
        db: Session,
        product_id: UUID,
        org_id: UUID,
        user_id: UUID
    ) -> Product:
        """
        Validate product is in correct state for booking.
        
        Rules:
        - Product must exist
        - Product must be on HOLD
        - Hold must be by the same user
        """
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        # Check if product is on hold (required before booking)
        if product.inventory_status != InventoryStatus.HOLD.value:
            raise ValueError(
                f"Product must be on hold before booking. "
                f"Current status: {product.inventory_status}"
            )
        
        # Check hold ownership
        if product.hold_by_user_id and str(product.hold_by_user_id) != str(user_id):
            raise ValueError(
                "Product is held by another user. Cannot create booking."
            )
        
        return product
    
    def _emit_booking_created(
        self,
        db: Session,
        booking: Booking,
        actor_user_id: Optional[UUID]
    ) -> None:
        """Emit booking.created event."""
        try:
            from .event_service import event_service
            from .event_catalog import EventCode
            
            event_service.emit_event(
                db,
                event_code=EventCode.BOOKING_CREATED,
                org_id=booking.org_id,
                aggregate_type="booking",
                aggregate_id=booking.id,
                payload={
                    "booking_code": booking.booking_code,
                    "customer_id": str(booking.customer_id) if booking.customer_id else None,
                    "customer_name": None,
                    "product_id": str(booking.product_id) if booking.product_id else None,
                    "booking_amount": float(booking.booking_amount) if booking.booking_amount else None,
                    "entity_name": booking.booking_code,
                },
                actor_user_id=actor_user_id,
                actor_type="user",
                entity_code=booking.booking_code,
                entity_name=booking.booking_code,
                related_customer_id=booking.customer_id,
                related_deal_id=booking.deal_id,
                related_product_id=booking.product_id,
            )
            db.commit()
        except Exception as e:
            # Don't fail booking creation if event emission fails
            pass
    
    def _generate_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique booking code."""
        query = select(func.count()).select_from(Booking).where(Booking.org_id == org_id)
        count = db.execute(query).scalar() or 0
        return generate_code("BK", count + 1)
    
    def _update_deal_booking(
        self,
        db: Session,
        deal_id: UUID,
        org_id: UUID,
        booking: Booking
    ) -> None:
        """Update deal with booking info."""
        query = select(Deal).where(
            and_(Deal.id == deal_id, Deal.org_id == org_id)
        )
        result = db.execute(query)
        deal = result.scalar_one_or_none()
        
        if deal:
            deal.booking_id = booking.id
            deal.booking_date = booking.booked_at.date()
            deal.booking_amount = booking.booking_amount
            
            # Auto change stage to booking if not already past it
            if deal.current_stage in ["new", "qualified", "viewing", "proposal", "negotiation"]:
                deal.change_stage("booking")
            
            db.add(deal)
            db.commit()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONFIRMATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def confirm(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        confirmed_by: UUID
    ) -> Optional[Booking]:
        """
        Confirm a booking.
        
        FLOW:
        1. Update booking status to confirmed
        2. Update product status to BOOKED via InventoryStatusService
        """
        booking = self.get(db, id=id, org_id=org_id)
        if not booking or booking.booking_status != "pending":
            return None
        
        # PROMPT 5/20: Confirm booking via InventoryStatusService
        if booking.product_id:
            try:
                inventory_status_service.confirm_booking(
                    db=db,
                    product_id=booking.product_id,
                    user_id=confirmed_by,
                    org_id=org_id,
                    booking_id=booking.id,
                )
            except InventoryStatusError as e:
                raise ValueError(f"Cannot confirm booking: {e}")
        
        booking.booking_status = "confirmed"
        booking.confirmed_at = utc_now()
        booking.confirmed_by = confirmed_by
        booking.updated_by = confirmed_by
        
        db.add(booking)
        db.commit()
        db.refresh(booking)
        
        # Emit booking.confirmed event
        self._emit_booking_event(db, booking, "confirmed", confirmed_by)
        
        return booking
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CANCELLATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def cancel(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        reason: str,
        cancelled_by: UUID
    ) -> Optional[Booking]:
        """
        Cancel a booking and release product.
        
        FLOW:
        1. Update booking status to cancelled
        2. Release product via InventoryStatusService (back to available)
        """
        booking = self.get(db, id=id, org_id=org_id)
        if not booking or booking.booking_status not in ["pending", "confirmed"]:
            return None
        
        # PROMPT 5/20: Cancel booking via InventoryStatusService
        if booking.product_id:
            try:
                inventory_status_service.cancel_booking(
                    db=db,
                    product_id=booking.product_id,
                    user_id=cancelled_by,
                    org_id=org_id,
                    booking_id=booking.id,
                    reason=reason,
                )
            except InventoryStatusError as e:
                # Log error but continue with booking cancellation
                pass
        
        booking.booking_status = "cancelled"
        booking.cancelled_at = utc_now()
        booking.cancelled_by = cancelled_by
        booking.cancel_reason = reason
        booking.updated_by = cancelled_by
        
        db.add(booking)
        db.commit()
        db.refresh(booking)
        
        # Emit booking.cancelled event
        self._emit_booking_event(db, booking, "cancelled", cancelled_by, reason)
        
        return booking
    
    def _emit_booking_event(
        self,
        db: Session,
        booking: Booking,
        event_type: str,
        actor_user_id: UUID,
        reason: Optional[str] = None
    ) -> None:
        """Emit booking status change events."""
        try:
            from .event_service import event_service
            from .event_catalog import EventCode
            
            event_map = {
                "confirmed": EventCode.BOOKING_CONFIRMED,
                "cancelled": EventCode.BOOKING_CANCELLED,
            }
            
            event_code = event_map.get(event_type)
            if not event_code:
                return
            
            payload = {
                "booking_code": booking.booking_code,
                "booking_status": booking.booking_status,
                "entity_name": booking.booking_code,
            }
            if reason:
                payload["cancel_reason"] = reason
            
            event_service.emit_event(
                db,
                event_code=event_code,
                org_id=booking.org_id,
                aggregate_type="booking",
                aggregate_id=booking.id,
                payload=payload,
                actor_user_id=actor_user_id,
                actor_type="user",
                entity_code=booking.booking_code,
                entity_name=booking.booking_code,
                related_customer_id=booking.customer_id,
                related_deal_id=booking.deal_id,
                related_product_id=booking.product_id,
            )
            db.commit()
        except Exception as e:
            pass
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EXPIRATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def check_and_expire(
        self,
        db: Session,
        *,
        org_id: UUID
    ) -> List[Booking]:
        """
        Check and expire overdue bookings.
        
        FLOW:
        1. Find expired pending bookings
        2. Update booking status to expired
        3. Release product via InventoryStatusService
        """
        now = utc_now()
        
        query = select(Booking).where(
            and_(
                Booking.org_id == org_id,
                Booking.booking_status == "pending",
                Booking.valid_until < now,
                Booking.deleted_at.is_(None)
            )
        )
        
        result = db.execute(query)
        expired_bookings = list(result.scalars().all())
        
        for booking in expired_bookings:
            booking.booking_status = "expired"
            
            # PROMPT 5/20: Release product via InventoryStatusService
            if booking.product_id:
                try:
                    inventory_status_service.cancel_booking(
                        db=db,
                        product_id=booking.product_id,
                        user_id=booking.created_by,
                        org_id=org_id,
                        booking_id=booking.id,
                        reason="Booking expired",
                    )
                except InventoryStatusError:
                    # Continue even if status change fails
                    pass
            
            db.add(booking)
        
        db.commit()
        return expired_bookings
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONVERSION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def convert_to_deposit(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        deposit_id: UUID,
        converted_by: UUID
    ) -> Optional[Booking]:
        """
        Mark booking as converted to deposit.
        
        FLOW:
        1. Update booking status to converted
        2. Update product status to RESERVED via InventoryStatusService
        """
        booking = self.get(db, id=id, org_id=org_id)
        if not booking or booking.booking_status != "confirmed":
            return None
        
        # PROMPT 5/20: Mark as reserved via InventoryStatusService
        if booking.product_id:
            try:
                inventory_status_service.mark_reserved(
                    db=db,
                    product_id=booking.product_id,
                    user_id=converted_by,
                    org_id=org_id,
                    deal_id=booking.deal_id,
                )
            except InventoryStatusError as e:
                raise ValueError(f"Cannot convert booking: {e}")
        
        booking.booking_status = "converted"
        booking.converted_at = utc_now()
        booking.converted_to_deposit_id = deposit_id
        booking.updated_by = converted_by
        
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUERIES
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_by_deal(
        self,
        db: Session,
        *,
        org_id: UUID,
        deal_id: UUID
    ) -> List[Booking]:
        """Get all bookings for a deal."""
        query = select(Booking).where(
            and_(
                Booking.org_id == org_id,
                Booking.deal_id == deal_id,
                Booking.deleted_at.is_(None)
            )
        ).order_by(Booking.created_at.desc())
        
        result = db.execute(query)
        return list(result.scalars().all())
    
    def get_active_for_product(
        self,
        db: Session,
        *,
        org_id: UUID,
        product_id: UUID
    ) -> Optional[Booking]:
        """Get active booking for a product."""
        query = select(Booking).where(
            and_(
                Booking.org_id == org_id,
                Booking.product_id == product_id,
                Booking.booking_status.in_(["pending", "confirmed"]),
                Booking.deleted_at.is_(None)
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()


# Singleton instance
booking_service = BookingService()
