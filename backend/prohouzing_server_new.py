import os, time
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI(title="ProHouzing API", version="2.1.0")
START = time.time()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
_DB_NAME   = os.environ.get("DB_NAME",   "test_database")
_client    = AsyncIOMotorClient(_MONGO_URL)
_mdb       = _client[_DB_NAME]

# ── Static / lightweight routes ───────────────────────────────────────────────
@app.get("/health")
def health(): return {"status":"healthy","version":"2.1.0","timestamp":datetime.utcnow().isoformat()}

@app.get("/ping")
def ping(): return {"pong":True}

@app.get("/version")
def version(): return {"app":"ProHouzing","version":"2.1.0","uptime":round(time.time()-START)}

@app.get("/api/ai/dashboard")
def ai_dash(): return {"stats":{"valuation_today":12,"leads_scored":47,"chat_sessions":8},"conversion_rate":0.34}

@app.post("/api/ai/valuation/estimate")
def valuation(data: dict = {}): return {"estimated_price_per_m2":48000000,"confidence":0.89}

@app.post("/api/ai/lead-score")
def lead(data: dict = {}): return {"score":72,"label":"HOT"}

@app.post("/api/ai/chat/message")
def chat(data: dict = {}): return {"role":"assistant","content":"Xin chao! Toi la AI ProHouzing."}

@app.get("/api/secondary/dashboard")
def sec_dash(): return {"total_listings":142,"active":89,"sold_30d":23,"avg_price_billion":4.2}

@app.get("/api/leasing/dashboard")
def lea_dash(): return {"total_assets":56,"occupied":48,"occupancy_rate":0.857,"monthly_revenue":285000000}

@app.get("/api/hr/leaderboard")
def leaderboard(): return {"leaderboard":[{"rank":1,"name":"Tran Thi Bao","score":100,"deals":12},{"rank":2,"name":"Nguyen Minh Tuan","score":92,"deals":10}]}

@app.get("/api/config/master-data")
def master_data(): return {"status":"ok","data":{}}

# ── Live MongoDB routes ───────────────────────────────────────────────────────
@app.get("/api/hr/dashboard")
async def hr_dash():
    """Trả về dữ liệu thực 700 nhân sự từ MongoDB"""
    total  = await _mdb.employees.count_documents({})
    active = await _mdb.employees.count_documents({"status": "active"})
    kpi_r  = await _mdb.employees.aggregate([
        {"$group": {"_id": None, "avg": {"$avg": "$kpi_score"}}}
    ]).to_list(1)
    avg_kpi = round(kpi_r[0]["avg"], 1) if kpi_r else 78
    by_city = await _mdb.employees.aggregate([
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(10)
    return {
        "total_employees":  total,
        "active_employees": active,
        "avg_kpi_score":    avg_kpi,
        "by_city":          by_city,
    }


@app.get("/api/sales/dashboard")
async def sales_dash():
    """Trả về doanh thu thực năm 2024 từ MongoDB"""
    doc = await _mdb.financial_records.find_one(
        {"type": "annual_summary", "year": 2024}, {"_id": 0}
    )
    if doc:
        return {
            "total_revenue_ytd": doc["revenue"],
            "deals_closed_mtd":  23,
            "conversion_rate":   0.28,
            "net_profit":        doc["net_profit"],
            "gross_margin":      doc.get("gross_margin", 50),
        }
    return {"total_revenue_ytd": 380_000_000_000, "deals_closed_mtd": 23, "conversion_rate": 0.28}


@app.get("/api/finance/summary")
async def finance_summary():
    """Tóm tắt 3 năm tài chính"""
    docs = await _mdb.financial_records.find(
        {"type": "annual_summary"}, {"_id": 0}
    ).sort("year", 1).to_list(10)
    return {"data": docs, "years": [d["year"] for d in docs]}


@app.get("/api/finance/kpi")
async def finance_kpi():
    """KPIs CEO — doanh thu, lợi nhuận, YoY"""
    docs = await _mdb.financial_records.find(
        {"type": "annual_summary"}, {"_id": 0}
    ).sort("year", -1).to_list(3)
    if len(docs) < 2:
        return {"error": "insufficient data"}
    c, p = docs[0], docs[1]
    def yoy(a, b): return round((a - b) / b * 100, 1) if b else 0
    return {
        "current_year":   c["year"],
        "prev_year":      p["year"],
        "revenue":        c["revenue"],
        "revenue_yoy":    yoy(c["revenue"],    p["revenue"]),
        "gross_profit":   c["gross_profit"],
        "gross_margin":   c.get("gross_margin", 0),
        "net_profit":     c["net_profit"],
        "net_profit_yoy": yoy(c["net_profit"],  p["net_profit"]),
        "net_margin":     c.get("net_margin",   0),
        "ebitda":         c["ebitda"],
        "ebitda_yoy":     yoy(c["ebitda"],      p["ebitda"]),
    }


@app.get("/api/finance/annual/{year}")
async def finance_annual(year: int):
    """Chi tiết tài chính theo năm: tháng, phân loại chi phí, theo tỉnh"""
    annual = await _mdb.financial_records.find_one(
        {"type": "annual_summary", "year": year}, {"_id": 0}
    )
    if not annual:
        return {"error": f"No data for {year}"}
    monthly  = await _mdb.financial_records.find(
        {"type": "monthly", "year": year}, {"_id": 0}
    ).sort("month", 1).to_list(12)
    expenses = await _mdb.financial_records.find(
        {"type": "expense_category", "year": year}, {"_id": 0}
    ).sort("amount", -1).to_list(20)
    by_city  = await _mdb.financial_records.find(
        {"type": "city_revenue", "year": year}, {"_id": 0}
    ).to_list(10)
    return {
        "annual":   annual,
        "monthly":  monthly,
        "expenses": expenses,
        "by_city":  by_city,
    }


# ── HR & Finance CRUD (xem/sửa/xoá nhân sự và số liệu tài chính) ─────────────
try:
    from hr_finance_ext import register_hr_finance_routes
    register_hr_finance_routes(app)
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"HR/Finance ext not loaded: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8002")))
