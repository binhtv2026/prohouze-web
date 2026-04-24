"""
ProHouzing Marketing API Tests - Prompt 7/20
Lead Source & Marketing Attribution Engine

Tests:
- Marketing Dashboard API
- Lead Sources CRUD
- Campaigns CRUD & Status Updates
- Assignment Rules CRUD & Test
- Config endpoints
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"

class TestMarketingDashboard:
    """Marketing Dashboard API Tests"""
    
    def test_get_dashboard_default_period(self):
        """Test dashboard with default 30d period"""
        response = requests.get(f"{BASE_URL}/api/marketing/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Validate required fields
        assert "total_leads" in data
        assert "conversion_rate" in data
        assert "total_revenue" in data
        assert "leads_by_source_type" in data
        assert "leads_by_channel" in data
        assert "active_campaigns" in data
        assert "active_sources" in data
        assert "top_sources" in data
        assert "period_start" in data
        assert "period_end" in data
        
        # Validate data types
        assert isinstance(data["total_leads"], int)
        assert isinstance(data["conversion_rate"], (int, float))
        assert isinstance(data["leads_by_source_type"], dict)
        
    def test_get_dashboard_7d_period(self):
        """Test dashboard with 7d period"""
        response = requests.get(f"{BASE_URL}/api/marketing/dashboard", params={"period": "7d"})
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        
    def test_get_dashboard_90d_period(self):
        """Test dashboard with 90d period"""
        response = requests.get(f"{BASE_URL}/api/marketing/dashboard", params={"period": "90d"})
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data


class TestMarketingConfig:
    """Marketing Config API Tests"""
    
    def test_get_source_types(self):
        """Test source types config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/source-types")
        assert response.status_code == 200
        data = response.json()
        assert "source_types" in data
        assert len(data["source_types"]) > 0
        # Verify structure of a source type
        st = data["source_types"][0]
        assert "code" in st
        assert "label" in st
        assert "label_vi" in st
        
    def test_get_channels(self):
        """Test channels config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/channels")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0
        
    def test_get_campaign_types(self):
        """Test campaign types config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/campaign-types")
        assert response.status_code == 200
        data = response.json()
        assert "campaign_types" in data
        
    def test_get_campaign_statuses(self):
        """Test campaign statuses config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/campaign-statuses")
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        
    def test_get_assignment_rule_types(self):
        """Test assignment rule types config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/assignment-rule-types")
        assert response.status_code == 200
        data = response.json()
        assert "rule_types" in data
        
    def test_get_attribution_models(self):
        """Test attribution models config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/attribution-models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        
    def test_get_touchpoint_types(self):
        """Test touchpoint types config endpoint"""
        response = requests.get(f"{BASE_URL}/api/marketing/config/touchpoint-types")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data


class TestLeadSources:
    """Lead Sources CRUD API Tests"""
    
    def test_get_all_sources(self):
        """Test getting all lead sources"""
        response = requests.get(f"{BASE_URL}/api/marketing/sources")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have default sources seeded
        assert len(data) >= 15, f"Expected at least 15 default sources, got {len(data)}"
        
    def test_get_sources_with_filters(self):
        """Test getting sources with type filter"""
        response = requests.get(f"{BASE_URL}/api/marketing/sources", params={"source_type": "paid"})
        assert response.status_code == 200
        data = response.json()
        for source in data:
            assert source["source_type"] == "paid"
            
    def test_get_sources_with_search(self):
        """Test searching sources"""
        response = requests.get(f"{BASE_URL}/api/marketing/sources", params={"search": "Facebook"})
        assert response.status_code == 200
        data = response.json()
        # Should find Facebook related sources
        for source in data:
            assert "facebook" in source["code"].lower() or "facebook" in source["name"].lower()
            
    def test_create_lead_source(self):
        """Test creating a new lead source"""
        unique_code = f"TEST_SRC_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "code": unique_code,
            "name": "Test Source",
            "source_type": "paid",
            "channel": "google_ads",
            "default_quality_score": 55,
            "description": "Test source for automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/marketing/sources", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["code"] == unique_code
        assert data["name"] == "Test Source"
        assert data["source_type"] == "paid"
        assert data["channel"] == "google_ads"
        assert "id" in data
        assert data["is_active"] == True
        
        # Verify persistence via GET
        get_response = requests.get(f"{BASE_URL}/api/marketing/sources/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["code"] == unique_code
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/marketing/sources/{data['id']}")
        
    def test_create_duplicate_source_fails(self):
        """Test that creating duplicate source code fails"""
        # Try to create with existing code (WEB_DIRECT)
        payload = {
            "code": "WEB_DIRECT",
            "name": "Duplicate Test",
            "source_type": "organic",
            "channel": "website"
        }
        response = requests.post(f"{BASE_URL}/api/marketing/sources", json=payload)
        assert response.status_code == 400
        assert "already exists" in response.text
        
    def test_update_lead_source(self):
        """Test updating a lead source"""
        # First create a source
        unique_code = f"TEST_UPD_{uuid.uuid4().hex[:8].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/marketing/sources", json={
            "code": unique_code,
            "name": "Original Name",
            "source_type": "social",
            "channel": "facebook"
        })
        assert create_response.status_code == 200
        source_id = create_response.json()["id"]
        
        # Update it
        update_response = requests.put(f"{BASE_URL}/api/marketing/sources/{source_id}", json={
            "name": "Updated Name",
            "default_quality_score": 75
        })
        assert update_response.status_code == 200
        assert update_response.json()["success"] == True
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/marketing/sources/{source_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Updated Name"
        assert get_response.json()["default_quality_score"] == 75
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/marketing/sources/{source_id}")
        
    def test_delete_lead_source(self):
        """Test deleting a lead source"""
        # Create source to delete
        unique_code = f"TEST_DEL_{uuid.uuid4().hex[:8].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/marketing/sources", json={
            "code": unique_code,
            "name": "To Delete",
            "source_type": "other",
            "channel": "other"
        })
        assert create_response.status_code == 200
        source_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/marketing/sources/{source_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/marketing/sources/{source_id}")
        assert get_response.status_code == 404
        
    def test_get_source_analytics(self):
        """Test getting analytics for a source"""
        # Get a source first
        sources_response = requests.get(f"{BASE_URL}/api/marketing/sources", params={"limit": 1})
        assert sources_response.status_code == 200
        sources = sources_response.json()
        assert len(sources) > 0
        
        source_id = sources[0]["id"]
        analytics_response = requests.get(f"{BASE_URL}/api/marketing/sources/{source_id}/analytics")
        assert analytics_response.status_code == 200
        
        data = analytics_response.json()
        assert "source_id" in data
        assert "total_leads" in data
        assert "conversion_rate" in data
        assert "total_revenue" in data
        
    def test_seed_defaults(self):
        """Test seeding default sources"""
        response = requests.post(f"{BASE_URL}/api/marketing/sources/seed-defaults")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "total_defaults" in data


class TestCampaigns:
    """Campaigns CRUD API Tests"""
    
    def test_get_all_campaigns(self):
        """Test getting all campaigns"""
        response = requests.get(f"{BASE_URL}/api/marketing/campaigns")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_campaigns_with_status_filter(self):
        """Test filtering campaigns by status"""
        response = requests.get(f"{BASE_URL}/api/marketing/campaigns", params={"status": "draft"})
        assert response.status_code == 200
        
    def test_create_campaign(self):
        """Test creating a new campaign"""
        unique_code = f"TEST_CAMP_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "code": unique_code,
            "name": "Test Campaign",
            "campaign_type": "lead_generation",
            "start_date": "2026-01-01",
            "end_date": "2026-06-30",
            "budget_total": 100000000,
            "target_leads": 500,
            "target_conversions": 50,
            "target_revenue": 5000000000
        }
        response = requests.post(f"{BASE_URL}/api/marketing/campaigns", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["code"] == unique_code
        assert data["name"] == "Test Campaign"
        assert data["status"] == "draft"
        assert data["budget_total"] == 100000000
        assert "id" in data
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/marketing/campaigns/{data['id']}")
        assert get_response.status_code == 200
        assert get_response.json()["code"] == unique_code
        
        # Store ID for cleanup later (in other tests)
        return data["id"]
        
    def test_create_duplicate_campaign_fails(self):
        """Test that duplicate campaign code fails"""
        # Get existing campaign
        campaigns_response = requests.get(f"{BASE_URL}/api/marketing/campaigns", params={"limit": 1})
        if campaigns_response.status_code == 200 and len(campaigns_response.json()) > 0:
            existing_code = campaigns_response.json()[0]["code"]
            
            payload = {
                "code": existing_code,
                "name": "Duplicate Test",
                "campaign_type": "lead_generation",
                "start_date": "2026-01-01"
            }
            response = requests.post(f"{BASE_URL}/api/marketing/campaigns", json=payload)
            assert response.status_code == 400
        
    def test_update_campaign_status(self):
        """Test updating campaign status draft -> active -> paused"""
        # Create a test campaign
        unique_code = f"TEST_STATUS_{uuid.uuid4().hex[:8].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/marketing/campaigns", json={
            "code": unique_code,
            "name": "Status Test Campaign",
            "campaign_type": "lead_generation",
            "start_date": "2026-01-01"
        })
        assert create_response.status_code == 200
        campaign_id = create_response.json()["id"]
        assert create_response.json()["status"] == "draft"
        
        # Change to active
        active_response = requests.put(f"{BASE_URL}/api/marketing/campaigns/{campaign_id}/status", json={
            "status": "active",
            "reason": "Starting campaign"
        })
        assert active_response.status_code == 200
        assert active_response.json()["new_status"] == "active"
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/marketing/campaigns/{campaign_id}")
        assert get_response.json()["status"] == "active"
        
        # Change to paused
        paused_response = requests.put(f"{BASE_URL}/api/marketing/campaigns/{campaign_id}/status", json={
            "status": "paused",
            "reason": "Budget review"
        })
        assert paused_response.status_code == 200
        assert paused_response.json()["new_status"] == "paused"
        
    def test_get_campaign_analytics(self):
        """Test getting campaign analytics"""
        # Get a campaign first
        campaigns_response = requests.get(f"{BASE_URL}/api/marketing/campaigns", params={"limit": 1})
        assert campaigns_response.status_code == 200
        
        if len(campaigns_response.json()) > 0:
            campaign_id = campaigns_response.json()[0]["id"]
            analytics_response = requests.get(f"{BASE_URL}/api/marketing/campaigns/{campaign_id}/analytics")
            assert analytics_response.status_code == 200
            
            data = analytics_response.json()
            assert "campaign_id" in data
            assert "total_leads" in data
            assert "conversion_rate" in data


class TestAssignmentRules:
    """Assignment Rules API Tests"""
    
    def test_get_all_rules(self):
        """Test getting all assignment rules"""
        response = requests.get(f"{BASE_URL}/api/marketing/assignment-rules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_rules_with_active_filter(self):
        """Test filtering rules by active status"""
        response = requests.get(f"{BASE_URL}/api/marketing/assignment-rules", params={"is_active": True})
        assert response.status_code == 200
        
    def test_create_assignment_rule(self):
        """Test creating a new assignment rule"""
        payload = {
            "name": f"TEST_RULE_{uuid.uuid4().hex[:6]}",
            "description": "Test rule for automated testing",
            "rule_type": "round_robin",
            "priority": 99,
            "is_active": True,
            "conditions": {"source_type": "paid"},
            "target_teams": ["sales-team-1"]
        }
        response = requests.post(f"{BASE_URL}/api/marketing/assignment-rules", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["rule_type"] == "round_robin"
        assert data["priority"] == 99
        assert data["is_active"] == True
        assert "id" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/marketing/assignment-rules/{data['id']}")
        
    def test_update_assignment_rule(self):
        """Test updating a rule (toggle active)"""
        # Create a rule first
        create_response = requests.post(f"{BASE_URL}/api/marketing/assignment-rules", json={
            "name": f"TEST_TOGGLE_{uuid.uuid4().hex[:6]}",
            "rule_type": "by_capacity",
            "priority": 50,
            "is_active": True
        })
        assert create_response.status_code == 200
        rule_id = create_response.json()["id"]
        
        # Toggle to inactive
        update_response = requests.put(f"{BASE_URL}/api/marketing/assignment-rules/{rule_id}", json={
            "is_active": False
        })
        assert update_response.status_code == 200
        
        # Verify update
        rules_response = requests.get(f"{BASE_URL}/api/marketing/assignment-rules")
        rule = next((r for r in rules_response.json() if r["id"] == rule_id), None)
        assert rule is not None
        assert rule["is_active"] == False
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/marketing/assignment-rules/{rule_id}")
        
    def test_delete_assignment_rule(self):
        """Test deleting an assignment rule"""
        # Create a rule to delete
        create_response = requests.post(f"{BASE_URL}/api/marketing/assignment-rules", json={
            "name": f"TEST_DELETE_{uuid.uuid4().hex[:6]}",
            "rule_type": "round_robin",
            "priority": 100
        })
        assert create_response.status_code == 200
        rule_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/marketing/assignment-rules/{rule_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted (should not be in list)
        rules_response = requests.get(f"{BASE_URL}/api/marketing/assignment-rules")
        rule = next((r for r in rules_response.json() if r["id"] == rule_id), None)
        assert rule is None
        
    def test_assignment_rules_test_endpoint(self):
        """Test the assignment rules test endpoint"""
        payload = {
            "source_type": "paid",
            "segment": "vip",
            "channel": "google_ads"
        }
        response = requests.post(f"{BASE_URL}/api/marketing/assignment-rules/test", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "lead_id" in data
        assert "success" in data
        assert "reason" in data


class TestChannelAnalytics:
    """Channel Analytics API Tests"""
    
    def test_get_channel_analytics(self):
        """Test getting channel analytics"""
        response = requests.get(f"{BASE_URL}/api/marketing/analytics/channels")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_channel_analytics_7d(self):
        """Test channel analytics with 7d period"""
        response = requests.get(f"{BASE_URL}/api/marketing/analytics/channels", params={"period": "7d"})
        assert response.status_code == 200


# Cleanup function
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Cleanup any TEST_ prefixed sources
    sources_response = requests.get(f"{BASE_URL}/api/marketing/sources")
    if sources_response.status_code == 200:
        for source in sources_response.json():
            if source["code"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/marketing/sources/{source['id']}")
    
    # Cleanup any TEST_ prefixed campaigns
    campaigns_response = requests.get(f"{BASE_URL}/api/marketing/campaigns")
    if campaigns_response.status_code == 200:
        for campaign in campaigns_response.json():
            if campaign["code"].startswith("TEST_"):
                # Note: Campaigns don't have delete endpoint, would need to add one
                pass
    
    # Cleanup any TEST_ prefixed rules
    rules_response = requests.get(f"{BASE_URL}/api/marketing/assignment-rules")
    if rules_response.status_code == 200:
        for rule in rules_response.json():
            if rule["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/marketing/assignment-rules/{rule['id']}")
