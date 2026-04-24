"""
ProHouzing Commission Routes - API v2
Version: 2.1.0 (Visibility Filter Added)

Commission entry management with payout tracking.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timezone
from pydantic import BaseModel

from ..database import get_db
from core.dependencies import CurrentUser, require_permission
from ..models.commission import CommissionEntry
from ..services.permission import permission_service, PermissionScope


router = APIRouter(prefix="/commissions", tags=["Commissions"])


def _build_commission_visibility_filter(db: Session, user_id: UUID, org_id: UUID, query):
    """Apply visibility filter to commission query."""
    user_scope = permission_service.get_user_scope(db, user_id, org_id)
    scope = user_scope.get("scope", PermissionScope.SELF)
    
    # Global/Org scope = no filter
    if scope in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
        return query
    
    # SELF scope - only own commissions
    if scope == PermissionScope.SELF:
        return query.filter(CommissionEntry.beneficiary_user_id == user_id)
    
    # TEAM/UNIT scope
    if scope in [PermissionScope.TEAM, PermissionScope.UNIT, PermissionScope.BRANCH]:
        subordinate_ids = user_scope.get("subordinate_user_ids", [])
        all_user_ids = [user_id] + subordinate_ids
        return query.filter(CommissionEntry.beneficiary_user_id.in_(all_user_ids))
    
    return query


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionEntryResponse(BaseModel):
    id: UUID
    org_id: UUID
    entry_code: str
    commission_type: str
    deal_id: UUID
    contract_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    beneficiary_type: str
    beneficiary_user_id: Optional[UUID] = None
    beneficiary_name: Optional[str] = None
    base_amount: Decimal
    rate_type: str
    rate_value: Decimal
    gross_amount: Decimal
    deductions: Optional[Decimal] = Decimal(0)
    net_amount: Decimal
    currency_code: Optional[str] = "VND"
    earning_status: Optional[str] = "pending"
    payout_status: Optional[str] = "pending"
    earning_period: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CommissionListResponse(BaseModel):
    success: bool = True
    data: List[CommissionEntryResponse]
    meta: dict
    errors: List = []
    message: Optional[str] = None


class CommissionDetailResponse(BaseModel):
    success: bool = True
    data: CommissionEntryResponse
    errors: List = []
    message: Optional[str] = None


class CommissionSummaryResponse(BaseModel):
    success: bool = True
    data: dict
    errors: List = []
    message: Optional[str] = None


class ApproveCommissionRequest(BaseModel):
    notes: Optional[str] = None


class RejectCommissionRequest(BaseModel):
    reason: str


class UpdatePayoutStatusRequest(BaseModel):
    payout_status: str
    paid_amount: Optional[Decimal] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=CommissionListResponse)
async def list_commissions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    earning_status: Optional[str] = None,
    payout_status: Optional[str] = None,
    beneficiary_user_id: Optional[UUID] = None,
    earning_period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """List commission entries with filters and VISIBILITY"""
    org_id = current_user.org_id
    
    # Build query with visibility filter
    query = db.query(CommissionEntry).filter(CommissionEntry.org_id == org_id)
    query = _build_commission_visibility_filter(db, current_user.id, org_id, query)
    
    # Apply filters
    if earning_status:
        query = query.filter(CommissionEntry.earning_status == earning_status)
    if payout_status:
        query = query.filter(CommissionEntry.payout_status == payout_status)
    if beneficiary_user_id:
        query = query.filter(CommissionEntry.beneficiary_user_id == beneficiary_user_id)
    if earning_period:
        query = query.filter(CommissionEntry.earning_period == earning_period)
    
    # Count total
    total = query.count()
    
    # Paginate
    offset = (page - 1) * limit
    entries = query.order_by(CommissionEntry.created_at.desc()).offset(offset).limit(limit).all()
    
    return CommissionListResponse(
        data=[CommissionEntryResponse.model_validate(e) for e in entries],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "has_next": offset + limit < total,
            "has_prev": page > 1
        }
    )


@router.get("/pending-approvals", response_model=CommissionListResponse)
async def list_pending_approvals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """List commission entries pending approval with VISIBILITY"""
    org_id = current_user.org_id
    
    query = db.query(CommissionEntry).filter(
        CommissionEntry.org_id == org_id,
        CommissionEntry.earning_status.in_(["pending", "earned"])
    )
    query = _build_commission_visibility_filter(db, current_user.id, org_id, query)
    
    total = query.count()
    offset = (page - 1) * limit
    entries = query.order_by(CommissionEntry.created_at.desc()).offset(offset).limit(limit).all()
    
    return CommissionListResponse(
        data=[CommissionEntryResponse.model_validate(e) for e in entries],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "has_next": offset + limit < total,
            "has_prev": page > 1
        }
    )


@router.get("/summary", response_model=CommissionSummaryResponse)
async def get_commission_summary(
    earning_period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """Get commission summary statistics with VISIBILITY"""
    org_id = current_user.org_id
    
    query = db.query(CommissionEntry).filter(CommissionEntry.org_id == org_id)
    query = _build_commission_visibility_filter(db, current_user.id, org_id, query)
    
    if earning_period:
        query = query.filter(CommissionEntry.earning_period == earning_period)
    
    # Calculate summary
    entries = query.all()
    
    total_gross = sum(e.gross_amount or 0 for e in entries)
    total_net = sum(e.net_amount or 0 for e in entries)
    total_paid = sum(e.paid_amount or 0 for e in entries if e.payout_status == "paid")
    
    # Count by status
    pending_count = len([e for e in entries if e.earning_status == "pending"])
    approved_count = len([e for e in entries if e.earning_status == "approved"])
    paid_count = len([e for e in entries if e.payout_status == "paid"])
    
    return CommissionSummaryResponse(
        data={
            "total_entries": len(entries),
            "total_gross": float(total_gross),
            "total_net": float(total_net),
            "total_paid": float(total_paid),
            "pending_approval": pending_count,
            "approved": approved_count,
            "paid": paid_count,
            "pending_payout": len(entries) - paid_count,
        }
    )


@router.get("/{commission_id}", response_model=CommissionDetailResponse)
async def get_commission(
    commission_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """Get commission entry by ID with ACCESS CHECK"""
    org_id = current_user.org_id
    
    entry = db.query(CommissionEntry).filter(
        CommissionEntry.id == commission_id,
        CommissionEntry.org_id == org_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Commission entry not found")
    
    # ACCESS CHECK: verify user can see this commission
    user_scope = permission_service.get_user_scope(db, current_user.id, org_id)
    scope = user_scope.get("scope", PermissionScope.SELF)
    
    if scope not in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
        # Check if user is beneficiary or in their scope
        subordinate_ids = user_scope.get("subordinate_user_ids", [])
        all_user_ids = [current_user.id] + subordinate_ids
        
        if entry.beneficiary_user_id and entry.beneficiary_user_id not in all_user_ids:
            raise HTTPException(status_code=403, detail="Access denied: not authorized to view this commission")
    
    return CommissionDetailResponse(
        data=CommissionEntryResponse.model_validate(entry)
    )


@router.post("/{commission_id}/approve")
async def approve_commission(
    commission_id: UUID,
    request: ApproveCommissionRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """Approve a commission entry"""
    org_id = current_user.org_id
    user_id = str(current_user.id)
    
    entry = db.query(CommissionEntry).filter(
        CommissionEntry.id == commission_id,
        CommissionEntry.org_id == org_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Commission entry not found")
    
    if entry.earning_status == "approved":
        raise HTTPException(status_code=400, detail="Commission already approved")
    
    # Update status
    entry.earning_status = "approved"
    entry.approved_at = datetime.now(timezone.utc)
    entry.approved_by = user_id
    entry.payout_status = "pending"
    entry.updated_at = datetime.now(timezone.utc)
    
    if request.notes:
        entry.notes = request.notes
    
    db.commit()
    
    # Emit commission.approved event
    from ..services.event_service import event_service
    from ..services.event_catalog import EventCode
    
    event_service.emit_event(
        db,
        event_code=EventCode.COMMISSION_APPROVED,
        org_id=org_id,
        aggregate_type="commission",
        aggregate_id=entry.id,
        payload={
            "entry_code": entry.entry_code,
            "net_amount": float(entry.net_amount) if entry.net_amount else None,
            "beneficiary_name": entry.beneficiary_name,
            "entity_name": entry.entry_code,
            "amount": float(entry.net_amount) if entry.net_amount else None,
        },
        actor_user_id=current_user.id,
        actor_type="user",
        entity_code=entry.entry_code,
        entity_name=entry.entry_code,
        related_deal_id=entry.deal_id,
    )
    db.commit()
    
    return {
        "success": True,
        "message": "Commission approved successfully",
        "data": CommissionEntryResponse.model_validate(entry)
    }


@router.post("/{commission_id}/reject")
async def reject_commission(
    commission_id: UUID,
    request: RejectCommissionRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """Reject a commission entry"""
    org_id = current_user.org_id
    
    entry = db.query(CommissionEntry).filter(
        CommissionEntry.id == commission_id,
        CommissionEntry.org_id == org_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Commission entry not found")
    
    if entry.earning_status == "rejected":
        raise HTTPException(status_code=400, detail="Commission already rejected")
    
    # Update status
    entry.earning_status = "rejected"
    entry.notes = f"Rejected: {request.reason}"
    entry.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Commission rejected",
        "data": CommissionEntryResponse.model_validate(entry)
    }


@router.put("/{commission_id}/payout-status")
async def update_payout_status(
    commission_id: UUID,
    request: UpdatePayoutStatusRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """Update payout status of commission entry"""
    org_id = current_user.org_id
    
    entry = db.query(CommissionEntry).filter(
        CommissionEntry.id == commission_id,
        CommissionEntry.org_id == org_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Commission entry not found")
    
    # Validate status transition
    valid_statuses = ["pending", "approved", "processing", "paid", "cancelled"]
    if request.payout_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    entry.payout_status = request.payout_status
    entry.updated_at = datetime.now(timezone.utc)
    
    if request.payout_status == "paid":
        entry.paid_at = datetime.now(timezone.utc)
        entry.paid_amount = request.paid_amount or entry.net_amount
    
    if request.notes:
        entry.notes = request.notes
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Payout status updated to {request.payout_status}",
        "data": CommissionEntryResponse.model_validate(entry)
    }


@router.get("/by-user/{user_id}", response_model=CommissionListResponse)
async def get_user_commissions(
    user_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("commissions", "read"))
):
    """Get all commissions for a specific user"""
    org_id = current_user.org_id
    
    query = db.query(CommissionEntry).filter(
        CommissionEntry.org_id == org_id,
        CommissionEntry.beneficiary_user_id == user_id
    )
    
    total = query.count()
    offset = (page - 1) * limit
    entries = query.order_by(CommissionEntry.created_at.desc()).offset(offset).limit(limit).all()
    
    return CommissionListResponse(
        data=[CommissionEntryResponse.model_validate(e) for e in entries],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "has_next": offset + limit < total,
            "has_prev": page > 1
        }
    )
