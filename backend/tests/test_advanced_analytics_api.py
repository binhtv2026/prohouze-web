"""
Advanced Analytics API Test Suite - Prompt 16/20 FINAL FIX
Tests for Production-Ready Analytics Engine Extensions

Features tested:
1. Drill-down Engine - GET /api/analytics/drilldown
2. Funnel Analytics - GET /api/analytics/funnel (lead/deal)
3. Bottleneck Analytics - GET /api/analytics/bottlenecks
4. Saved Views - POST/GET/DELETE /api/analytics/views
5. Export Engine - GET /api/analytics/export/{metric_code}
6. Metric Governance - GET /api/analytics/governance/metrics, validate
"""

import pytest
import requests
import os
import uuid

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


class TestAdvancedAnalyticsAuth:
    """Authentication for Advanced Analytics API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        token = data.get("access_token")
        assert token, "No access_token in response"
        return token
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {auth_token}"}


class TestDrilldownEngine(TestAdvancedAnalyticsAuth):
    """Test /api/analytics/drilldown endpoint"""
    
    def test_drilldown_lead_001(self, auth_headers):
        """GET /api/analytics/drilldown?metric_code=LEAD_001 - should return raw records with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/drilldown",
            params={"metric_code": "LEAD_001"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check response structure
        assert data["success"] is True
        result = data["data"]
        
        # Check drilldown structure
        assert result["metric_code"] == "LEAD_001"
        assert "metric_name" in result
        assert "metric_description" in result
        assert "source_collection" in result
        assert "total_count" in result
        assert "numerator" in result
        assert "denominator" in result  # Can be None for non-ratio metrics
        assert "records" in result
        assert "page" in result
        assert "page_size" in result
        assert "total_pages" in result
        assert "period" in result
        
        # Check pagination defaults
        assert result["page"] == 1
        assert result["page_size"] == 50
    
    def test_drilldown_with_pagination(self, auth_headers):
        """GET /api/analytics/drilldown with page and page_size params"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/drilldown",
            params={"metric_code": "LEAD_001", "page": 1, "page_size": 10},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        result = data["data"]
        assert result["page_size"] == 10
    
    def test_drilldown_sales_001(self, auth_headers):
        """GET /api/analytics/drilldown?metric_code=SALES_001"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/drilldown",
            params={"metric_code": "SALES_001"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["data"]["metric_code"] == "SALES_001"
    
    def test_drilldown_invalid_metric(self, auth_headers):
        """GET /api/analytics/drilldown with invalid metric_code - should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/drilldown",
            params={"metric_code": "INVALID_METRIC"},
            headers=auth_headers
        )
        assert response.status_code == 404


class TestFunnelAnalytics(TestAdvancedAnalyticsAuth):
    """Test /api/analytics/funnel endpoint"""
    
    def test_lead_funnel(self, auth_headers):
        """GET /api/analytics/funnel?funnel_type=lead - should return lead funnel stages with conversion rates"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/funnel",
            params={"funnel_type": "lead"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        funnel = data["data"]
        
        # Check lead funnel structure
        assert funnel["funnel_type"] == "lead"
        assert "total_entries" in funnel
        assert "total_conversions" in funnel
        assert "overall_conversion_rate" in funnel
        assert "stages" in funnel
        
        # Lead funnel should have 10 stages
        stages = funnel["stages"]
        assert len(stages) == 10, f"Expected 10 lead stages, got {len(stages)}"
        
        # Check stage structure
        first_stage = stages[0]
        assert "stage_code" in first_stage
        assert "stage_name" in first_stage
        assert "order" in first_stage
        assert "count" in first_stage
        assert "percent_of_total" in first_stage
        assert "conversion_rate_to_next" in first_stage
        assert "drop_off_rate" in first_stage
        assert "avg_time_in_stage_days" in first_stage
    
    def test_deal_funnel(self, auth_headers):
        """GET /api/analytics/funnel?funnel_type=deal - should return deal pipeline funnel"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/funnel",
            params={"funnel_type": "deal"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        funnel = data["data"]
        
        # Check deal funnel structure
        assert funnel["funnel_type"] == "deal"
        assert "total_entries" in funnel
        assert "total_conversions" in funnel
        assert "overall_conversion_rate" in funnel
        assert "total_pipeline_value" in funnel  # Deal funnel has pipeline value
        assert "stages" in funnel
        
        # Deal pipeline should have 7 stages
        stages = funnel["stages"]
        assert len(stages) == 7, f"Expected 7 deal stages, got {len(stages)}"
        
        # Deal stages should have total_value
        first_stage = stages[0]
        assert "total_value" in first_stage
    
    def test_funnel_with_period(self, auth_headers):
        """GET /api/analytics/funnel with period_type"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/funnel",
            params={"funnel_type": "lead", "period_type": "this_year"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["metadata"]["filters_applied"]["period_type"] == "this_year"
    
    def test_funnel_stages_endpoint(self, auth_headers):
        """GET /api/analytics/funnel/stages - get stage definitions"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/funnel/stages",
            params={"funnel_type": "lead"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["data"]["funnel_type"] == "lead"
        assert "stages" in data["data"]
        assert len(data["data"]["stages"]) == 10


class TestBottleneckAnalytics(TestAdvancedAnalyticsAuth):
    """Test /api/analytics/bottlenecks endpoint"""
    
    def test_get_bottlenecks(self, auth_headers):
        """GET /api/analytics/bottlenecks - should return stale_deals, overdue_followups, pending_contracts, expiring_bookings, unassigned_leads"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/bottlenecks",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        bottlenecks = data["data"]
        
        # Check summary
        assert "summary" in bottlenecks
        summary = bottlenecks["summary"]
        assert "total_bottlenecks" in summary
        assert "severity" in summary
        assert summary["severity"] in ["critical", "warning", "normal"]
        
        # Check stale_deals
        assert "stale_deals" in bottlenecks
        stale = bottlenecks["stale_deals"]
        assert "count" in stale
        assert "threshold_days" in stale
        assert stale["threshold_days"] == 7
        assert "severity" in stale
        assert "items" in stale
        
        # Check overdue_followups
        assert "overdue_followups" in bottlenecks
        overdue = bottlenecks["overdue_followups"]
        assert "count" in overdue
        assert "severity" in overdue
        assert "items" in overdue
        
        # Check pending_contracts
        assert "pending_contracts" in bottlenecks
        pending = bottlenecks["pending_contracts"]
        assert "count" in pending
        assert "severity" in pending
        assert "items" in pending
        
        # Check expiring_bookings
        assert "expiring_bookings" in bottlenecks
        expiring = bottlenecks["expiring_bookings"]
        assert "count" in expiring
        assert "expiry_days" in expiring
        assert expiring["expiry_days"] == 3
        assert "severity" in expiring
        assert "items" in expiring
        
        # Check unassigned_leads
        assert "unassigned_leads" in bottlenecks
        unassigned = bottlenecks["unassigned_leads"]
        assert "count" in unassigned
        assert "severity" in unassigned
        assert "items" in unassigned
        
        # Check generated_at timestamp
        assert "generated_at" in bottlenecks


class TestSavedViews(TestAdvancedAnalyticsAuth):
    """Test /api/analytics/views endpoints"""
    
    @pytest.fixture(scope="class")
    def test_view_data(self):
        """Test view data for CRUD"""
        return {
            "name": f"TEST_View_{uuid.uuid4().hex[:8]}",
            "report_type": "lead_report",
            "filters": {"period_type": "this_month", "source": "facebook"},
            "columns": ["name", "email", "stage", "source"],
            "sort_by": "created_at",
            "sort_order": "desc",
            "is_default": False,
            "is_shared": False
        }
    
    def test_save_view(self, auth_headers, test_view_data):
        """POST /api/analytics/views - should save report view"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/views",
            json=test_view_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        view = data["data"]
        
        # Check saved view structure
        assert "id" in view
        assert view["name"] == test_view_data["name"]
        assert view["report_type"] == test_view_data["report_type"]
        assert view["filters"] == test_view_data["filters"]
        assert view["columns"] == test_view_data["columns"]
        assert "created_at" in view
        assert "updated_at" in view
        
        # Store view_id for cleanup
        TestSavedViews._created_view_id = view["id"]
    
    def test_get_views(self, auth_headers):
        """GET /api/analytics/views - should list saved views"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/views",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        views = data["data"]
        
        # Should be a list (may be empty or contain views)
        assert isinstance(views, list)
    
    def test_get_views_by_report_type(self, auth_headers):
        """GET /api/analytics/views?report_type=lead_report"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/views",
            params={"report_type": "lead_report"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
    
    def test_get_default_view(self, auth_headers):
        """GET /api/analytics/views/default - get default view for report type"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/views/default",
            params={"report_type": "lead_report"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        # Data can be None if no default view set
    
    def test_delete_view(self, auth_headers):
        """DELETE /api/analytics/views/{view_id}"""
        view_id = getattr(TestSavedViews, '_created_view_id', None)
        if not view_id:
            pytest.skip("No view created to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/analytics/views/{view_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        assert data["data"]["deleted"] is True


class TestExportEngine(TestAdvancedAnalyticsAuth):
    """Test /api/analytics/export/* endpoints"""
    
    def test_export_lead_001(self, auth_headers):
        """GET /api/analytics/export/LEAD_001 - should return CSV export data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export/LEAD_001",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        export = data["data"]
        
        # Check export structure
        assert export["format"] == "csv"
        assert "filename" in export
        assert "LEAD_001" in export["filename"]
        assert ".csv" in export["filename"]
        assert "content" in export
        assert "row_count" in export
        assert isinstance(export["row_count"], int)
    
    def test_export_with_period(self, auth_headers):
        """GET /api/analytics/export/SALES_001 with period_type"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export/SALES_001",
            params={"period_type": "this_year"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        # Period is included in data when there are records, or None
        export = data["data"]
        assert "format" in export
        assert export["format"] == "csv"
    
    def test_export_invalid_metric(self, auth_headers):
        """GET /api/analytics/export/INVALID_METRIC - should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export/INVALID_METRIC",
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_export_report(self, auth_headers):
        """GET /api/analytics/export/report/{report_type}"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/export/report/conversion",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["data"]["report_type"] == "conversion"


class TestMetricGovernance(TestAdvancedAnalyticsAuth):
    """Test /api/analytics/governance/* endpoints"""
    
    def test_get_governance_metrics(self, auth_headers):
        """GET /api/analytics/governance/metrics - should return 31 metrics with governance info"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/governance/metrics",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        governance = data["data"]
        
        # Check governance structure
        assert "total_metrics" in governance
        assert governance["total_metrics"] == 31, f"Expected 31 metrics, got {governance['total_metrics']}"
        assert "metrics" in governance
        assert "registry_version" in governance
        
        # Check metric governance info
        metrics = governance["metrics"]
        assert len(metrics) == 31
        
        first_metric = metrics[0]
        assert "code" in first_metric
        assert "name" in first_metric
        assert "category" in first_metric
        assert "data_type" in first_metric
        assert "aggregation" in first_metric
        assert "source" in first_metric
        assert "version" in first_metric
        assert "is_key_metric" in first_metric
    
    def test_validate_valid_metric(self, auth_headers):
        """GET /api/analytics/governance/validate/LEAD_001 - should return is_valid=true"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/governance/validate/LEAD_001",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["success"] is True
        validation = data["data"]
        
        assert validation["metric_code"] == "LEAD_001"
        assert validation["is_valid"] is True
        assert validation["version"] is not None
    
    def test_validate_invalid_metric(self, auth_headers):
        """GET /api/analytics/governance/validate/INVALID - should return is_valid=false"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/governance/validate/INVALID_METRIC",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        validation = data["data"]
        
        assert validation["metric_code"] == "INVALID_METRIC"
        assert validation["is_valid"] is False
        assert validation["version"] is None


class TestAdvancedAnalyticsUnauthorized:
    """Test unauthorized access to advanced analytics"""
    
    def test_drilldown_requires_auth(self):
        """Drilldown endpoint should require authentication"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/drilldown",
            params={"metric_code": "LEAD_001"}
        )
        assert response.status_code in [401, 403]
    
    def test_funnel_requires_auth(self):
        """Funnel endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/funnel")
        assert response.status_code in [401, 403]
    
    def test_bottlenecks_requires_auth(self):
        """Bottlenecks endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/bottlenecks")
        assert response.status_code in [401, 403]
    
    def test_governance_requires_auth(self):
        """Governance endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/governance/metrics")
        assert response.status_code in [401, 403]


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
