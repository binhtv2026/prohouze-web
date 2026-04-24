"""
Business Priority Engine
Prompt 19/20 - Automation Engine

Prioritizes automation execution based on business value.
Ensures high-value deals/leads are processed first.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


# ==================== PRIORITY LEVELS ====================

class PriorityLevel(str, Enum):
    """Priority levels for automation"""
    CRITICAL = "critical"   # Process immediately (90-100)
    HIGH = "high"           # Process within 5 minutes (70-89)
    MEDIUM = "medium"       # Process within 30 minutes (40-69)
    LOW = "low"             # Process within 1 hour (20-39)
    BACKGROUND = "background"  # Process when idle (0-19)


@dataclass
class PriorityScore:
    """Priority score result"""
    score: int  # 0-100
    level: PriorityLevel
    factors: Dict[str, int]  # Factor breakdown
    explanation: str


# ==================== PRIORITY FACTORS ====================

PRIORITY_FACTORS = {
    # Deal factors
    "deal_value": {
        "weight": 25,
        "thresholds": [
            (10_000_000_000, 25),  # > 10 tỷ = 25 points
            (5_000_000_000, 20),   # > 5 tỷ = 20 points
            (2_000_000_000, 15),   # > 2 tỷ = 15 points
            (500_000_000, 10),     # > 500 triệu = 10 points
            (0, 5),                # Default = 5 points
        ]
    },
    "lead_score": {
        "weight": 20,
        "thresholds": [
            (80, 20),   # Hot lead = 20 points
            (60, 15),   # Warm lead = 15 points
            (40, 10),   # Lukewarm = 10 points
            (0, 5),     # Cold = 5 points
        ]
    },
    "deal_stage": {
        "weight": 15,
        "stages": {
            "deposit_paid": 15,
            "negotiation": 12,
            "proposal": 10,
            "site_visit": 8,
            "qualified": 6,
            "new": 4,
        }
    },
    "risk_level": {
        "weight": 15,
        "levels": {
            "critical": 15,
            "high": 12,
            "medium": 8,
            "low": 4,
            "none": 0,
        }
    },
    "urgency": {
        "weight": 15,
        "factors": {
            "booking_expiring_today": 15,
            "booking_expiring_soon": 12,
            "contract_deadline": 10,
            "sla_breach": 10,
            "stale_deal": 6,
            "normal": 3,
        }
    },
    "recency": {
        "weight": 10,
        "thresholds": [
            (1, 10),    # < 1 hour old = 10 points
            (4, 8),     # < 4 hours = 8 points
            (24, 6),    # < 1 day = 6 points
            (72, 4),    # < 3 days = 4 points
            (168, 2),   # < 1 week = 2 points
            (999999, 1), # Older = 1 point
        ]
    }
}


# ==================== PRIORITY ENGINE ====================

class BusinessPriorityEngine:
    """
    Business Priority Engine.
    
    Calculates priority score for automation execution.
    Ensures high-value items are processed first.
    """
    
    def __init__(self, db):
        self.db = db
    
    async def calculate_priority(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any] = None,
        context: Dict[str, Any] = None
    ) -> PriorityScore:
        """
        Calculate priority score for an entity.
        
        Args:
            entity_type: leads, deals, bookings, etc.
            entity_id: Entity ID
            entity_data: Pre-fetched entity data (optional)
            context: Additional context (urgency type, etc.)
            
        Returns:
            PriorityScore with score 0-100 and breakdown
        """
        # Fetch entity if not provided
        if not entity_data and entity_type and entity_id:
            entity_data = await self.db[entity_type].find_one(
                {"id": entity_id}, {"_id": 0}
            )
        
        entity_data = entity_data or {}
        context = context or {}
        
        factors = {}
        explanations = []
        
        # Calculate each factor
        factors["deal_value"] = self._calc_deal_value_score(entity_data)
        factors["lead_score"] = self._calc_lead_score(entity_data)
        factors["deal_stage"] = self._calc_deal_stage_score(entity_data)
        factors["risk_level"] = self._calc_risk_score(entity_data, context)
        factors["urgency"] = self._calc_urgency_score(entity_data, context)
        factors["recency"] = self._calc_recency_score(entity_data)
        
        # Build explanations
        if factors["deal_value"] >= 20:
            explanations.append("Deal giá trị cao")
        if factors["lead_score"] >= 15:
            explanations.append("Lead tiềm năng")
        if factors["risk_level"] >= 10:
            explanations.append("Có rủi ro")
        if factors["urgency"] >= 10:
            explanations.append("Khẩn cấp")
        
        # Calculate total score
        total_score = sum(factors.values())
        total_score = min(100, max(0, total_score))  # Clamp to 0-100
        
        # Determine level
        if total_score >= 90:
            level = PriorityLevel.CRITICAL
        elif total_score >= 70:
            level = PriorityLevel.HIGH
        elif total_score >= 40:
            level = PriorityLevel.MEDIUM
        elif total_score >= 20:
            level = PriorityLevel.LOW
        else:
            level = PriorityLevel.BACKGROUND
        
        return PriorityScore(
            score=total_score,
            level=level,
            factors=factors,
            explanation=", ".join(explanations) if explanations else "Bình thường"
        )
    
    def _calc_deal_value_score(self, entity_data: Dict[str, Any]) -> int:
        """Calculate score based on deal value."""
        value = entity_data.get("value") or entity_data.get("estimated_value") or 0
        
        for threshold, score in PRIORITY_FACTORS["deal_value"]["thresholds"]:
            if value >= threshold:
                return score
        
        return 0
    
    def _calc_lead_score(self, entity_data: Dict[str, Any]) -> int:
        """Calculate score based on lead score."""
        score = entity_data.get("score") or entity_data.get("lead_score") or 0
        
        for threshold, points in PRIORITY_FACTORS["lead_score"]["thresholds"]:
            if score >= threshold:
                return points
        
        return 0
    
    def _calc_deal_stage_score(self, entity_data: Dict[str, Any]) -> int:
        """Calculate score based on deal stage."""
        stage = entity_data.get("stage", "").lower()
        stages = PRIORITY_FACTORS["deal_stage"]["stages"]
        
        return stages.get(stage, 4)  # Default 4 points
    
    def _calc_risk_score(self, entity_data: Dict[str, Any], context: Dict[str, Any]) -> int:
        """Calculate score based on risk level."""
        risk = context.get("risk_level") or entity_data.get("risk_level", "none")
        levels = PRIORITY_FACTORS["risk_level"]["levels"]
        
        return levels.get(risk, 0)
    
    def _calc_urgency_score(self, entity_data: Dict[str, Any], context: Dict[str, Any]) -> int:
        """Calculate score based on urgency."""
        urgency_type = context.get("urgency_type", "normal")
        factors = PRIORITY_FACTORS["urgency"]["factors"]
        
        # Check for booking expiry
        expires_at = entity_data.get("expires_at")
        if expires_at:
            try:
                expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                hours_left = (expiry - datetime.now(timezone.utc)).total_seconds() / 3600
                
                if hours_left <= 24:
                    return factors["booking_expiring_today"]
                elif hours_left <= 72:
                    return factors["booking_expiring_soon"]
            except Exception:
                pass
        
        return factors.get(urgency_type, factors["normal"])
    
    def _calc_recency_score(self, entity_data: Dict[str, Any]) -> int:
        """Calculate score based on how recent the entity is."""
        created_at = entity_data.get("created_at")
        if not created_at:
            return 1
        
        try:
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            hours_old = (datetime.now(timezone.utc) - created).total_seconds() / 3600
            
            for threshold, score in PRIORITY_FACTORS["recency"]["thresholds"]:
                if hours_old <= threshold:
                    return score
        except Exception:
            pass
        
        return 1
    
    async def get_prioritized_items(
        self,
        entity_type: str,
        items: List[Dict[str, Any]],
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Sort items by priority score.
        
        Returns items with priority_score added, sorted by score descending.
        """
        scored_items = []
        
        for item in items:
            priority = await self.calculate_priority(
                entity_type,
                item.get("id", ""),
                item,
                context
            )
            
            item["priority_score"] = priority.score
            item["priority_level"] = priority.level.value
            item["priority_explanation"] = priority.explanation
            
            scored_items.append(item)
        
        # Sort by priority (highest first)
        scored_items.sort(key=lambda x: x["priority_score"], reverse=True)
        
        return scored_items
    
    async def should_process(
        self,
        entity_type: str,
        entity_id: str,
        entity_data: Dict[str, Any] = None,
        min_priority: int = 0,
        context: Dict[str, Any] = None
    ) -> tuple[bool, PriorityScore]:
        """
        Check if entity should be processed based on minimum priority.
        
        Returns:
            (should_process: bool, priority: PriorityScore)
        """
        priority = await self.calculate_priority(
            entity_type, entity_id, entity_data, context
        )
        
        return priority.score >= min_priority, priority
