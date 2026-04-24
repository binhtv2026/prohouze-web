"""
ProHouzing HR & Finance CRUD Extension
Được thêm vào prohouzing_server.py qua mount script
"""
import os, uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import Query, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.environ.get("DB_NAME",   "test_database")
_client   = AsyncIOMotorClient(MONGO_URL)
mdb       = _client[DB_NAME]

def ts(): return datetime.now(timezone.utc).isoformat()

# ── Pydantic models ────────────────────────────────────────────────────────────
class EmpCreate(BaseModel):
    full_name: str
    job_title: str
    department: str
    branch: str
    city: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = "male"
    birth_date: Optional[str] = None
    employment_type: Optional[str] = "full_time"
    salary: Optional[float] = None
    joined_at: Optional[str] = None
    kpi_score: Optional[float] = None

class EmpUpdate(BaseModel):
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    branch: Optional[str] = None
    city: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    kpi_score: Optional[float] = None
    note: Optional[str] = None

class FinUpdate(BaseModel):
    revenue: Optional[int] = None
    cogs: Optional[int] = None
    opex: Optional[int] = None
    net_profit: Optional[int] = None
    note: Optional[str] = None


def register_hr_finance_routes(app):
    """Đăng ký tất cả HR & Finance routes vào FastAPI app"""

    # ── EMPLOYEE ROUTES ────────────────────────────────────────────────────────
    @app.get("/api/hr-crud/employees")
    async def list_employees(
        city: Optional[str] = Query(None),
        department: Optional[str] = Query(None),
        branch: Optional[str] = Query(None),
        status: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        size: int = Query(20, ge=1, le=200),
    ):
        filt: Dict[str, Any] = {}
        if city:       filt["city"]       = {"$regex": city,       "$options": "i"}
        if department: filt["department"] = {"$regex": department, "$options": "i"}
        if branch:     filt["branch"]     = {"$regex": branch,     "$options": "i"}
        if status:     filt["status"]     = status
        if search:     filt["$or"] = [
            {"full_name":     {"$regex": search, "$options": "i"}},
            {"employee_code": {"$regex": search, "$options": "i"}},
        ]
        skip  = (page - 1) * size
        total = await mdb.employees.count_documents(filt)
        docs  = await mdb.employees.find(filt, {"_id": 0})\
                                   .sort("employee_code", 1)\
                                   .skip(skip).limit(size).to_list(size)
        return {"total": total, "page": page, "size": size,
                "pages": (total + size - 1) // size, "data": docs}

    @app.get("/api/hr-crud/employees/stats")
    async def employee_stats():
        total  = await mdb.employees.count_documents({})
        active = await mdb.employees.count_documents({"status": "active"})
        kpi_r  = await mdb.employees.aggregate([
            {"$group": {"_id": None, "avg": {"$avg": "$kpi_score"}}}
        ]).to_list(1)
        by_city = await mdb.employees.aggregate([
            {"$group": {"_id": "$city", "count": {"$sum": 1}, "avg_kpi": {"$avg": "$kpi_score"}}},
            {"$sort": {"count": -1}}
        ]).to_list(10)
        by_dept = await mdb.employees.aggregate([
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(15)
        return {
            "total_employees": total,
            "active_employees": active,
            "avg_kpi_score": round(kpi_r[0]["avg"], 1) if kpi_r else 0,
            "by_city": by_city,
            "by_department": by_dept,
        }

    @app.get("/api/hr-crud/employees/{employee_id}")
    async def get_employee(employee_id: str):
        doc = await mdb.employees.find_one({"id": employee_id}, {"_id": 0})
        if not doc: raise HTTPException(404, "Không tìm thấy nhân viên")
        return doc

    @app.post("/api/hr-crud/employees", status_code=201)
    async def create_employee(emp: EmpCreate):
        total = await mdb.employees.count_documents({})
        eid  = str(uuid.uuid4())
        code = f"PHV{(total + 1):04d}"
        doc  = emp.dict()
        doc.update({"id": eid, "_id": eid, "employee_code": code,
                    "status": "active", "is_active": True, "_seed": False,
                    "created_at": ts(), "updated_at": ts()})
        await mdb.employees.insert_one(doc)
        return {"id": eid, "employee_code": code, "message": "Thêm nhân viên thành công"}

    @app.put("/api/hr-crud/employees/{employee_id}")
    async def update_employee(employee_id: str, upd: EmpUpdate):
        changes = {k: v for k, v in upd.dict().items() if v is not None}
        if not changes: raise HTTPException(400, "Không có dữ liệu cập nhật")
        changes["updated_at"] = ts()
        r = await mdb.employees.update_one({"id": employee_id}, {"$set": changes})
        if r.matched_count == 0: raise HTTPException(404, "Không tìm thấy nhân viên")
        return {"message": "Cập nhật thành công", "updated_fields": list(changes.keys())}

    @app.delete("/api/hr-crud/employees/{employee_id}")
    async def delete_employee(employee_id: str):
        r = await mdb.employees.update_one(
            {"id": employee_id},
            {"$set": {"status": "inactive", "is_active": False, "updated_at": ts()}}
        )
        if r.matched_count == 0: raise HTTPException(404, "Không tìm thấy nhân viên")
        return {"message": "Đã vô hiệu hoá nhân viên"}

    # ── FINANCE ROUTES ─────────────────────────────────────────────────────────
    @app.get("/api/finance-crud/summary")
    async def finance_summary():
        docs = await mdb.financial_records.find(
            {"type": "annual_summary"}, {"_id": 0}
        ).sort("year", 1).to_list(10)
        return {"data": docs, "years": [d["year"] for d in docs]}

    @app.get("/api/finance-crud/annual/{year}")
    async def finance_annual(year: int):
        annual   = await mdb.financial_records.find_one({"type": "annual_summary", "year": year}, {"_id": 0})
        if not annual: raise HTTPException(404, f"Không có dữ liệu năm {year}")
        monthly  = await mdb.financial_records.find({"type": "monthly",          "year": year}, {"_id": 0}).sort("month", 1).to_list(12)
        expenses = await mdb.financial_records.find({"type": "expense_category", "year": year}, {"_id": 0}).sort("amount", -1).to_list(20)
        by_city  = await mdb.financial_records.find({"type": "city_revenue",     "year": year}, {"_id": 0}).to_list(10)
        return {"annual": annual, "monthly": monthly, "expenses": expenses, "by_city": by_city}

    @app.get("/api/finance-crud/kpi")
    async def finance_kpi():
        docs = await mdb.financial_records.find({"type": "annual_summary"}, {"_id": 0}).sort("year", -1).to_list(3)
        if len(docs) < 2: return {"error": "Chưa đủ dữ liệu"}
        c, p = docs[0], docs[1]
        def yoy(a, b): return round((a - b) / b * 100, 1) if b else 0
        return {
            "current_year": c["year"], "prev_year": p["year"],
            "revenue": c["revenue"], "revenue_yoy": yoy(c["revenue"], p["revenue"]),
            "gross_profit": c["gross_profit"], "gross_margin": c.get("gross_margin", 0),
            "net_profit": c["net_profit"], "net_profit_yoy": yoy(c["net_profit"], p["net_profit"]),
            "net_margin": c.get("net_margin", 0),
            "ebitda": c["ebitda"], "ebitda_yoy": yoy(c["ebitda"], p["ebitda"]),
        }

    @app.put("/api/finance-crud/annual/{record_id}")
    async def update_finance(record_id: str, upd: FinUpdate):
        changes = {k: v for k, v in upd.dict().items() if v is not None}
        if not changes: raise HTTPException(400, "Không có dữ liệu cập nhật")
        doc = await mdb.financial_records.find_one({"id": record_id})
        if not doc: raise HTTPException(404, "Không tìm thấy bản ghi")
        rev  = changes.get("revenue", doc.get("revenue", 0))
        cogs = changes.get("cogs",    doc.get("cogs",    0))
        opex = changes.get("opex",    doc.get("opex",    0))
        if "revenue" in changes or "cogs" in changes:
            changes["gross_profit"] = rev - cogs
            if rev: changes["gross_margin"] = round((rev - cogs) / rev * 100, 2)
        if any(k in changes for k in ["revenue", "cogs", "opex"]):
            dep  = doc.get("depreciation", 0)
            inte = doc.get("interest", 0)
            tax  = doc.get("tax", 0)
            np   = rev - cogs - opex - dep - inte - tax
            changes["net_profit"] = np
            if rev: changes["net_margin"] = round(np / rev * 100, 2)
        changes["updated_at"] = ts()
        await mdb.financial_records.update_one({"id": record_id}, {"$set": changes})
        return {"message": "Cập nhật tài chính thành công", "recalculated": True}

    return app
