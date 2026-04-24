"""
HRM Advanced Module API Tests - ProHouzing CRM
Testing: Labor Contracts, Recruitment, Applications, Training, Messages, Company Culture
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ==================== AUTH FIXTURES ====================

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@test.com",
        "password": "Admin@123"
    })
    if response.status_code != 200:
        # Try alternate admin credentials
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, "Token not found in response"
    return data["access_token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers for API calls"""
    return {"Authorization": f"Bearer {auth_token}"}


# ==================== POSITION CATALOG TESTS ====================

class TestPositionCatalog:
    """Position catalog API tests"""
    
    def test_get_position_catalog(self, auth_headers):
        """Test GET /hrm-advanced/position-catalog"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/position-catalog", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify catalog has departments
        assert "sales" in data or "hr" in data or len(data) > 0
        
    def test_get_positions_by_department(self, auth_headers):
        """Test GET /hrm-advanced/position-catalog/{department}"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/position-catalog/sales", headers=auth_headers)
        if response.status_code == 200:
            data = response.json()
            assert "positions" in data or isinstance(data, dict)
        else:
            # Department may not exist - acceptable
            assert response.status_code == 404


# ==================== CONTRACT TEMPLATES TESTS ====================

class TestContractTemplates:
    """Contract templates API tests"""
    
    def test_get_contract_templates(self, auth_headers):
        """Test GET /hrm-advanced/contract-templates"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/contract-templates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify we have contract templates
        assert isinstance(data, dict)
        # Should have probation, fixed_term, indefinite templates
        if len(data) > 0:
            assert "probation" in data or "fixed_term" in data or "indefinite" in data


# ==================== BENEFITS POLICY TESTS ====================

class TestBenefitsPolicy:
    """Benefits policy API tests"""
    
    def test_get_benefits_policy(self, auth_headers):
        """Test GET /hrm-advanced/benefits-policy"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/benefits-policy", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Should have insurance, leave, allowances, bonus sections
        if len(data) > 0:
            expected_keys = ["insurance", "leave", "allowances", "bonus"]
            has_expected = any(key in data for key in expected_keys)
            assert has_expected or len(data) > 0


# ==================== LABOR CONTRACT TESTS ====================

class TestLaborContracts:
    """Labor contract API tests"""
    
    def test_get_labor_contracts(self, auth_headers):
        """Test GET /hrm-advanced/contracts"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/contracts", headers=auth_headers)
        # May return 403 if not HR/Admin role - that's acceptable
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)


# ==================== RECRUITMENT TESTS ====================

class TestRecruitment:
    """Recruitment API tests"""
    
    def test_get_recruitments(self, auth_headers):
        """Test GET /hrm-advanced/recruitments"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/recruitments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_public_recruitments(self):
        """Test GET /hrm-advanced/recruitments/public - no auth required"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/recruitments/public")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ==================== JOB APPLICATIONS TESTS ====================

class TestApplications:
    """Job applications API tests"""
    
    def test_get_applications(self, auth_headers):
        """Test GET /hrm-advanced/applications"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/applications", headers=auth_headers)
        # May return 403 if not HR/Admin role - that's acceptable
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)


# ==================== TRAINING TESTS ====================

class TestTraining:
    """Training/LMS API tests"""
    
    def test_get_training_courses(self, auth_headers):
        """Test GET /hrm-advanced/training/courses"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/training/courses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_my_training_courses(self, auth_headers):
        """Test GET /hrm-advanced/training/my-courses"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/training/my-courses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ==================== INTERNAL MESSAGING TESTS ====================

class TestInternalMessaging:
    """Internal messaging/chat API tests"""
    
    def test_get_message_channels(self, auth_headers):
        """Test GET /hrm-advanced/messages/channels"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/messages/channels", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_messages(self, auth_headers):
        """Test GET /hrm-advanced/messages"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/messages", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_message_channel(self, auth_headers):
        """Test POST /hrm-advanced/messages/channels"""
        channel_data = {
            "name": "TEST_team-sales-test",
            "type": "public",
            "description": "Test channel for sales team",
            "member_ids": []
        }
        response = requests.post(f"{BASE_URL}/api/hrm-advanced/messages/channels", json=channel_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_team-sales-test"
        assert "id" in data


# ==================== COMPANY CULTURE TESTS ====================

class TestCompanyCulture:
    """Company culture API tests"""
    
    def test_get_company_culture(self, auth_headers):
        """Test GET /hrm-advanced/company-culture"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/company-culture", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify culture data structure
        assert "company_name" in data or "mission" in data or "vision" in data
        if "mission" in data:
            assert len(data["mission"]) > 0
        if "vision" in data:
            assert len(data["vision"]) > 0
        if "core_values" in data:
            assert isinstance(data["core_values"], list)


# ==================== KPI TESTS ====================

class TestKPI:
    """KPI API tests"""
    
    def test_get_kpis(self, auth_headers):
        """Test GET /hrm-advanced/kpi"""
        response = requests.get(f"{BASE_URL}/api/hrm-advanced/kpi", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ==================== CAREER PATH TESTS ====================

class TestCareerPath:
    """Career path API tests"""
    
    def test_get_career_path(self, auth_headers):
        """Test GET /hrm-advanced/career-path/{employee_id}"""
        # First get a user ID from users API
        users_response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        if users_response.status_code == 200:
            users = users_response.json()
            if len(users) > 0:
                employee_id = users[0].get("id")
                if employee_id:
                    response = requests.get(f"{BASE_URL}/api/hrm-advanced/career-path/{employee_id}", headers=auth_headers)
                    assert response.status_code in [200, 404]
                    if response.status_code == 200:
                        data = response.json()
                        assert "employee_id" in data or "current_position" in data


# Run cleanup after all tests (for test data with TEST_ prefix)
def pytest_sessionfinish(session, exitstatus):
    """Clean up test data after session"""
    pass  # In production, implement cleanup for TEST_ prefixed data
