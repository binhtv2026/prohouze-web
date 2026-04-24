"""
ProHouzing Manager Control Routes
TASK 3 - MANAGER CONTROL APIs

API Endpoints:
═══════════════════════════════════════════════════════════════════════════
1. INVENTORY CONTROL (PRIORITY 1)
   - GET  /manager/inventory/holds        - Active holds
   - GET  /manager/inventory/overdue      - Overdue holds
   - GET  /manager/inventory/unassigned   - Unassigned products
   - GET  /manager/inventory/blocked      - Blocked products
   - GET  /manager/inventory/summary      - Inventory summary
   - POST /manager/inventory/force-release - Force release hold
   - POST /manager/inventory/reassign     - Reassign product owner

2. DASHBOARD METRICS (PRIORITY 2)
   - GET  /manager/dashboard/summary      - Dashboard summary
   - GET  /manager/dashboard/performance  - Sales performance
   - GET  /manager/dashboard/pipeline     - Pipeline analysis

3. APPROVAL FLOW (PRIORITY 3)
   - GET  /manager/approvals              - Pending approvals
   - GET  /manager/approvals/stats        - Approval stats
   - GET  /manager/approvals/{id}         - Get approval detail
   - POST /manager/approvals/{id}/approve - Approve request
   - POST /manager/approvals/{id}/reject  - Reject request

AUDIT LOG: All actions are logged with user_id, action, timestamp
═══════════════════════════════════════════════════════════════════════════
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.services.manager_dashboard_service import manager_dashboard_service
from core.services.manager_inventory_service import manager_inventory_service
from core.services.approval_service import approval_service


router = APIRouter(prefix="/api/manager", tags=["Manager Control"])


# ═══════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class ForceReleaseRequest(BaseModel):
    """Request to force release a hold."""
    product_id: UUID
    reason: str = Field(..., min_length=1, max_length=500)


class ReassignRequest(BaseModel):
    """Request to reassign product owner."""
    product_id: UUID
    new_owner_id: UUID
    reason: str = Field(..., min_length=1, max_length=500)


class ApproveRequest(BaseModel):
    """Request to approve an approval request."""
    notes: Optional[str] = None


class RejectRequest(BaseModel):
    """Request to reject an approval request."""
    reason: str = Field(..., min_length=1, max_length=500)


class OverrideDealStageRequest(BaseModel):
    """Request to override deal stage."""
    deal_id: UUID
    new_stage: str
    reason: str = Field(..., min_length=1, max_length=500)


# ═══════════════════════════════════════════════════════════════════════════
# MOCK AUTH (TO BE REPLACED WITH REAL AUTH)
# ═══════════════════════════════════════════════════════════════════════════

def get_current_manager(db: Session = Depends(get_db)):
    """
    Get current manager user.
    In production, this should verify JWT and check manager role.
    """
    # Mock manager for testing
    from sqlalchemy import select, text
    from core.models.user import User
    
    # Try to get first admin/manager user
    query = select(User).where(User.email.like("%admin%")).limit(1)
    result = db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        # Create a mock manager ID
        import uuid
        return {
            "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
            "org_id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
            "role": "manager",
            "full_name": "Manager User",
        }
    
    return {
        "id": user.id,
        "org_id": user.org_id or UUID("00000000-0000-0000-0000-000000000001"),
        "role": "manager",
        "full_name": user.full_name,
    }


# ═══════════════════════════════════════════════════════════════════════════
# 1. INVENTORY CONTROL ENDPOINTS (PRIORITY 1)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/inventory/holds")
async def get_active_holds(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get all products currently on hold.
    
    Shows who is holding what and when it expires.
    """
    try:
        result = manager_inventory_service.get_active_holds(
            db,
            org_id=current_user["org_id"],
            page=page,
            page_size=page_size,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/inventory/overdue")
async def get_overdue_holds(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get products with expired holds (24+ hours).
    
    These should be actioned immediately.
    """
    try:
        result = manager_inventory_service.get_overdue_holds(
            db,
            org_id=current_user["org_id"],
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/inventory/unassigned")
async def get_unassigned_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get products without sales owner assigned.
    """
    try:
        result = manager_inventory_service.get_unassigned_products(
            db,
            org_id=current_user["org_id"],
            page=page,
            page_size=page_size,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/inventory/blocked")
async def get_blocked_products(
    days: int = Query(7, ge=1, le=365, description="Products blocked for more than X days"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get products blocked for too long.
    """
    try:
        result = manager_inventory_service.get_blocked_products(
            db,
            org_id=current_user["org_id"],
            days_blocked=days,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/inventory/summary")
async def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get overall inventory summary.
    
    Returns counts and values by status.
    """
    try:
        result = manager_inventory_service.get_inventory_summary(
            db,
            org_id=current_user["org_id"],
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/inventory/force-release")
async def force_release_hold(
    request: ForceReleaseRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Force release a hold on a product.
    
    Manager action - bypasses normal hold ownership check.
    Audit logged.
    """
    try:
        result = manager_inventory_service.force_release_hold(
            db,
            product_id=request.product_id,
            org_id=current_user["org_id"],
            manager_id=current_user["id"],
            reason=request.reason,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/inventory/reassign")
async def reassign_product_owner(
    request: ReassignRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Reassign product to a different sales owner.
    
    Manager action - can override any assignment.
    Audit logged.
    """
    try:
        result = manager_inventory_service.reassign_product_owner(
            db,
            product_id=request.product_id,
            org_id=current_user["org_id"],
            new_owner_id=request.new_owner_id,
            manager_id=current_user["id"],
            reason=request.reason,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/inventory/override-stage")
async def override_deal_stage(
    request: OverrideDealStageRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Override deal stage (Manager action).
    
    Bypasses normal stage transition rules.
    All actions are audit logged.
    """
    try:
        result = manager_inventory_service.override_deal_stage(
            db,
            deal_id=request.deal_id,
            org_id=current_user["org_id"],
            new_stage=request.new_stage,
            manager_id=current_user["id"],
            reason=request.reason,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ═══════════════════════════════════════════════════════════════════════════
# 2. DASHBOARD METRICS ENDPOINTS (PRIORITY 2)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    team_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get dashboard summary metrics.
    
    Returns total deals, values, conversion rates, deals by stage.
    """
    try:
        result = manager_dashboard_service.get_dashboard_summary(
            db,
            org_id=current_user["org_id"],
            team_id=team_id,
            date_from=date_from,
            date_to=date_to,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/dashboard/performance")
async def get_sales_performance(
    team_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get sales performance by user.
    
    Returns rankings with top and bottom performers.
    """
    try:
        result = manager_dashboard_service.get_sales_performance(
            db,
            org_id=current_user["org_id"],
            team_id=team_id,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/dashboard/pipeline")
async def get_pipeline_analysis(
    team_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get pipeline analysis for forecasting.
    
    Returns pipeline value by stage with weighted forecast.
    """
    try:
        result = manager_dashboard_service.get_pipeline_analysis(
            db,
            org_id=current_user["org_id"],
            team_id=team_id,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ═══════════════════════════════════════════════════════════════════════════
# 3. APPROVAL FLOW ENDPOINTS (PRIORITY 3)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/approvals")
async def get_pending_approvals(
    request_type: Optional[str] = None,
    required_role: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get pending approval requests.
    
    Filter by type (booking, deal) and required role (manager, director).
    """
    try:
        result = approval_service.get_pending_approvals(
            db,
            org_id=current_user["org_id"],
            request_type=request_type,
            required_role=required_role,
            page=page,
            page_size=page_size,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/approvals/stats")
async def get_approval_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get approval statistics.
    
    Returns counts by status (pending, approved, rejected).
    """
    try:
        result = approval_service.get_approval_stats(
            db,
            org_id=current_user["org_id"],
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/approvals/{approval_id}")
async def get_approval_detail(
    approval_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Get approval request detail.
    """
    try:
        request = approval_service.get_approval_by_id(
            db,
            approval_id=approval_id,
            org_id=current_user["org_id"],
        )
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval request {approval_id} not found"
            )
        
        # Get requester name
        from core.models.user import User
        from sqlalchemy import select
        user_q = select(User).where(User.id == request.requested_by)
        user = db.execute(user_q).scalar_one_or_none()
        
        return {
            "id": str(request.id),
            "request_type": request.request_type,
            "reference_type": request.reference_type,
            "reference_id": str(request.reference_id),
            "title": request.title,
            "description": request.description,
            "original_value": float(request.original_value) if request.original_value else None,
            "requested_value": float(request.requested_value) if request.requested_value else None,
            "discount_percent": float(request.discount_percent) if request.discount_percent else None,
            "required_role": request.required_role,
            "status": request.status,
            "requested_by": str(request.requested_by),
            "requester_name": user.full_name if user else None,
            "requested_at": request.requested_at.isoformat() if request.requested_at else None,
            "approved_by": str(request.approved_by) if request.approved_by else None,
            "approved_at": request.approved_at.isoformat() if request.approved_at else None,
            "rejection_reason": request.rejection_reason,
            "metadata": request.metadata_json,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/approvals/{approval_id}/approve")
async def approve_request(
    approval_id: UUID,
    request: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Approve an approval request.
    
    Manager can approve deals ≤ 3 tỷ.
    Director can approve any deal.
    """
    try:
        result = approval_service.approve_request(
            db,
            approval_id=approval_id,
            org_id=current_user["org_id"],
            approved_by=current_user["id"],
            approver_role=current_user["role"],
            notes=request.notes,
        )
        return {
            "success": True,
            "approval_id": str(result.id),
            "status": result.status,
            "message": "Approval request approved successfully",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/approvals/{approval_id}/reject")
async def reject_request(
    approval_id: UUID,
    request: RejectRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Reject an approval request.
    """
    try:
        result = approval_service.reject_request(
            db,
            approval_id=approval_id,
            org_id=current_user["org_id"],
            rejected_by=current_user["id"],
            rejector_role=current_user["role"],
            reason=request.reason,
        )
        return {
            "success": True,
            "approval_id": str(result.id),
            "status": result.status,
            "message": "Approval request rejected",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ═══════════════════════════════════════════════════════════════════════════
# HELPER: Check Approval Needed
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/check-approval")
async def check_approval_needed(
    value: float,
    discount_percent: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_manager),
):
    """
    Check if a deal/booking needs approval.
    
    Returns whether approval is needed and which role is required.
    """
    from decimal import Decimal
    
    result = approval_service.check_approval_needed(
        Decimal(str(value)),
        discount_percent,
    )
    return result
