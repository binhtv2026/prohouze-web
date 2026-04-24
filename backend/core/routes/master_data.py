"""
ProHouzing Master Data API Routes
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation

Endpoints:
- GET /api/v1/master-data/categories - List all categories
- GET /api/v1/master-data/categories/{code} - Get category by code
- POST /api/v1/master-data/categories - Create category (admin)
- PUT /api/v1/master-data/categories/{id} - Update category (admin)
- DELETE /api/v1/master-data/categories/{id} - Soft delete category (admin)

- GET /api/v1/master-data/items - List items (filter by category_code)
- GET /api/v1/master-data/items/{id} - Get item by id
- GET /api/v1/master-data/items/code/{category_code}/{item_code} - Get item by codes
- POST /api/v1/master-data/items - Create item (admin)
- PUT /api/v1/master-data/items/{id} - Update item (admin)
- DELETE /api/v1/master-data/items/{id} - Soft delete item (admin)

- POST /api/v1/master-data/seed - Seed system data (admin)
- GET /api/v1/master-data/lookup/{category_code} - Quick lookup for dropdowns
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel, Field

from ..database import get_db
from ..models.master_data import MasterDataCategory, MasterDataItem


router = APIRouter(prefix="/master-data", tags=["Master Data"])


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class CategoryBase(BaseModel):
    category_code: str = Field(..., max_length=50)
    category_name: str = Field(..., max_length=255)
    category_name_en: Optional[str] = None
    description: Optional[str] = None
    scope: str = "system"
    module_code: Optional[str] = None
    is_system: bool = False
    is_hierarchical: bool = False
    is_multi_select: bool = False
    allow_custom: bool = True
    sort_order: int = 0
    icon_code: Optional[str] = None
    enum_class_name: Optional[str] = None


class CategoryCreate(CategoryBase):
    org_id: Optional[UUID] = None


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    category_name_en: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[str] = None
    module_code: Optional[str] = None
    is_hierarchical: Optional[bool] = None
    is_multi_select: Optional[bool] = None
    allow_custom: Optional[bool] = None
    sort_order: Optional[int] = None
    icon_code: Optional[str] = None
    status: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: UUID
    org_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime
    item_count: Optional[int] = None

    class Config:
        from_attributes = True


class ItemBase(BaseModel):
    item_code: str = Field(..., max_length=100)
    item_label: str = Field(..., max_length=255)
    item_label_vi: Optional[str] = None
    item_label_en: Optional[str] = None
    description: Optional[str] = None
    parent_item_id: Optional[UUID] = None
    icon_code: Optional[str] = None
    color_code: Optional[str] = None
    is_default: bool = False
    sort_order: int = 0
    import_aliases: Optional[List[str]] = None


class ItemCreate(ItemBase):
    category_id: UUID
    org_id: Optional[UUID] = None


class ItemCreateByCode(ItemBase):
    """Create item by category_code instead of category_id"""
    category_code: str


class ItemUpdate(BaseModel):
    item_label: Optional[str] = None
    item_label_vi: Optional[str] = None
    item_label_en: Optional[str] = None
    description: Optional[str] = None
    parent_item_id: Optional[UUID] = None
    icon_code: Optional[str] = None
    color_code: Optional[str] = None
    is_default: Optional[bool] = None
    sort_order: Optional[int] = None
    import_aliases: Optional[List[str]] = None
    status: Optional[str] = None


class ItemResponse(ItemBase):
    id: UUID
    org_id: Optional[UUID] = None
    category_id: UUID
    category_code: Optional[str] = None
    level: int = 0
    path: Optional[str] = None
    is_system: bool
    enum_value: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LookupItemResponse(BaseModel):
    """Simplified response for dropdown lookups"""
    code: str
    label: str
    label_vi: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_default: bool = False


class SeedResponse(BaseModel):
    success: bool
    message: str
    categories_count: int
    items_count: int


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def serialize_category(cat: MasterDataCategory, item_count: int = None) -> dict:
    """Convert category to response dict"""
    return {
        "id": str(cat.id),
        "org_id": str(cat.org_id) if cat.org_id else None,
        "category_code": cat.category_code,
        "category_name": cat.category_name,
        "category_name_en": cat.category_name_en,
        "description": cat.description,
        "scope": cat.scope,
        "module_code": cat.module_code,
        "is_system": cat.is_system,
        "is_hierarchical": cat.is_hierarchical,
        "is_multi_select": cat.is_multi_select,
        "allow_custom": cat.allow_custom,
        "sort_order": cat.sort_order,
        "icon_code": cat.icon_code,
        "enum_class_name": cat.enum_class_name,
        "status": cat.status,
        "created_at": cat.created_at.isoformat() if cat.created_at else None,
        "updated_at": cat.updated_at.isoformat() if cat.updated_at else None,
        "item_count": item_count,
    }


def serialize_item(item: MasterDataItem, include_category: bool = False) -> dict:
    """Convert item to response dict"""
    result = {
        "id": str(item.id),
        "org_id": str(item.org_id) if item.org_id else None,
        "category_id": str(item.category_id),
        "item_code": item.item_code,
        "item_label": item.item_label,
        "item_label_vi": item.item_label_vi,
        "item_label_en": item.item_label_en,
        "description": item.description,
        "parent_item_id": str(item.parent_item_id) if item.parent_item_id else None,
        "level": item.level,
        "path": item.path,
        "icon_code": item.icon_code,
        "color_code": item.color_code,
        "is_default": item.is_default,
        "is_system": item.is_system,
        "is_terminal": item.is_terminal,
        "sort_order": item.sort_order,
        "enum_value": item.enum_value,
        "import_aliases": item.import_aliases,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }
    
    if include_category and item.category:
        result["category_code"] = item.category.category_code
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/categories", response_model=List[dict])
def list_categories(
    org_id: Optional[UUID] = Query(None, description="Filter by org_id (NULL for system-wide)"),
    module_code: Optional[str] = Query(None, description="Filter by module"),
    scope: Optional[str] = Query(None, description="Filter by scope"),
    include_system: bool = Query(True, description="Include system-wide categories"),
    include_items_count: bool = Query(False, description="Include item count"),
    db: Session = Depends(get_db)
):
    """List all master data categories"""
    query = db.query(MasterDataCategory).filter(
        MasterDataCategory.deleted_at.is_(None),
        MasterDataCategory.status == "active"
    )
    
    # Filter by org
    if org_id:
        if include_system:
            query = query.filter(
                or_(
                    MasterDataCategory.org_id == org_id,
                    MasterDataCategory.org_id.is_(None)
                )
            )
        else:
            query = query.filter(MasterDataCategory.org_id == org_id)
    else:
        # Only system-wide
        query = query.filter(MasterDataCategory.org_id.is_(None))
    
    if module_code:
        query = query.filter(MasterDataCategory.module_code == module_code)
    
    if scope:
        query = query.filter(MasterDataCategory.scope == scope)
    
    categories = query.order_by(MasterDataCategory.sort_order, MasterDataCategory.category_name).all()
    
    result = []
    for cat in categories:
        item_count = None
        if include_items_count:
            item_count = db.query(MasterDataItem).filter(
                MasterDataItem.category_id == cat.id,
                MasterDataItem.deleted_at.is_(None),
                MasterDataItem.status == "active"
            ).count()
        result.append(serialize_category(cat, item_count))
    
    return result


@router.get("/categories/{code}", response_model=dict)
def get_category_by_code(
    code: str,
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get category by code"""
    # Try org-specific first, then system
    query = db.query(MasterDataCategory).filter(
        MasterDataCategory.category_code == code,
        MasterDataCategory.deleted_at.is_(None)
    )
    
    if org_id:
        cat = query.filter(MasterDataCategory.org_id == org_id).first()
        if not cat:
            cat = query.filter(MasterDataCategory.org_id.is_(None)).first()
    else:
        cat = query.filter(MasterDataCategory.org_id.is_(None)).first()
    
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category '{code}' not found")
    
    item_count = db.query(MasterDataItem).filter(
        MasterDataItem.category_id == cat.id,
        MasterDataItem.deleted_at.is_(None),
        MasterDataItem.status == "active"
    ).count()
    
    return serialize_category(cat, item_count)


@router.post("/categories", response_model=dict, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category"""
    # Check duplicate
    existing = db.query(MasterDataCategory).filter(
        MasterDataCategory.category_code == data.category_code,
        MasterDataCategory.org_id == data.org_id,
        MasterDataCategory.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{data.category_code}' already exists"
        )
    
    category = MasterDataCategory(
        org_id=data.org_id,
        category_code=data.category_code,
        category_name=data.category_name,
        category_name_en=data.category_name_en,
        description=data.description,
        scope=data.scope,
        module_code=data.module_code,
        is_system=data.is_system,
        is_hierarchical=data.is_hierarchical,
        is_multi_select=data.is_multi_select,
        allow_custom=data.allow_custom,
        sort_order=data.sort_order,
        icon_code=data.icon_code,
        enum_class_name=data.enum_class_name,
        status="active"
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return serialize_category(category)


@router.put("/categories/{id}", response_model=dict)
def update_category(
    id: UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    category = db.query(MasterDataCategory).filter(
        MasterDataCategory.id == id,
        MasterDataCategory.deleted_at.is_(None)
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Cannot modify system categories
    if category.is_system and data.status == "inactive":
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate system category"
        )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    category.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(category)
    
    return serialize_category(category)


@router.delete("/categories/{id}")
def delete_category(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete a category"""
    category = db.query(MasterDataCategory).filter(
        MasterDataCategory.id == id,
        MasterDataCategory.deleted_at.is_(None)
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.is_system:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete system category"
        )
    
    # Soft delete
    category.deleted_at = datetime.now(timezone.utc)
    category.status = "inactive"
    db.commit()
    
    return {"success": True, "message": f"Category '{category.category_code}' deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# ITEM ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/items", response_model=List[dict])
def list_items(
    category_code: Optional[str] = Query(None, description="Filter by category code"),
    category_id: Optional[UUID] = Query(None, description="Filter by category ID"),
    org_id: Optional[UUID] = Query(None, description="Filter by org_id"),
    include_system: bool = Query(True, description="Include system items"),
    parent_id: Optional[UUID] = Query(None, description="Filter by parent (for hierarchical)"),
    search: Optional[str] = Query(None, description="Search in labels"),
    db: Session = Depends(get_db)
):
    """List master data items with filters"""
    query = db.query(MasterDataItem).filter(
        MasterDataItem.deleted_at.is_(None),
        MasterDataItem.status == "active"
    )
    
    # Filter by category
    if category_code:
        cat = db.query(MasterDataCategory).filter(
            MasterDataCategory.category_code == category_code,
            MasterDataCategory.deleted_at.is_(None)
        ).first()
        if cat:
            query = query.filter(MasterDataItem.category_id == cat.id)
    elif category_id:
        query = query.filter(MasterDataItem.category_id == category_id)
    
    # Filter by org
    if org_id:
        if include_system:
            query = query.filter(
                or_(
                    MasterDataItem.org_id == org_id,
                    MasterDataItem.org_id.is_(None)
                )
            )
        else:
            query = query.filter(MasterDataItem.org_id == org_id)
    else:
        query = query.filter(MasterDataItem.org_id.is_(None))
    
    # Filter by parent
    if parent_id:
        query = query.filter(MasterDataItem.parent_item_id == parent_id)
    
    # Search
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                MasterDataItem.item_code.ilike(search_pattern),
                MasterDataItem.item_label.ilike(search_pattern),
                MasterDataItem.item_label_vi.ilike(search_pattern),
                MasterDataItem.item_label_en.ilike(search_pattern)
            )
        )
    
    items = query.order_by(MasterDataItem.sort_order, MasterDataItem.item_label).all()
    
    return [serialize_item(item, include_category=True) for item in items]


@router.get("/items/{id}", response_model=dict)
def get_item(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get item by ID"""
    item = db.query(MasterDataItem).filter(
        MasterDataItem.id == id,
        MasterDataItem.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return serialize_item(item, include_category=True)


@router.get("/items/code/{category_code}/{item_code}", response_model=dict)
def get_item_by_codes(
    category_code: str,
    item_code: str,
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get item by category_code and item_code"""
    # Find category
    cat_query = db.query(MasterDataCategory).filter(
        MasterDataCategory.category_code == category_code,
        MasterDataCategory.deleted_at.is_(None)
    )
    
    if org_id:
        cat = cat_query.filter(MasterDataCategory.org_id == org_id).first()
        if not cat:
            cat = cat_query.filter(MasterDataCategory.org_id.is_(None)).first()
    else:
        cat = cat_query.filter(MasterDataCategory.org_id.is_(None)).first()
    
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category '{category_code}' not found")
    
    # Find item
    item_query = db.query(MasterDataItem).filter(
        MasterDataItem.category_id == cat.id,
        MasterDataItem.item_code == item_code,
        MasterDataItem.deleted_at.is_(None)
    )
    
    if org_id:
        item = item_query.filter(MasterDataItem.org_id == org_id).first()
        if not item:
            item = item_query.filter(MasterDataItem.org_id.is_(None)).first()
    else:
        item = item_query.filter(MasterDataItem.org_id.is_(None)).first()
    
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Item '{item_code}' not found in category '{category_code}'"
        )
    
    return serialize_item(item, include_category=True)


@router.post("/items", response_model=dict, status_code=201)
def create_item(
    data: ItemCreate,
    db: Session = Depends(get_db)
):
    """Create a new item"""
    # Verify category exists
    category = db.query(MasterDataCategory).filter(
        MasterDataCategory.id == data.category_id,
        MasterDataCategory.deleted_at.is_(None)
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category allows custom items
    if not category.allow_custom and data.org_id:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category.category_code}' does not allow custom items"
        )
    
    # Check duplicate
    existing = db.query(MasterDataItem).filter(
        MasterDataItem.category_id == data.category_id,
        MasterDataItem.item_code == data.item_code,
        MasterDataItem.org_id == data.org_id,
        MasterDataItem.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Item '{data.item_code}' already exists in this category"
        )
    
    item = MasterDataItem(
        org_id=data.org_id,
        category_id=data.category_id,
        item_code=data.item_code,
        item_label=data.item_label,
        item_label_vi=data.item_label_vi,
        item_label_en=data.item_label_en,
        description=data.description,
        parent_item_id=data.parent_item_id,
        icon_code=data.icon_code,
        color_code=data.color_code,
        is_default=data.is_default,
        is_system=False,  # User-created items are not system
        sort_order=data.sort_order,
        import_aliases=data.import_aliases,
        status="active"
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return serialize_item(item, include_category=True)


@router.post("/items/by-code", response_model=dict, status_code=201)
def create_item_by_category_code(
    data: ItemCreateByCode,
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Create a new item using category_code instead of category_id"""
    # Find category
    category = db.query(MasterDataCategory).filter(
        MasterDataCategory.category_code == data.category_code,
        MasterDataCategory.deleted_at.is_(None)
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=404,
            detail=f"Category '{data.category_code}' not found"
        )
    
    # Reuse create_item logic
    create_data = ItemCreate(
        category_id=category.id,
        org_id=org_id,
        item_code=data.item_code,
        item_label=data.item_label,
        item_label_vi=data.item_label_vi,
        item_label_en=data.item_label_en,
        description=data.description,
        parent_item_id=data.parent_item_id,
        icon_code=data.icon_code,
        color_code=data.color_code,
        is_default=data.is_default,
        sort_order=data.sort_order,
        import_aliases=data.import_aliases
    )
    
    return create_item(create_data, db)


@router.put("/items/{id}", response_model=dict)
def update_item(
    id: UUID,
    data: ItemUpdate,
    db: Session = Depends(get_db)
):
    """Update an item"""
    item = db.query(MasterDataItem).filter(
        MasterDataItem.id == id,
        MasterDataItem.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Cannot modify system items' core fields
    if item.is_system:
        protected_fields = ["item_code", "status"]
        update_data = data.model_dump(exclude_unset=True)
        for field in protected_fields:
            if field in update_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot modify '{field}' of system item"
                )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    
    return serialize_item(item, include_category=True)


@router.delete("/items/{id}")
def delete_item(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete an item"""
    item = db.query(MasterDataItem).filter(
        MasterDataItem.id == id,
        MasterDataItem.deleted_at.is_(None)
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.is_system:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete system item"
        )
    
    # Soft delete
    item.deleted_at = datetime.now(timezone.utc)
    item.status = "inactive"
    db.commit()
    
    return {"success": True, "message": f"Item '{item.item_code}' deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# LOOKUP ENDPOINTS (Optimized for Frontend Dropdowns)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/lookup/{category_code}", response_model=List[LookupItemResponse])
def lookup_items(
    category_code: str,
    org_id: Optional[UUID] = Query(None),
    include_system: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Quick lookup for frontend dropdowns.
    Returns simplified item list for a category.
    """
    # Find category
    cat = db.query(MasterDataCategory).filter(
        MasterDataCategory.category_code == category_code,
        MasterDataCategory.deleted_at.is_(None)
    ).first()
    
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category '{category_code}' not found")
    
    # Get items
    query = db.query(MasterDataItem).filter(
        MasterDataItem.category_id == cat.id,
        MasterDataItem.deleted_at.is_(None),
        MasterDataItem.status == "active"
    )
    
    if org_id:
        if include_system:
            query = query.filter(
                or_(
                    MasterDataItem.org_id == org_id,
                    MasterDataItem.org_id.is_(None)
                )
            )
        else:
            query = query.filter(MasterDataItem.org_id == org_id)
    else:
        query = query.filter(MasterDataItem.org_id.is_(None))
    
    items = query.order_by(MasterDataItem.sort_order, MasterDataItem.item_label).all()
    
    return [
        LookupItemResponse(
            code=item.item_code,
            label=item.item_label,
            label_vi=item.item_label_vi,
            color=item.color_code,
            icon=item.icon_code,
            is_default=item.is_default
        )
        for item in items
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN/SEED ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/seed", response_model=SeedResponse)
def seed_master_data(
    force: bool = Query(False, description="Force re-seed (skip existing check)"),
    db: Session = Depends(get_db)
):
    """
    Seed system master data from enums.
    Should only be called once during initial setup.
    """
    from ..scripts.seed_master_data import seed_all, get_seed_stats
    
    # Check if already seeded
    if not force:
        existing = db.query(MasterDataCategory).filter(
            MasterDataCategory.org_id.is_(None)
        ).count()
        
        if existing > 0:
            stats = get_seed_stats(db)
            return SeedResponse(
                success=True,
                message="Master data already seeded. Use force=true to re-seed.",
                categories_count=stats["categories"],
                items_count=stats["items"]
            )
    
    try:
        seed_all(db)
        stats = get_seed_stats(db)
        
        return SeedResponse(
            success=True,
            message="Master data seeded successfully",
            categories_count=stats["categories"],
            items_count=stats["items"]
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")


@router.get("/stats")
def get_master_data_stats(
    db: Session = Depends(get_db)
):
    """Get master data statistics"""
    from ..scripts.seed_master_data import get_seed_stats
    return get_seed_stats(db)
