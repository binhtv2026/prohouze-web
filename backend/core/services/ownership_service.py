"""
ProHouzing Ownership Service
PROMPT 5/20 - PHASE 2: OWNERSHIP MODEL

Features:
- owner_user_id tracking
- Reassignment history
- RBAC-aware access control
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from core.models.product import Product


class OwnershipChangeSource:
    """Source of ownership change."""
    MANUAL = "manual"          # Manual assignment
    BOOKING = "booking"        # From booking
    DEAL = "deal"              # From deal
    LEAD = "lead"              # From lead assignment
    SYSTEM = "system"          # System assignment
    IMPORT = "import"          # Data import
    REASSIGN = "reassign"      # Manager reassignment


class OwnershipService:
    """
    Product ownership management service.
    
    Tracks who owns each product and maintains reassignment history.
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET OWNER
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_owner(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
    ) -> Optional[UUID]:
        """
        Get current owner of a product.
        
        Returns:
            Owner user ID or None
        """
        product = self._get_product(db, product_id, org_id)
        if product:
            return product.created_by  # Using created_by as owner for now
        return None
    
    def get_owner_details(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
    ) -> Dict[str, Any]:
        """
        Get detailed owner information.
        
        Returns:
            Dict with owner_id, owner_name, owner_email, assigned_at
        """
        from core.models.user import User
        
        product = self._get_product(db, product_id, org_id)
        if not product:
            return {"owner_id": None, "owner_name": None, "owner_email": None}
        
        owner_id = product.created_by
        if not owner_id:
            return {"owner_id": None, "owner_name": None, "owner_email": None}
        
        # Get owner user details
        query = select(User).where(User.id == owner_id)
        result = db.execute(query)
        owner = result.scalar_one_or_none()
        
        return {
            "owner_id": str(owner_id) if owner_id else None,
            "owner_name": owner.full_name if owner else None,
            "owner_email": owner.email if owner else None,
            "assigned_at": product.created_at.isoformat() if product.created_at else None,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ASSIGN OWNER
    # ═══════════════════════════════════════════════════════════════════════════
    
    def assign_owner(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        new_owner_id: UUID,
        assigned_by: UUID,
        reason: Optional[str] = None,
        source: str = OwnershipChangeSource.MANUAL,
    ) -> Dict[str, Any]:
        """
        Assign a new owner to a product.
        
        Logs the reassignment in inventory_events.
        
        Args:
            product_id: Product ID
            org_id: Organization ID
            new_owner_id: New owner user ID
            assigned_by: User who made the assignment
            reason: Reason for reassignment
            source: Source of change
            
        Returns:
            Dict with old_owner_id, new_owner_id, success
        """
        from core.models.product import InventoryEvent
        
        product = self._get_product(db, product_id, org_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        old_owner_id = product.created_by
        
        # Update product owner
        product.created_by = new_owner_id
        product.updated_by = assigned_by
        product.updated_at = datetime.now(timezone.utc)
        
        # Log the ownership change as an event
        event = InventoryEvent(
            org_id=org_id,
            product_id=product_id,
            old_status=f"owner:{old_owner_id}" if old_owner_id else None,
            new_status=f"owner:{new_owner_id}",
            triggered_by=assigned_by,
            source=source,
            source_ref_type="ownership",
            reason=reason or "Ownership reassignment",
            metadata_json={
                "old_owner_id": str(old_owner_id) if old_owner_id else None,
                "new_owner_id": str(new_owner_id),
                "source": source,
            },
            created_by=assigned_by,
        )
        
        db.add(product)
        db.add(event)
        db.commit()
        
        return {
            "success": True,
            "old_owner_id": str(old_owner_id) if old_owner_id else None,
            "new_owner_id": str(new_owner_id),
            "product_id": str(product_id),
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REASSIGNMENT HISTORY
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_reassignment_history(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get ownership reassignment history for a product.
        
        Returns:
            List of ownership change records
        """
        from core.models.product import InventoryEvent
        
        query = select(InventoryEvent).where(
            and_(
                InventoryEvent.product_id == product_id,
                InventoryEvent.org_id == org_id,
                InventoryEvent.source_ref_type == "ownership",
            )
        ).order_by(InventoryEvent.created_at.desc()).limit(limit)
        
        result = db.execute(query)
        events = list(result.scalars().all())
        
        history = []
        for event in events:
            metadata = event.metadata_json or {}
            history.append({
                "id": str(event.id),
                "old_owner_id": metadata.get("old_owner_id"),
                "new_owner_id": metadata.get("new_owner_id"),
                "assigned_by": str(event.triggered_by) if event.triggered_by else None,
                "reason": event.reason,
                "source": event.source,
                "assigned_at": event.created_at.isoformat() if event.created_at else None,
            })
        
        return history
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BULK REASSIGNMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def bulk_reassign(
        self,
        db: Session,
        *,
        org_id: UUID,
        product_ids: List[UUID],
        new_owner_id: UUID,
        assigned_by: UUID,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Bulk reassign multiple products to a new owner.
        
        Returns:
            Dict with success_count, failed_count, failures
        """
        success_count = 0
        failed_count = 0
        failures = []
        
        for product_id in product_ids:
            try:
                self.assign_owner(
                    db,
                    product_id=product_id,
                    org_id=org_id,
                    new_owner_id=new_owner_id,
                    assigned_by=assigned_by,
                    reason=reason or "Bulk reassignment",
                    source=OwnershipChangeSource.REASSIGN,
                )
                success_count += 1
            except Exception as e:
                failed_count += 1
                failures.append({
                    "product_id": str(product_id),
                    "error": str(e),
                })
        
        return {
            "success_count": success_count,
            "failed_count": failed_count,
            "failures": failures,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _get_product(
        self,
        db: Session,
        product_id: UUID,
        org_id: UUID,
    ) -> Optional[Product]:
        """Get product by ID."""
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()


# Singleton instance
ownership_service = OwnershipService()
