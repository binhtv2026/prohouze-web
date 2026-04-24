"""
ProHouzing CRM v3.0 - Omnichannel Marketing Automation
Full-stack CRM with AI-powered content creation, engagement, and lead distribution
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import asyncio
import json
import re
from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
# ==========================================
# DEPRECATION COMPLETE: MongoDB is READ-ONLY
# - Auth: 100% PostgreSQL (no fallback)
# - Users: Fully migrated to PostgreSQL
# - Business data: Uses PostgreSQL API v2
# MongoDB only used for legacy reads
# ==========================================
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# MongoDB read-only mode - ENFORCED
MONGO_READ_ONLY = True  # Hardcoded - no longer configurable

def mongo_write_blocked(operation_name: str):
    """Check if MongoDB write operations should be blocked"""
    if MONGO_READ_ONLY:
        import logging
        logging.warning(f"MongoDB write blocked: {operation_name}. Use PostgreSQL API v2 instead.")
        return True
    return False

# PostgreSQL session dependency
from core.database import SessionLocal

def get_pg_db():
    """PostgreSQL session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
COOKIE_DOMAIN = os.environ.get('COOKIE_DOMAIN', '.prohouzing.com')

# Phase 2 Integration: Event System
from services.automation.service_events import (
    initialize_event_system,
    emit_lead_created,
    emit_lead_assigned,
    emit_lead_status_changed,
    emit_deal_created,
    emit_deal_stage_changed,
    emit_high_value_deal_detected,
    emit_booking_created,
    EventTypes,
    EventThresholds
)

# RBAC imports (Prompt 4/20)
from config.rbac_config import (
    get_permission_scope, has_permission, PermissionScope,
    LEGACY_ROLE_MAPPING, get_role_permissions
)

def get_rbac_role(user: dict) -> str:
    """Map legacy role to new RBAC role"""
    role = user.get("role", "sales")
    return LEGACY_ROLE_MAPPING.get(role, role)

def get_rbac_visibility_filter(user: dict, resource: str) -> dict:
    """
    Get MongoDB query filter based on user's view scope.
    Applies RBAC-based data visibility.
    """
    role = get_rbac_role(user)
    scope = get_permission_scope(role, resource, "view")
    
    if scope == PermissionScope.ALL.value:
        return {}  # No filter - can see all
    
    elif scope == PermissionScope.BRANCH.value:
        branch_id = user.get("branch_id")
        if branch_id:
            return {"branch_id": branch_id}
        return {}
    
    elif scope == PermissionScope.TEAM.value:
        team_id = user.get("team_id")
        if team_id:
            return {"team_id": team_id}
        return {"$or": [
            {"assigned_to": user.get("id")},
            {"created_by": user.get("id")}
        ]}
    
    elif scope == PermissionScope.SELF.value:
        return {"$or": [
            {"assigned_to": user.get("id")},
            {"created_by": user.get("id")},
            {"current_owner": user.get("id")}
        ]}
    
    # Default: return only own records
    return {"$or": [
        {"assigned_to": user.get("id")},
        {"created_by": user.get("id")}
    ]}

def check_rbac_permission(user: dict, resource: str, action: str) -> bool:
    """Check if user has permission for resource.action"""
    role = get_rbac_role(user)
    return has_permission(role, resource, action)

app = FastAPI(title="ProHouzing CRM API v3.0", version="3.0.0", description="Omnichannel Marketing Automation CRM")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================

class UserRole(str, Enum):
    BOD = "bod"
    MANAGER = "manager"
    SALES = "sales"
    MARKETING = "marketing"
    CONTENT = "content"  # Content creator
    ADMIN = "admin"

class Department(str, Enum):
    SALES = "sales"
    MARKETING = "marketing"
    CONTENT = "content"
    SUPPORT = "support"
    MANAGEMENT = "management"
    IT = "IT"
    HR = "HR"
    FINANCE = "Finance"
    OPERATIONS = "Operations"

class Channel(str, Enum):
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    LINKEDIN = "linkedin"
    ZALO = "zalo"
    WEBSITE = "website"
    LANDING_PAGE = "landing_page"
    GOOGLE_ADS = "google_ads"
    EMAIL = "email"
    PHONE = "phone"
    REFERRAL = "referral"
    EVENT = "event"

class ContentType(str, Enum):
    POST = "post"
    STORY = "story"
    REEL = "reel"
    VIDEO = "video"
    ARTICLE = "article"
    CAROUSEL = "carousel"
    LIVE = "live"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CALLED = "called"
    VIEWING = "viewing"
    WARM = "warm"
    HOT = "hot"
    DEPOSIT = "deposit"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class LeadSegment(str, Enum):
    VIP = "vip"  # Budget > 10 tỷ
    HIGH_VALUE = "high_value"  # 5-10 tỷ
    MID_VALUE = "mid_value"  # 2-5 tỷ
    STANDARD = "standard"  # 1-2 tỷ
    ENTRY = "entry"  # < 1 tỷ
    INVESTOR = "investor"  # Mua nhiều căn
    FIRST_TIME_BUYER = "first_time_buyer"
    CORPORATE = "corporate"  # Doanh nghiệp

class DistributionMethod(str, Enum):
    ROUND_ROBIN = "round_robin"
    AI_SMART = "ai_smart"
    BY_REGION = "by_region"
    BY_PROJECT = "by_project"
    BY_PERFORMANCE = "by_performance"
    BY_WORKLOAD = "by_workload"
    BY_SEGMENT = "by_segment"
    HYBRID = "hybrid"

class ResponseTemplateCategory(str, Enum):
    GREETING = "greeting"
    PROJECT_INFO = "project_info"
    PRICING = "pricing"
    APPOINTMENT = "appointment"
    FAQ = "faq"
    OBJECTION_HANDLING = "objection_handling"
    FOLLOW_UP = "follow_up"
    CLOSING = "closing"

class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    SMS = "sms"
    ZNS = "zns"
    MEETING = "meeting"
    VIEWING = "viewing"
    NOTE = "note"
    STATUS_CHANGE = "status_change"
    ASSIGN = "assign"
    AUTO_ACTION = "auto_action"
    COMMENT_REPLY = "comment_reply"
    MESSAGE_REPLY = "message_reply"
    CONTENT_PUBLISH = "content_publish"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

# ==================== MODELS ====================

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.SALES
    department: Department = Department.SALES
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    specializations: List[str] = []  # Dự án chuyên môn
    regions: List[str] = []  # Vùng phụ trách

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    department: Department = Department.SALES  # Default value
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    specializations: List[str] = []
    regions: List[str] = []
    is_active: bool = True
    created_at: str = ""
    performance_score: float = 0  # AI calculated
    current_workload: int = 0

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Channel Integration Models
class ChannelConfig(BaseModel):
    channel: Channel
    name: str
    is_active: bool = True
    credentials: Dict[str, Any] = {}  # API keys, tokens, etc (encrypted)
    settings: Dict[str, Any] = {}  # Channel-specific settings
    webhook_url: Optional[str] = None

class ChannelConfigResponse(BaseModel):
    id: str
    channel: Channel
    name: str
    is_active: bool
    settings: Dict[str, Any]
    webhook_url: Optional[str]
    connected_at: Optional[str]
    last_sync: Optional[str]
    stats: Dict[str, Any] = {}  # Followers, engagement, etc

# Content Management Models
class ContentCreate(BaseModel):
    title: str
    content_type: ContentType
    channels: List[Channel]  # Đăng lên nhiều kênh
    body: str
    media_urls: List[str] = []
    hashtags: List[str] = []
    scheduled_at: Optional[str] = None
    project_id: Optional[str] = None  # Liên kết dự án
    campaign_id: Optional[str] = None
    ai_generated: bool = False
    ai_prompt: Optional[str] = None  # Prompt đã dùng để tạo

class ContentResponse(BaseModel):
    id: str
    title: str
    content_type: ContentType
    channels: List[Channel]
    body: str
    media_urls: List[str]
    hashtags: List[str]
    status: ContentStatus
    scheduled_at: Optional[str]
    published_at: Optional[str]
    project_id: Optional[str]
    campaign_id: Optional[str]
    created_by: str
    created_by_name: str
    created_at: str
    ai_generated: bool
    approval_status: ApprovalStatus
    approved_by: Optional[str]
    approved_at: Optional[str]
    rejection_reason: Optional[str]
    engagement_stats: Dict[str, Any] = {}  # likes, comments, shares

class ContentApprovalRequest(BaseModel):
    status: ApprovalStatus
    comment: Optional[str] = None

# Response Template Models
class ResponseTemplateCreate(BaseModel):
    name: str
    category: ResponseTemplateCategory
    channels: List[Channel]  # Áp dụng cho kênh nào
    trigger_keywords: List[str]  # Keywords kích hoạt
    template_text: str
    variables: List[str] = []  # {{name}}, {{project}}, etc
    is_active: bool = True
    priority: int = 0
    requires_human_review: bool = False  # Cần người review trước khi gửi

class ResponseTemplateResponse(BaseModel):
    id: str
    name: str
    category: ResponseTemplateCategory
    channels: List[Channel]
    trigger_keywords: List[str]
    template_text: str
    variables: List[str]
    is_active: bool
    priority: int
    requires_human_review: bool
    created_by: str
    approved_by: Optional[str]
    approved_at: Optional[str]
    usage_count: int = 0

# Lead Models (Enhanced)
class LeadCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    channel: Channel = Channel.WEBSITE
    channel_id: Optional[str] = None  # ID trên kênh đó (FB user ID, etc)
    source_content_id: Optional[str] = None  # Content nào mang lead về
    source_campaign_id: Optional[str] = None
    project_interest: Optional[str] = None
    product_interest: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    raw_message: Optional[str] = None  # Comment/message gốc
    # CTV Referral
    referrer_id: Optional[str] = None  # ID của CTV giới thiệu
    referrer_type: Optional[str] = None  # "collaborator" hoặc "employee"

class LeadResponse(BaseModel):
    id: str
    full_name: str
    phone: str
    phone_masked: str
    email: Optional[str] = None
    channel: Channel
    channel_id: Optional[str] = None
    source_content_id: Optional[str] = None
    source_campaign_id: Optional[str] = None
    status: LeadStatus
    segment: Optional[LeadSegment] = None
    project_interest: Optional[str] = None
    product_interest: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_at: Optional[str] = None
    assignment_reason: Optional[str] = None  # Lý do AI assign
    branch_id: Optional[str] = None
    score: int = 0
    created_at: str
    updated_at: str
    last_activity: Optional[str] = None
    follow_up_count: int = 0
    is_duplicate: bool = False
    merged_from: List[str] = []  # IDs of merged leads
    # CTV Referral
    referrer_id: Optional[str] = None
    referrer_type: Optional[str] = None
    referrer_name: Optional[str] = None

# Distribution Rule Models
class DistributionRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    method: DistributionMethod
    priority: int = 0
    is_active: bool = True
    conditions: Dict[str, Any] = {}  # Điều kiện áp dụng rule
    config: Dict[str, Any] = {}  # Cấu hình chi tiết
    target_users: List[str] = []  # User IDs (nếu specific)
    target_teams: List[str] = []
    target_branches: List[str] = []

class DistributionRuleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    method: DistributionMethod
    priority: int
    is_active: bool
    conditions: Dict[str, Any]
    config: Dict[str, Any]
    target_users: List[str]
    target_teams: List[str]
    target_branches: List[str]
    created_at: str
    last_triggered: Optional[str]
    trigger_count: int = 0
    success_rate: float = 0

# Approval Workflow Models
class ApprovalWorkflowCreate(BaseModel):
    name: str
    department: Department
    content_types: List[ContentType]
    approval_chain: List[Dict[str, Any]]  # [{role: "manager", required: True}, ...]
    auto_approve_conditions: Dict[str, Any] = {}  # Điều kiện auto approve

class ApprovalWorkflowResponse(BaseModel):
    id: str
    name: str
    department: Department
    content_types: List[ContentType]
    approval_chain: List[Dict[str, Any]]
    auto_approve_conditions: Dict[str, Any]
    is_active: bool
    created_at: str

# Comment/Message Models
class IncomingMessage(BaseModel):
    channel: Channel
    channel_message_id: str
    channel_user_id: str
    channel_user_name: Optional[str] = None
    content_id: Optional[str] = None  # Nếu là comment trên content
    message_type: str  # comment, direct_message, mention
    text: str
    media_urls: List[str] = []
    timestamp: str

class AIReplyResult(BaseModel):
    should_reply: bool
    reply_text: Optional[str] = None
    template_used: Optional[str] = None
    confidence: float = 0
    requires_human_review: bool = False
    detected_intent: Optional[str] = None
    should_create_lead: bool = False
    extracted_info: Dict[str, Any] = {}

# Activity Models
class ActivityCreate(BaseModel):
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    type: ActivityType
    title: str
    content: str
    outcome: Optional[str] = None
    duration_minutes: Optional[int] = None
    next_action: Optional[str] = None
    next_follow_up: Optional[str] = None

class ActivityResponse(BaseModel):
    id: str
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    user_id: str
    user_name: str
    type: ActivityType
    title: str
    content: str
    outcome: Optional[str] = None
    duration_minutes: Optional[int] = None
    created_at: str
    is_auto: bool = False

# Task Models
class TaskCreate(BaseModel):
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    content_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: str
    due_date: str
    priority: str = "medium"
    assigned_to: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    content_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    type: str
    status: TaskStatus
    due_date: str
    priority: str
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_at: str
    is_overdue: bool = False

# AI Request Models
class AIContentRequest(BaseModel):
    content_type: ContentType
    channels: List[Channel]
    project_id: Optional[str] = None
    topic: str
    tone: str = "professional"  # professional, casual, exciting
    length: str = "medium"  # short, medium, long
    include_cta: bool = True
    target_audience: Optional[str] = None
    keywords: List[str] = []

class AIContentResponse(BaseModel):
    title: str
    body: str
    hashtags: List[str]
    suggested_media_prompt: str
    variations: List[Dict[str, str]] = []  # Alternative versions

class AIChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class AIChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    actions: List[Dict] = []

# ==================== HELPER FUNCTIONS ====================

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return "****"
    return phone[:3] + "*" * (len(phone) - 6) + phone[-3:]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str, org_id: str = None, email: str = None, full_name: str = None) -> str:
    """Create JWT token with organization ID for API v2 compatibility"""
    # Default org_id for single-tenant mode
    default_org_id = "00000000-0000-0000-0000-000000000001"
    
    payload = {
        "sub": user_id,
        "role": role,
        "org_id": org_id or default_org_id,  # Required for API v2
        "organization_id": org_id or default_org_id,  # Legacy support
        "email": email or "",
        "full_name": full_name or "",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user from JWT token.
    Uses PostgreSQL for user lookup (MongoDB deprecated).
    """
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        # Use PostgreSQL for user lookup
        from core.database import SessionLocal
        from core.models.user import User
        
        pg_db = SessionLocal()
        try:
            pg_user = pg_db.query(User).filter(User.id == user_id).first()
            
            if not pg_user:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Build user dict from PostgreSQL user + JWT payload data
            settings = pg_user.settings_json or {}
            user = {
                "id": str(pg_user.id),
                "email": pg_user.email,
                "full_name": pg_user.full_name,
                "phone": pg_user.phone,
                "org_id": str(pg_user.org_id) if pg_user.org_id else None,
                "role": payload.get("role", "viewer"),
                "permissions": payload.get("permissions", {}),
                "department": pg_user.department,
                "team_id": settings.get("team_id"),
                "branch_id": settings.get("branch_id"),
                "specializations": settings.get("specializations", []),
                "regions": settings.get("regions", []),
                "is_active": pg_user.status == "active"
            }
            return user
        finally:
            pg_db.close()
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_name(user_id: str) -> str:
    if not user_id:
        return None
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "full_name": 1})
    return user["full_name"] if user else None

async def log_activity(
    lead_id: str = None,
    customer_id: str = None,
    user_id: str = None,
    activity_type: ActivityType = ActivityType.NOTE,
    title: str = "",
    content: str = "",
    outcome: str = None,
    is_auto: bool = False
):
    """Ghi log hoạt động"""
    activity = {
        "id": str(uuid.uuid4()),
        "lead_id": lead_id,
        "customer_id": customer_id,
        "user_id": user_id or "system",
        "type": activity_type.value if isinstance(activity_type, ActivityType) else activity_type,
        "title": title,
        "content": content,
        "outcome": outcome,
        "is_auto": is_auto,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.activities.insert_one(activity)
    
    if lead_id:
        await db.leads.update_one(
            {"id": lead_id},
            {"$set": {"last_activity": activity["created_at"], "last_activity_type": activity["type"]}}
        )
    return activity

async def send_notification(user_id: str, title: str, message: str, type: str = "info", lead_id: str = None, content_id: str = None):
    """Gửi notification"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "lead_id": lead_id,
        "content_id": content_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

def segment_lead(budget_min: float = None, budget_max: float = None, tags: List[str] = None) -> LeadSegment:
    """Phân loại lead segment dựa trên ngân sách"""
    budget = budget_max or budget_min or 0
    
    if tags and "investor" in tags:
        return LeadSegment.INVESTOR
    if tags and "corporate" in tags:
        return LeadSegment.CORPORATE
    
    if budget >= 10000000000:  # 10 tỷ
        return LeadSegment.VIP
    elif budget >= 5000000000:  # 5 tỷ
        return LeadSegment.HIGH_VALUE
    elif budget >= 2000000000:  # 2 tỷ
        return LeadSegment.MID_VALUE
    elif budget >= 1000000000:  # 1 tỷ
        return LeadSegment.STANDARD
    else:
        return LeadSegment.ENTRY

# ==================== AI ENGINE ====================

class ProHAI:
    """ProH AI Engine - Content Creation, Lead Scoring, Smart Distribution"""
    
    @staticmethod
    async def generate_content(request: AIContentRequest, project_info: Dict = None) -> AIContentResponse:
        """Tạo nội dung bằng AI"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                raise HTTPException(status_code=500, detail="AI service not configured")
            
            # Build project context
            project_context = ""
            if project_info:
                project_context = f"""
Thông tin dự án:
- Tên: {project_info.get('name', 'N/A')}
- Vị trí: {project_info.get('location', 'N/A')}
- Giá từ: {project_info.get('price_from', 0):,.0f} VND
- Đặc điểm: {project_info.get('description', '')}
"""
            
            channel_tips = {
                Channel.FACEBOOK: "Tone thân thiện, có CTA rõ ràng, tối đa 3 hashtag",
                Channel.TIKTOK: "Ngắn gọn, trend, hook mạnh ngay đầu, nhiều hashtag",
                Channel.YOUTUBE: "Chi tiết, giá trị cao, có timestamp nếu dài",
                Channel.LINKEDIN: "Chuyên nghiệp, insights, thought leadership",
                Channel.ZALO: "Thân thiện, địa phương, có số liên hệ"
            }
            
            channels_tips = "\n".join([f"- {c.value}: {channel_tips.get(c, '')}" for c in request.channels])
            
            system_prompt = f"""Bạn là ProH AI - Content Creator chuyên nghiệp cho ProHouzing, công ty bất động sản hàng đầu.

NHIỆM VỤ: Tạo nội dung {request.content_type.value} cho các kênh: {', '.join([c.value for c in request.channels])}

HƯỚNG DẪN THEO KÊNH:
{channels_tips}

{project_context}

YÊU CẦU:
- Tone: {request.tone}
- Độ dài: {request.length}
- Có CTA: {'Có' if request.include_cta else 'Không'}
- Keywords cần có: {', '.join(request.keywords) if request.keywords else 'Tự chọn'}
- Target audience: {request.target_audience or 'Người có nhu cầu mua nhà'}

OUTPUT FORMAT (JSON):
{{
    "title": "Tiêu đề hấp dẫn",
    "body": "Nội dung chính",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "suggested_media_prompt": "Mô tả hình ảnh/video phù hợp",
    "variations": [
        {{"channel": "facebook", "body": "Version cho FB"}},
        {{"channel": "tiktok", "body": "Version cho TikTok"}}
    ]
}}"""
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"proh-content-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=f"Tạo nội dung về: {request.topic}")
            response = await chat.send_message(user_message)
            
            # Parse JSON response
            try:
                # Extract JSON from response
                json_match = re.search(r'\{[\s\S]*\}', response)
                if json_match:
                    result = json.loads(json_match.group())
                    return AIContentResponse(
                        title=result.get("title", request.topic),
                        body=result.get("body", response),
                        hashtags=result.get("hashtags", []),
                        suggested_media_prompt=result.get("suggested_media_prompt", ""),
                        variations=result.get("variations", [])
                    )
            except json.JSONDecodeError:
                pass
            
            # Fallback if JSON parsing fails
            return AIContentResponse(
                title=request.topic,
                body=response,
                hashtags=["#ProHouzing", "#BatDongSan"],
                suggested_media_prompt="Hình ảnh dự án chuyên nghiệp",
                variations=[]
            )
            
        except Exception as e:
            logger.error(f"AI Content Generation error: {e}")
            raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
    
    @staticmethod
    async def analyze_message_and_reply(message: IncomingMessage, templates: List[Dict]) -> AIReplyResult:
        """Phân tích tin nhắn và quyết định reply"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                return AIReplyResult(should_reply=False, requires_human_review=True)
            
            # Build templates context
            templates_context = "\n".join([
                f"- Category: {t['category']}, Keywords: {t['trigger_keywords']}, Template: {t['template_text'][:100]}..."
                for t in templates if t.get('is_active', True)
            ])
            
            system_prompt = f"""Bạn là ProH AI - phân tích comment/message của khách hàng bất động sản.

TEMPLATES ĐÃ ĐƯỢC DUYỆT:
{templates_context}

NHIỆM VỤ:
1. Phân tích intent của message
2. Quyết định có nên reply không
3. Nếu reply, chọn template phù hợp nhất và customize
4. Trích xuất thông tin khách hàng (nếu có)

OUTPUT FORMAT (JSON):
{{
    "should_reply": true/false,
    "reply_text": "Nội dung reply",
    "template_used": "template_id hoặc null",
    "confidence": 0.0-1.0,
    "requires_human_review": true/false,
    "detected_intent": "greeting/inquiry/pricing/appointment/complaint/other",
    "should_create_lead": true/false,
    "extracted_info": {{
        "name": "nếu có",
        "phone": "nếu có",
        "budget": "nếu có",
        "project_interest": "nếu có"
    }}
}}

RULES:
- Chỉ reply nếu message liên quan đến BĐS
- Nếu khách hỏi giá cụ thể hoặc muốn đặt lịch → requires_human_review = true
- Nếu có SĐT hoặc thể hiện quan tâm mua → should_create_lead = true
- Không reply spam, quảng cáo, không liên quan"""
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"proh-reply-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=f"Phân tích message từ {message.channel.value}: \"{message.text}\"")
            response = await chat.send_message(user_message)
            
            # Parse JSON
            try:
                json_match = re.search(r'\{[\s\S]*\}', response)
                if json_match:
                    result = json.loads(json_match.group())
                    return AIReplyResult(
                        should_reply=result.get("should_reply", False),
                        reply_text=result.get("reply_text"),
                        template_used=result.get("template_used"),
                        confidence=result.get("confidence", 0),
                        requires_human_review=result.get("requires_human_review", True),
                        detected_intent=result.get("detected_intent"),
                        should_create_lead=result.get("should_create_lead", False),
                        extracted_info=result.get("extracted_info", {})
                    )
            except json.JSONDecodeError:
                pass
            
            return AIReplyResult(should_reply=False, requires_human_review=True)
            
        except Exception as e:
            logger.error(f"AI Reply Analysis error: {e}")
            return AIReplyResult(should_reply=False, requires_human_review=True)
    
    @staticmethod
    async def smart_distribute_lead(lead: Dict, rules: List[Dict], sales_users: List[Dict]) -> Dict:
        """AI phân bổ lead thông minh"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            
            # Build context
            lead_info = f"""
Lead:
- Tên: {lead.get('full_name')}
- Nguồn: {lead.get('channel')}
- Ngân sách: {lead.get('budget_min', 0):,.0f} - {lead.get('budget_max', 0):,.0f} VND
- Segment: {lead.get('segment')}
- Dự án quan tâm: {lead.get('project_interest', 'Chưa xác định')}
- Vùng: {lead.get('location', 'Chưa xác định')}
"""
            
            sales_info = "\n".join([
                f"- {s['full_name']}: Workload={s.get('current_workload', 0)}, Performance={s.get('performance_score', 0)}, Vùng={s.get('regions', [])}, Chuyên môn={s.get('specializations', [])}"
                for s in sales_users[:10]  # Top 10
            ])
            
            rules_info = "\n".join([
                f"- {r['name']}: Method={r['method']}, Conditions={r.get('conditions', {})}"
                for r in rules if r.get('is_active', True)
            ])
            
            if not api_key:
                # Fallback: Round Robin
                if sales_users:
                    sales_users.sort(key=lambda x: x.get('current_workload', 0))
                    return {
                        "assigned_to": sales_users[0]["id"],
                        "reason": "Round Robin (AI unavailable)",
                        "confidence": 0.5
                    }
                return {"assigned_to": None, "reason": "No sales available", "confidence": 0}
            
            system_prompt = f"""Bạn là ProH AI - hệ thống phân bổ lead thông minh.

{lead_info}

SALES TEAM:
{sales_info}

DISTRIBUTION RULES:
{rules_info}

NHIỆM VỤ: Chọn sales phù hợp nhất để giao lead này.

TIÊU CHÍ ĐÁNH GIÁ:
1. Match vùng miền (nếu lead có location)
2. Match dự án chuyên môn (nếu lead quan tâm dự án cụ thể)
3. Workload hiện tại (ưu tiên người ít việc)
4. Performance score (lead VIP → top performer)
5. Segment matching (VIP → senior sales)

OUTPUT FORMAT (JSON):
{{
    "assigned_to": "user_id",
    "assigned_to_name": "Tên sales",
    "reason": "Lý do chi tiết",
    "confidence": 0.0-1.0,
    "alternative": "user_id backup nếu người chính bận"
}}"""
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"proh-distribute-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
            
            response = await chat.send_message(UserMessage(text="Phân tích và chọn sales phù hợp"))
            
            try:
                json_match = re.search(r'\{[\s\S]*\}', response)
                if json_match:
                    result = json.loads(json_match.group())
                    # Validate user exists
                    assigned_id = result.get("assigned_to")
                    if assigned_id and any(s["id"] == assigned_id for s in sales_users):
                        return result
            except json.JSONDecodeError:
                pass
            
            # Fallback
            if sales_users:
                sales_users.sort(key=lambda x: x.get('current_workload', 0))
                return {
                    "assigned_to": sales_users[0]["id"],
                    "reason": "Round Robin fallback",
                    "confidence": 0.5
                }
            
            return {"assigned_to": None, "reason": "No suitable sales found", "confidence": 0}
            
        except Exception as e:
            logger.error(f"AI Distribution error: {e}")
            if sales_users:
                sales_users.sort(key=lambda x: x.get('current_workload', 0))
                return {
                    "assigned_to": sales_users[0]["id"],
                    "reason": f"Fallback due to error: {str(e)}",
                    "confidence": 0.3
                }
            return {"assigned_to": None, "reason": str(e), "confidence": 0}
    
    @staticmethod
    async def score_lead(lead: Dict, activities: List[Dict] = None) -> Dict:
        """Tính điểm lead"""
        score = 0
        factors = {}
        
        # Channel scoring (max 20)
        channel_scores = {
            Channel.REFERRAL.value: 20,
            Channel.EVENT.value: 18,
            Channel.WEBSITE.value: 15,
            Channel.LINKEDIN.value: 14,
            Channel.FACEBOOK.value: 12,
            Channel.ZALO.value: 12,
            Channel.YOUTUBE.value: 10,
            Channel.TIKTOK.value: 8,
            Channel.GOOGLE_ADS.value: 10,
        }
        channel_score = channel_scores.get(lead.get("channel", ""), 5)
        score += channel_score
        factors["channel"] = {"value": lead.get("channel"), "score": channel_score, "max": 20}
        
        # Budget scoring (max 25)
        budget = lead.get("budget_max") or lead.get("budget_min") or 0
        if budget >= 10000000000:
            budget_score = 25
        elif budget >= 5000000000:
            budget_score = 20
        elif budget >= 2000000000:
            budget_score = 15
        elif budget >= 1000000000:
            budget_score = 10
        else:
            budget_score = 5
        score += budget_score
        factors["budget"] = {"value": f"{budget:,.0f} VND", "score": budget_score, "max": 25}
        
        # Engagement scoring (max 25)
        engagement = lead.get("follow_up_count", 0)
        engagement_score = min(engagement * 5, 25)
        score += engagement_score
        factors["engagement"] = {"value": engagement, "score": engagement_score, "max": 25}
        
        # Status scoring (max 20)
        status_scores = {
            LeadStatus.DEPOSIT.value: 20,
            LeadStatus.HOT.value: 18,
            LeadStatus.NEGOTIATION.value: 16,
            LeadStatus.VIEWING.value: 14,
            LeadStatus.WARM.value: 12,
            LeadStatus.CALLED.value: 10,
            LeadStatus.CONTACTED.value: 8,
            LeadStatus.NEW.value: 5
        }
        status_score = status_scores.get(lead.get("status", ""), 5)
        score += status_score
        factors["status"] = {"value": lead.get("status"), "score": status_score, "max": 20}
        
        # Recency bonus (max 10)
        if lead.get("last_activity"):
            try:
                last = datetime.fromisoformat(lead["last_activity"].replace('Z', '+00:00'))
                days = (datetime.now(timezone.utc) - last).days
                if days <= 1:
                    recency_score = 10
                elif days <= 3:
                    recency_score = 7
                elif days <= 7:
                    recency_score = 4
                else:
                    recency_score = 0
                score += recency_score
                factors["recency"] = {"value": f"{days} days", "score": recency_score, "max": 10}
            except:
                pass
        
        score = min(score, 100)
        
        # Generate recommendation
        if score >= 80:
            recommendation = "Lead VIP - Ưu tiên cao nhất, liên hệ trong 1 giờ"
            priority = "urgent"
        elif score >= 60:
            recommendation = "Lead tiềm năng cao - Liên hệ trong 24h"
            priority = "high"
        elif score >= 40:
            recommendation = "Lead trung bình - Follow up trong 2-3 ngày"
            priority = "medium"
        else:
            recommendation = "Lead cần nurture - Đưa vào automation"
            priority = "low"
        
        return {
            "score": score,
            "factors": factors,
            "recommendation": recommendation,
            "priority": priority
        }

# ==================== LEAD DISTRIBUTION ENGINE ====================

class LeadDistributionEngine:
    """Engine phân bổ lead"""
    
    @staticmethod
    async def get_available_sales(branch_id: str = None, team_id: str = None, segment: LeadSegment = None) -> List[Dict]:
        """Lấy danh sách sales khả dụng"""
        query = {"role": "sales", "is_active": True}
        if branch_id:
            query["branch_id"] = branch_id
        if team_id:
            query["team_id"] = team_id
        
        sales = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
        
        # Calculate current workload for each
        for s in sales:
            workload = await db.leads.count_documents({
                "assigned_to": s["id"],
                "status": {"$nin": [LeadStatus.CLOSED_WON.value, LeadStatus.CLOSED_LOST.value]}
            })
            s["current_workload"] = workload
            
            # Calculate performance score (simplified)
            won = await db.leads.count_documents({
                "assigned_to": s["id"],
                "status": LeadStatus.CLOSED_WON.value
            })
            total = await db.leads.count_documents({"assigned_to": s["id"]})
            s["performance_score"] = round((won / total * 100) if total > 0 else 0, 2)
        
        return sales
    
    @staticmethod
    async def distribute_lead(lead: Dict) -> Dict:
        """Phân bổ lead theo rules và AI"""
        # Get active rules
        rules = await db.distribution_rules.find(
            {"is_active": True},
            {"_id": 0}
        ).sort("priority", 1).to_list(100)
        
        # Get available sales
        sales = await LeadDistributionEngine.get_available_sales(
            branch_id=lead.get("branch_id"),
            segment=lead.get("segment")
        )
        
        if not sales:
            return {"assigned_to": None, "reason": "No sales available"}
        
        # Use AI for smart distribution
        result = await ProHAI.smart_distribute_lead(lead, rules, sales)
        
        if result.get("assigned_to"):
            now = datetime.now(timezone.utc).isoformat()
            
            # Update lead
            await db.leads.update_one(
                {"id": lead["id"]},
                {
                    "$set": {
                        "assigned_to": result["assigned_to"],
                        "assigned_at": now,
                        "assignment_reason": result.get("reason", "AI Distribution"),
                        "updated_at": now
                    }
                }
            )
            
            # Send notification
            await send_notification(
                result["assigned_to"],
                "Lead mới được giao",
                f"Bạn được giao lead: {lead['full_name']} - {mask_phone(lead.get('phone', ''))}. Lý do: {result.get('reason', '')}",
                "lead",
                lead["id"]
            )
            
            # Create follow-up task
            task = {
                "id": str(uuid.uuid4()),
                "lead_id": lead["id"],
                "title": f"Liên hệ lead mới: {lead['full_name']}",
                "description": f"Lead từ {lead.get('channel', 'unknown')}. {result.get('reason', '')}",
                "type": "call",
                "status": TaskStatus.PENDING.value,
                "due_date": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
                "priority": "high" if lead.get("segment") in [LeadSegment.VIP.value, LeadSegment.HIGH_VALUE.value] else "medium",
                "assigned_to": result["assigned_to"],
                "created_by": "system",
                "created_at": now,
                "is_auto": True
            }
            await db.tasks.insert_one(task)
            
            # Log activity
            await log_activity(
                lead_id=lead["id"],
                activity_type=ActivityType.ASSIGN,
                title="Lead được phân bổ tự động",
                content=f"AI Distribution: {result.get('reason', '')}",
                is_auto=True
            )
            
            # Update distribution rule stats
            if rules:
                await db.distribution_rules.update_one(
                    {"id": rules[0]["id"]},
                    {
                        "$set": {"last_triggered": now},
                        "$inc": {"trigger_count": 1}
                    }
                )
        
        return result

# ==================== AUTH ROUTES (PostgreSQL Only) ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, pg_db: Session = Depends(get_pg_db)):
    """Register user - uses PostgreSQL"""
    from core.services.auth_service import auth_service
    
    user, error = auth_service.register_user(
        pg_db,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        role=user_data.role.value,
        phone=user_data.phone,
        department=user_data.department.value,
        branch_id=user_data.branch_id,
        team_id=user_data.team_id,
        specializations=user_data.specializations,
        regions=user_data.regions
    )
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    settings = user.settings_json or {}
    role = auth_service._get_user_role(pg_db, user.id)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=role,
        department=user.department or "sales",
        branch_id=settings.get("branch_id"),
        team_id=settings.get("team_id"),
        specializations=settings.get("specializations", []),
        regions=settings.get("regions", []),
        is_active=user.status == "active",
        performance_score=0,
        current_workload=0
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest, pg_db: Session = Depends(get_pg_db)):
    """
    Login - PostgreSQL only (MongoDB deprecated).
    """
    from core.services.auth_service import auth_service
    
    user, token, error = auth_service.authenticate(pg_db, data.email, data.password)
    
    if error:
        raise HTTPException(status_code=401, detail=error)
    
    settings = user.settings_json or {}
    role = auth_service._get_user_role(pg_db, user.id)
    
    return TokenResponse(
        access_token=token, 
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=role,
            department=user.department or "sales",
            branch_id=settings.get("branch_id"),
            team_id=settings.get("team_id"),
            specializations=settings.get("specializations", []),
            regions=settings.get("regions", []),
            is_active=user.status == "active",
            performance_score=0,
            current_workload=0
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user - works with PostgreSQL tokens"""
    return UserResponse(**current_user, performance_score=0, current_workload=0)

# ==================== CHANNEL INTEGRATION ROUTES ====================

@api_router.post("/channels", response_model=ChannelConfigResponse)
async def create_channel_config(data: ChannelConfig, current_user: dict = Depends(get_current_user)):
    # RBAC permission check (Prompt 4/20)
    if not check_rbac_permission(current_user, "channel", "create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    config_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    config_doc = {
        "id": config_id,
        "channel": data.channel.value,
        "name": data.name,
        "is_active": data.is_active,
        "credentials": data.credentials,  # Should be encrypted in production
        "settings": data.settings,
        "webhook_url": f"/api/webhooks/{data.channel.value}/{config_id}",
        "connected_at": now,
        "last_sync": None,
        "stats": {},
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.channel_configs.insert_one(config_doc)
    del config_doc["credentials"]  # Don't return credentials
    return ChannelConfigResponse(**config_doc)

@api_router.get("/channels", response_model=List[ChannelConfigResponse])
async def get_channel_configs(current_user: dict = Depends(get_current_user)):
    # RBAC permission check (Prompt 4/20)
    if not check_rbac_permission(current_user, "channel", "view"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    configs = await db.channel_configs.find({}, {"_id": 0, "credentials": 0}).to_list(100)
    return [ChannelConfigResponse(**c) for c in configs]

@api_router.put("/channels/{channel_id}/toggle")
async def toggle_channel(channel_id: str, current_user: dict = Depends(get_current_user)):
    # RBAC permission check (Prompt 4/20)
    if not check_rbac_permission(current_user, "channel", "edit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    config = await db.channel_configs.find_one({"id": channel_id}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    new_status = not config.get("is_active", True)
    await db.channel_configs.update_one({"id": channel_id}, {"$set": {"is_active": new_status}})
    return {"success": True, "is_active": new_status}

# Webhook endpoint for receiving leads from channels
@api_router.post("/webhooks/{channel}/{config_id}")
async def channel_webhook(channel: str, config_id: str, request: Request):
    """Webhook nhận data từ các kênh (Facebook, TikTok, etc.)"""
    try:
        body = await request.json()
        logger.info(f"Webhook received from {channel}: {body}")
        
        # TODO: Implement channel-specific parsing
        # This would parse Facebook Lead Ads, TikTok Lead Gen, etc.
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ==================== CONTENT MANAGEMENT ROUTES ====================

@api_router.post("/content/generate", response_model=AIContentResponse)
async def generate_content(data: AIContentRequest, current_user: dict = Depends(get_current_user)):
    """ProH AI tạo nội dung"""
    # RBAC permission check (Prompt 4/20)
    if not check_rbac_permission(current_user, "content", "create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    project_info = None
    if data.project_id:
        project_info = await db.projects.find_one({"id": data.project_id}, {"_id": 0})
    
    return await ProHAI.generate_content(data, project_info)

@api_router.post("/content", response_model=ContentResponse)
async def create_content(data: ContentCreate, current_user: dict = Depends(get_current_user)):
    """Tạo content mới (draft)"""
    # RBAC permission check (Prompt 4/20)
    if not check_rbac_permission(current_user, "content", "create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    content_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    content_doc = {
        "id": content_id,
        "title": data.title,
        "content_type": data.content_type.value,
        "channels": [c.value for c in data.channels],
        "body": data.body,
        "media_urls": data.media_urls,
        "hashtags": data.hashtags,
        "status": ContentStatus.DRAFT.value,
        "scheduled_at": data.scheduled_at,
        "published_at": None,
        "project_id": data.project_id,
        "campaign_id": data.campaign_id,
        "created_by": current_user["id"],
        "created_at": now,
        "ai_generated": data.ai_generated,
        "ai_prompt": data.ai_prompt,
        "approval_status": ApprovalStatus.PENDING.value,
        "approved_by": None,
        "approved_at": None,
        "rejection_reason": None,
        "engagement_stats": {}
    }
    
    await db.contents.insert_one(content_doc)
    
    return ContentResponse(
        **content_doc,
        created_by_name=current_user["full_name"]
    )

@api_router.get("/content", response_model=List[ContentResponse])
async def get_contents(
    status: Optional[ContentStatus] = None,
    channel: Optional[Channel] = None,
    approval_status: Optional[ApprovalStatus] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status.value
    if channel:
        query["channels"] = channel.value
    if approval_status:
        query["approval_status"] = approval_status.value
    
    # Filter by department for non-admin
    if current_user["role"] not in ["bod", "admin"]:
        query["created_by"] = current_user["id"]
    
    contents = await db.contents.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for c in contents:
        creator_name = await get_user_name(c.get("created_by"))
        result.append(ContentResponse(**c, created_by_name=creator_name or "Unknown"))
    return result

@api_router.post("/content/{content_id}/submit-for-review")
async def submit_content_for_review(content_id: str, current_user: dict = Depends(get_current_user)):
    """Submit content để review"""
    content = await db.contents.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content["created_by"] != current_user["id"] and current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.contents.update_one(
        {"id": content_id},
        {"$set": {
            "status": ContentStatus.PENDING_REVIEW.value,
            "approval_status": ApprovalStatus.PENDING.value
        }}
    )
    
    # Notify approvers (managers of the department)
    approvers = await db.users.find({
        "role": {"$in": ["manager", "bod"]},
        "department": current_user.get("department", "marketing"),
        "is_active": True
    }, {"_id": 0, "id": 1}).to_list(10)
    
    for approver in approvers:
        await send_notification(
            approver["id"],
            "Content cần duyệt",
            f"Content '{content['title']}' đang chờ duyệt",
            "approval",
            content_id=content_id
        )
    
    return {"success": True, "status": "pending_review"}

@api_router.post("/content/{content_id}/approve", response_model=ContentResponse)
async def approve_content(content_id: str, data: ContentApprovalRequest, current_user: dict = Depends(get_current_user)):
    """Duyệt hoặc từ chối content"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    content = await db.contents.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "approval_status": data.status.value,
        "approved_by": current_user["id"],
        "approved_at": now
    }
    
    if data.status == ApprovalStatus.APPROVED:
        if content.get("scheduled_at"):
            update["status"] = ContentStatus.SCHEDULED.value
        else:
            update["status"] = ContentStatus.APPROVED.value
    elif data.status == ApprovalStatus.REJECTED:
        update["status"] = ContentStatus.REJECTED.value
        update["rejection_reason"] = data.comment
    
    await db.contents.update_one({"id": content_id}, {"$set": update})
    
    # Notify creator
    await send_notification(
        content["created_by"],
        f"Content {'đã được duyệt' if data.status == ApprovalStatus.APPROVED else 'bị từ chối'}",
        f"Content '{content['title']}' {data.comment or ''}",
        "approval",
        content_id=content_id
    )
    
    updated = await db.contents.find_one({"id": content_id}, {"_id": 0})
    creator_name = await get_user_name(updated.get("created_by"))
    return ContentResponse(**updated, created_by_name=creator_name)

@api_router.post("/content/{content_id}/publish")
async def publish_content(content_id: str, current_user: dict = Depends(get_current_user)):
    """Publish content lên các kênh"""
    content = await db.contents.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content["approval_status"] != ApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Content not approved")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # TODO: Implement actual publishing to channels via their APIs
    # For now, just update status
    
    await db.contents.update_one(
        {"id": content_id},
        {"$set": {
            "status": ContentStatus.PUBLISHED.value,
            "published_at": now
        }}
    )
    
    await log_activity(
        user_id=current_user["id"],
        activity_type=ActivityType.CONTENT_PUBLISH,
        title=f"Published: {content['title']}",
        content=f"Published to channels: {', '.join(content['channels'])}"
    )
    
    return {"success": True, "published_at": now}

# ==================== RESPONSE TEMPLATE ROUTES ====================

@api_router.post("/response-templates", response_model=ResponseTemplateResponse)
async def create_response_template(data: ResponseTemplateCreate, current_user: dict = Depends(get_current_user)):
    """Tạo template trả lời tự động"""
    if current_user["role"] not in ["bod", "admin", "marketing", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    template_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    template_doc = {
        "id": template_id,
        "name": data.name,
        "category": data.category.value,
        "channels": [c.value for c in data.channels],
        "trigger_keywords": data.trigger_keywords,
        "template_text": data.template_text,
        "variables": data.variables,
        "is_active": data.is_active,
        "priority": data.priority,
        "requires_human_review": data.requires_human_review,
        "created_by": current_user["id"],
        "approved_by": current_user["id"] if current_user["role"] in ["bod", "admin"] else None,
        "approved_at": now if current_user["role"] in ["bod", "admin"] else None,
        "created_at": now,
        "usage_count": 0
    }
    
    await db.response_templates.insert_one(template_doc)
    return ResponseTemplateResponse(**template_doc)

@api_router.get("/response-templates", response_model=List[ResponseTemplateResponse])
async def get_response_templates(
    category: Optional[ResponseTemplateCategory] = None,
    channel: Optional[Channel] = None,
    is_active: bool = True,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {"is_active": is_active}
    if category:
        query["category"] = category.value
    if channel:
        query["channels"] = channel.value
    
    templates = await db.response_templates.find(query, {"_id": 0}).sort("priority", 1).to_list(100)
    return [ResponseTemplateResponse(**t) for t in templates]

@api_router.put("/response-templates/{template_id}/approve")
async def approve_template(template_id: str, current_user: dict = Depends(get_current_user)):
    """Duyệt template"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.response_templates.update_one(
        {"id": template_id},
        {"$set": {
            "approved_by": current_user["id"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}

# ==================== LEAD ROUTES ====================

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(data: LeadCreate, current_user: dict = Depends(get_current_user)):
    """Tạo lead mới với auto-segment và auto-distribution"""
    # Check duplicate
    existing = await db.leads.find_one({"phone": data.phone}, {"_id": 0})
    if existing:
        # Merge info instead of reject
        merge_data = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "$addToSet": {"tags": {"$each": data.tags}} if data.tags else {}
        }
        if data.channel and data.channel.value not in existing.get("merged_from", []):
            merge_data["$push"] = {"merged_from": data.channel.value}
        
        await db.leads.update_one({"id": existing["id"]}, {"$set": merge_data})
        
        lead = await db.leads.find_one({"id": existing["id"]}, {"_id": 0})
        assigned_name = await get_user_name(lead.get("assigned_to"))
        return LeadResponse(
            **lead,
            phone_masked=mask_phone(lead.get("phone", "")),
            assigned_to_name=assigned_name,
            is_duplicate=True
        )
    
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Auto segment
    segment = segment_lead(data.budget_min, data.budget_max, data.tags)
    
    lead_doc = {
        "id": lead_id,
        "full_name": data.full_name,
        "phone": data.phone,
        "email": data.email,
        "channel": data.channel.value,
        "channel_id": data.channel_id,
        "source_content_id": data.source_content_id,
        "source_campaign_id": data.source_campaign_id,
        "status": LeadStatus.NEW.value,
        "segment": segment.value,
        "project_interest": data.project_interest,
        "product_interest": data.product_interest,
        "budget_min": data.budget_min,
        "budget_max": data.budget_max,
        "location": data.location,
        "notes": data.notes,
        "tags": data.tags,
        "raw_message": data.raw_message,
        "assigned_to": None,
        "assigned_at": None,
        "assignment_reason": None,
        "branch_id": current_user.get("branch_id"),
        "score": 0,
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"],
        "last_activity": None,
        "follow_up_count": 0,
        "is_duplicate": False,
        "merged_from": [],
        # CTV Referral
        "referrer_id": data.referrer_id,
        "referrer_type": data.referrer_type
    }
    
    await db.leads.insert_one(lead_doc)
    
    # Update CTV stats if referrer
    if data.referrer_id and data.referrer_type == "collaborator":
        await db.collaborators.update_one(
            {"id": data.referrer_id},
            {
                "$inc": {"total_leads_referred": 1},
                "$set": {"last_activity": now}
            }
        )
    
    # Calculate initial score
    score_result = await ProHAI.score_lead(lead_doc)
    await db.leads.update_one({"id": lead_id}, {"$set": {"score": score_result["score"]}})
    lead_doc["score"] = score_result["score"]
    
    # Log activity
    referrer_note = ""
    if data.referrer_id:
        if data.referrer_type == "collaborator":
            ctv = await db.collaborators.find_one({"id": data.referrer_id}, {"_id": 0, "full_name": 1, "code": 1})
            if ctv:
                referrer_note = f", Giới thiệu bởi CTV: {ctv.get('full_name')} ({ctv.get('code')})"
    
    await log_activity(
        lead_id=lead_id,
        user_id=current_user["id"],
        activity_type=ActivityType.NOTE,
        title="Lead được tạo",
        content=f"Nguồn: {data.channel.value}, Segment: {segment.value}{referrer_note}"
    )
    
    # Auto distribute
    distribution_result = await LeadDistributionEngine.distribute_lead(lead_doc)
    
    # Reload lead after distribution
    lead_doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    assigned_name = await get_user_name(lead_doc.get("assigned_to"))
    
    # Phase 2: Emit lead_created event (triggers automation rules)
    try:
        await emit_lead_created(lead_doc, current_user["id"], current_user.get("role", "user"))
        
        # Also emit lead_assigned if assigned
        if lead_doc.get("assigned_to"):
            await emit_lead_assigned(
                lead_doc, 
                current_user["id"],
                lead_doc["assigned_to"],
                lead_doc.get("assignment_reason", "Auto distribution"),
                current_user.get("role", "user")
            )
    except Exception as e:
        logger.warning(f"Event emission error (non-blocking): {e}")
    
    # Remove is_duplicate from lead_doc if exists (avoid duplicate kwarg)
    lead_doc_clean = {k: v for k, v in lead_doc.items() if k != "is_duplicate"}
    
    return LeadResponse(
        **lead_doc_clean,
        phone_masked=mask_phone(data.phone),
        assigned_to_name=assigned_name,
        is_duplicate=False
    )

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(
    status: Optional[LeadStatus] = None,
    channel: Optional[Channel] = None,
    segment: Optional[LeadSegment] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {}
    
    # RBAC-based visibility filtering (Prompt 4/20)
    # Replaces hardcoded role checks
    visibility_filter = get_rbac_visibility_filter(current_user, "lead")
    if visibility_filter:
        query.update(visibility_filter)
    
    if status:
        query["status"] = status.value
    if channel:
        query["channel"] = channel.value
    if segment:
        query["segment"] = segment.value
    if assigned_to:
        query["assigned_to"] = assigned_to
    if search:
        # Handle search with existing $or filter
        search_filter = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
        if "$or" in query:
            # Combine visibility $or with search $or using $and
            query = {"$and": [query, {"$or": search_filter}]}
        else:
            query["$or"] = search_filter
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    user_ids = list(set([l.get("assigned_to") for l in leads if l.get("assigned_to")]))
    users = {}
    if user_ids:
        user_docs = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(100)
        users = {u["id"]: u["full_name"] for u in user_docs}
    
    result = []
    for lead in leads:
        # Handle legacy leads that may be missing required fields
        lead_data = {
            **lead,
            "phone_masked": mask_phone(lead.get("phone", "")),
            "assigned_to_name": users.get(lead.get("assigned_to")),
            # Default channel if missing (legacy data fix)
            "channel": lead.get("channel", Channel.WEBSITE.value),
            # Ensure status is present
            "status": lead.get("status", LeadStatus.NEW.value),
            # Ensure required fields
            "created_at": lead.get("created_at", ""),
            "updated_at": lead.get("updated_at", lead.get("created_at", "")),
        }
        try:
            result.append(LeadResponse(**lead_data))
        except Exception as e:
            # Log and skip invalid leads
            logger.warning(f"Skipping invalid lead {lead.get('id')}: {e}")
            continue
    return result

@api_router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    assigned_name = await get_user_name(lead.get("assigned_to"))
    return LeadResponse(**lead, phone_masked=mask_phone(lead.get("phone", "")), assigned_to_name=assigned_name)

@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, updates: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    old_status = lead.get("status")
    old_assigned_to = lead.get("assigned_to")
    
    # Check status change
    if updates.get("status") and updates["status"] != lead.get("status"):
        await log_activity(
            lead_id=lead_id,
            user_id=current_user["id"],
            activity_type=ActivityType.STATUS_CHANGE,
            title="Cập nhật trạng thái",
            content=f"{lead.get('status')} → {updates['status']}"
        )
    
    # Re-segment if budget changes
    if updates.get("budget_min") or updates.get("budget_max"):
        new_segment = segment_lead(
            updates.get("budget_min", lead.get("budget_min")),
            updates.get("budget_max", lead.get("budget_max")),
            updates.get("tags", lead.get("tags"))
        )
        updates["segment"] = new_segment.value
    
    await db.leads.update_one({"id": lead_id}, {"$set": updates})
    
    # Phase 2: Emit events for status and assignment changes
    try:
        # Reload updated lead
        updated_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
        
        # Emit status change event
        if updates.get("status") and updates["status"] != old_status:
            await emit_lead_status_changed(
                updated_lead,
                old_status,
                updates["status"],
                current_user["id"],
                current_user.get("role", "user")
            )
        
        # Emit assignment event
        if updates.get("assigned_to") and updates["assigned_to"] != old_assigned_to:
            await emit_lead_assigned(
                updated_lead,
                current_user["id"],
                updates["assigned_to"],
                updates.get("assignment_reason", "Manual assignment"),
                current_user.get("role", "user")
            )
    except Exception as e:
        logger.warning(f"Event emission error (non-blocking): {e}")
    
    return {"success": True}

@api_router.post("/leads/{lead_id}/reassign")
async def reassign_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    """Yêu cầu AI phân bổ lại lead"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    result = await LeadDistributionEngine.distribute_lead(lead)
    return result

# ==================== DISTRIBUTION RULES ROUTES ====================

@api_router.post("/distribution-rules", response_model=DistributionRuleResponse)
async def create_distribution_rule(data: DistributionRuleCreate, current_user: dict = Depends(get_current_user)):
    """Tạo rule phân bổ lead"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    rule_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    rule_doc = {
        "id": rule_id,
        "name": data.name,
        "description": data.description,
        "method": data.method.value,
        "priority": data.priority,
        "is_active": data.is_active,
        "conditions": data.conditions,
        "config": data.config,
        "target_users": data.target_users,
        "target_teams": data.target_teams,
        "target_branches": data.target_branches,
        "created_at": now,
        "created_by": current_user["id"],
        "last_triggered": None,
        "trigger_count": 0
    }
    
    await db.distribution_rules.insert_one(rule_doc)
    return DistributionRuleResponse(**rule_doc, success_rate=0)

@api_router.get("/distribution-rules", response_model=List[DistributionRuleResponse])
async def get_distribution_rules(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    rules = await db.distribution_rules.find({}, {"_id": 0}).sort("priority", 1).to_list(100)
    return [DistributionRuleResponse(**r, success_rate=0) for r in rules]

@api_router.put("/distribution-rules/{rule_id}/toggle")
async def toggle_distribution_rule(rule_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    rule = await db.distribution_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    new_status = not rule.get("is_active", True)
    await db.distribution_rules.update_one({"id": rule_id}, {"$set": {"is_active": new_status}})
    return {"success": True, "is_active": new_status}

# ==================== AI MESSAGE PROCESSING ROUTES ====================

@api_router.post("/ai/process-message", response_model=AIReplyResult)
async def process_incoming_message(message: IncomingMessage, current_user: dict = Depends(get_current_user)):
    """Xử lý tin nhắn đến và quyết định có reply không"""
    # Get active templates
    templates = await db.response_templates.find(
        {"is_active": True, "approved_by": {"$ne": None}},
        {"_id": 0}
    ).to_list(100)
    
    result = await ProHAI.analyze_message_and_reply(message, templates)
    
    # If should create lead, do it
    if result.should_create_lead and result.extracted_info:
        info = result.extracted_info
        if info.get("phone") or info.get("name"):
            lead_data = LeadCreate(
                full_name=info.get("name", "Unknown"),
                phone=info.get("phone", ""),
                channel=message.channel,
                channel_id=message.channel_user_id,
                source_content_id=message.content_id,
                project_interest=info.get("project_interest"),
                budget_min=float(info["budget"]) if info.get("budget") else None,
                raw_message=message.text
            )
            # Create lead in background
            # await create_lead(lead_data, current_user)
    
    # If should reply and not require review, post the reply
    if result.should_reply and not result.requires_human_review:
        # TODO: Post reply via channel API
        pass
    
    return result

@api_router.post("/ai/chat", response_model=AIChatResponse)
async def proh_ai_chat(data: AIChatMessage, current_user: dict = Depends(get_current_user)):
    """ProH AI Chat - Assistant thông minh"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI not configured")
        
        # Build context
        context_parts = [f"User: {current_user['full_name']} ({current_user['role']})"]
        
        if data.context:
            if data.context.get("lead_id"):
                lead = await db.leads.find_one({"id": data.context["lead_id"]}, {"_id": 0})
                if lead:
                    context_parts.append(f"\nLead: {lead['full_name']}, Status: {lead['status']}, Segment: {lead.get('segment')}, Channel: {lead.get('channel')}")
            
            if data.context.get("include_stats"):
                total_leads = await db.leads.count_documents({})
                hot_leads = await db.leads.count_documents({"status": {"$in": ["hot", "deposit"]}})
                context_parts.append(f"\nStats: {total_leads} leads, {hot_leads} hot")
        
        system_message = f"""Bạn là ProH AI - Trợ lý thông minh của ProHouzing CRM.

KHẢN NĂNG:
1. Phân tích lead, khách hàng
2. Tư vấn chiến lược bán hàng
3. Tạo nội dung marketing
4. Gợi ý kịch bản tư vấn
5. Phân tích hiệu suất

{chr(10).join(context_parts)}

Trả lời ngắn gọn, chuyên nghiệp, bằng tiếng Việt."""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"proh-chat-{current_user['id']}-{datetime.now().strftime('%Y%m%d%H')}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=data.message))
        
        suggestions = ["Phân tích lead", "Tạo content", "Xem báo cáo"]
        
        return AIChatResponse(response=response, suggestions=suggestions, actions=[])
        
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/score-lead")
async def ai_score_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    """AI tính điểm lead"""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    result = await ProHAI.score_lead(lead)
    
    # Update lead score
    await db.leads.update_one({"id": lead_id}, {"$set": {"score": result["score"]}})
    
    return {
        "lead_id": lead_id,
        **result
    }

# ==================== ACTIVITY ROUTES ====================

@api_router.post("/activities", response_model=ActivityResponse)
async def create_activity(data: ActivityCreate, current_user: dict = Depends(get_current_user)):
    activity = await log_activity(
        lead_id=data.lead_id,
        customer_id=data.customer_id,
        user_id=current_user["id"],
        activity_type=data.type,
        title=data.title,
        content=data.content,
        outcome=data.outcome
    )
    
    if data.lead_id:
        update = {"$inc": {"follow_up_count": 1}}
        if data.next_follow_up:
            update["$set"] = {"next_follow_up": data.next_follow_up}
        await db.leads.update_one({"id": data.lead_id}, update)
    
    return ActivityResponse(**activity, user_name=current_user["full_name"])

@api_router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(
    lead_id: Optional[str] = None,
    type: Optional[ActivityType] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {}
    if lead_id:
        query["lead_id"] = lead_id
    if type:
        query["type"] = type.value
    
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for a in activities:
        user_name = await get_user_name(a.get("user_id"))
        result.append(ActivityResponse(**a, user_name=user_name or "System"))
    return result

# ==================== TASK ROUTES ====================

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    task_doc = {
        "id": task_id,
        **data.model_dump(),
        "status": TaskStatus.PENDING.value,
        "created_by": current_user["id"],
        "created_at": now,
        "is_auto": False
    }
    
    await db.tasks.insert_one(task_doc)
    
    assigned_name = await get_user_name(data.assigned_to) if data.assigned_to else None
    
    return TaskResponse(**task_doc, assigned_to_name=assigned_name, is_overdue=False)

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    lead_id: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {}
    
    # RBAC-based visibility filtering (Prompt 4/20)
    visibility_filter = get_rbac_visibility_filter(current_user, "task")
    if visibility_filter:
        query.update(visibility_filter)
    
    if lead_id:
        query["lead_id"] = lead_id
    if status:
        query["status"] = status.value
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("due_date", 1).to_list(100)
    
    now = datetime.now(timezone.utc).isoformat()
    result = []
    for t in tasks:
        assigned_name = await get_user_name(t.get("assigned_to"))
        is_overdue = t["due_date"] < now and t["status"] == TaskStatus.PENDING.value
        result.append(TaskResponse(**t, assigned_to_name=assigned_name, is_overdue=is_overdue))
    return result

@api_router.put("/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"status": TaskStatus.COMPLETED.value, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # RBAC-based visibility filtering (Prompt 4/20)
    query = get_rbac_visibility_filter(current_user, "lead")
    
    total_leads = await db.leads.count_documents(query)
    new_leads = await db.leads.count_documents({**query, "created_at": {"$gte": start_of_month.isoformat()}})
    hot_leads = await db.leads.count_documents({**query, "status": {"$in": ["hot", "deposit"]}})
    
    # Channel breakdown
    channel_stats = await db.leads.aggregate([
        {"$match": query},
        {"$group": {"_id": "$channel", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    # Segment breakdown
    segment_stats = await db.leads.aggregate([
        {"$match": query},
        {"$group": {"_id": "$segment", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    closed_won = await db.leads.count_documents({**query, "status": "closed_won"})
    conversion_rate = (closed_won / total_leads * 100) if total_leads > 0 else 0
    
    # Content stats
    content_published = await db.contents.count_documents({
        "status": ContentStatus.PUBLISHED.value,
        "published_at": {"$gte": start_of_month.isoformat()}
    })
    content_pending = await db.contents.count_documents({"status": ContentStatus.PENDING_REVIEW.value})
    
    return {
        "total_leads": total_leads,
        "new_leads_this_month": new_leads,
        "hot_leads": hot_leads,
        "conversion_rate": round(conversion_rate, 2),
        "closed_deals": closed_won,
        "channel_breakdown": [{"channel": c["_id"], "count": c["count"]} for c in channel_stats],
        "segment_breakdown": [{"segment": s["_id"], "count": s["count"]} for s in segment_stats],
        "content_published": content_published,
        "content_pending_review": content_pending
    }

@api_router.get("/dashboard/lead-funnel")
async def get_lead_funnel(current_user: dict = Depends(get_current_user)):
    # RBAC-based visibility filtering (Prompt 4/20)
    query = get_rbac_visibility_filter(current_user, "lead")
    
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    
    results = await db.leads.aggregate(pipeline).to_list(20)
    funnel = {r["_id"]: r["count"] for r in results}
    
    return {
        "new": funnel.get("new", 0),
        "contacted": funnel.get("contacted", 0),
        "called": funnel.get("called", 0),
        "viewing": funnel.get("viewing", 0),
        "warm": funnel.get("warm", 0),
        "hot": funnel.get("hot", 0),
        "deposit": funnel.get("deposit", 0),
        "negotiation": funnel.get("negotiation", 0),
        "closed_won": funnel.get("closed_won", 0),
        "closed_lost": funnel.get("closed_lost", 0)
    }

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(unread_only: bool = False, limit: int = 20, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"success": True}

# ==================== USERS ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(
    role: Optional[UserRole] = None,
    department: Optional[Department] = None,
    is_active: bool = True,
    current_user: dict = Depends(get_current_user)
):
    # RBAC permission check (Prompt 4/20)
    if not check_rbac_permission(current_user, "user", "view"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query: Dict[str, Any] = {"is_active": is_active}
    if role:
        query["role"] = role.value
    if department:
        query["department"] = department.value
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    
    result = []
    for u in users:
        workload = await db.leads.count_documents({
            "assigned_to": u["id"],
            "status": {"$nin": [LeadStatus.CLOSED_WON.value, LeadStatus.CLOSED_LOST.value]}
        })
        result.append(UserResponse(**u, performance_score=0, current_workload=workload))
    return result

@api_router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update user (role, organization, status) - Prompt 4/20"""
    # RBAC permission check
    if not check_rbac_permission(current_user, "user", "edit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Allowed fields to update
    allowed_fields = [
        "role", "branch_id", "department_id", "team_id", 
        "position_title", "is_active", "full_name", "phone",
        "specializations", "regions", "reports_to"
    ]
    
    update_data = {}
    for field in allowed_fields:
        if field in updates:
            update_data[field] = updates[field]
    
    if not update_data:
        return {"success": True, "message": "No changes"}
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Track role changes for audit
    if "role" in update_data and update_data["role"] != user.get("role"):
        role_change = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "previous_role": user.get("role"),
            "new_role": update_data["role"],
            "changed_by": current_user["id"],
            "changed_at": update_data["updated_at"],
            "reason": updates.get("reason", "Role assignment update")
        }
        await db.role_changes.insert_one(role_change)
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"success": True, "message": "User updated"}

# ==================== DEALS ====================

@api_router.get("/deals")
async def get_deals(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách deals"""
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    # RBAC-based visibility filtering (Prompt 4/20)
    visibility_filter = get_rbac_visibility_filter(current_user, "deal")
    if visibility_filter:
        query.update(visibility_filter)
    
    deals = await db.deals.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with lead and user info
    for deal in deals:
        if deal.get("lead_id"):
            lead = await db.leads.find_one({"id": deal["lead_id"]}, {"_id": 0, "full_name": 1, "phone": 1})
            if lead:
                deal["lead_name"] = lead.get("full_name")
                deal["lead_phone"] = lead.get("phone")
        if deal.get("assigned_to"):
            user = await db.users.find_one({"id": deal["assigned_to"]}, {"_id": 0, "full_name": 1})
            deal["assigned_to_name"] = user["full_name"] if user else None
    
    return deals

@api_router.post("/deals")
async def create_deal(data: dict, current_user: dict = Depends(get_current_user)):
    """Tạo deal mới từ lead"""
    lead_id = data.get("lead_id")
    if not lead_id:
        raise HTTPException(status_code=400, detail="lead_id is required")
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    deal_doc = {
        "id": deal_id,
        "lead_id": lead_id,
        "customer_name": lead.get("full_name"),
        "customer_phone": lead.get("phone"),
        "customer_email": lead.get("email"),
        "project_id": data.get("project_id"),
        "project_name": data.get("project_name"),
        "product_type": data.get("product_type"),  # căn hộ, biệt thự, shophouse, etc.
        "deal_value": data.get("deal_value", 0),
        "commission_rate": data.get("commission_rate", 2.0),  # % hoa hồng cho sales
        "status": data.get("status", "pending"),  # pending, negotiating, contract_signed, won, lost
        "expected_close_date": data.get("expected_close_date"),
        "actual_close_date": None,
        "assigned_to": lead.get("assigned_to") or current_user["id"],
        "notes": data.get("notes"),
        # CTV tracking
        "referrer_id": lead.get("referrer_id"),
        "referrer_type": lead.get("referrer_type"),
        "ctv_commission_calculated": False,
        "ctv_commission_id": None,
        # Meta
        "created_at": now,
        "updated_at": now,
        "created_by": current_user["id"]
    }
    
    await db.deals.insert_one(deal_doc)
    
    # Update lead status to NEGOTIATION
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"status": LeadStatus.NEGOTIATION.value, "updated_at": now}}
    )
    
    # Phase 2: Emit deal_created event (and high_value_deal_detected if applicable)
    try:
        await emit_deal_created(deal_doc, current_user["id"], current_user.get("role", "user"))
    except Exception as e:
        logger.warning(f"Event emission error (non-blocking): {e}")
    
    return {k: v for k, v in deal_doc.items() if k != "_id"}

@api_router.put("/deals/{deal_id}")
async def update_deal(deal_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Cập nhật deal"""
    now = datetime.now(timezone.utc).isoformat()
    data["updated_at"] = now
    
    old_deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not old_deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    new_status = data.get("status")
    
    # If deal status changes to WON
    if new_status == "won" and old_deal.get("status") != "won":
        data["actual_close_date"] = now
        
        # Update lead status
        if old_deal.get("lead_id"):
            await db.leads.update_one(
                {"id": old_deal["lead_id"]},
                {"$set": {"status": LeadStatus.CLOSED_WON.value, "updated_at": now}}
            )
        
        # Calculate CTV commission if has referrer
        if old_deal.get("referrer_id") and old_deal.get("referrer_type") == "collaborator":
            ctv_id = old_deal["referrer_id"]
            deal_value = data.get("deal_value") or old_deal.get("deal_value", 0)
            
            if deal_value > 0 and not old_deal.get("ctv_commission_calculated"):
                # Get CTV and policy
                ctv = await db.collaborators.find_one({"id": ctv_id}, {"_id": 0})
                if ctv and ctv.get("commission_policy_id"):
                    policy = await db.commission_policies.find_one(
                        {"id": ctv["commission_policy_id"]},
                        {"_id": 0}
                    )
                    
                    if policy:
                        # Count CTV's deals this year
                        year_start = f"{datetime.now().year}-01-01T00:00:00Z"
                        ctv_deals_count = await db.deals.count_documents({
                            "referrer_id": ctv_id,
                            "status": "won",
                            "actual_close_date": {"$gte": year_start}
                        })
                        ctv_deals_count += 1  # Include this deal
                        
                        # Find applicable tier
                        commission_rate = 0
                        bonus = 0
                        for tier in policy.get("tiers", []):
                            if tier["min_deals"] <= ctv_deals_count:
                                if tier.get("max_deals") is None or ctv_deals_count <= tier["max_deals"]:
                                    commission_rate = tier["rate"]
                                    bonus = tier.get("bonus", 0)
                        
                        if commission_rate > 0:
                            commission_amount = (deal_value * commission_rate / 100) + bonus
                            
                            # Create commission record
                            commission_id = str(uuid.uuid4())
                            commission_doc = {
                                "id": commission_id,
                                "collaborator_id": ctv_id,
                                "deal_id": deal_id,
                                "deal_value": deal_value,
                                "commission_rate": commission_rate,
                                "bonus": bonus,
                                "commission_amount": commission_amount,
                                "status": "pending",  # pending, approved, paid, cancelled
                                "created_at": now
                            }
                            await db.collaborator_commissions.insert_one(commission_doc)
                            
                            # Update deal
                            data["ctv_commission_calculated"] = True
                            data["ctv_commission_id"] = commission_id
                            
                            # Update CTV stats
                            await db.collaborators.update_one(
                                {"id": ctv_id},
                                {
                                    "$inc": {
                                        "total_deals_closed": 1,
                                        "total_deal_value": deal_value,
                                        "total_commission_earned": commission_amount
                                    },
                                    "$set": {"last_activity": now}
                                }
                            )
                            
                            # Create notification for CTV manager
                            await create_notification(
                                None,  # Admins
                                f"CTV {ctv.get('full_name')} ({ctv.get('code')}) có commission mới: {commission_amount:,.0f}đ từ deal {deal_value:,.0f}đ",
                                "ctv_commission",
                                {"commission_id": commission_id, "ctv_id": ctv_id}
                            )
    
    # If deal status changes to LOST
    elif new_status == "lost" and old_deal.get("status") != "lost":
        if old_deal.get("lead_id"):
            await db.leads.update_one(
                {"id": old_deal["lead_id"]},
                {"$set": {"status": LeadStatus.CLOSED_LOST.value, "updated_at": now}}
            )
    
    await db.deals.update_one({"id": deal_id}, {"$set": data})
    
    # Phase 2: Emit deal_stage_changed event if status changed
    try:
        old_status = old_deal.get("status")
        if new_status and new_status != old_status:
            updated_deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
            await emit_deal_stage_changed(
                updated_deal,
                old_status,
                new_status,
                current_user["id"],
                current_user.get("role", "user")
            )
    except Exception as e:
        logger.warning(f"Event emission error (non-blocking): {e}")
    
    return {"success": True}

@api_router.get("/deals/stats")
async def get_deals_stats(current_user: dict = Depends(get_current_user)):
    """Thống kê deals"""
    query = {}
    if current_user["role"] not in ["bod", "admin", "manager"]:
        query["assigned_to"] = current_user["id"]
    
    total = await db.deals.count_documents(query)
    won = await db.deals.count_documents({**query, "status": "won"})
    lost = await db.deals.count_documents({**query, "status": "lost"})
    pending = await db.deals.count_documents({**query, "status": {"$in": ["pending", "negotiating", "contract_signed"]}})
    
    # Total value
    pipeline = [
        {"$match": {**query, "status": "won"}},
        {"$group": {"_id": None, "total": {"$sum": "$deal_value"}}}
    ]
    value_result = await db.deals.aggregate(pipeline).to_list(1)
    total_value = value_result[0]["total"] if value_result else 0
    
    return {
        "total": total,
        "won": won,
        "lost": lost,
        "pending": pending,
        "total_value": total_value,
        "conversion_rate": round((won / total * 100) if total > 0 else 0, 1)
    }

# ==================== CHANNEL STATS ====================

@api_router.get("/channels/stats")
async def get_channel_stats(current_user: dict = Depends(get_current_user)):
    """Thống kê tổng hợp từ tất cả các kênh"""
    if current_user["role"] not in ["bod", "admin", "marketing"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Count leads by channel
    total_leads = await db.leads.count_documents({})
    leads_today = await db.leads.count_documents({"created_at": {"$gte": today_start.isoformat()}})
    
    # Count active channels
    active_channels = await db.channel_configs.count_documents({"is_active": True})
    
    # Calculate engagement (simplified - based on activities)
    total_activities = await db.activities.count_documents({})
    engagement_rate = round((total_activities / max(total_leads, 1)) * 10, 1)  # Simplified calculation
    
    return {
        "total_leads": total_leads,
        "leads_today": leads_today,
        "active_channels": active_channels,
        "engagement_rate": min(engagement_rate, 10)  # Cap at 10%
    }

# ==================== HRM - ORGANIZATION STRUCTURE ====================

@api_router.get("/hrm/org-units")
async def get_org_units(
    type: Optional[str] = None,
    parent_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách đơn vị tổ chức"""
    query: Dict[str, Any] = {"is_active": True}
    if type:
        query["type"] = type
    if parent_id:
        query["parent_id"] = parent_id
    
    units = await db.org_units.find(query, {"_id": 0}).sort("order", 1).to_list(1000)
    
    # Enrich with counts
    for unit in units:
        unit["employee_count"] = await db.employee_profiles.count_documents({"org_unit_id": unit["id"]})
        unit["children_count"] = await db.org_units.count_documents({"parent_id": unit["id"], "is_active": True})
        if unit.get("manager_id"):
            manager = await db.users.find_one({"id": unit["manager_id"]}, {"_id": 0, "full_name": 1})
            unit["manager_name"] = manager["full_name"] if manager else None
    
    return units

@api_router.get("/hrm/org-tree")
async def get_org_tree(current_user: dict = Depends(get_current_user)):
    """Lấy cây tổ chức dạng nested"""
    all_units = await db.org_units.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(1000)
    
    # Build tree
    def build_tree(parent_id=None):
        children = []
        for unit in all_units:
            if unit.get("parent_id") == parent_id:
                node = {
                    "id": unit["id"],
                    "name": unit["name"],
                    "code": unit["code"],
                    "type": unit["type"],
                    "manager_id": unit.get("manager_id"),
                    "children": build_tree(unit["id"])
                }
                # Get manager info
                children.append(node)
        return children
    
    tree = build_tree()
    
    # Enrich with employee counts and manager info
    async def enrich_node(node):
        node["employee_count"] = await db.employee_profiles.count_documents({"org_unit_id": node["id"]})
        if node.get("manager_id"):
            manager = await db.users.find_one({"id": node["manager_id"]}, {"_id": 0, "full_name": 1, "avatar": 1})
            if manager:
                node["manager_name"] = manager.get("full_name")
                node["manager_avatar"] = manager.get("avatar")
        for child in node.get("children", []):
            await enrich_node(child)
    
    for node in tree:
        await enrich_node(node)
    
    return tree

@api_router.post("/hrm/org-units")
async def create_org_unit(data: dict, current_user: dict = Depends(get_current_user)):
    """Tạo đơn vị tổ chức mới"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check duplicate code
    existing = await db.org_units.find_one({"code": data["code"]})
    if existing:
        raise HTTPException(status_code=400, detail=f"Mã đơn vị '{data['code']}' đã tồn tại")
    
    # Calculate level and path
    level = 0
    path = f"/{data['code']}"
    if data.get("parent_id"):
        parent = await db.org_units.find_one({"id": data["parent_id"]})
        if parent:
            level = parent.get("level", 0) + 1
            path = f"{parent.get('path', '')}/{data['code']}"
    
    unit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    unit_doc = {
        "id": unit_id,
        **data,
        "level": level,
        "path": path,
        "is_active": True,
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.org_units.insert_one(unit_doc)
    if "_id" in unit_doc:
        del unit_doc["_id"]
    
    return unit_doc

@api_router.put("/hrm/org-units/{unit_id}")
async def update_org_unit(unit_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Cập nhật đơn vị tổ chức"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data["updated_by"] = current_user["id"]
    
    await db.org_units.update_one({"id": unit_id}, {"$set": data})
    return {"success": True}

@api_router.delete("/hrm/org-units/{unit_id}")
async def delete_org_unit(unit_id: str, current_user: dict = Depends(get_current_user)):
    """Xóa (vô hiệu hóa) đơn vị tổ chức"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if has children
    children = await db.org_units.count_documents({"parent_id": unit_id, "is_active": True})
    if children > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa đơn vị có đơn vị con")
    
    # Check if has employees
    employees = await db.employee_profiles.count_documents({"org_unit_id": unit_id})
    if employees > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa đơn vị còn nhân viên")
    
    await db.org_units.update_one({"id": unit_id}, {"$set": {"is_active": False}})
    return {"success": True}

# ==================== HRM - JOB POSITIONS ====================

@api_router.get("/hrm/positions")
async def get_job_positions(
    department_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách vị trí công việc"""
    query: Dict[str, Any] = {"is_active": True}
    if department_type:
        query["department_type"] = department_type
    
    positions = await db.job_positions.find(query, {"_id": 0}).sort("level", 1).to_list(1000)
    
    # Count employees per position
    for pos in positions:
        pos["employee_count"] = await db.employee_profiles.count_documents({"position_id": pos["id"]})
    
    return positions

@api_router.post("/hrm/positions")
async def create_job_position(data: dict, current_user: dict = Depends(get_current_user)):
    """Tạo vị trí công việc mới"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check duplicate code
    existing = await db.job_positions.find_one({"code": data["code"]})
    if existing:
        raise HTTPException(status_code=400, detail=f"Mã vị trí '{data['code']}' đã tồn tại")
    
    position_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    position_doc = {
        "id": position_id,
        **data,
        "is_active": True,
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.job_positions.insert_one(position_doc)
    return {k: v for k, v in position_doc.items() if k != "_id"}

@api_router.put("/hrm/positions/{position_id}")
async def update_job_position(position_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Cập nhật vị trí công việc"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.job_positions.update_one({"id": position_id}, {"$set": data})
    return {"success": True}

@api_router.delete("/hrm/positions/{position_id}")
async def delete_job_position(position_id: str, current_user: dict = Depends(get_current_user)):
    """Xóa vị trí công việc"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if has employees
    employees = await db.employee_profiles.count_documents({"position_id": position_id})
    if employees > 0:
        raise HTTPException(status_code=400, detail="Không thể xóa vị trí còn nhân viên")
    
    await db.job_positions.update_one({"id": position_id}, {"$set": {"is_active": False}})
    return {"success": True}

# ==================== HRM - EMPLOYEE PROFILES ====================

@api_router.get("/hrm/employees")
async def get_employees(
    org_unit_id: Optional[str] = None,
    position_id: Optional[str] = None,
    employment_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách nhân viên"""
    query: Dict[str, Any] = {"is_active": True}
    if org_unit_id:
        query["org_unit_id"] = org_unit_id
    if position_id:
        query["position_id"] = position_id
    if employment_type:
        query["employment_type"] = employment_type
    
    profiles = await db.employee_profiles.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with user info and relations
    for profile in profiles:
        user = await db.users.find_one({"id": profile["user_id"]}, {"_id": 0, "email": 1, "full_name": 1, "phone": 1})
        if user:
            profile["user_email"] = user.get("email")
            profile["user_name"] = user.get("full_name")
            profile["user_phone"] = user.get("phone")
        
        if profile.get("position_id"):
            pos = await db.job_positions.find_one({"id": profile["position_id"]}, {"_id": 0, "title": 1})
            profile["position_title"] = pos["title"] if pos else None
        
        if profile.get("org_unit_id"):
            unit = await db.org_units.find_one({"id": profile["org_unit_id"]}, {"_id": 0, "name": 1, "path": 1})
            if unit:
                profile["org_unit_name"] = unit.get("name")
                profile["org_unit_path"] = unit.get("path")
        
        # Calculate tenure
        if profile.get("join_date"):
            try:
                join = datetime.fromisoformat(profile["join_date"].replace("Z", "+00:00"))
                profile["tenure_days"] = (datetime.now(timezone.utc) - join).days
            except:
                profile["tenure_days"] = 0
    
    return profiles

@api_router.get("/hrm/employees/{user_id}")
async def get_employee_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    """Lấy chi tiết hồ sơ nhân viên"""
    profile = await db.employee_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
    
    # Enrich
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user:
        profile["user_email"] = user.get("email")
        profile["user_name"] = user.get("full_name")
        profile["user_phone"] = user.get("phone")
    
    # Get managers info
    profile["managers"] = []
    for mid in profile.get("manager_ids", []):
        mgr = await db.users.find_one({"id": mid}, {"_id": 0, "id": 1, "full_name": 1, "email": 1})
        if mgr:
            profile["managers"].append(mgr)
    
    # Performance stats
    profile["total_leads"] = await db.leads.count_documents({"assigned_to": user_id})
    profile["total_deals"] = await db.deals.count_documents({"assigned_to": user_id, "status": "won"})
    
    return profile

@api_router.post("/hrm/employees")
async def create_employee_profile(data: dict, current_user: dict = Depends(get_current_user)):
    """Tạo/cập nhật hồ sơ nhân viên"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Check if profile exists
    existing = await db.employee_profiles.find_one({"user_id": user_id})
    
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        data["updated_at"] = now
        await db.employee_profiles.update_one({"user_id": user_id}, {"$set": data})
        return {"success": True, "id": existing["id"]}
    else:
        profile_id = str(uuid.uuid4())
        profile_doc = {
            "id": profile_id,
            **data,
            "is_active": True,
            "created_at": now
        }
        await db.employee_profiles.insert_one(profile_doc)
        return {"success": True, "id": profile_id}

# ==================== HRM - COMMISSION POLICIES ====================

@api_router.get("/hrm/commission-policies")
async def get_commission_policies(current_user: dict = Depends(get_current_user)):
    """Lấy danh sách chính sách hoa hồng"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    policies = await db.commission_policies.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    for policy in policies:
        policy["collaborator_count"] = await db.collaborators.count_documents({
            "commission_policy_id": policy["id"],
            "status": "active"
        })
    
    return policies

@api_router.post("/hrm/commission-policies")
async def create_commission_policy(data: dict, current_user: dict = Depends(get_current_user)):
    """Tạo chính sách hoa hồng"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    policy_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    policy_doc = {
        "id": policy_id,
        **data,
        "is_active": True,
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.commission_policies.insert_one(policy_doc)
    return {k: v for k, v in policy_doc.items() if k != "_id"}

@api_router.put("/hrm/commission-policies/{policy_id}")
async def update_commission_policy(policy_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Cập nhật chính sách hoa hồng"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.commission_policies.update_one({"id": policy_id}, {"$set": data})
    return {"success": True}

# ==================== HRM - COLLABORATORS (CTV) ====================

@api_router.get("/hrm/collaborators")
async def get_collaborators(
    status: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
    org_unit_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách cộng tác viên"""
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if assigned_to_id:
        query["assigned_to_id"] = assigned_to_id
    if org_unit_id:
        query["org_unit_id"] = org_unit_id
    
    # Non-admin can only see their own CTVs
    if current_user["role"] not in ["bod", "admin", "manager"]:
        query["assigned_to_id"] = current_user["id"]
    
    collaborators = await db.collaborators.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich
    for ctv in collaborators:
        if ctv.get("assigned_to_id"):
            user = await db.users.find_one({"id": ctv["assigned_to_id"]}, {"_id": 0, "full_name": 1})
            ctv["assigned_to_name"] = user["full_name"] if user else None
        
        if ctv.get("commission_policy_id"):
            policy = await db.commission_policies.find_one({"id": ctv["commission_policy_id"]}, {"_id": 0, "name": 1})
            ctv["commission_policy_name"] = policy["name"] if policy else None
        
        if ctv.get("org_unit_id"):
            unit = await db.org_units.find_one({"id": ctv["org_unit_id"]}, {"_id": 0, "name": 1})
            ctv["org_unit_name"] = unit["name"] if unit else None
        
        # Stats
        ctv["total_leads_referred"] = await db.leads.count_documents({"referrer_id": ctv["id"]})
        ctv["total_deals_closed"] = await db.deals.count_documents({"referrer_id": ctv["id"], "status": "won"})
        
        # Commission stats
        commissions = await db.collaborator_commissions.find({"collaborator_id": ctv["id"]}, {"_id": 0}).to_list(1000)
        ctv["total_commission_earned"] = sum(c.get("commission_amount", 0) for c in commissions)
        ctv["total_commission_paid"] = sum(c.get("commission_amount", 0) for c in commissions if c.get("status") == "paid")
        ctv["pending_commission"] = ctv["total_commission_earned"] - ctv["total_commission_paid"]
    
    return collaborators

@api_router.get("/hrm/collaborators/{ctv_id}")
async def get_collaborator(ctv_id: str, current_user: dict = Depends(get_current_user)):
    """Lấy chi tiết cộng tác viên"""
    ctv = await db.collaborators.find_one({"id": ctv_id}, {"_id": 0})
    if not ctv:
        raise HTTPException(status_code=404, detail="Không tìm thấy CTV")
    
    # Get leads referred by this CTV
    ctv["leads"] = await db.leads.find({"referrer_id": ctv_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get commissions
    ctv["commissions"] = await db.collaborator_commissions.find({"collaborator_id": ctv_id}, {"_id": 0}).to_list(100)
    
    return ctv

@api_router.post("/hrm/collaborators")
async def create_collaborator(data: dict, current_user: dict = Depends(get_current_user)):
    """Tạo cộng tác viên mới"""
    # Check duplicate phone
    existing = await db.collaborators.find_one({"phone": data["phone"]})
    if existing:
        raise HTTPException(status_code=400, detail=f"SĐT '{data['phone']}' đã được đăng ký")
    
    # Generate CTV code
    count = await db.collaborators.count_documents({})
    ctv_code = f"CTV{str(count + 1).zfill(4)}"
    
    ctv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    ctv_doc = {
        "id": ctv_id,
        "code": ctv_code,
        **data,
        "status": "pending",  # Chờ duyệt
        "join_date": now,
        "is_active": True,
        "created_at": now,
        "created_by": current_user["id"]
    }
    
    await db.collaborators.insert_one(ctv_doc)
    
    # Create notification for admin
    await create_notification(
        None,  # All admins
        f"CTV mới đăng ký: {data['full_name']} ({ctv_code})",
        "collaborator_pending",
        {"collaborator_id": ctv_id}
    )
    
    return {k: v for k, v in ctv_doc.items() if k != "_id"}

@api_router.put("/hrm/collaborators/{ctv_id}")
async def update_collaborator(ctv_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Cập nhật thông tin CTV"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.collaborators.update_one({"id": ctv_id}, {"$set": data})
    return {"success": True}

@api_router.post("/hrm/collaborators/{ctv_id}/approve")
async def approve_collaborator(ctv_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Duyệt hoặc từ chối CTV"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    status = data.get("status", "active")  # active or rejected
    
    update_data = {
        "status": status,
        "approved_by": current_user["id"],
        "approved_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.get("commission_policy_id"):
        update_data["commission_policy_id"] = data["commission_policy_id"]
    
    if data.get("assigned_to_id"):
        update_data["assigned_to_id"] = data["assigned_to_id"]
    
    await db.collaborators.update_one({"id": ctv_id}, {"$set": update_data})
    
    return {"success": True}

# ==================== HRM - COLLABORATOR COMMISSIONS ====================

@api_router.get("/hrm/commissions")
async def get_commissions(
    collaborator_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách hoa hồng"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query: Dict[str, Any] = {}
    if collaborator_id:
        query["collaborator_id"] = collaborator_id
    if status:
        query["status"] = status
    
    commissions = await db.collaborator_commissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich
    for comm in commissions:
        ctv = await db.collaborators.find_one({"id": comm["collaborator_id"]}, {"_id": 0, "full_name": 1, "code": 1})
        if ctv:
            comm["collaborator_name"] = ctv.get("full_name")
            comm["collaborator_code"] = ctv.get("code")
    
    return commissions

@api_router.post("/hrm/commissions/{commission_id}/approve")
async def approve_commission(commission_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Duyệt hoa hồng"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.collaborator_commissions.update_one(
        {"id": commission_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True}

@api_router.post("/hrm/commissions/{commission_id}/pay")
async def pay_commission(commission_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Thanh toán hoa hồng"""
    if current_user["role"] not in ["bod", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.collaborator_commissions.update_one(
        {"id": commission_id},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_ref": data.get("payment_ref"),
            "notes": data.get("notes")
        }}
    )
    return {"success": True}

# ==================== HRM - STATS ====================

@api_router.get("/hrm/stats")
async def get_hrm_stats(current_user: dict = Depends(get_current_user)):
    """Thống kê tổng quan HRM"""
    total_employees = await db.employee_profiles.count_documents({"is_active": True})
    total_collaborators = await db.collaborators.count_documents({"status": "active"})
    pending_collaborators = await db.collaborators.count_documents({"status": "pending"})
    total_positions = await db.job_positions.count_documents({"is_active": True})
    total_org_units = await db.org_units.count_documents({"is_active": True})
    
    # Commission stats
    pending_commissions = await db.collaborator_commissions.count_documents({"status": "pending"})
    
    pipeline = [
        {"$match": {"status": "pending"}},
        {"$group": {"_id": None, "total": {"$sum": "$commission_amount"}}}
    ]
    pending_amount_result = await db.collaborator_commissions.aggregate(pipeline).to_list(1)
    pending_commission_amount = pending_amount_result[0]["total"] if pending_amount_result else 0
    
    return {
        "total_employees": total_employees,
        "total_collaborators": total_collaborators,
        "pending_collaborators": pending_collaborators,
        "total_positions": total_positions,
        "total_org_units": total_org_units,
        "pending_commissions": pending_commissions,
        "pending_commission_amount": pending_commission_amount
    }

# ==================== HEALTH ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/")
async def root():
    return {"message": "ProHouzing CRM API v3.0 - Omnichannel Marketing Automation", "status": "running"}

# Include Finance router
from finance_api import finance_router
api_router.include_router(finance_router)

# Include HRM Advanced router
from hrm_advanced_api import hrm_advanced_router
api_router.include_router(hrm_advanced_router)

# Include Task Management router
from task_api import task_router
api_router.include_router(task_router)

# OLD Sales router - commented out to avoid conflict with new sales router
# from sales_api import sales_router as old_sales_router
# api_router.include_router(old_sales_router)

# Include Website router (public endpoints)
from website_api import website_router
api_router.include_router(website_router)

# Include Admin Project Management router
from admin_project_api import admin_project_router
api_router.include_router(admin_project_router)

# Include Video Editor router
from video_editor_api import video_editor_router
api_router.include_router(video_editor_router)

# Include Admin Content Management router (Careers, News, Testimonials, Partners)
from admin_content_api import admin_content_router
api_router.include_router(admin_content_router)

# Include File Upload router
from upload_api import upload_router
api_router.include_router(upload_router)

# Include Newsletter & Notifications router
from newsletter_api import newsletter_router, notification_router
api_router.include_router(newsletter_router)
api_router.include_router(notification_router)

# Include router
# Include config router for Dynamic Data Foundation (Prompt 3/20)
from config_api import router as config_router
app.include_router(config_router)

# Include RBAC router for Organization & Permission Foundation (Prompt 4/20)
from routes.rbac_router import router as rbac_router, set_database as set_rbac_db
set_rbac_db(db)
app.include_router(rbac_router)

# Include Product/Inventory router for Prompt 5/20
from routes.product_router import router as product_router, set_database as set_product_db
set_product_db(db)
app.include_router(product_router)

# Include CRM router for Prompt 6/20 - CRM Unified Profile Standardization
from routes.crm_router import router as crm_router, set_database as set_crm_db
set_crm_db(db)
app.include_router(crm_router)

# Include Marketing router for Prompt 7/20 - Lead Source & Marketing Attribution
from routes.marketing_router import router as marketing_router, set_database as set_marketing_db
set_marketing_db(db)
app.include_router(marketing_router)

# Include Sales router for Prompt 8/20 - Sales Pipeline, Booking & Deal Engine
from routes.sales_router import router as sales_router, set_database as set_sales_db
set_sales_db(db)
app.include_router(sales_router)

# Include Contract router for Prompt 9/20 - Contract & Document Workflow
from routes.contract_router import router as contract_router, set_database as set_contract_db
set_contract_db(db)
app.include_router(contract_router)

# Include Document router for Prompt 9/20 - Contract & Document Workflow
from routes.document_router import router as document_router, set_database as set_document_db
set_document_db(db)
app.include_router(document_router)

# Work OS Router (Prompt 10/20)
from routes.work_router import router as work_router
app.include_router(work_router)

# Commission Router (Prompt 11/20)
from routes.commission_router import router as commission_router, set_database as set_commission_db
set_commission_db(db)
app.include_router(commission_router)

# KPI Router (Prompt 12/20)
from routes.kpi_router import kpi_router
api_router.include_router(kpi_router)

# Marketing V2 Router (Prompt 13/20) - Standardized Omnichannel Marketing Engine
from routes.marketing_router_v2 import router as marketing_router_v2, set_database as set_marketing_v2_db
set_marketing_v2_db(db)
app.include_router(marketing_router_v2)

# CMS Router (Prompt 14/20) - Website CMS / Landing Page / SEO Engine
from routes.cms_router import cms_router
api_router.include_router(cms_router)

# Analytics Router (Prompt 16/20) - Advanced Reports & Analytics Engine
from routes.analytics_router import analytics_router
api_router.include_router(analytics_router)

# Control Center Router (Prompt 17/20) - Executive Control Center & Operations Command Center
from routes.control_center_router import control_router
api_router.include_router(control_router)

# AI Insight Router (Prompt 18/20) - AI Decision Engine
from routes.ai_insight_router import router as ai_insight_router, create_ai_insight_routes
ai_insight_routes = create_ai_insight_routes(db, get_current_user)
api_router.include_router(ai_insight_routes)

# Automation Router (Prompt 19/20) - Operational Autopilot
from routes.automation_router import create_automation_router
automation_router = create_automation_router(lambda: db, get_current_user)
api_router.include_router(automation_router)

# Finance Router (Payment, Commission, Payout, Tax)
from routes.finance_router import router as finance_router, set_database as set_finance_db
set_finance_db(db)
app.include_router(finance_router)

# HR Profile 360° Router
from routes.hr_router import router as hr_router, configure_hr_router
configured_hr_router = configure_hr_router(db, get_current_user)
app.include_router(configured_hr_router)

# Payroll & Workforce Management Router
from routes.payroll_router import router as payroll_router, configure_payroll_router
configured_payroll_router = configure_payroll_router(db, get_current_user)
app.include_router(configured_payroll_router)

# Phase 3.5: Auto Recruitment + Onboarding Engine
from routes.recruitment_router import recruitment_router
api_router.include_router(recruitment_router)

# Phase 4: AI Email Automation System
from routes.email_router import email_router
api_router.include_router(email_router)

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1/18: API V2 - PostgreSQL Master Data Model Routes
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes import api_v2_router
    api_router.include_router(api_v2_router)
    logger.info("API v2 routes (PostgreSQL Master Data Model) loaded successfully")
except ImportError as e:
    logger.warning(f"API v2 routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading API v2 routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT 5/20 - CANONICAL INVENTORY API V2
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.inventory_v2 import router as inventory_v2_router
    api_router.include_router(inventory_v2_router)
    logger.info("Inventory V2 routes (Canonical Inventory Model) loaded successfully")
except ImportError as e:
    logger.warning(f"Inventory V2 routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Inventory V2 routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT 5/20 - PHASE 2: PRICE MODEL API
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.price_routes import price_router
    api_router.include_router(price_router)
    logger.info("Price API routes loaded successfully")
except ImportError as e:
    logger.warning(f"Price routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Price routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT 5/20 - PHASE 2: OWNERSHIP MODEL API
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.ownership_routes import ownership_router
    api_router.include_router(ownership_router)
    logger.info("Ownership API routes loaded successfully")
except ImportError as e:
    logger.warning(f"Ownership routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Ownership routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT 5/20 - PHASE 2: PUBLIC PRODUCT API (No Auth)
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.public_product_routes import public_product_router
    app.include_router(public_product_router)  # No api_router prefix, no auth
    logger.info("Public Product API routes loaded successfully")
except ImportError as e:
    logger.warning(f"Public Product routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Public Product routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# TASK 1 - SALES OPERATIONS API
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.sales_ops_routes import sales_ops_router
    api_router.include_router(sales_ops_router)
    logger.info("Sales Operations API routes loaded successfully")
except ImportError as e:
    logger.warning(f"Sales Operations routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Sales Operations routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# TASK 2 - SALES PIPELINE API
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.pipeline_routes import pipeline_router
    api_router.include_router(pipeline_router)
    logger.info("Sales Pipeline API routes loaded successfully")
except ImportError as e:
    logger.warning(f"Sales Pipeline routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Sales Pipeline routes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# INVENTORY MIDDLEWARE (Rate Limit, Request Logging)
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from middleware.inventory_middleware import setup_inventory_middleware
    setup_inventory_middleware(app)
    logger.info("Inventory middleware configured")
except ImportError as e:
    logger.warning(f"Inventory middleware not available: {e}")
except Exception as e:
    logger.warning(f"Inventory middleware setup error: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# TASK 3 - MANAGER CONTROL ROUTES
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from core.routes.manager_routes import router as manager_router
    app.include_router(manager_router)
    logger.info("Manager Control API routes loaded successfully")
except ImportError as e:
    logger.warning(f"Manager Control routes not available: {e}")
except Exception as e:
    logger.error(f"Error loading Manager Control routes: {e}")

# AI Sales Engine (replaces basic ai_sales_api)
try:
    from ai_sales_engine import router as ai_sales_router
    app.include_router(ai_sales_router, prefix="/api/ai", tags=["AI Sales Engine"])
    logger.info("AI Sales Engine loaded successfully")
except ImportError as e:
    logger.warning(f"AI Sales Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading AI Sales Engine: {e}")

# Booking Engine
try:
    from booking_engine import router as booking_router
    app.include_router(booking_router, prefix="/api/bookings", tags=["Booking Engine"])
    logger.info("Booking Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Booking Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Booking Engine: {e}")

# Notification Service
try:
    from notification_service import router as notification_service_router
    app.include_router(notification_service_router, prefix="/api/notifications", tags=["Notification Service"])
    logger.info("Notification Service loaded successfully")
except ImportError as e:
    logger.warning(f"Notification Service not available: {e}")
except Exception as e:
    logger.error(f"Error loading Notification Service: {e}")

# SLA Engine
try:
    from sla_engine import router as sla_router, start_sla_engine
    app.include_router(sla_router, prefix="/api/sla", tags=["SLA Engine"])
    logger.info("SLA Engine loaded successfully")
except ImportError as e:
    logger.warning(f"SLA Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading SLA Engine: {e}")

# Manager Dashboard
try:
    from manager_dashboard import router as manager_dashboard_router
    app.include_router(manager_dashboard_router, prefix="/api/dashboard/manager", tags=["Manager Dashboard"])
    logger.info("Manager Dashboard loaded successfully")
except ImportError as e:
    logger.warning(f"Manager Dashboard not available: {e}")
except Exception as e:
    logger.error(f"Error loading Manager Dashboard: {e}")

# SEO Engine
try:
    from seo_engine import router as seo_router
    app.include_router(seo_router, prefix="/api/seo", tags=["SEO Engine"])
    logger.info("SEO Engine loaded successfully")
except ImportError as e:
    logger.warning(f"SEO Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading SEO Engine: {e}")

# Sitemap Generator
try:
    from sitemap_generator import router as sitemap_router
    app.include_router(sitemap_router, prefix="/api/sitemap", tags=["Sitemap"])
    logger.info("Sitemap Generator loaded successfully")
except ImportError as e:
    logger.warning(f"Sitemap Generator not available: {e}")
except Exception as e:
    logger.error(f"Error loading Sitemap Generator: {e}")

# Topical Cluster Engine
try:
    from cluster_engine import router as cluster_router
    app.include_router(cluster_router, prefix="/api/seo/clusters", tags=["Topical Clusters"])
    logger.info("Topical Cluster Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Topical Cluster Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Topical Cluster Engine: {e}")

# Google Indexing Engine
try:
    from indexing_engine import router as indexing_router
    app.include_router(indexing_router, prefix="/api/seo/index", tags=["Google Indexing"])
    logger.info("Google Indexing Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Google Indexing Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Google Indexing Engine: {e}")

# Traffic Engine
try:
    from traffic_engine import router as traffic_router
    app.include_router(traffic_router, prefix="/api/seo/traffic", tags=["Traffic Engine"])
    logger.info("Traffic Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Traffic Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Traffic Engine: {e}")

# Rank Tracking Engine
try:
    from rank_tracking import router as rank_router
    app.include_router(rank_router, prefix="/api/seo/rank", tags=["Rank Tracking"])
    logger.info("Rank Tracking Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Rank Tracking Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Rank Tracking Engine: {e}")

# Publish Strategy Engine
try:
    from publish_strategy_engine import router as publish_router
    app.include_router(publish_router, prefix="/api/seo/publish", tags=["Publish Strategy"])
    logger.info("Publish Strategy Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Publish Strategy Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Publish Strategy Engine: {e}")

# Backlink Engine
try:
    from backlink_engine import router as backlink_router
    app.include_router(backlink_router, prefix="/api/seo/backlink", tags=["Backlink Engine"])
    logger.info("Backlink Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Backlink Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Backlink Engine: {e}")

# E-E-A-T Engine
try:
    from eeat_engine import router as eeat_router
    app.include_router(eeat_router, prefix="/api/seo/eeat", tags=["E-E-A-T Engine"])
    logger.info("E-E-A-T Engine loaded successfully")
except ImportError as e:
    logger.warning(f"E-E-A-T Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading E-E-A-T Engine: {e}")

# Schema Engine
try:
    from schema_engine import router as schema_router
    app.include_router(schema_router, prefix="/api/seo/schema", tags=["Schema Engine"])
    logger.info("Schema Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Schema Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Schema Engine: {e}")

# Local SEO Engine
try:
    from local_seo_engine import router as local_seo_router
    app.include_router(local_seo_router, prefix="/api/seo/local", tags=["Local SEO Engine"])
    logger.info("Local SEO Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Local SEO Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Local SEO Engine: {e}")

# Authority Backlink Engine
try:
    from authority_backlink_engine import router as authority_router
    app.include_router(authority_router, prefix="/api/seo/authority", tags=["Authority Backlink Engine"])
    logger.info("Authority Backlink Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Authority Backlink Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Authority Backlink Engine: {e}")

# User Signal Engine
try:
    from user_signal_engine import router as signal_router
    app.include_router(signal_router, prefix="/api/seo/signals", tags=["User Signal Engine"])
    logger.info("User Signal Engine loaded successfully")
except ImportError as e:
    logger.warning(f"User Signal Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading User Signal Engine: {e}")

# Brand Entity Engine
try:
    from brand_entity_engine import router as brand_router
    app.include_router(brand_router, prefix="/api/seo/brand", tags=["Brand Entity Engine"])
    logger.info("Brand Entity Engine loaded successfully")
except ImportError as e:
    logger.warning(f"Brand Entity Engine not available: {e}")
except Exception as e:
    logger.error(f"Error loading Brand Entity Engine: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE D — AI Features Router
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from ai_features_router import router as ai_features_router
    app.include_router(ai_features_router, prefix="/api", tags=["AI Features"])
    logger.info("✅ AI Features router loaded (Valuation, Lead Scoring, Chat, Deal Pred, Content, Recommend, KPI, Sentiment)")
except ImportError as e:
    logger.warning(f"AI Features router not available: {e}")
except Exception as e:
    logger.error(f"Error loading AI Features router: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — AI Staff Copilot (Internal — POST /api/ai/copilot/chat)
# ═══════════════════════════════════════════════════════════════════════════════
try:
    from ai_copilot_api import router as ai_copilot_router
    app.include_router(ai_copilot_router, prefix="/api", tags=["AI Staff Copilot"])
    logger.info("✅ AI Staff Copilot loaded (/api/ai/copilot/chat) — knowledge base: NOBU Danang")
except ImportError as e:
    logger.warning(f"AI Staff Copilot not available: {e}")
except Exception as e:
    logger.error(f"Error loading AI Staff Copilot: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE B — New Module Routers (Secondary, Leasing, HR Dev)
# ═══════════════════════════════════════════════════════════════════════════════

try:
    from secondary_router import router as secondary_router
    app.include_router(secondary_router, prefix="/api", tags=["Secondary Sales"])
    logger.info("✅ Secondary Sales router loaded")
except ImportError as e:
    logger.warning(f"Secondary router not available: {e}")
except Exception as e:
    logger.error(f"Error loading Secondary router: {e}")

try:
    from leasing_router import router as leasing_router_module
    app.include_router(leasing_router_module, prefix="/api", tags=["Leasing"])
    logger.info("✅ Leasing router loaded")
except ImportError as e:
    logger.warning(f"Leasing router not available: {e}")
except Exception as e:
    logger.error(f"Error loading Leasing router: {e}")

try:
    from hr_phase4_router import router as hr_phase4_router
    app.include_router(hr_phase4_router, prefix="/api", tags=["HR Development"])
    logger.info("✅ HR Phase 4 router loaded (Career Path, Competition, Training)")
except ImportError as e:
    logger.warning(f"HR Phase 4 router not available: {e}")
except Exception as e:
    logger.error(f"Error loading HR Phase 4 router: {e}")

app.include_router(api_router)


# CORS Configuration - Always allow localhost for dev + production domains from env
_cors_env = os.environ.get("CORS_ORIGINS", "")
_default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://prohouzing.com",
    "https://www.prohouzing.com",
    "https://api.prohouzing.com",
]
if _cors_env and _cors_env != "*":
    cors_origins = list(set(_default_origins + [o.strip() for o in _cors_env.split(",")]))
else:
    cors_origins = _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # ─── Init PostgreSQL first (primary DB) ───────────────────────────────────
    try:
        from core.database import init_db
        init_db()
        logger.info("✅ PostgreSQL schema initialized")
    except Exception as e:
        logger.error(f"❌ PostgreSQL init failed: {e}")

    # ─── MongoDB legacy indexes (SKIP if MongoDB unavailable) ─────────────────
    try:
        # Quick connectivity check before attempting any index creation
        await asyncio.wait_for(client.server_info(), timeout=3)
        logger.info("MongoDB reachable – creating legacy indexes")
        _mongo_available = True
    except Exception:
        logger.warning("⚠️  MongoDB not reachable – skipping legacy index creation (PostgreSQL-only mode)")
        _mongo_available = False

    if not _mongo_available:
        # Skip all MongoDB index creation – PostgreSQL-only mode
        logger.info("✅ Application started in PostgreSQL-only mode")
        return

    # MongoDB is available → create all legacy indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.leads.create_index("id", unique=True)
        await db.leads.create_index("phone")
        await db.leads.create_index([("status", 1), ("assigned_to", 1)])
        await db.leads.create_index([("channel", 1), ("segment", 1)])
        await db.contents.create_index("id", unique=True)
        await db.contents.create_index([("status", 1), ("scheduled_at", 1)])
        await db.response_templates.create_index("id", unique=True)
        await db.channel_configs.create_index("id", unique=True)
        await db.distribution_rules.create_index("id", unique=True)
        await db.activities.create_index([("lead_id", 1), ("created_at", -1)])
        await db.tasks.create_index([("assigned_to", 1), ("due_date", 1)])
        await db.notifications.create_index([("user_id", 1), ("is_read", 1)])
    except Exception as e:
        logger.warning(f"MongoDB core indexes: {e}")

    # Prompt 4/20: Organization indexes (wrapped in try/except for existing indexes)
    try:
        await db.companies.create_index("id", unique=True)
        await db.companies.create_index("code", unique=True, sparse=True, name="code_sparse_1")
    except Exception as e:
        logger.warning(f"Companies index: {e}")
    
    try:
        await db.branches.create_index("id", unique=True)
        await db.branches.create_index([("company_id", 1), ("code", 1)], sparse=True, name="company_code_1")
    except Exception as e:
        logger.warning(f"Branches index: {e}")
    
    try:
        await db.departments.create_index("id", unique=True)
        await db.departments.create_index([("branch_id", 1), ("code", 1)], sparse=True, name="branch_code_1")
    except Exception as e:
        logger.warning(f"Departments index: {e}")
    
    try:
        await db.teams.create_index("id", unique=True)
        await db.teams.create_index([("department_id", 1), ("code", 1)], sparse=True, name="dept_code_1")
    except Exception as e:
        logger.warning(f"Teams index: {e}")
    
    try:
        await db.ownership_transfers.create_index("id", unique=True)
        await db.ownership_transfers.create_index([("entity_type", 1), ("entity_id", 1)])
    except Exception as e:
        logger.warning(f"Ownership transfers index: {e}")
    
    # Prompt 5/20: Product/Inventory indexes
    try:
        await db.projects_master.create_index("id", unique=True)
        await db.projects_master.create_index("code", unique=True)
        await db.projects_master.create_index([("city", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Projects master index: {e}")
    
    try:
        await db.project_blocks.create_index("id", unique=True)
        await db.project_blocks.create_index([("project_id", 1), ("code", 1)])
    except Exception as e:
        logger.warning(f"Project blocks index: {e}")
    
    try:
        await db.project_floors.create_index("id", unique=True)
        await db.project_floors.create_index([("block_id", 1), ("floor_number", 1)])
    except Exception as e:
        logger.warning(f"Project floors index: {e}")
    
    try:
        await db.products.create_index("id", unique=True)
        await db.products.create_index([("project_id", 1), ("code", 1)], unique=True)
        await db.products.create_index([("project_id", 1), ("inventory_status", 1)])
        await db.products.create_index([("inventory_status", 1)])
        await db.products.create_index([("block_id", 1), ("floor_number", 1)])
    except Exception as e:
        logger.warning(f"Products index: {e}")
    
    try:
        await db.product_status_history.create_index("id", unique=True)
        await db.product_status_history.create_index([("product_id", 1), ("changed_at", -1)])
    except Exception as e:
        logger.warning(f"Product status history index: {e}")
    
    try:
        await db.product_price_history.create_index("id", unique=True)
        await db.product_price_history.create_index([("product_id", 1), ("changed_at", -1)])
    except Exception as e:
        logger.warning(f"Product price history index: {e}")
    
    # Prompt 6/20: CRM indexes
    try:
        await db.contacts.create_index("id", unique=True)
        await db.contacts.create_index("phone", unique=True)
        await db.contacts.create_index("phone_normalized")
        await db.contacts.create_index([("status", 1), ("assigned_to", 1)])
        await db.contacts.create_index([("is_primary", 1), ("created_at", -1)])
    except Exception as e:
        logger.warning(f"Contacts index: {e}")
    
    try:
        await db.demand_profiles.create_index("id", unique=True)
        await db.demand_profiles.create_index([("contact_id", 1), ("is_active", 1)])
    except Exception as e:
        logger.warning(f"Demand profiles index: {e}")
    
    try:
        await db.crm_interactions.create_index("id", unique=True)
        await db.crm_interactions.create_index([("contact_id", 1), ("created_at", -1)])
        await db.crm_interactions.create_index([("lead_id", 1), ("created_at", -1)])
        await db.crm_interactions.create_index([("deal_id", 1), ("created_at", -1)])
    except Exception as e:
        logger.warning(f"CRM interactions index: {e}")
    
    try:
        await db.assignment_history.create_index("id", unique=True)
        await db.assignment_history.create_index([("entity_type", 1), ("entity_id", 1), ("assigned_at", -1)])
    except Exception as e:
        logger.warning(f"Assignment history index: {e}")
    
    try:
        await db.duplicate_candidates.create_index("id", unique=True)
        await db.duplicate_candidates.create_index([("status", 1), ("detected_at", -1)])
    except Exception as e:
        logger.warning(f"Duplicate candidates index: {e}")
    
    # Prompt 7/20: Marketing indexes
    try:
        await db.lead_sources.create_index("id", unique=True)
        await db.lead_sources.create_index("code", unique=True)
        await db.lead_sources.create_index([("source_type", 1), ("is_active", 1)])
        await db.lead_sources.create_index([("channel", 1), ("is_active", 1)])
    except Exception as e:
        logger.warning(f"Lead sources index: {e}")
    
    try:
        await db.campaigns.create_index("id", unique=True)
        await db.campaigns.create_index("code", unique=True)
        await db.campaigns.create_index([("status", 1), ("start_date", -1)])
        await db.campaigns.create_index([("campaign_type", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Campaigns index: {e}")
    
    try:
        await db.touchpoints.create_index("id", unique=True)
        await db.touchpoints.create_index([("contact_id", 1), ("occurred_at", -1)])
        await db.touchpoints.create_index([("lead_id", 1), ("occurred_at", -1)])
        await db.touchpoints.create_index([("lead_source_id", 1)])
        await db.touchpoints.create_index([("campaign_id", 1)])
    except Exception as e:
        logger.warning(f"Touchpoints index: {e}")
    
    try:
        await db.assignment_rules.create_index("id", unique=True)
        await db.assignment_rules.create_index([("priority", 1), ("is_active", 1)])
    except Exception as e:
        logger.warning(f"Assignment rules index: {e}")
    
    try:
        await db.campaign_status_history.create_index("id", unique=True)
        await db.campaign_status_history.create_index([("campaign_id", 1), ("changed_at", -1)])
    except Exception as e:
        logger.warning(f"Campaign status history index: {e}")
    
    # Add lead_source_id and campaign_id index to leads
    try:
        await db.leads.create_index([("lead_source_id", 1)])
        await db.leads.create_index([("campaign_id", 1)])
    except Exception as e:
        logger.warning(f"Leads marketing index: {e}")
    
    # Prompt 8/20: Sales Pipeline, Booking & Deal Engine indexes
    try:
        await db.deals.create_index("id", unique=True)
        await db.deals.create_index("code", unique=True, sparse=True)
        await db.deals.create_index([("project_id", 1), ("stage", 1)])
        await db.deals.create_index([("contact_id", 1), ("created_at", -1)])
        await db.deals.create_index([("assigned_to", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Deals index: {e}")
    
    try:
        await db.deal_stage_history.create_index("id", unique=True)
        await db.deal_stage_history.create_index([("deal_id", 1), ("changed_at", -1)])
    except Exception as e:
        logger.warning(f"Deal stage history index: {e}")
    
    try:
        await db.soft_bookings.create_index("id", unique=True)
        await db.soft_bookings.create_index("code", unique=True, sparse=True)
        await db.soft_bookings.create_index([("project_id", 1), ("queue_number", 1)])
        await db.soft_bookings.create_index([("sales_event_id", 1), ("status", 1)])
        await db.soft_bookings.create_index([("deal_id", 1)])
    except Exception as e:
        logger.warning(f"Soft bookings index: {e}")
    
    try:
        await db.hard_bookings.create_index("id", unique=True)
        await db.hard_bookings.create_index("code", unique=True, sparse=True)
        await db.hard_bookings.create_index([("product_id", 1)])
        await db.hard_bookings.create_index([("deal_id", 1)])
        await db.hard_bookings.create_index([("status", 1)])
    except Exception as e:
        logger.warning(f"Hard bookings index: {e}")
    
    try:
        await db.sales_events.create_index("id", unique=True)
        await db.sales_events.create_index("code", unique=True, sparse=True)
        await db.sales_events.create_index([("project_id", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Sales events index: {e}")
    
    try:
        await db.allocation_results.create_index("id", unique=True)
        await db.allocation_results.create_index([("sales_event_id", 1), ("run_at", -1)])
    except Exception as e:
        logger.warning(f"Allocation results index: {e}")
    
    try:
        await db.pricing_policies.create_index("id", unique=True)
        await db.pricing_policies.create_index("code", unique=True, sparse=True)
        await db.pricing_policies.create_index([("project_id", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Pricing policies index: {e}")
    
    try:
        await db.payment_plans.create_index("id", unique=True)
        await db.payment_plans.create_index("code", unique=True, sparse=True)
        await db.payment_plans.create_index([("project_id", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Payment plans index: {e}")
    
    try:
        await db.promotions.create_index("id", unique=True)
        await db.promotions.create_index("code", unique=True, sparse=True)
        await db.promotions.create_index([("status", 1), ("start_date", 1)])
    except Exception as e:
        logger.warning(f"Promotions index: {e}")
    
    try:
        await db.deposit_payments.create_index("id", unique=True)
        await db.deposit_payments.create_index([("hard_booking_id", 1)])
    except Exception as e:
        logger.warning(f"Deposit payments index: {e}")
    
    try:
        await db.contracts.create_index("id", unique=True)
        await db.contracts.create_index("code", unique=True, sparse=True)
        await db.contracts.create_index([("deal_id", 1)])
    except Exception as e:
        logger.warning(f"Contracts index: {e}")
    
    # Prompt 9/20 - Contract & Document Workflow indexes
    try:
        await db.contracts.create_index("contract_code", unique=True)
        await db.contracts.create_index([("customer_id", 1), ("status", 1)])
        await db.contracts.create_index([("project_id", 1), ("status", 1)])
        await db.contracts.create_index([("status", 1), ("created_at", -1)])
        await db.contracts.create_index([("owner_id", 1), ("status", 1)])
    except Exception as e:
        logger.warning(f"Contracts extended index: {e}")
    
    try:
        await db.amendments.create_index("id", unique=True)
        await db.amendments.create_index("amendment_code", unique=True)
        await db.amendments.create_index([("parent_contract_id", 1)])
    except Exception as e:
        logger.warning(f"Amendments index: {e}")
    
    try:
        await db.documents.create_index("id", unique=True)
        await db.documents.create_index("document_code", unique=True)
        await db.documents.create_index([("entity_type", 1), ("entity_id", 1)])
        await db.documents.create_index([("checksum", 1)])
        await db.documents.create_index([("category", 1), ("is_latest", 1)])
    except Exception as e:
        logger.warning(f"Documents index: {e}")
    
    try:
        await db.contract_payments.create_index("id", unique=True)
        await db.contract_payments.create_index([("contract_id", 1)])
    except Exception as e:
        logger.warning(f"Contract payments index: {e}")
    
    try:
        await db.contract_audit_logs.create_index("id", unique=True)
        await db.contract_audit_logs.create_index([("entity_id", 1), ("timestamp", -1)])
    except Exception as e:
        logger.warning(f"Contract audit logs index: {e}")
    
    try:
        await db.document_audit_logs.create_index("id", unique=True)
        await db.document_audit_logs.create_index([("entity_id", 1)])
    except Exception as e:
        logger.warning(f"Document audit logs index: {e}")
    
    try:
        await db.counters.create_index("_id", unique=True)
    except Exception as e:
        logger.warning(f"Counters index: {e}")
    
    # Prompt 12/20: KPI & Performance Engine indexes
    try:
        await db.kpi_definitions.create_index("id", unique=True)
        await db.kpi_definitions.create_index("code", unique=True)
        await db.kpi_definitions.create_index([("category", 1), ("is_active", 1)])
    except Exception as e:
        logger.warning(f"KPI definitions index: {e}")
    
    try:
        await db.kpi_targets.create_index("id", unique=True)
        await db.kpi_targets.create_index([
            ("kpi_code", 1), ("scope_type", 1), ("scope_id", 1),
            ("period_type", 1), ("period_year", 1), ("period_month", 1)
        ], unique=True)
        await db.kpi_targets.create_index([("user_id", 1), ("period_year", 1)])
        await db.kpi_targets.create_index([("team_id", 1), ("period_year", 1)])
    except Exception as e:
        logger.warning(f"KPI targets index: {e}")
    
    try:
        await db.kpi_bonus_rules.create_index("id", unique=True)
        await db.kpi_bonus_rules.create_index("code", unique=True)
        await db.kpi_bonus_rules.create_index([("is_active", 1), ("effective_from", 1)])
    except Exception as e:
        logger.warning(f"KPI bonus rules index: {e}")
    
    try:
        await db.kpi_events.create_index("id", unique=True)
        await db.kpi_events.create_index([("user_id", 1), ("event_timestamp", -1)])
        await db.kpi_events.create_index([("source_entity_type", 1), ("source_entity_id", 1)])
    except Exception as e:
        logger.warning(f"KPI events index: {e}")
    
    # Prompt 18/20: AI Insight Engine indexes
    try:
        await db.ai_lead_scores.create_index("id", unique=True)
        await db.ai_lead_scores.create_index([("lead_id", 1), ("created_at", -1)])
        await db.ai_deal_risks.create_index("id", unique=True)
        await db.ai_deal_risks.create_index([("deal_id", 1), ("created_at", -1)])
        await db.ai_audit_logs.create_index("id", unique=True)
        await db.ai_audit_logs.create_index([("entity_type", 1), ("entity_id", 1)])
        await db.ai_audit_logs.create_index("generated_at")
        await db.ai_scoring_rules.create_index("rule_type", unique=True)
        await db.ai_risk_rules.create_index("rule_type", unique=True)
        logger.info("AI Insight indexes created")
    except Exception as e:
        logger.warning(f"AI Insight indexes: {e}")
    
    # Prompt 19/20: Automation Engine indexes
    try:
        await db.automation_rules.create_index("rule_id", unique=True)
        await db.automation_rules.create_index([("trigger_event", 1), ("is_enabled", 1)])
        await db.automation_rules.create_index("domain")
        await db.business_events.create_index("event_id", unique=True)
        await db.business_events.create_index([("event_type", 1), ("timestamp", -1)])
        await db.business_events.create_index([("entity_type", 1), ("entity_id", 1)])
        await db.automation_execution_logs.create_index("execution_id", unique=True)
        await db.automation_execution_logs.create_index([("rule_id", 1), ("created_at", -1)])
        await db.automation_execution_logs.create_index([("entity_type", 1), ("entity_id", 1)])
        await db.automation_execution_logs.create_index("status")
        await db.automation_pending_approvals.create_index("execution_id", unique=True)
        await db.automation_pending_approvals.create_index("status")
        await db.automation_rate_limits.create_index("key", unique=True)
        await db.automation_dedupe.create_index("dedupe_key", unique=True)
        await db.notification_throttle.create_index([("user_id", 1), ("sent_at", -1)])
        await db.escalations.create_index("id", unique=True)
        await db.review_queue.create_index("id", unique=True)
        await db.review_queue.create_index([("queue_type", 1), ("status", 1)])
        logger.info("Automation Engine indexes created (Prompt 19/20)")
    except Exception as e:
        logger.warning(f"Automation Engine indexes: {e}")
    
    # Seed system KPIs
    try:
        from services.kpi_service import KPIService
        kpi_service = KPIService(db)
        await kpi_service.seed_system_kpis()
        logger.info("System KPIs seeded successfully")
    except Exception as e:
        logger.warning(f"KPI seeding: {e}")
    
    # Phase 2 Integration: Initialize Event System
    try:
        await initialize_event_system(db)
        logger.info("Phase 2 Event System initialized")
    except Exception as e:
        logger.warning(f"Event System initialization: {e}")
    
    # Phase 2: Create automation_events index
    try:
        await db.automation_events.create_index("event_id", unique=True)
        await db.automation_events.create_index([("event_type", 1), ("timestamp", -1)])
        await db.automation_events.create_index("idempotency_key")
        await db.automation_events.create_index([("entity_type", 1), ("entity_id", 1)])
        logger.info("Phase 2 automation_events indexes created")
    except Exception as e:
        logger.warning(f"Phase 2 indexes: {e}")
    
    # Finance System indexes (Payment, Commission, Tax, Payout)
    try:
        # Payment Tracking
        await db.payment_trackings.create_index("id", unique=True)
        await db.payment_trackings.create_index([("contract_id", 1), ("installment_number", 1)])
        await db.payment_trackings.create_index([("status", 1), ("due_date", 1)])
        
        # Project Commission Rates
        await db.project_commissions.create_index("id", unique=True)
        await db.project_commissions.create_index([("project_id", 1), ("is_active", 1)])
        
        # Finance Commissions
        await db.finance_commissions.create_index("id", unique=True)
        await db.finance_commissions.create_index("code", unique=True, sparse=True)
        await db.finance_commissions.create_index([("contract_id", 1)])
        await db.finance_commissions.create_index([("status", 1), ("created_at", -1)])
        
        # Commission Splits
        await db.commission_splits.create_index("id", unique=True)
        await db.commission_splits.create_index("code", unique=True, sparse=True)
        await db.commission_splits.create_index([("commission_id", 1)])
        await db.commission_splits.create_index([("recipient_id", 1), ("status", 1)])
        
        # Receivables
        await db.receivables.create_index("id", unique=True)
        await db.receivables.create_index("code", unique=True, sparse=True)
        await db.receivables.create_index([("commission_id", 1)])
        await db.receivables.create_index([("developer_id", 1), ("status", 1)])
        
        # Receivable Payments
        await db.receivable_payments.create_index("id", unique=True)
        await db.receivable_payments.create_index([("receivable_id", 1)])
        
        # Finance Invoices
        await db.finance_invoices.create_index("id", unique=True)
        await db.finance_invoices.create_index("invoice_no", unique=True, sparse=True)
        await db.finance_invoices.create_index([("commission_id", 1)])
        
        # Tax Records
        await db.tax_records.create_index("id", unique=True)
        await db.tax_records.create_index([("tax_type", 1), ("period_year", 1), ("period_month", 1)])
        
        # Payouts
        await db.payouts.create_index("id", unique=True)
        await db.payouts.create_index("code", unique=True, sparse=True)
        await db.payouts.create_index([("commission_split_id", 1)])
        await db.payouts.create_index([("recipient_id", 1), ("status", 1)])
        
        # Developers (for receivables)
        await db.developers.create_index("id", unique=True)
        
        logger.info("Finance System indexes created")
    except Exception as e:
        logger.warning(f"Finance System indexes: {e}")
    
    # HR Profile 360° indexes
    try:
        # HR Profiles
        await db.hr_profiles.create_index("id", unique=True)
        await db.hr_profiles.create_index("user_id", unique=True)
        await db.hr_profiles.create_index("employee_code", unique=True, sparse=True)
        await db.hr_profiles.create_index([("is_active", 1), ("employment_status", 1)])
        await db.hr_profiles.create_index([("full_name_unsigned", "text")])
        
        # HR Family Members
        await db.hr_family_members.create_index("id", unique=True)
        await db.hr_family_members.create_index("hr_profile_id")
        
        # HR Education
        await db.hr_education.create_index("id", unique=True)
        await db.hr_education.create_index("hr_profile_id")
        
        # HR Work History
        await db.hr_work_history.create_index("id", unique=True)
        await db.hr_work_history.create_index("hr_profile_id")
        
        # HR Certificates
        await db.hr_certificates.create_index("id", unique=True)
        await db.hr_certificates.create_index("hr_profile_id")
        
        # HR Documents (with version control)
        await db.hr_documents.create_index("id", unique=True)
        await db.hr_documents.create_index([("hr_profile_id", 1), ("category", 1), ("is_latest", 1)])
        
        # HR Internal History
        await db.hr_internal_history.create_index("id", unique=True)
        await db.hr_internal_history.create_index([("hr_profile_id", 1), ("is_current", 1)])
        
        # HR Contracts
        await db.hr_contracts.create_index("id", unique=True)
        await db.hr_contracts.create_index("contract_number", unique=True, sparse=True)
        await db.hr_contracts.create_index([("hr_profile_id", 1), ("status", 1)])
        
        # HR Rewards/Discipline
        await db.hr_rewards_discipline.create_index("id", unique=True)
        await db.hr_rewards_discipline.create_index("hr_profile_id")
        
        # HR KPI Records
        await db.hr_kpi_records.create_index("id", unique=True)
        await db.hr_kpi_records.create_index([("hr_profile_id", 1), ("period_year", 1), ("period_month", 1)])
        
        # HR Onboarding Checklist
        await db.hr_onboarding_checklist.create_index("id", unique=True)
        await db.hr_onboarding_checklist.create_index([("hr_profile_id", 1), ("item_code", 1)])
        
        # HR Alerts
        await db.hr_alerts.create_index("id", unique=True)
        await db.hr_alerts.create_index([("hr_profile_id", 1), ("is_resolved", 1)])
        await db.hr_alerts.create_index([("alert_type", 1), ("severity", 1)])
        
        logger.info("HR Profile 360° indexes created")
    except Exception as e:
        logger.warning(f"HR Profile 360° indexes: {e}")
    
    # Payroll & Workforce Management indexes
    try:
        # Work Shifts
        await db.work_shifts.create_index("id", unique=True)
        await db.work_shifts.create_index("code", unique=True, sparse=True)
        
        # Shift Assignments
        await db.shift_assignments.create_index("id", unique=True)
        await db.shift_assignments.create_index([("hr_profile_id", 1), ("is_current", 1)])
        
        # Attendance Records
        await db.attendance_records.create_index("id", unique=True)
        await db.attendance_records.create_index([("hr_profile_id", 1), ("date", 1)], unique=True)
        await db.attendance_records.create_index([("date", 1), ("status", 1)])
        
        # Attendance Summaries
        await db.attendance_summaries.create_index("id", unique=True)
        await db.attendance_summaries.create_index([("hr_profile_id", 1), ("period", 1)], unique=True)
        
        # Leave Requests
        await db.leave_requests.create_index("id", unique=True)
        await db.leave_requests.create_index([("hr_profile_id", 1), ("status", 1)])
        await db.leave_requests.create_index([("status", 1), ("created_at", -1)])
        
        # Leave Balances
        await db.leave_balances.create_index("id", unique=True)
        await db.leave_balances.create_index([("hr_profile_id", 1), ("year", 1), ("leave_type", 1)], unique=True)
        
        # Leave Policies
        await db.leave_policies.create_index("id", unique=True)
        await db.leave_policies.create_index([("employment_status", 1), ("leave_type", 1)])
        
        # Salary Structures
        await db.salary_structures.create_index("id", unique=True)
        await db.salary_structures.create_index([("hr_profile_id", 1), ("is_current", 1)])
        
        # Payroll
        await db.payroll.create_index("id", unique=True)
        await db.payroll.create_index([("hr_profile_id", 1), ("period", 1)], unique=True)
        await db.payroll.create_index([("period", 1), ("status", 1)])
        
        # Payroll Audit Logs
        await db.payroll_audit_logs.create_index("id", unique=True)
        await db.payroll_audit_logs.create_index([("payroll_id", 1), ("timestamp", -1)])
        await db.payroll_audit_logs.create_index([("action", 1), ("timestamp", -1)])
        
        # Salary View Logs (sensitive access tracking)
        await db.salary_view_logs.create_index("id", unique=True)
        await db.salary_view_logs.create_index([("viewer_id", 1), ("timestamp", -1)])
        await db.salary_view_logs.create_index([("target_hr_profile_id", 1), ("timestamp", -1)])
        await db.salary_view_logs.create_index([("view_type", 1), ("is_authorized", 1)])
        
        # Salary Advances
        await db.salary_advances.create_index("id", unique=True)
        await db.salary_advances.create_index([("hr_profile_id", 1), ("status", 1)])
        
        # Security Alerts
        await db.security_alerts.create_index("id", unique=True)
        await db.security_alerts.create_index([("alert_type", 1), ("is_resolved", 1)])
        
        logger.info("Payroll & Workforce indexes created")
    except Exception as e:
        logger.warning(f"Payroll & Workforce indexes: {e}")
    
    # Phase 4: AI Email Automation System indexes
    try:
        # Email Templates
        await db.email_templates.create_index("id", unique=True)
        await db.email_templates.create_index([("type", 1), ("is_active", 1)])
        
        # Email Drafts
        await db.email_drafts.create_index("id", unique=True)
        await db.email_drafts.create_index([("status", 1), ("created_at", -1)])
        await db.email_drafts.create_index([("template_id", 1)])
        
        # Email Jobs (Queue)
        await db.email_jobs.create_index("id", unique=True)
        await db.email_jobs.create_index("idempotency_key", unique=True, sparse=True)
        await db.email_jobs.create_index([("status", 1), ("priority", 1)])
        await db.email_jobs.create_index([("status", 1), ("next_retry_at", 1)])
        await db.email_jobs.create_index([("scheduled_at", 1)])
        
        # Email Logs
        await db.email_logs.create_index("id", unique=True)
        await db.email_logs.create_index("tracking_id", unique=True)
        await db.email_logs.create_index([("email", 1), ("sent_at", -1)])
        await db.email_logs.create_index([("campaign_id", 1), ("status", 1)])
        
        # Email Events
        await db.email_events.create_index("id", unique=True)
        await db.email_events.create_index("idempotency_key", unique=True)
        await db.email_events.create_index([("status", 1), ("triggered_at", 1)])
        await db.email_events.create_index([("type", 1), ("status", 1)])
        
        # Email Subscribers
        await db.email_subscribers.create_index("email", unique=True)
        await db.email_subscribers.create_index("unsubscribe_token", unique=True)
        await db.email_subscribers.create_index([("is_subscribed", 1)])
        
        # Email Campaigns
        await db.email_campaigns.create_index("id", unique=True)
        await db.email_campaigns.create_index([("status", 1), ("scheduled_at", 1)])
        
        # Email Tracking Events
        await db.email_tracking_events.create_index([("tracking_id", 1), ("timestamp", -1)])
        await db.email_tracking_events.create_index([("event_type", 1), ("timestamp", -1)])
        
        # Email Approval Logs
        await db.email_approval_logs.create_index([("draft_id", 1), ("timestamp", -1)])
        
        logger.info("Email Automation System indexes created")
    except Exception as e:
        logger.warning(f"Email Automation indexes: {e}")
    
    # P83: Sales Control System indexes
    try:
        # Bookings indexes for SLA engine
        await db.bookings.create_index([("status", 1), ("call_status", 1), ("created_at", 1)])
        await db.bookings.create_index([("assigned_to", 1), ("status", 1)])
        await db.bookings.create_index([("created_at", 1)])
        
        # SLA Alerts
        await db.sla_alerts.create_index([("booking_id", 1), ("resolved", 1)])
        await db.sla_alerts.create_index([("alert_type", 1), ("created_at", -1)])
        await db.sla_alerts.create_index([("sales_id", 1), ("created_at", -1)])
        
        # SLA Logs
        await db.sla_logs.create_index([("timestamp", -1)])
        await db.sla_logs.create_index([("action", 1), ("timestamp", -1)])
        
        # Sales Users (for SLA assignment)
        await db.sales_users.create_index([("active", 1), ("current_load", 1)])
        await db.sales_users.create_index([("region", 1), ("active", 1)])
        
        logger.info("Sales Control System indexes created")
    except Exception as e:
        logger.warning(f"Sales Control System indexes: {e}")
    
    # P84: SEO Engine indexes
    try:
        # SEO Pages
        await db.seo_pages.create_index("slug", unique=True)
        await db.seo_pages.create_index("keyword")
        await db.seo_pages.create_index("content_hash")
        await db.seo_pages.create_index([("status", 1), ("content_type", 1)])
        await db.seo_pages.create_index([("created_at", -1)])
        await db.seo_pages.create_index([("seo_score", -1)])
        
        # SEO Keywords
        await db.seo_keywords.create_index("hash", unique=True)
        await db.seo_keywords.create_index("keyword")
        await db.seo_keywords.create_index([("status", 1), ("location", 1)])
        await db.seo_keywords.create_index([("created_at", -1)])
        
        logger.info("SEO Engine indexes created")
    except Exception as e:
        logger.warning(f"SEO Engine indexes: {e}")
    except Exception as e:
        logger.warning(f"⚠️  MongoDB index creation error (non-critical): {e}")

    # Start SLA Engine background task
    try:
        from sla_engine import start_sla_engine
        start_sla_engine()
        logger.info("SLA Engine background task started")
    except ImportError:
        logger.warning("SLA Engine not available - background task not started")
    except Exception as e:
        logger.error(f"Error starting SLA Engine: {e}")

    logger.info("ProHouzing CRM v3.0 started - Omnichannel Marketing Automation")

@app.on_event("shutdown")
async def shutdown():
    try:
        client.close()
    except Exception:
        pass
