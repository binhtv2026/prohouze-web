"""
ProHouzing Pipeline API Routes
TASK 2 - SALES PIPELINE

APIs:
- GET /api/pipeline/deals - List deals
- POST /api/pipeline/deals - Create deal
- GET /api/pipeline/deals/{id} - Get deal detail
- PATCH /api/pipeline/deals/{id}/stage - Change stage
- GET /api/pipeline/stats - Pipeline statistics
- GET /api/pipeline/kanban - Kanban view
- GET /api/pipeline/config/stages - Stage config
"""

from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query

from core.database import get_db
from core.dependencies import CurrentUser, require_permission
from core.services.pipeline_service import (
    pipeline_service,
    InvalidStageTransitionError,
    ProductRequiredError,
    InventorySyncError,
    DealNotFoundError,
    PipelineError,
)
from config.pipeline_config import (
    STAGE_CONFIG,
    STAGE_ORDER,
    get_stage_config as get_stage_cfg,
    get_valid_transitions,
)


router = APIRouter(prefix="/pipeline", tags=["Sales Pipeline"])


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class CreateDealRequest(BaseModel):
    """Request to create a new deal."""
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[str] = Field(None, max_length=255)
    product_id: Optional[str] = Field(None, description="Product ID (required for stages >= viewing)")
    lead_id: Optional[str] = None
    expected_value: Optional[float] = Field(None, gt=0)
    stage: str = Field(default="lead_new")
    source: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class ChangeStageRequest(BaseModel):
    """Request to change deal stage."""
    new_stage: str
    reason: Optional[str] = Field(None, max_length=255)
    product_id: Optional[str] = Field(None, description="Assign product when moving to viewing+")


class DealResponse(BaseModel):
    """Deal response."""
    id: str
    deal_code: Optional[str]
    customer_name: str
    customer_phone: Optional[str]
    customer_email: Optional[str]
    product_id: Optional[str]
    product_code: Optional[str] = None
    product_title: Optional[str] = None
    lead_id: Optional[str]
    stage: str
    stage_display: str
    stage_color: str
    stage_bg_color: str
    expected_value: Optional[float]
    actual_value: Optional[float]
    currency: str
    owner_user_id: Optional[str]
    owner_name: Optional[str] = None
    probability: int
    expected_close_date: Optional[str]
    stage_entered_at: Optional[str]
    won_reason: Optional[str]
    lost_reason: Optional[str]
    notes: Optional[str]
    source: Optional[str]
    valid_transitions: List[str]
    created_at: str
    updated_at: str


class DealListResponse(BaseModel):
    """Response for deal list."""
    total: int
    page: int
    page_size: int
    items: List[DealResponse]


class PipelineStatsResponse(BaseModel):
    """Response for pipeline stats."""
    total_active: int
    total_value: float
    won_count: int
    lost_count: int
    won_value: float
    conversion_rate: float
    by_stage: dict


class StageConfigResponse(BaseModel):
    """Response for stage config."""
    stages: List[dict]


class KanbanResponse(BaseModel):
    """Response for kanban view."""
    stages: List[dict]
    deals_by_stage: dict


# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def deal_to_response(deal, db, current_user) -> DealResponse:
    """Convert deal model to response."""
    from core.models.product import Product
    from core.models.user import User
    from sqlalchemy import select
    
    stage_config = get_stage_cfg(deal.stage)
    
    # Get product info
    product_code = None
    product_title = None
    if deal.product_id:
        query = select(Product).where(Product.id == deal.product_id)
        result = db.execute(query)
        product = result.scalar_one_or_none()
        if product:
            product_code = product.product_code
            product_title = product.title
    
    # Get owner name
    owner_name = None
    if deal.owner_user_id:
        query = select(User).where(User.id == deal.owner_user_id)
        result = db.execute(query)
        owner = result.scalar_one_or_none()
        if owner:
            owner_name = owner.full_name
    
    return DealResponse(
        id=str(deal.id),
        deal_code=deal.deal_code,
        customer_name=deal.customer_name,
        customer_phone=deal.customer_phone,
        customer_email=deal.customer_email,
        product_id=str(deal.product_id) if deal.product_id else None,
        product_code=product_code,
        product_title=product_title,
        lead_id=str(deal.lead_id) if deal.lead_id else None,
        stage=deal.stage,
        stage_display=stage_config.get("name", deal.stage),
        stage_color=stage_config.get("color", "#6b7280"),
        stage_bg_color=stage_config.get("bg_color", "#f3f4f6"),
        expected_value=float(deal.expected_value) if deal.expected_value else None,
        actual_value=float(deal.actual_value) if deal.actual_value else None,
        currency=deal.currency or "VND",
        owner_user_id=str(deal.owner_user_id) if deal.owner_user_id else None,
        owner_name=owner_name,
        probability=deal.probability or 0,
        expected_close_date=deal.expected_close_date.isoformat() if deal.expected_close_date else None,
        stage_entered_at=deal.stage_entered_at.isoformat() if deal.stage_entered_at else None,
        won_reason=deal.won_reason,
        lost_reason=deal.lost_reason,
        notes=deal.notes,
        source=deal.source,
        valid_transitions=get_valid_transitions(deal.stage),
        created_at=deal.created_at.isoformat() if deal.created_at else "",
        updated_at=deal.updated_at.isoformat() if deal.updated_at else "",
    )


# ═══════════════════════════════════════════════════════════════════════════
# CREATE DEAL
# ═══════════════════════════════════════════════════════════════════════════

@router.post(
    "/deals",
    response_model=DealResponse,
    summary="Create new pipeline deal",
    description="Creates a new deal in the sales pipeline"
)
async def create_deal(
    request: CreateDealRequest,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "create")),
):
    """Create a new pipeline deal."""
    try:
        deal = pipeline_service.create_deal(
            db,
            org_id=current_user.org_id,
            customer_name=request.customer_name,
            customer_phone=request.customer_phone,
            customer_email=request.customer_email,
            product_id=UUID(request.product_id) if request.product_id else None,
            lead_id=UUID(request.lead_id) if request.lead_id else None,
            expected_value=Decimal(str(request.expected_value)) if request.expected_value else None,
            stage=request.stage,
            source=request.source,
            notes=request.notes,
            owner_user_id=current_user.id,
            created_by=current_user.id,
        )
        
        return deal_to_response(deal, db, current_user)
    
    except ProductRequiredError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PipelineError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════
# GET DEALS
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/deals",
    response_model=DealListResponse,
    summary="List pipeline deals",
    description="Get list of deals with filters"
)
async def list_deals(
    stage: Optional[str] = Query(None, description="Filter by stage"),
    owner_id: Optional[str] = Query(None, description="Filter by owner"),
    include_closed: bool = Query(False, description="Include closed deals"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view")),
):
    """List pipeline deals."""
    owner_user_id = None
    if owner_id:
        owner_user_id = UUID(owner_id)
    
    deals, total = pipeline_service.get_deals(
        db,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
        stage=stage,
        include_closed=include_closed,
        page=page,
        page_size=page_size,
    )
    
    items = [deal_to_response(d, db, current_user) for d in deals]
    
    return DealListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get(
    "/deals/{deal_id}",
    response_model=DealResponse,
    summary="Get deal detail",
    description="Get detailed information about a deal"
)
async def get_deal(
    deal_id: UUID,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view")),
):
    """Get deal by ID."""
    deal = pipeline_service.get_deal(
        db,
        deal_id=deal_id,
        org_id=current_user.org_id,
    )
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return deal_to_response(deal, db, current_user)


# ═══════════════════════════════════════════════════════════════════════════
# CHANGE STAGE
# ═══════════════════════════════════════════════════════════════════════════

@router.patch(
    "/deals/{deal_id}/stage",
    response_model=DealResponse,
    summary="Change deal stage",
    description="Move deal to a new stage with inventory sync"
)
async def change_deal_stage(
    deal_id: UUID,
    request: ChangeStageRequest,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "edit")),
):
    """
    Change deal stage.
    
    - Validates transition is allowed
    - Syncs with inventory status automatically
    """
    try:
        deal = pipeline_service.change_stage(
            db,
            deal_id=deal_id,
            org_id=current_user.org_id,
            new_stage=request.new_stage,
            user_id=current_user.id,
            reason=request.reason,
            product_id=UUID(request.product_id) if request.product_id else None,
        )
        
        return deal_to_response(deal, db, current_user)
    
    except DealNotFoundError:
        raise HTTPException(status_code=404, detail="Deal not found")
    except InvalidStageTransitionError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {e.current} → {e.target}. Valid: {e.valid}"
        )
    except ProductRequiredError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InventorySyncError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PipelineError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════
# PIPELINE STATS
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/stats",
    response_model=PipelineStatsResponse,
    summary="Get pipeline statistics",
    description="Get pipeline statistics by stage"
)
async def get_pipeline_stats(
    owner_id: Optional[str] = Query(None, description="Filter by owner"),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view")),
):
    """Get pipeline statistics."""
    owner_user_id = None
    if owner_id:
        owner_user_id = UUID(owner_id)
    
    stats = pipeline_service.get_pipeline_stats(
        db,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
    )
    
    return PipelineStatsResponse(**stats)


# ═══════════════════════════════════════════════════════════════════════════
# KANBAN VIEW
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/kanban",
    response_model=KanbanResponse,
    summary="Get kanban view",
    description="Get deals grouped by stage for kanban board"
)
async def get_kanban_view(
    owner_id: Optional[str] = Query(None, description="Filter by owner"),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("deals", "view")),
):
    """Get kanban view with deals grouped by stage."""
    owner_user_id = None
    if owner_id:
        owner_user_id = UUID(owner_id)
    
    deals_by_stage = pipeline_service.get_deals_by_stage(
        db,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
    )
    
    # Build stages list with config
    stages = []
    for stage in STAGE_ORDER:
        config = STAGE_CONFIG[stage]
        stages.append({
            "id": stage,
            "name": config["name"],
            "name_en": config["name_en"],
            "color": config["color"],
            "bg_color": config["bg_color"],
            "order": config["order"],
            "count": len(deals_by_stage.get(stage, [])),
        })
    
    # Convert deals to response format
    deals_response = {}
    for stage, deals in deals_by_stage.items():
        deals_response[stage] = [deal_to_response(d, db, current_user) for d in deals]
    
    return KanbanResponse(
        stages=stages,
        deals_by_stage=deals_response,
    )


# ═══════════════════════════════════════════════════════════════════════════
# STAGE CONFIG
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/config/stages",
    response_model=StageConfigResponse,
    summary="Get stage configuration",
    description="Get all pipeline stages with their configuration"
)
async def get_stage_config():
    """Get all pipeline stages configuration."""
    stages = []
    for stage in STAGE_ORDER:
        config = STAGE_CONFIG[stage]
        stages.append({
            "id": stage,
            "name": config["name"],
            "name_en": config["name_en"],
            "color": config["color"],
            "bg_color": config["bg_color"],
            "order": config["order"],
            "requires_product": config.get("requires_product", False),
            "inventory_status": config.get("inventory_status"),
            "is_active": config.get("is_active", True),
            "is_won": config.get("is_won", False),
            "is_lost": config.get("is_lost", False),
            "valid_transitions": get_valid_transitions(stage),
        })
    
    return StageConfigResponse(stages=stages)


# Export router
pipeline_router = router
