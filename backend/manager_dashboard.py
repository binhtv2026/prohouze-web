"""
MANAGER DASHBOARD API - PROHOUZING SALES CONTROL SYSTEM
========================================================
Real-time monitoring dashboard for sales managers

Features:
- HOT leads monitoring
- Bookings overview
- SLA violations tracking
- Sales team performance
- Real-time metrics

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os

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
bookings_collection = db['bookings']
leads_collection = db['website_leads']
sales_users_collection = db['sales_users']
sla_alerts_collection = db['sla_alerts']
deals_collection = db['ai_deals']
notifications_collection = db['notifications']


# ===================== MODELS =====================

class ManagerDashboardResponse(BaseModel):
    hot_leads: Dict[str, Any]
    bookings: Dict[str, Any]
    sla_status: Dict[str, Any]
    sales_performance: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    updated_at: str


class SalesPerformance(BaseModel):
    id: str
    name: str
    phone: str
    region: str
    current_load: int
    max_load: int
    active: bool
    today_calls: int
    today_bookings: int
    sla_violations: int
    avg_response_time: float
    conversion_rate: float


# ===================== DASHBOARD ENDPOINTS =====================

@router.get("/overview", response_model=ManagerDashboardResponse)
async def get_manager_dashboard():
    """
    Get complete manager dashboard data
    Real-time overview of all sales operations
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # ==================== HOT LEADS ====================
    hot_leads_total = await leads_collection.count_documents({
        "$or": [
            {"score_label": "hot"},
            {"score": {"$gte": 60}}
        ]
    })
    
    hot_leads_today = await leads_collection.count_documents({
        "$or": [
            {"score_label": "hot"},
            {"score": {"$gte": 60}}
        ],
        "created_at": {"$gte": today_start}
    })
    
    # HOT leads without calls (urgent)
    hot_leads_uncalled = await bookings_collection.count_documents({
        "status": "pending",
        "call_status": {"$nin": ["called", "success"]}
    })
    
    # Get list of urgent HOT leads
    urgent_leads = []
    pipeline = [
        {
            "$match": {
                "status": "pending",
                "call_status": {"$nin": ["called", "success"]},
                "created_at": {"$gte": now - timedelta(hours=24)}
            }
        },
        {"$sort": {"created_at": 1}},
        {"$limit": 10}
    ]
    async for booking in bookings_collection.aggregate(pipeline):
        created_at = booking.get("created_at")
        if created_at:
            # Ensure timezone-aware comparison
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            minutes_waiting = (now - created_at).total_seconds() / 60
        else:
            minutes_waiting = 0
        
        urgent_leads.append({
            "booking_id": str(booking["_id"]),
            "customer_name": booking.get("customer_name", "N/A"),
            "customer_phone": booking.get("customer_phone", "N/A"),
            "project_name": booking.get("project_name", "N/A"),
            "assigned_to": booking.get("assigned_name", "Unassigned"),
            "minutes_waiting": round(minutes_waiting, 1),
            "sla_status": "critical" if minutes_waiting > 5 else "warning" if minutes_waiting > 3 else "ok",
            "created_at": created_at.isoformat() if created_at else None
        })
    
    hot_leads_data = {
        "total": hot_leads_total,
        "today": hot_leads_today,
        "uncalled": hot_leads_uncalled,
        "urgent_list": urgent_leads
    }
    
    # ==================== BOOKINGS ====================
    total_bookings = await bookings_collection.count_documents({})
    pending_bookings = await bookings_collection.count_documents({"status": "pending"})
    confirmed_bookings = await bookings_collection.count_documents({"status": "confirmed"})
    completed_bookings = await bookings_collection.count_documents({"status": "completed"})
    
    today_bookings = await bookings_collection.count_documents({
        "created_at": {"$gte": today_start}
    })
    
    # Bookings by time slot today
    slot_pipeline = [
        {
            "$match": {
                "scheduled_at": {
                    "$gte": today_start,
                    "$lt": today_start + timedelta(days=1)
                }
            }
        },
        {
            "$group": {
                "_id": "$time_slot",
                "count": {"$sum": 1}
            }
        }
    ]
    by_slot = {"09:00": 0, "14:00": 0, "19:00": 0}
    async for doc in bookings_collection.aggregate(slot_pipeline):
        slot = doc["_id"]
        if slot in by_slot:
            by_slot[slot] = doc["count"]
    
    bookings_data = {
        "total": total_bookings,
        "pending": pending_bookings,
        "confirmed": confirmed_bookings,
        "completed": completed_bookings,
        "today": today_bookings,
        "by_time_slot": by_slot
    }
    
    # ==================== SLA STATUS ====================
    sla_violations_today = await sla_alerts_collection.count_documents({
        "created_at": {"$gte": today_start},
        "alert_type": "violation"
    })
    
    sla_warnings_today = await sla_alerts_collection.count_documents({
        "created_at": {"$gte": today_start},
        "alert_type": "warning"
    })
    
    reassignments_today = await sla_alerts_collection.count_documents({
        "created_at": {"$gte": today_start},
        "alert_type": "reassignment"
    })
    
    unresolved_alerts = await sla_alerts_collection.count_documents({
        "resolved": False
    })
    
    # Average response time today
    response_pipeline = [
        {
            "$match": {
                "first_call_at": {"$gte": today_start}
            }
        },
        {
            "$project": {
                "response_time": {
                    "$divide": [
                        {"$subtract": ["$first_call_at", "$created_at"]},
                        60000
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "avg": {"$avg": "$response_time"},
                "count": {"$sum": 1}
            }
        }
    ]
    response_stats = await bookings_collection.aggregate(response_pipeline).to_list(1)
    avg_response_time = response_stats[0]["avg"] if response_stats else 0
    
    sla_status = {
        "violations_today": sla_violations_today,
        "warnings_today": sla_warnings_today,
        "reassignments_today": reassignments_today,
        "unresolved_alerts": unresolved_alerts,
        "avg_response_time_minutes": round(avg_response_time, 2),
        "sla_target_minutes": 5
    }
    
    # ==================== SALES PERFORMANCE ====================
    sales_performance = []
    async for sales in sales_users_collection.find({"active": True}).sort("current_load", -1):
        sales_id = str(sales["_id"])
        
        # Today's metrics for this sales person
        today_calls = await bookings_collection.count_documents({
            "assigned_to": sales_id,
            "call_status": {"$in": ["called", "success"]},
            "call_updated_at": {"$gte": today_start}
        })
        
        today_bookings = await bookings_collection.count_documents({
            "assigned_to": sales_id,
            "created_at": {"$gte": today_start}
        })
        
        sla_violations = await sla_alerts_collection.count_documents({
            "sales_id": sales_id,
            "alert_type": "violation",
            "created_at": {"$gte": today_start}
        })
        
        # Conversion rate (completed / total assigned)
        total_assigned = await bookings_collection.count_documents({
            "assigned_to": sales_id
        })
        total_completed = await bookings_collection.count_documents({
            "assigned_to": sales_id,
            "status": {"$in": ["completed", "closed"]}
        })
        conversion_rate = (total_completed / total_assigned * 100) if total_assigned > 0 else 0
        
        sales_performance.append({
            "id": sales_id,
            "name": sales.get("name", "Unknown"),
            "phone": sales.get("phone", ""),
            "region": sales.get("region", ""),
            "current_load": sales.get("current_load", 0),
            "max_load": sales.get("max_load", 10),
            "today_calls": today_calls,
            "today_bookings": today_bookings,
            "sla_violations": sla_violations,
            "conversion_rate": round(conversion_rate, 1),
            "status": "overloaded" if sales.get("current_load", 0) >= sales.get("max_load", 10) else "active"
        })
    
    # ==================== RECENT ALERTS ====================
    recent_alerts = []
    async for alert in sla_alerts_collection.find().sort("created_at", -1).limit(10):
        recent_alerts.append({
            "id": str(alert["_id"]),
            "type": alert.get("alert_type"),
            "booking_id": alert.get("booking_id"),
            "sales_name": alert.get("sales_name"),
            "minutes_overdue": alert.get("minutes_overdue"),
            "resolved": alert.get("resolved", False),
            "created_at": alert["created_at"].isoformat() if alert.get("created_at") else None
        })
    
    # ==================== KEY METRICS ====================
    # Lead to booking conversion
    total_leads = await leads_collection.count_documents({})
    
    # Deals created
    total_deals = await deals_collection.count_documents({})
    deals_today = await deals_collection.count_documents({
        "created_at": {"$gte": today_start}
    })
    
    metrics = {
        "total_leads": total_leads,
        "total_bookings": total_bookings,
        "total_deals": total_deals,
        "deals_today": deals_today,
        "lead_to_booking_rate": round((total_bookings / total_leads * 100) if total_leads > 0 else 0, 1),
        "sla_compliance_rate": round(((today_bookings - sla_violations_today) / today_bookings * 100) if today_bookings > 0 else 100, 1)
    }
    
    return ManagerDashboardResponse(
        hot_leads=hot_leads_data,
        bookings=bookings_data,
        sla_status=sla_status,
        sales_performance=sales_performance,
        recent_alerts=recent_alerts,
        metrics=metrics,
        updated_at=now.isoformat()
    )


@router.get("/hot-leads")
async def get_hot_leads_detail():
    """Get detailed list of all HOT leads needing attention"""
    now = datetime.now(timezone.utc)
    
    pipeline = [
        {
            "$match": {
                "status": "pending",
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
        {"$sort": {"created_at": 1}},
        {"$limit": 50}
    ]
    
    results = []
    async for booking in bookings_collection.aggregate(pipeline):
        lead = booking.get("lead", {})
        created_at = booking.get("created_at")
        # Ensure timezone-aware comparison
        if created_at:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            minutes_waiting = (now - created_at).total_seconds() / 60
        else:
            minutes_waiting = 0
        
        results.append({
            "booking_id": str(booking["_id"]),
            "lead_id": booking.get("lead_id"),
            "customer_name": booking.get("customer_name", lead.get("name", "N/A")),
            "customer_phone": booking.get("customer_phone", lead.get("phone", "N/A")),
            "project_name": booking.get("project_name", "N/A"),
            "booking_type": booking.get("booking_type"),
            "time_slot": booking.get("time_slot"),
            "status": booking.get("status"),
            "call_status": booking.get("call_status", "not_called"),
            "assigned_to": booking.get("assigned_name", "Unassigned"),
            "assigned_to_id": booking.get("assigned_to"),
            "lead_score": lead.get("score", 0),
            "lead_score_label": lead.get("score_label", "unknown"),
            "budget": lead.get("budget_range", "N/A"),
            "location": lead.get("location", "N/A"),
            "minutes_waiting": round(minutes_waiting, 1),
            "sla_status": "critical" if minutes_waiting > 5 else "warning" if minutes_waiting > 3 else "ok",
            "created_at": created_at.isoformat() if created_at else None
        })
    
    return {
        "total": len(results),
        "items": results
    }


@router.get("/sales/{sales_id}/performance")
async def get_sales_performance_detail(sales_id: str):
    """Get detailed performance metrics for a specific sales person"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get sales user
    sales = await sales_users_collection.find_one({"_id": ObjectId(sales_id)})
    if not sales:
        raise HTTPException(status_code=404, detail="Sales user not found")
    
    # Daily metrics for the past 7 days
    daily_metrics = []
    for i in range(7):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        bookings = await bookings_collection.count_documents({
            "assigned_to": sales_id,
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        
        calls = await bookings_collection.count_documents({
            "assigned_to": sales_id,
            "call_status": {"$in": ["called", "success"]},
            "call_updated_at": {"$gte": day_start, "$lt": day_end}
        })
        
        violations = await sla_alerts_collection.count_documents({
            "sales_id": sales_id,
            "alert_type": "violation",
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        
        daily_metrics.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "bookings": bookings,
            "calls": calls,
            "violations": violations
        })
    
    # Overall stats
    total_assigned = await bookings_collection.count_documents({"assigned_to": sales_id})
    total_completed = await bookings_collection.count_documents({
        "assigned_to": sales_id,
        "status": {"$in": ["completed", "closed"]}
    })
    total_violations = await sla_alerts_collection.count_documents({
        "sales_id": sales_id,
        "alert_type": "violation"
    })
    
    return {
        "sales_info": {
            "id": sales_id,
            "name": sales.get("name"),
            "phone": sales.get("phone"),
            "region": sales.get("region"),
            "current_load": sales.get("current_load", 0),
            "max_load": sales.get("max_load", 10),
            "active": sales.get("active", True)
        },
        "overall": {
            "total_assigned": total_assigned,
            "total_completed": total_completed,
            "total_violations": total_violations,
            "conversion_rate": round((total_completed / total_assigned * 100) if total_assigned > 0 else 0, 1)
        },
        "daily_metrics": daily_metrics
    }


@router.get("/sla-violations")
async def get_sla_violations_detail(
    resolved: Optional[bool] = None,
    limit: int = 50
):
    """Get detailed SLA violations list"""
    query = {}
    if resolved is not None:
        query["resolved"] = resolved
    
    violations = []
    async for alert in sla_alerts_collection.find(query).sort("created_at", -1).limit(limit):
        # Get booking details
        booking = None
        if alert.get("booking_id"):
            booking = await bookings_collection.find_one({"_id": ObjectId(alert["booking_id"])})
        
        violations.append({
            "id": str(alert["_id"]),
            "alert_type": alert.get("alert_type"),
            "booking_id": alert.get("booking_id"),
            "customer_phone": booking.get("customer_phone") if booking else "N/A",
            "customer_name": booking.get("customer_name") if booking else "N/A",
            "sales_id": alert.get("sales_id"),
            "sales_name": alert.get("sales_name"),
            "minutes_overdue": alert.get("minutes_overdue"),
            "resolved": alert.get("resolved", False),
            "resolved_at": alert["resolved_at"].isoformat() if alert.get("resolved_at") else None,
            "resolution": alert.get("resolution"),
            "created_at": alert["created_at"].isoformat() if alert.get("created_at") else None
        })
    
    return {
        "total": len(violations),
        "items": violations
    }


@router.post("/alerts/{alert_id}/resolve")
async def resolve_sla_alert(alert_id: str, resolution: str = "Manually resolved"):
    """Manually resolve an SLA alert"""
    result = await sla_alerts_collection.update_one(
        {"_id": ObjectId(alert_id)},
        {
            "$set": {
                "resolved": True,
                "resolved_at": datetime.now(timezone.utc),
                "resolution": resolution
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert resolved"}


@router.post("/bookings/{booking_id}/reassign")
async def manual_reassign_booking(booking_id: str, new_sales_id: str):
    """Manually reassign a booking to a different sales person"""
    now = datetime.now(timezone.utc)
    
    # Get booking
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get new sales
    new_sales = await sales_users_collection.find_one({"_id": ObjectId(new_sales_id)})
    if not new_sales:
        raise HTTPException(status_code=404, detail="Sales user not found")
    
    old_sales_id = booking.get("assigned_to")
    old_sales_name = booking.get("assigned_name", "Unknown")
    
    # Update booking
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {
            "$set": {
                "assigned_to": new_sales_id,
                "assigned_name": new_sales.get("name"),
                "assigned_phone": new_sales.get("phone"),
                "reassigned_at": now,
                "reassigned_from": old_sales_id,
                "reassign_reason": "Manual reassignment by manager"
            }
        }
    )
    
    # Update workloads
    if old_sales_id and ObjectId.is_valid(old_sales_id):
        await sales_users_collection.update_one(
            {"_id": ObjectId(old_sales_id)},
            {"$inc": {"current_load": -1}}
        )
    
    await sales_users_collection.update_one(
        {"_id": ObjectId(new_sales_id)},
        {"$inc": {"current_load": 1}}
    )
    
    return {
        "success": True,
        "message": f"Booking reassigned from {old_sales_name} to {new_sales.get('name')}"
    }
