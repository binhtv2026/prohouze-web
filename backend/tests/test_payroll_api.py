"""
Payroll & Workforce Management API Tests
ProHouzing HR AI Platform - Phase 1

Tests for:
- Payroll Dashboard
- Attendance (check-in/out)
- Leave Management
- Payroll Calculation
- Salary Structure
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPayrollAPIs:
    """Tests for Payroll & Workforce Management APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for all tests - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")  # Note: API returns access_token
            self.session.headers.update({'Authorization': f'Bearer {self.token}'})
            print(f"✓ Login successful")
        else:
            pytest.skip(f"Login failed: {login_response.status_code}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_payroll_dashboard(self):
        """Test GET /api/payroll/dashboard"""
        response = self.session.get(f"{BASE_URL}/api/payroll/dashboard")
        print(f"Dashboard status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "current_period" in data, "Missing current_period"
        assert "payroll_summary" in data, "Missing payroll_summary"
        assert "today_attendance" in data, "Missing today_attendance"
        assert "pending_leave_requests" in data, "Missing pending_leave_requests"
        
        print(f"✓ Dashboard returns: current_period={data['current_period']}, pending_leaves={data['pending_leave_requests']}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # WORK SHIFTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_shifts(self):
        """Test GET /api/payroll/shifts"""
        response = self.session.get(f"{BASE_URL}/api/payroll/shifts")
        print(f"Get shifts status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} work shifts")
    
    def test_init_default_shifts(self):
        """Test POST /api/payroll/shifts/init-defaults"""
        response = self.session.post(f"{BASE_URL}/api/payroll/shifts/init-defaults")
        print(f"Init default shifts status: {response.status_code}")
        
        # May return 200 even if shifts already exist
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        print(f"✓ Default shifts initialized")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ATTENDANCE
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_today_attendance(self):
        """Test GET /api/payroll/attendance/today - may return 404 for admin without HR profile"""
        response = self.session.get(f"{BASE_URL}/api/payroll/attendance/today")
        print(f"Today attendance status: {response.status_code}")
        
        # Admin may not have HR profile, so 404 is expected
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data, "Missing data key"
            print(f"✓ Today attendance data: {data.get('data')}")
        else:
            print(f"✓ 404 expected - admin user doesn't have HR profile")
    
    def test_get_attendance_records(self):
        """Test GET /api/payroll/attendance/records"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/payroll/attendance/records", params={
            "start_date": today,
            "end_date": today,
            "limit": 100
        })
        print(f"Attendance records status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} attendance records for {today}")
    
    def test_check_in_without_profile(self):
        """Test POST /api/payroll/attendance/check-in - should fail for admin without HR profile"""
        response = self.session.post(f"{BASE_URL}/api/payroll/attendance/check-in", json={})
        print(f"Check-in status: {response.status_code}")
        
        # Admin doesn't have HR profile, should return 404
        assert response.status_code in [200, 400, 404], f"Expected 200/400/404, got {response.status_code}"
        
        if response.status_code == 404:
            print(f"✓ 404 expected - admin user doesn't have HR profile")
        elif response.status_code == 400:
            data = response.json()
            print(f"✓ Check-in error (expected): {data.get('detail')}")
        else:
            data = response.json()
            print(f"✓ Check-in successful: {data}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEAVE MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_leave_requests(self):
        """Test GET /api/payroll/leave/requests"""
        response = self.session.get(f"{BASE_URL}/api/payroll/leave/requests", params={
            "limit": 50
        })
        print(f"Leave requests status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} leave requests")
    
    def test_get_pending_leave_requests(self):
        """Test GET /api/payroll/leave/requests with pending_only"""
        response = self.session.get(f"{BASE_URL}/api/payroll/leave/requests", params={
            "pending_only": True,
            "limit": 50
        })
        print(f"Pending leave requests status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All returned should be pending
        for request in data:
            assert request.get("status") == "pending", f"Expected pending status, got {request.get('status')}"
        
        print(f"✓ Got {len(data)} pending leave requests")
    
    def test_get_leave_balance(self):
        """Test GET /api/payroll/leave/balance - may fail for admin without HR profile"""
        response = self.session.get(f"{BASE_URL}/api/payroll/leave/balance")
        print(f"Leave balance status: {response.status_code}")
        
        # Admin may not have HR profile
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list), "Response should be a list"
            print(f"✓ Got {len(data)} leave balances")
        else:
            print(f"✓ 404 expected - admin user doesn't have HR profile")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL - MY PAYROLLS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_my_payrolls(self):
        """Test GET /api/payroll/my-payrolls"""
        response = self.session.get(f"{BASE_URL}/api/payroll/my-payrolls", params={
            "limit": 12
        })
        print(f"My payrolls status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} payroll records for current user")
    
    def test_get_payrolls_for_period(self):
        """Test GET /api/payroll/payrolls/{period}"""
        current_period = datetime.now().strftime("%Y-%m")
        
        response = self.session.get(f"{BASE_URL}/api/payroll/payrolls/{current_period}")
        print(f"Payrolls for period {current_period} status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} payroll records for period {current_period}")
    
    def test_get_payroll_summary(self):
        """Test GET /api/payroll/summary/{period}"""
        current_period = datetime.now().strftime("%Y-%m")
        
        response = self.session.get(f"{BASE_URL}/api/payroll/summary/{current_period}")
        print(f"Payroll summary for {current_period} status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Missing data key"
        
        summary = data["data"]
        assert "period" in summary, "Missing period in summary"
        assert "total_employees" in summary, "Missing total_employees"
        assert "total_gross" in summary, "Missing total_gross"
        assert "total_net" in summary, "Missing total_net"
        assert "total_tax" in summary, "Missing total_tax"
        
        print(f"✓ Payroll summary: employees={summary.get('total_employees')}, gross={summary.get('total_gross')}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL CALCULATION (Admin only)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_calculate_payroll(self):
        """Test POST /api/payroll/calculate - calculate payroll for current period"""
        current_period = datetime.now().strftime("%Y-%m")
        
        response = self.session.post(f"{BASE_URL}/api/payroll/calculate", json={
            "period": current_period
        })
        print(f"Calculate payroll status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True or "period" in data, "Expected success response"
        print(f"✓ Payroll calculation: processed={data.get('processed', 'N/A')}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUDIT LOGS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_audit_logs(self):
        """Test GET /api/payroll/audit-logs - admin only"""
        response = self.session.get(f"{BASE_URL}/api/payroll/audit-logs", params={
            "limit": 10
        })
        print(f"Audit logs status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} audit logs")
    
    def test_get_salary_view_logs(self):
        """Test GET /api/payroll/salary-view-logs - admin only"""
        response = self.session.get(f"{BASE_URL}/api/payroll/salary-view-logs", params={
            "limit": 10
        })
        print(f"Salary view logs status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got {len(data)} salary view logs")


class TestPayrollWithHRProfile:
    """Tests that require an existing HR profile"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token and existing HR profile"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        
        data = login_response.json()
        self.token = data.get("access_token")  # Note: API returns access_token
        self.session.headers.update({'Authorization': f'Bearer {self.token}'})
        
        # Get existing HR profile for testing
        profiles_response = self.session.get(f"{BASE_URL}/api/hr/profiles", params={"limit": 1})
        if profiles_response.status_code == 200:
            profiles = profiles_response.json()
            if profiles and len(profiles) > 0:
                self.test_profile_id = profiles[0].get("id")
                self.test_profile_code = profiles[0].get("employee_code")
                print(f"✓ Using HR profile: {self.test_profile_code}")
            else:
                self.test_profile_id = None
                print("No HR profiles found")
        else:
            self.test_profile_id = None
    
    def test_get_attendance_summary(self):
        """Test GET /api/payroll/attendance/summary/{hr_profile_id}/{period}"""
        if not self.test_profile_id:
            pytest.skip("No HR profile available")
        
        current_period = datetime.now().strftime("%Y-%m")
        
        response = self.session.get(
            f"{BASE_URL}/api/payroll/attendance/summary/{self.test_profile_id}/{current_period}"
        )
        print(f"Attendance summary status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Missing data key"
        
        summary = data["data"]
        assert "hr_profile_id" in summary, "Missing hr_profile_id"
        assert "period" in summary, "Missing period"
        assert "total_working_days" in summary, "Missing total_working_days"
        
        print(f"✓ Attendance summary: work_days={summary.get('total_working_days')}, overtime={summary.get('total_overtime_hours')}")
    
    def test_get_salary_structure(self):
        """Test GET /api/payroll/salary-structure/{hr_profile_id}"""
        if not self.test_profile_id:
            pytest.skip("No HR profile available")
        
        response = self.session.get(
            f"{BASE_URL}/api/payroll/salary-structure/{self.test_profile_id}"
        )
        print(f"Salary structure status: {response.status_code}")
        
        # May return 404 if no structure exists
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data, "Missing data key"
            print(f"✓ Salary structure: base_salary={data['data'].get('base_salary')}")
        else:
            print(f"✓ 404 - No salary structure for this employee yet")
    
    def test_create_salary_structure(self):
        """Test POST /api/payroll/salary-structure"""
        if not self.test_profile_id:
            pytest.skip("No HR profile available")
        
        response = self.session.post(f"{BASE_URL}/api/payroll/salary-structure", json={
            "hr_profile_id": self.test_profile_id,
            "effective_from": datetime.now().strftime("%Y-%m-%d"),
            "base_salary": 15000000,  # 15M VND
            "allowances": [
                {"name": "Phụ cấp ăn trưa", "amount": 500000, "is_taxable": False},
                {"name": "Phụ cấp điện thoại", "amount": 300000, "is_taxable": True}
            ],
            "tax_dependents": 0
        })
        print(f"Create salary structure status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        print(f"✓ Salary structure created")


class TestLeaveRequest:
    """Tests for leave request flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token and HR profile"""
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        
        data = login_response.json()
        self.token = data.get("access_token")  # Note: API returns access_token
        self.session.headers.update({'Authorization': f'Bearer {self.token}'})
    
    def test_create_leave_request_without_profile(self):
        """Test POST /api/payroll/leave/request - should fail without HR profile"""
        tomorrow = datetime.now().strftime("%Y-%m-%d")  # Use today for test
        
        response = self.session.post(f"{BASE_URL}/api/payroll/leave/request", json={
            "leave_type": "annual",
            "start_date": tomorrow,
            "end_date": tomorrow,
            "reason": "TEST: Personal leave request"
        })
        print(f"Create leave request status: {response.status_code}")
        
        # Admin doesn't have HR profile, should fail
        assert response.status_code in [200, 400, 404], f"Expected 200/400/404, got {response.status_code}"
        
        if response.status_code == 404:
            print(f"✓ 404 expected - admin doesn't have HR profile")
        elif response.status_code == 400:
            data = response.json()
            print(f"✓ Error (expected): {data.get('detail')}")
        else:
            data = response.json()
            print(f"✓ Leave request created: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
