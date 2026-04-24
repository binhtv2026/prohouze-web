"""
ProHouzing Attribute Engine Model
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 3

Entities:
- EntityAttribute (field definitions)
- EntityAttributeValue (field values)

Purpose:
- Enable fully dynamic custom fields for any entity
- Support multi-tenant with org_id scope
- Power dynamic forms and no-code CRM
- Foundation for AI-driven data capture

Design Principles:
- Schema-less: All values stored as JSONB
- Type-safe: data_type + validation_rules
- Extensible: options, metadata for future features
- Performant: Proper indexing for queries
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, Index, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum

from .base import CoreModel, SoftDeleteMixin, StatusMixin, GUID, JSONB, ARRAY, utc_now


class AttributeDataType(str, Enum):
    """Supported data types for attributes"""
    STRING = "string"           # Text, varchar
    TEXT = "text"               # Long text, textarea
    NUMBER = "number"           # Integer or decimal
    DECIMAL = "decimal"         # Decimal with precision
    BOOLEAN = "boolean"         # True/False
    DATE = "date"               # Date only
    DATETIME = "datetime"       # Date + time
    TIME = "time"               # Time only
    SELECT = "select"           # Single select from options
    MULTI_SELECT = "multi_select"  # Multiple select
    EMAIL = "email"             # Email validation
    PHONE = "phone"             # Phone number
    URL = "url"                 # URL validation
    FILE = "file"               # File upload
    IMAGE = "image"             # Image upload
    JSON = "json"               # Raw JSON
    REFERENCE = "reference"     # Reference to another entity
    CURRENCY = "currency"       # Money with currency code
    PERCENTAGE = "percentage"   # Percentage value
    RATING = "rating"           # Star rating (1-5)
    COLOR = "color"             # Color picker (hex)
    LOCATION = "location"       # Lat/lng coordinates


class AttributeScope(str, Enum):
    """Scope of attribute visibility"""
    SYSTEM = "system"           # System-defined, all orgs
    ORG = "org"                 # Org-specific custom field
    MODULE = "module"           # Module-specific


class EntityAttribute(CoreModel, SoftDeleteMixin, StatusMixin):
    """
    Entity Attribute Definition
    
    Defines custom fields that can be attached to any entity type.
    
    Example:
    - Entity: lead
    - Code: budget_range
    - Name: Ngân sách dự kiến
    - Data Type: select
    - Options: [<1B, 1-3B, 3-5B, >5B]
    """
    __tablename__ = "entity_attributes"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SCOPE & IDENTITY
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Organization scope (NULL = system-wide)
    org_id = Column(GUID(), nullable=True)
    
    # Target entity type
    entity_type = Column(String(50), nullable=False)  # lead, customer, deal, product, task
    
    # Identity (unique per org + entity_type)
    attribute_code = Column(String(100), nullable=False)  # budget_range
    attribute_name = Column(String(255), nullable=False)  # Ngân sách dự kiến
    attribute_name_vi = Column(String(255), nullable=True)  # Vietnamese name
    attribute_name_en = Column(String(255), nullable=True)  # English name
    description = Column(Text, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DATA TYPE & VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Data type determines UI control and validation
    data_type = Column(String(30), nullable=False, default="string")
    
    # Validation rules (JSONB)
    # Examples:
    # - string: {"min_length": 1, "max_length": 255, "pattern": "^[A-Z]+$"}
    # - number: {"min": 0, "max": 1000000000, "precision": 2}
    # - date: {"min_date": "2020-01-01", "max_date": "2030-12-31"}
    # - select: handled by options field
    validation_rules = Column(JSONB, nullable=True, default=dict)
    
    # Required field?
    is_required = Column(Boolean, default=False)
    
    # Default value (JSONB to support any type)
    default_value = Column(JSONB, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SELECT OPTIONS (for select/multi_select types)
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Options for select/multi_select (JSONB array)
    # Format: [{"value": "opt1", "label": "Option 1", "color": "#FF0000"}, ...]
    options = Column(JSONB, nullable=True)
    
    # Reference to master_data category (alternative to inline options)
    options_source = Column(String(100), nullable=True)  # master_data category_code
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REFERENCE TYPE (for reference data_type)
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Target entity for reference type
    reference_entity_type = Column(String(50), nullable=True)  # customer, product, user
    reference_display_field = Column(String(100), nullable=True)  # Field to display
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DISPLAY & UI
    # ═══════════════════════════════════════════════════════════════════════════
    
    # UI hints
    placeholder = Column(String(255), nullable=True)
    help_text = Column(Text, nullable=True)
    icon_code = Column(String(50), nullable=True)
    
    # Display order in forms
    sort_order = Column(Integer, default=0)
    
    # Group/Section
    group_code = Column(String(50), nullable=True)  # basic_info, contact, financial
    group_name = Column(String(100), nullable=True)
    
    # Visibility
    is_visible = Column(Boolean, default=True)  # Show in forms
    is_searchable = Column(Boolean, default=False)  # Include in search
    is_filterable = Column(Boolean, default=False)  # Show in filters
    is_sortable = Column(Boolean, default=False)  # Allow sorting
    is_readonly = Column(Boolean, default=False)  # Read-only field
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SYSTEM FLAGS
    # ═══════════════════════════════════════════════════════════════════════════
    
    # System attribute (maps to actual DB column)
    is_system = Column(Boolean, default=False)
    system_field_name = Column(String(100), nullable=True)  # Actual column name if system
    
    # Scope
    scope = Column(String(20), default="org")  # system/org/module
    
    # Module association
    module_code = Column(String(50), nullable=True)  # CRM, Sales, Inventory
    
    # ═══════════════════════════════════════════════════════════════════════════
    # METADATA
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    
    # Extended metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    values = relationship("EntityAttributeValue", back_populates="attribute", lazy="dynamic")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INDEXES & CONSTRAINTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    __table_args__ = (
        # Unique attribute_code per org + entity_type
        UniqueConstraint("org_id", "entity_type", "attribute_code", name="uq_entity_attr_org_type_code"),
        # Fast lookups
        Index("ix_entity_attr_org_id", "org_id"),
        Index("ix_entity_attr_entity_type", "entity_type"),
        Index("ix_entity_attr_code", "attribute_code"),
        Index("ix_entity_attr_data_type", "data_type"),
        Index("ix_entity_attr_group", "group_code"),
        Index("ix_entity_attr_status", "status"),
        Index("ix_entity_attr_system", "is_system"),
        # Composite for common queries
        Index("ix_entity_attr_org_entity", "org_id", "entity_type"),
        Index("ix_entity_attr_org_entity_group", "org_id", "entity_type", "group_code"),
    )
    
    def __repr__(self):
        return f"<EntityAttribute {self.entity_type}.{self.attribute_code}: {self.data_type}>"
    
    @property
    def is_global(self):
        """Check if this is a global/system attribute"""
        return self.org_id is None
    
    def validate_value(self, value) -> tuple:
        """
        Validate a value against this attribute's rules.
        Returns (is_valid, error_message)
        """
        # Required check
        if self.is_required and (value is None or value == "" or value == []):
            return False, f"{self.attribute_name} is required"
        
        # Skip further validation if empty and not required
        if value is None or value == "":
            return True, None
        
        rules = self.validation_rules or {}
        
        # Type-specific validation
        if self.data_type == "string" or self.data_type == "text":
            if not isinstance(value, str):
                return False, f"{self.attribute_name} must be text"
            if "min_length" in rules and len(value) < rules["min_length"]:
                return False, f"{self.attribute_name} must be at least {rules['min_length']} characters"
            if "max_length" in rules and len(value) > rules["max_length"]:
                return False, f"{self.attribute_name} must be at most {rules['max_length']} characters"
        
        elif self.data_type == "number" or self.data_type == "decimal":
            try:
                num_val = float(value)
                if "min" in rules and num_val < rules["min"]:
                    return False, f"{self.attribute_name} must be at least {rules['min']}"
                if "max" in rules and num_val > rules["max"]:
                    return False, f"{self.attribute_name} must be at most {rules['max']}"
            except (ValueError, TypeError):
                return False, f"{self.attribute_name} must be a number"
        
        elif self.data_type == "select":
            if self.options:
                valid_values = [opt.get("value") for opt in self.options]
                if value not in valid_values:
                    return False, f"{self.attribute_name} must be one of: {', '.join(valid_values)}"
        
        elif self.data_type == "multi_select":
            if self.options and isinstance(value, list):
                valid_values = [opt.get("value") for opt in self.options]
                for v in value:
                    if v not in valid_values:
                        return False, f"Invalid option '{v}' for {self.attribute_name}"
        
        elif self.data_type == "email":
            import re
            if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", str(value)):
                return False, f"{self.attribute_name} must be a valid email"
        
        elif self.data_type == "boolean":
            if not isinstance(value, bool):
                return False, f"{self.attribute_name} must be true or false"
        
        return True, None


class EntityAttributeValue(CoreModel):
    """
    Entity Attribute Value
    
    Stores actual values for custom attributes on entities.
    
    Design:
    - Polymorphic: entity_type + entity_id
    - Schema-less: value stored as JSONB
    - One row per attribute per entity
    """
    __tablename__ = "entity_attribute_values"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SCOPE & REFERENCES
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Organization scope
    org_id = Column(GUID(), nullable=True)
    
    # Attribute reference
    attribute_id = Column(GUID(), ForeignKey("entity_attributes.id"), nullable=False)
    
    # Polymorphic entity reference
    entity_type = Column(String(50), nullable=False)  # lead, customer, deal
    entity_id = Column(GUID(), nullable=False)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # VALUE STORAGE
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Value stored as JSONB (supports any type)
    # - string: "hello"
    # - number: 42 or 3.14
    # - boolean: true
    # - array: ["a", "b", "c"] (for multi_select)
    # - object: {"lat": 10.5, "lng": 106.7} (for location)
    value = Column(JSONB, nullable=True)
    
    # Denormalized text value for searching
    # Extracted from value for full-text search
    value_text = Column(Text, nullable=True)
    
    # Denormalized numeric value for sorting/filtering
    value_number = Column(Integer, nullable=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUDIT
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Who set this value
    set_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════════════════════
    
    attribute = relationship("EntityAttribute", back_populates="values")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INDEXES & CONSTRAINTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    __table_args__ = (
        # One value per attribute per entity
        UniqueConstraint("attribute_id", "entity_type", "entity_id", name="uq_attr_value_unique"),
        # Fast lookups
        Index("ix_attr_value_org_id", "org_id"),
        Index("ix_attr_value_attr_id", "attribute_id"),
        Index("ix_attr_value_entity", "entity_type", "entity_id"),
        Index("ix_attr_value_entity_type", "entity_type"),
        # For searching
        Index("ix_attr_value_text", "value_text"),
        Index("ix_attr_value_number", "value_number"),
        # Composite for common queries
        Index("ix_attr_value_org_entity", "org_id", "entity_type", "entity_id"),
        # JSONB index for value queries (GIN)
        Index("ix_attr_value_value_gin", "value", postgresql_using="gin"),
    )
    
    def __repr__(self):
        return f"<EntityAttributeValue {self.entity_type}:{self.entity_id} -> {self.attribute_id}>"
    
    def set_value(self, value, attribute: EntityAttribute = None):
        """Set value with denormalization for search/sort"""
        self.value = value
        
        # Denormalize for search
        if value is not None:
            if isinstance(value, str):
                self.value_text = value
            elif isinstance(value, (list, dict)):
                import json
                self.value_text = json.dumps(value)
            else:
                self.value_text = str(value)
            
            # Denormalize for numeric sorting
            if isinstance(value, (int, float)):
                self.value_number = int(value)
            elif attribute and attribute.data_type in ("number", "decimal", "currency", "percentage"):
                try:
                    self.value_number = int(float(value))
                except (ValueError, TypeError):
                    pass


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM ATTRIBUTE DEFINITIONS (for seeding)
# ═══════════════════════════════════════════════════════════════════════════════

# These map existing model fields to attributes for backward compatibility
SYSTEM_ATTRIBUTES = {
    "lead": [
        {"code": "full_name", "name": "Họ và tên", "data_type": "string", "is_required": True, "is_system": True, "system_field": "full_name", "group": "basic_info"},
        {"code": "phone", "name": "Số điện thoại", "data_type": "phone", "is_required": True, "is_system": True, "system_field": "phone", "group": "contact"},
        {"code": "email", "name": "Email", "data_type": "email", "is_system": True, "system_field": "email", "group": "contact"},
        {"code": "source_channel", "name": "Nguồn lead", "data_type": "select", "is_system": True, "system_field": "source_channel", "options_source": "lead_source", "group": "source"},
        {"code": "lead_status", "name": "Trạng thái", "data_type": "select", "is_system": True, "system_field": "lead_status", "options_source": "lead_status", "group": "status"},
        {"code": "intent_level", "name": "Mức độ quan tâm", "data_type": "select", "is_system": True, "system_field": "intent_level", "options_source": "intent_level", "group": "qualification"},
        {"code": "notes", "name": "Ghi chú", "data_type": "text", "is_system": True, "system_field": "notes", "group": "notes"},
    ],
    "customer": [
        {"code": "full_name", "name": "Họ và tên", "data_type": "string", "is_required": True, "is_system": True, "system_field": "full_name", "group": "basic_info"},
        {"code": "phone", "name": "Số điện thoại", "data_type": "phone", "is_required": True, "is_system": True, "system_field": "phone", "group": "contact"},
        {"code": "email", "name": "Email", "data_type": "email", "is_system": True, "system_field": "email", "group": "contact"},
        {"code": "customer_stage", "name": "Giai đoạn", "data_type": "select", "is_system": True, "system_field": "customer_stage", "options_source": "customer_stage", "group": "status"},
        {"code": "segment_code", "name": "Phân khúc", "data_type": "select", "is_system": True, "system_field": "segment_code", "options_source": "customer_segment", "group": "segment"},
        {"code": "date_of_birth", "name": "Ngày sinh", "data_type": "date", "is_system": True, "system_field": "date_of_birth", "group": "personal"},
        {"code": "gender", "name": "Giới tính", "data_type": "select", "is_system": True, "system_field": "gender", "group": "personal", "options": [
            {"value": "male", "label": "Nam"},
            {"value": "female", "label": "Nữ"},
            {"value": "other", "label": "Khác"},
        ]},
    ],
    "deal": [
        {"code": "deal_name", "name": "Tên deal", "data_type": "string", "is_required": True, "is_system": True, "system_field": "deal_name", "group": "basic_info"},
        {"code": "current_stage", "name": "Giai đoạn", "data_type": "select", "is_system": True, "system_field": "current_stage", "options_source": "deal_stage", "group": "status"},
        {"code": "sales_channel", "name": "Kênh bán", "data_type": "select", "is_system": True, "system_field": "sales_channel", "options_source": "sales_channel", "group": "source"},
        {"code": "expected_value", "name": "Giá trị dự kiến", "data_type": "currency", "is_system": True, "system_field": "expected_value", "group": "financial"},
        {"code": "expected_close_date", "name": "Ngày dự kiến chốt", "data_type": "date", "is_system": True, "system_field": "expected_close_date", "group": "timeline"},
        {"code": "lost_reason", "name": "Lý do mất", "data_type": "select", "is_system": True, "system_field": "lost_reason", "options_source": "lost_reason", "group": "status"},
    ],
    "product": [
        {"code": "product_name", "name": "Tên sản phẩm", "data_type": "string", "is_required": True, "is_system": True, "system_field": "product_name", "group": "basic_info"},
        {"code": "product_code", "name": "Mã sản phẩm", "data_type": "string", "is_system": True, "system_field": "product_code", "group": "basic_info"},
        {"code": "product_type", "name": "Loại sản phẩm", "data_type": "select", "is_system": True, "system_field": "product_type", "options_source": "product_type", "group": "type"},
        {"code": "legal_type", "name": "Pháp lý", "data_type": "select", "is_system": True, "system_field": "legal_type", "options_source": "legal_type", "group": "legal"},
        {"code": "base_price", "name": "Giá gốc", "data_type": "currency", "is_system": True, "system_field": "base_price", "group": "pricing"},
        {"code": "floor_area", "name": "Diện tích sàn", "data_type": "decimal", "is_system": True, "system_field": "floor_area", "group": "specs"},
        {"code": "bedrooms", "name": "Số phòng ngủ", "data_type": "number", "is_system": True, "system_field": "bedrooms", "group": "specs"},
        {"code": "bathrooms", "name": "Số phòng tắm", "data_type": "number", "is_system": True, "system_field": "bathrooms", "group": "specs"},
    ],
    "task": [
        {"code": "task_title", "name": "Tiêu đề", "data_type": "string", "is_required": True, "is_system": True, "system_field": "task_title", "group": "basic_info"},
        {"code": "task_type", "name": "Loại công việc", "data_type": "select", "is_system": True, "system_field": "task_type", "options_source": "task_type", "group": "type"},
        {"code": "priority", "name": "Độ ưu tiên", "data_type": "select", "is_system": True, "system_field": "priority", "options_source": "priority", "group": "priority"},
        {"code": "due_date", "name": "Hạn hoàn thành", "data_type": "datetime", "is_system": True, "system_field": "due_at", "group": "timeline"},
        {"code": "description", "name": "Mô tả", "data_type": "text", "is_system": True, "system_field": "description", "group": "details"},
    ],
}

# Attribute groups for UI organization
ATTRIBUTE_GROUPS = [
    {"code": "basic_info", "name": "Thông tin cơ bản", "sort": 1},
    {"code": "contact", "name": "Liên hệ", "sort": 2},
    {"code": "personal", "name": "Cá nhân", "sort": 3},
    {"code": "source", "name": "Nguồn", "sort": 4},
    {"code": "status", "name": "Trạng thái", "sort": 5},
    {"code": "qualification", "name": "Đánh giá", "sort": 6},
    {"code": "segment", "name": "Phân khúc", "sort": 7},
    {"code": "financial", "name": "Tài chính", "sort": 8},
    {"code": "timeline", "name": "Thời gian", "sort": 9},
    {"code": "type", "name": "Phân loại", "sort": 10},
    {"code": "legal", "name": "Pháp lý", "sort": 11},
    {"code": "pricing", "name": "Giá cả", "sort": 12},
    {"code": "specs", "name": "Thông số", "sort": 13},
    {"code": "priority", "name": "Ưu tiên", "sort": 14},
    {"code": "details", "name": "Chi tiết", "sort": 15},
    {"code": "notes", "name": "Ghi chú", "sort": 99},
    {"code": "custom", "name": "Tùy chỉnh", "sort": 100},
]
