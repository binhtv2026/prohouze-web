"""
TASK 4 - Sales Pipeline Kanban & Manager Dashboard API Tests

Tests for:
1. Pipeline APIs - /api/pipeline/config/stages, /api/pipeline/kanban
2. Manager APIs - /api/manager/inventory/summary, /api/manager/dashboard/summary, 
                   /api/manager/approvals, /api/manager/approvals/stats
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPipelineAPIs:
    """Tests for Sales Pipeline APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@prohouzing.vn", "password": "admin123"}
        )
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.token = token
        else:
            pytest.skip("Login failed - skipping tests")
    
    def test_get_pipeline_stages_config(self):
        """Test GET /api/pipeline/config/stages - returns 9 stages"""
        response = requests.get(f"{BASE_URL}/api/pipeline/config/stages")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "stages" in data, "Response missing 'stages' key"
        
        stages = data["stages"]
        assert len(stages) == 9, f"Expected 9 stages, got {len(stages)}"
        
        # Verify expected stage IDs
        stage_ids = [s["id"] for s in stages]
        expected_ids = ["lead_new", "contacted", "interested", "viewing", 
                       "holding", "booking", "negotiating", "closed_won", "closed_lost"]
        assert stage_ids == expected_ids, f"Stage IDs mismatch: {stage_ids}"
        
        # Verify stage structure
        first_stage = stages[0]
        required_fields = ["id", "name", "name_en", "color", "bg_color", "order", "valid_transitions"]
        for field in required_fields:
            assert field in first_stage, f"Stage missing field: {field}"
    
    def test_get_pipeline_kanban_requires_auth(self):
        """Test GET /api/pipeline/kanban - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pipeline/kanban")
        
        # Should return 401 without auth
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_get_pipeline_kanban_with_auth(self):
        """Test GET /api/pipeline/kanban with auth - returns kanban data"""
        response = self.session.get(f"{BASE_URL}/api/pipeline/kanban")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "stages" in data, "Response missing 'stages' key"
        assert "deals_by_stage" in data, "Response missing 'deals_by_stage' key"
        
        # Verify stages count
        assert len(data["stages"]) == 9, f"Expected 9 stages, got {len(data['stages'])}"
        
        # Verify deals_by_stage has all stages
        for stage in data["stages"]:
            stage_id = stage["id"]
            assert stage_id in data["deals_by_stage"], f"deals_by_stage missing {stage_id}"
    
    def test_get_pipeline_stats_with_auth(self):
        """Test GET /api/pipeline/stats - returns pipeline statistics"""
        response = self.session.get(f"{BASE_URL}/api/pipeline/stats")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        expected_fields = ["total_active", "total_value", "won_count", "lost_count", 
                          "won_value", "conversion_rate", "by_stage"]
        for field in expected_fields:
            assert field in data, f"Response missing '{field}'"


class TestManagerInventoryAPIs:
    """Tests for Manager Inventory APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for tests - no auth needed for these endpoints"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_inventory_summary(self):
        """Test GET /api/manager/inventory/summary - returns inventory summary"""
        response = self.session.get(f"{BASE_URL}/api/manager/inventory/summary")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        expected_fields = ["total_products", "total_value", "overdue_holds", "by_status"]
        for field in expected_fields:
            assert field in data, f"Response missing '{field}'"
        
        # Verify by_status has expected statuses
        by_status = data["by_status"]
        expected_statuses = ["available", "hold", "booking_pending", "booked", "reserved", "sold", "blocked"]
        for status in expected_statuses:
            assert status in by_status, f"by_status missing '{status}'"
            assert "count" in by_status[status], f"{status} missing 'count'"
            assert "value" in by_status[status], f"{status} missing 'value'"
    
    def test_get_active_holds(self):
        """Test GET /api/manager/inventory/holds - returns active holds"""
        response = self.session.get(f"{BASE_URL}/api/manager/inventory/holds")
        
        # Status code check  
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "items" in data, "Response missing 'items'"
        assert "total" in data, "Response missing 'total'"
        assert isinstance(data["items"], list), "'items' should be a list"
    
    def test_get_overdue_holds(self):
        """Test GET /api/manager/inventory/overdue - returns overdue holds"""
        response = self.session.get(f"{BASE_URL}/api/manager/inventory/overdue")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "items" in data, "Response missing 'items'"
        assert "total" in data, "Response missing 'total'"


class TestManagerDashboardAPIs:
    """Tests for Manager Dashboard APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_dashboard_summary(self):
        """Test GET /api/manager/dashboard/summary - returns dashboard metrics"""
        response = self.session.get(f"{BASE_URL}/api/manager/dashboard/summary")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        expected_fields = ["period", "total_deals", "total_value", "won_deals", 
                          "won_value", "lost_deals", "conversion_rate", 
                          "active_deals", "active_value", "deals_by_stage"]
        for field in expected_fields:
            assert field in data, f"Response missing '{field}'"
        
        # Verify deals_by_stage has all stages
        assert "deals_by_stage" in data
        assert len(data["deals_by_stage"]) == 9, f"Expected 9 stages in deals_by_stage"
    
    def test_get_sales_performance(self):
        """Test GET /api/manager/dashboard/performance - returns sales rankings"""
        response = self.session.get(f"{BASE_URL}/api/manager/dashboard/performance")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions - actual API returns these fields
        data = response.json()
        expected_fields = ["top_performers", "bottom_performers", "sales", "total_sales", "period"]
        for field in expected_fields:
            assert field in data, f"Response missing '{field}'"
        
        # Verify lists
        assert isinstance(data["top_performers"], list), "'top_performers' should be a list"
        assert isinstance(data["sales"], list), "'sales' should be a list"
    
    def test_get_pipeline_analysis(self):
        """Test GET /api/manager/dashboard/pipeline - returns pipeline analysis"""
        response = self.session.get(f"{BASE_URL}/api/manager/dashboard/pipeline")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions - actual API returns these fields
        data = response.json()
        expected_fields = ["pipeline", "total_unweighted_value", "total_weighted_value", "forecast_accuracy"]
        for field in expected_fields:
            assert field in data, f"Response missing '{field}'"
        
        # Verify pipeline is a list with stage data
        assert isinstance(data["pipeline"], list), "'pipeline' should be a list"


class TestManagerApprovalAPIs:
    """Tests for Manager Approval APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_pending_approvals(self):
        """Test GET /api/manager/approvals - returns pending approvals"""
        response = self.session.get(f"{BASE_URL}/api/manager/approvals")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "items" in data, "Response missing 'items'"
        assert "total" in data, "Response missing 'total'"
        assert "page" in data, "Response missing 'page'"
        assert "page_size" in data, "Response missing 'page_size'"
        assert isinstance(data["items"], list), "'items' should be a list"
    
    def test_get_approval_stats(self):
        """Test GET /api/manager/approvals/stats - returns approval statistics"""
        response = self.session.get(f"{BASE_URL}/api/manager/approvals/stats")
        
        # Status code check
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "pending" in data, "Response missing 'pending'"
        assert "approved" in data, "Response missing 'approved'"
        assert "rejected" in data, "Response missing 'rejected'"
        
        # Verify values are integers
        assert isinstance(data["pending"], int), "'pending' should be integer"
        assert isinstance(data["approved"], int), "'approved' should be integer"
        assert isinstance(data["rejected"], int), "'rejected' should be integer"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
