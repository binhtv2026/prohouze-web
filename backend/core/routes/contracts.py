"""
ProHouzing API v2 - Contract Router
Version: 1.0.0

Contract lifecycle management endpoints.
"""

from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.contract import contract_service
from core.schemas.transaction import ContractCreate, ContractUpdate, ContractResponse
from core.schemas.base import APIResponse, PaginationMeta

router = APIRouter(prefix="/contracts", tags=["Contracts"])


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=APIResponse[ContractResponse], status_code=status.HTTP_201_CREATED)
async def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "create"))
):
    """
    Create a new contract.
    
    - Auto-generates contract_code
    - Calculates payment schedule if not provided
    - Sets initial contract_status to "draft"
    """
    data.org_id = current_user.org_id
    
    contract = contract_service.create(
        db,
        obj_in=data,
        org_id=current_user.org_id,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract created successfully"
    )


@router.get("", response_model=APIResponse[List[ContractResponse]])
async def list_contracts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    contract_status: Optional[str] = None,
    deal_id: Optional[UUID] = None,
    customer_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "view"))
):
    """List contracts with pagination and filtering."""
    skip = (page - 1) * limit
    filters = {}
    
    if contract_status:
        filters["contract_status"] = contract_status
    if deal_id:
        filters["deal_id"] = deal_id
    if customer_id:
        filters["customer_id"] = customer_id
    if product_id:
        filters["product_id"] = product_id
    
    search_fields = ["contract_code", "contract_name"]
    
    contracts, total = contract_service.get_multi(
        db,
        org_id=current_user.org_id,
        user_id=current_user.id,  # VISIBILITY FILTER
        skip=skip,
        limit=limit,
        filters=filters if filters else None,
        search=search,
        search_fields=search_fields if search else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    pagination = contract_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[ContractResponse.model_validate(c) for c in contracts],
        meta=pagination
    )


@router.get("/{contract_id}", response_model=APIResponse[ContractResponse])
async def get_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "view"))
):
    """Get a single contract by ID with ACCESS CHECK."""
    contract = contract_service.get(
        db,
        id=contract_id,
        org_id=current_user.org_id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # ACCESS CHECK
    if not contract_service.can_access_entity(db, entity=contract, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to view this contract"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract)
    )


@router.put("/{contract_id}", response_model=APIResponse[ContractResponse])
async def update_contract(
    contract_id: UUID,
    data: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "edit"))
):
    """Update a contract with ACCESS CHECK."""
    contract = contract_service.get(db, id=contract_id, org_id=current_user.org_id)
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # ACCESS CHECK
    if not contract_service.can_access_entity(db, entity=contract, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to edit this contract"
        )
    
    updated_contract = contract_service.update(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        obj_in=data,
        updated_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(updated_contract),
        message="Contract updated successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL WORKFLOW
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{contract_id}/submit", response_model=APIResponse[ContractResponse])
async def submit_contract_for_approval(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "edit"))
):
    """Submit contract for internal approval."""
    contract = contract_service.submit_for_approval(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        submitted_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not in draft status"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract submitted for approval"
    )


@router.post("/{contract_id}/approve", response_model=APIResponse[ContractResponse])
async def approve_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "approve"))
):
    """Approve a pending contract."""
    contract = contract_service.approve(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        approved_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not pending approval"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract approved"
    )


@router.post("/{contract_id}/reject", response_model=APIResponse[ContractResponse])
async def reject_contract(
    contract_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "approve"))
):
    """Reject a pending contract."""
    contract = contract_service.reject(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        reason=reason,
        rejected_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not pending approval"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract rejected"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# SIGNING
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{contract_id}/sign", response_model=APIResponse[ContractResponse])
async def sign_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "sign"))
):
    """Mark contract as signed."""
    contract = contract_service.sign(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        signed_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not approved"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract signed"
    )


@router.post("/{contract_id}/activate", response_model=APIResponse[ContractResponse])
async def activate_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "activate"))
):
    """Activate a signed contract."""
    contract = contract_service.activate(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        activated_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not signed"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract activated"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# TERMINATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{contract_id}/terminate", response_model=APIResponse[ContractResponse])
async def terminate_contract(
    contract_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "terminate"))
):
    """Terminate an active contract."""
    contract = contract_service.terminate(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        reason=reason,
        terminated_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not active"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract terminated"
    )


@router.post("/{contract_id}/complete", response_model=APIResponse[ContractResponse])
async def complete_contract(
    contract_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "complete"))
):
    """Mark contract as completed (fully paid and delivered)."""
    contract = contract_service.complete(
        db,
        id=contract_id,
        org_id=current_user.org_id,
        completed_by=current_user.id
    )
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract not found or not active"
        )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract),
        message="Contract completed"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# QUERIES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/by-deal/{deal_id}", response_model=APIResponse[Optional[ContractResponse]])
async def get_contract_by_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "view"))
):
    """Get active contract for a deal."""
    contract = contract_service.get_by_deal(
        db,
        org_id=current_user.org_id,
        deal_id=deal_id
    )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract) if contract else None
    )


@router.get("/by-customer/{customer_id}", response_model=APIResponse[List[ContractResponse]])
async def get_contracts_by_customer(
    customer_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "view"))
):
    """Get all contracts for a customer."""
    skip = (page - 1) * limit
    
    contracts, total = contract_service.get_by_customer(
        db,
        org_id=current_user.org_id,
        customer_id=customer_id,
        skip=skip,
        limit=limit
    )
    
    pagination = contract_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[ContractResponse.model_validate(c) for c in contracts],
        meta=pagination
    )


@router.get("/by-product/{product_id}", response_model=APIResponse[Optional[ContractResponse]])
async def get_contract_by_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("contracts", "view"))
):
    """Get active contract for a product."""
    contract = contract_service.get_by_product(
        db,
        org_id=current_user.org_id,
        product_id=product_id
    )
    
    return APIResponse(
        success=True,
        data=ContractResponse.model_validate(contract) if contract else None
    )
