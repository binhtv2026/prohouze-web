"""
ProHouzing Website API Tests
Testing: /api/website/contact, /api/website/projects, /api/website/projects/{id}, /api/website/stats
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWebsiteStats:
    """Website stats endpoint tests"""
    
    def test_get_stats(self):
        """Test GET /api/website/stats returns correct stats"""
        response = requests.get(f"{BASE_URL}/api/website/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "years_experience" in data
        assert "total_projects" in data
        assert "total_customers" in data
        assert "total_branches" in data
        assert data["years_experience"] == 15
        assert data["total_projects"] == 200
        print("✓ Stats API returns correct data")


class TestWebsiteProjects:
    """Website projects API tests"""
    
    def test_get_projects_list(self):
        """Test GET /api/website/projects returns project list"""
        response = requests.get(f"{BASE_URL}/api/website/projects")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify project structure
        project = data[0]
        assert "id" in project
        assert "name" in project
        assert "location" in project
        assert "type" in project
        assert "price_from" in project
        assert "status" in project
        print(f"✓ Projects API returns {len(data)} projects")
    
    def test_get_project_detail(self):
        """Test GET /api/website/projects/1 returns project details"""
        response = requests.get(f"{BASE_URL}/api/website/projects/1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == "1"
        assert data["name"] == "Vinhomes Grand Park"
        assert data["location"] == "Quận 9, TP.HCM"
        assert data["developer"] == "Vingroup"
        assert "highlights" in data
        assert "amenities" in data
        assert "images" in data
        print("✓ Project detail API returns correct data")
    
    def test_get_project_not_found(self):
        """Test GET /api/website/projects/999 returns 404"""
        response = requests.get(f"{BASE_URL}/api/website/projects/999")
        assert response.status_code == 404
        print("✓ Project 404 handled correctly")
    
    def test_filter_projects_by_type(self):
        """Test GET /api/website/projects?type=apartment"""
        response = requests.get(f"{BASE_URL}/api/website/projects?type=apartment")
        assert response.status_code == 200
        
        data = response.json()
        for project in data:
            assert project["type"] == "apartment"
        print(f"✓ Project type filter works - {len(data)} apartments")
    
    def test_filter_projects_by_hot(self):
        """Test GET /api/website/projects?is_hot=true"""
        response = requests.get(f"{BASE_URL}/api/website/projects?is_hot=true")
        assert response.status_code == 200
        
        data = response.json()
        for project in data:
            assert project["is_hot"] == True
        print(f"✓ Project hot filter works - {len(data)} hot projects")


class TestWebsiteContactForm:
    """Website contact form API tests"""
    
    def test_submit_contact_form_success(self):
        """Test POST /api/website/contact creates lead"""
        test_phone = f"090{str(uuid.uuid4())[:7]}"
        
        payload = {
            "name": "TEST_Contact User",
            "phone": test_phone,
            "email": "test_contact@example.com",
            "subject": "buy",
            "message": "Testing contact form submission",
            "source_page": "landing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/website/contact",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "lead_id" in data
        assert data["message"] is not None
        print(f"✓ Contact form creates lead: {data['lead_id']}")
    
    def test_submit_contact_form_project_detail(self):
        """Test contact form from project detail page"""
        test_phone = f"091{str(uuid.uuid4())[:7]}"
        
        payload = {
            "name": "TEST_Project Interest User",
            "phone": test_phone,
            "email": "project_interest@example.com",
            "subject": "invest",
            "message": "Interested in this project",
            "project_interest": "Vinhomes Grand Park",
            "source_page": "project-detail"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/website/contact",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Contact form from project detail works")
    
    def test_submit_contact_form_required_fields(self):
        """Test contact form requires name and phone"""
        payload = {
            "name": "TEST_User",
            # Missing phone - should fail validation
        }
        
        response = requests.post(
            f"{BASE_URL}/api/website/contact",
            json=payload
        )
        
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Contact form validates required fields")
    
    def test_duplicate_contact_updates_existing(self):
        """Test submitting same phone updates existing lead"""
        test_phone = f"092{str(uuid.uuid4())[:7]}"
        
        # First submission
        payload1 = {
            "name": "TEST_First Contact",
            "phone": test_phone,
            "message": "First message"
        }
        response1 = requests.post(f"{BASE_URL}/api/website/contact", json=payload1)
        assert response1.status_code == 200
        lead_id1 = response1.json()["lead_id"]
        
        # Second submission with same phone
        payload2 = {
            "name": "TEST_First Contact",
            "phone": test_phone,
            "email": "newemail@example.com",
            "message": "Second message"
        }
        response2 = requests.post(f"{BASE_URL}/api/website/contact", json=payload2)
        assert response2.status_code == 200
        lead_id2 = response2.json()["lead_id"]
        
        # Should return same lead_id (existing lead updated)
        assert lead_id1 == lead_id2
        print("✓ Duplicate contact updates existing lead")


class TestWebsiteNews:
    """Website news API tests"""
    
    def test_get_news_list(self):
        """Test GET /api/website/news returns news list"""
        response = requests.get(f"{BASE_URL}/api/website/news")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify news structure
        news = data[0]
        assert "id" in news
        assert "title" in news
        assert "excerpt" in news
        assert "category" in news
        print(f"✓ News API returns {len(data)} articles")


class TestWebsiteCareers:
    """Website careers API tests"""
    
    def test_get_career_positions(self):
        """Test GET /api/website/careers returns positions"""
        response = requests.get(f"{BASE_URL}/api/website/careers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify position structure
        position = data[0]
        assert "id" in position
        assert "title" in position
        assert "department" in position
        assert "salary_range" in position
        print(f"✓ Careers API returns {len(data)} positions")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
