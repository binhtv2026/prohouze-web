"""
Email Tracking Engine - Open/click tracking
"""

import os
import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
import urllib.parse

logger = logging.getLogger(__name__)


class EmailTrackingEngine:
    """
    Tracking Engine - Track email opens and clicks
    Features:
    - Open tracking via pixel
    - Click tracking via redirect
    - Unsubscribe handling
    - Analytics aggregation
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.backend_url = os.environ.get("BACKEND_URL", "https://api.prohouzing.com")
    
    def generate_tracking_pixel(self, tracking_id: str) -> str:
        """Generate tracking pixel URL"""
        return f"{self.backend_url}/api/email/track/open/{tracking_id}"
    
    def generate_tracking_link(self, tracking_id: str, original_url: str) -> str:
        """Generate tracking redirect URL"""
        encoded_url = urllib.parse.quote(original_url, safe='')
        return f"{self.backend_url}/api/email/track/click/{tracking_id}?url={encoded_url}"
    
    def generate_unsubscribe_link(self, email: str, token: str) -> str:
        """Generate unsubscribe URL"""
        encoded_email = urllib.parse.quote(email, safe='')
        return f"{self.backend_url}/api/email/unsubscribe?email={encoded_email}&token={token}"
    
    def inject_tracking(self, html_content: str, tracking_id: str, email: str, unsubscribe_token: str) -> str:
        """
        Inject tracking pixel and convert links to tracking links
        """
        # Add tracking pixel before </body>
        pixel_url = self.generate_tracking_pixel(tracking_id)
        tracking_pixel = f'<img src="{pixel_url}" width="1" height="1" style="display:none" alt="" />'
        
        if '</body>' in html_content:
            html_content = html_content.replace('</body>', f'{tracking_pixel}</body>')
        else:
            html_content += tracking_pixel
        
        # Convert links to tracking links
        import re
        
        def replace_link(match):
            href = match.group(1)
            # Skip mailto, tel, and unsubscribe links
            if href.startswith(('mailto:', 'tel:', '#')) or 'unsubscribe' in href.lower():
                return match.group(0)
            tracking_url = self.generate_tracking_link(tracking_id, href)
            return f'href="{tracking_url}"'
        
        html_content = re.sub(r'href="([^"]+)"', replace_link, html_content)
        
        # Add unsubscribe footer
        unsubscribe_url = self.generate_unsubscribe_link(email, unsubscribe_token)
        footer = f'''
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Email này được gửi từ ProHouzing</p>
    <p><a href="{unsubscribe_url}" style="color: #3b82f6;">Hủy đăng ký nhận email</a></p>
</div>
'''
        
        if '</body>' in html_content:
            html_content = html_content.replace('</body>', f'{footer}</body>')
        else:
            html_content += footer
        
        return html_content
    
    async def track_open(self, tracking_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Dict[str, Any]:
        """Record email open"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Find log by tracking_id
        log = await self.db.email_logs.find_one({"tracking_id": tracking_id}, {"_id": 0})
        if not log:
            logger.warning(f"[TRACKING] Unknown tracking_id: {tracking_id}")
            return {"success": False, "error": "Unknown tracking ID"}
        
        # Update open stats
        update = {
            "$inc": {"open_count": 1},
            "$set": {"updated_at": now}
        }
        
        # Set opened_at only on first open
        if not log.get("opened_at"):
            update["$set"]["opened_at"] = now
        
        await self.db.email_logs.update_one({"tracking_id": tracking_id}, update)
        
        # Log open event
        open_event = {
            "tracking_id": tracking_id,
            "log_id": log.get("id"),
            "email": log.get("email"),
            "event_type": "open",
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": now
        }
        await self.db.email_tracking_events.insert_one(open_event)
        
        # Update subscriber stats
        await self.db.email_subscribers.update_one(
            {"email": log.get("email")},
            {"$inc": {"total_emails_opened": 1}}
        )
        
        logger.info(f"[TRACKING] Open recorded: {tracking_id}")
        
        return {"success": True, "tracking_id": tracking_id}
    
    async def track_click(
        self,
        tracking_id: str,
        clicked_url: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Record email link click"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Find log
        log = await self.db.email_logs.find_one({"tracking_id": tracking_id}, {"_id": 0})
        if not log:
            logger.warning(f"[TRACKING] Unknown tracking_id for click: {tracking_id}")
            return {"success": False, "error": "Unknown tracking ID", "redirect_url": clicked_url}
        
        # Update click stats
        update = {
            "$inc": {"click_count": 1},
            "$addToSet": {"clicked_links": clicked_url},
            "$set": {"updated_at": now}
        }
        
        if not log.get("clicked_at"):
            update["$set"]["clicked_at"] = now
        
        await self.db.email_logs.update_one({"tracking_id": tracking_id}, update)
        
        # Log click event
        click_event = {
            "tracking_id": tracking_id,
            "log_id": log.get("id"),
            "email": log.get("email"),
            "event_type": "click",
            "clicked_url": clicked_url,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": now
        }
        await self.db.email_tracking_events.insert_one(click_event)
        
        logger.info(f"[TRACKING] Click recorded: {tracking_id} -> {clicked_url[:50]}...")
        
        return {"success": True, "tracking_id": tracking_id, "redirect_url": clicked_url}
    
    async def unsubscribe(self, email: str, token: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Handle unsubscribe request"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Verify token
        subscriber = await self.db.email_subscribers.find_one(
            {"email": email, "unsubscribe_token": token},
            {"_id": 0}
        )
        
        if not subscriber:
            return {"success": False, "error": "Invalid unsubscribe link"}
        
        if not subscriber.get("is_subscribed", True):
            return {"success": True, "message": "Already unsubscribed"}
        
        # Update subscriber
        await self.db.email_subscribers.update_one(
            {"email": email},
            {
                "$set": {
                    "is_subscribed": False,
                    "unsubscribed_at": now,
                    "unsubscribe_reason": reason,
                    "subscription_types": []  # Remove all subscriptions
                }
            }
        )
        
        # Log unsubscribe event
        await self.db.email_tracking_events.insert_one({
            "email": email,
            "event_type": "unsubscribe",
            "reason": reason,
            "timestamp": now
        })
        
        logger.info(f"[TRACKING] Unsubscribed: {email}")
        
        return {"success": True, "message": "Successfully unsubscribed"}
    
    async def resubscribe(self, email: str, subscription_types: List[str] = None) -> Dict[str, Any]:
        """Handle resubscribe request"""
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db.email_subscribers.update_one(
            {"email": email},
            {
                "$set": {
                    "is_subscribed": True,
                    "subscription_types": subscription_types or ["system", "operation"],
                    "updated_at": now
                },
                "$unset": {"unsubscribed_at": "", "unsubscribe_reason": ""}
            }
        )
        
        return {"success": True, "message": "Successfully resubscribed"}
    
    async def get_email_analytics(self, log_id: str) -> Dict[str, Any]:
        """Get analytics for a specific email"""
        log = await self.db.email_logs.find_one({"id": log_id}, {"_id": 0})
        if not log:
            return {"success": False, "error": "Log not found"}
        
        events = await self.db.email_tracking_events.find(
            {"log_id": log_id},
            {"_id": 0}
        ).to_list(100)
        
        return {
            "log_id": log_id,
            "email": log.get("email"),
            "subject": log.get("subject"),
            "sent_at": log.get("sent_at"),
            "opened_at": log.get("opened_at"),
            "open_count": log.get("open_count", 0),
            "clicked_at": log.get("clicked_at"),
            "click_count": log.get("click_count", 0),
            "clicked_links": log.get("clicked_links", []),
            "unsubscribed": log.get("unsubscribed", False),
            "events": events
        }
    
    async def get_campaign_analytics(self, campaign_id: str) -> Dict[str, Any]:
        """Get aggregated analytics for a campaign"""
        pipeline = [
            {"$match": {"campaign_id": campaign_id}},
            {
                "$group": {
                    "_id": None,
                    "total_sent": {"$sum": 1},
                    "total_opened": {"$sum": {"$cond": [{"$gt": ["$open_count", 0]}, 1, 0]}},
                    "total_clicked": {"$sum": {"$cond": [{"$gt": ["$click_count", 0]}, 1, 0]}},
                    "total_opens": {"$sum": "$open_count"},
                    "total_clicks": {"$sum": "$click_count"},
                    "unsubscribed": {"$sum": {"$cond": ["$unsubscribed", 1, 0]}}
                }
            }
        ]
        
        result = await self.db.email_logs.aggregate(pipeline).to_list(1)
        
        if not result:
            return {
                "campaign_id": campaign_id,
                "total_sent": 0,
                "open_rate": 0,
                "click_rate": 0
            }
        
        stats = result[0]
        total_sent = stats.get("total_sent", 0)
        
        return {
            "campaign_id": campaign_id,
            "total_sent": total_sent,
            "total_delivered": total_sent,  # Simplified
            "total_opened": stats.get("total_opened", 0),
            "total_clicked": stats.get("total_clicked", 0),
            "total_unsubscribed": stats.get("unsubscribed", 0),
            "open_rate": round(stats.get("total_opened", 0) / total_sent * 100, 2) if total_sent else 0,
            "click_rate": round(stats.get("total_clicked", 0) / total_sent * 100, 2) if total_sent else 0,
            "avg_opens_per_email": round(stats.get("total_opens", 0) / total_sent, 2) if total_sent else 0,
            "avg_clicks_per_email": round(stats.get("total_clicks", 0) / total_sent, 2) if total_sent else 0
        }
    
    async def get_overall_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get overall email analytics"""
        from datetime import timedelta
        
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        pipeline = [
            {"$match": {"sent_at": {"$gte": cutoff}}},
            {
                "$group": {
                    "_id": None,
                    "total_sent": {"$sum": 1},
                    "total_opened": {"$sum": {"$cond": [{"$gt": ["$open_count", 0]}, 1, 0]}},
                    "total_clicked": {"$sum": {"$cond": [{"$gt": ["$click_count", 0]}, 1, 0]}},
                    "failed": {"$sum": {"$cond": [{"$eq": ["$status", "failed"]}, 1, 0]}}
                }
            }
        ]
        
        result = await self.db.email_logs.aggregate(pipeline).to_list(1)
        
        stats = result[0] if result else {}
        total = stats.get("total_sent", 0)
        
        return {
            "period_days": days,
            "total_sent": total,
            "total_opened": stats.get("total_opened", 0),
            "total_clicked": stats.get("total_clicked", 0),
            "total_failed": stats.get("failed", 0),
            "open_rate": round(stats.get("total_opened", 0) / total * 100, 2) if total else 0,
            "click_rate": round(stats.get("total_clicked", 0) / total * 100, 2) if total else 0,
            "delivery_rate": round((total - stats.get("failed", 0)) / total * 100, 2) if total else 0
        }
