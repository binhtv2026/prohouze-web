"""
BOOKING ENGINE - PROHOUZING
============================
Deal Funnel + Booking Real System

Features:
- Booking creation (site_visit / phone_call)
- Auto-assign sales based on region + load
- Realtime notifications
- SLA tracking (5 min for HOT leads)
- Escalation system

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from enum import Enum
import os
import uuid
import asyncio

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'prohouzing')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
bookings_collection = db['bookings']
sales_users_collection = db['sales_users']
leads_collection = db['website_leads']
deals_collection = db['ai_deals']
notifications_collection = db['notifications']
sla_alerts_collection = db['sla_alerts']


# ===================== ENUMS =====================

class BookingType(str, Enum):
    SITE_VISIT = "site_visit"
    PHONE_CALL = "phone_call"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class TimeSlot(str, Enum):
    MORNING = "09:00"
    AFTERNOON = "14:00"
    EVENING = "19:00"


# ===================== MODELS =====================

class BookingCreate(BaseModel):
    lead_id: str
    deal_id: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    booking_type: BookingType
    time_slot: TimeSlot
    scheduled_date: Optional[str] = None  # YYYY-MM-DD, defaults to today
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    note: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    lead_id: str
    deal_id: Optional[str]
    booking_type: str
    time_slot: str
    scheduled_at: str
    status: str
    assigned_to: Optional[str]
    assigned_name: Optional[str]
    customer_name: Optional[str]
    customer_phone: Optional[str]
    project_name: Optional[str]
    created_at: str


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    note: Optional[str] = None


class SalesUserCreate(BaseModel):
    name: str
    phone: str
    region: str
    max_load: int = 10


class SalesUserResponse(BaseModel):
    id: str
    name: str
    phone: str
    region: str
    active: bool
    current_load: int
    max_load: int


# ===================== HELPER FUNCTIONS =====================

async def get_available_sales(region: Optional[str] = None) -> Optional[dict]:
    """Get available sales user with lowest load"""
    
    # First try to find sales in the same region
    if region:
        query = {"active": True, "region": {"$regex": region, "$options": "i"}}
        sales = await sales_users_collection.find(query).sort("current_load", 1).to_list(10)
        
        for s in sales:
            if s.get("current_load", 0) < s.get("max_load", 10):
                return s
    
    # Fallback: get any active sales with lowest load (regardless of region)
    sales = await sales_users_collection.find({"active": True}).sort("current_load", 1).to_list(1)
    if sales:
        s = sales[0]
        if s.get("current_load", 0) < s.get("max_load", 10):
            return s
    
    return None


async def assign_sales_to_booking(booking_id: str, sales_user: dict):
    """Assign a sales user to a booking"""
    # Update booking
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "assigned_to": str(sales_user["_id"]),
                "assigned_name": sales_user["name"],
                "assigned_phone": sales_user["phone"],
                "assigned_at": datetime.now(timezone.utc),
            }
        }
    )
    
    # Increment sales load
    await sales_users_collection.update_one(
        {"_id": sales_user["_id"]},
        {"$inc": {"current_load": 1}}
    )


async def send_notification(notification_type: str, data: dict):
    """Send notification (store in DB, can be extended to Telegram/Zalo/Push)"""
    notification = {
        "type": notification_type,
        "data": data,
        "sent_at": datetime.now(timezone.utc),
        "read": False,
        "channels": ["internal"],  # Can add: telegram, zalo, push
    }
    await notifications_collection.insert_one(notification)
    
    # TODO: Integrate with Telegram/Zalo API
    # For now, just log
    print(f"🔔 NOTIFICATION [{notification_type}]: {data.get('message', data)}")
    
    return notification


async def create_sla_alert(booking_id: str, lead_id: str, alert_type: str, message: str):
    """Create SLA alert for escalation"""
    alert = {
        "booking_id": booking_id,
        "lead_id": lead_id,
        "alert_type": alert_type,
        "message": message,
        "created_at": datetime.now(timezone.utc),
        "resolved": False,
        "escalated": False,
    }
    result = await sla_alerts_collection.insert_one(alert)
    return str(result.inserted_id)


async def check_and_escalate_hot_leads():
    """Background task to check HOT leads not called within 5 minutes"""
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    # Find pending bookings older than 5 minutes with HOT leads
    pipeline = [
        {
            "$match": {
                "status": "pending",
                "created_at": {"$lt": five_mins_ago},
            }
        },
        {
            "$lookup": {
                "from": "website_leads",
                "localField": "lead_id",
                "foreignField": "_id",
                "as": "lead"
            }
        },
        {"$unwind": {"path": "$lead", "preserveNullAndEmptyArrays": True}},
        {
            "$match": {
                "$or": [
                    {"lead.score_label": "hot"},
                    {"lead.score": {"$gte": 60}}
                ]
            }
        }
    ]
    
    # This would be run periodically by a scheduler
    # For now, it's a helper function


def format_booking_notification(booking: dict, lead: dict = None) -> dict:
    """Format booking data for notification"""
    return {
        "message": "🔥 HOT LEAD + BOOKING",
        "customer_phone": booking.get("customer_phone", "N/A"),
        "customer_name": booking.get("customer_name", "Khách mới"),
        "budget": lead.get("budget_range", "N/A") if lead else "N/A",
        "location": lead.get("location", "N/A") if lead else "N/A",
        "project": booking.get("project_name", "N/A"),
        "booking_type": "Xem nhà" if booking.get("booking_type") == "site_visit" else "Gọi điện",
        "time_slot": booking.get("time_slot"),
        "scheduled_at": booking.get("scheduled_at").isoformat() if booking.get("scheduled_at") else "Hôm nay",
        "assigned_to": booking.get("assigned_name", "Chưa assign"),
        "warning": "⚡ Gọi ngay trong 5 phút!",
    }


# ===================== API ENDPOINTS =====================

@router.post("/create", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    """Create a new booking"""
    
    # Parse scheduled date
    if booking.scheduled_date:
        try:
            scheduled_date = datetime.strptime(booking.scheduled_date, "%Y-%m-%d")
        except ValueError:
            scheduled_date = datetime.now(timezone.utc)
    else:
        scheduled_date = datetime.now(timezone.utc)
    
    # Combine date with time slot
    hour, minute = map(int, booking.time_slot.value.split(":"))
    scheduled_at = scheduled_date.replace(hour=hour, minute=minute, second=0, microsecond=0, tzinfo=timezone.utc)
    
    # If time has passed today, schedule for tomorrow
    if scheduled_at < datetime.now(timezone.utc):
        scheduled_at += timedelta(days=1)
    
    # Get lead info
    lead = None
    try:
        lead = await leads_collection.find_one({"_id": ObjectId(booking.lead_id)})
    except:
        pass
    
    # Create booking document
    booking_doc = {
        "lead_id": booking.lead_id,
        "deal_id": booking.deal_id,
        "project_id": booking.project_id,
        "project_name": booking.project_name or "Chưa xác định",
        "booking_type": booking.booking_type.value,
        "time_slot": booking.time_slot.value,
        "scheduled_at": scheduled_at,
        "status": BookingStatus.PENDING.value,
        "assigned_to": None,
        "assigned_name": None,
        "assigned_phone": None,
        "customer_name": booking.customer_name or (lead.get("name") if lead else "Khách mới"),
        "customer_phone": booking.customer_phone or (lead.get("phone") if lead else None),
        "note": booking.note,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    result = await bookings_collection.insert_one(booking_doc)
    booking_id = str(result.inserted_id)
    
    # Auto-assign sales
    region = None
    if lead:
        region = lead.get("location")
    
    sales_user = await get_available_sales(region)
    
    if sales_user:
        await assign_sales_to_booking(booking_id, sales_user)
        booking_doc["assigned_to"] = str(sales_user["_id"])
        booking_doc["assigned_name"] = sales_user["name"]
        booking_doc["assigned_phone"] = sales_user["phone"]
    
    # Send notification
    notification_data = format_booking_notification(booking_doc, lead)
    await send_notification("booking_created", notification_data)
    
    # If HOT lead, send urgent notification
    if lead and (lead.get("score_label") == "hot" or lead.get("score", 0) >= 60):
        await send_notification("hot_lead_booking", {
            **notification_data,
            "urgency": "CRITICAL",
            "sla": "5 minutes",
        })
    
    # Update deal with booking
    if booking.deal_id:
        await deals_collection.update_one(
            {"_id": ObjectId(booking.deal_id)},
            {
                "$set": {
                    "booking_id": booking_id,
                    "booking_status": "pending",
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )
    
    return BookingResponse(
        id=booking_id,
        lead_id=booking.lead_id,
        deal_id=booking.deal_id,
        booking_type=booking_doc["booking_type"],
        time_slot=booking_doc["time_slot"],
        scheduled_at=scheduled_at.isoformat(),
        status=booking_doc["status"],
        assigned_to=booking_doc.get("assigned_to"),
        assigned_name=booking_doc.get("assigned_name"),
        customer_name=booking_doc["customer_name"],
        customer_phone=booking_doc["customer_phone"],
        project_name=booking_doc["project_name"],
        created_at=booking_doc["created_at"].isoformat(),
    )


@router.post("/{booking_id}/assign")
async def manual_assign_booking(booking_id: str, sales_user_id: str):
    """Manually assign a booking to a specific sales user"""
    
    # Get booking
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get sales user
    sales_user = await sales_users_collection.find_one({"_id": ObjectId(sales_user_id)})
    if not sales_user:
        raise HTTPException(status_code=404, detail="Sales user not found")
    
    # If already assigned to someone else, decrement their load
    if booking.get("assigned_to"):
        await sales_users_collection.update_one(
            {"_id": ObjectId(booking["assigned_to"])},
            {"$inc": {"current_load": -1}}
        )
    
    # Assign new sales
    await assign_sales_to_booking(booking_id, sales_user)
    
    # Send notification to new assignee
    await send_notification("booking_assigned", {
        "message": f"📋 Bạn được assign booking mới",
        "booking_id": booking_id,
        "customer_phone": booking.get("customer_phone"),
        "time_slot": booking.get("time_slot"),
    })
    
    return {"message": "Booking assigned successfully", "assigned_to": sales_user["name"]}


@router.post("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(booking_id: str, update: BookingStatusUpdate):
    """Update booking status"""
    
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    old_status = booking["status"]
    new_status = update.status.value
    
    # Update booking
    update_doc = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }
    if update.note:
        update_doc["note"] = update.note
    
    # Track status history
    status_history = booking.get("status_history", [])
    status_history.append({
        "from": old_status,
        "to": new_status,
        "at": datetime.now(timezone.utc),
        "note": update.note,
    })
    update_doc["status_history"] = status_history
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_doc}
    )
    
    # If completed/cancelled, decrement sales load
    if new_status in ["completed", "cancelled", "closed"] and booking.get("assigned_to"):
        await sales_users_collection.update_one(
            {"_id": ObjectId(booking["assigned_to"])},
            {"$inc": {"current_load": -1}}
        )
    
    # If confirmed, resolve any SLA alerts
    if new_status == "confirmed":
        await sla_alerts_collection.update_many(
            {"booking_id": booking_id, "resolved": False},
            {"$set": {"resolved": True, "resolved_at": datetime.now(timezone.utc)}}
        )
    
    # Update deal status if linked
    if booking.get("deal_id"):
        deal_status_map = {
            "confirmed": "in_progress",
            "completed": "completed",
            "closed": "closed_won",
            "cancelled": "closed_lost",
        }
        if new_status in deal_status_map:
            await deals_collection.update_one(
                {"_id": ObjectId(booking["deal_id"])},
                {"$set": {"status": deal_status_map[new_status]}}
            )
    
    # Send notification
    await send_notification("booking_status_updated", {
        "booking_id": booking_id,
        "old_status": old_status,
        "new_status": new_status,
        "customer_phone": booking.get("customer_phone"),
    })
    
    # Fetch updated booking
    updated = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    
    return BookingResponse(
        id=booking_id,
        lead_id=updated.get("lead_id", ""),
        deal_id=updated.get("deal_id"),
        booking_type=updated["booking_type"],
        time_slot=updated["time_slot"],
        scheduled_at=updated["scheduled_at"].isoformat(),
        status=updated["status"],
        assigned_to=updated.get("assigned_to"),
        assigned_name=updated.get("assigned_name"),
        customer_name=updated.get("customer_name"),
        customer_phone=updated.get("customer_phone"),
        project_name=updated.get("project_name"),
        created_at=updated["created_at"].isoformat(),
    )


@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """List bookings with filters"""
    query = {}
    
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
            next_date = target_date + timedelta(days=1)
            query["scheduled_at"] = {
                "$gte": target_date.replace(tzinfo=timezone.utc),
                "$lt": next_date.replace(tzinfo=timezone.utc),
            }
        except ValueError:
            pass
    
    bookings = []
    async for b in bookings_collection.find(query).sort("scheduled_at", 1).skip(skip).limit(limit):
        bookings.append(BookingResponse(
            id=str(b["_id"]),
            lead_id=b.get("lead_id", ""),
            deal_id=b.get("deal_id"),
            booking_type=b["booking_type"],
            time_slot=b["time_slot"],
            scheduled_at=b["scheduled_at"].isoformat() if b.get("scheduled_at") else "",
            status=b["status"],
            assigned_to=b.get("assigned_to"),
            assigned_name=b.get("assigned_name"),
            customer_name=b.get("customer_name"),
            customer_phone=b.get("customer_phone"),
            project_name=b.get("project_name"),
            created_at=b["created_at"].isoformat() if b.get("created_at") else "",
        ))
    
    return bookings


@router.get("/today")
async def get_today_bookings():
    """Get all bookings for today"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    bookings = []
    async for b in bookings_collection.find({
        "scheduled_at": {"$gte": today, "$lt": tomorrow}
    }).sort("time_slot", 1):
        bookings.append({
            "id": str(b["_id"]),
            "time_slot": b["time_slot"],
            "booking_type": b["booking_type"],
            "status": b["status"],
            "customer_name": b.get("customer_name"),
            "customer_phone": b.get("customer_phone"),
            "project_name": b.get("project_name"),
            "assigned_name": b.get("assigned_name"),
        })
    
    # Group by time slot
    by_slot = {"09:00": [], "14:00": [], "19:00": []}
    for b in bookings:
        slot = b.get("time_slot", "09:00")
        if slot in by_slot:
            by_slot[slot].append(b)
    
    return {
        "date": today.strftime("%Y-%m-%d"),
        "total": len(bookings),
        "by_time_slot": by_slot,
    }


@router.get("/stats")
async def get_booking_stats():
    """Get booking statistics"""
    
    total = await bookings_collection.count_documents({})
    pending = await bookings_collection.count_documents({"status": "pending"})
    confirmed = await bookings_collection.count_documents({"status": "confirmed"})
    completed = await bookings_collection.count_documents({"status": "completed"})
    closed = await bookings_collection.count_documents({"status": "closed"})
    cancelled = await bookings_collection.count_documents({"status": "cancelled"})
    
    # Today's bookings
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    today_count = await bookings_collection.count_documents({
        "scheduled_at": {"$gte": today, "$lt": tomorrow}
    })
    
    # Calculate rates
    booking_rate = round((completed + closed) / total * 100, 1) if total > 0 else 0
    show_rate = round(completed / (confirmed + completed + closed) * 100, 1) if (confirmed + completed + closed) > 0 else 0
    close_rate = round(closed / completed * 100, 1) if completed > 0 else 0
    
    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "closed": closed,
        "cancelled": cancelled,
        "today": today_count,
        "booking_rate": booking_rate,
        "show_rate": show_rate,
        "close_rate": close_rate,
    }


# ===================== SALES USER MANAGEMENT =====================

@router.post("/sales-users", response_model=SalesUserResponse)
async def create_sales_user(user: SalesUserCreate):
    """Create a new sales user"""
    
    user_doc = {
        "name": user.name,
        "phone": user.phone,
        "region": user.region,
        "active": True,
        "current_load": 0,
        "max_load": user.max_load,
        "created_at": datetime.now(timezone.utc),
    }
    
    result = await sales_users_collection.insert_one(user_doc)
    
    return SalesUserResponse(
        id=str(result.inserted_id),
        name=user.name,
        phone=user.phone,
        region=user.region,
        active=True,
        current_load=0,
        max_load=user.max_load,
    )


@router.get("/sales-users", response_model=List[SalesUserResponse])
async def list_sales_users(active_only: bool = True):
    """List all sales users"""
    query = {"active": True} if active_only else {}
    
    users = []
    async for u in sales_users_collection.find(query).sort("current_load", 1):
        users.append(SalesUserResponse(
            id=str(u["_id"]),
            name=u["name"],
            phone=u["phone"],
            region=u["region"],
            active=u.get("active", True),
            current_load=u.get("current_load", 0),
            max_load=u.get("max_load", 10),
        ))
    
    return users


@router.post("/sales-users/{user_id}/toggle-active")
async def toggle_sales_user_active(user_id: str):
    """Toggle sales user active status"""
    user = await sales_users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Sales user not found")
    
    new_status = not user.get("active", True)
    await sales_users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"active": new_status}}
    )
    
    return {"message": f"Sales user {'activated' if new_status else 'deactivated'}", "active": new_status}


# ===================== SLA & NOTIFICATIONS =====================

@router.get("/sla-alerts")
async def get_sla_alerts(resolved: bool = False):
    """Get SLA alerts"""
    alerts = []
    async for a in sla_alerts_collection.find({"resolved": resolved}).sort("created_at", -1).limit(50):
        alerts.append({
            "id": str(a["_id"]),
            "booking_id": a.get("booking_id"),
            "lead_id": a.get("lead_id"),
            "alert_type": a.get("alert_type"),
            "message": a.get("message"),
            "created_at": a["created_at"].isoformat() if a.get("created_at") else None,
            "escalated": a.get("escalated", False),
        })
    return alerts


@router.get("/notifications")
async def get_notifications(unread_only: bool = True, limit: int = 20):
    """Get notifications"""
    query = {"read": False} if unread_only else {}
    
    notifications = []
    async for n in notifications_collection.find(query).sort("sent_at", -1).limit(limit):
        notifications.append({
            "id": str(n["_id"]),
            "type": n.get("type"),
            "data": n.get("data"),
            "sent_at": n["sent_at"].isoformat() if n.get("sent_at") else None,
            "read": n.get("read", False),
        })
    
    return notifications


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    await notifications_collection.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Notification marked as read"}


# ===================== TIME SLOTS =====================

@router.get("/time-slots")
async def get_available_time_slots(date: Optional[str] = None):
    """Get available time slots for a date"""
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            target_date = datetime.now(timezone.utc)
    else:
        target_date = datetime.now(timezone.utc)
    
    next_date = target_date + timedelta(days=1)
    
    # Count existing bookings per slot
    pipeline = [
        {
            "$match": {
                "scheduled_at": {
                    "$gte": target_date.replace(tzinfo=timezone.utc),
                    "$lt": next_date.replace(tzinfo=timezone.utc),
                },
                "status": {"$ne": "cancelled"},
            }
        },
        {
            "$group": {
                "_id": "$time_slot",
                "count": {"$sum": 1}
            }
        }
    ]
    
    counts = {}
    async for doc in bookings_collection.aggregate(pipeline):
        counts[doc["_id"]] = doc["count"]
    
    # Max bookings per slot (configurable)
    MAX_PER_SLOT = 10
    
    slots = [
        {
            "time": "09:00",
            "label": "Sáng (09:00)",
            "booked": counts.get("09:00", 0),
            "available": max(0, MAX_PER_SLOT - counts.get("09:00", 0)),
        },
        {
            "time": "14:00",
            "label": "Chiều (14:00)",
            "booked": counts.get("14:00", 0),
            "available": max(0, MAX_PER_SLOT - counts.get("14:00", 0)),
        },
        {
            "time": "19:00",
            "label": "Tối (19:00)",
            "booked": counts.get("19:00", 0),
            "available": max(0, MAX_PER_SLOT - counts.get("19:00", 0)),
        },
    ]
    
    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "slots": slots,
    }
