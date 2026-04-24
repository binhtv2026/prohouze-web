"""
ProHouzing Config API
Version: 1.0 - Prompt 3/20

API endpoints for Dynamic Data Foundation:
- Master Data (picklists, statuses, categories)
- Entity Schemas (field definitions, forms)

This allows the frontend to dynamically fetch configuration
instead of hardcoding values, enabling:
1. Tenant customization without code changes
2. Consistent data across frontend and backend
3. Easy updates to picklists and schemas
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from config.master_data import (
    MASTER_DATA_REGISTRY,
    get_master_data,
    get_master_data_items,
    get_item_by_code,
    get_label_by_code,
    to_select_options,
    MasterDataCategory,
    MasterDataItem,
)
from config.entity_schemas import (
    ENTITY_SCHEMAS,
    get_schema,
    get_all_schemas,
    get_fields_by_section,
    get_fields_with_flag,
    get_filterable_fields,
    get_list_columns,
    get_form_fields,
    get_required_fields,
    EntitySchema,
    FieldDefinition,
)
from config.governance_foundation import (
    CANONICAL_DOMAINS,
    STATUS_MODELS,
    STATUS_RULES,
    APPROVAL_FLOWS,
    APPROVAL_RULES,
    AUDIT_RULES,
    TIMELINE_STREAMS,
    AUDIT_DELIVERABLES,
    CRITICAL_MOMENTS,
    FOUNDATION_RULES,
    MIGRATION_PRIORITIES,
    FOUNDATION_DELIVERABLES,
    CHANGE_MANAGEMENT_QUEUE,
    get_entity_governance,
    get_entity_governance_index,
    get_governance_summary,
    get_status_normalization_hints,
    get_status_model_for_master_data_key,
)

router = APIRouter(prefix="/api/config", tags=["Configuration"])


# ============================================
# RESPONSE MODELS
# ============================================

class MasterDataItemResponse(BaseModel):
    """Response model for a single master data item"""
    code: str
    label: str
    label_en: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    group: Optional[str] = None
    order: int = 0
    is_active: bool = True
    metadata: Dict[str, Any] = {}


class MasterDataCategoryResponse(BaseModel):
    """Response model for a master data category"""
    key: str
    label: str
    label_en: Optional[str] = None
    description: Optional[str] = None
    items: List[MasterDataItemResponse]
    is_editable: bool = True
    is_extendable: bool = True


class SelectOptionResponse(BaseModel):
    """Simple select option format"""
    value: str
    label: str


class FieldDefinitionResponse(BaseModel):
    """Response model for field definition"""
    key: str
    label: str
    label_en: Optional[str] = None
    type: str
    layer: str
    flags: List[str] = []
    section: Optional[str] = None
    order: int = 0
    options: Dict[str, Any] = {}
    validation: Dict[str, Any] = {}
    default_value: Optional[Any] = None
    visible_when: Dict[str, Any] = {}
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    system: bool = False
    readonly: bool = False


class SectionDefinitionResponse(BaseModel):
    """Response model for form section"""
    key: str
    label: str
    label_en: Optional[str] = None
    order: int = 0
    collapsible: bool = False
    collapsed_by_default: bool = False


class EntitySchemaResponse(BaseModel):
    """Response model for entity schema"""
    entity: str
    label: str
    label_plural: str
    label_en: Optional[str] = None
    label_plural_en: Optional[str] = None
    icon: Optional[str] = None
    primary_field: str
    fields: List[FieldDefinitionResponse]
    sections: List[SectionDefinitionResponse]


class EntitySchemaSummary(BaseModel):
    """Summary of entity schema for listing"""
    entity: str
    label: str
    label_plural: str
    icon: Optional[str] = None
    field_count: int
    section_count: int


class GovernanceSummaryResponse(BaseModel):
    domain_count: int
    mapped_entity_count: int
    status_model_count: int
    approval_flow_count: int
    timeline_stream_count: int
    critical_moment_count: int


class GovernanceDomainResponse(BaseModel):
    domain: str
    purpose: str
    entities: List[str]
    workflows: List[str]
    governance: List[str]


class GovernanceEntityMappingResponse(BaseModel):
    entity: str
    domain: str
    purpose: str
    workflows: List[str]
    controls: List[str]
    linked_status_models: List[str]
    linked_approval_flows: List[str]
    linked_timeline_streams: List[str]


class MasterDataAlignmentFieldReference(BaseModel):
    entity: str
    entity_label: str
    field_key: str
    field_label: str
    field_type: str
    section: Optional[str] = None


class MasterDataAlignmentResponse(BaseModel):
    category_key: str
    category_label: str
    item_count: int
    linked_entities: List[str]
    linked_fields: List[MasterDataAlignmentFieldReference]
    linked_status_model: Optional[str] = None
    governance_domain: Optional[str] = None


class EntitySchemaAlignmentResponse(BaseModel):
    entity: str
    entity_label: str
    governance_domain: Optional[str] = None
    master_data_dependencies: List[str]
    master_data_fields: List[MasterDataAlignmentFieldReference]
    status_models: List[str]
    approval_flows: List[str]
    timeline_streams: List[str]


class GovernanceCoverageResponse(BaseModel):
    total_master_data_categories: int
    mapped_master_data_categories: int
    unmapped_master_data_categories: int
    total_entity_schemas: int
    mapped_entity_schemas: int
    entities_without_master_data_dependencies: int
    entities_without_status_models: int
    entities_without_approval_flows: int
    entities_without_timeline_streams: int
    uncovered_master_data_categories: List[str]
    uncovered_entities: List[str]


class StatusAlignmentResponse(BaseModel):
    category_key: str
    category_label: str
    status_model_code: Optional[str] = None
    master_data_states: List[str]
    canonical_states: List[str]
    master_only_states: List[str]
    model_only_states: List[str]
    aligned: bool
    recommended_action: str
    remediation_priority: str


class GovernanceRemediationItemResponse(BaseModel):
    title: str
    severity: str
    owner_area: str
    target_route: str
    detail: str


class StatusNormalizationSuggestionResponse(BaseModel):
    category_key: str
    category_label: str
    status_model_code: Optional[str] = None
    legacy_state: str
    suggested_canonical_state: Optional[str] = None
    suggestion_type: str
    rationale: str


class GovernanceChangeRequestResponse(BaseModel):
    id: str
    title: str
    module: str
    change_type: str
    priority: str
    status: str
    owner: str
    impact: str
    next_action: str


# ============================================
# GOVERNANCE FOUNDATION ENDPOINTS
# ============================================

@router.get("/governance/summary", response_model=GovernanceSummaryResponse)
async def get_governance_foundation_summary():
    """Get summary metrics for phase-1 governance foundation."""
    return GovernanceSummaryResponse(**get_governance_summary())


@router.get("/governance/canonical-domains", response_model=List[GovernanceDomainResponse])
async def list_governance_canonical_domains():
    """List canonical domains that define the phase-1 business operating model."""
    return [GovernanceDomainResponse(**domain) for domain in CANONICAL_DOMAINS]


@router.get("/governance/status-models")
async def list_governance_status_models():
    """List canonical status models."""
    return STATUS_MODELS


@router.get("/governance/status-rules")
async def list_governance_status_rules():
    """List cross-cutting rules for canonical status models."""
    return STATUS_RULES


@router.get("/governance/approval-flows")
async def list_governance_approval_flows():
    """List canonical approval flows."""
    return APPROVAL_FLOWS


@router.get("/governance/approval-rules")
async def list_governance_approval_rules():
    """List approval guardrails shared across phase-1 workflows."""
    return APPROVAL_RULES


@router.get("/governance/audit-rules")
async def list_governance_audit_rules():
    """List audit guardrails for sensitive operations."""
    return AUDIT_RULES


@router.get("/governance/timeline-streams")
async def list_governance_timeline_streams():
    """List canonical timeline streams."""
    return TIMELINE_STREAMS


@router.get("/governance/audit-deliverables")
async def list_governance_audit_deliverables():
    """List phase-1 audit/timeline deliverables."""
    return AUDIT_DELIVERABLES


@router.get("/governance/foundation-rules")
async def list_governance_foundation_rules():
    """List phase-1 data foundation rules."""
    return FOUNDATION_RULES


@router.get("/governance/migration-priorities")
async def list_governance_migration_priorities():
    """List migration priorities for phase 1."""
    return MIGRATION_PRIORITIES


@router.get("/governance/foundation-deliverables")
async def list_governance_foundation_deliverables():
    """List data foundation deliverables."""
    return FOUNDATION_DELIVERABLES


@router.get("/governance/change-management", response_model=List[GovernanceChangeRequestResponse])
async def list_governance_change_management_queue():
    """List prioritized change requests for governance-controlled rollout."""
    return [GovernanceChangeRequestResponse(**item) for item in CHANGE_MANAGEMENT_QUEUE]


@router.get("/governance/critical-moments")
async def list_governance_critical_moments():
    """List critical moments that must be tracked in phase 1."""
    return CRITICAL_MOMENTS


@router.get("/governance/entity-mapping", response_model=List[GovernanceEntityMappingResponse])
async def list_governance_entity_mappings():
    """Flatten domain -> entity governance mapping for phase-1 controls."""
    return [GovernanceEntityMappingResponse(**item) for item in get_entity_governance_index()]


@router.get("/governance/entity-mapping/{entity}", response_model=GovernanceEntityMappingResponse)
async def get_governance_entity_mapping(entity: str):
    """Get governance mapping for one canonical entity."""
    mapping = get_entity_governance(entity)
    if not mapping:
        raise HTTPException(status_code=404, detail=f"Governance mapping for entity '{entity}' not found")
    return GovernanceEntityMappingResponse(**mapping)


@router.get("/governance/master-data-alignment", response_model=List[MasterDataAlignmentResponse])
async def list_master_data_alignment():
    """Map master data categories to entity schema fields and governance domains."""
    entity_governance_index = {item["entity"]: item for item in get_entity_governance_index()}
    alignments = []

    for category_key, category in MASTER_DATA_REGISTRY.items():
        linked_fields = []
        linked_entities = set()
        governance_domain = None

        for entity_name, schema in ENTITY_SCHEMAS.items():
            for field in schema.fields:
                if field.options.get("source") == category_key:
                    linked_entities.add(entity_name)
                    linked_fields.append(
                        MasterDataAlignmentFieldReference(
                            entity=entity_name,
                            entity_label=schema.label,
                            field_key=field.key,
                            field_label=field.label,
                            field_type=field.type.value,
                            section=field.section,
                        )
                    )
                    if not governance_domain:
                        governance_domain = entity_governance_index.get(entity_name, {}).get("domain")

        alignments.append(
            MasterDataAlignmentResponse(
                category_key=category.key,
                category_label=category.label,
                item_count=len(category.items),
                linked_entities=sorted(linked_entities),
                linked_fields=linked_fields,
                linked_status_model=get_status_model_for_master_data_key(category.key),
                governance_domain=governance_domain,
            )
        )

    return alignments


@router.get("/governance/entity-schema-alignment", response_model=List[EntitySchemaAlignmentResponse])
async def list_entity_schema_alignment():
    """Map entity schemas to master data dependencies and governance controls."""
    governance_index = {item["entity"]: item for item in get_entity_governance_index()}
    alignments = []

    for entity_name, schema in ENTITY_SCHEMAS.items():
        governance_mapping = governance_index.get(entity_name, {})
        master_data_fields = []
        master_data_dependencies = []

        for field in schema.fields:
            source = field.options.get("source")
            if source:
                master_data_dependencies.append(source)
                master_data_fields.append(
                    MasterDataAlignmentFieldReference(
                        entity=entity_name,
                        entity_label=schema.label,
                        field_key=field.key,
                        field_label=field.label,
                        field_type=field.type.value,
                        section=field.section,
                    )
                )

        alignments.append(
            EntitySchemaAlignmentResponse(
                entity=entity_name,
                entity_label=schema.label,
                governance_domain=governance_mapping.get("domain"),
                master_data_dependencies=sorted(set(master_data_dependencies)),
                master_data_fields=master_data_fields,
                status_models=governance_mapping.get("linked_status_models", []),
                approval_flows=governance_mapping.get("linked_approval_flows", []),
                timeline_streams=governance_mapping.get("linked_timeline_streams", []),
            )
        )

    return alignments


@router.get("/governance/coverage", response_model=GovernanceCoverageResponse)
async def get_governance_coverage():
    """Aggregate coverage metrics for governance, master data and entity schema alignment."""
    master_data_alignment = await list_master_data_alignment()
    entity_schema_alignment = await list_entity_schema_alignment()

    uncovered_master_data_categories = [
        item.category_key for item in master_data_alignment if len(item.linked_entities) == 0
    ]
    uncovered_entities = [
        item.entity for item in entity_schema_alignment
        if len(item.master_data_dependencies) == 0
        or len(item.status_models) == 0
    ]

    return GovernanceCoverageResponse(
        total_master_data_categories=len(master_data_alignment),
        mapped_master_data_categories=sum(1 for item in master_data_alignment if len(item.linked_entities) > 0),
        unmapped_master_data_categories=sum(1 for item in master_data_alignment if len(item.linked_entities) == 0),
        total_entity_schemas=len(entity_schema_alignment),
        mapped_entity_schemas=sum(1 for item in entity_schema_alignment if item.governance_domain),
        entities_without_master_data_dependencies=sum(1 for item in entity_schema_alignment if len(item.master_data_dependencies) == 0),
        entities_without_status_models=sum(1 for item in entity_schema_alignment if len(item.status_models) == 0),
        entities_without_approval_flows=sum(1 for item in entity_schema_alignment if len(item.approval_flows) == 0),
        entities_without_timeline_streams=sum(1 for item in entity_schema_alignment if len(item.timeline_streams) == 0),
        uncovered_master_data_categories=uncovered_master_data_categories,
        uncovered_entities=sorted(set(uncovered_entities)),
    )


@router.get("/governance/status-alignment", response_model=List[StatusAlignmentResponse])
async def list_status_alignment():
    """Compare master-data status categories against canonical status models."""
    status_models_by_code = {item["code"]: item for item in STATUS_MODELS}
    candidate_categories = [
        key for key in MASTER_DATA_REGISTRY.keys()
        if key.endswith("_statuses") or key.endswith("_stages")
    ]
    result = []

    for category_key in candidate_categories:
        category = MASTER_DATA_REGISTRY[category_key]
        model_code = get_status_model_for_master_data_key(category_key)
        model = status_models_by_code.get(model_code)
        master_states = [item.code for item in category.items]
        canonical_states = model.get("states", []) if model else []
        master_only = [state for state in master_states if state not in canonical_states]
        model_only = [state for state in canonical_states if state not in master_states]

        result.append(
            StatusAlignmentResponse(
                category_key=category.key,
                category_label=category.label,
                status_model_code=model_code,
                master_data_states=master_states,
                canonical_states=canonical_states,
                master_only_states=master_only,
                model_only_states=model_only,
                aligned=(len(master_only) == 0 and len(model_only) == 0 and model_code is not None),
                recommended_action=(
                    "Dong bo master data ve canonical state machine va loai bo/trich xuat cac trang thai legacy."
                    if model_code and (len(master_only) > 0 or len(model_only) > 0)
                    else "Map category nay vao canonical model truoc khi xem la completed."
                    if model_code is None
                    else "Khong can hanh dong."
                ),
                remediation_priority=(
                    "critical"
                    if category.key in {"lead_statuses", "deal_stages", "booking_statuses", "contract_statuses"}
                    and (len(master_only) > 0 or len(model_only) > 0)
                    else "high"
                    if (len(master_only) > 0 or len(model_only) > 0)
                    else "ok"
                ),
            )
        )

    return result


@router.get("/governance/status-normalization", response_model=List[StatusNormalizationSuggestionResponse])
async def list_status_normalization_suggestions():
    """Suggest canonical normalization for legacy status values."""
    status_alignment = await list_status_alignment()
    suggestions = []

    for item in status_alignment:
        hints = get_status_normalization_hints(item.category_key)

        for state in item.master_only_states:
            suggested_state = hints.get(state)
            suggestions.append(
                StatusNormalizationSuggestionResponse(
                    category_key=item.category_key,
                    category_label=item.category_label,
                    status_model_code=item.status_model_code,
                    legacy_state=state,
                    suggested_canonical_state=suggested_state,
                    suggestion_type="map" if suggested_state else "review",
                    rationale=(
                        f"Map '{state}' ve canonical state '{suggested_state}' de dong bo dashboard va workflow."
                        if suggested_state
                        else "Legacy state nay chua co mapping goi y. Can review voi business owner truoc khi merge."
                    ),
                )
            )

        for state in item.model_only_states:
            suggestions.append(
                StatusNormalizationSuggestionResponse(
                    category_key=item.category_key,
                    category_label=item.category_label,
                    status_model_code=item.status_model_code,
                    legacy_state=state,
                    suggested_canonical_state=state,
                    suggestion_type="add",
                    rationale="Canonical state nay chua ton tai trong master data. Nen bo sung de state machine day du.",
                )
            )

    return suggestions


@router.get("/governance/remediation-plan", response_model=List[GovernanceRemediationItemResponse])
async def list_governance_remediation_plan():
    """Provide prioritized remediation actions for phase-1 governance gaps."""
    coverage = await get_governance_coverage()
    status_alignment = await list_status_alignment()

    plan = []

    for item in status_alignment:
      if not item.aligned:
        plan.append(
            GovernanceRemediationItemResponse(
                title=f"Chuan hoa {item.category_key}",
                severity=item.remediation_priority,
                owner_area="Master Data + Status Model",
                target_route="/settings/governance-remediation",
                detail=item.recommended_action,
            )
        )

    if coverage.unmapped_master_data_categories > 0:
        plan.append(
            GovernanceRemediationItemResponse(
                title="Gan category master data chua duoc schema su dung",
                severity="high",
                owner_area="Master Data + Entity Schemas",
                target_route="/settings/master-data",
                detail="Ra soat cac category chua co field bindings va quyet dinh giu, map, hoac loai bo.",
            )
        )

    if coverage.entities_without_master_data_dependencies > 0:
        plan.append(
            GovernanceRemediationItemResponse(
                title="Bo sung master data dependencies cho entity schemas",
                severity="high",
                owner_area="Entity Schemas",
                target_route="/settings/entity-schemas",
                detail="Cac entity core can duoc noi voi master data categories de tranh hardcode gia tri.",
            )
        )

    if coverage.entities_without_approval_flows > 0 or coverage.entities_without_timeline_streams > 0:
        plan.append(
            GovernanceRemediationItemResponse(
                title="Hoan tat approval/timeline hooks cho entity nhay cam",
                severity="medium",
                owner_area="Governance",
                target_route="/settings/entity-governance",
                detail="Tiep tuc bo sung control hooks cho cac entity co giao dich, booking, contract va finance.",
            )
        )

    severity_rank = {"critical": 0, "high": 1, "medium": 2, "ok": 3}
    return sorted(plan, key=lambda item: severity_rank.get(item.severity, 99))


# ============================================
# MASTER DATA ENDPOINTS
# ============================================

@router.get("/master-data", response_model=Dict[str, MasterDataCategoryResponse])
async def get_all_master_data():
    """
    Get all master data categories
    
    Returns a dictionary of all master data categories with their items.
    This is useful for frontend initialization to cache all picklists at once.
    """
    result = {}
    for key, category in MASTER_DATA_REGISTRY.items():
        result[key] = MasterDataCategoryResponse(
            key=category.key,
            label=category.label,
            label_en=category.label_en,
            description=category.description,
            items=[
                MasterDataItemResponse(**item.model_dump())
                for item in category.items
                if item.is_active
            ],
            is_editable=category.is_editable,
            is_extendable=category.is_extendable,
        )
    return result


@router.get("/master-data/{category_key}", response_model=MasterDataCategoryResponse)
async def get_master_data_category(category_key: str):
    """
    Get a specific master data category
    
    - **category_key**: The key of the category (e.g., 'lead_statuses', 'lead_sources')
    """
    category = get_master_data(category_key)
    if not category:
        raise HTTPException(status_code=404, detail=f"Master data category '{category_key}' not found")
    
    return MasterDataCategoryResponse(
        key=category.key,
        label=category.label,
        label_en=category.label_en,
        description=category.description,
        items=[
            MasterDataItemResponse(**item.model_dump())
            for item in category.items
            if item.is_active
        ],
        is_editable=category.is_editable,
        is_extendable=category.is_extendable,
    )


@router.get("/master-data/{category_key}/items", response_model=List[MasterDataItemResponse])
async def get_master_data_category_items(
    category_key: str,
    group: Optional[str] = None,
    include_inactive: bool = False
):
    """
    Get items from a master data category
    
    - **category_key**: The key of the category
    - **group**: Optional filter by group
    - **include_inactive**: Include inactive items
    """
    category = get_master_data(category_key)
    if not category:
        raise HTTPException(status_code=404, detail=f"Master data category '{category_key}' not found")
    
    items = category.items
    
    if not include_inactive:
        items = [item for item in items if item.is_active]
    
    if group:
        items = [item for item in items if item.group == group]
    
    return [MasterDataItemResponse(**item.model_dump()) for item in items]


@router.get("/master-data/{category_key}/select-options", response_model=List[SelectOptionResponse])
async def get_master_data_select_options(category_key: str):
    """
    Get master data as simple select options
    
    Returns items in a simple {value, label} format for dropdown/select components.
    
    - **category_key**: The key of the category
    """
    options = to_select_options(category_key)
    if not options:
        raise HTTPException(status_code=404, detail=f"Master data category '{category_key}' not found")
    
    return [SelectOptionResponse(**opt) for opt in options]


@router.get("/master-data/{category_key}/item/{code}", response_model=MasterDataItemResponse)
async def get_master_data_item(category_key: str, code: str):
    """
    Get a single master data item by code
    
    - **category_key**: The key of the category
    - **code**: The code of the item
    """
    item = get_item_by_code(category_key, code)
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Item with code '{code}' not found in category '{category_key}'"
        )
    
    return MasterDataItemResponse(**item.model_dump())


@router.get("/master-data/{category_key}/label/{code}")
async def get_master_data_label(category_key: str, code: str):
    """
    Get just the label for a code
    
    Quick endpoint to resolve a code to its display label.
    
    - **category_key**: The key of the category
    - **code**: The code of the item
    """
    label = get_label_by_code(category_key, code)
    return {"code": code, "label": label}


# ============================================
# ENTITY SCHEMA ENDPOINTS
# ============================================

@router.get("/entity-schemas", response_model=List[EntitySchemaSummary])
async def list_entity_schemas():
    """
    List all available entity schemas
    
    Returns a summary of all registered entity schemas.
    """
    result = []
    for entity_name, schema in ENTITY_SCHEMAS.items():
        result.append(EntitySchemaSummary(
            entity=schema.entity,
            label=schema.label,
            label_plural=schema.label_plural,
            icon=schema.icon,
            field_count=len(schema.fields),
            section_count=len(schema.sections),
        ))
    return result


@router.get("/entity-schemas/{entity}", response_model=EntitySchemaResponse)
async def get_entity_schema(entity: str):
    """
    Get the full schema for an entity
    
    Returns complete field definitions, sections, and validation rules
    for building dynamic forms.
    
    - **entity**: Entity name (e.g., 'lead', 'task', 'project', 'deal')
    """
    schema = get_schema(entity)
    if not schema:
        raise HTTPException(status_code=404, detail=f"Entity schema '{entity}' not found")
    
    return EntitySchemaResponse(
        entity=schema.entity,
        label=schema.label,
        label_plural=schema.label_plural,
        label_en=schema.label_en,
        label_plural_en=schema.label_plural_en,
        icon=schema.icon,
        primary_field=schema.primary_field,
        fields=[
            FieldDefinitionResponse(
                key=f.key,
                label=f.label,
                label_en=f.label_en,
                type=f.type.value,
                layer=f.layer.value,
                flags=f.flags,
                section=f.section,
                order=f.order,
                options=f.options,
                validation=f.validation,
                default_value=f.default_value,
                visible_when=f.visible_when,
                placeholder=f.placeholder,
                help_text=f.help_text,
                system=f.system,
                readonly=f.readonly,
            )
            for f in schema.fields
        ],
        sections=[
            SectionDefinitionResponse(
                key=s.key,
                label=s.label,
                label_en=s.label_en,
                order=s.order,
                collapsible=s.collapsible,
                collapsed_by_default=s.collapsed_by_default,
            )
            for s in schema.sections
        ],
    )


@router.get("/entity-schemas/{entity}/fields", response_model=List[FieldDefinitionResponse])
async def get_entity_fields(
    entity: str,
    section: Optional[str] = None,
    flag: Optional[str] = None,
    exclude_system: bool = True
):
    """
    Get fields for an entity with optional filtering
    
    - **entity**: Entity name
    - **section**: Filter by section key
    - **flag**: Filter by flag (e.g., 'required', 'filterable', 'searchable')
    - **exclude_system**: Exclude system fields (id, created_at, etc.)
    """
    schema = get_schema(entity)
    if not schema:
        raise HTTPException(status_code=404, detail=f"Entity schema '{entity}' not found")
    
    fields = schema.fields
    
    if exclude_system:
        fields = [f for f in fields if not f.system]
    
    if section:
        fields = [f for f in fields if f.section == section]
    
    if flag:
        fields = [f for f in fields if flag in f.flags]
    
    return [
        FieldDefinitionResponse(
            key=f.key,
            label=f.label,
            label_en=f.label_en,
            type=f.type.value,
            layer=f.layer.value,
            flags=f.flags,
            section=f.section,
            order=f.order,
            options=f.options,
            validation=f.validation,
            default_value=f.default_value,
            visible_when=f.visible_when,
            placeholder=f.placeholder,
            help_text=f.help_text,
            system=f.system,
            readonly=f.readonly,
        )
        for f in sorted(fields, key=lambda x: x.order)
    ]


@router.get("/entity-schemas/{entity}/form-config")
async def get_entity_form_config(entity: str):
    """
    Get form configuration for an entity
    
    Returns a structured configuration optimized for rendering forms,
    with fields grouped by sections.
    """
    schema = get_schema(entity)
    if not schema:
        raise HTTPException(status_code=404, detail=f"Entity schema '{entity}' not found")
    
    # Group fields by section
    sections_with_fields = []
    for section in sorted(schema.sections, key=lambda s: s.order):
        section_fields = get_fields_by_section(schema, section.key)
        # Exclude system fields from form
        section_fields = [f for f in section_fields if not f.system]
        
        if section_fields:
            sections_with_fields.append({
                "key": section.key,
                "label": section.label,
                "label_en": section.label_en,
                "order": section.order,
                "collapsible": section.collapsible,
                "collapsed_by_default": section.collapsed_by_default,
                "fields": [
                    {
                        "key": f.key,
                        "label": f.label,
                        "type": f.type.value,
                        "flags": f.flags,
                        "options": f.options,
                        "validation": f.validation,
                        "default_value": f.default_value,
                        "placeholder": f.placeholder,
                        "help_text": f.help_text,
                        "visible_when": f.visible_when,
                        "readonly": f.readonly,
                    }
                    for f in section_fields
                ]
            })
    
    return {
        "entity": schema.entity,
        "label": schema.label,
        "sections": sections_with_fields,
        "validation_rules": [
            {"rule": r.rule, "message": r.message, "fields": r.fields}
            for r in schema.validation_rules
        ]
    }


@router.get("/entity-schemas/{entity}/list-config")
async def get_entity_list_config(entity: str):
    """
    Get list/table configuration for an entity
    
    Returns columns configuration for rendering data tables.
    """
    schema = get_schema(entity)
    if not schema:
        raise HTTPException(status_code=404, detail=f"Entity schema '{entity}' not found")
    
    list_fields = get_list_columns(schema)
    
    return {
        "entity": schema.entity,
        "label": schema.label_plural,
        "primary_field": schema.primary_field,
        "columns": [
            {
                "key": f.key,
                "label": f.label,
                "type": f.type.value,
                "sortable": "sortable" in f.flags,
                "options": f.options,
            }
            for f in list_fields
        ],
        "filters": [
            {
                "key": f.key,
                "label": f.label,
                "type": f.type.value,
                "options": f.options,
            }
            for f in get_filterable_fields(schema)
            if f.type.value == "select" or f.type.value == "multi_select"
        ],
    }


@router.get("/entity-schemas/{entity}/export-config")
async def get_entity_export_config(entity: str):
    """
    Get export configuration for an entity
    
    Returns fields available for export with their labels.
    """
    schema = get_schema(entity)
    if not schema:
        raise HTTPException(status_code=404, detail=f"Entity schema '{entity}' not found")
    
    exportable = get_fields_with_flag(schema, "exportable")
    
    return {
        "entity": schema.entity,
        "label": schema.label_plural,
        "fields": [
            {
                "key": f.key,
                "label": f.label,
                "label_en": f.label_en,
                "type": f.type.value,
            }
            for f in exportable
        ]
    }


@router.get("/entity-schemas/{entity}/import-config")
async def get_entity_import_config(entity: str):
    """
    Get import configuration for an entity
    
    Returns importable fields with their aliases for column mapping.
    """
    schema = get_schema(entity)
    if not schema:
        raise HTTPException(status_code=404, detail=f"Entity schema '{entity}' not found")
    
    importable = get_fields_with_flag(schema, "importable")
    required = get_required_fields(schema)
    required_keys = [f.key for f in required if "importable" in f.flags]
    
    return {
        "entity": schema.entity,
        "label": schema.label_plural,
        "required_fields": required_keys,
        "fields": [
            {
                "key": f.key,
                "label": f.label,
                "type": f.type.value,
                "required": f.key in required_keys,
                "aliases": f.import_aliases,
                "validation": f.validation,
            }
            for f in importable
        ],
        "global_aliases": schema.import_aliases,
    }


# ============================================
# UTILITY ENDPOINTS
# ============================================

@router.get("/categories")
async def list_all_categories():
    """
    List all available master data category keys
    """
    return {
        "categories": list(MASTER_DATA_REGISTRY.keys()),
        "entities": list(ENTITY_SCHEMAS.keys()),
    }


@router.get("/resolve-labels")
async def resolve_labels(
    category: str,
    codes: str = Query(..., description="Comma-separated codes")
):
    """
    Resolve multiple codes to labels at once
    
    - **category**: Master data category key
    - **codes**: Comma-separated list of codes
    """
    code_list = [c.strip() for c in codes.split(",")]
    result = {}
    for code in code_list:
        result[code] = get_label_by_code(category, code)
    return result



# ============================================
# MASTER DATA CRUD ENDPOINTS (Admin Only)
# Note: These endpoints modify in-memory data only
# For production, implement persistence to database
# ============================================

class MasterDataItemCreate(BaseModel):
    """Request model for creating a master data item"""
    code: str
    label: str
    label_en: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    group: Optional[str] = None
    order: int = 0
    is_active: bool = True
    metadata: Dict[str, Any] = {}


class MasterDataItemUpdate(BaseModel):
    """Request model for updating a master data item"""
    label: Optional[str] = None
    label_en: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    group: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/master-data/{category_key}/items", response_model=MasterDataItemResponse)
async def create_master_data_item(category_key: str, item: MasterDataItemCreate):
    """
    Create a new item in a master data category
    
    Note: This modifies in-memory data. For production, implement database persistence.
    
    - **category_key**: The key of the category
    - **item**: The item to create
    """
    from config.master_data import MASTER_DATA_REGISTRY, MasterDataItem
    
    category = MASTER_DATA_REGISTRY.get(category_key)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_key}' not found")
    
    if not category.is_extendable:
        raise HTTPException(status_code=403, detail=f"Category '{category_key}' does not allow adding items")
    
    # Check for duplicate code
    existing_codes = [i.code for i in category.items]
    if item.code in existing_codes:
        raise HTTPException(status_code=400, detail=f"Item with code '{item.code}' already exists")
    
    # Create new item
    new_item = MasterDataItem(
        code=item.code,
        label=item.label,
        label_en=item.label_en,
        color=item.color,
        icon=item.icon,
        group=item.group,
        order=item.order if item.order else len(category.items) + 1,
        is_active=item.is_active,
        metadata=item.metadata,
    )
    
    # Add to category
    category.items.append(new_item)
    
    return MasterDataItemResponse(**new_item.model_dump())


@router.put("/master-data/{category_key}/items/{code}", response_model=MasterDataItemResponse)
async def update_master_data_item(category_key: str, code: str, update: MasterDataItemUpdate):
    """
    Update an existing item in a master data category
    
    Note: This modifies in-memory data. For production, implement database persistence.
    
    - **category_key**: The key of the category
    - **code**: The code of the item to update
    - **update**: The fields to update
    """
    from config.master_data import MASTER_DATA_REGISTRY
    
    category = MASTER_DATA_REGISTRY.get(category_key)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_key}' not found")
    
    if not category.is_editable:
        raise HTTPException(status_code=403, detail=f"Category '{category_key}' is not editable")
    
    # Find item
    item = None
    for i in category.items:
        if i.code == code:
            item = i
            break
    
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{code}' not found in category '{category_key}'")
    
    # Update fields
    if update.label is not None:
        item.label = update.label
    if update.label_en is not None:
        item.label_en = update.label_en
    if update.color is not None:
        item.color = update.color
    if update.icon is not None:
        item.icon = update.icon
    if update.group is not None:
        item.group = update.group
    if update.order is not None:
        item.order = update.order
    if update.is_active is not None:
        item.is_active = update.is_active
    if update.metadata is not None:
        item.metadata = update.metadata
    
    return MasterDataItemResponse(**item.model_dump())


@router.delete("/master-data/{category_key}/items/{code}")
async def delete_master_data_item(category_key: str, code: str):
    """
    Delete (deactivate) an item from a master data category
    
    Note: This soft-deletes by setting is_active=False
    
    - **category_key**: The key of the category
    - **code**: The code of the item to delete
    """
    from config.master_data import MASTER_DATA_REGISTRY
    
    category = MASTER_DATA_REGISTRY.get(category_key)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_key}' not found")
    
    if not category.is_editable:
        raise HTTPException(status_code=403, detail=f"Category '{category_key}' is not editable")
    
    # Find and deactivate item
    for item in category.items:
        if item.code == code:
            item.is_active = False
            return {"message": f"Item '{code}' deactivated successfully"}
    
    raise HTTPException(status_code=404, detail=f"Item '{code}' not found in category '{category_key}'")


@router.post("/master-data/{category_key}/items/{code}/activate")
async def activate_master_data_item(category_key: str, code: str):
    """
    Re-activate a deactivated item
    
    - **category_key**: The key of the category
    - **code**: The code of the item to activate
    """
    from config.master_data import MASTER_DATA_REGISTRY
    
    category = MASTER_DATA_REGISTRY.get(category_key)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_key}' not found")
    
    for item in category.items:
        if item.code == code:
            item.is_active = True
            return {"message": f"Item '{code}' activated successfully"}
    
    raise HTTPException(status_code=404, detail=f"Item '{code}' not found in category '{category_key}'")
