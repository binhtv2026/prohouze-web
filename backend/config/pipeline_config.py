"""
ProHouzing Sales Pipeline Configuration
TASK 2 - SALES PIPELINE

Pipeline Stages (LOCKED):
1. lead_new
2. contacted  
3. interested
4. viewing
5. holding
6. booking
7. negotiating
8. closed_won
9. closed_lost
"""

from typing import Dict, List, Any
from enum import Enum


class PipelineStage(str, Enum):
    """Pipeline stages enum."""
    LEAD_NEW = "lead_new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    VIEWING = "viewing"
    HOLDING = "holding"
    BOOKING = "booking"
    NEGOTIATING = "negotiating"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


# Stage order (for validation)
STAGE_ORDER: List[str] = [
    PipelineStage.LEAD_NEW.value,
    PipelineStage.CONTACTED.value,
    PipelineStage.INTERESTED.value,
    PipelineStage.VIEWING.value,
    PipelineStage.HOLDING.value,
    PipelineStage.BOOKING.value,
    PipelineStage.NEGOTIATING.value,
    PipelineStage.CLOSED_WON.value,
    PipelineStage.CLOSED_LOST.value,
]


# Stage configuration
STAGE_CONFIG: Dict[str, Dict[str, Any]] = {
    PipelineStage.LEAD_NEW.value: {
        "name": "Lead mới",
        "name_en": "New Lead",
        "color": "#94a3b8",      # slate-400
        "bg_color": "#f1f5f9",   # slate-100
        "order": 1,
        "requires_product": False,
        "inventory_status": None,
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.CONTACTED.value: {
        "name": "Đã liên hệ",
        "name_en": "Contacted",
        "color": "#60a5fa",      # blue-400
        "bg_color": "#dbeafe",   # blue-100
        "order": 2,
        "requires_product": False,
        "inventory_status": None,
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.INTERESTED.value: {
        "name": "Quan tâm",
        "name_en": "Interested",
        "color": "#22c55e",      # green-500
        "bg_color": "#dcfce7",   # green-100
        "order": 3,
        "requires_product": False,
        "inventory_status": None,
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.VIEWING.value: {
        "name": "Xem sản phẩm",
        "name_en": "Viewing",
        "color": "#a855f7",      # purple-500
        "bg_color": "#f3e8ff",   # purple-100
        "order": 4,
        "requires_product": True,  # Must have product assigned
        "inventory_status": None,
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.HOLDING.value: {
        "name": "Giữ chỗ",
        "name_en": "Holding",
        "color": "#f59e0b",      # amber-500
        "bg_color": "#fef3c7",   # amber-100
        "order": 5,
        "requires_product": True,
        "inventory_status": "hold",  # MUST sync with inventory
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.BOOKING.value: {
        "name": "Booking",
        "name_en": "Booking",
        "color": "#3b82f6",      # blue-500
        "bg_color": "#dbeafe",   # blue-100
        "order": 6,
        "requires_product": True,
        "inventory_status": ["booking_pending", "booked"],  # MUST sync
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.NEGOTIATING.value: {
        "name": "Đàm phán",
        "name_en": "Negotiating",
        "color": "#06b6d4",      # cyan-500
        "bg_color": "#cffafe",   # cyan-100
        "order": 7,
        "requires_product": True,
        "inventory_status": ["booked", "reserved"],
        "is_active": True,
        "is_won": False,
        "is_lost": False,
    },
    PipelineStage.CLOSED_WON.value: {
        "name": "Chốt thành công",
        "name_en": "Closed Won",
        "color": "#16a34a",      # green-600
        "bg_color": "#bbf7d0",   # green-200
        "order": 8,
        "requires_product": True,
        "inventory_status": "sold",  # MUST be sold
        "is_active": False,
        "is_won": True,
        "is_lost": False,
    },
    PipelineStage.CLOSED_LOST.value: {
        "name": "Thất bại",
        "name_en": "Closed Lost",
        "color": "#dc2626",      # red-600
        "bg_color": "#fecaca",   # red-200
        "order": 9,
        "requires_product": False,
        "inventory_status": None,  # Product should be released
        "is_active": False,
        "is_won": False,
        "is_lost": True,
    },
}


# Valid stage transitions
# Key = current stage, Value = list of valid next stages
VALID_TRANSITIONS: Dict[str, List[str]] = {
    PipelineStage.LEAD_NEW.value: [
        PipelineStage.CONTACTED.value,
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.CONTACTED.value: [
        PipelineStage.INTERESTED.value,
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.INTERESTED.value: [
        PipelineStage.VIEWING.value,
        PipelineStage.CONTACTED.value,  # Can go back
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.VIEWING.value: [
        PipelineStage.HOLDING.value,
        PipelineStage.INTERESTED.value,  # Can go back
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.HOLDING.value: [
        PipelineStage.BOOKING.value,
        PipelineStage.VIEWING.value,  # Can go back (release hold)
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.BOOKING.value: [
        PipelineStage.NEGOTIATING.value,
        PipelineStage.HOLDING.value,  # Can go back (cancel booking)
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.NEGOTIATING.value: [
        PipelineStage.CLOSED_WON.value,
        PipelineStage.BOOKING.value,  # Can go back
        PipelineStage.CLOSED_LOST.value,
    ],
    PipelineStage.CLOSED_WON.value: [],  # Terminal state
    PipelineStage.CLOSED_LOST.value: [
        PipelineStage.LEAD_NEW.value,  # Can reopen
    ],
}


def get_stage_config(stage: str) -> Dict[str, Any]:
    """Get configuration for a stage."""
    return STAGE_CONFIG.get(stage, {})


def get_stage_order(stage: str) -> int:
    """Get order index of a stage."""
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return -1


def is_valid_transition(from_stage: str, to_stage: str) -> bool:
    """Check if transition is valid."""
    valid_next = VALID_TRANSITIONS.get(from_stage, [])
    return to_stage in valid_next


def get_valid_transitions(stage: str) -> List[str]:
    """Get list of valid next stages."""
    return VALID_TRANSITIONS.get(stage, [])


def stage_requires_product(stage: str) -> bool:
    """Check if stage requires a product."""
    config = STAGE_CONFIG.get(stage, {})
    return config.get("requires_product", False)


def get_expected_inventory_status(stage: str) -> Any:
    """Get expected inventory status for a stage."""
    config = STAGE_CONFIG.get(stage, {})
    return config.get("inventory_status")
