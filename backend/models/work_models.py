"""
ProHouzing Work OS Models
Prompt 10/20 - Task, Reminder & Follow-up Operating System

Pydantic models for:
- Canonical Task
- Task Completion with Outcome
- Reminder
- Daily Workboard
- Manager Workload
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from config.work_config import (
    TaskType, TaskStatus, TaskPriority, TaskOutcome,
    EntityType, SourceType
)


# ============================================
# TASK CREATE MODEL
# ============================================

class TaskCreate(BaseModel):
    """Create a new task (canonical model)"""
    
    # Task type
    task_type: TaskType = TaskType.OTHER
    
    # Identity
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    
    # REQUIRED: Entity relation
    related_entity_type: EntityType
    related_entity_id: str
    related_customer_id: Optional[str] = None
    
    # REQUIRED: Owner
    owner_id: str = Field(..., description="Task owner - REQUIRED")
    assigned_by: Optional[str] = None
    
    # REQUIRED: Deadline
    due_at: str = Field(..., description="Due datetime - REQUIRED (ISO format)")
    start_at: Optional[str] = None
    reminder_at: Optional[str] = None
    
    # Priority
    priority: TaskPriority = TaskPriority.MEDIUM
    
    # Source
    source_type: SourceType = SourceType.MANUAL
    source_trigger: Optional[str] = None
    
    # Chain
    parent_task_id: Optional[str] = None
    next_action_suggestion: Optional[str] = None
    next_task_type: Optional[str] = None
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    
    # Tags
    tags: List[str] = []
    
    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title khong duoc de trong')
        return v.strip()


# ============================================
# TASK UPDATE MODEL
# ============================================

class TaskUpdate(BaseModel):
    """Update task (partial)"""
    
    title: Optional[str] = None
    description: Optional[str] = None
    
    # Can reassign
    owner_id: Optional[str] = None
    
    # Can change deadline
    due_at: Optional[str] = None
    start_at: Optional[str] = None
    reminder_at: Optional[str] = None
    
    # Can change priority
    priority: Optional[TaskPriority] = None
    
    # Can update entity
    related_entity_type: Optional[EntityType] = None
    related_entity_id: Optional[str] = None
    related_customer_id: Optional[str] = None
    
    # Tags
    tags: Optional[List[str]] = None


# ============================================
# TASK COMPLETE MODEL (with outcome)
# ============================================

class TaskCompleteRequest(BaseModel):
    """Complete task with REQUIRED outcome"""
    
    # REQUIRED
    outcome: TaskOutcome
    outcome_notes: str = Field(..., min_length=1, max_length=2000, 
                                description="Outcome notes - REQUIRED")
    
    # Optional: Create next task
    create_next_task: bool = False
    next_task_type: Optional[TaskType] = None
    next_task_title: Optional[str] = None
    next_task_due_at: Optional[str] = None
    next_task_owner_id: Optional[str] = None  # Default to same owner
    
    @field_validator('outcome_notes')
    @classmethod
    def notes_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Ghi chu ket qua khong duoc de trong')
        return v.strip()


# ============================================
# TASK RESCHEDULE MODEL
# ============================================

class TaskRescheduleRequest(BaseModel):
    """Reschedule task to new date"""
    
    new_due_at: str = Field(..., description="New due datetime - REQUIRED")
    reason: str = Field(..., min_length=1, max_length=500, 
                        description="Reschedule reason - REQUIRED")


# ============================================
# TASK STATUS CHANGE MODEL
# ============================================

class TaskStatusChangeRequest(BaseModel):
    """Change task status"""
    
    new_status: TaskStatus
    reason: Optional[str] = None
    blocked_by: Optional[str] = None  # For blocked status


# ============================================
# TASK RESPONSE MODEL
# ============================================

class TaskResponse(BaseModel):
    """Full task response"""
    
    id: str
    code: str  # TASK-YYYYMMDD-XXXX
    
    # Type
    task_type: str
    task_type_label: str = ""
    task_type_icon: str = ""
    task_category: str = ""
    
    # Identity
    title: str
    description: Optional[str] = None
    
    # Entity
    related_entity_type: str
    related_entity_id: str
    related_entity_name: str = ""  # Resolved
    related_customer_id: Optional[str] = None
    related_customer_name: str = ""  # Resolved
    
    # Owner
    owner_id: str
    owner_name: str = ""  # Resolved
    assigned_by: Optional[str] = None
    assigned_by_name: str = ""
    
    # Deadline
    due_at: str
    start_at: Optional[str] = None
    reminder_at: Optional[str] = None
    
    # Status & Priority
    status: str
    status_label: str = ""
    status_color: str = ""
    priority: str
    priority_label: str = ""
    priority_color: str = ""
    priority_score: int = 0  # Dynamic 0-100
    
    # Flags
    is_overdue: bool = False
    is_due_today: bool = False
    is_due_soon: bool = False  # Within 4 hours
    hours_until_due: Optional[float] = None
    
    # Outcome (if completed)
    completed_at: Optional[str] = None
    outcome: Optional[str] = None
    outcome_label: str = ""
    outcome_notes: Optional[str] = None
    
    # Chain
    parent_task_id: Optional[str] = None
    next_action_suggestion: Optional[str] = None
    next_task_type: Optional[str] = None
    child_task_ids: List[str] = []
    
    # Source
    source_type: str
    source_type_label: str = ""
    source_trigger: Optional[str] = None
    
    # Multi-tenant
    tenant_id: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: str = ""
    team_id: Optional[str] = None
    team_name: str = ""
    
    # Tags
    tags: List[str] = []
    
    # Timestamps
    created_at: str
    updated_at: Optional[str] = None
    
    # Activity count
    activity_count: int = 0


# ============================================
# TASK LIST RESPONSE
# ============================================

class TaskListResponse(BaseModel):
    """Paginated task list"""
    
    tasks: List[TaskResponse]
    total: int
    skip: int
    limit: int
    
    # Summary
    summary: Dict[str, int] = {}  # By status


# ============================================
# DAILY WORKBOARD MODELS
# ============================================

class WorkboardStats(BaseModel):
    """Stats for daily workboard"""
    
    overdue_count: int = 0
    today_count: int = 0
    completed_today: int = 0
    total_this_week: int = 0
    
    # Breakdown
    by_priority: Dict[str, int] = {}
    by_type: Dict[str, int] = {}


class WorkboardTask(BaseModel):
    """Simplified task for workboard"""
    
    id: str
    code: str
    task_type: str
    task_type_label: str = ""
    task_type_icon: str = ""
    title: str
    
    # Entity context
    related_entity_type: str
    related_entity_id: str
    related_entity_name: str = ""
    
    # Customer
    customer_name: str = ""
    
    # Timing
    due_at: str
    due_time: str = ""  # HH:MM for display
    is_overdue: bool = False
    hours_until_due: Optional[float] = None
    
    # Status & Priority
    status: str
    status_label: str = ""
    status_color: str = ""
    priority: str
    priority_label: str = ""
    priority_color: str = ""
    priority_score: int = 0


class RecentActivity(BaseModel):
    """Recent completed task for activity feed"""
    
    id: str
    title: str
    completed_at: str
    outcome: str
    outcome_label: str = ""
    outcome_notes: Optional[str] = None


class DailyWorkboardResponse(BaseModel):
    """Daily workboard for sales user"""
    
    # Greeting
    greeting: str = ""
    date_display: str = ""
    
    # Stats
    stats: WorkboardStats
    
    # Tasks by section
    overdue_tasks: List[WorkboardTask] = []
    today_tasks: List[WorkboardTask] = []
    upcoming_tasks: List[WorkboardTask] = []  # Next 3 days
    
    # Recent activity
    recent_activities: List[RecentActivity] = []


# ============================================
# MANAGER WORKLOAD MODELS
# ============================================

class UserWorkload(BaseModel):
    """Workload for single user"""
    
    user_id: str
    user_name: str
    
    # Counts
    total_active: int = 0
    in_progress: int = 0
    overdue: int = 0
    completed_today: int = 0
    completed_this_week: int = 0
    
    # Performance
    completion_rate: float = 0.0  # Percentage
    avg_completion_time_hours: float = 0.0
    
    # Status
    is_overloaded: bool = False  # > 15 active tasks
    has_overdue: bool = False


class BottleneckAlert(BaseModel):
    """Bottleneck alert for manager"""
    
    alert_type: str  # stale_leads, stale_deals, pending_bookings, etc.
    alert_level: str  # warning, critical
    title: str
    description: str
    count: int
    total_value: float = 0
    entity_ids: List[str] = []


class ManagerWorkloadResponse(BaseModel):
    """Manager workload dashboard"""
    
    # Team overview
    team_id: Optional[str] = None
    team_name: str = ""
    
    # Aggregates
    total_team_tasks: int = 0
    total_overdue: int = 0
    total_completed_today: int = 0
    team_completion_rate: float = 0.0
    
    # By user
    users: List[UserWorkload] = []
    
    # Bottlenecks
    bottleneck_alerts: List[BottleneckAlert] = []
    
    # Stale entities
    stale_leads_count: int = 0
    stale_deals_count: int = 0


# ============================================
# NEXT BEST ACTION MODEL
# ============================================

class NextBestAction(BaseModel):
    """Next best action suggestion"""
    
    task_id: str
    task_code: str
    task_type: str
    task_type_label: str = ""
    task_type_icon: str = ""
    title: str
    
    # Entity
    entity_type: str
    entity_id: str
    entity_name: str = ""
    
    # Customer
    customer_name: str = ""
    customer_phone: str = ""
    
    # Urgency
    priority_score: int
    urgency_level: str  # critical, high, medium
    urgency_reason: str = ""  # "Qua han 2 ngay", "Con 2 gio"
    
    # Actions
    suggested_actions: List[str] = []  # ["call", "reschedule", "complete"]


class NextBestActionsResponse(BaseModel):
    """List of next best actions"""
    
    urgent_actions: List[NextBestAction] = []  # priority_score >= 70
    important_actions: List[NextBestAction] = []  # priority_score >= 40
    
    total_pending: int = 0


# ============================================
# SEARCH / FILTER MODELS
# ============================================

class TaskSearchRequest(BaseModel):
    """Task search/filter"""
    
    search: Optional[str] = None  # Title, code, entity name
    
    # Filters
    task_types: Optional[List[str]] = None
    statuses: Optional[List[str]] = None
    priorities: Optional[List[str]] = None
    
    # Entity filter
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    
    # Owner filter
    owner_id: Optional[str] = None
    team_id: Optional[str] = None
    branch_id: Optional[str] = None
    
    # Date filter
    due_from: Optional[str] = None
    due_to: Optional[str] = None
    is_overdue: Optional[bool] = None
    is_due_today: Optional[bool] = None
    
    # Source filter
    source_type: Optional[str] = None
    
    # Pagination
    skip: int = 0
    limit: int = 50
    sort_by: str = "priority_score"  # priority_score, due_at, created_at
    sort_order: str = "desc"


# ============================================
# TASK CONFIG RESPONSES
# ============================================

class TaskTypeConfigResponse(BaseModel):
    """Task type config for dropdown"""
    
    code: str
    label: str
    icon: str
    default_priority: str
    default_sla_hours: Optional[float] = None
    category: str


class TaskStatusConfigResponse(BaseModel):
    """Task status config"""
    
    code: str
    label: str
    color: str
    icon: str
    is_active: bool
    is_final: bool


class TaskPriorityConfigResponse(BaseModel):
    """Task priority config"""
    
    code: str
    label: str
    color: str
    icon: str
    score_weight: int


class TaskOutcomeConfigResponse(BaseModel):
    """Task outcome config"""
    
    code: str
    label: str
    color: str
    icon: str
    next_action_required: bool


# ============================================
# BULK OPERATIONS
# ============================================

class BulkTaskUpdateRequest(BaseModel):
    """Bulk update tasks"""
    
    task_ids: List[str]
    
    # Fields to update
    owner_id: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_at: Optional[str] = None


class BulkTaskResponse(BaseModel):
    """Bulk operation result"""
    
    success_count: int
    failed_count: int
    failed_ids: List[str] = []
    errors: List[str] = []
