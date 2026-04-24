#!/bin/bash
# =====================================================
# load-test.sh — F7: Production Load Testing
# Simulates concurrent users trước khi go-live
# Requires: curl (built-in macOS/Linux)
# =====================================================

set -e
API="https://api.prohouzing.com"
FRONTEND="https://prohouzing.com"
CONCURRENT=10
REQUESTS_PER_ENDPOINT=20
PASS=0
FAIL=0
WARN=0
TOTAL_TIME=0

echo ""
echo "🔬 ProHouzing Load Test"
echo "========================"
echo "API: $API"
echo "Concurrent: $CONCURRENT | Requests/endpoint: $REQUESTS_PER_ENDPOINT"
echo ""

# ─── Helper ──────────────────────────────────────────────────────────────────
test_endpoint() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="${4:-}"
  local expected="${5:-200}"

  START=$(date +%s%3N)
  if [ -n "$body" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X "$method" \
      -H "Content-Type: application/json" -d "$body" "$url" || echo "000")
  else
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  fi
  END=$(date +%s%3N)
  ELAPSED=$((END - START))
  TOTAL_TIME=$((TOTAL_TIME + ELAPSED))

  if [ "$STATUS" = "$expected" ] || [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    echo "  ✅ $label → HTTP $STATUS (${ELAPSED}ms)"
    ((PASS++)) || true
    [ $ELAPSED -gt 3000 ] && echo "     ⚠️  Slow response: ${ELAPSED}ms" && ((WARN++)) || true
  elif [ "$STATUS" = "000" ]; then
    echo "  ❌ $label → TIMEOUT/CONNECTION REFUSED"
    ((FAIL++)) || true
  else
    echo "  ⚠️  $label → HTTP $STATUS (${ELAPSED}ms)"
    ((WARN++)) || true
  fi
}

test_concurrent() {
  local label="$1"
  local url="$2"
  local n="${3:-$REQUESTS_PER_ENDPOINT}"

  echo ""
  echo "  📊 Concurrent: $label ($n requests)"
  START=$(date +%s%3N)
  PIDS=()
  FAILS_C=0

  for i in $(seq 1 $n); do
    (curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" || echo "999") &
    PIDS+=($!)
    # Batch in groups of CONCURRENT
    if [ $((i % CONCURRENT)) -eq 0 ]; then
      for p in "${PIDS[@]}"; do wait $p 2>/dev/null || FAILS_C=$((FAILS_C+1)); done
      PIDS=()
    fi
  done
  for p in "${PIDS[@]}"; do wait $p 2>/dev/null || true; done

  END=$(date +%s%3N)
  ELAPSED=$((END - START))
  RPS=$(echo "scale=1; $n * 1000 / $ELAPSED" | bc 2>/dev/null || echo "N/A")
  echo "     Done: ${n} req in ${ELAPSED}ms (~${RPS} req/s)"
  [ $FAILS_C -eq 0 ] && echo "     ✅ All succeeded" && ((PASS++)) || true
  [ $FAILS_C -gt 0 ] && echo "     ⚠️  $FAILS_C timeouts" && ((WARN++)) || true
}

# ─── Baseline checks ──────────────────────────────────────────────────────────
echo "── 1. Health Endpoints ──────────────────────────────────────"
test_endpoint "GET /health"             "$API/health"
test_endpoint "GET /ping"               "$API/ping"
test_endpoint "GET /version"            "$API/version"
test_endpoint "Frontend (HTML)"         "$FRONTEND"

echo ""
echo "── 2. AI Endpoints ──────────────────────────────────────────"
VALUATION_BODY='{"project":"Vinhomes Central Park","area":65,"floor":15,"direction":"Đông Nam","bedrooms":2,"condition":"good","age_years":3}'
test_endpoint "POST /ai/valuation/estimate" "$API/api/ai/valuation/estimate" POST "$VALUATION_BODY"

LEAD_BODY='{"budget_billion":3.5,"product_price_billion":3.8,"timeline_months":2,"contact_count":3,"site_visit":true,"source":"referral"}'
test_endpoint "POST /ai/lead-score"         "$API/api/ai/lead-score" POST "$LEAD_BODY"

CHAT_BODY='{"message":"Hoa hồng tính như thế nào?"}'
test_endpoint "POST /ai/chat/message"        "$API/api/ai/chat/message" POST "$CHAT_BODY"

test_endpoint "GET /ai/dashboard"            "$API/api/ai/dashboard"

echo ""
echo "── 3. API Endpoints ─────────────────────────────────────────"
test_endpoint "GET /secondary/dashboard"   "$API/api/secondary/dashboard"
test_endpoint "GET /leasing/dashboard"     "$API/api/leasing/dashboard"
test_endpoint "GET /ai/content/templates"  "$API/api/ai/content/templates"

echo ""
echo "── 4. Concurrent Load Test ─────────────────────────────────"
test_concurrent "GET /health x$REQUESTS_PER_ENDPOINT"      "$API/health"         $REQUESTS_PER_ENDPOINT
test_concurrent "GET /ai/dashboard x$REQUESTS_PER_ENDPOINT" "$API/api/ai/dashboard" $((REQUESTS_PER_ENDPOINT / 2))

# ─── Rate limit test ──────────────────────────────────────────────────────────
echo ""
echo "── 5. Rate Limit Check ─────────────────────────────────────"
echo "  Sending 25 rapid requests to /api/ai/valuation..."
RATE_429=0
for i in $(seq 1 25); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
    -X POST -H "Content-Type: application/json" \
    -d "$VALUATION_BODY" "$API/api/ai/valuation/estimate" || echo "000")
  [ "$STATUS" = "429" ] && RATE_429=$((RATE_429+1))
done
if [ $RATE_429 -gt 0 ]; then
  echo "  ✅ Rate limiting active ($RATE_429 requests throttled)"
  ((PASS++)) || true
else
  echo "  ⚠️  No rate limit hit (may be disabled or counter reset)"
  ((WARN++)) || true
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  PASSED: $PASS | FAILED: $FAIL | WARNINGS: $WARN"
echo "  Total time: ${TOTAL_TIME}ms"
echo ""
[ $FAIL -gt 0 ] && echo "  ❌ SYSTEM NOT READY — Fix $FAIL failures before go-live" && exit 1
[ $WARN -gt 3 ] && echo "  ⚠️  Multiple warnings — review before peak traffic" || echo "  ✅ System ready for production traffic!"
echo ""
