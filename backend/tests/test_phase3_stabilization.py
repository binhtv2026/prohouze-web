"""
PROMPT 5/20 - PHASE 3: STABILIZATION TEST
Full Sales Flow + Data Consistency + Edge Cases + Regression

Test covers:
I. FULL FLOW TEST (Real Scenario)
II. DATA CONSISTENCY CHECK
III. MISMATCH DETECTION
IV. EDGE CASES
V. REGRESSION TEST
VI. AUDIT TRAIL CHECK
VII. PERFORMANCE CHECK
"""

import pytest
import uuid
import time
import threading
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor, as_completed
from sqlalchemy import text, select, and_

from core.database import engine, SessionLocal
from core.services.inventory_status import (
    inventory_status_service,
    HoldCollisionError,
    InvalidTransitionError,
)
from core.services.price_service import price_service, PriceType
from core.services.ownership_service import ownership_service, OwnershipChangeSource
from core.models.product import Product, InventoryEvent, ProductPriceHistory
from config.canonical_inventory import InventoryStatus


# ═══════════════════════════════════════════════════════════════════════════
# TEST FIXTURES
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture(scope="module")
def test_data():
    """Create comprehensive test data for stabilization tests."""
    org_id = uuid.uuid4()
    sales_user_id = uuid.uuid4()
    manager_user_id = uuid.uuid4()
    customer_user_id = uuid.uuid4()
    product_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    
    with engine.connect() as conn:
        # Create org
        conn.execute(text("""
            INSERT INTO organizations (id, code, name, org_type, status, created_at, updated_at)
            VALUES (:id, :code, 'Stabilization Test Org', 'company', 'active', :now, :now)
        """), {"id": str(org_id), "code": f"STAB_{uuid.uuid4().hex[:6]}", "now": now})
        
        # Create sales user
        conn.execute(text("""
            INSERT INTO users (id, org_id, email, full_name, password_hash, user_type, status, created_at, updated_at)
            VALUES (:id, :org_id, :email, 'Sales Agent', '$2b$12$test', 'sales', 'active', :now, :now)
        """), {"id": str(sales_user_id), "org_id": str(org_id), "email": f"sales_{uuid.uuid4().hex[:6]}@test.com", "now": now})
        
        # Create manager user
        conn.execute(text("""
            INSERT INTO users (id, org_id, email, full_name, password_hash, user_type, status, created_at, updated_at)
            VALUES (:id, :org_id, :email, 'Team Manager', '$2b$12$test', 'manager', 'active', :now, :now)
        """), {"id": str(manager_user_id), "org_id": str(org_id), "email": f"manager_{uuid.uuid4().hex[:6]}@test.com", "now": now})
        
        # Create product (available, with price)
        conn.execute(text("""
            INSERT INTO products (id, org_id, project_id, product_code, product_type, title, 
                inventory_status, list_price, sale_price, version, status, created_by, created_at, updated_at)
            VALUES (:id, :org_id, NULL, :code, 'apartment', 'Stabilization Test Unit', 
                'available', 2000000000, 1800000000, 1, 'active', :owner, :now, :now)
        """), {
            "id": str(product_id), 
            "org_id": str(org_id), 
            "code": f"STAB-UNIT-{uuid.uuid4().hex[:6]}", 
            "owner": str(sales_user_id),
            "now": now
        })
        
        conn.commit()
    
    return {
        "org_id": org_id,
        "sales_user_id": sales_user_id,
        "manager_user_id": manager_user_id,
        "customer_user_id": customer_user_id,
        "product_id": product_id,
    }


def create_fresh_product(db, org_id, owner_id, status="available", price=1000000000):
    """Helper to create a fresh product for each test."""
    product_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO products (id, org_id, project_id, product_code, product_type, title, 
                inventory_status, list_price, sale_price, version, status, created_by, created_at, updated_at)
            VALUES (:id, :org_id, NULL, :code, 'apartment', 'Fresh Test Unit', 
                :status, :price, :price, 1, 'active', :owner, :now, :now)
        """), {
            "id": str(product_id), 
            "org_id": str(org_id), 
            "code": f"TEST-{uuid.uuid4().hex[:8]}", 
            "status": status,
            "price": price,
            "owner": str(owner_id),
            "now": now
        })
        conn.commit()
    
    return product_id


# ═══════════════════════════════════════════════════════════════════════════
# I. FULL FLOW TEST (REAL SCENARIO)
# ═══════════════════════════════════════════════════════════════════════════

class TestFullSalesFlow:
    """Test complete sales flow: Lead → Assign → Hold → Booking → Deal → Sold"""
    
    def test_01_complete_sales_flow(self, test_data):
        """
        Simulate real sales scenario:
        1. Lead created
        2. Assign to sales
        3. Sales selects product
        4. HOLD product
        5. Booking request
        6. Deal created
        7. Deal progress
        8. Mark SOLD
        """
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        # Create fresh product for this test
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Step 1-3: Lead created, assigned, product selected (simulated)
            # In real scenario, this would be Lead service
            print("\n[Step 1-3] Lead created, assigned to sales, product selected")
            
            # Step 4: HOLD product
            print("[Step 4] Sales placing HOLD on product...")
            product = inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                hold_hours=24,
                reason="Customer interested - preparing booking",
            )
            assert product.inventory_status == "hold"
            assert product.hold_by_user_id == sales_user_id
            print(f"   ✅ Product held. Status: {product.inventory_status}")
            
            # Step 5: Booking request
            print("[Step 5] Creating booking request...")
            booking_id = uuid.uuid4()
            product = inventory_status_service.request_booking(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                booking_id=booking_id,
            )
            assert product.inventory_status == "booking_pending"
            print(f"   ✅ Booking requested. Status: {product.inventory_status}")
            
            # Step 5b: Confirm booking
            print("[Step 5b] Confirming booking...")
            product = inventory_status_service.confirm_booking(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                booking_id=booking_id,
            )
            assert product.inventory_status == "booked"
            print(f"   ✅ Booking confirmed. Status: {product.inventory_status}")
            
            # Step 6: Deal created
            print("[Step 6] Creating deal, marking reserved...")
            deal_id = uuid.uuid4()
            product = inventory_status_service.mark_reserved(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                deal_id=deal_id,
            )
            assert product.inventory_status == "reserved"
            print(f"   ✅ Deal created, reserved. Status: {product.inventory_status}")
            
            # Step 7-8: Deal progress → SOLD
            print("[Step 7-8] Deal completed, marking SOLD...")
            contract_id = uuid.uuid4()
            product = inventory_status_service.mark_sold(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                contract_id=contract_id,
            )
            assert product.inventory_status == "sold"
            print(f"   ✅ SOLD! Final status: {product.inventory_status}")
            
            # Verify final state
            query = select(Product).where(Product.id == product_id)
            result = db.execute(query)
            final_product = result.scalar_one()
            
            assert final_product.inventory_status == "sold"
            assert final_product.version == 6  # 5 transitions
            
            print("\n🎉 FULL SALES FLOW COMPLETE!")
            
        finally:
            db.close()


# ═══════════════════════════════════════════════════════════════════════════
# II. DATA CONSISTENCY CHECK
# ═══════════════════════════════════════════════════════════════════════════

class TestDataConsistency:
    """Verify data consistency at each step."""
    
    def test_inventory_price_consistency(self, test_data):
        """Verify price is correctly tracked during sales flow."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        # Create product with specific price
        initial_price = Decimal("1500000000")
        product_id = create_fresh_product(db, org_id, sales_user_id, price=float(initial_price))
        
        try:
            # Set price via price service
            price_service.set_price(
                db,
                product_id=product_id,
                org_id=org_id,
                price_type=PriceType.SALE_PRICE,
                new_price=initial_price,
                effective_from=date.today(),
                reason="Initial price set",
                changed_by=sales_user_id,
            )
            
            # Hold the product
            inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                hold_hours=24,
            )
            
            # Verify price is still correct after hold
            current_price = price_service.get_current_price(
                db,
                product_id=product_id,
                org_id=org_id,
                price_type=PriceType.SALE_PRICE,
            )
            
            assert current_price == initial_price
            print(f"✅ Price consistency verified: {current_price}")
            
        finally:
            db.close()
    
    def test_inventory_ownership_consistency(self, test_data):
        """Verify ownership is correctly tracked."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        manager_user_id = test_data["manager_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Get initial owner
            initial_owner = ownership_service.get_owner(
                db, product_id=product_id, org_id=org_id
            )
            assert initial_owner == sales_user_id
            
            # Hold product
            inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                hold_hours=24,
            )
            
            # Owner should still be the same
            owner_after_hold = ownership_service.get_owner(
                db, product_id=product_id, org_id=org_id
            )
            assert owner_after_hold == sales_user_id
            
            # Reassign to manager
            ownership_service.assign_owner(
                db,
                product_id=product_id,
                org_id=org_id,
                new_owner_id=manager_user_id,
                assigned_by=manager_user_id,
                reason="Team reassignment",
            )
            
            # Verify new owner
            new_owner = ownership_service.get_owner(
                db, product_id=product_id, org_id=org_id
            )
            assert new_owner == manager_user_id
            
            print("✅ Ownership consistency verified")
            
        finally:
            db.close()


# ═══════════════════════════════════════════════════════════════════════════
# III. MISMATCH DETECTION
# ═══════════════════════════════════════════════════════════════════════════

class TestMismatchDetection:
    """Test that mismatches are properly blocked."""
    
    def test_cannot_skip_states(self, test_data):
        """Cannot jump from available directly to sold."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Try to go directly to sold (should fail)
            with pytest.raises(InvalidTransitionError):
                inventory_status_service.mark_sold(
                    db=db,
                    product_id=product_id,
                    user_id=sales_user_id,
                    org_id=org_id,
                    contract_id=uuid.uuid4(),
                )
            
            print("✅ Invalid transition blocked: available → sold")
            
        finally:
            db.close()
    
    def test_booking_without_hold(self, test_data):
        """Booking on available product should fail with proper error."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Try to request booking directly (should fail)
            # Import the correct exception
            from core.services.inventory_status import ProductNotAvailableError
            
            with pytest.raises((InvalidTransitionError, ProductNotAvailableError)):
                inventory_status_service.request_booking(
                    db=db,
                    product_id=product_id,
                    user_id=sales_user_id,
                    org_id=org_id,
                    booking_id=uuid.uuid4(),
                )
            
            print("✅ Booking without hold blocked")
            
        finally:
            db.close()


# ═══════════════════════════════════════════════════════════════════════════
# IV. EDGE CASES
# ═══════════════════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Test critical edge cases."""
    
    def test_hold_collision(self, test_data):
        """User A hold → User B booking should FAIL."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        manager_user_id = test_data["manager_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # User A (sales) holds the product
            inventory_status_service.hold_product(
                db=db,
                product_id=product_id,
                user_id=sales_user_id,
                org_id=org_id,
                hold_hours=24,
            )
            
            # User B (manager) tries to hold same product
            with pytest.raises(HoldCollisionError):
                inventory_status_service.hold_product(
                    db=db,
                    product_id=product_id,
                    user_id=manager_user_id,
                    org_id=org_id,
                    hold_hours=24,
                )
            
            print("✅ Hold collision detected and blocked")
            
        finally:
            db.close()
    
    def test_reassign_owner_during_deal(self, test_data):
        """Reassigning owner during deal should not break the flow."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        manager_user_id = test_data["manager_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Start sales flow
            inventory_status_service.hold_product(
                db=db, product_id=product_id, user_id=sales_user_id, 
                org_id=org_id, hold_hours=24
            )
            
            booking_id = uuid.uuid4()
            inventory_status_service.request_booking(
                db=db, product_id=product_id, user_id=sales_user_id,
                org_id=org_id, booking_id=booking_id
            )
            
            # Reassign owner mid-flow
            ownership_service.assign_owner(
                db, product_id=product_id, org_id=org_id,
                new_owner_id=manager_user_id, assigned_by=manager_user_id,
                reason="Mid-deal reassignment"
            )
            
            # Continue flow with new owner
            inventory_status_service.confirm_booking(
                db=db, product_id=product_id, user_id=manager_user_id,
                org_id=org_id, booking_id=booking_id
            )
            
            deal_id = uuid.uuid4()
            inventory_status_service.mark_reserved(
                db=db, product_id=product_id, user_id=manager_user_id,
                org_id=org_id, deal_id=deal_id
            )
            
            # Verify owner is manager
            owner = ownership_service.get_owner(db, product_id=product_id, org_id=org_id)
            assert owner == manager_user_id
            
            print("✅ Owner reassignment during deal works correctly")
            
        finally:
            db.close()


# ═══════════════════════════════════════════════════════════════════════════
# V. REGRESSION TEST
# ═══════════════════════════════════════════════════════════════════════════

class TestRegression:
    """Regression tests for all APIs."""
    
    def test_inventory_apis(self, test_data):
        """Test all inventory APIs still work."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Hold
            product = inventory_status_service.hold_product(
                db=db, product_id=product_id, user_id=sales_user_id,
                org_id=org_id, hold_hours=24
            )
            assert product.inventory_status == "hold"
            
            # Release hold (change back to available)
            product = inventory_status_service.release_hold(
                db=db, product_id=product_id, user_id=sales_user_id, org_id=org_id
            )
            assert product.inventory_status == "available"
            
            print("✅ Inventory APIs regression passed")
            
        finally:
            db.close()
    
    def test_price_apis(self, test_data):
        """Test all price APIs still work."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Set price
            record = price_service.set_price(
                db, product_id=product_id, org_id=org_id,
                price_type=PriceType.SALE_PRICE, new_price=Decimal("2000000000"),
                effective_from=date.today(), changed_by=sales_user_id
            )
            assert record.new_value == Decimal("2000000000")
            
            # Get current price
            current = price_service.get_current_price(
                db, product_id=product_id, org_id=org_id, price_type=PriceType.SALE_PRICE
            )
            assert current == Decimal("2000000000")
            
            # Get history
            history = price_service.get_price_history(
                db, product_id=product_id, org_id=org_id
            )
            assert len(history) >= 1
            
            print("✅ Price APIs regression passed")
            
        finally:
            db.close()
    
    def test_ownership_apis(self, test_data):
        """Test all ownership APIs still work."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        manager_user_id = test_data["manager_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Get owner
            owner = ownership_service.get_owner(db, product_id=product_id, org_id=org_id)
            assert owner == sales_user_id
            
            # Assign owner
            result = ownership_service.assign_owner(
                db, product_id=product_id, org_id=org_id,
                new_owner_id=manager_user_id, assigned_by=manager_user_id
            )
            assert result["success"]
            
            # Get history
            history = ownership_service.get_reassignment_history(
                db, product_id=product_id, org_id=org_id
            )
            assert len(history) >= 1
            
            print("✅ Ownership APIs regression passed")
            
        finally:
            db.close()


# ═══════════════════════════════════════════════════════════════════════════
# VI. AUDIT TRAIL CHECK
# ═══════════════════════════════════════════════════════════════════════════

class TestAuditTrail:
    """Verify audit trail completeness."""
    
    def test_inventory_events_complete(self, test_data):
        """Verify all status changes are logged."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Complete flow
            inventory_status_service.hold_product(
                db=db, product_id=product_id, user_id=sales_user_id,
                org_id=org_id, hold_hours=24
            )
            
            booking_id = uuid.uuid4()
            inventory_status_service.request_booking(
                db=db, product_id=product_id, user_id=sales_user_id,
                org_id=org_id, booking_id=booking_id
            )
            
            inventory_status_service.confirm_booking(
                db=db, product_id=product_id, user_id=sales_user_id,
                org_id=org_id, booking_id=booking_id
            )
            
            # Check events
            query = select(InventoryEvent).where(
                InventoryEvent.product_id == product_id
            ).order_by(InventoryEvent.created_at.asc())
            
            result = db.execute(query)
            events = list(result.scalars().all())
            
            # Should have at least 3 events (hold, booking_pending, booked)
            assert len(events) >= 3
            
            # Verify transitions
            statuses = [(e.old_status, e.new_status) for e in events]
            expected = [
                ("available", "hold"),
                ("hold", "booking_pending"),
                ("booking_pending", "booked"),
            ]
            
            for exp, actual in zip(expected, statuses):
                assert exp == actual, f"Expected {exp}, got {actual}"
            
            print(f"✅ Audit trail complete: {len(events)} events logged")
            
        finally:
            db.close()
    
    def test_price_history_complete(self, test_data):
        """Verify price changes are logged."""
        db = SessionLocal()
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        product_id = create_fresh_product(db, org_id, sales_user_id)
        
        try:
            # Multiple price changes
            price_service.set_price(
                db, product_id=product_id, org_id=org_id,
                price_type=PriceType.SALE_PRICE, new_price=Decimal("1000000000"),
                effective_from=date.today(), changed_by=sales_user_id, reason="Initial"
            )
            
            price_service.set_price(
                db, product_id=product_id, org_id=org_id,
                price_type=PriceType.SALE_PRICE, new_price=Decimal("1100000000"),
                effective_from=date.today(), changed_by=sales_user_id, reason="Adjustment"
            )
            
            # Check history
            history = price_service.get_price_history(
                db, product_id=product_id, org_id=org_id
            )
            
            assert len(history) >= 2
            print(f"✅ Price history complete: {len(history)} records")
            
        finally:
            db.close()


# ═══════════════════════════════════════════════════════════════════════════
# VII. PERFORMANCE CHECK
# ═══════════════════════════════════════════════════════════════════════════

class TestPerformance:
    """Test concurrent operations and performance."""
    
    def test_concurrent_hold_same_product(self, test_data):
        """Multiple users trying to hold same product concurrently."""
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        manager_user_id = test_data["manager_user_id"]
        
        # Create fresh product
        db = SessionLocal()
        product_id = create_fresh_product(db, org_id, sales_user_id)
        db.close()
        
        results = {"success": 0, "collision": 0, "errors": []}
        lock = threading.Lock()
        
        def try_hold(user_id):
            db = SessionLocal()
            try:
                inventory_status_service.hold_product(
                    db=db, product_id=product_id, user_id=user_id,
                    org_id=org_id, hold_hours=24
                )
                with lock:
                    results["success"] += 1
            except HoldCollisionError:
                with lock:
                    results["collision"] += 1
            except Exception as e:
                with lock:
                    results["errors"].append(str(e))
            finally:
                db.close()
        
        # Run concurrent holds
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(try_hold, sales_user_id),
                executor.submit(try_hold, manager_user_id),
            ]
            for f in as_completed(futures):
                pass  # Wait for completion
        
        # Exactly one should succeed, one should get collision
        assert results["success"] == 1, f"Expected 1 success, got {results['success']}"
        assert results["collision"] == 1, f"Expected 1 collision, got {results['collision']}"
        assert len(results["errors"]) == 0, f"Unexpected errors: {results['errors']}"
        
        print(f"✅ Concurrent hold test passed: 1 success, 1 collision")
    
    def test_concurrent_bookings_different_products(self, test_data):
        """Multiple bookings on different products should all succeed."""
        org_id = test_data["org_id"]
        sales_user_id = test_data["sales_user_id"]
        
        # Create multiple products
        db = SessionLocal()
        product_ids = [
            create_fresh_product(db, org_id, sales_user_id)
            for _ in range(5)
        ]
        db.close()
        
        results = {"success": 0, "errors": []}
        lock = threading.Lock()
        
        def process_product(product_id):
            db = SessionLocal()
            try:
                # Hold
                inventory_status_service.hold_product(
                    db=db, product_id=product_id, user_id=sales_user_id,
                    org_id=org_id, hold_hours=24
                )
                
                # Booking
                booking_id = uuid.uuid4()
                inventory_status_service.request_booking(
                    db=db, product_id=product_id, user_id=sales_user_id,
                    org_id=org_id, booking_id=booking_id
                )
                
                with lock:
                    results["success"] += 1
            except Exception as e:
                with lock:
                    results["errors"].append(str(e))
            finally:
                db.close()
        
        # Process all products concurrently
        start = time.time()
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_product, pid) for pid in product_ids]
            for f in as_completed(futures):
                pass
        elapsed = time.time() - start
        
        assert results["success"] == 5, f"Expected 5 successes, got {results['success']}"
        assert len(results["errors"]) == 0, f"Errors: {results['errors']}"
        
        print(f"✅ Concurrent booking test passed: 5 products processed in {elapsed:.2f}s")


# ═══════════════════════════════════════════════════════════════════════════
# RUN ALL TESTS
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
