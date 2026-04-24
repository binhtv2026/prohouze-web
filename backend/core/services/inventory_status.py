"""
ProHouzing Inventory Status Service
PROMPT 5/20 - FINAL HARDEN: ANTI DOUBLE-SELL GUARANTEE (10/10 LOCKED)

SINGLE ENTRY POINT for all inventory status changes.

PROTECTION LAYERS:
1. DB Level: Partial unique index on active sales states
2. Service Level: SELECT FOR UPDATE (pessimistic lock) with NOWAIT
3. API Level: Idempotency key prevents duplicate processing
4. Version Check: Optimistic locking
5. Timeout: Auto rollback on long transactions
6. Hold Collision: 409 CONFLICT if already held

RULES:
1. ALL status changes MUST go through this service
2. Booking/Deal services CANNOT set status directly
3. Transaction locking prevents double booking
4. All changes are logged to inventory_events

DO NOT BYPASS THIS SERVICE.
"""

import hashlib
import logging
import uuid as uuid_module
from typing import Optional, Dict, Any, Tuple, List
from uuid import UUID
from datetime import datetime, timezone, timedelta
from contextlib import contextmanager
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, text
from sqlalchemy.exc import IntegrityError, OperationalError

from config.canonical_inventory import (
    InventoryStatus,
    can_transition,
    get_valid_transitions,
    get_status_config,
    can_hold,
    can_book,
    requires_admin,
    StatusChangeSource,
)
from core.models.product import Product, InventoryEvent


# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# ============================================
# CONSTANTS
# ============================================

TRANSACTION_TIMEOUT_SECONDS = 30
IDEMPOTENCY_TTL_SECONDS = 3600  # 1 hour
LOCK_WAIT_TIMEOUT_MS = 5000  # 5 seconds


# ============================================
# IDEMPOTENCY CACHE (In-memory for now)
# In production, use Redis
# ============================================

_idempotency_cache: Dict[str, Dict[str, Any]] = {}


def _get_idempotency_result(key: str) -> Optional[Dict[str, Any]]:
    """Get cached idempotency result."""
    if key in _idempotency_cache:
        entry = _idempotency_cache[key]
        if datetime.now(timezone.utc) < entry.get("expires_at"):
            logger.info(f"IDEMPOTENCY_HIT: key={key}")
            return entry.get("result")
        else:
            del _idempotency_cache[key]
    return None


def _set_idempotency_result(key: str, result: Dict[str, Any]) -> None:
    """Cache idempotency result."""
    _idempotency_cache[key] = {
        "result": result,
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=IDEMPOTENCY_TTL_SECONDS),
    }
    logger.info(f"IDEMPOTENCY_SET: key={key}")


def generate_idempotency_key(
    product_id: UUID,
    action: str,
    user_id: UUID,
    additional: str = ""
) -> str:
    """Generate idempotency key from request parameters."""
    raw = f"{product_id}:{action}:{user_id}:{additional}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


# ============================================
# EXCEPTIONS
# ============================================

class InventoryStatusError(Exception):
    """Base exception for inventory status errors."""
    pass


class InvalidTransitionError(InventoryStatusError):
    """Raised when status transition is not allowed."""
    def __init__(self, current: str, target: str, valid: list):
        self.current = current
        self.target = target
        self.valid = valid
        super().__init__(
            f"Invalid transition: {current} -> {target}. "
            f"Valid transitions: {valid}"
        )


class ProductNotFoundError(InventoryStatusError):
    """Raised when product is not found."""
    pass


class ProductNotAvailableError(InventoryStatusError):
    """Raised when product is not available for the requested action."""
    pass


class ConcurrencyError(InventoryStatusError):
    """Raised when concurrent modification detected (version mismatch)."""
    pass


class PermissionDeniedError(InventoryStatusError):
    """Raised when user doesn't have permission for the action."""
    pass


class HoldExpiredError(InventoryStatusError):
    """Raised when trying to book an expired hold."""
    pass


class HoldCollisionError(InventoryStatusError):
    """Raised when product is already held by someone else (409 CONFLICT)."""
    def __init__(self, product_id: UUID, holder_id: UUID, expires_at: datetime):
        self.product_id = product_id
        self.holder_id = holder_id
        self.expires_at = expires_at
        super().__init__(
            f"Product {product_id} is already held by user {holder_id} "
            f"until {expires_at}. Cannot place another hold."
        )


class TransactionTimeoutError(InventoryStatusError):
    """Raised when transaction takes too long."""
    pass


class LockAcquisitionError(InventoryStatusError):
    """Raised when cannot acquire row lock (another transaction has it)."""
    pass


class DuplicateRequestError(InventoryStatusError):
    """Raised when duplicate request detected via idempotency key."""
    def __init__(self, key: str, previous_result: Dict[str, Any]):
        self.key = key
        self.previous_result = previous_result
        super().__init__(f"Duplicate request detected (idempotency_key: {key})")


# ============================================
# REQUEST CONTEXT FOR LOGGING
# ============================================

class RequestContext:
    """Context for request tracking and logging."""
    def __init__(
        self,
        request_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ):
        self.request_id = request_id or str(uuid_module.uuid4())[:8]
        self.idempotency_key = idempotency_key
        self.user_id = user_id
        self.start_time = datetime.now(timezone.utc)
    
    def elapsed_ms(self) -> float:
        """Get elapsed time in milliseconds."""
        return (datetime.now(timezone.utc) - self.start_time).total_seconds() * 1000


# ============================================
# INVENTORY STATUS SERVICE
# ============================================

class InventoryStatusService:
    """
    SINGLE ENTRY POINT for all inventory status changes.
    
    ANTI DOUBLE-SELL GUARANTEES:
    1. SELECT FOR UPDATE NOWAIT - Pessimistic lock
    2. Version check - Optimistic lock
    3. Idempotency key - Prevent duplicate processing
    4. Hold collision detection - 409 CONFLICT
    5. Transaction timeout - Auto rollback
    6. Full audit logging
    """
    
    # Default hold duration
    DEFAULT_HOLD_HOURS = 24
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CORE METHOD - change_status (WITH ALL PROTECTION LAYERS)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def change_status(
        self,
        db: Session,
        *,
        product_id: UUID,
        new_status: str,
        user_id: UUID,
        org_id: UUID,
        source: str = StatusChangeSource.MANUAL.value,
        source_ref_type: Optional[str] = None,
        source_ref_id: Optional[UUID] = None,
        reason: Optional[str] = None,
        hold_hours: Optional[int] = None,
        expected_version: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Product:
        """
        Change product inventory status with full protection.
        
        PROTECTION LAYERS:
        1. Idempotency check - Return cached result if duplicate
        2. SELECT FOR UPDATE NOWAIT - Acquire exclusive lock
        3. Version check - Fail if concurrent modification
        4. State machine validation - Ensure valid transition
        5. Audit logging - Complete trail
        
        Args:
            db: Database session
            product_id: Product ID
            new_status: Target status
            user_id: User performing the action
            org_id: Organization ID
            source: Source of change (manual, booking, deal, system)
            source_ref_type: Type of source entity
            source_ref_id: ID of source entity
            reason: Reason for change
            hold_hours: Duration for hold (if status is HOLD)
            expected_version: Expected version for optimistic lock
            metadata: Additional metadata
            idempotency_key: Key to prevent duplicate processing
            request_id: Request ID for logging
            
        Returns:
            Updated product
        """
        ctx = RequestContext(
            request_id=request_id,
            idempotency_key=idempotency_key,
            user_id=user_id,
        )
        
        # Log start
        logger.info(
            f"STATUS_CHANGE_START: request_id={ctx.request_id} "
            f"product_id={product_id} new_status={new_status} "
            f"user_id={user_id} idempotency_key={idempotency_key}"
        )
        
        try:
            # 1. IDEMPOTENCY CHECK
            if idempotency_key:
                cached = _get_idempotency_result(idempotency_key)
                if cached:
                    logger.info(
                        f"IDEMPOTENCY_RETURN: request_id={ctx.request_id} "
                        f"key={idempotency_key} returning_cached_result"
                    )
                    # Return the cached product (re-fetch to ensure fresh)
                    product = self._get_product(db, product_id, org_id)
                    if product:
                        return product
            
            # 2. ACQUIRE EXCLUSIVE LOCK (SELECT FOR UPDATE NOWAIT)
            product = self._get_product_for_update_nowait(db, product_id, org_id)
            
            if not product:
                raise ProductNotFoundError(f"Product {product_id} not found")
            
            # 3. VERSION CHECK (Optimistic lock)
            if expected_version is not None and product.version != expected_version:
                raise ConcurrencyError(
                    f"Version mismatch: expected {expected_version}, "
                    f"found {product.version}. Product was modified by another user."
                )
            
            # 4. VALIDATE TRANSITION
            current_status = product.inventory_status
            self._validate_transition(current_status, new_status, user_id, db, org_id)
            
            # 5. CHECK PERMISSION for admin-only statuses
            if requires_admin(new_status):
                if not self._is_admin(db, user_id, org_id):
                    raise PermissionDeniedError(
                        f"Status '{new_status}' requires admin permission"
                    )
            
            # 6. TIMEOUT CHECK
            if ctx.elapsed_ms() > TRANSACTION_TIMEOUT_SECONDS * 1000:
                db.rollback()
                raise TransactionTimeoutError(
                    f"Transaction exceeded timeout ({TRANSACTION_TIMEOUT_SECONDS}s)"
                )
            
            # 7. APPLY STATUS CHANGE
            old_status = product.inventory_status
            product.inventory_status = new_status
            product.version += 1
            product.updated_at = datetime.now(timezone.utc)
            product.updated_by = user_id
            
            # 8. Handle status-specific logic
            if new_status == InventoryStatus.HOLD.value:
                self._apply_hold(product, user_id, hold_hours, reason)
            elif old_status == InventoryStatus.HOLD.value:
                self._clear_hold(product)
            
            # 9. Update transaction references
            if source_ref_type == "booking" and source_ref_id:
                product.current_booking_id = source_ref_id
            elif source_ref_type == "deal" and source_ref_id:
                product.current_deal_id = source_ref_id
            elif source_ref_type == "contract" and source_ref_id:
                product.current_contract_id = source_ref_id
            
            # 10. Clear references when returning to available
            if new_status == InventoryStatus.AVAILABLE.value:
                product.current_booking_id = None
                product.current_deal_id = None
            
            # 11. LOG EVENT (Audit trail)
            self._log_event(
                db=db,
                product=product,
                old_status=old_status,
                new_status=new_status,
                user_id=user_id,
                source=source,
                source_ref_type=source_ref_type,
                source_ref_id=source_ref_id,
                reason=reason,
                metadata={
                    **(metadata or {}),
                    "request_id": ctx.request_id,
                    "idempotency_key": idempotency_key,
                },
            )
            
            # 12. COMMIT
            db.add(product)
            db.commit()
            db.refresh(product)
            
            # 13. CACHE IDEMPOTENCY RESULT
            if idempotency_key:
                _set_idempotency_result(idempotency_key, {
                    "product_id": str(product_id),
                    "old_status": old_status,
                    "new_status": new_status,
                    "version": product.version,
                })
            
            # Log success
            logger.info(
                f"STATUS_CHANGE_SUCCESS: request_id={ctx.request_id} "
                f"product_id={product_id} {old_status} -> {new_status} "
                f"version={product.version} elapsed_ms={ctx.elapsed_ms():.2f}"
            )
            
            return product
            
        except OperationalError as e:
            db.rollback()
            # Lock acquisition failed
            if "could not obtain lock" in str(e).lower() or "lock" in str(e).lower():
                logger.warning(
                    f"LOCK_FAILED: request_id={ctx.request_id} "
                    f"product_id={product_id} error={e}"
                )
                raise LockAcquisitionError(
                    f"Could not acquire lock on product {product_id}. "
                    "Another transaction is in progress. Please retry."
                )
            raise
        except IntegrityError as e:
            db.rollback()
            logger.error(
                f"INTEGRITY_ERROR: request_id={ctx.request_id} "
                f"product_id={product_id} error={e}"
            )
            raise ConcurrencyError(
                f"Concurrent modification detected for product {product_id}. "
                "Please retry with the latest version."
            )
        except Exception as e:
            db.rollback()
            logger.error(
                f"STATUS_CHANGE_ERROR: request_id={ctx.request_id} "
                f"product_id={product_id} error={type(e).__name__}: {e}"
            )
            raise
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HOLD OPERATIONS (WITH COLLISION DETECTION)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def hold_product(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        hold_hours: int = None,
        reason: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Hold a product for a user.
        
        COLLISION DETECTION:
        - If product is already held by ANOTHER user -> 409 CONFLICT
        - If product is already held by SAME user -> Return existing (idempotent)
        
        Can only hold products with status = AVAILABLE.
        """
        # Generate idempotency key if not provided
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "hold", user_id,
                str(customer_id) if customer_id else ""
            )
        
        # Check idempotency first
        cached = _get_idempotency_result(idempotency_key)
        if cached:
            product = self._get_product(db, product_id, org_id)
            if product:
                return product
        
        # Get product to check current state
        product = self._get_product(db, product_id, org_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")
        
        # HOLD COLLISION DETECTION
        if product.inventory_status == InventoryStatus.HOLD.value:
            if product.hold_by_user_id == user_id:
                # Same user - return existing hold (idempotent)
                logger.info(
                    f"HOLD_IDEMPOTENT: product_id={product_id} "
                    f"user_id={user_id} already_held"
                )
                return product
            else:
                # Different user - COLLISION
                raise HoldCollisionError(
                    product_id=product_id,
                    holder_id=product.hold_by_user_id,
                    expires_at=product.hold_expires_at,
                )
        
        # Check if product can be held
        if not can_hold(product.inventory_status):
            raise ProductNotAvailableError(
                f"Product with status '{product.inventory_status}' cannot be held. "
                f"Only products with status 'available' can be held."
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.HOLD.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.MANUAL.value,
            hold_hours=hold_hours or self.DEFAULT_HOLD_HOURS,
            reason=reason,
            metadata={"customer_id": str(customer_id)} if customer_id else None,
            idempotency_key=idempotency_key,
        )
    
    def release_hold(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        reason: Optional[str] = None,
        force: bool = False,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Release a product hold.
        
        By default, only the user who placed the hold can release it.
        Use force=True for admin override.
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "release", user_id
            )
        
        product = self._get_product(db, product_id, org_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")
        
        # If already available, return (idempotent)
        if product.inventory_status == InventoryStatus.AVAILABLE.value:
            return product
        
        if product.inventory_status != InventoryStatus.HOLD.value:
            raise ProductNotAvailableError(
                f"Product is not on hold (status: {product.inventory_status})"
            )
        
        # Check ownership (unless force)
        if not force and product.hold_by_user_id != user_id:
            if not self._is_admin(db, user_id, org_id):
                raise PermissionDeniedError(
                    "Only the user who placed the hold or an admin can release it"
                )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.AVAILABLE.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.MANUAL.value,
            reason=reason or "Hold released",
            idempotency_key=idempotency_key,
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BOOKING OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def request_booking(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        booking_id: UUID,
        expected_version: Optional[int] = None,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Request to move product to booking_pending status.
        
        Called by Booking service when creating a booking.
        Product must be on HOLD by the same user.
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "booking_request", user_id, str(booking_id)
            )
        
        product = self._get_product(db, product_id, org_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")
        
        # Already in booking_pending for this booking - idempotent
        if (product.inventory_status == InventoryStatus.BOOKING_PENDING.value and
            product.current_booking_id == booking_id):
            return product
        
        # Must be on hold
        if product.inventory_status != InventoryStatus.HOLD.value:
            raise ProductNotAvailableError(
                f"Product must be on hold to request booking "
                f"(current status: {product.inventory_status})"
            )
        
        # Check hold ownership
        if product.hold_by_user_id != user_id:
            raise PermissionDeniedError(
                "Only the user who placed the hold can request booking"
            )
        
        # Check hold expiry
        if product.is_hold_expired:
            raise HoldExpiredError(
                f"Hold expired at {product.hold_expires_at}. "
                "Please request a new hold."
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.BOOKING_PENDING.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.BOOKING_REQUEST.value,
            source_ref_type="booking",
            source_ref_id=booking_id,
            expected_version=expected_version,
            idempotency_key=idempotency_key,
        )
    
    def confirm_booking(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        booking_id: UUID,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Confirm booking - move to BOOKED status.
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "booking_confirm", user_id, str(booking_id)
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.BOOKED.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.BOOKING_REQUEST.value,
            source_ref_type="booking",
            source_ref_id=booking_id,
            reason="Booking confirmed",
            idempotency_key=idempotency_key,
        )
    
    def cancel_booking(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        booking_id: UUID,
        reason: str,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Cancel booking - return to AVAILABLE status.
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "booking_cancel", user_id, str(booking_id)
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.AVAILABLE.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.BOOKING_REQUEST.value,
            source_ref_type="booking",
            source_ref_id=booking_id,
            reason=f"Booking cancelled: {reason}",
            idempotency_key=idempotency_key,
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DEAL OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def mark_reserved(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        deal_id: Optional[UUID] = None,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Mark product as reserved (deposit received).
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "reserve", user_id, str(deal_id) if deal_id else ""
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.RESERVED.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.DEAL_REQUEST.value,
            source_ref_type="deal",
            source_ref_id=deal_id,
            reason="Deposit received",
            idempotency_key=idempotency_key,
        )
    
    def mark_sold(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        contract_id: UUID,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Mark product as sold (contract signed).
        
        This is a TERMINAL status - cannot be undone without admin.
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "sold", user_id, str(contract_id)
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.SOLD.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.DEAL_REQUEST.value,
            source_ref_type="contract",
            source_ref_id=contract_id,
            reason="Contract signed",
            idempotency_key=idempotency_key,
        )
    
    def block_product(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        reason: str,
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Block a product (admin only).
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "block", user_id
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=InventoryStatus.BLOCKED.value,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.ADMIN_OVERRIDE.value,
            reason=reason,
            idempotency_key=idempotency_key,
        )
    
    def unblock_product(
        self,
        db: Session,
        *,
        product_id: UUID,
        user_id: UUID,
        org_id: UUID,
        target_status: str = InventoryStatus.AVAILABLE.value,
        reason: str = "Unblocked by admin",
        idempotency_key: Optional[str] = None,
    ) -> Product:
        """
        Unblock a product (admin only).
        """
        if not idempotency_key:
            idempotency_key = generate_idempotency_key(
                product_id, "unblock", user_id
            )
        
        return self.change_status(
            db=db,
            product_id=product_id,
            new_status=target_status,
            user_id=user_id,
            org_id=org_id,
            source=StatusChangeSource.ADMIN_OVERRIDE.value,
            reason=reason,
            idempotency_key=idempotency_key,
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BACKGROUND JOB - Auto-expire holds
    # ═══════════════════════════════════════════════════════════════════════════
    
    def expire_holds(
        self,
        db: Session,
        *,
        org_id: Optional[UUID] = None,
    ) -> List[UUID]:
        """
        Auto-expire holds that have passed their expiry time.
        
        Should be called by a background job periodically (e.g., every 5 minutes).
        
        Returns:
            List of expired product IDs
        """
        now = datetime.now(timezone.utc)
        
        # Find expired holds
        query = select(Product).where(
            and_(
                Product.inventory_status == InventoryStatus.HOLD.value,
                Product.hold_expires_at <= now,
                Product.deleted_at.is_(None),
            )
        )
        
        if org_id:
            query = query.where(Product.org_id == org_id)
        
        result = db.execute(query)
        expired_products = list(result.scalars().all())
        
        logger.info(f"EXPIRE_HOLDS: found {len(expired_products)} expired holds")
        
        expired_ids = []
        for product in expired_products:
            try:
                self.change_status(
                    db=db,
                    product_id=product.id,
                    new_status=InventoryStatus.AVAILABLE.value,
                    user_id=product.hold_by_user_id or product.created_by,
                    org_id=product.org_id,
                    source=StatusChangeSource.SYSTEM_EXPIRE.value,
                    reason="Hold expired automatically",
                )
                expired_ids.append(product.id)
                logger.info(f"HOLD_EXPIRED: product_id={product.id}")
            except Exception as e:
                logger.error(f"EXPIRE_HOLD_ERROR: product_id={product.id} error={e}")
        
        return expired_ids
    
    # ═══════════════════════════════════════════════════════════════════════════
    # VALIDATION METHODS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def validate_transition(
        self,
        current_status: str,
        new_status: str,
    ) -> Tuple[bool, str]:
        """
        Validate if a status transition is allowed.
        
        Returns:
            (is_valid, error_message)
        """
        if can_transition(current_status, new_status):
            return True, ""
        
        valid = get_valid_transitions(current_status)
        return False, (
            f"Invalid transition: {current_status} -> {new_status}. "
            f"Valid transitions: {valid}"
        )
    
    def _validate_transition(
        self,
        current_status: str,
        new_status: str,
        user_id: UUID,
        db: Session,
        org_id: UUID,
    ) -> None:
        """Validate transition or raise exception."""
        is_valid, error = self.validate_transition(current_status, new_status)
        if not is_valid:
            raise InvalidTransitionError(
                current_status,
                new_status,
                get_valid_transitions(current_status)
            )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PRIVATE HELPER METHODS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _get_product(
        self,
        db: Session,
        product_id: UUID,
        org_id: UUID,
    ) -> Optional[Product]:
        """Get product without lock."""
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def _get_product_for_update_nowait(
        self,
        db: Session,
        product_id: UUID,
        org_id: UUID,
    ) -> Optional[Product]:
        """
        Get product with FOR UPDATE NOWAIT lock (pessimistic locking).
        
        NOWAIT means: If another transaction has the lock, fail immediately
        instead of waiting. This prevents deadlocks and ensures first-come-first-served.
        """
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None),
            )
        ).with_for_update(nowait=True)
        
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def _apply_hold(
        self,
        product: Product,
        user_id: UUID,
        hold_hours: Optional[int],
        reason: Optional[str],
    ) -> None:
        """Apply hold fields to product."""
        now = datetime.now(timezone.utc)
        hours = hold_hours or self.DEFAULT_HOLD_HOURS
        
        product.hold_started_at = now
        product.hold_expires_at = now + timedelta(hours=hours)
        product.hold_by_user_id = user_id
        product.hold_reason = reason
    
    def _clear_hold(self, product: Product) -> None:
        """Clear hold fields from product."""
        product.hold_started_at = None
        product.hold_expires_at = None
        product.hold_by_user_id = None
        product.hold_reason = None
    
    def _log_event(
        self,
        db: Session,
        product: Product,
        old_status: str,
        new_status: str,
        user_id: UUID,
        source: str,
        source_ref_type: Optional[str],
        source_ref_id: Optional[UUID],
        reason: Optional[str],
        metadata: Optional[Dict[str, Any]],
    ) -> None:
        """Log status change event to audit trail."""
        event = InventoryEvent(
            org_id=product.org_id,
            product_id=product.id,
            old_status=old_status,
            new_status=new_status,
            triggered_by=user_id,
            source=source,
            source_ref_type=source_ref_type,
            source_ref_id=source_ref_id,
            reason=reason,
            metadata_json=metadata or {},
        )
        db.add(event)
        
        logger.info(
            f"EVENT_LOGGED: product_id={product.id} "
            f"{old_status} -> {new_status} source={source} "
            f"user_id={user_id}"
        )
    
    def _is_admin(
        self,
        db: Session,
        user_id: UUID,
        org_id: UUID,
    ) -> bool:
        """Check if user has admin role."""
        try:
            from core.services.permission import permission_service
            user_scope = permission_service.get_user_scope(db, user_id, org_id)
            role = user_scope.get("role", "")
            return role in ["system_admin", "org_admin", "director"]
        except Exception:
            return False


# ============================================
# SINGLETON INSTANCE
# ============================================

inventory_status_service = InventoryStatusService()
