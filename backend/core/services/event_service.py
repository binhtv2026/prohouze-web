"""
ProHouzing Event Service - Central Event Management
Version: 2.0.0 (Prompt 2/18)

Central service for:
- Emitting domain events
- Generating activity stream items
- Recording entity change logs
- Idempotency handling
- Correlation tracking
"""

import hashlib
import uuid
from typing import Optional, Dict, Any, List, Union
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from ..models.event import DomainEvent
from ..models.events_v2 import (
    ActivityStreamItem, EntityChangeLog,
    ProcessingStatus, ActorType, SourceType, SeverityLevel, ChangeSource
)
from ..services.event_catalog import (
    EventCode, EventCategory, EVENT_DEFINITIONS, 
    get_event_definition, get_event_category, validate_event_code
)
from ..models.base import utc_now


class EventService:
    """
    Central Event Service for ProHouzing.
    
    All modules MUST use this service to emit events.
    Direct insertion into event tables is prohibited.
    """
    
    # ═══════════════════════════════════════════════════════════════════════════
    # IDEMPOTENCY KEY GENERATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    @staticmethod
    def generate_idempotency_key(
        event_code: str,
        aggregate_type: str,
        aggregate_id: UUID,
        payload_hash: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ) -> str:
        """
        Generate idempotency key to prevent duplicate events.
        
        Format: {event_code}:{aggregate_type}:{aggregate_id}:{payload_hash}:{timestamp_minute}
        """
        ts = timestamp or utc_now()
        ts_minute = ts.strftime("%Y%m%d%H%M")
        
        key_parts = [
            event_code,
            aggregate_type,
            str(aggregate_id),
            payload_hash or "default",
            ts_minute
        ]
        
        return hashlib.sha256(":".join(key_parts).encode()).hexdigest()[:50]
    
    @staticmethod
    def hash_payload(payload: Dict[str, Any]) -> str:
        """Generate hash of payload for idempotency."""
        import json
        payload_str = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.md5(payload_str.encode()).hexdigest()[:16]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CORRELATION ID
    # ═══════════════════════════════════════════════════════════════════════════
    
    @staticmethod
    def generate_correlation_id() -> str:
        """Generate a new correlation ID for tracking related events."""
        return f"corr_{uuid.uuid4().hex[:24]}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EMIT EVENT (Main Entry Point)
    # ═══════════════════════════════════════════════════════════════════════════
    
    def emit_event(
        self,
        db: Session,
        *,
        # Required
        event_code: Union[str, EventCode],
        org_id: UUID,
        aggregate_type: str,
        aggregate_id: UUID,
        payload: Dict[str, Any],
        # Actor
        actor_user_id: Optional[UUID] = None,
        actor_type: str = "user",
        actor_name: Optional[str] = None,
        # Source
        source_type: str = "api",
        source_ref_type: Optional[str] = None,
        source_ref_id: Optional[str] = None,
        # Correlation
        correlation_id: Optional[str] = None,
        causation_id: Optional[UUID] = None,
        parent_event_id: Optional[UUID] = None,
        # Visibility
        event_visibility: str = "business",
        # Options
        generate_activity: bool = True,
        skip_if_duplicate: bool = True,
        custom_idempotency_key: Optional[str] = None,
        # Entity display info (for activity)
        entity_code: Optional[str] = None,
        entity_name: Optional[str] = None,
        # Related entities for filtering
        related_customer_id: Optional[UUID] = None,
        related_deal_id: Optional[UUID] = None,
        related_product_id: Optional[UUID] = None,
        related_project_id: Optional[UUID] = None,
    ) -> Optional[DomainEvent]:
        """
        Emit a domain event.
        
        This is the main entry point for all event emission.
        
        Args:
            event_code: Canonical event code from EventCode enum
            org_id: Organization ID
            aggregate_type: Entity type (customer, lead, deal, etc.)
            aggregate_id: Entity ID
            payload: Event-specific data
            actor_user_id: User who triggered the event
            actor_type: user, system, api, webhook, scheduler, ai
            actor_name: Display name of actor
            source_type: manual, api, import, webhook, scheduler, workflow
            correlation_id: For linking related events
            generate_activity: Whether to create activity stream item
            skip_if_duplicate: Skip if idempotency key already exists
            
        Returns:
            DomainEvent if created, None if skipped
        """
        # Normalize event code
        code_str = event_code.value if isinstance(event_code, EventCode) else event_code
        
        # Validate event code
        if not validate_event_code(code_str):
            raise ValueError(f"Invalid event code: {code_str}")
        
        # Get event category
        category = get_event_category(code_str)
        
        # Generate idempotency key
        payload_hash = self.hash_payload(payload)
        idempotency_key = custom_idempotency_key or self.generate_idempotency_key(
            code_str, aggregate_type, aggregate_id, payload_hash
        )
        
        # Check for duplicate
        if skip_if_duplicate:
            existing = db.execute(
                select(DomainEvent).where(
                    DomainEvent.idempotency_key == idempotency_key
                )
            ).scalar_one_or_none()
            
            if existing:
                return None  # Skip duplicate
        
        # Get sequence number for this aggregate
        sequence_no = self._get_next_sequence(db, org_id, aggregate_type, aggregate_id)
        
        # Build timestamp
        now = utc_now()
        
        # Validate actor_user_id exists in users table (FK constraint)
        # If user doesn't exist in PostgreSQL, set to None to avoid FK violation
        validated_actor_user_id = None
        if actor_user_id:
            from ..models.user import User
            user_exists = db.execute(
                select(User.id).where(User.id == actor_user_id)
            ).scalar_one_or_none()
            if user_exists:
                validated_actor_user_id = actor_user_id
        
        # Create domain event (using existing DomainEvent model fields)
        domain_event = DomainEvent(
            org_id=org_id,
            idempotency_key=idempotency_key,
            event_code=code_str,
            event_version="1.0",
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            sequence_no=sequence_no,
            actor_user_id=validated_actor_user_id,
            actor_type=actor_type,
            correlation_id=correlation_id,
            causation_id=causation_id,
            payload=payload,
            occurred_at=now,
            processed_status="pending",
            created_by=validated_actor_user_id,
            updated_by=validated_actor_user_id,
            metadata_json={
                "event_category": category,
                "actor_name": actor_name,
                "source_type": source_type,
                "source_ref_type": source_ref_type,
                "source_ref_id": source_ref_id,
                "event_visibility": event_visibility,
                "original_actor_user_id": str(actor_user_id) if actor_user_id else None,
            }
        )
        
        db.add(domain_event)
        db.flush()  # Get ID without committing
        
        # Generate activity stream item if needed
        event_def = get_event_definition(code_str)
        should_generate = generate_activity and event_def and event_def.generate_activity
        
        if should_generate:
            self._create_activity_item(
                db,
                domain_event=domain_event,
                event_def=event_def,
                payload=payload,
                entity_code=entity_code,
                entity_name=entity_name,
                related_customer_id=related_customer_id,
                related_deal_id=related_deal_id,
                related_product_id=related_product_id,
                related_project_id=related_project_id,
            )
        
        return domain_event
    
    def _get_next_sequence(
        self,
        db: Session,
        org_id: UUID,
        aggregate_type: str,
        aggregate_id: UUID
    ) -> int:
        """Get next sequence number for aggregate."""
        from sqlalchemy import func
        
        result = db.execute(
            select(func.coalesce(func.max(DomainEvent.sequence_no), 0)).where(
                and_(
                    DomainEvent.org_id == org_id,
                    DomainEvent.aggregate_type == aggregate_type,
                    DomainEvent.aggregate_id == aggregate_id
                )
            )
        ).scalar()
        
        return (result or 0) + 1
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ACTIVITY STREAM
    # ═══════════════════════════════════════════════════════════════════════════
    
    def _create_activity_item(
        self,
        db: Session,
        *,
        domain_event: DomainEvent,
        event_def,
        payload: Dict[str, Any],
        entity_code: Optional[str] = None,
        entity_name: Optional[str] = None,
        related_customer_id: Optional[UUID] = None,
        related_deal_id: Optional[UUID] = None,
        related_product_id: Optional[UUID] = None,
        related_project_id: Optional[UUID] = None,
    ) -> ActivityStreamItem:
        """Create activity stream item from domain event."""
        
        # Build title and summary from templates
        title = self._render_template(event_def.title_template, payload)
        summary = self._render_template(event_def.summary_template, payload)
        
        # Get actor_name from metadata or payload
        metadata = domain_event.metadata_json or {}
        actor_name = metadata.get("actor_name") or payload.get("actor_name")
        
        activity = ActivityStreamItem(
            org_id=domain_event.org_id,
            event_id=domain_event.id,
            entity_type=domain_event.aggregate_type,
            entity_id=domain_event.aggregate_id,
            entity_code=entity_code,
            entity_name=entity_name or payload.get("entity_name"),
            actor_user_id=domain_event.actor_user_id,
            actor_name=actor_name,
            activity_code=domain_event.event_code,
            title=title,
            summary=summary,
            icon_code=event_def.icon_code,
            color_code=self._severity_to_color(event_def.severity),
            severity_level=event_def.severity,
            visibility_scope=event_def.visibility,
            happened_at=domain_event.occurred_at,
            related_customer_id=related_customer_id,
            related_deal_id=related_deal_id,
            related_product_id=related_product_id,
            related_project_id=related_project_id,
            metadata_json={"payload_excerpt": self._extract_excerpt(payload)},
            created_by=domain_event.actor_user_id,
            updated_by=domain_event.actor_user_id,
        )
        
        db.add(activity)
        return activity
    
    def _render_template(self, template: str, payload: Dict[str, Any]) -> str:
        """Render template with payload values."""
        try:
            # Use safe formatting that doesn't error on missing keys
            result = template
            for key, value in payload.items():
                placeholder = "{" + key + "}"
                if placeholder in result:
                    result = result.replace(placeholder, str(value) if value else "")
            # Clean up any remaining placeholders with empty values
            import re
            result = re.sub(r'\{[a-zA-Z_]+\}', '', result)
            # Clean up double spaces
            result = ' '.join(result.split())
            return result
        except Exception:
            return template
    
    def _severity_to_color(self, severity: str) -> str:
        """Map severity to UI color."""
        colors = {
            "info": "blue",
            "success": "green",
            "warning": "yellow",
            "error": "red",
            "critical": "red"
        }
        return colors.get(severity, "gray")
    
    def _extract_excerpt(self, payload: Dict[str, Any], max_keys: int = 5) -> Dict[str, Any]:
        """Extract key fields for activity metadata."""
        important_keys = ["entity_name", "old_value", "new_value", "amount", "stage", "status"]
        excerpt = {}
        
        for key in important_keys:
            if key in payload:
                value = payload[key]
                if isinstance(value, (str, int, float, bool)):
                    excerpt[key] = value
                elif isinstance(value, UUID):
                    excerpt[key] = str(value)
        
        return excerpt
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CHANGE LOG
    # ═══════════════════════════════════════════════════════════════════════════
    
    def log_field_change(
        self,
        db: Session,
        *,
        org_id: UUID,
        entity_type: str,
        entity_id: UUID,
        field_name: str,
        old_value: Any,
        new_value: Any,
        old_display_value: Optional[str] = None,
        new_display_value: Optional[str] = None,
        actor_user_id: Optional[UUID] = None,
        actor_name: Optional[str] = None,
        change_source: str = "user_action",
        correlation_id: Optional[str] = None,
        reason_code: Optional[str] = None,
        reason_note: Optional[str] = None,
    ) -> EntityChangeLog:
        """
        Log a field change for audit trail.
        
        Use this for tracking specific field changes (stage, status, owner, price).
        """
        # Validate actor_user_id exists in users table (FK constraint)
        validated_actor_user_id = None
        if actor_user_id:
            from ..models.user import User
            user_exists = db.execute(
                select(User.id).where(User.id == actor_user_id)
            ).scalar_one_or_none()
            if user_exists:
                validated_actor_user_id = actor_user_id
        
        change_log = EntityChangeLog(
            org_id=org_id,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_user_id=validated_actor_user_id,
            actor_name=actor_name,
            change_source=change_source,
            correlation_id=correlation_id,
            field_name=field_name,
            old_value_json={"value": old_value} if old_value is not None else None,
            new_value_json={"value": new_value} if new_value is not None else None,
            old_display_value=old_display_value or str(old_value) if old_value else None,
            new_display_value=new_display_value or str(new_value) if new_value else None,
            reason_code=reason_code,
            reason_note=reason_note,
            changed_at=utc_now(),
            created_by=validated_actor_user_id,
            updated_by=validated_actor_user_id,
        )
        
        db.add(change_log)
        return change_log
    
    def log_multiple_changes(
        self,
        db: Session,
        *,
        org_id: UUID,
        entity_type: str,
        entity_id: UUID,
        changes: List[Dict[str, Any]],
        actor_user_id: Optional[UUID] = None,
        actor_name: Optional[str] = None,
        change_source: str = "user_action",
        correlation_id: Optional[str] = None,
    ) -> List[EntityChangeLog]:
        """
        Log multiple field changes at once.
        
        changes: List of dicts with keys: field_name, old_value, new_value
        """
        logs = []
        for change in changes:
            log = self.log_field_change(
                db,
                org_id=org_id,
                entity_type=entity_type,
                entity_id=entity_id,
                field_name=change["field_name"],
                old_value=change.get("old_value"),
                new_value=change.get("new_value"),
                old_display_value=change.get("old_display_value"),
                new_display_value=change.get("new_display_value"),
                actor_user_id=actor_user_id,
                actor_name=actor_name,
                change_source=change_source,
                correlation_id=correlation_id,
            )
            logs.append(log)
        
        return logs
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUERY METHODS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def get_entity_timeline(
        self,
        db: Session,
        *,
        org_id: UUID,
        entity_type: str,
        entity_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[ActivityStreamItem], int]:
        """Get activity timeline for an entity."""
        from sqlalchemy import func
        
        query = select(ActivityStreamItem).where(
            and_(
                ActivityStreamItem.org_id == org_id,
                ActivityStreamItem.entity_type == entity_type,
                ActivityStreamItem.entity_id == entity_id,
            )
        ).order_by(ActivityStreamItem.happened_at.desc())
        
        count_query = select(func.count()).select_from(ActivityStreamItem).where(
            and_(
                ActivityStreamItem.org_id == org_id,
                ActivityStreamItem.entity_type == entity_type,
                ActivityStreamItem.entity_id == entity_id,
            )
        )
        
        total = db.execute(count_query).scalar() or 0
        
        result = db.execute(query.offset(skip).limit(limit))
        items = list(result.scalars().all())
        
        return items, total
    
    def get_customer_timeline(
        self,
        db: Session,
        *,
        org_id: UUID,
        customer_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[ActivityStreamItem], int]:
        """Get activity timeline related to a customer."""
        from sqlalchemy import func, or_
        
        query = select(ActivityStreamItem).where(
            and_(
                ActivityStreamItem.org_id == org_id,
                or_(
                    and_(
                        ActivityStreamItem.entity_type == "customer",
                        ActivityStreamItem.entity_id == customer_id
                    ),
                    ActivityStreamItem.related_customer_id == customer_id
                )
            )
        ).order_by(ActivityStreamItem.happened_at.desc())
        
        count_query = select(func.count()).select_from(ActivityStreamItem).where(
            and_(
                ActivityStreamItem.org_id == org_id,
                or_(
                    and_(
                        ActivityStreamItem.entity_type == "customer",
                        ActivityStreamItem.entity_id == customer_id
                    ),
                    ActivityStreamItem.related_customer_id == customer_id
                )
            )
        )
        
        total = db.execute(count_query).scalar() or 0
        
        result = db.execute(query.offset(skip).limit(limit))
        items = list(result.scalars().all())
        
        return items, total
    
    def get_deal_timeline(
        self,
        db: Session,
        *,
        org_id: UUID,
        deal_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[ActivityStreamItem], int]:
        """Get activity timeline for a deal."""
        from sqlalchemy import func, or_
        
        query = select(ActivityStreamItem).where(
            and_(
                ActivityStreamItem.org_id == org_id,
                or_(
                    and_(
                        ActivityStreamItem.entity_type == "deal",
                        ActivityStreamItem.entity_id == deal_id
                    ),
                    ActivityStreamItem.related_deal_id == deal_id
                )
            )
        ).order_by(ActivityStreamItem.happened_at.desc())
        
        count_query = select(func.count()).select_from(ActivityStreamItem).where(
            and_(
                ActivityStreamItem.org_id == org_id,
                or_(
                    and_(
                        ActivityStreamItem.entity_type == "deal",
                        ActivityStreamItem.entity_id == deal_id
                    ),
                    ActivityStreamItem.related_deal_id == deal_id
                )
            )
        )
        
        total = db.execute(count_query).scalar() or 0
        
        result = db.execute(query.offset(skip).limit(limit))
        items = list(result.scalars().all())
        
        return items, total
    
    def get_recent_activities(
        self,
        db: Session,
        *,
        org_id: UUID,
        limit: int = 20,
        activity_codes: Optional[List[str]] = None,
        entity_types: Optional[List[str]] = None,
    ) -> List[ActivityStreamItem]:
        """Get recent activities for dashboard."""
        query = select(ActivityStreamItem).where(
            ActivityStreamItem.org_id == org_id
        )
        
        if activity_codes:
            query = query.where(ActivityStreamItem.activity_code.in_(activity_codes))
        
        if entity_types:
            query = query.where(ActivityStreamItem.entity_type.in_(entity_types))
        
        query = query.order_by(ActivityStreamItem.happened_at.desc()).limit(limit)
        
        result = db.execute(query)
        return list(result.scalars().all())
    
    def get_entity_changes(
        self,
        db: Session,
        *,
        org_id: UUID,
        entity_type: str,
        entity_id: UUID,
        field_name: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[EntityChangeLog], int]:
        """Get change log for an entity."""
        from sqlalchemy import func
        
        filters = [
            EntityChangeLog.org_id == org_id,
            EntityChangeLog.entity_type == entity_type,
            EntityChangeLog.entity_id == entity_id,
        ]
        
        if field_name:
            filters.append(EntityChangeLog.field_name == field_name)
        
        query = select(EntityChangeLog).where(and_(*filters)).order_by(
            EntityChangeLog.changed_at.desc()
        )
        
        count_query = select(func.count()).select_from(EntityChangeLog).where(and_(*filters))
        
        total = db.execute(count_query).scalar() or 0
        
        result = db.execute(query.offset(skip).limit(limit))
        items = list(result.scalars().all())
        
        return items, total
    
    def get_domain_events(
        self,
        db: Session,
        *,
        org_id: UUID,
        aggregate_type: Optional[str] = None,
        aggregate_id: Optional[UUID] = None,
        event_code: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[List[DomainEvent], int]:
        """Get domain events with filtering."""
        from sqlalchemy import func
        
        filters = [DomainEvent.org_id == org_id]
        
        if aggregate_type:
            filters.append(DomainEvent.aggregate_type == aggregate_type)
        if aggregate_id:
            filters.append(DomainEvent.aggregate_id == aggregate_id)
        if event_code:
            filters.append(DomainEvent.event_code == event_code)
        
        query = select(DomainEvent).where(and_(*filters)).order_by(
            DomainEvent.occurred_at.desc()
        )
        
        count_query = select(func.count()).select_from(DomainEvent).where(and_(*filters))
        
        total = db.execute(count_query).scalar() or 0
        
        result = db.execute(query.offset(skip).limit(limit))
        items = list(result.scalars().all())
        
        return items, total


# Singleton instance
event_service = EventService()
