"""
ProHouzing Work OS Router
Prompt 10/20 - Task, Reminder & Follow-up Operating System

API endpoints for Work OS:
- Task CRUD
- Daily Workboard
- Manager Workload
- Next Best Actions
- Auto Task Triggers
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List
from datetime import datetime, timezone
import os

from motor.motor_asyncio import AsyncIOMotorClient

from config.work_config import (
    TASK_TYPE_CONFIG, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG,
    TASK_OUTCOME_CONFIG, ENTITY_TYPE_CONFIG, SOURCE_TYPE_CONFIG,
    TASK_CATEGORIES
)
from models.work_models import (
    TaskCreate, TaskUpdate, TaskCompleteRequest, TaskRescheduleRequest,
    TaskStatusChangeRequest, TaskResponse, TaskListResponse,
    DailyWorkboardResponse, ManagerWorkloadResponse, NextBestActionsResponse,
    TaskSearchRequest, BulkTaskUpdateRequest, BulkTaskResponse
)
from services.work_service import WorkService


router = APIRouter(prefix="/api/work", tags=["Work OS"])

# Database connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "prohouzing")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Service instance
work_service = WorkService(db)


# ============================================
# CONFIG ENDPOINTS
# ============================================

@router.get("/config/task-types")
async def get_task_types():
    """Get all task types configuration"""
    return [
        {
            "code": code,
            "label": config.get("label", ""),
            "icon": config.get("icon", ""),
            "default_priority": config.get("default_priority", "medium"),
            "default_sla_hours": config.get("default_sla_hours"),
            "auto_generate": config.get("auto_generate", False),
            "category": config.get("category", "general")
        }
        for code, config in TASK_TYPE_CONFIG.items()
    ]


@router.get("/config/task-statuses")
async def get_task_statuses():
    """Get all task statuses configuration"""
    return [
        {
            "code": code,
            "label": config.get("label", ""),
            "color": config.get("color", "gray"),
            "icon": config.get("icon", ""),
            "is_active": config.get("is_active", True),
            "is_final": config.get("is_final", False),
            "show_in_dashboard": config.get("show_in_dashboard", True),
            "order": config.get("order", 0)
        }
        for code, config in TASK_STATUS_CONFIG.items()
    ]


@router.get("/config/task-priorities")
async def get_task_priorities():
    """Get all task priorities configuration"""
    return [
        {
            "code": code,
            "label": config.get("label", ""),
            "color": config.get("color", "gray"),
            "icon": config.get("icon", ""),
            "score_weight": config.get("score_weight", 0),
            "order": config.get("order", 0)
        }
        for code, config in TASK_PRIORITY_CONFIG.items()
    ]


@router.get("/config/task-outcomes")
async def get_task_outcomes():
    """Get all task outcomes configuration"""
    return [
        {
            "code": code,
            "label": config.get("label", ""),
            "color": config.get("color", "gray"),
            "icon": config.get("icon", ""),
            "next_action_required": config.get("next_action_required", False)
        }
        for code, config in TASK_OUTCOME_CONFIG.items()
    ]


@router.get("/config/entity-types")
async def get_entity_types():
    """Get all entity types for task relations"""
    return [
        {
            "code": code,
            "label": config.get("label", ""),
            "icon": config.get("icon", ""),
            "color": config.get("color", "gray")
        }
        for code, config in ENTITY_TYPE_CONFIG.items()
    ]


@router.get("/config/task-categories")
async def get_task_categories():
    """Get task categories"""
    return [
        {
            "code": code,
            "label": config.get("label", ""),
            "icon": config.get("icon", ""),
            "color": config.get("color", "gray"),
            "types": config.get("types", [])
        }
        for code, config in TASK_CATEGORIES.items()
    ]


# ============================================
# TASK CRUD ENDPOINTS
# ============================================

@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """
    Create a new task
    
    REQUIRED fields:
    - title: Task title
    - owner_id: Task owner (responsible person)
    - due_at: Deadline (ISO datetime)
    - related_entity_type: Entity type (lead, deal, booking, contract, etc.)
    - related_entity_id: Entity ID
    """
    try:
        task_data = task.model_dump()
        created_task = await work_service.create_task(task_data)
        return created_task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks(
    search: Optional[str] = None,
    task_types: Optional[str] = None,
    statuses: Optional[str] = None,
    priorities: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    owner_id: Optional[str] = None,
    team_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    due_from: Optional[str] = None,
    due_to: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    source_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    sort_by: str = "priority_score",
    sort_order: str = "desc"
):
    """List tasks with filters"""
    
    filters = {
        "search": search,
        "task_types": task_types.split(",") if task_types else None,
        "statuses": statuses.split(",") if statuses else None,
        "priorities": priorities.split(",") if priorities else None,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "owner_id": owner_id,
        "team_id": team_id,
        "branch_id": branch_id,
        "due_from": due_from,
        "due_to": due_to,
        "is_overdue": is_overdue,
        "source_type": source_type
    }
    
    tasks, total = await work_service.search_tasks(
        filters=filters,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Calculate summary by status
    summary = {}
    for task in tasks:
        status = task.get("status", "unknown")
        summary[status] = summary.get(status, 0) + 1
    
    return TaskListResponse(
        tasks=tasks,
        total=total,
        skip=skip,
        limit=limit,
        summary=summary
    )


@router.get("/tasks/my-day", response_model=DailyWorkboardResponse)
async def get_my_day(
    user_id: str = Query(..., description="User ID for workboard"),
    date: Optional[str] = Query(None, description="Target date (ISO format)")
):
    """
    Get daily workboard for sales user
    
    Returns:
    - Greeting and date
    - Stats (overdue, today, completed, week total)
    - Overdue tasks (sorted by priority)
    - Today's tasks (sorted by time)
    - Upcoming tasks (next 3 days)
    - Recent activities
    """
    try:
        workboard = await work_service.get_daily_workboard(user_id, date)
        return workboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get task by ID"""
    task = await work_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task khong ton tai")
    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    update: TaskUpdate,
    updated_by: Optional[str] = None
):
    """Update task"""
    try:
        task = await work_service.update_task(
            task_id,
            update.model_dump(exclude_none=True),
            updated_by
        )
        if not task:
            raise HTTPException(status_code=404, detail="Task khong ton tai")
        return task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    complete_request: TaskCompleteRequest,
    completed_by: Optional[str] = None
):
    """
    Complete task with REQUIRED outcome
    
    REQUIRED:
    - outcome: Result of task (success, partial, rescheduled, no_answer, customer_refused, not_applicable)
    - outcome_notes: Notes about the result
    
    Optional:
    - create_next_task: Whether to create a follow-up task
    - next_task_type, next_task_title, next_task_due_at: Next task details
    """
    try:
        # Build next task data if requested
        next_task_data = None
        if complete_request.create_next_task:
            next_task_data = {
                "task_type": complete_request.next_task_type,
                "title": complete_request.next_task_title,
                "due_at": complete_request.next_task_due_at,
                "owner_id": complete_request.next_task_owner_id
            }
        
        task = await work_service.complete_task(
            task_id=task_id,
            outcome=complete_request.outcome.value,
            outcome_notes=complete_request.outcome_notes,
            completed_by=completed_by,
            create_next_task=complete_request.create_next_task,
            next_task_data=next_task_data
        )
        return task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/reschedule", response_model=TaskResponse)
async def reschedule_task(
    task_id: str,
    reschedule_request: TaskRescheduleRequest,
    rescheduled_by: Optional[str] = None
):
    """Reschedule task to new date"""
    try:
        task = await work_service.reschedule_task(
            task_id=task_id,
            new_due_at=reschedule_request.new_due_at,
            reason=reschedule_request.reason,
            rescheduled_by=rescheduled_by
        )
        return task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tasks/{task_id}/status", response_model=TaskResponse)
async def change_task_status(
    task_id: str,
    status_request: TaskStatusChangeRequest,
    changed_by: Optional[str] = None
):
    """Change task status"""
    try:
        task = await work_service.change_task_status(
            task_id=task_id,
            new_status=status_request.new_status.value,
            reason=status_request.reason,
            changed_by=changed_by
        )
        return task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# MANAGER ENDPOINTS
# ============================================

@router.get("/manager/workload", response_model=ManagerWorkloadResponse)
async def get_manager_workload(
    team_id: Optional[str] = None,
    branch_id: Optional[str] = None
):
    """
    Get manager workload dashboard
    
    Returns:
    - Team overview stats
    - User workload breakdown
    - Bottleneck alerts
    """
    try:
        workload = await work_service.get_manager_workload(team_id, branch_id)
        return workload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/manager/overdue")
async def get_overdue_tasks(
    team_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    owner_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get overdue tasks for manager view"""
    
    filters = {
        "team_id": team_id,
        "branch_id": branch_id,
        "owner_id": owner_id,
        "is_overdue": True
    }
    
    tasks, total = await work_service.search_tasks(
        filters=filters,
        skip=skip,
        limit=limit,
        sort_by="due_at",
        sort_order="asc"
    )
    
    return {
        "tasks": tasks,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# ============================================
# FOLLOW-UP ENDPOINTS
# ============================================

@router.get("/follow-up/next-actions", response_model=NextBestActionsResponse)
async def get_next_best_actions(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(10, description="Max actions to return")
):
    """
    Get next best actions for user
    
    Returns prioritized list of tasks based on:
    - Priority score
    - Deadline urgency
    - Entity value (booking/contract > deal > lead)
    - Task type urgency
    """
    try:
        actions = await work_service.get_next_best_actions(user_id, limit)
        return actions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/follow-up/entity/{entity_type}/{entity_id}")
async def get_tasks_for_entity(
    entity_type: str,
    entity_id: str,
    include_completed: bool = False
):
    """Get all tasks for a specific entity"""
    try:
        tasks = await work_service.get_tasks_for_entity(
            entity_type=entity_type,
            entity_id=entity_id,
            include_completed=include_completed
        )
        return {"tasks": tasks, "total": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/follow-up/trigger/{event}")
async def trigger_auto_tasks(
    event: str,
    entity_type: str = Body(...),
    entity_id: str = Body(...),
    entity_data: dict = Body(...),
    condition: Optional[dict] = Body(None)
):
    """
    Manually trigger auto task generation
    
    Events:
    - lead_created, lead_stage_changed, lead_no_activity
    - deal_created, deal_stage_changed, deal_no_activity
    - booking_created, booking_confirmed, booking_payment_due
    - contract_draft_created, contract_approved, contract_payment_due
    - site_visit_scheduled, site_visit_completed, missed_call
    """
    try:
        tasks = await work_service.trigger_auto_task(
            event=event,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            condition=condition
        )
        return {
            "triggered_event": event,
            "tasks_created": len(tasks),
            "tasks": tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# BULK OPERATIONS
# ============================================

@router.post("/tasks/bulk/update", response_model=BulkTaskResponse)
async def bulk_update_tasks(
    request: BulkTaskUpdateRequest,
    updated_by: Optional[str] = None
):
    """Bulk update multiple tasks"""
    
    success_count = 0
    failed_count = 0
    failed_ids = []
    errors = []
    
    update_data = request.model_dump(exclude={"task_ids"}, exclude_none=True)
    
    for task_id in request.task_ids:
        try:
            await work_service.update_task(task_id, update_data, updated_by)
            success_count += 1
        except Exception as e:
            failed_count += 1
            failed_ids.append(task_id)
            errors.append(f"{task_id}: {str(e)}")
    
    return BulkTaskResponse(
        success_count=success_count,
        failed_count=failed_count,
        failed_ids=failed_ids,
        errors=errors
    )


# ============================================
# DASHBOARD SUMMARY
# ============================================

@router.get("/dashboard/summary")
async def get_work_dashboard_summary(
    user_id: Optional[str] = None,
    team_id: Optional[str] = None,
    branch_id: Optional[str] = None
):
    """Get work dashboard summary"""
    
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Build query
    query = {"status": {"$nin": ["completed", "cancelled", "archived"]}}
    if user_id:
        query["owner_id"] = user_id
    if team_id:
        query["team_id"] = team_id
    if branch_id:
        query["branch_id"] = branch_id
    
    # Get counts
    total_active = await db["work_tasks"].count_documents(query)
    
    overdue_query = {**query, "due_at": {"$lt": now.isoformat()}}
    overdue_count = await db["work_tasks"].count_documents(overdue_query)
    
    today_query = {
        **query,
        "due_at": {
            "$gte": start_of_day.isoformat(),
            "$lt": (start_of_day.replace(hour=23, minute=59, second=59)).isoformat()
        }
    }
    today_count = await db["work_tasks"].count_documents(today_query)
    
    # Completed today
    completed_query = {
        "status": "completed",
        "completed_at": {"$gte": start_of_day.isoformat()}
    }
    if user_id:
        completed_query["owner_id"] = user_id
    if team_id:
        completed_query["team_id"] = team_id
    
    completed_today = await db["work_tasks"].count_documents(completed_query)
    
    # By status
    by_status_pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    by_status_result = await db["work_tasks"].aggregate(by_status_pipeline).to_list(20)
    by_status = {item["_id"]: item["count"] for item in by_status_result}
    
    # By priority
    by_priority_pipeline = [
        {"$match": query},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    by_priority_result = await db["work_tasks"].aggregate(by_priority_pipeline).to_list(10)
    by_priority = {item["_id"]: item["count"] for item in by_priority_result}
    
    return {
        "total_active": total_active,
        "overdue_count": overdue_count,
        "today_count": today_count,
        "completed_today": completed_today,
        "by_status": by_status,
        "by_priority": by_priority
    }


# ============================================
# BACKGROUND JOB ENDPOINTS (Internal)
# ============================================

@router.post("/internal/mark-overdue")
async def mark_overdue_tasks():
    """Mark overdue tasks - called by background job"""
    try:
        count = await work_service.mark_overdue_tasks()
        return {"marked_overdue": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
