"""
AI Insight Phase 3 API Tests
Prompt 18/20 - Phase 3: AI Insight Panel Integration into Lead/Deal Detail Views

Tests for:
1. GET /api/ai-insight/lead/{id}/full - Full lead insight with money impact
2. GET /api/ai-insight/deal/{id}/full - Full deal insight with money impact
3. POST /api/ai-insight/execute - Execute AI-recommended actions
4. Verify all AI insight data has required fields for display
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSetup:
    """Setup fixtures and auth"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        }
    
    @pytest.fixture(scope="class")
    def test_lead_id(self, auth_headers):
        """Get or create a test lead"""
        # First try to get existing leads
        response = requests.get(f"{BASE_URL}/api/crm/leads?limit=5", headers=auth_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0].get("id")
        pytest.skip("No leads available for testing")
    
    @pytest.fixture(scope="class")
    def test_deal_id(self, auth_headers):
        """Get or create a test deal"""
        # First try to get existing deals
        response = requests.get(f"{BASE_URL}/api/sales/deals?limit=5", headers=auth_headers)
        if response.status_code == 200 and response.json():
            return response.json()[0].get("id")
        pytest.skip("No deals available for testing")


class TestLeadInsightFull(TestSetup):
    """Test GET /api/ai-insight/lead/{id}/full - Lead Insight with Money Impact"""
    
    def test_get_lead_insight_full_success(self, auth_headers, test_lead_id):
        """Test fetching full lead insight with all required Phase 3 fields"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify entity info
        assert data.get("entity_type") == "lead"
        assert data.get("entity_id") == test_lead_id
        
        # Verify lead_score section exists and has required fields
        lead_score = data.get("lead_score")
        assert lead_score is not None, "lead_score must be present"
        assert "score" in lead_score, "score must be in lead_score"
        assert "level" in lead_score, "level (Hot/Warm/Cold) must be in lead_score"
        assert "confidence" in lead_score, "confidence must be in lead_score"
        print(f"Lead Score: {lead_score.get('score')} ({lead_score.get('level')})")
    
    def test_lead_insight_has_money_impact(self, auth_headers, test_lead_id):
        """Test that lead insight has money_impact section (required by Phase 3)"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify money_impact section - CRITICAL for Phase 3
        money = data.get("money_impact")
        assert money is not None, "money_impact section is required for AI display"
        
        # Verify money columns (3 columns in UI)
        assert "expected_value" in money, "expected_value must be present"
        assert "risk_loss" in money, "risk_loss must be present"
        assert "opportunity_gain" in money, "opportunity_gain must be present"
        
        # Verify deadline
        assert "deadline" in money, "deadline must be present for action timing"
        
        # Verify urgency
        assert "urgency" in money, "urgency level must be present"
        
        print(f"Money Impact: expected={money.get('expected_value')}, risk={money.get('risk_loss')}, opportunity={money.get('opportunity_gain')}")
    
    def test_lead_insight_has_actions(self, auth_headers, test_lead_id):
        """Test that lead insight has executable actions"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify actions array exists
        actions = data.get("actions")
        assert actions is not None, "actions array must be present"
        assert len(actions) > 0, "At least one action must be available"
        
        # Verify action structure
        first_action = actions[0]
        assert "action_type" in first_action, "action_type required"
        assert "label" in first_action, "label required for button display"
        
        print(f"Actions available: {[a.get('label') for a in actions]}")
    
    def test_lead_insight_has_explanation(self, auth_headers, test_lead_id):
        """Test that lead insight has explanation for 'Why' section"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify explanation exists
        explanation = data.get("explanation")
        assert explanation is not None, "explanation must be present for 'Why' section"
        assert "summary" in explanation, "summary required in explanation"
        
        print(f"Explanation summary: {explanation.get('summary')[:100]}...")


class TestDealInsightFull(TestSetup):
    """Test GET /api/ai-insight/deal/{id}/full - Deal Insight with Money Impact"""
    
    def test_get_deal_insight_full_success(self, auth_headers, test_deal_id):
        """Test fetching full deal insight with all required Phase 3 fields"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/deal/{test_deal_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify entity info
        assert data.get("entity_type") == "deal"
        assert data.get("entity_id") == test_deal_id
        
        # Verify deal_risk section exists
        deal_risk = data.get("deal_risk")
        assert deal_risk is not None, "deal_risk must be present"
        assert "risk_score" in deal_risk, "risk_score required"
        assert "risk_level" in deal_risk, "risk_level required"
        
        print(f"Deal Risk: {deal_risk.get('risk_score')} ({deal_risk.get('risk_level')})")
    
    def test_deal_insight_has_money_impact(self, auth_headers, test_deal_id):
        """Test that deal insight has money_impact section"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/deal/{test_deal_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify money_impact section
        money = data.get("money_impact")
        assert money is not None, "money_impact section is required"
        
        # Deal-specific money fields (3 columns in UI)
        assert "deal_value" in money or "expected_value" in money, "deal_value/expected_value required"
        assert "risk_loss" in money, "risk_loss required"
        assert "close_probability" in money, "close_probability required"
        
        # Verify deadline
        assert "deadline" in money, "deadline required"
        
        print(f"Deal Money: value={money.get('deal_value', money.get('expected_value'))}, risk_loss={money.get('risk_loss')}, probability={money.get('close_probability')}")
    
    def test_deal_insight_has_actions(self, auth_headers, test_deal_id):
        """Test that deal insight has executable actions"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/deal/{test_deal_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        actions = data.get("actions")
        assert actions is not None, "actions array must be present"
        assert len(actions) > 0, "At least one action must be available"
        
        print(f"Deal Actions: {[a.get('label') for a in actions]}")


class TestActionExecution(TestSetup):
    """Test POST /api/ai-insight/execute - Execute AI actions"""
    
    def test_execute_create_task_action(self, auth_headers, test_lead_id):
        """Test executing 'create_task' action creates real task in DB"""
        unique_suffix = str(uuid.uuid4())[:8]
        
        response = requests.post(
            f"{BASE_URL}/api/ai-insight/execute",
            headers=auth_headers,
            json={
                "action_type": "create_task",
                "entity_type": "lead",
                "entity_id": test_lead_id,
                "params": {
                    "title": f"TEST_Phase3_Task_{unique_suffix}",
                    "reason": "AI testing Phase 3 integration"
                }
            }
        )
        
        assert response.status_code == 200, f"Execute failed: {response.text}"
        data = response.json()
        
        # Verify execution success
        assert data.get("success") == True, "Action execution should succeed"
        
        # Verify result contains created record info
        result = data.get("result", {})
        assert result.get("message") is not None, "Success message required"
        
        print(f"Execute result: {result}")
    
    def test_execute_call_action(self, auth_headers, test_lead_id):
        """Test executing 'call' action creates real activity in DB"""
        response = requests.post(
            f"{BASE_URL}/api/ai-insight/execute",
            headers=auth_headers,
            json={
                "action_type": "call",
                "entity_type": "lead",
                "entity_id": test_lead_id,
                "params": {
                    "reason": "AI Phase 3 call action test"
                }
            }
        )
        
        assert response.status_code == 200, f"Execute failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Call action should succeed"
        
        print(f"Call action result: {data.get('result', {}).get('message')}")
    
    def test_execute_invalid_action_returns_error(self, auth_headers, test_lead_id):
        """Test that invalid action type returns proper error"""
        response = requests.post(
            f"{BASE_URL}/api/ai-insight/execute",
            headers=auth_headers,
            json={
                "action_type": "invalid_action_type_xyz",
                "entity_type": "lead",
                "entity_id": test_lead_id,
                "params": {}
            }
        )
        
        # Should return error (either 400 or 500 with error in body)
        if response.status_code == 200:
            data = response.json()
            # If 200, should have success=false
            assert data.get("success") == False, "Invalid action should not succeed"
        else:
            assert response.status_code in [400, 500], "Should return error status"


class TestPhase3UIRequirements(TestSetup):
    """Test that API response meets Phase 3 UI display requirements"""
    
    def test_lead_insight_ui_requirements(self, auth_headers, test_lead_id):
        """Verify lead insight has all fields required for UI panel display"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # UI Requirement 1: Score badge display
        lead_score = data.get("lead_score", {})
        assert lead_score.get("score") is not None, "Score value for badge"
        assert lead_score.get("level") is not None, "Level for Hot/Warm/Cold badge"
        
        # UI Requirement 2: Money Impact grid (3 columns)
        money = data.get("money_impact", {})
        assert money.get("expected_value") is not None, "Expected value column"
        assert money.get("risk_loss") is not None, "Risk loss column"
        assert money.get("opportunity_gain") is not None, "Opportunity gain column"
        
        # UI Requirement 3: Warning message with deadline
        assert money.get("message") is not None, "Warning message"
        assert money.get("deadline") is not None, "Deadline for urgency display"
        
        # UI Requirement 4: Explanation section
        explanation = data.get("explanation")
        assert explanation is not None, "Explanation for 'Why' section"
        
        # UI Requirement 5: Execute buttons
        actions = data.get("actions", [])
        assert len(actions) > 0, "At least one action for buttons"
        
        print("All Phase 3 UI requirements met for Lead Insight Panel")
    
    def test_deal_insight_ui_requirements(self, auth_headers, test_deal_id):
        """Verify deal insight has all fields required for UI panel display"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/deal/{test_deal_id}/full",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # UI Requirement 1: Risk badge display
        deal_risk = data.get("deal_risk", {})
        assert deal_risk.get("risk_score") is not None, "Risk score for badge"
        assert deal_risk.get("risk_level") is not None, "Risk level for badge color"
        
        # UI Requirement 2: Money Impact grid (3 columns)
        money = data.get("money_impact", {})
        assert money.get("deal_value") is not None or money.get("expected_value") is not None, "Deal value column"
        assert money.get("risk_loss") is not None, "Risk loss column"
        assert money.get("close_probability") is not None, "Close probability column"
        
        # UI Requirement 3: Warning message with deadline
        assert money.get("message") is not None, "Warning message"
        assert money.get("deadline") is not None, "Deadline display"
        
        # UI Requirement 4: Explanation section
        explanation = data.get("explanation")
        assert explanation is not None, "Explanation for risk analysis"
        
        # UI Requirement 5: Execute buttons
        actions = data.get("actions", [])
        assert len(actions) > 0, "At least one action button"
        
        print("All Phase 3 UI requirements met for Deal Insight Panel")


class TestHardRulesCompliance(TestSetup):
    """Verify Phase 3 Hard Rules compliance"""
    
    def test_no_insight_without_action(self, auth_headers, test_lead_id):
        """Hard Rule: No insight displayed without executable action"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            actions = data.get("actions", [])
            # If insight is returned, it must have actions
            if data.get("lead_score") or data.get("money_impact"):
                assert len(actions) > 0, "Insight must have actions"
                print("Hard Rule PASSED: Insight has actions")
    
    def test_no_action_without_deadline(self, auth_headers, test_lead_id):
        """Hard Rule: No action without deadline"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            money = data.get("money_impact", {})
            # Deadline must be present
            assert money.get("deadline") is not None, "Actions must have deadline"
            print(f"Hard Rule PASSED: Deadline present: {money.get('deadline')}")
    
    def test_no_ai_without_money_impact(self, auth_headers, test_lead_id):
        """Hard Rule: No AI without money impact"""
        response = requests.get(
            f"{BASE_URL}/api/ai-insight/lead/{test_lead_id}/full",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            data = response.json()
            money = data.get("money_impact")
            # Money impact must be present
            assert money is not None, "Money impact is required"
            assert money.get("expected_value") is not None, "Expected value required"
            assert money.get("risk_loss") is not None, "Risk loss required"
            print("Hard Rule PASSED: Money impact present with values")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
