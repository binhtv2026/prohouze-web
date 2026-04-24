"""
AI Insight Utilities
Prompt 18/20 - AI Decision Engine

Common utility functions for AI engines.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Any
import uuid


def iso_now() -> str:
    """Get current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def get_now_utc() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def parse_iso_date(date_str: str) -> Optional[datetime]:
    """Parse ISO date string to datetime."""
    if not date_str:
        return None
    try:
        # Handle various ISO formats
        if date_str.endswith('Z'):
            date_str = date_str[:-1] + '+00:00'
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def days_between(start: Optional[datetime], end: Optional[datetime]) -> int:
    """Calculate days between two dates."""
    if not start or not end:
        return 0
    diff = end - start
    return max(0, diff.days)


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix."""
    uid = str(uuid.uuid4())
    return f"{prefix}_{uid}" if prefix else uid


def get_score_level(score: int) -> str:
    """Get score level from numeric score."""
    if score >= 80:
        return "excellent"
    elif score >= 60:
        return "good"
    elif score >= 40:
        return "average"
    elif score >= 20:
        return "poor"
    else:
        return "critical"


def get_confidence_level(confidence: float) -> str:
    """Get confidence level from numeric confidence."""
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.5:
        return "medium"
    else:
        return "low"


def get_risk_level_from_score(risk_score: int) -> str:
    """Get risk level from risk score."""
    if risk_score >= 70:
        return "critical"
    elif risk_score >= 50:
        return "high"
    elif risk_score >= 30:
        return "medium"
    elif risk_score > 0:
        return "low"
    else:
        return "none"


def format_currency_vnd(amount: float) -> str:
    """Format amount as VND currency."""
    if amount >= 1_000_000_000:
        return f"{amount/1_000_000_000:.1f} tỷ"
    elif amount >= 1_000_000:
        return f"{amount/1_000_000:.0f} triệu"
    else:
        return f"{amount:,.0f} VND"


def safe_get(obj: Any, *keys, default: Any = None) -> Any:
    """Safely get nested value from dict."""
    result = obj
    for key in keys:
        if isinstance(result, dict):
            result = result.get(key)
        else:
            return default
        if result is None:
            return default
    return result
