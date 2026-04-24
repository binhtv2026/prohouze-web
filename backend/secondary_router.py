"""
secondary_router.py — B1 Backend
FastAPI router cho Module Thứ cấp (Secondary Sales)
Endpoints: Listings, Deals, Định giá, Sang nhượng
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
import uuid
import json

router = APIRouter(prefix="/secondary", tags=["Secondary Sales"])

# ─── MODELS inline (SQLAlchemy-free demo schema) ─────────────────────────────
# Production: dùng Supabase tables
DEMO_LISTINGS = [
    {
        "id": "lst-001", "code": "TC-VIN-2024-001",
        "project": "Vinhomes Central Park", "block": "P3", "floor": 18, "unit": "18.02",
        "area": 65.4, "bedrooms": 2, "direction": "Đông Nam",
        "original_price": 4200000000, "listing_price": 3850000000,
        "status": "active", "agent_id": "usr-001", "agent_name": "Nguyễn Hoàng Nam",
        "views": 47, "inquiries": 8,
        "images": [], "legal_status": "sổ hồng",
        "created_at": "2026-03-15T09:00:00", "updated_at": "2026-04-10T14:30:00"
    },
    {
        "id": "lst-002", "code": "TC-MAS-2024-008",
        "project": "Masteri Thảo Điền", "block": "T1", "floor": 12, "unit": "12.07",
        "area": 72.1, "bedrooms": 2, "direction": "Tây Nam",
        "original_price": 5100000000, "listing_price": 4750000000,
        "status": "negotiating", "agent_id": "usr-002", "agent_name": "Trần Thu Trang",
        "views": 83, "inquiries": 14,
        "images": [], "legal_status": "sổ hồng",
        "created_at": "2026-02-20T10:00:00", "updated_at": "2026-04-18T09:00:00"
    },
    {
        "id": "lst-003", "code": "TC-SUM-2024-015",
        "project": "Sunwah Pearl", "block": "A", "floor": 22, "unit": "22.10",
        "area": 88.5, "bedrooms": 3, "direction": "Đông",
        "original_price": 8500000000, "listing_price": 7900000000,
        "status": "sold", "agent_id": "usr-001", "agent_name": "Nguyễn Hoàng Nam",
        "views": 124, "inquiries": 22,
        "images": [], "legal_status": "sổ hồng",
        "created_at": "2026-01-10T08:00:00", "updated_at": "2026-04-05T16:00:00"
    },
]

DEMO_DEALS = [
    {
        "id": "deal-001", "listing_id": "lst-001",
        "project": "Vinhomes Central Park 18.02",
        "buyer_name": "Nguyễn Minh Hào", "buyer_phone": "0901234567",
        "seller_name": "Trần Văn Bình", "seller_phone": "0987654321",
        "agreed_price": 3750000000,
        "stage": "negotiation",
        "commission_pct": 1.5, "commission_value": 56250000,
        "agent_id": "usr-001", "agent_name": "Nguyễn Hoàng Nam",
        "created_at": "2026-04-10T09:00:00", "expected_close": "2026-05-15",
    },
    {
        "id": "deal-002", "listing_id": "lst-002",
        "project": "Masteri Thảo Điền 12.07",
        "buyer_name": "Phạm Thị Lan", "buyer_phone": "0923456789",
        "seller_name": "Lê Văn Hùng", "seller_phone": "0966778899",
        "agreed_price": 4600000000,
        "stage": "legal_check",
        "commission_pct": 1.5, "commission_value": 69000000,
        "agent_id": "usr-002", "agent_name": "Trần Thu Trang",
        "created_at": "2026-03-25T10:00:00", "expected_close": "2026-04-30",
    },
]

# ─── LISTINGS ─────────────────────────────────────────────────────────────────
@router.get("/listings")
async def get_listings(
    status: Optional[str] = None,
    project: Optional[str] = None,
    agent_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Danh sách tin đăng thứ cấp"""
    listings = DEMO_LISTINGS
    if status:
        listings = [l for l in listings if l["status"] == status]
    if project:
        listings = [l for l in listings if project.lower() in l["project"].lower()]
    if agent_id:
        listings = [l for l in listings if l["agent_id"] == agent_id]

    return {
        "total": len(listings),
        "items": listings[skip : skip + limit],
        "stats": {
            "active": len([l for l in DEMO_LISTINGS if l["status"] == "active"]),
            "negotiating": len([l for l in DEMO_LISTINGS if l["status"] == "negotiating"]),
            "sold": len([l for l in DEMO_LISTINGS if l["status"] == "sold"]),
            "total_value": sum(l["listing_price"] for l in DEMO_LISTINGS),
        }
    }

@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = next((l for l in DEMO_LISTINGS if l["id"] == listing_id), None)
    if not listing:
        raise HTTPException(404, detail="Không tìm thấy tin đăng")
    return listing

@router.post("/listings")
async def create_listing(data: dict):
    new_listing = {
        "id": f"lst-{uuid.uuid4().hex[:6]}",
        "code": f"TC-NEW-{datetime.now().strftime('%Y%m%d-%H%M')}",
        "status": "active",
        "views": 0, "inquiries": 0,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        **data
    }
    DEMO_LISTINGS.append(new_listing)
    return new_listing

@router.patch("/listings/{listing_id}")
async def update_listing(listing_id: str, data: dict):
    listing = next((l for l in DEMO_LISTINGS if l["id"] == listing_id), None)
    if not listing:
        raise HTTPException(404, detail="Không tìm thấy")
    listing.update({**data, "updated_at": datetime.now().isoformat()})
    return listing

# ─── VALUATION ────────────────────────────────────────────────────────────────
@router.post("/valuation/estimate")
async def estimate_value(data: dict):
    """AI-ready định giá thứ cấp (demo: rule-based)"""
    project = data.get("project", "")
    area = float(data.get("area", 60))
    floor = int(data.get("floor", 10))
    direction = data.get("direction", "")

    # Base price per m2 by project (demo)
    BASE_PRICES = {
        "vinhomes": 65_000_000,
        "masteri": 72_000_000,
        "sunwah": 96_000_000,
        "default": 55_000_000,
    }
    key = next((k for k in BASE_PRICES if k in project.lower()), "default")
    base_m2 = BASE_PRICES[key]

    # Floor bonus: +0.3% per floor above 5
    floor_bonus = max(0, (floor - 5) * 0.003)
    # Direction bonus
    dir_bonus = 0.02 if "Đông" in direction else -0.01 if "Tây" in direction else 0

    unit_price = base_m2 * (1 + floor_bonus + dir_bonus)
    estimated = unit_price * area

    return {
        "estimated_price": round(estimated, -6),  # round to nearest million
        "price_per_m2": round(unit_price, -3),
        "range_low": round(estimated * 0.93, -6),
        "range_high": round(estimated * 1.07, -6),
        "confidence": 85,
        "comparable_sales": [
            {"unit": "Similar floor", "price": round(estimated * 0.97, -6), "date": "2026-03"},
            {"unit": "Similar size", "price": round(estimated * 1.02, -6), "date": "2026-02"},
        ],
        "market_trend": "tăng nhẹ +2.1%/quý",
    }

# ─── DEALS ────────────────────────────────────────────────────────────────────
@router.get("/deals")
async def get_deals(stage: Optional[str] = None, agent_id: Optional[str] = None):
    deals = DEMO_DEALS
    if stage:
        deals = [d for d in deals if d["stage"] == stage]
    if agent_id:
        deals = [d for d in deals if d["agent_id"] == agent_id]
    return {"total": len(deals), "items": deals}

@router.post("/deals")
async def create_deal(data: dict):
    new_deal = {
        "id": f"deal-{uuid.uuid4().hex[:6]}",
        "stage": "initial",
        "created_at": datetime.now().isoformat(),
        **data
    }
    DEMO_DEALS.append(new_deal)
    return new_deal

@router.patch("/deals/{deal_id}/stage")
async def update_deal_stage(deal_id: str, data: dict):
    STAGES = ["initial", "site_visit", "negotiation", "legal_check", "deposit", "completed"]
    deal = next((d for d in DEMO_DEALS if d["id"] == deal_id), None)
    if not deal:
        raise HTTPException(404, "Deal không tồn tại")
    new_stage = data.get("stage")
    if new_stage not in STAGES:
        raise HTTPException(400, f"Stage không hợp lệ. Dùng: {STAGES}")
    deal["stage"] = new_stage
    return deal

# ─── STATS ────────────────────────────────────────────────────────────────────
@router.get("/dashboard/stats")
async def get_dashboard_stats():
    return {
        "listings": {
            "total": len(DEMO_LISTINGS),
            "active": len([l for l in DEMO_LISTINGS if l["status"] == "active"]),
            "sold_this_month": 1,
            "total_value": sum(l["listing_price"] for l in DEMO_LISTINGS),
        },
        "deals": {
            "total": len(DEMO_DEALS),
            "closing_soon": 1,
            "commission_pipeline": sum(d["commission_value"] for d in DEMO_DEALS),
        },
        "kpi": {
            "monthly_target": 3,
            "monthly_achieved": 1,
            "quarterly_revenue": 8350000000,
        }
    }
