"""
ProHouzing Assignment Model
Version: 1.0.0

Entities:
- Assignment (entity ownership history)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import CoreModel, GUID, JSONB, utc_now


class Assignment(CoreModel):
    """
    Assignment entity - Ownership/Assignment history
    
    Tracks who owns/is assigned to any entity (customer, lead, deal).
    Supports multiple assignment types (owner, collaborator, watcher).
    """
    __tablename__ = "assignments"
    
    # Organization
    org_id = Column(GUID(), nullable=False)
    
    # Entity Reference (polymorphic)
    entity_type = Column(String(50), nullable=False)  # EntityType enum
    entity_id = Column(GUID(), nullable=False)
    
    # Assignee
    assignee_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    assignee_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    assignee_org_id = Column(GUID(), ForeignKey("organizations.id"), nullable=True)
    
    # Assignment Type
    assignment_type = Column(String(50), nullable=False, default="owner")  # AssignmentType enum
    
    # Primary Flag (only one primary per entity)
    is_primary = Column(Boolean, default=False)
    
    # Timeline
    assigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    assigned_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # End of assignment
    ended_at = Column(DateTime(timezone=True), nullable=True)
    ended_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    end_reason = Column(String(50), nullable=True)  # EndReason enum
    
    # Transfer
    transferred_to_assignment_id = Column(GUID(), ForeignKey("assignments.id"), nullable=True)
    transfer_notes = Column(Text, nullable=True)
    
    # Status
    status = Column(String(50), default="active")
    
    # Permissions (override)
    permissions = Column(JSONB, nullable=True, default=dict)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    assignee_user = relationship("User", foreign_keys=[assignee_user_id])
    assignee_unit = relationship("OrganizationalUnit", foreign_keys=[assignee_unit_id])
    assignee_org = relationship("Organization", foreign_keys=[assignee_org_id])
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])
    ended_by_user = relationship("User", foreign_keys=[ended_by])
    transferred_to = relationship("Assignment", remote_side="Assignment.id", foreign_keys=[transferred_to_assignment_id])
    
    # Indexes
    __table_args__ = (
        Index("ix_assignments_org_id", "org_id"),
        Index("ix_assignments_entity", "entity_type", "entity_id"),
        Index("ix_assignments_assignee_user_id", "assignee_user_id"),
        Index("ix_assignments_assignee_unit_id", "assignee_unit_id"),
        Index("ix_assignments_assignment_type", "assignment_type"),
        Index("ix_assignments_status", "status"),
        Index("ix_assignments_assigned_at", "assigned_at"),
        # Composite for finding current owner
        Index("ix_assignments_entity_primary", "entity_type", "entity_id", "is_primary", "status"),
    )
    
    def __repr__(self):
        return f"<Assignment {self.entity_type}:{self.entity_id} -> User:{self.assignee_user_id}>"
    
    @property
    def is_active(self):
        """Check if assignment is currently active"""
        return self.status == "active" and self.ended_at is None
    
    def end_assignment(self, ended_by: str = None, reason: str = None):
        """End this assignment"""
        self.ended_at = utc_now()
        self.ended_by = ended_by
        self.end_reason = reason
        self.status = "ended"
    
    def transfer_to(self, new_assignment_id: str, notes: str = None):
        """Mark as transferred to another assignment"""
        self.transferred_to_assignment_id = new_assignment_id
        self.transfer_notes = notes
        self.end_assignment(reason="transferred")
