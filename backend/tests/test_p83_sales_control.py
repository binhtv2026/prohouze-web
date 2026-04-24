"""
P83 - SALES CONTROL SYSTEM Tests
================================
Tests for:
1. Manager Dashboard API (/api/dashboard/manager/overview)
2. SLA Engine APIs (/api/sla/check, /api/sla/stats, /api/sla/bookings/{id}/call-update)
3. Notification Service - Telegram Status (/api/notifications/telegram/status)
4. Authentication with admin credentials

Author: Testing Agent
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@prohouzing.vn"
ADMIN_PASSWORD = "admin123"
TEST_BOOKING_ID = "69bd4a28f661328b67936755"


class TestAuthLogin:
    """Test authentication with admin credentials"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_login_with_admin_credentials(self, api_client):
        """Test login with admin@prohouzing.vn / admin123"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data or "access_token" in data, "No token in response"
        
        # Store token for later tests
        token = data.get("token") or data.get("access_token")
        assert token is not None and len(token) > 0, "Token is empty"
        
        print(f"✅ Login successful with admin@prohouzing.vn")
        return token


class TestManagerDashboard:
    """Test Manager Dashboard API - /api/dashboard/manager/overview"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        """Authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    def test_manager_dashboard_overview_loads(self, api_client):
        """Test /api/dashboard/manager/overview returns 200"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/overview")
        
        assert response.status_code == 200, f"Dashboard failed: {response.status_code} - {response.text}"
        print(f"✅ Manager Dashboard API returns 200")
    
    def test_manager_dashboard_structure(self, api_client):
        """Test dashboard response has correct structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        required_fields = ["hot_leads", "bookings", "sla_status", "sales_performance", "recent_alerts", "metrics", "updated_at"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✅ Dashboard has all required fields: {required_fields}")
    
    def test_manager_dashboard_hot_leads_section(self, api_client):
        """Test hot_leads section structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        hot_leads = data.get("hot_leads", {})
        assert "total" in hot_leads, "hot_leads missing 'total'"
        assert "today" in hot_leads, "hot_leads missing 'today'"
        assert "uncalled" in hot_leads, "hot_leads missing 'uncalled'"
        assert "urgent_list" in hot_leads, "hot_leads missing 'urgent_list'"
        
        # urgent_list should be a list
        assert isinstance(hot_leads["urgent_list"], list), "urgent_list should be array"
        
        print(f"✅ hot_leads section: total={hot_leads['total']}, today={hot_leads['today']}, uncalled={hot_leads['uncalled']}")
    
    def test_manager_dashboard_sla_status_section(self, api_client):
        """Test sla_status section structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        sla_status = data.get("sla_status", {})
        assert "violations_today" in sla_status, "sla_status missing 'violations_today'"
        assert "warnings_today" in sla_status, "sla_status missing 'warnings_today'"
        assert "avg_response_time_minutes" in sla_status, "sla_status missing 'avg_response_time_minutes'"
        assert "sla_target_minutes" in sla_status, "sla_status missing 'sla_target_minutes'"
        
        # SLA target should be 5 minutes
        assert sla_status["sla_target_minutes"] == 5, "SLA target should be 5 minutes"
        
        print(f"✅ sla_status section: violations={sla_status['violations_today']}, warnings={sla_status['warnings_today']}")
    
    def test_manager_dashboard_sales_performance_section(self, api_client):
        """Test sales_performance section structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        sales_performance = data.get("sales_performance", [])
        assert isinstance(sales_performance, list), "sales_performance should be array"
        
        if len(sales_performance) > 0:
            first_sales = sales_performance[0]
            assert "id" in first_sales, "Sales entry missing 'id'"
            assert "name" in first_sales, "Sales entry missing 'name'"
            assert "current_load" in first_sales, "Sales entry missing 'current_load'"
            assert "today_calls" in first_sales, "Sales entry missing 'today_calls'"
            assert "sla_violations" in first_sales, "Sales entry missing 'sla_violations'"
            print(f"✅ sales_performance has {len(sales_performance)} sales users")
        else:
            print(f"⚠️ sales_performance is empty (no active sales users)")
    
    def test_manager_dashboard_metrics_section(self, api_client):
        """Test metrics section structure"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        metrics = data.get("metrics", {})
        assert "total_leads" in metrics, "metrics missing 'total_leads'"
        assert "total_bookings" in metrics, "metrics missing 'total_bookings'"
        assert "sla_compliance_rate" in metrics, "metrics missing 'sla_compliance_rate'"
        
        print(f"✅ metrics: total_leads={metrics['total_leads']}, total_bookings={metrics['total_bookings']}, sla_compliance={metrics['sla_compliance_rate']}%")


class TestSLAEngine:
    """Test SLA Engine APIs"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        """Authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    def test_sla_check_triggers(self, api_client):
        """Test /api/sla/check triggers SLA check"""
        response = api_client.post(f"{BASE_URL}/api/sla/check")
        
        assert response.status_code == 200, f"SLA check failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "total_checked" in data, "Response missing 'total_checked'"
        assert "warnings_sent" in data, "Response missing 'warnings_sent'"
        assert "violations_found" in data, "Response missing 'violations_found'"
        assert "reassignments_made" in data, "Response missing 'reassignments_made'"
        
        print(f"✅ SLA check: checked={data['total_checked']}, warnings={data['warnings_sent']}, violations={data['violations_found']}")
    
    def test_sla_stats_returns_statistics(self, api_client):
        """Test /api/sla/stats returns statistics"""
        response = api_client.get(f"{BASE_URL}/api/sla/stats")
        
        assert response.status_code == 200, f"SLA stats failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "today" in data, "Response missing 'today'"
        assert "response_times" in data, "Response missing 'response_times'"
        assert "sla_config" in data, "Response missing 'sla_config'"
        
        today = data["today"]
        assert "total_alerts" in today, "today missing 'total_alerts'"
        assert "violations" in today, "today missing 'violations'"
        assert "pending_hot_leads" in today, "today missing 'pending_hot_leads'"
        
        print(f"✅ SLA stats: alerts_today={today['total_alerts']}, violations={today['violations']}")
    
    def test_sla_alerts_list(self, api_client):
        """Test /api/sla/alerts returns alerts list"""
        response = api_client.get(f"{BASE_URL}/api/sla/alerts")
        
        assert response.status_code == 200, f"SLA alerts failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "alerts" in data, "Response missing 'alerts'"
        assert "total" in data, "Response missing 'total'"
        assert isinstance(data["alerts"], list), "alerts should be array"
        
        print(f"✅ SLA alerts: {len(data['alerts'])} alerts returned")
    
    def test_sla_call_update_with_valid_booking(self, api_client):
        """Test /api/sla/bookings/{id}/call-update updates call status"""
        response = api_client.post(f"{BASE_URL}/api/sla/bookings/{TEST_BOOKING_ID}/call-update", json={
            "status": "called",
            "note": "Test call update from pytest"
        })
        
        # Could be 200 (success) or 404 (booking not found) - both are valid API responses
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code} - {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Response should indicate success"
            print(f"✅ Call status updated for booking {TEST_BOOKING_ID}")
        else:
            print(f"⚠️ Booking {TEST_BOOKING_ID} not found (expected if test data not seeded)")
    
    def test_sla_config_values(self, api_client):
        """Test SLA configuration values"""
        response = api_client.get(f"{BASE_URL}/api/sla/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        sla_config = data.get("sla_config", {})
        assert sla_config.get("hot_lead_call_time_minutes") == 5, "HOT lead call time should be 5 minutes"
        assert sla_config.get("warning_time_minutes") == 3, "Warning time should be 3 minutes"
        assert sla_config.get("reassign_time_minutes") == 10, "Reassign time should be 10 minutes"
        
        print(f"✅ SLA Config: call_time=5m, warning=3m, reassign=10m")


class TestNotificationService:
    """Test Notification Service - Telegram Status"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        """Authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    def test_telegram_status_endpoint(self, api_client):
        """Test /api/notifications/telegram/status returns config status"""
        response = api_client.get(f"{BASE_URL}/api/notifications/telegram/status")
        
        assert response.status_code == 200, f"Telegram status failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "configured" in data, "Response missing 'configured'"
        assert "bot_token_set" in data, "Response missing 'bot_token_set'"
        assert "chat_id_set" in data, "Response missing 'chat_id_set'"
        assert "message" in data, "Response missing 'message'"
        
        print(f"✅ Telegram status: configured={data['configured']}, message='{data['message']}'")
    
    def test_notification_stats(self, api_client):
        """Test /api/notifications/stats returns statistics"""
        response = api_client.get(f"{BASE_URL}/api/notifications/stats")
        
        assert response.status_code == 200, f"Notification stats failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "total" in data, "Response missing 'total'"
        assert "unread" in data, "Response missing 'unread'"
        
        print(f"✅ Notification stats: total={data['total']}, unread={data['unread']}")
    
    def test_notification_list(self, api_client):
        """Test /api/notifications/list returns notifications"""
        response = api_client.get(f"{BASE_URL}/api/notifications/list")
        
        assert response.status_code == 200, f"Notification list failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response missing 'notifications'"
        assert "unread_count" in data, "Response missing 'unread_count'"
        assert isinstance(data["notifications"], list), "notifications should be array"
        
        print(f"✅ Notification list: {len(data['notifications'])} notifications, {data['unread_count']} unread")


class TestHotLeadDetailEndpoint:
    """Test HOT Lead Detail endpoint for Manager Dashboard"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        """Authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {auth_token}"
        })
        return session
    
    def test_hot_leads_detail_endpoint(self, api_client):
        """Test /api/dashboard/manager/hot-leads returns detailed list"""
        response = api_client.get(f"{BASE_URL}/api/dashboard/manager/hot-leads")
        
        assert response.status_code == 200, f"Hot leads detail failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "total" in data, "Response missing 'total'"
        assert "items" in data, "Response missing 'items'"
        assert isinstance(data["items"], list), "items should be array"
        
        print(f"✅ Hot leads detail: {data['total']} total leads")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
