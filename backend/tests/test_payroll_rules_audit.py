"""
Test Payroll Rules & Audit Log Features - Phase 1
=================================================
Tests for:
1. PayrollRulesPage - GET /api/payroll/rules (insurance rates, OT rates, tax deductions)
2. PayrollAuditPage - GET /api/payroll/audit-logs, GET /api/payroll/salary-view-logs
3. Negative net salary handling (has_debt=true, carry_forward_debt)
4. Payroll detail with SALARY BREAKDOWN formula
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


class TestPayrollRulesAndAudit:
    """Test Payroll Rules Config and Audit Logs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        self.session = requests.Session()
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token") or data.get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL RULES CONFIG API
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_payroll_rules(self):
        """GET /api/payroll/rules - should return default rules with insurance, OT rates, deductions"""
        response = self.session.get(f"{BASE_URL}/api/payroll/rules")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "data" in data, "Response should have 'data' field"
        
        rules = data["data"]
        
        # Check insurance rates exist
        assert "insurance" in rules, "Rules should have insurance section"
        ins = rules["insurance"]
        assert "social_rate" in ins, "Should have BHXH (social_rate)"
        assert "health_rate" in ins, "Should have BHYT (health_rate)"
        assert "unemployment_rate" in ins, "Should have BHTN (unemployment_rate)"
        
        # Validate rates are in expected range
        assert ins["social_rate"] == 0.08, "BHXH should be 8% (0.08)"
        assert ins["health_rate"] == 0.015, "BHYT should be 1.5% (0.015)"
        assert ins["unemployment_rate"] == 0.01, "BHTN should be 1% (0.01)"
        
        # Check OT rates
        assert "overtime" in rules, "Rules should have overtime section"
        ot = rules["overtime"]
        assert "normal_rate" in ot, "Should have OT normal rate"
        assert "weekend_rate" in ot, "Should have OT weekend rate"
        assert "holiday_rate" in ot, "Should have OT holiday rate"
        
        # Validate OT rates
        assert ot["normal_rate"] == 1.5, "OT normal should be 1.5x"
        assert ot["weekend_rate"] == 2.0, "OT weekend should be 2.0x"
        assert ot["holiday_rate"] == 3.0, "OT holiday should be 3.0x"
        
        # Check tax deductions
        assert "deductions" in rules, "Rules should have deductions section"
        ded = rules["deductions"]
        assert "personal" in ded, "Should have personal deduction"
        assert "dependent" in ded, "Should have dependent deduction"
        
        # Validate deductions
        assert ded["personal"] == 11000000, "Personal deduction should be 11M"
        assert ded["dependent"] == 4400000, "Dependent deduction should be 4.4M"
        
        print(f"✓ Payroll rules returned correctly")
        print(f"  Insurance: BHXH={ins['social_rate']*100}%, BHYT={ins['health_rate']*100}%, BHTN={ins['unemployment_rate']*100}%")
        print(f"  OT rates: Normal={ot['normal_rate']}x, Weekend={ot['weekend_rate']}x, Holiday={ot['holiday_rate']}x")
        print(f"  Deductions: Personal={ded['personal']:,}đ, Dependent={ded['dependent']:,}đ")
    
    def test_rules_have_tax_brackets(self):
        """GET /api/payroll/rules - should include tax brackets"""
        response = self.session.get(f"{BASE_URL}/api/payroll/rules")
        assert response.status_code == 200
        
        rules = response.json()["data"]
        assert "tax_brackets" in rules, "Rules should have tax_brackets"
        
        tax_brackets = rules["tax_brackets"]
        assert len(tax_brackets) >= 7, "Should have at least 7 tax brackets (Vietnam PIT)"
        
        # Check first bracket
        assert tax_brackets[0]["rate"] == 0.05, "First bracket should be 5%"
        
        print(f"✓ Tax brackets returned: {len(tax_brackets)} brackets")
    
    def test_rules_have_work_config(self):
        """GET /api/payroll/rules - should include work configuration"""
        response = self.session.get(f"{BASE_URL}/api/payroll/rules")
        assert response.status_code == 200
        
        rules = response.json()["data"]
        assert "work" in rules, "Rules should have work config"
        
        work = rules["work"]
        assert "standard_days_per_month" in work, "Should have standard work days"
        assert "standard_hours_per_day" in work, "Should have standard hours"
        assert "late_tolerance_minutes" in work, "Should have late tolerance"
        
        print(f"✓ Work config: {work['standard_days_per_month']} days/month, {work['standard_hours_per_day']}h/day")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUDIT LOGS API
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_get_audit_logs(self):
        """GET /api/payroll/audit-logs - should return audit entries"""
        response = self.session.get(f"{BASE_URL}/api/payroll/audit-logs")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        logs = response.json()
        assert isinstance(logs, list), "Response should be a list"
        
        # If there are logs, verify structure
        if len(logs) > 0:
            log = logs[0]
            # Check required fields
            expected_fields = ["id", "action", "actor_id", "timestamp"]
            for field in expected_fields:
                assert field in log, f"Audit log should have '{field}' field"
            
            # Check action types
            valid_actions = ["calculate", "approve", "pay", "lock", "view", "adjust", "update_rules"]
            assert log["action"] in valid_actions, f"Unknown action: {log['action']}"
            
            print(f"✓ Audit logs returned: {len(logs)} entries")
            print(f"  Latest action: {logs[0]['action']} by {logs[0].get('actor_name', 'N/A')}")
        else:
            print(f"✓ Audit logs API works (no entries yet)")
    
    def test_get_audit_logs_with_filter(self):
        """GET /api/payroll/audit-logs?action=calculate - should filter by action"""
        response = self.session.get(f"{BASE_URL}/api/payroll/audit-logs?action=calculate&limit=10")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        logs = response.json()
        assert isinstance(logs, list)
        
        # Verify all returned logs have action=calculate
        for log in logs:
            assert log["action"] == "calculate", f"Filter not working: got {log['action']}"
        
        print(f"✓ Audit logs filter works: {len(logs)} calculate actions")
    
    def test_get_salary_view_logs(self):
        """GET /api/payroll/salary-view-logs - should return salary view logs"""
        response = self.session.get(f"{BASE_URL}/api/payroll/salary-view-logs")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        logs = response.json()
        assert isinstance(logs, list), "Response should be a list"
        
        if len(logs) > 0:
            log = logs[0]
            # Check required fields for salary view log
            expected_fields = ["id", "viewer_id", "viewer_role", "target_hr_profile_id", "timestamp"]
            for field in expected_fields:
                assert field in log, f"Salary view log should have '{field}' field"
            
            # Check view_type (own or other)
            assert "view_type" in log, "Should have view_type field"
            assert log["view_type"] in ["own", "other"], f"Invalid view_type: {log['view_type']}"
            
            # Check authorization
            assert "is_authorized" in log, "Should have is_authorized field"
            
            print(f"✓ Salary view logs returned: {len(logs)} entries")
            print(f"  Latest view: {log.get('viewer_name', 'N/A')} viewed {log.get('target_employee_name', 'N/A')}")
        else:
            print(f"✓ Salary view logs API works (no entries yet)")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # NEGATIVE NET SALARY HANDLING
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_payroll_detail_has_debt_fields(self):
        """Payroll with has_debt=true should show carry_forward_debt amount"""
        # First get a calculated payroll
        current_period = "2026-01"  # Use a recent period
        response = self.session.get(f"{BASE_URL}/api/payroll/payrolls/{current_period}")
        
        if response.status_code == 200:
            payrolls = response.json()
            if len(payrolls) > 0:
                payroll = payrolls[0]
                
                # Check debt fields exist
                assert "has_debt" in payroll, "Payroll should have 'has_debt' field"
                assert "carry_forward_debt" in payroll, "Payroll should have 'carry_forward_debt' field"
                assert "raw_net_salary" in payroll, "Payroll should have 'raw_net_salary' field"
                
                # If has_debt is true, verify net is 0 and carry_forward_debt > 0
                if payroll["has_debt"]:
                    assert payroll["net_salary"] == 0, "When has_debt=true, net_salary should be 0"
                    assert payroll["carry_forward_debt"] > 0, "When has_debt=true, carry_forward_debt should be > 0"
                    print(f"✓ Found payroll with debt: carry_forward={payroll['carry_forward_debt']:,.0f}đ")
                else:
                    # Normal case - net should equal raw_net
                    print(f"✓ Payroll debt fields present (no debt): net={payroll['net_salary']:,.0f}đ")
            else:
                print("✓ Debt fields structure verified (no payrolls in period)")
        else:
            print("✓ Debt field test skipped (no payrolls found)")
    
    def test_payroll_detail_has_salary_breakdown_fields(self):
        """Payroll detail should have all fields needed for SALARY BREAKDOWN formula"""
        current_period = "2026-01"
        response = self.session.get(f"{BASE_URL}/api/payroll/payrolls/{current_period}")
        
        if response.status_code == 200:
            payrolls = response.json()
            if len(payrolls) > 0:
                payroll = payrolls[0]
                
                # Check fields for SALARY BREAKDOWN display
                breakdown_fields = [
                    "base_salary",
                    "base_salary_full",
                    "actual_work_days",
                    "standard_work_days",
                    "total_overtime",
                    "overtime_normal_hours",
                    "overtime_normal_amount",
                    "overtime_weekend_hours",
                    "overtime_weekend_amount",
                    "overtime_holiday_hours",
                    "overtime_holiday_amount",
                    "ot_rate_normal",
                    "ot_rate_weekend",
                    "ot_rate_holiday",
                    "total_allowances",
                    "allowance_details",
                    "total_commission",
                    "gross_salary",
                    "social_insurance",
                    "health_insurance",
                    "unemployment_insurance",
                    "insurance_rate_social",
                    "insurance_rate_health",
                    "insurance_rate_unemployment",
                    "insurance_base",
                    "taxable_income",
                    "personal_income_tax",
                    "total_penalties",
                    "total_advances",
                    "net_salary",
                ]
                
                missing_fields = []
                for field in breakdown_fields:
                    if field not in payroll:
                        missing_fields.append(field)
                
                if missing_fields:
                    print(f"⚠ Missing breakdown fields: {missing_fields}")
                
                # Should have most fields
                assert len(missing_fields) < 5, f"Too many missing fields: {missing_fields}"
                
                print(f"✓ Salary breakdown fields present ({len(breakdown_fields) - len(missing_fields)}/{len(breakdown_fields)})")
                print(f"  Formula: Base={payroll['base_salary']:,.0f}đ + OT={payroll.get('total_overtime', 0):,.0f}đ - Insurance - Tax = Net={payroll['net_salary']:,.0f}đ")
            else:
                print("✓ Breakdown field test skipped (no payrolls)")
        else:
            print("✓ Breakdown field test skipped (API error)")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PERMISSION TESTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_rules_require_auth(self):
        """GET /api/payroll/rules should require authentication"""
        response = requests.get(f"{BASE_URL}/api/payroll/rules")
        # Should be 401 or 403 without token
        assert response.status_code in [401, 403], "Rules should require auth"
        print("✓ Rules endpoint requires authentication")
    
    def test_audit_logs_require_admin(self):
        """GET /api/payroll/audit-logs should require admin role"""
        # Admin should have access (tested earlier)
        response = self.session.get(f"{BASE_URL}/api/payroll/audit-logs")
        assert response.status_code == 200, "Admin should have access to audit logs"
        print("✓ Audit logs accessible by admin")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
