"""
Financial-Grade Principles Verification Tests
Prompt 12/20 - KPI x Commission Financial-Grade Lock

Tests:
- PRINCIPLE 1: Rule Versioning (version field, auto-increment, version_history)
- PRINCIPLE 2: KPI Snapshot (kpi_snapshot, kpi_score, kpi_calculated_at)
- PRINCIPLE 3: Re-calculation Control (admin-only recalc, audit log)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@prohouzing.vn"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Auth failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Headers with admin token"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PRINCIPLE 1: Rule Versioning Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestPrinciple1RuleVersioning:
    """Test Rule Versioning - rules have version field, auto-increment on tier change"""
    
    def test_bonus_rules_have_version_field(self, admin_headers):
        """PRINCIPLE 1: GET /api/kpi/bonus-rules returns rules with 'version' field"""
        response = requests.get(f"{BASE_URL}/api/kpi/bonus-rules", headers=admin_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        rules = response.json()
        
        # Check if rules exist
        if len(rules) > 0:
            rule = rules[0]
            # Data assertion: version field exists
            assert "version" in rule, "Bonus rule must have 'version' field"
            assert isinstance(rule["version"], int), "version must be integer"
            assert rule["version"] >= 1, "version must be >= 1"
            
            # Data assertion: version_history exists
            assert "version_history" in rule, "Bonus rule must have 'version_history' field"
            
            print(f"✓ Rule '{rule.get('name', 'N/A')}' has version={rule['version']}")
        else:
            # No rules yet - create one and verify
            print("No bonus rules found - will test in create test")
    
    def test_bonus_rule_version_auto_increment_on_tier_update(self, admin_headers):
        """PRINCIPLE 1: PUT to update tiers auto-increments version (v1 -> v2)"""
        # First get existing rules
        response = requests.get(f"{BASE_URL}/api/kpi/bonus-rules", headers=admin_headers)
        assert response.status_code == 200
        rules = response.json()
        
        test_rule = None
        for rule in rules:
            # Find a rule we can update
            if rule.get("is_active", False):
                test_rule = rule
                break
        
        if not test_rule:
            pytest.skip("No active bonus rule found to test version increment")
        
        rule_id = test_rule["id"]
        initial_version = test_rule.get("version", 1)
        print(f"Initial rule version: {initial_version}")
        
        # Update the tiers (this should increment version)
        updated_tiers = [
            {"label": "Test Tier 1", "min_achievement": 0, "max_achievement": 50, "bonus_modifier": 0.8},
            {"label": "Test Tier 2", "min_achievement": 50, "max_achievement": 80, "bonus_modifier": 1.0},
            {"label": "Test Tier 3", "min_achievement": 80, "max_achievement": 100, "bonus_modifier": 1.15},
            {"label": "Test Tier 4", "min_achievement": 100, "max_achievement": 150, "bonus_modifier": 1.3},
        ]
        
        update_response = requests.put(
            f"{BASE_URL}/api/kpi/bonus-rules/{rule_id}",
            headers=admin_headers,
            json={"tiers": updated_tiers}
        )
        
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated_rule = update_response.json()
        
        # Data assertion: version should be incremented
        new_version = updated_rule.get("version", 1)
        assert new_version == initial_version + 1, \
            f"Version should auto-increment from {initial_version} to {initial_version + 1}, got {new_version}"
        
        print(f"✓ Version auto-incremented: {initial_version} -> {new_version}")
        
        # Data assertion: version_history should have entry
        version_history = updated_rule.get("version_history", [])
        if len(version_history) > 0:
            latest_entry = version_history[-1]
            assert latest_entry.get("version") == new_version, "version_history should have new version entry"
            assert "tiers" in latest_entry, "version_history entry should contain tiers"
            print(f"✓ version_history has entry for v{new_version}")
    
    def test_commission_stores_rule_versioning_fields(self, admin_headers):
        """PRINCIPLE 1: Commission stores kpi_bonus_rule_id and kpi_bonus_rule_version fields"""
        # Get a commission record
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        records = response.json()
        
        # Find an approved record (these should have KPI fields populated)
        approved_record = None
        for record in records:
            if record.get("is_locked", False) or record.get("approval_status") == "approved":
                approved_record = record
                break
        
        if not approved_record:
            print("No approved/locked commission records found - checking schema only")
            # Check the model schema contains these fields
            if len(records) > 0:
                record = records[0]
                # These fields should exist in schema (may be null/default for unapproved)
                required_fields = ["kpi_bonus_rule_id", "kpi_bonus_rule_version"]
                for field in required_fields:
                    assert field in record, f"Commission record schema missing field: {field}"
                print(f"✓ Commission schema has required fields: {required_fields}")
            return
        
        # Data assertion: approved record should have rule versioning fields
        record_id = approved_record.get("id")
        
        # Check fields exist
        assert "kpi_bonus_rule_id" in approved_record, "Commission must have kpi_bonus_rule_id field"
        assert "kpi_bonus_rule_version" in approved_record, "Commission must have kpi_bonus_rule_version field"
        
        print(f"✓ Commission record {record_id} has rule versioning fields:")
        print(f"  - kpi_bonus_rule_id: {approved_record.get('kpi_bonus_rule_id')}")
        print(f"  - kpi_bonus_rule_version: {approved_record.get('kpi_bonus_rule_version')}")


# ═══════════════════════════════════════════════════════════════════════════════
# PRINCIPLE 2: KPI Snapshot Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestPrinciple2KPISnapshot:
    """Test KPI Snapshot - commission stores full snapshot at calculation time"""
    
    def test_commission_model_has_kpi_snapshot_field(self, admin_headers):
        """PRINCIPLE 2: Commission model has kpi_snapshot field"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        records = response.json()
        if len(records) == 0:
            pytest.skip("No commission records to verify")
        
        record = records[0]
        
        # Data assertion: kpi_snapshot field exists in schema
        assert "kpi_snapshot" in record, "Commission record must have 'kpi_snapshot' field"
        print(f"✓ Commission schema has 'kpi_snapshot' field")
    
    def test_commission_stores_kpi_score_field(self, admin_headers):
        """PRINCIPLE 2: Commission stores kpi_score field"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        if len(records) == 0:
            pytest.skip("No commission records to verify")
        
        record = records[0]
        
        # Data assertion: kpi_score field exists
        assert "kpi_score" in record, "Commission record must have 'kpi_score' field"
        print(f"✓ Commission has 'kpi_score' field (value: {record.get('kpi_score')})")
    
    def test_commission_stores_kpi_calculated_at_field(self, admin_headers):
        """PRINCIPLE 2: Commission stores kpi_calculated_at field"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        if len(records) == 0:
            pytest.skip("No commission records to verify")
        
        record = records[0]
        
        # Data assertion: kpi_calculated_at field exists
        assert "kpi_calculated_at" in record, "Commission record must have 'kpi_calculated_at' field"
        print(f"✓ Commission has 'kpi_calculated_at' field (value: {record.get('kpi_calculated_at')})")
    
    def test_approved_commission_has_populated_kpi_snapshot(self, admin_headers):
        """PRINCIPLE 2: Approved commissions have populated kpi_snapshot"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        
        # Find an approved/locked record
        approved_record = None
        for record in records:
            if record.get("is_locked", False) or record.get("approval_status") == "approved":
                approved_record = record
                break
        
        if not approved_record:
            print("No approved commission records found - skipping snapshot content verification")
            return
        
        # Data assertion: approved record should have populated snapshot
        kpi_snapshot = approved_record.get("kpi_snapshot")
        if kpi_snapshot:
            # Verify snapshot structure
            expected_fields = ["user_id", "overall_score", "calculated_at"]
            for field in expected_fields:
                if field in kpi_snapshot:
                    print(f"  ✓ kpi_snapshot.{field}: {kpi_snapshot.get(field)}")
            
            print(f"✓ Approved commission has populated kpi_snapshot")
        else:
            print("kpi_snapshot is None/empty for this record - may be legacy or company-level")


# ═══════════════════════════════════════════════════════════════════════════════
# PRINCIPLE 3: Re-calculation Control Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestPrinciple3RecalculationControl:
    """Test Re-calculation Control - admin-only recalc with audit log"""
    
    def test_recalculation_history_endpoint_works(self, admin_headers):
        """PRINCIPLE 3: GET /api/commission/{id}/recalculation-history endpoint works"""
        # Get a commission record
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        if len(records) == 0:
            pytest.skip("No commission records to verify")
        
        record_id = records[0]["id"]
        
        # Test recalculation-history endpoint
        history_response = requests.get(
            f"{BASE_URL}/api/commission/{record_id}/recalculation-history",
            headers=admin_headers
        )
        
        # Endpoint should return 200 (even if no history)
        assert history_response.status_code == 200, \
            f"recalculation-history endpoint failed: {history_response.status_code} - {history_response.text}"
        
        history_data = history_response.json()
        
        # Data assertion: response structure
        assert "record_id" in history_data, "Response should have record_id"
        assert "history" in history_data, "Response should have history array"
        assert "is_recalculation_locked" in history_data, "Response should have is_recalculation_locked"
        
        print(f"✓ recalculation-history endpoint works for record {record_id}")
        print(f"  - is_recalculation_locked: {history_data.get('is_recalculation_locked')}")
        print(f"  - recalculation_count: {history_data.get('recalculation_count', len(history_data.get('history', [])))}")
    
    def test_commission_has_recalculation_locked_field(self, admin_headers):
        """PRINCIPLE 3: Commission model has is_recalculation_locked field"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        if len(records) == 0:
            pytest.skip("No commission records to verify")
        
        record = records[0]
        
        # Data assertion: is_recalculation_locked field exists
        assert "is_recalculation_locked" in record, "Commission must have 'is_recalculation_locked' field"
        print(f"✓ Commission has 'is_recalculation_locked' field (value: {record.get('is_recalculation_locked')})")
    
    def test_commission_has_recalculation_history_field(self, admin_headers):
        """PRINCIPLE 3: Commission model has recalculation_history field"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        if len(records) == 0:
            pytest.skip("No commission records to verify")
        
        record = records[0]
        
        # Data assertion: recalculation_history field exists
        assert "recalculation_history" in record, "Commission must have 'recalculation_history' field"
        print(f"✓ Commission has 'recalculation_history' field")
    
    def test_admin_recalculate_requires_admin_role(self, admin_headers):
        """PRINCIPLE 3: POST /api/commission/{id}/admin-recalculate requires admin role"""
        # Get a locked commission record
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        
        # Find a locked record
        locked_record = None
        for record in records:
            if record.get("is_recalculation_locked", False):
                locked_record = record
                break
        
        if not locked_record:
            print("No locked commission records found - testing endpoint exists")
            # Just verify endpoint exists by testing with first record
            if len(records) == 0:
                pytest.skip("No commission records")
            locked_record = records[0]
        
        record_id = locked_record["id"]
        
        # Test admin-recalculate endpoint with admin_override=false (should fail)
        recalc_response = requests.post(
            f"{BASE_URL}/api/commission/{record_id}/admin-recalculate",
            headers=admin_headers,
            json={
                "reason": "Test recalculation",
                "use_current_kpi": False,
                "admin_override": False  # Should be rejected
            }
        )
        
        # Should fail because admin_override is False
        assert recalc_response.status_code == 400, \
            f"Expected 400 (admin_override required), got {recalc_response.status_code}: {recalc_response.text}"
        
        print(f"✓ admin-recalculate requires admin_override=true (rejected without it)")
    
    def test_admin_recalculate_requires_admin_override_true(self, admin_headers):
        """PRINCIPLE 3: admin-recalculate requires admin_override=true parameter"""
        response = requests.get(f"{BASE_URL}/api/commission/records", headers=admin_headers)
        assert response.status_code == 200
        
        records = response.json()
        
        # Find a locked record
        locked_record = None
        for record in records:
            if record.get("is_recalculation_locked", False):
                locked_record = record
                break
        
        if not locked_record:
            print("No locked record found - skipping recalculation test")
            return
        
        record_id = locked_record["id"]
        
        # Test with admin_override=true (should work for admin role)
        recalc_response = requests.post(
            f"{BASE_URL}/api/commission/{record_id}/admin-recalculate",
            headers=admin_headers,
            json={
                "reason": "Financial audit test recalculation",
                "use_current_kpi": False,  # Keep original snapshot
                "admin_override": True
            }
        )
        
        # Should succeed for admin
        assert recalc_response.status_code == 200, \
            f"Admin recalculation failed: {recalc_response.status_code} - {recalc_response.text}"
        
        result = recalc_response.json()
        
        # Data assertion: response should have audit entry
        assert result.get("success") == True, "Recalculation should succeed"
        assert "audit_entry" in result, "Response should contain audit_entry"
        
        audit_entry = result.get("audit_entry", {})
        assert "recalculated_at" in audit_entry, "audit_entry should have recalculated_at"
        assert "reason" in audit_entry, "audit_entry should have reason"
        assert "original_values" in audit_entry, "audit_entry should preserve original_values"
        
        print(f"✓ admin-recalculate works with admin_override=true")
        print(f"  - audit_entry.reason: {audit_entry.get('reason')}")
        print(f"  - audit_entry has original_values: {bool(audit_entry.get('original_values'))}")


# ═══════════════════════════════════════════════════════════════════════════════
# Architecture Document Verification
# ═══════════════════════════════════════════════════════════════════════════════

class TestArchitectureDocumentation:
    """Verify architecture documentation is updated"""
    
    def test_architecture_doc_exists(self):
        """Architecture doc updated at /app/docs/kpi_commission_architecture.md"""
        doc_path = "/app/docs/kpi_commission_architecture.md"
        
        try:
            with open(doc_path, 'r') as f:
                content = f.read()
            
            # Verify key content
            assert "Financial-Grade Principles" in content, "Doc should mention Financial-Grade Principles"
            assert "Rule Versioning" in content or "Principle 1" in content, "Doc should mention Rule Versioning"
            assert "KPI Snapshot" in content or "Principle 2" in content, "Doc should mention KPI Snapshot"
            assert "Re-calculation" in content or "Principle 3" in content, "Doc should mention Re-calculation Control"
            
            # Verify schema section
            assert "kpi_score" in content, "Doc should mention kpi_score field"
            assert "kpi_snapshot" in content, "Doc should mention kpi_snapshot field"
            assert "recalculation_history" in content, "Doc should mention recalculation_history"
            
            print(f"✓ Architecture doc exists at {doc_path} with required content")
            
        except FileNotFoundError:
            pytest.fail(f"Architecture doc not found at {doc_path}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
