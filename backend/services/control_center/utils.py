"""
Control Center Utilities
Prompt 17/20 - Executive Control Center

Shared helper functions for Control Center engines.
"""

from typing import List, Dict, Any
from datetime import datetime, timezone


def group_by(items: List[Dict], key: str) -> Dict[str, int]:
    """Group items by key and count occurrences."""
    result = {}
    for item in items:
        val = item.get(key, "Unknown")
        if val is None:
            val = "Unknown"
        result[val] = result.get(val, 0) + 1
    return result


def get_now_utc() -> datetime:
    """Get current datetime in UTC."""
    return datetime.now(timezone.utc)


def iso_now() -> str:
    """Get current datetime as ISO string."""
    return get_now_utc().isoformat()


def parse_iso_date(date_str: str) -> datetime:
    """Parse ISO date string to datetime."""
    if not date_str:
        return get_now_utc()
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return get_now_utc()


def days_between(date1: datetime, date2: datetime) -> int:
    """Calculate days between two dates."""
    return abs((date2 - date1).days)


def calculate_percentage(numerator: int, denominator: int, decimals: int = 1) -> float:
    """Calculate percentage safely."""
    if denominator == 0:
        return 0.0
    return round((numerator / denominator * 100), decimals)


def determine_severity(count: int, thresholds: Dict[str, int]) -> str:
    """
    Determine severity based on count and thresholds.
    
    Args:
        count: The count to evaluate
        thresholds: Dict with 'critical', 'high', 'medium' keys
    
    Returns:
        Severity string: 'critical', 'high', 'medium', or 'normal'
    """
    if count >= thresholds.get("critical", 100):
        return "critical"
    if count >= thresholds.get("high", 10):
        return "high"
    if count >= thresholds.get("medium", 1):
        return "medium"
    return "normal"


def determine_health_grade(score: float) -> tuple:
    """
    Determine grade and status from health score.
    
    Args:
        score: Health score 0-100
    
    Returns:
        Tuple of (grade, status)
    """
    if score >= 80:
        return "A", "excellent"
    elif score >= 70:
        return "B", "healthy"
    elif score >= 60:
        return "C", "fair"
    elif score >= 50:
        return "D", "warning"
    else:
        return "F", "critical"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers, returning default if denominator is 0."""
    if denominator == 0:
        return default
    return numerator / denominator


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


def format_currency(amount: float) -> str:
    """Format amount as currency string."""
    return f"{amount:,.0f}d"


def truncate_id(id_str: str, length: int = 8) -> str:
    """Truncate ID string for display."""
    if not id_str:
        return "N/A"
    return id_str[:length] if len(id_str) > length else id_str


def merge_dicts(*dicts: Dict) -> Dict:
    """Merge multiple dictionaries."""
    result = {}
    for d in dicts:
        if d:
            result.update(d)
    return result


def filter_by_severity(items: List[Dict], severities: List[str]) -> List[Dict]:
    """Filter items by severity levels."""
    return [item for item in items if item.get("severity") in severities]


def sort_by_priority(items: List[Dict], desc: bool = True) -> List[Dict]:
    """Sort items by priority_score."""
    return sorted(items, key=lambda x: x.get("priority_score", 0), reverse=desc)


def sort_by_severity(items: List[Dict]) -> List[Dict]:
    """Sort items by severity (critical first)."""
    severity_order = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3,
        "info": 4,
        "normal": 5
    }
    return sorted(items, key=lambda x: severity_order.get(x.get("severity", "normal"), 5))


def build_date_query(field: str, since: datetime) -> Dict[str, Any]:
    """Build a MongoDB date query."""
    return {field: {"$gte": since.isoformat()}}


def build_exclude_stages_query(field: str, stages: List[str]) -> Dict[str, Any]:
    """Build a MongoDB query to exclude certain stages."""
    return {field: {"$nin": stages}}


CLOSED_STAGES = ["completed", "lost", "won", "converted", "closed_won", "closed_lost", "cancelled"]
ACTIVE_TASK_STATUSES = ["pending", "in_progress"]
PENDING_CONTRACT_STATUSES = ["pending_review", "pending_approval"]
