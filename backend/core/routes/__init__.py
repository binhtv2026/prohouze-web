"""
ProHouzing API v2 Routes
Version: 2.2.0 (Prompt 4/20 - Canonical RBAC)

Master Data Model REST API endpoints.
All routes enforce multi-tenancy via organization_id.

Updates v2.2:
- Added RBAC v2 routes (Prompt 4/20)

Updates v2.1:
- Added master data routes (Prompt 3/20)

Updates v2.0:
- Added timeline and events routes (Prompt 2/18)
- Added PostgreSQL auth routes
"""

from fastapi import APIRouter

from .customers import router as customer_router
from .leads import router as lead_router
from .deals import router as deal_router
from .bookings import router as booking_router
from .contracts import router as contract_router
from .payments import router as payment_router
from .migration import router as migration_router
from .commissions import router as commission_router
from .products import router as product_router
from .timeline import router as timeline_router
from .auth import router as auth_router
from .master_data import router as master_data_router
from .tags import router as tags_router
from .attributes import router as attributes_router
from .forms import router as forms_router
from .rbac_v2 import router as rbac_v2_router
from .company_rbac import router as company_rbac_router

# Create v2 API router with prefix
api_v2_router = APIRouter(prefix="/v2")

# Include all sub-routers
api_v2_router.include_router(auth_router)  # Auth first
api_v2_router.include_router(rbac_v2_router)  # RBAC Config (Prompt 4/20)
api_v2_router.include_router(company_rbac_router)  # Company RBAC (Prompt 4/20 Multi-Company)
api_v2_router.include_router(master_data_router)  # Master Data (Prompt 3/20)
api_v2_router.include_router(tags_router)  # Tags (Prompt 3/20 - Phase 2)
api_v2_router.include_router(attributes_router)  # Attributes (Prompt 3/20 - Phase 3)
api_v2_router.include_router(forms_router)  # Forms (Prompt 3/20 - Phase 4)
api_v2_router.include_router(customer_router)
api_v2_router.include_router(lead_router)
api_v2_router.include_router(deal_router)
api_v2_router.include_router(booking_router)
api_v2_router.include_router(contract_router)
api_v2_router.include_router(payment_router)
api_v2_router.include_router(migration_router)
api_v2_router.include_router(commission_router)
api_v2_router.include_router(product_router)
api_v2_router.include_router(timeline_router)

__all__ = [
    "api_v2_router",
    "auth_router",
    "rbac_v2_router",
    "company_rbac_router",
    "master_data_router",
    "tags_router",
    "attributes_router",
    "forms_router",
    "customer_router",
    "lead_router",
    "deal_router",
    "booking_router",
    "contract_router",
    "payment_router",
    "migration_router",
    "commission_router",
    "product_router",
    "timeline_router",
]
