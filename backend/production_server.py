"""
production_server.py — F2
FastAPI production config:
- Gunicorn / Uvicorn settings
- CORS production whitelist
- Rate limiting middleware
- Security headers
- Health check endpoint
- Backend startup validation
"""
import os
import time
import logging
from datetime import datetime
from functools import wraps
from collections import defaultdict
from typing import Callable

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("prohouzing.production")

# ─── Environment ──────────────────────────────────────────────────────────────
ENV          = os.getenv("ENV", "production")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://prohouzing.com")
APP_VERSION  = "2.1.0"
BUILD_TIME   = datetime.now().isoformat()

# ─── Allowed origins ──────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "https://prohouzing.com",
    "https://www.prohouzing.com",
    "https://app.prohouzing.com",
    "https://prohouzing.vercel.app",
    # Preview deployments (Vercel)
    "https://prohouzing-*.vercel.app",
]
if ENV != "production":
    ALLOWED_ORIGINS += ["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"]

# ─── F2a: Security Headers Middleware ────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"]         = "DENY"
        response.headers["X-XSS-Protection"]        = "1; mode=block"
        response.headers["Referrer-Policy"]          = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]       = "camera=(), microphone=(), geolocation=(self)"
        if ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["X-App-Version"] = APP_VERSION
        return response

# ─── F2b: Rate Limiting Middleware ─────────────────────────────────────────────
RATE_LIMITS = {
    "/api/auth":         (20,  60),   # 20 req / 60s
    "/api/ai/valuation": (30,  60),   # 30 req / 60s
    "/api/ai/chat":      (50,  60),   # 50 req / 60s
    "/api/":             (200, 60),   # 200 req / 60s general
}

_request_counts = defaultdict(list)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        # Find matching rate limit rule
        limit, window = RATE_LIMITS.get("/api/", (500, 60))
        for prefix, (lim, win) in RATE_LIMITS.items():
            if path.startswith(prefix) and prefix != "/api/":
                limit, window = lim, win
                break

        key = f"{client_ip}:{path[:20]}"
        now = time.time()
        # Cleanup old entries
        _request_counts[key] = [t for t in _request_counts[key] if now - t < window]
        _request_counts[key].append(now)

        if len(_request_counts[key]) > limit:
            logger.warning(f"Rate limit hit: {client_ip} → {path}")
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests", "retry_after": window},
                headers={"Retry-After": str(window), "X-RateLimit-Limit": str(limit)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"]     = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(_request_counts[key])))
        return response

# ─── F2c: Request Logging Middleware ─────────────────────────────────────────
class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        # Log slow requests (> 2s)
        if duration_ms > 2000:
            logger.warning(f"SLOW {request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)")
        elif ENV == "development":
            logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)")

        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        return response

# ─── F2d: Production Middleware setup function ────────────────────────────────
def configure_production_middlewares(app: FastAPI):
    """Apply all production middlewares — call trong server.py"""
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-App-Version", "X-Request-ID"],
        expose_headers=["X-Response-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
        max_age=86400,
    )
    logger.info(f"✅ Production middlewares configured (ENV={ENV})")
    return app

# ─── F2e: Health Check Endpoint ──────────────────────────────────────────────
def register_health_endpoints(app: FastAPI):
    """Register /health, /ping, /version endpoints"""

    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "version": APP_VERSION,
            "environment": ENV,
            "timestamp": datetime.now().isoformat(),
            "services": {
                "api": "operational",
                "build_time": BUILD_TIME,
            }
        }

    @app.get("/ping", tags=["System"])
    async def ping():
        return {"pong": True, "ts": time.time()}

    @app.get("/version", tags=["System"])
    async def version():
        return {
            "app": "ProHouzing",
            "version": APP_VERSION,
            "environment": ENV,
            "phases_complete": ["A", "B", "C", "D", "E", "F"],
            "build": BUILD_TIME,
        }

    @app.get("/metrics/basic", tags=["System"])
    async def basic_metrics():
        """Basic metrics endpoint — production use"""
        import psutil
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "uptime_s": time.time() - app.state.start_time if hasattr(app.state, 'start_time') else 0,
        }

    return app

# ─── Gunicorn config (gunicorn_conf.py) ──────────────────────────────────────
GUNICORN_CONFIG = """
# gunicorn_conf.py — Production config
import multiprocessing

bind          = "0.0.0.0:8000"
workers       = min(4, multiprocessing.cpu_count() * 2 + 1)
worker_class  = "uvicorn.workers.UvicornWorker"
timeout       = 120
keepalive     = 5
max_requests  = 1000
max_requests_jitter = 100
preload_app   = True
accesslog     = "-"
errorlog      = "-"
loglevel      = "info"
"""

# Write gunicorn config on module load
import pathlib
gunicorn_path = pathlib.Path(__file__).parent / "gunicorn_conf.py"
if not gunicorn_path.exists():
    gunicorn_path.write_text(GUNICORN_CONFIG)
