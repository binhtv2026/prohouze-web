"""
Commission Engine API Tests - Prompt 11/20
Tests for Commission APIs including:
- Config endpoints (triggers, split-types, statuses)
- Policy CRUD
- Income dashboard
- Approval workflow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com')


@pytest.fixture(scope="session")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@prohouzing.vn",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG API TESTS (No auth required)
# ═══════════════════════════════════════════════════════════════════════════════

class TestConfigAPIs:
    """Test config endpoints - no authentication required"""
    
    def test_get_triggers(self):
        """Test /api/commission/config/triggers returns list of triggers"""
        response = requests.get(f"{BASE_URL}/api/commission/config/triggers")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify structure of trigger
        trigger = data[0]
        assert "value" in trigger
        assert "label" in trigger
        assert "label_en" in trigger
        print(f"✓ Got {len(data)} triggers. First: {trigger['value']} - {trigger['label']}")
    
    def test_get_split_types(self):
        """Test /api/commission/config/split-types returns list of split types"""
        response = requests.get(f"{BASE_URL}/api/commission/config/split-types")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify expected split types exist
        split_values = [s["value"] for s in data]
        assert "closing_sales" in split_values
        assert "team_leader" in split_values
        assert "company_pool" in split_values
        print(f"✓ Got {len(data)} split types: {split_values}")
    
    def test_get_statuses(self):
        """Test /api/commission/config/statuses returns list of statuses"""
        response = requests.get(f"{BASE_URL}/api/commission/config/statuses")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify expected statuses exist
        status_values = [s["value"] for s in data]
        assert "pending" in status_values
        assert "approved" in status_values
        assert "paid" in status_values
        print(f"✓ Got {len(data)} statuses: {status_values}")


# ═══════════════════════════════════════════════════════════════════════════════
# POLICY CRUD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPolicyAPIs:
    """Test policy CRUD endpoints"""
    
    def test_list_policies(self, auth_headers):
        """Test /api/commission/policies returns list of policies"""
        response = requests.get(
            f"{BASE_URL}/api/commission/policies",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} policies")
    
    def test_create_policy(self, auth_headers):
        """Test creating a new commission policy"""
        policy_data = {
            "name": "TEST_Policy_Commission_Engine",
            "description": "Test policy for automated testing",
            "scope_type": "global",
            "brokerage_rate_type": "percent",
            "brokerage_rate_value": 2.0,
            "trigger_event": "contract_signed",
            "estimated_trigger": "booking_confirmed",
            "effective_from": "2026-01-01",
            "requires_approval_above": 50000000,
            "approval_levels": 1,
            "split_rules": [
                {
                    "split_type": "closing_sales",
                    "calc_type": "percent_of_brokerage",
                    "calc_value": 70,
                    "recipient_source": "deal_owner",
                    "recipient_role": "sales"
                },
                {
                    "split_type": "team_leader",
                    "calc_type": "percent_of_brokerage",
                    "calc_value": 10,
                    "recipient_source": "team_leader",
                    "recipient_role": "team_leader"
                },
                {
                    "split_type": "support_role",
                    "calc_type": "percent_of_brokerage",
                    "calc_value": 5,
                    "recipient_source": "manual",
                    "recipient_role": "support"
                },
                {
                    "split_type": "company_pool",
                    "calc_type": "percent_of_brokerage",
                    "calc_value": 15,
                    "recipient_source": "company",
                    "recipient_role": "company"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/commission/policies",
            headers=auth_headers,
            json=policy_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Policy_Commission_Engine"
        assert data["status"] == "draft"
        assert data["brokerage_rate_value"] == 2.0
        assert len(data["split_rules"]) == 4
        assert data["total_split_percent"] == 100.0
        
        print(f"✓ Created policy: {data['code']} - {data['name']}")
        return data["id"]
    
    def test_activate_policy(self, auth_headers):
        """Test activating a policy"""
        # First create a policy
        policy_data = {
            "name": "TEST_Policy_Activate_Test",
            "scope_type": "global",
            "brokerage_rate_type": "percent",
            "brokerage_rate_value": 1.5,
            "trigger_event": "contract_signed",
            "estimated_trigger": "booking_confirmed",
            "effective_from": "2026-01-01",
            "requires_approval_above": 50000000,
            "approval_levels": 1,
            "split_rules": [
                {"split_type": "closing_sales", "calc_type": "percent_of_brokerage", "calc_value": 100, "recipient_source": "deal_owner", "recipient_role": "sales"}
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/commission/policies",
            headers=auth_headers,
            json=policy_data
        )
        assert create_response.status_code == 200
        policy_id = create_response.json()["id"]
        
        # Activate
        activate_response = requests.post(
            f"{BASE_URL}/api/commission/policies/{policy_id}/activate",
            headers=auth_headers
        )
        
        assert activate_response.status_code == 200
        data = activate_response.json()
        assert data["success"] == True
        print(f"✓ Activated policy: {policy_id}")
    
    def test_get_policy_by_id(self, auth_headers):
        """Test getting a specific policy by ID"""
        # First list to get an ID
        list_response = requests.get(
            f"{BASE_URL}/api/commission/policies",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        policies = list_response.json()
        
        if len(policies) > 0:
            policy_id = policies[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/commission/policies/{policy_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == policy_id
            print(f"✓ Got policy by ID: {data['code']} - {data['name']}")
        else:
            pytest.skip("No policies available to test")


# ═══════════════════════════════════════════════════════════════════════════════
# INCOME DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestIncomeAPIs:
    """Test income dashboard endpoints"""
    
    def test_get_my_income(self, auth_headers):
        """Test /api/commission/my-income returns income summary"""
        response = requests.get(
            f"{BASE_URL}/api/commission/my-income?year=2026&month=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "period_year" in data
        assert "period_month" in data
        assert "estimated_amount" in data
        assert "approved_amount" in data
        assert "paid_amount" in data
        
        print(f"✓ Got income summary: {data['period_label']}")
    
    def test_get_my_income_records(self, auth_headers):
        """Test /api/commission/my-income/records returns list of records"""
        response = requests.get(
            f"{BASE_URL}/api/commission/my-income/records",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} income records")
    
    def test_get_team_income(self, auth_headers):
        """Test /api/commission/team-income returns team income summary"""
        response = requests.get(
            f"{BASE_URL}/api/commission/team-income?year=2026&month=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "period_year" in data
        print(f"✓ Got team income summary")
    
    def test_get_company_income(self, auth_headers):
        """Test /api/commission/company-income returns company income summary"""
        response = requests.get(
            f"{BASE_URL}/api/commission/company-income?year=2026&month=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "period_year" in data
        assert "period_month" in data
        print(f"✓ Got company income summary")


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL WORKFLOW TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestApprovalAPIs:
    """Test approval workflow endpoints"""
    
    def test_get_pending_approvals(self, auth_headers):
        """Test /api/commission/approvals/pending returns list"""
        response = requests.get(
            f"{BASE_URL}/api/commission/approvals/pending",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} pending approvals")


# ═══════════════════════════════════════════════════════════════════════════════
# RECORDS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestRecordAPIs:
    """Test commission record endpoints"""
    
    def test_list_records(self, auth_headers):
        """Test /api/commission/records returns list"""
        response = requests.get(
            f"{BASE_URL}/api/commission/records",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} commission records")
    
    def test_list_records_with_filters(self, auth_headers):
        """Test records listing with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/commission/records?status=pending",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} pending commission records")


# ═══════════════════════════════════════════════════════════════════════════════
# PAYOUT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPayoutAPIs:
    """Test payout endpoints"""
    
    def test_list_payout_batches(self, auth_headers):
        """Test /api/commission/payouts/batches returns list"""
        response = requests.get(
            f"{BASE_URL}/api/commission/payouts/batches",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} payout batches")
    
    def test_get_ready_for_payout(self, auth_headers):
        """Test /api/commission/payouts/ready-for-payout"""
        response = requests.get(
            f"{BASE_URL}/api/commission/payouts/ready-for-payout",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} records ready for payout")


# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestStatsAPIs:
    """Test statistics endpoints"""
    
    def test_get_commission_overview(self, auth_headers):
        """Test /api/commission/stats/overview returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/commission/stats/overview?year=2026&month=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "pending_approvals" in data
        assert "ready_for_payout" in data
        print(f"✓ Got commission overview stats")


# ═══════════════════════════════════════════════════════════════════════════════
# CALCULATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCalculationAPIs:
    """Test calculation endpoints"""
    
    def test_calculate_with_invalid_contract(self, auth_headers):
        """Test /api/commission/calculate returns 404 for invalid contract"""
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            headers=auth_headers,
            json={"contract_id": "non-existent-contract"}
        )
        
        assert response.status_code == 404
        print(f"✓ Got 404 for invalid contract as expected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
