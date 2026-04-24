"""
Escalation Engine - Deadline & Escalation Chain Handler
Phase 3: Revenue-Driven Automation

Features:
1. Task deadline monitoring
2. Automatic escalation chains (Sales → Manager → Director)
3. Reassignment logic for hot leads
4. Revenue-based priority boost
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

from .event_emitter import (
    emit_event,
    BusinessEvent,
    EventActor,
    EventEntity,
    EventMetadata,
    EventTypes
)

logger = logging.getLogger(__name__)


# ==================== ESCALATION CHAIN ====================

class EscalationLevel:
    """Escalation levels in the chain."""
    OWNER = "owner"
    MANAGER = "manager"
    DIRECTOR = "director"
    CEO = "ceo"
    
    CHAIN = [OWNER, MANAGER, DIRECTOR, CEO]
    
    @classmethod
    def next_level(cls, current: str) -> Optional[str]:
        """Get next escalation level."""
        try:
            idx = cls.CHAIN.index(current)
            if idx < len(cls.CHAIN) - 1:
                return cls.CHAIN[idx + 1]
            return None
        except ValueError:
            return cls.MANAGER


# ==================== ESCALATION ENGINE ====================

class EscalationEngine:
    """
    Handles deadline monitoring and automatic escalation.
    
    Features:
    - Check overdue tasks
    - Escalate based on chain (Sales → Manager → Director)
    - Auto-reassign hot leads if not contacted
    - Create escalation events for audit
    """
    
    def __init__(self, db):
        self.db = db
    
    async def run_escalation_checks(self) -> Dict[str, Any]:
        """
        Run all escalation checks.
        
        Called periodically (e.g., every 5 minutes).
        """
        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {}
        }
        
        # Check overdue tasks
        task_result = await self._check_overdue_tasks()
        results["checks"]["overdue_tasks"] = task_result
        
        # Check hot leads not contacted
        hot_lead_result = await self._check_hot_leads_not_contacted()
        results["checks"]["hot_leads_not_contacted"] = hot_lead_result
        
        # Check deals needing attention
        deal_result = await self._check_deals_needing_attention()
        results["checks"]["deals_needing_attention"] = deal_result
        
        total_escalations = sum(r.get("escalations_created", 0) for r in results["checks"].values())
        results["total_escalations"] = total_escalations
        
        logger.info(f"Escalation checks complete: {total_escalations} escalations")
        
        return results
    
    # ==================== OVERDUE TASKS ====================
    
    async def _check_overdue_tasks(self) -> Dict[str, Any]:
        """
        Check for overdue tasks and escalate.
        
        - Tasks past due_at without completion → escalate
        - Escalate to next level in chain
        """
        now = datetime.now(timezone.utc)
        
        # Find overdue tasks that haven't been escalated recently
        overdue_threshold = now - timedelta(minutes=5)  # 5 min grace period
        
        query = {
            "status": {"$in": ["pending", "in_progress"]},
            "due_at": {"$lt": now.isoformat()},
            "$or": [
                {"last_escalated_at": {"$exists": False}},
                {"last_escalated_at": {"$lt": overdue_threshold.isoformat()}}
            ]
        }
        
        overdue_tasks = await self.db.tasks.find(query, {"_id": 0}).to_list(100)
        
        escalations_created = 0
        errors = []
        
        for task in overdue_tasks:
            try:
                # Determine next escalation level
                current_level = task.get("escalation_level", EscalationLevel.OWNER)
                next_level = EscalationLevel.next_level(current_level)
                
                if not next_level:
                    # Already at top of chain
                    continue
                
                # Get target user for next level
                target_user = await self._get_escalation_target(
                    task.get("related_entity"),
                    task.get("related_entity_id"),
                    next_level
                )
                
                if not target_user:
                    continue
                
                # Create escalation notification
                await self._create_escalation_notification(
                    task=task,
                    from_level=current_level,
                    to_level=next_level,
                    target_user=target_user
                )
                
                # Update task
                await self.db.tasks.update_one(
                    {"id": task["id"]},
                    {
                        "$set": {
                            "escalation_level": next_level,
                            "last_escalated_at": now.isoformat(),
                            "escalation_history": task.get("escalation_history", []) + [{
                                "from": current_level,
                                "to": next_level,
                                "at": now.isoformat(),
                                "reason": "Task overdue"
                            }]
                        }
                    }
                )
                
                escalations_created += 1
                
            except Exception as e:
                errors.append(f"Task {task.get('id')}: {str(e)}")
        
        return {
            "tasks_checked": len(overdue_tasks),
            "escalations_created": escalations_created,
            "errors": errors[:10]
        }
    
    # ==================== HOT LEADS NOT CONTACTED ====================
    
    async def _check_hot_leads_not_contacted(self) -> Dict[str, Any]:
        """
        Check hot leads (score > 80) that haven't been contacted.
        
        Timeline:
        - 5 min: Escalate to manager
        - 15 min: Reassign to another sales
        - 30 min: Director alert
        """
        now = datetime.now(timezone.utc)
        
        # Find hot leads created > 5 min ago without activity
        hot_lead_query = {
            "score": {"$gt": 80},
            "status": "new",
            "created_at": {"$lt": (now - timedelta(minutes=5)).isoformat()},
            "$or": [
                {"last_activity": {"$exists": False}},
                {"last_activity": None}
            ]
        }
        
        hot_leads = await self.db.leads.find(hot_lead_query, {"_id": 0}).to_list(50)
        
        escalations_created = 0
        reassignments = 0
        errors = []
        
        for lead in hot_leads:
            try:
                created_at = datetime.fromisoformat(lead["created_at"].replace("Z", "+00:00"))
                minutes_since_created = (now - created_at).total_seconds() / 60
                
                # Determine action based on time
                if minutes_since_created >= 30:
                    # Director alert + Mark critical
                    await self._alert_director_hot_lead(lead)
                    escalations_created += 1
                    
                elif minutes_since_created >= 15:
                    # Reassign to another sales
                    result = await self._reassign_hot_lead(lead)
                    if result.get("reassigned"):
                        reassignments += 1
                    
                elif minutes_since_created >= 5:
                    # Escalate to manager
                    await self._escalate_hot_lead_to_manager(lead)
                    escalations_created += 1
                    
            except Exception as e:
                errors.append(f"Lead {lead.get('id')}: {str(e)}")
        
        return {
            "hot_leads_checked": len(hot_leads),
            "escalations_created": escalations_created,
            "reassignments": reassignments,
            "errors": errors[:10]
        }
    
    # ==================== DEALS NEEDING ATTENTION ====================
    
    async def _check_deals_needing_attention(self) -> Dict[str, Any]:
        """
        Check deals that need immediate attention.
        
        - High value deals without recent activity
        - Deals at critical stages
        """
        now = datetime.now(timezone.utc)
        escalations_created = 0
        errors = []
        
        # High value deals (> 1B) without activity in 24h
        high_value_stale_query = {
            "deal_value": {"$gt": 1_000_000_000},
            "status": {"$nin": ["won", "lost"]},
            "$or": [
                {"updated_at": {"$lt": (now - timedelta(hours=24)).isoformat()}},
                {"updated_at": {"$exists": False}}
            ],
            "escalated_for_attention": {"$ne": True}
        }
        
        high_value_deals = await self.db.deals.find(high_value_stale_query, {"_id": 0}).to_list(30)
        
        for deal in high_value_deals:
            try:
                # Create attention notification
                await self._create_deal_attention_alert(deal)
                
                # Mark as escalated
                await self.db.deals.update_one(
                    {"id": deal["id"]},
                    {"$set": {"escalated_for_attention": True, "escalated_at": now.isoformat()}}
                )
                
                escalations_created += 1
                
            except Exception as e:
                errors.append(f"Deal {deal.get('id')}: {str(e)}")
        
        return {
            "deals_checked": len(high_value_deals),
            "escalations_created": escalations_created,
            "errors": errors[:10]
        }
    
    # ==================== HELPER METHODS ====================
    
    async def _get_escalation_target(
        self,
        entity_type: str,
        entity_id: str,
        level: str
    ) -> Optional[str]:
        """Get user ID for escalation target."""
        
        if level == EscalationLevel.MANAGER:
            # Get manager of the entity owner
            entity = await self.db[entity_type].find_one({"id": entity_id}, {"_id": 0})
            if entity:
                owner_id = entity.get("assigned_to")
                if owner_id:
                    owner = await self.db.users.find_one({"id": owner_id}, {"_id": 0})
                    return owner.get("manager_id") if owner else None
            
            # Fallback: Get any manager
            manager = await self.db.users.find_one(
                {"role": {"$in": ["manager", "sales_manager"]}},
                {"_id": 0}
            )
            return manager.get("id") if manager else None
            
        elif level == EscalationLevel.DIRECTOR:
            director = await self.db.users.find_one(
                {"role": {"$in": ["director", "sales_director", "bod"]}},
                {"_id": 0}
            )
            return director.get("id") if director else None
            
        elif level == EscalationLevel.CEO:
            ceo = await self.db.users.find_one(
                {"role": {"$in": ["ceo", "admin"]}},
                {"_id": 0}
            )
            return ceo.get("id") if ceo else None
        
        return None
    
    async def _create_escalation_notification(
        self,
        task: Dict[str, Any],
        from_level: str,
        to_level: str,
        target_user: str
    ):
        """Create notification for escalation."""
        now = datetime.now(timezone.utc).isoformat()
        
        notification = {
            "id": f"notif_esc_{task['id'][:8]}_{now[:10]}",
            "user_id": target_user,
            "title": f"⚠️ ESCALATION: {task.get('title', 'Task')}",
            "message": f"Task được escalate từ {from_level} → {to_level} do quá hạn",
            "type": "task_escalation",
            "priority": "high",
            "related_entity": task.get("related_entity"),
            "related_entity_id": task.get("related_entity_id"),
            "task_id": task["id"],
            "is_read": False,
            "created_at": now
        }
        
        await self.db.notifications.insert_one(notification)
    
    async def _escalate_hot_lead_to_manager(self, lead: Dict[str, Any]):
        """Escalate hot lead to manager."""
        now = datetime.now(timezone.utc).isoformat()
        
        manager_id = await self._get_escalation_target("leads", lead["id"], EscalationLevel.MANAGER)
        if not manager_id:
            return
        
        notification = {
            "id": f"notif_hot_{lead['id'][:8]}_{now[:10]}",
            "user_id": manager_id,
            "title": f"🔥 HOT LEAD CHƯA ĐƯỢC XỬ LÝ - {lead.get('full_name', 'N/A')}",
            "message": f"Lead nóng (score {lead.get('score', 0)}) đã 5 phút chưa được liên hệ!",
            "type": "hot_lead_escalation",
            "priority": "critical",
            "related_entity": "leads",
            "related_entity_id": lead["id"],
            "is_read": False,
            "created_at": now
        }
        
        await self.db.notifications.insert_one(notification)
        
        # Update lead
        await self.db.leads.update_one(
            {"id": lead["id"]},
            {
                "$set": {
                    "escalated_to_manager_at": now,
                    "escalation_reason": "Not contacted within 5 minutes"
                }
            }
        )
    
    async def _reassign_hot_lead(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """Reassign hot lead to another available sales."""
        now = datetime.now(timezone.utc).isoformat()
        current_owner = lead.get("assigned_to")
        
        # Find another available sales person
        new_owner = await self.db.users.find_one(
            {
                "role": {"$in": ["sales", "sales_rep"]},
                "id": {"$ne": current_owner},
                "is_active": True
            },
            {"_id": 0}
        )
        
        if not new_owner:
            return {"reassigned": False, "reason": "No available sales"}
        
        # Reassign
        await self.db.leads.update_one(
            {"id": lead["id"]},
            {
                "$set": {
                    "assigned_to": new_owner["id"],
                    "previous_owner": current_owner,
                    "reassigned_at": now,
                    "reassignment_reason": "Hot lead not contacted within 15 minutes"
                }
            }
        )
        
        # Notify new owner
        notification = {
            "id": f"notif_reassign_{lead['id'][:8]}",
            "user_id": new_owner["id"],
            "title": f"🔥 HOT LEAD ĐƯỢC CHUYỂN CHO BẠN",
            "message": f"Lead nóng {lead.get('full_name', 'N/A')} cần được gọi NGAY!",
            "type": "hot_lead_reassigned",
            "priority": "critical",
            "related_entity": "leads",
            "related_entity_id": lead["id"],
            "is_read": False,
            "created_at": now
        }
        
        await self.db.notifications.insert_one(notification)
        
        # Notify old owner
        if current_owner:
            await self.db.notifications.insert_one({
                "id": f"notif_lost_{lead['id'][:8]}",
                "user_id": current_owner,
                "title": "⚠️ Lead đã bị chuyển do không xử lý",
                "message": f"Lead {lead.get('full_name', 'N/A')} đã được chuyển cho người khác",
                "type": "lead_reassigned_away",
                "priority": "high",
                "related_entity": "leads",
                "related_entity_id": lead["id"],
                "is_read": False,
                "created_at": now
            })
        
        return {"reassigned": True, "new_owner": new_owner["id"]}
    
    async def _alert_director_hot_lead(self, lead: Dict[str, Any]):
        """Alert director about unhandled hot lead."""
        now = datetime.now(timezone.utc).isoformat()
        
        director_id = await self._get_escalation_target("leads", lead["id"], EscalationLevel.DIRECTOR)
        if not director_id:
            return
        
        notification = {
            "id": f"notif_dir_{lead['id'][:8]}_{now[:10]}",
            "user_id": director_id,
            "title": f"🚨 CRITICAL: Hot lead 30 phút chưa xử lý",
            "message": f"Lead {lead.get('full_name')} score {lead.get('score')} đã 30 phút không ai gọi!",
            "type": "hot_lead_director_alert",
            "priority": "critical",
            "related_entity": "leads",
            "related_entity_id": lead["id"],
            "is_read": False,
            "created_at": now
        }
        
        await self.db.notifications.insert_one(notification)
        
        # Mark lead as critical
        await self.db.leads.update_one(
            {"id": lead["id"]},
            {
                "$set": {
                    "is_critical": True,
                    "director_alerted_at": now
                },
                "$addToSet": {
                    "tags": "critical_unhandled"
                }
            }
        )
    
    async def _create_deal_attention_alert(self, deal: Dict[str, Any]):
        """Create attention alert for high value deal."""
        now = datetime.now(timezone.utc).isoformat()
        
        # Notify owner
        if deal.get("assigned_to"):
            await self.db.notifications.insert_one({
                "id": f"notif_deal_att_{deal['id'][:8]}",
                "user_id": deal["assigned_to"],
                "title": f"💰 Deal lớn cần chú ý: {deal.get('customer_name', 'N/A')}",
                "message": f"Deal {deal.get('deal_value', 0):,.0f} VND không có hoạt động 24h",
                "type": "deal_needs_attention",
                "priority": "high",
                "related_entity": "deals",
                "related_entity_id": deal["id"],
                "is_read": False,
                "created_at": now
            })


# ==================== PRIORITY CALCULATOR (REVENUE-BASED) ====================

class RevenuePriorityCalculator:
    """
    Calculate priority based on revenue potential.
    
    Formula: priority = (deal_value / scale) * deal_weight + lead_score * score_weight
    
    Higher deal value = Higher priority
    Higher lead score = Higher priority
    """
    
    # Weights
    DEAL_VALUE_WEIGHT = 0.6
    LEAD_SCORE_WEIGHT = 0.4
    
    # Scale factors
    DEAL_VALUE_SCALE = 100_000_000  # 100M VND = 1 point
    
    # Priority caps
    MIN_PRIORITY = 10
    MAX_PRIORITY = 100
    
    @classmethod
    def calculate(
        cls,
        deal_value: float = 0,
        lead_score: int = 0,
        urgency_boost: int = 0
    ) -> int:
        """
        Calculate revenue-based priority score.
        
        Args:
            deal_value: Deal value in VND
            lead_score: Lead score (0-100)
            urgency_boost: Additional urgency boost (0-50)
        
        Returns:
            Priority score (10-100)
        """
        # Deal value component (0-60)
        deal_component = min(60, (deal_value / cls.DEAL_VALUE_SCALE) * cls.DEAL_VALUE_WEIGHT)
        
        # Lead score component (0-40)
        score_component = (lead_score / 100) * 40 * cls.LEAD_SCORE_WEIGHT
        
        # Base priority
        base_priority = deal_component + score_component
        
        # Add urgency boost
        total_priority = base_priority + urgency_boost
        
        # Clamp to range
        return int(max(cls.MIN_PRIORITY, min(cls.MAX_PRIORITY, total_priority)))


# ==================== RUN ESCALATION CHECKS ====================

async def run_escalation_checks(db) -> Dict[str, Any]:
    """
    Main entry point to run all escalation checks.
    
    Called by:
    - Cron job (every 5 minutes recommended)
    - Manual trigger via API
    """
    engine = EscalationEngine(db)
    return await engine.run_escalation_checks()
