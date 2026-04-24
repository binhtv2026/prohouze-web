"""
Test Suite: Admin Projects API & Video Editor API
Tests CRUD operations for admin projects and video editor endpoints
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@prohouzing.vn"
ADMIN_PASSWORD = "admin123"


class TestAuth:
    """Authentication for API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }


class TestVideoEditorAPI(TestAuth):
    """Video Editor API Tests"""
    
    def test_video_editor_health(self, auth_headers):
        """GET /api/admin/video-editor/health - Check FFmpeg status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/video-editor/health",
            timeout=10
        )
        # This endpoint doesn't require auth
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        # FFmpeg may or may not be installed, just check response structure
        print(f"Video Editor Health: {data}")
    
    def test_video_editor_templates(self, auth_headers):
        """GET /api/admin/video-editor/templates - Get video templates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/video-editor/templates",
            timeout=10
        )
        # This endpoint doesn't require auth
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least 3 templates defined
        
        # Verify template structure
        template = data[0]
        assert "id" in template
        assert "name" in template
        assert "thumbnail" in template
        assert "slides" in template
        print(f"Found {len(data)} video templates")
    
    def test_video_editor_generate_requires_auth(self):
        """POST /api/admin/video-editor/generate - Requires authentication"""
        payload = {
            "project_info": {
                "name": "Test Project",
                "phone": "1800 1234",
                "website": "prohouzing.vn"
            },
            "slides": [
                {"id": "1", "type": "intro", "duration": 3, "bg_color": "#316585", "text_color": "#ffffff"}
            ],
            "quality": "1080p",
            "format": "mp4"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/video-editor/generate",
            json=payload,
            timeout=10
        )
        assert response.status_code in [401, 403]  # Requires auth
    
    def test_video_editor_generate_with_auth(self, auth_headers):
        """POST /api/admin/video-editor/generate - Generate video with auth"""
        payload = {
            "project_info": {
                "name": "TEST_Video_Project",
                "slogan": "Test Slogan",
                "price": "2.5 ty",
                "location": "Q9, HCM",
                "phone": "1800 1234",
                "website": "prohouzing.vn"
            },
            "slides": [
                {
                    "id": "slide-1",
                    "type": "intro",
                    "duration": 2,
                    "bg_color": "#316585",
                    "text_color": "#ffffff",
                    "title": "Test Title",
                    "subtitle": "Test Subtitle"
                }
            ],
            "quality": "720p",
            "format": "mp4"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/video-editor/generate",
            headers=auth_headers,
            json=payload,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert "status" in data
        print(f"Video generation job created: {data['job_id']}")
        
        # Save job_id for status test
        return data["job_id"]
    
    def test_video_editor_job_status(self, auth_headers):
        """GET /api/admin/video-editor/status/{job_id} - Check job status"""
        # First create a job
        payload = {
            "project_info": {
                "name": "TEST_Status_Check",
                "phone": "1800 1234",
                "website": "prohouzing.vn"
            },
            "slides": [
                {"id": "1", "type": "intro", "duration": 1, "bg_color": "#316585", "text_color": "#ffffff", "title": "Test"}
            ],
            "quality": "720p",
            "format": "mp4"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/admin/video-editor/generate",
            headers=auth_headers,
            json=payload,
            timeout=30
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Check status
        response = requests.get(
            f"{BASE_URL}/api/admin/video-editor/status/{job_id}",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert "status" in data
        assert "progress" in data
        print(f"Job {job_id} status: {data['status']}, progress: {data['progress']}%")
    
    def test_video_editor_jobs_list(self, auth_headers):
        """GET /api/admin/video-editor/jobs - List video jobs"""
        response = requests.get(
            f"{BASE_URL}/api/admin/video-editor/jobs",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} video jobs")


class TestAdminProjectsAPI(TestAuth):
    """Admin Projects API Tests - CRUD Operations"""
    
    created_project_id = None
    
    def test_admin_projects_get_all_requires_auth(self):
        """GET /api/admin/projects - Requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects",
            timeout=10
        )
        assert response.status_code in [401, 403]
    
    def test_admin_projects_get_all(self, auth_headers):
        """GET /api/admin/projects - Get all projects with auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} admin projects")
    
    def test_admin_projects_create(self, auth_headers):
        """POST /api/admin/projects - Create new project"""
        payload = {
            "name": "TEST_Project_Automation",
            "slogan": "Test Project Slogan",
            "location": {
                "address": "123 Test Street",
                "district": "District 9",
                "city": "Ho Chi Minh City"
            },
            "type": "apartment",
            "price_from": 2500000000,
            "price_to": 8000000000,
            "status": "opening",
            "developer": {
                "name": "Test Developer",
                "description": "Test developer description"
            },
            "description": "This is a test project created by automation testing",
            "highlights": ["Feature 1", "Feature 2"],
            "amenities": [],
            "images": ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"],
            "videos": {},
            "virtual_tour": {"enabled": False},
            "view_360": {"enabled": False},
            "units_total": 500,
            "units_available": 100,
            "area_range": "50-120 m2",
            "completion_date": "Q4/2025",
            "is_hot": True,
            "unit_types": [],
            "price_list": {"enabled": True, "items": []},
            "payment_schedule": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/projects",
            headers=auth_headers,
            json=payload,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == "TEST_Project_Automation"
        assert data["type"] == "apartment"
        assert data["is_hot"] == True
        assert data["price_from"] == 2500000000
        assert "slug" in data
        
        # Store for later tests
        TestAdminProjectsAPI.created_project_id = data["id"]
        print(f"Created project: {data['id']} with slug: {data['slug']}")
        
        return data["id"]
    
    def test_admin_projects_get_by_id(self, auth_headers):
        """GET /api/admin/projects/{id} - Get project by ID"""
        if not TestAdminProjectsAPI.created_project_id:
            pytest.skip("No project created to test")
        
        project_id = TestAdminProjectsAPI.created_project_id
        response = requests.get(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project_id
        assert data["name"] == "TEST_Project_Automation"
        print(f"Retrieved project: {data['name']}")
    
    def test_admin_projects_get_invalid_id(self, auth_headers):
        """GET /api/admin/projects/{id} - 404 for invalid ID"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects/invalid-project-id-12345",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 404
    
    def test_admin_projects_update(self, auth_headers):
        """PUT /api/admin/projects/{id} - Update project"""
        if not TestAdminProjectsAPI.created_project_id:
            pytest.skip("No project created to test")
        
        project_id = TestAdminProjectsAPI.created_project_id
        update_payload = {
            "name": "TEST_Project_Updated",
            "description": "Updated description",
            "is_hot": False,
            "price_from": 3000000000
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers=auth_headers,
            json=update_payload,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Project_Updated"
        assert data["is_hot"] == False
        assert data["price_from"] == 3000000000
        print(f"Updated project name to: {data['name']}")
        
        # Verify with GET
        get_response = requests.get(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers=auth_headers,
            timeout=10
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["name"] == "TEST_Project_Updated"
    
    def test_admin_projects_toggle_hot(self, auth_headers):
        """PUT /api/admin/projects/{id}/toggle-hot - Toggle HOT status"""
        if not TestAdminProjectsAPI.created_project_id:
            pytest.skip("No project created to test")
        
        project_id = TestAdminProjectsAPI.created_project_id
        
        # Get current status
        get_response = requests.get(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers=auth_headers,
            timeout=10
        )
        original_hot = get_response.json().get("is_hot", False)
        
        # Toggle
        response = requests.put(
            f"{BASE_URL}/api/admin/projects/{project_id}/toggle-hot",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "is_hot" in data
        assert data["is_hot"] == (not original_hot)
        print(f"Toggled HOT status from {original_hot} to {data['is_hot']}")
    
    def test_admin_projects_toggle_price_list(self, auth_headers):
        """PUT /api/admin/projects/{id}/toggle-price-list - Toggle price list visibility"""
        if not TestAdminProjectsAPI.created_project_id:
            pytest.skip("No project created to test")
        
        project_id = TestAdminProjectsAPI.created_project_id
        
        response = requests.put(
            f"{BASE_URL}/api/admin/projects/{project_id}/toggle-price-list",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "price_list_enabled" in data
        print(f"Price list enabled: {data['price_list_enabled']}")
    
    def test_admin_projects_stats(self, auth_headers):
        """GET /api/admin/projects/stats/overview - Get project statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects/stats/overview",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "opening" in data
        assert "coming_soon" in data
        assert "sold_out" in data
        assert "hot_projects" in data
        print(f"Project stats: Total={data['total']}, Opening={data['opening']}, Hot={data['hot_projects']}")
    
    def test_admin_projects_filter_by_status(self, auth_headers):
        """GET /api/admin/projects?status=opening - Filter projects by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects?status=opening",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned projects should have status "opening"
        for project in data:
            assert project.get("status") == "opening", f"Expected 'opening', got '{project.get('status')}'"
        print(f"Found {len(data)} projects with status 'opening'")
    
    def test_admin_projects_filter_by_type(self, auth_headers):
        """GET /api/admin/projects?type=apartment - Filter projects by type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects?type=apartment",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned projects should have type "apartment"
        for project in data:
            assert project.get("type") == "apartment", f"Expected 'apartment', got '{project.get('type')}'"
        print(f"Found {len(data)} apartment projects")
    
    def test_admin_projects_delete(self, auth_headers):
        """DELETE /api/admin/projects/{id} - Delete project"""
        if not TestAdminProjectsAPI.created_project_id:
            pytest.skip("No project created to test")
        
        project_id = TestAdminProjectsAPI.created_project_id
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers=auth_headers,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted project: {project_id}")
        
        # Verify deletion with GET (should return 404)
        get_response = requests.get(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers=auth_headers,
            timeout=10
        )
        assert get_response.status_code == 404
        print("Verified project no longer exists")
        
        # Clear stored ID
        TestAdminProjectsAPI.created_project_id = None


class TestAdminProjectsEdgeCases(TestAuth):
    """Edge case tests for Admin Projects API"""
    
    def test_create_project_minimal_fields(self, auth_headers):
        """Create project with minimal required fields"""
        payload = {
            "name": "TEST_Minimal_Project",
            "location": {
                "address": "Test Address",
                "district": "Test District",
                "city": "Test City"
            },
            "type": "villa",
            "price_from": 5000000000,
            "developer": {
                "name": "Minimal Developer"
            },
            "description": "Minimal project description"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/projects",
            headers=auth_headers,
            json=payload,
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Minimal_Project"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/admin/projects/{data['id']}",
            headers=auth_headers,
            timeout=10
        )
        print("Minimal project test passed and cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
