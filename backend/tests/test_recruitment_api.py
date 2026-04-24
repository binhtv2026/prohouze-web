"""
Recruitment API Test Suite - Phase 3.5: Auto Recruitment + Onboarding Engine
Testing full E2E flow: Apply → OTP → Consent → AI Score → Test → Decision → Contract → E-Sign → Onboarding
DEV MODE: OTP = 123456, mock AI, mock KYC
"""

import pytest
import requests
import os
import uuid
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test candidate data with unique values
TEST_TIMESTAMP = datetime.now().strftime('%Y%m%d%H%M%S')
TEST_PHONE = f"09{TEST_TIMESTAMP[-8:]}"
TEST_EMAIL = f"TEST_candidate_{TEST_TIMESTAMP}@example.com"
TEST_NAME = f"TEST_Candidate_{TEST_TIMESTAMP}"

class TestRecruitmentConfig:
    """Test recruitment config endpoint"""
    
    def test_get_config(self):
        """Test GET /api/recruitment/config"""
        response = requests.get(f"{BASE_URL}/api/recruitment/config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "dev_mode" in data
        assert "otp_expiry_minutes" in data
        assert "pass_threshold" in data
        print(f"✓ Config retrieved: dev_mode={data['dev_mode']}, pass_threshold={data['pass_threshold']}")
        return data


class TestApplicationFlow:
    """Test application submission flow"""
    candidate_id = None
    
    def test_submit_application(self):
        """Test POST /api/recruitment/apply"""
        payload = {
            "full_name": TEST_NAME,
            "phone": TEST_PHONE,
            "email": TEST_EMAIL,
            "position": "ctv",
            "region": "Hà Nội",
            "experience_years": 2,
            "has_real_estate_exp": True,
            "source": "direct"
        }
        
        response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "candidate_id" in data
        
        TestApplicationFlow.candidate_id = data["candidate_id"]
        print(f"✓ Application submitted: candidate_id={data['candidate_id']}")
        return data
    
    def test_get_candidate(self):
        """Test GET /api/recruitment/candidate/{id}"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{TestApplicationFlow.candidate_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["full_name"] == TEST_NAME
        assert data["phone"] == TEST_PHONE
        assert data["email"] == TEST_EMAIL
        assert data["status"] == "applied"
        print(f"✓ Candidate retrieved: {data['full_name']}, status={data['status']}")
        return data
    
    def test_duplicate_application_rejected(self):
        """Test duplicate phone/email is rejected"""
        payload = {
            "full_name": "Duplicate Test",
            "phone": TEST_PHONE,  # Same phone
            "email": "other@example.com",
            "position": "ctv"
        }
        
        response = requests.post(f"{BASE_URL}/api/recruitment/apply", json=payload)
        # Should fail due to duplicate phone
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == False or "existing_id" in data
        print(f"✓ Duplicate application correctly rejected/flagged")


class TestOTPFlow:
    """Test OTP send and verify flow - DEV MODE OTP = 123456"""
    
    def test_send_otp(self):
        """Test POST /api/recruitment/otp/send"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/otp/send",
            params={"candidate_id": TestApplicationFlow.candidate_id, "channel": "email"}
        )
        assert response.status_code == 200, f"OTP send failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print(f"✓ OTP sent: dev_mode={data.get('dev_mode')}, otp_id={data.get('otp_id')}")
        return data
    
    def test_verify_otp_invalid(self):
        """Test invalid OTP rejection"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/otp/verify",
            params={"candidate_id": TestApplicationFlow.candidate_id, "otp": "000000"}
        )
        # Should fail with invalid OTP
        assert response.status_code == 400, f"Invalid OTP should be rejected"
        print(f"✓ Invalid OTP correctly rejected")
    
    def test_verify_otp_valid(self):
        """Test valid OTP (DEV MODE = 123456)"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/otp/verify",
            params={"candidate_id": TestApplicationFlow.candidate_id, "otp": "123456"}
        )
        assert response.status_code == 200, f"Valid OTP should pass: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["verified"] == True
        print(f"✓ OTP verified successfully: next_step={data.get('next_step')}")
        return data


class TestConsentFlow:
    """Test consent acceptance flow - GDPR/PDPA compliant"""
    
    def test_accept_consent(self):
        """Test POST /api/recruitment/consent/accept"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        payload = {
            "candidate_id": TestApplicationFlow.candidate_id,
            "data_processing": True,
            "terms_of_service": True,
            "privacy_policy": True,
            "marketing_consent": False
        }
        
        response = requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=payload)
        assert response.status_code == 200, f"Consent accept failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print(f"✓ Consent accepted: consent_id={data.get('consent_id')}, next_step={data.get('next_step')}")
        return data
    
    def test_consent_missing_required(self):
        """Test consent fails if required fields missing"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        payload = {
            "candidate_id": TestApplicationFlow.candidate_id,
            "data_processing": False,  # Required but false
            "terms_of_service": True,
            "privacy_policy": True
        }
        
        response = requests.post(f"{BASE_URL}/api/recruitment/consent/accept", json=payload)
        # Should fail or return success=false
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == False or "error" in data
        print(f"✓ Missing consent correctly rejected")


class TestAIScoringFlow:
    """Test AI scoring flow - MOCKED in dev mode"""
    
    def test_score_candidate(self):
        """Test POST /api/recruitment/ai/score"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/ai/score",
            params={"candidate_id": TestApplicationFlow.candidate_id}
        )
        assert response.status_code == 200, f"AI score failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "overall_score" in data
        print(f"✓ AI scoring complete: overall_score={data.get('overall_score')}, fit_level={data.get('fit_level')}")
        return data
    
    def test_get_ai_score(self):
        """Test GET /api/recruitment/ai/score/{candidate_id}"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.get(f"{BASE_URL}/api/recruitment/ai/score/{TestApplicationFlow.candidate_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "score" in data
        print(f"✓ AI score retrieved")


class TestTestEngineFlow:
    """Test test engine flow"""
    attempt_id = None
    
    def test_get_questions(self):
        """Test GET /api/recruitment/test/questions"""
        response = requests.get(f"{BASE_URL}/api/recruitment/test/questions", params={"test_type": "screening"})
        assert response.status_code == 200
        
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) >= 1
        print(f"✓ Test questions retrieved: {len(data['questions'])} questions")
        return data
    
    def test_start_test(self):
        """Test POST /api/recruitment/test/start"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/test/start",
            params={"candidate_id": TestApplicationFlow.candidate_id, "test_type": "screening"}
        )
        assert response.status_code == 200, f"Start test failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "attempt_id" in data
        
        TestTestEngineFlow.attempt_id = data["attempt_id"]
        print(f"✓ Test started: attempt_id={data['attempt_id']}, questions={data.get('total_questions')}")
        return data
    
    def test_submit_test(self):
        """Test POST /api/recruitment/test/submit"""
        if not TestTestEngineFlow.attempt_id:
            pytest.skip("No attempt_id")
        
        # Submit answers - get 70%+ to pass
        answers = [
            {"question_id": "q1", "answer": "Đặt cọc giữ chỗ (có thể hoàn lại)"},
            {"question_id": "q2", "answer": "Tìm hiểu lý do và giải quyết"},
            {"question_id": "q3", "answer": "Lắng nghe và hiểu nhu cầu khách hàng"},
            {"question_id": "q4", "answer": "50-100 cuộc"},
            {"question_id": "q5", "answer": "Phân tích nguyên nhân và cải thiện"},
            {"question_id": "q6", "answer": "Tất cả các loại trên"},
            {"question_id": "q7", "answer": "Tất cả các điều trên"},
            {"question_id": "q8", "answer": "9h - 11h30 và 14h - 16h30"},
            {"question_id": "q9", "answer": "50-100 triệu"},
            {"question_id": "q10", "answer": "Tất cả các điều trên"},
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/test/submit",
            params={"attempt_id": TestTestEngineFlow.attempt_id},
            json=answers
        )
        assert response.status_code == 200, f"Submit test failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "score" in data
        print(f"✓ Test submitted: score={data.get('score')}%, passed={data.get('passed')}")
        return data


class TestDecisionFlow:
    """Test decision making flow"""
    
    def test_make_decision(self):
        """Test POST /api/recruitment/decision"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/decision",
            params={"candidate_id": TestApplicationFlow.candidate_id}
        )
        assert response.status_code == 200, f"Decision failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "decision" in data
        print(f"✓ Decision made: decision={data.get('decision')}, final_score={data.get('final_score')}")
        return data


class TestContractFlow:
    """Test contract generation and signing flow"""
    contract_id = None
    
    def test_generate_contract(self):
        """Test POST /api/recruitment/contract/generate"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/contract/generate",
            params={"candidate_id": TestApplicationFlow.candidate_id}
        )
        assert response.status_code == 200, f"Contract generation failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "contract_id" in data
        
        TestContractFlow.contract_id = data["contract_id"]
        print(f"✓ Contract generated: contract_id={data['contract_id']}, number={data.get('contract_number')}")
        return data
    
    def test_get_contract(self):
        """Test GET /api/recruitment/contract/{id}"""
        if not TestContractFlow.contract_id:
            pytest.skip("No contract_id")
        
        response = requests.get(f"{BASE_URL}/api/recruitment/contract/{TestContractFlow.contract_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "contract_content" in data
        print(f"✓ Contract retrieved: {len(data.get('contract_content', ''))} chars")
    
    def test_sign_contract(self):
        """Test POST /api/recruitment/contract/sign"""
        if not TestContractFlow.contract_id:
            pytest.skip("No contract_id")
        
        signature_data = "data:image/png;base64,TEST_SIGNATURE_DATA"
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/contract/sign",
            params={
                "contract_id": TestContractFlow.contract_id,
                "signature_data": signature_data
            }
        )
        assert response.status_code == 200, f"Contract sign failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["signed"] == True
        print(f"✓ Contract signed: signed_at={data.get('signed_at')}")
        return data


class TestOnboardingFlow:
    """Test onboarding and activation flow"""
    
    def test_execute_onboarding(self):
        """Test POST /api/recruitment/onboarding/execute"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/onboarding/execute",
            params={"candidate_id": TestApplicationFlow.candidate_id}
        )
        assert response.status_code == 200, f"Onboarding failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "user_id" in data
        assert "username" in data
        assert "temp_password" in data
        print(f"✓ Onboarding complete: user_id={data.get('user_id')}, username={data.get('username')}")
        return data
    
    def test_activate_user(self):
        """Test POST /api/recruitment/onboarding/activate"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.post(
            f"{BASE_URL}/api/recruitment/onboarding/activate",
            params={"candidate_id": TestApplicationFlow.candidate_id}
        )
        assert response.status_code == 200, f"Activation failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "active"
        print(f"✓ User activated: status={data.get('status')}")
        return data


class TestCandidateStatus:
    """Test candidate status checking"""
    
    def test_get_candidate_status(self):
        """Test GET /api/recruitment/candidate/{id}/status"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.get(f"{BASE_URL}/api/recruitment/candidate/{TestApplicationFlow.candidate_id}/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "steps" in data
        assert "current_step" in data
        print(f"✓ Status retrieved: status={data.get('status')}, current_step={data.get('current_step')}")
        return data


class TestPipelineStats:
    """Test pipeline statistics"""
    
    def test_get_pipeline_stats(self):
        """Test GET /api/recruitment/pipeline/stats"""
        response = requests.get(f"{BASE_URL}/api/recruitment/pipeline/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "by_status" in data
        print(f"✓ Pipeline stats: total={data.get('total')}, conversion_rate={data.get('conversion_rate')}")
        return data
    
    def test_get_pipeline_funnel(self):
        """Test GET /api/recruitment/pipeline/funnel"""
        response = requests.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
        assert response.status_code == 200
        
        data = response.json()
        assert "funnel" in data
        print(f"✓ Pipeline funnel: {len(data.get('funnel', []))} stages")
        return data


class TestListCandidates:
    """Test candidate listing"""
    
    def test_list_all_candidates(self):
        """Test GET /api/recruitment/candidates"""
        response = requests.get(f"{BASE_URL}/api/recruitment/candidates", params={"limit": 10})
        assert response.status_code == 200
        
        data = response.json()
        assert "candidates" in data
        assert "total" in data
        print(f"✓ Candidates listed: total={data.get('total')}, showing={len(data.get('candidates', []))}")
        return data
    
    def test_list_candidates_by_status(self):
        """Test GET /api/recruitment/candidates with status filter"""
        response = requests.get(f"{BASE_URL}/api/recruitment/candidates", params={"status": "active", "limit": 10})
        assert response.status_code == 200
        
        data = response.json()
        print(f"✓ Active candidates: {len(data.get('candidates', []))}")


class TestAuditLog:
    """Test audit log"""
    
    def test_get_audit_log(self):
        """Test GET /api/recruitment/audit/{candidate_id}"""
        if not TestApplicationFlow.candidate_id:
            pytest.skip("No candidate_id")
        
        response = requests.get(f"{BASE_URL}/api/recruitment/audit/{TestApplicationFlow.candidate_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data
        print(f"✓ Audit log retrieved: {len(data.get('logs', []))} entries")
        return data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
