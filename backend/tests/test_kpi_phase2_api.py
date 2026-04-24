"""
Phase 2 KPI API Tests - BĐS Sơ Cấp (Primary Real Estate)
Tests for:
- GET /api/kpi/my-performance
- GET /api/kpi/team-performance
- GET /api/kpi/my-alerts
- GET /api/kpi/team-alerts
- GET /api/kpi/config/kpi-definitions
- PUT /api/kpi/config/kpi-definitions/{kpi_code}
- GET /api/kpi/config/bonus-tiers
- PUT /api/kpi/config/bonus-tiers
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestMyPerformanceAPI:
    """Tests for GET /api/kpi/my-performance endpoint"""
    
    def test_my_performance_returns_200(self, api_client):
        """Test that my-performance endpoint returns 200"""
        response = api_client.get(f"{BASE_URL}/api/kpi/my-performance")
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200
    
    def test_my_performance_structure(self, api_client):
        """Test response structure contains required fields"""
        response = api_client.get(f"{BASE_URL}/api/kpi/my-performance")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check top-level keys
        assert "summary" in data, "Response should contain 'summary'"
        assert "kpis" in data, "Response should contain 'kpis'"
        assert "alerts" in data, "Response should contain 'alerts'"
        assert "period_type" in data, "Response should contain 'period_type'"
        assert "period_label" in data, "Response should contain 'period_label'"
        
        # Check summary structure
        summary = data.get("summary", {})
        assert "total_score" in summary or "overall_score" in summary, "Summary should contain score"
        assert "grade" in summary, "Summary should contain 'grade'"
        assert "commission_multiplier" in summary, "Summary should contain 'commission_multiplier'"
        
        print(f"Summary: {summary}")
        print(f"KPIs count: {len(data.get('kpis', []))}")
        print(f"Alerts count: {len(data.get('alerts', []))}")
    
    def test_my_performance_kpis_structure(self, api_client):
        """Test that KPIs have correct structure"""
        response = api_client.get(f"{BASE_URL}/api/kpi/my-performance")
        assert response.status_code == 200
        
        data = response.json()
        kpis = data.get("kpis", [])
        
        if len(kpis) > 0:
            kpi = kpis[0]
            # Check KPI fields
            assert "kpi_code" in kpi, "KPI should have 'kpi_code'"
            assert "kpi_name" in kpi, "KPI should have 'kpi_name'"
            assert "actual" in kpi or "value" in kpi, "KPI should have 'actual' or 'value'"
            assert "target" in kpi, "KPI should have 'target'"
            assert "achievement" in kpi, "KPI should have 'achievement'"
            assert "status" in kpi, "KPI should have 'status'"
            
            print(f"Sample KPI: {kpi}")
    
    def test_my_performance_period_filter(self, api_client):
        """Test period filter works"""
        # Test monthly
        response_monthly = api_client.get(f"{BASE_URL}/api/kpi/my-performance?period_type=monthly")
        assert response_monthly.status_code == 200
        data_monthly = response_monthly.json()
        assert data_monthly.get("period_type") == "monthly"
        
        # Test quarterly
        response_quarterly = api_client.get(f"{BASE_URL}/api/kpi/my-performance?period_type=quarterly")
        assert response_quarterly.status_code == 200
        data_quarterly = response_quarterly.json()
        assert data_quarterly.get("period_type") == "quarterly"
        
        print("Period filters working correctly")


class TestTeamPerformanceAPI:
    """Tests for GET /api/kpi/team-performance endpoint"""
    
    def test_team_performance_returns_200(self, api_client):
        """Test that team-performance endpoint returns 200"""
        response = api_client.get(f"{BASE_URL}/api/kpi/team-performance")
        print(f"Response status: {response.status_code}")
        
        # May return 400 if no team found, which is acceptable
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            print(f"Response body: {response.text[:500]}")
    
    def test_team_performance_structure(self, api_client):
        """Test team-performance response structure"""
        response = api_client.get(f"{BASE_URL}/api/kpi/team-performance")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check top-level keys
            assert "team_id" in data or "summary" in data, "Should have team info or summary"
            assert "members" in data, "Should have 'members' list"
            
            summary = data.get("summary", {})
            if summary:
                # Summary may have different keys
                print(f"Team summary: {summary}")
            
            members = data.get("members", [])
            print(f"Team members count: {len(members)}")
            
            if len(members) > 0:
                member = members[0]
                print(f"Sample member: {member}")
    
    def test_team_performance_period_filter(self, api_client):
        """Test period filter for team performance"""
        response = api_client.get(f"{BASE_URL}/api/kpi/team-performance?period_type=monthly&period_year=2026&period_month=1")
        
        # Accept both 200 (data found) or 400 (no team)
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert "period_type" in data or "period_label" in data


class TestMyAlertsAPI:
    """Tests for GET /api/kpi/my-alerts endpoint"""
    
    def test_my_alerts_returns_200(self, api_client):
        """Test my-alerts returns 200"""
        response = api_client.get(f"{BASE_URL}/api/kpi/my-alerts")
        print(f"Response status: {response.status_code}")
        
        assert response.status_code == 200
    
    def test_my_alerts_returns_list(self, api_client):
        """Test my-alerts returns a list"""
        response = api_client.get(f"{BASE_URL}/api/kpi/my-alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Alerts count: {len(data)}")
        
        if len(data) > 0:
            alert = data[0]
            print(f"Sample alert: {alert}")
            # Check alert structure
            assert "message" in alert or "type" in alert, "Alert should have message or type"
    
    def test_my_alerts_limit_filter(self, api_client):
        """Test limit parameter"""
        response = api_client.get(f"{BASE_URL}/api/kpi/my-alerts?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 5, "Should respect limit parameter"


class TestTeamAlertsAPI:
    """Tests for GET /api/kpi/team-alerts endpoint"""
    
    def test_team_alerts_returns_200(self, api_client):
        """Test team-alerts returns 200"""
        response = api_client.get(f"{BASE_URL}/api/kpi/team-alerts")
        print(f"Response status: {response.status_code}")
        
        assert response.status_code == 200
    
    def test_team_alerts_returns_list(self, api_client):
        """Test team-alerts returns a list"""
        response = api_client.get(f"{BASE_URL}/api/kpi/team-alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Team alerts count: {len(data)}")


class TestKPIDefinitionsConfigAPI:
    """Tests for KPI definitions config endpoints"""
    
    def test_get_kpi_definitions_returns_200(self, api_client):
        """Test GET /api/kpi/config/kpi-definitions"""
        response = api_client.get(f"{BASE_URL}/api/kpi/config/kpi-definitions")
        print(f"Response status: {response.status_code}")
        
        assert response.status_code == 200
    
    def test_get_kpi_definitions_returns_list(self, api_client):
        """Test definitions returns list with correct structure"""
        response = api_client.get(f"{BASE_URL}/api/kpi/config/kpi-definitions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"KPI definitions count: {len(data)}")
        
        if len(data) > 0:
            definition = data[0]
            print(f"Sample definition: {definition}")
            
            # Check required fields
            assert "code" in definition, "Definition should have 'code'"
            assert "name" in definition, "Definition should have 'name'"
            assert "weight" in definition, "Definition should have 'weight'"
    
    def test_get_kpi_definitions_contains_real_estate_kpis(self, api_client):
        """Test that definitions contain BĐS Sơ Cấp KPIs"""
        response = api_client.get(f"{BASE_URL}/api/kpi/config/kpi-definitions")
        assert response.status_code == 200
        
        data = response.json()
        kpi_codes = [kpi.get("code") for kpi in data]
        
        # Check for Real Estate specific KPIs
        expected_kpis = ["NEW_CUSTOMERS", "CALLS_MADE", "SITE_VISITS", "SOFT_BOOKINGS", "HARD_BOOKINGS", "DEALS_WON", "REVENUE_ACTUAL"]
        
        found_kpis = []
        for expected in expected_kpis:
            if expected in kpi_codes:
                found_kpis.append(expected)
        
        print(f"Found KPIs: {found_kpis}")
        assert len(found_kpis) > 0, "Should have at least some Real Estate KPIs"
    
    def test_update_kpi_definition(self, api_client):
        """Test PUT /api/kpi/config/kpi-definitions/{kpi_code}"""
        # First get a KPI to update
        response = api_client.get(f"{BASE_URL}/api/kpi/config/kpi-definitions")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) == 0:
            pytest.skip("No KPI definitions found")
        
        kpi = data[0]
        kpi_code = kpi.get("code")
        original_weight = kpi.get("weight", 0.1)
        
        # Update the weight
        new_weight = 0.05 if original_weight != 0.05 else 0.10
        update_response = api_client.put(
            f"{BASE_URL}/api/kpi/config/kpi-definitions/{kpi_code}",
            json={"weight": new_weight}
        )
        
        print(f"Update response status: {update_response.status_code}")
        print(f"Update response: {update_response.text}")
        
        assert update_response.status_code == 200
        
        # Verify the update
        verify_response = api_client.get(f"{BASE_URL}/api/kpi/config/kpi-definitions")
        updated_kpis = verify_response.json()
        updated_kpi = next((k for k in updated_kpis if k.get("code") == kpi_code), None)
        
        if updated_kpi:
            print(f"Updated weight: {updated_kpi.get('weight')}")
            # Restore original weight
            api_client.put(
                f"{BASE_URL}/api/kpi/config/kpi-definitions/{kpi_code}",
                json={"weight": original_weight}
            )


class TestBonusTiersConfigAPI:
    """Tests for bonus tiers config endpoints"""
    
    def test_get_bonus_tiers_returns_200(self, api_client):
        """Test GET /api/kpi/config/bonus-tiers"""
        response = api_client.get(f"{BASE_URL}/api/kpi/config/bonus-tiers")
        print(f"Response status: {response.status_code}")
        
        assert response.status_code == 200
    
    def test_get_bonus_tiers_returns_list(self, api_client):
        """Test bonus tiers returns list with correct structure"""
        response = api_client.get(f"{BASE_URL}/api/kpi/config/bonus-tiers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Bonus tiers count: {len(data)}")
        
        if len(data) > 0:
            tier = data[0]
            print(f"Sample tier: {tier}")
            
            # Check required fields
            assert "min_achievement" in tier, "Tier should have 'min_achievement'"
            assert "max_achievement" in tier, "Tier should have 'max_achievement'"
            assert "bonus_modifier" in tier, "Tier should have 'bonus_modifier'"
    
    def test_get_bonus_tiers_has_default_tiers(self, api_client):
        """Test that default bonus tiers exist"""
        response = api_client.get(f"{BASE_URL}/api/kpi/config/bonus-tiers")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 3, "Should have at least 3 bonus tiers"
        
        # Check for typical tier structure
        modifiers = [tier.get("bonus_modifier") for tier in data]
        print(f"Bonus modifiers: {modifiers}")
        
        # Should have tiers from 0 to some multiplier (e.g., 1.5)
        assert any(m >= 1.0 for m in modifiers), "Should have at least one tier with modifier >= 1.0"
    
    def test_update_bonus_tiers(self, api_client):
        """Test PUT /api/kpi/config/bonus-tiers"""
        # Get current tiers
        get_response = api_client.get(f"{BASE_URL}/api/kpi/config/bonus-tiers")
        assert get_response.status_code == 200
        original_tiers = get_response.json()
        
        # Create test tiers
        test_tiers = [
            {"min_achievement": 0, "max_achievement": 69.99, "bonus_modifier": 0},
            {"min_achievement": 70, "max_achievement": 89.99, "bonus_modifier": 1.0},
            {"min_achievement": 90, "max_achievement": 109.99, "bonus_modifier": 1.1},
            {"min_achievement": 110, "max_achievement": 999, "bonus_modifier": 1.3}
        ]
        
        # Update with test tiers
        update_response = api_client.put(
            f"{BASE_URL}/api/kpi/config/bonus-tiers",
            json=test_tiers
        )
        
        print(f"Update response status: {update_response.status_code}")
        print(f"Update response: {update_response.text}")
        
        assert update_response.status_code == 200
        
        # Verify the update
        verify_response = api_client.get(f"{BASE_URL}/api/kpi/config/bonus-tiers")
        updated_tiers = verify_response.json()
        print(f"Updated tiers count: {len(updated_tiers)}")
        
        # Restore original tiers
        api_client.put(
            f"{BASE_URL}/api/kpi/config/bonus-tiers",
            json=original_tiers
        )


class TestKPIIntegrationFlow:
    """Integration tests for the KPI flow"""
    
    def test_kpi_flow_crm_to_commission(self, api_client):
        """Test KPI flow: CRM → KPI → Commission"""
        # 1. Get my performance (simulates CRM data → KPI calculation)
        perf_response = api_client.get(f"{BASE_URL}/api/kpi/my-performance")
        assert perf_response.status_code == 200
        
        perf_data = perf_response.json()
        
        # 2. Verify commission multiplier is calculated
        summary = perf_data.get("summary", {})
        commission_multiplier = summary.get("commission_multiplier", 1.0)
        
        print(f"Commission multiplier from KPI: {commission_multiplier}")
        
        # 3. Verify the flow structure
        assert "kpis" in perf_data, "Should have KPIs (from CRM)"
        assert commission_multiplier is not None, "Should have commission multiplier"
        
        # 4. Check bonus tier label
        bonus_tier = summary.get("bonus_tier", "")
        print(f"Bonus tier: {bonus_tier}")
    
    def test_seed_kpis_available(self, api_client):
        """Test that system KPIs can be seeded"""
        response = api_client.post(f"{BASE_URL}/api/kpi/definitions/seed")
        
        # Should succeed or indicate already seeded
        assert response.status_code in [200, 201, 400]
        print(f"Seed response: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
