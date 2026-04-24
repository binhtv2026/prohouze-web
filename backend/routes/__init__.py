"""
ProHouzing API Routes
"""

from .rbac_router import router as rbac_router
from .product_router import router as product_router

__all__ = ["rbac_router", "product_router"]
