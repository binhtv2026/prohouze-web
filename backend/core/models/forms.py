"""
ProHouzing Form Schema Model
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 4

Entities:
- FormSchema (top-level form definition)
- FormSection (sections within a form)
- FormField (fields within sections, linked to attributes)

Purpose:
- Enable fully dynamic form rendering from database
- Support multi-tenant forms (org_id scope)
- Support context-specific forms (province, user role, etc.)
- Zero hardcoded forms in frontend

Design Principles:
- FormSchema → FormSections → FormFields → EntityAttributes
- All rendering info comes from DB
- Frontend only reads schema and renders
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from enum import Enum

from .base import CoreModel, SoftDeleteMixin, StatusMixin, GUID, JSONB, utc_now


class FormType(str, Enum):
    """Types of forms"""
    CREATE = "create"           # Form for creating new entity
    EDIT = "edit"               # Form for editing existing entity
    VIEW = "view"               # Read-only view
    QUICK_CREATE = "quick"      # Minimal quick create form
    IMPORT = "import"           # Import mapping form
    FILTER = "filter"           # Filter/search form


class FieldLayout(str, Enum):
    """Field layout options"""
    FULL = "full"               # Full width (100%)
    HALF = "half"               # Half width (50%)
    THIRD = "third"             # One third (33%)
    TWO_THIRDS = "two_thirds"   # Two thirds (66%)
    QUARTER = "quarter"         # Quarter width (25%)
    THREE_QUARTERS = "three_quarters"  # Three quarters (75%)


class FormSchema(CoreModel, SoftDeleteMixin, StatusMixin):
    """
    Form Schema - Top level form definition
    
    Defines a form for an entity type with its sections and fields.
    
    Example:
    - Entity: lead
    - Name: Lead Create Form
    - Form Type: create
    - Sections: Basic Info, Contact, Qualification
    """
    __tablename__ = "form_schemas"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SCOPE & IDENTITY
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Organization scope (NULL = system-wide default)
    org_id = Column(GUID(), nullable=True)
    
    # Target entity type
    entity_type = Column(String(50), nullable=False)  # lead, customer, deal, product, task
    
    # Form type
    form_type = Column(String(30), nullable=False, default="create")  # create, edit, view, quick, import, filter
    
    # Identity
    schema_code = Column(String(100), nullable=False)  # lead_create_default
    schema_name = Column(String(255), nullable=False)  # Lead Create Form
    schema_name_vi = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONTEXT & CONDITIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Context conditions (when to use this form)
    # JSONB for flexibility: {"province": "HCM", "role": "sales", "segment": "vip"}
    context_conditions = Column(JSONB, nullable=True)
    
    # Priority for matching (higher = more specific)
    priority = Column(Integer, default=0)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DISPLAY & BEHAVIOR
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Display settings
    title = Column(String(255), nullable=True)  # Form title for UI
    subtitle = Column(String(500), nullable=True)  # Subtitle/description
    icon_code = Column(String(50), nullable=True)
    
    # Layout settings
    layout = Column(String(30), default="vertical")  # vertical, horizontal, tabs, wizard
    columns = Column(Integer, default=1)  # Number of columns (1, 2, 3)
    
    # Behavior
    is_default = Column(Boolean, default=False)  # Default form for entity_type + form_type
    is_system = Column(Boolean, default=False)  # System form, cannot delete
    is_active = Column(Boolean, default=True)
    
    # Validation
    validate_on_change = Column(Boolean, default=False)  # Validate on field change
    show_required_indicator = Column(Boolean, default=True)  # Show * for required
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METADATA
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Extended settings
    settings = Column(JSONB, nullable=True, default=dict)
    # Example: {"submit_label": "Tạo Lead", "cancel_label": "Hủy", "show_reset": true}
    
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════════════════════
    
    sections = relationship(
        "FormSection",
        back_populates="schema",
        lazy="selectin",
        order_by="FormSection.sort_order"
    )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INDEXES & CONSTRAINTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    __table_args__ = (
        # Unique schema_code per org
        UniqueConstraint("org_id", "schema_code", name="uq_form_schema_org_code"),
        # Fast lookups
        Index("ix_form_schema_org_id", "org_id"),
        Index("ix_form_schema_entity_type", "entity_type"),
        Index("ix_form_schema_form_type", "form_type"),
        Index("ix_form_schema_code", "schema_code"),
        Index("ix_form_schema_default", "is_default"),
        Index("ix_form_schema_status", "status"),
        # Composite for common queries
        Index("ix_form_schema_org_entity_type", "org_id", "entity_type", "form_type"),
    )
    
    def __repr__(self):
        return f"<FormSchema {self.entity_type}.{self.schema_code}>"
    
    def matches_context(self, context: dict) -> bool:
        """Check if this form matches the given context"""
        if not self.context_conditions:
            return True  # No conditions = matches all
        
        for key, value in self.context_conditions.items():
            if key not in context:
                return False
            if context[key] != value:
                return False
        
        return True


class FormSection(CoreModel, SoftDeleteMixin):
    """
    Form Section - Groups fields within a form
    
    Example sections:
    - Basic Information
    - Contact Details
    - Qualification
    - Notes
    """
    __tablename__ = "form_sections"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REFERENCES
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Parent schema
    schema_id = Column(GUID(), ForeignKey("form_schemas.id", ondelete="CASCADE"), nullable=False)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # IDENTITY
    # ═══════════════════════════════════════════════════════════════════════════
    
    section_code = Column(String(100), nullable=False)  # basic_info
    section_name = Column(String(255), nullable=False)  # Thông tin cơ bản
    section_name_vi = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DISPLAY
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Order in form
    sort_order = Column(Integer, default=0)
    
    # Visual
    icon_code = Column(String(50), nullable=True)
    color_code = Column(String(20), nullable=True)
    
    # Layout
    columns = Column(Integer, default=1)  # Columns within this section
    layout = Column(String(30), default="vertical")  # vertical, horizontal, grid
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BEHAVIOR
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Visibility
    is_collapsible = Column(Boolean, default=False)
    is_collapsed_default = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    
    # Conditions for showing section
    # JSONB: {"show_if": {"field": "customer_type", "value": "corporate"}}
    visibility_conditions = Column(JSONB, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METADATA
    # ═══════════════════════════════════════════════════════════════════════════
    
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════════════════════
    
    schema = relationship("FormSchema", back_populates="sections")
    fields = relationship(
        "FormField",
        back_populates="section",
        lazy="selectin",
        order_by="FormField.sort_order"
    )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INDEXES & CONSTRAINTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    __table_args__ = (
        # Unique section_code per schema
        UniqueConstraint("schema_id", "section_code", name="uq_form_section_schema_code"),
        Index("ix_form_section_schema_id", "schema_id"),
        Index("ix_form_section_code", "section_code"),
        Index("ix_form_section_order", "schema_id", "sort_order"),
    )
    
    def __repr__(self):
        return f"<FormSection {self.section_code}>"


class FormField(CoreModel, SoftDeleteMixin):
    """
    Form Field - Individual field in a form section
    
    Links to EntityAttribute for data type and validation.
    Adds form-specific settings like layout, visibility conditions.
    """
    __tablename__ = "form_fields"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REFERENCES
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Parent section
    section_id = Column(GUID(), ForeignKey("form_sections.id", ondelete="CASCADE"), nullable=False)
    
    # Linked attribute (source of data type, validation, options)
    attribute_id = Column(GUID(), ForeignKey("entity_attributes.id"), nullable=False)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DISPLAY
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Order within section
    sort_order = Column(Integer, default=0)
    
    # Layout
    layout = Column(String(30), default="full")  # full, half, third, two_thirds, quarter
    
    # Row grouping (fields with same row_group appear on same row)
    row_group = Column(Integer, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # OVERRIDES (form-specific overrides of attribute settings)
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Label override (NULL = use attribute name)
    label_override = Column(String(255), nullable=True)
    
    # Placeholder override
    placeholder_override = Column(String(255), nullable=True)
    
    # Help text override
    help_text_override = Column(Text, nullable=True)
    
    # Required override (NULL = use attribute is_required)
    is_required_override = Column(Boolean, nullable=True)
    
    # Read-only override
    is_readonly_override = Column(Boolean, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # VISIBILITY & CONDITIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    is_visible = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)  # Hidden but submitted
    
    # Conditional visibility
    # JSONB: {"show_if": {"field": "has_co_buyer", "operator": "equals", "value": true}}
    visibility_conditions = Column(JSONB, nullable=True)
    
    # Conditional required
    # JSONB: {"required_if": {"field": "payment_method", "value": "bank_transfer"}}
    required_conditions = Column(JSONB, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ADVANCED
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Default value override (form-specific default)
    default_value_override = Column(JSONB, nullable=True)
    
    # Custom CSS class
    css_class = Column(String(255), nullable=True)
    
    # Custom validation (additional to attribute validation)
    custom_validation = Column(JSONB, nullable=True)
    
    # Dependencies (fields that affect this field)
    # JSONB: [{"field": "province", "action": "filter_options", "source": "district"}]
    dependencies = Column(JSONB, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METADATA
    # ═══════════════════════════════════════════════════════════════════════════
    
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════════════════════
    
    section = relationship("FormSection", back_populates="fields")
    attribute = relationship("EntityAttribute")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INDEXES & CONSTRAINTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    __table_args__ = (
        # One attribute per section (can't have same field twice in a section)
        UniqueConstraint("section_id", "attribute_id", name="uq_form_field_section_attr"),
        Index("ix_form_field_section_id", "section_id"),
        Index("ix_form_field_attribute_id", "attribute_id"),
        Index("ix_form_field_order", "section_id", "sort_order"),
        Index("ix_form_field_row", "section_id", "row_group"),
    )
    
    def __repr__(self):
        return f"<FormField {self.attribute_id} in {self.section_id}>"
    
    def get_effective_required(self, attribute) -> bool:
        """Get effective required state (override or attribute default)"""
        if self.is_required_override is not None:
            return self.is_required_override
        return attribute.is_required if attribute else False
    
    def get_effective_label(self, attribute) -> str:
        """Get effective label (override or attribute name)"""
        if self.label_override:
            return self.label_override
        return attribute.attribute_name if attribute else ""
    
    def get_effective_placeholder(self, attribute) -> str:
        """Get effective placeholder"""
        if self.placeholder_override:
            return self.placeholder_override
        return attribute.placeholder if attribute else ""


# ═══════════════════════════════════════════════════════════════════════════════
# DEFAULT FORM DEFINITIONS (for seeding)
# ═══════════════════════════════════════════════════════════════════════════════

DEFAULT_FORMS = {
    "lead": {
        "create": {
            "code": "lead_create_default",
            "name": "Tạo Lead Mới",
            "sections": [
                {
                    "code": "basic_info",
                    "name": "Thông tin cơ bản",
                    "icon": "user",
                    "fields": [
                        {"attribute_code": "full_name", "layout": "full", "is_required_override": True},
                    ]
                },
                {
                    "code": "contact",
                    "name": "Thông tin liên hệ",
                    "icon": "phone",
                    "fields": [
                        {"attribute_code": "phone", "layout": "half", "is_required_override": True},
                        {"attribute_code": "email", "layout": "half"},
                    ]
                },
                {
                    "code": "source",
                    "name": "Nguồn",
                    "icon": "globe",
                    "fields": [
                        {"attribute_code": "source_channel", "layout": "full"},
                    ]
                },
                {
                    "code": "qualification",
                    "name": "Đánh giá",
                    "icon": "star",
                    "is_collapsible": True,
                    "fields": [
                        {"attribute_code": "intent_level", "layout": "half"},
                        {"attribute_code": "lead_status", "layout": "half"},
                    ]
                },
                {
                    "code": "notes",
                    "name": "Ghi chú",
                    "icon": "sticky-note",
                    "is_collapsible": True,
                    "is_collapsed_default": True,
                    "fields": [
                        {"attribute_code": "notes", "layout": "full"},
                    ]
                },
            ]
        },
        "quick": {
            "code": "lead_quick_create",
            "name": "Tạo nhanh Lead",
            "sections": [
                {
                    "code": "quick_info",
                    "name": "Thông tin",
                    "fields": [
                        {"attribute_code": "full_name", "layout": "full", "is_required_override": True},
                        {"attribute_code": "phone", "layout": "half", "is_required_override": True},
                        {"attribute_code": "source_channel", "layout": "half"},
                    ]
                }
            ]
        }
    },
    "customer": {
        "create": {
            "code": "customer_create_default",
            "name": "Tạo Khách hàng",
            "sections": [
                {
                    "code": "basic_info",
                    "name": "Thông tin cơ bản",
                    "icon": "user",
                    "fields": [
                        {"attribute_code": "full_name", "layout": "full", "is_required_override": True},
                        {"attribute_code": "date_of_birth", "layout": "half"},
                        {"attribute_code": "gender", "layout": "half"},
                    ]
                },
                {
                    "code": "contact",
                    "name": "Liên hệ",
                    "icon": "phone",
                    "fields": [
                        {"attribute_code": "phone", "layout": "half", "is_required_override": True},
                        {"attribute_code": "email", "layout": "half"},
                    ]
                },
                {
                    "code": "segment",
                    "name": "Phân loại",
                    "icon": "tags",
                    "fields": [
                        {"attribute_code": "customer_stage", "layout": "half"},
                        {"attribute_code": "segment_code", "layout": "half"},
                    ]
                }
            ]
        }
    },
    "deal": {
        "create": {
            "code": "deal_create_default",
            "name": "Tạo Deal",
            "sections": [
                {
                    "code": "basic_info",
                    "name": "Thông tin Deal",
                    "icon": "handshake",
                    "fields": [
                        {"attribute_code": "deal_name", "layout": "full", "is_required_override": True},
                        {"attribute_code": "current_stage", "layout": "half"},
                        {"attribute_code": "sales_channel", "layout": "half"},
                    ]
                },
                {
                    "code": "financial",
                    "name": "Tài chính",
                    "icon": "dollar-sign",
                    "fields": [
                        {"attribute_code": "expected_value", "layout": "half"},
                        {"attribute_code": "expected_close_date", "layout": "half"},
                    ]
                }
            ]
        }
    },
    "product": {
        "create": {
            "code": "product_create_default",
            "name": "Tạo Sản phẩm",
            "sections": [
                {
                    "code": "basic_info",
                    "name": "Thông tin cơ bản",
                    "icon": "home",
                    "fields": [
                        {"attribute_code": "product_name", "layout": "full", "is_required_override": True},
                        {"attribute_code": "product_code", "layout": "half"},
                        {"attribute_code": "product_type", "layout": "half"},
                    ]
                },
                {
                    "code": "specs",
                    "name": "Thông số",
                    "icon": "ruler-combined",
                    "fields": [
                        {"attribute_code": "floor_area", "layout": "third"},
                        {"attribute_code": "bedrooms", "layout": "third"},
                        {"attribute_code": "bathrooms", "layout": "third"},
                    ]
                },
                {
                    "code": "pricing",
                    "name": "Giá cả",
                    "icon": "tag",
                    "fields": [
                        {"attribute_code": "base_price", "layout": "half"},
                        {"attribute_code": "legal_type", "layout": "half"},
                    ]
                }
            ]
        }
    },
    "task": {
        "create": {
            "code": "task_create_default",
            "name": "Tạo Task",
            "sections": [
                {
                    "code": "basic_info",
                    "name": "Thông tin Task",
                    "icon": "tasks",
                    "fields": [
                        {"attribute_code": "task_title", "layout": "full", "is_required_override": True},
                        {"attribute_code": "task_type", "layout": "half"},
                        {"attribute_code": "priority", "layout": "half"},
                    ]
                },
                {
                    "code": "schedule",
                    "name": "Thời gian",
                    "icon": "calendar",
                    "fields": [
                        {"attribute_code": "due_date", "layout": "full"},
                    ]
                },
                {
                    "code": "details",
                    "name": "Chi tiết",
                    "icon": "file-alt",
                    "is_collapsible": True,
                    "fields": [
                        {"attribute_code": "description", "layout": "full"},
                    ]
                }
            ]
        }
    }
}
