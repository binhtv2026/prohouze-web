"""
ProHouzing API v2 - Payment Router
Version: 1.0.0

Payment management with ledger-style (append-only) tracking.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.payment import payment_service
from core.schemas.transaction import PaymentCreate, PaymentUpdate, PaymentResponse
from core.schemas.base import APIResponse, PaginationMeta

router = APIRouter(prefix="/payments", tags=["Payments"])


# ═══════════════════════════════════════════════════════════════════════════════
# CREATE (APPEND-ONLY)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=APIResponse[PaymentResponse], status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "create"))
):
    """
    Record a payment receipt.
    
    - Append-only (ledger-style): cannot be modified after creation
    - Updates contract paid_amount
    - Triggers commission calculations if applicable
    """
    data.org_id = current_user.org_id
    
    payment = payment_service.create(
        db,
        obj_in=data,
        org_id=current_user.org_id,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=PaymentResponse.model_validate(payment),
        message="Payment recorded successfully"
    )


@router.get("", response_model=APIResponse[List[PaymentResponse]])
async def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    payment_status: Optional[str] = None,
    payment_type: Optional[str] = None,
    contract_id: Optional[UUID] = None,
    customer_id: Optional[UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """List payments with pagination and filtering."""
    skip = (page - 1) * limit
    filters = {}
    
    if payment_status:
        filters["payment_status"] = payment_status
    if payment_type:
        filters["payment_type"] = payment_type
    if contract_id:
        filters["contract_id"] = contract_id
    if customer_id:
        filters["customer_id"] = customer_id
    
    payments, total = payment_service.get_multi(
        db,
        org_id=current_user.org_id,
        user_id=current_user.id,  # VISIBILITY FILTER
        skip=skip,
        limit=limit,
        filters=filters if filters else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    pagination = payment_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[PaymentResponse.model_validate(p) for p in payments],
        meta=pagination
    )


@router.get("/{payment_id}", response_model=APIResponse[PaymentResponse])
async def get_payment(
    payment_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """Get a single payment by ID."""
    payment = payment_service.get(
        db,
        id=payment_id,
        org_id=current_user.org_id
    )
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return APIResponse(
        success=True,
        data=PaymentResponse.model_validate(payment)
    )


# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICATION (Only status can be changed)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{payment_id}/verify", response_model=APIResponse[PaymentResponse])
async def verify_payment(
    payment_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "approve"))
):
    """
    Verify a pending payment.
    
    - Only changes status from "pending" to "verified"
    - Updates contract balance
    """
    payment = payment_service.verify(
        db,
        id=payment_id,
        org_id=current_user.org_id,
        verified_by=current_user.id
    )
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment not found or not pending"
        )
    
    return APIResponse(
        success=True,
        data=PaymentResponse.model_validate(payment),
        message="Payment verified"
    )


@router.post("/{payment_id}/complete", response_model=APIResponse[PaymentResponse])
async def complete_payment(
    payment_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "approve"))
):
    """Mark payment as completed (money received)."""
    payment = payment_service.complete(
        db,
        id=payment_id,
        org_id=current_user.org_id,
        completed_by=current_user.id
    )
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment not found or not verified"
        )
    
    return APIResponse(
        success=True,
        data=PaymentResponse.model_validate(payment),
        message="Payment completed"
    )


@router.post("/{payment_id}/cancel", response_model=APIResponse[PaymentResponse])
async def cancel_payment(
    payment_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "cancel"))
):
    """
    Cancel a pending payment.
    
    NOTE: Completed payments cannot be cancelled.
    For corrections, create a reversal record instead.
    """
    payment = payment_service.cancel(
        db,
        id=payment_id,
        org_id=current_user.org_id,
        reason=reason,
        cancelled_by=current_user.id
    )
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment not found or cannot be cancelled"
        )
    
    return APIResponse(
        success=True,
        data=PaymentResponse.model_validate(payment),
        message="Payment cancelled"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# REVERSAL (For corrections, not deletion)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{payment_id}/reverse", response_model=APIResponse[PaymentResponse])
async def reverse_payment(
    payment_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "reverse"))
):
    """
    Reverse a completed payment (creates reversal record).
    
    - Creates a new negative payment entry
    - Maintains audit trail
    - Updates contract balance
    """
    reversal = payment_service.reverse(
        db,
        id=payment_id,
        org_id=current_user.org_id,
        reason=reason,
        reversed_by=current_user.id
    )
    
    if not reversal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment not found or not completed"
        )
    
    return APIResponse(
        success=True,
        data=PaymentResponse.model_validate(reversal),
        message="Payment reversed"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/by-contract/{contract_id}", response_model=APIResponse[List[PaymentResponse]])
async def get_payments_by_contract(
    contract_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """Get all payments for a contract."""
    skip = (page - 1) * limit
    
    payments, total = payment_service.get_by_contract(
        db,
        org_id=current_user.org_id,
        contract_id=contract_id,
        skip=skip,
        limit=limit
    )
    
    pagination = payment_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[PaymentResponse.model_validate(p) for p in payments],
        meta=pagination
    )


@router.get("/by-contract/{contract_id}/summary", response_model=APIResponse[Dict[str, Any]])
async def get_payment_summary_for_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """Get payment summary for a contract."""
    summary = payment_service.get_contract_payment_summary(
        db,
        org_id=current_user.org_id,
        contract_id=contract_id
    )
    
    return APIResponse(
        success=True,
        data=summary
    )


@router.get("/by-customer/{customer_id}", response_model=APIResponse[List[PaymentResponse]])
async def get_payments_by_customer(
    customer_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """Get all payments from a customer."""
    skip = (page - 1) * limit
    
    payments, total = payment_service.get_by_customer(
        db,
        org_id=current_user.org_id,
        customer_id=customer_id,
        skip=skip,
        limit=limit
    )
    
    pagination = payment_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[PaymentResponse.model_validate(p) for p in payments],
        meta=pagination
    )


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/report/overdue", response_model=APIResponse[List[Dict[str, Any]]])
async def get_overdue_payments(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """Get list of overdue payment schedules."""
    overdue = payment_service.get_overdue_payments(
        db,
        org_id=current_user.org_id
    )
    
    return APIResponse(
        success=True,
        data=overdue
    )


@router.get("/report/upcoming", response_model=APIResponse[List[Dict[str, Any]]])
async def get_upcoming_payments(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("payments", "view"))
):
    """Get list of upcoming scheduled payments."""
    upcoming = payment_service.get_upcoming_payments(
        db,
        org_id=current_user.org_id,
        days=days
    )
    
    return APIResponse(
        success=True,
        data=upcoming
    )
