"""
ProHouzing Marketing Router
Prompt 7/20 - Lead Source & Marketing Attribution Engine

APIs for:
- Lead Sources CRUD & Analytics
- Campaigns CRUD & Analytics
- Touchpoints & Attribution
- Assignment Rules
- Marketing Dashboard
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from models.marketing_models import (
    # Enums
    LeadSourceType, LeadSourceChannel, CampaignType, CampaignStatus,
    AssignmentRuleType, TouchpointType, AttributionModel,
    # Lead Source
    LeadSourceCreate, LeadSourceResponse, LeadSourceSummary,
    # Campaign
    CampaignCreate, CampaignResponse, CampaignStatusUpdate,
    # Touchpoint & Attribution
    TouchpointCreate, TouchpointResponse, AttributionReport,
    # Assignment
    AssignmentRuleCreate, AssignmentRuleResponse, AssignmentResult, AssignmentTestRequest,
    # Analytics
    SourceAnalytics, CampaignAnalytics, ChannelAnalytics, MarketingDashboard
)

from config.marketing_config import (
    LEAD_SOURCE_TYPES, LEAD_SOURCE_CHANNELS, CAMPAIGN_TYPES, CAMPAIGN_STATUSES,
    ASSIGNMENT_RULE_TYPES, DEFAULT_LEAD_SOURCES, ATTRIBUTION_MODELS, TOUCHPOINT_TYPES,
    get_source_type, get_channel, get_campaign_type, get_campaign_status,
    get_assignment_rule_type, get_default_quality_score, map_legacy_channel_to_source
)

# Create router
router = APIRouter(prefix="/api/marketing", tags=["Marketing"])

# Database reference
_db = None


def set_database(database):
    """Set the database reference"""
    global _db
    _db = database


def get_db():
    """Get database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_user_name(user_id: str) -> Optional[str]:
    if not user_id:
        return None
    db = get_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "full_name": 1})
    return user["full_name"] if user else None


def format_currency(amount: float, currency: str = "VND") -> str:
    if amount >= 1000000000:
        return f"{amount/1000000000:.1f} tỷ {currency}"
    elif amount >= 1000000:
        return f"{amount/1000000:.0f} triệu {currency}"
    return f"{amount:,.0f} {currency}"


async def calculate_source_stats(source_id: str) -> Dict[str, Any]:
    """Calculate statistics for a lead source"""
    db = get_db()
    
    # Count leads from this source
    total_leads = await db.leads.count_documents({"lead_source_id": source_id})
    
    # Count converted leads (status = closed_won or stage = converted)
    converted_leads = await db.leads.count_documents({
        "lead_source_id": source_id,
        "$or": [
            {"status": "closed_won"},
            {"stage": "converted"}
        ]
    })
    
    # Calculate conversion rate
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Calculate revenue from deals
    pipeline = [
        {"$match": {"lead_source_id": source_id, "status": {"$in": ["closed_won", "completed"]}}},
        {"$lookup": {
            "from": "deals",
            "localField": "converted_to_deal_id",
            "foreignField": "id",
            "as": "deal"
        }},
        {"$unwind": {"path": "$deal", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": {"$ifNull": ["$deal.deal_value", 0]}},
            "deal_count": {"$sum": {"$cond": [{"$gt": ["$deal.deal_value", 0]}, 1, 0]}}
        }}
    ]
    
    revenue_result = await db.leads.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    deal_count = revenue_result[0]["deal_count"] if revenue_result else 0
    avg_deal_value = (total_revenue / deal_count) if deal_count > 0 else 0
    
    return {
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "conversion_rate": round(conversion_rate, 2),
        "total_revenue": total_revenue,
        "avg_deal_value": avg_deal_value
    }


async def calculate_campaign_stats(campaign_id: str) -> Dict[str, Any]:
    """Calculate statistics for a campaign"""
    db = get_db()
    
    total_leads = await db.leads.count_documents({"campaign_id": campaign_id})
    
    qualified_leads = await db.leads.count_documents({
        "campaign_id": campaign_id,
        "stage": {"$in": ["qualified", "converted"]}
    })
    
    converted_leads = await db.leads.count_documents({
        "campaign_id": campaign_id,
        "$or": [
            {"status": "closed_won"},
            {"stage": "converted"}
        ]
    })
    
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Revenue calculation
    pipeline = [
        {"$match": {"campaign_id": campaign_id}},
        {"$lookup": {
            "from": "deals",
            "localField": "converted_to_deal_id",
            "foreignField": "id",
            "as": "deal"
        }},
        {"$unwind": {"path": "$deal", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": {"$ifNull": ["$deal.deal_value", 0]}}
        }}
    ]
    
    revenue_result = await db.leads.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "total_leads": total_leads,
        "qualified_leads": qualified_leads,
        "converted_leads": converted_leads,
        "conversion_rate": round(conversion_rate, 2),
        "total_revenue": total_revenue
    }


# ============================================
# CONFIG ROUTES
# ============================================

@router.get("/config/source-types")
async def get_source_types_config():
    """Get all lead source types"""
    return {"source_types": LEAD_SOURCE_TYPES}


@router.get("/config/channels")
async def get_channels_config():
    """Get all channels"""
    return {"channels": LEAD_SOURCE_CHANNELS}


@router.get("/config/campaign-types")
async def get_campaign_types_config():
    """Get all campaign types"""
    return {"campaign_types": CAMPAIGN_TYPES}


@router.get("/config/campaign-statuses")
async def get_campaign_statuses_config():
    """Get all campaign statuses"""
    return {"statuses": CAMPAIGN_STATUSES}


@router.get("/config/assignment-rule-types")
async def get_assignment_rule_types_config():
    """Get all assignment rule types"""
    return {"rule_types": ASSIGNMENT_RULE_TYPES}


@router.get("/config/attribution-models")
async def get_attribution_models_config():
    """Get all attribution models"""
    return {"models": ATTRIBUTION_MODELS}


@router.get("/config/touchpoint-types")
async def get_touchpoint_types_config():
    """Get all touchpoint types"""
    return {"types": TOUCHPOINT_TYPES}


# ============================================
# LEAD SOURCE ROUTES
# ============================================

@router.post("/sources", response_model=LeadSourceResponse)
async def create_lead_source(source: LeadSourceCreate):
    """Create a new lead source"""
    db = get_db()
    
    # Check for duplicate code
    existing = await db.lead_sources.find_one({"code": source.code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Lead source with code '{source.code}' already exists")
    
    source_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    source_type_info = get_source_type(source.source_type.value) or {}
    channel_info = get_channel(source.channel.value) or {}
    
    source_doc = {
        "id": source_id,
        **source.model_dump(),
        "source_type": source.source_type.value,
        "channel": source.channel.value,
        "total_leads": 0,
        "converted_leads": 0,
        "conversion_rate": 0,
        "total_revenue": 0,
        "budget_spent": 0,
        "created_at": now,
        "created_by": None,
        "updated_at": now
    }
    
    await db.lead_sources.insert_one(source_doc)
    
    return LeadSourceResponse(
        **{k: v for k, v in source_doc.items() if k != "_id"},
        source_type_label=source_type_info.get("label_vi", source.source_type.value),
        channel_label=channel_info.get("label", source.channel.value)
    )


@router.get("/sources", response_model=List[LeadSourceResponse])
async def get_lead_sources(
    source_type: Optional[str] = None,
    channel: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    """Get all lead sources with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if source_type:
        query["source_type"] = source_type
    if channel:
        query["channel"] = channel
    if is_active is not None:
        query["is_active"] = is_active
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    sources = await db.lead_sources.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for src in sources:
        source_type_info = get_source_type(src.get("source_type", "other")) or {}
        channel_info = get_channel(src.get("channel", "other")) or {}
        
        # Calculate stats
        stats = await calculate_source_stats(src["id"])
        
        # Remove stats fields from src to avoid conflicts
        src_clean = {k: v for k, v in src.items() if k not in ["total_leads", "converted_leads", "conversion_rate", "total_revenue", "avg_deal_value", "roi"]}
        
        result.append(LeadSourceResponse(
            **src_clean,
            source_type_label=source_type_info.get("label_vi", src.get("source_type", "")),
            channel_label=channel_info.get("label", src.get("channel", "")),
            total_leads=stats["total_leads"],
            converted_leads=stats["converted_leads"],
            conversion_rate=stats["conversion_rate"],
            total_revenue=stats["total_revenue"],
            avg_deal_value=stats["avg_deal_value"]
        ))
    
    return result


@router.get("/sources/{source_id}", response_model=LeadSourceResponse)
async def get_lead_source(source_id: str):
    """Get a lead source by ID"""
    db = get_db()
    source = await db.lead_sources.find_one({"id": source_id}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
    
    source_type_info = get_source_type(source.get("source_type", "other")) or {}
    channel_info = get_channel(source.get("channel", "other")) or {}
    stats = await calculate_source_stats(source_id)
    
    # Remove stats fields from source to avoid conflicts
    source_clean = {k: v for k, v in source.items() if k not in ["total_leads", "converted_leads", "conversion_rate", "total_revenue", "avg_deal_value", "roi"]}
    
    return LeadSourceResponse(
        **source_clean,
        source_type_label=source_type_info.get("label_vi", source.get("source_type", "")),
        channel_label=channel_info.get("label", source.get("channel", "")),
        **stats
    )


@router.put("/sources/{source_id}")
async def update_lead_source(source_id: str, updates: Dict[str, Any]):
    """Update a lead source"""
    db = get_db()
    source = await db.lead_sources.find_one({"id": source_id}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
    
    # Prevent changing code if it would conflict
    if "code" in updates and updates["code"] != source["code"]:
        existing = await db.lead_sources.find_one({"code": updates["code"]}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail=f"Lead source with code '{updates['code']}' already exists")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.lead_sources.update_one({"id": source_id}, {"$set": updates})
    return {"success": True}


@router.delete("/sources/{source_id}")
async def delete_lead_source(source_id: str):
    """Soft delete a lead source"""
    db = get_db()
    source = await db.lead_sources.find_one({"id": source_id}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
    
    # Check if source has leads
    lead_count = await db.leads.count_documents({"lead_source_id": source_id})
    if lead_count > 0:
        # Soft delete - just deactivate
        await db.lead_sources.update_one(
            {"id": source_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"success": True, "soft_delete": True, "reason": f"Source has {lead_count} leads"}
    
    # Hard delete if no leads
    await db.lead_sources.delete_one({"id": source_id})
    return {"success": True, "soft_delete": False}


@router.get("/sources/{source_id}/analytics", response_model=SourceAnalytics)
async def get_source_analytics(source_id: str):
    """Get detailed analytics for a lead source"""
    db = get_db()
    source = await db.lead_sources.find_one({"id": source_id}, {"_id": 0})
    if not source:
        raise HTTPException(status_code=404, detail="Lead source not found")
    
    stats = await calculate_source_stats(source_id)
    
    # Count by status
    new_leads = await db.leads.count_documents({"lead_source_id": source_id, "stage": "raw"})
    qualified_leads = await db.leads.count_documents({"lead_source_id": source_id, "stage": {"$in": ["qualified", "qualifying"]}})
    lost_leads = await db.leads.count_documents({"lead_source_id": source_id, "stage": {"$in": ["lost", "disqualified"]}})
    
    # Calculate qualification rate
    qualification_rate = (qualified_leads / stats["total_leads"] * 100) if stats["total_leads"] > 0 else 0
    
    # Cost metrics
    total_cost = source.get("total_budget", 0) or 0
    cost_per_lead = (total_cost / stats["total_leads"]) if stats["total_leads"] > 0 else 0
    cost_per_conversion = (total_cost / stats["converted_leads"]) if stats["converted_leads"] > 0 else 0
    roi = ((stats["total_revenue"] - total_cost) / total_cost * 100) if total_cost > 0 else 0
    
    return SourceAnalytics(
        source_id=source_id,
        source_code=source["code"],
        source_name=source["name"],
        source_type=source["source_type"],
        channel=source["channel"],
        total_leads=stats["total_leads"],
        new_leads=new_leads,
        qualified_leads=qualified_leads,
        converted_leads=stats["converted_leads"],
        lost_leads=lost_leads,
        qualification_rate=round(qualification_rate, 2),
        conversion_rate=stats["conversion_rate"],
        total_revenue=stats["total_revenue"],
        avg_deal_value=stats["avg_deal_value"],
        total_cost=total_cost,
        cost_per_lead=round(cost_per_lead, 0),
        cost_per_conversion=round(cost_per_conversion, 0),
        roi=round(roi, 2)
    )


@router.get("/sources/summary/all", response_model=List[LeadSourceSummary])
async def get_sources_summary(current_user: dict = None):
    """Get summary of all lead sources"""
    db = get_db()
    sources = await db.lead_sources.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    result = []
    for src in sources:
        stats = await calculate_source_stats(src["id"])
        
        total_cost = src.get("total_budget", 0) or 0
        cost_per_lead = (total_cost / stats["total_leads"]) if stats["total_leads"] > 0 else 0
        roi = ((stats["total_revenue"] - total_cost) / total_cost * 100) if total_cost > 0 else 0
        
        result.append(LeadSourceSummary(
            source_id=src["id"],
            source_code=src["code"],
            source_name=src["name"],
            source_type=src["source_type"],
            channel=src["channel"],
            total_leads=stats["total_leads"],
            converted_leads=stats["converted_leads"],
            conversion_rate=stats["conversion_rate"],
            total_revenue=stats["total_revenue"],
            cost_per_lead=round(cost_per_lead, 0),
            roi=round(roi, 2)
        ))
    
    # Sort by total_leads descending
    result.sort(key=lambda x: x.total_leads, reverse=True)
    return result


@router.post("/sources/seed-defaults")
async def seed_default_sources(current_user: dict = None):
    """Seed default lead sources if not exists"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    created_count = 0
    
    for default_src in DEFAULT_LEAD_SOURCES:
        existing = await db.lead_sources.find_one({"code": default_src["code"]}, {"_id": 0})
        if not existing:
            source_doc = {
                "id": str(uuid.uuid4()),
                "code": default_src["code"],
                "name": default_src["name"],
                "source_type": default_src["source_type"],
                "channel": default_src["channel"],
                "default_quality_score": default_src["default_quality_score"],
                "is_active": True,
                "tags": [],
                "total_leads": 0,
                "converted_leads": 0,
                "created_at": now,
                "created_by": None,
                "updated_at": now
            }
            await db.lead_sources.insert_one(source_doc)
            created_count += 1
    
    return {"success": True, "created": created_count, "total_defaults": len(DEFAULT_LEAD_SOURCES)}


# ============================================
# CAMPAIGN ROUTES
# ============================================

@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(campaign: CampaignCreate):
    """Create a new campaign"""
    db = get_db()
    
    # Check for duplicate code
    existing = await db.campaigns.find_one({"code": campaign.code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Campaign with code '{campaign.code}' already exists")
    
    campaign_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    campaign_type_info = get_campaign_type(campaign.campaign_type.value) or {}
    status_info = get_campaign_status(campaign.status.value) or {}
    
    campaign_doc = {
        "id": campaign_id,
        **campaign.model_dump(),
        "campaign_type": campaign.campaign_type.value,
        "status": campaign.status.value,
        "budget_spent": 0,
        "total_leads": 0,
        "qualified_leads": 0,
        "converted_leads": 0,
        "total_revenue": 0,
        "created_at": now,
        "created_by": None,
        "updated_at": now
    }
    
    await db.campaigns.insert_one(campaign_doc)
    
    return CampaignResponse(
        **{k: v for k, v in campaign_doc.items() if k != "_id"},
        campaign_type_label=campaign_type_info.get("label_vi", campaign.campaign_type.value),
        status_label=status_info.get("label", campaign.status.value),
        status_color=status_info.get("color", "")
    )


@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(
    status: Optional[str] = None,
    campaign_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    """Get all campaigns with filters"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if status:
        query["status"] = status
    if campaign_type:
        query["campaign_type"] = campaign_type
    if search:
        query["$or"] = [
            {"code": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    campaigns = await db.campaigns.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for camp in campaigns:
        campaign_type_info = get_campaign_type(camp.get("campaign_type", "")) or {}
        status_info = get_campaign_status(camp.get("status", "draft")) or {}
        
        # Calculate stats
        stats = await calculate_campaign_stats(camp["id"])
        
        # Calculate progress
        leads_progress = (stats["total_leads"] / camp.get("target_leads", 1) * 100) if camp.get("target_leads") else 0
        conversion_progress = (stats["converted_leads"] / camp.get("target_conversions", 1) * 100) if camp.get("target_conversions") else 0
        revenue_progress = (stats["total_revenue"] / camp.get("target_revenue", 1) * 100) if camp.get("target_revenue") else 0
        budget_progress = (camp.get("budget_spent", 0) / camp.get("budget_total", 1) * 100) if camp.get("budget_total") else 0
        
        # Calculate days remaining
        days_remaining = None
        is_overdue = False
        if camp.get("end_date"):
            try:
                end_date = datetime.fromisoformat(camp["end_date"].replace('Z', '+00:00'))
                now_dt = datetime.now(timezone.utc)
                days_remaining = (end_date - now_dt).days
                is_overdue = days_remaining < 0
            except (ValueError, TypeError):
                pass
        
        # Cost metrics
        budget_spent = camp.get("budget_spent", 0)
        cost_per_lead = (budget_spent / stats["total_leads"]) if stats["total_leads"] > 0 else 0
        cost_per_conversion = (budget_spent / stats["converted_leads"]) if stats["converted_leads"] > 0 else 0
        roi = ((stats["total_revenue"] - budget_spent) / budget_spent * 100) if budget_spent > 0 else 0
        
        # Clean campaign dict to avoid field conflicts
        camp_clean = {k: v for k, v in camp.items() if k not in [
            "total_leads", "qualified_leads", "converted_leads", "total_revenue",
            "budget_spent", "actual_cost_per_lead", "cost_per_conversion", "conversion_rate", "roi"
        ]}
        
        result.append(CampaignResponse(
            **camp_clean,
            campaign_type_label=campaign_type_info.get("label_vi", camp.get("campaign_type", "")),
            status_label=status_info.get("label", camp.get("status", "")),
            status_color=status_info.get("color", ""),
            total_leads=stats["total_leads"],
            qualified_leads=stats["qualified_leads"],
            converted_leads=stats["converted_leads"],
            total_revenue=stats["total_revenue"],
            budget_spent=budget_spent,
            actual_cost_per_lead=round(cost_per_lead, 0),
            cost_per_conversion=round(cost_per_conversion, 0),
            conversion_rate=stats["conversion_rate"],
            roi=round(roi, 2),
            leads_progress=round(leads_progress, 1),
            conversion_progress=round(conversion_progress, 1),
            revenue_progress=round(revenue_progress, 1),
            budget_progress=round(budget_progress, 1),
            days_remaining=days_remaining,
            is_overdue=is_overdue
        ))
    
    return result


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str):
    """Get a campaign by ID"""
    db = get_db()
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign_type_info = get_campaign_type(campaign.get("campaign_type", "")) or {}
    status_info = get_campaign_status(campaign.get("status", "draft")) or {}
    stats = await calculate_campaign_stats(campaign_id)
    
    budget_spent = campaign.get("budget_spent", 0)
    cost_per_lead = (budget_spent / stats["total_leads"]) if stats["total_leads"] > 0 else 0
    cost_per_conversion = (budget_spent / stats["converted_leads"]) if stats["converted_leads"] > 0 else 0
    roi = ((stats["total_revenue"] - budget_spent) / budget_spent * 100) if budget_spent > 0 else 0
    
    # Clean campaign dict to avoid field conflicts
    campaign_clean = {k: v for k, v in campaign.items() if k not in [
        "total_leads", "qualified_leads", "converted_leads", "total_revenue",
        "budget_spent", "actual_cost_per_lead", "cost_per_conversion", "conversion_rate", "roi"
    ]}
    
    return CampaignResponse(
        **campaign_clean,
        campaign_type_label=campaign_type_info.get("label_vi", campaign.get("campaign_type", "")),
        status_label=status_info.get("label", campaign.get("status", "")),
        status_color=status_info.get("color", ""),
        **stats,
        budget_spent=budget_spent,
        actual_cost_per_lead=round(cost_per_lead, 0),
        cost_per_conversion=round(cost_per_conversion, 0),
        roi=round(roi, 2)
    )


@router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, updates: Dict[str, Any]):
    """Update a campaign"""
    db = get_db()
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.campaigns.update_one({"id": campaign_id}, {"$set": updates})
    return {"success": True}


@router.put("/campaigns/{campaign_id}/status")
async def update_campaign_status(campaign_id: str, status_update: CampaignStatusUpdate):
    """Update campaign status"""
    db = get_db()
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "status": status_update.status.value,
        "updated_at": now
    }
    
    # Record status change
    status_history_entry = {
        "id": str(uuid.uuid4()),
        "campaign_id": campaign_id,
        "old_status": campaign.get("status"),
        "new_status": status_update.status.value,
        "reason": status_update.reason,
        "changed_at": now,
        "changed_by": None
    }
    await db.campaign_status_history.insert_one(status_history_entry)
    
    await db.campaigns.update_one({"id": campaign_id}, {"$set": update_data})
    
    return {"success": True, "old_status": campaign.get("status"), "new_status": status_update.status.value}


@router.get("/campaigns/{campaign_id}/leads")
async def get_campaign_leads(
    campaign_id: str,
    stage: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    """Get leads from a campaign"""
    db = get_db()
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    query = {"campaign_id": campaign_id}
    if stage:
        query["stage"] = stage
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.leads.count_documents(query)
    
    return {"leads": leads, "total": total, "campaign_id": campaign_id}


@router.get("/campaigns/{campaign_id}/analytics", response_model=CampaignAnalytics)
async def get_campaign_analytics(campaign_id: str):
    """Get detailed analytics for a campaign"""
    db = get_db()
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    stats = await calculate_campaign_stats(campaign_id)
    
    # Leads by source breakdown
    pipeline = [
        {"$match": {"campaign_id": campaign_id}},
        {"$group": {"_id": "$lead_source_id", "count": {"$sum": 1}}}
    ]
    source_breakdown = await db.leads.aggregate(pipeline).to_list(100)
    leads_by_source = {item["_id"]: item["count"] for item in source_breakdown if item["_id"]}
    
    budget_spent = campaign.get("budget_spent", 0)
    budget_total = campaign.get("budget_total", 0)
    
    cost_per_lead = (budget_spent / stats["total_leads"]) if stats["total_leads"] > 0 else 0
    cost_per_conversion = (budget_spent / stats["converted_leads"]) if stats["converted_leads"] > 0 else 0
    roi = ((stats["total_revenue"] - budget_spent) / budget_spent * 100) if budget_spent > 0 else 0
    
    leads_vs_target = (stats["total_leads"] / campaign.get("target_leads", 1) * 100) if campaign.get("target_leads") else 0
    revenue_vs_target = (stats["total_revenue"] / campaign.get("target_revenue", 1) * 100) if campaign.get("target_revenue") else 0
    
    return CampaignAnalytics(
        campaign_id=campaign_id,
        campaign_code=campaign["code"],
        campaign_name=campaign["name"],
        campaign_type=campaign["campaign_type"],
        status=campaign["status"],
        **stats,
        budget_total=budget_total,
        budget_spent=budget_spent,
        budget_remaining=budget_total - budget_spent,
        cost_per_lead=round(cost_per_lead, 0),
        cost_per_conversion=round(cost_per_conversion, 0),
        roi=round(roi, 2),
        leads_vs_target=round(leads_vs_target, 1),
        revenue_vs_target=round(revenue_vs_target, 1),
        leads_by_source=leads_by_source
    )


# ============================================
# TOUCHPOINT & ATTRIBUTION ROUTES
# ============================================

@router.post("/touchpoints", response_model=TouchpointResponse)
async def create_touchpoint(touchpoint: TouchpointCreate):
    """Record a touchpoint"""
    db = get_db()
    
    touchpoint_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    touchpoint_doc = {
        "id": touchpoint_id,
        **touchpoint.model_dump(),
        "touchpoint_type": touchpoint.touchpoint_type.value if hasattr(touchpoint.touchpoint_type, 'value') else touchpoint.touchpoint_type,
        "occurred_at": now,
        "created_at": now
    }
    
    await db.touchpoints.insert_one(touchpoint_doc)
    
    # Resolve names
    source_name = None
    campaign_name = None
    if touchpoint.lead_source_id:
        source = await db.lead_sources.find_one({"id": touchpoint.lead_source_id}, {"_id": 0, "name": 1})
        source_name = source["name"] if source else None
    if touchpoint.campaign_id:
        campaign = await db.campaigns.find_one({"id": touchpoint.campaign_id}, {"_id": 0, "name": 1})
        campaign_name = campaign["name"] if campaign else None
    
    return TouchpointResponse(
        **{k: v for k, v in touchpoint_doc.items() if k != "_id"},
        lead_source_name=source_name,
        campaign_name=campaign_name,
        touchpoint_type_label=touchpoint_doc["touchpoint_type"]
    )


@router.get("/attribution/contact/{contact_id}", response_model=AttributionReport)
async def get_contact_attribution(
    contact_id: str,
    attribution_model: str = "first_touch",
    current_user: dict = None
):
    """Get attribution report for a contact"""
    db = get_db()
    
    # Get contact
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Get all touchpoints
    touchpoints = await db.touchpoints.find(
        {"contact_id": contact_id},
        {"_id": 0}
    ).sort("occurred_at", 1).to_list(100)
    
    # Calculate attribution
    first_touch = touchpoints[0] if touchpoints else None
    last_touch = touchpoints[-1] if touchpoints else None
    
    # Get deal revenue
    total_revenue = 0
    deal = await db.deals.find_one({"contact_id": contact_id, "status": "completed"}, {"_id": 0})
    if deal:
        total_revenue = deal.get("deal_value", 0)
    
    # Attribution by source (simplified - first touch gets 100%)
    attributed_by_source = {}
    attributed_by_campaign = {}
    attributed_by_channel = {}
    
    if first_touch and total_revenue > 0:
        if first_touch.get("lead_source_id"):
            attributed_by_source[first_touch["lead_source_id"]] = total_revenue
        if first_touch.get("campaign_id"):
            attributed_by_campaign[first_touch["campaign_id"]] = total_revenue
        if first_touch.get("channel"):
            attributed_by_channel[first_touch["channel"]] = total_revenue
    
    # Days to conversion
    days_to_conversion = 0
    conversion_at = None
    if first_touch and deal:
        try:
            first_dt = datetime.fromisoformat(first_touch["occurred_at"].replace('Z', '+00:00'))
            conv_dt = datetime.fromisoformat(deal.get("created_at", "").replace('Z', '+00:00'))
            days_to_conversion = (conv_dt - first_dt).days
            conversion_at = deal.get("created_at")
        except (ValueError, TypeError, AttributeError):
            pass
    
    # Resolve names
    first_touch_source_name = None
    first_touch_campaign_name = None
    last_touch_source_name = None
    last_touch_campaign_name = None
    
    if first_touch:
        if first_touch.get("lead_source_id"):
            src = await db.lead_sources.find_one({"id": first_touch["lead_source_id"]}, {"_id": 0, "name": 1})
            first_touch_source_name = src["name"] if src else None
        if first_touch.get("campaign_id"):
            camp = await db.campaigns.find_one({"id": first_touch["campaign_id"]}, {"_id": 0, "name": 1})
            first_touch_campaign_name = camp["name"] if camp else None
    
    if last_touch and last_touch != first_touch:
        if last_touch.get("lead_source_id"):
            src = await db.lead_sources.find_one({"id": last_touch["lead_source_id"]}, {"_id": 0, "name": 1})
            last_touch_source_name = src["name"] if src else None
        if last_touch.get("campaign_id"):
            camp = await db.campaigns.find_one({"id": last_touch["campaign_id"]}, {"_id": 0, "name": 1})
            last_touch_campaign_name = camp["name"] if camp else None
    
    return AttributionReport(
        contact_id=contact_id,
        contact_name=contact.get("full_name", ""),
        touchpoints=[TouchpointResponse(**tp, lead_source_name=None, campaign_name=None, touchpoint_type_label=tp.get("touchpoint_type", "")) for tp in touchpoints],
        total_touchpoints=len(touchpoints),
        first_touch_source_id=first_touch.get("lead_source_id") if first_touch else None,
        first_touch_source_name=first_touch_source_name,
        first_touch_campaign_id=first_touch.get("campaign_id") if first_touch else None,
        first_touch_campaign_name=first_touch_campaign_name,
        first_touch_channel=first_touch.get("channel") if first_touch else None,
        first_touch_at=first_touch.get("occurred_at") if first_touch else None,
        last_touch_source_id=last_touch.get("lead_source_id") if last_touch else None,
        last_touch_source_name=last_touch_source_name,
        last_touch_campaign_id=last_touch.get("campaign_id") if last_touch else None,
        last_touch_campaign_name=last_touch_campaign_name,
        last_touch_channel=last_touch.get("channel") if last_touch else None,
        last_touch_at=last_touch.get("occurred_at") if last_touch else None,
        total_revenue=total_revenue,
        attributed_by_source=attributed_by_source,
        attributed_by_campaign=attributed_by_campaign,
        attributed_by_channel=attributed_by_channel,
        conversion_at=conversion_at,
        days_to_conversion=days_to_conversion,
        attribution_model=attribution_model
    )


# ============================================
# ASSIGNMENT RULE ROUTES
# ============================================

@router.post("/assignment-rules", response_model=AssignmentRuleResponse)
async def create_assignment_rule(rule: AssignmentRuleCreate):
    """Create a new assignment rule"""
    db = get_db()
    
    rule_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    rule_type_info = get_assignment_rule_type(rule.rule_type.value) or {}
    
    rule_doc = {
        "id": rule_id,
        **rule.model_dump(),
        "rule_type": rule.rule_type.value,
        "trigger_count": 0,
        "success_count": 0,
        "last_triggered": None,
        "created_at": now,
        "created_by": None,
        "updated_at": now
    }
    
    await db.assignment_rules.insert_one(rule_doc)
    
    return AssignmentRuleResponse(
        **{k: v for k, v in rule_doc.items() if k != "_id"},
        rule_type_label=rule_type_info.get("label_vi", rule.rule_type.value),
        success_rate=0.0
    )


@router.get("/assignment-rules", response_model=List[AssignmentRuleResponse])
async def get_assignment_rules(
    is_active: Optional[bool] = None,
    rule_type: Optional[str] = None,
    current_user: dict = None
):
    """Get all assignment rules"""
    db = get_db()
    query: Dict[str, Any] = {}
    
    if is_active is not None:
        query["is_active"] = is_active
    if rule_type:
        query["rule_type"] = rule_type
    
    rules = await db.assignment_rules.find(query, {"_id": 0}).sort("priority", 1).to_list(100)
    
    result = []
    for rule in rules:
        rule_type_info = get_assignment_rule_type(rule.get("rule_type", "")) or {}
        success_rate = (rule.get("success_count", 0) / rule.get("trigger_count", 1) * 100) if rule.get("trigger_count", 0) > 0 else 0
        
        # Clean rule dict to avoid field conflicts
        rule_clean = {k: v for k, v in rule.items() if k not in ["success_rate"]}
        
        result.append(AssignmentRuleResponse(
            **rule_clean,
            rule_type_label=rule_type_info.get("label_vi", rule.get("rule_type", "")),
            success_rate=round(success_rate, 2)
        ))
    
    return result


@router.put("/assignment-rules/{rule_id}")
async def update_assignment_rule(rule_id: str, updates: Dict[str, Any]):
    """Update an assignment rule"""
    db = get_db()
    rule = await db.assignment_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Assignment rule not found")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.assignment_rules.update_one({"id": rule_id}, {"$set": updates})
    return {"success": True}


@router.delete("/assignment-rules/{rule_id}")
async def delete_assignment_rule(rule_id: str):
    """Delete an assignment rule"""
    db = get_db()
    rule = await db.assignment_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Assignment rule not found")
    
    await db.assignment_rules.delete_one({"id": rule_id})
    return {"success": True}


@router.post("/assignment-rules/test", response_model=AssignmentResult)
async def test_assignment_rule(test_data: AssignmentTestRequest):
    """Test assignment rules with sample lead data"""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    # Build mock lead
    mock_lead = {
        "id": "test-" + str(uuid.uuid4()),
        "lead_source_id": test_data.lead_source_id,
        "campaign_id": test_data.campaign_id,
        "channel": test_data.channel,
        "source_type": test_data.source_type,
        "segment": test_data.segment,
        "budget_min": test_data.budget_min,
        "budget_max": test_data.budget_max,
        "project_interest": test_data.project_id,
        "location": test_data.region
    }
    
    # Get active rules ordered by priority
    rules = await db.assignment_rules.find({"is_active": True}, {"_id": 0}).sort("priority", 1).to_list(100)
    
    # Find matching rule
    matched_rule = None
    for rule in rules:
        conditions = rule.get("conditions", {})
        matches = True
        
        for key, value in conditions.items():
            lead_value = mock_lead.get(key)
            if isinstance(value, list):
                if lead_value not in value:
                    matches = False
                    break
            elif lead_value != value:
                matches = False
                break
        
        if matches:
            matched_rule = rule
            break
    
    if not matched_rule:
        return AssignmentResult(
            lead_id=mock_lead["id"],
            success=False,
            reason="No matching rule found",
            created_at=now
        )
    
    # Get target users from rule
    target_users = matched_rule.get("target_users", [])
    target_teams = matched_rule.get("target_teams", [])
    target_branches = matched_rule.get("target_branches", [])
    
    # Build user query
    user_query = {"is_active": True, "role": "sales"}
    if target_users:
        user_query["id"] = {"$in": target_users}
    elif target_teams:
        user_query["team_id"] = {"$in": target_teams}
    elif target_branches:
        user_query["branch_id"] = {"$in": target_branches}
    
    candidates = await db.users.find(user_query, {"_id": 0, "password": 0}).to_list(50)
    
    if not candidates:
        return AssignmentResult(
            lead_id=mock_lead["id"],
            rule_id=matched_rule["id"],
            rule_name=matched_rule["name"],
            rule_type=matched_rule["rule_type"],
            success=False,
            reason="No available users match rule targets",
            created_at=now
        )
    
    # Select first candidate (simplified round robin)
    selected = candidates[0]
    
    return AssignmentResult(
        lead_id=mock_lead["id"],
        assigned_to=selected["id"],
        assigned_to_name=selected.get("full_name", ""),
        rule_id=matched_rule["id"],
        rule_name=matched_rule["name"],
        rule_type=matched_rule["rule_type"],
        reason=f"Matched rule '{matched_rule['name']}' with type '{matched_rule['rule_type']}'",
        confidence=0.9,
        alternatives=[{"user_id": c["id"], "user_name": c.get("full_name", ""), "reason": "Alternative candidate"} for c in candidates[1:3]],
        success=True,
        created_at=now
    )


# ============================================
# DASHBOARD & ANALYTICS ROUTES
# ============================================

@router.get("/dashboard", response_model=MarketingDashboard)
async def get_marketing_dashboard(
    period: str = "30d",
    current_user: dict = None
):
    """Get marketing dashboard data"""
    db = get_db()
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=30)
    
    start_iso = start_date.isoformat()
    
    # Total leads
    total_leads = await db.leads.count_documents({"created_at": {"$gte": start_iso}})
    
    # Qualified leads
    qualified_leads = await db.leads.count_documents({
        "created_at": {"$gte": start_iso},
        "stage": {"$in": ["qualified", "qualifying", "converted"]}
    })
    
    # Converted leads
    converted_leads = await db.leads.count_documents({
        "created_at": {"$gte": start_iso},
        "$or": [
            {"status": "closed_won"},
            {"stage": "converted"}
        ]
    })
    
    # Conversion rate
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Revenue (simplified)
    revenue_pipeline = [
        {"$match": {"created_at": {"$gte": start_iso}}},
        {"$lookup": {
            "from": "deals",
            "localField": "converted_to_deal_id",
            "foreignField": "id",
            "as": "deal"
        }},
        {"$unwind": {"path": "$deal", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": {"$ifNull": ["$deal.deal_value", 0]}}
        }}
    ]
    revenue_result = await db.leads.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Leads by source type
    source_type_pipeline = [
        {"$match": {"created_at": {"$gte": start_iso}}},
        {"$lookup": {
            "from": "lead_sources",
            "localField": "lead_source_id",
            "foreignField": "id",
            "as": "source"
        }},
        {"$unwind": {"path": "$source", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": {"$ifNull": ["$source.source_type", "other"]},
            "count": {"$sum": 1}
        }}
    ]
    source_type_breakdown = await db.leads.aggregate(source_type_pipeline).to_list(20)
    leads_by_source_type = {item["_id"]: item["count"] for item in source_type_breakdown}
    
    # Leads by channel
    channel_pipeline = [
        {"$match": {"created_at": {"$gte": start_iso}}},
        {"$group": {
            "_id": {"$ifNull": ["$channel", "other"]},
            "count": {"$sum": 1}
        }}
    ]
    channel_breakdown = await db.leads.aggregate(channel_pipeline).to_list(20)
    leads_by_channel = {item["_id"]: item["count"] for item in channel_breakdown}
    
    # Active campaigns
    active_campaigns = await db.campaigns.count_documents({"status": "active"})
    active_sources = await db.lead_sources.count_documents({"is_active": True})
    
    # Top sources
    sources = await db.lead_sources.find({"is_active": True}, {"_id": 0}).limit(5).to_list(5)
    top_sources = []
    for src in sources:
        stats = await calculate_source_stats(src["id"])
        top_sources.append(LeadSourceSummary(
            source_id=src["id"],
            source_code=src["code"],
            source_name=src["name"],
            source_type=src["source_type"],
            channel=src["channel"],
            **stats
        ))
    top_sources.sort(key=lambda x: x.total_leads, reverse=True)
    
    return MarketingDashboard(
        total_leads=total_leads,
        qualified_leads=qualified_leads,
        converted_leads=converted_leads,
        conversion_rate=round(conversion_rate, 2),
        total_revenue=total_revenue,
        leads_by_source_type=leads_by_source_type,
        leads_by_channel=leads_by_channel,
        active_campaigns=active_campaigns,
        active_sources=active_sources,
        top_sources=top_sources[:5],
        period_start=start_iso,
        period_end=now.isoformat()
    )


@router.get("/analytics/channels", response_model=List[ChannelAnalytics])
async def get_channel_analytics(
    period: str = "30d",
    current_user: dict = None
):
    """Get analytics by channel"""
    db = get_db()
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=30)
    
    start_iso = start_date.isoformat()
    
    # Aggregate by channel
    pipeline = [
        {"$match": {"created_at": {"$gte": start_iso}}},
        {"$group": {
            "_id": {"$ifNull": ["$channel", "other"]},
            "total_leads": {"$sum": 1},
            "converted_leads": {
                "$sum": {
                    "$cond": [
                        {"$or": [
                            {"$eq": ["$status", "closed_won"]},
                            {"$eq": ["$stage", "converted"]}
                        ]},
                        1, 0
                    ]
                }
            }
        }}
    ]
    
    channel_stats = await db.leads.aggregate(pipeline).to_list(50)
    
    result = []
    for stat in channel_stats:
        channel_code = stat["_id"]
        channel_info = get_channel(channel_code) or {}
        conversion_rate = (stat["converted_leads"] / stat["total_leads"] * 100) if stat["total_leads"] > 0 else 0
        
        result.append(ChannelAnalytics(
            channel=channel_code,
            channel_label=channel_info.get("label", channel_code),
            total_leads=stat["total_leads"],
            converted_leads=stat["converted_leads"],
            conversion_rate=round(conversion_rate, 2)
        ))
    
    # Sort by total_leads
    result.sort(key=lambda x: x.total_leads, reverse=True)
    return result
