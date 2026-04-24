"""
ProHouzing API v2 - Migration Router
Version: 1.1.0

Endpoints for data migration operations.

Features:
- Start/status migration
- Reconciliation reports
- Rollback operations
- Version tracking
"""

import asyncio
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone
import os

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import CurrentUser, get_current_user, require_role
from core.migration import (
    MongoToPostgresMigrator, 
    MigrationConfig,
    MigrationReconciliation,
    MigrationRollback,
    MigrationVersioning,
    MigrationVersion,
    ReconciliationReport
)
from core.schemas.base import APIResponse

router = APIRouter(prefix="/migration", tags=["Migration"])

# Store migration status
migration_status: Dict[str, Any] = {
    "is_running": False,
    "started_at": None,
    "completed_at": None,
    "current_entity": None,
    "progress": {},
    "report": None,
    "error": None,
    "version": None
}


def get_config() -> MigrationConfig:
    """Get migration configuration from environment"""
    return MigrationConfig(
        mongo_url=os.environ.get("MONGO_URL", "mongodb://localhost:27017"),
        mongo_db=os.environ.get("DB_NAME", "test_database"),
        postgres_url=os.environ.get("POSTGRES_URL", "postgresql://localhost/prohouzing"),
        batch_size=100,
        dry_run=False
    )


async def run_migration_task(org_id: UUID, dry_run: bool = False, notes: str = ""):
    """Background task for running migration"""
    global migration_status
    
    # Start version tracking
    version = MigrationVersioning.start_version(dry_run=dry_run, notes=notes)
    
    migration_status["is_running"] = True
    migration_status["started_at"] = datetime.now(timezone.utc).isoformat()
    migration_status["error"] = None
    migration_status["version"] = version.version
    
    config = get_config()
    config.dry_run = dry_run
    
    try:
        migrator = MongoToPostgresMigrator(config)
        
        try:
            # Run migration
            report = await migrator.run_full_migration(org_id)
            
            migration_status["report"] = report.to_dict()
            migration_status["completed_at"] = datetime.now(timezone.utc).isoformat()
            
            # Save report with version
            report.save(f"/app/backend/migration_report_v{version.version}.json")
            
            # Complete version tracking
            MigrationVersioning.complete_version(
                version=version.version,
                status="completed" if not dry_run else "dry_run_completed",
                source_counts={name: s.total_source for name, s in report.stats.items()},
                target_counts={name: s.total_migrated for name, s in report.stats.items()},
                errors=[str(e) for s in report.stats.values() for e in s.errors[:5]]
            )
            
        finally:
            await migrator.close()
            
    except Exception as e:
        migration_status["error"] = str(e)
        MigrationVersioning.complete_version(
            version=version.version,
            status="failed",
            errors=[str(e)]
        )
    finally:
        migration_status["is_running"] = False


@router.get("/status", response_model=APIResponse[Dict[str, Any]])
async def get_migration_status(
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """Get current migration status"""
    return APIResponse(
        success=True,
        data=migration_status
    )


@router.post("/start", response_model=APIResponse[Dict[str, str]])
async def start_migration(
    background_tasks: BackgroundTasks,
    dry_run: bool = Query(True, description="Run without actually inserting data (RECOMMENDED first)"),
    notes: str = Query("", description="Notes for this migration run"),
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """
    Start data migration (MongoDB → PostgreSQL).
    
    This is a long-running operation that runs in the background.
    Use GET /status to check progress.
    
    - dry_run: If true (default), validates data without inserting
    - notes: Optional notes for this migration version
    """
    global migration_status
    
    if migration_status["is_running"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Migration is already running"
        )
    
    # Reset status
    migration_status = {
        "is_running": False,
        "started_at": None,
        "completed_at": None,
        "current_entity": None,
        "progress": {},
        "report": None,
        "error": None,
        "version": None
    }
    
    # Start background task
    background_tasks.add_task(
        run_migration_task,
        org_id=current_user.org_id,
        dry_run=dry_run,
        notes=notes
    )
    
    return APIResponse(
        success=True,
        data={
            "message": "Migration started", 
            "dry_run": str(dry_run),
            "notes": notes
        },
        message="Migration started in background. Use GET /status to check progress."
    )


# ═══════════════════════════════════════════════════════════════════════════════
# RECONCILIATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/reconcile", response_model=APIResponse[Dict[str, Any]])
async def run_reconciliation(
    version: int = Query(None, description="Migration version to reconcile (default: latest)"),
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """
    Run reconciliation report.
    
    Compares:
    - Total records (Mongo vs PostgreSQL)
    - Financial values
    - Deals by stage
    
    Tolerance: 0.1% - Any variance above this = FAIL
    """
    config = get_config()
    
    try:
        recon = MigrationReconciliation(
            mongo_url=config.mongo_url,
            mongo_db=config.mongo_db,
            postgres_url=config.postgres_url
        )
        
        # Get version
        if version is None:
            latest = MigrationVersioning.get_latest()
            version = latest.version if latest else 1
        
        try:
            report = await recon.generate_reconciliation_report(
                org_id=current_user.org_id,
                migration_version=version
            )
            
            # Save report
            import json
            with open(f"/app/backend/reconciliation_v{version}.json", "w") as f:
                json.dump(report.model_dump(mode='json'), f, indent=2, default=str)
            
            return APIResponse(
                success=True,
                data=report.model_dump(mode='json'),
                message="PASSED ✅" if report.passed else f"FAILED ❌: {', '.join(report.failure_reasons)}"
            )
        finally:
            await recon.close()
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reconciliation failed: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# ROLLBACK
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/rollback", response_model=APIResponse[Dict[str, Any]])
async def rollback_migration(
    version: int = Query(None, description="Specific version to rollback (default: all)"),
    confirm: bool = Query(False, description="Must be true to execute rollback"),
    current_user: CurrentUser = Depends(require_role("super_admin"))
):
    """
    Rollback migration data.
    
    ⚠️ CAUTION: This is destructive!
    
    - Clears all migrated data from PostgreSQL
    - Resets sequences
    - Only super_admin can execute
    - Must confirm=true to execute
    """
    if not confirm:
        return APIResponse(
            success=False,
            data={"warning": "Rollback not executed. Set confirm=true to proceed."},
            message="Rollback requires confirmation"
        )
    
    config = get_config()
    
    try:
        rollback = MigrationRollback(postgres_url=config.postgres_url)
        
        try:
            # Clear data
            deleted_counts = rollback.clear_migrated_data(
                org_id=current_user.org_id,
                version=version
            )
            
            # Reset sequences
            rollback.reset_sequences()
            
            # Update version status
            if version:
                MigrationVersioning.complete_version(
                    version=version,
                    status="rolled_back"
                )
            
            return APIResponse(
                success=True,
                data={
                    "deleted_counts": deleted_counts,
                    "version_rolled_back": version,
                    "message": "Rollback completed successfully"
                }
            )
        finally:
            rollback.close()
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rollback failed: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# VERSIONING
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/versions", response_model=APIResponse[List[Dict[str, Any]]])
async def list_migration_versions(
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """List all migration versions"""
    versions = MigrationVersioning.load_versions()
    
    return APIResponse(
        success=True,
        data=[v.model_dump(mode='json') for v in versions]
    )


@router.get("/versions/{version}", response_model=APIResponse[Optional[Dict[str, Any]]])
async def get_migration_version(
    version: int,
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """Get specific migration version"""
    v = MigrationVersioning.get_version(version)
    
    if not v:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version} not found"
        )
    
    return APIResponse(
        success=True,
        data=v.model_dump(mode='json')
    )


@router.get("/versions/latest", response_model=APIResponse[Optional[Dict[str, Any]]])
async def get_latest_version(
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """Get latest migration version"""
    v = MigrationVersioning.get_latest()
    
    return APIResponse(
        success=True,
        data=v.model_dump(mode='json') if v else None
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/validate", response_model=APIResponse[Dict[str, Any]])
async def validate_migration(
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """
    Validate migrated data (legacy endpoint).
    
    Use /reconcile for detailed report.
    """
    config = get_config()
    
    try:
        migrator = MongoToPostgresMigrator(config)
        
        try:
            validation = await migrator.validate_migration(current_user.org_id)
            return APIResponse(
                success=True,
                data=validation
            )
        finally:
            await migrator.close()
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )


@router.get("/report", response_model=APIResponse[Optional[Dict[str, Any]]])
async def get_migration_report(
    version: int = Query(None, description="Specific version (default: latest)"),
    current_user: CurrentUser = Depends(require_role("admin", "super_admin"))
):
    """Get migration report"""
    import json
    
    if version is None:
        latest = MigrationVersioning.get_latest()
        version = latest.version if latest else 1
    
    filepath = f"/app/backend/migration_report_v{version}.json"
    
    try:
        with open(filepath, "r") as f:
            report = json.load(f)
        return APIResponse(
            success=True,
            data=report
        )
    except FileNotFoundError:
        # Try legacy path
        try:
            with open("/app/backend/migration_report.json", "r") as f:
                report = json.load(f)
            return APIResponse(
                success=True,
                data=report
            )
        except FileNotFoundError:
            return APIResponse(
                success=True,
                data=None,
                message="No migration report found"
            )
