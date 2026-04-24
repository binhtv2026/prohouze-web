"""
ProHouzing Work OS Service
Prompt 10/20 - Task, Reminder & Follow-up Operating System

Core services:
- Task CRUD with validation
- Priority score calculation
- SLA detection
- Auto task generation
- Workboard generation
- Manager workload calculation
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.work_config import (
    TaskType, TaskStatus, TaskPriority, TaskOutcome,
    EntityType, SourceType,
    TASK_TYPE_CONFIG, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG,
    TASK_OUTCOME_CONFIG, ENTITY_TYPE_CONFIG, SOURCE_TYPE_CONFIG,
    STATUS_TRANSITIONS, LOCKED_STATUSES, OUTCOME_REQUIRED_STATUSES,
    PRIORITY_SCORE_CONFIG, TASK_CATEGORIES
)
from config.sla_config import NO_ACTIVITY_CONFIG
from config.auto_task_config import AUTO_TASK_RULES_BY_TRIGGER, FOLLOW_UP_CHAINS


class WorkService:
    """Work OS core service"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.tasks_collection = db["work_tasks"]
        self.task_activities = db["work_task_activities"]
    
    # ============================================
    # TASK CODE GENERATION
    # ============================================
    
    async def generate_task_code(self) -> str:
        """Generate task code: TASK-YYYYMMDD-XXXX"""
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        prefix = f"TASK-{today}-"
        
        # Find last task today
        last_task = await self.tasks_collection.find_one(
            {"code": {"$regex": f"^{prefix}"}},
            sort=[("code", -1)]
        )
        
        if last_task:
            last_num = int(last_task["code"].split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:04d}"
    
    # ============================================
    # PRIORITY SCORE CALCULATION
    # ============================================
    
    def calculate_priority_score(
        self, 
        priority: str, 
        due_at: datetime,
        entity_type: str,
        task_type: str
    ) -> int:
        """Calculate dynamic priority score (0-100)"""
        
        score = 0
        now = datetime.now(timezone.utc)
        
        # 1. Base priority (0-25)
        priority_weights = PRIORITY_SCORE_CONFIG["priority_weights"]
        score += priority_weights.get(priority, 10)
        
        # 2. Deadline urgency (0-30)
        if isinstance(due_at, str):
            due_at = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
        
        hours_until_due = (due_at - now).total_seconds() / 3600
        
        deadline_weights = PRIORITY_SCORE_CONFIG["deadline_weights"]
        if hours_until_due < 0:
            score += deadline_weights["overdue"]
        elif hours_until_due < 4:
            score += deadline_weights["within_4h"]
        elif hours_until_due < 24:
            score += deadline_weights["within_24h"]
        elif hours_until_due < 72:
            score += deadline_weights["within_72h"]
        else:
            score += deadline_weights["beyond_72h"]
        
        # 3. Entity value (0-25)
        entity_weights = PRIORITY_SCORE_CONFIG["entity_weights"]
        score += entity_weights.get(entity_type, 5)
        
        # 4. Task type urgency (0-20)
        urgent_types = PRIORITY_SCORE_CONFIG["urgent_task_types"]
        score += urgent_types.get(task_type, 0)
        
        return min(score, 100)
    
    # ============================================
    # TASK VALIDATION
    # ============================================
    
    def validate_task_create(self, task_data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate task creation - owner, deadline, entity required"""
        
        # Owner required
        if not task_data.get("owner_id"):
            return False, "Task phai co nguoi phu trach (owner_id)"
        
        # Deadline required
        if not task_data.get("due_at"):
            return False, "Task phai co deadline (due_at)"
        
        # Entity required
        if not task_data.get("related_entity_type"):
            return False, "Task phai gan voi entity (related_entity_type)"
        
        if not task_data.get("related_entity_id"):
            return False, "Task phai co entity ID (related_entity_id)"
        
        # Validate entity type
        valid_entity_types = [e.value for e in EntityType]
        if task_data["related_entity_type"] not in valid_entity_types:
            return False, f"Entity type khong hop le. Cho phep: {valid_entity_types}"
        
        return True, ""
    
    def validate_status_transition(
        self, 
        current_status: str, 
        new_status: str
    ) -> Tuple[bool, str]:
        """Validate status transition"""
        
        allowed = STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            return False, f"Khong the chuyen tu '{current_status}' sang '{new_status}'. Cho phep: {allowed}"
        
        return True, ""
    
    def validate_task_complete(
        self,
        outcome: str,
        outcome_notes: str
    ) -> Tuple[bool, str]:
        """Validate task completion - outcome and notes required"""
        
        if not outcome:
            return False, "Phai chon ket qua (outcome)"
        
        valid_outcomes = [o.value for o in TaskOutcome]
        if outcome not in valid_outcomes:
            return False, f"Outcome khong hop le. Cho phep: {valid_outcomes}"
        
        if not outcome_notes or not outcome_notes.strip():
            return False, "Phai ghi chu ket qua (outcome_notes)"
        
        return True, ""
    
    # ============================================
    # TASK CRUD
    # ============================================
    
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new task with validation"""
        
        # Validate
        is_valid, error = self.validate_task_create(task_data)
        if not is_valid:
            raise ValueError(error)
        
        # Generate ID and code
        task_id = str(uuid.uuid4())
        task_code = await self.generate_task_code()
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Calculate priority score
        priority_score = self.calculate_priority_score(
            task_data.get("priority", "medium"),
            task_data.get("due_at"),
            task_data.get("related_entity_type"),
            task_data.get("task_type", "other")
        )
        
        # Build task document
        task_doc = {
            "id": task_id,
            "code": task_code,
            
            # Type
            "task_type": task_data.get("task_type", "other"),
            
            # Identity
            "title": task_data.get("title"),
            "description": task_data.get("description"),
            
            # Entity
            "related_entity_type": task_data.get("related_entity_type"),
            "related_entity_id": task_data.get("related_entity_id"),
            "related_customer_id": task_data.get("related_customer_id"),
            
            # Owner
            "owner_id": task_data.get("owner_id"),
            "assigned_by": task_data.get("assigned_by"),
            
            # Deadline
            "due_at": task_data.get("due_at"),
            "start_at": task_data.get("start_at"),
            "reminder_at": task_data.get("reminder_at"),
            
            # Status & Priority
            "status": TaskStatus.NEW.value,
            "priority": task_data.get("priority", TaskPriority.MEDIUM.value),
            "priority_score": priority_score,
            
            # Outcome
            "completed_at": None,
            "outcome": None,
            "outcome_notes": None,
            
            # Chain
            "parent_task_id": task_data.get("parent_task_id"),
            "next_action_suggestion": task_data.get("next_action_suggestion"),
            "next_task_type": task_data.get("next_task_type"),
            "child_task_ids": [],
            
            # Source
            "source_type": task_data.get("source_type", SourceType.MANUAL.value),
            "source_trigger": task_data.get("source_trigger"),
            
            # Multi-tenant
            "tenant_id": task_data.get("tenant_id"),
            "branch_id": task_data.get("branch_id"),
            "team_id": task_data.get("team_id"),
            
            # Tags
            "tags": task_data.get("tags", []),
            
            # Timestamps
            "created_at": now,
            "updated_at": now
        }
        
        await self.tasks_collection.insert_one(task_doc)
        
        # Log activity
        await self._log_task_activity(task_id, "created", task_data.get("assigned_by"))
        
        # If this task has parent, update parent's child list
        if task_data.get("parent_task_id"):
            await self.tasks_collection.update_one(
                {"id": task_data["parent_task_id"]},
                {"$push": {"child_task_ids": task_id}}
            )
        
        return task_doc
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task by ID"""
        task = await self.tasks_collection.find_one(
            {"id": task_id},
            {"_id": 0}
        )
        if task:
            task = await self._enrich_task(task)
        return task
    
    async def get_task_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Get task by code"""
        task = await self.tasks_collection.find_one(
            {"code": code},
            {"_id": 0}
        )
        if task:
            task = await self._enrich_task(task)
        return task
    
    async def update_task(
        self, 
        task_id: str, 
        update_data: Dict[str, Any],
        updated_by: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update task"""
        
        task = await self.tasks_collection.find_one({"id": task_id})
        if not task:
            return None
        
        # Check if locked
        if task["status"] in LOCKED_STATUSES:
            raise ValueError(f"Khong the sua task o trang thai '{task['status']}'")
        
        # Prepare update
        update_doc = {k: v for k, v in update_data.items() if v is not None}
        update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Recalculate priority score if relevant fields changed
        if any(k in update_doc for k in ["priority", "due_at", "related_entity_type", "task_type"]):
            update_doc["priority_score"] = self.calculate_priority_score(
                update_doc.get("priority", task["priority"]),
                update_doc.get("due_at", task["due_at"]),
                update_doc.get("related_entity_type", task["related_entity_type"]),
                update_doc.get("task_type", task["task_type"])
            )
        
        await self.tasks_collection.update_one(
            {"id": task_id},
            {"$set": update_doc}
        )
        
        # Log activity
        await self._log_task_activity(task_id, "updated", updated_by, update_doc)
        
        return await self.get_task(task_id)
    
    async def change_task_status(
        self,
        task_id: str,
        new_status: str,
        reason: Optional[str] = None,
        changed_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Change task status with validation"""
        
        task = await self.tasks_collection.find_one({"id": task_id})
        if not task:
            raise ValueError("Task khong ton tai")
        
        current_status = task["status"]
        
        # Validate transition
        is_valid, error = self.validate_status_transition(current_status, new_status)
        if not is_valid:
            raise ValueError(error)
        
        # Update
        now = datetime.now(timezone.utc).isoformat()
        update_doc = {
            "status": new_status,
            "updated_at": now
        }
        
        await self.tasks_collection.update_one(
            {"id": task_id},
            {"$set": update_doc}
        )
        
        # Log activity
        await self._log_task_activity(
            task_id, 
            "status_changed", 
            changed_by,
            {"from": current_status, "to": new_status, "reason": reason}
        )
        
        return await self.get_task(task_id)
    
    async def complete_task(
        self,
        task_id: str,
        outcome: str,
        outcome_notes: str,
        completed_by: Optional[str] = None,
        create_next_task: bool = False,
        next_task_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Complete task with required outcome"""
        
        # Validate
        is_valid, error = self.validate_task_complete(outcome, outcome_notes)
        if not is_valid:
            raise ValueError(error)
        
        task = await self.tasks_collection.find_one({"id": task_id})
        if not task:
            raise ValueError("Task khong ton tai")
        
        # Update
        now = datetime.now(timezone.utc).isoformat()
        update_doc = {
            "status": TaskStatus.COMPLETED.value,
            "completed_at": now,
            "outcome": outcome,
            "outcome_notes": outcome_notes,
            "updated_at": now
        }
        
        await self.tasks_collection.update_one(
            {"id": task_id},
            {"$set": update_doc}
        )
        
        # Log activity
        await self._log_task_activity(
            task_id,
            "completed",
            completed_by,
            {"outcome": outcome, "outcome_notes": outcome_notes}
        )
        
        # Create next task if requested
        next_task = None
        if create_next_task and next_task_data:
            next_task_data["parent_task_id"] = task_id
            next_task_data["source_type"] = SourceType.CHAIN.value
            next_task_data["source_trigger"] = f"completed:{task_id}"
            
            # Default owner to same owner
            if not next_task_data.get("owner_id"):
                next_task_data["owner_id"] = task["owner_id"]
            
            # Default entity to same entity
            if not next_task_data.get("related_entity_type"):
                next_task_data["related_entity_type"] = task["related_entity_type"]
            if not next_task_data.get("related_entity_id"):
                next_task_data["related_entity_id"] = task["related_entity_id"]
            
            next_task = await self.create_task(next_task_data)
        
        result = await self.get_task(task_id)
        if next_task:
            result["next_task_created"] = next_task
        
        return result
    
    async def reschedule_task(
        self,
        task_id: str,
        new_due_at: str,
        reason: str,
        rescheduled_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Reschedule task"""
        
        task = await self.tasks_collection.find_one({"id": task_id})
        if not task:
            raise ValueError("Task khong ton tai")
        
        if task["status"] in LOCKED_STATUSES:
            raise ValueError(f"Khong the doi lich task o trang thai '{task['status']}'")
        
        old_due_at = task["due_at"]
        now = datetime.now(timezone.utc).isoformat()
        
        # Recalculate priority score
        priority_score = self.calculate_priority_score(
            task["priority"],
            new_due_at,
            task["related_entity_type"],
            task["task_type"]
        )
        
        update_doc = {
            "due_at": new_due_at,
            "priority_score": priority_score,
            "updated_at": now
        }
        
        # If was overdue, change back to in_progress
        if task["status"] == TaskStatus.OVERDUE.value:
            update_doc["status"] = TaskStatus.IN_PROGRESS.value
        
        await self.tasks_collection.update_one(
            {"id": task_id},
            {"$set": update_doc}
        )
        
        # Log activity
        await self._log_task_activity(
            task_id,
            "rescheduled",
            rescheduled_by,
            {"from": old_due_at, "to": new_due_at, "reason": reason}
        )
        
        return await self.get_task(task_id)
    
    # ============================================
    # TASK SEARCH & LIST
    # ============================================
    
    async def search_tasks(
        self,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 50,
        sort_by: str = "priority_score",
        sort_order: str = "desc"
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Search tasks with filters"""
        
        query: Dict[str, Any] = {}
        
        # Text search
        if filters.get("search"):
            search_term = filters["search"]
            query["$or"] = [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"code": {"$regex": search_term, "$options": "i"}}
            ]
        
        # Task types
        if filters.get("task_types"):
            query["task_type"] = {"$in": filters["task_types"]}
        
        # Statuses
        if filters.get("statuses"):
            query["status"] = {"$in": filters["statuses"]}
        
        # Priorities
        if filters.get("priorities"):
            query["priority"] = {"$in": filters["priorities"]}
        
        # Entity
        if filters.get("entity_type"):
            query["related_entity_type"] = filters["entity_type"]
        if filters.get("entity_id"):
            query["related_entity_id"] = filters["entity_id"]
        
        # Owner
        if filters.get("owner_id"):
            query["owner_id"] = filters["owner_id"]
        
        # Team/Branch
        if filters.get("team_id"):
            query["team_id"] = filters["team_id"]
        if filters.get("branch_id"):
            query["branch_id"] = filters["branch_id"]
        
        # Date filters
        if filters.get("due_from"):
            query.setdefault("due_at", {})["$gte"] = filters["due_from"]
        if filters.get("due_to"):
            query.setdefault("due_at", {})["$lte"] = filters["due_to"]
        
        # Overdue filter
        if filters.get("is_overdue"):
            now = datetime.now(timezone.utc).isoformat()
            query["due_at"] = {"$lt": now}
            query["status"] = {"$nin": ["completed", "cancelled", "archived"]}
        
        # Source
        if filters.get("source_type"):
            query["source_type"] = filters["source_type"]
        
        # Sort
        sort_direction = -1 if sort_order == "desc" else 1
        
        # Get total
        total = await self.tasks_collection.count_documents(query)
        
        # Get tasks
        cursor = self.tasks_collection.find(
            query, 
            {"_id": 0}
        ).sort(
            sort_by, sort_direction
        ).skip(skip).limit(limit)
        
        tasks = await cursor.to_list(length=limit)
        
        # Enrich tasks
        enriched_tasks = []
        for task in tasks:
            enriched = await self._enrich_task(task)
            enriched_tasks.append(enriched)
        
        return enriched_tasks, total
    
    # ============================================
    # DAILY WORKBOARD
    # ============================================
    
    async def get_daily_workboard(
        self,
        user_id: str,
        date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get daily workboard for user"""
        
        if date:
            target_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
        else:
            target_date = datetime.now(timezone.utc)
        
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        end_of_week = start_of_day + timedelta(days=7)
        
        now = datetime.now(timezone.utc)
        
        # Base query for user's active tasks
        base_query = {
            "owner_id": user_id,
            "status": {"$nin": ["completed", "cancelled", "archived"]}
        }
        
        # Get overdue tasks
        overdue_query = {
            **base_query,
            "due_at": {"$lt": now.isoformat()}
        }
        overdue_tasks = await self.tasks_collection.find(
            overdue_query, {"_id": 0}
        ).sort("priority_score", -1).to_list(50)
        
        # Get today's tasks
        today_query = {
            **base_query,
            "due_at": {
                "$gte": start_of_day.isoformat(),
                "$lt": end_of_day.isoformat()
            }
        }
        today_tasks = await self.tasks_collection.find(
            today_query, {"_id": 0}
        ).sort("due_at", 1).to_list(50)
        
        # Get upcoming tasks (next 3 days, excluding today and overdue)
        upcoming_query = {
            **base_query,
            "due_at": {
                "$gte": end_of_day.isoformat(),
                "$lt": (start_of_day + timedelta(days=4)).isoformat()
            }
        }
        upcoming_tasks = await self.tasks_collection.find(
            upcoming_query, {"_id": 0}
        ).sort("due_at", 1).to_list(20)
        
        # Get completed today
        completed_today_query = {
            "owner_id": user_id,
            "status": "completed",
            "completed_at": {
                "$gte": start_of_day.isoformat(),
                "$lt": end_of_day.isoformat()
            }
        }
        completed_today_count = await self.tasks_collection.count_documents(completed_today_query)
        
        # Get recent activities
        recent_activities = await self.tasks_collection.find(
            completed_today_query,
            {"_id": 0, "id": 1, "title": 1, "completed_at": 1, "outcome": 1, "outcome_notes": 1}
        ).sort("completed_at", -1).limit(5).to_list(5)
        
        # Total this week
        week_query = {
            "owner_id": user_id,
            "status": {"$nin": ["cancelled", "archived"]},
            "due_at": {
                "$gte": start_of_day.isoformat(),
                "$lt": end_of_week.isoformat()
            }
        }
        total_this_week = await self.tasks_collection.count_documents(week_query)
        
        # Build response
        greeting = self._get_greeting()
        date_display = target_date.strftime("%A, %d/%m/%Y")
        
        # Enrich and convert tasks
        enriched_overdue = []
        for task in overdue_tasks:
            enriched = await self._enrich_task_for_workboard(task)
            enriched_overdue.append(enriched)
        
        enriched_today = []
        for task in today_tasks:
            enriched = await self._enrich_task_for_workboard(task)
            enriched_today.append(enriched)
        
        enriched_upcoming = []
        for task in upcoming_tasks:
            enriched = await self._enrich_task_for_workboard(task)
            enriched_upcoming.append(enriched)
        
        # Enrich recent activities
        enriched_activities = []
        for activity in recent_activities:
            outcome_config = TASK_OUTCOME_CONFIG.get(activity.get("outcome", ""), {})
            enriched_activities.append({
                "id": activity["id"],
                "title": activity["title"],
                "completed_at": activity.get("completed_at", ""),
                "outcome": activity.get("outcome", ""),
                "outcome_label": outcome_config.get("label", ""),
                "outcome_notes": activity.get("outcome_notes")
            })
        
        return {
            "greeting": greeting,
            "date_display": date_display,
            "stats": {
                "overdue_count": len(overdue_tasks),
                "today_count": len(today_tasks),
                "completed_today": completed_today_count,
                "total_this_week": total_this_week
            },
            "overdue_tasks": enriched_overdue,
            "today_tasks": enriched_today,
            "upcoming_tasks": enriched_upcoming,
            "recent_activities": enriched_activities
        }
    
    def _get_greeting(self) -> str:
        """Get time-based greeting"""
        hour = datetime.now(timezone.utc).hour + 7  # Vietnam timezone
        if hour < 12:
            return "Chao buoi sang"
        elif hour < 18:
            return "Chao buoi chieu"
        else:
            return "Chao buoi toi"
    
    # ============================================
    # MANAGER WORKLOAD
    # ============================================
    
    async def get_manager_workload(
        self,
        team_id: Optional[str] = None,
        branch_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get manager workload dashboard"""
        
        # Build base query
        base_query: Dict[str, Any] = {}
        if team_id:
            base_query["team_id"] = team_id
        if branch_id:
            base_query["branch_id"] = branch_id
        
        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_week = start_of_day - timedelta(days=start_of_day.weekday())
        
        # Get all users with tasks
        pipeline = [
            {"$match": {**base_query, "status": {"$nin": ["archived"]}}},
            {"$group": {
                "_id": "$owner_id",
                "total_active": {
                    "$sum": {"$cond": [{"$in": ["$status", ["new", "pending", "in_progress", "waiting_external", "blocked", "overdue"]]}, 1, 0]}
                },
                "in_progress": {
                    "$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}
                },
                "overdue": {
                    "$sum": {"$cond": [
                        {"$and": [
                            {"$lt": ["$due_at", now.isoformat()]},
                            {"$not": {"$in": ["$status", ["completed", "cancelled", "archived"]]}}
                        ]},
                        1, 0
                    ]}
                }
            }}
        ]
        
        user_stats = await self.tasks_collection.aggregate(pipeline).to_list(100)
        
        # Get completed today/this week per user
        users = []
        total_team_tasks = 0
        total_overdue = 0
        total_completed_today = 0
        
        for stat in user_stats:
            user_id = stat["_id"]
            if not user_id:
                continue
            
            # Get completed counts
            completed_today = await self.tasks_collection.count_documents({
                **base_query,
                "owner_id": user_id,
                "status": "completed",
                "completed_at": {"$gte": start_of_day.isoformat()}
            })
            
            completed_week = await self.tasks_collection.count_documents({
                **base_query,
                "owner_id": user_id,
                "status": "completed",
                "completed_at": {"$gte": start_of_week.isoformat()}
            })
            
            # Calculate completion rate
            total_assigned_week = await self.tasks_collection.count_documents({
                **base_query,
                "owner_id": user_id,
                "created_at": {"$gte": start_of_week.isoformat()}
            })
            
            completion_rate = (completed_week / total_assigned_week * 100) if total_assigned_week > 0 else 0
            
            users.append({
                "user_id": user_id,
                "user_name": await self._get_user_name(user_id),
                "total_active": stat["total_active"],
                "in_progress": stat["in_progress"],
                "overdue": stat["overdue"],
                "completed_today": completed_today,
                "completed_this_week": completed_week,
                "completion_rate": round(completion_rate, 1),
                "is_overloaded": stat["total_active"] > 15,
                "has_overdue": stat["overdue"] > 0
            })
            
            total_team_tasks += stat["total_active"]
            total_overdue += stat["overdue"]
            total_completed_today += completed_today
        
        # Get bottleneck alerts
        bottleneck_alerts = await self._get_bottleneck_alerts(base_query)
        
        # Team completion rate
        team_completion_rate = sum(u["completion_rate"] for u in users) / len(users) if users else 0
        
        return {
            "team_id": team_id,
            "total_team_tasks": total_team_tasks,
            "total_overdue": total_overdue,
            "total_completed_today": total_completed_today,
            "team_completion_rate": round(team_completion_rate, 1),
            "users": sorted(users, key=lambda x: x["overdue"], reverse=True),
            "bottleneck_alerts": bottleneck_alerts
        }
    
    async def _get_bottleneck_alerts(self, base_query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get bottleneck alerts"""
        
        alerts = []
        now = datetime.now(timezone.utc)
        
        # Check stale leads (3 days no activity)
        lead_threshold = (now - timedelta(days=3)).isoformat()
        stale_leads = await self.tasks_collection.count_documents({
            **base_query,
            "related_entity_type": "lead",
            "status": {"$nin": ["completed", "cancelled", "archived"]},
            "updated_at": {"$lt": lead_threshold}
        })
        
        if stale_leads > 0:
            alerts.append({
                "alert_type": "stale_leads",
                "alert_level": "critical" if stale_leads > 5 else "warning",
                "title": "Lead khong duoc follow-up",
                "description": f"{stale_leads} lead > 3 ngay khong co hoat dong",
                "count": stale_leads
            })
        
        # Check stale deals (5 days no activity)
        deal_threshold = (now - timedelta(days=5)).isoformat()
        stale_deals = await self.tasks_collection.count_documents({
            **base_query,
            "related_entity_type": "deal",
            "status": {"$nin": ["completed", "cancelled", "archived"]},
            "updated_at": {"$lt": deal_threshold}
        })
        
        if stale_deals > 0:
            alerts.append({
                "alert_type": "stale_deals",
                "alert_level": "critical" if stale_deals > 3 else "warning",
                "title": "Deal bi ket",
                "description": f"{stale_deals} deal > 5 ngay khong co hoat dong",
                "count": stale_deals
            })
        
        # Check overdue tasks
        overdue_critical = await self.tasks_collection.count_documents({
            **base_query,
            "due_at": {"$lt": (now - timedelta(days=2)).isoformat()},
            "status": {"$nin": ["completed", "cancelled", "archived"]}
        })
        
        if overdue_critical > 0:
            alerts.append({
                "alert_type": "critical_overdue",
                "alert_level": "critical",
                "title": "Task qua han nghiem trong",
                "description": f"{overdue_critical} task qua han > 2 ngay",
                "count": overdue_critical
            })
        
        return alerts
    
    # ============================================
    # NEXT BEST ACTIONS
    # ============================================
    
    async def get_next_best_actions(
        self,
        user_id: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get next best actions for user"""
        
        now = datetime.now(timezone.utc)
        
        # Get user's active tasks sorted by priority score
        tasks = await self.tasks_collection.find(
            {
                "owner_id": user_id,
                "status": {"$nin": ["completed", "cancelled", "archived"]}
            },
            {"_id": 0}
        ).sort("priority_score", -1).limit(limit).to_list(limit)
        
        urgent_actions = []
        important_actions = []
        
        for task in tasks:
            enriched = await self._enrich_task(task)
            
            # Determine urgency
            due_at = datetime.fromisoformat(task["due_at"].replace("Z", "+00:00"))
            hours_until_due = (due_at - now).total_seconds() / 3600
            
            if hours_until_due < 0:
                urgency_level = "critical"
                urgency_reason = f"Qua han {abs(int(hours_until_due))} gio"
            elif hours_until_due < 4:
                urgency_level = "critical"
                urgency_reason = f"Con {int(hours_until_due * 60)} phut"
            elif hours_until_due < 24:
                urgency_level = "high"
                urgency_reason = f"Con {int(hours_until_due)} gio"
            else:
                urgency_level = "medium"
                urgency_reason = f"Han: {due_at.strftime('%d/%m %H:%M')}"
            
            action = {
                "task_id": task["id"],
                "task_code": task["code"],
                "task_type": task["task_type"],
                "task_type_label": TASK_TYPE_CONFIG.get(task["task_type"], {}).get("label", ""),
                "task_type_icon": TASK_TYPE_CONFIG.get(task["task_type"], {}).get("icon", ""),
                "title": task["title"],
                "entity_type": task["related_entity_type"],
                "entity_id": task["related_entity_id"],
                "entity_name": enriched.get("related_entity_name", ""),
                "customer_name": enriched.get("related_customer_name", ""),
                "priority_score": task["priority_score"],
                "urgency_level": urgency_level,
                "urgency_reason": urgency_reason,
                "suggested_actions": ["complete", "reschedule"]
            }
            
            if task["priority_score"] >= 70:
                urgent_actions.append(action)
            else:
                important_actions.append(action)
        
        return {
            "urgent_actions": urgent_actions,
            "important_actions": important_actions,
            "total_pending": len(tasks)
        }
    
    # ============================================
    # TASKS BY ENTITY
    # ============================================
    
    async def get_tasks_for_entity(
        self,
        entity_type: str,
        entity_id: str,
        include_completed: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all tasks for a specific entity"""
        
        query = {
            "related_entity_type": entity_type,
            "related_entity_id": entity_id
        }
        
        if not include_completed:
            query["status"] = {"$nin": ["completed", "cancelled", "archived"]}
        
        tasks = await self.tasks_collection.find(
            query, {"_id": 0}
        ).sort("due_at", 1).to_list(100)
        
        enriched = []
        for task in tasks:
            enriched.append(await self._enrich_task(task))
        
        return enriched
    
    # ============================================
    # AUTO TASK TRIGGER
    # ============================================
    
    async def trigger_auto_task(
        self,
        event: str,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any],
        condition: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Trigger auto task generation based on event"""
        
        rules = AUTO_TASK_RULES_BY_TRIGGER.get(event, [])
        created_tasks = []
        
        for rule in rules:
            if not rule.get("is_active", True):
                continue
            
            # Check condition
            if rule.get("trigger_condition"):
                if condition:
                    match = all(
                        condition.get(k) == v 
                        for k, v in rule["trigger_condition"].items()
                    )
                    if not match:
                        continue
                else:
                    continue
            
            # Calculate due date
            due_at = self._calculate_auto_task_due(rule, entity_data)
            
            # Determine assignee
            assignee_id = self._determine_assignee(rule, entity_data)
            
            # Build title from template
            title = rule["title_template"].format(**entity_data)
            
            # Create task
            task_data = {
                "task_type": rule["task_type"],
                "title": title,
                "description": rule.get("description_template", "").format(**entity_data),
                "related_entity_type": entity_type,
                "related_entity_id": entity_id,
                "related_customer_id": entity_data.get("contact_id") or entity_data.get("customer_id"),
                "owner_id": assignee_id,
                "due_at": due_at,
                "priority": rule.get("priority", "medium"),
                "source_type": SourceType.AUTOMATION.value,
                "source_trigger": event
            }
            
            try:
                task = await self.create_task(task_data)
                created_tasks.append(task)
            except Exception as e:
                print(f"Auto task creation failed: {e}")
        
        return created_tasks
    
    def _calculate_auto_task_due(
        self, 
        rule: Dict[str, Any], 
        entity_data: Dict[str, Any]
    ) -> str:
        """Calculate due date for auto task"""
        
        now = datetime.now(timezone.utc)
        due_rule = rule.get("due_rule", "offset_hours")
        due_value = rule.get("due_value", 24)
        
        if due_rule == "offset_minutes":
            due_at = now + timedelta(minutes=due_value)
        elif due_rule == "offset_hours":
            due_at = now + timedelta(hours=due_value)
        elif due_rule == "offset_days":
            due_at = now + timedelta(days=due_value)
        elif due_rule == "entity_deadline":
            deadline = entity_data.get("deadline") or entity_data.get("due_date")
            if deadline:
                due_at = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
            else:
                due_at = now + timedelta(days=1)
        elif due_rule == "end_of_day":
            due_at = now.replace(hour=23, minute=59, second=59)
        else:
            due_at = now + timedelta(hours=24)
        
        return due_at.isoformat()
    
    def _determine_assignee(
        self, 
        rule: Dict[str, Any], 
        entity_data: Dict[str, Any]
    ) -> str:
        """Determine assignee for auto task"""
        
        assignee_rule = rule.get("assignee_rule", "entity_owner")
        
        if assignee_rule == "entity_owner":
            return entity_data.get("owner_id") or entity_data.get("assigned_to") or "system"
        elif assignee_rule == "entity_sales":
            return entity_data.get("sales_id") or entity_data.get("assigned_to") or "system"
        elif assignee_rule == "specific_user":
            return rule.get("assignee_user_id", "system")
        else:
            return entity_data.get("owner_id") or "system"
    
    # ============================================
    # HELPER METHODS
    # ============================================
    
    async def _enrich_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich task with labels and resolved names"""
        
        now = datetime.now(timezone.utc)
        
        # Task type
        task_type_config = TASK_TYPE_CONFIG.get(task.get("task_type", "other"), {})
        task["task_type_label"] = task_type_config.get("label", "")
        task["task_type_icon"] = task_type_config.get("icon", "")
        task["task_category"] = task_type_config.get("category", "general")
        
        # Status
        status_config = TASK_STATUS_CONFIG.get(task.get("status", "new"), {})
        task["status_label"] = status_config.get("label", "")
        task["status_color"] = status_config.get("color", "gray")
        
        # Priority
        priority_config = TASK_PRIORITY_CONFIG.get(task.get("priority", "medium"), {})
        task["priority_label"] = priority_config.get("label", "")
        task["priority_color"] = priority_config.get("color", "gray")
        
        # Outcome
        if task.get("outcome"):
            outcome_config = TASK_OUTCOME_CONFIG.get(task["outcome"], {})
            task["outcome_label"] = outcome_config.get("label", "")
        
        # Source
        source_config = SOURCE_TYPE_CONFIG.get(task.get("source_type", "manual"), {})
        task["source_type_label"] = source_config.get("label", "")
        
        # Calculate time flags
        if task.get("due_at"):
            due_at = datetime.fromisoformat(task["due_at"].replace("Z", "+00:00"))
            hours_until_due = (due_at - now).total_seconds() / 3600
            
            task["hours_until_due"] = round(hours_until_due, 1)
            task["is_overdue"] = hours_until_due < 0 and task["status"] not in ["completed", "cancelled", "archived"]
            task["is_due_today"] = 0 <= hours_until_due < 24
            task["is_due_soon"] = 0 <= hours_until_due < 4
        
        # Resolve names (placeholder - integrate with actual services)
        task["owner_name"] = await self._get_user_name(task.get("owner_id"))
        task["assigned_by_name"] = await self._get_user_name(task.get("assigned_by"))
        task["related_entity_name"] = await self._get_entity_name(
            task.get("related_entity_type"),
            task.get("related_entity_id")
        )
        task["related_customer_name"] = await self._get_customer_name(task.get("related_customer_id"))
        
        return task
    
    async def _enrich_task_for_workboard(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich task for workboard display"""
        
        enriched = await self._enrich_task(task)
        
        # Extract time for display
        due_time = ""
        if task.get("due_at"):
            due_at = datetime.fromisoformat(task["due_at"].replace("Z", "+00:00"))
            due_time = due_at.strftime("%H:%M")
        
        return {
            "id": task["id"],
            "code": task["code"],
            "task_type": task["task_type"],
            "task_type_label": enriched.get("task_type_label", ""),
            "task_type_icon": enriched.get("task_type_icon", ""),
            "title": task["title"],
            "related_entity_type": task["related_entity_type"],
            "related_entity_id": task["related_entity_id"],
            "related_entity_name": enriched.get("related_entity_name", ""),
            "customer_name": enriched.get("related_customer_name", ""),
            "due_at": task["due_at"],
            "due_time": due_time,
            "is_overdue": enriched.get("is_overdue", False),
            "hours_until_due": enriched.get("hours_until_due"),
            "status": task["status"],
            "status_label": enriched.get("status_label", ""),
            "status_color": enriched.get("status_color", "gray"),
            "priority": task["priority"],
            "priority_label": enriched.get("priority_label", ""),
            "priority_color": enriched.get("priority_color", "gray"),
            "priority_score": task.get("priority_score", 0)
        }
    
    async def _get_user_name(self, user_id: Optional[str]) -> str:
        """Get user name by ID"""
        if not user_id:
            return ""
        
        user = await self.db["users"].find_one({"id": user_id}, {"_id": 0, "name": 1, "full_name": 1})
        if user:
            return user.get("full_name") or user.get("name") or ""
        return ""
    
    async def _get_customer_name(self, customer_id: Optional[str]) -> str:
        """Get customer name by ID"""
        if not customer_id:
            return ""
        
        # Try contacts collection
        contact = await self.db["contacts"].find_one({"id": customer_id}, {"_id": 0, "full_name": 1})
        if contact:
            return contact.get("full_name", "")
        
        return ""
    
    async def _get_entity_name(self, entity_type: Optional[str], entity_id: Optional[str]) -> str:
        """Get entity name by type and ID"""
        if not entity_type or not entity_id:
            return ""
        
        collection_map = {
            "lead": "leads",
            "contact": "contacts",
            "deal": "deals",
            "booking": "hard_bookings",
            "contract": "contracts",
            "project": "projects_master",
            "product": "products"
        }
        
        collection_name = collection_map.get(entity_type)
        if not collection_name:
            return ""
        
        entity = await self.db[collection_name].find_one(
            {"id": entity_id}, 
            {"_id": 0, "name": 1, "title": 1, "code": 1, "full_name": 1}
        )
        
        if entity:
            return entity.get("name") or entity.get("title") or entity.get("code") or entity.get("full_name") or ""
        
        return ""
    
    async def _log_task_activity(
        self,
        task_id: str,
        action: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log task activity"""
        
        activity = {
            "id": str(uuid.uuid4()),
            "task_id": task_id,
            "action": action,
            "user_id": user_id,
            "details": details or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.task_activities.insert_one(activity)
    
    # ============================================
    # OVERDUE DETECTION (for background job)
    # ============================================
    
    async def mark_overdue_tasks(self) -> int:
        """Mark tasks as overdue - run periodically"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.tasks_collection.update_many(
            {
                "due_at": {"$lt": now},
                "status": {"$in": ["new", "pending", "in_progress", "waiting_external", "blocked"]}
            },
            {
                "$set": {
                    "status": TaskStatus.OVERDUE.value,
                    "updated_at": now
                }
            }
        )
        
        return result.modified_count
