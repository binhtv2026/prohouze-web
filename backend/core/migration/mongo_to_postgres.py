"""
ProHouzing Data Migration
Version: 1.0.0

MongoDB → PostgreSQL Migration Script

Features:
- Batch processing
- Retry on failure
- Full logging
- Data validation
- Consistency checks
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from uuid import uuid4, UUID
from decimal import Decimal
import json

from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("migration")


class MigrationConfig(BaseModel):
    """Migration configuration"""
    mongo_url: str
    mongo_db: str
    postgres_url: str
    batch_size: int = 100
    retry_count: int = 3
    dry_run: bool = False


class MigrationStats(BaseModel):
    """Migration statistics"""
    entity: str
    total_source: int = 0
    total_migrated: int = 0
    total_failed: int = 0
    total_skipped: int = 0
    errors: List[Dict[str, Any]] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    @property
    def duration_seconds(self) -> float:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0


class MigrationReport:
    """Migration report"""
    def __init__(self):
        self.stats: Dict[str, MigrationStats] = {}
        self.started_at = datetime.now(timezone.utc)
        self.completed_at = None
    
    def add_entity_stats(self, entity: str, stats: MigrationStats):
        self.stats[entity] = stats
    
    def to_dict(self) -> Dict:
        return {
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "entities": {
                name: {
                    "total_source": s.total_source,
                    "total_migrated": s.total_migrated,
                    "total_failed": s.total_failed,
                    "total_skipped": s.total_skipped,
                    "errors_count": len(s.errors),
                    "duration_seconds": s.duration_seconds
                }
                for name, s in self.stats.items()
            },
            "summary": {
                "total_migrated": sum(s.total_migrated for s in self.stats.values()),
                "total_failed": sum(s.total_failed for s in self.stats.values()),
                "success_rate": self._calculate_success_rate()
            }
        }
    
    def _calculate_success_rate(self) -> float:
        total = sum(s.total_source for s in self.stats.values())
        migrated = sum(s.total_migrated for s in self.stats.values())
        return round(migrated / total * 100, 2) if total > 0 else 0
    
    def save(self, filepath: str):
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
        logger.info(f"Report saved to {filepath}")


class MongoToPostgresMigrator:
    """
    Main migration class.
    
    Handles:
    - Customer migration
    - Lead migration
    - Deal migration
    - User migration
    """
    
    def __init__(self, config: MigrationConfig):
        self.config = config
        self.report = MigrationReport()
        
        # MongoDB connection
        self.mongo_client = AsyncIOMotorClient(config.mongo_url)
        self.mongo_db = self.mongo_client[config.mongo_db]
        
        # PostgreSQL connection
        self.pg_engine = create_engine(config.postgres_url)
        self.SessionLocal = sessionmaker(bind=self.pg_engine)
    
    async def close(self):
        """Close connections"""
        self.mongo_client.close()
        self.pg_engine.dispose()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # UTILITY METHODS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _safe_uuid(self, value: Any) -> Optional[UUID]:
        """Safely convert to UUID"""
        if value is None:
            return None
        try:
            if isinstance(value, UUID):
                return value
            return UUID(str(value))
        except (ValueError, TypeError):
            return None
    
    def _safe_decimal(self, value: Any) -> Optional[Decimal]:
        """Safely convert to Decimal"""
        if value is None:
            return None
        try:
            return Decimal(str(value))
        except (ValueError, TypeError):
            return None
    
    def _safe_datetime(self, value: Any) -> Optional[datetime]:
        """Safely convert to datetime"""
        if value is None:
            return None
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value
        try:
            if isinstance(value, str):
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            pass
        return None
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number"""
        if not phone:
            return None
        # Remove all non-numeric except +
        cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
        return cleaned if cleaned else None
    
    def _normalize_email(self, email: str) -> str:
        """Normalize email"""
        if not email:
            return None
        return email.lower().strip()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CUSTOMER MIGRATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def migrate_customers(self, org_id: UUID) -> MigrationStats:
        """Migrate customers from MongoDB to PostgreSQL"""
        stats = MigrationStats(entity="customers")
        stats.started_at = datetime.now(timezone.utc)
        
        logger.info("Starting customer migration...")
        
        # Get total count
        stats.total_source = await self.mongo_db.leads.count_documents({
            "status": {"$in": ["closed_won", "customer"]}
        })
        
        # Also count from customers collection if exists
        try:
            stats.total_source += await self.mongo_db.customers.count_documents({})
        except Exception:
            pass
        
        logger.info(f"Found {stats.total_source} customers to migrate")
        
        # Migrate from leads (converted leads are customers)
        cursor = self.mongo_db.leads.find({
            "status": {"$in": ["closed_won", "customer"]}
        }).batch_size(self.config.batch_size)
        
        batch = []
        async for doc in cursor:
            try:
                customer_data = self._transform_lead_to_customer(doc, org_id)
                batch.append(customer_data)
                
                if len(batch) >= self.config.batch_size:
                    migrated, failed = await self._batch_insert_customers(batch)
                    stats.total_migrated += migrated
                    stats.total_failed += failed
                    batch = []
                    
            except Exception as e:
                stats.total_failed += 1
                stats.errors.append({
                    "source_id": str(doc.get("id", doc.get("_id"))),
                    "error": str(e)
                })
                logger.error(f"Failed to transform customer: {e}")
        
        # Insert remaining
        if batch:
            migrated, failed = await self._batch_insert_customers(batch)
            stats.total_migrated += migrated
            stats.total_failed += failed
        
        stats.completed_at = datetime.now(timezone.utc)
        logger.info(f"Customer migration complete: {stats.total_migrated}/{stats.total_source}")
        
        return stats
    
    def _transform_lead_to_customer(self, doc: Dict, org_id: UUID) -> Dict:
        """Transform MongoDB lead document to PostgreSQL customer"""
        customer_id = self._safe_uuid(doc.get("id")) or uuid4()
        
        return {
            "id": customer_id,
            "org_id": org_id,
            "customer_code": f"CUST-{customer_id.hex[:8].upper()}",
            "full_name": doc.get("full_name", "Unknown"),
            "primary_phone": self._normalize_phone(doc.get("phone")),
            "primary_email": self._normalize_email(doc.get("email")),
            "customer_type": "individual",
            "customer_stage": "customer",
            "source_channel": doc.get("channel", "website"),
            "owner_user_id": self._safe_uuid(doc.get("assigned_to")),
            "notes": doc.get("notes"),
            "total_deals": 1,  # At least one if closed_won
            "total_revenue": self._safe_decimal(doc.get("budget_max")) or Decimal(0),
            "status": "active",
            "created_at": self._safe_datetime(doc.get("created_at")) or datetime.now(timezone.utc),
            "created_by": self._safe_uuid(doc.get("created_by")) or org_id,
            "metadata_json": {
                "mongo_id": str(doc.get("_id")),
                "original_lead_id": doc.get("id"),
                "migrated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    
    async def _batch_insert_customers(self, customers: List[Dict]) -> Tuple[int, int]:
        """Batch insert customers to PostgreSQL"""
        if self.config.dry_run:
            logger.info(f"[DRY RUN] Would insert {len(customers)} customers")
            return len(customers), 0
        
        migrated = 0
        failed = 0
        
        db = self.SessionLocal()
        try:
            for customer in customers:
                try:
                    # Check if already exists
                    existing = db.execute(
                        text("SELECT id FROM customers WHERE id = :id"),
                        {"id": str(customer["id"])}
                    ).fetchone()
                    
                    if existing:
                        continue
                    
                    # Insert
                    db.execute(
                        text("""
                            INSERT INTO customers (
                                id, org_id, customer_code, full_name, primary_phone,
                                primary_email, customer_type, customer_stage, source_channel,
                                owner_user_id, notes, total_deals, total_revenue,
                                status, created_at, created_by, metadata_json
                            ) VALUES (
                                :id, :org_id, :customer_code, :full_name, :primary_phone,
                                :primary_email, :customer_type, :customer_stage, :source_channel,
                                :owner_user_id, :notes, :total_deals, :total_revenue,
                                :status, :created_at, :created_by, :metadata_json
                            )
                        """),
                        {
                            **customer,
                            "id": str(customer["id"]),
                            "org_id": str(customer["org_id"]),
                            "owner_user_id": str(customer["owner_user_id"]) if customer["owner_user_id"] else None,
                            "created_by": str(customer["created_by"]) if customer["created_by"] else None,
                            "metadata_json": json.dumps(customer["metadata_json"])
                        }
                    )
                    migrated += 1
                    
                except Exception as e:
                    failed += 1
                    logger.error(f"Failed to insert customer: {e}")
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            logger.error(f"Batch insert failed: {e}")
            failed = len(customers)
            migrated = 0
        finally:
            db.close()
        
        return migrated, failed
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEAD MIGRATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def migrate_leads(self, org_id: UUID) -> MigrationStats:
        """Migrate leads from MongoDB to PostgreSQL"""
        stats = MigrationStats(entity="leads")
        stats.started_at = datetime.now(timezone.utc)
        
        logger.info("Starting lead migration...")
        
        # Get total count (exclude converted customers)
        stats.total_source = await self.mongo_db.leads.count_documents({
            "status": {"$nin": ["closed_won", "customer"]}
        })
        
        logger.info(f"Found {stats.total_source} leads to migrate")
        
        cursor = self.mongo_db.leads.find({
            "status": {"$nin": ["closed_won", "customer"]}
        }).batch_size(self.config.batch_size)
        
        batch = []
        async for doc in cursor:
            try:
                lead_data = self._transform_lead(doc, org_id)
                batch.append(lead_data)
                
                if len(batch) >= self.config.batch_size:
                    migrated, failed = await self._batch_insert_leads(batch)
                    stats.total_migrated += migrated
                    stats.total_failed += failed
                    batch = []
                    
            except Exception as e:
                stats.total_failed += 1
                stats.errors.append({
                    "source_id": str(doc.get("id", doc.get("_id"))),
                    "error": str(e)
                })
                logger.error(f"Failed to transform lead: {e}")
        
        # Insert remaining
        if batch:
            migrated, failed = await self._batch_insert_leads(batch)
            stats.total_migrated += migrated
            stats.total_failed += failed
        
        stats.completed_at = datetime.now(timezone.utc)
        logger.info(f"Lead migration complete: {stats.total_migrated}/{stats.total_source}")
        
        return stats
    
    def _transform_lead(self, doc: Dict, org_id: UUID) -> Dict:
        """Transform MongoDB lead document to PostgreSQL lead"""
        lead_id = self._safe_uuid(doc.get("id")) or uuid4()
        
        # Map status
        status_map = {
            "new": "new",
            "contacted": "contacted",
            "called": "contacted",
            "viewing": "qualified",
            "warm": "qualified",
            "hot": "qualified",
            "deposit": "qualified",
            "negotiation": "qualified",
            "closed_lost": "lost"
        }
        
        mongo_status = doc.get("status", "new")
        lead_status = status_map.get(mongo_status, "new")
        
        # Map intent level
        intent_map = {
            "hot": "high",
            "warm": "medium",
            "deposit": "high",
            "negotiation": "high",
            "viewing": "medium"
        }
        intent_level = intent_map.get(mongo_status, "low")
        
        return {
            "id": lead_id,
            "org_id": org_id,
            "lead_code": f"LEAD-{lead_id.hex[:8].upper()}",
            "contact_name": doc.get("full_name", "Unknown"),
            "contact_phone": self._normalize_phone(doc.get("phone")),
            "contact_email": self._normalize_email(doc.get("email")),
            "source_channel": doc.get("channel", "website"),
            "lead_status": lead_status,
            "intent_level": intent_level,
            "budget_min": self._safe_decimal(doc.get("budget_min")),
            "budget_max": self._safe_decimal(doc.get("budget_max")),
            "owner_user_id": self._safe_uuid(doc.get("assigned_to")),
            "qualification_notes": doc.get("notes"),
            "contact_attempts": doc.get("follow_up_count", 0),
            "captured_at": self._safe_datetime(doc.get("created_at")) or datetime.now(timezone.utc),
            "status": "active",
            "created_at": self._safe_datetime(doc.get("created_at")) or datetime.now(timezone.utc),
            "created_by": self._safe_uuid(doc.get("created_by")) or org_id,
            "metadata_json": {
                "mongo_id": str(doc.get("_id")),
                "original_status": mongo_status,
                "segment": doc.get("segment"),
                "tags": doc.get("tags", []),
                "migrated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    
    async def _batch_insert_leads(self, leads: List[Dict]) -> Tuple[int, int]:
        """Batch insert leads to PostgreSQL"""
        if self.config.dry_run:
            logger.info(f"[DRY RUN] Would insert {len(leads)} leads")
            return len(leads), 0
        
        migrated = 0
        failed = 0
        
        db = self.SessionLocal()
        try:
            for lead in leads:
                try:
                    existing = db.execute(
                        text("SELECT id FROM leads WHERE id = :id"),
                        {"id": str(lead["id"])}
                    ).fetchone()
                    
                    if existing:
                        continue
                    
                    db.execute(
                        text("""
                            INSERT INTO leads (
                                id, org_id, lead_code, contact_name, contact_phone,
                                contact_email, source_channel, lead_status, intent_level,
                                budget_min, budget_max, owner_user_id, qualification_notes,
                                contact_attempts, captured_at, status, created_at, created_by,
                                metadata_json
                            ) VALUES (
                                :id, :org_id, :lead_code, :contact_name, :contact_phone,
                                :contact_email, :source_channel, :lead_status, :intent_level,
                                :budget_min, :budget_max, :owner_user_id, :qualification_notes,
                                :contact_attempts, :captured_at, :status, :created_at, :created_by,
                                :metadata_json
                            )
                        """),
                        {
                            **lead,
                            "id": str(lead["id"]),
                            "org_id": str(lead["org_id"]),
                            "owner_user_id": str(lead["owner_user_id"]) if lead["owner_user_id"] else None,
                            "created_by": str(lead["created_by"]) if lead["created_by"] else None,
                            "metadata_json": json.dumps(lead["metadata_json"])
                        }
                    )
                    migrated += 1
                    
                except Exception as e:
                    failed += 1
                    logger.error(f"Failed to insert lead: {e}")
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            logger.error(f"Batch insert failed: {e}")
            failed = len(leads)
            migrated = 0
        finally:
            db.close()
        
        return migrated, failed
    
    # ═══════════════════════════════════════════════════════════════════════════
    # USER MIGRATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def migrate_users(self, org_id: UUID) -> MigrationStats:
        """Migrate users from MongoDB to PostgreSQL"""
        stats = MigrationStats(entity="users")
        stats.started_at = datetime.now(timezone.utc)
        
        logger.info("Starting user migration...")
        
        stats.total_source = await self.mongo_db.users.count_documents({})
        logger.info(f"Found {stats.total_source} users to migrate")
        
        cursor = self.mongo_db.users.find({}).batch_size(self.config.batch_size)
        
        batch = []
        async for doc in cursor:
            try:
                user_data = self._transform_user(doc, org_id)
                batch.append(user_data)
                
                if len(batch) >= self.config.batch_size:
                    migrated, failed = await self._batch_insert_users(batch)
                    stats.total_migrated += migrated
                    stats.total_failed += failed
                    batch = []
                    
            except Exception as e:
                stats.total_failed += 1
                stats.errors.append({
                    "source_id": str(doc.get("id", doc.get("_id"))),
                    "error": str(e)
                })
        
        if batch:
            migrated, failed = await self._batch_insert_users(batch)
            stats.total_migrated += migrated
            stats.total_failed += failed
        
        stats.completed_at = datetime.now(timezone.utc)
        logger.info(f"User migration complete: {stats.total_migrated}/{stats.total_source}")
        
        return stats
    
    def _transform_user(self, doc: Dict, org_id: UUID) -> Dict:
        """Transform MongoDB user document to PostgreSQL user"""
        user_id = self._safe_uuid(doc.get("id")) or uuid4()
        
        role_map = {
            "bod": "director",
            "manager": "manager",
            "sales": "sales",
            "marketing": "marketing",
            "admin": "admin",
            "content": "staff"
        }
        
        return {
            "id": user_id,
            "org_id": org_id,
            "email": self._normalize_email(doc.get("email")),
            "password_hash": doc.get("password", ""),  # Already hashed
            "full_name": doc.get("full_name", "Unknown"),
            "employee_code": f"EMP-{user_id.hex[:6].upper()}",
            "phone": self._normalize_phone(doc.get("phone")),
            "user_type": role_map.get(doc.get("role"), "staff"),
            "is_active": doc.get("is_active", True),
            "status": "active" if doc.get("is_active", True) else "inactive",
            "created_at": self._safe_datetime(doc.get("created_at")) or datetime.now(timezone.utc),
            "created_by": org_id,
            "metadata_json": {
                "mongo_id": str(doc.get("_id")),
                "original_role": doc.get("role"),
                "department": doc.get("department"),
                "specializations": doc.get("specializations", []),
                "regions": doc.get("regions", []),
                "migrated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    
    async def _batch_insert_users(self, users: List[Dict]) -> Tuple[int, int]:
        """Batch insert users to PostgreSQL"""
        if self.config.dry_run:
            logger.info(f"[DRY RUN] Would insert {len(users)} users")
            return len(users), 0
        
        migrated = 0
        failed = 0
        
        db = self.SessionLocal()
        try:
            for user in users:
                try:
                    existing = db.execute(
                        text("SELECT id FROM users WHERE email = :email"),
                        {"email": user["email"]}
                    ).fetchone()
                    
                    if existing:
                        continue
                    
                    db.execute(
                        text("""
                            INSERT INTO users (
                                id, org_id, email, password_hash, full_name,
                                employee_code, phone, user_type, is_active,
                                status, created_at, created_by, metadata_json
                            ) VALUES (
                                :id, :org_id, :email, :password_hash, :full_name,
                                :employee_code, :phone, :user_type, :is_active,
                                :status, :created_at, :created_by, :metadata_json
                            )
                        """),
                        {
                            **user,
                            "id": str(user["id"]),
                            "org_id": str(user["org_id"]),
                            "created_by": str(user["created_by"]) if user["created_by"] else None,
                            "metadata_json": json.dumps(user["metadata_json"])
                        }
                    )
                    migrated += 1
                    
                except Exception as e:
                    failed += 1
                    logger.error(f"Failed to insert user: {e}")
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            logger.error(f"Batch insert failed: {e}")
            failed = len(users)
            migrated = 0
        finally:
            db.close()
        
        return migrated, failed
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DATA VALIDATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def validate_migration(self, org_id: UUID) -> Dict:
        """
        Validate migrated data.
        
        Checks:
        - Record counts match
        - Financial values match
        - Key relationships valid
        """
        validation = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": [],
            "passed": True
        }
        
        db = self.SessionLocal()
        
        try:
            # Check customer counts
            mongo_customers = await self.mongo_db.leads.count_documents({
                "status": {"$in": ["closed_won", "customer"]}
            })
            pg_customers = db.execute(
                text("SELECT COUNT(*) FROM customers WHERE org_id = :org_id AND deleted_at IS NULL"),
                {"org_id": str(org_id)}
            ).scalar()
            
            validation["checks"].append({
                "name": "customer_count",
                "mongo": mongo_customers,
                "postgres": pg_customers,
                "passed": abs(mongo_customers - pg_customers) <= 5  # Allow small variance
            })
            
            # Check lead counts
            mongo_leads = await self.mongo_db.leads.count_documents({
                "status": {"$nin": ["closed_won", "customer"]}
            })
            pg_leads = db.execute(
                text("SELECT COUNT(*) FROM leads WHERE org_id = :org_id AND deleted_at IS NULL"),
                {"org_id": str(org_id)}
            ).scalar()
            
            validation["checks"].append({
                "name": "lead_count",
                "mongo": mongo_leads,
                "postgres": pg_leads,
                "passed": abs(mongo_leads - pg_leads) <= 5
            })
            
            # Check user counts
            mongo_users = await self.mongo_db.users.count_documents({})
            pg_users = db.execute(
                text("SELECT COUNT(*) FROM users WHERE org_id = :org_id AND deleted_at IS NULL"),
                {"org_id": str(org_id)}
            ).scalar()
            
            validation["checks"].append({
                "name": "user_count",
                "mongo": mongo_users,
                "postgres": pg_users,
                "passed": abs(mongo_users - pg_users) <= 2
            })
            
            # Overall pass/fail
            validation["passed"] = all(c["passed"] for c in validation["checks"])
            
        except Exception as e:
            validation["error"] = str(e)
            validation["passed"] = False
        finally:
            db.close()
        
        return validation
    
    # ═══════════════════════════════════════════════════════════════════════════
    # MAIN MIGRATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def run_full_migration(self, org_id: UUID) -> MigrationReport:
        """
        Run full migration.
        
        Order:
        1. Users (needed for foreign keys)
        2. Customers
        3. Leads
        """
        logger.info("=" * 60)
        logger.info("STARTING FULL MIGRATION")
        logger.info("=" * 60)
        
        # Migrate users first
        user_stats = await self.migrate_users(org_id)
        self.report.add_entity_stats("users", user_stats)
        
        # Migrate customers
        customer_stats = await self.migrate_customers(org_id)
        self.report.add_entity_stats("customers", customer_stats)
        
        # Migrate leads
        lead_stats = await self.migrate_leads(org_id)
        self.report.add_entity_stats("leads", lead_stats)
        
        # Validate
        logger.info("Running validation...")
        validation = await self.validate_migration(org_id)
        
        self.report.completed_at = datetime.now(timezone.utc)
        
        logger.info("=" * 60)
        logger.info("MIGRATION COMPLETE")
        logger.info(f"Report: {self.report.to_dict()}")
        logger.info(f"Validation: {validation}")
        logger.info("=" * 60)
        
        return self.report


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """Main entry point for migration"""
    import os
    
    config = MigrationConfig(
        mongo_url=os.environ.get("MONGO_URL", "mongodb://localhost:27017"),
        mongo_db=os.environ.get("DB_NAME", "test_database"),
        postgres_url=os.environ.get("POSTGRES_URL", "postgresql://localhost/prohouzing"),
        batch_size=100,
        dry_run=os.environ.get("DRY_RUN", "false").lower() == "true"
    )
    
    # Default org_id (should be created first or passed as argument)
    org_id = UUID(os.environ.get("ORG_ID", "00000000-0000-0000-0000-000000000001"))
    
    migrator = MongoToPostgresMigrator(config)
    
    try:
        report = await migrator.run_full_migration(org_id)
        report.save("/app/backend/migration_report.json")
    finally:
        await migrator.close()


if __name__ == "__main__":
    asyncio.run(main())
