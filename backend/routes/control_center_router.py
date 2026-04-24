"""
ProHouzing Control Center Router
Prompt 17/20 - Executive Control Center & Operations Command Center

API endpoints for the Control Center Operating System.

ARCHITECTURE:
    Router -> Orchestrator -> Engines -> Database
    
    All endpoints call the Orchestrator only.
    Never call individual engines directly.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import os
import jwt

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

# Import ONLY the orchestrator
from services.control_center import ControlCenterOrchestrator

# Initialize orchestrator - SINGLE ENTRY POINT
orchestrator = ControlCenterOrchestrator(db)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Create router
control_router = APIRouter(prefix="/control", tags=["Control Center"])


# ==================== REQUEST/RESPONSE MODELS ====================

class ActionRequest(BaseModel):
    source_alert_id: Optional[str] = None
    source_entity: str
    source_id: str
    params: dict = {}


class AlertAcknowledgeRequest(BaseModel):
    alert_id: str


class AlertResolveRequest(BaseModel):
    alert_id: str
    resolution_note: Optional[str] = None


class ActionVerifyRequest(BaseModel):
    action_id: str
    is_resolved: bool


# ==================== UNIFIED CONTROL VIEW ====================

@control_router.get("/overview")
async def get_unified_control_view(current_user: dict = Depends(get_current_user)):
    """
    Get unified control view with all data.
    Single API call to power the entire Control Center UI.
    
    Returns: health_score, alerts, bottlenecks, suggestions, focus_panel, control_feed
    """
    try:
        data = await orchestrator.get_unified_control_view(current_user)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EXECUTIVE OVERVIEW ====================

@control_router.get("/executive-overview")
async def get_executive_overview(current_user: dict = Depends(get_current_user)):
    """
    Get executive overview - the CEO dashboard.
    Answers 7 key questions about business health.
    """
    try:
        data = await orchestrator.get_executive_overview(current_user)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HEALTH SCORE ====================

@control_router.get("/health-score")
async def get_health_score(current_user: dict = Depends(get_current_user)):
    """
    Get Business Health Score (0-100) with component breakdown.
    """
    try:
        data = await orchestrator.get_health_score()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/health-score/snapshot")
async def save_health_score_snapshot(current_user: dict = Depends(get_current_user)):
    """Save current health score as snapshot for historical tracking."""
    if current_user.get("role") not in ["admin", "bod", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        score_data = await orchestrator.get_health_score()
        await orchestrator.save_health_snapshot(score_data)
        return {
            "success": True,
            "message": "Snapshot saved",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ALERTS ====================

@control_router.get("/alerts")
async def get_alerts(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    include_acknowledged: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Get real-time alerts with filtering.
    """
    try:
        data = await orchestrator.get_alerts(current_user, category, severity)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/alerts/summary")
async def get_alerts_summary(current_user: dict = Depends(get_current_user)):
    """Get alert summary by category and severity."""
    try:
        summary = await orchestrator.get_alert_summary()
        return {
            "success": True,
            "data": summary,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/alerts/acknowledge")
async def acknowledge_alert(
    request: AlertAcknowledgeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Acknowledge an alert."""
    try:
        success = await orchestrator.acknowledge_alert(request.alert_id, current_user.get("id"))
        return {
            "success": success,
            "message": "Alert acknowledged" if success else "Alert not found",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/alerts/resolve")
async def resolve_alert(
    request: AlertResolveRequest,
    current_user: dict = Depends(get_current_user)
):
    """Resolve an alert."""
    try:
        success = await orchestrator.resolve_alert(
            request.alert_id,
            current_user.get("id"),
            request.resolution_note
        )
        return {
            "success": success,
            "message": "Alert resolved" if success else "Alert not found",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BOTTLENECKS ====================

@control_router.get("/bottlenecks")
async def get_bottlenecks(current_user: dict = Depends(get_current_user)):
    """
    Get all operational bottlenecks.
    """
    try:
        data = await orchestrator.get_bottlenecks()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/bottlenecks/{bottleneck_type}")
async def get_bottleneck_details(
    bottleneck_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed data for a specific bottleneck type.
    Types: sales, contracts, leads, inventory, tasks
    """
    try:
        data = await orchestrator.get_bottleneck_details(bottleneck_type)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SUGGESTIONS ====================

@control_router.get("/suggestions")
async def get_suggestions(current_user: dict = Depends(get_current_user)):
    """
    Get decision suggestions - actionable recommendations.
    """
    try:
        data = await orchestrator.get_suggestions(current_user)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/suggestions/summary")
async def get_suggestions_summary(current_user: dict = Depends(get_current_user)):
    """Get suggestions summary."""
    try:
        summary = await orchestrator.get_suggestions_summary()
        return {
            "success": True,
            "data": summary,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ACTIONS ====================

@control_router.post("/actions/{action_type}")
async def execute_action(
    action_type: str,
    request: ActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute an action from the Control Center.
    Action types: reassign_owner, create_task, send_reminder, 
                  request_docs, assign_reviewer, trigger_campaign, 
                  escalate, mark_resolved
    """
    try:
        result = await orchestrator.execute_action(
            action_type=action_type,
            source_alert_id=request.source_alert_id,
            source_entity=request.source_entity,
            source_id=request.source_id,
            params=request.params,
            user=current_user
        )
        return {
            "success": result.get("success", False),
            "data": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/actions/verify")
async def verify_action(
    request: ActionVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify if an action resolved the issue (closed-loop tracking).
    """
    try:
        result = await orchestrator.verify_action_result(
            request.action_id,
            request.is_resolved,
            current_user
        )
        return {
            "success": result.get("success", False),
            "data": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/actions/effectiveness")
async def get_action_effectiveness(current_user: dict = Depends(get_current_user)):
    """
    Get statistics on action effectiveness.
    Shows which actions actually resolve issues.
    """
    if current_user.get("role") not in ["admin", "bod", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        data = await orchestrator.get_action_effectiveness()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PRIORITY & FOCUS ====================

@control_router.get("/focus")
async def get_today_focus(current_user: dict = Depends(get_current_user)):
    """
    Get "Today Focus Panel" - most important items for today.
    """
    try:
        data = await orchestrator.get_today_focus(current_user)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/focus/user")
async def get_user_focus(current_user: dict = Depends(get_current_user)):
    """
    Get focus items for the current user.
    """
    try:
        data = await orchestrator.get_user_focus(current_user.get("id"))
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/priority-matrix")
async def get_priority_matrix(current_user: dict = Depends(get_current_user)):
    """
    Get priority matrix - items grouped by urgency/impact.
    """
    try:
        data = await orchestrator.get_priority_matrix()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONTROL FEED ====================

@control_router.get("/feed")
async def get_control_feed(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get Control Feed - real-time stream of alerts, actions, updates.
    Like a news feed for operations.
    """
    try:
        data = await orchestrator.get_control_feed(limit, current_user)
        return {
            "success": True,
            "data": {
                "items": data,
                "count": len(data)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== OPERATIONS COMMAND CENTER ====================

@control_router.get("/operations/overview")
async def get_operations_overview(current_user: dict = Depends(get_current_user)):
    """
    Get Operations Command Center overview - for Sales Directors/Managers.
    """
    try:
        data = await orchestrator.get_operations_overview(current_user)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/operations/pipeline")
async def get_pipeline_overview(current_user: dict = Depends(get_current_user)):
    """Get pipeline overview for operations."""
    try:
        data = await orchestrator.get_pipeline_overview()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/operations/team-heatmap")
async def get_team_heatmap(current_user: dict = Depends(get_current_user)):
    """Get team performance heatmap."""
    try:
        data = await orchestrator.get_team_heatmap()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==================== AUTO ACTION RULES ====================

class AutoRuleRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    condition_type: str
    condition_json: dict = {}
    action_type: str
    action_params: dict = {}
    delay_minutes: int = 0
    priority_threshold: int = 50
    follow_up_action: Optional[str] = None
    follow_up_delay_hours: int = 48
    is_active: bool = True


class ToggleRuleRequest(BaseModel):
    is_active: bool


class UndoActionRequest(BaseModel):
    action_id: str


@control_router.get("/auto/rules")
async def get_auto_rules(
    active_only: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all auto action rules.
    """
    try:
        rules = await orchestrator.get_auto_rules(active_only)
        return {
            "success": True,
            "data": {
                "rules": rules,
                "total": len(rules),
                "active_count": len([r for r in rules if r.get("is_active")])
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/auto/rules/{rule_id}")
async def get_auto_rule(
    rule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific auto action rule."""
    try:
        rule = await orchestrator.get_auto_rule(rule_id)
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        return {
            "success": True,
            "data": rule,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/auto/rules")
async def create_auto_rule(
    request: AutoRuleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new auto action rule.
    """
    if current_user.get("role") not in ["admin", "bod", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        result = await orchestrator.create_auto_rule(request.model_dump(), current_user)
        return {
            "success": result.get("success", False),
            "data": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.put("/auto/rules/{rule_id}")
async def update_auto_rule(
    rule_id: str,
    request: AutoRuleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing auto action rule."""
    if current_user.get("role") not in ["admin", "bod", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        result = await orchestrator.update_auto_rule(rule_id, request.model_dump(), current_user)
        return {
            "success": result.get("success", False),
            "data": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/auto/rules/{rule_id}/toggle")
async def toggle_auto_rule(
    rule_id: str,
    request: ToggleRuleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle auto rule on/off.
    """
    if current_user.get("role") not in ["admin", "bod", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        result = await orchestrator.toggle_auto_rule(rule_id, request.is_active, current_user)
        return {
            "success": result.get("success", False),
            "data": result,
            "message": f"Rule {'activated' if request.is_active else 'deactivated'}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.delete("/auto/rules/{rule_id}")
async def delete_auto_rule(
    rule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an auto action rule."""
    if current_user.get("role") not in ["admin", "bod"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        success = await orchestrator.delete_auto_rule(rule_id)
        return {
            "success": success,
            "message": "Rule deleted" if success else "Rule not found",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/auto/run")
async def run_auto_actions(current_user: dict = Depends(get_current_user)):
    """
    Manually trigger auto action rules check.
    Normally runs on schedule, but can be triggered manually.
    """
    if current_user.get("role") not in ["admin", "bod"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        result = await orchestrator.run_auto_actions()
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/auto/undo")
async def undo_auto_action(
    request: UndoActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Undo an auto action within the undo window.
    """
    try:
        result = await orchestrator.undo_auto_action(request.action_id, current_user)
        return {
            "success": result.get("success", False),
            "data": result,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/auto/stats")
async def get_auto_action_stats(current_user: dict = Depends(get_current_user)):
    """
    Get auto action statistics.
    """
    try:
        stats = await orchestrator.get_auto_action_stats()
        return {
            "success": True,
            "data": stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.get("/auto/actions")
async def get_recent_auto_actions(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent auto actions.
    """
    try:
        actions = await orchestrator.get_recent_auto_actions(limit)
        return {
            "success": True,
            "data": {
                "actions": actions,
                "count": len(actions)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@control_router.post("/auto/init-defaults")
async def initialize_default_rules(current_user: dict = Depends(get_current_user)):
    """
    Initialize default auto action rules.
    """
    if current_user.get("role") not in ["admin", "bod"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    try:
        result = await orchestrator.initialize_default_rules(current_user)
        return {
            "success": True,
            "data": result,
            "message": f"Created {result['created']} default rules",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
