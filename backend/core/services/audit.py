"""
ProHouzing Audit Service
Version: 1.0.0

Automatic audit logging for all CRUD operations.
Logs to activity_logs table in PostgreSQL.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import select

from core.models.activity import ActivityLog
from core.enums import ActionCode


class AuditAction(str, Enum):
    """Audit action types"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SOFT_DELETE = "soft_delete"
    RESTORE = "restore"
    STATUS_CHANGE = "status_change"
    STAGE_CHANGE = "stage_change"
    ASSIGN = "assign"
    TRANSFER = "transfer"
    APPROVE = "approve"
    REJECT = "reject"
    CONVERT = "convert"
    LOCK = "lock"
    UNLOCK = "unlock"


class AuditService:
    """
    Service for recording audit logs.
    
    All CRUD operations should be logged for:
    - Compliance
    - Security
    - Debugging
    - User activity tracking
    """
    
    @staticmethod
    def log(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        action: AuditAction,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ActivityLog:
        """
        Record an audit log entry.
        
        Args:
            db: Database session
            org_id: Organization ID
            user_id: User performing the action
            action: Type of action (create, update, delete, etc.)
            entity_type: Type of entity (customer, lead, deal, etc.)
            entity_id: ID of the entity
            entity_code: Business code of the entity (optional)
            old_value: Previous state (for updates)
            new_value: New state (for creates/updates)
            description: Human-readable description
            ip_address: Client IP address
            user_agent: Client user agent
            metadata: Additional metadata
        
        Returns:
            Created ActivityLog record
        """
        # Build changes dict
        changes = {}
        if old_value:
            changes["old"] = old_value
        if new_value:
            changes["new"] = new_value
        
        # Auto-generate description if not provided
        if not description:
            description = f"{action.value.upper()} {entity_type} {entity_code or entity_id}"
        
        log_entry = ActivityLog(
            org_id=org_id,
            user_id=user_id,
            action_code=action.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            description=description,
            changes_json=changes if changes else None,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata,
            created_by=user_id
        )
        
        db.add(log_entry)
        # Note: Don't commit here - let caller commit with the main transaction
        
        return log_entry
    
    @staticmethod
    def log_create(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        entity_data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> ActivityLog:
        """Log a CREATE action"""
        return AuditService.log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=AuditAction.CREATE,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            new_value=entity_data,
            description=f"Created {entity_type}: {entity_code or entity_id}",
            **kwargs
        )
    
    @staticmethod
    def log_update(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        changed_fields: Optional[list] = None,
        **kwargs
    ) -> ActivityLog:
        """Log an UPDATE action"""
        description = f"Updated {entity_type}: {entity_code or entity_id}"
        if changed_fields:
            description += f" (fields: {', '.join(changed_fields)})"
        
        return AuditService.log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=AuditAction.UPDATE,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            old_value=old_value,
            new_value=new_value,
            description=description,
            **kwargs
        )
    
    @staticmethod
    def log_delete(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        soft: bool = True,
        **kwargs
    ) -> ActivityLog:
        """Log a DELETE action"""
        action = AuditAction.SOFT_DELETE if soft else AuditAction.DELETE
        return AuditService.log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            description=f"{'Soft deleted' if soft else 'Deleted'} {entity_type}: {entity_code or entity_id}",
            **kwargs
        )
    
    @staticmethod
    def log_restore(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        **kwargs
    ) -> ActivityLog:
        """Log a RESTORE action (undo soft delete)"""
        return AuditService.log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=AuditAction.RESTORE,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            description=f"Restored {entity_type}: {entity_code or entity_id}",
            **kwargs
        )
    
    @staticmethod
    def log_stage_change(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        old_stage: str = None,
        new_stage: str = None,
        reason: Optional[str] = None,
        **kwargs
    ) -> ActivityLog:
        """Log a STAGE_CHANGE action (for deals, leads)"""
        return AuditService.log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=AuditAction.STAGE_CHANGE,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            old_value={"stage": old_stage},
            new_value={"stage": new_stage, "reason": reason},
            description=f"Stage changed: {old_stage} → {new_stage}",
            **kwargs
        )
    
    @staticmethod
    def log_assign(
        db: Session,
        org_id: UUID,
        user_id: UUID,
        entity_type: str,
        entity_id: UUID,
        entity_code: Optional[str] = None,
        assigned_to_user_id: Optional[UUID] = None,
        assigned_to_unit_id: Optional[UUID] = None,
        previous_owner_id: Optional[UUID] = None,
        reason: Optional[str] = None,
        **kwargs
    ) -> ActivityLog:
        """Log an ASSIGN action"""
        return AuditService.log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=AuditAction.ASSIGN,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            old_value={"owner_user_id": str(previous_owner_id) if previous_owner_id else None},
            new_value={
                "owner_user_id": str(assigned_to_user_id) if assigned_to_user_id else None,
                "owner_unit_id": str(assigned_to_unit_id) if assigned_to_unit_id else None,
                "reason": reason
            },
            description=f"Assigned {entity_type} to user/unit",
            **kwargs
        )
    
    @staticmethod
    def get_entity_history(
        db: Session,
        org_id: UUID,
        entity_type: str,
        entity_id: UUID,
        limit: int = 100
    ) -> list:
        """Get audit history for an entity"""
        query = select(ActivityLog).where(
            ActivityLog.org_id == org_id,
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id
        ).order_by(ActivityLog.created_at.desc()).limit(limit)
        
        result = db.execute(query)
        return list(result.scalars().all())


# Singleton instance
audit_service = AuditService()
