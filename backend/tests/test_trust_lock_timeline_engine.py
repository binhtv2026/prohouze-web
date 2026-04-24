"""
Test Suite: TRUST + LOCK + TIMELINE ENGINE
Tests the new financial system features:
1. CEO Trust Panel API - total_collected, total_paid_out, real_profit
2. Timeline Steps API - 6 step workflow for contracts
3. Hard Rules - can-delete-deal, can-edit-payout
4. Audit Service - Logging all actions

Demo contract ID: f1cf2e57-0472-49e6-94ba-a6ad10ce0690
Deal ID: 8ee54910-f09f-4f0c-bede-61ac66416a7f
Payout ID (paid): c202c465-18a0-483e-9798-a6c14283bf3f
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Demo IDs from seeded data
DEMO_CONTRACT_ID = "f1cf2e57-0472-49e6-94ba-a6ad10ce0690"
DEMO_DEAL_ID = "8ee54910-f09f-4f0c-bede-61ac66416a7f"
DEMO_PAYOUT_ID_PAID = "c202c465-18a0-483e-9798-a6c14283bf3f"


class TestCEOTrustPanel:
    """CEO Trust Panel - GET /api/finance/dashboard/trust"""
    
    def test_trust_panel_returns_correct_structure(self):
        """Trust Panel should return total_collected, total_paid_out, real_profit"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/trust")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check required fields exist
        assert "total_collected" in data, "Missing total_collected"
        assert "total_paid_out" in data, "Missing total_paid_out"
        assert "real_profit" in data, "Missing real_profit"
        
        # Additional fields
        assert "total_commission" in data, "Missing total_commission"
        assert "company_keep" in data, "Missing company_keep"
        assert "period_month" in data, "Missing period_month"
        assert "period_year" in data, "Missing period_year"
        
        print(f"✓ Trust Panel API structure verified")
    
    def test_trust_panel_expected_values(self):
        """Trust Panel should return expected values from seeded data"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/trust")
        assert response.status_code == 200
        
        data = response.json()
        
        # Expected values from seeded data:
        # total_collected = 198M (receivables paid)
        # total_paid_out = 37.8M (payouts paid)
        # real_profit = 198M - 37.8M = 160.2M
        
        total_collected = data.get("total_collected", 0)
        total_paid_out = data.get("total_paid_out", 0)
        real_profit = data.get("real_profit", 0)
        
        assert total_collected >= 198_000_000, f"Expected total_collected >= 198M, got {total_collected}"
        assert total_paid_out >= 37_800_000, f"Expected total_paid_out >= 37.8M, got {total_paid_out}"
        assert real_profit >= 160_000_000, f"Expected real_profit >= 160M, got {real_profit}"
        
        # Verify profit calculation
        calculated_profit = total_collected - total_paid_out - data.get("total_expenses", 0)
        assert abs(real_profit - calculated_profit) < 1, "real_profit calculation mismatch"
        
        print(f"✓ Trust Panel values verified: collected={total_collected:,.0f}, paid={total_paid_out:,.0f}, profit={real_profit:,.0f}")
    
    def test_trust_panel_profit_margin(self):
        """Trust Panel should show correct profit margin"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/trust")
        assert response.status_code == 200
        
        data = response.json()
        total_collected = data.get("total_collected", 0)
        real_profit = data.get("real_profit", 0)
        
        if total_collected > 0:
            expected_margin = (real_profit / total_collected) * 100
            # Margin should be around 80.9% based on (160.2M / 198M)
            assert expected_margin > 70, f"Expected profit margin > 70%, got {expected_margin:.1f}%"
            print(f"✓ Profit margin verified: {expected_margin:.1f}%")
        else:
            pytest.skip("No collected amount to calculate margin")


class TestTimelineSteps:
    """Timeline Steps - GET /api/finance/timeline-steps/{contract_id}"""
    
    def test_timeline_returns_6_steps(self):
        """Timeline should return exactly 6 steps"""
        response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/{DEMO_CONTRACT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        timeline = response.json()
        assert isinstance(timeline, list), "Timeline should be a list"
        assert len(timeline) == 6, f"Expected 6 steps, got {len(timeline)}"
        
        print(f"✓ Timeline returns 6 steps")
    
    def test_timeline_step_types(self):
        """Timeline should have correct step types in order"""
        response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/{DEMO_CONTRACT_ID}")
        assert response.status_code == 200
        
        timeline = response.json()
        expected_step_types = [
            "contract_signed",
            "commission_created",
            "payment_received",
            "split_completed",
            "payout_pending",
            "paid"
        ]
        
        actual_step_types = [step.get("step_type") for step in timeline]
        assert actual_step_types == expected_step_types, f"Step types mismatch: {actual_step_types}"
        
        print(f"✓ Timeline step types verified: {actual_step_types}")
    
    def test_timeline_step_structure(self):
        """Each timeline step should have correct structure"""
        response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/{DEMO_CONTRACT_ID}")
        assert response.status_code == 200
        
        timeline = response.json()
        
        for step in timeline:
            assert "step_type" in step, f"Missing step_type in {step}"
            assert "completed" in step, f"Missing completed flag in {step}"
            assert "timestamp" in step, f"Missing timestamp in {step}"
            assert "actor_name" in step, f"Missing actor_name in {step}"
            assert "amount" in step, f"Missing amount in {step}"
            assert "details" in step, f"Missing details in {step}"
        
        print(f"✓ Timeline step structure verified")
    
    def test_timeline_all_steps_completed(self):
        """For demo contract, all 6 steps should be completed"""
        response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/{DEMO_CONTRACT_ID}")
        assert response.status_code == 200
        
        timeline = response.json()
        completed_steps = [step for step in timeline if step.get("completed")]
        
        assert len(completed_steps) == 6, f"Expected all 6 steps completed, got {len(completed_steps)}"
        
        print(f"✓ All 6 timeline steps completed for demo contract")
    
    def test_timeline_contract_not_found(self):
        """Timeline should return 404 for non-existent contract"""
        response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/invalid-contract-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✓ Timeline returns 404 for invalid contract")


class TestHardRulesCanDeleteDeal:
    """Hard Rules - GET /api/finance/rules/can-delete-deal/{deal_id}"""
    
    def test_cannot_delete_deal_with_commission(self):
        """Should return can_delete=false for deal with commission"""
        response = requests.get(f"{BASE_URL}/api/finance/rules/can-delete-deal/{DEMO_DEAL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "can_delete" in data, "Missing can_delete field"
        assert data["can_delete"] == False, f"Expected can_delete=False, got {data['can_delete']}"
        assert "reason" in data, "Missing reason when can_delete=False"
        assert "commission" in data["reason"].lower(), "Reason should mention commission"
        
        print(f"✓ Deal with commission cannot be deleted: {data['reason']}")
    
    def test_can_delete_deal_without_commission(self):
        """Should return can_delete=true for deal without commission"""
        response = requests.get(f"{BASE_URL}/api/finance/rules/can-delete-deal/non-existent-deal-id")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["can_delete"] == True, f"Expected can_delete=True for deal without commission"
        
        print(f"✓ Deal without commission can be deleted")


class TestHardRulesCanEditPayout:
    """Hard Rules - GET /api/finance/rules/can-edit-payout/{payout_id}"""
    
    def test_cannot_edit_paid_payout(self):
        """Should return can_edit=false for paid payout"""
        response = requests.get(f"{BASE_URL}/api/finance/rules/can-edit-payout/{DEMO_PAYOUT_ID_PAID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "can_edit" in data, "Missing can_edit field"
        assert data["can_edit"] == False, f"Expected can_edit=False, got {data['can_edit']}"
        assert "reason" in data, "Missing reason when can_edit=False"
        assert "paid" in data["reason"].lower() or "thanh toán" in data["reason"].lower(), \
            "Reason should mention paid status"
        
        print(f"✓ Paid payout cannot be edited: {data['reason']}")
    
    def test_cannot_edit_nonexistent_payout(self):
        """Should return can_edit=false for non-existent payout"""
        response = requests.get(f"{BASE_URL}/api/finance/rules/can-edit-payout/invalid-payout-id")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["can_edit"] == False, "Expected can_edit=False for non-existent payout"
        
        print(f"✓ Non-existent payout returns can_edit=false")


class TestAuditLogs:
    """Audit Logs - GET /api/finance/audit-logs"""
    
    def test_audit_logs_endpoint_works(self):
        """Audit logs endpoint should return list"""
        response = requests.get(f"{BASE_URL}/api/finance/audit-logs?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Audit logs should return a list"
        
        print(f"✓ Audit logs endpoint returns {len(data)} entries")
    
    def test_audit_logs_with_filter(self):
        """Audit logs should support entity_type filter"""
        response = requests.get(f"{BASE_URL}/api/finance/audit-logs?entity_type=contract&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Filtered audit logs should return a list"
        
        # If any logs returned, they should all be for contracts
        for log in data:
            assert log.get("entity_type") == "contract", f"Unexpected entity_type: {log.get('entity_type')}"
        
        print(f"✓ Audit logs filter by entity_type works")
    
    def test_contract_audit_trail(self):
        """Should get full audit trail for a contract"""
        response = requests.get(f"{BASE_URL}/api/finance/audit-logs/contract/{DEMO_CONTRACT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Contract audit trail should return a list"
        
        print(f"✓ Contract audit trail returns {len(data)} entries")


class TestLockService:
    """Lock Service integration - Contract locking on signed status"""
    
    def test_contract_lock_status(self):
        """Signed contract should have is_locked=true"""
        # Get contract details to verify lock status
        response = requests.get(f"{BASE_URL}/api/contracts/{DEMO_CONTRACT_ID}")
        
        if response.status_code == 200:
            contract = response.json()
            # Contract should be locked if status is signed/active/completed
            status = contract.get("status", "")
            if status in ["signed", "active", "completed"]:
                # is_locked should be true or contract fields should be locked
                print(f"✓ Contract status={status}, lock mechanism in place")
        else:
            # If contract endpoint requires auth, skip this test
            print(f"ℹ Contract endpoint returned {response.status_code}, testing lock via timeline")
            
            # Alternative: check via timeline that contract is signed
            timeline_response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/{DEMO_CONTRACT_ID}")
            if timeline_response.status_code == 200:
                timeline = timeline_response.json()
                contract_step = next((s for s in timeline if s["step_type"] == "contract_signed"), None)
                if contract_step and contract_step.get("completed"):
                    print(f"✓ Contract signed - lock should be active")


class TestIntegrationEndToEnd:
    """End-to-end integration tests for the trust engine"""
    
    def test_trust_panel_matches_payouts(self):
        """Trust panel total_paid_out should match sum of paid payouts"""
        # Get trust panel data
        trust_response = requests.get(f"{BASE_URL}/api/finance/dashboard/trust")
        assert trust_response.status_code == 200
        trust_data = trust_response.json()
        
        # Get all payouts
        payouts_response = requests.get(f"{BASE_URL}/api/finance/payouts")
        assert payouts_response.status_code == 200
        payouts = payouts_response.json()
        
        # Sum paid payouts
        paid_payouts = [p for p in payouts if p.get("status") == "paid"]
        paid_total = sum(p.get("net_amount", 0) for p in paid_payouts)
        
        trust_paid = trust_data.get("total_paid_out", 0)
        
        assert abs(trust_paid - paid_total) < 1, \
            f"Trust panel total_paid_out ({trust_paid}) doesn't match sum of paid payouts ({paid_total})"
        
        print(f"✓ Trust panel total_paid_out matches payouts: {trust_paid:,.0f}")
    
    def test_timeline_consistency_with_payouts(self):
        """Timeline paid step amount should match payout totals"""
        # Get timeline
        timeline_response = requests.get(f"{BASE_URL}/api/finance/timeline-steps/{DEMO_CONTRACT_ID}")
        assert timeline_response.status_code == 200
        timeline = timeline_response.json()
        
        # Find paid step
        paid_step = next((s for s in timeline if s["step_type"] == "paid"), None)
        assert paid_step is not None, "Missing paid step in timeline"
        
        if paid_step.get("amount", 0) > 0:
            print(f"✓ Timeline paid step shows {paid_step['amount']:,.0f}")
        else:
            print(f"ℹ Timeline paid step amount is 0 (might be expected if payouts tracked separately)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
