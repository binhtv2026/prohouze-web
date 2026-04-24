"""
P84 FINAL UPGRADE - SEO DOMINATION System Tests
=================================================
Testing all SEO engine components:
1. Publish Strategy Engine (drip-feed 10-20 pages/day)
2. Google Indexing Engine (GSC config upload)
3. Backlink Engine (10 satellite sites)
4. CTR & Dwell Time tracking (TOC, related posts, session ≥30s)
5. Rank Tracking dashboard

Test Credentials:
- email: admin@prohouzing.vn
- password: admin123
"""

import pytest
import requests
import os
import json
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ===================== FIXTURES =====================

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@prohouzing.vn",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ===================== PUBLISH STRATEGY ENGINE TESTS =====================

class TestPublishStrategyEngine:
    """Publish Strategy Engine - Drip-feed content publishing"""
    
    def test_get_publish_stats(self, api_client):
        """GET /api/seo/publish/stats - Get publish statistics"""
        response = api_client.get(f"{BASE_URL}/api/seo/publish/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify required fields
        assert "is_active" in data
        assert "config" in data
        assert "today" in data
        assert "queue" in data
        
        # Verify config structure
        config = data["config"]
        assert "pages_per_day_min" in config
        assert "pages_per_day_max" in config
        assert "min_seo_score" in config
        
        # Verify queue structure
        queue = data["queue"]
        assert "pending" in queue
        assert "scheduled" in queue
        
        print(f"Publish stats: is_active={data['is_active']}, queue_pending={queue['pending']}")
    
    def test_get_publish_queue(self, api_client):
        """GET /api/seo/publish/queue - Get publish queue"""
        response = api_client.get(f"{BASE_URL}/api/seo/publish/queue?limit=20")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data
        assert "stats" in data
        
        # Verify stats structure
        stats = data["stats"]
        assert "pending" in stats
        assert "scheduled" in stats
        assert "published" in stats
        assert "total" in stats
        
        print(f"Queue stats: pending={stats['pending']}, scheduled={stats['scheduled']}, total={stats['total']}")
    
    def test_auto_add_drafts_to_queue(self, api_client):
        """POST /api/seo/publish/queue/auto-add - Auto add draft pages to queue"""
        response = api_client.post(f"{BASE_URL}/api/seo/publish/queue/auto-add?min_seo_score=60&limit=100")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        assert "added" in data
        assert data["success"] == True
        
        print(f"Auto-add result: added={data['added']} pages to queue")
    
    def test_create_daily_schedule(self, api_client):
        """POST /api/seo/publish/schedule/create - Create daily publish schedule"""
        response = api_client.post(f"{BASE_URL}/api/seo/publish/schedule/create")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Can return either success schedule or error (no pages in queue)
        if "error" in data:
            print(f"Schedule creation: {data['error']}")
        else:
            assert "scheduled_count" in data or "time_slots" in data
            print(f"Schedule created: {data.get('scheduled_count', 0)} pages scheduled")


# ===================== GOOGLE INDEXING ENGINE TESTS =====================

class TestGoogleIndexingEngine:
    """Google Indexing Engine - GSC configuration and index submission"""
    
    def test_get_gsc_config(self, api_client):
        """GET /api/seo/index/config - Get GSC configuration status"""
        response = api_client.get(f"{BASE_URL}/api/seo/index/config")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "is_configured" in data
        
        if data["is_configured"]:
            assert "service_account_email" in data
            assert "site_url" in data
            print(f"GSC configured: email={data.get('service_account_email')}, site={data.get('site_url')}")
        else:
            print("GSC not configured (expected for fresh setup)")
    
    def test_post_gsc_config_valid(self, api_client):
        """POST /api/seo/index/config - Upload GSC config with valid JSON structure"""
        # Mock service account JSON (won't work with real Google APIs but validates endpoint)
        mock_service_account = {
            "type": "service_account",
            "project_id": "prohouzing-seo-test",
            "private_key_id": "test-key-id",
            "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n",
            "client_email": "seo-indexing@prohouzing-seo-test.iam.gserviceaccount.com",
            "client_id": "123456789",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/seo/index/config",
            json={"service_account_json": mock_service_account}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "service_account_email" in data
        
        print(f"GSC config uploaded: email={data.get('service_account_email')}")
    
    def test_post_gsc_config_invalid(self, api_client):
        """POST /api/seo/index/config - Reject invalid JSON structure"""
        invalid_json = {
            "some_field": "missing required fields"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/seo/index/config",
            json={"service_account_json": invalid_json}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid JSON, got {response.status_code}"
        print("Invalid GSC config correctly rejected")


# ===================== BACKLINK ENGINE TESTS =====================

class TestBacklinkEngine:
    """Backlink Engine - Satellite sites and backlink network"""
    
    def test_get_satellite_sites(self, api_client):
        """GET /api/seo/backlink/sites - List satellite sites"""
        response = api_client.get(f"{BASE_URL}/api/seo/backlink/sites")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "sites" in data
        assert "total" in data
        
        sites = data["sites"]
        if len(sites) > 0:
            site = sites[0]
            assert "id" in site
            assert "domain" in site
            assert "name" in site
            assert "is_active" in site
        
        print(f"Satellite sites: {data['total']} sites found")
    
    def test_get_backlink_stats(self, api_client):
        """GET /api/seo/backlink/stats - Get backlink statistics"""
        response = api_client.get(f"{BASE_URL}/api/seo/backlink/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_backlinks" in data
        assert "by_site" in data
        assert "by_anchor" in data
        assert "recent_7_days" in data
        
        print(f"Backlink stats: total={data['total_backlinks']}, recent_7d={data['recent_7_days']}")
    
    def test_generate_default_satellite_sites(self, api_client):
        """POST /api/seo/backlink/sites/generate-defaults - Generate 10 default satellite sites"""
        response = api_client.post(f"{BASE_URL}/api/seo/backlink/sites/generate-defaults")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        assert "created" in data
        assert data["success"] == True
        
        print(f"Default sites generated: created={data['created']}")
        
        # Verify sites were created
        sites_response = api_client.get(f"{BASE_URL}/api/seo/backlink/sites")
        sites_data = sites_response.json()
        assert sites_data["total"] >= 10, f"Expected at least 10 sites, got {sites_data['total']}"
        
        print(f"Verified: {sites_data['total']} satellite sites exist")


# ===================== TRAFFIC & SESSION ENGINE TESTS =====================

class TestTrafficSessionEngine:
    """Traffic & Session Engine - CTR, dwell time, session tracking"""
    
    def test_get_session_stats(self, api_client):
        """GET /api/seo/traffic/session/stats - Get session quality statistics"""
        response = api_client.get(f"{BASE_URL}/api/seo/traffic/session/stats?days=7")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "period_days" in data
        assert "total_sessions" in data
        assert "qualified_sessions" in data
        assert "qualification_rate" in data
        assert "avg_duration_seconds" in data
        assert "avg_scroll_depth" in data
        assert "target_duration" in data
        
        # Target duration should be 30 seconds
        assert data["target_duration"] == 30
        
        print(f"Session stats: total={data['total_sessions']}, qualified={data['qualified_sessions']}, rate={data['qualification_rate']}%")
    
    def test_start_session_tracking(self, api_client):
        """POST /api/seo/traffic/session/start - Start session tracking"""
        import uuid
        session_id = str(uuid.uuid4())
        
        response = api_client.post(
            f"{BASE_URL}/api/seo/traffic/session/start",
            json={
                "session_id": session_id,
                "page_id": "000000000000000000000001",  # Mock page ID
                "url": "https://prohouzing.com/test-page",
                "referrer": "https://google.com"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "session_id" in data
        
        print(f"Session started: {data['session_id']}")
        return session_id
    
    def test_update_session_tracking(self, api_client):
        """POST /api/seo/traffic/session/update - Update session with dwell time"""
        import uuid
        session_id = str(uuid.uuid4())
        
        # First start the session
        api_client.post(
            f"{BASE_URL}/api/seo/traffic/session/start",
            json={
                "session_id": session_id,
                "page_id": "000000000000000000000001",
                "url": "https://prohouzing.com/test-page"
            }
        )
        
        # Update with 35 seconds duration (qualified session)
        response = api_client.post(
            f"{BASE_URL}/api/seo/traffic/session/update",
            json={
                "session_id": session_id,
                "page_id": "000000000000000000000001",
                "duration_seconds": 35,
                "scroll_depth": 80,
                "interactions": 5
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        assert "is_qualified" in data
        assert data["success"] == True
        assert data["is_qualified"] == True  # 35s >= 30s threshold
        
        print(f"Session updated: is_qualified={data['is_qualified']}")
    
    def test_get_related_posts(self, api_client):
        """GET /api/seo/traffic/related-posts/{page_id} - Get related posts for internal linking"""
        # Use a mock page ID (will return empty if page doesn't exist)
        response = api_client.get(f"{BASE_URL}/api/seo/traffic/related-posts/000000000000000000000001")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "related_posts" in data
        
        related = data["related_posts"]
        if len(related) > 0:
            post = related[0]
            assert "id" in post
            assert "title" in post
            assert "slug" in post
        
        print(f"Related posts: {len(related)} posts found")


# ===================== RANK TRACKING ENGINE TESTS =====================

class TestRankTrackingEngine:
    """Rank Tracking Engine - KPI dashboard and rankings"""
    
    def test_get_kpi_dashboard(self, api_client):
        """GET /api/seo/rank/kpi-dashboard - Get SEO KPI dashboard"""
        response = api_client.get(f"{BASE_URL}/api/seo/rank/kpi-dashboard")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify main sections exist
        assert "pages" in data
        assert "keywords" in data
        assert "traffic" in data
        assert "targets" in data
        
        # Verify pages structure
        pages = data["pages"]
        assert "total" in pages
        assert "published" in pages
        
        print(f"KPI Dashboard: pages_total={pages['total']}, pages_published={pages['published']}")
    
    def test_get_top_rankings(self, api_client):
        """GET /api/seo/rank/top-rankings - Get top keyword rankings"""
        response = api_client.get(f"{BASE_URL}/api/seo/rank/top-rankings?limit=20")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "keywords" in data
        
        keywords = data["keywords"]
        if len(keywords) > 0:
            kw = keywords[0]
            assert "keyword" in kw
            assert "position" in kw
            assert "url" in kw
        
        print(f"Top rankings: {len(keywords)} keywords tracked")
    
    def test_get_rankings_summary(self, api_client):
        """GET /api/seo/rank/rankings-summary - Get rankings distribution"""
        response = api_client.get(f"{BASE_URL}/api/seo/rank/rankings-summary")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "distribution" in data
        
        distribution = data["distribution"]
        if len(distribution) > 0:
            item = distribution[0]
            assert "range" in item
            assert "count" in item
        
        print(f"Rankings summary: {len(distribution)} distribution ranges")


# ===================== RUN ALL TESTS =====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
