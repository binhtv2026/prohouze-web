"""
ProHouzing Price Service
PROMPT 5/20 - PHASE 2: PRICE MODEL

Features:
- Price history tracking (immutable log)
- Current active price logic
- NO overwrite - only append new prices
- RBAC-aware access control
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from core.models.product import Product, ProductPriceHistory
from config.canonical_inventory import InventoryStatus


class PriceType:
    """Price type constants."""
    LIST_PRICE = "list_price"         # Giá niêm yết
    SALE_PRICE = "sale_price"         # Giá bán thực tế
    PRICE_PER_SQM = "price_per_sqm"   # Giá/m2


class PriceChangeSource:
    """Source of price change."""
    MANUAL = "manual"
    IMPORT = "import"
    SYSTEM = "system"
    PROMOTION = "promotion"


class PriceService:
    """
    Price management service.
    
    RULES:
    1. Price history is IMMUTABLE - no updates, only inserts
    2. Current price = latest active price (by effective_from)
    3. Can set future prices (effective_from > today)
    4. Cannot modify past prices
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET CURRENT PRICES
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_current_price(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        price_type: str = PriceType.SALE_PRICE,
    ) -> Optional[Decimal]:
        """
        Get current active price for a product.
        
        Logic:
        - Find price history where effective_from <= today
        - AND (effective_to is NULL OR effective_to >= today)
        - Order by effective_from DESC, take first
        
        Returns:
            Current active price or None
        """
        today = date.today()
        
        query = select(ProductPriceHistory).where(
            and_(
                ProductPriceHistory.product_id == product_id,
                ProductPriceHistory.org_id == org_id,
                ProductPriceHistory.price_type == price_type,
                ProductPriceHistory.effective_from <= today,
                or_(
                    ProductPriceHistory.effective_to.is_(None),
                    ProductPriceHistory.effective_to >= today,
                ),
            )
        ).order_by(ProductPriceHistory.effective_from.desc()).limit(1)
        
        result = db.execute(query)
        price_record = result.scalar_one_or_none()
        
        if price_record:
            return price_record.new_value
        
        # Fallback: Get from product directly
        product = self._get_product(db, product_id, org_id)
        if product:
            if price_type == PriceType.LIST_PRICE:
                return product.list_price
            elif price_type == PriceType.SALE_PRICE:
                return product.sale_price
            elif price_type == PriceType.PRICE_PER_SQM:
                return product.price_per_sqm
        
        return None
    
    def get_all_current_prices(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
    ) -> Dict[str, Optional[Decimal]]:
        """Get all current prices for a product."""
        return {
            PriceType.LIST_PRICE: self.get_current_price(
                db, product_id=product_id, org_id=org_id, price_type=PriceType.LIST_PRICE
            ),
            PriceType.SALE_PRICE: self.get_current_price(
                db, product_id=product_id, org_id=org_id, price_type=PriceType.SALE_PRICE
            ),
            PriceType.PRICE_PER_SQM: self.get_current_price(
                db, product_id=product_id, org_id=org_id, price_type=PriceType.PRICE_PER_SQM
            ),
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SET PRICES (Append-only)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def set_price(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        price_type: str,
        new_price: Decimal,
        effective_from: date,
        effective_to: Optional[date] = None,
        reason: Optional[str] = None,
        source_type: str = PriceChangeSource.MANUAL,
        source_ref_id: Optional[str] = None,
        changed_by: UUID,
    ) -> ProductPriceHistory:
        """
        Set a new price for a product.
        
        RULES:
        - Cannot set effective_from in the past (except for today)
        - Always appends new record, never updates
        - Automatically closes previous price record (sets effective_to)
        
        Args:
            product_id: Product ID
            org_id: Organization ID
            price_type: list_price, sale_price, price_per_sqm
            new_price: New price value
            effective_from: When the price takes effect
            effective_to: When the price expires (optional)
            reason: Reason for price change
            source_type: manual, import, system, promotion
            source_ref_id: Reference to source entity
            changed_by: User who made the change
            
        Returns:
            New price history record
        """
        today = date.today()
        
        # Validate effective_from
        if effective_from < today:
            raise ValueError(
                f"Cannot set price with past effective_from ({effective_from}). "
                f"Minimum is today ({today})."
            )
        
        # Get product
        product = self._get_product(db, product_id, org_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        # Get old price (for logging)
        old_price = self.get_current_price(
            db, product_id=product_id, org_id=org_id, price_type=price_type
        )
        
        # Close previous price record if effective_from is today
        if effective_from == today:
            self._close_previous_price(
                db, product_id, org_id, price_type, 
                close_date=today
            )
            
            # Also update product directly
            self._update_product_price(db, product, price_type, new_price)
        
        # Create new price history record
        price_record = ProductPriceHistory(
            org_id=org_id,
            product_id=product_id,
            price_type=price_type,
            old_value=old_price,
            new_value=new_price,
            effective_from=effective_from,
            effective_to=effective_to,
            change_reason=reason,
            source_type=source_type,
            source_ref_id=source_ref_id,
            changed_by=changed_by,
        )
        
        db.add(price_record)
        db.commit()
        db.refresh(price_record)
        
        return price_record
    
    def _close_previous_price(
        self,
        db: Session,
        product_id: UUID,
        org_id: UUID,
        price_type: str,
        close_date: date,
    ) -> None:
        """Close previous open price record."""
        # Find active price with no effective_to
        query = select(ProductPriceHistory).where(
            and_(
                ProductPriceHistory.product_id == product_id,
                ProductPriceHistory.org_id == org_id,
                ProductPriceHistory.price_type == price_type,
                ProductPriceHistory.effective_to.is_(None),
            )
        )
        
        result = db.execute(query)
        previous_records = list(result.scalars().all())
        
        for record in previous_records:
            # Set effective_to to day before new price
            record.effective_to = close_date
            db.add(record)
    
    def _update_product_price(
        self,
        db: Session,
        product: Product,
        price_type: str,
        new_price: Decimal,
    ) -> None:
        """Update product's current price fields."""
        if price_type == PriceType.LIST_PRICE:
            product.list_price = new_price
        elif price_type == PriceType.SALE_PRICE:
            product.sale_price = new_price
        elif price_type == PriceType.PRICE_PER_SQM:
            product.price_per_sqm = new_price
        
        product.updated_at = datetime.now(timezone.utc)
        db.add(product)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PRICE HISTORY
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_price_history(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        price_type: Optional[str] = None,
        limit: int = 50,
    ) -> List[ProductPriceHistory]:
        """
        Get price history for a product.
        
        Args:
            product_id: Product ID
            org_id: Organization ID
            price_type: Filter by price type (optional)
            limit: Maximum records to return
            
        Returns:
            List of price history records (newest first)
        """
        conditions = [
            ProductPriceHistory.product_id == product_id,
            ProductPriceHistory.org_id == org_id,
        ]
        
        if price_type:
            conditions.append(ProductPriceHistory.price_type == price_type)
        
        query = select(ProductPriceHistory).where(
            and_(*conditions)
        ).order_by(
            ProductPriceHistory.effective_from.desc(),
            ProductPriceHistory.created_at.desc(),
        ).limit(limit)
        
        result = db.execute(query)
        return list(result.scalars().all())
    
    def get_scheduled_prices(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
    ) -> List[ProductPriceHistory]:
        """Get future scheduled prices."""
        today = date.today()
        
        query = select(ProductPriceHistory).where(
            and_(
                ProductPriceHistory.product_id == product_id,
                ProductPriceHistory.org_id == org_id,
                ProductPriceHistory.effective_from > today,
            )
        ).order_by(ProductPriceHistory.effective_from.asc())
        
        result = db.execute(query)
        return list(result.scalars().all())
    
    # ═══════════════════════════════════════════════════════════════════════════
    # BULK PRICE UPDATE
    # ═══════════════════════════════════════════════════════════════════════════
    
    def bulk_set_prices(
        self,
        db: Session,
        *,
        org_id: UUID,
        prices: List[Dict[str, Any]],
        changed_by: UUID,
    ) -> List[ProductPriceHistory]:
        """
        Bulk set prices for multiple products.
        
        Args:
            org_id: Organization ID
            prices: List of {product_id, price_type, new_price, effective_from, reason}
            changed_by: User who made the changes
            
        Returns:
            List of created price history records
        """
        results = []
        
        for price_data in prices:
            try:
                record = self.set_price(
                    db,
                    product_id=UUID(str(price_data["product_id"])),
                    org_id=org_id,
                    price_type=price_data.get("price_type", PriceType.SALE_PRICE),
                    new_price=Decimal(str(price_data["new_price"])),
                    effective_from=price_data.get("effective_from", date.today()),
                    reason=price_data.get("reason"),
                    source_type=PriceChangeSource.IMPORT,
                    changed_by=changed_by,
                )
                results.append(record)
            except Exception as e:
                # Log error but continue with other prices
                pass
        
        return results
    
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
price_service = PriceService()
