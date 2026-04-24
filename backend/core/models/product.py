"""
ProHouzing Product Models
Version: 1.0.0

Entities:
- Project (real estate projects)
- ProjectStructure (phase/block/tower)
- Product (units/căn/lô)
- ProductPriceHistory (price changes)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, Boolean, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, CoreModel, StatusMixin, GUID, JSONB, ARRAY


class Project(SoftDeleteModel, StatusMixin):
    """
    Project entity - Real estate projects
    """
    __tablename__ = "projects"
    
    # Identity
    project_code = Column(String(50), nullable=False)
    project_name = Column(String(255), nullable=False)
    
    # Developer
    developer_name = Column(String(255), nullable=True)
    developer_id = Column(GUID(), nullable=True)  # Partner reference
    
    # Type
    project_type = Column(String(50), nullable=False)  # ProjectType enum
    
    # Status
    legal_status = Column(String(50), nullable=True)  # LegalStatus enum
    selling_status = Column(String(50), default="upcoming")  # SellingStatus enum
    
    # Dates
    launch_date = Column(Date, nullable=True)
    presale_date = Column(Date, nullable=True)
    handover_date = Column(Date, nullable=True)
    completion_date = Column(Date, nullable=True)
    
    # Location
    province_code = Column(String(10), nullable=True)
    district_code = Column(String(10), nullable=True)
    ward_code = Column(String(10), nullable=True)
    address_line = Column(String(500), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    
    # Inventory Summary
    total_units = Column(Integer, default=0)
    available_units = Column(Integer, default=0)
    sold_units = Column(Integer, default=0)
    
    # Pricing
    min_price = Column(Numeric(15, 2), nullable=True)
    max_price = Column(Numeric(15, 2), nullable=True)
    avg_price_per_sqm = Column(Numeric(12, 2), nullable=True)
    currency_code = Column(String(3), default="VND")
    
    # Commission
    commission_rate = Column(Numeric(5, 2), nullable=True)  # Default %
    commission_policy = Column(Text, nullable=True)
    
    # Description
    description = Column(Text, nullable=True)
    highlights = Column(ARRAY(String(255)), nullable=True)
    amenities = Column(ARRAY(String(100)), nullable=True)
    
    # Media
    thumbnail_url = Column(String(500), nullable=True)
    images = Column(JSONB, nullable=True, default=list)
    videos = Column(JSONB, nullable=True, default=list)
    documents = Column(JSONB, nullable=True, default=list)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    structures = relationship("ProjectStructure", back_populates="project", lazy="dynamic")
    products = relationship("Product", back_populates="project", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "project_code", name="uq_org_project_code"),
        Index("ix_projects_org_id", "org_id"),
        Index("ix_projects_project_code", "project_code"),
        Index("ix_projects_province_code", "province_code"),
        Index("ix_projects_selling_status", "selling_status"),
        Index("ix_projects_status", "status"),
    )
    
    def __repr__(self):
        return f"<Project {self.project_code}: {self.project_name}>"


class ProjectStructure(CoreModel, StatusMixin):
    """
    Project Structure - Phase/Block/Tower/Building
    
    Hierarchical structure within a project.
    """
    __tablename__ = "project_structures"
    
    # Organization (denormalized for query performance)
    org_id = Column(GUID(), nullable=False)
    
    # Project
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=False)
    
    # Hierarchy
    parent_structure_id = Column(GUID(), ForeignKey("project_structures.id"), nullable=True)
    
    # Identity
    structure_type = Column(String(50), nullable=False)  # StructureType enum
    structure_code = Column(String(50), nullable=False)
    structure_name = Column(String(255), nullable=False)
    
    # Details
    total_floors = Column(Integer, nullable=True)
    total_units = Column(Integer, default=0)
    
    # Display
    sort_order = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="structures")
    parent = relationship("ProjectStructure", remote_side="ProjectStructure.id", backref="children")
    products = relationship("Product", back_populates="structure", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("project_id", "structure_code", name="uq_project_structure_code"),
        Index("ix_project_structures_project_id", "project_id"),
        Index("ix_project_structures_parent_structure_id", "parent_structure_id"),
    )
    
    def __repr__(self):
        return f"<ProjectStructure {self.structure_code}: {self.structure_name}>"


class Product(SoftDeleteModel, StatusMixin):
    """
    Product entity - Individual units/căn/lô for sale
    
    This is the inventory item.
    Status tracks availability and ownership.
    """
    __tablename__ = "products"
    
    # Project & Structure
    project_id = Column(GUID(), ForeignKey("projects.id"), nullable=False)
    project_structure_id = Column(GUID(), ForeignKey("project_structures.id"), nullable=True)
    
    # Identity
    product_code = Column(String(50), nullable=False)
    external_code = Column(String(50), nullable=True)  # Developer's code
    
    # Type
    product_type = Column(String(50), nullable=False)  # ProductType enum
    title = Column(String(255), nullable=True)
    
    # Specifications
    bedroom_count = Column(Integer, nullable=True)
    bathroom_count = Column(Integer, nullable=True)
    floor_no = Column(String(10), nullable=True)
    unit_no = Column(String(20), nullable=True)
    
    # Area (square meters)
    land_area = Column(Numeric(10, 2), nullable=True)
    built_area = Column(Numeric(10, 2), nullable=True)
    carpet_area = Column(Numeric(10, 2), nullable=True)  # Usable area
    
    # Position
    direction = Column(String(10), nullable=True)  # Direction enum
    view = Column(String(100), nullable=True)
    
    # Legal
    legal_type = Column(String(50), nullable=True)  # LegalType enum
    handover_standard = Column(String(50), nullable=True)  # HandoverStandard enum
    
    # Pricing
    list_price = Column(Numeric(15, 2), nullable=True)  # Giá niêm yết
    sale_price = Column(Numeric(15, 2), nullable=True)  # Giá bán thực tế
    price_per_sqm = Column(Numeric(12, 2), nullable=True)
    currency_code = Column(String(3), default="VND")
    
    # Status (Critical for inventory management)
    inventory_status = Column(String(50), default="available")  # InventoryStatus enum
    business_status = Column(String(50), default="active")  # BusinessStatus enum
    availability_status = Column(String(50), default="open")  # AvailabilityStatus enum
    
    # Current Holder (who is holding this product)
    current_holder_type = Column(String(50), default="none")  # HolderType enum
    current_holder_id = Column(GUID(), nullable=True)
    current_deal_id = Column(GUID(), nullable=True)  # Active deal
    current_booking_id = Column(GUID(), nullable=True)  # Active booking (PROMPT 5/20)
    current_contract_id = Column(GUID(), nullable=True)  # Active contract (PROMPT 5/20)
    
    # Sale Dates
    released_for_sale_at = Column(Date, nullable=True)
    sold_at = Column(Date, nullable=True)
    
    # Lock (for hold/reserve) - Enhanced for PROMPT 5/20
    locked_until = Column(Date, nullable=True)
    lock_reason = Column(String(255), nullable=True)
    locked_by = Column(GUID(), nullable=True)
    
    # PROMPT 5/20: Enhanced Hold Tracking
    hold_started_at = Column(Date, nullable=True)
    hold_expires_at = Column(Date, nullable=True)
    hold_by_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    hold_reason = Column(String(255), nullable=True)
    
    # PROMPT 5/20: Optimistic Locking for Anti Double-Sell
    version = Column(Integer, nullable=False, default=1)
    
    # Media
    images = Column(JSONB, nullable=True, default=list)
    floor_plan_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    virtual_tour_url = Column(String(500), nullable=True)
    
    # Features
    features = Column(ARRAY(String(100)), nullable=True)
    
    # Description
    description = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    project = relationship("Project", back_populates="products")
    structure = relationship("ProjectStructure", back_populates="products")
    price_histories = relationship("ProductPriceHistory", back_populates="product", lazy="dynamic")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "product_code", name="uq_org_product_code"),
        Index("ix_products_org_id", "org_id"),
        Index("ix_products_project_id", "project_id"),
        Index("ix_products_product_code", "product_code"),
        Index("ix_products_inventory_status", "inventory_status"),
        Index("ix_products_availability_status", "availability_status"),
        Index("ix_products_project_inventory", "project_id", "inventory_status"),
        Index("ix_products_status", "status"),
        # PROMPT 5/20: Hold expiry index for background job
        Index("ix_products_hold_expires", "hold_expires_at"),
        # PROMPT 5/20: Partial unique index for anti double-sell (only for active sales states)
        # This ensures only ONE product can be in active sales flow at a time
        Index(
            "ix_products_active_sales_unique",
            "id",
            unique=True,
            postgresql_where="inventory_status IN ('hold', 'booking_pending', 'booked', 'reserved', 'sold')"
        ),
    )
    
    def __repr__(self):
        return f"<Product {self.product_code}: {self.title or self.product_type}>"
    
    @property
    def is_available(self):
        """Check if product is available for sale"""
        return (
            self.inventory_status == "available" and
            self.business_status == "active" and
            self.availability_status == "open" and
            self.status == "active"
        )
    
    # PROMPT 5/20: Additional properties for inventory management
    @property
    def is_on_hold(self) -> bool:
        """Check if product is currently on hold."""
        return self.inventory_status == "hold"
    
    @property
    def is_sold(self) -> bool:
        """Check if product is sold."""
        return self.inventory_status == "sold"
    
    @property
    def is_blocked(self) -> bool:
        """Check if product is blocked."""
        return self.inventory_status == "blocked"
    
    @property
    def is_hold_expired(self) -> bool:
        """Check if hold has expired."""
        from datetime import datetime, timezone
        if not self.is_on_hold or not self.hold_expires_at:
            return False
        # Convert date to datetime for comparison
        hold_exp = self.hold_expires_at
        if hasattr(hold_exp, 'date'):
            return datetime.now(timezone.utc).date() > hold_exp.date()
        return datetime.now(timezone.utc).date() > hold_exp


class ProductPriceHistory(CoreModel):
    """
    Product Price History - Track all price changes
    
    Immutable log of price changes.
    """
    __tablename__ = "product_price_histories"
    
    # Organization (denormalized)
    org_id = Column(GUID(), nullable=False)
    
    # Product
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=False)
    
    # Price Change
    price_type = Column(String(50), nullable=False)  # PriceType enum
    old_value = Column(Numeric(15, 2), nullable=True)
    new_value = Column(Numeric(15, 2), nullable=False)
    
    # Effective dates
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    
    # Source
    change_reason = Column(String(255), nullable=True)
    source_type = Column(String(50), nullable=True)  # manual/import/system
    source_ref_id = Column(String(100), nullable=True)
    
    # Who changed
    changed_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    product = relationship("Product", back_populates="price_histories")
    
    # Indexes
    __table_args__ = (
        Index("ix_product_price_histories_product_id", "product_id"),
        Index("ix_product_price_histories_effective_from", "effective_from"),
    )
    
    def __repr__(self):
        return f"<ProductPriceHistory {self.product_id}: {self.old_value} -> {self.new_value}>"



class InventoryEvent(CoreModel):
    """
    PROMPT 5/20: Inventory Event Log - Audit trail for all status changes.
    
    Every status change MUST be logged here.
    """
    __tablename__ = "inventory_events"
    
    # Organization
    org_id = Column(GUID(), nullable=False)
    
    # Product reference
    product_id = Column(GUID(), ForeignKey("products.id"), nullable=False, index=True)
    
    # Status change
    old_status = Column(String(50), nullable=True)  # Null for initial status
    new_status = Column(String(50), nullable=False)
    
    # Actor
    triggered_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Source - WHO requested this change
    source = Column(String(50), nullable=False)  # manual, booking, deal, system, admin, import
    source_ref_type = Column(String(50), nullable=True)  # booking, deal, contract
    source_ref_id = Column(GUID(), nullable=True)  # ID of the source entity
    
    # Additional context
    reason = Column(String(255), nullable=True)
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    product = relationship("Product", foreign_keys=[product_id])
    actor = relationship("User", foreign_keys=[triggered_by])
    
    __table_args__ = (
        Index("ix_inventory_events_created_at", "created_at"),
        Index("ix_inventory_events_source", "source"),
        Index("ix_inventory_events_org_id", "org_id"),
    )
    
    def __repr__(self):
        return f"<InventoryEvent {self.product_id}: {self.old_status} -> {self.new_status}>"
