#!/usr/bin/env python3
"""
ProHouzing Database Migration Script
=====================================

This script:
1. Creates all PostgreSQL tables
2. Seeds default organization
3. Migrates data from MongoDB to PostgreSQL
4. Runs reconciliation check

Usage:
    python run_migration.py [--dry-run] [--skip-seed]
"""

import asyncio
import os
import sys
import json
from datetime import datetime, timezone
from uuid import UUID

# Add backend to path
sys.path.insert(0, '/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from core.database import init_db, engine, SessionLocal, IS_POSTGRES
from core.models import Organization, User
from core.migration.mongo_to_postgres import MongoToPostgresMigrator, MigrationConfig
from sqlalchemy import text

# Default organization ID
DEFAULT_ORG_ID = UUID("00000000-0000-0000-0000-000000000001")


def create_tables():
    """Create all PostgreSQL tables"""
    print("=" * 60)
    print("STEP 1: Creating PostgreSQL Tables")
    print("=" * 60)
    
    if not IS_POSTGRES:
        print("ERROR: PostgreSQL not configured!")
        print("Please set POSTGRES_URL in /app/backend/.env")
        return False
    
    init_db()
    print("✅ All tables created successfully!")
    return True


def seed_default_org():
    """Seed default organization and admin user"""
    print("\n" + "=" * 60)
    print("STEP 2: Seeding Default Organization")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Check if org already exists
        existing_org = db.execute(
            text("SELECT id FROM organizations WHERE id = :id"),
            {"id": str(DEFAULT_ORG_ID)}
        ).fetchone()
        
        if existing_org:
            print("✅ Default organization already exists, skipping seed")
            return True
        
        # Create default organization
        db.execute(
            text("""
                INSERT INTO organizations (id, code, name, legal_name, org_type, status, timezone, currency_code, locale, created_at, updated_at)
                VALUES (:id, :code, :name, :legal_name, :org_type, :status, :timezone, :currency_code, :locale, :created_at, :updated_at)
            """),
            {
                "id": str(DEFAULT_ORG_ID),
                "code": "PROHOUZING",
                "name": "ProHouzing Vietnam",
                "legal_name": "Công ty TNHH ProHouzing Việt Nam",
                "org_type": "company",
                "status": "active",
                "timezone": "Asia/Ho_Chi_Minh",
                "currency_code": "VND",
                "locale": "vi-VN",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        )
        db.commit()
        print("✅ Default organization created!")
        return True
        
    except Exception as e:
        print(f"❌ Error seeding organization: {e}")
        db.rollback()
        return False
    finally:
        db.close()


async def run_migration(dry_run: bool = False):
    """Run data migration from MongoDB to PostgreSQL"""
    print("\n" + "=" * 60)
    print("STEP 3: Migrating Data from MongoDB to PostgreSQL")
    print("=" * 60)
    
    if dry_run:
        print("🔍 DRY RUN MODE - No data will be written")
    
    config = MigrationConfig(
        mongo_url=os.environ.get("MONGO_URL", "mongodb://localhost:27017"),
        mongo_db=os.environ.get("DB_NAME", "test_database"),
        postgres_url=os.environ.get("POSTGRES_URL", "postgresql://localhost/prohouzing"),
        batch_size=100,
        retry_count=3,
        dry_run=dry_run
    )
    
    print(f"MongoDB: {config.mongo_db}")
    print(f"PostgreSQL: {config.postgres_url.split('@')[-1]}")
    
    migrator = MongoToPostgresMigrator(config)
    
    try:
        report = await migrator.run_full_migration(DEFAULT_ORG_ID)
        
        # Save report
        report_file = f"/app/backend/migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report.save(report_file)
        print(f"\n📄 Report saved to: {report_file}")
        
        # Print summary
        print("\n" + "-" * 40)
        print("MIGRATION SUMMARY")
        print("-" * 40)
        summary = report.to_dict()
        for entity, stats in summary.get("entities", {}).items():
            status = "✅" if stats["total_failed"] == 0 else "⚠️"
            print(f"{status} {entity}: {stats['total_migrated']}/{stats['total_source']} migrated ({stats['total_failed']} failed)")
        
        print("-" * 40)
        print(f"Total migrated: {summary['summary']['total_migrated']}")
        print(f"Total failed: {summary['summary']['total_failed']}")
        print(f"Success rate: {summary['summary']['success_rate']}%")
        
        return summary['summary']['total_failed'] == 0
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await migrator.close()


def run_reconciliation():
    """Run reconciliation check"""
    print("\n" + "=" * 60)
    print("STEP 4: Running Reconciliation Check")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Count records in PostgreSQL
        pg_counts = {}
        tables = ['organizations', 'users', 'customers', 'leads']
        
        for table in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                pg_counts[table] = result
            except Exception as e:
                pg_counts[table] = f"Error: {e}"
        
        print("\nPostgreSQL Record Counts:")
        for table, count in pg_counts.items():
            print(f"  {table}: {count}")
        
        # Verify data integrity
        print("\nData Integrity Checks:")
        
        # Check all records have org_id
        for table in ['customers', 'leads', 'users']:
            try:
                result = db.execute(
                    text(f"SELECT COUNT(*) FROM {table} WHERE org_id IS NULL")
                ).scalar()
                status = "✅" if result == 0 else f"⚠️ {result} records"
                print(f"  {table} has org_id: {status}")
            except:
                pass
        
        return True
        
    except Exception as e:
        print(f"❌ Reconciliation error: {e}")
        return False
    finally:
        db.close()


async def main():
    """Main entry point"""
    import argparse
    parser = argparse.ArgumentParser(description='ProHouzing Database Migration')
    parser.add_argument('--dry-run', action='store_true', help='Run without writing data')
    parser.add_argument('--skip-seed', action='store_true', help='Skip seeding default org')
    parser.add_argument('--skip-migration', action='store_true', help='Skip data migration')
    args = parser.parse_args()
    
    print("=" * 60)
    print("PROHOUZING DATABASE MIGRATION")
    print(f"Started at: {datetime.now()}")
    print("=" * 60)
    
    # Step 1: Create tables
    if not create_tables():
        print("\n❌ Failed to create tables!")
        sys.exit(1)
    
    # Step 2: Seed default organization
    if not args.skip_seed:
        if not seed_default_org():
            print("\n❌ Failed to seed organization!")
            sys.exit(1)
    
    # Step 3: Run migration
    if not args.skip_migration:
        success = await run_migration(dry_run=args.dry_run)
        if not success and not args.dry_run:
            print("\n⚠️ Migration completed with errors!")
    
    # Step 4: Reconciliation
    run_reconciliation()
    
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE!")
    print(f"Finished at: {datetime.now()}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
