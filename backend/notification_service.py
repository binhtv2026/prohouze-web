"""
NOTIFICATION SERVICE - PROHOUZING
=================================
Realtime notifications via Telegram, Zalo, In-app

Features:
- Telegram Bot integration
- Hot lead alerts
- SLA violation alerts
- Booking notifications

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import os
import httpx
import asyncio

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
notifications_collection = db['notifications']
notification_settings_collection = db['notification_settings']
telegram_chats_collection = db['telegram_chats']

# Telegram Config
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')  # Default chat/group


# ===================== MODELS =====================

class NotificationPayload(BaseModel):
    type: str  # hot_lead, booking_created, sla_violation, deal_created
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    channels: List[str] = ["inapp"]  # inapp, telegram, zalo
    priority: str = "normal"  # normal, high, critical
    recipient_id: Optional[str] = None  # Specific user


class TelegramMessage(BaseModel):
    chat_id: Optional[str] = None
    message: str
    parse_mode: str = "HTML"


class NotificationSettings(BaseModel):
    user_id: str
    telegram_enabled: bool = True
    telegram_chat_id: Optional[str] = None
    zalo_enabled: bool = False
    inapp_enabled: bool = True
    notify_hot_leads: bool = True
    notify_bookings: bool = True
    notify_sla: bool = True


# ===================== MESSAGE TEMPLATES =====================

def format_hot_lead_message(data: dict) -> str:
    """Format hot lead notification message with CALL NOW button"""
    phone = data.get('phone', '')
    phone_clean = phone.replace(' ', '').replace('-', '').replace('.', '') if phone else ''
    
    return f"""
🔥 <b>HOT LEAD MỚI</b>

👤 <b>SĐT:</b> {phone}
👤 <b>Tên:</b> {data.get('name', 'Khách mới')}
💰 <b>Ngân sách:</b> {data.get('budget', 'N/A')}
📍 <b>Khu vực:</b> {data.get('location', 'N/A')}
🎯 <b>Mục đích:</b> {data.get('purpose', 'N/A')}
⏰ <b>Timeline:</b> {data.get('timeline', 'N/A')}
🏢 <b>Dự án:</b> {data.get('project', 'Chưa chọn')}

⚡ <b>GỌI NGAY TRONG 5 PHÚT!</b>

📞 <a href="tel:{phone_clean}">👉 GỌI NGAY: {phone}</a>
"""


def format_booking_message(data: dict) -> str:
    """Format booking notification message with CALL NOW button"""
    booking_type = "Xem nhà" if data.get('booking_type') == 'site_visit' else "Gọi điện"
    phone = data.get('phone', '')
    phone_clean = phone.replace(' ', '').replace('-', '').replace('.', '') if phone else ''
    
    return f"""
📅 <b>BOOKING MỚI</b>

👤 <b>SĐT:</b> {phone}
👤 <b>Tên:</b> {data.get('name', 'Khách mới')}
🏢 <b>Dự án:</b> {data.get('project', 'N/A')}
📋 <b>Hình thức:</b> {booking_type}
🕐 <b>Thời gian:</b> {data.get('time_slot', 'N/A')}
👨‍💼 <b>Assigned:</b> {data.get('assigned_name', 'Chưa assign')}

⚡ <b>Liên hệ xác nhận ngay!</b>

📞 <a href="tel:{phone_clean}">👉 GỌI NGAY: {phone}</a>
"""


def format_sla_violation_message(data: dict) -> str:
    """Format SLA violation alert message with CALL NOW button"""
    phone = data.get('phone', '')
    phone_clean = phone.replace(' ', '').replace('-', '').replace('.', '') if phone else ''
    
    return f"""
🚨 <b>CẢNH BÁO SLA!</b>

👤 <b>SĐT:</b> {phone}
👨‍💼 <b>Sales:</b> {data.get('sales_name', 'N/A')}
⏱ <b>Quá hạn:</b> {data.get('minutes_overdue', 0)} phút
📋 <b>Booking ID:</b> {str(data.get('booking_id', 'N/A'))[:8]}...

❌ <b>CHƯA GỌI - CẦN XỬ LÝ NGAY!</b>

{f"⚠️ {data.get('action', '')}" if data.get('action') else ""}

📞 <a href="tel:{phone_clean}">👉 GỌI NGAY: {phone}</a>
"""


def format_deal_message(data: dict) -> str:
    """Format deal created notification"""
    return f"""
🎉 <b>DEAL MỚI TẠO</b>

👤 <b>Khách:</b> {data.get('name', 'N/A')}
💰 <b>Ngân sách:</b> {data.get('budget', 'N/A')}
📍 <b>Khu vực:</b> {data.get('location', 'N/A')}
🏢 <b>Dự án:</b> {data.get('project', 'N/A')}
👨‍💼 <b>Sales:</b> {data.get('sales_name', 'Chưa assign')}

✅ <b>Tiếp tục chốt!</b>
"""


def format_reassign_message(data: dict) -> str:
    """Format reassign notification with CALL NOW button"""
    phone = data.get('phone', '')
    phone_clean = phone.replace(' ', '').replace('-', '').replace('.', '') if phone else ''
    
    return f"""
🔄 <b>REASSIGN BOOKING</b>

📋 <b>Booking:</b> {str(data.get('booking_id', 'N/A'))[:8]}...
👤 <b>Khách:</b> {phone}
👨‍💼 <b>Sales cũ:</b> {data.get('old_sales', 'N/A')}
👨‍💼 <b>Sales mới:</b> {data.get('new_sales', 'N/A')}
⚠️ <b>Lý do:</b> {data.get('reason', 'SLA violation')}

⚡ <b>Sales mới cần gọi NGAY!</b>

📞 <a href="tel:{phone_clean}">👉 GỌI NGAY: {phone}</a>
"""


# ===================== TELEGRAM FUNCTIONS =====================

async def send_telegram(message: str, chat_id: Optional[str] = None) -> dict:
    """Send message via Telegram Bot"""
    if not TELEGRAM_BOT_TOKEN:
        print("[TELEGRAM] Bot token not configured")
        return {"success": False, "error": "Bot token not configured"}
    
    target_chat_id = chat_id or TELEGRAM_CHAT_ID
    if not target_chat_id:
        print("[TELEGRAM] No chat_id provided")
        return {"success": False, "error": "No chat_id"}
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": target_chat_id,
        "text": message,
        "parse_mode": "HTML",
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            result = response.json()
            
            if result.get("ok"):
                print(f"[TELEGRAM] Message sent to {target_chat_id}")
                return {"success": True, "message_id": result.get("result", {}).get("message_id")}
            else:
                print(f"[TELEGRAM] Error: {result.get('description')}")
                return {"success": False, "error": result.get("description")}
    except Exception as e:
        print(f"[TELEGRAM] Exception: {e}")
        return {"success": False, "error": str(e)}


async def send_to_all_telegram_chats(message: str) -> List[dict]:
    """Send message to all registered Telegram chats"""
    results = []
    
    # Send to default chat
    if TELEGRAM_CHAT_ID:
        result = await send_telegram(message, TELEGRAM_CHAT_ID)
        results.append({"chat_id": TELEGRAM_CHAT_ID, **result})
    
    # Send to registered chats
    async for chat in telegram_chats_collection.find({"active": True}):
        chat_id = chat.get("chat_id")
        if chat_id and chat_id != TELEGRAM_CHAT_ID:
            result = await send_telegram(message, chat_id)
            results.append({"chat_id": chat_id, **result})
    
    return results


# ===================== IN-APP NOTIFICATION =====================

async def send_inapp(notification: dict) -> str:
    """Save in-app notification to database"""
    doc = {
        "type": notification.get("type"),
        "title": notification.get("title"),
        "message": notification.get("message"),
        "data": notification.get("data", {}),
        "priority": notification.get("priority", "normal"),
        "recipient_id": notification.get("recipient_id"),
        "read": False,
        "sent_at": datetime.now(timezone.utc),
        "channels_sent": notification.get("channels_sent", []),
    }
    
    result = await notifications_collection.insert_one(doc)
    return str(result.inserted_id)


# ===================== MAIN NOTIFICATION FUNCTIONS =====================

async def notify_hot_lead(lead_data: dict, background: bool = True):
    """Send hot lead notification to all channels"""
    message = format_hot_lead_message(lead_data)
    
    channels_sent = []
    
    # Telegram
    telegram_results = await send_to_all_telegram_chats(message)
    if any(r.get("success") for r in telegram_results):
        channels_sent.append("telegram")
    
    # In-app
    await send_inapp({
        "type": "hot_lead",
        "title": "🔥 HOT Lead mới",
        "message": f"SĐT: {lead_data.get('phone')} - {lead_data.get('location', 'N/A')}",
        "data": lead_data,
        "priority": "critical",
        "channels_sent": channels_sent,
    })
    
    return {"telegram": telegram_results, "inapp": True}


async def notify_booking_created(booking_data: dict):
    """Send booking created notification"""
    message = format_booking_message(booking_data)
    
    channels_sent = []
    
    # Telegram
    telegram_results = await send_to_all_telegram_chats(message)
    if any(r.get("success") for r in telegram_results):
        channels_sent.append("telegram")
    
    # In-app
    await send_inapp({
        "type": "booking_created",
        "title": "📅 Booking mới",
        "message": f"SĐT: {booking_data.get('phone')} - {booking_data.get('time_slot')}",
        "data": booking_data,
        "priority": "high",
        "channels_sent": channels_sent,
    })
    
    return {"telegram": telegram_results, "inapp": True}


async def notify_sla_violation(sla_data: dict):
    """Send SLA violation alert"""
    message = format_sla_violation_message(sla_data)
    
    channels_sent = []
    
    # Telegram (critical - send immediately)
    telegram_results = await send_to_all_telegram_chats(message)
    if any(r.get("success") for r in telegram_results):
        channels_sent.append("telegram")
    
    # In-app
    await send_inapp({
        "type": "sla_violation",
        "title": "🚨 SLA Violation",
        "message": f"Sales: {sla_data.get('sales_name')} - Quá {sla_data.get('minutes_overdue')} phút",
        "data": sla_data,
        "priority": "critical",
        "channels_sent": channels_sent,
    })
    
    return {"telegram": telegram_results, "inapp": True}


async def notify_reassign(reassign_data: dict):
    """Send reassignment notification"""
    message = format_reassign_message(reassign_data)
    
    # Telegram
    telegram_results = await send_to_all_telegram_chats(message)
    
    # In-app
    await send_inapp({
        "type": "reassign",
        "title": "🔄 Booking Reassigned",
        "message": f"Từ {reassign_data.get('old_sales')} → {reassign_data.get('new_sales')}",
        "data": reassign_data,
        "priority": "high",
    })
    
    return {"telegram": telegram_results, "inapp": True}


async def notify_deal_created(deal_data: dict):
    """Send deal created notification"""
    message = format_deal_message(deal_data)
    
    # Telegram
    telegram_results = await send_to_all_telegram_chats(message)
    
    # In-app
    await send_inapp({
        "type": "deal_created",
        "title": "🎉 Deal mới",
        "message": f"Khách: {deal_data.get('name')} - {deal_data.get('budget')}",
        "data": deal_data,
        "priority": "normal",
    })
    
    return {"telegram": telegram_results, "inapp": True}


# ===================== API ENDPOINTS =====================

@router.post("/send")
async def send_notification(payload: NotificationPayload, background_tasks: BackgroundTasks):
    """Send notification via specified channels"""
    results = {}
    
    # Format message based on type
    if payload.type == "hot_lead":
        message = format_hot_lead_message(payload.data or {})
    elif payload.type == "booking_created":
        message = format_booking_message(payload.data or {})
    elif payload.type == "sla_violation":
        message = format_sla_violation_message(payload.data or {})
    elif payload.type == "deal_created":
        message = format_deal_message(payload.data or {})
    else:
        message = f"<b>{payload.title}</b>\n\n{payload.message}"
    
    # Send to channels
    if "telegram" in payload.channels:
        results["telegram"] = await send_to_all_telegram_chats(message)
    
    if "inapp" in payload.channels:
        notification_id = await send_inapp({
            "type": payload.type,
            "title": payload.title,
            "message": payload.message,
            "data": payload.data,
            "priority": payload.priority,
            "recipient_id": payload.recipient_id,
        })
        results["inapp"] = {"success": True, "id": notification_id}
    
    return results


@router.get("/list")
async def list_notifications(
    unread_only: bool = False,
    type: Optional[str] = None,
    limit: int = 50,
):
    """List notifications"""
    query = {}
    if unread_only:
        query["read"] = False
    if type:
        query["type"] = type
    
    notifications = []
    async for n in notifications_collection.find(query).sort("sent_at", -1).limit(limit):
        notifications.append({
            "id": str(n["_id"]),
            "type": n.get("type"),
            "title": n.get("title"),
            "message": n.get("message"),
            "priority": n.get("priority"),
            "read": n.get("read", False),
            "sent_at": n["sent_at"].isoformat() if n.get("sent_at") else None,
        })
    
    unread_count = await notifications_collection.count_documents({"read": False})
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
    }


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    """Mark notification as read"""
    await notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return {"success": True}


@router.post("/read-all")
async def mark_all_read():
    """Mark all notifications as read"""
    result = await notifications_collection.update_many(
        {"read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return {"updated": result.modified_count}


@router.post("/telegram/register")
async def register_telegram_chat(chat_id: str, name: Optional[str] = None):
    """Register a Telegram chat for notifications"""
    await telegram_chats_collection.update_one(
        {"chat_id": chat_id},
        {
            "$set": {
                "chat_id": chat_id,
                "name": name,
                "active": True,
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )
    return {"success": True, "chat_id": chat_id}


@router.get("/telegram/test")
async def test_telegram():
    """Test Telegram connection"""
    if not TELEGRAM_BOT_TOKEN:
        return {"success": False, "error": "TELEGRAM_BOT_TOKEN not configured"}
    
    result = await send_telegram("✅ Test message from ProHouzing System", TELEGRAM_CHAT_ID)
    return result


@router.get("/stats")
async def notification_stats():
    """Get notification statistics"""
    total = await notifications_collection.count_documents({})
    unread = await notifications_collection.count_documents({"read": False})
    
    # Count by type
    pipeline = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    by_type = {}
    async for doc in notifications_collection.aggregate(pipeline):
        by_type[doc["_id"] or "unknown"] = doc["count"]
    
    # Count by priority
    pipeline = [
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    by_priority = {}
    async for doc in notifications_collection.aggregate(pipeline):
        by_priority[doc["_id"] or "normal"] = doc["count"]
    
    return {
        "total": total,
        "unread": unread,
        "by_type": by_type,
        "by_priority": by_priority,
    }


@router.get("/telegram/status")
async def get_telegram_status():
    """Get Telegram configuration status"""
    has_token = bool(TELEGRAM_BOT_TOKEN)
    has_chat_id = bool(TELEGRAM_CHAT_ID)
    
    registered_chats = await telegram_chats_collection.count_documents({"active": True})
    
    return {
        "configured": has_token,
        "has_default_chat": has_chat_id,
        "registered_chats": registered_chats,
        "bot_token_set": has_token,
        "chat_id_set": has_chat_id,
        "message": "Telegram is configured" if has_token else "TELEGRAM_BOT_TOKEN not set in backend/.env"
    }


class TelegramConfigPayload(BaseModel):
    bot_token: str
    chat_id: str


@router.post("/telegram/configure")
async def configure_telegram(config: TelegramConfigPayload):
    """
    Store Telegram config in database for persistence
    Note: For immediate effect, also update backend/.env
    """
    # Store in database
    await notification_settings_collection.update_one(
        {"type": "telegram_global"},
        {
            "$set": {
                "bot_token": config.bot_token,
                "chat_id": config.chat_id,
                "updated_at": datetime.now(timezone.utc)
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
        },
        upsert=True
    )
    
    # Update global variables for this process
    global TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
    TELEGRAM_BOT_TOKEN = config.bot_token
    TELEGRAM_CHAT_ID = config.chat_id
    
    # Test connection
    test_result = await send_telegram("✅ ProHouzing Telegram đã được cấu hình thành công!", config.chat_id)
    
    return {
        "success": True,
        "test_message_sent": test_result.get("success", False),
        "message": "Telegram configured. Test message sent." if test_result.get("success") else f"Config saved but test failed: {test_result.get('error')}"
    }


@router.get("/telegram/chats")
async def get_telegram_chats():
    """Get list of registered Telegram chats"""
    chats = []
    async for chat in telegram_chats_collection.find({"active": True}):
        chats.append({
            "chat_id": chat.get("chat_id"),
            "name": chat.get("name"),
            "created_at": chat["created_at"].isoformat() if chat.get("created_at") else None
        })
    
    return {"chats": chats, "total": len(chats)}

