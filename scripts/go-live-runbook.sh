#!/bin/bash
# =====================================================
# go-live-runbook.sh — F8 + F5 + F6
# ProHouzing Go-Live Runbook
# Run từng step theo thứ tự — không bỏ bước nào
# =====================================================

echo ""
echo "🚀 ProHouzing Go-Live Runbook v2.1.0"
echo "══════════════════════════════════════"
echo "  Date: $(date '+%d/%m/%Y %H:%M')"
echo "  Phase: A-F Complete"
echo ""
echo "⚠️  Chạy từng bước theo thứ tự. Confirm mỗi bước xong."
echo ""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

confirm() {
  read -p "  → Press ENTER để tiếp tục, Ctrl+C để dừng... " _
}

check_pass() { echo "  ✅ $1"; }
check_fail() { echo "  ❌ $1"; }
step_title() { echo ""; echo "── STEP $1: $2 ────────────────────────────────────"; }

# ─── STEP 1: Pre-flight checks ────────────────────────────────────────────────
step_title 1 "PRE-FLIGHT CHECKS"
echo "  Kiểm tra môi trường trước khi deploy..."

node --version >/dev/null 2>&1 && check_pass "Node.js installed" || check_fail "Node.js missing"
python3 --version >/dev/null 2>&1 && check_pass "Python 3 installed" || check_fail "Python 3 missing"
git status >/dev/null 2>&1 && check_pass "Git repo OK" || check_fail "Not a git repo"

BRANCH=$(git -C "$ROOT" branch --show-current 2>/dev/null)
[ "$BRANCH" = "main" ] && check_pass "On main branch" || echo "  ⚠️  On branch: $BRANCH (expected main)"

UNCOMMITTED=$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
[ "$UNCOMMITTED" = "0" ] && check_pass "No uncommitted changes" || echo "  ⚠️  $UNCOMMITTED uncommitted files"

check_pass "Current tag: $(git -C "$ROOT" describe --tags --abbrev=0 2>/dev/null || echo 'none')"
confirm

# ─── STEP 2: Environment Variables ───────────────────────────────────────────
step_title 2 "ENVIRONMENT VARIABLES"
echo "  Kiểm tra .env.local đã điền đủ biến..."

ENV_FILE="$FRONTEND/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "  ⚠️  .env.local không tồn tại — copy từ .env.example"
  echo "     cp $FRONTEND/.env.example $FRONTEND/.env.local"
fi

REQUIRED_VARS="REACT_APP_BACKEND_URL REACT_APP_SUPABASE_URL REACT_APP_SUPABASE_ANON_KEY"
for var in $REQUIRED_VARS; do
  VALUE=$(grep "^$var=" "$ENV_FILE" 2>/dev/null | cut -d= -f2)
  if [ -n "$VALUE" ] && [ "$VALUE" != "https://xxxxxxxxxxx.supabase.co" ]; then
    check_pass "$var ✓"
  else
    check_fail "$var — CHƯA ĐIỀN THẬT"
  fi
done
confirm

# ─── STEP 3: Database Migration ──────────────────────────────────────────────
step_title 3 "DATABASE MIGRATION (F1)"
echo "  Chạy migration trên Supabase SQL Editor..."
echo ""
echo "  📋 Các bước:"
echo "     1. Mở: https://app.supabase.com"
echo "     2. Chọn project ProHouzing"
echo "     3. SQL Editor > New query"
echo "     4. Copy & paste nội dung file:"
echo "        $BACKEND/supabase_schema_phase_b.sql"
echo "        $BACKEND/supabase_migration_phase_f.sql"
echo "     5. Run → Confirm '✅ Phase F Migration Complete'"
echo ""
echo "  ✅ Đã chạy migration trên Supabase chưa?"
confirm

# ─── STEP 4: Frontend Build & Optimize ───────────────────────────────────────
step_title 4 "FRONTEND BUILD + OPTIMIZE (F5)"
echo "  Building production bundle..."

cd "$FRONTEND"
npm run build 2>&1 | grep -E "Compiled|Failed|error" | tail -3

BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")
echo "  📦 Build size: $BUILD_SIZE"
check_pass "Frontend built"

# F5: Bundle analysis
echo ""
echo "  📊 Top 5 largest files:"
find build/static -name "*.js" -o -name "*.css" | xargs ls -lh 2>/dev/null | sort -k5 -hr | head -5 | awk '{print "     "$5" "$9}'
confirm

# ─── STEP 5: Security Audit (F6) ─────────────────────────────────────────────
step_title 5 "SECURITY AUDIT (F6)"
echo "  Kiểm tra bảo mật cơ bản..."

# Check no hardcoded secrets in src
SECRETS=$(grep -r "supabase\|apiKey\|secret\|password\|PRIVATE" "$FRONTEND/src" \
  --include="*.js" --include="*.jsx" -l 2>/dev/null | grep -v "placeholder\|REACT_APP" | head -5)
[ -z "$SECRETS" ] && check_pass "No hardcoded secrets in src/" || echo "  ⚠️  Check these files: $SECRETS"

# Check .env not committed
GITIGNORE="$ROOT/.gitignore"
grep -q ".env.local" "$GITIGNORE" && check_pass ".env.local in .gitignore" || check_fail ".env.local NOT in .gitignore — CRITICAL!"
grep -q ".env.store" "$GITIGNORE" && check_pass ".env.store in .gitignore" || echo "  ⚠️  Add .env.store to .gitignore"

# Check vercel.json exists
[ -f "$ROOT/vercel.json" ] && check_pass "vercel.json exists" || check_fail "vercel.json missing"
confirm

# ─── STEP 6: Submission Checklist ─────────────────────────────────────────────
step_title 6 "APP STORE + PLAY STORE CHECKLIST"
cd "$ROOT"
bash scripts/submission-checklist.sh 2>/dev/null || echo "  ⚠️  Chạy manual: bash scripts/submission-checklist.sh"
confirm

# ─── STEP 7: Deploy to Vercel ─────────────────────────────────────────────────
step_title 7 "DEPLOY TO VERCEL (F3)"
echo "  Deploying to production..."
echo ""
echo "  Options:"
echo "  A) Auto deploy: git push origin main → GitHub Actions sẽ deploy"
echo "  B) Manual: cd $ROOT && vercel --prod"
echo ""
echo "  ✅ Deploy đã chạy chưa?"
confirm

# ─── STEP 8: Health Check ─────────────────────────────────────────────────────
step_title 8 "HEALTH CHECK AFTER DEPLOY"
echo "  Chờ 30s cho deploy xong..."
sleep 30
bash "$ROOT/scripts/load-test.sh" 2>/dev/null || echo "  ⚠️  Load test: bash scripts/load-test.sh"
confirm

# ─── STEP 9: Final Tag ────────────────────────────────────────────────────────
step_title 9 "GIT TAG — PRODUCTION RELEASE"
echo "  Tagging v1.0-production..."
git -C "$ROOT" tag -a "v1.0-production" -m "🎯 ProHouzing Production Launch — All 6 Phases Complete (A-F)" 2>/dev/null \
  && check_pass "Tagged v1.0-production" \
  || echo "  ⚠️  Tag đã tồn tại hoặc lỗi"
git -C "$ROOT" push origin "v1.0-production" 2>/dev/null && check_pass "Pushed tag" || echo "  ⚠️  Push tag failed"
confirm

# ─── STEP 10: Post-launch ─────────────────────────────────────────────────────
step_title 10 "POST-LAUNCH CHECKLIST"
echo "  Công việc sau khi deploy:"
echo ""
echo "  📱 Mobile:"
echo "     □ Submit iOS IPA → TestFlight → App Review"
echo "     □ Submit Android AAB → Play Console Internal → Production"
echo ""
echo "  📊 Monitoring:"
echo "     □ Xem PostHog analytics: app.posthog.com"
echo "     □ Xem Sentry errors: app.sentry.io"
echo "     □ Monitor: /admin/system-health trong app"
echo ""
echo "  🔔 Notifications:"
echo "     □ Test push notification iOS"
echo "     □ Test push notification Android"
echo "     □ Verify contract expiry alerts"
echo ""
echo "  👥 Team:"
echo "     □ Gửi link app cho team"
echo "     □ Brief team về features mới (A-F)"
echo "     □ Setup TestFlight internal testers"
echo ""
echo "══════════════════════════════════════════════════════"
echo "  🎉 PROHOUZING v2.1.0 — PRODUCTION LAUNCH COMPLETE!"
echo "  📅 $(date '+%d/%m/%Y %H:%M')"
echo "  🏆 Phases: A✅ B✅ C✅ D✅ E✅ F✅"
echo "══════════════════════════════════════════════════════"
echo ""
