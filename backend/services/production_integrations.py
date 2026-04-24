"""
Production Integrations - Phase 3.5 PRODUCTION 10/10
- Resend Email for OTP
- AI Scoring via Emergent LLM
- QR Code Generation
"""

import os
import asyncio
import logging
import hashlib
import io
import base64
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# QR Code
try:
    import qrcode
    from qrcode.image.svg import SvgImage
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False

# Resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

# Emergent LLM
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# RESEND EMAIL SERVICE - OTP PRODUCTION
# ═══════════════════════════════════════════════════════════════════════════════

class ResendEmailService:
    """Production email service using Resend API"""
    
    def __init__(self):
        self.api_key = os.environ.get("RESEND_API_KEY")
        # Production email: noreply@prohouzing.com
        self.sender_email = os.environ.get("EMAIL_FROM", "noreply@prohouzing.com")
        self.is_configured = bool(self.api_key) and RESEND_AVAILABLE
        
        if self.is_configured:
            resend.api_key = self.api_key
    
    async def send_otp_email(self, to_email: str, otp: str, candidate_name: str = None) -> Dict[str, Any]:
        """Send OTP verification email"""
        if not self.is_configured:
            logger.warning(f"[EMAIL DEV] OTP to {to_email} (Resend not configured)")
            return {"success": True, "dev_mode": True, "message": "Dev mode - no email sent"}
        
        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f9fafb;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <img src="https://app.prohouzing.com/logo.png" alt="ProHouzing" style="height: 40px; margin-bottom: 12px;" />
                    <h1 style="color: #2563eb; margin: 0; font-size: 24px;">ProHouzing</h1>
                    <p style="color: #6b7280; margin: 8px 0 0;">Hệ thống tuyển dụng tự động</p>
                </div>
                
                <p style="color: #374151; margin: 0 0 16px;">
                    {f'Xin chào {candidate_name},' if candidate_name else 'Xin chào,'}
                </p>
                
                <p style="color: #374151; margin: 0 0 24px;">
                    Mã xác thực đăng ký ProHouzing của bạn là:
                </p>
                
                <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: monospace;">
                        {otp}
                    </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
                    ⏱ Mã có hiệu lực trong <strong>5 phút</strong>
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    🔒 Không chia sẻ mã này với bất kỳ ai
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © 2026 ProHouzing JSC. Mọi quyền được bảo lưu.
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">
                    Email này được gửi từ <a href="https://prohouzing.com" style="color: #3b82f6;">prohouzing.com</a>
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">
                    Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
                </p>
            </div>
        </div>
        """
        
        params = {
            "from": f"ProHouzing <{self.sender_email}>",
            "to": [to_email],
            "subject": "Mã xác thực đăng ký ProHouzing",
            "html": html_content
        }
        
        try:
            result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"[EMAIL] OTP sent to {to_email}, id={result.get('id')}")
            return {
                "success": True,
                "email_id": result.get("id"),
                "message": f"OTP sent to {to_email}"
            }
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# ═══════════════════════════════════════════════════════════════════════════════
# AI SCORING SERVICE - PRODUCTION LLM
# ═══════════════════════════════════════════════════════════════════════════════

class AIScoreService:
    """Production AI scoring using Emergent LLM"""
    
    def __init__(self):
        self.api_key = os.environ.get("EMERGENT_LLM_KEY")
        self.is_configured = bool(self.api_key) and LLM_AVAILABLE
        self.dev_mode = os.environ.get("RECRUITMENT_DEV_MODE", "true").lower() == "true"
    
    async def score_candidate(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Score candidate using AI"""
        
        # If dev mode or not configured, use mock scoring
        if self.dev_mode or not self.is_configured:
            return self._mock_scoring(candidate_data)
        
        try:
            # Build prompt
            prompt = self._build_scoring_prompt(candidate_data)
            
            # Initialize LLM
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"scoring-{candidate_data.get('id', 'unknown')}",
                system_message="""Bạn là chuyên gia tuyển dụng bất động sản. Đánh giá ứng viên và trả về JSON với format:
{
    "score": <số từ 0-100>,
    "fit_type": <"high_potential" | "average" | "low_fit">,
    "risk": <số từ 0-100>,
    "strengths": [<danh sách điểm mạnh>],
    "concerns": [<danh sách lo ngại>],
    "recommended_position": <"ctv" | "sale" | "leader">
}
Chỉ trả về JSON, không giải thích."""
            ).with_model("openai", "gpt-5.2")
            
            # Send message
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse response
            import json
            try:
                result = json.loads(response)
                return {
                    "success": True,
                    "ai_powered": True,
                    "overall_score": result.get("score", 70),
                    "fit_type": result.get("fit_type", "average"),
                    "risk_score": result.get("risk", 30),
                    "strengths": result.get("strengths", []),
                    "concerns": result.get("concerns", []),
                    "recommended_position": result.get("recommended_position", "ctv")
                }
            except json.JSONDecodeError:
                logger.warning(f"AI response not JSON: {response[:100]}")
                return self._mock_scoring(candidate_data)
                
        except Exception as e:
            logger.error(f"AI scoring error: {e}")
            return self._mock_scoring(candidate_data)
    
    def _build_scoring_prompt(self, candidate: Dict) -> str:
        """Build scoring prompt from candidate data"""
        return f"""Đánh giá ứng viên sau:

- Họ tên: {candidate.get('full_name', 'N/A')}
- Vị trí ứng tuyển: {candidate.get('position', 'ctv')}
- Kinh nghiệm: {candidate.get('experience_years', 0)} năm
- Có kinh nghiệm BĐS: {'Có' if candidate.get('has_real_estate_exp') else 'Không'}
- Khu vực: {candidate.get('region', 'N/A')}
- Nguồn: {candidate.get('source', 'direct')}

Yêu cầu vị trí:
- CTV: Cần nhiệt tình, không cần kinh nghiệm
- Sale: Cần 1-2 năm kinh nghiệm, kỹ năng giao tiếp
- Leader: Cần 3+ năm, khả năng lãnh đạo

Đánh giá và cho điểm."""
    
    def _mock_scoring(self, candidate: Dict) -> Dict[str, Any]:
        """Mock scoring for dev mode"""
        experience = candidate.get("experience_years", 0)
        has_re_exp = candidate.get("has_real_estate_exp", False)
        position = candidate.get("position", "ctv")
        
        # Base score calculation
        base_score = 50
        
        # Experience bonus
        base_score += min(experience * 8, 30)
        
        # Real estate experience bonus
        if has_re_exp:
            base_score += 15
        
        # Position fit
        position_requirements = {"ctv": 0, "sale": 1, "leader": 3}
        required_exp = position_requirements.get(position, 0)
        if experience >= required_exp:
            base_score += 10
        
        # Cap score
        score = min(max(base_score, 30), 95)
        
        # Determine fit type
        if score >= 80:
            fit_type = "high_potential"
        elif score >= 60:
            fit_type = "average"
        else:
            fit_type = "low_fit"
        
        # Risk calculation
        risk = max(10, 100 - score - 10)
        
        return {
            "success": True,
            "ai_powered": False,
            "mock_mode": True,
            "overall_score": score,
            "fit_type": fit_type,
            "risk_score": risk,
            "strengths": [s for s in [
                "Đã nộp đơn chủ động" if candidate.get("source") == "direct" else "Có người giới thiệu",
                f"{experience} năm kinh nghiệm" if experience > 0 else "Nhiệt tình, sẵn sàng học hỏi"
            ] if s],
            "concerns": [c for c in [
                "Chưa có kinh nghiệm BĐS" if not has_re_exp else None,
                "Cần đào tạo thêm" if experience < 2 else None
            ] if c],
            "recommended_position": position
        }


# ═══════════════════════════════════════════════════════════════════════════════
# QR CODE SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class QRCodeService:
    """Generate QR codes for recruitment links"""
    
    def __init__(self, base_url: str = None):
        # PRODUCTION: Default to app.prohouzing.com
        self.base_url = base_url or os.environ.get("FRONTEND_URL", "https://app.prohouzing.com")
        self.is_available = QR_AVAILABLE
    
    def generate_apply_link(
        self, 
        ref_id: str = None, 
        campaign_id: str = None,
        utm_source: str = None,
        utm_medium: str = None
    ) -> str:
        """Generate apply link with tracking params"""
        path = "/recruitment/apply"
        params = []
        
        if ref_id:
            params.append(f"ref_id={ref_id}")
        if campaign_id:
            params.append(f"campaign_id={campaign_id}")
        if utm_source:
            params.append(f"utm_source={utm_source}")
        if utm_medium:
            params.append(f"utm_medium={utm_medium}")
        
        query = "&".join(params)
        url = f"{self.base_url}{path}"
        if query:
            url += f"?{query}"
        
        return url
    
    def generate_qr_code(
        self,
        data: str,
        format: str = "png",
        size: int = 10,
        border: int = 2
    ) -> Dict[str, Any]:
        """Generate QR code image"""
        if not self.is_available:
            return {
                "success": False,
                "error": "QR code library not available",
                "url": data
            }
        
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=size,
                border=border
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            if format.lower() == "svg":
                img = qr.make_image(image_factory=SvgImage)
                buffer = io.BytesIO()
                img.save(buffer)
                buffer.seek(0)
                svg_data = buffer.getvalue().decode('utf-8')
                return {
                    "success": True,
                    "format": "svg",
                    "data": svg_data,
                    "url": data
                }
            else:
                img = qr.make_image(fill_color="black", back_color="white")
                buffer = io.BytesIO()
                img.save(buffer, format="PNG")
                buffer.seek(0)
                png_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                return {
                    "success": True,
                    "format": "png",
                    "data": f"data:image/png;base64,{png_base64}",
                    "url": data
                }
                
        except Exception as e:
            logger.error(f"QR generation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "url": data
            }
    
    def generate_apply_qr(
        self,
        ref_id: str = None,
        campaign_id: str = None,
        format: str = "png"
    ) -> Dict[str, Any]:
        """Generate QR code for apply link"""
        url = self.generate_apply_link(ref_id, campaign_id)
        result = self.generate_qr_code(url, format)
        result["apply_url"] = url
        result["ref_id"] = ref_id
        result["campaign_id"] = campaign_id
        return result


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION LINK SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionLinkService:
    """Link new users to commission system"""
    
    def __init__(self, db):
        self.db = db
    
    async def link_to_commission_tree(
        self,
        new_user_id: str,
        referrer_id: str,
        candidate_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Link new user to referrer's commission tree"""
        now = datetime.now(timezone.utc)
        
        # Get referrer info
        referrer = await self.db.users.find_one({"id": referrer_id}, {"_id": 0})
        if not referrer:
            logger.warning(f"Referrer {referrer_id} not found for commission link")
            return {"success": False, "error": "Referrer not found"}
        
        # Create commission tree entry
        tree_entry = {
            "id": str(hashlib.md5(f"{new_user_id}-{referrer_id}".encode()).hexdigest()),
            "user_id": new_user_id,
            "parent_id": referrer_id,
            "referrer_name": referrer.get("full_name", ""),
            "referred_name": candidate_data.get("full_name", ""),
            "level": 1,  # Direct referral
            "position": candidate_data.get("position", "ctv"),
            "commission_rate": self._get_commission_rate(candidate_data.get("position", "ctv")),
            "status": "active",
            "created_at": now.isoformat(),
            "activated_at": now.isoformat()
        }
        
        # Store in commission_tree collection
        await self.db.commission_trees.update_one(
            {"user_id": new_user_id},
            {"$set": tree_entry},
            upsert=True
        )
        
        # Update referrer's stats
        await self.db.users.update_one(
            {"id": referrer_id},
            {"$inc": {"total_referrals": 1}}
        )
        
        # Log
        log_entry = {
            "action": "commission_linked",
            "user_id": new_user_id,
            "referrer_id": referrer_id,
            "timestamp": now.isoformat(),
            "details": {
                "position": candidate_data.get("position"),
                "commission_rate": tree_entry["commission_rate"]
            }
        }
        await self.db.recruitment_audit_logs.insert_one(log_entry)
        
        logger.info(f"Commission tree linked: {new_user_id} -> {referrer_id}")
        
        return {
            "success": True,
            "tree_entry_id": tree_entry["id"],
            "parent_id": referrer_id,
            "commission_rate": tree_entry["commission_rate"]
        }
    
    def _get_commission_rate(self, position: str) -> float:
        """Get commission rate based on position"""
        rates = {
            "ctv": 0.30,
            "sale": 0.40,
            "leader": 0.50,
            "manager": 0.60
        }
        return rates.get(position, 0.30)


# ═══════════════════════════════════════════════════════════════════════════════
# FUNNEL BACKFILL SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class FunnelBackfillService:
    """Backfill funnel data for candidates at higher statuses"""
    
    # Status progression order
    STATUS_ORDER = [
        "applied",
        "verified", 
        "consented",
        "kyc_verified",
        "screened",
        "tested",
        "passed",
        "contracted",
        "onboarded",
        "active"
    ]
    
    def __init__(self, db):
        self.db = db
    
    async def backfill_candidate_history(self, candidate_id: str, current_status: str) -> Dict[str, Any]:
        """Backfill status history for candidate"""
        now = datetime.now(timezone.utc)
        
        if current_status not in self.STATUS_ORDER:
            return {"success": False, "error": f"Invalid status: {current_status}"}
        
        current_index = self.STATUS_ORDER.index(current_status)
        
        # Get all previous statuses
        previous_statuses = self.STATUS_ORDER[:current_index + 1]
        
        # Create history entries for each status
        history_entries = []
        for i, status in enumerate(previous_statuses):
            entry = {
                "candidate_id": candidate_id,
                "status": status,
                "step": i + 1,
                "timestamp": now.isoformat(),
                "backfilled": True
            }
            history_entries.append(entry)
        
        # Store history
        if history_entries:
            await self.db.candidate_status_history.insert_many(history_entries)
        
        return {
            "success": True,
            "backfilled_count": len(history_entries),
            "statuses": previous_statuses
        }
    
    async def get_accurate_funnel_counts(self) -> Dict[str, int]:
        """Get accurate funnel counts including backfill logic"""
        counts = {}
        
        for status in self.STATUS_ORDER:
            # Count candidates that have reached OR passed this status
            status_index = self.STATUS_ORDER.index(status)
            valid_statuses = self.STATUS_ORDER[status_index:]
            
            count = await self.db.candidates.count_documents({
                "status": {"$in": valid_statuses}
            })
            counts[status] = count
        
        return counts


# Singleton instances
_email_service = None
_ai_service = None
_qr_service = None

def get_email_service() -> ResendEmailService:
    global _email_service
    if _email_service is None:
        _email_service = ResendEmailService()
    return _email_service

def get_ai_service() -> AIScoreService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIScoreService()
    return _ai_service

def get_qr_service(base_url: str = None) -> QRCodeService:
    global _qr_service
    if _qr_service is None:
        _qr_service = QRCodeService(base_url)
    return _qr_service
