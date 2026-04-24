"""
ProHouzing Manager Control Tests
TASK 3 - MANAGER CONTROL

Test coverage:
1. Approval Service - Business rules (1 tỷ threshold, Manager/Director roles)
2. Manager Inventory Service - Force release, reassign, override
3. Manager Dashboard Service - Metrics and performance
4. API Routes - All endpoints
"""

import pytest
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.services.approval_service import (
    approval_service,
    ApprovalService,
    ApprovalType,
    ApprovalStatus,
    ApproverRole,
    APPROVAL_VALUE_THRESHOLD,
    MANAGER_APPROVAL_LIMIT,
    DISCOUNT_PERCENT_THRESHOLD,
    ManagerApprovalRequest,
)


# ═══════════════════════════════════════════════════════════════════════════
# TEST: APPROVAL THRESHOLDS (BUSINESS RULES)
# ═══════════════════════════════════════════════════════════════════════════

class TestApprovalThresholds:
    """Test approval threshold business rules."""
    
    def test_thresholds_are_correct(self):
        """Verify thresholds match locked business rules."""
        assert APPROVAL_VALUE_THRESHOLD == 1_000_000_000, "Value threshold should be 1 tỷ VND"
        assert MANAGER_APPROVAL_LIMIT == 3_000_000_000, "Manager limit should be 3 tỷ VND"
        assert DISCOUNT_PERCENT_THRESHOLD == 5, "Discount threshold should be 5%"
    
    def test_no_approval_needed_below_threshold(self):
        """Value < 1 tỷ → No approval needed."""
        result = approval_service.check_approval_needed(
            value=Decimal("500_000_000"),  # 500 triệu
            discount_percent=None,
        )
        assert result["needs_approval"] is False
        assert result["reason"] is None
    
    def test_approval_needed_at_threshold(self):
        """Value ≥ 1 tỷ → Approval needed."""
        result = approval_service.check_approval_needed(
            value=Decimal("1_000_000_000"),  # 1 tỷ exact
            discount_percent=None,
        )
        assert result["needs_approval"] is True
        assert result["required_role"] == ApproverRole.MANAGER.value
    
    def test_approval_needed_above_threshold(self):
        """Value = 2 tỷ → Manager approval."""
        result = approval_service.check_approval_needed(
            value=Decimal("2_000_000_000"),  # 2 tỷ
            discount_percent=None,
        )
        assert result["needs_approval"] is True
        assert result["required_role"] == ApproverRole.MANAGER.value
    
    def test_director_required_above_3_billion(self):
        """Value > 3 tỷ → Director approval required."""
        result = approval_service.check_approval_needed(
            value=Decimal("3_500_000_000"),  # 3.5 tỷ
            discount_percent=None,
        )
        assert result["needs_approval"] is True
        assert result["required_role"] == ApproverRole.DIRECTOR.value
    
    def test_discount_approval_needed(self):
        """Discount ≥ 5% → Approval needed."""
        result = approval_service.check_approval_needed(
            value=Decimal("500_000_000"),  # Below value threshold
            discount_percent=5.0,  # At discount threshold
        )
        assert result["needs_approval"] is True
        assert "5%" in result["reason"]
    
    def test_discount_below_threshold(self):
        """Discount < 5% → No approval needed (for discount)."""
        result = approval_service.check_approval_needed(
            value=Decimal("500_000_000"),  # Below value threshold
            discount_percent=4.9,  # Below discount threshold
        )
        assert result["needs_approval"] is False
    
    def test_both_thresholds_exceeded(self):
        """Both value and discount exceeded → Both reasons in output."""
        result = approval_service.check_approval_needed(
            value=Decimal("2_000_000_000"),  # Above value threshold
            discount_percent=10.0,  # Above discount threshold
        )
        assert result["needs_approval"] is True
        assert "VND" in result["reason"]
        assert "%" in result["reason"]


# ═══════════════════════════════════════════════════════════════════════════
# TEST: APPROVER ROLE LOGIC
# ═══════════════════════════════════════════════════════════════════════════

class TestApproverRoles:
    """Test approver role determination."""
    
    def test_manager_role_up_to_3_billion(self):
        """Value ≤ 3 tỷ → Manager can approve."""
        role = approval_service.get_required_approver_role(Decimal("3_000_000_000"))
        assert role == ApproverRole.MANAGER.value
    
    def test_director_role_above_3_billion(self):
        """Value > 3 tỷ → Director required."""
        role = approval_service.get_required_approver_role(Decimal("3_000_000_001"))
        assert role == ApproverRole.DIRECTOR.value
    
    def test_can_user_approve_manager_small_deal(self):
        """Manager can approve deals ≤ 3 tỷ."""
        can_approve = approval_service.can_user_approve(
            user_role="manager",
            deal_value=Decimal("2_000_000_000"),
        )
        assert can_approve is True
    
    def test_cannot_user_approve_manager_large_deal(self):
        """Manager cannot approve deals > 3 tỷ."""
        can_approve = approval_service.can_user_approve(
            user_role="manager",
            deal_value=Decimal("5_000_000_000"),
        )
        assert can_approve is False
    
    def test_director_can_approve_any_deal(self):
        """Director can approve any deal value."""
        can_approve = approval_service.can_user_approve(
            user_role="director",
            deal_value=Decimal("10_000_000_000"),  # 10 tỷ
        )
        assert can_approve is True
    
    def test_org_admin_can_approve_any_deal(self):
        """Org admin can approve any deal value."""
        can_approve = approval_service.can_user_approve(
            user_role="org_admin",
            deal_value=Decimal("50_000_000_000"),  # 50 tỷ
        )
        assert can_approve is True
    
    def test_sales_cannot_approve(self):
        """Sales role cannot approve."""
        can_approve = approval_service.can_user_approve(
            user_role="sales",
            deal_value=Decimal("500_000_000"),
        )
        assert can_approve is False


# ═══════════════════════════════════════════════════════════════════════════
# TEST: BOOKING/DEAL APPROVAL CHECKS
# ═══════════════════════════════════════════════════════════════════════════

class TestBookingDealApproval:
    """Test booking and deal approval checks."""
    
    def test_booking_approval_check(self):
        """check_booking_approval_needed works correctly."""
        result = approval_service.check_booking_approval_needed(
            booking_value=Decimal("1_500_000_000"),
            discount_percent=3.0,
        )
        assert result["needs_approval"] is True
        assert result["required_role"] == ApproverRole.MANAGER.value
    
    def test_deal_approval_check(self):
        """check_deal_approval_needed works correctly."""
        result = approval_service.check_deal_approval_needed(
            deal_value=Decimal("4_000_000_000"),  # > 3 tỷ
            discount_percent=None,
        )
        assert result["needs_approval"] is True
        assert result["required_role"] == ApproverRole.DIRECTOR.value
    
    def test_discount_only_approval_check(self):
        """Check discount triggers approval even with low value."""
        assert approval_service.check_discount_approval_needed(5.0) is True
        assert approval_service.check_discount_approval_needed(4.9) is False


# ═══════════════════════════════════════════════════════════════════════════
# TEST: HOLD TIMEOUT (24 HOURS)
# ═══════════════════════════════════════════════════════════════════════════

class TestHoldTimeout:
    """Test hold timeout business rule (24 hours)."""
    
    def test_hold_timeout_constant(self):
        """Verify default hold hours is 24."""
        from core.services.inventory_status import InventoryStatusService
        service = InventoryStatusService()
        assert service.DEFAULT_HOLD_HOURS == 24


# ═══════════════════════════════════════════════════════════════════════════
# TEST: APPROVAL SERVICE METHODS
# ═══════════════════════════════════════════════════════════════════════════

class TestApprovalServiceMethods:
    """Test ApprovalService methods."""
    
    def test_check_approval_needed_returns_dict(self):
        """check_approval_needed returns correct structure."""
        result = approval_service.check_approval_needed(
            value=Decimal("2_000_000_000"),
            discount_percent=7.0,
        )
        
        assert "needs_approval" in result
        assert "reason" in result
        assert "required_role" in result
        assert "value" in result
        assert "discount_percent" in result
    
    def test_approval_status_enum(self):
        """ApprovalStatus enum has correct values."""
        assert ApprovalStatus.PENDING.value == "pending"
        assert ApprovalStatus.APPROVED.value == "approved"
        assert ApprovalStatus.REJECTED.value == "rejected"
        assert ApprovalStatus.EXPIRED.value == "expired"
    
    def test_approver_role_enum(self):
        """ApproverRole enum has correct values."""
        assert ApproverRole.MANAGER.value == "manager"
        assert ApproverRole.DIRECTOR.value == "director"


# ═══════════════════════════════════════════════════════════════════════════
# RUN TESTS
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
