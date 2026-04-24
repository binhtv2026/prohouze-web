"""
Deal Risk Detection Engine
Prompt 18/20 - AI Decision Engine

Detects deals at risk of being lost.
Every risk assessment is explainable with clear signals.

Output:
- risk_level (critical/high/medium/low/none)
- risk_score (0-100, higher = more risky)
- signals (what triggered the risk)
- explanation (human-readable)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from .dto import (
    AISignal, AIScore, AIExplanation, AIRecommendation, AIActionSuggestion,
    DealRiskResult, RiskLevel, ConfidenceLevel, SignalType,
    RecommendationType, ActionType, ActionPriority,
    DEFAULT_DEAL_RISK_RULES
)
from .utils import (
    iso_now, get_now_utc, parse_iso_date, days_between,
    generate_id, get_risk_level_from_score, get_confidence_level
)


class DealRiskEngine:
    """
    AI Deal Risk Detection Engine
    
    Identifies deals at risk based on configurable rules.
    Every risk signal is traceable and explainable.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self._rules_collection = "ai_risk_rules"
        self._risks_collection = "ai_deal_risks"
        self._audit_collection = "ai_audit_logs"
    
    async def get_risk_rules(self) -> Dict[str, Any]:
        """Get risk rules from DB or use defaults."""
        rules = await self.db[self._rules_collection].find_one(
            {"rule_type": "deal_risk"},
            {"_id": 0}
        )
        if rules:
            return rules.get("rules", DEFAULT_DEAL_RISK_RULES)
        return DEFAULT_DEAL_RISK_RULES
    
    async def assess_deal_risk(self, deal_id: str) -> DealRiskResult:
        """
        Assess risk level for a deal.
        
        Returns:
            DealRiskResult with risk level, signals, explanation, and actions
        """
        now = get_now_utc()
        
        # Fetch deal data
        deal = await self.db.deals.find_one({"id": deal_id}, {"_id": 0})
        if not deal:
            raise ValueError(f"Deal not found: {deal_id}")
        
        # Fetch related data
        activities = await self._get_deal_activities(deal_id)
        lead = await self._get_lead(deal.get("lead_id"))
        contact = await self._get_contact(deal.get("contact_id"))
        
        # Get risk rules
        rules = await self.get_risk_rules()
        
        # Detect risk signals
        signals = []
        risk_factors = []
        total_risk = 0
        
        # 1. Stale Deal Risk
        stale_result = self._assess_stale_risk(deal, rules.get("stale_deal", {}))
        risk_factors.append(stale_result["factor"])
        total_risk += stale_result["risk"]
        if stale_result.get("signal"):
            signals.append(stale_result["signal"])
        
        # 2. No Recent Activity Risk
        activity_result = self._assess_activity_risk(deal, activities, rules.get("no_recent_activity", {}))
        risk_factors.append(activity_result["factor"])
        total_risk += activity_result["risk"]
        if activity_result.get("signal"):
            signals.append(activity_result["signal"])
        
        # 3. Stuck Stage Risk
        stuck_result = self._assess_stuck_stage_risk(deal, rules.get("stuck_stage", {}))
        risk_factors.append(stuck_result["factor"])
        total_risk += stuck_result["risk"]
        if stuck_result.get("signal"):
            signals.append(stuck_result["signal"])
        
        # 4. Low Engagement Risk
        engagement_result = await self._assess_engagement_risk(deal, activities, rules.get("low_engagement", {}))
        risk_factors.append(engagement_result["factor"])
        total_risk += engagement_result["risk"]
        if engagement_result.get("signal"):
            signals.append(engagement_result["signal"])
        
        # 5. Deadline Pressure Risk
        deadline_result = self._assess_deadline_risk(deal, rules.get("deadline_pressure", {}))
        risk_factors.append(deadline_result["factor"])
        total_risk += deadline_result["risk"]
        if deadline_result.get("signal"):
            signals.append(deadline_result["signal"])
        
        # Cap total risk at 100
        total_risk = min(100, total_risk)
        
        # Determine risk level
        risk_level = RiskLevel(get_risk_level_from_score(total_risk))
        
        # Calculate confidence
        confidence = self._calculate_confidence(deal, activities)
        confidence_level = ConfidenceLevel(get_confidence_level(confidence))
        
        # Generate explanation
        explanation = self._generate_explanation(deal, risk_factors, total_risk, signals)
        
        # Generate recommendation
        recommendation = self._generate_recommendation(deal, total_risk, risk_level, signals)
        
        # Generate action suggestions
        action_suggestions = self._generate_action_suggestions(deal, risk_level, recommendation)
        
        # Build result
        result = DealRiskResult(
            deal_id=deal_id,
            deal_code=deal.get("code", deal_id[:8]),
            deal_name=deal.get("customer_name") or contact.get("full_name", "Unknown") if contact else "Unknown",
            risk_level=risk_level,
            risk_score=total_risk,
            signals=signals,
            explanation=explanation,
            recommendation=recommendation,
            action_suggestions=action_suggestions,
            generated_at=iso_now()
        )
        
        # Log to audit
        await self._log_risk_assessment(result)
        
        # Save risk to DB
        await self._save_risk(result)
        
        return result
    
    def _assess_stale_risk(self, deal: Dict, rule: Dict) -> Dict[str, Any]:
        """Assess stale deal risk."""
        weight = rule.get("weight", 30)
        now = get_now_utc()
        
        updated_at = parse_iso_date(deal.get("updated_at") or deal.get("created_at"))
        days_stale = days_between(updated_at, now) if updated_at else 0
        
        risk = 0
        level = "none"
        reason = "Deal active"
        
        if days_stale >= 14:
            risk = 30
            level = "critical"
            reason = f"Deal khong cap nhat {days_stale} ngay"
        elif days_stale >= 7:
            risk = 20
            level = "high"
            reason = f"Deal khong cap nhat {days_stale} ngay"
        elif days_stale >= 3:
            risk = 10
            level = "medium"
            reason = f"Deal khong cap nhat {days_stale} ngay"
        
        signal = None
        if days_stale >= 7:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.STALE_ACTIVITY,
                signal_name="stale_deal",
                value=True,
                raw_data={"days_stale": days_stale, "last_updated": deal.get("updated_at")},
                detected_at=iso_now(),
                entity_type="deal",
                entity_id=deal.get("id"),
                metadata={"severity": level}
            )
        
        return {
            "factor": {
                "name": "stale_deal",
                "risk": risk,
                "max_risk": weight,
                "level": level,
                "reason": reason,
                "raw_value": days_stale,
                "display_value": f"{days_stale} ngay khong cap nhat"
            },
            "risk": risk,
            "signal": signal
        }
    
    def _assess_activity_risk(self, deal: Dict, activities: List[Dict], rule: Dict) -> Dict[str, Any]:
        """Assess no recent activity risk."""
        weight = rule.get("weight", 25)
        now = get_now_utc()
        week_ago = now - timedelta(days=7)
        
        # Count activities in last 7 days
        recent_activities = [
            a for a in activities
            if parse_iso_date(a.get("created_at")) and parse_iso_date(a.get("created_at")) >= week_ago
        ]
        activity_count = len(recent_activities)
        
        risk = 0
        level = "none"
        reason = "Deal active"
        
        if activity_count == 0:
            risk = 25
            level = "high"
            reason = "Khong co hoat dong trong 7 ngay"
        elif activity_count <= 2:
            risk = 15
            level = "medium"
            reason = f"Chi co {activity_count} hoat dong trong 7 ngay"
        
        signal = None
        if activity_count == 0:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.ENGAGEMENT,
                signal_name="no_recent_activity",
                value=True,
                raw_data={"activities_7d": 0},
                detected_at=iso_now(),
                entity_type="deal",
                entity_id=deal.get("id")
            )
        
        return {
            "factor": {
                "name": "no_recent_activity",
                "risk": risk,
                "max_risk": weight,
                "level": level,
                "reason": reason,
                "raw_value": activity_count,
                "display_value": f"{activity_count} hoat dong/7 ngay"
            },
            "risk": risk,
            "signal": signal
        }
    
    def _assess_stuck_stage_risk(self, deal: Dict, rule: Dict) -> Dict[str, Any]:
        """Assess stuck in stage risk."""
        weight = rule.get("weight", 20)
        now = get_now_utc()
        
        stage_changed_at = parse_iso_date(deal.get("stage_changed_at") or deal.get("created_at"))
        days_in_stage = days_between(stage_changed_at, now) if stage_changed_at else 0
        current_stage = deal.get("stage", "unknown")
        
        risk = 0
        level = "none"
        reason = "Stage progress normal"
        
        if days_in_stage >= 21:
            risk = 20
            level = "high"
            reason = f"Stuck o stage '{current_stage}' > 21 ngay"
        elif days_in_stage >= 14:
            risk = 15
            level = "medium"
            reason = f"O stage '{current_stage}' 14-21 ngay"
        elif days_in_stage >= 7:
            risk = 8
            level = "low"
            reason = f"O stage '{current_stage}' 7-14 ngay"
        
        signal = None
        if days_in_stage >= 14:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.DEAL_RISK,
                signal_name="stuck_stage",
                value=True,
                raw_data={"days_in_stage": days_in_stage, "stage": current_stage},
                detected_at=iso_now(),
                entity_type="deal",
                entity_id=deal.get("id")
            )
        
        return {
            "factor": {
                "name": "stuck_stage",
                "risk": risk,
                "max_risk": weight,
                "level": level,
                "reason": reason,
                "raw_value": days_in_stage,
                "display_value": f"{days_in_stage} ngay o stage {current_stage}"
            },
            "risk": risk,
            "signal": signal
        }
    
    async def _assess_engagement_risk(self, deal: Dict, activities: List[Dict], rule: Dict) -> Dict[str, Any]:
        """Assess customer engagement risk."""
        weight = rule.get("weight", 15)
        
        # Count activities with no response outcome
        no_response_count = sum(
            1 for a in activities
            if a.get("outcome") in ["no_answer", "no_response", "busy"]
        )
        
        risk = 0
        level = "none"
        reason = "Customer responsive"
        
        if no_response_count >= 3:
            risk = 15
            level = "high"
            reason = f"Khach khong phan hoi {no_response_count} lan lien he"
        elif no_response_count >= 2:
            risk = 10
            level = "medium"
            reason = f"Khach khong phan hoi {no_response_count} lan"
        elif no_response_count >= 1:
            risk = 5
            level = "low"
            reason = "Khach khong phan hoi 1 lan"
        
        signal = None
        if no_response_count >= 2:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.ENGAGEMENT,
                signal_name="low_customer_engagement",
                value=True,
                raw_data={"no_response_count": no_response_count},
                detected_at=iso_now(),
                entity_type="deal",
                entity_id=deal.get("id")
            )
        
        return {
            "factor": {
                "name": "low_engagement",
                "risk": risk,
                "max_risk": weight,
                "level": level,
                "reason": reason,
                "raw_value": no_response_count,
                "display_value": f"{no_response_count} lan khong phan hoi"
            },
            "risk": risk,
            "signal": signal
        }
    
    def _assess_deadline_risk(self, deal: Dict, rule: Dict) -> Dict[str, Any]:
        """Assess deadline pressure risk."""
        weight = rule.get("weight", 10)
        now = get_now_utc()
        
        # Check for booking expiry or expected close date
        deadline = None
        deadline_type = "none"
        
        if deal.get("booking_expires_at"):
            deadline = parse_iso_date(deal.get("booking_expires_at"))
            deadline_type = "booking_expiry"
        elif deal.get("expected_close_date"):
            deadline = parse_iso_date(deal.get("expected_close_date"))
            deadline_type = "expected_close"
        
        days_to_deadline = days_between(now, deadline) if deadline and deadline > now else 999
        
        risk = 0
        level = "none"
        reason = "No deadline pressure"
        
        if days_to_deadline <= 1:
            risk = 10
            level = "critical"
            reason = f"Deadline {deadline_type} trong 1 ngay"
        elif days_to_deadline <= 3:
            risk = 7
            level = "high"
            reason = f"Deadline {deadline_type} trong 3 ngay"
        elif days_to_deadline <= 7:
            risk = 4
            level = "medium"
            reason = f"Deadline {deadline_type} trong 1 tuan"
        
        signal = None
        if days_to_deadline <= 3:
            signal = AISignal(
                signal_id=generate_id("sig"),
                signal_type=SignalType.DEAL_RISK,
                signal_name="deadline_approaching",
                value=True,
                raw_data={"days_to_deadline": days_to_deadline, "deadline_type": deadline_type},
                detected_at=iso_now(),
                entity_type="deal",
                entity_id=deal.get("id")
            )
        
        return {
            "factor": {
                "name": "deadline_pressure",
                "risk": risk,
                "max_risk": weight,
                "level": level,
                "reason": reason,
                "raw_value": days_to_deadline,
                "display_value": f"{days_to_deadline} ngay den deadline" if days_to_deadline < 999 else "Khong co deadline"
            },
            "risk": risk,
            "signal": signal
        }
    
    def _calculate_confidence(self, deal: Dict, activities: List[Dict]) -> float:
        """Calculate confidence based on data quality."""
        confidence = 0.4  # Base
        
        if activities and len(activities) >= 3:
            confidence += 0.2
        elif activities and len(activities) >= 1:
            confidence += 0.1
        
        if deal.get("contact_id"):
            confidence += 0.1
        
        if deal.get("value") or deal.get("estimated_value"):
            confidence += 0.1
        
        if deal.get("stage"):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _generate_explanation(
        self,
        deal: Dict,
        risk_factors: List[Dict],
        total_risk: int,
        signals: List[AISignal]
    ) -> AIExplanation:
        """Generate human-readable risk explanation."""
        high_risk_factors = [f for f in risk_factors if f.get("level") in ["critical", "high"]]
        medium_risk_factors = [f for f in risk_factors if f.get("level") == "medium"]
        
        if total_risk >= 70:
            summary = f"Deal {deal.get('code', deal.get('id', '')[:8])} co RUI RO CAO ({total_risk}/100). Can hanh dong NGAY."
        elif total_risk >= 50:
            summary = f"Deal {deal.get('code', deal.get('id', '')[:8])} co rui ro trung binh ({total_risk}/100). Can chu y."
        elif total_risk >= 30:
            summary = f"Deal {deal.get('code', deal.get('id', '')[:8])} co it rui ro ({total_risk}/100). Can theo doi."
        else:
            summary = f"Deal {deal.get('code', deal.get('id', '')[:8])} an toan ({total_risk}/100)."
        
        positive_factors = [f"{f['name']}: {f['reason']}" for f in risk_factors if f.get("level") == "none"]
        negative_factors = [f"{f['name']}: {f['reason']}" for f in risk_factors if f.get("level") != "none"]
        
        key_insights = []
        if high_risk_factors:
            key_insights.append(f"Van de nghiem trong: {', '.join([f['name'] for f in high_risk_factors])}")
        if len(signals) > 0:
            key_insights.append(f"Phat hien {len(signals)} tin hieu canh bao")
        
        return AIExplanation(
            explanation_id=generate_id("exp"),
            summary=summary,
            detailed_breakdown=risk_factors,
            positive_factors=positive_factors,
            negative_factors=negative_factors,
            key_insights=key_insights,
            generated_at=iso_now()
        )
    
    def _generate_recommendation(
        self,
        deal: Dict,
        risk_score: int,
        risk_level: RiskLevel,
        signals: List[AISignal]
    ) -> AIRecommendation:
        """Generate recommendation based on risk assessment."""
        
        has_stale = any(s.signal_name == "stale_deal" for s in signals)
        has_no_response = any(s.signal_name == "low_customer_engagement" for s in signals)
        has_deadline = any(s.signal_name == "deadline_approaching" for s in signals)
        
        if risk_level == RiskLevel.CRITICAL:
            if has_deadline:
                rec_type = RecommendationType.CONTACT_NOW
                title = "Lien he khan cap"
                description = "Deal sap het han. Can lien he khach hang ngay lap tuc."
                rationale = "Deadline gan, rui ro mat deal neu khong hanh dong."
                expected_impact = "Tranh mat deal"
                priority = ActionPriority.URGENT
            else:
                rec_type = RecommendationType.ESCALATE
                title = "Leo thang len manager"
                description = "Deal co rui ro cuc cao. Can su can thiep cua quan ly."
                rationale = "Nhieu dau hieu rui ro nghiem trong."
                expected_impact = "Manager ho tro xu ly"
                priority = ActionPriority.URGENT
        elif risk_level == RiskLevel.HIGH:
            if has_stale:
                rec_type = RecommendationType.FOLLOW_UP
                title = "Tai kich hoat deal"
                description = "Deal da lau khong cap nhat. Can lien he lai khach."
                rationale = "Deal stale qua lau se mat."
                expected_impact = "Khoi phuc tien trinh"
                priority = ActionPriority.HIGH
            elif has_no_response:
                rec_type = RecommendationType.REASSIGN
                title = "Xem xet chuyen deal"
                description = "Khach khong phan hoi. Co the can nguoi moi tiep can."
                rationale = "Thay doi approach co the hieu qua hon."
                expected_impact = "Tang kha nang engagement"
                priority = ActionPriority.HIGH
            else:
                rec_type = RecommendationType.FOLLOW_UP
                title = "Follow up gap"
                description = "Deal co rui ro cao. Can hanh dong trong 24h."
                rationale = "Khong de deal roi vao vung nguy hiem."
                expected_impact = "Giam rui ro"
                priority = ActionPriority.HIGH
        elif risk_level == RiskLevel.MEDIUM:
            rec_type = RecommendationType.FOLLOW_UP
            title = "Dat lich follow up"
            description = "Deal can duoc theo doi thuong xuyen hon."
            rationale = "Phong ngua rui ro tang len."
            expected_impact = "Duy tri tien trinh"
            priority = ActionPriority.MEDIUM
        else:
            rec_type = RecommendationType.CLOSE_DEAL
            title = "Day manh chot deal"
            description = "Deal dang tot. Tap trung chot."
            rationale = "Khong co rui ro dang ke."
            expected_impact = "Chot deal thanh cong"
            priority = ActionPriority.MEDIUM
        
        confidence = max(0.5, 1 - risk_score / 200)
        
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
            entity_type="deal",
            entity_id=deal.get("id"),
            generated_at=iso_now()
        )
    
    def _generate_action_suggestions(
        self,
        deal: Dict,
        risk_level: RiskLevel,
        recommendation: AIRecommendation
    ) -> List[AIActionSuggestion]:
        """Generate action suggestions for deal."""
        actions = []
        deal_id = deal.get("id")
        deal_code = deal.get("code", deal_id[:8])
        
        # Primary action based on risk
        if risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
            actions.append(AIActionSuggestion(
                action_id=generate_id("act"),
                action_type=ActionType.CALL,
                label="Goi dien ngay",
                description="Lien he khach hang khan cap",
                params={"deal_id": deal_id},
                endpoint=f"/api/deals/{deal_id}/call",
                method="POST",
                icon="phone",
                priority=ActionPriority.URGENT,
                estimated_impact="Cao",
                entity_type="deal",
                entity_id=deal_id
            ))
            
            actions.append(AIActionSuggestion(
                action_id=generate_id("act"),
                action_type=ActionType.CREATE_ALERT,
                label="Tao canh bao",
                description="Tao alert trong Control Center",
                params={
                    "deal_id": deal_id,
                    "alert_type": "deal_at_risk",
                    "severity": risk_level.value
                },
                endpoint="/api/control-center/alerts",
                method="POST",
                icon="alert-triangle",
                priority=ActionPriority.HIGH,
                estimated_impact="Trung binh",
                entity_type="deal",
                entity_id=deal_id
            ))
        
        # Always suggest task creation
        actions.append(AIActionSuggestion(
            action_id=generate_id("act"),
            action_type=ActionType.CREATE_TASK,
            label="Tao task theo doi",
            description=f"Tao task cho deal {deal_code}",
            params={
                "deal_id": deal_id,
                "title": f"Follow up deal at risk: {deal_code}",
                "priority": recommendation.priority.value
            },
            endpoint="/api/tasks",
            method="POST",
            icon="clipboard-list",
            priority=ActionPriority.MEDIUM,
            estimated_impact="Trung binh",
            entity_type="deal",
            entity_id=deal_id
        ))
        
        # Suggest reassign if very risky
        if risk_level == RiskLevel.CRITICAL:
            actions.append(AIActionSuggestion(
                action_id=generate_id("act"),
                action_type=ActionType.REASSIGN,
                label="Chuyen cho nguoi khac",
                description="Chuyen deal cho sales khac",
                params={"deal_id": deal_id},
                endpoint=f"/api/deals/{deal_id}/reassign",
                method="POST",
                icon="users",
                priority=ActionPriority.MEDIUM,
                estimated_impact="Co the cao",
                entity_type="deal",
                entity_id=deal_id
            ))
        
        return actions
    
    async def _get_deal_activities(self, deal_id: str) -> List[Dict]:
        """Get deal activities."""
        activities = await self.db.activities.find(
            {"deal_id": deal_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return activities
    
    async def _get_lead(self, lead_id: str) -> Optional[Dict]:
        """Get lead by ID."""
        if not lead_id:
            return None
        return await self.db.leads.find_one({"id": lead_id}, {"_id": 0})
    
    async def _get_contact(self, contact_id: str) -> Optional[Dict]:
        """Get contact by ID."""
        if not contact_id:
            return None
        return await self.db.contacts.find_one({"id": contact_id}, {"_id": 0})
    
    async def _log_risk_assessment(self, result: DealRiskResult):
        """Log risk assessment to audit."""
        await self.db[self._audit_collection].insert_one({
            "id": generate_id("audit"),
            "action_type": "deal_risk_assessment",
            "entity_type": "deal",
            "entity_id": result.deal_id,
            "risk_level": result.risk_level.value,
            "risk_score": result.risk_score,
            "signals_count": len(result.signals),
            "recommendation": result.recommendation.recommendation_type.value,
            "generated_at": result.generated_at
        })
    
    async def _save_risk(self, result: DealRiskResult):
        """Save risk assessment to history."""
        risk_doc = {
            "id": generate_id("risk"),
            "deal_id": result.deal_id,
            "risk_level": result.risk_level.value,
            "risk_score": result.risk_score,
            "signals": [{"name": s.signal_name, "type": s.signal_type.value} for s in result.signals],
            "recommendation": result.recommendation.recommendation_type.value,
            "created_at": result.generated_at
        }
        await self.db[self._risks_collection].insert_one(risk_doc)
        
        # Update deal with latest risk
        await self.db.deals.update_one(
            {"id": result.deal_id},
            {"$set": {
                "ai_risk_level": result.risk_level.value,
                "ai_risk_score": result.risk_score,
                "ai_risk_assessed_at": result.generated_at
            }}
        )
    
    async def get_high_risk_deals(self, limit: int = 20) -> List[Dict]:
        """Get deals with high risk."""
        deals = await self.db.deals.find(
            {
                "ai_risk_level": {"$in": ["critical", "high"]},
                "stage": {"$nin": ["completed", "lost", "won", "cancelled"]}
            },
            {"_id": 0}
        ).sort("ai_risk_score", -1).limit(limit).to_list(limit)
        return deals
    
    async def batch_assess_deals(self, deal_ids: List[str]) -> List[DealRiskResult]:
        """Assess risk for multiple deals."""
        results = []
        for deal_id in deal_ids:
            try:
                result = await self.assess_deal_risk(deal_id)
                results.append(result)
            except Exception as e:
                pass
        return results
