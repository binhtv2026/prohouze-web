"""
ProHouzing Core Services
Version: 1.1.0

Service layer for PostgreSQL Master Data Model.

Updates v1.1:
- Added AuditService for activity logging
- Added ProductLockService for concurrency control
- Added PermissionService for advanced RBAC
- Added ValidationService for business rules
"""

from .base import BaseService
from .customer import CustomerService, customer_service
from .lead import LeadService, lead_service
from .deal import DealService, deal_service
from .booking import BookingService, booking_service
from .contract import ContractService, contract_service
from .payment import PaymentService, payment_service
from .audit import AuditService, AuditAction, audit_service
from .product_lock import (
    ProductLockService, 
    ProductLockError,
    ProductNotAvailableError,
    ProductAlreadyBookedError,
    ProductAlreadySoldError,
    ConcurrencyError,
    product_lock_service
)
from .permission import (
    PermissionService,
    PermissionScope,
    AccessLevel,
    permission_service
)
from .validation import (
    ValidationService,
    ValidationError,
    ValidationResult,
    validation_service
)

__all__ = [
    # Base
    "BaseService",
    
    # Core Services
    "CustomerService",
    "LeadService", 
    "DealService",
    "BookingService",
    "ContractService",
    "PaymentService",
    
    # New Services (v1.1)
    "AuditService",
    "AuditAction",
    "ProductLockService",
    "ProductLockError",
    "ProductNotAvailableError",
    "ProductAlreadyBookedError",
    "ProductAlreadySoldError",
    "ConcurrencyError",
    "PermissionService",
    "PermissionScope",
    "AccessLevel",
    "ValidationService",
    "ValidationError",
    "ValidationResult",
    
    # Singleton instances
    "customer_service",
    "lead_service",
    "deal_service",
    "booking_service",
    "contract_service",
    "payment_service",
    "audit_service",
    "product_lock_service",
    "permission_service",
    "validation_service",
]
