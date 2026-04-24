"""
Scheduled Event Checks - Phase 2 Integration
Prompt 19.5 - Automation Engine

This module runs periodic checks to emit events for:
- Lead SLA breach (no contact within 24h)
- Deal stale detection (no activity in 7 days)
- Booking expiring (24h before expiry)
- Booking expired

ALL scheduled events have metadata.source = "system_scheduler"
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

from .event_emitter import (
    emit_event,
    create_scheduled_event,
    BusinessEvent,
    EventActor,
    EventEntity,
    EventMetadata,
    EventTypes,
    EventThresholds
)

logger = logging.getLogger(__name__)


class ScheduledEventChecker:
    """
    Runs scheduled checks and emits events.
    
    Usage:
        checker = ScheduledEventChecker(db)
        results = await checker.run_all_checks()
    """
    
    def __init__(self, db):
        self.db = db
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all scheduled checks and return summary."""
        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {}
        }
        
        # Lead SLA breach check
        lead_result = await self.check_lead_sla_breach()
        results["checks"]["lead_sla_breach"] = lead_result
        
        # Deal stale check
        deal_result = await self.check_deal_stale()
        results["checks"]["deal_stale_detected"] = deal_result
        
        # Booking expiring check
        booking_expiring_result = await self.check_booking_expiring()
        results["checks"]["booking_expiring"] = booking_expiring_result
        
        # Booking expired check
        booking_expired_result = await self.check_booking_expired()
        results["checks"]["booking_expired"] = booking_expired_result
        
        total_events = sum(r.get("events_emitted", 0) for r in results["checks"].values())
        results["total_events_emitted"] = total_events
        
        logger.info(f"Scheduled checks complete: {total_events} events emitted")
        
        return results
    
    # ==================== LEAD CHECKS ====================
    
    async def check_lead_sla_breach(self) -> Dict[str, Any]:
        """
        Check for leads that haven't been contacted within SLA.
        
        Criteria:
        - Lead status is NEW or CONTACTED
        - No activity logged in last 24 hours
        - Lead has been assigned
        
        Emits: lead_sla_breach
        """
        sla_threshold = datetime.now(timezone.utc) - timedelta(hours=EventThresholds.LEAD_SLA_HOURS)
        
        # Find leads exceeding SLA
        query = {
            "status": {"$in": ["new", "contacted", "NEW", "CONTACTED"]},
            "assigned_to": {"$ne": None},
            "$or": [
                {"last_activity": {"$lt": sla_threshold.isoformat()}},
                {"last_activity": None}
            ],
            "created_at": {"$lt": sla_threshold.isoformat()}
        }
        
        leads = await self.db.leads.find(query, {"_id": 0}).to_list(500)
        
        events_emitted = 0
        errors = []
        
        for lead in leads:
            try:
                # Check if we already emitted this event today (dedup by idempotency key)
                today_key = datetime.now().strftime('%Y%m%d')
                idempotency_key = f"lead_sla_breach_{lead['id']}_{today_key}"
                
                # Check recent events with same idempotency key
                existing = await self.db.automation_events.find_one({
                    "idempotency_key": idempotency_key
                })
                
                if existing:
                    continue  # Already emitted today
                
                # Create and emit event
                event = BusinessEvent(
                    event_type=EventTypes.LEAD_SLA_BREACH,
                    actor=EventActor(actor_type="scheduler"),
                    entity=EventEntity(
                        type="leads",
                        id=lead["id"],
                        snapshot={
                            "full_name": lead.get("full_name"),
                            "assigned_to": lead.get("assigned_to"),
                            "status": lead.get("status"),
                            "created_at": lead.get("created_at")
                        }
                    ),
                    payload={
                        "sla_hours": EventThresholds.LEAD_SLA_HOURS,
                        "hours_since_activity": self._hours_since(lead.get("last_activity")),
                        "hours_since_created": self._hours_since(lead.get("created_at")),
                        "assigned_to": lead.get("assigned_to"),
                        "lead_value": lead.get("budget_max", 0)
                    },
                    metadata=EventMetadata(
                        idempotency_key=idempotency_key,
                        source="system_scheduler"
                    )
                )
                
                result = await emit_event(event)
                if result.get("success") or result.get("status"):
                    events_emitted += 1
                    
            except Exception as e:
                errors.append(f"Lead {lead.get('id')}: {str(e)}")
        
        return {
            "leads_checked": len(leads),
            "events_emitted": events_emitted,
            "errors": errors[:10]  # Limit errors
        }
    
    # ==================== DEAL CHECKS ====================
    
    async def check_deal_stale(self) -> Dict[str, Any]:
        """
        Check for deals with no activity in configured days.
        
        Criteria:
        - Deal status is active (not won/lost)
        - No activity in last 7 days
        
        Emits: deal_stale_detected
        """
        stale_threshold = datetime.now(timezone.utc) - timedelta(days=EventThresholds.DEAL_STALE_DAYS)
        
        query = {
            "status": {"$nin": ["won", "lost", "WON", "LOST", "cancelled"]},
            "$or": [
                {"updated_at": {"$lt": stale_threshold.isoformat()}},
                {"updated_at": None}
            ]
        }
        
        deals = await self.db.deals.find(query, {"_id": 0}).to_list(500)
        
        events_emitted = 0
        errors = []
        
        for deal in deals:
            try:
                today_key = datetime.now().strftime('%Y%m%d')
                idempotency_key = f"deal_stale_detected_{deal['id']}_{today_key}"
                
                existing = await self.db.automation_events.find_one({
                    "idempotency_key": idempotency_key
                })
                
                if existing:
                    continue
                
                event = BusinessEvent(
                    event_type=EventTypes.DEAL_STALE_DETECTED,
                    actor=EventActor(actor_type="scheduler"),
                    entity=EventEntity(
                        type="deals",
                        id=deal["id"],
                        snapshot={
                            "customer_name": deal.get("customer_name"),
                            "deal_value": deal.get("deal_value"),
                            "status": deal.get("status"),
                            "assigned_to": deal.get("assigned_to")
                        }
                    ),
                    payload={
                        "stale_days": EventThresholds.DEAL_STALE_DAYS,
                        "days_since_activity": self._days_since(deal.get("updated_at")),
                        "deal_value": deal.get("deal_value", 0),
                        "assigned_to": deal.get("assigned_to"),
                        "stage": deal.get("status")
                    },
                    metadata=EventMetadata(
                        idempotency_key=idempotency_key,
                        source="system_scheduler"
                    )
                )
                
                result = await emit_event(event)
                if result.get("success") or result.get("status"):
                    events_emitted += 1
                    
            except Exception as e:
                errors.append(f"Deal {deal.get('id')}: {str(e)}")
        
        return {
            "deals_checked": len(deals),
            "events_emitted": events_emitted,
            "errors": errors[:10]
        }
    
    # ==================== BOOKING CHECKS ====================
    
    async def check_booking_expiring(self) -> Dict[str, Any]:
        """
        Check for bookings expiring within configured hours.
        
        Criteria:
        - Booking status is active (not cancelled, expired)
        - Expiry date within next 24 hours
        
        Emits: booking_expiring
        """
        now = datetime.now(timezone.utc)
        expiring_threshold = now + timedelta(hours=EventThresholds.BOOKING_EXPIRING_HOURS)
        
        # Check both soft_bookings and hard_bookings
        events_emitted = 0
        errors = []
        total_checked = 0
        
        # Soft bookings
        soft_query = {
            "status": {"$nin": ["cancelled", "expired", "completed"]},
            "expiry_date": {
                "$gte": now.isoformat(),
                "$lte": expiring_threshold.isoformat()
            }
        }
        
        soft_bookings = await self.db.soft_bookings.find(soft_query, {"_id": 0}).to_list(200)
        total_checked += len(soft_bookings)
        
        for booking in soft_bookings:
            try:
                today_key = datetime.now().strftime('%Y%m%d%H')
                idempotency_key = f"booking_expiring_{booking['id']}_{today_key}"
                
                existing = await self.db.automation_events.find_one({
                    "idempotency_key": idempotency_key
                })
                
                if existing:
                    continue
                
                event = BusinessEvent(
                    event_type=EventTypes.BOOKING_EXPIRING,
                    actor=EventActor(actor_type="scheduler"),
                    entity=EventEntity(
                        type="bookings",
                        id=booking["id"],
                        snapshot={
                            "code": booking.get("code"),
                            "deal_id": booking.get("deal_id"),
                            "booking_type": "soft"
                        }
                    ),
                    payload={
                        "booking_type": "soft",
                        "hours_until_expiry": self._hours_until(booking.get("expiry_date")),
                        "expiry_date": booking.get("expiry_date"),
                        "deal_id": booking.get("deal_id"),
                        "contact_id": booking.get("contact_id"),
                        "project_id": booking.get("project_id")
                    },
                    metadata=EventMetadata(
                        idempotency_key=idempotency_key,
                        source="system_scheduler"
                    )
                )
                
                result = await emit_event(event)
                if result.get("success") or result.get("status"):
                    events_emitted += 1
                    
            except Exception as e:
                errors.append(f"Soft booking {booking.get('id')}: {str(e)}")
        
        # Hard bookings
        hard_query = {
            "status": {"$nin": ["cancelled", "expired", "completed"]},
            "expiry_date": {
                "$gte": now.isoformat(),
                "$lte": expiring_threshold.isoformat()
            }
        }
        
        hard_bookings = await self.db.hard_bookings.find(hard_query, {"_id": 0}).to_list(200)
        total_checked += len(hard_bookings)
        
        for booking in hard_bookings:
            try:
                today_key = datetime.now().strftime('%Y%m%d%H')
                idempotency_key = f"booking_expiring_{booking['id']}_{today_key}"
                
                existing = await self.db.automation_events.find_one({
                    "idempotency_key": idempotency_key
                })
                
                if existing:
                    continue
                
                event = BusinessEvent(
                    event_type=EventTypes.BOOKING_EXPIRING,
                    actor=EventActor(actor_type="scheduler"),
                    entity=EventEntity(
                        type="bookings",
                        id=booking["id"],
                        snapshot={
                            "code": booking.get("code"),
                            "deal_id": booking.get("deal_id"),
                            "booking_type": "hard"
                        }
                    ),
                    payload={
                        "booking_type": "hard",
                        "hours_until_expiry": self._hours_until(booking.get("expiry_date")),
                        "expiry_date": booking.get("expiry_date"),
                        "deal_id": booking.get("deal_id"),
                        "product_id": booking.get("product_id")
                    },
                    metadata=EventMetadata(
                        idempotency_key=idempotency_key,
                        source="system_scheduler"
                    )
                )
                
                result = await emit_event(event)
                if result.get("success") or result.get("status"):
                    events_emitted += 1
                    
            except Exception as e:
                errors.append(f"Hard booking {booking.get('id')}: {str(e)}")
        
        return {
            "bookings_checked": total_checked,
            "events_emitted": events_emitted,
            "errors": errors[:10]
        }
    
    async def check_booking_expired(self) -> Dict[str, Any]:
        """
        Check for bookings that have expired.
        
        Criteria:
        - Booking status is NOT expired/cancelled
        - Expiry date has passed
        
        Emits: booking_expired
        """
        now = datetime.now(timezone.utc)
        
        events_emitted = 0
        errors = []
        total_checked = 0
        
        # Soft bookings
        soft_query = {
            "status": {"$nin": ["cancelled", "expired", "completed"]},
            "expiry_date": {"$lt": now.isoformat()}
        }
        
        soft_bookings = await self.db.soft_bookings.find(soft_query, {"_id": 0}).to_list(200)
        total_checked += len(soft_bookings)
        
        for booking in soft_bookings:
            try:
                today_key = datetime.now().strftime('%Y%m%d')
                idempotency_key = f"booking_expired_{booking['id']}_{today_key}"
                
                existing = await self.db.automation_events.find_one({
                    "idempotency_key": idempotency_key
                })
                
                if existing:
                    continue
                
                event = BusinessEvent(
                    event_type=EventTypes.BOOKING_EXPIRED,
                    actor=EventActor(actor_type="scheduler"),
                    entity=EventEntity(
                        type="bookings",
                        id=booking["id"],
                        snapshot={
                            "code": booking.get("code"),
                            "deal_id": booking.get("deal_id"),
                            "booking_type": "soft"
                        }
                    ),
                    payload={
                        "booking_type": "soft",
                        "hours_since_expiry": abs(self._hours_until(booking.get("expiry_date"))),
                        "expiry_date": booking.get("expiry_date"),
                        "deal_id": booking.get("deal_id"),
                        "contact_id": booking.get("contact_id")
                    },
                    metadata=EventMetadata(
                        idempotency_key=idempotency_key,
                        source="system_scheduler"
                    )
                )
                
                result = await emit_event(event)
                if result.get("success") or result.get("status"):
                    events_emitted += 1
                    
                # Update booking status to expired
                await self.db.soft_bookings.update_one(
                    {"id": booking["id"]},
                    {"$set": {"status": "expired", "updated_at": now.isoformat()}}
                )
                    
            except Exception as e:
                errors.append(f"Soft booking {booking.get('id')}: {str(e)}")
        
        # Hard bookings
        hard_query = {
            "status": {"$nin": ["cancelled", "expired", "completed"]},
            "expiry_date": {"$lt": now.isoformat()}
        }
        
        hard_bookings = await self.db.hard_bookings.find(hard_query, {"_id": 0}).to_list(200)
        total_checked += len(hard_bookings)
        
        for booking in hard_bookings:
            try:
                today_key = datetime.now().strftime('%Y%m%d')
                idempotency_key = f"booking_expired_{booking['id']}_{today_key}"
                
                existing = await self.db.automation_events.find_one({
                    "idempotency_key": idempotency_key
                })
                
                if existing:
                    continue
                
                event = BusinessEvent(
                    event_type=EventTypes.BOOKING_EXPIRED,
                    actor=EventActor(actor_type="scheduler"),
                    entity=EventEntity(
                        type="bookings",
                        id=booking["id"],
                        snapshot={
                            "code": booking.get("code"),
                            "deal_id": booking.get("deal_id"),
                            "booking_type": "hard"
                        }
                    ),
                    payload={
                        "booking_type": "hard",
                        "hours_since_expiry": abs(self._hours_until(booking.get("expiry_date"))),
                        "expiry_date": booking.get("expiry_date"),
                        "deal_id": booking.get("deal_id"),
                        "product_id": booking.get("product_id")
                    },
                    metadata=EventMetadata(
                        idempotency_key=idempotency_key,
                        source="system_scheduler"
                    )
                )
                
                result = await emit_event(event)
                if result.get("success") or result.get("status"):
                    events_emitted += 1
                
                # Update booking status to expired
                await self.db.hard_bookings.update_one(
                    {"id": booking["id"]},
                    {"$set": {"status": "expired", "updated_at": now.isoformat()}}
                )
                    
            except Exception as e:
                errors.append(f"Hard booking {booking.get('id')}: {str(e)}")
        
        return {
            "bookings_checked": total_checked,
            "events_emitted": events_emitted,
            "errors": errors[:10]
        }
    
    # ==================== HELPER METHODS ====================
    
    def _hours_since(self, timestamp_str: Optional[str]) -> float:
        """Calculate hours since a timestamp."""
        if not timestamp_str:
            return 9999
        try:
            ts = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            delta = datetime.now(timezone.utc) - ts
            return round(delta.total_seconds() / 3600, 1)
        except:
            return 9999
    
    def _days_since(self, timestamp_str: Optional[str]) -> float:
        """Calculate days since a timestamp."""
        return round(self._hours_since(timestamp_str) / 24, 1)
    
    def _hours_until(self, timestamp_str: Optional[str]) -> float:
        """Calculate hours until a timestamp."""
        if not timestamp_str:
            return -9999
        try:
            ts = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            delta = ts - datetime.now(timezone.utc)
            return round(delta.total_seconds() / 3600, 1)
        except:
            return -9999


# ==================== RUN SCHEDULED CHECKS ====================

async def run_scheduled_checks(db) -> Dict[str, Any]:
    """
    Main entry point to run all scheduled checks.
    
    Called by:
    - Cron job
    - Manual trigger via API
    """
    checker = ScheduledEventChecker(db)
    return await checker.run_all_checks()
