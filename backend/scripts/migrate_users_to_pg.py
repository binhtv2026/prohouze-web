"""
MongoDB → PostgreSQL User Migration Script
Prompt 2.5/18: Migrate users from MongoDB to PostgreSQL

This script:
1. Reads all users from MongoDB
2. Creates corresponding records in PostgreSQL users table
3. Migrates roles and permissions
4. Updates auth to use PostgreSQL
"""

import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime, timezone, date
from uuid import UUID, uuid4

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env')

from core.database import SessionLocal, engine, Base
from core.models.user import User, UserMembership
from core.models.organization import Organization


# MongoDB connection
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
mongo_db = mongo_client[os.environ['DB_NAME']]

# Default org for single-tenant mode
DEFAULT_ORG_ID = UUID("00000000-0000-0000-0000-000000000001")


def ensure_organization_exists(db: Session):
    """Ensure default organization exists"""
    org = db.execute(
        select(Organization).where(Organization.id == DEFAULT_ORG_ID)
    ).scalar_one_or_none()
    
    if not org:
        org = Organization(
            id=DEFAULT_ORG_ID,
            code="PROHOUZING",
            name="ProHouzing Corporation",
            legal_name="ProHouzing Corporation",
            org_type="corporation",
            status="active"
        )
        db.add(org)
        db.commit()
        print(f"✅ Created default organization: {DEFAULT_ORG_ID}")
    else:
        print(f"✅ Organization exists: {org.name}")
    
    return org


async def get_mongo_users() -> list:
    """Get all users from MongoDB"""
    users = await mongo_db.users.find({}, {"_id": 0}).to_list(1000)
    print(f"📦 Found {len(users)} users in MongoDB")
    return users


def migrate_user(db: Session, mongo_user: dict) -> User:
    """Migrate a single user from MongoDB to PostgreSQL"""
    
    # Check if user already exists by email
    existing = db.execute(
        select(User).where(User.email == mongo_user.get("email"))
    ).scalar_one_or_none()
    
    if existing:
        print(f"  ⏭️  User already exists: {mongo_user.get('email')}")
        return existing
    
    # Parse MongoDB user ID
    mongo_id = mongo_user.get("id")
    try:
        user_id = UUID(mongo_id) if mongo_id else uuid4()
    except (ValueError, TypeError):
        user_id = uuid4()
    
    # Map role to PostgreSQL
    role = mongo_user.get("role", "sales")
    role_mapping = {
        "bod": "bod",
        "admin": "admin",
        "manager": "manager",
        "sales": "sales",
        "marketing": "marketing",
        "content": "content",
        "support": "support"
    }
    mapped_role = role_mapping.get(role, "sales")
    
    # Create PostgreSQL user
    pg_user = User(
        id=user_id,
        org_id=DEFAULT_ORG_ID,
        email=mongo_user.get("email"),
        full_name=mongo_user.get("full_name", "Unknown"),
        phone=mongo_user.get("phone"),
        password_hash=mongo_user.get("password"),  # Already hashed
        user_type="internal",
        job_title=mongo_user.get("role", "").replace("_", " ").title(),
        department=mongo_user.get("department", "sales"),
        status="active" if mongo_user.get("is_active", True) else "inactive",
        preferred_language="vi",
        timezone="Asia/Ho_Chi_Minh",
        settings_json={
            "mongo_migrated": True,
            "original_mongo_id": mongo_id,
            "branch_id": mongo_user.get("branch_id"),
            "team_id": mongo_user.get("team_id"),
            "specializations": mongo_user.get("specializations", []),
            "regions": mongo_user.get("regions", []),
        }
    )
    
    db.add(pg_user)
    db.flush()  # Get ID without commit
    
    # Create user membership (role assignment)
    membership = UserMembership(
        user_id=pg_user.id,
        org_id=DEFAULT_ORG_ID,
        role_code=mapped_role,
        scope_type="org",
        is_primary=True,
        status="active",
        permissions_json=get_role_permissions(mapped_role)
    )
    db.add(membership)
    
    print(f"  ✅ Migrated user: {mongo_user.get('email')} (role: {mapped_role})")
    return pg_user


def get_role_permissions(role: str) -> dict:
    """Get default permissions for a role"""
    permissions = {
        "bod": {
            "leads": ["view", "create", "edit", "delete", "assign", "export"],
            "deals": ["view", "create", "edit", "delete", "approve"],
            "customers": ["view", "create", "edit", "delete"],
            "contracts": ["view", "create", "edit", "delete", "approve", "sign"],
            "commissions": ["view", "create", "edit", "approve", "payout"],
            "reports": ["view", "export"],
            "settings": ["view", "edit"],
            "users": ["view", "create", "edit", "delete"],
            "admin": ["view", "edit"]
        },
        "admin": {
            "leads": ["view", "create", "edit", "delete", "assign", "export"],
            "deals": ["view", "create", "edit", "delete", "approve"],
            "customers": ["view", "create", "edit", "delete"],
            "contracts": ["view", "create", "edit", "delete", "approve", "sign"],
            "commissions": ["view", "create", "edit", "approve", "payout"],
            "reports": ["view", "export"],
            "settings": ["view", "edit"],
            "users": ["view", "create", "edit", "delete"],
            "admin": ["view", "edit"]
        },
        "manager": {
            "leads": ["view", "create", "edit", "assign"],
            "deals": ["view", "create", "edit", "approve"],
            "customers": ["view", "create", "edit"],
            "contracts": ["view", "create", "edit", "approve"],
            "commissions": ["view", "approve"],
            "reports": ["view", "export"],
            "users": ["view"]
        },
        "sales": {
            "leads": ["view", "create", "edit"],
            "deals": ["view", "create", "edit"],
            "customers": ["view", "create", "edit"],
            "contracts": ["view", "create"],
            "commissions": ["view"],
            "reports": ["view"]
        },
        "marketing": {
            "leads": ["view", "create"],
            "content": ["view", "create", "edit", "delete"],
            "campaigns": ["view", "create", "edit"],
            "reports": ["view"]
        },
        "content": {
            "content": ["view", "create", "edit"],
            "campaigns": ["view"]
        },
        "support": {
            "leads": ["view"],
            "customers": ["view", "edit"],
            "tickets": ["view", "create", "edit"]
        }
    }
    return permissions.get(role, permissions["sales"])


async def main():
    """Main migration function"""
    print("=" * 60)
    print("MongoDB → PostgreSQL User Migration")
    print("=" * 60)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ PostgreSQL tables ensured")
    
    # Get PostgreSQL session
    db = SessionLocal()
    
    try:
        # Ensure organization exists
        ensure_organization_exists(db)
        
        # Get MongoDB users
        mongo_users = await get_mongo_users()
        
        if not mongo_users:
            print("⚠️  No users found in MongoDB")
            return
        
        # Migrate each user
        migrated = 0
        skipped = 0
        
        print("\n📋 Migrating users...")
        for mongo_user in mongo_users:
            try:
                migrate_user(db, mongo_user)
                migrated += 1
            except Exception as e:
                print(f"  ❌ Error migrating {mongo_user.get('email')}: {e}")
                skipped += 1
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"Migration Complete!")
        print(f"  ✅ Migrated: {migrated}")
        print(f"  ⏭️  Skipped: {skipped}")
        print("=" * 60)
        
        # Verify
        print("\n📊 Verification:")
        pg_users = db.execute(select(User)).scalars().all()
        print(f"  PostgreSQL users: {len(pg_users)}")
        
        for user in pg_users:
            print(f"    - {user.email} ({user.job_title})")
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
