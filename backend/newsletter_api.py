"""
ProHouzing Newsletter & Email Notifications API
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

newsletter_router = APIRouter(prefix="/newsletter", tags=["Newsletter"])
notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])

# ==================== MODELS ====================

class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    interests: List[str] = []  # market, project, tips, careers

class NewsletterUnsubscribe(BaseModel):
    email: EmailStr

class NotificationCreate(BaseModel):
    type: str  # job_application, contact_form, newsletter_signup
    title: str
    message: str
    data: dict = {}
    recipient_email: Optional[str] = None

# ==================== NEWSLETTER ====================

@newsletter_router.post("/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    """Subscribe to newsletter"""
    
    # Check if already subscribed
    existing = await db.newsletter_subscribers.find_one({"email": data.email})
    if existing:
        if existing.get("is_active"):
            return {"success": True, "message": "Email đã được đăng ký trước đó", "already_subscribed": True}
        else:
            # Reactivate subscription
            await db.newsletter_subscribers.update_one(
                {"email": data.email},
                {"$set": {"is_active": True, "resubscribed_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"success": True, "message": "Đã kích hoạt lại đăng ký"}
    
    now = datetime.now(timezone.utc).isoformat()
    subscriber_doc = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "name": data.name,
        "interests": data.interests if data.interests else ["market", "project", "tips"],
        "is_active": True,
        "source": "website",
        "subscribed_at": now,
        "created_at": now
    }
    
    await db.newsletter_subscribers.insert_one(subscriber_doc)
    
    # Create notification for admin
    await create_notification(
        type="newsletter_signup",
        title="Đăng ký nhận tin mới",
        message=f"{data.email} đã đăng ký nhận tin tức",
        data={"email": data.email, "name": data.name}
    )
    
    return {
        "success": True,
        "message": "Đăng ký nhận tin thành công! Cảm ơn bạn đã quan tâm."
    }

@newsletter_router.post("/unsubscribe")
async def unsubscribe_newsletter(data: NewsletterUnsubscribe):
    """Unsubscribe from newsletter"""
    
    result = await db.newsletter_subscribers.update_one(
        {"email": data.email},
        {"$set": {"is_active": False, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Email không tìm thấy trong danh sách")
    
    return {"success": True, "message": "Đã hủy đăng ký nhận tin"}

@newsletter_router.get("/subscribers")
async def list_subscribers(
    is_active: Optional[bool] = True,
    skip: int = 0,
    limit: int = 100
):
    """List newsletter subscribers (admin)"""
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.newsletter_subscribers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    subscribers = await cursor.to_list(length=limit)
    
    total = await db.newsletter_subscribers.count_documents(query)
    
    return {
        "subscribers": subscribers,
        "total": total,
        "active_count": await db.newsletter_subscribers.count_documents({"is_active": True})
    }

@newsletter_router.get("/stats")
async def newsletter_stats():
    """Get newsletter statistics"""
    total = await db.newsletter_subscribers.count_documents({})
    active = await db.newsletter_subscribers.count_documents({"is_active": True})
    
    # Get subscribers this week
    from datetime import timedelta
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    this_week = await db.newsletter_subscribers.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    # Get subscribers this month
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    this_month = await db.newsletter_subscribers.count_documents({
        "created_at": {"$gte": month_ago}
    })
    
    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "this_week": this_week,
        "this_month": this_month
    }

# ==================== NOTIFICATIONS ====================

async def create_notification(type: str, title: str, message: str, data: dict = {}, recipient_email: str = None):
    """Internal function to create notification"""
    now = datetime.now(timezone.utc).isoformat()
    notification_doc = {
        "id": str(uuid.uuid4()),
        "type": type,
        "title": title,
        "message": message,
        "data": data,
        "recipient_email": recipient_email,
        "is_read": False,
        "created_at": now
    }
    await db.notifications.insert_one(notification_doc)
    return notification_doc

@notification_router.get("/")
async def list_notifications(
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List notifications for admin"""
    query = {}
    if is_read is not None:
        query["is_read"] = is_read
    if type:
        query["type"] = type
    
    cursor = db.notifications.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    notifications = await cursor.to_list(length=limit)
    
    unread_count = await db.notifications.count_documents({"is_read": False})
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@notification_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}

@notification_router.put("/mark-all-read")
async def mark_all_read():
    """Mark all notifications as read"""
    now = datetime.now(timezone.utc).isoformat()
    result = await db.notifications.update_many(
        {"is_read": False},
        {"$set": {"is_read": True, "read_at": now}}
    )
    
    return {"success": True, "marked_count": result.modified_count}

@notification_router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    result = await db.notifications.delete_one({"id": notification_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}

# ==================== EMAIL SENDING (Placeholder) ====================
# Note: For actual email sending, integrate with SendGrid, AWS SES, or similar service

async def send_email_notification(to_email: str, subject: str, body: str):
    """
    Placeholder for email sending functionality.
    In production, integrate with email service provider.
    """
    # Log the email that would be sent
    print(f"[EMAIL] To: {to_email}, Subject: {subject}")
    
    # Store in database for tracking
    await db.email_logs.insert_one({
        "id": str(uuid.uuid4()),
        "to": to_email,
        "subject": subject,
        "body": body,
        "status": "logged",  # In production: sent, failed, pending
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return True
