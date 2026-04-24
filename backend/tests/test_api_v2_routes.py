"""
ProHouzing API v2 Routes Test Suite
Version: 1.0.0

Tests to verify API v2 endpoints are loaded and responding correctly.
Focus: Route registration, authentication enforcement, import chain verification.
"""

import pytest
import requests
import os
import sys

# Add backend to path for imports
sys.path.insert(0, '/app/backend')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com').rstrip('/')


class TestAPIv2RouteRegistration:
    """Test that all v2 routes are registered and accessible"""
    
    def test_import_api_v2_router(self):
        """Test that api_v2_router can be imported"""
        from core.routes import api_v2_router
        assert api_v2_router is not None
        assert hasattr(api_v2_router, 'routes')
    
    def test_import_all_services(self):
        """Test that all 6 v2 services can be imported"""
        from core.services import (
            customer_service, lead_service, deal_service,
            booking_service, contract_service, payment_service
        )
        assert customer_service is not None
        assert lead_service is not None
        assert deal_service is not None
        assert booking_service is not None
        assert contract_service is not None
        assert payment_service is not None
    
    def test_import_dependencies(self):
        """Test that auth dependencies can be imported"""
        from core.dependencies import CurrentUser, get_current_user, require_permission
        assert CurrentUser is not None
        assert get_current_user is not None
        assert require_permission is not None


class TestCustomerEndpoints:
    """Test Customer API v2 endpoints"""
    
    def test_list_customers_requires_auth(self):
        """GET /api/v2/customers requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/customers")
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data.get("detail", "")
    
    def test_get_customer_requires_auth(self):
        """GET /api/v2/customers/{id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/customers/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403
    
    def test_search_by_phone_requires_auth(self):
        """GET /api/v2/customers/search/by-phone requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/customers/search/by-phone?phone=0901234567")
        assert response.status_code == 403


class TestLeadEndpoints:
    """Test Lead API v2 endpoints"""
    
    def test_list_leads_requires_auth(self):
        """GET /api/v2/leads requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/leads")
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data.get("detail", "")
    
    def test_get_lead_requires_auth(self):
        """GET /api/v2/leads/{id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/leads/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403
    
    def test_leads_by_status_requires_auth(self):
        """GET /api/v2/leads/by-status/{status} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/leads/by-status/new")
        assert response.status_code == 403


class TestDealEndpoints:
    """Test Deal API v2 endpoints"""
    
    def test_list_deals_requires_auth(self):
        """GET /api/v2/deals requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/deals")
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data.get("detail", "")
    
    def test_get_deal_requires_auth(self):
        """GET /api/v2/deals/{id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/deals/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403
    
    def test_pipeline_view_requires_auth(self):
        """GET /api/v2/deals/pipeline/view requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/deals/pipeline/view")
        assert response.status_code == 403
    
    def test_pipeline_stats_requires_auth(self):
        """GET /api/v2/deals/pipeline/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/deals/pipeline/stats")
        assert response.status_code == 403


class TestBookingEndpoints:
    """Test Booking API v2 endpoints"""
    
    def test_list_bookings_requires_auth(self):
        """GET /api/v2/bookings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/bookings")
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data.get("detail", "")
    
    def test_get_booking_requires_auth(self):
        """GET /api/v2/bookings/{id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/bookings/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403


class TestContractEndpoints:
    """Test Contract API v2 endpoints"""
    
    def test_list_contracts_requires_auth(self):
        """GET /api/v2/contracts requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/contracts")
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data.get("detail", "")
    
    def test_get_contract_requires_auth(self):
        """GET /api/v2/contracts/{id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/contracts/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403
    
    def test_contract_by_deal_requires_auth(self):
        """GET /api/v2/contracts/by-deal/{deal_id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/contracts/by-deal/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403


class TestPaymentEndpoints:
    """Test Payment API v2 endpoints"""
    
    def test_list_payments_requires_auth(self):
        """GET /api/v2/payments requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/payments")
        assert response.status_code == 403
        data = response.json()
        assert "Not authenticated" in data.get("detail", "")
    
    def test_get_payment_requires_auth(self):
        """GET /api/v2/payments/{id} requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/payments/00000000-0000-0000-0000-000000000001")
        assert response.status_code == 403
    
    def test_payment_report_overdue_requires_auth(self):
        """GET /api/v2/payments/report/overdue requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/payments/report/overdue")
        assert response.status_code == 403
    
    def test_payment_report_upcoming_requires_auth(self):
        """GET /api/v2/payments/report/upcoming requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v2/payments/report/upcoming")
        assert response.status_code == 403


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "version" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
