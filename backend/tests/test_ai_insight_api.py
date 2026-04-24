"""
Test AI Insight Engine API Endpoints
Prompt 18/20 - AI Decision Engine

Tests all AI Insight endpoints:
- Lead Scoring Engine
- Deal Risk Detection Engine
- Next Best Action Engine
- Today Actions
- AI Stats
- Generate Alerts
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


class TestAuthentication:
    """Authentication tests for AI Insight API"""
    
    def test_login_and_get_token(self, api_client):
        """Test login to get auth token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["token_type"] == "bearer"
        print(f"✓ Login successful - Got token for {data['user']['email']}")


class TestLeadScoringAPI:
    """Tests for Lead Scoring Engine endpoints"""
    
    def test_get_lead_score(self, authenticated_client):
        """GET /api/ai-insight/lead/{lead_id}/score - Lead scoring with explanation"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/score")
        assert response.status_code == 200, f"Failed to get lead score: {response.text}"
        
        data = response.json()
        # Verify required fields
        assert "lead_id" in data, "Missing lead_id"
        assert "lead_name" in data, "Missing lead_name"
        assert "score" in data, "Missing score"
        assert "score_level" in data, "Missing score_level"
        assert "confidence" in data, "Missing confidence"
        assert "confidence_level" in data, "Missing confidence_level"
        assert "factors" in data, "Missing factors breakdown"
        assert "explanation" in data, "Missing explanation"
        assert "recommendation" in data, "Missing recommendation"
        assert "action_suggestions" in data, "Missing action_suggestions"
        
        # Verify score is valid
        assert 0 <= data["score"] <= 100, f"Invalid score: {data['score']}"
        assert data["score_level"] in ["excellent", "good", "average", "poor", "critical"]
        
        # Verify explanation structure (NO BLACKBOX rule)
        explanation = data["explanation"]
        assert "summary" in explanation, "Missing explanation summary"
        assert "detailed_breakdown" in explanation, "Missing detailed breakdown"
        
        # Verify factors (MUST EXPLAIN rule)
        assert len(data["factors"]) > 0, "No factors provided - violates MUST EXPLAIN rule"
        for factor in data["factors"]:
            assert "name" in factor, "Factor missing name"
            assert "score" in factor, "Factor missing score"
            assert "reason" in factor, "Factor missing reason"
        
        print(f"✓ Lead Score: {data['score']}/100 ({data['score_level']}) for {data['lead_name']}")
        print(f"  - {len(data['factors'])} factors analyzed")
        print(f"  - Confidence: {data['confidence']} ({data['confidence_level']})")
    
    def test_get_lead_insight(self, authenticated_client):
        """GET /api/ai-insight/lead/{lead_id}/insight - Complete lead insight"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/insight")
        assert response.status_code == 200, f"Failed to get lead insight: {response.text}"
        
        data = response.json()
        assert "entity_type" in data
        assert data["entity_type"] == "lead"
        assert "lead_score" in data
        assert "next_best_action" in data
        assert "processing_time_ms" in data
        print(f"✓ Lead Insight: Processing time {data['processing_time_ms']}ms")
    
    def test_get_lead_score_history(self, authenticated_client):
        """GET /api/ai-insight/lead/{lead_id}/score-history"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/score-history?limit=5"
        )
        assert response.status_code == 200, f"Failed to get score history: {response.text}"
        
        data = response.json()
        assert "lead_id" in data
        assert "history" in data
        print(f"✓ Lead Score History: {len(data['history'])} records")
    
    def test_lead_not_found(self, authenticated_client):
        """Test 404 for non-existent lead"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/lead/non-existent-lead-id/score"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent lead returns 404")


class TestDealRiskAPI:
    """Tests for Deal Risk Detection Engine endpoints"""
    
    def test_get_deal_risk(self, authenticated_client):
        """GET /api/ai-insight/deal/{deal_id}/risk - Deal risk assessment"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/deal/{TEST_DEAL_ID}/risk")
        assert response.status_code == 200, f"Failed to get deal risk: {response.text}"
        
        data = response.json()
        # Verify required fields
        assert "deal_id" in data, "Missing deal_id"
        assert "deal_code" in data, "Missing deal_code"
        assert "risk_level" in data, "Missing risk_level"
        assert "risk_score" in data, "Missing risk_score"
        assert "signals" in data, "Missing signals"
        assert "explanation" in data, "Missing explanation"
        assert "recommendation" in data, "Missing recommendation"
        assert "action_suggestions" in data, "Missing action_suggestions"
        
        # Verify risk level
        assert data["risk_level"] in ["critical", "high", "medium", "low", "none"]
        assert 0 <= data["risk_score"] <= 100, f"Invalid risk score: {data['risk_score']}"
        
        # Verify explanation (NO BLACKBOX rule)
        explanation = data["explanation"]
        assert "summary" in explanation, "Missing explanation summary"
        assert "detailed_breakdown" in explanation, "Missing detailed breakdown"
        
        # Verify recommendation structure
        recommendation = data["recommendation"]
        assert "type" in recommendation
        assert "title" in recommendation
        assert "priority" in recommendation
        
        print(f"✓ Deal Risk: {data['risk_level']} ({data['risk_score']}/100)")
        print(f"  - {len(data['signals'])} signals detected")
        print(f"  - Recommendation: {recommendation['title']}")
    
    def test_get_deal_insight(self, authenticated_client):
        """GET /api/ai-insight/deal/{deal_id}/insight - Complete deal insight"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/deal/{TEST_DEAL_ID}/insight")
        assert response.status_code == 200, f"Failed to get deal insight: {response.text}"
        
        data = response.json()
        assert data["entity_type"] == "deal"
        assert "deal_risk" in data
        assert "next_best_action" in data
        print(f"✓ Deal Insight: Processing time {data.get('processing_time_ms', 'N/A')}ms")
    
    def test_get_high_risk_deals(self, authenticated_client):
        """GET /api/ai-insight/deals/high-risk"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/deals/high-risk?limit=10")
        assert response.status_code == 200, f"Failed to get high risk deals: {response.text}"
        
        data = response.json()
        assert "count" in data
        assert "deals" in data
        print(f"✓ High Risk Deals: {data['count']} deals found")
    
    def test_deal_not_found(self, authenticated_client):
        """Test 404 for non-existent deal"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/deal/non-existent-deal-id/risk"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent deal returns 404")


class TestNextBestActionAPI:
    """Tests for Next Best Action Engine endpoints"""
    
    def test_get_nba_for_lead(self, authenticated_client):
        """GET /api/ai-insight/nba/lead/{entity_id}"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/nba/lead/{TEST_LEAD_ID}"
        )
        assert response.status_code == 200, f"Failed to get NBA for lead: {response.text}"
        
        data = response.json()
        assert data["entity_type"] == "lead"
        assert "primary_action" in data
        assert "alternative_actions" in data
        assert "rationale" in data
        assert "confidence" in data
        
        # Verify primary action structure
        action = data["primary_action"]
        assert "action_id" in action
        assert "action_type" in action
        assert "label" in action
        assert "priority" in action
        
        print(f"✓ NBA for Lead: {action['label']} (priority: {action['priority']})")
        print(f"  - Confidence: {data['confidence']} ({data['confidence_level']})")
        print(f"  - Alternatives: {len(data['alternative_actions'])}")
    
    def test_get_nba_for_deal(self, authenticated_client):
        """GET /api/ai-insight/nba/deal/{entity_id}"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/nba/deal/{TEST_DEAL_ID}"
        )
        assert response.status_code == 200, f"Failed to get NBA for deal: {response.text}"
        
        data = response.json()
        assert data["entity_type"] == "deal"
        assert "primary_action" in data
        print(f"✓ NBA for Deal: {data['primary_action']['label']}")
    
    def test_nba_invalid_entity_type(self, authenticated_client):
        """Test 400 for invalid entity type"""
        response = authenticated_client.get(
            f"{BASE_URL}/api/ai-insight/nba/invalid/some-id"
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid entity type returns 400")


class TestTodayActionsAPI:
    """Tests for Today Actions endpoint"""
    
    def test_get_today_actions(self, authenticated_client):
        """GET /api/ai-insight/today-actions"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/today-actions?limit=10")
        assert response.status_code == 200, f"Failed to get today actions: {response.text}"
        
        data = response.json()
        assert "count" in data
        assert "actions" in data
        
        # Verify action structure if any actions exist
        if data["count"] > 0:
            action = data["actions"][0]
            assert "entity_type" in action
            assert "entity_id" in action
            assert "action_type" in action
            assert "action_label" in action
            assert "priority" in action
            assert "reason" in action
        
        print(f"✓ Today Actions: {data['count']} actions")
        for action in data["actions"][:3]:
            print(f"  - {action['action_label']}: {action['entity_name']} ({action['priority']})")


class TestAIStatsAPI:
    """Tests for AI Statistics endpoint"""
    
    def test_get_ai_stats(self, authenticated_client):
        """GET /api/ai-insight/stats"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/stats")
        assert response.status_code == 200, f"Failed to get AI stats: {response.text}"
        
        data = response.json()
        # Verify lead scoring stats
        assert "lead_scoring" in data
        lead_stats = data["lead_scoring"]
        assert "scored_24h" in lead_stats
        assert "scored_7d" in lead_stats
        assert "avg_score_7d" in lead_stats
        assert "hot_leads" in lead_stats
        
        # Verify deal risk stats
        assert "deal_risk" in data
        risk_stats = data["deal_risk"]
        assert "assessed_24h" in risk_stats
        assert "assessed_7d" in risk_stats
        assert "high_risk_deals" in risk_stats
        
        assert "generated_at" in data
        
        print(f"✓ AI Stats:")
        print(f"  - Lead Scoring: {lead_stats['scored_7d']} leads (7d), avg {lead_stats['avg_score_7d']}")
        print(f"  - Deal Risk: {risk_stats['assessed_7d']} deals (7d), {risk_stats['high_risk_deals']} high risk")


class TestControlCenterIntegrationAPI:
    """Tests for Control Center Integration endpoints"""
    
    def test_generate_ai_alerts(self, authenticated_client):
        """POST /api/ai-insight/generate-alerts"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai-insight/generate-alerts")
        assert response.status_code == 200, f"Failed to generate alerts: {response.text}"
        
        data = response.json()
        assert "alerts_created" in data
        assert "generated_at" in data
        
        print(f"✓ AI Alerts Generated: {data['alerts_created']} alerts")
    
    def test_push_today_actions(self, authenticated_client):
        """POST /api/ai-insight/push-today-actions"""
        response = authenticated_client.post(f"{BASE_URL}/api/ai-insight/push-today-actions")
        assert response.status_code == 200, f"Failed to push today actions: {response.text}"
        
        data = response.json()
        assert "tasks_created" in data
        assert "generated_at" in data
        
        print(f"✓ Today Actions Pushed: {data['tasks_created']} tasks created")


class TestAIGovernanceAPI:
    """Tests for AI Governance endpoints (configurable rules)"""
    
    def test_get_scoring_rules(self, authenticated_client):
        """GET /api/ai-insight/rules/scoring"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/rules/scoring")
        assert response.status_code == 200, f"Failed to get scoring rules: {response.text}"
        
        data = response.json()
        assert "rules" in data
        
        # Verify rule structure (MUST CONFIGURABLE rule)
        rules = data["rules"]
        assert "budget_match" in rules, "Missing budget_match rule"
        assert "engagement_level" in rules, "Missing engagement_level rule"
        
        print(f"✓ Scoring Rules: {len(rules)} rule categories configured")
        for rule_name in list(rules.keys())[:3]:
            print(f"  - {rule_name}: weight {rules[rule_name].get('weight', 'N/A')}")
    
    def test_get_risk_rules(self, authenticated_client):
        """GET /api/ai-insight/rules/risk"""
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/rules/risk")
        assert response.status_code == 200, f"Failed to get risk rules: {response.text}"
        
        data = response.json()
        assert "rules" in data
        
        rules = data["rules"]
        assert "stale_deal" in rules, "Missing stale_deal rule"
        
        print(f"✓ Risk Rules: {len(rules)} rule categories configured")


class TestBatchOperationsAPI:
    """Tests for batch operations"""
    
    def test_batch_score_leads(self, authenticated_client):
        """POST /api/ai-insight/leads/batch-score"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/leads/batch-score",
            json={"lead_ids": [TEST_LEAD_ID]}
        )
        assert response.status_code == 200, f"Failed batch score: {response.text}"
        
        data = response.json()
        assert "scored" in data
        assert "results" in data
        
        print(f"✓ Batch Score: {data['scored']} leads scored")
    
    def test_batch_assess_deals(self, authenticated_client):
        """POST /api/ai-insight/deals/batch-assess"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/ai-insight/deals/batch-assess",
            json={"deal_ids": [TEST_DEAL_ID]}
        )
        assert response.status_code == 200, f"Failed batch assess: {response.text}"
        
        data = response.json()
        assert "assessed" in data
        assert "results" in data
        
        print(f"✓ Batch Assess: {data['assessed']} deals assessed")


class TestAIHardRules:
    """Tests verifying AI Engine hard rules compliance"""
    
    def test_no_blackbox_rule(self, authenticated_client):
        """Verify NO BLACKBOX rule - all outputs are explainable"""
        # Lead score must have explanation
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/score")
        data = response.json()
        
        assert "explanation" in data, "VIOLATION: Missing explanation - violates NO BLACKBOX rule"
        assert "factors" in data, "VIOLATION: Missing factors - violates NO BLACKBOX rule"
        assert data["explanation"]["summary"], "VIOLATION: Empty explanation summary"
        
        print("✓ NO BLACKBOX: All outputs have explanations")
    
    def test_must_explain_rule(self, authenticated_client):
        """Verify MUST EXPLAIN rule - clear reasoning for all scores"""
        # Lead score factors must have reasons
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/score")
        data = response.json()
        
        for factor in data["factors"]:
            assert "reason" in factor, f"VIOLATION: Factor '{factor.get('name')}' missing reason"
            assert factor["reason"], f"VIOLATION: Factor '{factor.get('name')}' has empty reason"
        
        print(f"✓ MUST EXPLAIN: All {len(data['factors'])} factors have clear reasons")
    
    def test_must_configurable_rule(self, authenticated_client):
        """Verify MUST CONFIGURABLE rule - rules not hardcoded"""
        # Check scoring rules endpoint exists and returns configurable rules
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/rules/scoring")
        data = response.json()
        
        rules = data["rules"]
        for rule_name, rule_config in rules.items():
            assert "weight" in rule_config, f"VIOLATION: Rule '{rule_name}' missing configurable weight"
        
        print(f"✓ MUST CONFIGURABLE: {len(rules)} rules are externally configurable")
    
    def test_must_confidence_rule(self, authenticated_client):
        """Verify MUST CONFIDENCE - all outputs have confidence scores"""
        # Lead score must have confidence
        response = authenticated_client.get(f"{BASE_URL}/api/ai-insight/lead/{TEST_LEAD_ID}/score")
        data = response.json()
        
        assert "confidence" in data, "VIOLATION: Missing confidence - violates MUST CONFIDENCE rule"
        assert "confidence_level" in data, "VIOLATION: Missing confidence_level"
        assert 0 <= data["confidence"] <= 1, f"VIOLATION: Invalid confidence value: {data['confidence']}"
        
        print(f"✓ MUST CONFIDENCE: Confidence {data['confidence']} ({data['confidence_level']})")


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
