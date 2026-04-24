"""
ProHouzing Ownership API Routes
PROMPT 5/20 - PHASE 2: OWNERSHIP MODEL API

Endpoints:
- GET /api/ownership/products/{product_id} - Get owner
- POST /api/ownership/products/{product_id}/assign - Assign owner
- GET /api/ownership/products/{product_id}/history - Get reassignment history
- POST /api/ownership/bulk-reassign - Bulk reassign
"""

from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query

from core.database import get_db
from core.dependencies import CurrentUser, require_permission
from core.services.ownership_service import ownership_service, OwnershipChangeSource


router = APIRouter(prefix="/ownership", tags=["Ownership"])


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class OwnerResponse(BaseModel):
    """Response for owner."""
    product_id: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    assigned_at: Optional[str] = None


class AssignOwnerRequest(BaseModel):
    """Request to assign owner."""
    new_owner_id: str = Field(..., description="New owner user ID")
    reason: Optional[str] = Field(None, max_length=255, description="Reason for assignment")


class AssignOwnerResponse(BaseModel):
    """Response after assigning owner."""
    success: bool
    product_id: str
    old_owner_id: Optional[str] = None
    new_owner_id: str
    message: str


class ReassignmentHistoryItem(BaseModel):
    """Reassignment history item."""
    id: str
    old_owner_id: Optional[str] = None
    new_owner_id: Optional[str] = None
    assigned_by: Optional[str] = None
    reason: Optional[str] = None
    source: str
    assigned_at: str


class ReassignmentHistoryResponse(BaseModel):
    """Response for reassignment history."""
    product_id: str
    total: int
    items: List[ReassignmentHistoryItem]


class BulkReassignRequest(BaseModel):
    """Request for bulk reassignment."""
    product_ids: List[str] = Field(..., min_length=1, max_length=100)
    new_owner_id: str
    reason: Optional[str] = None


class BulkReassignResponse(BaseModel):
    """Response for bulk reassignment."""
    success_count: int
    failed_count: int
    failures: List[dict] = []


# ═══════════════════════════════════════════════════════════════════════════
# GET OWNER
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/products/{product_id}",
    response_model=OwnerResponse,
    summary="Get product owner",
    description="Returns current owner of a product"
)
async def get_owner(
    product_id: UUID,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get current owner of a product."""
    details = ownership_service.get_owner_details(
        db,
        product_id=product_id,
        org_id=current_user.org_id,
    )
    
    return OwnerResponse(
        product_id=str(product_id),
        owner_id=details.get("owner_id"),
        owner_name=details.get("owner_name"),
        owner_email=details.get("owner_email"),
        assigned_at=details.get("assigned_at"),
    )


# ═══════════════════════════════════════════════════════════════════════════
# ASSIGN OWNER
# ═══════════════════════════════════════════════════════════════════════════

@router.post(
    "/products/{product_id}/assign",
    response_model=AssignOwnerResponse,
    summary="Assign product owner",
    description="Assign a new owner to a product. Logs history."
)
async def assign_owner(
    product_id: UUID,
    request: AssignOwnerRequest,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "edit")),
):
    """
    Assign a new owner to a product.
    
    RBAC Rules:
    - sales: can only assign to self
    - manager: can assign to team members
    - admin: can assign to anyone
    """
    try:
        new_owner_id = UUID(request.new_owner_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid new_owner_id format")
    
    # TODO: Add RBAC scope check based on role
    # For now, allow edit permission to assign
    
    try:
        result = ownership_service.assign_owner(
            db,
            product_id=product_id,
            org_id=current_user.org_id,
            new_owner_id=new_owner_id,
            assigned_by=current_user.id,
            reason=request.reason,
            source=OwnershipChangeSource.MANUAL,
        )
        
        return AssignOwnerResponse(
            success=True,
            product_id=str(product_id),
            old_owner_id=result.get("old_owner_id"),
            new_owner_id=result.get("new_owner_id"),
            message="Owner assigned successfully",
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign owner: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════
# REASSIGNMENT HISTORY
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/products/{product_id}/history",
    response_model=ReassignmentHistoryResponse,
    summary="Get reassignment history",
    description="Returns ownership reassignment history for a product"
)
async def get_reassignment_history(
    product_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get ownership reassignment history for a product."""
    history = ownership_service.get_reassignment_history(
        db,
        product_id=product_id,
        org_id=current_user.org_id,
        limit=limit,
    )
    
    items = []
    for record in history:
        items.append(ReassignmentHistoryItem(
            id=record["id"],
            old_owner_id=record.get("old_owner_id"),
            new_owner_id=record.get("new_owner_id"),
            assigned_by=record.get("assigned_by"),
            reason=record.get("reason"),
            source=record.get("source", "unknown"),
            assigned_at=record.get("assigned_at", ""),
        ))
    
    return ReassignmentHistoryResponse(
        product_id=str(product_id),
        total=len(items),
        items=items,
    )


# ═══════════════════════════════════════════════════════════════════════════
# BULK REASSIGN
# ═══════════════════════════════════════════════════════════════════════════

@router.post(
    "/bulk-reassign",
    response_model=BulkReassignResponse,
    summary="Bulk reassign products",
    description="Reassign multiple products to a new owner"
)
async def bulk_reassign(
    request: BulkReassignRequest,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "admin")),
):
    """
    Bulk reassign multiple products to a new owner.
    
    Requires admin permission.
    """
    try:
        new_owner_id = UUID(request.new_owner_id)
        product_ids = [UUID(pid) for pid in request.product_ids]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid UUID format: {str(e)}")
    
    result = ownership_service.bulk_reassign(
        db,
        org_id=current_user.org_id,
        product_ids=product_ids,
        new_owner_id=new_owner_id,
        assigned_by=current_user.id,
        reason=request.reason,
    )
    
    return BulkReassignResponse(
        success_count=result["success_count"],
        failed_count=result["failed_count"],
        failures=result["failures"],
    )


# Export router
ownership_router = router
