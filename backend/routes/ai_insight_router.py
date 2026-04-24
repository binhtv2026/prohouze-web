"""
AI Insight Router
Prompt 18/20 - AI Decision Engine

API endpoints for AI Insight Engine.
All endpoints call the Orchestrator only.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Import will be done dynamically in server.py
router = APIRouter(prefix="/ai-insight", tags=["AI Insight"])


# ==================== REQUEST/RESPONSE MODELS ====================

class LeadScoreResponse(BaseModel):
    """Lead score API response"""
    lead_id: str
    lead_name: str
    score: int
    score_level: str
    confidence: float
    confidence_level: str
    factors: List[Dict[str, Any]]
    explanation: Dict[str, Any]
    recommendation: Dict[str, Any]
    action_suggestions: List[Dict[str, Any]]
    signals: List[Dict[str, Any]]
    generated_at: str


class DealRiskResponse(BaseModel):
    """Deal risk API response"""
    deal_id: str
    deal_code: str
    deal_name: str
    risk_level: str
    risk_score: int
    signals: List[Dict[str, Any]]
    explanation: Dict[str, Any]
    recommendation: Dict[str, Any]
    action_suggestions: List[Dict[str, Any]]
    generated_at: str


class NextBestActionResponse(BaseModel):
    """NBA API response"""
    entity_type: str
    entity_id: str
    entity_name: str
    primary_action: Dict[str, Any]
    alternative_actions: List[Dict[str, Any]]
    rationale: str
    confidence: float
    confidence_level: str
    generated_at: str


class AIInsightResponse(BaseModel):
    """Unified AI insight response"""
    entity_type: str
    entity_id: str
    entity_name: str
    lead_score: Optional[Dict[str, Any]] = None
    deal_risk: Optional[Dict[str, Any]] = None
    next_best_action: Optional[Dict[str, Any]] = None
    signals: List[Dict[str, Any]] = []
    explanation: Optional[Dict[str, Any]] = None
    action_suggestions: List[Dict[str, Any]] = []
    overall_confidence: float
    confidence_level: str
    processing_time_ms: int
    generated_at: str


class UpdateRulesRequest(BaseModel):
    """Request to update AI rules"""
    rules: Dict[str, Any]


class BatchScoreRequest(BaseModel):
    """Request to score multiple leads"""
    lead_ids: List[str]


class BatchRiskRequest(BaseModel):
    """Request to assess multiple deals"""
    deal_ids: List[str]


# ==================== HELPER FUNCTIONS ====================

def serialize_lead_score(result) -> LeadScoreResponse:
    """Serialize LeadScoreResult to API response"""
    return LeadScoreResponse(
        lead_id=result.lead_id,
        lead_name=result.lead_name,
        score=result.score.score_value,
        score_level=result.score.score_level.value,
        confidence=result.score.confidence,
        confidence_level=result.score.confidence_level.value,
        factors=result.score.factors,
        explanation={
            "summary": result.explanation.summary,
            "positive_factors": result.explanation.positive_factors,
            "negative_factors": result.explanation.negative_factors,
            "key_insights": result.explanation.key_insights,
            "detailed_breakdown": result.explanation.detailed_breakdown
        },
        recommendation={
            "type": result.recommendation.recommendation_type.value,
            "title": result.recommendation.title,
            "description": result.recommendation.description,
            "rationale": result.recommendation.rationale,
            "expected_impact": result.recommendation.expected_impact,
            "priority": result.recommendation.priority.value,
            "confidence": result.recommendation.confidence
        },
        action_suggestions=[
            {
                "action_id": a.action_id,
                "action_type": a.action_type.value,
                "label": a.label,
                "description": a.description,
                "params": a.params,
                "endpoint": a.endpoint,
                "method": a.method,
                "icon": a.icon,
                "priority": a.priority.value,
                "estimated_impact": a.estimated_impact
            }
            for a in result.action_suggestions
        ],
        signals=[
            {
                "signal_id": s.signal_id,
                "signal_type": s.signal_type.value,
                "signal_name": s.signal_name,
                "value": s.value,
                "detected_at": s.detected_at
            }
            for s in result.signals
        ],
        generated_at=result.generated_at
    )


def serialize_deal_risk(result) -> DealRiskResponse:
    """Serialize DealRiskResult to API response"""
    return DealRiskResponse(
        deal_id=result.deal_id,
        deal_code=result.deal_code,
        deal_name=result.deal_name,
        risk_level=result.risk_level.value,
        risk_score=result.risk_score,
        signals=[
            {
                "signal_id": s.signal_id,
                "signal_type": s.signal_type.value,
                "signal_name": s.signal_name,
                "value": s.value,
                "detected_at": s.detected_at,
                "metadata": s.metadata
            }
            for s in result.signals
        ],
        explanation={
            "summary": result.explanation.summary,
            "positive_factors": result.explanation.positive_factors,
            "negative_factors": result.explanation.negative_factors,
            "key_insights": result.explanation.key_insights,
            "detailed_breakdown": result.explanation.detailed_breakdown
        },
        recommendation={
            "type": result.recommendation.recommendation_type.value,
            "title": result.recommendation.title,
            "description": result.recommendation.description,
            "rationale": result.recommendation.rationale,
            "expected_impact": result.recommendation.expected_impact,
            "priority": result.recommendation.priority.value,
            "confidence": result.recommendation.confidence
        },
        action_suggestions=[
            {
                "action_id": a.action_id,
                "action_type": a.action_type.value,
                "label": a.label,
                "description": a.description,
                "params": a.params,
                "endpoint": a.endpoint,
                "method": a.method,
                "icon": a.icon,
                "priority": a.priority.value,
                "estimated_impact": a.estimated_impact
            }
            for a in result.action_suggestions
        ],
        generated_at=result.generated_at
    )


def serialize_nba(result) -> NextBestActionResponse:
    """Serialize NextBestActionResult to API response"""
    return NextBestActionResponse(
        entity_type=result.entity_type,
        entity_id=result.entity_id,
        entity_name=result.entity_name,
        primary_action={
            "action_id": result.primary_action.action_id,
            "action_type": result.primary_action.action_type.value,
            "label": result.primary_action.label,
            "description": result.primary_action.description,
            "params": result.primary_action.params,
            "endpoint": result.primary_action.endpoint,
            "method": result.primary_action.method,
            "icon": result.primary_action.icon,
            "priority": result.primary_action.priority.value,
            "estimated_impact": result.primary_action.estimated_impact
        },
        alternative_actions=[
            {
                "action_id": a.action_id,
                "action_type": a.action_type.value,
                "label": a.label,
                "description": a.description,
                "params": a.params,
                "endpoint": a.endpoint,
                "icon": a.icon,
                "priority": a.priority.value
            }
            for a in result.alternative_actions
        ],
        rationale=result.rationale,
        confidence=result.confidence,
        confidence_level=result.confidence_level.value,
        generated_at=result.generated_at
    )


def serialize_insight(result) -> AIInsightResponse:
    """Serialize AIInsightResult to API response"""
    response = AIInsightResponse(
        entity_type=result.entity_type,
        entity_id=result.entity_id,
        entity_name=result.entity_name,
        overall_confidence=result.overall_confidence,
        confidence_level=result.confidence_level.value,
        processing_time_ms=result.processing_time_ms,
        generated_at=result.generated_at,
        signals=[
            {
                "signal_id": s.signal_id,
                "signal_type": s.signal_type.value,
                "signal_name": s.signal_name,
                "value": s.value
            }
            for s in result.signals
        ],
        action_suggestions=[
            {
                "action_id": a.action_id,
                "action_type": a.action_type.value,
                "label": a.label,
                "description": a.description,
                "params": a.params,
                "endpoint": a.endpoint,
                "icon": a.icon,
                "priority": a.priority.value
            }
            for a in result.action_suggestions
        ]
    )
    
    if result.lead_score:
        response.lead_score = {
            "score": result.lead_score.score_value,
            "score_level": result.lead_score.score_level.value,
            "confidence": result.lead_score.confidence,
            "factors": result.lead_score.factors
        }
    
    if result.deal_risk:
        response.deal_risk = {
            "risk_level": result.deal_risk.risk_level.value,
            "risk_score": result.deal_risk.risk_score,
            "signals_count": len(result.deal_risk.signals)
        }
    
    if result.next_best_action:
        response.next_best_action = {
            "action_type": result.next_best_action.primary_action.action_type.value,
            "label": result.next_best_action.primary_action.label,
            "priority": result.next_best_action.primary_action.priority.value,
            "confidence": result.next_best_action.confidence
        }
    
    if result.explanation:
        response.explanation = {
            "summary": result.explanation.summary,
            "key_insights": result.explanation.key_insights
        }
    
    return response


# ==================== ROUTE DEFINITIONS ====================
# Routes will be registered in server.py with db dependency

def create_ai_insight_routes(db, get_current_user):
    """Create routes with database dependency"""
    from services.ai_insight.ai_insight_orchestrator import AIInsightOrchestrator
    
    orchestrator = AIInsightOrchestrator(db)
    
    # ==================== LEAD SCORING ENDPOINTS ====================
    
    @router.get("/lead/{lead_id}/score", response_model=LeadScoreResponse)
    async def get_lead_score(lead_id: str, current_user: dict = Depends(get_current_user)):
        """Get AI score for a lead with full explanation"""
        try:
            result = await orchestrator.get_lead_score(lead_id)
            return serialize_lead_score(result)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI scoring error: {str(e)}")
    
    @router.get("/lead/{lead_id}/insight", response_model=AIInsightResponse)
    async def get_lead_insight(lead_id: str, current_user: dict = Depends(get_current_user)):
        """Get complete AI insight for a lead (score + NBA)"""
        try:
            result = await orchestrator.get_lead_insight(lead_id)
            return serialize_insight(result)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI insight error: {str(e)}")
    
    @router.get("/lead/{lead_id}/score-history")
    async def get_lead_score_history(
        lead_id: str,
        limit: int = Query(10, ge=1, le=100),
        current_user: dict = Depends(get_current_user)
    ):
        """Get historical scores for a lead"""
        history = await orchestrator.get_lead_score_history(lead_id, limit)
        return {"lead_id": lead_id, "history": history}
    
    @router.post("/leads/batch-score")
    async def batch_score_leads(
        data: BatchScoreRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Score multiple leads at once"""
        if len(data.lead_ids) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 leads per batch")
        
        results = await orchestrator.batch_score_leads(data.lead_ids)
        return {
            "scored": len(results),
            "results": [
                {
                    "lead_id": r.lead_id,
                    "score": r.score.score_value,
                    "score_level": r.score.score_level.value
                }
                for r in results
            ]
        }
    
    # ==================== DEAL RISK ENDPOINTS ====================
    
    @router.get("/deal/{deal_id}/risk", response_model=DealRiskResponse)
    async def get_deal_risk(deal_id: str, current_user: dict = Depends(get_current_user)):
        """Get AI risk assessment for a deal"""
        try:
            result = await orchestrator.get_deal_risk(deal_id)
            return serialize_deal_risk(result)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI risk error: {str(e)}")
    
    @router.get("/deal/{deal_id}/insight", response_model=AIInsightResponse)
    async def get_deal_insight(deal_id: str, current_user: dict = Depends(get_current_user)):
        """Get complete AI insight for a deal (risk + NBA)"""
        try:
            result = await orchestrator.get_deal_insight(deal_id)
            return serialize_insight(result)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI insight error: {str(e)}")
    
    @router.get("/deals/high-risk")
    async def get_high_risk_deals(
        limit: int = Query(20, ge=1, le=100),
        current_user: dict = Depends(get_current_user)
    ):
        """Get deals with high risk level"""
        deals = await orchestrator.get_high_risk_deals(limit)
        return {"count": len(deals), "deals": deals}
    
    @router.post("/deals/batch-assess")
    async def batch_assess_deals(
        data: BatchRiskRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Assess risk for multiple deals"""
        if len(data.deal_ids) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 deals per batch")
        
        results = await orchestrator.batch_assess_deals(data.deal_ids)
        return {
            "assessed": len(results),
            "results": [
                {
                    "deal_id": r.deal_id,
                    "risk_level": r.risk_level.value,
                    "risk_score": r.risk_score
                }
                for r in results
            ]
        }
    
    # ==================== NEXT BEST ACTION ENDPOINTS ====================
    
    @router.get("/nba/{entity_type}/{entity_id}", response_model=NextBestActionResponse)
    async def get_next_best_action(
        entity_type: str,
        entity_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get next best action for an entity"""
        if entity_type not in ["lead", "deal"]:
            raise HTTPException(status_code=400, detail="Entity type must be 'lead' or 'deal'")
        
        try:
            result = await orchestrator.get_next_best_action(entity_type, entity_id)
            return serialize_nba(result)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"NBA error: {str(e)}")
    
    @router.get("/today-actions")
    async def get_today_actions(
        limit: int = Query(10, ge=1, le=50),
        current_user: dict = Depends(get_current_user)
    ):
        """Get prioritized actions for today"""
        user_id = current_user.get("id") if current_user.get("role") not in ["bod", "admin", "manager"] else None
        actions = await orchestrator.get_today_actions(user_id, limit)
        return {"count": len(actions), "actions": actions}
    
    # ==================== CONTROL CENTER INTEGRATION ====================
    
    @router.post("/generate-alerts")
    async def generate_ai_alerts(current_user: dict = Depends(get_current_user)):
        """Generate AI-driven alerts for Control Center"""
        if current_user.get("role") not in ["bod", "admin", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await orchestrator.create_ai_driven_alerts()
        return result
    
    @router.post("/push-today-actions")
    async def push_today_actions(current_user: dict = Depends(get_current_user)):
        """Push AI actions to Today Focus panel"""
        user_id = current_user.get("id") if current_user.get("role") not in ["bod", "admin", "manager"] else None
        result = await orchestrator.push_to_today_actions(user_id)
        return result
    
    # ==================== AI GOVERNANCE ====================
    
    @router.get("/rules/scoring")
    async def get_scoring_rules(current_user: dict = Depends(get_current_user)):
        """Get current lead scoring rules"""
        rules = await orchestrator.get_scoring_rules()
        return {"rules": rules}
    
    @router.get("/rules/risk")
    async def get_risk_rules(current_user: dict = Depends(get_current_user)):
        """Get current deal risk rules"""
        rules = await orchestrator.get_risk_rules()
        return {"rules": rules}
    
    @router.put("/rules/scoring")
    async def update_scoring_rules(
        data: UpdateRulesRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Update lead scoring rules (admin only)"""
        if current_user.get("role") not in ["bod", "admin"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await orchestrator.update_scoring_rules(data.rules, current_user)
        return result
    
    @router.put("/rules/risk")
    async def update_risk_rules(
        data: UpdateRulesRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Update deal risk rules (admin only)"""
        if current_user.get("role") not in ["bod", "admin"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await orchestrator.update_risk_rules(data.rules, current_user)
        return result
    
    # ==================== ANALYTICS ====================
    
    @router.get("/stats")
    async def get_ai_stats(current_user: dict = Depends(get_current_user)):
        """Get AI usage statistics"""
        stats = await orchestrator.get_ai_stats()
        return stats
    
    @router.get("/audit-log")
    async def get_audit_log(
        limit: int = Query(50, ge=1, le=200),
        current_user: dict = Depends(get_current_user)
    ):
        """Get AI audit log"""
        if current_user.get("role") not in ["bod", "admin"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        logs = await orchestrator.get_ai_audit_log(limit)
        return {"count": len(logs), "logs": logs}
    
    # ==================== FULL INSIGHT WITH MONEY (PHASE 1) ====================
    
    @router.get("/lead/{lead_id}/full")
    async def get_lead_insight_full(lead_id: str, current_user: dict = Depends(get_current_user)):
        """
        Get FULL AI insight for lead with money impact.
        Returns: lead_score, money_impact, next_action, actions
        """
        try:
            result = await orchestrator.get_lead_insight_full(lead_id)
            return result
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI insight error: {str(e)}")
    
    @router.get("/deal/{deal_id}/full")
    async def get_deal_insight_full(deal_id: str, current_user: dict = Depends(get_current_user)):
        """
        Get FULL AI insight for deal with money impact.
        Returns: deal_risk, money_impact, next_action, actions
        """
        try:
            result = await orchestrator.get_deal_insight_full(deal_id)
            return result
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI insight error: {str(e)}")
    
    # ==================== ACTION EXECUTION (PHASE 1) ====================
    
    @router.post("/execute")
    async def execute_action(
        data: dict,
        current_user: dict = Depends(get_current_user)
    ):
        """
        Execute an AI-recommended action for real.
        Click phải chạy thật!
        
        Body:
        {
            "action_type": "call" | "create_task" | "assign" | "notify" | "escalate" | "email",
            "entity_type": "lead" | "deal",
            "entity_id": "...",
            "params": {...}
        }
        """
        try:
            result = await orchestrator.execute_action(
                action_type=data.get("action_type"),
                entity_type=data.get("entity_type"),
                entity_id=data.get("entity_id"),
                params=data.get("params", {}),
                executed_by=current_user.get("id")
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")
    
    @router.post("/execute/batch")
    async def batch_execute_actions(
        data: dict,
        current_user: dict = Depends(get_current_user)
    ):
        """Execute multiple actions in batch."""
        try:
            result = await orchestrator.batch_execute_actions(
                actions=data.get("actions", []),
                executed_by=current_user.get("id")
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Batch execution error: {str(e)}")
    
    # ==================== WAR ROOM (PHASE 2) ====================
    
    @router.get("/war-room")
    async def get_war_room(current_user: dict = Depends(get_current_user)):
        """
        Get WAR ROOM dashboard data.
        - Revenue at risk
        - Deals cần xử lý hôm nay
        - AI recommended actions with money impact
        """
        try:
            user_id = current_user.get("id") if current_user.get("role") not in ["bod", "admin", "manager"] else None
            result = await orchestrator.get_war_room_data(user_id)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"War room error: {str(e)}")
    
    @router.get("/today-actions-money")
    async def get_today_actions_with_money(
        limit: int = Query(10, ge=1, le=50),
        current_user: dict = Depends(get_current_user)
    ):
        """Get today's AI actions with money impact."""
        try:
            user_id = current_user.get("id") if current_user.get("role") not in ["bod", "admin", "manager"] else None
            result = await orchestrator.get_today_actions_with_money(user_id, limit)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Today actions error: {str(e)}")
    
    return router
