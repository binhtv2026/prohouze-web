"""
Auto Action API Tests
Prompt 17/20 - Executive Control Center - AUTO CONTROL LAYER

Tests for:
- GET /api/control/auto/rules - List auto action rules
- POST /api/control/auto/init-defaults - Initialize default rules
- POST /api/control/auto/rules/{id}/toggle - Toggle rule ON/OFF
- POST /api/control/auto/run - Run auto actions manually
- GET /api/control/auto/stats - Get auto action statistics
- POST /api/control/auto/undo - Undo auto action
- GET /api/control/auto/actions - Get recent auto actions
"""

import pytest
import requests
import os
from dotenv import load_dotenv, dotenv_values

# Load environment
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    frontend_env = dotenv_values("/app/frontend/.env")
    BASE_URL = frontend_env.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Function to get fresh token
def get_auth_token():
    """Get fresh auth token."""
    import requests
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@prohouzing.vn", "password": "Admin123"}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get('access_token') or data.get('token')
    return None


@pytest.fixture
def api_client():
    """Shared requests session with auth headers."""
    token = get_auth_token()
    if not token:
        pytest.skip("Failed to get auth token")
    
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    })
    return session


@pytest.fixture
def unauthenticated_client():
    """Session without auth headers."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAutoRulesAPI:
    """Auto Action Rules endpoint tests - GET /api/control/auto/rules"""
    
    def test_get_auto_rules_success(self, api_client):
        """Test GET auto rules returns 200 with rules list."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/rules")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        rules_data = data["data"]
        assert "rules" in rules_data
        assert "total" in rules_data
        assert "active_count" in rules_data
        assert isinstance(rules_data["rules"], list)
    
    def test_get_auto_rules_structure(self, api_client):
        """Test auto rules have correct structure."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/rules")
        assert response.status_code == 200
        
        data = response.json()
        rules = data["data"]["rules"]
        
        if len(rules) > 0:
            rule = rules[0]
            # Verify rule structure
            assert "id" in rule
            assert "name" in rule
            assert "description" in rule
            assert "condition_type" in rule
            assert "condition_json" in rule
            assert "action_type" in rule
            assert "action_params" in rule
            assert "is_active" in rule
            assert "execution_count" in rule
            assert "priority_threshold" in rule
    
    def test_get_auto_rules_active_only(self, api_client):
        """Test GET auto rules with active_only filter."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/rules?active_only=true")
        assert response.status_code == 200
        
        data = response.json()
        rules = data["data"]["rules"]
        
        # All returned rules should be active
        for rule in rules:
            assert rule.get("is_active") is True
    
    def test_auto_rules_unauthorized(self, unauthenticated_client):
        """Test auto rules requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/auto/rules")
        assert response.status_code in [401, 403]


class TestAutoRuleToggleAPI:
    """Auto Rule Toggle endpoint tests - POST /api/control/auto/rules/{id}/toggle"""
    
    def test_toggle_rule_off_success(self, api_client):
        """Test toggling a rule OFF."""
        # First get a rule ID
        rules_response = api_client.get(f"{BASE_URL}/api/control/auto/rules")
        assert rules_response.status_code == 200
        rules = rules_response.json()["data"]["rules"]
        
        if len(rules) == 0:
            pytest.skip("No rules available to test toggle")
        
        rule_id = rules[0]["id"]
        
        # Toggle OFF
        response = api_client.post(
            f"{BASE_URL}/api/control/auto/rules/{rule_id}/toggle",
            json={"is_active": False}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Rule deactivated"
    
    def test_toggle_rule_on_success(self, api_client):
        """Test toggling a rule ON."""
        # First get a rule ID
        rules_response = api_client.get(f"{BASE_URL}/api/control/auto/rules")
        assert rules_response.status_code == 200
        rules = rules_response.json()["data"]["rules"]
        
        if len(rules) == 0:
            pytest.skip("No rules available to test toggle")
        
        rule_id = rules[0]["id"]
        
        # Toggle ON
        response = api_client.post(
            f"{BASE_URL}/api/control/auto/rules/{rule_id}/toggle",
            json={"is_active": True}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Rule activated"
    
    def test_toggle_nonexistent_rule(self, api_client):
        """Test toggle for non-existent rule."""
        response = api_client.post(
            f"{BASE_URL}/api/control/auto/rules/nonexistent-id-12345/toggle",
            json={"is_active": True}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should fail gracefully
        assert data["success"] is False or data["data"]["success"] is False


class TestAutoRunAPI:
    """Auto Run endpoint tests - POST /api/control/auto/run"""
    
    def test_run_auto_actions_success(self, api_client):
        """Test running auto actions manually."""
        response = api_client.post(f"{BASE_URL}/api/control/auto/run")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        run_data = data["data"]
        assert "checked_at" in run_data
        assert "rules_checked" in run_data
        assert "actions_executed" in run_data
        assert "actions_skipped" in run_data
        assert "errors" in run_data
        assert isinstance(run_data["errors"], list)
    
    def test_run_auto_actions_unauthorized(self, unauthenticated_client):
        """Test run requires authentication."""
        response = unauthenticated_client.post(f"{BASE_URL}/api/control/auto/run")
        assert response.status_code in [401, 403]


class TestAutoStatsAPI:
    """Auto Stats endpoint tests - GET /api/control/auto/stats"""
    
    def test_get_auto_stats_success(self, api_client):
        """Test GET auto stats returns 200 with statistics."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        stats_data = data["data"]
        assert "today" in stats_data
        assert "week" in stats_data
        assert "rules" in stats_data
        assert "daily_limit" in stats_data
        assert "undo_window_minutes" in stats_data
        
        # Verify today stats
        assert "executed" in stats_data["today"]
        assert "remaining" in stats_data["today"]
        
        # Verify rules stats
        assert "active" in stats_data["rules"]
        assert "total" in stats_data["rules"]
    
    def test_auto_stats_values(self, api_client):
        """Test auto stats have valid values."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/stats")
        assert response.status_code == 200
        
        data = response.json()["data"]
        
        # Daily limit should be 100
        assert data["daily_limit"] == 100
        
        # Undo window should be 30 minutes
        assert data["undo_window_minutes"] == 30
        
        # Remaining should be <= daily_limit
        assert data["today"]["remaining"] <= data["daily_limit"]
        
        # Active rules should be <= total rules
        assert data["rules"]["active"] <= data["rules"]["total"]
    
    def test_auto_stats_unauthorized(self, unauthenticated_client):
        """Test stats requires authentication."""
        response = unauthenticated_client.get(f"{BASE_URL}/api/control/auto/stats")
        assert response.status_code in [401, 403]


class TestAutoActionsLogAPI:
    """Auto Actions Log endpoint tests - GET /api/control/auto/actions"""
    
    def test_get_recent_auto_actions_success(self, api_client):
        """Test GET recent auto actions returns 200."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/actions?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        actions_data = data["data"]
        assert "actions" in actions_data
        assert "count" in actions_data
        assert isinstance(actions_data["actions"], list)
    
    def test_get_auto_actions_structure(self, api_client):
        """Test auto actions have correct structure."""
        response = api_client.get(f"{BASE_URL}/api/control/auto/actions?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        actions = data["data"]["actions"]
        
        if len(actions) > 0:
            action = actions[0]
            # Verify action structure
            assert "id" in action
            assert "rule_id" in action
            assert "rule_name" in action
            assert "action_type" in action
            assert "entity_type" in action
            assert "entity_id" in action
            assert "result" in action
            assert "executed_at" in action
            assert "can_undo_until" in action
            assert "is_undone" in action


class TestAutoUndoAPI:
    """Auto Undo endpoint tests - POST /api/control/auto/undo"""
    
    def test_undo_already_undone_action(self, api_client):
        """Test undoing an already undone action fails."""
        # Get recent actions
        actions_response = api_client.get(f"{BASE_URL}/api/control/auto/actions?limit=10")
        assert actions_response.status_code == 200
        
        actions = actions_response.json()["data"]["actions"]
        undone_actions = [a for a in actions if a.get("is_undone")]
        
        if len(undone_actions) == 0:
            pytest.skip("No undone actions available to test")
        
        action_id = undone_actions[0]["id"]
        
        # Try to undo again
        response = api_client.post(
            f"{BASE_URL}/api/control/auto/undo",
            json={"action_id": action_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is False or data["data"]["success"] is False
        assert "already undone" in str(data).lower()
    
    def test_undo_nonexistent_action(self, api_client):
        """Test undoing non-existent action fails."""
        response = api_client.post(
            f"{BASE_URL}/api/control/auto/undo",
            json={"action_id": "nonexistent-action-12345"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is False or data["data"]["success"] is False
    
    def test_undo_unauthorized(self, unauthenticated_client):
        """Test undo requires authentication."""
        response = unauthenticated_client.post(
            f"{BASE_URL}/api/control/auto/undo",
            json={"action_id": "test-id"}
        )
        assert response.status_code in [401, 403]


class TestAutoInitDefaultsAPI:
    """Auto Init Defaults endpoint tests - POST /api/control/auto/init-defaults"""
    
    def test_init_defaults_success(self, api_client):
        """Test initializing default rules."""
        response = api_client.post(f"{BASE_URL}/api/control/auto/init-defaults")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        init_data = data["data"]
        assert "created" in init_data
        assert "total" in init_data
        
        # Created should be 0 if rules already exist
        assert isinstance(init_data["created"], int)
        assert init_data["total"] == 4  # 4 default rules
    
    def test_init_defaults_unauthorized(self, unauthenticated_client):
        """Test init defaults requires authentication."""
        response = unauthenticated_client.post(f"{BASE_URL}/api/control/auto/init-defaults")
        assert response.status_code in [401, 403]


class TestControlFeedAutoEntries:
    """Control Feed tests for AUTO entries - GET /api/control/feed"""
    
    def test_feed_contains_auto_entries(self, api_client):
        """Test control feed contains auto-executed entries."""
        response = api_client.get(f"{BASE_URL}/api/control/feed?limit=50")
        assert response.status_code == 200
        
        data = response.json()
        feed_items = data["data"]["items"]
        
        # Check for auto entries
        auto_items = [f for f in feed_items if f.get("is_auto") or f.get("category") == "auto_executed"]
        
        # We expect some auto entries based on previous test execution
        # This test verifies the AUTO badge feature
        if len(auto_items) > 0:
            auto_item = auto_items[0]
            assert auto_item.get("is_auto") is True or auto_item.get("category") == "auto_executed"
            
            # Should have metadata with rule info
            if auto_item.get("metadata"):
                metadata = auto_item["metadata"]
                # Auto entries should have rule_id or action_id
                assert "rule_id" in metadata or "action_id" in metadata or "rule_name" in metadata
    
    def test_feed_auto_vs_manual_distinction(self, api_client):
        """Test feed items distinguish between AUTO and MANUAL actions."""
        response = api_client.get(f"{BASE_URL}/api/control/feed?limit=50")
        assert response.status_code == 200
        
        data = response.json()
        feed_items = data["data"]["items"]
        
        for item in feed_items:
            # Each item should have a way to determine if it's auto or manual
            # Either is_auto field or category field
            has_auto_indicator = (
                "is_auto" in item or 
                "category" in item or 
                (item.get("metadata") and "rule_id" in item.get("metadata", {}))
            )
            # Most items should have some indicator
            if item.get("type") == "action":
                assert has_auto_indicator or item.get("actor") is not None
