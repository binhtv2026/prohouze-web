"""
ProHouzing Task Management API
APIs cho Module Công việc: Tasks, Projects, Calendar, Reminders
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from task_models import (
    TaskStatus, TaskPriority, TaskType, ReminderType, EventType,
    TaskCreate, TaskResponse,
    TaskCommentCreate, TaskCommentResponse,
    CalendarEventCreate, CalendarEventResponse,
    ReminderCreate, ReminderResponse,
    ProjectCreate, ProjectResponse
)

task_router = APIRouter(prefix="/tasks", tags=["Task Management"])

from server import db, get_current_user

# ==================== PROJECT/BOARD APIs ====================

@task_router.post("/projects", response_model=ProjectResponse)
async def create_project(
    data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo project/board mới"""
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get manager info
    manager_name = None
    if data.manager_id:
        manager = await db.users.find_one({"id": data.manager_id}, {"_id": 0, "full_name": 1})
        manager_name = manager["full_name"] if manager else None
    
    # Get members info
    members = []
    for member_id in data.member_ids:
        member = await db.users.find_one({"id": member_id}, {"_id": 0, "id": 1, "full_name": 1, "avatar": 1})
        if member:
            members.append(member)
    
    project_doc = {
        "id": project_id,
        "name": data.name,
        "code": data.code,
        "description": data.description,
        
        "start_date": data.start_date,
        "end_date": data.end_date,
        
        "manager_id": data.manager_id,
        "manager_name": manager_name,
        "member_ids": data.member_ids + [current_user["id"]],
        "members": members,
        
        "columns": data.columns,
        
        "total_tasks": 0,
        "completed_tasks": 0,
        "progress": 0,
        
        "color": data.color,
        "is_active": True,
        
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.task_projects.insert_one(project_doc)
    return ProjectResponse(**project_doc)

@task_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách projects"""
    query = {
        "is_active": True,
        "$or": [
            {"member_ids": current_user["id"]},
            {"manager_id": current_user["id"]},
            {"created_by": current_user["id"]}
        ]
    }
    
    projects = await db.task_projects.find(query, {"_id": 0}).to_list(100)
    
    # Update stats
    for project in projects:
        total = await db.tasks.count_documents({"project_id": project["id"]})
        completed = await db.tasks.count_documents({"project_id": project["id"], "status": TaskStatus.DONE.value})
        project["total_tasks"] = total
        project["completed_tasks"] = completed
        project["progress"] = (completed / total * 100) if total > 0 else 0
    
    return [ProjectResponse(**p) for p in projects]

@task_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết project"""
    project = await db.task_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update stats
    total = await db.tasks.count_documents({"project_id": project_id})
    completed = await db.tasks.count_documents({"project_id": project_id, "status": TaskStatus.DONE.value})
    project["total_tasks"] = total
    project["completed_tasks"] = completed
    project["progress"] = (completed / total * 100) if total > 0 else 0
    
    return ProjectResponse(**project)

# ==================== TASK APIs ====================

@task_router.post("", response_model=TaskResponse)
async def create_task(
    data: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo task mới"""
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate task number
    count = await db.tasks.count_documents({})
    task_number = f"TASK-{count + 1:05d}"
    
    # Get assignee info
    assignee_name = None
    if data.assignee_id:
        assignee = await db.users.find_one({"id": data.assignee_id}, {"_id": 0, "full_name": 1})
        assignee_name = assignee["full_name"] if assignee else None
    
    # Get reporter info
    reporter_name = current_user["full_name"]
    if data.reporter_id and data.reporter_id != current_user["id"]:
        reporter = await db.users.find_one({"id": data.reporter_id}, {"_id": 0, "full_name": 1})
        reporter_name = reporter["full_name"] if reporter else current_user["full_name"]
    
    # Get project info
    project_name = None
    if data.project_id:
        project = await db.task_projects.find_one({"id": data.project_id}, {"_id": 0, "name": 1})
        project_name = project["name"] if project else None
    
    # Calculate checklist progress
    checklist_progress = 0
    if data.checklist:
        completed = sum(1 for item in data.checklist if item.get("completed", False))
        checklist_progress = (completed / len(data.checklist) * 100) if data.checklist else 0
    
    task_doc = {
        "id": task_id,
        "task_number": task_number,
        "title": data.title,
        "description": data.description,
        "type": data.type.value,
        "status": data.status.value,
        "priority": data.priority.value,
        
        "assignee_id": data.assignee_id,
        "assignee_name": assignee_name,
        "reporter_id": data.reporter_id or current_user["id"],
        "reporter_name": reporter_name,
        
        "start_date": data.start_date,
        "due_date": data.due_date,
        "completed_date": None,
        "estimated_hours": data.estimated_hours,
        "actual_hours": None,
        
        "project_id": data.project_id,
        "project_name": project_name,
        "parent_task_id": data.parent_task_id,
        "subtasks_count": 0,
        
        "related_lead_id": data.related_lead_id,
        "related_customer_id": data.related_customer_id,
        "related_deal_id": data.related_deal_id,
        
        "labels": data.labels,
        "checklist": data.checklist,
        "checklist_progress": checklist_progress,
        "attachments": data.attachments,
        
        "comments_count": 0,
        
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": None
    }
    
    await db.tasks.insert_one(task_doc)
    
    # Update parent task subtasks count
    if data.parent_task_id:
        await db.tasks.update_one(
            {"id": data.parent_task_id},
            {"$inc": {"subtasks_count": 1}}
        )
    
    return TaskResponse(**task_doc)

@task_router.get("", response_model=List[TaskResponse])
async def get_tasks(
    project_id: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    assignee_id: Optional[str] = None,
    my_tasks: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách tasks"""
    query = {}
    
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status.value
    if priority:
        query["priority"] = priority.value
    if assignee_id:
        query["assignee_id"] = assignee_id
    if my_tasks:
        query["$or"] = [
            {"assignee_id": current_user["id"]},
            {"reporter_id": current_user["id"]}
        ]
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort([("priority", -1), ("due_date", 1)]).to_list(500)
    return [TaskResponse(**t) for t in tasks]

@task_router.get("/kanban/{project_id}")
async def get_kanban_board(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy tasks theo dạng Kanban board"""
    project = await db.task_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = await db.tasks.find({"project_id": project_id}, {"_id": 0}).to_list(500)
    
    # Group by status
    columns = {}
    for col in project.get("columns", []):
        col_id = col["id"]
        columns[col_id] = {
            "id": col_id,
            "title": col["title"],
            "order": col.get("order", 0),
            "tasks": []
        }
    
    for task in tasks:
        status = task["status"]
        if status in columns:
            columns[status]["tasks"].append(TaskResponse(**task))
    
    return {
        "project": ProjectResponse(**project),
        "columns": list(columns.values())
    }

@task_router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật task"""
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    now = datetime.now(timezone.utc).isoformat()
    data["updated_at"] = now
    
    # Update assignee name if changed
    if "assignee_id" in data and data["assignee_id"] != task.get("assignee_id"):
        assignee = await db.users.find_one({"id": data["assignee_id"]}, {"_id": 0, "full_name": 1})
        data["assignee_name"] = assignee["full_name"] if assignee else None
    
    # Update completed date if status changed to done
    if data.get("status") == TaskStatus.DONE.value and task["status"] != TaskStatus.DONE.value:
        data["completed_date"] = now
    
    # Update checklist progress
    if "checklist" in data:
        completed = sum(1 for item in data["checklist"] if item.get("completed", False))
        data["checklist_progress"] = (completed / len(data["checklist"]) * 100) if data["checklist"] else 0
    
    await db.tasks.update_one({"id": task_id}, {"$set": data})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return TaskResponse(**updated_task)

@task_router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa task"""
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update parent subtasks count
    if task.get("parent_task_id"):
        await db.tasks.update_one(
            {"id": task["parent_task_id"]},
            {"$inc": {"subtasks_count": -1}}
        )
    
    await db.tasks.delete_one({"id": task_id})
    
    return {"success": True}

# ==================== TASK COMMENT APIs ====================

@task_router.post("/comments", response_model=TaskCommentResponse)
async def create_task_comment(
    data: TaskCommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Thêm comment vào task"""
    comment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    comment_doc = {
        "id": comment_id,
        "task_id": data.task_id,
        "content": data.content,
        "attachments": data.attachments,
        "mentions": data.mentions,
        
        "created_by": current_user["id"],
        "created_by_name": current_user["full_name"],
        "created_at": now
    }
    
    await db.task_comments.insert_one(comment_doc)
    
    # Update task comments count
    await db.tasks.update_one(
        {"id": data.task_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return TaskCommentResponse(**comment_doc)

@task_router.get("/comments/{task_id}", response_model=List[TaskCommentResponse])
async def get_task_comments(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy comments của task"""
    comments = await db.task_comments.find({"task_id": task_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return [TaskCommentResponse(**c) for c in comments]

# ==================== CALENDAR APIs ====================

@task_router.post("/calendar/events", response_model=CalendarEventResponse)
async def create_calendar_event(
    data: CalendarEventCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo sự kiện calendar"""
    event_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get attendees info
    attendees = []
    for user_id in data.attendees:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "full_name": 1, "email": 1})
        if user:
            attendees.append(user)
    
    event_doc = {
        "id": event_id,
        "title": data.title,
        "type": data.type.value,
        "description": data.description,
        
        "start_time": data.start_time,
        "end_time": data.end_time,
        "all_day": data.all_day,
        
        "location": data.location,
        "meeting_url": data.meeting_url,
        
        "attendees": attendees,
        
        "related_task_id": data.related_task_id,
        "related_lead_id": data.related_lead_id,
        "related_customer_id": data.related_customer_id,
        "related_recruitment_id": data.related_recruitment_id,
        
        "is_recurring": data.is_recurring,
        "recurrence_rule": data.recurrence_rule,
        
        "reminder_minutes": data.reminder_minutes,
        
        "color": data.color,
        
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.calendar_events.insert_one(event_doc)
    return CalendarEventResponse(**event_doc)

@task_router.get("/calendar/events", response_model=List[CalendarEventResponse])
async def get_calendar_events(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy sự kiện calendar trong khoảng thời gian"""
    query = {
        "$or": [
            {"created_by": current_user["id"]},
            {"attendees.id": current_user["id"]}
        ],
        "start_time": {"$gte": start_date, "$lte": end_date}
    }
    
    events = await db.calendar_events.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)
    return [CalendarEventResponse(**e) for e in events]

@task_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa sự kiện"""
    await db.calendar_events.delete_one({"id": event_id})
    return {"success": True}

# ==================== REMINDER APIs ====================

@task_router.post("/reminders", response_model=ReminderResponse)
async def create_reminder(
    data: ReminderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo reminder"""
    reminder_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    reminder_doc = {
        "id": reminder_id,
        "title": data.title,
        "description": data.description,
        "remind_at": data.remind_at,
        "reminder_type": data.reminder_type.value,
        
        "related_task_id": data.related_task_id,
        "related_event_id": data.related_event_id,
        "related_lead_id": data.related_lead_id,
        
        "is_recurring": data.is_recurring,
        "recurrence_rule": data.recurrence_rule,
        
        "is_sent": False,
        "sent_at": None,
        
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.reminders.insert_one(reminder_doc)
    return ReminderResponse(**reminder_doc)

@task_router.get("/reminders", response_model=List[ReminderResponse])
async def get_reminders(
    upcoming: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Lấy reminders"""
    query = {"created_by": current_user["id"]}
    
    if upcoming:
        now = datetime.now(timezone.utc).isoformat()
        query["remind_at"] = {"$gte": now}
        query["is_sent"] = False
    
    reminders = await db.reminders.find(query, {"_id": 0}).sort("remind_at", 1).to_list(100)
    return [ReminderResponse(**r) for r in reminders]

# ==================== DASHBOARD APIs ====================

@task_router.get("/dashboard")
async def get_task_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """Lấy tổng quan công việc"""
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    
    # My tasks stats
    my_tasks = await db.tasks.find(
        {"$or": [{"assignee_id": user_id}, {"reporter_id": user_id}]},
        {"_id": 0}
    ).to_list(1000)
    
    todo_count = sum(1 for t in my_tasks if t["status"] == TaskStatus.TODO.value)
    in_progress_count = sum(1 for t in my_tasks if t["status"] == TaskStatus.IN_PROGRESS.value)
    done_count = sum(1 for t in my_tasks if t["status"] == TaskStatus.DONE.value)
    
    # Overdue tasks
    overdue_count = sum(1 for t in my_tasks if t.get("due_date") and t["due_date"] < today and t["status"] != TaskStatus.DONE.value)
    
    # Due today
    due_today_count = sum(1 for t in my_tasks if t.get("due_date") and t["due_date"].startswith(today))
    
    # High priority
    high_priority_count = sum(1 for t in my_tasks if t["priority"] in [TaskPriority.HIGH.value, TaskPriority.URGENT.value] and t["status"] != TaskStatus.DONE.value)
    
    # Today's events
    events_today = await db.calendar_events.count_documents({
        "$or": [{"created_by": user_id}, {"attendees.id": user_id}],
        "start_time": {"$regex": f"^{today}"}
    })
    
    # Upcoming reminders
    upcoming_reminders = await db.reminders.count_documents({
        "created_by": user_id,
        "is_sent": False,
        "remind_at": {"$lte": (now + timedelta(days=7)).isoformat()}
    })
    
    # Recent tasks
    recent_tasks = await db.tasks.find(
        {"$or": [{"assignee_id": user_id}, {"reporter_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "summary": {
            "total_tasks": len(my_tasks),
            "todo": todo_count,
            "in_progress": in_progress_count,
            "done": done_count,
            "overdue": overdue_count,
            "due_today": due_today_count,
            "high_priority": high_priority_count,
            "events_today": events_today,
            "upcoming_reminders": upcoming_reminders
        },
        "recent_tasks": [TaskResponse(**t) for t in recent_tasks],
        "tasks_by_status": {
            "todo": todo_count,
            "in_progress": in_progress_count,
            "review": sum(1 for t in my_tasks if t["status"] == TaskStatus.REVIEW.value),
            "done": done_count
        },
        "tasks_by_priority": {
            "urgent": sum(1 for t in my_tasks if t["priority"] == TaskPriority.URGENT.value),
            "high": sum(1 for t in my_tasks if t["priority"] == TaskPriority.HIGH.value),
            "medium": sum(1 for t in my_tasks if t["priority"] == TaskPriority.MEDIUM.value),
            "low": sum(1 for t in my_tasks if t["priority"] == TaskPriority.LOW.value)
        }
    }
