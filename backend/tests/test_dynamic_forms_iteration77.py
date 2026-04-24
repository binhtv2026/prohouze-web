"""
Test Dynamic Forms API - Iteration 77
Testing:
1. Login functionality at /api/v2/auth/login
2. Current user API /api/v2/auth/me
3. Form API /api/v2/forms/render/lead
4. Form API /api/v2/forms/render/deal
5. Master Data Lookup API /api/v2/master-data/lookup/lead_status
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(
            f"{BASE_URL}/api/v2/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token"
        assert "user" in data, "Missing user object"
        assert data["user"]["email"] == TEST_EMAIL, "Email mismatch"
        assert data["user"]["role"] == "admin", "Role mismatch"
        assert data["token_type"] == "bearer", "Token type mismatch"
        print(f"Login success: {data['user']['full_name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/v2/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpass"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_current_user(self):
        """Test GET /api/v2/auth/me with valid token"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/v2/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Now test /me endpoint
        response = requests.get(
            f"{BASE_URL}/api/v2/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"GET /me failed: {response.text}"
        
        data = response.json()
        assert data["email"] == TEST_EMAIL, "Email mismatch"
        assert "id" in data, "Missing id"
        assert "full_name" in data, "Missing full_name"
        assert "role" in data, "Missing role"
        assert "org_id" in data, "Missing org_id"
        print(f"Current user: {data['full_name']} (role: {data['role']})")
    
    def test_get_current_user_invalid_token(self):
        """Test GET /api/v2/auth/me with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/v2/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_get_current_user_no_token(self):
        """Test GET /api/v2/auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/v2/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestDynamicLeadForm:
    """Dynamic Lead Form API tests"""
    
    def test_get_renderable_lead_form(self):
        """Test GET /api/v2/forms/render/lead"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/lead?form_type=create")
        assert response.status_code == 200, f"Failed to get lead form: {response.text}"
        
        data = response.json()
        # Check schema
        assert "schema" in data, "Missing schema"
        assert data["schema"]["entity_type"] == "lead", "Wrong entity_type"
        assert data["schema"]["form_type"] == "create", "Wrong form_type"
        
        # Check sections
        assert "sections" in data, "Missing sections"
        assert len(data["sections"]) >= 1, "No sections found"
        
        # Check first section has fields
        first_section = data["sections"][0]
        assert "fields" in first_section, "Section missing fields"
        assert len(first_section["fields"]) >= 1, "Section has no fields"
        
        print(f"Lead form has {len(data['sections'])} sections")
        for section in data["sections"]:
            print(f"  - {section['name']}: {len(section['fields'])} fields")
    
    def test_lead_form_has_required_sections(self):
        """Test lead form has expected sections"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/lead?form_type=create")
        assert response.status_code == 200
        
        data = response.json()
        section_codes = [s["code"] for s in data["sections"]]
        
        # Expected sections based on DEFAULT_FORMS
        expected_sections = ["basic_info", "contact", "source"]
        for expected in expected_sections:
            assert expected in section_codes, f"Missing section: {expected}"
    
    def test_lead_form_fields_have_attributes(self):
        """Test form fields have attribute information"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/lead?form_type=create")
        assert response.status_code == 200
        
        data = response.json()
        for section in data["sections"]:
            for field in section["fields"]:
                if field.get("type") == "field" or "attribute" in field:
                    assert "attribute" in field, f"Field missing attribute: {field}"
                    attr = field["attribute"]
                    assert "code" in attr, "Attribute missing code"
                    assert "name" in attr, "Attribute missing name"
                    assert "data_type" in attr, "Attribute missing data_type"
    
    def test_lead_quick_form(self):
        """Test GET /api/v2/forms/render/lead with form_type=quick"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/lead?form_type=quick")
        assert response.status_code == 200, f"Failed to get quick form: {response.text}"
        
        data = response.json()
        assert data["schema"]["form_type"] == "quick", "Wrong form_type"
        # Quick form should have fewer fields
        print(f"Quick form has {len(data['sections'])} sections")


class TestDynamicDealForm:
    """Dynamic Deal Form API tests"""
    
    def test_get_renderable_deal_form(self):
        """Test GET /api/v2/forms/render/deal"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/deal?form_type=create")
        assert response.status_code == 200, f"Failed to get deal form: {response.text}"
        
        data = response.json()
        # Check schema
        assert "schema" in data, "Missing schema"
        assert data["schema"]["entity_type"] == "deal", "Wrong entity_type"
        assert data["schema"]["form_type"] == "create", "Wrong form_type"
        
        # Check sections
        assert "sections" in data, "Missing sections"
        assert len(data["sections"]) >= 1, "No sections found"
        
        print(f"Deal form has {len(data['sections'])} sections")
        for section in data["sections"]:
            print(f"  - {section['name']}: {len(section['fields'])} fields")
    
    def test_deal_form_has_required_sections(self):
        """Test deal form has expected sections"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/deal?form_type=create")
        assert response.status_code == 200
        
        data = response.json()
        section_codes = [s["code"] for s in data["sections"]]
        
        # Expected sections based on DEFAULT_FORMS
        expected_sections = ["basic_info", "financial"]
        for expected in expected_sections:
            assert expected in section_codes, f"Missing section: {expected}"
    
    def test_deal_form_has_currency_field(self):
        """Test deal form has currency field type"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/deal?form_type=create")
        assert response.status_code == 200
        
        data = response.json()
        found_currency = False
        for section in data["sections"]:
            for field in section["fields"]:
                if field.get("type") == "field" or "attribute" in field:
                    attr = field.get("attribute", {})
                    if attr.get("data_type") == "currency":
                        found_currency = True
                        print(f"Found currency field: {attr.get('name')}")
                        break
        
        assert found_currency, "Deal form should have currency field"
    
    def test_deal_form_has_date_field(self):
        """Test deal form has date field type"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/render/deal?form_type=create")
        assert response.status_code == 200
        
        data = response.json()
        found_date = False
        for section in data["sections"]:
            for field in section["fields"]:
                if field.get("type") == "field" or "attribute" in field:
                    attr = field.get("attribute", {})
                    if attr.get("data_type") == "date":
                        found_date = True
                        print(f"Found date field: {attr.get('name')}")
                        break
        
        assert found_date, "Deal form should have date field"


class TestMasterDataLookup:
    """Master Data Lookup API tests"""
    
    def test_lookup_lead_status(self):
        """Test GET /api/v2/master-data/lookup/lead_status"""
        response = requests.get(f"{BASE_URL}/api/v2/master-data/lookup/lead_status")
        assert response.status_code == 200, f"Failed to lookup lead_status: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        assert len(data) >= 1, "No lead statuses found"
        
        # Check structure of first item
        first = data[0]
        assert "code" in first, "Missing code"
        assert "label" in first or "label_vi" in first, "Missing label"
        
        print(f"Found {len(data)} lead statuses:")
        for item in data:
            print(f"  - {item.get('code')}: {item.get('label_vi') or item.get('label')}")
    
    def test_lookup_lead_source(self):
        """Test GET /api/v2/master-data/lookup/lead_source"""
        response = requests.get(f"{BASE_URL}/api/v2/master-data/lookup/lead_source")
        assert response.status_code == 200, f"Failed to lookup lead_source: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"Found {len(data)} lead sources")
    
    def test_lookup_intent_level(self):
        """Test GET /api/v2/master-data/lookup/intent_level"""
        response = requests.get(f"{BASE_URL}/api/v2/master-data/lookup/intent_level")
        assert response.status_code == 200, f"Failed to lookup intent_level: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"Found {len(data)} intent levels")
    
    def test_lookup_deal_stage(self):
        """Test GET /api/v2/master-data/lookup/deal_stage"""
        response = requests.get(f"{BASE_URL}/api/v2/master-data/lookup/deal_stage")
        assert response.status_code == 200, f"Failed to lookup deal_stage: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"Found {len(data)} deal stages")
    
    def test_lookup_invalid_category(self):
        """Test lookup with invalid category"""
        response = requests.get(f"{BASE_URL}/api/v2/master-data/lookup/invalid_category_xyz")
        # Should return empty array or 404
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"


class TestFormTypes:
    """Test form types and layouts endpoints"""
    
    def test_get_form_types(self):
        """Test GET /api/v2/forms/types"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/types")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list"
        assert "create" in data, "Missing 'create' type"
        assert "quick" in data, "Missing 'quick' type"
        print(f"Form types: {data}")
    
    def test_get_layouts(self):
        """Test GET /api/v2/forms/layouts"""
        response = requests.get(f"{BASE_URL}/api/v2/forms/layouts")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list"
        assert "full" in data, "Missing 'full' layout"
        assert "half" in data, "Missing 'half' layout"
        print(f"Layouts: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
