"""
ProHouzing API v2 - Deal Router
Version: 1.0.0

Deal/Pipeline management endpoints with stage transitions and product allocation.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.deal import deal_service
from core.schemas.deal import (
    DealCreate, DealUpdate, DealResponse, DealListItem, DealStageChangeRequest
)
from core.schemas.base import APIResponse, PaginationMeta

router = APIRouter(prefix="/deals", tags=["Deals"])


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=APIResponse[DealResponse], status_code=status.HTTP_201_CREATED)
async def create_deal(
    data: DealCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "create"))
):
    """
    Create a new deal.
    
    - Auto-generates deal_code
    - Initializes stage history
    - Holds product if assigned
    """
    # Override org_id from token
    data.org_id = current_user.org_id
    
    deal = deal_service.create(
        db,
        obj_in=data,
        org_id=current_user.org_id,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(deal),
        message="Deal created successfully"
    )


@router.get("", response_model=APIResponse[List[DealListItem]])
async def list_deals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_stage: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
    owner_user_id: Optional[UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """List deals with pagination, filtering, and VISIBILITY FILTER."""
    skip = (page - 1) * limit
    filters = {}
    
    if status:
        filters["status"] = status
    if current_stage:
        filters["current_stage"] = current_stage
    if customer_id:
        filters["customer_id"] = customer_id
    if product_id:
        filters["product_id"] = product_id
    if owner_user_id:
        filters["owner_user_id"] = owner_user_id
    
    search_fields = ["deal_code", "deal_name"]
    
    deals, total = deal_service.get_multi(
        db,
        org_id=current_user.org_id,
        user_id=current_user.id,  # VISIBILITY FILTER
        skip=skip,
        limit=limit,
        filters=filters if filters else None,
        search=search,
        search_fields=search_fields if search else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    pagination = deal_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[DealListItem.model_validate(d) for d in deals],
        meta=pagination
    )


@router.get("/{deal_id}", response_model=APIResponse[DealResponse])
async def get_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """Get a single deal by ID with ACCESS CHECK."""
    deal = deal_service.get(
        db,
        id=deal_id,
        org_id=current_user.org_id
    )
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # ACCESS CHECK
    if not deal_service.can_access_entity(db, entity=deal, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to view this deal"
        )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(deal)
    )


@router.put("/{deal_id}", response_model=APIResponse[DealResponse])
async def update_deal(
    deal_id: UUID,
    data: DealUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "edit"))
):
    """Update a deal with ACCESS CHECK."""
    deal = deal_service.get(db, id=deal_id, org_id=current_user.org_id)
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # ACCESS CHECK
    if not deal_service.can_access_entity(db, entity=deal, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to edit this deal"
        )
    
    updated_deal = deal_service.update(
        db,
        id=deal_id,
        org_id=current_user.org_id,
        obj_in=data,
        updated_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(updated_deal),
        message="Deal updated successfully"
    )


@router.delete("/{deal_id}", response_model=APIResponse)
async def delete_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "delete"))
):
    """Soft delete a deal with ACCESS CHECK."""
    deal = deal_service.get(db, id=deal_id, org_id=current_user.org_id)
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # ACCESS CHECK
    if not deal_service.can_access_entity(db, entity=deal, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to delete this deal"
        )
    
    success = deal_service.delete(
        db,
        id=deal_id,
        org_id=current_user.org_id,
        deleted_by=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    return APIResponse(
        success=True,
        message="Deal deleted successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{deal_id}/stage", response_model=APIResponse[DealResponse])
async def change_deal_stage(
    deal_id: UUID,
    request: DealStageChangeRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "edit"))
):
    """
    Change deal stage with history tracking.
    
    - Records stage transition in history
    - Handles won/lost stage transitions
    - Updates product status accordingly
    """
    deal = deal_service.change_stage(
        db,
        id=deal_id,
        org_id=current_user.org_id,
        request=request,
        changed_by=current_user.id
    )
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(deal),
        message=f"Stage changed to {request.new_stage}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{deal_id}/assign-product", response_model=APIResponse[DealResponse])
async def assign_product_to_deal(
    deal_id: UUID,
    product_id: UUID,
    product_price: Optional[Decimal] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "edit"))
):
    """
    Assign a product to the deal.
    
    - Releases previous product if any
    - Holds the new product
    """
    deal = deal_service.assign_product(
        db,
        id=deal_id,
        org_id=current_user.org_id,
        product_id=product_id,
        product_price=product_price,
        assigned_by=current_user.id
    )
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(deal),
        message="Product assigned to deal"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# OWNERSHIP
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{deal_id}/assign", response_model=APIResponse[DealResponse])
async def assign_deal(
    deal_id: UUID,
    owner_user_id: Optional[UUID] = None,
    owner_unit_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "assign"))
):
    """Assign deal to a user or unit."""
    deal = deal_service.assign_owner(
        db,
        id=deal_id,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
        owner_unit_id=owner_unit_id,
        assigned_by=current_user.id
    )
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(deal),
        message="Deal assigned successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# PIPELINE VIEW
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/pipeline/view", response_model=APIResponse[List[DealListItem]])
async def get_pipeline(
    owner_user_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """
    Get pipeline view (open deals only) with VISIBILITY FILTER.
    
    - Excludes won, lost, cancelled deals
    - Visibility: Sales sees own, Team Lead sees team, etc.
    - Optionally filter by owner
    """
    skip = (page - 1) * limit
    
    deals, total = deal_service.get_pipeline(
        db,
        org_id=current_user.org_id,
        user_id=current_user.id,  # VISIBILITY FILTER
        owner_user_id=owner_user_id,
        skip=skip,
        limit=limit
    )
    
    pagination = deal_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[DealListItem.model_validate(d) for d in deals],
        meta=pagination
    )


@router.get("/pipeline/stats", response_model=APIResponse[Dict[str, Any]])
async def get_pipeline_stats(
    owner_user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """Get pipeline statistics by stage."""
    stats = deal_service.get_pipeline_stats(
        db,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id
    )
    
    return APIResponse(
        success=True,
        data=stats
    )


# ═══════════════════════════════════════════════════════════════════════════════
# FILTERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/by-stage/{stage}", response_model=APIResponse[List[DealListItem]])
async def get_deals_by_stage(
    stage: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """Get deals by stage."""
    skip = (page - 1) * limit
    
    deals, total = deal_service.get_by_stage(
        db,
        org_id=current_user.org_id,
        stage=stage,
        skip=skip,
        limit=limit
    )
    
    pagination = deal_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[DealListItem.model_validate(d) for d in deals],
        meta=pagination
    )


@router.get("/by-customer/{customer_id}", response_model=APIResponse[List[DealListItem]])
async def get_deals_by_customer(
    customer_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """Get deals for a customer."""
    skip = (page - 1) * limit
    
    deals, total = deal_service.get_by_customer(
        db,
        org_id=current_user.org_id,
        customer_id=customer_id,
        skip=skip,
        limit=limit
    )
    
    pagination = deal_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[DealListItem.model_validate(d) for d in deals],
        meta=pagination
    )


@router.get("/by-product/{product_id}", response_model=APIResponse[Optional[DealResponse]])
async def get_deal_by_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view"))
):
    """Get active deal for a product."""
    deal = deal_service.get_by_product(
        db,
        org_id=current_user.org_id,
        product_id=product_id
    )
    
    return APIResponse(
        success=True,
        data=DealResponse.model_validate(deal) if deal else None
    )
