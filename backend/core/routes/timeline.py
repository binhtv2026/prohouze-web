"""
ProHouzing API v2 - Timeline & Events Router
Version: 2.0.0 (Prompt 2/18)

Timeline and event query endpoints:
- Entity timelines
- Customer activity history
- Deal activity history
- Change logs
- Recent activities
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.event_service import event_service
from core.schemas.base import APIResponse, PaginationMeta


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class ActivityItemResponse(BaseModel):
    """Activity stream item response"""
    id: UUID
    event_id: Optional[UUID] = None
    entity_type: str
    entity_id: UUID
    entity_code: Optional[str] = None
    entity_name: Optional[str] = None
    actor_user_id: Optional[UUID] = None
    actor_name: Optional[str] = None
    activity_code: str
    title: str
    summary: Optional[str] = None
    icon_code: Optional[str] = None
    color_code: Optional[str] = None
    severity_level: Optional[str] = None
    happened_at: datetime
    related_customer_id: Optional[UUID] = None
    related_deal_id: Optional[UUID] = None
    related_product_id: Optional[UUID] = None
    related_project_id: Optional[UUID] = None
    metadata_json: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class ChangeLogResponse(BaseModel):
    """Entity change log response"""
    id: UUID
    entity_type: str
    entity_id: UUID
    actor_user_id: Optional[UUID] = None
    actor_name: Optional[str] = None
    change_source: str
    field_name: str
    old_value_json: Optional[Dict[str, Any]] = None
    new_value_json: Optional[Dict[str, Any]] = None
    old_display_value: Optional[str] = None
    new_display_value: Optional[str] = None
    reason_code: Optional[str] = None
    reason_note: Optional[str] = None
    changed_at: datetime
    
    class Config:
        from_attributes = True


class DomainEventResponse(BaseModel):
    """Domain event response"""
    id: UUID
    event_code: str
    event_version: Optional[str] = None
    aggregate_type: str
    aggregate_id: UUID
    sequence_no: int
    actor_user_id: Optional[UUID] = None
    actor_type: Optional[str] = None
    correlation_id: Optional[str] = None
    payload: Dict[str, Any]
    occurred_at: datetime
    processed_status: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════════════════════════════════════════

router = APIRouter(prefix="/timeline", tags=["Timeline & Events"])


# ═══════════════════════════════════════════════════════════════════════════════
# SPECIFIC ROUTES FIRST (to avoid path parameter conflicts)
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# RECENT ACTIVITIES (Dashboard)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/recent", response_model=APIResponse[List[ActivityItemResponse]])
async def get_recent_activities(
    limit: int = Query(20, ge=1, le=100),
    entity_types: Optional[str] = Query(None, description="Comma-separated entity types"),
    activity_codes: Optional[str] = Query(None, description="Comma-separated activity codes"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get recent activities for dashboard.
    
    Optional filters:
    - entity_types: deal,customer,booking
    - activity_codes: deal.created,deal.stage_changed
    """
    entity_type_list = entity_types.split(",") if entity_types else None
    activity_code_list = activity_codes.split(",") if activity_codes else None
    
    items = event_service.get_recent_activities(
        db,
        org_id=current_user.org_id,
        limit=limit,
        activity_codes=activity_code_list,
        entity_types=entity_type_list
    )
    
    return APIResponse(
        success=True,
        data=[ActivityItemResponse.model_validate(item) for item in items]
    )


# ═══════════════════════════════════════════════════════════════════════════════
# DOMAIN EVENTS (Admin/Debug)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/events", response_model=APIResponse[List[DomainEventResponse]])
async def get_domain_events(
    aggregate_type: Optional[str] = None,
    aggregate_id: Optional[UUID] = None,
    event_code: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("admin", "view"))
):
    """
    Get domain events (admin only).
    
    Raw event data for debugging and audit.
    """
    skip = (page - 1) * limit
    
    items, total = event_service.get_domain_events(
        db,
        org_id=current_user.org_id,
        aggregate_type=aggregate_type,
        aggregate_id=aggregate_id,
        event_code=event_code,
        skip=skip,
        limit=limit
    )
    
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return APIResponse(
        success=True,
        data=[DomainEventResponse.model_validate(item) for item in items],
        meta=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
    )


# ═══════════════════════════════════════════════════════════════════════════════
# DEAL TIMELINE
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/deals/{deal_id}", response_model=APIResponse[List[ActivityItemResponse]])
async def get_deal_timeline(
    deal_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get activity timeline for a deal.
    
    Includes:
    - Direct deal events (stage changes, updates)
    - Related booking events
    - Related contract events
    - Related payment events
    """
    skip = (page - 1) * limit
    
    items, total = event_service.get_deal_timeline(
        db,
        org_id=current_user.org_id,
        deal_id=deal_id,
        skip=skip,
        limit=limit
    )
    
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return APIResponse(
        success=True,
        data=[ActivityItemResponse.model_validate(item) for item in items],
        meta=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMER TIMELINE
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/customers/{customer_id}", response_model=APIResponse[List[ActivityItemResponse]])
async def get_customer_timeline(
    customer_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get activity timeline for a customer.
    
    Includes:
    - Direct customer events
    - Related lead events
    - Related deal events
    - Related booking/contract events
    """
    skip = (page - 1) * limit
    
    items, total = event_service.get_customer_timeline(
        db,
        org_id=current_user.org_id,
        customer_id=customer_id,
        skip=skip,
        limit=limit
    )
    
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return APIResponse(
        success=True,
        data=[ActivityItemResponse.model_validate(item) for item in items],
        meta=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
    )


# ═══════════════════════════════════════════════════════════════════════════════
# CHANGE LOGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/changes/{entity_type}/{entity_id}", response_model=APIResponse[List[ChangeLogResponse]])
async def get_entity_changes(
    entity_type: str,
    entity_id: UUID,
    field_name: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get change log for an entity.
    
    Shows field-level audit trail (e.g., stage changes, price changes).
    """
    skip = (page - 1) * limit
    
    items, total = event_service.get_entity_changes(
        db,
        org_id=current_user.org_id,
        entity_type=entity_type,
        entity_id=entity_id,
        field_name=field_name,
        skip=skip,
        limit=limit
    )
    
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return APIResponse(
        success=True,
        data=[ChangeLogResponse.model_validate(item) for item in items],
        meta=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
    )


# ═══════════════════════════════════════════════════════════════════════════════
# GENERIC ENTITY TIMELINE (must be last to avoid path conflicts)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{entity_type}/{entity_id}", response_model=APIResponse[List[ActivityItemResponse]])
async def get_entity_timeline(
    entity_type: str,
    entity_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get activity timeline for any entity.
    
    Supported entity types: customer, lead, deal, booking, contract, product, commission
    """
    skip = (page - 1) * limit
    
    items, total = event_service.get_entity_timeline(
        db,
        org_id=current_user.org_id,
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit
    )
    
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return APIResponse(
        success=True,
        data=[ActivityItemResponse.model_validate(item) for item in items],
        meta=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
    )
