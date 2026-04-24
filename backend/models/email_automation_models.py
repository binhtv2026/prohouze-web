"""
AI Email Automation System - Models
Enterprise-grade email automation with event-driven architecture
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class EmailTemplateType(str, Enum):
    SYSTEM = "system"          # OTP, password reset, etc.
    OPERATION = "operation"    # Onboarding, contract, etc.
    MARKETING = "marketing"    # Campaigns, promotions

class EmailDraftStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCHEDULED = "scheduled"
    SENT = "sent"

class EmailJobStatus(str, Enum):
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"

class EmailEventType(str, Enum):
    USER_SIGNUP = "user_signup"
    USER_BIRTHDAY = "user_birthday"
    EMPLOYEE_BIRTHDAY = "employee_birthday"
    NEW_PRODUCT = "new_product"
    CAMPAIGN_TRIGGER = "campaign_trigger"
    CONTRACT_SIGNED = "contract_signed"
    ONBOARDING_COMPLETE = "onboarding_complete"
    KPI_ALERT = "kpi_alert"
    PAYMENT_REMINDER = "payment_reminder"
    CUSTOM = "custom"


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL TEMPLATE
# ═══════════════════════════════════════════════════════════════════════════════

class EmailTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # Template Info
    name: str
    description: Optional[str] = None
    type: EmailTemplateType = EmailTemplateType.OPERATION
    
    # Content
    subject_template: str  # "Chào {{name}}, {{subject}}"
    body_template: str     # HTML with {{variables}}
    variables: List[str] = []  # ["name", "subject", "link"]
    
    # Settings
    is_active: bool = True
    version: int = 1
    language: str = "vi"
    
    # AI Settings
    enable_ai_personalization: bool = True
    ai_tone: str = "professional"  # professional, friendly, formal
    
    # Approval Settings
    requires_approval: bool = False  # True for marketing
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_by: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL DRAFT
# ═══════════════════════════════════════════════════════════════════════════════

class EmailDraft(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # References
    template_id: Optional[str] = None
    event_id: Optional[str] = None
    campaign_id: Optional[str] = None
    
    # Recipients
    recipient_type: str = "single"  # single, list, segment
    recipient_email: Optional[str] = None
    recipient_list: List[str] = []
    recipient_segment: Optional[str] = None  # e.g., "active_users"
    
    # Content
    subject: str
    content: str  # Rendered HTML
    preview_text: Optional[str] = None
    
    # AI Generated
    ai_generated: bool = False
    ai_prompt_used: Optional[str] = None
    
    # Status & Workflow
    status: EmailDraftStatus = EmailDraftStatus.DRAFT
    scheduled_at: Optional[str] = None
    
    # Approval
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejected_by: Optional[str] = None
    rejected_reason: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_by: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL JOB (QUEUE)
# ═══════════════════════════════════════════════════════════════════════════════

class EmailJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # References
    draft_id: str
    template_id: Optional[str] = None
    event_id: Optional[str] = None
    
    # Recipient
    user_id: Optional[str] = None
    email: str
    recipient_name: Optional[str] = None
    
    # Content (snapshot at queue time)
    subject: str
    content: str
    
    # Job Status
    status: EmailJobStatus = EmailJobStatus.QUEUED
    priority: int = 5  # 1=highest, 10=lowest
    
    # Retry Logic
    retry_count: int = 0
    max_retries: int = 3
    last_error: Optional[str] = None
    next_retry_at: Optional[str] = None
    
    # Idempotency
    idempotency_key: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Scheduling
    scheduled_at: Optional[str] = None  # None = immediate
    
    # Processing
    queued_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    processed_at: Optional[str] = None
    
    # Provider Response
    provider_id: Optional[str] = None  # Resend email ID
    provider_response: Optional[Dict] = None


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL LOG
# ═══════════════════════════════════════════════════════════════════════════════

class EmailLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # References
    job_id: str
    draft_id: Optional[str] = None
    template_id: Optional[str] = None
    event_id: Optional[str] = None
    campaign_id: Optional[str] = None
    
    # Recipient
    user_id: Optional[str] = None
    email: str
    recipient_name: Optional[str] = None
    
    # Content
    subject: str
    template_type: Optional[str] = None
    
    # Status
    status: str = "sent"  # sent, failed, bounced
    provider_id: Optional[str] = None
    error_message: Optional[str] = None
    
    # Tracking
    tracking_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    opened_at: Optional[str] = None
    open_count: int = 0
    clicked_at: Optional[str] = None
    click_count: int = 0
    clicked_links: List[str] = []
    
    # Unsubscribe
    unsubscribed: bool = False
    unsubscribed_at: Optional[str] = None
    
    # Timestamps
    sent_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL EVENT
# ═══════════════════════════════════════════════════════════════════════════════

class EmailEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # Event Info
    type: EmailEventType
    source: str = "system"  # system, api, cron, manual
    
    # Payload
    payload: Dict[str, Any] = {}  # user_id, email, name, etc.
    
    # Idempotency
    idempotency_key: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Processing
    status: str = "pending"  # pending, processing, processed, failed
    processed_at: Optional[str] = None
    error_message: Optional[str] = None
    
    # Result
    draft_id: Optional[str] = None
    job_ids: List[str] = []
    
    # Timestamps
    triggered_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL SUBSCRIBER (Anti-Spam)
# ═══════════════════════════════════════════════════════════════════════════════

class EmailSubscriber(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # Subscriber Info
    email: str
    user_id: Optional[str] = None
    name: Optional[str] = None
    
    # Subscription Status
    is_subscribed: bool = True
    subscription_types: List[str] = ["system", "operation", "marketing"]
    
    # Unsubscribe
    unsubscribed_at: Optional[str] = None
    unsubscribe_reason: Optional[str] = None
    unsubscribe_token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Consent
    consent_given: bool = True
    consent_at: Optional[str] = None
    consent_source: str = "signup"  # signup, api, import
    
    # Stats
    total_emails_sent: int = 0
    total_emails_opened: int = 0
    last_email_at: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL CAMPAIGN
# ═══════════════════════════════════════════════════════════════════════════════

class EmailCampaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "default"
    
    # Campaign Info
    name: str
    description: Optional[str] = None
    type: str = "one_time"  # one_time, recurring, drip
    
    # Template
    template_id: Optional[str] = None
    
    # Audience
    segment: Optional[str] = None  # all, active_users, new_users, etc.
    recipient_count: int = 0
    
    # Schedule
    scheduled_at: Optional[str] = None
    recurring_schedule: Optional[str] = None  # cron expression
    
    # Status
    status: str = "draft"  # draft, scheduled, sending, sent, paused, cancelled
    
    # Stats
    total_sent: int = 0
    total_delivered: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_unsubscribed: int = 0
    total_failed: int = 0
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_by: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CreateEmailTemplateRequest(BaseModel):
    name: str
    type: str = "operation"
    subject_template: str
    body_template: str
    variables: List[str] = []
    enable_ai_personalization: bool = True
    requires_approval: bool = False


class GenerateEmailDraftRequest(BaseModel):
    template_id: Optional[str] = None
    event_type: Optional[str] = None
    recipient_email: str
    recipient_name: Optional[str] = None
    user_id: Optional[str] = None
    variables: Dict[str, Any] = {}
    use_ai: bool = True


class TriggerEmailEventRequest(BaseModel):
    type: str
    payload: Dict[str, Any]
    idempotency_key: Optional[str] = None


class SendEmailRequest(BaseModel):
    draft_id: Optional[str] = None
    to_email: str
    subject: str
    content: str
    scheduled_at: Optional[str] = None
    idempotency_key: Optional[str] = None


class CreateCampaignRequest(BaseModel):
    name: str
    template_id: str
    segment: str = "all"
    scheduled_at: Optional[str] = None
    variables: Dict[str, Any] = {}
