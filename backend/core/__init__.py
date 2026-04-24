"""
ProHouzing Core Package
Version: 1.0.0

PostgreSQL-based Master Data Model for ProHouzing.

Modules:
- database: Database connection and session management
- enums: All enumeration types
- models: SQLAlchemy ORM models
- schemas: Pydantic DTOs for API
"""

from .database import (
    engine,
    SessionLocal,
    Base,
    get_db,
    init_db,
    get_db_info,
    IS_POSTGRES,
    IS_SQLITE,
)

from . import enums

__version__ = "1.0.0"

__all__ = [
    # Database
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "init_db",
    "get_db_info",
    "IS_POSTGRES",
    "IS_SQLITE",
]
