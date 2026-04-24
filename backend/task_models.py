"""
ProHouzing Task Management Module
Quản lý Công việc: Tasks, Kanban, Calendar, Reminders
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone

# ==================== ENUMS ====================

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskType(str, Enum):
    TASK = "task"
    BUG = "bug"
    FEATURE = "feature"
    MEETING = "meeting"
    CALL = "call"
    FOLLOW_UP = "follow_up"

class ReminderType(str, Enum):
    NOTIFICATION = "notification"
    EMAIL = "email"
    SMS = "sms"

class EventType(str, Enum):
    MEETING = "meeting"
    CALL = "call"
    DEADLINE = "deadline"
    REMINDER = "reminder"
    TRAINING = "training"
    INTERVIEW = "interview"

# ==================== TASK MODELS ====================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: TaskType = TaskType.TASK
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    
    # Assignment
    assignee_id: Optional[str] = None
    reporter_id: Optional[str] = None
    
    # Dates
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = None
    
    # Relations
    project_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    related_lead_id: Optional[str] = None
    related_customer_id: Optional[str] = None
    related_deal_id: Optional[str] = None
    
    # Labels & Tags
    labels: List[str] = []
    
    # Checklist
    checklist: List[Dict[str, Any]] = []
    
    # Attachments
    attachments: List[str] = []

class TaskResponse(BaseModel):
    id: str
    task_number: str
    title: str
    description: Optional[str] = None
    type: TaskType
    status: TaskStatus
    priority: TaskPriority
    
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    reporter_id: Optional[str] = None
    reporter_name: Optional[str] = None
    
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completed_date: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    parent_task_id: Optional[str] = None
    subtasks_count: int = 0
    
    related_lead_id: Optional[str] = None
    related_customer_id: Optional[str] = None
    related_deal_id: Optional[str] = None
    
    labels: List[str] = []
    checklist: List[Dict[str, Any]] = []
    checklist_progress: float = 0
    attachments: List[str] = []
    
    comments_count: int = 0
    
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

class TaskCommentCreate(BaseModel):
    task_id: str
    content: str
    attachments: List[str] = []
    mentions: List[str] = []

class TaskCommentResponse(BaseModel):
    id: str
    task_id: str
    content: str
    attachments: List[str]
    mentions: List[str]
    
    created_by: str
    created_by_name: str
    created_at: str

# ==================== CALENDAR MODELS ====================

class CalendarEventCreate(BaseModel):
    title: str
    type: EventType
    description: Optional[str] = None
    
    start_time: str
    end_time: str
    all_day: bool = False
    
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    
    attendees: List[str] = []
    
    # Relations
    related_task_id: Optional[str] = None
    related_lead_id: Optional[str] = None
    related_customer_id: Optional[str] = None
    related_recruitment_id: Optional[str] = None
    
    # Recurrence
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None  # RRULE format
    
    # Reminder
    reminder_minutes: List[int] = [15, 60]  # 15 phút, 1 giờ trước
    
    color: Optional[str] = None

class CalendarEventResponse(BaseModel):
    id: str
    title: str
    type: EventType
    description: Optional[str] = None
    
    start_time: str
    end_time: str
    all_day: bool
    
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    
    attendees: List[Dict[str, Any]] = []
    
    related_task_id: Optional[str] = None
    related_lead_id: Optional[str] = None
    related_customer_id: Optional[str] = None
    related_recruitment_id: Optional[str] = None
    
    is_recurring: bool
    recurrence_rule: Optional[str] = None
    
    reminder_minutes: List[int]
    
    color: Optional[str] = None
    
    created_by: str
    created_at: str

# ==================== REMINDER MODELS ====================

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    remind_at: str
    reminder_type: ReminderType = ReminderType.NOTIFICATION
    
    # Relations
    related_task_id: Optional[str] = None
    related_event_id: Optional[str] = None
    related_lead_id: Optional[str] = None
    
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None

class ReminderResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    remind_at: str
    reminder_type: ReminderType
    
    related_task_id: Optional[str] = None
    related_event_id: Optional[str] = None
    related_lead_id: Optional[str] = None
    
    is_recurring: bool
    recurrence_rule: Optional[str] = None
    
    is_sent: bool = False
    sent_at: Optional[str] = None
    
    created_by: str
    created_at: str

# ==================== PROJECT/BOARD MODELS ====================

class ProjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    manager_id: Optional[str] = None
    member_ids: List[str] = []
    
    # Kanban columns
    columns: List[Dict[str, Any]] = [
        {"id": "todo", "title": "Cần làm", "order": 1},
        {"id": "in_progress", "title": "Đang làm", "order": 2},
        {"id": "review", "title": "Đang review", "order": 3},
        {"id": "done", "title": "Hoàn thành", "order": 4}
    ]
    
    color: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    member_ids: List[str]
    members: List[Dict[str, Any]] = []
    
    columns: List[Dict[str, Any]]
    
    total_tasks: int = 0
    completed_tasks: int = 0
    progress: float = 0
    
    color: Optional[str] = None
    is_active: bool = True
    
    created_by: str
    created_at: str
