"""
AI Email Automation System - Router
Enterprise-grade email automation with event-driven architecture
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, Response, Query
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

from models.email_automation_models import (
    EmailTemplate, EmailTemplateType, EmailDraft, EmailDraftStatus,
    EmailJob, EmailJobStatus, EmailEvent, EmailEventType, EmailCampaign,
    EmailSubscriber,
    CreateEmailTemplateRequest, GenerateEmailDraftRequest, 
    TriggerEmailEventRequest, SendEmailRequest, CreateCampaignRequest
)
from services.email_automation import (
    EmailEventEngine, EmailContentEngine, EmailDeliveryEngine,
    EmailTrackingEngine, EmailApprovalEngine
)

logger = logging.getLogger(__name__)

# Router
email_router = APIRouter(prefix="/email", tags=["Email Automation"])

# Database connection (singleton)
_client = None
_db = None

def get_db():
    """Get database connection"""
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        _db = _client[os.environ['DB_NAME']]
    return _db


# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.post("/templates", response_model=Dict[str, Any])
async def create_template(data: CreateEmailTemplateRequest):
    """Create a new email template"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    template = EmailTemplate(
        name=data.name,
        type=EmailTemplateType(data.type),
        subject_template=data.subject_template,
        body_template=data.body_template,
        variables=data.variables,
        enable_ai_personalization=data.enable_ai_personalization,
        requires_approval=data.requires_approval,
        created_at=now,
        updated_at=now
    )
    
    await db.email_templates.insert_one(template.dict())
    
    return {
        "success": True,
        "template_id": template.id,
        "name": template.name
    }


@email_router.get("/templates", response_model=List[Dict[str, Any]])
async def list_templates(
    type: Optional[str] = None,
    is_active: bool = True,
    limit: int = Query(50, le=100)
):
    """List email templates"""
    db = get_db()
    query = {"is_active": is_active}
    if type:
        query["type"] = type
    
    templates = await db.email_templates.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return templates


@email_router.get("/templates/{template_id}", response_model=Dict[str, Any])
async def get_template(template_id: str):
    """Get template by ID"""
    db = get_db()
    template = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@email_router.put("/templates/{template_id}")
async def update_template(template_id: str, updates: Dict[str, Any]):
    """Update template"""
    db = get_db()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates.pop("id", None)
    updates.pop("_id", None)
    
    result = await db.email_templates.update_one({"id": template_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"success": True, "template_id": template_id}


@email_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Soft delete template"""
    db = get_db()
    result = await db.email_templates.update_one(
        {"id": template_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"success": True, "message": "Template deactivated"}


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.post("/event", response_model=Dict[str, Any])
async def trigger_event(data: TriggerEmailEventRequest, background_tasks: BackgroundTasks):
    """Trigger an email event - main entry point for event-driven email system"""
    db = get_db()
    event_engine = EmailEventEngine(db)
    
    result = await event_engine.ingest_event(
        event_type=data.type,
        payload=data.payload,
        idempotency_key=data.idempotency_key,
        source="api"
    )
    
    if result.get("success") and not result.get("duplicate"):
        background_tasks.add_task(process_event_background, result.get("event_id"))
    
    return result


async def process_event_background(event_id: str):
    """Background task to process event and generate email"""
    db = get_db()
    event_engine = EmailEventEngine(db)
    content_engine = EmailContentEngine(db)
    delivery_engine = EmailDeliveryEngine(db)
    tracking_engine = EmailTrackingEngine(db)
    approval_engine = EmailApprovalEngine(db)
    
    try:
        event_result = await event_engine.process_event(event_id)
        if not event_result.get("success"):
            logger.error(f"Event processing failed: {event_result}")
            return
        
        payload = event_result.get("payload", {})
        
        content_result = await content_engine.generate_content(
            template_id=event_result.get("template_id"),
            event_type=event_result.get("template_type"),
            recipient_email=payload.get("email"),
            recipient_name=payload.get("name"),
            user_id=payload.get("user_id"),
            variables=payload
        )
        
        if not content_result.get("success"):
            logger.error(f"Content generation failed: {content_result}")
            return
        
        draft_id = content_result.get("draft_id")
        approval_result = await approval_engine.submit_for_approval(draft_id, "system")
        
        if approval_result.get("status") == EmailDraftStatus.APPROVED.value:
            subscriber = await db.email_subscribers.find_one({"email": payload.get("email")}, {"_id": 0})
            
            if not subscriber:
                subscriber = EmailSubscriber(
                    email=payload.get("email"),
                    user_id=payload.get("user_id"),
                    name=payload.get("name")
                )
                await db.email_subscribers.insert_one(subscriber.dict())
                subscriber = subscriber.dict()
            
            if not subscriber.get("is_subscribed", True):
                logger.info(f"Skipping unsubscribed user: {payload.get('email')}")
                return
            
            draft = await db.email_drafts.find_one({"id": draft_id}, {"_id": 0})
            tracking_id = str(uuid.uuid4())
            
            tracked_content = tracking_engine.inject_tracking(
                html_content=draft.get("content"),
                tracking_id=tracking_id,
                email=payload.get("email"),
                unsubscribe_token=subscriber.get("unsubscribe_token", "")
            )
            
            await delivery_engine.enqueue_job(
                draft_id=draft_id,
                email=payload.get("email"),
                subject=draft.get("subject"),
                content=tracked_content,
                recipient_name=payload.get("name"),
                user_id=payload.get("user_id"),
                priority=5
            )
            
            await db.email_events.update_one({"id": event_id}, {"$set": {"draft_id": draft_id}})
            logger.info(f"Event {event_id} processed, job enqueued")
        
    except Exception as e:
        logger.error(f"Background event processing error: {e}")


@email_router.get("/events", response_model=List[Dict[str, Any]])
async def list_events(
    status: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    """List email events"""
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    
    events = await db.email_events.find(query, {"_id": 0}).sort("triggered_at", -1).limit(limit).to_list(limit)
    return events


@email_router.get("/events/stats", response_model=Dict[str, Any])
async def get_event_stats():
    """Get event statistics"""
    db = get_db()
    event_engine = EmailEventEngine(db)
    return await event_engine.get_event_stats()


# ═══════════════════════════════════════════════════════════════════════════════
# DRAFT/CONTENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.post("/draft/generate", response_model=Dict[str, Any])
async def generate_draft(data: GenerateEmailDraftRequest):
    """Generate email draft from template with AI enhancement"""
    db = get_db()
    content_engine = EmailContentEngine(db)
    
    result = await content_engine.generate_content(
        template_id=data.template_id,
        event_type=data.event_type,
        recipient_email=data.recipient_email,
        recipient_name=data.recipient_name,
        user_id=data.user_id,
        variables=data.variables,
        use_ai=data.use_ai
    )
    return result


@email_router.get("/drafts", response_model=List[Dict[str, Any]])
async def list_drafts(status: Optional[str] = None, limit: int = Query(50, le=100)):
    """List email drafts"""
    db = get_db()
    content_engine = EmailContentEngine(db)
    return await content_engine.list_drafts(status=status, limit=limit)


@email_router.get("/drafts/{draft_id}", response_model=Dict[str, Any])
async def get_draft(draft_id: str):
    """Get draft by ID"""
    db = get_db()
    content_engine = EmailContentEngine(db)
    draft = await content_engine.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@email_router.put("/drafts/{draft_id}")
async def update_draft(draft_id: str, updates: Dict[str, Any]):
    """Update draft content"""
    db = get_db()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates.pop("id", None)
    updates.pop("_id", None)
    
    result = await db.email_drafts.update_one({"id": draft_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"success": True, "draft_id": draft_id}


@email_router.post("/drafts/{draft_id}/regenerate", response_model=Dict[str, Any])
async def regenerate_draft(draft_id: str, prompt: Optional[str] = None):
    """Regenerate draft with AI using custom prompt"""
    db = get_db()
    content_engine = EmailContentEngine(db)
    return await content_engine.regenerate_with_ai(draft_id, prompt)


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL WORKFLOW
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.post("/drafts/{draft_id}/submit")
async def submit_for_approval(draft_id: str):
    """Submit draft for approval"""
    db = get_db()
    approval_engine = EmailApprovalEngine(db)
    return await approval_engine.submit_for_approval(draft_id, "system")


@email_router.post("/drafts/{draft_id}/approve")
async def approve_draft(draft_id: str, comment: Optional[str] = None):
    """Approve a pending draft"""
    db = get_db()
    approval_engine = EmailApprovalEngine(db)
    return await approval_engine.approve(draft_id, "admin", comment)


@email_router.post("/drafts/{draft_id}/reject")
async def reject_draft(draft_id: str, reason: str):
    """Reject a pending draft"""
    db = get_db()
    approval_engine = EmailApprovalEngine(db)
    return await approval_engine.reject(draft_id, "admin", reason)


@email_router.get("/pending-approvals", response_model=List[Dict[str, Any]])
async def get_pending_approvals(limit: int = Query(50, le=100)):
    """Get all pending drafts"""
    db = get_db()
    approval_engine = EmailApprovalEngine(db)
    return await approval_engine.get_pending_approvals(limit)


# ═══════════════════════════════════════════════════════════════════════════════
# SEND/DELIVERY
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.post("/send", response_model=Dict[str, Any])
async def send_email(data: SendEmailRequest, background_tasks: BackgroundTasks):
    """Send an email (direct or from draft)"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    tracking_engine = EmailTrackingEngine(db)
    
    subscriber = await db.email_subscribers.find_one({"email": data.to_email}, {"_id": 0})
    if not subscriber:
        subscriber = EmailSubscriber(email=data.to_email)
        await db.email_subscribers.insert_one(subscriber.dict())
        subscriber = subscriber.dict()
    
    if not subscriber.get("is_subscribed", True):
        return {"success": False, "error": "Recipient has unsubscribed"}
    
    tracking_id = str(uuid.uuid4())
    tracked_content = tracking_engine.inject_tracking(
        html_content=data.content,
        tracking_id=tracking_id,
        email=data.to_email,
        unsubscribe_token=subscriber.get("unsubscribe_token", "")
    )
    
    draft_id = data.draft_id
    if not draft_id:
        draft = EmailDraft(
            recipient_email=data.to_email,
            subject=data.subject,
            content=data.content,
            status=EmailDraftStatus.APPROVED
        )
        await db.email_drafts.insert_one(draft.dict())
        draft_id = draft.id
    
    result = await delivery_engine.enqueue_job(
        draft_id=draft_id,
        email=data.to_email,
        subject=data.subject,
        content=tracked_content,
        scheduled_at=data.scheduled_at,
        idempotency_key=data.idempotency_key
    )
    
    if result.get("success") and not result.get("duplicate"):
        background_tasks.add_task(process_queue_background)
    
    return result


async def process_queue_background():
    """Background task to process email queue"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    await delivery_engine.process_queue(limit=10)


@email_router.get("/jobs", response_model=List[Dict[str, Any]])
async def list_jobs(status: Optional[str] = None, limit: int = Query(50, le=100)):
    """List email jobs"""
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    jobs = await db.email_jobs.find(query, {"_id": 0}).sort("queued_at", -1).limit(limit).to_list(limit)
    return jobs


@email_router.get("/jobs/stuck", response_model=List[Dict[str, Any]])
async def get_stuck_jobs(threshold_minutes: int = Query(5, ge=1, le=60)):
    """Get jobs that are stuck (processing > threshold)"""
    db = get_db()
    
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=threshold_minutes)).isoformat()
    
    stuck_jobs = await db.email_jobs.find(
        {
            "status": {"$in": ["queued", "sending", "retrying"]},
            "$or": [
                {"started_at": {"$lt": cutoff}},
                {"queued_at": {"$lt": cutoff}, "started_at": {"$exists": False}}
            ]
        },
        {"_id": 0}
    ).sort("queued_at", 1).limit(100).to_list(100)
    
    # Add stuck duration
    now = datetime.now(timezone.utc)
    for job in stuck_jobs:
        try:
            started = job.get("started_at") or job.get("queued_at")
            if started:
                started_dt = datetime.fromisoformat(started.replace('Z', '+00:00'))
                job["stuck_duration_seconds"] = (now - started_dt).total_seconds()
        except:
            job["stuck_duration_seconds"] = None
    
    return stuck_jobs


@email_router.get("/jobs/{job_id}", response_model=Dict[str, Any])
async def get_job(job_id: str):
    """Get job status"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    job = await delivery_engine.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@email_router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a queued job"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    return await delivery_engine.cancel_job(job_id)


@email_router.get("/queue/stats", response_model=Dict[str, Any])
async def get_queue_stats():
    """Get queue statistics"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    return await delivery_engine.get_queue_stats()


@email_router.post("/queue/process")
async def process_queue(limit: int = Query(10, le=50), background_tasks: BackgroundTasks = None):
    """Manually trigger queue processing"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    
    if background_tasks:
        background_tasks.add_task(delivery_engine.process_queue, limit)
        return {"success": True, "message": "Queue processing started in background"}
    
    return await delivery_engine.process_queue(limit)


# ═══════════════════════════════════════════════════════════════════════════════
# TRACKING (PUBLIC ENDPOINTS)
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.get("/track/open/{tracking_id}")
async def track_open(tracking_id: str, request: Request):
    """Track email open (returns 1x1 transparent pixel)"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    
    await tracking_engine.track_open(
        tracking_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    # Return 1x1 transparent GIF
    pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    return Response(content=pixel, media_type="image/gif")


@email_router.get("/track/click/{tracking_id}")
async def track_click(tracking_id: str, url: str, request: Request):
    """Track email click and redirect"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    
    result = await tracking_engine.track_click(
        tracking_id,
        clicked_url=url,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    redirect_url = result.get("redirect_url", url)
    return RedirectResponse(url=redirect_url, status_code=302)


@email_router.get("/unsubscribe")
async def unsubscribe_page(email: str, token: str):
    """Show unsubscribe confirmation page"""
    frontend_url = os.environ.get("FRONTEND_URL", "https://app.prohouzing.com")
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Hủy đăng ký - ProHouzing</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }}
        .container {{ background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; text-align: center; }}
        h1 {{ color: #2563eb; margin-bottom: 20px; }}
        p {{ color: #6b7280; margin-bottom: 20px; }}
        .email {{ font-weight: bold; color: #1f2937; }}
        button {{ background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-bottom: 12px; }}
        button:hover {{ background: #dc2626; }}
        .cancel {{ background: #e5e7eb; color: #374151; }}
        .cancel:hover {{ background: #d1d5db; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Hủy đăng ký email</h1>
        <p>Bạn có chắc muốn hủy nhận email từ ProHouzing?</p>
        <p class="email">{email}</p>
        <form action="/api/email/unsubscribe/confirm" method="POST">
            <input type="hidden" name="email" value="{email}">
            <input type="hidden" name="token" value="{token}">
            <button type="submit">Xác nhận hủy đăng ký</button>
        </form>
        <a href="{frontend_url}"><button class="cancel">Quay lại</button></a>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html)


@email_router.post("/unsubscribe/confirm")
async def confirm_unsubscribe(email: str, token: str, reason: Optional[str] = None):
    """Confirm unsubscribe"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    result = await tracking_engine.unsubscribe(email, token, reason)
    
    if result.get("success"):
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Đã hủy đăng ký - ProHouzing</title>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; text-align: center; }
        h1 { color: #10b981; }
        p { color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Đã hủy thành công</h1>
        <p>Bạn sẽ không nhận được email marketing từ ProHouzing nữa.</p>
        <p>Bạn vẫn có thể nhận email quan trọng về tài khoản.</p>
    </div>
</body>
</html>
"""
        return HTMLResponse(content=html)
    
    raise HTTPException(status_code=400, detail=result.get("error", "Unsubscribe failed"))


# ═══════════════════════════════════════════════════════════════════════════════
# LOGS & ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.get("/logs", response_model=List[Dict[str, Any]])
async def list_logs(
    status: Optional[str] = None,
    email: Optional[str] = None,
    limit: int = Query(50, le=100)
):
    """List email logs"""
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if email:
        query["email"] = email
    
    logs = await db.email_logs.find(query, {"_id": 0}).sort("sent_at", -1).limit(limit).to_list(limit)
    return logs


@email_router.get("/logs/{log_id}/analytics", response_model=Dict[str, Any])
async def get_email_analytics(log_id: str):
    """Get analytics for a specific email"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    return await tracking_engine.get_email_analytics(log_id)


@email_router.get("/analytics/overall", response_model=Dict[str, Any])
async def get_overall_analytics(days: int = Query(30, le=90)):
    """Get overall email analytics"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    return await tracking_engine.get_overall_analytics(days)


# ═══════════════════════════════════════════════════════════════════════════════
# SUBSCRIBERS
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.get("/subscribers", response_model=List[Dict[str, Any]])
async def list_subscribers(is_subscribed: Optional[bool] = None, limit: int = Query(50, le=100)):
    """List email subscribers"""
    db = get_db()
    query = {}
    if is_subscribed is not None:
        query["is_subscribed"] = is_subscribed
    
    subscribers = await db.email_subscribers.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return subscribers


@email_router.get("/subscribers/{email}", response_model=Dict[str, Any])
async def get_subscriber(email: str):
    """Get subscriber by email"""
    db = get_db()
    subscriber = await db.email_subscribers.find_one({"email": email}, {"_id": 0})
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return subscriber


@email_router.post("/subscribers/{email}/resubscribe")
async def resubscribe(email: str, subscription_types: List[str] = None):
    """Resubscribe a user"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    return await tracking_engine.resubscribe(email, subscription_types)


# ═══════════════════════════════════════════════════════════════════════════════
# CAMPAIGNS
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.post("/campaigns", response_model=Dict[str, Any])
async def create_campaign(data: CreateCampaignRequest):
    """Create a new email campaign"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    campaign = EmailCampaign(
        name=data.name,
        template_id=data.template_id,
        segment=data.segment,
        scheduled_at=data.scheduled_at,
        status="draft",
        created_at=now
    )
    
    await db.email_campaigns.insert_one(campaign.dict())
    
    return {
        "success": True,
        "campaign_id": campaign.id,
        "name": campaign.name
    }


@email_router.get("/campaigns", response_model=List[Dict[str, Any]])
async def list_campaigns(status: Optional[str] = None, limit: int = Query(50, le=100)):
    """List email campaigns"""
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    
    campaigns = await db.email_campaigns.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return campaigns


@email_router.get("/campaigns/{campaign_id}", response_model=Dict[str, Any])
async def get_campaign(campaign_id: str):
    """Get campaign by ID"""
    db = get_db()
    campaign = await db.email_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@email_router.get("/campaigns/{campaign_id}/analytics", response_model=Dict[str, Any])
async def get_campaign_analytics(campaign_id: str):
    """Get campaign analytics"""
    db = get_db()
    tracking_engine = EmailTrackingEngine(db)
    return await tracking_engine.get_campaign_analytics(campaign_id)


# ═══════════════════════════════════════════════════════════════════════════════
# SEGMENTATION
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.get("/segments", response_model=Dict[str, Any])
async def get_available_segments():
    """Get available segments and filters"""
    from services.email_automation.segmentation_service import EmailSegmentationService
    db = get_db()
    segmentation = EmailSegmentationService(db)
    return await segmentation.get_available_filters()


@email_router.get("/segments/{segment}/users", response_model=List[Dict[str, Any]])
async def get_segment_users(
    segment: str,
    role: Optional[str] = None,
    province: Optional[str] = None,
    city: Optional[str] = None,
    ref_id: Optional[str] = None,
    min_deals: Optional[int] = None,
    min_leads: Optional[int] = None,
    limit: int = Query(100, le=1000)
):
    """Get users in a segment with optional filters"""
    from services.email_automation.segmentation_service import EmailSegmentationService
    db = get_db()
    segmentation = EmailSegmentationService(db)
    
    filters = {}
    if role: filters["role"] = role
    if province: filters["province"] = province
    if city: filters["city"] = city
    if ref_id: filters["ref_id"] = ref_id
    if min_deals: filters["min_deals"] = min_deals
    if min_leads: filters["min_leads"] = min_leads
    
    return await segmentation.get_segment_users(segment, filters, limit)


@email_router.get("/segments/{segment}/count", response_model=Dict[str, Any])
async def get_segment_count(segment: str):
    """Get count of users in segment"""
    from services.email_automation.segmentation_service import EmailSegmentationService
    db = get_db()
    segmentation = EmailSegmentationService(db)
    count = await segmentation.get_segment_count(segment)
    return {"segment": segment, "count": count}


# ═══════════════════════════════════════════════════════════════════════════════
# QUEUE MONITORING (ADVANCED)
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.get("/jobs/{job_id}/detail", response_model=Dict[str, Any])
async def get_job_detail(job_id: str):
    """Get detailed job information including retry history"""
    db = get_db()
    job = await db.email_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get associated draft
    draft = None
    if job.get("draft_id"):
        draft = await db.email_drafts.find_one({"id": job["draft_id"]}, {"_id": 0})
    
    # Get associated log
    log = await db.email_logs.find_one({"job_id": job_id}, {"_id": 0})
    
    # Calculate processing time
    processing_time = None
    if job.get("processed_at") and job.get("queued_at"):
        try:
            queued = datetime.fromisoformat(job["queued_at"].replace('Z', '+00:00'))
            processed = datetime.fromisoformat(job["processed_at"].replace('Z', '+00:00'))
            processing_time = (processed - queued).total_seconds()
        except:
            pass
    
    # Check if stuck
    is_stuck = False
    stuck_duration = None
    if job.get("status") in ["queued", "sending", "retrying"]:
        try:
            started = job.get("started_at") or job.get("queued_at")
            if started:
                started_dt = datetime.fromisoformat(started.replace('Z', '+00:00'))
                duration = (datetime.now(timezone.utc) - started_dt).total_seconds()
                if duration > 300:  # 5 minutes
                    is_stuck = True
                    stuck_duration = duration
        except:
            pass
    
    return {
        "job": job,
        "draft": draft,
        "log": log,
        "processing_time_seconds": processing_time,
        "is_stuck": is_stuck,
        "stuck_duration_seconds": stuck_duration
    }


@email_router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str, background_tasks: BackgroundTasks):
    """Manually retry a failed/stuck job"""
    db = get_db()
    job = await db.email_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.get("status") not in ["failed", "retrying", "queued"]:
        raise HTTPException(status_code=400, detail=f"Cannot retry job in status: {job.get('status')}")
    
    # Reset job status
    now = datetime.now(timezone.utc).isoformat()
    await db.email_jobs.update_one(
        {"id": job_id},
        {
            "$set": {
                "status": "queued",
                "last_error": None,
                "manual_retry_at": now
            },
            "$inc": {"manual_retry_count": 1}
        }
    )
    
    # Re-add to queue
    delivery_engine = EmailDeliveryEngine(db)
    if delivery_engine.redis:
        queue = delivery_engine._get_queue_name(job.get("priority", 5))
        await delivery_engine.redis.lpush(queue, job_id)
    
    # Process in background
    background_tasks.add_task(process_queue_background)
    
    return {"success": True, "message": "Job queued for retry", "job_id": job_id}


@email_router.get("/queue/detailed-stats", response_model=Dict[str, Any])
async def get_detailed_queue_stats():
    """Get detailed queue statistics with processing metrics"""
    db = get_db()
    delivery_engine = EmailDeliveryEngine(db)
    
    # Basic stats
    basic_stats = await delivery_engine.get_queue_stats()
    
    # Processing time metrics (last 24h)
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    
    pipeline = [
        {"$match": {"processed_at": {"$gte": cutoff}, "status": "sent"}},
        {
            "$project": {
                "processing_time": {
                    "$subtract": [
                        {"$dateFromString": {"dateString": "$processed_at"}},
                        {"$dateFromString": {"dateString": "$queued_at"}}
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_processing_time_ms": {"$avg": "$processing_time"},
                "min_processing_time_ms": {"$min": "$processing_time"},
                "max_processing_time_ms": {"$max": "$processing_time"},
                "total_processed": {"$sum": 1}
            }
        }
    ]
    
    metrics = await db.email_jobs.aggregate(pipeline).to_list(1)
    
    # Error breakdown
    error_pipeline = [
        {"$match": {"status": "failed"}},
        {"$group": {"_id": "$last_error", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    errors = await db.email_jobs.aggregate(error_pipeline).to_list(10)
    
    # Stuck jobs count
    stuck_cutoff = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    stuck_count = await db.email_jobs.count_documents({
        "status": {"$in": ["queued", "sending", "retrying"]},
        "$or": [
            {"started_at": {"$lt": stuck_cutoff}},
            {"queued_at": {"$lt": stuck_cutoff}, "started_at": {"$exists": False}}
        ]
    })
    
    return {
        **basic_stats,
        "processing_metrics": metrics[0] if metrics else {},
        "error_breakdown": [{"error": e["_id"], "count": e["count"]} for e in errors],
        "stuck_jobs_count": stuck_count
    }


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

@email_router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """Health check for email system"""
    db = get_db()
    status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {}
    }
    
    # Check MongoDB
    try:
        await db.command("ping")
        status["components"]["mongodb"] = "connected"
    except Exception as e:
        status["components"]["mongodb"] = f"error: {str(e)}"
        status["status"] = "degraded"
    
    # Check Redis
    try:
        import redis.asyncio as aioredis
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        r = aioredis.from_url(redis_url)
        await r.ping()
        status["components"]["redis"] = "connected"
    except Exception as e:
        status["components"]["redis"] = f"error: {str(e)}"
        status["status"] = "degraded"
    
    # Check Resend
    resend_key = os.environ.get("RESEND_API_KEY")
    status["components"]["resend"] = "configured" if resend_key else "not_configured"
    
    # Check AI
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    status["components"]["ai"] = "configured" if llm_key else "not_configured"
    
    return status
