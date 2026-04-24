"""
ProHouzing CRM Router - Database Setup
Prompt 6/20 - CRM Unified Profile Standardization
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import re

from models.crm_models import (
    ContactCreate, ContactResponse, ContactStatus, ContactType,
    LeadCreate, LeadResponse, LeadStage, LeadStageTransition,
    DemandProfileCreate, DemandProfileResponse,
    CRMInteractionCreate, CRMInteractionResponse, InteractionType, InteractionOutcome,
    AssignmentHistoryCreate, AssignmentHistoryResponse,
    DuplicateCheckRequest, DuplicateCandidateResponse, MergeContactsRequest,
    UnifiedProfileResponse, NeedMatchRequest, NeedMatchResponse, ProductMatchResult,
    ContactStatusChange
)

from config.crm_config import (
    LEAD_STAGES, DEAL_STAGES, CONTACT_STATUSES,
    INTERACTION_TYPES, INTERACTION_OUTCOMES,
    DUPLICATE_DETECTION_CONFIG, LEAD_SCORING_CONFIG,
    get_lead_stage, get_contact_status, get_interaction_type,
    can_transition_lead_stage, normalize_phone,
    map_stage_to_legacy_status, map_legacy_status_to_stage
)

# Create router
router = APIRouter(prefix="/api/crm", tags=["CRM"])

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

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return "****"
    return phone[:3] + "*" * (len(phone) - 6) + phone[-3:]


def format_budget_display(budget_min: float = None, budget_max: float = None) -> str:
    def fmt(val):
        if val >= 1000000000:
            return f"{val/1000000000:.1f} tỷ"
        elif val >= 1000000:
            return f"{val/1000000:.0f} triệu"
        return f"{val:,.0f}"
    
    if budget_min and budget_max:
        return f"{fmt(budget_min)} - {fmt(budget_max)}"
    elif budget_max:
        return f"Đến {fmt(budget_max)}"
    elif budget_min:
        return f"Từ {fmt(budget_min)}"
    return ""


async def get_user_name(user_id: str) -> Optional[str]:
    if not user_id:
        return None
    db = get_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "full_name": 1})
    return user["full_name"] if user else None


async def get_org_names(branch_id: str = None, team_id: str = None) -> Dict[str, str]:
    db = get_db()
    result = {"branch_name": None, "team_name": None}
    if branch_id:
        branch = await db.branches.find_one({"id": branch_id}, {"_id": 0, "name": 1})
        result["branch_name"] = branch["name"] if branch else None
    if team_id:
        team = await db.teams.find_one({"id": team_id}, {"_id": 0, "name": 1})
        result["team_name"] = team["name"] if team else None
    return result


async def log_crm_interaction(
    contact_id: str,
    interaction_type: str,
    title: str,
    content: str,
    user_id: str,
    lead_id: str = None,
    deal_id: str = None,
    old_value: str = None,
    new_value: str = None,
    outcome: str = None,
    is_auto: bool = False
):
    db = get_db()
    interaction = {
        "id": str(uuid.uuid4()),
        "contact_id": contact_id,
        "lead_id": lead_id,
        "deal_id": deal_id,
        "interaction_type": interaction_type,
        "title": title,
        "content": content,
        "outcome": outcome,
        "old_value": old_value,
        "new_value": new_value,
        "user_id": user_id,
        "is_auto": is_auto,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.crm_interactions.insert_one(interaction)
    return interaction


async def log_assignment(
    entity_type: str,
    entity_id: str,
    to_user_id: str,
    from_user_id: str = None,
    assignment_type: str = "manual",
    reason: str = None,
    assigned_by: str = None,
    to_branch_id: str = None,
    from_branch_id: str = None,
    to_team_id: str = None,
    from_team_id: str = None
):
    db = get_db()
    history = {
        "id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "from_user_id": from_user_id,
        "to_user_id": to_user_id,
        "from_branch_id": from_branch_id,
        "to_branch_id": to_branch_id,
        "from_team_id": from_team_id,
        "to_team_id": to_team_id,
        "assignment_type": assignment_type,
        "reason": reason,
        "assigned_by": assigned_by,
        "assigned_at": datetime.now(timezone.utc).isoformat()
    }
    await db.assignment_history.insert_one(history)
    return history


def calculate_lead_score(lead: Dict, interactions_count: int = 0) -> Dict:
    config = LEAD_SCORING_CONFIG
    score = 0
    factors = {}
    
    source_scores = config["factors"]["source"]["scores"]
    source = lead.get("source", "other")
    source_score = source_scores.get(source, 5)
    score += source_score
    factors["source"] = {"value": source, "score": source_score, "max": 20}
    
    budget = lead.get("budget_max") or lead.get("budget_min") or 0
    budget_score = 5
    for range_config in config["factors"]["budget"]["ranges"]:
        if budget >= range_config["min"]:
            budget_score = range_config["score"]
            break
    score += budget_score
    factors["budget"] = {"value": budget, "score": budget_score, "max": 25}
    
    engagement_config = config["factors"]["engagement"]
    engagement_score = min(interactions_count * engagement_config["per_interaction"], engagement_config["max"])
    score += engagement_score
    factors["engagement"] = {"value": interactions_count, "score": engagement_score, "max": 20}
    
    stage = lead.get("stage", "raw")
    stage_scores = config["factors"]["stage"]["scores"]
    stage_score = stage_scores.get(stage, 5)
    score += stage_score
    factors["stage"] = {"value": stage, "score": stage_score, "max": 20}
    
    score = min(score, 100)
    
    priority = "low"
    for level, threshold in config["priority_thresholds"].items():
        if score >= threshold:
            priority = level
            break
    
    return {"score": score, "factors": factors, "priority": priority}


# ============================================
# CONTACT ROUTES
# ============================================

@router.post("/contacts", response_model=ContactResponse)
async def create_contact(contact: ContactCreate, current_user: dict = None):
    db = get_db()
    
    normalized = normalize_phone(contact.phone)
    existing = await db.contacts.find_one({
        "$or": [
            {"phone": contact.phone},
            {"phone_normalized": normalized},
            {"phone_secondary": contact.phone}
        ]
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Contact with this phone already exists (ID: {existing['id']})")
    
    contact_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    contact_doc = {
        "id": contact_id,
        **contact.model_dump(),
        "phone_normalized": normalized,
        "status": contact.status.value if isinstance(contact.status, ContactStatus) else contact.status,
        "contact_type": contact.contact_type.value if isinstance(contact.contact_type, ContactType) else contact.contact_type,
        "is_primary": True,
        "merged_contact_ids": [],
        "potential_duplicate_ids": [],
        "total_leads": 0,
        "total_deals": 0,
        "total_bookings": 0,
        "total_contracts": 0,
        "total_transaction_value": 0,
        "total_interactions": 0,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now
    }
    
    await db.contacts.insert_one(contact_doc)
    
    await log_crm_interaction(
        contact_id, "system", "Contact created", f"New contact: {contact.full_name}",
        current_user["id"] if current_user else "system", is_auto=True
    )
    
    org_names = await get_org_names(contact_doc.get("branch_id"), contact_doc.get("team_id"))
    assigned_name = await get_user_name(contact_doc.get("assigned_to"))
    
    return ContactResponse(
        **{k: v for k, v in contact_doc.items() if k != "_id"},
        phone_masked=mask_phone(contact.phone),
        display_name=contact.full_name,
        assigned_to_name=assigned_name,
        **org_names
    )


@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(
    status: Optional[str] = None,
    segment: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    db = get_db()
    query: Dict[str, Any] = {"is_primary": True}
    
    if status:
        query["status"] = status
    if segment:
        query["segment"] = segment
    if assigned_to:
        query["assigned_to"] = assigned_to
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}}
        ]
    
    contacts = await db.contacts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for c in contacts:
        status_info = get_contact_status(c.get("status", "lead")) or {}
        result.append(ContactResponse(
            **c,
            phone_masked=mask_phone(c.get("phone", "")),
            display_name=c.get("full_name", ""),
            segment_label=status_info.get("label", ""),
            segment_color=status_info.get("color", "")
        ))
    
    return result


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: str, current_user: dict = None):
    db = get_db()
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    org_names = await get_org_names(contact.get("branch_id"), contact.get("team_id"))
    assigned_name = await get_user_name(contact.get("assigned_to"))
    
    return ContactResponse(
        **contact,
        phone_masked=mask_phone(contact.get("phone", "")),
        display_name=contact.get("full_name", ""),
        assigned_to_name=assigned_name,
        **org_names
    )


@router.put("/contacts/{contact_id}")
async def update_contact(contact_id: str, updates: Dict[str, Any], current_user: dict = None):
    db = get_db()
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now
    
    if "phone" in updates:
        updates["phone_normalized"] = normalize_phone(updates["phone"])
    
    if "status" in updates and updates["status"] != contact.get("status"):
        await log_crm_interaction(
            contact_id, "status_change", "Contact status changed",
            f"{contact.get('status')} → {updates['status']}",
            current_user["id"] if current_user else "system",
            old_value=contact.get("status"), new_value=updates["status"]
        )
    
    await db.contacts.update_one({"id": contact_id}, {"$set": updates})
    return {"success": True}


@router.put("/contacts/{contact_id}/status")
async def change_contact_status(contact_id: str, status_change: ContactStatusChange, current_user: dict = None):
    db = get_db()
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    old_status = contact.get("status")
    new_status = status_change.new_status.value if isinstance(status_change.new_status, ContactStatus) else status_change.new_status
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"status": new_status, "updated_at": now}
    
    if new_status == "customer" and old_status != "customer":
        update_data["first_transaction_at"] = now
    
    await db.contacts.update_one({"id": contact_id}, {"$set": update_data})
    
    await log_crm_interaction(
        contact_id, "status_change", "Contact status changed",
        f"{old_status} → {new_status}. {status_change.reason or ''}",
        current_user["id"] if current_user else "system",
        old_value=old_status, new_value=new_status
    )
    
    return {"success": True, "old_status": old_status, "new_status": new_status}


@router.get("/contacts/{contact_id}/unified-profile")
async def get_unified_profile(contact_id: str, current_user: dict = None):
    db = get_db()
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    leads = await db.leads.find({"contact_id": contact_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    demand_profiles = await db.demand_profiles.find({"contact_id": contact_id}, {"_id": 0}).sort("created_at", -1).to_list(10)
    deals = await db.deals.find({"contact_id": contact_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    interactions = await db.crm_interactions.find({"contact_id": contact_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    total_interactions = await db.crm_interactions.count_documents({"contact_id": contact_id})
    assignment_history = await db.assignment_history.find({"entity_type": "contact", "entity_id": contact_id}, {"_id": 0}).sort("assigned_at", -1).to_list(20)
    
    org_names = await get_org_names(contact.get("branch_id"), contact.get("team_id"))
    assigned_name = await get_user_name(contact.get("assigned_to"))
    
    total_value = sum(d.get("deal_value", 0) for d in deals if d.get("status") == "completed")
    
    return {
        "contact": {
            **contact,
            "phone_masked": mask_phone(contact.get("phone", "")),
            "display_name": contact.get("full_name", ""),
            "assigned_to_name": assigned_name,
            **org_names
        },
        "leads": leads,
        "demand_profiles": demand_profiles,
        "active_demand": demand_profiles[0] if demand_profiles else None,
        "deals": deals,
        "active_deals": [d for d in deals if d.get("status") not in ["completed", "cancelled", "lost"]],
        "recent_interactions": interactions,
        "total_interactions": total_interactions,
        "assignment_history": assignment_history,
        "summary": {
            "total_leads": len(leads),
            "total_deals": len(deals),
            "total_value": total_value,
            "first_contact_date": contact.get("created_at")
        }
    }


# ============================================
# LEAD ROUTES (Enhanced with Lifecycle)
# ============================================

@router.post("/leads", response_model=LeadResponse)
async def create_lead_v2(lead: LeadCreate, current_user: dict = None):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    contact_id = lead.contact_id
    contact = None
    
    if contact_id:
        contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
        if not contact:
            raise HTTPException(status_code=400, detail="Contact not found")
    else:
        if lead.phone:
            normalized = normalize_phone(lead.phone)
            contact = await db.contacts.find_one({
                "$or": [{"phone": lead.phone}, {"phone_normalized": normalized}]
            }, {"_id": 0})
        
        if not contact and lead.full_name and lead.phone:
            contact_id = str(uuid.uuid4())
            contact = {
                "id": contact_id,
                "full_name": lead.full_name,
                "phone": lead.phone,
                "phone_normalized": normalize_phone(lead.phone),
                "email": lead.email,
                "status": "lead",
                "contact_type": "individual",
                "original_source": lead.source,
                "is_primary": True,
                "merged_contact_ids": [],
                "total_leads": 0,
                "total_interactions": 0,
                "created_at": now,
                "created_by": current_user["id"] if current_user else None,
                "updated_at": now
            }
            await db.contacts.insert_one(contact)
        elif contact:
            contact_id = contact["id"]
    
    if not contact_id:
        raise HTTPException(status_code=400, detail="Contact ID or contact info (name + phone) required")
    
    lead_id = str(uuid.uuid4())
    
    lead_doc = {
        "id": lead_id,
        "contact_id": contact_id,
        "stage": "raw",
        "status": "new",
        "source": lead.source,
        "source_detail": lead.source_detail,
        "campaign_id": lead.campaign_id,
        "referrer_id": lead.referrer_id,
        "referrer_type": lead.referrer_type,
        "project_interest": lead.project_interest,
        "project_ids": lead.project_ids,
        "budget_min": lead.budget_min,
        "budget_max": lead.budget_max,
        "raw_message": lead.raw_message,
        "initial_notes": lead.initial_notes,
        "tags": lead.tags,
        "branch_id": lead.branch_id or (current_user.get("branch_id") if current_user else None),
        "team_id": lead.team_id,
        "assigned_to": None,
        "score": 0,
        "total_interactions": 0,
        "is_duplicate": False,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now
    }
    
    await db.leads.insert_one(lead_doc)
    
    await db.contacts.update_one(
        {"id": contact_id},
        {"$inc": {"total_leads": 1}, "$set": {"updated_at": now}}
    )
    
    score_result = calculate_lead_score(lead_doc, 0)
    await db.leads.update_one({"id": lead_id}, {"$set": {"score": score_result["score"]}})
    lead_doc["score"] = score_result["score"]
    
    await log_crm_interaction(
        contact_id, "system", "Lead created",
        f"New lead from {lead.source}. {lead.project_interest or ''}",
        current_user["id"] if current_user else "system",
        lead_id=lead_id, is_auto=True
    )
    
    stage_info = get_lead_stage(lead_doc["stage"]) or {}
    
    return LeadResponse(
        **{k: v for k, v in lead_doc.items() if k not in ["_id", "stage"]},
        contact_name=contact.get("full_name", "") if contact else "",
        contact_phone=contact.get("phone", "") if contact else "",
        contact_phone_masked=mask_phone(contact.get("phone", "") if contact else ""),
        contact_status=contact.get("status", "") if contact else "",
        stage=LeadStage(lead_doc["stage"]),
        stage_label=stage_info.get("label", ""),
        stage_color=stage_info.get("color", ""),
        budget_display=format_budget_display(lead.budget_min, lead.budget_max)
    )


@router.get("/leads", response_model=List[LeadResponse])
async def get_leads_v2(
    stage: Optional[str] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    contact_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    db = get_db()
    query: Dict[str, Any] = {}
    
    if stage:
        query["stage"] = stage
    if source:
        query["source"] = source
    if assigned_to:
        query["assigned_to"] = assigned_to
    if contact_id:
        query["contact_id"] = contact_id
    
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    contact_ids = list(set([lead.get("contact_id") for lead in leads if lead.get("contact_id")]))
    contacts = {}
    if contact_ids:
        contact_docs = await db.contacts.find({"id": {"$in": contact_ids}}, {"_id": 0}).to_list(len(contact_ids))
        contacts = {c["id"]: c for c in contact_docs}
    
    result = []
    for lead in leads:
        contact = contacts.get(lead.get("contact_id"), {})
        stage_info = get_lead_stage(lead.get("stage", "raw")) or {}
        
        if search:
            search_lower = search.lower()
            if not (
                search_lower in contact.get("full_name", "").lower() or
                search_lower in contact.get("phone", "").lower() or
                search_lower in lead.get("project_interest", "").lower()
            ):
                continue
        
        result.append(LeadResponse(
            **{k: v for k, v in lead.items() if k != 'stage'},
            stage=LeadStage(lead.get("stage", "raw")),
            contact_name=contact.get("full_name", ""),
            contact_phone=contact.get("phone", ""),
            contact_phone_masked=mask_phone(contact.get("phone", "")),
            contact_status=contact.get("status", ""),
            stage_label=stage_info.get("label", ""),
            stage_color=stage_info.get("color", ""),
            budget_display=format_budget_display(lead.get("budget_min"), lead.get("budget_max"))
        ))
    
    return result


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead_v2(lead_id: str, current_user: dict = None):
    db = get_db()
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    contact = await db.contacts.find_one({"id": lead.get("contact_id")}, {"_id": 0}) if lead.get("contact_id") else {}
    stage_info = get_lead_stage(lead.get("stage", "raw")) or {}
    assigned_name = await get_user_name(lead.get("assigned_to"))
    org_names = await get_org_names(lead.get("branch_id"), lead.get("team_id"))
    
    return LeadResponse(
        **{k: v for k, v in lead.items() if k != 'stage'},
        stage=LeadStage(lead.get("stage", "raw")),
        contact_name=contact.get("full_name", "") if contact else "",
        contact_phone=contact.get("phone", "") if contact else "",
        contact_phone_masked=mask_phone(contact.get("phone", "") if contact else ""),
        contact_status=contact.get("status", "") if contact else "",
        stage_label=stage_info.get("label", ""),
        stage_color=stage_info.get("color", ""),
        assigned_to_name=assigned_name,
        budget_display=format_budget_display(lead.get("budget_min"), lead.get("budget_max")),
        **org_names
    )


@router.put("/leads/{lead_id}/stage")
async def change_lead_stage(lead_id: str, transition: LeadStageTransition, current_user: dict = None):
    db = get_db()
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    current_stage = lead.get("stage", "raw")
    new_stage = transition.new_stage.value if isinstance(transition.new_stage, LeadStage) else transition.new_stage
    
    if not can_transition_lead_stage(current_stage, new_stage):
        raise HTTPException(status_code=400, detail=f"Cannot transition from {current_stage} to {new_stage}")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = {
        "stage": new_stage,
        "previous_stage": current_stage,
        "stage_changed_at": now,
        "status": map_stage_to_legacy_status(new_stage),
        "updated_at": now
    }
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    await log_crm_interaction(
        lead.get("contact_id"), "stage_change", "Lead stage changed",
        f"{current_stage} → {new_stage}. {transition.reason or ''}",
        current_user["id"] if current_user else "system",
        lead_id=lead_id, old_value=current_stage, new_value=new_stage
    )
    
    result = {"success": True, "old_stage": current_stage, "new_stage": new_stage}
    
    if transition.create_deal and new_stage == "converted":
        deal_id = str(uuid.uuid4())
        deal_doc = {
            "id": deal_id,
            "contact_id": lead.get("contact_id"),
            "lead_id": lead_id,
            "stage": "negotiating",
            "status": "active",
            "deal_value": lead.get("budget_max") or lead.get("budget_min") or 0,
            "assigned_to": lead.get("assigned_to"),
            "branch_id": lead.get("branch_id"),
            "team_id": lead.get("team_id"),
            "created_at": now,
            "created_by": current_user["id"] if current_user else None
        }
        await db.deals.insert_one(deal_doc)
        
        await db.leads.update_one({"id": lead_id}, {"$set": {"converted_to_deal_id": deal_id, "converted_at": now}})
        
        contact = await db.contacts.find_one({"id": lead.get("contact_id")}, {"_id": 0})
        if contact and contact.get("status") == "lead":
            await db.contacts.update_one({"id": lead.get("contact_id")}, {"$set": {"status": "prospect", "updated_at": now}})
        
        result["deal_id"] = deal_id
    
    return result


@router.post("/leads/{lead_id}/assign")
async def assign_lead(lead_id: str, user_id: str, reason: str = None, current_user: dict = None):
    db = get_db()
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=400, detail="Target user not found")
    
    old_assigned = lead.get("assigned_to")
    now = datetime.now(timezone.utc).isoformat()
    
    await db.leads.update_one({"id": lead_id}, {"$set": {
        "assigned_to": user_id,
        "assigned_at": now,
        "assignment_reason": reason,
        "updated_at": now
    }})
    
    await log_assignment(
        "lead", lead_id, user_id,
        from_user_id=old_assigned,
        assignment_type="reassign" if old_assigned else "initial",
        reason=reason,
        assigned_by=current_user["id"] if current_user else None
    )
    
    await log_crm_interaction(
        lead.get("contact_id"),
        "reassignment" if old_assigned else "assignment",
        "Lead assigned" if not old_assigned else "Lead reassigned",
        f"Assigned to {target_user.get('full_name')}. {reason or ''}",
        current_user["id"] if current_user else "system",
        lead_id=lead_id
    )
    
    return {"success": True, "assigned_to": user_id, "assigned_to_name": target_user.get("full_name")}


# ============================================
# DEMAND PROFILE ROUTES
# ============================================

@router.post("/demands", response_model=DemandProfileResponse)
async def create_demand_profile(demand: DemandProfileCreate, current_user: dict = None):
    db = get_db()
    
    contact = await db.contacts.find_one({"id": demand.contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=400, detail="Contact not found")
    
    demand_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    demand_doc = {
        "id": demand_id,
        **demand.model_dump(),
        "purpose": demand.purpose.value if hasattr(demand.purpose, 'value') else demand.purpose,
        "urgency": demand.urgency.value if hasattr(demand.urgency, 'value') else demand.urgency,
        "version": 1,
        "matched_product_count": 0,
        "created_at": now,
        "created_by": current_user["id"] if current_user else None,
        "updated_at": now
    }
    
    await db.demand_profiles.insert_one(demand_doc)
    
    await db.contacts.update_one(
        {"id": demand.contact_id},
        {"$set": {"active_demand_profile_id": demand_id, "updated_at": now}}
    )
    
    await log_crm_interaction(
        demand.contact_id, "demand_update", "Demand profile created",
        f"Budget: {format_budget_display(demand.budget_min, demand.budget_max)}, Types: {', '.join(demand.property_types or [])}",
        current_user["id"] if current_user else "system",
        lead_id=demand.lead_id
    )
    
    return DemandProfileResponse(
        **{k: v for k, v in demand_doc.items() if k != "_id"},
        contact_name=contact.get("full_name", ""),
        budget_display=format_budget_display(demand.budget_min, demand.budget_max),
        area_display=f"{demand.area_min or 0}-{demand.area_max or 0}m²" if demand.area_min or demand.area_max else "",
        bedrooms_display=f"{demand.bedrooms_min or 0}-{demand.bedrooms_max or 0} PN" if demand.bedrooms_min or demand.bedrooms_max else ""
    )


@router.get("/demands", response_model=List[DemandProfileResponse])
async def get_demand_profiles(
    contact_id: Optional[str] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    db = get_db()
    query: Dict[str, Any] = {}
    if contact_id:
        query["contact_id"] = contact_id
    if is_active:
        query["is_active"] = True
    
    demands = await db.demand_profiles.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    contact_ids = list(set([d.get("contact_id") for d in demands if d.get("contact_id")]))
    contacts = {}
    if contact_ids:
        contact_docs = await db.contacts.find({"id": {"$in": contact_ids}}, {"_id": 0}).to_list(len(contact_ids))
        contacts = {c["id"]: c for c in contact_docs}
    
    return [
        DemandProfileResponse(
            **d,
            contact_name=contacts.get(d.get("contact_id"), {}).get("full_name", ""),
            budget_display=format_budget_display(d.get("budget_min"), d.get("budget_max")),
            area_display=f"{d.get('area_min', 0)}-{d.get('area_max', 0)}m²" if d.get("area_min") or d.get("area_max") else ""
        )
        for d in demands
    ]


@router.get("/demands/{demand_id}", response_model=DemandProfileResponse)
async def get_demand_profile(demand_id: str, current_user: dict = None):
    db = get_db()
    demand = await db.demand_profiles.find_one({"id": demand_id}, {"_id": 0})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand profile not found")
    
    contact = await db.contacts.find_one({"id": demand.get("contact_id")}, {"_id": 0}) if demand.get("contact_id") else {}
    
    return DemandProfileResponse(
        **demand,
        contact_name=contact.get("full_name", "") if contact else "",
        budget_display=format_budget_display(demand.get("budget_min"), demand.get("budget_max")),
        area_display=f"{demand.get('area_min', 0)}-{demand.get('area_max', 0)}m²"
    )


@router.put("/demands/{demand_id}")
async def update_demand_profile(demand_id: str, updates: Dict[str, Any], current_user: dict = None):
    db = get_db()
    demand = await db.demand_profiles.find_one({"id": demand_id}, {"_id": 0})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand profile not found")
    
    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now
    updates["version"] = demand.get("version", 1) + 1
    
    await db.demand_profiles.update_one({"id": demand_id}, {"$set": updates})
    
    await log_crm_interaction(
        demand.get("contact_id"), "demand_update", "Demand profile updated",
        f"Version {updates['version']}",
        current_user["id"] if current_user else "system"
    )
    
    return {"success": True}


@router.post("/demands/{demand_id}/match-products")
async def match_products_to_demand(demand_id: str, current_user: dict = None):
    db = get_db()
    demand = await db.demand_profiles.find_one({"id": demand_id}, {"_id": 0})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand profile not found")
    
    contact = await db.contacts.find_one({"id": demand.get("contact_id")}, {"_id": 0}) if demand.get("contact_id") else {}
    
    product_query: Dict[str, Any] = {}
    
    if demand.get("budget_max"):
        product_query["final_price"] = {"$lte": demand["budget_max"]}
    if demand.get("budget_min"):
        product_query.setdefault("final_price", {})["$gte"] = demand["budget_min"]
    
    if demand.get("area_min"):
        product_query["area"] = {"$gte": demand["area_min"]}
    if demand.get("area_max"):
        product_query.setdefault("area", {})["$lte"] = demand["area_max"]
    
    if demand.get("bedrooms_min"):
        product_query["bedrooms"] = {"$gte": demand["bedrooms_min"]}
    if demand.get("bedrooms_max"):
        product_query.setdefault("bedrooms", {})["$lte"] = demand["bedrooms_max"]
    
    if demand.get("property_types"):
        product_query["product_type"] = {"$in": demand["property_types"]}
    
    if demand.get("preferred_project_ids"):
        product_query["project_id"] = {"$in": demand["preferred_project_ids"]}
    
    product_query["inventory_status"] = {"$in": ["available", "for_sale"]}
    
    products = await db.products.find(product_query, {"_id": 0}).limit(40).to_list(40)
    
    matches = []
    for product in products:
        score = 0
        breakdown = {}
        notes = []
        
        price = product.get("final_price") or product.get("listed_price") or 0
        if demand.get("budget_min") and demand.get("budget_max"):
            if demand["budget_min"] <= price <= demand["budget_max"]:
                budget_score = 30
                notes.append("Trong ngân sách")
            else:
                budget_score = 15
        else:
            budget_score = 20
        score += budget_score
        breakdown["budget"] = budget_score
        
        area = product.get("area", 0)
        if demand.get("area_min") and demand.get("area_max"):
            if demand["area_min"] <= area <= demand["area_max"]:
                area_score = 20
                notes.append("Đúng diện tích")
            else:
                area_score = 10
        else:
            area_score = 15
        score += area_score
        breakdown["area"] = area_score
        
        bedrooms = product.get("bedrooms", 0)
        if demand.get("bedrooms_min"):
            if bedrooms >= demand["bedrooms_min"]:
                br_score = 15
            else:
                br_score = 5
        else:
            br_score = 10
        score += br_score
        breakdown["bedrooms"] = br_score
        
        direction = product.get("direction")
        if demand.get("directions") and direction:
            if direction in demand["directions"]:
                dir_score = 10
                notes.append("Đúng hướng")
            else:
                dir_score = 5
        else:
            dir_score = 7
        score += dir_score
        breakdown["direction"] = dir_score
        
        floor = product.get("floor_number", 0)
        if demand.get("floors_to_avoid") and floor in demand.get("floors_to_avoid", []):
            floor_score = 0
            notes.append(f"Tầng {floor} không mong muốn")
        else:
            floor_score = 7
        score += floor_score
        breakdown["floor"] = floor_score
        
        view = product.get("view")
        if demand.get("views_must_have") and view:
            if view in demand["views_must_have"]:
                view_score = 15
                notes.append("Đúng view yêu cầu")
            else:
                view_score = 5
        else:
            view_score = 8
        score += view_score
        breakdown["view"] = view_score
        
        project = await db.projects_master.find_one({"id": product.get("project_id")}, {"_id": 0, "name": 1}) if product.get("project_id") else {}
        
        matches.append({
            "product_id": product["id"],
            "product_code": product.get("code", ""),
            "product_name": product.get("name", ""),
            "project_id": product.get("project_id", ""),
            "project_name": project.get("name", "") if project else "",
            "product_type": product.get("product_type", ""),
            "area": product.get("area", 0),
            "bedrooms": product.get("bedrooms", 0),
            "floor": product.get("floor_number"),
            "direction": product.get("direction"),
            "price": price,
            "match_score": score,
            "match_breakdown": breakdown,
            "match_notes": notes,
            "inventory_status": product.get("inventory_status", ""),
            "is_available": product.get("inventory_status") in ["available", "for_sale"]
        })
    
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    matches = matches[:20]
    
    now = datetime.now(timezone.utc).isoformat()
    await db.demand_profiles.update_one(
        {"id": demand_id},
        {"$set": {"matched_product_count": len(matches), "last_match_at": now}}
    )
    
    await log_crm_interaction(
        demand.get("contact_id"), "demand_match", "Products matched",
        f"Found {len(matches)} matching products",
        current_user["id"] if current_user else "system"
    )
    
    return {
        "demand_profile_id": demand_id,
        "contact_id": demand.get("contact_id", ""),
        "contact_name": contact.get("full_name", "") if contact else "",
        "total_matches": len(matches),
        "matches": matches,
        "best_match_score": matches[0]["match_score"] if matches else 0,
        "avg_match_score": sum(m["match_score"] for m in matches) / len(matches) if matches else 0,
        "matched_at": now
    }


# ============================================
# INTERACTION (TIMELINE) ROUTES
# ============================================

@router.post("/interactions")
async def create_interaction(interaction: CRMInteractionCreate, current_user: dict = None):
    db = get_db()
    
    contact = await db.contacts.find_one({"id": interaction.contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=400, detail="Contact not found")
    
    interaction_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    interaction_doc = {
        "id": interaction_id,
        **interaction.model_dump(),
        "interaction_type": interaction.interaction_type.value if hasattr(interaction.interaction_type, 'value') else interaction.interaction_type,
        "outcome": interaction.outcome.value if interaction.outcome and hasattr(interaction.outcome, 'value') else interaction.outcome,
        "user_id": current_user["id"] if current_user else "system",
        "created_at": now
    }
    
    await db.crm_interactions.insert_one(interaction_doc)
    
    await db.contacts.update_one(
        {"id": interaction.contact_id},
        {
            "$set": {"last_interaction_at": now, "last_interaction_type": interaction_doc["interaction_type"], "updated_at": now},
            "$inc": {"total_interactions": 1}
        }
    )
    
    if interaction.lead_id:
        await db.leads.update_one(
            {"id": interaction.lead_id},
            {"$set": {"last_interaction_at": now, "updated_at": now}, "$inc": {"total_interactions": 1}}
        )
    
    type_info = get_interaction_type(interaction_doc["interaction_type"]) or {}
    
    return {
        **{k: v for k, v in interaction_doc.items() if k != "_id"},
        "user_name": current_user.get("full_name", "") if current_user else "",
        "contact_name": contact.get("full_name", ""),
        "interaction_type_label": type_info.get("label", ""),
        "interaction_type_icon": type_info.get("icon", "")
    }


@router.get("/interactions")
async def get_interactions(
    contact_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    interaction_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    db = get_db()
    query: Dict[str, Any] = {}
    if contact_id:
        query["contact_id"] = contact_id
    if lead_id:
        query["lead_id"] = lead_id
    if deal_id:
        query["deal_id"] = deal_id
    if interaction_type:
        query["interaction_type"] = interaction_type
    
    interactions = await db.crm_interactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    user_ids = list(set([i.get("user_id") for i in interactions if i.get("user_id")]))
    contact_ids = list(set([i.get("contact_id") for i in interactions if i.get("contact_id")]))
    
    users = {}
    if user_ids:
        user_docs = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(len(user_ids))
        users = {u["id"]: u.get("full_name", "") for u in user_docs}
    
    contacts = {}
    if contact_ids:
        contact_docs = await db.contacts.find({"id": {"$in": contact_ids}}, {"_id": 0}).to_list(len(contact_ids))
        contacts = {c["id"]: c.get("full_name", "") for c in contact_docs}
    
    result = []
    for i in interactions:
        type_info = get_interaction_type(i.get("interaction_type", "")) or {}
        result.append({
            **i,
            "user_name": users.get(i.get("user_id"), ""),
            "contact_name": contacts.get(i.get("contact_id"), ""),
            "interaction_type_label": type_info.get("label", ""),
            "interaction_type_icon": type_info.get("icon", "")
        })
    
    return result


@router.get("/timeline/contact/{contact_id}")
async def get_contact_timeline(contact_id: str, skip: int = 0, limit: int = 50, current_user: dict = None):
    db = get_db()
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    interactions = await db.crm_interactions.find({"contact_id": contact_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    user_ids = list(set([i.get("user_id") for i in interactions if i.get("user_id")]))
    users = {}
    if user_ids:
        user_docs = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(len(user_ids))
        users = {u["id"]: u.get("full_name", "") for u in user_docs}
    
    result = []
    for i in interactions:
        type_info = get_interaction_type(i.get("interaction_type", "")) or {}
        result.append({
            **i,
            "user_name": users.get(i.get("user_id"), ""),
            "interaction_type_label": type_info.get("label", ""),
            "interaction_type_icon": type_info.get("icon", ""),
            "interaction_type_color": type_info.get("color", "")
        })
    
    total = await db.crm_interactions.count_documents({"contact_id": contact_id})
    
    return {"contact_id": contact_id, "contact_name": contact.get("full_name", ""), "total": total, "items": result}


# ============================================
# DUPLICATE DETECTION ROUTES
# ============================================

@router.post("/duplicates/check")
async def check_duplicates(check_request: DuplicateCheckRequest, current_user: dict = None):
    db = get_db()
    duplicates = []
    
    or_conditions = []
    
    if check_request.phone:
        normalized = normalize_phone(check_request.phone)
        or_conditions.extend([
            {"phone": check_request.phone},
            {"phone_normalized": normalized},
            {"phone_secondary": check_request.phone},
            {"zalo_phone": check_request.phone}
        ])
    
    if check_request.email:
        or_conditions.append({"email": check_request.email.lower()})
    
    if check_request.zalo_phone:
        normalized = normalize_phone(check_request.zalo_phone)
        or_conditions.extend([
            {"zalo_phone": check_request.zalo_phone},
            {"phone": check_request.zalo_phone},
            {"phone_normalized": normalized}
        ])
    
    if check_request.facebook_id:
        or_conditions.append({"facebook_id": check_request.facebook_id})
    
    if not or_conditions:
        return {"duplicates": [], "total": 0}
    
    query = {"$or": or_conditions}
    
    if check_request.exclude_contact_id:
        query["id"] = {"$ne": check_request.exclude_contact_id}
    
    contacts = await db.contacts.find(query, {"_id": 0}).limit(10).to_list(10)
    
    for contact in contacts:
        score = 0
        reasons = []
        
        if check_request.phone and contact.get("phone") == check_request.phone:
            score += 100
            reasons.append({"field": "phone", "type": "exact", "score": 100})
        
        if check_request.phone:
            normalized = normalize_phone(check_request.phone)
            if contact.get("phone_normalized") == normalized and contact.get("phone") != check_request.phone:
                score += 95
                reasons.append({"field": "phone", "type": "normalized", "score": 95})
        
        if check_request.zalo_phone and contact.get("zalo_phone") == check_request.zalo_phone:
            score += 85
            reasons.append({"field": "zalo_phone", "type": "exact", "score": 85})
        
        if check_request.facebook_id and contact.get("facebook_id") == check_request.facebook_id:
            score += 90
            reasons.append({"field": "facebook_id", "type": "exact", "score": 90})
        
        if check_request.email and contact.get("email", "").lower() == check_request.email.lower():
            score += 75
            reasons.append({"field": "email", "type": "exact", "score": 75})
        
        if score > 0:
            duplicates.append({
                "contact_id": contact["id"],
                "full_name": contact.get("full_name", ""),
                "phone": contact.get("phone", ""),
                "phone_masked": mask_phone(contact.get("phone", "")),
                "email": contact.get("email"),
                "status": contact.get("status", ""),
                "match_score": min(score, 100),
                "match_reasons": reasons
            })
    
    duplicates.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {"duplicates": duplicates, "total": len(duplicates)}


@router.get("/duplicates")
async def get_duplicate_candidates(status: str = "pending", skip: int = 0, limit: int = 50, current_user: dict = None):
    db = get_db()
    query = {"status": status}
    
    candidates = await db.duplicate_candidates.find(query, {"_id": 0}).sort("detected_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return candidates


@router.post("/duplicates/merge")
async def merge_contacts(merge_request: MergeContactsRequest, current_user: dict = None):
    db = get_db()
    
    primary = await db.contacts.find_one({"id": merge_request.primary_contact_id}, {"_id": 0})
    if not primary:
        raise HTTPException(status_code=400, detail="Primary contact not found")
    
    duplicates = []
    for dup_id in merge_request.duplicate_contact_ids:
        dup = await db.contacts.find_one({"id": dup_id}, {"_id": 0})
        if dup:
            duplicates.append(dup)
    
    if not duplicates:
        raise HTTPException(status_code=400, detail="No valid duplicates found")
    
    now = datetime.now(timezone.utc).isoformat()
    merged_ids = [d["id"] for d in duplicates]
    
    await db.contacts.update_one(
        {"id": merge_request.primary_contact_id},
        {"$addToSet": {"merged_contact_ids": {"$each": merged_ids}}, "$set": {"updated_at": now}}
    )
    
    if merge_request.merge_leads:
        await db.leads.update_many(
            {"contact_id": {"$in": merged_ids}},
            {"$set": {"contact_id": merge_request.primary_contact_id, "updated_at": now}}
        )
    
    if merge_request.merge_deals:
        await db.deals.update_many(
            {"contact_id": {"$in": merged_ids}},
            {"$set": {"contact_id": merge_request.primary_contact_id, "updated_at": now}}
        )
    
    if merge_request.merge_interactions:
        await db.crm_interactions.update_many(
            {"contact_id": {"$in": merged_ids}},
            {"$set": {"contact_id": merge_request.primary_contact_id}}
        )
    
    if merge_request.merge_tags:
        all_tags = set(primary.get("tags", []))
        for dup in duplicates:
            all_tags.update(dup.get("tags", []))
        await db.contacts.update_one(
            {"id": merge_request.primary_contact_id},
            {"$set": {"tags": list(all_tags)}}
        )
    
    await db.contacts.update_many(
        {"id": {"$in": merged_ids}},
        {"$set": {"is_primary": False, "merged_into": merge_request.primary_contact_id, "merged_at": now, "updated_at": now}}
    )
    
    await log_crm_interaction(
        merge_request.primary_contact_id, "duplicate_merge", "Contacts merged",
        f"Merged {len(duplicates)} duplicate contacts",
        current_user["id"] if current_user else "system",
        is_auto=False
    )
    
    return {"success": True, "primary_contact_id": merge_request.primary_contact_id, "merged_count": len(duplicates), "merged_contact_ids": merged_ids}


# ============================================
# ASSIGNMENT HISTORY ROUTES
# ============================================

@router.get("/assignment-history")
async def get_assignment_history(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = None
):
    db = get_db()
    query: Dict[str, Any] = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if user_id:
        query["$or"] = [{"from_user_id": user_id}, {"to_user_id": user_id}]
    
    history = await db.assignment_history.find(query, {"_id": 0}).sort("assigned_at", -1).skip(skip).limit(limit).to_list(limit)
    
    user_ids = set()
    for h in history:
        if h.get("from_user_id"):
            user_ids.add(h["from_user_id"])
        if h.get("to_user_id"):
            user_ids.add(h["to_user_id"])
        if h.get("assigned_by"):
            user_ids.add(h["assigned_by"])
    
    users = {}
    if user_ids:
        user_docs = await db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0}).to_list(len(user_ids))
        users = {u["id"]: u.get("full_name", "") for u in user_docs}
    
    result = []
    for h in history:
        result.append({
            **h,
            "from_user_name": users.get(h.get("from_user_id")),
            "to_user_name": users.get(h.get("to_user_id"), ""),
            "assigned_by_name": users.get(h.get("assigned_by"))
        })
    
    return {"items": result, "total": len(result)}


# ============================================
# CRM CONFIG ROUTES
# ============================================

@router.get("/config/lead-stages")
async def get_lead_stages_config(current_user: dict = None):
    return {"stages": LEAD_STAGES}


@router.get("/config/deal-stages")
async def get_deal_stages_config(current_user: dict = None):
    return {"stages": DEAL_STAGES}


@router.get("/config/contact-statuses")
async def get_contact_statuses_config(current_user: dict = None):
    return {"statuses": CONTACT_STATUSES}


@router.get("/config/interaction-types")
async def get_interaction_types_config(current_user: dict = None):
    return {"types": INTERACTION_TYPES, "outcomes": INTERACTION_OUTCOMES}
