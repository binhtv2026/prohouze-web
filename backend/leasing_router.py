"""
leasing_router.py — B2 Backend
FastAPI router cho Module Cho thuê (Leasing)
Endpoints: Assets, Contracts, Maintenance, Invoices, Payments
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional, List
from datetime import datetime, date, timedelta
import uuid
import calendar

router = APIRouter(prefix="/leasing", tags=["Leasing"])

# ─── DEMO DATA ────────────────────────────────────────────────────────────────
DEMO_ASSETS = [
    {"id": "ast-001", "code": "VIN-P7-22.04", "project": "Vinhomes Central Park", "block": "P7", "unit": "22.04", "area": 65.5, "bedrooms": 2, "status": "rented", "monthly_rent": 18000000, "agent_id": "usr-001"},
    {"id": "ast-002", "code": "MAS-T2-10.08", "project": "Masteri Thảo Điền", "block": "T2", "unit": "10.08", "area": 72.0, "bedrooms": 2, "status": "available", "monthly_rent": 22000000, "agent_id": "usr-002"},
    {"id": "ast-003", "code": "GAT-A-08.12", "project": "Gateway Thảo Điền", "block": "A", "unit": "08.12", "area": 88.5, "bedrooms": 3, "status": "rented", "monthly_rent": 28000000, "agent_id": "usr-001"},
    {"id": "ast-004", "code": "SUN-B-15.06", "project": "Sunwah Pearl", "block": "B", "unit": "15.06", "area": 55.0, "bedrooms": 1, "status": "maintenance", "monthly_rent": 15000000, "agent_id": "usr-003"},
]

DEMO_CONTRACTS = [
    {"id": "lc-001", "asset_id": "ast-001", "asset_code": "VIN-P7-22.04", "tenant_name": "Nguyễn Văn Phúc", "tenant_phone": "0901112233", "monthly_rent": 18000000, "deposit": 36000000, "start_date": "2025-10-01", "end_date": "2026-09-30", "status": "active", "payment_date": 5, "agent_id": "usr-001"},
    {"id": "lc-002", "asset_id": "ast-003", "asset_code": "GAT-A-08.12", "tenant_name": "Trần Thị Mai", "tenant_phone": "0912345678", "monthly_rent": 28000000, "deposit": 56000000, "start_date": "2025-07-01", "end_date": "2026-06-30", "status": "expiring_soon", "payment_date": 1, "agent_id": "usr-001"},
    {"id": "lc-003", "asset_id": "ast-005", "asset_code": "VIN-L1-05.02", "tenant_name": "Lê Hoàng Anh", "tenant_phone": "0934567890", "monthly_rent": 12000000, "deposit": 24000000, "start_date": "2025-01-01", "end_date": "2025-12-31", "status": "expired", "payment_date": 10, "agent_id": "usr-002"},
]

DEMO_MAINTENANCE = [
    {"id": "mt-001", "asset_id": "ast-001", "asset_code": "VIN-P7-22.04", "type": "electrical", "title": "Bình nước nóng hỏng", "description": "Bình nóng lạnh không hoạt động", "priority": "high", "status": "in_progress", "reported_by": "Nguyễn Văn Phúc", "assigned_to": "Thợ Hùng", "reported_at": "2026-04-18T08:00:00", "estimated_cost": 1500000},
    {"id": "mt-002", "asset_id": "ast-003", "asset_code": "GAT-A-08.12", "type": "plumbing", "title": "Vòi nước bị rò rỉ", "description": "Vòi bếp chảy nước, cần thay gioăng", "priority": "medium", "status": "pending", "reported_by": "Trần Thị Mai", "assigned_to": None, "reported_at": "2026-04-17T14:00:00", "estimated_cost": 200000},
    {"id": "mt-003", "asset_id": "ast-004", "asset_code": "SUN-B-15.06", "type": "hvac", "title": "Điều hòa không lạnh", "description": "Máy lạnh chạy nhưng không ra gió lạnh", "priority": "high", "status": "resolved", "reported_by": "Quản lý", "assigned_to": "Thợ Minh", "reported_at": "2026-04-15T10:00:00", "estimated_cost": 2500000},
]

DEMO_INVOICES = [
    {"id": "inv-001", "contract_id": "lc-001", "asset_code": "VIN-P7-22.04", "tenant_name": "Nguyễn Văn Phúc", "month": "2026-04", "rent_amount": 18000000, "utilities": 850000, "total": 18850000, "status": "paid", "paid_at": "2026-04-05T09:30:00", "due_date": "2026-04-05"},
    {"id": "inv-002", "contract_id": "lc-002", "asset_code": "GAT-A-08.12", "tenant_name": "Trần Thị Mai", "month": "2026-04", "rent_amount": 28000000, "utilities": 1200000, "total": 29200000, "status": "overdue", "paid_at": None, "due_date": "2026-04-01"},
    {"id": "inv-003", "contract_id": "lc-001", "asset_code": "VIN-P7-22.04", "tenant_name": "Nguyễn Văn Phúc", "month": "2026-05", "rent_amount": 18000000, "utilities": 0, "total": 18000000, "status": "pending", "paid_at": None, "due_date": "2026-05-05"},
]

# ─── ASSETS ───────────────────────────────────────────────────────────────────
@router.get("/assets")
async def get_assets(status: Optional[str] = None, agent_id: Optional[str] = None):
    assets = DEMO_ASSETS
    if status:
        assets = [a for a in assets if a["status"] == status]
    if agent_id:
        assets = [a for a in assets if a["agent_id"] == agent_id]
    return {
        "total": len(assets),
        "items": assets,
        "stats": {
            "rented": len([a for a in DEMO_ASSETS if a["status"] == "rented"]),
            "available": len([a for a in DEMO_ASSETS if a["status"] == "available"]),
            "maintenance": len([a for a in DEMO_ASSETS if a["status"] == "maintenance"]),
            "monthly_revenue": sum(a["monthly_rent"] for a in DEMO_ASSETS if a["status"] == "rented"),
        }
    }

@router.post("/assets")
async def create_asset(data: dict):
    new_asset = {"id": f"ast-{uuid.uuid4().hex[:6]}", "status": "available", **data}
    DEMO_ASSETS.append(new_asset)
    return new_asset

# ─── CONTRACTS ────────────────────────────────────────────────────────────────
@router.get("/contracts")
async def get_contracts(status: Optional[str] = None):
    contracts = DEMO_CONTRACTS
    if status:
        contracts = [c for c in contracts if c["status"] == status]
    
    # Auto-flag expiring soon (within 30 days)
    today = date.today()
    for c in contracts:
        try:
            end = date.fromisoformat(c["end_date"])
            days_left = (end - today).days
            c["days_remaining"] = days_left
            if 0 < days_left <= 30 and c["status"] == "active":
                c["status"] = "expiring_soon"
        except Exception:
            c["days_remaining"] = None

    return {
        "total": len(contracts),
        "items": contracts,
        "alerts": {
            "expiring_soon": len([c for c in contracts if c["status"] == "expiring_soon"]),
            "expired": len([c for c in contracts if c["status"] == "expired"]),
        }
    }

@router.post("/contracts")
async def create_contract(data: dict):
    new_contract = {
        "id": f"lc-{uuid.uuid4().hex[:6]}",
        "status": "active",
        "created_at": datetime.now().isoformat(),
        **data
    }
    DEMO_CONTRACTS.append(new_contract)
    return new_contract

@router.patch("/contracts/{contract_id}/renew")
async def renew_contract(contract_id: str, data: dict):
    contract = next((c for c in DEMO_CONTRACTS if c["id"] == contract_id), None)
    if not contract:
        raise HTTPException(404, "Hợp đồng không tồn tại")
    contract.update({
        "end_date": data.get("new_end_date"),
        "monthly_rent": data.get("new_rent", contract["monthly_rent"]),
        "status": "active",
        "renewed_at": datetime.now().isoformat(),
    })
    return {"message": "Gia hạn thành công", "contract": contract}

# ─── MAINTENANCE ──────────────────────────────────────────────────────────────
@router.get("/maintenance")
async def get_maintenance(status: Optional[str] = None, priority: Optional[str] = None):
    tickets = DEMO_MAINTENANCE
    if status:
        tickets = [t for t in tickets if t["status"] == status]
    if priority:
        tickets = [t for t in tickets if t["priority"] == priority]
    return {
        "total": len(tickets),
        "items": tickets,
        "stats": {
            "pending": len([t for t in DEMO_MAINTENANCE if t["status"] == "pending"]),
            "in_progress": len([t for t in DEMO_MAINTENANCE if t["status"] == "in_progress"]),
            "resolved": len([t for t in DEMO_MAINTENANCE if t["status"] == "resolved"]),
        }
    }

@router.post("/maintenance")
async def create_maintenance(data: dict):
    ticket = {
        "id": f"mt-{uuid.uuid4().hex[:6]}",
        "status": "pending",
        "assigned_to": None,
        "reported_at": datetime.now().isoformat(),
        **data
    }
    DEMO_MAINTENANCE.append(ticket)
    return ticket

@router.patch("/maintenance/{ticket_id}/assign")
async def assign_maintenance(ticket_id: str, data: dict):
    ticket = next((t for t in DEMO_MAINTENANCE if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(404, "Ticket không tồn tại")
    ticket["assigned_to"] = data.get("technician")
    ticket["status"] = "in_progress"
    ticket["assigned_at"] = datetime.now().isoformat()
    return ticket

@router.patch("/maintenance/{ticket_id}/resolve")
async def resolve_maintenance(ticket_id: str, data: dict):
    ticket = next((t for t in DEMO_MAINTENANCE if t["id"] == ticket_id), None)
    if not ticket:
        raise HTTPException(404, "Ticket không tồn tại")
    ticket["status"] = "resolved"
    ticket["resolved_at"] = datetime.now().isoformat()
    ticket["resolution_note"] = data.get("note", "")
    ticket["actual_cost"] = data.get("actual_cost", ticket.get("estimated_cost", 0))
    return ticket

# ─── INVOICES / PAYMENTS ──────────────────────────────────────────────────────
@router.get("/invoices")
async def get_invoices(status: Optional[str] = None, month: Optional[str] = None):
    invoices = DEMO_INVOICES
    if status:
        invoices = [i for i in invoices if i["status"] == status]
    if month:
        invoices = [i for i in invoices if i["month"] == month]
    return {
        "total": len(invoices),
        "items": invoices,
        "stats": {
            "paid_total": sum(i["total"] for i in DEMO_INVOICES if i["status"] == "paid"),
            "overdue_total": sum(i["total"] for i in DEMO_INVOICES if i["status"] == "overdue"),
            "pending_total": sum(i["total"] for i in DEMO_INVOICES if i["status"] == "pending"),
        }
    }

@router.post("/invoices/{invoice_id}/pay")
async def mark_paid(invoice_id: str, data: dict):
    invoice = next((i for i in DEMO_INVOICES if i["id"] == invoice_id), None)
    if not invoice:
        raise HTTPException(404, "Hóa đơn không tồn tại")
    invoice["status"] = "paid"
    invoice["paid_at"] = datetime.now().isoformat()
    invoice["payment_method"] = data.get("method", "bank_transfer")
    return {"message": "Đã ghi nhận thanh toán", "invoice": invoice}

@router.post("/invoices/auto-generate")
async def auto_generate_invoices(background_tasks: BackgroundTasks):
    """B9 — Tự động tạo hóa đơn tháng tiếp theo cho tất cả HĐ active"""
    next_month = (datetime.now().replace(day=1) + timedelta(days=32)).strftime("%Y-%m")
    generated = []
    for contract in DEMO_CONTRACTS:
        if contract["status"] == "active":
            # Kiểm tra đã có invoice tháng này chưa
            existing = any(
                i["contract_id"] == contract["id"] and i["month"] == next_month
                for i in DEMO_INVOICES
            )
            if not existing:
                due_day = contract.get("payment_date", 5)
                due_date = f"{next_month}-{due_day:02d}"
                new_invoice = {
                    "id": f"inv-{uuid.uuid4().hex[:6]}",
                    "contract_id": contract["id"],
                    "asset_code": contract["asset_code"],
                    "tenant_name": contract["tenant_name"],
                    "month": next_month,
                    "rent_amount": contract["monthly_rent"],
                    "utilities": 0,  # Agent update manually
                    "total": contract["monthly_rent"],
                    "status": "pending",
                    "paid_at": None,
                    "due_date": due_date,
                    "auto_generated": True,
                }
                DEMO_INVOICES.append(new_invoice)
                generated.append(new_invoice)
    return {
        "generated_count": len(generated),
        "month": next_month,
        "invoices": generated,
        "message": f"Đã tạo {len(generated)} hóa đơn cho tháng {next_month}"
    }

# ─── DASHBOARD ────────────────────────────────────────────────────────────────
@router.get("/dashboard/stats")
async def get_leasing_dashboard():
    today = date.today()
    expiring = []
    for c in DEMO_CONTRACTS:
        try:
            end = date.fromisoformat(c["end_date"])
            days = (end - today).days
            if 0 < days <= 30:
                expiring.append({**c, "days_remaining": days})
        except Exception:
            pass

    return {
        "assets": {
            "total": len(DEMO_ASSETS),
            "rented": len([a for a in DEMO_ASSETS if a["status"] == "rented"]),
            "available": len([a for a in DEMO_ASSETS if a["status"] == "available"]),
            "occupancy_rate": round(len([a for a in DEMO_ASSETS if a["status"] == "rented"]) / len(DEMO_ASSETS) * 100, 1),
        },
        "revenue": {
            "monthly_total": sum(a["monthly_rent"] for a in DEMO_ASSETS if a["status"] == "rented"),
            "collected_this_month": sum(i["total"] for i in DEMO_INVOICES if i["status"] == "paid"),
            "overdue_amount": sum(i["total"] for i in DEMO_INVOICES if i["status"] == "overdue"),
        },
        "maintenance": {
            "open_tickets": len([t for t in DEMO_MAINTENANCE if t["status"] in ["pending", "in_progress"]]),
            "high_priority": len([t for t in DEMO_MAINTENANCE if t["priority"] == "high" and t["status"] != "resolved"]),
        },
        "contracts": {
            "active": len([c for c in DEMO_CONTRACTS if c["status"] == "active"]),
            "expiring_soon": expiring,
        },
    }
