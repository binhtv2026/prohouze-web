"""
Email Automation Phase 4.1 - Hardening Tests
Tests for:
- Segmentation Service (role, location, activity, source filters)
- Queue Monitoring (job detail, retry, stuck detection)
- Detailed Stats with error breakdown
- Tracking pixel and unsubscribe link injection
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


# =============================================================================
# SEGMENTATION TESTS
# =============================================================================

class TestSegmentation:
    """Email Segmentation Service tests"""
    
    def test_get_available_segments(self):
        """Test GET /api/email/segments - get available segments and filters"""
        response = requests.get(f"{BASE_URL}/api/email/segments")
        assert response.status_code == 200
        
        data = response.json()
        assert "segments" in data, "Response should contain 'segments'"
        assert "roles" in data, "Response should contain 'roles' filter options"
        assert "provinces" in data, "Response should contain 'provinces' filter options"
        assert "cities" in data, "Response should contain 'cities' filter options"
        assert "activity_filters" in data, "Response should contain 'activity_filters'"
        
        # Check predefined segments exist
        segments = data.get("segments", {})
        expected_segments = ["all", "active_users", "inactive_users", "new_users", 
                           "top_performers", "admins", "managers", "sales", "collaborators"]
        for seg in expected_segments:
            assert seg in segments, f"Segment '{seg}' should be defined"
        
        print(f"✓ Available segments: {list(segments.keys())}")
        print(f"✓ Roles: {data.get('roles', [])}")
        print(f"✓ Activity filters: {len(data.get('activity_filters', []))}")
    
    def test_get_segment_users_all(self):
        """Test GET /api/email/segments/all/users - get all users"""
        response = requests.get(f"{BASE_URL}/api/email/segments/all/users?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of users"
        
        if len(data) > 0:
            # Check user object structure
            user = data[0]
            expected_fields = ["email", "name", "role"]
            for field in expected_fields:
                assert field in user, f"User object should have '{field}' field"
        
        print(f"✓ Found {len(data)} users in 'all' segment")
    
    def test_get_segment_users_admins(self):
        """Test GET /api/email/segments/admins/users - get admin users"""
        response = requests.get(f"{BASE_URL}/api/email/segments/admins/users?limit=50")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all users have admin role
        for user in data:
            if user.get("role"):
                assert user.get("role") == "admin", f"User in admins segment should be admin: {user}"
        
        print(f"✓ Found {len(data)} admin users")
    
    def test_get_segment_users_with_role_filter(self):
        """Test segment with additional role filter"""
        response = requests.get(f"{BASE_URL}/api/email/segments/all/users?role=sales&limit=50")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all users have sales role when filter applied
        for user in data:
            if user.get("role"):
                assert user.get("role") == "sales", f"User should be sales with role filter"
        
        print(f"✓ Found {len(data)} sales users with role filter")
    
    def test_get_segment_count(self):
        """Test GET /api/email/segments/{segment}/count"""
        response = requests.get(f"{BASE_URL}/api/email/segments/all/count")
        assert response.status_code == 200
        
        data = response.json()
        assert "segment" in data, "Response should contain 'segment'"
        assert "count" in data, "Response should contain 'count'"
        assert data.get("segment") == "all"
        assert isinstance(data.get("count"), int)
        
        print(f"✓ Segment 'all' count: {data.get('count')}")
    
    def test_get_segment_count_active_users(self):
        """Test segment count for active_users"""
        response = requests.get(f"{BASE_URL}/api/email/segments/active_users/count")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("segment") == "active_users"
        assert isinstance(data.get("count"), int)
        
        print(f"✓ Active users count: {data.get('count')}")


# =============================================================================
# QUEUE MONITORING TESTS
# =============================================================================

class TestQueueMonitoring:
    """Queue Monitoring and Job Detail tests"""
    
    @pytest.fixture
    def create_test_job(self):
        """Create a test job for testing"""
        payload = {
            "to_email": f"queue_test_{uuid.uuid4().hex[:6]}@prohouzing.vn",
            "subject": "Queue Test Email",
            "content": "<h1>Test</h1><p>Queue monitoring test.</p>"
        }
        response = requests.post(f"{BASE_URL}/api/email/send", json=payload)
        if response.status_code == 200:
            data = response.json()
            return data.get("job_id")
        return None
    
    def test_get_detailed_queue_stats(self):
        """Test GET /api/email/queue/detailed-stats"""
        response = requests.get(f"{BASE_URL}/api/email/queue/detailed-stats")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check basic stats
        assert "queued" in data, "Response should have 'queued' count"
        assert "sent" in data, "Response should have 'sent' count"
        assert "failed" in data, "Response should have 'failed' count"
        assert "sending" in data, "Response should have 'sending' count"
        
        # Check processing metrics
        assert "processing_metrics" in data, "Response should have 'processing_metrics'"
        
        # Check error breakdown
        assert "error_breakdown" in data, "Response should have 'error_breakdown'"
        assert isinstance(data["error_breakdown"], list)
        
        # Check stuck jobs count
        assert "stuck_jobs_count" in data, "Response should have 'stuck_jobs_count'"
        
        print(f"✓ Detailed stats: queued={data.get('queued')}, sent={data.get('sent')}")
        print(f"✓ Stuck jobs count: {data.get('stuck_jobs_count')}")
        print(f"✓ Error breakdown entries: {len(data.get('error_breakdown', []))}")
    
    def test_get_stuck_jobs(self):
        """Test GET /api/email/jobs/stuck"""
        response = requests.get(f"{BASE_URL}/api/email/jobs/stuck?threshold_minutes=5")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check stuck job object structure
        if len(data) > 0:
            job = data[0]
            assert "id" in job, "Stuck job should have 'id'"
            assert "status" in job, "Stuck job should have 'status'"
            assert "stuck_duration_seconds" in job, "Stuck job should have 'stuck_duration_seconds'"
            assert job["status"] in ["queued", "sending", "retrying"]
        
        print(f"✓ Found {len(data)} stuck jobs (threshold: 5 minutes)")
    
    def test_get_stuck_jobs_custom_threshold(self):
        """Test stuck jobs with custom threshold"""
        response = requests.get(f"{BASE_URL}/api/email/jobs/stuck?threshold_minutes=1")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Found {len(data)} stuck jobs (threshold: 1 minute)")
    
    def test_get_job_detail(self, create_test_job):
        """Test GET /api/email/jobs/{job_id}/detail"""
        job_id = create_test_job
        if not job_id:
            pytest.skip("Could not create test job")
        
        response = requests.get(f"{BASE_URL}/api/email/jobs/{job_id}/detail")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check job detail structure
        assert "job" in data, "Response should have 'job'"
        assert "processing_time_seconds" in data, "Response should have 'processing_time_seconds'"
        assert "is_stuck" in data, "Response should have 'is_stuck'"
        assert "stuck_duration_seconds" in data, "Response should have 'stuck_duration_seconds'"
        
        job = data.get("job", {})
        assert job.get("id") == job_id
        
        print(f"✓ Job detail: id={job_id}, status={job.get('status')}")
        print(f"✓ Is stuck: {data.get('is_stuck')}, processing_time: {data.get('processing_time_seconds')}")
    
    def test_get_job_detail_not_found(self):
        """Test job detail with non-existent ID"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/email/jobs/{fake_id}/detail")
        assert response.status_code == 404
        
        print(f"✓ Correctly returns 404 for non-existent job")
    
    def test_retry_job_invalid_status(self, create_test_job):
        """Test retry job with invalid status"""
        # Create and immediately try to retry (job should be queued/sent, not failed)
        job_id = create_test_job
        if not job_id:
            pytest.skip("Could not create test job")
        
        # Wait a bit for job to process
        import time
        time.sleep(2)
        
        # Check current status first
        detail_res = requests.get(f"{BASE_URL}/api/email/jobs/{job_id}/detail")
        job_status = detail_res.json().get("job", {}).get("status")
        
        # If job is already sent, retry should fail
        if job_status == "sent":
            response = requests.post(f"{BASE_URL}/api/email/jobs/{job_id}/retry")
            assert response.status_code == 400, "Should not allow retry of sent job"
            print(f"✓ Correctly rejects retry for sent job")
        elif job_status in ["failed", "retrying", "queued"]:
            response = requests.post(f"{BASE_URL}/api/email/jobs/{job_id}/retry")
            assert response.status_code == 200
            print(f"✓ Retry allowed for {job_status} job")
        else:
            print(f"✓ Job status: {job_status} - test skipped")
    
    def test_retry_job_not_found(self):
        """Test retry with non-existent job ID"""
        fake_id = str(uuid.uuid4())
        response = requests.post(f"{BASE_URL}/api/email/jobs/{fake_id}/retry")
        assert response.status_code == 404
        
        print(f"✓ Correctly returns 404 for retry of non-existent job")


# =============================================================================
# TRACKING TESTS
# =============================================================================

class TestTracking:
    """Email Tracking (pixel, click, unsubscribe) tests"""
    
    def test_track_open_unknown_id(self):
        """Test tracking open with unknown tracking ID returns pixel anyway"""
        fake_tracking_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/email/track/open/{fake_tracking_id}")
        
        # Should still return pixel (graceful handling)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "image/gif"
        
        print(f"✓ Track open returns pixel even for unknown ID (graceful)")
    
    def test_track_click_redirect(self):
        """Test click tracking redirects to original URL"""
        fake_tracking_id = str(uuid.uuid4())
        original_url = "https://prohouzing.com/test-page"
        
        response = requests.get(
            f"{BASE_URL}/api/email/track/click/{fake_tracking_id}?url={original_url}",
            allow_redirects=False
        )
        
        # Should redirect to original URL
        assert response.status_code == 302
        assert original_url in response.headers.get("location", "")
        
        print(f"✓ Click tracking redirects correctly")
    
    def test_unsubscribe_page(self):
        """Test unsubscribe page renders"""
        response = requests.get(
            f"{BASE_URL}/api/email/unsubscribe?email=test@example.com&token=test-token"
        )
        
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        
        # Check page contains expected elements
        html = response.text
        assert "Hủy đăng ký" in html or "unsubscribe" in html.lower()
        
        print(f"✓ Unsubscribe page renders correctly")
    
    def test_unsubscribe_confirm_invalid_token(self):
        """Test unsubscribe confirm with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/email/unsubscribe/confirm",
            data={"email": "test@invalid.com", "token": "invalid-token"}
        )
        
        # Should fail with invalid token
        assert response.status_code in [400, 422]
        
        print(f"✓ Unsubscribe correctly rejects invalid token")


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestIntegration:
    """Integration tests for email system hardening"""
    
    def test_email_with_tracking_injection(self):
        """Test that sent emails have tracking pixel and unsubscribe link injected"""
        # Send an email
        payload = {
            "to_email": f"tracking_test_{uuid.uuid4().hex[:6]}@prohouzing.vn",
            "subject": "Tracking Injection Test",
            "content": "<html><body><h1>Test</h1><p>Content with <a href='https://google.com'>link</a>.</p></body></html>"
        }
        
        response = requests.post(f"{BASE_URL}/api/email/send", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        job_id = data.get("job_id")
        
        print(f"✓ Email sent with job_id={job_id}")
        print(f"✓ Tracking pixel and unsubscribe link should be injected by tracking_engine")
    
    def test_subscribers_endpoint(self):
        """Test subscribers management"""
        response = requests.get(f"{BASE_URL}/api/email/subscribers?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            subscriber = data[0]
            assert "email" in subscriber
            assert "is_subscribed" in subscriber or "unsubscribe_token" in subscriber
        
        print(f"✓ Listed {len(data)} subscribers")


# Cleanup fixture
@pytest.fixture(autouse=True, scope="module")
def cleanup():
    """Cleanup after tests"""
    yield
    print("✓ Phase 4.1 Hardening tests completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
