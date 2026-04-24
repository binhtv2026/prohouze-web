"""
ProHouzing Tag System Model
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 2

Entities:
- Tag (tag definitions with org scope)
- EntityTag (many-to-many relationship between tags and entities)

Purpose:
- Replace hardcoded ARRAY tags with normalized tag system
- Support multi-tenant with org_id scope
- Enable cross-entity tagging (lead, customer, deal, product, task)
- Fast queries with proper indexing
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import CoreModel, SoftDeleteMixin, StatusMixin, GUID, JSONB, utc_now


class Tag(CoreModel, SoftDeleteMixin, StatusMixin):
    """
    Tag entity - Centralized tag definitions
    
    Features:
    - org_id scope for multi-tenant
    - Unique tag_code per org
    - Color and icon for visual display
    - Usage tracking (denormalized count)
    
    Example tags: hot_lead, priority_customer, vip, follow_up, etc.
    """
    __tablename__ = "tags"
    
    # Organization scope (NULL = system-wide tags)
    org_id = Column(GUID(), nullable=True)
    
    # Identity
    tag_code = Column(String(50), nullable=False)  # e.g., "hot_lead"
    tag_name = Column(String(100), nullable=False)  # e.g., "Hot Lead"
    tag_name_vi = Column(String(100), nullable=True)  # Vietnamese: "Lead Nóng"
    description = Column(Text, nullable=True)
    
    # Visual
    color_code = Column(String(20), nullable=True, default="#6B7280")  # Hex color
    icon_code = Column(String(50), nullable=True)  # FontAwesome icon
    
    # Classification
    category = Column(String(50), nullable=True)  # Optional grouping: sales, marketing, support
    
    # Behavior
    is_system = Column(Boolean, default=False)  # System tags cannot be deleted
    is_auto = Column(Boolean, default=False)  # Auto-assigned by rules
    
    # Usage tracking (denormalized for performance)
    usage_count = Column(Integer, default=0)
    
    # Display
    sort_order = Column(Integer, default=0)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    entity_tags = relationship("EntityTag", back_populates="tag", lazy="dynamic")
    
    # Indexes and Constraints
    __table_args__ = (
        # Unique tag_code per org
        UniqueConstraint("org_id", "tag_code", name="uq_tags_org_code"),
        Index("ix_tags_org_id", "org_id"),
        Index("ix_tags_code", "tag_code"),
        Index("ix_tags_category", "category"),
        Index("ix_tags_status", "status"),
        Index("ix_tags_usage", "usage_count"),
    )
    
    def __repr__(self):
        return f"<Tag {self.tag_code}: {self.tag_name}>"
    
    @property
    def is_global(self):
        """Check if this is a global/system tag"""
        return self.org_id is None
    
    def increment_usage(self):
        """Increment usage count when tag is assigned"""
        self.usage_count = (self.usage_count or 0) + 1
    
    def decrement_usage(self):
        """Decrement usage count when tag is removed"""
        if self.usage_count and self.usage_count > 0:
            self.usage_count -= 1


class EntityTag(CoreModel):
    """
    Entity-Tag relationship (many-to-many)
    
    Supports tagging any entity type:
    - lead, customer, deal, product, task, booking, contract, etc.
    
    Design:
    - entity_type + entity_id = polymorphic reference
    - Unique constraint prevents duplicate tag assignments
    - Tracks who tagged and when
    """
    __tablename__ = "entity_tags"
    
    # Organization scope
    org_id = Column(GUID(), nullable=True)
    
    # Tag reference
    tag_id = Column(GUID(), ForeignKey("tags.id"), nullable=False)
    
    # Polymorphic entity reference
    entity_type = Column(String(50), nullable=False)  # lead, customer, deal, product, task
    entity_id = Column(GUID(), nullable=False)  # The entity's UUID
    
    # Audit
    tagged_by_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    tag = relationship("Tag", back_populates="entity_tags")
    
    # Indexes and Constraints
    __table_args__ = (
        # Prevent duplicate tag assignments
        UniqueConstraint("tag_id", "entity_type", "entity_id", name="uq_entity_tags_unique"),
        # Fast lookups
        Index("ix_entity_tags_org_id", "org_id"),
        Index("ix_entity_tags_tag_id", "tag_id"),
        Index("ix_entity_tags_entity", "entity_type", "entity_id"),
        Index("ix_entity_tags_entity_type", "entity_type"),
        # Composite index for common queries
        Index("ix_entity_tags_org_entity", "org_id", "entity_type", "entity_id"),
    )
    
    def __repr__(self):
        return f"<EntityTag {self.entity_type}:{self.entity_id} -> {self.tag_id}>"


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM TAG DEFINITIONS (for seeding)
# ═══════════════════════════════════════════════════════════════════════════════

SYSTEM_TAGS = [
    # Sales Tags
    {"code": "hot_lead", "name": "Hot Lead", "name_vi": "Lead Nóng", "color": "#EF4444", "icon": "fire", "category": "sales"},
    {"code": "priority", "name": "Priority", "name_vi": "Ưu tiên", "color": "#F59E0B", "icon": "star", "category": "sales"},
    {"code": "vip", "name": "VIP", "name_vi": "VIP", "color": "#8B5CF6", "icon": "crown", "category": "sales"},
    {"code": "follow_up", "name": "Follow Up", "name_vi": "Theo dõi", "color": "#3B82F6", "icon": "clock", "category": "sales"},
    {"code": "callback", "name": "Callback", "name_vi": "Gọi lại", "color": "#06B6D4", "icon": "phone", "category": "sales"},
    
    # Status Tags
    {"code": "new", "name": "New", "name_vi": "Mới", "color": "#22C55E", "icon": "plus-circle", "category": "status"},
    {"code": "pending", "name": "Pending", "name_vi": "Chờ xử lý", "color": "#F59E0B", "icon": "hourglass-half", "category": "status"},
    {"code": "in_progress", "name": "In Progress", "name_vi": "Đang xử lý", "color": "#3B82F6", "icon": "spinner", "category": "status"},
    {"code": "completed", "name": "Completed", "name_vi": "Hoàn thành", "color": "#22C55E", "icon": "check-circle", "category": "status"},
    
    # Marketing Tags
    {"code": "campaign_q1", "name": "Campaign Q1", "name_vi": "Chiến dịch Q1", "color": "#EC4899", "icon": "bullhorn", "category": "marketing"},
    {"code": "promotion", "name": "Promotion", "name_vi": "Khuyến mãi", "color": "#F97316", "icon": "percent", "category": "marketing"},
    {"code": "referral", "name": "Referral", "name_vi": "Giới thiệu", "color": "#10B981", "icon": "users", "category": "marketing"},
    
    # Product Tags
    {"code": "best_seller", "name": "Best Seller", "name_vi": "Bán chạy", "color": "#EAB308", "icon": "trophy", "category": "product"},
    {"code": "new_launch", "name": "New Launch", "name_vi": "Mới ra mắt", "color": "#8B5CF6", "icon": "rocket", "category": "product"},
    {"code": "limited", "name": "Limited", "name_vi": "Số lượng có hạn", "color": "#EF4444", "icon": "exclamation-triangle", "category": "product"},
    
    # Customer Tags
    {"code": "investor", "name": "Investor", "name_vi": "Nhà đầu tư", "color": "#6366F1", "icon": "chart-line", "category": "customer"},
    {"code": "end_user", "name": "End User", "name_vi": "Người dùng cuối", "color": "#14B8A6", "icon": "home", "category": "customer"},
    {"code": "corporate", "name": "Corporate", "name_vi": "Doanh nghiệp", "color": "#64748B", "icon": "building", "category": "customer"},
]
