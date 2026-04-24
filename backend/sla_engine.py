"""
SLA ENGINE - PROHOUZING SALES CONTROL SYSTEM
=============================================
Cron job chạy mỗi phút để:
1. Kiểm tra HOT leads chưa được gọi trong 5 phút
2. Gửi cảnh báo SLA violation
3. Auto-reassign sau 10 phút

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import asyncio
import logging

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SLA_ENGINE")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
bookings_collection = db['bookings']
leads_collection = db['website_leads']
sales_users_collection = db['sales_users']
sla_alerts_collection = db['sla_alerts']
sla_logs_collection = db['sla_logs']

# Import notification functions
from notification_service import (
    notify_sla_violation,
    notify_reassign,
    send_telegram
)

# ===================== SLA CONFIGURATION =====================

SLA_CONFIG = {
    "hot_lead_call_time_minutes": 5,      # HOT lead phải được gọi trong 5 phút
    "warning_time_minutes": 3,            # Cảnh báo sau 3 phút
    "reassign_time_minutes": 10,          # Auto reassign sau 10 phút
    "check_interval_seconds": 60,         # Kiểm tra mỗi 60 giây
    "max_alerts_per_booking": 3,          # Max 3 lần alert cho 1 booking
}

# ===================== MODELS =====================

class SLACheckResult(BaseModel):
    total_checked: int = 0
    warnings_sent: int = 0
    violations_found: int = 0
    reassignments_made: int = 0
    errors: List[str] = []


class CallStatusUpdate(BaseModel):
    status: str  # called, no_answer, success, callback_scheduled
    note: Optional[str] = None
    callback_time: Optional[str] = None  # ISO format if callback_scheduled


# ===================== HELPER FUNCTIONS =====================

async def get_alternative_sales(current_sales_id: str, region: Optional[str] = None) -> Optional[dict]:
    """Get alternative sales user for reassignment"""
    
    # Query for active sales users, excluding current one
    query = {
        "active": True,
        "_id": {"$ne": ObjectId(current_sales_id)} if ObjectId.is_valid(current_sales_id) else {}
    }
    
    # Try to match region first
    if region:
        regional_sales = await sales_users_collection.find({
            **query,
            "region": {"$regex": region, "$options": "i"}
        }).sort("current_load", 1).to_list(10)
        
        for s in regional_sales:
            if s.get("current_load", 0) < s.get("max_load", 10):
                return s
    
    # Fallback: get any available sales with lowest load
    all_sales = await sales_users_collection.find(query).sort("current_load", 1).to_list(10)
    
    for s in all_sales:
        if s.get("current_load", 0) < s.get("max_load", 10):
            return s
    
    return None


async def create_sla_alert(booking_id: str, lead_id: str, alert_type: str, 
                          minutes_overdue: int, sales_id: str, sales_name: str) -> str:
    """Create SLA alert record"""
    alert = {
        "booking_id": booking_id,
        "lead_id": lead_id,
        "alert_type": alert_type,  # warning, violation, escalation
        "minutes_overdue": minutes_overdue,
        "sales_id": sales_id,
        "sales_name": sales_name,
        "created_at": datetime.now(timezone.utc),
        "resolved": False,
        "resolved_at": None,
        "resolution": None,
    }
    result = await sla_alerts_collection.insert_one(alert)
    return str(result.inserted_id)


async def log_sla_action(action: str, booking_id: str, details: Dict[str, Any]):
    """Log SLA engine action for audit"""
    log_entry = {
        "action": action,
        "booking_id": booking_id,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
    }
    await sla_logs_collection.insert_one(log_entry)


# ===================== CORE SLA CHECK FUNCTIONS =====================

async def check_hot_lead_sla() -> SLACheckResult:
    """
    Main SLA check function - chạy mỗi phút
    Kiểm tra tất cả HOT lead bookings chưa được gọi
    """
    result = SLACheckResult()
    now = datetime.now(timezone.utc)
    
    warning_threshold = now - timedelta(minutes=SLA_CONFIG["warning_time_minutes"])
    violation_threshold = now - timedelta(minutes=SLA_CONFIG["hot_lead_call_time_minutes"])
    reassign_threshold = now - timedelta(minutes=SLA_CONFIG["reassign_time_minutes"])
    
    try:
        # Find bookings that need SLA check:
        # - Status is "pending" (not yet called)
        # - Has assigned sales
        # - Created more than warning_time ago
        pipeline = [
            {
                "$match": {
                    "status": "pending",
                    "assigned_to": {"$ne": None},
                    "created_at": {"$lt": warning_threshold},
                    "call_status": {"$nin": ["called", "success"]},  # Not yet called
                }
            },
            {
                "$lookup": {
                    "from": "website_leads",
                    "let": {"lead_id": "$lead_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": [{"$toString": "$_id"}, "$$lead_id"]
                                }
                            }
                        }
                    ],
                    "as": "lead"
                }
            },
            {"$unwind": {"path": "$lead", "preserveNullAndEmptyArrays": True}},
            {
                "$match": {
                    "$or": [
                        {"lead.score_label": "hot"},
                        {"lead.score": {"$gte": 60}},
                        {"lead": {"$exists": False}}  # Include bookings without lead link
                    ]
                }
            }
        ]
        
        bookings = await bookings_collection.aggregate(pipeline).to_list(100)
        result.total_checked = len(bookings)
        
        for booking in bookings:
            booking_id = str(booking["_id"])
            lead = booking.get("lead", {})
            lead_id = booking.get("lead_id", "")
            sales_id = booking.get("assigned_to", "")
            sales_name = booking.get("assigned_name", "Unknown")
            customer_phone = booking.get("customer_phone", "N/A")
            created_at = booking.get("created_at")
            
            if not created_at:
                continue
            
            # Calculate minutes overdue
            minutes_passed = (now - created_at).total_seconds() / 60
            
            # Check existing alerts to avoid spam
            existing_alerts = await sla_alerts_collection.count_documents({
                "booking_id": booking_id,
                "resolved": False
            })
            
            if existing_alerts >= SLA_CONFIG["max_alerts_per_booking"]:
                continue
            
            try:
                # CASE 1: Need reassignment (> 10 minutes)
                if created_at < reassign_threshold:
                    await handle_reassignment(
                        booking_id=booking_id,
                        lead_id=lead_id,
                        old_sales_id=sales_id,
                        old_sales_name=sales_name,
                        customer_phone=customer_phone,
                        minutes_overdue=int(minutes_passed),
                        lead=lead
                    )
                    result.reassignments_made += 1
                    logger.info(f"[SLA] Reassigned booking {booking_id} after {int(minutes_passed)} minutes")
                
                # CASE 2: SLA Violation (> 5 minutes)
                elif created_at < violation_threshold:
                    await handle_sla_violation(
                        booking_id=booking_id,
                        lead_id=lead_id,
                        sales_id=sales_id,
                        sales_name=sales_name,
                        customer_phone=customer_phone,
                        minutes_overdue=int(minutes_passed)
                    )
                    result.violations_found += 1
                    logger.info(f"[SLA] Violation alert for booking {booking_id} - {int(minutes_passed)} minutes")
                
                # CASE 3: Warning (> 3 minutes)
                elif created_at < warning_threshold:
                    await handle_sla_warning(
                        booking_id=booking_id,
                        lead_id=lead_id,
                        sales_id=sales_id,
                        sales_name=sales_name,
                        customer_phone=customer_phone,
                        minutes_overdue=int(minutes_passed)
                    )
                    result.warnings_sent += 1
                    logger.info(f"[SLA] Warning sent for booking {booking_id} - {int(minutes_passed)} minutes")
            
            except Exception as e:
                error_msg = f"Error processing booking {booking_id}: {str(e)}"
                result.errors.append(error_msg)
                logger.error(f"[SLA] {error_msg}")
    
    except Exception as e:
        error_msg = f"SLA check error: {str(e)}"
        result.errors.append(error_msg)
        logger.error(f"[SLA] {error_msg}")
    
    # Log the check result
    await log_sla_action("sla_check_completed", "", {
        "total_checked": result.total_checked,
        "warnings_sent": result.warnings_sent,
        "violations_found": result.violations_found,
        "reassignments_made": result.reassignments_made,
        "errors": result.errors
    })
    
    return result


async def handle_sla_warning(booking_id: str, lead_id: str, sales_id: str, 
                            sales_name: str, customer_phone: str, minutes_overdue: int):
    """Handle SLA warning (3-5 minutes)"""
    
    # Create alert record
    await create_sla_alert(
        booking_id=booking_id,
        lead_id=lead_id,
        alert_type="warning",
        minutes_overdue=minutes_overdue,
        sales_id=sales_id,
        sales_name=sales_name
    )
    
    # Send notification
    await notify_sla_violation({
        "phone": customer_phone,
        "sales_name": sales_name,
        "minutes_overdue": minutes_overdue,
        "booking_id": booking_id,
        "action": f"⚠️ Còn {5 - minutes_overdue} phút trước khi vi phạm SLA!"
    })
    
    # Update booking
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "sla_warning_sent": True,
                "sla_warning_at": datetime.now(timezone.utc)
            }
        }
    )


async def handle_sla_violation(booking_id: str, lead_id: str, sales_id: str,
                              sales_name: str, customer_phone: str, minutes_overdue: int):
    """Handle SLA violation (5-10 minutes)"""
    
    # Create alert record
    await create_sla_alert(
        booking_id=booking_id,
        lead_id=lead_id,
        alert_type="violation",
        minutes_overdue=minutes_overdue,
        sales_id=sales_id,
        sales_name=sales_name
    )
    
    # Send notification
    await notify_sla_violation({
        "phone": customer_phone,
        "sales_name": sales_name,
        "minutes_overdue": minutes_overdue,
        "booking_id": booking_id,
        "action": f"🚨 VI PHẠM SLA! Sẽ auto-reassign sau {10 - minutes_overdue} phút nữa!"
    })
    
    # Update booking
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "sla_violated": True,
                "sla_violated_at": datetime.now(timezone.utc)
            }
        }
    )


async def handle_reassignment(booking_id: str, lead_id: str, old_sales_id: str,
                             old_sales_name: str, customer_phone: str, 
                             minutes_overdue: int, lead: dict):
    """Handle auto-reassignment (> 10 minutes)"""
    
    # Find alternative sales
    region = lead.get("location") if lead else None
    new_sales = await get_alternative_sales(old_sales_id, region)
    
    if not new_sales:
        # No alternative available - escalate to manager
        await notify_sla_violation({
            "phone": customer_phone,
            "sales_name": old_sales_name,
            "minutes_overdue": minutes_overdue,
            "booking_id": booking_id,
            "action": "🆘 ESCALATION: Không có sales khả dụng để reassign! Cần Manager xử lý!"
        })
        
        await create_sla_alert(
            booking_id=booking_id,
            lead_id=lead_id,
            alert_type="escalation",
            minutes_overdue=minutes_overdue,
            sales_id=old_sales_id,
            sales_name=old_sales_name
        )
        return
    
    new_sales_id = str(new_sales["_id"])
    new_sales_name = new_sales.get("name", "Unknown")
    
    # Update booking with new assignment
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "assigned_to": new_sales_id,
                "assigned_name": new_sales_name,
                "assigned_phone": new_sales.get("phone", ""),
                "reassigned_at": datetime.now(timezone.utc),
                "reassigned_from": old_sales_id,
                "reassign_reason": f"SLA violation - {minutes_overdue} minutes without call",
                "sla_reassigned": True
            }
        }
    )
    
    # Update sales workloads
    # Decrement old sales load
    if ObjectId.is_valid(old_sales_id):
        await sales_users_collection.update_one(
            {"_id": ObjectId(old_sales_id)},
            {"$inc": {"current_load": -1}}
        )
    
    # Increment new sales load
    await sales_users_collection.update_one(
        {"_id": new_sales["_id"]},
        {"$inc": {"current_load": 1}}
    )
    
    # Create alert record
    await create_sla_alert(
        booking_id=booking_id,
        lead_id=lead_id,
        alert_type="reassignment",
        minutes_overdue=minutes_overdue,
        sales_id=new_sales_id,
        sales_name=new_sales_name
    )
    
    # Send reassignment notification
    await notify_reassign({
        "booking_id": booking_id,
        "phone": customer_phone,
        "old_sales": old_sales_name,
        "new_sales": new_sales_name,
        "reason": f"SLA violation - {minutes_overdue} minutes without response"
    })
    
    # Log the action
    await log_sla_action("auto_reassignment", booking_id, {
        "old_sales_id": old_sales_id,
        "old_sales_name": old_sales_name,
        "new_sales_id": new_sales_id,
        "new_sales_name": new_sales_name,
        "minutes_overdue": minutes_overdue,
        "customer_phone": customer_phone
    })


# ===================== CALL TRACKING =====================

async def update_call_status(booking_id: str, status: str, note: str = None, 
                            callback_time: str = None, caller_id: str = None) -> dict:
    """
    Update call status for a booking - stops SLA timer
    
    Statuses:
    - called: Đã gọi (SLA timer stops)
    - no_answer: Không bắt máy (SLA timer continues)
    - success: Gọi thành công (SLA resolved)
    - callback_scheduled: Đã hẹn gọi lại
    """
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return {"success": False, "error": "Booking not found"}
    
    now = datetime.now(timezone.utc)
    
    update_data = {
        "call_status": status,
        "call_updated_at": now,
        "call_updated_by": caller_id,
    }
    
    if note:
        update_data["call_note"] = note
    
    if status in ["called", "success"]:
        update_data["first_call_at"] = now
        # Resolve any pending SLA alerts
        await sla_alerts_collection.update_many(
            {"booking_id": booking_id, "resolved": False},
            {
                "$set": {
                    "resolved": True,
                    "resolved_at": now,
                    "resolution": f"Call status: {status}"
                }
            }
        )
    
    if status == "success":
        update_data["status"] = "confirmed"
    
    if status == "callback_scheduled" and callback_time:
        update_data["callback_scheduled_at"] = callback_time
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Log the action
    await log_sla_action("call_status_update", booking_id, {
        "status": status,
        "note": note,
        "caller_id": caller_id
    })
    
    return {"success": True, "status": status}


# ===================== API ENDPOINTS =====================

@router.post("/check", response_model=SLACheckResult)
async def run_sla_check():
    """
    Manually trigger SLA check (also runs automatically every minute)
    """
    result = await check_hot_lead_sla()
    return result


@router.post("/bookings/{booking_id}/call-update")
async def api_update_call_status(booking_id: str, data: CallStatusUpdate):
    """
    Update call status for a booking
    Used by sales agents to mark that they've called the customer
    """
    result = await update_call_status(
        booking_id=booking_id,
        status=data.status,
        note=data.note,
        callback_time=data.callback_time
    )
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result.get("error", "Update failed"))
    
    return result


@router.get("/alerts")
async def get_sla_alerts(
    resolved: bool = False,
    alert_type: Optional[str] = None,
    limit: int = 50
):
    """Get SLA alerts"""
    query = {"resolved": resolved}
    if alert_type:
        query["alert_type"] = alert_type
    
    alerts = []
    async for alert in sla_alerts_collection.find(query).sort("created_at", -1).limit(limit):
        alerts.append({
            "id": str(alert["_id"]),
            "booking_id": alert.get("booking_id"),
            "lead_id": alert.get("lead_id"),
            "alert_type": alert.get("alert_type"),
            "minutes_overdue": alert.get("minutes_overdue"),
            "sales_name": alert.get("sales_name"),
            "created_at": alert["created_at"].isoformat() if alert.get("created_at") else None,
            "resolved": alert.get("resolved", False),
            "resolved_at": alert["resolved_at"].isoformat() if alert.get("resolved_at") else None,
            "resolution": alert.get("resolution"),
        })
    
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/stats")
async def get_sla_stats():
    """Get SLA statistics"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's stats
    total_alerts_today = await sla_alerts_collection.count_documents({
        "created_at": {"$gte": today_start}
    })
    
    violations_today = await sla_alerts_collection.count_documents({
        "created_at": {"$gte": today_start},
        "alert_type": "violation"
    })
    
    reassignments_today = await sla_alerts_collection.count_documents({
        "created_at": {"$gte": today_start},
        "alert_type": "reassignment"
    })
    
    # Pending bookings needing attention
    pending_hot = await bookings_collection.count_documents({
        "status": "pending",
        "call_status": {"$nin": ["called", "success"]}
    })
    
    # Average response time (for completed calls today)
    pipeline = [
        {
            "$match": {
                "first_call_at": {"$gte": today_start},
                "created_at": {"$exists": True}
            }
        },
        {
            "$project": {
                "response_time": {
                    "$divide": [
                        {"$subtract": ["$first_call_at", "$created_at"]},
                        60000  # Convert to minutes
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_response_time": {"$avg": "$response_time"},
                "min_response_time": {"$min": "$response_time"},
                "max_response_time": {"$max": "$response_time"},
                "count": {"$sum": 1}
            }
        }
    ]
    
    response_stats = await bookings_collection.aggregate(pipeline).to_list(1)
    
    avg_response = response_stats[0] if response_stats else {
        "avg_response_time": 0,
        "min_response_time": 0,
        "max_response_time": 0,
        "count": 0
    }
    
    return {
        "today": {
            "total_alerts": total_alerts_today,
            "violations": violations_today,
            "reassignments": reassignments_today,
            "pending_hot_leads": pending_hot,
        },
        "response_times": {
            "average_minutes": round(avg_response.get("avg_response_time", 0), 2),
            "min_minutes": round(avg_response.get("min_response_time", 0), 2),
            "max_minutes": round(avg_response.get("max_response_time", 0), 2),
            "calls_measured": avg_response.get("count", 0)
        },
        "sla_config": SLA_CONFIG
    }


@router.get("/logs")
async def get_sla_logs(limit: int = 100):
    """Get SLA engine action logs"""
    logs = []
    async for log in sla_logs_collection.find().sort("timestamp", -1).limit(limit):
        logs.append({
            "id": str(log["_id"]),
            "action": log.get("action"),
            "booking_id": log.get("booking_id"),
            "details": log.get("details"),
            "timestamp": log["timestamp"].isoformat() if log.get("timestamp") else None
        })
    
    return {"logs": logs}


# ===================== BACKGROUND TASK =====================

async def sla_check_loop():
    """
    Background loop that runs SLA check every minute
    Should be started when the application starts
    """
    logger.info("[SLA ENGINE] Starting SLA check loop...")
    
    while True:
        try:
            result = await check_hot_lead_sla()
            logger.info(f"[SLA CHECK] Checked: {result.total_checked}, "
                       f"Warnings: {result.warnings_sent}, "
                       f"Violations: {result.violations_found}, "
                       f"Reassignments: {result.reassignments_made}")
        except Exception as e:
            logger.error(f"[SLA ENGINE] Error in check loop: {e}")
        
        await asyncio.sleep(SLA_CONFIG["check_interval_seconds"])


def start_sla_engine():
    """Start the SLA engine background task"""
    loop = asyncio.get_event_loop()
    loop.create_task(sla_check_loop())
    logger.info("[SLA ENGINE] Background task started")
