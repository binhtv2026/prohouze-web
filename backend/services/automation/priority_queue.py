"""
Priority Queue - Business Value Based Prioritization
Prompt 19.5 - Hardening Automation Engine

Ensures high-value items are processed first:
- Deal value → priority
- Risk level → priority
- SLA deadline → priority
"""

import heapq
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)


# ==================== PRIORITY LEVELS ====================

class PriorityLevel(int, Enum):
    """Priority levels (higher = more urgent)."""
    CRITICAL = 100   # Process immediately
    URGENT = 80      # Process within minutes
    HIGH = 60        # Process within 30 minutes
    MEDIUM = 40      # Process within 1 hour
    LOW = 20         # Process when idle
    BACKGROUND = 0   # Batch processing


# ==================== QUEUE ITEM ====================

@dataclass(order=True)
class QueueItem:
    """
    Item in the priority queue.
    
    Uses negative priority for max-heap behavior (heapq is min-heap).
    """
    priority: int = field(compare=True)  # Negative for max-heap
    timestamp: float = field(compare=True)  # Tie-breaker: older first
    item_id: str = field(compare=False)
    data: Dict[str, Any] = field(compare=False, default_factory=dict)


# ==================== PRIORITY QUEUE ====================

class AutomationPriorityQueue:
    """
    Priority queue for automation execution.
    
    Features:
    - Priority-based ordering
    - FIFO within same priority
    - Deduplication
    - Peek without pop
    - Size limits
    """
    
    def __init__(self, max_size: int = 10000):
        self._heap: List[QueueItem] = []
        self._item_ids: set = set()  # For deduplication
        self._max_size = max_size
    
    def push(
        self,
        item_id: str,
        data: Dict[str, Any],
        priority: int = PriorityLevel.MEDIUM
    ) -> bool:
        """
        Add item to queue.
        
        Args:
            item_id: Unique identifier (for deduplication)
            data: Item data
            priority: Priority level (0-100)
            
        Returns:
            True if added, False if duplicate or queue full
        """
        # Check duplicate
        if item_id in self._item_ids:
            logger.debug(f"Duplicate item skipped: {item_id}")
            return False
        
        # Check size limit
        if len(self._heap) >= self._max_size:
            logger.warning(f"Queue full, dropping item: {item_id}")
            return False
        
        # Create queue item (negative priority for max-heap)
        queue_item = QueueItem(
            priority=-priority,  # Negative for max-heap
            timestamp=datetime.now(timezone.utc).timestamp(),
            item_id=item_id,
            data=data
        )
        
        heapq.heappush(self._heap, queue_item)
        self._item_ids.add(item_id)
        
        return True
    
    def pop(self) -> Optional[Tuple[str, Dict[str, Any], int]]:
        """
        Remove and return highest priority item.
        
        Returns:
            (item_id, data, priority) or None if empty
        """
        if not self._heap:
            return None
        
        queue_item = heapq.heappop(self._heap)
        self._item_ids.discard(queue_item.item_id)
        
        return (
            queue_item.item_id,
            queue_item.data,
            -queue_item.priority  # Convert back to positive
        )
    
    def peek(self) -> Optional[Tuple[str, Dict[str, Any], int]]:
        """Look at highest priority item without removing."""
        if not self._heap:
            return None
        
        queue_item = self._heap[0]
        return (
            queue_item.item_id,
            queue_item.data,
            -queue_item.priority
        )
    
    def remove(self, item_id: str) -> bool:
        """Remove item by ID."""
        if item_id not in self._item_ids:
            return False
        
        self._heap = [item for item in self._heap if item.item_id != item_id]
        heapq.heapify(self._heap)
        self._item_ids.discard(item_id)
        
        return True
    
    def update_priority(self, item_id: str, new_priority: int) -> bool:
        """Update priority of existing item."""
        if item_id not in self._item_ids:
            return False
        
        # Find and update item
        for i, item in enumerate(self._heap):
            if item.item_id == item_id:
                data = item.data
                self._heap.pop(i)
                heapq.heapify(self._heap)
                
                # Re-add with new priority
                new_item = QueueItem(
                    priority=-new_priority,
                    timestamp=item.timestamp,
                    item_id=item_id,
                    data=data
                )
                heapq.heappush(self._heap, new_item)
                return True
        
        return False
    
    def contains(self, item_id: str) -> bool:
        """Check if item is in queue."""
        return item_id in self._item_ids
    
    def __len__(self) -> int:
        return len(self._heap)
    
    def is_empty(self) -> bool:
        return len(self._heap) == 0
    
    def clear(self):
        """Clear the queue."""
        self._heap.clear()
        self._item_ids.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get queue statistics."""
        if not self._heap:
            return {
                "size": 0,
                "max_size": self._max_size,
                "priority_distribution": {}
            }
        
        # Count by priority level
        distribution = {level.name: 0 for level in PriorityLevel}
        for item in self._heap:
            priority = -item.priority
            for level in PriorityLevel:
                if priority >= level.value:
                    distribution[level.name] += 1
                    break
        
        return {
            "size": len(self._heap),
            "max_size": self._max_size,
            "priority_distribution": distribution,
            "highest_priority": -self._heap[0].priority if self._heap else 0
        }


# ==================== PRIORITY CALCULATOR ====================

class PriorityCalculator:
    """
    Calculate priority score for automation items.
    
    Factors:
    - Deal/lead value
    - Risk level
    - SLA deadline
    - Entity age
    - Urgency flags
    """
    
    # Priority weights
    WEIGHTS = {
        "value": 30,       # Deal value factor
        "risk": 25,        # Risk level factor
        "sla": 25,         # SLA deadline factor
        "urgency": 20,     # Manual urgency flags
    }
    
    # Value thresholds (VND)
    VALUE_THRESHOLDS = [
        (10_000_000_000, 100),  # 10 tỷ+
        (5_000_000_000, 80),    # 5-10 tỷ
        (2_000_000_000, 60),    # 2-5 tỷ
        (500_000_000, 40),      # 500tr-2 tỷ
        (0, 20),               # < 500tr
    ]
    
    # Risk level scores
    RISK_SCORES = {
        "critical": 100,
        "high": 75,
        "medium": 50,
        "low": 25,
        "none": 0,
    }
    
    # SLA urgency scores
    SLA_SCORES = {
        "breached": 100,      # Already past SLA
        "critical": 90,       # < 1 hour to SLA
        "urgent": 70,         # < 4 hours to SLA
        "approaching": 50,    # < 24 hours to SLA
        "normal": 20,         # > 24 hours
    }
    
    def calculate(
        self,
        entity: Dict[str, Any],
        event_type: str = None,
        context: Dict[str, Any] = None
    ) -> int:
        """
        Calculate priority score (0-100).
        
        Args:
            entity: Entity data (deal, lead, booking, etc.)
            event_type: Event type (some events have inherent priority)
            context: Additional context
            
        Returns:
            Priority score 0-100
        """
        context = context or {}
        scores = {}
        
        # 1. Value score
        value = entity.get("value") or entity.get("estimated_value") or 0
        value_score = self._calculate_value_score(value)
        scores["value"] = value_score
        
        # 2. Risk score
        risk_level = (
            context.get("risk_level") or 
            entity.get("risk_level") or 
            "none"
        )
        risk_score = self.RISK_SCORES.get(risk_level, 0)
        scores["risk"] = risk_score
        
        # 3. SLA score
        sla_status = self._calculate_sla_status(entity, context)
        sla_score = self.SLA_SCORES.get(sla_status, 20)
        scores["sla"] = sla_score
        
        # 4. Urgency score
        urgency_score = self._calculate_urgency_score(entity, event_type, context)
        scores["urgency"] = urgency_score
        
        # Calculate weighted total
        total = sum(
            scores[factor] * (weight / 100)
            for factor, weight in self.WEIGHTS.items()
        )
        
        # Ensure 0-100 range
        return max(0, min(100, int(total)))
    
    def _calculate_value_score(self, value: float) -> int:
        """Calculate score based on deal/lead value."""
        for threshold, score in self.VALUE_THRESHOLDS:
            if value >= threshold:
                return score
        return 20
    
    def _calculate_sla_status(
        self,
        entity: Dict[str, Any],
        context: Dict[str, Any]
    ) -> str:
        """Calculate SLA status."""
        # Check explicit SLA
        sla_deadline = context.get("sla_deadline") or entity.get("sla_deadline")
        if sla_deadline:
            try:
                if isinstance(sla_deadline, str):
                    deadline = datetime.fromisoformat(sla_deadline.replace("Z", "+00:00"))
                else:
                    deadline = sla_deadline
                
                now = datetime.now(timezone.utc)
                hours_left = (deadline - now).total_seconds() / 3600
                
                if hours_left < 0:
                    return "breached"
                elif hours_left < 1:
                    return "critical"
                elif hours_left < 4:
                    return "urgent"
                elif hours_left < 24:
                    return "approaching"
            except:
                pass
        
        # Check booking expiry
        expires_at = entity.get("expires_at")
        if expires_at:
            try:
                if isinstance(expires_at, str):
                    expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                else:
                    expiry = expires_at
                
                now = datetime.now(timezone.utc)
                hours_left = (expiry - now).total_seconds() / 3600
                
                if hours_left < 0:
                    return "breached"
                elif hours_left < 24:
                    return "critical"
                elif hours_left < 72:
                    return "urgent"
            except:
                pass
        
        return "normal"
    
    def _calculate_urgency_score(
        self,
        entity: Dict[str, Any],
        event_type: str,
        context: Dict[str, Any]
    ) -> int:
        """Calculate urgency from flags and event type."""
        score = 20  # Base score
        
        # High-priority event types
        urgent_events = [
            "booking.expiring",
            "booking.expired",
            "contract.review_overdue",
            "lead.sla_breach",
            "ai.critical_risk_deal",
        ]
        if event_type in urgent_events:
            score += 50
        
        # Urgency flags
        flags = entity.get("flags", {})
        if flags.get("urgent"):
            score += 30
        if flags.get("priority"):
            score += 20
        if flags.get("vip_customer"):
            score += 20
        
        # Context urgency
        if context.get("urgency") == "critical":
            score += 40
        elif context.get("urgency") == "high":
            score += 20
        
        return min(100, score)


# ==================== HELPER FUNCTIONS ====================

def calculate_priority(
    entity: Dict[str, Any],
    event_type: str = None,
    context: Dict[str, Any] = None
) -> int:
    """Quick helper to calculate priority."""
    calculator = PriorityCalculator()
    return calculator.calculate(entity, event_type, context)


def get_priority_level(score: int) -> PriorityLevel:
    """Convert numeric score to priority level."""
    if score >= 90:
        return PriorityLevel.CRITICAL
    elif score >= 70:
        return PriorityLevel.URGENT
    elif score >= 50:
        return PriorityLevel.HIGH
    elif score >= 30:
        return PriorityLevel.MEDIUM
    elif score >= 10:
        return PriorityLevel.LOW
    else:
        return PriorityLevel.BACKGROUND
