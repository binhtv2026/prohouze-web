"""
ProHouzing Tag Migration Script
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 2

Migrates existing ARRAY tags from entities (Lead, Customer, Deal, Product, Task)
to the new entity_tags table.

Usage:
    python -m core.scripts.migrate_tags
    
Or from the API:
    POST /api/v2/tags/migrate
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from typing import List, Tuple, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text

from core.database import SessionLocal, engine
from core.models.tags import Tag, EntityTag, SYSTEM_TAGS
from core.models.base import Base


# Entity tables that have tags array column
ENTITIES_WITH_TAGS = [
    ("leads", "lead"),
    ("customers", "customer"),
    ("deals", "deal"),
    ("products", "product"),
    ("tasks", "task"),
]


def create_tag_if_not_exists(db: Session, tag_code: str, org_id: Optional[UUID] = None) -> Tag:
    """Create or get a tag by code"""
    # Clean the tag code
    clean_code = tag_code.lower().strip().replace(" ", "_").replace("-", "_")
    
    # Find existing
    tag = db.query(Tag).filter(
        Tag.tag_code == clean_code,
        Tag.org_id == org_id
    ).first()
    
    if tag:
        return tag
    
    # Check if it's a system tag
    system_tag = next((t for t in SYSTEM_TAGS if t["code"] == clean_code), None)
    
    # Create new tag
    tag = Tag(
        org_id=org_id,
        tag_code=clean_code,
        tag_name=tag_code.replace("_", " ").title(),  # Original format as name
        tag_name_vi=system_tag.get("name_vi") if system_tag else None,
        color_code=system_tag.get("color", "#6B7280") if system_tag else "#6B7280",
        icon_code=system_tag.get("icon") if system_tag else "tag",
        category=system_tag.get("category") if system_tag else "custom",
        is_system=False,  # Migrated tags are not system tags
        usage_count=0,
        status="active"
    )
    
    db.add(tag)
    db.flush()
    
    return tag


def migrate_entity_tags(db: Session, table_name: str, entity_type: str) -> Tuple[int, int]:
    """
    Migrate tags from a specific entity table.
    
    Returns: (entities_processed, tags_migrated)
    """
    print(f"\n  Migrating tags from {table_name}...")
    
    entities_processed = 0
    tags_migrated = 0
    
    # Check if table has tags column
    check_sql = text(f"""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' AND column_name = 'tags'
    """)
    
    result = db.execute(check_sql).fetchone()
    if not result:
        print(f"    → Table {table_name} has no 'tags' column, skipping")
        return 0, 0
    
    # Get all entities with non-empty tags
    sql = text(f"""
        SELECT id, org_id, tags 
        FROM {table_name} 
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    """)
    
    rows = db.execute(sql).fetchall()
    print(f"    Found {len(rows)} entities with tags")
    
    for row in rows:
        entity_id = row[0]
        org_id = row[1]
        tags = row[2]  # Array of strings
        
        if not tags:
            continue
        
        entities_processed += 1
        
        for tag_value in tags:
            if not tag_value or not tag_value.strip():
                continue
            
            # Get or create tag
            tag = create_tag_if_not_exists(db, tag_value, org_id)
            
            # Check if already migrated
            existing = db.query(EntityTag).filter(
                EntityTag.tag_id == tag.id,
                EntityTag.entity_type == entity_type,
                EntityTag.entity_id == entity_id
            ).first()
            
            if existing:
                continue
            
            # Create entity tag
            entity_tag = EntityTag(
                org_id=org_id,
                tag_id=tag.id,
                entity_type=entity_type,
                entity_id=entity_id
            )
            db.add(entity_tag)
            
            # Increment usage
            tag.usage_count = (tag.usage_count or 0) + 1
            
            tags_migrated += 1
    
    db.flush()
    print(f"    → Processed {entities_processed} entities, migrated {tags_migrated} tags")
    
    return entities_processed, tags_migrated


def update_usage_counts(db: Session):
    """Recalculate usage counts for all tags"""
    print("\n  Recalculating usage counts...")
    
    tags = db.query(Tag).all()
    for tag in tags:
        count = db.query(EntityTag).filter(EntityTag.tag_id == tag.id).count()
        tag.usage_count = count
    
    db.flush()
    print(f"    → Updated {len(tags)} tags")


def migrate_all(db: Session):
    """Run full tag migration"""
    print("\n═══════════════════════════════════════════════════════")
    print("  TAG MIGRATION: ARRAY → entity_tags")
    print("═══════════════════════════════════════════════════════")
    
    total_entities = 0
    total_tags = 0
    
    for table_name, entity_type in ENTITIES_WITH_TAGS:
        try:
            entities, tags = migrate_entity_tags(db, table_name, entity_type)
            total_entities += entities
            total_tags += tags
        except Exception as e:
            print(f"    ✗ Error migrating {table_name}: {e}")
    
    # Update usage counts
    update_usage_counts(db)
    
    db.commit()
    
    print("\n═══════════════════════════════════════════════════════")
    print(f"  MIGRATION COMPLETE")
    print(f"  - Entities processed: {total_entities}")
    print(f"  - Tags migrated: {total_tags}")
    print(f"  - Unique tags created: {db.query(Tag).count()}")
    print("═══════════════════════════════════════════════════════\n")
    
    return {
        "entities_processed": total_entities,
        "tags_migrated": total_tags,
        "unique_tags": db.query(Tag).count()
    }


def get_migration_stats(db: Session) -> dict:
    """Get migration statistics"""
    stats = {
        "tags_table": {
            "total": db.query(Tag).count(),
            "system": db.query(Tag).filter(Tag.is_system == True).count(),
            "custom": db.query(Tag).filter(Tag.is_system == False).count(),
        },
        "entity_tags_table": {
            "total": db.query(EntityTag).count(),
        },
        "by_entity_type": {},
        "migration_status": {}
    }
    
    # Count by entity type
    for table_name, entity_type in ENTITIES_WITH_TAGS:
        count = db.query(EntityTag).filter(
            EntityTag.entity_type == entity_type
        ).count()
        stats["by_entity_type"][entity_type] = count
        
        # Check remaining array tags
        try:
            sql = text(f"""
                SELECT COUNT(*) 
                FROM {table_name} 
                WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
            """)
            remaining = db.execute(sql).scalar()
            stats["migration_status"][table_name] = {
                "has_array_tags": remaining > 0,
                "remaining_entities": remaining
            }
        except Exception:
            stats["migration_status"][table_name] = {"error": "Table not found"}
    
    return stats


def main():
    """Main entry point"""
    print("Starting Tag Migration...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created/verified")
    
    # Run migration
    db = SessionLocal()
    try:
        result = migrate_all(db)
        
        # Print stats
        stats = get_migration_stats(db)
        print("\nMigration Stats:")
        print(f"  - Total tags: {stats['tags_table']['total']}")
        print(f"  - System tags: {stats['tags_table']['system']}")
        print(f"  - Custom tags: {stats['tags_table']['custom']}")
        print(f"  - Total entity tags: {stats['entity_tags_table']['total']}")
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
