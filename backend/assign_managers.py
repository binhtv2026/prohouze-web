"""
Gán managers cho org units và tạo employee profiles
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

async def assign_managers_and_profiles():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get all users
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    user_map = {u["email"]: u for u in users}
    
    # Get all org units
    org_units = await db.org_units.find({}, {"_id": 0}).to_list(100)
    org_map = {u["code"]: u for u in org_units}
    
    # Get all positions
    positions = await db.job_positions.find({}, {"_id": 0}).to_list(100)
    pos_map = {p["code"]: p for p in positions}
    
    print(f"Found {len(users)} users, {len(org_units)} org units, {len(positions)} positions")
    
    # Clear existing employee profiles
    await db.employee_profiles.delete_many({})
    
    # ==================== ASSIGN MANAGERS TO ORG UNITS ====================
    
    manager_assignments = {
        # Cấp công ty
        "PHV": "giamdoc@prohouzing.vn",  # ProHouzing Vietnam -> Giám đốc
        "HDQT": "giamdoc@prohouzing.vn",
        "TGD": "giamdoc@prohouzing.vn",
        
        # Khối kinh doanh
        "KD-MB": "manager1@prohouzing.vn",  # Miền Bắc -> Manager 1
        "KD-MN": "manager2@prohouzing.vn",  # Miền Nam -> Manager 2
        "KD-MT": "manager3@prohouzing.vn",  # Miền Trung -> Manager 3
        
        # Khối nội chính
        "NC": "manager4@prohouzing.vn",  # Nội chính -> Manager 4
        "NS": "manager4@prohouzing.vn",  # Nhân sự
        "KT": "manager4@prohouzing.vn",  # Kế toán
        "HC": "manager4@prohouzing.vn",  # Hành chính
        
        # Marketing
        "MKT": "marketing@prohouzing.vn",  # Marketing
        "DMK": "marketing@prohouzing.vn",  # Digital Marketing
        "CTT": "marketing@prohouzing.vn",  # Content
        
        # Dự án
        "HN-DA1": "manager1@prohouzing.vn",
        "HN-DA2": "manager1@prohouzing.vn",
        "HN-DA3": "manager1@prohouzing.vn",
        "HCM-DA1": "manager2@prohouzing.vn",
        "HCM-DA2": "manager2@prohouzing.vn",
        "HCM-DA3": "manager2@prohouzing.vn",
        "HCM-DA4": "manager2@prohouzing.vn",
        "DN-DA1": "manager3@prohouzing.vn",
        "DN-DA2": "manager3@prohouzing.vn",
        
        # Chi nhánh
        "PHV-SG": "manager2@prohouzing.vn",
        "PHV-HCM": "manager2@prohouzing.vn",
        "PHV-HN": "manager1@prohouzing.vn",
        "PHV-DN": "manager3@prohouzing.vn",
        "PHV-BD": "manager2@prohouzing.vn",
        "PHV-DNA": "manager2@prohouzing.vn",
        "PHV-CT": "manager5@prohouzing.vn",
    }
    
    updated_units = 0
    for code, email in manager_assignments.items():
        if code in org_map and email in user_map:
            await db.org_units.update_one(
                {"code": code},
                {"$set": {"manager_id": user_map[email]["id"]}}
            )
            updated_units += 1
    
    print(f"✅ Assigned managers to {updated_units} org units")
    
    # ==================== CREATE EMPLOYEE PROFILES ====================
    
    # Define user -> position + org unit mapping
    user_profiles = [
        # Admin
        {
            "email": "admin@prohouzing.vn",
            "position_code": "ITM",
            "org_code": "IT",
            "employment_type": "full_time",
            "join_date": "2020-01-01",
        },
        # BOD
        {
            "email": "giamdoc@prohouzing.vn",
            "position_code": "TGD",
            "org_code": "TGD",
            "employment_type": "full_time",
            "join_date": "2018-01-15",
        },
        # Managers
        {
            "email": "manager1@prohouzing.vn",
            "position_code": "GDCN",
            "org_code": "KD-MB",
            "employment_type": "full_time",
            "join_date": "2020-03-01",
            "specializations": ["Căn hộ cao cấp", "Biệt thự"],
            "regions": ["Hà Nội", "Miền Bắc"],
        },
        {
            "email": "manager2@prohouzing.vn",
            "position_code": "GDCN",
            "org_code": "KD-MN",
            "employment_type": "full_time",
            "join_date": "2020-02-15",
            "specializations": ["Căn hộ", "Shophouse"],
            "regions": ["TP.HCM", "Bình Dương", "Đồng Nai"],
        },
        {
            "email": "manager3@prohouzing.vn",
            "position_code": "GDCN",
            "org_code": "KD-MT",
            "employment_type": "full_time",
            "join_date": "2021-01-10",
            "regions": ["Đà Nẵng", "Miền Trung"],
        },
        {
            "email": "manager4@prohouzing.vn",
            "position_code": "TP",
            "org_code": "NC",
            "employment_type": "full_time",
            "join_date": "2020-06-01",
        },
        {
            "email": "manager5@prohouzing.vn",
            "position_code": "GDCN",
            "org_code": "PHV-CT",
            "employment_type": "full_time",
            "join_date": "2022-03-01",
            "regions": ["Cần Thơ", "Tây Nam Bộ"],
        },
        # Marketing
        {
            "email": "marketing@prohouzing.vn",
            "position_code": "MM",
            "org_code": "MKT",
            "employment_type": "full_time",
            "join_date": "2021-05-15",
            "skills": ["Digital Marketing", "Content Strategy", "SEO/SEM"],
        },
        # Sales
        {
            "email": "sales1@prohouzing.vn",
            "position_code": "TL",
            "org_code": "HN-DA1",
            "employment_type": "full_time",
            "join_date": "2021-08-01",
            "specializations": ["Vinhomes Ocean Park"],
            "regions": ["Hà Nội"],
        },
        {
            "email": "sales2@prohouzing.vn",
            "position_code": "SSE",
            "org_code": "HN-DA1",
            "employment_type": "full_time",
            "join_date": "2022-01-15",
            "manager_ids": [],  # Will be set to sales1
        },
        {
            "email": "sales3@prohouzing.vn",
            "position_code": "SE",
            "org_code": "HN-DA2",
            "employment_type": "full_time",
            "join_date": "2022-06-01",
        },
        {
            "email": "sales4@prohouzing.vn",
            "position_code": "TL",
            "org_code": "HCM-DA1",
            "employment_type": "full_time",
            "join_date": "2021-07-01",
            "specializations": ["Vinhomes Grand Park"],
            "regions": ["TP.HCM", "Quận 9"],
        },
        {
            "email": "sales5@prohouzing.vn",
            "position_code": "SSE",
            "org_code": "HCM-DA1",
            "employment_type": "full_time",
            "join_date": "2022-02-01",
        },
        {
            "email": "sales6@prohouzing.vn",
            "position_code": "SE",
            "org_code": "HCM-DA2",
            "employment_type": "full_time",
            "join_date": "2022-09-01",
        },
        {
            "email": "sales7@prohouzing.vn",
            "position_code": "SE",
            "org_code": "HCM-DA3",
            "employment_type": "full_time",
            "join_date": "2023-01-10",
        },
    ]
    
    profiles_created = 0
    for profile_data in user_profiles:
        email = profile_data["email"]
        if email not in user_map:
            print(f"  ⚠️ User not found: {email}")
            continue
        
        user = user_map[email]
        position = pos_map.get(profile_data.get("position_code"))
        org_unit = org_map.get(profile_data.get("org_code"))
        
        profile = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            # Personal info
            "date_of_birth": None,
            "gender": None,
            "id_number": None,
            "permanent_address": None,
            "current_address": None,
            "emergency_contact": None,
            "emergency_phone": None,
            # Work info
            "position_id": position["id"] if position else None,
            "org_unit_id": org_unit["id"] if org_unit else None,
            "employment_type": profile_data.get("employment_type", "full_time"),
            "join_date": profile_data.get("join_date"),
            "contract_start": profile_data.get("join_date"),
            "contract_end": None,
            "probation_end": None,
            # Managers
            "manager_ids": profile_data.get("manager_ids", []),
            # Skills
            "education": [],
            "certifications": [],
            "work_history": [],
            "skills": profile_data.get("skills", []),
            "specializations": profile_data.get("specializations", []),
            "regions": profile_data.get("regions", []),
            # Bank
            "bank_name": None,
            "bank_account": None,
            # Status
            "is_active": True,
            "created_at": now,
        }
        
        await db.employee_profiles.insert_one(profile)
        profiles_created += 1
        
        # Update user with department info
        if org_unit:
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "branch_id": org_unit["id"],
                    "team_id": org_unit["id"],
                }}
            )
    
    print(f"✅ Created {profiles_created} employee profiles")
    
    # ==================== SET MANAGER RELATIONSHIPS ====================
    
    # Sales2 reports to Sales1 (Team Leader)
    sales1 = user_map.get("sales1@prohouzing.vn")
    sales2 = user_map.get("sales2@prohouzing.vn")
    sales3 = user_map.get("sales3@prohouzing.vn")
    
    if sales1 and sales2:
        await db.employee_profiles.update_one(
            {"user_id": sales2["id"]},
            {"$set": {"manager_ids": [sales1["id"]]}}
        )
    
    # Sales5 reports to Sales4 (Team Leader)
    sales4 = user_map.get("sales4@prohouzing.vn")
    sales5 = user_map.get("sales5@prohouzing.vn")
    sales6 = user_map.get("sales6@prohouzing.vn")
    
    if sales4 and sales5:
        await db.employee_profiles.update_one(
            {"user_id": sales5["id"]},
            {"$set": {"manager_ids": [sales4["id"]]}}
        )
    
    print("✅ Set manager relationships")
    
    # ==================== UPDATE EMPLOYEE COUNTS ====================
    
    for org_unit in org_units:
        count = await db.employee_profiles.count_documents({"org_unit_id": org_unit["id"]})
        await db.org_units.update_one(
            {"id": org_unit["id"]},
            {"$set": {"employee_count": count}}
        )
    
    print("✅ Updated employee counts")
    
    # ==================== UPDATE POSITION EMPLOYEE COUNTS ====================
    
    for position in positions:
        count = await db.employee_profiles.count_documents({"position_id": position["id"]})
        await db.job_positions.update_one(
            {"id": position["id"]},
            {"$set": {"employee_count": count}}
        )
    
    print("✅ Updated position employee counts")
    
    client.close()
    print("\n✅ All assignments completed!")

if __name__ == "__main__":
    asyncio.run(assign_managers_and_profiles())
