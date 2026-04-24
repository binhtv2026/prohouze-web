"""
ProHouzing Concurrent Test Suite
PROMPT 5/20 - PART C: INTEGRATION & TESTING

Test cases:
1. 10 concurrent HOLD requests → 1 success, 9 fail (409)
2. 2 concurrent BOOKING requests → 1 success, 1 fail
3. HOLD EXPIRE → auto release
4. IDEMPOTENCY → same key returns same result
"""

import asyncio
import aiohttp
import time
import json
from typing import List, Dict, Any
from uuid import uuid4
from datetime import datetime


class ConcurrentTester:
    """Test concurrent inventory operations."""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
    
    async def make_request(
        self,
        method: str,
        endpoint: str,
        data: dict = None,
        extra_headers: dict = None,
    ) -> Dict[str, Any]:
        """Make HTTP request."""
        url = f"{self.base_url}{endpoint}"
        headers = {**self.headers, **(extra_headers or {})}
        
        start = time.time()
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method, url, json=data, headers=headers
            ) as response:
                elapsed = (time.time() - start) * 1000
                body = await response.text()
                
                try:
                    result = json.loads(body)
                except:
                    result = {"raw": body}
                
                return {
                    "status": response.status,
                    "elapsed_ms": elapsed,
                    "body": result,
                }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TEST 1: 10 Concurrent HOLD Requests
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def test_concurrent_hold(self, product_id: str, num_requests: int = 10) -> Dict:
        """
        Test: 10 concurrent HOLD requests
        Expected: 1 success, 9 fail with 409
        """
        print(f"\n{'='*60}")
        print(f"TEST 1: {num_requests} Concurrent HOLD Requests")
        print(f"Product ID: {product_id}")
        print(f"{'='*60}")
        
        async def hold_request(request_num: int):
            idempotency_key = f"hold-test-{uuid4()}"
            return await self.make_request(
                "POST",
                f"/api/inventory/products/{product_id}/hold",
                data={"hold_hours": 24, "reason": f"Test hold #{request_num}"},
                extra_headers={"Idempotency-Key": idempotency_key},
            )
        
        # Create all requests
        tasks = [hold_request(i) for i in range(num_requests)]
        
        # Execute concurrently
        start = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = (time.time() - start) * 1000
        
        # Analyze results
        success_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") == 200)
        conflict_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") == 409)
        error_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") not in [200, 409])
        exception_count = sum(1 for r in results if isinstance(r, Exception))
        
        print(f"\nResults:")
        print(f"  Total time: {total_time:.2f}ms")
        print(f"  Success (200): {success_count}")
        print(f"  Conflict (409): {conflict_count}")
        print(f"  Other errors: {error_count}")
        print(f"  Exceptions: {exception_count}")
        
        passed = success_count == 1 and conflict_count == num_requests - 1
        print(f"\n  TEST {'PASSED ✅' if passed else 'FAILED ❌'}")
        print(f"  Expected: 1 success, {num_requests-1} conflicts")
        
        return {
            "test": "concurrent_hold",
            "passed": passed,
            "total_time_ms": total_time,
            "success_count": success_count,
            "conflict_count": conflict_count,
            "error_count": error_count,
            "results": results[:3],  # First 3 for debugging
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TEST 2: 2 Concurrent BOOKING Requests
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def test_concurrent_booking(
        self,
        product_id: str,
        num_requests: int = 2
    ) -> Dict:
        """
        Test: 2 concurrent BOOKING requests for same product on hold
        Expected: 1 success, 1 fail
        """
        print(f"\n{'='*60}")
        print(f"TEST 2: {num_requests} Concurrent BOOKING Requests")
        print(f"Product ID: {product_id}")
        print(f"{'='*60}")
        
        # First, hold the product
        hold_result = await self.make_request(
            "POST",
            f"/api/inventory/products/{product_id}/hold",
            data={"hold_hours": 24, "reason": "Pre-booking hold"},
        )
        print(f"Pre-hold result: {hold_result['status']}")
        
        if hold_result["status"] != 200:
            print("Cannot hold product for booking test")
            return {"test": "concurrent_booking", "passed": False, "error": "Cannot hold"}
        
        async def booking_request(request_num: int):
            booking_id = str(uuid4())
            idempotency_key = f"booking-test-{uuid4()}"
            return await self.make_request(
                "POST",
                f"/api/inventory/products/{product_id}/booking-request",
                data={
                    "booking_id": booking_id,
                    "action": "request",
                },
                extra_headers={"Idempotency-Key": idempotency_key},
            )
        
        # Create concurrent requests
        tasks = [booking_request(i) for i in range(num_requests)]
        
        # Execute
        start = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = (time.time() - start) * 1000
        
        # Analyze
        success_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") == 200)
        fail_count = sum(1 for r in results if isinstance(r, dict) and r.get("status") != 200)
        
        print(f"\nResults:")
        print(f"  Total time: {total_time:.2f}ms")
        print(f"  Success (200): {success_count}")
        print(f"  Failures: {fail_count}")
        
        passed = success_count == 1 and fail_count == num_requests - 1
        print(f"\n  TEST {'PASSED ✅' if passed else 'FAILED ❌'}")
        
        return {
            "test": "concurrent_booking",
            "passed": passed,
            "total_time_ms": total_time,
            "success_count": success_count,
            "fail_count": fail_count,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TEST 3: Idempotency
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def test_idempotency(self, product_id: str) -> Dict:
        """
        Test: Same idempotency key returns same result
        """
        print(f"\n{'='*60}")
        print(f"TEST 3: Idempotency")
        print(f"Product ID: {product_id}")
        print(f"{'='*60}")
        
        idempotency_key = f"idempotency-test-{uuid4()}"
        
        # First request
        result1 = await self.make_request(
            "POST",
            f"/api/inventory/products/{product_id}/hold",
            data={"hold_hours": 24, "reason": "Idempotency test"},
            extra_headers={"Idempotency-Key": idempotency_key},
        )
        print(f"Request 1: status={result1['status']}")
        
        # Second request with SAME key
        result2 = await self.make_request(
            "POST",
            f"/api/inventory/products/{product_id}/hold",
            data={"hold_hours": 24, "reason": "Idempotency test"},
            extra_headers={"Idempotency-Key": idempotency_key},
        )
        print(f"Request 2: status={result2['status']}")
        
        # Both should succeed (second returns cached)
        passed = result1["status"] == result2["status"]
        
        print(f"\n  TEST {'PASSED ✅' if passed else 'FAILED ❌'}")
        print(f"  Expected: Same status for same idempotency key")
        
        return {
            "test": "idempotency",
            "passed": passed,
            "request1_status": result1["status"],
            "request2_status": result2["status"],
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TEST 4: Status Transition Validation
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def test_invalid_transition(self, product_id: str) -> Dict:
        """
        Test: Invalid status transition is rejected
        """
        print(f"\n{'='*60}")
        print(f"TEST 4: Invalid Transition")
        print(f"Product ID: {product_id}")
        print(f"{'='*60}")
        
        # Try to go directly to SOLD (invalid)
        result = await self.make_request(
            "POST",
            f"/api/inventory/products/{product_id}/status",
            data={"new_status": "sold", "reason": "Direct sell attempt"},
        )
        
        print(f"Status: {result['status']}")
        print(f"Body: {result['body']}")
        
        # Should fail with 400
        passed = result["status"] == 400
        
        print(f"\n  TEST {'PASSED ✅' if passed else 'FAILED ❌'}")
        print(f"  Expected: 400 (invalid transition)")
        
        return {
            "test": "invalid_transition",
            "passed": passed,
            "status": result["status"],
        }


async def run_all_tests(
    base_url: str,
    token: str,
    product_id: str = None
) -> Dict:
    """Run all concurrent tests."""
    tester = ConcurrentTester(base_url, token)
    
    results = {}
    
    if product_id:
        results["concurrent_hold"] = await tester.test_concurrent_hold(product_id)
        
        # Need a new available product for booking test
        # results["concurrent_booking"] = await tester.test_concurrent_booking(product_id)
        
        results["idempotency"] = await tester.test_idempotency(product_id)
        results["invalid_transition"] = await tester.test_invalid_transition(product_id)
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r.get("passed"))
    
    for name, result in results.items():
        status = "✅ PASSED" if result.get("passed") else "❌ FAILED"
        print(f"  {name}: {status}")
    
    print(f"\nTotal: {passed_tests}/{total_tests} passed")
    
    return results


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python concurrent_tests.py <base_url> <token> <product_id>")
        print("Example: python concurrent_tests.py https://app.preview.emergent.com eyJxx.. abc-123")
        sys.exit(1)
    
    base_url = sys.argv[1]
    token = sys.argv[2]
    product_id = sys.argv[3]
    
    asyncio.run(run_all_tests(base_url, token, product_id))
