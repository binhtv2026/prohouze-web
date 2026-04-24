"""
ProHouzing Validation Service
Version: 1.0.0

Business rule validation for:
- Deal creation (product availability)
- Payment limits (contract value)
- Booking constraints
"""

from datetime import datetime, timezone
from typing import Optional, Tuple, List
from uuid import UUID
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from core.models.product import Product
from core.models.contract import Contract
from core.models.payment import Payment
from core.models.deal import Deal
from core.models.booking import Booking
from core.enums import InventoryStatus, PaymentStatus, ContractStatus


class ValidationError(Exception):
    """Raised when validation fails"""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


class ValidationResult:
    """Result of validation check"""
    def __init__(self, valid: bool, errors: List[dict] = None):
        self.valid = valid
        self.errors = errors or []
    
    def add_error(self, code: str, message: str, field: str = None):
        self.valid = False
        self.errors.append({
            "code": code,
            "message": message,
            "field": field
        })
    
    def __bool__(self):
        return self.valid


class ValidationService:
    """
    Business rule validation service.
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DEAL VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    @staticmethod
    def validate_deal_creation(
        db: Session,
        org_id: UUID,
        product_id: Optional[UUID] = None,
        customer_id: Optional[UUID] = None
    ) -> ValidationResult:
        """
        Validate deal creation.
        
        Rules:
        - Product must not be sold
        - Product must be available
        - Customer must exist
        """
        result = ValidationResult(valid=True)
        
        if product_id:
            product = db.execute(
                select(Product).where(
                    Product.id == product_id,
                    Product.org_id == org_id,
                    Product.deleted_at.is_(None)
                )
            ).scalar_one_or_none()
            
            if not product:
                result.add_error(
                    code="PRODUCT_NOT_FOUND",
                    message="Product not found",
                    field="product_id"
                )
            elif product.inventory_status == InventoryStatus.SOLD.value:
                result.add_error(
                    code="PRODUCT_SOLD",
                    message="Cannot create deal for sold product",
                    field="product_id"
                )
            elif product.inventory_status == InventoryStatus.RESERVED.value:
                result.add_error(
                    code="PRODUCT_RESERVED",
                    message="Product is reserved and not available",
                    field="product_id"
                )
        
        return result
    
    @staticmethod
    def validate_deal_product_change(
        db: Session,
        org_id: UUID,
        deal_id: UUID,
        new_product_id: UUID
    ) -> ValidationResult:
        """
        Validate changing product on a deal.
        
        Rules:
        - New product must be available
        - Cannot change if contract is signed
        """
        result = ValidationResult(valid=True)
        
        # Check deal status
        deal = db.execute(
            select(Deal).where(
                Deal.id == deal_id,
                Deal.org_id == org_id,
                Deal.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not deal:
            result.add_error(
                code="DEAL_NOT_FOUND",
                message="Deal not found",
                field="deal_id"
            )
            return result
        
        # Check if contract exists
        contract = db.execute(
            select(Contract).where(
                Contract.deal_id == deal_id,
                Contract.contract_status.in_([
                    ContractStatus.SIGNED.value,
                    ContractStatus.ACTIVE.value,
                    ContractStatus.COMPLETED.value
                ]),
                Contract.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if contract:
            result.add_error(
                code="CONTRACT_SIGNED",
                message="Cannot change product after contract is signed",
                field="product_id"
            )
            return result
        
        # Validate new product
        product_result = ValidationService.validate_deal_creation(
            db, org_id, product_id=new_product_id
        )
        
        if not product_result.valid:
            result.errors.extend(product_result.errors)
            result.valid = False
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYMENT VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    @staticmethod
    def validate_payment_amount(
        db: Session,
        org_id: UUID,
        contract_id: UUID,
        payment_amount: Decimal
    ) -> ValidationResult:
        """
        Validate payment amount against contract.
        
        Rules:
        - Payment cannot exceed remaining balance
        - Payment must be positive
        """
        result = ValidationResult(valid=True)
        
        if payment_amount <= 0:
            result.add_error(
                code="INVALID_AMOUNT",
                message="Payment amount must be positive",
                field="paid_amount"
            )
            return result
        
        # Get contract
        contract = db.execute(
            select(Contract).where(
                Contract.id == contract_id,
                Contract.org_id == org_id,
                Contract.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not contract:
            result.add_error(
                code="CONTRACT_NOT_FOUND",
                message="Contract not found",
                field="contract_id"
            )
            return result
        
        # Calculate total paid
        total_paid_result = db.execute(
            select(func.coalesce(func.sum(Payment.paid_amount), 0)).where(
                Payment.contract_id == contract_id,
                Payment.org_id == org_id,
                Payment.payment_status.in_([
                    PaymentStatus.PENDING.value,
                    PaymentStatus.VERIFIED.value,
                    PaymentStatus.COMPLETED.value
                ]),
                Payment.deleted_at.is_(None)
            )
        ).scalar()
        
        total_paid = Decimal(str(total_paid_result or 0))
        remaining = contract.final_value - total_paid
        
        if payment_amount > remaining:
            result.add_error(
                code="EXCEEDS_BALANCE",
                message=f"Payment amount ({payment_amount:,.0f}) exceeds remaining balance ({remaining:,.0f})",
                field="paid_amount"
            )
        
        return result
    
    @staticmethod
    def validate_payment_creation(
        db: Session,
        org_id: UUID,
        contract_id: UUID,
        payment_amount: Decimal,
        idempotency_key: Optional[str] = None
    ) -> ValidationResult:
        """
        Full validation for payment creation.
        
        Rules:
        - Contract must be active
        - Amount must not exceed balance
        - Idempotency check
        """
        result = ValidationResult(valid=True)
        
        # Check idempotency
        if idempotency_key:
            existing = db.execute(
                select(Payment).where(
                    Payment.idempotency_key == idempotency_key
                )
            ).scalar_one_or_none()
            
            if existing:
                result.add_error(
                    code="DUPLICATE_PAYMENT",
                    message="Payment with this idempotency key already exists",
                    field="idempotency_key"
                )
                return result
        
        # Check contract status
        contract = db.execute(
            select(Contract).where(
                Contract.id == contract_id,
                Contract.org_id == org_id,
                Contract.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not contract:
            result.add_error(
                code="CONTRACT_NOT_FOUND",
                message="Contract not found",
                field="contract_id"
            )
            return result
        
        # Contract must be in appropriate status
        allowed_statuses = [
            ContractStatus.APPROVED.value,
            ContractStatus.SIGNED.value,
            ContractStatus.ACTIVE.value
        ]
        
        if contract.contract_status not in allowed_statuses:
            result.add_error(
                code="CONTRACT_NOT_ACTIVE",
                message=f"Contract status ({contract.contract_status}) does not allow payments",
                field="contract_id"
            )
            return result
        
        # Validate amount
        amount_result = ValidationService.validate_payment_amount(
            db, org_id, contract_id, payment_amount
        )
        
        if not amount_result.valid:
            result.errors.extend(amount_result.errors)
            result.valid = False
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BOOKING VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    @staticmethod
    def validate_booking_creation(
        db: Session,
        org_id: UUID,
        product_id: UUID,
        customer_id: UUID,
        idempotency_key: Optional[str] = None
    ) -> ValidationResult:
        """
        Validate booking creation.
        
        Rules:
        - Product must be available
        - No existing active booking for product
        - Idempotency check
        """
        result = ValidationResult(valid=True)
        
        # Check idempotency
        if idempotency_key:
            existing = db.execute(
                select(Booking).where(
                    Booking.idempotency_key == idempotency_key
                )
            ).scalar_one_or_none()
            
            if existing:
                result.add_error(
                    code="DUPLICATE_BOOKING",
                    message="Booking with this idempotency key already exists",
                    field="idempotency_key"
                )
                return result
        
        # Check product availability
        product = db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not product:
            result.add_error(
                code="PRODUCT_NOT_FOUND",
                message="Product not found",
                field="product_id"
            )
            return result
        
        if product.inventory_status == InventoryStatus.SOLD.value:
            result.add_error(
                code="PRODUCT_SOLD",
                message="Cannot book a sold product",
                field="product_id"
            )
            return result
        
        # Check for existing active booking
        active_booking = db.execute(
            select(Booking).where(
                Booking.product_id == product_id,
                Booking.org_id == org_id,
                Booking.booking_status.in_(["pending", "confirmed"]),
                Booking.valid_until > datetime.now(timezone.utc),
                Booking.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if active_booking:
            result.add_error(
                code="PRODUCT_BOOKED",
                message=f"Product already has active booking: {active_booking.booking_code}",
                field="product_id"
            )
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRACT VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    @staticmethod
    def validate_contract_creation(
        db: Session,
        org_id: UUID,
        deal_id: UUID,
        product_id: UUID,
        idempotency_key: Optional[str] = None
    ) -> ValidationResult:
        """
        Validate contract creation.
        
        Rules:
        - Deal must exist and not be closed
        - Product must not be sold
        - No existing active contract for deal
        - Idempotency check
        """
        result = ValidationResult(valid=True)
        
        # Check idempotency
        if idempotency_key:
            existing = db.execute(
                select(Contract).where(
                    Contract.idempotency_key == idempotency_key
                )
            ).scalar_one_or_none()
            
            if existing:
                result.add_error(
                    code="DUPLICATE_CONTRACT",
                    message="Contract with this idempotency key already exists",
                    field="idempotency_key"
                )
                return result
        
        # Check deal
        deal = db.execute(
            select(Deal).where(
                Deal.id == deal_id,
                Deal.org_id == org_id,
                Deal.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not deal:
            result.add_error(
                code="DEAL_NOT_FOUND",
                message="Deal not found",
                field="deal_id"
            )
            return result
        
        closed_stages = ["closed_won", "closed_lost", "cancelled"]
        if deal.current_stage in closed_stages:
            result.add_error(
                code="DEAL_CLOSED",
                message="Cannot create contract for closed deal",
                field="deal_id"
            )
        
        # Check for existing contract
        existing_contract = db.execute(
            select(Contract).where(
                Contract.deal_id == deal_id,
                Contract.org_id == org_id,
                Contract.contract_status.not_in(["cancelled", "terminated"]),
                Contract.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if existing_contract:
            result.add_error(
                code="CONTRACT_EXISTS",
                message=f"Deal already has an active contract: {existing_contract.contract_code}",
                field="deal_id"
            )
        
        # Check product
        product = db.execute(
            select(Product).where(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None)
            )
        ).scalar_one_or_none()
        
        if not product:
            result.add_error(
                code="PRODUCT_NOT_FOUND",
                message="Product not found",
                field="product_id"
            )
        elif product.inventory_status == InventoryStatus.SOLD.value:
            result.add_error(
                code="PRODUCT_SOLD",
                message="Cannot create contract for sold product",
                field="product_id"
            )
        
        return result


# Singleton instance
validation_service = ValidationService()
