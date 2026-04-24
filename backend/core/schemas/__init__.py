"""
ProHouzing Core Schemas Package
Version: 1.0.0

All Pydantic DTOs for API request/response.
"""

# Base schemas
from .base import (
    BaseSchema,
    PaginationMeta,
    APIResponse,
    APIError,
    APIErrorResponse,
    TimestampSchema,
    AuditSchema,
    EntityBaseSchema,
    OrgScopedSchema,
    SoftDeleteSchema,
    PaginationParams,
    SortParams,
    FilterParams,
    ListQueryParams,
    IDRef,
    NamedIDRef,
    CodedIDRef,
    BatchDeleteRequest,
    BatchUpdateRequest,
    BatchOperationResult,
    AssignRequest,
    TransferRequest,
)

# Organization schemas
from .organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationListItem,
    OrganizationalUnitCreate,
    OrganizationalUnitUpdate,
    OrganizationalUnitResponse,
    OrganizationalUnitListItem,
    UnitRef,
)

# User schemas
from .user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListItem,
    UserRef,
    UserMembershipCreate,
    UserMembershipUpdate,
    UserMembershipResponse,
)

# Customer schemas
from .customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListItem,
    CustomerRef,
    CustomerIdentityCreate,
    CustomerIdentityResponse,
    CustomerAddressCreate,
    CustomerAddressResponse,
)

# Product schemas
from .product import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListItem,
    ProjectRef,
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListItem,
    ProductRef,
)

# Lead schemas
from .lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadListItem,
    LeadConvertRequest,
)

# Deal schemas
from .deal import (
    DealCreate,
    DealUpdate,
    DealResponse,
    DealListItem,
    DealRef,
    DealStageChangeRequest,
)

# Transaction schemas
from .transaction import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    DepositCreate,
    DepositResponse,
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListItem,
)

# Commission schemas
from .commission import (
    CommissionEntryCreate,
    CommissionEntryResponse,
    CommissionEntryListItem,
    CommissionSummary,
    CommissionRuleCreate,
    CommissionRuleResponse,
)


__all__ = [
    # Base
    "BaseSchema",
    "PaginationMeta",
    "APIResponse",
    "APIError",
    "APIErrorResponse",
    "TimestampSchema",
    "AuditSchema",
    "EntityBaseSchema",
    "OrgScopedSchema",
    "SoftDeleteSchema",
    "PaginationParams",
    "SortParams",
    "FilterParams",
    "ListQueryParams",
    "IDRef",
    "NamedIDRef",
    "CodedIDRef",
    "BatchDeleteRequest",
    "BatchUpdateRequest",
    "BatchOperationResult",
    "AssignRequest",
    "TransferRequest",
    # Organization
    "OrganizationCreate",
    "OrganizationUpdate",
    "OrganizationResponse",
    "OrganizationListItem",
    "OrganizationalUnitCreate",
    "OrganizationalUnitUpdate",
    "OrganizationalUnitResponse",
    "OrganizationalUnitListItem",
    "UnitRef",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserListItem",
    "UserRef",
    "UserMembershipCreate",
    "UserMembershipUpdate",
    "UserMembershipResponse",
    # Customer
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "CustomerListItem",
    "CustomerRef",
    "CustomerIdentityCreate",
    "CustomerIdentityResponse",
    "CustomerAddressCreate",
    "CustomerAddressResponse",
    # Product
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectListItem",
    "ProjectRef",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductListItem",
    "ProductRef",
    # Lead
    "LeadCreate",
    "LeadUpdate",
    "LeadResponse",
    "LeadListItem",
    "LeadConvertRequest",
    # Deal
    "DealCreate",
    "DealUpdate",
    "DealResponse",
    "DealListItem",
    "DealRef",
    "DealStageChangeRequest",
    # Transaction
    "BookingCreate",
    "BookingUpdate",
    "BookingResponse",
    "DepositCreate",
    "DepositResponse",
    "ContractCreate",
    "ContractUpdate",
    "ContractResponse",
    "PaymentCreate",
    "PaymentUpdate",
    "PaymentResponse",
    "PaymentListItem",
    # Commission
    "CommissionEntryCreate",
    "CommissionEntryResponse",
    "CommissionEntryListItem",
    "CommissionSummary",
    "CommissionRuleCreate",
    "CommissionRuleResponse",
]
