"""
ProHouzing Allocation Engine Performance Test
Phase 4: Testing & Verification - Prompt 8/20

Performance tests:
1. 1,000 units
2. 5,000 - 10,000 bookings
3. Large batch allocation
"""

import asyncio
import uuid
import time
import random
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
TEST_TENANT_ID = "test_tenant_perf"
TEST_PROJECT_ID = "test_project_perf"
TEST_EVENT_ID = "test_event_perf"

# Scale configuration
NUM_PRODUCTS = 1000
NUM_BOOKINGS = 5000  # 5,000 bookings as requested

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


async def cleanup_perf_data(db):
    """Clean up performance test data"""
    print("\n🧹 Cleaning up performance test data...")
    
    tenant_filter = {"tenant_id": TEST_TENANT_ID}
    project_filter = {"project_id": TEST_PROJECT_ID}
    
    await db.deals.delete_many(tenant_filter)
    await db.soft_bookings.delete_many(tenant_filter)
    await db.hard_bookings.delete_many(tenant_filter)
    await db.sales_events.delete_many(tenant_filter)
    await db.allocation_results.delete_many({"sales_event_id": TEST_EVENT_ID})
    await db.products.delete_many(project_filter)
    await db.contacts.delete_many(tenant_filter)
    
    print("✓ Performance test data cleaned")


async def create_bulk_products(db, count=1000):
    """Create products in bulk"""
    print(f"\n📦 Creating {count} products...")
    start = time.time()
    
    products = []
    for i in range(1, count + 1):
        block = chr(65 + (i % 5))  # A-E
        floor = (i // 20) + 1
        unit = (i % 20) + 1
        
        products.append({
            "id": f"perf_product_{i:05d}",
            "code": f"{block}{floor:02d}{unit:02d}",
            "name": f"Căn hộ {block}{floor:02d}{unit:02d}",
            "project_id": TEST_PROJECT_ID,
            "block_id": f"block_{block.lower()}",
            "floor_number": floor,
            "direction": ["dong", "tay", "nam", "bac"][i % 4],
            "area": 50 + (i % 100),
            "base_price": 2000000000 + (i * 10000000),
            "price_per_sqm": 35000000 + (i % 10) * 1000000,
            "view": ["city", "river", "garden", "pool"][i % 4],
            "inventory_status": "available",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        
        # Insert in batches of 500
        if len(products) >= 500:
            await db.products.insert_many(products)
            products = []
    
    if products:
        await db.products.insert_many(products)
    
    elapsed = time.time() - start
    print(f"✓ Created {count} products in {elapsed:.2f}s ({count/elapsed:.0f} products/s)")
    return elapsed


async def create_bulk_contacts(db, count):
    """Create contacts in bulk"""
    print(f"\n👥 Creating {count} contacts...")
    start = time.time()
    
    # Generate unique timestamp for phone numbers
    timestamp = int(time.time())
    
    contacts = []
    for i in range(1, count + 1):
        contacts.append({
            "id": f"perf_contact_{i:05d}",
            "full_name": f"Khách hàng Perf {i:05d}",
            "phone": f"08{timestamp}{i:05d}"[-10:],  # Unique phone
            "email": f"perf{timestamp}_{i:05d}@test.com",
            "tenant_id": TEST_TENANT_ID,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        
        if len(contacts) >= 500:
            await db.contacts.insert_many(contacts)
            contacts = []
    
    if contacts:
        await db.contacts.insert_many(contacts)
    
    elapsed = time.time() - start
    print(f"✓ Created {count} contacts in {elapsed:.2f}s ({count/elapsed:.0f} contacts/s)")
    return elapsed


async def create_bulk_bookings(db, num_bookings, num_products):
    """Create bookings in bulk with random tiers and priorities"""
    print(f"\n🎫 Creating {num_bookings} bookings...")
    start = time.time()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Tier distribution: 5% VIP, 15% Priority, 80% Standard
    tier_distribution = (
        [BookingTier.VIP.value] * 5 +
        [BookingTier.PRIORITY.value] * 15 +
        [BookingTier.STANDARD.value] * 80
    )
    
    deals = []
    bookings = []
    
    for i in range(1, num_bookings + 1):
        tier = random.choice(tier_distribution)
        
        # Generate 3 random priority product indices
        priority_indices = random.sample(range(1, num_products + 1), min(3, num_products))
        
        deal_id = f"perf_deal_{i:05d}"
        booking_id = f"perf_booking_{i:05d}"
        
        deals.append({
            "id": deal_id,
            "code": f"DEAL-PERF-{i:05d}",
            "tenant_id": TEST_TENANT_ID,
            "contact_id": f"perf_contact_{i:05d}",
            "project_id": TEST_PROJECT_ID,
            "soft_booking_id": booking_id,
            "stage": DealStage.WAITING_ALLOCATION.value,
            "status": "active",
            "estimated_value": 3000000000,
            "created_at": now,
        })
        
        priority_selections = []
        for p_idx, prod_idx in enumerate(priority_indices):
            priority_selections.append({
                "priority": p_idx + 1,
                "product_id": f"perf_product_{prod_idx:05d}",
                "product_code": f"X{prod_idx:04d}",
                "status": "pending",
                "selected_at": now,
            })
        
        bookings.append({
            "id": booking_id,
            "code": f"SB-PERF-{i:05d}",
            "tenant_id": TEST_TENANT_ID,
            "deal_id": deal_id,
            "contact_id": f"perf_contact_{i:05d}",
            "project_id": TEST_PROJECT_ID,
            "sales_event_id": TEST_EVENT_ID,
            "queue_number": i,
            "queue_position": f"{tier[0].upper()}{i:04d}",
            "booking_tier": tier,
            "status": SoftBookingStatus.SUBMITTED.value,
            "booking_fee": 50000000,
            "booking_fee_paid": 50000000,
            "booking_fee_status": "paid",
            "priority_selections": priority_selections,
            "allocation_status": "pending",
            "created_at": now,
        })
        
        # Insert in batches
        if len(bookings) >= 500:
            await db.deals.insert_many(deals)
            await db.soft_bookings.insert_many(bookings)
            deals = []
            bookings = []
            
            # Progress
            if i % 1000 == 0:
                elapsed = time.time() - start
                print(f"  → {i}/{num_bookings} ({i/elapsed:.0f} bookings/s)")
    
    if bookings:
        await db.deals.insert_many(deals)
        await db.soft_bookings.insert_many(bookings)
    
    elapsed = time.time() - start
    print(f"✓ Created {num_bookings} bookings in {elapsed:.2f}s ({num_bookings/elapsed:.0f} bookings/s)")
    return elapsed


async def create_perf_sales_event(db, num_products):
    """Create sales event for performance test"""
    print("\n📅 Creating performance test sales event...")
    
    now = datetime.now(timezone.utc)
    product_ids = [f"perf_product_{i:05d}" for i in range(1, num_products + 1)]
    
    event = {
        "id": TEST_EVENT_ID,
        "code": "EVT-PERF-001",
        "name": "Performance Test Event",
        "tenant_id": TEST_TENANT_ID,
        "project_id": TEST_PROJECT_ID,
        "registration_start": (now - timedelta(days=7)).isoformat(),
        "registration_end": (now - timedelta(days=1)).isoformat(),
        "selection_start": (now - timedelta(hours=12)).isoformat(),
        "selection_end": now.isoformat(),
        "allocation_date": now.isoformat(),
        "status": SalesEventStatus.SELECTION.value,
        "available_product_ids": product_ids,
        "reserved_product_ids": product_ids[:50],  # First 50 reserved for VIP
        "total_products": num_products,
        "created_at": now.isoformat(),
    }
    
    await db.sales_events.insert_one(event)
    print(f"✓ Created event with {num_products} products")


async def run_allocation_perf_test(db):
    """Run allocation performance test"""
    print("\n" + "="*60)
    print("🎯 RUNNING ALLOCATION PERFORMANCE TEST")
    print("="*60)
    
    # Get submitted bookings
    print("\n📊 Fetching bookings...")
    fetch_start = time.time()
    
    bookings = await db.soft_bookings.find(
        {
            "sales_event_id": TEST_EVENT_ID,
            "status": SoftBookingStatus.SUBMITTED.value,
        },
        {"_id": 0}
    ).to_list(20000)
    
    fetch_time = time.time() - fetch_start
    print(f"✓ Fetched {len(bookings)} bookings in {fetch_time:.2f}s")
    
    # Sort bookings
    print("\n📊 Sorting bookings by tier and queue...")
    sort_start = time.time()
    
    tier_weights = {t: c.get("queue_weight", 0) for t, c in BOOKING_TIER_CONFIG.items()}
    bookings.sort(key=lambda x: (-tier_weights.get(x.get("booking_tier", "standard"), 0), x.get("queue_number", 0)))
    
    sort_time = time.time() - sort_start
    print(f"✓ Sorted {len(bookings)} bookings in {sort_time:.4f}s")
    
    # Count by tier
    tier_counts = {}
    for b in bookings:
        tier = b.get("booking_tier", "standard")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    print(f"\n📊 Tier distribution: {tier_counts}")
    
    # Run allocation
    print("\n🔄 Running allocation engine...")
    alloc_start = time.time()
    
    # Get event for available products
    event = await db.sales_events.find_one({"id": TEST_EVENT_ID}, {"_id": 0})
    available_product_ids = set(event.get("available_product_ids", []))
    reserved_product_ids = set(event.get("reserved_product_ids", []))
    
    allocated_products = set()
    successful = 0
    failed = 0
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Batch updates for performance
    booking_updates = []
    product_updates = []
    deal_updates = []
    
    for idx, booking in enumerate(bookings):
        allocated = False
        
        for selection in sorted(booking.get("priority_selections", []), key=lambda x: x.get("priority", 99)):
            product_id = selection.get("product_id")
            
            if product_id in available_product_ids and product_id not in allocated_products:
                # Check reserved
                if product_id in reserved_product_ids and booking.get("booking_tier") != BookingTier.VIP.value:
                    continue
                
                # Allocate
                allocated_products.add(product_id)
                allocated = True
                successful += 1
                
                # Queue updates
                booking_updates.append({
                    "filter": {"id": booking["id"]},
                    "update": {"$set": {
                        "status": SoftBookingStatus.ALLOCATED.value,
                        "allocated_product_id": product_id,
                        "allocated_priority": selection.get("priority"),
                        "allocation_status": "success",
                        "allocated_at": now,
                    }}
                })
                
                product_updates.append({
                    "filter": {"id": product_id},
                    "update": {"$set": {"inventory_status": "allocated"}}
                })
                
                deal_updates.append({
                    "filter": {"id": booking["deal_id"]},
                    "update": {"$set": {
                        "stage": DealStage.ALLOCATED.value,
                        "product_id": product_id,
                    }}
                })
                
                break
        
        if not allocated:
            failed += 1
            booking_updates.append({
                "filter": {"id": booking["id"]},
                "update": {"$set": {
                    "status": SoftBookingStatus.FAILED.value,
                    "allocation_status": "failed",
                }}
            })
        
        # Progress every 1000
        if (idx + 1) % 1000 == 0:
            elapsed = time.time() - alloc_start
            print(f"  → Processed {idx+1}/{len(bookings)} ({(idx+1)/elapsed:.0f} bookings/s)")
    
    alloc_time = time.time() - alloc_start
    print(f"\n✓ Allocation logic completed in {alloc_time:.2f}s ({len(bookings)/alloc_time:.0f} bookings/s)")
    
    # Apply batch updates
    print("\n💾 Applying database updates...")
    db_start = time.time()
    
    # Batch update bookings
    for update in booking_updates:
        await db.soft_bookings.update_one(update["filter"], update["update"])
    
    # Batch update products
    for update in product_updates:
        await db.products.update_one(update["filter"], update["update"])
    
    # Batch update deals
    for update in deal_updates:
        await db.deals.update_one(update["filter"], update["update"])
    
    db_time = time.time() - db_start
    print(f"✓ Database updates completed in {db_time:.2f}s")
    
    total_time = time.time() - alloc_start
    
    # Summary
    print("\n" + "="*60)
    print("📊 PERFORMANCE TEST RESULTS")
    print("="*60)
    print(f"\n📈 Statistics:")
    print(f"  • Total bookings: {len(bookings)}")
    print(f"  • Successful allocations: {successful}")
    print(f"  • Failed allocations: {failed}")
    print(f"  • Products allocated: {len(allocated_products)}/{len(available_product_ids)}")
    
    print(f"\n⏱️ Timing:")
    print(f"  • Fetch time: {fetch_time:.2f}s")
    print(f"  • Sort time: {sort_time:.4f}s")
    print(f"  • Allocation logic: {alloc_time:.2f}s")
    print(f"  • Database updates: {db_time:.2f}s")
    print(f"  • Total time: {total_time:.2f}s")
    
    print(f"\n🚀 Throughput:")
    print(f"  • Allocation: {len(bookings)/alloc_time:.0f} bookings/second")
    print(f"  • Total (with DB): {len(bookings)/total_time:.0f} bookings/second")
    
    return {
        "total_bookings": len(bookings),
        "successful": successful,
        "failed": failed,
        "total_time": total_time,
        "throughput": len(bookings)/total_time,
    }


async def main():
    """Main performance test runner"""
    print("="*60)
    print("🚀 PROHOUZING ALLOCATION ENGINE PERFORMANCE TEST")
    print("="*60)
    print(f"\n📋 Test Configuration:")
    print(f"  • Products: {NUM_PRODUCTS}")
    print(f"  • Bookings: {NUM_BOOKINGS}")
    
    db = await get_db()
    print(f"\n✓ Connected to database: {DB_NAME}")
    
    # Cleanup
    await cleanup_perf_data(db)
    
    # Setup
    print("\n" + "="*60)
    print("📦 SETUP PHASE")
    print("="*60)
    
    product_time = await create_bulk_products(db, NUM_PRODUCTS)
    contact_time = await create_bulk_contacts(db, NUM_BOOKINGS)
    await create_perf_sales_event(db, NUM_PRODUCTS)
    booking_time = await create_bulk_bookings(db, NUM_BOOKINGS, NUM_PRODUCTS)
    
    print(f"\n✓ Total setup time: {product_time + contact_time + booking_time:.2f}s")
    
    # Run allocation
    results = await run_allocation_perf_test(db)
    
    # Verify results
    print("\n" + "="*60)
    print("🔍 VERIFICATION")
    print("="*60)
    
    # Check allocated count
    allocated_bookings = await db.soft_bookings.count_documents({
        "sales_event_id": TEST_EVENT_ID,
        "status": SoftBookingStatus.ALLOCATED.value,
    })
    
    failed_bookings = await db.soft_bookings.count_documents({
        "sales_event_id": TEST_EVENT_ID,
        "status": SoftBookingStatus.FAILED.value,
    })
    
    allocated_products = await db.products.count_documents({
        "project_id": TEST_PROJECT_ID,
        "inventory_status": "allocated",
    })
    
    print(f"\n✓ Verified allocated bookings: {allocated_bookings}")
    print(f"✓ Verified failed bookings: {failed_bookings}")
    print(f"✓ Verified allocated products: {allocated_products}")
    
    # Performance assessment
    print("\n" + "="*60)
    print("📊 PERFORMANCE ASSESSMENT")
    print("="*60)
    
    if results["throughput"] > 100:
        print("✅ EXCELLENT: > 100 bookings/second")
    elif results["throughput"] > 50:
        print("✅ GOOD: > 50 bookings/second")
    elif results["throughput"] > 10:
        print("⚠️ ACCEPTABLE: > 10 bookings/second")
    else:
        print("❌ NEEDS OPTIMIZATION: < 10 bookings/second")
    
    # Cleanup option
    print("\n" + "="*60)
    print("🧹 Cleaning up performance test data...")
    await cleanup_perf_data(db)
    print("✓ Performance test data cleaned")
    print("="*60 + "\n")
    
    return results


if __name__ == "__main__":
    results = asyncio.run(main())
