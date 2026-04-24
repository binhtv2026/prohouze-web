"""
ProHouzing Attribute Engine API Routes
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 3

IMPORTANT: Route order - static routes BEFORE parameterized routes

Endpoints:
- GET /api/v2/attributes - List attributes
- GET /api/v2/attributes/schema/{entity_type} - Get schema for entity type
- GET /api/v2/attributes/groups - List attribute groups
- POST /api/v2/attributes - Create attribute
- POST /api/v2/attributes/seed - Seed system attributes

- GET /api/v2/attributes/values/{entity_type}/{entity_id} - Get values for entity
- POST /api/v2/attributes/values/{entity_type}/{entity_id} - Set values (bulk)
- PUT /api/v2/attributes/values/{entity_type}/{entity_id}/{attribute_code} - Set single value
- DELETE /api/v2/attributes/values/{entity_type}/{entity_id}/{attribute_code} - Remove value

- GET /api/v2/attributes/{id} - Get attribute by ID (LAST!)
- PUT /api/v2/attributes/{id} - Update attribute
- DELETE /api/v2/attributes/{id} - Delete attribute
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from pydantic import BaseModel, Field

from ..database import get_db
from ..models.attributes import (
    EntityAttribute, EntityAttributeValue,
    AttributeDataType, AttributeScope,
    SYSTEM_ATTRIBUTES, ATTRIBUTE_GROUPS
)


router = APIRouter(prefix="/attributes", tags=["Attributes"])


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class AttributeBase(BaseModel):
    entity_type: str = Field(..., description="lead, customer, deal, product, task")
    attribute_code: str = Field(..., max_length=100)
    attribute_name: str = Field(..., max_length=255)
    attribute_name_vi: Optional[str] = None
    attribute_name_en: Optional[str] = None
    description: Optional[str] = None
    data_type: str = "string"
    validation_rules: Optional[Dict[str, Any]] = None
    is_required: bool = False
    default_value: Optional[Any] = None
    options: Optional[List[Dict[str, Any]]] = None
    options_source: Optional[str] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    icon_code: Optional[str] = None
    sort_order: int = 0
    group_code: Optional[str] = "custom"
    group_name: Optional[str] = None
    is_visible: bool = True
    is_searchable: bool = False
    is_filterable: bool = False
    is_sortable: bool = False
    is_readonly: bool = False


class AttributeCreate(AttributeBase):
    org_id: Optional[UUID] = None


class AttributeUpdate(BaseModel):
    attribute_name: Optional[str] = None
    attribute_name_vi: Optional[str] = None
    attribute_name_en: Optional[str] = None
    description: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    default_value: Optional[Any] = None
    options: Optional[List[Dict[str, Any]]] = None
    options_source: Optional[str] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    icon_code: Optional[str] = None
    sort_order: Optional[int] = None
    group_code: Optional[str] = None
    group_name: Optional[str] = None
    is_visible: Optional[bool] = None
    is_searchable: Optional[bool] = None
    is_filterable: Optional[bool] = None
    is_sortable: Optional[bool] = None
    is_readonly: Optional[bool] = None
    status: Optional[str] = None


class AttributeValueSet(BaseModel):
    """Set a single attribute value"""
    value: Any


class AttributeValuesBulk(BaseModel):
    """Set multiple attribute values"""
    values: Dict[str, Any] = Field(..., description="Mapping of attribute_code to value")


class AttributeGroupResponse(BaseModel):
    code: str
    name: str
    sort: int


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def serialize_attribute(attr: EntityAttribute) -> dict:
    """Convert attribute to response dict"""
    return {
        "id": str(attr.id),
        "org_id": str(attr.org_id) if attr.org_id else None,
        "entity_type": attr.entity_type,
        "attribute_code": attr.attribute_code,
        "attribute_name": attr.attribute_name,
        "attribute_name_vi": attr.attribute_name_vi,
        "attribute_name_en": attr.attribute_name_en,
        "description": attr.description,
        "data_type": attr.data_type,
        "validation_rules": attr.validation_rules,
        "is_required": attr.is_required,
        "default_value": attr.default_value,
        "options": attr.options,
        "options_source": attr.options_source,
        "reference_entity_type": attr.reference_entity_type,
        "reference_display_field": attr.reference_display_field,
        "placeholder": attr.placeholder,
        "help_text": attr.help_text,
        "icon_code": attr.icon_code,
        "sort_order": attr.sort_order,
        "group_code": attr.group_code,
        "group_name": attr.group_name,
        "is_visible": attr.is_visible,
        "is_searchable": attr.is_searchable,
        "is_filterable": attr.is_filterable,
        "is_sortable": attr.is_sortable,
        "is_readonly": attr.is_readonly,
        "is_system": attr.is_system,
        "system_field_name": attr.system_field_name,
        "scope": attr.scope,
        "module_code": attr.module_code,
        "usage_count": attr.usage_count or 0,
        "status": attr.status,
        "created_at": attr.created_at.isoformat() if attr.created_at else None,
        "updated_at": attr.updated_at.isoformat() if attr.updated_at else None,
    }


def serialize_attribute_value(val: EntityAttributeValue, attr: EntityAttribute = None) -> dict:
    """Convert attribute value to response dict"""
    result = {
        "id": str(val.id),
        "attribute_id": str(val.attribute_id),
        "entity_type": val.entity_type,
        "entity_id": str(val.entity_id),
        "value": val.value,
        "created_at": val.created_at.isoformat() if val.created_at else None,
        "updated_at": val.updated_at.isoformat() if val.updated_at else None,
    }
    
    if attr:
        result["attribute_code"] = attr.attribute_code
        result["attribute_name"] = attr.attribute_name
        result["data_type"] = attr.data_type
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# STATIC GET ROUTES (MUST BE FIRST!)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=List[dict])
def list_attributes(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    org_id: Optional[UUID] = Query(None, description="Filter by org_id"),
    group_code: Optional[str] = Query(None, description="Filter by group"),
    data_type: Optional[str] = Query(None, description="Filter by data type"),
    include_system: bool = Query(True, description="Include system attributes"),
    search: Optional[str] = Query(None, description="Search in name/code"),
    db: Session = Depends(get_db)
):
    """List all attributes with filters"""
    query = db.query(EntityAttribute).filter(
        EntityAttribute.deleted_at.is_(None),
        EntityAttribute.status == "active"
    )
    
    if entity_type:
        query = query.filter(EntityAttribute.entity_type == entity_type)
    
    if org_id:
        if include_system:
            query = query.filter(
                or_(EntityAttribute.org_id == org_id, EntityAttribute.org_id.is_(None))
            )
        else:
            query = query.filter(EntityAttribute.org_id == org_id)
    else:
        query = query.filter(EntityAttribute.org_id.is_(None))
    
    if group_code:
        query = query.filter(EntityAttribute.group_code == group_code)
    
    if data_type:
        query = query.filter(EntityAttribute.data_type == data_type)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                EntityAttribute.attribute_code.ilike(search_pattern),
                EntityAttribute.attribute_name.ilike(search_pattern),
                EntityAttribute.attribute_name_vi.ilike(search_pattern)
            )
        )
    
    attributes = query.order_by(
        EntityAttribute.entity_type,
        EntityAttribute.group_code,
        EntityAttribute.sort_order,
        EntityAttribute.attribute_name
    ).all()
    
    return [serialize_attribute(attr) for attr in attributes]


@router.get("/schema/{entity_type}", response_model=dict)
def get_entity_schema(
    entity_type: str,
    org_id: Optional[UUID] = Query(None),
    include_system: bool = Query(True),
    db: Session = Depends(get_db)
):
    """
    Get full schema for an entity type.
    Returns attributes grouped by group_code.
    Used for building dynamic forms.
    """
    query = db.query(EntityAttribute).filter(
        EntityAttribute.entity_type == entity_type,
        EntityAttribute.deleted_at.is_(None),
        EntityAttribute.status == "active",
        EntityAttribute.is_visible == True
    )
    
    if org_id:
        if include_system:
            query = query.filter(
                or_(EntityAttribute.org_id == org_id, EntityAttribute.org_id.is_(None))
            )
        else:
            query = query.filter(EntityAttribute.org_id == org_id)
    else:
        query = query.filter(EntityAttribute.org_id.is_(None))
    
    attributes = query.order_by(
        EntityAttribute.group_code,
        EntityAttribute.sort_order
    ).all()
    
    # Group by group_code
    groups = {}
    for attr in attributes:
        group = attr.group_code or "custom"
        if group not in groups:
            group_info = next((g for g in ATTRIBUTE_GROUPS if g["code"] == group), None)
            groups[group] = {
                "code": group,
                "name": group_info["name"] if group_info else group.replace("_", " ").title(),
                "sort": group_info["sort"] if group_info else 999,
                "attributes": []
            }
        groups[group]["attributes"].append(serialize_attribute(attr))
    
    # Sort groups
    sorted_groups = sorted(groups.values(), key=lambda g: g["sort"])
    
    return {
        "entity_type": entity_type,
        "groups": sorted_groups,
        "total_attributes": len(attributes)
    }


@router.get("/groups", response_model=List[AttributeGroupResponse])
def list_attribute_groups():
    """List all attribute groups for UI organization"""
    return [
        AttributeGroupResponse(code=g["code"], name=g["name"], sort=g["sort"])
        for g in sorted(ATTRIBUTE_GROUPS, key=lambda x: x["sort"])
    ]


@router.get("/data-types", response_model=List[str])
def list_data_types():
    """List all supported data types"""
    return [dt.value for dt in AttributeDataType]


@router.get("/stats")
def get_attribute_stats(
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get attribute statistics"""
    query = db.query(EntityAttribute).filter(EntityAttribute.deleted_at.is_(None))
    
    if org_id:
        query = query.filter(
            or_(EntityAttribute.org_id == org_id, EntityAttribute.org_id.is_(None))
        )
    
    total = query.count()
    system = query.filter(EntityAttribute.is_system == True).count()
    custom = query.filter(EntityAttribute.is_system == False).count()
    
    # By entity type
    by_entity = db.query(
        EntityAttribute.entity_type,
        func.count(EntityAttribute.id)
    ).filter(EntityAttribute.deleted_at.is_(None)).group_by(
        EntityAttribute.entity_type
    ).all()
    
    # By data type
    by_data_type = db.query(
        EntityAttribute.data_type,
        func.count(EntityAttribute.id)
    ).filter(EntityAttribute.deleted_at.is_(None)).group_by(
        EntityAttribute.data_type
    ).all()
    
    # Value count
    value_count = db.query(EntityAttributeValue).count()
    
    return {
        "total_attributes": total,
        "system_attributes": system,
        "custom_attributes": custom,
        "by_entity_type": {etype: count for etype, count in by_entity},
        "by_data_type": {dtype: count for dtype, count in by_data_type},
        "total_values": value_count
    }


# ═══════════════════════════════════════════════════════════════════════════════
# VALUE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/values/{entity_type}/{entity_id}", response_model=dict)
def get_entity_attribute_values(
    entity_type: str,
    entity_id: UUID,
    org_id: Optional[UUID] = Query(None),
    include_schema: bool = Query(False, description="Include attribute definitions"),
    db: Session = Depends(get_db)
):
    """
    Get all attribute values for an entity.
    Returns both system and custom attribute values.
    """
    # Get all attributes for this entity type
    attr_query = db.query(EntityAttribute).filter(
        EntityAttribute.entity_type == entity_type,
        EntityAttribute.deleted_at.is_(None),
        EntityAttribute.status == "active"
    )
    
    if org_id:
        attr_query = attr_query.filter(
            or_(EntityAttribute.org_id == org_id, EntityAttribute.org_id.is_(None))
        )
    else:
        attr_query = attr_query.filter(EntityAttribute.org_id.is_(None))
    
    attributes = attr_query.all()
    attr_map = {attr.id: attr for attr in attributes}
    attr_code_map = {attr.attribute_code: attr for attr in attributes}
    
    # Get values
    values = db.query(EntityAttributeValue).filter(
        EntityAttributeValue.entity_type == entity_type,
        EntityAttributeValue.entity_id == entity_id
    ).all()
    
    # Build response
    result = {
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "values": {}
    }
    
    # Add default values for attributes without stored values
    for attr in attributes:
        result["values"][attr.attribute_code] = {
            "value": attr.default_value,
            "attribute_id": str(attr.id),
            "is_set": False
        }
        if include_schema:
            result["values"][attr.attribute_code]["schema"] = serialize_attribute(attr)
    
    # Override with actual values
    for val in values:
        attr = attr_map.get(val.attribute_id)
        if attr:
            result["values"][attr.attribute_code] = {
                "value": val.value,
                "attribute_id": str(val.attribute_id),
                "is_set": True,
                "value_id": str(val.id),
                "updated_at": val.updated_at.isoformat() if val.updated_at else None
            }
            if include_schema:
                result["values"][attr.attribute_code]["schema"] = serialize_attribute(attr)
    
    return result


@router.post("/values/{entity_type}/{entity_id}", response_model=dict)
def set_entity_attribute_values(
    entity_type: str,
    entity_id: UUID,
    data: AttributeValuesBulk,
    org_id: Optional[UUID] = Query(None),
    validate: bool = Query(True, description="Validate values against rules"),
    db: Session = Depends(get_db)
):
    """
    Set multiple attribute values for an entity (bulk update).
    """
    # Get attributes
    attr_query = db.query(EntityAttribute).filter(
        EntityAttribute.entity_type == entity_type,
        EntityAttribute.deleted_at.is_(None),
        EntityAttribute.status == "active"
    )
    
    if org_id:
        attr_query = attr_query.filter(
            or_(EntityAttribute.org_id == org_id, EntityAttribute.org_id.is_(None))
        )
    
    attributes = attr_query.all()
    attr_code_map = {attr.attribute_code: attr for attr in attributes}
    
    updated = []
    created = []
    errors = []
    
    for attr_code, value in data.values.items():
        attr = attr_code_map.get(attr_code)
        
        if not attr:
            errors.append(f"Attribute '{attr_code}' not found")
            continue
        
        # Validate
        if validate:
            is_valid, error = attr.validate_value(value)
            if not is_valid:
                errors.append(error)
                continue
        
        # Find or create value
        existing = db.query(EntityAttributeValue).filter(
            EntityAttributeValue.attribute_id == attr.id,
            EntityAttributeValue.entity_type == entity_type,
            EntityAttributeValue.entity_id == entity_id
        ).first()
        
        if existing:
            existing.set_value(value, attr)
            existing.updated_at = datetime.now(timezone.utc)
            updated.append(attr_code)
        else:
            new_val = EntityAttributeValue(
                org_id=org_id,
                attribute_id=attr.id,
                entity_type=entity_type,
                entity_id=entity_id
            )
            new_val.set_value(value, attr)
            db.add(new_val)
            
            # Increment usage
            attr.usage_count = (attr.usage_count or 0) + 1
            created.append(attr_code)
    
    db.commit()
    
    return {
        "success": len(errors) == 0,
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "updated": updated,
        "created": created,
        "errors": errors
    }


@router.put("/values/{entity_type}/{entity_id}/{attribute_code}", response_model=dict)
def set_single_attribute_value(
    entity_type: str,
    entity_id: UUID,
    attribute_code: str,
    data: AttributeValueSet,
    org_id: Optional[UUID] = Query(None),
    validate: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Set a single attribute value for an entity."""
    # Find attribute
    attr_query = db.query(EntityAttribute).filter(
        EntityAttribute.entity_type == entity_type,
        EntityAttribute.attribute_code == attribute_code,
        EntityAttribute.deleted_at.is_(None)
    )
    
    if org_id:
        attr = attr_query.filter(EntityAttribute.org_id == org_id).first()
        if not attr:
            attr = attr_query.filter(EntityAttribute.org_id.is_(None)).first()
    else:
        attr = attr_query.filter(EntityAttribute.org_id.is_(None)).first()
    
    if not attr:
        raise HTTPException(
            status_code=404,
            detail=f"Attribute '{attribute_code}' not found for {entity_type}"
        )
    
    # Validate
    if validate:
        is_valid, error = attr.validate_value(data.value)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
    
    # Find or create value
    existing = db.query(EntityAttributeValue).filter(
        EntityAttributeValue.attribute_id == attr.id,
        EntityAttributeValue.entity_type == entity_type,
        EntityAttributeValue.entity_id == entity_id
    ).first()
    
    if existing:
        existing.set_value(data.value, attr)
        existing.updated_at = datetime.now(timezone.utc)
        action = "updated"
    else:
        new_val = EntityAttributeValue(
            org_id=org_id,
            attribute_id=attr.id,
            entity_type=entity_type,
            entity_id=entity_id
        )
        new_val.set_value(data.value, attr)
        db.add(new_val)
        attr.usage_count = (attr.usage_count or 0) + 1
        action = "created"
    
    db.commit()
    
    return {
        "success": True,
        "action": action,
        "attribute_code": attribute_code,
        "value": data.value
    }


@router.delete("/values/{entity_type}/{entity_id}/{attribute_code}")
def delete_attribute_value(
    entity_type: str,
    entity_id: UUID,
    attribute_code: str,
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Remove an attribute value from an entity."""
    # Find attribute
    attr_query = db.query(EntityAttribute).filter(
        EntityAttribute.entity_type == entity_type,
        EntityAttribute.attribute_code == attribute_code,
        EntityAttribute.deleted_at.is_(None)
    )
    
    if org_id:
        attr = attr_query.filter(EntityAttribute.org_id == org_id).first()
        if not attr:
            attr = attr_query.filter(EntityAttribute.org_id.is_(None)).first()
    else:
        attr = attr_query.filter(EntityAttribute.org_id.is_(None)).first()
    
    if not attr:
        raise HTTPException(
            status_code=404,
            detail=f"Attribute '{attribute_code}' not found"
        )
    
    # Find value
    value = db.query(EntityAttributeValue).filter(
        EntityAttributeValue.attribute_id == attr.id,
        EntityAttributeValue.entity_type == entity_type,
        EntityAttributeValue.entity_id == entity_id
    ).first()
    
    if not value:
        raise HTTPException(
            status_code=404,
            detail="Value not set for this attribute"
        )
    
    db.delete(value)
    
    # Decrement usage
    if attr.usage_count and attr.usage_count > 0:
        attr.usage_count -= 1
    
    db.commit()
    
    return {"success": True, "message": f"Value for '{attribute_code}' removed"}


# ═══════════════════════════════════════════════════════════════════════════════
# POST ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=dict, status_code=201)
def create_attribute(
    data: AttributeCreate,
    db: Session = Depends(get_db)
):
    """Create a new custom attribute."""
    # Check duplicate
    existing = db.query(EntityAttribute).filter(
        EntityAttribute.entity_type == data.entity_type,
        EntityAttribute.attribute_code == data.attribute_code,
        EntityAttribute.org_id == data.org_id,
        EntityAttribute.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Attribute '{data.attribute_code}' already exists for {data.entity_type}"
        )
    
    # Validate data_type
    valid_types = [dt.value for dt in AttributeDataType]
    if data.data_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid data_type. Must be one of: {', '.join(valid_types)}"
        )
    
    attr = EntityAttribute(
        org_id=data.org_id,
        entity_type=data.entity_type,
        attribute_code=data.attribute_code,
        attribute_name=data.attribute_name,
        attribute_name_vi=data.attribute_name_vi,
        attribute_name_en=data.attribute_name_en,
        description=data.description,
        data_type=data.data_type,
        validation_rules=data.validation_rules,
        is_required=data.is_required,
        default_value=data.default_value,
        options=data.options,
        options_source=data.options_source,
        placeholder=data.placeholder,
        help_text=data.help_text,
        icon_code=data.icon_code,
        sort_order=data.sort_order,
        group_code=data.group_code or "custom",
        group_name=data.group_name,
        is_visible=data.is_visible,
        is_searchable=data.is_searchable,
        is_filterable=data.is_filterable,
        is_sortable=data.is_sortable,
        is_readonly=data.is_readonly,
        is_system=False,
        scope="org",
        usage_count=0,
        status="active"
    )
    
    db.add(attr)
    db.commit()
    db.refresh(attr)
    
    return serialize_attribute(attr)


@router.post("/seed")
def seed_system_attributes(
    entity_types: Optional[str] = Query(None, description="Comma-separated entity types to seed"),
    force: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Seed system attributes for entity types."""
    if not force:
        existing = db.query(EntityAttribute).filter(
            EntityAttribute.is_system == True,
            EntityAttribute.org_id.is_(None)
        ).count()
        
        if existing > 0:
            return {
                "success": True,
                "message": f"System attributes already seeded ({existing} attributes)",
                "count": existing
            }
    
    types_to_seed = entity_types.split(",") if entity_types else list(SYSTEM_ATTRIBUTES.keys())
    
    created = 0
    for entity_type in types_to_seed:
        if entity_type not in SYSTEM_ATTRIBUTES:
            continue
        
        for attr_def in SYSTEM_ATTRIBUTES[entity_type]:
            existing = db.query(EntityAttribute).filter(
                EntityAttribute.entity_type == entity_type,
                EntityAttribute.attribute_code == attr_def["code"],
                EntityAttribute.org_id.is_(None)
            ).first()
            
            if existing:
                continue
            
            # Find group info
            group_code = attr_def.get("group", "custom")
            group_info = next((g for g in ATTRIBUTE_GROUPS if g["code"] == group_code), None)
            
            attr = EntityAttribute(
                org_id=None,
                entity_type=entity_type,
                attribute_code=attr_def["code"],
                attribute_name=attr_def["name"],
                attribute_name_vi=attr_def["name"],  # Vietnamese is primary
                data_type=attr_def["data_type"],
                is_required=attr_def.get("is_required", False),
                options=attr_def.get("options"),
                options_source=attr_def.get("options_source"),
                sort_order=attr_def.get("sort", 0),
                group_code=group_code,
                group_name=group_info["name"] if group_info else None,
                is_visible=True,
                is_system=attr_def.get("is_system", True),
                system_field_name=attr_def.get("system_field"),
                scope="system",
                status="active"
            )
            db.add(attr)
            created += 1
    
    db.commit()
    
    total = db.query(EntityAttribute).filter(
        EntityAttribute.is_system == True,
        EntityAttribute.org_id.is_(None)
    ).count()
    
    return {
        "success": True,
        "message": f"Created {created} system attributes",
        "total_system_attributes": total
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PARAMETERIZED ROUTES (MUST BE LAST!)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{id}", response_model=dict)
def get_attribute(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Get attribute by ID."""
    attr = db.query(EntityAttribute).filter(
        EntityAttribute.id == id,
        EntityAttribute.deleted_at.is_(None)
    ).first()
    
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    return serialize_attribute(attr)


@router.put("/{id}", response_model=dict)
def update_attribute(
    id: UUID,
    data: AttributeUpdate,
    db: Session = Depends(get_db)
):
    """Update an attribute."""
    attr = db.query(EntityAttribute).filter(
        EntityAttribute.id == id,
        EntityAttribute.deleted_at.is_(None)
    ).first()
    
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    # System attributes have limited updates
    if attr.is_system:
        protected_fields = ["attribute_code", "data_type", "entity_type", "status"]
        update_data = data.model_dump(exclude_unset=True)
        for field in protected_fields:
            if field in update_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot modify '{field}' of system attribute"
                )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attr, field, value)
    
    attr.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(attr)
    
    return serialize_attribute(attr)


@router.delete("/{id}")
def delete_attribute(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete an attribute."""
    attr = db.query(EntityAttribute).filter(
        EntityAttribute.id == id,
        EntityAttribute.deleted_at.is_(None)
    ).first()
    
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    
    if attr.is_system:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete system attribute"
        )
    
    # Check if attribute has values
    value_count = db.query(EntityAttributeValue).filter(
        EntityAttributeValue.attribute_id == id
    ).count()
    
    if value_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete attribute: has {value_count} values. Remove values first."
        )
    
    attr.deleted_at = datetime.now(timezone.utc)
    attr.status = "inactive"
    db.commit()
    
    return {"success": True, "message": f"Attribute '{attr.attribute_code}' deleted"}
