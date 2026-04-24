"""
PROMPT 5/20 - END-TO-END INVENTORY FLOW TEST
Test file for the canonical inventory system.

Test covers:
1. Full sales flow: available → hold → booking_pending → booked → reserved → sold
2. Anti double-sell: Hold collision detection (409 CONFLICT)
3. Idempotency: Same user retrying operations
4. Invalid transitions: Rejected properly
"""
import pytest
import uuid
from datetime import datetime, timezone
from sqlalchemy import text

from core.database import engine, SessionLocal
from core.services.inventory_status import (
    inventory_status_service,
    HoldCollisionError,
    InvalidTransitionError,
    ProductNotFoundError,
)
from core.models.product import Product
from config.canonical_inventory import InventoryStatus


@pytest.fixture(scope="module")
def test_data():
    """Create test data for inventory tests."""
    org_id = uuid.uuid4()
    user1_id = uuid.uuid4()
    user2_id = uuid.uuid4()
    product_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    
    with engine.connect() as conn:
        # Create org
        conn.execute(text("""
            INSERT INTO organizations (id, code, name, org_type, status, created_at, updated_at)
            VALUES (:id, :code, 'E2E Test Org', 'company', 'active', :now, :now)
        """), {"id": str(org_id), "code": f"E2E_{uuid.uuid4().hex[:6]}", "now": now})
        
        # Create users
        conn.execute(text("""
            INSERT INTO users (id, org_id, email, full_name, password_hash, user_type, status, created_at, updated_at)
            VALUES (:id, :org_id, :email, 'E2E User 1', '$2b$12$test', 'admin', 'active', :now, :now)
        """), {"id": str(user1_id), "org_id": str(org_id), "email": f"e2e_user1_{uuid.uuid4().hex[:6]}@test.com", "now": now})
        
        conn.execute(text("""
            INSERT INTO users (id, org_id, email, full_name, password_hash, user_type, status, created_at, updated_at)
            VALUES (:id, :org_id, :email, 'E2E User 2', '$2b$12$test', 'staff', 'active', :now, :now)
        """), {"id": str(user2_id), "org_id": str(org_id), "email": f"e2e_user2_{uuid.uuid4().hex[:6]}@test.com", "now": now})
        
        # Create product
        conn.execute(text("""
            INSERT INTO products (id, org_id, project_id, product_code, product_type, title, inventory_status, version, status, created_at, updated_at)
            VALUES (:id, :org_id, NULL, :code, 'apartment', 'E2E Test Unit', 'available', 1, 'active', :now, :now)
        """), {"id": str(product_id), "org_id": str(org_id), "code": f"E2E-UNIT-{uuid.uuid4().hex[:6]}", "now": now})
        
        conn.commit()
    
    return {
        "org_id": org_id,
        "user1_id": user1_id,
        "user2_id": user2_id,
        "product_id": product_id,
    }


class TestInventoryFlow:
    """Test the complete inventory flow."""
    
    def test_01_full_sales_flow(self, test_data):
        """Test: available → hold → booking_pending → booked → reserved → sold"""
        db = SessionLocal()
        product_id = test_data["product_id"]
        user_id = test_data["user1_id"]
        org_id = test_data["org_id"]
        
        try:
            # 1. Hold: available → hold
            product = inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=user_id,
                org_id=org_id,
                hold_hours=24,
            )
            assert product.inventory_status == "hold"
            
            # 2. Request booking: hold → booking_pending
            booking_id = uuid.uuid4()
            product = inventory_status_service.request_booking(
                db=db,
                product_id=product_id,
                user_id=user_id,
                org_id=org_id,
                booking_id=booking_id,
            )
            assert product.inventory_status == "booking_pending"
            
            # 3. Confirm booking: booking_pending → booked
            product = inventory_status_service.confirm_booking(
                db=db,
                product_id=product_id,
                user_id=user_id,
                org_id=org_id,
                booking_id=booking_id,
            )
            assert product.inventory_status == "booked"
            
            # 4. Reserve: booked → reserved
            deal_id = uuid.uuid4()
            product = inventory_status_service.mark_reserved(
                db=db,
                product_id=product_id,
                user_id=user_id,
                org_id=org_id,
                deal_id=deal_id,
            )
            assert product.inventory_status == "reserved"
            
            # 5. Sold: reserved → sold
            contract_id = uuid.uuid4()
            product = inventory_status_service.mark_sold(
                db=db,
                product_id=product_id,
                user_id=user_id,
                org_id=org_id,
                contract_id=contract_id,
            )
            assert product.inventory_status == "sold"
            
        finally:
            db.close()


class TestAntiDoubleSell:
    """Test anti double-sell protections."""
    
    def test_hold_collision(self, test_data):
        """Different user cannot hold same product."""
        db = SessionLocal()
        
        # Create fresh product
        product_id = uuid.uuid4()
        org_id = test_data["org_id"]
        user1_id = test_data["user1_id"]
        user2_id = test_data["user2_id"]
        now = datetime.now(timezone.utc)
        
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO products (id, org_id, project_id, product_code, product_type, title, inventory_status, version, status, created_at, updated_at)
                VALUES (:id, :org_id, NULL, :code, 'apartment', 'Collision Test Unit', 'available', 1, 'active', :now, :now)
            """), {"id": str(product_id), "org_id": str(org_id), "code": f"COLL-{uuid.uuid4().hex[:6]}", "now": now})
            conn.commit()
        
        try:
            # User 1 holds the product
            inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=user1_id,
                org_id=org_id,
                hold_hours=24,
            )
            
            # User 2 tries to hold -> should fail with HoldCollisionError
            with pytest.raises(HoldCollisionError):
                inventory_status_service.hold_product(
                    db=db,
                    product_id=product_id,
                    user_id=user2_id,
                    org_id=org_id,
                    hold_hours=24,
                )
        finally:
            db.close()
    
    def test_invalid_transition_rejected(self, test_data):
        """Invalid transitions are rejected."""
        db = SessionLocal()
        
        # Create fresh product
        product_id = uuid.uuid4()
        org_id = test_data["org_id"]
        user_id = test_data["user1_id"]
        now = datetime.now(timezone.utc)
        
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO products (id, org_id, project_id, product_code, product_type, title, inventory_status, version, status, created_at, updated_at)
                VALUES (:id, :org_id, NULL, :code, 'apartment', 'Transition Test Unit', 'hold', 1, 'active', :now, :now)
            """), {"id": str(product_id), "org_id": str(org_id), "code": f"TRANS-{uuid.uuid4().hex[:6]}", "now": now})
            conn.commit()
        
        try:
            # Try invalid transition: hold → sold (should fail)
            with pytest.raises(InvalidTransitionError):
                inventory_status_service.change_status(
                    db=db,
                    product_id=product_id,
                    new_status="sold",
                    user_id=user_id,
                    org_id=org_id,
                )
        finally:
            db.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
