"""
ProHouzing Commission Router
Prompt 11/20 - Commission Engine

API endpoints for:
- Commission policies
- Commission records
- Approval workflow
- Payout management
- Income dashboards
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import os
import jwt

from models.commission_models import (
    CommissionPolicyCreate, CommissionPolicyResponse,
    CommissionRecordResponse, CommissionAdjustment, CommissionRecordCreate,
    ApprovalRequest, CommissionApprovalResponse,
    PayoutBatchCreate, PayoutBatchResponse, PayoutRecordResponse, MarkPaidRequest,
    IncomeSummary, TeamIncomeSummary,
    CalculateCommissionRequest, CalculateCommissionResponse,
    CommissionRecordFilters
)

from services.commission_service import CommissionService

from config.commission_config import (
    get_all_triggers, get_all_split_types, get_all_statuses,
    CommissionStatus, ApprovalStatus, PayoutStatus
)

# Router
router = APIRouter(prefix="/api/commission", tags=["Commission"])

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Database reference
_db = None
_service: Optional[CommissionService] = None


def set_database(database):
    """Set database reference"""
    global _db, _service
    _db = database
    _service = CommissionService(database)


def get_service() -> CommissionService:
    """Get commission service"""
    if _service is None:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return _service


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await _db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/config/triggers")
async def get_triggers():
    """Get available commission triggers"""
    return get_all_triggers()


@router.get("/config/split-types")
async def get_split_types():
    """Get available split types"""
    return get_all_split_types()


@router.get("/config/statuses")
async def get_statuses():
    """Get commission status definitions"""
    return get_all_statuses()


# ═══════════════════════════════════════════════════════════════════════════════
# POLICY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/policies", response_model=CommissionPolicyResponse)
async def create_policy(
    data: CommissionPolicyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new commission policy"""
    service = get_service()
    return await service.create_policy(data, current_user["id"])


@router.get("/policies", response_model=List[CommissionPolicyResponse])
async def list_policies(
    status: Optional[str] = None,
    project_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """List commission policies"""
    service = get_service()
    return await service.list_policies(
        status=status,
        project_id=project_id,
        skip=skip,
        limit=limit
    )


@router.get("/policies/{policy_id}", response_model=CommissionPolicyResponse)
async def get_policy(
    policy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get policy by ID"""
    service = get_service()
    policy = await service.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.post("/policies/{policy_id}/activate")
async def activate_policy(
    policy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Activate a commission policy"""
    service = get_service()
    success = await service.activate_policy(policy_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Cannot activate policy")
    return {"success": True, "message": "Policy activated"}


@router.post("/policies/{policy_id}/deactivate")
async def deactivate_policy(
    policy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate a commission policy"""
    now = datetime.now(timezone.utc).isoformat()
    result = await _db.commission_policies.update_one(
        {"id": policy_id},
        {"$set": {"status": "inactive", "updated_at": now}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"success": True, "message": "Policy deactivated"}


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION RECORD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/records", response_model=List[CommissionRecordResponse])
async def list_records(
    status: Optional[str] = None,
    approval_status: Optional[str] = None,
    payout_status: Optional[str] = None,
    recipient_id: Optional[str] = None,
    project_id: Optional[str] = None,
    contract_id: Optional[str] = None,
    is_estimated: Optional[bool] = None,
    is_disputed: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """List commission records with filters"""
    service = get_service()
    filters = {
        "status": status,
        "approval_status": approval_status,
        "payout_status": payout_status,
        "recipient_id": recipient_id,
        "project_id": project_id,
        "contract_id": contract_id,
        "is_estimated": is_estimated,
        "is_disputed": is_disputed,
    }
    return await service.list_records(filters, skip, limit)


@router.get("/records/{record_id}", response_model=CommissionRecordResponse)
async def get_record(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get commission record by ID"""
    service = get_service()
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Commission record not found")
    return record


@router.get("/records/by-contract/{contract_id}", response_model=List[CommissionRecordResponse])
async def get_records_by_contract(
    contract_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get commission records for a contract"""
    service = get_service()
    return await service.list_records({"contract_id": contract_id}, 0, 100)


@router.post("/records/{record_id}/adjust", response_model=CommissionRecordResponse)
async def adjust_commission(
    record_id: str,
    adjustment: CommissionAdjustment,
    current_user: dict = Depends(get_current_user)
):
    """Adjust commission amount - BLOCKED if locked/approved"""
    service = get_service()
    try:
        record = await service.adjust_commission(record_id, adjustment, current_user["id"])
        if not record:
            raise HTTPException(status_code=404, detail="Commission record not found")
        return record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/records/{record_id}/dispute")
async def raise_dispute(
    record_id: str,
    reason: str = Query(..., description="Dispute reason"),
    current_user: dict = Depends(get_current_user)
):
    """Raise dispute on commission record"""
    now = datetime.now(timezone.utc).isoformat()
    result = await _db.commission_records.update_one(
        {"id": record_id},
        {"$set": {
            "is_disputed": True,
            "dispute_reason": reason,
            "dispute_raised_by": current_user["id"],
            "dispute_raised_at": now,
            "status": CommissionStatus.DISPUTED.value,
            "updated_at": now
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Commission record not found")
    return {"success": True, "message": "Dispute raised"}


@router.post("/records/{record_id}/resolve-dispute")
async def resolve_dispute(
    record_id: str,
    resolution: str = Query(..., description="Resolution notes"),
    current_user: dict = Depends(get_current_user)
):
    """Resolve dispute on commission record"""
    now = datetime.now(timezone.utc).isoformat()
    result = await _db.commission_records.update_one(
        {"id": record_id, "is_disputed": True},
        {"$set": {
            "is_disputed": False,
            "dispute_resolved_at": now,
            "status": CommissionStatus.PENDING.value,  # Back to pending for re-approval
            "updated_at": now
        },
        "$push": {
            "notes": f"Dispute resolved: {resolution}"
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Disputed record not found")
    return {"success": True, "message": "Dispute resolved"}


# ═══════════════════════════════════════════════════════════════════════════════
# CALCULATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/calculate", response_model=CalculateCommissionResponse)
async def calculate_commission(
    request: CalculateCommissionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Calculate commission for a contract (preview without creating records)"""
    service = get_service()
    
    # Get contract
    contract = await _db.contracts.find_one({"id": request.contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Find policy
    policy = None
    if request.policy_id:
        policy = await _db.commission_policies.find_one({"id": request.policy_id}, {"_id": 0})
    else:
        policy = await service.find_matching_policy(
            project_id=contract.get("project_id"),
            event_date=datetime.now(timezone.utc)
        )
    
    if not policy:
        raise HTTPException(status_code=404, detail="No matching policy found")
    
    # Calculate
    base_amount = contract.get("grand_total") or contract.get("contract_value", 0)
    brokerage_rate = policy.get("brokerage_rate_value", 0)
    brokerage_amount = base_amount * brokerage_rate / 100
    
    splits = []
    total_commission = 0
    
    for rule in policy.get("split_rules", []):
        split_percent = rule.get("calc_value", 0)
        split_amount = brokerage_amount * split_percent / 100
        
        splits.append({
            "split_type": rule.get("split_type"),
            "recipient_role": rule.get("recipient_role"),
            "split_percent": split_percent,
            "split_amount": split_amount
        })
        total_commission += split_amount
    
    return CalculateCommissionResponse(
        contract_id=request.contract_id,
        contract_code=contract.get("contract_code", ""),
        contract_value=base_amount,
        policy_id=policy["id"],
        policy_name=policy.get("name", ""),
        brokerage_rate=brokerage_rate,
        brokerage_amount=brokerage_amount,
        splits=splits,
        total_commission=total_commission
    )


@router.post("/calculate-and-create")
async def calculate_and_create_commission(
    request: CalculateCommissionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Calculate and create commission records for a contract.
    NOTE: This is idempotent - won't create duplicates if already processed.
    If auto-triggered commission exists, returns existing records.
    """
    service = get_service()
    
    # Check if commission already exists for this contract (from auto-trigger)
    existing = await _db.commission_records.find_one({
        "contract_id": request.contract_id,
        "event_type": request.trigger_event
    })
    
    if existing:
        # Return existing records instead of creating new ones
        existing_records = await _db.commission_records.find({
            "contract_id": request.contract_id,
            "event_type": request.trigger_event
        }, {"_id": 0}).to_list(100)
        
        return {
            "success": True,
            "records_created": 0,
            "message": "Commission đã được tính trước đó (auto-trigger hoặc manual)",
            "existing_records": len(existing_records),
            "record_ids": [r["id"] for r in existing_records]
        }
    
    records, errors = await service.calculate_commission(
        contract_id=request.contract_id,
        trigger_event=request.trigger_event,
        policy_id=request.policy_id,
        triggered_by=current_user["id"]
    )
    
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    
    return {
        "success": True,
        "records_created": len(records),
        "record_ids": [r["id"] for r in records]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/approvals/pending")
async def get_pending_approvals(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get pending approvals for current user's role"""
    service = get_service()
    user_role = current_user.get("role", "sales")
    return await service.get_pending_approvals(user_role, skip, limit)


@router.post("/records/{record_id}/submit-for-approval")
async def submit_for_approval(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit commission record for approval"""
    service = get_service()
    success = await service.submit_for_approval(record_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Cannot submit for approval")
    return {"success": True, "message": "Submitted for approval"}


@router.post("/records/{record_id}/approve")
async def approve_commission(
    record_id: str,
    comments: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Approve commission at current step"""
    service = get_service()
    user_role = current_user.get("role", "sales")
    
    success = await service.approve_commission(
        record_id=record_id,
        reviewer_id=current_user["id"],
        reviewer_role=user_role,
        comments=comments
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Cannot approve - insufficient permission or invalid state")
    
    return {"success": True, "message": "Commission approved"}


@router.post("/records/{record_id}/reject")
async def reject_commission(
    record_id: str,
    reason: str = Query(..., description="Rejection reason"),
    current_user: dict = Depends(get_current_user)
):
    """Reject commission"""
    service = get_service()
    user_role = current_user.get("role", "sales")
    
    success = await service.reject_commission(
        record_id=record_id,
        reviewer_id=current_user["id"],
        reviewer_role=user_role,
        reason=reason
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Cannot reject")
    
    return {"success": True, "message": "Commission rejected"}


@router.get("/approvals/history/{record_id}", response_model=List[CommissionApprovalResponse])
async def get_approval_history(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get approval history for a commission record"""
    approvals = await _db.commission_approvals.find(
        {"commission_record_id": record_id},
        {"_id": 0}
    ).sort("step_number", 1).to_list(10)
    
    return [CommissionApprovalResponse(**a) for a in approvals]


# ═══════════════════════════════════════════════════════════════════════════════
# PAYOUT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/payouts/batches", response_model=PayoutBatchResponse)
async def create_payout_batch(
    data: PayoutBatchCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create payout batch"""
    service = get_service()
    return await service.create_payout_batch(data, current_user["id"])


@router.get("/payouts/batches", response_model=List[PayoutBatchResponse])
async def list_payout_batches(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """List payout batches"""
    query = {}
    if status:
        query["status"] = status
    
    batches = await _db.payout_batches.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [PayoutBatchResponse(**b) for b in batches]


@router.get("/payouts/batches/{batch_id}", response_model=PayoutBatchResponse)
async def get_payout_batch(
    batch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get payout batch by ID"""
    batch = await _db.payout_batches.find_one({"id": batch_id}, {"_id": 0})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return PayoutBatchResponse(**batch)


@router.get("/payouts/batches/{batch_id}/records", response_model=List[PayoutRecordResponse])
async def get_batch_records(
    batch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get payout records in a batch"""
    records = await _db.payout_records.find(
        {"batch_id": batch_id}, {"_id": 0}
    ).to_list(1000)
    return [PayoutRecordResponse(**r) for r in records]


@router.post("/payouts/batches/{batch_id}/approve")
async def approve_payout_batch(
    batch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve payout batch"""
    now = datetime.now(timezone.utc).isoformat()
    result = await _db.payout_batches.update_one(
        {"id": batch_id, "status": "draft"},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "approved_at": now
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Cannot approve batch")
    return {"success": True, "message": "Batch approved"}


@router.post("/payouts/{payout_id}/mark-paid")
async def mark_payout_paid(
    payout_id: str,
    data: MarkPaidRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mark individual payout as paid"""
    service = get_service()
    success = await service.mark_payout_paid(
        payout_id=payout_id,
        payment_ref=data.payment_reference,
        confirmed_by=current_user["id"]
    )
    if not success:
        raise HTTPException(status_code=404, detail="Payout record not found")
    return {"success": True, "message": "Payout marked as paid"}


@router.get("/payouts/ready-for-payout")
async def get_ready_for_payout(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get commission records ready for payout"""
    records = await _db.commission_records.find(
        {"payout_status": PayoutStatus.READY.value},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    service = get_service()
    return [await service._enrich_record(r) for r in records]


# ═══════════════════════════════════════════════════════════════════════════════
# INCOME DASHBOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/my-income", response_model=IncomeSummary)
async def get_my_income(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get income summary for current user"""
    service = get_service()
    return await service.get_my_income(
        user_id=current_user["id"],
        period_year=year,
        period_month=month
    )


@router.get("/my-income/with-kpi")
async def get_my_income_with_kpi(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get income summary with KPI bonus details for current user"""
    from services.kpi_service import KPIService
    
    now = datetime.now(timezone.utc)
    if not year:
        year = now.year
    if not month:
        month = now.month
    
    service = get_service()
    kpi_service = KPIService(_db)
    
    # Get basic income
    income = await service.get_my_income(
        user_id=current_user["id"],
        period_year=year,
        period_month=month
    )
    
    # Get KPI bonus info
    bonus_result = await kpi_service.calculate_bonus_modifier(
        current_user["id"],
        "monthly",
        year,
        month
    )
    
    # Get KPI scorecard summary
    scorecard = await kpi_service.get_personal_scorecard(
        current_user["id"],
        "monthly",
        year,
        month
    )
    
    # Calculate bonus applied amounts
    start_date = f"{year}-{month:02d}-01T00:00:00"
    end_date = f"{year + 1}-01-01T00:00:00" if month == 12 else f"{year}-{month + 1:02d}-01T00:00:00"
    
    # Get commission records with KPI bonus
    bonus_applied_records = await _db.commission_records.find({
        "recipient_id": current_user["id"],
        "created_at": {"$gte": start_date, "$lt": end_date},
        "kpi_bonus_modifier": {"$exists": True, "$ne": 1.0}
    }, {"_id": 0, "commission_amount": 1, "final_amount": 1, "kpi_bonus_modifier": 1, "kpi_bonus_tier": 1}).to_list(1000)
    
    total_bonus_earned = sum(r.get("final_amount", 0) - r.get("commission_amount", 0) for r in bonus_applied_records)
    
    return {
        "income": income.dict() if hasattr(income, 'dict') else income,
        "kpi": {
            "overall_achievement": scorecard.summary.overall_score,
            "kpis_exceeding": scorecard.summary.kpis_exceeding,
            "kpis_on_track": scorecard.summary.kpis_on_track,
            "kpis_at_risk": scorecard.summary.kpis_at_risk,
            "kpis_behind": scorecard.summary.kpis_behind,
            "bonus_modifier": bonus_result.bonus_modifier,
            "bonus_tier": bonus_result.bonus_tier_label,
            "total_bonus_earned": total_bonus_earned,
            "records_with_bonus": len(bonus_applied_records),
        },
        "summary": {
            "base_commission": bonus_result.original_commission_total,
            "kpi_bonus_amount": bonus_result.bonus_amount,
            "final_commission": bonus_result.adjusted_commission_total,
            "message": f"KPI đạt {scorecard.summary.overall_score:.0f}% → Hệ số thưởng x{bonus_result.bonus_modifier:.2f}"
        }
    }


@router.get("/my-income/records", response_model=List[CommissionRecordResponse])
async def get_my_income_records(
    status: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get income records for current user"""
    service = get_service()
    filters = {
        "recipient_id": current_user["id"],
        "status": status
    }
    return await service.list_records(filters, skip, limit)


@router.get("/team-income", response_model=TeamIncomeSummary)
async def get_team_income(
    team_id: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get team income summary for manager"""
    service = get_service()
    return await service.get_team_income(
        team_id=team_id,
        manager_id=current_user["id"],
        period_year=year,
        period_month=month
    )


@router.get("/company-income")
async def get_company_income(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get company-wide income summary (admin)"""
    now = datetime.now(timezone.utc)
    if not year:
        year = now.year
    if not month:
        month = now.month
    
    start_date = f"{year}-{month:02d}-01T00:00:00"
    if month == 12:
        end_date = f"{year + 1}-01-01T00:00:00"
    else:
        end_date = f"{year}-{month + 1:02d}-01T00:00:00"
    
    # Aggregate totals
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date, "$lt": end_date}
            }
        },
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "amount": {"$sum": "$final_amount"}
            }
        }
    ]
    
    results = await _db.commission_records.aggregate(pipeline).to_list(20)
    
    summary = {
        "period_year": year,
        "period_month": month,
        "period_label": f"Tháng {month}/{year}",
        "by_status": {}
    }
    
    total = 0
    for r in results:
        summary["by_status"][r["_id"]] = {
            "count": r["count"],
            "amount": r["amount"]
        }
        total += r["amount"]
    
    summary["total_amount"] = total
    
    # By project
    project_pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date, "$lt": end_date}
            }
        },
        {
            "$group": {
                "_id": "$project_id",
                "count": {"$sum": 1},
                "amount": {"$sum": "$final_amount"}
            }
        },
        {"$sort": {"amount": -1}},
        {"$limit": 10}
    ]
    
    project_results = await _db.commission_records.aggregate(project_pipeline).to_list(10)
    
    # Resolve project names
    for pr in project_results:
        if pr["_id"]:
            project = await _db.projects_master.find_one({"id": pr["_id"]}, {"_id": 0, "name": 1})
            pr["project_name"] = project.get("name", "") if project else ""
    
    summary["by_project"] = project_results
    
    return summary


# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats/overview")
async def get_commission_overview(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get commission statistics overview"""
    now = datetime.now(timezone.utc)
    if not year:
        year = now.year
    if not month:
        month = now.month
    
    start_date = f"{year}-{month:02d}-01T00:00:00"
    if month == 12:
        end_date = f"{year + 1}-01-01T00:00:00"
    else:
        end_date = f"{year}-{month + 1:02d}-01T00:00:00"
    
    # Count records by status
    status_counts = await _db.commission_records.aggregate([
        {"$match": {"created_at": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "amount": {"$sum": "$final_amount"}}}
    ]).to_list(20)
    
    # Pending approvals
    pending_approvals = await _db.commission_records.count_documents({
        "approval_status": ApprovalStatus.PENDING.value
    })
    
    # Ready for payout
    ready_payout = await _db.commission_records.count_documents({
        "payout_status": PayoutStatus.READY.value
    })
    
    # Disputed
    disputed = await _db.commission_records.count_documents({
        "is_disputed": True
    })
    
    return {
        "period": {"year": year, "month": month},
        "by_status": {s["_id"]: {"count": s["count"], "amount": s["amount"]} for s in status_counts},
        "pending_approvals": pending_approvals,
        "ready_for_payout": ready_payout,
        "disputed_count": disputed
    }



# ═══════════════════════════════════════════════════════════════════════════════
# FINANCIAL-GRADE: Re-calculation Control (Principle 3)
# ═══════════════════════════════════════════════════════════════════════════════

class RecalculationRequest(BaseModel):
    """Request to recalculate commission - requires explicit admin action"""
    reason: str
    use_current_kpi: bool = False  # If True, use current KPI. If False, keep original snapshot
    admin_override: bool = False   # Must be True to proceed


@router.post("/{record_id}/admin-recalculate")
async def admin_recalculate_commission(
    record_id: str,
    request: RecalculationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    FINANCIAL-GRADE: Admin-only commission recalculation with full audit log.
    
    Principle 3 Requirements:
    - Only explicit admin action can trigger recalculation
    - Full audit log is recorded
    - Original values are preserved in history
    - Requires admin_override = True
    """
    # Verify admin role
    if current_user.get("role") not in ["admin", "bod", "cfo"]:
        raise HTTPException(
            status_code=403, 
            detail="Only admin/bod/cfo can recalculate approved commissions"
        )
    
    # Verify admin override
    if not request.admin_override:
        raise HTTPException(
            status_code=400,
            detail="admin_override must be True to proceed with recalculation"
        )
    
    # Get record
    record = await _db.commission_records.find_one({"id": record_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Commission record not found")
    
    # Check if record is locked
    if not record.get("is_recalculation_locked", False):
        raise HTTPException(
            status_code=400,
            detail="Record is not locked. Use normal update flow instead."
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Preserve original values for audit
    original_snapshot = {
        "kpi_score": record.get("kpi_score", 0),
        "kpi_bonus_modifier": record.get("kpi_bonus_modifier", 1.0),
        "kpi_bonus_tier": record.get("kpi_bonus_tier", ""),
        "kpi_bonus_rule_id": record.get("kpi_bonus_rule_id"),
        "kpi_bonus_rule_version": record.get("kpi_bonus_rule_version", 0),
        "kpi_snapshot": record.get("kpi_snapshot"),
        "commission_amount": record.get("commission_amount", 0),
        "final_amount": record.get("final_amount", 0),
        "captured_at": record.get("kpi_calculated_at"),
    }
    
    # Calculate new values
    new_kpi_score = original_snapshot["kpi_score"]
    new_kpi_modifier = original_snapshot["kpi_bonus_modifier"]
    new_kpi_tier = original_snapshot["kpi_bonus_tier"]
    new_kpi_snapshot = original_snapshot["kpi_snapshot"]
    new_rule_id = original_snapshot["kpi_bonus_rule_id"]
    new_rule_version = original_snapshot["kpi_bonus_rule_version"]
    
    if request.use_current_kpi:
        # Recalculate with CURRENT KPI values
        from services.kpi_service import KPIService
        kpi_service = KPIService(_db)
        
        recipient_id = record.get("recipient_id")
        if recipient_id and recipient_id != "company":
            period_now = datetime.now(timezone.utc)
            bonus_result = await kpi_service.calculate_bonus_modifier(
                recipient_id, "monthly", period_now.year, period_now.month
            )
            
            new_kpi_score = bonus_result.overall_achievement
            new_kpi_modifier = bonus_result.bonus_modifier
            new_kpi_tier = bonus_result.bonus_tier_label
            
            # Get current rule version
            active_rule = await _db.kpi_bonus_rules.find_one(
                {"is_active": True}, {"_id": 0, "id": 1, "version": 1}
            )
            if active_rule:
                new_rule_id = active_rule.get("id")
                new_rule_version = active_rule.get("version", 1)
            
            # Create new snapshot
            new_kpi_snapshot = {
                "user_id": recipient_id,
                "period_type": "monthly",
                "period_year": period_now.year,
                "period_month": period_now.month,
                "overall_score": new_kpi_score,
                "kpi_details": [kpi.dict() for kpi in bonus_result.kpi_details] if bonus_result.kpi_details else [],
                "bonus_modifier": new_kpi_modifier,
                "bonus_tier": new_kpi_tier,
                "rule_id": new_rule_id,
                "rule_version": new_rule_version,
                "calculated_at": now,
                "snapshot_type": "admin_recalculation"
            }
    
    # Calculate new final amount
    base_commission = record.get("commission_amount", 0)
    new_final_amount = base_commission * new_kpi_modifier
    
    # Create audit log entry
    recalc_entry = {
        "recalculated_at": now,
        "recalculated_by": current_user.get("id"),
        "recalculated_by_name": current_user.get("full_name", ""),
        "reason": request.reason,
        "use_current_kpi": request.use_current_kpi,
        "original_values": original_snapshot,
        "new_values": {
            "kpi_score": new_kpi_score,
            "kpi_bonus_modifier": new_kpi_modifier,
            "kpi_bonus_tier": new_kpi_tier,
            "final_amount": new_final_amount,
        },
        "difference": {
            "kpi_modifier_change": new_kpi_modifier - original_snapshot["kpi_bonus_modifier"],
            "amount_change": new_final_amount - original_snapshot["final_amount"]
        }
    }
    
    # Get existing history
    existing_history = record.get("recalculation_history") or []
    existing_history.append(recalc_entry)
    
    # Update record
    await _db.commission_records.update_one(
        {"id": record_id},
        {"$set": {
            "kpi_score": new_kpi_score,
            "kpi_bonus_modifier": new_kpi_modifier,
            "kpi_bonus_tier": new_kpi_tier,
            "kpi_bonus_rule_id": new_rule_id,
            "kpi_bonus_rule_version": new_rule_version,
            "kpi_snapshot": new_kpi_snapshot,
            "kpi_calculated_at": now,
            "final_amount": new_final_amount,
            "recalculation_history": existing_history,
            "last_recalculated_at": now,
            "last_recalculated_by": current_user.get("id"),
            "recalculation_reason": request.reason,
            "updated_at": now
        }}
    )
    
    return {
        "success": True,
        "record_id": record_id,
        "message": "Commission recalculated successfully",
        "audit_entry": recalc_entry,
        "warning": "This action has been logged for financial audit purposes"
    }


@router.get("/{record_id}/recalculation-history")
async def get_recalculation_history(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get full recalculation audit history for a commission record"""
    record = await _db.commission_records.find_one(
        {"id": record_id},
        {"_id": 0, "id": 1, "code": 1, "recalculation_history": 1, 
         "kpi_snapshot": 1, "is_recalculation_locked": 1}
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="Commission record not found")
    
    return {
        "record_id": record.get("id"),
        "record_code": record.get("code"),
        "is_recalculation_locked": record.get("is_recalculation_locked", False),
        "current_snapshot": record.get("kpi_snapshot"),
        "recalculation_count": len(record.get("recalculation_history") or []),
        "history": record.get("recalculation_history") or []
    }
