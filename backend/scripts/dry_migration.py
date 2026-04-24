"""
ProHouzing Migration - Dry Run Test
Version: 1.0.0

Test migration with existing MongoDB data to SQLite.
This validates the migration logic before running on PostgreSQL.
"""

import asyncio
import os
import sys
import logging
from uuid import uuid4, UUID
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, '/app/backend')

from core.migration import (
    MongoToPostgresMigrator,
    MigrationConfig,
    MigrationVersioning,
    MigrationReconciliation
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("dry_run")


async def run_dry_migration():
    """Run dry migration test"""
    logger.info("=" * 60)
    logger.info("STARTING DRY MIGRATION TEST")
    logger.info("=" * 60)
    
    # Get MongoDB URL from environment
    mongo_url = os.environ.get("MONGO_URL", "")
    mongo_db = os.environ.get("DB_NAME", "test_database")
    
    if not mongo_url:
        logger.error("MONGO_URL not set in environment!")
        return False
    
    logger.info(f"MongoDB: {mongo_db}")
    
    # Use SQLite for testing (no PostgreSQL needed)
    sqlite_url = "sqlite:///./dry_migration_test.db"
    
    config = MigrationConfig(
        mongo_url=mongo_url,
        mongo_db=mongo_db,
        postgres_url=sqlite_url,
        batch_size=50,
        dry_run=True  # DRY RUN - no actual inserts
    )
    
    # Start version tracking
    version = MigrationVersioning.start_version(
        dry_run=True,
        notes="Dry run test with existing MongoDB data"
    )
    logger.info(f"Migration Version: {version.version}")
    
    # Default org_id (will be created or use existing)
    org_id = UUID("00000000-0000-0000-0000-000000000001")
    
    migrator = MongoToPostgresMigrator(config)
    
    try:
        # First, count records in MongoDB
        logger.info("\n--- COUNTING MONGODB RECORDS ---")
        
        # Users
        user_count = await migrator.mongo_db.users.count_documents({})
        logger.info(f"Users in MongoDB: {user_count}")
        
        # Leads (all)
        lead_count = await migrator.mongo_db.leads.count_documents({})
        logger.info(f"Leads in MongoDB: {lead_count}")
        
        # Leads that would become customers
        customer_leads = await migrator.mongo_db.leads.count_documents({
            "status": {"$in": ["closed_won", "customer"]}
        })
        logger.info(f"Leads → Customers: {customer_leads}")
        
        # Active leads
        active_leads = await migrator.mongo_db.leads.count_documents({
            "status": {"$nin": ["closed_won", "customer"]}
        })
        logger.info(f"Active Leads: {active_leads}")
        
        # Run migration
        logger.info("\n--- RUNNING DRY MIGRATION ---")
        report = await migrator.run_full_migration(org_id)
        
        # Show results
        logger.info("\n--- MIGRATION RESULTS ---")
        for entity, stats in report.stats.items():
            logger.info(f"{entity}:")
            logger.info(f"  Source: {stats.total_source}")
            logger.info(f"  Would migrate: {stats.total_migrated}")
            logger.info(f"  Skipped: {stats.total_skipped}")
            logger.info(f"  Failed: {stats.total_failed}")
            if stats.errors:
                logger.info(f"  Errors: {stats.errors[:3]}")
        
        # Save report
        report.save(f"/app/backend/dry_migration_v{version.version}.json")
        
        # Complete version
        MigrationVersioning.complete_version(
            version=version.version,
            status="dry_run_completed",
            source_counts={name: s.total_source for name, s in report.stats.items()},
            target_counts={name: s.total_migrated for name, s in report.stats.items()}
        )
        
        logger.info("\n--- DRY RUN COMPLETE ---")
        logger.info(f"Report saved to: /app/backend/dry_migration_v{version.version}.json")
        
        # Summary
        total_source = sum(s.total_source for s in report.stats.values())
        total_would_migrate = sum(s.total_migrated for s in report.stats.values())
        total_failed = sum(s.total_failed for s in report.stats.values())
        
        logger.info(f"\nSUMMARY:")
        logger.info(f"  Total Source Records: {total_source}")
        logger.info(f"  Would Migrate: {total_would_migrate}")
        logger.info(f"  Failed: {total_failed}")
        logger.info(f"  Success Rate: {total_would_migrate/total_source*100:.1f}%" if total_source > 0 else "N/A")
        
        return total_failed == 0
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        
        MigrationVersioning.complete_version(
            version=version.version,
            status="failed",
            errors=[str(e)]
        )
        return False
        
    finally:
        await migrator.close()
        
        # Cleanup test database
        if os.path.exists("./dry_migration_test.db"):
            os.remove("./dry_migration_test.db")
            logger.info("Cleaned up test database")


if __name__ == "__main__":
    success = asyncio.run(run_dry_migration())
    sys.exit(0 if success else 1)
