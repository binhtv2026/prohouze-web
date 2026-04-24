"""
HR Profile 360° API Tests
Tests for HR module - profiles, family, education, work history, certificates, documents, rewards
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"

# Known test profile ID
EXISTING_PROFILE_ID = "7f38a522-a035-4ffd-815e-1e8035d48ad0"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, f"No access_token in response: {data}"
    return data["access_token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Auth headers with token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

# ═══════════════════════════════════════════════════════════════════════════════
# HR DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHRDashboard:
    """HR Dashboard API Tests"""
    
    def test_get_dashboard_stats(self, auth_headers):
        """GET /api/hr/dashboard - Get dashboard statistics"""
        response = requests.get(f"{BASE_URL}/api/hr/dashboard", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_employees" in data
        assert "new_employees" in data
        assert "by_status" in data
        assert "incomplete_profiles" in data
        assert "active_alerts" in data
        print(f"Dashboard stats: total={data['total_employees']}, new={data['new_employees']}")
    
    def test_get_recent_employees(self, auth_headers):
        """GET /api/hr/dashboard/recent-employees - Get recent employees"""
        response = requests.get(f"{BASE_URL}/api/hr/dashboard/recent-employees?limit=5", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Recent employees count: {len(data)}")
    
    def test_get_incomplete_profiles(self, auth_headers):
        """GET /api/hr/dashboard/incomplete-profiles - Get incomplete profiles"""
        response = requests.get(f"{BASE_URL}/api/hr/dashboard/incomplete-profiles?limit=5", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Incomplete profiles count: {len(data)}")
    
    def test_get_expiring_contracts(self, auth_headers):
        """GET /api/hr/dashboard/expiring-contracts - Get expiring contracts"""
        response = requests.get(f"{BASE_URL}/api/hr/dashboard/expiring-contracts?days=30", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Expiring contracts: {len(data)}")


# ═══════════════════════════════════════════════════════════════════════════════
# HR PROFILE CRUD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHRProfileCRUD:
    """HR Profile CRUD API Tests"""
    
    def test_list_profiles(self, auth_headers):
        """GET /api/hr/profiles - List all profiles"""
        response = requests.get(f"{BASE_URL}/api/hr/profiles", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Total profiles: {len(data)}")
    
    def test_get_profile(self, auth_headers):
        """GET /api/hr/profiles/:id - Get profile by ID"""
        response = requests.get(f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "employee_code" in data
        assert "full_name" in data
        print(f"Profile: {data.get('employee_code')} - {data.get('full_name')}")
    
    def test_get_profile_360(self, auth_headers):
        """GET /api/hr/profiles/:id/360 - Get 360° view"""
        response = requests.get(f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/360", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "profile" in data
        assert "family" in data
        assert "education" in data
        assert "work_history" in data
        assert "certificates" in data
        assert "documents" in data
        assert "internal_history" in data
        assert "contracts" in data
        assert "rewards_discipline" in data
        assert "kpi_records" in data
        assert "onboarding_checklist" in data
        assert "alerts" in data
        
        print(f"360 View loaded: profile completeness = {data['profile'].get('profile_completeness')}%")
        print(f"  - Family: {len(data['family'])}")
        print(f"  - Education: {len(data['education'])}")
        print(f"  - Certificates: {len(data['certificates'])}")
        print(f"  - Documents: {len(data['documents'])}")
    
    def test_create_profile(self, auth_headers):
        """POST /api/hr/profiles - Create new profile"""
        test_name = f"TEST_Employee_{uuid.uuid4().hex[:6]}"
        payload = {
            "full_name": test_name,
            "phone": "0901234567",
            "email_personal": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "date_of_birth": "1995-05-15",
            "gender": "male",
            "employment_status": "probation"
        }
        
        response = requests.post(f"{BASE_URL}/api/hr/profiles", headers=auth_headers, json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "data" in data
        assert "id" in data["data"]
        assert "employee_code" in data["data"]
        
        created_id = data["data"]["id"]
        employee_code = data["data"]["employee_code"]
        print(f"Created profile: {employee_code} - {test_name} (ID: {created_id})")
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/hr/profiles/{created_id}", headers=auth_headers)
        assert get_response.status_code == 200
        created_profile = get_response.json()
        assert created_profile["full_name"] == test_name
        assert created_profile["phone"] == "0901234567"
        
        return created_id
    
    def test_update_profile(self, auth_headers):
        """PUT /api/hr/profiles/:id - Update profile"""
        # First, get current data
        get_response = requests.get(f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}", headers=auth_headers)
        assert get_response.status_code == 200
        
        # Update with new data
        update_payload = {
            "phone": "0909876543",
            "current_address": f"Updated Address {uuid.uuid4().hex[:6]}"
        }
        
        response = requests.put(f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}", headers=auth_headers, json=update_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}", headers=auth_headers)
        updated_profile = verify_response.json()
        assert updated_profile["phone"] == "0909876543"
        print(f"Profile updated: phone={updated_profile['phone']}")
    
    def test_get_nonexistent_profile(self, auth_headers):
        """GET /api/hr/profiles/:id - Should return 404 for nonexistent profile"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/hr/profiles/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# FAMILY MEMBER TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFamilyMember:
    """Family Member API Tests"""
    
    def test_add_family_member(self, auth_headers):
        """POST /api/hr/profiles/:id/family - Add family member"""
        payload = {
            "full_name": f"TEST_Family_{uuid.uuid4().hex[:6]}",
            "relationship": "spouse",
            "year_of_birth": 1990,
            "occupation": "Kế toán",
            "phone": "0912345678",
            "is_emergency_contact": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/family",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "data" in data
        assert "id" in data["data"]
        
        member_id = data["data"]["id"]
        print(f"Added family member: {payload['full_name']} (ID: {member_id})")
        
        # Verify via 360 view
        view_response = requests.get(f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/360", headers=auth_headers)
        view_data = view_response.json()
        family_names = [f["full_name"] for f in view_data["family"]]
        assert payload["full_name"] in family_names
        
        return member_id
    
    def test_delete_family_member(self, auth_headers):
        """DELETE /api/hr/family/:id - Delete family member"""
        # First create a member to delete
        payload = {
            "full_name": f"TEST_ToDelete_{uuid.uuid4().hex[:6]}",
            "relationship": "sibling",
        }
        create_response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/family",
            headers=auth_headers,
            json=payload
        )
        member_id = create_response.json()["data"]["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/hr/family/{member_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data.get("success") == True
        print(f"Deleted family member: {member_id}")


# ═══════════════════════════════════════════════════════════════════════════════
# EDUCATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestEducation:
    """Education API Tests"""
    
    def test_add_education(self, auth_headers):
        """POST /api/hr/profiles/:id/education - Add education record"""
        payload = {
            "institution": f"TEST_University_{uuid.uuid4().hex[:6]}",
            "degree": "Cử nhân",
            "major": "Kinh tế",
            "level": "bachelor",
            "start_date": "2013-09-01",
            "end_date": "2017-06-30",
            "gpa": 3.5
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/education",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "data" in data
        assert "id" in data["data"]
        
        edu_id = data["data"]["id"]
        print(f"Added education: {payload['institution']} (ID: {edu_id})")
        
        return edu_id


# ═══════════════════════════════════════════════════════════════════════════════
# WORK HISTORY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestWorkHistory:
    """Work History API Tests"""
    
    def test_add_work_history(self, auth_headers):
        """POST /api/hr/profiles/:id/work-history - Add work history"""
        payload = {
            "company": f"TEST_Company_{uuid.uuid4().hex[:6]}",
            "position": "Sales Manager",
            "department": "Sales",
            "start_date": "2018-01-01",
            "end_date": "2023-12-31",
            "responsibilities": "Quản lý đội ngũ bán hàng"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/work-history",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        print(f"Added work history: {payload['company']} - {payload['position']}")


# ═══════════════════════════════════════════════════════════════════════════════
# CERTIFICATE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCertificate:
    """Certificate API Tests"""
    
    def test_add_certificate(self, auth_headers):
        """POST /api/hr/profiles/:id/certificates - Add certificate"""
        payload = {
            "name": f"TEST_Certificate_{uuid.uuid4().hex[:6]}",
            "issuer": "TOEIC Organization",
            "issue_date": "2023-06-15",
            "expiry_date": "2025-06-15",
            "score": "850"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/certificates",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "data" in data
        
        cert_id = data["data"]["id"]
        print(f"Added certificate: {payload['name']} (ID: {cert_id})")
        
        return cert_id


# ═══════════════════════════════════════════════════════════════════════════════
# REWARDS/DISCIPLINE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestRewardsDiscipline:
    """Rewards & Discipline API Tests"""
    
    def test_add_reward(self, auth_headers):
        """POST /api/hr/profiles/:id/rewards - Add reward record"""
        payload = {
            "type": "reward",
            "title": f"TEST_Reward_{uuid.uuid4().hex[:6]}",
            "description": "Hoàn thành xuất sắc nhiệm vụ",
            "effective_date": "2024-01-15",
            "reward_amount": 5000000,
            "reward_type": "cash"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/rewards",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        print(f"Added reward: {payload['title']}")
    
    def test_get_rewards(self, auth_headers):
        """GET /api/hr/profiles/:id/rewards - Get rewards list"""
        response = requests.get(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/rewards",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Total rewards/discipline records: {len(data)}")


# ═══════════════════════════════════════════════════════════════════════════════
# INTERNAL HISTORY & CONTRACTS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestInternalHistoryContracts:
    """Internal History & Contracts API Tests"""
    
    def test_get_internal_history(self, auth_headers):
        """GET /api/hr/profiles/:id/internal-history - Get internal history"""
        response = requests.get(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/internal-history",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Internal history records: {len(data)}")
    
    def test_get_contracts(self, auth_headers):
        """GET /api/hr/profiles/:id/contracts - Get contracts"""
        response = requests.get(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/contracts",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Contract records: {len(data)}")
    
    def test_add_contract(self, auth_headers):
        """POST /api/hr/profiles/:id/contracts - Add contract"""
        payload = {
            "contract_type": "probation",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31",
            "position": "Sales Executive",
            "department": "Sales",
            "base_salary": 15000000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/contracts",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "contract_number" in data["data"]
        
        print(f"Added contract: {data['data']['contract_number']}")


# ═══════════════════════════════════════════════════════════════════════════════
# KPI & ONBOARDING TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestKPIOnboarding:
    """KPI & Onboarding API Tests"""
    
    def test_get_kpi(self, auth_headers):
        """GET /api/hr/profiles/:id/kpi - Get KPI records"""
        response = requests.get(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/kpi",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"KPI records: {len(data)}")
    
    def test_get_onboarding_checklist(self, auth_headers):
        """GET /api/hr/profiles/:id/onboarding - Get onboarding checklist"""
        response = requests.get(
            f"{BASE_URL}/api/hr/profiles/{EXISTING_PROFILE_ID}/onboarding",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        completed = len([i for i in data if i.get("is_completed")])
        total = len(data)
        print(f"Onboarding progress: {completed}/{total}")


# ═══════════════════════════════════════════════════════════════════════════════
# ALERTS & SEARCH TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestAlertsSearch:
    """Alerts & Search API Tests"""
    
    def test_get_alerts(self, auth_headers):
        """GET /api/hr/alerts - Get HR alerts"""
        response = requests.get(
            f"{BASE_URL}/api/hr/alerts?resolved=false&limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Active alerts: {len(data)}")
    
    def test_search_employees(self, auth_headers):
        """GET /api/hr/search - Search employees"""
        response = requests.get(
            f"{BASE_URL}/api/hr/search?q=Nguyen&limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Search results for 'Nguyen': {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
