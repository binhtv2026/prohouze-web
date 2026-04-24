#!/usr/bin/env python3
"""
Seed Full Business Flow Data
============================
Creates realistic data for: Projects → Products → Bookings → Contracts → Payments → Commissions

Usage:
    python seed_full_flow.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4
import random

sys.path.insert(0, '/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from sqlalchemy import text
from core.database import SessionLocal

# Constants
DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"

# Sample data
PROJECT_NAMES = [
    ("Vinhomes Grand Park", "apartment", "Q9, TP.HCM"),
    ("The Manor Central Park", "apartment", "Hà Nội"),
    ("Eco Green Saigon", "apartment", "Q7, TP.HCM"),
    ("Celadon City", "apartment", "Tân Phú, TP.HCM"),
    ("Masteri Thảo Điền", "apartment", "Q2, TP.HCM"),
]

PRODUCT_TYPES = ["apartment", "villa", "townhouse", "shophouse", "land"]
DIRECTIONS = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"]
BOOKING_STATUSES = ["pending", "confirmed", "expired", "cancelled"]
CONTRACT_STATUSES = ["draft", "pending_review", "active", "completed"]
COMMISSION_TYPES = ["sale", "referral", "bonus"]
PAYOUT_STATUSES = ["pending", "approved", "processing", "paid"]


def get_random_price():
    """Generate random price between 2-10 billion VND"""
    return Decimal(random.randint(2000, 10000)) * Decimal(1000000)


def seed_projects(db):
    """Seed projects table"""
    print("\n=== SEEDING PROJECTS ===")
    
    projects = []
    for i, (name, ptype, address) in enumerate(PROJECT_NAMES):
        project_id = str(uuid4())
        now = datetime.now(timezone.utc)
        
        data = {
            "id": project_id,
            "org_id": DEFAULT_ORG_ID,
            "project_code": f"PRJ-{str(i+1).zfill(3)}",
            "project_name": name,
            "project_type": ptype,
            "selling_status": "selling",
            "address_line": address,
            "total_units": random.randint(100, 500),
            "available_units": random.randint(50, 200),
            "sold_units": random.randint(20, 100),
            "min_price": get_random_price(),
            "max_price": get_random_price() + Decimal(2000000000),
            "commission_rate": Decimal(random.randint(15, 30)) / Decimal(10),  # 1.5% - 3%
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        
        try:
            db.execute(text("""
                INSERT INTO projects (id, org_id, project_code, project_name, project_type, selling_status,
                    address_line, total_units, available_units, sold_units, min_price, max_price,
                    commission_rate, status, created_at, updated_at)
                VALUES (:id, :org_id, :project_code, :project_name, :project_type, :selling_status,
                    :address_line, :total_units, :available_units, :sold_units, :min_price, :max_price,
                    :commission_rate, :status, :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), data)
            db.commit()
            projects.append(project_id)
            print(f"  ✓ Created project: {name}")
        except Exception as e:
            db.rollback()
            print(f"  ✗ Error creating project {name}: {e}")
    
    print(f"Total projects created: {len(projects)}")
    return projects


def seed_products(db, project_ids):
    """Seed products table (units/căn)"""
    print("\n=== SEEDING PRODUCTS ===")
    
    products = []
    for project_id in project_ids:
        # Create 10 products per project
        for i in range(10):
            product_id = str(uuid4())
            now = datetime.now(timezone.utc)
            floor = random.randint(1, 30)
            unit = random.randint(1, 10)
            
            price = get_random_price()
            
            data = {
                "id": product_id,
                "org_id": DEFAULT_ORG_ID,
                "project_id": project_id,
                "product_code": f"UNIT-{project_id[:4].upper()}-{floor:02d}{unit:02d}",
                "product_type": random.choice(PRODUCT_TYPES[:2]),  # apartment or villa
                "title": f"Căn hộ {floor:02d}.{unit:02d}",
                "bedroom_count": random.randint(1, 4),
                "bathroom_count": random.randint(1, 3),
                "floor_no": str(floor),
                "unit_no": f"{floor:02d}.{unit:02d}",
                "land_area": Decimal(random.randint(50, 150)),
                "built_area": Decimal(random.randint(40, 120)),
                "direction": random.choice(DIRECTIONS),
                "list_price": price,
                "sale_price": price * Decimal("0.95"),  # 5% discount
                "inventory_status": random.choice(["available", "available", "available", "booked", "sold"]),
                "availability_status": "available",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
            
            try:
                db.execute(text("""
                    INSERT INTO products (id, org_id, project_id, product_code, product_type, title,
                        bedroom_count, bathroom_count, floor_no, unit_no, land_area, built_area,
                        direction, list_price, sale_price, inventory_status, availability_status,
                        status, created_at, updated_at)
                    VALUES (:id, :org_id, :project_id, :product_code, :product_type, :title,
                        :bedroom_count, :bathroom_count, :floor_no, :unit_no, :land_area, :built_area,
                        :direction, :list_price, :sale_price, :inventory_status, :availability_status,
                        :status, :created_at, :updated_at)
                    ON CONFLICT (id) DO NOTHING
                """), data)
                db.commit()
                products.append(product_id)
            except Exception as e:
                db.rollback()
                print(f"  ✗ Error: {e}")
    
    print(f"Total products created: {len(products)}")
    return products


def seed_bookings(db, products):
    """Seed bookings based on existing deals and products"""
    print("\n=== SEEDING BOOKINGS ===")
    
    # Get existing deals and customers
    deals = db.execute(text("SELECT id, customer_id FROM deals WHERE customer_id IS NOT NULL LIMIT 20")).fetchall()
    
    if not deals:
        print("  No deals found. Skipping bookings.")
        return []
    
    bookings = []
    for i, (deal_id, customer_id) in enumerate(deals[:15]):
        if i >= len(products):
            break
            
        booking_id = str(uuid4())
        product_id = products[i]
        now = datetime.now(timezone.utc)
        
        # Get project_id from product
        product = db.execute(text("SELECT project_id FROM products WHERE id = :id"), {"id": product_id}).fetchone()
        project_id = product[0] if product else None
        
        data = {
            "id": booking_id,
            "org_id": DEFAULT_ORG_ID,
            "booking_code": f"BK-{now.strftime('%Y%m')}-{str(i+1).zfill(4)}",
            "deal_id": deal_id,
            "customer_id": customer_id,
            "product_id": product_id,
            "project_id": project_id,
            "product_lock_version": 1,
            "booking_amount": Decimal(50000000),  # 50 million VND deposit
            "booking_status": random.choice(BOOKING_STATUSES[:2]),  # pending or confirmed
            "booked_at": now - timedelta(days=random.randint(1, 30)),
            "valid_until": now + timedelta(days=random.randint(7, 30)),
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        
        try:
            db.execute(text("""
                INSERT INTO bookings (id, org_id, booking_code, deal_id, customer_id, product_id,
                    project_id, product_lock_version, booking_amount, booking_status, booked_at,
                    valid_until, status, created_at, updated_at)
                VALUES (:id, :org_id, :booking_code, :deal_id, :customer_id, :product_id,
                    :project_id, :product_lock_version, :booking_amount, :booking_status, :booked_at,
                    :valid_until, :status, :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), data)
            db.commit()
            bookings.append((booking_id, deal_id, customer_id, product_id, project_id))
            print(f"  ✓ Created booking: {data['booking_code']}")
        except Exception as e:
            db.rollback()
            print(f"  ✗ Error: {str(e)[:80]}")
    
    print(f"Total bookings created: {len(bookings)}")
    return bookings


def seed_contracts(db, bookings, products):
    """Seed contracts linked to bookings"""
    print("\n=== SEEDING CONTRACTS ===")
    
    contracts = []
    for i, (booking_id, deal_id, customer_id, product_id, project_id) in enumerate(bookings[:10]):
        contract_id = str(uuid4())
        now = datetime.now(timezone.utc)
        
        # Get product price
        product = db.execute(text("SELECT sale_price FROM products WHERE id = :id"), {"id": product_id}).fetchone()
        contract_value = product[0] if product else Decimal(5000000000)
        
        # Get customer name
        customer = db.execute(text("SELECT full_name FROM customers WHERE id = :id"), {"id": customer_id}).fetchone()
        buyer_name = customer[0] if customer else "Unknown Buyer"
        
        data = {
            "id": contract_id,
            "org_id": DEFAULT_ORG_ID,
            "contract_code": f"CT-{now.strftime('%Y%m')}-{str(i+1).zfill(4)}",
            "contract_type": "sale",
            "deal_id": deal_id,
            "customer_id": customer_id,
            "product_id": product_id,
            "project_id": project_id,
            "contract_value": contract_value,
            "final_value": contract_value,
            "total_paid": contract_value * Decimal("0.3"),  # 30% paid
            "remaining_balance": contract_value * Decimal("0.7"),
            "buyer_name": buyer_name,
            "contract_status": random.choice(CONTRACT_STATUSES),
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        
        try:
            db.execute(text("""
                INSERT INTO contracts (id, org_id, contract_code, contract_type, deal_id, customer_id,
                    product_id, project_id, contract_value, final_value, total_paid, remaining_balance,
                    buyer_name, contract_status, status, created_at, updated_at)
                VALUES (:id, :org_id, :contract_code, :contract_type, :deal_id, :customer_id,
                    :product_id, :project_id, :contract_value, :final_value, :total_paid, :remaining_balance,
                    :buyer_name, :contract_status, :status, :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), data)
            db.commit()
            contracts.append((contract_id, deal_id, customer_id, product_id, project_id, contract_value))
            print(f"  ✓ Created contract: {data['contract_code']} - {buyer_name}")
        except Exception as e:
            db.rollback()
            print(f"  ✗ Error: {str(e)[:80]}")
    
    print(f"Total contracts created: {len(contracts)}")
    return contracts


def seed_commissions(db, contracts):
    """Seed commission entries linked to contracts"""
    print("\n=== SEEDING COMMISSIONS ===")
    
    # Get some users
    users = db.execute(text("SELECT id, full_name FROM users LIMIT 10")).fetchall()
    
    if not users:
        print("  No users found. Skipping commissions.")
        return []
    
    commissions = []
    for i, (contract_id, deal_id, customer_id, product_id, project_id, contract_value) in enumerate(contracts):
        commission_id = str(uuid4())
        now = datetime.now(timezone.utc)
        
        # Pick random beneficiary user
        user_id, user_name = random.choice(users)
        
        # Calculate commission (2% of contract value)
        rate_value = Decimal("2.0")
        gross_amount = contract_value * rate_value / Decimal(100)
        deductions = gross_amount * Decimal("0.1")  # 10% tax
        net_amount = gross_amount - deductions
        
        data = {
            "id": commission_id,
            "org_id": DEFAULT_ORG_ID,
            "entry_code": f"COM-{now.strftime('%Y%m')}-{str(i+1).zfill(4)}",
            "commission_type": "sale",
            "deal_id": deal_id,
            "contract_id": contract_id,
            "product_id": product_id,
            "project_id": project_id,
            "beneficiary_type": "individual",
            "beneficiary_user_id": user_id,
            "beneficiary_name": user_name,
            "base_amount": contract_value,
            "rate_type": "percent",
            "rate_value": rate_value,
            "gross_amount": gross_amount,
            "deductions": deductions,
            "net_amount": net_amount,
            "currency_code": "VND",
            "earning_status": random.choice(["pending", "earned", "approved"]),
            "payout_status": random.choice(PAYOUT_STATUSES),
            "earning_period": now.strftime("%Y-%m"),
            "created_at": now,
            "updated_at": now,
        }
        
        try:
            db.execute(text("""
                INSERT INTO commission_entries (id, org_id, entry_code, commission_type, deal_id,
                    contract_id, product_id, project_id, beneficiary_type, beneficiary_user_id,
                    beneficiary_name, base_amount, rate_type, rate_value, gross_amount, deductions,
                    net_amount, currency_code, earning_status, payout_status, earning_period,
                    created_at, updated_at)
                VALUES (:id, :org_id, :entry_code, :commission_type, :deal_id,
                    :contract_id, :product_id, :project_id, :beneficiary_type, :beneficiary_user_id,
                    :beneficiary_name, :base_amount, :rate_type, :rate_value, :gross_amount, :deductions,
                    :net_amount, :currency_code, :earning_status, :payout_status, :earning_period,
                    :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), data)
            db.commit()
            commissions.append(commission_id)
            print(f"  ✓ Created commission: {data['entry_code']} - {user_name} - {net_amount:,.0f} VND")
        except Exception as e:
            db.rollback()
            print(f"  ✗ Error: {str(e)[:80]}")
    
    print(f"Total commissions created: {len(commissions)}")
    return commissions


def verify_data(db):
    """Verify seeded data"""
    print("\n" + "=" * 50)
    print("VERIFICATION")
    print("=" * 50)
    
    tables = ['projects', 'products', 'bookings', 'contracts', 'commission_entries']
    
    for table in tables:
        count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        print(f"  {table}: {count}")


def main():
    print("=" * 60)
    print("SEED FULL BUSINESS FLOW DATA")
    print(f"Started: {datetime.now()}")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Seed in order
        project_ids = seed_projects(db)
        product_ids = seed_products(db, project_ids)
        bookings = seed_bookings(db, product_ids)
        contracts = seed_contracts(db, bookings, product_ids)
        commissions = seed_commissions(db, contracts)
        
        # Verify
        verify_data(db)
        
        print("\n" + "=" * 60)
        print("SEED COMPLETED SUCCESSFULLY!")
        print(f"Finished: {datetime.now()}")
        print("=" * 60)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
