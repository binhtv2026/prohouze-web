"""
ProHouzing Approval Service
TASK 3 - MODULE 3: APPROVAL FLOW

BUSINESS RULES (LOCKED):
═══════════════════════════════════════════════════════════════════════════
1. APPROVAL THRESHOLD:
   - Deal value ≥ 1,000,000,000 VND → REQUIRE APPROVAL
   - Discount ≥ 5% → REQUIRE APPROVAL
   - Applies to: booking, deal

2. APPROVER ROLES (2 cấp):
   - Manager (Trưởng phòng): approve deal ≤ 3 tỷ
   - Director (Giám đốc sàn): approve deal > 3 tỷ

3. AUDIT LOG (BẮT BUỘC):
   - user_id, action, product_id, deal_id, timestamp
═══════════════════════════════════════════════════════════════════════════
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
import logging
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from core.database import Base
from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
import uuid


logger = logging.getLogger(__name__)


class ApprovalType(str, Enum):
    """Types of approvals."""
    BOOKING = "booking"
    DEAL = "deal"
    PRICE_OVERRIDE = "price_override"
    DISCOUNT = "discount"


class ApprovalStatus(str, Enum):
    """Approval statuses."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ApproverRole(str, Enum):
    """Approver roles with approval limits."""
    MANAGER = "manager"      # Trưởng phòng - approve ≤ 3 tỷ
    DIRECTOR = "director"    # Giám đốc sàn - approve > 3 tỷ


# ═══════════════════════════════════════════════════════════════════════════
# MANAGER APPROVAL REQUEST MODEL (Separate from core/models/approval.py)
# ═══════════════════════════════════════════════════════════════════════════

class ManagerApprovalRequest(Base):
    """Manager approval request model for high-value transactions."""
    __tablename__ = "manager_approval_requests"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    
    # Request type
    request_type = Column(String(50), nullable=False)  # booking, deal, price_override, discount
    
    # Reference
    reference_type = Column(String(50), nullable=False)  # booking, deal, product
    reference_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    
    # Request details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Values
    original_value = Column(Numeric(15, 2))
    requested_value = Column(Numeric(15, 2))
    discount_percent = Column(Numeric(5, 2))
    
    # Required approver role based on value
    required_role = Column(String(50), default=ApproverRole.MANAGER.value)
    
    # Status
    status = Column(String(20), default=ApprovalStatus.PENDING.value, index=True)
    
    # Requester
    requested_by = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    requested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Approver
    approved_by = Column(PGUUID(as_uuid=True))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    
    # Metadata
    metadata_json = Column(JSONB, default=dict)
    
    # Audit
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ═══════════════════════════════════════════════════════════════════════════
# APPROVAL THRESHOLDS (LOCKED)
# ═══════════════════════════════════════════════════════════════════════════

# Value thresholds
APPROVAL_VALUE_THRESHOLD = 1_000_000_000       # 1 tỷ VND - Require approval
MANAGER_APPROVAL_LIMIT = 3_000_000_000          # 3 tỷ VND - Manager can approve up to this
DISCOUNT_PERCENT_THRESHOLD = 5                  # 5% - Require approval

DEFAULT_THRESHOLDS = {
    "value_threshold": APPROVAL_VALUE_THRESHOLD,        # ≥ 1 tỷ → require approval
    "discount_percent_threshold": DISCOUNT_PERCENT_THRESHOLD,  # ≥ 5%
    "manager_limit": MANAGER_APPROVAL_LIMIT,            # Manager approves ≤ 3 tỷ
}


class ApprovalService:
    """
    Approval workflow service.
    
    BUSINESS RULES:
    - Value ≥ 1 tỷ → REQUIRE APPROVAL
    - Discount ≥ 5% → REQUIRE APPROVAL
    - Manager approves ≤ 3 tỷ
    - Director approves > 3 tỷ
    """
    
    def __init__(self):
        self.thresholds = DEFAULT_THRESHOLDS
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CHECK IF APPROVAL NEEDED
    # ═══════════════════════════════════════════════════════════════════════════
    
    def check_approval_needed(
        self,
        value: Decimal,
        discount_percent: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Check if approval is needed based on value and/or discount.
        
        Returns:
            {
                "needs_approval": bool,
                "reason": str,
                "required_role": "manager" | "director",
            }
        """
        needs_approval = False
        reasons = []
        required_role = ApproverRole.MANAGER.value
        
        # Check value threshold (≥ 1 tỷ)
        if value >= self.thresholds["value_threshold"]:
            needs_approval = True
            reasons.append(f"Giá trị ≥ {self.thresholds['value_threshold']:,.0f} VND")
            
            # Determine approver role based on value
            if value > self.thresholds["manager_limit"]:
                required_role = ApproverRole.DIRECTOR.value
        
        # Check discount threshold (≥ 5%)
        if discount_percent and discount_percent >= self.thresholds["discount_percent_threshold"]:
            needs_approval = True
            reasons.append(f"Chiết khấu ≥ {self.thresholds['discount_percent_threshold']}%")
        
        return {
            "needs_approval": needs_approval,
            "reason": "; ".join(reasons) if reasons else None,
            "required_role": required_role,
            "value": float(value),
            "discount_percent": discount_percent,
        }
    
    def check_booking_approval_needed(
        self,
        booking_value: Decimal,
        discount_percent: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Check if booking needs approval based on value and discount."""
        return self.check_approval_needed(booking_value, discount_percent)
    
    def check_deal_approval_needed(
        self,
        deal_value: Decimal,
        discount_percent: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Check if deal needs approval based on value and discount."""
        return self.check_approval_needed(deal_value, discount_percent)
    
    def check_discount_approval_needed(
        self,
        discount_percent: float,
    ) -> bool:
        """Check if discount needs approval."""
        return discount_percent >= self.thresholds["discount_percent_threshold"]
    
    def get_required_approver_role(self, value: Decimal) -> str:
        """
        Determine which role can approve based on value.
        
        Manager: ≤ 3 tỷ
        Director: > 3 tỷ
        """
        if value > self.thresholds["manager_limit"]:
            return ApproverRole.DIRECTOR.value
        return ApproverRole.MANAGER.value
    
    def can_user_approve(
        self,
        user_role: str,
        deal_value: Decimal,
    ) -> bool:
        """
        Check if user with given role can approve deal of given value.
        """
        required_role = self.get_required_approver_role(deal_value)
        
        # Director can approve anything
        if user_role in ["director", "org_admin", "system_admin"]:
            return True
        
        # Manager can only approve if value ≤ 3 tỷ
        if user_role == "manager":
            return required_role == ApproverRole.MANAGER.value
        
        return False
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CREATE APPROVAL REQUEST
    # ═══════════════════════════════════════════════════════════════════════════
    
    def create_approval_request(
        self,
        db: Session,
        *,
        org_id: UUID,
        request_type: str,
        reference_type: str,
        reference_id: UUID,
        title: str,
        description: Optional[str] = None,
        original_value: Optional[Decimal] = None,
        requested_value: Optional[Decimal] = None,
        discount_percent: Optional[float] = None,
        requested_by: UUID,
        metadata: Optional[Dict] = None,
    ) -> ManagerApprovalRequest:
        """Create a new approval request with auto-determined required role."""
        
        # Determine required approver role based on value
        value_to_check = requested_value or original_value or Decimal(0)
        required_role = self.get_required_approver_role(value_to_check)
        
        request = ManagerApprovalRequest(
            org_id=org_id,
            request_type=request_type,
            reference_type=reference_type,
            reference_id=reference_id,
            title=title,
            description=description,
            original_value=original_value,
            requested_value=requested_value,
            discount_percent=Decimal(str(discount_percent)) if discount_percent else None,
            required_role=required_role,
            status=ApprovalStatus.PENDING.value,
            requested_by=requested_by,
            metadata_json=metadata or {},
        )
        
        db.add(request)
        db.commit()
        db.refresh(request)
        
        # Log creation
        logger.info(
            f"APPROVAL_CREATED: id={request.id} type={request_type} "
            f"value={value_to_check} required_role={required_role} "
            f"requested_by={requested_by}"
        )
        
        return request
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET APPROVALS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_pending_approvals(
        self,
        db: Session,
        *,
        org_id: UUID,
        request_type: Optional[str] = None,
        required_role: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """Get pending approval requests, filterable by required role."""
        conditions = [
            ManagerApprovalRequest.org_id == org_id,
            ManagerApprovalRequest.status == ApprovalStatus.PENDING.value,
        ]
        
        if request_type:
            conditions.append(ManagerApprovalRequest.request_type == request_type)
        
        if required_role:
            conditions.append(ManagerApprovalRequest.required_role == required_role)
        
        # Count
        count_q = select(func.count(ManagerApprovalRequest.id)).where(and_(*conditions))
        total = db.execute(count_q).scalar() or 0
        
        # Fetch
        offset = (page - 1) * page_size
        query = select(ManagerApprovalRequest).where(and_(*conditions))
        query = query.order_by(ManagerApprovalRequest.requested_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = db.execute(query)
        requests = list(result.scalars().all())
        
        items = []
        for r in requests:
            # Get requester name
            from core.models.user import User
            user_q = select(User).where(User.id == r.requested_by)
            user = db.execute(user_q).scalar_one_or_none()
            
            items.append({
                "id": str(r.id),
                "request_type": r.request_type,
                "reference_type": r.reference_type,
                "reference_id": str(r.reference_id),
                "title": r.title,
                "description": r.description,
                "original_value": float(r.original_value) if r.original_value else None,
                "requested_value": float(r.requested_value) if r.requested_value else None,
                "discount_percent": float(r.discount_percent) if r.discount_percent else None,
                "required_role": r.required_role,
                "status": r.status,
                "requested_by": str(r.requested_by),
                "requester_name": user.full_name if user else None,
                "requested_at": r.requested_at.isoformat() if r.requested_at else None,
                "metadata": r.metadata_json,
            })
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": items,
        }
    
    def get_approval_by_id(
        self,
        db: Session,
        *,
        approval_id: UUID,
        org_id: UUID,
    ) -> Optional[ManagerApprovalRequest]:
        """Get approval request by ID."""
        query = select(ManagerApprovalRequest).where(
            and_(
                ManagerApprovalRequest.id == approval_id,
                ManagerApprovalRequest.org_id == org_id,
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    def get_approval_stats(
        self,
        db: Session,
        *,
        org_id: UUID,
    ) -> Dict[str, Any]:
        """Get approval statistics."""
        conditions = [ManagerApprovalRequest.org_id == org_id]
        
        # Count by status
        pending_q = select(func.count(ManagerApprovalRequest.id)).where(
            and_(*conditions, ManagerApprovalRequest.status == ApprovalStatus.PENDING.value)
        )
        approved_q = select(func.count(ManagerApprovalRequest.id)).where(
            and_(*conditions, ManagerApprovalRequest.status == ApprovalStatus.APPROVED.value)
        )
        rejected_q = select(func.count(ManagerApprovalRequest.id)).where(
            and_(*conditions, ManagerApprovalRequest.status == ApprovalStatus.REJECTED.value)
        )
        
        return {
            "pending": db.execute(pending_q).scalar() or 0,
            "approved": db.execute(approved_q).scalar() or 0,
            "rejected": db.execute(rejected_q).scalar() or 0,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # APPROVE / REJECT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def approve_request(
        self,
        db: Session,
        *,
        approval_id: UUID,
        org_id: UUID,
        approved_by: UUID,
        approver_role: str,
        notes: Optional[str] = None,
    ) -> ManagerApprovalRequest:
        """
        Approve a request.
        
        Validates that approver has sufficient role for the deal value.
        """
        request = self.get_approval_by_id(db, approval_id=approval_id, org_id=org_id)
        
        if not request:
            raise ValueError(f"Approval request {approval_id} not found")
        
        if request.status != ApprovalStatus.PENDING.value:
            raise ValueError(f"Request is not pending (status: {request.status})")
        
        # Check if user role can approve this value
        value = request.requested_value or request.original_value or Decimal(0)
        if not self.can_user_approve(approver_role, value):
            required = self.get_required_approver_role(value)
            raise ValueError(
                f"Approval requires {required} role. "
                f"Value {float(value):,.0f} VND exceeds your approval limit."
            )
        
        request.status = ApprovalStatus.APPROVED.value
        request.approved_by = approved_by
        request.approved_at = datetime.now(timezone.utc)
        request.updated_at = datetime.now(timezone.utc)
        
        if notes:
            request.metadata_json = request.metadata_json or {}
            request.metadata_json["approval_notes"] = notes
            request.metadata_json["approver_role"] = approver_role
        
        db.add(request)
        db.commit()
        db.refresh(request)
        
        # Log approval
        logger.info(
            f"APPROVAL_APPROVED: id={approval_id} "
            f"value={float(value):,.0f} VND "
            f"approved_by={approved_by} role={approver_role}"
        )
        
        return request
    
    def reject_request(
        self,
        db: Session,
        *,
        approval_id: UUID,
        org_id: UUID,
        rejected_by: UUID,
        rejector_role: str,
        reason: str,
    ) -> ManagerApprovalRequest:
        """Reject a request."""
        request = self.get_approval_by_id(db, approval_id=approval_id, org_id=org_id)
        
        if not request:
            raise ValueError(f"Approval request {approval_id} not found")
        
        if request.status != ApprovalStatus.PENDING.value:
            raise ValueError(f"Request is not pending (status: {request.status})")
        
        request.status = ApprovalStatus.REJECTED.value
        request.approved_by = rejected_by  # Use same field for rejector
        request.approved_at = datetime.now(timezone.utc)
        request.rejection_reason = reason
        request.updated_at = datetime.now(timezone.utc)
        
        # Log rejection in metadata
        request.metadata_json = request.metadata_json or {}
        request.metadata_json["rejector_role"] = rejector_role
        
        db.add(request)
        db.commit()
        db.refresh(request)
        
        # Log rejection
        value = request.requested_value or request.original_value or Decimal(0)
        logger.info(
            f"APPROVAL_REJECTED: id={approval_id} "
            f"value={float(value):,.0f} VND "
            f"rejected_by={rejected_by} reason={reason}"
        )
        
        return request


# Singleton instance
approval_service = ApprovalService()
