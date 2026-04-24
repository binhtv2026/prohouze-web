"""
ProHouzing KPI Router
Prompt 12/20 - KPI & Performance Engine

API endpoints for:
- KPI Configuration
- KPI Targets
- Scorecards
- Leaderboards
- Bonus Rules
- KPI Trends
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from models.kpi_models import (
    KPIDefinitionCreate, KPIDefinitionResponse,
    KPITargetCreate, KPITargetResponse,
    ScorecardResponse, TeamScorecardResponse,
    LeaderboardResponse,
    DrillDownResponse,
    KPIBonusRuleCreate, KPIBonusRuleUpdate, KPIBonusRuleResponse, BonusCalculationResult,
    KPITrendResponse
)

from services.kpi_service import KPIService
from config.kpi_config import (
    KPI_CATEGORY_CONFIG, KPI_SCOPE_CONFIG, KPI_PERIOD_CONFIG,
    KPI_STATUS_CONFIG, LEADERBOARD_CONFIG
)


kpi_router = APIRouter(prefix="/kpi", tags=["KPI"])


# ═══════════════════════════════════════════════════════════════════════════════
# DEPENDENCIES
# ═══════════════════════════════════════════════════════════════════════════════

def get_kpi_service(db=None):
    """Get KPI service instance - will be set in server.py"""
    from server import db as main_db
    return KPIService(main_db)


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/config/categories")
async def get_kpi_categories():
    """Get all KPI categories"""
    return [
        {
            "code": cat,
            **config,
        }
        for cat, config in KPI_CATEGORY_CONFIG.items()
    ]


@kpi_router.get("/config/scopes")
async def get_kpi_scopes():
    """Get all KPI scope types"""
    return [
        {
            "code": scope,
            **config,
        }
        for scope, config in KPI_SCOPE_CONFIG.items()
    ]


@kpi_router.get("/config/periods")
async def get_kpi_periods():
    """Get all KPI period types"""
    return [
        {
            "code": period,
            **config,
        }
        for period, config in KPI_PERIOD_CONFIG.items()
    ]


@kpi_router.get("/config/statuses")
async def get_kpi_statuses():
    """Get all KPI status types"""
    return [
        {
            "code": status,
            **config,
        }
        for status, config in KPI_STATUS_CONFIG.items()
    ]


@kpi_router.get("/config/leaderboard-types")
async def get_leaderboard_types():
    """Get all leaderboard types"""
    return [
        {
            "code": lb_type,
            **config,
        }
        for lb_type, config in LEADERBOARD_CONFIG.items()
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# KPI DEFINITION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/definitions", response_model=List[KPIDefinitionResponse])
async def get_kpi_definitions(
    category: Optional[str] = None,
    is_active: bool = True,
):
    """Get all KPI definitions"""
    service = get_kpi_service()
    return await service.get_kpi_definitions(category, is_active)


@kpi_router.get("/definitions/{kpi_code}", response_model=KPIDefinitionResponse)
async def get_kpi_definition(kpi_code: str):
    """Get single KPI definition"""
    service = get_kpi_service()
    definition = await service.get_kpi_definition(kpi_code)
    if not definition:
        raise HTTPException(status_code=404, detail="KPI definition not found")
    return definition


@kpi_router.post("/definitions", response_model=KPIDefinitionResponse)
async def create_kpi_definition(data: KPIDefinitionCreate):
    """Create custom KPI definition"""
    service = get_kpi_service()
    return await service.create_kpi_definition(data, "system")


@kpi_router.post("/definitions/seed")
async def seed_system_kpis():
    """Seed system KPI definitions"""
    service = get_kpi_service()
    await service.seed_system_kpis()
    return {"success": True, "message": "System KPIs seeded successfully"}


# ═══════════════════════════════════════════════════════════════════════════════
# KPI TARGET ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.post("/targets", response_model=KPITargetResponse)
async def create_or_update_target(data: KPITargetCreate):
    """Create or update KPI target"""
    service = get_kpi_service()
    return await service.set_target(data, "system")


@kpi_router.get("/targets", response_model=List[KPITargetResponse])
async def get_targets(
    scope_type: Optional[str] = None,
    scope_id: Optional[str] = None,
    user_id: Optional[str] = None,
    team_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    period_type: Optional[str] = None,
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    kpi_code: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Get KPI targets with filters"""
    service = get_kpi_service()
    return await service.get_targets(
        scope_type=scope_type,
        scope_id=scope_id,
        user_id=user_id,
        team_id=team_id,
        branch_id=branch_id,
        period_type=period_type,
        period_year=period_year,
        period_month=period_month,
        kpi_code=kpi_code,
        skip=skip,
        limit=limit,
    )


@kpi_router.get("/targets/{target_id}", response_model=KPITargetResponse)
async def get_target(target_id: str):
    """Get single KPI target"""
    service = get_kpi_service()
    target = await service.get_target(target_id)
    if not target:
        raise HTTPException(status_code=404, detail="KPI target not found")
    return target


# ═══════════════════════════════════════════════════════════════════════════════
# SCORECARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/my-scorecard", response_model=ScorecardResponse)
async def get_my_scorecard(
    user_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get personal scorecard for current user"""
    from server import db
    
    # For testing without auth, use a default user
    if not user_id:
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            user_id = user["id"]
        else:
            raise HTTPException(status_code=400, detail="User ID required or no sales users found")
    
    service = get_kpi_service()
    return await service.get_personal_scorecard(
        user_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.get("/scorecard/{user_id}", response_model=ScorecardResponse)
async def get_user_scorecard(
    user_id: str,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get scorecard for a specific user"""
    service = get_kpi_service()
    return await service.get_personal_scorecard(
        user_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.get("/team-scorecard", response_model=TeamScorecardResponse)
async def get_team_scorecard(
    team_id: str,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get team scorecard"""
    service = get_kpi_service()
    return await service.get_team_scorecard(
        team_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.get("/team-scorecard/{team_id}", response_model=TeamScorecardResponse)
async def get_specific_team_scorecard(
    team_id: str,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get scorecard for a specific team"""
    service = get_kpi_service()
    return await service.get_team_scorecard(
        team_id,
        period_type,
        period_year,
        period_month
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LEADERBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/leaderboards")
async def get_available_leaderboards():
    """Get list of available leaderboards"""
    service = get_kpi_service()
    return await service.get_available_leaderboards()


@kpi_router.get("/leaderboards/{leaderboard_type}", response_model=LeaderboardResponse)
async def get_leaderboard(
    leaderboard_type: str,
    scope_type: str = "company",
    scope_id: Optional[str] = None,
    current_user_id: Optional[str] = None
):
    """Get specific leaderboard"""
    service = get_kpi_service()
    return await service.get_leaderboard(
        leaderboard_type,
        scope_type,
        scope_id,
        current_user_id
    )


# ═══════════════════════════════════════════════════════════════════════════════
# BONUS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/bonus-rules", response_model=List[KPIBonusRuleResponse])
async def get_bonus_rules(is_active: bool = True):
    """Get bonus rules"""
    service = get_kpi_service()
    return await service.get_bonus_rules(is_active)


@kpi_router.post("/bonus-rules", response_model=KPIBonusRuleResponse)
async def create_bonus_rule(data: KPIBonusRuleCreate):
    """Create bonus rule"""
    service = get_kpi_service()
    return await service.create_bonus_rule(data, "system")


@kpi_router.get("/bonus-rules/{rule_id}", response_model=KPIBonusRuleResponse)
async def get_bonus_rule(rule_id: str):
    """Get single bonus rule"""
    service = get_kpi_service()
    rule = await service.get_bonus_rule(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Bonus rule not found")
    return rule


@kpi_router.put("/bonus-rules/{rule_id}", response_model=KPIBonusRuleResponse)
async def update_bonus_rule(rule_id: str, data: KPIBonusRuleUpdate):
    """Update bonus rule - KPI tiers must be configurable, not hardcoded"""
    service = get_kpi_service()
    rule = await service.update_bonus_rule(rule_id, data, "system")
    if not rule:
        raise HTTPException(status_code=404, detail="Bonus rule not found")
    return rule


@kpi_router.delete("/bonus-rules/{rule_id}")
async def delete_bonus_rule(rule_id: str):
    """Deactivate bonus rule"""
    service = get_kpi_service()
    success = await service.deactivate_bonus_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bonus rule not found")
    return {"message": "Bonus rule deactivated", "rule_id": rule_id}


@kpi_router.get("/my-bonus-modifier", response_model=BonusCalculationResult)
async def get_my_bonus_modifier(
    user_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get current user's bonus modifier"""
    if not user_id:
        from server import db
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            user_id = user["id"]
        else:
            raise HTTPException(status_code=400, detail="User ID required")
    
    service = get_kpi_service()
    return await service.calculate_bonus_modifier(
        user_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.get("/bonus-modifier/{user_id}", response_model=BonusCalculationResult)
async def get_user_bonus_modifier(
    user_id: str,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get bonus modifier for a specific user"""
    service = get_kpi_service()
    return await service.calculate_bonus_modifier(
        user_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.post("/apply-bonus")
async def apply_bonus_to_commissions(
    user_id: str,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Apply bonus modifier to pending commissions"""
    service = get_kpi_service()
    return await service.apply_bonus_to_commissions(
        user_id,
        period_type,
        period_year,
        period_month
    )


# ═══════════════════════════════════════════════════════════════════════════════
# TREND ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/trends/{kpi_code}", response_model=KPITrendResponse)
async def get_kpi_trend(
    kpi_code: str,
    scope_type: str = "individual",
    scope_id: Optional[str] = None,
    periods: int = 6,
    period_type: str = "monthly",
):
    """Get KPI trend over time"""
    # If individual scope and no scope_id, use default user
    if scope_type == "individual" and not scope_id:
        from server import db
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            scope_id = user["id"]
    
    service = get_kpi_service()
    return await service.get_kpi_trend(
        kpi_code,
        scope_type,
        scope_id,
        periods,
        period_type
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STATS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/stats/overview")
async def get_kpi_overview(
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get KPI system overview stats"""
    from server import db
    
    now = datetime.now(timezone.utc)
    if not period_year:
        period_year = now.year
    if not period_month:
        period_month = now.month
    
    # Count stats
    total_definitions = await db.kpi_definitions.count_documents({"is_active": True})
    total_targets = await db.kpi_targets.count_documents({
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month or 0,
    })
    total_users_with_targets = len(await db.kpi_targets.distinct("user_id", {
        "user_id": {"$ne": ""},
        "period_type": period_type,
        "period_year": period_year,
    }))
    
    return {
        "total_kpi_definitions": total_definitions,
        "total_targets_set": total_targets,
        "users_with_targets": total_users_with_targets,
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: REAL ESTATE KPI ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/my-performance")
async def get_my_performance(
    user_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get personal KPI performance for sales rep - designed for daily use"""
    from server import db
    
    # For testing without auth, use a default user
    if not user_id:
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            user_id = user["id"]
        else:
            # Create test user if none exists
            raise HTTPException(status_code=400, detail="User ID required or no sales users found")
    
    service = get_kpi_service()
    return await service.get_my_performance(
        user_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.get("/team-performance")
async def get_team_performance(
    team_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Get team KPI performance for leaders"""
    from server import db
    
    # For testing without auth, use a default team
    if not team_id:
        team = await db.teams.find_one({}, {"_id": 0, "id": 1})
        if team:
            team_id = team["id"]
        else:
            raise HTTPException(status_code=400, detail="Team ID required or no teams found")
    
    service = get_kpi_service()
    return await service.get_team_performance(
        team_id,
        period_type,
        period_year,
        period_month
    )


@kpi_router.get("/my-alerts")
async def get_my_alerts(
    user_id: Optional[str] = None,
    limit: int = 10,
):
    """Get KPI alerts for current user"""
    from server import db
    
    if not user_id:
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            user_id = user["id"]
        else:
            return []
    
    service = get_kpi_service()
    return await service.get_user_alerts(user_id, limit)


@kpi_router.get("/team-alerts")
async def get_team_alerts(
    team_id: Optional[str] = None,
    limit: int = 10,
):
    """Get KPI alerts for team"""
    from server import db
    
    if not team_id:
        team = await db.teams.find_one({}, {"_id": 0, "id": 1})
        if team:
            team_id = team["id"]
        else:
            return []
    
    service = get_kpi_service()
    return await service.get_team_alerts(team_id, limit)


@kpi_router.get("/config/kpi-definitions")
async def get_kpi_definitions_for_config():
    """Get KPI definitions for config page"""
    service = get_kpi_service()
    return await service.get_kpi_definitions_for_config()


@kpi_router.put("/config/kpi-definitions/{kpi_code}")
async def update_kpi_definition(
    kpi_code: str,
    updates: Dict[str, Any],
):
    """Update KPI definition (weight, target, etc.)"""
    service = get_kpi_service()
    success = await service.update_kpi_definition(kpi_code, updates)
    if not success:
        raise HTTPException(status_code=404, detail="KPI definition not found")
    return {"success": True, "kpi_code": kpi_code}


@kpi_router.get("/config/bonus-tiers")
async def get_bonus_tiers():
    """Get bonus tiers configuration"""
    service = get_kpi_service()
    return await service.get_bonus_tiers_config()


@kpi_router.put("/config/bonus-tiers")
async def update_bonus_tiers(tiers: List[Dict[str, Any]]):
    """Update bonus tiers configuration"""
    service = get_kpi_service()
    success = await service.update_bonus_tiers(tiers, "system")
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update bonus tiers")
    return {"success": True}



# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 ENHANCEMENTS - 10/10 ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@kpi_router.get("/weights/validate")
async def validate_kpi_weights():
    """1. FIX WEIGHT KPI - Validate total weight = 100%"""
    service = get_kpi_service()
    return await service.validate_kpi_weights()


@kpi_router.put("/weights/batch")
async def update_kpi_weights_batch(
    weights: List[Dict[str, Any]],
    user_id: str = "system"
):
    """Update multiple KPI weights - validate total = 100%"""
    service = get_kpi_service()
    result = await service.update_kpi_weights_batch(weights, user_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@kpi_router.post("/actuals/refresh")
async def refresh_kpi_actuals(
    user_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """2. AUTO DATA TỪ CRM - Refresh KPI actuals from CRM"""
    from server import db
    
    if not user_id:
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            user_id = user["id"]
        else:
            raise HTTPException(status_code=400, detail="User ID required")
    
    service = get_kpi_service()
    return await service.refresh_all_kpi_actuals(
        user_id, period_type, period_year, period_month
    )


@kpi_router.post("/commission/calculate")
async def calculate_commission_from_kpi(
    user_id: str,
    kpi_achievement: float,
    base_commission: float,
):
    """3. KPI → TIỀN - Calculate commission based on KPI"""
    service = get_kpi_service()
    return await service.calculate_commission_from_kpi(
        user_id, kpi_achievement, base_commission
    )


@kpi_router.get("/commission/rules")
async def get_commission_rules():
    """Get commission rules based on KPI"""
    from config.kpi_config import COMMISSION_RULES
    return COMMISSION_RULES


@kpi_router.post("/period/lock")
async def lock_kpi_period(
    period_type: str = "monthly",
    period_year: int = None,
    period_month: int = None,
    locked_by: str = "system"
):
    """4. KPI LOCK - Lock KPI period (no more edits)"""
    now = datetime.now(timezone.utc)
    if not period_year:
        period_year = now.year
    if not period_month:
        period_month = now.month
    
    service = get_kpi_service()
    return await service.lock_kpi_period(
        period_type, period_year, period_month, locked_by
    )


@kpi_router.get("/period/status")
async def get_period_lock_status(
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Check if KPI period is locked"""
    now = datetime.now(timezone.utc)
    if not period_year:
        period_year = now.year
    if not period_month:
        period_month = now.month
    
    service = get_kpi_service()
    is_locked = await service.is_period_locked(period_type, period_year, period_month)
    
    return {
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month,
        "is_locked": is_locked,
        "message": "Kỳ này đã khóa" if is_locked else "Kỳ này chưa khóa"
    }


@kpi_router.get("/level/{user_id}")
async def get_user_level(
    user_id: str,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """5. LEVEL SYSTEM - Get user's level (Bronze/Silver/Gold/Diamond)"""
    now = datetime.now(timezone.utc)
    if not period_year:
        period_year = now.year
    if not period_month:
        period_month = now.month
    
    service = get_kpi_service()
    
    # Get user's scorecard first
    try:
        scorecard = await service.get_personal_scorecard(
            user_id, period_type, period_year, period_month
        )
        score = scorecard.summary.overall_score
    except:
        score = 0
    
    return await service.get_user_level(user_id, score)


@kpi_router.get("/levels/config")
async def get_levels_config():
    """Get level system configuration"""
    from config.kpi_config import LEVEL_THRESHOLDS
    return LEVEL_THRESHOLDS


@kpi_router.post("/event")
async def process_kpi_event(
    event_type: str,
    user_id: str,
    data: Dict[str, Any] = {},
):
    """6. REAL-TIME UPDATE - Process KPI event (deal/booking/activity)"""
    service = get_kpi_service()
    return await service.process_realtime_event(event_type, user_id, data)


@kpi_router.post("/alerts/check")
async def check_and_create_alerts(
    user_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """7. ALERT + PUSH - Check KPI and create alerts"""
    from server import db
    
    if not user_id:
        user = await db.users.find_one({"role": "sales"}, {"_id": 0, "id": 1})
        if user:
            user_id = user["id"]
        else:
            return {"alerts_created": []}
    
    now = datetime.now(timezone.utc)
    if not period_year:
        period_year = now.year
    if not period_month:
        period_month = now.month
    
    service = get_kpi_service()
    
    # Get scorecard
    performance = await service.get_my_performance(
        user_id, period_type, period_year, period_month
    )
    
    # Check and create alerts
    alerts = await service.check_and_create_alerts(user_id, performance)
    
    return {
        "user_id": user_id,
        "score": performance.get("summary", {}).get("total_score", 0),
        "alerts_created": alerts,
    }


@kpi_router.post("/alerts/inactivity")
async def check_inactivity_alert(
    user_id: str,
    days: int = 3,
):
    """Check and create inactivity alert"""
    service = get_kpi_service()
    alert_id = await service.check_inactivity_alert(user_id, days)
    
    return {
        "user_id": user_id,
        "days_threshold": days,
        "alert_created": alert_id is not None,
        "alert_id": alert_id,
    }


@kpi_router.get("/leaderboard/enhanced")
async def get_leaderboard_enhanced(
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    scope_type: str = "company",
    scope_id: Optional[str] = None,
    limit: int = 20,
):
    """8. GOAL - Enhanced leaderboard showing who works / who's lazy"""
    service = get_kpi_service()
    return await service.get_leaderboard_enhanced(
        period_type, period_year, period_month, scope_type, scope_id, limit
    )


@kpi_router.get("/data-sources")
async def get_kpi_data_sources():
    """Get KPI data sources configuration (AUTO from CRM)"""
    from config.kpi_config import KPI_DATA_SOURCES
    return {
        "sources": KPI_DATA_SOURCES,
        "message": "Tất cả KPI được lấy AUTO từ CRM. KHÔNG cho nhập tay.",
    }
