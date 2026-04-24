"""
Money Impact Engine
Prompt 18/20 - AI Decision Engine (FINAL 10/10)

CRITICAL: Mọi AI output PHẢI có money impact.
- expected_value: Giá trị kỳ vọng nếu deal thành công
- risk_loss: Số tiền có nguy cơ mất
- opportunity_gain: Cơ hội tăng thêm

NO AI WITHOUT MONEY IMPACT
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase

from .utils import iso_now, get_now_utc, parse_iso_date, days_between, generate_id


class MoneyImpactEngine:
    """
    Money Impact Engine - Tính toán tác động tài chính.
    
    Mọi insight đều phải có money impact để:
    - Sales thấy urgency
    - Manager thấy priority
    - CEO thấy revenue at risk
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
        # Default conversion rates (configurable)
        self.conversion_rates = {
            "hot": 0.6,      # 60% chance to convert
            "warm": 0.35,    # 35%
            "cold": 0.1,     # 10%
            "new": 0.15,     # 15%
            "contacted": 0.2, # 20%
            "viewing": 0.4,  # 40%
            "negotiation": 0.7, # 70%
            "deposit": 0.85, # 85%
            "default": 0.2   # 20%
        }
        
        # Risk multipliers by stale days
        self.risk_multipliers = {
            7: 1.2,   # 20% more risk
            14: 1.5,  # 50% more risk
            21: 2.0,  # 100% more risk (double)
            30: 3.0,  # Triple risk
        }
    
    async def calculate_lead_money_impact(
        self,
        lead: Dict,
        lead_score: int,
        activities: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Tính money impact cho lead.
        
        Returns:
            {
                "expected_value": 1_200_000_000,
                "risk_loss": 800_000_000,
                "opportunity_gain": 300_000_000,
                "message": "Có nguy cơ mất 800 triệu nếu không xử lý trong 24h",
                "urgency": "critical",
                "deadline": "today 17:00"
            }
        """
        now = get_now_utc()
        
        # Get budget
        budget = lead.get("budget_max") or lead.get("budget_min") or 0
        if not budget:
            # Estimate from segment
            segment = lead.get("segment", "middle")
            budget = {
                "luxury": 10_000_000_000,
                "high": 5_000_000_000,
                "middle": 3_000_000_000,
                "entry": 1_500_000_000
            }.get(segment, 2_000_000_000)
        
        # Get stage/status
        stage = lead.get("status") or lead.get("stage") or "new"
        conversion_rate = self.conversion_rates.get(stage.lower(), self.conversion_rates["default"])
        
        # Adjust conversion rate by lead score
        if lead_score >= 80:
            conversion_rate = min(0.9, conversion_rate * 1.3)
        elif lead_score >= 60:
            conversion_rate = min(0.8, conversion_rate * 1.15)
        elif lead_score < 40:
            conversion_rate = conversion_rate * 0.7
        
        # Calculate expected value
        expected_value = int(budget * conversion_rate)
        
        # Calculate risk loss (what we lose if we don't act)
        last_activity = parse_iso_date(lead.get("last_activity") or lead.get("updated_at"))
        days_stale = days_between(last_activity, now) if last_activity else 0
        
        risk_multiplier = 1.0
        for days_threshold, multiplier in sorted(self.risk_multipliers.items()):
            if days_stale >= days_threshold:
                risk_multiplier = multiplier
        
        # Risk increases with inactivity
        risk_loss = int(expected_value * (0.3 * risk_multiplier))  # Base 30% risk
        
        # Opportunity gain (what we can gain with action)
        opportunity_gain = int(expected_value * 0.2)  # 20% potential uplift
        
        # Determine urgency and deadline
        urgency, deadline, message = self._determine_urgency(
            lead_score, days_stale, expected_value, risk_loss, stage
        )
        
        return {
            "expected_value": expected_value,
            "risk_loss": risk_loss,
            "opportunity_gain": opportunity_gain,
            "message": message,
            "urgency": urgency,
            "deadline": deadline,
            "currency": "VND",
            "budget": budget,
            "conversion_rate": round(conversion_rate, 2),
            "days_stale": days_stale,
            "calculated_at": iso_now()
        }
    
    async def calculate_deal_money_impact(
        self,
        deal: Dict,
        risk_score: int,
        risk_level: str
    ) -> Dict[str, Any]:
        """
        Tính money impact cho deal.
        
        Returns:
            {
                "expected_value": 4_500_000_000,
                "risk_loss": 4_500_000_000,
                "opportunity_gain": 500_000_000,
                "message": "Deal 4.5 tỷ có nguy cơ MẤT nếu không xử lý trong 24h",
                "urgency": "critical",
                "deadline": "today 17:00"
            }
        """
        now = get_now_utc()
        
        # Get deal value
        deal_value = deal.get("value") or deal.get("estimated_value") or 0
        if not deal_value:
            deal_value = 2_000_000_000  # Default 2 tỷ
        
        # Expected value = deal value * close probability
        stage = deal.get("stage", "negotiation")
        close_probability = {
            "qualification": 0.2,
            "proposal": 0.4,
            "negotiation": 0.6,
            "deposit": 0.8,
            "contract": 0.9,
            "completed": 1.0
        }.get(stage.lower(), 0.5)
        
        expected_value = int(deal_value * close_probability)
        
        # Risk loss = full deal value at risk if risk is high
        risk_multiplier = {
            "critical": 1.0,  # 100% at risk
            "high": 0.8,      # 80% at risk
            "medium": 0.4,    # 40% at risk
            "low": 0.1,       # 10% at risk
            "none": 0.0
        }.get(risk_level, 0.5)
        
        risk_loss = int(deal_value * risk_multiplier)
        
        # Opportunity gain
        opportunity_gain = int(deal_value * 0.1)  # 10% potential uplift
        
        # Days stale
        updated_at = parse_iso_date(deal.get("updated_at") or deal.get("created_at"))
        days_stale = days_between(updated_at, now) if updated_at else 0
        
        # Urgency and deadline
        urgency, deadline, message = self._determine_deal_urgency(
            deal_value, risk_loss, risk_level, days_stale, stage
        )
        
        return {
            "expected_value": expected_value,
            "risk_loss": risk_loss,
            "opportunity_gain": opportunity_gain,
            "message": message,
            "urgency": urgency,
            "deadline": deadline,
            "currency": "VND",
            "deal_value": deal_value,
            "close_probability": round(close_probability, 2),
            "risk_level": risk_level,
            "days_stale": days_stale,
            "calculated_at": iso_now()
        }
    
    def _determine_urgency(
        self,
        lead_score: int,
        days_stale: int,
        expected_value: int,
        risk_loss: int,
        stage: str
    ) -> tuple:
        """Determine urgency level, deadline, and message for lead."""
        now = get_now_utc()
        today_end = now.replace(hour=17, minute=0, second=0)
        tomorrow_end = (now + timedelta(days=1)).replace(hour=17, minute=0, second=0)
        
        value_str = self._format_vnd(expected_value)
        risk_str = self._format_vnd(risk_loss)
        
        # Critical: High score + stale
        if lead_score >= 70 and days_stale >= 3:
            return (
                "critical",
                today_end.strftime("%Y-%m-%d %H:%M"),
                f"Lead nóng {value_str} đang nguội! Mất {risk_str} nếu không gọi HÔM NAY"
            )
        
        # Critical: Hot stage + no activity
        if stage in ["hot", "deposit", "negotiation"] and days_stale >= 2:
            return (
                "critical",
                today_end.strftime("%Y-%m-%d %H:%M"),
                f"Lead {stage.upper()} giá trị {value_str} cần xử lý NGAY. Rủi ro mất {risk_str}"
            )
        
        # High: Good score
        if lead_score >= 60:
            return (
                "high",
                tomorrow_end.strftime("%Y-%m-%d %H:%M"),
                f"Lead tiềm năng {value_str}. Liên hệ trong 24h để không mất cơ hội {risk_str}"
            )
        
        # Medium
        if lead_score >= 40 or expected_value >= 3_000_000_000:
            return (
                "medium",
                (now + timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
                f"Lead {value_str} cần nurture. Theo dõi để tránh mất {risk_str}"
            )
        
        # Low
        return (
            "low",
            (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M"),
            f"Lead {value_str} - nurture tự động"
        )
    
    def _determine_deal_urgency(
        self,
        deal_value: int,
        risk_loss: int,
        risk_level: str,
        days_stale: int,
        stage: str
    ) -> tuple:
        """Determine urgency for deal."""
        now = get_now_utc()
        today_end = now.replace(hour=17, minute=0, second=0)
        tomorrow_end = (now + timedelta(days=1)).replace(hour=17, minute=0, second=0)
        
        value_str = self._format_vnd(deal_value)
        risk_str = self._format_vnd(risk_loss)
        
        if risk_level == "critical":
            return (
                "critical",
                today_end.strftime("%Y-%m-%d %H:%M"),
                f"KHẨN CẤP: Deal {value_str} có nguy cơ MẤT! Xử lý NGAY hoặc mất {risk_str}"
            )
        
        if risk_level == "high":
            return (
                "high",
                tomorrow_end.strftime("%Y-%m-%d %H:%M"),
                f"Deal {value_str} đang có rủi ro cao. Hành động trong 24h để cứu {risk_str}"
            )
        
        if risk_level == "medium" or days_stale >= 7:
            return (
                "medium",
                (now + timedelta(days=3)).strftime("%Y-%m-%d %H:%M"),
                f"Deal {value_str} cần theo dõi. Không để mất {risk_str}"
            )
        
        return (
            "low",
            (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M"),
            f"Deal {value_str} đang ổn định. Tiếp tục đẩy để chốt."
        )
    
    def _format_vnd(self, amount: int) -> str:
        """Format amount to VND string."""
        if amount >= 1_000_000_000:
            return f"{amount / 1_000_000_000:.1f} tỷ"
        elif amount >= 1_000_000:
            return f"{amount / 1_000_000:.0f} triệu"
        else:
            return f"{amount:,} VND"
    
    async def calculate_pipeline_revenue_at_risk(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Tính tổng revenue at risk trong pipeline.
        Used for WAR ROOM dashboard.
        """
        query = {
            "stage": {"$nin": ["completed", "lost", "won", "cancelled"]},
            "ai_risk_level": {"$in": ["critical", "high"]}
        }
        if user_id:
            query["$or"] = [{"assigned_to": user_id}, {"owner_id": user_id}]
        
        deals = await self.db.deals.find(query, {"_id": 0}).to_list(100)
        
        total_at_risk = 0
        critical_value = 0
        high_value = 0
        deals_at_risk = []
        
        for deal in deals:
            value = deal.get("value") or deal.get("estimated_value") or 0
            risk_level = deal.get("ai_risk_level", "medium")
            
            if risk_level == "critical":
                critical_value += value
                total_at_risk += value
            elif risk_level == "high":
                high_value += value
                total_at_risk += int(value * 0.8)
            
            deals_at_risk.append({
                "deal_id": deal.get("id"),
                "code": deal.get("code"),
                "customer_name": deal.get("customer_name"),
                "value": value,
                "risk_level": risk_level,
                "stage": deal.get("stage")
            })
        
        return {
            "total_revenue_at_risk": total_at_risk,
            "critical_value": critical_value,
            "high_value": high_value,
            "deals_count": len(deals_at_risk),
            "deals": deals_at_risk[:20],  # Top 20
            "formatted": {
                "total": self._format_vnd(total_at_risk),
                "critical": self._format_vnd(critical_value),
                "high": self._format_vnd(high_value)
            },
            "calculated_at": iso_now()
        }
    
    async def calculate_today_opportunity(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Tính cơ hội hôm nay nếu execute tất cả AI actions.
        """
        # Get hot leads
        lead_query = {
            "ai_score": {"$gte": 60},
            "status": {"$nin": ["closed_won", "closed_lost", "converted"]}
        }
        if user_id:
            lead_query["assigned_to"] = user_id
        
        hot_leads = await self.db.leads.find(lead_query, {"_id": 0}).to_list(50)
        
        total_opportunity = 0
        for lead in hot_leads:
            budget = lead.get("budget_max") or lead.get("budget_min") or 2_000_000_000
            score = lead.get("ai_score", 60)
            # Higher score = higher conversion
            conversion = 0.3 + (score - 60) * 0.01
            total_opportunity += int(budget * conversion)
        
        return {
            "total_opportunity": total_opportunity,
            "hot_leads_count": len(hot_leads),
            "formatted": self._format_vnd(total_opportunity),
            "message": f"Tiềm năng {self._format_vnd(total_opportunity)} từ {len(hot_leads)} lead nóng hôm nay",
            "calculated_at": iso_now()
        }
