"""
KPI Engine API Tests - Prompt 12/20
Testing all KPI endpoints for:
- Config endpoints (categories, scopes, periods, statuses, leaderboard-types)
- KPI Definitions CRUD
- KPI Targets CRUD
- Stats overview
- Leaderboards
- Trends
- Bonus rules
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable is required"


class TestKPIConfigEndpoints:
    """Test KPI configuration endpoints - return enum/constant data"""
    
    def test_get_categories_returns_8_items(self):
        """GET /api/kpi/config/categories - should return all 8 KPI categories"""
        response = requests.get(f"{BASE_URL}/api/kpi/config/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 8, f"Expected 8 categories, got {len(data)}"
        
        # Verify expected categories exist
        category_codes = [c["code"] for c in data]
        expected_codes = ["sales", "revenue", "activity", "lead", "customer", "quality", "team", "efficiency"]
        for code in expected_codes:
            assert code in category_codes, f"Missing category: {code}"
        
        # Verify structure of each category
        for cat in data:
            assert "code" in cat
            assert "label" in cat
            assert "label_en" in cat
            assert "icon" in cat
            assert "color" in cat
            assert "order" in cat
    
    def test_get_scopes_returns_4_items(self):
        """GET /api/kpi/config/scopes - should return all 4 scope types"""
        response = requests.get(f"{BASE_URL}/api/kpi/config/scopes")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4, f"Expected 4 scopes, got {len(data)}"
        
        scope_codes = [s["code"] for s in data]
        expected_codes = ["company", "branch", "team", "individual"]
        for code in expected_codes:
            assert code in scope_codes, f"Missing scope: {code}"
        
        for scope in data:
            assert "code" in scope
            assert "label" in scope
            assert "level" in scope
    
    def test_get_periods_returns_5_items(self):
        """GET /api/kpi/config/periods - should return all 5 period types"""
        response = requests.get(f"{BASE_URL}/api/kpi/config/periods")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5, f"Expected 5 periods, got {len(data)}"
        
        period_codes = [p["code"] for p in data]
        expected_codes = ["daily", "weekly", "monthly", "quarterly", "yearly"]
        for code in expected_codes:
            assert code in period_codes, f"Missing period: {code}"
        
        for period in data:
            assert "code" in period
            assert "label" in period
            assert "days" in period
    
    def test_get_statuses_returns_4_items(self):
        """GET /api/kpi/config/statuses - should return all 4 status types"""
        response = requests.get(f"{BASE_URL}/api/kpi/config/statuses")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4, f"Expected 4 statuses, got {len(data)}"
        
        status_codes = [s["code"] for s in data]
        expected_codes = ["exceeding", "on_track", "at_risk", "behind"]
        for code in expected_codes:
            assert code in status_codes, f"Missing status: {code}"
        
        for status in data:
            assert "code" in status
            assert "label" in status
            assert "threshold" in status
            assert "color" in status
    
    def test_get_leaderboard_types_returns_5_items(self):
        """GET /api/kpi/config/leaderboard-types - should return all 5 leaderboard types"""
        response = requests.get(f"{BASE_URL}/api/kpi/config/leaderboard-types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5, f"Expected 5 leaderboard types, got {len(data)}"
        
        lb_codes = [l["code"] for l in data]
        expected_codes = ["daily_stars", "weekly_warriors", "monthly_champions", "quarterly_legends", "all_time_heroes"]
        for code in expected_codes:
            assert code in lb_codes, f"Missing leaderboard type: {code}"
        
        for lb in data:
            assert "code" in lb
            assert "name" in lb
            assert "description" in lb
            assert "period_type" in lb


class TestKPIDefinitions:
    """Test KPI definitions endpoints"""
    
    def test_get_all_definitions_returns_18_system_kpis(self):
        """GET /api/kpi/definitions - should return 18 system KPI definitions"""
        response = requests.get(f"{BASE_URL}/api/kpi/definitions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 18, f"Expected 18 definitions, got {len(data)}"
        
        # Verify key KPIs exist
        kpi_codes = [d["code"] for d in data]
        expected_kpis = ["REVENUE_ACTUAL", "DEALS_WON", "WIN_RATE", "LEADS_CONTACTED", "SITE_VISITS"]
        for code in expected_kpis:
            assert code in kpi_codes, f"Missing KPI: {code}"
    
    def test_get_single_definition_revenue_actual(self):
        """GET /api/kpi/definitions/{kpi_code} - should return single KPI definition"""
        response = requests.get(f"{BASE_URL}/api/kpi/definitions/REVENUE_ACTUAL")
        assert response.status_code == 200
        
        data = response.json()
        assert data["code"] == "REVENUE_ACTUAL"
        assert data["name"] == "Doanh số thực tế"
        assert data["category"] == "revenue"
        assert data["category_label"] == "Doanh thu"
        assert data["calculation_type"] == "sum"
        assert data["source_entity"] == "contracts"
        assert data["is_key_metric"] == True
        assert data["is_system"] == True
        assert data["weight"] == 25
    
    def test_get_definition_deals_won(self):
        """GET /api/kpi/definitions/DEALS_WON - verify sales KPI structure"""
        response = requests.get(f"{BASE_URL}/api/kpi/definitions/DEALS_WON")
        assert response.status_code == 200
        
        data = response.json()
        assert data["code"] == "DEALS_WON"
        assert data["category"] == "sales"
        assert data["calculation_type"] == "count"
        assert data["source_entity"] == "deals"
        assert "won" in str(data.get("filter_conditions", {}))
    
    def test_get_nonexistent_definition_returns_404(self):
        """GET /api/kpi/definitions/{invalid} - should return 404"""
        response = requests.get(f"{BASE_URL}/api/kpi/definitions/NONEXISTENT_KPI")
        assert response.status_code == 404


class TestKPITargets:
    """Test KPI targets CRUD operations"""
    
    @pytest.fixture(scope="class")
    def sample_user_id(self):
        """Get a sample user ID for testing"""
        # Use a known user ID from leaderboard
        response = requests.get(f"{BASE_URL}/api/kpi/leaderboards/monthly_champions")
        if response.status_code == 200:
            data = response.json()
            if data.get("entries") and len(data["entries"]) > 0:
                return data["entries"][0]["user_id"]
        return None
    
    def test_create_target(self, sample_user_id):
        """POST /api/kpi/targets - should create new KPI target"""
        if not sample_user_id:
            pytest.skip("No sample user found for testing")
        
        target_data = {
            "kpi_code": "SITE_VISITS",
            "scope_type": "individual",
            "user_id": sample_user_id,
            "period_type": "monthly",
            "period_year": 2026,
            "period_month": 4,
            "target_value": 20,
            "stretch_target": 30,
            "minimum_threshold": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/kpi/targets",
            json=target_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["kpi_code"] == "SITE_VISITS"
        assert data["kpi_name"] == "Khách đi xem"
        assert data["scope_type"] == "individual"
        assert data["user_id"] == sample_user_id
        assert data["target_value"] == 20
        assert data["stretch_target"] == 30
        assert data["minimum_threshold"] == 10
        assert data["period_year"] == 2026
        assert data["period_month"] == 4
        assert "id" in data
    
    def test_get_targets_list(self):
        """GET /api/kpi/targets - should return targets list"""
        response = requests.get(f"{BASE_URL}/api/kpi/targets")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure if there are targets
        if len(data) > 0:
            target = data[0]
            assert "id" in target
            assert "kpi_code" in target
            assert "kpi_name" in target
            assert "scope_type" in target
            assert "period_type" in target
            assert "target_value" in target
    
    def test_get_targets_with_filters(self):
        """GET /api/kpi/targets with filters"""
        response = requests.get(f"{BASE_URL}/api/kpi/targets?period_type=monthly&period_year=2026")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        for target in data:
            assert target["period_type"] == "monthly"
            assert target["period_year"] == 2026


class TestKPIStats:
    """Test KPI statistics endpoints"""
    
    def test_get_overview_stats(self):
        """GET /api/kpi/stats/overview - should return KPI overview stats"""
        response = requests.get(f"{BASE_URL}/api/kpi/stats/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_kpi_definitions" in data
        assert "total_targets_set" in data
        assert "users_with_targets" in data
        assert "period_type" in data
        assert "period_year" in data
        assert "period_month" in data
        
        # Verify values
        assert data["total_kpi_definitions"] == 18
        assert data["period_type"] == "monthly"
        assert isinstance(data["total_targets_set"], int)
        assert isinstance(data["users_with_targets"], int)
    
    def test_get_overview_with_period_params(self):
        """GET /api/kpi/stats/overview with period parameters"""
        response = requests.get(
            f"{BASE_URL}/api/kpi/stats/overview",
            params={"period_type": "monthly", "period_year": 2026, "period_month": 3}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["period_year"] == 2026
        assert data["period_month"] == 3


class TestKPILeaderboards:
    """Test KPI leaderboard endpoints"""
    
    def test_get_available_leaderboards(self):
        """GET /api/kpi/leaderboards - should return list of available leaderboards"""
        response = requests.get(f"{BASE_URL}/api/kpi/leaderboards")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5
        
        for lb in data:
            assert "type" in lb
            assert "name" in lb
            assert "description" in lb
            assert "period_type" in lb
    
    def test_get_monthly_champions_leaderboard(self):
        """GET /api/kpi/leaderboards/monthly_champions - should return monthly leaderboard"""
        response = requests.get(f"{BASE_URL}/api/kpi/leaderboards/monthly_champions")
        assert response.status_code == 200
        
        data = response.json()
        assert data["leaderboard_type"] == "monthly_champions"
        assert data["name"] == "Nhà vô địch tháng"
        assert data["period_type"] == "monthly"
        assert data["primary_kpi"] == "REVENUE_ACTUAL"
        assert "entries" in data
        assert "total_participants" in data
        
        # Verify entry structure
        if len(data["entries"]) > 0:
            entry = data["entries"][0]
            assert "rank" in entry
            assert "user_id" in entry
            assert "user_name" in entry
            assert "primary_value" in entry
            assert "rank_badge" in entry
            
            # First place should have gold medal
            assert entry["rank"] == 1
            assert entry["rank_badge"] == "🥇"
    
    def test_get_daily_stars_leaderboard(self):
        """GET /api/kpi/leaderboards/daily_stars - should return daily leaderboard"""
        response = requests.get(f"{BASE_URL}/api/kpi/leaderboards/daily_stars")
        assert response.status_code == 200
        
        data = response.json()
        assert data["leaderboard_type"] == "daily_stars"
        assert data["period_type"] == "daily"
        assert data["primary_kpi"] == "CALLS_MADE"
    
    def test_get_weekly_warriors_leaderboard(self):
        """GET /api/kpi/leaderboards/weekly_warriors - should return weekly leaderboard"""
        response = requests.get(f"{BASE_URL}/api/kpi/leaderboards/weekly_warriors")
        assert response.status_code == 200
        
        data = response.json()
        assert data["leaderboard_type"] == "weekly_warriors"
        assert data["period_type"] == "weekly"
        assert data["primary_kpi"] == "DEALS_WON"


class TestKPITrends:
    """Test KPI trend endpoints"""
    
    def test_get_revenue_trend(self):
        """GET /api/kpi/trends/REVENUE_ACTUAL - should return trend data with 6 points"""
        response = requests.get(f"{BASE_URL}/api/kpi/trends/REVENUE_ACTUAL")
        assert response.status_code == 200
        
        data = response.json()
        assert data["kpi_code"] == "REVENUE_ACTUAL"
        assert data["kpi_name"] == "Doanh số thực tế"
        assert data["unit"] == "VND"
        assert data["scope_type"] == "individual"
        assert "data_points" in data
        assert len(data["data_points"]) == 6, f"Expected 6 data points, got {len(data['data_points'])}"
        
        # Verify data point structure
        for point in data["data_points"]:
            assert "period_label" in point
            assert "period_start" in point
            assert "period_end" in point
            assert "value" in point
            assert "formatted_value" in point
            assert "target" in point
            assert "achievement" in point
        
        # Verify trend summary
        assert "current_value" in data
        assert "previous_value" in data
        assert "change_percent" in data
        assert "trend" in data
        assert data["trend"] in ["up", "down", "stable"]
    
    def test_get_deals_won_trend(self):
        """GET /api/kpi/trends/DEALS_WON - should return deals trend"""
        response = requests.get(f"{BASE_URL}/api/kpi/trends/DEALS_WON")
        assert response.status_code == 200
        
        data = response.json()
        assert data["kpi_code"] == "DEALS_WON"
        assert len(data["data_points"]) == 6
    
    def test_get_trend_with_custom_periods(self):
        """GET /api/kpi/trends/{kpi_code} with periods parameter"""
        response = requests.get(
            f"{BASE_URL}/api/kpi/trends/REVENUE_ACTUAL",
            params={"periods": 12}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Default is 6, but requesting 12
        assert len(data["data_points"]) == 12


class TestKPIBonusRules:
    """Test KPI bonus rules endpoints"""
    
    def test_get_bonus_rules_list(self):
        """GET /api/kpi/bonus-rules - should return bonus rules list"""
        response = requests.get(f"{BASE_URL}/api/kpi/bonus-rules")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # May be empty if no rules created yet
    
    def test_create_bonus_rule(self):
        """POST /api/kpi/bonus-rules - should create a bonus rule"""
        rule_data = {
            "code": f"TEST_BONUS_{datetime.now().strftime('%H%M%S')}",
            "name": "Test Bonus Rule",
            "description": "Test bonus rule for KPI testing",
            "kpi_codes": ["REVENUE_ACTUAL"],
            "calculation_basis": "single_kpi",
            "kpi_weights": {},
            "tiers": [
                {"min_achievement": 0, "max_achievement": 69.99, "bonus_modifier": 0, "label": "Below threshold"},
                {"min_achievement": 70, "max_achievement": 99.99, "bonus_modifier": 1.0, "label": "Basic"},
                {"min_achievement": 100, "max_achievement": 119.99, "bonus_modifier": 1.15, "label": "Target met"},
                {"min_achievement": 120, "max_achievement": 999999, "bonus_modifier": 1.3, "label": "Exceeding"}
            ],
            "apply_to_commission_types": ["closing_sales"],
            "calculation_method": "multiply_base",
            "scope_type": "company",
            "scope_ids": [],
            "effective_from": "2026-01-01T00:00:00Z"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/kpi/bonus-rules",
            json=rule_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Test Bonus Rule"
        assert data["calculation_basis"] == "single_kpi"
        assert len(data["tiers"]) == 4
        assert data["is_active"] == True


class TestKPIIntegration:
    """Integration tests for KPI workflows"""
    
    def test_full_kpi_workflow(self):
        """Test complete KPI workflow: definitions -> targets -> leaderboard"""
        # 1. Get KPI definitions
        defs_response = requests.get(f"{BASE_URL}/api/kpi/definitions")
        assert defs_response.status_code == 200
        definitions = defs_response.json()
        assert len(definitions) > 0
        
        # 2. Get a sample user from leaderboard
        lb_response = requests.get(f"{BASE_URL}/api/kpi/leaderboards/monthly_champions")
        assert lb_response.status_code == 200
        leaderboard = lb_response.json()
        
        if len(leaderboard["entries"]) > 0:
            user_id = leaderboard["entries"][0]["user_id"]
            
            # 3. Create target for user
            target_data = {
                "kpi_code": "CALLS_MADE",
                "scope_type": "individual",
                "user_id": user_id,
                "period_type": "monthly",
                "period_year": 2026,
                "period_month": 5,
                "target_value": 50
            }
            
            target_response = requests.post(
                f"{BASE_URL}/api/kpi/targets",
                json=target_data
            )
            assert target_response.status_code == 200
            
            # 4. Verify target in list
            targets_response = requests.get(
                f"{BASE_URL}/api/kpi/targets",
                params={"user_id": user_id, "kpi_code": "CALLS_MADE"}
            )
            assert targets_response.status_code == 200
            targets = targets_response.json()
            assert any(t["user_id"] == user_id and t["kpi_code"] == "CALLS_MADE" for t in targets)
            
            # 5. Get trend for this KPI
            trend_response = requests.get(f"{BASE_URL}/api/kpi/trends/CALLS_MADE")
            assert trend_response.status_code == 200
            trend = trend_response.json()
            assert len(trend["data_points"]) == 6


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
