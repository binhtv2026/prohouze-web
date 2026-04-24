"""
ProHouzing E2E Flow Test
Phase 4: Testing & Verification - Prompt 8/20

Full E2E Flow:
Lead → Deal → Soft Booking → Priority → Allocation → Hard Booking → Deposit
"""

import asyncio
import uuid
import time
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import httpx

sys.path.insert(0, '/app/backend')

from config.sales_config import (
    BookingTier, SoftBookingStatus, SalesEventStatus, DealStage,
    HardBookingStatus, BOOKING_TIER_CONFIG
)

# API Configuration
API_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com')

# Test configuration
TEST_TENANT_ID = "test_tenant_e2e"
TEST_PROJECT_ID = None  # Will be fetched from existing project
TEST_EVENT_ID = "test_event_e2e"

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


async def cleanup_e2e_data(db):
    """Clean up E2E test data"""
    print("\n🧹 Cleaning up E2E test data...")
    
    tenant_filter = {"tenant_id": TEST_TENANT_ID}
    
    await db.deals.delete_many(tenant_filter)
    await db.soft_bookings.delete_many(tenant_filter)
    await db.hard_bookings.delete_many(tenant_filter)
    await db.sales_events.delete_many(tenant_filter)
    await db.allocation_results.delete_many({"sales_event_id": TEST_EVENT_ID})
    await db.leads.delete_many(tenant_filter)
    await db.contacts.delete_many(tenant_filter)
    
    print("✓ E2E test data cleaned")


async def setup_test_environment(db):
    """Setup test environment with project and products"""
    print("\n📦 Setting up test environment...")
    
    global TEST_PROJECT_ID
    
    # Use existing project or create test project
    project = await db.projects_master.find_one({}, {"_id": 0, "id": 1, "name": 1})
    if project:
        TEST_PROJECT_ID = project["id"]
        print(f"✓ Using existing project: {project.get('name', TEST_PROJECT_ID)}")
    else:
        # Create test project
        TEST_PROJECT_ID = "test_project_e2e"
        await db.projects_master.insert_one({
            "id": TEST_PROJECT_ID,
            "name": "E2E Test Project",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        print(f"✓ Created test project: {TEST_PROJECT_ID}")
    
    # Create test products
    existing_products = await db.products.count_documents({"project_id": TEST_PROJECT_ID})
    if existing_products < 5:
        products = []
        for i in range(1, 6):
            products.append({
                "id": f"e2e_product_{i:03d}",
                "code": f"E2E-{i:03d}",
                "name": f"E2E Test Unit {i:03d}",
                "project_id": TEST_PROJECT_ID,
                "floor_number": i,
                "area": 70 + (i * 5),
                "base_price": 3000000000 + (i * 100000000),
                "inventory_status": "available",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db.products.insert_many(products)
        print(f"✓ Created {len(products)} test products")
    else:
        # Reset existing products to available
        await db.products.update_many(
            {"project_id": TEST_PROJECT_ID},
            {"$set": {"inventory_status": "available"}}
        )
        print(f"✓ Reset {existing_products} existing products to available")
    
    return TEST_PROJECT_ID


async def create_test_sales_event(db, project_id):
    """Create sales event for E2E test"""
    print("\n📅 Creating E2E sales event...")
    
    # Get product IDs
    products = await db.products.find(
        {"project_id": project_id, "inventory_status": "available"},
        {"_id": 0, "id": 1}
    ).to_list(100)
    product_ids = [p["id"] for p in products]
    
    now = datetime.now(timezone.utc)
    event = {
        "id": TEST_EVENT_ID,
        "code": "EVT-E2E-001",
        "name": "E2E Test Sales Event",
        "tenant_id": TEST_TENANT_ID,
        "project_id": project_id,
        "registration_start": (now - timedelta(days=7)).isoformat(),
        "registration_end": (now - timedelta(days=1)).isoformat(),
        "selection_start": (now - timedelta(hours=12)).isoformat(),
        "selection_end": (now + timedelta(hours=12)).isoformat(),
        "allocation_date": now.isoformat(),
        "status": SalesEventStatus.SELECTION.value,
        "available_product_ids": product_ids,
        "reserved_product_ids": product_ids[:1],  # First product reserved for VIP
        "total_products": len(product_ids),
        "total_bookings": 0,
        "max_bookings": 100,
        "booking_fee": 50000000,
        "created_at": now.isoformat(),
    }
    
    await db.sales_events.insert_one(event)
    print(f"✓ Created sales event with {len(product_ids)} products")
    return event, product_ids


async def step_1_create_lead(db):
    """Step 1: Create a Lead"""
    print("\n" + "="*60)
    print("STEP 1: Create Lead")
    print("="*60)
    
    timestamp = int(time.time())
    lead_id = f"e2e_lead_{timestamp}"
    contact_id = f"e2e_contact_{timestamp}"
    
    # Create contact first
    contact = {
        "id": contact_id,
        "full_name": "Nguyễn Văn E2E Test",
        "phone": f"097{timestamp}"[-10:],
        "email": f"e2e_{timestamp}@test.com",
        "type": "lead",
        "tenant_id": TEST_TENANT_ID,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contacts.insert_one(contact)
    print(f"✓ Created contact: {contact['full_name']}")
    
    # Create lead
    lead = {
        "id": lead_id,
        "code": f"LEAD-E2E-{timestamp}",
        "contact_id": contact_id,
        "project_id": TEST_PROJECT_ID,
        "tenant_id": TEST_TENANT_ID,
        "source": "e2e_test",
        "status": "new",
        "stage": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(lead)
    print(f"✓ Created lead: {lead['code']}")
    
    return lead, contact


async def step_2_convert_to_deal(db, lead, contact):
    """Step 2: Convert Lead to Deal"""
    print("\n" + "="*60)
    print("STEP 2: Convert Lead to Deal")
    print("="*60)
    
    timestamp = int(time.time())
    deal_id = f"e2e_deal_{timestamp}"
    
    deal = {
        "id": deal_id,
        "code": f"DEAL-E2E-{timestamp}",
        "tenant_id": TEST_TENANT_ID,
        "contact_id": contact["id"],
        "lead_id": lead["id"],
        "project_id": TEST_PROJECT_ID,
        "stage": DealStage.INTERESTED.value,
        "status": "active",
        "probability": 10,
        "estimated_value": 3500000000,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.deals.insert_one(deal)
    
    # Update lead status
    await db.leads.update_one(
        {"id": lead["id"]},
        {"$set": {"status": "converted", "deal_id": deal_id}}
    )
    
    print(f"✓ Created deal: {deal['code']}")
    print(f"✓ Lead converted to deal")
    
    return deal


async def step_3_create_soft_booking(db, deal, contact, event):
    """Step 3: Create Soft Booking (Join Queue)"""
    print("\n" + "="*60)
    print("STEP 3: Create Soft Booking")
    print("="*60)
    
    timestamp = int(time.time())
    booking_id = f"e2e_booking_{timestamp}"
    
    # Get next queue number
    last_booking = await db.soft_bookings.find_one(
        {"sales_event_id": TEST_EVENT_ID},
        sort=[("queue_number", -1)]
    )
    queue_number = (last_booking.get("queue_number", 0) if last_booking else 0) + 1
    
    soft_booking = {
        "id": booking_id,
        "code": f"SB-E2E-{timestamp}",
        "tenant_id": TEST_TENANT_ID,
        "deal_id": deal["id"],
        "contact_id": contact["id"],
        "project_id": TEST_PROJECT_ID,
        "sales_event_id": TEST_EVENT_ID,
        "queue_number": queue_number,
        "queue_position": f"V{queue_number:03d}",
        "booking_tier": BookingTier.VIP.value,  # VIP for testing
        "status": SoftBookingStatus.PENDING.value,
        "booking_fee": 50000000,
        "booking_fee_paid": 50000000,
        "booking_fee_status": "paid",
        "priority_selections": [],
        "allocation_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.soft_bookings.insert_one(soft_booking)
    
    # Update deal
    await db.deals.update_one(
        {"id": deal["id"]},
        {"$set": {
            "soft_booking_id": booking_id,
            "stage": DealStage.SOFT_BOOKING.value,
        }}
    )
    
    print(f"✓ Created soft booking: {soft_booking['code']}")
    print(f"✓ Queue number: {queue_number}")
    print(f"✓ Tier: VIP")
    
    return soft_booking


async def step_4_confirm_and_select_priorities(db, soft_booking, product_ids):
    """Step 4: Confirm Booking and Select Priorities"""
    print("\n" + "="*60)
    print("STEP 4: Confirm & Select Priorities")
    print("="*60)
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Confirm booking
    await db.soft_bookings.update_one(
        {"id": soft_booking["id"]},
        {"$set": {
            "status": SoftBookingStatus.CONFIRMED.value,
            "confirmed_at": now,
        }}
    )
    print("✓ Booking confirmed")
    
    # Select priorities
    priority_selections = []
    for i, product_id in enumerate(product_ids[:3]):
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            priority_selections.append({
                "priority": i + 1,
                "product_id": product["id"],
                "product_code": product.get("code", ""),
                "product_name": product.get("name", ""),
                "floor_number": product.get("floor_number"),
                "area": product.get("area"),
                "listed_price": product.get("base_price", 0),
                "status": "pending",
                "selected_at": now,
            })
            print(f"✓ Priority {i+1}: {product.get('code', product['id'])}")
    
    # Update booking with priorities
    await db.soft_bookings.update_one(
        {"id": soft_booking["id"]},
        {"$set": {
            "status": SoftBookingStatus.SELECTING.value,
            "priority_selections": priority_selections,
        }}
    )
    
    # Submit priorities
    await db.soft_bookings.update_one(
        {"id": soft_booking["id"]},
        {"$set": {"status": SoftBookingStatus.SUBMITTED.value}}
    )
    
    # Update deal stage
    await db.deals.update_one(
        {"id": soft_booking["deal_id"]},
        {"$set": {"stage": DealStage.WAITING_ALLOCATION.value}}
    )
    
    print("✓ Priorities submitted, waiting for allocation")
    
    return priority_selections


async def step_5_run_allocation(db, soft_booking, event, product_ids):
    """Step 5: Run Allocation Engine"""
    print("\n" + "="*60)
    print("STEP 5: Run Allocation Engine")
    print("="*60)
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get the booking
    booking = await db.soft_bookings.find_one({"id": soft_booking["id"]}, {"_id": 0})
    if not booking:
        print("❌ Booking not found!")
        return None
    
    # Run allocation logic
    available_product_ids = set(product_ids)
    reserved_product_ids = set(event.get("reserved_product_ids", []))
    
    allocated_product_id = None
    allocated_priority = None
    
    for selection in sorted(booking.get("priority_selections", []), key=lambda x: x.get("priority", 99)):
        product_id = selection.get("product_id")
        
        # Check availability
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if not product or product.get("inventory_status") != "available":
            continue
        
        # VIP can access reserved products
        if product_id in reserved_product_ids and booking.get("booking_tier") != BookingTier.VIP.value:
            continue
        
        # Allocate
        allocated_product_id = product_id
        allocated_priority = selection.get("priority")
        
        # Update booking
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
        
        # Update product
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"inventory_status": "allocated"}}
        )
        
        # Update deal
        await db.deals.update_one(
            {"id": booking["deal_id"]},
            {"$set": {
                "stage": DealStage.ALLOCATED.value,
                "product_id": product_id,
                "allocated_at": now,
            }}
        )
        
        print(f"✅ Allocated product: {product.get('code', product_id)}")
        print(f"✓ Priority: {allocated_priority}")
        break
    
    if not allocated_product_id:
        print("❌ Allocation failed - no available products")
        return None
    
    return {"product_id": allocated_product_id, "priority": allocated_priority}


async def step_6_create_hard_booking(db, soft_booking, allocated_product):
    """Step 6: Create Hard Booking"""
    print("\n" + "="*60)
    print("STEP 6: Create Hard Booking")
    print("="*60)
    
    timestamp = int(time.time())
    hard_booking_id = f"e2e_hard_booking_{timestamp}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Get soft booking
    booking = await db.soft_bookings.find_one({"id": soft_booking["id"]}, {"_id": 0})
    
    # Get product
    product = await db.products.find_one({"id": allocated_product["product_id"]}, {"_id": 0})
    base_price = product.get("base_price", 0) if product else 3000000000
    
    hard_booking = {
        "id": hard_booking_id,
        "code": f"HB-E2E-{timestamp}",
        "tenant_id": TEST_TENANT_ID,
        "deal_id": booking["deal_id"],
        "soft_booking_id": booking["id"],
        "contact_id": booking["contact_id"],
        "project_id": booking["project_id"],
        "product_id": allocated_product["product_id"],
        "status": HardBookingStatus.ACTIVE.value,
        "unit_base_price": base_price,
        "listed_price": base_price,
        "final_price": base_price,
        "deposit_amount": base_price * 0.1,  # 10% deposit
        "deposit_paid": 0,
        "deposit_status": "pending",
        "created_at": now,
    }
    await db.hard_bookings.insert_one(hard_booking)
    
    # Update deal
    await db.deals.update_one(
        {"id": booking["deal_id"]},
        {"$set": {
            "hard_booking_id": hard_booking_id,
            "stage": DealStage.HARD_BOOKING.value,
        }}
    )
    
    # Update product
    await db.products.update_one(
        {"id": allocated_product["product_id"]},
        {"$set": {"inventory_status": "locked"}}
    )
    
    print(f"✓ Created hard booking: {hard_booking['code']}")
    print(f"✓ Final price: {hard_booking['final_price']:,.0f} VND")
    print(f"✓ Deposit required: {hard_booking['deposit_amount']:,.0f} VND")
    
    return hard_booking


async def step_7_record_deposit(db, hard_booking):
    """Step 7: Record Deposit Payment"""
    print("\n" + "="*60)
    print("STEP 7: Record Deposit")
    print("="*60)
    
    now = datetime.now(timezone.utc).isoformat()
    deposit_amount = hard_booking["deposit_amount"]
    
    # Record partial deposit first
    partial_amount = deposit_amount * 0.5
    await db.hard_bookings.update_one(
        {"id": hard_booking["id"]},
        {"$set": {
            "deposit_paid": partial_amount,
            "deposit_status": "partial",
            "status": HardBookingStatus.DEPOSIT_PARTIAL.value,
        }}
    )
    print(f"✓ Partial deposit: {partial_amount:,.0f} VND")
    
    # Record full deposit
    await db.hard_bookings.update_one(
        {"id": hard_booking["id"]},
        {"$set": {
            "deposit_paid": deposit_amount,
            "deposit_status": "paid",
            "status": HardBookingStatus.DEPOSITED.value,
            "deposit_paid_at": now,
        }}
    )
    print(f"✓ Full deposit completed: {deposit_amount:,.0f} VND")
    
    # Update deal stage
    booking = await db.hard_bookings.find_one({"id": hard_booking["id"]}, {"_id": 0})
    await db.deals.update_one(
        {"id": booking["deal_id"]},
        {"$set": {"stage": DealStage.DEPOSITING.value}}
    )
    print("✓ Deal stage: DEPOSITING")
    
    # Log payment
    await db.deposit_payments.insert_one({
        "id": str(uuid.uuid4()),
        "hard_booking_id": hard_booking["id"],
        "amount": deposit_amount,
        "payment_method": "bank_transfer",
        "payment_reference": f"E2E-{int(time.time())}",
        "payment_date": now,
        "created_at": now,
    })
    
    return deposit_amount


async def verify_final_state(db, lead, deal_id, soft_booking, hard_booking):
    """Verify final state of all entities"""
    print("\n" + "="*60)
    print("🔍 VERIFICATION: Final State")
    print("="*60)
    
    errors = []
    
    # Check lead
    lead_doc = await db.leads.find_one({"id": lead["id"]}, {"_id": 0})
    if lead_doc and lead_doc.get("status") == "converted":
        print("✓ Lead: converted")
    else:
        errors.append("Lead not properly converted")
    
    # Check deal
    deal_doc = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if deal_doc:
        print(f"✓ Deal stage: {deal_doc.get('stage')}")
        if deal_doc.get("stage") != DealStage.DEPOSITING.value:
            errors.append(f"Deal stage incorrect: {deal_doc.get('stage')}")
        if not deal_doc.get("soft_booking_id"):
            errors.append("Deal missing soft_booking_id")
        if not deal_doc.get("hard_booking_id"):
            errors.append("Deal missing hard_booking_id")
        if not deal_doc.get("product_id"):
            errors.append("Deal missing product_id")
    else:
        errors.append("Deal not found")
    
    # Check soft booking
    sb_doc = await db.soft_bookings.find_one({"id": soft_booking["id"]}, {"_id": 0})
    if sb_doc:
        print(f"✓ Soft booking status: {sb_doc.get('status')}")
        if sb_doc.get("status") != SoftBookingStatus.ALLOCATED.value:
            errors.append(f"Soft booking status incorrect: {sb_doc.get('status')}")
        if not sb_doc.get("allocated_product_id"):
            errors.append("Soft booking missing allocated_product_id")
    else:
        errors.append("Soft booking not found")
    
    # Check hard booking
    hb_doc = await db.hard_bookings.find_one({"id": hard_booking["id"]}, {"_id": 0})
    if hb_doc:
        print(f"✓ Hard booking status: {hb_doc.get('status')}")
        if hb_doc.get("status") != HardBookingStatus.DEPOSITED.value:
            errors.append(f"Hard booking status incorrect: {hb_doc.get('status')}")
        if hb_doc.get("deposit_paid") != hb_doc.get("deposit_amount"):
            errors.append("Deposit not fully paid")
    else:
        errors.append("Hard booking not found")
    
    # Check product
    product_doc = await db.products.find_one({"id": hb_doc.get("product_id")}, {"_id": 0})
    if product_doc:
        print(f"✓ Product status: {product_doc.get('inventory_status')}")
        if product_doc.get("inventory_status") != "locked":
            errors.append(f"Product status incorrect: {product_doc.get('inventory_status')}")
    else:
        errors.append("Product not found")
    
    # Summary
    if errors:
        print("\n❌ VERIFICATION FAILED:")
        for e in errors:
            print(f"  • {e}")
        return False
    else:
        print("\n✅ ALL VERIFICATIONS PASSED")
        return True


async def main():
    """Main E2E test runner"""
    print("="*60)
    print("🚀 PROHOUZING E2E FLOW TEST")
    print("   Lead → Deal → Soft Booking → Priority →")
    print("   Allocation → Hard Booking → Deposit")
    print("="*60)
    
    db = await get_db()
    print(f"\n✓ Connected to database: {DB_NAME}")
    
    # Cleanup
    await cleanup_e2e_data(db)
    
    # Setup
    project_id = await setup_test_environment(db)
    event, product_ids = await create_test_sales_event(db, project_id)
    
    # Run E2E flow
    try:
        # Step 1: Create Lead
        lead, contact = await step_1_create_lead(db)
        
        # Step 2: Convert to Deal
        deal = await step_2_convert_to_deal(db, lead, contact)
        
        # Step 3: Create Soft Booking
        soft_booking = await step_3_create_soft_booking(db, deal, contact, event)
        
        # Step 4: Confirm and Select Priorities
        priorities = await step_4_confirm_and_select_priorities(db, soft_booking, product_ids)
        
        # Step 5: Run Allocation
        allocation_result = await step_5_run_allocation(db, soft_booking, event, product_ids)
        if not allocation_result:
            raise Exception("Allocation failed")
        
        # Step 6: Create Hard Booking
        hard_booking = await step_6_create_hard_booking(db, soft_booking, allocation_result)
        
        # Step 7: Record Deposit
        deposit = await step_7_record_deposit(db, hard_booking)
        
        # Verify final state
        success = await verify_final_state(db, lead, deal["id"], soft_booking, hard_booking)
        
        # Summary
        print("\n" + "="*60)
        print("📋 E2E TEST SUMMARY")
        print("="*60)
        
        if success:
            print("✅ E2E FLOW TEST PASSED!")
            print("\n✓ Lead created and converted")
            print("✓ Deal created with all stages")
            print("✓ Soft booking with queue and priorities")
            print("✓ Allocation successful (VIP priority)")
            print("✓ Hard booking created")
            print("✓ Deposit recorded")
        else:
            print("❌ E2E FLOW TEST FAILED")
            return False
        
    except Exception as e:
        print(f"\n❌ E2E TEST FAILED: {e}")
        return False
    finally:
        # Cleanup
        print("\n🧹 Cleaning up E2E test data...")
        await cleanup_e2e_data(db)
        print("✓ E2E test data cleaned")
    
    print("="*60 + "\n")
    return True


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
