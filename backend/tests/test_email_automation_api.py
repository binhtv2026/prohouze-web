"""
Email Automation API Tests - Phase 4
Tests for AI Email Automation System with event-driven architecture
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestEmailHealth:
    """Health check endpoint tests"""
    
    def test_health_check(self):
        """Test email system health endpoint"""
        response = requests.get(f"{BASE_URL}/api/email/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") in ["healthy", "degraded"]
        assert "components" in data
        assert "mongodb" in data["components"]
        assert "redis" in data["components"]
        assert "resend" in data["components"]
        assert "ai" in data["components"]
        print(f"✓ Health check passed: {data['status']}, components: {data['components']}")


class TestEmailTemplates:
    """Email Template CRUD tests"""
    
    @pytest.fixture
    def template_payload(self):
        return {
            "name": f"TEST_Template_{uuid.uuid4().hex[:8]}",
            "type": "operation",
            "subject_template": "Chào mừng {{name}} đến với ProHouzing!",
            "body_template": "<h1>Xin chào {{name}}</h1><p>Cảm ơn bạn đã đăng ký.</p>",
            "variables": ["name", "email"],
            "enable_ai_personalization": True,
            "requires_approval": False
        }
    
    def test_create_template(self, template_payload):
        """Test creating an email template"""
        response = requests.post(
            f"{BASE_URL}/api/email/templates",
            json=template_payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "template_id" in data
        assert data.get("name") == template_payload["name"]
        print(f"✓ Template created: {data['template_id']}")
        return data["template_id"]
    
    def test_list_templates(self):
        """Test listing email templates"""
        response = requests.get(f"{BASE_URL}/api/email/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} templates")
    
    def test_get_template_by_id(self, template_payload):
        """Test getting template by ID"""
        # First create a template
        create_res = requests.post(f"{BASE_URL}/api/email/templates", json=template_payload)
        template_id = create_res.json()["template_id"]
        
        # Get the template
        response = requests.get(f"{BASE_URL}/api/email/templates/{template_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("id") == template_id
        assert data.get("name") == template_payload["name"]
        print(f"✓ Retrieved template: {template_id}")
    
    def test_delete_template(self, template_payload):
        """Test soft deleting a template"""
        # Create template
        create_res = requests.post(f"{BASE_URL}/api/email/templates", json=template_payload)
        template_id = create_res.json()["template_id"]
        
        # Delete template
        response = requests.delete(f"{BASE_URL}/api/email/templates/{template_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        print(f"✓ Deleted template: {template_id}")
    
    def test_create_template_all_types(self):
        """Test creating templates of all types"""
        types = ["system", "operation", "marketing"]
        
        for template_type in types:
            payload = {
                "name": f"TEST_{template_type}_{uuid.uuid4().hex[:6]}",
                "type": template_type,
                "subject_template": f"Test {template_type} - {{name}}",
                "body_template": f"<p>This is a {template_type} email.</p>",
                "variables": ["name"],
                "enable_ai_personalization": True
            }
            
            response = requests.post(f"{BASE_URL}/api/email/templates", json=payload)
            assert response.status_code == 200
            print(f"✓ Created {template_type} template")


class TestEmailEvents:
    """Email Event Engine tests with idempotency"""
    
    def test_trigger_event_user_signup(self):
        """Test triggering user signup event"""
        unique_key = f"signup-{uuid.uuid4().hex}"
        payload = {
            "type": "user_signup",
            "payload": {
                "email": f"test_{uuid.uuid4().hex[:6]}@prohouzing.vn",
                "name": "Test User",
                "user_id": str(uuid.uuid4())
            },
            "idempotency_key": unique_key
        }
        
        response = requests.post(f"{BASE_URL}/api/email/event", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("duplicate") is False
        assert "event_id" in data
        print(f"✓ Event triggered: {data['event_id']}")
        return data
    
    def test_event_idempotency(self):
        """Test that duplicate events are rejected"""
        idempotency_key = f"idem-{uuid.uuid4().hex}"
        payload = {
            "type": "user_signup",
            "payload": {
                "email": "idempotent@test.com",
                "name": "Idem Test"
            },
            "idempotency_key": idempotency_key
        }
        
        # First request
        res1 = requests.post(f"{BASE_URL}/api/email/event", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1.get("duplicate") is False
        
        # Second request with same idempotency key
        res2 = requests.post(f"{BASE_URL}/api/email/event", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2.get("duplicate") is True
        print(f"✓ Idempotency check passed")
    
    def test_trigger_event_user_birthday(self):
        """Test triggering user birthday event"""
        payload = {
            "type": "user_birthday",
            "payload": {
                "email": f"birthday_{uuid.uuid4().hex[:6]}@test.com",
                "name": "Birthday User",
                "user_id": str(uuid.uuid4())
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/email/event", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        print(f"✓ Birthday event triggered")
    
    def test_trigger_event_invalid_type(self):
        """Test that invalid event type returns error"""
        payload = {
            "type": "invalid_event_type",
            "payload": {"email": "test@test.com"}
        }
        
        response = requests.post(f"{BASE_URL}/api/email/event", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is False
        assert "valid_types" in data
        print(f"✓ Invalid event type rejected correctly")
    
    def test_event_stats(self):
        """Test getting event statistics"""
        response = requests.get(f"{BASE_URL}/api/email/events/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "by_status" in data
        print(f"✓ Event stats: total={data['total']}")


class TestDraftGeneration:
    """AI Draft Generation tests"""
    
    def test_generate_draft_without_template(self):
        """Test generating draft without template (uses default)"""
        payload = {
            "recipient_email": f"draft_{uuid.uuid4().hex[:6]}@test.com",
            "recipient_name": "Draft Test User",
            "variables": {
                "subject": "Test Subject",
                "content": "This is test content"
            },
            "use_ai": False  # Disable AI for faster test
        }
        
        response = requests.post(f"{BASE_URL}/api/email/draft/generate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "draft_id" in data
        assert "subject" in data
        assert "content" in data
        print(f"✓ Draft generated: {data['draft_id']}")
        return data["draft_id"]
    
    def test_generate_draft_with_ai(self):
        """Test generating draft with AI enhancement"""
        payload = {
            "recipient_email": "ai_draft@test.com",
            "recipient_name": "AI Test User",
            "variables": {
                "subject": "AI Enhanced Email",
                "content": "This content should be enhanced by AI"
            },
            "use_ai": True
        }
        
        response = requests.post(f"{BASE_URL}/api/email/draft/generate", json=payload, timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "draft_id" in data
        # AI enhancement is optional based on configuration
        print(f"✓ Draft with AI generated: ai_enhanced={data.get('ai_enhanced')}")
    
    def test_list_drafts(self):
        """Test listing drafts"""
        response = requests.get(f"{BASE_URL}/api/email/drafts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} drafts")


class TestEmailSending:
    """Email Sending and Queue tests"""
    
    def test_send_email_direct(self):
        """Test sending email directly"""
        payload = {
            "to_email": f"direct_{uuid.uuid4().hex[:6]}@prohouzing.vn",
            "subject": "Direct Send Test",
            "content": "<h1>Test Email</h1><p>This is a direct send test.</p>"
        }
        
        response = requests.post(f"{BASE_URL}/api/email/send", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "job_id" in data
        print(f"✓ Email sent: job_id={data['job_id']}")
        return data["job_id"]
    
    def test_send_email_with_idempotency(self):
        """Test email sending with idempotency key"""
        idempotency_key = f"send-{uuid.uuid4().hex}"
        payload = {
            "to_email": "idem_send@test.com",
            "subject": "Idempotent Send Test",
            "content": "<p>Test content</p>",
            "idempotency_key": idempotency_key
        }
        
        # First send
        res1 = requests.post(f"{BASE_URL}/api/email/send", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1.get("duplicate") is False
        
        # Second send with same key
        res2 = requests.post(f"{BASE_URL}/api/email/send", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2.get("duplicate") is True
        print(f"✓ Send idempotency check passed")


class TestQueueAndStats:
    """Queue management and statistics tests"""
    
    def test_queue_stats(self):
        """Test getting queue statistics"""
        response = requests.get(f"{BASE_URL}/api/email/queue/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "queued" in data
        assert "sent" in data
        assert "failed" in data
        assert "sending" in data
        assert "retrying" in data
        print(f"✓ Queue stats: queued={data['queued']}, sent={data['sent']}")
    
    def test_process_queue(self):
        """Test manual queue processing"""
        response = requests.post(f"{BASE_URL}/api/email/queue/process?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        print(f"✓ Queue processing triggered")
    
    def test_list_jobs(self):
        """Test listing email jobs"""
        response = requests.get(f"{BASE_URL}/api/email/jobs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} jobs")


class TestCampaigns:
    """Email Campaign tests"""
    
    @pytest.fixture
    def template_id(self):
        """Create a template for campaign testing"""
        payload = {
            "name": f"TEST_Campaign_Template_{uuid.uuid4().hex[:6]}",
            "type": "marketing",
            "subject_template": "Campaign: {{subject}}",
            "body_template": "<h1>Campaign Email</h1><p>{{content}}</p>",
            "variables": ["subject", "content"]
        }
        response = requests.post(f"{BASE_URL}/api/email/templates", json=payload)
        return response.json()["template_id"]
    
    def test_create_campaign(self, template_id):
        """Test creating an email campaign"""
        payload = {
            "name": f"TEST_Campaign_{uuid.uuid4().hex[:6]}",
            "template_id": template_id,
            "segment": "all"
        }
        
        response = requests.post(f"{BASE_URL}/api/email/campaigns", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "campaign_id" in data
        print(f"✓ Campaign created: {data['campaign_id']}")
        return data["campaign_id"]
    
    def test_list_campaigns(self):
        """Test listing campaigns"""
        response = requests.get(f"{BASE_URL}/api/email/campaigns")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} campaigns")
    
    def test_get_campaign_by_id(self, template_id):
        """Test getting campaign by ID"""
        # Create campaign
        create_payload = {
            "name": f"TEST_Get_Campaign_{uuid.uuid4().hex[:6]}",
            "template_id": template_id,
            "segment": "active_users"
        }
        create_res = requests.post(f"{BASE_URL}/api/email/campaigns", json=create_payload)
        campaign_id = create_res.json()["campaign_id"]
        
        # Get campaign
        response = requests.get(f"{BASE_URL}/api/email/campaigns/{campaign_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("id") == campaign_id
        print(f"✓ Retrieved campaign: {campaign_id}")


class TestAnalytics:
    """Email Analytics tests"""
    
    def test_overall_analytics(self):
        """Test getting overall analytics"""
        response = requests.get(f"{BASE_URL}/api/email/analytics/overall?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "period_days" in data
        assert "total_sent" in data
        assert "open_rate" in data
        assert "click_rate" in data
        print(f"✓ Overall analytics: sent={data['total_sent']}, open_rate={data['open_rate']}%")
    
    def test_logs_listing(self):
        """Test listing email logs"""
        response = requests.get(f"{BASE_URL}/api/email/logs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} logs")


class TestApprovalWorkflow:
    """Approval Workflow tests"""
    
    def test_pending_approvals_list(self):
        """Test getting pending approvals list"""
        response = requests.get(f"{BASE_URL}/api/email/pending-approvals")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} pending approvals")


class TestSubscribers:
    """Email Subscriber tests"""
    
    def test_list_subscribers(self):
        """Test listing subscribers"""
        response = requests.get(f"{BASE_URL}/api/email/subscribers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} subscribers")


# Cleanup fixture for test data
@pytest.fixture(autouse=True, scope="module")
def cleanup():
    """Cleanup test data after tests complete"""
    yield
    # Note: Templates are soft-deleted, so no explicit cleanup needed
    print("✓ Test module completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
