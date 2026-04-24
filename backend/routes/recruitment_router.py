"""
Recruitment Router - Phase 3.5: AUTO RECRUITMENT + ONBOARDING ENGINE
GLOBAL STANDARD 10/10 - LOCKED

~35 API Endpoints for full recruitment flow
"""

from fastapi import APIRouter, HTTPException, Request, Query, Body
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from models.recruitment_models import (
    ApplicationRequest, OTPSendRequest, OTPVerifyRequest,
    ConsentRequest, KYCUploadRequest, TestSubmitRequest,
    ContractSignRequest, OTPChannel, CandidateStatus
)
from services.recruitment_service import (
    RecruitmentService, OTPService, ConsentService, IdentityService,
    AIScoringService, TestEngine, DecisionEngine, ContractService,
    OnboardingService, RECRUITMENT_CONFIG
)


recruitment_router = APIRouter(prefix="/recruitment", tags=["recruitment"])


def get_recruitment_service():
    from server import db
    return RecruitmentService(db)


def get_client_info(request: Request) -> Dict[str, str]:
    """Extract client info from request"""
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "device_fingerprint": request.headers.get("x-device-fingerprint")
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG & STATUS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.get("/config")
async def get_config():
    """Get recruitment system config (public safe version)"""
    return {
        "dev_mode": RECRUITMENT_CONFIG["dev_mode"],
        "otp_expiry_minutes": RECRUITMENT_CONFIG["otp_expiry_minutes"],
        "otp_max_attempts": RECRUITMENT_CONFIG["otp_max_attempts"],
        "enable_zalo": RECRUITMENT_CONFIG["enable_zalo"],
        "enable_email": RECRUITMENT_CONFIG["enable_email"],
        "enable_sms": RECRUITMENT_CONFIG["enable_sms"],
        "enable_ai": RECRUITMENT_CONFIG["enable_ai"],
        "enable_kyc": RECRUITMENT_CONFIG["enable_kyc"],
        "pass_threshold": RECRUITMENT_CONFIG["pass_threshold"],
    }


@recruitment_router.get("/pipeline/stats")
async def get_pipeline_stats():
    """Get recruitment pipeline statistics"""
    service = get_recruitment_service()
    return await service.get_pipeline_stats()


@recruitment_router.get("/pipeline/funnel")
async def get_pipeline_funnel():
    """Get recruitment funnel data for visualization"""
    from server import db
    
    statuses = [
        "applied", "verified", "consented", "kyc_verified",
        "screened", "tested", "passed", "contracted",
        "onboarded", "active"
    ]
    
    funnel = []
    for status in statuses:
        count = await db.candidates.count_documents({"status": status})
        funnel.append({"status": status, "count": count})
    
    return {"funnel": funnel}


# ═══════════════════════════════════════════════════════════════════════════════
# 1. APPLICATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/apply")
async def apply(application: ApplicationRequest, request: Request):
    """Submit new application"""
    service = get_recruitment_service()
    client_info = get_client_info(request)
    
    result = await service.apply(
        application,
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        device_fingerprint=client_info["device_fingerprint"]
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@recruitment_router.get("/candidate/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Get candidate details"""
    service = get_recruitment_service()
    candidate = await service.get_candidate(candidate_id)
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return candidate


@recruitment_router.get("/candidate/{candidate_id}/status")
async def get_candidate_status(candidate_id: str):
    """Get candidate pipeline status"""
    service = get_recruitment_service()
    return await service.get_candidate_status(candidate_id)


@recruitment_router.get("/candidates")
async def list_candidates(
    status: Optional[str] = None,
    source: Optional[str] = None,
    campaign_id: Optional[str] = None,
    position: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """List candidates with filters"""
    from server import db
    
    query = {}
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    if campaign_id:
        query["campaign_id"] = campaign_id
    if position:
        query["position"] = position
    
    candidates = await db.candidates.find(
        query,
        {"_id": 0}
    ).sort("applied_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.candidates.count_documents(query)
    
    return {
        "candidates": candidates,
        "total": total,
        "limit": limit,
        "skip": skip
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2. OTP ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/otp/send")
async def send_otp(
    candidate_id: str,
    channel: OTPChannel = OTPChannel.EMAIL,
    target: str = None,
    request: Request = None
):
    """Send OTP to candidate"""
    from server import db
    
    # Get candidate
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Use phone or email based on channel
    if not target:
        target = candidate["phone"] if channel in [OTPChannel.SMS, OTPChannel.ZALO] else candidate["email"]
    
    otp_service = OTPService(db)
    client_info = get_client_info(request) if request else {}
    
    result = await otp_service.send_otp(
        candidate_id,
        channel,
        target,
        ip_address=client_info.get("ip_address"),
        user_agent=client_info.get("user_agent")
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to send OTP"))
    
    return result


@recruitment_router.post("/otp/verify")
async def verify_otp(
    candidate_id: str,
    otp: str,
    request: Request = None
):
    """Verify OTP"""
    from server import db
    
    otp_service = OTPService(db)
    client_info = get_client_info(request) if request else {}
    
    result = await otp_service.verify_otp(
        candidate_id,
        otp,
        ip_address=client_info.get("ip_address"),
        user_agent=client_info.get("user_agent")
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "OTP verification failed"))
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CONSENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/consent/accept")
async def accept_consent(consent: ConsentRequest, request: Request = None):
    """Accept consent (GDPR/PDPA compliant)"""
    from server import db
    
    consent_service = ConsentService(db)
    client_info = get_client_info(request) if request else {}
    
    result = await consent_service.accept_consent(
        consent.candidate_id,
        consent.data_processing,
        consent.terms_of_service,
        consent.privacy_policy,
        consent.marketing_consent,
        ip_address=client_info.get("ip_address"),
        user_agent=client_info.get("user_agent"),
        device_fingerprint=client_info.get("device_fingerprint")
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@recruitment_router.get("/consent/{candidate_id}")
async def get_consent(candidate_id: str):
    """Get consent status for candidate"""
    from server import db
    
    consent = await db.consent_logs.find_one(
        {"candidate_id": candidate_id},
        {"_id": 0}
    )
    
    return {
        "candidate_id": candidate_id,
        "consent": consent,
        "consented": consent is not None
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 4. KYC ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/kyc/upload")
async def upload_kyc(kyc: KYCUploadRequest):
    """Upload KYC documents"""
    from server import db
    
    identity_service = IdentityService(db)
    
    result = await identity_service.submit_kyc(
        kyc.candidate_id,
        kyc.document_type,
        kyc.document_front_url,
        kyc.document_back_url,
        kyc.selfie_url
    )
    
    return result


@recruitment_router.get("/kyc/{candidate_id}")
async def get_kyc_status(candidate_id: str):
    """Get KYC verification status"""
    from server import db
    
    verification = await db.identity_verifications.find_one(
        {"candidate_id": candidate_id},
        {"_id": 0}
    )
    
    return {
        "candidate_id": candidate_id,
        "verification": verification,
        "verified": verification and verification.get("status") == "verified"
    }


@recruitment_router.post("/kyc/verify")
async def verify_kyc_manual(candidate_id: str, approved: bool, notes: str = None):
    """Manual KYC verification (admin only)"""
    from server import db
    
    now = datetime.now(timezone.utc)
    
    status = "verified" if approved else "failed"
    
    await db.identity_verifications.update_one(
        {"candidate_id": candidate_id},
        {"$set": {
            "status": status,
            "review_notes": notes,
            "reviewed_at": now.isoformat(),
            "updated_at": now.isoformat()
        }}
    )
    
    if approved:
        await db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "kyc_verified": True,
                "status": CandidateStatus.KYC_VERIFIED.value,
                "current_step": 5,
                "updated_at": now.isoformat()
            }}
        )
    
    return {"success": True, "status": status}


# ═══════════════════════════════════════════════════════════════════════════════
# 5. AI SCREENING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/ai/score")
async def score_candidate(candidate_id: str):
    """AI-powered candidate scoring"""
    from server import db
    
    ai_service = AIScoringService(db)
    result = await ai_service.score_candidate(candidate_id)
    
    return result


@recruitment_router.get("/ai/score/{candidate_id}")
async def get_ai_score(candidate_id: str):
    """Get AI score for candidate"""
    from server import db
    
    score = await db.ai_scores.find_one(
        {"candidate_id": candidate_id},
        {"_id": 0}
    )
    
    return {
        "candidate_id": candidate_id,
        "score": score
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 6. TEST ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.get("/test/questions")
async def get_test_questions(test_type: str = "screening"):
    """Get test questions"""
    from server import db
    
    test_engine = TestEngine(db)
    questions = await test_engine.get_test_questions(test_type)
    
    # Remove correct answers for candidate view
    sanitized = []
    for q in questions:
        sanitized.append({
            "id": q["id"],
            "question": q["question"],
            "question_type": q["question_type"],
            "options": q["options"],
            "points": q["points"],
            "category": q["category"]
        })
    
    return {
        "test_type": test_type,
        "questions": sanitized,
        "total_questions": len(questions),
        "time_limit_minutes": 30
    }


@recruitment_router.post("/test/start")
async def start_test(candidate_id: str, test_type: str = "screening"):
    """Start test attempt"""
    from server import db
    
    test_engine = TestEngine(db)
    result = await test_engine.start_test(candidate_id, test_type)
    
    return result


@recruitment_router.post("/test/submit")
async def submit_test(attempt_id: str, answers: List[Dict[str, str]]):
    """Submit test answers"""
    from server import db
    
    test_engine = TestEngine(db)
    result = await test_engine.submit_test(attempt_id, answers)
    
    return result


@recruitment_router.get("/test/attempt/{attempt_id}")
async def get_test_attempt(attempt_id: str):
    """Get test attempt details"""
    from server import db
    
    attempt = await db.test_attempts.find_one({"id": attempt_id}, {"_id": 0})
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Test attempt not found")
    
    return attempt


# ═══════════════════════════════════════════════════════════════════════════════
# 7. DECISION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/decision")
async def make_decision(candidate_id: str, override: str = None):
    """Make hiring decision"""
    from server import db
    
    decision_engine = DecisionEngine(db)
    result = await decision_engine.make_decision(candidate_id, override)
    
    return result


@recruitment_router.post("/decision/override")
async def override_decision(candidate_id: str, decision: str, reason: str = None):
    """Override decision (admin only)"""
    from server import db
    
    if decision not in ["pass", "fail", "review"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
    
    decision_engine = DecisionEngine(db)
    result = await decision_engine.make_decision(candidate_id, override=decision)
    
    # Log override
    from models.recruitment_models import RecruitmentAuditLog
    log = RecruitmentAuditLog(
        candidate_id=candidate_id,
        action="decision_override",
        step=7,
        details={"new_decision": decision, "reason": reason}
    )
    await db.recruitment_audit_logs.insert_one(log.dict())
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 8. CONTRACT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/contract/generate")
async def generate_contract(candidate_id: str):
    """Generate contract for candidate"""
    from server import db
    
    contract_service = ContractService(db)
    result = await contract_service.generate_contract(candidate_id)
    
    return result


@recruitment_router.get("/contract/{contract_id}")
async def get_contract(contract_id: str):
    """Get contract details"""
    from server import db
    
    contract = await db.recruitment_contracts.find_one({"id": contract_id}, {"_id": 0})
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return contract


@recruitment_router.post("/contract/sign")
async def sign_contract(
    contract_id: str,
    signature_data: str,
    request: Request = None
):
    """Sign contract electronically"""
    from server import db
    
    contract_service = ContractService(db)
    client_info = get_client_info(request) if request else {}
    
    result = await contract_service.sign_contract(
        contract_id,
        signature_data,
        ip_address=client_info.get("ip_address"),
        device_info=client_info.get("user_agent")
    )
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 9. ONBOARDING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/onboarding/execute")
async def execute_onboarding(candidate_id: str):
    """Execute full onboarding"""
    from server import db
    
    onboarding_service = OnboardingService(db)
    result = await onboarding_service.execute_onboarding(candidate_id)
    
    return result


@recruitment_router.get("/onboarding/{candidate_id}")
async def get_onboarding_status(candidate_id: str):
    """Get onboarding status"""
    from server import db
    
    onboarding = await db.onboarding_profiles.find_one(
        {"candidate_id": candidate_id},
        {"_id": 0}
    )
    
    return {
        "candidate_id": candidate_id,
        "onboarding": onboarding,
        "onboarded": onboarding is not None
    }


@recruitment_router.post("/onboarding/activate")
async def activate_user(candidate_id: str):
    """Activate user after onboarding"""
    from server import db
    
    onboarding_service = OnboardingService(db)
    result = await onboarding_service.activate_user(candidate_id)
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 10. CAMPAIGN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/campaign")
async def create_campaign(
    name: str,
    target_count: int = 100,
    target_positions: List[str] = ["ctv"],
    target_regions: List[str] = [],
    start_date: str = None,
    end_date: str = None
):
    """Create recruitment campaign"""
    from server import db
    import uuid
    
    now = datetime.now(timezone.utc)
    
    campaign_id = str(uuid.uuid4())
    code = f"RC{now.strftime('%y%m%d')}{campaign_id[:4].upper()}"
    
    campaign = {
        "id": campaign_id,
        "name": name,
        "code": code,
        "target_count": target_count,
        "target_positions": target_positions,
        "target_regions": target_regions,
        "apply_url": f"/recruitment/apply?campaign_id={campaign_id}",
        "status": "active",
        "start_date": start_date or now.isoformat(),
        "end_date": end_date,
        "applications": 0,
        "conversions": 0,
        "created_at": now.isoformat(),
        "created_by": "system"
    }
    
    await db.recruitment_campaigns.insert_one(campaign)
    
    # Return without _id (MongoDB adds it)
    return {k: v for k, v in campaign.items() if k != '_id'}


@recruitment_router.get("/campaigns")
async def list_campaigns(status: str = None, limit: int = 20):
    """List recruitment campaigns"""
    from server import db
    
    query = {}
    if status:
        query["status"] = status
    
    campaigns = await db.recruitment_campaigns.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"campaigns": campaigns}


@recruitment_router.get("/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details"""
    from server import db
    
    campaign = await db.recruitment_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get stats
    applications = await db.candidates.count_documents({"campaign_id": campaign_id})
    conversions = await db.candidates.count_documents({
        "campaign_id": campaign_id,
        "status": {"$in": ["onboarded", "active"]}
    })
    
    campaign["applications"] = applications
    campaign["conversions"] = conversions
    campaign["conversion_rate"] = (conversions / applications * 100) if applications > 0 else 0
    
    return campaign


# ═══════════════════════════════════════════════════════════════════════════════
# 11. REFERRAL ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.get("/referral/link/{user_id}")
async def get_referral_link(user_id: str):
    """Get referral link for user"""
    from server import db
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "full_name": 1})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user_id,
        "referral_link": f"/recruitment/apply?ref_id={user_id}",
        "qr_data": f"ref_id={user_id}"
    }


@recruitment_router.get("/referral/stats/{user_id}")
async def get_referral_stats(user_id: str):
    """Get referral statistics for user"""
    from server import db
    
    referrals = await db.referral_trees.find(
        {"referrer_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    total = len(referrals)
    converted = sum(1 for r in referrals if r.get("status") == "converted")
    pending = sum(1 for r in referrals if r.get("status") == "pending")
    total_reward = sum(r.get("reward_amount", 0) for r in referrals if r.get("reward_paid"))
    
    return {
        "user_id": user_id,
        "total_referrals": total,
        "converted": converted,
        "pending": pending,
        "total_reward": total_reward,
        "referrals": referrals
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 12. AUDIT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.get("/audit/{candidate_id}")
async def get_audit_log(candidate_id: str):
    """Get audit log for candidate"""
    from server import db
    
    logs = await db.recruitment_audit_logs.find(
        {"candidate_id": candidate_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {
        "candidate_id": candidate_id,
        "logs": logs
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 13. QUICK FLOW ENDPOINT (AUTO END-TO-END)
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/flow/auto")
async def auto_flow(candidate_id: str, skip_kyc: bool = True, skip_test: bool = False):
    """
    Auto-execute full flow for testing/dev mode
    Skip optional steps based on config
    """
    if not RECRUITMENT_CONFIG["dev_mode"]:
        raise HTTPException(status_code=403, detail="Auto flow only available in dev mode")
    
    from server import db
    service = get_recruitment_service()
    
    # Get candidate
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    results = {"candidate_id": candidate_id, "steps": []}
    
    # Step 2: OTP Verify (auto in dev mode)
    if not candidate.get("email_verified"):
        otp_result = await service.otp_service.send_otp(
            candidate_id, OTPChannel.EMAIL, candidate["email"]
        )
        verify_result = await service.otp_service.verify_otp(
            candidate_id, "123456"
        )
        results["steps"].append({"step": "otp_verify", "result": verify_result})
    
    # Step 3: Consent
    if not candidate.get("consent_accepted"):
        consent_result = await service.consent_service.accept_consent(
            candidate_id, True, True, True, False, "127.0.0.1", "auto-flow"
        )
        results["steps"].append({"step": "consent", "result": consent_result})
    
    # Step 4: KYC (skip in dev)
    if skip_kyc and not candidate.get("kyc_verified"):
        await db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "kyc_verified": True,
                "status": CandidateStatus.KYC_VERIFIED.value,
                "current_step": 5
            }}
        )
        results["steps"].append({"step": "kyc", "result": {"skipped": True}})
    
    # Step 5: AI Screening
    ai_result = await service.ai_scoring_service.score_candidate(candidate_id)
    results["steps"].append({"step": "ai_score", "result": ai_result})
    
    # Step 6: Test
    if not skip_test:
        test_start = await service.test_engine.start_test(candidate_id)
        # Auto answer all questions correctly
        questions = await service.test_engine.get_test_questions()
        answers = [{"question_id": q["id"], "answer": q["correct_answer"]} for q in questions]
        test_result = await service.test_engine.submit_test(test_start["attempt_id"], answers)
        results["steps"].append({"step": "test", "result": test_result})
    else:
        await db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {"test_score": 80, "status": CandidateStatus.TESTED.value, "current_step": 7}}
        )
        results["steps"].append({"step": "test", "result": {"skipped": True, "score": 80}})
    
    # Step 7: Decision
    decision_result = await service.decision_engine.make_decision(candidate_id)
    results["steps"].append({"step": "decision", "result": decision_result})
    
    if decision_result.get("decision") == "pass":
        # Step 8: Contract
        contract_result = await service.contract_service.generate_contract(candidate_id)
        results["steps"].append({"step": "contract", "result": contract_result})
        
        # Step 9: Sign
        sign_result = await service.contract_service.sign_contract(
            contract_result["contract_id"],
            "auto_signature_data",
            "127.0.0.1",
            "auto-flow"
        )
        results["steps"].append({"step": "sign", "result": sign_result})
        
        # Step 10: Onboarding
        onboard_result = await service.onboarding_service.execute_onboarding(candidate_id)
        results["steps"].append({"step": "onboarding", "result": onboard_result})
        
        # Step 11: Activate
        activate_result = await service.onboarding_service.activate_user(candidate_id)
        results["steps"].append({"step": "activate", "result": activate_result})
    
    # Get final status
    final_status = await service.get_candidate_status(candidate_id)
    results["final_status"] = final_status
    
    return results



# ═══════════════════════════════════════════════════════════════════════════════
# REFERRAL ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.get("/referral/tree/{user_id}")
async def get_referral_tree(user_id: str):
    """Get referral tree for a user"""
    from services.recruitment_service import ReferralService
    from server import db
    
    service = ReferralService(db)
    return await service.get_referral_tree(user_id)


@recruitment_router.get("/referral/stats/{user_id}")
async def get_referral_stats(user_id: str):
    """Get referral statistics for a user"""
    from services.recruitment_service import ReferralService
    from server import db
    
    service = ReferralService(db)
    return await service.get_referral_stats(user_id)


@recruitment_router.get("/referral/link/{user_id}")
async def get_referral_link(user_id: str):
    """Get referral link for a user"""
    from server import db
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "employee_code": 1, "full_name": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    ref_code = user.get("employee_code", user_id[:8])
    base_url = "/recruitment/apply"
    
    return {
        "success": True,
        "user_id": user_id,
        "ref_code": ref_code,
        "referral_link": f"{base_url}?ref_id={user_id}",
        "qr_data": f"{base_url}?ref_id={user_id}"  # For QR code generation
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT TEMPLATE ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/admin/contract-template/upload")
async def upload_contract_template(
    name: str = Query(...),
    contract_type: str = Query("ctv"),
    template_content: str = Body(...),
    description: str = Query(None),
    created_by: str = Query(None)
):
    """Upload new contract template"""
    from services.recruitment_service import ContractTemplateService
    from server import db
    
    service = ContractTemplateService(db)
    return await service.create_template(
        name=name,
        contract_type=contract_type,
        template_content=template_content,
        description=description,
        created_by=created_by
    )


@recruitment_router.get("/admin/contract-template/list")
async def list_contract_templates(contract_type: str = Query(None)):
    """List all contract templates"""
    from services.recruitment_service import ContractTemplateService
    from server import db
    
    service = ContractTemplateService(db)
    return await service.list_templates(contract_type)


@recruitment_router.get("/admin/contract-template/{template_id}")
async def get_contract_template(template_id: str):
    """Get contract template by ID"""
    from services.recruitment_service import ContractTemplateService
    from server import db
    
    service = ContractTemplateService(db)
    return await service.get_template(template_id)


@recruitment_router.post("/admin/contract-template/{template_id}/activate")
async def activate_contract_template(template_id: str, approved_by: str = Query(None)):
    """Activate a contract template"""
    from services.recruitment_service import ContractTemplateService
    from server import db
    
    service = ContractTemplateService(db)
    return await service.activate_template(template_id, approved_by)


@recruitment_router.delete("/admin/contract-template/{template_id}")
async def delete_contract_template(template_id: str):
    """Delete a contract template"""
    from services.recruitment_service import ContractTemplateService
    from server import db
    
    service = ContractTemplateService(db)
    return await service.delete_template(template_id)


# ═══════════════════════════════════════════════════════════════════════════════
# QR CODE GENERATOR - PRODUCTION
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.get("/qr/generate")
async def generate_qr_code(
    ref_id: str = Query(None),
    campaign_id: str = Query(None),
    format: str = Query("png")
):
    """Generate QR code for recruitment link - Returns actual QR image"""
    from services.production_integrations import get_qr_service
    import os
    
    # Get frontend URL from env
    frontend_url = os.environ.get("FRONTEND_URL", os.environ.get("REACT_APP_BACKEND_URL", ""))
    
    qr_service = get_qr_service(frontend_url)
    result = qr_service.generate_apply_qr(ref_id, campaign_id, format)
    
    return {
        "success": result.get("success", False),
        "format": result.get("format", format),
        "qr_image": result.get("data"),  # Base64 PNG or SVG string
        "apply_url": result.get("apply_url"),
        "ref_id": ref_id,
        "campaign_id": campaign_id,
        "note": "Use qr_image directly as src for img tag (PNG) or innerHTML (SVG)"
    }



# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL TEST ENDPOINT (Admin only)
# ═══════════════════════════════════════════════════════════════════════════════

@recruitment_router.post("/admin/test-email")
async def test_email_delivery(
    to_email: str = Query(..., description="Email to send test OTP"),
    name: str = Query("Test User", description="Recipient name")
):
    """Test email delivery - Admin endpoint to verify Resend is working"""
    from services.production_integrations import get_email_service
    import random
    import os
    
    # Generate test OTP
    test_otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Get email service
    email_service = get_email_service()
    
    # Check configuration
    config_status = {
        "resend_configured": email_service.is_configured,
        "sender_email": email_service.sender_email,
        "api_key_set": bool(os.environ.get("RESEND_API_KEY")),
        "dev_mode": RECRUITMENT_CONFIG["dev_mode"]
    }
    
    if not email_service.is_configured:
        return {
            "success": False,
            "error": "Resend not configured - add RESEND_API_KEY to .env",
            "config": config_status
        }
    
    # Send test email
    result = await email_service.send_otp_email(to_email, test_otp, name)
    
    return {
        "success": result.get("success", False),
        "email_id": result.get("email_id"),
        "to_email": to_email,
        "config": config_status,
        "message": "Check your inbox (and spam folder)" if result.get("success") else result.get("error")
    }


@recruitment_router.get("/admin/email-status")
async def check_email_status():
    """Check email configuration status"""
    from services.production_integrations import get_email_service
    import os
    
    email_service = get_email_service()
    
    return {
        "resend_configured": email_service.is_configured,
        "sender_email": email_service.sender_email,
        "api_key_set": bool(os.environ.get("RESEND_API_KEY")),
        "api_key_preview": os.environ.get("RESEND_API_KEY", "")[:10] + "..." if os.environ.get("RESEND_API_KEY") else None,
        "email_from_env": os.environ.get("EMAIL_FROM"),
        "frontend_url": os.environ.get("FRONTEND_URL"),
        "dev_mode": RECRUITMENT_CONFIG["dev_mode"],
        "ready_for_production": email_service.is_configured and not RECRUITMENT_CONFIG["dev_mode"]
    }


@recruitment_router.get("/admin/production-checklist")
async def production_checklist():
    """Complete production readiness checklist"""
    from services.production_integrations import get_email_service, get_qr_service
    import os
    
    email_service = get_email_service()
    qr_service = get_qr_service()
    
    checks = {
        "domain_config": {
            "frontend_url": os.environ.get("FRONTEND_URL", "NOT SET"),
            "backend_url": os.environ.get("BACKEND_URL", "NOT SET"),
            "cookie_domain": os.environ.get("COOKIE_DOMAIN", "NOT SET"),
            "status": "✅" if "prohouzing.com" in os.environ.get("FRONTEND_URL", "") else "❌"
        },
        "email_config": {
            "resend_configured": email_service.is_configured,
            "sender_email": email_service.sender_email,
            "api_key_set": bool(os.environ.get("RESEND_API_KEY")),
            "status": "✅" if email_service.is_configured else "❌"
        },
        "security_config": {
            "dev_mode": RECRUITMENT_CONFIG["dev_mode"],
            "cors_origins": os.environ.get("CORS_ORIGINS", "*"),
            "status": "✅" if not RECRUITMENT_CONFIG["dev_mode"] else "⚠️ Dev mode"
        },
        "qr_config": {
            "qr_available": qr_service.is_available,
            "base_url": qr_service.base_url,
            "status": "✅" if qr_service.is_available and "prohouzing.com" in qr_service.base_url else "❌"
        }
    }
    
    all_ready = all(c.get("status") == "✅" for c in checks.values())
    
    return {
        "ready_for_production": all_ready,
        "checks": checks,
        "next_steps": [] if all_ready else [
            "Add RESEND_API_KEY to .env" if not checks["email_config"]["api_key_set"] else None,
            "Set RECRUITMENT_DEV_MODE=false" if RECRUITMENT_CONFIG["dev_mode"] else None,
            "Configure DNS for prohouzing.com" if checks["domain_config"]["status"] == "❌" else None
        ]
    }
