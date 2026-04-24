"""
ProHouzing Task Model
Version: 1.0.0

Entities:
- Task (follow-ups, activities, reminders)
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date, DateTime, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import SoftDeleteModel, StatusMixin, GUID, JSONB, ARRAY, utc_now


class Task(SoftDeleteModel, StatusMixin):
    """
    Task entity - Follow-ups, Activities, Reminders
    
    Tasks can be linked to any entity (lead, deal, customer).
    Supports recurring tasks and dependencies.
    """
    __tablename__ = "tasks"
    
    # Identity
    task_code = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Type
    task_type = Column(String(50), nullable=False)  # TaskType enum
    
    # Entity Reference (polymorphic - what this task is for)
    entity_type = Column(String(50), nullable=True)  # EntityType enum
    entity_id = Column(GUID(), nullable=True)
    
    # Additional References
    customer_id = Column(GUID(), ForeignKey("customers.id"), nullable=True)
    lead_id = Column(GUID(), ForeignKey("leads.id"), nullable=True)
    deal_id = Column(GUID(), ForeignKey("deals.id"), nullable=True)
    
    # Assignment
    assignee_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    assignee_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
    assigned_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Priority
    priority = Column(String(20), default="medium")  # Priority enum
    
    # Status
    task_status = Column(String(50), default="pending")  # TaskStatus enum
    
    # Timeline
    due_date = Column(Date, nullable=True)
    due_time = Column(String(5), nullable=True)  # HH:MM format
    reminder_at = Column(DateTime(timezone=True), nullable=True)
    
    # Completion
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    
    # Result
    result_summary = Column(Text, nullable=True)
    result_status = Column(String(50), nullable=True)  # successful/failed/postponed
    next_action = Column(String(255), nullable=True)
    
    # Meeting Details (if task_type = meeting/visit)
    location = Column(String(500), nullable=True)
    meeting_link = Column(String(500), nullable=True)  # Zoom/Meet link
    attendees = Column(JSONB, nullable=True, default=list)  # List of attendees
    
    # Call Details (if task_type = call)
    phone_number = Column(String(20), nullable=True)
    call_duration = Column(Integer, nullable=True)  # seconds
    call_recording_url = Column(String(500), nullable=True)
    
    # Recurring
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(String(255), nullable=True)  # RRULE format
    parent_task_id = Column(GUID(), ForeignKey("tasks.id"), nullable=True)  # For recurring instances
    
    # Dependencies
    depends_on_task_id = Column(GUID(), ForeignKey("tasks.id"), nullable=True)
    blocked_by = Column(ARRAY(GUID()), nullable=True)  # Task IDs that block this
    
    # Overdue
    is_overdue = Column(Boolean, default=False)
    
    # Tags
    tags = Column(ARRAY(String(50)), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    metadata_json = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])
    lead = relationship("Lead", foreign_keys=[lead_id])
    deal = relationship("Deal", foreign_keys=[deal_id])
    assignee_user = relationship("User", foreign_keys=[assignee_user_id])
    assignee_unit = relationship("OrganizationalUnit", foreign_keys=[assignee_unit_id])
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])
    completed_by_user = relationship("User", foreign_keys=[completed_by])
    parent_task = relationship("Task", remote_side="Task.id", foreign_keys=[parent_task_id])
    depends_on = relationship("Task", remote_side="Task.id", foreign_keys=[depends_on_task_id])
    
    # Indexes
    __table_args__ = (
        UniqueConstraint("org_id", "task_code", name="uq_org_task_code"),
        Index("ix_tasks_org_id", "org_id"),
        Index("ix_tasks_entity", "entity_type", "entity_id"),
        Index("ix_tasks_assignee_user_id", "assignee_user_id"),
        Index("ix_tasks_task_type", "task_type"),
        Index("ix_tasks_task_status", "task_status"),
        Index("ix_tasks_due_date", "due_date"),
        Index("ix_tasks_priority", "priority"),
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_assignee_status_due", "assignee_user_id", "task_status", "due_date"),
    )
    
    def __repr__(self):
        return f"<Task {self.task_code}: {self.title}>"
    
    @property
    def is_complete(self):
        """Check if task is completed"""
        return self.task_status == "completed"
    
    def check_overdue(self):
        """Check and update overdue status"""
        from datetime import date
        if self.due_date and self.due_date < date.today() and self.task_status == "pending":
            self.is_overdue = True
            self.task_status = "overdue"
    
    def complete(self, completed_by: str = None, summary: str = None):
        """Mark task as completed"""
        self.task_status = "completed"
        self.completed_at = utc_now()
        self.completed_by = completed_by
        self.result_summary = summary
