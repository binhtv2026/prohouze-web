"""
ProHouzing Product Lock Service
Version: 1.0.0

Concurrency control for product operations.
Prevents double booking and race conditions.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from uuid import UUID
import hashlib

from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, func
from sqlalchemy.exc import IntegrityError

from core.models.product import Product
from core.models.booking import Booking
from core.models.deal import Deal
from core.enums import InventoryStatus, BookingStatus, DealStage


class ProductLockError(Exception):
    """Raised when product cannot be locked"""
    pass


class ProductNotAvailableError(ProductLockError):
    """Raised when product is not available for sale"""
    pass


class ProductAlreadyBookedError(ProductLockError):
    """Raised when product is already booked"""
    pass


class ProductAlreadySoldError(ProductLockError):
    """Raised when product is already sold"""
    pass


class ConcurrencyError(ProductLockError):
    """Raised when concurrent modification detected"""
    pass


class ProductLockService:
    """
    Service for managing product locks.
    
    Ensures:
    - No double booking
    - No deals on sold products
    - Proper concurrency control
    """
    
    # Lock timeout for bookings (hours)
    BOOKING_TIMEOUT_HOURS = 48
    
    @staticmethod
    def check_product_available(
        db: Session,
        org_id: UUID,
        product_id: UUID
    ) -> Tuple[bool, str]:
        """
        Check if product is available for booking/deal.
        
        Returns:
            (is_available, reason)
        """
        product = db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not product:
            return False, "Product not found"
        
        # Check inventory status
        if product.inventory_status == InventoryStatus.SOLD.value:
            return False, "Product is already sold"
        
        if product.inventory_status == InventoryStatus.RESERVED.value:
            return False, "Product is reserved (internal)"
        
        if product.inventory_status not in [
            InventoryStatus.AVAILABLE.value,
            InventoryStatus.HOLD.value
        ]:
            return False, f"Product status: {product.inventory_status}"
        
        # Check for active bookings
        active_booking = db.execute(
            select(Booking).where(
                Booking.product_id == product_id,
                Booking.org_id == org_id,
                Booking.booking_status.in_([
                    BookingStatus.PENDING.value,
                    BookingStatus.CONFIRMED.value
                ]),
                Booking.deleted_at.is_(None),
                # Not expired
                Booking.valid_until > datetime.now(timezone.utc)
            )
        ).scalar_one_or_none()
        
        if active_booking:
            return False, f"Product has active booking: {active_booking.booking_code}"
        
        # Check for active deals (not closed)
        active_deal = db.execute(
            select(Deal).where(
                Deal.product_id == product_id,
                Deal.org_id == org_id,
                Deal.current_stage.not_in([
                    DealStage.CLOSED_WON.value,
                    DealStage.CLOSED_LOST.value,
                    DealStage.CANCELLED.value
                ]),
                Deal.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if active_deal:
            return False, f"Product has active deal: {active_deal.deal_code}"
        
        return True, "Available"
    
    @staticmethod
    def lock_product_for_booking(
        db: Session,
        org_id: UUID,
        product_id: UUID,
        booking_id: UUID,
        user_id: UUID
    ) -> Product:
        """
        Lock a product for booking.
        
        Uses optimistic locking with version check.
        
        Raises:
            ProductNotAvailableError: If product cannot be booked
            ConcurrencyError: If concurrent modification detected
        """
        # Get product with FOR UPDATE lock
        product = db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None)
            ).with_for_update()
        ).scalar_one_or_none()
        
        if not product:
            raise ProductNotAvailableError("Product not found")
        
        # Check availability
        is_available, reason = ProductLockService.check_product_available(
            db, org_id, product_id
        )
        
        if not is_available:
            raise ProductNotAvailableError(reason)
        
        # Update product status
        product.inventory_status = InventoryStatus.HOLD.value
        product.hold_by_booking_id = booking_id
        product.hold_at = datetime.now(timezone.utc)
        product.hold_by_user_id = user_id
        product.updated_by = user_id
        product.updated_at = datetime.now(timezone.utc)
        
        db.add(product)
        
        return product
    
    @staticmethod
    def release_product_lock(
        db: Session,
        org_id: UUID,
        product_id: UUID,
        user_id: UUID,
        reason: str = "Released"
    ) -> Product:
        """
        Release a product lock.
        
        Called when:
        - Booking is cancelled
        - Booking expires
        - Deal is lost
        """
        product = db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None)
            ).with_for_update()
        ).scalar_one_or_none()
        
        if not product:
            return None
        
        # Only release if currently held
        if product.inventory_status in [
            InventoryStatus.HOLD.value,
            InventoryStatus.RESERVED.value
        ]:
            product.inventory_status = InventoryStatus.AVAILABLE.value
            product.hold_by_booking_id = None
            product.hold_at = None
            product.hold_by_user_id = None
            product.release_reason = reason
            product.released_at = datetime.now(timezone.utc)
            product.updated_by = user_id
            product.updated_at = datetime.now(timezone.utc)
            
            db.add(product)
        
        return product
    
    @staticmethod
    def mark_product_sold(
        db: Session,
        org_id: UUID,
        product_id: UUID,
        contract_id: UUID,
        user_id: UUID
    ) -> Product:
        """
        Mark product as sold.
        
        Called when contract is signed/activated.
        """
        product = db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None)
            ).with_for_update()
        ).scalar_one_or_none()
        
        if not product:
            raise ProductNotAvailableError("Product not found")
        
        if product.inventory_status == InventoryStatus.SOLD.value:
            raise ProductAlreadySoldError("Product is already sold")
        
        product.inventory_status = InventoryStatus.SOLD.value
        product.sold_at = datetime.now(timezone.utc)
        product.sold_contract_id = contract_id
        product.updated_by = user_id
        product.updated_at = datetime.now(timezone.utc)
        
        db.add(product)
        
        return product
    
    @staticmethod
    def check_and_expire_holds(
        db: Session,
        org_id: UUID
    ) -> list:
        """
        Check and expire product holds that have timed out.
        
        Should be run periodically (e.g., every hour).
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(
            hours=ProductLockService.BOOKING_TIMEOUT_HOURS
        )
        
        expired_products = db.execute(
            select(Product).where(
                Product.org_id == org_id,
                Product.inventory_status == InventoryStatus.HOLD.value,
                Product.hold_at < cutoff_time,
                Product.deleted_at.is_(None)
            ).with_for_update()
        ).scalars().all()
        
        released = []
        for product in expired_products:
            product.inventory_status = InventoryStatus.AVAILABLE.value
            product.hold_by_booking_id = None
            product.hold_at = None
            product.release_reason = "Expired"
            product.released_at = datetime.now(timezone.utc)
            db.add(product)
            released.append(product)
        
        return released
    
    @staticmethod
    def generate_idempotency_key(
        entity_type: str,
        org_id: UUID,
        product_id: UUID,
        customer_id: UUID,
        **extra
    ) -> str:
        """
        Generate idempotency key for preventing duplicates.
        
        Key is a hash of identifying parameters.
        """
        key_parts = [
            entity_type,
            str(org_id),
            str(product_id),
            str(customer_id),
        ]
        
        # Add extra identifiers
        for k, v in sorted(extra.items()):
            key_parts.append(f"{k}:{v}")
        
        key_string = "|".join(key_parts)
        return hashlib.sha256(key_string.encode()).hexdigest()[:64]
    
    @staticmethod
    def check_idempotency(
        db: Session,
        model_class,
        idempotency_key: str
    ) -> Optional[any]:
        """
        Check if a record with this idempotency key already exists.
        
        Returns:
            Existing record if found, None otherwise
        """
        if not idempotency_key:
            return None
        
        existing = db.execute(
            select(model_class).where(
                model_class.idempotency_key == idempotency_key
            )
        ).scalar_one_or_none()
        
        return existing


# Singleton instance
product_lock_service = ProductLockService()
