"""
ProHouzing KPI Service
Prompt 12/20 - KPI & Performance Engine

Core service layer for:
- KPI Definitions management
- KPI Targets management
- Scorecard generation
- Leaderboard management
- Bonus calculation
- Event processing
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase
import calendar

from config.kpi_config import (
    KPICategory, KPIScopeType, KPIPeriodType, KPISnapshotType,
    KPIStatus, KPITargetType, KPICalculationType, LeaderboardType,
    KPI_CATEGORY_CONFIG, KPI_SCOPE_CONFIG, KPI_PERIOD_CONFIG, KPI_STATUS_CONFIG,
    LEADERBOARD_CONFIG, SYSTEM_KPI_DEFINITIONS, DEFAULT_BONUS_TIERS,
    get_category_config, get_scope_config, get_period_config,
    get_status_from_achievement, get_status_config,
    get_leaderboard_config, get_bonus_modifier, get_bonus_tier_label
)
from typing import List

from models.kpi_models import (
    KPIDefinitionCreate, KPIDefinitionResponse,
    KPITargetCreate, KPITargetResponse,
    KPIValue, ScorecardSummary, ScorecardCategory, ScorecardResponse,
    TeamMemberPerformance, TeamScorecardResponse,
    LeaderboardEntry, LeaderboardResponse,
    DrillDownNode, DrillDownResponse,
    BonusTier, KPIBonusRuleCreate, KPIBonusRuleResponse, BonusCalculationResult,
    KPIImpact, KPIEventCreate, KPIEventResponse,
    KPITrendPoint, KPITrendResponse
)


class KPIService:
    """KPI Service with calculation engine"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INITIALIZATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def seed_system_kpis(self):
        """Seed system KPI definitions if not exist"""
        for kpi_def in SYSTEM_KPI_DEFINITIONS:
            existing = await self.db.kpi_definitions.find_one({"code": kpi_def["code"]})
            if not existing:
                now = datetime.now(timezone.utc).isoformat()
                kpi_doc = {
                    "id": str(uuid.uuid4()),
                    **kpi_def,
                    "is_system": True,
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db.kpi_definitions.insert_one(kpi_doc)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # KPI DEFINITIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_kpi_definitions(
        self,
        category: Optional[str] = None,
        is_active: bool = True
    ) -> List[KPIDefinitionResponse]:
        """Get all KPI definitions"""
        query = {"is_active": is_active}
        if category:
            query["category"] = category
        
        definitions = await self.db.kpi_definitions.find(
            query, {"_id": 0}
        ).sort("weight", -1).to_list(200)
        
        return [await self._enrich_definition(d) for d in definitions]
    
    async def get_kpi_definition(self, kpi_code: str) -> Optional[KPIDefinitionResponse]:
        """Get single KPI definition"""
        definition = await self.db.kpi_definitions.find_one(
            {"code": kpi_code}, {"_id": 0}
        )
        if not definition:
            return None
        return await self._enrich_definition(definition)
    
    async def create_kpi_definition(
        self,
        data: KPIDefinitionCreate,
        created_by: str
    ) -> KPIDefinitionResponse:
        """Create custom KPI definition"""
        kpi_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        kpi_doc = {
            "id": kpi_id,
            "code": data.code,
            "name": data.name,
            "name_en": data.name_en or data.name,
            "description": data.description or "",
            "category": data.category,
            "subcategory": data.subcategory or "",
            "calculation_type": data.calculation_type,
            "formula": data.formula or "",
            "source_entity": data.source_entity,
            "source_field": data.source_field or "",
            "filter_conditions": data.filter_conditions,
            "aggregation_levels": data.aggregation_levels,
            "time_periods": data.time_periods,
            "unit": data.unit,
            "format": data.format,
            "decimal_places": data.decimal_places,
            "icon": data.icon or "",
            "color": data.color or "",
            "target_type": data.target_type,
            "default_target": data.default_target or 0,
            "benchmark_value": data.benchmark_value or 0,
            "thresholds": data.thresholds.dict(),
            "weight": data.weight,
            "is_key_metric": data.is_key_metric,
            "is_system": False,
            "is_active": True,
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.kpi_definitions.insert_one(kpi_doc)
        return await self._enrich_definition(kpi_doc)
    
    async def _enrich_definition(self, definition: Dict) -> KPIDefinitionResponse:
        """Enrich KPI definition with labels"""
        category_config = get_category_config(definition.get("category", ""))
        
        return KPIDefinitionResponse(
            **definition,
            category_label=category_config.get("label", ""),
        )
    
    async def get_kpi_categories(self) -> List[Dict]:
        """Get all KPI categories"""
        return [
            {
                "code": cat,
                **config,
            }
            for cat, config in KPI_CATEGORY_CONFIG.items()
        ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # KPI TARGETS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def set_target(
        self,
        data: KPITargetCreate,
        created_by: str
    ) -> KPITargetResponse:
        """Set KPI target (upsert)"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Determine scope_id
        scope_id = ""
        if data.scope_type == KPIScopeType.INDIVIDUAL.value:
            scope_id = data.user_id or ""
        elif data.scope_type == KPIScopeType.TEAM.value:
            scope_id = data.team_id or ""
        elif data.scope_type == KPIScopeType.BRANCH.value:
            scope_id = data.branch_id or ""
        
        # Calculate period dates
        period_start, period_end = self._get_period_dates(
            data.period_type, data.period_year, data.period_month, data.period_quarter
        )
        
        # Check if target exists
        existing = await self.db.kpi_targets.find_one({
            "kpi_code": data.kpi_code,
            "scope_type": data.scope_type,
            "scope_id": scope_id,
            "period_type": data.period_type,
            "period_year": data.period_year,
            "period_month": data.period_month or 0,
        })
        
        if existing:
            # Update existing
            await self.db.kpi_targets.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "target_value": data.target_value,
                    "stretch_target": data.stretch_target or 0,
                    "minimum_threshold": data.minimum_threshold or 0,
                    "updated_at": now,
                }}
            )
            target_id = existing["id"]
        else:
            # Create new
            target_id = str(uuid.uuid4())
            target_doc = {
                "id": target_id,
                "kpi_code": data.kpi_code,
                "scope_type": data.scope_type,
                "scope_id": scope_id,
                "user_id": data.user_id or "",
                "team_id": data.team_id or "",
                "branch_id": data.branch_id or "",
                "period_type": data.period_type,
                "period_year": data.period_year,
                "period_month": data.period_month or 0,
                "period_quarter": data.period_quarter or 0,
                "period_start": period_start,
                "period_end": period_end,
                "target_value": data.target_value,
                "stretch_target": data.stretch_target or 0,
                "minimum_threshold": data.minimum_threshold or 0,
                "status": "active",
                "created_by": created_by,
                "created_at": now,
                "updated_at": now,
            }
            await self.db.kpi_targets.insert_one(target_doc)
        
        return await self.get_target(target_id)
    
    async def get_target(self, target_id: str) -> Optional[KPITargetResponse]:
        """Get target by ID"""
        target = await self.db.kpi_targets.find_one({"id": target_id}, {"_id": 0})
        if not target:
            return None
        return await self._enrich_target(target)
    
    async def get_targets(
        self,
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
        limit: int = 50
    ) -> List[KPITargetResponse]:
        """Get targets with filters"""
        query = {}
        
        if scope_type:
            query["scope_type"] = scope_type
        if scope_id:
            query["scope_id"] = scope_id
        if user_id:
            query["user_id"] = user_id
        if team_id:
            query["team_id"] = team_id
        if branch_id:
            query["branch_id"] = branch_id
        if period_type:
            query["period_type"] = period_type
        if period_year:
            query["period_year"] = period_year
        if period_month:
            query["period_month"] = period_month
        if kpi_code:
            query["kpi_code"] = kpi_code
        
        targets = await self.db.kpi_targets.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_target(t) for t in targets]
    
    async def _enrich_target(self, target: Dict) -> KPITargetResponse:
        """Enrich target with labels"""
        # Get KPI name
        kpi_name = ""
        kpi_def = await self.db.kpi_definitions.find_one(
            {"code": target.get("kpi_code")},
            {"_id": 0, "name": 1}
        )
        if kpi_def:
            kpi_name = kpi_def.get("name", "")
        
        # Get scope name
        user_name = ""
        team_name = ""
        branch_name = ""
        
        if target.get("user_id"):
            user = await self.db.users.find_one(
                {"id": target["user_id"]},
                {"_id": 0, "full_name": 1}
            )
            if user:
                user_name = user.get("full_name", "")
        
        if target.get("team_id"):
            team = await self.db.teams.find_one(
                {"id": target["team_id"]},
                {"_id": 0, "name": 1}
            )
            if team:
                team_name = team.get("name", "")
        
        if target.get("branch_id"):
            branch = await self.db.branches.find_one(
                {"id": target["branch_id"]},
                {"_id": 0, "name": 1}
            )
            if branch:
                branch_name = branch.get("name", "")
        
        # Get scope label
        scope_config = get_scope_config(target.get("scope_type", ""))
        period_config = get_period_config(target.get("period_type", ""))
        
        # Generate period label
        period_label = self._get_period_label(
            target.get("period_type", ""),
            target.get("period_year", 0),
            target.get("period_month", 0),
            target.get("period_quarter", 0)
        )
        
        # Get creator name
        created_by_name = ""
        if target.get("created_by"):
            creator = await self.db.users.find_one(
                {"id": target["created_by"]},
                {"_id": 0, "full_name": 1}
            )
            if creator:
                created_by_name = creator.get("full_name", "")
        
        return KPITargetResponse(
            **target,
            kpi_name=kpi_name,
            scope_label=scope_config.get("label", ""),
            period_type_label=period_config.get("label", ""),
            period_label=period_label,
            user_name=user_name,
            team_name=team_name,
            branch_name=branch_name,
            created_by_name=created_by_name,
        )
    
    def _get_period_dates(
        self,
        period_type: str,
        year: int,
        month: Optional[int] = None,
        quarter: Optional[int] = None
    ) -> Tuple[str, str]:
        """Get period start and end dates"""
        if period_type == KPIPeriodType.MONTHLY.value and month:
            start = datetime(year, month, 1, tzinfo=timezone.utc)
            last_day = calendar.monthrange(year, month)[1]
            end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        elif period_type == KPIPeriodType.QUARTERLY.value and quarter:
            start_month = (quarter - 1) * 3 + 1
            end_month = start_month + 2
            start = datetime(year, start_month, 1, tzinfo=timezone.utc)
            last_day = calendar.monthrange(year, end_month)[1]
            end = datetime(year, end_month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        elif period_type == KPIPeriodType.YEARLY.value:
            start = datetime(year, 1, 1, tzinfo=timezone.utc)
            end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        else:
            # Default to monthly
            month = month or 1
            start = datetime(year, month, 1, tzinfo=timezone.utc)
            last_day = calendar.monthrange(year, month)[1]
            end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        
        return start.isoformat(), end.isoformat()
    
    def _get_period_label(
        self,
        period_type: str,
        year: int,
        month: int = 0,
        quarter: int = 0
    ) -> str:
        """Generate period label"""
        if period_type == KPIPeriodType.MONTHLY.value and month:
            return f"Tháng {month}/{year}"
        elif period_type == KPIPeriodType.QUARTERLY.value and quarter:
            return f"Q{quarter}/{year}"
        elif period_type == KPIPeriodType.YEARLY.value:
            return f"Năm {year}"
        elif period_type == KPIPeriodType.WEEKLY.value:
            return f"Tuần"
        elif period_type == KPIPeriodType.DAILY.value:
            return f"Ngày"
        return f"{period_type.title()} {year}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # KPI CALCULATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def calculate_kpi_value(
        self,
        kpi_code: str,
        scope_type: str,
        scope_id: Optional[str],
        period_start: str,
        period_end: str
    ) -> float:
        """Calculate single KPI value"""
        # Get KPI definition
        kpi_def = await self.db.kpi_definitions.find_one(
            {"code": kpi_code},
            {"_id": 0}
        )
        if not kpi_def:
            return 0
        
        calc_type = kpi_def.get("calculation_type", "count")
        source_entity = kpi_def.get("source_entity", "")
        source_field = kpi_def.get("source_field", "")
        filter_conditions = kpi_def.get("filter_conditions", {})
        
        # Build query
        query = {
            "created_at": {"$gte": period_start, "$lte": period_end}
        }
        
        # Add scope filter
        if scope_type == KPIScopeType.INDIVIDUAL.value and scope_id:
            query["$or"] = [
                {"assigned_to": scope_id},
                {"owner_id": scope_id},
                {"sales_owner_id": scope_id},
                {"recipient_id": scope_id},
                {"user_id": scope_id},
                {"created_by": scope_id},
            ]
        elif scope_type == KPIScopeType.TEAM.value and scope_id:
            query["team_id"] = scope_id
        elif scope_type == KPIScopeType.BRANCH.value and scope_id:
            query["branch_id"] = scope_id
        
        # Add filter conditions
        for key, value in filter_conditions.items():
            query[key] = value
        
        # Get collection
        if not source_entity:
            return 0
        collection = self.db[source_entity]
        
        # Calculate based on type
        if calc_type == KPICalculationType.COUNT.value:
            return await collection.count_documents(query)
        
        elif calc_type == KPICalculationType.SUM.value and source_field:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "total": {"$sum": f"${source_field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0
        
        elif calc_type == KPICalculationType.AVG.value and source_field:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "avg": {"$avg": f"${source_field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["avg"] if result else 0
        
        return 0
    
    async def calculate_all_kpis(
        self,
        scope_type: str,
        scope_id: Optional[str],
        period_start: str,
        period_end: str
    ) -> Dict[str, float]:
        """Calculate all KPI values for a scope"""
        kpi_defs = await self.db.kpi_definitions.find(
            {"is_active": True},
            {"_id": 0, "code": 1}
        ).to_list(100)
        
        values = {}
        for kpi_def in kpi_defs:
            code = kpi_def["code"]
            values[code] = await self.calculate_kpi_value(
                code, scope_type, scope_id, period_start, period_end
            )
        
        return values
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SCORECARDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_personal_scorecard(
        self,
        user_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> ScorecardResponse:
        """Get personal scorecard"""
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month and period_type == KPIPeriodType.MONTHLY.value:
            period_month = now.month
        
        # Get period dates
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        period_label = self._get_period_label(period_type, period_year, period_month)
        
        # Get user info
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        user_name = user.get("full_name", "") if user else ""
        
        # Get targets
        targets = await self.db.kpi_targets.find({
            "user_id": user_id,
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month or 0,
        }, {"_id": 0}).to_list(100)
        
        target_map = {t["kpi_code"]: t["target_value"] for t in targets}
        
        # Get KPI definitions
        kpi_defs = await self.db.kpi_definitions.find(
            {"is_active": True},
            {"_id": 0}
        ).to_list(100)
        
        # Calculate KPI values and build categories
        categories_map: Dict[str, List[KPIValue]] = {}
        key_metrics = []
        total_score = 0
        total_weight = 0
        kpis_by_status = {"exceeding": 0, "on_track": 0, "at_risk": 0, "behind": 0}
        
        for kpi_def in kpi_defs:
            code = kpi_def["code"]
            category = kpi_def.get("category", "other")
            
            # Skip if not applicable to individual level
            if "individual" not in kpi_def.get("aggregation_levels", []):
                continue
            
            # Calculate value
            actual = await self.calculate_kpi_value(
                code, KPIScopeType.INDIVIDUAL.value, user_id, period_start, period_end
            )
            
            # Get target
            target = target_map.get(code, kpi_def.get("default_target", 0))
            
            # Calculate achievement
            achievement = (actual / target * 100) if target > 0 else 0
            
            # Determine status
            status = get_status_from_achievement(achievement)
            status_config = get_status_config(status)
            kpis_by_status[status] = kpis_by_status.get(status, 0) + 1
            
            # Format values
            formatted_actual = self._format_value(actual, kpi_def.get("format", "number"), kpi_def.get("unit", ""))
            formatted_target = self._format_value(target, kpi_def.get("format", "number"), kpi_def.get("unit", ""))
            
            kpi_value = KPIValue(
                kpi_code=code,
                kpi_name=kpi_def.get("name", code),
                category=category,
                target=target,
                actual=actual,
                achievement=round(achievement, 1),
                status=status,
                status_label=status_config.get("label", ""),
                status_color=status_config.get("color", ""),
                unit=kpi_def.get("unit", ""),
                format=kpi_def.get("format", "number"),
                formatted_actual=formatted_actual,
                formatted_target=formatted_target,
                is_key_metric=kpi_def.get("is_key_metric", False),
            )
            
            # Add to category
            if category not in categories_map:
                categories_map[category] = []
            categories_map[category].append(kpi_value)
            
            # Add to key metrics
            if kpi_def.get("is_key_metric", False):
                key_metrics.append(kpi_value)
            
            # Update score
            weight = kpi_def.get("weight", 1)
            score = min(achievement, 150)  # Cap at 150%
            total_score += score * weight
            total_weight += weight
        
        # Build categories
        categories = []
        for cat_code, kpis in categories_map.items():
            cat_config = get_category_config(cat_code)
            cat_achievement = sum(k.achievement for k in kpis) / len(kpis) if kpis else 0
            categories.append(ScorecardCategory(
                category=cat_code,
                category_label=cat_config.get("label", cat_code),
                category_icon=cat_config.get("icon", ""),
                category_color=cat_config.get("color", ""),
                kpis=kpis,
                category_achievement=round(cat_achievement, 1),
                category_status=get_status_from_achievement(cat_achievement),
            ))
        
        # Sort categories by order
        categories.sort(key=lambda c: get_category_config(c.category).get("order", 99))
        
        # Calculate overall score
        overall_score = total_score / total_weight if total_weight > 0 else 0
        
        # Calculate bonus modifier
        bonus_modifier = get_bonus_modifier(overall_score)
        bonus_tier_label = get_bonus_tier_label(overall_score)
        
        # Build summary
        summary = ScorecardSummary(
            overall_score=round(overall_score, 1),
            overall_score_label=f"{round(overall_score, 1)}%",
            achievement_rate=round(overall_score, 1),
            total_kpis=sum(len(c.kpis) for c in categories),
            kpis_exceeding=kpis_by_status.get("exceeding", 0),
            kpis_on_track=kpis_by_status.get("on_track", 0),
            kpis_at_risk=kpis_by_status.get("at_risk", 0),
            kpis_behind=kpis_by_status.get("behind", 0),
        )
        
        return ScorecardResponse(
            scope_type=KPIScopeType.INDIVIDUAL.value,
            scope_id=user_id,
            scope_name=user_name,
            period_type=period_type,
            period_label=period_label,
            period_start=period_start,
            period_end=period_end,
            summary=summary,
            categories=categories,
            key_metrics=key_metrics,
            bonus_modifier=bonus_modifier,
            bonus_tier_label=bonus_tier_label,
            snapshot_at=now.isoformat(),
        )
    
    async def get_team_scorecard(
        self,
        team_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> TeamScorecardResponse:
        """Get team scorecard with member breakdown"""
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month and period_type == KPIPeriodType.MONTHLY.value:
            period_month = now.month
        
        # Get period dates
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        period_label = self._get_period_label(period_type, period_year, period_month)
        
        # Get team info
        team = await self.db.teams.find_one({"id": team_id}, {"_id": 0})
        team_name = team.get("name", "") if team else ""
        leader_id = team.get("leader_id", "") if team else ""
        
        # Get leader name
        leader_name = ""
        if leader_id:
            leader = await self.db.users.find_one({"id": leader_id}, {"_id": 0, "full_name": 1})
            if leader:
                leader_name = leader.get("full_name", "")
        
        # Get team members
        members = await self.db.users.find(
            {"team_id": team_id, "is_active": True},
            {"_id": 0, "id": 1, "full_name": 1, "position": 1}
        ).to_list(50)
        
        # Calculate team KPIs
        team_kpis = []
        kpi_defs = await self.db.kpi_definitions.find(
            {"is_active": True, "is_key_metric": True},
            {"_id": 0}
        ).to_list(20)
        
        for kpi_def in kpi_defs:
            code = kpi_def["code"]
            
            if "team" not in kpi_def.get("aggregation_levels", []):
                continue
            
            actual = await self.calculate_kpi_value(
                code, KPIScopeType.TEAM.value, team_id, period_start, period_end
            )
            
            # Get team target
            target_doc = await self.db.kpi_targets.find_one({
                "kpi_code": code,
                "team_id": team_id,
                "period_type": period_type,
                "period_year": period_year,
                "period_month": period_month or 0,
            }, {"_id": 0})
            
            target = target_doc.get("target_value", 0) if target_doc else kpi_def.get("default_target", 0)
            achievement = (actual / target * 100) if target > 0 else 0
            status = get_status_from_achievement(achievement)
            status_config = get_status_config(status)
            
            formatted_actual = self._format_value(actual, kpi_def.get("format", "number"), kpi_def.get("unit", ""))
            formatted_target = self._format_value(target, kpi_def.get("format", "number"), kpi_def.get("unit", ""))
            
            team_kpis.append(KPIValue(
                kpi_code=code,
                kpi_name=kpi_def.get("name", code),
                target=target,
                actual=actual,
                achievement=round(achievement, 1),
                status=status,
                status_label=status_config.get("label", ""),
                status_color=status_config.get("color", ""),
                unit=kpi_def.get("unit", ""),
                format=kpi_def.get("format", "number"),
                formatted_actual=formatted_actual,
                formatted_target=formatted_target,
            ))
        
        # Calculate member performances
        member_performances = []
        for member in members:
            member_id = member["id"]
            
            # Get personal scorecard (simplified)
            personal = await self.get_personal_scorecard(
                member_id, period_type, period_year, period_month
            )
            
            # Get specific metrics
            revenue = await self.calculate_kpi_value(
                "REVENUE_ACTUAL", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            deals_won = await self.calculate_kpi_value(
                "DEALS_WON", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            
            status = get_status_from_achievement(personal.summary.overall_score)
            status_config = get_status_config(status)
            
            member_performances.append(TeamMemberPerformance(
                user_id=member_id,
                user_name=member.get("full_name", ""),
                position=member.get("position", ""),
                overall_score=personal.summary.overall_score,
                achievement_rate=personal.summary.achievement_rate,
                status=status,
                status_label=status_config.get("label", ""),
                status_color=status_config.get("color", ""),
                revenue=revenue,
                revenue_formatted=self._format_value(revenue, "currency", "VND"),
                deals_won=int(deals_won),
            ))
        
        # Sort by score and assign ranks
        member_performances.sort(key=lambda m: m.overall_score, reverse=True)
        for i, member in enumerate(member_performances):
            member.rank_in_team = i + 1
        
        # Calculate team summary
        total_score = sum(m.overall_score for m in member_performances)
        avg_score = total_score / len(member_performances) if member_performances else 0
        
        kpis_by_status = {"exceeding": 0, "on_track": 0, "at_risk": 0, "behind": 0}
        for kpi in team_kpis:
            kpis_by_status[kpi.status] = kpis_by_status.get(kpi.status, 0) + 1
        
        summary = ScorecardSummary(
            overall_score=round(avg_score, 1),
            achievement_rate=round(avg_score, 1),
            total_kpis=len(team_kpis),
            kpis_exceeding=kpis_by_status.get("exceeding", 0),
            kpis_on_track=kpis_by_status.get("on_track", 0),
            kpis_at_risk=kpis_by_status.get("at_risk", 0),
            kpis_behind=kpis_by_status.get("behind", 0),
        )
        
        return TeamScorecardResponse(
            team_id=team_id,
            team_name=team_name,
            leader_id=leader_id,
            leader_name=leader_name,
            period_type=period_type,
            period_label=period_label,
            period_start=period_start,
            period_end=period_end,
            summary=summary,
            team_kpis=team_kpis,
            member_count=len(members),
            members=member_performances,
            snapshot_at=now.isoformat(),
        )
    
    def _format_value(self, value: float, format_type: str, unit: str) -> str:
        """Format value for display"""
        if format_type == "currency":
            if value >= 1_000_000_000:
                return f"{value / 1_000_000_000:.1f} tỷ"
            elif value >= 1_000_000:
                return f"{value / 1_000_000:.0f} tr"
            else:
                return f"{value:,.0f} {unit}"
        elif format_type == "percent":
            return f"{value:.1f}%"
        elif format_type == "duration":
            return f"{value:.0f} {unit}"
        else:
            if value >= 1000:
                return f"{value:,.0f}"
            return f"{value:.0f}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEADERBOARDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_leaderboard(
        self,
        leaderboard_type: str,
        scope_type: str = "company",
        scope_id: Optional[str] = None,
        current_user_id: Optional[str] = None
    ) -> LeaderboardResponse:
        """Get leaderboard"""
        config = get_leaderboard_config(leaderboard_type)
        now = datetime.now(timezone.utc)
        
        # Get period
        period_type = config.get("period_type", KPIPeriodType.MONTHLY.value)
        period_year = now.year
        period_month = now.month if period_type in ["daily", "weekly", "monthly"] else None
        
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        period_label = self._get_period_label(period_type, period_year, period_month)
        
        # Get primary KPI info
        primary_kpi = config.get("primary_kpi", "REVENUE_ACTUAL")
        kpi_def = await self.db.kpi_definitions.find_one(
            {"code": primary_kpi},
            {"_id": 0}
        )
        primary_kpi_name = kpi_def.get("name", primary_kpi) if kpi_def else primary_kpi
        primary_kpi_unit = kpi_def.get("unit", "") if kpi_def else ""
        
        # Get users
        user_query = {"is_active": True, "role": "sales"}
        if scope_type == "branch" and scope_id:
            user_query["branch_id"] = scope_id
        elif scope_type == "team" and scope_id:
            user_query["team_id"] = scope_id
        
        users = await self.db.users.find(
            user_query,
            {"_id": 0, "id": 1, "full_name": 1, "team_id": 1, "branch_id": 1}
        ).to_list(500)
        
        # Calculate values for each user
        entries_data = []
        for user in users:
            value = await self.calculate_kpi_value(
                primary_kpi,
                KPIScopeType.INDIVIDUAL.value,
                user["id"],
                period_start,
                period_end
            )
            
            # Get team name
            team_name = ""
            if user.get("team_id"):
                team = await self.db.teams.find_one(
                    {"id": user["team_id"]},
                    {"_id": 0, "name": 1}
                )
                if team:
                    team_name = team.get("name", "")
            
            # Get target
            target_doc = await self.db.kpi_targets.find_one({
                "kpi_code": primary_kpi,
                "user_id": user["id"],
                "period_type": period_type,
                "period_year": period_year,
                "period_month": period_month or 0,
            }, {"_id": 0})
            target = target_doc.get("target_value", 0) if target_doc else 0
            achievement = (value / target * 100) if target > 0 else 0
            
            entries_data.append({
                "user_id": user["id"],
                "user_name": user.get("full_name", ""),
                "team_id": user.get("team_id", ""),
                "team_name": team_name,
                "branch_id": user.get("branch_id", ""),
                "value": value,
                "target": target,
                "achievement": achievement,
            })
        
        # Sort by value
        entries_data.sort(key=lambda x: x["value"], reverse=True)
        
        # Build entries with ranks
        show_top_n = config.get("show_top_n", 20)
        entries = []
        current_user_rank = 0
        
        for i, data in enumerate(entries_data[:show_top_n]):
            rank = i + 1
            rank_badge = ""
            if rank == 1:
                rank_badge = "🥇"
            elif rank == 2:
                rank_badge = "🥈"
            elif rank == 3:
                rank_badge = "🥉"
            
            formatted_value = self._format_value(
                data["value"],
                kpi_def.get("format", "number") if kpi_def else "number",
                primary_kpi_unit
            )
            
            is_current_user = data["user_id"] == current_user_id
            if is_current_user:
                current_user_rank = rank
            
            entries.append(LeaderboardEntry(
                rank=rank,
                rank_badge=rank_badge,
                user_id=data["user_id"],
                user_name=data["user_name"],
                team_id=data.get("team_id") or "",
                team_name=data.get("team_name") or "",
                branch_id=data.get("branch_id") or "",
                primary_value=data["value"],
                primary_formatted=formatted_value,
                target=data["target"],
                achievement=round(data["achievement"], 1),
                is_current_user=is_current_user,
            ))
        
        # Find current user rank if not in top
        if current_user_id and current_user_rank == 0:
            for i, data in enumerate(entries_data):
                if data["user_id"] == current_user_id:
                    current_user_rank = i + 1
                    break
        
        return LeaderboardResponse(
            id=f"lb-{leaderboard_type}-{scope_type}",
            name=config.get("name", leaderboard_type),
            description=config.get("description", ""),
            leaderboard_type=leaderboard_type,
            scope_type=scope_type,
            scope_id=scope_id or "",
            period_type=period_type,
            period_label=period_label,
            primary_kpi=primary_kpi,
            primary_kpi_name=primary_kpi_name,
            primary_kpi_unit=primary_kpi_unit,
            entries=entries,
            total_participants=len(entries_data),
            current_user_rank=current_user_rank,
            last_calculated_at=now.isoformat(),
        )
    
    async def get_available_leaderboards(self) -> List[Dict]:
        """Get list of available leaderboards"""
        return [
            {
                "type": lb_type,
                "name": config.get("name", lb_type),
                "description": config.get("description", ""),
                "period_type": config.get("period_type", "monthly"),
            }
            for lb_type, config in LEADERBOARD_CONFIG.items()
        ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BONUS CALCULATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def calculate_bonus_modifier(
        self,
        user_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> BonusCalculationResult:
        """Calculate bonus modifier based on KPI achievement"""
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month and period_type == KPIPeriodType.MONTHLY.value:
            period_month = now.month
        
        # Get user info
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        user_name = user.get("full_name", "") if user else ""
        
        # Get scorecard
        scorecard = await self.get_personal_scorecard(
            user_id, period_type, period_year, period_month
        )
        
        # Get KPI achievements
        kpi_achievements = {}
        for category in scorecard.categories:
            for kpi in category.kpis:
                kpi_achievements[kpi.kpi_code] = kpi.achievement
        
        # Get active bonus rules
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        
        bonus_rules = await self.db.kpi_bonus_rules.find({
            "is_active": True,
            "effective_from": {"$lte": period_end},
            "$or": [
                {"effective_to": None},
                {"effective_to": {"$gte": period_start}}
            ]
        }, {"_id": 0}).to_list(10)
        
        # Calculate bonus modifier
        bonus_modifier = 1.0
        bonus_tier_label = ""
        
        if bonus_rules:
            # Use first matching rule
            rule = bonus_rules[0]
            tiers = [BonusTier(**t) for t in rule.get("tiers", [])]
            
            # Get achievement based on calculation basis
            calc_basis = rule.get("calculation_basis", "single_kpi")
            
            if calc_basis == "single_kpi":
                kpi_code = rule.get("kpi_codes", ["REVENUE_ACTUAL"])[0]
                achievement = kpi_achievements.get(kpi_code, 0)
            elif calc_basis == "weighted_kpis":
                weights = rule.get("kpi_weights", {})
                total_weighted = 0
                total_weight = 0
                for kpi_code, weight in weights.items():
                    if kpi_code in kpi_achievements:
                        total_weighted += kpi_achievements[kpi_code] * weight
                        total_weight += weight
                achievement = total_weighted / total_weight if total_weight > 0 else 0
            else:
                # Average
                kpi_codes = rule.get("kpi_codes", [])
                achievements = [kpi_achievements.get(c, 0) for c in kpi_codes if c in kpi_achievements]
                achievement = sum(achievements) / len(achievements) if achievements else 0
            
            bonus_modifier = get_bonus_modifier(achievement, [t.dict() for t in tiers])
            bonus_tier_label = get_bonus_tier_label(achievement, [t.dict() for t in tiers])
        else:
            # Use default tiers
            achievement = scorecard.summary.overall_score
            bonus_modifier = get_bonus_modifier(achievement)
            bonus_tier_label = get_bonus_tier_label(achievement)
        
        # Count applicable commissions
        applicable_commissions = await self.db.commission_records.count_documents({
            "recipient_id": user_id,
            "created_at": {"$gte": period_start, "$lte": period_end},
            "status": {"$in": ["pending", "pending_approval", "approved"]},
            "is_locked": False,
        })
        
        # Calculate commission totals
        pipeline = [
            {
                "$match": {
                    "recipient_id": user_id,
                    "created_at": {"$gte": period_start, "$lte": period_end},
                    "status": {"$in": ["pending", "pending_approval", "approved"]},
                    "is_locked": False,
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$commission_amount"}
                }
            }
        ]
        result = await self.db.commission_records.aggregate(pipeline).to_list(1)
        original_total = result[0]["total"] if result else 0
        adjusted_total = original_total * bonus_modifier
        
        return BonusCalculationResult(
            user_id=user_id,
            user_name=user_name,
            period_type=period_type,
            period_label=self._get_period_label(period_type, period_year, period_month),
            overall_achievement=scorecard.summary.overall_score,
            kpi_achievements=kpi_achievements,
            bonus_modifier=bonus_modifier,
            bonus_tier_label=bonus_tier_label,
            applicable_commissions=applicable_commissions,
            original_commission_total=original_total,
            adjusted_commission_total=adjusted_total,
            bonus_amount=adjusted_total - original_total,
        )
    
    async def apply_bonus_to_commissions(
        self,
        user_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> Dict:
        """Apply bonus modifier to pending commissions"""
        # Calculate bonus
        bonus_result = await self.calculate_bonus_modifier(
            user_id, period_type, period_year, period_month
        )
        
        if bonus_result.bonus_modifier == 1.0:
            return {
                "success": True,
                "message": "No bonus modifier to apply",
                "bonus_modifier": 1.0,
                "records_updated": 0,
            }
        
        # Get period dates
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month:
            period_month = now.month
        
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        
        # Update commissions
        result = await self.db.commission_records.update_many(
            {
                "recipient_id": user_id,
                "created_at": {"$gte": period_start, "$lte": period_end},
                "status": {"$in": ["pending", "pending_approval"]},
                "is_locked": False,
            },
            [
                {
                    "$set": {
                        "kpi_bonus_modifier": bonus_result.bonus_modifier,
                        "kpi_bonus_tier": bonus_result.bonus_tier_label,
                        "final_amount": {
                            "$multiply": ["$commission_amount", bonus_result.bonus_modifier]
                        },
                        "kpi_bonus_applied_at": now.isoformat(),
                    }
                }
            ]
        )
        
        return {
            "success": True,
            "bonus_modifier": bonus_result.bonus_modifier,
            "bonus_tier": bonus_result.bonus_tier_label,
            "records_updated": result.modified_count,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BONUS RULES
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_bonus_rule(
        self,
        data: KPIBonusRuleCreate,
        created_by: str
    ) -> KPIBonusRuleResponse:
        """Create bonus rule with versioning for financial-grade compliance"""
        rule_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        rule_doc = {
            "id": rule_id,
            "code": data.code,
            "name": data.name,
            "description": data.description or "",
            "kpi_codes": data.kpi_codes,
            "calculation_basis": data.calculation_basis,
            "kpi_weights": data.kpi_weights,
            "tiers": [t.dict() for t in data.tiers],
            "apply_to_commission_types": data.apply_to_commission_types,
            "calculation_method": data.calculation_method,
            "scope_type": data.scope_type,
            "scope_ids": data.scope_ids,
            "effective_from": data.effective_from,
            "effective_to": data.effective_to or "",
            "is_active": True,
            # FINANCIAL-GRADE: Rule Versioning
            "version": 1,
            "version_history": [{
                "version": 1,
                "created_at": now,
                "created_by": created_by,
                "tiers": [t.dict() for t in data.tiers],
                "action": "created"
            }],
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.kpi_bonus_rules.insert_one(rule_doc)
        return await self._enrich_bonus_rule(rule_doc)
    
    async def get_bonus_rules(self, is_active: bool = True) -> List[KPIBonusRuleResponse]:
        """Get bonus rules"""
        query = {"is_active": is_active}
        rules = await self.db.kpi_bonus_rules.find(
            query, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        
        return [await self._enrich_bonus_rule(r) for r in rules]
    
    async def get_bonus_rule(self, rule_id: str) -> Optional[KPIBonusRuleResponse]:
        """Get single bonus rule by ID"""
        rule = await self.db.kpi_bonus_rules.find_one({"id": rule_id}, {"_id": 0})
        if not rule:
            return None
        return await self._enrich_bonus_rule(rule)
    
    async def update_bonus_rule(
        self, 
        rule_id: str, 
        data: "KPIBonusRuleUpdate", 
        user_id: str
    ) -> Optional[KPIBonusRuleResponse]:
        """
        Update bonus rule with VERSIONING for financial-grade compliance.
        - KPI tiers must be configurable, not hardcoded
        - Each update increments version number
        - Version history is preserved for audit
        """
        from models.kpi_models import KPIBonusRuleUpdate
        
        existing = await self.db.kpi_bonus_rules.find_one({"id": rule_id}, {"_id": 0})
        if not existing:
            return None
        
        now = datetime.now(timezone.utc).isoformat()
        
        # FINANCIAL-GRADE: Increment version when tiers change
        current_version = existing.get("version", 1)
        new_version = current_version
        version_history = existing.get("version_history") or []
        
        # Build update document with only provided fields
        update_doc = {"updated_at": now, "updated_by": user_id}
        
        if data.name is not None:
            update_doc["name"] = data.name
        if data.description is not None:
            update_doc["description"] = data.description
        if data.kpi_codes is not None:
            update_doc["kpi_codes"] = data.kpi_codes
        if data.calculation_basis is not None:
            update_doc["calculation_basis"] = data.calculation_basis
        if data.kpi_weights is not None:
            update_doc["kpi_weights"] = data.kpi_weights
        if data.tiers is not None:
            # TIERS CHANGED - INCREMENT VERSION
            new_version = current_version + 1
            update_doc["tiers"] = [t.dict() for t in data.tiers]
            update_doc["version"] = new_version
            
            # Add to version history
            version_history.append({
                "version": new_version,
                "created_at": now,
                "created_by": user_id,
                "tiers": [t.dict() for t in data.tiers],
                "action": "tiers_updated",
                "previous_version": current_version
            })
            update_doc["version_history"] = version_history
            
        if data.apply_to_commission_types is not None:
            update_doc["apply_to_commission_types"] = data.apply_to_commission_types
        if data.calculation_method is not None:
            update_doc["calculation_method"] = data.calculation_method
        if data.scope_type is not None:
            update_doc["scope_type"] = data.scope_type
        if data.scope_ids is not None:
            update_doc["scope_ids"] = data.scope_ids
        if data.effective_from is not None:
            update_doc["effective_from"] = data.effective_from
        if data.effective_to is not None:
            update_doc["effective_to"] = data.effective_to
        if data.is_active is not None:
            update_doc["is_active"] = data.is_active
        
        await self.db.kpi_bonus_rules.update_one(
            {"id": rule_id},
            {"$set": update_doc}
        )
        
        return await self.get_bonus_rule(rule_id)
    
    async def deactivate_bonus_rule(self, rule_id: str) -> bool:
        """Deactivate a bonus rule"""
        result = await self.db.kpi_bonus_rules.update_one(
            {"id": rule_id},
            {"$set": {
                "is_active": False,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return result.modified_count > 0
    
    async def _enrich_bonus_rule(self, rule: Dict) -> KPIBonusRuleResponse:
        """Enrich bonus rule with labels"""
        # Get KPI names
        kpi_names = []
        for code in rule.get("kpi_codes", []):
            kpi_def = await self.db.kpi_definitions.find_one(
                {"code": code},
                {"_id": 0, "name": 1}
            )
            if kpi_def:
                kpi_names.append(kpi_def.get("name", code))
        
        # Get creator name
        created_by_name = ""
        if rule.get("created_by"):
            user = await self.db.users.find_one(
                {"id": rule["created_by"]},
                {"_id": 0, "full_name": 1}
            )
            if user:
                created_by_name = user.get("full_name", "")
        
        # Convert tiers to BonusTier objects
        tiers = [BonusTier(**t) for t in rule.get("tiers", [])]
        
        # Create a copy of rule without tiers to avoid duplicate keyword argument
        rule_data = {k: v for k, v in rule.items() if k != "tiers"}
        
        return KPIBonusRuleResponse(
            **rule_data,
            kpi_names=kpi_names,
            created_by_name=created_by_name,
            tiers=tiers,
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # KPI TRENDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_kpi_trend(
        self,
        kpi_code: str,
        scope_type: str = "individual",
        scope_id: Optional[str] = None,
        periods: int = 6,
        period_type: str = "monthly"
    ) -> KPITrendResponse:
        """Get KPI trend over time"""
        now = datetime.now(timezone.utc)
        
        # Get KPI definition
        kpi_def = await self.db.kpi_definitions.find_one(
            {"code": kpi_code},
            {"_id": 0}
        )
        kpi_name = kpi_def.get("name", kpi_code) if kpi_def else kpi_code
        unit = kpi_def.get("unit", "") if kpi_def else ""
        format_type = kpi_def.get("format", "number") if kpi_def else "number"
        
        # Get scope name
        scope_name = ""
        if scope_type == KPIScopeType.INDIVIDUAL.value and scope_id:
            user = await self.db.users.find_one({"id": scope_id}, {"_id": 0, "full_name": 1})
            if user:
                scope_name = user.get("full_name", "")
        
        # Calculate data points
        data_points = []
        current_value = 0
        previous_value = 0
        
        for i in range(periods - 1, -1, -1):
            if period_type == KPIPeriodType.MONTHLY.value:
                # Go back i months
                month = now.month - i
                year = now.year
                while month <= 0:
                    month += 12
                    year -= 1
                
                period_start, period_end = self._get_period_dates(period_type, year, month)
                period_label = self._get_period_label(period_type, year, month)
            else:
                # Default to monthly
                month = now.month - i
                year = now.year
                while month <= 0:
                    month += 12
                    year -= 1
                
                period_start, period_end = self._get_period_dates(period_type, year, month)
                period_label = self._get_period_label(period_type, year, month)
            
            value = await self.calculate_kpi_value(
                kpi_code, scope_type, scope_id, period_start, period_end
            )
            
            # Get target for achievement calculation
            target = 0
            if scope_type == KPIScopeType.INDIVIDUAL.value and scope_id:
                target_doc = await self.db.kpi_targets.find_one({
                    "kpi_code": kpi_code,
                    "user_id": scope_id,
                    "period_type": period_type,
                    "period_year": year,
                    "period_month": month,
                }, {"_id": 0})
                if target_doc:
                    target = target_doc.get("target_value", 0)
            
            achievement = (value / target * 100) if target > 0 else 0
            
            data_points.append(KPITrendPoint(
                period_label=period_label,
                period_start=period_start,
                period_end=period_end,
                value=value,
                formatted_value=self._format_value(value, format_type, unit),
                target=target,
                achievement=round(achievement, 1),
            ))
            
            if i == 0:
                current_value = value
            elif i == 1:
                previous_value = value
        
        # Calculate trend
        change_percent = ((current_value - previous_value) / previous_value * 100) if previous_value > 0 else 0
        trend = "up" if change_percent > 5 else ("down" if change_percent < -5 else "stable")
        
        return KPITrendResponse(
            kpi_code=kpi_code,
            kpi_name=kpi_name,
            unit=unit,
            scope_type=scope_type,
            scope_id=scope_id or "",
            scope_name=scope_name,
            data_points=data_points,
            current_value=current_value,
            previous_value=previous_value,
            change_percent=round(change_percent, 1),
            trend=trend,
        )


    # ═══════════════════════════════════════════════════════════════════════════
    # REAL ESTATE KPI - PHASE 2 SPECIFIC METHODS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_my_performance(
        self,
        user_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get personal KPI performance for sales rep - designed for daily use
        Returns: scorecard + alerts + commission impact
        """
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month and period_type == KPIPeriodType.MONTHLY.value:
            period_month = now.month
        
        # Get scorecard
        scorecard = await self.get_personal_scorecard(
            user_id, period_type, period_year, period_month
        )
        
        # Get user info
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        user_name = user.get("full_name", "") if user else ""
        user_code = user.get("employee_code", "") if user else ""
        team_id = user.get("team_id", "") if user else ""
        
        # Get alerts for this user
        alerts = await self.get_user_alerts(user_id)
        
        # Calculate commission multiplier from KPI
        bonus_result = await self.calculate_bonus_modifier(
            user_id, period_type, period_year, period_month
        )
        
        # Get rank in team/company
        rank_data = await self._get_user_rank(
            user_id, team_id, period_type, period_year, period_month
        )
        
        # Calculate grade (A+, A, B, C, D, F)
        grade = self._calculate_grade(scorecard.summary.overall_score)
        
        # Build KPIs with Real Estate specific formatting
        kpis = []
        for category in scorecard.categories:
            for kpi in category.kpis:
                kpis.append({
                    **kpi.dict(),
                    "category_label": category.category_label,
                })
        
        return {
            "user_id": user_id,
            "user_name": user_name,
            "user_code": user_code,
            "team_id": team_id,
            "period_type": period_type,
            "period_label": scorecard.period_label,
            "period_year": period_year,
            "period_month": period_month,
            "summary": {
                "total_score": scorecard.summary.overall_score,
                "grade": grade,
                "achieved_kpis": scorecard.summary.kpis_exceeding + scorecard.summary.kpis_on_track,
                "total_kpis": scorecard.summary.total_kpis,
                "rank": rank_data.get("rank", 0),
                "rank_total": rank_data.get("total", 0),
                "rank_change": rank_data.get("change", 0),
                "commission_multiplier": bonus_result.bonus_modifier,
                "bonus_tier": bonus_result.bonus_tier_label,
                "bonus_amount": bonus_result.bonus_amount,
            },
            "kpis": kpis,
            "alerts": alerts,
            "bonus_modifier": bonus_result.bonus_modifier,
            "categories": [cat.dict() for cat in scorecard.categories],
        }
    
    async def get_team_performance(
        self,
        team_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get team KPI performance for leaders
        Returns: team summary + member breakdown + alerts
        """
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month and period_type == KPIPeriodType.MONTHLY.value:
            period_month = now.month
        
        # Get period dates
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        period_label = self._get_period_label(period_type, period_year, period_month)
        
        # Get team info
        team = await self.db.teams.find_one({"id": team_id}, {"_id": 0})
        team_name = team.get("name", "Team") if team else "Team"
        leader_id = team.get("leader_id", "") if team else ""
        
        # Get team members
        members = await self.db.users.find(
            {"team_id": team_id, "is_active": True},
            {"_id": 0}
        ).to_list(50)
        
        # Calculate each member's performance
        member_performances = []
        total_revenue = 0
        total_score = 0
        members_on_track = 0
        
        for member in members:
            member_id = member["id"]
            
            # Get personal scorecard
            try:
                scorecard = await self.get_personal_scorecard(
                    member_id, period_type, period_year, period_month
                )
                score = scorecard.summary.overall_score
            except:
                score = 0
            
            # Get specific KPIs
            revenue = await self.calculate_kpi_value(
                "REVENUE_ACTUAL", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            deals_won = await self.calculate_kpi_value(
                "DEALS_WON", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            leads_contacted = await self.calculate_kpi_value(
                "NEW_CUSTOMERS", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            calls_made = await self.calculate_kpi_value(
                "CALLS_MADE", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            bookings = await self.calculate_kpi_value(
                "SOFT_BOOKINGS", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            ) + await self.calculate_kpi_value(
                "HARD_BOOKINGS", KPIScopeType.INDIVIDUAL.value, member_id, period_start, period_end
            )
            
            total_revenue += revenue
            total_score += score
            if score >= 70:
                members_on_track += 1
            
            member_performances.append({
                "user_id": member_id,
                "user_name": member.get("full_name", "Unknown"),
                "user_code": member.get("employee_code", ""),
                "total_score": score,
                "revenue": revenue,
                "deals_won": int(deals_won),
                "leads_contacted": int(leads_contacted),
                "calls_made": int(calls_made),
                "bookings": int(bookings),
                "needs_improvement": score < 60,
                "trend": "stable",  # TODO: Calculate from previous period
            })
        
        # Sort by score and assign ranks
        member_performances.sort(key=lambda m: m["total_score"], reverse=True)
        for i, member in enumerate(member_performances):
            member["rank"] = i + 1
        
        # Get team alerts
        alerts = await self.get_team_alerts(team_id)
        
        return {
            "team_id": team_id,
            "team_name": team_name,
            "leader_id": leader_id,
            "period_type": period_type,
            "period_label": period_label,
            "period_year": period_year,
            "period_month": period_month,
            "summary": {
                "avg_score": total_score / len(members) if members else 0,
                "total_revenue": total_revenue,
                "members_on_track": members_on_track,
                "total_members": len(members),
            },
            "members": member_performances,
            "alerts": alerts,
        }
    
    async def get_user_alerts(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get KPI alerts for a user"""
        now = datetime.now(timezone.utc)
        period_year = now.year
        period_month = now.month
        
        alerts = []
        
        # Get user's scorecard
        try:
            scorecard = await self.get_personal_scorecard(
                user_id, "monthly", period_year, period_month
            )
        except:
            return alerts
        
        # Check for behind KPIs
        for category in scorecard.categories:
            for kpi in category.kpis:
                if kpi.status == "behind":
                    alerts.append({
                        "id": f"alert-{user_id}-{kpi.kpi_code}",
                        "type": "kpi_behind",
                        "severity": "critical" if kpi.achievement < 50 else "warning",
                        "kpi_code": kpi.kpi_code,
                        "kpi_name": kpi.kpi_name,
                        "message": f"{kpi.kpi_name}: {kpi.achievement:.1f}% (cần {100 - kpi.achievement:.1f}% nữa)",
                        "achievement": kpi.achievement,
                        "created_at": now.isoformat(),
                    })
                elif kpi.status == "at_risk":
                    alerts.append({
                        "id": f"alert-{user_id}-{kpi.kpi_code}",
                        "type": "kpi_at_risk",
                        "severity": "warning",
                        "kpi_code": kpi.kpi_code,
                        "kpi_name": kpi.kpi_name,
                        "message": f"{kpi.kpi_name}: {kpi.achievement:.1f}% - Có rủi ro không đạt target",
                        "achievement": kpi.achievement,
                        "created_at": now.isoformat(),
                    })
        
        # Check if overall score is low
        if scorecard.summary.overall_score < 70:
            alerts.insert(0, {
                "id": f"alert-{user_id}-overall",
                "type": "overall_score_low",
                "severity": "critical",
                "message": f"Điểm tổng {scorecard.summary.overall_score:.1f}% - Dưới ngưỡng Commission!",
                "achievement": scorecard.summary.overall_score,
                "created_at": now.isoformat(),
            })
        
        return alerts[:limit]
    
    async def get_team_alerts(self, team_id: str, limit: int = 10) -> List[Dict]:
        """Get KPI alerts for a team"""
        now = datetime.now(timezone.utc)
        period_year = now.year
        period_month = now.month
        
        alerts = []
        
        # Get team members
        members = await self.db.users.find(
            {"team_id": team_id, "is_active": True},
            {"_id": 0, "id": 1, "full_name": 1}
        ).to_list(50)
        
        for member in members:
            member_alerts = await self.get_user_alerts(member["id"], 3)
            for alert in member_alerts:
                if alert.get("severity") == "critical":
                    alerts.append({
                        **alert,
                        "employee_id": member["id"],
                        "employee_name": member.get("full_name", "Unknown"),
                    })
        
        # Sort by severity
        alerts.sort(key=lambda a: 0 if a.get("severity") == "critical" else 1)
        
        return alerts[:limit]
    
    async def _get_user_rank(
        self,
        user_id: str,
        team_id: str,
        period_type: str,
        period_year: int,
        period_month: Optional[int]
    ) -> Dict[str, int]:
        """Get user's rank in team/company"""
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        
        # Get all users in same scope
        if team_id:
            users = await self.db.users.find(
                {"team_id": team_id, "is_active": True},
                {"_id": 0, "id": 1}
            ).to_list(100)
        else:
            users = await self.db.users.find(
                {"is_active": True, "role": "sales"},
                {"_id": 0, "id": 1}
            ).to_list(500)
        
        # Calculate scores for all users
        scores = []
        for user in users:
            uid = user["id"]
            try:
                revenue = await self.calculate_kpi_value(
                    "REVENUE_ACTUAL", KPIScopeType.INDIVIDUAL.value, uid, period_start, period_end
                )
                scores.append({"user_id": uid, "value": revenue})
            except:
                scores.append({"user_id": uid, "value": 0})
        
        # Sort and find rank
        scores.sort(key=lambda x: x["value"], reverse=True)
        rank = 0
        for i, s in enumerate(scores):
            if s["user_id"] == user_id:
                rank = i + 1
                break
        
        return {
            "rank": rank,
            "total": len(scores),
            "change": 0,  # TODO: Compare with previous period
        }
    
    def _calculate_grade(self, score: float) -> str:
        """Calculate letter grade from score"""
        if score >= 120:
            return "A+"
        elif score >= 100:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 60:
            return "C"
        elif score >= 40:
            return "D"
        else:
            return "F"
    
    async def get_kpi_definitions_for_config(self) -> List[Dict]:
        """Get KPI definitions formatted for config page"""
        definitions = await self.db.kpi_definitions.find(
            {"is_active": True},
            {"_id": 0}
        ).sort("weight", -1).to_list(100)
        
        return definitions
    
    async def update_kpi_definition(
        self, 
        kpi_code: str, 
        updates: Dict[str, Any]
    ) -> bool:
        """Update KPI definition (weight, target, etc.)"""
        now = datetime.now(timezone.utc).isoformat()
        
        update_doc = {"updated_at": now}
        
        if "weight" in updates:
            update_doc["weight"] = updates["weight"]
        if "default_target" in updates:
            update_doc["default_target"] = updates["default_target"]
        if "thresholds" in updates:
            update_doc["thresholds"] = updates["thresholds"]
        
        result = await self.db.kpi_definitions.update_one(
            {"code": kpi_code},
            {"$set": update_doc}
        )
        
        return result.modified_count > 0
    
    async def get_bonus_tiers_config(self) -> List[Dict]:
        """Get bonus tiers for config page"""
        # First try to get from database
        rule = await self.db.kpi_bonus_rules.find_one(
            {"is_active": True, "code": "DEFAULT_COMMISSION_TIERS"},
            {"_id": 0}
        )
        
        if rule and rule.get("tiers"):
            return rule["tiers"]
        
        # Return default tiers from config
        return DEFAULT_BONUS_TIERS
    
    async def update_bonus_tiers(self, tiers: List[Dict], user_id: str) -> bool:
        """Update bonus tiers configuration"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if default rule exists
        existing = await self.db.kpi_bonus_rules.find_one(
            {"code": "DEFAULT_COMMISSION_TIERS"},
            {"_id": 0}
        )
        
        if existing:
            # Update existing
            current_version = existing.get("version", 1)
            version_history = existing.get("version_history", [])
            
            version_history.append({
                "version": current_version + 1,
                "created_at": now,
                "created_by": user_id,
                "tiers": tiers,
                "action": "tiers_updated",
            })
            
            await self.db.kpi_bonus_rules.update_one(
                {"code": "DEFAULT_COMMISSION_TIERS"},
                {"$set": {
                    "tiers": tiers,
                    "version": current_version + 1,
                    "version_history": version_history,
                    "updated_at": now,
                    "updated_by": user_id,
                }}
            )
        else:
            # Create new
            rule_doc = {
                "id": str(uuid.uuid4()),
                "code": "DEFAULT_COMMISSION_TIERS",
                "name": "Hệ số Commission theo KPI",
                "description": "Bảng hệ số nhân commission dựa trên % hoàn thành KPI",
                "kpi_codes": ["REVENUE_ACTUAL"],
                "calculation_basis": "single_kpi",
                "kpi_weights": {},
                "tiers": tiers,
                "apply_to_commission_types": ["closing_sales"],
                "calculation_method": "multiply_base",
                "scope_type": "company",
                "scope_ids": [],
                "effective_from": now,
                "effective_to": "",
                "is_active": True,
                "version": 1,
                "version_history": [{
                    "version": 1,
                    "created_at": now,
                    "created_by": user_id,
                    "tiers": tiers,
                    "action": "created",
                }],
                "created_by": user_id,
                "created_at": now,
                "updated_at": now,
            }
            await self.db.kpi_bonus_rules.insert_one(rule_doc)
        
        return True


    # ═══════════════════════════════════════════════════════════════════════════
    # PHASE 2 ENHANCEMENTS - 10/10 REQUIREMENTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def validate_kpi_weights(self) -> Dict[str, Any]:
        """
        1. FIX WEIGHT KPI - Validate total weight = 100%
        """
        definitions = await self.db.kpi_definitions.find(
            {"is_active": True},
            {"_id": 0, "code": 1, "name": 1, "weight": 1}
        ).to_list(100)
        
        total_weight = sum(d.get("weight", 0) for d in definitions)
        total_percent = total_weight * 100
        
        return {
            "valid": abs(total_percent - 100) < 0.01,  # Allow small floating point error
            "total_weight": total_percent,
            "difference": 100 - total_percent,
            "kpis": definitions,
            "message": "Tổng trọng số = 100%" if abs(total_percent - 100) < 0.01 
                       else f"Tổng trọng số = {total_percent:.1f}% (cần {100 - total_percent:+.1f}%)"
        }
    
    async def update_kpi_weights_batch(
        self,
        weights: List[Dict[str, Any]],  # [{"code": "...", "weight": 0.15}]
        user_id: str
    ) -> Dict[str, Any]:
        """
        Update multiple KPI weights - validate total = 100%
        """
        # Calculate total
        total_weight = sum(w.get("weight", 0) for w in weights)
        total_percent = total_weight * 100
        
        if abs(total_percent - 100) > 0.01:
            return {
                "success": False,
                "error": f"Tổng trọng số = {total_percent:.1f}% (phải = 100%)",
                "total_weight": total_percent,
            }
        
        # Update all
        now = datetime.now(timezone.utc).isoformat()
        for w in weights:
            await self.db.kpi_definitions.update_one(
                {"code": w["code"]},
                {"$set": {"weight": w["weight"], "updated_at": now, "updated_by": user_id}}
            )
        
        return {
            "success": True,
            "total_weight": total_percent,
            "message": "Đã cập nhật trọng số KPI",
            "updated_count": len(weights),
        }
    
    async def get_kpi_actual_from_crm(
        self,
        kpi_code: str,
        user_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> float:
        """
        2. AUTO DATA TỪ CRM - Lấy actual từ CRM, KHÔNG cho nhập tay
        """
        from config.kpi_config import KPI_DATA_SOURCES
        
        source_config = KPI_DATA_SOURCES.get(kpi_code)
        if not source_config:
            return 0
        
        collection_name = source_config["collection"]
        base_filter = source_config.get("filter", {})
        aggregation = source_config["aggregation"]
        field = source_config.get("field")
        
        # Build query
        query = {
            **base_filter,
            "created_at": {
                "$gte": period_start.isoformat(),
                "$lte": period_end.isoformat(),
            }
        }
        
        # Add user filter based on collection
        if collection_name == "leads":
            query["assigned_to"] = user_id
        elif collection_name == "activities":
            query["user_id"] = user_id
        elif collection_name == "bookings":
            query["sales_id"] = user_id
        elif collection_name == "contracts":
            query["sales_rep_id"] = user_id
        
        collection = self.db[collection_name]
        
        if aggregation == "count":
            return await collection.count_documents(query)
        elif aggregation == "sum" and field:
            pipeline = [
                {"$match": query},
                {"$group": {"_id": None, "total": {"$sum": f"${field}"}}}
            ]
            result = await collection.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0
        
        return 0
    
    async def refresh_all_kpi_actuals(
        self,
        user_id: str,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Refresh ALL KPI actuals from CRM data (AUTO)
        """
        from config.kpi_config import KPI_DATA_SOURCES
        
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month:
            period_month = now.month
        
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        
        results = {}
        for kpi_code in KPI_DATA_SOURCES.keys():
            actual = await self.get_kpi_actual_from_crm(
                kpi_code, user_id, period_start, period_end
            )
            results[kpi_code] = actual
        
        # Store snapshot
        snapshot_id = str(uuid.uuid4())
        await self.db.kpi_snapshots.insert_one({
            "id": snapshot_id,
            "user_id": user_id,
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month,
            "actuals": results,
            "source": "crm_auto",  # NOT manual
            "created_at": now.isoformat(),
        })
        
        return {
            "snapshot_id": snapshot_id,
            "user_id": user_id,
            "period": f"{period_year}-{period_month:02d}",
            "actuals": results,
            "source": "AUTO từ CRM",
        }
    
    async def calculate_commission_from_kpi(
        self,
        user_id: str,
        kpi_achievement: float,
        base_commission: float
    ) -> Dict[str, Any]:
        """
        3. KPI → TIỀN
        - KPI < 70% → KHÔNG có commission
        - KPI 70-100% → commission bình thường
        - KPI > 100% → bonus multiplier
        """
        from config.kpi_config import get_commission_multiplier
        
        multiplier_info = get_commission_multiplier(kpi_achievement)
        
        final_commission = base_commission * multiplier_info["rate"]
        
        return {
            "user_id": user_id,
            "kpi_achievement": kpi_achievement,
            "base_commission": base_commission,
            "multiplier": multiplier_info["rate"],
            "multiplier_label": multiplier_info["label"],
            "eligible": multiplier_info["eligible"],
            "final_commission": final_commission,
            "message": "KHÔNG đủ điều kiện nhận commission" if not multiplier_info["eligible"]
                       else f"Commission: {final_commission:,.0f} VND ({multiplier_info['label']})"
        }
    
    async def lock_kpi_period(
        self,
        period_type: str,
        period_year: int,
        period_month: int,
        locked_by: str
    ) -> Dict[str, Any]:
        """
        4. KPI LOCK - Khi qua tháng thì lock, không chỉnh sửa
        """
        now = datetime.now(timezone.utc)
        period_key = f"{period_year}-{period_month:02d}"
        
        # Check if already locked
        existing = await self.db.kpi_period_locks.find_one({
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month,
        })
        
        if existing:
            return {
                "success": False,
                "error": f"Kỳ {period_key} đã bị khóa trước đó",
                "locked_at": existing.get("locked_at"),
                "locked_by": existing.get("locked_by"),
            }
        
        # Lock the period
        lock_doc = {
            "id": str(uuid.uuid4()),
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month,
            "period_key": period_key,
            "locked_at": now.isoformat(),
            "locked_by": locked_by,
            "reason": "Kết thúc kỳ KPI",
        }
        await self.db.kpi_period_locks.insert_one(lock_doc)
        
        return {
            "success": True,
            "period_key": period_key,
            "locked_at": now.isoformat(),
            "message": f"Đã khóa kỳ KPI {period_key}",
        }
    
    async def is_period_locked(
        self,
        period_type: str,
        period_year: int,
        period_month: int
    ) -> bool:
        """Check if a KPI period is locked"""
        lock = await self.db.kpi_period_locks.find_one({
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month,
        })
        return lock is not None
    
    async def get_user_level(self, user_id: str, kpi_score: float) -> Dict[str, Any]:
        """
        5. LEVEL SYSTEM - Bronze/Silver/Gold/Diamond
        """
        from config.kpi_config import get_level_from_score
        
        level_info = get_level_from_score(kpi_score)
        
        # Get user's level history
        history = await self.db.kpi_level_history.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(6).to_list(6)
        
        # Check level change
        previous_level = history[0]["level"] if history else None
        level_changed = previous_level and previous_level != level_info["level"]
        level_up = level_changed and kpi_score > (history[0].get("score", 0) if history else 0)
        
        return {
            "user_id": user_id,
            "current_score": kpi_score,
            **level_info,
            "level_changed": level_changed,
            "level_up": level_up,
            "previous_level": previous_level,
            "history": history,
        }
    
    async def update_user_level(
        self,
        user_id: str,
        kpi_score: float,
        period_type: str,
        period_year: int,
        period_month: int
    ) -> Dict[str, Any]:
        """Update user's level based on KPI score"""
        from config.kpi_config import get_level_from_score
        
        now = datetime.now(timezone.utc)
        level_info = get_level_from_score(kpi_score)
        
        # Save to history
        level_record = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "level": level_info["level"],
            "score": kpi_score,
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month,
            "created_at": now.isoformat(),
        }
        await self.db.kpi_level_history.insert_one(level_record)
        
        # Update user's current level
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {
                "kpi_level": level_info["level"],
                "kpi_score": kpi_score,
                "kpi_updated_at": now.isoformat(),
            }}
        )
        
        return {
            "user_id": user_id,
            **level_info,
            "score": kpi_score,
            "updated_at": now.isoformat(),
        }
    
    async def process_realtime_event(
        self,
        event_type: str,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        6. REAL-TIME UPDATE - Update KPI khi có deal/booking/activity
        """
        now = datetime.now(timezone.utc)
        
        # Map event to KPI
        event_to_kpi = {
            "deal_created": "DEALS_WON",
            "booking_created": "SOFT_BOOKINGS",
            "hard_booking": "HARD_BOOKINGS",
            "call_made": "CALLS_MADE",
            "site_visit": "SITE_VISITS",
            "lead_assigned": "NEW_CUSTOMERS",
            "contract_signed": "REVENUE_ACTUAL",
        }
        
        kpi_code = event_to_kpi.get(event_type)
        if not kpi_code:
            return {"updated": False, "reason": "Unknown event type"}
        
        # Store event
        event_doc = {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "kpi_code": kpi_code,
            "user_id": user_id,
            "data": data,
            "created_at": now.isoformat(),
        }
        await self.db.kpi_events.insert_one(event_doc)
        
        # Trigger KPI recalculation
        period_year = now.year
        period_month = now.month
        
        # Check if period is locked
        if await self.is_period_locked("monthly", period_year, period_month):
            return {
                "updated": False,
                "reason": f"Kỳ {period_year}-{period_month:02d} đã khóa",
            }
        
        # Refresh actuals from CRM
        await self.refresh_all_kpi_actuals(
            user_id, "monthly", period_year, period_month
        )
        
        return {
            "updated": True,
            "event_type": event_type,
            "kpi_code": kpi_code,
            "user_id": user_id,
            "timestamp": now.isoformat(),
        }
    
    async def create_kpi_alert(
        self,
        user_id: str,
        alert_type: str,
        kpi_code: str,
        message: str,
        severity: str = "warning",
        data: Dict[str, Any] = None
    ) -> str:
        """
        7. ALERT + PUSH - Create KPI alert
        """
        now = datetime.now(timezone.utc)
        alert_id = str(uuid.uuid4())
        
        alert_doc = {
            "id": alert_id,
            "user_id": user_id,
            "alert_type": alert_type,
            "kpi_code": kpi_code,
            "message": message,
            "severity": severity,  # critical, warning, info
            "data": data or {},
            "is_read": False,
            "created_at": now.isoformat(),
        }
        await self.db.kpi_alerts.insert_one(alert_doc)
        
        # Also create notification for push
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "kpi_alert",
            "title": "Cảnh báo KPI" if severity == "warning" else "KPI Alert",
            "message": message,
            "data": {"alert_id": alert_id, "kpi_code": kpi_code},
            "is_read": False,
            "created_at": now.isoformat(),
        }
        await self.db.notifications.insert_one(notification_doc)
        
        return alert_id
    
    async def check_and_create_alerts(
        self,
        user_id: str,
        scorecard: Dict[str, Any]
    ) -> List[Dict]:
        """Check KPI scorecard and create alerts if needed"""
        alerts_created = []
        
        overall_score = scorecard.get("summary", {}).get("total_score", 0)
        
        # Alert: Score dưới ngưỡng commission
        if overall_score < 70:
            alert_id = await self.create_kpi_alert(
                user_id,
                "commission_risk",
                "OVERALL",
                f"Điểm KPI {overall_score:.1f}% - Dưới ngưỡng Commission (70%)",
                "critical",
                {"score": overall_score, "threshold": 70}
            )
            alerts_created.append({
                "id": alert_id,
                "type": "commission_risk",
                "severity": "critical",
            })
        
        # Alert: KPI cụ thể behind
        for kpi in scorecard.get("kpis", []):
            if kpi.get("status") == "behind" and kpi.get("achievement", 100) < 50:
                alert_id = await self.create_kpi_alert(
                    user_id,
                    "kpi_behind",
                    kpi.get("kpi_code"),
                    f"{kpi.get('kpi_name')}: Chỉ đạt {kpi.get('achievement', 0):.1f}%",
                    "warning",
                    {"kpi_code": kpi.get("kpi_code"), "achievement": kpi.get("achievement")}
                )
                alerts_created.append({
                    "id": alert_id,
                    "type": "kpi_behind",
                    "kpi_code": kpi.get("kpi_code"),
                })
        
        return alerts_created
    
    async def check_inactivity_alert(self, user_id: str, days: int = 3) -> Optional[str]:
        """Alert if user has no activity for X days"""
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=days)
        
        # Check for recent activities
        recent_activity = await self.db.activities.find_one({
            "user_id": user_id,
            "created_at": {"$gte": cutoff.isoformat()}
        })
        
        if not recent_activity:
            alert_id = await self.create_kpi_alert(
                user_id,
                "inactivity",
                "ACTIVITY",
                f"Không có hoạt động trong {days} ngày qua. Hãy cập nhật công việc!",
                "warning",
                {"days_inactive": days}
            )
            return alert_id
        
        return None
    
    async def get_leaderboard_enhanced(
        self,
        period_type: str = "monthly",
        period_year: Optional[int] = None,
        period_month: Optional[int] = None,
        scope_type: str = "company",
        scope_id: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        8. GOAL - Leader nhìn là biết ai làm / ai lười
        """
        from config.kpi_config import get_level_from_score
        
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month:
            period_month = now.month
        
        period_start, period_end = self._get_period_dates(
            period_type, period_year, period_month
        )
        
        # Get all sales users
        user_query = {"is_active": True}
        if scope_type == "team" and scope_id:
            user_query["team_id"] = scope_id
        
        users = await self.db.users.find(
            user_query,
            {"_id": 0, "id": 1, "full_name": 1, "employee_code": 1, "avatar": 1, "team_id": 1}
        ).to_list(100)
        
        # Calculate each user's performance
        performances = []
        for user in users:
            user_id = user["id"]
            
            # Get KPI score
            try:
                scorecard = await self.get_personal_scorecard(
                    user_id, period_type, period_year, period_month
                )
                score = scorecard.summary.overall_score
            except:
                score = 0
            
            # Get level
            level_info = get_level_from_score(score)
            
            # Get specific metrics
            revenue = await self.calculate_kpi_value(
                "REVENUE_ACTUAL", "individual", user_id, period_start, period_end
            )
            deals = await self.calculate_kpi_value(
                "DEALS_WON", "individual", user_id, period_start, period_end
            )
            calls = await self.calculate_kpi_value(
                "CALLS_MADE", "individual", user_id, period_start, period_end
            )
            
            # Check activity status
            last_activity = await self.db.activities.find_one(
                {"user_id": user_id},
                sort=[("created_at", -1)]
            )
            days_since_activity = 0
            if last_activity:
                last_date = datetime.fromisoformat(last_activity["created_at"].replace("Z", "+00:00"))
                days_since_activity = (now - last_date).days
            
            is_lazy = days_since_activity > 3 or (calls == 0 and score < 30)
            
            performances.append({
                "user_id": user_id,
                "user_name": user.get("full_name", "Unknown"),
                "user_code": user.get("employee_code", ""),
                "avatar": user.get("avatar"),
                "team_id": user.get("team_id"),
                "score": score,
                "level": level_info["level"],
                "level_label": level_info["label_vi"],
                "level_icon": level_info["icon"],
                "level_color": level_info["color"],
                "revenue": revenue,
                "deals": int(deals),
                "calls": int(calls),
                "days_since_activity": days_since_activity,
                "status": "lazy" if is_lazy else "active",
                "status_label": "Lười" if is_lazy else "Đang hoạt động",
            })
        
        # Sort by score
        performances.sort(key=lambda x: x["score"], reverse=True)
        
        # Assign ranks
        for i, p in enumerate(performances):
            p["rank"] = i + 1
        
        # Separate top/bottom performers
        working = [p for p in performances if p["status"] == "active"]
        lazy = [p for p in performances if p["status"] == "lazy"]
        
        return {
            "period_type": period_type,
            "period_year": period_year,
            "period_month": period_month,
            "total_users": len(performances),
            "active_count": len(working),
            "lazy_count": len(lazy),
            "leaderboard": performances[:limit],
            "top_performers": performances[:3],
            "lazy_members": lazy[:5],
            "summary": {
                "avg_score": sum(p["score"] for p in performances) / len(performances) if performances else 0,
                "total_revenue": sum(p["revenue"] for p in performances),
                "total_deals": sum(p["deals"] for p in performances),
            }
        }
