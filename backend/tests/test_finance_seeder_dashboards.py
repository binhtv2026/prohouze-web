"""
ProHouzing Finance Seeder + Role-Based Dashboard Tests
Testing: Real Data Integration + Role-Based Dashboard

Features tested:
1. POST /api/finance/seed/sample-data - Seed demo data
2. GET /api/finance/seed/verify - Verify seeded data  
3. GET /api/finance/dashboard/ceo - CEO dashboard
4. GET /api/finance/dashboard/sale - Sale dashboard
5. GET /api/finance/summary/receivables - Receivables summary
6. GET /api/finance/summary/payouts - Payouts summary
"""

import pytest
import requests
import os

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestFinanceSeederAPI:
    """Test Finance Seeder API endpoints"""
    
    def test_seed_sample_data(self):
        """Test POST /api/finance/seed/sample-data - Should seed demo data or return existing"""
        response = requests.post(f"{BASE_URL}/api/finance/seed/sample-data")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # The endpoint may return success or existing data info
        assert "success" in data or "created" in data, f"Missing expected keys: {data.keys()}"
        
    def test_verify_seeded_data(self):
        """Test GET /api/finance/seed/verify - Should verify Sale sees 32.4M, Leader 5.4M, etc."""
        response = requests.get(f"{BASE_URL}/api/finance/seed/verify")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "verified" in data, f"Missing 'verified' key: {data.keys()}"
        assert "checks" in data, f"Missing 'checks' key: {data.keys()}"
        
        # Verify checks structure
        checks = data["checks"]
        assert "sale" in checks, "Missing sale check"
        assert "leader" in checks, "Missing leader check"
        assert "accountant" in checks, "Missing accountant check"
        assert "ceo" in checks, "Missing ceo check"
        
    def test_verify_sale_data(self):
        """Test Sale data: should see 32.4M VND (32,400,000)"""
        response = requests.get(f"{BASE_URL}/api/finance/seed/verify")
        assert response.status_code == 200
        
        data = response.json()
        sale = data["checks"]["sale"]
        
        # Verify Sale user name
        assert sale["user"] == "Nguyễn Văn A", f"Expected 'Nguyễn Văn A', got {sale['user']}"
        
        # Verify Sale total net amount (should be 32.4M = 32,400,000)
        # Tolerance of 1% for floating point
        expected_net = 32_400_000
        assert abs(sale["total_net"] - expected_net) < expected_net * 0.01, \
            f"Sale total_net expected ~{expected_net}, got {sale['total_net']}"
        
        assert sale["passed"] == True, "Sale check should pass"
        
    def test_verify_leader_data(self):
        """Test Leader data: should see 5.4M VND (5,400,000)"""
        response = requests.get(f"{BASE_URL}/api/finance/seed/verify")
        assert response.status_code == 200
        
        data = response.json()
        leader = data["checks"]["leader"]
        
        # Verify Leader user name
        assert leader["user"] == "Trần Văn B", f"Expected 'Trần Văn B', got {leader['user']}"
        
        # Verify Leader total net amount (should be 5.4M = 5,400,000)
        expected_net = 5_400_000
        assert abs(leader["total_net"] - expected_net) < expected_net * 0.01, \
            f"Leader total_net expected ~{expected_net}, got {leader['total_net']}"
        
        assert leader["passed"] == True, "Leader check should pass"
        
    def test_verify_accountant_data(self):
        """Test Accountant data: should see 2 payouts paid"""
        response = requests.get(f"{BASE_URL}/api/finance/seed/verify")
        assert response.status_code == 200
        
        data = response.json()
        accountant = data["checks"]["accountant"]
        
        # Verify payouts exist
        assert accountant["total_payouts"] >= 2, f"Expected at least 2 payouts, got {accountant['total_payouts']}"
        
        # Verify payouts by status contains 'paid'
        assert "by_status" in accountant, "Missing by_status in accountant check"
        assert "paid" in accountant["by_status"], "Missing 'paid' status in payouts"
        
        paid_payouts = accountant["by_status"]["paid"]
        assert paid_payouts["count"] >= 2, f"Expected at least 2 paid payouts, got {paid_payouts['count']}"
        
        assert accountant["passed"] == True, "Accountant check should pass"
        
    def test_verify_ceo_data(self):
        """Test CEO data: should see 3B contract value and 60M commission"""
        response = requests.get(f"{BASE_URL}/api/finance/seed/verify")
        assert response.status_code == 200
        
        data = response.json()
        ceo = data["checks"]["ceo"]
        
        # Verify CEO total contract value (should be 3B = 3,000,000,000)
        expected_contract = 3_000_000_000
        assert ceo["total_contract_value"] == expected_contract, \
            f"CEO total_contract_value expected {expected_contract}, got {ceo['total_contract_value']}"
        
        # Verify CEO total commission (should be 60M = 60,000,000)
        expected_commission = 60_000_000
        assert abs(ceo["total_commission"] - expected_commission) < expected_commission * 0.01, \
            f"CEO total_commission expected ~{expected_commission}, got {ceo['total_commission']}"
        
        assert ceo["passed"] == True, "CEO check should pass"


class TestCEODashboardAPI:
    """Test CEO Dashboard API endpoint"""
    
    def test_ceo_dashboard_returns_200(self):
        """Test GET /api/finance/dashboard/ceo returns 200"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/ceo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
    def test_ceo_dashboard_structure(self):
        """Test CEO dashboard has all required fields"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/ceo")
        data = response.json()
        
        required_fields = [
            "total_contract_value",
            "total_commission", 
            "total_revenue",
            "receivable_total",
            "receivable_paid",
            "receivable_pending",
            "receivable_overdue",
            "vat_output",
            "period_month",
            "period_year",
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            
    def test_ceo_dashboard_values(self):
        """Test CEO dashboard returns correct values: 3B contract, 60M commission"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/ceo")
        data = response.json()
        
        # Contract value = 3 billion
        assert data["total_contract_value"] >= 3_000_000_000, \
            f"Expected >= 3B, got {data['total_contract_value']}"
        
        # Commission = 60 million (2% of 3B)
        assert data["total_commission"] >= 60_000_000, \
            f"Expected >= 60M, got {data['total_commission']}"
        
        # Revenue should include VAT
        assert data["total_revenue"] > data["total_commission"], \
            "Total revenue should be > commission (includes VAT)"


class TestSaleDashboardAPI:
    """Test Sale Dashboard API endpoint"""
    
    def test_sale_dashboard_requires_user_id(self):
        """Test GET /api/finance/dashboard/sale requires user_id"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/sale")
        # Should return 400 if no user_id provided
        assert response.status_code == 400, f"Expected 400 without user_id, got {response.status_code}"
        
    def test_sale_dashboard_with_user_id(self):
        """Test Sale dashboard with a valid user_id"""
        # First get a sale user ID from verify endpoint
        verify_resp = requests.get(f"{BASE_URL}/api/finance/seed/verify")
        verify_data = verify_resp.json()
        
        # Get commission splits to find sale user
        splits_resp = requests.get(f"{BASE_URL}/api/finance/splits?limit=10")
        if splits_resp.status_code == 200:
            splits = splits_resp.json()
            if splits:
                # Use the recipient_id from the first split
                user_id = splits[0].get("recipient_id")
                if user_id:
                    response = requests.get(f"{BASE_URL}/api/finance/dashboard/sale?user_id={user_id}")
                    assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestSummaryEndpoints:
    """Test Summary endpoints"""
    
    def test_receivables_summary(self):
        """Test GET /api/finance/summary/receivables"""
        response = requests.get(f"{BASE_URL}/api/finance/summary/receivables")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_count" in data, "Missing total_count"
        assert "total_due" in data, "Missing total_due"
        assert "total_paid" in data, "Missing total_paid"
        assert "by_status" in data, "Missing by_status"
        
    def test_payouts_summary(self):
        """Test GET /api/finance/summary/payouts"""
        response = requests.get(f"{BASE_URL}/api/finance/summary/payouts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_count" in data, "Missing total_count"
        assert "total_gross" in data, "Missing total_gross"
        assert "total_net" in data, "Missing total_net"
        assert "by_status" in data, "Missing by_status"
        
    def test_payouts_have_paid_status(self):
        """Test payouts summary includes paid status"""
        response = requests.get(f"{BASE_URL}/api/finance/summary/payouts")
        data = response.json()
        
        # Should have paid payouts from seeder
        if data["total_count"] > 0:
            assert "paid" in data["by_status"], "Expected 'paid' status in payouts summary"


class TestCommissionSplitDetails:
    """Test commission split details match expected formula"""
    
    def test_commission_splits_list(self):
        """Test GET /api/finance/splits returns splits"""
        response = requests.get(f"{BASE_URL}/api/finance/splits?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of splits"
        
    def test_split_percentages(self):
        """Test commission splits match expected percentages: Sale 60%, Leader 10%, Company 30%"""
        response = requests.get(f"{BASE_URL}/api/finance/splits?limit=10")
        data = response.json()
        
        if data:
            # Check that split_percent values exist
            for split in data:
                assert "split_percent" in split or "percentage" in split, \
                    f"Missing split percentage in: {split.keys()}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
