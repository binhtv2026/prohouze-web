#!/usr/bin/env python3
"""
PostgreSQL API v2 Tests
======================
Tests API v2 endpoints connected to PostgreSQL database.
Verifies: leads, deals, customers endpoints work with PostgreSQL data.
"""

import pytest
import requests
import os

# Get base URL from environment - DO NOT use localhost
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://content-machine-18.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_session():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_session):
    """Get authentication token"""
    response = api_session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, f"No access_token in response: {data}"
    return data["access_token"]


@pytest.fixture(scope="module")
def authenticated_session(api_session, auth_token):
    """Session with auth header"""
    api_session.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_session


class TestHealthCheck:
    """Health endpoint tests"""
    
    def test_health_endpoint(self, api_session):
        """Test /api/health returns 200"""
        response = api_session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication tests"""
    
    def test_login_success(self, api_session):
        """Test login with valid credentials"""
        response = api_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login success for: {data['user']['email']}")
    
    def test_login_invalid_credentials(self, api_session):
        """Test login with invalid credentials returns 401"""
        response = api_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code in [401, 400, 404]
        print(f"✓ Invalid login correctly rejected with status {response.status_code}")


class TestLeadsAPIv2:
    """Leads API v2 tests - PostgreSQL"""
    
    def test_get_leads_list(self, authenticated_session):
        """Test GET /api/v2/leads returns data from PostgreSQL"""
        response = authenticated_session.get(f"{BASE_URL}/api/v2/leads?limit=10")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        assert "data" in data, "No 'data' field in response"
        assert "meta" in data, "No 'meta' field in response"
        
        leads = data["data"]
        assert isinstance(leads, list), "Data should be a list"
        
        # Verify PostgreSQL data structure
        if len(leads) > 0:
            lead = leads[0]
            # These fields should be present from PostgreSQL schema
            assert "id" in lead, "Missing id field"
            assert "lead_code" in lead, "Missing lead_code (PostgreSQL field)"
            assert "contact_name" in lead, "Missing contact_name"
            assert "lead_status" in lead, "Missing lead_status"
            print(f"✓ Leads API v2 returned {len(leads)} leads with PostgreSQL schema")
        
        # Verify meta pagination
        meta = data["meta"]
        assert "total" in meta, "Missing total in meta"
        print(f"✓ Total leads in PostgreSQL: {meta['total']}")
    
    def test_get_single_lead(self, authenticated_session):
        """Test GET /api/v2/leads/:id returns lead details"""
        # First get a lead ID
        list_response = authenticated_session.get(f"{BASE_URL}/api/v2/leads?limit=1")
        assert list_response.status_code == 200
        leads_data = list_response.json()
        
        if leads_data["data"]:
            lead_id = leads_data["data"][0]["id"]
            
            # Get single lead
            response = authenticated_session.get(f"{BASE_URL}/api/v2/leads/{lead_id}")
            assert response.status_code == 200, f"Failed to get lead: {response.text}"
            
            data = response.json()
            lead = data.get("data", data)
            assert lead["id"] == lead_id
            print(f"✓ Single lead retrieved: {lead.get('contact_name', 'N/A')}")


class TestDealsAPIv2:
    """Deals API v2 tests - PostgreSQL"""
    
    def test_get_deals_list(self, authenticated_session):
        """Test GET /api/v2/deals returns data from PostgreSQL"""
        response = authenticated_session.get(f"{BASE_URL}/api/v2/deals?limit=10")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        assert "data" in data, "No 'data' field in response"
        
        deals = data["data"]
        assert isinstance(deals, list), "Data should be a list"
        
        # Verify PostgreSQL data structure
        if len(deals) > 0:
            deal = deals[0]
            # These fields should be present from PostgreSQL schema
            assert "id" in deal, "Missing id field"
            assert "deal_code" in deal, "Missing deal_code (PostgreSQL field)"
            assert "deal_name" in deal, "Missing deal_name"
            assert "current_stage" in deal, "Missing current_stage"
            assert "deal_value" in deal, "Missing deal_value"
            print(f"✓ Deals API v2 returned {len(deals)} deals with PostgreSQL schema")
        
        # Verify meta pagination
        meta = data["meta"]
        assert "total" in meta, "Missing total in meta"
        print(f"✓ Total deals in PostgreSQL: {meta['total']}")
    
    def test_get_single_deal(self, authenticated_session):
        """Test GET /api/v2/deals/:id returns deal details"""
        # First get a deal ID
        list_response = authenticated_session.get(f"{BASE_URL}/api/v2/deals?limit=1")
        assert list_response.status_code == 200
        deals_data = list_response.json()
        
        if deals_data["data"]:
            deal_id = deals_data["data"][0]["id"]
            
            # Get single deal
            response = authenticated_session.get(f"{BASE_URL}/api/v2/deals/{deal_id}")
            assert response.status_code == 200, f"Failed to get deal: {response.text}"
            
            data = response.json()
            deal = data.get("data", data)
            assert deal["id"] == deal_id
            print(f"✓ Single deal retrieved: {deal.get('deal_name', 'N/A')}")


class TestCustomersAPIv2:
    """Customers API v2 tests - PostgreSQL"""
    
    def test_get_customers_list(self, authenticated_session):
        """Test GET /api/v2/customers returns data from PostgreSQL"""
        response = authenticated_session.get(f"{BASE_URL}/api/v2/customers?limit=10")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        assert "data" in data, "No 'data' field in response"
        
        customers = data["data"]
        assert isinstance(customers, list), "Data should be a list"
        
        # Verify PostgreSQL data structure
        if len(customers) > 0:
            customer = customers[0]
            # These fields should be present from PostgreSQL schema
            assert "id" in customer, "Missing id field"
            assert "customer_code" in customer, "Missing customer_code (PostgreSQL field)"
            assert "full_name" in customer, "Missing full_name"
            print(f"✓ Customers API v2 returned {len(customers)} customers with PostgreSQL schema")
        
        # Verify meta pagination
        meta = data["meta"]
        assert "total" in meta, "Missing total in meta"
        print(f"✓ Total customers in PostgreSQL: {meta['total']}")


class TestDatabaseVerification:
    """Verify database is PostgreSQL not SQLite"""
    
    def test_db_info_endpoint(self, authenticated_session):
        """Check if there's a db info endpoint or health check with db info"""
        response = authenticated_session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        # Check health response for any db info
        data = response.json()
        print(f"✓ Health check response: {data}")
        
    def test_postgres_specific_fields_in_leads(self, authenticated_session):
        """Verify leads have PostgreSQL-specific fields"""
        response = authenticated_session.get(f"{BASE_URL}/api/v2/leads?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        if data["data"]:
            lead = data["data"][0]
            # PostgreSQL schema fields
            postgres_fields = ["org_id", "lead_code", "source_channel", "lead_status", "intent_level"]
            for field in postgres_fields:
                assert field in lead, f"Missing PostgreSQL field: {field}"
            print(f"✓ Lead has PostgreSQL schema fields: {postgres_fields}")
    
    def test_postgres_specific_fields_in_deals(self, authenticated_session):
        """Verify deals have PostgreSQL-specific fields"""
        response = authenticated_session.get(f"{BASE_URL}/api/v2/deals?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        if data["data"]:
            deal = data["data"][0]
            # PostgreSQL schema fields
            postgres_fields = ["org_id", "deal_code", "deal_name", "current_stage", "deal_value"]
            for field in postgres_fields:
                assert field in deal, f"Missing PostgreSQL field: {field}"
            print(f"✓ Deal has PostgreSQL schema fields: {postgres_fields}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
