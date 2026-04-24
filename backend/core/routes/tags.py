"""
ProHouzing Tag System API Routes
Version: 1.1.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 2

IMPORTANT: Route order matters in FastAPI!
Static routes (lookup, stats, seed, assign, etc.) MUST come BEFORE parameterized routes ({id})

Endpoints:
- GET /api/v2/tags - List all tags
- GET /api/v2/tags/lookup - Quick lookup for dropdowns
- GET /api/v2/tags/stats - Tag statistics
- GET /api/v2/tags/code/{code} - Get tag by code
- GET /api/v2/tags/entity/{entity_type}/{entity_id} - Get tags for entity
- GET /api/v2/tags/filter/{entity_type} - Filter entities by tag

- POST /api/v2/tags - Create tag
- POST /api/v2/tags/seed - Seed system tags
- POST /api/v2/tags/assign - Assign tag to entity
- POST /api/v2/tags/assign-bulk - Assign multiple tags
- POST /api/v2/tags/unassign - Remove tag from entity

- GET /api/v2/tags/{id} - Get tag by ID (MUST be after static routes)
- PUT /api/v2/tags/{id} - Update tag
- DELETE /api/v2/tags/{id} - Soft delete tag
"""

from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from pydantic import BaseModel, Field

from ..database import get_db
from ..models.tags import Tag, EntityTag, SYSTEM_TAGS


router = APIRouter(prefix="/tags", tags=["Tags"])


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class TagBase(BaseModel):
    tag_code: str = Field(..., max_length=50)
    tag_name: str = Field(..., max_length=100)
    tag_name_vi: Optional[str] = None
    description: Optional[str] = None
    color_code: Optional[str] = "#6B7280"
    icon_code: Optional[str] = None
    category: Optional[str] = None
    sort_order: int = 0


class TagCreate(TagBase):
    org_id: Optional[UUID] = None


class TagUpdate(BaseModel):
    tag_name: Optional[str] = None
    tag_name_vi: Optional[str] = None
    description: Optional[str] = None
    color_code: Optional[str] = None
    icon_code: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[str] = None


class TagAssignRequest(BaseModel):
    tag_id: Optional[UUID] = None
    tag_code: Optional[str] = None
    entity_type: str = Field(..., description="lead, customer, deal, product, task, etc.")
    entity_id: UUID


class TagUnassignRequest(BaseModel):
    tag_id: Optional[UUID] = None
    tag_code: Optional[str] = None
    entity_type: str
    entity_id: UUID


class TagAssignBulkRequest(BaseModel):
    tag_ids: Optional[List[UUID]] = None
    tag_codes: Optional[List[str]] = None
    entity_type: str
    entity_id: UUID


class TagLookupResponse(BaseModel):
    id: UUID
    code: str
    name: str
    name_vi: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    usage_count: int = 0


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def serialize_tag(tag: Tag) -> dict:
    """Convert tag to response dict"""
    return {
        "id": str(tag.id),
        "org_id": str(tag.org_id) if tag.org_id else None,
        "tag_code": tag.tag_code,
        "tag_name": tag.tag_name,
        "tag_name_vi": tag.tag_name_vi,
        "description": tag.description,
        "color_code": tag.color_code,
        "icon_code": tag.icon_code,
        "category": tag.category,
        "is_system": tag.is_system,
        "is_auto": tag.is_auto,
        "usage_count": tag.usage_count or 0,
        "sort_order": tag.sort_order,
        "status": tag.status,
        "created_at": tag.created_at.isoformat() if tag.created_at else None,
        "updated_at": tag.updated_at.isoformat() if tag.updated_at else None,
    }


def serialize_entity_tag(et: EntityTag, tag: Tag) -> dict:
    """Convert entity_tag with tag info"""
    return {
        "id": str(et.id),
        "tag_id": str(et.tag_id),
        "tag_code": tag.tag_code,
        "tag_name": tag.tag_name,
        "tag_name_vi": tag.tag_name_vi,
        "color_code": tag.color_code,
        "icon_code": tag.icon_code,
        "entity_type": et.entity_type,
        "entity_id": str(et.entity_id),
        "created_at": et.created_at.isoformat() if et.created_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# STATIC GET ROUTES (MUST BE FIRST!)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=List[dict])
def list_tags(
    org_id: Optional[UUID] = Query(None, description="Filter by org_id"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name/code"),
    include_system: bool = Query(True, description="Include system-wide tags"),
    db: Session = Depends(get_db)
):
    """List all tags with filters"""
    query = db.query(Tag).filter(
        Tag.deleted_at.is_(None),
        Tag.status == "active"
    )
    
    if org_id:
        if include_system:
            query = query.filter(or_(Tag.org_id == org_id, Tag.org_id.is_(None)))
        else:
            query = query.filter(Tag.org_id == org_id)
    else:
        query = query.filter(Tag.org_id.is_(None))
    
    if category:
        query = query.filter(Tag.category == category)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Tag.tag_code.ilike(search_pattern),
                Tag.tag_name.ilike(search_pattern),
                Tag.tag_name_vi.ilike(search_pattern)
            )
        )
    
    tags = query.order_by(Tag.category, Tag.sort_order, Tag.tag_name).all()
    return [serialize_tag(tag) for tag in tags]


@router.get("/lookup", response_model=List[TagLookupResponse])
def lookup_tags(
    org_id: Optional[UUID] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Quick tag lookup for dropdowns"""
    query = db.query(Tag).filter(
        Tag.deleted_at.is_(None),
        Tag.status == "active"
    )
    
    if org_id:
        query = query.filter(or_(Tag.org_id == org_id, Tag.org_id.is_(None)))
    else:
        query = query.filter(Tag.org_id.is_(None))
    
    if category:
        query = query.filter(Tag.category == category)
    
    tags = query.order_by(Tag.category, Tag.sort_order).all()
    
    return [
        TagLookupResponse(
            id=tag.id,
            code=tag.tag_code,
            name=tag.tag_name,
            name_vi=tag.tag_name_vi,
            color=tag.color_code,
            icon=tag.icon_code,
            category=tag.category,
            usage_count=tag.usage_count or 0
        )
        for tag in tags
    ]


@router.get("/stats")
def get_tag_stats(
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get tag statistics"""
    query = db.query(Tag).filter(Tag.deleted_at.is_(None))
    
    if org_id:
        query = query.filter(or_(Tag.org_id == org_id, Tag.org_id.is_(None)))
    
    total_tags = query.count()
    system_tags = query.filter(Tag.is_system == True).count()
    custom_tags = query.filter(Tag.is_system == False).count()
    
    categories = db.query(
        Tag.category,
        func.count(Tag.id)
    ).filter(Tag.deleted_at.is_(None)).group_by(Tag.category).all()
    
    top_tags = db.query(Tag).filter(
        Tag.deleted_at.is_(None),
        Tag.usage_count > 0
    ).order_by(Tag.usage_count.desc()).limit(10).all()
    
    entity_dist = db.query(
        EntityTag.entity_type,
        func.count(EntityTag.id)
    ).group_by(EntityTag.entity_type).all()
    
    return {
        "total_tags": total_tags,
        "system_tags": system_tags,
        "custom_tags": custom_tags,
        "by_category": {cat or "uncategorized": count for cat, count in categories},
        "top_used": [{"code": t.tag_code, "name": t.tag_name, "usage": t.usage_count} for t in top_tags],
        "entity_distribution": {etype: count for etype, count in entity_dist}
    }


@router.get("/code/{code}", response_model=dict)
def get_tag_by_code(
    code: str,
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get tag by code"""
    query = db.query(Tag).filter(Tag.tag_code == code, Tag.deleted_at.is_(None))
    
    if org_id:
        tag = query.filter(Tag.org_id == org_id).first()
        if not tag:
            tag = query.filter(Tag.org_id.is_(None)).first()
    else:
        tag = query.filter(Tag.org_id.is_(None)).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail=f"Tag '{code}' not found")
    
    return serialize_tag(tag)


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[dict])
def get_entity_tags(
    entity_type: str,
    entity_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all tags for an entity"""
    entity_tags = db.query(EntityTag).join(Tag).filter(
        EntityTag.entity_type == entity_type,
        EntityTag.entity_id == entity_id,
        Tag.deleted_at.is_(None),
        Tag.status == "active"
    ).all()
    
    result = []
    for et in entity_tags:
        tag = db.query(Tag).filter(Tag.id == et.tag_id).first()
        if tag:
            result.append(serialize_entity_tag(et, tag))
    
    return result


@router.get("/filter/{entity_type}", response_model=List[str])
def filter_entities_by_tag(
    entity_type: str,
    tag_id: Optional[UUID] = Query(None),
    tag_code: Optional[str] = Query(None),
    tag_ids: Optional[str] = Query(None, description="Comma-separated tag IDs"),
    tag_codes: Optional[str] = Query(None, description="Comma-separated tag codes"),
    match_all: bool = Query(False, description="Match ALL tags (AND) vs ANY tag (OR)"),
    db: Session = Depends(get_db)
):
    """Get entity IDs that have specific tags"""
    all_tag_ids = []
    
    if tag_id:
        all_tag_ids.append(tag_id)
    
    if tag_code:
        tag = db.query(Tag).filter(Tag.tag_code == tag_code).first()
        if tag:
            all_tag_ids.append(tag.id)
    
    if tag_ids:
        for tid in tag_ids.split(","):
            try:
                all_tag_ids.append(UUID(tid.strip()))
            except ValueError:
                pass
    
    if tag_codes:
        for code in tag_codes.split(","):
            tag = db.query(Tag).filter(Tag.tag_code == code.strip()).first()
            if tag:
                all_tag_ids.append(tag.id)
    
    if not all_tag_ids:
        raise HTTPException(status_code=400, detail="Must provide at least one tag_id or tag_code")
    
    if match_all and len(all_tag_ids) > 1:
        subquery = db.query(
            EntityTag.entity_id,
            func.count(EntityTag.tag_id).label("tag_count")
        ).filter(
            EntityTag.entity_type == entity_type,
            EntityTag.tag_id.in_(all_tag_ids)
        ).group_by(EntityTag.entity_id).subquery()
        
        entity_ids = db.query(subquery.c.entity_id).filter(
            subquery.c.tag_count == len(all_tag_ids)
        ).all()
    else:
        entity_ids = db.query(EntityTag.entity_id).filter(
            EntityTag.entity_type == entity_type,
            EntityTag.tag_id.in_(all_tag_ids)
        ).distinct().all()
    
    return [str(eid[0]) for eid in entity_ids]


# ═══════════════════════════════════════════════════════════════════════════════
# POST ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=dict, status_code=201)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db)
):
    """Create a new tag"""
    existing = db.query(Tag).filter(
        Tag.tag_code == data.tag_code,
        Tag.org_id == data.org_id,
        Tag.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Tag '{data.tag_code}' already exists")
    
    tag = Tag(
        org_id=data.org_id,
        tag_code=data.tag_code,
        tag_name=data.tag_name,
        tag_name_vi=data.tag_name_vi,
        description=data.description,
        color_code=data.color_code or "#6B7280",
        icon_code=data.icon_code,
        category=data.category,
        is_system=False,
        usage_count=0,
        sort_order=data.sort_order,
        status="active"
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return serialize_tag(tag)


@router.post("/seed")
def seed_system_tags(
    force: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Seed system tags"""
    if not force:
        existing = db.query(Tag).filter(Tag.is_system == True, Tag.org_id.is_(None)).count()
        if existing > 0:
            return {"success": True, "message": f"System tags already seeded ({existing} tags)", "count": existing}
    
    created = 0
    for tag_data in SYSTEM_TAGS:
        existing = db.query(Tag).filter(Tag.tag_code == tag_data["code"], Tag.org_id.is_(None)).first()
        if existing:
            continue
        
        tag = Tag(
            org_id=None,
            tag_code=tag_data["code"],
            tag_name=tag_data["name"],
            tag_name_vi=tag_data.get("name_vi"),
            color_code=tag_data.get("color", "#6B7280"),
            icon_code=tag_data.get("icon"),
            category=tag_data.get("category"),
            is_system=True,
            usage_count=0,
            status="active"
        )
        db.add(tag)
        created += 1
    
    db.commit()
    total = db.query(Tag).filter(Tag.is_system == True, Tag.org_id.is_(None)).count()
    
    return {"success": True, "message": f"Created {created} new system tags", "total_system_tags": total}


@router.post("/assign", response_model=dict)
def assign_tag(
    data: TagAssignRequest,
    db: Session = Depends(get_db)
):
    """Assign a tag to an entity"""
    if data.tag_id:
        tag = db.query(Tag).filter(Tag.id == data.tag_id, Tag.deleted_at.is_(None), Tag.status == "active").first()
    elif data.tag_code:
        tag = db.query(Tag).filter(Tag.tag_code == data.tag_code, Tag.deleted_at.is_(None), Tag.status == "active").first()
    else:
        raise HTTPException(status_code=400, detail="Must provide tag_id or tag_code")
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    existing = db.query(EntityTag).filter(
        EntityTag.tag_id == tag.id,
        EntityTag.entity_type == data.entity_type,
        EntityTag.entity_id == data.entity_id
    ).first()
    
    if existing:
        return {"success": True, "message": "Tag already assigned", "entity_tag": serialize_entity_tag(existing, tag)}
    
    entity_tag = EntityTag(
        org_id=tag.org_id,
        tag_id=tag.id,
        entity_type=data.entity_type,
        entity_id=data.entity_id
    )
    
    db.add(entity_tag)
    tag.usage_count = (tag.usage_count or 0) + 1
    db.commit()
    db.refresh(entity_tag)
    
    return {"success": True, "message": f"Tag '{tag.tag_code}' assigned to {data.entity_type}", "entity_tag": serialize_entity_tag(entity_tag, tag)}


@router.post("/assign-bulk", response_model=dict)
def assign_tags_bulk(
    data: TagAssignBulkRequest,
    db: Session = Depends(get_db)
):
    """Assign multiple tags to an entity"""
    assigned = []
    errors = []
    
    tag_ids = data.tag_ids or []
    if data.tag_codes:
        for code in data.tag_codes:
            tag = db.query(Tag).filter(Tag.tag_code == code, Tag.deleted_at.is_(None), Tag.status == "active").first()
            if tag:
                tag_ids.append(tag.id)
            else:
                errors.append(f"Tag '{code}' not found")
    
    for tag_id in tag_ids:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            errors.append(f"Tag ID '{tag_id}' not found")
            continue
        
        existing = db.query(EntityTag).filter(
            EntityTag.tag_id == tag_id,
            EntityTag.entity_type == data.entity_type,
            EntityTag.entity_id == data.entity_id
        ).first()
        
        if existing:
            assigned.append(tag.tag_code)
            continue
        
        entity_tag = EntityTag(
            org_id=tag.org_id,
            tag_id=tag_id,
            entity_type=data.entity_type,
            entity_id=data.entity_id
        )
        db.add(entity_tag)
        tag.usage_count = (tag.usage_count or 0) + 1
        assigned.append(tag.tag_code)
    
    db.commit()
    return {"success": True, "assigned": assigned, "errors": errors}


@router.post("/unassign")
def unassign_tag(
    data: TagUnassignRequest,
    db: Session = Depends(get_db)
):
    """Remove a tag from an entity"""
    if data.tag_id:
        tag = db.query(Tag).filter(Tag.id == data.tag_id).first()
    elif data.tag_code:
        tag = db.query(Tag).filter(Tag.tag_code == data.tag_code).first()
    else:
        raise HTTPException(status_code=400, detail="Must provide tag_id or tag_code")
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    entity_tag = db.query(EntityTag).filter(
        EntityTag.tag_id == tag.id,
        EntityTag.entity_type == data.entity_type,
        EntityTag.entity_id == data.entity_id
    ).first()
    
    if not entity_tag:
        raise HTTPException(status_code=404, detail="Tag not assigned to this entity")
    
    db.delete(entity_tag)
    if tag.usage_count and tag.usage_count > 0:
        tag.usage_count -= 1
    
    db.commit()
    return {"success": True, "message": f"Tag '{tag.tag_code}' removed from {data.entity_type}"}


# ═══════════════════════════════════════════════════════════════════════════════
# PARAMETERIZED ROUTES (MUST BE LAST!)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{id}", response_model=dict)
def get_tag(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get tag by ID"""
    tag = db.query(Tag).filter(Tag.id == id, Tag.deleted_at.is_(None)).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return serialize_tag(tag)


@router.put("/{id}", response_model=dict)
def update_tag(
    id: UUID,
    data: TagUpdate,
    db: Session = Depends(get_db)
):
    """Update a tag"""
    tag = db.query(Tag).filter(Tag.id == id, Tag.deleted_at.is_(None)).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag.is_system:
        protected_fields = ["tag_code", "status"]
        update_data = data.model_dump(exclude_unset=True)
        for field in protected_fields:
            if field in update_data:
                raise HTTPException(status_code=400, detail=f"Cannot modify '{field}' of system tag")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tag, field, value)
    
    tag.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tag)
    
    return serialize_tag(tag)


@router.delete("/{id}")
def delete_tag(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete a tag"""
    tag = db.query(Tag).filter(Tag.id == id, Tag.deleted_at.is_(None)).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system tag")
    
    usage_count = db.query(EntityTag).filter(EntityTag.tag_id == id).count()
    
    if usage_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete tag: in use by {usage_count} entities")
    
    tag.deleted_at = datetime.now(timezone.utc)
    tag.status = "inactive"
    db.commit()
    
    return {"success": True, "message": f"Tag '{tag.tag_code}' deleted"}
