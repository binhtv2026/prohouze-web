"""
ProHouzing Sample Data Generator
PHASE 5 - REAL DATA & REAL USAGE

Creates realistic dataset:
- 50-100 products (căn hộ, nhà phố, biệt thự)
- 20-30 sales users
- 100-200 deals across all stages
- Holds, overdues, approvals

Data resembles real Vietnamese real estate market:
- Prices: 500 triệu - 5 tỷ VND
- Vietnamese names
- Realistic project names
"""

import uuid
import random
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import bcrypt
from sqlalchemy import create_engine, text
import os

# Database connection
DB_URL = os.environ.get('POSTGRES_URL', 'postgresql://prohouzing:prohouzing123@localhost:5432/prohouzing')
engine = create_engine(DB_URL)

# ═══════════════════════════════════════════════════════════════════════════
# CONSTANTS - Vietnamese Real Estate Data
# ═══════════════════════════════════════════════════════════════════════════

FIRST_NAMES = [
    "Minh", "Hùng", "Tuấn", "Nam", "Đức", "Hải", "Long", "Việt", "Tùng", "Hoàng",
    "Linh", "Hương", "Lan", "Nga", "Thảo", "Mai", "Hoa", "Yến", "Ngọc", "Trang"
]

LAST_NAMES = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"
]

# Real estate projects in Vietnam
PROJECT_NAMES = [
    "Vinhomes Grand Park", "Vinhomes Central Park", "The Metropole",
    "Masteri Thảo Điền", "Estella Heights", "Diamond Island",
    "Sunwah Pearl", "The Ascent", "Gateway Thảo Điền", "Feliz En Vista",
    "Saigon Royal", "Millennium", "The Manor", "Empire City", "Eco Green"
]

PRODUCT_TYPES = ["Căn hộ 1PN", "Căn hộ 2PN", "Căn hộ 3PN", "Penthouse", "Duplex", "Shophouse"]

PIPELINE_STAGES = [
    "lead_new", "contacted", "interested", "viewing", 
    "holding", "booking", "negotiating", "closed_won", "closed_lost"
]

INVENTORY_STATUSES = ["available", "hold", "booking_pending", "booked", "sold", "blocked"]

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def random_vietnamese_name():
    return f"{random.choice(LAST_NAMES)} {random.choice(FIRST_NAMES)}"

def random_phone():
    return f"09{random.randint(10000000, 99999999)}"

def random_email(name):
    clean = name.lower().replace(" ", ".").replace("ă", "a").replace("â", "a").\
        replace("đ", "d").replace("ê", "e").replace("ô", "o").replace("ơ", "o").\
        replace("ư", "u").replace("á", "a").replace("à", "a").replace("ả", "a").\
        replace("ã", "a").replace("ạ", "a").replace("é", "e").replace("è", "e").\
        replace("ẻ", "e").replace("ẽ", "e").replace("ẹ", "e").replace("í", "i").\
        replace("ì", "i").replace("ỉ", "i").replace("ĩ", "i").replace("ị", "i").\
        replace("ó", "o").replace("ò", "o").replace("ỏ", "o").replace("õ", "o").\
        replace("ọ", "o").replace("ú", "u").replace("ù", "u").replace("ủ", "u").\
        replace("ũ", "u").replace("ụ", "u").replace("ý", "y").replace("ỳ", "y").\
        replace("ỷ", "y").replace("ỹ", "y").replace("ỵ", "y")
    return f"{clean}@prohouzing.vn"

def random_price():
    """Generate realistic Vietnamese real estate prices (500tr - 5 tỷ)"""
    ranges = [
        (500_000_000, 800_000_000, 30),    # 500tr - 800tr (30%)
        (800_000_000, 1_500_000_000, 35),  # 800tr - 1.5 tỷ (35%)
        (1_500_000_000, 3_000_000_000, 25), # 1.5 tỷ - 3 tỷ (25%)
        (3_000_000_000, 5_000_000_000, 10), # 3 tỷ - 5 tỷ (10%)
    ]
    r = random.randint(1, 100)
    cumulative = 0
    for min_p, max_p, pct in ranges:
        cumulative += pct
        if r <= cumulative:
            return random.randint(min_p // 1_000_000, max_p // 1_000_000) * 1_000_000
    return random.randint(500_000_000, 5_000_000_000)

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# ═══════════════════════════════════════════════════════════════════════════
# DATA GENERATORS
# ═══════════════════════════════════════════════════════════════════════════

def create_org(conn):
    """Create organization"""
    org_id = uuid.uuid4()
    conn.execute(text("""
        INSERT INTO organizations (id, name, code, org_type, status, created_at, updated_at)
        VALUES (:id, 'ProHouzing Real Estate', 'PHZ', 'company', 'active', :now, :now)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
    """), {"id": org_id, "now": datetime.now(timezone.utc)})
    
    result = conn.execute(text("SELECT id FROM organizations WHERE code = 'PHZ'"))
    return result.fetchone()[0]

def create_sales_users(conn, org_id, count=25):
    """Create 25 sales users with different roles"""
    users = []
    password = hash_password("sales123")
    now = datetime.now(timezone.utc)
    
    roles = [
        ("director", 1),      # 1 Director
        ("manager", 4),       # 4 Managers
        ("sales_agent", 20),  # 20 Sales
    ]
    
    for role, num in roles:
        for i in range(num):
            name = random_vietnamese_name()
            user_id = uuid.uuid4()
            email = random_email(f"{role}{i}_{name}")
            
            try:
                conn.execute(text("""
                    INSERT INTO users (id, org_id, email, password_hash, full_name, status, user_type, job_title, created_at, updated_at)
                    VALUES (:id, :org_id, :email, :password, :name, 'active', 'staff', :title, :now, :now)
                    ON CONFLICT (email) DO NOTHING
                """), {
                    "id": user_id, "org_id": org_id, "email": email,
                    "password": password, "name": name,
                    "title": "Giám đốc sàn" if role == "director" else "Trưởng phòng" if role == "manager" else "Nhân viên kinh doanh",
                    "now": now
                })
                users.append({"id": user_id, "name": name, "email": email, "role": role})
            except Exception as e:
                print(f"Skip user {email}: {e}")
    
    conn.commit()
    print(f"Created {len(users)} sales users")
    return users

def create_projects(conn, org_id):
    """Create real estate projects"""
    projects = []
    now = datetime.now(timezone.utc)
    
    for project_name in PROJECT_NAMES:
        project_id = uuid.uuid4()
        code = project_name[:3].upper() + str(random.randint(100, 999))
        
        try:
            conn.execute(text("""
                INSERT INTO projects (
                    id, org_id, project_code, project_name, project_type,
                    selling_status, status, created_at, updated_at
                ) VALUES (
                    :id, :org_id, :code, :name, 'apartment',
                    'selling', 'active', :now, :now
                )
                ON CONFLICT (org_id, project_code) DO UPDATE SET project_name = EXCLUDED.project_name
                RETURNING id
            """), {
                "id": project_id, "org_id": org_id, "code": code,
                "name": project_name, "now": now
            })
            projects.append({"id": project_id, "code": code, "name": project_name})
        except Exception as e:
            print(f"Skip project {project_name}: {e}")
            conn.rollback()
    
    conn.commit()
    
    # Fetch all projects
    result = conn.execute(text("SELECT id, project_code, project_name FROM projects WHERE org_id = :org_id"), {"org_id": org_id})
    projects = [{"id": row[0], "code": row[1], "name": row[2]} for row in result.fetchall()]
    
    print(f"Created/Found {len(projects)} projects")
    return projects

def create_products(conn, org_id, projects, count=80):
    """Create 80 products (properties)"""
    products = []
    now = datetime.now(timezone.utc)
    
    # Status distribution
    statuses = [
        ("available", 50),      # 50% available
        ("hold", 15),           # 15% on hold
        ("booking_pending", 10),# 10% booking pending
        ("booked", 10),         # 10% booked
        ("sold", 10),           # 10% sold
        ("blocked", 5),         # 5% blocked
    ]
    
    product_count = 0
    for project in projects:
        for i in range(count // max(len(projects), 1)):
            product_id = uuid.uuid4()
            product_type = random.choice(PRODUCT_TYPES)
            floor = random.randint(1, 40)
            unit = random.randint(1, 20)
            code = f"{project['code']}-{floor:02d}{unit:02d}"
            name = f"{product_type} - {project['name']} - Tầng {floor}"
            price = random_price()
            
            # Determine status based on distribution
            r = random.randint(1, 100)
            cumulative = 0
            status = "available"
            for s, pct in statuses:
                cumulative += pct
                if r <= cumulative:
                    status = s
                    break
            
            try:
                conn.execute(text("""
                    INSERT INTO products (
                        id, org_id, project_id, product_code, title, product_type, 
                        list_price, inventory_status, status, floor_no, version, 
                        created_at, updated_at
                    ) VALUES (
                        :id, :org_id, :project_id, :code, :name, :ptype, 
                        :price, :inv_status, 'active', :floor, 1, 
                        :now, :now
                    )
                """), {
                    "id": product_id, "org_id": org_id, "project_id": project["id"], "code": code,
                    "name": name, "ptype": product_type, "price": price,
                    "inv_status": status, "floor": str(floor), "now": now
                })
                products.append({
                    "id": product_id, "code": code, "name": name, 
                    "price": price, "status": status, "project": project["name"]
                })
                product_count += 1
            except Exception as e:
                print(f"Skip product {code}: {e}")
                conn.rollback()
    
    conn.commit()
    print(f"Created {product_count} products")
    return products

def create_deals(conn, org_id, users, products, count=150):
    """Create 150 deals across all pipeline stages"""
    deals = []
    now = datetime.now(timezone.utc)
    
    # Stage distribution (realistic funnel)
    stages = [
        ("lead_new", 25),       # 25% new leads
        ("contacted", 20),      # 20% contacted
        ("interested", 15),     # 15% interested
        ("viewing", 10),        # 10% viewing
        ("holding", 8),         # 8% holding
        ("booking", 7),         # 7% booking
        ("negotiating", 5),     # 5% negotiating
        ("closed_won", 7),      # 7% won
        ("closed_lost", 3),     # 3% lost
    ]
    
    sales_users = [u for u in users if u["role"] == "sales_agent"]
    available_products = [p for p in products if p["status"] == "available"]
    
    for i in range(count):
        deal_id = uuid.uuid4()
        
        # Determine stage
        r = random.randint(1, 100)
        cumulative = 0
        stage = "lead_new"
        for s, pct in stages:
            cumulative += pct
            if r <= cumulative:
                stage = s
                break
        
        # Lead info
        lead_name = random_vietnamese_name()
        lead_phone = random_phone()
        lead_email = f"{lead_name.lower().replace(' ', '.')}@gmail.com"
        
        # Assign to sales
        owner = random.choice(sales_users) if sales_users else users[0]
        
        # Assign product for stages >= viewing
        product = None
        if stage in ["viewing", "holding", "booking", "negotiating", "closed_won"]:
            if available_products:
                product = random.choice(available_products)
        
        # Deal value
        value = product["price"] if product else random_price()
        
        # Deal code
        deal_code = f"DEAL-{datetime.now().strftime('%y%m')}-{i+1:04d}"
        
        # Stage entered at (randomize for realism)
        days_ago = random.randint(0, 30) if stage == "lead_new" else random.randint(0, 60)
        stage_entered_at = now - timedelta(days=days_ago)
        
        try:
            conn.execute(text("""
                INSERT INTO pipeline_deals (
                    id, org_id, deal_code, stage, expected_value, customer_name, customer_phone, customer_email,
                    product_id, owner_user_id, stage_entered_at, status, created_at, updated_at
                ) VALUES (
                    :id, :org_id, :code, :stage, :value, :lead_name, :lead_phone, :lead_email,
                    :product_id, :owner_id, :stage_at, 'active', :now, :now
                )
                ON CONFLICT DO NOTHING
            """), {
                "id": deal_id, "org_id": org_id, "code": deal_code,
                "stage": stage, "value": value,
                "lead_name": lead_name, "lead_phone": lead_phone, "lead_email": lead_email,
                "product_id": product["id"] if product else None,
                "owner_id": owner["id"],
                "stage_at": stage_entered_at, "now": now
            })
            
            deals.append({
                "id": deal_id, "code": deal_code, "stage": stage,
                "value": value, "lead_name": lead_name,
                "product": product, "owner": owner
            })
        except Exception as e:
            print(f"Skip deal {deal_code}: {e}")
            # Rollback and continue
            conn.rollback()
    
    conn.commit()
    print(f"Created {len(deals)} deals")
    return deals

def create_holds(conn, org_id, users, products):
    """Create some holds with overdue status"""
    now = datetime.now(timezone.utc)
    sales_users = [u for u in users if u["role"] == "sales_agent"]
    
    # Get products that are "hold"
    hold_products = [p for p in products if p["status"] == "hold"]
    
    for i, product in enumerate(hold_products[:10]):  # First 10 holds
        holder = random.choice(sales_users) if sales_users else users[0]
        
        # Make some overdue (> 24h)
        if i < 3:  # First 3 are overdue
            hold_at = now - timedelta(hours=random.randint(25, 72))
        else:
            hold_at = now - timedelta(hours=random.randint(1, 20))
        
        expires_at = hold_at + timedelta(hours=24)
        
        # Update product with hold info
        try:
            conn.execute(text("""
                UPDATE products 
                SET hold_by = :holder, hold_at = :hold_at, hold_expires_at = :expires
                WHERE id = :id
            """), {
                "holder": holder["id"], "hold_at": hold_at,
                "expires": expires_at, "id": product["id"]
            })
        except Exception as e:
            print(f"Skip hold update: {e}")
    
    conn.commit()
    print(f"Updated {len(hold_products)} products with hold info")

def create_approvals(conn, org_id, users, deals):
    """Create pending approval requests for high-value deals"""
    now = datetime.now(timezone.utc)
    
    # Find deals with value >= 1 tỷ that are in booking/negotiating stage
    high_value_deals = [d for d in deals if d["value"] >= 1_000_000_000 and d["stage"] in ["booking", "negotiating"]]
    
    for deal in high_value_deals[:10]:  # First 10 high-value deals
        approval_id = uuid.uuid4()
        
        # Determine required role
        required_role = "director" if deal["value"] > 3_000_000_000 else "manager"
        
        try:
            conn.execute(text("""
                INSERT INTO manager_approval_requests (
                    id, org_id, request_type, reference_type, reference_id,
                    title, description, original_value, requested_value,
                    required_role, status, requested_by, requested_at, created_at, updated_at
                ) VALUES (
                    :id, :org_id, 'deal', 'deal', :ref_id,
                    :title, :desc, :value, :value,
                    :role, 'pending', :requester, :now, :now, :now
                )
                ON CONFLICT DO NOTHING
            """), {
                "id": approval_id, "org_id": org_id,
                "ref_id": deal["id"],
                "title": f"Phê duyệt deal {deal['code']} - {deal['lead_name']}",
                "desc": f"Deal giá trị {deal['value']:,.0f} VND cần được duyệt",
                "value": deal["value"],
                "role": required_role,
                "requester": deal["owner"]["id"],
                "now": now
            })
        except Exception as e:
            print(f"Skip approval: {e}")
    
    conn.commit()
    print(f"Created {len(high_value_deals[:10])} approval requests")

def create_inventory_events(conn, org_id, products):
    """Create inventory events for audit trail"""
    now = datetime.now(timezone.utc)
    
    for product in products[:30]:  # First 30 products
        event_id = uuid.uuid4()
        
        if product["status"] != "available":
            try:
                conn.execute(text("""
                    INSERT INTO inventory_events (
                        id, org_id, product_id, event_type, old_status, new_status,
                        source, description, created_at
                    ) VALUES (
                        :id, :org_id, :product_id, 'status_change', 'available', :new_status,
                        'system', :desc, :now
                    )
                    ON CONFLICT DO NOTHING
                """), {
                    "id": event_id, "org_id": org_id, "product_id": product["id"],
                    "new_status": product["status"],
                    "desc": f"Status changed to {product['status']}",
                    "now": now - timedelta(hours=random.randint(1, 72))
                })
            except Exception as e:
                pass
    
    conn.commit()
    print("Created inventory events")

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("ProHouzing Sample Data Generator")
    print("=" * 60)
    
    with engine.connect() as conn:
        # Create org
        org_id = create_org(conn)
        print(f"Organization ID: {org_id}")
        
        # Create users
        users = create_sales_users(conn, org_id, count=25)
        
        # Create projects
        projects = create_projects(conn, org_id)
        
        # Create products
        products = create_products(conn, org_id, projects, count=80)
        
        # Create deals
        deals = create_deals(conn, org_id, users, products, count=150)
        
        # Create holds
        create_holds(conn, org_id, users, products)
        
        # Create approvals
        create_approvals(conn, org_id, users, deals)
        
        # Create inventory events
        create_inventory_events(conn, org_id, products)
        
        print("=" * 60)
        print("SAMPLE DATA CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"- Users: {len(users)}")
        print(f"- Projects: {len(projects)}")
        print(f"- Products: {len(products)}")
        print(f"- Deals: {len(deals)}")
        print("=" * 60)

if __name__ == "__main__":
    main()
