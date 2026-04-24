"""
Event Contract - Pydantic-based Business Events
Prompt 19.5 - Hardening Automation Engine

All events MUST follow this contract:
- Versioned schema
- Idempotency key
- Correlation ID for tracing
- Actor information
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid
import hashlib


# ==================== EVENT ACTOR ====================

class ActorType(str, Enum):
    SYSTEM = "system"
    USER = "user"
    AUTOMATION = "automation"
    SCHEDULER = "scheduler"
    WEBHOOK = "webhook"
    API = "api"


class EventActor(BaseModel):
    """Who/what triggered the event."""
    actor_type: ActorType = ActorType.SYSTEM
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    user_name: Optional[str] = None
    
    # For automation-triggered events
    source_rule_id: Optional[str] = None
    source_execution_id: Optional[str] = None
    
    class Config:
        use_enum_values = True


# ==================== EVENT ENTITY ====================

class EventEntity(BaseModel):
    """The entity that the event is about."""
    entity_type: str  # leads, deals, bookings, contracts, etc.
    entity_id: str
    
    # Optional: snapshot of key fields at event time
    snapshot: Optional[Dict[str, Any]] = None


# ==================== EVENT METADATA ====================

class EventMetadata(BaseModel):
    """Metadata for tracing and idempotency."""
    
    # REQUIRED: Correlation ID for tracing entire flow
    correlation_id: str = Field(default_factory=lambda: f"corr_{uuid.uuid4().hex[:12]}")
    
    # REQUIRED: Idempotency key to prevent duplicate processing
    idempotency_key: str = ""
    
    # Source tracking
    source: str = "direct"  # direct, automation, webhook, import, scheduler
    source_event_id: Optional[str] = None  # If triggered by another event
    
    # Chain tracking (for anti-loop)
    chain_depth: int = 0
    chain_rule_ids: List[str] = Field(default_factory=list)
    
    # Timing
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Environment
    environment: str = "production"  # production, staging, test
    
    @validator("idempotency_key", pre=True, always=True)
    def generate_idempotency_key(cls, v, values):
        if v:
            return v
        # Auto-generate if not provided
        return f"idem_{uuid.uuid4().hex[:16]}"


# ==================== BUSINESS EVENT CONTRACT ====================

class BusinessEventContract(BaseModel):
    """
    Canonical Business Event Contract.
    
    ALL events in the system MUST use this contract.
    No raw dict events allowed.
    
    Features:
    - Versioned schema
    - Idempotency key
    - Correlation ID for full trace
    - Actor information
    - Entity snapshot
    """
    
    # Identity
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    event_type: str  # e.g., "lead.created", "deal.stage_changed"
    event_version: str = "v1"  # Schema version
    
    # Actor - Who triggered this
    actor: EventActor = Field(default_factory=EventActor)
    
    # Entity - What this event is about
    entity: EventEntity
    
    # Payload - Event-specific data
    payload: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata - Tracing & idempotency
    metadata: EventMetadata = Field(default_factory=EventMetadata)
    
    # Timestamp
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def generate_idempotency_key(self) -> str:
        """
        Generate deterministic idempotency key based on event content.
        Same event content = same key = dedupe.
        """
        content = f"{self.event_type}:{self.entity.entity_type}:{self.entity.entity_id}:{self.timestamp.isoformat()[:19]}"
        return f"idem_{hashlib.md5(content.encode()).hexdigest()[:16]}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for storage."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "event_version": self.event_version,
            "actor": self.actor.dict(),
            "entity": self.entity.dict(),
            "payload": self.payload,
            "metadata": {
                **self.metadata.dict(),
                "created_at": self.metadata.created_at.isoformat()
            },
            "timestamp": self.timestamp.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BusinessEventContract":
        """Create from dict."""
        # Parse metadata
        metadata_data = data.get("metadata", {})
        if isinstance(metadata_data.get("created_at"), str):
            metadata_data["created_at"] = datetime.fromisoformat(
                metadata_data["created_at"].replace("Z", "+00:00")
            )
        
        # Parse timestamp
        timestamp = data.get("timestamp")
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        
        return cls(
            event_id=data.get("event_id", ""),
            event_type=data.get("event_type", ""),
            event_version=data.get("event_version", "v1"),
            actor=EventActor(**data.get("actor", {})),
            entity=EventEntity(**data.get("entity", {})),
            payload=data.get("payload", {}),
            metadata=EventMetadata(**metadata_data),
            timestamp=timestamp or datetime.now(timezone.utc)
        )
    
    def is_from_automation(self) -> bool:
        """Check if this event was triggered by automation."""
        return (
            self.actor.actor_type == ActorType.AUTOMATION or
            self.metadata.source == "automation"
        )
    
    def get_source_rule_id(self) -> Optional[str]:
        """Get the rule that triggered this event (if any)."""
        return self.actor.source_rule_id
    
    def increment_chain(self, rule_id: str) -> "BusinessEventContract":
        """Create a child event with incremented chain depth."""
        new_metadata = EventMetadata(
            correlation_id=self.metadata.correlation_id,
            source="automation",
            source_event_id=self.event_id,
            chain_depth=self.metadata.chain_depth + 1,
            chain_rule_ids=[*self.metadata.chain_rule_ids, rule_id]
        )
        
        return BusinessEventContract(
            event_id=f"evt_{uuid.uuid4().hex[:12]}",
            event_type=self.event_type,
            event_version=self.event_version,
            actor=EventActor(
                actor_type=ActorType.AUTOMATION,
                source_rule_id=rule_id
            ),
            entity=self.entity,
            payload=self.payload,
            metadata=new_metadata
        )


# ==================== EVENT BUILDER ====================

class EventBuilder:
    """
    Builder pattern for creating events.
    Ensures all required fields are set.
    """
    
    def __init__(self, event_type: str):
        self._event_type = event_type
        self._entity_type: str = ""
        self._entity_id: str = ""
        self._payload: Dict[str, Any] = {}
        self._actor = EventActor()
        self._correlation_id: Optional[str] = None
        self._source: str = "direct"
        self._snapshot: Optional[Dict[str, Any]] = None
    
    def entity(self, entity_type: str, entity_id: str) -> "EventBuilder":
        self._entity_type = entity_type
        self._entity_id = entity_id
        return self
    
    def payload(self, data: Dict[str, Any]) -> "EventBuilder":
        self._payload = data
        return self
    
    def by_user(self, user_id: str, role: str = None, name: str = None) -> "EventBuilder":
        self._actor = EventActor(
            actor_type=ActorType.USER,
            user_id=user_id,
            user_role=role,
            user_name=name
        )
        return self
    
    def by_system(self) -> "EventBuilder":
        self._actor = EventActor(actor_type=ActorType.SYSTEM)
        return self
    
    def by_automation(self, rule_id: str, execution_id: str = None) -> "EventBuilder":
        self._actor = EventActor(
            actor_type=ActorType.AUTOMATION,
            source_rule_id=rule_id,
            source_execution_id=execution_id
        )
        self._source = "automation"
        return self
    
    def correlation(self, correlation_id: str) -> "EventBuilder":
        self._correlation_id = correlation_id
        return self
    
    def source(self, source: str) -> "EventBuilder":
        self._source = source
        return self
    
    def snapshot(self, data: Dict[str, Any]) -> "EventBuilder":
        self._snapshot = data
        return self
    
    def build(self) -> BusinessEventContract:
        """Build and validate the event."""
        if not self._entity_type or not self._entity_id:
            raise ValueError("Entity type and ID are required")
        
        metadata = EventMetadata(
            correlation_id=self._correlation_id or f"corr_{uuid.uuid4().hex[:12]}",
            source=self._source
        )
        
        entity = EventEntity(
            entity_type=self._entity_type,
            entity_id=self._entity_id,
            snapshot=self._snapshot
        )
        
        return BusinessEventContract(
            event_type=self._event_type,
            actor=self._actor,
            entity=entity,
            payload=self._payload,
            metadata=metadata
        )


# ==================== HELPER FUNCTIONS ====================

def create_event(
    event_type: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any] = None,
    user_id: str = None,
    user_role: str = None,
    correlation_id: str = None,
    source: str = "direct"
) -> BusinessEventContract:
    """
    Quick helper to create a BusinessEventContract.
    
    Example:
        event = create_event(
            "lead.created",
            "leads",
            lead_id,
            {"source": "website"},
            user_id=current_user["id"],
            user_role=current_user["role"]
        )
    """
    builder = EventBuilder(event_type).entity(entity_type, entity_id)
    
    if payload:
        builder.payload(payload)
    
    if user_id:
        builder.by_user(user_id, user_role)
    else:
        builder.by_system()
    
    if correlation_id:
        builder.correlation(correlation_id)
    
    builder.source(source)
    
    return builder.build()
