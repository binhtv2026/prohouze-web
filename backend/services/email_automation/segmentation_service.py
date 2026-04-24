"""
Email Segmentation Service - Advanced user filtering
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class EmailSegmentationService:
    """
    Advanced Segmentation Service
    Filters users based on:
    - Role: admin, manager, sales, collaborator
    - Location: province, city
    - Activity: last_login_at, total_deals, total_leads, last_active_at
    - Source: ref_id from recruitment/commission
    """
    
    # Predefined segments
    PREDEFINED_SEGMENTS = {
        "all": "Tất cả users",
        "active_users": "Users hoạt động (login < 7 ngày)",
        "inactive_users": "Users không hoạt động (> 30 ngày)",
        "new_users": "Users mới (< 7 ngày)",
        "top_performers": "Top performers (deals > threshold)",
        "admins": "Administrators",
        "managers": "Managers",
        "sales": "Sales team",
        "collaborators": "Collaborators/CTV"
    }
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_segment_users(
        self,
        segment: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Get users matching segment criteria
        Returns list of {email, name, user_id, ...}
        """
        filters = filters or {}
        now = datetime.now(timezone.utc)
        
        # Build query based on segment
        query = {"is_active": True}
        
        if segment == "all":
            pass  # No additional filters
            
        elif segment == "active_users":
            # Login within 7 days
            cutoff = (now - timedelta(days=7)).isoformat()
            query["$or"] = [
                {"last_login_at": {"$gte": cutoff}},
                {"last_active_at": {"$gte": cutoff}}
            ]
            
        elif segment == "inactive_users":
            # No activity > 30 days
            cutoff = (now - timedelta(days=30)).isoformat()
            query["$and"] = [
                {"$or": [
                    {"last_login_at": {"$lt": cutoff}},
                    {"last_login_at": {"$exists": False}}
                ]},
                {"$or": [
                    {"last_active_at": {"$lt": cutoff}},
                    {"last_active_at": {"$exists": False}}
                ]}
            ]
            
        elif segment == "new_users":
            # Created within 7 days
            cutoff = (now - timedelta(days=7)).isoformat()
            query["created_at"] = {"$gte": cutoff}
            
        elif segment == "top_performers":
            # Deals > threshold (default 5)
            threshold = filters.get("deal_threshold", 5)
            query["total_deals"] = {"$gte": threshold}
            
        elif segment == "admins":
            query["role"] = "admin"
            
        elif segment == "managers":
            query["role"] = "manager"
            
        elif segment == "sales":
            query["role"] = "sales"
            
        elif segment == "collaborators":
            query["role"] = {"$in": ["collaborator", "ctv"]}
        
        # Apply additional filters
        if filters.get("role"):
            query["role"] = filters["role"]
            
        if filters.get("province"):
            query["province"] = filters["province"]
            
        if filters.get("city"):
            query["city"] = filters["city"]
            
        if filters.get("ref_id"):
            # Get users with specific referral source
            query["ref_id"] = filters["ref_id"]
            
        if filters.get("min_deals"):
            query["total_deals"] = {"$gte": filters["min_deals"]}
            
        if filters.get("min_leads"):
            query["total_leads"] = {"$gte": filters["min_leads"]}
        
        # Fetch users
        projection = {
            "_id": 0,
            "id": 1,
            "email": 1,
            "name": 1,
            "full_name": 1,
            "role": 1,
            "province": 1,
            "city": 1,
            "last_login_at": 1,
            "last_active_at": 1,
            "total_deals": 1,
            "total_leads": 1,
            "ref_id": 1,
            "created_at": 1
        }
        
        users = await self.db.users.find(query, projection).limit(limit).to_list(limit)
        
        # Format response
        result = []
        for user in users:
            result.append({
                "user_id": user.get("id"),
                "email": user.get("email"),
                "name": user.get("full_name") or user.get("name"),
                "role": user.get("role"),
                "province": user.get("province"),
                "city": user.get("city"),
                "last_login_at": user.get("last_login_at"),
                "total_deals": user.get("total_deals", 0),
                "total_leads": user.get("total_leads", 0),
                "ref_id": user.get("ref_id")
            })
        
        logger.info(f"[SEGMENT] {segment}: found {len(result)} users")
        return result
    
    async def get_users_by_ref_source(self, ref_id: str, limit: int = 100) -> List[Dict]:
        """Get users recruited by specific referrer"""
        # Check candidates collection
        candidates = await self.db.candidates.find(
            {"ref_id": ref_id, "status": {"$in": ["hired", "contracted"]}},
            {"_id": 0, "email": 1, "full_name": 1, "phone": 1}
        ).limit(limit).to_list(limit)
        
        result = []
        for c in candidates:
            result.append({
                "email": c.get("email"),
                "name": c.get("full_name"),
                "source": "recruitment",
                "ref_id": ref_id
            })
        
        # Also check commission tree
        tree_users = await self.db.referral_trees.find(
            {"parent_ref_id": ref_id},
            {"_id": 0, "email": 1, "name": 1}
        ).limit(limit).to_list(limit)
        
        for u in tree_users:
            result.append({
                "email": u.get("email"),
                "name": u.get("name"),
                "source": "commission_tree",
                "ref_id": ref_id
            })
        
        return result
    
    async def get_segment_count(self, segment: str, filters: Optional[Dict] = None) -> int:
        """Get count of users in segment"""
        users = await self.get_segment_users(segment, filters, limit=10000)
        return len(users)
    
    async def get_available_filters(self) -> Dict[str, Any]:
        """Get available filter options"""
        # Get distinct values
        roles = await self.db.users.distinct("role")
        provinces = await self.db.users.distinct("province")
        cities = await self.db.users.distinct("city")
        
        return {
            "segments": self.PREDEFINED_SEGMENTS,
            "roles": [r for r in roles if r],
            "provinces": [p for p in provinces if p],
            "cities": [c for c in cities if c],
            "activity_filters": [
                {"key": "min_deals", "label": "Số deal tối thiểu", "type": "number"},
                {"key": "min_leads", "label": "Số lead tối thiểu", "type": "number"},
                {"key": "deal_threshold", "label": "Top performer threshold", "type": "number"}
            ]
        }
    
    async def check_user_subscribed(self, email: str) -> bool:
        """Check if user is subscribed (not unsubscribed)"""
        subscriber = await self.db.email_subscribers.find_one(
            {"email": email},
            {"_id": 0, "is_subscribed": 1}
        )
        
        if not subscriber:
            return True  # New user = subscribed by default
        
        return subscriber.get("is_subscribed", True)
    
    async def filter_subscribed_users(self, users: List[Dict]) -> List[Dict]:
        """Filter out unsubscribed users from list"""
        result = []
        
        for user in users:
            if await self.check_user_subscribed(user.get("email")):
                result.append(user)
        
        return result
