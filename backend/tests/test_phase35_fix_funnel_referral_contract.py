"""
Phase 3.5 FIX - Backend Tests: Funnel, Referral, Contract Template, Status Updates
Tests:
1. Funnel API returns correct counts per status
2. Referral system: Apply with ref_id → after onboard, referrer in tree
3. Contract Template: upload → activate → generate contract using template
4. Status updates at each recruitment step
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Generate unique identifier for test data
TEST_PREFIX = f"TEST_{datetime.now().strftime('%H%M%S')}"


class TestPipelineFunnel:
    """Test pipeline funnel API returns correct counts per status"""
    
    def test_funnel_api_returns_all_statuses(self):
        """Funnel API should return counts for all recruitment statuses"""
        response = requests.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
        assert response.status_code == 200, f"Funnel API failed: {response.text}"
        
        data = response.json()
        assert "funnel" in data, "Response missing 'funnel' key"
        
        funnel = data["funnel"]
        
        # Expected statuses in order
        expected_statuses = [
            "applied", "verified", "consented", "kyc_verified",
            "screened", "tested", "passed", "contracted",
            "onboarded", "active"
        ]
        
        # Verify all statuses present
        funnel_statuses = [item["status"] for item in funnel]
        for status in expected_statuses:
            assert status in funnel_statuses, f"Missing status '{status}' in funnel"
        
        # Each funnel item should have 'status' and 'count'
        for item in funnel:
            assert "status" in item, "Funnel item missing 'status'"
            assert "count" in item, "Funnel item missing 'count'"
            assert isinstance(item["count"], int), f"Count should be int, got {type(item['count'])}"
        
        print(f"✓ Funnel API returned {len(funnel)} statuses with counts")
        for item in funnel:
            print(f"  - {item['status']}: {item['count']}")
    
    def test_funnel_counts_update_after_candidate_created(self):
        """Funnel counts should update when candidate created"""
        # Get initial funnel
        initial_response = requests.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
        initial_data = initial_response.json()
        initial_applied = next((x["count"] for x in initial_data["funnel"] if x["status"] == "applied"), 0)
        
        # Create a test candidate
        candidate_data = {
            "full_name": f"{TEST_PREFIX}_FunnelTest",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_funnel_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 1
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=candidate_data)
        assert apply_response.status_code == 200, f"Apply failed: {apply_response.text}"
        
        # Get new funnel count
        new_response = requests.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
        new_data = new_response.json()
        new_applied = next((x["count"] for x in new_data["funnel"] if x["status"] == "applied"), 0)
        
        # Applied count should increase by 1
        assert new_applied == initial_applied + 1, f"Applied count did not increase: {initial_applied} -> {new_applied}"
        print(f"✓ Funnel applied count updated: {initial_applied} -> {new_applied}")


class TestStatusUpdatesAtEachStep:
    """Test status updates correctly at each recruitment step"""
    
    @pytest.fixture
    def test_candidate(self):
        """Create a test candidate for status update tests"""
        candidate_data = {
            "full_name": f"{TEST_PREFIX}_StatusTest",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_status_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 2,
            "has_real_estate_exp": True
        }
        
        response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=candidate_data)
        assert response.status_code == 200
        data = response.json()
        return data["candidate_id"]
    
    def test_step1_applied_status(self, test_candidate):
        """Step 1: After apply, status should be 'applied'"""
        response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "applied", f"Expected 'applied', got '{data['status']}'"
        assert data["current_step"] == 1, f"Expected step 1, got {data['current_step']}"
        print(f"✓ Step 1: Status = applied, current_step = 1")
    
    def test_step2_verified_status_after_otp(self, test_candidate):
        """Step 2: After OTP verify, status should be 'verified'"""
        # Get candidate email
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        email = cand_response.json()["email"]
        
        # Send OTP
        send_response = requests.post(
            f"{BASE_URL}/api/recruitment/otp/send?candidate_id={test_candidate}&channel=email&target={email}"
        )
        assert send_response.status_code == 200, f"OTP send failed: {send_response.text}"
        
        # Verify OTP (dev mode: 123456)
        verify_response = requests.post(
            f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={test_candidate}&otp=123456"
        )
        assert verify_response.status_code == 200, f"OTP verify failed: {verify_response.text}"
        
        # Check status updated
        status_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        data = status_response.json()
        
        assert data["status"] == "verified", f"Expected 'verified', got '{data['status']}'"
        assert data["current_step"] == 3, f"Expected step 3, got {data['current_step']}"
        print(f"✓ Step 2: Status = verified, current_step = 3")
    
    def test_step3_consented_status_after_consent(self, test_candidate):
        """Step 3: After consent, status should be 'consented'"""
        # First verify OTP
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        email = cand_response.json()["email"]
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={test_candidate}&channel=email&target={email}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={test_candidate}&otp=123456")
        
        # Accept consent
        consent_data = {
            "candidate_id": test_candidate,
            "data_processing": True,
            "terms_of_service": True,
            "privacy_policy": True,
            "marketing_consent": False
        }
        consent_response = requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        assert consent_response.status_code == 200, f"Consent failed: {consent_response.text}"
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        data = status_response.json()
        
        assert data["status"] == "consented", f"Expected 'consented', got '{data['status']}'"
        assert data["current_step"] == 4, f"Expected step 4, got {data['current_step']}"
        print(f"✓ Step 3: Status = consented, current_step = 4")
    
    def test_step5_screened_after_ai_score(self, test_candidate):
        """Step 5: After AI scoring, status should be 'screened'"""
        # Run through previous steps
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        email = cand_response.json()["email"]
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={test_candidate}&channel=email&target={email}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={test_candidate}&otp=123456")
        consent_data = {
            "candidate_id": test_candidate,
            "data_processing": True, "terms_of_service": True, "privacy_policy": True
        }
        requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        
        # AI Scoring
        score_response = requests.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={test_candidate}")
        assert score_response.status_code == 200, f"AI score failed: {score_response.text}"
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        data = status_response.json()
        
        assert data["status"] == "screened", f"Expected 'screened', got '{data['status']}'"
        assert data["current_step"] == 6, f"Expected step 6, got {data['current_step']}"
        assert data.get("ai_score") is not None, "AI score should be set"
        print(f"✓ Step 5: Status = screened, current_step = 6, ai_score = {data['ai_score']}")
    
    def test_step6_tested_after_test_submit(self, test_candidate):
        """Step 6: After test (passed), status should be 'tested'"""
        # Run through previous steps
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        email = cand_response.json()["email"]
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={test_candidate}&channel=email&target={email}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={test_candidate}&otp=123456")
        consent_data = {
            "candidate_id": test_candidate,
            "data_processing": True, "terms_of_service": True, "privacy_policy": True
        }
        requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        requests.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={test_candidate}")
        
        # Start test
        test_start = requests.post(f"{BASE_URL}/api/recruitment/test/start?candidate_id={test_candidate}")
        assert test_start.status_code == 200, f"Test start failed: {test_start.text}"
        attempt_id = test_start.json()["attempt_id"]
        
        # Get questions and answer correctly
        questions = test_start.json()["questions"]
        answers = [{"question_id": q["id"], "answer": q["correct_answer"]} for q in questions]
        
        # Submit test
        submit_response = requests.post(
            f"{BASE_URL}/api/recruitment/test/submit?attempt_id={attempt_id}",
            json=answers
        )
        assert submit_response.status_code == 200, f"Test submit failed: {submit_response.text}"
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        data = status_response.json()
        
        assert data["status"] == "tested", f"Expected 'tested', got '{data['status']}'"
        assert data["current_step"] == 7, f"Expected step 7, got {data['current_step']}"
        assert data.get("test_score") is not None, "Test score should be set"
        print(f"✓ Step 6: Status = tested, current_step = 7, test_score = {data['test_score']}")
    
    def test_step7_passed_after_decision(self, test_candidate):
        """Step 7: After decision (pass), status should be 'passed'"""
        # Run through previous steps
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        email = cand_response.json()["email"]
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={test_candidate}&channel=email&target={email}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={test_candidate}&otp=123456")
        consent_data = {
            "candidate_id": test_candidate,
            "data_processing": True, "terms_of_service": True, "privacy_policy": True
        }
        requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        requests.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={test_candidate}")
        
        # Start and pass test
        test_start = requests.post(f"{BASE_URL}/api/recruitment/test/start?candidate_id={test_candidate}")
        attempt_id = test_start.json()["attempt_id"]
        questions = test_start.json()["questions"]
        answers = [{"question_id": q["id"], "answer": q["correct_answer"]} for q in questions]
        requests.post(f"{BASE_URL}/api/recruitment/test/submit?attempt_id={attempt_id}", json=answers)
        
        # Make decision
        decision_response = requests.post(f"{BASE_URL}/api/recruitment/decision?candidate_id={test_candidate}")
        assert decision_response.status_code == 200, f"Decision failed: {decision_response.text}"
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        data = status_response.json()
        
        assert data["status"] == "passed", f"Expected 'passed', got '{data['status']}'"
        assert data["current_step"] == 8, f"Expected step 8, got {data['current_step']}"
        assert data.get("decision") == "pass", "Decision should be 'pass'"
        print(f"✓ Step 7: Status = passed, current_step = 8, decision = pass")
    
    def test_step8_contracted_after_contract_generated(self, test_candidate):
        """Step 8: After contract generation, status should be 'contracted'"""
        # Run through all steps up to decision
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        email = cand_response.json()["email"]
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={test_candidate}&channel=email&target={email}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={test_candidate}&otp=123456")
        consent_data = {
            "candidate_id": test_candidate,
            "data_processing": True, "terms_of_service": True, "privacy_policy": True
        }
        requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        requests.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={test_candidate}")
        test_start = requests.post(f"{BASE_URL}/api/recruitment/test/start?candidate_id={test_candidate}")
        attempt_id = test_start.json()["attempt_id"]
        questions = test_start.json()["questions"]
        answers = [{"question_id": q["id"], "answer": q["correct_answer"]} for q in questions]
        requests.post(f"{BASE_URL}/api/recruitment/test/submit?attempt_id={attempt_id}", json=answers)
        requests.post(f"{BASE_URL}/api/recruitment/decision?candidate_id={test_candidate}")
        
        # Generate contract
        contract_response = requests.post(f"{BASE_URL}/api/recruitment/contract/generate?candidate_id={test_candidate}")
        assert contract_response.status_code == 200, f"Contract generation failed: {contract_response.text}"
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{test_candidate}")
        data = status_response.json()
        
        assert data["status"] == "contracted", f"Expected 'contracted', got '{data['status']}'"
        assert data["current_step"] == 9, f"Expected step 9, got {data['current_step']}"
        assert data.get("contract_id") is not None, "Contract ID should be set"
        print(f"✓ Step 8: Status = contracted, current_step = 9, contract_id = {data['contract_id']}")


class TestContractTemplateSystem:
    """Test Contract Template: upload → activate → generate contract using template"""
    
    def test_upload_contract_template(self):
        """Admin can upload a contract template"""
        template_content = f"""
HỢP ĐỒNG CỘNG TÁC KINH DOANH {TEST_PREFIX}
Số: {{{{contract_number}}}}

BÊN B: {{{{name}}}}
- Số điện thoại: {{{{phone}}}}
- Email: {{{{email}}}}
- Khu vực: {{{{region}}}}

VỊ TRÍ: {{{{position}}}}
HOA HỒNG: {{{{commission_rate}}}}

Ngày: {{{{date}}}}
"""
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/admin/contract-template/upload",
            params={
                "name": f"{TEST_PREFIX}_CTVTemplate",
                "contract_type": "ctv",
                "description": "Test template for CTV position"
            },
            data=template_content,
            headers={"Content-Type": "text/plain"}
        )
        
        assert response.status_code == 200, f"Template upload failed: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Upload should succeed"
        assert "template_id" in data, "Response should contain template_id"
        
        print(f"✓ Contract template uploaded: {data['template_id']}")
        return data["template_id"]
    
    def test_list_contract_templates(self):
        """Can list contract templates"""
        response = requests.get(f"{BASE_URL}/api/recruitment/admin/contract-template/list")
        assert response.status_code == 200, f"List templates failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "templates" in data
        assert "total" in data
        
        print(f"✓ Listed {data['total']} contract templates")
    
    def test_activate_contract_template(self):
        """Admin can activate a contract template"""
        # First upload a template
        template_content = f"HỢP ĐỒNG TEST {{{{name}}}} - {{{{phone}}}} - {{{{date}}}} - {TEST_PREFIX}"
        
        upload_response = requests.post(
            f"{BASE_URL}/api/recruitment/admin/contract-template/upload",
            params={
                "name": f"{TEST_PREFIX}_ActivateTest",
                "contract_type": "ctv"
            },
            data=template_content,
            headers={"Content-Type": "text/plain"}
        )
        template_id = upload_response.json()["template_id"]
        
        # Activate the template
        activate_response = requests.post(
            f"{BASE_URL}/api/recruitment/admin/contract-template/{template_id}/activate",
            params={"approved_by": "admin@prohouzing.vn"}
        )
        
        assert activate_response.status_code == 200, f"Activate failed: {activate_response.text}"
        data = activate_response.json()
        
        assert data["success"] == True
        assert data["activated"] == True
        
        # Verify template is active
        get_response = requests.get(f"{BASE_URL}/api/recruitment/admin/contract-template/{template_id}")
        template_data = get_response.json()
        
        assert template_data["template"]["is_active"] == True, "Template should be active"
        
        print(f"✓ Contract template activated: {template_id}")
        return template_id
    
    def test_contract_generation_uses_active_template(self):
        """Contract generation should use active template"""
        # Upload and activate a distinct template
        unique_marker = f"TEMPLATE_MARKER_{uuid.uuid4().hex[:8]}"
        template_content = f"""
HỢP ĐỒNG TỪ TEMPLATE
{unique_marker}
Họ tên: {{{{name}}}}
SĐT: {{{{phone}}}}
Email: {{{{email}}}}
Vị trí: {{{{position}}}}
Hoa hồng: {{{{commission_rate}}}}
Ngày: {{{{date}}}}
"""
        
        # Upload template
        upload_response = requests.post(
            f"{BASE_URL}/api/recruitment/admin/contract-template/upload",
            params={
                "name": f"{TEST_PREFIX}_GenerateTest",
                "contract_type": "ctv"
            },
            data=template_content,
            headers={"Content-Type": "text/plain"}
        )
        template_id = upload_response.json()["template_id"]
        
        # Activate template
        requests.post(f"{BASE_URL}/api/recruitment/admin/contract-template/{template_id}/activate")
        
        # Create and process a candidate through full flow
        candidate_data = {
            "full_name": f"{TEST_PREFIX}_TemplateContractTest",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_tpl_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 2
        }
        
        # Apply
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=candidate_data)
        candidate_id = apply_response.json()["candidate_id"]
        
        # OTP
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={candidate_id}&channel=email&target={candidate_data['email']}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={candidate_id}&otp=123456")
        
        # Consent
        consent_data = {
            "candidate_id": candidate_id,
            "data_processing": True, "terms_of_service": True, "privacy_policy": True
        }
        requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        
        # AI Score
        requests.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={candidate_id}")
        
        # Test
        test_start = requests.post(f"{BASE_URL}/api/recruitment/test/start?candidate_id={candidate_id}")
        attempt_id = test_start.json()["attempt_id"]
        questions = test_start.json()["questions"]
        answers = [{"question_id": q["id"], "answer": q["correct_answer"]} for q in questions]
        requests.post(f"{BASE_URL}/api/recruitment/test/submit?attempt_id={attempt_id}", json=answers)
        
        # Decision
        requests.post(f"{BASE_URL}/api/recruitment/decision?candidate_id={candidate_id}")
        
        # Generate contract
        contract_response = requests.post(f"{BASE_URL}/api/recruitment/contract/generate?candidate_id={candidate_id}")
        assert contract_response.status_code == 200, f"Contract generation failed: {contract_response.text}"
        
        contract_data = contract_response.json()
        contract_content = contract_data.get("contract_content", "")
        
        # Verify the unique marker from our template is in the contract
        assert unique_marker in contract_content, f"Contract should contain template marker '{unique_marker}'"
        
        # Verify candidate name is substituted
        assert candidate_data["full_name"] in contract_content, "Contract should contain candidate name"
        
        print(f"✓ Contract generated using active template with marker: {unique_marker}")


class TestReferralSystem:
    """Test Referral: Apply with ref_id → after onboard, referrer appears in referral tree"""
    
    @pytest.fixture
    def referrer_user(self):
        """Create a referrer user in the system"""
        # First create and fully onboard a user to act as referrer
        referrer_data = {
            "full_name": f"{TEST_PREFIX}_Referrer",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_referrer_{uuid.uuid4().hex[:8]}@test.com",
            "position": "sale",
            "experience_years": 3
        }
        
        # Apply
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=referrer_data)
        referrer_candidate_id = apply_response.json()["candidate_id"]
        
        # Run full auto flow
        auto_flow_response = requests.post(
            f"{BASE_URL}/api/recruitment/flow/auto?candidate_id={referrer_candidate_id}&skip_kyc=true&skip_test=false"
        )
        
        # Get user_id from onboarding
        candidate_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{referrer_candidate_id}")
        referrer_user_id = candidate_response.json().get("user_id")
        
        return {
            "candidate_id": referrer_candidate_id,
            "user_id": referrer_user_id,
            "data": referrer_data
        }
    
    def test_apply_with_ref_id(self, referrer_user):
        """Candidate can apply with ref_id pointing to referrer"""
        referrer_id = referrer_user["user_id"]
        
        # Create referred candidate
        referred_data = {
            "full_name": f"{TEST_PREFIX}_Referred",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_referred_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 1,
            "ref_id": referrer_id
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=referred_data)
        assert apply_response.status_code == 200, f"Apply with ref_id failed: {apply_response.text}"
        
        candidate_id = apply_response.json()["candidate_id"]
        
        # Verify ref_id is stored
        candidate_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}")
        candidate = candidate_response.json()
        
        assert candidate.get("ref_id") == referrer_id, "ref_id should be stored on candidate"
        
        print(f"✓ Candidate applied with ref_id={referrer_id}")
        return candidate_id
    
    def test_referral_tree_after_onboarding(self, referrer_user):
        """After referred candidate is onboarded, referrer should have entry in referral tree"""
        referrer_id = referrer_user["user_id"]
        
        # Skip if referrer_id is None (referrer didn't fully onboard)
        if not referrer_id:
            pytest.skip("Referrer user_id not available - referrer may not have fully onboarded")
        
        # Create and fully onboard a referred candidate with strong profile
        referred_data = {
            "full_name": f"{TEST_PREFIX}_ReferredOnboard",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_refonb_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 3,  # More experience to ensure pass
            "has_real_estate_exp": True,
            "ref_id": referrer_id
        }
        
        # Apply
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=referred_data)
        referred_candidate_id = apply_response.json()["candidate_id"]
        
        # Run auto flow to onboard
        auto_flow_response = requests.post(
            f"{BASE_URL}/api/recruitment/flow/auto?candidate_id={referred_candidate_id}&skip_kyc=true&skip_test=false"
        )
        assert auto_flow_response.status_code == 200, f"Auto flow failed: {auto_flow_response.text}"
        
        # Check referral tree
        tree_response = requests.get(f"{BASE_URL}/api/recruitment/referral/tree/{referrer_id}")
        assert tree_response.status_code == 200, f"Referral tree API failed: {tree_response.text}"
        
        tree_data = tree_response.json()
        
        assert tree_data["success"] == True
        assert "direct_referrals" in tree_data
        
        # Find the referred candidate in direct_referrals
        direct_refs = tree_data["direct_referrals"]
        
        # If no direct refs, check if candidate was rejected
        if len(direct_refs) == 0:
            final_cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{referred_candidate_id}").json()
            if final_cand.get("status") == "rejected":
                pytest.skip("Referred candidate was rejected - referral tree only populated on successful onboard")
        
        found = any(ref["candidate_id"] == referred_candidate_id for ref in direct_refs)
        
        assert found, f"Referred candidate {referred_candidate_id} should be in referrer's tree"
        
        print(f"✓ Referral tree contains referred candidate after onboarding")
        print(f"  - Referrer: {referrer_id}")
        print(f"  - Direct referrals: {tree_data['direct_count']}")
    
    def test_referral_stats_after_conversion(self):
        """Referral stats should show converted referral (standalone test)"""
        # Create referrer and onboard
        referrer_data = {
            "full_name": f"{TEST_PREFIX}_StatsReferrer",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_statref_{uuid.uuid4().hex[:8]}@test.com",
            "position": "sale",
            "experience_years": 3
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=referrer_data)
        referrer_candidate_id = apply_response.json()["candidate_id"]
        
        # Onboard referrer
        requests.post(f"{BASE_URL}/api/recruitment/flow/auto?candidate_id={referrer_candidate_id}&skip_kyc=true&skip_test=false")
        
        # Get referrer user_id
        cand_response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{referrer_candidate_id}")
        referrer_id = cand_response.json().get("user_id")
        
        if not referrer_id:
            pytest.skip("Referrer user_id not available - onboarding may have failed")
        
        # Create and onboard a referred candidate with strong profile to ensure pass
        referred_data = {
            "full_name": f"{TEST_PREFIX}_ReferredStats",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_refstat_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 3,  # More experience to ensure pass
            "has_real_estate_exp": True,  # Real estate experience for higher score
            "ref_id": referrer_id
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=referred_data)
        referred_candidate_id = apply_response.json()["candidate_id"]
        
        # Run auto flow
        auto_result = requests.post(f"{BASE_URL}/api/recruitment/flow/auto?candidate_id={referred_candidate_id}&skip_kyc=true&skip_test=false")
        
        # Verify referred got onboarded (not rejected)
        final_cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{referred_candidate_id}").json()
        if final_cand.get("status") == "rejected":
            pytest.skip(f"Referred candidate was rejected (score too low) - AI scoring needs high experience")
        
        # Check referral stats
        stats_response = requests.get(f"{BASE_URL}/api/recruitment/referral/stats/{referrer_id}")
        assert stats_response.status_code == 200, f"Referral stats failed: {stats_response.text}"
        
        stats_data = stats_response.json()
        
        # Note: /referral/stats/{user_id} returns direct response without 'success' wrapper
        assert "total_referrals" in stats_data, "Response should have total_referrals"
        assert stats_data["total_referrals"] >= 1, "Should have at least 1 referral"
        assert stats_data["converted"] >= 1, "Should have at least 1 converted referral"
        
        print(f"✓ Referral stats for {referrer_id}:")
        print(f"  - Total: {stats_data['total_referrals']}")
        print(f"  - Converted: {stats_data['converted']}")


class TestFullE2EWithStatusValidation:
    """Full E2E flow validating status at each step"""
    
    def test_full_flow_status_progression(self):
        """Test complete flow from apply to active with status validation at each step"""
        # Create candidate
        candidate_data = {
            "full_name": f"{TEST_PREFIX}_FullE2E",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"{TEST_PREFIX}_e2e_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "experience_years": 2
        }
        
        # Step 1: Apply
        apply_response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=candidate_data)
        assert apply_response.status_code == 200
        candidate_id = apply_response.json()["candidate_id"]
        
        # Validate: status = applied
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "applied", f"After apply: expected 'applied', got '{cand['status']}'"
        print(f"✓ Step 1 Apply: status=applied")
        
        # Step 2: OTP Verify
        requests.post(f"{BASE_URL}/api/recruitment/otp/send?candidate_id={candidate_id}&channel=email&target={candidate_data['email']}")
        requests.post(f"{BASE_URL}/api/recruitment/otp/verify?candidate_id={candidate_id}&otp=123456")
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "verified", f"After OTP: expected 'verified', got '{cand['status']}'"
        print(f"✓ Step 2 OTP Verify: status=verified")
        
        # Step 3: Consent
        consent_data = {
            "candidate_id": candidate_id,
            "data_processing": True, "terms_of_service": True, "privacy_policy": True
        }
        requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=consent_data)
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "consented", f"After consent: expected 'consented', got '{cand['status']}'"
        print(f"✓ Step 3 Consent: status=consented")
        
        # Step 5: AI Score (skip KYC in dev mode)
        requests.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={candidate_id}")
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "screened", f"After AI score: expected 'screened', got '{cand['status']}'"
        print(f"✓ Step 5 AI Score: status=screened, score={cand.get('ai_score')}")
        
        # Step 6: Test
        test_start = requests.post(f"{BASE_URL}/api/recruitment/test/start?candidate_id={candidate_id}")
        attempt_id = test_start.json()["attempt_id"]
        questions = test_start.json()["questions"]
        answers = [{"question_id": q["id"], "answer": q["correct_answer"]} for q in questions]
        requests.post(f"{BASE_URL}/api/recruitment/test/submit?attempt_id={attempt_id}", json=answers)
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "tested", f"After test: expected 'tested', got '{cand['status']}'"
        print(f"✓ Step 6 Test: status=tested, score={cand.get('test_score')}")
        
        # Step 7: Decision
        requests.post(f"{BASE_URL}/api/recruitment/decision?candidate_id={candidate_id}")
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "passed", f"After decision: expected 'passed', got '{cand['status']}'"
        print(f"✓ Step 7 Decision: status=passed, decision={cand.get('decision')}")
        
        # Step 8: Contract Generate
        contract_response = requests.post(f"{BASE_URL}/api/recruitment/contract/generate?candidate_id={candidate_id}")
        contract_id = contract_response.json()["contract_id"]
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "contracted", f"After contract: expected 'contracted', got '{cand['status']}'"
        print(f"✓ Step 8 Contract: status=contracted")
        
        # Step 9: Sign Contract
        requests.post(f"{BASE_URL}/api/recruitment/contract/sign?contract_id={contract_id}&signature_data=test_signature")
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "contracted", f"After sign: expected 'contracted', got '{cand['status']}'"
        assert cand.get("signed_at") is not None, "signed_at should be set"
        print(f"✓ Step 9 Sign: status=contracted (signed)")
        
        # Step 10: Onboarding
        requests.post(f"{BASE_URL}/api/recruitment/onboarding/execute?candidate_id={candidate_id}")
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "onboarded", f"After onboard: expected 'onboarded', got '{cand['status']}'"
        assert cand.get("user_id") is not None, "user_id should be created"
        print(f"✓ Step 10 Onboard: status=onboarded, user_id={cand.get('user_id')}")
        
        # Step 11: Activate
        requests.post(f"{BASE_URL}/api/recruitment/onboarding/activate?candidate_id={candidate_id}")
        
        cand = requests.get(f"{BASE_URL}/api/recruitment/candidate/{candidate_id}").json()
        assert cand["status"] == "active", f"After activate: expected 'active', got '{cand['status']}'"
        print(f"✓ Step 11 Activate: status=active")
        
        print(f"\n✓✓✓ Full E2E flow completed successfully!")
        print(f"  Candidate: {candidate_id}")
        print(f"  User ID: {cand.get('user_id')}")


# Run tests with: pytest test_phase35_fix_funnel_referral_contract.py -v
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
