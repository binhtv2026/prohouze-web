"""
ProHouzing Approval Models
Version: 1.0.0 (Prompt 4/20 - HARDENED)

Multi-step approval workflow models.
Supports:
- Role-based approvers
- Multi-step approval chains
- Approval history tracking
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .base import CoreModel, GUID, utc_now


class ApprovalStatus(str, enum.Enum):
    """Approval request status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class StepStatus(str, enum.Enum):
    """Individual step status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class ApprovalRequest(CoreModel):
    """
    Main approval request table.
    
    Tracks approval workflow for any entity type.
    """
    __tablename__ = "approval_requests"
    
    # Entity being approved
    entity_type = Column(String(50), nullable=False, index=True)  # contract, commission, deal
    entity_id = Column(GUID(), nullable=False, index=True)
    
    # Workflow
    workflow_type = Column(String(50), nullable=False, default="default")  # default, contract_approval, commission_approval
    current_step = Column(Integer, default=1)
    total_steps = Column(Integer, default=1)
    
    # Status
    status = Column(
        String(20),
        default=ApprovalStatus.PENDING.value,
        index=True
    )
    
    # Request metadata
    title = Column(String(255))
    description = Column(Text)
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    
    # Requester
    requested_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Final resolution
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(GUID(), ForeignKey("users.id"))
    resolution_comment = Column(Text)
    
    # Due date (optional)
    due_date = Column(DateTime(timezone=True))
    
    # Relationships
    steps = relationship("ApprovalStep", back_populates="request", order_by="ApprovalStep.step_order")
    requester = relationship("User", foreign_keys=[requested_by])
    resolver = relationship("User", foreign_keys=[resolved_by])
    
    def __repr__(self):
        return f"<ApprovalRequest {self.entity_type}:{self.entity_id} status={self.status}>"
    
    @property
    def is_pending(self) -> bool:
        return self.status in [ApprovalStatus.PENDING.value, ApprovalStatus.IN_PROGRESS.value]
    
    @property
    def is_resolved(self) -> bool:
        return self.status in [ApprovalStatus.APPROVED.value, ApprovalStatus.REJECTED.value, ApprovalStatus.CANCELLED.value]


class ApprovalStep(CoreModel):
    """
    Individual approval step in a workflow.
    
    Supports:
    - Role-based approvers (any user with role can approve)
    - Specific user approvers
    - Step ordering
    """
    __tablename__ = "approval_steps"
    
    # Link to request
    request_id = Column(GUID(), ForeignKey("approval_requests.id"), nullable=False, index=True)
    
    # Step order
    step_order = Column(Integer, nullable=False, default=1)
    step_name = Column(String(100))
    
    # Approver configuration
    # Either approver_role OR approver_user_id should be set
    approver_role = Column(String(50))  # e.g., "team_leader", "branch_manager", "legal"
    approver_user_id = Column(GUID(), ForeignKey("users.id"))  # Specific user
    
    # Status
    status = Column(
        String(20),
        default=StepStatus.PENDING.value,
        index=True
    )
    
    # Action taken
    acted_by = Column(GUID(), ForeignKey("users.id"))
    acted_at = Column(DateTime(timezone=True))
    action_comment = Column(Text)
    
    # Relationships
    request = relationship("ApprovalRequest", back_populates="steps")
    approver = relationship("User", foreign_keys=[approver_user_id])
    actor = relationship("User", foreign_keys=[acted_by])
    
    def __repr__(self):
        return f"<ApprovalStep order={self.step_order} status={self.status}>"
    
    @property
    def is_pending(self) -> bool:
        return self.status == StepStatus.PENDING.value
    
    @property
    def can_be_acted_on(self) -> bool:
        """Check if this step is the current active step"""
        if not self.request:
            return False
        return self.request.current_step == self.step_order and self.is_pending


class ApprovalHistory(CoreModel):
    """
    Audit log for approval actions.
    
    Tracks all changes to approval requests and steps.
    """
    __tablename__ = "approval_history"
    
    # Link to request
    request_id = Column(GUID(), ForeignKey("approval_requests.id"), nullable=False, index=True)
    step_id = Column(GUID(), ForeignKey("approval_steps.id"))
    
    # Action
    action = Column(String(50), nullable=False)  # created, approved, rejected, escalated, commented
    
    # Actor
    performed_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    performed_at = Column(DateTime(timezone=True), default=utc_now)
    
    # Details
    old_status = Column(String(20))
    new_status = Column(String(20))
    comment = Column(Text)
    metadata_json = Column(Text)  # JSON for additional context
    
    # Relationships
    request = relationship("ApprovalRequest")
    step = relationship("ApprovalStep")
    performer = relationship("User", foreign_keys=[performed_by])
    
    def __repr__(self):
        return f"<ApprovalHistory action={self.action} by={self.performed_by}>"


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

# Predefined workflow templates for common approval scenarios
WORKFLOW_TEMPLATES = {
    "contract_approval": {
        "name": "Contract Approval",
        "steps": [
            {"step_order": 1, "step_name": "Team Leader Review", "approver_role": "team_leader"},
            {"step_order": 2, "step_name": "Legal Review", "approver_role": "legal"},
            {"step_order": 3, "step_name": "Branch Manager Approval", "approver_role": "branch_manager"},
        ]
    },
    "commission_payout": {
        "name": "Commission Payout",
        "steps": [
            {"step_order": 1, "step_name": "Finance Review", "approver_role": "finance"},
            {"step_order": 2, "step_name": "Branch Manager Approval", "approver_role": "branch_manager"},
        ]
    },
    "deal_stage_approval": {
        "name": "Deal Stage Change",
        "steps": [
            {"step_order": 1, "step_name": "Team Leader Approval", "approver_role": "team_leader"},
        ]
    },
    "simple_approval": {
        "name": "Simple Approval",
        "steps": [
            {"step_order": 1, "step_name": "Manager Approval", "approver_role": "team_leader"},
        ]
    },
}
