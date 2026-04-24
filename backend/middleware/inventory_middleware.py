"""
ProHouzing Inventory Middleware
PROMPT 5/20 - PART C: INTEGRATION

Middleware for:
1. Idempotency handling
2. Request logging
3. Rate limiting for hold/booking
"""

import time
import logging
from typing import Dict, Optional, Callable
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)


# ============================================
# RATE LIMITER
# ============================================

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def is_allowed(self, key: str) -> bool:
        """Check if request is allowed."""
        async with self._lock:
            now = time.time()
            # Clean old requests
            self.requests[key] = [
                t for t in self.requests[key]
                if now - t < self.window_seconds
            ]
            
            if len(self.requests[key]) >= self.max_requests:
                return False
            
            self.requests[key].append(now)
            return True
    
    def get_remaining(self, key: str) -> int:
        """Get remaining requests."""
        now = time.time()
        valid = [t for t in self.requests[key] if now - t < self.window_seconds]
        return max(0, self.max_requests - len(valid))


# Rate limiters for different operations
hold_rate_limiter = RateLimiter(max_requests=20, window_seconds=60)
booking_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


# ============================================
# REQUEST LOGGING MIDDLEWARE
# ============================================

class InventoryRequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all inventory-related requests.
    """
    
    INVENTORY_PATHS = [
        "/api/inventory/",
        "/api/products/",
        "/api/bookings/",
        "/api/deals/",
    ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if this is an inventory-related request
        path = request.url.path
        is_inventory = any(path.startswith(p) for p in self.INVENTORY_PATHS)
        
        if not is_inventory:
            return await call_next(request)
        
        # Generate request ID
        request_id = request.headers.get("X-Request-ID", str(uuid4())[:8])
        idempotency_key = request.headers.get("Idempotency-Key")
        
        start_time = time.time()
        
        # Log request
        logger.info(
            f"INVENTORY_REQUEST: method={request.method} path={path} "
            f"request_id={request_id} idempotency_key={idempotency_key}"
        )
        
        try:
            response = await call_next(request)
            
            # Log response
            elapsed = (time.time() - start_time) * 1000
            logger.info(
                f"INVENTORY_RESPONSE: request_id={request_id} "
                f"status={response.status_code} elapsed_ms={elapsed:.2f}"
            )
            
            # Add headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{elapsed:.2f}ms"
            
            return response
            
        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            logger.error(
                f"INVENTORY_ERROR: request_id={request_id} "
                f"error={type(e).__name__}: {e} elapsed_ms={elapsed:.2f}"
            )
            raise


# ============================================
# RATE LIMIT MIDDLEWARE
# ============================================

class InventoryRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting for hold and booking operations.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        method = request.method
        
        # Only limit POST requests to specific endpoints
        if method != "POST":
            return await call_next(request)
        
        # Get user identifier
        user_id = None
        try:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                import jwt
                import os
                token = auth_header[7:]
                JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                user_id = payload.get("sub", "anonymous")
        except:
            user_id = request.client.host if request.client else "unknown"
        
        rate_key = f"{user_id}:{path}"
        
        # Apply rate limiting for hold operations
        if "/hold" in path:
            if not await hold_rate_limiter.is_allowed(rate_key):
                logger.warning(f"RATE_LIMIT_EXCEEDED: path={path} user={user_id}")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": "Too many hold requests. Please wait.",
                        "retry_after": 60,
                    }
                )
        
        # Apply rate limiting for booking operations
        if "/booking" in path:
            if not await booking_rate_limiter.is_allowed(rate_key):
                logger.warning(f"RATE_LIMIT_EXCEEDED: path={path} user={user_id}")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": "Too many booking requests. Please wait.",
                        "retry_after": 60,
                    }
                )
        
        return await call_next(request)


# ============================================
# METRICS COLLECTOR
# ============================================

class InventoryMetrics:
    """
    Simple metrics collector for inventory operations.
    """
    
    def __init__(self):
        self.counters: Dict[str, int] = defaultdict(int)
        self.timings: Dict[str, list] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def increment(self, metric: str, value: int = 1):
        """Increment a counter."""
        async with self._lock:
            self.counters[metric] += value
    
    async def record_timing(self, metric: str, value_ms: float):
        """Record a timing value."""
        async with self._lock:
            self.timings[metric].append(value_ms)
            # Keep last 1000 values
            if len(self.timings[metric]) > 1000:
                self.timings[metric] = self.timings[metric][-1000:]
    
    def get_stats(self) -> Dict:
        """Get all stats."""
        stats = {
            "counters": dict(self.counters),
            "timings": {}
        }
        
        for metric, values in self.timings.items():
            if values:
                stats["timings"][metric] = {
                    "count": len(values),
                    "avg_ms": sum(values) / len(values),
                    "min_ms": min(values),
                    "max_ms": max(values),
                }
        
        return stats


# Singleton instance
inventory_metrics = InventoryMetrics()


# ============================================
# HELPER FUNCTIONS
# ============================================

def setup_inventory_middleware(app):
    """Setup all inventory-related middleware."""
    app.add_middleware(InventoryRequestLoggingMiddleware)
    app.add_middleware(InventoryRateLimitMiddleware)
    logger.info("Inventory middleware configured")
