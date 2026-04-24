"""
ProHouzing Product & Inventory API Router
Prompt 5/20 - Project/Product/Inventory Domain Standardization

API endpoints for:
- Project management
- Block/Tower/Floor management
- Product CRUD
- Inventory status management
- Price management
- Hold/Lock operations
- Search/Filter
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from config.inventory_config import (
    ProductType, ProductStatus, InventoryStatus, ProjectStatus,
    INVENTORY_STATUS_CONFIG, PRODUCT_TYPE_CONFIG, PROJECT_STATUS_CONFIG,
    get_inventory_status_config, can_transition_status,
    get_sellable_statuses, get_bookable_statuses, get_holdable_statuses,
    DIRECTION_OPTIONS, VIEW_OPTIONS, DEFAULT_SAVED_VIEWS
)
from models.product_models import (
    ProjectMasterCreate, ProjectMasterResponse,
    ProjectBlockCreate, ProjectBlockResponse,
    ProjectFloorCreate, ProjectFloorResponse,
    ProductCreate, ProductResponse,
    ProductPriceCreate, ProductPriceResponse,
    StatusChangeCreate, StatusHistoryEntry,
    HoldRequest, HoldResponse, ReleaseHoldRequest,
    ProductSearchRequest, ProductSearchResponse,
    BulkStatusUpdateRequest, BulkPriceUpdateRequest,
    InventorySummary, PriceHistoryEntry
)

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

# Database will be injected from server.py
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    """Set the database instance"""
    global db
    db = database

# ============================================
# CONFIG ENDPOINTS
# ============================================

@router.get("/config/statuses")
async def get_inventory_statuses():
    """Get all inventory status configurations"""
    return {
        "statuses": [
            {"code": code, **config}
            for code, config in INVENTORY_STATUS_CONFIG.items()
        ]
    }

@router.get("/config/product-types")
async def get_product_types():
    """Get all product type configurations"""
    return {
        "types": [
            {"code": code, **config}
            for code, config in PRODUCT_TYPE_CONFIG.items()
        ]
    }

@router.get("/config/project-statuses")
async def get_project_statuses():
    """Get all project status configurations"""
    return {
        "statuses": [
            {"code": code, **config}
            for code, config in PROJECT_STATUS_CONFIG.items()
        ]
    }

@router.get("/config/directions")
async def get_directions():
    """Get direction options"""
    return {"directions": DIRECTION_OPTIONS}

@router.get("/config/views")
async def get_views():
    """Get view options"""
    return {"views": VIEW_OPTIONS}

@router.get("/config/saved-views")
async def get_saved_views():
    """Get default saved views for products"""
    return {"views": DEFAULT_SAVED_VIEWS}

# ============================================
# PROJECT ENDPOINTS
# ============================================

@router.get("/projects", response_model=List[ProjectMasterResponse])
async def get_projects(
    status: Optional[str] = None,
    city: Optional[str] = None,
    branch_id: Optional[str] = None,
    search: Optional[str] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    """Get all projects with filters"""
    query: Dict[str, Any] = {"is_active": is_active}
    
    if status:
        query["status"] = status
    if city:
        query["city"] = city
    if branch_id:
        query["branch_id"] = branch_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}},
            {"developer_name": {"$regex": search, "$options": "i"}}
        ]
    
    projects = await db.projects_master.find(query, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for p in projects:
        # Compute stats
        total_units = await db.products.count_documents({"project_id": p["id"]})
        available_units = await db.products.count_documents({
            "project_id": p["id"],
            "inventory_status": InventoryStatus.AVAILABLE.value
        })
        sold_units = await db.products.count_documents({
            "project_id": p["id"],
            "inventory_status": InventoryStatus.SOLD.value
        })
        
        # Price range
        price_agg = await db.products.aggregate([
            {"$match": {"project_id": p["id"]}},
            {"$group": {
                "_id": None,
                "min_price": {"$min": "$final_price"},
                "max_price": {"$max": "$final_price"}
            }}
        ]).to_list(1)
        
        price_from = price_agg[0]["min_price"] if price_agg else 0
        price_to = price_agg[0]["max_price"] if price_agg else 0
        
        result.append(ProjectMasterResponse(
            **p,
            total_units=total_units,
            available_units=available_units,
            sold_units=sold_units,
            price_from=price_from or 0,
            price_to=price_to or 0
        ))
    
    return result

@router.post("/projects", response_model=ProjectMasterResponse)
async def create_project(data: ProjectMasterCreate, current_user: dict = None):
    """Create a new project"""
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Check code uniqueness
    existing = await db.projects_master.find_one({"code": data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")
    
    project_doc = {
        "id": project_id,
        **data.model_dump(),
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now
    }
    
    await db.projects_master.insert_one(project_doc)
    project_doc.pop("_id", None)
    
    return ProjectMasterResponse(**project_doc)

@router.get("/projects/{project_id}", response_model=ProjectMasterResponse)
async def get_project(project_id: str):
    """Get project by ID"""
    project = await db.projects_master.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Compute stats
    total_units = await db.products.count_documents({"project_id": project_id})
    available_units = await db.products.count_documents({
        "project_id": project_id,
        "inventory_status": InventoryStatus.AVAILABLE.value
    })
    sold_units = await db.products.count_documents({
        "project_id": project_id,
        "inventory_status": InventoryStatus.SOLD.value
    })
    total_blocks = await db.project_blocks.count_documents({"project_id": project_id})
    
    return ProjectMasterResponse(
        **project,
        total_units=total_units,
        available_units=available_units,
        sold_units=sold_units,
        total_blocks=total_blocks
    )

# ============================================
# BLOCK/TOWER ENDPOINTS
# ============================================

@router.get("/projects/{project_id}/blocks", response_model=List[ProjectBlockResponse])
async def get_project_blocks(project_id: str):
    """Get all blocks for a project"""
    blocks = await db.project_blocks.find(
        {"project_id": project_id, "is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    result = []
    for b in blocks:
        total_units = await db.products.count_documents({"block_id": b["id"]})
        available_units = await db.products.count_documents({
            "block_id": b["id"],
            "inventory_status": InventoryStatus.AVAILABLE.value
        })
        result.append(ProjectBlockResponse(
            **b,
            total_units=total_units,
            available_units=available_units
        ))
    
    return result

@router.post("/projects/{project_id}/blocks", response_model=ProjectBlockResponse)
async def create_block(project_id: str, data: ProjectBlockCreate, current_user: dict = None):
    """Create a new block"""
    block_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    block_doc = {
        "id": block_id,
        "project_id": project_id,
        **data.model_dump(exclude={"project_id"}),
        "created_at": now,
        "updated_at": now
    }
    
    await db.project_blocks.insert_one(block_doc)
    block_doc.pop("_id", None)
    
    return ProjectBlockResponse(**block_doc)

# ============================================
# FLOOR ENDPOINTS
# ============================================

@router.get("/blocks/{block_id}/floors", response_model=List[ProjectFloorResponse])
async def get_block_floors(block_id: str):
    """Get all floors for a block"""
    floors = await db.project_floors.find(
        {"block_id": block_id, "is_active": True},
        {"_id": 0}
    ).sort("floor_number", 1).to_list(100)
    
    result = []
    for f in floors:
        available_units = await db.products.count_documents({
            "floor_id": f["id"],
            "inventory_status": InventoryStatus.AVAILABLE.value
        })
        
        block = await db.project_blocks.find_one({"id": block_id}, {"_id": 0, "name": 1})
        
        result.append(ProjectFloorResponse(
            **f,
            available_units=available_units,
            block_name=block.get("name") if block else None
        ))
    
    return result

@router.post("/blocks/{block_id}/floors", response_model=ProjectFloorResponse)
async def create_floor(block_id: str, data: ProjectFloorCreate, current_user: dict = None):
    """Create a new floor"""
    floor_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    floor_doc = {
        "id": floor_id,
        "block_id": block_id,
        **data.model_dump(exclude={"block_id"}),
        "created_at": now
    }
    
    await db.project_floors.insert_one(floor_doc)
    floor_doc.pop("_id", None)
    
    return ProjectFloorResponse(**floor_doc)

# ============================================
# PRODUCT ENDPOINTS
# ============================================

@router.get("/products", response_model=ProductSearchResponse)
async def search_products(
    search: Optional[str] = None,
    project_id: Optional[str] = None,
    block_id: Optional[str] = None,
    floor_number: Optional[int] = None,
    product_types: Optional[str] = None,  # comma-separated
    inventory_statuses: Optional[str] = None,  # comma-separated
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    area_min: Optional[float] = None,
    area_max: Optional[float] = None,
    bedrooms: Optional[str] = None,  # comma-separated
    directions: Optional[str] = None,
    available_only: bool = False,
    assigned_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    sort_by: str = "code",
    sort_order: str = "asc",
    current_user: dict = None
):
    """Search and filter products"""
    query: Dict[str, Any] = {}
    
    # Text search
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"internal_code": {"$regex": search, "$options": "i"}}
        ]
    
    # Filters
    if project_id:
        query["project_id"] = project_id
    if block_id:
        query["block_id"] = block_id
    if floor_number is not None:
        query["floor_number"] = floor_number
    
    if product_types:
        query["product_type"] = {"$in": product_types.split(",")}
    
    if inventory_statuses:
        query["inventory_status"] = {"$in": inventory_statuses.split(",")}
    elif available_only:
        query["inventory_status"] = InventoryStatus.AVAILABLE.value
    
    if price_min is not None:
        query["final_price"] = {"$gte": price_min}
    if price_max is not None:
        query.setdefault("final_price", {})["$lte"] = price_max
    
    if area_min is not None:
        query["area"] = {"$gte": area_min}
    if area_max is not None:
        query.setdefault("area", {})["$lte"] = area_max
    
    if bedrooms:
        query["bedrooms"] = {"$in": [int(b) for b in bedrooms.split(",")]}
    
    if directions:
        query["direction"] = {"$in": directions.split(",")}
    
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    # Count total
    total = await db.products.count_documents(query)
    
    # Sort
    sort_dir = 1 if sort_order == "asc" else -1
    
    # Get products
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with names
    result_items = []
    for p in products:
        # Get project name
        project = await db.projects_master.find_one({"id": p.get("project_id")}, {"_id": 0, "name": 1})
        p["project_name"] = project.get("name") if project else None
        
        # Get block name
        if p.get("block_id"):
            block = await db.project_blocks.find_one({"id": p["block_id"]}, {"_id": 0, "name": 1})
            p["block_name"] = block.get("name") if block else None
        
        # Get status config
        status_config = get_inventory_status_config(p.get("inventory_status", ""))
        p["status_label"] = status_config.get("name", "")
        p["status_color"] = status_config.get("color", "")
        
        # Get hold info
        if p.get("hold_by"):
            holder = await db.users.find_one({"id": p["hold_by"]}, {"_id": 0, "full_name": 1})
            p["hold_by_name"] = holder.get("full_name") if holder else None
        
        result_items.append(ProductResponse(**p))
    
    # Aggregations
    by_status = await db.products.aggregate([
        {"$match": query if not inventory_statuses else {k: v for k, v in query.items() if k != "inventory_status"}},
        {"$group": {"_id": "$inventory_status", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    by_type = await db.products.aggregate([
        {"$match": query if not product_types else {k: v for k, v in query.items() if k != "product_type"}},
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    return ProductSearchResponse(
        total=total,
        items=result_items,
        by_status={s["_id"]: s["count"] for s in by_status if s["_id"]},
        by_type={t["_id"]: t["count"] for t in by_type if t["_id"]}
    )

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Enrich
    project = await db.projects_master.find_one({"id": product.get("project_id")}, {"_id": 0, "name": 1})
    product["project_name"] = project.get("name") if project else None
    
    if product.get("block_id"):
        block = await db.project_blocks.find_one({"id": product["block_id"]}, {"_id": 0, "name": 1})
        product["block_name"] = block.get("name") if block else None
    
    status_config = get_inventory_status_config(product.get("inventory_status", ""))
    product["status_label"] = status_config.get("name", "")
    product["status_color"] = status_config.get("color", "")
    
    return ProductResponse(**product)

@router.post("/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, current_user: dict = None):
    """Create a new product"""
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Check code uniqueness within project
    existing = await db.products.find_one({
        "project_id": data.project_id,
        "code": data.code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Product code already exists in this project")
    
    # Calculate prices
    listed_price = data.base_price
    final_price = data.base_price
    
    product_doc = {
        "id": product_id,
        **data.model_dump(),
        "listed_price": listed_price,
        "discount_percent": 0,
        "discount_amount": 0,
        "final_price": final_price,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now
    }
    
    await db.products.insert_one(product_doc)
    product_doc.pop("_id", None)
    
    # Record status history
    await db.product_status_history.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "old_status": None,
        "new_status": data.inventory_status.value,
        "reason": "Product created",
        "source": "system",
        "changed_at": now,
        "changed_by": current_user["id"] if current_user else None
    })
    
    return ProductResponse(**product_doc)

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, updates: Dict[str, Any], current_user: dict = None):
    """Update product details"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Exclude status changes (use dedicated endpoint)
    updates.pop("inventory_status", None)
    updates.pop("product_status", None)
    
    updates["updated_at"] = now
    updates["updated_by"] = current_user["id"] if current_user else None
    
    # Check price changes for history
    if "base_price" in updates or "listed_price" in updates or "final_price" in updates:
        old_price = product.get("final_price", 0)
        new_price = updates.get("final_price", updates.get("listed_price", updates.get("base_price", old_price)))
        
        if old_price != new_price:
            await db.product_price_history.insert_one({
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "old_price": old_price,
                "new_price": new_price,
                "price_type": "final_price",
                "change_percent": ((new_price - old_price) / old_price * 100) if old_price > 0 else 0,
                "change_amount": new_price - old_price,
                "reason": updates.get("price_change_reason", "Manual update"),
                "source": "manual",
                "changed_at": now,
                "changed_by": current_user["id"] if current_user else None
            })
    
    await db.products.update_one({"id": product_id}, {"$set": updates})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return ProductResponse(**updated)

# ============================================
# STATUS MANAGEMENT
# ============================================

@router.post("/products/{product_id}/status")
async def change_product_status(product_id: str, data: StatusChangeCreate, current_user: dict = None):
    """Change product inventory status"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    old_status = product.get("inventory_status")
    new_status = data.new_status.value
    
    # Check transition is allowed
    if old_status and not can_transition_status(old_status, new_status):
        raise HTTPException(
            status_code=400,
            detail=f"Status transition from {old_status} to {new_status} is not allowed"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "inventory_status": new_status,
        "updated_at": now,
        "updated_by": current_user["id"] if current_user else None
    }
    
    # Handle hold status
    if new_status == InventoryStatus.HOLD.value:
        hold_hours = data.hold_hours or 24
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=hold_hours)).isoformat()
        update_data.update({
            "hold_by": current_user["id"] if current_user else None,
            "hold_started_at": now,
            "hold_expires_at": expires_at,
            "hold_reason": data.reason
        })
    elif old_status == InventoryStatus.HOLD.value:
        # Clear hold fields when leaving hold status
        update_data.update({
            "hold_by": None,
            "hold_started_at": None,
            "hold_expires_at": None,
            "hold_reason": None
        })
    
    # Link booking/deal if provided
    if data.booking_id:
        update_data["current_booking_id"] = data.booking_id
    if data.deal_id:
        update_data["current_deal_id"] = data.deal_id
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    # Record history
    await db.product_status_history.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "old_status": old_status,
        "new_status": new_status,
        "reason": data.reason,
        "source": "manual",
        "booking_id": data.booking_id,
        "deal_id": data.deal_id,
        "customer_id": data.customer_id,
        "changed_at": now,
        "changed_by": current_user["id"] if current_user else None
    })
    
    return {"success": True, "old_status": old_status, "new_status": new_status}

@router.get("/products/{product_id}/status-history")
async def get_status_history(product_id: str, limit: int = 50):
    """Get status change history for a product"""
    history = await db.product_status_history.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("changed_at", -1).limit(limit).to_list(limit)
    
    # Enrich with user names
    for h in history:
        if h.get("changed_by"):
            user = await db.users.find_one({"id": h["changed_by"]}, {"_id": 0, "full_name": 1})
            h["changed_by_name"] = user.get("full_name") if user else None
    
    return {"history": history}

# ============================================
# HOLD OPERATIONS
# ============================================

@router.post("/products/{product_id}/hold", response_model=HoldResponse)
async def hold_product(product_id: str, data: HoldRequest, current_user: dict = None):
    """Hold a product temporarily"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    current_status = product.get("inventory_status")
    
    # Check if product can be held
    if current_status not in get_holdable_statuses():
        raise HTTPException(
            status_code=400,
            detail=f"Product with status '{current_status}' cannot be held"
        )
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=data.hold_hours)
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "inventory_status": InventoryStatus.HOLD.value,
            "hold_by": current_user["id"] if current_user else None,
            "hold_started_at": now.isoformat(),
            "hold_expires_at": expires_at.isoformat(),
            "hold_reason": data.reason,
            "hold_customer_id": data.customer_id,
            "hold_customer_name": data.customer_name,
            "hold_customer_phone": data.customer_phone,
            "updated_at": now.isoformat()
        }}
    )
    
    # Record history
    await db.product_status_history.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "old_status": current_status,
        "new_status": InventoryStatus.HOLD.value,
        "reason": data.reason or "Hold requested",
        "source": "manual",
        "customer_id": data.customer_id,
        "changed_at": now.isoformat(),
        "changed_by": current_user["id"] if current_user else None
    })
    
    return HoldResponse(
        success=True,
        product_id=product_id,
        hold_by=current_user["id"] if current_user else "system",
        hold_started_at=now.isoformat(),
        hold_expires_at=expires_at.isoformat(),
        message=f"Product held for {data.hold_hours} hours"
    )

@router.post("/products/{product_id}/release-hold")
async def release_hold(product_id: str, data: ReleaseHoldRequest, current_user: dict = None):
    """Release a product hold"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.get("inventory_status") != InventoryStatus.HOLD.value:
        raise HTTPException(status_code=400, detail="Product is not on hold")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "inventory_status": InventoryStatus.AVAILABLE.value,
            "hold_by": None,
            "hold_started_at": None,
            "hold_expires_at": None,
            "hold_reason": None,
            "hold_customer_id": None,
            "hold_customer_name": None,
            "hold_customer_phone": None,
            "updated_at": now
        }}
    )
    
    # Record history
    await db.product_status_history.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "old_status": InventoryStatus.HOLD.value,
        "new_status": InventoryStatus.AVAILABLE.value,
        "reason": data.reason or "Hold released",
        "source": "manual",
        "changed_at": now,
        "changed_by": current_user["id"] if current_user else None
    })
    
    return {"success": True, "message": "Hold released"}

# ============================================
# PRICE HISTORY
# ============================================

@router.get("/products/{product_id}/price-history")
async def get_price_history(product_id: str, limit: int = 50):
    """Get price change history for a product"""
    history = await db.product_price_history.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("changed_at", -1).limit(limit).to_list(limit)
    
    return {"history": history}

# ============================================
# INVENTORY SUMMARY
# ============================================

@router.get("/projects/{project_id}/summary", response_model=InventorySummary)
async def get_project_inventory_summary(project_id: str):
    """Get inventory summary for a project"""
    total_units = await db.products.count_documents({"project_id": project_id})
    
    # By status
    status_agg = await db.products.aggregate([
        {"$match": {"project_id": project_id}},
        {"$group": {"_id": "$inventory_status", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    # By type
    type_agg = await db.products.aggregate([
        {"$match": {"project_id": project_id}},
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    # By bedrooms
    bedroom_agg = await db.products.aggregate([
        {"$match": {"project_id": project_id}},
        {"$group": {"_id": "$bedrooms", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    # Values
    value_agg = await db.products.aggregate([
        {"$match": {"project_id": project_id}},
        {"$group": {
            "_id": None,
            "total_value": {"$sum": "$final_price"},
            "avg_price": {"$avg": "$final_price"},
            "avg_price_per_sqm": {"$avg": "$price_per_sqm"}
        }}
    ]).to_list(1)
    
    available_value_agg = await db.products.aggregate([
        {"$match": {"project_id": project_id, "inventory_status": InventoryStatus.AVAILABLE.value}},
        {"$group": {"_id": None, "value": {"$sum": "$final_price"}}}
    ]).to_list(1)
    
    sold_value_agg = await db.products.aggregate([
        {"$match": {"project_id": project_id, "inventory_status": InventoryStatus.SOLD.value}},
        {"$group": {"_id": None, "value": {"$sum": "$final_price"}}}
    ]).to_list(1)
    
    by_status = {s["_id"]: s["count"] for s in status_agg if s["_id"]}
    
    return InventorySummary(
        total_units=total_units,
        by_status=by_status,
        by_type={t["_id"]: t["count"] for t in type_agg if t["_id"]},
        by_bedrooms={str(b["_id"]): b["count"] for b in bedroom_agg if b["_id"] is not None},
        available_count=by_status.get(InventoryStatus.AVAILABLE.value, 0),
        sold_count=by_status.get(InventoryStatus.SOLD.value, 0),
        hold_count=by_status.get(InventoryStatus.HOLD.value, 0),
        total_value=value_agg[0]["total_value"] if value_agg else 0,
        available_value=available_value_agg[0]["value"] if available_value_agg else 0,
        sold_value=sold_value_agg[0]["value"] if sold_value_agg else 0,
        avg_price=value_agg[0]["avg_price"] if value_agg else 0,
        avg_price_per_sqm=value_agg[0]["avg_price_per_sqm"] if value_agg else 0
    )

# ============================================
# BULK OPERATIONS
# ============================================

@router.post("/products/bulk/status")
async def bulk_update_status(data: BulkStatusUpdateRequest, current_user: dict = None):
    """Update status for multiple products"""
    now = datetime.now(timezone.utc).isoformat()
    
    updated_count = 0
    errors = []
    
    for product_id in data.product_ids:
        try:
            product = await db.products.find_one({"id": product_id}, {"_id": 0})
            if not product:
                errors.append({"product_id": product_id, "error": "Not found"})
                continue
            
            old_status = product.get("inventory_status")
            new_status = data.new_status.value
            
            if old_status and not can_transition_status(old_status, new_status):
                errors.append({"product_id": product_id, "error": f"Invalid transition from {old_status}"})
                continue
            
            await db.products.update_one(
                {"id": product_id},
                {"$set": {"inventory_status": new_status, "updated_at": now}}
            )
            
            await db.product_status_history.insert_one({
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "old_status": old_status,
                "new_status": new_status,
                "reason": data.reason or "Bulk update",
                "source": "bulk",
                "changed_at": now,
                "changed_by": current_user["id"] if current_user else None
            })
            
            updated_count += 1
            
        except Exception as e:
            errors.append({"product_id": product_id, "error": str(e)})
    
    return {
        "success": True,
        "updated_count": updated_count,
        "total_requested": len(data.product_ids),
        "errors": errors
    }
