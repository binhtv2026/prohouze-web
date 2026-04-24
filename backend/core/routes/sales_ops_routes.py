"""
ProHouzing Sales Operations API
TASK 1 - SALES WORKING INTERFACE

APIs for sales agents:
- My Inventory (products assigned to me)
- Quick Actions (hold, create booking, create deal)
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, func, or_

from core.database import get_db
from core.dependencies import CurrentUser, require_permission
from core.models.product import Product, InventoryEvent
from core.services.inventory_status import (
    inventory_status_service,
    HoldCollisionError,
    InvalidTransitionError,
    ProductNotFoundError,
    ProductNotAvailableError,
)
from core.services.price_service import price_service, PriceType
from config.canonical_inventory import InventoryStatus, STATUS_CONFIG


router = APIRouter(prefix="/sales-ops", tags=["Sales Operations"])


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class ProductSummary(BaseModel):
    """Product summary for sales view."""
    id: str
    product_code: str
    title: Optional[str]
    product_type: Optional[str]
    inventory_status: str
    status_display: str
    status_color: str
    status_bg_color: str
    is_available: bool
    is_holdable: bool
    is_bookable: bool
    list_price: Optional[float]
    sale_price: Optional[float]
    price_per_sqm: Optional[float]
    bedroom_count: Optional[int]
    bathroom_count: Optional[int]
    built_area: Optional[float]
    floor_no: Optional[str]
    unit_no: Optional[str]
    project_name: Optional[str]
    # Hold info
    hold_by_me: bool = False
    hold_expires_at: Optional[str] = None
    # Timestamps
    created_at: Optional[str]


class MyInventoryResponse(BaseModel):
    """Response for my inventory list."""
    total: int
    page: int
    page_size: int
    by_status: dict
    items: List[ProductSummary]


class QuickActionRequest(BaseModel):
    """Request for quick actions."""
    action: str = Field(..., description="hold, release_hold, create_booking, cancel_booking")
    hold_hours: Optional[int] = Field(24, ge=1, le=168, description="Hours to hold (for hold action)")
    reason: Optional[str] = Field(None, max_length=255)
    booking_id: Optional[str] = Field(None, description="Booking ID (for booking actions)")


class QuickActionResponse(BaseModel):
    """Response for quick actions."""
    success: bool
    action: str
    product_id: str
    new_status: str
    message: str
    hold_expires_at: Optional[str] = None


class ProductDetailResponse(BaseModel):
    """Detailed product info for sales."""
    id: str
    product_code: str
    title: Optional[str]
    product_type: Optional[str]
    inventory_status: str
    status_display: str
    status_color: str
    status_bg_color: str
    
    # Availability
    is_available: bool
    is_holdable: bool
    is_bookable: bool
    valid_actions: List[str]
    
    # Pricing
    list_price: Optional[float]
    sale_price: Optional[float]
    price_per_sqm: Optional[float]
    currency: str = "VND"
    
    # Property details
    bedroom_count: Optional[int]
    bathroom_count: Optional[int]
    land_area: Optional[float]
    built_area: Optional[float]
    carpet_area: Optional[float]
    floor_no: Optional[str]
    unit_no: Optional[str]
    direction: Optional[str]
    view: Optional[str]
    
    # Media
    images: List[str] = []
    floor_plan_url: Optional[str]
    
    # Hold info
    hold_by_me: bool = False
    hold_by_user: Optional[str] = None
    hold_expires_at: Optional[str] = None
    hold_reason: Optional[str] = None
    
    # Ownership
    owner_id: Optional[str]
    owner_name: Optional[str]
    
    # Project
    project_name: Optional[str]
    project_id: Optional[str]
    
    # Recent events
    recent_events: List[dict] = []


# ═══════════════════════════════════════════════════════════════════════════
# STATUS HELPERS
# ═══════════════════════════════════════════════════════════════════════════

STATUS_DISPLAY_VI = {
    "draft": "Nháp",
    "not_open": "Chưa mở bán",
    "available": "Còn hàng",
    "hold": "Đang giữ",
    "booking_pending": "Chờ booking",
    "booked": "Đã đặt cọc",
    "reserved": "Đã giữ chỗ",
    "sold": "Đã bán",
    "blocked": "Đã khóa",
    "inactive": "Không hoạt động",
}

def get_status_config(status: str) -> dict:
    """Get status display config."""
    config = STATUS_CONFIG.get(status, {})
    return {
        "display": STATUS_DISPLAY_VI.get(status, status),
        "color": config.get("color", "#6b7280"),
        "bg_color": config.get("bg_color", "#f3f4f6"),
        "is_sellable": config.get("is_sellable", False),
        "can_hold": config.get("can_hold", False),
        "can_book": config.get("can_book", False),
    }


def get_valid_actions(product: Product, user_id: UUID) -> List[str]:
    """Get valid actions for product based on current status and user."""
    actions = []
    status = product.inventory_status
    
    if status == "available":
        actions.append("hold")
    elif status == "hold":
        if product.hold_by_user_id == user_id:
            actions.extend(["release_hold", "create_booking"])
    elif status == "booking_pending":
        if product.hold_by_user_id == user_id:
            actions.extend(["confirm_booking", "cancel_booking"])
    elif status == "booked":
        actions.append("create_deal")
    
    return actions


# ═══════════════════════════════════════════════════════════════════════════
# MY INVENTORY
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/my-inventory",
    response_model=MyInventoryResponse,
    summary="Get my assigned products",
    description="Returns products assigned to current sales user with status badges"
)
async def get_my_inventory(
    status: Optional[str] = Query(None, description="Filter by inventory status"),
    search: Optional[str] = Query(None, description="Search by code or title"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """
    Get products assigned to current user.
    Shows all products where user is owner or has active hold.
    """
    from core.models.product import Project
    
    # Build query - products owned by user OR held by user
    conditions = [
        Product.org_id == current_user.org_id,
        Product.deleted_at.is_(None),
        Product.status == "active",
        or_(
            Product.created_by == current_user.id,
            Product.hold_by_user_id == current_user.id,
        )
    ]
    
    if status:
        conditions.append(Product.inventory_status == status)
    
    if search:
        search_term = f"%{search}%"
        conditions.append(or_(
            Product.product_code.ilike(search_term),
            Product.title.ilike(search_term),
        ))
    
    # Count by status
    status_counts = {}
    for s in ["available", "hold", "booking_pending", "booked", "reserved", "sold"]:
        count_q = select(func.count(Product.id)).where(
            and_(
                Product.org_id == current_user.org_id,
                Product.deleted_at.is_(None),
                or_(
                    Product.created_by == current_user.id,
                    Product.hold_by_user_id == current_user.id,
                ),
                Product.inventory_status == s,
            )
        )
        count = db.execute(count_q).scalar() or 0
        status_counts[s] = count
    
    # Total count
    count_query = select(func.count(Product.id)).where(and_(*conditions))
    total = db.execute(count_query).scalar() or 0
    
    # Fetch products
    offset = (page - 1) * page_size
    query = select(Product).where(and_(*conditions)).offset(offset).limit(page_size)
    query = query.order_by(Product.updated_at.desc())
    
    result = db.execute(query)
    products = list(result.scalars().all())
    
    # Build response
    items = []
    for p in products:
        status_config = get_status_config(p.inventory_status)
        
        # Get project name
        project_name = None
        if p.project_id:
            proj_q = select(Project).where(Project.id == p.project_id)
            proj = db.execute(proj_q).scalar_one_or_none()
            if proj:
                project_name = proj.project_name
        
        items.append(ProductSummary(
            id=str(p.id),
            product_code=p.product_code,
            title=p.title,
            product_type=p.product_type,
            inventory_status=p.inventory_status,
            status_display=status_config["display"],
            status_color=status_config["color"],
            status_bg_color=status_config["bg_color"],
            is_available=p.inventory_status == "available",
            is_holdable=status_config["can_hold"],
            is_bookable=status_config["can_book"],
            list_price=float(p.list_price) if p.list_price else None,
            sale_price=float(p.sale_price) if p.sale_price else None,
            price_per_sqm=float(p.price_per_sqm) if p.price_per_sqm else None,
            bedroom_count=p.bedroom_count,
            bathroom_count=p.bathroom_count,
            built_area=float(p.built_area) if p.built_area else None,
            floor_no=p.floor_no,
            unit_no=p.unit_no,
            project_name=project_name,
            hold_by_me=p.hold_by_user_id == current_user.id,
            hold_expires_at=p.hold_expires_at.isoformat() if p.hold_expires_at else None,
            created_at=p.created_at.isoformat() if p.created_at else None,
        ))
    
    return MyInventoryResponse(
        total=total,
        page=page,
        page_size=page_size,
        by_status=status_counts,
        items=items,
    )


# ═══════════════════════════════════════════════════════════════════════════
# PRODUCT DETAIL
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    summary="Get product detail for sales",
    description="Returns detailed product info with valid actions"
)
async def get_product_detail(
    product_id: UUID,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get detailed product info for sales operations."""
    from core.models.product import Project
    from core.models.user import User
    
    # Get product
    query = select(Product).where(
        and_(
            Product.id == product_id,
            Product.org_id == current_user.org_id,
            Product.deleted_at.is_(None),
        )
    )
    result = db.execute(query)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    status_config = get_status_config(product.inventory_status)
    valid_actions = get_valid_actions(product, current_user.id)
    
    # Get project name
    project_name = None
    if product.project_id:
        proj_q = select(Project).where(Project.id == product.project_id)
        proj = db.execute(proj_q).scalar_one_or_none()
        if proj:
            project_name = proj.project_name
    
    # Get owner info
    owner_name = None
    if product.created_by:
        user_q = select(User).where(User.id == product.created_by)
        owner = db.execute(user_q).scalar_one_or_none()
        if owner:
            owner_name = owner.full_name
    
    # Get hold user info
    hold_by_user = None
    if product.hold_by_user_id:
        user_q = select(User).where(User.id == product.hold_by_user_id)
        holder = db.execute(user_q).scalar_one_or_none()
        if holder:
            hold_by_user = holder.full_name
    
    # Get recent events
    events_q = select(InventoryEvent).where(
        InventoryEvent.product_id == product_id
    ).order_by(InventoryEvent.created_at.desc()).limit(5)
    events_result = db.execute(events_q)
    events = list(events_result.scalars().all())
    
    recent_events = []
    for e in events:
        recent_events.append({
            "id": str(e.id),
            "old_status": e.old_status,
            "new_status": e.new_status,
            "source": e.source,
            "reason": e.reason,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })
    
    return ProductDetailResponse(
        id=str(product.id),
        product_code=product.product_code,
        title=product.title,
        product_type=product.product_type,
        inventory_status=product.inventory_status,
        status_display=status_config["display"],
        status_color=status_config["color"],
        status_bg_color=status_config["bg_color"],
        is_available=product.inventory_status == "available",
        is_holdable=status_config["can_hold"],
        is_bookable=status_config["can_book"],
        valid_actions=valid_actions,
        list_price=float(product.list_price) if product.list_price else None,
        sale_price=float(product.sale_price) if product.sale_price else None,
        price_per_sqm=float(product.price_per_sqm) if product.price_per_sqm else None,
        bedroom_count=product.bedroom_count,
        bathroom_count=product.bathroom_count,
        land_area=float(product.land_area) if product.land_area else None,
        built_area=float(product.built_area) if product.built_area else None,
        carpet_area=float(product.carpet_area) if product.carpet_area else None,
        floor_no=product.floor_no,
        unit_no=product.unit_no,
        direction=product.direction,
        view=product.view,
        images=product.images or [],
        floor_plan_url=product.floor_plan_url,
        hold_by_me=product.hold_by_user_id == current_user.id,
        hold_by_user=hold_by_user,
        hold_expires_at=product.hold_expires_at.isoformat() if product.hold_expires_at else None,
        hold_reason=product.hold_reason,
        owner_id=str(product.created_by) if product.created_by else None,
        owner_name=owner_name,
        project_name=project_name,
        project_id=str(product.project_id) if product.project_id else None,
        recent_events=recent_events,
    )


# ═══════════════════════════════════════════════════════════════════════════
# QUICK ACTIONS
# ═══════════════════════════════════════════════════════════════════════════

@router.post(
    "/products/{product_id}/action",
    response_model=QuickActionResponse,
    summary="Execute quick action on product",
    description="1-click actions: hold, release_hold, create_booking, cancel_booking"
)
async def execute_quick_action(
    product_id: UUID,
    request: QuickActionRequest,
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "edit")),
):
    """
    Execute quick action on product.
    
    Actions:
    - hold: Place hold on available product
    - release_hold: Release your hold
    - create_booking: Request booking from hold
    - cancel_booking: Cancel booking request
    """
    import uuid as uuid_module
    
    action = request.action.lower()
    
    try:
        if action == "hold":
            product = inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                hold_hours=request.hold_hours or 24,
                reason=request.reason or "Sales hold",
            )
            return QuickActionResponse(
                success=True,
                action=action,
                product_id=str(product_id),
                new_status=product.inventory_status,
                message="Product held successfully",
                hold_expires_at=product.hold_expires_at.isoformat() if product.hold_expires_at else None,
            )
        
        elif action == "release_hold":
            product = inventory_status_service.release_hold(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
            )
            return QuickActionResponse(
                success=True,
                action=action,
                product_id=str(product_id),
                new_status=product.inventory_status,
                message="Hold released successfully",
            )
        
        elif action == "create_booking":
            booking_id = uuid_module.uuid4()
            if request.booking_id:
                booking_id = UUID(request.booking_id)
            
            product = inventory_status_service.request_booking(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
                booking_id=booking_id,
            )
            return QuickActionResponse(
                success=True,
                action=action,
                product_id=str(product_id),
                new_status=product.inventory_status,
                message=f"Booking requested. Booking ID: {booking_id}",
            )
        
        elif action == "cancel_booking":
            product = inventory_status_service.cancel_booking(
                db=db,
                product_id=product_id,
                user_id=current_user.id,
                org_id=current_user.org_id,
            )
            return QuickActionResponse(
                success=True,
                action=action,
                product_id=str(product_id),
                new_status=product.inventory_status,
                message="Booking cancelled",
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    
    except HoldCollisionError as e:
        raise HTTPException(
            status_code=409,
            detail=f"Product already held by another user until {e.expires_at}"
        )
    except InvalidTransitionError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Current status: {e.current}. Valid transitions: {e.valid}"
        )
    except ProductNotFoundError:
        raise HTTPException(status_code=404, detail="Product not found")
    except ProductNotAvailableError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════
# AVAILABLE PRODUCTS (Browse)
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/available-products",
    summary="Browse available products",
    description="Get all available products for sales to select"
)
async def get_available_products(
    project_id: Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "view")),
):
    """Get available products for browsing and selection."""
    from core.models.product import Project
    
    conditions = [
        Product.org_id == current_user.org_id,
        Product.deleted_at.is_(None),
        Product.status == "active",
        Product.inventory_status == "available",
    ]
    
    if project_id:
        conditions.append(Product.project_id == UUID(project_id))
    
    if product_type:
        conditions.append(Product.product_type == product_type)
    
    if min_price is not None:
        conditions.append(Product.list_price >= min_price)
    
    if max_price is not None:
        conditions.append(Product.list_price <= max_price)
    
    # Count
    count_query = select(func.count(Product.id)).where(and_(*conditions))
    total = db.execute(count_query).scalar() or 0
    
    # Fetch
    offset = (page - 1) * page_size
    query = select(Product).where(and_(*conditions)).offset(offset).limit(page_size)
    query = query.order_by(Product.list_price.asc())
    
    result = db.execute(query)
    products = list(result.scalars().all())
    
    items = []
    for p in products:
        status_config = get_status_config(p.inventory_status)
        
        # Get project name
        project_name = None
        if p.project_id:
            proj_q = select(Project).where(Project.id == p.project_id)
            proj = db.execute(proj_q).scalar_one_or_none()
            if proj:
                project_name = proj.project_name
        
        items.append({
            "id": str(p.id),
            "product_code": p.product_code,
            "title": p.title,
            "product_type": p.product_type,
            "inventory_status": p.inventory_status,
            "status_display": status_config["display"],
            "status_color": status_config["color"],
            "list_price": float(p.list_price) if p.list_price else None,
            "sale_price": float(p.sale_price) if p.sale_price else None,
            "bedroom_count": p.bedroom_count,
            "built_area": float(p.built_area) if p.built_area else None,
            "floor_no": p.floor_no,
            "unit_no": p.unit_no,
            "project_name": project_name,
        })
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items,
    }


# Export router
sales_ops_router = router
