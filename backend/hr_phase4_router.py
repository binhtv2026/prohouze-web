"""
hr_phase4_router.py — B3 Backend
FastAPI router cho HR Phase 4: Career Path, Competition, Training Hub
Endpoints: Career progress, Badges, Competition leaderboard, Training enrollment
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, date
import uuid

router = APIRouter(prefix="/hr-dev", tags=["HR Development"])

# ─── DEMO DATA ────────────────────────────────────────────────────────────────
DEMO_CAREER_PROGRESS = [
    {
        "id": "cp-001", "user_id": "usr-001", "user_name": "Nguyễn Hoàng Nam",
        "track": "primary", "current_level": "senior_consultant",
        "criteria_met": [
            {"key": "deals_per_month", "required": 5, "current": 6, "met": True},
            {"key": "quarterly_revenue", "required": 5000000000, "current": 6200000000, "met": True},
            {"key": "training_level2", "required": True, "current": True, "met": True},
            {"key": "team_lead_exp", "required": True, "current": False, "met": False},
        ],
        "progress_pct": 75,
        "next_level": "team_leader",
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "cp-002", "user_id": "usr-002", "user_name": "Trần Thu Trang",
        "track": "primary", "current_level": "sales_consultant",
        "criteria_met": [
            {"key": "deals_per_month", "required": 3, "current": 3, "met": True},
            {"key": "quarterly_revenue", "required": 3000000000, "current": 3100000000, "met": True},
            {"key": "training_level1", "required": True, "current": False, "met": False},
            {"key": "nps", "required": 8.0, "current": 7.5, "met": False},
        ],
        "progress_pct": 50,
        "next_level": "senior_consultant",
        "updated_at": datetime.now().isoformat()
    }
]

DEMO_BADGES = {
    "usr-001": [
        {"id": "b-001", "badge": "on_fire", "icon": "🔥", "label": "On Fire", "earned_at": "2026-04-15"},
        {"id": "b-002", "badge": "speed_closer", "icon": "⚡", "label": "Speed Closer", "earned_at": "2026-04-10"},
        {"id": "b-003", "badge": "bullseye", "icon": "🎯", "label": "Bullseye", "earned_at": "2026-03-31"},
        {"id": "b-004", "badge": "rising_star", "icon": "🌟", "label": "Rising Star", "earned_at": "2026-03-01"},
    ],
    "usr-002": [
        {"id": "b-005", "badge": "on_fire", "icon": "🔥", "label": "On Fire", "earned_at": "2026-04-18"},
        {"id": "b-006", "badge": "rising_star", "icon": "🌟", "label": "Rising Star", "earned_at": "2026-04-01"},
    ]
}

DEMO_LEADERBOARD = {
    "week": [
        {"rank": 1, "user_id": "usr-001", "name": "Nguyễn Hoàng Nam", "role": "Senior Consultant", "deals": 4, "revenue": 4200000000, "progress_pct": 100},
        {"rank": 2, "user_id": "usr-002", "name": "Trần Thu Trang", "role": "Sales Consultant", "deals": 3, "revenue": 3100000000, "progress_pct": 74},
        {"rank": 3, "user_id": "usr-003", "name": "Lê Minh Khoa", "role": "Sales Consultant", "deals": 2, "revenue": 2400000000, "progress_pct": 57},
    ],
    "month": [
        {"rank": 1, "user_id": "usr-002", "name": "Trần Thu Trang", "role": "Sales Consultant", "deals": 12, "revenue": 18500000000, "progress_pct": 100},
        {"rank": 2, "user_id": "usr-001", "name": "Nguyễn Hoàng Nam", "role": "Senior Consultant", "deals": 10, "revenue": 15200000000, "progress_pct": 82},
        {"rank": 3, "user_id": "usr-003", "name": "Lê Minh Khoa", "role": "Sales Consultant", "deals": 9, "revenue": 12800000000, "progress_pct": 69},
    ],
}

DEMO_TRAINING_ENROLLMENT = {
    "usr-001": [
        {"course_id": "c1", "title": "Sứ mệnh & Tầm nhìn", "progress": 100, "completed_at": "2026-03-01"},
        {"course_id": "c2", "title": "Giá trị cốt lõi", "progress": 100, "completed_at": "2026-03-02"},
        {"course_id": "c3", "title": "Quy tắc ứng xử", "progress": 60, "completed_at": None},
    ]
}

# ─── CAREER PATH ─────────────────────────────────────────────────────────────
@router.get("/career-path/{user_id}")
async def get_career_progress(user_id: str):
    progress = next((cp for cp in DEMO_CAREER_PROGRESS if cp["user_id"] == user_id), None)
    if not progress:
        # Return default starting point
        return {
            "user_id": user_id,
            "track": "primary",
            "current_level": "sales_trainee",
            "criteria_met": [],
            "progress_pct": 0,
            "next_level": "sales_consultant",
        }
    return progress

@router.patch("/career-path/{user_id}/update")
async def update_career_progress(user_id: str, data: dict):
    progress = next((cp for cp in DEMO_CAREER_PROGRESS if cp["user_id"] == user_id), None)
    if not progress:
        raise HTTPException(404, "User không tồn tại")
    progress.update({**data, "updated_at": datetime.now().isoformat()})
    return progress

# ─── BADGES ──────────────────────────────────────────────────────────────────
@router.get("/badges/{user_id}")
async def get_user_badges(user_id: str):
    ALL_BADGES = [
        {"badge": "on_fire", "icon": "🔥", "label": "On Fire", "desc": "3 deal trong 1 tuần"},
        {"badge": "speed_closer", "icon": "⚡", "label": "Speed Closer", "desc": "Chốt deal trong 48h"},
        {"badge": "bullseye", "icon": "🎯", "label": "Bullseye", "desc": "Đạt 100% KPI tháng"},
        {"badge": "rising_star", "icon": "🌟", "label": "Rising Star", "desc": "Top 3 tuần đầu tiên"},
        {"badge": "diamond_deal", "icon": "💎", "label": "Diamond Deal", "desc": "Deal trên 5 tỷ"},
        {"badge": "eagle_eye", "icon": "🦅", "label": "Eagle Eye", "desc": "5 khách tiềm năng/tuần"},
        {"badge": "champion", "icon": "🏆", "label": "Champion", "desc": "Top 1 tháng"},
        {"badge": "king", "icon": "👑", "label": "King/Queen", "desc": "Top 1 cả năm"},
    ]
    earned_badges = DEMO_BADGES.get(user_id, [])
    earned_ids = {b["badge"] for b in earned_badges}
    return {
        "user_id": user_id,
        "earned": earned_badges,
        "all_badges": [
            {**b, "earned": b["badge"] in earned_ids,
             "earned_at": next((e["earned_at"] for e in earned_badges if e["badge"] == b["badge"]), None)}
            for b in ALL_BADGES
        ]
    }

@router.post("/badges/{user_id}/award")
async def award_badge(user_id: str, data: dict):
    badge_id = data.get("badge")
    if not badge_id:
        raise HTTPException(400, "badge là bắt buộc")
    if user_id not in DEMO_BADGES:
        DEMO_BADGES[user_id] = []
    # Check not already earned
    if any(b["badge"] == badge_id for b in DEMO_BADGES[user_id]):
        return {"message": "Badge đã có", "skipped": True}
    new_badge = {
        "id": f"b-{uuid.uuid4().hex[:6]}",
        "badge": badge_id,
        "earned_at": date.today().isoformat(),
        **data
    }
    DEMO_BADGES[user_id].append(new_badge)
    return {"message": "Trao badge thành công", "badge": new_badge}

# ─── COMPETITION LEADERBOARD ─────────────────────────────────────────────────
@router.get("/competition/leaderboard")
async def get_leaderboard(period: str = "month", track: Optional[str] = None):
    board = DEMO_LEADERBOARD.get(period, DEMO_LEADERBOARD["month"])
    if track:
        board = [b for b in board if b.get("track") == track]
    return {
        "period": period,
        "period_label": {"week": "Tuần này", "month": "Tháng này", "quarter": "Quý này", "half": "6 tháng", "year": "Năm nay"}.get(period, period),
        "total": len(board),
        "items": board,
        "rewards": {
            "week": "Voucher 500k",
            "month": "Thưởng 3 triệu",
            "quarter": "Thưởng 15 triệu",
            "half": "Thưởng 35 triệu",
            "year": "TOP PERFORMER + Xe máy",
        }.get(period, ""),
    }

@router.get("/competition/my-rank/{user_id}")
async def get_my_rank(user_id: str, period: str = "month"):
    board = DEMO_LEADERBOARD.get(period, [])
    my_entry = next((b for b in board if b["user_id"] == user_id), None)
    if not my_entry:
        return {"user_id": user_id, "period": period, "rank": None, "message": "Chưa có dữ liệu"}
    total = len(board)
    next_rank = my_entry["rank"] - 1 if my_entry["rank"] > 1 else None
    next_person = next((b for b in board if b["rank"] == next_rank), None) if next_rank else None
    return {
        **my_entry,
        "total_participants": total,
        "next_rank_person": next_person,
        "gap_to_next": (next_person["revenue"] - my_entry["revenue"]) if next_person else 0,
    }

# ─── TRAINING ENROLLMENT ─────────────────────────────────────────────────────
@router.get("/training/progress/{user_id}")
async def get_training_progress(user_id: str):
    enrollments = DEMO_TRAINING_ENROLLMENT.get(user_id, [])
    total_courses = 18
    completed = len([e for e in enrollments if e["progress"] == 100])
    in_progress = len([e for e in enrollments if 0 < e["progress"] < 100])
    return {
        "user_id": user_id,
        "total_courses": total_courses,
        "completed": completed,
        "in_progress": in_progress,
        "overall_pct": round(completed / total_courses * 100, 1),
        "enrollments": enrollments,
    }

@router.post("/training/enroll")
async def enroll_course(data: dict):
    user_id = data.get("user_id")
    course_id = data.get("course_id")
    if not user_id or not course_id:
        raise HTTPException(400, "user_id và course_id là bắt buộc")
    if user_id not in DEMO_TRAINING_ENROLLMENT:
        DEMO_TRAINING_ENROLLMENT[user_id] = []
    # Check not already enrolled
    if any(e["course_id"] == course_id for e in DEMO_TRAINING_ENROLLMENT[user_id]):
        return {"message": "Đã ghi danh rồi"}
    enrollment = {
        "course_id": course_id,
        "title": data.get("title", ""),
        "progress": 0,
        "enrolled_at": datetime.now().isoformat(),
        "completed_at": None,
    }
    DEMO_TRAINING_ENROLLMENT[user_id].append(enrollment)
    return {"message": "Ghi danh thành công", "enrollment": enrollment}

@router.patch("/training/progress-update")
async def update_course_progress(data: dict):
    user_id = data.get("user_id")
    course_id = data.get("course_id")
    progress = data.get("progress", 0)
    if user_id not in DEMO_TRAINING_ENROLLMENT:
        raise HTTPException(404, "User chưa ghi danh khóa nào")
    enrollment = next((e for e in DEMO_TRAINING_ENROLLMENT[user_id] if e["course_id"] == course_id), None)
    if not enrollment:
        raise HTTPException(404, "Chưa ghi danh khóa này")
    enrollment["progress"] = min(100, max(0, progress))
    if enrollment["progress"] == 100:
        enrollment["completed_at"] = datetime.now().isoformat()
    return enrollment
