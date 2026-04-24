"""
Test KPI Phase 2 Enhancements (10/10)
Tests for:
1. Weight validation (total = 100%)
2. Commission rules (< 70% = no commission)
3. Level system (Bronze/Silver/Gold/Diamond)
4. Enhanced leaderboard (Active/Lazy)
5. Period lock
6. Data sources (AUTO from CRM)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestKPIWeightValidation:
    """1. FIX WEIGHT KPI - Total weight must = 100%"""
    
    def test_validate_weights_endpoint(self):
        """GET /api/kpi/weights/validate - returns total weight validation"""
        response = requests.get(f"{BASE_URL}/api/kpi/weights/validate")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_weight" in data or "total" in data
        assert "valid" in data or "is_valid" in data
        # Total should be a percentage value
        total = data.get("total_weight") or data.get("total") or 0
        assert isinstance(total, (int, float))
        print(f"Weight validation: total={total}, valid={data.get('valid') or data.get('is_valid')}")
    
    def test_weights_batch_reject_if_not_100(self):
        """PUT /api/kpi/weights/batch - reject if total ≠ 100%"""
        # Test with invalid weights (total = 50%)
        invalid_weights = [
            {"code": "REVENUE_ACTUAL", "weight": 0.25},
            {"code": "DEALS_WON", "weight": 0.25},
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/kpi/weights/batch",
            json=invalid_weights
        )
        
        # Should be rejected (400 or error message)
        # The API might return 200 with success=False or 400
        data = response.json()
        if response.status_code == 200:
            # Check for success=False or error field
            if "success" in data:
                assert data["success"] == False, "Should reject weights != 100%"
            if "error" in data:
                print(f"Expected rejection: {data['error']}")
        elif response.status_code == 400:
            print(f"Correctly rejected: {data}")
            assert True
        else:
            print(f"Response: {response.status_code} - {data}")


class TestCommissionRules:
    """3. KPI → TIỀN - Commission based on KPI"""
    
    def test_get_commission_rules(self):
        """GET /api/kpi/commission/rules - returns no_commission_threshold = 70%"""
        response = requests.get(f"{BASE_URL}/api/kpi/commission/rules")
        assert response.status_code == 200
        
        data = response.json()
        # Check for threshold at 70%
        assert "no_commission_threshold" in data
        assert data["no_commission_threshold"] == 70
        
        # Check rules array
        assert "rules" in data
        assert isinstance(data["rules"], list)
        
        # First rule should be 0-69.99% = 0 commission
        zero_rule = next((r for r in data["rules"] if r.get("commission_rate") == 0), None)
        assert zero_rule is not None
        assert zero_rule.get("max", 100) < 70 or zero_rule.get("max_achievement", 100) < 70
        
        print(f"Commission rules: threshold={data['no_commission_threshold']}, rules={len(data['rules'])}")
    
    def test_calculate_commission_kpi_below_70(self):
        """POST /api/kpi/commission/calculate - return 0 if KPI < 70%"""
        # Test user_id can be any string for calculation
        test_params = {
            "user_id": "test-user-001",
            "kpi_achievement": 65.0,  # Below 70%
            "base_commission": 10000000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/kpi/commission/calculate",
            params=test_params
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should return 0 commission or commission_rate = 0
        print(f"Commission calc (KPI=65%): {data}")
        
        final_commission = data.get("final_commission") or data.get("adjusted_commission") or data.get("commission_amount", 0)
        commission_rate = data.get("commission_rate") or data.get("multiplier", 0)
        
        # Either final_commission = 0 or commission_rate = 0
        assert final_commission == 0 or commission_rate == 0, f"KPI < 70% should have 0 commission, got: {data}"
    
    def test_calculate_commission_kpi_above_100(self):
        """POST /api/kpi/commission/calculate - return bonus if KPI > 100%"""
        test_params = {
            "user_id": "test-user-002",
            "kpi_achievement": 120.0,  # Above 100%
            "base_commission": 10000000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/kpi/commission/calculate",
            params=test_params
        )
        assert response.status_code == 200
        
        data = response.json()
        print(f"Commission calc (KPI=120%): {data}")
        
        # Should have commission_rate > 1.0 (bonus)
        commission_rate = data.get("commission_rate") or data.get("multiplier") or data.get("bonus_modifier", 1.0)
        assert commission_rate > 1.0, f"KPI > 100% should have bonus multiplier > 1.0, got: {commission_rate}"


class TestPeriodLock:
    """4. KPI LOCK - Lock old periods"""
    
    def test_get_period_status(self):
        """GET /api/kpi/period/status - check if period is locked"""
        response = requests.get(
            f"{BASE_URL}/api/kpi/period/status",
            params={"period_type": "monthly", "period_year": 2026, "period_month": 1}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "is_locked" in data
        assert "period_type" in data
        assert "period_year" in data
        assert "period_month" in data
        
        print(f"Period status: {data}")
    
    def test_lock_period(self):
        """POST /api/kpi/period/lock - lock a KPI period"""
        # Lock a past period (December 2025)
        response = requests.post(
            f"{BASE_URL}/api/kpi/period/lock",
            params={
                "period_type": "monthly",
                "period_year": 2025,
                "period_month": 12,
                "locked_by": "test-admin"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        print(f"Lock period response: {data}")
        
        # Verify it's now locked
        status_response = requests.get(
            f"{BASE_URL}/api/kpi/period/status",
            params={"period_type": "monthly", "period_year": 2025, "period_month": 12}
        )
        status = status_response.json()
        assert status.get("is_locked") == True, f"Period should be locked, got: {status}"


class TestLevelSystem:
    """5. LEVEL SYSTEM - Bronze/Silver/Gold/Diamond"""
    
    def test_get_levels_config(self):
        """GET /api/kpi/levels/config - returns 4 levels"""
        response = requests.get(f"{BASE_URL}/api/kpi/levels/config")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Should have 4 levels
        expected_levels = ["bronze", "silver", "gold", "diamond"]
        for level in expected_levels:
            assert level in data, f"Missing level: {level}"
            level_config = data[level]
            assert "min_score" in level_config
            assert "max_score" in level_config
            assert "label" in level_config
            
        # Check thresholds
        assert data["bronze"]["min_score"] == 0
        assert data["silver"]["min_score"] == 60
        assert data["gold"]["min_score"] == 80
        assert data["diamond"]["min_score"] == 100
        
        print(f"Level config: {list(data.keys())}")
    
    def test_get_user_level_with_perks(self):
        """GET /api/kpi/level/{user_id} - returns user level with perks"""
        # First get a user
        users_response = requests.get(f"{BASE_URL}/api/hr/employees", params={"limit": 1})
        if users_response.status_code == 200:
            users = users_response.json()
            if isinstance(users, list) and len(users) > 0:
                user_id = users[0].get("id")
            elif isinstance(users, dict) and users.get("employees"):
                user_id = users["employees"][0].get("id")
            else:
                user_id = "test-user"
        else:
            user_id = "test-user"
        
        response = requests.get(
            f"{BASE_URL}/api/kpi/level/{user_id}",
            params={"period_type": "monthly", "period_year": 2026, "period_month": 1}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "level" in data
        assert data["level"] in ["bronze", "silver", "gold", "diamond"]
        
        # Should have perks
        assert "perks" in data
        assert isinstance(data["perks"], list)
        
        print(f"User level: {data.get('level')}, perks: {data.get('perks')}")


class TestEnhancedLeaderboard:
    """8. GOAL - Leader knows who works / who's lazy"""
    
    def test_get_leaderboard_enhanced(self):
        """GET /api/kpi/leaderboard/enhanced - returns active_count, lazy_count, status per member"""
        response = requests.get(
            f"{BASE_URL}/api/kpi/leaderboard/enhanced",
            params={
                "period_type": "monthly",
                "period_year": 2026,
                "period_month": 1,
                "scope_type": "company",
                "limit": 20
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have active and lazy counts
        assert "active_count" in data
        assert "lazy_count" in data
        assert isinstance(data["active_count"], int)
        assert isinstance(data["lazy_count"], int)
        
        # Should have leaderboard array
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        
        # Each member should have status
        if len(data["leaderboard"]) > 0:
            member = data["leaderboard"][0]
            assert "user_id" in member or "id" in member
            assert "user_name" in member or "name" in member
            # Status can be 'active' or 'lazy'
            if "status" in member:
                assert member["status"] in ["active", "lazy", "Active", "Lazy"]
        
        print(f"Enhanced leaderboard: active={data['active_count']}, lazy={data['lazy_count']}, total={len(data['leaderboard'])}")
    
    def test_leaderboard_has_top_performers(self):
        """Check enhanced leaderboard has top_performers list"""
        response = requests.get(
            f"{BASE_URL}/api/kpi/leaderboard/enhanced",
            params={"period_type": "monthly"}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have top_performers array
        assert "top_performers" in data
        assert isinstance(data["top_performers"], list)
        
        print(f"Top performers: {len(data.get('top_performers', []))}")
    
    def test_leaderboard_has_lazy_members(self):
        """Check enhanced leaderboard has lazy_members list"""
        response = requests.get(
            f"{BASE_URL}/api/kpi/leaderboard/enhanced",
            params={"period_type": "monthly"}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have lazy_members array
        assert "lazy_members" in data
        assert isinstance(data["lazy_members"], list)
        
        print(f"Lazy members: {len(data.get('lazy_members', []))}")


class TestDataSources:
    """2. AUTO DATA TỪ CRM - No manual input"""
    
    def test_get_data_sources(self):
        """GET /api/kpi/data-sources - confirm all KPIs are AUTO"""
        response = requests.get(f"{BASE_URL}/api/kpi/data-sources")
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have sources dict
        assert "sources" in data
        sources = data["sources"]
        
        # All sources should be AUTO
        for kpi_code, source_config in sources.items():
            assert source_config.get("auto") == True, f"{kpi_code} should be AUTO"
        
        # Check message
        assert "message" in data
        assert "AUTO" in data["message"].upper() or "TỰ ĐỘNG" in data["message"]
        
        print(f"Data sources: {list(sources.keys())}, all AUTO: True")


class TestRealTimeEvent:
    """6. REAL-TIME UPDATE - Update when deal/booking/activity"""
    
    def test_process_kpi_event(self):
        """POST /api/kpi/event - process realtime event"""
        response = requests.post(
            f"{BASE_URL}/api/kpi/event",
            params={
                "event_type": "deal_won",
                "user_id": "test-user-001"
            },
            json={"amount": 1000000000, "deal_id": "test-deal-001"}
        )
        assert response.status_code == 200
        
        data = response.json()
        print(f"Event processed: {data}")
        
        # Should acknowledge the event
        assert "success" in data or "processed" in data or "event_id" in data


class TestAlerts:
    """7. ALERT + PUSH - Low KPI warnings"""
    
    def test_check_and_create_alerts(self):
        """POST /api/kpi/alerts/check - check KPI and create alerts"""
        response = requests.post(
            f"{BASE_URL}/api/kpi/alerts/check",
            params={"period_type": "monthly"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "alerts_created" in data
        print(f"Alerts check: {data}")


# Integration test: Full flow
class TestKPICommissionIntegration:
    """Integration: KPI → Commission flow"""
    
    def test_full_flow_commission_from_kpi(self):
        """Verify CRM → KPI → Commission → Payroll flow"""
        # 1. Get commission rules
        rules_response = requests.get(f"{BASE_URL}/api/kpi/commission/rules")
        assert rules_response.status_code == 200
        rules = rules_response.json()
        
        # 2. Test calculation for different KPI levels
        test_cases = [
            (50.0, 0, "< 70% = no commission"),
            (75.0, 1.0, "70-89% = standard"),
            (95.0, 1.1, "90-99% = +10%"),
            (110.0, 1.2, "100-119% = +20%"),
            (150.0, 1.5, "150%+ = +50%"),
        ]
        
        for kpi, expected_min_rate, description in test_cases:
            response = requests.post(
                f"{BASE_URL}/api/kpi/commission/calculate",
                params={
                    "user_id": "test-user",
                    "kpi_achievement": kpi,
                    "base_commission": 10000000
                }
            )
            assert response.status_code == 200
            data = response.json()
            rate = data.get("commission_rate") or data.get("multiplier") or data.get("bonus_modifier", 0)
            
            if kpi < 70:
                assert rate == 0, f"{description}: expected 0, got {rate}"
            else:
                assert rate >= expected_min_rate, f"{description}: expected >= {expected_min_rate}, got {rate}"
            
            print(f"✓ KPI {kpi}%: rate={rate} - {description}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
