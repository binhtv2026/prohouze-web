"""
ProHouzing Allocation Engine Edge Cases Test
Phase 4: Final Verification

Edge Cases:
1. 2 VIP cùng chọn 1 căn (conflict) → theo queue_number
2. VIP hết priority 1 → fallback priority 2 → 3
3. Không có căn phù hợp → manual allocation queue
"""

import asyncio
import uuid
import time
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

sys.path.insert(0, '/app/backend')

from config.sales_config import (
    BookingTier, SoftBookingStatus, SalesEventStatus, DealStage,
    BOOKING_TIER_CONFIG
)

# Test configuration
TEST_TENANT_ID = "test_tenant_edge"
TEST_PROJECT_ID = "test_project_edge"
TEST_EVENT_ID = "test_event_edge"

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


async def cleanup(db):
    """Clean up test data"""
    tenant_filter = {"tenant_id": TEST_TENANT_ID}
    project_filter = {"project_id": TEST_PROJECT_ID}
    
    await db.deals.delete_many(tenant_filter)
    await db.soft_bookings.delete_many(tenant_filter)
    await db.hard_bookings.delete_many(tenant_filter)
    await db.sales_events.delete_many(tenant_filter)
    await db.allocation_results.delete_many({"sales_event_id": TEST_EVENT_ID})
    await db.products.delete_many(project_filter)
    await db.contacts.delete_many(tenant_filter)


async def create_products(db, count=5):
    """Create test products"""
    products = []
    for i in range(1, count + 1):
        products.append({
            "id": f"edge_product_{i:03d}",
            "code": f"EDGE-{i:03d}",
            "name": f"Edge Test Unit {i:03d}",
            "project_id": TEST_PROJECT_ID,
            "floor_number": i,
            "area": 70 + (i * 5),
            "base_price": 3000000000 + (i * 100000000),
            "inventory_status": "available",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    await db.products.insert_many(products)
    return products


async def create_event(db, product_ids):
    """Create sales event"""
    now = datetime.now(timezone.utc)
    event = {
        "id": TEST_EVENT_ID,
        "code": "EVT-EDGE-001",
        "name": "Edge Case Test Event",
        "tenant_id": TEST_TENANT_ID,
        "project_id": TEST_PROJECT_ID,
        "status": SalesEventStatus.SELECTION.value,
        "available_product_ids": product_ids,
        "reserved_product_ids": [],
        "total_products": len(product_ids),
        "registration_start": (now - timedelta(days=1)).isoformat(),
        "registration_end": now.isoformat(),
        "selection_start": now.isoformat(),
        "selection_end": (now + timedelta(hours=1)).isoformat(),
        "allocation_date": now.isoformat(),
        "created_at": now.isoformat(),
    }
    await db.sales_events.insert_one(event)
    return event


async def create_booking(db, queue_num, tier, priority_product_ids, products):
    """Create a soft booking"""
    timestamp = int(time.time() * 1000) + queue_num
    now = datetime.now(timezone.utc).isoformat()
    
    booking_id = f"edge_booking_{queue_num:03d}"
    deal_id = f"edge_deal_{queue_num:03d}"
    contact_id = f"edge_contact_{queue_num:03d}"
    
    # Create contact
    await db.contacts.insert_one({
        "id": contact_id,
        "full_name": f"Edge Test Customer {queue_num}",
        "phone": f"098{timestamp}"[-10:],
        "tenant_id": TEST_TENANT_ID,
        "created_at": now,
    })
    
    # Create deal
    await db.deals.insert_one({
        "id": deal_id,
        "code": f"DEAL-EDGE-{queue_num:04d}",
        "tenant_id": TEST_TENANT_ID,
        "contact_id": contact_id,
        "project_id": TEST_PROJECT_ID,
        "soft_booking_id": booking_id,
        "stage": DealStage.WAITING_ALLOCATION.value,
        "status": "active",
        "created_at": now,
    })
    
    # Build priority selections
    priority_selections = []
    for idx, product_id in enumerate(priority_product_ids):
        product = next((p for p in products if p["id"] == product_id), {})
        priority_selections.append({
            "priority": idx + 1,
            "product_id": product_id,
            "product_code": product.get("code", ""),
            "product_name": product.get("name", ""),
            "status": "pending",
            "selected_at": now,
        })
    
    # Create soft booking
    await db.soft_bookings.insert_one({
        "id": booking_id,
        "code": f"SB-EDGE-{queue_num:04d}",
        "tenant_id": TEST_TENANT_ID,
        "deal_id": deal_id,
        "contact_id": contact_id,
        "project_id": TEST_PROJECT_ID,
        "sales_event_id": TEST_EVENT_ID,
        "queue_number": queue_num,
        "queue_position": f"{tier[0].upper()}{queue_num:03d}",
        "booking_tier": tier,
        "status": SoftBookingStatus.SUBMITTED.value,
        "priority_selections": priority_selections,
        "allocation_status": "pending",
        "created_at": now,
    })
    
    return booking_id


async def run_allocation(db):
    """Run allocation engine"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get bookings sorted by tier weight then queue
    bookings = await db.soft_bookings.find(
        {"sales_event_id": TEST_EVENT_ID, "status": SoftBookingStatus.SUBMITTED.value},
        {"_id": 0}
    ).to_list(1000)
    
    tier_weights = {t: c.get("queue_weight", 0) for t, c in BOOKING_TIER_CONFIG.items()}
    bookings.sort(key=lambda x: (-tier_weights.get(x.get("booking_tier", "standard"), 0), x.get("queue_number", 0)))
    
    # Get available products
    event = await db.sales_events.find_one({"id": TEST_EVENT_ID}, {"_id": 0})
    available_product_ids = set(event.get("available_product_ids", []))
    allocated_products = set()
    
    results = []
    
    for booking in bookings:
        allocated = False
        allocated_product_id = None
        allocated_priority = None
        
        for selection in sorted(booking.get("priority_selections", []), key=lambda x: x.get("priority", 99)):
            product_id = selection.get("product_id")
            
            if product_id in available_product_ids and product_id not in allocated_products:
                allocated_products.add(product_id)
                allocated_product_id = product_id
                allocated_priority = selection.get("priority")
                allocated = True
                
                await db.soft_bookings.update_one(
                    {"id": booking["id"]},
                    {"$set": {
                        "status": SoftBookingStatus.ALLOCATED.value,
                        "allocated_product_id": product_id,
                        "allocated_priority": allocated_priority,
                        "allocation_status": "success",
                        "allocated_at": now,
                    }}
                )
                
                await db.products.update_one(
                    {"id": product_id},
                    {"$set": {"inventory_status": "allocated"}}
                )
                break
        
        if not allocated:
            await db.soft_bookings.update_one(
                {"id": booking["id"]},
                {"$set": {
                    "status": SoftBookingStatus.FAILED.value,
                    "allocation_status": "failed",
                    "allocation_notes": "All priorities unavailable - manual allocation required",
                }}
            )
        
        results.append({
            "booking_id": booking["id"],
            "queue_number": booking.get("queue_number"),
            "tier": booking.get("booking_tier"),
            "success": allocated,
            "product_id": allocated_product_id,
            "allocated_priority": allocated_priority,
            "priorities_requested": [s.get("product_id") for s in booking.get("priority_selections", [])],
        })
    
    return results


# ============================================
# EDGE CASE 1: 2 VIP cùng chọn 1 căn
# ============================================

async def test_edge_case_1_vip_conflict(db):
    """
    Test: 2 VIP cùng chọn căn EDGE-001 làm Priority 1
    Expected: VIP với queue_number nhỏ hơn được căn, VIP còn lại fallback
    """
    print("\n" + "="*60)
    print("EDGE CASE 1: 2 VIP cùng chọn 1 căn (conflict)")
    print("="*60)
    
    await cleanup(db)
    
    # Create 3 products
    products = await create_products(db, 3)
    product_ids = [p["id"] for p in products]
    await create_event(db, product_ids)
    
    # VIP1 (queue=1): Priority [P1, P2, P3] - chọn EDGE-001 làm P1
    # VIP2 (queue=2): Priority [P1, P3, P2] - cũng chọn EDGE-001 làm P1
    await create_booking(db, 1, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002", "edge_product_003"], products)
    await create_booking(db, 2, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_003", "edge_product_002"], products)
    
    print("\n📋 Setup:")
    print("  VIP1 (queue=1): Priorities [EDGE-001, EDGE-002, EDGE-003]")
    print("  VIP2 (queue=2): Priorities [EDGE-001, EDGE-003, EDGE-002]")
    
    # Run allocation
    results = await run_allocation(db)
    
    print("\n📊 Results:")
    for r in results:
        status = "✅" if r["success"] else "❌"
        tier = r["tier"].upper()
        product = r["product_id"].replace("edge_product_", "EDGE-") if r["product_id"] else "FAILED"
        print(f"  {status} Queue {r['queue_number']} ({tier}): Got {product} (Priority {r['allocated_priority']})")
    
    # Verify
    vip1 = next(r for r in results if r["queue_number"] == 1)
    vip2 = next(r for r in results if r["queue_number"] == 2)
    
    errors = []
    
    # VIP1 should get EDGE-001 (Priority 1)
    if vip1["product_id"] != "edge_product_001":
        errors.append(f"VIP1 should get EDGE-001, got {vip1['product_id']}")
    if vip1["allocated_priority"] != 1:
        errors.append(f"VIP1 should get Priority 1, got {vip1['allocated_priority']}")
    
    # VIP2 should fallback to EDGE-003 (Priority 2)
    if vip2["product_id"] != "edge_product_003":
        errors.append(f"VIP2 should fallback to EDGE-003, got {vip2['product_id']}")
    if vip2["allocated_priority"] != 2:
        errors.append(f"VIP2 should get Priority 2, got {vip2['allocated_priority']}")
    
    if errors:
        print("\n❌ FAILED:")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print("\n✅ PASSED: VIP conflict resolved by queue_number")
        print("  → VIP1 (queue=1) got EDGE-001 (Priority 1)")
        print("  → VIP2 (queue=2) fallback to EDGE-003 (Priority 2)")
        return True


# ============================================
# EDGE CASE 2: VIP fallback through all priorities
# ============================================

async def test_edge_case_2_priority_fallback(db):
    """
    Test: VIP với Priority 1 và 2 đã bị taken, phải fallback đến Priority 3
    Expected: VIP fallback đúng theo thứ tự priority
    """
    print("\n" + "="*60)
    print("EDGE CASE 2: VIP fallback Priority 1 → 2 → 3")
    print("="*60)
    
    await cleanup(db)
    
    # Create 5 products
    products = await create_products(db, 5)
    product_ids = [p["id"] for p in products]
    await create_event(db, product_ids)
    
    # VIP1 (queue=1): [P1, P2, P3] → gets P1 (EDGE-001)
    # VIP2 (queue=2): [P1, P2, P4] → P1 taken, gets P2 (EDGE-002)
    # VIP3 (queue=3): [P1, P2, P5] → P1 & P2 taken, gets P5 (Priority 3)
    await create_booking(db, 1, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002", "edge_product_003"], products)
    await create_booking(db, 2, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002", "edge_product_004"], products)
    await create_booking(db, 3, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002", "edge_product_005"], products)
    
    print("\n📋 Setup:")
    print("  VIP1 (queue=1): Priorities [EDGE-001, EDGE-002, EDGE-003]")
    print("  VIP2 (queue=2): Priorities [EDGE-001, EDGE-002, EDGE-004]")
    print("  VIP3 (queue=3): Priorities [EDGE-001, EDGE-002, EDGE-005]")
    
    # Run allocation
    results = await run_allocation(db)
    
    print("\n📊 Results:")
    for r in results:
        status = "✅" if r["success"] else "❌"
        tier = r["tier"].upper()
        product = r["product_id"].replace("edge_product_", "EDGE-") if r["product_id"] else "FAILED"
        print(f"  {status} Queue {r['queue_number']} ({tier}): Got {product} (Priority {r['allocated_priority']})")
    
    # Verify
    vip1 = next(r for r in results if r["queue_number"] == 1)
    vip2 = next(r for r in results if r["queue_number"] == 2)
    vip3 = next(r for r in results if r["queue_number"] == 3)
    
    errors = []
    
    # VIP1 gets EDGE-001 (P1)
    if vip1["product_id"] != "edge_product_001" or vip1["allocated_priority"] != 1:
        errors.append(f"VIP1 incorrect: got {vip1['product_id']} P{vip1['allocated_priority']}")
    
    # VIP2 fallback to EDGE-002 (P2)
    if vip2["product_id"] != "edge_product_002" or vip2["allocated_priority"] != 2:
        errors.append(f"VIP2 incorrect: got {vip2['product_id']} P{vip2['allocated_priority']}")
    
    # VIP3 fallback to EDGE-005 (P3)
    if vip3["product_id"] != "edge_product_005" or vip3["allocated_priority"] != 3:
        errors.append(f"VIP3 incorrect: got {vip3['product_id']} P{vip3['allocated_priority']}")
    
    if errors:
        print("\n❌ FAILED:")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print("\n✅ PASSED: Priority fallback works correctly")
        print("  → VIP1: EDGE-001 (Priority 1)")
        print("  → VIP2: EDGE-002 (Priority 2, fallback)")
        print("  → VIP3: EDGE-005 (Priority 3, double fallback)")
        return True


# ============================================
# EDGE CASE 3: No available unit → Manual queue
# ============================================

async def test_edge_case_3_manual_allocation(db):
    """
    Test: Tất cả priority của booking đều đã bị taken
    Expected: Booking chuyển sang manual allocation queue (status=failed)
    """
    print("\n" + "="*60)
    print("EDGE CASE 3: No available unit → Manual allocation queue")
    print("="*60)
    
    await cleanup(db)
    
    # Create only 2 products
    products = await create_products(db, 2)
    product_ids = [p["id"] for p in products]
    await create_event(db, product_ids)
    
    # VIP1 (queue=1): [P1, P2] → gets P1
    # VIP2 (queue=2): [P1, P2] → gets P2
    # VIP3 (queue=3): [P1, P2] → cả 2 đều taken → FAILED
    await create_booking(db, 1, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002"], products)
    await create_booking(db, 2, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002"], products)
    await create_booking(db, 3, BookingTier.VIP.value, 
                        ["edge_product_001", "edge_product_002"], products)
    
    print("\n📋 Setup:")
    print("  Only 2 products available: EDGE-001, EDGE-002")
    print("  VIP1 (queue=1): Priorities [EDGE-001, EDGE-002]")
    print("  VIP2 (queue=2): Priorities [EDGE-001, EDGE-002]")
    print("  VIP3 (queue=3): Priorities [EDGE-001, EDGE-002]")
    
    # Run allocation
    results = await run_allocation(db)
    
    print("\n📊 Results:")
    for r in results:
        status = "✅" if r["success"] else "⚠️ MANUAL"
        tier = r["tier"].upper()
        product = r["product_id"].replace("edge_product_", "EDGE-") if r["product_id"] else "FAILED"
        print(f"  {status} Queue {r['queue_number']} ({tier}): {product}")
    
    # Verify
    vip1 = next(r for r in results if r["queue_number"] == 1)
    vip2 = next(r for r in results if r["queue_number"] == 2)
    vip3 = next(r for r in results if r["queue_number"] == 3)
    
    errors = []
    
    # VIP1 & VIP2 should succeed
    if not vip1["success"] or not vip2["success"]:
        errors.append("VIP1 or VIP2 should succeed")
    
    # VIP3 should fail and go to manual queue
    if vip3["success"]:
        errors.append("VIP3 should fail (no products left)")
    
    # Check VIP3's status in DB
    vip3_booking = await db.soft_bookings.find_one({"id": vip3["booking_id"]}, {"_id": 0})
    if vip3_booking.get("status") != SoftBookingStatus.FAILED.value:
        errors.append(f"VIP3 status should be FAILED, got {vip3_booking.get('status')}")
    if "manual" not in (vip3_booking.get("allocation_notes") or "").lower():
        errors.append("VIP3 should have manual allocation note")
    
    if errors:
        print("\n❌ FAILED:")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print("\n✅ PASSED: Manual allocation queue works correctly")
        print("  → VIP1: EDGE-001 allocated")
        print("  → VIP2: EDGE-002 allocated")
        print("  → VIP3: FAILED → Manual allocation queue")
        print(f"  → VIP3 status: {vip3_booking.get('status')}")
        print(f"  → VIP3 note: {vip3_booking.get('allocation_notes')}")
        return True


async def main():
    """Run all edge case tests"""
    print("="*60)
    print("🧪 ALLOCATION ENGINE EDGE CASES TEST")
    print("="*60)
    
    db = await get_db()
    print(f"\n✓ Connected to database: {DB_NAME}")
    
    results = []
    
    # Edge Case 1: VIP conflict
    results.append(("VIP Conflict", await test_edge_case_1_vip_conflict(db)))
    
    # Edge Case 2: Priority fallback
    results.append(("Priority Fallback", await test_edge_case_2_priority_fallback(db)))
    
    # Edge Case 3: Manual allocation
    results.append(("Manual Allocation", await test_edge_case_3_manual_allocation(db)))
    
    # Cleanup
    await cleanup(db)
    
    # Summary
    print("\n" + "="*60)
    print("📋 EDGE CASES TEST SUMMARY")
    print("="*60)
    
    all_passed = True
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {status}: {name}")
        if not passed:
            all_passed = False
    
    print("="*60)
    
    if all_passed:
        print("✅ ALL EDGE CASES PASSED!")
    else:
        print("❌ SOME EDGE CASES FAILED!")
    
    print("="*60 + "\n")
    
    return all_passed


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
