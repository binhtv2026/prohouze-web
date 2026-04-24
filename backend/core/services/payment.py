"""
ProHouzing Payment Service
Version: 1.0.0

Payment management with:
- Ledger-style append-only
- Commission triggers
- Overdue tracking
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from .base import BaseService
from ..models.payment import Payment, PaymentScheduleItem
from ..models.contract import Contract
from ..models.base import generate_code, utc_now
from ..schemas.transaction import PaymentCreate


class PaymentUpdate:
    """
    IMPORTANT: Payments are APPEND-ONLY (ledger style).
    Updates are NOT allowed - only status changes and verification.
    """
    pass


class PaymentService(BaseService[Payment, PaymentCreate, PaymentUpdate]):
    """
    Payment service with ledger-style immutability.
    
    IMPORTANT: Payments are append-only. 
    - No direct updates to amount
    - Corrections create new entries (refund type)
    - Commission triggers on payment confirmation
    """
    
    def __init__(self):
        super().__init__(Payment)
    
    def create(
        self,
        db: Session,
        *,
        obj_in: PaymentCreate,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> Payment:
        """
        Create a payment record (append-only).
        """
        obj_data = obj_in.model_dump(exclude_unset=True)
        
        # Generate payment_code if not provided
        if not obj_data.get('payment_code'):
            obj_data['payment_code'] = self._generate_code(db, org_id)
        
        obj_data['org_id'] = org_id
        obj_data['payment_status'] = 'pending'
        
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        payment = Payment(**obj_data)
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment
    
    def _generate_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique payment code."""
        query = select(func.count()).select_from(Payment).where(Payment.org_id == org_id)
        count = db.execute(query).scalar() or 0
        return generate_code("PAY", count + 1)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # VERIFICATION (Status change only - NOT amount update)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def verify(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        receipt_number: Optional[str] = None,
        verified_by: UUID
    ) -> Optional[Payment]:
        """
        Verify a payment (mark as paid).
        Triggers commission calculation.
        """
        payment = self.get(db, id=id, org_id=org_id)
        if not payment or payment.payment_status not in ['pending', 'partial']:
            return None
        
        payment.payment_status = 'paid'
        payment.paid_at = utc_now()
        payment.paid_date = utc_now().date()
        payment.verified_at = utc_now()
        payment.verified_by = verified_by
        payment.receipt_number = receipt_number
        payment.updated_by = verified_by
        
        db.add(payment)
        db.commit()
        
        # Update contract payment totals
        self._update_contract_payment(db, payment)
        
        # Update schedule item if linked
        if payment.schedule_item_id:
            self._update_schedule_item(db, payment)
        
        # Trigger commission if applicable
        if payment.triggers_commission:
            self._trigger_commission(db, payment)
        
        db.refresh(payment)
        return payment
    
    def _update_contract_payment(self, db: Session, payment: Payment) -> None:
        """Update contract payment totals."""
        from .contract import contract_service
        
        contract_service.record_payment(
            db,
            id=payment.contract_id,
            org_id=payment.org_id,
            amount=payment.paid_amount,
            updated_by=payment.verified_by
        )
    
    def _update_schedule_item(self, db: Session, payment: Payment) -> None:
        """Update payment schedule item."""
        query = select(PaymentScheduleItem).where(
            PaymentScheduleItem.id == payment.schedule_item_id
        )
        result = db.execute(query)
        item = result.scalar_one_or_none()
        
        if item:
            item.update_paid_amount(float(payment.paid_amount))
            item.last_payment_date = payment.paid_date
            db.add(item)
            db.commit()
    
    def _trigger_commission(self, db: Session, payment: Payment) -> None:
        """
        Trigger commission calculation for this payment.
        Commission entries are created based on rules.
        """
        # Mark as processed
        payment.commission_processed = True
        payment.commission_processed_at = utc_now()
        db.add(payment)
        
        # TODO: Call commission service to calculate and create entries
        # commission_service.calculate_for_payment(db, payment)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REFUND (Creates new entry - NEVER updates)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def create_refund(
        self,
        db: Session,
        *,
        original_payment_id: UUID,
        org_id: UUID,
        refund_amount: Decimal,
        reason: str,
        created_by: UUID
    ) -> Optional[Payment]:
        """
        Create a refund entry (new payment with type=refund).
        Original payment is NOT modified.
        """
        original = self.get(db, id=original_payment_id, org_id=org_id)
        if not original or original.payment_status != 'paid':
            return None
        
        refund_code = self._generate_code(db, org_id)
        
        refund = Payment(
            org_id=org_id,
            payment_code=refund_code,
            contract_id=original.contract_id,
            deal_id=original.deal_id,
            customer_id=original.customer_id,
            payment_type='refund',
            payment_description=f"Refund for {original.payment_code}",
            paid_amount=-refund_amount,  # Negative amount
            currency_code=original.currency_code,
            payment_status='paid',
            paid_at=utc_now(),
            paid_date=utc_now().date(),
            refund_for_payment_id=original_payment_id,
            refund_reason=reason,
            triggers_commission=False,  # Refunds don't trigger positive commission
            created_by=created_by,
            updated_by=created_by
        )
        
        db.add(refund)
        db.commit()
        db.refresh(refund)
        
        # Update contract totals (subtract refund)
        self._update_contract_payment(db, refund)
        
        return refund
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CANCELLATION (Status change only)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def cancel(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        reason: str,
        cancelled_by: UUID
    ) -> Optional[Payment]:
        """
        Cancel a pending payment.
        Only pending payments can be cancelled.
        """
        payment = self.get(db, id=id, org_id=org_id)
        if not payment or payment.payment_status != 'pending':
            return None
        
        payment.payment_status = 'cancelled'
        payment.cancelled_at = utc_now()
        payment.cancelled_by = cancelled_by
        payment.cancel_reason = reason
        payment.updated_by = cancelled_by
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment
    
    # ═══════════════════════════════════════════════════════════════════════════
    # OVERDUE TRACKING
    # ═══════════════════════════════════════════════════════════════════════════
    
    def check_overdue(
        self,
        db: Session,
        *,
        org_id: UUID
    ) -> List[Payment]:
        """Check and mark overdue payments."""
        today = date.today()
        
        query = select(Payment).where(
            and_(
                Payment.org_id == org_id,
                Payment.payment_status == 'pending',
                Payment.due_date < today,
                Payment.is_overdue.is_(False),
                Payment.deleted_at.is_(None)
            )
        )
        
        result = db.execute(query)
        overdue_payments = list(result.scalars().all())
        
        for payment in overdue_payments:
            payment.mark_overdue()
            db.add(payment)
        
        db.commit()
        return overdue_payments
    
    def get_overdue(
        self,
        db: Session,
        *,
        org_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Payment], int]:
        """Get overdue payments."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"is_overdue": True, "payment_status": "pending"}
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUERIES
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_by_contract(
        self,
        db: Session,
        *,
        org_id: UUID,
        contract_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Payment], int]:
        """Get all payments for a contract."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"contract_id": contract_id},
            sort_by="created_at",
            sort_order="asc"
        )
    
    def get_by_customer(
        self,
        db: Session,
        *,
        org_id: UUID,
        customer_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Payment], int]:
        """Get all payments by a customer."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"customer_id": customer_id}
        )
    
    def get_pending(
        self,
        db: Session,
        *,
        org_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Payment], int]:
        """Get pending payments."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"payment_status": "pending"}
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATISTICS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_total_collected(
        self,
        db: Session,
        *,
        org_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> Decimal:
        """Get total collected amount."""
        query = select(func.sum(Payment.paid_amount)).where(
            and_(
                Payment.org_id == org_id,
                Payment.payment_status == 'paid',
                Payment.payment_type != 'refund',
                Payment.deleted_at.is_(None)
            )
        )
        
        if from_date:
            query = query.where(Payment.paid_date >= from_date)
        if to_date:
            query = query.where(Payment.paid_date <= to_date)
        
        return db.execute(query).scalar() or Decimal(0)
    
    def get_stats(
        self,
        db: Session,
        *,
        org_id: UUID
    ) -> Dict[str, Any]:
        """Get payment statistics."""
        base_condition = and_(
            Payment.org_id == org_id,
            Payment.deleted_at.is_(None)
        )
        
        # By status
        statuses = ['pending', 'paid', 'cancelled', 'overdue']
        by_status = {}
        for status in statuses:
            if status == 'overdue':
                query = select(func.count()).select_from(Payment).where(
                    and_(base_condition, Payment.is_overdue.is_(True))
                )
            else:
                query = select(func.count()).select_from(Payment).where(
                    and_(base_condition, Payment.payment_status == status)
                )
            by_status[status] = db.execute(query).scalar() or 0
        
        # Total collected
        total_query = select(func.sum(Payment.paid_amount)).where(
            and_(base_condition, Payment.payment_status == 'paid')
        )
        total_collected = db.execute(total_query).scalar() or 0
        
        # Total pending
        pending_query = select(func.sum(Payment.paid_amount)).where(
            and_(base_condition, Payment.payment_status == 'pending')
        )
        total_pending = db.execute(pending_query).scalar() or 0
        
        return {
            "by_status": by_status,
            "total_collected": total_collected,
            "total_pending": total_pending
        }


# Singleton instance
payment_service = PaymentService()
