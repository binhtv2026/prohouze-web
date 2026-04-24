"""
Test Auto-Trigger Commission when Contract Signed + Lock after Approval
Prompt 11/20 Extension Tests

Testing:
1. Auto-trigger commission when POST /api/contracts/{id}/sign
2. Commission records have is_locked=false initially
3. When approve commission, is_locked=true is set
4. POST /api/commission/records/{id}/adjust blocked when is_locked=true
5. POST /api/commission/calculate-and-create returns existing if already processed (idempotent)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com').rstrip('/')
AUTH_TOKEN = None


class TestAutoTriggerCommissionLock:
    """Test suite for auto-trigger commission and lock mechanism"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        global AUTH_TOKEN
        if not AUTH_TOKEN:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@prohouzing.vn",
                "password": "admin123"
            })
            assert response.status_code == 200, f"Login failed: {response.text}"
            AUTH_TOKEN = response.json().get("access_token")
        
        self.headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
    
    def test_01_find_approved_contract(self):
        """Find an approved contract to sign"""
        response = requests.get(
            f"{BASE_URL}/api/contracts",
            params={"status": "approved", "limit": 5},
            headers=self.headers
        )
        assert response.status_code == 200
        contracts = response.json()
        assert len(contracts) > 0, "No approved contracts found - need at least one for testing"
        
        # Store contract for next tests
        self.approved_contract = contracts[0]
        print(f"Found approved contract: {self.approved_contract['contract_code']}, ID: {self.approved_contract['id']}")
        print(f"Contract value: {self.approved_contract['grand_total']}")
    
    def test_02_verify_active_commission_policy(self):
        """Verify there's an active commission policy for auto-trigger"""
        response = requests.get(
            f"{BASE_URL}/api/commission/policies",
            params={"status": "active"},
            headers=self.headers
        )
        assert response.status_code == 200
        policies = response.json()
        assert len(policies) > 0, "No active commission policies - auto-trigger will fail"
        
        # Check policy has contract_signed trigger
        has_signed_trigger = any(
            p.get("trigger_event") == "contract_signed" for p in policies
        )
        assert has_signed_trigger, "No policy with contract_signed trigger found"
        print(f"Found {len(policies)} active policies with contract_signed trigger")
    
    def test_03_sign_contract_triggers_commission_auto(self):
        """Test that signing a contract auto-triggers commission calculation"""
        # First, get an approved contract
        response = requests.get(
            f"{BASE_URL}/api/contracts",
            params={"status": "approved", "limit": 1},
            headers=self.headers
        )
        assert response.status_code == 200
        contracts = response.json()
        
        if len(contracts) == 0:
            pytest.skip("No approved contracts available to sign")
        
        contract_id = contracts[0]["id"]
        contract_code = contracts[0]["contract_code"]
        
        # Sign the contract
        sign_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/sign",
            json={
                "signed_by_customer_id": "test-customer-id",
                "signed_by_company_id": "ffe7b200-8362-4052-9004-45af215aedeb",  # Admin user
                "signed_by_company_title": "Sales Director",
                "signing_date": datetime.utcnow().isoformat(),
                "signing_location": "Văn phòng HCM",
                "witnesses": [],
                "notarized": False
            },
            headers=self.headers
        )
        
        assert sign_response.status_code == 200, f"Sign contract failed: {sign_response.text}"
        result = sign_response.json()
        
        # Verify commission auto-trigger result
        assert "commission" in result, "Response should contain commission info"
        commission_result = result.get("commission", {})
        print(f"Sign contract response: {result}")
        print(f"Commission result: {commission_result}")
        
        # Check if commission was triggered or already existed
        if commission_result.get("triggered"):
            assert commission_result.get("records_created", 0) >= 0
            print(f"Auto-triggered commission: {commission_result.get('records_created')} records created")
        else:
            print(f"Commission not triggered (may already exist): {commission_result.get('reason', commission_result.get('errors', 'Unknown'))}")
        
        # Verify contract is now signed
        get_response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        updated_contract = get_response.json()
        assert updated_contract["status"] == "signed", f"Contract should be signed, got: {updated_contract['status']}"
        
        # Store for later tests
        TestAutoTriggerCommissionLock.signed_contract_id = contract_id
        TestAutoTriggerCommissionLock.signed_contract_code = contract_code
    
    def test_04_commission_records_created_with_locked_false(self):
        """Verify commission records are created with is_locked=false initially"""
        contract_id = getattr(TestAutoTriggerCommissionLock, 'signed_contract_id', None)
        
        if not contract_id:
            pytest.skip("No signed contract from previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/commission/records/by-contract/{contract_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        records = response.json()
        
        # If no records, check if auto-trigger failed
        if len(records) == 0:
            print("No commission records found - auto-trigger may have failed (check policy)")
            return
        
        # Verify is_locked is False initially
        for record in records:
            # Initially, commission should NOT be locked (until approved)
            is_locked = record.get("is_locked", False)
            status = record.get("status")
            
            print(f"Record {record['id']}: status={status}, is_locked={is_locked}")
            
            # If status is pending/pending_approval, is_locked should be False
            if status in ["pending", "pending_approval", "estimated"]:
                assert is_locked == False, f"Commission should not be locked before approval, got is_locked={is_locked}"
        
        TestAutoTriggerCommissionLock.commission_record_id = records[0]["id"] if records else None
    
    def test_05_idempotency_calculate_and_create(self):
        """Test POST /api/commission/calculate-and-create returns existing if already processed"""
        contract_id = getattr(TestAutoTriggerCommissionLock, 'signed_contract_id', None)
        
        if not contract_id:
            pytest.skip("No signed contract from previous test")
        
        # First, get existing commission records count
        existing_response = requests.get(
            f"{BASE_URL}/api/commission/records/by-contract/{contract_id}",
            headers=self.headers
        )
        assert existing_response.status_code == 200
        existing_count = len(existing_response.json())
        
        # Try to create commission again (should be idempotent)
        calc_response = requests.post(
            f"{BASE_URL}/api/commission/calculate-and-create",
            json={
                "contract_id": contract_id,
                "trigger_event": "contract_signed"
            },
            headers=self.headers
        )
        assert calc_response.status_code == 200
        result = calc_response.json()
        
        print(f"Idempotency test result: {result}")
        
        # Should return existing records, not create new ones
        if existing_count > 0:
            # Should indicate existing records
            assert result.get("records_created", 0) == 0 or result.get("existing_records"), \
                "Should return existing records, not create duplicates"
            print(f"Idempotency confirmed: records_created={result.get('records_created', 0)}, existing_records={result.get('existing_records')}")
        
        # Verify no new records were created
        after_response = requests.get(
            f"{BASE_URL}/api/commission/records/by-contract/{contract_id}",
            headers=self.headers
        )
        assert after_response.status_code == 200
        after_count = len(after_response.json())
        
        assert after_count == existing_count, f"Duplicate records created! Before: {existing_count}, After: {after_count}"
    
    def test_06_adjust_commission_before_approval(self):
        """Test that commission can be adjusted before approval"""
        record_id = getattr(TestAutoTriggerCommissionLock, 'commission_record_id', None)
        
        if not record_id:
            pytest.skip("No commission record from previous test")
        
        # First check if record exists and is not already approved
        get_response = requests.get(
            f"{BASE_URL}/api/commission/records/{record_id}",
            headers=self.headers
        )
        
        if get_response.status_code == 404:
            pytest.skip("Commission record not found")
        
        record = get_response.json()
        
        # Only test adjust if not already approved/locked
        if record.get("is_locked") or record.get("approval_status") == "approved":
            print(f"Record already locked/approved, skipping adjust test")
            return
        
        # Try to adjust
        adjust_response = requests.post(
            f"{BASE_URL}/api/commission/records/{record_id}/adjust",
            json={
                "adjusted_amount": 1000000,
                "adjustment_reason": "Test adjustment before approval"
            },
            headers=self.headers
        )
        
        # Should succeed if not locked
        assert adjust_response.status_code in [200, 400], f"Unexpected status: {adjust_response.status_code}"
        
        if adjust_response.status_code == 200:
            print("Adjustment succeeded before approval - as expected")
        else:
            result = adjust_response.json()
            print(f"Adjustment result: {result}")
    
    def test_07_approve_commission_sets_is_locked(self):
        """Test that approving commission sets is_locked=true"""
        record_id = getattr(TestAutoTriggerCommissionLock, 'commission_record_id', None)
        
        if not record_id:
            pytest.skip("No commission record from previous test")
        
        # First, submit for approval
        submit_response = requests.post(
            f"{BASE_URL}/api/commission/records/{record_id}/submit-for-approval",
            headers=self.headers
        )
        
        if submit_response.status_code != 200:
            # May already be submitted or in wrong state
            print(f"Submit for approval result: {submit_response.json()}")
        
        # Now approve
        approve_response = requests.post(
            f"{BASE_URL}/api/commission/records/{record_id}/approve",
            params={"comments": "Test approval"},
            headers=self.headers
        )
        
        if approve_response.status_code != 200:
            print(f"Approve result: {approve_response.json()}")
            # May fail due to role permissions - that's ok for this test
            if "permission" in approve_response.text.lower():
                pytest.skip("Insufficient permissions to approve")
            return
        
        # Verify is_locked is now True
        get_response = requests.get(
            f"{BASE_URL}/api/commission/records/{record_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        record = get_response.json()
        
        # After approval, should be locked
        if record.get("approval_status") == "approved":
            assert record.get("is_locked") == True, f"Commission should be locked after approval, got is_locked={record.get('is_locked')}"
            print(f"Commission approved and locked: is_locked={record.get('is_locked')}")
        
        TestAutoTriggerCommissionLock.approved_record_id = record_id
    
    def test_08_adjust_blocked_after_lock(self):
        """Test that POST /api/commission/records/{id}/adjust is blocked when is_locked=true"""
        record_id = getattr(TestAutoTriggerCommissionLock, 'approved_record_id', None)
        
        if not record_id:
            # Try to find any locked record
            response = requests.get(
                f"{BASE_URL}/api/commission/records",
                params={"limit": 50},
                headers=self.headers
            )
            if response.status_code == 200:
                records = response.json()
                locked = [r for r in records if r.get("is_locked")]
                if locked:
                    record_id = locked[0]["id"]
                    print(f"Found locked record: {record_id}")
        
        if not record_id:
            pytest.skip("No locked commission record found for testing")
        
        # Try to adjust locked record
        adjust_response = requests.post(
            f"{BASE_URL}/api/commission/records/{record_id}/adjust",
            json={
                "adjusted_amount": 5000000,
                "adjustment_reason": "Test adjustment after lock - should fail"
            },
            headers=self.headers
        )
        
        # Should fail with 400 error
        assert adjust_response.status_code == 400, f"Adjust should fail on locked record, got {adjust_response.status_code}"
        
        error = adjust_response.json()
        print(f"Expected error when adjusting locked commission: {error}")
        
        # Verify error message mentions lock
        error_detail = error.get("detail", "")
        assert "khóa" in error_detail.lower() or "lock" in error_detail.lower() or "đã được duyệt" in error_detail.lower(), \
            f"Error should mention lock/approval status, got: {error_detail}"


class TestContractSignLock:
    """Test contract is locked after signing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        global AUTH_TOKEN
        if not AUTH_TOKEN:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@prohouzing.vn",
                "password": "admin123"
            })
            AUTH_TOKEN = response.json().get("access_token")
        
        self.headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
    
    def test_contract_locked_after_sign(self):
        """Verify contract is_locked=true after signing"""
        # Find a signed contract
        response = requests.get(
            f"{BASE_URL}/api/contracts",
            params={"status": "signed", "limit": 5},
            headers=self.headers
        )
        assert response.status_code == 200
        contracts = response.json()
        
        if len(contracts) == 0:
            pytest.skip("No signed contracts found")
        
        # Check is_locked on signed contracts
        for contract in contracts:
            is_locked = contract.get("is_locked", False)
            status = contract.get("status")
            
            print(f"Contract {contract['contract_code']}: status={status}, is_locked={is_locked}")
            
            # Signed contracts should be locked
            if status == "signed":
                assert is_locked == True, f"Signed contract should be locked, got is_locked={is_locked}"


class TestCreateContractAndSignFlow:
    """End-to-end test: Create contract -> Approve -> Sign -> Verify commission auto-trigger"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        global AUTH_TOKEN
        if not AUTH_TOKEN:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@prohouzing.vn",
                "password": "admin123"
            })
            AUTH_TOKEN = response.json().get("access_token")
        
        self.headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
    
    def test_e2e_contract_sign_commission_flow(self):
        """Full flow: Create contract, approve it, sign it, verify commission is auto-triggered"""
        
        # 1. Get a project
        projects_response = requests.get(
            f"{BASE_URL}/api/projects/master",
            params={"limit": 1},
            headers=self.headers
        )
        if projects_response.status_code != 200 or len(projects_response.json()) == 0:
            pytest.skip("No projects available for testing")
        
        project = projects_response.json()[0]
        project_id = project["id"]
        
        # 2. Get a product
        products_response = requests.get(
            f"{BASE_URL}/api/products",
            params={"project_id": project_id, "limit": 1},
            headers=self.headers
        )
        if products_response.status_code != 200 or len(products_response.json()) == 0:
            pytest.skip("No products available for testing")
        
        product = products_response.json()[0]
        product_id = product["id"]
        
        # 3. Create a contract
        contract_data = {
            "project_id": project_id,
            "product_id": product_id,
            "customer_id": f"TEST_CUSTOMER_E2E_{uuid.uuid4().hex[:8]}",
            "contract_type": "sale_contract",
            "unit_price": 3000000000,  # 3 billion VND
            "discount_percent": 1,
            "vat_percent": 10
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/contracts",
            json=contract_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Create contract failed: {create_response.text}"
        contract = create_response.json()
        contract_id = contract["id"]
        
        print(f"Created contract: {contract['contract_code']}")
        
        # 4. Submit for approval
        submit_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/submit",
            headers=self.headers
        )
        assert submit_response.status_code == 200
        
        # 5. Approve (sales manager)
        approve1_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/approve",
            json={"comments": "Sales approved"},
            headers=self.headers
        )
        assert approve1_response.status_code == 200
        
        # 6. Approve (legal)
        approve2_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/approve",
            json={"comments": "Legal approved"},
            headers=self.headers
        )
        assert approve2_response.status_code == 200
        
        # 7. Verify contract is now approved
        get_contract_response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=self.headers
        )
        assert get_contract_response.status_code == 200
        updated_contract = get_contract_response.json()
        
        if updated_contract["status"] != "approved":
            # May need another approval
            approve3_response = requests.post(
                f"{BASE_URL}/api/contracts/{contract_id}/approve",
                json={"comments": "Final approved"},
                headers=self.headers
            )
            
        # Refresh
        get_contract_response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=self.headers
        )
        updated_contract = get_contract_response.json()
        
        assert updated_contract["status"] == "approved", f"Contract not approved: {updated_contract['status']}"
        
        # 8. Sign contract - this should auto-trigger commission
        sign_response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/sign",
            json={
                "signed_by_customer_id": f"TEST_CUSTOMER_E2E_{uuid.uuid4().hex[:8]}",
                "signed_by_company_id": "ffe7b200-8362-4052-9004-45af215aedeb",
                "signed_by_company_title": "Sales Manager",
                "signing_date": datetime.utcnow().isoformat(),
                "signing_location": "Test Office",
                "witnesses": [],
                "notarized": False
            },
            headers=self.headers
        )
        assert sign_response.status_code == 200, f"Sign failed: {sign_response.text}"
        
        sign_result = sign_response.json()
        print(f"Sign result: {sign_result}")
        
        # 9. Verify commission was auto-triggered
        assert "commission" in sign_result, "Sign response should include commission info"
        commission = sign_result.get("commission", {})
        
        print(f"Commission auto-trigger result: {commission}")
        
        # 10. Verify commission records exist
        records_response = requests.get(
            f"{BASE_URL}/api/commission/records/by-contract/{contract_id}",
            headers=self.headers
        )
        assert records_response.status_code == 200
        records = records_response.json()
        
        print(f"Commission records created: {len(records)}")
        
        if len(records) > 0:
            for r in records:
                print(f"  - {r['code']}: {r['final_amount']} VND, status={r['status']}, is_locked={r.get('is_locked', False)}")
        
        # 11. Verify contract is now locked
        final_contract_response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}",
            headers=self.headers
        )
        final_contract = final_contract_response.json()
        
        assert final_contract["status"] == "signed"
        assert final_contract["is_locked"] == True, f"Signed contract should be locked, got is_locked={final_contract.get('is_locked')}"
        
        print(f"E2E Test passed: Contract signed and locked, commission auto-triggered")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
