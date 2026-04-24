"""
ProHouzing Booking Queue Race Condition Test
Phase 4: Final Verification

Tests:
1. 10,000+ bookings với concurrent insert
2. Kiểm tra queue_number không bị trùng
3. Kiểm tra không bị race condition
"""

import asyncio
import time
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, '/app/backend')

from config.sales_config import BookingTier, SoftBookingStatus, SalesEventStatus

# Test configuration
TEST_TENANT_ID = "test_tenant_race"
TEST_PROJECT_ID = "test_project_race"
TEST_EVENT_ID = "test_event_race"

NUM_BOOKINGS = 10000
CONCURRENT_WORKERS = 50

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


def get_sync_client():
    """Get synchronous MongoDB client for threading"""
    from pymongo import MongoClient
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


async def get_async_client():
    """Get async MongoDB client"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


async def cleanup(db):
    """Clean up test data"""
    print("\n🧹 Cleaning up race condition test data...")
    tenant_filter = {"tenant_id": TEST_TENANT_ID}
    project_filter = {"project_id": TEST_PROJECT_ID}
    
    await db.deals.delete_many(tenant_filter)
    await db.soft_bookings.delete_many(tenant_filter)
    await db.sales_events.delete_many(tenant_filter)
    await db.products.delete_many(project_filter)
    await db.contacts.delete_many(tenant_filter)
    await db.counters.delete_many({"_id": {"$regex": "^race_"}})
    print("✓ Test data cleaned")


async def setup_test_data(db):
    """Setup test products and event"""
    print("\n📦 Setting up test data...")
    
    # Create 100 products
    products = []
    for i in range(1, 101):
        products.append({
            "id": f"race_product_{i:03d}",
            "code": f"RACE-{i:03d}",
            "project_id": TEST_PROJECT_ID,
            "inventory_status": "available",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    await db.products.insert_many(products)
    print(f"✓ Created {len(products)} products")
    
    # Create event
    now = datetime.now(timezone.utc)
    event = {
        "id": TEST_EVENT_ID,
        "code": "EVT-RACE-001",
        "name": "Race Condition Test Event",
        "tenant_id": TEST_TENANT_ID,
        "project_id": TEST_PROJECT_ID,
        "status": SalesEventStatus.SELECTION.value,
        "available_product_ids": [p["id"] for p in products],
        "registration_start": (now - timedelta(days=1)).isoformat(),
        "registration_end": now.isoformat(),
        "selection_start": now.isoformat(),
        "selection_end": (now + timedelta(hours=1)).isoformat(),
        "allocation_date": now.isoformat(),
        "created_at": now.isoformat(),
    }
    await db.sales_events.insert_one(event)
    print(f"✓ Created sales event")
    
    return products


def get_next_queue_number_atomic(db, project_id, event_id):
    """
    Atomic queue number generation using findAndModify
    This prevents race conditions
    """
    counter_id = f"race_queue_{project_id}_{event_id}"
    
    result = db.counters.find_one_and_update(
        {"_id": counter_id},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    
    return result.get("seq", 1)


def create_booking_sync(worker_id, booking_index):
    """Create booking synchronously (for threading)"""
    db = get_sync_client()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get atomic queue number
    queue_number = get_next_queue_number_atomic(db, TEST_PROJECT_ID, TEST_EVENT_ID)
    
    tier = random.choice([BookingTier.VIP.value, BookingTier.PRIORITY.value, BookingTier.STANDARD.value])
    
    booking_id = f"race_booking_{booking_index:06d}"
    contact_id = f"race_contact_{booking_index:06d}"
    deal_id = f"race_deal_{booking_index:06d}"
    
    # Create contact
    db.contacts.insert_one({
        "id": contact_id,
        "full_name": f"Race Test {booking_index}",
        "phone": f"097{booking_index:07d}",
        "tenant_id": TEST_TENANT_ID,
        "created_at": now,
    })
    
    # Create deal
    db.deals.insert_one({
        "id": deal_id,
        "code": f"DEAL-RACE-{booking_index:06d}",
        "tenant_id": TEST_TENANT_ID,
        "contact_id": contact_id,
        "project_id": TEST_PROJECT_ID,
        "soft_booking_id": booking_id,
        "status": "active",
        "created_at": now,
    })
    
    # Create soft booking
    db.soft_bookings.insert_one({
        "id": booking_id,
        "code": f"SB-RACE-{booking_index:06d}",
        "tenant_id": TEST_TENANT_ID,
        "deal_id": deal_id,
        "contact_id": contact_id,
        "project_id": TEST_PROJECT_ID,
        "sales_event_id": TEST_EVENT_ID,
        "queue_number": queue_number,
        "booking_tier": tier,
        "status": SoftBookingStatus.SUBMITTED.value,
        "created_at": now,
    })
    
    return queue_number


async def run_concurrent_test():
    """Run concurrent booking creation test"""
    print("\n" + "="*60)
    print("🏃 CONCURRENT BOOKING CREATION TEST")
    print(f"   {NUM_BOOKINGS} bookings with {CONCURRENT_WORKERS} concurrent workers")
    print("="*60)
    
    start_time = time.time()
    created_queue_numbers = []
    
    # Use ThreadPoolExecutor for concurrent creation
    with ThreadPoolExecutor(max_workers=CONCURRENT_WORKERS) as executor:
        # Create booking indices
        booking_indices = list(range(1, NUM_BOOKINGS + 1))
        
        # Submit all tasks
        futures = []
        for idx in booking_indices:
            worker_id = idx % CONCURRENT_WORKERS
            future = executor.submit(create_booking_sync, worker_id, idx)
            futures.append(future)
        
        # Progress tracking
        completed = 0
        for future in futures:
            queue_num = future.result()
            created_queue_numbers.append(queue_num)
            completed += 1
            
            if completed % 1000 == 0:
                elapsed = time.time() - start_time
                rate = completed / elapsed
                print(f"  → Created {completed}/{NUM_BOOKINGS} bookings ({rate:.0f}/s)")
    
    elapsed = time.time() - start_time
    print(f"\n✓ Created {NUM_BOOKINGS} bookings in {elapsed:.2f}s ({NUM_BOOKINGS/elapsed:.0f}/s)")
    
    return created_queue_numbers


async def verify_no_race_condition(db, queue_numbers):
    """Verify no race condition occurred"""
    print("\n" + "="*60)
    print("🔍 VERIFICATION: Race Condition Check")
    print("="*60)
    
    errors = []
    
    # Check 1: All queue numbers are unique
    print("\n1️⃣ Checking queue number uniqueness...")
    unique_queue_numbers = set(queue_numbers)
    if len(unique_queue_numbers) != len(queue_numbers):
        duplicates = len(queue_numbers) - len(unique_queue_numbers)
        errors.append(f"DUPLICATE queue numbers detected: {duplicates} duplicates")
        print(f"  ❌ FAILED: {duplicates} duplicate queue numbers!")
    else:
        print(f"  ✅ All {len(queue_numbers)} queue numbers are unique")
    
    # Check 2: Queue numbers are sequential (1 to N)
    print("\n2️⃣ Checking queue number sequence...")
    sorted_queue_numbers = sorted(queue_numbers)
    expected = list(range(1, NUM_BOOKINGS + 1))
    
    if sorted_queue_numbers != expected:
        # Find gaps
        missing = set(expected) - set(sorted_queue_numbers)
        extra = set(sorted_queue_numbers) - set(expected)
        if missing:
            errors.append(f"Missing queue numbers: {list(missing)[:10]}...")
        if extra:
            errors.append(f"Extra queue numbers: {list(extra)[:10]}...")
        print(f"  ❌ FAILED: Queue numbers not sequential")
    else:
        print(f"  ✅ Queue numbers are sequential (1 to {NUM_BOOKINGS})")
    
    # Check 3: Database verification
    print("\n3️⃣ Checking database records...")
    db_count = await db.soft_bookings.count_documents({"sales_event_id": TEST_EVENT_ID})
    if db_count != NUM_BOOKINGS:
        errors.append(f"Database count mismatch: expected {NUM_BOOKINGS}, got {db_count}")
        print(f"  ❌ FAILED: Expected {NUM_BOOKINGS} records, found {db_count}")
    else:
        print(f"  ✅ Database has exactly {db_count} bookings")
    
    # Check 4: No duplicate queue_number in DB
    print("\n4️⃣ Checking database for duplicate queue_numbers...")
    pipeline = [
        {"$match": {"sales_event_id": TEST_EVENT_ID}},
        {"$group": {"_id": "$queue_number", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}}
    ]
    duplicates_in_db = await db.soft_bookings.aggregate(pipeline).to_list(100)
    
    if duplicates_in_db:
        errors.append(f"Duplicate queue_numbers in DB: {[d['_id'] for d in duplicates_in_db]}")
        print(f"  ❌ FAILED: Found {len(duplicates_in_db)} duplicate queue_numbers in DB")
    else:
        print(f"  ✅ No duplicate queue_numbers in database")
    
    # Summary
    print("\n" + "="*60)
    if errors:
        print("❌ RACE CONDITION DETECTED!")
        for e in errors:
            print(f"  • {e}")
        return False
    else:
        print("✅ NO RACE CONDITION - All checks passed!")
        return True


async def main():
    """Main test runner"""
    print("="*60)
    print("🧪 BOOKING QUEUE RACE CONDITION TEST")
    print("="*60)
    print(f"\n📋 Configuration:")
    print(f"  • Total bookings: {NUM_BOOKINGS}")
    print(f"  • Concurrent workers: {CONCURRENT_WORKERS}")
    
    db = await get_async_client()
    print(f"\n✓ Connected to database: {DB_NAME}")
    
    # Cleanup
    await cleanup(db)
    
    # Setup
    await setup_test_data(db)
    
    # Run concurrent test
    queue_numbers = await run_concurrent_test()
    
    # Verify
    passed = await verify_no_race_condition(db, queue_numbers)
    
    # Cleanup
    print("\n🧹 Cleaning up...")
    await cleanup(db)
    
    # Final result
    print("\n" + "="*60)
    print("📋 TEST RESULT")
    print("="*60)
    
    if passed:
        print("✅ RACE CONDITION TEST PASSED!")
        print(f"  • {NUM_BOOKINGS} bookings created concurrently")
        print(f"  • All queue numbers unique and sequential")
        print(f"  • No data corruption detected")
    else:
        print("❌ RACE CONDITION TEST FAILED!")
    
    print("="*60 + "\n")
    
    return passed


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
