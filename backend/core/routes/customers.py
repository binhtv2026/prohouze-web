"""
ProHouzing API v2 - Customer Router
Version: 1.0.0

Customer management endpoints with multi-tenancy, soft delete, and RBAC.
"""

from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_permission
from core.services.customer import customer_service
from core.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListItem,
    CustomerIdentityCreate, CustomerIdentityResponse,
    CustomerAddressCreate, CustomerAddressResponse
)
from core.schemas.base import APIResponse, PaginationMeta

router = APIRouter(prefix="/customers", tags=["Customers"])


# ═══════════════════════════════════════════════════════════════════════════════
# CRUD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=APIResponse[CustomerResponse], status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "create"))
):
    """
    Create a new customer.
    
    - Auto-generates customer_code if not provided
    - Normalizes phone and email
    - Creates identity records for deduplication
    """
    # Override org_id from token (multi-tenant security)
    data.org_id = current_user.org_id
    
    customer = customer_service.create(
        db,
        obj_in=data,
        org_id=current_user.org_id,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer),
        message="Customer created successfully"
    )


@router.get("", response_model=APIResponse[List[CustomerListItem]])
async def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_stage: Optional[str] = None,
    owner_user_id: Optional[UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """
    List customers with pagination, filtering, search, and VISIBILITY FILTER.
    
    - Automatically filters by organization (multi-tenant)
    - Visibility filter: Sales sees own, Team Lead sees team, etc.
    - Supports search by name, phone, email, code
    - Excludes soft-deleted records by default
    """
    skip = (page - 1) * limit
    filters = {}
    
    if status:
        filters["status"] = status
    if customer_stage:
        filters["customer_stage"] = customer_stage
    if owner_user_id:
        filters["owner_user_id"] = owner_user_id
    
    search_fields = ["full_name", "primary_phone", "primary_email", "customer_code"]
    
    customers, total = customer_service.get_multi(
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
    
    pagination = customer_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[CustomerListItem.model_validate(c) for c in customers],
        meta=pagination
    )


@router.get("/{customer_id}", response_model=APIResponse[CustomerResponse])
async def get_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Get a single customer by ID with ACCESS CHECK."""
    customer = customer_service.get(
        db,
        id=customer_id,
        org_id=current_user.org_id
    )
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # ACCESS CHECK
    if not customer_service.can_access_entity(db, entity=customer, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to view this customer"
        )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer)
    )


@router.put("/{customer_id}", response_model=APIResponse[CustomerResponse])
async def update_customer(
    customer_id: UUID,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "edit"))
):
    """Update a customer with ACCESS CHECK."""
    customer = customer_service.get(db, id=customer_id, org_id=current_user.org_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # ACCESS CHECK
    if not customer_service.can_access_entity(db, entity=customer, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to edit this customer"
        )
    
    updated_customer = customer_service.update(
        db,
        id=customer_id,
        org_id=current_user.org_id,
        obj_in=data,
        updated_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(updated_customer),
        message="Customer updated successfully"
    )


@router.delete("/{customer_id}", response_model=APIResponse)
async def delete_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "delete"))
):
    """
    Soft delete a customer with ACCESS CHECK.
    
    - Sets deleted_at timestamp instead of hard delete
    - Customer can be restored later
    """
    # Get customer first to check access
    customer = customer_service.get(db, id=customer_id, org_id=current_user.org_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # ACCESS CHECK
    if not customer_service.can_access_entity(db, entity=customer, user_id=current_user.id, org_id=current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: not authorized to delete this customer"
        )
    
    success = customer_service.delete(
        db,
        id=customer_id,
        org_id=current_user.org_id,
        deleted_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        message="Customer deleted successfully"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH & DEDUPLICATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/search/by-phone", response_model=APIResponse[Optional[CustomerResponse]])
async def find_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Find customer by phone number (for deduplication)."""
    customer = customer_service.find_by_phone(
        db,
        org_id=current_user.org_id,
        phone=phone
    )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer) if customer else None
    )


@router.get("/search/by-email", response_model=APIResponse[Optional[CustomerResponse]])
async def find_by_email(
    email: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Find customer by email (for deduplication)."""
    customer = customer_service.find_by_email(
        db,
        org_id=current_user.org_id,
        email=email
    )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer) if customer else None
    )


@router.get("/search/duplicates", response_model=APIResponse[List[CustomerResponse]])
async def find_duplicates(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Find potential duplicate customers."""
    if not phone and not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least phone or email required"
        )
    
    duplicates = customer_service.find_duplicates(
        db,
        org_id=current_user.org_id,
        phone=phone,
        email=email
    )
    
    return APIResponse(
        success=True,
        data=[CustomerResponse.model_validate(c) for c in duplicates]
    )


# ═══════════════════════════════════════════════════════════════════════════════
# OWNERSHIP & ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{customer_id}/assign", response_model=APIResponse[CustomerResponse])
async def assign_customer(
    customer_id: UUID,
    owner_user_id: Optional[UUID] = None,
    owner_unit_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "assign"))
):
    """Assign customer to a user or unit."""
    customer = customer_service.assign_owner(
        db,
        id=customer_id,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
        owner_unit_id=owner_unit_id,
        assigned_by=current_user.id
    )
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer),
        message="Customer assigned successfully"
    )


@router.get("/by-owner/{owner_user_id}", response_model=APIResponse[List[CustomerListItem]])
async def get_customers_by_owner(
    owner_user_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Get customers owned by a specific user."""
    skip = (page - 1) * limit
    
    customers, total = customer_service.get_by_owner(
        db,
        org_id=current_user.org_id,
        owner_user_id=owner_user_id,
        skip=skip,
        limit=limit
    )
    
    pagination = customer_service.build_pagination_meta(total, page, limit)
    
    return APIResponse(
        success=True,
        data=[CustomerListItem.model_validate(c) for c in customers],
        meta=pagination
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.patch("/{customer_id}/stage", response_model=APIResponse[CustomerResponse])
async def update_customer_stage(
    customer_id: UUID,
    new_stage: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "edit"))
):
    """Update customer lifecycle stage."""
    customer = customer_service.update_stage(
        db,
        id=customer_id,
        org_id=current_user.org_id,
        new_stage=new_stage,
        updated_by=current_user.id
    )
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer),
        message=f"Stage updated to {new_stage}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# IDENTITY MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{customer_id}/identities", response_model=APIResponse[CustomerIdentityResponse])
async def add_customer_identity(
    customer_id: UUID,
    identity_type: str,
    value: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "edit"))
):
    """Add a new identity to customer (phone, email, zalo, etc.)."""
    identity = customer_service.add_identity(
        db,
        customer_id=customer_id,
        org_id=current_user.org_id,
        identity_type=identity_type,
        value=value,
        created_by=current_user.id
    )
    
    if not identity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer not found or identity already exists"
        )
    
    return APIResponse(
        success=True,
        data=CustomerIdentityResponse.model_validate(identity),
        message="Identity added successfully"
    )


@router.get("/{customer_id}/identities", response_model=APIResponse[List[CustomerIdentityResponse]])
async def get_customer_identities(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Get all identities for a customer."""
    identities = customer_service.get_identities(
        db,
        customer_id=customer_id,
        org_id=current_user.org_id
    )
    
    return APIResponse(
        success=True,
        data=[CustomerIdentityResponse.model_validate(i) for i in identities]
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ADDRESS MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{customer_id}/addresses", response_model=APIResponse[CustomerAddressResponse])
async def add_customer_address(
    customer_id: UUID,
    data: CustomerAddressCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "edit"))
):
    """Add an address to customer."""
    # Ensure customer_id and org_id match
    data.customer_id = customer_id
    data.org_id = current_user.org_id
    
    address = customer_service.add_address(
        db,
        obj_in=data,
        created_by=current_user.id
    )
    
    return APIResponse(
        success=True,
        data=CustomerAddressResponse.model_validate(address),
        message="Address added successfully"
    )


@router.get("/{customer_id}/addresses", response_model=APIResponse[List[CustomerAddressResponse]])
async def get_customer_addresses(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "view"))
):
    """Get all addresses for a customer."""
    addresses = customer_service.get_addresses(
        db,
        customer_id=customer_id,
        org_id=current_user.org_id
    )
    
    return APIResponse(
        success=True,
        data=[CustomerAddressResponse.model_validate(a) for a in addresses]
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS
# ═══════════════════════════════════════════════════════════════════════════════

@router.patch("/{customer_id}/stats", response_model=APIResponse[CustomerResponse])
async def update_customer_stats(
    customer_id: UUID,
    deals: int = 0,
    revenue: int = 0,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "edit"))
):
    """Update customer statistics (typically called by system after deal closes)."""
    customer = customer_service.increment_stats(
        db,
        id=customer_id,
        org_id=current_user.org_id,
        deals=deals,
        revenue=revenue
    )
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer)
    )


# ═══════════════════════════════════════════════════════════════════════════════
# RESTORE (Soft Delete)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{customer_id}/restore", response_model=APIResponse[CustomerResponse])
async def restore_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("customers", "delete"))
):
    """Restore a soft-deleted customer."""
    customer = customer_service.restore(
        db,
        id=customer_id,
        org_id=current_user.org_id,
        restored_by=current_user.id
    )
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return APIResponse(
        success=True,
        data=CustomerResponse.model_validate(customer),
        message="Customer restored successfully"
    )
