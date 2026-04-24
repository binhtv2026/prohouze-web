"""
ProHouzing Core Base Model
Version: 1.0.0

Base class for all SQLAlchemy models with:
- UUID primary key
- Audit fields (created_at, updated_at, created_by, updated_by)
- Soft delete support
- Organization scope
"""

import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, event, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB, ARRAY as PG_ARRAY
from sqlalchemy.types import TypeDecorator, CHAR

from ..database import Base, IS_POSTGRES


# ═══════════════════════════════════════════════════════════════════════════════
# UUID TYPE (Cross-database compatible)
# ═══════════════════════════════════════════════════════════════════════════════

class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36).
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
        else:
            return str(value) if isinstance(value, uuid.UUID) else value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


# ═══════════════════════════════════════════════════════════════════════════════
# JSONB TYPE (Cross-database compatible)
# ═══════════════════════════════════════════════════════════════════════════════

class JSONB(TypeDecorator):
    """
    Platform-independent JSONB type.
    Uses PostgreSQL's JSONB, otherwise uses TEXT with JSON serialization.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        if isinstance(value, str):
            return json.loads(value)
        return value


# ═══════════════════════════════════════════════════════════════════════════════
# ARRAY TYPE (Cross-database compatible)
# ═══════════════════════════════════════════════════════════════════════════════

def ARRAY(item_type):
    """
    Platform-independent ARRAY type factory.
    Uses PostgreSQL's ARRAY, otherwise uses TEXT with JSON serialization.
    """
    if IS_POSTGRES:
        return PG_ARRAY(item_type)
    else:
        # Return a JSONB-like type for SQLite
        return JSONArray(item_type)


class JSONArray(TypeDecorator):
    """
    ARRAY type using JSON serialization for non-PostgreSQL databases.
    """
    impl = Text
    cache_ok = True

    def __init__(self, item_type=None):
        self.item_type = item_type
        super().__init__()

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, str):
            return json.loads(value)
        return value


def generate_uuid():
    """Generate a new UUID"""
    return uuid.uuid4()


def utc_now():
    """Get current UTC timestamp"""
    return datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════════════════════════════
# BASE MODEL MIXINS
# ═══════════════════════════════════════════════════════════════════════════════

class TimestampMixin:
    """Mixin for timestamp fields"""
    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )


class AuditMixin(TimestampMixin):
    """Mixin for audit fields (who created/updated)"""
    created_by = Column(GUID(), nullable=True)
    updated_by = Column(GUID(), nullable=True)


class SoftDeleteMixin:
    """Mixin for soft delete support"""
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    @property
    def is_deleted(self):
        return self.deleted_at is not None
    
    def soft_delete(self):
        self.deleted_at = utc_now()


class OrgScopeMixin:
    """Mixin for organization scope"""
    org_id = Column(
        GUID(),
        nullable=False
    )


# ═══════════════════════════════════════════════════════════════════════════════
# BASE MODEL CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

class CoreModel(Base, AuditMixin):
    """
    Base model for all core entities.
    Includes: id, created_at, updated_at, created_by, updated_by
    """
    __abstract__ = True
    
    id = Column(
        GUID(),
        primary_key=True,
        default=generate_uuid
    )
    
    def to_dict(self):
        """Convert model to dictionary"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, uuid.UUID):
                value = str(value)
            elif isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result


class OrgScopedModel(CoreModel, OrgScopeMixin):
    """
    Base model for organization-scoped entities.
    Includes: id, org_id, created_at, updated_at, created_by, updated_by
    """
    __abstract__ = True


class SoftDeleteModel(OrgScopedModel, SoftDeleteMixin):
    """
    Base model for entities with soft delete.
    Includes: id, org_id, created_at, updated_at, created_by, updated_by, deleted_at
    """
    __abstract__ = True


# ═══════════════════════════════════════════════════════════════════════════════
# STATUS MIXIN
# ═══════════════════════════════════════════════════════════════════════════════

class StatusMixin:
    """Mixin for entities with status field"""
    status = Column(String(50), nullable=False, default="active")


# ═══════════════════════════════════════════════════════════════════════════════
# CODE MIXIN (for entities with unique codes)
# ═══════════════════════════════════════════════════════════════════════════════

class CodeMixin:
    """Mixin for entities with unique code within org"""
    # Note: Unique constraint should be (org_id, code) - defined in model
    pass


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_code(prefix: str, sequence: int) -> str:
    """
    Generate a unique code with prefix and sequence.
    Example: generate_code("CUS", 123) -> "CUS-000123"
    """
    return f"{prefix}-{sequence:06d}"


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number to E.164 format.
    Example: "0901234567" -> "+84901234567"
    """
    if not phone:
        return phone
    
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Handle Vietnamese numbers
    if digits.startswith('84'):
        return f"+{digits}"
    elif digits.startswith('0'):
        return f"+84{digits[1:]}"
    elif len(digits) == 9:
        return f"+84{digits}"
    
    return f"+{digits}"


def normalize_email(email: str) -> str:
    """
    Normalize email to lowercase.
    """
    if not email:
        return email
    return email.lower().strip()
