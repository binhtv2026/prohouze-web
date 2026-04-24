"""
ProHouzing Core Schemas - Base DTOs
Version: 1.0.0

Base Pydantic schemas for API request/response.
"""

from datetime import datetime, date
from typing import Optional, List, Any, Generic, TypeVar
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# Generic type for data
T = TypeVar('T')


# ═══════════════════════════════════════════════════════════════════════════════
# COMMON CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STANDARD API RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int = 1
    limit: int = 20
    total: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    success: bool = True
    data: Optional[T] = None
    meta: Optional[PaginationMeta] = None
    errors: List[dict] = Field(default_factory=list)
    message: Optional[str] = None


class APIError(BaseModel):
    """API error detail"""
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[dict] = None


class APIErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    data: None = None
    errors: List[APIError]
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# BASE ENTITY SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class TimestampSchema(BaseSchema):
    """Timestamp fields"""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AuditSchema(TimestampSchema):
    """Audit fields"""
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None


class EntityBaseSchema(AuditSchema):
    """Base for all entities with ID"""
    id: UUID


class OrgScopedSchema(EntityBaseSchema):
    """Base for organization-scoped entities"""
    org_id: UUID


class SoftDeleteSchema(OrgScopedSchema):
    """Base for entities with soft delete"""
    deleted_at: Optional[datetime] = None
    status: str = "active"


# ═══════════════════════════════════════════════════════════════════════════════
# COMMON QUERY SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class PaginationParams(BaseModel):
    """Pagination query parameters"""
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class SortParams(BaseModel):
    """Sorting query parameters"""
    sort_by: Optional[str] = None
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class FilterParams(BaseModel):
    """Common filter parameters"""
    status: Optional[str] = None
    search: Optional[str] = None
    created_from: Optional[date] = None
    created_to: Optional[date] = None


class ListQueryParams(PaginationParams, SortParams, FilterParams):
    """Combined list query parameters"""
    pass


# ═══════════════════════════════════════════════════════════════════════════════
# ID REFERENCE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class IDRef(BaseModel):
    """Simple ID reference"""
    id: UUID


class NamedIDRef(BaseModel):
    """ID reference with name"""
    id: UUID
    name: str


class CodedIDRef(BaseModel):
    """ID reference with code"""
    id: UUID
    code: str
    name: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# BATCH OPERATION SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class BatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[UUID]


class BatchUpdateRequest(BaseModel):
    """Batch update request"""
    ids: List[UUID]
    data: dict


class BatchOperationResult(BaseModel):
    """Batch operation result"""
    total: int
    successful: int
    failed: int
    errors: List[dict] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# ASSIGNMENT SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class AssignRequest(BaseModel):
    """Request to assign entity to user/unit"""
    assignee_user_id: Optional[UUID] = None
    assignee_unit_id: Optional[UUID] = None
    assignment_type: str = "owner"
    notes: Optional[str] = None


class TransferRequest(BaseModel):
    """Request to transfer entity ownership"""
    new_owner_user_id: Optional[UUID] = None
    new_owner_unit_id: Optional[UUID] = None
    transfer_notes: Optional[str] = None
