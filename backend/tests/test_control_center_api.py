"""
Control Center API Tests
Prompt 17/20 - Executive Control Center & Operations Command Center

Tests for:
- Health Score API
- Alerts API
- Bottlenecks API
- Suggestions API
- Today Focus Panel API
- Control Feed API
- Executive Overview API
- Actions API
"""

import pytest
import requests
import os
from dotenv import load_dotenv

# Load environment
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    from dotenv import dotenv_values
    frontend_env = dotenv_values("/app/frontend/.env")
    BASE_URL = frontend_env.get('REACT_APP_BACKEND_URL', '').rstrip('/')


# JWT token for admin user
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmU3YjIwMC04MzYyLTQwNTItOTAwNC00NWFmMjE1YWVkZWIiLCJlbWFpbCI6ImFkbWluQHByb2hvdXppbmcudm4iLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NzM4MzgzNzh9.Iv2uxZWxs33yECq6tqyJFvM2r2dSM2QLaj0QhAbhHk0"


@pytest.fixture
def api_client():
    """Shared requests session with auth headers."""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AUTH_TOKEN}"
    })
    return session


@pytest.fixture
def unauthenticated_client():
    """Session without auth headers."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthScoreAPI:
    """Health Score endpoint tests - GET /api/control/health-score"""
    
    def test_get_health_score_success(self, api_client):
        """Test health score returns 200 with score and components."""
        response = api_client.get(f"{BASE_URL}/api/control/health-score")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        health_data = data["data"]
        assert "total_score" in health_data
        assert "grade" in health_data
        assert "components" in health_data
        assert isinstance(health_data["total_score"], (int, float))
        assert health_data["total_score"] >= 0 and health_data["total_score"] <= 100
        
        # Verify components exist
        components = health_data["components"]
        expected_components = ["pipeline_quality", "conversion_rate", "inventory_turnover", 
                              "marketing_efficiency", "data_quality", "operational_discipline"]
        for comp in expected_components:
            assert comp in components, f"Missing component: {comp}"
            assert "score" in components[comp]
            assert "weight" in components[comp]
    
    def test_health_score_unauthorized(self, unauthenticated_client):
        """Test health score requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/health-score")
        assert response.status_code in [401, 403]


class TestAlertsAPI:
    """Alerts endpoint tests - GET /api/control/alerts"""
    
    def test_get_alerts_success(self, api_client):
        """Test alerts returns 200 with alerts list."""
        response = api_client.get(f"{BASE_URL}/api/control/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        alerts_data = data["data"]
        assert "alerts" in alerts_data
        assert "summary" in alerts_data
        assert isinstance(alerts_data["alerts"], list)
        
        # Verify summary structure
        summary = alerts_data["summary"]
        assert "total" in summary
        assert "by_category" in summary
        assert "by_severity" in summary
    
    def test_get_alerts_with_category_filter(self, api_client):
        """Test alerts with category filter."""
        response = api_client.get(f"{BASE_URL}/api/control/alerts?category=sales")
        assert response.status_code == 200
        
        data = response.json()
        alerts = data["data"]["alerts"]
        # All returned alerts should be in sales category
        for alert in alerts:
            assert alert.get("category") == "sales"
    
    def test_get_alerts_with_severity_filter(self, api_client):
        """Test alerts with severity filter."""
        response = api_client.get(f"{BASE_URL}/api/control/alerts?severity=high")
        assert response.status_code == 200
        
        data = response.json()
        alerts = data["data"]["alerts"]
        # All returned alerts should be high severity
        for alert in alerts:
            assert alert.get("severity") == "high"
    
    def test_get_alerts_summary(self, api_client):
        """Test alerts summary endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/alerts/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        summary = data["data"]
        assert "total" in summary
        assert "by_category" in summary
        assert "by_severity" in summary
    
    def test_alerts_unauthorized(self, unauthenticated_client):
        """Test alerts requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/alerts")
        assert response.status_code in [401, 403]


class TestBottlenecksAPI:
    """Bottlenecks endpoint tests - GET /api/control/bottlenecks"""
    
    def test_get_bottlenecks_success(self, api_client):
        """Test bottlenecks returns 200 with categorized data."""
        response = api_client.get(f"{BASE_URL}/api/control/bottlenecks")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        bottleneck_data = data["data"]
        assert "bottlenecks" in bottleneck_data
        assert "summary" in bottleneck_data
        
        # Verify bottleneck categories
        bottlenecks = bottleneck_data["bottlenecks"]
        expected_types = ["sales", "contracts", "leads", "inventory", "tasks"]
        for btype in expected_types:
            assert btype in bottlenecks, f"Missing bottleneck type: {btype}"
            assert "count" in bottlenecks[btype]
            assert "severity" in bottlenecks[btype]
    
    def test_get_bottleneck_details_sales(self, api_client):
        """Test bottleneck details for sales type."""
        response = api_client.get(f"{BASE_URL}/api/control/bottlenecks/sales")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
    
    def test_get_bottleneck_details_contracts(self, api_client):
        """Test bottleneck details for contracts type."""
        response = api_client.get(f"{BASE_URL}/api/control/bottlenecks/contracts")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_bottlenecks_unauthorized(self, unauthenticated_client):
        """Test bottlenecks requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/bottlenecks")
        assert response.status_code in [401, 403]


class TestSuggestionsAPI:
    """Suggestions endpoint tests - GET /api/control/suggestions"""
    
    def test_get_suggestions_success(self, api_client):
        """Test suggestions returns 200 with prioritized suggestions."""
        response = api_client.get(f"{BASE_URL}/api/control/suggestions")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        suggestions_data = data["data"]
        assert "suggestions" in suggestions_data
        assert isinstance(suggestions_data["suggestions"], list)
        
        # Verify suggestion structure
        if len(suggestions_data["suggestions"]) > 0:
            suggestion = suggestions_data["suggestions"][0]
            assert "id" in suggestion
            assert "category" in suggestion
            assert "priority_score" in suggestion
            assert "title" in suggestion
            assert "recommended_action" in suggestion
    
    def test_get_suggestions_summary(self, api_client):
        """Test suggestions summary endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/suggestions/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_suggestions_unauthorized(self, unauthenticated_client):
        """Test suggestions requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/suggestions")
        assert response.status_code in [401, 403]


class TestFocusPanelAPI:
    """Today Focus Panel tests - GET /api/control/focus"""
    
    def test_get_today_focus_success(self, api_client):
        """Test today focus returns prioritized items."""
        response = api_client.get(f"{BASE_URL}/api/control/focus")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        focus_data = data["data"]
        assert "focus_items" in focus_data
        assert "summary" in focus_data
        assert isinstance(focus_data["focus_items"], list)
        
        # Verify summary
        summary = focus_data["summary"]
        assert "alerts_count" in summary
        assert "tasks_count" in summary
    
    def test_get_priority_matrix(self, api_client):
        """Test priority matrix endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/priority-matrix")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        matrix_data = data["data"]
        assert "matrix" in matrix_data
        assert "counts" in matrix_data
    
    def test_get_user_focus(self, api_client):
        """Test user focus endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/focus/user")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_focus_unauthorized(self, unauthenticated_client):
        """Test focus requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/focus")
        assert response.status_code in [401, 403]


class TestControlFeedAPI:
    """Control Feed tests - GET /api/control/feed"""
    
    def test_get_control_feed_success(self, api_client):
        """Test control feed returns activity items."""
        response = api_client.get(f"{BASE_URL}/api/control/feed")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        feed_data = data["data"]
        assert "items" in feed_data
        assert "count" in feed_data
        assert isinstance(feed_data["items"], list)
    
    def test_get_control_feed_with_limit(self, api_client):
        """Test control feed respects limit parameter."""
        response = api_client.get(f"{BASE_URL}/api/control/feed?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        feed_data = data["data"]
        # Should not exceed the limit
        assert len(feed_data["items"]) <= 10
    
    def test_feed_unauthorized(self, unauthenticated_client):
        """Test feed requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/feed")
        assert response.status_code in [401, 403]


class TestExecutiveOverviewAPI:
    """Executive Overview tests - GET /api/control/executive-overview"""
    
    def test_get_executive_overview_success(self, api_client):
        """Test executive overview returns comprehensive data."""
        response = api_client.get(f"{BASE_URL}/api/control/executive-overview")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        overview = data["data"]
        # Should contain health score
        assert "health_score" in overview
        # Should contain alerts
        assert "alerts" in overview
        # Should contain bottlenecks
        assert "bottlenecks" in overview
        # Should contain quick metrics
        assert "quick_metrics" in overview
    
    def test_executive_overview_unauthorized(self, unauthenticated_client):
        """Test executive overview requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/executive-overview")
        assert response.status_code in [401, 403]


class TestActionsAPI:
    """Actions execution tests - POST /api/control/actions/{action_type}"""
    
    def test_action_create_task(self, api_client):
        """Test create_task action."""
        response = api_client.post(
            f"{BASE_URL}/api/control/actions/create_task",
            json={
                "source_entity": "leads",
                "source_id": "test-lead-id",
                "params": {
                    "title": "TEST_Follow up with lead",
                    "description": "Test task from control center",
                    "due_hours": 24
                }
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "action_id" in data["data"]
        assert data["data"]["action_type"] == "create_task"
    
    def test_action_send_reminder(self, api_client):
        """Test send_reminder action."""
        response = api_client.post(
            f"{BASE_URL}/api/control/actions/send_reminder",
            json={
                "source_entity": "deals",
                "source_id": "test-deal-id",
                "params": {
                    "message": "TEST_Please update the deal status"
                }
            }
        )
        # May fail if entity not found, but should not be 500
        assert response.status_code in [200, 400, 404]
    
    def test_action_invalid_type(self, api_client):
        """Test invalid action type returns error."""
        response = api_client.post(
            f"{BASE_URL}/api/control/actions/invalid_action_type",
            json={
                "source_entity": "leads",
                "source_id": "test-id",
                "params": {}
            }
        )
        # Should return error for invalid action type
        assert response.status_code == 200  # Returns 200 but success=False
        data = response.json()
        assert data["success"] is False or "error" in str(data)
    
    def test_action_unauthorized(self, unauthenticated_client):
        """Test actions require authentication."""
        response = unauthenticated_client.post(
            f"{BASE_URL}/api/control/actions/create_task",
            json={
                "source_entity": "leads",
                "source_id": "test-id",
                "params": {}
            }
        )
        assert response.status_code in [401, 403]


class TestOperationsAPI:
    """Operations Command Center tests"""
    
    def test_get_operations_overview(self, api_client):
        """Test operations overview endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/operations/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        ops_data = data["data"]
        assert "bottlenecks" in ops_data
        assert "alert_summary" in ops_data
    
    def test_get_pipeline_overview(self, api_client):
        """Test pipeline overview endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/operations/pipeline")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_get_team_heatmap(self, api_client):
        """Test team heatmap endpoint."""
        response = api_client.get(f"{BASE_URL}/api/control/operations/team-heatmap")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        heatmap_data = data["data"]
        assert "heatmap" in heatmap_data
        assert "metrics" in heatmap_data
    
    def test_operations_unauthorized(self, unauthenticated_client):
        """Test operations requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/operations/overview")
        assert response.status_code in [401, 403]


class TestUnifiedOverviewAPI:
    """Unified Overview endpoint tests - GET /api/control/overview"""
    
    def test_get_unified_overview(self, api_client):
        """Test unified overview returns all data in single call."""
        response = api_client.get(f"{BASE_URL}/api/control/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        overview = data["data"]
        # Should contain all main sections
        assert "health_score" in overview
        assert "alerts" in overview
        assert "bottlenecks" in overview
        assert "suggestions" in overview


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
