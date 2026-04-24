"""
Email Approval Engine - Workflow for marketing emails
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.email_automation_models import (
    EmailDraft, EmailDraftStatus, EmailTemplateType
)

logger = logging.getLogger(__name__)


class EmailApprovalEngine:
    """
    Approval Engine - Manage approval workflow for emails
    Features:
    - Draft -> Pending -> Approved flow
    - Role-based approval
    - Approval history
    - Auto-approval for system emails
    """
    
    # Templates that require approval
    REQUIRES_APPROVAL = [EmailTemplateType.MARKETING]
    
    # Templates that auto-approve
    AUTO_APPROVE = [EmailTemplateType.SYSTEM, EmailTemplateType.OPERATION]
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def submit_for_approval(self, draft_id: str, submitted_by: str) -> Dict[str, Any]:
        """
        Submit draft for approval
        """
        draft = await self.db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
        if not draft:
            return {"success": False, "error": "Draft not found"}
        
        if draft.get("status") != EmailDraftStatus.DRAFT.value:
            return {"success": False, "error": f"Cannot submit draft in status: {draft.get('status')}"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if template requires approval
        template = None
        if draft.get("template_id"):
            template = await self.db.email_templates.find_one(
                {"id": draft.get("template_id")},
                {"_id": 0}
            )
        
        requires_approval = template.get("requires_approval", False) if template else True
        
        if not requires_approval:
            # Auto-approve
            await self.db.email_drafts.update_one(
                {"id": draft_id},
                {
                    "$set": {
                        "status": EmailDraftStatus.APPROVED.value,
                        "approved_by": "system",
                        "approved_at": now,
                        "updated_at": now
                    }
                }
            )
            
            # Log approval
            await self._log_approval_action(draft_id, "auto_approved", "system", "Auto-approved (system/operation email)")
            
            return {
                "success": True,
                "draft_id": draft_id,
                "status": EmailDraftStatus.APPROVED.value,
                "auto_approved": True
            }
        
        # Set to pending
        await self.db.email_drafts.update_one(
            {"id": draft_id},
            {
                "$set": {
                    "status": EmailDraftStatus.PENDING.value,
                    "updated_at": now
                }
            }
        )
        
        # Log submission
        await self._log_approval_action(draft_id, "submitted", submitted_by)
        
        # Notify approvers (would integrate with notification system)
        await self._notify_approvers(draft)
        
        return {
            "success": True,
            "draft_id": draft_id,
            "status": EmailDraftStatus.PENDING.value,
            "auto_approved": False
        }
    
    async def approve(self, draft_id: str, approved_by: str, comment: Optional[str] = None) -> Dict[str, Any]:
        """
        Approve a pending draft
        """
        draft = await self.db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
        if not draft:
            return {"success": False, "error": "Draft not found"}
        
        if draft.get("status") != EmailDraftStatus.PENDING.value:
            return {"success": False, "error": f"Cannot approve draft in status: {draft.get('status')}"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db.email_drafts.update_one(
            {"id": draft_id},
            {
                "$set": {
                    "status": EmailDraftStatus.APPROVED.value,
                    "approved_by": approved_by,
                    "approved_at": now,
                    "updated_at": now
                }
            }
        )
        
        # Log approval
        await self._log_approval_action(draft_id, "approved", approved_by, comment)
        
        logger.info(f"[APPROVAL] Draft {draft_id} approved by {approved_by}")
        
        return {
            "success": True,
            "draft_id": draft_id,
            "status": EmailDraftStatus.APPROVED.value,
            "approved_by": approved_by,
            "approved_at": now
        }
    
    async def reject(self, draft_id: str, rejected_by: str, reason: str) -> Dict[str, Any]:
        """
        Reject a pending draft
        """
        draft = await self.db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
        if not draft:
            return {"success": False, "error": "Draft not found"}
        
        if draft.get("status") != EmailDraftStatus.PENDING.value:
            return {"success": False, "error": f"Cannot reject draft in status: {draft.get('status')}"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db.email_drafts.update_one(
            {"id": draft_id},
            {
                "$set": {
                    "status": EmailDraftStatus.REJECTED.value,
                    "rejected_by": rejected_by,
                    "rejected_reason": reason,
                    "updated_at": now
                }
            }
        )
        
        # Log rejection
        await self._log_approval_action(draft_id, "rejected", rejected_by, reason)
        
        # Notify creator
        await self._notify_rejection(draft, rejected_by, reason)
        
        logger.info(f"[APPROVAL] Draft {draft_id} rejected by {rejected_by}: {reason}")
        
        return {
            "success": True,
            "draft_id": draft_id,
            "status": EmailDraftStatus.REJECTED.value,
            "rejected_by": rejected_by,
            "reason": reason
        }
    
    async def request_revision(self, draft_id: str, requested_by: str, feedback: str) -> Dict[str, Any]:
        """
        Request revision for a draft
        """
        draft = await self.db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
        if not draft:
            return {"success": False, "error": "Draft not found"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Set back to draft status
        await self.db.email_drafts.update_one(
            {"id": draft_id},
            {
                "$set": {
                    "status": EmailDraftStatus.DRAFT.value,
                    "updated_at": now
                },
                "$push": {
                    "revision_requests": {
                        "requested_by": requested_by,
                        "feedback": feedback,
                        "requested_at": now
                    }
                }
            }
        )
        
        # Log revision request
        await self._log_approval_action(draft_id, "revision_requested", requested_by, feedback)
        
        return {
            "success": True,
            "draft_id": draft_id,
            "status": EmailDraftStatus.DRAFT.value,
            "feedback": feedback
        }
    
    async def _log_approval_action(self, draft_id: str, action: str, actor: str, comment: Optional[str] = None):
        """Log approval action"""
        log = {
            "draft_id": draft_id,
            "action": action,
            "actor": actor,
            "comment": comment,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.db.email_approval_logs.insert_one(log)
    
    async def _notify_approvers(self, draft: Dict):
        """Notify approvers about pending draft"""
        # Would integrate with notification system
        # For now, just log
        logger.info(f"[APPROVAL] Notifying approvers for draft: {draft.get('id')}")
    
    async def _notify_rejection(self, draft: Dict, rejected_by: str, reason: str):
        """Notify creator about rejection"""
        # Would integrate with notification system
        logger.info(f"[APPROVAL] Notifying creator {draft.get('created_by')} about rejection")
    
    async def get_pending_approvals(self, limit: int = 50) -> List[Dict]:
        """Get all pending drafts"""
        drafts = await self.db.email_drafts.find(
            {"status": EmailDraftStatus.PENDING.value},
            {"_id": 0}
        ).sort("updated_at", -1).limit(limit).to_list(limit)
        
        return drafts
    
    async def get_approval_history(self, draft_id: str) -> List[Dict]:
        """Get approval history for a draft"""
        logs = await self.db.email_approval_logs.find(
            {"draft_id": draft_id},
            {"_id": 0}
        ).sort("timestamp", -1).to_list(100)
        
        return logs
    
    async def get_approval_stats(self) -> Dict[str, Any]:
        """Get approval statistics"""
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        stats = await self.db.email_drafts.aggregate(pipeline).to_list(100)
        
        return {
            "by_status": {s["_id"]: s["count"] for s in stats},
            "total": sum(s["count"] for s in stats)
        }
