"""
Analytics API Test Suite - Prompt 16/20
Tests for Advanced Reports & Analytics Engine

Features tested:
- Config APIs: metric definitions, categories, periods, reports
- Metric APIs: single metric, batch metrics, trend, breakdown, timeseries
- Dashboard APIs: executive dashboard, key metrics
- Report APIs: conversion report, pipeline report
- Calculated metrics: conversion rate, win rate
"""

import pytest
import requests
import os

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


class TestAnalyticsAuth:
    """Authentication for Analytics API tests"""
    
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


class TestAnalyticsConfigAPIs(TestAnalyticsAuth):
    """Test /api/analytics/config/* endpoints"""
    
    def test_get_metric_definitions(self, auth_headers):
        """GET /api/analytics/config/metrics - should return 31 metric definitions"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/config/metrics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert data["success"] is True
        assert "data" in data
        assert "metadata" in data
        
        # Check we have 31 metrics (as per METRIC_REGISTRY)
        metrics = data["data"]
        assert len(metrics) == 31, f"Expected 31 metrics, got {len(metrics)}"
        
        # Check metric structure
        first_metric = metrics[0]
        assert "code" in first_metric
        assert "name" in first_metric
        assert "name_en" in first_metric
        assert "category" in first_metric
        assert "data_type" in first_metric
        assert "is_key_metric" in first_metric
        assert "supports_trend" in first_metric
        assert "supports_comparison" in first_metric
        assert "description" in first_metric
        
        # Check specific metrics exist
        metric_codes = [m["code"] for m in metrics]
        assert "LEAD_001" in metric_codes, "LEAD_001 not found"
        assert "SALES_001" in metric_codes, "SALES_001 not found"
        assert "REV_001" in metric_codes, "REV_001 not found"
    
    def test_get_metric_definitions_by_category(self, auth_headers):
        """GET /api/analytics/config/metrics?category=lead"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/config/metrics",
            params={"category": "lead"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        metrics = data["data"]
        # All returned metrics should be in lead category
        for m in metrics:
            assert m["category"] == "lead"
    
    def test_get_categories(self, auth_headers):
        """GET /api/analytics/config/categories - should return 10 categories"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/config/categories",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        categories = data["data"]
        assert len(categories) == 10, f"Expected 10 categories, got {len(categories)}"
        
        # Check category structure
        first_cat = categories[0]
        assert "code" in first_cat
        assert "label" in first_cat
        assert "count" in first_cat
    
    def test_get_periods(self, auth_headers):
        """GET /api/analytics/config/periods"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/config/periods",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        periods = data["data"]
        assert len(periods) > 0
        
        # Check period structure
        period_codes = [p["code"] for p in periods]
        assert "this_month" in period_codes
        assert "this_year" in period_codes
    
    def test_get_report_definitions(self, auth_headers):
        """GET /api/analytics/config/reports"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/config/reports",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        reports = data["data"]
        assert len(reports) > 0
        
        # Check report structure
        first_report = reports[0]
        assert "code" in first_report
        assert "name" in first_report
        assert "category" in first_report
        assert "report_type" in first_report


class TestAnalyticsMetricAPIs(TestAnalyticsAuth):
    """Test /api/analytics/metrics/* endpoints"""
    
    def test_get_single_metric_lead_001(self, auth_headers):
        """GET /api/analytics/metrics/LEAD_001 - should return metric with value, formatted_value, period"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/LEAD_001",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        metric = data["data"]
        
        # Check required fields
        assert metric["metric_code"] == "LEAD_001"
        assert "metric_name" in metric
        assert "value" in metric
        assert "formatted_value" in metric
        assert "data_type" in metric
        assert "period" in metric
        
        # Period should have start_date, end_date, label
        period = metric["period"]
        assert "start_date" in period
        assert "end_date" in period
        assert "label" in period
    
    def test_get_metric_with_comparison(self, auth_headers):
        """GET /api/analytics/metrics/LEAD_001?compare=true - should include trend and change_percent"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/LEAD_001",
            params={"compare": "true"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        metric = data["data"]
        
        # With compare=true, should have trend fields
        # Note: trend may be None if no previous data, but fields should exist
        assert "trend" in metric
        assert "change_percent" in metric
        assert "previous_value" in metric
    
    def test_get_metric_not_found(self, auth_headers):
        """GET /api/analytics/metrics/INVALID_CODE - should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/INVALID_METRIC_CODE",
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_batch_metrics(self, auth_headers):
        """POST /api/analytics/metrics/batch with [LEAD_001, SALES_001] - should return multiple metrics"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/metrics/batch",
            json=["LEAD_001", "SALES_001"],
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        metrics = data["data"]
        
        assert len(metrics) == 2, f"Expected 2 metrics, got {len(metrics)}"
        metric_codes = [m["metric_code"] for m in metrics]
        assert "LEAD_001" in metric_codes
        assert "SALES_001" in metric_codes
    
    def test_batch_metrics_with_params(self, auth_headers):
        """POST /api/analytics/metrics/batch with period_type and compare"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/metrics/batch",
            json=["REV_001", "REV_002"],
            params={"period_type": "this_year", "compare": "true"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        metrics = data["data"]
        assert len(metrics) == 2
    
    def test_get_metric_trend(self, auth_headers):
        """GET /api/analytics/metrics/LEAD_001/trend"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/LEAD_001/trend",
            params={"periods": 6},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        trend_data = data["data"]
        
        # Check trend structure
        assert "current" in trend_data
        assert "history" in trend_data
        assert "trend_direction" in trend_data
        assert "trend_strength" in trend_data
    
    def test_get_metric_breakdown(self, auth_headers):
        """GET /api/analytics/metrics/LEAD_001/breakdown/stage"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/LEAD_001/breakdown/stage",
            params={"limit": 10},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        breakdown = data["data"]
        
        # Check breakdown structure
        assert breakdown["metric_code"] == "LEAD_001"
        assert breakdown["dimension"] == "stage"
        assert "total" in breakdown
        assert "items" in breakdown
    
    def test_get_metric_timeseries(self, auth_headers):
        """GET /api/analytics/metrics/REV_002/timeseries"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/REV_002/timeseries",
            params={"granularity": "day", "period_type": "this_month"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        timeseries = data["data"]
        
        # Check timeseries structure
        assert timeseries["metric_code"] == "REV_002"
        assert timeseries["granularity"] == "day"
        assert "data_points" in timeseries
        assert "total" in timeseries
        assert "average" in timeseries


class TestAnalyticsDashboardAPIs(TestAnalyticsAuth):
    """Test /api/analytics/dashboards/* endpoints"""
    
    def test_get_key_metrics_dashboard(self, auth_headers):
        """GET /api/analytics/dashboards/key-metrics - should return key metrics"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboards/key-metrics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        metrics = data["data"]
        
        # Key metrics should be returned
        assert len(metrics) > 0, "Should return at least some key metrics"
        
        # All returned should be key metrics
        for m in metrics:
            assert "metric_code" in m
            assert "value" in m
            assert "formatted_value" in m
    
    def test_get_key_metrics_with_comparison(self, auth_headers):
        """GET /api/analytics/dashboards/key-metrics?compare=true"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboards/key-metrics",
            params={"compare": "true"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "metadata" in data
        assert "period" in data["metadata"]
    
    def test_get_executive_dashboard(self, auth_headers):
        """GET /api/analytics/dashboards/executive"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboards/executive",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        dashboard = data["data"]
        
        # Check executive dashboard structure
        assert "key_metrics" in dashboard
        assert "revenue_trend" in dashboard
        assert "lead_funnel" in dashboard
        assert "recent_deals" in dashboard


class TestAnalyticsReportAPIs(TestAnalyticsAuth):
    """Test /api/analytics/reports/* endpoints"""
    
    def test_get_conversion_report(self, auth_headers):
        """GET /api/analytics/reports/conversion - should return conversion data"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/reports/conversion",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        report = data["data"]
        
        # Check conversion report structure
        assert "total_leads" in report
        assert "conversion_rate" in report
        assert "funnel" in report
        
        # Funnel should have breakdown structure
        funnel = report["funnel"]
        assert "metric_code" in funnel
        assert "dimension" in funnel
        assert "items" in funnel
    
    def test_get_pipeline_report(self, auth_headers):
        """GET /api/analytics/reports/pipeline"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/reports/pipeline",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        report = data["data"]
        
        # Check pipeline report structure
        assert "metrics" in report
        assert "by_stage" in report


class TestAnalyticsCalculatedMetrics(TestAnalyticsAuth):
    """Test /api/analytics/calculated/* endpoints"""
    
    def test_get_conversion_rate(self, auth_headers):
        """GET /api/analytics/calculated/conversion-rate"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/calculated/conversion-rate",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "conversion_rate" in data["data"]
        
        # Rate should be a number (0-100)
        rate = data["data"]["conversion_rate"]
        assert isinstance(rate, (int, float))
        assert 0 <= rate <= 100
    
    def test_get_win_rate(self, auth_headers):
        """GET /api/analytics/calculated/win-rate"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/calculated/win-rate",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "win_rate" in data["data"]
        
        # Rate should be a number (0-100)
        rate = data["data"]["win_rate"]
        assert isinstance(rate, (int, float))
        assert 0 <= rate <= 100


class TestAnalyticsMetadataAndResponse(TestAnalyticsAuth):
    """Test response metadata and structure"""
    
    def test_response_has_metadata(self, auth_headers):
        """All responses should have proper metadata"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/config/metrics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check metadata structure
        metadata = data["metadata"]
        assert "request_id" in metadata
        assert "timestamp" in metadata
    
    def test_metric_response_has_period_info(self, auth_headers):
        """Metric responses should include period information"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/metrics/LEAD_001",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Period should be in metadata or data
        metric = data["data"]
        assert metric["period"] is not None
        
        period = metric["period"]
        assert "start_date" in period
        assert "end_date" in period
        assert "period_type" in period
        assert "label" in period


class TestAnalyticsUnauthorized:
    """Test unauthorized access"""
    
    def test_metrics_requires_auth(self):
        """Metrics endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/config/metrics")
        assert response.status_code in [401, 403]
    
    def test_dashboards_requires_auth(self):
        """Dashboards endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboards/key-metrics")
        assert response.status_code in [401, 403]


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
