#!/usr/bin/env python3
"""
ProHouzing Simple Migration Script
===================================

Migrates essential data from MongoDB to PostgreSQL with proper schema mapping.
Focus on core entities: Users, Customers, Leads, Deals

Usage:
    python simple_migration.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import UUID
import json

# Add backend to path
sys.path.insert(0, '/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuration
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
POSTGRES_URL = os.environ.get("POSTGRES_URL", "postgresql://localhost/prohouzing")
DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"

# PostgreSQL setup
engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(bind=engine)


async def get_mongo_client():
    return AsyncIOMotorClient(MONGO_URL)


def safe_str(value, max_length=255):
    """Safely convert to string with max length"""
    if value is None:
        return None
    return str(value)[:max_length]


def safe_decimal(value):
    """Safely convert to Decimal"""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except:
        return None


async def migrate_users():
    """Migrate users from MongoDB to PostgreSQL"""
    print("\n" + "=" * 50)
    print("MIGRATING USERS")
    print("=" * 50)
    
    client = await get_mongo_client()
    mongo_db = client[DB_NAME]
    db = SessionLocal()
    
    try:
        # Get all users from MongoDB
        users = await mongo_db.users.find({}).to_list(1000)
        print(f"Found {len(users)} users in MongoDB")
        
        migrated = 0
        failed = 0
        
        for user in users:
            try:
                user_id = user.get('id', str(user.get('_id')))
                
                # Check if already exists
                exists = db.execute(
                    text("SELECT id FROM users WHERE id = :id"),
                    {"id": user_id}
                ).fetchone()
                
                if exists:
                    continue
                
                # Prepare user data
                now = datetime.now(timezone.utc)
                data = {
                    "id": user_id,
                    "org_id": DEFAULT_ORG_ID,
                    "email": safe_str(user.get('email'), 255),
                    "password_hash": safe_str(user.get('password'), 255),
                    "full_name": safe_str(user.get('full_name', 'Unknown'), 255),
                    "employee_code": safe_str(user.get('employee_code', f"EMP-{user_id[:8].upper()}"), 50),
                    "phone": safe_str(user.get('phone'), 20),
                    "user_type": safe_str(user.get('role', 'sales'), 50),
                    "status": "active" if user.get('is_active', True) else "inactive",
                    "created_at": user.get('created_at', now),
                    "updated_at": now,
                    "created_by": DEFAULT_ORG_ID,
                }
                
                # Insert
                db.execute(
                    text("""
                        INSERT INTO users (id, org_id, email, password_hash, full_name, employee_code, phone, user_type, status, created_at, updated_at, created_by)
                        VALUES (:id, :org_id, :email, :password_hash, :full_name, :employee_code, :phone, :user_type, :status, :created_at, :updated_at, :created_by)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data
                )
                db.commit()
                migrated += 1
                
            except Exception as e:
                failed += 1
                db.rollback()
                if failed <= 5:
                    print(f"  Error: {str(e)[:100]}")
        
        print(f"✅ Users migrated: {migrated}, failed: {failed}")
        return migrated, failed
        
    finally:
        client.close()
        db.close()


async def migrate_customers():
    """Migrate customers from contacts collection"""
    print("\n" + "=" * 50)
    print("MIGRATING CUSTOMERS (from contacts)")
    print("=" * 50)
    
    client = await get_mongo_client()
    mongo_db = client[DB_NAME]
    db = SessionLocal()
    
    try:
        # Get contacts from MongoDB
        contacts = await mongo_db.contacts.find({}).to_list(1000)
        print(f"Found {len(contacts)} contacts in MongoDB")
        
        migrated = 0
        failed = 0
        
        for contact in contacts:
            try:
                customer_id = contact.get('id', str(contact.get('_id')))
                
                # Check if already exists
                exists = db.execute(
                    text("SELECT id FROM customers WHERE id = :id"),
                    {"id": customer_id}
                ).fetchone()
                
                if exists:
                    continue
                
                now = datetime.now(timezone.utc)
                data = {
                    "id": customer_id,
                    "org_id": DEFAULT_ORG_ID,
                    "customer_code": safe_str(f"CUST-{customer_id[:8].upper()}", 50),
                    "full_name": safe_str(contact.get('full_name', contact.get('name', 'Unknown')), 255),
                    "primary_phone": safe_str(contact.get('phone'), 20),
                    "primary_email": safe_str(contact.get('email'), 255),
                    "customer_type": safe_str(contact.get('customer_type', 'individual'), 50),
                    "customer_stage": safe_str(contact.get('stage', 'lead'), 50),
                    "lead_source_primary": safe_str(contact.get('source'), 100),
                    "owner_user_id": safe_str(contact.get('assigned_to'), 36) if contact.get('assigned_to') else None,
                    "note_summary": safe_str(contact.get('notes'), 1000),
                    "status": "active",
                    "created_at": contact.get('created_at', now),
                    "updated_at": now,
                    "created_by": DEFAULT_ORG_ID,
                }
                
                # Insert
                db.execute(
                    text("""
                        INSERT INTO customers (id, org_id, customer_code, full_name, primary_phone, primary_email, 
                            customer_type, customer_stage, lead_source_primary, owner_user_id, note_summary, 
                            status, created_at, updated_at, created_by)
                        VALUES (:id, :org_id, :customer_code, :full_name, :primary_phone, :primary_email,
                            :customer_type, :customer_stage, :lead_source_primary, :owner_user_id, :note_summary,
                            :status, :created_at, :updated_at, :created_by)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data
                )
                db.commit()
                migrated += 1
                
            except Exception as e:
                failed += 1
                db.rollback()
                if failed <= 5:
                    print(f"  Error: {str(e)[:100]}")
        
        print(f"✅ Customers migrated: {migrated}, failed: {failed}")
        return migrated, failed
        
    finally:
        client.close()
        db.close()


async def migrate_leads():
    """Migrate leads from MongoDB"""
    print("\n" + "=" * 50)
    print("MIGRATING LEADS")
    print("=" * 50)
    
    client = await get_mongo_client()
    mongo_db = client[DB_NAME]
    db = SessionLocal()
    
    try:
        leads = await mongo_db.leads.find({}).to_list(5000)
        print(f"Found {len(leads)} leads in MongoDB")
        
        migrated = 0
        failed = 0
        
        for lead in leads:
            try:
                lead_id = lead.get('id', str(lead.get('_id')))
                
                # Check if exists
                exists = db.execute(
                    text("SELECT id FROM leads WHERE id = :id"),
                    {"id": lead_id}
                ).fetchone()
                
                if exists:
                    continue
                
                now = datetime.now(timezone.utc)
                
                # Map old status to new
                old_status = lead.get('status', 'new')
                status_map = {
                    'new': 'new',
                    'called': 'contacted',
                    'interested': 'qualified',
                    'appointment': 'qualified',
                    'negotiation': 'negotiating',
                    'won': 'won',
                    'lost': 'lost',
                }
                new_status = status_map.get(old_status, 'new')
                
                data = {
                    "id": lead_id,
                    "org_id": DEFAULT_ORG_ID,
                    "lead_code": safe_str(f"LEAD-{lead_id[:8].upper()}", 50),
                    "contact_name": safe_str(lead.get('contact_name', lead.get('full_name', 'Unknown')), 255),
                    "contact_phone": safe_str(lead.get('contact_phone', lead.get('phone')), 20),
                    "contact_email": safe_str(lead.get('contact_email', lead.get('email')), 255),
                    "source_channel": safe_str(lead.get('source', 'website'), 50),
                    "lead_status": new_status,
                    "intent_level": safe_str(lead.get('priority', 'medium'), 50),
                    "budget_min": safe_decimal(lead.get('budget_min')),
                    "budget_max": safe_decimal(lead.get('budget_max')),
                    "owner_user_id": lead.get('assigned_to') if lead.get('assigned_to') and len(str(lead.get('assigned_to'))) == 36 else None,
                    "qualification_notes": safe_str(lead.get('notes'), 1000),
                    "contact_attempts": lead.get('contact_count', 0),
                    "captured_at": lead.get('created_at', now),
                    "status": "active",
                    "created_at": lead.get('created_at', now),
                    "updated_at": now,
                    "created_by": lead.get('created_by') if lead.get('created_by') and len(str(lead.get('created_by'))) == 36 else DEFAULT_ORG_ID,
                }
                
                # Insert
                db.execute(
                    text("""
                        INSERT INTO leads (id, org_id, lead_code, contact_name, contact_phone, contact_email,
                            source_channel, lead_status, intent_level, budget_min, budget_max, owner_user_id,
                            qualification_notes, contact_attempts, captured_at, status, created_at, updated_at, created_by)
                        VALUES (:id, :org_id, :lead_code, :contact_name, :contact_phone, :contact_email,
                            :source_channel, :lead_status, :intent_level, :budget_min, :budget_max, :owner_user_id,
                            :qualification_notes, :contact_attempts, :captured_at, :status, :created_at, :updated_at, :created_by)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data
                )
                db.commit()
                migrated += 1
                
            except Exception as e:
                failed += 1
                db.rollback()
                if failed <= 5:
                    print(f"  Error: {str(e)[:100]}")
        
        print(f"✅ Leads migrated: {migrated}, failed: {failed}")
        return migrated, failed
        
    finally:
        client.close()
        db.close()


async def migrate_deals():
    """Migrate deals from MongoDB"""
    print("\n" + "=" * 50)
    print("MIGRATING DEALS")
    print("=" * 50)
    
    client = await get_mongo_client()
    mongo_db = client[DB_NAME]
    db = SessionLocal()
    
    try:
        deals = await mongo_db.deals.find({}).to_list(1000)
        print(f"Found {len(deals)} deals in MongoDB")
        
        migrated = 0
        failed = 0
        
        for deal in deals:
            try:
                deal_id = deal.get('id', str(deal.get('_id')))
                
                exists = db.execute(
                    text("SELECT id FROM deals WHERE id = :id"),
                    {"id": deal_id}
                ).fetchone()
                
                if exists:
                    continue
                
                now = datetime.now(timezone.utc)
                
                # Get deal name from various sources
                deal_name = deal.get('title') or deal.get('name') or deal.get('code') or f"Deal {deal_id[:8]}"
                
                # Get deal value from various field names
                deal_value = deal.get('deal_value') or deal.get('value') or deal.get('amount') or deal.get('estimated_value') or 0
                
                # Map stage to current_stage
                stage_mapping = {
                    'new': 'new',
                    'interested': 'interested',
                    'viewing': 'viewing',
                    'negotiation': 'negotiating',
                    'negotiating': 'negotiating',
                    'deposit': 'deposit',
                    'contract': 'contract',
                    'won': 'won',
                    'lost': 'lost',
                    'cancelled': 'cancelled',
                    'qualified': 'qualified',
                    'waiting_allocation': 'waiting_allocation',
                }
                mongo_stage = deal.get('stage', 'new')
                current_stage = stage_mapping.get(mongo_stage, mongo_stage) or 'new'
                
                data = {
                    "id": deal_id,
                    "org_id": DEFAULT_ORG_ID,
                    "deal_code": safe_str(deal.get('code') or f"DEAL-{deal_id[:8].upper()}", 50),
                    "deal_name": safe_str(deal_name, 255),
                    "customer_id": safe_str(deal.get('customer_id', deal.get('contact_id')), 36),
                    "source_lead_id": safe_str(deal.get('lead_id')) if deal.get('lead_id') and len(str(deal.get('lead_id'))) == 36 else None,
                    "current_stage": safe_str(current_stage, 50),
                    "deal_value": safe_decimal(deal_value),
                    "win_probability": deal.get('probability', 50),
                    "owner_user_id": deal.get('assigned_to') if deal.get('assigned_to') and len(str(deal.get('assigned_to'))) == 36 else (deal.get('owner_id') if deal.get('owner_id') and len(str(deal.get('owner_id'))) == 36 else None),
                    "expected_close_date": deal.get('expected_close') or deal.get('expected_close_date'),
                    "notes": safe_str(deal.get('notes'), 1000),
                    "status": "active",
                    "created_at": deal.get('created_at', now),
                    "updated_at": now,
                    "created_by": deal.get('created_by') if deal.get('created_by') and len(str(deal.get('created_by'))) == 36 else DEFAULT_ORG_ID,
                }
                
                db.execute(
                    text("""
                        INSERT INTO deals (id, org_id, deal_code, deal_name, customer_id, source_lead_id,
                            current_stage, deal_value, win_probability, owner_user_id, expected_close_date,
                            notes, status, created_at, updated_at, created_by)
                        VALUES (:id, :org_id, :deal_code, :deal_name, :customer_id, :source_lead_id,
                            :current_stage, :deal_value, :win_probability, :owner_user_id, :expected_close_date,
                            :notes, :status, :created_at, :updated_at, :created_by)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data
                )
                db.commit()
                migrated += 1
                
            except Exception as e:
                failed += 1
                db.rollback()
                if failed <= 5:
                    print(f"  Error: {str(e)[:100]}")
        
        print(f"✅ Deals migrated: {migrated}, failed: {failed}")
        return migrated, failed
        
    finally:
        client.close()
        db.close()


async def migrate_bookings():
    """Migrate soft bookings from MongoDB"""
    print("\n" + "=" * 50)
    print("MIGRATING BOOKINGS")
    print("=" * 50)
    
    client = await get_mongo_client()
    mongo_db = client[DB_NAME]
    db = SessionLocal()
    
    try:
        bookings = await mongo_db.soft_bookings.find({}).to_list(1000)
        print(f"Found {len(bookings)} soft bookings in MongoDB")
        
        migrated = 0
        failed = 0
        skipped = 0
        
        for booking in bookings:
            try:
                booking_id = booking.get('id', str(booking.get('_id')))
                
                # Skip if missing required foreign keys
                deal_id = booking.get('deal_id')
                customer_id = booking.get('customer_id')
                product_id = booking.get('product_id')
                
                if not deal_id or not customer_id or not product_id:
                    skipped += 1
                    continue
                
                # Validate UUIDs
                if len(str(deal_id)) != 36 or len(str(customer_id)) != 36 or len(str(product_id)) != 36:
                    skipped += 1
                    continue
                
                # Check if foreign keys exist
                deal_exists = db.execute(text("SELECT id FROM deals WHERE id = :id"), {"id": deal_id}).fetchone()
                customer_exists = db.execute(text("SELECT id FROM customers WHERE id = :id"), {"id": customer_id}).fetchone()
                
                if not deal_exists or not customer_exists:
                    skipped += 1
                    continue
                
                exists = db.execute(
                    text("SELECT id FROM bookings WHERE id = :id"),
                    {"id": booking_id}
                ).fetchone()
                
                if exists:
                    continue
                
                now = datetime.now(timezone.utc)
                
                # Map booking status
                status_map = {
                    'pending': 'pending',
                    'queued': 'pending',
                    'confirmed': 'confirmed',
                    'cancelled': 'cancelled',
                    'expired': 'expired',
                    'allocated': 'confirmed',
                }
                booking_status = status_map.get(booking.get('status', 'pending'), 'pending')
                
                # Calculate valid_until (default: 30 days from now)
                valid_until = booking.get('expires_at') or (now + timedelta(days=30))
                
                data = {
                    "id": booking_id,
                    "org_id": DEFAULT_ORG_ID,
                    "booking_code": safe_str(booking.get('code', f"BK-{booking_id[:8].upper()}"), 50),
                    "deal_id": deal_id,
                    "customer_id": customer_id,
                    "product_id": product_id,
                    "project_id": booking.get('project_id') if booking.get('project_id') and len(str(booking.get('project_id'))) == 36 else None,
                    "product_lock_version": 1,
                    "booking_amount": safe_decimal(booking.get('deposit_amount', booking.get('amount', 50000000))),
                    "booking_status": booking_status,
                    "booked_at": booking.get('created_at', now),
                    "valid_until": valid_until,
                    "notes": safe_str(booking.get('notes'), 1000),
                    "status": "active",
                    "created_at": booking.get('created_at', now),
                    "updated_at": now,
                }
                
                db.execute(
                    text("""
                        INSERT INTO bookings (id, org_id, booking_code, deal_id, customer_id,
                            product_id, project_id, product_lock_version, booking_amount, booking_status, 
                            booked_at, valid_until, notes, status, created_at, updated_at)
                        VALUES (:id, :org_id, :booking_code, :deal_id, :customer_id,
                            :product_id, :project_id, :product_lock_version, :booking_amount, :booking_status,
                            :booked_at, :valid_until, :notes, :status, :created_at, :updated_at)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data
                )
                db.commit()
                migrated += 1
                
            except Exception as e:
                failed += 1
                db.rollback()
                if failed <= 5:
                    print(f"  Error: {str(e)[:100]}")
        
        print(f"✅ Bookings migrated: {migrated}, skipped: {skipped}, failed: {failed}")
        return migrated, failed
        
    finally:
        client.close()
        db.close()


async def migrate_contracts():
    """Migrate contracts from MongoDB"""
    print("\n" + "=" * 50)
    print("MIGRATING CONTRACTS")
    print("=" * 50)
    
    client = await get_mongo_client()
    mongo_db = client[DB_NAME]
    db = SessionLocal()
    
    try:
        contracts = await mongo_db.contracts.find({}).to_list(1000)
        print(f"Found {len(contracts)} contracts in MongoDB")
        
        migrated = 0
        failed = 0
        skipped = 0
        
        for contract in contracts:
            try:
                contract_id = contract.get('id', str(contract.get('_id')))
                
                # Skip if missing required foreign keys
                deal_id = contract.get('deal_id')
                customer_id = contract.get('customer_id')
                product_id = contract.get('product_id')
                
                if not customer_id or not product_id:
                    skipped += 1
                    continue
                
                # Validate UUIDs
                if len(str(customer_id)) != 36 or len(str(product_id)) != 36:
                    skipped += 1
                    continue
                
                # Check if foreign keys exist
                customer_exists = db.execute(text("SELECT id FROM customers WHERE id = :id"), {"id": customer_id}).fetchone()
                
                if not customer_exists:
                    skipped += 1
                    continue
                
                # For deal_id, if not valid, we need to find/create one
                if not deal_id or len(str(deal_id)) != 36:
                    deal_id = None
                else:
                    deal_exists = db.execute(text("SELECT id FROM deals WHERE id = :id"), {"id": deal_id}).fetchone()
                    if not deal_exists:
                        deal_id = None
                
                # Skip if no deal (contracts require deal_id in schema)
                if not deal_id:
                    skipped += 1
                    continue
                
                exists = db.execute(
                    text("SELECT id FROM contracts WHERE id = :id"),
                    {"id": contract_id}
                ).fetchone()
                
                if exists:
                    continue
                
                now = datetime.now(timezone.utc)
                
                # Map contract status
                status_map = {
                    'draft': 'draft',
                    'pending': 'pending_review',
                    'active': 'active',
                    'signed': 'active',
                    'completed': 'completed',
                    'cancelled': 'cancelled',
                    'terminated': 'terminated',
                }
                contract_status = status_map.get(contract.get('status', 'draft'), 'draft')
                
                # Get contract value
                contract_value = safe_decimal(contract.get('total_value', contract.get('contract_value', 0))) or Decimal('0')
                final_value = contract_value
                
                # Get buyer info from customer
                customer = db.execute(
                    text("SELECT full_name FROM customers WHERE id = :id"),
                    {"id": customer_id}
                ).fetchone()
                buyer_name = customer[0] if customer else "Unknown Buyer"
                
                data = {
                    "id": contract_id,
                    "org_id": DEFAULT_ORG_ID,
                    "contract_code": safe_str(contract.get('contract_number', contract.get('code', f"CT-{contract_id[:8].upper()}")), 50),
                    "contract_type": safe_str(contract.get('type', 'sale'), 50),
                    "deal_id": deal_id,
                    "customer_id": customer_id,
                    "product_id": product_id,
                    "project_id": contract.get('project_id') if contract.get('project_id') and len(str(contract.get('project_id'))) == 36 else None,
                    "contract_value": contract_value,
                    "final_value": final_value,
                    "total_paid": safe_decimal(contract.get('paid_amount', 0)),
                    "remaining_balance": safe_decimal(contract.get('remaining_amount', 0)),
                    "buyer_name": buyer_name,
                    "contract_status": contract_status,
                    "notes": safe_str(contract.get('notes'), 1000),
                    "status": "active",
                    "created_at": contract.get('created_at', now),
                    "updated_at": now,
                }
                
                db.execute(
                    text("""
                        INSERT INTO contracts (id, org_id, contract_code, contract_type, deal_id, customer_id,
                            product_id, project_id, contract_value, final_value, total_paid, remaining_balance,
                            buyer_name, contract_status, notes, status, created_at, updated_at)
                        VALUES (:id, :org_id, :contract_code, :contract_type, :deal_id, :customer_id,
                            :product_id, :project_id, :contract_value, :final_value, :total_paid, :remaining_balance,
                            :buyer_name, :contract_status, :notes, :status, :created_at, :updated_at)
                        ON CONFLICT (id) DO NOTHING
                    """),
                    data
                )
                db.commit()
                migrated += 1
                
            except Exception as e:
                failed += 1
                db.rollback()
                if failed <= 5:
                    print(f"  Error: {str(e)[:100]}")
        
        print(f"✅ Contracts migrated: {migrated}, skipped: {skipped}, failed: {failed}")
        return migrated, failed
        
    finally:
        client.close()
        db.close()



def verify_migration():
    """Verify migration results"""
    print("\n" + "=" * 50)
    print("VERIFICATION")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        tables = ['organizations', 'users', 'customers', 'leads', 'deals', 'bookings', 'contracts']
        
        print("\nPostgreSQL Record Counts:")
        for table in tables:
            try:
                count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"  {table}: {count}")
            except Exception as e:
                print(f"  {table}: ERROR - {e}")
        
        return True
    finally:
        db.close()


async def main():
    print("=" * 60)
    print("PROHOUZING SIMPLE MIGRATION")
    print(f"Started: {datetime.now()}")
    print("=" * 60)
    print(f"\nMongoDB: {DB_NAME}")
    print(f"PostgreSQL: {POSTGRES_URL.split('@')[-1]}")
    
    # Run migrations
    results = {}
    
    results['users'] = await migrate_users()
    results['customers'] = await migrate_customers()
    results['leads'] = await migrate_leads()
    results['deals'] = await migrate_deals()
    results['bookings'] = await migrate_bookings()
    results['contracts'] = await migrate_contracts()
    
    # Verify
    verify_migration()
    
    # Summary
    print("\n" + "=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    total_migrated = sum(r[0] for r in results.values())
    total_failed = sum(r[1] for r in results.values())
    print(f"Total migrated: {total_migrated}")
    print(f"Total failed: {total_failed}")
    
    if total_failed == 0:
        print("\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
    else:
        print(f"\n⚠️ MIGRATION COMPLETED WITH {total_failed} ERRORS")
    
    print(f"\nFinished: {datetime.now()}")


if __name__ == "__main__":
    asyncio.run(main())
