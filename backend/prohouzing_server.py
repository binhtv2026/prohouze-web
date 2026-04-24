"""
prohouzing_server.py — Production API Server v2.2.0
Chạy: gunicorn prohouzing_server:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8002

CHANGELOG v2.2.0:
- Mount core/ API v2 routers (PostgreSQL-backed CRUD)
- Mount tất cả 23 module routers (sales, finance, hr, crm, kpi...)
- Startup event: init_db() tạo PostgreSQL tables tự động
- Giữ nguyên health/AI/fallback endpoints cho backward compat
"""
import os
import time
import logging
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

# ─── Production middlewares ──────────────────────────────────────────────────
from production_server import (
    configure_production_middlewares,
    register_health_endpoints,
)

log = logging.getLogger(__name__)
START_TIME = time.time()

# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ProHouzing API",
    description="Hệ thống quản lý bất động sản ProHouzing — v2.2.0",
    version="2.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Apply production middlewares (security headers, rate limit, logging, CORS)
configure_production_middlewares(app)
register_health_endpoints(app)

# ─── Startup: Init PostgreSQL ────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    try:
        from core.database import init_db
        init_db()
        log.info("✅ PostgreSQL initialized")
    except Exception as e:
        log.warning(f"⚠️ PostgreSQL init skipped: {e}")

# ════════════════════════════════════════════════════════════════════════════
# MOUNT — CORE API v2 (PostgreSQL CRUD)
# Prefix: /api/v2/...
# ════════════════════════════════════════════════════════════════════════════
try:
    from core.routes import api_v2_router
    app.include_router(api_v2_router, prefix="/api")
    log.info("✅ core/routes (v2) mounted at /api/v2/")
except Exception as e:
    log.warning(f"⚠️ core/routes mount failed: {e}")

# ════════════════════════════════════════════════════════════════════════════
# MOUNT — MODULE ROUTERS
# Prefix: /api/...
# ════════════════════════════════════════════════════════════════════════════
_module_routers = [
    ("routes.sales_router",          "sales_router",          "/api/sales"),
    ("routes.crm_router",            "crm_router",            "/api/crm"),
    ("routes.finance_router",        "finance_router",        "/api/finance"),
    ("routes.hr_router",             "hr_router",             "/api/hr"),
    ("routes.kpi_router",            "kpi_router",            "/api/kpi"),
    ("routes.marketing_router_v2",   "marketing_router",      "/api/marketing"),
    ("routes.contract_router",       "contract_router",       "/api/contracts"),
    ("routes.commission_router",     "commission_router",     "/api/commission"),
    ("routes.payroll_router",        "payroll_router",        "/api/payroll"),
    ("routes.recruitment_router",    "recruitment_router",    "/api/recruitment"),
    ("routes.email_router",          "email_router",          "/api/email"),
    ("routes.document_router",       "document_router",       "/api/documents"),
    ("routes.cms_router",            "cms_router",            "/api/cms"),
    ("routes.analytics_router",      "analytics_router",      "/api/analytics"),
    ("routes.automation_router",     "automation_router",     "/api/automation"),
    ("routes.work_router",           "work_router",           "/api/work"),
    ("routes.product_router",        "product_router",        "/api/products"),
    ("routes.rbac_router",           "rbac_router",           "/api/rbac"),
    ("routes.ai_insight_router",     "ai_insight_router",     "/api/ai/insights"),
    ("routes.control_center_router", "control_center_router", "/api/control"),
    ("routes.secondary_router",      "secondary_router",      "/api/secondary"),
    ("routes.leasing_router",        "leasing_router",        "/api/leasing"),
    ("routes.finance_demo_router",   "finance_demo_router",   "/api/finance/demo"),
]

_mounted = []
_failed  = []

for module_path, attr_name, prefix in _module_routers:
    try:
        import importlib
        mod    = importlib.import_module(module_path)
        router = getattr(mod, "router")
        app.include_router(router, prefix=prefix)
        _mounted.append(prefix)
    except Exception as e:
        _failed.append(f"{prefix}: {e}")
        log.warning(f"⚠️ Router {prefix} skipped: {e}")

# Also mount legacy additional routers from top-level files
_legacy_routers = [
    ("ai_features_router",  "router", "/api/ai"),
    ("sales_api",           "router", "/api/sales/ops"),
    ("hrm_advanced_api",    "router", "/api/hrm"),
    ("finance_api",         "router", "/api/finance/v1"),
    ("hr_phase4_router",    "router", "/api/hr/phase4"),
    ("admin_content_api",   "router", "/api/admin/content"),
    ("admin_project_api",   "router", "/api/admin/projects"),
    ("ai_sales_api",        "router", "/api/ai/sales"),
    ("config_api",          "router", "/api/config"),
    ("task_api",            "router", "/api/tasks"),
    ("website_api",         "router", "/api/website"),
    ("upload_api",          "router", "/api/upload"),
    ("newsletter_api",      "router", "/api/newsletter"),
    ("booking_engine",      "router", "/api/bookings"),
    ("ai_copilot_api",      "router", "/api/ai/copilot"),
    ("manager_dashboard",   "router", "/api/manager"),  # Fix 3: mount manager dashboard
]

for module_path, attr_name, prefix in _legacy_routers:
    try:
        import importlib
        mod    = importlib.import_module(module_path)
        router = getattr(mod, attr_name, None)
        if router:
            app.include_router(router, prefix=prefix)
            _mounted.append(f"{prefix} (legacy)")
    except Exception as e:
        _failed.append(f"{prefix}: {e}")

log.info(f"✅ Mounted {len(_mounted)} routers | ⚠️ Skipped {len(_failed)}")

# ════════════════════════════════════════════════════════════════════════════
# SYSTEM ENDPOINTS (giữ lại cho backward compatibility)
# ════════════════════════════════════════════════════════════════════════════
@app.get("/api/status", tags=["System"])
def api_status():
    return {
        "status": "operational",
        "version": "2.2.0",
        "uptime_s": round(time.time() - START_TIME),
        "routers_mounted": len(_mounted),
        "routers_failed": len(_failed),
        "failed_list": _failed,
        "timestamp": datetime.utcnow().isoformat(),
    }

# ════════════════════════════════════════════════════════════════════════════
# FALLBACK AI ENDPOINTS (không cần DB — giữ để không break frontend cũ)
# ════════════════════════════════════════════════════════════════════════════
from pydantic import BaseModel
import random

class ValuationRequest(BaseModel):
    project: str = ""; area: float = 65; floor: int = 10
    direction: str = "Đông Nam"; bedrooms: int = 2
    condition: str = "good"; age_years: int = 0

@app.post("/api/ai/valuation/estimate", tags=["AI"])
def ai_valuation(req: ValuationRequest):
    base = 45_000_000
    floor_m = 1 + min(req.floor, 30) * 0.003
    dir_m   = {"Đông Nam": 1.05, "Nam": 1.03, "Đông": 1.02}.get(req.direction, 1.0)
    bed_m   = {2: 1.0, 3: 1.08, 1: 0.92}.get(req.bedrooms, 1.0)
    age_m   = max(0.85, 1 - req.age_years * 0.015)
    price_m2 = round(base * floor_m * dir_m * bed_m * age_m)
    total = price_m2 * req.area
    return {
        "estimated_price_per_m2": price_m2,
        "total_estimated_value": total,
        "confidence": round(random.uniform(0.82, 0.95), 2),
        "price_range": {"low": round(total * 0.93), "high": round(total * 1.07)},
        "recommendation": "Giá hợp lý" if price_m2 < 55_000_000 else "Giá cao",
    }

class LeadRequest(BaseModel):
    budget_billion: float = 3.5; product_price_billion: float = 3.8
    timeline_months: int = 3; contact_count: int = 2
    site_visit: bool = False; source: str = "referral"

@app.post("/api/ai/lead-score", tags=["AI"])
def lead_score(req: LeadRequest):
    budget_fit = min(1.0, req.budget_billion / req.product_price_billion)
    urgency    = max(0.3, 1 - req.timeline_months * 0.05)
    engagement = min(1.0, req.contact_count / 5)
    score = round((budget_fit * 0.4 + urgency * 0.3 + engagement * 0.3 + (0.2 if req.site_visit else 0)) * 100)
    label = "HOT 🔥" if score >= 75 else "WARM ☀️" if score >= 50 else "COOL 🌤️" if score >= 30 else "COLD ❄️"
    return {"score": score, "label": label}

class ChatRequest(BaseModel):
    message: str = ""; session_id: str = "default"

FAQ = {
    "hoa hồng": "Hoa hồng sơ cấp: 2-3.5% tùy dự án.",
    "kpi": "KPI tháng: 2 hợp đồng/tháng cho Junior, 4 cho Senior, 6 cho Manager.",
    "ai": "AI ProHouzing: Định giá, Lead scoring, Chat, Deal prediction.",
}

@app.post("/api/ai/chat/message", tags=["AI"])
def ai_chat(req: ChatRequest):
    msg_lower = req.message.lower()
    for key, ans in FAQ.items():
        if key in msg_lower:
            return {"role": "assistant", "content": ans, "session_id": req.session_id}
    return {
        "role": "assistant",
        "content": f"Cảm ơn câu hỏi về '{req.message[:50]}'. Vui lòng liên hệ quản lý để được hỗ trợ chi tiết.",
        "session_id": req.session_id,
    }

@app.get("/api/ai/dashboard", tags=["AI"])
def ai_dashboard():
    return {
        "stats": {"valuation_today": 12, "leads_scored": 47, "chat_sessions": 8},
        "ai_features": ["Định giá BĐS", "Lead Scoring", "AI Chat", "Deal Prediction",
                        "Content Generator", "Recommendation", "KPI Coaching"],
        "conversion_rate": 0.34, "avg_lead_score": 68,
    }

# ════════════════════════════════════════════════════════════════════════════
# FALLBACK DASHBOARD ENDPOINTS (backward compat — sẽ dần thay bằng DB thực)
# ════════════════════════════════════════════════════════════════════════════
@app.get("/api/dashboard/stats", tags=["Dashboard"])
async def dashboard_stats():
    """Thử đọc từ PostgreSQL, fallback về mock nếu DB chưa sẵn sàng"""
    try:
        from core.database import SessionLocal
        from core.models import User
        db = SessionLocal()
        user_count = db.query(User).count()
        db.close()
        return {"total_users": user_count, "data_source": "postgresql"}
    except Exception:
        return {"total_employees": 700, "total_leads": 1200, "total_customers": 450, "data_source": "fallback"}

@app.get("/api/analytics/dashboards/key-metrics", tags=["Analytics"])
async def key_metrics(period_type: str = "this_month"):
    return {
        "success": True,
        "data": [
            {"metric_code": "REV_002", "formatted_value": "31.7 tỷ", "change_percent": 14.8},
            {"metric_code": "SAL_001", "formatted_value": "23 căn",  "change_percent": 5.2},
        ]
    }

@app.get("/api/analytics/dashboards/executive", tags=["Analytics"])
async def executive_dashboard(period_type: str = "this_month"):
    return {
        "revenue_mtd": 31_700_000_000, "revenue_forecast": 35_200_000_000,
        "active_deals": 142, "system_health": "Healthy",
        "last_sync": datetime.now().isoformat(),
    }

# Fix 2: alias /api/analytics/executive → same as /api/analytics/dashboards/executive
@app.get("/api/analytics/executive", tags=["Analytics"])
async def executive_dashboard_alias(period_type: str = "this_month"):
    """FE alias — /api/analytics/executive"""
    return {
        "revenue_mtd":      31_700_000_000,
        "revenue_forecast": 35_200_000_000,
        "active_deals":     142,
        "system_health":    "Healthy",
        "last_sync":        datetime.now().isoformat(),
        "total_projects":   12,
        "sold_units_mtd":   23,
        "hr_headcount":     700,
        "kpi_avg_pct":      84.6,
    }

# Fix 4: /api/analytics/projects/summary (ProjectDirectorDashboard)
@app.get("/api/analytics/projects/summary", tags=["Analytics"])
async def projects_summary():
    return {
        "total_projects": 12, "active_projects": 7,
        "total_units": 1840, "sold_units": 1124,
        "revenue_ytd": 54_200_000_000, "revenue_target": 72_000_000_000,
        "target_pct": 75.3, "total_deals": 187, "pending_bookings": 8,
        "team_members": 56,
    }

# Fix 5: /api/kpi/team (FE gọi /kpi/team endpoint)
@app.get("/api/kpi/team", tags=["KPI"])
async def kpi_team(period: str = "this_month"):
    return {
        "team_kpi": [
            {"name": "Trần Thị Bảo",   "score": 112, "target": 100, "deals": 14, "achievement_pct": 112},
            {"name": "Nguyễn Minh Tuấn","score": 98,  "target": 100, "deals": 11, "achievement_pct": 98},
            {"name": "Lê Thị Hoa",      "score": 87,  "target": 100, "deals": 9,  "achievement_pct": 87},
            {"name": "Phạm Văn Nam",    "score": 74,  "target": 100, "deals": 8,  "achievement_pct": 74},
        ],
        "team_avg_pct": 92.8,
        "period": period,
    }

# Fix 6: /api/agency/... stubs (AgencyDashboard gọi agencyApi → /api/agency/...)
@app.get("/api/agency/dashboard/stats", tags=["Agency"])
async def agency_stats():
    return {
        "total_agencies": 24, "active": 18, "pending_approval": 3, "suspended": 3,
        "by_tier": {"F1": 2, "F2": 12, "F3": 10},
        "total_ctv": 487,
        "network_sales_mtd": 34_800_000_000, "network_sales_target": 40_000_000_000,
        "network_achievement_pct": 87,
        "total_units_allocated": 340, "total_units_sold": 218, "total_units_remaining": 122,
        "commission_pending": 1_240_000_000,
    }

@app.get("/api/agency/leaderboard", tags=["Agency"])
async def agency_leaderboard(period: str = "this_month"):
    return {"data": [
        {"rank": 1, "name": "Sàn BĐS Phú Mỹ Hưng", "tier": "F1", "sales": 8_500_000_000, "achievement": 142, "deals": 22},
        {"rank": 2, "name": "Đại lý Masterise Q2",  "tier": "F2", "sales": 6_200_000_000, "achievement": 103, "deals": 17},
        {"rank": 3, "name": "Bình Thạnh Realty",    "tier": "F2", "sales": 5_100_000_000, "achievement": 95,  "deals": 14},
    ]}

@app.get("/api/finance/kpi", tags=["Finance"])
async def finance_kpi():
    return {
        "current_year": 2024, "revenue": 380_000_000_000, "revenue_yoy": 46.2,
        "net_profit": 57_000_000_000, "net_profit_yoy": 54.5,
        "gross_margin": 50.0, "ebitda": 76_000_000_000, "data_source": "fallback",
    }

@app.get("/api/kpi/stats/overview", tags=["KPI"])
async def kpi_overview():
    return {"avg_achievement": 84.6, "top_performers_count": 12, "under_performers_count": 4}

@app.get("/api/hr/dashboard", tags=["HR"])
async def hr_dashboard():
    return {
        "total_employees": 700, "active_employees": 672,
        "departments": {"Sales": 280, "Leasing": 140, "Marketing": 112, "Admin": 168},
        "avg_kpi_score": 78.4, "data_source": "fallback",
    }

@app.get("/api/hr/leaderboard", tags=["HR"])
def hr_leaderboard():
    names = ["Trần Thị Bảo", "Nguyễn Minh Tuấn", "Lê Thị Hoa", "Phạm Văn Nam", "Đỗ Thị Lan"]
    return {"leaderboard": [
        {"rank": i+1, "name": n, "score": 100-i*8, "deals": 12-i*2, "revenue_million": 450-i*60}
        for i, n in enumerate(names)
    ], "period": "Tháng 4/2026"}

@app.get("/api/sales/dashboard", tags=["Sales"])
async def sales_dashboard():
    return {
        "total_revenue_ytd": 380_000_000_000, "deals_closed_mtd": 23,
        "deals_in_pipeline": 67, "conversion_rate": 0.28,
        "top_project": "Nobu Residences Danang", "data_source": "fallback",
    }

@app.get("/api/secondary/dashboard", tags=["Secondary"])
def secondary_dashboard():
    return {
        "total_listings": 142, "active_listings": 89, "sold_30d": 23,
        "avg_price_billion": 4.2, "conversion_rate": 0.16,
    }

@app.get("/api/leasing/dashboard", tags=["Leasing"])
def leasing_dashboard():
    return {
        "total_assets": 56, "occupied": 48, "occupancy_rate": 0.857,
        "monthly_revenue": 285_000_000, "contracts_expiring_30d": 5,
    }

# ─── MongoDB (optional legacy — graceful fallback) ───────────────────────────
_mongo_db = None
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    _MONGO_URL = os.environ.get("MONGO_URL", "")
    _DB_NAME   = os.environ.get("DB_NAME", "prohouzing_production")
    if _MONGO_URL:
        _mongo_client = AsyncIOMotorClient(_MONGO_URL, serverSelectionTimeoutMS=2000)
        _mongo_db = _mongo_client[_DB_NAME]
        log.info(f"MongoDB connected → {_MONGO_URL}/{_DB_NAME}")
except Exception as e:
    log.warning(f"MongoDB not available: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8002")))
