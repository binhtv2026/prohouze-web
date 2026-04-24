"""
AI Insight Orchestrator
Prompt 18/20 - AI Decision Engine (FINAL 10/10)

Core Brain that coordinates all AI engines.
Single entry point for all AI operations.

CRITICAL RULES:
- NO INSIGHT WITHOUT ACTION
- NO ACTION WITHOUT DEADLINE
- NO AI WITHOUT MONEY IMPACT
- NO DISPLAY WITHOUT EXECUTION

OUTPUT FORMAT (UNIFIED):
{
  "lead_score": {...},
  "deal_risk": {...},
  "next_action": {...},
  "money_impact": {...},  # CRITICAL
  "execution": {...}      # CRITICAL
}
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import time

from .lead_scoring_engine import LeadScoringEngine
from .deal_risk_engine import DealRiskEngine
from .next_best_action_engine import NextBestActionEngine
from .money_impact_engine import MoneyImpactEngine
from .action_execution_engine import ActionExecutionEngine
from .dto import (
    AIInsightResult, AIScore, AISignal, AIExplanation,
    LeadScoreResult, DealRiskResult, NextBestActionResult,
    ConfidenceLevel, RiskLevel
)
from .utils import iso_now, get_confidence_level, generate_id


class AIInsightOrchestrator:
    """
    AI Insight Orchestrator - Single Entry Point.
    
    FINAL 10/10: Mọi insight PHẢI có money impact và executable actions.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
        # Initialize all engines
        self.lead_scoring = LeadScoringEngine(db)
        self.deal_risk = DealRiskEngine(db)
        self.next_best_action = NextBestActionEngine(db)
        self.money_impact = MoneyImpactEngine(db)
        self.action_execution = ActionExecutionEngine(db)
        
        self._audit_collection = "ai_audit_logs"
    
    # ==================== UNIFIED INSIGHT (WITH MONEY) ====================
    
    async def get_lead_insight_full(self, lead_id: str) -> Dict[str, Any]:
        """
        Get COMPLETE AI insight for lead with money impact.
        This is the MAIN method for lead insights.
        
        Returns unified format:
        {
            "lead_score": {...},
            "money_impact": {...},   # CRITICAL
            "next_action": {...},
            "actions": [...]         # Executable actions
        }
        """
        start_time = time.time()
        
        # Get lead data
        lead = await self.db.leads.find_one({"id": lead_id}, {"_id": 0})
        if not lead:
            raise ValueError(f"Lead not found: {lead_id}")
        
        # Get activities
        activities = await self.db.activities.find(
            {"lead_id": lead_id}, {"_id": 0}
        ).to_list(50)
        
        # 1. Run lead scoring
        score_result = await self.lead_scoring.calculate_lead_score(lead_id)
        
        # 2. Calculate money impact (CRITICAL)
        money = await self.money_impact.calculate_lead_money_impact(
            lead=lead,
            lead_score=score_result.score.score_value,
            activities=activities
        )
        
        # 3. Get next best action
        nba_result = await self.next_best_action.get_next_best_action(
            entity_type="lead",
            entity_id=lead_id,
            lead_score=score_result.score.score_value
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Build executable actions
        actions = self._build_executable_actions(
            entity_type="lead",
            entity_id=lead_id,
            entity_name=lead.get("full_name", "Lead"),
            score_result=score_result,
            money_impact=money,
            nba_result=nba_result
        )
        
        return {
            "entity_type": "lead",
            "entity_id": lead_id,
            "entity_name": lead.get("full_name", "Lead"),
            "lead_score": {
                "score": score_result.score.score_value,
                "level": score_result.score.score_level.value,
                "confidence": score_result.score.confidence,
                "factors": score_result.score.factors
            },
            "money_impact": money,
            "next_action": {
                "action": nba_result.primary_action.action_type.value,
                "priority": nba_result.primary_action.priority.value,
                "label": nba_result.primary_action.label,
                "deadline": money.get("deadline"),
                "reason": nba_result.rationale,
                "confidence": nba_result.confidence
            },
            "explanation": {
                "summary": score_result.explanation.summary,
                "key_insights": score_result.explanation.key_insights,
                "positive": score_result.explanation.positive_factors,
                "negative": score_result.explanation.negative_factors
            },
            "actions": actions,
            "signals": [
                {"name": s.signal_name, "type": s.signal_type.value, "value": s.value}
                for s in score_result.signals
            ],
            "processing_time_ms": processing_time,
            "generated_at": iso_now()
        }
    
    async def get_deal_insight_full(self, deal_id: str) -> Dict[str, Any]:
        """
        Get COMPLETE AI insight for deal with money impact.
        This is the MAIN method for deal insights.
        """
        start_time = time.time()
        
        # Get deal data
        deal = await self.db.deals.find_one({"id": deal_id}, {"_id": 0})
        if not deal:
            raise ValueError(f"Deal not found: {deal_id}")
        
        # 1. Assess deal risk
        risk_result = await self.deal_risk.assess_deal_risk(deal_id)
        
        # 2. Calculate money impact (CRITICAL)
        money = await self.money_impact.calculate_deal_money_impact(
            deal=deal,
            risk_score=risk_result.risk_score,
            risk_level=risk_result.risk_level.value
        )
        
        # 3. Get next best action
        nba_result = await self.next_best_action.get_next_best_action(
            entity_type="deal",
            entity_id=deal_id,
            deal_risk_level=risk_result.risk_level.value,
            deal_risk_score=risk_result.risk_score
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Build executable actions
        actions = self._build_deal_executable_actions(
            deal=deal,
            risk_result=risk_result,
            money_impact=money,
            nba_result=nba_result
        )
        
        return {
            "entity_type": "deal",
            "entity_id": deal_id,
            "entity_name": deal.get("customer_name") or deal.get("code", deal_id[:8]),
            "deal_code": deal.get("code", deal_id[:8]),
            "deal_risk": {
                "risk_score": risk_result.risk_score,
                "risk_level": risk_result.risk_level.value,
                "signals": [
                    {"name": s.signal_name, "type": s.signal_type.value, "value": s.value}
                    for s in risk_result.signals
                ]
            },
            "money_impact": money,
            "next_action": {
                "action": nba_result.primary_action.action_type.value,
                "priority": nba_result.primary_action.priority.value,
                "label": nba_result.primary_action.label,
                "deadline": money.get("deadline"),
                "reason": nba_result.rationale,
                "confidence": nba_result.confidence
            },
            "explanation": {
                "summary": risk_result.explanation.summary,
                "key_insights": risk_result.explanation.key_insights,
                "positive": risk_result.explanation.positive_factors,
                "negative": risk_result.explanation.negative_factors
            },
            "actions": actions,
            "processing_time_ms": processing_time,
            "generated_at": iso_now()
        }
    
    def _build_executable_actions(
        self,
        entity_type: str,
        entity_id: str,
        entity_name: str,
        score_result,
        money_impact: Dict,
        nba_result
    ) -> List[Dict]:
        """Build list of executable actions with money context."""
        actions = []
        urgency = money_impact.get("urgency", "medium")
        
        # Primary action from NBA
        primary = nba_result.primary_action
        actions.append({
            "action_type": primary.action_type.value,
            "label": primary.label,
            "description": primary.description,
            "priority": urgency,
            "deadline": money_impact.get("deadline"),
            "money_message": money_impact.get("message"),
            "expected_impact": f"Potential: {money_impact.get('expected_value', 0):,} VND",
            "params": {
                "entity_type": entity_type,
                "entity_id": entity_id,
                "title": f"{primary.label}: {entity_name}",
                "reason": money_impact.get("message")
            },
            "is_primary": True
        })
        
        # Alternative actions
        for alt in nba_result.alternative_actions[:2]:
            actions.append({
                "action_type": alt.action_type.value,
                "label": alt.label,
                "description": alt.description,
                "priority": alt.priority.value,
                "params": {
                    "entity_type": entity_type,
                    "entity_id": entity_id
                },
                "is_primary": False
            })
        
        return actions
    
    def _build_deal_executable_actions(
        self,
        deal: Dict,
        risk_result,
        money_impact: Dict,
        nba_result
    ) -> List[Dict]:
        """Build executable actions for deal."""
        actions = []
        urgency = money_impact.get("urgency", "medium")
        deal_id = deal.get("id")
        deal_name = deal.get("customer_name") or deal.get("code", deal_id[:8])
        
        # If critical/high risk -> urgent actions
        if risk_result.risk_level.value in ["critical", "high"]:
            actions.append({
                "action_type": "call",
                "label": "Gọi khách NGAY",
                "description": f"Deal {money_impact.get('formatted', {}).get('total', '')} đang có rủi ro",
                "priority": "urgent",
                "deadline": money_impact.get("deadline"),
                "money_message": money_impact.get("message"),
                "params": {
                    "entity_type": "deal",
                    "entity_id": deal_id,
                    "reason": money_impact.get("message")
                },
                "is_primary": True
            })
            
            actions.append({
                "action_type": "escalate",
                "label": "Escalate Manager",
                "description": "Báo cáo manager để hỗ trợ",
                "priority": "high",
                "params": {
                    "entity_type": "deal",
                    "entity_id": deal_id,
                    "reason": f"Deal {deal_name} có rủi ro {risk_result.risk_level.value}"
                },
                "is_primary": False
            })
        
        # Primary NBA action
        primary = nba_result.primary_action
        if not actions or primary.action_type.value != "call":
            actions.append({
                "action_type": primary.action_type.value,
                "label": primary.label,
                "description": primary.description,
                "priority": urgency,
                "deadline": money_impact.get("deadline"),
                "money_message": money_impact.get("message"),
                "params": {
                    "entity_type": "deal",
                    "entity_id": deal_id
                },
                "is_primary": len(actions) == 0
            })
        
        # Create task action
        actions.append({
            "action_type": "create_task",
            "label": "Tạo Task",
            "description": f"Tạo task follow up cho {deal_name}",
            "priority": "medium",
            "params": {
                "entity_type": "deal",
                "entity_id": deal_id,
                "title": f"Follow up: {deal_name}",
                "priority": urgency
            },
            "is_primary": False
        })
        
        return actions
    
    # ==================== ACTION EXECUTION ====================
    
    async def execute_action(
        self,
        action_type: str,
        entity_type: str,
        entity_id: str,
        params: Dict[str, Any],
        executed_by: str
    ) -> Dict[str, Any]:
        """
        Execute an AI-recommended action for real.
        Click phải chạy thật!
        """
        # Get AI context for logging
        ai_context = None
        if entity_type == "lead":
            try:
                insight = await self.get_lead_insight_full(entity_id)
                ai_context = {
                    "lead_score": insight.get("lead_score", {}).get("score"),
                    "money_impact": insight.get("money_impact")
                }
            except:
                pass
        elif entity_type == "deal":
            try:
                insight = await self.get_deal_insight_full(entity_id)
                ai_context = {
                    "risk_score": insight.get("deal_risk", {}).get("risk_score"),
                    "money_impact": insight.get("money_impact")
                }
            except:
                pass
        
        return await self.action_execution.execute_action(
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            params=params,
            executed_by=executed_by,
            ai_context=ai_context
        )
    
    async def batch_execute_actions(
        self,
        actions: List[Dict],
        executed_by: str
    ) -> Dict[str, Any]:
        """Execute multiple actions in batch."""
        return await self.action_execution.batch_execute(actions, executed_by)
    
    # ==================== WAR ROOM DATA ====================
    
    async def get_war_room_data(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get WAR ROOM dashboard data.
        - Revenue at risk
        - Deals cần xử lý hôm nay
        - AI recommended actions
        """
        # Revenue at risk
        revenue_at_risk = await self.money_impact.calculate_pipeline_revenue_at_risk(user_id)
        
        # Today opportunity
        today_opportunity = await self.money_impact.calculate_today_opportunity(user_id)
        
        # Today's AI actions
        today_actions = await self.get_today_actions_with_money(user_id, limit=10)
        
        # High risk deals requiring immediate action
        high_risk_deals = await self._get_deals_needing_action_today(user_id)
        
        # Hot leads not contacted
        hot_leads = await self._get_hot_leads_needing_action(user_id)
        
        return {
            "revenue_at_risk": revenue_at_risk,
            "today_opportunity": today_opportunity,
            "today_actions": today_actions,
            "deals_today": high_risk_deals,
            "hot_leads": hot_leads,
            "summary": {
                "total_at_risk": revenue_at_risk.get("total_revenue_at_risk", 0),
                "total_opportunity": today_opportunity.get("total_opportunity", 0),
                "actions_count": len(today_actions.get("actions", [])),
                "deals_count": len(high_risk_deals),
                "leads_count": len(hot_leads)
            },
            "generated_at": iso_now()
        }
    
    async def get_today_actions_with_money(
        self,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get today's actions with money impact."""
        actions = []
        
        # Get high risk deals
        deal_query = {
            "ai_risk_level": {"$in": ["critical", "high"]},
            "stage": {"$nin": ["completed", "lost", "won", "cancelled"]}
        }
        if user_id:
            deal_query["$or"] = [{"assigned_to": user_id}, {"owner_id": user_id}]
        
        risky_deals = await self.db.deals.find(deal_query, {"_id": 0}).limit(limit // 2).to_list(limit // 2)
        
        for deal in risky_deals:
            deal_value = deal.get("value") or deal.get("estimated_value") or 0
            money = await self.money_impact.calculate_deal_money_impact(
                deal=deal,
                risk_score=deal.get("ai_risk_score", 50),
                risk_level=deal.get("ai_risk_level", "high")
            )
            
            actions.append({
                "entity_type": "deal",
                "entity_id": deal["id"],
                "entity_name": deal.get("customer_name") or deal.get("code"),
                "action_type": "call",
                "action_label": "Gọi khách NGAY",
                "priority": money.get("urgency", "high"),
                "deadline": money.get("deadline"),
                "money_impact": money,
                "reason": money.get("message"),
                "value": deal_value
            })
        
        # Get hot leads
        lead_query = {
            "ai_score": {"$gte": 65},
            "status": {"$nin": ["closed_won", "closed_lost", "converted"]}
        }
        if user_id:
            lead_query["assigned_to"] = user_id
        
        hot_leads = await self.db.leads.find(lead_query, {"_id": 0}).limit(limit // 2).to_list(limit // 2)
        
        for lead in hot_leads:
            money = await self.money_impact.calculate_lead_money_impact(
                lead=lead,
                lead_score=lead.get("ai_score", 70)
            )
            
            actions.append({
                "entity_type": "lead",
                "entity_id": lead["id"],
                "entity_name": lead.get("full_name"),
                "action_type": "call",
                "action_label": "Liên hệ ngay",
                "priority": money.get("urgency", "high"),
                "deadline": money.get("deadline"),
                "money_impact": money,
                "reason": money.get("message"),
                "value": money.get("expected_value", 0)
            })
        
        # Sort by priority and value
        priority_order = {"critical": 0, "urgent": 1, "high": 2, "medium": 3, "low": 4}
        actions.sort(key=lambda x: (priority_order.get(x.get("priority"), 3), -x.get("value", 0)))
        
        return {
            "actions": actions[:limit],
            "count": len(actions[:limit]),
            "total_value_at_stake": sum(a.get("value", 0) for a in actions[:limit])
        }
    
    async def _get_deals_needing_action_today(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get deals that need action today."""
        query = {
            "ai_risk_level": {"$in": ["critical", "high"]},
            "stage": {"$nin": ["completed", "lost", "won", "cancelled"]}
        }
        if user_id:
            query["$or"] = [{"assigned_to": user_id}, {"owner_id": user_id}]
        
        deals = await self.db.deals.find(query, {"_id": 0}).sort("ai_risk_score", -1).limit(10).to_list(10)
        
        result = []
        for deal in deals:
            money = await self.money_impact.calculate_deal_money_impact(
                deal=deal,
                risk_score=deal.get("ai_risk_score", 50),
                risk_level=deal.get("ai_risk_level", "high")
            )
            result.append({
                "deal_id": deal["id"],
                "code": deal.get("code"),
                "customer_name": deal.get("customer_name"),
                "value": deal.get("value") or deal.get("estimated_value", 0),
                "risk_level": deal.get("ai_risk_level"),
                "risk_score": deal.get("ai_risk_score"),
                "money_impact": money,
                "stage": deal.get("stage")
            })
        
        return result
    
    async def _get_hot_leads_needing_action(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get hot leads needing immediate action."""
        query = {
            "ai_score": {"$gte": 65},
            "status": {"$nin": ["closed_won", "closed_lost", "converted"]}
        }
        if user_id:
            query["assigned_to"] = user_id
        
        leads = await self.db.leads.find(query, {"_id": 0}).sort("ai_score", -1).limit(10).to_list(10)
        
        result = []
        for lead in leads:
            money = await self.money_impact.calculate_lead_money_impact(
                lead=lead,
                lead_score=lead.get("ai_score", 70)
            )
            result.append({
                "lead_id": lead["id"],
                "full_name": lead.get("full_name"),
                "phone": lead.get("phone"),
                "score": lead.get("ai_score"),
                "money_impact": money,
                "status": lead.get("status")
            })
        
        return result
    
    # ==================== LEGACY INSIGHT METHODS (for backward compatibility) ====================
    
    async def get_lead_insight(self, lead_id: str) -> AIInsightResult:
        """Legacy method - use get_lead_insight_full instead."""
        full = await self.get_lead_insight_full(lead_id)
        # Convert to legacy format
        score_result = await self.lead_scoring.calculate_lead_score(lead_id)
        nba_result = await self.next_best_action.get_next_best_action("lead", lead_id)
        
        return AIInsightResult(
            entity_type="lead",
            entity_id=lead_id,
            entity_name=full.get("entity_name"),
            lead_score=score_result.score,
            next_best_action=nba_result,
            signals=score_result.signals,
            explanation=score_result.explanation,
            action_suggestions=score_result.action_suggestions,
            overall_confidence=score_result.score.confidence,
            confidence_level=ConfidenceLevel(get_confidence_level(score_result.score.confidence)),
            generated_at=iso_now(),
            processing_time_ms=full.get("processing_time_ms", 0),
            model_version="1.0.0"
        )
    
    async def get_deal_insight(self, deal_id: str) -> AIInsightResult:
        """Legacy method - use get_deal_insight_full instead."""
        full = await self.get_deal_insight_full(deal_id)
        risk_result = await self.deal_risk.assess_deal_risk(deal_id)
        nba_result = await self.next_best_action.get_next_best_action("deal", deal_id)
        
        return AIInsightResult(
            entity_type="deal",
            entity_id=deal_id,
            entity_name=full.get("entity_name"),
            deal_risk=risk_result,
            next_best_action=nba_result,
            signals=risk_result.signals,
            explanation=risk_result.explanation,
            action_suggestions=risk_result.action_suggestions,
            overall_confidence=risk_result.recommendation.confidence,
            confidence_level=ConfidenceLevel(get_confidence_level(risk_result.recommendation.confidence)),
            generated_at=iso_now(),
            processing_time_ms=full.get("processing_time_ms", 0),
            model_version="1.0.0"
        )
    
    # ==================== LEAD SCORING ====================
    
    async def get_lead_score(self, lead_id: str) -> LeadScoreResult:
        """Get lead score with full explanation."""
        return await self.lead_scoring.calculate_lead_score(lead_id)
    
    async def get_lead_score_history(self, lead_id: str, limit: int = 10) -> List[Dict]:
        """Get historical scores for a lead."""
        return await self.lead_scoring.get_score_history(lead_id, limit)
    
    async def batch_score_leads(self, lead_ids: List[str]) -> List[LeadScoreResult]:
        """Score multiple leads."""
        return await self.lead_scoring.batch_score_leads(lead_ids)
    
    # ==================== DEAL RISK ====================
    
    async def get_deal_risk(self, deal_id: str) -> DealRiskResult:
        """Get deal risk assessment."""
        return await self.deal_risk.assess_deal_risk(deal_id)
    
    async def get_high_risk_deals(self, limit: int = 20) -> List[Dict]:
        """Get deals with high risk."""
        return await self.deal_risk.get_high_risk_deals(limit)
    
    async def batch_assess_deals(self, deal_ids: List[str]) -> List[DealRiskResult]:
        """Assess risk for multiple deals."""
        return await self.deal_risk.batch_assess_deals(deal_ids)
    
    # ==================== NEXT BEST ACTION ====================
    
    async def get_next_best_action(
        self,
        entity_type: str,
        entity_id: str,
        **kwargs
    ) -> NextBestActionResult:
        """Get next best action for entity."""
        return await self.next_best_action.get_next_best_action(
            entity_type, entity_id, **kwargs
        )
    
    async def get_today_actions(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get prioritized actions for today."""
        return await self.next_best_action.get_today_actions(user_id, limit)
    
    # ==================== CONTROL CENTER INTEGRATION ====================
    
    async def create_ai_driven_alerts(self) -> Dict[str, Any]:
        """
        Create alerts in Control Center based on AI insights.
        Called periodically or on-demand.
        """
        alerts_created = 0
        now = iso_now()
        
        # Get high-risk deals
        high_risk_deals = await self.deal_risk.get_high_risk_deals(limit=50)
        
        for deal in high_risk_deals:
            # Check if alert already exists
            existing = await self.db.control_alerts.find_one({
                "source_id": deal["id"],
                "rule_code": "ai_deal_risk",
                "is_resolved": False
            })
            
            if not existing:
                risk_level = deal.get("ai_risk_level", "high")
                alert = {
                    "id": generate_id("alert"),
                    "category": "pipeline",
                    "severity": "critical" if risk_level == "critical" else "high",
                    "urgency": "critical" if risk_level == "critical" else "high",
                    "title": f"[AI] Deal co rui ro {risk_level}",
                    "description": f"AI phat hien deal {deal.get('code', deal['id'][:8])} co rui ro {risk_level}. Can xu ly ngay.",
                    "source_entity": "deals",
                    "source_id": deal["id"],
                    "owner_id": deal.get("assigned_to") or deal.get("owner_id"),
                    "recommended_actions": ["call", "create_task", "escalate"],
                    "metrics": {
                        "risk_score": deal.get("ai_risk_score", 0),
                        "risk_level": risk_level
                    },
                    "created_at": now,
                    "rule_code": "ai_deal_risk",
                    "is_ai_generated": True,
                    "is_resolved": False,
                    "is_acknowledged": False
                }
                await self.db.control_alerts.insert_one(alert)
                alerts_created += 1
        
        # Get hot leads without follow-up
        hot_leads = await self.db.leads.find({
            "ai_score": {"$gte": 70},
            "status": {"$nin": ["closed_won", "closed_lost", "converted"]}
        }, {"_id": 0}).limit(50).to_list(50)
        
        for lead in hot_leads:
            # Check for recent tasks
            recent_task = await self.db.tasks.find_one({
                "lead_id": lead["id"],
                "status": {"$nin": ["completed", "cancelled"]},
                "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()}
            })
            
            if not recent_task:
                existing = await self.db.control_alerts.find_one({
                    "source_id": lead["id"],
                    "rule_code": "ai_hot_lead_no_followup",
                    "is_resolved": False
                })
                
                if not existing:
                    alert = {
                        "id": generate_id("alert"),
                        "category": "sales",
                        "severity": "high",
                        "urgency": "high",
                        "title": f"[AI] Lead tiem nang chua duoc follow-up",
                        "description": f"Lead {lead.get('full_name')} co diem {lead.get('ai_score', 0)} nhung chua co task follow-up.",
                        "source_entity": "leads",
                        "source_id": lead["id"],
                        "owner_id": lead.get("assigned_to"),
                        "recommended_actions": ["call", "create_task"],
                        "metrics": {
                            "lead_score": lead.get("ai_score", 0)
                        },
                        "created_at": now,
                        "rule_code": "ai_hot_lead_no_followup",
                        "is_ai_generated": True,
                        "is_resolved": False,
                        "is_acknowledged": False
                    }
                    await self.db.control_alerts.insert_one(alert)
                    alerts_created += 1
        
        return {
            "alerts_created": alerts_created,
            "generated_at": now
        }
    
    async def push_to_today_actions(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Push AI-recommended actions to Today Focus panel.
        """
        actions = await self.get_today_actions(user_id, limit=20)
        
        now = iso_now()
        tasks_created = 0
        
        for action in actions:
            # Check if task already exists
            existing = await self.db.tasks.find_one({
                f"{action['entity_type']}_id": action["entity_id"],
                "status": {"$nin": ["completed", "cancelled"]},
                "is_ai_generated": True
            })
            
            if not existing:
                task = {
                    "id": generate_id("task"),
                    f"{action['entity_type']}_id": action["entity_id"],
                    "title": f"[AI] {action['action_label']}: {action['entity_name']}",
                    "description": action["reason"],
                    "type": action["action_type"],
                    "status": "pending",
                    "priority": action["priority"],
                    "due_date": now,
                    "assigned_to": user_id,
                    "created_at": now,
                    "created_by": "ai_system",
                    "is_ai_generated": True
                }
                await self.db.tasks.insert_one(task)
                tasks_created += 1
        
        return {
            "tasks_created": tasks_created,
            "total_actions": len(actions),
            "generated_at": now
        }
    
    # ==================== AI GOVERNANCE ====================
    
    async def get_scoring_rules(self) -> Dict[str, Any]:
        """Get current lead scoring rules."""
        return await self.lead_scoring.get_scoring_rules()
    
    async def get_risk_rules(self) -> Dict[str, Any]:
        """Get current deal risk rules."""
        return await self.deal_risk.get_risk_rules()
    
    async def update_scoring_rules(self, rules: Dict[str, Any], user: dict) -> Dict[str, Any]:
        """Update lead scoring rules."""
        now = iso_now()
        
        await self.db.ai_scoring_rules.update_one(
            {"rule_type": "lead_scoring"},
            {
                "$set": {
                    "rules": rules,
                    "updated_by": user.get("id"),
                    "updated_at": now
                },
                "$setOnInsert": {
                    "rule_type": "lead_scoring",
                    "created_by": user.get("id"),
                    "created_at": now
                }
            },
            upsert=True
        )
        
        # Log to audit
        await self.db[self._audit_collection].insert_one({
            "id": generate_id("audit"),
            "action_type": "update_scoring_rules",
            "updated_by": user.get("id"),
            "updated_at": now
        })
        
        return {"success": True, "updated_at": now}
    
    async def update_risk_rules(self, rules: Dict[str, Any], user: dict) -> Dict[str, Any]:
        """Update deal risk rules."""
        now = iso_now()
        
        await self.db.ai_risk_rules.update_one(
            {"rule_type": "deal_risk"},
            {
                "$set": {
                    "rules": rules,
                    "updated_by": user.get("id"),
                    "updated_at": now
                },
                "$setOnInsert": {
                    "rule_type": "deal_risk",
                    "created_by": user.get("id"),
                    "created_at": now
                }
            },
            upsert=True
        )
        
        # Log to audit
        await self.db[self._audit_collection].insert_one({
            "id": generate_id("audit"),
            "action_type": "update_risk_rules",
            "updated_by": user.get("id"),
            "updated_at": now
        })
        
        return {"success": True, "updated_at": now}
    
    # ==================== ANALYTICS ====================
    
    async def get_ai_stats(self) -> Dict[str, Any]:
        """Get AI usage statistics."""
        now = datetime.now(timezone.utc)
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        
        # Count scored leads
        scored_leads_24h = await self.db.ai_lead_scores.count_documents({
            "created_at": {"$gte": day_ago.isoformat()}
        })
        
        scored_leads_7d = await self.db.ai_lead_scores.count_documents({
            "created_at": {"$gte": week_ago.isoformat()}
        })
        
        # Count risk assessments
        risk_assessments_24h = await self.db.ai_deal_risks.count_documents({
            "created_at": {"$gte": day_ago.isoformat()}
        })
        
        risk_assessments_7d = await self.db.ai_deal_risks.count_documents({
            "created_at": {"$gte": week_ago.isoformat()}
        })
        
        # Count high-risk deals
        high_risk_deals = await self.db.deals.count_documents({
            "ai_risk_level": {"$in": ["critical", "high"]},
            "stage": {"$nin": ["completed", "lost", "won", "cancelled"]}
        })
        
        # Count hot leads
        hot_leads = await self.db.leads.count_documents({
            "ai_score": {"$gte": 70},
            "status": {"$nin": ["closed_won", "closed_lost", "converted"]}
        })
        
        # Average scores
        avg_score_pipeline = [
            {"$match": {"created_at": {"$gte": week_ago.isoformat()}}},
            {"$group": {"_id": None, "avg_score": {"$avg": "$score"}}}
        ]
        avg_score_result = await self.db.ai_lead_scores.aggregate(avg_score_pipeline).to_list(1)
        avg_lead_score = avg_score_result[0]["avg_score"] if avg_score_result else 0
        
        return {
            "lead_scoring": {
                "scored_24h": scored_leads_24h,
                "scored_7d": scored_leads_7d,
                "avg_score_7d": round(avg_lead_score, 1),
                "hot_leads": hot_leads
            },
            "deal_risk": {
                "assessed_24h": risk_assessments_24h,
                "assessed_7d": risk_assessments_7d,
                "high_risk_deals": high_risk_deals
            },
            "generated_at": iso_now()
        }
    
    async def get_ai_audit_log(self, limit: int = 50) -> List[Dict]:
        """Get AI audit log."""
        logs = await self.db[self._audit_collection].find(
            {},
            {"_id": 0}
        ).sort("generated_at", -1).limit(limit).to_list(limit)
        return logs


# Import timedelta for type hints
from datetime import timedelta
