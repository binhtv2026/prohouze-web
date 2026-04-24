"""
ProHouzing Form Schema API Routes
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 4

IMPORTANT: Route order - static routes BEFORE parameterized routes

Endpoints:
- GET /api/v2/forms - List all form schemas
- GET /api/v2/forms/render/{entity_type} - Get renderable form for entity type
- GET /api/v2/forms/render/{entity_type}/{form_type} - Get specific form type
- GET /api/v2/forms/types - List form types
- GET /api/v2/forms/layouts - List layout options
- POST /api/v2/forms - Create form schema
- POST /api/v2/forms/seed - Seed default forms

- GET /api/v2/forms/{id} - Get form by ID (LAST!)
- PUT /api/v2/forms/{id} - Update form schema
- DELETE /api/v2/forms/{id} - Delete form schema

Section endpoints:
- POST /api/v2/forms/{schema_id}/sections - Add section
- PUT /api/v2/forms/sections/{section_id} - Update section
- DELETE /api/v2/forms/sections/{section_id} - Delete section

Field endpoints:
- POST /api/v2/forms/sections/{section_id}/fields - Add field
- PUT /api/v2/forms/fields/{field_id} - Update field
- DELETE /api/v2/forms/fields/{field_id} - Delete field
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, and_
from pydantic import BaseModel, Field

from ..database import get_db
from ..models.forms import (
    FormSchema, FormSection, FormField,
    FormType, FieldLayout, DEFAULT_FORMS
)
from ..models.attributes import EntityAttribute


router = APIRouter(prefix="/forms", tags=["Forms"])


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class FormSchemaBase(BaseModel):
    entity_type: str
    form_type: str = "create"
    schema_code: str
    schema_name: str
    schema_name_vi: Optional[str] = None
    description: Optional[str] = None
    context_conditions: Optional[Dict[str, Any]] = None
    priority: int = 0
    title: Optional[str] = None
    subtitle: Optional[str] = None
    icon_code: Optional[str] = None
    layout: str = "vertical"
    columns: int = 1
    is_default: bool = False
    validate_on_change: bool = False
    show_required_indicator: bool = True
    settings: Optional[Dict[str, Any]] = None


class FormSchemaCreate(FormSchemaBase):
    org_id: Optional[UUID] = None


class FormSchemaUpdate(BaseModel):
    schema_name: Optional[str] = None
    schema_name_vi: Optional[str] = None
    description: Optional[str] = None
    context_conditions: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    icon_code: Optional[str] = None
    layout: Optional[str] = None
    columns: Optional[int] = None
    is_default: Optional[bool] = None
    validate_on_change: Optional[bool] = None
    show_required_indicator: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class SectionCreate(BaseModel):
    section_code: str
    section_name: str
    section_name_vi: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0
    icon_code: Optional[str] = None
    color_code: Optional[str] = None
    columns: int = 1
    layout: str = "vertical"
    is_collapsible: bool = False
    is_collapsed_default: bool = False
    is_visible: bool = True
    visibility_conditions: Optional[Dict[str, Any]] = None


class SectionUpdate(BaseModel):
    section_name: Optional[str] = None
    section_name_vi: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    icon_code: Optional[str] = None
    color_code: Optional[str] = None
    columns: Optional[int] = None
    layout: Optional[str] = None
    is_collapsible: Optional[bool] = None
    is_collapsed_default: Optional[bool] = None
    is_visible: Optional[bool] = None
    visibility_conditions: Optional[Dict[str, Any]] = None


class FieldCreate(BaseModel):
    attribute_id: Optional[UUID] = None
    attribute_code: Optional[str] = None  # Alternative to attribute_id
    sort_order: int = 0
    layout: str = "full"
    row_group: Optional[int] = None
    label_override: Optional[str] = None
    placeholder_override: Optional[str] = None
    help_text_override: Optional[str] = None
    is_required_override: Optional[bool] = None
    is_readonly_override: Optional[bool] = None
    is_visible: bool = True
    is_hidden: bool = False
    visibility_conditions: Optional[Dict[str, Any]] = None
    required_conditions: Optional[Dict[str, Any]] = None
    default_value_override: Optional[Any] = None
    css_class: Optional[str] = None
    dependencies: Optional[List[Dict[str, Any]]] = None


class FieldUpdate(BaseModel):
    sort_order: Optional[int] = None
    layout: Optional[str] = None
    row_group: Optional[int] = None
    label_override: Optional[str] = None
    placeholder_override: Optional[str] = None
    help_text_override: Optional[str] = None
    is_required_override: Optional[bool] = None
    is_readonly_override: Optional[bool] = None
    is_visible: Optional[bool] = None
    is_hidden: Optional[bool] = None
    visibility_conditions: Optional[Dict[str, Any]] = None
    required_conditions: Optional[Dict[str, Any]] = None
    default_value_override: Optional[Any] = None
    css_class: Optional[str] = None
    dependencies: Optional[List[Dict[str, Any]]] = None


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def serialize_form_schema(schema: FormSchema, include_details: bool = False) -> dict:
    """Convert form schema to response dict"""
    result = {
        "id": str(schema.id),
        "org_id": str(schema.org_id) if schema.org_id else None,
        "entity_type": schema.entity_type,
        "form_type": schema.form_type,
        "schema_code": schema.schema_code,
        "schema_name": schema.schema_name,
        "schema_name_vi": schema.schema_name_vi,
        "description": schema.description,
        "context_conditions": schema.context_conditions,
        "priority": schema.priority,
        "title": schema.title,
        "subtitle": schema.subtitle,
        "icon_code": schema.icon_code,
        "layout": schema.layout,
        "columns": schema.columns,
        "is_default": schema.is_default,
        "is_system": schema.is_system,
        "is_active": schema.is_active,
        "validate_on_change": schema.validate_on_change,
        "show_required_indicator": schema.show_required_indicator,
        "settings": schema.settings,
        "status": schema.status,
        "created_at": schema.created_at.isoformat() if schema.created_at else None,
        "updated_at": schema.updated_at.isoformat() if schema.updated_at else None,
    }
    
    if include_details and schema.sections:
        result["sections"] = [serialize_section(s, include_fields=True) for s in schema.sections]
        result["section_count"] = len(schema.sections)
        result["field_count"] = sum(len(s.fields) for s in schema.sections)
    
    return result


def serialize_section(section: FormSection, include_fields: bool = False) -> dict:
    """Convert section to response dict"""
    result = {
        "id": str(section.id),
        "schema_id": str(section.schema_id),
        "section_code": section.section_code,
        "section_name": section.section_name,
        "section_name_vi": section.section_name_vi,
        "description": section.description,
        "sort_order": section.sort_order,
        "icon_code": section.icon_code,
        "color_code": section.color_code,
        "columns": section.columns,
        "layout": section.layout,
        "is_collapsible": section.is_collapsible,
        "is_collapsed_default": section.is_collapsed_default,
        "is_visible": section.is_visible,
        "visibility_conditions": section.visibility_conditions,
        "created_at": section.created_at.isoformat() if section.created_at else None,
    }
    
    if include_fields and section.fields:
        result["fields"] = [serialize_field(f) for f in section.fields]
    
    return result


def serialize_field(field: FormField) -> dict:
    """Convert field to response dict with attribute info"""
    result = {
        "id": str(field.id),
        "section_id": str(field.section_id),
        "attribute_id": str(field.attribute_id),
        "sort_order": field.sort_order,
        "layout": field.layout,
        "row_group": field.row_group,
        "label_override": field.label_override,
        "placeholder_override": field.placeholder_override,
        "help_text_override": field.help_text_override,
        "is_required_override": field.is_required_override,
        "is_readonly_override": field.is_readonly_override,
        "is_visible": field.is_visible,
        "is_hidden": field.is_hidden,
        "visibility_conditions": field.visibility_conditions,
        "required_conditions": field.required_conditions,
        "default_value_override": field.default_value_override,
        "css_class": field.css_class,
        "dependencies": field.dependencies,
    }
    
    # Include attribute info for rendering
    if field.attribute:
        attr = field.attribute
        result["attribute"] = {
            "code": attr.attribute_code,
            "name": attr.attribute_name,
            "name_vi": attr.attribute_name_vi,
            "data_type": attr.data_type,
            "is_required": attr.is_required,
            "default_value": attr.default_value,
            "options": attr.options,
            "options_source": attr.options_source,
            "placeholder": attr.placeholder,
            "help_text": attr.help_text,
            "icon_code": attr.icon_code,
            "validation_rules": attr.validation_rules,
        }
        
        # Compute effective values
        result["effective_label"] = field.label_override or attr.attribute_name
        result["effective_placeholder"] = field.placeholder_override or attr.placeholder
        result["effective_required"] = field.is_required_override if field.is_required_override is not None else attr.is_required
        result["effective_readonly"] = field.is_readonly_override if field.is_readonly_override is not None else attr.is_readonly
    
    return result


def build_renderable_form(schema: FormSchema, db: Session) -> dict:
    """Build complete renderable form structure for frontend"""
    # Load schema with all relationships
    schema = db.query(FormSchema).options(
        selectinload(FormSchema.sections).selectinload(FormSection.fields).selectinload(FormField.attribute)
    ).filter(FormSchema.id == schema.id).first()
    
    result = {
        "schema": {
            "id": str(schema.id),
            "entity_type": schema.entity_type,
            "form_type": schema.form_type,
            "code": schema.schema_code,
            "name": schema.schema_name,
            "title": schema.title or schema.schema_name,
            "subtitle": schema.subtitle,
            "icon": schema.icon_code,
            "layout": schema.layout,
            "columns": schema.columns,
            "validate_on_change": schema.validate_on_change,
            "show_required_indicator": schema.show_required_indicator,
            "settings": schema.settings or {},
        },
        "sections": [],
    }
    
    for section in sorted(schema.sections, key=lambda s: s.sort_order):
        if not section.is_visible:
            continue
        
        section_data = {
            "id": str(section.id),
            "code": section.section_code,
            "name": section.section_name,
            "icon": section.icon_code,
            "color": section.color_code,
            "columns": section.columns,
            "layout": section.layout,
            "collapsible": section.is_collapsible,
            "collapsed": section.is_collapsed_default,
            "visibility_conditions": section.visibility_conditions,
            "fields": [],
        }
        
        # Group fields by row
        fields_by_row = {}
        no_row_fields = []
        
        for field in sorted(section.fields, key=lambda f: f.sort_order):
            if not field.is_visible:
                continue
            
            field_data = {
                "id": str(field.id),
                "attribute_id": str(field.attribute_id),
                "layout": field.layout,
                "hidden": field.is_hidden,
                "css_class": field.css_class,
                "visibility_conditions": field.visibility_conditions,
                "required_conditions": field.required_conditions,
                "dependencies": field.dependencies,
            }
            
            # Get attribute data
            if field.attribute:
                attr = field.attribute
                field_data["attribute"] = {
                    "code": attr.attribute_code,
                    "name": field.label_override or attr.attribute_name,
                    "data_type": attr.data_type,
                    "required": field.is_required_override if field.is_required_override is not None else attr.is_required,
                    "readonly": field.is_readonly_override if field.is_readonly_override is not None else attr.is_readonly,
                    "default_value": field.default_value_override or attr.default_value,
                    "placeholder": field.placeholder_override or attr.placeholder,
                    "help_text": field.help_text_override or attr.help_text,
                    "icon": attr.icon_code,
                    "options": attr.options,
                    "options_source": attr.options_source,
                    "validation_rules": attr.validation_rules,
                }
            
            if field.row_group is not None:
                if field.row_group not in fields_by_row:
                    fields_by_row[field.row_group] = []
                fields_by_row[field.row_group].append(field_data)
            else:
                no_row_fields.append(field_data)
        
        # Flatten into rows
        for row_num in sorted(fields_by_row.keys()):
            section_data["fields"].append({
                "type": "row",
                "fields": fields_by_row[row_num]
            })
        
        for field in no_row_fields:
            section_data["fields"].append({
                "type": "field",
                **field
            })
        
        result["sections"].append(section_data)
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# STATIC GET ROUTES (MUST BE FIRST!)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=List[dict])
def list_forms(
    entity_type: Optional[str] = Query(None),
    form_type: Optional[str] = Query(None),
    org_id: Optional[UUID] = Query(None),
    include_system: bool = Query(True),
    include_details: bool = Query(False),
    db: Session = Depends(get_db)
):
    """List all form schemas with filters"""
    query = db.query(FormSchema).filter(
        FormSchema.deleted_at.is_(None),
        FormSchema.status == "active"
    )
    
    if entity_type:
        query = query.filter(FormSchema.entity_type == entity_type)
    
    if form_type:
        query = query.filter(FormSchema.form_type == form_type)
    
    if org_id:
        if include_system:
            query = query.filter(
                or_(FormSchema.org_id == org_id, FormSchema.org_id.is_(None))
            )
        else:
            query = query.filter(FormSchema.org_id == org_id)
    else:
        query = query.filter(FormSchema.org_id.is_(None))
    
    if include_details:
        query = query.options(
            selectinload(FormSchema.sections).selectinload(FormSection.fields)
        )
    
    schemas = query.order_by(FormSchema.entity_type, FormSchema.form_type, FormSchema.priority.desc()).all()
    
    return [serialize_form_schema(s, include_details=include_details) for s in schemas]


@router.get("/render/{entity_type}", response_model=dict)
def get_renderable_form(
    entity_type: str,
    form_type: str = Query("create"),
    org_id: Optional[UUID] = Query(None),
    context: Optional[str] = Query(None, description="JSON context for form matching"),
    db: Session = Depends(get_db)
):
    """
    Get renderable form for frontend.
    Returns complete form structure ready for rendering.
    
    Matching logic:
    1. Find forms matching entity_type + form_type
    2. If context provided, match against context_conditions
    3. Return highest priority match
    4. Fallback to default form
    """
    import json
    
    # Parse context
    ctx = {}
    if context:
        try:
            ctx = json.loads(context)
        except json.JSONDecodeError:
            pass
    
    # Find matching forms
    query = db.query(FormSchema).filter(
        FormSchema.entity_type == entity_type,
        FormSchema.form_type == form_type,
        FormSchema.deleted_at.is_(None),
        FormSchema.status == "active",
        FormSchema.is_active == True
    )
    
    if org_id:
        query = query.filter(
            or_(FormSchema.org_id == org_id, FormSchema.org_id.is_(None))
        )
    else:
        query = query.filter(FormSchema.org_id.is_(None))
    
    schemas = query.order_by(FormSchema.priority.desc()).all()
    
    # Find best match
    matched_schema = None
    
    for schema in schemas:
        if schema.matches_context(ctx):
            matched_schema = schema
            break
    
    # Fallback to default
    if not matched_schema:
        matched_schema = next((s for s in schemas if s.is_default), None)
    
    # Fallback to first
    if not matched_schema and schemas:
        matched_schema = schemas[0]
    
    if not matched_schema:
        raise HTTPException(
            status_code=404,
            detail=f"No form found for {entity_type}/{form_type}"
        )
    
    return build_renderable_form(matched_schema, db)


@router.get("/types", response_model=List[str])
def list_form_types():
    """List all form types"""
    return [ft.value for ft in FormType]


@router.get("/layouts", response_model=List[str])
def list_layouts():
    """List all layout options"""
    return [fl.value for fl in FieldLayout]


@router.get("/stats")
def get_form_stats(
    org_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get form statistics"""
    from sqlalchemy import func
    
    query = db.query(FormSchema).filter(FormSchema.deleted_at.is_(None))
    
    if org_id:
        query = query.filter(
            or_(FormSchema.org_id == org_id, FormSchema.org_id.is_(None))
        )
    
    total = query.count()
    system = query.filter(FormSchema.is_system == True).count()
    custom = query.filter(FormSchema.is_system == False).count()
    
    # By entity type
    by_entity = db.query(
        FormSchema.entity_type,
        func.count(FormSchema.id)
    ).filter(FormSchema.deleted_at.is_(None)).group_by(FormSchema.entity_type).all()
    
    # By form type
    by_form_type = db.query(
        FormSchema.form_type,
        func.count(FormSchema.id)
    ).filter(FormSchema.deleted_at.is_(None)).group_by(FormSchema.form_type).all()
    
    return {
        "total_forms": total,
        "system_forms": system,
        "custom_forms": custom,
        "by_entity_type": {etype: count for etype, count in by_entity},
        "by_form_type": {ftype: count for ftype, count in by_form_type},
    }


# ═══════════════════════════════════════════════════════════════════════════════
# POST ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=dict, status_code=201)
def create_form_schema(
    data: FormSchemaCreate,
    db: Session = Depends(get_db)
):
    """Create a new form schema"""
    # Check duplicate
    existing = db.query(FormSchema).filter(
        FormSchema.schema_code == data.schema_code,
        FormSchema.org_id == data.org_id,
        FormSchema.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Form schema '{data.schema_code}' already exists"
        )
    
    # Validate form_type
    valid_types = [ft.value for ft in FormType]
    if data.form_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid form_type. Must be one of: {', '.join(valid_types)}"
        )
    
    schema = FormSchema(
        org_id=data.org_id,
        entity_type=data.entity_type,
        form_type=data.form_type,
        schema_code=data.schema_code,
        schema_name=data.schema_name,
        schema_name_vi=data.schema_name_vi,
        description=data.description,
        context_conditions=data.context_conditions,
        priority=data.priority,
        title=data.title,
        subtitle=data.subtitle,
        icon_code=data.icon_code,
        layout=data.layout,
        columns=data.columns,
        is_default=data.is_default,
        is_system=False,
        is_active=True,
        validate_on_change=data.validate_on_change,
        show_required_indicator=data.show_required_indicator,
        settings=data.settings,
        status="active"
    )
    
    db.add(schema)
    db.commit()
    db.refresh(schema)
    
    return serialize_form_schema(schema)


@router.post("/seed")
def seed_default_forms(
    entity_types: Optional[str] = Query(None, description="Comma-separated entity types"),
    force: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Seed default forms for entity types"""
    if not force:
        existing = db.query(FormSchema).filter(
            FormSchema.is_system == True,
            FormSchema.org_id.is_(None)
        ).count()
        
        if existing > 0:
            return {
                "success": True,
                "message": f"Default forms already seeded ({existing} forms)",
                "count": existing
            }
    
    types_to_seed = entity_types.split(",") if entity_types else list(DEFAULT_FORMS.keys())
    
    created_schemas = 0
    created_sections = 0
    created_fields = 0
    
    for entity_type in types_to_seed:
        if entity_type not in DEFAULT_FORMS:
            continue
        
        for form_type, form_def in DEFAULT_FORMS[entity_type].items():
            # Check existing
            existing = db.query(FormSchema).filter(
                FormSchema.schema_code == form_def["code"],
                FormSchema.org_id.is_(None)
            ).first()
            
            if existing:
                continue
            
            # Create schema
            schema = FormSchema(
                org_id=None,
                entity_type=entity_type,
                form_type=form_type,
                schema_code=form_def["code"],
                schema_name=form_def["name"],
                schema_name_vi=form_def["name"],
                is_default=(form_type == "create"),
                is_system=True,
                is_active=True,
                layout="vertical",
                columns=1,
                status="active"
            )
            db.add(schema)
            db.flush()
            created_schemas += 1
            
            # Create sections
            for section_order, section_def in enumerate(form_def.get("sections", [])):
                section = FormSection(
                    schema_id=schema.id,
                    section_code=section_def["code"],
                    section_name=section_def["name"],
                    section_name_vi=section_def["name"],
                    sort_order=section_order,
                    icon_code=section_def.get("icon"),
                    is_collapsible=section_def.get("is_collapsible", False),
                    is_collapsed_default=section_def.get("is_collapsed_default", False),
                    is_visible=True,
                    columns=1,
                    layout="vertical"
                )
                db.add(section)
                db.flush()
                created_sections += 1
                
                # Create fields
                for field_order, field_def in enumerate(section_def.get("fields", [])):
                    # Find attribute by code
                    attr = db.query(EntityAttribute).filter(
                        EntityAttribute.entity_type == entity_type,
                        EntityAttribute.attribute_code == field_def["attribute_code"],
                        EntityAttribute.org_id.is_(None)
                    ).first()
                    
                    if not attr:
                        continue
                    
                    field = FormField(
                        section_id=section.id,
                        attribute_id=attr.id,
                        sort_order=field_order,
                        layout=field_def.get("layout", "full"),
                        is_required_override=field_def.get("is_required_override"),
                        is_visible=True,
                        is_hidden=False
                    )
                    db.add(field)
                    created_fields += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Created {created_schemas} forms, {created_sections} sections, {created_fields} fields",
        "schemas_created": created_schemas,
        "sections_created": created_sections,
        "fields_created": created_fields
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{schema_id}/sections", response_model=dict, status_code=201)
def add_section(
    schema_id: UUID,
    data: SectionCreate,
    db: Session = Depends(get_db)
):
    """Add a section to a form schema"""
    schema = db.query(FormSchema).filter(
        FormSchema.id == schema_id,
        FormSchema.deleted_at.is_(None)
    ).first()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Form schema not found")
    
    # Check duplicate section code
    existing = db.query(FormSection).filter(
        FormSection.schema_id == schema_id,
        FormSection.section_code == data.section_code,
        FormSection.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Section '{data.section_code}' already exists in this form"
        )
    
    section = FormSection(
        schema_id=schema_id,
        section_code=data.section_code,
        section_name=data.section_name,
        section_name_vi=data.section_name_vi,
        description=data.description,
        sort_order=data.sort_order,
        icon_code=data.icon_code,
        color_code=data.color_code,
        columns=data.columns,
        layout=data.layout,
        is_collapsible=data.is_collapsible,
        is_collapsed_default=data.is_collapsed_default,
        is_visible=data.is_visible,
        visibility_conditions=data.visibility_conditions
    )
    
    db.add(section)
    db.commit()
    db.refresh(section)
    
    return serialize_section(section)


@router.put("/sections/{section_id}", response_model=dict)
def update_section(
    section_id: UUID,
    data: SectionUpdate,
    db: Session = Depends(get_db)
):
    """Update a form section"""
    section = db.query(FormSection).filter(
        FormSection.id == section_id,
        FormSection.deleted_at.is_(None)
    ).first()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(section, field, value)
    
    section.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(section)
    
    return serialize_section(section)


@router.delete("/sections/{section_id}")
def delete_section(
    section_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a form section"""
    section = db.query(FormSection).filter(
        FormSection.id == section_id,
        FormSection.deleted_at.is_(None)
    ).first()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Check if schema is system
    schema = db.query(FormSchema).filter(FormSchema.id == section.schema_id).first()
    if schema and schema.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete section from system form")
    
    section.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"success": True, "message": f"Section '{section.section_code}' deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# FIELD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/sections/{section_id}/fields", response_model=dict, status_code=201)
def add_field(
    section_id: UUID,
    data: FieldCreate,
    db: Session = Depends(get_db)
):
    """Add a field to a form section"""
    section = db.query(FormSection).filter(
        FormSection.id == section_id,
        FormSection.deleted_at.is_(None)
    ).first()
    
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Get schema for entity_type
    schema = db.query(FormSchema).filter(FormSchema.id == section.schema_id).first()
    
    # Find attribute
    attribute_id = data.attribute_id
    if not attribute_id and data.attribute_code:
        attr = db.query(EntityAttribute).filter(
            EntityAttribute.entity_type == schema.entity_type,
            EntityAttribute.attribute_code == data.attribute_code,
            EntityAttribute.deleted_at.is_(None)
        ).first()
        if attr:
            attribute_id = attr.id
    
    if not attribute_id:
        raise HTTPException(status_code=400, detail="Must provide attribute_id or valid attribute_code")
    
    # Check duplicate
    existing = db.query(FormField).filter(
        FormField.section_id == section_id,
        FormField.attribute_id == attribute_id,
        FormField.deleted_at.is_(None)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Field already exists in this section")
    
    # Validate layout
    valid_layouts = [fl.value for fl in FieldLayout]
    if data.layout not in valid_layouts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid layout. Must be one of: {', '.join(valid_layouts)}"
        )
    
    field = FormField(
        section_id=section_id,
        attribute_id=attribute_id,
        sort_order=data.sort_order,
        layout=data.layout,
        row_group=data.row_group,
        label_override=data.label_override,
        placeholder_override=data.placeholder_override,
        help_text_override=data.help_text_override,
        is_required_override=data.is_required_override,
        is_readonly_override=data.is_readonly_override,
        is_visible=data.is_visible,
        is_hidden=data.is_hidden,
        visibility_conditions=data.visibility_conditions,
        required_conditions=data.required_conditions,
        default_value_override=data.default_value_override,
        css_class=data.css_class,
        dependencies=data.dependencies
    )
    
    db.add(field)
    db.commit()
    db.refresh(field)
    
    return serialize_field(field)


@router.put("/fields/{field_id}", response_model=dict)
def update_field(
    field_id: UUID,
    data: FieldUpdate,
    db: Session = Depends(get_db)
):
    """Update a form field"""
    field = db.query(FormField).options(
        selectinload(FormField.attribute)
    ).filter(
        FormField.id == field_id,
        FormField.deleted_at.is_(None)
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Validate layout if provided
    if data.layout:
        valid_layouts = [fl.value for fl in FieldLayout]
        if data.layout not in valid_layouts:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid layout. Must be one of: {', '.join(valid_layouts)}"
            )
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)
    
    field.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(field)
    
    return serialize_field(field)


@router.delete("/fields/{field_id}")
def delete_field(
    field_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a form field"""
    field = db.query(FormField).filter(
        FormField.id == field_id,
        FormField.deleted_at.is_(None)
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Check if parent schema is system
    section = db.query(FormSection).filter(FormSection.id == field.section_id).first()
    if section:
        schema = db.query(FormSchema).filter(FormSchema.id == section.schema_id).first()
        if schema and schema.is_system:
            raise HTTPException(status_code=400, detail="Cannot delete field from system form")
    
    field.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"success": True, "message": "Field deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# PARAMETERIZED ROUTES (MUST BE LAST!)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{id}", response_model=dict)
def get_form_schema(
    id: UUID,
    include_details: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get form schema by ID"""
    query = db.query(FormSchema).filter(
        FormSchema.id == id,
        FormSchema.deleted_at.is_(None)
    )
    
    if include_details:
        query = query.options(
            selectinload(FormSchema.sections).selectinload(FormSection.fields).selectinload(FormField.attribute)
        )
    
    schema = query.first()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Form schema not found")
    
    return serialize_form_schema(schema, include_details=include_details)


@router.put("/{id}", response_model=dict)
def update_form_schema(
    id: UUID,
    data: FormSchemaUpdate,
    db: Session = Depends(get_db)
):
    """Update a form schema"""
    schema = db.query(FormSchema).filter(
        FormSchema.id == id,
        FormSchema.deleted_at.is_(None)
    ).first()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Form schema not found")
    
    if schema.is_system:
        protected_fields = ["schema_code", "entity_type", "form_type", "status"]
        update_data = data.model_dump(exclude_unset=True)
        for field in protected_fields:
            if field in update_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot modify '{field}' of system form"
                )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schema, field, value)
    
    schema.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(schema)
    
    return serialize_form_schema(schema)


@router.delete("/{id}")
def delete_form_schema(
    id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete a form schema"""
    schema = db.query(FormSchema).filter(
        FormSchema.id == id,
        FormSchema.deleted_at.is_(None)
    ).first()
    
    if not schema:
        raise HTTPException(status_code=404, detail="Form schema not found")
    
    if schema.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system form")
    
    schema.deleted_at = datetime.now(timezone.utc)
    schema.status = "inactive"
    db.commit()
    
    return {"success": True, "message": f"Form '{schema.schema_code}' deleted"}
