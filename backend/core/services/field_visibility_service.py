"""
ProHouzing Field Visibility Service
PROMPT 5/20 - PHASE 2: PUBLIC vs INTERNAL MAPPING

Features:
- Field visibility control
- Public vs Internal data mapping
- Hide sensitive fields from public API
"""

from typing import Optional, List, Dict, Any, Set
from uuid import UUID
from decimal import Decimal


class FieldVisibility:
    """Field visibility levels."""
    PUBLIC = "public"       # Visible to everyone (customers, portal)
    INTERNAL = "internal"   # Visible to staff only
    ADMIN = "admin"         # Visible to admin only
    SYSTEM = "system"       # Never exposed via API


# ═══════════════════════════════════════════════════════════════════════════
# FIELD CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

# Product fields and their visibility
PRODUCT_FIELD_VISIBILITY: Dict[str, str] = {
    # Always public
    "id": FieldVisibility.PUBLIC,
    "product_code": FieldVisibility.PUBLIC,
    "title": FieldVisibility.PUBLIC,
    "product_type": FieldVisibility.PUBLIC,
    "bedroom_count": FieldVisibility.PUBLIC,
    "bathroom_count": FieldVisibility.PUBLIC,
    "floor_no": FieldVisibility.PUBLIC,
    "unit_no": FieldVisibility.PUBLIC,
    "land_area": FieldVisibility.PUBLIC,
    "built_area": FieldVisibility.PUBLIC,
    "carpet_area": FieldVisibility.PUBLIC,
    "direction": FieldVisibility.PUBLIC,
    "view": FieldVisibility.PUBLIC,
    "images": FieldVisibility.PUBLIC,
    "floor_plan_url": FieldVisibility.PUBLIC,
    "video_url": FieldVisibility.PUBLIC,
    "virtual_tour_url": FieldVisibility.PUBLIC,
    "features": FieldVisibility.PUBLIC,
    "description": FieldVisibility.PUBLIC,
    
    # Public but derived/computed
    "inventory_status": FieldVisibility.PUBLIC,  # But shown as simplified status
    "availability_display": FieldVisibility.PUBLIC,  # Derived: "Còn hàng", "Đã bán"
    
    # Pricing - conditional visibility
    "list_price": FieldVisibility.PUBLIC,       # Public price
    "sale_price": FieldVisibility.INTERNAL,     # Internal only - negotiated price
    "price_per_sqm": FieldVisibility.PUBLIC,
    
    # Internal only
    "external_code": FieldVisibility.INTERNAL,
    "business_status": FieldVisibility.INTERNAL,
    "availability_status": FieldVisibility.INTERNAL,
    "legal_type": FieldVisibility.INTERNAL,
    "handover_standard": FieldVisibility.INTERNAL,
    "current_holder_type": FieldVisibility.INTERNAL,
    "current_holder_id": FieldVisibility.INTERNAL,
    "released_for_sale_at": FieldVisibility.INTERNAL,
    "sold_at": FieldVisibility.INTERNAL,
    "locked_until": FieldVisibility.INTERNAL,
    "lock_reason": FieldVisibility.INTERNAL,
    "locked_by": FieldVisibility.INTERNAL,
    "metadata_json": FieldVisibility.INTERNAL,
    
    # Admin only
    "version": FieldVisibility.ADMIN,
    "hold_started_at": FieldVisibility.ADMIN,
    "hold_expires_at": FieldVisibility.ADMIN,
    "hold_by_user_id": FieldVisibility.ADMIN,
    "hold_reason": FieldVisibility.ADMIN,
    "current_booking_id": FieldVisibility.ADMIN,
    "current_deal_id": FieldVisibility.ADMIN,
    "current_contract_id": FieldVisibility.ADMIN,
    
    # System - never expose
    "org_id": FieldVisibility.SYSTEM,
    "project_id": FieldVisibility.SYSTEM,
    "project_structure_id": FieldVisibility.SYSTEM,
    "created_by": FieldVisibility.SYSTEM,
    "updated_by": FieldVisibility.SYSTEM,
    "created_at": FieldVisibility.INTERNAL,
    "updated_at": FieldVisibility.SYSTEM,
    "deleted_at": FieldVisibility.SYSTEM,
    "status": FieldVisibility.SYSTEM,
}

# Simplified public status mapping
INVENTORY_STATUS_PUBLIC_MAPPING: Dict[str, str] = {
    "draft": "Sắp mở bán",
    "not_open": "Sắp mở bán",
    "available": "Còn hàng",
    "hold": "Đang giao dịch",
    "booking_pending": "Đang giao dịch",
    "booked": "Đã đặt cọc",
    "reserved": "Đã đặt cọc",
    "sold": "Đã bán",
    "blocked": "Không khả dụng",
    "inactive": "Không khả dụng",
}

INVENTORY_STATUS_PUBLIC_CODE: Dict[str, str] = {
    "draft": "coming_soon",
    "not_open": "coming_soon",
    "available": "available",
    "hold": "in_transaction",
    "booking_pending": "in_transaction",
    "booked": "reserved",
    "reserved": "reserved",
    "sold": "sold",
    "blocked": "unavailable",
    "inactive": "unavailable",
}


class FieldVisibilityService:
    """
    Service for managing field visibility and data mapping.
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FILTER PRODUCT DATA
    # ═══════════════════════════════════════════════════════════════════════════
    
    def filter_product_for_public(
        self,
        product_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Filter product data for public API.
        
        - Removes internal/admin/system fields
        - Maps inventory_status to simplified public status
        - Hides sensitive pricing
        
        Args:
            product_data: Full product dict
            
        Returns:
            Filtered product dict for public consumption
        """
        filtered = {}
        
        for field, value in product_data.items():
            visibility = PRODUCT_FIELD_VISIBILITY.get(field, FieldVisibility.SYSTEM)
            
            if visibility == FieldVisibility.PUBLIC:
                # Transform certain fields
                if field == "inventory_status" and value:
                    filtered["status_display"] = INVENTORY_STATUS_PUBLIC_MAPPING.get(value, "Không khả dụng")
                    filtered["status_code"] = INVENTORY_STATUS_PUBLIC_CODE.get(value, "unavailable")
                    filtered["is_available"] = value == "available"
                else:
                    filtered[field] = self._serialize_value(value)
        
        return filtered
    
    def filter_product_for_internal(
        self,
        product_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Filter product data for internal API (staff).
        
        - Removes admin/system fields
        - Includes internal fields
        
        Args:
            product_data: Full product dict
            
        Returns:
            Filtered product dict for internal use
        """
        filtered = {}
        allowed_levels = {FieldVisibility.PUBLIC, FieldVisibility.INTERNAL}
        
        for field, value in product_data.items():
            visibility = PRODUCT_FIELD_VISIBILITY.get(field, FieldVisibility.SYSTEM)
            
            if visibility in allowed_levels:
                filtered[field] = self._serialize_value(value)
        
        return filtered
    
    def filter_product_for_admin(
        self,
        product_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Filter product data for admin API.
        
        - Includes public, internal, and admin fields
        - Still hides system fields
        
        Args:
            product_data: Full product dict
            
        Returns:
            Filtered product dict for admin use
        """
        filtered = {}
        allowed_levels = {FieldVisibility.PUBLIC, FieldVisibility.INTERNAL, FieldVisibility.ADMIN}
        
        for field, value in product_data.items():
            visibility = PRODUCT_FIELD_VISIBILITY.get(field, FieldVisibility.SYSTEM)
            
            if visibility in allowed_levels:
                filtered[field] = self._serialize_value(value)
        
        return filtered
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BULK FILTER
    # ═══════════════════════════════════════════════════════════════════════════
    
    def filter_products_for_public(
        self,
        products: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Filter multiple products for public API."""
        return [self.filter_product_for_public(p) for p in products]
    
    def filter_products_for_internal(
        self,
        products: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Filter multiple products for internal API."""
        return [self.filter_product_for_internal(p) for p in products]
    
    def filter_products_for_admin(
        self,
        products: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Filter multiple products for admin API."""
        return [self.filter_product_for_admin(p) for p in products]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET FIELD CONFIGURATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_public_fields(self) -> List[str]:
        """Get list of public fields."""
        return [f for f, v in PRODUCT_FIELD_VISIBILITY.items() if v == FieldVisibility.PUBLIC]
    
    def get_internal_fields(self) -> List[str]:
        """Get list of internal fields."""
        return [f for f, v in PRODUCT_FIELD_VISIBILITY.items() if v == FieldVisibility.INTERNAL]
    
    def get_admin_fields(self) -> List[str]:
        """Get list of admin fields."""
        return [f for f, v in PRODUCT_FIELD_VISIBILITY.items() if v == FieldVisibility.ADMIN]
    
    def get_field_visibility_config(self) -> Dict[str, Dict[str, Any]]:
        """Get full field visibility configuration."""
        return {
            field: {
                "visibility": visibility,
                "is_public": visibility == FieldVisibility.PUBLIC,
                "is_internal": visibility == FieldVisibility.INTERNAL,
                "is_admin": visibility == FieldVisibility.ADMIN,
            }
            for field, visibility in PRODUCT_FIELD_VISIBILITY.items()
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _serialize_value(self, value: Any) -> Any:
        """Serialize value for JSON response."""
        if value is None:
            return None
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, Decimal):
            return float(value)
        if hasattr(value, 'isoformat'):  # datetime/date
            return value.isoformat()
        return value


# Singleton instance
field_visibility_service = FieldVisibilityService()
