"""
ProHouzing API v2 - Lead Router
Version: 1.0.0

Lead management endpoints with capture, qualification, and conversion.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.lead import lead_service
from core.schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse, LeadListItem, LeadConvertRequest
)
from core.schemas.base import APIResponse, PaginationMeta

router = APIRouter(prefix="/leads", tags=["Leads"])


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=APIResponse[LeadResponse], status_code=status.HTTP_201_CREATED)
async def create_lead(
    data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "create"))
):
    """
    Capture a new lead.
    
    - Auto-generates lead_code
    - Normalizes phone and email
    - Records capture timestamp
    """
    # Override org_id from token (multi-tenant security)
    data.org_id = current_user.org_id
    
    lead = lead_service.create(
        db,
        obj_in=data,
        org_id=current_user.org_id,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(lead),
        message="Lead captured successfully"
    )


@router.get("", response_model=APIResponse[List[LeadListItem]])
async def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    lead_status: Optional[str] = None,
    source_channel: Optional[str] = None,
    owner_user_id: Optional[UUID] = None,
    intent_level: Optional[str] = None,
    sort_by: str = "captured_at",
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    """
    List leads with pagination, filtering, search, and VISIBILITY FILTER.
    
    - Multi-tenant filtered
    - Visibility filter: Sales sees own, Team Lead sees team, Manager sees branch, CEO sees all
    - Supports search by name, phone, email, code
    """
    skip = (page - 1) * limit
    filters = {}
    
    if status:
        filters["status"] = status
    if lead_status:
        filters["lead_status"] = lead_status
    if source_channel:
        filters["source_channel"] = source_channel
    if owner_user_id:
        filters["owner_user_id"] = owner_user_id
    if intent_level:
        filters["intent_level"] = intent_level
    
    search_fields = ["contact_name", "contact_phone", "contact_email", "lead_code"]
    
    leads, total = lead_service.get_multi(
        db,
        org_id=current_user.org_id,
        user_id=current_user.id,  # VISIBILITY FILTER - pass current user
        skip=skip,
        limit=limit,
        filters=filters if filters else None,
        search=search,
        search_fields=search_fields if search else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    pagination = lead_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[LeadListItem.model_validate(lead) for lead in leads],
        meta=pagination
    )


@router.get("/{lead_id}", response_model=APIResponse[LeadResponse])
async def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    """Get a single lead by ID with ACCESS CHECK."""
    lead = lead_service.get(
        db,
        id=lead_id,
        org_id=current_user.org_id
    )
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # ACCESS CHECK
    if not lead_service.can_access_entity(db, entity=lead, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to view this lead"
        )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(lead)
    )


@router.put("/{lead_id}", response_model=APIResponse[LeadResponse])
async def update_lead(
    lead_id: UUID,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "edit"))
):
    """Update a lead with ACCESS CHECK."""
    # Get lead first to check access
    lead = lead_service.get(db, id=lead_id, org_id=current_user.org_id)
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # ACCESS CHECK
    if not lead_service.can_access_entity(db, entity=lead, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to edit this lead"
        )
    
    updated_lead = lead_service.update(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        obj_in=data,
        updated_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(updated_lead),
        message="Lead updated successfully"
    )


@router.delete("/{lead_id}", response_model=APIResponse)
async def delete_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "delete"))
):
    """Soft delete a lead with ACCESS CHECK."""
    # Get lead first to check access
    lead = lead_service.get(db, id=lead_id, org_id=current_user.org_id)
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # ACCESS CHECK
    if not lead_service.can_access_entity(db, entity=lead, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to delete this lead"
        )
    
    success = lead_service.delete(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        deleted_by=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    return APIResponse(
        success=True,
        message="Lead deleted successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# QUALIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{lead_id}/qualify", response_model=APIResponse[LeadResponse])
async def qualify_lead(
    lead_id: UUID,
    intent_level: str,
    score: Optional[int] = Query(None, ge=0, le=100),
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "edit"))
):
    """
    Qualify a lead.
    
    - Sets lead_status to "qualified"
    - Records qualification score and notes
    """
    lead = lead_service.qualify(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        intent_level=intent_level,
        score=score,
        notes=notes,
        qualified_by=current_user.id
    )
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(lead),
        message="Lead qualified successfully"
    )


@router.post("/{lead_id}/contact", response_model=APIResponse[LeadResponse])
async def mark_lead_contacted(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "edit"))
):
    """Mark lead as contacted (increment contact attempts)."""
    lead = lead_service.mark_contacted(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        contacted_by=current_user.id
    )
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(lead),
        message="Contact recorded"
    )


@router.post("/{lead_id}/lost", response_model=APIResponse[LeadResponse])
async def mark_lead_lost(
    lead_id: UUID,
    reason: str,
    detail: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "edit"))
):
    """Mark lead as lost."""
    lead = lead_service.mark_lost(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        reason=reason,
        detail=detail,
        lost_by=current_user.id
    )
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(lead),
        message="Lead marked as lost"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{lead_id}/convert", response_model=APIResponse[Dict[str, Any]])
async def convert_lead_to_deal(
    lead_id: UUID,
    request: LeadConvertRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "convert"))
):
    """
    Convert lead to deal.
    
    - Optionally creates a new customer
    - Creates a new deal linked to the lead
    - Marks lead as converted
    """
    result = lead_service.convert_to_deal(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        request=request,
        converted_by=current_user.id
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead cannot be converted (not found, not qualified, or already converted)"
        )
    
    return APIResponse(
        success=True,
        data=result,
        message="Lead converted to deal successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{lead_id}/assign", response_model=APIResponse[LeadResponse])
async def assign_lead(
    lead_id: UUID,
    owner_user_id: Optional[UUID] = None,
    owner_unit_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "assign"))
):
    """Assign lead to a user or unit."""
    lead = lead_service.assign_owner(
        db,
        id=lead_id,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
        owner_unit_id=owner_unit_id,
        assigned_by=current_user.id
    )
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    return APIResponse(
        success=True,
        data=LeadResponse.model_validate(lead),
        message="Lead assigned successfully"
    )


@router.get("/by-owner/{owner_user_id}", response_model=APIResponse[List[LeadListItem]])
async def get_leads_by_owner(
    owner_user_id: UUID,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    """Get leads owned by a specific user."""
    skip = (page - 1) * limit
    
    leads, total = lead_service.get_by_owner(
        db,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
        status=status,
        skip=skip,
        limit=limit
    )
    
    pagination = lead_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[LeadListItem.model_validate(lead) for lead in leads],
        meta=pagination
    )


# ═══════════════════════════════════════════════════════════════════════════════
# FILTERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/by-status/{status}", response_model=APIResponse[List[LeadListItem]])
async def get_leads_by_status(
    status: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    """Get leads by status."""
    skip = (page - 1) * limit
    
    leads, total = lead_service.get_by_status(
        db,
        org_id=current_user.org_id,
        status=status,
        skip=skip,
        limit=limit
    )
    
    pagination = lead_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[LeadListItem.model_validate(lead) for lead in leads],
        meta=pagination
    )


@router.get("/by-source/{source_channel}", response_model=APIResponse[List[LeadListItem]])
async def get_leads_by_source(
    source_channel: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    """Get leads by source channel."""
    skip = (page - 1) * limit
    
    leads, total = lead_service.get_by_source(
        db,
        org_id=current_user.org_id,
        source_channel=source_channel,
        skip=skip,
        limit=limit
    )
    
    pagination = lead_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[LeadListItem.model_validate(lead) for lead in leads],
        meta=pagination
    )
