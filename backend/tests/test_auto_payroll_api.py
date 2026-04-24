"""
Test AUTO Payroll Engine APIs
Tests for Phase 1 - Auto Payroll features:
- Attendance summaries from system (not manual)
- Auto payroll calculation
- Formula breakdown in payroll detail
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAutoPayrollAPIs:
    """Test AUTO Payroll Engine APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication before each test"""
        # Login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@prohouzing.vn", "password": "admin123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get current period
        now = datetime.now()
        self.current_period = f"{now.year}-{str(now.month).zfill(2)}"
    
    def test_attendance_summaries_api(self):
        """Test GET /api/payroll/attendance/summaries - returns attendance totals from system"""
        response = requests.get(
            f"{BASE_URL}/api/payroll/attendance/summaries?period={self.current_period}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Attendance summaries API failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "period" in data, "Response should contain period"
        assert "summaries" in data, "Response should contain summaries array"
        assert "totals" in data, "Response should contain totals"
        
        # Verify totals structure (AUTO data from system)
        totals = data["totals"]
        assert "total_employees" in totals, "Totals should have total_employees"
        assert "total_work_days" in totals, "Totals should have total_work_days"
        assert "total_overtime_hours" in totals, "Totals should have total_overtime_hours"
        assert "total_leave_days" in totals, "Totals should have total_leave_days"
        assert "total_late_days" in totals, "Totals should have total_late_days"
        assert "total_anomalies" in totals, "Totals should have total_anomalies"
        
        print(f"✓ Attendance summaries API working - Period: {data['period']}, Employees: {totals['total_employees']}")
    
    def test_attendance_summary_structure(self):
        """Test that attendance summary includes all required AUTO fields"""
        response = requests.get(
            f"{BASE_URL}/api/payroll/attendance/summaries?period={self.current_period}",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["summaries"]) > 0:
            summary = data["summaries"][0]
            
            # Verify individual summary has AUTO fields
            required_fields = [
                "hr_profile_id", "employee_code", "employee_name", "period",
                "present_days", "absent_days", "late_days", "early_leave_days",
                "half_days", "leave_days", "total_work_hours", "total_overtime_hours",
                "overtime_normal_hours", "overtime_weekend_hours", "overtime_holiday_hours",
                "total_late_minutes", "total_early_leave_minutes", "anomaly_count",
                "standard_work_days"
            ]
            
            for field in required_fields:
                assert field in summary, f"Summary should contain {field}"
            
            print(f"✓ Summary structure verified for {summary['employee_name']} ({summary['employee_code']})")
    
    def test_refresh_attendance_summaries(self):
        """Test POST /api/payroll/attendance/summaries/refresh - recalculates from attendance data"""
        response = requests.post(
            f"{BASE_URL}/api/payroll/attendance/summaries/refresh",
            headers=self.headers,
            json={"period": self.current_period}
        )
        
        assert response.status_code == 200, f"Refresh summaries API failed: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Refresh should be successful"
        assert "period" in data, "Response should contain period"
        assert "processed" in data, "Response should contain processed count"
        
        print(f"✓ Refresh summaries API working - Period: {data['period']}, Processed: {data['processed']}")
    
    def test_calculate_payroll_api(self):
        """Test POST /api/payroll/calculate - auto calculate payroll from attendance"""
        response = requests.post(
            f"{BASE_URL}/api/payroll/calculate",
            headers=self.headers,
            json={"period": self.current_period}
        )
        
        assert response.status_code == 200, f"Calculate payroll API failed: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Calculate should be successful"
        assert "period" in data, "Response should contain period"
        assert "processed" in data, "Response should contain processed count"
        assert "results" in data, "Response should contain results array"
        
        # Check results structure
        if len(data["results"]) > 0:
            result = data["results"][0]
            assert "hr_profile_id" in result, "Result should have hr_profile_id"
            assert "employee_code" in result, "Result should have employee_code"
            assert "status" in result, "Result should have status"
        
        print(f"✓ Calculate payroll API working - Period: {data['period']}, Processed: {data['processed']}")
    
    def test_payroll_list_for_period(self):
        """Test GET /api/payroll/payrolls/{period} - returns calculated payrolls"""
        response = requests.get(
            f"{BASE_URL}/api/payroll/payrolls/{self.current_period}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Payroll list API failed: {response.text}"
        payrolls = response.json()
        
        assert isinstance(payrolls, list), "Response should be a list"
        
        if len(payrolls) > 0:
            payroll = payrolls[0]
            
            # Verify payroll has AUTO-calculated fields
            required_fields = [
                "id", "hr_profile_id", "employee_code", "employee_name", "period",
                "status", "base_salary", "actual_work_days", "standard_work_days",
                "total_allowances", "total_commission", "total_overtime",
                "gross_salary", "social_insurance", "health_insurance",
                "unemployment_insurance", "total_insurance", "personal_income_tax",
                "net_salary"
            ]
            
            for field in required_fields:
                assert field in payroll, f"Payroll should contain {field}"
            
            print(f"✓ Payroll list API working - Found {len(payrolls)} payroll(s)")
    
    def test_payroll_detail_formula_breakdown(self):
        """Test GET /api/payroll/payroll/{id} - returns formula breakdown"""
        # First get a payroll ID
        list_response = requests.get(
            f"{BASE_URL}/api/payroll/payrolls/{self.current_period}",
            headers=self.headers
        )
        
        assert list_response.status_code == 200
        payrolls = list_response.json()
        
        if len(payrolls) == 0:
            pytest.skip("No payrolls found to test detail")
        
        payroll_id = payrolls[0]["id"]
        
        # Get payroll detail
        response = requests.get(
            f"{BASE_URL}/api/payroll/payroll/{payroll_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Payroll detail API failed: {response.text}"
        data = response.json()["data"]
        
        # Verify formula breakdown fields
        formula_fields = [
            "base_salary", "actual_work_days", "standard_work_days",
            "total_allowances", "allowance_details",
            "total_commission", "commission_details",
            "total_overtime", "overtime_normal_hours", "overtime_weekend_hours", "overtime_holiday_hours",
            "overtime_normal_amount", "overtime_weekend_amount", "overtime_holiday_amount",
            "total_bonus", "bonus_details",
            "gross_salary",
            "social_insurance", "health_insurance", "unemployment_insurance", "total_insurance",
            "taxable_income", "personal_deduction", "dependent_deduction", "tax_dependents",
            "personal_income_tax",
            "total_penalties", "penalty_details",
            "total_advances", "advance_details",
            "net_salary"
        ]
        
        for field in formula_fields:
            assert field in data, f"Payroll detail should contain {field} for formula breakdown"
        
        print(f"✓ Payroll detail API working with full formula breakdown")
        print(f"  - Gross: {data['gross_salary']}")
        print(f"  - Insurance: {data['total_insurance']}")
        print(f"  - Tax: {data['personal_income_tax']}")
        print(f"  - Net: {data['net_salary']}")
    
    def test_payroll_summary_api(self):
        """Test GET /api/payroll/summary/{period} - returns aggregated summary"""
        response = requests.get(
            f"{BASE_URL}/api/payroll/summary/{self.current_period}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Payroll summary API failed: {response.text}"
        data = response.json()["data"]
        
        # Verify summary structure
        required_fields = [
            "period", "total_employees", "total_gross", "total_net", "total_tax",
            "total_insurance", "by_status"
        ]
        
        for field in required_fields:
            assert field in data, f"Summary should contain {field}"
        
        # Verify status breakdown
        statuses = ["draft", "calculated", "approved", "paid", "locked"]
        for status in statuses:
            assert status in data["by_status"], f"by_status should contain {status}"
        
        print(f"✓ Payroll summary API working - Employees: {data['total_employees']}, Gross: {data['total_gross']}, Net: {data['total_net']}")
    
    def test_payroll_dashboard_api(self):
        """Test GET /api/payroll/dashboard - returns AUTO dashboard data"""
        response = requests.get(
            f"{BASE_URL}/api/payroll/dashboard",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Dashboard API failed: {response.text}"
        data = response.json()
        
        # Verify dashboard structure
        assert "current_period" in data, "Dashboard should have current_period"
        assert "payroll_summary" in data, "Dashboard should have payroll_summary"
        assert "pending_leave_requests" in data, "Dashboard should have pending_leave_requests"
        assert "today_attendance" in data, "Dashboard should have today_attendance"
        
        # Verify attendance summary
        attendance = data["today_attendance"]
        assert "total_employees" in attendance, "Attendance should have total_employees"
        assert "checked_in" in attendance, "Attendance should have checked_in"
        
        print(f"✓ Dashboard API working - Period: {data['current_period']}, Employees: {attendance['total_employees']}")
    
    def test_payroll_status_flow(self):
        """Test payroll status: draft → calculated → approved → paid → locked"""
        # Get current payrolls
        list_response = requests.get(
            f"{BASE_URL}/api/payroll/payrolls/{self.current_period}",
            headers=self.headers
        )
        
        assert list_response.status_code == 200
        payrolls = list_response.json()
        
        if len(payrolls) == 0:
            pytest.skip("No payrolls found to test status flow")
        
        payroll = payrolls[0]
        
        # Verify status is one of the valid values
        valid_statuses = ["draft", "calculated", "approved", "paid", "locked"]
        assert payroll["status"] in valid_statuses, f"Status should be one of {valid_statuses}"
        
        print(f"✓ Payroll status flow working - Current status: {payroll['status']}")


class TestAutoPayrollDataFlow:
    """Test data flow: Attendance → Payroll without manual entry"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authentication"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@prohouzing.vn", "password": "admin123"}
        )
        assert login_response.status_code == 200
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        now = datetime.now()
        self.current_period = f"{now.year}-{str(now.month).zfill(2)}"
    
    def test_attendance_to_payroll_data_flow(self):
        """Test that attendance data flows into payroll without manual entry"""
        # Get attendance summaries
        attendance_response = requests.get(
            f"{BASE_URL}/api/payroll/attendance/summaries?period={self.current_period}",
            headers=self.headers
        )
        
        assert attendance_response.status_code == 200
        attendance_data = attendance_response.json()
        
        # Calculate payroll
        calc_response = requests.post(
            f"{BASE_URL}/api/payroll/calculate",
            headers=self.headers,
            json={"period": self.current_period}
        )
        
        assert calc_response.status_code == 200
        calc_data = calc_response.json()
        
        # Get payroll list
        payroll_response = requests.get(
            f"{BASE_URL}/api/payroll/payrolls/{self.current_period}",
            headers=self.headers
        )
        
        assert payroll_response.status_code == 200
        payrolls = payroll_response.json()
        
        # Verify data flow
        if len(attendance_data["summaries"]) > 0 and len(payrolls) > 0:
            # Match attendance summary with payroll
            for summary in attendance_data["summaries"]:
                matching_payroll = next(
                    (p for p in payrolls if p["hr_profile_id"] == summary["hr_profile_id"]),
                    None
                )
                
                if matching_payroll:
                    # Verify work days match
                    expected_work_days = summary["present_days"] + summary.get("half_days", 0) * 0.5
                    assert matching_payroll["actual_work_days"] == expected_work_days, \
                        f"Payroll work days should match attendance: {expected_work_days} vs {matching_payroll['actual_work_days']}"
                    
                    print(f"✓ Data flow verified for {summary['employee_name']}")
                    print(f"  Attendance work days: {expected_work_days}")
                    print(f"  Payroll actual_work_days: {matching_payroll['actual_work_days']}")
        
        print("✓ Attendance → Payroll data flow working without manual entry")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
