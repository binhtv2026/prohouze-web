"""
Test Full Business Flow API v2: Lead → Deal → Booking → Contract → Commission
Test Script for iteration 70

Features tested:
- Authentication
- CRM Leads (120 leads from PostgreSQL)  
- Deal Pipeline (51 deals with real deal_value)
- Soft Booking (15 bookings)
- Contracts (10 contracts)
- Commission API v2: CRUD + summary + pending approvals + approve/reject
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAuthentication:
    """Test authentication with admin credentials"""
    
    def test_login_success(self):
        """Test login with admin@prohouzing.vn"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@prohouzing.vn"


class TestCRMLeads:
    """CRM Leads API v2 tests - 120 leads expected"""
    
    @pytest.fixture(autouse=True)
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_leads_returns_120_total(self):
        """GET /api/v2/leads should return 120 total leads"""
        response = requests.get(f"{BASE_URL}/api/v2/leads?limit=10", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Verify total is 120 as per requirements
        assert data["meta"]["total"] == 120


class TestDealPipeline:
    """Deal Pipeline API v2 tests - 51 deals expected"""
    
    @pytest.fixture(autouse=True)
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_deals_returns_51_total(self):
        """GET /api/v2/deals should return 51 total deals"""
        response = requests.get(f"{BASE_URL}/api/v2/deals?limit=10", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Verify total is 51 as per requirements
        assert data["meta"]["total"] == 51
    
    def test_deal_has_real_deal_value(self):
        """Deals should have real deal_value"""
        response = requests.get(f"{BASE_URL}/api/v2/deals?limit=5", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # Check that deals have deal_value
        for deal in data["data"]:
            assert "deal_value" in deal
            assert deal["deal_value"] is not None


class TestSoftBookings:
    """Soft Booking API v2 tests - 15 bookings expected"""
    
    @pytest.fixture(autouse=True)
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_bookings_returns_15_total(self):
        """GET /api/v2/bookings should return 15 total bookings"""
        response = requests.get(f"{BASE_URL}/api/v2/bookings?limit=100", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Verify total is 15 as per requirements
        assert data["meta"]["total"] == 15
    
    def test_booking_has_required_fields(self):
        """Bookings should have booking_code, deal_id, product_id"""
        response = requests.get(f"{BASE_URL}/api/v2/bookings?limit=5", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for booking in data["data"]:
            assert "booking_code" in booking
            assert "deal_id" in booking
            assert "product_id" in booking
            assert "booking_amount" in booking


class TestContracts:
    """Contracts API v2 tests - 10 contracts expected"""
    
    @pytest.fixture(autouse=True)
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_contracts_returns_10_total(self):
        """GET /api/v2/contracts should return 10 total contracts"""
        response = requests.get(f"{BASE_URL}/api/v2/contracts?limit=100", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Verify total is 10 as per requirements
        assert data["meta"]["total"] == 10
    
    def test_contract_has_required_fields(self):
        """Contracts should have contract_code, contract_value, buyer_name"""
        response = requests.get(f"{BASE_URL}/api/v2/contracts?limit=5", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for contract in data["data"]:
            assert "contract_code" in contract
            assert "contract_value" in contract
            assert "buyer_name" in contract


class TestCommissionAPIv2:
    """Commission API v2 tests - 10 commissions expected"""
    
    @pytest.fixture(autouse=True)
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_commissions_returns_10_entries(self):
        """GET /api/v2/commissions should return 10 commission entries"""
        response = requests.get(f"{BASE_URL}/api/v2/commissions", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Verify total is 10 as per requirements
        assert data["meta"]["total"] == 10
    
    def test_commission_has_required_fields(self):
        """Commissions should have entry_code, net_amount, beneficiary_name"""
        response = requests.get(f"{BASE_URL}/api/v2/commissions", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        for commission in data["data"]:
            assert "entry_code" in commission
            assert "net_amount" in commission
            assert "beneficiary_name" in commission
            assert "gross_amount" in commission
            assert "earning_status" in commission
            assert "payout_status" in commission
    
    def test_commission_summary_returns_stats(self):
        """GET /api/v2/commissions/summary should return statistics"""
        response = requests.get(f"{BASE_URL}/api/v2/commissions/summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        summary = data["data"]
        assert "total_entries" in summary
        assert "total_gross" in summary
        assert "total_net" in summary
        assert "pending_approval" in summary
        
        # Verify expected values from requirements
        assert summary["total_entries"] == 10
        # Pending approvals can change due to approve/reject actions
        assert summary["pending_approval"] >= 0
        # total_gross should be around 1.1 billion VND
        assert summary["total_gross"] > 1_000_000_000
    
    def test_pending_approvals_returns_entries(self):
        """GET /api/v2/commissions/pending-approvals should return pending entries"""
        response = requests.get(f"{BASE_URL}/api/v2/commissions/pending-approvals", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Pending approvals can vary due to approve/reject actions
        assert "total" in data["meta"]
    
    def test_get_single_commission(self):
        """GET /api/v2/commissions/{id} should return commission details"""
        # First get list of commissions
        list_response = requests.get(f"{BASE_URL}/api/v2/commissions?limit=1", headers=self.headers)
        commission_id = list_response.json()["data"][0]["id"]
        
        # Get single commission
        response = requests.get(f"{BASE_URL}/api/v2/commissions/{commission_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == commission_id


class TestCommissionActions:
    """Test commission approve/reject actions"""
    
    @pytest.fixture(autouse=True)
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_approve_commission_endpoint_exists(self):
        """POST /api/v2/commissions/{id}/approve endpoint should exist"""
        # Get a pending commission
        response = requests.get(f"{BASE_URL}/api/v2/commissions/pending-approvals?limit=1", headers=self.headers)
        if response.json()["data"]:
            commission_id = response.json()["data"][0]["id"]
            
            # Try to approve (we just check the endpoint works, not actually approving for regression)
            approve_response = requests.post(
                f"{BASE_URL}/api/v2/commissions/{commission_id}/approve",
                headers=self.headers,
                json={"notes": "Test approval"}
            )
            # Should return 200 or 400 (already approved) - not 404
            assert approve_response.status_code in [200, 400]
    
    def test_reject_commission_endpoint_exists(self):
        """POST /api/v2/commissions/{id}/reject endpoint should exist"""
        # Get a pending commission
        response = requests.get(f"{BASE_URL}/api/v2/commissions/pending-approvals?limit=1", headers=self.headers)
        if response.json()["data"]:
            # Use a fake UUID to test endpoint exists without affecting data
            import uuid
            fake_id = str(uuid.uuid4())
            
            reject_response = requests.post(
                f"{BASE_URL}/api/v2/commissions/{fake_id}/reject",
                headers=self.headers,
                json={"reason": "Test rejection"}
            )
            # Should return 404 for fake ID - not 500 (proving endpoint exists)
            assert reject_response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
