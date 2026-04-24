"""
ProHouzing Price API Routes
PROMPT 5/20 - PHASE 2: PRICE MODEL API

Endpoints:
- GET /api/prices/products/{product_id}/current - Get current prices
- GET /api/prices/products/{product_id}/history - Get price history
- POST /api/prices/products/{product_id} - Set new price
- GET /api/prices/products/{product_id}/scheduled - Get scheduled prices
"""

from typing import Optional, List
from uuid import UUID
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query

from core.database import SessionLocal, get_db
from core.dependencies import CurrentUser, require_permission
from core.services.price_service import price_service, PriceType, PriceChangeSource


router = APIRouter(prefix="/prices", tags=["Prices"])


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class CurrentPriceResponse(BaseModel):
    """Response for current price."""
    product_id: str
    list_price: Optional[float] = None
    sale_price: Optional[float] = None
    price_per_sqm: Optional[float] = None
    currency: str = "VND"


class PriceHistoryItem(BaseModel):
    """Price history item."""
    id: str
    price_type: str
    old_value: Optional[float] = None
    new_value: float
    effective_from: str
    effective_to: Optional[str] = None
    change_reason: Optional[str] = None
    source_type: Optional[str] = None
    changed_by: Optional[str] = None
    created_at: str


class PriceHistoryResponse(BaseModel):
    """Response for price history."""
    product_id: str
    total: int
    items: List[PriceHistoryItem]


class SetPriceRequest(BaseModel):
    """Request to set new price."""
    price_type: str = Field(
        default="sale_price",
        description="Price type: list_price, sale_price, price_per_sqm"
    )
    new_price: float = Field(gt=0, description="New price value")
    effective_from: Optional[str] = Field(
        default=None,
        description="Effective date (YYYY-MM-DD). Default: today"
    )
    effective_to: Optional[str] = Field(
        default=None,
        description="Expiration date (YYYY-MM-DD). Default: no expiration"
    )
    reason: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Reason for price change"
    )


class SetPriceResponse(BaseModel):
    """Response after setting price."""
    success: bool
    message: str
    price_record: Optional[PriceHistoryItem] = None


# ═══════════════════════════════════════════════════════════════════════════
# GET CURRENT PRICES
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/products/{product_id}/current",
    response_model=CurrentPriceResponse,
    summary="Get current prices for a product",
    description="Returns current active prices (list_price, sale_price, price_per_sqm)"
)
async def get_current_prices(
    product_id: UUID,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get current active prices for a product."""
    prices = price_service.get_all_current_prices(
        db,
        product_id=product_id,
        org_id=current_user.org_id,
    )
    
    return CurrentPriceResponse(
        product_id=str(product_id),
        list_price=float(prices[PriceType.LIST_PRICE]) if prices[PriceType.LIST_PRICE] else None,
        sale_price=float(prices[PriceType.SALE_PRICE]) if prices[PriceType.SALE_PRICE] else None,
        price_per_sqm=float(prices[PriceType.PRICE_PER_SQM]) if prices[PriceType.PRICE_PER_SQM] else None,
    )


# ═══════════════════════════════════════════════════════════════════════════
# GET PRICE HISTORY
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/products/{product_id}/history",
    response_model=PriceHistoryResponse,
    summary="Get price history for a product",
    description="Returns historical price changes"
)
async def get_price_history(
    product_id: UUID,
    price_type: Optional[str] = Query(None, description="Filter by price type"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get price history for a product."""
    history = price_service.get_price_history(
        db,
        product_id=product_id,
        org_id=current_user.org_id,
        price_type=price_type,
        limit=limit,
    )
    
    items = []
    for record in history:
        items.append(PriceHistoryItem(
            id=str(record.id),
            price_type=record.price_type,
            old_value=float(record.old_value) if record.old_value else None,
            new_value=float(record.new_value),
            effective_from=str(record.effective_from),
            effective_to=str(record.effective_to) if record.effective_to else None,
            change_reason=record.change_reason,
            source_type=record.source_type,
            changed_by=str(record.changed_by) if record.changed_by else None,
            created_at=record.created_at.isoformat() if record.created_at else "",
        ))
    
    return PriceHistoryResponse(
        product_id=str(product_id),
        total=len(items),
        items=items,
    )


# ═══════════════════════════════════════════════════════════════════════════
# SET NEW PRICE
# ═══════════════════════════════════════════════════════════════════════════

@router.post(
    "/products/{product_id}",
    response_model=SetPriceResponse,
    summary="Set new price for a product",
    description="Creates a new price record. Cannot modify past prices."
)
async def set_price(
    product_id: UUID,
    request: SetPriceRequest,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "edit")),
):
    """
    Set a new price for a product.
    
    Rules:
    - Cannot set effective_from in the past
    - Always appends new record, never updates
    - If effective_from is today, updates current product price
    """
    # Parse dates
    effective_from = date.today()
    if request.effective_from:
        try:
            effective_from = date.fromisoformat(request.effective_from)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid effective_from format. Use YYYY-MM-DD"
            )
    
    effective_to = None
    if request.effective_to:
        try:
            effective_to = date.fromisoformat(request.effective_to)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid effective_to format. Use YYYY-MM-DD"
            )
    
    # Validate price type
    valid_types = [PriceType.LIST_PRICE, PriceType.SALE_PRICE, PriceType.PRICE_PER_SQM]
    if request.price_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid price_type. Must be one of: {valid_types}"
        )
    
    try:
        record = price_service.set_price(
            db,
            product_id=product_id,
            org_id=current_user.org_id,
            price_type=request.price_type,
            new_price=Decimal(str(request.new_price)),
            effective_from=effective_from,
            effective_to=effective_to,
            reason=request.reason,
            source_type=PriceChangeSource.MANUAL,
            changed_by=current_user.id,
        )
        
        return SetPriceResponse(
            success=True,
            message="Price set successfully",
            price_record=PriceHistoryItem(
                id=str(record.id),
                price_type=record.price_type,
                old_value=float(record.old_value) if record.old_value else None,
                new_value=float(record.new_value),
                effective_from=str(record.effective_from),
                effective_to=str(record.effective_to) if record.effective_to else None,
                change_reason=record.change_reason,
                source_type=record.source_type,
                changed_by=str(record.changed_by) if record.changed_by else None,
                created_at=record.created_at.isoformat() if record.created_at else "",
            ),
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set price: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════
# GET SCHEDULED PRICES
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/products/{product_id}/scheduled",
    response_model=PriceHistoryResponse,
    summary="Get scheduled future prices",
    description="Returns prices scheduled to take effect in the future"
)
async def get_scheduled_prices(
    product_id: UUID,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get scheduled future prices for a product."""
    scheduled = price_service.get_scheduled_prices(
        db,
        product_id=product_id,
        org_id=current_user.org_id,
    )
    
    items = []
    for record in scheduled:
        items.append(PriceHistoryItem(
            id=str(record.id),
            price_type=record.price_type,
            old_value=float(record.old_value) if record.old_value else None,
            new_value=float(record.new_value),
            effective_from=str(record.effective_from),
            effective_to=str(record.effective_to) if record.effective_to else None,
            change_reason=record.change_reason,
            source_type=record.source_type,
            changed_by=str(record.changed_by) if record.changed_by else None,
            created_at=record.created_at.isoformat() if record.created_at else "",
        ))
    
    return PriceHistoryResponse(
        product_id=str(product_id),
        total=len(items),
        items=items,
    )


# Export router
price_router = router
