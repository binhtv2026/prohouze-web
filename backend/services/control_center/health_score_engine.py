"""
Health Score Engine
Prompt 17/20 - Executive Control Center

Business Health Score calculation engine.
Provides a 0-100 score derived from multiple business components.
"""

from typing import Dict, Any
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from .dto import HEALTH_SCORE_COMPONENTS
from .utils import (
    get_now_utc, 
    iso_now, 
    calculate_percentage, 
    determine_health_grade,
    clamp
)


class HealthScoreEngine:
    """
    Business Health Score Engine.
    Calculates a comprehensive 0-100 score for business health.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def calculate_health_score(self) -> Dict[str, Any]:
        """
        Calculate comprehensive Business Health Score.
        Returns score 0-100 with component breakdown.
        """
        now = get_now_utc()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        components = {}
        total_weighted = 0
        total_weight = 0
        
        # 1. Pipeline Quality (20%)
        pipeline = await self._calculate_pipeline_quality()
        components["pipeline_quality"] = pipeline
        total_weighted += pipeline["score"] * HEALTH_SCORE_COMPONENTS["pipeline_quality"]["weight"]
        total_weight += HEALTH_SCORE_COMPONENTS["pipeline_quality"]["weight"]
        
        # 2. Conversion Rate (20%)
        conversion = await self._calculate_conversion_rate(month_start)
        components["conversion_rate"] = conversion
        total_weighted += conversion["score"] * HEALTH_SCORE_COMPONENTS["conversion_rate"]["weight"]
        total_weight += HEALTH_SCORE_COMPONENTS["conversion_rate"]["weight"]
        
        # 3. Inventory Turnover (15%)
        inventory = await self._calculate_inventory_turnover()
        components["inventory_turnover"] = inventory
        total_weighted += inventory["score"] * HEALTH_SCORE_COMPONENTS["inventory_turnover"]["weight"]
        total_weight += HEALTH_SCORE_COMPONENTS["inventory_turnover"]["weight"]
        
        # 4. Marketing Efficiency (15%)
        marketing = await self._calculate_marketing_efficiency(month_start)
        components["marketing_efficiency"] = marketing
        total_weighted += marketing["score"] * HEALTH_SCORE_COMPONENTS["marketing_efficiency"]["weight"]
        total_weight += HEALTH_SCORE_COMPONENTS["marketing_efficiency"]["weight"]
        
        # 5. Data Quality (10%)
        data = await self._calculate_data_quality()
        components["data_quality"] = data
        total_weighted += data["score"] * HEALTH_SCORE_COMPONENTS["data_quality"]["weight"]
        total_weight += HEALTH_SCORE_COMPONENTS["data_quality"]["weight"]
        
        # 6. Operational Discipline (20%)
        ops = await self._calculate_operational_discipline()
        components["operational_discipline"] = ops
        total_weighted += ops["score"] * HEALTH_SCORE_COMPONENTS["operational_discipline"]["weight"]
        total_weight += HEALTH_SCORE_COMPONENTS["operational_discipline"]["weight"]
        
        # Calculate final score
        final_score = round(total_weighted / total_weight, 1) if total_weight > 0 else 0
        
        # Determine grade and status
        grade, status = determine_health_grade(final_score)
        
        # Identify weakest components
        sorted_components = sorted(
            [(k, v["score"]) for k, v in components.items()],
            key=lambda x: x[1]
        )
        weakest = sorted_components[:2]
        
        # Generate recommendations
        recommendations = self._generate_recommendations(components)
        
        return {
            "total_score": final_score,
            "grade": grade,
            "status": status,
            "components": components,
            "weakest_areas": weakest,
            "recommendations": recommendations,
            "calculated_at": now.isoformat(),
            "trend": await self._get_score_trend()
        }
    
    async def _calculate_pipeline_quality(self) -> Dict[str, Any]:
        """Calculate pipeline quality score."""
        now = get_now_utc()
        stale_threshold = now - timedelta(days=7)
        
        total_deals = await self.db.deals.count_documents({
            "stage": {"$nin": ["completed", "lost", "won"]}
        })
        
        if total_deals == 0:
            return {"score": 50, "detail": "Khong co deal trong pipeline", "metrics": {}}
        
        stale_deals = await self.db.deals.count_documents({
            "stage": {"$nin": ["completed", "lost", "won"]},
            "updated_at": {"$lt": stale_threshold.isoformat()}
        })
        
        # Pipeline value
        pipeline = [
            {"$match": {"stage": {"$nin": ["completed", "lost", "won"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$value"}}}
        ]
        result = await self.db.deals.aggregate(pipeline).to_list(1)
        pipeline_value = result[0]["total"] if result else 0
        
        health_pct = calculate_percentage(total_deals - stale_deals, total_deals)
        score = clamp(health_pct, 0, 100)
        
        return {
            "score": round(score, 1),
            "weight": HEALTH_SCORE_COMPONENTS["pipeline_quality"]["weight"],
            "detail": f"{total_deals - stale_deals}/{total_deals} deals active",
            "metrics": {
                "total_deals": total_deals,
                "stale_deals": stale_deals,
                "active_deals": total_deals - stale_deals,
                "pipeline_value": pipeline_value,
                "health_pct": round(health_pct, 1)
            }
        }
    
    async def _calculate_conversion_rate(self, since: datetime) -> Dict[str, Any]:
        """Calculate conversion rate score."""
        date_query = {"created_at": {"$gte": since.isoformat()}}
        
        leads = await self.db.leads.count_documents(date_query)
        bookings = await self.db.hard_bookings.count_documents(date_query)
        contracts = await self.db.contracts.count_documents({
            **date_query,
            "status": {"$in": ["signed", "active"]}
        })
        
        lead_to_booking = calculate_percentage(bookings, leads)
        booking_to_contract = calculate_percentage(contracts, bookings)
        
        # Score: 20% booking rate = 100 score
        booking_score = clamp(lead_to_booking * 5, 0, 100)
        contract_score = clamp(booking_to_contract, 0, 100)
        
        score = (booking_score + contract_score) / 2
        
        return {
            "score": round(score, 1),
            "weight": HEALTH_SCORE_COMPONENTS["conversion_rate"]["weight"],
            "detail": f"Booking rate: {lead_to_booking:.1f}%, Contract rate: {booking_to_contract:.1f}%",
            "metrics": {
                "total_leads": leads,
                "total_bookings": bookings,
                "total_contracts": contracts,
                "lead_to_booking_rate": round(lead_to_booking, 1),
                "booking_to_contract_rate": round(booking_to_contract, 1)
            }
        }
    
    async def _calculate_inventory_turnover(self) -> Dict[str, Any]:
        """Calculate inventory turnover score."""
        total_units = await self.db.products.count_documents({})
        sold_units = await self.db.products.count_documents({"inventory_status": "sold"})
        available_units = await self.db.products.count_documents({"inventory_status": "available"})
        
        absorption = calculate_percentage(sold_units, total_units)
        
        # Score: 50% absorption = 100
        score = clamp(absorption * 2, 0, 100)
        
        return {
            "score": round(score, 1),
            "weight": HEALTH_SCORE_COMPONENTS["inventory_turnover"]["weight"],
            "detail": f"Absorption: {absorption:.1f}% ({sold_units}/{total_units})",
            "metrics": {
                "total_units": total_units,
                "sold_units": sold_units,
                "available_units": available_units,
                "absorption_rate": round(absorption, 1)
            }
        }
    
    async def _calculate_marketing_efficiency(self, since: datetime) -> Dict[str, Any]:
        """Calculate marketing efficiency score."""
        date_query = {"created_at": {"$gte": since.isoformat()}}
        
        total_leads = await self.db.leads.count_documents(date_query)
        leads_with_source = await self.db.leads.count_documents({
            **date_query,
            "source": {"$nin": [None, ""]}
        })
        
        attribution = calculate_percentage(leads_with_source, total_leads)
        
        qualified_leads = await self.db.leads.count_documents({
            **date_query,
            "stage": {"$in": ["qualified", "warm", "hot", "negotiation"]}
        })
        quality_rate = calculate_percentage(qualified_leads, total_leads)
        
        score = clamp((attribution + quality_rate) / 2, 0, 100)
        
        return {
            "score": round(score, 1),
            "weight": HEALTH_SCORE_COMPONENTS["marketing_efficiency"]["weight"],
            "detail": f"Attribution: {attribution:.1f}%, Quality: {quality_rate:.1f}%",
            "metrics": {
                "total_leads": total_leads,
                "leads_with_source": leads_with_source,
                "qualified_leads": qualified_leads,
                "attribution_rate": round(attribution, 1),
                "quality_rate": round(quality_rate, 1)
            }
        }
    
    async def _calculate_data_quality(self) -> Dict[str, Any]:
        """Calculate data quality score."""
        total_leads = await self.db.leads.count_documents({})
        
        if total_leads == 0:
            return {"score": 100, "detail": "No data to evaluate", "metrics": {}}
        
        incomplete = await self.db.leads.count_documents({
            "$or": [
                {"phone": {"$in": [None, ""]}},
                {"full_name": {"$in": [None, ""]}}
            ]
        })
        
        now = get_now_utc()
        stale_threshold = now - timedelta(days=30)
        stale = await self.db.leads.count_documents({
            "updated_at": {"$lt": stale_threshold.isoformat()},
            "stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}
        })
        
        completeness = calculate_percentage(total_leads - incomplete, total_leads)
        freshness = calculate_percentage(total_leads - stale, total_leads)
        
        score = (completeness + freshness) / 2
        
        return {
            "score": round(score, 1),
            "weight": HEALTH_SCORE_COMPONENTS["data_quality"]["weight"],
            "detail": f"Completeness: {completeness:.1f}%, Freshness: {freshness:.1f}%",
            "metrics": {
                "total_records": total_leads,
                "incomplete_records": incomplete,
                "stale_records": stale,
                "completeness_rate": round(completeness, 1),
                "freshness_rate": round(freshness, 1)
            }
        }
    
    async def _calculate_operational_discipline(self) -> Dict[str, Any]:
        """Calculate operational discipline score."""
        now = get_now_utc()
        
        total_tasks = await self.db.tasks.count_documents({})
        completed_tasks = await self.db.tasks.count_documents({"status": "completed"})
        overdue_tasks = await self.db.tasks.count_documents({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lt": now.isoformat()}
        })
        
        completion_rate = calculate_percentage(completed_tasks, total_tasks) if total_tasks > 0 else 100
        pending_tasks = total_tasks - completed_tasks
        overdue_rate = calculate_percentage(overdue_tasks, pending_tasks) if pending_tasks > 0 else 0
        
        score = clamp(completion_rate - (overdue_rate * 0.5), 0, 100)
        
        return {
            "score": round(score, 1),
            "weight": HEALTH_SCORE_COMPONENTS["operational_discipline"]["weight"],
            "detail": f"Completion: {completion_rate:.1f}%, Overdue: {overdue_rate:.1f}%",
            "metrics": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "overdue_tasks": overdue_tasks,
                "completion_rate": round(completion_rate, 1),
                "overdue_rate": round(overdue_rate, 1)
            }
        }
    
    def _generate_recommendations(self, components: Dict[str, Any]) -> list:
        """Generate recommendations based on weak areas."""
        recommendations = []
        
        for name, data in components.items():
            if data["score"] < 50:
                if name == "pipeline_quality":
                    recommendations.append({
                        "area": "Pipeline",
                        "issue": "Nhieu deal khong duoc cap nhat",
                        "action": "Review va clean up pipeline, contact lai cac deal stale"
                    })
                elif name == "conversion_rate":
                    recommendations.append({
                        "area": "Conversion",
                        "issue": "Ty le chuyen doi thap",
                        "action": "Dao tao ky nang sales, review quy trinh follow-up"
                    })
                elif name == "inventory_turnover":
                    recommendations.append({
                        "area": "Inventory",
                        "issue": "Hang ton cao",
                        "action": "Tang marketing cho du an cham, review gia ban"
                    })
                elif name == "marketing_efficiency":
                    recommendations.append({
                        "area": "Marketing",
                        "issue": "Marketing chua hieu qua",
                        "action": "Toi uu targeting, review quality cua lead sources"
                    })
                elif name == "data_quality":
                    recommendations.append({
                        "area": "Data",
                        "issue": "Du lieu khong day du hoac cu",
                        "action": "Bo sung thong tin, clean up data cu"
                    })
                elif name == "operational_discipline":
                    recommendations.append({
                        "area": "Operations",
                        "issue": "Nhieu task qua han",
                        "action": "Review workload, tang cuong theo doi task completion"
                    })
        
        return recommendations
    
    async def _get_score_trend(self) -> Dict[str, Any]:
        """Get health score trend over last 7 days."""
        snapshots = await self.db.health_score_snapshots.find(
            {},
            {"_id": 0, "total_score": 1, "calculated_at": 1}
        ).sort("calculated_at", -1).limit(7).to_list(7)
        
        if len(snapshots) < 2:
            return {"direction": "stable", "change": 0}
        
        recent = snapshots[0]["total_score"] if snapshots else 0
        previous = snapshots[-1]["total_score"] if len(snapshots) > 1 else recent
        
        change = recent - previous
        
        return {
            "direction": "up" if change > 2 else "down" if change < -2 else "stable",
            "change": round(change, 1),
            "history": [{"score": s["total_score"], "date": s["calculated_at"]} for s in reversed(snapshots)]
        }
    
    async def save_snapshot(self, score_data: Dict[str, Any]):
        """Save health score snapshot for historical tracking."""
        await self.db.health_score_snapshots.insert_one({
            **score_data,
            "saved_at": iso_now()
        })
