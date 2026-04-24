"""
Finance Module API Tests - ProHouzing CRM
Testing: Revenue, Expense, Invoice, Contract, Budget, Tax Report endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Token not found in response"
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Test admin login returns token"""
        assert auth_token is not None
        assert len(auth_token) > 0


class TestFinanceSummary:
    """Finance Summary/Dashboard API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_financial_summary(self, auth_headers):
        """Test GET /finance/summary"""
        response = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "total_expense" in data
        assert "net_profit" in data
        assert "period_label" in data
    
    def test_get_cash_flow(self, auth_headers):
        """Test GET /finance/cash-flow"""
        response = requests.get(f"{BASE_URL}/api/finance/cash-flow", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "operating_cash_in" in data
        assert "operating_cash_out" in data
        assert "net_cash_flow" in data
    
    def test_get_profit_loss(self, auth_headers):
        """Test GET /finance/profit-loss"""
        response = requests.get(f"{BASE_URL}/api/finance/profit-loss", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "gross_profit" in data
        assert "net_profit" in data


class TestRevenueAPI:
    """Revenue CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_revenues(self, auth_headers):
        """Test GET /finance/revenues"""
        response = requests.get(f"{BASE_URL}/api/finance/revenues", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_revenue(self, auth_headers):
        """Test POST /finance/revenues - Create new revenue"""
        revenue_data = {
            "category": "brokerage_fee",
            "amount": 50000000,
            "description": "TEST_Phí môi giới dự án ABC",
            "transaction_date": "2026-01-15",
            "payment_method": "transfer",
            "reference_no": "TEST_REF001",
            "notes": "Test revenue entry"
        }
        response = requests.post(f"{BASE_URL}/api/finance/revenues", json=revenue_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "brokerage_fee"
        assert data["amount"] == 50000000
        assert "id" in data
        assert data["category_label"] == "Phí môi giới"
    
    def test_get_revenue_summary(self, auth_headers):
        """Test GET /finance/revenues/summary"""
        response = requests.get(f"{BASE_URL}/api/finance/revenues/summary?period_year=2026", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "by_category" in data


class TestExpenseAPI:
    """Expense CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def created_expense_id(self, auth_headers):
        """Create an expense for testing"""
        expense_data = {
            "category": "marketing",
            "amount": 10000000,
            "description": "TEST_Chi phí quảng cáo Facebook",
            "vendor_name": "Meta Vietnam",
            "transaction_date": "2026-01-20",
            "payment_method": "transfer",
            "invoice_no": "TEST_INV001"
        }
        response = requests.post(f"{BASE_URL}/api/finance/expenses", json=expense_data, headers=auth_headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_get_expenses(self, auth_headers):
        """Test GET /finance/expenses"""
        response = requests.get(f"{BASE_URL}/api/finance/expenses", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_expense(self, auth_headers):
        """Test POST /finance/expenses"""
        expense_data = {
            "category": "office",
            "amount": 5000000,
            "description": "TEST_Tiền thuê văn phòng tháng 1",
            "transaction_date": "2026-01-01",
            "payment_method": "transfer"
        }
        response = requests.post(f"{BASE_URL}/api/finance/expenses", json=expense_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "office"
        assert data["status"] == "pending"
        assert data["category_label"] == "Văn phòng"
    
    def test_approve_expense(self, auth_headers, created_expense_id):
        """Test PUT /finance/expenses/{id}/approve"""
        response = requests.put(f"{BASE_URL}/api/finance/expenses/{created_expense_id}/approve", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "approved"


class TestInvoiceAPI:
    """Invoice CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def created_invoice_id(self, auth_headers):
        """Create an invoice for testing"""
        invoice_data = {
            "invoice_type": "service",
            "customer_name": "TEST_Công ty ABC",
            "customer_address": "123 Đường XYZ",
            "customer_tax_code": "0123456789",
            "customer_phone": "0901234567",
            "items": [
                {
                    "description": "Phí môi giới BĐS",
                    "quantity": 1,
                    "unit": "lần",
                    "unit_price": 50000000,
                    "vat_rate": 10,
                    "discount_percent": 0,
                    "discount_amount": 0,
                    "vat_amount": 5000000,
                    "amount": 50000000,
                    "total": 55000000
                }
            ],
            "subtotal": 50000000,
            "total_discount": 0,
            "total_vat": 5000000,
            "total_amount": 55000000,
            "payment_method": "transfer",
            "payment_terms": "Thanh toán trong 30 ngày"
        }
        response = requests.post(f"{BASE_URL}/api/finance/invoices", json=invoice_data, headers=auth_headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_get_invoices(self, auth_headers):
        """Test GET /finance/invoices"""
        response = requests.get(f"{BASE_URL}/api/finance/invoices", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_invoice(self, auth_headers):
        """Test POST /finance/invoices"""
        invoice_data = {
            "invoice_type": "vat",
            "customer_name": "TEST_Khách hàng XYZ",
            "items": [
                {
                    "description": "Dịch vụ tư vấn",
                    "quantity": 1,
                    "unit": "gói",
                    "unit_price": 20000000,
                    "vat_rate": 10,
                    "discount_percent": 0,
                    "discount_amount": 0,
                    "vat_amount": 2000000,
                    "amount": 20000000,
                    "total": 22000000
                }
            ],
            "subtotal": 20000000,
            "total_discount": 0,
            "total_vat": 2000000,
            "total_amount": 22000000
        }
        response = requests.post(f"{BASE_URL}/api/finance/invoices", json=invoice_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "invoice_no" in data
        assert data["status"] == "draft"
        assert "total_amount_words" in data  # Vietnamese text
    
    def test_get_invoice_detail(self, auth_headers, created_invoice_id):
        """Test GET /finance/invoices/{id}"""
        response = requests.get(f"{BASE_URL}/api/finance/invoices/{created_invoice_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_invoice_id
        assert "items" in data
    
    def test_issue_invoice(self, auth_headers, created_invoice_id):
        """Test PUT /finance/invoices/{id}/issue"""
        response = requests.put(f"{BASE_URL}/api/finance/invoices/{created_invoice_id}/issue", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "issued"


class TestContractAPI:
    """Contract CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def created_contract_id(self, auth_headers):
        """Create a contract for testing"""
        contract_data = {
            "contract_type": "brokerage",
            "title": "TEST_Hợp đồng môi giới BĐS",
            "party_a": {
                "party_type": "company",
                "name": "Công ty ProHouzing",
                "representative": "Nguyễn Văn A",
                "position": "Giám đốc"
            },
            "party_b": {
                "party_type": "individual",
                "name": "TEST_Trần Văn B",
                "phone": "0901234567",
                "id_number": "012345678901"
            },
            "property_address": "123 Đường ABC, Quận 1, TP.HCM",
            "contract_value": 100000000,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "deposit_amount": 10000000
        }
        response = requests.post(f"{BASE_URL}/api/finance/contracts", json=contract_data, headers=auth_headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_get_contracts(self, auth_headers):
        """Test GET /finance/contracts"""
        response = requests.get(f"{BASE_URL}/api/finance/contracts", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_contract(self, auth_headers):
        """Test POST /finance/contracts"""
        contract_data = {
            "contract_type": "service",
            "title": "TEST_Hợp đồng dịch vụ tư vấn",
            "party_a": {
                "party_type": "company",
                "name": "Công ty ProHouzing"
            },
            "party_b": {
                "party_type": "individual",
                "name": "TEST_Khách hàng C",
                "phone": "0909999999"
            },
            "contract_value": 50000000,
            "start_date": "2026-02-01"
        }
        response = requests.post(f"{BASE_URL}/api/finance/contracts", json=contract_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "contract_no" in data
        assert data["status"] == "draft"
        assert "contract_value_words" in data  # Vietnamese text
    
    def test_get_contract_detail(self, auth_headers, created_contract_id):
        """Test GET /finance/contracts/{id}"""
        response = requests.get(f"{BASE_URL}/api/finance/contracts/{created_contract_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_contract_id
    
    def test_sign_contract_party_a(self, auth_headers, created_contract_id):
        """Test PUT /finance/contracts/{id}/sign?party=a"""
        response = requests.put(f"{BASE_URL}/api/finance/contracts/{created_contract_id}/sign?party=a", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True


class TestBudgetAPI:
    """Budget CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def created_budget_id(self, auth_headers):
        """Create a budget for testing"""
        budget_data = {
            "name": "TEST_Ngân sách Marketing Q1",
            "budget_type": "quarterly",
            "period_year": 2026,
            "period_quarter": 1,
            "start_date": "2026-01-01",
            "end_date": "2026-03-31",
            "total_planned": 100000000,
            "description": "Ngân sách cho hoạt động marketing quý 1"
        }
        response = requests.post(f"{BASE_URL}/api/finance/budgets", json=budget_data, headers=auth_headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_get_budgets(self, auth_headers):
        """Test GET /finance/budgets"""
        response = requests.get(f"{BASE_URL}/api/finance/budgets", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_budget(self, auth_headers):
        """Test POST /finance/budgets"""
        budget_data = {
            "name": "TEST_Ngân sách vận hành tháng 2",
            "budget_type": "monthly",
            "period_year": 2026,
            "period_month": 2,
            "start_date": "2026-02-01",
            "end_date": "2026-02-28",
            "total_planned": 50000000
        }
        response = requests.post(f"{BASE_URL}/api/finance/budgets", json=budget_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Ngân sách vận hành tháng 2"
        assert data["status"] == "draft"
        assert "period_label" in data
    
    def test_approve_budget(self, auth_headers, created_budget_id):
        """Test PUT /finance/budgets/{id}/approve"""
        response = requests.put(f"{BASE_URL}/api/finance/budgets/{created_budget_id}/approve", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "approved"


class TestTaxReportAPI:
    """Tax Report API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_tax_report_quarterly(self, auth_headers):
        """Test GET /finance/tax/report quarterly"""
        response = requests.get(f"{BASE_URL}/api/finance/tax/report?period_type=quarterly&period_year=2026&period_quarter=1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "vat_output" in data
        assert "vat_input" in data
        assert "vat_payable" in data
        assert "cit_amount" in data
        assert "pit_total_amount" in data
        assert "total_tax_payable" in data
    
    def test_get_tax_report_monthly(self, auth_headers):
        """Test GET /finance/tax/report monthly"""
        response = requests.get(f"{BASE_URL}/api/finance/tax/report?period_type=monthly&period_year=2026&period_month=1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "cit_rate" in data
        assert data["cit_rate"] == 20  # Vietnamese CIT rate
    
    def test_get_tax_report_yearly(self, auth_headers):
        """Test GET /finance/tax/report yearly"""
        response = requests.get(f"{BASE_URL}/api/finance/tax/report?period_type=yearly&period_year=2026", headers=auth_headers)
        assert response.status_code == 200


class TestCommissionAPI:
    """Commission API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_commissions(self, auth_headers):
        """Test GET /finance/commissions"""
        response = requests.get(f"{BASE_URL}/api/finance/commissions", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_commission(self, auth_headers):
        """Test POST /finance/commissions"""
        commission_data = {
            "deal_id": "test-deal-001",
            "recipient_id": "test-user-001",
            "recipient_type": "employee",
            "deal_value": 1000000000,
            "commission_rate": 2.0,
            "commission_amount": 20000000
        }
        response = requests.post(f"{BASE_URL}/api/finance/commissions", json=commission_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert data["commission_amount"] == 20000000


class TestSalaryAPI:
    """Salary API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@prohouzing.vn",
            "password": "admin123"
        })
        token = response.json().get("access_token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_salaries(self, auth_headers):
        """Test GET /finance/salaries"""
        response = requests.get(f"{BASE_URL}/api/finance/salaries", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_salary(self, auth_headers):
        """Test POST /finance/salaries"""
        salary_data = {
            "employee_id": "test-emp-001",
            "period_month": 1,
            "period_year": 2026,
            "base_salary": 20000000,
            "allowances": 2000000,
            "bonus": 5000000,
            "commission_total": 10000000,
            "social_insurance": 1600000,
            "health_insurance": 300000,
            "unemployment_insurance": 200000,
            "personal_income_tax": 2000000,
            "work_days": 22,
            "components": []
        }
        response = requests.post(f"{BASE_URL}/api/finance/salaries", json=salary_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "draft"
        assert "gross_income" in data
        assert "net_salary" in data
        assert "period_label" in data


# Run cleanup after all tests (for test data with TEST_ prefix)
def pytest_sessionfinish(session, exitstatus):
    """Clean up test data after session"""
    pass  # In production, implement cleanup for TEST_ prefixed data
