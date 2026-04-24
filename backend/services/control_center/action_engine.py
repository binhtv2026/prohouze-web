"""
Action Engine
Prompt 17/20 - Executive Control Center

Execute actions from alerts: reassign, create task, send reminder, etc.
Supports closed-loop tracking to verify if actions resolve issues.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from .dto import ActionType, ACTION_LABELS
from .utils import iso_now, get_now_utc


class ActionEngine:
    """
    Action Engine for executing control center actions.
    Every alert has associated actions that can be executed here.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._actions_collection = "control_actions"
        self._action_results_collection = "control_action_results"
    
    async def execute_action(
        self,
        action_type: str,
        source_alert_id: Optional[str],
        source_entity: str,
        source_id: str,
        params: Dict[str, Any],
        user: dict
    ) -> Dict[str, Any]:
        """
        Execute an action and track its result.
        """
        action_id = str(uuid.uuid4())
        now = get_now_utc()
        
        # Validate action type
        try:
            action_enum = ActionType(action_type)
        except ValueError:
            return {"success": False, "error": f"Unknown action type: {action_type}"}
        
        # Execute the action
        result = await self._execute_action_type(action_enum, source_entity, source_id, params, user)
        
        # Log the action
        action_log = {
            "id": action_id,
            "action_type": action_type,
            "source_alert_id": source_alert_id,
            "source_entity": source_entity,
            "source_id": source_id,
            "params": params,
            "executed_by": user.get("id"),
            "executed_by_name": user.get("full_name"),
            "executed_at": now.isoformat(),
            "result": result,
            "success": result.get("success", False),
            "verified": False,
            "verified_at": None,
            "issue_resolved": None
        }
        
        await self.db[self._actions_collection].insert_one(action_log)
        
        # If action was linked to an alert, update the alert
        if source_alert_id:
            await self.db.control_alerts.update_one(
                {"id": source_alert_id},
                {"$push": {"actions_taken": {
                    "action_id": action_id,
                    "action_type": action_type,
                    "executed_at": now.isoformat(),
                    "executed_by": user.get("id")
                }}}
            )
        
        return {
            "success": result.get("success", False),
            "action_id": action_id,
            "action_type": action_type,
            "message": result.get("message"),
            "details": result.get("details")
        }
    
    async def _execute_action_type(
        self,
        action_type: ActionType,
        source_entity: str,
        source_id: str,
        params: Dict[str, Any],
        user: dict
    ) -> Dict[str, Any]:
        """Execute specific action type."""
        handlers = {
            ActionType.REASSIGN_OWNER: self._action_reassign_owner,
            ActionType.CREATE_TASK: self._action_create_task,
            ActionType.SEND_REMINDER: self._action_send_reminder,
            ActionType.REQUEST_DOCS: self._action_request_docs,
            ActionType.ASSIGN_REVIEWER: self._action_assign_reviewer,
            ActionType.TRIGGER_CAMPAIGN: self._action_trigger_campaign,
            ActionType.ESCALATE: self._action_escalate,
            ActionType.MARK_RESOLVED: self._action_mark_resolved,
        }
        
        handler = handlers.get(action_type)
        if handler:
            return await handler(source_entity, source_id, params, user)
        return {"success": False, "message": f"Action {action_type} not implemented"}
    
    async def _action_reassign_owner(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Reassign entity to new owner."""
        new_owner_id = params.get("new_owner_id")
        if not new_owner_id:
            return {"success": False, "message": "new_owner_id required"}
        
        new_owner = await self.db.users.find_one({"id": new_owner_id}, {"_id": 0, "full_name": 1})
        if not new_owner:
            return {"success": False, "message": "New owner not found"}
        
        now = iso_now()
        
        collection = self.db[entity]
        old_entity = await collection.find_one({"id": entity_id}, {"_id": 0, "owner_id": 1, "assigned_to": 1})
        
        update_field = "owner_id" if "owner_id" in (old_entity or {}) else "assigned_to"
        
        await collection.update_one(
            {"id": entity_id},
            {"$set": {
                update_field: new_owner_id,
                "updated_at": now,
                "reassigned_at": now,
                "reassigned_by": user.get("id")
            }}
        )
        
        await self.db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": new_owner_id,
            "title": f"Ban duoc assign {entity} moi",
            "message": f"Ban da duoc assign {entity} #{entity_id[:8]} boi {user.get('full_name')}",
            "type": "assignment",
            "entity_type": entity,
            "entity_id": entity_id,
            "is_read": False,
            "created_at": now
        })
        
        return {
            "success": True,
            "message": f"Reassigned to {new_owner.get('full_name')}",
            "details": {"new_owner_id": new_owner_id, "new_owner_name": new_owner.get("full_name")}
        }
    
    async def _action_create_task(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Create a task for the entity."""
        task_title = params.get("title", f"Follow up on {entity}")
        task_description = params.get("description", "")
        assignee_id = params.get("assignee_id", user.get("id"))
        due_hours = params.get("due_hours", 24)
        
        now = get_now_utc()
        due_at = now + timedelta(hours=due_hours)
        
        task = {
            "id": str(uuid.uuid4()),
            "title": task_title,
            "description": task_description,
            "type": "follow_up",
            "status": "pending",
            "priority": params.get("priority", "high"),
            "assigned_to": assignee_id,
            "created_by": user.get("id"),
            "created_at": now.isoformat(),
            "due_at": due_at.isoformat(),
            "related_entity": entity,
            "related_entity_id": entity_id,
            "source": "control_center"
        }
        
        await self.db.tasks.insert_one(task)
        
        if assignee_id != user.get("id"):
            await self.db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": assignee_id,
                "title": "Task moi tu Control Center",
                "message": task_title,
                "type": "task",
                "entity_type": "tasks",
                "entity_id": task["id"],
                "is_read": False,
                "created_at": now.isoformat()
            })
        
        return {
            "success": True,
            "message": f"Task created: {task_title}",
            "details": {"task_id": task["id"], "due_at": due_at.isoformat()}
        }
    
    async def _action_send_reminder(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Send reminder notification to owner."""
        now = iso_now()
        
        entity_doc = await self.db[entity].find_one({"id": entity_id}, {"_id": 0, "owner_id": 1, "assigned_to": 1})
        if not entity_doc:
            return {"success": False, "message": "Entity not found"}
        
        owner_id = entity_doc.get("owner_id") or entity_doc.get("assigned_to")
        if not owner_id:
            return {"success": False, "message": "No owner to remind"}
        
        message = params.get("message", f"Reminder: Please update {entity} #{entity_id[:8]}")
        
        await self.db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": owner_id,
            "title": "Reminder tu Control Center",
            "message": message,
            "type": "reminder",
            "entity_type": entity,
            "entity_id": entity_id,
            "is_read": False,
            "created_at": now,
            "sent_by": user.get("id")
        })
        
        return {
            "success": True,
            "message": "Reminder sent",
            "details": {"sent_to": owner_id}
        }
    
    async def _action_request_docs(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Request missing documents."""
        now = iso_now()
        
        doc_types = params.get("document_types", ["identity", "deposit_proof"])
        
        request_id = str(uuid.uuid4())
        await self.db.document_requests.insert_one({
            "id": request_id,
            "entity_type": entity,
            "entity_id": entity_id,
            "document_types": doc_types,
            "status": "pending",
            "requested_by": user.get("id"),
            "requested_at": now
        })
        
        await self._action_create_task(entity, entity_id, {
            "title": f"Request documents for {entity}",
            "description": f"Documents needed: {', '.join(doc_types)}",
            "priority": "medium"
        }, user)
        
        return {
            "success": True,
            "message": f"Document request created for: {', '.join(doc_types)}",
            "details": {"request_id": request_id, "document_types": doc_types}
        }
    
    async def _action_assign_reviewer(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Assign a reviewer to entity (usually contracts)."""
        reviewer_id = params.get("reviewer_id")
        if not reviewer_id:
            managers = await self.db.users.find(
                {"role": {"$in": ["manager", "bod"]}},
                {"_id": 0, "id": 1, "full_name": 1}
            ).to_list(10)
            if managers:
                reviewer = managers[0]
                reviewer_id = reviewer["id"]
            else:
                return {"success": False, "message": "No reviewer available"}
        else:
            reviewer = await self.db.users.find_one({"id": reviewer_id}, {"_id": 0, "full_name": 1})
        
        now = iso_now()
        
        await self.db[entity].update_one(
            {"id": entity_id},
            {"$set": {
                "reviewer_id": reviewer_id,
                "review_assigned_at": now,
                "review_assigned_by": user.get("id")
            }}
        )
        
        await self.db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": reviewer_id,
            "title": "Review request",
            "message": f"Please review {entity} #{entity_id[:8]}",
            "type": "review_request",
            "entity_type": entity,
            "entity_id": entity_id,
            "is_read": False,
            "created_at": now
        })
        
        return {
            "success": True,
            "message": f"Reviewer assigned: {reviewer.get('full_name', 'N/A')}",
            "details": {"reviewer_id": reviewer_id}
        }
    
    async def _action_trigger_campaign(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Trigger marketing campaign for entity (usually project)."""
        campaign_type = params.get("campaign_type", "awareness")
        now = get_now_utc()
        
        suggestion_id = str(uuid.uuid4())
        await self.db.campaign_suggestions.insert_one({
            "id": suggestion_id,
            "project_id": entity_id if entity == "projects" else None,
            "campaign_type": campaign_type,
            "status": "suggested",
            "suggested_by": user.get("id"),
            "suggested_at": now.isoformat(),
            "reason": params.get("reason", "Low absorption rate"),
            "source": "control_center"
        })
        
        marketing_users = await self.db.users.find(
            {"role": "marketing", "is_active": True},
            {"_id": 0, "id": 1}
        ).to_list(10)
        
        for mkt_user in marketing_users:
            await self.db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": mkt_user["id"],
                "title": "Campaign suggestion",
                "message": f"New {campaign_type} campaign suggested for {entity}",
                "type": "campaign_suggestion",
                "entity_type": "campaign_suggestions",
                "entity_id": suggestion_id,
                "is_read": False,
                "created_at": now.isoformat()
            })
        
        return {
            "success": True,
            "message": f"{campaign_type} campaign suggestion created",
            "details": {"suggestion_id": suggestion_id, "notified_count": len(marketing_users)}
        }
    
    async def _action_escalate(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Escalate issue to management."""
        now = get_now_utc()
        reason = params.get("reason", "Requires management attention")
        
        managers = await self.db.users.find(
            {"role": {"$in": ["manager", "bod"]}, "is_active": True},
            {"_id": 0, "id": 1, "full_name": 1}
        ).to_list(10)
        
        escalation_id = str(uuid.uuid4())
        await self.db.escalations.insert_one({
            "id": escalation_id,
            "entity_type": entity,
            "entity_id": entity_id,
            "reason": reason,
            "escalated_by": user.get("id"),
            "escalated_at": now.isoformat(),
            "status": "open",
            "notified_managers": [m["id"] for m in managers]
        })
        
        for manager in managers:
            await self.db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": manager["id"],
                "title": "Escalation: Requires attention",
                "message": f"{entity} #{entity_id[:8]}: {reason}",
                "type": "escalation",
                "entity_type": "escalations",
                "entity_id": escalation_id,
                "is_read": False,
                "priority": "high",
                "created_at": now.isoformat()
            })
        
        return {
            "success": True,
            "message": f"Escalated to {len(managers)} managers",
            "details": {"escalation_id": escalation_id, "managers_notified": len(managers)}
        }
    
    async def _action_mark_resolved(self, entity: str, entity_id: str, params: Dict, user: dict) -> Dict:
        """Mark issue as resolved."""
        now = iso_now()
        resolution_note = params.get("note", "Marked resolved via Control Center")
        
        if entity == "control_alerts":
            await self.db.control_alerts.update_one(
                {"id": entity_id},
                {"$set": {
                    "is_resolved": True,
                    "resolved_by": user.get("id"),
                    "resolved_at": now,
                    "resolution_note": resolution_note
                }}
            )
        
        return {
            "success": True,
            "message": "Marked as resolved",
            "details": {"resolved_at": now, "note": resolution_note}
        }
    
    # ==================== CLOSED-LOOP TRACKING ====================
    
    async def verify_action_result(self, action_id: str, is_resolved: bool, user: dict) -> Dict[str, Any]:
        """
        Verify if an action actually resolved the issue.
        This is the closed-loop tracking feature.
        """
        now = iso_now()
        
        result = await self.db[self._actions_collection].update_one(
            {"id": action_id},
            {"$set": {
                "verified": True,
                "verified_at": now,
                "verified_by": user.get("id"),
                "issue_resolved": is_resolved
            }}
        )
        
        return {
            "success": result.modified_count > 0,
            "action_id": action_id,
            "issue_resolved": is_resolved,
            "verified_at": now
        }
    
    async def get_action_effectiveness(self) -> Dict[str, Any]:
        """
        Get statistics on action effectiveness.
        Shows which actions actually resolve issues.
        """
        pipeline = [
            {"$match": {"verified": True}},
            {"$group": {
                "_id": "$action_type",
                "total": {"$sum": 1},
                "resolved": {"$sum": {"$cond": ["$issue_resolved", 1, 0]}}
            }}
        ]
        
        results = await self.db[self._actions_collection].aggregate(pipeline).to_list(20)
        
        effectiveness = {}
        for r in results:
            resolution_rate = (r["resolved"] / r["total"] * 100) if r["total"] > 0 else 0
            effectiveness[r["_id"]] = {
                "total_actions": r["total"],
                "resolved": r["resolved"],
                "resolution_rate": round(resolution_rate, 1)
            }
        
        total = sum(r["total"] for r in results)
        resolved = sum(r["resolved"] for r in results)
        overall_rate = round((resolved / total * 100) if total > 0 else 0, 1)
        
        return {
            "by_action_type": effectiveness,
            "overall_resolution_rate": overall_rate,
            "most_effective": max(effectiveness.items(), key=lambda x: x[1]["resolution_rate"])[0] if effectiveness else None,
            "least_effective": min(effectiveness.items(), key=lambda x: x[1]["resolution_rate"])[0] if effectiveness else None
        }
