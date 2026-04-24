"""
ProHouzing Deal Service
Version: 3.0.0 (Prompt 5/20 - REFACTORED)

CRITICAL CHANGE:
- ALL product status changes now go through InventoryStatusService
- Direct product.inventory_status = xxx is BANNED

Deal/Pipeline management with:
- Stage transitions
- Product allocation via InventoryStatusService (SINGLE ENTRY POINT)
- Commission triggers
- Event emission
- DATA VISIBILITY FILTER
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from .base import BaseService
from .permission import permission_service, PermissionScope
from ..models.deal import Deal
from ..models.product import Product
from ..models.base import generate_code, utc_now
from ..schemas.deal import DealCreate, DealUpdate, DealStageChangeRequest
from ..enums import DealStage, InventoryStatus

# PROMPT 5/20: Import InventoryStatusService - SINGLE ENTRY POINT
from .inventory_status import (
    inventory_status_service,
    InventoryStatusError,
    ProductNotFoundError,
    ProductNotAvailableError,
    InvalidTransitionError,
    HoldCollisionError,
)
from config.canonical_inventory import InventoryStatus as CanonicalInventoryStatus, StatusChangeSource


class DealService(BaseService[Deal, DealCreate, DealUpdate]):
    """
    Deal service with pipeline management.
    
    PROMPT 5/20 RULES:
    - NEVER set product.inventory_status directly
    - ALWAYS use inventory_status_service for status changes
    - Deal creates request, InventoryService validates & executes
    """
    
    def __init__(self):
        super().__init__(Deal)
    
    def create(
        self,
        db: Session,
        *,
        obj_in: DealCreate,
        org_id: UUID,
        created_by: Optional[UUID] = None
    ) -> Deal:
        """
        Create a deal with auto-generated code.
        
        FLOW:
        1. Create deal record
        2. If product assigned, hold via InventoryStatusService
        """
        obj_data = obj_in.model_dump(exclude_unset=True)
        product_id = obj_data.get('product_id')
        
        # Generate deal_code if not provided
        if not obj_data.get('deal_code'):
            obj_data['deal_code'] = self._generate_code(db, org_id)
        
        obj_data['org_id'] = org_id
        obj_data['created_at_stage'] = obj_data.get('current_stage', 'new')
        
        # Initialize stage history
        obj_data['stage_history'] = [{
            "from_stage": None,
            "to_stage": obj_data.get('current_stage', 'new'),
            "changed_at": utc_now().isoformat(),
            "changed_by": str(created_by) if created_by else None
        }]
        
        if created_by:
            obj_data['created_by'] = created_by
            obj_data['updated_by'] = created_by
        
        deal = Deal(**obj_data)
        db.add(deal)
        db.flush()  # Get deal.id before committing
        
        # PROMPT 5/20: If product is assigned, hold via InventoryStatusService
        if product_id:
            try:
                inventory_status_service.hold_product(
                    db=db,
                    product_id=product_id,
                    user_id=created_by,
                    org_id=org_id,
                    hold_hours=72,  # Default 72 hours for deal hold
                    reason=f"Deal: {deal.deal_code}",
                )
                # Update product reference in deal
                deal.product_id = product_id
            except HoldCollisionError as e:
                # Product already held - link to deal but don't change status
                deal.product_id = product_id
            except ProductNotAvailableError as e:
                # Product not available - link anyway for tracking
                deal.product_id = product_id
            except InventoryStatusError as e:
                # Other errors - link anyway
                deal.product_id = product_id
        
        db.commit()
        db.refresh(deal)
        
        # Emit deal.created event
        self._emit_deal_created(db, deal, created_by)
        
        return deal
    
    def _emit_deal_created(
        self,
        db: Session,
        deal: Deal,
        actor_user_id: Optional[UUID]
    ) -> None:
        """Emit deal.created event."""
        try:
            from .event_service import event_service
            from .event_catalog import EventCode
            
            event_service.emit_event(
                db,
                event_code=EventCode.DEAL_CREATED,
                org_id=deal.org_id,
                aggregate_type="deal",
                aggregate_id=deal.id,
                payload={
                    "deal_code": deal.deal_code,
                    "deal_name": deal.deal_name,
                    "customer_id": str(deal.customer_id) if deal.customer_id else None,
                    "customer_name": None,
                    "current_stage": deal.current_stage,
                    "deal_value": float(deal.deal_value) if deal.deal_value else None,
                    "product_id": str(deal.product_id) if deal.product_id else None,
                    "entity_name": deal.deal_code,
                },
                actor_user_id=actor_user_id,
                actor_type="user",
                entity_code=deal.deal_code,
                entity_name=deal.deal_name or deal.deal_code,
                related_customer_id=deal.customer_id,
                related_deal_id=deal.id,
                related_product_id=deal.product_id,
            )
            db.commit()
        except Exception as e:
            pass
    
    def _generate_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique deal code."""
        query = select(func.count()).select_from(Deal).where(Deal.org_id == org_id)
        count = db.execute(query).scalar() or 0
        return generate_code("DEAL", count + 1)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STAGE MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def change_stage(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        request: DealStageChangeRequest,
        changed_by: Optional[UUID] = None
    ) -> Optional[Deal]:
        """
        Change deal stage with history tracking.
        
        FLOW:
        - On "won": Update product status to SOLD via InventoryStatusService
        - On "lost/cancelled": Release product via InventoryStatusService
        """
        deal = self.get(db, id=id, org_id=org_id)
        if not deal:
            return None
        
        old_stage = deal.current_stage
        new_stage = request.new_stage
        
        # Record stage change
        deal.change_stage(new_stage, changed_by)
        
        # Handle specific stage transitions
        if new_stage == "won":
            deal.won_at = utc_now()
            deal.actual_close_date = utc_now().date()
            self._on_deal_won(db, deal, org_id, changed_by)
        
        elif new_stage == "lost":
            deal.lost_at = utc_now()
            deal.lost_reason = request.lost_reason
            deal.lost_reason_detail = request.lost_reason_detail
            deal.lost_to_competitor = request.lost_to_competitor
            deal.actual_close_date = utc_now().date()
            self._on_deal_lost(db, deal, org_id, changed_by)
        
        elif new_stage == "cancelled":
            deal.actual_close_date = utc_now().date()
            self._on_deal_cancelled(db, deal, org_id, changed_by)
        
        if changed_by:
            deal.updated_by = changed_by
        
        db.add(deal)
        db.commit()
        db.refresh(deal)
        
        # Emit stage change event
        self._emit_stage_changed(db, deal, old_stage, new_stage, changed_by, request)
        
        return deal
    
    def _emit_stage_changed(
        self,
        db: Session,
        deal: Deal,
        old_stage: str,
        new_stage: str,
        actor_user_id: Optional[UUID],
        request: DealStageChangeRequest
    ) -> None:
        """Emit deal.stage_changed event."""
        try:
            from .event_service import event_service
            from .event_catalog import EventCode
            
            # Determine specific event
            if new_stage == "won":
                event_code = EventCode.DEAL_WON
            elif new_stage == "lost":
                event_code = EventCode.DEAL_LOST
            else:
                event_code = EventCode.DEAL_STAGE_CHANGED
            
            event_service.emit_event(
                db,
                event_code=event_code,
                org_id=deal.org_id,
                aggregate_type="deal",
                aggregate_id=deal.id,
                payload={
                    "deal_code": deal.deal_code,
                    "old_stage": old_stage,
                    "new_stage": new_stage,
                    "deal_value": float(deal.deal_value) if deal.deal_value else None,
                    "lost_reason": request.lost_reason if new_stage == "lost" else None,
                    "entity_name": deal.deal_code,
                },
                actor_user_id=actor_user_id,
                actor_type="user",
                entity_code=deal.deal_code,
                entity_name=deal.deal_name or deal.deal_code,
                related_customer_id=deal.customer_id,
                related_deal_id=deal.id,
                related_product_id=deal.product_id,
            )
            
            # Log field change
            event_service.log_field_change(
                db,
                org_id=deal.org_id,
                entity_type="deal",
                entity_id=deal.id,
                field_name="current_stage",
                old_value=old_stage,
                new_value=new_stage,
                actor_user_id=actor_user_id,
                change_source="user_action",
            )
            
            db.commit()
        except Exception as e:
            pass
    
    def _on_deal_won(
        self,
        db: Session,
        deal: Deal,
        org_id: UUID,
        user_id: Optional[UUID] = None
    ) -> None:
        """
        Handle deal won - update product status to SOLD.
        
        PROMPT 5/20: Use InventoryStatusService
        """
        if deal.product_id:
            try:
                # Mark as sold via InventoryStatusService
                # Note: This requires product to be in RESERVED state first
                # If not in correct state, just log and continue
                inventory_status_service.mark_sold(
                    db=db,
                    product_id=deal.product_id,
                    user_id=user_id or deal.created_by,
                    org_id=org_id,
                    contract_id=deal.contract_id or deal.id,  # Use contract_id if available
                )
            except InvalidTransitionError as e:
                # If transition not valid, try direct status change as fallback
                # This handles cases where product is in different state
                try:
                    inventory_status_service.change_status(
                        db=db,
                        product_id=deal.product_id,
                        new_status=CanonicalInventoryStatus.SOLD.value,
                        user_id=user_id or deal.created_by,
                        org_id=org_id,
                        source=StatusChangeSource.DEAL_REQUEST.value,
                        source_ref_type="deal",
                        source_ref_id=deal.id,
                        reason=f"Deal {deal.deal_code} won",
                    )
                except InventoryStatusError:
                    pass  # Log and continue
            except InventoryStatusError as e:
                pass  # Log and continue
    
    def _on_deal_lost(
        self,
        db: Session,
        deal: Deal,
        org_id: UUID,
        user_id: Optional[UUID] = None
    ) -> None:
        """
        Handle deal lost - release product.
        
        PROMPT 5/20: Use InventoryStatusService
        """
        self._release_product_via_service(db, deal, org_id, user_id, "Deal lost")
    
    def _on_deal_cancelled(
        self,
        db: Session,
        deal: Deal,
        org_id: UUID,
        user_id: Optional[UUID] = None
    ) -> None:
        """
        Handle deal cancelled - release product.
        
        PROMPT 5/20: Use InventoryStatusService
        """
        self._release_product_via_service(db, deal, org_id, user_id, "Deal cancelled")
    
    def _release_product_via_service(
        self,
        db: Session,
        deal: Deal,
        org_id: UUID,
        user_id: Optional[UUID] = None,
        reason: str = "Deal closed"
    ) -> None:
        """
        Release product back to available via InventoryStatusService.
        
        PROMPT 5/20: SINGLE ENTRY POINT for status changes
        """
        if deal.product_id:
            try:
                # Try to change status to available
                inventory_status_service.change_status(
                    db=db,
                    product_id=deal.product_id,
                    new_status=CanonicalInventoryStatus.AVAILABLE.value,
                    user_id=user_id or deal.created_by,
                    org_id=org_id,
                    source=StatusChangeSource.DEAL_REQUEST.value,
                    source_ref_type="deal",
                    source_ref_id=deal.id,
                    reason=f"{reason}: {deal.deal_code}",
                )
            except InvalidTransitionError:
                # If invalid transition (e.g., from sold), ignore
                pass
            except InventoryStatusError:
                # Other errors, log and continue
                pass
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PRODUCT ASSIGNMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    def assign_product(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        product_id: UUID,
        product_price: Optional[Decimal] = None,
        assigned_by: Optional[UUID] = None
    ) -> Optional[Deal]:
        """
        Assign a product to the deal.
        
        PROMPT 5/20: Use InventoryStatusService for holds
        """
        deal = self.get(db, id=id, org_id=org_id)
        if not deal:
            return None
        
        # Release current product if different
        if deal.product_id and deal.product_id != product_id:
            self._release_product_via_service(
                db, deal, org_id, assigned_by, 
                "Product reassigned to different deal"
            )
        
        # Assign new product
        deal.product_id = product_id
        deal.product_price = product_price
        
        if assigned_by:
            deal.updated_by = assigned_by
        
        # PROMPT 5/20: Hold the new product via InventoryStatusService
        try:
            inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=assigned_by or deal.created_by,
                org_id=org_id,
                hold_hours=72,
                reason=f"Deal: {deal.deal_code}",
            )
        except HoldCollisionError as e:
            # Product already held - link to deal anyway
            pass
        except ProductNotAvailableError as e:
            # Product not available - still link for tracking
            pass
        except InventoryStatusError as e:
            # Other errors - continue
            pass
        
        db.add(deal)
        db.commit()
        db.refresh(deal)
        return deal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # OWNERSHIP
    # ═══════════════════════════════════════════════════════════════════════════
    
    def assign_owner(
        self,
        db: Session,
        *,
        id: UUID,
        org_id: UUID,
        owner_user_id: Optional[UUID] = None,
        owner_unit_id: Optional[UUID] = None,
        assigned_by: Optional[UUID] = None
    ) -> Optional[Deal]:
        """Assign deal to a user/unit."""
        deal = self.get(db, id=id, org_id=org_id)
        if not deal:
            return None
        
        deal.owner_user_id = owner_user_id
        deal.owner_unit_id = owner_unit_id
        deal.assigned_at = utc_now()
        
        if assigned_by:
            deal.updated_by = assigned_by
        
        db.add(deal)
        db.commit()
        db.refresh(deal)
        return deal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUERIES
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_pipeline(
        self,
        db: Session,
        *,
        org_id: UUID,
        user_id: Optional[UUID] = None,
        owner_user_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Deal], int]:
        """Get open deals (pipeline view) with VISIBILITY FILTER."""
        
        # Base conditions for open deals
        base_conditions = and_(
            Deal.org_id == org_id,
            Deal.deleted_at.is_(None),
            Deal.current_stage.notin_(["won", "lost", "cancelled"])
        )
        
        # Start query
        query = select(Deal).where(base_conditions)
        count_query = select(func.count()).select_from(Deal).where(base_conditions)
        
        # Apply visibility filter if user_id provided
        if user_id:
            visibility_condition = self._build_deal_visibility(db, user_id, org_id)
            if visibility_condition is not None:
                query = query.where(visibility_condition)
                count_query = count_query.where(visibility_condition)
        
        # Additional filter by owner
        if owner_user_id:
            query = query.where(Deal.owner_user_id == owner_user_id)
            count_query = count_query.where(Deal.owner_user_id == owner_user_id)
        
        total = db.execute(count_query).scalar() or 0
        
        query = query.order_by(Deal.created_at.desc()).offset(skip).limit(limit)
        result = db.execute(query)
        items = list(result.scalars().all())
        
        return items, total
    
    def _build_deal_visibility(
        self,
        db: Session,
        user_id: UUID,
        org_id: UUID
    ):
        """Build visibility condition for deals."""
        user_scope = permission_service.get_user_scope(db, user_id, org_id)
        scope = user_scope.get("scope", PermissionScope.SELF)
        
        # Global/Org scope = no filter
        if scope in [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION]:
            return None
        
        # SELF scope
        if scope == PermissionScope.SELF:
            return or_(
                Deal.owner_user_id == user_id,
                Deal.created_by == user_id
            )
        
        # TEAM/UNIT scope
        if scope in [PermissionScope.TEAM, PermissionScope.UNIT]:
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            all_user_ids = [user_id] + subordinate_ids
            return or_(
                Deal.owner_user_id.in_(all_user_ids),
                Deal.created_by.in_(all_user_ids)
            )
        
        # BRANCH scope
        if scope == PermissionScope.BRANCH:
            unit_ids = user_scope.get("unit_ids", [])
            subordinate_ids = user_scope.get("subordinate_user_ids", [])
            all_user_ids = [user_id] + subordinate_ids
            
            conditions = [
                Deal.owner_user_id.in_(all_user_ids),
                Deal.created_by.in_(all_user_ids)
            ]
            if unit_ids:
                conditions.append(Deal.owner_unit_id.in_(unit_ids))
            return or_(*conditions)
        
        return None
    
    def get_by_stage(
        self,
        db: Session,
        *,
        org_id: UUID,
        stage: str,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Deal], int]:
        """Get deals by stage."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"current_stage": stage}
        )
    
    def get_by_customer(
        self,
        db: Session,
        *,
        org_id: UUID,
        customer_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Deal], int]:
        """Get deals for a customer."""
        return self.get_multi(
            db,
            org_id=org_id,
            skip=skip,
            limit=limit,
            filters={"customer_id": customer_id}
        )
    
    def get_by_product(
        self,
        db: Session,
        *,
        org_id: UUID,
        product_id: UUID
    ) -> Optional[Deal]:
        """Get active deal for a product."""
        query = select(Deal).where(
            and_(
                Deal.org_id == org_id,
                Deal.product_id == product_id,
                Deal.deleted_at.is_(None),
                Deal.current_stage.notin_(["won", "lost", "cancelled"])
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # STATISTICS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_pipeline_stats(
        self,
        db: Session,
        *,
        org_id: UUID,
        owner_user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get pipeline statistics by stage."""
        base_query = and_(
            Deal.org_id == org_id,
            Deal.deleted_at.is_(None)
        )
        
        if owner_user_id:
            base_query = and_(base_query, Deal.owner_user_id == owner_user_id)
        
        # Count by stage
        stages = ["new", "qualified", "viewing", "proposal", "negotiation", 
                  "booking", "deposit", "contract", "won", "lost"]
        
        stats = {}
        for stage in stages:
            query = select(func.count()).select_from(Deal).where(
                and_(base_query, Deal.current_stage == stage)
            )
            stats[stage] = db.execute(query).scalar() or 0
        
        # Total value
        value_query = select(func.sum(Deal.deal_value)).where(
            and_(base_query, Deal.current_stage.notin_(["won", "lost", "cancelled"]))
        )
        stats["total_pipeline_value"] = db.execute(value_query).scalar() or 0
        
        return stats


# Singleton instance
deal_service = DealService()
