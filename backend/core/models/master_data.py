"""
ProHouzing Master Data Model
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation

Entities:
- MasterDataCategory (định nghĩa danh mục)
- MasterDataItem (các giá trị trong danh mục)

Purpose:
- Thay thế hardcoded enums bằng configurable data
- Hỗ trợ multi-tenant với org-level customization
- Giữ nguyên backward compatibility với enum codes
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import CoreModel, SoftDeleteMixin, StatusMixin, GUID, JSONB, ARRAY, utc_now


class MasterDataCategory(CoreModel, SoftDeleteMixin, StatusMixin):
    """
    Master Data Category - Định nghĩa các loại danh mục
    
    Examples: lead_source, lead_status, deal_stage, product_type
    
    Scope:
    - org_id = NULL: System-wide (áp dụng cho tất cả org)
    - org_id = UUID: Org-specific category
    """
    __tablename__ = "master_data_categories"
    
    # Organization scope (NULL = system-wide)
    org_id = Column(GUID(), nullable=True)
    
    # Identity
    category_code = Column(String(50), nullable=False)  # e.g., "lead_source"
    category_name = Column(String(255), nullable=False)  # e.g., "Nguồn Lead"
    category_name_en = Column(String(255), nullable=True)  # English name
    description = Column(Text, nullable=True)
    
    # Classification
    scope = Column(String(20), default="system")  # system/org/module
    module_code = Column(String(50), nullable=True)  # CRM/Sales/Inventory/Finance
    
    # Flags
    is_system = Column(Boolean, default=False)  # Cannot delete if True
    is_hierarchical = Column(Boolean, default=False)  # Supports parent-child items
    is_multi_select = Column(Boolean, default=False)  # Allow multiple selections
    allow_custom = Column(Boolean, default=True)  # Allow org to add items
    
    # Display
    sort_order = Column(Integer, default=0)
    icon_code = Column(String(50), nullable=True)
    
    # Enum Mapping (for backward compatibility)
    enum_class_name = Column(String(100), nullable=True)  # e.g., "SourceChannel"
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    items = relationship("MasterDataItem", back_populates="category", lazy="dynamic")
    
    # Indexes and Constraints
    __table_args__ = (
        # Unique category_code per org (NULL org = global)
        UniqueConstraint("org_id", "category_code", name="uq_master_category_org_code"),
        Index("ix_master_categories_org_id", "org_id"),
        Index("ix_master_categories_code", "category_code"),
        Index("ix_master_categories_module", "module_code"),
        Index("ix_master_categories_status", "status"),
    )
    
    def __repr__(self):
        return f"<MasterDataCategory {self.category_code}: {self.category_name}>"
    
    @property
    def is_global(self):
        """Check if this is a global/system category"""
        return self.org_id is None


class MasterDataItem(CoreModel, SoftDeleteMixin, StatusMixin):
    """
    Master Data Item - Các giá trị trong danh mục
    
    Examples:
    - Category: lead_source -> Items: website, facebook, zalo, referral
    - Category: deal_stage -> Items: new, qualified, proposal, won, lost
    
    Design:
    - item_code: Stable identifier (used in code, never changes)
    - item_label: Display text (can be customized per org)
    - enum_value: Maps to existing enum for backward compatibility
    """
    __tablename__ = "master_data_items"
    
    # Organization scope (NULL = system-wide)
    org_id = Column(GUID(), nullable=True)
    
    # Category Reference
    category_id = Column(GUID(), ForeignKey("master_data_categories.id"), nullable=False)
    
    # Identity (item_code is stable, unique per category+org)
    item_code = Column(String(100), nullable=False)  # e.g., "facebook"
    
    # Display Labels
    item_label = Column(String(255), nullable=False)  # e.g., "Facebook"
    item_label_vi = Column(String(255), nullable=True)  # Vietnamese: "Facebook"
    item_label_en = Column(String(255), nullable=True)  # English: "Facebook"
    description = Column(Text, nullable=True)
    
    # Hierarchy (for hierarchical categories)
    parent_item_id = Column(GUID(), ForeignKey("master_data_items.id"), nullable=True)
    level = Column(Integer, default=0)  # Depth in hierarchy
    path = Column(String(500), nullable=True)  # Materialized path: "root/parent/child"
    
    # Visual
    icon_code = Column(String(50), nullable=True)  # FontAwesome icon
    color_code = Column(String(20), nullable=True)  # Hex color: "#FF5733"
    
    # Behavior
    is_default = Column(Boolean, default=False)  # Default selection
    is_system = Column(Boolean, default=False)  # Cannot delete if True
    is_terminal = Column(Boolean, default=True)  # No children (for hierarchical)
    
    # Display
    sort_order = Column(Integer, default=0)
    
    # Backward Compatibility - Maps to existing enum
    enum_value = Column(String(50), nullable=True)  # e.g., "FACEBOOK" from SourceChannel
    
    # Import Support - Alternative names for import mapping
    import_aliases = Column(ARRAY(String(100)), nullable=True)  # ["fb", "FB", "face"]
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    category = relationship("MasterDataCategory", back_populates="items")
    parent = relationship("MasterDataItem", remote_side="MasterDataItem.id", backref="children")
    
    # Indexes and Constraints
    __table_args__ = (
        # Unique item_code per category+org
        UniqueConstraint("category_id", "org_id", "item_code", name="uq_master_item_category_org_code"),
        Index("ix_master_items_org_id", "org_id"),
        Index("ix_master_items_category_id", "category_id"),
        Index("ix_master_items_code", "item_code"),
        Index("ix_master_items_parent_id", "parent_item_id"),
        Index("ix_master_items_enum_value", "enum_value"),
        Index("ix_master_items_status", "status"),
        Index("ix_master_items_sort", "category_id", "sort_order"),
    )
    
    def __repr__(self):
        return f"<MasterDataItem {self.item_code}: {self.item_label}>"
    
    @property
    def is_global(self):
        """Check if this is a global/system item"""
        return self.org_id is None
    
    @property
    def full_label(self):
        """Get full label with path for hierarchical items"""
        if self.path:
            return f"{self.path}/{self.item_label}"
        return self.item_label
    
    def matches_import(self, value: str) -> bool:
        """Check if value matches this item for import"""
        if not value:
            return False
        value_lower = value.lower().strip()
        
        # Check item_code
        if self.item_code.lower() == value_lower:
            return True
        
        # Check labels
        if self.item_label.lower() == value_lower:
            return True
        if self.item_label_vi and self.item_label_vi.lower() == value_lower:
            return True
        if self.item_label_en and self.item_label_en.lower() == value_lower:
            return True
        
        # Check aliases
        if self.import_aliases:
            for alias in self.import_aliases:
                if alias.lower() == value_lower:
                    return True
        
        # Check enum value
        if self.enum_value and self.enum_value.lower() == value_lower:
            return True
        
        return False
