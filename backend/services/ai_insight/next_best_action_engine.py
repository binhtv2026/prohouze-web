"""
Next Best Action Engine
Prompt 18/20 - AI Decision Engine

Recommends the most effective next step for any entity.
Combines lead score + deal risk + activity data to suggest actions.

Output:
- recommended_action
- priority
- expected_impact
- confidence
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from .dto import (
    AIActionSuggestion, NextBestActionResult, ConfidenceLevel,
    ActionType, ActionPriority, DEFAULT_NEXT_BEST_ACTION_RULES
)
from .utils import (
    iso_now, get_now_utc, parse_iso_date, days_between,
    generate_id, get_confidence_level
)


class NextBestActionEngine:
    """
    AI Next Best Action Engine
    
    Analyzes context and recommends the optimal next action.
    Integrates lead scoring and deal risk for comprehensive recommendations.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._rules_collection = "ai_nba_rules"
        self._audit_collection = "ai_audit_logs"
    
    async def get_nba_rules(self) -> Dict[str, Any]:
        """Get NBA rules from DB or use defaults."""
        rules = await self.db[self._rules_collection].find_one(
            {"rule_type": "next_best_action"},
            {"_id": 0}
        )
        if rules:
            return rules.get("rules", DEFAULT_NEXT_BEST_ACTION_RULES)
        return DEFAULT_NEXT_BEST_ACTION_RULES
    
    async def get_next_best_action(
        self,
        entity_type: str,
        entity_id: str,
        lead_score: Optional[int] = None,
        deal_risk_level: Optional[str] = None,
        deal_risk_score: Optional[int] = None
    ) -> NextBestActionResult:
        """
        Get the recommended next best action for an entity.
        
        Args:
            entity_type: 'lead' or 'deal'
            entity_id: ID of the entity
            lead_score: Pre-calculated lead score (optional)
            deal_risk_level: Pre-calculated risk level (optional)
            deal_risk_score: Pre-calculated risk score (optional)
        
        Returns:
            NextBestActionResult with primary and alternative actions
        """
        now = get_now_utc()
        
        # Fetch entity data
        if entity_type == "lead":
            entity = await self.db.leads.find_one({"id": entity_id}, {"_id": 0})
            entity_name = entity.get("full_name", "Unknown") if entity else "Unknown"
        elif entity_type == "deal":
            entity = await self.db.deals.find_one({"id": entity_id}, {"_id": 0})
            entity_name = entity.get("customer_name") or entity.get("code", entity_id[:8]) if entity else "Unknown"
        else:
            raise ValueError(f"Unsupported entity type: {entity_type}")
        
        if not entity:
            raise ValueError(f"{entity_type} not found: {entity_id}")
        
        # Get activity data
        activities = await self._get_activities(entity_type, entity_id)
        
        # Build context
        context = await self._build_context(
            entity_type, entity, activities,
            lead_score, deal_risk_level, deal_risk_score
        )
        
        # Get NBA rules
        rules = await self.get_nba_rules()
        
        # Evaluate rules and determine actions
        primary_action, alternative_actions = self._evaluate_rules(
            entity_type, entity, context, rules
        )
        
        # Calculate confidence
        confidence = self._calculate_confidence(context, primary_action)
        
        # Build rationale
        rationale = self._build_rationale(context, primary_action)
        
        result = NextBestActionResult(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            primary_action=primary_action,
            alternative_actions=alternative_actions,
            context=context,
            rationale=rationale,
            confidence=confidence,
            confidence_level=ConfidenceLevel(get_confidence_level(confidence)),
            generated_at=iso_now()
        )
        
        # Log to audit
        await self._log_nba(result)
        
        return result
    
    async def _build_context(
        self,
        entity_type: str,
        entity: Dict,
        activities: List[Dict],
        lead_score: Optional[int],
        deal_risk_level: Optional[str],
        deal_risk_score: Optional[int]
    ) -> Dict[str, Any]:
        """Build context for NBA evaluation."""
        now = get_now_utc()
        
        # Basic context
        context = {
            "entity_type": entity_type,
            "entity_id": entity.get("id"),
            "current_stage": entity.get("stage") or entity.get("status"),
            "created_at": entity.get("created_at"),
            "updated_at": entity.get("updated_at"),
            "activities_count": len(activities),
            "has_email": bool(entity.get("email")),
            "has_phone": bool(entity.get("phone")),
        }
        
        # Lead-specific context
        if entity_type == "lead":
            context.update({
                "lead_score": lead_score or entity.get("ai_score") or entity.get("score") or 50,
                "budget_min": entity.get("budget_min"),
                "budget_max": entity.get("budget_max"),
                "segment": entity.get("segment"),
                "source": entity.get("channel") or entity.get("source"),
                "assigned_to": entity.get("assigned_to"),
            })
        
        # Deal-specific context
        if entity_type == "deal":
            context.update({
                "deal_risk_level": deal_risk_level or entity.get("ai_risk_level") or "medium",
                "deal_risk_score": deal_risk_score or entity.get("ai_risk_score") or 30,
                "deal_value": entity.get("value") or entity.get("estimated_value") or 0,
                "expected_close": entity.get("expected_close_date"),
                "assigned_to": entity.get("assigned_to") or entity.get("owner_id"),
            })
        
        # Activity context
        if activities:
            last_activity = activities[0] if activities else None
            if last_activity:
                last_date = parse_iso_date(last_activity.get("created_at"))
                context["days_since_last_activity"] = days_between(last_date, now) if last_date else 999
                context["last_activity_type"] = last_activity.get("type")
                context["last_activity_outcome"] = last_activity.get("outcome")
            
            # Check if customer has been viewed
            context["has_viewed"] = any(
                a.get("type") in ["viewing", "site_visit"] for a in activities
            )
            
            # Check for scheduled follow-ups
            future_tasks = await self.db.tasks.find({
                f"{entity_type}_id": entity.get("id"),
                "status": {"$nin": ["completed", "cancelled"]},
                "due_date": {"$gte": now.isoformat()}
            }).to_list(5)
            context["has_scheduled_followup"] = len(future_tasks) > 0
            context["pending_tasks"] = len(future_tasks)
        else:
            context["days_since_last_activity"] = 999
            context["has_viewed"] = False
            context["has_scheduled_followup"] = False
            context["pending_tasks"] = 0
        
        return context
    
    def _evaluate_rules(
        self,
        entity_type: str,
        entity: Dict,
        context: Dict,
        rules: Dict
    ) -> tuple[AIActionSuggestion, List[AIActionSuggestion]]:
        """Evaluate NBA rules and return actions."""
        entity_id = entity.get("id")
        entity_name = context.get("entity_name", entity.get("full_name") or entity.get("code", entity_id[:8]))
        
        candidate_actions = []
        
        # Rule 1: High score, cold lead -> Call now
        if entity_type == "lead":
            lead_score = context.get("lead_score", 50)
            days_since = context.get("days_since_last_activity", 0)
            
            if lead_score >= 70 and days_since >= 3:
                candidate_actions.append({
                    "action": self._create_action(
                        ActionType.CALL, "Goi dien ngay",
                        f"Lead diem cao ({lead_score}) chua lien he {days_since} ngay",
                        {"lead_id": entity_id, "phone": entity.get("phone")},
                        f"/api/leads/{entity_id}/call", "phone",
                        ActionPriority.URGENT, "Tang 50% kha nang chuyen doi",
                        entity_type, entity_id
                    ),
                    "score": 100
                })
            
            if lead_score >= 60 and not context.get("has_viewed"):
                candidate_actions.append({
                    "action": self._create_action(
                        ActionType.SCHEDULE_MEETING, "Dat lich xem nha",
                        f"Lead tiem nang, chua xem du an",
                        {"lead_id": entity_id},
                        f"/api/leads/{entity_id}/schedule-viewing", "calendar",
                        ActionPriority.HIGH, "Tang 40% kha nang booking",
                        entity_type, entity_id
                    ),
                    "score": 85
                })
            
            if lead_score < 40 and context.get("has_email"):
                candidate_actions.append({
                    "action": self._create_action(
                        ActionType.EMAIL, "Gui email nurture",
                        f"Lead diem thap ({lead_score}), can nurture tu dong",
                        {"lead_id": entity_id, "email": entity.get("email")},
                        f"/api/leads/{entity_id}/email", "mail",
                        ActionPriority.MEDIUM, "Duy tri engagement",
                        entity_type, entity_id
                    ),
                    "score": 60
                })
        
        # Rule 2: High risk deal -> Immediate action
        if entity_type == "deal":
            risk_level = context.get("deal_risk_level", "medium")
            risk_score = context.get("deal_risk_score", 30)
            
            if risk_level in ["critical", "high"]:
                candidate_actions.append({
                    "action": self._create_action(
                        ActionType.CALL, "Lien he khan cap",
                        f"Deal rui ro {risk_level} (score: {risk_score}). Can xu ly ngay.",
                        {"deal_id": entity_id},
                        f"/api/deals/{entity_id}/call", "phone",
                        ActionPriority.URGENT, "Giam 30% ty le mat deal",
                        entity_type, entity_id
                    ),
                    "score": 100
                })
                
                candidate_actions.append({
                    "action": self._create_action(
                        ActionType.CREATE_ALERT, "Tao canh bao",
                        "Dua vao Control Center de theo doi",
                        {"deal_id": entity_id, "risk_level": risk_level},
                        "/api/control-center/alerts", "alert-triangle",
                        ActionPriority.HIGH, "Tang kha nang xu ly kip thoi",
                        entity_type, entity_id
                    ),
                    "score": 80
                })
            
            if risk_level == "medium":
                candidate_actions.append({
                    "action": self._create_action(
                        ActionType.CREATE_TASK, "Tao task follow-up",
                        "Dat lich theo doi deal",
                        {"deal_id": entity_id, "title": f"Follow up deal {entity.get('code', entity_id[:8])}"},
                        "/api/tasks", "clipboard-list",
                        ActionPriority.MEDIUM, "Duy tri tien trinh",
                        entity_type, entity_id
                    ),
                    "score": 70
                })
        
        # Rule 3: No scheduled follow-up -> Create task
        if not context.get("has_scheduled_followup"):
            candidate_actions.append({
                "action": self._create_action(
                    ActionType.CREATE_TASK, "Tao task follow-up",
                    f"Chua co lich hen tiep theo cho {entity_type}",
                    {f"{entity_type}_id": entity_id, "title": f"Follow up {entity_name}"},
                    "/api/tasks", "clipboard-list",
                    ActionPriority.MEDIUM, "Dam bao khong bo sot",
                    entity_type, entity_id
                ),
                "score": 50
            })
        
        # Default action: Add note
        candidate_actions.append({
            "action": self._create_action(
                ActionType.ADD_NOTE, "Cap nhat ghi chu",
                "Ghi nhan thong tin moi",
                {f"{entity_type}_id": entity_id},
                f"/api/{entity_type}s/{entity_id}/notes", "edit",
                ActionPriority.LOW, "Luu tru thong tin",
                entity_type, entity_id
            ),
            "score": 20
        })
        
        # Sort by score and return
        candidate_actions.sort(key=lambda x: x["score"], reverse=True)
        
        primary = candidate_actions[0]["action"]
        alternatives = [c["action"] for c in candidate_actions[1:4]]
        
        return primary, alternatives
    
    def _create_action(
        self,
        action_type: ActionType,
        label: str,
        description: str,
        params: Dict,
        endpoint: str,
        icon: str,
        priority: ActionPriority,
        impact: str,
        entity_type: str,
        entity_id: str
    ) -> AIActionSuggestion:
        """Create an action suggestion."""
        return AIActionSuggestion(
            action_id=generate_id("act"),
            action_type=action_type,
            label=label,
            description=description,
            params=params,
            endpoint=endpoint,
            method="POST",
            icon=icon,
            priority=priority,
            estimated_impact=impact,
            entity_type=entity_type,
            entity_id=entity_id
        )
    
    def _calculate_confidence(self, context: Dict, action: AIActionSuggestion) -> float:
        """Calculate confidence in the recommendation."""
        confidence = 0.5  # Base
        
        # More data = more confidence
        if context.get("activities_count", 0) >= 5:
            confidence += 0.15
        elif context.get("activities_count", 0) >= 2:
            confidence += 0.1
        
        # Known score/risk = more confidence
        if context.get("lead_score") or context.get("deal_risk_score"):
            confidence += 0.15
        
        # Urgent action = higher confidence (clearer signal)
        if action.priority == ActionPriority.URGENT:
            confidence += 0.1
        
        # Has contact info = actionable
        if context.get("has_phone") or context.get("has_email"):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _build_rationale(self, context: Dict, action: AIActionSuggestion) -> str:
        """Build human-readable rationale."""
        parts = []
        
        if context.get("entity_type") == "lead":
            score = context.get("lead_score", 50)
            if score >= 70:
                parts.append(f"Lead co diem cao ({score}/100)")
            elif score >= 40:
                parts.append(f"Lead co diem trung binh ({score}/100)")
            else:
                parts.append(f"Lead co diem thap ({score}/100)")
        
        if context.get("entity_type") == "deal":
            risk = context.get("deal_risk_level", "medium")
            if risk in ["critical", "high"]:
                parts.append(f"Deal co rui ro {risk}")
            else:
                parts.append("Deal dang on dinh")
        
        days = context.get("days_since_last_activity", 0)
        if days >= 7:
            parts.append(f"Khong co hoat dong {days} ngay")
        elif days >= 3:
            parts.append(f"Hoat dong cuoi {days} ngay truoc")
        
        if not context.get("has_scheduled_followup"):
            parts.append("Chua co lich hen")
        
        if parts:
            return ". ".join(parts) + f". De xuat: {action.label}."
        return f"De xuat: {action.label}."
    
    async def _get_activities(self, entity_type: str, entity_id: str) -> List[Dict]:
        """Get activities for entity."""
        query = {f"{entity_type}_id": entity_id}
        activities = await self.db.activities.find(
            query, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        return activities
    
    async def _log_nba(self, result: NextBestActionResult):
        """Log NBA to audit."""
        await self.db[self._audit_collection].insert_one({
            "id": generate_id("audit"),
            "action_type": "next_best_action",
            "entity_type": result.entity_type,
            "entity_id": result.entity_id,
            "recommended_action": result.primary_action.action_type.value,
            "confidence": result.confidence,
            "alternatives_count": len(result.alternative_actions),
            "generated_at": result.generated_at
        })
    
    async def get_batch_nba(
        self,
        entity_type: str,
        entity_ids: List[str]
    ) -> List[NextBestActionResult]:
        """Get NBA for multiple entities."""
        results = []
        for entity_id in entity_ids:
            try:
                result = await self.get_next_best_action(entity_type, entity_id)
                results.append(result)
            except Exception:
                pass
        return results
    
    async def get_today_actions(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """
        Get prioritized actions for today.
        Used for "Today Focus" panel in Control Center.
        """
        now = get_now_utc()
        actions = []
        
        # Get high-priority leads
        lead_query = {
            "ai_score": {"$gte": 60},
            "status": {"$nin": ["closed_won", "closed_lost", "converted"]}
        }
        if user_id:
            lead_query["assigned_to"] = user_id
        
        hot_leads = await self.db.leads.find(
            lead_query, {"_id": 0, "id": 1, "full_name": 1, "ai_score": 1, "phone": 1}
        ).sort("ai_score", -1).limit(limit // 2).to_list(limit // 2)
        
        for lead in hot_leads:
            actions.append({
                "entity_type": "lead",
                "entity_id": lead["id"],
                "entity_name": lead.get("full_name"),
                "action_type": "call",
                "action_label": "Goi dien",
                "priority": "high",
                "reason": f"Lead diem cao ({lead.get('ai_score', 0)})",
                "params": {"phone": lead.get("phone")}
            })
        
        # Get high-risk deals
        deal_query = {
            "ai_risk_level": {"$in": ["critical", "high"]},
            "stage": {"$nin": ["completed", "lost", "won", "cancelled"]}
        }
        if user_id:
            deal_query["$or"] = [{"assigned_to": user_id}, {"owner_id": user_id}]
        
        risky_deals = await self.db.deals.find(
            deal_query, {"_id": 0, "id": 1, "code": 1, "customer_name": 1, "ai_risk_level": 1, "ai_risk_score": 1}
        ).sort("ai_risk_score", -1).limit(limit // 2).to_list(limit // 2)
        
        for deal in risky_deals:
            actions.append({
                "entity_type": "deal",
                "entity_id": deal["id"],
                "entity_name": deal.get("customer_name") or deal.get("code"),
                "action_type": "follow_up",
                "action_label": "Follow up khan cap",
                "priority": "urgent",
                "reason": f"Deal rui ro {deal.get('ai_risk_level')} (score: {deal.get('ai_risk_score', 0)})",
                "params": {}
            })
        
        # Sort by priority
        priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
        actions.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 3))
        
        return actions[:limit]
