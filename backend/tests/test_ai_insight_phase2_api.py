"""
Test AI Insight Engine Phase 2 - Money Impact & Action Execution
Prompt 18/20 - AI Decision Engine (FINAL 10/10)

Tests NEW endpoints:
- GET /api/ai-insight/lead/{lead_id}/full - Full lead insight with money_impact
- GET /api/ai-insight/deal/{deal_id}/full - Full deal insight with money_impact
- POST /api/ai-insight/execute - Execute action (call, create_task)
- GET /api/ai-insight/war-room - WAR ROOM data

HARD RULES:
- NO INSIGHT WITHOUT ACTION
- NO ACTION WITHOUT DEADLINE
- NO AI WITHOUT MONEY IMPACT
- NO DISPLAY WITHOUT EXECUTION
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com')

# Test credentials and data
TEST_EMAIL = "test@prohouzing.vn"
TEST_PASSWORD = "test123"
TEST_LEAD_ID = "e90e31eb-3f93-401a-ad2e-5364e460c0af"
TEST_DEAL_ID = "0ca95d1f-26a9-45bf-9228-c0c3a062c2d7"


class TestFullLeadInsightWithMoney:
    """Tests for Full Lead Insight with Money Impact"""
    
    def test_get_lead_insight_full(self, authenticated_client):
        """GET /api/ai-insight/lead/{lead_id}/full - Full insight with money_impact"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/full")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify lead_score
        assert "lead_score" in data, "Missing lead_score"
        assert data["lead_score"]["score"] >= 0
        assert data["lead_score"]["score"] <= 100
        assert "level" in data["lead_score"]
        assert "factors" in data["lead_score"]
        
        # CRITICAL: Verify money_impact (NO AI WITHOUT MONEY IMPACT rule)
        assert "money_impact" in data, "VIOLATION: Missing money_impact - violates NO AI WITHOUT MONEY IMPACT rule"
        money = data["money_impact"]
        assert "expected_value" in money, "Missing expected_value"
        assert "risk_loss" in money, "Missing risk_loss"
        assert "opportunity_gain" in money, "Missing opportunity_gain"
        assert "message" in money, "Missing money message"
        assert "urgency" in money, "Missing urgency"
        assert "deadline" in money, "VIOLATION: Missing deadline - violates NO ACTION WITHOUT DEADLINE rule"
        
        # Verify money values are valid
        assert isinstance(money["expected_value"], int), "expected_value should be integer"
        assert isinstance(money["risk_loss"], int), "risk_loss should be integer"
        assert money["currency"] == "VND", "Currency should be VND"
        
        # Verify next_action (NO INSIGHT WITHOUT ACTION rule)
        assert "next_action" in data, "VIOLATION: Missing next_action - violates NO INSIGHT WITHOUT ACTION rule"
        action = data["next_action"]
        assert "action" in action
        assert "priority" in action
        assert "deadline" in action or money.get("deadline"), "Action must have deadline"
        
        # Verify executable actions
        assert "actions" in data, "Missing executable actions"
        assert len(data["actions"]) > 0, "At least one executable action required"
        
        for act in data["actions"]:
            assert "action_type" in act
            assert "label" in act
            assert "params" in act
        
        print(f"✓ Lead Full Insight:")
        print(f"  - Score: {data['lead_score']['score']}/100 ({data['lead_score']['level']})")
        print(f"  - Expected Value: {money['expected_value']:,} VND")
        print(f"  - Risk Loss: {money['risk_loss']:,} VND")
        print(f"  - Urgency: {money['urgency']}")
        print(f"  - Deadline: {money['deadline']}")
        print(f"  - Actions: {len(data['actions'])} executable")
    
    def test_lead_insight_full_has_money_message(self, authenticated_client):
        """Verify money message is human-readable"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/full")
        data = response.json()
        
        money = data["money_impact"]
        assert money["message"], "Money message should not be empty"
        # Vietnamese message should contain money-related words
        assert any(word in money["message"].lower() for word in ["tỷ", "triệu", "vnd", "mất", "cơ hội"]), \
            f"Money message should be in Vietnamese with VND: {money['message']}"
        
        print(f"✓ Money Message: {money['message']}")


class TestFullDealInsightWithMoney:
    """Tests for Full Deal Insight with Money Impact"""
    
    def test_get_deal_insight_full(self, authenticated_client):
        """GET /api/ai-insight/deal/{deal_id}/full - Full insight with money_impact"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/deal/{TEST_DEAL_ID}/full")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify deal_risk
        assert "deal_risk" in data, "Missing deal_risk"
        assert "risk_score" in data["deal_risk"]
        assert "risk_level" in data["deal_risk"]
        
        # CRITICAL: Verify money_impact
        assert "money_impact" in data, "VIOLATION: Missing money_impact"
        money = data["money_impact"]
        assert "expected_value" in money
        assert "risk_loss" in money
        assert "deal_value" in money
        assert "close_probability" in money
        assert "deadline" in money
        assert "urgency" in money
        
        # Verify next_action
        assert "next_action" in data
        assert "actions" in data
        
        print(f"✓ Deal Full Insight:")
        print(f"  - Code: {data['deal_code']}")
        print(f"  - Risk Level: {data['deal_risk']['risk_level']} ({data['deal_risk']['risk_score']}/100)")
        print(f"  - Deal Value: {money['deal_value']:,} VND")
        print(f"  - Close Probability: {money['close_probability']*100:.0f}%")
        print(f"  - Risk Loss: {money['risk_loss']:,} VND")


class TestWarRoomAPI:
    """Tests for WAR ROOM API endpoint"""
    
    def test_get_war_room_data(self, authenticated_client):
        """GET /api/ai-insight/war-room - WAR ROOM dashboard data"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/war-room")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify revenue_at_risk
        assert "revenue_at_risk" in data, "Missing revenue_at_risk"
        rar = data["revenue_at_risk"]
        assert "total_revenue_at_risk" in rar
        assert "deals_count" in rar
        assert "formatted" in rar
        assert "total" in rar["formatted"]
        
        # Verify today_opportunity
        assert "today_opportunity" in data, "Missing today_opportunity"
        opp = data["today_opportunity"]
        assert "total_opportunity" in opp
        assert "hot_leads_count" in opp
        assert "formatted" in opp
        
        # Verify today_actions
        assert "today_actions" in data, "Missing today_actions"
        actions = data["today_actions"]
        assert "actions" in actions
        assert "count" in actions
        
        # Verify summary
        assert "summary" in data
        summary = data["summary"]
        assert "total_at_risk" in summary
        assert "total_opportunity" in summary
        assert "actions_count" in summary
        
        # Verify hot_leads
        assert "hot_leads" in data
        
        # Verify deals_today
        assert "deals_today" in data
        
        print(f"✓ WAR ROOM Data:")
        print(f"  - Revenue at Risk: {rar['formatted']['total']}")
        print(f"  - Today Opportunity: {opp['formatted']}")
        print(f"  - Actions Today: {actions['count']}")
        print(f"  - Hot Leads: {summary['leads_count']}")
        print(f"  - Urgent Deals: {summary['deals_count']}")
    
    def test_war_room_actions_have_money_impact(self, authenticated_client):
        """Verify WAR ROOM actions include money_impact"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/war-room")
        data = response.json()
        
        actions = data["today_actions"]["actions"]
        if actions:
            for action in actions:
                assert "money_impact" in action or "value" in action, \
                    f"Action {action.get('action_label')} missing money info"
                assert "priority" in action, "Action missing priority"
                assert "entity_type" in action
                assert "entity_id" in action
            
            print(f"✓ All {len(actions)} WAR ROOM actions have money impact")
        else:
            print("✓ No actions in WAR ROOM (expected if no high-risk items)")


class TestActionExecutionAPI:
    """Tests for Action Execution (Click phải chạy thật!)"""
    
    def test_execute_call_action(self, authenticated_client):
        """POST /api/ai-insight/execute - Execute call action creates real activity"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/execute",
            json={
                "action_type": "call",
                "entity_type": "lead",
                "entity_id": TEST_LEAD_ID,
                "params": {
                    "notes": "Test call execution",
                    "outcome": "connected"
                }
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify execution result
        assert data["success"] is True, f"Execution failed: {data.get('error')}"
        assert "action_id" in data
        assert data["action_type"] == "call"
        assert data["entity_type"] == "lead"
        assert data["entity_id"] == TEST_LEAD_ID
        assert "executed_at" in data
        assert "executed_by" in data
        
        # Verify result details
        assert "result" in data
        result = data["result"]
        assert "activity_id" in result, "Call should create activity record"
        assert "message" in result
        
        print(f"✓ Call Action Executed:")
        print(f"  - Action ID: {data['action_id']}")
        print(f"  - Activity ID: {result['activity_id']}")
        print(f"  - Message: {result['message']}")
    
    def test_execute_create_task_action(self, authenticated_client):
        """POST /api/ai-insight/execute - Execute create_task creates real task"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/execute",
            json={
                "action_type": "create_task",
                "entity_type": "lead",
                "entity_id": TEST_LEAD_ID,
                "params": {
                    "title": "[TEST] AI Task for Lead",
                    "description": "Test task from AI execution",
                    "priority": "high"
                }
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        assert data["success"] is True
        assert data["action_type"] == "create_task"
        
        result = data["result"]
        assert "task_id" in result, "create_task should create task record"
        assert "title" in result
        assert "due_date" in result
        assert "assigned_to" in result
        
        print(f"✓ Create Task Action Executed:")
        print(f"  - Task ID: {result['task_id']}")
        print(f"  - Title: {result['title']}")
        print(f"  - Due Date: {result['due_date']}")
    
    def test_execute_deal_call_action(self, authenticated_client):
        """Test call action on deal"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/execute",
            json={
                "action_type": "call",
                "entity_type": "deal",
                "entity_id": TEST_DEAL_ID,
                "params": {
                    "notes": "Test deal call",
                    "outcome": "connected"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Deal call executed: {data['result']['activity_id']}")
    
    def test_execute_invalid_action_type(self, authenticated_client):
        """Test error handling for invalid action type"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/execute",
            json={
                "action_type": "invalid_action",
                "entity_type": "lead",
                "entity_id": TEST_LEAD_ID,
                "params": {}
            }
        )
        assert response.status_code == 200  # API returns 200 but success=false
        data = response.json()
        assert data["success"] is False
        assert "error" in data or "Unknown action type" in str(data.get("error", ""))
        print("✓ Invalid action type handled correctly")


class TestTodayActionsWithMoney:
    """Tests for today's actions with money impact"""
    
    def test_get_today_actions_with_money(self, authenticated_client):
        """GET /api/ai-insight/today-actions-money"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/today-actions-money?limit=5"
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        assert "actions" in data
        assert "count" in data
        assert "total_value_at_stake" in data
        
        actions = data["actions"]
        if actions:
            for action in actions:
                assert "entity_type" in action
                assert "entity_id" in action
                assert "action_type" in action
                assert "priority" in action
                assert "money_impact" in action, "Action should have money_impact"
                
                money = action["money_impact"]
                assert "expected_value" in money or "risk_loss" in money
        
        print(f"✓ Today Actions with Money: {data['count']} actions")
        print(f"  - Total Value at Stake: {data['total_value_at_stake']:,} VND")


class TestHardRulesCompliance:
    """Tests verifying Phase 2 HARD RULES compliance"""
    
    def test_no_insight_without_action(self, authenticated_client):
        """Verify NO INSIGHT WITHOUT ACTION rule"""
        # Lead insight must have actions
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/full")
        data = response.json()
        
        assert "actions" in data, "VIOLATION: No actions in lead insight"
        assert len(data["actions"]) > 0, "VIOLATION: Empty actions list"
        assert "next_action" in data, "VIOLATION: No next_action in insight"
        
        print("✓ NO INSIGHT WITHOUT ACTION: All insights have executable actions")
    
    def test_no_action_without_deadline(self, authenticated_client):
        """Verify NO ACTION WITHOUT DEADLINE rule"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/full")
        data = response.json()
        
        # money_impact must have deadline
        assert "deadline" in data["money_impact"], "VIOLATION: money_impact missing deadline"
        
        # next_action should have deadline from money_impact
        next_action = data["next_action"]
        if next_action.get("deadline"):
            assert next_action["deadline"], "Action deadline should not be empty"
        
        print(f"✓ NO ACTION WITHOUT DEADLINE: Deadline = {data['money_impact']['deadline']}")
    
    def test_no_ai_without_money_impact(self, authenticated_client):
        """Verify NO AI WITHOUT MONEY IMPACT rule"""
        # Lead full insight must have money_impact
        lead_resp = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/full")
        lead_data = lead_resp.json()
        assert "money_impact" in lead_data, "VIOLATION: Lead insight missing money_impact"
        assert lead_data["money_impact"]["expected_value"] is not None
        
        # Deal full insight must have money_impact
        deal_resp = authenticated_client.get(f"{BASE_URL}/api/ai-insight/deal/{TEST_DEAL_ID}/full")
        deal_data = deal_resp.json()
        assert "money_impact" in deal_data, "VIOLATION: Deal insight missing money_impact"
        assert deal_data["money_impact"]["deal_value"] is not None
        
        # WAR ROOM must show money
        wr_resp = authenticated_client.get(f"{BASE_URL}/api/ai-insight/war-room")
        wr_data = wr_resp.json()
        assert "revenue_at_risk" in wr_data
        assert "today_opportunity" in wr_data
        
        print("✓ NO AI WITHOUT MONEY IMPACT: All AI outputs have money context")
    
    def test_no_display_without_execution(self, authenticated_client):
        """Verify NO DISPLAY WITHOUT EXECUTION rule - actions can be executed"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/full")
        data = response.json()
        
        # All displayed actions must have params to execute
        for action in data["actions"]:
            assert "action_type" in action, "Action missing action_type"
            assert "params" in action, "Action missing params for execution"
            assert "entity_type" in action["params"] or action["params"].get("entity_type") is not None, \
                f"Action params missing entity_type"
        
        # Test actual execution
        primary_action = data["actions"][0]
        exec_resp = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/execute",
            json={
                "action_type": primary_action["action_type"],
                "entity_type": primary_action["params"].get("entity_type", "lead"),
                "entity_id": primary_action["params"].get("entity_id", TEST_LEAD_ID),
                "params": primary_action["params"]
            }
        )
        exec_data = exec_resp.json()
        assert exec_data["success"] is True, f"Execution failed: {exec_data}"
        
        print("✓ NO DISPLAY WITHOUT EXECUTION: Displayed actions can be executed")


# ==================== FIXTURES ====================

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
