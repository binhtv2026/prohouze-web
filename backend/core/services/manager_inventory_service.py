"""
ProHouzing Manager Inventory Control Service
TASK 3 - MODULE 2: INVENTORY CONTROL

Features:
1. Ai đang giữ sản phẩm nào
2. Hold quá hạn (expired hold)
3. Sản phẩm bị block lâu
4. Sản phẩm chưa có sales phụ trách
5. Force release hold
6. Reassign owner
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from core.models.product import Product, InventoryEvent
from core.models.user import User
from core.services.inventory_status import inventory_status_service
from core.services.ownership_service import ownership_service, OwnershipChangeSource


class ManagerInventoryService:
    """
    Manager inventory control service.
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET HOLDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_active_holds(
        self,
        db: Session,
        *,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """
        Get all products currently on hold.
        
        Shows who is holding what and when it expires.
        """
        conditions = [
            Product.org_id == org_id,
            Product.deleted_at.is_(None),
            Product.inventory_status == "hold",
        ]
        
        # Count
        count_q = select(func.count(Product.id)).where(and_(*conditions))
        total = db.execute(count_q).scalar() or 0
        
        # Fetch
        offset = (page - 1) * page_size
        query = select(Product).where(and_(*conditions))
        query = query.order_by(Product.hold_started_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = db.execute(query)
        products = list(result.scalars().all())
        
        items = []
        for p in products:
            # Get holder info
            holder_name = None
            if p.hold_by_user_id:
                user_q = select(User).where(User.id == p.hold_by_user_id)
                holder = db.execute(user_q).scalar_one_or_none()
                if holder:
                    holder_name = holder.full_name
            
            # Check if expired - handle both date and datetime
            today = datetime.now(timezone.utc).date()
            is_expired = False
            if p.hold_expires_at:
                expires = p.hold_expires_at
                if hasattr(expires, 'date'):  # It's a datetime
                    expires_date = expires.date()
                else:  # It's already a date
                    expires_date = expires
                is_expired = expires_date < today
            
            # Format dates safely
            hold_started = None
            hold_expires = None
            if p.hold_started_at:
                hold_started = str(p.hold_started_at)
            if p.hold_expires_at:
                hold_expires = str(p.hold_expires_at)
            
            items.append({
                "product_id": str(p.id),
                "product_code": p.product_code,
                "title": p.title,
                "holder_id": str(p.hold_by_user_id) if p.hold_by_user_id else None,
                "holder_name": holder_name,
                "hold_reason": p.hold_reason,
                "hold_started_at": hold_started,
                "hold_expires_at": hold_expires,
                "is_expired": is_expired,
                "list_price": float(p.list_price) if p.list_price else None,
            })
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": items,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET OVERDUE HOLDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_overdue_holds(
        self,
        db: Session,
        *,
        org_id: UUID,
    ) -> Dict[str, Any]:
        """
        Get products with expired holds.
        
        These should be released or actioned.
        """
        now = datetime.now(timezone.utc)
        today = now.date()
        
        conditions = [
            Product.org_id == org_id,
            Product.deleted_at.is_(None),
            Product.inventory_status == "hold",
            Product.hold_expires_at < today,  # Compare date to date
        ]
        
        query = select(Product).where(and_(*conditions))
        query = query.order_by(Product.hold_expires_at.asc())
        
        result = db.execute(query)
        products = list(result.scalars().all())
        
        items = []
        for p in products:
            # Get holder info
            holder_name = None
            if p.hold_by_user_id:
                user_q = select(User).where(User.id == p.hold_by_user_id)
                holder = db.execute(user_q).scalar_one_or_none()
                if holder:
                    holder_name = holder.full_name
            
            # Calculate overdue duration - handle both date and datetime
            if p.hold_expires_at:
                expires = p.hold_expires_at
                if hasattr(expires, 'date'):  # It's a datetime
                    expires_date = expires.date()
                else:  # It's already a date
                    expires_date = expires
                overdue_days = (today - expires_date).days
                overdue_hours = overdue_days * 24
            else:
                overdue_hours = 0
            
            items.append({
                "product_id": str(p.id),
                "product_code": p.product_code,
                "title": p.title,
                "holder_id": str(p.hold_by_user_id) if p.hold_by_user_id else None,
                "holder_name": holder_name,
                "hold_reason": p.hold_reason,
                "hold_expires_at": str(p.hold_expires_at) if p.hold_expires_at else None,
                "overdue_hours": round(overdue_hours, 1),
                "list_price": float(p.list_price) if p.list_price else None,
            })
        
        return {
            "total": len(items),
            "items": items,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET UNASSIGNED PRODUCTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_unassigned_products(
        self,
        db: Session,
        *,
        org_id: UUID,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """
        Get products without sales owner.
        """
        conditions = [
            Product.org_id == org_id,
            Product.deleted_at.is_(None),
            Product.status == "active",
            Product.inventory_status == "available",
            Product.created_by.is_(None),
        ]
        
        # Count
        count_q = select(func.count(Product.id)).where(and_(*conditions))
        total = db.execute(count_q).scalar() or 0
        
        # Fetch
        offset = (page - 1) * page_size
        query = select(Product).where(and_(*conditions))
        query = query.order_by(Product.created_at.desc())
        query = query.offset(offset).limit(page_size)
        
        result = db.execute(query)
        products = list(result.scalars().all())
        
        items = []
        for p in products:
            items.append({
                "product_id": str(p.id),
                "product_code": p.product_code,
                "title": p.title,
                "inventory_status": p.inventory_status,
                "list_price": float(p.list_price) if p.list_price else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            })
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": items,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # GET BLOCKED PRODUCTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_blocked_products(
        self,
        db: Session,
        *,
        org_id: UUID,
        days_blocked: int = 7,
    ) -> Dict[str, Any]:
        """
        Get products blocked for too long.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_blocked)
        
        conditions = [
            Product.org_id == org_id,
            Product.deleted_at.is_(None),
            Product.inventory_status == "blocked",
            Product.updated_at < cutoff,
        ]
        
        query = select(Product).where(and_(*conditions))
        query = query.order_by(Product.updated_at.asc())
        
        result = db.execute(query)
        products = list(result.scalars().all())
        
        items = []
        now = datetime.now(timezone.utc)
        for p in products:
            blocked_days = (now - p.updated_at).days if p.updated_at else 0
            
            items.append({
                "product_id": str(p.id),
                "product_code": p.product_code,
                "title": p.title,
                "lock_reason": p.lock_reason,
                "blocked_days": blocked_days,
                "list_price": float(p.list_price) if p.list_price else None,
            })
        
        return {
            "total": len(items),
            "days_threshold": days_blocked,
            "items": items,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INVENTORY SUMMARY
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_inventory_summary(
        self,
        db: Session,
        *,
        org_id: UUID,
    ) -> Dict[str, Any]:
        """
        Get overall inventory summary.
        """
        base_conditions = [
            Product.org_id == org_id,
            Product.deleted_at.is_(None),
            Product.status == "active",
        ]
        
        # Count by status
        statuses = ["available", "hold", "booking_pending", "booked", "reserved", "sold", "blocked"]
        by_status = {}
        
        for status in statuses:
            conditions = base_conditions + [Product.inventory_status == status]
            count_q = select(func.count(Product.id)).where(and_(*conditions))
            value_q = select(func.sum(Product.list_price)).where(and_(*conditions))
            
            by_status[status] = {
                "count": db.execute(count_q).scalar() or 0,
                "value": float(db.execute(value_q).scalar() or 0),
            }
        
        # Total
        total_q = select(func.count(Product.id)).where(and_(*base_conditions))
        total_value_q = select(func.sum(Product.list_price)).where(and_(*base_conditions))
        
        total = db.execute(total_q).scalar() or 0
        total_value = float(db.execute(total_value_q).scalar() or 0)
        
        # Overdue holds count
        now = datetime.now(timezone.utc)
        overdue_conditions = base_conditions + [
            Product.inventory_status == "hold",
            Product.hold_expires_at < now,
        ]
        overdue_q = select(func.count(Product.id)).where(and_(*overdue_conditions))
        overdue_count = db.execute(overdue_q).scalar() or 0
        
        return {
            "total_products": total,
            "total_value": total_value,
            "overdue_holds": overdue_count,
            "by_status": by_status,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ACTIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def force_release_hold(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        manager_id: UUID,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Manager force-release a hold on a product.
        """
        # Get product
        query = select(Product).where(
            and_(
                Product.id == product_id,
                Product.org_id == org_id,
                Product.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        product = result.scalar_one_or_none()
        
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        if product.inventory_status != "hold":
            raise ValueError(f"Product is not on hold (status: {product.inventory_status})")
        
        old_holder = product.hold_by_user_id
        
        # Release hold
        product.inventory_status = "available"
        product.hold_by_user_id = None
        product.hold_started_at = None
        product.hold_expires_at = None
        product.hold_reason = None
        product.version += 1
        product.updated_by = manager_id
        product.updated_at = datetime.now(timezone.utc)
        
        # Log event
        event = InventoryEvent(
            org_id=org_id,
            product_id=product_id,
            old_status="hold",
            new_status="available",
            triggered_by=manager_id,
            source="manager_force_release",
            reason=reason,
            metadata_json={"old_holder": str(old_holder) if old_holder else None},
        )
        
        db.add(product)
        db.add(event)
        db.commit()
        
        return {
            "success": True,
            "product_id": str(product_id),
            "new_status": "available",
            "message": "Hold released successfully",
        }
    
    def reassign_product_owner(
        self,
        db: Session,
        *,
        product_id: UUID,
        org_id: UUID,
        new_owner_id: UUID,
        manager_id: UUID,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Manager reassign product to a different sales owner.
        """
        result = ownership_service.assign_owner(
            db,
            product_id=product_id,
            org_id=org_id,
            new_owner_id=new_owner_id,
            assigned_by=manager_id,
            reason=reason,
            source=OwnershipChangeSource.REASSIGN,
        )
        
        return {
            "success": result["success"],
            "product_id": str(product_id),
            "old_owner_id": result.get("old_owner_id"),
            "new_owner_id": result.get("new_owner_id"),
            "message": "Owner reassigned successfully",
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # OVERRIDE DEAL STAGE (MANAGER ACTION WITH LOG)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def override_deal_stage(
        self,
        db: Session,
        *,
        deal_id: UUID,
        org_id: UUID,
        new_stage: str,
        manager_id: UUID,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Manager override deal stage.
        
        Bypasses normal stage transition rules.
        All actions are audit logged.
        """
        from core.models.pipeline_deal import PipelineDeal, PipelineDealEvent
        from config.pipeline_config import STAGE_ORDER
        
        # Get deal
        query = select(PipelineDeal).where(
            and_(
                PipelineDeal.id == deal_id,
                PipelineDeal.org_id == org_id,
                PipelineDeal.deleted_at.is_(None),
            )
        )
        result = db.execute(query)
        deal = result.scalar_one_or_none()
        
        if not deal:
            raise ValueError(f"Deal {deal_id} not found")
        
        # Validate new stage
        if new_stage not in STAGE_ORDER:
            raise ValueError(f"Invalid stage: {new_stage}")
        
        old_stage = deal.stage
        
        # Update deal
        deal.stage = new_stage
        deal.stage_entered_at = datetime.now(timezone.utc)
        deal.updated_at = datetime.now(timezone.utc)
        deal.updated_by = manager_id
        
        # Log event
        event = PipelineDealEvent(
            org_id=org_id,
            deal_id=deal_id,
            event_type="stage_override",
            old_stage=old_stage,
            new_stage=new_stage,
            description=f"Manager override: {reason}",
            metadata_json={
                "manager_id": str(manager_id),
                "reason": reason,
                "action": "manager_override",
            },
            triggered_by=manager_id,
        )
        
        db.add(deal)
        db.add(event)
        db.commit()
        
        return {
            "success": True,
            "deal_id": str(deal_id),
            "old_stage": old_stage,
            "new_stage": new_stage,
            "message": "Deal stage overridden successfully",
        }


# Singleton instance
manager_inventory_service = ManagerInventoryService()
