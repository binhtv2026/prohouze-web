"""
ProHouzing — HR & Finance CRUD API
====================================
Endpoints cho 700 nhân sự + dữ liệu tài chính 3 năm
Hỗ trợ: Xem / Tạo / Sửa / Xoá
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os, uuid
from datetime import datetime, timezone

# ── DB connection ─────────────────────────────────────────────────────────────
_MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
_DB_NAME   = os.environ.get("DB_NAME",   "test_database")
_client    = AsyncIOMotorClient(_MONGO_URL)
_db        = _client[_DB_NAME]

def now(): return datetime.now(timezone.utc).isoformat()

# ── Routers ───────────────────────────────────────────────────────────────────
hr_router      = APIRouter(prefix="/api/hr-crud",      tags=["HR CRUD"])
finance_router = APIRouter(prefix="/api/finance-crud", tags=["Finance CRUD"])

# ══════════════════════════════════════════════════════════════════════════════
# ── EMPLOYEE MODELS ───────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

class EmployeeUpdate(BaseModel):
    full_name:        Optional[str]   = None
    job_title:        Optional[str]   = None
    department:       Optional[str]   = None
    branch:           Optional[str]   = None
    city:             Optional[str]   = None
    employment_type:  Optional[str]   = None
    salary:           Optional[float] = None
    phone:            Optional[str]   = None
    email:            Optional[str]   = None
    status:           Optional[str]   = None
    kpi_score:        Optional[float] = None
    joined_at:        Optional[str]   = None
    note:             Optional[str]   = None

class EmployeeCreate(BaseModel):
    full_name:       str
    job_title:       str
    department:      str
    branch:          str
    city:            str
    phone:           Optional[str]  = None
    email:           Optional[str]  = None
    gender:          Optional[str]  = "male"
    birth_date:      Optional[str]  = None
    employment_type: Optional[str]  = "full_time"
    salary:          Optional[float]= None
    joined_at:       Optional[str]  = None
    kpi_score:       Optional[float]= None

# ── EMPLOYEE ENDPOINTS ────────────────────────────────────────────────────────

@hr_router.get("/employees")
async def list_employees(
    city:       Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    branch:     Optional[str] = Query(None),
    status:     Optional[str] = Query(None, description="active/inactive"),
    search:     Optional[str] = Query(None, description="Tìm theo tên/mã NV"),
    page:       int           = Query(1, ge=1),
    size:       int           = Query(20, ge=1, le=200),
):
    """Danh sách nhân sự — filter theo chi nhánh, phòng ban, tỉnh thành"""
    filt: Dict[str, Any] = {}
    if city:       filt["city"]       = {"$regex": city, "$options": "i"}
    if department: filt["department"] = {"$regex": department, "$options": "i"}
    if branch:     filt["branch"]     = {"$regex": branch, "$options": "i"}
    if status:     filt["status"]     = status
    if search:     filt["$or"] = [
        {"full_name":     {"$regex": search, "$options": "i"}},
        {"employee_code": {"$regex": search, "$options": "i"}},
    ]

    skip  = (page - 1) * size
    total = await _db.employees.count_documents(filt)
    docs  = await _db.employees.find(filt, {"_id": 0})\
                               .sort("employee_code", 1)\
                               .skip(skip).limit(size).to_list(size)
    return {
        "total": total, "page": page, "size": size,
        "pages": (total + size - 1) // size,
        "data":  docs,
    }


@hr_router.get("/employees/stats")
async def employee_stats():
    """Thống kê nhân sự tổng hợp để hiển thị trên CEO dashboard"""
    pipeline = [
        {"$group": {
            "_id":   "$city",
            "count": {"$sum": 1},
            "avg_kpi": {"$avg": "$kpi_score"},
            "avg_salary": {"$avg": "$salary"},
        }},
        {"$sort": {"count": -1}}
    ]
    by_city = await _db.employees.aggregate(pipeline).to_list(20)

    by_dept = await _db.employees.aggregate([
        {"$group": {"_id": "$department", "count": {"$sum": 1}, "avg_kpi": {"$avg": "$kpi_score"}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)

    total = await _db.employees.count_documents({})
    active = await _db.employees.count_documents({"status": "active"})
    avg_kpi_cur = await _db.employees.aggregate([
        {"$group": {"_id": None, "avg": {"$avg": "$kpi_score"}}}
    ]).to_list(1)

    return {
        "total_employees": total,
        "active_employees": active,
        "avg_kpi_score": round(avg_kpi_cur[0]["avg"], 1) if avg_kpi_cur else 0,
        "by_city": by_city,
        "by_department": by_dept,
    }


@hr_router.get("/employees/{employee_id}")
async def get_employee(employee_id: str):
    """Chi tiết 1 nhân viên"""
    doc = await _db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    return doc


@hr_router.post("/employees", status_code=201)
async def create_employee(emp: EmployeeCreate):
    """Thêm nhân viên mới"""
    # Auto employee code
    total = await _db.employees.count_documents({})
    emp_id   = str(uuid.uuid4())
    emp_code = f"PHV{(total + 1):04d}"
    doc = emp.dict()
    doc.update({
        "id": emp_id, "_id": emp_id,
        "employee_code": emp_code,
        "status": "active", "is_active": True,
        "_seed": False,
        "created_at": now(), "updated_at": now(),
    })
    await _db.employees.insert_one(doc)
    return {"id": emp_id, "employee_code": emp_code, "message": "Thêm nhân viên thành công"}


@hr_router.put("/employees/{employee_id}")
async def update_employee(employee_id: str, upd: EmployeeUpdate):
    """Cập nhật thông tin nhân viên"""
    changes = {k: v for k, v in upd.dict().items() if v is not None}
    if not changes:
        raise HTTPException(400, "Không có dữ liệu cập nhật")
    changes["updated_at"] = now()
    result = await _db.employees.update_one({"id": employee_id}, {"$set": changes})
    if result.matched_count == 0:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    return {"message": "Cập nhật thành công", "updated_fields": list(changes.keys())}


@hr_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    """Xoá nhân viên (soft-delete: set status=inactive)"""
    result = await _db.employees.update_one(
        {"id": employee_id},
        {"$set": {"status": "inactive", "is_active": False, "updated_at": now()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    return {"message": "Đã vô hiệu hoá nhân viên"}


@hr_router.delete("/employees/{employee_id}/permanent")
async def hard_delete_employee(employee_id: str):
    """Xoá vĩnh viễn nhân viên khỏi DB"""
    result = await _db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Không tìm thấy nhân viên")
    return {"message": "Đã xoá vĩnh viễn"}


# ══════════════════════════════════════════════════════════════════════════════
# ── FINANCE MODELS ────────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

class FinanceUpdate(BaseModel):
    revenue:      Optional[int]   = None
    cogs:         Optional[int]   = None
    gross_profit: Optional[int]   = None
    opex:         Optional[int]   = None
    ebitda:       Optional[int]   = None
    depreciation: Optional[int]   = None
    interest:     Optional[int]   = None
    tax:          Optional[int]   = None
    net_profit:   Optional[int]   = None
    note:         Optional[str]   = None

# ── FINANCE ENDPOINTS ─────────────────────────────────────────────────────────

@finance_router.get("/summary")
async def finance_summary():
    """Tóm tắt tài chính 3 năm cho CEO dashboard"""
    docs = await _db.financial_records.find(
        {"type": "annual_summary"}, {"_id": 0}
    ).sort("year", 1).to_list(10)
    return {"data": docs, "years": [d["year"] for d in docs]}


@finance_router.get("/annual/{year}")
async def finance_annual(year: int):
    """Doanh thu / Chi phí / Lợi nhuận năm theo tháng + phân loại chi phí"""
    annual = await _db.financial_records.find_one(
        {"type": "annual_summary", "year": year}, {"_id": 0}
    )
    if not annual:
        raise HTTPException(404, f"Không có dữ liệu năm {year}")

    monthly = await _db.financial_records.find(
        {"type": "monthly", "year": year}, {"_id": 0}
    ).sort("month", 1).to_list(12)

    expenses = await _db.financial_records.find(
        {"type": "expense_category", "year": year}, {"_id": 0}
    ).sort("amount", -1).to_list(20)

    by_city = await _db.financial_records.find(
        {"type": "city_revenue", "year": year}, {"_id": 0}
    ).to_list(10)

    return {
        "annual":   annual,
        "monthly":  monthly,
        "expenses": expenses,
        "by_city":  by_city,
    }


@finance_router.put("/annual/{record_id}")
async def update_finance_record(record_id: str, upd: FinanceUpdate):
    """
    Cập nhật bản ghi tài chính (dành cho Bộ phận Tài chính)
    Tự động tính lại gross_profit, ebitda, net_profit nếu thiếu
    """
    changes = {k: v for k, v in upd.dict().items() if v is not None}
    if not changes:
        raise HTTPException(400, "Không có dữ liệu cập nhật")

    # Auto-recalculate derived fields if core fields changed
    doc = await _db.financial_records.find_one({"id": record_id})
    if not doc:
        raise HTTPException(404, "Không tìm thấy bản ghi")

    rev  = changes.get("revenue",      doc.get("revenue", 0))
    cogs = changes.get("cogs",         doc.get("cogs",    0))
    opex = changes.get("opex",         doc.get("opex",    0))
    dep  = changes.get("depreciation", doc.get("depreciation", 0))
    inte = changes.get("interest",     doc.get("interest", 0))
    tax  = changes.get("tax",          doc.get("tax", 0))

    if "revenue" in changes or "cogs" in changes:
        changes["gross_profit"] = rev - cogs
    if "revenue" in changes or "cogs" in changes or "opex" in changes:
        changes["ebitda"] = rev - cogs - opex
    if any(k in changes for k in ["revenue","cogs","opex","depreciation","interest","tax"]):
        changes["net_profit"] = rev - cogs - opex - dep - inte - tax
        if rev > 0:
            changes["gross_margin"] = round((rev - cogs) / rev * 100, 2)
            changes["net_margin"]   = round(changes["net_profit"] / rev * 100, 2)

    changes["updated_at"] = now()
    await _db.financial_records.update_one({"id": record_id}, {"$set": changes})
    return {"message": "Cập nhật tài chính thành công", "recalculated": True}


@finance_router.get("/kpi")
async def finance_kpi():
    """KPIs tài chính nhanh cho CEO (YTD, so sánh YoY)"""
    docs = await _db.financial_records.find(
        {"type": "annual_summary"}, {"_id": 0}
    ).sort("year", -1).to_list(3)

    if len(docs) < 2:
        return {"error": "Chưa đủ dữ liệu 2 năm để so sánh"}

    cur  = docs[0]  # latest year
    prev = docs[1]

    def yoy(a, b):
        return round((a - b) / b * 100, 1) if b else 0

    return {
        "current_year":   cur["year"],
        "revenue":        cur["revenue"],
        "revenue_yoy":    yoy(cur["revenue"],    prev["revenue"]),
        "gross_profit":   cur["gross_profit"],
        "gross_margin":   cur.get("gross_margin", 0),
        "net_profit":     cur["net_profit"],
        "net_profit_yoy": yoy(cur["net_profit"],  prev["net_profit"]),
        "net_margin":     cur.get("net_margin", 0),
        "ebitda":         cur["ebitda"],
        "ebitda_yoy":     yoy(cur["ebitda"],      prev["ebitda"]),
        "prev_year":      prev["year"],
    }
