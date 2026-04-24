"""
Action Execution Engine
Prompt 18/20 - AI Decision Engine (FINAL 10/10)

CRITICAL: Click phải chạy thật!
- create_task: Tạo task trong DB
- notify: Gửi notification thật
- assign: Assign cho sales thật
- escalate: Escalate lên manager thật
- call_log: Log cuộc gọi

NO DISPLAY WITHOUT EXECUTION
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from .utils import iso_now, get_now_utc, generate_id


class ActionExecutionEngine:
    """
    Action Execution Engine - Execute AI actions for real.
    
    Không chỉ hiển thị - phải thực thi thật:
    - Tạo task trong tasks collection
    - Gửi notification vào notifications collection
    - Update assignment trong leads/deals
    - Log mọi action để tracking
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._audit_collection = "ai_action_executions"
    
    async def execute_action(
        self,
        action_type: str,
        entity_type: str,
        entity_id: str,
        params: Dict[str, Any],
        executed_by: str,
        ai_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute an AI-recommended action.
        
        Args:
            action_type: call, create_task, assign, notify, escalate, email, sms
            entity_type: lead, deal
            entity_id: ID of entity
            params: Action parameters
            executed_by: User ID who clicked execute
            ai_context: AI insight that triggered this (score, risk, etc.)
        
        Returns:
            {
                "success": True,
                "action_id": "...",
                "action_type": "create_task",
                "executed_at": "...",
                "result": {...}
            }
        """
        now = iso_now()
        action_id = generate_id("exec")
        
        try:
            # Execute based on action type
            if action_type == "call":
                result = await self._execute_call(entity_type, entity_id, params, executed_by)
            elif action_type == "create_task":
                result = await self._execute_create_task(entity_type, entity_id, params, executed_by)
            elif action_type == "assign":
                result = await self._execute_assign(entity_type, entity_id, params, executed_by)
            elif action_type == "reassign":
                result = await self._execute_reassign(entity_type, entity_id, params, executed_by)
            elif action_type == "notify":
                result = await self._execute_notify(entity_type, entity_id, params, executed_by)
            elif action_type == "escalate":
                result = await self._execute_escalate(entity_type, entity_id, params, executed_by)
            elif action_type == "email":
                result = await self._execute_email(entity_type, entity_id, params, executed_by)
            elif action_type == "schedule_meeting":
                result = await self._execute_schedule_meeting(entity_type, entity_id, params, executed_by)
            elif action_type == "add_note":
                result = await self._execute_add_note(entity_type, entity_id, params, executed_by)
            elif action_type == "update_stage":
                result = await self._execute_update_stage(entity_type, entity_id, params, executed_by)
            else:
                return {
                    "success": False,
                    "error": f"Unknown action type: {action_type}"
                }
            
            # Log execution
            await self._log_execution(
                action_id=action_id,
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                params=params,
                executed_by=executed_by,
                result=result,
                ai_context=ai_context,
                success=True
            )
            
            return {
                "success": True,
                "action_id": action_id,
                "action_type": action_type,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "executed_at": now,
                "executed_by": executed_by,
                "result": result
            }
            
        except Exception as e:
            # Log failure
            await self._log_execution(
                action_id=action_id,
                action_type=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                params=params,
                executed_by=executed_by,
                result={"error": str(e)},
                ai_context=ai_context,
                success=False
            )
            
            return {
                "success": False,
                "action_id": action_id,
                "action_type": action_type,
                "error": str(e)
            }
    
    async def _execute_call(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Log a call activity."""
        now = iso_now()
        
        # Get entity for phone number
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        
        phone = params.get("phone") or entity.get("phone") if entity else None
        
        # Create activity record
        activity = {
            "id": generate_id("act"),
            f"{entity_type}_id": entity_id,
            "type": "call",
            "direction": "outbound",
            "phone": phone,
            "status": "completed",
            "outcome": params.get("outcome", "connected"),
            "notes": params.get("notes", "AI-triggered call"),
            "duration": params.get("duration", 0),
            "created_at": now,
            "created_by": executed_by,
            "is_ai_triggered": True
        }
        await self.db.activities.insert_one(activity)
        
        # Update entity last_activity
        await collection.update_one(
            {"id": entity_id},
            {"$set": {"last_activity": now, "updated_at": now}}
        )
        
        return {
            "activity_id": activity["id"],
            "phone": phone,
            "message": f"Đã log cuộc gọi cho {entity_type}"
        }
    
    async def _execute_create_task(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Create a real task in database."""
        now = get_now_utc()
        
        # Determine due date
        priority = params.get("priority", "high")
        if priority == "urgent":
            due_date = now.replace(hour=17, minute=0)
        elif priority == "high":
            due_date = now + timedelta(days=1)
        else:
            due_date = now + timedelta(days=3)
        
        # Get entity info
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        entity_name = entity.get("full_name") or entity.get("customer_name") or entity.get("code", entity_id[:8]) if entity else entity_id[:8]
        
        # Create task
        task = {
            "id": generate_id("task"),
            f"{entity_type}_id": entity_id,
            "title": params.get("title", f"[AI] Follow up: {entity_name}"),
            "description": params.get("description", f"AI-generated task based on {entity_type} analysis"),
            "type": params.get("type", "follow_up"),
            "status": "pending",
            "priority": priority,
            "due_date": due_date.isoformat(),
            "assigned_to": params.get("assigned_to") or (entity.get("assigned_to") if entity else executed_by),
            "created_at": iso_now(),
            "created_by": executed_by,
            "is_ai_generated": True,
            "ai_reason": params.get("reason", "AI recommended action")
        }
        await self.db.tasks.insert_one(task)
        
        # Create notification for assignee
        if task["assigned_to"]:
            await self._create_notification(
                user_id=task["assigned_to"],
                title=f"Task mới: {task['title']}",
                message=f"AI đã tạo task cần xử lý trước {due_date.strftime('%d/%m %H:%M')}",
                type="task",
                reference_type="task",
                reference_id=task["id"],
                priority=priority
            )
        
        return {
            "task_id": task["id"],
            "title": task["title"],
            "due_date": task["due_date"],
            "assigned_to": task["assigned_to"],
            "message": f"Đã tạo task '{task['title']}'"
        }
    
    async def _execute_assign(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Assign entity to a user."""
        now = iso_now()
        assign_to = params.get("assign_to")
        
        if not assign_to:
            # Find best available sales
            assign_to = await self._find_best_sales()
        
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        
        # Update assignment
        await collection.update_one(
            {"id": entity_id},
            {"$set": {
                "assigned_to": assign_to,
                "assigned_at": now,
                "assigned_by": executed_by,
                "updated_at": now
            }}
        )
        
        # Notify new assignee
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        entity_name = entity.get("full_name") or entity.get("customer_name") or entity_id[:8] if entity else entity_id[:8]
        
        await self._create_notification(
            user_id=assign_to,
            title=f"{entity_type.title()} mới được giao",
            message=f"Bạn được giao {entity_type} {entity_name}",
            type="assignment",
            reference_type=entity_type,
            reference_id=entity_id,
            priority="high"
        )
        
        return {
            "assigned_to": assign_to,
            "message": f"Đã giao {entity_type} cho {assign_to}"
        }
    
    async def _execute_reassign(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Reassign entity to another user."""
        return await self._execute_assign(entity_type, entity_id, params, executed_by)
    
    async def _execute_notify(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Send notification to relevant users."""
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        
        notify_users = params.get("notify_users", [])
        if not notify_users and entity:
            notify_users = [entity.get("assigned_to")] if entity.get("assigned_to") else []
        
        entity_name = entity.get("full_name") or entity.get("customer_name") or entity_id[:8] if entity else entity_id[:8]
        
        notifications_sent = 0
        for user_id in notify_users:
            if user_id:
                await self._create_notification(
                    user_id=user_id,
                    title=params.get("title", f"[AI Alert] {entity_type.title()} cần xử lý"),
                    message=params.get("message", f"AI phát hiện {entity_name} cần hành động ngay"),
                    type="ai_alert",
                    reference_type=entity_type,
                    reference_id=entity_id,
                    priority=params.get("priority", "high")
                )
                notifications_sent += 1
        
        return {
            "notifications_sent": notifications_sent,
            "message": f"Đã gửi {notifications_sent} thông báo"
        }
    
    async def _execute_escalate(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Escalate to manager."""
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        
        # Find manager
        manager_id = params.get("manager_id")
        if not manager_id:
            # Find any manager
            manager = await self.db.users.find_one(
                {"role": {"$in": ["manager", "sales_director", "bod"]}},
                {"_id": 0, "id": 1}
            )
            manager_id = manager["id"] if manager else executed_by
        
        entity_name = entity.get("full_name") or entity.get("customer_name") or entity_id[:8] if entity else entity_id[:8]
        
        # Create escalation record
        escalation = {
            "id": generate_id("esc"),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "escalated_to": manager_id,
            "escalated_by": executed_by,
            "reason": params.get("reason", "AI-detected high risk"),
            "priority": "urgent",
            "status": "pending",
            "created_at": iso_now(),
            "is_ai_generated": True
        }
        await self.db.escalations.insert_one(escalation)
        
        # Notify manager
        await self._create_notification(
            user_id=manager_id,
            title=f"[ESCALATION] {entity_type.title()} cần Manager xử lý",
            message=f"{entity_name} - {params.get('reason', 'AI phát hiện rủi ro cao')}",
            type="escalation",
            reference_type=entity_type,
            reference_id=entity_id,
            priority="urgent"
        )
        
        return {
            "escalation_id": escalation["id"],
            "escalated_to": manager_id,
            "message": f"Đã escalate lên manager"
        }
    
    async def _execute_email(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Log email activity (actual sending would need email service)."""
        now = iso_now()
        
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        email = params.get("email") or (entity.get("email") if entity else None)
        
        # Log as activity
        activity = {
            "id": generate_id("act"),
            f"{entity_type}_id": entity_id,
            "type": "email",
            "direction": "outbound",
            "email": email,
            "subject": params.get("subject", "Follow up"),
            "status": "sent",
            "created_at": now,
            "created_by": executed_by,
            "is_ai_triggered": True
        }
        await self.db.activities.insert_one(activity)
        
        # Update last activity
        await collection.update_one(
            {"id": entity_id},
            {"$set": {"last_activity": now, "updated_at": now}}
        )
        
        return {
            "activity_id": activity["id"],
            "email": email,
            "message": f"Đã log email cho {entity_type}"
        }
    
    async def _execute_schedule_meeting(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Schedule a meeting/viewing."""
        now = get_now_utc()
        
        # Default meeting time: tomorrow 10am
        meeting_time = params.get("meeting_time")
        if not meeting_time:
            meeting_time = (now + timedelta(days=1)).replace(hour=10, minute=0).isoformat()
        
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        entity_name = entity.get("full_name") or entity.get("customer_name") or entity_id[:8] if entity else entity_id[:8]
        
        # Create task for meeting
        task = {
            "id": generate_id("task"),
            f"{entity_type}_id": entity_id,
            "title": params.get("title", f"[AI] Lịch hẹn: {entity_name}"),
            "description": params.get("description", "AI suggested meeting"),
            "type": "meeting",
            "status": "scheduled",
            "priority": "high",
            "due_date": meeting_time,
            "assigned_to": params.get("assigned_to") or (entity.get("assigned_to") if entity else executed_by),
            "created_at": iso_now(),
            "created_by": executed_by,
            "is_ai_generated": True
        }
        await self.db.tasks.insert_one(task)
        
        return {
            "task_id": task["id"],
            "meeting_time": meeting_time,
            "message": f"Đã đặt lịch hẹn với {entity_name}"
        }
    
    async def _execute_add_note(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Add a note to entity."""
        now = iso_now()
        
        note = {
            "id": generate_id("note"),
            f"{entity_type}_id": entity_id,
            "content": params.get("content", "AI action executed"),
            "type": params.get("type", "note"),
            "created_at": now,
            "created_by": executed_by,
            "is_ai_generated": params.get("is_ai_generated", True)
        }
        await self.db.notes.insert_one(note)
        
        return {
            "note_id": note["id"],
            "message": "Đã thêm ghi chú"
        }
    
    async def _execute_update_stage(
        self,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str
    ) -> Dict[str, Any]:
        """Update entity stage."""
        now = iso_now()
        new_stage = params.get("stage")
        
        if not new_stage:
            return {"error": "Stage not specified"}
        
        collection = self.db.leads if entity_type == "lead" else self.db.deals
        
        # Get old stage
        entity = await collection.find_one({"id": entity_id}, {"_id": 0})
        old_stage = entity.get("stage") or entity.get("status") if entity else None
        
        # Update
        field_name = "status" if entity_type == "lead" else "stage"
        await collection.update_one(
            {"id": entity_id},
            {"$set": {
                field_name: new_stage,
                "stage_changed_at": now,
                "updated_at": now
            }}
        )
        
        return {
            "old_stage": old_stage,
            "new_stage": new_stage,
            "message": f"Đã chuyển từ {old_stage} sang {new_stage}"
        }
    
    async def _create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        type: str,
        reference_type: str,
        reference_id: str,
        priority: str = "medium"
    ):
        """Create notification in database."""
        notification = {
            "id": generate_id("notif"),
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type,
            "reference_type": reference_type,
            "reference_id": reference_id,
            "priority": priority,
            "is_read": False,
            "created_at": iso_now(),
            "is_ai_generated": True
        }
        await self.db.notifications.insert_one(notification)
        return notification["id"]
    
    async def _find_best_sales(self) -> Optional[str]:
        """Find the best available sales person (least workload)."""
        # Find sales with least pending tasks
        pipeline = [
            {"$match": {"role": "sales", "is_active": True}},
            {"$lookup": {
                "from": "tasks",
                "localField": "id",
                "foreignField": "assigned_to",
                "as": "tasks"
            }},
            {"$addFields": {
                "pending_tasks": {
                    "$size": {
                        "$filter": {
                            "input": "$tasks",
                            "as": "t",
                            "cond": {"$eq": ["$$t.status", "pending"]}
                        }
                    }
                }
            }},
            {"$sort": {"pending_tasks": 1}},
            {"$limit": 1}
        ]
        
        result = await self.db.users.aggregate(pipeline).to_list(1)
        if result:
            return result[0]["id"]
        
        # Fallback: any active user
        user = await self.db.users.find_one({"is_active": True}, {"_id": 0, "id": 1})
        return user["id"] if user else None
    
    async def _log_execution(
        self,
        action_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str,
        params: Dict,
        executed_by: str,
        result: Dict,
        ai_context: Optional[Dict],
        success: bool
    ):
        """Log action execution for audit and learning."""
        log = {
            "id": action_id,
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "params": params,
            "executed_by": executed_by,
            "result": result,
            "ai_context": ai_context,
            "success": success,
            "executed_at": iso_now(),
            "outcome_tracked": False  # Will be updated when outcome is known
        }
        await self.db[self._audit_collection].insert_one(log)
    
    async def batch_execute(
        self,
        actions: List[Dict],
        executed_by: str
    ) -> Dict[str, Any]:
        """Execute multiple actions in batch."""
        results = []
        success_count = 0
        
        for action in actions:
            result = await self.execute_action(
                action_type=action.get("action_type"),
                entity_type=action.get("entity_type"),
                entity_id=action.get("entity_id"),
                params=action.get("params", {}),
                executed_by=executed_by,
                ai_context=action.get("ai_context")
            )
            results.append(result)
            if result.get("success"):
                success_count += 1
        
        return {
            "total": len(actions),
            "success": success_count,
            "failed": len(actions) - success_count,
            "results": results
        }
