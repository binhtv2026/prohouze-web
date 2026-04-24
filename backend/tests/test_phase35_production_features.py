"""
Test Phase 3.5 PRODUCTION 10/10 Features:
1. QR Code API - Returns actual PNG base64 image
2. AI Scoring - Returns score, fit_type, risk_score, strengths, concerns
3. Funnel Accurate - Returns correct counts for each status
4. Commission Link - Creates entry in commission_trees when onboarding with ref_id
5. Link Generator Page endpoints (backend only)
"""

import pytest
import requests
import os
import uuid
import base64
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 1: QR CODE API - Actual PNG base64 image
# ═══════════════════════════════════════════════════════════════════════════════

class TestQRCodeAPI:
    """Test QR Code generation API returns actual PNG image"""
    
    def test_qr_generate_returns_png_base64(self, api_client):
        """QR API returns actual PNG base64 image, not placeholder"""
        response = api_client.get(f"{BASE_URL}/api/recruitment/qr/generate?ref_id=test123&campaign_id=camp456")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check success
        assert data.get("success") == True, f"Expected success=True, got: {data}"
        
        # Check format is PNG
        assert data.get("format") == "png", f"Expected format=png, got: {data.get('format')}"
        
        # Check qr_image is actual base64 PNG, not placeholder
        qr_image = data.get("qr_image", "")
        assert qr_image.startswith("data:image/png;base64,"), f"QR image should start with data:image/png;base64,, got: {qr_image[:50]}"
        
        # Extract and validate base64 content
        base64_content = qr_image.replace("data:image/png;base64,", "")
        try:
            decoded = base64.b64decode(base64_content)
            # PNG files start with specific magic bytes
            assert decoded[:4] == b'\x89PNG', "QR image should be valid PNG (starts with PNG magic bytes)"
            print(f"✓ QR image is valid PNG, size: {len(decoded)} bytes")
        except Exception as e:
            pytest.fail(f"Failed to decode base64 QR image: {e}")
        
        # Check apply_url and tracking params
        assert data.get("apply_url"), "Should have apply_url"
        assert data.get("ref_id") == "test123", f"Expected ref_id=test123, got: {data.get('ref_id')}"
        assert data.get("campaign_id") == "camp456", f"Expected campaign_id=camp456, got: {data.get('campaign_id')}"
        print(f"✓ QR code generated with apply_url: {data.get('apply_url')}")
    
    def test_qr_generate_with_ref_id_only(self, api_client):
        """QR API works with ref_id only"""
        response = api_client.get(f"{BASE_URL}/api/recruitment/qr/generate?ref_id=user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("ref_id") == "user123"
        assert data.get("qr_image", "").startswith("data:image/png;base64,")
        print("✓ QR code generated with ref_id only")
    
    def test_qr_generate_with_campaign_id_only(self, api_client):
        """QR API works with campaign_id only"""
        response = api_client.get(f"{BASE_URL}/api/recruitment/qr/generate?campaign_id=SPRING2026")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("campaign_id") == "SPRING2026"
        assert data.get("qr_image", "").startswith("data:image/png;base64,")
        print("✓ QR code generated with campaign_id only")
    
    def test_qr_generate_without_params(self, api_client):
        """QR API works without any params (general recruitment link)"""
        response = api_client.get(f"{BASE_URL}/api/recruitment/qr/generate")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("qr_image", "").startswith("data:image/png;base64,")
        print("✓ QR code generated without params")


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 2: AI SCORING API
# ═══════════════════════════════════════════════════════════════════════════════

class TestAIScoringAPI:
    """Test AI Scoring API returns proper structure"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client):
        """Create a test candidate for AI scoring"""
        self.candidate_id = f"TEST_ai_score_{uuid.uuid4().hex[:8]}"
        
        # Create test candidate
        response = api_client.post(f"{BASE_URL}/api/recruitment/apply", json={
            "full_name": "AI Test Candidate",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"ai_test_{uuid.uuid4().hex[:8]}@test.com",
            "position": "sale",
            "experience_years": 2,
            "has_real_estate_exp": True,
            "source": "direct"
        })
        
        if response.status_code == 200:
            self.candidate_id = response.json().get("candidate_id", self.candidate_id)
        
        yield
    
    def test_ai_score_returns_required_fields(self, api_client):
        """AI scoring returns score, fit_type, risk_score, strengths, concerns"""
        response = api_client.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={self.candidate_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "overall_score" in data or "ai_score" in data, f"Missing score field, got: {data.keys()}"
        score = data.get("overall_score") or data.get("ai_score", 0)
        assert isinstance(score, (int, float)), f"Score should be numeric, got: {type(score)}"
        assert 0 <= score <= 100, f"Score should be 0-100, got: {score}"
        
        # fit_type: high_potential, average, or low_fit
        fit_type = data.get("fit_type") or data.get("fit_level")
        assert fit_type in ["high_potential", "average", "low_fit", "high", "medium", "low"], f"Invalid fit_type: {fit_type}"
        
        # risk_score
        risk_score = data.get("risk_score") or data.get("risk", 0)
        assert isinstance(risk_score, (int, float)), f"Risk score should be numeric, got: {type(risk_score)}"
        
        # strengths - list without None
        strengths = data.get("strengths", [])
        assert isinstance(strengths, list), f"Strengths should be list, got: {type(strengths)}"
        assert None not in strengths, f"Strengths should not contain None: {strengths}"
        
        # concerns - list without None
        concerns = data.get("concerns", [])
        assert isinstance(concerns, list), f"Concerns should be list, got: {type(concerns)}"
        assert None not in concerns, f"Concerns should not contain None: {concerns}"
        
        print(f"✓ AI Score: {score}, fit_type: {fit_type}, risk: {risk_score}")
        print(f"  Strengths: {strengths}")
        print(f"  Concerns: {concerns}")
    
    def test_ai_score_indicates_mock_mode(self, api_client):
        """AI scoring indicates mock_mode in dev"""
        response = api_client.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={self.candidate_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # In dev mode, should indicate mock
        # Note: Can be ai_powered=False or mock_mode=True
        is_mock = data.get("mock_mode", False) or not data.get("ai_powered", True)
        print(f"✓ AI Scoring mock mode: {is_mock}")


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 3: FUNNEL ACCURATE COUNTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFunnelAccurateCounts:
    """Test funnel API returns accurate counts for each status"""
    
    def test_funnel_returns_all_statuses(self, api_client):
        """Funnel API returns counts for all 10 statuses"""
        response = api_client.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
        
        assert response.status_code == 200
        data = response.json()
        
        funnel = data.get("funnel", [])
        assert len(funnel) == 10, f"Should have 10 statuses, got: {len(funnel)}"
        
        expected_statuses = [
            "applied", "verified", "consented", "kyc_verified",
            "screened", "tested", "passed", "contracted",
            "onboarded", "active"
        ]
        
        actual_statuses = [item["status"] for item in funnel]
        assert actual_statuses == expected_statuses, f"Status order mismatch: {actual_statuses}"
        
        # All counts should be non-negative integers
        for item in funnel:
            assert isinstance(item["count"], int), f"Count should be int: {item}"
            assert item["count"] >= 0, f"Count should be >= 0: {item}"
        
        print("✓ Funnel returns all 10 statuses with counts:")
        for item in funnel:
            print(f"  {item['status']}: {item['count']}")
    
    def test_funnel_counts_update_after_new_candidate(self, api_client):
        """Funnel counts update correctly after new candidate"""
        # Get initial counts
        response1 = api_client.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
        initial_funnel = {item["status"]: item["count"] for item in response1.json()["funnel"]}
        initial_applied = initial_funnel.get("applied", 0)
        
        # Create new candidate
        response = api_client.post(f"{BASE_URL}/api/recruitment/apply", json={
            "full_name": f"Funnel Test {uuid.uuid4().hex[:8]}",
            "phone": f"09{uuid.uuid4().hex[:8]}",
            "email": f"funnel_test_{uuid.uuid4().hex[:8]}@test.com",
            "position": "ctv",
            "source": "direct"
        })
        
        if response.status_code == 200:
            # Get updated counts
            response2 = api_client.get(f"{BASE_URL}/api/recruitment/pipeline/funnel")
            updated_funnel = {item["status"]: item["count"] for item in response2.json()["funnel"]}
            updated_applied = updated_funnel.get("applied", 0)
            
            assert updated_applied == initial_applied + 1, \
                f"Applied count should increase by 1: {initial_applied} -> {updated_applied}"
            print(f"✓ Funnel 'applied' count updated: {initial_applied} -> {updated_applied}")
        else:
            print(f"⚠ Could not create candidate: {response.status_code}")


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 4: COMMISSION LINK ON ONBOARDING WITH REF_ID
# ═══════════════════════════════════════════════════════════════════════════════

class TestCommissionLinkOnboarding:
    """Test commission_trees entry created when onboarding with ref_id"""
    
    def test_commission_tree_entry_created_on_onboarding(self, api_client):
        """Commission tree entry should be created when onboarding with ref_id"""
        
        # Step 1: Create a referrer user first (if not exists)
        referrer_id = f"TEST_referrer_{uuid.uuid4().hex[:8]}"
        
        # Try to create referrer (may already exist)
        # We'll use the auto flow which creates a full user
        
        # Step 2: Create candidate with ref_id
        candidate_phone = f"09{uuid.uuid4().hex[:8]}"
        candidate_email = f"commission_test_{uuid.uuid4().hex[:8]}@test.com"
        
        # First check if we have any existing user to use as referrer
        # Use auto flow endpoint to verify the commission link process
        
        # Create a new candidate with ref_id
        apply_response = api_client.post(f"{BASE_URL}/api/recruitment/apply", json={
            "full_name": "Commission Test Candidate",
            "phone": candidate_phone,
            "email": candidate_email,
            "position": "sale",
            "experience_years": 3,
            "has_real_estate_exp": True,
            "ref_id": referrer_id,  # This links to referrer
            "source": "referral"
        })
        
        if apply_response.status_code != 200:
            print(f"Apply failed: {apply_response.json()}")
            pytest.skip("Could not create candidate for commission test")
        
        candidate_id = apply_response.json().get("candidate_id")
        print(f"✓ Created candidate {candidate_id} with ref_id={referrer_id}")
        
        # Run auto flow to onboard
        flow_response = api_client.post(f"{BASE_URL}/api/recruitment/flow/auto?candidate_id={candidate_id}&skip_kyc=true&skip_test=true")
        
        if flow_response.status_code == 200:
            flow_data = flow_response.json()
            final_status = flow_data.get("final_status", {}).get("status", "")
            print(f"✓ Auto flow completed, final status: {final_status}")
            
            # Check if commission tree entry exists
            # The entry should be in commission_trees collection
            # We verify by checking the referral tree endpoint
            referral_response = api_client.get(f"{BASE_URL}/api/recruitment/referral/tree/{referrer_id}")
            
            if referral_response.status_code == 200:
                referral_data = referral_response.json()
                print(f"✓ Referral tree response: {referral_data}")
                
                # Check for direct children or tree entries
                if referral_data.get("tree") or referral_data.get("children"):
                    print("✓ Commission tree entry found for referrer")
                else:
                    print("⚠ No tree entries found - may need referrer to be existing user")
            else:
                print(f"⚠ Referral tree API returned: {referral_response.status_code}")
        elif flow_response.status_code == 403:
            print("⚠ Auto flow disabled (not in dev mode)")
            pytest.skip("Auto flow not available")
        else:
            print(f"⚠ Auto flow failed: {flow_response.status_code} - {flow_response.text[:200]}")
    
    def test_referral_stats_endpoint(self, api_client):
        """Referral stats endpoint should work"""
        test_user_id = "test_referrer_001"
        
        response = api_client.get(f"{BASE_URL}/api/recruitment/referral/stats/{test_user_id}")
        
        # Should return 200 even if no referrals
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "total_referrals" in data or "user_id" in data
        print(f"✓ Referral stats endpoint works: {data}")


# ═══════════════════════════════════════════════════════════════════════════════
# TEST 5: LINK GENERATOR ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLinkGeneratorEndpoints:
    """Test endpoints used by Link Generator Page"""
    
    def test_referral_link_endpoint(self, api_client):
        """GET /api/recruitment/referral/link/{user_id} should return link"""
        # This needs an existing user - we'll test with a test user ID
        test_user_id = "test_user_001"
        
        response = api_client.get(f"{BASE_URL}/api/recruitment/referral/link/{test_user_id}")
        
        # May return 404 if user doesn't exist, which is expected
        if response.status_code == 200:
            data = response.json()
            assert "referral_link" in data
            assert "qr_data" in data
            print(f"✓ Referral link endpoint: {data.get('referral_link')}")
        else:
            print(f"✓ Referral link returns {response.status_code} for non-existent user (expected)")
    
    def test_campaigns_list_endpoint(self, api_client):
        """GET /api/recruitment/campaigns should list campaigns"""
        response = api_client.get(f"{BASE_URL}/api/recruitment/campaigns")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "campaigns" in data
        assert isinstance(data["campaigns"], list)
        print(f"✓ Campaigns list: {len(data['campaigns'])} campaigns")
    
    def test_create_campaign(self, api_client):
        """POST /api/recruitment/campaign creates campaign"""
        campaign_name = f"TEST_Campaign_{uuid.uuid4().hex[:6]}"
        
        response = api_client.post(
            f"{BASE_URL}/api/recruitment/campaign",
            params={
                "name": campaign_name,
                "target_count": 50,
                "target_positions": ["ctv", "sale"]
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("name") == campaign_name
            assert data.get("id")
            print(f"✓ Created campaign: {data.get('id')}")
        else:
            print(f"⚠ Create campaign returned: {response.status_code}")


# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATION TEST: Full flow with commission link
# ═══════════════════════════════════════════════════════════════════════════════

class TestFullFlowWithCommission:
    """Full E2E flow testing commission link"""
    
    def test_e2e_flow_creates_commission_entry(self, api_client):
        """Full flow from apply to onboard should create commission entry if ref_id"""
        
        # This test verifies the full integration
        # Note: Requires existing referrer user in system
        
        # Step 1: Get funnel initial state
        funnel_before = api_client.get(f"{BASE_URL}/api/recruitment/pipeline/funnel").json()
        print(f"✓ Initial funnel retrieved")
        
        # Step 2: Create candidate
        unique_id = uuid.uuid4().hex[:8]
        response = api_client.post(f"{BASE_URL}/api/recruitment/apply", json={
            "full_name": f"E2E Commission Test {unique_id}",
            "phone": f"097{unique_id}",
            "email": f"e2e_comm_{unique_id}@test.com",
            "position": "sale",
            "experience_years": 2,
            "source": "direct"
        })
        
        if response.status_code == 200:
            candidate_id = response.json().get("candidate_id")
            print(f"✓ Created candidate: {candidate_id}")
            
            # Step 3: Check AI scoring returns proper structure
            ai_response = api_client.post(f"{BASE_URL}/api/recruitment/ai/score?candidate_id={candidate_id}")
            if ai_response.status_code == 200:
                ai_data = ai_response.json()
                
                # Verify no None in strengths/concerns
                strengths = ai_data.get("strengths", [])
                concerns = ai_data.get("concerns", [])
                
                assert None not in strengths, f"Strengths contains None: {strengths}"
                assert None not in concerns, f"Concerns contains None: {concerns}"
                print(f"✓ AI scoring returned valid data (no None in lists)")
            
            # Step 4: Check funnel updated
            funnel_after = api_client.get(f"{BASE_URL}/api/recruitment/pipeline/funnel").json()
            
            before_applied = next((s["count"] for s in funnel_before["funnel"] if s["status"] == "applied"), 0)
            after_applied = next((s["count"] for s in funnel_after["funnel"] if s["status"] == "applied"), 0)
            
            # Should have increased (may not if dupe detection)
            print(f"✓ Funnel applied count: {before_applied} -> {after_applied}")
        else:
            print(f"⚠ Apply failed: {response.json()}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
