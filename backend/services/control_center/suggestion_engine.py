"""
Suggestion Engine
Prompt 17/20 - Executive Control Center

Rule-based decision suggestions engine.
Provides actionable recommendations based on business data.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

from .dto import UrgencyLevel, SUGGESTION_RULES
from .utils import get_now_utc, calculate_percentage


class SuggestionEngine:
    """
    Decision Suggestion Engine.
    Generates rule-based recommendations for business decisions.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def generate_suggestions(self, user: Optional[dict] = None) -> List[Dict[str, Any]]:
        """
        Generate all applicable decision suggestions.
        Returns prioritized list of recommendations.
        """
        suggestions = []
        now = get_now_utc()
        
        suggestions.extend(await self._suggest_marketing_actions())
        suggestions.extend(await self._suggest_sales_actions())
        suggestions.extend(await self._suggest_team_actions())
        suggestions.extend(await self._suggest_inventory_actions())
        suggestions.extend(await self._suggest_operational_actions())
        
        suggestions.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        
        return suggestions
    
    async def _suggest_marketing_actions(self) -> List[Dict[str, Any]]:
        """Generate marketing-related suggestions."""
        suggestions = []
        now = get_now_utc()
        
        projects = await self.db.projects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
        
        for project in projects:
            total = await self.db.products.count_documents({"project_id": project["id"]})
            if total == 0:
                continue
            sold = await self.db.products.count_documents({"project_id": project["id"], "inventory_status": "sold"})
            absorption = calculate_percentage(sold, total)
            
            if absorption < 30:
                suggestions.append({
                    "id": f"mkt_absorption_{project['id']}",
                    "category": "marketing",
                    "priority_score": 80 if absorption < 15 else 60,
                    "urgency": UrgencyLevel.HIGH.value if absorption < 15 else UrgencyLevel.MEDIUM.value,
                    "title": f"Tang marketing cho Project {project.get('name', 'N/A')}",
                    "description": f"Project {project.get('name', 'N/A')} co ty le absorption chi {absorption:.1f}%. Can tang cuong marketing de day nhanh ban hang.",
                    "rationale": f"Absorption rate {absorption:.1f}% thap hon nguong 30%",
                    "recommended_action": "Tao campaign moi hoac tang budget cho cac channel hieu qua",
                    "expected_impact": "Du kien tang 15-20% leads trong thang toi",
                    "target_entity": "projects",
                    "target_id": project["id"],
                    "metrics": {"absorption_rate": round(absorption, 1), "total_units": total, "sold_units": sold},
                    "created_at": now.isoformat()
                })
        
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        source_pipeline = [
            {"$match": {"created_at": {"$gte": month_start.isoformat()}}},
            {"$group": {"_id": "$source", "count": {"$sum": 1}}}
        ]
        by_source = await self.db.leads.aggregate(source_pipeline).to_list(20)
        
        if by_source:
            avg_leads = sum(s["count"] for s in by_source) / len(by_source)
            for source in by_source:
                if source["count"] < avg_leads * 0.5 and source["_id"]:
                    suggestions.append({
                        "id": f"mkt_low_source_{source['_id']}",
                        "category": "marketing",
                        "priority_score": 50,
                        "urgency": UrgencyLevel.LOW.value,
                        "title": f"Toi uu Source {source['_id']}",
                        "description": f"Source {source['_id']} chi mang ve {source['count']} leads, thap hon TB ({avg_leads:.0f})",
                        "rationale": f"Lead count {source['count']} < 50% of average ({avg_leads:.0f})",
                        "recommended_action": "Review targeting, creative, hoac tam dung neu khong hieu qua",
                        "expected_impact": "Toi uu chi phi marketing",
                        "target_entity": "lead_sources",
                        "target_id": source["_id"],
                        "metrics": {"lead_count": source["count"], "average": round(avg_leads, 0)},
                        "created_at": now.isoformat()
                    })
        
        return suggestions
    
    async def _suggest_sales_actions(self) -> List[Dict[str, Any]]:
        """Generate sales-related suggestions."""
        suggestions = []
        now = get_now_utc()
        
        hot_leads = await self.db.leads.count_documents({
            "stage": {"$in": ["hot", "negotiation"]},
            "status": {"$nin": ["converted", "lost"]}
        })
        
        if hot_leads > 5:
            suggestions.append({
                "id": f"sales_hot_leads_{now.strftime('%Y%m%d')}",
                "category": "sales",
                "priority_score": 90,
                "urgency": UrgencyLevel.CRITICAL.value,
                "title": f"Uu tien xu ly {hot_leads} hot leads",
                "description": f"Co {hot_leads} leads o stage hot/negotiation can duoc uu tien chot ngay",
                "rationale": "Hot leads co conversion rate cao nhat, can focus de khong mat co hoi",
                "recommended_action": "Tap trung toan bo resource sales vao hot leads trong 48h toi",
                "expected_impact": "Tang kha nang close deal 30-40%",
                "target_entity": "leads",
                "target_id": "hot_leads",
                "metrics": {"hot_lead_count": hot_leads},
                "created_at": now.isoformat()
            })
        
        stale_threshold = now - timedelta(days=14)
        stuck_deals = await self.db.deals.count_documents({
            "stage": {"$nin": ["completed", "lost", "won"]},
            "stage_changed_at": {"$lt": stale_threshold.isoformat()}
        })
        
        if stuck_deals > 3:
            suggestions.append({
                "id": f"sales_stuck_deals_{now.strftime('%Y%m%d')}",
                "category": "sales",
                "priority_score": 75,
                "urgency": UrgencyLevel.HIGH.value,
                "title": f"Review {stuck_deals} deals bi stuck",
                "description": f"Co {stuck_deals} deals khong co tien trien trong 14+ ngay",
                "rationale": "Deals stuck qua lau co kha nang lost cao, can can thiep som",
                "recommended_action": "To chuc session review deals, xac dinh blockers va action plan",
                "expected_impact": "Recover 20-30% deals dang stuck",
                "target_entity": "deals",
                "target_id": "stuck_deals",
                "metrics": {"stuck_deal_count": stuck_deals},
                "created_at": now.isoformat()
            })
        
        return suggestions
    
    async def _suggest_team_actions(self) -> List[Dict[str, Any]]:
        """Generate team-related suggestions."""
        suggestions = []
        now = get_now_utc()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        teams = await self.db.teams.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(50)
        
        for team in teams:
            members = await self.db.users.find({"team_id": team["id"]}, {"_id": 0, "id": 1}).to_list(100)
            member_ids = [m["id"] for m in members]
            
            if not member_ids:
                continue
            
            leads = await self.db.leads.count_documents({
                "assigned_to": {"$in": member_ids},
                "created_at": {"$gte": month_start.isoformat()}
            })
            converted = await self.db.leads.count_documents({
                "assigned_to": {"$in": member_ids},
                "created_at": {"$gte": month_start.isoformat()},
                "stage": {"$in": ["converted", "closed_won"]}
            })
            
            conversion_rate = calculate_percentage(converted, leads)
            
            if conversion_rate < 5 and leads >= 10:
                suggestions.append({
                    "id": f"team_training_{team['id']}",
                    "category": "team",
                    "priority_score": 70,
                    "urgency": UrgencyLevel.MEDIUM.value,
                    "title": f"Team {team.get('name', 'N/A')} can training",
                    "description": f"Team {team.get('name', 'N/A')} co conversion rate chi {conversion_rate:.1f}%, thap hon benchmark 5%",
                    "rationale": f"Conversion rate {conversion_rate:.1f}% qua thap voi {leads} leads",
                    "recommended_action": "Len lich training ky nang sales, review quy trinh va scripts",
                    "expected_impact": "Cai thien conversion rate 2-3%",
                    "target_entity": "teams",
                    "target_id": team["id"],
                    "metrics": {"conversion_rate": round(conversion_rate, 1), "total_leads": leads, "converted": converted},
                    "created_at": now.isoformat()
                })
        
        workload_pipeline = [
            {"$match": {"stage": {"$nin": ["converted", "lost", "closed_won", "closed_lost"]}}},
            {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}}
        ]
        workloads = await self.db.leads.aggregate(workload_pipeline).to_list(100)
        
        if len(workloads) >= 2:
            counts = [w["count"] for w in workloads if w["_id"]]
            if counts:
                avg_workload = sum(counts) / len(counts)
                max_workload = max(counts)
                min_workload = min(counts)
                
                variance = ((max_workload - min_workload) / avg_workload * 100) if avg_workload > 0 else 0
                
                if variance > 50:
                    suggestions.append({
                        "id": f"team_workload_{now.strftime('%Y%m%d')}",
                        "category": "team",
                        "priority_score": 65,
                        "urgency": UrgencyLevel.MEDIUM.value,
                        "title": "Can bang workload giua cac sales",
                        "description": f"Workload khong deu: max {max_workload}, min {min_workload} leads (variance {variance:.0f}%)",
                        "rationale": f"Variance {variance:.0f}% > 50% threshold",
                        "recommended_action": "Reassign leads tu nguoi dang qua tai sang nguoi it viec",
                        "expected_impact": "Cai thien response time va conversion rate",
                        "target_entity": "users",
                        "target_id": "workload_balance",
                        "metrics": {"max_workload": max_workload, "min_workload": min_workload, "avg_workload": round(avg_workload, 1), "variance": round(variance, 0)},
                        "created_at": now.isoformat()
                    })
        
        return suggestions
    
    async def _suggest_inventory_actions(self) -> List[Dict[str, Any]]:
        """Generate inventory-related suggestions."""
        suggestions = []
        now = get_now_utc()
        
        stale_threshold = now - timedelta(days=90)
        
        project_stale = {}
        projects = await self.db.projects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
        
        for project in projects:
            stale_count = await self.db.products.count_documents({
                "project_id": project["id"],
                "inventory_status": "available",
                "created_at": {"$lt": stale_threshold.isoformat()}
            })
            if stale_count > 0:
                project_stale[project["id"]] = {
                    "name": project.get("name", "Unknown"),
                    "count": stale_count
                }
        
        for project_id, data in project_stale.items():
            if data["count"] >= 5:
                suggestions.append({
                    "id": f"inv_stale_{project_id}",
                    "category": "inventory",
                    "priority_score": 55,
                    "urgency": UrgencyLevel.LOW.value,
                    "title": f"Project {data['name']} co {data['count']} can ton lau",
                    "description": f"Co {data['count']} can trong project {data['name']} ton > 90 ngay",
                    "rationale": "Ton kho lau anh huong den dong tien va chi phi holding",
                    "recommended_action": "Xem xet dieu chinh gia, promotion, hoac tang marketing",
                    "expected_impact": "Giam thoi gian ban hang",
                    "target_entity": "projects",
                    "target_id": project_id,
                    "metrics": {"stale_count": data["count"]},
                    "created_at": now.isoformat()
                })
        
        return suggestions
    
    async def _suggest_operational_actions(self) -> List[Dict[str, Any]]:
        """Generate operational suggestions."""
        suggestions = []
        now = get_now_utc()
        
        pending_contracts = await self.db.contracts.count_documents({
            "status": {"$in": ["pending_review", "pending_approval"]}
        })
        
        if pending_contracts > 5:
            suggestions.append({
                "id": f"ops_contract_backlog_{now.strftime('%Y%m%d')}",
                "category": "operations",
                "priority_score": 75,
                "urgency": UrgencyLevel.HIGH.value,
                "title": f"Xu ly backlog {pending_contracts} hop dong",
                "description": f"Co {pending_contracts} hop dong dang pending review/approval",
                "rationale": "Contract backlog lam cham qua trinh close deal",
                "recommended_action": "Assign them nguoi review hoac to chuc session xu ly tap trung",
                "expected_impact": "Giam thoi gian close deal 2-3 ngay",
                "target_entity": "contracts",
                "target_id": "backlog",
                "metrics": {"pending_count": pending_contracts},
                "created_at": now.isoformat()
            })
        
        total_tasks = await self.db.tasks.count_documents({"status": {"$nin": ["cancelled"]}})
        overdue_tasks = await self.db.tasks.count_documents({
            "status": {"$nin": ["completed", "cancelled"]},
            "due_at": {"$lt": now.isoformat()}
        })
        
        overdue_rate = calculate_percentage(overdue_tasks, total_tasks)
        
        if overdue_rate > 20:
            suggestions.append({
                "id": f"ops_task_overdue_{now.strftime('%Y%m%d')}",
                "category": "operations",
                "priority_score": 60,
                "urgency": UrgencyLevel.MEDIUM.value,
                "title": f"Cai thien task completion ({overdue_rate:.0f}% overdue)",
                "description": f"Co {overdue_tasks}/{total_tasks} tasks dang qua han ({overdue_rate:.0f}%)",
                "rationale": "Ty le overdue > 20% anh huong den hieu suat va customer experience",
                "recommended_action": "Review workload, reschedule hoac reassign tasks",
                "expected_impact": "Cai thien ky luat van hanh",
                "target_entity": "tasks",
                "target_id": "overdue",
                "metrics": {"total_tasks": total_tasks, "overdue_tasks": overdue_tasks, "overdue_rate": round(overdue_rate, 1)},
                "created_at": now.isoformat()
            })
        
        return suggestions
    
    async def get_summary(self) -> Dict[str, Any]:
        """Get summary of all suggestions by category."""
        suggestions = await self.generate_suggestions()
        
        by_category = {}
        by_urgency = {}
        
        for s in suggestions:
            cat = s.get("category", "other")
            urg = s.get("urgency", "medium")
            
            by_category[cat] = by_category.get(cat, 0) + 1
            by_urgency[urg] = by_urgency.get(urg, 0) + 1
        
        return {
            "total_suggestions": len(suggestions),
            "by_category": by_category,
            "by_urgency": by_urgency,
            "top_priority": suggestions[:5] if suggestions else [],
            "critical_count": by_urgency.get(UrgencyLevel.CRITICAL.value, 0),
            "high_count": by_urgency.get(UrgencyLevel.HIGH.value, 0)
        }
