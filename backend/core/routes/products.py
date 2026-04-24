"""
ProHouzing Products & Projects Routes - API v2
Version: 2.0.0

Products (units/căn) and Projects management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from core.dependencies import CurrentUser, require_permission
from ..models.product import Product, Project


router = APIRouter(tags=["Products & Projects"])


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ProductResponse(BaseModel):
    id: UUID
    org_id: UUID
    project_id: Optional[UUID] = None
    product_code: str
    product_type: Optional[str] = None
    title: Optional[str] = None
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    floor_no: Optional[str] = None
    unit_no: Optional[str] = None
    land_area: Optional[Decimal] = None
    built_area: Optional[Decimal] = None
    direction: Optional[str] = None
    list_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    inventory_status: Optional[str] = None
    availability_status: Optional[str] = None
    status: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: UUID
    org_id: UUID
    project_code: str
    project_name: str
    project_type: Optional[str] = None
    selling_status: Optional[str] = None
    address_line: Optional[str] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    sold_units: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    commission_rate: Optional[Decimal] = None
    status: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    success: bool = True
    data: List[ProductResponse]
    meta: dict
    errors: List = []
    message: Optional[str] = None


class ProjectListResponse(BaseModel):
    success: bool = True
    data: List[ProjectResponse]
    meta: dict
    errors: List = []
    message: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTS ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/products", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    project_id: Optional[UUID] = None,
    product_type: Optional[str] = None,
    inventory_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "read"))
):
    """List products with filters"""
    org_id = current_user.org_id
    
    query = db.query(Product).filter(Product.org_id == org_id)
    
    if project_id:
        query = query.filter(Product.project_id == project_id)
    if product_type:
        query = query.filter(Product.product_type == product_type)
    if inventory_status:
        query = query.filter(Product.inventory_status == inventory_status)
    
    total = query.count()
    offset = (page - 1) * limit
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(limit).all()
    
    return ProductListResponse(
        data=[ProductResponse.model_validate(p) for p in products],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "has_next": offset + limit < total,
            "has_prev": page > 1
        }
    )


@router.get("/products/{product_id}")
async def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("products", "read"))
):
    """Get product by ID"""
    org_id = current_user.org_id
    
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.org_id == org_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "success": True,
        "data": ProductResponse.model_validate(product)
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PROJECTS ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    selling_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("projects", "read"))
):
    """List projects with filters"""
    org_id = current_user.org_id
    
    query = db.query(Project).filter(Project.org_id == org_id)
    
    if selling_status:
        query = query.filter(Project.selling_status == selling_status)
    
    total = query.count()
    offset = (page - 1) * limit
    projects = query.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()
    
    return ProjectListResponse(
        data=[ProjectResponse.model_validate(p) for p in projects],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "has_next": offset + limit < total,
            "has_prev": page > 1
        }
    )


@router.get("/projects/{project_id}")
async def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("projects", "read"))
):
    """Get project by ID"""
    org_id = current_user.org_id
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.org_id == org_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "success": True,
        "data": ProjectResponse.model_validate(project)
    }
