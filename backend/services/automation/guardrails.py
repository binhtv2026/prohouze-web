"""
Guardrails - Safety & Control for Automation
Prompt 19/20 - Automation Engine

Provides:
- Rate Limiting (max executions per hour/day)
- Deduplication (prevent duplicate runs)
- Anti-loop Protection (prevent infinite loops)
- Throttling (notification throttling)
- Idempotency (same input = same output)
"""

from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
import hashlib
import logging

logger = logging.getLogger(__name__)


# ==================== RATE LIMITER ====================

@dataclass
class RateLimitResult:
    """Result of rate limit check"""
    allowed: bool
    reason: str = ""
    current_count: int = 0
    limit: int = 0
    reset_at: str = ""


class RateLimiter:
    """
    Rate Limiter for automation execution.
    
    Prevents:
    - Rule running too many times per hour/day
    - System overload from runaway automation
    """
    
    def __init__(self, db):
        self.db = db
        self._counter_collection = "automation_rate_limits"
    
    async def check_rate_limit(
        self,
        rule_id: str,
        max_per_hour: int = 100,
        max_per_day: int = 1000
    ) -> RateLimitResult:
        """
        Check if rule execution is within rate limits.
        
        Returns:
            RateLimitResult with allowed=True if within limits
        """
        now = datetime.now(timezone.utc)
        hour_key = f"{rule_id}:{now.strftime('%Y%m%d%H')}"
        day_key = f"{rule_id}:{now.strftime('%Y%m%d')}"
        
        # Check hourly limit
        hourly = await self.db[self._counter_collection].find_one(
            {"key": hour_key}, {"_id": 0}
        )
        hourly_count = hourly.get("count", 0) if hourly else 0
        
        if hourly_count >= max_per_hour:
            return RateLimitResult(
                allowed=False,
                reason=f"Hourly limit exceeded ({hourly_count}/{max_per_hour})",
                current_count=hourly_count,
                limit=max_per_hour,
                reset_at=(now.replace(minute=0, second=0) + timedelta(hours=1)).isoformat()
            )
        
        # Check daily limit
        daily = await self.db[self._counter_collection].find_one(
            {"key": day_key}, {"_id": 0}
        )
        daily_count = daily.get("count", 0) if daily else 0
        
        if daily_count >= max_per_day:
            return RateLimitResult(
                allowed=False,
                reason=f"Daily limit exceeded ({daily_count}/{max_per_day})",
                current_count=daily_count,
                limit=max_per_day,
                reset_at=(now.replace(hour=0, minute=0, second=0) + timedelta(days=1)).isoformat()
            )
        
        return RateLimitResult(
            allowed=True,
            current_count=hourly_count,
            limit=max_per_hour
        )
    
    async def increment_counter(self, rule_id: str):
        """Increment execution counter for a rule."""
        now = datetime.now(timezone.utc)
        hour_key = f"{rule_id}:{now.strftime('%Y%m%d%H')}"
        day_key = f"{rule_id}:{now.strftime('%Y%m%d')}"
        
        # Increment hourly counter
        await self.db[self._counter_collection].update_one(
            {"key": hour_key},
            {
                "$inc": {"count": 1},
                "$set": {"updated_at": now.isoformat()},
                "$setOnInsert": {"created_at": now.isoformat()}
            },
            upsert=True
        )
        
        # Increment daily counter
        await self.db[self._counter_collection].update_one(
            {"key": day_key},
            {
                "$inc": {"count": 1},
                "$set": {"updated_at": now.isoformat()},
                "$setOnInsert": {"created_at": now.isoformat()}
            },
            upsert=True
        )
    
    async def get_usage(self, rule_id: str) -> Dict[str, Any]:
        """Get current rate limit usage for a rule."""
        now = datetime.now(timezone.utc)
        hour_key = f"{rule_id}:{now.strftime('%Y%m%d%H')}"
        day_key = f"{rule_id}:{now.strftime('%Y%m%d')}"
        
        hourly = await self.db[self._counter_collection].find_one(
            {"key": hour_key}, {"_id": 0}
        )
        daily = await self.db[self._counter_collection].find_one(
            {"key": day_key}, {"_id": 0}
        )
        
        return {
            "hourly_count": hourly.get("count", 0) if hourly else 0,
            "daily_count": daily.get("count", 0) if daily else 0,
        }


# ==================== DEDUPE CHECKER ====================

@dataclass
class DedupeResult:
    """Result of deduplication check"""
    is_duplicate: bool
    reason: str = ""
    previous_execution_id: str = ""
    previous_executed_at: str = ""


class DedupeChecker:
    """
    Deduplication Checker.
    
    Prevents:
    - Same rule running multiple times for same entity in short time
    - Duplicate task/notification creation
    """
    
    def __init__(self, db):
        self.db = db
        self._dedupe_collection = "automation_dedupe"
    
    def _generate_dedupe_key(
        self,
        rule_id: str,
        entity_type: str,
        entity_id: str,
        action_type: str = None
    ) -> str:
        """Generate deduplication key."""
        components = [rule_id, entity_type, entity_id]
        if action_type:
            components.append(action_type)
        
        key_str = ":".join(components)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    async def check_duplicate(
        self,
        rule_id: str,
        entity_type: str,
        entity_id: str,
        cooldown_minutes: int = 60,
        action_type: str = None
    ) -> DedupeResult:
        """
        Check if this execution is a duplicate.
        
        Args:
            rule_id: Rule ID
            entity_type: Entity type (leads, deals, etc.)
            entity_id: Entity ID
            cooldown_minutes: Minimum time between executions
            action_type: Optional action type for finer deduplication
            
        Returns:
            DedupeResult with is_duplicate=True if duplicate
        """
        dedupe_key = self._generate_dedupe_key(rule_id, entity_type, entity_id, action_type)
        threshold = datetime.now(timezone.utc) - timedelta(minutes=cooldown_minutes)
        
        existing = await self.db[self._dedupe_collection].find_one({
            "dedupe_key": dedupe_key,
            "executed_at": {"$gte": threshold.isoformat()}
        }, {"_id": 0})
        
        if existing:
            return DedupeResult(
                is_duplicate=True,
                reason=f"Executed {cooldown_minutes}min ago",
                previous_execution_id=existing.get("execution_id", ""),
                previous_executed_at=existing.get("executed_at", "")
            )
        
        return DedupeResult(is_duplicate=False)
    
    async def record_execution(
        self,
        rule_id: str,
        entity_type: str,
        entity_id: str,
        execution_id: str,
        action_type: str = None
    ):
        """Record an execution for deduplication tracking."""
        dedupe_key = self._generate_dedupe_key(rule_id, entity_type, entity_id, action_type)
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db[self._dedupe_collection].update_one(
            {"dedupe_key": dedupe_key},
            {
                "$set": {
                    "dedupe_key": dedupe_key,
                    "rule_id": rule_id,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "action_type": action_type,
                    "execution_id": execution_id,
                    "executed_at": now,
                }
            },
            upsert=True
        )


# ==================== ANTI-LOOP PROTECTION ====================

@dataclass
class LoopCheckResult:
    """Result of anti-loop check"""
    is_loop: bool
    reason: str = ""
    loop_depth: int = 0


class AntiLoopProtection:
    """
    Anti-Loop Protection.
    
    Prevents:
    - Automation A triggers event that triggers Automation B that triggers A
    - Infinite recursion in automation chains
    """
    
    MAX_CHAIN_DEPTH = 5  # Maximum automation chain depth
    
    def __init__(self, db):
        self.db = db
        self._chain_collection = "automation_chains"
    
    async def check_loop(
        self,
        correlation_id: str,
        rule_id: str
    ) -> LoopCheckResult:
        """
        Check if this execution would create a loop.
        
        Args:
            correlation_id: Correlation ID for the event chain
            rule_id: Rule being executed
            
        Returns:
            LoopCheckResult with is_loop=True if loop detected
        """
        if not correlation_id:
            return LoopCheckResult(is_loop=False)
        
        # Get chain history
        chain = await self.db[self._chain_collection].find_one(
            {"correlation_id": correlation_id},
            {"_id": 0}
        )
        
        if not chain:
            return LoopCheckResult(is_loop=False)
        
        executed_rules = chain.get("executed_rules", [])
        
        # Check depth
        if len(executed_rules) >= self.MAX_CHAIN_DEPTH:
            return LoopCheckResult(
                is_loop=True,
                reason=f"Chain depth exceeded ({len(executed_rules)}/{self.MAX_CHAIN_DEPTH})",
                loop_depth=len(executed_rules)
            )
        
        # Check if rule already in chain (actual loop)
        if rule_id in executed_rules:
            return LoopCheckResult(
                is_loop=True,
                reason=f"Rule {rule_id} already executed in this chain",
                loop_depth=len(executed_rules)
            )
        
        return LoopCheckResult(is_loop=False, loop_depth=len(executed_rules))
    
    async def record_chain_execution(
        self,
        correlation_id: str,
        rule_id: str,
        execution_id: str
    ):
        """Record rule execution in the chain."""
        if not correlation_id:
            return
        
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db[self._chain_collection].update_one(
            {"correlation_id": correlation_id},
            {
                "$push": {"executed_rules": rule_id},
                "$set": {"updated_at": now},
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )


# ==================== NOTIFICATION THROTTLER ====================

class NotificationThrottler:
    """
    Notification Throttler.
    
    Prevents:
    - Spamming user with too many notifications
    - Same notification sent multiple times
    """
    
    def __init__(self, db):
        self.db = db
        self._throttle_collection = "notification_throttle"
    
    async def can_send(
        self,
        user_id: str,
        notification_type: str,
        entity_id: str = None,
        max_per_hour: int = 10,
        max_same_type_per_day: int = 50
    ) -> bool:
        """
        Check if notification can be sent.
        
        Returns True if notification is allowed.
        """
        now = datetime.now(timezone.utc)
        hour_ago = (now - timedelta(hours=1)).isoformat()
        day_ago = (now - timedelta(days=1)).isoformat()
        
        # Check per-user hourly limit
        hourly_count = await self.db[self._throttle_collection].count_documents({
            "user_id": user_id,
            "sent_at": {"$gte": hour_ago}
        })
        
        if hourly_count >= max_per_hour:
            logger.warning(f"Notification throttled for user {user_id}: hourly limit")
            return False
        
        # Check same type daily limit
        same_type_count = await self.db[self._throttle_collection].count_documents({
            "user_id": user_id,
            "notification_type": notification_type,
            "sent_at": {"$gte": day_ago}
        })
        
        if same_type_count >= max_same_type_per_day:
            logger.warning(f"Notification throttled for user {user_id}: daily type limit")
            return False
        
        # Check exact duplicate (same type + entity in last hour)
        if entity_id:
            duplicate = await self.db[self._throttle_collection].find_one({
                "user_id": user_id,
                "notification_type": notification_type,
                "entity_id": entity_id,
                "sent_at": {"$gte": hour_ago}
            })
            
            if duplicate:
                logger.warning(f"Duplicate notification blocked for user {user_id}")
                return False
        
        return True
    
    async def record_sent(
        self,
        user_id: str,
        notification_type: str,
        entity_id: str = None
    ):
        """Record that a notification was sent."""
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db[self._throttle_collection].insert_one({
            "user_id": user_id,
            "notification_type": notification_type,
            "entity_id": entity_id,
            "sent_at": now,
        })


# ==================== GUARDRAIL ENGINE ====================

class GuardrailEngine:
    """
    Unified Guardrail Engine.
    
    Combines all safety checks into a single interface.
    """
    
    def __init__(self, db):
        self.db = db
        self.rate_limiter = RateLimiter(db)
        self.dedupe_checker = DedupeChecker(db)
        self.anti_loop = AntiLoopProtection(db)
        self.notification_throttler = NotificationThrottler(db)
    
    async def can_execute(
        self,
        rule_id: str,
        entity_type: str,
        entity_id: str,
        correlation_id: str = None,
        max_per_hour: int = 100,
        max_per_day: int = 1000,
        cooldown_minutes: int = 60
    ) -> Dict[str, Any]:
        """
        Check all guardrails before execution.
        
        Returns:
            {
                "allowed": True/False,
                "reason": "..." if not allowed,
                "checks": {
                    "rate_limit": {...},
                    "dedupe": {...},
                    "loop": {...}
                }
            }
        """
        result = {
            "allowed": True,
            "reason": "",
            "checks": {}
        }
        
        # 1. Rate Limit Check
        rate_result = await self.rate_limiter.check_rate_limit(
            rule_id, max_per_hour, max_per_day
        )
        result["checks"]["rate_limit"] = {
            "allowed": rate_result.allowed,
            "reason": rate_result.reason
        }
        
        if not rate_result.allowed:
            result["allowed"] = False
            result["reason"] = f"Rate limit: {rate_result.reason}"
            return result
        
        # 2. Deduplication Check
        dedupe_result = await self.dedupe_checker.check_duplicate(
            rule_id, entity_type, entity_id, cooldown_minutes
        )
        result["checks"]["dedupe"] = {
            "is_duplicate": dedupe_result.is_duplicate,
            "reason": dedupe_result.reason
        }
        
        if dedupe_result.is_duplicate:
            result["allowed"] = False
            result["reason"] = f"Duplicate: {dedupe_result.reason}"
            return result
        
        # 3. Anti-Loop Check
        if correlation_id:
            loop_result = await self.anti_loop.check_loop(correlation_id, rule_id)
            result["checks"]["loop"] = {
                "is_loop": loop_result.is_loop,
                "reason": loop_result.reason,
                "depth": loop_result.loop_depth
            }
            
            if loop_result.is_loop:
                result["allowed"] = False
                result["reason"] = f"Loop detected: {loop_result.reason}"
                return result
        
        return result
    
    async def record_execution(
        self,
        rule_id: str,
        entity_type: str,
        entity_id: str,
        execution_id: str,
        correlation_id: str = None
    ):
        """Record execution in all guardrail systems."""
        # Rate limit counter
        await self.rate_limiter.increment_counter(rule_id)
        
        # Deduplication record
        await self.dedupe_checker.record_execution(
            rule_id, entity_type, entity_id, execution_id
        )
        
        # Chain record
        if correlation_id:
            await self.anti_loop.record_chain_execution(
                correlation_id, rule_id, execution_id
            )
    
    async def can_send_notification(
        self,
        user_id: str,
        notification_type: str,
        entity_id: str = None
    ) -> bool:
        """Check if notification can be sent."""
        return await self.notification_throttler.can_send(
            user_id, notification_type, entity_id
        )
    
    async def record_notification(
        self,
        user_id: str,
        notification_type: str,
        entity_id: str = None
    ):
        """Record that notification was sent."""
        await self.notification_throttler.record_sent(
            user_id, notification_type, entity_id
        )
