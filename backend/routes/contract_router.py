"""
ProHouzing Contract Router
Prompt 9/20 - Contract & Document Workflow

API Endpoints for:
- Contract CRUD
- Status transitions
- Approval workflow
- Payment recording
- Amendments
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import logging

from models.contract_models import (
    ContractCreate, ContractUpdate, ContractResponse,
    AmendmentCreate, AmendmentResponse,
    ApproveRequest, RejectRequest, ApprovalLogResponse,
    RecordPaymentRequest, PaymentHistoryResponse,
    StatusTransitionRequest, SignContractRequest,
    ContractPipelineSummary, ContractListFilters,
    PaymentInstallment, ChecklistItem, FieldChange,
    ContractAuditLogResponse
)
from config.contract_config import (
    ContractType, ContractStatus, AmendmentType,
    PaymentStatus, ApprovalStatus, ReviewStatus, SigningStatus,
    CONTRACT_TYPE_CONFIG, CONTRACT_STATUS_CONFIG, AMENDMENT_TYPE_CONFIG,
    APPROVAL_WORKFLOWS, PAYMENT_CONFIG, STAGE_PAYMENT_REQUIREMENTS,
    generate_contract_code, generate_amendment_code,
    can_transition_to, is_contract_locked, can_edit_field,
    can_create_amendment_at_status, can_record_payment_at_status,
    get_approval_workflow
)
from config.document_config import DEFAULT_CHECKLISTS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contracts", tags=["contracts"])

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


async def get_current_user_internal():
    """Get current user - returns None for now (authentication optional)"""
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def get_next_contract_sequence(db, project_id: str, year: int) -> int:
    """Get next contract sequence number for a project/year"""
    counter_id = f"contract_{project_id}_{year}"
    result = await db.counters.find_one_and_update(
        {"_id": counter_id},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result.get("seq", 1)


async def get_next_amendment_number(db, parent_contract_id: str) -> int:
    """Get next amendment number for a contract"""
    count = await db.amendments.count_documents({"parent_contract_id": parent_contract_id})
    return count + 1


def calculate_contract_values(data: dict) -> dict:
    """Calculate contract financial values"""
    unit_price = data.get("unit_price", 0)
    unit_area = data.get("unit_area", 0)
    price_per_sqm = data.get("price_per_sqm", 0)
    
    # Calculate contract value
    if unit_price > 0:
        contract_value = unit_price
    elif price_per_sqm > 0 and unit_area > 0:
        contract_value = price_per_sqm * unit_area
    else:
        contract_value = 0
    
    # Add premium adjustments
    contract_value += data.get("premium_adjustments", 0)
    
    # Apply discount
    discount_amount = data.get("discount_amount", 0)
    discount_percent = data.get("discount_percent", 0)
    
    if discount_percent > 0 and discount_amount == 0:
        discount_amount = contract_value * discount_percent / 100
    
    contract_value_after_discount = contract_value - discount_amount
    
    # Calculate VAT
    vat_percent = data.get("vat_percent", 10)
    vat_amount = contract_value_after_discount * vat_percent / 100
    total_with_vat = contract_value_after_discount + vat_amount
    
    # Add fees
    maintenance_fee = data.get("maintenance_fee", 0)
    other_fees = data.get("other_fees", 0)
    grand_total = total_with_vat + maintenance_fee + other_fees
    
    return {
        "contract_value": contract_value_after_discount,
        "discount_amount": discount_amount,
        "vat_amount": vat_amount,
        "total_with_vat": total_with_vat,
        "grand_total": grand_total,
    }


def calculate_payment_summary(payment_schedule: List[dict]) -> dict:
    """Calculate payment summary from schedule"""
    total_paid = sum(p.get("paid_amount", 0) for p in payment_schedule)
    total_amount = sum(p.get("amount", 0) for p in payment_schedule)
    remaining = total_amount - total_paid
    
    overdue_amount = 0
    overdue_count = 0
    next_due_date = None
    next_due_amount = 0
    
    for p in payment_schedule:
        if p.get("status") == PaymentStatus.OVERDUE.value:
            overdue_amount += p.get("amount", 0) - p.get("paid_amount", 0)
            overdue_count += 1
        
        if p.get("status") in [PaymentStatus.PENDING.value, PaymentStatus.PARTIAL.value]:
            due_date = p.get("due_date")
            if due_date and not next_due_date:
                next_due_date = due_date
                next_due_amount = p.get("amount", 0) - p.get("paid_amount", 0)
    
    completion_percent = (total_paid / total_amount * 100) if total_amount > 0 else 0
    
    return {
        "total_paid": total_paid,
        "remaining_amount": remaining,
        "payment_completion_percent": round(completion_percent, 2),
        "overdue_amount": overdue_amount,
        "overdue_installments": overdue_count,
        "next_due_date": next_due_date,
        "next_due_amount": next_due_amount,
        "is_overdue": overdue_count > 0,
    }


async def resolve_contract_names(db, contract: dict) -> dict:
    """Resolve names for customer, product, project, owner"""
    resolved = {}
    
    # Customer
    if contract.get("customer_id"):
        customer = await db.contacts.find_one(
            {"id": contract["customer_id"]},
            {"_id": 0, "full_name": 1}
        )
        resolved["customer_name"] = customer.get("full_name", "") if customer else ""
    
    # Product
    if contract.get("product_id"):
        product = await db.products.find_one(
            {"id": contract["product_id"]},
            {"_id": 0, "code": 1, "name": 1}
        )
        if product:
            resolved["product_code"] = product.get("code", "")
            resolved["product_name"] = product.get("name", "")
    
    # Project
    if contract.get("project_id"):
        project = await db.projects_master.find_one(
            {"id": contract["project_id"]},
            {"_id": 0, "name": 1, "code": 1}
        )
        resolved["project_name"] = project.get("name", "") if project else ""
        resolved["project_code"] = project.get("code", "") if project else ""
    
    # Owner
    if contract.get("owner_id"):
        owner = await db.users.find_one(
            {"id": contract["owner_id"]},
            {"_id": 0, "full_name": 1}
        )
        resolved["owner_name"] = owner.get("full_name", "") if owner else ""
    
    # Created by
    if contract.get("created_by"):
        creator = await db.users.find_one(
            {"id": contract["created_by"]},
            {"_id": 0, "full_name": 1}
        )
        resolved["created_by_name"] = creator.get("full_name", "") if creator else ""
    
    return resolved


async def create_audit_log(
    db,
    entity_type: str,
    entity_id: str,
    action: str,
    actor_id: str,
    changes: dict = None,
    reason: str = None,
    metadata: dict = None
):
    """Create audit log entry"""
    log = {
        "id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "actor_id": actor_id,
        "changes": changes or {},
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {},
    }
    await db.contract_audit_logs.insert_one(log)
    return log


async def sync_contract_to_deal(db, contract: dict):
    """Sync contract changes to deal"""
    if not contract.get("deal_id"):
        return
    
    # Status to stage mapping
    status_to_stage = {
        ContractStatus.PENDING_SIGNATURE.value: "contracting",
        ContractStatus.SIGNED.value: "depositing",
        ContractStatus.ACTIVE.value: "payment_progress",
        ContractStatus.COMPLETED.value: "completed",
        ContractStatus.TERMINATED.value: "lost",
        ContractStatus.CANCELLED.value: "lost",
    }
    
    updates = {
        "contract_id": contract["id"],
        "contract_status": contract["status"],
        "payment_completion_percent": contract.get("payment_completion_percent", 0),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    new_stage = status_to_stage.get(contract["status"])
    if new_stage:
        updates["stage"] = new_stage
    
    await db.deals.update_one(
        {"id": contract["deal_id"]},
        {"$set": updates}
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT CRUD
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=ContractResponse)
async def create_contract(request: ContractCreate):
    """Create new contract"""
    db = get_db()
    current_user = await get_current_user_internal()
    
    now = datetime.now(timezone.utc)
    
    # Get project code for contract numbering
    project = await db.projects_master.find_one(
        {"id": request.project_id},
        {"_id": 0, "code": 1, "name": 1}
    )
    if not project:
        raise HTTPException(status_code=400, detail="Dự án không tồn tại")
    
    project_code = project.get("code", "PRJ")
    
    # Generate contract code
    year = now.year
    sequence = await get_next_contract_sequence(db, request.project_id, year)
    contract_type = ContractType(request.contract_type)
    contract_code = generate_contract_code(project_code, contract_type, sequence, year)
    
    # Calculate financial values
    financial = calculate_contract_values(request.model_dump())
    
    # Get default checklist
    checklist = []
    for item in DEFAULT_CHECKLISTS.get(request.contract_type, []):
        checklist.append({
            **item,
            "document_id": None,
            "status": "pending",
            "verified_by": None,
            "verified_at": None,
            "notes": None,
        })
    
    # Build contract document
    contract = {
        "id": str(uuid.uuid4()),
        "contract_code": contract_code,
        "contract_type": request.contract_type,
        "tenant_id": request.tenant_id or "default",
        
        # Relationships
        "deal_id": request.deal_id,
        "booking_id": request.booking_id,
        "customer_id": request.customer_id,
        "co_owners": request.co_owners,
        "product_id": request.product_id,
        "project_id": request.project_id,
        
        # Parent-child
        "parent_contract_id": None,
        "is_amendment": False,
        "amendment_number": 0,
        "active_amendments": [],
        
        # Status
        "status": ContractStatus.DRAFT.value,
        "status_changed_at": now.isoformat(),
        "status_changed_by": current_user["id"] if current_user else None,
        "status_history": [],
        "is_locked": False,
        
        # Financial (from request)
        "unit_price": request.unit_price,
        "unit_area": request.unit_area,
        "price_per_sqm": request.price_per_sqm,
        "premium_adjustments": request.premium_adjustments,
        "discount_amount": financial["discount_amount"],
        "discount_percent": request.discount_percent,
        "discount_reason": request.discount_reason,
        "vat_percent": request.vat_percent,
        "maintenance_fee": request.maintenance_fee,
        "other_fees": request.other_fees,
        
        # Financial (calculated)
        "contract_value": financial["contract_value"],
        "vat_amount": financial["vat_amount"],
        "total_with_vat": financial["total_with_vat"],
        "grand_total": financial["grand_total"],
        
        # Deposit
        "deposit_amount": request.deposit_amount,
        "deposit_paid": 0,
        "deposit_paid_date": None,
        "deposit_status": PaymentStatus.PENDING.value,
        "deposit_due_date": request.deposit_due_date,
        "deposit_receipt_id": None,
        
        # Payment schedule (will be set from payment plan)
        "payment_plan_id": request.payment_plan_id,
        "payment_plan_name": "",
        "payment_schedule": [],
        
        # Payment summary
        "total_paid": 0,
        "remaining_amount": financial["grand_total"],
        "payment_completion_percent": 0,
        "overdue_amount": 0,
        "overdue_installments": 0,
        "next_due_date": None,
        "next_due_amount": 0,
        
        # Dates
        "contract_date": request.contract_date or now.isoformat(),
        "effective_date": request.effective_date,
        "expiry_date": request.expiry_date,
        "signing_deadline": request.signing_deadline,
        "expected_handover_date": request.expected_handover_date,
        "actual_handover_date": None,
        
        # Creator & Ownership
        "created_by": current_user["id"] if current_user else None,
        "created_at": now.isoformat(),
        "owner_id": request.owner_id or (current_user["id"] if current_user else None),
        "branch_id": request.branch_id,
        
        # Approval
        "approval_workflow_id": get_approval_workflow(contract_type).get("id"),
        "current_approval_step": 0,
        "approval_status": ApprovalStatus.NOT_STARTED.value,
        "sales_review_status": ReviewStatus.PENDING.value,
        "sales_reviewed_by": None,
        "sales_reviewed_at": None,
        "sales_review_notes": None,
        "legal_review_status": ReviewStatus.PENDING.value,
        "legal_reviewed_by": None,
        "legal_reviewed_at": None,
        "legal_review_notes": None,
        "finance_review_required": request.discount_percent > 5,
        "finance_review_status": ReviewStatus.PENDING.value,
        "finance_reviewed_by": None,
        "finance_reviewed_at": None,
        "finance_review_notes": None,
        "final_approved_by": None,
        "final_approved_at": None,
        
        # Signing
        "signing_status": SigningStatus.PENDING.value,
        "signed_by_customer_id": None,
        "signed_by_customer_name": "",
        "customer_signed_at": None,
        "signed_by_company_id": None,
        "signed_by_company_name": "",
        "signed_by_company_title": "",
        "company_signed_at": None,
        "signing_location": None,
        "witnesses": [],
        "notarized": False,
        "notarization_date": None,
        "notarization_ref": None,
        
        # Documents
        "document_ids": [],
        "required_checklist": checklist,
        "checklist_complete": False,
        "checklist_verified": False,
        "missing_documents": [item["item_code"] for item in checklist if item.get("is_required")],
        
        # Version
        "version": 1,
        "last_modified_by": current_user["id"] if current_user else None,
        "last_modified_at": now.isoformat(),
        "last_modification_reason": None,
        
        # Notes
        "notes": request.notes,
        "internal_notes": request.internal_notes,
        "tags": request.tags,
        "priority": request.priority,
        
        # Health
        "health_score": 100,
        "is_overdue": False,
        "days_until_expiry": None,
        "days_overdue": 0,
        "risk_level": "low",
        "risk_factors": [],
    }
    
    # If payment plan selected, build schedule
    if request.payment_plan_id:
        plan = await db.payment_plans.find_one({"id": request.payment_plan_id}, {"_id": 0})
        if plan:
            contract["payment_plan_name"] = plan.get("name", "")
            # Build schedule from plan milestones
            schedule = []
            for i, milestone in enumerate(plan.get("milestones", []), 1):
                schedule.append({
                    "installment_number": i,
                    "installment_name": milestone.get("name", f"Đợt {i}"),
                    "percent_of_total": milestone.get("percent", 0),
                    "amount": financial["grand_total"] * milestone.get("percent", 0) / 100,
                    "due_date": None,  # Will be set based on contract date
                    "due_description": milestone.get("description", ""),
                    "paid_amount": 0,
                    "paid_date": None,
                    "payment_method": None,
                    "payment_reference": None,
                    "receipt_document_id": None,
                    "status": PaymentStatus.PENDING.value,
                    "overdue_days": 0,
                    "penalty_rate": PAYMENT_CONFIG["default_penalty_rate"],
                    "penalty_amount": 0,
                    "penalty_waived": False,
                    "penalty_waiver_reason": None,
                    "penalty_waiver_by": None,
                    "notes": None,
                })
            contract["payment_schedule"] = schedule
    
    # Insert contract
    await db.contracts.insert_one(contract)
    
    # Create audit log
    await create_audit_log(
        db, "contract", contract["id"], "create",
        current_user["id"] if current_user else "system",
        metadata={"contract_code": contract_code}
    )
    
    # Resolve names
    names = await resolve_contract_names(db, contract)
    
    # Add labels
    type_config = CONTRACT_TYPE_CONFIG.get(contract_type, {})
    status_config = CONTRACT_STATUS_CONFIG.get(ContractStatus(contract["status"]), {})
    
    return ContractResponse(
        **{k: v for k, v in contract.items() if k != "_id"},
        **names,
        contract_type_label=type_config.get("label", ""),
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STATIC REFERENCE ENDPOINTS (must be before /{contract_id})
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/types", response_model=List[dict])
async def get_contract_types():
    """Get all contract types"""
    return [
        {
            "value": ct.value,
            "label": CONTRACT_TYPE_CONFIG.get(ct, {}).get("label", ct.value),
            "description": CONTRACT_TYPE_CONFIG.get(ct, {}).get("description", ""),
            "category": CONTRACT_TYPE_CONFIG.get(ct, {}).get("category", ""),
            "icon": CONTRACT_TYPE_CONFIG.get(ct, {}).get("icon", ""),
        }
        for ct in ContractType
    ]


@router.get("/status", response_model=List[dict])
async def get_contract_statuses():
    """Get all contract statuses"""
    return [
        {
            "value": cs.value,
            "label": CONTRACT_STATUS_CONFIG.get(cs, {}).get("label", cs.value),
            "color": CONTRACT_STATUS_CONFIG.get(cs, {}).get("color", ""),
            "description": CONTRACT_STATUS_CONFIG.get(cs, {}).get("description", ""),
            "can_edit": CONTRACT_STATUS_CONFIG.get(cs, {}).get("can_edit", False),
            "is_locked": cs.value in ["signed", "active", "completed", "cancelled"],
        }
        for cs in ContractStatus
    ]


@router.get("", response_model=List[ContractResponse])
async def list_contracts(
    status: Optional[str] = None,
    contract_type: Optional[str] = None,
    project_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    owner_id: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    """List contracts with filters"""
    db = get_db()
    
    # Build query
    query = {}
    
    if status:
        query["status"] = status
    if contract_type:
        query["contract_type"] = contract_type
    if project_id:
        query["project_id"] = project_id
    if customer_id:
        query["customer_id"] = customer_id
    if owner_id:
        query["owner_id"] = owner_id
    if is_overdue is not None:
        query["is_overdue"] = is_overdue
    if search:
        query["$or"] = [
            {"contract_code": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
        ]
    
    # Sort
    sort_dir = -1 if sort_order == "desc" else 1
    
    contracts = await db.contracts.find(
        query,
        {"_id": 0}
    ).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    # Resolve names and add labels
    results = []
    for contract in contracts:
        names = await resolve_contract_names(db, contract)
        
        # Safe enum handling for legacy data
        try:
            contract_type_enum = ContractType(contract.get("contract_type", "sale_contract"))
        except ValueError:
            contract_type_enum = ContractType.SALE_CONTRACT
        type_config = CONTRACT_TYPE_CONFIG.get(contract_type_enum, {})
        
        try:
            status_enum = ContractStatus(contract.get("status", "draft"))
        except ValueError:
            status_enum = ContractStatus.DRAFT
        status_config = CONTRACT_STATUS_CONFIG.get(status_enum, {})
        
        # Remove computed fields before spreading to avoid duplicates
        contract_data = {k: v for k, v in contract.items() 
                        if k not in ['contract_type_label', 'status_label', 'status_color', 
                                     'customer_name', 'product_code', 'product_name', 
                                     'project_name', 'owner_name']}
        
        results.append(ContractResponse(
            **contract_data,
            **names,
            contract_type_label=type_config.get("label", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
        ))
    
    return results


@router.get("/pipeline", response_model=ContractPipelineSummary)
async def get_contract_pipeline():
    """Get contract pipeline summary"""
    db = get_db()
    
    # Aggregate stats
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_contracts": {"$sum": 1},
                "total_value": {"$sum": "$grand_total"},
                "total_paid": {"$sum": "$total_paid"},
                "total_remaining": {"$sum": "$remaining_amount"},
                "overdue_contracts": {
                    "$sum": {"$cond": [{"$eq": ["$is_overdue", True]}, 1, 0]}
                },
                "overdue_amount": {"$sum": "$overdue_amount"},
            }
        }
    ]
    
    result = await db.contracts.aggregate(pipeline).to_list(1)
    summary = result[0] if result else {}
    
    # Count by status
    status_pipeline = [
        {"$match": {"status": {"$ne": None}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_result = await db.contracts.aggregate(status_pipeline).to_list(100)
    by_status = {str(s["_id"]): s["count"] for s in status_result if s["_id"]}
    
    # Count by type
    type_pipeline = [
        {"$match": {"contract_type": {"$ne": None}}},
        {"$group": {"_id": "$contract_type", "count": {"$sum": 1}}}
    ]
    type_result = await db.contracts.aggregate(type_pipeline).to_list(100)
    by_type = {str(t["_id"]): t["count"] for t in type_result if t["_id"]}
    
    # Count pending approval/signature
    pending_approval = await db.contracts.count_documents({"status": ContractStatus.PENDING_REVIEW.value})
    pending_signature = await db.contracts.count_documents({"status": ContractStatus.PENDING_SIGNATURE.value})
    
    # Expiring soon (30 days)
    thirty_days = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    expiring_soon = await db.contracts.count_documents({
        "status": ContractStatus.ACTIVE.value,
        "expiry_date": {"$lt": thirty_days, "$ne": None}
    })
    
    return ContractPipelineSummary(
        total_contracts=summary.get("total_contracts", 0),
        total_value=summary.get("total_value", 0),
        total_paid=summary.get("total_paid", 0),
        total_remaining=summary.get("total_remaining", 0),
        by_status=by_status,
        by_type=by_type,
        overdue_contracts=summary.get("overdue_contracts", 0),
        overdue_amount=summary.get("overdue_amount", 0),
        expiring_soon=expiring_soon,
        pending_approval=pending_approval,
        pending_signature=pending_signature,
    )


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str):
    """Get contract detail"""
    db = get_db()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    names = await resolve_contract_names(db, contract)
    
    try:
        contract_type = ContractType(contract.get("contract_type", "sale_contract"))
    except ValueError:
        contract_type = ContractType.SALE_CONTRACT
    type_config = CONTRACT_TYPE_CONFIG.get(contract_type, {})
    
    try:
        status = ContractStatus(contract.get("status", "draft"))
    except ValueError:
        status = ContractStatus.DRAFT
    status_config = CONTRACT_STATUS_CONFIG.get(status, {})
    
    # Remove computed fields before spreading to avoid duplicates
    contract_data = {k: v for k, v in contract.items() 
                    if k not in ['contract_type_label', 'status_label', 'status_color', 
                                 'customer_name', 'product_code', 'product_name', 
                                 'project_name', 'owner_name', 'document_count']}
    
    return ContractResponse(
        **contract_data,
        **names,
        contract_type_label=type_config.get("label", ""),
        status_label=status_config.get("label", ""),
        status_color=status_config.get("color", ""),
        document_count=len(contract.get("document_ids", [])),
    )


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(contract_id: str, request: ContractUpdate):
    """Update contract (with constraint checking)"""
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    status = ContractStatus(contract["status"])
    
    # Check if contract is locked
    if is_contract_locked(status):
        raise HTTPException(
            status_code=400,
            detail="Hợp đồng đã khóa. Vui lòng tạo Phụ lục để thay đổi."
        )
    
    # Build updates
    updates = {}
    changes = {}
    
    update_data = request.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "update_reason":
            continue
        
        # Check if field can be edited
        if not can_edit_field(status, field):
            raise HTTPException(
                status_code=400,
                detail=f"Không thể sửa trường '{field}' ở trạng thái {status.value}"
            )
        
        if contract.get(field) != value:
            changes[field] = {
                "old": contract.get(field),
                "new": value
            }
            updates[field] = value
    
    if not updates:
        return await get_contract(contract_id)
    
    # Recalculate financial values if needed
    financial_fields = ["unit_price", "unit_area", "price_per_sqm", "premium_adjustments",
                        "discount_amount", "discount_percent", "vat_percent",
                        "maintenance_fee", "other_fees"]
    
    if any(f in updates for f in financial_fields):
        merged = {**contract, **updates}
        financial = calculate_contract_values(merged)
        updates.update(financial)
    
    # Update metadata
    now = datetime.now(timezone.utc).isoformat()
    updates["last_modified_by"] = current_user["id"] if current_user else None
    updates["last_modified_at"] = now
    updates["last_modification_reason"] = request.update_reason
    updates["version"] = contract.get("version", 1) + 1
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": updates}
    )
    
    # Create audit log
    await create_audit_log(
        db, "contract", contract_id, "update",
        current_user["id"] if current_user else "system",
        changes=changes,
        reason=request.update_reason
    )
    
    return await get_contract(contract_id)


# ═══════════════════════════════════════════════════════════════════════════════
# STATUS TRANSITIONS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{contract_id}/submit")
async def submit_for_approval(contract_id: str):
    """Submit contract for approval"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    current_status = ContractStatus(contract["status"])
    
    # Can only submit from DRAFT or REVISION_REQUIRED
    if current_status not in [ContractStatus.DRAFT, ContractStatus.REVISION_REQUIRED]:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể submit từ trạng thái {current_status.value}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update status
    status_history = contract.get("status_history", [])
    status_history.append({
        "from_status": current_status.value,
        "to_status": ContractStatus.PENDING_REVIEW.value,
        "changed_by": current_user["id"] if current_user else None,
        "changed_at": now,
        "reason": "Submitted for approval",
    })
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": ContractStatus.PENDING_REVIEW.value,
            "status_changed_at": now,
            "status_changed_by": current_user["id"] if current_user else None,
            "status_history": status_history,
            "approval_status": ApprovalStatus.IN_PROGRESS.value,
            "current_approval_step": 1,
        }}
    )
    
    # Create audit log
    await create_audit_log(
        db, "contract", contract_id, "submit",
        current_user["id"] if current_user else "system"
    )
    
    return {"success": True, "message": "Đã gửi duyệt"}


@router.post("/{contract_id}/approve")
async def approve_contract(contract_id: str, request: ApproveRequest):
    """Approve current approval step"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    if contract["status"] != ContractStatus.PENDING_REVIEW.value:
        raise HTTPException(status_code=400, detail="Hợp đồng không ở trạng thái chờ duyệt")
    
    now = datetime.now(timezone.utc).isoformat()
    current_step = contract.get("current_approval_step", 1)
    workflow = APPROVAL_WORKFLOWS.get(contract.get("approval_workflow_id", "simple"), {})
    steps = workflow.get("steps", [])
    
    # Update current step review
    updates = {}
    if current_step == 1:
        updates["sales_review_status"] = ReviewStatus.APPROVED.value
        updates["sales_reviewed_by"] = current_user["id"] if current_user else None
        updates["sales_reviewed_at"] = now
        updates["sales_review_notes"] = request.comments
    elif current_step == 2:
        updates["legal_review_status"] = ReviewStatus.APPROVED.value
        updates["legal_reviewed_by"] = current_user["id"] if current_user else None
        updates["legal_reviewed_at"] = now
        updates["legal_review_notes"] = request.comments
    elif current_step == 3:
        updates["finance_review_status"] = ReviewStatus.APPROVED.value
        updates["finance_reviewed_by"] = current_user["id"] if current_user else None
        updates["finance_reviewed_at"] = now
        updates["finance_review_notes"] = request.comments
    
    # Find next step
    next_step = None
    for step in steps:
        if step["step"] > current_step:
            # Check skip conditions
            skip_if = step.get("skip_if")
            if skip_if:
                # Simple condition evaluation
                condition = skip_if.get("condition", "")
                should_skip = False
                if "discount_percent <= 5" in condition:
                    should_skip = contract.get("discount_percent", 0) <= 5
                elif "contract_value < 5000000000" in condition:
                    should_skip = contract.get("grand_total", 0) < 5000000000
                
                if should_skip:
                    continue
            
            if step.get("required", True) or not step.get("skip_if"):
                next_step = step
                break
    
    if next_step:
        updates["current_approval_step"] = next_step["step"]
    else:
        # All steps complete
        updates["status"] = ContractStatus.APPROVED.value
        updates["approval_status"] = ApprovalStatus.APPROVED.value
        updates["final_approved_by"] = current_user["id"] if current_user else None
        updates["final_approved_at"] = now
        
        # Update status history
        status_history = contract.get("status_history", [])
        status_history.append({
            "from_status": contract["status"],
            "to_status": ContractStatus.APPROVED.value,
            "changed_by": current_user["id"] if current_user else None,
            "changed_at": now,
            "reason": "Approved",
        })
        updates["status_history"] = status_history
        updates["status_changed_at"] = now
    
    await db.contracts.update_one({"id": contract_id}, {"$set": updates})
    
    # Audit log
    await create_audit_log(
        db, "contract", contract_id, "approve",
        current_user["id"] if current_user else "system",
        metadata={"step": current_step, "comments": request.comments}
    )
    
    return {"success": True, "message": "Đã duyệt", "next_step": next_step}


@router.post("/{contract_id}/reject")
async def reject_contract(contract_id: str, request: RejectRequest):
    """Reject and send back for revision"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    if contract["status"] != ContractStatus.PENDING_REVIEW.value:
        raise HTTPException(status_code=400, detail="Hợp đồng không ở trạng thái chờ duyệt")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Status history
    status_history = contract.get("status_history", [])
    status_history.append({
        "from_status": contract["status"],
        "to_status": ContractStatus.REVISION_REQUIRED.value,
        "changed_by": current_user["id"] if current_user else None,
        "changed_at": now,
        "reason": request.reason,
    })
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": ContractStatus.REVISION_REQUIRED.value,
            "status_changed_at": now,
            "status_changed_by": current_user["id"] if current_user else None,
            "status_history": status_history,
            "approval_status": ApprovalStatus.REJECTED.value,
            "current_approval_step": 0,  # Reset for re-submission
        }}
    )
    
    await create_audit_log(
        db, "contract", contract_id, "reject",
        current_user["id"] if current_user else "system",
        reason=request.reason,
        metadata={"required_changes": request.required_changes}
    )
    
    return {"success": True, "message": "Đã từ chối và yêu cầu sửa đổi"}


@router.post("/{contract_id}/sign")
async def sign_contract(contract_id: str, request: SignContractRequest):
    """Mark contract as signed and AUTO-TRIGGER COMMISSION CALCULATION"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    status = ContractStatus(contract["status"])
    if status not in [ContractStatus.APPROVED, ContractStatus.PENDING_SIGNATURE]:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể ký từ trạng thái {status.value}. Cần ở trạng thái Đã duyệt."
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get signer names
    customer = await db.contacts.find_one(
        {"id": request.signed_by_customer_id},
        {"_id": 0, "full_name": 1}
    )
    company_signer = await db.users.find_one(
        {"id": request.signed_by_company_id},
        {"_id": 0, "full_name": 1}
    )
    
    # Status history
    status_history = contract.get("status_history", [])
    status_history.append({
        "from_status": contract["status"],
        "to_status": ContractStatus.SIGNED.value,
        "changed_by": current_user["id"] if current_user else None,
        "changed_at": now,
        "reason": "Contract signed",
    })
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": ContractStatus.SIGNED.value,
            "status_changed_at": now,
            "status_changed_by": current_user["id"] if current_user else None,
            "status_history": status_history,
            "is_locked": True,  # LOCK CONTRACT
            
            "signing_status": SigningStatus.COMPLETED.value,
            "signed_by_customer_id": request.signed_by_customer_id,
            "signed_by_customer_name": customer.get("full_name", "") if customer else "",
            "customer_signed_at": request.signing_date or now,
            "signed_by_company_id": request.signed_by_company_id,
            "signed_by_company_name": company_signer.get("full_name", "") if company_signer else "",
            "signed_by_company_title": request.signed_by_company_title,
            "company_signed_at": request.signing_date or now,
            "signing_location": request.signing_location,
            "witnesses": [w.model_dump() for w in request.witnesses],
            "notarized": request.notarized,
            "notarization_date": request.notarization_date,
            "notarization_ref": request.notarization_ref,
        }}
    )
    
    # Sync to deal
    updated_contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    await sync_contract_to_deal(db, updated_contract)
    
    await create_audit_log(
        db, "contract", contract_id, "sign",
        current_user["id"] if current_user else "system",
        metadata={
            "signed_by_customer": request.signed_by_customer_id,
            "signed_by_company": request.signed_by_company_id,
        }
    )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUTO-TRIGGER COMMISSION CALCULATION (Prompt 11/20)
    # ═══════════════════════════════════════════════════════════════════════════
    commission_result = None
    try:
        from services.commission_service import CommissionService
        from config.commission_config import CommissionTrigger
        
        commission_service = CommissionService(db)
        
        # Calculate commission - idempotent (won't duplicate if already exists)
        records, errors = await commission_service.calculate_commission(
            contract_id=contract_id,
            trigger_event=CommissionTrigger.CONTRACT_SIGNED.value,
            triggered_by=current_user["id"] if current_user else "system"
        )
        
        if records:
            commission_result = {
                "triggered": True,
                "records_created": len(records),
                "total_commission": sum(r.get("final_amount", 0) for r in records),
            }
            logger.info(f"Auto-triggered commission for contract {contract_id}: {len(records)} records created")
        elif errors:
            commission_result = {
                "triggered": False,
                "errors": errors,
            }
            logger.warning(f"Commission calculation errors for contract {contract_id}: {errors}")
        else:
            commission_result = {
                "triggered": False,
                "reason": "No matching policy or already processed",
            }
    except Exception as e:
        logger.error(f"Error auto-triggering commission for contract {contract_id}: {str(e)}")
        commission_result = {
            "triggered": False,
            "error": str(e),
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUTO-TRIGGER FINANCE FLOW ENGINE (Prompt 20/20)
    # Tạo payment schedule khi contract được ký
    # ═══════════════════════════════════════════════════════════════════════════
    finance_flow_result = None
    try:
        from services.finance_flow_engine import FinanceFlowEngine
        
        flow_engine = FinanceFlowEngine(db)
        
        # Trigger contract_signed event → tạo payment schedule
        flow_result = await flow_engine.handle_event(
            "contract_signed",
            {"contract_id": contract_id},
            current_user["id"] if current_user else "system"
        )
        
        finance_flow_result = {
            "triggered": True,
            "event": "contract_signed",
            "actions": flow_result.get("actions", []),
            "data": flow_result.get("data", {}),
        }
        
        logger.info(f"Finance flow triggered for contract {contract_id}: {flow_result.get('actions', [])}")
        
    except Exception as e:
        logger.error(f"Error triggering finance flow for contract {contract_id}: {str(e)}")
        finance_flow_result = {
            "triggered": False,
            "error": str(e),
        }
    
    return {
        "success": True, 
        "message": "Đã ký hợp đồng. Hợp đồng đã bị khóa.",
        "commission": commission_result,
        "finance_flow": finance_flow_result,
    }


@router.post("/{contract_id}/activate")
async def activate_contract(contract_id: str):
    """Activate signed contract"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    if contract["status"] != ContractStatus.SIGNED.value:
        raise HTTPException(status_code=400, detail="Chỉ có thể kích hoạt hợp đồng đã ký")
    
    now = datetime.now(timezone.utc).isoformat()
    
    status_history = contract.get("status_history", [])
    status_history.append({
        "from_status": contract["status"],
        "to_status": ContractStatus.ACTIVE.value,
        "changed_by": current_user["id"] if current_user else None,
        "changed_at": now,
        "reason": "Contract activated",
    })
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": ContractStatus.ACTIVE.value,
            "status_changed_at": now,
            "status_changed_by": current_user["id"] if current_user else None,
            "status_history": status_history,
            "effective_date": contract.get("effective_date") or now,
        }}
    )
    
    # Sync to deal
    updated = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    await sync_contract_to_deal(db, updated)
    
    return {"success": True, "message": "Đã kích hoạt hợp đồng"}


# ═══════════════════════════════════════════════════════════════════════════════
# PAYMENT RECORDING
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{contract_id}/payments")
async def record_payment(contract_id: str, request: RecordPaymentRequest):
    """Record payment for an installment"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    status = ContractStatus(contract["status"])
    if not can_record_payment_at_status(status):
        raise HTTPException(
            status_code=400,
            detail=f"Không thể ghi nhận thanh toán ở trạng thái {status.value}"
        )
    
    # Find installment
    schedule = contract.get("payment_schedule", [])
    installment_idx = None
    
    for i, inst in enumerate(schedule):
        if inst.get("installment_number") == request.installment_number:
            installment_idx = i
            break
    
    if installment_idx is None:
        raise HTTPException(status_code=400, detail="Đợt thanh toán không tồn tại")
    
    installment = schedule[installment_idx]
    now = datetime.now(timezone.utc).isoformat()
    
    # Update installment
    new_paid = installment.get("paid_amount", 0) + request.amount
    installment_amount = installment.get("amount", 0)
    
    if new_paid >= installment_amount:
        installment["status"] = PaymentStatus.PAID.value
        installment["paid_amount"] = installment_amount
    else:
        installment["status"] = PaymentStatus.PARTIAL.value
        installment["paid_amount"] = new_paid
    
    installment["paid_date"] = request.payment_date or now
    installment["payment_method"] = request.payment_method
    installment["payment_reference"] = request.payment_reference
    installment["receipt_document_id"] = request.receipt_document_id
    
    if installment.get("overdue_days", 0) > 0:
        installment["status"] = PaymentStatus.PAID.value if new_paid >= installment_amount else PaymentStatus.OVERDUE.value
    
    schedule[installment_idx] = installment
    
    # Calculate summary
    summary = calculate_payment_summary(schedule)
    
    # Update contract
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "payment_schedule": schedule,
            **summary,
        }}
    )
    
    # Record payment history
    await db.contract_payments.insert_one({
        "id": str(uuid.uuid4()),
        "contract_id": contract_id,
        "installment_number": request.installment_number,
        "amount": request.amount,
        "payment_method": request.payment_method,
        "payment_reference": request.payment_reference,
        "payment_date": request.payment_date or now,
        "receipt_document_id": request.receipt_document_id,
        "recorded_by": current_user["id"] if current_user else None,
        "recorded_at": now,
        "notes": request.notes,
    })
    
    # Sync to deal
    updated = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    await sync_contract_to_deal(db, updated)
    
    await create_audit_log(
        db, "contract", contract_id, "payment",
        current_user["id"] if current_user else "system",
        metadata={
            "installment": request.installment_number,
            "amount": request.amount,
        }
    )
    
    return {"success": True, "message": "Đã ghi nhận thanh toán", "summary": summary}


@router.get("/{contract_id}/payments", response_model=List[PaymentHistoryResponse])
async def get_payment_history(contract_id: str):
    """Get payment history for contract"""
    db = get_db()
    
    payments = await db.contract_payments.find(
        {"contract_id": contract_id},
        {"_id": 0}
    ).sort("recorded_at", -1).to_list(100)
    
    # Resolve names
    for p in payments:
        if p.get("recorded_by"):
            user = await db.users.find_one({"id": p["recorded_by"]}, {"_id": 0, "full_name": 1})
            p["recorded_by_name"] = user.get("full_name", "") if user else ""
    
    return [PaymentHistoryResponse(**p) for p in payments]


# ═══════════════════════════════════════════════════════════════════════════════
# AMENDMENTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{contract_id}/amendments", response_model=AmendmentResponse)
async def create_amendment(contract_id: str, request: AmendmentCreate):
    """Create amendment for a contract (inherits from parent)"""
    db = get_db()
    current_user = await get_current_user_internal()
    db = get_db()
    current_user = await get_current_user_internal()
    
    # Get parent contract
    parent = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    status = ContractStatus(parent["status"])
    if not can_create_amendment_at_status(status):
        raise HTTPException(
            status_code=400,
            detail=f"Không thể tạo phụ lục ở trạng thái {status.value}. Hợp đồng cần ở trạng thái Đã ký hoặc Có hiệu lực."
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate amendment code
    amendment_number = await get_next_amendment_number(db, contract_id)
    amendment_code = generate_amendment_code(parent["contract_code"], amendment_number)
    
    # Build old/new values from changed fields
    old_values = {}
    new_values = {}
    
    for change in request.changed_fields:
        old_values[change.field_name] = change.old_value
        new_values[change.field_name] = change.new_value
    
    amendment = {
        "id": str(uuid.uuid4()),
        "amendment_code": amendment_code,
        "amendment_number": amendment_number,
        "parent_contract_id": contract_id,
        
        "amendment_type": request.amendment_type,
        "reason": request.reason,
        "changes_summary": request.changes_summary,
        
        "changed_fields": [c.model_dump() for c in request.changed_fields],
        "old_values": old_values,
        "new_values": new_values,
        
        "status": ContractStatus.DRAFT.value,
        "effective_date": request.effective_date,
        
        "approval_status": ApprovalStatus.NOT_STARTED.value,
        "approved_by": None,
        "approved_at": None,
        "approval_notes": None,
        
        "signed_by_customer": None,
        "signed_by_company": None,
        "signed_date": None,
        
        "document_ids": [],
        
        "created_by": current_user["id"] if current_user else None,
        "created_at": now,
        
        "tenant_id": parent.get("tenant_id"),
        "notes": request.notes,
    }
    
    await db.amendments.insert_one(amendment)
    
    # Add to parent's active amendments
    await db.contracts.update_one(
        {"id": contract_id},
        {"$push": {"active_amendments": amendment["id"]}}
    )
    
    await create_audit_log(
        db, "amendment", amendment["id"], "create",
        current_user["id"] if current_user else "system",
        metadata={"parent_contract": contract_id}
    )
    
    type_config = AMENDMENT_TYPE_CONFIG.get(AmendmentType(request.amendment_type), {})
    
    return AmendmentResponse(
        **amendment,
        parent_contract_code=parent["contract_code"],
        amendment_type_label=type_config.get("label", ""),
        status_label=CONTRACT_STATUS_CONFIG[ContractStatus.DRAFT]["label"],
    )


@router.get("/{contract_id}/amendments", response_model=List[AmendmentResponse])
async def get_amendments(contract_id: str):
    """Get all amendments for a contract"""
    db = get_db()
    
    parent = await db.contracts.find_one({"id": contract_id}, {"_id": 0, "contract_code": 1})
    if not parent:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    amendments = await db.amendments.find(
        {"parent_contract_id": contract_id},
        {"_id": 0}
    ).sort("amendment_number", 1).to_list(100)
    
    results = []
    for a in amendments:
        try:
            amendment_type = AmendmentType(a.get("amendment_type", "general"))
        except ValueError:
            amendment_type = AmendmentType.GENERAL
        type_config = AMENDMENT_TYPE_CONFIG.get(amendment_type, {})
        
        try:
            status = ContractStatus(a.get("status", "draft"))
        except ValueError:
            status = ContractStatus.DRAFT
        status_config = CONTRACT_STATUS_CONFIG.get(status, {})
        
        # Filter out computed fields to avoid duplicates
        a_data = {k: v for k, v in a.items() if k not in ['amendment_type_label', 'status_label', 'parent_contract_code']}
        
        results.append(AmendmentResponse(
            **a_data,
            parent_contract_code=parent["contract_code"],
            amendment_type_label=type_config.get("label", ""),
            status_label=status_config.get("label", ""),
        ))
    
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{contract_id}/audit-logs", response_model=List[ContractAuditLogResponse])
async def get_audit_logs(contract_id: str):
    """Get audit logs for contract"""
    db = get_db()
    
    logs = await db.contract_audit_logs.find(
        {"entity_id": contract_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    # Resolve actor names
    for log in logs:
        if log.get("actor_id"):
            user = await db.users.find_one({"id": log["actor_id"]}, {"_id": 0, "full_name": 1, "role": 1})
            if user:
                log["actor_name"] = user.get("full_name", "")
                log["actor_role"] = user.get("role", "")
    
    return [ContractAuditLogResponse(**log) for log in logs]
