"""
ProHouzing Contract Service
Version: 2.0.0 (Prompt 2/18)

Contract management with:
- Payment schedule
- Signing workflow
- Completion tracking
- Event emission (Prompt 2/18)
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from .base import BaseService
from ..models.contract import Contract
from ..models.product import Product
from ..models.deal import Deal
from ..models.base import generate_code, utc_now
from ..schemas.transaction import ContractCreate


class ContractUpdate:
    """Placeholder for contract update schema."""
    pass


class ContractService(BaseService[Contract, ContractCreate, ContractUpdate]):
    """
    Contract service with payment schedule management.
    """
    
    def __init__(self):
        super().__init__(Contract)
    
    def create(
        self,
        db: Session,
        *,
        obj_in: ContractCreate,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> Contract:
        """
        Create a contract.
        """
        obj_data = obj_in.model_dump(exclude_unset=True)
        
        # Generate contract_code if not provided
        if not obj_data.get('contract_code'):
            obj_data['contract_code'] = self._generate_code(db, org_id)
        
        obj_data['org_id'] = org_id
        obj_data['created_date'] = utc_now().date()
        obj_data['remaining_balance'] = obj_data.get('final_value', 0)
        
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        contract = Contract(**obj_data)
        db.add(contract)
        db.commit()
        db.refresh(contract)
        
        # Update product status
        self._update_product_status(db, contract.product_id, org_id, "contracted")
        
        # Update deal
        self._update_deal_contract(db, contract.deal_id, org_id, contract)
        
        # Emit contract.created event
        self._emit_contract_created(db, contract, created_by)
        
        return contract
    
    def _emit_contract_created(
        self,
        db: Session,
        contract: Contract,
        actor_user_id: Optional[UUID]
    ) -> None:
        """Emit contract.created event."""
        from .event_service import event_service
        from .event_catalog import EventCode
        
        event_service.emit_event(
            db,
            event_code=EventCode.CONTRACT_CREATED,
            org_id=contract.org_id,
            aggregate_type="contract",
            aggregate_id=contract.id,
            payload={
                "contract_code": contract.contract_code,
                "contract_type": contract.contract_type,
                "contract_value": float(contract.final_value) if contract.final_value else None,
                "customer_id": str(contract.customer_id) if contract.customer_id else None,
                "entity_name": contract.contract_code,
            },
            actor_user_id=actor_user_id,
            actor_type="user",
            entity_code=contract.contract_code,
            entity_name=contract.contract_code,
            related_customer_id=contract.customer_id,
            related_deal_id=contract.deal_id,
            related_product_id=contract.product_id,
        )
        db.commit()
    
    def _generate_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique contract code."""
        query = select(func.count()).select_from(Contract).where(Contract.org_id == org_id)
        count = db.execute(query).scalar() or 0
        return generate_code("CTR", count + 1)
    
    def _update_product_status(
        self,
        db: Session,
        product_id: UUID,
        org_id: UUID,
        status: str
    ) -> None:
        """Update product inventory status."""
        query = select(Product).where(
            and_(Product.id == product_id, Product.org_id == org_id)
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        
        if product:
            product.inventory_status = status
            db.add(product)
            db.commit()
    
    def _update_deal_contract(
        self,
        db: Session,
        deal_id: UUID,
        org_id: UUID,
        contract: Contract
    ) -> None:
        """Update deal with contract info."""
        query = select(Deal).where(
            and_(Deal.id == deal_id, Deal.org_id == org_id)
        )
        result = db.execute(query)
        deal = result.scalar_one_or_none()
        
        if deal:
            deal.contract_id = contract.id
            deal.contract_date = contract.created_date
            
            # Change stage to contract if not won
            if deal.current_stage not in ["won", "lost", "cancelled"]:
                deal.change_stage("contract")
            
            db.add(deal)
            db.commit()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SIGNING
    # ═══════════════════════════════════════════════════════════════════════════
    
    def sign_by_customer(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        signed_by: UUID
    ) -> Optional[Contract]:
        """Record customer signature."""
        contract = self.get(db, id=id, org_id=org_id)
        if not contract:
            return None
        
        contract.signed_by_customer = True
        contract.updated_by = signed_by
        
        self._check_fully_signed(contract, db, signed_by)
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
    def sign_by_company(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        signed_by: UUID
    ) -> Optional[Contract]:
        """Record company signature."""
        contract = self.get(db, id=id, org_id=org_id)
        if not contract:
            return None
        
        contract.signed_by_company = True
        contract.updated_by = signed_by
        
        self._check_fully_signed(contract, db, signed_by)
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
    def _check_fully_signed(self, contract: Contract, db: Session = None, signed_by: UUID = None) -> None:
        """Check if contract is fully signed and update status."""
        was_not_signed = contract.contract_status != "signed"
        
        if contract.signed_by_customer and contract.signed_by_company:
            contract.contract_status = "signed"
            contract.signed_at = utc_now()
            contract.signed_date = utc_now().date()
            
            if not contract.effective_date:
                contract.effective_date = utc_now().date()
            
            # Emit contract.signed event if just signed
            if was_not_signed and db:
                self._emit_contract_signed(db, contract, signed_by)
    
    def _emit_contract_signed(
        self,
        db: Session,
        contract: Contract,
        actor_user_id: Optional[UUID]
    ) -> None:
        """Emit contract.signed event."""
        from .event_service import event_service
        from .event_catalog import EventCode
        
        event_service.emit_event(
            db,
            event_code=EventCode.CONTRACT_SIGNED,
            org_id=contract.org_id,
            aggregate_type="contract",
            aggregate_id=contract.id,
            payload={
                "contract_code": contract.contract_code,
                "contract_status": contract.contract_status,
                "contract_value": float(contract.final_value) if contract.final_value else None,
                "signed_at": contract.signed_at.isoformat() if contract.signed_at else None,
                "entity_name": contract.contract_code,
            },
            actor_user_id=actor_user_id,
            actor_type="user",
            entity_code=contract.contract_code,
            entity_name=contract.contract_code,
            related_customer_id=contract.customer_id,
            related_deal_id=contract.deal_id,
            related_product_id=contract.product_id,
        )
        db.commit()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYMENT TRACKING
    # ═══════════════════════════════════════════════════════════════════════════
    
    def record_payment(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        amount: Decimal,
        updated_by: UUID
    ) -> Optional[Contract]:
        """
        Record a payment against the contract.
        Called by PaymentService after payment is confirmed.
        """
        contract = self.get(db, id=id, org_id=org_id)
        if not contract:
            return None
        
        contract.update_payment_totals(float(amount))
        contract.updated_by = updated_by
        
        # Check if fully paid
        if contract.remaining_balance <= 0:
            contract.contract_status = "completed"
            contract.completed_at = utc_now()
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
    # ═══════════════════════════════════════════════════════════════════════════
    # COMPLETION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def complete(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        completed_by: UUID
    ) -> Optional[Contract]:
        """Mark contract as completed."""
        contract = self.get(db, id=id, org_id=org_id)
        if not contract:
            return None
        
        contract.contract_status = "completed"
        contract.completed_at = utc_now()
        contract.updated_by = completed_by
        
        # Update product to sold
        self._update_product_status(db, contract.product_id, org_id, "sold")
        
        # Update deal to won
        self._update_deal_won(db, contract.deal_id, org_id)
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
    def _update_deal_won(self, db: Session, deal_id: UUID, org_id: UUID) -> None:
        """Update deal to won status."""
        query = select(Deal).where(
            and_(Deal.id == deal_id, Deal.org_id == org_id)
        )
        result = db.execute(query)
        deal = result.scalar_one_or_none()
        
        if deal and deal.current_stage != "won":
            deal.change_stage("won")
            deal.won_at = utc_now()
            deal.actual_close_date = utc_now().date()
            db.add(deal)
            db.commit()
    
    def record_handover(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        handover_date: date,
        updated_by: UUID
    ) -> Optional[Contract]:
        """Record actual handover date."""
        contract = self.get(db, id=id, org_id=org_id)
        if not contract:
            return None
        
        contract.actual_handover_date = handover_date
        contract.updated_by = updated_by
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
    def record_pink_book(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        pink_book_date: date,
        updated_by: UUID
    ) -> Optional[Contract]:
        """Record pink book (sổ hồng) receipt."""
        contract = self.get(db, id=id, org_id=org_id)
        if not contract:
            return None
        
        contract.pink_book_received = True
        contract.pink_book_date = pink_book_date
        contract.updated_by = updated_by
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
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
    ) -> Optional[Contract]:
        """Cancel a contract."""
        contract = self.get(db, id=id, org_id=org_id)
        if not contract or contract.contract_status in ["completed", "cancelled"]:
            return None
        
        contract.contract_status = "cancelled"
        contract.cancelled_at = utc_now()
        contract.cancelled_by = cancelled_by
        contract.cancel_reason = reason
        contract.updated_by = cancelled_by
        
        # Release product
        self._update_product_status(db, contract.product_id, org_id, "available")
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUERIES
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_by_deal(
        self,
        db: Session,
        *,
        org_id: UUID,
        deal_id: UUID
    ) -> Optional[Contract]:
        """Get contract for a deal."""
        query = select(Contract).where(
            and_(
                Contract.org_id == org_id,
                Contract.deal_id == deal_id,
                Contract.deleted_at.is_(None)
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def get_by_customer(
        self,
        db: Session,
        *,
        org_id: UUID,
        customer_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Contract], int]:
        """Get contracts for a customer."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"customer_id": customer_id}
        )
    
    def get_pending_handover(
        self,
        db: Session,
        *,
        org_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Contract], int]:
        """Get contracts pending handover."""
        query = select(Contract).where(
            and_(
                Contract.org_id == org_id,
                Contract.contract_status == "signed",
                Contract.actual_handover_date.is_(None),
                Contract.deleted_at.is_(None)
            )
        ).order_by(Contract.handover_date.asc())
        
        count_query = select(func.count()).select_from(Contract).where(
            and_(
                Contract.org_id == org_id,
                Contract.contract_status == "signed",
                Contract.actual_handover_date.is_(None),
                Contract.deleted_at.is_(None)
            )
        )
        
        total = db.execute(count_query).scalar() or 0
        query = query.offset(skip).limit(limit)
        result = db.execute(query)
        items = list(result.scalars().all())
        
        return items, total


# Singleton instance
contract_service = ContractService()
