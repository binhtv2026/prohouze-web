"""
Email Content Engine - AI-powered email content generation
"""

import os
import logging
import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

from models.email_automation_models import (
    EmailTemplate, EmailDraft, EmailDraftStatus
)

logger = logging.getLogger(__name__)


class EmailContentEngine:
    """
    AI Content Engine - Generate personalized email content
    Features:
    - Template rendering with variables
    - AI-powered personalization
    - Multi-language support
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.api_key = os.environ.get("EMERGENT_LLM_KEY")
        self.is_ai_enabled = bool(self.api_key) and LLM_AVAILABLE
    
    def _render_template(self, template: str, variables: Dict[str, Any]) -> str:
        """Render template with variables using {{variable}} syntax"""
        result = template
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            result = result.replace(placeholder, str(value) if value else "")
        return result
    
    async def generate_content(
        self,
        template_id: Optional[str] = None,
        event_type: Optional[str] = None,
        recipient_email: str = "",
        recipient_name: Optional[str] = None,
        user_id: Optional[str] = None,
        variables: Dict[str, Any] = None,
        use_ai: bool = True
    ) -> Dict[str, Any]:
        """
        Generate email content from template with optional AI enhancement
        """
        now = datetime.now(timezone.utc).isoformat()
        variables = variables or {}
        
        # Add common variables
        variables.setdefault("name", recipient_name or "")
        variables.setdefault("email", recipient_email)
        variables.setdefault("date", datetime.now(timezone.utc).strftime("%d/%m/%Y"))
        variables.setdefault("year", datetime.now(timezone.utc).strftime("%Y"))
        
        # Get template
        template = None
        if template_id:
            template = await self.db.email_templates.find_one({"id": template_id}, {"_id": 0})
        
        if not template and event_type:
            # Find template by event type
            template = await self.db.email_templates.find_one(
                {"is_active": True, "name": {"$regex": event_type, "$options": "i"}},
                {"_id": 0}
            )
        
        if not template:
            # Use default template
            template = {
                "id": "default",
                "name": "Default Template",
                "subject_template": "Thông báo từ ProHouzing - {{subject}}",
                "body_template": """
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">ProHouzing</h1>
    <p>Xin chào {{name}},</p>
    <p>{{content}}</p>
    <p>Trân trọng,<br/>ProHouzing Team</p>
</div>
""",
                "variables": ["name", "subject", "content"],
                "enable_ai_personalization": True,
                "ai_tone": "professional"
            }
        
        # Render basic template
        subject = self._render_template(template.get("subject_template", ""), variables)
        body = self._render_template(template.get("body_template", ""), variables)
        
        # AI Enhancement
        ai_enhanced = False
        if use_ai and self.is_ai_enabled and template.get("enable_ai_personalization"):
            try:
                enhanced = await self._ai_enhance_content(
                    subject=subject,
                    body=body,
                    recipient_name=recipient_name,
                    tone=template.get("ai_tone", "professional"),
                    context=variables
                )
                if enhanced.get("success"):
                    subject = enhanced.get("subject", subject)
                    body = enhanced.get("body", body)
                    ai_enhanced = True
            except Exception as e:
                logger.warning(f"[CONTENT] AI enhancement failed: {e}")
        
        # Create draft
        draft = EmailDraft(
            template_id=template.get("id"),
            recipient_email=recipient_email,
            recipient_type="single",
            subject=subject,
            content=body,
            ai_generated=ai_enhanced,
            status=EmailDraftStatus.DRAFT,
            created_at=now,
            updated_at=now
        )
        
        # Store draft
        await self.db.email_drafts.insert_one(draft.dict())
        
        return {
            "success": True,
            "draft_id": draft.id,
            "subject": subject,
            "content": body,
            "ai_enhanced": ai_enhanced,
            "template_id": template.get("id"),
            "requires_approval": template.get("requires_approval", False)
        }
    
    async def _ai_enhance_content(
        self,
        subject: str,
        body: str,
        recipient_name: Optional[str],
        tone: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Use AI to enhance email content"""
        if not self.is_ai_enabled:
            return {"success": False, "error": "AI not available"}
        
        system_prompt = f"""Bạn là chuyên gia viết email marketing và vận hành cho ProHouzing.
        
NHIỆM VỤ: Cải thiện email cho cá nhân hóa và hấp dẫn hơn.

TONE: {tone}
- professional: Chuyên nghiệp, lịch sự
- friendly: Thân thiện, gần gũi
- formal: Trang trọng, chính thức

QUY TẮC:
- Giữ nguyên thông tin quan trọng
- Cá nhân hóa nếu có tên người nhận
- Ngắn gọn, rõ ràng
- Thêm CTA nếu phù hợp
- Trả về JSON với format: {{"subject": "...", "body": "..."}}"""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"email-content-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
            
            user_message = f"""
Cải thiện email sau:

SUBJECT: {subject}

BODY:
{body}

NGƯỜI NHẬN: {recipient_name or "Không có tên"}
CONTEXT: {json.dumps(context, ensure_ascii=False)}

Trả về JSON với subject và body đã cải thiện.
"""
            
            response = await chat.send_message(UserMessage(text=user_message))
            
            # Parse JSON response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group())
                return {
                    "success": True,
                    "subject": result.get("subject", subject),
                    "body": result.get("body", body)
                }
            
            return {"success": False, "error": "Could not parse AI response"}
            
        except Exception as e:
            logger.error(f"[CONTENT] AI error: {e}")
            return {"success": False, "error": str(e)}
    
    async def regenerate_with_ai(
        self,
        draft_id: str,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Regenerate draft content with AI using custom prompt"""
        draft = await self.db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
        if not draft:
            return {"success": False, "error": "Draft not found"}
        
        if not self.is_ai_enabled:
            return {"success": False, "error": "AI not available"}
        
        prompt = custom_prompt or "Viết lại email này hấp dẫn và cá nhân hóa hơn"
        
        system_prompt = f"""Bạn là chuyên gia viết email cho ProHouzing.
Viết lại email theo yêu cầu: {prompt}
Trả về JSON: {{"subject": "...", "body": "..."}}"""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"email-regen-{draft_id}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
            
            response = await chat.send_message(UserMessage(
                text=f"Email gốc:\nSubject: {draft.get('subject')}\nBody: {draft.get('content')}"
            ))
            
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group())
                
                now = datetime.now(timezone.utc).isoformat()
                await self.db.email_drafts.update_one(
                    {"id": draft_id},
                    {
                        "$set": {
                            "subject": result.get("subject", draft.get("subject")),
                            "content": result.get("body", draft.get("content")),
                            "ai_generated": True,
                            "ai_prompt_used": prompt,
                            "updated_at": now
                        }
                    }
                )
                
                return {
                    "success": True,
                    "draft_id": draft_id,
                    "subject": result.get("subject"),
                    "content": result.get("body")
                }
            
            return {"success": False, "error": "Could not parse AI response"}
            
        except Exception as e:
            logger.error(f"[CONTENT] Regeneration error: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_draft(self, draft_id: str) -> Optional[Dict]:
        """Get draft by ID"""
        return await self.db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
    
    async def list_drafts(
        self,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """List drafts with optional status filter"""
        query = {}
        if status:
            query["status"] = status
        
        drafts = await self.db.email_drafts.find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return drafts
