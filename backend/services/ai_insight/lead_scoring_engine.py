"""
Lead Scoring Engine
Prompt 18/20 - AI Decision Engine

Rule-based, explainable lead scoring system.
NO BLACKBOX - every score component is traceable and configurable.

Output:
- score (0-100)
- factors (breakdown)
- explanation (human-readable)
- confidence
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from .dto import (
    AIScore, AISignal, AIExplanation, AIRecommendation, AIActionSuggestion,
    LeadScoreResult, ScoreLevel, ConfidenceLevel, SignalType, 
    RecommendationType, ActionType, ActionPriority,
    DEFAULT_LEAD_SCORING_RULES
)
from .utils import (
    iso_now, get_now_utc, parse_iso_date, days_between,
    generate_id, get_score_level, get_confidence_level
)


class LeadScoringEngine:
    """
    AI Lead Scoring Engine
    
    Calculates lead scores based on configurable rules.
    Every score is explainable with detailed breakdown.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._rules_collection = "ai_scoring_rules"
        self._scores_collection = "ai_lead_scores"
        self._audit_collection = "ai_audit_logs"
    
    async def get_scoring_rules(self) -> Dict[str, Any]:
        """Get scoring rules from DB or use defaults."""
        rules = await self.db[self._rules_collection].find_one(
            {"rule_type": "lead_scoring"},
            {"_id": 0}
        )
        if rules:
            return rules.get("rules", DEFAULT_LEAD_SCORING_RULES)
        return DEFAULT_LEAD_SCORING_RULES
    
    async def calculate_lead_score(self, lead_id: str) -> LeadScoreResult:
        """
        Calculate comprehensive lead score with full explanation.
        
        Returns:
            LeadScoreResult with score, explanation, recommendation, and actions
        """
        now = get_now_utc()
        
        # Fetch lead data
        lead = await self.db.leads.find_one({"id": lead_id}, {"_id": 0})
        if not lead:
            raise ValueError(f"Lead not found: {lead_id}")
        
        # Fetch related data
        activities = await self._get_lead_activities(lead_id)
        contact = await self._get_contact(lead.get("contact_id"))
        
        # Get scoring rules
        rules = await self.get_scoring_rules()
        
        # Calculate each factor
        factors = []
        signals = []
        total_score = 0
        total_weight = 0
        
        # 1. Budget Match Score
        budget_result = self._calculate_budget_score(lead, rules.get("budget_match", {}))
        factors.append(budget_result["factor"])
        total_score += budget_result["score"]
        total_weight += budget_result["weight"]
        if budget_result.get("signal"):
            signals.append(budget_result["signal"])
        
        # 2. Engagement Level Score
        engagement_result = self._calculate_engagement_score(lead, activities, rules.get("engagement_level", {}))
        factors.append(engagement_result["factor"])
        total_score += engagement_result["score"]
        total_weight += engagement_result["weight"]
        if engagement_result.get("signal"):
            signals.append(engagement_result["signal"])
        
        # 3. Recency Score
        recency_result = self._calculate_recency_score(lead, activities, rules.get("recency", {}))
        factors.append(recency_result["factor"])
        total_score += recency_result["score"]
        total_weight += recency_result["weight"]
        if recency_result.get("signal"):
            signals.append(recency_result["signal"])
        
        # 4. Source Quality Score
        source_result = self._calculate_source_score(lead, rules.get("source_quality", {}))
        factors.append(source_result["factor"])
        total_score += source_result["score"]
        total_weight += source_result["weight"]
        
        # 5. Stage Progress Score
        stage_result = self._calculate_stage_score(lead, rules.get("stage_progress", {}))
        factors.append(stage_result["factor"])
        total_score += stage_result["score"]
        total_weight += stage_result["weight"]
        
        # 6. Response Time Score
        response_result = await self._calculate_response_score(lead, activities, rules.get("response_time", {}))
        factors.append(response_result["factor"])
        total_score += response_result["score"]
        total_weight += response_result["weight"]
        if response_result.get("signal"):
            signals.append(response_result["signal"])
        
        # Calculate confidence based on data completeness
        confidence = self._calculate_confidence(lead, activities)
        
        # Create AI Score
        score_level = ScoreLevel(get_score_level(total_score))
        confidence_level = ConfidenceLevel(get_confidence_level(confidence))
        
        ai_score = AIScore(
            score_id=generate_id("score"),
            score_type="lead_score",
            score_value=total_score,
            score_level=score_level,
            factors=factors,
            confidence=confidence,
            confidence_level=confidence_level,
            calculated_at=iso_now(),
            entity_type="lead",
            entity_id=lead_id,
            version=1
        )
        
        # Create Explanation
        explanation = self._generate_explanation(lead, factors, total_score)
        
        # Create Recommendation
        recommendation = self._generate_recommendation(lead, total_score, factors, signals)
        
        # Create Action Suggestions
        action_suggestions = self._generate_action_suggestions(lead, total_score, recommendation)
        
        # Build result
        result = LeadScoreResult(
            lead_id=lead_id,
            lead_name=lead.get("full_name", "Unknown"),
            score=ai_score,
            explanation=explanation,
            recommendation=recommendation,
            action_suggestions=action_suggestions,
            signals=signals,
            generated_at=iso_now()
        )
        
        # Log to audit
        await self._log_scoring(result)
        
        # Save score to DB for history
        await self._save_score(result)
        
        return result
    
    def _calculate_budget_score(self, lead: Dict, rule: Dict) -> Dict[str, Any]:
        """Calculate budget match score."""
        weight = rule.get("weight", 25)
        rules = rule.get("rules", [])
        
        budget = lead.get("budget_max") or lead.get("budget_min") or 0
        score = 0
        reason = "No budget information"
        
        for r in rules:
            condition = r.get("condition", "")
            if "10B" in condition and budget >= 10_000_000_000:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "5B" in condition and budget >= 5_000_000_000:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "2B" in condition and budget >= 2_000_000_000:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "1B" in condition and budget >= 1_000_000_000:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "< 1B" in condition and budget < 1_000_000_000 and budget > 0:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
        
        signal = None
        if budget >= 5_000_000_000:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.BUDGET_MATCH,
                signal_name="high_value_budget",
                value=True,
                raw_data={"budget": budget},
                detected_at=iso_now(),
                entity_type="lead",
                entity_id=lead.get("id"),
                metadata={"budget_vnd": budget}
            )
        
        return {
            "factor": {
                "name": "budget_match",
                "score": score,
                "max_score": weight,
                "impact": f"+{score}" if score > 0 else "0",
                "reason": reason,
                "raw_value": budget,
                "display_value": f"{budget/1_000_000_000:.1f} tỷ" if budget >= 1_000_000_000 else f"{budget/1_000_000:.0f} triệu"
            },
            "score": score,
            "weight": weight,
            "signal": signal
        }
    
    def _calculate_engagement_score(self, lead: Dict, activities: List[Dict], rule: Dict) -> Dict[str, Any]:
        """Calculate engagement level score."""
        weight = rule.get("weight", 20)
        rules = rule.get("rules", [])
        
        interaction_count = len(activities)
        score = 0
        reason = "No engagement"
        
        for r in rules:
            condition = r.get("condition", "")
            if ">= 10" in condition and interaction_count >= 10:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif ">= 5" in condition and interaction_count >= 5:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif ">= 2" in condition and interaction_count >= 2:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif ">= 1" in condition and interaction_count >= 1:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "== 0" in condition and interaction_count == 0:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
        
        signal = None
        if interaction_count == 0:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.ENGAGEMENT,
                signal_name="no_engagement",
                value=True,
                raw_data={"interaction_count": 0},
                detected_at=iso_now(),
                entity_type="lead",
                entity_id=lead.get("id")
            )
        
        return {
            "factor": {
                "name": "engagement_level",
                "score": score,
                "max_score": weight,
                "impact": f"+{score}" if score > 0 else "0",
                "reason": reason,
                "raw_value": interaction_count,
                "display_value": f"{interaction_count} interactions"
            },
            "score": score,
            "weight": weight,
            "signal": signal
        }
    
    def _calculate_recency_score(self, lead: Dict, activities: List[Dict], rule: Dict) -> Dict[str, Any]:
        """Calculate recency score."""
        weight = rule.get("weight", 15)
        rules = rule.get("rules", [])
        now = get_now_utc()
        
        last_activity = lead.get("last_activity") or lead.get("updated_at") or lead.get("created_at")
        last_date = parse_iso_date(last_activity)
        days_since = days_between(last_date, now) if last_date else 999
        
        score = 0
        reason = "No recent activity"
        
        for r in rules:
            condition = r.get("condition", "")
            if "<= 1" in condition and days_since <= 1:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "<= 3" in condition and days_since <= 3:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "<= 7" in condition and days_since <= 7:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "<= 14" in condition and days_since <= 14:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
            elif "> 14" in condition and days_since > 14:
                score = r.get("score", 0)
                reason = r.get("reason", "")
                break
        
        signal = None
        if days_since > 7:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.STALE_ACTIVITY,
                signal_name="stale_lead",
                value=True,
                raw_data={"days_since_activity": days_since},
                detected_at=iso_now(),
                entity_type="lead",
                entity_id=lead.get("id")
            )
        
        return {
            "factor": {
                "name": "recency",
                "score": score,
                "max_score": weight,
                "impact": f"+{score}" if score > 0 else "0",
                "reason": reason,
                "raw_value": days_since,
                "display_value": f"{days_since} days ago"
            },
            "score": score,
            "weight": weight,
            "signal": signal
        }
    
    def _calculate_source_score(self, lead: Dict, rule: Dict) -> Dict[str, Any]:
        """Calculate source quality score."""
        weight = rule.get("weight", 15)
        rules = rule.get("rules", [])
        
        source = lead.get("channel") or lead.get("source") or "other"
        score = 5  # Default
        reason = "Unknown source"
        
        source_mapping = {
            "referral": 15, "event": 12, "website": 10,
            "facebook": 8, "linkedin": 8, "zalo": 8,
            "tiktok": 6, "youtube": 6, "google_ads": 10
        }
        
        score = source_mapping.get(source.lower(), 5)
        reason = f"{source.title()} source"
        
        return {
            "factor": {
                "name": "source_quality",
                "score": score,
                "max_score": weight,
                "impact": f"+{score}",
                "reason": reason,
                "raw_value": source,
                "display_value": source.title()
            },
            "score": score,
            "weight": weight
        }
    
    def _calculate_stage_score(self, lead: Dict, rule: Dict) -> Dict[str, Any]:
        """Calculate stage progress score."""
        weight = rule.get("weight", 15)
        
        stage = lead.get("status") or lead.get("stage") or "new"
        
        stage_mapping = {
            "deposit": 15, "negotiation": 13, "hot": 11,
            "warm": 9, "viewing": 7, "called": 6,
            "contacted": 5, "new": 3, "raw": 2
        }
        
        score = stage_mapping.get(stage.lower(), 3)
        reason = f"Stage: {stage}"
        
        return {
            "factor": {
                "name": "stage_progress",
                "score": score,
                "max_score": weight,
                "impact": f"+{score}",
                "reason": reason,
                "raw_value": stage,
                "display_value": stage.replace("_", " ").title()
            },
            "score": score,
            "weight": weight
        }
    
    async def _calculate_response_score(self, lead: Dict, activities: List[Dict], rule: Dict) -> Dict[str, Any]:
        """Calculate response time score."""
        weight = rule.get("weight", 10)
        
        # Calculate hours to first response
        created_at = parse_iso_date(lead.get("created_at"))
        first_activity = activities[0] if activities else None
        
        if first_activity and created_at:
            first_contact = parse_iso_date(first_activity.get("created_at"))
            if first_contact:
                hours_diff = (first_contact - created_at).total_seconds() / 3600
            else:
                hours_diff = 999
        else:
            hours_diff = 999
        
        if hours_diff <= 1:
            score = 10
            reason = "Response within 1 hour"
        elif hours_diff <= 4:
            score = 8
            reason = "Response within 4 hours"
        elif hours_diff <= 24:
            score = 5
            reason = "Response within 24 hours"
        else:
            score = 2
            reason = "Slow response (> 24h)"
        
        signal = None
        if hours_diff > 24:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.RESPONSE_DELAY,
                signal_name="slow_response",
                value=True,
                raw_data={"response_hours": hours_diff},
                detected_at=iso_now(),
                entity_type="lead",
                entity_id=lead.get("id")
            )
        
        return {
            "factor": {
                "name": "response_time",
                "score": score,
                "max_score": weight,
                "impact": f"+{score}" if score > 5 else f"+{score} (slow)",
                "reason": reason,
                "raw_value": hours_diff,
                "display_value": f"{hours_diff:.1f} hours" if hours_diff < 999 else "No response"
            },
            "score": score,
            "weight": weight,
            "signal": signal
        }
    
    def _calculate_confidence(self, lead: Dict, activities: List[Dict]) -> float:
        """Calculate confidence score based on data completeness."""
        confidence = 0.3  # Base confidence
        
        # Has budget info
        if lead.get("budget_min") or lead.get("budget_max"):
            confidence += 0.15
        
        # Has contact info
        if lead.get("email"):
            confidence += 0.1
        if lead.get("phone"):
            confidence += 0.1
        
        # Has activity data
        if len(activities) >= 3:
            confidence += 0.15
        elif len(activities) >= 1:
            confidence += 0.1
        
        # Has project interest
        if lead.get("project_interest") or lead.get("project_ids"):
            confidence += 0.1
        
        # Has source info
        if lead.get("channel") or lead.get("source"):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _generate_explanation(self, lead: Dict, factors: List[Dict], total_score: int) -> AIExplanation:
        """Generate human-readable explanation."""
        positive_factors = [f for f in factors if f.get("score", 0) >= f.get("max_score", 0) * 0.7]
        negative_factors = [f for f in factors if f.get("score", 0) <= f.get("max_score", 0) * 0.3]
        
        positive_list = [f"{f['name'].replace('_', ' ').title()}: {f['reason']}" for f in positive_factors]
        negative_list = [f"{f['name'].replace('_', ' ').title()}: {f['reason']}" for f in negative_factors]
        
        # Generate summary
        if total_score >= 80:
            summary = f"Lead {lead.get('full_name')} co diem so rat cao ({total_score}/100). Day la lead tiem nang lon."
        elif total_score >= 60:
            summary = f"Lead {lead.get('full_name')} co diem kha ({total_score}/100). Can tiep tuc cham soc."
        elif total_score >= 40:
            summary = f"Lead {lead.get('full_name')} co diem trung binh ({total_score}/100). Can danh gia them."
        else:
            summary = f"Lead {lead.get('full_name')} co diem thap ({total_score}/100). Uu tien nurture tu dong."
        
        key_insights = []
        if positive_factors:
            key_insights.append(f"Diem manh: {', '.join([f['name'] for f in positive_factors[:2]])}")
        if negative_factors:
            key_insights.append(f"Can cai thien: {', '.join([f['name'] for f in negative_factors[:2]])}")
        
        return AIExplanation(
            explanation_id=generate_id("exp"),
            summary=summary,
            detailed_breakdown=factors,
            positive_factors=positive_list,
            negative_factors=negative_list,
            key_insights=key_insights,
            generated_at=iso_now()
        )
    
    def _generate_recommendation(
        self,
        lead: Dict,
        score: int,
        factors: List[Dict],
        signals: List[AISignal]
    ) -> AIRecommendation:
        """Generate actionable recommendation based on score and signals."""
        
        # Determine recommendation type based on score and signals
        has_stale_signal = any(s.signal_name == "stale_lead" for s in signals)
        has_no_engagement = any(s.signal_name == "no_engagement" for s in signals)
        
        if score >= 80:
            rec_type = RecommendationType.CONTACT_NOW
            title = "Lien he ngay"
            description = "Lead co diem so rat cao. Uu tien lien he trong vong 1 gio."
            rationale = "Diem cao cho thay kha nang chuyen doi cao. Khong nen de mat co hoi."
            expected_impact = "Tang 50% kha nang chuyen doi"
            priority = ActionPriority.URGENT
        elif score >= 60:
            if has_stale_signal:
                rec_type = RecommendationType.FOLLOW_UP
                title = "Follow up ngay"
                description = "Lead tiem nang nhung chua duoc cham soc gan day."
                rationale = "Lead co tiem nang nhung da khong co tuong tac. Can tai kich hoat."
                expected_impact = "Khoi phuc engagement"
                priority = ActionPriority.HIGH
            else:
                rec_type = RecommendationType.SCHEDULE_MEETING
                title = "Dat lich hen"
                description = "Lead dang o giai doan tot. Nen dat lich gap mat hoac xem nha."
                rationale = "Diem kha cao, co the day nhanh qua trinh."
                expected_impact = "Tang 40% kha nang booking"
                priority = ActionPriority.HIGH
        elif score >= 40:
            rec_type = RecommendationType.NURTURE
            title = "Cham soc tu dong"
            description = "Lead can duoc nurture them truoc khi tap trung nguon luc."
            rationale = "Diem trung binh, can xay dung quan he truoc khi push sales."
            expected_impact = "Tang engagement tu tu"
            priority = ActionPriority.MEDIUM
        else:
            rec_type = RecommendationType.DEPRIORITIZE
            title = "Ha uu tien"
            description = "Lead chua san sang. Dua vao automation pipeline."
            rationale = "Diem thap, khong nen mat nhieu thoi gian cua sales."
            expected_impact = "Tiet kiem thoi gian sales"
            priority = ActionPriority.LOW
        
        confidence = min(0.9, 0.5 + score / 200)  # Higher score = higher confidence
        
        return AIRecommendation(
            recommendation_id=generate_id("rec"),
            recommendation_type=rec_type,
            title=title,
            description=description,
            rationale=rationale,
            expected_impact=expected_impact,
            priority=priority,
            confidence=confidence,
            confidence_level=ConfidenceLevel(get_confidence_level(confidence)),
            valid_until=None,
            entity_type="lead",
            entity_id=lead.get("id"),
            generated_at=iso_now()
        )
    
    def _generate_action_suggestions(
        self,
        lead: Dict,
        score: int,
        recommendation: AIRecommendation
    ) -> List[AIActionSuggestion]:
        """Generate clickable action suggestions."""
        actions = []
        lead_id = lead.get("id")
        lead_name = lead.get("full_name", "Lead")
        
        # Primary action based on recommendation
        if recommendation.recommendation_type == RecommendationType.CONTACT_NOW:
            actions.append(AIActionSuggestion(
                action_id=generate_id("act"),
                action_type=ActionType.CALL,
                label="Goi dien ngay",
                description=f"Goi cho {lead_name}",
                params={"lead_id": lead_id, "phone": lead.get("phone")},
                endpoint=f"/api/leads/{lead_id}/call",
                method="POST",
                icon="phone",
                priority=ActionPriority.URGENT,
                estimated_impact="Cao",
                entity_type="lead",
                entity_id=lead_id
            ))
        
        # Always suggest create task
        actions.append(AIActionSuggestion(
            action_id=generate_id("act"),
            action_type=ActionType.CREATE_TASK,
            label="Tao task follow-up",
            description="Tao nhac nho theo doi lead",
            params={
                "lead_id": lead_id,
                "title": f"Follow up: {lead_name}",
                "priority": recommendation.priority.value
            },
            endpoint="/api/tasks",
            method="POST",
            icon="clipboard-list",
            priority=ActionPriority.MEDIUM,
            estimated_impact="Trung binh",
            entity_type="lead",
            entity_id=lead_id
        ))
        
        # Add email if available
        if lead.get("email"):
            actions.append(AIActionSuggestion(
                action_id=generate_id("act"),
                action_type=ActionType.EMAIL,
                label="Gui email",
                description=f"Gui email cho {lead_name}",
                params={"lead_id": lead_id, "email": lead.get("email")},
                endpoint=f"/api/leads/{lead_id}/email",
                method="POST",
                icon="mail",
                priority=ActionPriority.MEDIUM,
                estimated_impact="Trung binh",
                entity_type="lead",
                entity_id=lead_id
            ))
        
        # Add note action
        actions.append(AIActionSuggestion(
            action_id=generate_id("act"),
            action_type=ActionType.ADD_NOTE,
            label="Them ghi chu",
            description="Ghi nhan thong tin moi",
            params={"lead_id": lead_id},
            endpoint=f"/api/leads/{lead_id}/notes",
            method="POST",
            icon="edit",
            priority=ActionPriority.LOW,
            estimated_impact="Thap",
            entity_type="lead",
            entity_id=lead_id
        ))
        
        return actions
    
    async def _get_lead_activities(self, lead_id: str) -> List[Dict]:
        """Get lead activities sorted by date."""
        activities = await self.db.activities.find(
            {"lead_id": lead_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        return activities
    
    async def _get_contact(self, contact_id: str) -> Optional[Dict]:
        """Get contact by ID."""
        if not contact_id:
            return None
        return await self.db.contacts.find_one({"id": contact_id}, {"_id": 0})
    
    async def _log_scoring(self, result: LeadScoreResult):
        """Log scoring to audit collection."""
        await self.db[self._audit_collection].insert_one({
            "id": generate_id("audit"),
            "action_type": "lead_scoring",
            "entity_type": "lead",
            "entity_id": result.lead_id,
            "score": result.score.score_value,
            "factors_count": len(result.score.factors),
            "recommendation": result.recommendation.recommendation_type.value,
            "confidence": result.score.confidence,
            "generated_at": result.generated_at
        })
    
    async def _save_score(self, result: LeadScoreResult):
        """Save score to history collection."""
        score_doc = {
            "id": result.score.score_id,
            "lead_id": result.lead_id,
            "score": result.score.score_value,
            "score_level": result.score.score_level.value,
            "confidence": result.score.confidence,
            "factors": result.score.factors,
            "recommendation_type": result.recommendation.recommendation_type.value,
            "created_at": result.generated_at
        }
        await self.db[self._scores_collection].insert_one(score_doc)
        
        # Update lead with latest score
        await self.db.leads.update_one(
            {"id": result.lead_id},
            {"$set": {
                "ai_score": result.score.score_value,
                "ai_score_level": result.score.score_level.value,
                "ai_scored_at": result.generated_at
            }}
        )
    
    async def get_score_history(self, lead_id: str, limit: int = 10) -> List[Dict]:
        """Get historical scores for a lead."""
        scores = await self.db[self._scores_collection].find(
            {"lead_id": lead_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return scores
    
    async def batch_score_leads(self, lead_ids: List[str]) -> List[LeadScoreResult]:
        """Score multiple leads at once."""
        results = []
        for lead_id in lead_ids:
            try:
                result = await self.calculate_lead_score(lead_id)
                results.append(result)
            except Exception as e:
                # Log error but continue with other leads
                pass
        return results
