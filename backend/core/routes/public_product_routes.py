"""
ProHouzing Public Product API Routes
PROMPT 5/20 - PHASE 2: PUBLIC vs INTERNAL API

Public endpoints for customer portal.
- No authentication required
- Only shows public fields
- Simplified status display
"""

from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, func

from core.database import get_db
from core.models.product import Product, Project
from core.services.field_visibility_service import field_visibility_service


router = APIRouter(prefix="/api/public/products", tags=["Public Products"])


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class PublicProductSummary(BaseModel):
    """Public product summary."""
    id: str
    product_code: str
    title: Optional[str] = None
    product_type: Optional[str] = None
    status_display: str           # "Còn hàng", "Đã bán", etc.
    status_code: str              # "available", "sold", etc.
    is_available: bool
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    floor_no: Optional[str] = None
    unit_no: Optional[str] = None
    built_area: Optional[float] = None
    list_price: Optional[float] = None
    price_per_sqm: Optional[float] = None
    images: Optional[List[str]] = None


class PublicProductDetail(BaseModel):
    """Public product detail."""
    id: str
    product_code: str
    title: Optional[str] = None
    product_type: Optional[str] = None
    status_display: str
    status_code: str
    is_available: bool
    
    # Property details
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    floor_no: Optional[str] = None
    unit_no: Optional[str] = None
    land_area: Optional[float] = None
    built_area: Optional[float] = None
    carpet_area: Optional[float] = None
    direction: Optional[str] = None
    view: Optional[str] = None
    
    # Pricing (public only)
    list_price: Optional[float] = None
    price_per_sqm: Optional[float] = None
    currency: str = "VND"
    
    # Media
    images: Optional[List[str]] = None
    floor_plan_url: Optional[str] = None
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    
    # Features
    features: Optional[List[str]] = None
    description: Optional[str] = None
    
    # Project info (if available)
    project_name: Optional[str] = None


class PublicProductListResponse(BaseModel):
    """Response for product list."""
    total: int
    page: int
    page_size: int
    items: List[PublicProductSummary]


class FieldVisibilityConfigResponse(BaseModel):
    """Response for field visibility config."""
    public_fields: List[str]
    total_fields: int


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def product_to_public_dict(product: Product) -> dict:
    """Convert Product model to public-safe dict."""
    data = {
        "id": str(product.id),
        "product_code": product.product_code,
        "title": product.title,
        "product_type": product.product_type,
        "inventory_status": product.inventory_status,
        "bedroom_count": product.bedroom_count,
        "bathroom_count": product.bathroom_count,
        "floor_no": product.floor_no,
        "unit_no": product.unit_no,
        "land_area": float(product.land_area) if product.land_area else None,
        "built_area": float(product.built_area) if product.built_area else None,
        "carpet_area": float(product.carpet_area) if product.carpet_area else None,
        "direction": product.direction,
        "view": product.view,
        "list_price": float(product.list_price) if product.list_price else None,
        "price_per_sqm": float(product.price_per_sqm) if product.price_per_sqm else None,
        "images": product.images or [],
        "floor_plan_url": product.floor_plan_url,
        "video_url": product.video_url,
        "virtual_tour_url": product.virtual_tour_url,
        "features": product.features or [],
        "description": product.description,
    }
    return data


# ═══════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS (NO AUTH REQUIRED)
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "",
    response_model=PublicProductListResponse,
    summary="List available products (public)",
    description="Returns list of available products for public display. No authentication required."
)
async def list_public_products(
    project_id: Optional[str] = Query(None, description="Filter by project"),
    product_type: Optional[str] = Query(None, description="Filter by type"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    bedrooms: Optional[int] = Query(None, ge=0, description="Number of bedrooms"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db = Depends(get_db),
):
    """
    List products for public display.
    
    - Only shows available or recently sold products
    - Hides internal status details
    - No authentication required
    """
    # Base query - only show sellable statuses
    public_statuses = ["available", "hold", "booking_pending", "booked", "reserved", "sold"]
    
    conditions = [
        Product.deleted_at.is_(None),
        Product.status == "active",
        Product.inventory_status.in_(public_statuses),
    ]
    
    # Apply filters
    if project_id:
        try:
            conditions.append(Product.project_id == UUID(project_id))
        except ValueError:
            pass
    
    if product_type:
        conditions.append(Product.product_type == product_type)
    
    if min_price is not None:
        conditions.append(Product.list_price >= min_price)
    
    if max_price is not None:
        conditions.append(Product.list_price <= max_price)
    
    if bedrooms is not None:
        conditions.append(Product.bedroom_count == bedrooms)
    
    # Count total
    count_query = select(func.count(Product.id)).where(and_(*conditions))
    total = db.execute(count_query).scalar() or 0
    
    # Fetch page
    offset = (page - 1) * page_size
    query = select(Product).where(and_(*conditions)).offset(offset).limit(page_size)
    query = query.order_by(Product.created_at.desc())
    
    result = db.execute(query)
    products = list(result.scalars().all())
    
    # Convert to public format
    items = []
    for product in products:
        product_dict = product_to_public_dict(product)
        filtered = field_visibility_service.filter_product_for_public(product_dict)
        
        items.append(PublicProductSummary(
            id=filtered.get("id", ""),
            product_code=filtered.get("product_code", ""),
            title=filtered.get("title"),
            product_type=filtered.get("product_type"),
            status_display=filtered.get("status_display", ""),
            status_code=filtered.get("status_code", ""),
            is_available=filtered.get("is_available", False),
            bedroom_count=filtered.get("bedroom_count"),
            bathroom_count=filtered.get("bathroom_count"),
            floor_no=filtered.get("floor_no"),
            unit_no=filtered.get("unit_no"),
            built_area=filtered.get("built_area"),
            list_price=filtered.get("list_price"),
            price_per_sqm=filtered.get("price_per_sqm"),
            images=filtered.get("images"),
        ))
    
    return PublicProductListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get(
    "/{product_id}",
    response_model=PublicProductDetail,
    summary="Get product detail (public)",
    description="Returns product detail for public display. No authentication required."
)
async def get_public_product(
    product_id: UUID,
    db = Depends(get_db),
):
    """
    Get product detail for public display.
    
    - Only shows public fields
    - Hides sensitive pricing and internal status
    """
    # Only show active products with public statuses
    public_statuses = ["available", "hold", "booking_pending", "booked", "reserved", "sold"]
    
    query = select(Product).where(
        and_(
            Product.id == product_id,
            Product.deleted_at.is_(None),
            Product.status == "active",
            Product.inventory_status.in_(public_statuses),
        )
    )
    
    result = db.execute(query)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get project name if available
    project_name = None
    if product.project_id:
        project_query = select(Project).where(Project.id == product.project_id)
        project_result = db.execute(project_query)
        project = project_result.scalar_one_or_none()
        if project:
            project_name = project.project_name
    
    # Convert and filter
    product_dict = product_to_public_dict(product)
    filtered = field_visibility_service.filter_product_for_public(product_dict)
    
    return PublicProductDetail(
        id=filtered.get("id", ""),
        product_code=filtered.get("product_code", ""),
        title=filtered.get("title"),
        product_type=filtered.get("product_type"),
        status_display=filtered.get("status_display", ""),
        status_code=filtered.get("status_code", ""),
        is_available=filtered.get("is_available", False),
        bedroom_count=filtered.get("bedroom_count"),
        bathroom_count=filtered.get("bathroom_count"),
        floor_no=filtered.get("floor_no"),
        unit_no=filtered.get("unit_no"),
        land_area=filtered.get("land_area"),
        built_area=filtered.get("built_area"),
        carpet_area=filtered.get("carpet_area"),
        direction=filtered.get("direction"),
        view=filtered.get("view"),
        list_price=filtered.get("list_price"),
        price_per_sqm=filtered.get("price_per_sqm"),
        images=filtered.get("images"),
        floor_plan_url=filtered.get("floor_plan_url"),
        video_url=filtered.get("video_url"),
        virtual_tour_url=filtered.get("virtual_tour_url"),
        features=filtered.get("features"),
        description=filtered.get("description"),
        project_name=project_name,
    )


# ═══════════════════════════════════════════════════════════════════════════
# FIELD VISIBILITY CONFIG (FOR DOCUMENTATION)
# ═══════════════════════════════════════════════════════════════════════════

@router.get(
    "/config/fields",
    response_model=FieldVisibilityConfigResponse,
    summary="Get public field configuration",
    description="Returns list of fields visible in public API"
)
async def get_field_visibility_config():
    """Get list of public fields (for documentation)."""
    public_fields = field_visibility_service.get_public_fields()
    
    return FieldVisibilityConfigResponse(
        public_fields=public_fields,
        total_fields=len(public_fields),
    )


# Export router
public_product_router = router
