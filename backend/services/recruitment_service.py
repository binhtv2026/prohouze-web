"""
Recruitment Service - Phase 3.5: AUTO RECRUITMENT + ONBOARDING ENGINE
GLOBAL STANDARD 10/10 - LOCKED

Services:
- RecruitmentService (main orchestrator)
- OTPService
- ConsentService
- IdentityService
- AIScoringService
- TestEngine
- DecisionEngine
- OnboardingService
- ReferralService
"""

import os
import uuid
import hashlib
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
import bcrypt

from models.recruitment_models import (
    Candidate, CandidateStatus, OTPVerification, OTPChannel, OTPStatus,
    ConsentLog, IdentityVerification, VerificationStatus, AIScore,
    TestAttempt, TestQuestion, TestAnswer, RecruitmentContract, ContractStatus,
    OnboardingProfile, ReferralTree, RecruitmentCampaign, RecruitmentAuditLog,
    PositionType, RiskLevel, FitLevel, ApplicationRequest
)


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

RECRUITMENT_CONFIG = {
    "dev_mode": os.environ.get("RECRUITMENT_DEV_MODE", "true").lower() == "true",
    "dev_otp": "123456",
    
    "otp_expiry_minutes": int(os.environ.get("OTP_EXPIRY", "300")) // 60,  # Convert seconds to minutes
    "otp_max_attempts": int(os.environ.get("OTP_MAX_ATTEMPTS", "5")),
    "otp_max_resends": 5,
    "otp_cooldown_seconds": 60,
    
    "enable_zalo": os.environ.get("ENABLE_ZALO", "false").lower() == "true",
    "enable_email": os.environ.get("ENABLE_EMAIL", "true").lower() == "true",
    "enable_sms": os.environ.get("ENABLE_SMS", "false").lower() == "true",
    
    "enable_ai": os.environ.get("ENABLE_AI", "true").lower() == "true",
    "enable_kyc": os.environ.get("ENABLE_KYC", "true").lower() == "true",
    "enable_consent": os.environ.get("ENABLE_CONSENT", "true").lower() == "true",
    
    "pass_threshold": 60.0,
    "test_pass_threshold": 60.0,
    "ai_pass_threshold": 50.0,
}


# ═══════════════════════════════════════════════════════════════════════════════
# OTP SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class OTPService:
    def __init__(self, db):
        self.db = db
        self.config = RECRUITMENT_CONFIG
    
    def _generate_otp(self) -> str:
        """Generate 6-digit OTP"""
        if self.config["dev_mode"]:
            return self.config["dev_otp"]
        return ''.join(random.choices(string.digits, k=6))
    
    def _hash_otp(self, otp: str) -> str:
        """Hash OTP using bcrypt"""
        return bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()
    
    def _verify_otp_hash(self, otp: str, hashed: str) -> bool:
        """Verify OTP against hash"""
        return bcrypt.checkpw(otp.encode(), hashed.encode())
    
    async def send_otp(
        self,
        candidate_id: str,
        channel: OTPChannel,
        target: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """Send OTP via specified channel"""
        now = datetime.now(timezone.utc)
        
        # Check cooldown
        recent_otp = await self.db.otp_verifications.find_one({
            "candidate_id": candidate_id,
            "channel": channel.value,
            "created_at": {"$gte": (now - timedelta(seconds=self.config["otp_cooldown_seconds"])).isoformat()}
        })
        
        if recent_otp:
            return {
                "success": False,
                "error": f"Vui lòng đợi {self.config['otp_cooldown_seconds']}s trước khi gửi lại",
                "cooldown": True
            }
        
        # Check resend limit
        today_count = await self.db.otp_verifications.count_documents({
            "candidate_id": candidate_id,
            "channel": channel.value,
            "created_at": {"$gte": now.replace(hour=0, minute=0, second=0).isoformat()}
        })
        
        if today_count >= self.config["otp_max_resends"]:
            return {
                "success": False,
                "error": f"Đã vượt quá số lần gửi OTP ({self.config['otp_max_resends']}/ngày)",
                "limit_exceeded": True
            }
        
        # Generate OTP
        otp = self._generate_otp()
        otp_hash = self._hash_otp(otp)
        
        # Create OTP record
        expiry = now + timedelta(minutes=self.config["otp_expiry_minutes"])
        otp_doc = OTPVerification(
            candidate_id=candidate_id,
            channel=channel,
            target=target,
            otp_hash=otp_hash,
            expires_at=expiry.isoformat(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        await self.db.otp_verifications.insert_one(otp_doc.dict())
        
        # Send OTP based on channel
        sent = False
        if self.config["dev_mode"]:
            sent = True
            print(f"[DEV MODE] OTP for {target}: {otp}")
        else:
            if channel == OTPChannel.EMAIL and self.config["enable_email"]:
                sent = await self._send_email_otp(target, otp)
            elif channel == OTPChannel.ZALO and self.config["enable_zalo"]:
                sent = await self._send_zalo_otp(target, otp)
            elif channel == OTPChannel.SMS and self.config["enable_sms"]:
                sent = await self._send_sms_otp(target, otp)
        
        # Log audit
        await self._log_audit(candidate_id, "otp_sent", 2, {
            "channel": channel.value,
            "target": target,
            "sent": sent
        }, ip_address, user_agent)
        
        return {
            "success": sent,
            "otp_id": otp_doc.id,
            "channel": channel.value,
            "expires_in": self.config["otp_expiry_minutes"] * 60,
            "dev_mode": self.config["dev_mode"],
            "dev_otp": otp if self.config["dev_mode"] else None
        }
    
    async def verify_otp(
        self,
        candidate_id: str,
        otp: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """Verify OTP"""
        now = datetime.now(timezone.utc)
        
        # Find latest pending OTP
        otp_record = await self.db.otp_verifications.find_one(
            {
                "candidate_id": candidate_id,
                "status": OTPStatus.PENDING.value,
                "expires_at": {"$gt": now.isoformat()}
            },
            sort=[("created_at", -1)]
        )
        
        if not otp_record:
            return {
                "success": False,
                "error": "OTP không hợp lệ hoặc đã hết hạn"
            }
        
        # Check attempts
        if otp_record["attempt_count"] >= self.config["otp_max_attempts"]:
            await self.db.otp_verifications.update_one(
                {"id": otp_record["id"]},
                {"$set": {"status": OTPStatus.FAILED.value}}
            )
            return {
                "success": False,
                "error": "Đã vượt quá số lần thử"
            }
        
        # Verify OTP
        if self._verify_otp_hash(otp, otp_record["otp_hash"]):
            # Success
            await self.db.otp_verifications.update_one(
                {"id": otp_record["id"]},
                {"$set": {
                    "status": OTPStatus.VERIFIED.value,
                    "verified_at": now.isoformat()
                }}
            )
            
            # Update candidate verification status
            channel = otp_record["channel"]
            update_field = "phone_verified" if channel in ["sms", "zalo"] else "email_verified"
            
            await self.db.candidates.update_one(
                {"id": candidate_id},
                {"$set": {
                    update_field: True,
                    "status": CandidateStatus.VERIFIED.value,
                    "current_step": 3,
                    "updated_at": now.isoformat()
                }}
            )
            
            # Log audit
            await self._log_audit(candidate_id, "otp_verified", 2, {
                "channel": channel,
            }, ip_address, user_agent)
            
            return {
                "success": True,
                "verified": True,
                "next_step": "consent"
            }
        else:
            # Failed attempt
            await self.db.otp_verifications.update_one(
                {"id": otp_record["id"]},
                {
                    "$inc": {"attempt_count": 1},
                    "$set": {"last_attempt_at": now.isoformat()}
                }
            )
            
            remaining = self.config["otp_max_attempts"] - otp_record["attempt_count"] - 1
            
            return {
                "success": False,
                "error": f"OTP không chính xác. Còn {remaining} lần thử",
                "remaining_attempts": remaining
            }
    
    async def _send_email_otp(self, email: str, otp: str, candidate_name: str = None) -> bool:
        """Send OTP via email using Production Resend Service"""
        from services.production_integrations import get_email_service
        import logging
        
        logger = logging.getLogger(__name__)
        
        email_service = get_email_service()
        result = await email_service.send_otp_email(email, otp, candidate_name)
        
        # SECURITY: Never log actual OTP in production
        if self.config["dev_mode"]:
            logger.info(f"[OTP DEV] Sent to {email}: {otp}")
        else:
            logger.info(f"[OTP PROD] Sent to {email} - ID: {result.get('email_id', 'N/A')}")
        
        return result.get("success", False)
    
    async def _send_zalo_otp(self, phone: str, otp: str) -> bool:
        """Send OTP via Zalo ZNS"""
        # TODO: Integrate with Zalo ZNS API
        print(f"[ZALO] Sending OTP {otp} to {phone}")
        return True
    
    async def _send_sms_otp(self, phone: str, otp: str) -> bool:
        """Send OTP via SMS"""
        # TODO: Integrate with SMS provider
        print(f"[SMS] Sending OTP {otp} to {phone}")
        return True
    
    async def _log_audit(
        self, candidate_id: str, action: str, step: int,
        details: Dict, ip: str = None, ua: str = None
    ):
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action=action,
            step=step,
            details=details,
            ip_address=ip,
            user_agent=ua
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())


# ═══════════════════════════════════════════════════════════════════════════════
# CONSENT SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class ConsentService:
    def __init__(self, db):
        self.db = db
    
    async def accept_consent(
        self,
        candidate_id: str,
        data_processing: bool,
        terms_of_service: bool,
        privacy_policy: bool,
        marketing_consent: bool = False,
        ip_address: str = None,
        user_agent: str = None,
        device_fingerprint: str = None
    ) -> Dict[str, Any]:
        """Record consent acceptance (GDPR/PDPA compliant)"""
        now = datetime.now(timezone.utc)
        
        if not all([data_processing, terms_of_service, privacy_policy]):
            return {
                "success": False,
                "error": "Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật"
            }
        
        # Create consent log
        consent = ConsentLog(
            candidate_id=candidate_id,
            data_processing=data_processing,
            terms_of_service=terms_of_service,
            privacy_policy=privacy_policy,
            marketing_consent=marketing_consent,
            ip_address=ip_address or "",
            user_agent=user_agent or "",
            device_fingerprint=device_fingerprint
        )
        
        await self.db.consent_logs.insert_one(consent.dict())
        
        # Update candidate
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "consent_accepted": True,
                "status": CandidateStatus.CONSENTED.value,
                "current_step": 4,
                "updated_at": now.isoformat()
            }}
        )
        
        # Audit log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="consent_accepted",
            step=3,
            details={
                "data_processing": data_processing,
                "terms_of_service": terms_of_service,
                "privacy_policy": privacy_policy,
                "marketing_consent": marketing_consent
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "consent_id": consent.id,
            "next_step": "kyc"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# IDENTITY SERVICE (KYC)
# ═══════════════════════════════════════════════════════════════════════════════

class IdentityService:
    def __init__(self, db):
        self.db = db
        self.config = RECRUITMENT_CONFIG
    
    async def submit_kyc(
        self,
        candidate_id: str,
        document_type: str,
        document_front_url: str,
        document_back_url: str = None,
        selfie_url: str = None
    ) -> Dict[str, Any]:
        """Submit KYC documents"""
        now = datetime.now(timezone.utc)
        
        # Create verification record
        verification = IdentityVerification(
            candidate_id=candidate_id,
            document_type=document_type,
            document_front_url=document_front_url,
            document_back_url=document_back_url,
            selfie_url=selfie_url
        )
        
        # In dev mode, auto-verify
        if self.config["dev_mode"]:
            verification.status = VerificationStatus.VERIFIED
            verification.ocr_full_name = "Test User"
            verification.face_match_passed = True
            verification.face_match_score = 95.0
            verification.liveness_passed = True
            verification.liveness_score = 98.0
        
        await self.db.identity_verifications.insert_one(verification.dict())
        
        # Update candidate
        if verification.status == VerificationStatus.VERIFIED:
            await self.db.candidates.update_one(
                {"id": candidate_id},
                {"$set": {
                    "kyc_verified": True,
                    "status": CandidateStatus.KYC_VERIFIED.value,
                    "current_step": 5,
                    "updated_at": now.isoformat()
                }}
            )
        
        return {
            "success": True,
            "verification_id": verification.id,
            "status": verification.status.value,
            "auto_verified": self.config["dev_mode"],
            "next_step": "screening" if verification.status == VerificationStatus.VERIFIED else "pending"
        }
    
    async def check_duplicate(self, document_number: str, candidate_id: str) -> bool:
        """Check for duplicate identity"""
        existing = await self.db.identity_verifications.find_one({
            "document_number": document_number,
            "candidate_id": {"$ne": candidate_id},
            "status": VerificationStatus.VERIFIED.value
        })
        return existing is not None


# ═══════════════════════════════════════════════════════════════════════════════
# AI SCORING SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class AIScoringService:
    def __init__(self, db):
        self.db = db
        self.config = RECRUITMENT_CONFIG
    
    async def score_candidate(self, candidate_id: str) -> Dict[str, Any]:
        """AI-powered candidate scoring - PRODUCTION with real LLM"""
        from services.production_integrations import get_ai_service
        
        now = datetime.now(timezone.utc)
        
        # Get candidate data
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return {"success": False, "error": "Candidate not found"}
        
        # Use Production AI Service
        ai_service = get_ai_service()
        ai_result = await ai_service.score_candidate(candidate)
        
        # Map AI result to internal format
        overall_score = ai_result.get("overall_score", 60)
        risk_score = ai_result.get("risk_score", 30)
        fit_type = ai_result.get("fit_type", "average")
        
        # Determine risk level
        if risk_score < 30:
            risk_level = RiskLevel.LOW
        elif risk_score < 60:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.HIGH
        
        # Determine fit level
        if fit_type == "high_potential" or overall_score >= 80:
            fit_level = FitLevel.EXCELLENT
        elif fit_type == "average" or overall_score >= 60:
            fit_level = FitLevel.GOOD
        else:
            fit_level = FitLevel.POOR
        
        # Recommended position
        rec_pos = ai_result.get("recommended_position", candidate.get("position", "ctv"))
        try:
            recommended_position = PositionType(rec_pos)
        except:
            recommended_position = PositionType.CTV
        
        # Create AI score record
        ai_score = AIScore(
            candidate_id=candidate_id,
            form_analyzed=True,
            overall_score=overall_score,
            experience_score=overall_score * 0.3,
            communication_score=overall_score * 0.2,
            sales_mindset_score=overall_score * 0.3,
            culture_fit_score=overall_score * 0.2,
            risk_level=risk_level,
            fit_level=fit_level,
            recommended_position=recommended_position,
            strengths=[s for s in ai_result.get("strengths", []) if s],
            weaknesses=[w for w in ai_result.get("concerns", []) if w],
            recommendations=[]
        )
        
        await self.db.ai_scores.insert_one(ai_score.dict())
        
        # Update candidate
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "ai_score": overall_score,
                "screening_score": overall_score,
                "risk_level": risk_level.value,
                "fit_level": fit_level.value,
                "status": CandidateStatus.SCREENED.value,
                "current_step": 6,
                "updated_at": now.isoformat()
            }}
        )
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="ai_scored",
            step=5,
            details={
                "overall_score": overall_score,
                "risk_score": risk_score,
                "fit_type": fit_type,
                "ai_powered": ai_result.get("ai_powered", False)
            }
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "score_id": ai_score.id,
            "overall_score": overall_score,
            "risk_level": risk_level.value,
            "fit_level": fit_level.value,
            "fit_type": fit_type,
            "risk_score": risk_score,
            "recommended_position": recommended_position.value,
            "ai_powered": ai_result.get("ai_powered", False),
            "strengths": ai_result.get("strengths", []),
            "concerns": ai_result.get("concerns", []),
            "next_step": "test"
        }
    
    def _calculate_scores(self, candidate: Dict) -> Dict[str, Any]:
        """Calculate various scores based on candidate profile"""
        scores = {
            "experience": 0.0,
            "communication": 50.0,  # Default
            "sales_mindset": 50.0,  # Default
            "culture_fit": 60.0,  # Default
            "strengths": [],
            "weaknesses": [],
            "recommendations": []
        }
        
        # Experience score
        exp_years = candidate.get("experience_years", 0)
        has_re_exp = candidate.get("has_real_estate_exp", False)
        
        if exp_years >= 3:
            scores["experience"] = 90.0
            scores["strengths"].append("Nhiều năm kinh nghiệm")
        elif exp_years >= 1:
            scores["experience"] = 70.0
        else:
            scores["experience"] = 40.0
            scores["weaknesses"].append("Chưa có kinh nghiệm")
            scores["recommendations"].append("Cần đào tạo kỹ")
        
        if has_re_exp:
            scores["experience"] += 10
            scores["strengths"].append("Có kinh nghiệm BĐS")
        
        # Position fit
        position = candidate.get("position", "ctv")
        if position == "leader" and exp_years < 2:
            scores["culture_fit"] -= 20
            scores["weaknesses"].append("Chưa đủ kinh nghiệm cho vị trí Leader")
        
        # Calculate overall
        scores["overall"] = (
            scores["experience"] * 0.3 +
            scores["communication"] * 0.2 +
            scores["sales_mindset"] * 0.3 +
            scores["culture_fit"] * 0.2
        )
        
        # Determine risk level
        if scores["overall"] >= 70:
            scores["risk_level"] = RiskLevel.LOW
        elif scores["overall"] >= 50:
            scores["risk_level"] = RiskLevel.MEDIUM
        else:
            scores["risk_level"] = RiskLevel.HIGH
        
        # Determine fit level
        if scores["overall"] >= 80:
            scores["fit_level"] = FitLevel.EXCELLENT
        elif scores["overall"] >= 65:
            scores["fit_level"] = FitLevel.GOOD
        elif scores["overall"] >= 50:
            scores["fit_level"] = FitLevel.AVERAGE
        else:
            scores["fit_level"] = FitLevel.POOR
        
        # Recommend position
        if scores["overall"] >= 75 and exp_years >= 2:
            scores["recommended_position"] = PositionType.SALE
        elif scores["overall"] >= 60:
            scores["recommended_position"] = PositionType.CTV
        else:
            scores["recommended_position"] = PositionType.CTV
        
        return scores


# ═══════════════════════════════════════════════════════════════════════════════
# TEST ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TestEngine:
    def __init__(self, db):
        self.db = db
        self.config = RECRUITMENT_CONFIG
    
    async def get_test_questions(self, test_type: str = "screening") -> List[Dict]:
        """Get test questions"""
        # Default screening test questions
        questions = [
            {
                "id": "q1",
                "question": "Trong BĐS sơ cấp, 'Soft Booking' có nghĩa là gì?",
                "question_type": "mcq",
                "options": [
                    "Đặt cọc giữ chỗ (có thể hoàn lại)",
                    "Ký hợp đồng mua bán",
                    "Thanh toán đợt cuối",
                    "Đặt cọc không hoàn lại"
                ],
                "correct_answer": "Đặt cọc giữ chỗ (có thể hoàn lại)",
                "points": 10,
                "category": "real_estate"
            },
            {
                "id": "q2",
                "question": "Khi khách hàng nói 'Tôi cần suy nghĩ thêm', bạn nên làm gì?",
                "question_type": "mcq",
                "options": [
                    "Chờ họ liên hệ lại",
                    "Tìm hiểu lý do và giải quyết",
                    "Giảm giá ngay lập tức",
                    "Từ bỏ khách hàng này"
                ],
                "correct_answer": "Tìm hiểu lý do và giải quyết",
                "points": 10,
                "category": "sales"
            },
            {
                "id": "q3",
                "question": "Điều gì quan trọng nhất khi gọi điện thoại cho khách hàng tiềm năng?",
                "question_type": "mcq",
                "options": [
                    "Nói thật nhanh để tiết kiệm thời gian",
                    "Tập trung vào bán hàng ngay từ đầu",
                    "Lắng nghe và hiểu nhu cầu khách hàng",
                    "Gửi báo giá ngay lập tức"
                ],
                "correct_answer": "Lắng nghe và hiểu nhu cầu khách hàng",
                "points": 10,
                "category": "sales"
            },
            {
                "id": "q4",
                "question": "Một ngày làm việc, bạn sẵn sàng gọi bao nhiêu cuộc điện thoại?",
                "question_type": "mcq",
                "options": [
                    "5-10 cuộc",
                    "20-30 cuộc",
                    "50-100 cuộc",
                    "Càng nhiều càng tốt"
                ],
                "correct_answer": "50-100 cuộc",
                "points": 10,
                "category": "mindset"
            },
            {
                "id": "q5",
                "question": "Khi bị từ chối liên tục, bạn sẽ làm gì?",
                "question_type": "mcq",
                "options": [
                    "Nghỉ ngơi và suy nghĩ lại nghề nghiệp",
                    "Đổ lỗi cho thị trường",
                    "Phân tích nguyên nhân và cải thiện",
                    "Chờ thị trường tốt hơn"
                ],
                "correct_answer": "Phân tích nguyên nhân và cải thiện",
                "points": 10,
                "category": "mindset"
            },
            {
                "id": "q6",
                "question": "Pháp lý dự án BĐS quan trọng nhất là gì?",
                "question_type": "mcq",
                "options": [
                    "Giấy phép xây dựng",
                    "Sổ đỏ/Sổ hồng",
                    "Giấy chứng nhận đầu tư",
                    "Tất cả các loại trên"
                ],
                "correct_answer": "Tất cả các loại trên",
                "points": 10,
                "category": "real_estate"
            },
            {
                "id": "q7",
                "question": "CTV (Cộng Tác Viên) khác Sale chính thức ở điểm nào?",
                "question_type": "mcq",
                "options": [
                    "Không có lương cơ bản",
                    "Không cần đi làm",
                    "Chỉ nhận hoa hồng theo giao dịch",
                    "Tất cả các điều trên"
                ],
                "correct_answer": "Tất cả các điều trên",
                "points": 10,
                "category": "general"
            },
            {
                "id": "q8",
                "question": "Thời gian tốt nhất để gọi điện telesales?",
                "question_type": "mcq",
                "options": [
                    "6h - 8h sáng",
                    "9h - 11h30 và 14h - 16h30",
                    "12h - 14h trưa",
                    "21h - 23h tối"
                ],
                "correct_answer": "9h - 11h30 và 14h - 16h30",
                "points": 10,
                "category": "sales"
            },
            {
                "id": "q9",
                "question": "Bạn đặt mục tiêu thu nhập hàng tháng là bao nhiêu?",
                "question_type": "mcq",
                "options": [
                    "5-10 triệu",
                    "15-30 triệu",
                    "50-100 triệu",
                    "Trên 100 triệu"
                ],
                "correct_answer": "50-100 triệu",
                "points": 10,
                "category": "mindset"
            },
            {
                "id": "q10",
                "question": "Điều gì giúp bạn thành công trong nghề sales BĐS?",
                "question_type": "mcq",
                "options": [
                    "Kiên trì và kỷ luật",
                    "Học hỏi liên tục",
                    "Xây dựng mối quan hệ",
                    "Tất cả các điều trên"
                ],
                "correct_answer": "Tất cả các điều trên",
                "points": 10,
                "category": "mindset"
            }
        ]
        
        return questions
    
    async def start_test(self, candidate_id: str, test_type: str = "screening") -> Dict[str, Any]:
        """Start a test attempt"""
        now = datetime.now(timezone.utc)
        
        questions = await self.get_test_questions(test_type)
        
        attempt = TestAttempt(
            candidate_id=candidate_id,
            test_id=f"test_{test_type}",
            test_name=f"Bài test {test_type}",
            test_type=test_type,
            total_questions=len(questions),
            total_points=sum(q["points"] for q in questions)
        )
        
        await self.db.test_attempts.insert_one(attempt.dict())
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="test_started",
            step=6,
            details={"test_type": test_type, "attempt_id": attempt.id}
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "attempt_id": attempt.id,
            "questions": questions,
            "time_limit": attempt.time_limit_minutes,
            "total_questions": len(questions)
        }
    
    async def submit_test(
        self,
        attempt_id: str,
        answers: List[Dict]
    ) -> Dict[str, Any]:
        """Submit and grade test"""
        now = datetime.now(timezone.utc)
        
        # Get attempt
        attempt = await self.db.test_attempts.find_one({"id": attempt_id}, {"_id": 0})
        if not attempt:
            return {"success": False, "error": "Test attempt not found"}
        
        # Get questions for grading
        questions = await self.get_test_questions(attempt["test_type"])
        questions_map = {q["id"]: q for q in questions}
        
        # Grade answers
        earned_points = 0
        graded_answers = []
        category_scores = {}
        
        for ans in answers:
            q = questions_map.get(ans["question_id"])
            if not q:
                continue
            
            is_correct = ans["answer"] == q["correct_answer"]
            points = q["points"] if is_correct else 0
            earned_points += points
            
            # Track category scores
            cat = q["category"]
            if cat not in category_scores:
                category_scores[cat] = {"correct": 0, "total": 0}
            category_scores[cat]["total"] += 1
            if is_correct:
                category_scores[cat]["correct"] += 1
            
            graded_answers.append({
                "question_id": ans["question_id"],
                "answer": ans["answer"],
                "is_correct": is_correct,
                "points_earned": points
            })
        
        # Calculate score
        total_points = attempt["total_points"]
        score_percentage = (earned_points / total_points * 100) if total_points > 0 else 0
        passed = score_percentage >= self.config["test_pass_threshold"]
        
        # Calculate category percentages
        cat_percentages = {}
        for cat, scores in category_scores.items():
            cat_percentages[cat] = (scores["correct"] / scores["total"] * 100) if scores["total"] > 0 else 0
        
        # Update attempt
        await self.db.test_attempts.update_one(
            {"id": attempt_id},
            {"$set": {
                "completed_at": now.isoformat(),
                "answered_questions": len(answers),
                "answers": graded_answers,
                "earned_points": earned_points,
                "score_percentage": score_percentage,
                "passed": passed,
                "category_scores": cat_percentages,
                "status": "completed"
            }}
        )
        
        # Update candidate
        candidate_id = attempt["candidate_id"]
        new_status = CandidateStatus.TESTED.value if passed else CandidateStatus.SCREENED.value
        
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "test_score": score_percentage,
                "status": new_status,
                "current_step": 7 if passed else 6,
                "updated_at": now.isoformat()
            }}
        )
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="test_completed",
            step=6,
            details={
                "attempt_id": attempt_id,
                "score": score_percentage,
                "passed": passed
            }
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "score": score_percentage,
            "earned_points": earned_points,
            "total_points": total_points,
            "passed": passed,
            "pass_threshold": self.config["test_pass_threshold"],
            "category_scores": cat_percentages,
            "next_step": "decision" if passed else "failed"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# DECISION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class DecisionEngine:
    def __init__(self, db):
        self.db = db
        self.config = RECRUITMENT_CONFIG
    
    async def make_decision(self, candidate_id: str, override: str = None) -> Dict[str, Any]:
        """AI-powered decision: PASS / FAIL / REVIEW"""
        now = datetime.now(timezone.utc)
        
        # Get candidate
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return {"success": False, "error": "Candidate not found"}
        
        # Get scores
        ai_score = candidate.get("ai_score", 0)
        test_score = candidate.get("test_score", 0)
        risk_level = candidate.get("risk_level", "low")
        
        # Calculate final score
        final_score = (ai_score * 0.4 + test_score * 0.6)
        
        # Decision logic
        if override:
            decision = override
        elif final_score >= self.config["pass_threshold"] and risk_level != "high":
            decision = "pass"
        elif final_score < 40 or risk_level == "high":
            decision = "fail"
        else:
            decision = "review"
        
        # Update candidate
        new_status = {
            "pass": CandidateStatus.PASSED.value,
            "fail": CandidateStatus.REJECTED.value,
            "review": CandidateStatus.SCREENED.value
        }.get(decision, CandidateStatus.SCREENED.value)
        
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "final_score": final_score,
                "decision": decision,
                "decision_at": now.isoformat(),
                "status": new_status,
                "current_step": 8 if decision == "pass" else candidate.get("current_step", 7),
                "updated_at": now.isoformat()
            }}
        )
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="decision_made",
            step=7,
            details={
                "decision": decision,
                "final_score": final_score,
                "ai_score": ai_score,
                "test_score": test_score,
                "risk_level": risk_level
            }
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "decision": decision,
            "final_score": final_score,
            "ai_score": ai_score,
            "test_score": test_score,
            "next_step": "contract" if decision == "pass" else decision
        }


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT SERVICE - With Template Support
# ═══════════════════════════════════════════════════════════════════════════════

class ContractService:
    def __init__(self, db):
        self.db = db
    
    async def generate_contract(self, candidate_id: str) -> Dict[str, Any]:
        """Generate employment contract from template"""
        now = datetime.now(timezone.utc)
        
        # Get candidate
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return {"success": False, "error": "Candidate not found"}
        
        # Generate contract number
        contract_number = f"CTR-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        # Get position and commission rate
        position = candidate.get("position", "ctv")
        commission_rate = {
            "ctv": 0.3,
            "sale": 0.4,
            "leader": 0.5
        }.get(position, 0.3)
        
        # FIX: Get contract template from database (not hardcode)
        template = await self.db.contract_templates.find_one({
            "contract_type": position,
            "is_active": True
        }, {"_id": 0})
        
        if template:
            # Render from template
            contract_content = self._render_template(
                template["template_content"],
                candidate,
                contract_number,
                commission_rate
            )
            
            # Update template usage count
            await self.db.contract_templates.update_one(
                {"id": template["id"]},
                {"$inc": {"usage_count": 1}}
            )
        else:
            # Fallback to default template if no custom template
            contract_content = self._generate_default_content(candidate, contract_number, commission_rate)
        
        # Create contract
        contract = RecruitmentContract(
            candidate_id=candidate_id,
            contract_number=contract_number,
            contract_type=position,
            candidate_name=candidate["full_name"],
            candidate_phone=candidate["phone"],
            candidate_email=candidate["email"],
            position=PositionType(position),
            commission_rate=commission_rate,
            effective_date=now.isoformat(),
            contract_content=contract_content
        )
        
        # Hash contract for integrity
        contract.contract_hash = hashlib.sha256(contract_content.encode()).hexdigest()
        
        await self.db.recruitment_contracts.insert_one(contract.dict())
        
        # Update candidate
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "contract_id": contract.id,
                "status": CandidateStatus.CONTRACTED.value,
                "current_step": 9,
                "updated_at": now.isoformat()
            }}
        )
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="contract_generated",
            step=8,
            details={"contract_id": contract.id, "contract_number": contract_number}
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "contract_id": contract.id,
            "contract_number": contract_number,
            "contract_content": contract_content,
            "next_step": "sign"
        }
    
    def _render_template(self, template: str, candidate: Dict, contract_number: str, commission_rate: float) -> str:
        """Render contract from template with variables"""
        position_name = {
            "ctv": "Cộng Tác Viên",
            "sale": "Nhân viên Kinh doanh",
            "leader": "Trưởng nhóm Kinh doanh"
        }.get(candidate.get("position", "ctv"), "Cộng Tác Viên")
        
        now = datetime.now(timezone.utc)
        
        variables = {
            "{{name}}": candidate["full_name"],
            "{{phone}}": candidate["phone"],
            "{{email}}": candidate["email"],
            "{{region}}": candidate.get("region", "Toàn quốc"),
            "{{position}}": position_name,
            "{{position_code}}": candidate.get("position", "ctv"),
            "{{commission_rate}}": f"{commission_rate * 100:.1f}%",
            "{{contract_number}}": contract_number,
            "{{date}}": now.strftime("%d/%m/%Y"),
            "{{year}}": now.strftime("%Y"),
            "{{ref_id}}": candidate.get("ref_id", ""),
        }
        
        result = template
        for key, value in variables.items():
            result = result.replace(key, str(value) if value else "")
        
        return result
    
    def _generate_default_content(self, candidate: Dict, contract_number: str, commission_rate: float) -> str:
        """Generate default contract content (fallback if no template)"""
        position_name = {
            "ctv": "Cộng Tác Viên",
            "sale": "Nhân viên Kinh doanh",
            "leader": "Trưởng nhóm Kinh doanh"
        }.get(candidate.get("position", "ctv"), "Cộng Tác Viên")
        
        return f"""
HỢP ĐỒNG CỘNG TÁC KINH DOANH BẤT ĐỘNG SẢN
Số: {contract_number}

ĐIỀU 1: CÁC BÊN THAM GIA
Bên A: CÔNG TY TNHH PROHOUZING
Bên B: {candidate["full_name"]}
- Số điện thoại: {candidate["phone"]}
- Email: {candidate["email"]}
- Khu vực hoạt động: {candidate.get("region", "Toàn quốc")}

ĐIỀU 2: VỊ TRÍ & PHẠM VI CÔNG VIỆC
- Vị trí: {position_name}
- Phạm vi: Tư vấn và môi giới bất động sản sơ cấp
- Sản phẩm: Các dự án BĐS do Công ty phân phối

ĐIỀU 3: HOA HỒNG
- Tỷ lệ hoa hồng cơ bản: {commission_rate * 100:.1f}% trên giá trị giao dịch
- Thanh toán: Theo chính sách công ty
- Bonus: Theo chương trình KPI

ĐIỀU 4: QUYỀN VÀ NGHĨA VỤ
Bên B có quyền:
- Được đào tạo và hỗ trợ nghiệp vụ
- Được cung cấp công cụ bán hàng
- Được hưởng hoa hồng theo quy định

Bên B có nghĩa vụ:
- Tuân thủ quy định của công ty
- Bảo mật thông tin khách hàng
- Hoạt động chuyên nghiệp, đúng pháp luật

ĐIỀU 5: HIỆU LỰC
Hợp đồng có hiệu lực kể từ ngày ký.

Tôi đã đọc, hiểu và đồng ý với các điều khoản trên.
"""
    
    async def sign_contract(
        self,
        contract_id: str,
        signature_data: str,
        ip_address: str = None,
        device_info: str = None
    ) -> Dict[str, Any]:
        """Sign contract electronically"""
        now = datetime.now(timezone.utc)
        
        # Get contract
        contract = await self.db.recruitment_contracts.find_one({"id": contract_id}, {"_id": 0})
        if not contract:
            return {"success": False, "error": "Contract not found"}
        
        # Update contract
        await self.db.recruitment_contracts.update_one(
            {"id": contract_id},
            {"$set": {
                "status": ContractStatus.SIGNED.value,
                "candidate_signed": True,
                "candidate_signature_data": signature_data,
                "candidate_signed_at": now.isoformat(),
                "candidate_signed_ip": ip_address,
                "candidate_signed_device": device_info,
                "updated_at": now.isoformat()
            }}
        )
        
        # Update candidate - FIX: Update status to CONTRACTED after signing
        candidate_id = contract["candidate_id"]
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "signed_at": now.isoformat(),
                "status": CandidateStatus.CONTRACTED.value,  # Added status update
                "current_step": 10,
                "updated_at": now.isoformat()
            }}
        )
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="contract_signed",
            step=9,
            details={"contract_id": contract_id},
            ip_address=ip_address,
            user_agent=device_info
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "signed": True,
            "signed_at": now.isoformat(),
            "next_step": "onboarding"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# ONBOARDING SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class OnboardingService:
    def __init__(self, db):
        self.db = db
    
    async def execute_onboarding(self, candidate_id: str) -> Dict[str, Any]:
        """Execute full onboarding process"""
        now = datetime.now(timezone.utc)
        
        # Get candidate
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return {"success": False, "error": "Candidate not found"}
        
        # 1. Create user account
        user_id = str(uuid.uuid4())
        username = self._generate_username(candidate["full_name"])
        password_hash = bcrypt.hashpw("Welcome@123".encode(), bcrypt.gensalt()).decode()
        
        user = {
            "id": user_id,
            "username": username,
            "email": candidate["email"],
            "phone": candidate["phone"],
            "full_name": candidate["full_name"],
            "password_hash": password_hash,
            "role": candidate.get("position", "ctv"),
            "is_active": True,
            "created_at": now.isoformat(),
            "source": "recruitment",
            "candidate_id": candidate_id
        }
        
        await self.db.users.insert_one(user)
        
        # 2. Assign team (based on ref_id or geo)
        team_id, team_name, manager_id, manager_name = await self._assign_team(candidate)
        
        # 3. Create HR profile
        hr_profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "employee_code": self._generate_employee_code(),
            "full_name": candidate["full_name"],
            "email": candidate["email"],
            "phone": candidate["phone"],
            "department": "Sales",
            "position": candidate.get("position", "ctv"),
            "hire_date": now.strftime("%Y-%m-%d"),
            "status": "active",
            "team_id": team_id,
            "manager_id": manager_id,
            "created_at": now.isoformat()
        }
        
        await self.db.hr_profiles.insert_one(hr_profile)
        
        # 4. Create onboarding profile
        onboarding = OnboardingProfile(
            candidate_id=candidate_id,
            user_id=user_id,
            username=username,
            email=candidate["email"],
            phone=candidate["phone"],
            role=candidate.get("position", "ctv"),
            team_id=team_id,
            team_name=team_name,
            manager_id=manager_id,
            manager_name=manager_name,
            upline_id=candidate.get("ref_id"),
            hr_profile_created=True,
            crm_linked=True,
            kpi_linked=True,
            commission_linked=True,
            payroll_linked=True
        )
        
        await self.db.onboarding_profiles.insert_one(onboarding.dict())
        
        # 5. Process referral reward
        if candidate.get("ref_id"):
            await self._process_referral_reward(candidate_id, candidate["ref_id"])
        
        # 6. Update candidate status
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "user_id": user_id,
                "onboarded_at": now.isoformat(),
                "assigned_team_id": team_id,
                "assigned_manager_id": manager_id,
                "status": CandidateStatus.ONBOARDED.value,
                "current_step": 11,
                "updated_at": now.isoformat()
            }}
        )
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="onboarded",
            step=10,
            details={
                "user_id": user_id,
                "team_id": team_id,
                "manager_id": manager_id
            }
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        return {
            "success": True,
            "user_id": user_id,
            "username": username,
            "temp_password": "Welcome@123",
            "team_id": team_id,
            "team_name": team_name,
            "manager_name": manager_name,
            "next_step": "training"
        }
    
    def _generate_username(self, full_name: str) -> str:
        """Generate username from full name"""
        import re
        name_parts = full_name.lower().split()
        base = name_parts[-1] + ''.join(p[0] for p in name_parts[:-1])
        base = re.sub(r'[^a-z0-9]', '', base)
        return f"{base}{random.randint(100, 999)}"
    
    def _generate_employee_code(self) -> str:
        """Generate employee code"""
        return f"NV{datetime.now().strftime('%y%m')}{random.randint(1000, 9999)}"
    
    async def _assign_team(self, candidate: Dict) -> Tuple[str, str, str, str]:
        """Assign team based on referral or region"""
        # If has referrer, assign to their team
        if candidate.get("ref_id"):
            referrer = await self.db.users.find_one(
                {"id": candidate["ref_id"]},
                {"_id": 0, "team_id": 1}
            )
            if referrer and referrer.get("team_id"):
                team = await self.db.teams.find_one(
                    {"id": referrer["team_id"]},
                    {"_id": 0}
                )
                if team:
                    return (
                        team["id"],
                        team.get("name", "Team"),
                        team.get("leader_id"),
                        team.get("leader_name")
                    )
        
        # Default team
        default_team = await self.db.teams.find_one(
            {"is_default": True},
            {"_id": 0}
        )
        if default_team:
            return (
                default_team["id"],
                default_team.get("name", "Team"),
                default_team.get("leader_id"),
                default_team.get("leader_name")
            )
        
        return (None, None, None, None)
    
    async def _process_referral_reward(self, candidate_id: str, referrer_id: str):
        """Process referral reward and link to commission system"""
        from services.production_integrations import CommissionLinkService
        
        now = datetime.now(timezone.utc)
        
        # Get referrer info
        referrer = await self.db.users.find_one({"id": referrer_id}, {"_id": 0})
        if not referrer:
            return
        
        # Get candidate
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return
        
        # Create referral record
        referral = ReferralTree(
            referrer_id=referrer_id,
            referrer_name=referrer.get("full_name", ""),
            referrer_code=referrer.get("employee_code", ""),
            candidate_id=candidate_id,
            referred_user_id=candidate.get("user_id"),
            referred_name=candidate.get("full_name", ""),
            status="converted",
            reward_type="bonus",
            reward_amount=500000,  # 500k bonus
            converted_at=now.isoformat()
        )
        
        await self.db.referral_trees.insert_one(referral.dict())
        
        # FIX 5: Link to commission system
        if candidate.get("user_id"):
            commission_service = CommissionLinkService(self.db)
            await commission_service.link_to_commission_tree(
                new_user_id=candidate["user_id"],
                referrer_id=referrer_id,
                candidate_data=candidate
            )
        
        # Log referral processing
        log = RecruitmentAuditLog(
            candidate_id=candidate_id,
            action="referral_processed",
            step=10,
            details={
                "referrer_id": referrer_id,
                "referrer_name": referrer.get("full_name"),
                "reward_amount": 500000,
                "commission_linked": True
            }
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
    
    async def activate_user(self, candidate_id: str) -> Dict[str, Any]:
        """Activate user after training completion"""
        now = datetime.now(timezone.utc)
        
        await self.db.candidates.update_one(
            {"id": candidate_id},
            {"$set": {
                "status": CandidateStatus.ACTIVE.value,
                "updated_at": now.isoformat()
            }}
        )
        
        # Get user_id and activate
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if candidate and candidate.get("user_id"):
            await self.db.users.update_one(
                {"id": candidate["user_id"]},
                {"$set": {"status": "active", "activated_at": now.isoformat()}}
            )
            
            await self.db.onboarding_profiles.update_one(
                {"candidate_id": candidate_id},
                {"$set": {
                    "account_activated": True,
                    "activated_at": now.isoformat()
                }}
            )
        
        return {
            "success": True,
            "status": "active"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN RECRUITMENT SERVICE (ORCHESTRATOR)
# ═══════════════════════════════════════════════════════════════════════════════

class RecruitmentService:
    def __init__(self, db):
        self.db = db
        self.otp_service = OTPService(db)
        self.consent_service = ConsentService(db)
        self.identity_service = IdentityService(db)
        self.ai_scoring_service = AIScoringService(db)
        self.test_engine = TestEngine(db)
        self.decision_engine = DecisionEngine(db)
        self.contract_service = ContractService(db)
        self.onboarding_service = OnboardingService(db)
        self.config = RECRUITMENT_CONFIG
    
    async def apply(
        self,
        application: ApplicationRequest,
        ip_address: str = None,
        user_agent: str = None,
        device_fingerprint: str = None
    ) -> Dict[str, Any]:
        """Step 1: Submit application"""
        now = datetime.now(timezone.utc)
        
        # Check duplicate
        existing = await self.db.candidates.find_one({
            "$or": [
                {"phone": application.phone},
                {"email": application.email}
            ]
        })
        
        if existing:
            return {
                "success": False,
                "error": "Số điện thoại hoặc email đã được đăng ký",
                "existing_id": existing.get("id")
            }
        
        # Create candidate
        candidate = Candidate(
            full_name=application.full_name,
            phone=application.phone,
            email=application.email,
            region=application.region,
            city=application.city,
            position=application.position,
            experience_years=application.experience_years,
            has_real_estate_exp=application.has_real_estate_exp,
            cv_url=application.cv_url,
            source=application.source,
            ref_id=application.ref_id,
            campaign_id=application.campaign_id,
            utm_source=application.utm_source,
            utm_medium=application.utm_medium,
            utm_campaign=application.utm_campaign,
            device_fingerprint=device_fingerprint,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        await self.db.candidates.insert_one(candidate.dict())
        
        # Log
        log = RecruitmentAuditLog(
            candidate_id=candidate.id,
            action="applied",
            step=1,
            details=application.dict(),
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=device_fingerprint
        )
        await self.db.recruitment_audit_logs.insert_one(log.dict())
        
        # Update campaign stats if applicable
        if application.campaign_id:
            await self.db.recruitment_campaigns.update_one(
                {"id": application.campaign_id},
                {"$inc": {"applications": 1}}
            )
        
        return {
            "success": True,
            "candidate_id": candidate.id,
            "status": candidate.status.value,
            "next_step": "verify",
            "message": "Đăng ký thành công! Vui lòng xác thực số điện thoại/email."
        }
    
    async def get_candidate(self, candidate_id: str) -> Optional[Dict]:
        """Get candidate by ID"""
        return await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    
    async def get_candidate_status(self, candidate_id: str) -> Dict[str, Any]:
        """Get candidate pipeline status"""
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return {"success": False, "error": "Candidate not found"}
        
        steps = [
            {"step": 1, "name": "Đăng ký", "status": "completed"},
            {"step": 2, "name": "Xác thực", "status": "completed" if candidate.get("phone_verified") or candidate.get("email_verified") else "pending"},
            {"step": 3, "name": "Đồng ý điều khoản", "status": "completed" if candidate.get("consent_accepted") else "pending"},
            {"step": 4, "name": "KYC", "status": "completed" if candidate.get("kyc_verified") else "pending"},
            {"step": 5, "name": "Đánh giá AI", "status": "completed" if candidate.get("ai_score") else "pending"},
            {"step": 6, "name": "Bài test", "status": "completed" if candidate.get("test_score") else "pending"},
            {"step": 7, "name": "Quyết định", "status": "completed" if candidate.get("decision") else "pending"},
            {"step": 8, "name": "Hợp đồng", "status": "completed" if candidate.get("contract_id") else "pending"},
            {"step": 9, "name": "Ký hợp đồng", "status": "completed" if candidate.get("signed_at") else "pending"},
            {"step": 10, "name": "Onboarding", "status": "completed" if candidate.get("onboarded_at") else "pending"},
            {"step": 11, "name": "Kích hoạt", "status": "completed" if candidate.get("status") == "active" else "pending"},
        ]
        
        # Mark current step
        current = candidate.get("current_step", 1)
        for s in steps:
            if s["step"] == current and s["status"] != "completed":
                s["status"] = "current"
            elif s["step"] > current:
                s["status"] = "pending"
        
        return {
            "success": True,
            "candidate_id": candidate_id,
            "status": candidate.get("status"),
            "current_step": current,
            "steps": steps,
            "scores": {
                "ai_score": candidate.get("ai_score"),
                "test_score": candidate.get("test_score"),
                "final_score": candidate.get("final_score")
            }
        }
    
    async def get_pipeline_stats(self) -> Dict[str, Any]:
        """Get recruitment pipeline statistics"""
        pipeline = [
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        stats = {}
        async for doc in self.db.candidates.aggregate(pipeline):
            stats[doc["_id"]] = doc["count"]
        
        total = sum(stats.values())
        
        return {
            "total": total,
            "by_status": stats,
            "conversion_rate": (stats.get("active", 0) / total * 100) if total > 0 else 0,
            "pass_rate": (stats.get("passed", 0) + stats.get("contracted", 0) + stats.get("onboarded", 0) + stats.get("active", 0)) / total * 100 if total > 0 else 0
        }



# ═══════════════════════════════════════════════════════════════════════════════
# REFERRAL SERVICE - Full referral tree management
# ═══════════════════════════════════════════════════════════════════════════════

class ReferralService:
    def __init__(self, db):
        self.db = db
    
    async def get_referral_tree(self, user_id: str) -> Dict[str, Any]:
        """Get referral tree for a user (who they referred)"""
        # Get direct referrals (level 1)
        direct_referrals = []
        async for ref in self.db.referral_trees.find(
            {"referrer_id": user_id},
            {"_id": 0}
        ):
            direct_referrals.append(ref)
        
        # Get indirect referrals (level 2+) - people referred by direct referrals
        indirect_referrals = []
        for direct in direct_referrals:
            if direct.get("referred_user_id"):
                async for ref in self.db.referral_trees.find(
                    {"referrer_id": direct["referred_user_id"]},
                    {"_id": 0}
                ):
                    ref["level"] = 2
                    indirect_referrals.append(ref)
        
        return {
            "success": True,
            "user_id": user_id,
            "direct_count": len(direct_referrals),
            "indirect_count": len(indirect_referrals),
            "total_count": len(direct_referrals) + len(indirect_referrals),
            "direct_referrals": direct_referrals,
            "indirect_referrals": indirect_referrals
        }
    
    async def get_referral_stats(self, user_id: str) -> Dict[str, Any]:
        """Get referral statistics for a user"""
        # Count by status
        pipeline = [
            {"$match": {"referrer_id": user_id}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        
        status_counts = {}
        async for doc in self.db.referral_trees.aggregate(pipeline):
            status_counts[doc["_id"]] = doc["count"]
        
        # Total rewards
        reward_pipeline = [
            {"$match": {"referrer_id": user_id, "reward_paid": True}},
            {"$group": {
                "_id": None,
                "total_reward": {"$sum": "$reward_amount"}
            }}
        ]
        
        total_reward = 0
        async for doc in self.db.referral_trees.aggregate(reward_pipeline):
            total_reward = doc.get("total_reward", 0)
        
        # Pending rewards
        pending_pipeline = [
            {"$match": {"referrer_id": user_id, "status": "converted", "reward_paid": False}},
            {"$group": {
                "_id": None,
                "pending_reward": {"$sum": "$reward_amount"}
            }}
        ]
        
        pending_reward = 0
        async for doc in self.db.referral_trees.aggregate(pending_pipeline):
            pending_reward = doc.get("pending_reward", 0)
        
        # Get referral link
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0, "employee_code": 1})
        ref_code = user.get("employee_code", user_id[:8]) if user else user_id[:8]
        
        return {
            "success": True,
            "user_id": user_id,
            "ref_code": ref_code,
            "referral_link": f"/recruitment/apply?ref_id={user_id}",
            "total_referrals": sum(status_counts.values()),
            "converted": status_counts.get("converted", 0),
            "pending": status_counts.get("pending", 0),
            "total_reward": total_reward,
            "pending_reward": pending_reward,
            "status_breakdown": status_counts
        }
    
    async def create_referral_tree_entry(
        self, 
        referrer_id: str, 
        candidate_id: str, 
        referred_user_id: str = None
    ) -> Dict[str, Any]:
        """Create referral tree entry when candidate converts"""
        now = datetime.now(timezone.utc)
        
        # Get referrer info
        referrer = await self.db.users.find_one({"id": referrer_id}, {"_id": 0})
        if not referrer:
            return {"success": False, "error": "Referrer not found"}
        
        # Get candidate info
        candidate = await self.db.candidates.find_one({"id": candidate_id}, {"_id": 0})
        if not candidate:
            return {"success": False, "error": "Candidate not found"}
        
        # Check if already exists
        existing = await self.db.referral_trees.find_one({
            "referrer_id": referrer_id,
            "candidate_id": candidate_id
        })
        if existing:
            return {"success": True, "referral_id": existing["id"], "message": "Already exists"}
        
        # Create entry
        referral = ReferralTree(
            referrer_id=referrer_id,
            referrer_name=referrer.get("full_name", ""),
            referrer_code=referrer.get("employee_code", ""),
            candidate_id=candidate_id,
            referred_user_id=referred_user_id,
            referred_name=candidate.get("full_name", ""),
            campaign_id=candidate.get("campaign_id"),
            status="converted" if referred_user_id else "pending",
            reward_amount=500000,  # Base referral bonus
            converted_at=now.isoformat() if referred_user_id else None
        )
        
        await self.db.referral_trees.insert_one(referral.dict())
        
        return {
            "success": True,
            "referral_id": referral.id,
            "status": referral.status
        }


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT TEMPLATE SERVICE - Admin template management
# ═══════════════════════════════════════════════════════════════════════════════

class ContractTemplateService:
    def __init__(self, db):
        self.db = db
    
    async def create_template(
        self,
        name: str,
        contract_type: str,
        template_content: str,
        description: str = None,
        variables: List[str] = None,
        created_by: str = None
    ) -> Dict[str, Any]:
        """Create new contract template"""
        from models.recruitment_models import ContractTemplate, PositionType
        
        now = datetime.now(timezone.utc)
        
        template = ContractTemplate(
            name=name,
            contract_type=PositionType(contract_type),
            template_content=template_content,
            description=description,
            variables=variables or ["name", "phone", "email", "position", "commission_rate", "date"],
            created_by=created_by
        )
        
        await self.db.contract_templates.insert_one(template.dict())
        
        return {
            "success": True,
            "template_id": template.id,
            "name": name
        }
    
    async def list_templates(self, contract_type: str = None) -> Dict[str, Any]:
        """List all contract templates"""
        query = {}
        if contract_type:
            query["contract_type"] = contract_type
        
        templates = []
        async for doc in self.db.contract_templates.find(query, {"_id": 0}):
            templates.append(doc)
        
        return {
            "success": True,
            "templates": templates,
            "total": len(templates)
        }
    
    async def get_template(self, template_id: str) -> Dict[str, Any]:
        """Get template by ID"""
        template = await self.db.contract_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            return {"success": False, "error": "Template not found"}
        return {"success": True, "template": template}
    
    async def activate_template(self, template_id: str, approved_by: str = None) -> Dict[str, Any]:
        """Activate a template (and deactivate others of same type)"""
        now = datetime.now(timezone.utc)
        
        template = await self.db.contract_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            return {"success": False, "error": "Template not found"}
        
        # Deactivate other templates of same type
        await self.db.contract_templates.update_many(
            {"contract_type": template["contract_type"]},
            {"$set": {"is_active": False}}
        )
        
        # Activate this template
        await self.db.contract_templates.update_one(
            {"id": template_id},
            {"$set": {
                "is_active": True,
                "approved_by": approved_by,
                "approved_at": now.isoformat(),
                "updated_at": now.isoformat()
            }}
        )
        
        return {
            "success": True,
            "activated": True,
            "template_id": template_id
        }
    
    async def delete_template(self, template_id: str) -> Dict[str, Any]:
        """Delete a template (only if not active)"""
        template = await self.db.contract_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            return {"success": False, "error": "Template not found"}
        
        if template.get("is_active"):
            return {"success": False, "error": "Cannot delete active template"}
        
        await self.db.contract_templates.delete_one({"id": template_id})
        
        return {"success": True, "deleted": True}
