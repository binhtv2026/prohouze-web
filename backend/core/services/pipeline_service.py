"""
ProHouzing Pipeline Service
TASK 2 - SALES PIPELINE

Core service for managing sales pipeline deals.
Handles stage transitions with inventory sync.
"""

from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.orm import Session

from core.models.pipeline_deal import PipelineDeal, PipelineDealEvent
from core.models.product import Product
from core.services.inventory_status import inventory_status_service
from config.pipeline_config import (
    PipelineStage,
    STAGE_CONFIG,
    STAGE_ORDER,
    VALID_TRANSITIONS,
    is_valid_transition,
    get_valid_transitions,
    stage_requires_product,
    get_expected_inventory_status,
    get_stage_config,
)


# ═══════════════════════════════════════════════════════════════════════════
# EXCEPTIONS
# ═══════════════════════════════════════════════════════════════════════════

class PipelineError(Exception):
    """Base pipeline error."""
    pass


class InvalidStageTransitionError(PipelineError):
    """Invalid stage transition."""
    def __init__(self, current: str, target: str, valid: List[str]):
        self.current = current
        self.target = target
        self.valid = valid
        super().__init__(
            f"Cannot transition from '{current}' to '{target}'. "
            f"Valid transitions: {valid}"
        )


class ProductRequiredError(PipelineError):
    """Product required for this stage."""
    def __init__(self, stage: str):
        self.stage = stage
        super().__init__(f"Stage '{stage}' requires a product to be assigned")


class InventorySyncError(PipelineError):
    """Failed to sync with inventory."""
    def __init__(self, message: str):
        super().__init__(f"Inventory sync failed: {message}")


class DealNotFoundError(PipelineError):
    """Deal not found."""
    pass


# ═══════════════════════════════════════════════════════════════════════════
# PIPELINE SERVICE
# ═══════════════════════════════════════════════════════════════════════════

class PipelineService:
    """
    Pipeline deal management service.
    
    CORE RULES:
    1. Every deal at stage >= viewing MUST have a product
    2. Stage transitions MUST sync with inventory status
    3. Cannot skip stages (except to closed_lost)
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CREATE DEAL
    # ═══════════════════════════════════════════════════════════════════════════
    
    def create_deal(
        self,
        db: Session,
        *,
        org_id: UUID,
        customer_name: str,
        owner_user_id: UUID,
        product_id: Optional[UUID] = None,
        lead_id: Optional[UUID] = None,
        customer_phone: Optional[str] = None,
        customer_email: Optional[str] = None,
        expected_value: Optional[Decimal] = None,
        stage: str = PipelineStage.LEAD_NEW.value,
        source: Optional[str] = None,
        notes: Optional[str] = None,
        created_by: UUID,
    ) -> PipelineDeal:
        """
        Create a new pipeline deal.
        
        Rules:
        - Starts at lead_new by default
        - If product_id provided and stage >= viewing, validates product
        """
        # Validate stage
        if stage not in STAGE_CONFIG:
            raise PipelineError(f"Invalid stage: {stage}")
        
        # Check if product required
        if stage_requires_product(stage) and not product_id:
            raise ProductRequiredError(stage)
        
        # Get expected value from product if not provided
        if product_id and not expected_value:
            product = self._get_product(db, product_id, org_id)
            if product:
                expected_value = product.sale_price or product.list_price
        
        # Generate deal code
        deal_code = self._generate_deal_code(db, org_id)
        
        # Create deal
        deal = PipelineDeal(
            org_id=org_id,
            deal_code=deal_code,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            product_id=product_id,
            lead_id=lead_id,
            stage=stage,
            expected_value=expected_value,
            owner_user_id=owner_user_id,
            source=source,
            notes=notes,
            stage_entered_at=datetime.now(timezone.utc),
            probability=self._get_stage_probability(stage),
            created_by=created_by,
            updated_by=created_by,
        )
        
        db.add(deal)
        db.commit()
        db.refresh(deal)
        
        # Log event
        self._log_event(
            db,
            deal_id=deal.id,
            org_id=org_id,
            event_type="deal_created",
            new_stage=stage,
            triggered_by=created_by,
            description=f"Deal created for {customer_name}",
        )
        
        return deal
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CHANGE STAGE
    # ═══════════════════════════════════════════════════════════════════════════
    
    def change_stage(
        self,
        db: Session,
        *,
        deal_id: UUID,
        org_id: UUID,
        new_stage: str,
        user_id: UUID,
        reason: Optional[str] = None,
        product_id: Optional[UUID] = None,  # Can assign product when moving to viewing
    ) -> PipelineDeal:
        """
        Change deal stage with validation and inventory sync.
        
        RULES:
        1. Validates transition is allowed
        2. Checks product requirement
        3. Syncs inventory status if needed
        """
        # Get deal
        deal = self._get_deal(db, deal_id, org_id)
        if not deal:
            raise DealNotFoundError(f"Deal {deal_id} not found")
        
        old_stage = deal.stage
        
        # Validate transition
        if not is_valid_transition(old_stage, new_stage):
            valid = get_valid_transitions(old_stage)
            raise InvalidStageTransitionError(old_stage, new_stage, valid)
        
        # Handle product assignment
        if product_id and not deal.product_id:
            deal.product_id = product_id
            # Get expected value
            product = self._get_product(db, product_id, org_id)
            if product and not deal.expected_value:
                deal.expected_value = product.sale_price or product.list_price
        
        # Check product requirement
        if stage_requires_product(new_stage) and not deal.product_id:
            raise ProductRequiredError(new_stage)
        
        # Sync with inventory
        if deal.product_id:
            self._sync_inventory(
                db,
                deal=deal,
                old_stage=old_stage,
                new_stage=new_stage,
                user_id=user_id,
                org_id=org_id,
            )
        
        # Update deal
        deal.stage = new_stage
        deal.stage_entered_at = datetime.now(timezone.utc)
        deal.probability = self._get_stage_probability(new_stage)
        deal.updated_by = user_id
        deal.updated_at = datetime.now(timezone.utc)
        
        # Handle closed states
        stage_config = get_stage_config(new_stage)
        if stage_config.get("is_won"):
            deal.actual_close_date = datetime.now(timezone.utc)
            deal.won_reason = reason
            if deal.expected_value:
                deal.actual_value = deal.expected_value
        elif stage_config.get("is_lost"):
            deal.actual_close_date = datetime.now(timezone.utc)
            deal.lost_reason = reason
        
        db.add(deal)
        db.commit()
        db.refresh(deal)
        
        # Log event
        self._log_event(
            db,
            deal_id=deal.id,
            org_id=org_id,
            event_type="stage_changed",
            old_stage=old_stage,
            new_stage=new_stage,
            triggered_by=user_id,
            description=reason or f"Stage changed: {old_stage} → {new_stage}",
        )
        
        return deal
    
    def _sync_inventory(
        self,
        db: Session,
        deal: PipelineDeal,
        old_stage: str,
        new_stage: str,
        user_id: UUID,
        org_id: UUID,
    ) -> None:
        """Sync inventory status based on stage change."""
        product_id = deal.product_id
        if not product_id:
            return
        
        try:
            # Moving TO holding stage → place hold
            if new_stage == PipelineStage.HOLDING.value:
                inventory_status_service.hold_product(
                    db=db,
                    product_id=product_id,
                    user_id=user_id,
                    org_id=org_id,
                    hold_hours=48,
                    reason=f"Pipeline deal: {deal.deal_code}",
                )
            
            # Moving FROM holding BACKWARD → release hold
            elif old_stage == PipelineStage.HOLDING.value and new_stage in [
                PipelineStage.VIEWING.value,
                PipelineStage.INTERESTED.value,
            ]:
                inventory_status_service.release_hold(
                    db=db,
                    product_id=product_id,
                    user_id=user_id,
                    org_id=org_id,
                )
            
            # Moving TO booking stage → request booking
            elif new_stage == PipelineStage.BOOKING.value:
                booking_id = deal.id  # Use deal ID as booking reference
                inventory_status_service.request_booking(
                    db=db,
                    product_id=product_id,
                    user_id=user_id,
                    org_id=org_id,
                    booking_id=booking_id,
                )
            
            # Moving TO negotiating → confirm booking
            elif new_stage == PipelineStage.NEGOTIATING.value:
                inventory_status_service.confirm_booking(
                    db=db,
                    product_id=product_id,
                    user_id=user_id,
                    org_id=org_id,
                    booking_id=deal.id,
                )
            
            # Moving TO closed_won → mark sold
            elif new_stage == PipelineStage.CLOSED_WON.value:
                # First mark reserved
                inventory_status_service.mark_reserved(
                    db=db,
                    product_id=product_id,
                    user_id=user_id,
                    org_id=org_id,
                    deal_id=deal.id,
                )
                # Then mark sold
                inventory_status_service.mark_sold(
                    db=db,
                    product_id=product_id,
                    user_id=user_id,
                    org_id=org_id,
                    contract_id=deal.id,
                )
            
            # Moving TO closed_lost → release product
            elif new_stage == PipelineStage.CLOSED_LOST.value:
                # Get current product status
                product = self._get_product(db, product_id, org_id)
                if product and product.inventory_status in ["hold", "booking_pending", "booked"]:
                    # Cancel booking if exists
                    try:
                        inventory_status_service.cancel_booking(
                            db=db,
                            product_id=product_id,
                            user_id=user_id,
                            org_id=org_id,
                        )
                    except:
                        # Try release hold
                        try:
                            inventory_status_service.release_hold(
                                db=db,
                                product_id=product_id,
                                user_id=user_id,
                                org_id=org_id,
                            )
                        except:
                            pass  # Product might already be released
        
        except Exception as e:
            raise InventorySyncError(str(e))
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET DEALS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_deal(
        self,
        db: Session,
        *,
        deal_id: UUID,
        org_id: UUID,
    ) -> Optional[PipelineDeal]:
        """Get deal by ID."""
        return self._get_deal(db, deal_id, org_id)
    
    def get_deals(
        self,
        db: Session,
        *,
        org_id: UUID,
        owner_user_id: Optional[UUID] = None,
        stage: Optional[str] = None,
        stages: Optional[List[str]] = None,
        product_id: Optional[UUID] = None,
        include_closed: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[PipelineDeal], int]:
        """
        Get deals with filters.
        
        Returns:
            Tuple of (deals list, total count)
        """
        conditions = [
            PipelineDeal.org_id == org_id,
            PipelineDeal.deleted_at.is_(None),
        ]
        
        if owner_user_id:
            conditions.append(PipelineDeal.owner_user_id == owner_user_id)
        
        if stage:
            conditions.append(PipelineDeal.stage == stage)
        elif stages:
            conditions.append(PipelineDeal.stage.in_(stages))
        
        if product_id:
            conditions.append(PipelineDeal.product_id == product_id)
        
        if not include_closed:
            closed_stages = [PipelineStage.CLOSED_WON.value, PipelineStage.CLOSED_LOST.value]
            conditions.append(~PipelineDeal.stage.in_(closed_stages))
        
        # Count
        count_query = select(func.count(PipelineDeal.id)).where(and_(*conditions))
        total = db.execute(count_query).scalar() or 0
        
        # Fetch
        offset = (page - 1) * page_size
        query = select(PipelineDeal).where(and_(*conditions))
        query = query.order_by(PipelineDeal.stage_entered_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = db.execute(query)
        deals = list(result.scalars().all())
        
        return deals, total
    
    def get_deals_by_stage(
        self,
        db: Session,
        *,
        org_id: UUID,
        owner_user_id: Optional[UUID] = None,
    ) -> Dict[str, List[PipelineDeal]]:
        """Get deals grouped by stage (for Kanban view)."""
        conditions = [
            PipelineDeal.org_id == org_id,
            PipelineDeal.deleted_at.is_(None),
        ]
        
        if owner_user_id:
            conditions.append(PipelineDeal.owner_user_id == owner_user_id)
        
        query = select(PipelineDeal).where(and_(*conditions))
        query = query.order_by(PipelineDeal.stage_entered_at.desc())
        
        result = db.execute(query)
        deals = list(result.scalars().all())
        
        # Group by stage
        grouped = {stage: [] for stage in STAGE_ORDER}
        for deal in deals:
            if deal.stage in grouped:
                grouped[deal.stage].append(deal)
        
        return grouped
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PIPELINE STATS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_pipeline_stats(
        self,
        db: Session,
        *,
        org_id: UUID,
        owner_user_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """Get pipeline statistics."""
        conditions = [
            PipelineDeal.org_id == org_id,
            PipelineDeal.deleted_at.is_(None),
        ]
        
        if owner_user_id:
            conditions.append(PipelineDeal.owner_user_id == owner_user_id)
        
        # Count by stage
        stage_counts = {}
        stage_values = {}
        
        for stage in STAGE_ORDER:
            count_q = select(func.count(PipelineDeal.id)).where(
                and_(*conditions, PipelineDeal.stage == stage)
            )
            value_q = select(func.sum(PipelineDeal.expected_value)).where(
                and_(*conditions, PipelineDeal.stage == stage)
            )
            
            stage_counts[stage] = db.execute(count_q).scalar() or 0
            stage_values[stage] = float(db.execute(value_q).scalar() or 0)
        
        # Total active
        active_stages = [s for s in STAGE_ORDER if STAGE_CONFIG[s].get("is_active", True)]
        total_active_q = select(func.count(PipelineDeal.id)).where(
            and_(*conditions, PipelineDeal.stage.in_(active_stages))
        )
        total_active = db.execute(total_active_q).scalar() or 0
        
        # Total value
        total_value_q = select(func.sum(PipelineDeal.expected_value)).where(
            and_(*conditions, PipelineDeal.stage.in_(active_stages))
        )
        total_value = float(db.execute(total_value_q).scalar() or 0)
        
        # Won/Lost counts
        won_q = select(func.count(PipelineDeal.id)).where(
            and_(*conditions, PipelineDeal.stage == PipelineStage.CLOSED_WON.value)
        )
        lost_q = select(func.count(PipelineDeal.id)).where(
            and_(*conditions, PipelineDeal.stage == PipelineStage.CLOSED_LOST.value)
        )
        won_count = db.execute(won_q).scalar() or 0
        lost_count = db.execute(lost_q).scalar() or 0
        
        # Won value
        won_value_q = select(func.sum(PipelineDeal.actual_value)).where(
            and_(*conditions, PipelineDeal.stage == PipelineStage.CLOSED_WON.value)
        )
        won_value = float(db.execute(won_value_q).scalar() or 0)
        
        return {
            "total_active": total_active,
            "total_value": total_value,
            "won_count": won_count,
            "lost_count": lost_count,
            "won_value": won_value,
            "conversion_rate": won_count / (won_count + lost_count) * 100 if (won_count + lost_count) > 0 else 0,
            "by_stage": {
                stage: {
                    "count": stage_counts[stage],
                    "value": stage_values[stage],
                    "config": STAGE_CONFIG[stage],
                }
                for stage in STAGE_ORDER
            },
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _get_deal(
        self,
        db: Session,
        deal_id: UUID,
        org_id: UUID,
    ) -> Optional[PipelineDeal]:
        """Get deal by ID."""
        query = select(PipelineDeal).where(
            and_(
                PipelineDeal.id == deal_id,
                PipelineDeal.org_id == org_id,
                PipelineDeal.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        return result.scalar_one_or_none()
    
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
    
    def _generate_deal_code(self, db: Session, org_id: UUID) -> str:
        """Generate unique deal code."""
        # Count existing deals
        count_q = select(func.count(PipelineDeal.id)).where(
            PipelineDeal.org_id == org_id
        )
        count = db.execute(count_q).scalar() or 0
        
        now = datetime.now(timezone.utc)
        return f"DEAL-{now.strftime('%y%m')}-{count + 1:04d}"
    
    def _get_stage_probability(self, stage: str) -> int:
        """Get probability percentage for stage."""
        probabilities = {
            PipelineStage.LEAD_NEW.value: 10,
            PipelineStage.CONTACTED.value: 20,
            PipelineStage.INTERESTED.value: 30,
            PipelineStage.VIEWING.value: 40,
            PipelineStage.HOLDING.value: 50,
            PipelineStage.BOOKING.value: 70,
            PipelineStage.NEGOTIATING.value: 85,
            PipelineStage.CLOSED_WON.value: 100,
            PipelineStage.CLOSED_LOST.value: 0,
        }
        return probabilities.get(stage, 0)
    
    def _log_event(
        self,
        db: Session,
        *,
        deal_id: UUID,
        org_id: UUID,
        event_type: str,
        old_stage: Optional[str] = None,
        new_stage: Optional[str] = None,
        triggered_by: Optional[UUID] = None,
        description: Optional[str] = None,
    ) -> None:
        """Log pipeline event."""
        event = PipelineDealEvent(
            org_id=org_id,
            deal_id=deal_id,
            event_type=event_type,
            old_stage=old_stage,
            new_stage=new_stage,
            triggered_by=triggered_by,
            description=description,
        )
        db.add(event)
        db.commit()


# Singleton instance
pipeline_service = PipelineService()
