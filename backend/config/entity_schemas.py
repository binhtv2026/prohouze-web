"""
ProHouzing Entity Schemas Configuration
Version: 1.0 - Prompt 3/20

Canonical field definitions for all major entities
Used for: Forms, Filters, Import/Export, Validation, Reports

This provides a structured way to define entity metadata that can be
used to dynamically generate forms, validation rules, and API schemas.
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum


# ============================================
# FIELD TYPE DEFINITIONS
# ============================================

class FieldType(str, Enum):
    """Supported field types"""
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    CURRENCY = "currency"
    DATE = "date"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    PHONE = "phone"
    EMAIL = "email"
    URL = "url"
    USER_PICKER = "user_picker"
    ENTITY_RELATION = "entity_relation"
    TAGS = "tags"
    FILE = "file"
    IMAGE = "image"
    HIDDEN = "hidden"
    RICH_TEXT = "rich_text"
    ADDRESS = "address"
    RATING = "rating"


class FieldFlag(str, Enum):
    """Capability flags for fields"""
    REQUIRED = "required"
    SEARCHABLE = "searchable"
    FILTERABLE = "filterable"
    SORTABLE = "sortable"
    REPORTABLE = "reportable"
    EXPORTABLE = "exportable"
    IMPORTABLE = "importable"
    EDITABLE = "editable"
    VISIBLE_IN_LIST = "visible_in_list"
    VISIBLE_IN_DETAIL = "visible_in_detail"
    VISIBLE_IN_FORM = "visible_in_form"
    UNIQUE = "unique"
    INDEXED = "indexed"


class FieldLayer(str, Enum):
    """Field categorization layer"""
    CORE = "core"  # System fields (id, created_at, etc.)
    BUSINESS = "business"  # Standard business fields
    EXTENSION = "extension"  # Custom/extension fields
    COMPUTED = "computed"  # Computed/derived fields


# ============================================
# FIELD DEFINITION MODEL
# ============================================

class FieldDefinition(BaseModel):
    """Definition of a single field"""
    key: str
    label: str
    label_en: Optional[str] = None
    type: FieldType
    layer: FieldLayer = FieldLayer.BUSINESS
    flags: List[str] = []
    section: Optional[str] = None
    order: int = 0
    
    # Type-specific options
    options: Dict[str, Any] = {}  # For SELECT: {source: "master_data_key"}
    
    # Validation
    validation: Dict[str, Any] = {}  # {min_length, max_length, pattern, min, max, etc.}
    
    # Default value
    default_value: Optional[Any] = None
    
    # Conditional visibility
    visible_when: Dict[str, Any] = {}  # {field: [values]}
    
    # Help text
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    
    # System flags
    system: bool = False  # True for id, created_at, etc.
    readonly: bool = False
    
    # Import aliases (for mapping imported data)
    import_aliases: List[str] = []


class SectionDefinition(BaseModel):
    """Definition of a form section"""
    key: str
    label: str
    label_en: Optional[str] = None
    order: int = 0
    collapsible: bool = False
    collapsed_by_default: bool = False


class EntityValidationRule(BaseModel):
    """Entity-level validation rule"""
    rule: str
    message: str
    fields: List[str] = []


class EntitySchema(BaseModel):
    """Complete schema definition for an entity"""
    entity: str
    label: str
    label_plural: str
    label_en: Optional[str] = None
    label_plural_en: Optional[str] = None
    icon: Optional[str] = None
    primary_field: str  # Field used as display name
    
    fields: List[FieldDefinition]
    sections: List[SectionDefinition] = []
    
    # Entity-level validation
    validation_rules: List[EntityValidationRule] = []
    
    # Import mapping
    import_aliases: Dict[str, List[str]] = {}
    
    # Permissions
    permissions: Dict[str, List[str]] = {}  # {action: [roles]}


# ============================================
# LEAD ENTITY SCHEMA
# ============================================

LEAD_SCHEMA = EntitySchema(
    entity="lead",
    label="Lead",
    label_plural="Leads",
    icon="users",
    primary_field="full_name",
    
    fields=[
        # Core System Fields
        FieldDefinition(
            key="id",
            label="ID",
            type=FieldType.TEXT,
            layer=FieldLayer.CORE,
            flags=["sortable"],
            system=True,
        ),
        FieldDefinition(
            key="created_at",
            label="Ngày tạo",
            label_en="Created At",
            type=FieldType.DATETIME,
            layer=FieldLayer.CORE,
            flags=["sortable", "filterable", "exportable"],
            system=True,
        ),
        FieldDefinition(
            key="updated_at",
            label="Cập nhật",
            label_en="Updated At",
            type=FieldType.DATETIME,
            layer=FieldLayer.CORE,
            flags=["sortable"],
            system=True,
        ),
        
        # Contact Info
        FieldDefinition(
            key="full_name",
            label="Họ tên",
            label_en="Full Name",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "sortable", "filterable", "exportable", "importable", "visible_in_list"],
            validation={"min_length": 2, "max_length": 100},
            section="contact",
            order=1,
            placeholder="Nguyễn Văn A",
            import_aliases=["name", "ho_ten", "hovaten", "customer_name", "khach_hang"],
        ),
        FieldDefinition(
            key="phone",
            label="Số điện thoại",
            label_en="Phone",
            type=FieldType.PHONE,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "filterable", "exportable", "importable", "visible_in_list", "unique"],
            validation={"pattern": r"^[0-9]{10,11}$"},
            section="contact",
            order=2,
            placeholder="0901234567",
            import_aliases=["sdt", "so_dien_thoai", "phone_number", "mobile", "contact"],
        ),
        FieldDefinition(
            key="email",
            label="Email",
            type=FieldType.EMAIL,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "filterable", "exportable", "importable"],
            section="contact",
            order=3,
            placeholder="email@example.com",
            import_aliases=["mail", "email_address"],
        ),
        
        # Source & Status
        FieldDefinition(
            key="status",
            label="Trạng thái",
            label_en="Status",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "reportable", "visible_in_list"],
            options={"source": "lead_statuses"},
            default_value="new",
            section="status",
            order=1,
        ),
        FieldDefinition(
            key="source",
            label="Nguồn",
            label_en="Source",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "importable", "reportable", "visible_in_list"],
            options={"source": "lead_sources"},
            default_value="website",
            section="source",
            order=1,
            import_aliases=["nguon", "channel", "kenh"],
        ),
        FieldDefinition(
            key="segment",
            label="Phân khúc",
            label_en="Segment",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "reportable"],
            options={"source": "lead_segments"},
            section="source",
            order=2,
        ),
        
        # Interest
        FieldDefinition(
            key="project_interest",
            label="Dự án quan tâm",
            label_en="Project Interest",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            options={"entity": "project"},
            section="interest",
            order=1,
        ),
        FieldDefinition(
            key="product_interest",
            label="Sản phẩm quan tâm",
            label_en="Product Interest",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "exportable", "importable"],
            section="interest",
            order=2,
        ),
        FieldDefinition(
            key="budget_min",
            label="Ngân sách tối thiểu",
            label_en="Minimum Budget",
            type=FieldType.CURRENCY,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            section="budget",
            order=1,
            placeholder="1,000,000,000",
        ),
        FieldDefinition(
            key="budget_max",
            label="Ngân sách tối đa",
            label_en="Maximum Budget",
            type=FieldType.CURRENCY,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            section="budget",
            order=2,
            placeholder="3,000,000,000",
        ),
        FieldDefinition(
            key="location",
            label="Khu vực",
            label_en="Location",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            options={"source": "provinces"},
            section="interest",
            order=3,
        ),
        
        # Assignment
        FieldDefinition(
            key="assigned_to",
            label="Người phụ trách",
            label_en="Assigned To",
            type=FieldType.USER_PICKER,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "visible_in_list"],
            section="assignment",
            order=1,
        ),
        FieldDefinition(
            key="assigned_at",
            label="Ngày phân công",
            label_en="Assigned At",
            type=FieldType.DATETIME,
            layer=FieldLayer.BUSINESS,
            flags=["sortable", "exportable"],
            section="assignment",
            order=2,
        ),
        
        # Activity & Score
        FieldDefinition(
            key="score",
            label="Điểm AI",
            label_en="AI Score",
            type=FieldType.NUMBER,
            layer=FieldLayer.COMPUTED,
            flags=["sortable", "filterable", "reportable", "visible_in_list"],
            readonly=True,
            section="activity",
            order=1,
        ),
        FieldDefinition(
            key="last_activity",
            label="Hoạt động cuối",
            label_en="Last Activity",
            type=FieldType.DATETIME,
            layer=FieldLayer.COMPUTED,
            flags=["sortable", "filterable"],
            readonly=True,
            section="activity",
            order=2,
        ),
        
        # Extension Fields
        FieldDefinition(
            key="notes",
            label="Ghi chú",
            label_en="Notes",
            type=FieldType.TEXTAREA,
            layer=FieldLayer.EXTENSION,
            flags=["searchable", "exportable", "importable"],
            section="notes",
            order=1,
            placeholder="Thông tin thêm về khách hàng...",
            import_aliases=["ghi_chu", "note", "comment"],
        ),
        FieldDefinition(
            key="tags",
            label="Tags",
            type=FieldType.TAGS,
            layer=FieldLayer.EXTENSION,
            flags=["filterable", "exportable", "importable"],
            section="tags",
            order=1,
        ),
        
        # Referral
        FieldDefinition(
            key="referrer_id",
            label="Người giới thiệu",
            label_en="Referrer",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable"],
            options={"entity": "collaborator"},
            section="referral",
            order=1,
        ),
    ],
    
    sections=[
        SectionDefinition(key="contact", label="Thông tin liên hệ", label_en="Contact Info", order=1),
        SectionDefinition(key="source", label="Nguồn & Phân khúc", label_en="Source & Segment", order=2),
        SectionDefinition(key="status", label="Trạng thái", label_en="Status", order=3),
        SectionDefinition(key="interest", label="Nhu cầu", label_en="Interest", order=4),
        SectionDefinition(key="budget", label="Ngân sách", label_en="Budget", order=5),
        SectionDefinition(key="assignment", label="Phân công", label_en="Assignment", order=6),
        SectionDefinition(key="activity", label="Hoạt động", label_en="Activity", order=7),
        SectionDefinition(key="referral", label="Giới thiệu", label_en="Referral", order=8, collapsible=True),
        SectionDefinition(key="notes", label="Ghi chú", label_en="Notes", order=9),
        SectionDefinition(key="tags", label="Tags", order=10, collapsible=True),
    ],
    
    validation_rules=[
        EntityValidationRule(
            rule="phone_or_email",
            message="Phải có ít nhất số điện thoại hoặc email",
            fields=["phone", "email"]
        ),
    ],
    
    import_aliases={
        "full_name": ["name", "ho_ten", "hovaten", "customer_name", "khach_hang"],
        "phone": ["sdt", "so_dien_thoai", "phone_number", "mobile", "contact"],
        "email": ["mail", "email_address"],
        "source": ["nguon", "channel", "kenh"],
        "notes": ["ghi_chu", "note", "comment"],
    },
)


# ============================================
# TASK ENTITY SCHEMA
# ============================================

TASK_SCHEMA = EntitySchema(
    entity="task",
    label="Task",
    label_plural="Tasks",
    label_en="Task",
    label_plural_en="Tasks",
    icon="check-square",
    primary_field="title",
    
    fields=[
        FieldDefinition(key="id", label="ID", type=FieldType.TEXT, layer=FieldLayer.CORE, flags=["sortable"], system=True),
        FieldDefinition(
            key="title",
            label="Tiêu đề",
            label_en="Title",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "sortable", "exportable", "importable", "visible_in_list"],
            validation={"min_length": 2, "max_length": 200},
            section="main",
            order=1,
        ),
        FieldDefinition(
            key="description",
            label="Mô tả",
            label_en="Description",
            type=FieldType.TEXTAREA,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "exportable"],
            section="main",
            order=2,
        ),
        FieldDefinition(
            key="status",
            label="Trạng thái",
            label_en="Status",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "reportable", "visible_in_list"],
            options={"source": "task_statuses"},
            default_value="todo",
            section="status",
            order=1,
        ),
        FieldDefinition(
            key="priority",
            label="Ưu tiên",
            label_en="Priority",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "visible_in_list"],
            options={"source": "task_priorities"},
            default_value="medium",
            section="status",
            order=2,
        ),
        FieldDefinition(
            key="type",
            label="Loại",
            label_en="Type",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable"],
            options={"source": "task_types"},
            default_value="task",
            section="status",
            order=3,
        ),
        FieldDefinition(
            key="assignee_id",
            label="Người thực hiện",
            label_en="Assignee",
            type=FieldType.USER_PICKER,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "visible_in_list"],
            section="assignment",
            order=1,
        ),
        FieldDefinition(
            key="due_date",
            label="Hạn hoàn thành",
            label_en="Due Date",
            type=FieldType.DATETIME,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "importable", "visible_in_list"],
            section="dates",
            order=1,
        ),
        FieldDefinition(
            key="related_lead_id",
            label="Lead liên quan",
            label_en="Related Lead",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable"],
            options={"entity": "lead"},
            section="relations",
            order=1,
        ),
        FieldDefinition(
            key="labels",
            label="Labels",
            type=FieldType.TAGS,
            layer=FieldLayer.EXTENSION,
            flags=["filterable", "exportable"],
            section="tags",
            order=1,
        ),
    ],
    
    sections=[
        SectionDefinition(key="main", label="Thông tin chính", label_en="Main Info", order=1),
        SectionDefinition(key="status", label="Trạng thái", label_en="Status", order=2),
        SectionDefinition(key="assignment", label="Phân công", label_en="Assignment", order=3),
        SectionDefinition(key="dates", label="Thời hạn", label_en="Dates", order=4),
        SectionDefinition(key="relations", label="Liên kết", label_en="Relations", order=5, collapsible=True),
        SectionDefinition(key="tags", label="Tags", order=6, collapsible=True),
    ],
)


# ============================================
# PROJECT ENTITY SCHEMA
# ============================================

PROJECT_SCHEMA = EntitySchema(
    entity="project",
    label="Dự án",
    label_plural="Dự án",
    label_en="Project",
    label_plural_en="Projects",
    icon="building-2",
    primary_field="name",
    
    fields=[
        FieldDefinition(key="id", label="ID", type=FieldType.TEXT, layer=FieldLayer.CORE, flags=["sortable"], system=True),
        FieldDefinition(
            key="name",
            label="Tên dự án",
            label_en="Project Name",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "sortable", "filterable", "exportable", "visible_in_list"],
            validation={"min_length": 2, "max_length": 200},
            section="main",
            order=1,
        ),
        FieldDefinition(
            key="slogan",
            label="Slogan",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["exportable"],
            section="main",
            order=2,
        ),
        FieldDefinition(
            key="type",
            label="Loại hình",
            label_en="Type",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "visible_in_list"],
            options={"source": "property_types"},
            section="type",
            order=1,
        ),
        FieldDefinition(
            key="status",
            label="Trạng thái",
            label_en="Status",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "visible_in_list"],
            options={"source": "project_statuses"},
            default_value="selling",
            section="type",
            order=2,
        ),
        FieldDefinition(
            key="province",
            label="Tỉnh/Thành phố",
            label_en="Province",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "importable"],
            options={"source": "provinces"},
            section="location",
            order=1,
        ),
        FieldDefinition(
            key="district",
            label="Quận/Huyện",
            label_en="District",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            section="location",
            order=2,
        ),
        FieldDefinition(
            key="address",
            label="Địa chỉ",
            label_en="Address",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "exportable", "importable"],
            section="location",
            order=3,
        ),
        FieldDefinition(
            key="priceFrom",
            label="Giá từ",
            label_en="Price From",
            type=FieldType.CURRENCY,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "importable", "visible_in_list"],
            section="price",
            order=1,
        ),
        FieldDefinition(
            key="priceTo",
            label="Giá đến",
            label_en="Price To",
            type=FieldType.CURRENCY,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            section="price",
            order=2,
        ),
        FieldDefinition(
            key="area",
            label="Diện tích",
            label_en="Area",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            section="specs",
            order=1,
        ),
        FieldDefinition(
            key="totalUnits",
            label="Tổng số căn",
            label_en="Total Units",
            type=FieldType.NUMBER,
            layer=FieldLayer.BUSINESS,
            flags=["sortable", "exportable", "importable"],
            section="inventory",
            order=1,
        ),
        FieldDefinition(
            key="availableUnits",
            label="Còn lại",
            label_en="Available Units",
            type=FieldType.NUMBER,
            layer=FieldLayer.COMPUTED,
            flags=["sortable", "exportable", "reportable"],
            readonly=True,
            section="inventory",
            order=2,
        ),
        FieldDefinition(
            key="description",
            label="Mô tả",
            label_en="Description",
            type=FieldType.TEXTAREA,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "exportable"],
            section="description",
            order=1,
        ),
        FieldDefinition(
            key="images",
            label="Hình ảnh",
            label_en="Images",
            type=FieldType.IMAGE,
            layer=FieldLayer.BUSINESS,
            flags=["exportable"],
            options={"multiple": True},
            section="media",
            order=1,
        ),
    ],
    
    sections=[
        SectionDefinition(key="main", label="Thông tin chính", label_en="Main Info", order=1),
        SectionDefinition(key="type", label="Phân loại", label_en="Classification", order=2),
        SectionDefinition(key="location", label="Vị trí", label_en="Location", order=3),
        SectionDefinition(key="price", label="Giá", label_en="Price", order=4),
        SectionDefinition(key="specs", label="Thông số", label_en="Specifications", order=5),
        SectionDefinition(key="inventory", label="Quỹ hàng", label_en="Inventory", order=6),
        SectionDefinition(key="description", label="Mô tả", label_en="Description", order=7),
        SectionDefinition(key="media", label="Hình ảnh", label_en="Media", order=8),
    ],
)


# ============================================
# DEAL ENTITY SCHEMA
# ============================================

DEAL_SCHEMA = EntitySchema(
    entity="deal",
    label="Deal",
    label_plural="Deals",
    icon="target",
    primary_field="name",
    
    fields=[
        FieldDefinition(key="id", label="ID", type=FieldType.TEXT, layer=FieldLayer.CORE, flags=["sortable"], system=True),
        FieldDefinition(
            key="name",
            label="Tên Deal",
            label_en="Deal Name",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "sortable", "exportable", "visible_in_list"],
            section="main",
            order=1,
        ),
        FieldDefinition(
            key="stage",
            label="Giai đoạn",
            label_en="Stage",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "filterable", "sortable", "exportable", "reportable", "visible_in_list"],
            options={"source": "deal_stages"},
            default_value="lead",
            section="stage",
            order=1,
        ),
        FieldDefinition(
            key="value",
            label="Giá trị",
            label_en="Value",
            type=FieldType.CURRENCY,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "reportable", "visible_in_list"],
            section="value",
            order=1,
        ),
        FieldDefinition(
            key="lead_id",
            label="Lead",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable"],
            options={"entity": "lead"},
            section="relations",
            order=1,
        ),
        FieldDefinition(
            key="project_id",
            label="Dự án",
            label_en="Project",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable"],
            options={"entity": "project"},
            section="relations",
            order=2,
        ),
        FieldDefinition(
            key="product_id",
            label="Sản phẩm",
            label_en="Product",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable"],
            options={"entity": "product"},
            section="relations",
            order=3,
        ),
        FieldDefinition(
            key="owner_id",
            label="Người phụ trách",
            label_en="Owner",
            type=FieldType.USER_PICKER,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable", "visible_in_list"],
            section="assignment",
            order=1,
        ),
        FieldDefinition(
            key="expected_close_date",
            label="Ngày dự kiến chốt",
            label_en="Expected Close Date",
            type=FieldType.DATE,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "sortable", "exportable"],
            section="dates",
            order=1,
        ),
        FieldDefinition(
            key="loss_reason",
            label="Lý do mất",
            label_en="Loss Reason",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "reportable"],
            options={"source": "loss_reasons"},
            section="outcome",
            order=1,
            visible_when={"stage": ["lost"]},
        ),
        FieldDefinition(
            key="notes",
            label="Ghi chú",
            label_en="Notes",
            type=FieldType.TEXTAREA,
            layer=FieldLayer.EXTENSION,
            flags=["exportable"],
            section="notes",
            order=1,
        ),
    ],
    
    sections=[
        SectionDefinition(key="main", label="Thông tin chính", label_en="Main Info", order=1),
        SectionDefinition(key="stage", label="Giai đoạn", label_en="Stage", order=2),
        SectionDefinition(key="value", label="Giá trị", label_en="Value", order=3),
        SectionDefinition(key="relations", label="Liên kết", label_en="Relations", order=4),
        SectionDefinition(key="assignment", label="Phân công", label_en="Assignment", order=5),
        SectionDefinition(key="dates", label="Thời hạn", label_en="Dates", order=6),
        SectionDefinition(key="outcome", label="Kết quả", label_en="Outcome", order=7, collapsible=True),
        SectionDefinition(key="notes", label="Ghi chú", label_en="Notes", order=8),
    ],
)


# ============================================
# CUSTOMER ENTITY SCHEMA
# ============================================

CUSTOMER_SCHEMA = EntitySchema(
    entity="customer",
    label="Khách hàng",
    label_plural="Khách hàng",
    label_en="Customer",
    label_plural_en="Customers",
    icon="user",
    primary_field="full_name",
    
    fields=[
        FieldDefinition(key="id", label="ID", type=FieldType.TEXT, layer=FieldLayer.CORE, flags=["sortable"], system=True),
        FieldDefinition(
            key="full_name",
            label="Họ tên",
            label_en="Full Name",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "sortable", "filterable", "exportable", "importable", "visible_in_list"],
            section="personal",
            order=1,
        ),
        FieldDefinition(
            key="phone",
            label="Số điện thoại",
            label_en="Phone",
            type=FieldType.PHONE,
            layer=FieldLayer.BUSINESS,
            flags=["required", "searchable", "filterable", "exportable", "importable", "visible_in_list"],
            section="contact",
            order=1,
        ),
        FieldDefinition(
            key="email",
            label="Email",
            type=FieldType.EMAIL,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "filterable", "exportable", "importable"],
            section="contact",
            order=2,
        ),
        FieldDefinition(
            key="id_number",
            label="CMND/CCCD",
            label_en="ID Number",
            type=FieldType.TEXT,
            layer=FieldLayer.BUSINESS,
            flags=["searchable", "exportable", "importable"],
            section="identity",
            order=1,
        ),
        FieldDefinition(
            key="date_of_birth",
            label="Ngày sinh",
            label_en="Date of Birth",
            type=FieldType.DATE,
            layer=FieldLayer.BUSINESS,
            flags=["exportable", "importable"],
            section="personal",
            order=2,
        ),
        FieldDefinition(
            key="gender",
            label="Giới tính",
            label_en="Gender",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "importable"],
            options={"items": [{"code": "male", "label": "Nam"}, {"code": "female", "label": "Nữ"}, {"code": "other", "label": "Khác"}]},
            section="personal",
            order=3,
        ),
        FieldDefinition(
            key="address",
            label="Địa chỉ",
            label_en="Address",
            type=FieldType.ADDRESS,
            layer=FieldLayer.BUSINESS,
            flags=["exportable", "importable"],
            section="contact",
            order=3,
        ),
        FieldDefinition(
            key="segment",
            label="Phân khúc",
            label_en="Segment",
            type=FieldType.SELECT,
            layer=FieldLayer.BUSINESS,
            flags=["filterable", "exportable", "reportable", "visible_in_list"],
            options={"source": "lead_segments"},
            section="classification",
            order=1,
        ),
        FieldDefinition(
            key="total_value",
            label="Tổng giá trị GD",
            label_en="Total Transaction Value",
            type=FieldType.CURRENCY,
            layer=FieldLayer.COMPUTED,
            flags=["sortable", "filterable", "reportable", "visible_in_list"],
            readonly=True,
            section="stats",
            order=1,
        ),
        FieldDefinition(
            key="converted_from_lead",
            label="Chuyển đổi từ Lead",
            label_en="Converted From Lead",
            type=FieldType.ENTITY_RELATION,
            layer=FieldLayer.BUSINESS,
            flags=["filterable"],
            options={"entity": "lead"},
            section="origin",
            order=1,
        ),
    ],
    
    sections=[
        SectionDefinition(key="personal", label="Thông tin cá nhân", label_en="Personal Info", order=1),
        SectionDefinition(key="contact", label="Liên hệ", label_en="Contact", order=2),
        SectionDefinition(key="identity", label="Giấy tờ", label_en="Identity", order=3),
        SectionDefinition(key="classification", label="Phân loại", label_en="Classification", order=4),
        SectionDefinition(key="stats", label="Thống kê", label_en="Statistics", order=5),
        SectionDefinition(key="origin", label="Nguồn gốc", label_en="Origin", order=6, collapsible=True),
    ],
)


# ============================================
# ENTITY SCHEMA REGISTRY
# ============================================

ENTITY_SCHEMAS: Dict[str, EntitySchema] = {
    "lead": LEAD_SCHEMA,
    "task": TASK_SCHEMA,
    "project": PROJECT_SCHEMA,
    "deal": DEAL_SCHEMA,
    "customer": CUSTOMER_SCHEMA,
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_schema(entity_name: str) -> Optional[EntitySchema]:
    """Get schema by entity name"""
    return ENTITY_SCHEMAS.get(entity_name)


def get_all_schemas() -> Dict[str, EntitySchema]:
    """Get all entity schemas"""
    return ENTITY_SCHEMAS


def get_fields_by_section(schema: EntitySchema, section_key: str) -> List[FieldDefinition]:
    """Get fields belonging to a specific section"""
    return sorted(
        [f for f in schema.fields if f.section == section_key],
        key=lambda f: f.order
    )


def get_fields_with_flag(schema: EntitySchema, flag: str) -> List[FieldDefinition]:
    """Get fields that have a specific flag"""
    return [f for f in schema.fields if flag in f.flags]


def get_filterable_fields(schema: EntitySchema) -> List[FieldDefinition]:
    """Get all filterable fields"""
    return get_fields_with_flag(schema, "filterable")


def get_searchable_fields(schema: EntitySchema) -> List[FieldDefinition]:
    """Get all searchable fields"""
    return get_fields_with_flag(schema, "searchable")


def get_exportable_fields(schema: EntitySchema) -> List[FieldDefinition]:
    """Get all exportable fields"""
    return get_fields_with_flag(schema, "exportable")


def get_required_fields(schema: EntitySchema) -> List[FieldDefinition]:
    """Get all required fields"""
    return get_fields_with_flag(schema, "required")


def get_list_columns(schema: EntitySchema) -> List[FieldDefinition]:
    """Get fields visible in list view"""
    return get_fields_with_flag(schema, "visible_in_list")


def get_form_fields(schema: EntitySchema) -> List[FieldDefinition]:
    """Get fields for form (excluding system fields)"""
    return [f for f in schema.fields if not f.system]


def map_import_alias(schema: EntitySchema, alias: str) -> Optional[str]:
    """Map an import alias to field key"""
    alias_lower = alias.lower().strip()
    
    # Check direct field key match
    for field in schema.fields:
        if field.key.lower() == alias_lower:
            return field.key
        if field.label.lower() == alias_lower:
            return field.key
        if alias_lower in [a.lower() for a in field.import_aliases]:
            return field.key
    
    # Check entity-level aliases
    for field_key, aliases in schema.import_aliases.items():
        if alias_lower in [a.lower() for a in aliases]:
            return field_key
    
    return None
