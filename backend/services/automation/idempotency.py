"""
Idempotency & Dedupe - Prevent Duplicate Execution
Prompt 19.5 - Hardening Automation Engine

Ensures:
- Same event not processed twice
- Same action not executed twice for same entity
- Idempotency key based deduplication
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import hashlib
import logging

logger = logging.getLogger(__name__)


# ==================== IDEMPOTENCY STORE ====================

class IdempotencyStore:
    """
    Stores idempotency keys to prevent duplicate processing.
    
    Uses MongoDB with TTL for automatic cleanup.
    Can be swapped with Redis for higher performance.
    """
    
    def __init__(self, db, ttl_hours: int = 24):
        self.db = db
        self._collection = "automation_idempotency"
        self._ttl_hours = ttl_hours
    
    async def ensure_indexes(self):
        """Create indexes for idempotency collection."""
        # Unique key index
        await self.db[self._collection].create_index("key", unique=True)
        
        # TTL index for automatic cleanup
        await self.db[self._collection].create_index(
            "created_at",
            expireAfterSeconds=self._ttl_hours * 3600
        )
    
    def generate_key(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        timestamp: str = None
    ) -> str:
        """
        Generate deterministic idempotency key.
        
        Key format: idem_{hash}
        Hash based on: event_type + entity + timestamp (truncated to minute)
        """
        ts = timestamp or datetime.now(timezone.utc).isoformat()
        # Truncate to minute for small time window deduplication
        ts_minute = ts[:16]  # YYYY-MM-DDTHH:MM
        
        content = f"{event_type}:{entity_type}:{entity_id}:{ts_minute}"
        hash_value = hashlib.md5(content.encode()).hexdigest()[:16]
        
        return f"idem_{hash_value}"
    
    async def is_duplicate(self, idempotency_key: str) -> bool:
        """
        Check if this key has been processed.
        
        Returns True if duplicate (already processed).
        """
        existing = await self.db[self._collection].find_one(
            {"key": idempotency_key}
        )
        return existing is not None
    
    async def mark_processed(
        self,
        idempotency_key: str,
        execution_id: str = None,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Mark key as processed.
        
        Returns True if marked successfully, False if already exists.
        """
        try:
            await self.db[self._collection].insert_one({
                "key": idempotency_key,
                "execution_id": execution_id,
                "metadata": metadata or {},
                "created_at": datetime.now(timezone.utc)
            })
            return True
        except Exception as e:
            # Duplicate key error means already processed
            if "duplicate key" in str(e).lower() or "E11000" in str(e):
                return False
            raise
    
    async def get_execution(self, idempotency_key: str) -> Optional[Dict[str, Any]]:
        """Get previous execution info for a key."""
        return await self.db[self._collection].find_one(
            {"key": idempotency_key},
            {"_id": 0}
        )
    
    async def clear_key(self, idempotency_key: str) -> bool:
        """Clear a key (for retry scenarios)."""
        result = await self.db[self._collection].delete_one(
            {"key": idempotency_key}
        )
        return result.deleted_count > 0


# ==================== ACTION DEDUPE ====================

class ActionDeduplicator:
    """
    Prevents duplicate action execution for the same entity.
    
    Different from idempotency - this prevents the same action type
    from running twice for the same entity within a cooldown period.
    """
    
    def __init__(self, db, default_cooldown_minutes: int = 60):
        self.db = db
        self._collection = "automation_action_dedupe"
        self._default_cooldown = default_cooldown_minutes
    
    def generate_dedupe_key(
        self,
        rule_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str
    ) -> str:
        """Generate deduplication key."""
        content = f"{rule_id}:{action_type}:{entity_type}:{entity_id}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def is_duplicate(
        self,
        rule_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str,
        cooldown_minutes: int = None
    ) -> tuple[bool, Optional[str]]:
        """
        Check if this action is a duplicate.
        
        Returns:
            (is_duplicate: bool, previous_execution_id: Optional[str])
        """
        cooldown = cooldown_minutes or self._default_cooldown
        dedupe_key = self.generate_dedupe_key(rule_id, action_type, entity_type, entity_id)
        
        threshold = datetime.now(timezone.utc) - timedelta(minutes=cooldown)
        
        existing = await self.db[self._collection].find_one({
            "dedupe_key": dedupe_key,
            "executed_at": {"$gte": threshold}
        })
        
        if existing:
            return True, existing.get("execution_id")
        return False, None
    
    async def mark_executed(
        self,
        rule_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str,
        execution_id: str
    ):
        """Mark action as executed."""
        dedupe_key = self.generate_dedupe_key(rule_id, action_type, entity_type, entity_id)
        now = datetime.now(timezone.utc)
        
        await self.db[self._collection].update_one(
            {"dedupe_key": dedupe_key},
            {
                "$set": {
                    "dedupe_key": dedupe_key,
                    "rule_id": rule_id,
                    "action_type": action_type,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "execution_id": execution_id,
                    "executed_at": now
                }
            },
            upsert=True
        )


# ==================== ANTI-LOOP PROTECTION ====================

class AntiLoopProtection:
    """
    Prevents automation loops where:
    - Event triggers rule that triggers same event
    - Chain of events creates infinite loop
    """
    
    MAX_CHAIN_DEPTH = 5
    MAX_SAME_RULE_IN_CHAIN = 1
    
    def __init__(self, db):
        self.db = db
        self._collection = "automation_chains"
    
    async def check_loop(
        self,
        correlation_id: str,
        rule_id: str,
        source_rule_id: str = None
    ) -> tuple[bool, str]:
        """
        Check if executing this rule would create a loop.
        
        Returns:
            (is_loop: bool, reason: str)
        """
        if not correlation_id:
            return False, "ok"
        
        # Get chain history
        chain = await self.db[self._collection].find_one(
            {"correlation_id": correlation_id},
            {"_id": 0}
        )
        
        if not chain:
            return False, "ok"
        
        executed_rules = chain.get("executed_rules", [])
        
        # Check max chain depth
        if len(executed_rules) >= self.MAX_CHAIN_DEPTH:
            return True, f"max_chain_depth_exceeded ({len(executed_rules)}/{self.MAX_CHAIN_DEPTH})"
        
        # Check if same rule already in chain
        rule_count = executed_rules.count(rule_id)
        if rule_count >= self.MAX_SAME_RULE_IN_CHAIN:
            return True, f"same_rule_in_chain ({rule_id} appeared {rule_count} times)"
        
        # Check direct self-trigger
        if source_rule_id and source_rule_id == rule_id:
            return True, "direct_self_trigger"
        
        return False, "ok"
    
    async def record_execution(
        self,
        correlation_id: str,
        rule_id: str,
        event_id: str
    ):
        """Record rule execution in chain."""
        if not correlation_id:
            return
        
        now = datetime.now(timezone.utc)
        
        await self.db[self._collection].update_one(
            {"correlation_id": correlation_id},
            {
                "$push": {
                    "executed_rules": rule_id,
                    "events": {
                        "event_id": event_id,
                        "rule_id": rule_id,
                        "executed_at": now.isoformat()
                    }
                },
                "$set": {"updated_at": now},
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )
    
    async def get_chain(self, correlation_id: str) -> Optional[Dict[str, Any]]:
        """Get chain info for debugging."""
        return await self.db[self._collection].find_one(
            {"correlation_id": correlation_id},
            {"_id": 0}
        )


# ==================== UNIFIED DEDUPE CHECKER ====================

class DedupeChecker:
    """
    Unified deduplication checker combining all protection mechanisms.
    """
    
    def __init__(self, db):
        self.db = db
        self.idempotency = IdempotencyStore(db)
        self.action_dedupe = ActionDeduplicator(db)
        self.anti_loop = AntiLoopProtection(db)
    
    async def check_event(
        self,
        event_id: str,
        event_type: str,
        entity_type: str,
        entity_id: str,
        idempotency_key: str = None,
        correlation_id: str = None,
        source_rule_id: str = None
    ) -> Dict[str, Any]:
        """
        Full deduplication check for an event.
        
        Returns:
            {
                "is_duplicate": bool,
                "reason": str,
                "checks": {
                    "idempotency": {...},
                    "anti_loop": {...}
                }
            }
        """
        result = {
            "is_duplicate": False,
            "reason": "",
            "checks": {}
        }
        
        # 1. Idempotency check
        if idempotency_key:
            is_dup = await self.idempotency.is_duplicate(idempotency_key)
            result["checks"]["idempotency"] = {
                "checked": True,
                "is_duplicate": is_dup
            }
            if is_dup:
                result["is_duplicate"] = True
                result["reason"] = "idempotency_key_exists"
                return result
        
        # 2. Anti-loop check
        if correlation_id:
            is_loop, reason = await self.anti_loop.check_loop(
                correlation_id, "", source_rule_id
            )
            result["checks"]["anti_loop"] = {
                "checked": True,
                "is_loop": is_loop,
                "reason": reason
            }
            if is_loop:
                result["is_duplicate"] = True
                result["reason"] = f"loop_detected: {reason}"
                return result
        
        return result
    
    async def check_action(
        self,
        rule_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str,
        cooldown_minutes: int = 60
    ) -> Dict[str, Any]:
        """
        Deduplication check for an action.
        """
        is_dup, prev_exec = await self.action_dedupe.is_duplicate(
            rule_id, action_type, entity_type, entity_id, cooldown_minutes
        )
        
        return {
            "is_duplicate": is_dup,
            "previous_execution_id": prev_exec,
            "cooldown_minutes": cooldown_minutes
        }
    
    async def mark_event_processed(
        self,
        idempotency_key: str,
        execution_id: str,
        correlation_id: str = None,
        rule_id: str = None,
        event_id: str = None
    ):
        """Mark event as processed in all systems."""
        # Idempotency
        if idempotency_key:
            await self.idempotency.mark_processed(idempotency_key, execution_id)
        
        # Chain tracking
        if correlation_id and rule_id and event_id:
            await self.anti_loop.record_execution(correlation_id, rule_id, event_id)
    
    async def mark_action_executed(
        self,
        rule_id: str,
        action_type: str,
        entity_type: str,
        entity_id: str,
        execution_id: str
    ):
        """Mark action as executed."""
        await self.action_dedupe.mark_executed(
            rule_id, action_type, entity_type, entity_id, execution_id
        )
