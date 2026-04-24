"""
ProHouzing Core Database Configuration
Version: 1.0.0

Hybrid Architecture:
- PostgreSQL: Primary database for new core system
- MongoDB: Legacy database (read-only transition)
- SQLite: Development/testing fallback
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE URL CONFIGURATION - PostgreSQL ONLY (No Fallback)
# ═══════════════════════════════════════════════════════════════════════════════

# PostgreSQL (Primary - Production) - REQUIRED
POSTGRES_URL = os.environ.get(
    "POSTGRES_URL",
    os.environ.get("DATABASE_URL", "")
)

if not POSTGRES_URL or not POSTGRES_URL.startswith("postgresql"):
    raise RuntimeError("POSTGRES_URL is required and must be a valid PostgreSQL connection string")

DATABASE_URL = POSTGRES_URL
IS_POSTGRES = True
IS_SQLITE = False

# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE CONFIGURATION - PostgreSQL
# ═══════════════════════════════════════════════════════════════════════════════

engine_args = {
    "poolclass": QueuePool,
    "pool_size": 10,
    "max_overflow": 20,
    "pool_timeout": 30,
    "pool_recycle": 1800,
    "pool_pre_ping": True,
}

# Create engine
engine = create_engine(DATABASE_URL, **engine_args)

# ═══════════════════════════════════════════════════════════════════════════════
# SESSION CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ═══════════════════════════════════════════════════════════════════════════════
# BASE MODEL
# ═══════════════════════════════════════════════════════════════════════════════

Base = declarative_base()


# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE DEPENDENCY
# ═══════════════════════════════════════════════════════════════════════════════

def get_db():
    """
    Database session dependency for FastAPI.
    Use with: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════════

def init_db():
    """
    Initialize database - create all tables.
    Call this on application startup.
    """
    # Import all models to register them
    from .models import (
        Organization, OrganizationalUnit,
        User, UserMembership,
        Customer, CustomerIdentity, CustomerAddress,
        Project, ProjectStructure, Product, ProductPriceHistory,
        Lead, Deal, Booking, Deposit, Contract,
        Payment, PaymentScheduleItem,
        CommissionEntry, CommissionRule,
        Partner, PartnerContract,
        Assignment, Task, ActivityLog, DomainEvent
    )
    
    # Import v2 event models (Prompt 2/18)
    from .models.events_v2 import (
        DomainEvent as DomainEventV2,
        ActivityStreamItem,
        EntityChangeLog,
        EventSubscription,
        EventDeliveryLog
    )
    
    # Import master data models (Prompt 3/20)
    from .models.master_data import MasterDataCategory, MasterDataItem
    
    # Import tag models (Prompt 3/20 - Phase 2)
    from .models.tags import Tag, EntityTag
    
    # Import attribute models (Prompt 3/20 - Phase 3)
    from .models.attributes import EntityAttribute, EntityAttributeValue
    
    # Import form models (Prompt 3/20 - Phase 4)
    from .models.forms import FormSchema, FormSection, FormField
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print(f"Database initialized: {'PostgreSQL' if IS_POSTGRES else 'SQLite'}")
    return True


def drop_all_tables():
    """
    Drop all tables - USE WITH CAUTION!
    Only for development/testing.
    """
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped!")


# ═══════════════════════════════════════════════════════════════════════════════
# CONNECTION INFO
# ═══════════════════════════════════════════════════════════════════════════════

def get_db_info():
    """Get database connection info (for health checks)"""
    return {
        "type": "postgresql" if IS_POSTGRES else "sqlite",
        "url": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,
        "pool_size": engine.pool.size() if IS_POSTGRES else None,
        "checked_out": engine.pool.checkedout() if IS_POSTGRES else None,
    }
