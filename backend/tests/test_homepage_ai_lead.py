"""
Test Homepage AI Sales API and Lead Form API
Tests for ProHouzing Landing Page features:
1. AI Chat API - POST /api/ai/chat
2. Lead Form API - POST /api/ai/lead
3. Chat history API - GET /api/ai/chat/{session_id}/history
4. Leads list API - GET /api/ai/leads
5. AI stats API - GET /api/ai/stats
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHomepageAIAPIs:
    """AI Chat and Lead APIs for Homepage"""
    
    # Track created data for cleanup
    test_session_id = None
    test_lead_phone = f"09{int(time.time()) % 100000000:08d}"
    
    def test_01_ai_chat_new_session(self):
        """Test AI Chat without session_id - creates new session"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={
                "message": "Xin chào, tôi muốn tìm căn hộ"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should have session_id"
        assert "message" in data, "Response should have message"
        assert len(data["message"]) > 0, "AI response should not be empty"
        
        # Save session for next tests
        TestHomepageAIAPIs.test_session_id = data["session_id"]
        print(f"New session created: {data['session_id']}")
        print(f"AI response: {data['message'][:100]}...")
    
    def test_02_ai_chat_existing_session(self):
        """Test AI Chat with existing session_id"""
        if not TestHomepageAIAPIs.test_session_id:
            pytest.skip("No session ID from previous test")
        
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={
                "session_id": TestHomepageAIAPIs.test_session_id,
                "message": "Ngân sách của tôi khoảng 3 tỷ"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["session_id"] == TestHomepageAIAPIs.test_session_id, "Session ID should match"
        assert len(data["message"]) > 0, "AI response should not be empty"
        print(f"AI response: {data['message'][:100]}...")
    
    def test_03_ai_chat_with_phone_captures_lead(self):
        """Test AI Chat captures lead when phone number is provided"""
        session_id = str(uuid.uuid4())
        phone = TestHomepageAIAPIs.test_lead_phone
        
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={
                "session_id": session_id,
                "message": f"Số điện thoại của tôi là {phone}"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["lead_captured"] == True, "Lead should be captured when phone is provided"
        assert data.get("lead_id") is not None, "Lead ID should be returned"
        print(f"Lead captured: {data['lead_id']}")
    
    def test_04_get_chat_history(self):
        """Test get chat history API"""
        if not TestHomepageAIAPIs.test_session_id:
            pytest.skip("No session ID from previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/ai/chat/{TestHomepageAIAPIs.test_session_id}/history"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "messages" in data, "Response should have messages array"
        assert len(data["messages"]) >= 2, "Should have at least 2 messages (user + assistant)"
        
        # Verify message structure
        for msg in data["messages"]:
            assert "role" in msg, "Message should have role"
            assert "content" in msg, "Message should have content"
            assert msg["role"] in ["user", "assistant"], f"Invalid role: {msg['role']}"
        
        print(f"Chat history has {len(data['messages'])} messages")
    
    def test_05_lead_form_submission(self):
        """Test Lead Form API - POST /api/ai/lead"""
        test_phone = f"09{int(time.time()+1) % 100000000:08d}"
        
        response = requests.post(
            f"{BASE_URL}/api/ai/lead",
            json={
                "name": "TEST_Lead Form User",
                "phone": test_phone,
                "source": "landing_form",
                "interest": "apartment",
                "budget": "2_5b",
                "notes": "Test from pytest"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have lead id"
        assert data["name"] == "TEST_Lead Form User", "Name should match"
        assert data["phone"] == test_phone, "Phone should match"
        assert data["status"] == "new", "Status should be 'new'"
        print(f"Lead created: {data['id']}")
    
    def test_06_lead_form_duplicate_phone(self):
        """Test Lead Form with duplicate phone - should update existing"""
        test_phone = f"09{int(time.time()+1) % 100000000:08d}"
        
        # Create first lead
        response1 = requests.post(
            f"{BASE_URL}/api/ai/lead",
            json={
                "name": "TEST_First User",
                "phone": test_phone,
                "source": "landing_form"
            }
        )
        assert response1.status_code == 200
        first_id = response1.json()["id"]
        
        # Create second lead with same phone
        response2 = requests.post(
            f"{BASE_URL}/api/ai/lead",
            json={
                "name": "TEST_Second User",
                "phone": test_phone,
                "source": "landing_form",
                "notes": "Duplicate submission"
            }
        )
        
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}: {response2.text}"
        second_id = response2.json()["id"]
        
        # Should return same ID (existing lead updated)
        assert first_id == second_id, "Duplicate phone should update existing lead"
        print(f"Duplicate phone handled - same lead ID: {first_id}")
    
    def test_07_lead_form_invalid_phone(self):
        """Test Lead Form with invalid phone format"""
        response = requests.post(
            f"{BASE_URL}/api/ai/lead",
            json={
                "name": "TEST_Invalid Phone",
                "phone": "12345",  # Invalid - too short
                "source": "landing_form"
            }
        )
        
        # API should still accept it (validation is on frontend)
        # or return 422 for validation error
        assert response.status_code in [200, 422], f"Expected 200 or 422, got {response.status_code}"
        print(f"Invalid phone response: {response.status_code}")
    
    def test_08_get_leads_list(self):
        """Test Get Leads API"""
        response = requests.get(
            f"{BASE_URL}/api/ai/leads",
            params={"limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data, "Response should have items array"
        assert "total" in data, "Response should have total count"
        
        if data["items"]:
            lead = data["items"][0]
            assert "id" in lead, "Lead should have id"
            assert "name" in lead, "Lead should have name"
            assert "phone" in lead, "Lead should have phone"
        
        print(f"Total leads: {data['total']}, returned: {len(data['items'])}")
    
    def test_09_get_leads_filtered_by_source(self):
        """Test Get Leads API with source filter"""
        response = requests.get(
            f"{BASE_URL}/api/ai/leads",
            params={"source": "ai_chat", "limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify all returned leads have source=ai_chat
        for lead in data.get("items", []):
            assert lead.get("source") == "ai_chat", f"Lead source should be ai_chat, got {lead.get('source')}"
        
        print(f"AI Chat leads: {len(data.get('items', []))}")
    
    def test_10_get_ai_stats(self):
        """Test AI Stats API"""
        response = requests.get(f"{BASE_URL}/api/ai/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_chats" in data, "Should have total_chats"
        assert "total_messages" in data, "Should have total_messages"
        assert "total_leads_from_ai" in data, "Should have total_leads_from_ai"
        
        print(f"AI Stats: {data['total_chats']} chats, {data['total_messages']} messages, {data['total_leads_from_ai']} leads")


class TestWebsitePublicAPIs:
    """Test public website APIs used on homepage"""
    
    def test_01_website_projects_list(self):
        """Test featured projects API"""
        response = requests.get(
            f"{BASE_URL}/api/website/projects-list",
            params={"is_hot": True, "limit": 4}
        )
        
        # API should return 200 even if no data
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Could be empty array
        assert isinstance(data, list), "Response should be array"
        print(f"Hot projects: {len(data)}")
    
    def test_02_website_testimonials(self):
        """Test testimonials API"""
        response = requests.get(f"{BASE_URL}/api/website/testimonials")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be array"
        print(f"Testimonials: {len(data)}")
    
    def test_03_website_partners(self):
        """Test partners API"""
        response = requests.get(f"{BASE_URL}/api/website/partners")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be array"
        print(f"Partners: {len(data)}")
    
    def test_04_website_news(self):
        """Test news API"""
        response = requests.get(
            f"{BASE_URL}/api/website/news",
            params={"limit": 3}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be array"
        print(f"News articles: {len(data)}")
    
    def test_05_website_contact_form(self):
        """Test contact form submission"""
        response = requests.post(
            f"{BASE_URL}/api/website/contact",
            json={
                "name": "TEST_Contact User",
                "phone": "0901234567",
                "message": "Test message from pytest",
                "source": "landing_page"
            }
        )
        
        # Contact form should accept submission
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        print(f"Contact form submitted successfully")
    
    def test_06_newsletter_subscribe(self):
        """Test newsletter subscription"""
        test_email = f"test_{int(time.time())}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={
                "email": test_email,
                "interests": ["market", "project", "tips"]
            }
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data or "success" in data, "Response should confirm subscription"
        print(f"Newsletter subscription: {test_email}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
