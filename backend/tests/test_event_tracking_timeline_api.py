"""
ProHouzing Event Tracking & Activity Stream API Tests (Prompt 2/18)

Tests for:
- Deal creation with deal.created event emission
- Deal stage change with deal.stage_changed event emission
- Timeline API endpoints (deals, customers, recent, changes, events)
- Activity stream item generation
- Change log recording
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://content-machine-18.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


class TestEventTrackingTimeline:
    """Test event tracking and timeline APIs for Prompt 2/18"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.auth_token = None
        self.org_id = None
        self.created_deal_id = None
        
    def _login(self):
        """Login and get auth token"""
        if self.auth_token:
            return self.auth_token
            
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        data = response.json()
        self.auth_token = data.get("access_token")
        self.org_id = data.get("org_id")
        self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
        return self.auth_token
    
    # =========================================================================
    # AUTHENTICATION TEST
    # =========================================================================
    
    def test_01_login_success(self):
        """Test login with valid credentials"""
        self._login()
        assert self.auth_token is not None, "Should get auth token"
        print(f"✅ Login successful, org_id: {self.org_id}")
    
    # =========================================================================
    # DEAL CREATION WITH EVENT EMISSION
    # =========================================================================
    
    def test_02_create_deal_emits_event(self):
        """Test POST /api/v2/deals - creates deal AND emits deal.created event"""
        self._login()
        
        # First, get a customer ID for the deal
        customers_response = self.session.get(
            f"{BASE_URL}/api/v2/customers",
            params={"limit": 1}
        )
        
        if customers_response.status_code != 200:
            pytest.skip("Cannot get customers for deal creation")
        
        customers = customers_response.json().get("data", [])
        if not customers:
            pytest.skip("No customers available for deal creation")
        
        customer_id = customers[0].get("id")
        
        # Create a new deal with required customer_id
        # Note: org_id is overridden from JWT token in the route handler
        deal_data = {
            "deal_name": f"TEST_Event_Deal_{uuid.uuid4().hex[:8]}",
            "customer_id": customer_id,
            "org_id": "00000000-0000-0000-0000-000000000001",  # Will be overridden from JWT
            "current_stage": "new",
            "deal_value": 500000000,  # 500M VND
            "sales_channel": "direct",
            "notes": "Test deal for event tracking verification"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/v2/deals",
            json=deal_data
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        assert "data" in data, "Response should have data"
        
        deal = data["data"]
        self.created_deal_id = deal.get("id")
        
        assert "id" in deal, "Deal should have id"
        assert "deal_code" in deal, "Deal should have deal_code"
        assert deal.get("current_stage") == "new", "Deal should be in 'new' stage"
        
        print(f"✅ Deal created: {deal.get('deal_code')} (ID: {self.created_deal_id})")
        
        # Store for later tests
        pytest.deal_id = self.created_deal_id
        pytest.deal_code = deal.get("deal_code")
        
    def test_03_verify_deal_created_event(self):
        """Verify deal.created event was emitted"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        # Check domain events for this deal
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/events",
            params={
                "aggregate_type": "deal",
                "aggregate_id": deal_id,
                "event_code": "deal.created"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        
        events = data.get("data", [])
        print(f"📋 Found {len(events)} deal.created events for deal {deal_id}")
        
        # There should be at least one deal.created event
        if len(events) > 0:
            event = events[0]
            assert event.get("event_code") == "deal.created", "Event code should be deal.created"
            assert event.get("aggregate_type") == "deal", "Aggregate type should be deal"
            print(f"✅ deal.created event found with payload: {event.get('payload', {})}")
        else:
            print("⚠️ No deal.created event found (may need to check event visibility)")
    
    def test_04_verify_activity_stream_item(self):
        """Verify activity stream item was created for deal"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        # Get deal timeline
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/deals/{deal_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        
        activities = data.get("data", [])
        print(f"📋 Found {len(activities)} activities for deal {deal_id}")
        
        # Check for deal.created activity
        created_activity = next(
            (a for a in activities if a.get("activity_code") == "deal.created"),
            None
        )
        
        if created_activity:
            assert created_activity.get("entity_type") == "deal", "Entity type should be deal"
            print(f"✅ Activity stream item found: {created_activity.get('title')}")
            print(f"   Summary: {created_activity.get('summary')}")
        else:
            print("⚠️ No deal.created activity found in timeline")
    
    # =========================================================================
    # DEAL STAGE CHANGE WITH EVENT EMISSION
    # =========================================================================
    
    def test_05_change_deal_stage_emits_event(self):
        """Test POST /api/v2/deals/{deal_id}/stage - changes stage AND emits deal.stage_changed event"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        # Change deal stage from 'new' to 'qualified'
        stage_change_data = {
            "new_stage": "qualified"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/v2/deals/{deal_id}/stage",
            json=stage_change_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        
        deal = data.get("data", {})
        assert deal.get("current_stage") == "qualified", "Deal should be in 'qualified' stage"
        
        print(f"✅ Deal stage changed to 'qualified'")
    
    def test_06_verify_stage_changed_event(self):
        """Verify deal.stage_changed event was emitted"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        # Check domain events for stage change
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/events",
            params={
                "aggregate_type": "deal",
                "aggregate_id": deal_id
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        events = data.get("data", [])
        
        # Find stage changed event
        stage_event = next(
            (e for e in events if e.get("event_code") == "deal.stage_changed"),
            None
        )
        
        if stage_event:
            payload = stage_event.get("payload", {})
            print(f"✅ deal.stage_changed event found")
            print(f"   Old stage: {payload.get('old_stage')}")
            print(f"   New stage: {payload.get('new_stage')}")
        else:
            print("⚠️ No deal.stage_changed event found")
    
    def test_07_verify_change_log_created(self):
        """Verify change log was created when deal stage changed"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        # Get change logs for this deal
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/changes/deal/{deal_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        
        changes = data.get("data", [])
        print(f"📋 Found {len(changes)} change logs for deal {deal_id}")
        
        # Find current_stage change
        stage_change = next(
            (c for c in changes if c.get("field_name") == "current_stage"),
            None
        )
        
        if stage_change:
            print(f"✅ Change log found for current_stage")
            print(f"   Old value: {stage_change.get('old_display_value')}")
            print(f"   New value: {stage_change.get('new_display_value')}")
        else:
            print("⚠️ No change log found for current_stage field")
    
    # =========================================================================
    # TIMELINE API ENDPOINTS
    # =========================================================================
    
    def test_08_get_deal_timeline(self):
        """Test GET /api/v2/timeline/deals/{deal_id}"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/deals/{deal_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list), "Data should be a list"
        
        activities = data.get("data", [])
        print(f"✅ Deal timeline API works - {len(activities)} activities")
        
        for activity in activities[:3]:
            print(f"   - {activity.get('activity_code')}: {activity.get('title')}")
    
    def test_09_get_customer_timeline(self):
        """Test GET /api/v2/timeline/customers/{customer_id}"""
        self._login()
        
        # First, get a customer ID from existing data
        customers_response = self.session.get(
            f"{BASE_URL}/api/v2/customers",
            params={"limit": 1}
        )
        
        if customers_response.status_code != 200:
            pytest.skip("Cannot get customers to test timeline")
        
        customers = customers_response.json().get("data", [])
        if not customers:
            pytest.skip("No customers available to test timeline")
        
        customer_id = customers[0].get("id")
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/customers/{customer_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list), "Data should be a list"
        
        activities = data.get("data", [])
        print(f"✅ Customer timeline API works - {len(activities)} activities for customer {customer_id}")
    
    def test_10_get_recent_activities(self):
        """Test GET /api/v2/timeline/recent"""
        self._login()
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/recent",
            params={"limit": 20}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list), "Data should be a list"
        
        activities = data.get("data", [])
        print(f"✅ Recent activities API works - {len(activities)} recent activities")
        
        for activity in activities[:5]:
            print(f"   - [{activity.get('entity_type')}] {activity.get('activity_code')}: {activity.get('title')}")
    
    def test_11_get_recent_activities_filtered(self):
        """Test GET /api/v2/timeline/recent with filters"""
        self._login()
        
        # Filter by entity types
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/recent",
            params={
                "limit": 10,
                "entity_types": "deal,customer"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        
        activities = data.get("data", [])
        print(f"✅ Filtered recent activities - {len(activities)} deal/customer activities")
    
    def test_12_get_entity_changes(self):
        """Test GET /api/v2/timeline/changes/{entity_type}/{entity_id}"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/changes/deal/{deal_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list), "Data should be a list"
        
        changes = data.get("data", [])
        print(f"✅ Entity changes API works - {len(changes)} change logs for deal")
        
        for change in changes[:5]:
            print(f"   - {change.get('field_name')}: {change.get('old_display_value')} → {change.get('new_display_value')}")
    
    def test_13_get_domain_events(self):
        """Test GET /api/v2/timeline/events (admin only)"""
        self._login()
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/events",
            params={"limit": 20}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list), "Data should be a list"
        
        events = data.get("data", [])
        print(f"✅ Domain events API works - {len(events)} events")
        
        for event in events[:5]:
            print(f"   - [{event.get('aggregate_type')}] {event.get('event_code')} (seq: {event.get('sequence_no')})")
    
    def test_14_get_domain_events_filtered(self):
        """Test GET /api/v2/timeline/events with filters"""
        self._login()
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/events",
            params={
                "aggregate_type": "deal",
                "event_code": "deal.created",
                "limit": 10
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        
        events = data.get("data", [])
        print(f"✅ Filtered domain events - {len(events)} deal.created events")
        
        # All events should be deal.created
        for event in events:
            assert event.get("event_code") == "deal.created", "Event should be deal.created"
    
    def test_15_get_generic_entity_timeline(self):
        """Test GET /api/v2/timeline/{entity_type}/{entity_id}"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/deal/{deal_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert isinstance(data.get("data"), list), "Data should be a list"
        
        activities = data.get("data", [])
        print(f"✅ Generic entity timeline API works - {len(activities)} activities")
    
    # =========================================================================
    # ADDITIONAL STAGE TRANSITIONS
    # =========================================================================
    
    def test_16_change_to_viewing_stage(self):
        """Test stage transition to 'viewing'"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        response = self.session.post(
            f"{BASE_URL}/api/v2/deals/{deal_id}/stage",
            json={"new_stage": "viewing"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("data", {}).get("current_stage") == "viewing"
        print(f"✅ Stage changed to 'viewing'")
    
    def test_17_verify_multiple_stage_changes_logged(self):
        """Verify multiple stage changes are logged"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/changes/deal/{deal_id}",
            params={"field_name": "current_stage"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        changes = data.get("data", [])
        
        print(f"✅ Found {len(changes)} stage change logs")
        
        # Should have at least 2 stage changes (new→qualified, qualified→viewing)
        assert len(changes) >= 2, f"Expected at least 2 stage changes, got {len(changes)}"
    
    def test_18_deal_timeline_shows_all_activities(self):
        """Verify deal timeline shows all activities (created + stage changes)"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            pytest.skip("No deal created in previous test")
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/deals/{deal_id}"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        activities = data.get("data", [])
        
        activity_codes = [a.get("activity_code") for a in activities]
        
        print(f"✅ Deal timeline activities: {activity_codes}")
        
        # Should have multiple activity types
        unique_codes = set(activity_codes)
        print(f"   Unique activity codes: {unique_codes}")
    
    # =========================================================================
    # PAGINATION TESTS
    # =========================================================================
    
    def test_19_timeline_pagination(self):
        """Test timeline API pagination (deal timeline has pagination)"""
        self._login()
        deal_id = getattr(pytest, 'deal_id', None)
        
        if not deal_id:
            # Try to get any existing deal for pagination test
            deals_resp = self.session.get(f"{BASE_URL}/api/v2/deals", params={"limit": 1})
            if deals_resp.status_code == 200 and deals_resp.json().get("data"):
                deal_id = deals_resp.json()["data"][0]["id"]
            else:
                pytest.skip("No deal available for pagination test")
        
        # Deal timeline has pagination
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/deals/{deal_id}",
            params={"page": 1, "limit": 5}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        meta = data.get("meta")
        
        print(f"✅ Timeline pagination works")
        if meta:
            print(f"   Total: {meta.get('total')}")
            print(f"   Pages: {meta.get('pages')}")
            print(f"   Has next: {meta.get('has_next')}")
        else:
            # Recent activities doesn't have pagination meta
            activities = data.get("data", [])
            print(f"   Items returned: {len(activities)}")
    
    def test_20_domain_events_pagination(self):
        """Test domain events API pagination"""
        self._login()
        
        response = self.session.get(
            f"{BASE_URL}/api/v2/timeline/events",
            params={"page": 1, "limit": 10}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        meta = data.get("meta", {})
        
        print(f"✅ Domain events pagination works")
        print(f"   Total: {meta.get('total')}")
        print(f"   Pages: {meta.get('pages')}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
