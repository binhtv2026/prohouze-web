"""
ProHouzing Migration - Reconciliation & Rollback
Version: 1.0.0

Reconciliation Report + Rollback Strategy + Versioning
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4
from decimal import Decimal
from enum import Enum

from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

logger = logging.getLogger("migration")


class MigrationVersion(BaseModel):
    """Migration version tracking"""
    version: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str = "running"  # running, completed, failed, rolled_back
    dry_run: bool = False
    source_counts: Dict[str, int] = {}
    target_counts: Dict[str, int] = {}
    financial_summary: Dict[str, Any] = {}
    errors: List[str] = []
    notes: str = ""


class ReconciliationReport(BaseModel):
    """Detailed reconciliation report"""
    timestamp: datetime
    migration_version: int
    
    # Record counts
    record_counts: Dict[str, Dict[str, int]] = {}  # entity -> {mongo, postgres, diff}
    
    # Financial reconciliation
    financial: Dict[str, Any] = {}
    
    # Deal stage breakdown
    deals_by_stage: Dict[str, Dict[str, int]] = {}  # stage -> {mongo, postgres}
    
    # Validation results
    validations: List[Dict[str, Any]] = []
    
    # Overall status
    passed: bool = True
    failure_reasons: List[str] = []
    
    # Tolerance threshold (0.1% = 0.001)
    tolerance: float = 0.001
    
    def check_tolerance(self, mongo_val: float, pg_val: float, name: str) -> bool:
        """Check if difference is within tolerance"""
        if mongo_val == 0:
            return pg_val == 0
        
        diff_pct = abs(mongo_val - pg_val) / mongo_val
        passed = diff_pct <= self.tolerance
        
        if not passed:
            self.passed = False
            self.failure_reasons.append(
                f"{name}: Sai lệch {diff_pct*100:.2f}% (Mongo: {mongo_val}, PG: {pg_val})"
            )
        
        return passed


class MigrationReconciliation:
    """
    Reconciliation service for migration validation.
    
    Checks:
    - Total records (Mongo vs PostgreSQL)
    - Financial values (Payment, Contract totals)
    - Deals by stage
    """
    
    def __init__(self, mongo_url: str, mongo_db: str, postgres_url: str):
        self.mongo_client = AsyncIOMotorClient(mongo_url)
        self.mongo_db = self.mongo_client[mongo_db]
        self.pg_engine = create_engine(postgres_url)
        self.SessionLocal = sessionmaker(bind=self.pg_engine)
    
    async def close(self):
        self.mongo_client.close()
        self.pg_engine.dispose()
    
    async def generate_reconciliation_report(
        self, 
        org_id: UUID,
        migration_version: int
    ) -> ReconciliationReport:
        """Generate full reconciliation report"""
        report = ReconciliationReport(
            timestamp=datetime.now(timezone.utc),
            migration_version=migration_version
        )
        
        db = self.SessionLocal()
        
        try:
            # 1. Record counts
            await self._check_record_counts(db, org_id, report)
            
            # 2. Financial reconciliation
            await self._check_financial_values(db, org_id, report)
            
            # 3. Deals by stage
            await self._check_deals_by_stage(db, org_id, report)
            
            # 4. Data integrity checks
            await self._check_data_integrity(db, org_id, report)
            
        finally:
            db.close()
        
        return report
    
    async def _check_record_counts(
        self, 
        db: Session, 
        org_id: UUID, 
        report: ReconciliationReport
    ):
        """Check record counts match"""
        entities = [
            ("users", "users", {}),
            ("customers", "leads", {"status": {"$in": ["closed_won", "customer"]}}),
            ("leads", "leads", {"status": {"$nin": ["closed_won", "customer"]}}),
        ]
        
        for pg_table, mongo_collection, mongo_filter in entities:
            # MongoDB count
            mongo_count = await self.mongo_db[mongo_collection].count_documents(mongo_filter)
            
            # PostgreSQL count
            pg_count = db.execute(
                text(f"SELECT COUNT(*) FROM {pg_table} WHERE org_id = :org_id AND deleted_at IS NULL"),
                {"org_id": str(org_id)}
            ).scalar() or 0
            
            diff = abs(mongo_count - pg_count)
            
            report.record_counts[pg_table] = {
                "mongo": mongo_count,
                "postgres": pg_count,
                "diff": diff,
                "passed": report.check_tolerance(mongo_count, pg_count, f"Record count: {pg_table}")
            }
    
    async def _check_financial_values(
        self, 
        db: Session, 
        org_id: UUID, 
        report: ReconciliationReport
    ):
        """Check financial values match"""
        # Note: Financial data needs actual collections - placeholder for now
        # In real scenario, check contracts, payments, etc.
        
        # Check total budget values from leads
        pipeline = [
            {"$match": {}},
            {"$group": {
                "_id": None,
                "total_budget_max": {"$sum": {"$ifNull": ["$budget_max", 0]}},
                "count": {"$sum": 1}
            }}
        ]
        
        mongo_result = await self.mongo_db.leads.aggregate(pipeline).to_list(1)
        mongo_total = mongo_result[0]["total_budget_max"] if mongo_result else 0
        
        # PostgreSQL equivalent (from leads + customers)
        pg_result = db.execute(
            text("""
                SELECT COALESCE(SUM(budget_max), 0) as total
                FROM leads 
                WHERE org_id = :org_id AND deleted_at IS NULL
            """),
            {"org_id": str(org_id)}
        ).scalar() or 0
        
        report.financial = {
            "total_budget_mongo": float(mongo_total),
            "total_budget_postgres": float(pg_result),
            "budget_reconciled": report.check_tolerance(
                float(mongo_total), 
                float(pg_result), 
                "Total budget"
            )
        }
    
    async def _check_deals_by_stage(
        self, 
        db: Session, 
        org_id: UUID, 
        report: ReconciliationReport
    ):
        """Check deal stage distribution"""
        # MongoDB - leads by status
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        
        mongo_stages = {}
        async for doc in self.mongo_db.leads.aggregate(pipeline):
            stage = doc["_id"] or "unknown"
            mongo_stages[stage] = doc["count"]
        
        # PostgreSQL - leads by lead_status
        pg_result = db.execute(
            text("""
                SELECT lead_status, COUNT(*) as count
                FROM leads 
                WHERE org_id = :org_id AND deleted_at IS NULL
                GROUP BY lead_status
            """),
            {"org_id": str(org_id)}
        ).fetchall()
        
        pg_stages = {row[0]: row[1] for row in pg_result}
        
        # Map MongoDB stages to PostgreSQL
        stage_mapping = {
            "new": "new",
            "contacted": "contacted",
            "called": "contacted",
            "viewing": "qualified",
            "warm": "qualified",
            "hot": "qualified",
            "deposit": "qualified",
            "negotiation": "qualified",
            "closed_won": "converted",
            "closed_lost": "lost"
        }
        
        # Aggregate by mapped stages
        mongo_mapped = {}
        for mongo_stage, count in mongo_stages.items():
            mapped = stage_mapping.get(mongo_stage, mongo_stage)
            mongo_mapped[mapped] = mongo_mapped.get(mapped, 0) + count
        
        for stage in set(list(mongo_mapped.keys()) + list(pg_stages.keys())):
            mongo_count = mongo_mapped.get(stage, 0)
            pg_count = pg_stages.get(stage, 0)
            
            report.deals_by_stage[stage] = {
                "mongo": mongo_count,
                "postgres": pg_count,
                "diff": abs(mongo_count - pg_count)
            }
    
    async def _check_data_integrity(
        self, 
        db: Session, 
        org_id: UUID, 
        report: ReconciliationReport
    ):
        """Check data integrity constraints"""
        validations = []
        
        # 1. Check for orphan records (no org_id)
        orphan_check = db.execute(
            text("SELECT COUNT(*) FROM customers WHERE org_id IS NULL")
        ).scalar() or 0
        
        validations.append({
            "name": "orphan_customers",
            "passed": orphan_check == 0,
            "detail": f"Found {orphan_check} customers without org_id"
        })
        
        # 2. Check for duplicate emails in users
        dup_emails = db.execute(
            text("""
                SELECT email, COUNT(*) as cnt 
                FROM users 
                WHERE deleted_at IS NULL
                GROUP BY email 
                HAVING COUNT(*) > 1
            """)
        ).fetchall()
        
        validations.append({
            "name": "duplicate_user_emails",
            "passed": len(dup_emails) == 0,
            "detail": f"Found {len(dup_emails)} duplicate emails"
        })
        
        # 3. Check required fields
        null_names = db.execute(
            text("""
                SELECT COUNT(*) FROM customers 
                WHERE org_id = :org_id AND full_name IS NULL AND deleted_at IS NULL
            """),
            {"org_id": str(org_id)}
        ).scalar() or 0
        
        validations.append({
            "name": "null_customer_names",
            "passed": null_names == 0,
            "detail": f"Found {null_names} customers with null names"
        })
        
        report.validations = validations
        
        # Update overall status
        for v in validations:
            if not v["passed"]:
                report.passed = False
                report.failure_reasons.append(f"Integrity check failed: {v['name']}")


class MigrationRollback:
    """
    Rollback strategy for migration.
    
    Features:
    - Clear PostgreSQL tables
    - Reset sequences
    - Re-run migration
    """
    
    def __init__(self, postgres_url: str):
        self.pg_engine = create_engine(postgres_url)
        self.SessionLocal = sessionmaker(bind=self.pg_engine)
    
    def close(self):
        self.pg_engine.dispose()
    
    def clear_migrated_data(self, org_id: UUID, version: int = None) -> Dict[str, int]:
        """
        Clear all migrated data for an organization.
        
        CAUTION: This is destructive!
        
        Args:
            org_id: Organization to clear
            version: Optional - only clear data from specific version
        
        Returns:
            Dict of table -> records deleted
        """
        db = self.SessionLocal()
        deleted_counts = {}
        
        # Tables in reverse dependency order
        tables = [
            "payments",
            "payment_schedule_items",
            "contracts",
            "deposits",
            "bookings",
            "deals",
            "leads",
            "customer_addresses",
            "customer_identities",
            "customers",
            "user_memberships",
            "users",
            "activity_logs",
        ]
        
        try:
            for table in tables:
                try:
                    # Check if table exists
                    exists = db.execute(
                        text("""
                            SELECT EXISTS (
                                SELECT FROM information_schema.tables 
                                WHERE table_name = :table
                            )
                        """),
                        {"table": table}
                    ).scalar()
                    
                    if not exists:
                        continue
                    
                    # Build delete query
                    if version:
                        # Only delete records with specific migration version in metadata
                        query = f"""
                            DELETE FROM {table} 
                            WHERE org_id = :org_id 
                            AND metadata_json->>'migration_version' = :version
                        """
                        result = db.execute(
                            text(query),
                            {"org_id": str(org_id), "version": str(version)}
                        )
                    else:
                        # Delete all records for org
                        query = f"DELETE FROM {table} WHERE org_id = :org_id"
                        result = db.execute(text(query), {"org_id": str(org_id)})
                    
                    deleted_counts[table] = result.rowcount
                    logger.info(f"Deleted {result.rowcount} records from {table}")
                    
                except Exception as e:
                    logger.warning(f"Could not clear {table}: {e}")
                    deleted_counts[table] = -1
            
            db.commit()
            logger.info(f"Rollback complete for org {org_id}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Rollback failed: {e}")
            raise
        finally:
            db.close()
        
        return deleted_counts
    
    def reset_sequences(self):
        """Reset all sequences (auto-increment counters)"""
        db = self.SessionLocal()
        
        try:
            # Get all sequences
            sequences = db.execute(
                text("""
                    SELECT sequence_name 
                    FROM information_schema.sequences 
                    WHERE sequence_schema = 'public'
                """)
            ).fetchall()
            
            for seq in sequences:
                db.execute(text(f"ALTER SEQUENCE {seq[0]} RESTART WITH 1"))
            
            db.commit()
            logger.info(f"Reset {len(sequences)} sequences")
            
        except Exception as e:
            db.rollback()
            logger.warning(f"Could not reset sequences: {e}")
        finally:
            db.close()


class MigrationVersioning:
    """
    Migration versioning system.
    
    Tracks:
    - Version number
    - Timestamp
    - Status
    - Counts
    """
    
    VERSION_FILE = "/app/backend/migration_versions.json"
    
    @classmethod
    def load_versions(cls) -> List[MigrationVersion]:
        """Load all migration versions"""
        try:
            with open(cls.VERSION_FILE, "r") as f:
                data = json.load(f)
                return [MigrationVersion(**v) for v in data]
        except FileNotFoundError:
            return []
    
    @classmethod
    def save_versions(cls, versions: List[MigrationVersion]):
        """Save migration versions"""
        with open(cls.VERSION_FILE, "w") as f:
            json.dump([v.model_dump(mode='json') for v in versions], f, indent=2, default=str)
    
    @classmethod
    def get_next_version(cls) -> int:
        """Get next version number"""
        versions = cls.load_versions()
        if not versions:
            return 1
        return max(v.version for v in versions) + 1
    
    @classmethod
    def start_version(cls, dry_run: bool = False, notes: str = "") -> MigrationVersion:
        """Start a new migration version"""
        versions = cls.load_versions()
        
        version = MigrationVersion(
            version=cls.get_next_version(),
            started_at=datetime.now(timezone.utc),
            status="running",
            dry_run=dry_run,
            notes=notes
        )
        
        versions.append(version)
        cls.save_versions(versions)
        
        logger.info(f"Started migration version {version.version} (dry_run={dry_run})")
        return version
    
    @classmethod
    def complete_version(
        cls, 
        version: int, 
        status: str,
        source_counts: Dict[str, int] = None,
        target_counts: Dict[str, int] = None,
        financial_summary: Dict[str, Any] = None,
        errors: List[str] = None
    ):
        """Complete a migration version"""
        versions = cls.load_versions()
        
        for v in versions:
            if v.version == version:
                v.completed_at = datetime.now(timezone.utc)
                v.status = status
                v.source_counts = source_counts or {}
                v.target_counts = target_counts or {}
                v.financial_summary = financial_summary or {}
                v.errors = errors or []
                break
        
        cls.save_versions(versions)
        logger.info(f"Completed migration version {version} with status: {status}")
    
    @classmethod
    def get_version(cls, version: int) -> Optional[MigrationVersion]:
        """Get specific version"""
        versions = cls.load_versions()
        for v in versions:
            if v.version == version:
                return v
        return None
    
    @classmethod
    def get_latest(cls) -> Optional[MigrationVersion]:
        """Get latest migration version"""
        versions = cls.load_versions()
        if not versions:
            return None
        return max(versions, key=lambda v: v.version)


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORT
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "MigrationVersion",
    "ReconciliationReport",
    "MigrationReconciliation",
    "MigrationRollback",
    "MigrationVersioning"
]
