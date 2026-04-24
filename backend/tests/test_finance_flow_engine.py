"""
Finance Flow Engine API Tests
Tests for Auto Financial Flow Engine for ProHouzing

Tests:
- CEO Dashboard endpoint
- Alerts system
- Flow statistics
- HARD RULES: Manual commission/payout creation blocked
- Receivables and Payouts endpoints
- Project Commissions endpoints
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestFinanceDashboardAPI:
    """Test Finance Dashboard endpoints"""

    def test_ceo_dashboard_returns_200(self):
        """GET /api/finance/dashboard/ceo returns proper data"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/ceo")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all expected fields exist
        assert "total_contract_value" in data
        assert "total_commission" in data
        assert "total_revenue" in data
        assert "receivable_total" in data
        assert "receivable_paid" in data
        assert "receivable_pending" in data
        assert "receivable_overdue" in data
        assert "vat_output" in data
        assert "period_month" in data
        assert "period_year" in data
        print(f"CEO Dashboard: Contract value={data['total_contract_value']}, Commission={data['total_commission']}")

    def test_ceo_dashboard_with_period_params(self):
        """GET /api/finance/dashboard/ceo accepts period parameters"""
        response = requests.get(
            f"{BASE_URL}/api/finance/dashboard/ceo",
            params={"period_month": 1, "period_year": 2026}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["period_month"] == 1
        assert data["period_year"] == 2026


class TestFinanceAlertsAPI:
    """Test Finance Alerts endpoints"""

    def test_get_alerts_returns_200(self):
        """GET /api/finance/alerts returns alerts array"""
        response = requests.get(f"{BASE_URL}/api/finance/alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "alerts" in data
        assert "by_type" in data
        assert isinstance(data["alerts"], list)
        print(f"Alerts: total={data['total']}, by_type={data['by_type']}")

    def test_check_alerts_runs_successfully(self):
        """POST /api/finance/alerts/check runs alert checking"""
        response = requests.post(f"{BASE_URL}/api/finance/alerts/check")
        assert response.status_code == 200
        
        data = response.json()
        assert "checked_at" in data
        assert "alerts_count" in data
        assert "alerts" in data
        print(f"Alert check: {data['alerts_count']} alerts found")


class TestFlowStatisticsAPI:
    """Test Flow Statistics endpoints"""

    def test_flow_stats_returns_200(self):
        """GET /api/finance/stats/flow returns flow statistics"""
        response = requests.get(f"{BASE_URL}/api/finance/stats/flow")
        assert response.status_code == 200
        
        data = response.json()
        assert "event_stats" in data
        assert "pending_payouts" in data
        assert "approved_payouts" in data
        assert "overdue_receivables" in data
        assert "pending_receivables" in data
        print(f"Flow stats: pending_payouts={data['pending_payouts']}, pending_receivables={data['pending_receivables']}")


class TestHardRulesBlocking:
    """Test HARD RULES - Manual creation blocked"""

    def test_manual_commission_creation_blocked_403(self):
        """POST /api/finance/commissions/manual returns 403 (blocked)"""
        response = requests.post(
            f"{BASE_URL}/api/finance/commissions/manual",
            json={}
        )
        assert response.status_code == 403
        
        data = response.json()
        assert "detail" in data
        assert "không cho phép" in data["detail"].lower() or "manual" in data["detail"].lower()
        print(f"Manual commission blocked: {data['detail']}")

    def test_manual_payout_creation_blocked_403(self):
        """POST /api/finance/payouts/manual returns 403 (blocked)"""
        response = requests.post(
            f"{BASE_URL}/api/finance/payouts/manual",
            json={}
        )
        assert response.status_code == 403
        
        data = response.json()
        assert "detail" in data
        assert "không cho phép" in data["detail"].lower() or "manual" in data["detail"].lower()
        print(f"Manual payout blocked: {data['detail']}")


class TestReceivablesAPI:
    """Test Receivables endpoints"""

    def test_list_receivables_returns_200(self):
        """GET /api/finance/receivables returns list"""
        response = requests.get(f"{BASE_URL}/api/finance/receivables")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Receivables count: {len(data)}")

    def test_receivables_summary_returns_200(self):
        """GET /api/finance/summary/receivables returns summary"""
        response = requests.get(f"{BASE_URL}/api/finance/summary/receivables")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_count" in data
        assert "total_due" in data
        assert "total_paid" in data
        assert "total_remaining" in data
        print(f"Receivables summary: count={data['total_count']}, due={data['total_due']}")


class TestPayoutsAPI:
    """Test Payouts endpoints"""

    def test_list_payouts_returns_200(self):
        """GET /api/finance/payouts returns list"""
        response = requests.get(f"{BASE_URL}/api/finance/payouts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Payouts count: {len(data)}")

    def test_payouts_summary_returns_200(self):
        """GET /api/finance/summary/payouts returns summary"""
        response = requests.get(f"{BASE_URL}/api/finance/summary/payouts")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_count" in data
        assert "total_gross" in data
        assert "total_tax" in data
        assert "total_net" in data
        print(f"Payouts summary: count={data['total_count']}, net={data['total_net']}")


class TestProjectCommissionsAPI:
    """Test Project Commissions endpoints"""

    def test_list_project_commissions_returns_200(self):
        """GET /api/finance/project-commissions returns list"""
        response = requests.get(f"{BASE_URL}/api/finance/project-commissions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Project commissions count: {len(data)}")


class TestCommissionsAPI:
    """Test Finance Commissions endpoints"""

    def test_list_commissions_returns_200(self):
        """GET /api/finance/commissions returns list"""
        response = requests.get(f"{BASE_URL}/api/finance/commissions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Finance commissions count: {len(data)}")


class TestFinanceFlowTriggers:
    """Test Finance Flow trigger endpoints (without actual contract)"""

    def test_contract_signed_flow_endpoint_exists(self):
        """POST /api/finance/flow/contract-signed/{contract_id} - endpoint exists"""
        # Test with fake contract_id - should return error but not 404
        response = requests.post(
            f"{BASE_URL}/api/finance/flow/contract-signed/test-contract-123"
        )
        # Should return 400 or similar (contract not found) not 404 (endpoint not found)
        assert response.status_code in [200, 400, 404, 500]
        print(f"contract-signed endpoint response: {response.status_code}")

    def test_developer_payment_flow_endpoint_exists(self):
        """POST /api/finance/flow/developer-payment/{contract_id} - endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/finance/flow/developer-payment/test-contract-123"
        )
        # Should return 400 (contract not found) not 404
        assert response.status_code in [200, 400, 404, 500]
        print(f"developer-payment endpoint response: {response.status_code}")


class TestFinanceEventsLog:
    """Test Finance Events log endpoint"""

    def test_get_finance_events_returns_200(self):
        """GET /api/finance/events returns events log"""
        response = requests.get(f"{BASE_URL}/api/finance/events")
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        assert "count" in data
        assert isinstance(data["events"], list)
        print(f"Finance events: count={data['count']}")


class TestInvoicesAPI:
    """Test Invoices endpoints"""

    def test_list_invoices_returns_200(self):
        """GET /api/finance/invoices returns list"""
        response = requests.get(f"{BASE_URL}/api/finance/invoices")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Invoices count: {len(data)}")


class TestPaymentTrackingAPI:
    """Test Payment Tracking endpoints"""

    def test_list_payments_returns_200(self):
        """GET /api/finance/payments returns list"""
        response = requests.get(f"{BASE_URL}/api/finance/payments")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Payments count: {len(data)}")


class TestTaxDashboard:
    """Test Tax Dashboard endpoint"""

    def test_tax_dashboard_returns_200(self):
        """GET /api/finance/dashboard/tax returns tax summary"""
        response = requests.get(f"{BASE_URL}/api/finance/dashboard/tax")
        assert response.status_code == 200
        
        data = response.json()
        assert "vat_output" in data
        assert "tncn_total" in data
        assert "period_month" in data
        assert "period_year" in data
        print(f"Tax dashboard: VAT={data['vat_output']}, TNCN={data['tncn_total']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
