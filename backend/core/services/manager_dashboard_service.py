"""
ProHouzing Manager Dashboard Service
TASK 3 - MODULE 1: SALES PERFORMANCE DASHBOARD

Metrics:
1. Doanh số theo sales
2. Số deal theo stage
3. Conversion rate
4. Tổng giá trị pipeline
5. Top/bottom sales
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, case, desc, asc
from sqlalchemy.orm import Session

from core.models.pipeline_deal import PipelineDeal
from core.models.product import Product
from core.models.user import User
from config.pipeline_config import PipelineStage, STAGE_CONFIG, STAGE_ORDER


class ManagerDashboardService:
    """
    Manager dashboard service for sales performance tracking.
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DASHBOARD SUMMARY
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_dashboard_summary(
        self,
        db: Session,
        *,
        org_id: UUID,
        team_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Get dashboard summary metrics.
        
        Returns:
            total_deals, total_value, won_deals, won_value, conversion_rate,
            avg_deal_value, deals_by_stage
        """
        # Default date range: last 30 days
        if not date_to:
            date_to = datetime.now(timezone.utc)
        if not date_from:
            date_from = date_to - timedelta(days=30)
        
        conditions = [
            PipelineDeal.org_id == org_id,
            PipelineDeal.deleted_at.is_(None),
            PipelineDeal.created_at >= date_from,
            PipelineDeal.created_at <= date_to,
        ]
        
        if team_id:
            conditions.append(PipelineDeal.team_id == team_id)
        
        # Total deals
        total_deals_q = select(func.count(PipelineDeal.id)).where(and_(*conditions))
        total_deals = db.execute(total_deals_q).scalar() or 0
        
        # Total value
        total_value_q = select(func.sum(PipelineDeal.expected_value)).where(and_(*conditions))
        total_value = float(db.execute(total_value_q).scalar() or 0)
        
        # Won deals
        won_conditions = conditions + [PipelineDeal.stage == PipelineStage.CLOSED_WON.value]
        won_deals_q = select(func.count(PipelineDeal.id)).where(and_(*won_conditions))
        won_deals = db.execute(won_deals_q).scalar() or 0
        
        won_value_q = select(func.sum(PipelineDeal.actual_value)).where(and_(*won_conditions))
        won_value = float(db.execute(won_value_q).scalar() or 0)
        
        # Lost deals
        lost_conditions = conditions + [PipelineDeal.stage == PipelineStage.CLOSED_LOST.value]
        lost_deals_q = select(func.count(PipelineDeal.id)).where(and_(*lost_conditions))
        lost_deals = db.execute(lost_deals_q).scalar() or 0
        
        # Conversion rate
        closed_deals = won_deals + lost_deals
        conversion_rate = (won_deals / closed_deals * 100) if closed_deals > 0 else 0
        
        # Active deals (not closed)
        active_stages = [s for s in STAGE_ORDER if STAGE_CONFIG[s].get("is_active", True)]
        active_conditions = conditions + [PipelineDeal.stage.in_(active_stages)]
        active_deals_q = select(func.count(PipelineDeal.id)).where(and_(*active_conditions))
        active_deals = db.execute(active_deals_q).scalar() or 0
        
        active_value_q = select(func.sum(PipelineDeal.expected_value)).where(and_(*active_conditions))
        active_value = float(db.execute(active_value_q).scalar() or 0)
        
        # Deals by stage
        deals_by_stage = {}
        for stage in STAGE_ORDER:
            stage_conditions = conditions + [PipelineDeal.stage == stage]
            count_q = select(func.count(PipelineDeal.id)).where(and_(*stage_conditions))
            value_q = select(func.sum(PipelineDeal.expected_value)).where(and_(*stage_conditions))
            
            deals_by_stage[stage] = {
                "count": db.execute(count_q).scalar() or 0,
                "value": float(db.execute(value_q).scalar() or 0),
                "name": STAGE_CONFIG[stage]["name"],
                "color": STAGE_CONFIG[stage]["color"],
            }
        
        return {
            "period": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat(),
            },
            "total_deals": total_deals,
            "total_value": total_value,
            "won_deals": won_deals,
            "won_value": won_value,
            "lost_deals": lost_deals,
            "conversion_rate": round(conversion_rate, 1),
            "active_deals": active_deals,
            "active_value": active_value,
            "avg_deal_value": total_value / total_deals if total_deals > 0 else 0,
            "deals_by_stage": deals_by_stage,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SALES PERFORMANCE
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_sales_performance(
        self,
        db: Session,
        *,
        org_id: UUID,
        team_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Get sales performance by user.
        
        Returns:
            List of sales with their metrics, top/bottom performers
        """
        if not date_to:
            date_to = datetime.now(timezone.utc)
        if not date_from:
            date_from = date_to - timedelta(days=30)
        
        # Get all sales users with deals
        base_conditions = [
            PipelineDeal.org_id == org_id,
            PipelineDeal.deleted_at.is_(None),
            PipelineDeal.created_at >= date_from,
            PipelineDeal.created_at <= date_to,
            PipelineDeal.owner_user_id.isnot(None),
        ]
        
        if team_id:
            base_conditions.append(PipelineDeal.team_id == team_id)
        
        # Get unique owners
        owners_q = select(PipelineDeal.owner_user_id).where(
            and_(*base_conditions)
        ).distinct()
        
        result = db.execute(owners_q)
        owner_ids = [row[0] for row in result]
        
        sales_performance = []
        
        for owner_id in owner_ids:
            user_conditions = base_conditions + [PipelineDeal.owner_user_id == owner_id]
            
            # Get user info
            user_q = select(User).where(User.id == owner_id)
            user = db.execute(user_q).scalar_one_or_none()
            
            # Total deals
            total_q = select(func.count(PipelineDeal.id)).where(and_(*user_conditions))
            total_deals = db.execute(total_q).scalar() or 0
            
            # Total value
            value_q = select(func.sum(PipelineDeal.expected_value)).where(and_(*user_conditions))
            total_value = float(db.execute(value_q).scalar() or 0)
            
            # Won deals
            won_conditions = user_conditions + [PipelineDeal.stage == PipelineStage.CLOSED_WON.value]
            won_q = select(func.count(PipelineDeal.id)).where(and_(*won_conditions))
            won_deals = db.execute(won_q).scalar() or 0
            
            won_value_q = select(func.sum(PipelineDeal.actual_value)).where(and_(*won_conditions))
            won_value = float(db.execute(won_value_q).scalar() or 0)
            
            # Lost deals
            lost_conditions = user_conditions + [PipelineDeal.stage == PipelineStage.CLOSED_LOST.value]
            lost_q = select(func.count(PipelineDeal.id)).where(and_(*lost_conditions))
            lost_deals = db.execute(lost_q).scalar() or 0
            
            # Conversion
            closed = won_deals + lost_deals
            conversion = (won_deals / closed * 100) if closed > 0 else 0
            
            # Active deals
            active_stages = [s for s in STAGE_ORDER if STAGE_CONFIG[s].get("is_active", True)]
            active_conditions = user_conditions + [PipelineDeal.stage.in_(active_stages)]
            active_q = select(func.count(PipelineDeal.id)).where(and_(*active_conditions))
            active_deals = db.execute(active_q).scalar() or 0
            
            sales_performance.append({
                "user_id": str(owner_id),
                "user_name": user.full_name if user else "Unknown",
                "user_email": user.email if user else None,
                "total_deals": total_deals,
                "total_value": total_value,
                "won_deals": won_deals,
                "won_value": won_value,
                "lost_deals": lost_deals,
                "active_deals": active_deals,
                "conversion_rate": round(conversion, 1),
            })
        
        # Sort by won_value descending
        sales_performance.sort(key=lambda x: x["won_value"], reverse=True)
        
        # Top and bottom performers
        top_performers = sales_performance[:3] if len(sales_performance) >= 3 else sales_performance
        bottom_performers = sales_performance[-3:] if len(sales_performance) >= 3 else []
        
        return {
            "period": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat(),
            },
            "total_sales": len(sales_performance),
            "sales": sales_performance[:limit],
            "top_performers": top_performers,
            "bottom_performers": bottom_performers,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PIPELINE ANALYSIS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_pipeline_analysis(
        self,
        db: Session,
        *,
        org_id: UUID,
        team_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Get pipeline analysis for forecasting.
        
        Returns:
            Pipeline value by stage, weighted forecast, stage velocity
        """
        conditions = [
            PipelineDeal.org_id == org_id,
            PipelineDeal.deleted_at.is_(None),
        ]
        
        if team_id:
            conditions.append(PipelineDeal.team_id == team_id)
        
        # Active stages only
        active_stages = [s for s in STAGE_ORDER if STAGE_CONFIG[s].get("is_active", True)]
        active_conditions = conditions + [PipelineDeal.stage.in_(active_stages)]
        
        pipeline_by_stage = []
        total_weighted_value = 0
        total_unweighted_value = 0
        
        for stage in active_stages:
            stage_conditions = conditions + [PipelineDeal.stage == stage]
            
            count_q = select(func.count(PipelineDeal.id)).where(and_(*stage_conditions))
            value_q = select(func.sum(PipelineDeal.expected_value)).where(and_(*stage_conditions))
            
            count = db.execute(count_q).scalar() or 0
            value = float(db.execute(value_q).scalar() or 0)
            
            # Get average probability for this stage
            probability = STAGE_CONFIG[stage].get("probability", 50)
            # Map stage order to probability
            stage_idx = STAGE_ORDER.index(stage)
            probability = min(10 + (stage_idx * 12), 95)  # 10% to 95%
            
            weighted_value = value * (probability / 100)
            
            pipeline_by_stage.append({
                "stage": stage,
                "stage_name": STAGE_CONFIG[stage]["name"],
                "color": STAGE_CONFIG[stage]["color"],
                "count": count,
                "value": value,
                "probability": probability,
                "weighted_value": weighted_value,
            })
            
            total_weighted_value += weighted_value
            total_unweighted_value += value
        
        return {
            "pipeline": pipeline_by_stage,
            "total_unweighted_value": total_unweighted_value,
            "total_weighted_value": total_weighted_value,
            "forecast_accuracy": round(total_weighted_value / total_unweighted_value * 100, 1) if total_unweighted_value > 0 else 0,
        }


# Singleton instance
manager_dashboard_service = ManagerDashboardService()
